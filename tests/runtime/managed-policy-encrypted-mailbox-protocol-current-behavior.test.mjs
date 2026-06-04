import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md';
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
    revision: 7,
    policyHash: 'sha256:policy-hash-7',
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    integrity: {
      algorithm: 'ed25519',
      signature: 'signature-7'
    },
    payload: {
      operations: [{ op: 'add_keyword', valueHash: 'sha256:redacted-keyword' }]
    },
    ...overrides
  };
}

function mailboxItem(overrides = {}) {
  const envelope = overrides.decryptedEnvelope || managedEnvelope(overrides.envelopeOverrides || {});
  return {
    schema: 'filtertube_managed_mailbox_item',
    version: 1,
    mailboxItemId: 'mbx_child-profile-1_keywords_7',
    linkId: 'link-parent-child-1',
    targetProfileId: 'child-profile-1',
    sourceDeviceId: 'parent-device-1',
    sourceProfileId: 'parent-profile-1',
    scope: 'keywords',
    revision: 7,
    policyHash: 'sha256:policy-hash-7',
    sourcePublicKeyId: 'parent-key-3',
    keyVersion: 3,
    encryptedDek: 'sealed-dek',
    nonce: 'nonce-7',
    ciphertext: 'ciphertext-7',
    ciphertextHash: 'sha256:ciphertext-hash-7',
    createdAtMs: 1770000000000,
    expiresAtMs: 1770604800000,
    ackState: 'pending',
    decryptable: true,
    decryptedEnvelope: envelope,
    ...overrides
  };
}

function deliveryState(overrides = {}) {
  return {
    nowMs: 1770100000000,
    acceptedRevision: 6,
    acceptedPolicyHash: 'sha256:policy-hash-6',
    deliveredItems: new Set(),
    ...overrides
  };
}

function reject(reason, extra = {}) {
  return { accepted: false, applied: false, ackState: 'rejected', reason, ...extra };
}

function compareMailboxBinding(item, envelope) {
  for (const key of [
    'linkId',
    'targetProfileId',
    'sourceDeviceId',
    'sourceProfileId',
    'scope',
    'revision',
    'policyHash',
    'sourcePublicKeyId',
    'keyVersion'
  ]) {
    if (item[key] !== envelope[key]) return `ciphertext_binding_${key}_mismatch`;
  }
  return null;
}

function evaluateMailboxDelivery({
  item = mailboxItem(),
  link = trustedLink(),
  state = deliveryState()
} = {}) {
  if (!item || item.schema !== 'filtertube_managed_mailbox_item') return reject('missing_mailbox_item');
  if (!link || link.type !== 'managed_link') return reject('missing_trusted_link');
  if (link.localRole !== 'replica' || link.remoteRole !== 'source') return reject('wrong_link_roles');
  if (link.revoked) return reject('link_revoked', { ackState: 'revoked' });
  if (link.keyRevoked) return reject('key_revoked', { ackState: 'revoked' });
  if (item.expiresAtMs <= state.nowMs) return reject('mailbox_item_expired', { ackState: 'expired' });
  if (!item.ciphertext || !item.encryptedDek || !item.nonce) return reject('missing_ciphertext');
  if (item.linkId !== link.id) return reject('wrong_link_id');
  if (item.targetProfileId !== link.targetProfileId) return reject('wrong_target_profile');
  if (item.sourceDeviceId !== link.sourceDeviceId) return reject('wrong_source_device');
  if (item.sourceProfileId !== link.sourceProfileId) return reject('wrong_source_profile');
  if (!link.allowedScopes.includes(item.scope)) return reject('scope_not_allowed');
  if (item.sourcePublicKeyId !== link.sourcePublicKeyId) return reject('wrong_public_key');
  if (item.keyVersion !== link.keyVersion) return reject('wrong_key_version');
  if (!item.decryptable) return reject('decryption_failed');

  const envelope = item.decryptedEnvelope;
  if (!envelope || envelope.type !== 'filtertube_managed_policy') return reject('missing_managed_policy_envelope');
  const bindingError = compareMailboxBinding(item, envelope);
  if (bindingError) return reject(bindingError);
  if (!envelope.integrity?.algorithm || !envelope.integrity?.signature) return reject('missing_integrity');

  if (state.deliveredItems.has(item.mailboxItemId) && item.revision === state.acceptedRevision && item.policyHash === state.acceptedPolicyHash) {
    return { accepted: true, applied: false, ackState: 'delivered', decision: 'duplicate_idempotent_same_hash' };
  }
  if (item.revision < state.acceptedRevision) return reject('stale_revision');
  if (item.revision === state.acceptedRevision && item.policyHash !== state.acceptedPolicyHash) {
    return reject('equal_revision_hash_conflict', { ackState: 'conflict' });
  }
  if (item.revision === state.acceptedRevision) {
    return { accepted: true, applied: false, ackState: 'delivered', decision: 'idempotent_same_hash' };
  }
  return { accepted: true, applied: true, ackState: 'delivered', decision: 'accept_newer_revision' };
}

function protectedMailboxHistoryRow(reason, overrides = {}) {
  return {
    schema: 'filtertube_managed_action_history',
    version: 1,
    actionType: 'remote_policy.mailbox.reject',
    result: 'rejected',
    reason,
    trustedLinkId: 'link-parent-child-1',
    sourceDeviceId: 'parent-device-1',
    targetProfileId: 'child-profile-1',
    scope: 'keywords',
    revision: 7,
    policyHash: 'sha256:policy-hash-7',
    summary: {
      redacted: true,
      label: `Rejected mailbox policy: ${reason}`
    },
    sensitive: true,
    ...overrides
  };
}

test('managed mailbox protocol is docs-backed and linked from plan and inventory', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(doc, /Status\*\*: Protocol, proof fixture, and local decrypted mailbox-item intake are\s+present/);
  assert.match(doc, /Runtime server mailbox pull is not\s+implemented/);
  assert.match(doc, /The mailbox server is storage and relay only/);
  assert.match(doc, /must never receive plaintext rules, keywords, channel names,\s+video ids, viewing-space settings, time budgets, PIN values, or action-history\s+summaries/);
  assert.match(doc, /filtertube_managed_mailbox_item/);
  assert.match(doc, /validateManagedPolicyEnvelope\(\.\.\.\)/);
  assert.match(doc, /applyManagedPolicyEnvelope\(\.\.\.\)/);
  assert.match(doc, /Equal revision with different hash/);
  assert.match(doc, /Link revoked before delivery/);
  assert.match(doc, /Wrong target profile/);
  assert.match(doc, /Missing or undecryptable ciphertext/);
  assert.match(doc, /last valid accepted parent policy remains active/);
  assert.match(doc, /Server metadata is not enough to apply policy/);
  assert.match(doc, /No-policy\/no-work YouTube runtime performance remains a release gate/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('managed mailbox runtime intake validates decrypted items without adding server pull authority', () => {
  const source = runtimeSource();

  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /async function applyManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /Managed policy envelopes require validated managed apply flow/);
  assert.match(source, /function validateManagedMailboxItem\(item, context = \{\}\)/);
  assert.match(source, /async function applyManagedMailboxItem\(item, context = \{\}\)/);
  assert.match(source, /function handleNanahIncomingManagedMailboxItem\(item\)/);
  assert.match(source, /root\.schema === 'filtertube_managed_mailbox_item'/);
  assert.match(source, /remote_policy\.mailbox\.accept/);
  assert.match(source, /remote_policy\.mailbox\.reject/);
  assert.match(source, /remote_policy\.mailbox\.conflict/);
  assert.match(source, /remote_policy\.mailbox\.expire/);
  assert.match(source, /remote_policy\.mailbox\.revoke/);
  assert.doesNotMatch(source, /FilterTubeManagedMailbox/);
  assert.doesNotMatch(source, /managedMailboxPull/);
});

test('managed mailbox delivery accepts only newer trusted ciphertext-backed policy', () => {
  assert.deepEqual(
    evaluateMailboxDelivery(),
    { accepted: true, applied: true, ackState: 'delivered', decision: 'accept_newer_revision' }
  );

  assert.deepEqual(
    evaluateMailboxDelivery({
      item: mailboxItem({ revision: 6, policyHash: 'sha256:policy-hash-6', envelopeOverrides: { revision: 6, policyHash: 'sha256:policy-hash-6' } })
    }),
    { accepted: true, applied: false, ackState: 'delivered', decision: 'idempotent_same_hash' }
  );

  assert.deepEqual(
    evaluateMailboxDelivery({
      item: mailboxItem({ revision: 5, policyHash: 'sha256:policy-hash-5', envelopeOverrides: { revision: 5, policyHash: 'sha256:policy-hash-5' } })
    }),
    reject('stale_revision')
  );

  assert.deepEqual(
    evaluateMailboxDelivery({
      item: mailboxItem({ revision: 6, policyHash: 'sha256:policy-hash-other', envelopeOverrides: { revision: 6, policyHash: 'sha256:policy-hash-other' } })
    }),
    reject('equal_revision_hash_conflict', { ackState: 'conflict' })
  );
});

test('managed mailbox rejects revoked expired wrong-target wrong-source wrong-key and bad-ciphertext cases', () => {
  assert.deepEqual(evaluateMailboxDelivery({
    link: trustedLink({ revoked: true })
  }), reject('link_revoked', { ackState: 'revoked' }));

  assert.deepEqual(evaluateMailboxDelivery({
    link: trustedLink({ keyRevoked: true })
  }), reject('key_revoked', { ackState: 'revoked' }));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ expiresAtMs: 1770000000000 })
  }), reject('mailbox_item_expired', { ackState: 'expired' }));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ targetProfileId: 'sibling-profile-1' })
  }), reject('wrong_target_profile'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ sourceDeviceId: 'attacker-device' })
  }), reject('wrong_source_device'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ sourceProfileId: 'sibling-parent-profile' })
  }), reject('wrong_source_profile'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ linkId: 'other-link' })
  }), reject('wrong_link_id'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ scope: 'telemetry' })
  }), reject('scope_not_allowed'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ sourcePublicKeyId: 'attacker-key' })
  }), reject('wrong_public_key'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ keyVersion: 4 })
  }), reject('wrong_key_version'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ ciphertext: '' })
  }), reject('missing_ciphertext'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ decryptable: false })
  }), reject('decryption_failed'));
});

test('managed mailbox binding rejects ciphertext metadata mismatches after decrypt', () => {
  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ envelopeOverrides: { targetProfileId: 'sibling-profile-1' } })
  }), reject('ciphertext_binding_targetProfileId_mismatch'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ envelopeOverrides: { policyHash: 'sha256:tampered-policy' } })
  }), reject('ciphertext_binding_policyHash_mismatch'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ envelopeOverrides: { integrity: { algorithm: 'ed25519' } } })
  }), reject('missing_integrity'));

  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ decryptedEnvelope: { type: 'app_sync' } })
  }), reject('missing_managed_policy_envelope'));
});

test('managed mailbox duplicate and history fixtures stay idempotent and redacted', () => {
  assert.deepEqual(evaluateMailboxDelivery({
    item: mailboxItem({ revision: 6, policyHash: 'sha256:policy-hash-6', envelopeOverrides: { revision: 6, policyHash: 'sha256:policy-hash-6' } }),
    state: deliveryState({
      acceptedRevision: 6,
      acceptedPolicyHash: 'sha256:policy-hash-6',
      deliveredItems: new Set(['mbx_child-profile-1_keywords_7'])
    })
  }), { accepted: true, applied: false, ackState: 'delivered', decision: 'duplicate_idempotent_same_hash' });

  const row = protectedMailboxHistoryRow('wrong_target_profile');
  assert.equal(row.schema, 'filtertube_managed_action_history');
  assert.equal(row.sensitive, true);
  assert.equal(row.summary.redacted, true);
  assert.doesNotMatch(JSON.stringify(row), /plaintext|spiders|channelName|videoTitle/);

  const doc = read(docPath);
  for (const fixture of [
    'accept_newer_revision',
    'idempotent_same_hash',
    'equal_revision_hash_conflict',
    'link_revoked',
    'key_revoked',
    'wrong_target_profile',
    'scope_not_allowed',
    'mailbox_item_expired',
    'decryption_failed',
    'duplicate_idempotent_same_hash'
  ]) {
    assert.match(`${doc}\n${evaluateMailboxDelivery.toString()}`, new RegExp(fixture));
  }
});
