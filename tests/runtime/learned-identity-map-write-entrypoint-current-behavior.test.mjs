import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('learned identity map write entrypoint register is audit-only and names the control plane', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /which entrypoints can currently write those maps or make them affect runtime/);
  assert.match(doc, /`channelMap`, `videoChannelMap`, and `videoMetaMap`/);
  assert.match(doc, /learnedIdentityMapWriteDecision/);
  assert.match(doc, /source class: JSON\/player \| DOM \| page message \| resolver \| import \| Nanah \| action fanout/);
});

test('learned identity map write entrypoint register lists all current write families', () => {
  const doc = read(docPath);

  for (const entry of [
    'Engine video-channel harvest',
    'Engine video-meta harvest',
    'Engine channel/custom-url harvest',
    'Card prefetch / hydration',
    'Generic video-channel persistence helper',
    'Generic video-meta persistence helper',
    'Video-meta DOM rerun helper',
    'Same-window page message receiver',
    'Same-window custom URL receiver',
    'Post-block Shorts enrichment',
    'Post-block playlist enrichment',
    'Menu/action resolved mapping broadcast',
    'Successful channel-block video mapping',
    'Content handle resolver mapping',
    'Background channelMap queue',
    'Background videoChannelMap queue',
    'Background videoMetaMap queue',
    'Background message receiver',
    'Background channel-add resolver repair'
  ]) {
    assert.ok(doc.includes(entry), `missing entrypoint ${entry}`);
  }

  for (const effectClass of [
    'passive harvest',
    'visible DOM hydration',
    'resolver repair',
    'post-action fanout',
    'metadata rerun',
    'direct storage bypass'
  ]) {
    assert.ok(doc.includes(effectClass), `missing effect class ${effectClass}`);
  }
});

test('engine producers validate and post learned map updates before bridge/background receive them', () => {
  const filter = read('js/filter_logic.js');
  const videoQueue = sliceBetween(filter, 'function queueVideoChannelMapping(videoId, channelId)', 'const pendingVideoMetaUpdates');
  const metaQueue = sliceBetween(filter, 'function queueVideoMetaMapping(videoId, meta)', '// ============================================================================');
  const channelRegister = sliceBetween(filter, '_registerMapping(id, handle) {', '_registerCustomUrlMapping(id, customUrl) {');
  const customRegister = sliceBetween(filter, '_registerCustomUrlMapping(id, customUrl) {', 'Debug logging function');

  assert.match(videoQueue, /\!\/\^\[a-zA-Z0-9_-\]\{11\}\$\/\.test\(videoId\)/);
  assert.match(videoQueue, /!channelId\.startsWith\('UC'\)/);
  assert.match(videoQueue, /type: 'FilterTube_UpdateVideoChannelMap'/);
  assert.match(videoQueue, /source: 'filter_logic'/);

  assert.match(metaQueue, /type: 'FilterTube_UpdateVideoMetaMap'/);
  assert.match(metaQueue, /source: 'filter_logic'/);
  assert.match(metaQueue, /pendingVideoMetaUpdates\.push/);

  assert.match(channelRegister, /this\.channelMap\[keyId\] = handle/);
  assert.match(channelRegister, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(customRegister, /this\.channelMap\[normalizedCustomUrl\] = id/);
  assert.match(customRegister, /type: 'FilterTube_UpdateCustomUrlMap'/);
});

test('content bridge map receivers can persist stamp and rerun DOM fallback from page messages', () => {
  const bridge = read('js/content_bridge.js');
  const handler = sliceBetween(bridge, 'function handleMainWorldMessages(event)', "} else if (type === 'FilterTube_CollaboratorInfoResponse')");
  const videoChannel = sliceBetween(handler, "type === 'FilterTube_UpdateVideoChannelMap'", "type === 'FilterTube_UpdateVideoMetaMap'");
  const videoMeta = sliceBetween(handler, "type === 'FilterTube_UpdateVideoMetaMap'", "type === 'FilterTube_UpdateCustomUrlMap'");
  const customUrl = sliceBetween(bridge, "type === 'FilterTube_UpdateCustomUrlMap'", "type === 'FilterTube_CollaboratorInfoResponse'");

  assert.match(handler, /event\.source !== window/);
  assert.match(handler, /event\.data\.source === 'content_bridge'/);
  assert.match(handler, /persistChannelMappings\(payload\)/);

  assert.match(videoChannel, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(videoChannel, /shouldStampCardForVideoId\(card, videoId\)/);
  assert.match(videoChannel, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(videoChannel, /\(didPersist \|\| didStampDom\)/);
  assert.match(videoChannel, /applyDOMFallback\(null\)/);

  assert.match(videoMeta, /persistVideoMetaMapping\(updates\)/);
  assert.match(videoMeta, /touchDomForVideoMetaUpdate\(videoId\)/);
  assert.match(videoMeta, /scheduleVideoMetaDomRerun\(\)/);

  assert.match(customUrl, /storage\.local\.get\(\['channelMap'\]/);
  assert.match(customUrl, /channelMap\[payload\.customUrl\] = payload\.id/);
  assert.match(customUrl, /storage\.local\.set\(\{ channelMap \}/);
  assert.doesNotMatch(customUrl, /runtime\.sendMessage|updateChannelMap|persistChannelMappings/);
});

test('content bridge helper and post-action paths write maps with different scopes today', () => {
  const bridge = read('js/content_bridge.js');
  const persistVideo = sliceBetween(bridge, 'function persistVideoChannelMapping(videoId, channelId)', 'function persistVideoMetaMapping(entries = [])');
  const persistMeta = sliceBetween(bridge, 'function persistVideoMetaMapping(entries = [])', 'let pendingVideoMetaDomRerunTimer = 0');
  const shortsFanout = sliceBetween(bridge, 'async function enrichVisibleShortsWithChannelInfo', 'async function fetchWatchIdentityFromBackground');
  const playlistFanout = sliceBetween(bridge, 'async function enrichVisiblePlaylistRowsWithChannelInfo', 'async function fetchChannelFromShortsUrl');
  const menuMapping = sliceBetween(bridge, 'const broadcastChannelMapping = (id, handle) => {', 'try {\n        // Single channel blocking');
  const successfulBlock = sliceBetween(bridge, '// Store videoId → channelId mapping for Shorts persistence after refresh', 'if (isMultiStep) {');

  assert.match(persistVideo, /currentSettings\.videoChannelMap\[v\].*=== c\) return false;/);
  assert.match(persistVideo, /currentSettings\.videoChannelMap\[v\] = c/);
  assert.match(persistVideo, /videoId: v,\s*channelId: c/);
  assert.match(persistVideo, /action: 'updateVideoChannelMap'/);
  assert.match(persistMeta, /currentSettings\.videoMetaMap\[videoId\] = meta/);
  assert.match(persistMeta, /action: 'updateVideoMetaMap'/);

  assert.match(shortsFanout, /fetchChannelFromShortsUrl\(videoId, null, \{ allowDirectFetch: false \}\)/);
  assert.match(shortsFanout, /action: 'updateVideoChannelMap'/);
  assert.match(shortsFanout, /container\.style\.display = 'none'/);
  assert.match(shortsFanout, /applyDOMFallback\(refreshed\.settings, \{ forceReprocess: true, preserveScroll: true \}\)/);

  assert.match(playlistFanout, /fetchWatchIdentityFromBackground\(videoId\)/);
  assert.match(playlistFanout, /persistVideoChannelMapping\(videoId, info\.id\)/);
  assert.match(playlistFanout, /persistChannelMappings\(\[\{ id: info\.id, handle: info\.handle \}\]\)/);
  assert.match(playlistFanout, /hideRow\(row, info\)/);

  assert.match(menuMapping, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(menuMapping, /persistChannelMappings\(\[mapping\]\)/);
  assert.match(successfulBlock, /persistVideoChannelMapping\(channelInfo\.videoId, channelInfo\.id\)/);
});

test('background queues patch caches and accept map messages without shared provenance report', () => {
  const background = read('js/background.js');
  const channelQueue = sliceBetween(background, 'function enqueueChannelMapUpdate(key, value)', 'function ensureVideoChannelMapCache');
  const videoQueue = sliceBetween(background, 'function enqueueVideoChannelMapUpdate(videoId, channelId)', 'function enqueueVideoMetaMapUpdate(videoId, meta)');
  const metaQueue = sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta)', '/**\n * Lazy-loads the curated release_notes.json');
  const receiver = sliceBetween(background, '} else if (request.action === "updateChannelMap")', '} else if (request.action === "recordTimeSaved")');
  const resolverRepair = sliceBetween(background, 'Resolved UC ID from videoId:', '} catch (e) {\n                console.warn');

  assert.match(channelQueue, /pendingChannelMapUpdates\.set\(k, v\)/);
  assert.match(channelQueue, /compiledSettingsCache\.main\.channelMap/);
  assert.match(channelQueue, /scheduleChannelMapFlush\(\)/);
  assert.doesNotMatch(channelQueue, /startsWith\('UC'\)|startsWith\("@"/);

  assert.match(videoQueue, /pendingVideoChannelMapUpdates\.set\(v, c\)/);
  assert.match(videoQueue, /compiledSettingsCache\.main\.videoChannelMap/);
  assert.match(videoQueue, /scheduleVideoChannelMapFlush\(\)/);
  assert.doesNotMatch(videoQueue, /\[a-zA-Z0-9_-\]\{11\}|startsWith\('UC'\)/);

  assert.match(metaQueue, /pendingVideoMetaMapUpdates\.set\(v, clean\)/);
  assert.match(metaQueue, /compiledSettingsCache\.main\.videoMetaMap/);
  assert.match(metaQueue, /scheduleVideoMetaMapFlush\(\)/);

  assert.match(receiver, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(receiver, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(receiver, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);

  assert.match(resolverRepair, /enqueueVideoChannelMapUpdate\(effectiveVideoId, mappedId\)/);
  assert.match(resolverRepair, /enqueueChannelMapUpdate\(resolvedHandle, mappedId\)/);
  assert.match(resolverRepair, /enqueueChannelMapUpdate\(String\(mappedId\)\.toLowerCase\(\), resolution\.handle \|\| resolvedHandle\)/);
});

test('content handle resolver can turn handle repair into map writes and DOM reruns', () => {
  const resolver = read('js/content/handle_resolver.js');
  const persist = sliceBetween(resolver, 'function persistChannelMappings(mappings = [])', 'function normalizeHandleGlyphs(value)');
  const backgroundOnly = sliceBetween(resolver, 'if (backgroundOnly) {', 'const encodedHandle = encodeURIComponent(networkHandleCore)');
  const directFetch = sliceBetween(resolver, 'const encodedHandle = encodeURIComponent(networkHandleCore)', 'resolvedHandleCache.delete(cleanHandle);\n    } catch (e)');

  assert.match(persist, /action: "updateChannelMap"/);
  assert.match(persist, /currentSettings\.channelMap/);
  assert.match(persist, /map\[idKey\] = mapping\.handle/);
  assert.match(persist, /map\[handleKey\] = mapping\.id/);

  assert.match(backgroundOnly, /action: 'fetchChannelDetails'/);
  assert.match(backgroundOnly, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(backgroundOnly, /scheduleDomFallbackRerun\(\)/);

  assert.match(directFetch, /fetch\(path, \{/);
  assert.match(directFetch, /credentials: 'same-origin'/);
  assert.match(directFetch, /type: 'FilterTube_UpdateChannelMap'/);
  assert.match(directFetch, /scheduleDomFallbackRerun\(\)/);
});

test('learned identity map write entrypoint future authority is absent from runtime source', () => {
  const runtime = [
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/handle_resolver.js',
    'js/background.js'
  ].map(read).join('\n');

  assert.doesNotMatch(runtime, /learnedIdentityMapWriteDecision/);
  assert.doesNotMatch(runtime, /learnedIdentityMapWriteAuthority/);
  assert.doesNotMatch(runtime, /identityMapProvenanceReport/);
  assert.doesNotMatch(runtime, /mapWriteRevisionPolicy/);
  assert.doesNotMatch(runtime, /mapWriteEffectBudget/);
});
