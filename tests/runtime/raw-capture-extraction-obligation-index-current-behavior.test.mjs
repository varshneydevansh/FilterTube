import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md';
const runtimeFiles = [
  'js/background.js',
  'js/content_bridge.js',
  'js/content/dom_fallback.js',
  'js/filter_logic.js',
  'js/seed.js',
  'build.js'
];

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

function uniqueIgnoredCaptures() {
  return [...new Set(ignoredCaptureEntries())];
}

function doc() {
  return read(docPath);
}

function parseRows() {
  const rows = new Map();
  for (const line of doc().split(/\r?\n/)) {
    if (!line.startsWith('| `')) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    const raw = cells[0]?.replace(/^`|`$/g, '');
    rows.set(raw, {
      raw,
      family: cells[1]?.replace(/^`|`$/g, ''),
      present: cells[2],
      coverage: cells[3],
      requiredProof: cells[4],
      releaseInputAllowed: cells[5],
      status: cells[6]
    });
  }
  return rows;
}

test('raw capture extraction index covers every unique ignored capture path exactly once', () => {
  const entries = ignoredCaptureEntries();
  const unique = uniqueIgnoredCaptures();
  const rows = parseRows();

  assert.equal(entries.length, 47);
  assert.equal(unique.length, 46);
  assert.equal(rows.size, unique.length);

  for (const raw of unique) {
    assert.ok(rows.has(raw), `missing extraction row for ${raw}`);
  }
});

test('raw capture extraction index records current corpus counts and release boundary', () => {
  const source = doc();

  assert.match(source, /47 ignored capture entries/);
  assert.match(source, /46 unique ignored capture paths/);
  assert.match(source, /45 present in this local workspace/);
  assert.match(source, /1 missing historical path/);
  assert.match(source, /releaseInputAllowed: false/);
  assert.match(source, /Loose substring matches are forbidden/);
  assert.match(source, /source tier rather than source-of-truth wording/i);
});

test('raw capture extraction index uses explicit fixture provenance for partial rows', () => {
  const rows = parseRows();

  assert.equal(rows.get('post_opt1_logs.txt').present, 'no');
  assert.equal(rows.get('post_opt1_logs.txt').status, 'missing-historical');

  assert.equal(rows.get('playlist.js').family, 'historical-scratch');
  assert.equal(rows.get('playlist.js').coverage, 'none');
  assert.equal(rows.get('playlist.js').status, 'unextracted');
  assert.match(rows.get('playlist.js').requiredProof, /ignored JavaScript-like evidence/);

  assert.equal(rows.get('playlist.json').coverage, 'partial: `main-compact-radio-renderer.json`, `playlist-json-player-metadata.json`');
  assert.equal(rows.get('playlist.html').coverage, 'partial: `playlist-panel-header-mix-dom.html`, `playlist-player-endscreen-dom.html`, `playlist-selected-row.html`');
  assert.equal(rows.get('collab.html').coverage, 'partial: `main-collab-resolved-search-card-dialog.html`');
  assert.equal(rows.get('collab.html').status, 'partial-extracted');
  assert.match(rows.get('collab.html').requiredProof, /resolved four-channel roster/);
  assert.equal(rows.get('collab_in_playlist_mix.html').coverage, 'partial: `collab-mix-selected-row.html`');
  assert.equal(rows.get('collab_on_homepage.html').coverage, 'partial: `main-collab-homepage-avatar-stack.html`');
  assert.equal(rows.get('yt_kids_latest.json').coverage, 'partial: `kids-latest-compact-video-owner-extension.json`');
  assert.equal(rows.get('yt_kids_latest.json').status, 'partial-extracted');
  assert.equal(rows.get('ytkids_browse?alt=json.json').coverage, 'partial: `kids-browse-malformed-fragment-compact-video.json`');
  assert.equal(rows.get('ytkids_browse?alt=json.json').status, 'partial-extracted');
  assert.match(rows.get('ytkids_browse?alt=json.json').requiredProof, /malformed direct-JSON container warning/);
  assert.equal(rows.get('watchpage.json').coverage, 'partial: `main-watchpage-embedded-post-renderer.json`');
  assert.equal(rows.get('watchpage.json').status, 'partial-extracted');
  assert.match(rows.get('watchpage.json').requiredProof, /Markdown\/`var ytInitialData` container warning/);
  assert.match(rows.get('watchpage.json').requiredProof, /embedded `FEwhat_to_watch`/);
  assert.match(rows.get('watchpage.json').requiredProof, /not watch\/next behavior proof/);
  assert.equal(rows.get('DOMs.html').family, 'mixed-main-dom');
  assert.equal(rows.get('DOMs.html').coverage, 'partial: `main-doms-mutated-main-dom.html`');
  assert.equal(rows.get('DOMs.html').status, 'partial-extracted');
  assert.match(rows.get('DOMs.html').requiredProof, /already-mutated Main DOM fixture/);
  assert.match(rows.get('DOMs.html').requiredProof, /does not satisfy clean Main post\/community insertion proof/);
  assert.equal(rows.get('get_watch?prettyPrint=false.json').coverage, 'partial: `main-watch-get-watch-playlist-end-screen.json`, `main-watch-autoplay-video-endpoint.json`');
  assert.equal(rows.get('get_watch?prettyPrint=false.json').status, 'partial-extracted');
  assert.match(rows.get('get_watch?prettyPrint=false.json').requiredProof, /Autoplay endpoint objects are extracted/);
  assert.match(rows.get('get_watch?prettyPrint=false.json').requiredProof, /real `compactAutoplayRenderer` shape/);
  assert.equal(rows.get('tmp.json').family, 'main-watch-next');
  assert.equal(rows.get('tmp.json').coverage, 'partial: `main-watch-tmp-playlist-collab-dialog.json`');
  assert.equal(rows.get('tmp.json').status, 'partial-extracted');
  assert.match(rows.get('tmp.json').requiredProof, /mixed `var ytInitialData` browse assignment plus later get-watch array/);
  assert.match(rows.get('tmp.json').requiredProof, /UCGnjeahCJW1AF34HBmQTJ-Q/);
  assert.match(rows.get('tmp.json').requiredProof, /UCYLNGLIzMhRTi6ZOLjAPSmw/);
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json').coverage, 'partial: `main-upnext-feed-watchpage3-autoplay-previous-end-screen.json`');
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json').requiredProof, /embedded `ytInitialData`/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json').requiredProof, /previousButtonVideo/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json').requiredProof, /no `compactAutoplayRenderer`/);
  assert.equal(rows.get('YT_MAIN_WATCH.html').coverage, 'partial: `main-watch-html-embedded-playlist-endscreen-json.json`; classification: `docs/audit/FILTERTUBE_MAIN_WATCH_HTML_ENDSCREEN_SHAPE_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/main-watch-html-endscreen-shape-classification-current-behavior.test.mjs`');
  assert.equal(rows.get('YT_MAIN_WATCH.html').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN_WATCH.html').requiredProof, /embedded watch HTML JSON/);
  assert.match(rows.get('YT_MAIN_WATCH.html').requiredProof, /playlist-panel and player-overlay end-screen rows/);
  assert.match(rows.get('YT_MAIN_WATCH.html').requiredProof, /zero player DOM end-screen selector tokens/);
  assert.match(rows.get('extracted_watch_paths.txt').coverage, /classification-only:/);
  assert.equal(rows.get('extracted_watch_paths.txt').status, 'classified-unextracted');
  assert.match(rows.get('extracted_watch_paths.txt').requiredProof, /derived text path dump/);
  assert.match(rows.get('extracted_watch_paths.txt').requiredProof, /not raw JSON/);
  assert.match(rows.get('extracted_watch_paths.txt').requiredProof, /not rendered DOM/);
  assert.match(rows.get('extracted_watch_paths.txt').requiredProof, /674 path\/value rows/);
  assert.equal(rows.get('YT_MAIN_NEXT.json').coverage, 'partial: `main-next-reload-modern-comments.json`');
  assert.equal(rows.get('YT_MAIN_NEXT.json').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN_NEXT.json').requiredProof, /direct JSON comment-reload evidence/);
  assert.match(rows.get('YT_MAIN_NEXT.json').requiredProof, /zero parsed watch rail\/playlist\/end-screen\/autoplay keys/);
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').coverage, 'partial: `main-upnext-feed-watchpage-lockup-continuation.json`');
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').requiredProof, /prose-plus-balanced-fragments/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').requiredProof, /watch-next-feed/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').requiredProof, /20 `lockupViewModel` rows/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE.json').requiredProof, /Mix playlist row lacks creator identity/);
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').coverage, 'partial: `main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json`');
  assert.equal(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').requiredProof, /claim-prefaced prose-plus-one-fragment/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').requiredProof, /not parsed collaborator proof/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').requiredProof, /three `shortsLockupViewModel` rows/);
  assert.match(rows.get('YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json').requiredProof, /primary decorated-avatar channel row/);
  assert.equal(rows.get('YT_MAIN.json').family, 'main-watch-next');
  assert.equal(rows.get('YT_MAIN.json').coverage, 'partial: `main-watch-initial-lockup-shorts-json.json`, `main-watch-player-fragment-metadata.json`');
  assert.equal(rows.get('YT_MAIN.json').status, 'partial-extracted');
  assert.match(rows.get('YT_MAIN.json').requiredProof, /mixed-capture classification/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /20 `lockupViewModel` rows/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /30 `shortsLockupViewModel` rows/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /player metadata fragment/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /metadata-only pass-through/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /endscreenElementRenderer/);
  assert.match(rows.get('YT_MAIN.json').requiredProof, /not Main browse\/search completion proof/);
  assert.equal(rows.get('strange_ytInitialData.json').coverage, 'partial: `main-search-refinement-card-renderer.json`, `main-search-universal-watch-card-renderer.json`, `main-search-direct-watch-card-rich-hero-subrenderers.json`, `main-search-compact-channel-renderer.json`');
  assert.match(rows.get('strange_ytInitialData.json').requiredProof, /compact channel split authority/);
  assert.match(rows.get('strange_ytInitialData.json').requiredProof, /direct rich-header\/hero subrenderer gap/);
  assert.equal(rows.get('YTM-DOM.html').coverage, 'partial: `ytm-dom-post-card-with-menu.html`, `ytm-dom-video-card-with-menu.html`');
  assert.equal(rows.get('YTM-WATCH PLAYER.html').coverage, 'partial: `ytm-watch-player-dom.html`');
  assert.equal(rows.get('YTM-WATCH PLAYER.html').status, 'partial-extracted');
  assert.match(rows.get('YTM-WATCH PLAYER.html').requiredProof, /already FilterTube-mutated/);
  assert.match(rows.get('YTM-WATCH PLAYER.html').requiredProof, /selected hidden playlist row/);
  assert.match(rows.get('YTM-WATCH PLAYER.html').requiredProof, /no-playback side-effect proof/);
  assert.equal(rows.get('ytm_browse?prettyPrint=false.json').coverage, 'partial: `ytm-browse-channel-list-item-renderer.json`');
  assert.equal(rows.get('ytm_browse?prettyPrint=false.json').status, 'partial-extracted');
  assert.match(rows.get('ytm_browse?prettyPrint=false.json').requiredProof, /983 parsed `channelListItemRenderer` rows/);
  assert.match(rows.get('ytm_browse?prettyPrint=false.json').requiredProof, /channel-map side effects/);
  assert.equal(rows.get('YTM-LOGS.txt').coverage, 'partial: `ytm-logs-playlist-bottom-sheet-stale-identity.html`');
  assert.equal(rows.get('YTM-LOGS.txt').status, 'partial-extracted');
  assert.match(rows.get('YTM-LOGS.txt').requiredProof, /visible card owner is `@KillTony`/);
  assert.match(rows.get('YTM-LOGS.txt').requiredProof, /UCWFKCr40YwOZQx8FHU_ZqqQ/);
  assert.match(rows.get('YTM-LOGS.txt').requiredProof, /trigger-card\/menu-key authority/);
});

test('raw capture extraction index keeps every raw capture out of release inputs', () => {
  const rows = parseRows();

  for (const row of rows.values()) {
    assert.equal(row.releaseInputAllowed, 'false', `${row.raw} must not be a release input`);
  }

  for (const token of [
    'rawCaptureExtractionAuthority',
    'captureFixtureTraceabilityDecision',
    'rawEvidenceReleaseInputGate'
  ]) {
    assert.match(doc(), new RegExp(token));
  }
});

test('raw capture extraction authority is not implemented in runtime source yet', () => {
  const runtime = runtimeFiles.map((file) => read(file)).join('\n');

  for (const token of [
    'rawCaptureExtractionAuthority',
    'captureFixtureTraceabilityDecision',
    'rawEvidenceReleaseInputGate'
  ]) {
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
