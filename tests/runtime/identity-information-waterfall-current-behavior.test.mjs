import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md';

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

test('identity_waterfall_doc_documents_actual_source_order', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /YouTube page \/ endpoint payloads/);
  assert.match(doc, /Main-world interception/);
  assert.match(doc, /JSON harvest and mutation engine/);
  assert.match(doc, /Persisted learned maps \+ compiled settings/);
  assert.match(doc, /DOM card \/ watch owner \/ menu snapshot extraction/);
  assert.match(doc, /Background HTML fetch fallback only when current data is insufficient/);
  assert.match(doc, /video id is a join key/i);
  assert.match(doc, /preferred evidence source/);
  assert.match(doc, /not a standalone\s+permission to hide, restore, mutate, persist, fetch, stamp, or count anything/);
  assert.match(doc, /first evidence tier/);
  assert.match(doc, /kept here only as an audit target, not as the\s+current implementation contract/);
  assert.match(doc, /old "rare fallback" wording is not safe as a\s+global claim/);
  assert.match(doc, /Subagent Validation/);
  assert.match(doc, /identityInformationWaterfallAuthority/);

  assert.doesNotMatch(doc, /preferred source of truth/);
  assert.doesNotMatch(doc, /first authority/);
  assert.doesNotMatch(doc, /ensuring instant blocking/i);
  assert.doesNotMatch(doc, /minimizing network calls/i);
  assert.doesNotMatch(doc, /Network fetch \(Background, rare fallback\)/);
});

test('identity_waterfall_seed_intercepts_page_globals_and_youtubei_endpoints', () => {
  const seed = read('js/seed.js');
  const globals = sliceBetween(seed, '// Hook ytInitialData', 'dataHooksEstablished = true;');
  const fetchBlock = sliceBetween(seed, 'function setupFetchInterception()', 'function setupXhrInterception()');
  const xhrBlock = sliceBetween(seed, 'function setupXhrInterception()', 'const proto = window.XMLHttpRequest');

  assert.match(seed, /function stashNetworkSnapshot\(data, dataName\)/);
  for (const endpoint of [
    '/youtubei/v1/search',
    '/youtubei/v1/guide',
    '/youtubei/v1/browse',
    '/youtubei/v1/next',
    '/youtubei/v1/player'
  ]) {
    assert.ok(fetchBlock.includes(endpoint), `fetch hook missing ${endpoint}`);
    assert.ok(xhrBlock.includes(endpoint), `XHR hook missing ${endpoint}`);
  }

  assert.match(globals, /ytInitialData already exists/);
  assert.match(globals, /Object\.defineProperty\(window, 'ytInitialData'/);
  assert.match(globals, /ytInitialPlayerResponse already exists/);
  assert.match(globals, /Object\.defineProperty\(window, 'ytInitialPlayerResponse'/);
  assert.match(fetchBlock, /processWithEngine\(jsonData, dataName\)/);
});

test('identity_waterfall_filter_logic_harvests_player_renderer_playlist_and_kids_identity', () => {
  const filter = read('js/filter_logic.js');
  const playerBlock = sliceBetween(filter, '_harvestPlayerOwnerData(data) {', '_harvestRendererChannelMappings(root) {');
  const rendererBlock = sliceBetween(filter, '_harvestRendererChannelMappings(root) {', '_registerVideoChannelMapping(videoId, channelId) {');

  for (const token of [
    'videoOwnerChannelId',
    'videoDetails.channelId',
    'playerMicroformat.externalChannelId',
    'ownerProfileUrl',
    'lengthSeconds',
    'publishDate',
    'playlistPanelVideoRenderer',
    '_registerVideoChannelMapping(playlistVideoId, browseId)'
  ]) {
    assert.ok(playerBlock.includes(token), `missing player harvest token ${token}`);
  }

  for (const token of [
    'videoRenderer',
    'compactVideoRenderer',
    'playlistVideoRenderer',
    'lockupViewModel',
    'videoWithContextRenderer',
    'kidsVideoOwnerExtension',
    'shortBylineText',
    'decoratedAvatarViewModel',
    '_registerMapping(lockupBrowseId, normalized)'
  ]) {
    assert.ok(rendererBlock.includes(token), `missing renderer harvest token ${token}`);
  }

  assert.match(filter, /type: 'FilterTube_UpdateVideoChannelMap'/);
  assert.match(filter, /type: 'FilterTube_UpdateVideoMetaMap'/);
  assert.match(filter, /type: 'FilterTube_UpdateChannelMap'/);
});

test('identity_waterfall_content_bridge_persists_maps_and_uses_video_id_join_keys', () => {
  const bridge = read('js/content_bridge.js');
  const mapBlock = sliceBetween(bridge, "} else if (type === 'FilterTube_UpdateChannelMap')", "} else if (type === 'FilterTube_UpdateVideoMetaMap')");
  const shortsBlock = sliceBetween(bridge, 'function isShortsContentElement(node)', 'function syncBlockedElementsWithFilters');
  const ytmFallback = sliceBetween(bridge, 'const mappedFallbackId = (() => {', "console.log('FilterTube: Falling back to main-world lookup for video:");

  assert.match(mapBlock, /persistChannelMappings\(payload\)/);
  assert.match(mapBlock, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(mapBlock, /data-filtertube-video-id/);
  assert.match(mapBlock, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(mapBlock, /applyDOMFallback\(null\)/);

  assert.match(shortsBlock, /a\[href\*="\/shorts\/"\]/);
  assert.ok(shortsBlock.includes('href.match(/\\/shorts\\/([a-zA-Z0-9_-]{11})/)'));
  assert.match(ytmFallback, /currentSettings\?\.videoChannelMap\?\.\[fallbackVideoId\]/);
  assert.match(ytmFallback, /fetchStrategy: 'mainworld'/);
});

test('identity_waterfall_dom_extraction_has_explicit_low_confidence_boundaries', () => {
  const bridge = read('js/content_bridge.js');
  const extraction = sliceBetween(bridge, 'function extractChannelFromCard(card)', 'async function injectFilterTubeMenuItem(dropdown, videoCard)');
  const domFallback = read('js/content/dom_fallback.js');
  const watchOwner = sliceBetween(domFallback, 'function getCurrentWatchOwnerMeta(settings)', 'function getPlaylistRowVideoId(row)');

  assert.match(extraction, /if \(!isShortsCard\)/);
  assert.match(extraction, /needsFetch: true/);
  assert.match(extraction, /Never treat lockup metadata text \(which includes title \+ view count\) as a channel name/);
  assert.match(extraction, /expectedChannelName/);

  assert.match(watchOwner, /settings\?\.videoChannelMap\?\.\[videoId\]/);
  assert.match(watchOwner, /mappedIdAuthoritative: true/);
  assert.match(watchOwner, /owner row can briefly retain the/);
  assert.match(watchOwner, /previous video's @handle\/name/);
});

test('identity_waterfall_background_fetch_checks_maps_or_caches_before_html_fetch', () => {
  const background = read('js/background.js');
  const shorts = sliceBetween(background, 'async function performShortsIdentityFetch(videoId, normalizedHandle)', 'function extractIdentityFromPreview(preview, normalizedHandle)');
  const kids = sliceBetween(background, 'async function performKidsWatchIdentityFetch(videoId)', 'async function performWatchIdentityFetch(videoId)');
  const watch = sliceBetween(background, 'async function performWatchIdentityFetch(videoId)', 'async function fetchChannelInfo');

  assert.match(shorts, /storageGet\(\['videoChannelMap'\]\)/);
  assert.match(shorts, /if \(identityHasAlternateMetadata\(storedIdentity\)\) return storedIdentity/);
  assert.match(shorts, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`/);
  assert.match(shorts, /credentials: 'include'/);

  assert.match(kids, /storageGet\(\['videoChannelMap'\]\)/);
  assert.match(kids, /kidsWatchIdentitySessionCache\.get\(videoId\)/);
  assert.match(kids, /pendingKidsWatchIdentityFetches\.has\(videoId\)/);
  assert.match(kids, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);

  assert.match(watch, /watchIdentitySessionCache\.get\(videoId\)/);
  assert.match(watch, /pendingWatchIdentityFetches\.has\(videoId\)/);
  assert.match(watch, /storageGet\(\['videoChannelMap'\]\)/);
  assert.match(watch, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
});

test('identity_waterfall_menu_actions_can_escalate_to_watch_or_shorts_resolvers', () => {
  const bridge = read('js/content_bridge.js');
  const menuBlock = sliceBetween(bridge, 'let input = channelInfo.id || channelInfo.customUrl || requestedHandleForNetwork || channelInfo.handle;', '// Get collaboration metadata from menu item attribute');
  const retryBlock = sliceBetween(bridge, '// If the background could not fetch the channel page', '// Store videoId → channelId mapping for Shorts persistence after refresh');

  assert.match(menuBlock, /useShortsResolver \? 'shorts' : 'watch'/);
  assert.match(menuBlock, /input = `\$\{useShortsResolver \? 'shorts' : 'watch'\}:\$\{String\(channelInfo\.videoId\)\.trim\(\)\}`/);
  assert.match(menuBlock, /currentSettings\?\.videoChannelMap\?\.\[clickSnapshot\.videoId\]/);
  assert.match(menuBlock, /input = clickSnapshot\?\.videoId \? `watch:\$\{clickSnapshot\.videoId\}` : mappedWatchChannelId/);

  assert.match(retryBlock, /searchYtInitialDataForVideoChannel\(channelInfo\.videoId/);
  assert.match(retryBlock, /Retrying block with background watch resolver/);
  assert.match(retryBlock, /fetchChannelFromWatchUrl\(channelInfo\.videoId/);
  assert.match(retryBlock, /fetchChannelFromShortsUrl\(channelInfo\.videoId, expectedHandle, \{ allowDirectFetch: true \}\)/);
});

test('identity_waterfall_background_channel_details_fetch_is_action_fallback', () => {
  const background = read('js/background.js');
  const messageBlock = sliceBetween(background, 'else if (request.action === "fetchChannelDetails")', '// Handle any browser-specific actions if needed');
  const fetchInfo = sliceBetween(background, 'async function fetchChannelInfo(channelIdOrHandle)', 'const normalizeHandleOutput = (value) => {');

  assert.match(messageBlock, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.match(messageBlock, /return true/);
  assert.match(fetchInfo, /channelIdOrHandle/);
  assert.match(fetchInfo, /isHandle/);
  assert.match(fetchInfo, /isCustomUrl/);
  assert.match(fetchInfo, /isUserUrl/);
});

test('identity_waterfall_no_shared_authority_symbol_exists_yet', () => {
  const files = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/background.js'
  ];
  const source = files.map(read).join('\n');

  assert.doesNotMatch(source, /identityInformationWaterfallAuthority/);
  assert.doesNotMatch(source, /identityDecision\s*\{/);
  assert.doesNotMatch(source, /sourceConfidence/);
  assert.doesNotMatch(source, /budgetOwner/);
});

test('identity_waterfall_reference_docs_do_not_overclaim_json_or_zero_network_completeness', () => {
  const channelDoc = read('docs/CHANNEL_BLOCKING_SYSTEM.md');
  const proactiveDoc = read('docs/PROACTIVE_CHANNEL_IDENTITY.md');

  assert.match(channelDoc, /not a guarantee\s+that identity exists before DOM render/);
  assert.match(channelDoc, /JSON-first identity strategy/);
  assert.match(channelDoc, /Harvested learned maps/);
  assert.match(channelDoc, /videoId` as a join key/);
  assert.match(channelDoc, /Kids network behavior as a last-resort resolver/);
  assert.match(channelDoc, /JSON\/player\/maps\/DOM lacked enough identity/);
  assert.match(channelDoc, /when enough identity is already known/);
  assert.match(channelDoc, /background Kids watch resolver can still run/);
  assert.match(channelDoc, /claims "instant," "before render," or "zero network" must first prove that claim/);

  assert.match(proactiveDoc, /Kids safety goal/);
  assert.match(proactiveDoc, /Current behavior still includes a background Kids watch fallback/);
  assert.match(proactiveDoc, /Learned maps/);
  assert.match(proactiveDoc, /Last resort; not globally budgeted yet/);
  assert.match(proactiveDoc, /Fast blocking on proven identity/);
  assert.match(proactiveDoc, /not every surface exposes all fields immediately/);
  assert.match(proactiveDoc, /These paths can still return null, `not_found`, or failure/);
  assert.match(proactiveDoc, /3-dot menus render from stamped identity when enough UC\/handle\/name data is\s+already known/);
  assert.match(proactiveDoc, /Fast multi-channel menus when the roster is present in\s+JSON\/maps\/DOM/);
  assert.match(proactiveDoc, /weak or video-id-only surfaces\s+can still need resolver work/);
  assert.match(proactiveDoc, /Preferred first evidence tier for endpoint data, not proof that every visible card is complete before render/);
  assert.match(proactiveDoc, /Secondary page-global evidence tier/);
  assert.match(proactiveDoc, /video-id-only Shorts can still need player\/map\/resolver proof/);

  assert.doesNotMatch(channelDoc, /All network fetches are skipped on Kids surfaces/);
  assert.doesNotMatch(channelDoc, /Kids: skip network, rely on intercepted JSON only/);
  assert.doesNotMatch(channelDoc, /future encounters are zero-network/);
  assert.doesNotMatch(channelDoc, /No network calls needed for blocking\n/);
  assert.doesNotMatch(channelDoc, /3-dot menus show correct names immediately/);
  assert.doesNotMatch(channelDoc, /No "Fetching…" delay/);
  assert.match(channelDoc, /Weak targets can still show a loading\/fetching state/);
  assert.match(channelDoc, /collaborator roster is already present in JSON/);
  assert.doesNotMatch(proactiveDoc, /Zero-network design works reliably on YouTube Kids/);
  assert.doesNotMatch(proactiveDoc, /3-dot menus show correct channel names instantly/);
  assert.doesNotMatch(proactiveDoc, /3-dot menus render instantly with correct names/);
  assert.doesNotMatch(proactiveDoc, /Instant multi-channel menus, no "Fetching\.\.\." delays/);
  assert.doesNotMatch(proactiveDoc, /Watch page collaborators load instantly/);
  assert.doesNotMatch(proactiveDoc, /All surfaces get the same rich metadata/);
  assert.doesNotMatch(proactiveDoc, /ensure channel identity is always resolved/);
  assert.doesNotMatch(proactiveDoc, /Very rare/);
  assert.doesNotMatch(proactiveDoc, /Always \(primary\)/);
  assert.doesNotMatch(proactiveDoc, /instant channel identity extraction/);
});
