import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs';

const sourceDocs = {
  collectorGate: 'docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
  enabledBoundary: 'docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  seedFetch: 'docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  seedXhr: 'docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  routeSurfaceMetric: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md'
};

const expectedNoWorkRows = [
  'FT-COLLECTOR-NOWORK-00-settings-snapshot-preservation',
  'FT-COLLECTOR-NOWORK-01-fixture-envelope-preservation',
  'FT-COLLECTOR-NOWORK-02-fetch-pass-through-preservation',
  'FT-COLLECTOR-NOWORK-03-xhr-hook-preservation',
  'FT-COLLECTOR-NOWORK-04-engine-harvest-preservation',
  'FT-COLLECTOR-NOWORK-05-dom-quiet-preservation',
  'FT-COLLECTOR-NOWORK-06-menu-quick-off-preservation',
  'FT-COLLECTOR-NOWORK-07-network-zero-fetch-preservation',
  'FT-COLLECTOR-NOWORK-08-storage-zero-mutation-preservation',
  'FT-COLLECTOR-NOWORK-09-visual-no-mutation-preservation',
  'FT-COLLECTOR-NOWORK-10-whitelist-fail-state-preservation',
  'FT-COLLECTOR-NOWORK-11-diagnostic-claim-preservation'
];

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

const expectedNoWorkFixtures = [
  'empty_blocklist_desktop_home_no_work',
  'empty_blocklist_mobile_home_no_work',
  'empty_blocklist_watch_no_player_mutation',
  'disabled_extension_no_mutation'
];

const expectedCounterGroups = [
  'responseJson',
  'jsonParse',
  'jsonStringify',
  'processData',
  'harvestOnly',
  'direct network fetches',
  'DOM scans',
  'quick/fallback menu sweeps',
  'stats/map/storage writes'
];

const futureAuthorityTokens = [
  'firstOptimizationMetricCollectorNoWorkPreservationMatrix',
  'optimizationMetricCollectorNoWorkPreservationReport',
  'optimizationMetricCollectorDisabledPassThroughProof',
  'optimizationMetricCollectorEmptyListProof',
  'optimizationMetricCollectorNoRuleProof',
  'optimizationMetricCollectorNoBodyReadProof',
  'optimizationMetricCollectorNoListenerProof',
  'optimizationMetricCollectorNoDomScanProof',
  'optimizationMetricCollectorNoNetworkProof',
  'optimizationMetricCollectorNoStorageProof',
  'optimizationMetricCollectorNoVisualMutationProof',
  'optimizationMetricCollectorNoDiagnosticLeakProof'
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

test('first optimization collector no-work preservation matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior metric collector no-work preservation/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch,\s+optimization patch/);
  assert.match(doc, /Metric collector no-work preservation proof is required/);
  assert.match(doc, /Runtime collector no-work preservation proof exists: no/);
  assert.match(doc, /Implementation-ready collector no-work rows: 0/);
  assert.match(doc, /not completion proof for metric collector no-work preservation authority/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('first optimization collector no-work rows counts and coverage stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-COLLECTOR-NOWORK-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedNoWorkRows);
  assert.equal(rows.length, 12);
  assert.match(doc, /collector no-work preservation rows: 12/);
  assert.match(doc, /collector insertion rows covered: 12/);
  assert.match(doc, /P0 no-work fixture names covered: 4/);
  assert.match(doc, /required no-work counter groups covered: 9/);
  assert.match(doc, /route\/surface obligations covered: 12/);
  assert.match(doc, /runtime collector no-work proofs approved: 0/);
  assert.match(doc, /collector no-work rows implementation-ready: 0/);
  assert.match(doc, /runtime behavior changed: no/);

  for (const collectorRow of expectedCollectorRows) {
    assert.ok(doc.includes(collectorRow), `missing collector row coverage ${collectorRow}`);
  }

  for (const fixtureName of expectedNoWorkFixtures) {
    assert.ok(doc.includes(fixtureName), `missing no-work fixture ${fixtureName}`);
  }

  for (const counterGroup of expectedCounterGroups) {
    assert.ok(doc.includes(counterGroup), `missing counter group ${counterGroup}`);
  }
});

test('first optimization collector no-work matrix is backed by current no-work and active-work gates', () => {
  const collectorGate = read(sourceDocs.collectorGate);
  const noWork = read(sourceDocs.noWork);
  const enabledBoundary = read(sourceDocs.enabledBoundary);
  const seedFetch = read(sourceDocs.seedFetch);
  const seedXhr = read(sourceDocs.seedXhr);
  const activeWork = read(sourceDocs.activeWork);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const p0Gate = read(sourceDocs.p0Gate);

  assert.match(collectorGate, /collector insertion gate rows: 12/);
  assert.match(collectorGate, /collector rows with no-work preservation proof: 0/);
  assert.match(collectorGate, /collector rows implementation-ready: 0/);

  assert.match(noWork, /empty_blocklist_desktop_home_no_work/);
  assert.match(noWork, /disabled_extension_no_mutation/);
  assert.match(noWork, /responseJson: 0/);
  assert.match(noWork, /stats\/map\/storage writes: 0/);

  assert.match(enabledBoundary, /Seed fetch interception/);
  assert.match(enabledBoundary, /Filter engine/);
  assert.match(enabledBoundary, /DOM fallback active predicate/);

  assert.match(seedFetch, /response\.clone\(\)\.json tokens: 1/);
  assert.match(seedFetch, /Disabled settings now skip `harvestOnly\(\)`, `processData\(\)`, cloned-response parse, and replacement-body stringify/);
  assert.match(seedFetch, /runtime seed fetch no-work\/list-mode fixtures: 10/);

  assert.match(seedXhr, /XHR listener wrapper block lines: 25/);
  assert.match(seedXhr, /Disabled settings skip mark, hooks, parse, stringify, `harvestOnly\(\)`, and `processData\(\)`/);
  assert.match(seedXhr, /runtime seed XHR no-work\/list-mode fixtures: 8/);

  assert.match(activeWork, /source files with active-work predicates: 5/);
  assert.match(activeWork, /fallback menu warmup scans: 8/);
  assert.match(activeWork, /quick-block periodic timer ms: none/);

  assert.match(routeSurfaceMetric, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(routeSurfaceMetric, /FT-METRIC-10-lifecycle-affordance-off/);
  assert.match(p0Gate, /P0 rows with unified work decision authority: 0/);
});

test('current source anchors still show no-work preservation risks before collector implementation', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const contentBridge = read('js/content_bridge.js');
  const domFallback = read('js/content/dom_fallback.js');
  const blockChannel = read('js/content/block_channel.js');
  const handleResolver = read('js/content/handle_resolver.js');
  const stateManager = read('js/state_manager.js');
  const ioManager = read('js/io_manager.js');

  assert.ok(seed.includes("pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || '' })"));
  assert.ok(seed.includes('if (cachedSettings.enabled === false)'));
  assert.ok(seed.includes('window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] })'));
  assert.ok(seed.includes('response.clone().json().then(jsonData =>'));
  assert.ok(seed.includes('jsonData = JSON.parse(trimmed)'));
  assert.ok(seed.includes("Object.defineProperty(xhr, 'response'"));

  assert.ok(filterLogic.includes('this._harvestChannelData(data)'));
  assert.ok(filterLogic.includes('if (this.settings.enabled === false)'));
  assert.ok(filterLogic.includes('const filtered = this.filter(data)'));

  assert.ok(contentBridge.includes('whitelistPendingRefreshState.timer = setTimeout'));
  assert.ok(contentBridge.includes('function ensureFallbackMenuButtons()'));
  assert.ok(contentBridge.includes("chrome.storage.local.get(['stats', 'statsBySurface']"));

  assert.ok(domFallback.includes('function hasActiveDOMFallbackWork(settings)'));
  assert.ok(domFallback.includes("document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden, [data-filtertube-pending-category], [data-filtertube-pending-upload-date]')"));
  assert.ok(domFallback.includes('scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })'));

  assert.ok(blockChannel.includes('currentSettings.showQuickBlockButton !== true'));
  assert.ok(blockChannel.includes('quickBlockSweepTimer = setTimeout(() =>'));
  assert.ok(blockChannel.includes('const observer = new MutationObserver((mutations) => {'));

  assert.ok(handleResolver.includes("resolvedHandleCache.set(cleanHandle, 'PENDING')"));
  assert.ok(handleResolver.includes('response = await fetch(path'));
  assert.ok(stateManager.includes('await chrome.storage?.local.set({ channelMap: state.channelMap })'));
  assert.ok(ioManager.includes('backupScheduleTimer = setTimeout(async () => {'));
});

test('first optimization collector no-work authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }
});

test('first optimization collector no-work matrix is linked from audit ledgers and upstream gates', () => {
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const collectorGate = read(sourceDocs.collectorGate);
  const noWork = read(sourceDocs.noWork);
  const enabledBoundary = read(sourceDocs.enabledBoundary);
  const seedFetch = read(sourceDocs.seedFetch);
  const seedXhr = read(sourceDocs.seedXhr);
  const activeWork = read(sourceDocs.activeWork);
  const routeSurfaceMetric = read(sourceDocs.routeSurfaceMetric);
  const p0Gate = read(sourceDocs.p0Gate);

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    collectorGate,
    noWork,
    enabledBoundary,
    seedFetch,
    seedXhr,
    activeWork,
    routeSurfaceMetric,
    p0Gate
  ]) {
    assert.match(artifact, /First optimization metric collector no-work preservation matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
