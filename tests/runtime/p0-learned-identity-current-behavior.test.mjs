import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_LEARNED_IDENTITY_CURRENT_BEHAVIOR_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function productSource() {
  return [
    'js/background.js',
    'js/content_bridge.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/state_manager.js',
    'js/settings_shared.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js'
  ].map(read).join('\n');
}

function keyArrayFromBlock(text, startNeedle, endNeedle) {
  return Array.from(sliceBetween(text, startNeedle, endNeedle).matchAll(/['"]([^'"\n]+)['"]/g), match => match[1]);
}

const fixtures = [
  'learned_identity_channel_map_requires_uc_handle_shape',
  'learned_identity_video_channel_map_requires_video_and_uc_shape',
  'learned_identity_engine_source_guard_is_stronger_than_background_receiver',
  'learned_identity_pending_video_map_enters_compiled_settings_before_flush',
  'learned_identity_storage_invalidation_omits_map_keys',
  'learned_identity_page_video_map_persists_before_dom_ownership',
  'learned_identity_custom_url_map_bypasses_background_authority',
  'learned_identity_video_meta_map_can_trigger_dom_rerun',
  'learned_identity_collaborator_apply_lacks_universal_pending_request_ownership',
  'learned_identity_resolved_collaborators_force_menu_and_dom_rerun',
  'learned_identity_channel_match_uses_map_and_name_fallback',
  'learned_identity_avatar_stack_collaborator_source_is_high_risk',
  'learned_identity_future_authority_token_is_absent_from_product_source'
];

test('P0 learned identity doc lists all current-behavior fixtures and blocked verdict', () => {
  const doc = read(docPath);
  const audit = read('docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md');

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing fixture in P0 doc: ${fixture}`);
  }

  for (const token of [
    'learnedIdentityAuthority',
    'P0 learned identity authority is not implementation-ready',
    'harvested hint from filtering authority',
    'mayPersist, mayAffectFiltering, mayStampDom, mayRerunDomFallback',
    'channelMap',
    'videoChannelMap',
    'videoMetaMap',
    'resolvedCollaboratorsByVideoId'
  ]) {
    assert.ok(doc.includes(token), `missing P0 doc token: ${token}`);
  }

  assert.ok(audit.includes('harvested hint != filtering authority'));
});

test('learned_identity_channel_map_requires_uc_handle_shape is not satisfied today', () => {
  const source = read('js/background.js');
  const updateBlock = sliceBetween(
    source,
    'function enqueueChannelMapUpdate(key, value)',
    'function enqueueChannelMapMappings'
  );
  const mappingsBlock = sliceBetween(
    source,
    'function enqueueChannelMapMappings(mappings = [])',
    'function ensureVideoChannelMapCache'
  );

  assert.match(updateBlock, /const k = typeof key === 'string' \? key\.trim\(\)\.toLowerCase\(\) : '';/);
  assert.match(updateBlock, /const v = typeof value === 'string' \? value\.trim\(\) : '';/);
  assert.doesNotMatch(updateBlock, /startsWith\('UC'\)|startsWith\("@"/);

  assert.match(mappingsBlock, /if \(!m \|\| !m\.id \|\| !m\.handle\) return;/);
  assert.match(mappingsBlock, /enqueueChannelMapUpdate\(keyId, m\.handle\)/);
  assert.match(mappingsBlock, /enqueueChannelMapUpdate\(keyHandle, m\.id\)/);
  assert.doesNotMatch(mappingsBlock, /UC\[|startsWith\('UC'\)|startsWith\("@"/);
});

test('learned_identity_video_channel_map_requires_video_and_uc_shape is not satisfied in background today', () => {
  const block = sliceBetween(
    read('js/background.js'),
    'function enqueueVideoChannelMapUpdate(videoId, channelId)',
    'function enqueueVideoMetaMapUpdate(videoId, meta)'
  );

  assert.match(block, /const v = typeof videoId === 'string' \? videoId\.trim\(\) : '';/);
  assert.match(block, /const c = typeof channelId === 'string' \? channelId\.trim\(\) : '';/);
  assert.match(block, /if \(!v \|\| !c\) return;/);
  assert.doesNotMatch(block, /\[a-zA-Z0-9_-\]\{11\}|startsWith\('UC'\)/);
});

test('learned_identity_engine_source_guard_is_stronger_than_background_receiver today', () => {
  const filterLogic = read('js/filter_logic.js');
  const engineQueue = sliceBetween(
    filterLogic,
    'function queueVideoChannelMapping(videoId, channelId)',
    'const pendingVideoMetaUpdates'
  );
  const backgroundQueue = sliceBetween(
    read('js/background.js'),
    'function enqueueVideoChannelMapUpdate(videoId, channelId)',
    'function enqueueVideoMetaMapUpdate(videoId, meta)'
  );

  assert.match(engineQueue, /\!\/\^\[a-zA-Z0-9_-\]\{11\}\$\/\.test\(videoId\)/);
  assert.match(engineQueue, /!channelId\.startsWith\('UC'\)/);
  assert.doesNotMatch(backgroundQueue, /\[a-zA-Z0-9_-\]\{11\}|startsWith\('UC'\)/);
});

test('learned_identity_pending_video_map_enters_compiled_settings_before_flush today', () => {
  const block = sliceBetween(
    read('js/background.js'),
    '// Pass through the video-channel map',
    'compiledSettings.videoMetaMap = items.videoMetaMap || {};'
  );

  assert.match(block, /const compiledVideoChannelMap = \{/);
  assert.match(block, /pendingVideoChannelMapUpdates\.entries\(\)/);
  assert.match(block, /compiledVideoChannelMap\[pendingVideoId\] = pendingChannelId;/);
  assert.match(block, /compiledSettings\.videoChannelMap = compiledVideoChannelMap;/);
  assert.match(block, /videoChannelMapCache = \{ \.\.\.compiledVideoChannelMap \};/);
});

test('learned_identity_storage_invalidation_omits_map_keys today', () => {
  const source = read('js/background.js');
  const listenerKeys = keyArrayFromBlock(
    source,
    'const relevantKeys = [',
    '];\n        let settingsChanged = false;'
  );

  assert.ok(!listenerKeys.includes('channelMap'), 'channelMap is currently omitted');
  assert.ok(!listenerKeys.includes('videoChannelMap'), 'videoChannelMap is currently omitted');
  assert.ok(!listenerKeys.includes('videoMetaMap'), 'videoMetaMap is currently omitted');
  assert.ok(listenerKeys.includes('contentFilters'), 'contentFilters remains a watched baseline key');
});

test('learned_identity_page_video_map_persists_before_dom_ownership today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    "type === 'FilterTube_UpdateVideoChannelMap'",
    "type === 'FilterTube_UpdateVideoMetaMap'"
  );

  const persistIndex = block.indexOf('persistVideoChannelMapping(videoId, channelId)');
  const proofIndex = block.indexOf('shouldStampCardForVideoId(card, videoId)');
  assert.ok(persistIndex !== -1, 'missing persist call');
  assert.ok(proofIndex !== -1, 'missing DOM proof call');
  assert.ok(persistIndex < proofIndex, 'current behavior persists before DOM ownership proof');
  assert.match(block, /applyDOMFallback\(null\)/);
});

test('learned_identity_custom_url_map_bypasses_background_authority today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    "type === 'FilterTube_UpdateCustomUrlMap'",
    "type === 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]/);
  assert.match(block, /channelMap\[payload\.customUrl\] = payload\.id;/);
  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.doesNotMatch(block, /runtime\.sendMessage|updateChannelMap|persistChannelMappings/);
});

test('learned_identity_video_meta_map_can_trigger_dom_rerun today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    "type === 'FilterTube_UpdateVideoMetaMap'",
    "type === 'FilterTube_UpdateCustomUrlMap'"
  );
  const touchBlock = sliceBetween(
    read('js/content_bridge.js'),
    'function touchDomForVideoMetaUpdate(videoId)',
    'const pendingWatchMetaFetches'
  );
  const rerunBlock = sliceBetween(
    read('js/content_bridge.js'),
    'function scheduleVideoMetaDomRerun()',
    'function touchDomForVideoMetaUpdate(videoId)'
  );

  assert.match(block, /persistVideoMetaMapping\(updates\)/);
  assert.match(block, /touchDomForVideoMetaUpdate\(videoId\)/);
  assert.match(block, /scheduleVideoMetaDomRerun\(\)/);
  assert.match(touchBlock, /node\.removeAttribute\('data-filtertube-duration'\)/);
  assert.match(touchBlock, /node\.removeAttribute\('data-filtertube-processed'\)/);
  assert.match(touchBlock, /node\.removeAttribute\('data-filtertube-last-processed-id'\)/);
  assert.match(rerunBlock, /applyDOMFallback\(null\)/);
});

test('learned_identity_collaborator_apply_lacks_universal_pending_request_ownership today', () => {
  const source = read('js/content_bridge.js');
  const responseBlock = sliceBetween(
    source,
    "type === 'FilterTube_CollaboratorInfoResponse'",
    "type === 'FilterTube_SubscriptionsImportProgress'"
  );
  const cacheBlock = sliceBetween(
    source,
    "type === 'FilterTube_CacheCollaboratorInfo'",
    "type === 'FilterTube_ChannelInfoResponse'"
  );
  const dialogBlock = sliceBetween(
    source,
    "type === 'FilterTube_CollabDialogData'",
    '\n    }\n}\n'
  );

  assert.match(responseBlock, /const pending = window\.pendingCollaboratorRequests\.get\(requestId\)/);
  assert.match(responseBlock, /if \(videoId && Array\.isArray\(collaborators\) && collaborators\.length > 0\)/);
  assert.match(responseBlock, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.match(cacheBlock, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.match(dialogBlock, /window\.pendingCollabCards\.has\(collabKey\)/);
  assert.match(dialogBlock, /if \(videoId\) \{/);
  assert.match(dialogBlock, /applyResolvedCollaborators\(videoId, sanitized/);
});

test('learned_identity_resolved_collaborators_force_menu_and_dom_rerun today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    'function applyResolvedCollaborators(videoId, collaborators, options = {})',
    'function applyCollaboratorsByVideoId'
  );

  assert.match(block, /resolvedCollaboratorsByVideoId\.set\(videoId, sanitized\)/);
  assert.match(block, /refreshActiveCollaborationMenu\(videoId, sanitized/);
  assert.match(block, /refreshOpenPlaylistFallbackPopoverForVideo\(videoId\)/);
  assert.match(block, /setTimeout\(\(\) => \{[\s\S]*applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\)/);
});

test('learned_identity_channel_match_uses_map_and_name_fallback today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    'function channelMatchesFilter(meta, filterChannel, channelMap = {})',
    '// DOM manipulation helpers'
  );

  assert.match(block, /if \(filterName && metaName && filterName === metaName\)/);
  assert.match(block, /const mappedHandle = channelMap\[filterId\]/);
  assert.match(block, /const mappedId = channelMap\[handle\]/);
  assert.match(block, /const mappedId = channelMap\[normalized\]/);
  assert.match(block, /const mappedHandle = channelMap\[normalized\]/);
});

test('learned_identity_avatar_stack_collaborator_source_is_high_risk today', () => {
  const block = sliceBetween(
    read('js/filter_logic.js'),
    '_extractChannelInfo(item, rules) {',
    '// PRIORITY: Check for collaboration video'
  );
  const encyclopedia = read('docs/json_paths_encyclopedia.md');

  assert.match(block, /avatarStackViewModel/);
  assert.match(block, /if \(Array\.isArray\(avatarStackCollaborators\) && avatarStackCollaborators\.length > 1\) \{\s*return avatarStackCollaborators;/);
  assert.match(encyclopedia, /radioRenderer` and `compactRadioRenderer` are Mix\/Radio playlist renderers, not collaborator renderers/);
});

test('learned_identity_future_authority_token_is_absent_from_product_source today', () => {
  assert.doesNotMatch(productSource(), /learnedIdentityAuthority/);
});
