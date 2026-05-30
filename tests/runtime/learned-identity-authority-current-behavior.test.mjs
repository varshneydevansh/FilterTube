import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function keyArrayFromBlock(text, startNeedle, endNeedle) {
  return Array.from(sliceBetween(text, startNeedle, endNeedle).matchAll(/['"]([^'"\n]+)['"]/g), match => match[1]);
}

test('learned identity authority audit documents map stores flow and future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'channelMap',
    'videoChannelMap',
    'videoMetaMap',
    'resolvedCollaboratorsByVideoId',
    'harvested hint != filtering authority',
    'source endpoint or DOM selector',
    'whether the identity may affect blocklist/whitelist decisions'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  for (const file of [
    'js/background.js',
    'js/content_bridge.js',
    'js/filter_logic.js',
    'docs/json_paths_encyclopedia.md'
  ]) {
    assert.ok(doc.includes(file), `missing source ${file}`);
  }
});

test('background channelMap enqueue currently lacks UC and handle shape validation', () => {
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

test('engine video-channel mapping source validates video and channel shape more strictly than background receiver', () => {
  const filterLogic = read('js/filter_logic.js');
  const engineQueue = sliceBetween(
    filterLogic,
    'function queueVideoChannelMapping(videoId, channelId)',
    'const pendingVideoMetaUpdates'
  );
  const background = read('js/background.js');
  const backgroundQueue = sliceBetween(
    background,
    'function enqueueVideoChannelMapUpdate(videoId, channelId)',
    'function enqueueVideoMetaMapUpdate(videoId, meta)'
  );

  assert.match(engineQueue, /\!\/\^\[a-zA-Z0-9_-\]\{11\}\$\/\.test\(videoId\)/);
  assert.match(engineQueue, /!channelId\.startsWith\('UC'\)/);

  assert.match(backgroundQueue, /const v = typeof videoId === 'string' \? videoId\.trim\(\) : '';/);
  assert.match(backgroundQueue, /const c = typeof channelId === 'string' \? channelId\.trim\(\) : '';/);
  assert.doesNotMatch(backgroundQueue, /\[a-zA-Z0-9_-\]\{11\}|startsWith\('UC'\)/);
});

test('background compiled settings currently include pending videoChannelMap before storage flush', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    '// Pass through the video-channel map',
    'compiledSettings.videoMetaMap = items.videoMetaMap || {};'
  );

  assert.match(block, /const compiledVideoChannelMap = \{/);
  assert.match(block, /pendingVideoChannelMapUpdates\.entries\(\)/);
  assert.match(block, /compiledVideoChannelMap\[pendingVideoId\] = pendingChannelId;/);
  assert.match(block, /compiledSettings\.videoChannelMap = compiledVideoChannelMap;/);
  assert.match(block, /videoChannelMapCache = \{ \.\.\.compiledVideoChannelMap \};/);
});

test('background storage invalidation currently omits learned map keys', () => {
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

test('content bridge video map handler persists before DOM ownership stamping checks', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
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

test('content bridge custom URL map writes channelMap directly instead of background enqueue path', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    "type === 'FilterTube_UpdateCustomUrlMap'",
    "type === 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]/);
  assert.match(block, /channelMap\[payload\.customUrl\] = payload\.id;/);
  assert.match(block, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.doesNotMatch(block, /runtime\.sendMessage|updateChannelMap|persistChannelMappings/);
});

test('collaborator responses can apply by videoId without requiring pending request ownership', () => {
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

test('applyResolvedCollaborators owns cache menu refresh and forced DOM fallback rerun side effects', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function applyResolvedCollaborators(videoId, collaborators, options = {})',
    'function applyCollaboratorsByVideoId'
  );

  assert.match(block, /resolvedCollaboratorsByVideoId\.set\(videoId, sanitized\)/);
  assert.match(block, /refreshActiveCollaborationMenu\(videoId, sanitized/);
  assert.match(block, /refreshOpenPlaylistFallbackPopoverForVideo\(videoId\)/);
  assert.match(block, /setTimeout\(\(\) => \{[\s\S]*applyDOMFallback\(null, \{ preserveScroll: true, forceReprocess: true \}\)/);
});

test('channel matching currently depends on channelMap cross matches and name fallback', () => {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function channelMatchesFilter(meta, filterChannel, channelMap = {})',
    '// DOM manipulation helpers'
  );

  assert.match(block, /if \(filterName && metaName && filterName === metaName\)/);
  assert.match(block, /const mappedHandle = channelMap\[filterId\]/);
  assert.match(block, /const mappedId = channelMap\[handle\]/);
  assert.match(block, /const mappedId = channelMap\[normalized\]/);
  assert.match(block, /const mappedHandle = channelMap\[normalized\]/);
});

test('filter logic avatar-stack collaborator extraction remains a high-risk learned identity source', () => {
  const source = read('js/filter_logic.js');
  const block = sliceBetween(
    source,
    '_extractChannelInfo(item, rules) {',
    '// PRIORITY: Check for collaboration video'
  );
  const encyclopedia = read('docs/json_paths_encyclopedia.md');

  assert.match(block, /avatarStackViewModel/);
  assert.match(block, /if \(Array\.isArray\(avatarStackCollaborators\) && avatarStackCollaborators\.length > 1\) \{\s*return avatarStackCollaborators;/);
  assert.match(encyclopedia, /radioRenderer` and `compactRadioRenderer` are Mix\/Radio playlist renderers, not collaborator renderers/);
});
