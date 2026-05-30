import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md';
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

function loadJsonFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
}

test('capture traceability doc matches the current ignored capture corpus counts', () => {
  const doc = read(docPath);
  const entries = ignoredCaptureEntries();
  const unique = [...new Set(entries)];
  const missing = unique.filter(file => !fs.existsSync(path.join(repoRoot, file)));
  const present = unique.filter(file => fs.existsSync(path.join(repoRoot, file)));

  assert.equal(entries.length, 47);
  assert.equal(unique.length, 46);
  assert.equal(present.length, 45);
  assert.deepEqual(missing, ['post_opt1_logs.txt']);

  assert.ok(doc.includes('47 entries'));
  assert.ok(doc.includes('46 unique paths'));
  assert.ok(doc.includes('45 paths present in this local workspace'));
  assert.ok(doc.includes('1 missing historical path: post_opt1_logs.txt'));
  assert.ok(doc.includes('duplicate path is `playlist.json`'));
});

test('capture traceability doc enumerates every committed extracted capture fragment', () => {
  const doc = read(docPath);
  const fixtureFiles = fs.readdirSync(fixtureDir).sort();

  assert.deepEqual(fixtureFiles, [
    'collab-mix-selected-row.html',
    'kids-browse-malformed-fragment-compact-video.json',
    'kids-compact-video-renderer.json',
    'kids-latest-compact-video-owner-extension.json',
    'main-collab-dialog-video-renderer.json',
    'main-collab-homepage-avatar-stack.html',
    'main-collab-resolved-search-card-dialog.html',
    'main-comment-append-entity-response.json',
    'main-comment-thread-renderer.json',
    'main-compact-radio-renderer.json',
    'main-doms-mutated-main-dom.html',
    'main-guide-entry-renderer.json',
    'main-home-rich-lockup-mix-renderer.json',
    'main-home-rich-video-renderer.json',
    'main-modern-comment-thread-renderer.json',
    'main-next-reload-modern-comments.json',
    'main-reel-player-overlay-renderer.json',
    'main-search-compact-channel-renderer.json',
    'main-search-direct-watch-card-rich-hero-subrenderers.json',
    'main-search-refinement-card-renderer.json',
    'main-search-universal-watch-card-renderer.json',
    'main-upnext-feed-watchpage-lockup-continuation.json',
    'main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json',
    'main-upnext-feed-watchpage3-autoplay-previous-end-screen.json',
    'main-watch-autoplay-video-endpoint.json',
    'main-watch-get-watch-playlist-end-screen.json',
    'main-watch-html-embedded-playlist-endscreen-json.json',
    'main-watch-initial-lockup-shorts-json.json',
    'main-watch-player-fragment-metadata.json',
    'main-watch-tmp-playlist-collab-dialog.json',
    'main-watchpage-embedded-post-renderer.json',
    'playlist-json-player-metadata.json',
    'playlist-panel-header-mix-dom.html',
    'playlist-player-endscreen-dom.html',
    'playlist-selected-row.html',
    'ytm-browse-channel-list-item-renderer.json',
    'ytm-compact-playlist-renderer.json',
    'ytm-dom-post-card-with-menu.html',
    'ytm-dom-video-card-with-menu.html',
    'ytm-end-screen-video-renderer.json',
    'ytm-logs-playlist-bottom-sheet-stale-identity.html',
    'ytm-show-sheet-collab-video-with-context-renderer.json',
    'ytm-watch-player-dom.html',
    'ytm-watch-playlist-panel-json.json'
  ]);

  assert.equal(fixtureFiles.length, 44);

  for (const fixture of fixtureFiles) {
    assert.ok(doc.includes(`\`${fixture}\``), `traceability doc should cite ${fixture}`);
  }
});

test('JSON extracted fixture provenance is pinned to raw source captures', () => {
  const jsonFixtures = fs.readdirSync(fixtureDir)
    .filter(file => file.endsWith('.json'))
    .sort();

  const provenance = Object.fromEntries(jsonFixtures.map(file => {
    const capture = loadJsonFixture(file);
    return [file, {
      source: capture.provenance?.source,
      rendererType: capture.provenance?.rendererType
    }];
  }));

  assert.deepEqual(provenance, {
    'kids-browse-malformed-fragment-compact-video.json': {
      source: 'ytkids_browse?alt=json.json',
      rendererType: 'compactVideoRenderer'
    },
    'kids-compact-video-renderer.json': {
      source: 'YT_KIDS.json',
      rendererType: 'compactVideoRenderer'
    },
    'kids-latest-compact-video-owner-extension.json': {
      source: 'yt_kids_latest.json',
      rendererType: 'compactVideoRenderer'
    },
    'main-collab-dialog-video-renderer.json': {
      source: 'collab.json',
      rendererType: 'videoRenderer'
    },
    'main-comment-append-entity-response.json': {
      source: 'YT_MAIN_NEXT_RESPONSE_COMMENT.json',
      rendererType: 'commentThreadRenderer'
    },
    'main-comment-thread-renderer.json': {
      source: 'comments.json',
      rendererType: 'commentThreadRenderer'
    },
    'main-compact-radio-renderer.json': {
      source: 'playlist.json',
      rendererType: 'compactRadioRenderer'
    },
    'main-guide-entry-renderer.json': {
      source: 'guide?prettyPrint=false.json',
      rendererType: 'guideEntryRenderer'
    },
    'main-home-rich-lockup-mix-renderer.json': {
      source: 'logs.json',
      rendererType: 'richItemRenderer'
    },
    'main-home-rich-video-renderer.json': {
      source: 'logs.json',
      rendererType: 'richItemRenderer'
    },
    'main-modern-comment-thread-renderer.json': {
      source: 'YT_MAIN_next?prettyPrint.json',
      rendererType: 'commentThreadRenderer'
    },
    'main-next-reload-modern-comments.json': {
      source: 'YT_MAIN_NEXT.json',
      rendererType: 'reloadModernCommentThreadRenderer'
    },
    'main-reel-player-overlay-renderer.json': {
      source: 'reel_item_watch?prettyPrint=False.JSON',
      rendererType: 'reelPlayerOverlayRenderer'
    },
    'main-search-direct-watch-card-rich-hero-subrenderers.json': {
      source: 'strange_ytInitialData.json',
      rendererType: 'directWatchCardRichHeaderHeroSubrenderers'
    },
    'main-search-compact-channel-renderer.json': {
      source: 'strange_ytInitialData.json',
      rendererType: 'compactChannelRenderer'
    },
    'main-search-refinement-card-renderer.json': {
      source: 'strange_ytInitialData.json',
      rendererType: 'searchRefinementCardRenderer'
    },
    'main-search-universal-watch-card-renderer.json': {
      source: 'strange_ytInitialData.json',
      rendererType: 'universalWatchCardRenderer'
    },
    'main-upnext-feed-watchpage-lockup-continuation.json': {
      source: 'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
      rendererType: 'watchNextFeedLockupViewModel'
    },
    'main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json': {
      source: 'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
      rendererType: 'watchNextFeedClaimPrefacedLockupViewModel'
    },
    'main-upnext-feed-watchpage3-autoplay-previous-end-screen.json': {
      source: 'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
      rendererType: 'watchpage3AutoplayPreviousEndpoint'
    },
    'main-watch-autoplay-video-endpoint.json': {
      source: 'get_watch?prettyPrint=false.json',
      rendererType: 'watchAutoplayEndpoint'
    },
    'main-watch-get-watch-playlist-end-screen.json': {
      source: 'get_watch?prettyPrint=false.json',
      rendererType: 'watchNextResponse'
    },
    'main-watch-html-embedded-playlist-endscreen-json.json': {
      source: 'YT_MAIN_WATCH.html',
      rendererType: 'watchHtmlEmbeddedPlaylistEndScreenJson'
    },
    'main-watch-initial-lockup-shorts-json.json': {
      source: 'YT_MAIN.json',
      rendererType: 'watchInitialLockupAndShortsJson'
    },
    'main-watch-player-fragment-metadata.json': {
      source: 'YT_MAIN.json',
      rendererType: 'watchPlayerMetadataFragment'
    },
    'main-watch-tmp-playlist-collab-dialog.json': {
      source: 'tmp.json',
      rendererType: 'watchNextResponse'
    },
    'main-watchpage-embedded-post-renderer.json': {
      source: 'watchpage.json',
      rendererType: 'postRenderer'
    },
    'playlist-json-player-metadata.json': {
      source: 'playlist.json',
      rendererType: 'playlistPlayerMetadataFragment'
    },
    'ytm-browse-channel-list-item-renderer.json': {
      source: 'ytm_browse?prettyPrint=false.json',
      rendererType: 'channelListItemRenderer'
    },
    'ytm-compact-playlist-renderer.json': {
      source: 'YTM.json',
      rendererType: 'compactPlaylistRenderer'
    },
    'ytm-watch-playlist-panel-json.json': {
      source: 'YTM.json',
      rendererType: 'ytmWatchPlaylistPanelJsonFragments'
    },
    'ytm-end-screen-video-renderer.json': {
      source: 'YTM-XHR.json',
      rendererType: 'endScreenVideoRenderer'
    },
    'ytm-show-sheet-collab-video-with-context-renderer.json': {
      source: 'YTM-XHR.json',
      rendererType: 'videoWithContextRenderer'
    }
  });
});

test('traceability doc names represented raw sources and unextracted high-priority families', () => {
  const doc = read(docPath);

  for (const represented of [
    'YTM.json',
    'collab.html',
    'collab.json',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'yt_kids_latest.json',
    'ytkids_browse?alt=json.json',
    'reel_item_watch?prettyPrint=False.JSON',
    'comments.json',
    'YT_MAIN_next?prettyPrint.json',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_NEXT_RESPONSE_COMMENT.json',
    'playlist.json',
    'strange_ytInitialData.json',
    'logs.json',
    'guide?prettyPrint=false.json',
    'YT_MAIN.json',
    'get_watch?prettyPrint=false.json',
    'tmp.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json',
    'watchpage.json',
    'DOMs.html',
    'YTM-DOM.html',
    'YTM-WATCH PLAYER.html',
    'ytm_browse?prettyPrint=false.json',
    'YTM-LOGS.txt',
    'playlist.html',
    'collab_in_playlist_mix.html'
  ]) {
    assert.ok(doc.includes(represented), `doc should list represented raw source ${represented}`);
  }

  for (const missingHighPriority of [
    'YT_MAIN_WATCH.html',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE.json',
    'YT_MAIN.json',
    'YTM-DOM.html',
    'YTM-WATCH PLAYER.html',
    'ytm_browse?prettyPrint=false.json',
    'collab_on_homepage.html',
    'DOMs.html',
    'post_opt1_logs.txt'
  ]) {
    assert.ok(doc.includes(missingHighPriority), `doc should list unextracted high-priority source ${missingHighPriority}`);
  }
});

test('traceability doc defines future capture fixture gates before behavior changes', () => {
  const doc = read(docPath);

  for (const gate of [
    'raw source capture',
    'minimal committed fixture path',
    'renderer or DOM selector path',
    'settings mode: disabled | blocklist | whitelist | Kids | YTM',
    'expected decision: pass-through | hide | preserve shell | metadata-only | harvest-only',
    'side effects: map write | stats write | DOM rerun | observer/timer | network fetch',
    'negative fixture: non-matching sibling content remains visible'
  ]) {
    assert.ok(doc.includes(gate), `missing traceability gate ${gate}`);
  }

  for (const fixtureName of [
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
  ]) {
    assert.ok(doc.includes(fixtureName), `missing future fixture ${fixtureName}`);
  }
});
