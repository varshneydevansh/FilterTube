import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function baseContext(overrides = {}) {
  return {
    trustedLink: {
      id: 'link-parent-child-1',
      type: 'managed_link',
      localRole: 'replica',
      remoteRole: 'source',
      sourceDeviceId: 'parent-device-1',
      sourceProfileId: 'parent-profile-1',
      targetProfileId: 'child-profile-1',
      allowedScopes: ['main', 'kids', 'videos', 'keywords', 'channels', 'viewing_space', 'time_limits'],
      sourcePublicKeyId: 'parent-key-3',
      keyVersion: 3,
      revoked: false,
      keyRevoked: false,
      stalePairing: false
    },
    profiles: {
      'parent-profile-1': { id: 'parent-profile-1', type: 'account' },
      'child-profile-1': { id: 'child-profile-1', type: 'child', parentProfileId: 'parent-profile-1' },
      'sibling-profile-1': { id: 'sibling-profile-1', type: 'child', parentProfileId: 'other-parent-profile' }
    },
    accepted: {
      revision: 4,
      policyHash: 'hash-keyword-4'
    },
    duplicateDeviceIds: [],
    verifyIntegritySignature({ envelope, integrity, signedFields, payloadScope, trustedLink }) {
      return envelope?.sourcePublicKeyId === trustedLink?.sourcePublicKeyId
        && integrity?.algorithm === 'ed25519'
        && typeof integrity?.signature === 'string'
        && signedFields?.payloadScope === payloadScope;
    },
    ...overrides
  };
}

function baseEnvelope(overrides = {}) {
  const hasIntegrityOverride = Object.prototype.hasOwnProperty.call(overrides, 'integrity');
  const envelope = {
    type: 'filtertube_managed_policy',
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    targetProfileId: 'child-profile-1',
    sourceProfileId: 'parent-profile-1',
    sourceDeviceId: 'parent-device-1',
    revision: 5,
    policyHash: 'hash-keyword-5',
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    issuedAt: '2026-06-03T10:00:00.000Z',
    payload: {
      scope: 'keywords',
      operations: [{ op: 'add_keyword', value: 'spiders' }]
    },
    ...overrides
  };
  envelope.integrity = hasIntegrityOverride ? overrides.integrity : {
    algorithm: 'ed25519',
    signature: `signature-${envelope.scope}-${envelope.revision}`,
    signedFields: {
      linkId: envelope.linkId,
      scope: envelope.scope,
      targetProfileId: envelope.targetProfileId,
      sourceDeviceId: envelope.sourceDeviceId,
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      payloadScope: getPayloadScopeFamily(envelope.payload)
    }
  };
  return envelope;
}

function validationResult(reason, extra = {}) {
  return { accepted: false, reason, ...extra };
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getPayloadScopeFamily(payload) {
  const root = safeObject(payload);
  const explicitScope = String(root.scope || '').trim().toLowerCase();
  if (explicitScope) return explicitScope;
  const firstOperation = Array.isArray(root.operations) ? String(root.operations[0]?.op || '').toLowerCase() : '';
  if (firstOperation.includes('keyword')) return 'keywords';
  if (firstOperation.includes('channel')) return 'channels';
  if (firstOperation.includes('video')) return 'videos';
  if ('dailyBudgetMinutes' in root || root.timeLimitPolicy) return 'time_limits';
  if (root.viewingSpace || 'allowMain' in root || 'allowKids' in root || 'defaultLaunchTarget' in root) return 'viewing_space';
  if (root.surface === 'main') return 'main';
  if (root.surface === 'kids') return 'kids';
  return '';
}

function validatePayloadScope(scope, payload) {
  const root = safeObject(payload);
  const family = getPayloadScopeFamily(root);
  if (!family) return validationResult('payload_scope_unknown');
  if (family !== scope) return validationResult('payload_scope_mismatch');
  const operations = Array.isArray(root.operations) ? root.operations : [];
  if (scope === 'keywords' && operations.some((operation) => !String(operation?.op || '').toLowerCase().includes('keyword'))) {
    return validationResult('payload_scope_mismatch');
  }
  if (scope === 'channels' && operations.some((operation) => !String(operation?.op || '').toLowerCase().includes('channel'))) {
    return validationResult('payload_scope_mismatch');
  }
  if (scope === 'videos' && operations.some((operation) => !String(operation?.op || '').toLowerCase().includes('video'))) {
    return validationResult('payload_scope_mismatch');
  }
  if (scope === 'time_limits' && !(
    Number.isInteger(root.dailyBudgetMinutes) && root.dailyBudgetMinutes >= 0
  ) && !root.timeLimitPolicy) {
    return validationResult('invalid_time_limit_payload');
  }
  if (scope === 'viewing_space' && !(root.viewingSpace || 'allowMain' in root || 'allowKids' in root || 'defaultLaunchTarget' in root)) {
    return validationResult('invalid_viewing_space_payload');
  }
  return null;
}

function validateIntegrityBinding(envelope) {
  const signed = safeObject(safeObject(envelope.integrity).signedFields);
  if (Object.keys(signed).length === 0) return validationResult('missing_integrity_binding');
  for (const field of ['linkId', 'scope', 'targetProfileId', 'sourceDeviceId', 'revision', 'policyHash']) {
    if (signed[field] !== envelope[field]) return validationResult(`integrity_${field}_mismatch`);
  }
  if (signed.payloadScope !== getPayloadScopeFamily(envelope.payload)) {
    return validationResult('integrity_payload_scope_mismatch');
  }
  return null;
}

function validateManagedPolicyEnvelope(envelope, context = baseContext()) {
  const link = context.trustedLink || {};
  if (!envelope || typeof envelope !== 'object') return validationResult('missing_envelope');
  if (envelope.type !== 'filtertube_managed_policy') return validationResult('wrong_type');
  for (const field of ['linkId', 'scope', 'targetProfileId', 'sourceProfileId', 'sourceDeviceId', 'revision', 'policyHash', 'sourcePublicKeyId', 'keyVersion', 'integrity', 'payload']) {
    if (envelope[field] === undefined || envelope[field] === null || envelope[field] === '') {
      return validationResult(`missing_${field}`);
    }
  }
  if (!Number.isInteger(envelope.revision) || envelope.revision <= 0) return validationResult('invalid_revision');
  if (!Number.isInteger(envelope.keyVersion) || envelope.keyVersion <= 0) return validationResult('invalid_keyVersion');
  if (!envelope.integrity?.algorithm || !envelope.integrity?.signature) return validationResult('missing_integrity');
  const payloadDecision = validatePayloadScope(envelope.scope, envelope.payload);
  if (payloadDecision) return payloadDecision;
  const integrityDecision = validateIntegrityBinding(envelope);
  if (integrityDecision) return integrityDecision;
  if (link.type !== 'managed_link') return validationResult('link_not_managed');
  if (link.localRole !== 'replica' || link.remoteRole !== 'source') return validationResult('wrong_link_roles');
  if (link.revoked) return validationResult('link_revoked');
  if (link.keyRevoked) return validationResult('key_revoked');
  if (link.stalePairing) return validationResult('stale_pairing');
  if (envelope.linkId !== link.id) return validationResult('wrong_link_id');
  if (envelope.sourceDeviceId !== link.sourceDeviceId) return validationResult('wrong_source_device');
  if ((context.duplicateDeviceIds || []).includes(envelope.sourceDeviceId)) return validationResult('duplicate_source_device_id');
  if (envelope.sourceProfileId !== link.sourceProfileId) return validationResult('wrong_source_profile');
  if (envelope.targetProfileId !== link.targetProfileId) return validationResult('wrong_target_profile');
  if (!link.allowedScopes?.includes(envelope.scope)) return validationResult('scope_not_allowed');
  if (envelope.sourcePublicKeyId !== link.sourcePublicKeyId) return validationResult('wrong_public_key');
  if (envelope.keyVersion !== link.keyVersion) return validationResult('wrong_key_version');

  const sourceProfile = context.profiles?.[envelope.sourceProfileId];
  const targetProfile = context.profiles?.[envelope.targetProfileId];
  if (!sourceProfile || sourceProfile.type === 'child') return validationResult('source_not_parent_authority');
  if (!targetProfile || targetProfile.type !== 'child') return validationResult('target_not_protected_child');
  if (targetProfile.parentProfileId !== sourceProfile.id) return validationResult('source_not_bound_to_target');

  if (context.signatureVerified !== true && context.integrityVerified !== true) {
    const verifier = context.verifyIntegritySignature || context.verifyManagedPolicySignature;
    if (typeof verifier !== 'function') return validationResult('missing_signature_verifier');
    const verification = verifier({
      envelope,
      integrity: safeObject(envelope.integrity),
      signedFields: safeObject(envelope.integrity?.signedFields),
      payloadScope: getPayloadScopeFamily(envelope.payload),
      trustedLink: link
    });
    if (verification && typeof verification.then === 'function') return validationResult('async_signature_verifier_unsupported');
    const verificationObject = safeObject(verification);
    const verified = verification === true || verificationObject.verified === true || verificationObject.accepted === true;
    if (!verified) return validationResult(verificationObject.reason || 'signature_invalid');
  }

  const accepted = context.accepted || null;
  if (accepted) {
    if (envelope.revision < accepted.revision) return validationResult('stale_revision');
    if (envelope.revision === accepted.revision && envelope.policyHash !== accepted.policyHash) {
      return validationResult('equal_revision_hash_conflict');
    }
    if (envelope.revision === accepted.revision && envelope.policyHash === accepted.policyHash) {
      return { accepted: true, decision: 'idempotent_same_hash' };
    }
  }

  return { accepted: true, decision: 'accept_newer_revision' };
}

test('managed policy schema contract document pins required envelope and receive-side gated runtime boundary', () => {
  const doc = read(docPath);
  const inventory = read(inventoryPath);
  const runtime = [
    read('js/nanah_sync_adapter.js'),
    read('js/tab-view.js'),
    read('js/io_manager.js'),
    read('js/background.js')
  ].join('\n');

  assert.match(doc, /Status\*\*: Runtime validation helper, receive-side validation context, and\s+adapter WebCrypto verifier plumbing are present/);
  assert.match(doc, /validated managed apply\s+wrapper now persists accepted-revision state/);
  assert.match(doc, /filtertube_managed_policy/);
  assert.match(doc, /Managed Envelope Shape/);
  assert.match(doc, /Revision Decision Matrix/);
  assert.match(doc, /Negative Fixture Requirements/);
  assert.match(doc, /runtime filtertube_managed_policy envelope support: validation helper plus validated apply wrapper present/);
  assert.match(doc, /runtime filtertube_managed_policy receive path: parses envelope, builds validation context, applies only accepted envelopes, records protected evidence/);
  assert.match(doc, /runtime managed policy persistent accepted-revision writer: present/);
  assert.match(doc, /runtime managed policy signature verifier gate: present/);
  assert.match(doc, /runtime Nanah adapter key-verification context: WebCrypto Ed25519 helper present/);
  assert.match(doc, /runtime remote profile write from filtertube_managed_policy: enabled only through applyManagedPolicyEnvelope/);
  assert.match(inventory, /validated managed policy apply wrapper/i);
  assert.match(inventory, /accepted revision\/hash state/i);
  assert.match(inventory, /signature verifier gate/i);
  assert.match(inventory, /partial canonical payload\/integrity binding/i);
  assert.match(runtime, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(runtime, /function buildManagedNanahPolicyValidationContext\(envelope, profilesV4 = profilesV4Cache\)/);
  assert.match(runtime, /async function verifyManagedNanahPolicyIntegritySignature\(envelope, trustedLink\)/);
  assert.match(runtime, /sourcePublicKeyJwk: safeObject\(trusted\.sourcePublicKeyJwk \|\| policy\.sourcePublicKeyJwk \|\| policy\.publicKeyJwk\)/);
  assert.match(runtime, /context\.verifyIntegritySignature = \(\) => signatureVerification/);
  assert.match(runtime, /context\.signatureVerified = true/);
  assert.match(runtime, /verifyManagedNanahPolicyIntegritySignature,/);
  assert.match(runtime, /function getManagedNanahPolicyAcceptedState\(profile, linkId, scope\)/);
  assert.match(runtime, /function handleNanahIncomingManagedPolicyEnvelope\(envelope\)/);
  assert.match(runtime, /async function applyManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(runtime, /filtertube_managed_policy/);
  assert.match(runtime, /Managed policy envelopes require validated managed apply flow/);
  assert.match(runtime, /missing_signature_verifier/);
  assert.match(runtime, /missing_public_key_material/);
  assert.match(runtime, /webcrypto_ed25519/);
  assert.match(runtime, /signature_invalid/);
  assert.doesNotMatch(runtime, /managedPolicyRevisionStore/);
});

test('managed policy envelope accepts trusted parent to fixed child target with newer revision', () => {
  const result = validateManagedPolicyEnvelope(baseEnvelope(), baseContext());
  assert.deepEqual(result, { accepted: true, decision: 'accept_newer_revision' });
});

test('managed policy schema rejects missing required envelope fields', () => {
  const requiredFields = [
    ['targetProfileId', 'missing_targetProfileId'],
    ['sourceDeviceId', 'missing_sourceDeviceId'],
    ['scope', 'missing_scope'],
    ['revision', 'missing_revision'],
    ['sourcePublicKeyId', 'missing_sourcePublicKeyId'],
    ['integrity', 'missing_integrity']
  ];

  for (const [field, reason] of requiredFields) {
    const envelope = baseEnvelope();
    delete envelope[field];
    assert.deepEqual(validateManagedPolicyEnvelope(envelope, baseContext()), { accepted: false, reason }, field);
  }
});

test('managed policy schema rejects child source sibling target and wrong authority bindings', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    sourceProfileId: 'child-profile-1'
  }), baseContext({
    trustedLink: { ...baseContext().trustedLink, sourceProfileId: 'child-profile-1' }
  })), { accepted: false, reason: 'source_not_parent_authority' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    targetProfileId: 'sibling-profile-1'
  }), baseContext({
    trustedLink: { ...baseContext().trustedLink, targetProfileId: 'sibling-profile-1' }
  })), { accepted: false, reason: 'source_not_bound_to_target' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    targetProfileId: 'other-child-profile'
  }), baseContext()), { accepted: false, reason: 'wrong_target_profile' });
});

test('managed policy schema rejects local-network discovery and trusted-link spoof cases', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    trustedLink: { ...baseContext().trustedLink, type: 'discovered_peer' }
  })), { accepted: false, reason: 'link_not_managed' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({ linkId: 'link-other' }), baseContext()), { accepted: false, reason: 'wrong_link_id' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({ sourceDeviceId: 'attacker-device' }), baseContext()), { accepted: false, reason: 'wrong_source_device' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({ duplicateDeviceIds: ['parent-device-1'] })), { accepted: false, reason: 'duplicate_source_device_id' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    trustedLink: { ...baseContext().trustedLink, stalePairing: true }
  })), { accepted: false, reason: 'stale_pairing' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    trustedLink: { ...baseContext().trustedLink, revoked: true }
  })), { accepted: false, reason: 'link_revoked' });
});

test('managed policy schema rejects key and integrity failures', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({ sourcePublicKeyId: 'wrong-key' }), baseContext()), { accepted: false, reason: 'wrong_public_key' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({ keyVersion: 2 }), baseContext()), { accepted: false, reason: 'wrong_key_version' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    trustedLink: { ...baseContext().trustedLink, keyRevoked: true }
  })), { accepted: false, reason: 'key_revoked' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({ integrity: { algorithm: 'ed25519' } }), baseContext()), { accepted: false, reason: 'missing_integrity' });
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    integrity: { algorithm: 'ed25519', signature: 'signature-without-binding' }
  }), baseContext()), { accepted: false, reason: 'missing_integrity_binding' });
  const signedScopeMismatch = baseEnvelope();
  signedScopeMismatch.integrity = {
    ...signedScopeMismatch.integrity,
    signedFields: { ...signedScopeMismatch.integrity.signedFields, scope: 'channels' }
  };
  assert.deepEqual(validateManagedPolicyEnvelope(signedScopeMismatch, baseContext()), { accepted: false, reason: 'integrity_scope_mismatch' });
  const signedPayloadMismatch = baseEnvelope();
  signedPayloadMismatch.integrity = {
    ...signedPayloadMismatch.integrity,
    signedFields: { ...signedPayloadMismatch.integrity.signedFields, payloadScope: 'channels' }
  };
  assert.deepEqual(validateManagedPolicyEnvelope(signedPayloadMismatch, baseContext()), { accepted: false, reason: 'integrity_payload_scope_mismatch' });
});

test('managed policy schema requires explicit signature verification evidence after binding checks', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    verifyIntegritySignature: null
  })), { accepted: false, reason: 'missing_signature_verifier' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    verifyIntegritySignature: () => false
  })), { accepted: false, reason: 'signature_invalid' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    verifyIntegritySignature: () => ({ verified: false, reason: 'signature_key_mismatch' })
  })), { accepted: false, reason: 'signature_key_mismatch' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    verifyIntegritySignature: () => Promise.resolve(true)
  })), { accepted: false, reason: 'async_signature_verifier_unsupported' });

  const observed = {};
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope(), baseContext({
    verifyIntegritySignature(input) {
      Object.assign(observed, input);
      return { verified: true };
    }
  })), { accepted: true, decision: 'accept_newer_revision' });
  assert.equal(observed.envelope.type, 'filtertube_managed_policy');
  assert.equal(observed.integrity.algorithm, 'ed25519');
  assert.equal(observed.signedFields.linkId, 'link-parent-child-1');
  assert.equal(observed.payloadScope, 'keywords');
  assert.equal(observed.trustedLink.sourcePublicKeyId, 'parent-key-3');
});

test('managed policy payload family must match the envelope scope before trusted apply', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'keywords',
    payload: {
      scope: 'channels',
      operations: [{ op: 'add_channel', channelId: 'UCblocked' }]
    }
  }), baseContext()), { accepted: false, reason: 'payload_scope_mismatch' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'channels',
    policyHash: 'hash-channel-5',
    payload: {
      scope: 'channels',
      operations: [{ op: 'add_keyword', value: 'wrong-family' }]
    }
  }), baseContext()), { accepted: false, reason: 'payload_scope_mismatch' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'time_limits',
    policyHash: 'hash-time-5',
    payload: {
      scope: 'time_limits',
      dailyBudgetMinutes: -1
    }
  }), baseContext()), { accepted: false, reason: 'invalid_time_limit_payload' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'viewing_space',
    policyHash: 'hash-space-5',
    payload: {
      scope: 'viewing_space',
      allowMain: true,
      allowKids: false,
      defaultLaunchTarget: 'main'
    }
  }), baseContext()), { accepted: true, decision: 'accept_newer_revision' });
});

test('managed policy revision matrix accepts idempotent equal hash and rejects stale or conflicting revisions', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    revision: 4,
    policyHash: 'hash-keyword-4'
  }), baseContext()), { accepted: true, decision: 'idempotent_same_hash' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    revision: 3,
    policyHash: 'hash-keyword-3'
  }), baseContext()), { accepted: false, reason: 'stale_revision' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    revision: 4,
    policyHash: 'hash-other'
  }), baseContext()), { accepted: false, reason: 'equal_revision_hash_conflict' });
});

test('managed policy revision matrix accepts stricter time-limit update only from trusted parent authority', () => {
  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'time_limits',
    revision: 7,
    policyHash: 'hash-time-7',
    payload: { scope: 'time_limits', dailyBudgetMinutes: 90 }
  }), baseContext({
    accepted: { revision: 6, policyHash: 'hash-time-6' }
  })), { accepted: true, decision: 'accept_newer_revision' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'time_limits',
    revision: 7,
    policyHash: 'hash-time-7',
    payload: { scope: 'time_limits', dailyBudgetMinutes: 90 }
  }), baseContext({
    accepted: { revision: 6, policyHash: 'hash-time-6' },
    trustedLink: { ...baseContext().trustedLink, revoked: true }
  })), { accepted: false, reason: 'link_revoked' });
});
