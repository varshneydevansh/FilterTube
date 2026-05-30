import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md';
const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function ignoredCaptureEntries() {
  const lines = read('.gitignore').split(/\r?\n/);
  const start = lines.indexOf('logs.json');
  const end = lines.indexOf('# Logs');
  assert.notEqual(start, -1, 'missing capture block start');
  assert.notEqual(end, -1, 'missing capture block end');
  return lines.slice(start, end).filter(Boolean);
}

function fixtureFiles() {
  return fs.readdirSync(fixtureDir).sort();
}

function fixtureText() {
  return fixtureFiles().map(file => fs.readFileSync(path.join(fixtureDir, file), 'utf8')).join('\n');
}

function jsonFixtureSources() {
  return fixtureFiles()
    .filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'))?.provenance?.source)
    .filter(Boolean);
}

const fixtures = [
  'capture_traceability_main_watch_end_screen_dom_wall',
  'capture_traceability_main_next_compact_autoplay_renderer',
  'capture_traceability_main_search_no_rule_real_capture_pass_through',
  'capture_traceability_main_guide_no_rule_real_capture_pass_through',
  'capture_traceability_comment_continuation_append_reload_replace',
  'capture_traceability_reel_item_owner_identity',
  'capture_traceability_kids_browse_public_web_renderer_drift',
  'capture_traceability_ytm_dom_selector_guardrails',
  'capture_traceability_collab_homepage_avatar_stack_false_positive',
  'capture_traceability_post_menu_insertion_boundaries',
  'capture_traceability_playlist_json_creator_identity'
];

test('P0 capture fixture traceability doc lists all current-behavior fixtures and blocked verdict', () => {
  const doc = read(docPath);
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing fixture in P0 doc: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing fixture in readiness gate: ${fixture}`);
  }

  for (const registerFixture of [
    'capture_traceability_main_next_compact_autoplay_renderer',
    'capture_traceability_reel_item_owner_identity',
    'capture_traceability_collab_homepage_avatar_stack_false_positive',
    'capture_traceability_post_menu_insertion_boundaries',
    'capture_traceability_playlist_json_creator_identity'
  ]) {
    assert.ok(register.includes(registerFixture), `missing fixture in P0 register: ${registerFixture}`);
  }

  for (const token of [
    'P0 capture fixture traceability is not implementation-ready',
    'captureFixtureTraceability',
    'rawSourceCapture',
    'minimalFixturePath',
    'negativeSiblingVisibleFixture',
    'releaseInputAllowed: false'
  ]) {
    assert.ok(doc.includes(token), `missing P0 doc token: ${token}`);
  }
});

test('capture corpus is much broader than committed reduced fixtures today', () => {
  const entries = ignoredCaptureEntries();
  const unique = [...new Set(entries)];
  const present = unique.filter(file => fs.existsSync(path.join(repoRoot, file)));
  const missing = unique.filter(file => !fs.existsSync(path.join(repoRoot, file)));
  const files = fixtureFiles();

  assert.equal(entries.length, 47);
  assert.equal(unique.length, 46);
  assert.equal(present.length, 45);
  assert.deepEqual(missing, ['post_opt1_logs.txt']);
  assert.equal(files.length, 44);
  assert.ok(present.length > files.length, 'raw evidence families remain broader than the reduced fixtures');
});

test('capture_traceability_main_watch_end_screen_dom_wall is partially extracted but DOM wall is not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const names = fixtureFiles().join('\n');
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-get-watch-playlist-end-screen.json'), 'utf8'));
  const watchpageCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watchpage-embedded-post-renderer.json'), 'utf8'));
  const watchHtmlEmbeddedCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-html-embedded-playlist-endscreen-json.json'), 'utf8'));
  const initialWatchCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-initial-lockup-shorts-json.json'), 'utf8'));
  const playerFragmentCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-player-fragment-metadata.json'), 'utf8'));
  const tmpPlaylistCollabCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-tmp-playlist-collab-dialog.json'), 'utf8'));

  for (const raw of [
    'YT_MAIN_WATCH.html',
    'YT_MAIN.json',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
    'get_watch?prettyPrint=false.json',
    'tmp.json',
    'watchpage.json'
  ]) {
    assert.ok(doc.includes(raw), `traceability doc should name ${raw}`);
  }

  assert.ok(fixtureFiles().includes('main-watch-get-watch-playlist-end-screen.json'));
  assert.ok(fixtureFiles().includes('main-watch-html-embedded-playlist-endscreen-json.json'));
  assert.ok(fixtureFiles().includes('main-watch-initial-lockup-shorts-json.json'));
  assert.ok(fixtureFiles().includes('main-watch-player-fragment-metadata.json'));
  assert.ok(fixtureFiles().includes('main-watch-tmp-playlist-collab-dialog.json'));
  assert.ok(fixtureFiles().includes('main-watchpage-embedded-post-renderer.json'));
  assert.ok(fixtureFiles().includes('main-next-reload-modern-comments.json'));
  assert.ok(fixtureFiles().includes('playlist-player-endscreen-dom.html'));
  assert.equal(capture.provenance.source, 'get_watch?prettyPrint=false.json');
  assert.equal(capture.provenance.rendererType, 'watchNextResponse');
  assert.equal(watchHtmlEmbeddedCapture.provenance.source, 'YT_MAIN_WATCH.html');
  assert.equal(watchHtmlEmbeddedCapture.provenance.rendererType, 'watchHtmlEmbeddedPlaylistEndScreenJson');
  assert.match(JSON.stringify(watchHtmlEmbeddedCapture.ytInitialData), /playlistPanelVideoRenderer/);
  assert.match(JSON.stringify(watchHtmlEmbeddedCapture.ytInitialData), /endScreenVideoRenderer/);
  assert.equal(initialWatchCapture.provenance.source, 'YT_MAIN.json');
  assert.equal(initialWatchCapture.provenance.rendererType, 'watchInitialLockupAndShortsJson');
  assert.match(JSON.stringify(initialWatchCapture.response), /shortsLockupViewModel/);
  assert.equal(playerFragmentCapture.provenance.source, 'YT_MAIN.json');
  assert.equal(playerFragmentCapture.provenance.rendererType, 'watchPlayerMetadataFragment');
  assert.match(JSON.stringify(playerFragmentCapture.response), /videoDetails/);
  assert.match(JSON.stringify(playerFragmentCapture.response), /endscreenElementRenderer/);
  assert.equal(tmpPlaylistCollabCapture.provenance.source, 'tmp.json');
  assert.equal(tmpPlaylistCollabCapture.provenance.rendererType, 'watchNextResponse');
  assert.match(JSON.stringify(tmpPlaylistCollabCapture.watchNextResponse), /showDialogCommand/);
  assert.match(JSON.stringify(tmpPlaylistCollabCapture.watchNextResponse), /UCGnjeahCJW1AF34HBmQTJ-Q/);
  assert.match(JSON.stringify(tmpPlaylistCollabCapture.watchNextResponse), /UCYLNGLIzMhRTi6ZOLjAPSmw/);
  assert.equal(watchpageCapture.provenance.source, 'watchpage.json');
  assert.equal(watchpageCapture.provenance.rendererType, 'postRenderer');
  assert.equal(watchpageCapture.provenance.route, 'browse/feed, not watch-next');
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-next-reload-modern-comments.json'), 'utf8')).provenance.rendererType, 'reloadModernCommentThreadRenderer');
  assert.match(JSON.stringify(capture.watchNextResponse), /playlistPanelVideoRenderer/);
  assert.match(JSON.stringify(capture.watchNextResponse), /endScreenVideoRenderer/);
  assert.doesNotMatch(names, /main.*end.*screen.*dom|main.*watch.*dom/i);
  assert.match(read('tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html'), /not clean Main watch DOM wall proof/);
});

test('capture_traceability_main_next_compact_autoplay_renderer is not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const text = fixtureText();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-watch-autoplay-video-endpoint.json'), 'utf8'));
  const watchpageCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-upnext-feed-watchpage-lockup-continuation.json'), 'utf8'));
  const watchpage2Capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json'), 'utf8'));
  const watchpage3Capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'), 'utf8'));

  assert.ok(doc.includes('compactAutoplayRenderer'));
  assert.ok(doc.includes('YT_MAIN_NEXT.json'));
  assert.ok(doc.includes('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json'));
  assert.ok(doc.includes('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json'));
  assert.ok(doc.includes('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json'));
  assert.ok(files.includes('main-watch-autoplay-video-endpoint.json'));
  assert.ok(files.includes('main-upnext-feed-watchpage-lockup-continuation.json'));
  assert.ok(files.includes('main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json'));
  assert.ok(files.includes('main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'));
  assert.ok(files.includes('main-next-reload-modern-comments.json'));
  assert.equal(capture.provenance.source, 'get_watch?prettyPrint=false.json');
  assert.equal(capture.provenance.rendererType, 'watchAutoplayEndpoint');
  assert.equal(watchpageCapture.provenance.source, 'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json');
  assert.equal(watchpageCapture.provenance.rendererType, 'watchNextFeedLockupViewModel');
  assert.equal(watchpageCapture.provenance.targetId, 'watch-next-feed');
  assert.equal(watchpage2Capture.provenance.source, 'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json');
  assert.equal(watchpage2Capture.provenance.rendererType, 'watchNextFeedClaimPrefacedLockupViewModel');
  assert.equal(watchpage2Capture.provenance.targetId, 'watch-next-feed');
  assert.equal(watchpage3Capture.provenance.source, 'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json');
  assert.equal(watchpage3Capture.provenance.rendererType, 'watchpage3AutoplayPreviousEndpoint');
  assert.match(JSON.stringify(capture.watchNextResponse), /autoplayVideo/);
  assert.match(JSON.stringify(capture.watchNextResponse), /nextButtonVideo/);
  assert.match(JSON.stringify(watchpageCapture.response), /lockupViewModel/);
  assert.doesNotMatch(JSON.stringify(watchpageCapture.response), /compactAutoplayRenderer|autoplayVideo|nextButtonVideo|previousButtonVideo|endScreenVideoRenderer|playlistPanelVideoRenderer/);
  assert.match(JSON.stringify(watchpage2Capture.response), /lockupViewModel/);
  assert.doesNotMatch(JSON.stringify(watchpage2Capture.response), /compactAutoplayRenderer|autoplayVideo|nextButtonVideo|previousButtonVideo|endScreenVideoRenderer|playlistPanelVideoRenderer|showDialogCommand|coAuthors|ownerText|bylineText|avatarStackViewModel/);
  assert.match(JSON.stringify(watchpage3Capture.ytInitialData), /previousButtonVideo/);
  assert.doesNotMatch(JSON.stringify(JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-next-reload-modern-comments.json'), 'utf8')).response), /compactAutoplayRenderer|autoplayVideo|nextButtonVideo|previousButtonVideo/);
  assert.doesNotMatch(text, /compactAutoplayRenderer/);
});

test('capture_traceability_main_search_no_rule_real_capture_pass_through is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const text = fixtureText();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-search-refinement-card-renderer.json'), 'utf8'));
  const universalCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-search-universal-watch-card-renderer.json'), 'utf8'));
  const directWatchCardCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-search-direct-watch-card-rich-hero-subrenderers.json'), 'utf8'));
  const compactChannelCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-search-compact-channel-renderer.json'), 'utf8'));
  const homeCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-home-rich-lockup-mix-renderer.json'), 'utf8'));
  const homeVideoCapture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-home-rich-video-renderer.json'), 'utf8'));

  for (const raw of ['YT_MAIN.json', 'strange_ytInitialData.json', 'tmp.json', 'logs.json', 'text.txt']) {
    assert.ok(doc.includes(raw), `traceability doc should name ${raw}`);
  }
  assert.match(doc, /`YT_MAIN\.json` is now reclassified as watch initial JSON, not browse\/search proof/);
  assert.ok(files.includes('main-search-refinement-card-renderer.json'));
  assert.ok(files.includes('main-search-universal-watch-card-renderer.json'));
  assert.ok(files.includes('main-search-direct-watch-card-rich-hero-subrenderers.json'));
  assert.ok(files.includes('main-search-compact-channel-renderer.json'));
  assert.ok(files.includes('main-home-rich-lockup-mix-renderer.json'));
  assert.ok(files.includes('main-home-rich-video-renderer.json'));
  assert.equal(capture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(capture.provenance.rendererType, 'searchRefinementCardRenderer');
  assert.equal(universalCapture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(universalCapture.provenance.rendererType, 'universalWatchCardRenderer');
  assert.equal(directWatchCardCapture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(directWatchCardCapture.provenance.rendererType, 'directWatchCardRichHeaderHeroSubrenderers');
  assert.equal(directWatchCardCapture.provenance.directRootObservedInSource, false);
  assert.equal(compactChannelCapture.provenance.source, 'strange_ytInitialData.json');
  assert.equal(compactChannelCapture.provenance.rendererType, 'compactChannelRenderer');
  assert.equal(homeCapture.provenance.source, 'logs.json');
  assert.equal(homeCapture.provenance.rendererType, 'richItemRenderer');
  assert.equal(homeVideoCapture.provenance.source, 'logs.json');
  assert.equal(homeVideoCapture.provenance.rendererType, 'richItemRenderer');
  assert.match(JSON.stringify(homeCapture.renderer), /lockupViewModel/);
  assert.match(JSON.stringify(homeCapture.renderer), /RD41ZY18JqI2A/);
  assert.match(JSON.stringify(homeVideoCapture.renderer), /videoRenderer/);
  assert.match(JSON.stringify(homeVideoCapture.renderer), /UCt4t-jeY85JegMlZ-E5UWtA/);
  assert.match(JSON.stringify(capture.renderer), /Solaris Es/);
  assert.match(JSON.stringify(capture.renderer), /UCm9VWKAFz0aXpuEHPHMae7w/);
  assert.match(JSON.stringify(universalCapture.renderer), /Nyusha/);
  assert.match(JSON.stringify(universalCapture.renderer), /XuHro6TjXww/);
  assert.match(JSON.stringify(directWatchCardCapture.directItems), /watchCardRichHeaderRenderer/);
  assert.match(JSON.stringify(directWatchCardCapture.directItems), /watchCardHeroVideoRenderer/);
  assert.doesNotMatch(JSON.stringify(directWatchCardCapture.directItems), /watchCardRHPanelVideoRenderer/);
  assert.match(JSON.stringify(compactChannelCapture.renderer), /NYUSHA MUSIC/);
  assert.match(JSON.stringify(compactChannelCapture.renderer), /@NYUSHAmusic/);
  assert.doesNotMatch(text, /gridVideoRenderer/);
});

test('capture_traceability_main_guide_no_rule_real_capture_pass_through is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-guide-entry-renderer.json'), 'utf8'));

  assert.ok(doc.includes('guide?prettyPrint=false.json'));
  assert.ok(files.includes('main-guide-entry-renderer.json'));
  assert.equal(capture.provenance.source, 'guide?prettyPrint=false.json');
  assert.equal(capture.provenance.rendererType, 'guideEntryRenderer');
  assert.match(JSON.stringify(capture.renderer), /UC4REwc30LXHzKSkpqSwhR-Q/);
  assert.match(JSON.stringify(capture.renderer), /@DrJango1/);
  assert.doesNotMatch(JSON.stringify(capture.renderer), /guideSubscriptionsSectionRenderer|guideSectionRenderer/);
  assert.doesNotMatch(fixtureFiles().join('\n'), /guide.*section/i);
});

test('capture_traceability_comment_continuation_append_reload_replace is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const sources = jsonFixtureSources();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-comment-append-entity-response.json'), 'utf8'));

  assert.ok(doc.includes('YT_MAIN_NEXT_RESPONSE_COMMENT.json'));
  assert.ok(files.includes('main-comment-append-entity-response.json'));
  assert.ok(files.includes('main-comment-thread-renderer.json'));
  assert.ok(files.includes('main-modern-comment-thread-renderer.json'));
  assert.ok(files.includes('main-next-reload-modern-comments.json'));
  assert.equal(capture.provenance.source, 'YT_MAIN_NEXT_RESPONSE_COMMENT.json');
  assert.equal(capture.provenance.rendererType, 'commentThreadRenderer');
  assert.match(JSON.stringify(capture.response), /appendContinuationItemsAction/);
  assert.match(JSON.stringify(capture.response), /commentEntityPayload/);
  assert.match(JSON.stringify(capture.response), /YOONGI/);
  assert.match(JSON.stringify(capture.response), /UCUooqKoZc3DF4KlktYF_vzQ/);
  assert.ok(sources.includes('comments.json'));
  assert.ok(sources.includes('YT_MAIN_next?prettyPrint.json'));
  assert.ok(sources.includes('YT_MAIN_NEXT.json'));
  assert.ok(sources.includes('YT_MAIN_NEXT_RESPONSE_COMMENT.json'));

  const reload = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-next-reload-modern-comments.json'), 'utf8'));
  assert.equal(reload.provenance.source, 'YT_MAIN_NEXT.json');
  assert.match(JSON.stringify(reload.response), /reloadContinuationItemsCommand/);
  assert.match(JSON.stringify(reload.response), /commentsHeaderRenderer/);
  assert.match(JSON.stringify(reload.response), /commentViewModel/);
});

test('capture_traceability_reel_item_owner_identity is partially extracted but not implementation-ready today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-reel-player-overlay-renderer.json'), 'utf8'));

  assert.ok(doc.includes('reel_item_watch?prettyPrint=False.JSON'));
  assert.ok(files.includes('main-reel-player-overlay-renderer.json'));
  assert.equal(capture.provenance.source, 'reel_item_watch?prettyPrint=False.JSON');
  assert.equal(capture.provenance.rendererType, 'reelPlayerOverlayRenderer');
  assert.match(JSON.stringify(capture.renderer), /UC-6YsZ1GcOMIehkb8eHioUQ/);
  assert.match(JSON.stringify(capture.renderer), /@ElectricRevolution/);

  const rules = read('js/filter_logic.js');
  assert.doesNotMatch(rules, /\n\s*reelPlayerOverlayRenderer\s*:/);
});

test('capture_traceability_kids_browse_public_web_renderer_drift is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const p0Doc = read(docPath);
  const text = fixtureText();
  const sources = jsonFixtureSources();
  const latest = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'kids-latest-compact-video-owner-extension.json'), 'utf8'));
  const browse = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'kids-browse-malformed-fragment-compact-video.json'), 'utf8'));

  assert.ok(doc.includes('yt_kids_latest.json'));
  assert.ok(doc.includes('ytkids_browse?alt=json.json'));
  assert.ok(fixtureFiles().includes('kids-latest-compact-video-owner-extension.json'));
  assert.ok(fixtureFiles().includes('kids-browse-malformed-fragment-compact-video.json'));
  assert.ok(p0Doc.includes('Partially extracted, not satisfied today.'));
  assert.ok(p0Doc.includes('kids-latest-compact-video-owner-extension.json'));
  assert.ok(p0Doc.includes('kids-browse-malformed-fragment-compact-video.json'));
  assert.doesNotMatch(p0Doc, /yt_kids_latest\.json` and `ytkids_browse\?alt=json\.json` remain unextracted/);
  assert.ok(sources.includes('yt_kids_latest.json'));
  assert.ok(sources.includes('ytkids_browse?alt=json.json'));
  assert.equal(latest.provenance.source, 'yt_kids_latest.json');
  assert.equal(browse.provenance.source, 'ytkids_browse?alt=json.json');
  assert.equal(browse.provenance.rawContainer, 'malformed direct JSON with request/log prelude plus balanced JSON fragments');
  assert.deepEqual(
    latest.response.contents.kidsHomeScreenRenderer.anchors[0]
      .anchoredSectionRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents.map(item => item.compactVideoRenderer.videoId),
    ['nGKm7EQ09rE', 'HgwlTY7M4og']
  );
  assert.deepEqual(
    browse.response.contents.kidsLibraryRenderer.anchors[1]
      .anchoredSectionRenderer.content.sectionListRenderer.contents[0]
      .itemSectionRenderer.contents.map(item => item.compactVideoRenderer.videoId),
    ['Gh-XKNuvvC4', 'G-xKXHAWPYU']
  );
  assert.match(text, /kidsVideoOwnerExtension/);
  assert.match(text, /ytkids_browse/);
});

test('capture_traceability_ytm_dom_selector_guardrails is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const html = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-video-card-with-menu.html'), 'utf8');
  const watchPlayerHtml = fs.readFileSync(path.join(fixtureDir, 'ytm-watch-player-dom.html'), 'utf8');
  const watchPanelJson = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'ytm-watch-playlist-panel-json.json'), 'utf8'));
  const browse = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'ytm-browse-channel-list-item-renderer.json'), 'utf8'));

  for (const raw of ['YTM-DOM.html', 'YTM-WATCH PLAYER.html', 'ytm_browse?prettyPrint=false.json', 'YTM-LOGS.txt']) {
    assert.ok(doc.includes(raw), `traceability doc should name ${raw}`);
  }
  assert.ok(files.includes('ytm-dom-video-card-with-menu.html'));
  assert.ok(files.includes('ytm-watch-player-dom.html'));
  assert.ok(files.includes('ytm-watch-playlist-panel-json.json'));
  assert.ok(files.includes('ytm-browse-channel-list-item-renderer.json'));
  assert.ok(files.includes('ytm-logs-playlist-bottom-sheet-stale-identity.html'));
  assert.match(html, /YTM-DOM\.html/);
  assert.match(html, /<ytm-video-with-context-renderer\b/);
  assert.match(html, /href="\/channel\/UCu7TZ_ATWgjgD9IrNLdnYDA"/);
  assert.match(html, /href="\/watch\?v=nUwTnJ8yFXY/);
  assert.match(html, /<ytm-menu-renderer class="media-item-menu">/);
  assert.match(html, /filtertube-quick-block-anchor/);
  assert.match(watchPlayerHtml, /YTM-WATCH PLAYER\.html/);
  assert.match(watchPlayerHtml, /id="movie_player"/);
  assert.match(watchPlayerHtml, /<ytm-watch-player-controls\b/);
  assert.match(watchPlayerHtml, /aria-selected="true"/);
  assert.match(watchPlayerHtml, /data-filtertube-hidden="true"/);
  assert.equal(watchPanelJson.provenance.source, 'YTM.json');
  assert.equal(watchPanelJson.provenance.rendererType, 'ytmWatchPlaylistPanelJsonFragments');
  assert.deepEqual(
    watchPanelJson.response.contents.map(item => item.playlistPanelVideoRenderer.videoId),
    ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']
  );
  assert.doesNotMatch(JSON.stringify(watchPanelJson.response), /NLDFEkIvcbc/);
  assert.equal(browse.provenance.source, 'ytm_browse?prettyPrint=false.json');
  assert.equal(browse.provenance.rendererType, 'channelListItemRenderer');
  assert.match(JSON.stringify(browse.response), /Kshatriya Dharma/);
  assert.match(JSON.stringify(browse.response), /UCjkyfFH-MWZhasolgds05EA/);
  assert.match(files.join('\n'), /ytm-watch-player-dom\.html/);
  assert.match(files.join('\n'), /ytm-logs-playlist-bottom-sheet-stale-identity\.html/);
  assert.match(read(path.join('tests/runtime/fixtures/captures', 'ytm-logs-playlist-bottom-sheet-stale-identity.html')), /@JerryRigEverything/);
});

test('capture_traceability_collab_homepage_avatar_stack_false_positive is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const files = fixtureFiles();
  const html = fs.readFileSync(path.join(fixtureDir, 'main-collab-homepage-avatar-stack.html'), 'utf8');
  const resolvedHtml = fs.readFileSync(path.join(fixtureDir, 'main-collab-resolved-search-card-dialog.html'), 'utf8');

  assert.ok(doc.includes('collab.html'));
  assert.ok(doc.includes('collab_on_homepage.html'));
  assert.ok(doc.includes('collab-mix-selected-row.html'));
  assert.ok(files.includes('main-collab-homepage-avatar-stack.html'));
  assert.ok(files.includes('main-collab-resolved-search-card-dialog.html'));
  assert.match(html, /collab_on_homepage\.html/);
  assert.match(html, /yt-avatar-stack-view-model/);
  assert.match(html, /Veritasium and fern/);
  assert.match(html, /"id":""/);
  assert.doesNotMatch(html, /"id":"UC/);
  assert.match(resolvedHtml, /collab\.html/);
  assert.match(resolvedHtml, /data-filtertube-collab-state="resolved"/);
  assert.match(resolvedHtml, /data-filtertube-blocked-state="pending"/);
  assert.match(resolvedHtml, /UCP7jMXSY2xbc3KCAE0MHQ-A/);
});

test('capture_traceability_post_menu_insertion_boundaries is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const names = fixtureFiles().join('\n');
  const entries = ignoredCaptureEntries();
  const html = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-post-card-with-menu.html'), 'utf8');
  const domsHtml = fs.readFileSync(path.join(fixtureDir, 'main-doms-mutated-main-dom.html'), 'utf8');

  assert.ok(doc.includes('DOMs.html'));
  assert.ok(doc.includes('YTM-DOM.html'));
  assert.ok(doc.includes('post_opt1_logs.txt'));
  assert.ok(doc.includes('`DOMs.html` is partially extracted as a mixed already-mutated Main DOM fixture'));
  assert.ok(doc.includes('absent clean Main post fixture still leave post behavior incomplete'));
  assert.ok(entries.includes('post_opt1_logs.txt'));
  assert.ok(!fs.existsSync(path.join(repoRoot, 'post_opt1_logs.txt')));
  assert.match(names, /ytm-dom-post-card-with-menu\.html/);
  assert.match(names, /main-doms-mutated-main-dom\.html/);
  assert.match(html, /YTM-DOM\.html/);
  assert.match(html, /<ytm-backstage-post-thread-renderer\b/);
  assert.match(html, /<yt-post-header\b/);
  assert.match(html, /href="\/@MajorAlex"/);
  assert.match(html, /aria-label="Action menu"/);
  assert.doesNotMatch(html, /filtertube-menu-item/);
  assert.match(domsHtml, /Reduced from ignored raw capture: DOMs\.html/);
  assert.match(domsHtml, /data-current-filtertube-mutated="true"/);
  assert.match(domsHtml, /filtertube-quick-block-host/);
  assert.match(domsHtml, /filtertube-playlist-menu-fallback-btn/);
  assert.doesNotMatch(domsHtml, /<yt-post-header\b|ytPostHeaderHostActionMenu|href="\/post\//);
});

test('capture_traceability_playlist_json_creator_identity is partially extracted but not satisfied today', () => {
  const doc = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const entries = ignoredCaptureEntries();
  const names = fixtureFiles().join('\n');
  const text = fixtureText();
  const capture = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'main-compact-radio-renderer.json'), 'utf8'));

  assert.equal(entries.filter(entry => entry === 'playlist.json').length, 2);
  assert.ok(doc.includes('playlist.json'));
  assert.ok(doc.includes('playlist-panel-header-mix-dom.html'));
  assert.match(names, /playlist-selected-row\.html/);
  assert.match(names, /playlist-json-player-metadata\.json/);
  assert.match(names, /playlist-panel-header-mix-dom\.html/);
  assert.match(names, /main-compact-radio-renderer\.json/);
  assert.equal(capture.provenance.source, 'playlist.json');
  assert.equal(capture.provenance.rendererType, 'compactRadioRenderer');
  assert.equal(JSON.parse(fs.readFileSync(path.join(fixtureDir, 'playlist-json-player-metadata.json'), 'utf8')).provenance.rendererType, 'playlistPlayerMetadataFragment');
  assert.match(JSON.stringify(capture.renderer), /RDEPo5wWmKEaI/);
  assert.doesNotMatch(JSON.stringify(capture.renderer), /browseEndpoint|canonicalBaseUrl|channelId|externalChannelId/);
  assert.match(text, /Mixes are playlists YouTube makes for you/);
  assert.doesNotMatch(text, /playlistHeaderRenderer|playlistMetadataRenderer|playlistVideoListRenderer/);
});

test('product source has no captureFixtureTraceability implementation yet', () => {
  const source = [
    'js/background.js',
    'js/content_bridge.js',
    'js/filter_logic.js',
    'js/seed.js',
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');

  assert.doesNotMatch(source, /\bcaptureFixtureTraceability\b/);
});
