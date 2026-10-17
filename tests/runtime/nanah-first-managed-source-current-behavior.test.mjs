import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const tab = read('tab-view');
const clone = x => JSON.parse(JSON.stringify(x));
function section(start, end) {
  const a = tab.indexOf(start), b = tab.indexOf(end, a);
  assert.ok(a > 0 && b > a, start);
  return tab.slice(a, b);
}
const account = (name, marker) => ({ type: 'account', name, settings: {}, main: { mode: 'blocklist', channels: [], keywords: [{ word: marker }] }, kids: { mode: 'blocklist', blockedKeywords: [{ word: `${marker}-kids` }], blockedChannels: [] } });
function sourceRoot() {
  return { schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: account('Parent', 'parent-only'),
    other: account('Other parent', 'other-only'),
    selected: { ...account('Selected child', 'selected-main'), type: 'child', parentProfileId: 'default',
      security: { profilePinVerifier: { synthetic: 'never-portable-pin' } }, managedActionHistory: [{ secret: 'never-portable-history' }], managedPolicyState: { secret: 'never-portable-trust' },
      settings: { hideShorts: true, syncKidsToMain: false },
      kids: { mode: 'blocklist', strictMode: true, blockedChannels: [], blockedKeywords: [{ word: 'acceptance-managed-kids' }], videoIds: ['abcdefghijk'] } },
    sibling: { ...account('Sibling', 'sibling-only'), type: 'child', parentProfileId: 'default' }
  } };
}
async function runtime(root) {
  const storage = { ftProfilesV4: clone(root), ftProfilesV3: { main: {}, kids: {} } };
  let writes = 0;
  const box = { crypto: webcrypto, Uint8Array, btoa, atob, console: { log() {}, warn() {}, error() {} }, Date, JSON, Math, TextEncoder, TextDecoder, setTimeout, clearTimeout,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys == null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { if (payload.ftProfilesV4) writes += 1; Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); },
      getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box;
  vm.createContext(box);
  installNanahStorageLock(box);
  vm.runInContext(read('settings_shared'), box);
  await box.FilterTubeSettings.loadSettings();
  vm.runInContext(read('io_manager'), box);
  // Keep fresh authority loads independent of the IO cache; actual export/import
  // and storage writes remain production code, including SettingsAPI.saveSettings.
  box.FilterTubeIO.loadProfilesV4 = async () => clone(storage.ftProfilesV4);
  vm.runInContext(read('nanah_sync_adapter'), box);
  vm.runInContext(read('managed_admin_authority'), box);
  writes = 0;
  return { box, storage, get writes() { return writes; } };
}
async function sender({ scope = 'active', personal = false, approve = true, confirm = true, mutateAuth = null, mutateKey = null, mutatePrepare = null, actor = 'default', configureSource = null } = {}) {
  const initial = sourceRoot();
  initial.activeProfileId = actor;
  initial.profiles.selected.parentProfileId = actor;
  configureSource?.(initial.profiles.selected);
  const f = await runtime(initial);
  const { box } = f;
  const calls = { sends: [], auth: [], toasts: [], keys: 0 };
  const target = { profileId: 'receiver-child', profileName: 'Receiver child', profileType: 'child' };
  Object.assign(box, {
    profilesV4Cache: f.storage.ftProfilesV4, sessionMasterPin: '', nanahStableDeviceId: 'source-device',
    getNanahLocalProfileContext: () => ({ profileId: f.storage.ftProfilesV4.activeProfileId }),
    safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, safeArray: x => Array.isArray(x) ? x : [], normalizeString: x => typeof x === 'string' ? x.trim() : '',
    managedChildEdit: { profileId: 'selected', surface: 'kids' },
    nanahSessionState: { connected: true, sasConfirmed: true, remoteDevice: { deviceId: 'receiver-device' }, remoteRole: personal ? 'peer' : 'replica', remoteProfile: target, remoteTargetProfile: { behavior: 'fixed_profile', profileId: target.profileId } },
    nanahClient: { send: async envelope => calls.sends.push(clone(envelope)) },
    isNanahChildReceiveOnly: () => box.FilterTubeManagedAdminAuthority.getProfileType(f.storage.ftProfilesV4, f.storage.ftProfilesV4.activeProfileId) === 'child',
    isNanahChildReplicaOnly: () => false, getNanahScope: () => scope, getNanahStrategy: () => 'replace', getNanahRole: () => personal ? 'peer' : 'source',
    getNanahCurrentTrustedLink: () => null, getManagedNanahLinkPolicy: () => null,
    classifyNanahTrustedLink: (local, remote) => local === 'source' && remote === 'replica' ? 'managed_link' : 'peer_link',
    getNanahManagedSendScopeList: x => x, getNanahScopeList: x => x, getNanahSelectedRemoteTargetProfile: () => target,
    getNanahRemoteLabel: () => 'Receiver child',
    confirmNanahRemoteTarget: async () => confirm,
    ensureNanahManagedSigningKeyPair: async () => { calls.keys += 1; await mutateKey?.(f); },
    canActiveProfileManageProfile: (root, id) => box.FilterTubeManagedAdminAuthority.canActorManageProfile(root, { actorProfileId: root.activeProfileId, targetProfileId: id }).allowed,
    getProfileType: box.FilterTubeManagedAdminAuthority.getProfileType,
    extractMasterPinVerifier: root => root?.profiles?.default?.security?.masterPinVerifier || null,
    extractProfilePinVerifier: (root, id) => root?.profiles?.[id]?.security?.profilePinVerifier || null,
    isProfileLocked: () => false, isProfileUnlockSessionValid: { check: () => true },
    ensureProfileUnlocked: async (root, id, options) => { calls.auth.push({ id, sensitive: options?.sensitiveAction }); await mutateAuth?.(f); return approve; },
    tabViewUiText: (_, fallback) => fallback, UIComponents: { showToast: (...args) => calls.toasts.push(args) },
    ftNanahSendBtn: { addEventListener: (_, fn) => { box.send = fn; } }
  });
  const realPrepare = box.FilterTubeNanahAdapter.buildControlProposal;
  box.FilterTubeNanahAdapter.buildControlProposal = async options => {
    const pending = realPrepare(options);
    await mutatePrepare?.(f, options);
    return pending;
  };
  vm.runInContext([
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function captureProfileMutationAuthorization(', '    async function updateProfileViewingAccess('),
    section('    async function ensureNanahOutgoingAuth(', '    function hasRevisionBoundManagedPolicyDetails('),
    section('    function buildNanahOutgoingProposalPolicy(', '    function getNanahActiveManagedSurface('),
    section('        if (ftNanahSendBtn) {\n            ftNanahSendBtn.addEventListener', '        if (ftNanahTrustBtn) {')
  ].join('\n'), box);
  return { ...f, calls, run: () => box.send() };
}
function portable(envelope) { return JSON.parse(envelope.payload).portable; }
function receiverRoot() {
  return { schemaVersion: 4, activeProfileId: 'default', profiles: {
    default: account('Receiver parent', 'receiver-parent'),
    'receiver-child': { ...account('Receiver child', 'receiver-existing'), type: 'child', parentProfileId: 'default', security: { keep: 'local-child-security' } },
    'receiver-sibling': { ...account('Receiver sibling', 'receiver-sibling'), type: 'child', parentProfileId: 'default' }
  } };
}
for (const scope of ['active', 'main', 'kids']) {
  test(`first managed ${scope} send exports the selected child and applies to the distinct local receiver child`, async () => {
    const f = await sender({ scope });
    await f.run();
    assert.equal(f.calls.sends.length, 1, JSON.stringify(f.calls.toasts));
    assert.deepEqual(f.calls.auth, [{ id: 'default', sensitive: true }]);
    const envelope = f.calls.sends[0], payload = portable(envelope), serialized = JSON.stringify(payload);
    assert.ok(!serialized.includes('parent-only'));
    assert.ok(!serialized.includes('sibling-only'));
    assert.ok(!serialized.includes('never-portable'));
    if (scope === 'active') {
      assert.equal(payload.meta.application, 'FilterTube');
      assert.deepEqual(Object.keys(payload.profilesV4.profiles), ['selected']);
      assert.equal(payload.profiles.kids.blockedKeywords[0].word, 'acceptance-managed-kids');
      assert.equal(payload.profiles.main.keywords[0].word, 'selected-main');
    }
    const r = await runtime(receiverRoot());
    const before = clone(r.storage.ftProfilesV4);
    const result = await r.box.FilterTubeNanahAdapter.applyIncomingEnvelope(envelope, {
      scope, strategy: 'replace', targetProfileId: 'receiver-child',
      auth: { localManagedApplyBinding: { targetProfileId: 'receiver-child', localParentProfileId: 'default', actorProfileId: 'default' } }
    });
    assert.equal(result.ok, true);
    const stored = r.storage.ftProfilesV4;
    assert.deepEqual(stored.profiles.default, before.profiles.default, 'parent remains untouched by actual settings writer');
    assert.deepEqual(stored.profiles['receiver-sibling'], before.profiles['receiver-sibling']);
    assert.equal(stored.profiles['receiver-child'].name, 'Receiver child');
    assert.equal(stored.profiles['receiver-child'].parentProfileId, 'default');
    assert.equal(stored.profiles['receiver-child'].security.keep, 'local-child-security');
    if (scope !== 'main') {
      assert.equal(stored.profiles['receiver-child'].kids.blockedKeywords[0].word, 'acceptance-managed-kids');
      assert.deepEqual(stored.profiles['receiver-child'].kids.videoIds, ['abcdefghijk']);
    }
    if (scope !== 'kids') assert.equal(stored.profiles['receiver-child'].main.keywords[0].word, 'selected-main');
    assert.ok(r.writes > 0);
  });
}
for (const [label, mutation] of [
  ['active actor switched to child', f => { f.storage.ftProfilesV4.activeProfileId = 'selected'; }],
  ['owner changed', f => { f.storage.ftProfilesV4.profiles.selected.parentProfileId = 'other'; }],
  ['selected child deleted', f => { delete f.storage.ftProfilesV4.profiles.selected; }],
  ['selected child became an account', f => { f.storage.ftProfilesV4.profiles.selected.type = 'account'; }],
  ['child verifier changed', f => { f.storage.ftProfilesV4.profiles.selected.security.profilePinVerifier = { changed: true }; }],
  ['editor selection changed', f => { f.box.managedChildEdit.profileId = 'sibling'; }],
  ['pairing confirmation lost', f => { f.box.nanahSessionState.sasConfirmed = false; }],
  ['remote device changed', f => { f.box.nanahSessionState.remoteDevice.deviceId = 'different-device'; }],
  ['remote target changed', f => { f.box.nanahSessionState.remoteTargetProfile.profileId = 'different-target'; }]
]) {
  test(`first managed send stops if ${label} during preparation`, async () => {
    const f = await sender({ mutatePrepare: mutation });
    await f.run();
    assert.equal(f.calls.sends.length, 0);
  });
}
for (const phase of ['mutateAuth', 'mutateKey']) {
  test(`first managed send stops if actor changes during ${phase}`, async () => {
    const f = await sender({ [phase]: f => { f.storage.ftProfilesV4.activeProfileId = 'other'; } });
    await f.run();
    assert.equal(f.calls.sends.length, 0);
  });
}
test('parent cancellation or wrong parent approval stops the first managed send', async () => {
  const f = await sender({ approve: false });
  await f.run();
  assert.equal(f.calls.sends.length, 0);
  assert.equal(f.calls.keys, 0);
  assert.deepEqual(f.calls.auth, [{ id: 'default', sensitive: true }]);
});
test('target review cancellation stops before parent approval', async () => {
  const f = await sender({ confirm: false });
  await f.run();
  assert.equal(f.calls.sends.length, 0);
  assert.equal(f.calls.auth.length, 0);
});
test('snapshot stays immutable while payload preparation awaits', async () => {
  const f = await sender({ mutatePrepare: (f, options) => {
    f.storage.ftProfilesV4.profiles.selected.kids.blockedKeywords[0].word = 'later-local-edit';
    options.managedSourceProfileSnapshot.profile.kids.blockedKeywords[0].word = 'caller-retarget-attempt';
  } });
  await f.run();
  assert.equal(f.calls.sends.length, 1);
  assert.equal(portable(f.calls.sends[0]).profilesV4.profiles.selected.kids.blockedKeywords[0].word, 'acceptance-managed-kids');
});
test('personal copy keeps exporting the active adult despite a retained managed editor', async () => {
  const f = await sender({ personal: true });
  await f.run();
  assert.equal(f.calls.sends.length, 1, JSON.stringify(f.calls.toasts));
  const payload = portable(f.calls.sends[0]);
  assert.equal(payload.meta.profileId, 'default');
  assert.deepEqual(Object.keys(payload.profilesV4.profiles), ['default']);
  assert.ok(JSON.stringify(payload).includes('parent-only'));
  assert.ok(!JSON.stringify(payload).includes('acceptance-managed-kids'));
  assert.deepEqual(f.calls.auth, [{ id: 'default', sensitive: false }]);
});
test('full backup continues using the full export and cannot accept a managed child override', async () => {
  const f = await sender({ scope: 'full' });
  await f.run();
  assert.equal(f.calls.sends.length, 1, JSON.stringify(f.calls.toasts));
  assert.ok(portable(f.calls.sends[0]).profilesV4.profiles.sibling);
  await assert.rejects(f.box.FilterTubeNanahAdapter.buildControlProposal({ scope: 'full', managedSourceProfileSnapshot: { profileId: 'selected', profile: sourceRoot().profiles.selected } }), /selected protected profile/);
});

test('an independent parent sends only its own selected child, with whitelist/settings/video roundtrip fidelity', async () => {
  const f = await sender({ actor: 'other', configureSource: profile => {
    profile.settings = { hideShorts: true, hideComments: true, syncKidsToMain: false, contentFilters: { hideMusic: true } };
    profile.main = { mode: 'whitelist', channels: [], keywords: [], videoIds: ['mainvideo01'], whitelistChannels: [{ id: 'UCselectedMain', name: 'Selected Main allowed' }], whitelistKeywords: [{ word: 'main-allowed', exact: true }] };
    profile.kids = { mode: 'whitelist', strictMode: false, blockedChannels: [], blockedKeywords: [], videoIds: ['kidsvideo01'], whitelistChannels: [{ id: 'UCselectedKids', name: 'Selected Kids allowed' }], whitelistKeywords: [{ word: 'kids-allowed', exact: true }] };
  } });
  await f.run();
  assert.equal(f.calls.sends.length, 1, JSON.stringify(f.calls.toasts));
  assert.deepEqual(f.calls.auth, [{ id: 'other', sensitive: true }]);
  const envelope = f.calls.sends[0];
  assert.equal(portable(envelope).profilesV4.profiles.selected.parentProfileId, 'other');
  const r = await runtime(receiverRoot());
  const before = clone(r.storage.ftProfilesV4);
  await r.box.FilterTubeNanahAdapter.applyIncomingEnvelope(envelope, { strategy: 'replace', targetProfileId: 'receiver-child', auth: { localManagedApplyBinding: { targetProfileId: 'receiver-child', localParentProfileId: 'default', actorProfileId: 'default' } } });
  const child = r.storage.ftProfilesV4.profiles['receiver-child'];
  assert.equal(child.parentProfileId, 'default', 'remote source owner never replaces the local owner');
  assert.equal(child.main.mode, 'whitelist');
  assert.equal(child.kids.mode, 'whitelist');
  assert.equal(child.kids.strictMode, false);
  assert.equal(child.main.whitelistChannels[0].id, 'UCselectedMain');
  assert.equal(child.main.whitelistKeywords[0].word, 'main-allowed');
  assert.equal(child.main.whitelistKeywords[0].exact, true);
  assert.equal(child.kids.whitelistChannels[0].id, 'UCselectedKids');
  assert.equal(child.kids.whitelistKeywords[0].word, 'kids-allowed');
  assert.deepEqual(child.main.videoIds, ['mainvideo01']);
  assert.deepEqual(child.kids.videoIds, ['kidsvideo01']);
  assert.equal(child.settings.hideShorts, true);
  assert.equal(child.settings.hideComments, true);
  assert.equal(child.settings.syncKidsToMain, false);
  assert.equal(child.settings.contentFilters.hideMusic, true);
  assert.deepEqual(r.storage.ftProfilesV4.profiles.default, before.profiles.default);
  assert.deepEqual(r.storage.ftProfilesV4.profiles['receiver-sibling'], before.profiles['receiver-sibling']);
  assert.equal(child.security.keep, 'local-child-security');
});
