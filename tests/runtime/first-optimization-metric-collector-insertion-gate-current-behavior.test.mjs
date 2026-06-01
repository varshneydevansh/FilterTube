import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs';

const sourceDocs = {
  sourceOwner: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  metricGate: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md'
};

const expectedCollectorRows = [
  'FT-COLLECTOR-00-scope-settings-insertion',
  'FT-COLLECTOR-01-sample-fixture-insertion',
  'FT-COLLECTOR-02-transport-fetch-insertion',
  'FT-COLLECTOR-03-transport-xhr-insertion',
  'FT-COLLECTOR-04-filter-engine-insertion',
  'FT-COLLECTOR-05-dom-fallback-insertion',
  'FT-COLLECTOR-06-menu-quick-insertion',
  'FT-COLLECTOR-07-network-resolver-insertion',
  'FT-COLLECTOR-08-storage-mutation-insertion',
  'FT-COLLECTOR-09-hide-restore-insertion',
  'FT-COLLECTOR-10-whitelist-policy-insertion',
  'FT-COLLECTOR-11-diagnostic-rollout-insertion'
];

const expectedOwnerRows = [
  'FT-METRICOWNER-00-scope-settings-owner',
  'FT-METRICOWNER-01-sample-fixture-owner',
  'FT-METRICOWNER-02-transport-json-owner',
  'FT-METRICOWNER-03-filter-engine-owner',
  'FT-METRICOWNER-04-dom-fallback-owner',
  'FT-METRICOWNER-05-menu-quick-owner',
  'FT-METRICOWNER-06-network-resolver-owner',
  'FT-METRICOWNER-07-storage-mutation-owner',
  'FT-METRICOWNER-08-hide-restore-owner',
  'FT-METRICOWNER-09-whitelist-policy-owner',
  'FT-METRICOWNER-10-diagnostic-owner',
  'FT-METRICOWNER-11-parity-rollout-owner'
];

const expectedSchemaRows = [
  'FT-METRICSCHEMA-00-identity-scope',
  'FT-METRICSCHEMA-01-route-surface-mode',
  'FT-METRICSCHEMA-02-sample-environment',
  'FT-METRICSCHEMA-03-transport-json-body-work',
  'FT-METRICSCHEMA-04-filter-engine-work',
  'FT-METRICSCHEMA-05-dom-lifecycle-work',
  'FT-METRICSCHEMA-06-network-resolver-work',
  'FT-METRICSCHEMA-07-storage-mutation-work',
  'FT-METRICSCHEMA-08-hide-restore-visual-work',
  'FT-METRICSCHEMA-09-whitelist-identity-policy',
  'FT-METRICSCHEMA-10-diagnostic-privacy',
  'FT-METRICSCHEMA-11-parity-rollout-provenance'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricCollectorInsertionGate',
  'optimizationMetricCollectorInsertionReport',
  'optimizationMetricCollectorNoWorkProof',
  'optimizationMetricCollectorSideEffectBudget',
  'optimizationMetricCollectorTransportGate',
  'optimizationMetricCollectorDomLifecycleGate',
  'optimizationMetricCollectorNetworkGate',
  'optimizationMetricCollectorStorageGate',
  'optimizationMetricCollectorVisualGate',
  'optimizationMetricCollectorDiagnosticGate',
  'optimizationMetricCollectorRolloutGate',
  'optimizationMetricCollectorImplementationGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
}

function productSource() {
  return ['js', 'build.js', 'scripts']
    .flatMap((root) => walk(root))
    .filter((file) => /\.(?:js|mjs)$/.test(file))
    .map(read)
    .join('\n');
}

test('first optimization metric collector insertion gate is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric collector insertion gate/);
  assert.match(doc, /Runtime\s+behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Metric collector insertion points are mapped for future planning/);
  assert.match(doc, /Runtime collector insertion approval exists: no/);
  assert.match(doc, /Implementation-ready collector insertion rows: 0/);
  assert.match(doc, /not completion proof for metric collector insertion authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization metric collector insertion rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedCollectorRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector insertion gate rows: 12/);
  assert.match(doc, /metric source-owner rows covered: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /runtime collector insertion points approved: 0/);
  assert.match(doc, /collector rows with no-work preservation proof: 0/);
  assert.match(doc, /collector rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const ownerRow of expectedOwnerRows) {
    assert.ok(doc.includes(ownerRow), `missing owner row coverage ${ownerRow}`);
  }

  for (const schemaRow of expectedSchemaRows) {
    assert.ok(doc.includes(schemaRow), `missing schema row coverage ${schemaRow}`);
  }
});

test('first optimization metric collector insertion gate is backed by current metric gates', () => {
  const sourceOwner = read(sourceDocs.sourceOwner);
  const metricSchema = read(sourceDocs.metricSchema);
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const p0Gate = read(sourceDocs.p0Gate);
  const diagnostic = read(sourceDocs.diagnostic);
  const noWork = read(sourceDocs.noWork);

  assert.match(sourceOwner, /metric source-owner rows: 12/);
  assert.match(sourceOwner, /source-owner rows with implemented collector: 0/);
  assert.match(sourceOwner, /source-owner rows implementation-ready: 0/);

  assert.match(metricSchema, /metric artifact schema rows: 12/);
  assert.match(metricSchema, /runtime metric collectors implemented: 0/);
  assert.match(metricSchema, /implementation-ready metric artifacts: 0/);

  assert.match(metricGate, /performance\.now callsites: 0/);
  assert.match(metricGate, /console\.time callsites: 0/);
  assert.match(metricGate, /console\.timeEnd callsites: 0/);
  assert.match(metricGate, /jsonFirstMetricArtifactReport token occurrences: 0/);

  assert.match(binding, /candidate-obligation binding rows: 10/);
  assert.match(binding, /bindings with committed metric artifact: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);

  assert.match(p0Gate, /P0 optimization authority rows: 6/);
  assert.match(p0Gate, /P0 rows with metric artifact authority: 0/);
  assert.match(p0Gate, /P0 rows with unified work decision authority: 0/);

  assert.match(diagnostic, /active console callsites: 419/);
  assert.match(noWork, /P0 no-work family is green for seed network pass-through fixtures/);
  assert.match(noWork, /Runtime behavior changed on 2026-05-26/);
});

test('current source anchors still show collector insertion risks before implementation', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  const ioManager = read('js/io_manager.js');

  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('new Response(JSON.stringify(processed)'));
  assert.ok(seed.includes('proto.addEventListener = function (type, listener, options)'));
  assert.ok(seed.includes('const processed = processWithEngine(jsonData, dataName)'));

  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(filterLogic.includes('if (this.settings.enabled === false)'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));

  assert.ok(contentBridge.includes('whitelistPendingRefreshState.timer = setTimeout'));
  assert.ok(contentBridge.includes('function ensureFallbackMenuButtons()'));
  assert.ok(contentBridge.includes("chrome.storage.local.get(['stats', 'statsBySurface']"));
  assert.ok(contentBridge.includes('const observer = new MutationObserver(() => {'));

  assert.ok(domFallback.includes('function hasActiveDOMFallbackWork(settings)'));
  assert.ok(domFallback.includes('setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0)'));
  assert.ok(domFallback.includes('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })'));

  assert.ok(blockChannel.includes('function setupQuickBlockObserver()'));
  assert.ok(blockChannel.includes('quickBlockSweepTimer = setTimeout(() =>'));
  assert.ok(blockChannel.includes('const observer = new MutationObserver((mutations) => {'));

  assert.ok(handleResolver.includes("resolvedHandleCache.set(cleanHandle, 'PENDING')"));
  assert.ok(handleResolver.includes('response = await fetch(path'));

  assert.ok(background.includes("const timeoutId = setTimeout(() => controller.abort('timeout'), SHORTS_FETCH_TIMEOUT_MS)"));
  assert.ok(background.includes('fetch(`https://www.youtube.com/shorts/${videoId}`'));
  assert.ok(background.includes('fetch(`https://www.youtubekids.com/watch?v=${videoId}`'));

  assert.ok(stateManager.includes('await chrome.storage?.local.set({ channelMap: state.channelMap })'));
  assert.ok(stateManager.includes('setTimeout(processChannelEnrichmentQueue, 0)'));
  assert.ok(ioManager.includes('backupScheduleTimer = setTimeout(async () => {'));
});

test('first optimization metric collector insertion authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization metric collector insertion gate is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const sourceOwner = read(sourceDocs.sourceOwner);
  const metricSchema = read(sourceDocs.metricSchema);
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const p0Gate = read(sourceDocs.p0Gate);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    sourceOwner,
    metricSchema,
    metricGate,
    binding,
    routeSurfaceMetric,
    p0Gate
  ]) {
    assert.match(artifact, /First optimization metric collector insertion gate addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
