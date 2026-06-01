import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-source-owner-matrix-current-behavior.test.mjs';

const sourceDocs = {
  metricSchema: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md',
  metricGate: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  binding: 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  credential: 'docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

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

const expectedRuntimeSources = [
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
];

const futureAuthorityTokens = [
  'firstOptimizationMetricSourceOwnerMatrix',
  'optimizationMetricSourceOwnerReport',
  'optimizationMetricCollectorOwner',
  'optimizationMetricCounterOwner',
  'optimizationMetricSettingsScopeOwner',
  'optimizationMetricTransportOwner',
  'optimizationMetricFilterEngineOwner',
  'optimizationMetricDomLifecycleOwner',
  'optimizationMetricResolverOwner',
  'optimizationMetricStorageOwner',
  'optimizationMetricVisualEffectOwner',
  'optimizationMetricDiagnosticOwner'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function productSource() {
  return expectedRuntimeSources.map(read).join('\n');
}

test('first optimization metric source-owner matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric source-owner matrix/);
  assert.match(doc, /Runtime behavior\s+is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Metric source owners are mapped for future planning/);
  assert.match(doc, /Runtime collector ownership exists: no/);
  assert.match(doc, /Implementation-ready metric source-owner rows: 0/);
  assert.match(doc, /not completion proof for optimization metric owner authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization metric source-owner rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-METRICOWNER-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedOwnerRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /metric source-owner rows: 12/);
  assert.match(doc, /metric schema rows covered: 12/);
  assert.match(doc, /runtime source files referenced: 14/);
  assert.match(doc, /owner families referenced: 10/);
  assert.match(doc, /source-owner rows with implemented collector: 0/);
  assert.match(doc, /source-owner rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const schemaRow of expectedSchemaRows) {
    assert.ok(doc.includes(schemaRow), `missing schema row coverage ${schemaRow}`);
  }

  for (const source of expectedRuntimeSources) {
    assert.ok(doc.includes(source), `missing runtime source reference ${source}`);
  }
});

test('first optimization metric source-owner matrix is backed by current metric gates', () => {
  const metricSchema = read(sourceDocs.metricSchema);
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const diagnostic = read(sourceDocs.diagnostic);
  const credential = read(sourceDocs.credential);

  assert.match(metricSchema, /metric artifact schema rows: 12/);
  assert.match(metricSchema, /runtime metric collectors implemented: 0/);
  assert.match(metricSchema, /implementation-ready metric artifacts: 0/);

  assert.match(metricGate, /metric source\/effect blocks: 10/);
  assert.match(metricGate, /jsonFirstMetricArtifactReport token occurrences: 0/);
  assert.match(metricGate, /Runtime Instrumentation Counts/);

  assert.match(binding, /candidate-obligation binding rows: 10/);
  assert.match(binding, /bindings with committed metric artifact: 0/);

  assert.match(evidence, /FT-EVIDENCE-02-metric-artifact/);
  assert.match(evidence, /implementation-ready evidence packets: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /parseCount/);
  assert.match(routeSurfaceMetric, /diagnosticLogCount/);

  assert.match(diagnostic, /active console callsites: 419/);
  assert.match(credential, /fetch callsites with explicit credentials: 11/);
});

test('current source anchors still show split metric ownership before implementation', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  const ioManager = read('js/io_manager.js');

  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);
  assert.match(seed, /proto\.addEventListener = function \(type, listener, options\)/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);

  assert.match(filterLogic, /this\._harvestChannelData\(data\)/);
  assert.match(filterLogic, /processData\(data, dataName = 'unknown'\)/);
  assert.match(filterLogic, /const filtered = this\.filter\(data\)/);
  assert.match(filterLogic, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  assert.match(contentBridge, /chrome\.storage\.local\.get\(\['stats', 'statsBySurface'\]/);
  assert.match(contentBridge, /function ensureFallbackMenuButtons\(\)/);
  assert.match(contentBridge, /whitelistPendingRefreshState\.timer = setTimeout/);
  assert.match(contentBridge, /const observer = new MutationObserver\(\(\) => \{/);

  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  assert.match(blockChannel, /function setupQuickBlockObserver\(\)/);
  assert.match(blockChannel, /const observer = new MutationObserver\(\(mutations\) => \{/);

  assert.match(handleResolver, /resolvedHandleCache\.set\(cleanHandle, 'PENDING'\)/);
  assert.match(handleResolver, /response = await fetch\(path/);

  assert.match(background, /async function performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(background, /async function performKidsWatchIdentityFetch\(videoId\)/);
  assert.match(background, /async function performWatchIdentityFetch\(videoId\)/);
  assert.match(background, /const timeoutId = setTimeout\(\(\) => controller\.abort\('timeout'\), SHORTS_FETCH_TIMEOUT_MS\)/);

  assert.match(stateManager, /setTimeout\(processChannelEnrichmentQueue, 0\)/);
  assert.match(stateManager, /async function persistChannelMap\(channelId, channelHandle\)/);
  assert.match(stateManager, /await chrome\.storage\?\.local\.set\(\{ channelMap: state\.channelMap \}\)/);
  assert.match(ioManager, /backupScheduleTimer = setTimeout\(async \(\) => \{/);
});

test('first optimization metric source-owner authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization metric source-owner matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const metricSchema = read(sourceDocs.metricSchema);
  const metricGate = read(sourceDocs.metricGate);
  const binding = read(sourceDocs.binding);
  const evidence = read(sourceDocs.evidence);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    metricSchema,
    metricGate,
    binding,
    evidence,
    routeSurfaceMetric
  ]) {
    assert.match(artifact, /First optimization metric source-owner matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
