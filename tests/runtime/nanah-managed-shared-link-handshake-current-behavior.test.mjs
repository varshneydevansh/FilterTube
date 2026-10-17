import { installNanahStorageLock } from './helpers/nanah-storage-lock-fixture.mjs';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const read = name => fs.readFileSync(new URL(`../../js/${name}.js`, import.meta.url), 'utf8');
const tab = read('tab-view'), clone = x => JSON.parse(JSON.stringify(x));
function section(a, b) { const i = tab.indexOf(a), j = tab.indexOf(b, i); assert.ok(i > 0 && j > i, a); return tab.slice(i, j); }
const account = name => ({ type: 'account', parentProfileId: null, name, settings: {}, main: { mode: 'blocklist', channels: [], keywords: [] }, kids: { blockedKeywords: [] } });
async function peer(deviceId, parentId, childId, localRole) {
  const storage = { ftProfilesV4: { schemaVersion: 4, activeProfileId: localRole === 'source' ? parentId : childId, profiles: {
    default: account('Master'), [parentId]: account(parentId),
    [childId]: { ...account(childId), type: 'child', parentProfileId: parentId, kids: { mode: 'blocklist', blockedKeywords: localRole === 'source' ? [{ word: 'first-selected-kids' }] : [] } },
    sibling: { ...account('Sibling'), type: 'child', parentProfileId: parentId }
  } }, ftProfilesV3: { main: {}, kids: {} }, ftNanahTrustedLinks: [] };
  const calls = { trustWrites: 0, profileWrites: 0, unlocks: [], choices: [], modal: [], receipts: [], toasts: [], refreshes: 0 };
  const box = { crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, atob, btoa, Date, JSON, Math, setTimeout, clearTimeout, console,
    chrome: { runtime: { lastError: null, getManifest: () => ({ permissions: ['storage', 'unlimitedStorage'] }) }, storage: { local: {
      get(keys, done) { done(keys == null ? clone(storage) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, clone(storage[key] ?? null)]))); },
      set(payload, done) { if (payload.ftProfilesV4) calls.profileWrites += 1; if (payload.ftNanahTrustedLinks) calls.trustWrites += 1; Object.assign(storage, clone(payload)); done?.(); },
      remove(keys, done) { (Array.isArray(keys) ? keys : [keys]).forEach(key => delete storage[key]); done?.(); }, getBytesInUse(_, done) { done(JSON.stringify(storage).length); }
    } } }
  };
  box.window = box; vm.createContext(box); installNanahStorageLock(box);
  for (const file of ['settings_shared', 'io_manager', 'nanah_sync_adapter', 'nanah_managed_live_policy', 'managed_admin_authority']) vm.runInContext(read(file), box);
  await box.FilterTubeSettings.loadSettings();
  const authority = box.FilterTubeManagedAdminAuthority;
  Object.assign(box, {
    runtimeAPI: box.chrome, profilesV4Cache: await box.FilterTubeIO.loadProfilesV4(), activeProfileId: storage.ftProfilesV4.activeProfileId,
    nanahStableDeviceId: deviceId, nanahManagedSigningKeyDescriptor: null, nanahTrustedLinks: [], NANAH_TRUSTED_LINKS_KEY: 'ftNanahTrustedLinks', sessionMasterPin: '',
    managedChildEdit: localRole === 'source' ? { profileId: childId, surface: 'kids' } : null,
    nanahSessionState: { connected: true, sasConfirmed: true }, nanahClient: { send: async () => {} },
    safeObject: x => x && typeof x === 'object' && !Array.isArray(x) ? x : {}, safeArray: x => Array.isArray(x) ? x : [], normalizeString: x => typeof x === 'string' ? x.trim() : '',
    normalizeNonNegativeInteger: x => Number.isInteger(Number(x)) && Number(x) >= 0 ? Number(x) : 0,
    getNanahManagedSendScopeList: x => x || [], expandNanahManagedSendScope: x => ['active', 'full'].includes(x) ? ['main', 'kids', 'viewing_space', 'time_limits'] : [x], getNanahScopeLabel: x => x, getNanahStrategyLabel: x => x,
    getNanahRole: () => localRole, getNanahScope: () => 'active', getNanahStrategy: () => 'replace',
    getNanahLocalProfileContext: () => { const root = box.profilesV4Cache, id = root.activeProfileId; return { profileId: id, profileName: root.profiles[id]?.name, profileType: authority.getProfileType(root, id) }; },
    getProfileType: authority.getProfileType, getActiveProfileType: () => authority.getProfileType(box.profilesV4Cache, box.profilesV4Cache.activeProfileId), getProfileName: (r, id) => r.profiles[id]?.name || id,
    getParentAccountId: (r, id) => r.profiles[id]?.parentProfileId || id,
    canActiveProfileManageProfile: (r, id) => authority.canActorManageProfile(r, { actorProfileId: r.activeProfileId, targetProfileId: id }).allowed,
    isNanahChildReplicaOnly: () => false, isProfileLocked: () => false, isProfileUnlockSessionValid: { check: () => true }, extractMasterPinVerifier: root => root?.profiles?.default?.security?.masterPinVerifier || null, extractProfilePinVerifier: (root, id) => root?.profiles?.[id]?.security?.profilePinVerifier || null,
    ensureProfileUnlocked: async (_, id, options) => { calls.unlocks.push({ id, sensitive: options?.sensitiveAction === true }); return box.approve !== false; },
    ftNanahRemoteTarget: { value: '' }, normalizeNanahProfileInventory: x => Array.isArray(x) ? x : [],
    normalizeNanahProfileContext: x => x || {}, normalizeNanahTargetProfileContext: x => x || {},
    getNanahRemoteLabel: () => 'Other test device', formatNanahProfileContext: x => x?.profileName || x?.profileId || '', resolveNanahDisplayTargetProfile: details => details.targetProfile,
    getNanahSelectedRemoteTargetProfile: () => box.nanahSessionState.remoteRole === 'replica' ? box.nanahSessionState.remoteProfile : null,
    getNanahCurrentTrustedLink: () => box.nanahTrustedLinks.find(link => link.remoteDeviceId === box.nanahSessionState.remoteDevice?.deviceId) || null,
    findNanahTrustedLink: (id, opts = {}) => box.nanahTrustedLinks.find(link => link.remoteDeviceId === id && (!opts.targetProfileId || link.policy.targetProfileId === opts.targetProfileId)) || null,
    shouldAutoApplyNanahProposal: () => false, ensureNanahTrustedReconnectApproved: async () => true,
    showNanahManagedLinkModal: async options => { calls.modal.push(clone(options)); return { action: box.approvalAction || 'save', policy: { ...options.initialPolicy, allowedScopes: ['main', 'kids', 'viewing_space', 'time_limits'], defaultScope: 'active' } }; },
    showChoiceModal: async options => { calls.choices.push(clone(options)); return options.choices.find(choice => choice.value === childId)?.value || null; },
    familyDeviceMapCopy: x => x, tabViewUiText: (_, fallback) => fallback, nanahModalScopeLabel: x => x,
    UIComponents: { showToast: (...args) => calls.toasts.push(args) }, renderNanahTrustedLinks() {}, updateNanahUi() { calls.refreshes += 1; },
    refreshFilterTubeUiAfterNanahImport: async () => { box.profilesV4Cache = await box.FilterTubeIO.loadProfilesV4(); box.activeProfileId = box.profilesV4Cache.activeProfileId; },
    formatManagedNanahBlockedReason: x => x, recordManagedNanahPolicyValidationHistory: async () => {}, sendNanahManagedLivePolicyAck: async (_, decision) => calls.receipts.push(clone(decision))
  });
  vm.runInContext([
    section('    function buildLocalPolicyHash(', '    function buildManagedTimeLimitPolicyHash('),
    section('    function getNanahScopeList(', '    function getNanahTrustedLinkTypePill('),
    section('    function buildNanahProfileScopedLinkId(', '    function getManagedNanahLinkPolicy('),
    section('    function isActiveChildNanahProfile(', '    function getNanahScopeDescription('),
    section('    function getManagedNanahLinkPolicy(', '    function resolveNanahLocalTargetProfile('),
    section('    function findNanahTrustedLink(', '    async function readNanahStorage('),
    section('    function buildNanahOutgoingProposalPolicy(', '    function attachNanahProposalPolicy('),
    section('    function resolveTrustedNanahManagedApply(', '    function requiresNanahTrustedReconnectApproval('),
    section('    function resolveNanahLocalTargetProfile(', '    function resolveNanahDisplayTargetProfile('),
    section('    async function authorizeNanahManagedReceiverParentBinding(', '    async function ensureNanahManagedChildLinkPermission('),
    section('    async function ensureNanahManagedChildLinkPermission(', '    function isCurrentNanahManagedLink('),
    section('    function captureProfileMutationAuthorization(', '    async function updateProfileViewingAccess('),
    section('    async function readNanahStorage(', '    function normalizeNanahManagedSigningPublicDescriptor('),
    section('    async function persistNanahTrustedLinks(', '    function buildManagedTrustRevocationHistoryRow('),
    section('    async function saveNanahTrustedLink(', '    async function removeNanahTrustedLink('),
    section('    async function updateNanahTrustedLinkPolicy(', '    async function markNanahTrustedLinkUsed('),
    section('    async function ensureNanahOutgoingAuth(', '    function shouldAutoApplyNanahProposal('),
    section('    async function applyNanahEnvelope(', '    function formatManagedNanahBlockedReason('),
    section('    function getManagedNanahPolicyAcceptedState(', '    function summarizeManagedNanahPolicyEnvelope('),
    section('    async function handleNanahIncomingManagedPolicyEnvelope(', '    async function handleNanahIncomingManagedMailboxItem('),
    section('    async function handleNanahIncomingProposal(', '    async function createNanahClient('),
    section('    async function trustConnectedNanahDevice()', '    async function confirmSubscriptionsImportModeChoice(')
  ].join('\n'), box);
  calls.profileWrites = 0;
  return { box, storage, calls, parentId, childId, localRole };
}
async function setup() {
  const source = await peer('source-physical-device', 'source-parent', 'source-policy-child', 'source');
  const receiver = await peer('receiver-physical-device', 'local-parent', 'distinct-receiver-child', 'replica');
  const keys = await source.box.FilterTubeNanahAdapter.createManagedNanahSigningKeyPair({ sourcePublicKeyId: 'actual-parent-key', keyVersion: 1 });
  source.box.nanahManagedSigningKeyDescriptor = keys;
  source.box.ensureNanahManagedSigningKeyPair = async () => keys;
  receiver.box.ensureNanahManagedSigningKeyPair = async () => null;
  for (const [local, remote] of [[source, receiver], [receiver, source]]) {
    local.box.nanahSessionState.remoteDevice = { deviceId: remote.box.nanahStableDeviceId, deviceLabel: remote.localRole, ...(remote === source ? { managedPublicKeyId: keys.sourcePublicKeyId, managedPublicKeyJwk: keys.sourcePublicKeyJwk, managedKeyVersion: 1 } : {}) };
    local.box.nanahSessionState.remoteRole = remote.localRole;
    local.box.nanahSessionState.remoteProfile = clone(remote.box.getNanahLocalProfileContext());
    local.box.nanahSessionState.remoteProfileInventory = [clone(remote.box.getNanahLocalProfileContext())];
    local.box.ftNanahRemoteTarget.value = remote.box.getNanahLocalProfileContext().profileId;
  }
  receiver.box.sendNanahDecision = async (proposalId, accepted, reason, extra = {}) => {
    const message = { t: 'control_decision', proposalId, accepted, reason, ...clone(extra) };
    receiver.calls.decisions ||= []; receiver.calls.decisions.push(message);
    await source.box.handleNanahIncomingEnvelope(message);
  };
  const helpers = source.box.FilterTubeNanahManagedLivePolicy.create({
    normalizeString: source.box.normalizeString, safeObject: source.box.safeObject, normalizeNonNegativeInteger: source.box.normalizeNonNegativeInteger,
    getProfilesRoot: () => source.box.profilesV4Cache, getLocalProfileContext: source.box.getNanahLocalProfileContext,
    getPolicySourceProfile: () => { const id = source.box.managedChildEdit?.profileId || source.box.profilesV4Cache.activeProfileId; return { profileId: id, profile: source.box.profilesV4Cache.profiles[id] }; },
    getActiveManagedSurface: () => 'kids', getProfileSurface: (p, surface) => p[surface] || {}, getManagedTimeLimitPolicy: p => p.settings?.timeLimitPolicy || null,
    normalizeTrustedLink: source.box.normalizeNanahTrustedLink, getTargetProfileBehavior: x => x, normalizeTargetProfileContext: x => x || {}, getRemoteTargetProfile: () => null,
    buildLocalPolicyHash: source.box.buildLocalPolicyHash, getAllowedScopeList: source.box.getNanahManagedPolicyScopeList, getScopeLabel: x => x,
    ensureSigningKeyPair: async () => keys, getStableDeviceId: () => source.box.nanahStableDeviceId,
    findTrustedLinkById: id => source.box.nanahTrustedLinks.find(link => link.linkId === id), updateTrustedLinkPolicy: source.box.updateNanahTrustedLinkPolicy,
    getAdapter: () => source.box.FilterTubeNanahAdapter, now: () => Date.now()
  });
  async function prepareFirst() {
    const envelope = await source.box.FilterTubeNanahAdapter.buildControlProposal({ scope: 'active', strategy: 'replace', managedSourceProfileSnapshot: { profileId: source.childId, profile: source.storage.ftProfilesV4.profiles[source.childId] } });
    const parsed = JSON.parse(envelope.payload); parsed.targetProfile = clone(receiver.box.getNanahLocalProfileContext()); parsed.linkType = 'managed_link'; parsed.allowedScopes = ['active'];
    envelope.payload = JSON.stringify(parsed);
    const authority = source.box.captureProfileMutationAuthorization(source.storage.ftProfilesV4, source.childId, source.parentId);
    const pending = await source.box.registerNanahManagedProposal(envelope, authority, source.childId);
    return { envelope, pending };
  }
  async function repeat() {
    const messages = await helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, source.box.nanahTrustedLinks);
    for (const message of messages) await receiver.box.handleNanahIncomingManagedPolicyEnvelope(message);
    return messages;
  }
  return { source, receiver, keys, helpers, prepareFirst, repeat };
}

test('production first Apply+Save sends its actual shared ID back, and signed repeat updates the distinct receiving child', async () => {
  const f = await setup(), { source, receiver } = f;
  const before = clone(receiver.storage.ftProfilesV4.profiles);
  const { envelope } = await f.prepareFirst();
  await receiver.box.handleNanahIncomingProposal(envelope);
  assert.equal(source.calls.trustWrites, 1); assert.equal(receiver.calls.trustWrites, 1);
  const a = source.box.nanahTrustedLinks[0], b = receiver.box.nanahTrustedLinks[0];
  assert.equal(a.linkId, b.linkId); assert.match(a.linkId, /^nm1-[A-Za-z0-9_-]{43}$/);
  assert.equal(receiver.calls.decisions[0].savedManagedLink.linkId, b.linkId);
  assert.equal(a.localPolicyProfileId, source.childId);
  assert.equal(b.localParentProfileId, receiver.parentId);
  assert.equal(a.sourceProfileId, source.parentId);
  source.box.profilesV4Cache.profiles[source.childId].kids.blockedKeywords.push({ word: 'second-managed-kids' });
  const messages = await f.repeat();
  assert.ok(messages.every(message => message.linkId === b.linkId));
  assert.ok(receiver.calls.receipts.every(receipt => receipt.accepted === true), JSON.stringify(receiver.calls.receipts));
  assert.deepEqual(receiver.storage.ftProfilesV4.profiles[receiver.childId].kids.blockedKeywords.map(x => x.word), ['first-selected-kids', 'second-managed-kids']);
  assert.deepEqual(receiver.storage.ftProfilesV4.profiles[receiver.parentId], before[receiver.parentId]);
  assert.deepEqual(receiver.storage.ftProfilesV4.profiles.sibling, before.sibling);
  assert.ok(receiver.calls.unlocks.some(call => call.id === receiver.parentId && call.sensitive));
  assert.ok(source.calls.refreshes > 0, 'source map refreshes after accepting saved link');
});

test('actual manual source/receiver save paths choose and authorize a fixed child independently and produce matching IDs', async () => {
  const f = await setup(), { source, receiver } = f;
  receiver.storage.ftProfilesV4.activeProfileId = receiver.parentId;
  await receiver.box.refreshFilterTubeUiAfterNanahImport();
  await source.box.trustConnectedNanahDevice();
  assert.equal(receiver.calls.trustWrites, 0, 'source consent cannot grant trust on the receiver');
  await receiver.box.trustConnectedNanahDevice();
  assert.equal(receiver.calls.choices.length, 1);
  assert.equal(receiver.box.nanahTrustedLinks[0].policy.targetProfileId, receiver.childId);
  assert.equal(source.box.nanahTrustedLinks[0].linkId, receiver.box.nanahTrustedLinks[0].linkId);
  assert.ok(receiver.calls.unlocks.some(call => call.id === receiver.parentId && call.sensitive));
  assert.ok(source.calls.unlocks.some(call => call.id === source.parentId && call.sensitive));
  assert.equal(source.calls.modal[0].showTargetProfileMapping, false);
  assert.equal(source.calls.modal[0].initialPolicy.targetProfileBehavior, 'fixed_profile');
  assert.ok((await f.repeat()).length > 0);
  assert.ok(receiver.calls.receipts.every(receipt => receipt.accepted), JSON.stringify(receiver.calls.receipts));
});

function savedDecision(envelope, pending) {
  return { t: 'control_decision', proposalId: envelope.id, accepted: true, savedManagedLink: {
    linkId: pending.canonicalLinkId, linkType: 'managed_link', targetProfileBehavior: 'fixed_profile',
    targetProfileId: pending.binding.targetProfileId, allowedScopes: ['main', 'kids', 'viewing_space', 'time_limits'], defaultScope: 'active',
    localParentProfileId: 'remote-cannot-grant-local-owner', localPolicyProfileId: 'remote-cannot-retarget-source' } };
}
for (const [name, mutate] of [
  ['unsolicited proposal', (f, message) => { message.proposalId = 'unsolicited'; }],
  ['foreign link ID', (f, message) => { message.savedManagedLink.linkId = 'foreign-link'; }],
  ['foreign receiver profile', (f, message) => { message.savedManagedLink.targetProfileId = 'sibling'; }],
  ['foreign receiver device', f => { f.source.box.nanahSessionState.remoteDevice.deviceId = 'foreign-device'; }],
  ['replacement session', f => { f.source.box.nanahClient = { send: async () => {} }; }],
  ['lost safety confirmation', f => { f.source.box.nanahSessionState.sasConfirmed = false; }],
  ['changed signing key', f => { f.source.box.nanahManagedSigningKeyDescriptor = { changed: true }; }],
  ['changed active parent', f => { f.source.storage.ftProfilesV4.activeProfileId = 'default'; }],
  ['changed local source owner', f => { f.source.storage.ftProfilesV4.profiles[f.source.childId].parentProfileId = 'default'; }],
  ['changed parent PIN verifier', f => { f.source.storage.ftProfilesV4.profiles[f.source.parentId].security = { profilePinVerifier: { hash: 'changed' } }; }]
]) {
  test(`first saved-link handoff rejects ${name} without writing source trust`, async () => {
    const f = await setup(), { envelope, pending } = await f.prepareFirst();
    const message = savedDecision(envelope, pending); mutate(f, message);
    try { await f.source.box.handleNanahIncomingEnvelope(message); } catch (error) { assert.match(error.message, /changed|pair|link/i); }
    assert.equal(f.source.calls.trustWrites, 0);
    assert.equal(f.source.box.nanahTrustedLinks.length, 0);
  });
}
test('matching handoff is consumed once and cannot import receiver-local authority metadata', async () => {
  const f = await setup(), { envelope, pending } = await f.prepareFirst(), message = savedDecision(envelope, pending);
  await f.source.box.handleNanahIncomingEnvelope(message);
  assert.equal(f.source.calls.trustWrites, 1);
  const saved = f.source.box.nanahTrustedLinks[0];
  assert.equal(saved.localPolicyProfileId, f.source.childId);
  assert.equal(saved.localParentProfileId, undefined);
  assert.equal(saved.policy.localParentProfileId, undefined);
  await f.source.box.handleNanahIncomingEnvelope(message);
  assert.equal(f.source.calls.trustWrites, 1);
});
function duringDigest(box, change) {
  box.crypto = { subtle: new Proxy(webcrypto.subtle, { get(target, property) {
    if (property === 'digest') return async (...args) => { const result = await target.digest(...args); await change(); return result; };
    const value = target[property]; return typeof value === 'function' ? value.bind(target) : value;
  } }) };
}
for (const phase of ['modal', 'digest']) {
  for (const [name, mutation] of [
    ['actor PIN verifier replacement', f => { f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId].security = { profilePinVerifier: { hash: 'replacement' } }; }],
    ['child reparenting', f => { f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId].parentProfileId = 'default'; }],
    ['active account switch', f => { f.receiver.storage.ftProfilesV4.activeProfileId = 'default'; }]
  ]) {
    test(`manual receiver refuses ${name} during ${phase} with zero trust writes`, async () => {
      const f = await setup(); f.receiver.storage.ftProfilesV4.activeProfileId = f.receiver.parentId; await f.receiver.box.refreshFilterTubeUiAfterNanahImport();
      if (phase === 'modal') {
        const modal = f.receiver.box.showNanahManagedLinkModal;
        f.receiver.box.showNanahManagedLinkModal = async options => { const result = await modal(options); mutation(f); return result; };
      } else duringDigest(f.receiver.box, () => mutation(f));
      try { await f.receiver.box.trustConnectedNanahDevice(); } catch (error) { assert.match(error.message, /changed|pair|link/i); }
      assert.equal(f.receiver.calls.trustWrites, 0);
    });
  }
}
test('initial active-child Apply+Save refuses parent PIN verifier replacement during digest', async () => {
  const f = await setup(), { envelope } = await f.prepareFirst();
  duringDigest(f.receiver.box, () => { f.receiver.storage.ftProfilesV4.profiles[f.receiver.parentId].security = { profilePinVerifier: { hash: 'replaced-after-approval' } }; });
  await assert.rejects(f.receiver.box.handleNanahIncomingProposal(envelope), /changed/);
  assert.equal(f.receiver.calls.trustWrites, 0); assert.equal(f.receiver.calls.profileWrites, 0);
});
test('manual parent denial and child-self trust remain blocked', async () => {
  const f = await setup(); f.receiver.storage.ftProfilesV4.activeProfileId = f.receiver.parentId; await f.receiver.box.refreshFilterTubeUiAfterNanahImport(); f.receiver.box.approve = false;
  await f.receiver.box.trustConnectedNanahDevice();
  assert.equal(f.receiver.calls.trustWrites, 0);
  f.receiver.storage.ftProfilesV4.activeProfileId = f.receiver.childId; await f.receiver.box.refreshFilterTubeUiAfterNanahImport(); f.receiver.box.approve = true;
  await f.receiver.box.trustConnectedNanahDevice();
  assert.equal(f.receiver.calls.trustWrites, 0);
});
test('same physical source with two parent accounts gets distinct shared links and production mailbox item IDs', async () => {
  const f = await setup(), { source, receiver } = f;
  receiver.storage.ftProfilesV4.activeProfileId = receiver.parentId; await receiver.box.refreshFilterTubeUiAfterNanahImport();
  await source.box.trustConnectedNanahDevice(); await receiver.box.trustConnectedNanahDevice();
  const first = source.box.nanahTrustedLinks[0];
  const firstEnvelope = (await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, [first]))[0];
  source.storage.ftProfilesV4.profiles['second-parent'] = account('Second parent'); source.storage.ftProfilesV4.activeProfileId = 'second-parent'; source.box.managedChildEdit = null;
  await source.box.refreshFilterTubeUiAfterNanahImport();
  receiver.box.nanahSessionState.remoteProfile = clone(source.box.getNanahLocalProfileContext());
  await source.box.trustConnectedNanahDevice(); await receiver.box.trustConnectedNanahDevice();
  assert.equal(source.box.nanahTrustedLinks.length, 2); assert.equal(receiver.box.nanahTrustedLinks.length, 2);
  const second = source.box.nanahTrustedLinks.find(link => link.sourceProfileId === 'second-parent');
  assert.notEqual(first.linkId, second.linkId);
  const secondEnvelope = (await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, [second]))[0];
  const sealed = { cipherSuite: 'aes-kw+a256gcm', keyAgreementId: 'synthetic-agreement', encryptedDek: 'sealed-key', nonce: 'nonce', ciphertext: 'sealed-payload', ciphertextHash: 'ciphertext-hash' };
  const a = source.box.FilterTubeNanahAdapter.buildManagedMailboxStorageItem(firstEnvelope, sealed);
  const b = source.box.FilterTubeNanahAdapter.buildManagedMailboxStorageItem(secondEnvelope, sealed);
  assert.notEqual(a.mailboxItemId, b.mailboxItemId);
  assert.notEqual(firstEnvelope.policyHash, secondEnvelope.policyHash, 'production policy hash includes the actual source parent and shared link');
  const duplicateId = { ...second, linkId: first.linkId };
  await assert.rejects(source.box.saveNanahTrustedLink(duplicateId), /another device|another.*profile|old link/i);
  assert.equal(source.box.nanahTrustedLinks.length, 2);
});
test('re-saving an existing legacy logical row preserves its ID and old receipt assertions', async () => {
  const f = await setup(), source = f.source;
  const entry = { linkId: 'legacy-existing-id', linkType: 'managed_link', remoteDeviceId: f.receiver.box.nanahStableDeviceId, targetDeviceId: f.receiver.box.nanahStableDeviceId,
    sourceDeviceId: source.box.nanahStableDeviceId, sourceProfileId: source.parentId, localRole: 'source', remoteRole: 'replica',
    policy: { targetProfileBehavior: 'fixed_profile', targetProfileId: f.receiver.childId, allowedScopes: ['kids'], outgoingManagedPolicies: { kids: { revision: 8, policyHash: 'old-assertion' } } } };
  await source.box.saveNanahTrustedLink(entry);
  const saved = await source.box.saveNanahTrustedLink({ ...entry, linkId: `nanah-${entry.remoteDeviceId}`, policy: { ...entry.policy, outgoingManagedPolicies: undefined } });
  assert.equal(saved.linkId, 'legacy-existing-id');
  assert.equal(saved.policy.outgoingManagedPolicies.kids.revision, 8);
});

test('actual contextual finder and outgoing policy keep new parent and new child as first proposals, then save each approved fixed link', async () => {
  const f = await setup(), { source, receiver } = f;
  const first = await f.prepareFirst(); await receiver.box.handleNanahIncomingProposal(first.envelope);
  const originalSource = clone(source.box.nanahTrustedLinks[0]), originalReceiver = clone(receiver.box.nanahTrustedLinks[0]);
  assert.equal(source.box.buildNanahOutgoingProposalPolicy('active', 'replace').authorityMode, 'managed');
  source.storage.ftProfilesV4.profiles['second-source-parent'] = account('Second source parent');
  source.storage.ftProfilesV4.profiles['second-source-child'] = { ...account('Second policy'), type: 'child', parentProfileId: 'second-source-parent', kids: { blockedKeywords: [{ word: 'second-parent-policy' }] } };
  source.storage.ftProfilesV4.activeProfileId = 'second-source-parent'; source.parentId = 'second-source-parent'; source.childId = 'second-source-child'; source.box.managedChildEdit = { profileId: source.childId, surface: 'kids' };
  await source.box.refreshFilterTubeUiAfterNanahImport(); receiver.box.nanahSessionState.remoteProfile = clone(source.box.getNanahLocalProfileContext());
  assert.equal(source.box.getNanahCurrentTrustedLink(), null);
  assert.equal(source.box.buildNanahOutgoingProposalPolicy('active', 'replace').authorityMode, 'peer');
  const modalBefore = receiver.calls.modal.length;
  const secondParent = await f.prepareFirst(); await receiver.box.handleNanahIncomingProposal(secondParent.envelope);
  assert.equal(receiver.calls.modal.length, modalBefore + 1, 'new parent gets a fresh local first-save review');
  assert.equal(source.box.nanahTrustedLinks.length, 2); assert.equal(receiver.box.nanahTrustedLinks.length, 2);
  assert.deepEqual(clone(source.box.nanahTrustedLinks.find(link => link.linkId === originalSource.linkId)), originalSource);
  assert.deepEqual(clone(receiver.box.nanahTrustedLinks.find(link => link.linkId === originalReceiver.linkId)), originalReceiver);
  assert.equal(source.box.buildNanahOutgoingProposalPolicy('active', 'replace').authorityMode, 'managed');
  const bLinkId = source.box.getNanahCurrentTrustedLink().linkId;
  const bMessages = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, [source.box.getNanahCurrentTrustedLink()]);
  for (const message of bMessages) await receiver.box.handleNanahIncomingManagedPolicyEnvelope(message);
  assert.ok(receiver.calls.receipts.every(receipt => receipt.accepted), 'second approved parent on the same physical source can send to the same child');
  const bAccepted = clone(receiver.storage.ftProfilesV4.profiles[receiver.childId].managedPolicyState.remoteManagedPolicies[bLinkId]);
  source.storage.ftProfilesV4.activeProfileId = 'source-parent'; source.parentId = 'source-parent'; source.childId = 'source-policy-child'; source.box.managedChildEdit = { profileId: source.childId, surface: 'kids' };
  await source.box.refreshFilterTubeUiAfterNanahImport(); receiver.box.nanahSessionState.remoteProfile = clone(source.box.getNanahLocalProfileContext());
  const aMessages = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, [source.box.getNanahCurrentTrustedLink()]);
  for (const message of aMessages) await receiver.box.handleNanahIncomingManagedPolicyEnvelope(message);
  assert.ok(receiver.calls.receipts.every(receipt => receipt.accepted));
  const policies = receiver.storage.ftProfilesV4.profiles[receiver.childId].managedPolicyState.remoteManagedPolicies;
  assert.deepEqual(policies[bLinkId], bAccepted, 'parent B revision assertions remain independent when A sends again');
  assert.equal(policies[originalReceiver.linkId].kids.revision, 1);
  source.storage.ftProfilesV4.activeProfileId = 'second-source-parent'; source.parentId = 'second-source-parent'; source.childId = 'second-source-child'; source.box.managedChildEdit = { profileId: source.childId, surface: 'kids' };
  await source.box.refreshFilterTubeUiAfterNanahImport(); receiver.box.nanahSessionState.remoteProfile = clone(source.box.getNanahLocalProfileContext());
  receiver.storage.ftProfilesV4.profiles['second-local-parent'] = account('Second local parent');
  receiver.storage.ftProfilesV4.profiles['second-receiver-child'] = { ...account('Second receiving child'), type: 'child', parentProfileId: 'second-local-parent' };
  receiver.storage.ftProfilesV4.activeProfileId = 'second-receiver-child'; receiver.childId = 'second-receiver-child'; receiver.parentId = 'second-local-parent'; await receiver.box.refreshFilterTubeUiAfterNanahImport();
  source.box.nanahSessionState.remoteProfile = clone(receiver.box.getNanahLocalProfileContext()); source.box.nanahSessionState.remoteProfileInventory.push(clone(receiver.box.getNanahLocalProfileContext())); source.box.ftNanahRemoteTarget.value = receiver.childId;
  assert.equal(source.box.getNanahCurrentTrustedLink(), null);
  assert.equal(source.box.buildNanahOutgoingProposalPolicy('active', 'replace').authorityMode, 'peer');
  assert.equal(receiver.box.findNanahTrustedLink(source.box.nanahStableDeviceId, { targetProfileId: receiver.childId, sourceProfileId: source.parentId, localRole: 'replica', remoteRole: 'source', exactMatch: true }), null);
  const third = await f.prepareFirst(); await receiver.box.handleNanahIncomingProposal(third.envelope);
  assert.equal(source.box.nanahTrustedLinks.length, 3); assert.equal(receiver.box.nanahTrustedLinks.length, 3);
  const target = receiver.box.nanahTrustedLinks.find(link => link.policy.targetProfileId === receiver.childId);
  assert.equal(target.localParentProfileId, 'second-local-parent'); assert.equal(target.sourceProfileId, 'second-source-parent');
  const messages = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, [source.box.getNanahCurrentTrustedLink()]);
  for (const message of messages) await receiver.box.handleNanahIncomingManagedPolicyEnvelope(message);
  assert.ok(receiver.calls.receipts.every(receipt => receipt.accepted), JSON.stringify(receiver.calls.receipts));
  source.box.ftNanahRemoteTarget.value = ''; source.box.nanahSessionState.remoteTargetProfile = null;
  assert.equal(source.box.getNanahCurrentTrustedLink(), null, 'missing target never picks another child grant');
});

test('managed context has no grant without an actual receiving child while personal link fallback is retained', async () => {
  const f = await setup(), first = await f.prepareFirst();
  await f.receiver.box.handleNanahIncomingProposal(first.envelope);
  const fixed = f.receiver.box.nanahTrustedLinks[0];
  assert.equal(f.receiver.box.getNanahCurrentTrustedLink().linkId, fixed.linkId);
  f.receiver.storage.ftProfilesV4.activeProfileId = f.receiver.parentId;
  await f.receiver.box.refreshFilterTubeUiAfterNanahImport();
  assert.equal(f.receiver.box.ftNanahRemoteTarget.value, f.source.parentId, 'receiver remote dropdown describes the remote parent, never a local child');
  assert.equal(f.receiver.box.getNanahCurrentTrustedLink(), null);
  assert.equal(f.receiver.box.findNanahTrustedLink(f.source.box.nanahStableDeviceId, { linkId: fixed.linkId, targetProfileId: 'another-child', sourceProfileId: f.source.parentId, exactMatch: true }), null);
  f.source.box.getNanahRole = () => 'peer'; f.source.box.nanahSessionState.remoteRole = 'peer';
  const peerLink = await f.source.box.saveNanahTrustedLink({ remoteDeviceId: f.receiver.box.nanahStableDeviceId, localRole: 'peer', remoteRole: 'peer', linkType: 'peer_link', policy: { allowedScopes: ['active'] } });
  f.source.box.ftNanahRemoteTarget.value = '';
  assert.equal(f.source.box.getNanahCurrentTrustedLink().linkId, peerLink.linkId);
});

test('first family-role account copy can still apply once without creating managed trust', async () => {
  const f = await setup(), { source, receiver } = f;
  receiver.storage.ftProfilesV4.activeProfileId = receiver.parentId; await receiver.box.refreshFilterTubeUiAfterNanahImport(); receiver.box.approvalAction = 'apply_once';
  source.box.nanahSessionState.remoteProfile = clone(receiver.box.getNanahLocalProfileContext()); source.box.nanahSessionState.remoteProfileInventory = [clone(receiver.box.getNanahLocalProfileContext())]; source.box.ftNanahRemoteTarget.value = receiver.parentId;
  const first = await f.prepareFirst();
  assert.equal(first.pending, null);
  await receiver.box.handleNanahIncomingProposal(first.envelope);
  assert.equal(receiver.calls.trustWrites, 0); assert.equal(source.calls.trustWrites, 0);
  assert.deepEqual(receiver.storage.ftProfilesV4.profiles[receiver.parentId].kids.blockedKeywords.map(x => x.word), ['first-selected-kids']);
  assert.ok(receiver.calls.unlocks.some(call => call.id === receiver.parentId));
});
test('previously saved current-active adult rows retain exact status lookup but gain no child or different-parent grant', async () => {
  const f = await setup(), { source, receiver } = f;
  receiver.storage.ftProfilesV4.activeProfileId = receiver.parentId; await receiver.box.refreshFilterTubeUiAfterNanahImport();
  source.box.nanahSessionState.remoteProfile = clone(receiver.box.getNanahLocalProfileContext()); source.box.nanahSessionState.remoteProfileInventory = [clone(receiver.box.getNanahLocalProfileContext())]; source.box.ftNanahRemoteTarget.value = receiver.parentId;
  const legacy = { linkId: 'saved-legacy-adult-row', remoteDeviceId: source.box.nanahStableDeviceId, sourceDeviceId: source.box.nanahStableDeviceId, sourceProfileId: source.parentId,
    localRole: 'replica', remoteRole: 'source', linkType: 'managed_link', policy: { targetProfileBehavior: 'current_active', allowedScopes: ['active'], defaultScope: 'active' } };
  await receiver.box.saveNanahTrustedLink(legacy);
  assert.equal(receiver.box.getNanahCurrentTrustedLink().linkId, legacy.linkId);
  receiver.box.nanahSessionState.remoteProfile.profileId = 'wrong-source-parent';
  assert.equal(receiver.box.getNanahCurrentTrustedLink(), null);
  receiver.box.nanahSessionState.remoteProfile.profileId = source.parentId;
  receiver.storage.ftProfilesV4.activeProfileId = receiver.childId; await receiver.box.refreshFilterTubeUiAfterNanahImport();
  assert.equal(receiver.box.getNanahCurrentTrustedLink(), null);
  await source.box.saveNanahTrustedLink({ ...legacy, localRole: 'source', remoteRole: 'replica', remoteDeviceId: receiver.box.nanahStableDeviceId });
  assert.equal(source.box.getNanahCurrentTrustedLink().linkId, legacy.linkId);
  source.box.nanahSessionState.remoteProfile = { profileId: receiver.childId, profileType: 'child' }; source.box.nanahSessionState.remoteProfileInventory = [source.box.nanahSessionState.remoteProfile]; source.box.ftNanahRemoteTarget.value = receiver.childId;
  assert.equal(source.box.getNanahCurrentTrustedLink(), null);
  await assert.rejects(f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'active' }, source.box.nanahTrustedLinks), /fixed child target/);
});
test('manual receiver with no manageable child stops before offering unusable managed save', async () => {
  const f = await setup(); f.receiver.storage.ftProfilesV4.activeProfileId = f.receiver.parentId;
  delete f.receiver.storage.ftProfilesV4.profiles[f.receiver.childId]; delete f.receiver.storage.ftProfilesV4.profiles.sibling; await f.receiver.box.refreshFilterTubeUiAfterNanahImport();
  await f.receiver.box.trustConnectedNanahDevice();
  assert.equal(f.receiver.calls.modal.length, 0); assert.equal(f.receiver.calls.trustWrites, 0);
  assert.match(f.receiver.calls.toasts.at(-1)[0], /Create a protected profile/);
});

for (const missing of ['none', 'sourceParent', 'target']) {
  test(`duplicate detection still rejects an ambiguous same-device saved row (${missing}) at initial and fresh apply`, async () => {
    for (const timing of ['initial', 'fresh']) {
      const f = await setup(), first = await f.prepareFirst(); await f.receiver.box.handleNanahIncomingProposal(first.envelope);
      const target = f.receiver.box.nanahTrustedLinks[0], duplicate = clone(target); duplicate.linkId = 'ambiguous-duplicate';
      if (missing === 'sourceParent') { delete duplicate.sourceProfileId; delete duplicate.policy.sourceProfileId; }
      if (missing === 'target') { duplicate.policy.targetProfileBehavior = 'current_active'; delete duplicate.targetProfileId; delete duplicate.policy.targetProfileId; }
      const messages = await f.helpers.buildEnvelopeBatchForTrustedLinks({ scope: 'kids' }, f.source.box.nanahTrustedLinks);
      const beforeWrites = f.receiver.calls.profileWrites;
      if (timing === 'initial') { f.receiver.box.nanahTrustedLinks.push(duplicate); await f.receiver.box.persistNanahTrustedLinks(); }
      else {
        const verify = f.receiver.box.FilterTubeNanahAdapter.verifyManagedNanahPolicyIntegritySignature;
        f.receiver.box.FilterTubeNanahAdapter.verifyManagedNanahPolicyIntegritySignature = async (...args) => {
          const result = await verify(...args); f.receiver.box.nanahTrustedLinks.push(duplicate); await f.receiver.box.persistNanahTrustedLinks(); return result;
        };
      }
      await f.receiver.box.handleNanahIncomingManagedPolicyEnvelope(messages[0]);
      assert.equal(f.receiver.calls.receipts.at(-1).reason, 'duplicate_source_device_id');
      assert.equal(f.receiver.calls.profileWrites, beforeWrites);
    }
  });
}
