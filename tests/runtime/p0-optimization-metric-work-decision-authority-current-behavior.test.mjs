import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/p0-optimization-metric-work-decision-authority-current-behavior.test.mjs';

const sourceDocs = {
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  metric: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  listMode: 'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedRows = [
  'Metric artifact authority',
  'Seed transport work decision',
  'Harvest versus mutation decision',
  'List-mode and whitelist work decision',
  'Lifecycle owner work decision',
  'Diagnostic measurement policy'
];

const futureAuthorityTokens = [
  'p0OptimizationMetricWorkDecisionAuthority',
  'p0OptimizationMetricWorkDecisionReport',
  'jsonFirstMetricArtifactReport',
  'jsonFirstTransportWorkDecision',
  'jsonFirstHarvestMutationDecision',
  'jsonFirstListModeWorkDecision',
  'jsonFirstLifecycleWorkDecision',
  'jsonFirstDiagnosticMeasurementPolicy',
  'jsonFirstOptimizationCandidateId',
  'jsonFirstOptimizationRouteSurfaceMetric',
  'jsonFirstOptimizationSideEffectBudget',
  'jsonFirstOptimizationFixtureProvenance'
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

test('P0 optimization metric work decision authority slice is audit-only', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior authority gap/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /No P0 optimization candidate is implementation-ready/);
  assert.match(doc, /not completion proof for optimization authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('P0 authority rows and current counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| ([^|`][^|]+?) \| [^|]+ \| [^|]+ \| `([^`]+)`/gm)];
  const rowNames = rows.map((row) => row[1].trim());

  assert.deepEqual(rowNames, expectedRows);
  assert.equal(rows.length, 6);
  assert.match(doc, /P0 optimization authority rows: 6/);
  assert.match(doc, /P0 rows implementation-ready: 0/);
  assert.match(doc, /P0 rows with metric artifact authority: 0/);
  assert.match(doc, /P0 rows with unified work decision authority: 0/);
  assert.match(doc, /P0 rows with route\/surface\/list-mode fixture authority: 0/);
});

test('P0 authority rows are backed by existing priority metric active-work list-mode and logging proof', () => {
  const priority = read(sourceDocs.priority);
  const metric = read(sourceDocs.metric);
  const activeWork = read(sourceDocs.activeWork);
  const listMode = read(sourceDocs.listMode);
  const diagnostic = read(sourceDocs.diagnostic);

  assert.match(priority, /P0 prerequisite candidates: 6/);
  assert.match(priority, /implementation-ready candidates: 0/);
  assert.match(priority, /FT-OPT-00-metric-artifact-gate/);
  assert.match(priority, /FT-OPT-05-list-mode-empty-policy/);

  assert.match(metric, /performance\.now callsites: 0/);
  assert.match(metric, /console\.time callsites: 0/);
  assert.match(metric, /Date\.now callsites: 82/);
  assert.match(metric, /setTimeout callsites: 82/);
  assert.match(metric, /jsonFirstMetricArtifactReport token occurrences: 0/);
  assert.match(read(docPath), /Runtime scope has 0 `performance\.now\(\)` callsites, 0 `console\.time\(\)` callsites, 82 `Date\.now\(\)` callsites, 82 `setTimeout` callsites/);

  assert.match(activeWork, /current predicate anchors: 11/);
  assert.match(activeWork, /source files with active-work predicates: 5/);
  assert.match(activeWork, /DOM fallback active trigger total: 36/);
  assert.match(activeWork, /quick-block setup delay ms: 1000/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);

  assert.match(listMode, /empty blocklist mode preserves a normal/);
  assert.match(listMode, /empty whitelist mode removes the same renderer/);
  assert.match(listMode, /unknown `listMode` falls back to blocklist/);

  assert.match(diagnostic, /active console callsites: 418/);
  assert.match(diagnostic, /console\.log callsites: 203/);
  assert.match(diagnostic, /console\.warn callsites: 123/);
});

test('P0 authority current source anchors still show split work ownership', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');

  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);
  assert.match(seed, /proto\.addEventListener = function \(type, listener, options\)/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);

  assert.match(filterLogic, /this\._harvestChannelData\(data\)/);
  assert.match(filterLogic, /if \(this\.settings\.enabled === false\)/);
  assert.match(filterLogic, /const filtered = this\.filter\(data\)/);

  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(domFallback, /settings\.listMode === 'whitelist'/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  assert.match(contentBridge, /async function initializeDOMFallback\(settings\)/);
  assert.match(contentBridge, /function ensureFallbackMenuButtons\(\)/);
  assert.match(blockChannel, /const isQuickBlockEnabled = \(\) =>/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\)/);
});

test('P0 optimization authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('P0 optimization authority slice is linked from audit ledgers and runtime results', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const priorityRegister = read(sourceDocs.priority);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    priorityRegister
  ]) {
    assert.match(artifact, /P0 optimization metric work decision authority addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
