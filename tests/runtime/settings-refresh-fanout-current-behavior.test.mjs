import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SETTINGS_REFRESH_FANOUT_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function assertSettingsRuntimeRefreshAuthoritySnapshot(doc) {
  const settingsShared = read('js/settings_shared.js');
  const stateManager = read('js/state_manager.js');
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');

  assert.match(doc, /Settings Runtime Refresh Authority Snapshot - 2026-05-27/);
  assert.match(doc, /release-lag refresh repair/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /UI\/shared save or background mutation/);
  assert.match(doc, /Background compiledSettingsCache invalidation/);
  assert.match(doc, /applyDOMFallback\(forceReprocess decision\)/);
  assert.match(doc, /No single revision\/no-op consumer report yet/);
  assert.match(doc, /settings\/runtime refresh authority approval: NO-GO/);
  assert.match(doc, /compiled-cache revision authority approval: NO-GO/);
  assert.match(doc, /storage-key consumer matrix approval: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /preserving\s+`forceReprocess`/);
  assert.match(doc, /do not\s+share one revisioned report/);

  for (const row of [
    '| Shared load and V4 migration | `js/settings_shared.js:564-738` |',
    '| Shared save and alias mirroring | `js/settings_shared.js:742-954` |',
    '| StateManager refresh request | `js/state_manager.js:1231-1258` |',
    '| Background compiled cache | `js/background.js:1288`, `js/background.js:1774-1781`, `js/background.js:3244-3261` |',
    '| Background apply-settings branch | `js/background.js:4395-4422` |',
    '| Background storage invalidation | `js/background.js:4484-4523` |',
    '| Bridge runtime apply/refresh | `js/content/bridge_settings.js:198-315` |',
    '| Bridge settings pull and main-world delivery | `js/content/bridge_settings.js:353-517` |',
    '| Bridge storage coalescing | `js/content/bridge_settings.js:519-651` |'
  ]) {
    assert.ok(doc.includes(row), `missing snapshot row ${row}`);
  }

  assert.match(settingsShared, /function loadSettings\(\)/);
  assert.match(settingsShared, /STORAGE_NAMESPACE\?\.get\(\[\.\.\.SETTINGS_KEYS, THEME_KEY, AUTO_BACKUP_KEY, FT_PROFILES_V3_KEY, FT_PROFILES_V4_KEY\]/);
  assert.match(settingsShared, /function saveSettings\(options = \{\}\)/);
  assert.match(settingsShared, /nextMainProfile\.blockedKeywords = sanitizedKeywords/);
  assert.match(stateManager, /async function requestRefresh\(profile = 'main'\)/);
  assert.match(stateManager, /action: 'getCompiledSettings'/);
  assert.match(stateManager, /forceRefresh: true/);
  assert.match(background, /let compiledSettingsCache = \{ main: null, kids: null \}/);
  assert.match(background, /if \(!forceRefresh && compiledSettingsCache\[targetProfile\]\)/);
  assert.match(background, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(background, /compiledSettingsCache\.main = null/);
  assert.match(background, /compiledSettingsCache\.kids = null/);
  assert.match(bridgeSettings, /pendingStorageRefreshForceReprocess = pendingStorageRefreshForceReprocess \|\| shouldForceReprocess/);
  assert.match(bridgeSettings, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\)/);

  const productSource = [settingsShared, stateManager, background, bridgeSettings].join('\n');
  assert.doesNotMatch(productSource, /settingsRuntimeRefreshAuthorityReport|compiledCacheRevisionAuthority|storageKeyConsumerMatrix/);
}

test('settings_refresh_doc_lists_fanout_entries', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /settingsRefreshFanoutAuthority/);

  for (const fixture of [
    'settings_refreshnow_forces_background_pull_and_dom_reprocess',
    'settings_applysettings_has_push_pull_and_dom_paths',
    'settings_request_pull_also_delivers_to_main_world',
    'settings_send_to_main_world_has_seed_retry_loop',
    'settings_storage_change_refresh_has_key_policy_but_no_revision_authority',
    'settings_page_refresh_message_uses_same_forced_dom_hammer',
    'settings_initialize_dom_fallback_links_startup_to_menu_and_mutation_work',
    'settings_background_mutations_broadcast_refreshnow_without_change_payload'
  ]) {
    assert.ok(doc.includes(fixture), `missing fixture ${fixture}`);
  }

  assertSettingsRuntimeRefreshAuthoritySnapshot(doc);
});

test('settings_refreshnow_forces_background_pull_and_dom_reprocess', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    bridgeSettings,
    "request.action === 'FilterTube_RefreshNow'",
    "} else if (request.action === 'FilterTube_ImportSubscribedChannels')"
  );

  assert.match(block, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(block, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.doesNotMatch(block, /settingsRevision|settingsRefreshFanoutAuthority|activeRuleChanged|domFallbackRequired/);
});

test('settings_applysettings_has_push_pull_and_dom_paths', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    bridgeSettings,
    "request.action === 'FilterTube_ApplySettings' && request.settings",
    '    });\n}'
  );

  assert.match(block, /incomingProfile && incomingProfile !== expectedProfile/);
  assert.match(block, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(block, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.match(block, /const normalized = normalizeSettingsForHost\(request\.settings\)/);
  assert.match(block, /sendSettingsToMainWorld\(normalized\)/);
  assert.match(block, /applyDOMFallback\(normalized, \{ forceReprocess: true \}\)/);
});

test('settings_request_pull_also_delivers_to_main_world', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    bridgeSettings,
    'function requestSettingsFromBackground(options = {})',
    'function tryApplySettingsToSeed(settings)'
  );

  assert.match(block, /action: "getCompiledSettings", profileType, forceRefresh/);
  assert.match(block, /resolvedProfile && resolvedProfile !== profileType/);
  assert.match(block, /action: "getCompiledSettings", profileType, forceRefresh: true/);
  assert.match(block, /sendSettingsToMainWorld\(normalized\)/);
  assert.match(block, /resolve\(\{ success: true, settings: normalized \}\)/);
  assert.doesNotMatch(block, /settingsRevision|dirtyKeys|noOpReport|settingsRefreshFanoutAuthority/);
});

test('settings_send_to_main_world_has_seed_retry_loop', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const seedBlock = sliceBetween(
    bridgeSettings,
    'function tryApplySettingsToSeed(settings)',
    'function sendSettingsToMainWorld(settings)'
  );
  const sendBlock = sliceBetween(
    bridgeSettings,
    'function sendSettingsToMainWorld(settings)',
    'let pendingStorageRefreshTimer = 0;'
  );

  assert.match(seedBlock, /window\.filterTube\.updateSettings\(settings\)/);
  assert.match(seedBlock, /window\.addEventListener\('filterTubeSeedReady'/);
  assert.match(seedBlock, /setTimeout\(\(\) => \{[\s\S]*scheduleSeedRetry\(\);[\s\S]*\}, 250\)/);
  assert.match(sendBlock, /latestSettings = settings/);
  assert.match(sendBlock, /currentSettings = settings/);
  assert.match(sendBlock, /type: 'FilterTube_SettingsToInjector'/);
  assert.match(sendBlock, /window\.postMessage/);
  assert.match(sendBlock, /tryApplySettingsToSeed\(settings\)/);
});

test('settings_storage_change_refresh_has_key_policy_but_no_revision_authority', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const scheduler = sliceBetween(
    bridgeSettings,
    'function scheduleSettingsRefreshFromStorage({ forceReprocess = true } = {})',
    'function handleStorageChanges(changes, area)'
  );
  const handler = sliceBetween(
    bridgeSettings,
    'function handleStorageChanges(changes, area)',
    'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
  );

  assert.match(bridgeSettings, /const MIN_STORAGE_REFRESH_INTERVAL_MS = 250/);
  assert.match(scheduler, /requestSettingsFromBackground\(\{ forceRefresh: true \}\)/);
  assert.match(scheduler, /const shouldForceReprocess = forceReprocess === true/);
  assert.match(scheduler, /applyDOMFallback\(result\.settings, \{ forceReprocess: shouldForceReprocess \}\)/);
  assert.match(scheduler, /const forcePendingReprocess = pendingStorageRefreshForceReprocess === true/);
  assert.match(scheduler, /applyDOMFallback\(result\.settings, \{ forceReprocess: forcePendingReprocess \}\)/);
  assert.match(handler, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(handler, /const isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(handler, /const isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(handler, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\)/);
  assert.doesNotMatch(`${scheduler}\n${handler}`, /settingsRevision|settingsRefreshFanoutAuthority|noOpReport|activeRuleChanged/);
});

test('settings_page_refresh_message_uses_same_forced_dom_hammer', () => {
  const contentBridge = read('js/content_bridge.js');
  const block = sliceBetween(
    contentBridge,
    "type === 'FilterTube_InjectorToBridge_Ready'",
    "} else if (type === 'FilterTube_UpdateChannelMap')"
  );

  assert.match(block, /requestSettingsFromBackground\(\);/);
  assert.match(block, /type === 'FilterTube_Refresh'/);
  assert.match(block, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(block, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.doesNotMatch(block, /senderClass|settingsRevision|settingsRefreshFanoutAuthority/);
});

test('settings_initialize_dom_fallback_links_startup_to_menu_and_mutation_work', () => {
  const contentBridge = read('js/content_bridge.js');
  const initialize = sliceBetween(
    contentBridge,
    'async function initialize()',
    'async function initializeDOMFallback(settings)'
  );
  const fallback = sliceBetween(
    contentBridge,
    'async function initializeDOMFallback(settings)',
    'let fallbackMenuButtonsInstalled = false;'
  );

  assert.match(initialize, /await ensureMainWorldRuntimeForSettings\(response\.settings\)/);
  assert.match(initialize, /const response = await requestSettingsFromBackground\(\)/);
  assert.match(initialize, /initializeDOMFallback\(response\.settings\)/);
  assert.match(fallback, /await new Promise\(resolve => setTimeout\(resolve, 1000\)\)/);
  assert.match(fallback, /applyDOMFallback\(settings\)/);
  assert.match(fallback, /ensureFallbackMenuButtons\(\)/);
  assert.match(fallback, /const observer = new MutationObserver\(mutations =>/);
  assert.match(fallback, /applyDOMFallback\(null\)/);
  assert.match(fallback, /applyDOMFallback\(null, \{ preserveScroll: true, onlyWhitelistPending: true \}\)/);
});

test('settings_background_mutations_broadcast_refreshnow_without_change_payload', () => {
  const background = read('js/background.js');
  const interesting = [
    sliceBetween(background, 'scheduleAutoBackupInBackground(\'mode_changed\')', 'sendResponse?.({ ok: true, profileType: requestedProfile, mode: requestedMode });'),
    sliceBetween(background, 'scheduleAutoBackupInBackground(\'whitelist_subscriptions_imported\')', 'sendResponse?.({'),
    sliceBetween(background, 'scheduleAutoBackupInBackground(\'whitelist_to_blocklist_transfer\')', 'sendResponse?.({ ok: true,'),
    sliceBetween(background, '// Broadcast refresh for Kids', '} else if (didMutateChannelList) {')
  ].join('\n');

  const refreshBroadcasts = background.match(/sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_RefreshNow' \}\)/g) || [];
  assert.ok(refreshBroadcasts.length >= 4, `expected at least four refresh broadcasts, found ${refreshBroadcasts.length}`);
  assert.doesNotMatch(interesting, /changedKeys|settingsRevision|targetRuleIds|domFallbackRequired|jsonReprocessRequired/);
});
