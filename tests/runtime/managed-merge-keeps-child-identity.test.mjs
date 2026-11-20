import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// Android 70bdb8180 (ApprovedManagedApply.keepLocalIdentity): an approved Merge of a parent's profile onto
// a child takes only settings, main, kids and study; the child keeps its name, avatar, history, policy
// state and unknown keys. The extension's targeted apply (io_manager importV3 with targetProfileId) is
// pinned here so it never starts spreading the sender's whole profile.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

async function device(root) {
    const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device' };
    const box = { console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob, navigator: { platform: 'Test' },
        chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
            get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
            set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
            remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } } } };
    box.window = box; box.globalThis = box; vm.createContext(box); installNanahStorageLock(box);
    for (const name of ['settings_shared', 'security_manager', 'shared/study_model', 'io_manager', 'nanah_sync_adapter']) vm.runInContext(read(name), box);
    await box.FilterTubeSettings.loadSettings();
    return { adapter: box.FilterTubeNanahAdapter, storage };
}

const surfaces = word => ({ settings: { hideAllShorts: true }, main: { mode: 'blocklist', channels: [], keywords: [{ word, exact: false }] },
    kids: { mode: 'blocklist', blockedKeywords: [{ word: `${word}-kids` }] } });

for (const activeProfileId of ['default', 'kid']) test(`an approved Merge onto a child keeps its identity and takes only the rule areas (active: ${activeProfileId})`, async () => {
    const parent = await device({ schemaVersion: 4, activeProfileId: 'default', profiles: {
        default: { type: 'account', name: 'Mum', parentProfileId: null, avatar: 'doodle:sun', ...surfaces('parent rule'),
            managedActionHistory: [{ rowId: 'parent-row' }], managedPolicyState: { parent: true }, parentOnlyKey: 'x' } } });
    const envelope = await parent.adapter.buildSyncEnvelope({ scope: 'active' });
    const childOwn = { type: 'child', name: 'Aarav', parentProfileId: 'default', avatar: 'doodle:rocket', ...surfaces('child rule'),
        managedActionHistory: [{ rowId: 'child-row' }], managedPolicyState: { remoteManagedPolicies: { L: {} } }, futureChildKey: { kept: true } };
    const child = await device({ schemaVersion: 4, activeProfileId, profiles: {
        default: { type: 'account', name: 'Dad', parentProfileId: null, ...surfaces('local parent') }, kid: childOwn } });
    const result = await child.adapter.applyIncomingEnvelope(envelope, { strategy: 'merge', targetProfileId: 'kid',
        auth: { localManagedApplyBinding: { localParentProfileId: 'default', targetProfileId: 'kid', actorProfileId: activeProfileId } } });
    assert.notEqual(result?.ok, false);
    const after = child.storage.ftProfilesV4.profiles.kid;
    for (const key of ['name', 'avatar', 'type', 'parentProfileId', 'managedActionHistory', 'managedPolicyState', 'futureChildKey']) {
        assert.deepEqual(after[key], childOwn[key], key);
    }
    assert.equal('parentOnlyKey' in after, false, 'the sender\'s other keys never arrive');
    assert.deepEqual(after.main.keywords.map(row => row.word).sort(), ['child rule', 'parent rule'], 'rules merge');
    assert.equal(after.settings.hideAllShorts, true);
    assert.deepEqual(child.storage.ftProfilesV4.profiles.default.name, 'Dad', 'other profiles are untouched');
});
