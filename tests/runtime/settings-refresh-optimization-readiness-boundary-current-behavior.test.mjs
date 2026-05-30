import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_CONSUMER_JOIN_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_CONSUMER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs',
  'docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md'
];

const rows = [
  'FT-SROR-00-scope',
  'FT-SROR-01-applysettings-forced-reprocess',
  'FT-SROR-02-refreshnow-forced-reprocess',
  'FT-SROR-03-rule-ui-storage-force',
  'FT-SROR-04-channelmap-only-early-return',
  'FT-SROR-05-videochannelmap-nonforced-refresh',
  'FT-SROR-06-videometamap-targeted-rerun',
  'FT-SROR-07-seed-no-json-clear',
  'FT-SROR-08-seed-active-json-replay',
  'FT-SROR-09-observer-menu-quick-refresh',
  'FT-SROR-10-import-sync-profile-write',
  'FT-SROR-11-first-optimization-binding'
];

const classificationClosureRows = [
  'FT-SRORC-00-scope',
  'FT-SRORC-01-applysettings-forced',
  'FT-SRORC-02-refreshnow-forced',
  'FT-SRORC-03-rule-ui-storage',
  'FT-SRORC-04-channelmap-only',
  'FT-SRORC-05-videochannelmap-only',
  'FT-SRORC-06-videometamap-targeted',
  'FT-SRORC-07-seed-no-json-clear',
  'FT-SRORC-08-seed-active-replay',
  'FT-SRORC-09-observer-menu-quick',
  'FT-SRORC-10-import-sync-profile',
  'FT-SRORC-11-first-optimization-binding'
];

const futureAuthorityTokens = [
  'settingsRefreshOptimizationReadinessBoundary',
  'settingsRefreshOptimizationDecisionReport',
  'settingsRefreshForcedRefreshBudget',
  'settingsRefreshMapOnlyStaleProof',
  'settingsRefreshSeedReplayOptimizationBudget',
  'settingsRefreshLifecycleFanoutBudget',
  'settingsRefreshImportSyncNoOpReport',
  'settingsRefreshVisibleCardStaleProof',
  'settingsRefreshOptimizationMetricArtifact',
  'settingsRefreshOptimizationRollbackReport',
  'settingsRefreshReadinessClassificationClosure',
  'settingsRefreshReadinessClassificationRuntimeApproval',
  'settingsRefreshReadinessClassificationImplementationReadiness'
];

const productFiles = [
  'js/background.js',
  'js/content/bridge_settings.js',
  'js/content_bridge.js',
  'js/seed.js',
  'js/state_manager.js',
  'js/settings_shared.js',
  'js/io_manager.js',
  'js/nanah_sync_adapter.js',
  'js/injector.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function exists(file) {
  return fs.existsSync(path.join(repoRoot, file));
}

function doc() {
  return read(docPath);
}

function productSource() {
  return productFiles.filter(exists).map(read).join('\n');
}

test('settings refresh optimization readiness boundary is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh optimization readiness\s+boundary/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh optimization readiness rows: 12/);
  assert.match(text, /settings refresh readiness classes covered: 6/);
  assert.match(text, /settings refresh blocked proof families: 8/);
  assert.match(text, /settings refresh implementation-ready optimization rows: 0/);
  assert.match(text, /runtime settings refresh optimization approvals: 0/);
  assert.match(text, /settings refresh optimization readiness approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh readiness classification closure rows: 12/);
  assert.match(text, /producer-consumer join rows linked by readiness closure: 14/);
  assert.match(text, /settings refresh readiness rows linked by readiness closure: 12/);
  assert.match(text, /settings refresh readiness classes linked by closure: 6/);
  assert.match(text, /settings refresh blocked proof families linked by closure: 8/);
  assert.match(text, /runtime settings refresh readiness classification approvals: 0/);
  assert.match(text, /implementation-ready readiness classification rows: 0/);
  assert.match(text, /settings refresh readiness classification closure: READINESS-CHAIN-CLOSED/);
  assert.match(text, /settings refresh implementation readiness from classification closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `readiness doc does not cite ${sourceDoc}`);
  }
});

test('settings refresh optimization readiness rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-SROR-[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-SRORC-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, classificationClosureRows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /settings refresh join class/);
  assert.match(text, /current answer: every class is audit-only; 0 classes are implementation-ready/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /Optimization readiness NO-GO/);
});

test('forced settings refresh paths remain correctness-critical and not optimization-ready', () => {
  const bridge = read('js/content/bridge_settings.js');
  const background = read('js/background.js');
  const coalescingProof = read('tests/runtime/storage-refresh-force-reprocess-coalescing-current-behavior.test.mjs');

  assert.match(bridge, /request\.action === 'FilterTube_RefreshNow'[\s\S]*?requestSettingsFromBackground\(\)\.then\(result => \{[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /request\.action === 'FilterTube_ApplySettings' && request\.settings[\s\S]*?sendSettingsToMainWorld\(normalized\);[\s\S]*?applyDOMFallback\(normalized, \{ forceReprocess: true \}\);/);
  assert.match(background, /request\.action === "FilterTube_ApplySettings" && request\.settings[\s\S]*?compiledSettingsCache\[targetProfile\] = null;[\s\S]*?getCompiledSettings\(syntheticSender, targetProfile, true\)[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\);/);
  assert.match(bridge, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\);/);
  assert.match(coalescingProof, /pending map-only storage refresh is upgraded when a keyword\/profile change arrives before the timer fires/);
});

test('map-only readiness remains gated by stale visible-card and field-effect proof', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');

  assert.match(bridgeSettings, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{[\s\S]*?return;[\s\S]*?const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap';[\s\S]*?const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap';/);
  assert.match(bridgeSettings, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\);/);
  assert.match(background, /function enqueueVideoChannelMapUpdate\(videoId, channelId\) \{[\s\S]*?pendingVideoChannelMapUpdates\.set\(v, c\);[\s\S]*?scheduleVideoChannelMapFlush\(\);/);
  assert.match(background, /function enqueueVideoMetaMapUpdate\(videoId, meta\) \{[\s\S]*?pendingVideoMetaMapUpdates\.set\(v, clean\);[\s\S]*?scheduleVideoMetaMapFlush\(\);/);
  assert.match(bridge, /function scheduleVideoMetaDomRerun\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?applyDOMFallback\(null\);[\s\S]*?\}, VIDEO_META_DOM_RERUN_DEBOUNCE_MS\);/);
  assert.match(bridge, /function touchDomForVideoMetaUpdate\(videoId\) \{[\s\S]*?node\.removeAttribute\('data-filtertube-duration'\);[\s\S]*?node\.removeAttribute\('data-filtertube-processed'\);/);
});

test('seed and lifecycle readiness remain blocked without replay and fanout budgets', () => {
  const text = doc();
  const bridge = read('js/content/bridge_settings.js');
  const contentBridge = read('js/content_bridge.js');
  const seed = read('js/seed.js');
  const stopGo = read('docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md');

  assert.match(text, /Settings Refresh Runtime Fanout Detail - 2026-05-30/);
  assert.match(text, /settings refresh runtime fanout detail rows: 9/);
  assert.match(text, /settings delivery seed retry delay: 250ms/);
  assert.match(text, /settings observer owner-return paths: 2/);
  assert.match(text, /settings direct fallback fanout calls: 3/);
  assert.match(text, /committed settings refresh fanout metric artifacts: 0/);
  assert.match(text, /observer\/menu\/quick fanout pruning approval: NO-GO/);
  assert.match(text, /runtime behavior changed by this fanout detail: no/);
  assert.match(text, /```mermaid\nflowchart TD/);

  for (const row of [
    'FT-SRFO-00-settings-main-world-post',
    'FT-SRFO-01-seed-direct-update',
    'FT-SRFO-02-seed-pending-retry',
    'FT-SRFO-03-owner-return-selection',
    'FT-SRFO-04-identity-prefetch-fanout',
    'FT-SRFO-05-playlist-and-rail-observers',
    'FT-SRFO-06-quick-block-refresh',
    'FT-SRFO-07-dom-fallback-observer-refresh',
    'FT-SRFO-08-metric-artifact-gap'
  ]) {
    assert.ok(text.includes(row), `missing fanout row ${row}`);
  }

  assert.match(bridge, /function sendSettingsToMainWorld\(settings\) \{[\s\S]*?tryApplySettingsToSeed\(settings\)[\s\S]*?pendingSeedSettings = settings;[\s\S]*?scheduleSeedRetry\(\);[\s\S]*?refreshRuntimeObserversAfterSettingsUpdate\(\);/);
  assert.match(bridge, /function scheduleSeedRetry\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?scheduleSeedRetry\(\);[\s\S]*?\}, 250\);/);
  assert.match(bridge, /function refreshRuntimeObserversAfterSettingsUpdate\(\) \{[\s\S]*?refreshFilterTubeRuntimeObservers\(\)[\s\S]*?FilterTube_refreshRuntimeObservers[\s\S]*?FilterTube_refreshQuickBlockAvailability[\s\S]*?FilterTube_refreshDOMFallbackObserver[\s\S]*?schedulePrefetchScan\(\)/);
  assert.match(bridge, /refreshFilterTubeRuntimeObservers\(\);[\s\S]*?return;[\s\S]*?window\.FilterTube_refreshRuntimeObservers\(\);[\s\S]*?return;/);
  assert.match(contentBridge, /function refreshFilterTubeRuntimeObservers\(\) \{[\s\S]*?needsIdentityPrefetchWork\(currentSettings\)[\s\S]*?startCardPrefetchObserver\(\);[\s\S]*?installPlaylistPanelPrefetchHook\(\);[\s\S]*?schedulePrefetchScan\(\);[\s\S]*?prefetchQueue = \[\];/);
  assert.match(contentBridge, /currentSettings\?\.listMode === 'whitelist'[\s\S]*?installRightRailWhitelistObserver\(\);/);
  assert.match(contentBridge, /window\.FilterTube_refreshQuickBlockAvailability\(\{ force: true \}\);[\s\S]*?window\.FilterTube_refreshDOMFallbackObserver\(\);/);
  assert.match(contentBridge, /function schedulePrefetchScan\(\) \{[\s\S]*?if \(!needsIdentityPrefetchWork\(currentSettings\)\) return;[\s\S]*?startCardPrefetchObserver\(\);[\s\S]*?installPlaylistPanelPrefetchHook\(\);/);
  assert.match(seed, /if \(!hasNetworkJsonWork\(cachedSettings\)\) \{[\s\S]*?pendingDataQueue = \[\];[\s\S]*?rawYtInitialData = null;[\s\S]*?rawYtInitialPlayerResponse = null;[\s\S]*?return;/);
  assert.match(seed, /pendingDataQueue\.length > 0[\s\S]*?processWithEngine\(sourceData, `\$\{item\.name\}-queued`\)[\s\S]*?window\.ytInitialData = processed;/);
  assert.match(seed, /sourceInitialData[\s\S]*?processWithEngine\(sourceInitialData, 'ytInitialData-reprocess'\)[\s\S]*?sourcePlayerResponse[\s\S]*?processWithEngine\(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess'\)/);
  assert.match(stopGo, /lifecycle pruning broad optimization decision: NO-GO/);

  for (const decision of [
    'accept fanout detail as metric artifact now: NO-GO',
    'accept fanout detail as seed retry pruning approval now: NO-GO',
    'accept fanout detail as identity prefetch pruning approval now: NO-GO',
    'accept fanout detail as right-rail whitelist observer pruning approval now: NO-GO',
    'accept fanout detail as quick-block availability pruning approval now: NO-GO',
    'accept fanout detail as DOM fallback observer pruning approval now: NO-GO',
    'accept fanout detail as whitelist optimization approval now: NO-GO',
    'accept fanout detail as JSON-first promotion approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing fanout decision ${decision}`);
  }
});

test('import and sync refresh readiness remains blocked by actor rollback and no-op proof', () => {
  const ioManager = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const stateManager = read('js/state_manager.js');

  assert.match(ioManager, /async function saveProfilesV4\(nextProfiles\) \{[\s\S]*?return writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: nextProfiles \}\);/);
  assert.match(ioManager, /const result = shouldImportIntoSeparateProfile[\s\S]*?await SettingsAPI\.saveSettings\(payload\);[\s\S]*?await saveProfilesV3\(nextProfiles\);[\s\S]*?await saveProfilesV4\(\{[\s\S]*?profiles[\s\S]*?\}\);[\s\S]*?await writeStorage\(\{ channelMap: nextChannelMap \}\);/);
  assert.match(nanah, /async function applyScopedPortablePayload\(io, portable[\s\S]*?await io\.saveProfilesV4\(\{[\s\S]*?\.\.\.profilesV4,[\s\S]*?profiles[\s\S]*?\}\);/);
  assert.match(stateManager, /async function requestRefresh\(profile = 'main'\) \{[\s\S]*?action: 'getCompiledSettings'[\s\S]*?forceRefresh: true[\s\S]*?broadcastSettings\(compiled, profile\);/);
});

test('settings refresh optimization required evidence stays explicit and current decisions remain NO-GO', () => {
  const text = doc();

  for (const field of [
    'candidateId',
    'producerPath',
    'consumerPath',
    'changedKeys',
    'profileType',
    'listMode',
    'ruleState',
    'route',
    'surface',
    'activeJsonWork',
    'activeDomWork',
    'activeMenuOrQuickWork',
    'mapOnlyClass',
    'noOpDecision',
    'visibleCardStaleProof',
    'positiveFixture',
    'negativeSiblingFixture',
    'metricArtifact',
    'rollbackProof'
  ]) {
    assert.ok(text.includes(field), `missing required proof field ${field}`);
  }

  for (const decision of [
    'approve settings refresh optimization authority now: NO-GO',
    'approve forced refresh pruning now: NO-GO',
    'approve map-only refresh pruning now: NO-GO',
    'approve seed replay pruning now: NO-GO',
    'approve observer/menu/quick-block pruning now: NO-GO',
    'approve import/sync refresh pruning now: NO-GO',
    'approve broad whitelist optimization from settings refresh readiness: NO-GO',
    'approve JSON-first promotion from settings refresh readiness: NO-GO',
    'close settings refresh readiness classification documentation now: GO',
    'accept readiness classification closure as settings refresh optimization approval now: NO-GO',
    'accept readiness classification closure as forced refresh pruning approval now: NO-GO',
    'accept readiness classification closure as map-only pruning approval now: NO-GO',
    'accept readiness classification closure as seed replay pruning approval now: NO-GO',
    'accept readiness classification closure as observer/menu/quick pruning approval now: NO-GO',
    'accept readiness classification closure as import/sync pruning approval now: NO-GO',
    'accept readiness classification closure as metric collector insertion approval now: NO-GO',
    'accept readiness classification closure as whitelist optimization approval now: NO-GO',
    'accept readiness classification closure as JSON-first promotion approval now: NO-GO',
    'accept readiness classification closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }
});

test('settings refresh optimization future authority and artifacts remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-optimization-readiness-boundary.json',
    'docs/audit/artifacts/settings-refresh-optimization-decision-report.json',
    'docs/audit/artifacts/settings-refresh-forced-refresh-budget.json',
    'docs/audit/artifacts/settings-refresh-map-only-stale-proof.json',
    'docs/audit/artifacts/settings-refresh-optimization-rollback-report.json',
    'docs/audit/artifacts/settings-refresh-readiness-classification-closure.json',
    'docs/audit/artifacts/settings-refresh-readiness-classification-implementation-readiness.json'
  ];

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This boundary is not a completion claim/);
});
