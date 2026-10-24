import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { webcrypto } from 'node:crypto';
const require = createRequire(import.meta.url);
const sync = require('../../js/personal_sync.js');
const notes = require('../../js/shared/saved_video_notes.js');
const crypto = sync.create({ crypto: webcrypto });
const copy = value => structuredClone(value);
const empty = () => ({ settings: {}, main: {}, kids: {} });
const settings = value => ({ ...empty(), settings: value });
const pairs = await Promise.all([0, 1, 2].map(() => webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])));
const keys = await Promise.all(pairs.map(pair => webcrypto.subtle.exportKey('jwk', pair.publicKey)));
function grants() {
    const source = { localDeviceId: 'device-a', localProfileId: 'Profile-A', remoteDeviceId: 'device-b', remoteProfileId: 'Profile-B',
        localGrantId: 'enrollment-a', remoteGrantId: 'enrollment-b', localGeneration: 1, remoteGeneration: 2,
        areas: ['notes', 'settings'], enabled: true, localPublicKeyJwk: keys[0], remotePublicKeyJwk: keys[1] };
    const receiver = { ...source, localDeviceId: source.remoteDeviceId, localProfileId: source.remoteProfileId,
        remoteDeviceId: source.localDeviceId, remoteProfileId: source.localProfileId,
        localGrantId: source.remoteGrantId, remoteGrantId: source.localGrantId,
        localGeneration: source.remoteGeneration, remoteGeneration: source.localGeneration,
        localPublicKeyJwk: source.remotePublicKeyJwk, remotePublicKeyJwk: source.localPublicKeyJwk };
    return { source, receiver };
}
const noteKey = { profileId: 'Profile-A', videoId: 'abcdefghijk' };
const envelope = entries => ({ format: notes.FORMAT, version: 1, entries });
test('real Ed25519 updates bind both devices, exact profiles, enrollment epochs and generations', async () => {
    const { source, receiver } = grants();
    const data = { settings: settings({ hideShorts: true }), notes: envelope([notes.edit(noteKey, null, 'writer-a', 'Private')]) };
    const signed = await crypto.sign(source, data, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'message-a' });
    const verified = await crypto.verify(receiver, signed);
    assert.deepEqual(verified.payload, data);
    assert.equal(verified.sequence, 1);
    assert.equal(Object.hasOwn(signed, 'privateKey'), false);
    assert.equal(Object.hasOwn(signed, 'localPublicKeyJwk'), false);
    const again = await crypto.sign(source, copy(data), { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'message-a' });
    assert.deepEqual(again, signed);
});
test('changed signed body or payload cannot verify even with a recomputed payload digest', async () => {
    const { source, receiver } = grants();
    const signed = await crypto.sign(source, { settings: settings({ hideShorts: true }) },
        { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'message-a' });
    for (const mutate of [value => value.messageId = 'other', value => value.sequence = 2,
        value => value.signature = value.signature.slice(1) + 'A',
        value => value.payload.settings.settings.hideShorts = false]) {
        const changed = copy(signed); mutate(changed); await assert.rejects(crypto.verify(receiver, changed));
    }
    const changed = copy(signed); changed.payload.settings.settings.hideShorts = false;
    changed.digest = await crypto.digest(changed.payload);
    await assert.rejects(crypto.verify(receiver, changed), /signature/);
});
test('a peer cannot reroute a signed update to another profile, device, grant or generation', async () => {
    const { source, receiver } = grants();
    const signed = await crypto.sign(source, { settings: empty() }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'a' });
    for (const field of ['sourceDeviceId', 'sourceProfileId', 'targetDeviceId', 'targetProfileId', 'sourceGrantId', 'targetGrantId', 'sourceGeneration', 'targetGeneration']) {
        const changed = copy(signed); changed[field] = typeof changed[field] === 'number' ? changed[field] + 1 : changed[field] + 'x';
        await assert.rejects(crypto.verify(receiver, changed), /binding/);
    }
    await assert.rejects(crypto.verify({ ...receiver, localProfileId: 'profile-b' }, signed), /binding/);
    await assert.rejects(crypto.verify({ ...receiver, remotePublicKeyJwk: keys[2] }, signed), /signature/);
});
test('disabled grants and restricted areas fail closed; legacy peer rows are not grants', async () => {
    const { source, receiver } = grants();
    await assert.rejects(crypto.sign({ ...source, enabled: false }, { settings: empty() }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'a' }), /disabled/);
    const signed = await crypto.sign(source, { settings: empty() }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'a' });
    await assert.rejects(crypto.verify({ ...receiver, enabled: false }, signed), /disabled/);
    await assert.rejects(crypto.verify({ ...receiver, areas: ['notes'] }, signed), /area/);
    assert.throws(() => sync.normalizeGrant({ remoteDeviceId: 'device-a', linkType: 'peer_link' }));
});
test('private signing key must match the saved local public key', async () => {
    const { source } = grants();
    await assert.rejects(crypto.sign(source, { settings: empty() }, { privateKey: pairs[2].privateKey, sequence: 1, messageId: 'a' }), /wrong_local_signing_key/);
});
test('strict sequence replay checks permit a new update but refuse stale or duplicate delivery', async () => {
    const { source, receiver } = grants();
    const signed = await crypto.sign(source, { settings: empty() }, { privateKey: pairs[0].privateKey, sequence: 3, messageId: 'a' });
    assert.equal((await crypto.verify(receiver, signed, { lastSequence: 2 })).sequence, 3);
    for (const lastSequence of [3, 4, -1, 0.5]) await assert.rejects(crypto.verify(receiver, signed, { lastSequence }), /stale/);
});
test('unknown envelope fields and private-key material are rejected', async () => {
    const { source, receiver } = grants();
    const signed = await crypto.sign(source, { settings: empty() }, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'a' });
    await assert.rejects(crypto.verify(receiver, { ...signed, ownership: 'parent' }));
    assert.throws(() => sync.normalizeGrant({ ...source, remotePublicKeyJwk: { ...keys[1], d: 'private' } }));
    assert.throws(() => sync.normalizeGrant({ ...source, areas: ['settings', 'settings'] }));
    assert.throws(() => sync.normalizeGrant({ ...source, localDeviceId: source.remoteDeviceId }));
});
test('settings snapshot excludes security, ownership, managed state, viewing access and time limits', () => {
    const source = { type: 'account', parentProfileId: 'parent', security: { profilePinVerifier: 'never-export' },
        managedPolicyState: { anything: 'never-export' }, name: 'Private label',
        settings: { enabled: true, hideShorts: true, timeLimitPolicy: { minutes: 1 }, allowMainViewing: false,
            allowKidsViewing: false, contentFilters: { views: { enabled: true, minViews: 100 }, hiddenAuthority: true } },
        main: { channels: [{ id: 'UC123', name: 'Channel', security: 'never-export' }], keywords: [{ word: 'word', exact: false, control: true }] },
        kids: { mode: 'whitelist', strictMode: true } };
    const snapshot = sync.snapshotSettings(source);
    assert.deepEqual(snapshot, { settings: { enabled: true, hideShorts: true, contentFilters: { views: { enabled: true, minViews: 100 } } },
        main: { channels: [{ id: 'UC123', name: 'Channel' }], keywords: [{ word: 'word', exact: false }] }, kids: { mode: 'whitelist', strictMode: true } });
    assert.equal(JSON.stringify(snapshot).includes('never-export'), false);
});
test('received unknown or policy fields are rejected rather than stripped', () => {
    for (const value of [settings({ timeLimitPolicy: {} }), settings({ allowMainViewing: true }),
        { ...empty(), security: {} }, { ...empty(), main: { owner: 'parent' } },
        { ...empty(), main: { channels: [{ id: 'UC123', privateKey: 'x' }] } },
        settings({ contentFilters: { views: { enabled: true, minViews: 500 }, admin: true } })]) {
        assert.throws(() => sync.validateSettings(value));
    }
});
test('three-way settings merge respects additions, toggles and explicit field or rule removals', () => {
    const base = { settings: { hideShorts: false }, main: { channels: [{ id: 'UC123' }] }, kids: {} };
    const local = copy(base); local.settings.hideShorts = true;
    const remote = copy(base); delete remote.main.channels; remote.settings.disableAutoplay = true;
    const result = sync.mergeSettings(base, local, remote);
    assert.equal(result.ok, true);
    assert.deepEqual(result.snapshot, { settings: { hideShorts: true, disableAutoplay: true }, main: {}, kids: {} });
    assert.deepEqual(base.main.channels, [{ id: 'UC123' }]);
});
test('identical concurrent changes converge; conflicting arrays remain intact for review', () => {
    const base = { settings: { hideShorts: false }, main: { channels: [{ id: 'UC123' }] }, kids: {} };
    const local = copy(base), remote = copy(base);
    local.settings.hideShorts = true; remote.settings.hideShorts = true;
    assert.equal(sync.mergeSettings(base, local, remote).ok, true);
    local.main.channels.push({ id: 'UC456' }); remote.main.channels = [];
    const result = sync.mergeSettings(base, local, remote);
    assert.equal(result.ok, false); assert.deepEqual(result.conflicts, ['main.channels']);
    assert.deepEqual(result.snapshot, local);
});
test('settings apply preserves local identity, keys, policy and unrelated fields while clearing aliases', () => {
    const profile = { type: 'account', parentProfileId: null, name: 'Local', security: { verifier: 'secret' },
        managedPolicyState: { keep: true }, settings: { timeLimitPolicy: { minutes: 30 }, allowMainViewing: false, hideShorts: true },
        main: { channels: [{ id: 'old' }], blockedChannels: [{ id: 'old' }], subscriptions: [{ id: 'keep' }] }, kids: {} };
    const applied = sync.applySettings(profile, empty());
    assert.equal(applied.type, 'account'); assert.equal(applied.name, 'Local');
    assert.deepEqual(applied.security, profile.security); assert.deepEqual(applied.managedPolicyState, profile.managedPolicyState);
    assert.deepEqual(applied.settings, { timeLimitPolicy: { minutes: 30 }, allowMainViewing: false });
    assert.deepEqual(applied.main, { subscriptions: [{ id: 'keep' }] });
    assert.equal(profile.main.channels.length, 1);
});
test('minimum-view sync never replaces unrelated content filter groups', () => {
    const profile = { settings: { contentFilters: { duration: { min: 15 }, views: { enabled: true, minViews: 100 } } }, main: {}, kids: {} };
    const changed = sync.applySettings(profile, settings({ contentFilters: { views: { enabled: false, minViews: 500 } } }));
    assert.deepEqual(changed.settings.contentFilters, { duration: { min: 15 }, views: { enabled: false, minViews: 500 } });
    const removed = sync.applySettings(profile, empty());
    assert.deepEqual(removed.settings.contentFilters, { duration: { min: 15 } });
});
test('legacy main-rule aliases are selected without changing the stored source or overriding canonical empty lists', () => {
    const profile = { settings: {}, main: { blockedChannels: [{ id: 'UC123' }], blockedKeywords: [{ word: 'Legacy' }], blockedVideoIds: ['abcdefghijk'] }, kids: {} };
    const source = copy(profile);
    assert.deepEqual(sync.snapshotSettings(profile).main, { channels: [{ id: 'UC123' }], keywords: [{ word: 'Legacy' }], videoIds: ['abcdefghijk'] });
    assert.deepEqual(profile, source);
    profile.main.channels = [];
    assert.deepEqual(sync.snapshotSettings(profile).main.channels, []);
});
test('the current Main and Kids video-filter shapes round-trip with category and language selections', () => {
    // These fields match StateManager defaults and the Main/Kids UI save payloads.
    const contentFilters = {
        duration: { enabled: true, condition: 'between', value: '1.5-20', minMinutes: 1.5, maxMinutes: 20, mode: 'allow' },
        uploadDate: { enabled: true, condition: 'between', value: '1', unit: 'months', valueMax: 2,
            unitMax: 'years', fromDate: '2026-09-24T08:00:00.000Z', toDate: '2024-10-24T08:00:00.000Z' },
        uppercase: { enabled: true, mode: 'both', minWordLength: 2 }, views: { enabled: true, minViews: 500 }
    };
    const categoryFilters = { enabled: true, mode: 'block', selected: ['music', 'Gaming'] };
    const languageFilters = { enabled: true, mode: 'allow', selected: ['hi', 'en', 'zh-CN'] };
    const profile = { settings: { contentFilters, categoryFilters, languageFilters, syncKidsToMain: true }, main: {},
        kids: { contentFilters: copy(contentFilters), categoryFilters: copy(categoryFilters) } };
    const snapshot = sync.snapshotSettings(profile);
    assert.deepEqual(snapshot, profile);
    assert.deepEqual(sync.applySettings({ settings: {}, main: {}, kids: {} }, snapshot), profile);
});
test('default disabled content controls and legacy filter aliases stay valid without fabricating enabled rules', () => {
    const profile = { settings: {}, main: { applyKidsRulesOnMain: true, contentFilters: {
        duration: { enabled: false, condition: 'between', value: '', minutesMin: 0, minutesMax: 0 },
        uploadDate: { enabled: false, condition: 'newer', value: '', fromDate: '', toDate: '' },
        uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }, views: { enabled: false, minViews: 500 }
    }, categoryFilters: { enabled: false, mode: 'block', selected: [] } }, kids: {} };
    const snapshot = sync.snapshotSettings(profile);
    assert.equal(snapshot.settings.syncKidsToMain, true);
    assert.deepEqual(snapshot.settings.contentFilters.duration, { enabled: false, condition: 'between', value: '', minMinutes: 0, maxMinutes: 0 });
    assert.deepEqual(snapshot.settings.categoryFilters, { enabled: false, mode: 'block', selected: [] });
    assert.equal(Object.hasOwn(snapshot.main, 'applyKidsRulesOnMain'), false);
    const changed = copy(snapshot); changed.settings.syncKidsToMain = false; changed.settings.contentFilters.duration.minMinutes = 10;
    const applied = sync.applySettings(profile, changed);
    assert.equal(applied.main.applyKidsRulesOnMain, false);
    assert.equal(applied.main.contentFilters.duration.minMinutes, 10);
    assert.equal(applied.main.contentFilters.duration.minutesMin, undefined);
});
test('independent content groups merge, while concurrent changes to the same group require review', () => {
    const base = settings({ contentFilters: { duration: { enabled: false, minMinutes: 0 }, views: { enabled: false, minViews: 500 } } });
    const local = copy(base), remote = copy(base);
    local.settings.contentFilters.duration = { enabled: true, minMinutes: 10 };
    remote.settings.contentFilters.views = { enabled: true, minViews: 1000 };
    const merged = sync.mergeSettings(base, local, remote);
    assert.equal(merged.ok, true);
    assert.deepEqual(merged.snapshot.settings.contentFilters, { duration: { enabled: true, minMinutes: 10 }, views: { enabled: true, minViews: 1000 } });
    remote.settings.contentFilters.duration = { enabled: true, minMinutes: 20 };
    const conflict = sync.mergeSettings(base, local, remote);
    assert.equal(conflict.ok, false); assert.deepEqual(conflict.conflicts, ['settings.contentFilters.duration']);
    assert.deepEqual(conflict.snapshot, local);
});
test('future local content-control fields are preserved but never exported or accepted from peers', () => {
    const profile = { settings: { contentFilters: { future: { localOnly: true }, duration: { enabled: true, minMinutes: 10, future: 'keep' } },
        categoryFilters: { enabled: true, mode: 'block', selected: ['music'], localOnly: true } }, main: {}, kids: {} };
    const selected = sync.snapshotSettings(profile);
    assert.equal(Object.hasOwn(selected.settings.contentFilters, 'future'), false);
    assert.equal(Object.hasOwn(selected.settings.contentFilters.duration, 'future'), false);
    assert.equal(Object.hasOwn(selected.settings.categoryFilters, 'localOnly'), false);
    const changed = copy(selected); changed.settings.contentFilters.duration.minMinutes = 20;
    const applied = sync.applySettings(profile, changed);
    assert.deepEqual(applied.settings.contentFilters.future, { localOnly: true });
    assert.equal(applied.settings.contentFilters.duration.future, 'keep');
    assert.equal(applied.settings.categoryFilters.localOnly, true);
    assert.throws(() => sync.validateSettings({ ...empty(), settings: profile.settings }));
});
test('content and selection validators reject unknown keys, malformed ranges, invalid modes and excessive selections', () => {
    for (const rule of [{ duration: { enabled: true, minMinutes: -1 } }, { duration: { value: 'not-a-range' } },
        { duration: { condition: 'newer' } }, { duration: { minMinutes: Number.POSITIVE_INFINITY } },
        { uploadDate: { condition: 'newer', unit: 'fortnights' } }, { uploadDate: { fromDate: 'not-a-date' } },
        { uppercase: { mode: 'disable-safety' } }, { uppercase: { minWordLength: 16001 } },
        { views: { enabled: 'true', minViews: 500 } }, { views: { minViews: 1.5 } }, { duration: { timeLimitPolicy: {} } }]) {
        assert.throws(() => sync.validateSettings(settings({ contentFilters: rule })));
    }
    for (const selection of [{ enabled: 'yes' }, { selected: ['music', 'music'] }, { mode: 'replace' },
        { selected: Array.from({ length: 257 }, (_, i) => 'category-' + i) }, { selected: ['x'.repeat(129)] }]) {
        assert.throws(() => sync.validateSettings(settings({ categoryFilters: selection })));
    }
    assert.throws(() => sync.validateSettings(settings({ languageFilters: { selected: ['<script>'] } })));
});
test('peer comparison pins stable saved trust identity and keys while ignoring volatile labels and receipts', () => {
    const link = { linkId: 'saved-peer-a', createdAt: '2026-10-24T00:00:00Z', remoteDeviceId: 'device-b',
        linkType: 'peer_link', localRole: 'peer', remoteRole: 'peer', deviceLabel: 'My tablet', lastUsedAt: 'old',
        policy: { sourcePublicKeyId: 'key-a', sourcePublicKeyJwk: keys[1], keyVersion: 1 } };
    const baseline = sync.peerBinding([link], 'device-b'); assert.equal(typeof baseline, 'string');
    assert.equal(sync.peerBinding([{ ...link, deviceLabel: 'Renamed tablet', lastUsedAt: 'new', receipt: { applied: true } }], 'device-b'), baseline);
    for (const changed of [{ ...link, linkId: 'replacement' }, { ...link, createdAt: '2026-10-25T00:00:00Z' },
        { ...link, policy: { ...link.policy, keyVersion: 2 } }, { ...link, policy: { ...link.policy, sourcePublicKeyJwk: keys[2] } }]) {
        assert.notEqual(sync.peerBinding([changed], 'device-b'), baseline);
    }
    assert.equal(sync.peerBinding([], 'device-b'), null);
    assert.equal(sync.peerBinding([link, copy(link)], 'device-b'), null);
    assert.equal(sync.peerBinding([{ ...link, revoked: true }], 'device-b'), null);
    assert.equal(sync.peerBinding([{ ...link, remoteRole: 'source' }], 'device-b'), null);
    assert.equal(sync.peerBinding([{ ...link, sourcePublicKeyId: 'conflicting-key' }], 'device-b'), null);
});
test('notes remap only through the exact saved profile grant and preserve other causal heads', () => {
    const { receiver } = grants();
    const a = notes.edit(noteKey, null, 'writer-a', 'Original');
    const localKey = { ...noteKey, profileId: receiver.localProfileId };
    const local = notes.edit(localKey, null, 'writer-b', 'Independent');
    const merged = sync.mergeNotes([local], envelope([a]), receiver);
    assert.equal(merged[0].profileId, 'Profile-B'); assert.equal(merged[0].versions.length, 2);
    assert.deepEqual(sync.mergeNotes(merged, envelope([a]), receiver), merged);
    assert.throws(() => sync.mergeNotes([local], envelope([{ ...a, profileId: 'Profile-a' }]), receiver));
    assert.throws(() => sync.mergeNotes([{ ...local, profileId: 'Sibling' }], envelope([a]), receiver));
});
test('a note deletion cannot be resurrected by old peer replay', () => {
    const { receiver } = grants();
    const a = notes.edit(noteKey, null, 'writer-a', 'Original');
    const deleted = notes.edit(noteKey, a, 'writer-a', null);
    const merged = sync.mergeNotes([], envelope([deleted]), receiver);
    const replayed = sync.mergeNotes(merged, envelope([a]), receiver);
    assert.deepEqual(replayed, merged); assert.equal(replayed[0].versions[0].text, null);
});
test('offline edit/delete conflicts retain both heads until explicit editor resolution', () => {
    const { receiver } = grants();
    const base = notes.edit(noteKey, null, 'writer-a', 'Original');
    const local = { ...notes.edit(noteKey, base, 'writer-b', 'Offline edit'), profileId: receiver.localProfileId };
    const deleted = notes.edit(noteKey, base, 'writer-a', null);
    const merged = sync.mergeNotes([local], envelope([deleted]), receiver);
    assert.equal(merged[0].versions.length, 2);
    assert.deepEqual(new Set(merged[0].versions.map(version => version.text)), new Set(['Offline edit', null]));
});
test('malformed, prototype-bearing, deep and oversized payloads fail without mutation', async () => {
    const { source } = grants();
    for (const value of [JSON.parse('{"settings":{"__proto__":{"pollute":true}},"main":{},"kids":{}}'),
        Object.assign(Object.create({ privileged: true }), empty()), settings({ hideShorts: 'true' }),
        { ...empty(), main: { videoIds: ['invalid'] } }]) assert.throws(() => sync.validateSettings(value));
    let access = 0;
    const getter = empty(); Object.defineProperty(getter.settings, 'hideShorts', { enumerable: true, get() { access++; return true; } });
    assert.throws(() => sync.validateSettings(getter)); assert.equal(access, 0);
    const getterList = [null];
    Object.defineProperty(getterList, '0', { enumerable: true, get() { access++; return { id: 'UC123' }; } });
    assert.throws(() => sync.validateSettings({ ...empty(), main: { channels: getterList } })); assert.equal(access, 0);
    const sparse = new Array(1); sparse.extra = 'not-an-index';
    assert.throws(() => sync.validateSettings({ ...empty(), main: { channels: sparse } }));
    const tooLarge = { settings: empty(), notes: envelope(Array.from({ length: 40 }, (_, i) => notes.edit(
        { ...noteKey, videoId: String(i).padStart(11, '0') }, null, 'writer-a', 'x'.repeat(16000)))) };
    await assert.rejects(crypto.sign(source, tooLarge, { privateKey: pairs[0].privateKey, sequence: 1, messageId: 'a' }), /too_large/);
    let deep = {}; for (let i = 0; i < 15; i++) deep = { nested: deep };
    await assert.rejects(crypto.digest(deep));
    assert.equal({}.pollute, undefined);
});

test('nullable legacy rule metadata does not block a supported profile snapshot', () => {
    const profile = {main:{keywords:[{word:'keep rule',addedAt:null,dateFilter:null}]},kids:{},settings:{}};
    const snapshot = sync.snapshotSettings(profile);
    assert.equal(snapshot.main.keywords[0].word,'keep rule');
    assert.deepEqual(sync.applySettings(profile,snapshot).main.keywords[0],snapshot.main.keywords[0]);
});
