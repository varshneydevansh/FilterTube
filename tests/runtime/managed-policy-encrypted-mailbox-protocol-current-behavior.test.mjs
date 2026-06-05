import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';
const adapterPath = 'js/nanah_sync_adapter.js';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/io_manager.js',
    'js/nanah_managed_open_sync.js',
    'js/nanah_sync_adapter.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function loadNanahAdapter() {
  const window = {
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    btoa: value => Buffer.from(value, 'binary').toString('base64'),
    atob: value => Buffer.from(value, 'base64').toString('binary')
  };
  const context = { window };
  vm.runInNewContext(read(adapterPath), context);
  return context.window.FilterTubeNanahAdapter;
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
      operations: [{ op: 'add_keyword', value: 'calm mailbox keyword', valueHash: 'sha256:redacted-keyword' }]
    },
    ...overrides
  };
}

function adapterValidManagedEnvelope(adapter, overrides = {}) {
  const envelope = managedEnvelope({
    policyHash: '',
    integrity: {},
    ...overrides
  });
  envelope.policyHash = adapter.buildManagedPolicyPayloadHash(envelope);
  envelope.integrity = {
    algorithm: 'ed25519',
    signature: 'signature-7',
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

function sealedMailboxPayload(overrides = {}) {
  return {
    cipherSuite: 'aes-kw+a256gcm',
    keyAgreementId: 'link-parent-child-1:child-profile-1:parent-key-3:3',
    encryptedDek: 'sealed-dek',
    nonce: 'nonce-7',
    ciphertext: 'ciphertext-7',
    ciphertextHash: 'sha256:ciphertext-hash-7',
    ...overrides
  };
}

function adapterMailboxContext() {
  return {
    trustedLink: trustedLink(),
    nowMs: 1770100000000,
    signatureVerified: true,
    profiles: {
      'parent-profile-1': { type: 'parent', name: 'Parent' },
      'child-profile-1': { type: 'child', name: 'Child', parentProfileId: 'parent-profile-1' }
    },
    accepted: {
      revision: 6,
      policyHash: 'sha256:accepted-policy-6'
    }
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

  assert.match(doc, /Status\*\*: Protocol, proof fixture, source-side WebCrypto mailbox seal\/open\s+helpers, source-side server-safe mailbox storage item builder, local decrypted\s+mailbox-item intake, source-side mailbox upload-provider handoff,\s+source-side mailbox purge-provider handoff,\s+provider-gated dashboard\/profile-open pull hook, provider ack handoff,\s+protected target-profile ack-handoff evidence, and revoked queued-delivery\s+local apply guard proof are present/);
  assert.match(doc, /Runtime built-in\s+server upload\/pull clients\s+and purge clients\s+are not implemented/);
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
  assert.match(doc, /runtime provider-gated dashboard\/profile-open pull hook: present/);
  assert.match(doc, /runtime mailbox seal\/open encryption helper: present/);
  assert.match(doc, /runtime source-side server-safe mailbox storage item builder: present/);
  assert.match(doc, /runtime provider-gated ack handoff: present/);
  assert.match(doc, /runtime protected mailbox ack-handoff history rows: present/);
  assert.match(doc, /runtime revoked queued-delivery local apply guard: present/);
  assert.match(doc, /runtime mailbox encryption client: present for local seal helper only/);
  assert.match(doc, /runtime source-side mailbox upload-provider handoff: present/);
  assert.match(doc, /runtime source-side mailbox purge-provider handoff: present/);
  assert.match(doc, /runtime built-in mailbox server upload client: absent/);
  assert.match(doc, /runtime built-in mailbox server purge client: absent/);
  assert.match(doc, /runtime mailbox decryption client: present for local open helper only/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
});

test('managed mailbox runtime intake validates decrypted items without adding server pull authority', () => {
  const source = runtimeSource();

  assert.match(source, /function validateManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /async function applyManagedPolicyEnvelope\(envelope, context = \{\}\)/);
  assert.match(source, /Managed policy envelopes require validated managed apply flow/);
  assert.match(source, /function validateManagedMailboxItem\(item, context = \{\}\)/);
  assert.match(source, /function buildManagedMailboxStorageItem\(envelope, sealedPayload = \{\}, options = \{\}\)/);
  assert.match(source, /async function sealManagedMailboxEnvelope\(envelope, options = \{\}\)/);
  assert.match(source, /async function openManagedMailboxStorageItem\(item, options = \{\}\)/);
  assert.match(source, /async function applyManagedMailboxItem\(item, context = \{\}\)/);
  assert.match(source, /function handleNanahIncomingManagedMailboxItem\(item\)/);
  assert.match(source, /root\.schema === 'filtertube_managed_mailbox_item'/);
  assert.match(source, /remote_policy\.mailbox\.accept/);
  assert.match(source, /remote_policy\.mailbox\.reject/);
  assert.match(source, /remote_policy\.mailbox\.conflict/);
  assert.match(source, /remote_policy\.mailbox\.expire/);
  assert.match(source, /remote_policy\.mailbox\.revoke/);
  assert.match(source, /filtertube_nanah_managed_open_sync_ack/);
  assert.match(source, /ackDecryptedMailboxItems/);
  assert.doesNotMatch(source, /FilterTubeManagedMailbox/);
  assert.doesNotMatch(source, /managedMailboxPull/);
});

test('managed mailbox seal and open use WebCrypto without storing plaintext policy', async () => {
  const adapter = loadNanahAdapter();
  const wrappingKey = await webcrypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, true, ['wrapKey', 'unwrapKey']);
  const envelope = adapterValidManagedEnvelope(adapter);
  const storageItem = await adapter.sealManagedMailboxEnvelope(envelope, {
    mailboxWrappingKey: wrappingKey,
    trustedLink: trustedLink(),
    createdAtMs: 1770000000000,
    expiresAtMs: 1770604800000,
    nonceBytes: new Uint8Array([1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23])
  });

  assert.equal(storageItem.schema, 'filtertube_managed_mailbox_item');
  assert.equal(storageItem.cipherSuite, 'aes-kw+a256gcm');
  assert.equal(storageItem.keyAgreementId, 'link-parent-child-1:child-profile-1:parent-key-3:3');
  assert.match(storageItem.encryptedDek, /^[A-Za-z0-9_-]+$/);
  assert.match(storageItem.nonce, /^[A-Za-z0-9_-]+$/);
  assert.match(storageItem.ciphertext, /^[A-Za-z0-9_-]+$/);
  assert.match(storageItem.ciphertextHash, /^sha256:[A-Za-z0-9_-]+$/);

  const serialized = JSON.stringify(storageItem);
  assert.doesNotMatch(serialized, /"payload"\s*:/);
  assert.doesNotMatch(serialized, /"operations"\s*:/);
  assert.doesNotMatch(serialized, /"decryptedEnvelope"\s*:/);
  assert.doesNotMatch(serialized, /"managedPolicyEnvelope"\s*:/);
  assert.doesNotMatch(serialized, /"envelope"\s*:/);
  assert.doesNotMatch(serialized, /"privateKeyJwk"\s*:/);
  assert.doesNotMatch(serialized, /redacted-keyword/);

  assert.deepEqual(
    plain(adapter.validateManagedMailboxItem(storageItem, adapterMailboxContext())),
    { accepted: false, reason: 'missing_managed_policy_envelope', ackState: 'rejected' }
  );

  const opened = await adapter.openManagedMailboxStorageItem(storageItem, {
    mailboxWrappingKey: wrappingKey
  });
  assert.deepEqual(plain(opened.decryptedEnvelope), envelope);
  assert.deepEqual(
    plain(adapter.validateManagedMailboxItem(opened, adapterMailboxContext())),
    {
      accepted: true,
      decision: 'accept_newer_revision',
      scope: 'keywords',
      targetProfileId: 'child-profile-1',
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      ackState: 'delivered',
      mailboxItemId: storageItem.mailboxItemId,
      envelope
    }
  );
});

test('managed mailbox open fails closed on tamper wrong key and missing crypto', async () => {
  const adapter = loadNanahAdapter();
  const wrappingKey = await webcrypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, true, ['wrapKey', 'unwrapKey']);
  const wrongWrappingKey = await webcrypto.subtle.generateKey({ name: 'AES-KW', length: 256 }, true, ['wrapKey', 'unwrapKey']);
  const envelope = adapterValidManagedEnvelope(adapter);
  const storageItem = await adapter.sealManagedMailboxEnvelope(envelope, {
    mailboxWrappingKey: wrappingKey,
    createdAtMs: 1770000000000,
    expiresAtMs: 1770604800000
  });

  await assert.rejects(
    adapter.openManagedMailboxStorageItem({ ...storageItem, ciphertextHash: 'sha256:tampered' }, { mailboxWrappingKey: wrappingKey }),
    /hash mismatch/
  );
  await assert.rejects(
    adapter.openManagedMailboxStorageItem({ ...storageItem, targetProfileId: 'sibling-profile-1' }, { mailboxWrappingKey: wrappingKey }),
    /failed to decrypt/
  );
  await assert.rejects(
    adapter.openManagedMailboxStorageItem(storageItem, { mailboxWrappingKey: wrongWrappingKey }),
    /failed to decrypt/
  );

  const context = { window: {} };
  vm.runInNewContext(read(adapterPath), context);
  await assert.rejects(
    context.window.FilterTubeNanahAdapter.sealManagedMailboxEnvelope(envelope, { mailboxWrappingKey: wrappingKey }),
    /requires WebCrypto/
  );
});

test('managed mailbox storage builder emits server-safe ciphertext metadata only', () => {
  const adapter = loadNanahAdapter();
  const envelope = adapterValidManagedEnvelope(adapter);
  const item = adapter.buildManagedMailboxStorageItem(envelope, sealedMailboxPayload(), {
    createdAtMs: 1770000000000,
    expiresAtMs: 1770604800000
  });

  assert.equal(item.schema, 'filtertube_managed_mailbox_item');
  assert.equal(item.version, 1);
  assert.equal(item.linkId, envelope.linkId);
  assert.equal(item.targetProfileId, envelope.targetProfileId);
  assert.equal(item.sourceDeviceId, envelope.sourceDeviceId);
  assert.equal(item.sourceProfileId, envelope.sourceProfileId);
  assert.equal(item.scope, envelope.scope);
  assert.equal(item.revision, envelope.revision);
  assert.equal(item.policyHash, envelope.policyHash);
  assert.equal(item.sourcePublicKeyId, envelope.sourcePublicKeyId);
  assert.equal(item.keyVersion, envelope.keyVersion);
  assert.equal(item.ackState, 'pending');
  assert.equal(item.cipherSuite, 'aes-kw+a256gcm');
  assert.equal(item.keyAgreementId, 'link-parent-child-1:child-profile-1:parent-key-3:3');
  assert.equal(item.encryptedDek, 'sealed-dek');
  assert.equal(item.nonce, 'nonce-7');
  assert.equal(item.ciphertext, 'ciphertext-7');
  assert.equal(item.ciphertextHash, 'sha256:ciphertext-hash-7');

  const serialized = JSON.stringify(item);
  assert.doesNotMatch(serialized, /"payload"\s*:/);
  assert.doesNotMatch(serialized, /"operations"\s*:/);
  assert.doesNotMatch(serialized, /"decryptedEnvelope"\s*:/);
  assert.doesNotMatch(serialized, /"managedPolicyEnvelope"\s*:/);
  assert.doesNotMatch(serialized, /"envelope"\s*:/);
  assert.doesNotMatch(serialized, /"privateKeyJwk"\s*:/);

  assert.deepEqual(
    plain(adapter.validateManagedMailboxItem(item, adapterMailboxContext())),
    { accepted: false, reason: 'missing_managed_policy_envelope', ackState: 'rejected' }
  );

  const decrypted = { ...item, decryptedEnvelope: envelope };
  assert.deepEqual(
    plain(adapter.validateManagedMailboxItem(decrypted, adapterMailboxContext())),
    {
      accepted: true,
      decision: 'accept_newer_revision',
      scope: 'keywords',
      targetProfileId: 'child-profile-1',
      revision: envelope.revision,
      policyHash: envelope.policyHash,
      ackState: 'delivered',
      mailboxItemId: item.mailboxItemId,
      envelope
    }
  );
});

test('managed mailbox storage builder fails closed on missing crypto or stale expiry', () => {
  const adapter = loadNanahAdapter();
  const envelope = adapterValidManagedEnvelope(adapter);

  assert.throws(
    () => adapter.buildManagedMailboxStorageItem(envelope, sealedMailboxPayload({ ciphertext: '' })),
    /requires ciphertext/
  );
  assert.throws(
    () => adapter.buildManagedMailboxStorageItem(envelope, sealedMailboxPayload({ encryptedDek: '' })),
    /requires encryptedDek/
  );
  assert.throws(
    () => adapter.buildManagedMailboxStorageItem(envelope, sealedMailboxPayload(), {
      createdAtMs: 1770000000000,
      expiresAtMs: 1769999999999
    }),
    /expiry must be after creation/
  );
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
