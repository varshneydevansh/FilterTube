import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeTestPath = 'tests/runtime/p0-optimization-route-surface-metric-fixture-matrix-current-behavior.test.mjs';

const sourceDocs = {
  p0Gate: 'docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md',
  noWork: 'docs/audit/FILTERTUBE_P0_NO_WORK_CURRENT_BEHAVIOR_2026-05-18.md',
  endpoint: 'docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md',
  settingsMode: 'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
  routeSurface: 'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
  activeWork: 'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md'
};

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

const expectedMetricColumns = [
  'obligationId',
  'candidateId',
  'route',
  'surface',
  'endpoint',
  'profileType',
  'listMode',
  'extensionEnabled',
  'ruleState',
  'fixtureId',
  'fixtureSource',
  'positiveOrNegative',
  'parseCount',
  'stringifyCount',
  'processDataCount',
  'harvestCount',
  'domScanCount',
  'listenerCount',
  'observerCount',
  'timerCount',
  'networkFetchCount',
  'storageWriteCount',
  'hideMutationCount',
  'restoreMutationCount',
  'diagnosticLogCount',
  'elapsedMs',
  'bytesRead',
  'bytesWritten',
  'siblingVisibleResult',
  'restoreResult',
  'artifactPath'
];

const futureAuthorityTokens = [
  'p0OptimizationRouteSurfaceMetricFixtureMatrix',
  'p0OptimizationMetricFixtureObligation',
  'p0OptimizationMetricArtifactSchema',
  'routeSurfaceMetricFixtureReport',
  'disabledInterceptMetricFixture',
  'emptyBlocklistMetricFixture',
  'emptyWhitelistMetricFixture',
  'whitelistUnresolvedIdentityMetricFixture',
  'lifecycleAffordanceMetricFixture',
  'diagnosticMeasurementBudgetFixture',
  'jsonFirstContentFilterRouteSurfaceDecisionReport',
  'jsonFirstContentFilterEndpointBudgetReport',
  'jsonFirstContentFilterDomSelectorBudgetReport',
  'jsonFirstContentFilterMetadataFetchRouteReport',
  'jsonFirstContentFilterFtMetric09Artifact',
  'jsonFirstContentFilterRouteSurfaceNoWorkProof'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
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

test('P0 route surface metric fixture matrix is audit-only and source-backed', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior fixture obligation matrix/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch, optimization patch/);
  assert.match(doc, /Current runtime source does not emit metric artifacts for any of them/);
  assert.match(doc, /No route\/surface optimization row is implementation-ready/);
  assert.match(doc, /not completion proof for optimization fixture authority/);
  assert.match(doc, /Content Filter Route\/Surface Validity Addendum - 2026-05-28/);
  assert.match(doc, /content-filter route\/surface validity rows: 7/);
  assert.match(doc, /content-filter route\/surface decision report: absent/);
  assert.match(doc, /content-filter endpoint work budget report: absent/);
  assert.match(doc, /content-filter DOM selector budget report: absent/);
  assert.match(doc, /content-filter metadata fetch route report: absent/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /FT-METRIC-09 remains blocked/);
  assert.match(doc, /flowchart TD/);

  for (const sourceDoc of Object.values(sourceDocs)) {
    assert.ok(doc.includes(sourceDoc), `missing source doc ${sourceDoc}`);
  }
});

test('P0 route surface metric fixture obligations and counts stay pinned', () => {
  const doc = read(docPath);
  const rows = [...doc.matchAll(/^\| `(FT-METRIC-[^`]+)` \|/gm)].map((row) => row[1]);

  assert.deepEqual(rows, expectedObligationIds);
  assert.equal(rows.length, 12);
  assert.match(doc, /P0 route\/surface metric fixture obligations: 12/);
  assert.match(doc, /endpoint families requiring metric fixtures: 5/);
  assert.match(doc, /settings-mode dimensions represented: 5/);
  assert.match(doc, /surface families represented: 6/);
  assert.match(doc, /implementation-ready route\/surface optimization rows: 0/);
});

test('P0 route surface matrix is backed by no-work endpoint settings and surface evidence', () => {
  const p0Gate = read(sourceDocs.p0Gate);
  const noWork = read(sourceDocs.noWork);
  const endpoint = read(sourceDocs.endpoint);
  const settingsMode = read(sourceDocs.settingsMode);
  const routeSurface = read(sourceDocs.routeSurface);
  const activeWork = read(sourceDocs.activeWork);

  for (const row of [
    'Metric artifact authority',
    'Seed transport work decision',
    'Harvest versus mutation decision',
    'List-mode and whitelist work decision',
    'Lifecycle owner work decision',
    'Diagnostic measurement policy'
  ]) {
    assert.ok(p0Gate.includes(row), `missing P0 gate row ${row}`);
  }

  for (const fixture of [
    'empty_blocklist_desktop_home_no_work',
    'empty_blocklist_mobile_home_no_work',
    'empty_blocklist_watch_no_player_mutation',
    'disabled_extension_no_mutation'
  ]) {
    assert.ok(noWork.includes(fixture), `missing no-work fixture ${fixture}`);
  }

  for (const endpointPath of [
    '/youtubei/v1/search',
    '/youtubei/v1/guide',
    '/youtubei/v1/browse',
    '/youtubei/v1/next',
    '/youtubei/v1/player'
  ]) {
    assert.ok(endpoint.includes(endpointPath), `missing endpoint ${endpointPath}`);
  }

  for (const fixtureName of [
    'settings_mode_disabled_extension_zero_work_all_surfaces',
    'settings_mode_empty_blocklist_zero_work_main_home_mobile_watch',
    'settings_mode_explicit_empty_whitelist_fail_closed_ui_confirmed',
    'settings_mode_content_enabled_empty_values_inactive',
    'settings_mode_show_block_menu_and_quick_block_zero_lifecycle_when_off',
    'settings_mode_watch_controls_route_scoped'
  ]) {
    assert.ok(settingsMode.includes(fixtureName), `missing settings future fixture ${fixtureName}`);
  }

  for (const surface of [
    'YouTubei endpoints',
    'Main home/search',
    'Main watch/current video',
    'Shorts',
    'Playlist/Mix',
    'Comments/posts/community',
    'YouTube Kids',
    'YouTube Music/mobile `ytm-*`',
    'Native overlays/fullscreen/app shells'
  ]) {
    assert.ok(routeSurface.includes(surface), `missing route/surface ${surface}`);
  }

  assert.match(activeWork, /interceptor endpoint entries per set: 5/);
  assert.match(activeWork, /current predicate anchors: 11/);
  assert.match(activeWork, /DOM fallback active trigger total: 36/);
});

test('P0 route surface metric columns require JSON DOM lifecycle side-effect and restore proof', () => {
  const doc = read(docPath);

  for (const column of expectedMetricColumns) {
    assert.match(doc, new RegExp(`\\b${column}\\b`), `missing metric column ${column}`);
  }

  for (const requiredPhrase of [
    'Zero parse, stringify, processData, harvest, DOM scan, listener install, storage write, network fetch, hide, restore, and diagnostic spam',
    'sibling-visible proof',
    'JSON/DOM parity',
    'pending-TTL',
    'Inactive compiled-state metrics',
    'Listener/observer/timer counts',
    'privacy class',
    'metric-replacement output',
    'Zero endpoint mutation, zero metadata fetch, zero DOM scan, zero false hide',
    'no route/surface selector budget exists',
    'no artifact binds fetch reason to route/surface budget'
  ]) {
    assert.ok(doc.includes(requiredPhrase), `missing required evidence phrase ${requiredPhrase}`);
  }
});

test('P0 route surface source anchors still show split work before metric authority exists', () => {
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');
  const blockChannel = read('js/content/block_channel.js');
  const injector = read('js/injector.js');
  const seedGate = sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  const injectorGate = sliceBetween(injector, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {');
  const bridgeGate = sliceBetween(contentBridge, 'function hasBridgeEnabledContentFilters(settings) {', 'function hasBridgeSelectedCategoryFilters(settings) {');
  const domGate = sliceBetween(domFallback, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  const uploadBlock = sliceBetween(domFallback, 'let hideByUploadDate = false;', "\n            try {\n                const path = document.location?.pathname ||");
  const durationBlock = sliceBetween(domFallback, 'let hideByDuration = false;', '\n\n            const skipKeywordFiltering');

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

  for (const gate of [seedGate, injectorGate, bridgeGate]) {
    assert.match(gate, /duration\?\.enabled === true/);
    assert.match(gate, /uploadDate\?\.enabled === true/);
    assert.match(gate, /uppercase\?\.enabled === true/);
    assert.doesNotMatch(gate, /route|surface|pathname|location|endpoint/i);
  }
  assert.match(domGate, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(domGate, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(domGate, /contentFilters\?\.uppercase\?\.enabled === true/);
  assert.doesNotMatch(domGate, /document\.location|URLSearchParams|pathname|search/);
  assert.match(uploadBlock, /scheduleVideoMetaFetch\(videoId, \{ needDuration: false, needDates: true \}\)/);
  assert.match(durationBlock, /scheduleVideoMetaFetch\(videoId, \{ needDuration: true, needDates: false, needCategory: false \}\)/);
  assert.match(durationBlock, /scheduleVideoMetaFetch\(videoId\)/);
});

test('P0 route surface metric fixture matrix is linked from audit ledgers and runtime results', () => {
  const doc = read(docPath);
  const source = productSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const p0Gate = read(sourceDocs.p0Gate);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(`\\b${token}\\b`), `missing doc token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `runtime unexpectedly defines ${token}`);
  }

  for (const artifact of [
    runtimeResults,
    objectiveLedger,
    activeGoal,
    trackedIndex,
    p0Gate
  ]) {
    assert.match(artifact, /P0 optimization route surface metric fixture matrix addendum/);
    assert.ok(artifact.includes(docPath));
    assert.ok(artifact.includes(runtimeTestPath));
  }

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
});
