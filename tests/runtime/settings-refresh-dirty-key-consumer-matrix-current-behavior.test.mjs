import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_CONSUMER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_FILTER_ROUTE_SURFACE_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'
];

const rows = [
  'FT-SRDK-00-scope',
  'FT-SRDK-01-ui-pushed-settings',
  'FT-SRDK-02-background-storage-invalidation',
  'FT-SRDK-03-bridge-channel-map-only',
  'FT-SRDK-04-bridge-video-map-only',
  'FT-SRDK-05-bridge-rule-or-ui-key',
  'FT-SRDK-06-runtime-refreshnow',
  'FT-SRDK-07-runtime-applysettings',
  'FT-SRDK-08-main-world-delivery',
  'FT-SRDK-09-seed-no-json-work',
  'FT-SRDK-10-seed-active-json-work',
  'FT-SRDK-11-runtime-observer-refresh',
  'FT-SRDK-12-state-manager-refresh'
];

const consumerClosureRows = [
  'FT-SRDK-CLOSURE-00-scope',
  'FT-SRDK-CLOSURE-01-ui-pushed-settings',
  'FT-SRDK-CLOSURE-02-background-storage-invalidation',
  'FT-SRDK-CLOSURE-03-bridge-channel-map-only',
  'FT-SRDK-CLOSURE-04-bridge-video-map-only',
  'FT-SRDK-CLOSURE-05-bridge-rule-or-ui-key',
  'FT-SRDK-CLOSURE-06-runtime-refreshnow',
  'FT-SRDK-CLOSURE-07-runtime-applysettings',
  'FT-SRDK-CLOSURE-08-main-world-delivery',
  'FT-SRDK-CLOSURE-09-seed-no-json-work',
  'FT-SRDK-CLOSURE-10-seed-active-json-work',
  'FT-SRDK-CLOSURE-11-runtime-observer-refresh',
  'FT-SRDK-CLOSURE-12-state-manager-refresh'
];

const futureAuthorityTokens = [
  'settingsRefreshDirtyKeyConsumerMatrix',
  'settingsRefreshConsumerDecisionReport',
  'settingsRefreshRevisionedNoOpReport',
  'settingsRefreshCompiledCacheRevision',
  'settingsRefreshSeedReplayBudget',
  'settingsRefreshDomFallbackBudgetReport',
  'settingsRefreshObserverWorkBudget',
  'settingsRefreshMainWorldCapabilityReport',
  'settingsRefreshDirtyKeyMetricArtifact',
  'settingsRefreshRollbackReport',
  'settingsRefreshDirtyKeyConsumerClosure',
  'settingsRefreshDirtyKeyConsumerClosureRuntimeApproval',
  'settingsRefreshDirtyKeyConsumerImplementationReadiness'
];

const productFiles = [
  'js/background.js',
  'js/content/bridge_settings.js',
  'js/content_bridge.js',
  'js/seed.js',
  'js/state_manager.js',
  'js/injector.js',
  'js/content/dom_fallback.js'
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

test('settings refresh dirty-key consumer matrix is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh dirty-key consumer\s+matrix/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh dirty-key consumer matrix rows: 13/);
  assert.match(text, /settings refresh consumer work families covered: 7/);
  assert.match(text, /dirty-key special cases covered: 3/);
  assert.match(text, /runtime dirty-key authority approvals: 0/);
  assert.match(text, /settings refresh dirty-key consumer matrix approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh dirty-key consumer closure rows: 13/);
  assert.match(text, /consumer matrix rows linked by closure: 13/);
  assert.match(text, /consumer work families linked by closure: 7/);
  assert.match(text, /dirty-key special cases linked by closure: 3/);
  assert.match(text, /source input families linked by consumer closure: 6/);
  assert.match(text, /runtime dirty-key consumer closure approvals: 0/);
  assert.match(text, /implementation-ready dirty-key consumer rows: 0/);
  assert.match(text, /settings refresh dirty-key consumer closure: CONSUMER-CHAIN-CLOSED/);
  assert.match(text, /settings refresh consumer implementation readiness from closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `dirty-key matrix doc does not cite ${sourceDoc}`);
  }
});

test('settings refresh dirty-key rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-SRDK-(?!CLOSURE)[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-SRDK-CLOSURE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, consumerClosureRows);
  assert.match(text, /ASCII flow:/);
  assert.match(text, /storage\/UI mutation/);
  assert.match(text, /no shared dirty-key consumer report exists/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /No shared dirty-key consumer report/);
});

test('background and bridge dirty-key source behavior remains pinned', () => {
  const background = read('js/background.js');
  const bridge = read('js/content/bridge_settings.js');

  assert.match(background, /request\.action === "FilterTube_ApplySettings" && request\.settings[\s\S]*?compiledSettingsCache\[targetProfile\] = null;[\s\S]*?getCompiledSettings\(syntheticSender, targetProfile, true\)[\s\S]*?browserAPI\.tabs\.query\(\{ url: urlPattern \}, tabs => \{[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\);/);
  assert.match(background, /browserAPI\.storage\.onChanged\.addListener\(\(changes, area\) => \{[\s\S]*?const relevantKeys = \[[\s\S]*?'filterKeywords'[\s\S]*?'contentFilters'[\s\S]*?FT_PROFILES_V4_KEY[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?compiledSettingsCache\.kids = null;[\s\S]*?getCompiledSettings\(\{ url: 'https:\/\/www\.youtube\.com\/' \}\);[\s\S]*?getCompiledSettings\(\{ url: 'https:\/\/www\.youtubekids\.com\/' \}\);/);
  assert.match(bridge, /function handleStorageChanges\(changes, area\) \{[\s\S]*?if \(area !== 'local'\) return;[\s\S]*?changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'[\s\S]*?return;[\s\S]*?const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap';[\s\S]*?const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap';/);
  assert.match(bridge, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\);/);
  assert.match(bridge, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess;/);
});

test('settings refresh consumers remain broader than dirty-key payloads', () => {
  const bridge = read('js/content/bridge_settings.js');

  assert.match(bridge, /request\.action === 'FilterTube_RefreshNow'[\s\S]*?requestSettingsFromBackground\(\)\.then\(result => \{[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /request\.action === 'FilterTube_ApplySettings' && request\.settings[\s\S]*?requestSettingsFromBackground\(\)\.then\(result => \{[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\);[\s\S]*?const normalized = normalizeSettingsForHost\(request\.settings\);[\s\S]*?sendSettingsToMainWorld\(normalized\);[\s\S]*?applyDOMFallback\(normalized, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /function requestSettingsFromBackground\(options = \{\}\) \{[\s\S]*?const forceRefresh = options && typeof options === 'object' && options\.forceRefresh === true;[\s\S]*?\{ action: "getCompiledSettings", profileType, forceRefresh \}/);
  assert.match(bridge, /function sendSettingsToMainWorld\(settings\) \{[\s\S]*?window\.postMessage\(\{[\s\S]*?type: 'FilterTube_SettingsToInjector'[\s\S]*?tryApplySettingsToSeed\(settings\)[\s\S]*?pendingSeedSettings = settings;[\s\S]*?scheduleSeedRetry\(\);[\s\S]*?refreshRuntimeObserversAfterSettingsUpdate\(\);/);
  assert.match(bridge, /function refreshRuntimeObserversAfterSettingsUpdate\(\) \{[\s\S]*?refreshFilterTubeRuntimeObservers\(\)[\s\S]*?FilterTube_refreshRuntimeObservers[\s\S]*?FilterTube_refreshQuickBlockAvailability[\s\S]*?FilterTube_refreshDOMFallbackObserver[\s\S]*?schedulePrefetchScan\(\)/);
});

test('seed replay and StateManager refresh remain revisionless current behavior', () => {
  const seed = read('js/seed.js');
  const stateManager = read('js/state_manager.js');

  assert.match(seed, /function updateSettings\(newSettings\) \{[\s\S]*?cachedSettings = newSettings;[\s\S]*?if \(!hasNetworkJsonWork\(cachedSettings\)\) \{[\s\S]*?pendingDataQueue = \[\];[\s\S]*?rawYtInitialData = null;[\s\S]*?rawYtInitialPlayerResponse = null;[\s\S]*?return;[\s\S]*?let replayedInitialData = false;[\s\S]*?pendingDataQueue\.length > 0[\s\S]*?window\.ytInitialData = processed;[\s\S]*?window\.ytInitialPlayerResponse = processed;/);
  assert.match(seed, /sourceInitialData[\s\S]*?processWithEngine\(sourceInitialData, 'ytInitialData-reprocess'\)[\s\S]*?window\.ytInitialData = reprocessed;[\s\S]*?sourcePlayerResponse[\s\S]*?processWithEngine\(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess'\)[\s\S]*?window\.ytInitialPlayerResponse = reprocessed;/);
  assert.match(stateManager, /function broadcastSettings\(compiledSettings, profile = 'main'\) \{[\s\S]*?chrome\.runtime\?\.sendMessage\(\{[\s\S]*?action: 'FilterTube_ApplySettings'[\s\S]*?settings: compiledSettings[\s\S]*?profile: profile/);
  assert.match(stateManager, /async function requestRefresh\(profile = 'main'\) \{[\s\S]*?action: 'getCompiledSettings'[\s\S]*?profileType: profile[\s\S]*?forceRefresh: true[\s\S]*?broadcastSettings\(compiled, profile\);/);
});

test('settings refresh dirty-key matrix decisions and future authority remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-dirty-key-consumer-matrix.json',
    'docs/audit/artifacts/settings-refresh-no-op-report.json',
    'docs/audit/artifacts/settings-refresh-rollback-report.json',
    'docs/audit/artifacts/settings-refresh-dirty-key-consumer-closure.json',
    'docs/audit/artifacts/settings-refresh-dirty-key-consumer-implementation-readiness.json'
  ];

  for (const decision of [
    'approve settings refresh dirty-key authority now: NO-GO',
    'approve compiled-cache revision authority now: NO-GO',
    'approve settings no-op refresh authority now: NO-GO',
    'approve broad whitelist optimization from current settings refresh gates: NO-GO',
    'approve JSON-first promotion from current settings refresh gates: NO-GO',
    'close settings refresh dirty-key consumer documentation chain now: GO',
    'accept consumer closure as dirty-key consumer authority now: NO-GO',
    'accept consumer closure as compiled-cache revision authority now: NO-GO',
    'accept consumer closure as settings no-op refresh authority now: NO-GO',
    'accept consumer closure as seed replay budget evidence now: NO-GO',
    'accept consumer closure as DOM fallback budget evidence now: NO-GO',
    'accept consumer closure as observer/menu/quick budget evidence now: NO-GO',
    'accept consumer closure as whitelist optimization approval now: NO-GO',
    'accept consumer closure as JSON-first promotion approval now: NO-GO',
    'accept consumer closure as release/public-claim approval now: NO-GO'
  ]) {
    assert.ok(text.includes(decision), `missing decision ${decision}`);
  }

  for (const token of futureAuthorityTokens) {
    assert.ok(text.includes(token), `doc missing future authority token ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `product source unexpectedly defines ${token}`);
  }

  for (const artifactPath of artifactPaths) {
    assert.equal(exists(artifactPath), false, `unexpected committed artifact ${artifactPath}`);
  }

  assert.match(text, /This matrix is not a completion claim/);
});
