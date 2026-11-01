import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

const require = createRequire(import.meta.url);
const lists = require('../../js/shared/local_playlists.js');
const notes = require('../../js/shared/saved_video_notes.js');
const sync = require('../../js/personal_sync.js');
const repository = require('../../js/local_playlists_store.js');
const clone = value => JSON.parse(JSON.stringify(value));
const envelope = playlists => ({ format: lists.FORMAT, version: 1, playlists });
const video = (videoId, addedAt, extra = {}) => ({ kind: 'video', videoId, title: 'Video ' + videoId, addedAt, ...extra });
const list = (id, extra = {}) => ({ profileId: 'default', surface: 'main', id, name: 'Road trip', nameUpdatedAt: 10,
    createdAt: 10, orderUpdatedAt: 10, items: [], ...extra });
const decode = playlists => lists.decode(envelope(playlists));
const wire = playlists => lists.envelope(playlists);
const merged = (a, b) => wire(lists.mergeAll(decode(a), decode(b)));

test('the documented v1 example round-trips byte for byte in canonical order', () => {
    const example = envelope([
        list('lp_3f2a9c0e8b7d4e1fa0b2c3d4e5f60718', { nameUpdatedAt: 1761955400000, createdAt: 1761955400000, orderUpdatedAt: 1761955900000, items: [
            { kind: 'musicTrack', videoId: 'kJQP7kiw5Fk', title: 'Song', channelName: 'Artist', addedAt: 1761955500000 },
            { kind: 'offlineFile', uri: 'content://media/external/audio/media/42', title: 'Voice memo', durationSeconds: 95, addedAt: 1761955600000 },
            { kind: 'short', videoId: 'abcdefghijk', title: 'A Short', addedAt: 1761955700000, removedAt: 1761955800000 }] }),
        { profileId: 'default', surface: 'main', id: 'watch_later', system: 'watchLater', name: 'Watch later', nameUpdatedAt: 0,
            createdAt: 1761955200000, orderUpdatedAt: 0, items: [{ kind: 'video', videoId: 'dQw4w9WgXcQ', title: 'Example video',
                channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw', channelName: 'Example channel', durationSeconds: 213,
                thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', addedAt: 1761955300000 }] }
    ]);
    const decoded = lists.decode(JSON.stringify(example));
    assert.deepEqual(decoded.map(playlist => playlist.id), ['watch_later', 'lp_3f2a9c0e8b7d4e1fa0b2c3d4e5f60718']);
    const encoded = lists.encode(decoded);
    assert.equal(lists.encode(lists.decode(encoded)), encoded);
    assert.deepEqual(JSON.parse(encoded).playlists[1], example.playlists[0]);
});

test('readers reject unknown fields, other formats and versions, duplicates and bad items', () => {
    const good = list('lp_a', { items: [video('aaaaaaaaaaa', 20)] });
    for (const bad of [
        { ...envelope([good]), extra: true },
        { ...envelope([good]), version: 2 },
        { ...envelope([good]), format: 'other' },
        envelope([{ ...good, colour: 'red' }]),
        envelope([{ ...good, items: [{ ...good.items[0], rating: 5 }] }]),
        envelope([good, clone(good)]),
        envelope([{ ...good, items: [video('aaaaaaaaaaa', 20), { ...video('aaaaaaaaaaa', 30), kind: 'short' }] }]),
        envelope([{ ...good, items: [video('short', 20)] }]),
        envelope([{ ...good, id: 'has space' }]),
        envelope([{ ...good, id: 'watch_later' }]),
        envelope([{ ...good, name: '   ' }]),
        envelope([{ ...good, surface: 'tv' }]),
        envelope([{ ...good, items: [{ kind: 'offlineFile', title: 'No uri', addedAt: 1 }] }]),
        envelope([{ ...good, items: [{ ...video('aaaaaaaaaaa', 20), addedAt: -1 }] }])
    ]) assert.throws(() => lists.decode(bad), /Invalid local playlists/);
    assert.throws(() => lists.decode(envelope([good]), ['other-profile']), /authorized scope/);
});

test('merging is commutative, associative and idempotent, and never duplicates an item', () => {
    const a = [list('lp_a', { items: [video('aaaaaaaaaaa', 20), video('bbbbbbbbbbb', 30)] })];
    const b = [list('lp_a', { name: 'Renamed', nameUpdatedAt: 40, items: [video('bbbbbbbbbbb', 35, { title: 'Newer title' }), video('ccccccccccc', 25)] }),
        list('lp_b', { createdAt: 5 })];
    const c = [list('lp_a', { orderUpdatedAt: 50, items: [video('ccccccccccc', 25), video('aaaaaaaaaaa', 20, { removedAt: 45 })] })];
    assert.deepEqual(merged(a, b), merged(b, a));
    const ab = lists.mergeAll(decode(a), decode(b));
    assert.deepEqual(wire(lists.mergeAll(ab, decode(c))), wire(lists.mergeAll(decode(a), lists.mergeAll(decode(b), decode(c)))));
    assert.deepEqual(wire(lists.mergeAll(ab, ab)), wire(ab));
    const road = lists.mergeAll(ab, decode(c)).find(playlist => playlist.id === 'lp_a');
    assert.equal(road.name, 'Renamed');
    assert.deepEqual(road.items.map(lists.itemKey), ['yt:ccccccccccc', 'yt:bbbbbbbbbbb', 'yt:aaaaaaaaaaa']);
    assert.equal(road.items.find(item => item.videoId === 'bbbbbbbbbbb').title, 'Newer title');
    assert.equal(lists.isPresent(road.items[2]), false, 'a removal is remembered as a tombstone');
});

test('an omitted list is not a deletion; deletion wins only over older edits; Watch later is never deleted', () => {
    const base = list('lp_a', { items: [video('aaaaaaaaaaa', 20)] });
    assert.equal(lists.mergeAll(decode([base]), []).length, 1);
    const deleted = { ...base, deletedAt: 30 };
    assert.equal(lists.isDeleted(lists.mergeAll(decode([base]), decode([deleted]))[0]), true);
    const readded = { ...base, items: [video('bbbbbbbbbbb', 40)] };
    assert.equal(lists.isDeleted(lists.mergeAll(decode([deleted]), decode([readded]))[0]), false);
    const watchLater = { ...list('watch_later'), system: 'watchLater', name: 'Watch later', nameUpdatedAt: 0, deletedAt: 99 };
    assert.equal(lists.isDeleted(decode([watchLater])[0]), false);
});

test('the newest reorder ranks only items it knew about; later adds follow by add time', () => {
    const reordered = list('lp_a', { orderUpdatedAt: 50, items: [video('bbbbbbbbbbb', 20), video('aaaaaaaaaaa', 10)] });
    const other = list('lp_a', { items: [video('aaaaaaaaaaa', 10), video('bbbbbbbbbbb', 20), video('ccccccccccc', 60), video('ddddddddddd', 55)] });
    const result = lists.mergeAll(decode([other]), decode([reordered]))[0];
    assert.deepEqual(result.items.map(item => item.videoId), ['bbbbbbbbbbb', 'aaaaaaaaaaa', 'ddddddddddd', 'ccccccccccc']);
});

test('equal-time metadata ties compare Android org.json text, where "/" is escaped', () => {
    // Plain JSON ranks "https:0" higher ("/" is 0x2F); Android's escaped "\\/" ranks the slash URL higher (0x5C).
    const slash = video('aaaaaaaaaaa', 20, { thumbnailUrl: 'https://a/b' });
    const plain = video('aaaaaaaaaaa', 20, { thumbnailUrl: 'https:0' });
    for (const [x, y] of [[slash, plain], [plain, slash]]) {
        const result = lists.mergeAll(decode([list('lp_a', { items: [x] })]), decode([list('lp_a', { items: [y] })]))[0];
        assert.equal(result.items[0].thumbnailUrl, 'https://a/b');
    }
});

test('backup profile mapping re-homes lists and drops unmapped profiles', () => {
    const incoming = decode([list('lp_a'), { ...list('lp_b'), profileId: 'child-1' }, { ...list('lp_c'), profileId: 'stranger' }]);
    const mapped = lists.mapProfiles(incoming, { default: 'default', 'child-1': 'local-child' });
    assert.deepEqual(mapped.map(playlist => [playlist.profileId, playlist.id]), [['default', 'lp_a'], ['local-child', 'lp_b']]);
});

const pairs = await Promise.all([0, 1].map(() => webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])));
const keys = await Promise.all(pairs.map(pair => webcrypto.subtle.exportKey('jwk', pair.publicKey)));
function grants(areas = ['playlists']) {
    const source = { localDeviceId: 'device-a', localProfileId: 'Profile-A', remoteDeviceId: 'device-b', remoteProfileId: 'Profile-B',
        localGrantId: 'grant-a', remoteGrantId: 'grant-b', localGeneration: 1, remoteGeneration: 1,
        areas, enabled: true, localPublicKeyJwk: keys[0], remotePublicKeyJwk: keys[1] };
    const receiver = { ...source, localDeviceId: 'device-b', localProfileId: 'Profile-B', remoteDeviceId: 'device-a',
        remoteProfileId: 'Profile-A', localGrantId: 'grant-b', remoteGrantId: 'grant-a',
        localPublicKeyJwk: keys[1], remotePublicKeyJwk: keys[0] };
    return { source, receiver };
}

test('the playlists sync area signs, verifies and merges onto the exact local profile', async () => {
    const { source, receiver } = grants(['notes', 'playlists', 'settings']);
    const codec = sync.create({ crypto: webcrypto });
    const outgoing = envelope([{ ...list('lp_a', { items: [video('aaaaaaaaaaa', 20)] }), profileId: 'Profile-A' }]);
    const signed = await codec.sign(source, { playlists: outgoing }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'm1' });
    assert.deepEqual(signed.areas, ['playlists']);
    const verified = await codec.verify(receiver, signed);
    const local = envelope([{ ...list('lp_a', { items: [video('bbbbbbbbbbb', 30)] }), profileId: 'Profile-B' }]);
    const result = sync.mergePlaylists(local, verified.payload.playlists, receiver);
    assert.deepEqual(result.playlists.map(playlist => playlist.profileId), ['Profile-B']);
    assert.deepEqual(result.playlists[0].items.map(item => item.videoId), ['aaaaaaaaaaa', 'bbbbbbbbbbb']);
    assert.deepEqual(sync.mergePlaylists(result, verified.payload.playlists, receiver), result, 'replaying a delivery changes nothing');
});

test('playlists stay closed unless the grant names the area and the envelope names the authorized profile', async () => {
    const { source, receiver } = grants(['notes']);
    const codec = sync.create({ crypto: webcrypto });
    const outgoing = envelope([{ ...list('lp_a'), profileId: 'Profile-A' }]);
    await assert.rejects(codec.sign(source, { playlists: outgoing }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'm1' }), /area_not_authorized/);
    assert.throws(() => sync.mergePlaylists(envelope([]), outgoing, receiver), /playlists_not_authorized/);
    const allowed = grants();
    await assert.rejects(codec.sign(allowed.source, { playlists: envelope([{ ...list('lp_a'), profileId: 'Sibling' }]) },
        { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'm1' }), /authorized scope/);
    assert.throws(() => sync.normalizeGrant({ ...allowed.source, areas: ['playlists', 'history'] }));
});

function storeFixture(allowed = () => true) {
    const data = {}, writes = [];
    const store = repository.create({
        get: async keyList => Object.fromEntries(keyList.filter(key => key in data).map(key => [key, data[key]])),
        set: async values => { writes.push(clone(values)); Object.assign(data, values); },
        authorizeSync: async (profileId, scope) => allowed(profileId, scope)
    });
    return { data, writes, store };
}

test('the background store reads one profile, merges deterministically and refuses without a live grant', async () => {
    const f = storeFixture((profileId, scope) => profileId === 'Profile-A' && scope?.grantId === 'grant-a');
    f.data[repository.DATA_KEY] = lists.encode(decode([{ ...list('lp_a'), profileId: 'Profile-A' }, { ...list('lp_s'), profileId: 'Sibling' }]));
    const read = await f.store.syncRead('Profile-A', { grantId: 'grant-a' });
    assert.deepEqual(read.playlists.map(playlist => playlist.id), ['lp_a']);
    const incoming = envelope([{ ...list('lp_new', { createdAt: 50 }), profileId: 'Profile-A' }]);
    const result = await f.store.syncMerge('Profile-A', incoming, { grantId: 'grant-a' });
    assert.deepEqual(result.playlists.map(playlist => playlist.id), ['lp_a', 'lp_new']);
    assert.equal(lists.decode(f.data[repository.DATA_KEY]).length, 3, 'the sibling profile keeps its list');
    await f.store.syncMerge('Profile-A', incoming, { grantId: 'grant-a' });
    assert.equal(f.writes.length, 1, 'a repeated merge does not rewrite storage');
    await assert.rejects(f.store.syncRead('Profile-A', { grantId: 'other' }), /access_changed/);
    await assert.rejects(f.store.syncMerge('Sibling', envelope([]), { grantId: 'grant-a' }), /access_changed/);
    await assert.rejects(f.store.syncMerge('Profile-A', envelope([{ ...list('lp_x'), profileId: 'Sibling' }]), { grantId: 'grant-a' }));
});

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
async function ioFixture(extra = {}) {
    const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'default', profiles: { default: {
        type: 'account', name: 'Default', parentProfileId: null, settings: {},
        main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] }
    } } }, ftProfilesV3: { main: {}, kids: {} }, ...extra };
    const writes = [];
    const box = { console, setTimeout, clearTimeout, TextEncoder,
        chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
            get(keyList, done) { done(keyList === null ? clone(storage) : Object.fromEntries((Array.isArray(keyList) ? keyList : [keyList]).filter(key => key in storage).map(key => [key, clone(storage[key])]))); },
            set(payload, done) { writes.push(clone(payload)); Object.assign(storage, clone(payload)); done?.(); },
            remove(keyList, done) { (Array.isArray(keyList) ? keyList : [keyList]).forEach(key => delete storage[key]); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } } } };
    box.window = box; vm.createContext(box); installNanahStorageLock(box);
    for (const name of ['shared/saved_video_notes', 'shared/local_playlists', 'settings_shared', 'io_manager']) vm.runInContext(read(name), box);
    await box.FilterTubeSettings.loadSettings();
    writes.length = 0;
    return { box, storage, writes };
}
const note = (profileId, videoId, text) => notes.edit({ profileId, videoId }, null, 'writer-app', text);
function appBackup() {
    return {
        schemaVersion: 4, activeProfileId: 'default', appThemeMode: 'system',
        profiles: {
            default: { type: 'account', name: 'Default', parentProfileId: null, settings: { syncKidsToMain: false },
                main: { mode: 'blocklist', channels: [], keywords: [{ word: 'spoilers', exact: false }] }, kids: { mode: 'blocklist', blockedKeywords: [] } },
            'child-1': { type: 'child', name: 'Sam', parentProfileId: 'default', settings: {},
                main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { mode: 'blocklist', blockedKeywords: [] } }
        },
        savedVideoNotes: { format: notes.FORMAT, version: 1, entries: [note('default', 'aaaaaaaaaaa', 'From the app'), note('child-1', 'bbbbbbbbbbb', 'Child note')] },
        localPlaylists: envelope([list('lp_a', { items: [video('aaaaaaaaaaa', 20)] }), { ...list('lp_kid'), profileId: 'child-1', surface: 'kids' }]),
        meta: { exportType: 'full' }
    };
}

test('an app backup with saved notes and playlists imports into matching profiles and merges idempotently', async () => {
    const existingNote = note('default', 'ccccccccccc', 'Already here');
    const f = await ioFixture({ ftSavedVideoNotesV1: notes.encode([existingNote], ['default']) });
    const result = await f.box.FilterTubeIO.importV3(appBackup(), { scope: 'full' });
    assert.equal(result.ok, true);
    assert.equal(result.receipt.savedVideoNotes, 2);
    assert.equal(result.receipt.localPlaylists, 2);
    assert.ok(f.storage.ftProfilesV4.profiles['child-1'], 'the child profile was imported');
    const storedNotes = notes.decode(f.storage.ftSavedVideoNotesV1, ['default', 'child-1']);
    assert.deepEqual(storedNotes.map(row => [row.profileId, row.videoId]),
        [['child-1', 'bbbbbbbbbbb'], ['default', 'aaaaaaaaaaa'], ['default', 'ccccccccccc']]);
    const storedLists = lists.decode(f.storage.ftLocalPlaylistsV1);
    assert.deepEqual(storedLists.map(playlist => [playlist.profileId, playlist.surface, playlist.id]),
        [['child-1', 'kids', 'lp_kid'], ['default', 'main', 'lp_a']]);
    const before = [f.storage.ftSavedVideoNotesV1, f.storage.ftLocalPlaylistsV1];
    await f.box.FilterTubeIO.importV3(appBackup(), { scope: 'full' });
    assert.deepEqual([f.storage.ftSavedVideoNotesV1, f.storage.ftLocalPlaylistsV1], before, 'restoring twice changes nothing');
});

test('invalid backup notes or playlists refuse the whole import before any write', async () => {
    for (const mutate of [backup => { backup.localPlaylists.playlists[0].colour = 'red'; },
        backup => { backup.savedVideoNotes.entries[0].videoId = 'short'; }]) {
        const f = await ioFixture(), backup = appBackup(); mutate(backup);
        await assert.rejects(f.box.FilterTubeIO.importV3(backup, { scope: 'full' }), /not valid/);
        assert.equal(f.writes.length, 0);
    }
});

test('extension exports carry the exported profiles\' notes and playlists and import back unchanged', async () => {
    const f = await ioFixture({
        ftSavedVideoNotesV1: notes.encode([note('default', 'aaaaaaaaaaa', 'Mine')], ['default']),
        ftLocalPlaylistsV1: lists.encode(decode([list('lp_a', { items: [video('aaaaaaaaaaa', 20)] })]))
    });
    const exported = await f.box.FilterTubeIO.exportV3({ scope: 'full' });
    assert.equal(exported.savedVideoNotes.entries.length, 1);
    assert.deepEqual(clone(exported.localPlaylists).playlists.map(playlist => playlist.id), ['lp_a']);
    const target = await ioFixture();
    await target.box.FilterTubeIO.importV3(clone(exported), { scope: 'full' });
    assert.equal(target.storage.ftLocalPlaylistsV1, f.storage.ftLocalPlaylistsV1);
    assert.equal(target.storage.ftSavedVideoNotesV1, f.storage.ftSavedVideoNotesV1);
    const plain = await ioFixture();
    const nothing = await plain.box.FilterTubeIO.exportV3({ scope: 'full' });
    assert.equal(Object.hasOwn(nothing, 'savedVideoNotes') || Object.hasOwn(nothing, 'localPlaylists'), false);
});
