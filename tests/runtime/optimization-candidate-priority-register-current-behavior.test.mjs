import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/optimization-candidate-priority-register-current-behavior.test.mjs';

const sourceDocs = {
  noWork: 'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  listMode: 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  metric: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  dirty: 'docs/audit/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  releaseStatus: 'docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md',
  releaseLag: 'docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md',
  whitelistCacheAffected: 'docs/audit/FILTERTUBE_WHITELIST_CACHE_SPA_AFFECTED_CALLABLE_PROOF_BOUNDARY_CURRENT_BEHAVIOR_2026-05-30.md',
  activeGoal: 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
};

const expectedCandidateIds = [
  'FT-OPT-00-metric-artifact-gate',
  'FT-OPT-01-seed-fetch-pass-through',
  'FT-OPT-02-seed-xhr-pass-through',
  'FT-OPT-03-active-work-decision',
  'FT-OPT-04-harvest-mutation-split',
  'FT-OPT-05-list-mode-empty-policy',
  'FT-OPT-06-dom-lifecycle-budget',
  'FT-OPT-07-fallback-menu-lifecycle-budget',
  'FT-OPT-08-quick-block-lifecycle-budget',
  'FT-OPT-09-category-metadata-fetch-gate',
  'FT-OPT-10-diagnostic-logging-policy',
  'FT-OPT-11-native-release-parity-rollout'
];

const futureAuthorityTokens = [
  'filterTubeOptimizationPriorityAuthority',
  'optimizationCandidateDecisionReport',
  'jsonFirstOptimizationWorkOrder',
  'jsonFirstMetricArtifactReport',
  'jsonFirstSeedPassThroughBudget',
  'jsonFirstXhrPassThroughBudget',
  'jsonFirstWorkDecision',
  'jsonFirstHarvestDecision',
  'jsonFirstListModeDecisionReport',
  'jsonFirstDomLifecycleBudget',
  'jsonFirstFallbackMenuLifecyclePredicate',
  'jsonFirstQuickBlockLifecycleBudget',
  'jsonFirstCategoryMetadataBudget',
  'diagnosticLogPolicyReport',
  'jsonFirstNativeParityReport'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function assertReleaseStabilizationRebaseline(doc) {
  const noWork = read(sourceDocs.noWork);
  const activeWork = read(sourceDocs.activeWork);
  const completionGap = read('docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md');
  const releaseNote = read('docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md');
  const releaseStatus = read(sourceDocs.releaseStatus);
  const seed = read('js/seed.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const background = read('js/background.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');

  assert.match(doc, /Release Stabilization Rebaseline Addendum - 2026-05-27/);
  assert.match(doc, /release stabilization reduced known hot-path cost/);
  assert.match(doc, /candidate ids and priorities remain stable/);
  assert.match(doc, /next optimization still needs metric \+ work-decision authority/);
  assert.match(doc, /release-stabilized optimization candidate rows: 9/);
  assert.match(doc, /candidate ids changed by release stabilization: 0/);
  assert.match(doc, /candidate priority order changed by release stabilization: no/);
  assert.match(doc, /implementation-ready candidates after release stabilization: 0/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /first-class JSON optimization approval after release stabilization: NO-GO/);
  assert.match(doc, /full runtime audit is green again, but that is assertion proof/);
  assert.match(doc, /Fetch now checks `shouldBypassYouTubeiNetworkResponse\(\)` before `response\.clone\(\)\.json\(\)`/);
  assert.match(doc, /Visible blocklist refresh and canonical Main keywords now behave correctly/);
  assert.match(doc, /The broad periodic full-document quick-block sweep is gone/);
  assert.match(doc, /optimization counterpart to the dated release hot-path\s+proof stack/);

  for (const candidate of [
    'FT-OPT-00-metric-artifact-gate',
    'FT-OPT-01-seed-fetch-pass-through',
    'FT-OPT-02-seed-xhr-pass-through',
    'FT-OPT-03-active-work-decision',
    'FT-OPT-04-harvest-mutation-split',
    'FT-OPT-05-list-mode-empty-policy',
    'FT-OPT-06-dom-lifecycle-budget',
    'FT-OPT-08-quick-block-lifecycle-budget',
    'FT-OPT-10-diagnostic-logging-policy'
  ]) {
    assert.ok(doc.includes(`| \`${candidate}\` |`), `missing release rebaseline row for ${candidate}`);
  }

  assert.match(noWork, /Runtime behavior changed for seed no-work transport bypass/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);
  assert.match(completionGap, /release hot-path proof slices: 6/);
  assert.match(completionGap, /Kully B & Gussy G - Topic/);
  assert.match(releaseNote, /final post-build full runtime audit: 4553\/4553 pass, 0 fail/);
  assert.match(releaseNote, /post-release audit continuation after Topic quick-block clean-state fixture:\s+4565\/4565 pass, 0 fail/);
  assert.match(releaseStatus, /Post-Release Audit Continuation - 2026-05-27/);
  assert.match(releaseStatus, /tests: 4565\s+pass: 4565\s+fail: 0/);

  const fetchSetup = seed.slice(seed.indexOf('function setupFetchInterception()'), seed.indexOf('function setupXhrInterception()'));
  assert.ok(fetchSetup.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < fetchSetup.indexOf('response.clone().json()'));
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
  assert.match(background, /Array\.isArray\(main\.keywords\) \? main\.keywords : safeArray\(main\.blockedKeywords\)/);
  assert.match(contentBridge, /allowSeparatorSplit = false/);
  assert.match(blockChannel, /let quickBlockSweepTimer = 0/);
  assert.doesNotMatch(blockChannel, /setInterval/);
}

function assertMay30FreshnessAndLiveProfileBlocker(doc) {
  const releaseLag = read(sourceDocs.releaseLag);
  const affected = read(sourceDocs.whitelistCacheAffected);
  const activeGoal = read(sourceDocs.activeGoal);

  assert.match(doc, /Current Freshness And Live-Profile Blocker Addendum - 2026-05-30/);
  assert.match(doc, /latest historical 4663 full runtime proof: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(doc, /current generated runtime-test declaration count: 4667/);
  assert.match(doc, /current full runtime proof for generated 4667 declaration set after audit-drift repair: GO/);
  assert.match(doc, /affected callable packet rows: 12/);
  assert.match(doc, /affected source files covered: 8/);
  assert.match(doc, /transport no-work source evidence rows: 8/);
  assert.match(doc, /live evidence execution blocker rows: 8/);
  assert.match(doc, /connected Chrome profile inventory acceptance: NO-GO/);
  assert.match(doc, /scratch\/private Chrome profile acceptance: NO-GO/);
  assert.match(doc, /source-only affected-callable packet as live execution proof: NO-GO/);
  assert.match(doc, /implementation-ready candidates after May 30 freshness: 0/);
  assert.match(doc, /whitelist\/cache optimization approval after May 30 freshness: NO-GO/);
  assert.match(doc, /JSON-first first-class promotion after May 30 freshness: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /normal installed Chrome profile and visible YouTube tab/);
  assert.match(doc, /installed-byte parity and route\/mode behavior\s+samples recorded beside the counters/);
  assert.match(doc, /current source\/runtime proof\s+-> latest recorded 4663\/4663 runtime suite proof\s+-> current 4667 generated declaration drift\s+-> affected whitelist\/cache callable packet\s+-> live installed-profile evidence blocker/s);
  assert.match(doc, /flowchart TD\s+A\["Latest recorded 4663 runtime proof"\] --> B\["Current 4667 generated declaration drift"\]/);
  assert.match(doc, /Treating the green runtime suite as a performance metric artifact/);
  assert.match(doc, /Treating source-only affected-callable anchors as live SPA evidence/);
  assert.match(doc, /Treating a scratch\/private Chrome profile or connected-tab inventory as\s+proof/);

  assert.match(releaseLag, /full runtime proof result: 4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(releaseLag, /whitelist\/cache optimization approval from this rerun: NO-GO/);
  assert.match(affected, /selected affected-callable packet: FT-WLCACHE-SPA-AFFECTED-00-boundary/);
  assert.match(affected, /affected callable proof rows: 12/);
  assert.match(affected, /transport no-work source evidence rows: 8/);
  assert.match(affected, /live evidence execution blocker rows: 8/);
  assert.match(affected, /accept connected Chrome profile inventory as live evidence now: NO-GO/);
  assert.match(affected, /accept scratch\/private Chrome profile as installed-profile proof now: NO-GO/);
  assert.match(affected, /approve whitelist\/cache optimization from this contract now: NO-GO/);
  assert.match(affected, /approve JSON-first first-class filtering from this contract now: NO-GO/);
  assert.match(activeGoal, /4663\/4663 pass, 0 fail, 83\.213s/);
  assert.match(activeGoal, /8 live evidence\s+execution blocker rows, 15 live evidence execution blocker fields/);
  assert.match(activeGoal, /connected Chrome profile inventory acceptance `NO-GO`/);
}

function productSource() {
  return [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/background.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');
}

test('optimization candidate priority register is audit-only and keeps runtime unchanged', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior priority register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Optimization candidates are source-backed and ranked here/);
  assert.match(doc, /None is approved for runtime changes until its required authority exists/);
  assert.match(doc, /no quick-block periodic timer after the SPA drag optimization/);
  assertReleaseStabilizationRebaseline(doc);
  assertMay30FreshnessAndLiveProfileBlocker(doc);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('optimization priority candidate ids and priority distribution stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-OPT-[^`]+)` \| (P[0-2]) \|/gm)];

  assert.deepEqual(rows.map((row) => row[1]), expectedCandidateIds);
  assert.equal(rows.length, 12);

  const priorityCounts = rows.reduce((acc, row) => {
    acc[row[2]] = (acc[row[2]] || 0) + 1;
    return acc;
  }, {});

  assert.deepEqual(priorityCounts, { P0: 6, P1: 5, P2: 1 });
  assert.match(doc, /optimization priority candidates: 12/);
  assert.match(doc, /P0 prerequisite candidates: 6/);
  assert.match(doc, /P1 follow-on candidates: 5/);
  assert.match(doc, /P2 rollout candidates: 1/);
  assert.match(doc, /implementation-ready candidates: 0/);
  assert.match(doc, /source-backed candidates: 12/);
});

test('optimization rows are backed by existing JSON-first and no-work audit evidence', () => {
  const doc = read(docPath);
  const noWork = read(sourceDocs.noWork);
  const activeWork = read(sourceDocs.activeWork);
  const listMode = read(sourceDocs.listMode);
  const dirty = read(sourceDocs.dirty);

  for (const phrase of [
    'Seed fetch pass-through',
    'Seed XHR pass-through',
    'Engine harvest split',
    'DOM lifecycle gate',
    'Quick-block lifecycle gate',
    'Category metadata fetch gate',
    'Metric artifact gate'
  ]) {
    assert.ok(noWork.includes(phrase), `missing no-work source phrase ${phrase}`);
  }

  assert.match(activeWork, /current predicate anchors: 11/);
  assert.match(activeWork, /interceptor endpoint entries per set: 5/);
  assert.match(activeWork, /DOM fallback active trigger total: 36/);
  assert.match(activeWork, /quick-block setup delay ms: 1000/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);

  assert.match(listMode, /empty blocklist mode preserves a normal/);
  assert.match(listMode, /empty whitelist mode removes the same renderer/);
  assert.match(listMode, /unknown `listMode` falls back to blocklist/);

  assert.match(dirty, /does not implement a whitelist optimization/);
  assert.match(dirty, /not permission to change whitelist or JSON-first runtime\s+behavior/);

  for (const candidate of [
    'FT-OPT-01-seed-fetch-pass-through',
    'FT-OPT-02-seed-xhr-pass-through',
    'FT-OPT-03-active-work-decision',
    'FT-OPT-05-list-mode-empty-policy'
  ]) {
    assert.ok(doc.includes(candidate), `missing candidate ${candidate}`);
  }
});

test('optimization rows are backed by current source anchors and diagnostic counts', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');
  const metric = read(sourceDocs.metric);
  const diagnostic = read(sourceDocs.diagnostic);

  assert.match(seed, /setupFetchInterception\(\)/);
  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /setupXhrInterception\(\)/);
  assert.match(seed, /proto\.addEventListener = function \(type, listener, options\)/);
  assert.match(filterLogic, /processData\(data, dataName = 'unknown'\)/);
  assert.match(filterLogic, /processData: function \(data, settings, dataName = 'data'\)/);
  assert.match(filterLogic, /this\._harvestChannelData\(data\)/);
  assert.match(filterLogic, /if \(this\.settings\.enabled === false\)/);
  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(contentBridge, /async function initializeDOMFallback\(settings\)/);
  assert.match(contentBridge, /function ensureFallbackMenuButtons\(\)/);
  assert.match(blockChannel, /const isQuickBlockEnabled = \(\) =>/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\)/);

  assert.match(metric, /performance\.now callsites: 0/);
  assert.match(metric, /Date\.now callsites: 82/);
  assert.match(diagnostic, /active console callsites: 418/);
  assert.match(diagnostic, /\| `js\/content_bridge\.js` \| 114 \| 46 \| 14 \| 8 \| 0 \| 182 \|/);
  assert.match(diagnostic, /\| `js\/background\.js` \| 49 \| 28 \| 12 \| 13 \| 0 \| 102 \|/);
});

test('optimization priority authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('optimization priority register is linked from audit ledgers and runtime results', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex
  ]) {
    assert.match(artifact, /Optimization candidate priority register addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
