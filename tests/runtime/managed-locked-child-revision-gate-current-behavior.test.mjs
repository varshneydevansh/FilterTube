import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LOCKED_CHILD_MANAGED_UPDATE_REVISION_GATE_2026-06-05.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeString(value) {
  return String(value || '').trim();
}

function getNanahLockedChildMode(value, fallback = 'require_unlock') {
  const normalized = normalizeString(value).toLowerCase();
  if (normalized === 'allow_trusted_updates' || normalized === 'allow_locked_updates') return 'allow_trusted_updates';
  if (normalized === 'require_unlock' || normalized === 'strict') return 'require_unlock';
  return fallback;
}

function hasRevisionBoundManagedPolicyDetails(details) {
  const root = safeObject(details);
  const envelope = safeObject(root.managedEnvelope);
  const signedFields = safeObject(safeObject(envelope.integrity).signedFields);
  return root.type === 'managed_policy'
    && envelope.type === 'filtertube_managed_policy'
    && Number.isInteger(envelope.revision)
    && envelope.revision > 0
    && normalizeString(envelope.policyHash)
    && normalizeString(envelope.integrity?.signature)
    && signedFields.revision === envelope.revision
    && signedFields.policyHash === envelope.policyHash;
}

// This retained May predicate is an abstract historical model. The actual
// portable authorization regression below exercises today's parent-only gate.
function shouldBypassLockedChildUnlock({
  requiresWholeAccount = false,
  localTargetType = 'child',
  locked = true,
  trusted = {},
  remoteRole = 'source',
  details = null
} = {}) {
  const normalizedTrusted = safeObject(trusted);
  return Boolean(
    !requiresWholeAccount
      && localTargetType === 'child'
      && locked
      && normalizedTrusted.linkType === 'managed_link'
      && normalizedTrusted.localRole === 'replica'
      && normalizedTrusted.remoteRole === 'source'
      && (normalizeString(remoteRole) || normalizeString(normalizedTrusted.remoteRole)) === 'source'
      && normalizeString(safeObject(details).authorityMode) !== 'peer'
      && normalizeString(safeObject(normalizedTrusted.policy).decisionMode) !== 'peer'
      && getNanahLockedChildMode(safeObject(normalizedTrusted.policy).lockedChildMode, 'require_unlock') === 'allow_trusted_updates'
      && hasRevisionBoundManagedPolicyDetails(details)
  );
}

function trustedManagedReplicaLink(overrides = {}) {
  return {
    linkType: 'managed_link',
    localRole: 'replica',
    remoteRole: 'source',
    policy: {
      decisionMode: 'managed',
      lockedChildMode: 'allow_trusted_updates'
    },
    ...overrides
  };
}

function signedManagedPolicyDetails(overrides = {}) {
  const policyHash = overrides.policyHash || 'remote-managed-policy-hash-7';
  const revision = Object.prototype.hasOwnProperty.call(overrides, 'revision') ? overrides.revision : 7;
  const envelope = {
    type: 'filtertube_managed_policy',
    revision,
    policyHash,
    integrity: {
      signature: 'signed-parent-policy',
      signedFields: {
        revision,
        policyHash
      }
    },
    ...safeObject(overrides.envelope)
  };
  return {
    type: 'managed_policy',
    authorityMode: 'managed',
    managedEnvelope: envelope,
    ...safeObject(overrides.details)
  };
}

test('historical locked-child predicate model requires revision-bound managed-policy details', () => {
  const trusted = trustedManagedReplicaLink();

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: { type: 'control_proposal', authorityMode: 'managed', scope: 'keywords' }
  }), false, 'legacy control proposals must still require local child unlock');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: { type: 'app_sync', authorityMode: 'managed', scope: 'full' }
  }), false, 'legacy app_sync payloads must still require local child unlock');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: signedManagedPolicyDetails()
  }), true, 'signed revision-bound managed policies may satisfy the locked child trusted-update predicate');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: signedManagedPolicyDetails({ envelope: { integrity: { signedFields: { revision: 7, policyHash: 'remote-managed-policy-hash-7' } } } })
  }), false, 'missing integrity signature must fail closed');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: signedManagedPolicyDetails({ envelope: { integrity: { signature: 'sig', signedFields: { revision: 6, policyHash: 'remote-managed-policy-hash-7' } } } })
  }), false, 'signed revision mismatch must fail closed');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted,
    details: signedManagedPolicyDetails({ envelope: { integrity: { signature: 'sig', signedFields: { revision: 7, policyHash: 'different-hash' } } } })
  }), false, 'signed policy hash mismatch must fail closed');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted: trustedManagedReplicaLink({ policy: { decisionMode: 'peer', lockedChildMode: 'allow_trusted_updates' } }),
    details: signedManagedPolicyDetails()
  }), false, 'peer authority cannot satisfy managed locked-child bypass');

  assert.equal(shouldBypassLockedChildUnlock({
    trusted: trustedManagedReplicaLink({ localRole: 'source', remoteRole: 'replica' }),
    remoteRole: 'replica',
    details: signedManagedPolicyDetails()
  }), false, 'source-local links cannot bypass a locked child on behalf of a replica');
});

test('runtime source keeps signed managed-policy path separate from legacy proposal apply', () => {
  const tabView = read('js/tab-view.js');
  const adapter = read('js/nanah_sync_adapter.js');

  assert.match(tabView, /function hasRevisionBoundManagedPolicyDetails\(details\)/);
  const portableAuth = tabView.slice(tabView.indexOf('async function ensureNanahIncomingAuth('), tabView.indexOf('function parseNanahEnvelopeDetails('));
  assert.match(portableAuth, /await authorizeNanahManagedReceiverParentBinding\(/);
  assert.match(portableAuth, /targetProfileBehavior: 'fixed_profile'/);
  assert.match(portableAuth, /approvedChild\.parentProfileId\) !== ownerId/);
  assert.doesNotMatch(portableAuth, /hasRevisionBoundManagedPolicyDetails/);
  const signedApply = tabView.slice(tabView.indexOf('async function handleNanahIncomingManagedPolicyEnvelope('), tabView.indexOf('async function handleNanahIncomingManagedPolicyEnvelope(') + 4000);
  assert.match(signedApply, /await verifyManagedSignature\(envelope, context\.trustedLink\)/);
  assert.match(signedApply, /adapter\.validateManagedPolicyEnvelope\(envelope, context\)/);
  assert.match(signedApply, /await adapter\.applyManagedPolicyEnvelope\(envelope, context\)/);
  assert.match(tabView, /async function ensureNanahIncomingAuth\(portable, scope, \{ trustedLink = null, details = null, targetProfile = null \} = \{\}\)/);
  assert.match(tabView, /async function applyNanahEnvelope\(envelope, strategyOverride = null, targetPolicyOverride = null\)/);
  assert.match(tabView, /await ensureNanahIncomingAuth\(details\.portable, details\.scope, \{/);
  assert.match(tabView, /async function handleNanahIncomingManagedPolicyEnvelope\(envelope\)/);
  assert.match(adapter, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(tabView, /if \(root\.type === 'filtertube_managed_policy'\) \{\s+await handleNanahIncomingManagedPolicyEnvelope\(root\);\s+return;\s+\}/);
  assert.match(tabView, /if \(root\.t === 'control_proposal' \|\| root\.t === 'app_sync'\) \{\s+await handleNanahIncomingProposal\(root\);\s+\}/);
  assert.match(tabView, /await applyNanahEnvelope\(envelope, trustedDecision\.strategy\)/);
});

test('audit docs record the locked-child revision gate and no YouTube hot-path work', () => {
  const doc = read(docPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /hasRevisionBoundManagedPolicyDetails/);
  assert.match(doc, /legacy `control_proposal` and `app_sync` managed receives must still unlock\s+locally/i);
  assert.match(doc, /signed, revision-bound `filtertube_managed_policy`/i);
  assert.match(doc, /No YouTube observer, timer, network interception, JSON filtering, DOM\s+fallback, menu, or quick-block runtime changed/i);
  assert.match(doc, /node --test tests\/runtime\/managed-locked-child-revision-gate-current-behavior\.test\.mjs/);

  assert.match(inventory, /FILTERTUBE_LOCKED_CHILD_MANAGED_UPDATE_REVISION_GATE_2026-06-05\.md/);
  assert.match(inventory, /Locked-child legacy proposal bypass is revision-gated/);
  assert.match(inventory, /only signed revision-bound `filtertube_managed_policy` details can satisfy the bypass predicate/);
});


test('actual portable child approval never treats signed-looking details or the child PIN as parent approval', async () => {
  const text = read('js/tab-view.js');
  const start = text.indexOf('async function ensureNanahIncomingAuth(');
  const end = text.indexOf('function parseNanahEnvelopeDetails(', start);
  assert.ok(start >= 0 && end > start);
  const calls = [];
  const root = { activeProfileId: 'child', profiles: { child: { type: 'child', parentProfileId: 'parent' } } };
  const context = vm.createContext({
    safeObject, normalizeString,
    getProfileType: (value, id) => value.profiles[id]?.type,
    extractMasterPinVerifier: () => null,
    window: { FilterTubeIO: { loadProfilesV4: async () => structuredClone(root) } },
    authorizeNanahManagedReceiverParentBinding: async policy => { calls.push(JSON.parse(JSON.stringify(policy))); return null; },
    ensureProfileUnlocked: async () => { throw new Error('child PIN must not authorize protected rules'); }
  });
  vm.runInContext(text.slice(start, end), context);
  await assert.rejects(context.ensureNanahIncomingAuth({}, 'kids', {
    trustedLink: trustedManagedReplicaLink(), details: signedManagedPolicyDetails(), targetProfile: { profileId: 'child' }
  }), /Parent approval is required/);
  assert.deepEqual(calls, [{ targetProfileBehavior: 'fixed_profile', targetProfileId: 'child' }]);
});
