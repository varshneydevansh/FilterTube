import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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

let adapterCache = null;

function nanahAdapter() {
  if (adapterCache) return adapterCache;
  const sandbox = {
    crypto: { randomUUID: () => 'nanah-local-network-test-uuid' },
    navigator: { platform: 'TestOS' },
    Date: { now: () => 1779300000000 },
    Math
  };
  vm.runInNewContext(read('js/nanah_sync_adapter.js'), sandbox, { filename: 'js/nanah_sync_adapter.js' });
  adapterCache = sandbox.FilterTubeNanahAdapter;
  assert.ok(adapterCache, 'Nanah adapter export should exist');
  return adapterCache;
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
  const hasIntegrityOverride = Object.prototype.hasOwnProperty.call(overrides, 'integrity');
  const adapter = nanahAdapter();
  const envelope = {
    type: 'filtertube_managed_policy',
    linkId: 'link-parent-child-1',
    scope: 'keywords',
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    targetProfileId: 'child-profile-1',
    revision: 5,
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    payload: {
      scope: 'keywords',
      operations: [{ op: 'add_keyword', valueHash: 'sha256:keyword-hash' }]
    },
    ...overrides
  };
  if (!Object.prototype.hasOwnProperty.call(overrides, 'policyHash')) {
    envelope.policyHash = adapter.buildManagedPolicyPayloadHash(envelope);
  }
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
      payloadScope: 'keywords'
    }
  };
  return envelope;
}

function context(overrides = {}) {
  const acceptedEnvelope = managedEnvelope({ revision: 4 });
  return {
    trustedLink: trustedLink(),
    profiles: {
      'parent-profile-1': { id: 'parent-profile-1', type: 'account' },
      'child-profile-1': { id: 'child-profile-1', type: 'child', parentProfileId: 'parent-profile-1' },
      'sibling-profile-1': { id: 'sibling-profile-1', type: 'child', parentProfileId: 'other-parent-profile' }
    },
    accepted: {
      revision: 4,
      policyHash: acceptedEnvelope.policyHash
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

function reject(reason, extra = {}) {
  return { accepted: false, reason, ...extra };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function evaluateLocalNetworkPolicy({ peer = discoveredPeer(), link = trustedLink(), envelope = managedEnvelope(), state = context() } = {}) {
  return plain(nanahAdapter().validateManagedLocalNetworkCandidate({
    peer,
    trustedLink: link,
    envelope
  }, state));
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

  assert.match(doc, /Status\*\*: Managed-policy validation\/apply, signed live Nanah send, mailbox\s+intake, revision state, protected history evidence, adapter-level\s+local-network candidate validation, dashboard local-network candidate receive\s+handling, and a provider-gated dashboard\/profile-open local-network candidate\s+discovery hook plus redacted provider ack handoff are present/);
  assert.match(doc, /Runtime built-in\s+LAN peer discovery and LAN delivery are\s+still absent/);
  assert.match(doc, /Local-network discovery is convenience only/);
  assert.match(doc, /Boundary Rows/);
  assert.match(doc, /Hostile LAN Threat Model/);
  assert.match(doc, /No-Work And Performance Boundary/);
  assert.match(doc, /runtime local-network candidate authority gate: present in js\/nanah_sync_adapter\.js/);
  assert.match(doc, /runtime local-network candidate receive bridge: present in js\/tab-view\.js/);
  assert.match(doc, /runtime provider-gated local-network candidate discovery hook: present in js\/tab-view\.js/);
  assert.match(doc, /runtime built-in local-network peer discovery: absent/);
  assert.match(doc, /runtime built-in LAN delivery: absent/);
  assert.match(doc, /runtime filtertube_managed_policy envelope validator: present/);
  assert.match(doc, /runtime managed policy revision store: present on target profile remoteManagedPolicies/);
  assert.match(doc, /runtime managed validation-history writer: present for Nanah, mailbox, and local-network candidate managed-policy receive events/);
  assert.match(doc, /runtime managed accepted-apply action-history writer: present behind validated apply wrappers/);
  assert.match(doc, /runtime managed signature verifier gate: present with dashboard\/WebCrypto key verifier context/);
  assert.match(doc, /runtime signed live Nanah managed-policy send: present/);
  assert.match(doc, /runtime local\/decrypted mailbox item intake: present/);
  assert.match(doc, /runtime provider-gated local-network ack handoff: present/);
  assert.match(doc, /runtime protected local-network ack-handoff history writer: present/);
  assert.match(doc, /provider-gated candidate discovery and ack handoff do not add built-in LAN peer discovery or LAN delivery/);
  assert.match(doc, /no\s+built-in LAN peer discovery or LAN delivery runtime exists in\s+the extension/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));

  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /function validateManagedLocalNetworkCandidate\(candidate, context = \{\}\)/);
  assert.match(source, /function handleNanahIncomingManagedLocalNetworkCandidate\(candidate\)/);
  assert.match(source, /function getNanahManagedLocalNetworkProvider\(\)/);
  assert.match(source, /window\.FilterTubeManagedPolicyLocalNetwork/);
  assert.match(source, /discoverManagedPolicyCandidates/);
  assert.match(source, /schema === 'filtertube_managed_local_network_candidate'/);
  assert.match(source, /transport: 'local_network'/);
  assert.match(source, /const sanitizedCandidate = \{\s*peer,\s*envelope,\s*source: normalizeString\(root\.source\),\s*networkReachable: root\.networkReachable\s*\}/s);
  assert.match(source, /validateManagedLocalNetworkCandidate\(sanitizedCandidate, context\)/);
  assert.match(source, /Managed policy envelopes require validated managed apply flow/);
  assert.match(source, /remoteManagedPolicies/);
  assert.match(source, /applyManagedPolicyEnvelope/);
  assert.match(source, /verifyManagedNanahPolicyIntegritySignature/);
  assert.doesNotMatch(source, /validateManagedLocalNetworkCandidate\(root, context\)/);
  assert.doesNotMatch(source, /FilterTubeLocalNetworkDiscovery/);
  assert.doesNotMatch(source, /managedLanDiscovery/);
  assert.doesNotMatch(source, /localNetworkPolicyApply/);
});

test('local-network discovery cannot grant authority without trusted pairing and signed envelope', () => {
  const accepted = evaluateLocalNetworkPolicy({});
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.decision, 'accept_newer_revision');
  assert.equal(accepted.targetProfileId, 'child-profile-1');
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

  const accepted = evaluateLocalNetworkPolicy({
    peer: discoveredPeer({ networkAddress: '192.168.1.45' })
  });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.decision, 'accept_newer_revision');
});

test('local-network policy authority still rejects wrong target scope replay and conflict cases', () => {
  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ targetProfileId: 'sibling-profile-1' })
  }), reject('wrong_target_profile'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ scope: 'telemetry' })
  }), reject('scope_not_allowed'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ revision: 3 })
  }), reject('stale_revision'));

  assert.deepEqual(evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({
      revision: 4,
      payload: {
        scope: 'keywords',
        operations: [{ op: 'add_keyword', valueHash: 'sha256:other-keyword-hash' }]
      }
    })
  }), reject('equal_revision_hash_conflict'));

  const idempotent = evaluateLocalNetworkPolicy({
    envelope: managedEnvelope({ revision: 4 })
  });
  assert.equal(idempotent.accepted, true);
  assert.equal(idempotent.decision, 'idempotent_same_hash');
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
