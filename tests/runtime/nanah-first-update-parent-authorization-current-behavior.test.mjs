import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const tab = fs.readFileSync(new URL('../../js/tab-view.js', import.meta.url), 'utf8');
const adapter = fs.readFileSync(new URL('../../js/nanah_sync_adapter.js', import.meta.url), 'utf8');
const settingsSource = fs.readFileSync(new URL('../../js/settings_shared.js', import.meta.url), 'utf8');
const ioSource = fs.readFileSync(new URL('../../js/io_manager.js', import.meta.url), 'utf8');
const clone = value => JSON.parse(JSON.stringify(value));
function section(start, end) {
  const a = tab.indexOf(start), b = tab.indexOf(end, a);
  assert.ok(a > 0 && b > a, start);
  return tab.slice(a, b);
}
function fixture({ active = 'child-a', target = 'child-a', parentApproval = true, modalMutation = null, realImport = false, importMutation = null, approvedTarget = target } = {}) {
  const account = () => ({ type: 'account', settings: {}, main: { keywords: [], channels: [] }, kids: {} });
  let stored = { schemaVersion: 4, activeProfileId: active, profiles: {
    default: account(), 'parent-a': account(), 'parent-b': account(),
    'child-a': { ...account(), type: 'child', parentProfileId: 'parent-a' },
    'child-b': { ...account(), type: 'child', parentProfileId: 'parent-b' }
  } };
  const calls = { unlocks: [], decisions: [], writes: 0, modals: 0, trustWrites: 0, compiledWrites: 0 };
  const io = {
    exportV3: async () => ({}), importV3: async () => { throw new Error('unexpected import'); },
    loadProfilesV4: async () => stored,
    saveProfilesV4: async next => { stored = next; calls.writes += 1; }
  };
  const box = { console, FilterTubeIO: io, Date, JSON, Math, TextEncoder, setTimeout, clearTimeout };
  box.window = box;
  installNanahStorageLock(box);
  if (realImport) {
    const storage = { ftProfilesV4: clone(stored), ftProfilesV3: { main: {}, kids: {} } };
    const runtime = { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) };
    box.chrome = { runtime, storage: { local: {
      get(keys, done) {
        const result = keys == null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]));
        done(result);
      },
      set(payload, done) { if (payload.ftProfilesV4) calls.writes += 1; Object.assign(storage, clone(payload)); stored = storage.ftProfilesV4; done?.(); },
      remove(keys, done) { keys.forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } };
    vm.runInNewContext(settingsSource, box);
    const actualLoadSettings = box.FilterTubeSettings.loadSettings;
    const actualSaveSettings = box.FilterTubeSettings.saveSettings;
    // Complete the existing settings-default migration before measuring a sync.
    // This fixture's storage callbacks are synchronous, so this primes the data now.
    void actualLoadSettings();
    calls.writes = 0;
    box.FilterTubeSettings = {
      ...box.FilterTubeSettings,
      loadSettings: async () => {
        const current = await actualLoadSettings();
        importMutation?.(storage.ftProfilesV4);
        stored = storage.ftProfilesV4;
        return current;
      },
      saveSettings: async payload => { calls.compiledWrites += 1; return actualSaveSettings(payload); }
    };
    vm.runInNewContext(ioSource, box);
    const actualImport = box.FilterTubeIO.importV3;
    // Use the real import and its pre-write callback; keep loads uncached so the
    // test independently observes ownership changes during awaited import work.
    box.FilterTubeIO = { ...box.FilterTubeIO, loadProfilesV4: async () => clone(storage.ftProfilesV4), importV3: actualImport };
    stored = storage.ftProfilesV4;
    box.__storage = storage;
  }
  vm.runInNewContext(adapter, box);
  Object.assign(box, {
    profilesV4Cache: stored, activeProfileId: active, sessionMasterPin: '',
    nanahSessionState: { remoteDevice: { deviceId: 'synthetic-untrusted-device' }, remoteRole: 'source' }, nanahClient: null,
    safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, safeArray: x => Array.isArray(x) ? x : [], normalizeString: x => typeof x === 'string' ? x.trim() : '',
    getActiveProfileType: () => stored.profiles[active]?.type,
    getProfileType: (r, id) => r.profiles[id]?.type,
    getProfileName: (_, id) => id, getParentAccountId: (r, id) => r.profiles[id]?.parentProfileId || id,
    canActiveProfileManageProfile: (r, id) => r.activeProfileId === 'default' || r.activeProfileId === r.profiles[id]?.parentProfileId,
    getNanahRole: () => 'replica', findNanahTrustedLink: () => null, getNanahCurrentTrustedLink: () => null,
    normalizeNanahTrustedLink: x => x, normalizeNanahProfileContext: x => x || {}, getNanahTargetProfileBehavior: (v, f) => v || f,
    getNanahScopeList: x => Array.isArray(x) ? x : [x], getNanahLocalProfileContext: () => ({ profileId: active, profileName: active }),
    getNanahRemoteLabel: () => 'Synthetic remote', formatNanahProfileContext: x => x?.profileId || '', resolveNanahDisplayTargetProfile: d => d.targetProfile,
    isProfileLocked: () => true, isProfileUnlockSessionValid: { check: () => false },
    ensureProfileUnlocked: async (_, id, options) => { calls.unlocks.push({ id, sensitive: options?.sensitiveAction === true }); return id.startsWith('child-') || (typeof parentApproval === 'function' ? parentApproval(id, options) : parentApproval); },
    extractMasterPinVerifier: () => null, extractProfilePinVerifier: () => null, shouldAutoApplyNanahProposal: () => false,
    showNanahManagedLinkModal: async () => { calls.modals += 1; modalMutation?.(stored); return { action: 'apply_once', policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: approvedTarget, applyMode: 'replace' } }; },
    sendNanahDecision: async (...args) => calls.decisions.push(args),
    saveNanahTrustedLink: async () => { calls.trustWrites += 1; },
    tabViewUiText: (_, fallback) => fallback, nanahModalScopeLabel: x => x, UIComponents: { showToast() {} },
    updateNanahUi() {}, refreshFilterTubeUiAfterNanahImport: async () => {}, hasRevisionBoundManagedPolicyDetails: () => false
  });
  vm.runInNewContext([
    section('    function captureProfileMutationAuthorization(', '    async function updateProfileViewingAccess('),
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function isActiveChildNanahProfile(', '    function getNanahScopeDescription('),
    section('    function resolveNanahLocalTargetProfile(', '    function resolveNanahDisplayTargetProfile('),
    section('    async function authorizeNanahManagedReceiverParentBinding(', '    async function ensureNanahManagedChildLinkPermission('),
    section('    async function ensureNanahIncomingAuth(', '    function shouldAutoApplyNanahProposal('),
    section('    async function applyNanahEnvelope(', '    function formatManagedNanahBlockedReason('),
    section('    async function handleNanahIncomingProposal(', '    function sanitizeNanahRemoteManagedLinkPolicy(')
  ].join('\n'), box);
  function envelope(scope = 'main') {
    const portable = scope === 'active'
      ? { version: 'v3', meta: { version: 3, exportType: 'profile', profileId: 'incoming-child' }, profilesV4: { schemaVersion: 4, activeProfileId: 'incoming-child', profiles: { 'incoming-child': { ...account(), type: 'child', parentProfileId: 'default', main: { keywords: [{ word: 'synthetic-rule' }], channels: [] } } } } }
      : { version: 'v3', section: scope, data: { keywords: [{ word: 'synthetic-rule' }] } };
    return { t: 'control_proposal', id: 'first-update', scope, payload: JSON.stringify({ targetScope: scope, strategy: 'replace', authorityMode: 'managed', linkType: 'managed_link', targetProfile: { profileId: target, profileType: stored.profiles[target].type }, portable }) };
  }
  return { box, calls, envelope, get stored() { return stored; }, run: scope => box.handleNanahIncomingProposal(envelope(scope)) };
}

test('a first update cannot be approved by the child switching PIN alone', async () => {
  const f = fixture({ parentApproval: false });
  await f.run();
  assert.equal(f.calls.writes, 0);
  assert.equal(f.calls.modals, 0);
  assert.deepEqual(f.calls.unlocks.map(x => x.id), ['parent-a']);
});

test('Apply Once requires actual parent sensitive approval without creating saved trust', async () => {
  const f = fixture();
  await f.run();
  assert.equal(f.calls.writes, 1);
  assert.equal(f.calls.trustWrites, 0);
  assert.ok(f.calls.unlocks.some(x => x.id === 'parent-a' && x.sensitive));
  assert.ok(!f.calls.unlocks.some(x => x.id === 'child-a'));
  assert.equal(f.stored.profiles['child-a'].main.keywords[0].word, 'synthetic-rule');
});

test('a child cannot target another owners protected profile after its own parent approves', async () => {
  const f = fixture({ target: 'child-b' });
  await assert.rejects(f.run(), /Parent approval/);
  assert.equal(f.calls.writes, 0);
  assert.equal(f.calls.trustWrites, 0);
});

test('an unrelated parent cannot substitute the target child switching PIN for owner authority', async () => {
  const f = fixture({ active: 'parent-a', target: 'child-b' });
  await assert.rejects(f.run(), /Parent approval/);
  assert.equal(f.calls.writes, 0);
  assert.equal(f.calls.unlocks.length, 0);
});

test('reparenting during review requires approval from the new actual parent', async () => {
  const f = fixture({ modalMutation: root => { root.profiles['child-a'].parentProfileId = 'parent-b'; } });
  await f.run();
  // The final authorization resolves the actual current owner and requests that
  // owner, rather than reusing the earlier active-child parent approval.
  assert.ok(f.calls.unlocks.some(x => x.id === 'parent-b' && x.sensitive));
  assert.equal(f.calls.writes, 1);
});

test('parent denial or a wrong parent PIN never writes a protected update', async () => {
  const f = fixture({ active: 'parent-a', parentApproval: false });
  await assert.rejects(f.run(), /Parent approval/);
  assert.equal(f.calls.writes, 0);
  assert.deepEqual(f.calls.unlocks, [{ id: 'parent-a', sensitive: true }]);
});

test('conflicting sender and locally approved targets fail closed', async () => {
  const f = fixture({ approvedTarget: 'child-b' });
  await assert.rejects(f.run(), /sender target differs/);
  assert.equal(f.calls.writes, 0);
});

for (const mutate of [
  root => { root.profiles['child-a'].parentProfileId = 'parent-b'; },
  root => { root.activeProfileId = 'parent-b'; }
]) {
  test('real active-profile import refuses authority changes during its awaited work', async () => {
    const f = fixture({ realImport: true, importMutation: mutate });
    await assert.rejects(f.run('active'), /Parent approval.*protected profile changed/);
    assert.equal(f.calls.writes, 0);
    assert.deepEqual(f.stored.profiles['child-a'].main.keywords, []);
  });
}

test('ordinary personal account copy does not request parent approval', async () => {
  const f = fixture({ active: 'parent-a', target: 'parent-a' });
  await f.box.applyNanahEnvelope(f.envelope());
  assert.equal(f.calls.writes, 1);
  assert.deepEqual(f.calls.unlocks, [{ id: 'parent-a', sensitive: false }]);
});

test('portable adapter cannot update a protected child without a local authorization binding', async () => {
  const f = fixture();
  await assert.rejects(f.box.FilterTubeNanahAdapter.applyIncomingEnvelope(f.envelope(), { targetProfileId: 'child-a' }), /Parent approval/);
  assert.equal(f.calls.writes, 0);
});


test('reparenting does not reuse the former parent approval when the new parent declines', async () => {
  const f = fixture({ parentApproval: id => id !== 'parent-b', modalMutation: root => { root.profiles['child-a'].parentProfileId = 'parent-b'; } });
  await assert.rejects(f.run(), /Parent approval/);
  assert.equal(f.calls.writes, 0);
  assert.ok(f.calls.unlocks.some(x => x.id === 'parent-b' && x.sensitive));
});

test('real import and settings writer update only the approved child, preserving the active master account', async () => {
  const f = fixture({ realImport: true, active: 'default' });
  await f.run('active');
  assert.equal(f.calls.writes, 1);
  assert.equal(f.calls.compiledWrites, 0);
  assert.equal(f.stored.profiles['child-a'].main.keywords[0].word, 'synthetic-rule');
  assert.deepEqual(f.stored.profiles.default.main.keywords, []);
  assert.equal(f.stored.activeProfileId, 'default');
});
