import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-artifact-schema-current-behavior.test.mjs';

const sourceDocs = {
  metricGate: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  performanceClaim: 'docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md'
};

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

const requiredFields = [
  'metricId',
  'schemaVersion',
  'candidateId',
  'bindingId',
  'obligationId',
  'readinessId',
  'sourceLocus',
  'sourceOwner',
  'settingsRevision',
  'route',
  'surface',
  'endpoint',
  'profileType',
  'listMode',
  'extensionEnabled',
  'ruleState',
  'jsonPathClass',
  'domSelectorClass',
  'browser',
  'browserVersion',
  'deviceClass',
  'sampleSize',
  'fixtureId',
  'fixtureSource',
  'fetchInterceptCount',
  'xhrInterceptCount',
  'responseCloneCount',
  'parseCount',
  'stringifyCount',
  'responseRebuildCount',
  'bytesRead',
  'bytesWritten',
  'processDataCount',
  'harvestCount',
  'filterTraversalCount',
  'rendererVisitedCount',
  'rendererRemovedCount',
  'sideEffectQueueCount',
  'domScanCount',
  'selectorMatchCount',
  'listenerCount',
  'observerCount',
  'timerCount',
  'animationFrameCount',
  'domRerunCount',
  'networkFetchCount',
  'credentialMode',
  'timeoutCount',
  'cacheHitCount',
  'cacheMissCount',
  'resolverFallbackCount',
  'storageReadCount',
  'storageWriteCount',
  'cacheInvalidationCount',
  'backupTriggerCount',
  'refreshBroadcastCount',
  'hideMutationCount',
  'restoreMutationCount',
  'staleMarkerCleanupCount',
  'siblingVisibleResult',
  'restoreResult',
  'emptyWhitelistPolicy',
  'unresolvedIdentityCount',
  'pendingIdentityCount',
  'allowDecisionCount',
  'blockDecisionCount',
  'falseHideBudget',
  'leakBudget',
  'diagnosticLogCount',
  'consoleLogCount',
  'consoleWarnCount',
  'consoleErrorCount',
  'consoleDebugCount',
  'privacyClass',
  'redactionPolicy',
  'debugGate',
  'positiveFixture',
  'negativeSiblingFixture',
  'domParityFixture',
  'nativeParityFixture',
  'artifactPath',
  'verificationCommand',
  'releaseArtifactHash',
  'publicClaimScope'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricArtifactSchema',
  'firstOptimizationMetricArtifactReport',
  'optimizationMetricArtifactCollector',
  'optimizationMetricArtifactRow',
  'optimizationMetricWorkCounter',
  'optimizationMetricRouteSample',
  'optimizationMetricFixtureBundle',
  'optimizationMetricDiagnosticBudget',
  'optimizationMetricParityBudget',
  'optimizationMetricClaimGate'
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
    'js/content/handle_resolver.js',
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

test('first optimization metric artifact schema is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric artifact schema/);
  assert.match(doc, /Runtime behavior is\s+unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Metric artifact schema required: yes/);
  assert.match(doc, /Current committed first-optimization metric artifacts: 0/);
  assert.match(doc, /Runtime metric collectors implemented: 0/);
  assert.match(doc, /Implementation-ready metric artifacts: 0/);
  assert.match(doc, /not completion proof for optimization metric authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization metric artifact schema rows counts and fields stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-METRICSCHEMA-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedSchemaRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /metric artifact schema rows: 12/);
  assert.match(doc, /candidate bindings requiring metric artifacts: 10/);
  assert.match(doc, /route\/surface obligations requiring metric artifacts: 12/);
  assert.match(doc, /evidence rows requiring metric artifacts: 1/);
  assert.match(doc, /required metric field groups: 12/);
  assert.match(doc, /current committed first-optimization metric artifacts: 0/);
  assert.match(doc, /runtime metric collectors implemented: 0/);
  assert.match(doc, /implementation-ready metric artifacts: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const field of requiredFields) {
    assert.match(doc, new RegExp(`\\b${field}\\b`), `missing schema field ${field}`);
  }
});

test('first optimization metric artifact schema is backed by current gate documents', () => {
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const p0Gate = read(sourceDocs.p0Gate);
  const diagnostic = read(sourceDocs.diagnostic);
  const performanceClaim = read(sourceDocs.performanceClaim);

  assert.match(metricGate, /performance\.now callsites: 0/);
  assert.match(metricGate, /console\.time callsites: 0/);
  assert.match(metricGate, /jsonFirstMetricArtifactReport token occurrences: 0/);
  assert.match(metricGate, /Required Future Metric Artifact/);

  assert.match(binding, /candidate-obligation binding rows: 10/);
  assert.match(binding, /bindings with committed metric artifact: 0/);
  assert.match(binding, /implementation-ready bindings: 0/);

  assert.match(evidence, /FT-EVIDENCE-02-metric-artifact/);
  assert.match(evidence, /implementation-ready evidence packets: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /Required Metric Artifact Columns/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);

  assert.match(p0Gate, /Metric artifact authority/);
  assert.match(p0Gate, /P0 rows with metric artifact authority: 0/);
  assert.match(diagnostic, /active console callsites: 419/);
  assert.match(performanceClaim, /historical performance claims|claim boundary/i);
});

test('current source still exposes debug timing and side-effect surfaces rather than metric artifacts', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');

  assert.match(seed, /const debugStatsEnabled = isSeedDebugEnabled\(\)/);
  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /new Response\(JSON\.stringify\(processed\)/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);

  assert.match(filterLogic, /this\._harvestChannelData\(data\)/);
  assert.match(filterLogic, /const startTime = Date\.now\(\)/);
  assert.match(filterLogic, /const filtered = this\.filter\(data\)/);
  assert.match(filterLogic, /const endTime = Date\.now\(\)/);

  assert.match(contentBridge, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(contentBridge, /element\.setAttribute\('data-filtertube-time-saved'/);
  assert.match(contentBridge, /whitelistPendingRefreshState\.timer = setTimeout/);

  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);
  assert.match(contentBridge, /const observer = new MutationObserver\(\(\) => \{/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\)/);
  assert.match(blockChannel, /const observer = new MutationObserver\(\(mutations\) => \{/);

  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
  assert.match(handleResolver, /response = await fetch\(path/);
  assert.match(background, /const SHORTS_FETCH_TIMEOUT_MS = 8000/);
  assert.match(background, /setTimeout\(\(\) => controller\.abort\('timeout'\), SHORTS_FETCH_TIMEOUT_MS\)/);
});

test('first optimization metric artifact authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization metric artifact schema is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    metricGate,
    binding,
    evidence,
    routeSurfaceMetric
  ]) {
    assert.match(artifact, /First optimization metric artifact schema addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
