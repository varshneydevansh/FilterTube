import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_CACHE_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function sourceLineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function blockStats(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text)
  };
}

const sources = {
  background: read('js/background.js'),
  contentBridge: read('js/content_bridge.js'),
  bridgeSettings: read('js/content/bridge_settings.js'),
  stateManager: read('js/state_manager.js'),
  filterLogic: read('js/filter_logic.js')
};

function blocks() {
  return {
    backgroundMapCacheCluster: sliceBetween(
      sources.background,
      'function ensureChannelMapCache() {',
      '/**\n * Lazy-loads the curated release_notes.json'
    ),
    backgroundMapMessageReceiver: sliceBetween(
      sources.background,
      '} else if (request.action === "updateChannelMap") {',
      '} else if (request.action === "recordTimeSaved") {'
    ),
    contentBridgeMapPersistenceHelpers: sliceBetween(
      sources.contentBridge,
      'function persistVideoChannelMapping(videoId, channelId) {',
      'function touchDomForVideoMetaUpdate(videoId) {'
    ),
    contentBridgeMainWorldMapReceiver: sliceBetween(
      sources.contentBridge,
      'function handleMainWorldMessages(event) {',
      "} else if (type === 'FilterTube_CollaboratorInfoResponse')"
    ),
    bridgeSettingsMapStorageChange: sliceBetween(
      sources.bridgeSettings,
      '    const changedKeys = Object.keys(changes || {});',
      'try {\n    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);'
    ),
    stateManagerPersistChannelMap: sliceBetween(
      sources.stateManager,
      '    async function persistChannelMap(channelId, channelHandle) {',
      '    // ============================================================================\n    // CHECKBOX SETTINGS'
    ),
    filterLogicMapProducerCluster: sliceBetween(
      sources.filterLogic,
      'function queueVideoChannelMapping(videoId, channelId) {',
      '    // ============================================================================\n    // UTILITY FUNCTIONS'
    )
  };
}

test('learned identity map cache persistence audit document records current boundary and fixtures', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Status: current-behavior proof slice. This is not an implementation patch.',
    '5 learned identity map cache persistence source files',
    'source/effect blocks: 7',
    'filter_logic_producers_validate_and_batch_before_map_page_messages',
    'background_map_cache_cluster_uses_three_debounced_flush_timers_without_revision_report',
    'background_map_message_receiver_accepts_updates_without_sender_policy_or_profile_gate',
    'content_bridge_map_helpers_patch_local_settings_before_background_persistence',
    'content_bridge_page_message_receivers_can_stamp_dom_rerun_fallback_and_bypass_background_cache',
    'bridge_settings_and_state_manager_map_storage_paths_have_asymmetric_refresh_behavior',
    'Map producers, content helpers, page-message receivers, background queues, storage flush timers, compiled cache patching, and map-only refresh behavior do not share one cache persistence report.',
    'Runtime behavior changed only for duplicate learned-map page-message rows and'
  ]) {
    assert.ok(doc.includes(marker), `missing marker: ${marker}`);
  }
});

test('learned identity map cache source fingerprints stay pinned', () => {
  const doc = read(auditDocPath);
  const expected = [
    ['js/background.js', 6803, 306710, '57ddc6c3e31112c30734ede78c9b37b01bd31533fc8a1d16856b13d2b295f0d7'],
    ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
    ['js/content/bridge_settings.js', 1127, 44545, 'fad07aba48391021d5e42096b34f32c58a6337a1a4d303a8706927c541d47f71'],
    ['js/state_manager.js', 2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
  ];

  for (const [file, lines, bytes, hash] of expected) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('learned identity map cache source/effect block metrics stay pinned in the doc', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    backgroundMapCacheCluster: ['background map cache cluster block', 264, 8987],
    backgroundMapMessageReceiver: ['background map message receiver block', 27, 1185],
    contentBridgeMapPersistenceHelpers: ['content_bridge map persistence helpers block', 92, 3966],
    contentBridgeMainWorldMapReceiver: ['content_bridge main-world map receiver block', 103, 4981],
    bridgeSettingsMapStorageChange: ['bridge_settings map storage-change block', 58, 1855],
    stateManagerPersistChannelMap: ['state_manager persistChannelMap block', 16, 468],
    filterLogicMapProducerCluster: ['filter_logic map producer cluster block', 95, 3795]
  };

  for (const [key, [label, lines, bytes]] of Object.entries(expected)) {
    assert.deepEqual(blockStats(currentBlocks[key]), { lines, bytes }, `${key} stats drifted`);
    assert.match(doc, new RegExp(`${label}: ${lines} lines, ${bytes} bytes`));
  }
});

test('selected learned identity map cache token counts stay pinned', () => {
  const doc = read(auditDocPath);
  const selected = [
    ['background pendingChannelMapUpdates tokens: 5', sources.background, 'pendingChannelMapUpdates', 5],
    ['background pendingVideoChannelMapUpdates tokens: 6', sources.background, 'pendingVideoChannelMapUpdates', 6],
    ['background pendingVideoMetaMapUpdates tokens: 5', sources.background, 'pendingVideoMetaMapUpdates', 5],
    ['background channelMapFlushTimer tokens: 4', sources.background, 'channelMapFlushTimer', 4],
    ['background videoChannelMapFlushTimer tokens: 4', sources.background, 'videoChannelMapFlushTimer', 4],
    ['background videoMetaMapFlushTimer tokens: 4', sources.background, 'videoMetaMapFlushTimer', 4],
    ['background flushChannelMapUpdates tokens: 2', sources.background, 'flushChannelMapUpdates', 2],
    ['background flushVideoChannelMapUpdates tokens: 2', sources.background, 'flushVideoChannelMapUpdates', 2],
    ['background flushVideoMetaMapUpdates tokens: 2', sources.background, 'flushVideoMetaMapUpdates', 2],
    ['background enqueueChannelMapUpdate tokens: 5', sources.background, 'enqueueChannelMapUpdate', 5],
    ['background enqueueVideoChannelMapUpdate tokens: 3', sources.background, 'enqueueVideoChannelMapUpdate', 3],
    ['background enqueueVideoMetaMapUpdate tokens: 2', sources.background, 'enqueueVideoMetaMapUpdate', 2],
    ['background compiledSettingsCache tokens: 39', sources.background, 'compiledSettingsCache', 39],
    ['background channelMap tokens: 93', sources.background, 'channelMap', 93],
    ['background videoChannelMap tokens: 46', sources.background, 'videoChannelMap', 46],
    ['background videoMetaMap tokens: 40', sources.background, 'videoMetaMap', 40],
    ['content_bridge persistVideoChannelMapping tokens: 9', sources.contentBridge, 'persistVideoChannelMapping', 9],
    ['content_bridge persistVideoMetaMapping tokens: 3', sources.contentBridge, 'persistVideoMetaMapping', 3],
    ['content_bridge scheduleVideoMetaDomRerun tokens: 3', sources.contentBridge, 'scheduleVideoMetaDomRerun', 3],
    ['content_bridge touchDomForVideoMetaUpdate tokens: 4', sources.contentBridge, 'touchDomForVideoMetaUpdate', 4],
    ['content_bridge FilterTube_UpdateChannelMap tokens: 2', sources.contentBridge, 'FilterTube_UpdateChannelMap', 2],
    ['content_bridge FilterTube_UpdateVideoChannelMap tokens: 2', sources.contentBridge, 'FilterTube_UpdateVideoChannelMap', 2],
    ['content_bridge FilterTube_UpdateVideoMetaMap tokens: 1', sources.contentBridge, 'FilterTube_UpdateVideoMetaMap', 1],
    ['content_bridge FilterTube_UpdateCustomUrlMap tokens: 1', sources.contentBridge, 'FilterTube_UpdateCustomUrlMap', 1],
    ['content_bridge applyDOMFallback tokens: 31', sources.contentBridge, 'applyDOMFallback', 31],
    ['content_bridge currentSettings.videoChannelMap tokens: 12', sources.contentBridge, 'currentSettings.videoChannelMap', 12],
    ['content_bridge currentSettings.videoMetaMap tokens: 10', sources.contentBridge, 'currentSettings.videoMetaMap', 10],
    ['bridge_settings channelMap tokens: 2', sources.bridgeSettings, 'channelMap', 2],
    ['bridge_settings videoChannelMap tokens: 2', sources.bridgeSettings, 'videoChannelMap', 2],
    ['bridge_settings videoMetaMap tokens: 2', sources.bridgeSettings, 'videoMetaMap', 2],
    ['bridge_settings forceReprocess tokens: 8', sources.bridgeSettings, 'forceReprocess', 8],
    ['state_manager persistChannelMap tokens: 1', sources.stateManager, 'persistChannelMap', 1],
    ['state_manager state.channelMap tokens: 6', sources.stateManager, 'state.channelMap', 6],
    ['filter_logic FilterTube_UpdateVideoChannelMap tokens: 1', sources.filterLogic, 'FilterTube_UpdateVideoChannelMap', 1],
    ['filter_logic FilterTube_UpdateVideoMetaMap tokens: 1', sources.filterLogic, 'FilterTube_UpdateVideoMetaMap', 1],
    ['filter_logic FilterTube_UpdateChannelMap tokens: 1', sources.filterLogic, 'FilterTube_UpdateChannelMap', 1],
    ['filter_logic FilterTube_UpdateCustomUrlMap tokens: 1', sources.filterLogic, 'FilterTube_UpdateCustomUrlMap', 1],
    ['filter_logic source filter_logic tokens: 6', sources.filterLogic, "source: 'filter_logic'", 6],
    ['filter_logic pendingVideoChannelUpdates tokens: 5', sources.filterLogic, 'pendingVideoChannelUpdates', 5],
    ['filter_logic pendingVideoMetaUpdates tokens: 5', sources.filterLogic, 'pendingVideoMetaUpdates', 5]
  ];

  for (const [docLine, source, token, expected] of selected) {
    assert.equal(countLiteral(source, token), expected, `${token} count drifted`);
    assert.match(doc, new RegExp(docLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('filter_logic producers validate and batch before map page messages', () => {
  const block = blocks().filterLogicMapProducerCluster;

  assert.ok(block.includes("!/^[a-zA-Z0-9_-]{11}$/.test(videoId)"));
  assert.match(block, /!channelId\.startsWith\('UC'\)/);
  assert.match(block, /seenVideoChannelUpdates\.has\(key\)/);
  assert.match(block, /pendingVideoChannelFlush = setTimeout/);
  assert.match(block, /}, 50\)/);
  assert.match(block, /type: 'FilterTube_UpdateVideoChannelMap'/);
  assert.match(block, /source: 'filter_logic'/);
  assert.match(block, /const hasAny = Boolean/);
  assert.match(block, /seenVideoMetaUpdates\.has\(signature\)/);
  assert.match(block, /pendingVideoMetaFlush = setTimeout/);
  assert.match(block, /}, 75\)/);
  assert.match(block, /type: 'FilterTube_UpdateVideoMetaMap'/);
});

test('background map cache cluster uses three debounced flush timers without revision report', () => {
  const block = blocks().backgroundMapCacheCluster;

  assert.match(block, /function ensureChannelMapCache\(\)/);
  assert.match(block, /function ensureVideoChannelMapCache\(\)/);
  assert.match(block, /function ensureVideoMetaMapCache\(\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ channelMap: map \}\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ videoChannelMap: map \}\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ videoMetaMap: map \}\)/);
  assert.match(block, /channelMapFlushTimer = setTimeout/);
  assert.match(block, /}, 250\)/);
  assert.match(block, /videoChannelMapFlushTimer = setTimeout/);
  assert.match(block, /}, 50\)/);
  assert.match(block, /videoMetaMapFlushTimer = setTimeout/);
  assert.match(block, /}, 75\)/);
  assert.match(block, /enforceVideoChannelMapCap\(map\)/);
  assert.match(block, /enforceVideoMetaMapCap\(map\)/);
  assert.match(block, /compiledSettingsCache\.main\.channelMap/);
  assert.match(block, /compiledSettingsCache\.kids\.videoChannelMap/);
  assert.match(block, /compiledSettingsCache\.main\.videoMetaMap/);
  assert.doesNotMatch(block, /settingsRevision|compiledSettingsRevision|learnedIdentityMapCacheFlushReport|learnedIdentityMapCacheRevisionPolicy/);
});

test('background map message receiver accepts updates without sender policy or profile gate', () => {
  const block = blocks().backgroundMapMessageReceiver;

  assert.match(block, /request\.action === "updateChannelMap"/);
  assert.match(block, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(block, /request\.action === "updateVideoChannelMap"/);
  assert.match(block, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(block, /request\.action === "updateVideoMetaMap"/);
  assert.match(block, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|isProfileSessionAuthorized|sender\.tab|targetProfileId|currentMode|profile|learnedIdentityMapCompiledCachePatchReport/);
});

test('content bridge map helpers patch local settings before background persistence', () => {
  const block = blocks().contentBridgeMapPersistenceHelpers;

  assert.match(block, /currentSettings\.videoChannelMap = currentSettings\.videoChannelMap \|\| \{\}/);
  assert.match(block, /currentSettings\.videoChannelMap\[v\].*=== c\) return false;/);
  assert.match(block, /currentSettings\.videoChannelMap\[v\] = c/);
  assert.match(block, /videoId: v,\s*channelId: c/);
  assert.match(block, /action: 'updateVideoChannelMap'/);
  assert.match(block, /currentSettings\.videoMetaMap = currentSettings\.videoMetaMap && typeof currentSettings\.videoMetaMap === 'object'/);
  assert.match(block, /currentSettings\.videoMetaMap\[videoId\] = meta/);
  assert.match(block, /MAX_VIDEO_META_ENTRIES = 2000/);
  assert.match(block, /EVICT_COUNT = 500/);
  assert.match(block, /action: 'updateVideoMetaMap'/);
  assert.match(block, /VIDEO_META_DOM_RERUN_DEBOUNCE_MS = 550/);
  assert.match(block, /pendingVideoMetaDomRerunTimer = setTimeout/);
  assert.match(block, /applyDOMFallback\(null\)/);
  assert.doesNotMatch(block, /learnedIdentityMapCachePersistenceContract|learnedIdentityMapFixtureProvenance/);
});

test('content bridge page message receivers can stamp DOM rerun fallback and bypass background cache', () => {
  const block = blocks().contentBridgeMainWorldMapReceiver;

  assert.match(block, /event\.source !== window/);
  assert.match(block, /event\.data\.source === 'content_bridge'/);
  assert.match(block, /type === 'FilterTube_UpdateChannelMap'/);
  assert.match(block, /persistChannelMappings\(payload\)/);
  assert.match(block, /type === 'FilterTube_UpdateVideoChannelMap'/);
  assert.match(block, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.ok(block.includes('document.querySelectorAll(`[data-filtertube-video-id="${videoId}"]`)'));
  assert.match(block, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(block, /requestAnimationFrame\(\(\) => \{/);
  assert.match(block, /applyDOMFallback\(null\)/);
  assert.match(block, /type === 'FilterTube_UpdateVideoMetaMap'/);
  assert.match(block, /persistVideoMetaMapping\(updates\)/);
  assert.match(block, /touchDomForVideoMetaUpdate\(videoId\)/);
  assert.match(block, /scheduleVideoMetaDomRerun\(\)/);
  assert.match(block, /type === 'FilterTube_UpdateCustomUrlMap'/);
  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]/);
  assert.match(block, /channelMap\[payload\.customUrl\] = payload\.id/);
  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.doesNotMatch(block, /enqueueChannelMapUpdate|updateChannelMap|learnedIdentityMapDirectStorageBypassReport/);
});

test('bridge_settings and StateManager map storage paths have asymmetric refresh behavior', () => {
  const storageBlock = blocks().bridgeSettingsMapStorageChange;
  const stateBlock = blocks().stateManagerPersistChannelMap;

  assert.match(storageBlock, /changedKeys\.length === 1 && changedKeys\[0\] === 'channelMap'/);
  assert.match(storageBlock, /return/);
  assert.match(storageBlock, /isVideoChannelMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoChannelMap'/);
  assert.match(storageBlock, /isVideoMetaMapOnly = changedKeys\.length === 1 && changedKeys\[0\] === 'videoMetaMap'/);
  assert.match(storageBlock, /'channelMap'/);
  assert.match(storageBlock, /'videoChannelMap'/);
  assert.match(storageBlock, /'videoMetaMap'/);
  assert.match(storageBlock, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\)/);

  assert.match(stateBlock, /const key = channelId\.toLowerCase\(\)/);
  assert.match(stateBlock, /const value = channelHandle\.toLowerCase\(\)/);
  assert.match(stateBlock, /state\.channelMap\[key\] = value/);
  assert.match(stateBlock, /chrome\.storage\?\.local\.set\(\{ channelMap: state\.channelMap \}\)/);
  assert.doesNotMatch(stateBlock, /enqueueChannelMapUpdate|compiledSettingsCache|learnedIdentityMapStorageRefreshPolicy/);
});

test('learned identity map cache future authority symbols are absent from product runtime source', () => {
  const runtime = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/bridge_settings.js',
    'js/state_manager.js',
    'js/filter_logic.js'
  ].map(read).join('\n');

  for (const symbol of [
    'learnedIdentityMapCachePersistenceContract',
    'learnedIdentityMapCacheFlushReport',
    'learnedIdentityMapCacheRevisionPolicy',
    'learnedIdentityMapDirectStorageBypassReport',
    'learnedIdentityMapStorageRefreshPolicy',
    'learnedIdentityMapCompiledCachePatchReport',
    'learnedIdentityMapProducerReceiverParityReport',
    'learnedIdentityMapFixtureProvenance',
    'learnedIdentityMapMetricArtifact'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(symbol), `${symbol} unexpectedly exists in runtime`);
  }
});
