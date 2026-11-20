import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// Study lock on backup import, Android parity (AppPreferences.mergeImportRoots / StudyMerge):
// Replace takes the backup's lock; Merge into a profile new on this device takes it; Merge into an
// existing profile keeps this device's lock; a sync (not an import) drops an incoming lock unless
// it is Move account.
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const CHILD = 'child-1';
const lock = id => ({ sessionId: id, sessionKind: 'hard_whitelist', mode: 'locked', setByParentId: 'default',
    startsAt: 1779300000000, endsAt: 1779303600000 });
const study = lockValue => ({ version: 1, activePackIds: ['in_gate'], packEdits: {}, focus: { roundMinutes: 25, breakMinutes: 5, dailyGoalMinutes: 120 },
    plan: null, lock: lockValue, savedListMode: null, breakMode: 'rest', progress: {}, weekView: null });

function tree(childStudy) {
    return { schemaVersion: 4, activeProfileId: 'default', profiles: {
        default: { type: 'account', name: 'Mum', parentProfileId: null, settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: {} },
        ...(childStudy !== undefined ? { [CHILD]: { type: 'child', name: 'Kid', parentProfileId: 'default', settings: {},
            main: { mode: 'blocklist', channels: [], keywords: [] }, kids: {}, ...(childStudy ? { study: childStudy } : {}) } } : {})
    } };
}

async function device(root) {
    const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device' };
    const box = { console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, TextDecoder, btoa, atob,
        chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
            get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
            set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
            remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } } } };
    box.window = box; box.globalThis = box; vm.createContext(box); installNanahStorageLock(box);
    for (const name of ['settings_shared', 'security_manager', 'shared/study_model', 'io_manager', 'nanah_sync_adapter']) vm.runInContext(read(name), box);
    await box.FilterTubeSettings.loadSettings();
    return { io: box.FilterTubeIO, lockId: () => storage.ftProfilesV4.profiles[CHILD]?.study?.lock?.sessionId ?? null };
}

const backupWith = async lockValue => (await device(tree(study(lockValue)))).io.exportV3({ scope: 'full' });

test('Replace import takes the backup\'s Study lock (plain and encrypted)', async () => {
    const backup = await backupWith(lock('from-backup'));
    const phone = await device(tree(study(lock('mine'))));
    await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'replace', restoreStudyLock: true });
    assert.equal(phone.lockId(), 'from-backup');
    const sealed = await (await device(tree(study(lock('sealed'))))).io.exportV3Encrypted({ scope: 'full', password: 'pw' });
    const other = await device(tree(study(null)));
    await other.io.importV3Encrypted(clone(sealed), { password: 'pw', strategy: 'replace', scope: 'full' });
    assert.equal(other.lockId(), 'sealed');
});

test('Merge import into a profile this device does not have takes the backup\'s lock', async () => {
    const phone = await device(tree(undefined));
    await phone.io.importV3(clone(await backupWith(lock('from-backup'))), { scope: 'full', strategy: 'merge', restoreStudyLock: true });
    assert.equal(phone.lockId(), 'from-backup');
});

test('Merge import into an existing profile keeps this device\'s lock (or none)', async () => {
    const backup = await backupWith(lock('from-backup'));
    const phone = await device(tree(study(lock('mine'))));
    await phone.io.importV3(clone(backup), { scope: 'full', strategy: 'merge', restoreStudyLock: true });
    assert.equal(phone.lockId(), 'mine');
    const unlocked = await device(tree(study(null)));
    await unlocked.io.importV3(clone(backup), { scope: 'full', strategy: 'merge', restoreStudyLock: true });
    assert.equal(unlocked.lockId(), null);
});

test('a sync (not an import) drops an incoming lock unless it is Move account', async () => {
    const backup = await backupWith(lock('from-sync'));
    for (const strategy of ['replace', 'merge']) {
        const phone = await device(tree(undefined));
        await phone.io.importV3(clone(backup), { scope: 'full', strategy });
        assert.equal(phone.lockId(), null, strategy);
    }
    const moved = await device(tree(undefined));
    await moved.io.importV3(clone(backup), { scope: 'full', strategy: 'replace', carryStudyLock: true });
    assert.equal(moved.lockId(), 'from-sync');
});
