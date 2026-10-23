import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const notes = require('../../js/shared/saved_video_notes.js');
const repository = require('../../js/video_notes_store.js');
const key = { profileId: 'Parent-A', videoId: 'aBcDEf012_-'};
function fixture() {
    const data = {}, messages = [], events = {};
    let permitted = true, pin = true, serial = 0, at = 10000;
    const tab = { id: 2, url: 'https://www.youtube.com/watch?v=' + key.videoId };
    const settings = { activeProfileId: key.profileId, profileType: 'main' };
    const base = 'chrome-extension://filtertube/';
    const api = { runtime: { getURL: path => base + path, onMessage: { addListener: fn => { events.runtime = fn; } } },
        tabs: { get: (_id, cb) => cb({ ...tab }),
            sendMessage(_id, message, options, cb) {
                assert.deepEqual(JSON.parse(JSON.stringify(options)), { frameId: 0 });
                messages.push(structuredClone(message));
                cb({ allowed: permitted, ...key, ok: permitted });
            }, onRemoved: { addListener: fn => { events.removed = fn; } } },
        storage: { local: {
            get: (keys, cb) => cb(Object.fromEntries(keys.filter(k => k in data).map(k => [k, structuredClone(data[k])]))),
            set: (values, cb) => { Object.assign(data, structuredClone(values)); cb(); }
        }, onChanged: { addListener: fn => { events.storage = fn; } } } };
    const root = { FilterTubeSavedVideoNotes: notes };
    vm.runInNewContext(fs.readFileSync('js/video_notes_background.js', 'utf8'), { globalThis: root, URL, setTimeout, clearTimeout });
    const service = root.FilterTubeVideoNotesBackground.install({ api, getSettings: async () => settings,
        profileAuthorized: async () => pin, storeFactory: options => repository.create(options), now: () => at,
        randomId: () => 'nonce-' + (++serial) });
    const parent = { tab, url: tab.url, frameId: 0 };
    const editor = { tab, url: base + 'html/video-notes.html', frameId: 1, documentId: 'editor-a' };
    const grant = () => service.handle({ action: 'FilterTube_NotesGrant', ...key, instance: 'a'.repeat(36) }, parent);
    const send = (name, token, extra = {}, sender = editor) => service.handle({ action: 'FilterTube_Notes' + name, token, ...extra }, sender);
    return { data, messages, events, tab, settings, parent, editor, grant, send,
        deny: () => { permitted = false; }, lock: () => { pin = false; }, expire: () => { at += 4001; } };
}
test('only an admitted top-frame content scope can issue an editor capability', async () => {
    const f = fixture(); const { token } = await f.grant(); assert.ok(token);
    assert.equal((await f.send('Read', token)).record, null);
    f.deny(); await assert.rejects(f.grant());
    assert.equal(f.messages.every(message => !('text' in message) && !('base' in message)), true);
});
test('page callers, other tabs, other editor documents and arbitrary profile requests cannot read or save', async () => {
    const f = fixture(); const { token } = await f.grant(); await f.send('Read', token);
    for (const sender of [f.parent, { ...f.editor, url: 'https://www.youtube.com/' },
        { ...f.editor, tab: { ...f.tab, id: 9 } }, { ...f.editor, documentId: 'other-document' }]) {
        await assert.rejects(f.send('Save', token, { base: null, text: 'Do not save', sequence: 1 }, sender));
    }
    assert.equal(f.data[repository.DATA_KEY], undefined);
    f.settings.activeProfileId = 'Child'; await assert.rejects(f.send('Read', token));
});
for (const revocation of ['filter', 'pin', 'navigation', 'profile', 'expiry']) {
    test(`${revocation} revocation blocks personal reads, saves and timestamp actions`, async () => {
        const f = fixture(); const { token } = await f.grant();
        const saved = await f.send('Save', token, { base: null, text: 'Private', sequence: 1 });
        if (revocation === 'filter') f.deny();
        if (revocation === 'pin') f.lock();
        if (revocation === 'navigation') f.tab.url = 'https://www.youtube.com/watch?v=12345678901';
        if (revocation === 'profile') f.settings.activeProfileId = 'Child';
        if (revocation === 'expiry') f.expire();
        await assert.rejects(f.send('Read', token));
        await assert.rejects(f.send('Save', token, { base: saved.record, text: 'Denied', sequence: 2 }));
        await assert.rejects(f.send('Seek', token, { seconds: 90 }));
        assert.equal(notes.decode(f.data[repository.DATA_KEY], [key.profileId])[0].versions[0].text, 'Private');
    });
}
test('late draft messages cannot recreate a draft already saved, while a newer replacement survives', async () => {
    const f = fixture(); const { token } = await f.grant();
    await f.send('Draft', token, { base: null, text: 'Saved draft', sequence: 1 });
    const saved = await f.send('Save', token, { base: null, text: 'Saved draft', sequence: 1 });
    await f.send('Draft', token, { base: null, text: 'Late old draft', sequence: 1 });
    assert.equal((await f.send('Read', token)).draft, null);
    await f.send('Draft', token, { base: saved.record, text: 'New unsaved draft', sequence: 3 });
    await f.send('Save', token, { base: saved.record, text: 'Another saved value', sequence: 2 });
    assert.equal((await f.send('Read', token)).draft.text, 'New unsaved draft');
});
test('route capabilities can be replaced without losing the exact-key temporary draft', async () => {
    const f = fixture(); const first = await f.grant();
    await f.send('Draft', first.token, { base: null, text: 'Keep draft', sequence: 1 });
    const second = await f.grant(); await assert.rejects(f.send('Read', first.token));
    assert.equal((await f.send('Read', second.token)).draft.text, 'Keep draft');
    f.events.removed(2); await assert.rejects(f.send('Read', second.token));
});
test('profile storage changes revoke capabilities and removed profiles lose their transient drafts', async () => {
    const f = fixture(); const { token } = await f.grant();
    f.events.storage({ ftProfilesV4: { newValue: { profiles: {} } } }, 'local');
    await assert.rejects(f.send('Read', token));
});

test('locked profile errors are explicit and unrelated failures never disclose private error contents', async () => {
    const f = fixture(); f.lock(); let response;
    f.events.runtime({ action: 'FilterTube_NotesGrant', ...key, instance: 'a'.repeat(36) }, f.parent, value => { response = value; });
    for (let i = 0; i < 30; i++) await Promise.resolve();
    assert.deepEqual(structuredClone(response), { ok: false, error: 'profile_locked' });
});

test('an expired capability cannot be renewed back into existence', async () => {
    const f = fixture(); const { token } = await f.grant(); f.expire();
    await assert.rejects(f.send('Grant', token, { ...key, instance: 'a'.repeat(36) }, f.parent));
});
