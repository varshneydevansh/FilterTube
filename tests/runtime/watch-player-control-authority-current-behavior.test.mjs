import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

const WATCH_PLAYER_KEYS = [
  'hideWatchPlaylistPanel',
  'hidePlaylistCards',
  'hideMixPlaylists',
  'hideVideoSidebar',
  'hideRecommended',
  'hideLiveChat',
  'hideVideoInfo',
  'hideVideoButtonsBar',
  'hideAskButton',
  'hideVideoChannelRow',
  'hideVideoDescription',
  'hideMerchTicketsOffers',
  'hideEndscreenVideowall',
  'hideEndscreenCards',
  'disableAutoplay',
  'disableAnnotations'
];

function assertWatchPlayerRouteConvergenceBoundary(doc) {
  const section = sliceBetween(
    doc,
    '## Watch/Player Route Convergence Boundary - 2026-05-30',
    '## Method Semantic Proof Gap Boundary'
  );

  for (const row of [
    'watch_player_ui_settings_cache_split',
    'watch_player_content_refresh_compensation',
    'watch_next_no_rule_endpoint_policy_gap',
    'watch_player_metadata_only_gap',
    'watch_comments_continuation_scaffold_split',
    'watch_recommendation_renderer_topology_gap',
    'watch_playlist_selected_row_side_effect_gap',
    'watch_whitelist_fullscreen_no_work_gap'
  ]) {
    assert.ok(section.includes(row), `missing route convergence row ${row}`);
  }

  for (const marker of [
    'watch/player convergence rows: 8',
    'implementation-ready watch/player convergence rows: 0',
    'watchSurfaceControlAuthority product source symbol: absent',
    'watchRecommendationRendererAuthority product source symbol: absent',
    'route-scoped /next optimization approval: NO-GO',
    'metadata-only /player optimization approval: NO-GO',
    'watch playlist selected-row JSON-first approval: NO-GO',
    'watch whitelist/fullscreen no-work approval: NO-GO',
    'runtime behavior changed by this addendum: no',
    'ASCII watch/player route convergence diagram: present',
    'Mermaid watch/player route convergence diagram: present'
  ]) {
    assert.ok(section.includes(marker), `missing route convergence marker ${marker}`);
  }

  for (const sourcePin of [
    'js/background.js:2810-2817',
    'js/background.js:4808-4823',
    'js/content/bridge_settings.js:1060-1102',
    'js/seed.js:701-740',
    'js/seed.js:87-90',
    'js/filter_logic.js:1175-1226',
    'js/content/dom_fallback.js:2403-2434',
    'js/content/dom_fallback.js:3819',
    'js/content/dom_fallback.js:4316-4341'
  ]) {
    assert.ok(section.includes(sourcePin), `missing route convergence source pin ${sourcePin}`);
  }

  for (const linkedProof of [
    'docs/audit/FILTERTUBE_MAIN_WATCH_PLAYER_FRAGMENT_METADATA_CURRENT_BEHAVIOR_2026-05-23.md',
    'tests/runtime/main-watch-player-fragment-metadata-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_MAIN_WATCH_AUTOPLAY_VIDEO_ENDPOINT_CURRENT_BEHAVIOR_2026-05-23.md',
    'tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md',
    'tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/compact-autoplay-authority-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'tests/runtime/direct-watch-card-authority-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_WATCH_PLAYLIST_PANEL_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-28.md',
    'tests/runtime/main-filter-all-comments-scope-current-behavior.test.mjs',
    'docs/audit/FILTERTUBE_NATIVE_OVERLAY_FULLSCREEN_QUIET_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-30.md',
    'tests/runtime/native-overlay-fullscreen-quiet-mode-boundary-current-behavior.test.mjs'
  ]) {
    assert.ok(section.includes(linkedProof), `missing linked proof ${linkedProof}`);
  }
}

test('watch/player control audit documents split authority and future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'watchSurfaceControlAuthority',
    'Background Cache Invalidation Gap',
    'Endpoint Authority Gap',
    'DOM Authority Gap',
    'JSON Renderer Gap',
    'Required Future Contract',
    'tests/runtime/watch-player-control-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  for (const source of [
    'js/content_controls_catalog.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/background.js',
    'js/seed.js',
    'js/content/dom_fallback.js',
    'js/content/bridge_settings.js',
    'js/filter_logic.js'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }

  assertWatchPlayerRouteConvergenceBoundary(doc);
});

test('UI catalog currently exposes watch and player controls as independent toggles', () => {
  const source = read('js/content_controls_catalog.js');
  const watchBlock = sliceBetween(source, "id: 'watch'", "id: 'video_info'");
  const playerBlock = sliceBetween(source, "id: 'player'", "id: 'navigation'");

  for (const key of ['hideVideoSidebar', 'hideRecommended', 'hideLiveChat', 'hideWatchPlaylistPanel']) {
    assert.match(watchBlock, new RegExp(`key: '${key}'`));
  }

  for (const key of ['hideEndscreenVideowall', 'hideEndscreenCards', 'disableAutoplay', 'disableAnnotations']) {
    assert.match(playerBlock, new RegExp(`key: '${key}'`));
  }

  assert.doesNotMatch(source, /watchSurfaceControlAuthority|endpointPolicy|settingsRevision/);
});

test('background compiles watch/player flags but invalidates only a subset of those dependencies', () => {
  const source = read('js/background.js');
  const compileBlock = sliceBetween(
    source,
    '// Pass through boolean flags',
    'const profileSettings = activeProfile?.settings || {};'
  );
  const storageBlock = sliceBetween(
    source,
    '// Listen for storage changes to re-compile settings',
    'let settingsChanged = false;'
  );

  for (const key of WATCH_PLAYER_KEYS) {
    assert.match(compileBlock, new RegExp(`compiledSettings\\.${key}\\s*=\\s*boolFromV4\\('${key}'`), `compile should emit ${key}`);
  }

  for (const omitted of WATCH_PLAYER_KEYS) {
    assert.doesNotMatch(storageBlock, new RegExp(`'${omitted}'`), `background invalidation currently omits ${omitted}`);
  }

  for (const watched of ['hideMembersOnly', 'hideAllShorts', 'hideComments', 'filterComments', 'hideHomeFeed', 'hideSponsoredCards', 'ftProfilesV3', 'FT_PROFILES_V4_KEY']) {
    assert.match(storageBlock, new RegExp(watched));
  }
});

test('content bridge storage refresh currently compensates with a broader watch/player key list', () => {
  const source = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    source,
    'const relevantKeys = [',
    'if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
  );

  for (const key of WATCH_PLAYER_KEYS) {
    assert.match(block, new RegExp(`'${key}'`), `content refresh list should include ${key}`);
  }

  assert.match(block, /'videoChannelMap'/);
  assert.match(block, /'videoMetaMap'/);
  assert.match(source, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\)/);
});

test('seed endpoint active-rule detection only treats comments shorts and categories as watch-adjacent JSON controls', () => {
  const source = read('js/seed.js');
  const activeBlock = sliceBetween(
    source,
    '    function hasSelectedCategoryFilters(settings) {',
    '\n\n    function shouldCaptureRawSnapshot'
  );
  const fetchBlock = sliceBetween(
    source,
    'return response.clone().json().then(jsonData => {',
    '// Normal processing for non-comment or non-hideAllComments requests'
  );

  assert.match(activeBlock, /settings\.hideAllComments === true/);
  assert.match(activeBlock, /settings\.hideAllShorts === true/);
  assert.match(activeBlock, /settings\?\.categoryFilters\?\.enabled === true/);
  assert.match(activeBlock, /hasList\(settings\.categoryFilters\.selected\)/);

  for (const key of [
    'hideVideoSidebar',
    'hideRecommended',
    'hideLiveChat',
    'hideWatchPlaylistPanel',
    'hideEndscreenVideowall',
    'hideEndscreenCards',
    'disableAutoplay',
    'disableAnnotations'
  ]) {
    assert.doesNotMatch(activeBlock, new RegExp(key), `seed active JSON gate should currently omit ${key}`);
  }

  assert.match(fetchBlock, /urlStr\.includes\('\/youtubei\/v1\/next'\) && cachedSettings\?\.hideAllComments/);
  assert.match(fetchBlock, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(fetchBlock, /continuationEndpoint: null/);
});

test('DOM fallback currently owns broad watch player CSS selectors and a broad boolean active gate', () => {
  const source = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(
    source,
    'if (settings.hideWatchPlaylistPanel) {',
    'if (settings.hideTopHeader) {'
  );
  const activeBlock = sliceBetween(
    source,
    'const booleanFilterKeys = [',
    'const contentFilters = settings.contentFilters'
  );

  for (const selector of [
    'ytd-playlist-panel-renderer',
    '#secondary.ytd-watch-flexy',
    '#related',
    'ytd-live-chat-frame#chat',
    '#comments',
    '#owner.ytd-watch-metadata',
    '#movie_player .ytp-endscreen-content',
    '#movie_player .ytp-ce-element',
    '.autonav-endscreen',
    '.annotation'
  ]) {
    assert.ok(styleBlock.includes(selector), `missing selector ${selector}`);
  }

  for (const key of WATCH_PLAYER_KEYS.filter(key => !['disableAutoplay', 'disableAnnotations'].includes(key))) {
    assert.match(activeBlock, new RegExp(`'${key}'`), `DOM active gate should include ${key}`);
  }
});

test('comments currently have JSON endpoint JSON renderer and DOM fallback owners', () => {
  const seed = read('js/seed.js');
  const logic = read('js/filter_logic.js');
  const dom = read('js/content/dom_fallback.js');

  assert.match(seed, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(seed, /continuationEndpoint: null/);

  const rulesBlock = sliceBetween(logic, '// Comment threads', '// ============================================================================');
  assert.match(rulesBlock, /commentRenderer/);
  assert.match(rulesBlock, /commentThreadRenderer/);
  assert.match(rulesBlock, /commentText/);

  const decisionBlock = sliceBetween(logic, '// Comment filtering', 'const commentKeywords =');
  assert.match(decisionBlock, /rendererType\.includes\('comment'\)/);
  assert.match(decisionBlock, /this\.settings\.hideAllComments/);

  const domBlock = sliceBetween(dom, 'function handleCommentsFallback(settings) {', '// 4b. Left guide');
  assert.match(domBlock, /commentContainers/);
  assert.match(domBlock, /commentThreads/);
  assert.match(domBlock, /settings\.hideAllComments/);
  assert.match(domBlock, /filterKeywordsComments/);
  assert.match(domBlock, /markedChannelIsStillBlocked/);
});

test('watch rail cleanup currently has a whitelist exception but no unified watch authority token', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    '// 5. Container Cleanup (Shelves, Grids)',
    "try {\n        const path = document.location?.pathname || '';"
  );

  assert.match(block, /const isWatchRailShelf = Boolean\(path\.startsWith\('\/watch'\)/);
  assert.match(block, /listMode === 'whitelist' && isWatchRailShelf/);
  assert.match(block, /updateContainerVisibility\(shelf/);
  assert.doesNotMatch(block, /watchSurfaceControlAuthority|endpointPolicy|settingsRevision/);
});

test('current product source has no watchSurfaceControlAuthority implementation yet', () => {
  const sourceFiles = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'));
  const combined = sourceFiles.map(read).join('\n');

  assert.doesNotMatch(combined, /\bwatchSurfaceControlAuthority\b/);
});
