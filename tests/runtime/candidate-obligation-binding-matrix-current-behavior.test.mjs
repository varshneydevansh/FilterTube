import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/candidate-obligation-binding-matrix-current-behavior.test.mjs';

const sourceDocs = {
  priority: 'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  whitelistReadiness: 'docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  evidence: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md',
  locus: 'docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md',
  metric: 'docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  diagnostic: 'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedBindingRows = [
  'FT-BIND-00-metric-artifact-foundation',
  'FT-BIND-01-fetch-empty-disabled-pass-through',
  'FT-BIND-02-xhr-empty-disabled-pass-through',
  'FT-BIND-03-active-work-decision',
  'FT-BIND-04-harvest-mutation-split',
  'FT-BIND-05-whitelist-list-mode-policy',
  'FT-BIND-06-dom-lifecycle-and-pending',
  'FT-BIND-07-menu-quick-affordance',
  'FT-BIND-08-category-empty-values',
  'FT-BIND-09-native-release-rollout'
];

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

const expectedObligationIds = [
  'FT-METRIC-00-disabled-all-intercepts',
  'FT-METRIC-01-empty-blocklist-desktop-home',
  'FT-METRIC-02-empty-blocklist-mobile-home',
  'FT-METRIC-03-empty-blocklist-watch-player',
  'FT-METRIC-04-empty-blocklist-watch-next',
  'FT-METRIC-05-empty-blocklist-guide',
  'FT-METRIC-06-empty-whitelist-main-json',
  'FT-METRIC-07-nonempty-blocklist-core-routes',
  'FT-METRIC-08-nonempty-whitelist-unresolved-identity',
  'FT-METRIC-09-content-category-empty-values',
  'FT-METRIC-10-lifecycle-affordance-off',
  'FT-METRIC-11-diagnostic-measurement-budget'
];

const expectedReadinessIds = [
  'FT-WLREADY-00-empty-whitelist-policy',
  'FT-WLREADY-01-unresolved-identity-policy',
  'FT-WLREADY-02-list-mode-conflict-policy',
  'FT-WLREADY-03-transition-mutation-policy',
  'FT-WLREADY-04-import-dormant-mode-policy',
  'FT-WLREADY-05-pending-hide-lifecycle-policy',
  'FT-WLREADY-06-watch-right-rail-policy',
  'FT-WLREADY-07-json-dom-selected-row-parity',
  'FT-WLREADY-08-surface-parity-policy',
  'FT-WLREADY-09-metric-and-entry-gate'
];

const expectedEvidenceIds = [
  'FT-EVIDENCE-00-candidate-obligation-binding',
  'FT-EVIDENCE-01-route-surface-mode-scope',
  'FT-EVIDENCE-02-metric-artifact',
  'FT-EVIDENCE-03-positive-negative-fixtures',
  'FT-EVIDENCE-04-false-hide-leak-restore',
  'FT-EVIDENCE-05-json-dom-native-parity',
  'FT-EVIDENCE-06-lifecycle-budget',
  'FT-EVIDENCE-07-settings-mutation-profile',
  'FT-EVIDENCE-08-diagnostic-privacy',
  'FT-EVIDENCE-09-rollout-claim-boundary'
];

const futureAuthorityTokens = [
  'candidateObligationBindingMatrix',
  'optimizationCandidateObligationBindingReport',
  'firstOptimizationBindingDecision',
  'optimizationBindingMetricArtifact',
  'optimizationBindingFixturePacket',
  'optimizationBindingSourceLocusPacket',
  'optimizationBindingWhitelistReadinessPacket',
  'optimizationBindingRouteSurfacePacket',
  'optimizationBindingEvidencePacket',
  'optimizationBindingImplementationGate'
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

test('candidate obligation binding matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior candidate obligation binding matrix/);
  assert.match(doc, /Runtime\s+behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Candidate-obligation bindings are mapped for future planning/);
  assert.match(doc, /No binding has a committed metric artifact or complete fixture packet/);
  assert.match(doc, /No binding is implementation-ready/);
  assert.match(doc, /not completion proof for optimization readiness/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('candidate obligation binding rows and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-BIND-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedBindingRows);
  assert.equal(rows.length, 10);
  assert.match(doc, /candidate-obligation binding rows: 10/);
  assert.match(doc, /optimization candidates referenced: 12/);
  assert.match(doc, /route\/surface obligations referenced: 12/);
  assert.match(doc, /whitelist readiness rows referenced: 10/);
  assert.match(doc, /evidence packet rows referenced: 10/);
  assert.match(doc, /implementation-ready bindings: 0/);
  assert.match(doc, /bindings with committed metric artifact: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const id of [
    ...expectedCandidateIds,
    ...expectedObligationIds,
    ...expectedReadinessIds,
    ...expectedEvidenceIds
  ]) {
    assert.ok(doc.includes(id), `binding matrix missing ${id}`);
  }
});

test('candidate obligation binding matrix is backed by current source docs', () => {
  const priority = read(sourceDocs.priority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const whitelistReadiness = read(sourceDocs.whitelistReadiness);
  const evidence = read(sourceDocs.evidence);
  const locus = read(sourceDocs.locus);
  const metric = read(sourceDocs.metric);
  const activeWork = read(sourceDocs.activeWork);
  const diagnostic = read(sourceDocs.diagnostic);

  assert.match(priority, /optimization priority candidates: 12/);
  assert.match(priority, /P0 prerequisite candidates: 6/);
  assert.match(priority, /P1 follow-on candidates: 5/);
  assert.match(priority, /P2 rollout candidates: 1/);
  assert.match(priority, /implementation-ready candidates: 0/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /endpoint families requiring metric fixtures: 5/);
  assert.match(routeSurfaceMetric, /implementation-ready route\/surface optimization rows: 0/);
  assert.match(routeSurfaceMetric, /FT-METRIC-06-empty-whitelist-main-json/);
  assert.match(routeSurfaceMetric, /FT-METRIC-11-diagnostic-measurement-budget/);

  assert.match(whitelistReadiness, /whitelist readiness gap rows: 10/);
  assert.match(whitelistReadiness, /implementation-ready whitelist optimization rows: 0/);
  assert.match(whitelistReadiness, /FT-WLREADY-00-empty-whitelist-policy/);
  assert.match(whitelistReadiness, /FT-WLREADY-09-metric-and-entry-gate/);

  assert.match(evidence, /first optimization evidence packet rows: 10/);
  assert.match(evidence, /implementation-ready evidence packets: 0/);
  assert.match(evidence, /candidate-obligation bindings ready: 0/);
  assert.match(evidence, /FT-EVIDENCE-00-candidate-obligation-binding/);

  assert.match(locus, /Current Implementation Loci/);
  assert.match(locus, /js\/seed\.js/);
  assert.match(locus, /js\/filter_logic\.js/);
  assert.match(locus, /js\/content_bridge\.js/);

  assert.match(metric, /performance\.now callsites: 0/);
  assert.match(metric, /jsonFirstMetricArtifactReport token occurrences: 0/);
  assert.match(metric, /Required Future Metric Artifact/);

  assert.match(activeWork, /current predicate anchors: 11/);
  assert.match(activeWork, /interceptor endpoint entries per set: 5/);
  assert.match(diagnostic, /active console callsites: 419/);
});

test('candidate obligation source anchors still show split ownership before implementation', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');
  const background = read('js/background.js');

  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /function processWithEngine\(data, dataName\)/);
  assert.match(seed, /const dataName = `fetch:\$\{getPathname\(urlStr\)\}`;/);
  assert.match(seed, /proto\.addEventListener = function \(type, listener, options\)/);
  assert.match(seed, /const dataName = `xhr:\$\{getPathname\(urlStr\)\}`;/);
  assert.match(seed, /const processed = processWithEngine\(jsonData, dataName\)/);

  assert.match(filterLogic, /this\._harvestChannelData\(data\)/);
  assert.match(filterLogic, /if \(this\.settings\.enabled === false\)/);
  assert.match(filterLogic, /const filtered = this\.filter\(data\)/);

  assert.match(domFallback, /function hasActiveDOMFallbackWork\(settings\)/);
  assert.match(domFallback, /settings\.listMode === 'whitelist'/);
  assert.match(domFallback, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: false, needCategory: true \}\)/);

  assert.match(contentBridge, /async function initializeDOMFallback\(settings\)/);
  assert.match(contentBridge, /function ensureFallbackMenuButtons\(\)/);
  assert.match(contentBridge, /whitelistPendingRefreshState\.timer = setTimeout/);

  assert.match(blockChannel, /const isQuickBlockEnabled = \(\) =>/);
  assert.match(blockChannel, /function setupQuickBlockObserver\(\)/);
  assert.match(background, /const mergeAndClearBlocklistIntoWhitelist = \(scope\) =>/);
});

test('candidate obligation binding authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('candidate obligation binding matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const evidence = read(sourceDocs.evidence);
  const priority = read(sourceDocs.priority);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    evidence,
    priority,
    routeSurfaceMetric
  ]) {
    assert.match(artifact, /Candidate obligation binding matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
