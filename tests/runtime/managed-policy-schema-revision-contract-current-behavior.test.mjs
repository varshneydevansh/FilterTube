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
    ...overrides
  };
}

function baseEnvelope(overrides = {}) {
  return {
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
    integrity: {
      algorithm: 'ed25519',
      signature: 'signature-keyword-5'
    },
    payload: {
      operations: [{ op: 'add_keyword', value: 'spiders' }]
    },
    ...overrides
  };
}

function validationResult(reason, extra = {}) {
  return { accepted: false, reason, ...extra };
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

test('managed policy schema contract document pins required envelope and runtime boundary', () => {
  const doc = read(docPath);
  const inventory = read(inventoryPath);
  const runtime = [
    read('js/nanah_sync_adapter.js'),
    read('js/tab-view.js'),
    read('js/io_manager.js'),
    read('js/background.js')
  ].join('\n');

  assert.match(doc, /Status\*\*: Contract\/proof fixture only/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /filtertube_managed_policy/);
  assert.match(doc, /Managed Envelope Shape/);
  assert.match(doc, /Revision Decision Matrix/);
  assert.match(doc, /Negative Fixture Requirements/);
  assert.match(doc, /runtime filtertube_managed_policy envelope support: absent/);
  assert.match(doc, /runtime managed policy revision store: absent/);
  assert.match(inventory, /No managed policy envelope/);
  assert.match(inventory, /No revision store/);
  assert.match(inventory, /No signature\/integrity check/);
  assert.doesNotMatch(runtime, /filtertube_managed_policy/);
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
    payload: { dailyBudgetMinutes: 90 }
  }), baseContext({
    accepted: { revision: 6, policyHash: 'hash-time-6' }
  })), { accepted: true, decision: 'accept_newer_revision' });

  assert.deepEqual(validateManagedPolicyEnvelope(baseEnvelope({
    scope: 'time_limits',
    revision: 7,
    policyHash: 'hash-time-7',
    payload: { dailyBudgetMinutes: 90 }
  }), baseContext({
    accepted: { revision: 6, policyHash: 'hash-time-6' },
    trustedLink: { ...baseContext().trustedLink, revoked: true }
  })), { accepted: false, reason: 'link_revoked' });
});
