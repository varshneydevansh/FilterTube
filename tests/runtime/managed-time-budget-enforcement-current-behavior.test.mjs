import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const contractPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md';
const planPath = 'docs/audit/FILTERTUBE_MANAGED_CHILD_SYNC_TIME_LIMIT_PLAN_2026-06-02.md';
const inventoryPath = 'docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function block(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end ${endNeedle}`);
  return source.slice(start, end);
}

function basePolicy(overrides = {}) {
  return {
    schema: 'filtertube_managed_time_limit',
    version: 1,
    enabled: true,
    profileId: 'child-1',
    profileName: 'Child One',
    timezone: 'Asia/Kolkata',
    dailyBudgetSeconds: 10,
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
    policyRevision: 3,
    policyHash: 'hash-time-3',
    issuedAt: 1780480800000,
    validFrom: 1780480800000,
    validUntil: null,
    ...overrides
  };
}

function activePolicy(settings) {
  if (settings.activeProfileKind !== 'child') return null;
  const policy = settings.managedTimeLimitPolicy;
  if (!policy || policy.enabled !== true) return null;
  if (policy.schema !== 'filtertube_managed_time_limit') return null;
  if (policy.countingMode !== 'active_youtube_tab') return null;
  if (policy.activeDeviceBudgetPolicy !== 'single_active_tab_no_double_count') return null;
  if (policy.resetPolicy !== 'policy_timezone_midnight') return null;
  return policy;
}

function heartbeatStep(state, request) {
  const policy = activePolicy({ activeProfileKind: 'child', managedTimeLimitPolicy: request.policy });
  if (!policy) return { enforced: false, reason: 'disabled_policy_no_work' };
  if (request.surface === 'external') return { enforced: false, reason: 'external_route_no_work' };

  const key = `${policy.profileId}:${request.dateKey}`;
  const rows = { ...state.rows };
  const active = { ...state.active };
  const row = {
    consumedSeconds: rows[key]?.consumedSeconds || 0,
    policyRevision: policy.policyRevision,
    policyHash: policy.policyHash
  };
  const total = policy.dailyBudgetSeconds;
  const remainingBefore = Math.max(0, total - row.consumedSeconds);
  let countedSeconds = 0;
  let countDecision = 'inactive_heartbeat_no_count';

  if (request.visible && request.focused && remainingBefore > 0) {
    const prior = active[key];
    if (prior && prior.tabId !== request.tabId && request.now - prior.lastHeartbeatAt < 8000) {
      countDecision = 'another_active_tab_recently_counted';
      active[key] = { ...prior, lastHeartbeatAt: request.now };
    } else if (prior && prior.tabId === request.tabId) {
      countedSeconds = Math.min(10, Math.floor((request.now - prior.lastCountedAt) / 1000), remainingBefore);
      row.consumedSeconds += Math.max(0, countedSeconds);
      countDecision = countedSeconds > 0 ? 'count_single_active_tab' : 'active_heartbeat_no_elapsed_seconds';
      active[key] = { tabId: request.tabId, lastHeartbeatAt: request.now, lastCountedAt: request.now };
    } else {
      countDecision = 'first_active_heartbeat';
      active[key] = { tabId: request.tabId, lastHeartbeatAt: request.now, lastCountedAt: request.now };
    }
  } else if (active[key]?.tabId === request.tabId || remainingBefore <= 0) {
    delete active[key];
  }

  rows[key] = row;
  return {
    state: { rows, active },
    enforced: true,
    timedOut: Math.max(0, total - row.consumedSeconds) === 0,
    remainingSeconds: Math.max(0, total - row.consumedSeconds),
    consumedSeconds: row.consumedSeconds,
    countedSeconds,
    countDecision
  };
}

test('managed time-budget runtime is compiled background-owned and documented as present', () => {
  const background = read('js/background.js');
  const bridge = read('js/content/bridge_settings.js');
  const contract = read(contractPath);
  const plan = read(planPath);
  const inventory = read(inventoryPath);

  assert.match(background, /const MANAGED_TIME_USAGE_STORAGE_KEY = 'ftManagedTimeUsageV1'/);
  assert.match(background, /function handleManagedTimeLimitHeartbeat\(request, sender, sendResponse\)/);
  assert.match(background, /action === 'FilterTube_ManagedTimeLimitHeartbeat'/);
  assert.match(background, /normalizeManagedTimeLimitPolicy\(activeSettings\.timeLimitPolicy\)/);
  assert.match(background, /compiledSettings\.managedTimeLimitPolicy/);
  assert.match(background, /function isValidManagedTimeLimitTimezone\(timezone\)/);
  assert.match(background, /if \(!isValidManagedTimeLimitTimezone\(timezone\)/);
  assert.match(background, /MANAGED_TIME_MAX_HEARTBEAT_DELTA_SECONDS/);
  assert.match(background, /managedTimeActiveScopes/);

  assert.match(bridge, /const MANAGED_TIME_LIMIT_OVERLAY_ID = 'filtertube-managed-timeout-overlay'/);
  assert.match(bridge, /const MANAGED_TIME_LIMIT_STATUS_ID = 'filtertube-managed-time-status'/);
  assert.match(bridge, /function applyManagedTimeLimitRuntime\(settings, options = \{\}\)/);
  assert.match(bridge, /function isValidManagedTimeLimitTimezone\(timezone\)/);
  assert.match(bridge, /isValidManagedTimeLimitTimezone\(policy\.timezone\)/);
  assert.match(bridge, /function sendManagedTimeLimitHeartbeat\(\)/);
  assert.match(bridge, /function showManagedTimeLimitStatus\(state\)/);
  assert.match(bridge, /function showManagedTimeoutOverlay\(state\)/);
  assert.match(bridge, /FilterTube_ManagedTimeLimitHeartbeat/);
  assert.match(bridge, /applyManagedTimeLimitRuntime\(settings\)/);

  assert.match(contract, /runtime managed time-limit policy compiler: present/);
  assert.match(contract, /runtime managed active-tab budget counter: present/);
  assert.match(contract, /runtime managed heartbeat active-policy revalidation: present/);
  assert.match(contract, /runtime managed timeout overlay: present/);
  assert.match(contract, /Missing, disabled, malformed, non-child, or external-route policies remain\s+no-work states/);
  assert.match(plan, /ftManagedTimeUsageV1/);
  assert.match(plan, /re-resolves the compiled active child profile policy before counting/);
  assert.match(plan, /status\*\*: Completed for source-backed extension runtime\. Installed YouTube\s+active-tab smoke remains a T16 release-proof row/);
  assert.match(plan, /competing active tabs do not double-count/);
  assert.match(plan, /exhausted budget\s+decisions return `timedOut` for the content bridge lock overlay/);
  assert.match(inventory, /Extension runtime now compiles a valid active child profile/);
  assert.match(inventory, /Background re-resolves the active child compiled policy for each accepted\s+heartbeat/);
});

test('managed child sync roadmap no longer reports completed schema and time-limit foundations as spec-only', () => {
  const plan = read(planPath);
  const t1 = block(plan, '#### T1: Current authority inventory', '#### T2: Time-limit platform feasibility audit');
  const t2 = block(plan, '#### T2: Time-limit platform feasibility audit', '#### T3: Downstream app sync contract audit');
  const t3 = block(plan, '#### T3: Downstream app sync contract audit', '### Sprint 1: Schema and revision foundation');
  const t4 = block(plan, '#### T4: Add managed policy schema helpers', '#### T5: Add policy revision store');
  const t5 = block(plan, '#### T5: Add policy revision store', '#### T6: Add time-limit schema tests');
  const t6 = block(plan, '#### T6: Add time-limit schema tests', '### Sprint 2: Local parent control hardening');

  assert.match(plan, /Status\*\*: Extension implementation in progress/);
  assert.doesNotMatch(plan, /Planning\/spec only\. Runtime behavior is unchanged/);
  assert.match(t1, /status\*\*: Completed for extension authority inventory/);
  assert.match(t2, /status\*\*: Completed for extension browser\/API feasibility/);
  assert.match(t3, /status\*\*: Completed for extension-owned contract inventory/);
  assert.match(t4, /status\*\*: Completed for extension managed policy schema helpers/);
  assert.match(t5, /status\*\*: Completed for extension accepted-revision storage/);
  assert.match(t5, /profile\.managedPolicyState\.remoteManagedPolicies\[linkId\]\[scope\]/);
  assert.match(t6, /status\*\*: Completed for extension time-limit schema/);
  assert.match(t6, /active_youtube_tab/);
  assert.match(t6, /single_active_tab_no_double_count/);
});

test('managed time-budget background heartbeats use compiled active child policy authority', () => {
  const background = read('js/background.js');
  const heartbeatBlock = block(background, 'async function handleManagedTimeLimitHeartbeat(request, sender, sendResponse)', 'function isKidsUrl(url)');

  assert.match(heartbeatBlock, /const requestPolicy = normalizeManagedTimeLimitPolicy\(request\?\.policy\)/);
  assert.match(heartbeatBlock, /const compiledSettings = await getCompiledSettings\(sender, route\.surface, false\)/);
  assert.match(heartbeatBlock, /const compiledPolicy = normalizeManagedTimeLimitPolicy\(compiledSettings\?\.managedTimeLimitPolicy\)/);
  assert.match(heartbeatBlock, /compiledSettings\?\.activeProfileKind !== 'child'/);
  assert.match(heartbeatBlock, /active_child_policy_absent_no_work/);
  assert.match(heartbeatBlock, /const profileId = normalizeString\(compiledSettings\.activeProfileId\)/);
  assert.match(heartbeatBlock, /const policy = compiledPolicy/);
  assert.match(heartbeatBlock, /policySource: 'compiled_active_profile'/);
  assert.match(heartbeatBlock, /requestPolicyMatched/);
  assert.doesNotMatch(heartbeatBlock, /const profileId = normalizeString\(request\?\.profileId\)/);
});

test('managed time-budget overlay is a lock surface and not a content-hide writer', () => {
  const bridge = read('js/content/bridge_settings.js');
  const overlayBlock = block(bridge, 'function showManagedTimeoutOverlay(state)', 'function isManagedTimeLimitTabActive()');

  assert.match(overlayBlock, /role', 'alertdialog'/);
  assert.match(overlayBlock, /pointer-events:auto/);
  assert.match(overlayBlock, /pauseManagedTimeoutVideos\(\)/);
  assert.match(overlayBlock, /today's parent-managed YouTube time/);
  assert.match(overlayBlock, /Request more time/);
  assert.match(overlayBlock, /does not unlock YouTube by itself/);
  assert.match(overlayBlock, /YouTube stays paused until/);
  assert.doesNotMatch(overlayBlock, /recordTimeSaved|hidden-content|filtertube-hidden|data-filtertube-processed/);
});

test('managed time-budget status is passive and appears only for active governed time', () => {
  const bridge = read('js/content/bridge_settings.js');
  const statusBlock = block(bridge, 'function showManagedTimeLimitStatus(state)', 'function showManagedTimeoutOverlay(state)');
  const heartbeatBlock = block(bridge, 'function sendManagedTimeLimitHeartbeat()', 'function applyManagedTimeLimitRuntime(settings, options = {})');

  assert.match(statusBlock, /role', 'status'/);
  assert.match(statusBlock, /aria-live', 'polite'/);
  assert.match(statusBlock, /pointer-events:none/);
  assert.match(statusBlock, /time left/);
  assert.match(statusBlock, /remainingSeconds <= 0/);
  assert.match(statusBlock, /removeManagedTimeLimitStatus\(\)/);
  assert.match(heartbeatBlock, /response\?\.enforced === true && response\?\.timedOut !== true/);
  assert.match(heartbeatBlock, /showManagedTimeLimitStatus\(response\)/);
  assert.doesNotMatch(statusBlock, /recordTimeSaved|hidden-content|filtertube-hidden|data-filtertube-processed/);
});

test('managed time-budget no-policy states do not arm runtime work', () => {
  assert.equal(activePolicy({ activeProfileKind: 'account', managedTimeLimitPolicy: basePolicy() }), null);
  assert.equal(activePolicy({ activeProfileKind: 'child', managedTimeLimitPolicy: basePolicy({ enabled: false }) }), null);
  assert.equal(activePolicy({ activeProfileKind: 'child', managedTimeLimitPolicy: null }), null);
  assert.deepEqual(
    heartbeatStep({ rows: {}, active: {} }, { policy: basePolicy({ enabled: false }), surface: 'main', dateKey: '2026-06-04' }),
    { enforced: false, reason: 'disabled_policy_no_work' }
  );
  assert.deepEqual(
    heartbeatStep({ rows: {}, active: {} }, { policy: basePolicy(), surface: 'external', dateKey: '2026-06-04' }),
    { enforced: false, reason: 'external_route_no_work' }
  );
});

test('managed time-budget heartbeats count one active focused tab and cap sleep drift', () => {
  const policy = basePolicy({ dailyBudgetSeconds: 10 });
  let state = { rows: {}, active: {} };

  const first = heartbeatStep(state, {
    policy,
    surface: 'main',
    dateKey: '2026-06-04',
    tabId: 1,
    visible: true,
    focused: true,
    now: 100000
  });
  assert.equal(first.countDecision, 'first_active_heartbeat');
  assert.equal(first.remainingSeconds, 10);
  state = first.state;

  const second = heartbeatStep(state, {
    policy,
    surface: 'main',
    dateKey: '2026-06-04',
    tabId: 1,
    visible: true,
    focused: true,
    now: 105500
  });
  assert.equal(second.countDecision, 'count_single_active_tab');
  assert.equal(second.countedSeconds, 5);
  assert.equal(second.remainingSeconds, 5);
  state = second.state;

  const competing = heartbeatStep(state, {
    policy,
    surface: 'main',
    dateKey: '2026-06-04',
    tabId: 2,
    visible: true,
    focused: true,
    now: 106000
  });
  assert.equal(competing.countDecision, 'another_active_tab_recently_counted');
  assert.equal(competing.remainingSeconds, 5);
  state = competing.state;

  const sleepCapped = heartbeatStep(state, {
    policy,
    surface: 'main',
    dateKey: '2026-06-04',
    tabId: 1,
    visible: true,
    focused: true,
    now: 140000
  });
  assert.equal(sleepCapped.countedSeconds, 5);
  assert.equal(sleepCapped.timedOut, true);
  assert.equal(sleepCapped.remainingSeconds, 0);
});
