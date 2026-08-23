import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

test('direct admission checks URL video IDs before owner identity is required', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );

  assert.match(block, /const explicitlyBlocked = Array\.isArray\(settings\?\.blockedVideoIds\)/);
  assert.match(block, /const explicitlyAllowed = Array\.isArray\(settings\?\.allowedVideoIds\)/);
  assert.ok(block.indexOf('if (explicitlyBlocked)') < block.indexOf('if (!ownerMeta || !ownerMeta.videoId)'));
  assert.match(block, /pauseCurrentWatchForDirectAccess\(ownerMeta\.videoId, 'blocked'\)/);
  assert.match(block, /setDirectAccessOverlay\(/);
});

test('unresolved direct playback is held and uses the bounded shared metadata scheduler', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');

  assert.match(dom, /FILTERTUBE_DIRECT_ACCESS_PENDING_TTL_MS = 6000/);
  assert.match(dom, /needIdentity: requirements\.needsIdentity/);
  assert.match(dom, /needText: requirements\.needsText/);
  assert.match(dom, /document\.addEventListener\('play',[\s\S]*media\.pause\?\.\(\)/);
  assert.match(bridge, /needIdentity: Boolean\(left\.needIdentity \|\| right\.needIdentity\)/);
  assert.match(bridge, /needText: Boolean\(left\.needText \|\| right\.needText\)/);
  assert.match(bridge, /WATCH_META_FETCH_MAX_PER_WINDOW = 24/);
});

test('direct admission reuses current Watch metadata before requesting Player metadata', () => {
  const dom = read('js/content/dom_fallback.js');
  const injector = read('js/injector.js');
  const playerFetch = sliceBetween(
    injector,
    'async function fetchVideoMetaFromYoutubeiPlayer(videoId, needs = {}) {',
    'function isYoutubeChannelsFeedPath()'
  );

  assert.match(dom, /function getCurrentWatchDescriptionText\(\)/);
  assert.match(dom, /const visibleDescription = getCurrentWatchDescriptionText\(\)/);
  assert.match(dom, /const currentVideoSearchText = \[\s*title,\s*visibleDescription,/s);
  assert.match(dom, /const hasPlayerText = Boolean\(\s*visibleDescription \|\|/s);
  assert.match(injector, /function extractVideoMetaFromPlayerResponse\(candidate, expectedVideoId\)/);
  assert.match(injector, /responseVideoId !== expectedVideoId/);
  assert.match(injector, /window\.filterTube\?\.rawYtInitialPlayerResponse/);
  assert.match(injector, /window\.ytInitialPlayerResponse/);
  assert.match(injector, /function loadedVideoMetaSatisfies\(metadata, needs = \{\}\)/);
  assert.match(injector, /!needs\.needCategory \|\| Boolean\(metadata\.category\)/);
  assert.ok(playerFetch.indexOf('getLoadedVideoMeta(videoId, needs)') < playerFetch.indexOf('fetch(endpointUrl'));
  assert.match(playerFetch, /source: 'loaded_player_response'/);
});

test('Block selected never repeatedly pauses an allowed Watch video while description metadata loads', () => {
  const dom = read('js/content/dom_fallback.js');
  const admission = sliceBetween(
    dom,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );
  assert.match(admission, /if \(listMode !== 'whitelist'\) \{[\s\S]*const knownTextBlocked/);
  assert.match(admission, /directState\.failOpenVideoId = routeVideoId;[\s\S]*releaseDirectAccessGuard\(routeVideoId, true\);[\s\S]*return;/);
  assert.match(admission, /directState\.failOpenVideoId === routeVideoId/);
  assert.match(dom, /failOpenVideoId: ''/);
});

test('metadata bridge carries exact needs so text-only admission does not wait for category', () => {
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  assert.match(bridge, /fetchVideoMetaFromWatchUrl\(nextVideoId, needs\)/);
  assert.match(bridge, /requestVideoMetaFromMainWorld\(videoId, needs\)/);
  assert.match(bridge, /payload: \{ requestId, videoId: normalizedVideoId, needs:/);
  assert.match(injector, /fetchVideoMetaFromYoutubeiPlayer\(videoId, payload\?\.needs \|\| \{\}\)/);
});

test('blocked channel pages redirect within YouTube without external-site permissions', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function enforceCurrentChannelPageDirectAccess(settings) {',
    'function enforceCurrentWatchOwnerBlock(settings) {'
  );

  assert.match(block, /isCreatorChannelPagePath\(path\)/);
  assert.match(block, /channelMetaMatchesIndex\(pageMeta, index, channelMap\)/);
  assert.match(block, /document\.location\.replace\('\/'\)/);
});

test('YouTube embeds run in matching frames while search-engine pages stay out of scope', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = JSON.parse(read(file));
    const embedEntries = manifest.content_scripts.filter(entry =>
      entry.matches?.some(pattern => pattern.endsWith('/embed/*'))
    );
    assert.ok(embedEntries.length > 0, `${file} must declare embed-only content scripts`);
    for (const entry of embedEntries) {
      assert.equal(entry.all_frames, true, `${file} content script must cover matching frames`);
      assert.ok(entry.matches.includes('*://*.youtube.com/embed/*'));
      assert.ok(entry.matches.includes('*://*.youtube-nocookie.com/embed/*'));
      assert.ok(!entry.matches.some(pattern => pattern.includes('google.')));
    }
    const topLevelEntries = manifest.content_scripts.filter(entry =>
      entry.matches?.includes('*://*.youtube.com/*')
    );
    assert.ok(topLevelEntries.length > 0, `${file} must retain ordinary YouTube content scripts`);
    for (const entry of topLevelEntries) {
      assert.notEqual(entry.all_frames, true, `${file} broad scripts must remain top-level`);
      assert.ok(entry.exclude_matches?.includes('*://*.youtube.com/embed/*'));
    }
  }

  const dom = read('js/content/dom_fallback.js');
  assert.match(dom, /\/embed\\\/\(\[a-zA-Z0-9_-\]\{11\}\)/);
  assert.match(read('js/content/release_notes_prompt.js'), /window\.top !== window/);
  assert.match(read('js/content/first_run_prompt.js'), /window\.top !== window/);
});

test('blocked playlist playback advances only to an allowed queue item and documents external boundaries', () => {
  const dom = read('js/content/dom_fallback.js');
  const help = read('html/tab-view.html');
  const spec = read('docs/USER_FEEDBACK_RULES_AND_GUIDANCE_SPEC_2026-08-08.md');
  const admission = sliceBetween(
    dom,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'
  );

  assert.match(admission, /findNextAllowedWatchPlaylistLink\(settings, ownerMeta\.videoId\)/);
  assert.match(admission, /targetLink\.click\(\)/);
  assert.match(help, /automatically moves to the next allowed video/);
  assert.match(help, /does not read or remove ordinary YouTube links on Google Search or other websites/);
  assert.match(spec, /external search-result links remain visible/);
  assert.match(spec, /youtube-nocookie\.com\/embed\//);
});
