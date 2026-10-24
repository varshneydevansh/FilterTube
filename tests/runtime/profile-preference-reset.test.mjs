import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const api = require('../../js/profile_preference_defaults.js');
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
function profile(type = 'account', owner = null) {
    return { type, parentProfileId: owner, name: type === 'child' ? 'Mira' : 'Parent', security: { profilePinVerifier: { hash: 'private-pin' } },
        settings: { ...api.defaults(), hideShorts: true, disableAutoplay: true, enabled: false, syncKidsToMain: true,
            allowMainViewing: false, allowKidsViewing: true, contentFilters: { views: { enabled: true, minViews: 5000 } },
            categoryFilters: { enabled: true, selected: ['music'] }, languageFilters: { enabled: true, selected: ['hi'] },
            timeLimitPolicy: { enabled: true, dailyBudgetSeconds: 900, policyRevision: 5 }, unknownPreference: 'retain', autoBackupEnabled: true },
        main: { mode: 'whitelist', whitelistChannels: [{ id: 'UC_allowed' }], channels: [{ id: 'UC_blocked' }], keywords: [{ word: 'blocked' }] },
        kids: { mode: 'whitelist', strictMode: true, blockedKeywords: [{ word: 'kids rule' }], contentFilters: { views: { enabled: true, minViews: 6000 } } },
        managedPolicyState: { remoteManagedPolicies: { link: { kids: { revision: 5, policyHash: 'saved' } } } }, managedActionHistory: [{ action: 'approved-policy' }] };
}
async function fixture({ child = false } = {}) {
    const data = { ftProfilesV4: { schemaVersion: 4, activeProfileId: 'parent', security: { rootPolicy: 'preserved' }, profiles: {
        default: profile(), parent: profile(), child: profile('child', 'parent'), sibling: profile('child', 'parent'), otherParent: profile()
    } }, ftSavedVideoNotesV1: { protectedNotes: ['keep me'] }, ftNanahTrustedLinks: [{ linkId: 'verified', privateState: 'keep' }],
        ftDeviceAutoSyncV1: { version: 1, managed: [], personal: [{ label: 'Tablet • My profile', privateKeyJwk: { d: 'private-sync-key' },
            grant: { enabled: true, localProfileId: 'parent', remoteDeviceId: 'tablet', remoteProfileId: 'tablet-account', areas: ['settings', 'notes'], localGeneration: 'one' } }] },
        ftManagedTimeUsageV1: { child: { consumedSeconds: 90 } }, ftSelfControlSessionV1: null, unrelated: 'keep' };
    const calls = { writes: [], confirms: [], guards: 0, unlocks: 0 };
    const flags = { unlocked: true, approve: true, unlockApprove: true, failure: null };
    const hooks = { confirm: null, unlock: null, guard: null, read: null };
    const scope = { value: child ? { profileId: 'child', surface: 'kids' } : null };
    const box = { console, Date, crypto: globalThis.crypto, TextEncoder, TextDecoder,
        chrome: { runtime: { lastError: null }, storage: { local: {
            get(keys, done) { const result = keys == null ? clone(data) : Object.fromEntries(keys.filter(key => Object.hasOwn(data, key)).map(key => [key, clone(data[key])])); done(result); },
            set(values, done) {
                calls.writes.push(clone(values));
                if (flags.failure === 'quota') box.chrome.runtime.lastError = { message: 'Quota exceeded' };
                else if (flags.failure !== 'drop') Object.assign(data, clone(values));
                done?.(); box.chrome.runtime.lastError = null;
            }
        } } }
    };
    box.window = box; vm.createContext(box);
    for (const name of ['managed_admin_authority', 'settings_shared', 'io_manager']) vm.runInContext(read(name), box);
    const authority = box.FilterTubeManagedAdminAuthority;
    let tail = Promise.resolve();
    const deps = {
        read: async () => {
            await hooks.read?.();
            return { root: await box.FilterTubeIO.loadProfilesV4(), legacy: Object.fromEntries(api.legacyKeys.filter(key => Object.hasOwn(data, key)).map(key => [key, data[key]])),
                sync: clone(data.ftDeviceAutoSyncV1), session: clone(data.ftSelfControlSessionV1) };
        },
        selection: root => ({ actorProfileId: root.activeProfileId, targetProfileId: scope.value?.profileId || root.activeProfileId, scope: scope.value }),
        authorized: (root, selected) => flags.unlocked && authority.canActorManageProfile(root, selected).allowed,
        unlock: async () => { calls.unlocks++; await hooks.unlock?.(); return flags.unlockApprove; },
        guard: async () => {
            calls.guards++; await hooks.guard?.();
            if (data.ftSelfControlSessionV1?.active && data.ftSelfControlSessionV1.lockedUntil > Date.now()) throw Error('session_locked');
        },
        withLock: work => { const result = tail.then(work); tail = result.catch(() => {}); return result; },
        save: root => box.FilterTubeIO.saveProfilesV4(root),
        confirm: async preview => { calls.confirms.push(clone(preview)); await hooks.confirm?.(); return flags.approve; }
    };
    return { data, calls, flags, hooks, scope, box, deps, controller: api.create(deps), create: () => api.create(deps) };
}

// The existing state and profile loaders remain the authority for default values.
test('every shared reset key matches actual initial state and actual account/child creation load defaults', async () => {
    const stateSource = read('state_manager'), start = stateSource.indexOf('    let state = {'), end = stateSource.indexOf('    const channelEnrichmentAttempted', start);
    const initial = vm.runInNewContext(stateSource.slice(start, end) + '\nstate;');
    for (const { key, value } of api.entries) assert.equal(initial[key], value, key + ' initial state');
    const tab = read('tab-view');
    for (const marker of ["type: 'account',\n                parentProfileId: null,\n                name,", "type: 'child',\n                parentProfileId: currentActive,\n                name,"]) {
        const middle = tab.indexOf(marker), a = tab.lastIndexOf('profiles[candidate] = {', middle), b = tab.indexOf('\n            };', middle);
        assert.ok(a > 0 && b > a);
        const created = vm.runInNewContext('(' + tab.slice(a + 'profiles[candidate] = '.length, b) + '\n})', {
            window: { FilterTubeProfilePreferenceDefaults: api }, name: 'Created', currentActive: 'parent', autoBackupEnabled: false, autoBackupMode: 'latest', autoBackupFormat: 'auto'
        });
        const f = await fixture(); f.data.ftProfilesV4.profiles.parent = clone(created);
        const loaded = await f.box.FilterTubeSettings.loadSettings();
        for (const { key, value } of api.entries) assert.equal(loaded[key], value, `${created.type} ${key}`);
    }
});

test('ordinary reset allowlist excludes master filtering, rules, restrictions, trust and family/time policy', () => {
    const keys = Object.keys(api.defaults()); assert.equal(keys.length, 32);
    for (const key of ['enabled', 'syncKidsToMain', 'mode', 'strictMode', 'contentFilters', 'categoryFilters', 'languageFilters', 'autoBackupEnabled',
        'allowMainViewing', 'allowKidsViewing', 'defaultLaunchTarget', 'timeLimitPolicy', 'security', 'parentProfileId', 'notes', 'managedPolicyState']) assert.equal(keys.includes(key), false, key);
    const one = api.defaults(); one.hideShorts = true; assert.equal(api.defaults().hideShorts, false);
});

for (const child of [false, true]) test(`restoring ${child ? 'parent-scoped child' : 'own account'} preferences preserves every unrelated field and storage area`, async () => {
    const f = await fixture({ child }), before = clone(f.data), target = child ? 'child' : 'parent';
    const result = await f.controller.restore();
    assert.deepEqual(result, { status: 'restored', profileId: target, changedCount: 2 });
    const expected = clone(before); Object.assign(expected.ftProfilesV4.profiles[target].settings, api.defaults());
    assert.deepEqual(f.data, expected); assert.equal(f.calls.writes.length, 1);
    assert.deepEqual(Object.keys(f.calls.writes[0]), ['ftProfilesV4']);
    assert.equal(f.calls.confirms[0].profileId, target); assert.equal(f.calls.confirms[0].changes.length, 2);
    assert.equal(f.calls.confirms[0].devices.length, child ? 0 : 1);
    assert.equal(JSON.stringify(f.calls.confirms).includes('private-sync-key'), false);
    assert.equal(JSON.stringify(f.calls.confirms).includes('private-pin'), false);
});

test('cancelling confirmation or sensitive unlock performs no save', async () => {
    const f = await fixture(), before = clone(f.data); f.flags.approve = false;
    assert.equal((await f.controller.restore()).status, 'cancelled'); assert.deepEqual(f.data, before); assert.deepEqual(f.calls.writes, []);
    f.flags.unlockApprove = false; f.flags.approve = true;
    assert.equal((await f.controller.restore()).status, 'cancelled'); assert.equal(f.calls.confirms.length, 1); assert.deepEqual(f.calls.writes, []);
});

test('an already-default profile is a no-op without a confirmation or save', async () => {
    const f = await fixture(); Object.assign(f.data.ftProfilesV4.profiles.parent.settings, api.defaults());
    assert.equal((await f.controller.restore()).status, 'noop'); assert.equal(f.calls.confirms.length, 0); assert.deepEqual(f.calls.writes, []);
});

test('missing profile preferences follow actual legacy fallbacks without resurrecting stale V4 comments', async () => {
    const f = await fixture(); delete f.data.ftProfilesV4.profiles.parent.settings.hideShorts; delete f.data.ftProfilesV4.profiles.parent.settings.hideComments;
    Object.assign(f.data.ftProfilesV4.profiles.parent.settings, { disableAutoplay: false });
    f.data.hideAllShorts = true; f.data.hideAllComments = true;
    assert.equal((await f.controller.restore()).changedCount, 2);
    assert.deepEqual(f.calls.confirms[0].changes.map(row => row.key), ['hideShorts', 'hideComments']);
    const loaded = await f.box.FilterTubeSettings.loadSettings(); assert.equal(loaded.hideShorts, false); assert.equal(loaded.hideComments, false);
});

for (const [name, mutate] of [
    ['active account', f => { f.data.ftProfilesV4.activeProfileId = 'otherParent'; }],
    ['child selected as actor', f => { f.data.ftProfilesV4.activeProfileId = 'child'; }],
    ['target removed', f => { delete f.data.ftProfilesV4.profiles.parent; }],
    ['target preference', f => { f.data.ftProfilesV4.profiles.parent.settings.hideHomeFeed = true; }],
    ['target rules', f => { f.data.ftProfilesV4.profiles.parent.main.channels.push({ id: 'UC_new' }); }],
    ['actor PIN', f => { f.data.ftProfilesV4.profiles.parent.security.profilePinVerifier.hash = 'rotated'; }],
    ['sensitive unlock expires', f => { f.flags.unlocked = false; }],
    ['legacy fallback', f => { f.data.hideHomeFeed = true; }],
    ['Settings Auto-sync newly enabled', f => { f.data.ftDeviceAutoSyncV1.personal.push({ label: 'New phone', grant: { enabled: true, localProfileId: 'parent', remoteDeviceId: 'phone', remoteProfileId: 'phone-profile', areas: ['settings'] } }); }],
    ['Settings Auto-sync generation', f => { f.data.ftDeviceAutoSyncV1.personal[0].grant.localGeneration = 'new-consent'; }]
]) test(`${name} changing during confirmation cancels the stale reset`, async () => {
    const f = await fixture(); f.hooks.confirm = () => mutate(f);
    await assert.rejects(f.controller.restore(), /profile_changed/); assert.deepEqual(f.calls.writes, []);
});

for (const [name, mutate] of [
    ['child owner', f => { f.data.ftProfilesV4.profiles.child.parentProfileId = 'otherParent'; }],
    ['selected child scope', f => { f.scope.value = { profileId: 'sibling', surface: 'kids' }; }],
    ['reopened edit scope', f => { f.scope.value = { ...f.scope.value }; }],
    ['in-place edit surface', f => { f.scope.value.surface = 'main'; }],
    ['parent PIN', f => { f.data.ftProfilesV4.profiles.parent.security.profilePinVerifier.hash = 'new-pin'; }]
]) test(`${name} changing during a parent-scoped reset is rejected`, async () => {
    const f = await fixture({ child: true }); f.hooks.confirm = () => mutate(f);
    await assert.rejects(f.controller.restore(), /profile_changed/); assert.deepEqual(f.calls.writes, []);
});

test('a child cannot restore its own or its sibling preferences', async () => {
    for (const selected of [null, { profileId: 'sibling' }]) {
        const f = await fixture(); f.data.ftProfilesV4.activeProfileId = 'child'; f.scope.value = selected;
        await assert.rejects(f.controller.restore(), /profile_changed/); assert.deepEqual(f.calls.writes, []);
    }
});

test('one parent cannot reset another parent or an unowned child', async () => {
    for (const selected of ['otherParent', 'child']) {
        const f = await fixture(); f.scope.value = { profileId: selected };
        if (selected === 'child') f.data.ftProfilesV4.profiles.child.parentProfileId = 'otherParent';
        await assert.rejects(f.controller.restore(), /profile_changed/); assert.deepEqual(f.calls.writes, []);
    }
});

for (const kind of ['self_control', 'hard_whitelist']) test(`active ${kind} sessions deny reset and preserve the complete frozen record`, async () => {
    const f = await fixture(); f.data.ftSelfControlSessionV1 = { active: true, lockedUntil: Date.now() + 60000, sessionKind: kind, frozen: { privateSnapshot: 'unchanged' } };
    const before = clone(f.data); await assert.rejects(f.controller.restore(), /session_locked/); assert.deepEqual(f.data, before); assert.deepEqual(f.calls.writes, []);
});

test('a timer activated during consent blocks the reset without changing its saved snapshot', async () => {
    const f = await fixture(); f.hooks.confirm = () => { f.data.ftSelfControlSessionV1 = { active: true, lockedUntil: Date.now() + 60000, sessionKind: 'hard_whitelist' }; };
    await assert.rejects(f.controller.restore(), /session_locked/); assert.deepEqual(f.calls.writes, []);
});

for (const failure of ['quota', 'drop']) test(`actual IO ${failure} cannot report a restored result`, async () => {
    const f = await fixture(), before = clone(f.data); f.flags.failure = failure;
    await assert.rejects(f.controller.restore(), new RegExp(failure === 'quota' ? 'save_failed' : 'readback_failed'));
    assert.deepEqual(f.data, before);
});

test('two tabs with the same confirmation snapshot serialize and the second cannot overwrite the first', async () => {
    const f = await fixture(), second = f.create(), gate = deferred();
    f.hooks.confirm = () => gate.promise;
    const first = f.controller.restore(), other = second.restore();
    while (f.calls.confirms.length < 2) await new Promise(resolve => setImmediate(resolve));
    gate.resolve(); const result = await Promise.allSettled([first, other]);
    assert.equal(result.filter(row => row.status === 'fulfilled' && row.value.status === 'restored').length, 1);
    assert.equal(result.filter(row => row.status === 'rejected' && row.reason.code === 'profile_changed').length, 1);
    assert.equal(f.calls.writes.length, 1);
});

test('double activation in one tab opens only one confirmation', async () => {
    const f = await fixture(), gate = deferred(); f.hooks.confirm = () => gate.promise;
    const first = f.controller.restore(); assert.equal((await f.controller.restore()).status, 'busy');
    while (!f.calls.confirms.length) await new Promise(resolve => setImmediate(resolve));
    gate.resolve(); assert.equal((await first).status, 'restored'); assert.equal(f.calls.confirms.length, 1);
});

test('a simultaneous edit to another profile is retained by the fresh locked write', async () => {
    const f = await fixture(); f.hooks.confirm = () => { f.data.ftProfilesV4.profiles.sibling.kids.blockedKeywords.push({ word: 'added elsewhere' }); };
    assert.equal((await f.controller.restore()).status, 'restored');
    assert.equal(f.data.ftProfilesV4.profiles.sibling.kids.blockedKeywords.at(-1).word, 'added elsewhere');
});

test('authorization is rechecked after the final asynchronous guard', async () => {
    const f = await fixture(); f.hooks.guard = () => { if (f.calls.guards === 3) f.flags.unlocked = false; };
    await assert.rejects(f.controller.restore(), /profile_changed/); assert.deepEqual(f.calls.writes, []);
});

test('unlock-side audit history can be preserved while changed PIN authority is still rejected', async () => {
    const f = await fixture(); f.hooks.unlock = () => { f.data.ftProfilesV4.profiles.parent.managedActionHistory.push({ action: 'unlock' }); };
    assert.equal((await f.controller.restore()).status, 'restored');
    assert.equal(f.data.ftProfilesV4.profiles.parent.managedActionHistory.at(-1).action, 'unlock');
    const g = await fixture(); g.hooks.unlock = () => { g.data.ftProfilesV4.profiles.parent.security.profilePinVerifier.hash = 'new-pin'; };
    await assert.rejects(g.controller.restore(), /profile_changed/); assert.deepEqual(g.calls.writes, []);
});

for (const [legacyKey, legacyValue, profileKey] of [
    ['hideHomeFeed', 'true', 'hideHomeFeed'], ['hideAllShorts', 1, 'hideShorts'], ['hideSponsoredCards', 'false', 'hideSponsoredCards']
]) test(`real loader truthy legacy ${legacyKey} is replaced by explicit canonical profile defaults`, async () => {
    const f = await fixture(); f.data.ftProfilesV4.profiles.parent.settings = {}; f.data[legacyKey] = legacyValue;
    const before = await f.box.FilterTubeSettings.loadSettings();
    assert.equal(before[profileKey], true);
    // Loading settings itself materializes legacy fields; exercise a still-sparse V4 profile at reset entry.
    f.data.ftProfilesV4.profiles.parent.settings = {};
    assert.equal((await f.controller.restore()).changedCount, 32);
    const after = await f.box.FilterTubeSettings.loadSettings();
    for (const { key, value } of api.entries) {
        assert.equal(f.data.ftProfilesV4.profiles.parent.settings[key], value, key + ' canonical explicit field');
        assert.equal(after[key], value, key + ' actual loaded value');
    }
    assert.equal((await f.controller.restore()).status, 'noop');
});

test('noncanonical values are materialized even if they currently look like the default', async () => {
    const f = await fixture(); Object.assign(f.data.ftProfilesV4.profiles.parent.settings, api.defaults());
    f.data.ftProfilesV4.profiles.parent.settings.hideHomeFeed = ''; f.data.ftProfilesV4.profiles.parent.settings.contentOnlyPlayback = 'true';
    assert.equal((await f.controller.restore()).changedCount, 2);
    assert.equal(f.data.ftProfilesV4.profiles.parent.settings.hideHomeFeed, false);
    assert.equal(f.data.ftProfilesV4.profiles.parent.settings.contentOnlyPlayback, true);
});

async function dashboard({ promiseApi = false, child = false } = {}) {
    const f = await fixture({ child }), box = f.box, tab = read('tab-view');
    const lockEvents = [], held = new Set(), tails = new Map();
    box.navigator = { locks: { request(name, _, work) {
        const result = (tails.get(name) || Promise.resolve()).then(async () => {
            held.add(name); lockEvents.push('enter:' + name);
            try { return await work({ name }); } finally { lockEvents.push('leave:' + name); held.delete(name); }
        });
        tails.set(name, result.catch(() => {})); return result;
    } } };
    vm.runInContext(read('nanah_storage_lock'), box);
    const button = { disabled: false, focusCount: 0, focus() { this.focusCount++; }, addEventListener(_, work) { this.activate = work; } };
    Object.assign(box, {
        FilterTubeProfilePreferenceDefaults: api, profilesV4Cache: clone(f.data.ftProfilesV4), activeProfileId: 'parent',
        managedChildEdit: f.scope.value, ftRestorePreferencesBtn: button, ftPreferenceDefaultsTarget: { textContent: '' },
        profilePreferenceReset: null, isRestoringProfilePreferences: false,
        safeObject: value => value && typeof value === 'object' && !Array.isArray(value) ? value : {},
        normalizeString: value => typeof value === 'string' ? value.trim() : '',
        getProfileType: box.FilterTubeManagedAdminAuthority.getProfileType,
        getActiveProfileType: () => box.FilterTubeManagedAdminAuthority.getProfileType(f.data.ftProfilesV4, f.data.ftProfilesV4.activeProfileId),
        canActiveProfileManageProfile: (root, id) => box.FilterTubeManagedAdminAuthority.canActorManageProfile(root, { targetProfileId: id }).allowed,
        extractMasterPinVerifier: root => root.profiles.default.security.profilePinVerifier,
        extractProfilePinVerifier: (root, id) => root.profiles[id]?.security?.profilePinVerifier,
        isProfileLocked: () => true, isProfileUnlockSessionValid: { check: () => f.flags.unlocked },
        ensureProfileUnlocked: async () => { await f.hooks.unlock?.(); return f.flags.unlockApprove; },
        isSelfControlSessionActive: () => f.data.ftSelfControlSessionV1?.active === true && f.data.ftSelfControlSessionV1.lockedUntil > Date.now(),
        sendRuntimeMessage: async () => {
            f.calls.guards++; await f.hooks.guard?.();
            return { ok: true, active: box.isSelfControlSessionActive() };
        },
        tabViewUiText: (_, fallback, values = {}) => fallback.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match),
        showChoiceModal: async options => { f.calls.confirms.push(clone(options)); await f.hooks.confirm?.(); return f.flags.approve ? 'restore' : null; },
        UIComponents: { showToast: (...args) => { (f.calls.toasts ||= []).push(args); } },
        StateManager: { loadSettings: async () => { f.calls.refreshes = (f.calls.refreshes || 0) + 1; } },
        refreshProfilesUI: async () => { box.profilesV4Cache = await box.FilterTubeIO.loadProfilesV4(); }, updateCheckboxes() {}
    });
    if (promiseApi) box.browser = { runtime: box.chrome.runtime, storage: { local: { get: async keys => {
        f.calls.promiseReads = (f.calls.promiseReads || 0) + 1;
        return Object.fromEntries(keys.filter(key => Object.hasOwn(f.data, key)).map(key => [key, clone(f.data[key])]));
    } } } };
    const capture = tab.slice(tab.indexOf('    function captureProfileMutationAuthorization('), tab.indexOf('    async function loadAuthorizedProfileMutationRoot('));
    const adapter = tab.slice(tab.indexOf('    function preferenceResetSelection('), tab.indexOf('    async function updateProfileViewingAccess('));
    vm.runInContext(capture + '\n' + adapter, box);
    return { ...f, button, held, lockEvents };
}

for (const promiseApi of [false, true]) test(`actual dashboard ${promiseApi ? 'Firefox promise' : 'Chrome callback'} reset adapter confirms exact target, holds both locks, and verifies storage`, async () => {
    const f = await dashboard({ promiseApi }), before = clone(f.data);
    const write = f.box.chrome.storage.local.set;
    f.box.chrome.storage.local.set = (...args) => {
        assert.equal(f.held.has('filtertube-auto-sync-v1'), true);
        assert.equal(f.held.has('filtertube-nanah-trusted-storage-v1'), true); return write(...args);
    };
    await f.box.restoreProfilePreferences();
    assert.equal(f.calls.confirms[0].focusCancel, true);
    assert.match(f.calls.confirms[0].message, /Parent \(parent\)/);
    assert.ok(f.calls.confirms[0].details.some(line => line.includes('Tablet • My profile')));
    assert.ok(f.calls.confirms[0].details.some(line => line.includes('32') || line.includes('without a saved value')));
    assert.deepEqual(f.lockEvents.slice(0, 2), ['enter:filtertube-auto-sync-v1', 'enter:filtertube-nanah-trusted-storage-v1']);
    assert.equal(f.calls.toasts.at(-1)[1], 'success'); assert.equal(f.button.focusCount, 1);
    assert.equal(f.data.ftProfilesV4.profiles.parent.settings.hideShorts, false);
    assert.deepEqual(f.data.ftDeviceAutoSyncV1, before.ftDeviceAutoSyncV1);
    assert.deepEqual(f.data.ftProfilesV4.profiles.child, before.ftProfilesV4.profiles.child);
    if (promiseApi) assert.ok(f.calls.promiseReads > 0);
});

test('actual scoped dashboard selection names the child while its parent remains active and protects child safety fields', async () => {
    const f = await dashboard({ child: true }), before = clone(f.data);
    f.box.updatePreferenceDefaultsControls(); assert.match(f.box.ftPreferenceDefaultsTarget.textContent, /Mira \(child\)/);
    await f.box.restoreProfilePreferences();
    assert.match(f.calls.confirms[0].message, /Mira \(child\)/); assert.equal(f.data.ftProfilesV4.activeProfileId, 'parent');
    assert.equal(f.data.ftProfilesV4.profiles.child.settings.hideShorts, false);
    assert.deepEqual(f.data.ftProfilesV4.profiles.parent, before.ftProfilesV4.profiles.parent);
    assert.deepEqual(f.data.ftProfilesV4.profiles.child.settings.timeLimitPolicy, before.ftProfilesV4.profiles.child.settings.timeLimitPolicy);
});

test('actual dashboard refuses a newly enabled Settings link during its review instead of sending an unpreviewed reset', async () => {
    const f = await dashboard(); f.hooks.confirm = () => { f.data.ftDeviceAutoSyncV1.personal.push({ label: 'New phone', grant: {
        enabled: true, localProfileId: 'parent', remoteDeviceId: 'phone', remoteProfileId: 'new-profile', areas: ['settings'] } }); };
    await f.box.restoreProfilePreferences(); assert.equal(f.calls.writes.length, 0);
    assert.equal(f.calls.toasts.at(-1)[1], 'warning'); assert.equal(f.data.ftProfilesV4.profiles.parent.settings.hideShorts, true);
});

test('actual dashboard holds the enrollment lock through final check/save/readback so another tab cannot enroll mid-reset', async () => {
    const f = await dashboard(); let enrollment = null, enrolled = false;
    f.hooks.guard = () => {
        if (!enrollment && f.held.has('filtertube-auto-sync-v1')) {
            enrollment = f.box.navigator.locks.request('filtertube-auto-sync-v1', { mode: 'exclusive' }, () => { enrolled = true; });
            assert.equal(enrolled, false);
        }
    };
    const save = f.box.chrome.storage.local.set;
    f.box.chrome.storage.local.set = (...args) => { assert.equal(enrolled, false); save(...args); };
    await f.box.restoreProfilePreferences(); await enrollment;
    assert.equal(enrolled, true); assert.equal(f.calls.toasts.at(-1)[1], 'success');
});

test('actual dashboard rejects an in-place scoped-surface change while its confirmation is open', async () => {
    const f = await dashboard({ child: true }); f.hooks.confirm = () => { f.box.managedChildEdit.surface = 'main'; };
    await f.box.restoreProfilePreferences(); assert.equal(f.calls.writes.length, 0); assert.equal(f.calls.toasts.at(-1)[1], 'warning');
});

for (const reason of ['quota', 'drop', 'session']) test(`actual dashboard ${reason} does not display success or overwrite protections`, async () => {
    const f = await dashboard(), before = clone(f.data);
    if (reason === 'session') f.hooks.confirm = () => { f.data.ftSelfControlSessionV1 = { active: true, lockedUntil: Date.now() + 60000, sessionKind: 'hard_whitelist' }; };
    else f.flags.failure = reason;
    await f.box.restoreProfilePreferences(); assert.equal(f.calls.toasts.at(-1)[1], 'warning');
    assert.deepEqual(f.data.ftProfilesV4, before.ftProfilesV4);
});

test('the Settings control has a named target, translated copy and loads the shared helper before the dashboard', () => {
    const html = fs.readFileSync(new URL('../../html/tab-view.html', import.meta.url), 'utf8');
    const copy = JSON.parse(fs.readFileSync(new URL('../../data/ui_locales/en.json', import.meta.url), 'utf8'));
    assert.match(html, /id="ftRestorePreferencesBtn"[^>]+aria-describedby="ftPreferenceDefaultsTarget"/);
    assert.ok(html.indexOf('../js/profile_preference_defaults.js') < html.indexOf('../js/tab-view.js'));
    for (const key of html.matchAll(/data-ft-i18n="(dashboard\.preferences\.[^"]+)"/g)) assert.equal(typeof copy[key[1]], 'string');
});

test('a timer starting during sensitive unlock is checked before presenting reset consent', async () => {
    const f = await fixture(); f.hooks.unlock = () => { f.data.ftSelfControlSessionV1 = { active: true, lockedUntil: Date.now() + 60000, sessionKind: 'hard_whitelist' }; };
    await assert.rejects(f.controller.restore(), /session_locked/); assert.deepEqual(f.calls.writes, []); assert.deepEqual(f.calls.confirms, []);
});

test('parent PIN rotation before child-reset readback cannot produce a verified success result', async () => {
    const f = await fixture({ child: true }); f.hooks.read = () => {
        if (f.calls.writes.length) f.data.ftProfilesV4.profiles.parent.security.profilePinVerifier.hash = 'new-parent-pin';
    };
    await assert.rejects(f.controller.restore(), /profile_changed/);
    assert.equal(f.data.ftProfilesV4.profiles.parent.security.profilePinVerifier.hash, 'new-parent-pin');
});

test('the dashboard fails closed when its default helper or secure lock support is unavailable', async () => {
    for (const missing of ['helper', 'locks']) {
        const f = await dashboard();
        if (missing === 'helper') delete f.box.FilterTubeProfilePreferenceDefaults;
        else delete f.box.navigator.locks;
        await f.box.restoreProfilePreferences(); assert.deepEqual(f.calls.writes, []); assert.equal(f.calls.toasts.at(-1)[1], 'warning');
    }
});
