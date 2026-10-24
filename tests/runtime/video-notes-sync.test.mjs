import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const contract = require('../../js/shared/saved_video_notes.js');
const repository = require('../../js/video_notes_store.js');
const key = { profileId: 'Profile-A', videoId: 'abcdefghijk' };
const scope = { grantId: 'grant-a' };
const envelope = entries => ({ format: contract.FORMAT, version: 1, entries });
const clone = value => structuredClone(value);
function fixture() {
    const data = {}, writes = [];
    let allowed = true, hook = null, authorizeHook = null, checks = 0, failWrite = false;
    const store = repository.create({
        get: async keys => { const result = Object.fromEntries(keys.filter(id => id in data).map(id => [id, clone(data[id])])); await hook?.('get'); return result; },
        set: async values => { if (failWrite) throw Error('quota'); writes.push(clone(values)); Object.assign(data, clone(values)); await hook?.('set'); },
        randomId: () => 'writer-local', authorize: async (requested, token) => token === 'editor' && requested.profileId === key.profileId,
        authorizeSync: async (profileId, token) => {
            checks++; await authorizeHook?.(checks);
            return allowed && profileId === key.profileId && token?.grantId === scope.grantId;
        }
    });
    return { data, writes, store, deny: () => { allowed = false; }, onStorage(fn) { hook = fn; },
        onAuthorize(fn) { authorizeHook = fn; }, fail: () => { failWrite = true; } };
}
test('sync reads only the approved profile envelope without drafts or writer identity', async () => {
    const f = fixture();
    const own = contract.edit(key, null, 'writer-a', 'Private own note');
    const sibling = contract.edit({ ...key, profileId: 'Sibling' }, null, 'writer-b', 'Never return sibling');
    f.data[repository.DATA_KEY] = contract.encode([own, sibling], [key.profileId, 'Sibling']);
    f.data[repository.WRITER_KEY] = 'writer-never-export';
    const result = await f.store.syncRead(key.profileId, scope);
    assert.deepEqual(result, envelope([own]));
    assert.equal(JSON.stringify(result).includes('writer-never-export'), false);
    assert.deepEqual(f.writes, []);
});
test('sync access requires independent authority, exact profile and grant scope', async () => {
    const f = fixture();
    for (const [profileId, token] of [['profile-a', scope], [key.profileId, 'editor'],
        [key.profileId, { grantId: 'other' }], ['Sibling', scope]]) {
        await assert.rejects(f.store.syncRead(profileId, token), /access_changed/);
        await assert.rejects(f.store.syncMerge(profileId, envelope([]), token), /access_changed/);
    }
    f.deny(); await assert.rejects(f.store.syncRead(key.profileId, scope), /access_changed/);
    assert.deepEqual(f.writes, []);
});
test('sync is disabled by default when no dedicated authorizer is installed', async () => {
    const store = repository.create({ get: async () => ({}), set: async () => {}, randomId: () => 'writer', authorize: async () => true });
    await assert.rejects(store.syncRead(key.profileId, scope), /access_changed/);
    await assert.rejects(store.syncMerge(key.profileId, envelope([]), scope), /access_changed/);
});
test('authority revoked during a storage read cannot disclose notes or commit a merge', async () => {
    for (const operation of ['read', 'merge']) {
        const f = fixture();
        const note = contract.edit(key, null, 'writer-a', 'Keep');
        const raw = contract.encode([note], [key.profileId]); f.data[repository.DATA_KEY] = raw;
        f.onStorage(kind => { if (kind === 'get') f.deny(); });
        await assert.rejects(operation === 'read' ? f.store.syncRead(key.profileId, scope)
            : f.store.syncMerge(key.profileId, envelope([contract.edit(key, note, 'remote', 'Changed')]), scope), /access_changed/);
        assert.equal(f.data[repository.DATA_KEY], raw); assert.deepEqual(f.writes, []);
    }
});
test('fresh revocation immediately before commit denies a pending merge without writes', async () => {
    const f = fixture(); f.onAuthorize(count => { if (count === 3) f.deny(); });
    await assert.rejects(f.store.syncMerge(key.profileId, envelope([contract.edit(key, null, 'remote', 'Denied')]), scope), /access_changed/);
    assert.deepEqual(f.writes, []);
});
test('revocation after a permitted write never returns note text to the revoked caller', async () => {
    const f = fixture(); f.onStorage(kind => { if (kind === 'set') f.deny(); });
    await assert.rejects(f.store.syncMerge(key.profileId, envelope([contract.edit(key, null, 'remote', 'Private')]), scope), /access_changed/);
    assert.equal(contract.decode(f.data[repository.DATA_KEY], [key.profileId])[0].versions[0].text, 'Private');
});
test('editor save and sync merge share one serial queue and retain concurrent heads', async () => {
    const f = fixture();
    const base = (await f.store.save(key, null, 'Original', 'editor')).record;
    const remote = contract.edit(key, base, 'writer-remote', 'Remote edit');
    const [saved, synced] = await Promise.all([
        f.store.save(key, base, 'Local edit', 'editor'), f.store.syncMerge(key.profileId, envelope([remote]), scope)
    ]);
    assert.equal(saved.saved, true); assert.equal(synced.entries[0].versions.length, 2);
    assert.deepEqual(new Set(synced.entries[0].versions.map(version => version.text)), new Set(['Local edit', 'Remote edit']));
    assert.deepEqual(await f.store.read(key, 'editor'), synced.entries[0]);
});
test('an editor with a stale base receives conflict after an incoming update wins the queue', async () => {
    const f = fixture();
    const base = (await f.store.save(key, null, 'Original', 'editor')).record;
    const remote = contract.edit(key, base, 'writer-remote', 'Remote edit');
    const [synced, saved] = await Promise.all([
        f.store.syncMerge(key.profileId, envelope([remote]), scope), f.store.save(key, base, 'Stale overwrite', 'editor')
    ]);
    assert.equal(saved.saved, false); assert.equal(saved.conflict, true);
    assert.deepEqual(saved.record, synced.entries[0]);
});
test('deletion tombstones defeat stale replay while sibling records remain byte-equivalent', async () => {
    const f = fixture();
    const base = contract.edit(key, null, 'writer-a', 'Old');
    const deleted = contract.edit(key, base, 'writer-a', null);
    const sibling = contract.edit({ ...key, profileId: 'Sibling' }, null, 'writer-sibling', 'Keep sibling');
    f.data[repository.DATA_KEY] = contract.encode([base, sibling], [key.profileId, 'Sibling']);
    const result = await f.store.syncMerge(key.profileId, envelope([deleted]), scope);
    assert.equal(result.entries[0].versions[0].text, null);
    const writes = f.writes.length;
    assert.deepEqual(await f.store.syncMerge(key.profileId, envelope([base]), scope), result);
    assert.equal(f.writes.length, writes);
    const all = contract.decode(f.data[repository.DATA_KEY], [key.profileId, 'Sibling']);
    assert.deepEqual(all.find(row => row.profileId === 'Sibling'), sibling);
    assert.equal(f.data[repository.WRITER_KEY], undefined);
});
test('foreign profiles, malformed envelopes and same-clock conflicts reject before mutation', async () => {
    const f = fixture(); const base = contract.edit(key, null, 'writer-a', 'Original');
    const raw = contract.encode([base], [key.profileId]); f.data[repository.DATA_KEY] = raw;
    for (const incoming of [envelope([{ ...base, profileId: 'Sibling' }]), { ...envelope([base]), writer: 'never' },
        envelope([contract.edit(key, null, 'writer-a', 'Same revision changed')])]) {
        await assert.rejects(f.store.syncMerge(key.profileId, incoming, scope));
        assert.equal(f.data[repository.DATA_KEY], raw);
    }
    assert.deepEqual(f.writes, []);
});
test('failed merge persistence preserves existing data and does not create a writer key', async () => {
    const f = fixture(); const base = contract.edit(key, null, 'writer-a', 'Original');
    f.data[repository.DATA_KEY] = contract.encode([base], [key.profileId]); const raw = f.data[repository.DATA_KEY]; f.fail();
    await assert.rejects(f.store.syncMerge(key.profileId, envelope([contract.edit(key, base, 'remote', 'Changed')]), scope));
    assert.equal(f.data[repository.DATA_KEY], raw); assert.equal(f.data[repository.WRITER_KEY], undefined);
});
function backgroundFixture() {
    const events = {}, data = {}; let allowed = true, checks = 0;
    const base = 'chrome-extension://filtertube/';
    const api = {
        runtime: { id: 'test', getURL: path => base + path, onMessage: { addListener: fn => { events.message = fn; } } },
        tabs: { onRemoved: { addListener() {} } },
        storage: { local: { get: (keys, callback) => callback(Object.fromEntries(keys.filter(id => id in data).map(id => [id, clone(data[id])]))),
            set: (values, callback) => { Object.assign(data, clone(values)); callback(); } }, onChanged: { addListener() {} } }
    };
    const root = { FilterTubeSavedVideoNotes: contract };
    vm.runInNewContext(fs.readFileSync('js/video_notes_background.js', 'utf8'), { globalThis: root, URL, setTimeout, clearTimeout });
    const installed = root.FilterTubeVideoNotesBackground.install({ api, getSettings: async () => { throw Error('not an editor'); },
        profileAuthorized: async () => false, storeFactory: options => repository.create(options),
        syncAuthorize: async (profileId, grantScope) => {
            checks++; return allowed && profileId === key.profileId && grantScope.grantId === scope.grantId;
        } });
    const dashboard = { id: 'test', frameId: 0, tab: { id: 42 }, url: base + 'html/tab-view.html#account' };
    const request = { action: 'FilterTube_PersonalNotesRead', profileId: key.profileId, grantId: scope.grantId };
    return { installed, dashboard, request, base, events, data, checks: () => checks, deny: () => { allowed = false; } };
}
test('only the exact top-frame extension dashboard can request a personal sync envelope', async () => {
    const f = backgroundFixture();
    assert.deepEqual(clone(await f.installed.handle(f.request, f.dashboard)), { ok: true, envelope: envelope([]) });
    for (const sender of [{ ...f.dashboard, frameId: 1 }, { ...f.dashboard, url: 'https://www.youtube.com/watch?v=' + key.videoId },
        { ...f.dashboard, url: f.base + 'html/video-notes.html' }, { ...f.dashboard, url: f.base + 'html/popup.html' },
        { ...f.dashboard, url: f.base + 'html/tab-view.html?pretend=true' },
        { ...f.dashboard, url: 'chrome-extension://other/html/tab-view.html' },
        { tab: { id: 42 }, url: f.dashboard.url }]) {
        await assert.rejects(f.installed.handle(f.request, sender), /access_changed/);
    }
});
test('dashboard entry checks do not replace current grant authority or expose sibling notes', async () => {
    const f = backgroundFixture();
    const ownNote = contract.edit(key, null, 'writer-a', 'Own');
    const sibling = contract.edit({ ...key, profileId: 'Sibling' }, null, 'writer-b', 'Sibling');
    f.data[repository.DATA_KEY] = contract.encode([ownNote, sibling], [key.profileId, 'Sibling']);
    f.data[repository.WRITER_KEY] = 'never-export';
    assert.deepEqual(clone(await f.installed.handle(f.request, f.dashboard)), { ok: true, envelope: envelope([ownNote]) });
    await assert.rejects(f.installed.handle({ ...f.request, grantId: 'other' }, f.dashboard), /access_changed/);
    await assert.rejects(f.installed.handle({ ...f.request, profileId: 'Sibling' }, f.dashboard), /access_changed/);
    f.deny(); await assert.rejects(f.installed.handle(f.request, f.dashboard), /access_changed/);
});
test('runtime listener handles sync actions with a redacted denial and rejects a forged webpage sender', async () => {
    const f = backgroundFixture(); let response;
    assert.equal(f.events.message(f.request, { ...f.dashboard, url: 'https://www.youtube.com/' }, value => { response = value; }), true);
    for (let i = 0; i < 30 && !response; i++) await Promise.resolve();
    assert.deepEqual(clone(response), { ok: false, error: 'access_changed' }); assert.equal(f.checks(), 0);
});
test('dashboard merge uses the shared repository and returns canonical notes only', async () => {
    const f = backgroundFixture();
    const note = contract.edit(key, null, 'writer-remote', 'Received');
    const response = await f.installed.handle({ ...f.request, action: 'FilterTube_PersonalNotesMerge', envelope: envelope([note]) }, f.dashboard);
    assert.deepEqual(clone(response), { ok: true, envelope: envelope([note]) });
    assert.equal(f.data[repository.WRITER_KEY], undefined);
    assert.deepEqual(clone(await f.installed.handle(f.request, f.dashboard)), clone(response));
});
