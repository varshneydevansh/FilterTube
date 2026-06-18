import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

const approvedActionTypes = new Set([
  'rule.video.block',
  'rule.keyword.add',
  'rule.keyword.remove',
  'rule.channel.block',
  'rule.channel.unblock',
  'policy.viewing_space.update',
  'policy.time_limit.update',
  'policy.time_limit.request_extra',
  'policy.channel_list.import',
  'policy.channel_list.remove',
  'policy.channel_list.check',
  'policy.channel_list.refresh',
  'policy.channel_list.pause',
  'policy.channel_list.resume',
  'policy.sync_policy.update',
  'trust_link.create',
  'trust_link.revoke',
  'trust_link.key_revoke',
  'managed_signing_key.rotate',
  'admin_session.unlock',
  'admin_session.failed_unlock',
  'local_policy.update',
  'remote_policy.accept',
  'remote_policy.reject',
  'remote_policy.conflict',
  'remote_policy.mailbox.accept',
  'remote_policy.mailbox.reject',
  'remote_policy.mailbox.conflict',
  'remote_policy.mailbox.expire',
  'remote_policy.mailbox.revoke',
  'remote_policy.mailbox.ack',
  'history.clear'
]);

const approvedScopes = new Set([
  'main',
  'kids',
  'videos',
  'keywords',
  'channels',
  'viewing_space',
  'time_limits',
  'sync_policy',
  'admin_session',
  'trust_link'
]);

const resultKinds = new Set([
  'accepted',
  'rejected',
  'conflict',
  'failed_auth',
  'expired_session',
  'cleared_by_admin'
]);

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

function validAcceptedRow(overrides = {}) {
  return {
    rowId: 'history-row-1',
    schema: 'filtertube_managed_action_history',
    version: 1,
    actorProfileId: 'parent-profile-1',
    actorDeviceId: 'parent-device-1',
    targetProfileId: 'child-profile-1',
    trustedLinkId: 'link-parent-child-1',
    actionType: 'remote_policy.accept',
    scope: 'keywords',
    revision: 5,
    policyHash: 'hash-keyword-5',
    result: 'accepted',
    reason: null,
    receivedAt: 1780480800000,
    issuedAt: 1780480790000,
    orderKey: '000001:000005:1780480800000',
    summary: {
      redacted: true,
      valueHash: 'sha256:keyword-value-hash',
      label: 'Added 1 keyword'
    },
    sensitive: true,
    ...overrides
  };
}

function validFailedAuthRow(overrides = {}) {
  return validAcceptedRow({
    rowId: 'history-row-failed-auth-1',
    trustedLinkId: null,
    actionType: 'admin_session.failed_unlock',
    scope: 'admin_session',
    revision: null,
    policyHash: null,
    result: 'failed_auth',
    reason: 'history_clear_unlock_failed',
    summary: {
      redacted: true,
      label: 'Parent unlock failed'
    },
    ...overrides
  });
}

function validClearRow(overrides = {}) {
  return validAcceptedRow({
    rowId: 'history-row-clear-1',
    trustedLinkId: null,
    actionType: 'history.clear',
    scope: 'admin_session',
    revision: null,
    policyHash: null,
    result: 'cleared_by_admin',
    reason: 'accepted_rows_cleared',
    summary: {
      redacted: true,
      label: 'Parent cleared accepted history',
      clearedAcceptedRows: 3,
      retainedProtectedRows: 1
    },
    ...overrides
  });
}

function validRemoteRateLimitedRow(overrides = {}) {
  return validAcceptedRow({
    rowId: 'history-row-remote-rate-limited-1',
    actionType: 'remote_policy.reject',
    result: 'rejected',
    reason: 'missing_signature_verifier',
    summary: {
      redacted: true,
      label: 'Rejected remote keywords policy',
      transport: 'local_network',
      remoteFailedAttempts: 20,
      remoteFailedAttemptLimit: 20,
      rateLimited: true,
      retryAt: 1780521100000
    },
    ...overrides
  });
}

function validMailboxAckRow(overrides = {}) {
  return validAcceptedRow({
    rowId: 'history-row-mailbox-ack-1',
    actionType: 'remote_policy.mailbox.ack',
    scope: 'keywords',
    revision: 9,
    policyHash: 'hash-keyword-9',
    result: 'accepted',
    reason: null,
    summary: {
      redacted: true,
      label: 'Mailbox ack delivered',
      transport: 'mailbox',
      mailboxItemId: 'mailbox-item-1',
      ackState: 'delivered',
      providerAckedItemCount: 1,
      providerFailedAckCount: 0
    },
    ...overrides
  });
}

function validChannelListCheckRow(overrides = {}) {
  return validAcceptedRow({
    rowId: 'history-row-channel-list-check-1',
    trustedLinkId: null,
    actionType: 'policy.channel_list.check',
    scope: 'channels',
    revision: 12,
    policyHash: 'hash-channel-list-check-12',
    result: 'accepted',
    reason: null,
    summary: {
      redacted: true,
      label: 'Channel list checked',
      surface: 'main',
      checkedCount: 24,
      listEntryCount: 312,
      contentChanged: false
    },
    ...overrides
  });
}

function validEncryptedSummary(overrides = {}) {
  return {
    schema: 'filtertube_managed_action_history_encrypted_summary',
    version: 1,
    cipherSuite: 'AES-GCM-256',
    keyId: 'managed-history-key-1',
    nonce: 'nonce_base64url_1',
    ciphertext: 'ciphertext_base64url_1',
    ciphertextHash: 'sha256:encrypted-history-summary-hash',
    createdAt: 1780480800000,
    ...overrides
  };
}

function validateEncryptedSummary(summary) {
  const root = summary && typeof summary === 'object' ? summary : {};
  if (root.schema !== 'filtertube_managed_action_history_encrypted_summary') return { ok: false, reason: 'wrong_schema' };
  for (const key of ['payload', 'operations', 'keywords', 'channels', 'videoIds', 'plaintextValue', 'ruleValue', 'summary', 'label']) {
    if (Object.prototype.hasOwnProperty.call(root, key)) return { ok: false, reason: `plaintext_${key}` };
  }
  for (const field of ['cipherSuite', 'keyId', 'nonce', 'ciphertext', 'ciphertextHash']) {
    if (!String(root[field] || '').trim()) return { ok: false, reason: `missing_${field}` };
  }
  return { ok: true };
}

const safeHistoryDisplayLabels = Object.freeze({
  'remote_policy.reject': 'Remote policy rejected',
  'policy.time_limit.update': 'Time limit policy changed'
});

function formatHistoryDisplayFixture(row) {
  const item = row && typeof row === 'object' ? row : {};
  const summary = item.summary && typeof item.summary === 'object' ? item.summary : {};
  const date = Number.isFinite(Number(item.receivedAt))
    ? new Date(Number(item.receivedAt)).toLocaleString()
    : 'Unknown time';
  const scope = String(item.scope || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '_')
    .slice(0, 96) || 'policy';
  const result = String(item.result || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '_')
    .slice(0, 96) || 'unknown';
  const actionType = String(item.actionType || '').trim();
  const safeLabel = safeHistoryDisplayLabels[actionType] || actionType || 'Managed action';
  const label = item.sensitive === true ? safeLabel : (String(summary.label || '').trim() || safeLabel);
  const reason = String(item.reason || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:-]+/g, '_')
    .slice(0, 96);
  return reason
    ? `${date} - ${result} - ${scope} - ${label} (${reason})`
    : `${date} - ${result} - ${scope} - ${label}`;
}

function nextRemoteFailedAttemptState(existing = null, { now = 1780520500000, reason = 'missing_signature_verifier' } = {}) {
  const resetAt = Number(existing?.resetAt);
  const activeWindow = existing?.schema === 'filtertube_managed_remote_failed_attempt_rate_limit'
    && Number.isFinite(resetAt)
    && now < resetAt;
  const priorCount = activeWindow ? Math.max(0, Math.floor(Number(existing.failedAttempts) || 0)) : 0;
  const failedAttempts = priorCount + 1;
  return {
    schema: 'filtertube_managed_remote_failed_attempt_rate_limit',
    version: 1,
    key: 'local_network:link-parent-child-1:parent-device-1:child-profile-1:keywords',
    transport: 'local_network',
    trustedLinkId: 'link-parent-child-1',
    sourceDeviceId: 'parent-device-1',
    targetProfileId: 'child-profile-1',
    scope: 'keywords',
    failedAttempts,
    limit: 20,
    resetAt: activeWindow ? resetAt : now + (10 * 60 * 1000),
    updatedAt: now,
    rateLimited: failedAttempts >= 20,
    lastReason: reason
  };
}

function validateHistoryRow(row) {
  if (!row || typeof row !== 'object') return { ok: false, reason: 'missing_row' };
  for (const field of [
    'rowId',
    'schema',
    'version',
    'actorDeviceId',
    'targetProfileId',
    'actionType',
    'scope',
    'result',
    'receivedAt',
    'orderKey',
    'summary',
    'sensitive'
  ]) {
    if (row[field] === undefined || row[field] === null || row[field] === '') {
      return { ok: false, reason: `missing_${field}` };
    }
  }
  if (row.schema !== 'filtertube_managed_action_history') return { ok: false, reason: 'wrong_schema' };
  if (row.version !== 1) return { ok: false, reason: 'wrong_version' };
  if (!approvedActionTypes.has(row.actionType)) return { ok: false, reason: 'unknown_action_type' };
  if (!approvedScopes.has(row.scope)) return { ok: false, reason: 'unknown_scope' };
  if (!resultKinds.has(row.result)) return { ok: false, reason: 'unknown_result' };
  if (row.result !== 'accepted' && !row.reason) return { ok: false, reason: 'missing_rejection_reason' };
  if (row.actionType.startsWith('remote_policy.') && !row.trustedLinkId) return { ok: false, reason: 'missing_trusted_link' };
  if (row.actionType.startsWith('remote_policy.') && (!Number.isInteger(row.revision) || !row.policyHash)) {
    return { ok: false, reason: 'missing_policy_revision' };
  }
  if (row.sensitive === true && row.summary?.plaintextValue) return { ok: false, reason: 'sensitive_plaintext_value' };
  return { ok: true };
}

function canManageProfile(actor, target) {
  if (!actor || !target) return false;
  if (actor.type === 'child') return false;
  if (actor.type === 'default') return true;
  if (actor.type === 'account' && target.type === 'child' && target.parentProfileId === actor.id) return true;
  return actor.id === target.id && actor.type !== 'child';
}

function historyAccessDecision({ actor, target, operation, hasRecentAdminAuth = false, rows = [] }) {
  if (!canManageProfile(actor, target)) return { allowed: false, reason: 'not_parent_authority' };
  if (operation === 'view') return { allowed: true, decision: 'view_allowed' };
  if (operation !== 'clear') return { allowed: false, reason: 'unknown_operation' };

  const protectedRows = rows.filter((row) => [
    'rejected',
    'conflict',
    'failed_auth',
    'expired_session'
  ].includes(row.result) || [
    'trust_link.revoke',
    'trust_link.key_revoke',
    'managed_signing_key.rotate',
    'policy.time_limit.update',
    'policy.time_limit.request_extra',
    'policy.viewing_space.update',
    'policy.channel_list.import',
    'policy.channel_list.remove',
    'policy.channel_list.check',
    'policy.channel_list.refresh',
    'policy.channel_list.pause',
    'policy.channel_list.resume'
  ].includes(row.actionType));

  if (protectedRows.length > 0 && !hasRecentAdminAuth) {
    return { allowed: false, reason: 'reauth_required_for_protected_evidence' };
  }
  if (protectedRows.length > 0) {
    return { allowed: true, decision: 'clear_accepted_rows_only_preserve_protected_evidence' };
  }
  return { allowed: true, decision: 'clear_allowed' };
}

test('managed policy action-history model is linked from plan and has protected access plus remote validation history helpers', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Local protected history access proof present; failed parent unlock\s+history writer present for managed-profile gates; remote managed-policy\s+validation history writer present/);
  assert.match(doc, /Issue 60 asks for feedback, logs, or history/);
  assert.match(doc, /Action history is protected evidence and parent\/caregiver UX/);
  assert.match(doc, /It is not policy\s+authority/);
  assert.match(doc, /Nanah receive\s+path now also parses\s+`filtertube_managed_policy` envelopes/);
  assert.match(doc, /local\/decrypted `filtertube_managed_mailbox_item` outcomes/);
  assert.match(doc, /local-network candidate\s+`filtertube_managed_local_network_candidate`\s+outcomes/);
  assert.match(doc, /remote failed-attempt rate-limit\s+state/);
  assert.match(doc, /Pull-on-open mailbox ack handoff now records redacted protected/);
  assert.match(doc, /Provider-gated local-network candidate ack handoff now records\s+redacted protected `remote_policy\.local_network\.ack` rows/);
  assert.match(doc, /validated remote accepted apply history can now be recorded/);
  assert.match(doc, /Required History Row Shape/);
  assert.match(doc, /Approved Action Types/);
  assert.match(doc, /Access Control/);
  assert.match(doc, /Retention, Redaction, And Local Storage/);
  assert.match(doc, /ciphertext-only encryptedSummary metadata accepted/);
  assert.match(doc, /filtertube_managed_action_history_encrypted_summary/);
  assert.match(doc, /Required Recorded Outcomes/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
  assert.match(source, /filtertube_managed_action_history/);
  assert.match(source, /recordManagedChildLocalEditHistory/);
  assert.match(source, /function getManagedActionHistoryRows\(profile\)/);
  assert.match(source, /function managedActionHistoryRowIsProtected\(row\)/);
  assert.match(source, /function canViewManagedActionHistory\(profilesV4, targetProfileId\)/);
  assert.match(source, /function showManagedActionHistory\(profileId, options = \{\}\)/);
  assert.match(source, /function clearManagedActionHistory\(profileId\)/);
  assert.match(source, /actionType: 'history\.clear'/);
  assert.match(source, /result: 'cleared_by_admin'/);
  assert.match(source, /accepted_rows_cleared/);
  assert.match(source, /retainedProtectedRows: protectedRows\.length/);
  assert.match(source, /function recordManagedAdminAuthFailureHistory\(profilesV4, targetProfileId, reason = 'unlock_failed'\)/);
  assert.match(source, /admin_session\.failed_unlock/);
  assert.match(source, /failed_auth/);
  assert.match(source, /function recordManagedNanahPolicyValidationHistory\(envelope, decision, context = \{\}\)/);
  assert.match(source, /MANAGED_REMOTE_FAILED_ATTEMPT_SCHEMA/);
  assert.match(source, /filtertube_managed_remote_failed_attempt_rate_limit/);
  assert.match(source, /MANAGED_REMOTE_FAILED_ATTEMPT_LIMIT = 20/);
  assert.match(source, /remoteFailedAttemptRateLimits/);
  assert.match(source, /remoteFailedAttempts: remoteFailedAttempt\.failedAttempts/);
  assert.match(source, /remoteFailedAttemptLimit: remoteFailedAttempt\.limit/);
  assert.match(source, /rateLimited: remoteFailedAttempt\.rateLimited/);
  assert.match(source, /retryAt: remoteFailedAttempt\.resetAt/);
  assert.match(source, /function resolveManagedRemoteHistoryActionType\(\{ accepted, conflict, reason, transport \}\)/);
  assert.match(source, /remote_policy\.mailbox\.accept/);
  assert.match(source, /remote_policy\.mailbox\.reject/);
  assert.match(source, /remote_policy\.mailbox\.conflict/);
  assert.match(source, /remote_policy\.mailbox\.expire/);
  assert.match(source, /remote_policy\.mailbox\.revoke/);
  assert.match(source, /function handleNanahIncomingManagedMailboxItem\(item\)/);
  assert.match(source, /function recordManagedOpenSyncAckHistory\(details = \{\}\)/);
  assert.match(source, /remote_policy\.mailbox\.ack/);
  assert.match(source, /remote_policy\.local_network\.ack/);
  assert.match(source, /const transportLabel = transport === 'local_network' \? 'Home Bridge' : 'Pick Up Later'/);
  assert.match(source, /\$\{transportLabel\} ack delivered/);
  assert.match(source, /\$\{transportLabel\} ack handoff failed/);
  assert.match(source, /recordAckHistory: \(details\) => recordManagedOpenSyncAckHistory\(details\)/);
  assert.match(source, /MANAGED_ACTION_HISTORY_SAFE_LABELS = Object\.freeze/);
  assert.match(source, /'policy\.channel_list\.check': 'Approved list checked'/);
  assert.match(source, /MANAGED_ACTION_HISTORY_PROTECTED_ACTIONS = new Set\(\[/);
  assert.match(source, /'policy\.channel_list\.check'/);
  assert.match(source, /actionType === 'policy\.channel_list\.check'/);
  assert.match(source, /MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_SCHEMA/);
  assert.match(source, /function sanitizeManagedActionHistoryEncryptedSummary\(value\)/);
  assert.match(source, /safe_counts_status_transport_and_ciphertext_only/);
  assert.match(source, /MANAGED_ACTION_HISTORY_ENCRYPTED_SUMMARY_FORBIDDEN_KEYS/);
  assert.match(source, /function formatManagedActionHistoryRow\(row\)/);
  assert.match(source, /item\.sensitive === true \? safeLabel/);
  assert.ok(source.includes("replace(/[^a-z0-9_.:-]+/g, '_')"));
  assert.match(source, /function handleNanahIncomingManagedLocalNetworkCandidate\(candidate\)/);
  assert.match(source, /function handleNanahIncomingManagedPolicyEnvelope\(envelope\)/);
  assert.match(source, /root\.type === 'filtertube_managed_policy'/);
  assert.match(source, /root\.schema === 'filtertube_managed_mailbox_item'/);
  assert.match(source, /root\.schema === 'filtertube_managed_local_network_candidate'/);
  assert.match(source, /applyManagedPolicyEnvelope\(envelope, context\)/);
  assert.match(source, /applyManagedMailboxItem\(item, context\)/);
  assert.match(source, /validateManagedLocalNetworkCandidate\(sanitizedCandidate, context\)/);
  assert.match(read('js/nanah_managed_live_policy.js'), /filtertube_managed_outbound_policy_history/);
  assert.match(read('js/nanah_managed_live_policy.js'), /outboundManagedPolicyHistory/);
  assert.match(read('js/nanah_managed_live_policy.js'), /filtertube_nanah_managed_live_ack/);
  assert.match(read('js/nanah_managed_live_policy.js'), /inboundManagedAckHistory/);
  assert.match(source, /function getNanahManagedPolicyScopeList\(value\)/);
  assert.match(source, /historyBtn\.textContent = 'History'/);
  assert.doesNotMatch(source, /managedActionHistoryStore/);
});

test('managed action history encrypted summary fixture is ciphertext-only and not policy authority', () => {
  const doc = read(docPath);
  const inventory = read(inventoryPath);
  const source = read('js/tab-view.js');

  assert.deepEqual(validateEncryptedSummary(validEncryptedSummary()), { ok: true });
  assert.deepEqual(validateEncryptedSummary(validEncryptedSummary({ plaintextValue: 'spiders' })), { ok: false, reason: 'plaintext_plaintextValue' });
  assert.deepEqual(validateEncryptedSummary(validEncryptedSummary({ keywords: ['spiders'] })), { ok: false, reason: 'plaintext_keywords' });
  assert.deepEqual(validateEncryptedSummary(validEncryptedSummary({ label: 'Blocked keyword spiders' })), { ok: false, reason: 'plaintext_label' });
  assert.deepEqual(validateEncryptedSummary(validEncryptedSummary({ ciphertext: '' })), { ok: false, reason: 'missing_ciphertext' });
  assert.match(doc, /Optional encrypted summaries are allowed only under\s+`summary\.encryptedSummary`/);
  assert.match(doc, /rejects plaintext-like keys such as `payload`, `operations`, `keywords`,\s+`channels`, `videoIds`, `plaintextValue`, `ruleValue`, `summary`, or `label`/);
  assert.match(inventory, /ciphertext-only encrypted summary metadata preservation/);
  assert.match(source, /next\.encryptedSummary = encryptedSummary/);
  assert.doesNotMatch(source, /encryptedSummaryStore/);
});

test('managed history display redacts sensitive labels and normalizes visible reason codes', () => {
  const sensitiveDisplay = formatHistoryDisplayFixture(validRemoteRateLimitedRow({
    reason: 'Missing Signature Verifier',
    summary: {
      redacted: true,
      label: 'Blocked keyword: spiders http://example.invalid'
    }
  }));

  assert.match(sensitiveDisplay, /Remote policy rejected/);
  assert.match(sensitiveDisplay, /missing_signature_verifier/);
  assert.doesNotMatch(sensitiveDisplay, /Blocked keyword|spiders|example\.invalid/);

  const parentVisibleDisplay = formatHistoryDisplayFixture(validAcceptedRow({
    sensitive: false,
    summary: {
      redacted: false,
      label: 'Parent-visible local note'
    }
  }));
  assert.match(parentVisibleDisplay, /Parent-visible local note/);
});

test('managed policy action-history row fixture requires actor target revision result and redacted summary', () => {
  assert.deepEqual(validateHistoryRow(validAcceptedRow()), { ok: true });

  for (const [field, reason] of [
    ['rowId', 'missing_rowId'],
    ['targetProfileId', 'missing_targetProfileId'],
    ['actorDeviceId', 'missing_actorDeviceId'],
    ['actionType', 'missing_actionType'],
    ['scope', 'missing_scope'],
    ['result', 'missing_result'],
    ['receivedAt', 'missing_receivedAt'],
    ['summary', 'missing_summary']
  ]) {
    const row = validAcceptedRow();
    delete row[field];
    assert.deepEqual(validateHistoryRow(row), { ok: false, reason }, field);
  }

  assert.deepEqual(validateHistoryRow(validAcceptedRow({ schema: 'policy_state' })), { ok: false, reason: 'wrong_schema' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ actionType: 'rule.keyword.admin_override' })), { ok: false, reason: 'unknown_action_type' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ scope: 'telemetry' })), { ok: false, reason: 'unknown_scope' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ result: 'policy_authority' })), { ok: false, reason: 'unknown_result' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ result: 'rejected', reason: null })), { ok: false, reason: 'missing_rejection_reason' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ revision: null })), { ok: false, reason: 'missing_policy_revision' });
  assert.deepEqual(validateHistoryRow(validAcceptedRow({ summary: { redacted: false, plaintextValue: 'spiders' } })), { ok: false, reason: 'sensitive_plaintext_value' });
  assert.deepEqual(validateHistoryRow(validFailedAuthRow()), { ok: true });
  assert.deepEqual(validateHistoryRow(validFailedAuthRow({ reason: null })), { ok: false, reason: 'missing_rejection_reason' });
  assert.deepEqual(validateHistoryRow(validClearRow()), { ok: true });
  assert.deepEqual(validateHistoryRow(validClearRow({ reason: null })), { ok: false, reason: 'missing_rejection_reason' });
  assert.deepEqual(validateHistoryRow(validRemoteRateLimitedRow()), { ok: true });
  assert.deepEqual(validateHistoryRow(validChannelListCheckRow()), { ok: true });
  assert.deepEqual(validateHistoryRow(validRemoteRateLimitedRow({ summary: { plaintextValue: 'spiders' } })), { ok: false, reason: 'sensitive_plaintext_value' });
  assert.deepEqual(validateHistoryRow(validMailboxAckRow()), { ok: true });
  assert.deepEqual(validateHistoryRow(validMailboxAckRow({ result: 'rejected', reason: 'ack_provider_unavailable' })), { ok: true });
  assert.deepEqual(validateHistoryRow(validMailboxAckRow({ result: 'rejected', reason: null })), { ok: false, reason: 'missing_rejection_reason' });
  assert.deepEqual(validateHistoryRow(validMailboxAckRow({ summary: { plaintextValue: 'spiders' } })), { ok: false, reason: 'sensitive_plaintext_value' });
});

test('managed action history access is parent/caregiver authority not child PIN authority', () => {
  const parent = { id: 'parent-profile-1', type: 'account' };
  const defaultProfile = { id: 'default', type: 'default' };
  const child = { id: 'child-profile-1', type: 'child', parentProfileId: 'parent-profile-1' };
  const sibling = { id: 'sibling-profile-1', type: 'child', parentProfileId: 'other-parent' };
  const acceptedRows = [validAcceptedRow()];
  const protectedRows = [
    validAcceptedRow({
      rowId: 'history-row-2',
      result: 'rejected',
      reason: 'trust_revoked',
      actionType: 'remote_policy.reject'
    })
  ];
  const protectedChannelListRows = [validChannelListCheckRow()];

  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'view' }), { allowed: true, decision: 'view_allowed' });
  assert.deepEqual(historyAccessDecision({ actor: defaultProfile, target: child, operation: 'view' }), { allowed: true, decision: 'view_allowed' });
  assert.deepEqual(historyAccessDecision({ actor: child, target: child, operation: 'view' }), { allowed: false, reason: 'not_parent_authority' });
  assert.deepEqual(historyAccessDecision({ actor: sibling, target: child, operation: 'view' }), { allowed: false, reason: 'not_parent_authority' });
  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'clear', rows: acceptedRows }), { allowed: true, decision: 'clear_allowed' });
  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'clear', rows: protectedRows }), { allowed: false, reason: 'reauth_required_for_protected_evidence' });
  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'clear', rows: protectedRows, hasRecentAdminAuth: true }), {
    allowed: true,
    decision: 'clear_accepted_rows_only_preserve_protected_evidence'
  });
  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'clear', rows: protectedChannelListRows }), { allowed: false, reason: 'reauth_required_for_protected_evidence' });
  assert.deepEqual(historyAccessDecision({ actor: parent, target: child, operation: 'clear', rows: protectedChannelListRows, hasRecentAdminAuth: true }), {
    allowed: true,
    decision: 'clear_accepted_rows_only_preserve_protected_evidence'
  });
});

test('managed action history required outcomes cover accepted rejected conflict auth and clear events', () => {
  const doc = read(docPath);
  const requiredFixtures = [
    'accepted_remote_keyword_policy',
    'sent_live_remote_policy',
    'acked_live_remote_policy',
    'accepted_local_child_surface_policy',
    'rejected_spoofed_lan_policy',
    'rejected_equal_revision_conflict',
    'rejected_after_trust_revocation',
    'rate_limited_remote_policy_attempt',
    'acked_mailbox_policy_result',
    'accepted_local_time_limit_policy',
    'checked_channel_list_no_row_churn',
    'refreshed_channel_list_source_changed',
    'failed_parent_unlock',
    'cleared_by_parent'
  ];

  for (const fixture of requiredFixtures) {
    assert.match(doc, new RegExp(`\\\`${fixture}\\\``));
  }

  assert.match(doc, /default retention rows per protected profile: 500/);
  assert.match(doc, /default rejected-attempt retention days: 90/);
  assert.match(doc, /default accepted-action retention days: 30/);
  assert.match(doc, /plaintext sensitive rule values: no/);
  assert.match(doc, /remote upload or telemetry: no/);
  assert.match(doc, /runtime managed action history store: profile-local managed child rows/);
  assert.match(doc, /runtime managed action history row writer: local managed child edit plus local time-limit policy edit plus managed channel-list import\/remove\/check\/refresh\/pause\/resume plus failed parent unlock plus Nanah managed-policy validation\/apply outcomes/);
  const tabViewSource = read('js/tab-view.js');
  assert.match(tabViewSource, /function buildManagedTimeLimitLocalEditReport\(\{ actorProfileId, targetProfileId, nextPolicy, summaryExtras = null \}\)/);
  assert.match(tabViewSource, /actionType: 'policy\.time_limit\.update'/);
  assert.match(tabViewSource, /function hasUnresolvedManagedExtraTimeRequest\(profile\)/);
  assert.match(tabViewSource, /resolvedRequestCount/);
  assert.match(doc, /runtime managed action history access gate: present for parent\/account authority/);
  assert.match(doc, /runtime managed action history display redaction: present for sensitive rows through fixed labels, safe source-category labels, normalized reason codes, and redacted time-limit\/request counts/);
  assert.match(doc, /runtime managed extra-time grant request resolution marker: present as redacted `resolvedRequestCount`/);
  assert.match(doc, /runtime managed action history clear path: present for accepted rows only/);
  assert.match(doc, /runtime managed action history clear event writer: present as protected `history.clear` evidence/);
  assert.match(doc, /runtime remote managed validation\/apply history writer: present/);
  assert.match(doc, /runtime remote managed accepted apply history writer: present behind validated managed apply wrapper/);
  assert.match(doc, /runtime mailbox managed validation\/apply history writer: present/);
  assert.match(doc, /runtime mailbox ack-handoff history writer: present on protected target profiles/);
  assert.match(doc, /runtime local-network candidate validation\/apply history writer: present/);
  assert.match(doc, /runtime local-network ack-handoff history writer: present on protected target profiles/);
  assert.match(doc, /runtime remote managed failed-attempt rate-limit state: present under profile\.managedPolicyState\.remoteFailedAttemptRateLimits/);
  assert.match(doc, /runtime managed outbound live send history writer: present on trusted link policy rows/);
  assert.match(doc, /runtime managed inbound live ack history writer: present on trusted link policy rows/);
  assert.match(doc, /The current failed-auth writer records protected evidence rows on the target\s+protected profile/);
  assert.match(doc, /profile\.managedPolicyState\.adminFailedUnlockRateLimit/);
  assert.match(doc, /background PIN cache\s+remains memory-only while failed-attempt rate-limit state is profile-persisted/);
  assert.match(doc, /remoteFailedAttempts/);
  assert.match(doc, /rateLimited/);
});

test('managed remote failed-attempt rate-limit fixture resets by window and never grants authority', () => {
  const first = nextRemoteFailedAttemptState(null);
  assert.equal(first.failedAttempts, 1);
  assert.equal(first.rateLimited, false);
  assert.equal(first.resetAt, 1780521100000);

  const twentieth = Array.from({ length: 19 }).reduce(
    (state) => nextRemoteFailedAttemptState(state, { now: state.updatedAt + 1 }),
    first
  );
  assert.equal(twentieth.failedAttempts, 20);
  assert.equal(twentieth.rateLimited, true);
  assert.equal(twentieth.lastReason, 'missing_signature_verifier');

  const reset = nextRemoteFailedAttemptState(twentieth, { now: twentieth.resetAt + 1, reason: 'wrong_public_key' });
  assert.equal(reset.failedAttempts, 1);
  assert.equal(reset.rateLimited, false);
  assert.equal(reset.lastReason, 'wrong_public_key');

  const row = validRemoteRateLimitedRow();
  assert.equal(row.result, 'rejected');
  assert.equal(row.summary.rateLimited, true);
  assert.notEqual(row.result, 'accepted');
  assert.notEqual(row.actionType, 'remote_policy.accept');
});
