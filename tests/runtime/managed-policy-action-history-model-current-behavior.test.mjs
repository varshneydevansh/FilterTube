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
  'policy.sync_policy.update',
  'trust_link.create',
  'trust_link.revoke',
  'admin_session.unlock',
  'admin_session.failed_unlock',
  'local_policy.update',
  'remote_policy.accept',
  'remote_policy.reject',
  'remote_policy.conflict',
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
  ].includes(row.result) || ['trust_link.revoke', 'policy.time_limit.update', 'policy.viewing_space.update'].includes(row.actionType));

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

  assert.match(doc, /Status\*\*: Local protected history access proof present; remote managed-policy\s+validation history writer present/);
  assert.match(doc, /Issue 60 asks for feedback, logs, or history/);
  assert.match(doc, /Action history is protected evidence and parent\/caregiver UX/);
  assert.match(doc, /It is not policy\s+authority/);
  assert.match(doc, /Nanah receive path now also parses\s+`filtertube_managed_policy` envelopes/);
  assert.match(doc, /reason: managed_apply_pending/);
  assert.match(doc, /Required History Row Shape/);
  assert.match(doc, /Approved Action Types/);
  assert.match(doc, /Access Control/);
  assert.match(doc, /Retention, Redaction, And Local Storage/);
  assert.match(doc, /Required Recorded Outcomes/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));
  assert.match(source, /filtertube_managed_action_history/);
  assert.match(source, /recordManagedChildLocalEditHistory/);
  assert.match(source, /function getManagedActionHistoryRows\(profile\)/);
  assert.match(source, /function managedActionHistoryRowIsProtected\(row\)/);
  assert.match(source, /function canViewManagedActionHistory\(profilesV4, targetProfileId\)/);
  assert.match(source, /function showManagedActionHistory\(profileId\)/);
  assert.match(source, /function clearManagedActionHistory\(profileId\)/);
  assert.match(source, /function recordManagedNanahPolicyValidationHistory\(envelope, decision, context = \{\}\)/);
  assert.match(source, /function handleNanahIncomingManagedPolicyEnvelope\(envelope\)/);
  assert.match(source, /root\.type === 'filtertube_managed_policy'/);
  assert.match(source, /reason: 'managed_apply_pending'/);
  assert.match(source, /function getNanahManagedPolicyScopeList\(value\)/);
  assert.match(source, /historyBtn\.textContent = 'History'/);
  assert.doesNotMatch(source, /managedActionHistoryStore/);
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
});

test('managed action history required outcomes cover accepted rejected conflict auth and clear events', () => {
  const doc = read(docPath);
  const requiredFixtures = [
    'accepted_remote_keyword_policy',
    'accepted_local_child_surface_policy',
    'rejected_spoofed_lan_policy',
    'rejected_equal_revision_conflict',
    'rejected_after_trust_revocation',
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
  assert.match(doc, /runtime managed action history row writer: local managed child edit plus Nanah managed-policy validation outcomes/);
  assert.match(doc, /runtime managed action history access gate: present for parent\/account authority/);
  assert.match(doc, /runtime managed action history clear path: present for accepted rows only/);
  assert.match(doc, /runtime remote managed validation history writer: present/);
  assert.match(doc, /runtime remote managed accepted apply history writer: pending/);
});
