import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const watchPlayerFamilyDocs = [
  'docs/audit/FILTERTUBE_DIRECT_WATCH_CARD_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_EXTRACTED_WATCH_PATHS_TEXT_DUMP_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_CARDS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ENDSCREEN_VIDEOWALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MAIN_SEARCH_DIRECT_WATCH_CARD_SUBRENDERER_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_SEARCH_UNIVERSAL_WATCH_CARD_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_AUTOPLAY_VIDEO_ENDPOINT_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_HTML_ENDSCREEN_SHAPE_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_WATCH_PLAYER_FRAGMENT_METADATA_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_PLAYER_ENDSCREEN_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_WATCHPAGE_EMBEDDED_POST_RENDERER_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_WATCH_ENDSCREEN_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md'
];

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

const watchPlayerKeys = [
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

const p0Fixtures = [
  'watch_controls_background_invalidation_covers_all_compiled_keys',
  'watch_controls_content_refresh_is_derived_from_background_schema',
  'watch_next_no_rule_pass_through_without_json_rewrite',
  'watch_player_no_rule_metadata_only_without_recommendation_mutation',
  'watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments',
  'watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding',
  'watch_sidebar_toggle_is_route_scoped_to_watch',
  'watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures',
  'watch_endscreen_videowall_json_and_dom_have_separate_fixtures',
  'watch_endscreen_cards_do_not_depend_on_broad_movie_player_hide',
  'watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible',
  'watch_fullscreen_pauses_non_player_dom_work'
];

test('P0 watch/player audit documents fixture family and current blocked verdict', () => {
  const doc = read(auditDocPath);
  const methodGap = read(methodGapPath);
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of p0Fixtures) {
    assert.ok(doc.includes(fixture), `missing watch/player fixture in audit doc: ${fixture}`);
    assert.ok(gate.includes(fixture), `missing watch/player fixture in readiness gate: ${fixture}`);
  }

  assert.match(p0Register, /\| watch\/player control authority \| 12 \|/);
  for (const phrase of [
    'P0 watch/player slice is not green',
    'Current behavior is proof-pinned',
    'Runtime behavior remains unchanged',
    'Implementation gate remains closed',
    'watchSurfaceControlAuthority.report'
  ]) {
    assert.ok(doc.includes(phrase), `missing watch/player verdict phrase: ${phrase}`);
  }

  assert.match(methodGap, /repo-wide lexical callables: 5681/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5681/);

  assert.equal(watchPlayerFamilyDocs.length, 15);
  for (const familyDocPath of watchPlayerFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5681/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5681/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('watch_controls_background_invalidation_covers_all_compiled_keys is not satisfied', () => {
  const background = read('js/background.js');
  const compileBlock = sliceBetween(
    background,
    '// Pass through boolean flags',
    'const profileSettings = activeProfile?.settings || {};'
  );
  const invalidationBlock = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    'let settingsChanged = false;'
  );

  for (const key of watchPlayerKeys) {
    assert.match(compileBlock, new RegExp(`compiledSettings\\.${key}\\s*=\\s*boolFromV4\\('${key}'`), `compile should emit ${key}`);
    assert.doesNotMatch(invalidationBlock, new RegExp(`'${key}'`), `background invalidation currently omits ${key}`);
  }

  assert.match(invalidationBlock, /'hideComments'/);
  assert.match(invalidationBlock, /'filterComments'/);
  assert.doesNotMatch(background, /\bwatchSurfaceControlAuthority\b/);
});

test('watch_controls_content_refresh_is_derived_from_background_schema is not satisfied', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const background = read('js/background.js');
  const bridgeBlock = sliceBetween(
    bridgeSettings,
    'const relevantKeys = [',
    'if (Object.keys(changes).some(key => relevantKeys.includes(key))) {'
  );
  const invalidationBlock = sliceBetween(
    background,
    '// Listen for storage changes to re-compile settings',
    'let settingsChanged = false;'
  );
  const productSource = `${bridgeSettings}\n${background}`;

  for (const key of watchPlayerKeys) {
    assert.match(bridgeBlock, new RegExp(`'${key}'`), `content refresh watches ${key}`);
    assert.doesNotMatch(invalidationBlock, new RegExp(`'${key}'`), `background invalidation omits ${key}`);
  }

  assert.match(bridgeSettings, /scheduleSettingsRefreshFromStorage\(\{ forceReprocess: !\(isVideoChannelMapOnly \|\| isVideoMetaMapOnly\) \}\)/);
  assert.doesNotMatch(productSource, /watchSurfaceControlAuthority|watchControlSchema|cacheDependencyKeys/);
});

test('watch_next_no_rule_pass_through_without_json_rewrite is now satisfied by seed no-work gate', () => {
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception()', 'function setupXhrInterception()');
  const activeGate = sliceBetween(
    seed,
    'function hasActiveJsonFilterRules(settings) {',
    'function hasNetworkJsonWork(settings) {'
  );

  assert.match(fetchSetup, /'\/youtubei\/v1\/next'/);
  assert.match(fetchSetup, /if \(shouldBypassYouTubeiNetworkResponse\(dataName\)\)[\s\S]{0,100}return originalFetch\.apply\(this, arguments\)/);
  assert.match(fetchSetup, /new Response\(JSON\.stringify\(processed\)/);
  assert.doesNotMatch(activeGate, /hideVideoSidebar|hideRecommended|hideWatchPlaylistPanel|hideEndscreenVideowall/);
  assert.doesNotMatch(seed, /endpointPolicy|watchSurfaceControlAuthority|watch_next_no_rule_pass_through/);
});

test('watch_player_no_rule_metadata_only_without_recommendation_mutation is now satisfied by seed no-work gate', () => {
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception()', 'function setupXhrInterception()');
  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception()', 'function updateSettings(newSettings) {');

  assert.match(fetchSetup, /'\/youtubei\/v1\/player'/);
  assert.match(xhrSetup, /'\/youtubei\/v1\/player'/);
  assert.match(fetchSetup, /const dataName = `fetch:\$\{getPathname\(urlStr\)\}`/);
  assert.match(fetchSetup, /if \(shouldBypassYouTubeiNetworkResponse\(dataName\)\)[\s\S]{0,100}return originalFetch\.apply\(this, arguments\)/);
  assert.match(fetchSetup, /const processed = processWithEngine\(jsonData, dataName\)/);
  assert.match(fetchSetup, /new Response\(JSON\.stringify\(processed\)/);
  assert.doesNotMatch(seed, /playerMetadataOnly|metadataOnly|watchSurfaceControlAuthority/);
});

test('watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments is only partial today', () => {
  const seed = read('js/seed.js');
  const branch = sliceBetween(
    seed,
    '// Special handling for comment requests when hideAllComments is enabled',
    '// Normal processing for non-comment or non-hideAllComments requests'
  );

  assert.match(branch, /urlStr\.includes\('\/youtubei\/v1\/next'\) && cachedSettings\?\.hideAllComments/);
  assert.match(branch, /appendContinuationItemsAction/);
  assert.match(branch, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(branch, /continuationEndpoint: null/);
  assert.doesNotMatch(branch, /reloadContinuationItemsCommand|replaceContinuationItemsCommand/);
  assert.doesNotMatch(branch, /commentsContinuationRewrite|watchSurfaceControlAuthority/);
});

test('watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding lacks one authority report today', () => {
  const seed = read('js/seed.js');
  const logic = read('js/filter_logic.js');
  const dom = read('js/content/dom_fallback.js');
  const domComments = sliceBetween(dom, 'function handleCommentsFallback(settings) {', '// 4b. Left guide');
  const logicComments = sliceBetween(logic, '// Comment threads', '// ============================================================================');

  assert.match(seed, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(logicComments, /commentRenderer/);
  assert.match(logicComments, /commentThreadRenderer/);
  assert.match(domComments, /const commentContainers = document\.querySelectorAll/);
  assert.match(domComments, /const commentThreads = document\.querySelectorAll/);
  assert.match(domComments, /filterKeywordsComments/);
  assert.match(domComments, /toggleVisibility\(container, true, 'Hide All Comments'\)/);
  assert.doesNotMatch(`${seed}\n${logicComments}\n${domComments}`, /watchSurfaceControlAuthority|nonCommentWatchScaffolding|watchScaffoldingBoundary/);
});

test('watch_sidebar_toggle_is_route_scoped_to_watch is not satisfied by a shared route authority', () => {
  const dom = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(dom, 'if (settings.hideVideoSidebar) {', 'if (settings.hideLiveChat) {');
  const activeBlock = sliceBetween(dom, 'const booleanFilterKeys = [', 'const contentFilters = settings.contentFilters');

  assert.match(styleBlock, /#secondary\.ytd-watch-flexy/);
  assert.match(styleBlock, /#related/);
  assert.match(styleBlock, /#items\.ytd-watch-next-secondary-results-renderer/);
  assert.match(activeBlock, /'hideVideoSidebar'/);
  assert.match(activeBlock, /'hideRecommended'/);
  assert.doesNotMatch(activeBlock, /startsWith\('\/watch'\)|data-filtertube-route-watch|watchSurfaceControlAuthority/);
});

test('watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures is not centrally guaranteed today', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const styleBlock = sliceBetween(dom, 'if (settings.hideWatchPlaylistPanel) {', 'if (settings.hidePlaylistCards) {');

  assert.match(styleBlock, /ytd-playlist-panel-renderer/);
  assert.match(bridge, /target\.closest\('ytd-playlist-panel-renderer'\)/);
  assert.match(bridge, /enrichVisiblePlaylistRowsWithChannelInfo|playlistPanel/);
  assert.match(dom, /videoChannelMap lookup \(Shorts \+ playlist panels \+ other DOM-heavy cards\)/);
  assert.match(dom, /Never hide the currently-selected playlist row/);
  assert.doesNotMatch(`${dom}\n${bridge}`, /watchSurfaceControlAuthority|playlistPanelIdentityAuthority/);
});

test('watch_endscreen_videowall_json_and_dom_have_separate_fixtures is not satisfied by one report', () => {
  const logic = read('js/filter_logic.js');
  const dom = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(dom, 'if (settings.hideEndscreenVideowall) {', 'if (settings.hideTopHeader) {');

  assert.match(logic, /endScreenVideoRenderer: BASE_VIDEO_RULES/);
  assert.match(styleBlock, /#movie_player \.ytp-endscreen-content/);
  assert.match(styleBlock, /#movie_player \.ytp-fullscreen-grid-stills-container/);
  assert.match(styleBlock, /#movie_player \.ytp-ce-element/);
  assert.match(styleBlock, /\.autonav-endscreen/);
  assert.doesNotMatch(`${logic}\n${styleBlock}`, /watchSurfaceControlAuthority|endScreenFixture|playerVideowallFixture/);
});

test('watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible is only locally guarded today', () => {
  const dom = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(dom, 'const listMode = (settings && settings.listMode ===', 'if (settings.hideEndscreenVideowall) {');
  const cleanupBlock = sliceBetween(
    dom,
    '// 5. Container Cleanup (Shelves, Grids)',
    "try {\n        const path = document.location?.pathname || '';"
  );

  assert.match(styleBlock, /listMode !== 'whitelist'/);
  assert.match(styleBlock, /#owner\.ytd-watch-metadata/);
  assert.match(styleBlock, /#description\.ytd-watch-metadata/);
  assert.match(cleanupBlock, /const isWatchRailShelf = Boolean\(path\.startsWith\('\/watch'\)/);
  assert.match(cleanupBlock, /listMode === 'whitelist' && isWatchRailShelf/);
  assert.doesNotMatch(`${styleBlock}\n${cleanupBlock}`, /watchSurfaceControlAuthority|whitelistSafeControls|watchScaffoldingVisible/);
});

test('watch_fullscreen_pauses_non_player_dom_work is not satisfied today', () => {
  const bridge = read('js/content_bridge.js');
  const dom = read('js/content/dom_fallback.js');
  const quick = read('js/content/block_channel.js');
  const endscreenStyleBlock = sliceBetween(dom, 'if (settings.hideEndscreenVideowall) {', 'if (settings.hideTopHeader) {');
  const domActiveBlock = sliceBetween(dom, 'const booleanFilterKeys = [', 'const contentFilters = settings.contentFilters');

  assert.match(bridge, /data-filtertube-native-fullscreen/);
  assert.match(quick, /orientationchange/);
  assert.match(dom, /#movie_player \.ytp-endscreen-content/);
  assert.doesNotMatch(`${endscreenStyleBlock}\n${domActiveBlock}`, /data-filtertube-native-fullscreen|fullscreenPausePolicy|pauseNonPlayerDomWork/);
  assert.doesNotMatch(quick, /fullscreenPausePolicy|data-filtertube-native-fullscreen/);
  assert.doesNotMatch(`${bridge}\n${dom}\n${quick}`, /watchSurfaceControlAuthority\.report/);
});
