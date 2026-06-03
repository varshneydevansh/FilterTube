import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const runtimeTestPath = 'tests/runtime/optimization-stop-go-decision-record-current-behavior.test.mjs';

const sourceDocs = {
  dirty: 'docs/audit/FILTERTUBE_CURRENT_DIRTY_WORKTREE_AUDIT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  completionGap: 'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  releaseLagFix: 'docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md',
  releaseStatus: 'docs/audit/FILTERTUBE_RELEASE_FIX_AUDIT_STATUS_2026-05-26.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  jsonFirstReadiness: 'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
  settingsMode: 'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
  modeSurfaceEffect: 'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedDecisionIds = [
  'FT-STOPGO-00-stop-now-whitelist-optimization',
  'FT-STOPGO-01-stop-now-json-path-promotion',
  'FT-STOPGO-02-start-metricless-performance-optimization',
  'FT-STOPGO-03-start-transport-pass-through',
  'FT-STOPGO-04-start-lifecycle-pruning',
  'FT-STOPGO-05-start-diagnostic-log-removal',
  'FT-STOPGO-06-continue-preimplementation-audit',
  'FT-STOPGO-07-first-future-patch-shape'
];

const firstPatchEvidence = [
  'candidateId',
  'obligationId',
  'sourceLocus',
  'route',
  'surface',
  'endpoint',
  'profileType',
  'listMode',
  'ruleState',
  'positiveFixture',
  'negativeSiblingFixture',
  'metricArtifact'
];

const sideEffectEvidence = [
  'workAllowed',
  'workForbidden',
  'parseBudget',
  'stringifyBudget',
  'processDataBudget',
  'harvestBudget',
  'listenerObserverTimerBudget',
  'networkStorageBudget',
  'hideRestoreBudget',
  'diagnosticBudget',
  'domParityFixture',
  'nativeParityFixture'
];

const futureAuthorityTokens = [
  'optimizationStopGoDecisionRecord',
  'optimizationStopNowWhitelistNoGo',
  'jsonFirstStopGoDecisionReport',
  'whitelistOptimizationReadinessReport',
  'firstOptimizationPatchEntryGate',
  'firstOptimizationPatchEvidencePacket',
  'jsonFirstStopGoMetricArtifact',
  'optimizationGoNoGoAuthority'
];

const highLevelGateDocs = [
  'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
  'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  docPath,
  'docs/audit/FILTERTUBE_P0_FAMILY_PROOF_COVERAGE_2026-05-19.md',
  'docs/audit/FILTERTUBE_P0_OBLIGATION_INDEX_2026-05-20.md',
  'docs/audit/FILTERTUBE_P0_OBLIGATION_STATUS_LEDGER_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function assertReleaseStabilizationStopGoRevalidation(doc) {
  const priority = read(sourceDocs.priority);
  const completionGap = read(sourceDocs.completionGap);
  const releaseLagFix = read(sourceDocs.releaseLagFix);
  const releaseStatus = read(sourceDocs.releaseStatus);
  const activeWork = read(sourceDocs.activeWork);
  const seed = read('js/seed.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const background = read('js/background.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');

  assert.match(doc, /Release Stabilization Stop\/Go Revalidation Addendum - 2026-05-27/);
  assert.match(doc, /ASCII decision flow:/);
  assert.match(doc, /Mermaid decision flow:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /release stabilization proof pinned[\s\S]*stop-now broad whitelist optimization: NO-GO/);
  assert.match(doc, /release stabilization stop\/go revalidation rows: 7/);
  assert.match(doc, /release-stabilized stop-now whitelist optimization decision: NO-GO/);
  assert.match(doc, /release-stabilized stop-now JSON-first promotion decision: NO-GO/);
  assert.match(doc, /release-stabilized continue audit decision: GO/);
  assert.match(doc, /release-stabilized first future optimization patch decision: GATED/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /broad audit completion from this addendum: NO-GO/);
  assert.match(doc, /Kully B & Gussy G - Topic/);

  for (const id of [
    'FT-STOPGO-00-stop-now-whitelist-optimization',
    'FT-STOPGO-01-stop-now-json-path-promotion',
    'FT-STOPGO-02-start-metricless-performance-optimization',
    'FT-STOPGO-03-start-transport-pass-through',
    'FT-STOPGO-04-start-lifecycle-pruning',
    'FT-STOPGO-06-continue-preimplementation-audit',
    'FT-STOPGO-07-first-future-patch-shape'
  ]) {
    assert.match(doc, new RegExp(`\\| \`${id}\` \\| (NO-GO|GO|GATED) \\|`), `missing release revalidation row ${id}`);
  }

  assert.match(priority, /Release Stabilization Rebaseline Addendum - 2026-05-27/);
  assert.match(priority, /candidate ids changed by release stabilization: 0/);
  assert.match(priority, /candidate priority order changed by release stabilization: no/);
  assert.match(priority, /first-class JSON optimization approval after release stabilization: NO-GO/);
  assert.match(completionGap, /Release Hot-Path Proof Stack Addendum - 2026-05-27/);
  assert.match(completionGap, /release hot-path proof slices: 6/);
  assert.match(completionGap, /release hot-path documented rows: 65/);
  assert.match(releaseLagFix, /final post-build full runtime audit: 4553\/4553 pass, 0 fail/);
  assert.match(releaseLagFix, /post-release audit continuation after Topic quick-block clean-state fixture:\s+4565\/4565 pass, 0 fail/);
  assert.match(releaseStatus, /Post-Release Audit Continuation - 2026-05-27/);
  assert.match(releaseStatus, /tests: 4565\s+pass: 4565\s+fail: 0/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);

  const fetchHook = seed.slice(
    seed.indexOf('const dataName = `fetch:${getPathname(urlStr)}`;'),
    seed.indexOf('function setupXhrInterception()')
  );
  assert.ok(fetchHook.includes('if (shouldBypassYouTubeiNetworkResponse(dataName))'));
  assert.ok(fetchHook.indexOf('if (shouldBypassYouTubeiNetworkResponse(dataName))') < fetchHook.indexOf('response.clone().json()'));
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
  assert.match(background, /Array\.isArray\(main\.keywords\) \? main\.keywords : safeArray\(main\.blockedKeywords\)/);
  assert.match(contentBridge, /allowSeparatorSplit = false/);
  assert.match(blockChannel, /let quickBlockSweepTimer = 0/);
  assert.doesNotMatch(blockChannel, /quickBlockSweepTimer\s*=\s*setInterval/);
}

function assertSettingsModeStopGoContinuation(doc) {
  const modeSurface = read(sourceDocs.modeSurfaceEffect);

  assert.match(doc, /Settings Mode Cross-Feature Stop\/Go Continuation - 2026-05-28/);
  assert.match(doc, /performance optimization cannot treat empty blocklist, empty whitelist,\s+disabled settings, content-control flags, quick\/menu actions, or native overlay\s+quieting as one interchangeable inactive state/);
  assert.match(doc, /ASCII decision flow:/);
  assert.match(doc, /Mermaid decision flow:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /settings-mode stop\/go continuation rows: 6/);
  assert.match(doc, /empty-blocklist broad no-work shortcut decision: NO-GO/);
  assert.match(doc, /empty-whitelist shortcut reuse decision: NO-GO/);
  assert.match(doc, /disabled cleanup deletion decision: NO-GO/);
  assert.match(doc, /content-control no-rule shortcut decision: NO-GO/);
  assert.match(doc, /quick\/menu lifecycle pruning decision: NO-GO/);
  assert.match(doc, /native-overlay global pause decision: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /broad audit completion from this addendum: NO-GO/);

  for (const state of [
    'Empty blocklist',
    'Empty whitelist',
    'Disabled settings',
    'Content-control flags',
    'Quick block and normal menu',
    'Native overlay/fullscreen/app shell'
  ]) {
    assert.match(doc, new RegExp(`\\| ${state} \\| NO-GO`), `missing stop/go state ${state}`);
    assert.ok(modeSurface.includes(`| ${state} |`), `mode/surface matrix missing ${state}`);
  }
}

test('optimization stop go decision record is audit-only and answers the current implementation question', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior stop\/go decision record/);
  assert.match(doc, /Runtime behavior is\s+unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /should FilterTube stop the broad inspection now and optimize recent\s+whitelist behavior/);
  assert.match(doc, /Stop-now whitelist optimization decision: NO-GO/);
  assert.match(doc, /Stop-now JSON-first optimization decision: NO-GO/);
  assert.match(doc, /Continue proof-backed pre-implementation audit: GO/);
  assert.match(doc, /not completion proof for the broad audit/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }

  assertReleaseStabilizationStopGoRevalidation(doc);
  assertSettingsModeStopGoContinuation(doc);
});

test('high-level readiness and stop-go docs carry the method proof gap blocker', () => {
  const gapText = read(methodGapPath);
  const indexTokens = [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5701',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5701',
    'runtime behavior changed: no'
  ];
  const registerTokens = [
    'method semantic proof gap files covered: 69',
    'method semantic proof gap lexical callables covered: 5701',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5701',
    'affected callable semantic proof: NO-GO',
    'runtime behavior changed: no'
  ];

  for (const token of indexTokens) {
    assert.ok(gapText.includes(token), `method proof gap index missing ${token}`);
  }

  for (const file of highLevelGateDocs) {
    const text = read(file);
    assert.ok(text.includes('## Method Semantic Proof Gap Boundary'), `${file} should name the method proof gap boundary`);
    assert.ok(text.includes(methodGapPath), `${file} should cite the method proof gap index`);
    for (const token of registerTokens) {
      assert.ok(text.includes(token), `${file} missing method proof gap token ${token}`);
    }
    assert.match(text, /They do not approve runtime\s+optimization, JSON-first behavior, method deletion, method merging, lifecycle\s+cleanup, no-work changes, or whitelist behavior changes\./);
  }
});

test('optimization stop go decision rows and counts stay pinned', () => {
  const doc = read(docPath);
  const matrix = doc.slice(
    doc.indexOf('## Stop/Go Decision Matrix'),
    doc.indexOf('## Required First-Patch Evidence Classes')
  );
  const rows = [...matrix.matchAll(/^\| `(FT-STOPGO-[^`]+)` \| (NO-GO|GO|GATED) \|/gm)];

  assert.deepEqual(rows.map((row) => row[1]), expectedDecisionIds);
  assert.deepEqual(
    rows.map((row) => row[2]),
    ['NO-GO', 'NO-GO', 'NO-GO', 'NO-GO', 'NO-GO', 'NO-GO', 'GO', 'GATED']
  );
  assert.equal(rows.length, 8);
  assert.match(doc, /stop\/go decision rows: 8/);
  assert.match(doc, /NO-GO runtime optimization rows: 6/);
  assert.match(doc, /GO audit-continuation rows: 1/);
  assert.match(doc, /GATED first-patch rows: 1/);
  assert.match(doc, /implementation-ready whitelist optimization rows: 0/);
  assert.match(doc, /implementation-ready JSON-first optimization rows: 0/);
  assert.match(doc, /required first-patch evidence classes: 12/);
});

test('optimization stop go decision is backed by current dirty priority P0 and metric evidence', () => {
  const dirty = read(sourceDocs.dirty);
  const priority = read(sourceDocs.priority);
  const p0Gate = read(sourceDocs.p0Gate);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const diagnostic = read(sourceDocs.diagnostic);

  assert.match(dirty, /does not implement a whitelist optimization/);
  assert.match(dirty, /not permission to change whitelist or JSON-first runtime\s+behavior/);
  assert.match(dirty, /audit files created for this work remain\s+under `docs\/audit` and runtime verifiers remain under `tests\/runtime`/);

  assert.match(priority, /optimization priority candidates: 12/);
  assert.match(priority, /P0 prerequisite candidates: 6/);
  assert.match(priority, /implementation-ready candidates: 0/);
  assert.match(priority, /FT-OPT-05-list-mode-empty-policy/);

  assert.match(p0Gate, /P0 optimization authority rows: 6/);
  assert.match(p0Gate, /P0 rows implementation-ready: 0/);
  assert.match(p0Gate, /P0 rows with metric artifact authority: 0/);
  assert.match(p0Gate, /P0 rows with unified work decision authority: 0/);
  assert.match(p0Gate, /P0 rows with route\/surface\/list-mode fixture authority: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(routeSurfaceMetric, /FT-METRIC-06-empty-whitelist-main-json/);

  assert.match(diagnostic, /active console callsites: 419/);
});

test('optimization stop go decision is backed by JSON-first readiness and settings-mode blockers', () => {
  const readiness = read(sourceDocs.jsonFirstReadiness);
  const settingsMode = read(sourceDocs.settingsMode);
  const modeSurface = read(sourceDocs.modeSurfaceEffect);

  for (const row of [
    'Normalized path syntax',
    'Renderer ownership',
    'Field-effect authority',
    'Route/surface scope',
    'List-mode semantics',
    'Identity confidence',
    'Mutation effect',
    'Category/network budget',
    'No-rule/no-work budget',
    'Fixture provenance',
    'DOM fallback parity',
    'Native parity',
    'Optimization budget'
  ]) {
    assert.match(readiness, new RegExp(`\\| ${row} \\|[\\s\\S]*?\\| blocked \\|`), `missing blocked readiness row ${row}`);
  }

  for (const phrase of [
    'do not auto-promote documented paths into `FILTER_RULES`',
    'do not prune DOM fallback, network fallback, learned-map writes, or native',
    'measured `jsonFirstOptimizationBudget`'
  ]) {
    assert.ok(readiness.includes(phrase), `missing readiness phrase ${phrase}`);
  }

  for (const fixtureName of [
    'settings_mode_empty_blocklist_zero_work_main_home_mobile_watch',
    'settings_mode_explicit_empty_whitelist_fail_closed_ui_confirmed',
    'settings_mode_content_enabled_empty_values_inactive',
    'settings_mode_show_block_menu_and_quick_block_zero_lifecycle_when_off',
    'settings_mode_watch_controls_route_scoped',
    'settings_mode_simultaneous_allow_block_schema_migration_gate'
  ]) {
    assert.ok(settingsMode.includes(fixtureName), `missing settings fixture gate ${fixtureName}`);
  }

  assert.match(modeSurface, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
  assert.match(modeSurface, /Do not collapse empty blocklist into a global zero-work state/);
  assert.match(modeSurface, /Do not reuse blocklist no-work shortcuts for whitelist/);
  assert.match(modeSurface, /No-rule optimization must include content-control validity and route ownership/);
  assert.match(modeSurface, /Native quieting cannot be treated as a global lifecycle off switch/);
});

test('optimization stop go decision names first patch evidence and side-effect proof requirements', () => {
  const doc = read(docPath);

  for (const field of firstPatchEvidence) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing first-patch evidence ${field}`);
  }
  for (const field of sideEffectEvidence) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing side-effect evidence ${field}`);
  }

  assert.match(doc, /The first acceptable runtime patch shape is a measured work-decision or metric-artifact patch/);
  assert.match(doc, /not a broad whitelist, JSON path, DOM pruning, or logging cleanup patch/);
  assert.match(doc, /The audit has found concrete optimization locations and a viable JSON-first\s+direction/);
});

test('optimization stop go decision is linked from audit ledgers and runtime results', () => {
  const doc = read(docPath);
  const source = productSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const priority = read(sourceDocs.priority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex
  ]) {
    assert.match(artifact, /2026-05-27 release stabilization stop\/go revalidation/);
    assert.match(artifact, /no-work JSON gates/);
    assert.match(artifact, /forced visible-card reprocess/);
    assert.match(artifact, /canonical Main keyword compilation/);
    assert.match(artifact, /quick-block\/menu\/native menu repairs/);
    assert.match(artifact, /Kully B & Gussy G - Topic/);
    assert.match(artifact, /stop-now broad\s+whitelist optimization remains NO-GO/);
    assert.match(artifact, /stop-now broad\s+JSON-first promotion\s+remains NO-GO/);
    assert.match(artifact, /continued audit remains GO/);
    assert.match(artifact, /first future optimization\s+patch remains GATED/);
  }

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    priority,
    routeSurfaceMetric
  ]) {
    assert.match(artifact, /Optimization stop go decision record addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
