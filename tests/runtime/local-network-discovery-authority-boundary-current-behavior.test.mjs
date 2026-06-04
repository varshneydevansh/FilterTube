import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function trustedLink(overrides = {}) {
  return {
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
    stalePairing: false,
    quarantined: false,
    ...overrides
  };
}

function discoveredPeer(overrides = {}) {
  return {
    source: 'lan_discovery',
    deviceId: 'parent-device-1',
    label: 'Parent phone',
    publicKeyId: 'parent-key-3',
    networkReachable: true,
    duplicateDeviceId: false,
    ...overrides
  };
}

function managedEnvelope(overrides = {}) {
  return {
    type: 'filtertube_managed_policy',
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    targetProfileId: 'child-profile-1',
    revision: 5,
    policyHash: 'hash-keywords-5',
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    integrity: {
      algorithm: 'ed25519',
      signature: 'signature-keywords-5'
    },
    payload: {
      operations: [{ op: 'add_keyword', valueHash: 'sha256:keyword-hash' }]
    },
    ...overrides
  };
}

function context(overrides = {}) {
  return {
    acceptedRevision: 4,
    acceptedPolicyHash: 'hash-keywords-4',
    duplicateDeviceIds: [],
    ...overrides
  };
}

function reject(reason, extra = {}) {
  return { accepted: false, reason, ...extra };
}

function evaluateLocalNetworkPolicy({ peer = discoveredPeer(), link = trustedLink(), envelope = managedEnvelope(), state = context() } = {}) {
  if (!peer?.networkReachable) return { accepted: false, decision: 'keep_last_valid_policy', reason: 'peer_unreachable' };
  if (peer.source === 'page_message' || peer.source === 'content_script') return reject('untrusted_message_source');
  if (!link || link.type !== 'managed_link') return reject('discovery_without_pairing');
  if (link.localRole !== 'replica' || link.remoteRole !== 'source') return reject('wrong_link_roles');
  if (link.revoked) return reject('link_revoked');
  if (link.keyRevoked) return reject('key_revoked');
  if (link.stalePairing) return reject('stale_pairing');
  if (link.quarantined) return reject('trusted_link_quarantined');
  if (peer.duplicateDeviceId || state.duplicateDeviceIds.includes(peer.deviceId)) return reject('duplicate_source_device_id');
  if (peer.deviceId !== link.sourceDeviceId) return reject('discovered_device_mismatch');
  if (peer.publicKeyId && peer.publicKeyId !== link.sourcePublicKeyId) return reject('discovered_key_mismatch');
  if (!envelope || envelope.type !== 'filtertube_managed_policy') return reject('missing_managed_policy_envelope');
  if (envelope.linkId !== link.id) return reject('wrong_link_id');
  if (envelope.sourceDeviceId !== link.sourceDeviceId) return reject('wrong_source_device');
  if (envelope.sourceProfileId !== link.sourceProfileId) return reject('wrong_source_profile');
  if (envelope.targetProfileId !== link.targetProfileId) return reject('wrong_target_profile');
  if (!link.allowedScopes.includes(envelope.scope)) return reject('scope_not_allowed');
  if (envelope.sourcePublicKeyId !== link.sourcePublicKeyId) return reject('wrong_public_key');
  if (envelope.keyVersion !== link.keyVersion) return reject('wrong_key_version');
  if (!envelope.integrity?.algorithm || !envelope.integrity?.signature) return reject('missing_integrity');
  if (envelope.revision < state.acceptedRevision) return reject('stale_revision');
  if (envelope.revision === state.acceptedRevision && envelope.policyHash !== state.acceptedPolicyHash) {
    return reject('equal_revision_hash_conflict');
  }
  return envelope.revision === state.acceptedRevision
    ? { accepted: true, decision: 'idempotent_same_hash' }
    : { accepted: true, decision: 'accept_newer_revision' };
}

function rejectedHistoryRow(reason, overrides = {}) {
  return {
    schema: 'filtertube_managed_action_history',
    version: 1,
    actionType: 'remote_policy.reject',
    scope: 'sync_policy',
    result: 'rejected',
    reason,
    targetProfileId: 'child-profile-1',
    actorDeviceId: 'parent-device-1',
    trustedLinkId: 'link-parent-child-1',
    summary: {
      redacted: true,
      label: `Rejected local-network policy: ${reason}`
    },
    sensitive: true,
    ...overrides
  };
}

test('local-network discovery authority boundary is validation-backed and linked from plan and inventory', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Managed-policy validation helper present/);
  assert.match(doc, /Runtime local-network\s+discovery behavior is unchanged/);
  assert.match(doc, /Local-network discovery is convenience only/);
  assert.match(doc, /Boundary Rows/);
  assert.match(doc, /Hostile LAN Threat Model/);
  assert.match(doc, /No-Work And Performance Boundary/);
  assert.match(doc, /runtime local-network discovery authority gate: absent/);
  assert.match(doc, /runtime filtertube_managed_policy envelope validator: present/);
  assert.match(doc, /runtime managed signature verifier gate: present/);
  assert.match(doc, /runtime behavior changed by this contract: validation helper and verifier gate only/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));

  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /Managed policy envelopes require validated managed apply flow/);
  assert.doesNotMatch(source, /FilterTubeLocalNetworkDiscovery/);
  assert.doesNotMatch(source, /managedLanDiscovery/);
  assert.doesNotMatch(source, /localNetworkPolicyApply/);
});

test('local-network discovery cannot grant authority without trusted pairing and signed envelope', () => {
  assert.deepEqual(evaluateLocalNetworkPolicy({}), { accepted: true, decision: 'accept_newer_revision' });
  assert.deepEqual(evaluateLocalNetworkPolicy({ link: null }), reject('discovery_without_pairing'));
  assert.deepEqual(evaluateLocalNetworkPolicy({ envelope: null }), reject('missing_managed_policy_envelope'));
  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ source: 'page_message' })
  }), reject('untrusted_message_source'));
  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ integrity: { algorithm: 'ed25519' } })
  }), reject('missing_integrity'));
});

test('hostile LAN fixtures reject spoofed duplicate stale revoked and wrong-key peers', () => {
  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ deviceId: 'attacker-device' })
  }), reject('discovered_device_mismatch'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ duplicateDeviceId: true })
  }), reject('duplicate_source_device_id'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    state: context({ duplicateDeviceIds: ['parent-device-1'] })
  }), reject('duplicate_source_device_id'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    link: trustedLink({ stalePairing: true })
  }), reject('stale_pairing'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    link: trustedLink({ revoked: true })
  }), reject('link_revoked'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ publicKeyId: 'attacker-key' })
  }), reject('discovered_key_mismatch'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    link: trustedLink({ keyRevoked: true })
  }), reject('key_revoked'));
});

test('network reachability and address changes do not weaken last valid managed policy', () => {
  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ networkReachable: false })
  }), { accepted: false, decision: 'keep_last_valid_policy', reason: 'peer_unreachable' });

  assert.deepEqual(evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ networkAddress: '192.168.1.45' })
  }), { accepted: true, decision: 'accept_newer_revision' });
});

test('local-network policy authority still rejects wrong target scope replay and conflict cases', () => {
  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ targetProfileId: 'sibling-profile-1' })
  }), reject('wrong_target_profile'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ scope: 'telemetry' })
  }), reject('scope_not_allowed'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ revision: 3, policyHash: 'hash-keywords-3' })
  }), reject('stale_revision'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ revision: 4, policyHash: 'hash-other' })
  }), reject('equal_revision_hash_conflict'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ revision: 4, policyHash: 'hash-keywords-4' })
  }), { accepted: true, decision: 'idempotent_same_hash' });
});

test('rejected local-network attempts produce protected redacted history rows not policy authority', () => {
  const row = rejectedHistoryRow('discovered_device_mismatch');
  assert.equal(row.schema, 'filtertube_managed_action_history');
  assert.equal(row.result, 'rejected');
  assert.equal(row.sensitive, true);
  assert.equal(row.summary.redacted, true);
  assert.doesNotMatch(JSON.stringify(row), /spiders|plaintextValue/);

  const doc = read(docPath);
  for (const fixture of [
    'lan_discovery_without_pairing',
    'lan_peer_announcement_spoof',
    'lan_duplicate_device_id',
    'lan_stale_pairing_record',
    'lan_nat_reconnect_identity_drift',
    'lan_wrong_key_mitm',
    'lan_page_message_spoof',
    'lan_revoked_trust_reappears',
    'lan_mailbox_after_revocation',
    'lan_reachability_loss'
  ]) {
    assert.match(doc, new RegExp(`\\\`${fixture}\\\``));
  }
});
