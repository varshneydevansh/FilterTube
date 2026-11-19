import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';

// Lossless backup contract (FilterTubeApp docs/parity/SETTINGS_SYNC_MATRIX.md): the shared FTC1 and
// integrity fixtures, tamper detection, the PIN gate for weakening imports, app preferences, and
// pass-through of keys this extension does not model.
const require = createRequire(import.meta.url);
const Integrity = require('../../js/shared/backup_integrity.js');
const fixture = name => JSON.parse(fs.readFileSync(new URL(`./fixtures/lossless/${name}`, import.meta.url), 'utf8'));
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));

test('FTC1 matches every shared canonical string', () => {
    for (const { value, canonical } of fixture('ftc1_cases.json')) {
        assert.equal(Integrity.ftc1(value), canonical);
    }
});

test('integrity statuses and digests match the shared fixtures', async () => {
    const cases = fixture('integrity_cases.json');
    const statuses = {
        plain: await Integrity.verify(cases.plain),
        hmacWithPin: await Integrity.verify(cases.hmac, cases.pin),
        hmacWrongPin: await Integrity.verify(cases.hmac, '1111'),
        hmacNoPin: await Integrity.verify(cases.hmac),
        edited: await Integrity.verify(cases.edited, cases.pin),
        missing: await Integrity.verify(cases.root)
    };
    assert.deepEqual(statuses, cases.expect);
    assert.deepEqual(await Integrity.integrityBlock(cases.root), cases.plain.integrity);
    const { salt, iterations } = cases.hmac.integrity.kdf;
    assert.deepEqual(await Integrity.integrityBlock(cases.root, { pin: cases.pin, saltBase64: salt, iterations, isProtected: true }),
        cases.hmac.integrity);
    assert.equal(await Integrity.verify({ ...cases.plain, integrity: { ...cases.plain.integrity, alg: 'md5' } }), 'malformed');
});

const keyword = word => ({ word, exact: false, comments: true, source: 'user', addedAt: 1 });
const channel = (id, name) => ({ id, name, handle: '', filterAll: false, source: 'user', addedAt: 1 });

function profileTree(overrides = {}) {
    return {
        schemaVersion: 4,
        activeProfileId: 'default',
        profiles: {
            default: {
                type: 'account', parentProfileId: null, name: 'Parent', settings: { hideShorts: true },
                main: { mode: 'blocklist', channels: [channel('UC1', 'One')], keywords: [keyword('alpha')], whitelistChannels: [], whitelistKeywords: [] },
                kids: { mode: 'blocklist', strictMode: true, blockedChannels: [], blockedKeywords: [], whitelistChannels: [], whitelistKeywords: [] }
            },
            kid: {
                type: 'child', parentProfileId: 'default', name: 'Kid', settings: { hideComments: true },
                main: { mode: 'whitelist', channels: [], keywords: [keyword('scary')], whitelistChannels: [channel('UCok', 'Okay')], whitelistKeywords: [] },
                kids: { mode: 'blocklist', strictMode: true, blockedChannels: [], blockedKeywords: [], whitelistChannels: [], whitelistKeywords: [] }
            }
        },
        ...overrides
    };
}

async function device(root, extraStorage = {}) {
    const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [], ftNanahDeviceId: 'device-secret', ...clone(extraStorage) };
    const box = {
        console, setTimeout, clearTimeout, crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa,
        chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
            get(keys, done) { done(keys === null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter(key => key in storage).map(key => [key, clone(storage[key])]))); },
            set(payload, done) { Object.assign(storage, clone(payload)); done?.(); },
            remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
            getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
        } } }
    };
    box.window = box; vm.createContext(box); installNanahStorageLock(box);
    vm.runInContext(read('security_manager'), box);
    vm.runInContext(read('shared/backup_integrity'), box);
    vm.runInContext(read('settings_shared'), box);
    vm.runInContext(read('shared/study_model'), box);
    vm.runInContext(read('io_manager'), box);
    vm.runInContext(read('nanah_sync_adapter'), box);
    await box.FilterTubeSettings.loadSettings();
    return { box, io: box.FilterTubeIO, adapter: box.FilterTubeNanahAdapter, settings: box.FilterTubeSettings, storage,
        tree: () => storage.ftProfilesV4 };
}

const pinVerifier = pin => globalThis.crypto && (async () => {
    const box = { crypto: globalThis.crypto, TextEncoder, TextDecoder, atob, btoa };
    box.window = box; vm.createContext(box);
    vm.runInContext(read('security_manager'), box);
    return clone(await box.FilterTubeSecurity.createPinVerifier(pin, { iterations: 1000 }));
})();

function withMasterPin(tree, verifier) {
    const next = clone(tree);
    next.profiles.default.security = { masterPinVerifier: verifier };
    return next;
}

// A second account profile "work" with its own PIN, owning the child profile "kid".
function withWorkParent(tree, verifier) {
    const next = clone(tree);
    next.profiles.work = {
        type: 'account', parentProfileId: null, name: 'Work', settings: {}, security: { profilePinVerifier: verifier },
        main: { mode: 'blocklist', channels: [], keywords: [], whitelistChannels: [], whitelistKeywords: [] },
        kids: { mode: 'blocklist', strictMode: true, blockedChannels: [], blockedKeywords: [], whitelistChannels: [], whitelistKeywords: [] }
    };
    next.profiles.kid.parentProfileId = 'work';
    return next;
}

const v3 = profilesV4 => ({ meta: { version: 3, application: 'FilterTube', exportType: 'full' }, profilesV4: clone(profilesV4) });

test('exports carry the integrity block: a content hash, or an HMAC keyed by the master PIN', async () => {
    const open = await device(profileTree());
    const plain = await open.io.exportV3({ scope: 'full' });
    assert.equal(plain.integrity.alg, 'sha256');
    assert.equal(plain.integrity.protected, false);
    assert.equal(await Integrity.verify(clone(plain)), 'valid');

    const verifier = await pinVerifier('2468');
    const locked = await device(withMasterPin(profileTree(), verifier));
    const signed = await locked.io.exportV3({ scope: 'full', auth: { localMasterPin: '2468' } });
    assert.equal(signed.integrity.alg, 'hmac-sha256');
    assert.equal(signed.integrity.protected, true);
    assert.equal(signed.integrity.kdf.iterations, 150000);
    assert.equal(await Integrity.verify(clone(signed), '2468'), 'valid');
    assert.equal(await Integrity.verify(clone(signed)), 'needs_pin');
});

test('an edited or stripped protected backup is detected and needs the PIN; the intact one does not', async () => {
    const workPin = await pinVerifier('1357');
    const source = await device(withWorkParent(profileTree(), workPin));
    const backup = clone(await source.io.exportV3({ scope: 'full' }));
    assert.equal(backup.integrity.protected, true);

    const intact = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    assert.deepEqual(clone(await intact.io.inspectBackupIntegrity(clone(backup))), { status: 'valid', protected: true, changedOutside: false });
    const applied = await intact.io.importV3(clone(backup), { strategy: 'replace', scope: 'full' });
    assert.equal(applied.integrity.status, 'valid');

    const edited = clone(backup);
    edited.profilesV4.profiles.kid.main.whitelistChannels.push(channel('UCbad', 'Bad'));
    const target = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    assert.deepEqual(clone(await target.io.inspectBackupIntegrity(clone(edited))), { status: 'mismatch', protected: true, changedOutside: true });
    const before = clone(target.tree());
    await assert.rejects(target.io.importV3(clone(edited), { strategy: 'replace', scope: 'full' }),
        error => error.code === target.io.BACKUP_CHANGED_PIN_REQUIRED);
    assert.deepEqual(clone(target.tree()), before, 'nothing applied');
    await assert.rejects(target.io.importV3(clone(edited), { strategy: 'replace', scope: 'full', auth: { authorizationPin: '0000' } }),
        error => error.code === target.io.BACKUP_CHANGED_PIN_REQUIRED);
    const authorized = await target.io.importV3(clone(edited), { strategy: 'replace', scope: 'full', auth: { authorizationPin: '1357' } });
    assert.equal(authorized.integrity.changedOutside, true);

    const stripped = clone(backup);
    delete stripped.integrity;
    const other = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    await assert.rejects(other.io.importV3(clone(stripped), { strategy: 'merge', scope: 'full' }),
        error => error.code === other.io.BACKUP_CHANGED_PIN_REQUIRED);
});

test('with a master PIN on this device, a changed protected backup needs that PIN', async () => {
    const master = await pinVerifier('2468');
    const source = await device(withMasterPin(profileTree(), master));
    const backup = clone(await source.io.exportV3({ scope: 'full', auth: { localMasterPin: '2468' } }));
    backup.profilesV4.profiles.default.main.keywords = [];
    const target = await device(withMasterPin(profileTree(), await pinVerifier('9999')));
    await assert.rejects(target.io.importV3(clone(backup), { strategy: 'replace', scope: 'full', auth: { localMasterPin: '9999', incomingMasterPin: '1111' } }),
        /Backup Master PIN required/);
    const report = await target.io.inspectBackupIntegrity(clone(backup), { auth: { incomingMasterPin: '2468' } });
    assert.equal(report.status, 'mismatch');
    const done = await target.io.importV3(clone(backup), { strategy: 'replace', scope: 'full', auth: { localMasterPin: '9999', incomingMasterPin: '2468' } });
    assert.equal(done.integrity.changedOutside, true);
});

test('an edited unprotected backup shows the notice but needs no PIN', async () => {
    const source = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    const backup = clone(await source.io.exportV3({ scope: 'full' }));
    backup.profilesV4.profiles.default.main.keywords.push(keyword('added'));
    const target = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    const result = await target.io.importV3(clone(backup), { strategy: 'merge', scope: 'full' });
    assert.deepEqual(clone(result.integrity), { status: 'mismatch', protected: false, changedOutside: true });
});

test('an import that weakens a protected profile needs the PIN; one that only adds blocking does not', async () => {
    const workPin = await pinVerifier('1357');
    const local = withWorkParent(profileTree(), workPin);
    const signed = async tree => Integrity.attach(v3(tree));

    // Adding a block rule and turning a hide switch on: no PIN needed, even on a protected device.
    const stronger = clone(local);
    stronger.profiles.kid.main.keywords.push(keyword('extra'));
    stronger.profiles.kid.settings.hideShorts = true;
    const ok = await device(local);
    await ok.io.importV3(await signed(stronger), { strategy: 'merge', scope: 'full' });
    assert.ok(ok.tree().profiles.kid.main.keywords.some(entry => entry.word === 'extra'));

    for (const [label, change] of [
        ['allow rule added', tree => tree.profiles.kid.main.whitelistChannels.push(channel('UCnew', 'New'))],
        ['block rule removed', tree => { tree.profiles.kid.main.keywords = []; }],
        ['mode loosened', tree => { tree.profiles.kid.main.mode = 'blocklist'; }],
        ['hide switch off', tree => { tree.profiles.kid.settings.hideComments = false; }],
        ['parent PIN removed', tree => { delete tree.profiles.work.security; }],
        ['profile deleted', tree => { delete tree.profiles.kid; }]
    ]) {
        const weaker = clone(local);
        change(weaker);
        const payload = await signed(weaker);
        const target = await device(local);
        const before = clone(target.tree());
        await assert.rejects(target.io.importV3(clone(payload), { strategy: 'replace', scope: 'full' }),
            error => error.code === target.io.WEAKENING_PIN_REQUIRED, label);
        assert.deepEqual(clone(target.tree()), before, `${label}: nothing applied`);
        await assert.rejects(target.io.importV3(clone(payload), { strategy: 'replace', scope: 'full', auth: { authorizationPin: '2222' } }),
            error => error.code === target.io.WEAKENING_PIN_REQUIRED, label);
        await target.io.importV3(clone(payload), { strategy: 'replace', scope: 'full', auth: { authorizationPin: '1357' } });
    }

    // A child's own switching PIN never authorizes loosening it.
    const kidOwnPin = clone(local);
    kidOwnPin.profiles.kid.security = { profilePinVerifier: await pinVerifier('4444') };
    const loosened = clone(kidOwnPin);
    loosened.profiles.kid.main.keywords = [];
    const kidDevice = await device(kidOwnPin);
    await assert.rejects(kidDevice.io.importV3(await signed(loosened), { strategy: 'replace', scope: 'full', auth: { authorizationPin: '4444' } }),
        error => error.code === kidDevice.io.WEAKENING_PIN_REQUIRED);
});

test('one-time Nanah applies keep the PIN gate for weakening changes', async () => {
    const master = await pinVerifier('2468');
    const local = withMasterPin(profileTree(), master);
    const envelope = (data, strategy) => ({ t: 'control_proposal', scope: 'main', payload: JSON.stringify({
        targetScope: 'main', strategy, portable: { version: 1, section: 'main', meta: { scope: 'main' }, data } }) });

    const target = await device(local);
    await assert.rejects(target.adapter.applyIncomingEnvelope(envelope({ mode: 'blocklist', channels: [], keywords: [] }, 'replace'), { strategy: 'replace' }),
        error => error.code === target.io.WEAKENING_PIN_REQUIRED);
    assert.equal(target.tree().profiles.default.main.keywords.length, 1);
    await target.adapter.applyIncomingEnvelope(envelope({ keywords: [keyword('beta')] }, 'merge'), { strategy: 'merge' });
    assert.deepEqual(target.tree().profiles.default.main.keywords.map(entry => entry.word).sort(), ['alpha', 'beta']);
    await target.adapter.applyIncomingEnvelope(envelope({ mode: 'blocklist', channels: [], keywords: [] }, 'replace'),
        { strategy: 'replace', auth: { localMasterPin: '2468' } });
    assert.equal(target.tree().profiles.default.main.keywords.length, 0);

    // A one-time copy carries no backup-file integrity block.
    const built = await target.adapter.buildSyncEnvelope({ scope: 'full', auth: { localMasterPin: '2468' } });
    assert.equal(Object.prototype.hasOwnProperty.call(JSON.parse(built.payload), 'integrity'), false);
});

test('Main content and category filters travel from an app tree and in a Main-scope transfer', async () => {
    const appTree = profileTree({ profiles: { default: clone(profileTree().profiles.default) } });
    appTree.profiles.default.main.contentFilters = { duration: { enabled: true, condition: 'longer', minMinutes: 20 } };
    appTree.profiles.default.main.categoryFilters = { enabled: true, mode: 'block', selected: ['20'] };
    const target = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    await target.io.importV3({ meta: { version: 3, application: 'FilterTube', exportType: 'full' }, profilesV4: appTree }, { strategy: 'replace', scope: 'full' });
    const loaded = await target.settings.loadSettings();
    assert.equal(loaded.contentFilters.duration.enabled, true);
    assert.deepEqual(clone(loaded.categoryFilters), { enabled: true, mode: 'block', selected: ['20'] });

    const built = await target.adapter.buildSyncEnvelope({ scope: 'main' });
    const data = JSON.parse(built.payload).data;
    assert.equal(data.contentFilters.duration.enabled, true);
    assert.deepEqual(data.categoryFilters.selected, ['20']);
});

test('an app backup without skipBlockedAutoplay keeps the default on and the key unset', async () => {
    const appTree = profileTree({ profiles: { default: clone(profileTree().profiles.default) } });
    const target = await device(profileTree({ profiles: { default: profileTree().profiles.default } }));
    await target.io.importV3({ meta: { version: 3, application: 'FilterTube', exportType: 'full' }, profilesV4: appTree }, { strategy: 'replace', scope: 'full' });
    const loaded = await target.settings.loadSettings();
    assert.equal(loaded.skipBlockedAutoplay, true);
    assert.equal(Object.prototype.hasOwnProperty.call(target.tree().profiles.default.settings, 'skipBlockedAutoplay'), false);
});

test('theme "system" is stored, exported and imported as itself; no theme leaves the local one alone', async () => {
    const one = await device(profileTree(), { ftThemePreference: 'dark' });
    await one.settings.setThemePreference('system');
    assert.equal(one.storage.ftThemePreference, 'system');
    const loaded = await one.settings.loadSettings();
    assert.equal(loaded.themePreference, 'system');
    assert.equal(loaded.themeSource, 'system');
    assert.ok(['dark', 'light'].includes(loaded.theme));
    const backup = await one.io.exportV3({ scope: 'full' });
    assert.equal(backup.settings.theme, 'system');

    const two = await device(profileTree(), { ftThemePreference: 'dark' });
    await two.io.importV3(clone(backup), { strategy: 'merge', scope: 'full' });
    assert.equal(two.storage.ftThemePreference, 'system');

    const noTheme = clone(backup);
    delete noTheme.settings.theme;
    delete noTheme.integrity;
    delete noTheme.profilesV4.appPreferences.extension.ftThemePreference;
    const three = await device(profileTree(), { ftThemePreference: 'dark' });
    await three.io.importV3(noTheme, { strategy: 'merge', scope: 'full' });
    assert.equal(three.storage.ftThemePreference, 'dark');
});

test('kids.languageFilters is a valid personal-sync key', () => {
    const box = { console, TextEncoder, TextDecoder };
    box.window = box; vm.createContext(box);
    vm.runInContext(read('personal_sync'), box);
    const sync = box.FilterTubePersonalSync;
    const profile = vm.runInContext('({ settings: {}, main: {}, kids: { languageFilters: { enabled: true, mode: "block", selected: ["hi"] } } })', box);
    const snapshot = sync.snapshotSettings(profile);
    assert.deepEqual(clone(snapshot.kids.languageFilters), { enabled: true, mode: 'block', selected: ['hi'] });
});

test('export -> import -> export keeps unknown keys at every level and the other platforms\' app preferences', async () => {
    const tree = profileTree({ appThemeMode: 'system', futureRoot: { a: 1 } });
    tree.appPreferences = {
        format: 'filtertube-app-preferences', version: 1,
        android: { filtertube_player: { speed: 1.5 }, filtertube_icon: { icon: 'kriti' } },
        ios: { 'filtertube.sangeet.shuffle': true }
    };
    const kid = tree.profiles.kid;
    kid.futureProfile = 'p';
    kid.settings.futureSetting = { x: [1, 2] };
    kid.main.futureMain = 'm';
    kid.kids.futureKids = false;
    kid.study = { version: 1, activePackIds: [], futureStudy: 's' };
    const storage = { ftUiSounds: 'quiet', ftCompanionMode: 'kriti', ftUiLocalePreference: 'hi', ftRuleListUrlAutoCheckLastRun: 123,
        ftNanahManagedSigningKeyPair: { secret: true } };
    const source = await device(tree, storage);
    const first = clone(await source.io.exportV3({ scope: 'full' }));
    assert.deepEqual(first.profilesV4.appPreferences.android, tree.appPreferences.android);
    assert.deepEqual(first.profilesV4.appPreferences.ios, tree.appPreferences.ios);
    assert.deepEqual(first.profilesV4.appPreferences.extension,
        { ftUiLocalePreference: 'hi', ftUiSounds: 'quiet', ftCompanionMode: 'kriti', ftRuleListUrlAutoCheckLastRun: 123 });
    assert.ok(!JSON.stringify(first).includes('device-secret'), 'no device ID');
    assert.ok(!JSON.stringify(first).includes('SigningKeyPair'), 'no signing keys');

    for (const strategy of ['replace', 'merge']) {
        const target = await device(profileTree({ profiles: { default: profileTree().profiles.default } }), { ftUiSounds: 'off', ftRuleListUrlAutoCheckLastRun: 5 });
        await target.io.importV3(clone(first), { strategy, scope: 'full' });
        assert.equal(target.storage.ftUiSounds, 'quiet', strategy);
        assert.equal(target.storage.ftUiLocalePreference, 'hi', strategy);
        assert.equal(target.storage.ftRuleListUrlAutoCheckLastRun, 5, `${strategy}: device-bound key not applied`);
        assert.equal(target.storage.ftNanahDeviceId, 'device-secret');
        const second = clone(await target.io.exportV3({ scope: 'full' }));
        const p1 = first.profilesV4, p2 = second.profilesV4;
        assert.deepEqual(p2.futureRoot, { a: 1 }, strategy);
        assert.equal(p2.appThemeMode, 'system', strategy);
        assert.deepEqual(p2.appPreferences.android, p1.appPreferences.android, strategy);
        assert.deepEqual(p2.appPreferences.ios, p1.appPreferences.ios, strategy);
        const k2 = p2.profiles.kid;
        assert.equal(k2.futureProfile, 'p', strategy);
        assert.deepEqual(k2.settings.futureSetting, { x: [1, 2] }, strategy);
        assert.equal(k2.main.futureMain, 'm', strategy);
        assert.equal(k2.kids.futureKids, false, strategy);
        assert.equal(k2.study.futureStudy, 's', strategy);
    }
});
