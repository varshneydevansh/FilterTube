import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function runtimeSource() {
  return [
    'js/background.js',
    'js/content/bridge_settings.js',
    'js/content_bridge.js',
    'js/io_manager.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/tab-view.js'
  ].map(read).join('\n');
}

function basePolicy(overrides = {}) {
  return {
    schema: 'filtertube_managed_time_limit',
    version: 1,
    enabled: true,
    timezone: 'Asia/Kolkata',
    dailyBudgetSeconds: 7200,
    surfaceBudgets: {
      main: 7200,
      kids: 7200
    },
    countingMode: 'active_youtube_tab',
    activeDeviceBudgetPolicy: 'single_active_tab_no_double_count',
    resetPolicy: 'policy_timezone_midnight',
    graceSeconds: 0,
    parentGrant: {
      enabled: false,
      extraSeconds: 0,
      expiresAt: null,
      reason: ''
    },
    policyRevision: 5,
    policyHash: 'hash-time-5',
    issuedAt: 1780480800000,
    validFrom: 1780480800000,
    validUntil: null,
    ...overrides
  };
}

function validateTimeLimitPolicy(policy) {
  if (!policy || typeof policy !== 'object') return { ok: false, reason: 'missing_policy' };
  for (const field of [
    'schema',
    'version',
    'enabled',
    'timezone',
    'dailyBudgetSeconds',
    'countingMode',
    'activeDeviceBudgetPolicy',
    'resetPolicy',
    'policyRevision',
    'policyHash',
    'issuedAt'
  ]) {
    if (policy[field] === undefined || policy[field] === null || policy[field] === '') {
      return { ok: false, reason: `missing_${field}` };
    }
  }
  if (policy.schema !== 'filtertube_managed_time_limit') return { ok: false, reason: 'wrong_schema' };
  if (policy.version !== 1) return { ok: false, reason: 'wrong_version' };
  if (typeof policy.enabled !== 'boolean') return { ok: false, reason: 'invalid_enabled' };
  if (!/^[A-Za-z_]+\/[A-Za-z0-9_+\-]+(?:\/[A-Za-z0-9_+\-]+)?$/.test(policy.timezone)) {
    return { ok: false, reason: 'invalid_timezone' };
  }
  if (!Number.isInteger(policy.dailyBudgetSeconds) || policy.dailyBudgetSeconds < 0) {
    return { ok: false, reason: 'invalid_dailyBudgetSeconds' };
  }
  if (policy.surfaceBudgets !== undefined) {
    for (const surface of ['main', 'kids']) {
      if (policy.surfaceBudgets[surface] !== undefined
        && (!Number.isInteger(policy.surfaceBudgets[surface]) || policy.surfaceBudgets[surface] < 0)) {
        return { ok: false, reason: `invalid_surfaceBudgets_${surface}` };
      }
    }
  }
  if (policy.countingMode !== 'active_youtube_tab') return { ok: false, reason: 'unsupported_countingMode' };
  if (policy.activeDeviceBudgetPolicy !== 'single_active_tab_no_double_count') {
    return { ok: false, reason: 'unsupported_activeDeviceBudgetPolicy' };
  }
  if (policy.resetPolicy !== 'policy_timezone_midnight') return { ok: false, reason: 'unsupported_resetPolicy' };
  if (policy.graceSeconds !== undefined && (!Number.isInteger(policy.graceSeconds) || policy.graceSeconds < 0)) {
    return { ok: false, reason: 'invalid_graceSeconds' };
  }
  if (!Number.isInteger(policy.policyRevision) || policy.policyRevision <= 0) {
    return { ok: false, reason: 'invalid_policyRevision' };
  }
  const grant = policy.parentGrant || { enabled: false };
  if (grant.enabled) {
    if (!Number.isInteger(grant.extraSeconds) || grant.extraSeconds < 0) return { ok: false, reason: 'invalid_parentGrant_extraSeconds' };
    if (!Number.isFinite(grant.expiresAt)) return { ok: false, reason: 'invalid_parentGrant_expiresAt' };
  }
  return { ok: true };
}

function revisionDecision(incoming, stored, { trusted = true } = {}) {
  if (!trusted) return { accepted: false, reason: 'untrusted_parent_authority' };
  if (!stored) return { accepted: true, decision: 'accept_first_policy' };
  if (incoming.policyRevision < stored.policyRevision) return { accepted: false, reason: 'stale_revision' };
  if (incoming.policyRevision === stored.policyRevision && incoming.policyHash !== stored.policyHash) {
    return { accepted: false, reason: 'equal_revision_hash_conflict' };
  }
  if (incoming.policyRevision === stored.policyRevision && incoming.policyHash === stored.policyHash) {
    return { accepted: true, decision: 'idempotent_same_hash' };
  }
  if (incoming.dailyBudgetSeconds < stored.dailyBudgetSeconds) {
    return { accepted: true, decision: 'accept_newer_reduced_budget_clamp_remaining' };
  }
  return { accepted: true, decision: 'accept_newer_policy' };
}

function remainingBudgetDecision({ policy, consumedSeconds, now }) {
  if (!policy.enabled) return { enforced: false, reason: 'disabled_policy_no_work' };
  const grant = policy.parentGrant || { enabled: false };
  const grantSeconds = grant.enabled && grant.expiresAt > now ? grant.extraSeconds : 0;
  const total = policy.dailyBudgetSeconds + (policy.graceSeconds || 0) + grantSeconds;
  const remainingSeconds = Math.max(0, total - consumedSeconds);
  return {
    enforced: true,
    remainingSeconds,
    timedOut: remainingSeconds === 0,
    grantSeconds
  };
}

function activeTabCountingDecision(tabs) {
  const activeYoutubeTabs = tabs.filter((tab) => tab.isYoutube && tab.active && tab.focused);
  return {
    countedTabs: activeYoutubeTabs.length > 0 ? 1 : 0,
    decision: activeYoutubeTabs.length > 0 ? 'count_single_active_tab' : 'no_active_youtube_tab'
  };
}

function resumeDecision({ hadPersistedActiveTab, staleState }) {
  if (staleState) return { grantAccess: false, decision: 'sleep_restart_revalidation_required' };
  if (!hadPersistedActiveTab) return { grantAccess: false, decision: 'no_active_evidence_revalidate_before_counting' };
  return { grantAccess: false, decision: 'revalidate_policy_and_counter_before_grant' };
}

function timezoneDriftDecision({ policyTimezone, deviceTimezone }) {
  if (policyTimezone === deviceTimezone) {
    return { resetTimezone: policyTimezone, decision: 'policy_timezone_matches_device' };
  }
  return {
    resetTimezone: policyTimezone,
    decision: 'timezone_drift_revalidation_required'
  };
}

test('managed child time-limit schema contract documents local UI store and runtime enforcement', () => {
  const doc = read(docPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);
  const source = runtimeSource();

  assert.match(doc, /Status\*\*: Local profile UI\/store and first extension runtime enforcement are\s+implemented/);
  assert.match(doc, /filtertube_managed_time_limit/);
  assert.match(doc, /Required Policy Shape/);
  assert.match(doc, /Counting Decisions/);
  assert.match(doc, /Reset And Resume Rules/);
  assert.match(doc, /Parent Grant Rules/);
  assert.match(doc, /Current Local UI And Store Boundary/);
  assert.match(doc, /local managed time-limit profile store: present/);
  assert.match(doc, /local managed time-limit parent UI: present/);
  assert.match(doc, /runtime managed time-limit policy compiler: present/);
  assert.match(doc, /runtime managed active-tab budget counter: present/);
  assert.match(doc, /runtime managed timeout overlay: present/);
  assert.match(doc, /Missing, disabled, malformed, non-child, or external-route policies remain\s+no-work states/);
  assert.match(plan, new RegExp(docPath));
  assert.match(inventory, new RegExp(docPath));

  assert.match(source, /filtertube_managed_time_limit/);
  assert.match(source, /timeLimitPolicy/);
  assert.match(source, /managedTimeLimitTotalBudgetSeconds/);
  assert.match(source, /showManagedTimeoutOverlay/);
});

test('local parent UI writes time-limit policy through profile settings and admin gates', () => {
  const tabView = read('js/tab-view.js');
  const ioManager = read('js/io_manager.js');

  assert.match(tabView, /function updateProfileTimeLimitPolicy\(profileId, action\)/);
  assert.match(tabView, /getProfileType\(fresh, currentActive\) === 'child'/);
  assert.match(tabView, /canActiveProfileManageProfile\(fresh, targetId\)/);
  assert.match(tabView, /ensureProfileUnlocked\(fresh, currentActive\)/);
  assert.match(tabView, /const nextPolicy = buildManagedTimeLimitPolicy/);
  assert.match(tabView, /if \(!nextPolicy\)/);
  assert.match(tabView, /timeLimitPolicy: nextPolicy/);
  assert.match(tabView, /Time limit:/);
  assert.match(tabView, /Child profiles cannot change time limits here/);

  assert.match(ioManager, /function normalizeManagedTimeLimitPolicy\(value\)/);
  assert.match(ioManager, /delete sanitizedSettings\.timeLimitPolicy/);
  assert.match(ioManager, /\.\.\.\(timeLimitPolicy \? \{ timeLimitPolicy \} : \{\}\)/);
});

test('managed child time-limit schema accepts valid two-hour zero-budget and disabled policies', () => {
  assert.deepEqual(validateTimeLimitPolicy(basePolicy()), { ok: true });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ dailyBudgetSeconds: 0 })), { ok: true });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({
    enabled: false,
    dailyBudgetSeconds: 0,
    surfaceBudgets: { main: 0, kids: 0 }
  })), { ok: true });

  assert.deepEqual(
    remainingBudgetDecision({ policy: basePolicy({ enabled: false }), consumedSeconds: 0, now: 1780480800000 }),
    { enforced: false, reason: 'disabled_policy_no_work' }
  );
  assert.deepEqual(
    remainingBudgetDecision({ policy: basePolicy({ dailyBudgetSeconds: 0 }), consumedSeconds: 0, now: 1780480800000 }),
    { enforced: true, remainingSeconds: 0, timedOut: true, grantSeconds: 0 }
  );
});

test('managed child time-limit schema rejects invalid negative budgets and unsupported reset fields', () => {
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ dailyBudgetSeconds: -1 })), { ok: false, reason: 'invalid_dailyBudgetSeconds' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ surfaceBudgets: { main: -10, kids: 3600 } })), { ok: false, reason: 'invalid_surfaceBudgets_main' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ surfaceBudgets: { main: 3600, kids: -10 } })), { ok: false, reason: 'invalid_surfaceBudgets_kids' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ graceSeconds: -1 })), { ok: false, reason: 'invalid_graceSeconds' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ timezone: 'Local' })), { ok: false, reason: 'invalid_timezone' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ countingMode: 'all_youtube_tabs' })), { ok: false, reason: 'unsupported_countingMode' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({ resetPolicy: 'device_timezone_midnight' })), { ok: false, reason: 'unsupported_resetPolicy' });
  assert.deepEqual(validateTimeLimitPolicy(basePolicy({
    parentGrant: { enabled: true, extraSeconds: -1, expiresAt: 1780481000000 }
  })), { ok: false, reason: 'invalid_parentGrant_extraSeconds' });
});

test('managed child time-limit revision decisions clamp newer trusted reductions and reject stale conflicts', () => {
  const stored = basePolicy({ dailyBudgetSeconds: 7200, policyRevision: 5, policyHash: 'hash-time-5' });
  const reduced = basePolicy({ dailyBudgetSeconds: 3600, policyRevision: 6, policyHash: 'hash-time-6' });

  assert.deepEqual(revisionDecision(reduced, stored), {
    accepted: true,
    decision: 'accept_newer_reduced_budget_clamp_remaining'
  });
  assert.deepEqual(revisionDecision(basePolicy({
    dailyBudgetSeconds: 3600,
    policyRevision: 4,
    policyHash: 'hash-time-4'
  }), stored), { accepted: false, reason: 'stale_revision' });
  assert.deepEqual(revisionDecision(basePolicy({
    dailyBudgetSeconds: 7200,
    policyRevision: 5,
    policyHash: 'hash-different'
  }), stored), { accepted: false, reason: 'equal_revision_hash_conflict' });
  assert.deepEqual(revisionDecision(reduced, stored, { trusted: false }), {
    accepted: false,
    reason: 'untrusted_parent_authority'
  });
});

test('managed child time-limit counting handles active tabs parent grants sleep restart and timezone drift', () => {
  const now = 1780480800000;

  assert.deepEqual(activeTabCountingDecision([
    { id: 1, isYoutube: true, active: true, focused: true },
    { id: 2, isYoutube: true, active: true, focused: false },
    { id: 3, isYoutube: false, active: true, focused: true }
  ]), { countedTabs: 1, decision: 'count_single_active_tab' });

  assert.deepEqual(remainingBudgetDecision({
    policy: basePolicy({
      dailyBudgetSeconds: 3600,
      parentGrant: { enabled: true, extraSeconds: 600, expiresAt: now + 1000, reason: 'parent_grant' }
    }),
    consumedSeconds: 3600,
    now
  }), { enforced: true, remainingSeconds: 600, timedOut: false, grantSeconds: 600 });

  assert.deepEqual(remainingBudgetDecision({
    policy: basePolicy({
      dailyBudgetSeconds: 3600,
      parentGrant: { enabled: true, extraSeconds: 600, expiresAt: now - 1000, reason: 'expired_grant' }
    }),
    consumedSeconds: 3600,
    now
  }), { enforced: true, remainingSeconds: 0, timedOut: true, grantSeconds: 0 });

  assert.deepEqual(resumeDecision({ hadPersistedActiveTab: true, staleState: true }), {
    grantAccess: false,
    decision: 'sleep_restart_revalidation_required'
  });
  assert.deepEqual(resumeDecision({ hadPersistedActiveTab: false, staleState: false }), {
    grantAccess: false,
    decision: 'no_active_evidence_revalidate_before_counting'
  });
  assert.deepEqual(timezoneDriftDecision({ policyTimezone: 'Asia/Kolkata', deviceTimezone: 'America/New_York' }), {
    resetTimezone: 'Asia/Kolkata',
    decision: 'timezone_drift_revalidation_required'
  });
});
