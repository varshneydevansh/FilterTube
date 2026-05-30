import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_CONSUMER_JOIN_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md';

const sourceDocs = [
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_PRODUCER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_DIRTY_KEY_CONSUMER_MATRIX_CURRENT_BEHAVIOR_2026-05-29.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_KEY_PARITY_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SETTINGS_REFRESH_CROSS_CONTEXT_CONSUMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md'
];

const rows = [
  'FT-SRDJ-00-scope',
  'FT-SRDJ-01-shared-save-applysettings',
  'FT-SRDJ-02-direct-profile-save-requestrefresh',
  'FT-SRDJ-03-background-set-list-mode-refreshnow',
  'FT-SRDJ-04-background-batch-whitelist-import-refreshnow',
  'FT-SRDJ-05-single-channel-rule-mutation-storage-listener',
  'FT-SRDJ-06-filter-all-toggle-storage-listener',
  'FT-SRDJ-07-channel-map-only-producer-consumer',
  'FT-SRDJ-08-video-channel-map-only-producer-consumer',
  'FT-SRDJ-09-video-meta-map-only-producer-consumer',
  'FT-SRDJ-10-content-bridge-custom-url-map',
  'FT-SRDJ-11-import-sync-profile-write',
  'FT-SRDJ-12-seed-json-active-vs-no-work',
  'FT-SRDJ-13-observer-menu-quick-work-budget'
];

const producerRows = [
  'FT-SRDP-00-scope',
  'FT-SRDP-01-shared-save-settings',
  'FT-SRDP-02-state-manager-save-broadcast',
  'FT-SRDP-03-state-manager-direct-main-profile',
  'FT-SRDP-04-state-manager-direct-kids-profile',
  'FT-SRDP-05-background-set-list-mode',
  'FT-SRDP-06-background-batch-whitelist-import',
  'FT-SRDP-07-background-add-channel-helper',
  'FT-SRDP-08-background-filter-all-toggle',
  'FT-SRDP-09-background-channel-map-queue',
  'FT-SRDP-10-background-video-channel-map-queue',
  'FT-SRDP-11-background-video-meta-map-queue',
  'FT-SRDP-12-content-bridge-custom-url-map',
  'FT-SRDP-13-import-sync-profile-write'
];

const consumerRows = [
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

const closureRows = [
  'FT-SRDJ-CLOSURE-00-scope',
  'FT-SRDJ-CLOSURE-01-shared-save-applysettings',
  'FT-SRDJ-CLOSURE-02-direct-profile-save-requestrefresh',
  'FT-SRDJ-CLOSURE-03-background-set-list-mode-refreshnow',
  'FT-SRDJ-CLOSURE-04-background-batch-whitelist-import-refreshnow',
  'FT-SRDJ-CLOSURE-05-single-channel-rule-mutation-storage-listener',
  'FT-SRDJ-CLOSURE-06-filter-all-toggle-storage-listener',
  'FT-SRDJ-CLOSURE-07-channel-map-only-producer-consumer',
  'FT-SRDJ-CLOSURE-08-video-channel-map-only-producer-consumer',
  'FT-SRDJ-CLOSURE-09-video-meta-map-only-producer-consumer',
  'FT-SRDJ-CLOSURE-10-content-bridge-custom-url-map',
  'FT-SRDJ-CLOSURE-11-import-sync-profile-write',
  'FT-SRDJ-CLOSURE-12-seed-json-active-vs-no-work',
  'FT-SRDJ-CLOSURE-13-observer-menu-quick-work-budget'
];

const futureAuthorityTokens = [
  'settingsRefreshDirtyKeyProducerConsumerJoinMatrix',
  'settingsRefreshProducerConsumerDecisionReport',
  'settingsRefreshWriteConsumerRevision',
  'settingsRefreshJsonDomConsumerBudget',
  'settingsRefreshSeedJoinBudget',
  'settingsRefreshObserverJoinBudget',
  'settingsRefreshMenuQuickJoinBudget',
  'settingsRefreshMapOnlyJoinReport',
  'settingsRefreshImportSyncJoinReport',
  'settingsRefreshProducerConsumerRollbackReport',
  'settingsRefreshProducerConsumerChainClosure',
  'settingsRefreshProducerConsumerChainRuntimeApproval',
  'settingsRefreshProducerConsumerImplementationReadiness'
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

test('settings refresh producer-consumer join matrix is audit-only and source-backed', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior settings refresh dirty-key producer-consumer\s+join matrix/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /settings refresh producer-consumer join matrix rows: 14/);
  assert.match(text, /settings refresh producer families joined: 8/);
  assert.match(text, /settings refresh consumer work families joined: 7/);
  assert.match(text, /join refresh\/broadcast shapes covered: 5/);
  assert.match(text, /runtime producer-consumer join authority approvals: 0/);
  assert.match(text, /settings refresh producer-consumer join matrix approval: NO-GO/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /settings refresh producer-consumer chain closure rows: 14/);
  assert.match(text, /producer rows linked by closure: 14/);
  assert.match(text, /consumer rows linked by closure: 13/);
  assert.match(text, /join rows linked by closure: 14/);
  assert.match(text, /committed producer-consumer join artifacts: 0/);
  assert.match(text, /runtime producer-consumer chain approvals: 0/);
  assert.match(text, /settings refresh producer-consumer chain closure: CHAIN-CLOSED/);
  assert.match(text, /settings refresh producer-consumer implementation readiness from closure: NO-GO/);

  for (const sourceDoc of sourceDocs) {
    assert.ok(exists(sourceDoc), `missing source doc ${sourceDoc}`);
    assert.ok(text.includes(sourceDoc), `join matrix doc does not cite ${sourceDoc}`);
  }
});

test('settings refresh producer-consumer join rows and diagrams stay explicit', () => {
  const text = doc();
  const foundRows = [...text.matchAll(/^\| `(FT-SRDJ-(?!CLOSURE)[^`]+)` \|/gm)].map(match => match[1]);
  const foundClosureRows = [...text.matchAll(/^\| `(FT-SRDJ-CLOSURE-[^`]+)` \|/gm)].map(match => match[1]);

  assert.deepEqual(foundRows, rows);
  assert.deepEqual(foundClosureRows, closureRows);
  for (const row of rows) {
    const references = [...text.matchAll(new RegExp(`\\b${row}\\b`, 'g'))].length;
    assert.ok(references >= 2, `join row ${row} is not linked from closure`);
  }
  for (const row of producerRows) {
    assert.ok(text.includes(row), `missing producer row closure link ${row}`);
  }
  for (const row of consumerRows) {
    assert.ok(text.includes(row), `missing consumer row closure link ${row}`);
  }
  assert.match(text, /ASCII flow:/);
  assert.match(text, /producer writes storage or broadcasts settings/);
  assert.match(text, /no shared producer-consumer decision report ties writer/);
  assert.match(text, /```mermaid\nflowchart TD/);
  assert.match(text, /No shared producer-consumer decision report/);
});

test('UI, direct profile, mode, import, and rule writes remain joined through forced refresh paths', () => {
  const background = read('js/background.js');
  const stateManager = read('js/state_manager.js');
  const shared = read('js/settings_shared.js');
  const bridge = read('js/content/bridge_settings.js');

  assert.match(shared, /function saveSettings\(options = \{\}\) \{[\s\S]*?const payload = \{[\s\S]*?enabled: compiledSettings\.enabled,[\s\S]*?uiKeywords: sanitizedKeywords,[\s\S]*?filterKeywords: compiledSettings\.filterKeywords,[\s\S]*?payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4;[\s\S]*?STORAGE_NAMESPACE\?\.set\(payload/);
  assert.match(stateManager, /async function saveSettings\(\{ broadcast = true, profile = 'main' \} = \{\}\) \{[\s\S]*?const result = await SettingsAPI\.saveSettings\([\s\S]*?if \(broadcast && result\.compiledSettings\) \{[\s\S]*?broadcastSettings\(result\.compiledSettings, profile\);/);
  assert.match(stateManager, /async function persistMainProfiles\(nextMain\) \{[\s\S]*?await io\.saveProfilesV3\(merged\);[\s\S]*?await io\.saveProfilesV4\(nextProfiles\);/);
  assert.match(stateManager, /async function persistKidsProfiles\(nextKids\) \{[\s\S]*?await io\.saveProfilesV3\(merged\);[\s\S]*?await io\.saveProfilesV4\(nextProfiles\);/);
  assert.match(stateManager, /async function requestRefresh\(profile = 'main'\) \{[\s\S]*?action: 'getCompiledSettings'[\s\S]*?forceRefresh: true[\s\S]*?broadcastSettings\(compiled, profile\);/);

  assert.match(background, /request\.action === "FilterTube_ApplySettings" && request\.settings[\s\S]*?compiledSettingsCache\[targetProfile\] = null;[\s\S]*?getCompiledSettings\(syntheticSender, targetProfile, true\)[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\);/);
  assert.match(background, /if \(requestedMode === 'whitelist' && requestedProfile === 'main'\) \{[\s\S]*?writePayload\.filterChannels = \[\];[\s\S]*?writePayload\.uiKeywords = \[\];[\s\S]*?writePayload\.filterKeywordsComments = \[\];[\s\S]*?await browserAPI\.storage\.local\.set\(writePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\);/);
  assert.match(background, /action === 'FilterTube_BatchImportWhitelistChannels'[\s\S]*?writePayload\.channelMap = nextChannelMap;[\s\S]*?await browserAPI\.storage\.local\.set\(writePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\);/);
  assert.match(background, /async function handleAddFilteredChannel\([\s\S]*?storageWritePayload\.filterChannels = channels;[\s\S]*?storageWritePayload\.uiChannels = safeArray\(channels\)[\s\S]*?await browserAPI\.storage\.local\.set\(storageWritePayload\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?compiledSettingsCache\.kids = null;/);
  assert.match(background, /async function handleToggleChannelFilterAll\(channelId, value\) \{[\s\S]*?const payload = \{ filterChannels: channels \};[\s\S]*?payload\[FT_PROFILES_V4_KEY\] = nextProfilesV4;[\s\S]*?browserAPI\.storage\.local\.set\(payload, resolve\);[\s\S]*?compiledSettingsCache\.main = null;[\s\S]*?compiledSettingsCache\.kids = null;/);

  assert.match(bridge, /request\.action === 'FilterTube_RefreshNow'[\s\S]*?requestSettingsFromBackground\(\)\.then\(result => \{[\s\S]*?applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\);/);
  assert.match(bridge, /request\.action === 'FilterTube_ApplySettings' && request\.settings[\s\S]*?sendSettingsToMainWorld\(normalized\);[\s\S]*?applyDOMFallback\(normalized, \{ forceReprocess: true \}\);/);
});

test('map producers remain joined to map-only or targeted consumer behavior', () => {
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const bridge = read('js/content_bridge.js');
  const stateManager = read('js/state_manager.js');

  assert.match(background, /function enqueueChannelMapUpdate\(key, value\) \{[\s\S]*?pendingChannelMapUpdates\.set\(k, v\);[\s\S]*?compiledSettingsCache\.main\.channelMap = channelMapCache \|\| compiledSettingsCache\.main\.channelMap;[\s\S]*?scheduleChannelMapFlush\(\);/);
  assert.match(background, /function scheduleChannelMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushChannelMapUpdates\(\);[\s\S]*?\}, 250\);/);
  assert.match(background, /function enqueueVideoChannelMapUpdate\(videoId, channelId\) \{[\s\S]*?pendingVideoChannelMapUpdates\.set\(v, c\);[\s\S]*?compiledSettingsCache\.main\.videoChannelMap = \{[\s\S]*?scheduleVideoChannelMapFlush\(\);/);
  assert.match(background, /function scheduleVideoChannelMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushVideoChannelMapUpdates\(\);[\s\S]*?\}, 50\);/);
  assert.match(background, /function enqueueVideoMetaMapUpdate\(videoId, meta\) \{[\s\S]*?const clean = \{[\s\S]*?lengthSeconds:[\s\S]*?publishDate:[\s\S]*?uploadDate:[\s\S]*?category:[\s\S]*?pendingVideoMetaMapUpdates\.set\(v, clean\);[\s\S]*?scheduleVideoMetaMapFlush\(\);/);
  assert.match(background, /function scheduleVideoMetaMapFlush\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?flushVideoMetaMapUpdates\(\);[\s\S]*?\}, 75\);/);

  assert.match(bridgeSettings, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{[\s\S]*?return;[\s\S]*?const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap';[\s\S]*?const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap';/);
  assert.match(bridgeSettings, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\);/);
  assert.match(stateManager, /if \(changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'\) \{[\s\S]*?return;[\s\S]*?const storageKeys = \[[\s\S]*?'videoMetaMap'|const storageKeys = \[[\s\S]*?'channelMap'/);
  assert.match(bridge, /type === 'FilterTube_UpdateCustomUrlMap'[\s\S]*?browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\][\s\S]*?channelMap\[payload\.customUrl\] = payload\.id;[\s\S]*?browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.match(bridge, /function persistVideoChannelMapping\(videoId, channelId\) \{[\s\S]*?currentSettings\.videoChannelMap\[v\] = c;[\s\S]*?browserAPI_BRIDGE\.runtime\.sendMessage\(\{ action: 'updateVideoChannelMap', videoId: v, channelId: c \}\)/);
  assert.match(bridge, /function persistVideoMetaMapping\(entries = \[\]\) \{[\s\S]*?currentSettings\.videoMetaMap\[videoId\] = meta;[\s\S]*?browserAPI_BRIDGE\.runtime\.sendMessage\(\{[\s\S]*?action: 'updateVideoMetaMap'[\s\S]*?entries: cleaned[\s\S]*?\}\); return cleaned\.map\(entry => entry\.videoId\);/);
  assert.match(bridge, /function scheduleVideoMetaDomRerun\(\) \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?applyDOMFallback\(null\);[\s\S]*?\}, VIDEO_META_DOM_RERUN_DEBOUNCE_MS\);/);
});

test('main-world delivery, seed replay, and observer refresh remain joined without a per-key budget', () => {
  const bridge = read('js/content/bridge_settings.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');

  assert.match(bridge, /function sendSettingsToMainWorld\(settings\) \{[\s\S]*?window\.postMessage\(\{[\s\S]*?type: 'FilterTube_SettingsToInjector'[\s\S]*?tryApplySettingsToSeed\(settings\)[\s\S]*?pendingSeedSettings = settings;[\s\S]*?scheduleSeedRetry\(\);[\s\S]*?refreshRuntimeObserversAfterSettingsUpdate\(\);/);
  assert.match(bridge, /function refreshRuntimeObserversAfterSettingsUpdate\(\) \{[\s\S]*?refreshFilterTubeRuntimeObservers\(\)[\s\S]*?FilterTube_refreshRuntimeObservers[\s\S]*?FilterTube_refreshQuickBlockAvailability[\s\S]*?FilterTube_refreshDOMFallbackObserver[\s\S]*?schedulePrefetchScan\(\)/);
  assert.match(seed, /function updateSettings\(newSettings\) \{[\s\S]*?cachedSettings = newSettings;[\s\S]*?if \(!hasNetworkJsonWork\(cachedSettings\)\) \{[\s\S]*?pendingDataQueue = \[\];[\s\S]*?rawYtInitialData = null;[\s\S]*?rawYtInitialPlayerResponse = null;[\s\S]*?return;[\s\S]*?let replayedInitialData = false;[\s\S]*?pendingDataQueue\.length > 0[\s\S]*?window\.ytInitialData = processed;/);
  assert.match(seed, /sourceInitialData[\s\S]*?processWithEngine\(sourceInitialData, 'ytInitialData-reprocess'\)[\s\S]*?window\.ytInitialData = reprocessed;[\s\S]*?sourcePlayerResponse[\s\S]*?processWithEngine\(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess'\)[\s\S]*?window\.ytInitialPlayerResponse = reprocessed;/);
  assert.match(injector, /window\.filterTube\.updateSettings\(currentSettings\)/);
});

test('import and sync producers remain joined through profile writes without rollback reports', () => {
  const ioManager = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const stateManager = read('js/state_manager.js');

  assert.match(ioManager, /async function saveProfilesV4\(nextProfiles\) \{[\s\S]*?return writeStorage\(\{ \[FT_PROFILES_V4_KEY\]: nextProfiles \}\);/);
  assert.match(ioManager, /const result = shouldImportIntoSeparateProfile[\s\S]*?await SettingsAPI\.saveSettings\(payload\);[\s\S]*?await saveProfilesV3\(nextProfiles\);[\s\S]*?await saveProfilesV4\(\{[\s\S]*?activeProfileId: writeActiveId,[\s\S]*?profiles[\s\S]*?\}\);[\s\S]*?await writeStorage\(\{ channelMap: nextChannelMap \}\);/);
  assert.match(nanah, /async function applyScopedPortablePayload\(io, portable[\s\S]*?if \(typeof io\.loadProfilesV4 !== 'function' \|\| typeof io\.saveProfilesV4 !== 'function'\)[\s\S]*?profiles\[resolvedTargetProfileId\] = \{[\s\S]*?await io\.saveProfilesV4\(\{[\s\S]*?\.\.\.profilesV4,[\s\S]*?profiles[\s\S]*?\}\);/);
  assert.match(bridgeSettings, /const relevantKeys = \[[\s\S]*?'ftProfilesV4'[\s\S]*?'channelMap'[\s\S]*?'videoChannelMap'[\s\S]*?'videoMetaMap'[\s\S]*?\];[\s\S]*?scheduleSettingsRefreshFromStorage/);
  assert.match(stateManager, /const storageKeys = \[[\s\S]*?'ftProfilesV3'[\s\S]*?'ftProfilesV4'[\s\S]*?\];[\s\S]*?scheduleExternalReload\(\);/);
});

test('settings refresh producer-consumer join decisions and future authority remain absent', () => {
  const text = doc();
  const source = productSource();
  const artifactPaths = [
    'docs/audit/artifacts/settings-refresh-producer-consumer-join-matrix.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-decision-report.json',
    'docs/audit/artifacts/settings-refresh-write-consumer-revision.json',
    'docs/audit/artifacts/settings-refresh-json-dom-consumer-budget.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-rollback-report.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-chain-closure.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-chain-runtime-approval.json',
    'docs/audit/artifacts/settings-refresh-producer-consumer-implementation-readiness.json'
  ];

  for (const decision of [
    'approve settings refresh producer-consumer join authority now: NO-GO',
    'approve settings refresh write-consumer revision now: NO-GO',
    'approve JSON/DOM consumer work budget now: NO-GO',
    'approve seed replay budget from current joins now: NO-GO',
    'approve observer/menu/quick-block work budget now: NO-GO',
    'approve broad whitelist optimization from current joins: NO-GO',
    'approve JSON-first promotion from current joins: NO-GO',
    'close settings refresh producer-consumer chain documentation now: GO',
    'accept chain closure as producer-consumer join authority now: NO-GO',
    'accept chain closure as write-consumer revision evidence now: NO-GO',
    'accept chain closure as JSON/DOM work-budget evidence now: NO-GO',
    'accept chain closure as seed replay budget evidence now: NO-GO',
    'accept chain closure as observer/menu/quick budget evidence now: NO-GO',
    'accept chain closure as whitelist optimization approval now: NO-GO',
    'accept chain closure as JSON-first promotion approval now: NO-GO',
    'accept chain closure as release/public-claim approval now: NO-GO'
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
