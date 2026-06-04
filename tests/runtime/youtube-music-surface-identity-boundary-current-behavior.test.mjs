import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_YOUTUBE_MUSIC_SURFACE_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const fixtureDir = path.join(repoRoot, 'tests/runtime/fixtures/captures');
const ytmFamilyDocs = [
  'docs/audit/FILTERTUBE_YOUTUBE_MUSIC_SURFACE_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_YTM_BROWSE_CHANNEL_LIST_ITEM_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_DOM_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_OBSERVER_TIMER_BUDGET_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_WHITELIST_SELECTED_ROW_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_YTM_WATCH_PLAYLIST_PANEL_JSON_PARITY_CURRENT_BEHAVIOR_2026-05-23.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    videoChannelMap: {},
    channelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function loadCapture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8'));
}

function runEngine(input, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(input, baseSettings(settings), 'youtube-music-surface-identity-boundary');
}

function runCapturedRenderer(file, rendererType, settings) {
  const capture = loadCapture(file);
  assert.equal(capture.provenance.rendererType, rendererType);
  const input = { contents: [{ [rendererType]: capture.renderer }] };
  const output = runEngine(input, settings);
  return { capture, input, output };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('YouTube Music surface identity boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for YTM surface authority/);

  assert.match(methodGap, /repo-wide lexical callables: 5797/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5797/);

  assert.equal(ytmFamilyDocs.length, 12);
  for (const familyDocPath of ytmFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5797/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5797/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  for (const [file, lines, bytes, hash] of [
    ['js/background.js', 6641, 298986, '837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd'],
    ['js/content/bridge_settings.js',  1113,  44087, 'f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853'],
    ['js/content/dom_extractors.js', 1137, 46896, 'adf2c04f14f0f3bb44556e216af25aca8ff182dfa569c248ddb150d0cca38a4e'],
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
    ['js/content_bridge.js', 13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d'],
    ['js/content/dom_fallback.js', 5030, 235555, 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5']
  ]) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`\`${file}\``), `doc should cite ${file}`);
  }

  for (const artifact of [
    'docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md',
    'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_ROUTE_IDENTITY_DECISION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'
  ]) {
    assert.ok(doc.includes(artifact) || read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md').includes(artifact), `missing context artifact ${artifact}`);
  }
});

test('YouTube Music source and effect blocks remain pinned', () => {
  const doc = read(docPath);
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const extractors = read('js/content/dom_extractors.js');
  const filterLogic = read('js/filter_logic.js');
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');

  const selectorBlock = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');
  const bridgeProfileBlock = sliceBetween(bridgeSettings, 'const profileType = (() => {', 'const forceRefresh = options');
  const backgroundKidsBlock = sliceBetween(background, 'function isKidsUrl(url) {', 'function buildProfilesV4FromLegacyState');
  const videoWithContextBlock = sliceBetween(filterLogic, 'videoWithContextRenderer: {', 'description: [');
  const nestedPreferenceBlock = sliceBetween(filterLogic, 'const preferredNestedRenderers = [', 'for (const nestedRendererType');
  const sheetLikeBlock = sliceBetween(bridge, 'const extractListItemsFromSheetLikeCommand = (command) => {', 'function hydrateCollaboratorsFromRendererData(card)');
  const ytmVideoCardBlock = sliceBetween(bridge, 'const isYtmVideoLikeCard = (', '// SPECIAL CASE: Detect if this is a Post card');
  const mappedFallbackBlock = sliceBetween(
    bridge,
    "if (String(cardTag || '').startsWith('ytm-') && mappedFallbackId) {",
    "console.log('FilterTube: Falling back to main-world lookup for video:'"
  );
  const ytmStyleBlock = sliceBetween(fallback, 'if (settings.hideHomeFeed) {', 'style.textContent = rules.join');
  const ytmChannelSelectorBlock = sliceBetween(
    fallback,
    "if (!channelElement && (\n                elementTag === 'ytm-rich-item-renderer'",
    "if (!channelElement) {\n                channelElement = element.querySelector("
  );

  for (const [label, block, lines, bytes] of [
    ['VIDEO_CARD_SELECTORS block', selectorBlock, 51, 1722],
    ['bridge profile classifier block', bridgeProfileBlock, 10, 293],
    ['background isKidsUrl block', backgroundKidsBlock, 5, 100],
    ['filter_logic videoWithContextRenderer rule block', videoWithContextBlock, 17, 1109],
    ['filter_logic rich item nested renderer preference block', nestedPreferenceBlock, 22, 932],
    ['content_bridge sheet-like collaborator extraction cluster', sheetLikeBlock, 239, 12385],
    ['content_bridge YTM video card extraction branch', ytmVideoCardBlock, 86, 4630],
    ['content_bridge mapped YTM fallback branch', mappedFallbackBlock, 33, 1503],
    ['dom_fallback YTM style selector cluster', ytmStyleBlock, 304, 11188],
    ['dom_fallback YTM channel selector cluster', ytmChannelSelectorBlock, 38, 2211]
  ]) {
    assert.equal(block.split(/\r?\n/).length, lines, `${label} line count changed`);
    assert.equal(Buffer.byteLength(block), bytes, `${label} byte count changed`);
    assert.ok(doc.includes(`${lines}`), `doc should include line count for ${label}`);
    assert.ok(doc.includes(`${bytes}`), `doc should include byte count for ${label}`);
  }

  assert.equal(countLiteral(selectorBlock, 'ytm-'), 14);
  assert.equal(countLiteral(bridgeProfileBlock, 'youtubekids.com'), 1);
  assert.equal(countLiteral(bridgeProfileBlock, 'music.youtube.com'), 0);
  assert.equal(countLiteral(backgroundKidsBlock, 'youtubekids.com'), 1);
  assert.equal(countLiteral(backgroundKidsBlock, 'music.youtube.com'), 0);
  assert.equal(countLiteral(filterLogic, 'videoWithContextRenderer'), 10);
  assert.equal(countLiteral(filterLogic, 'compactPlaylistRenderer'), 1);
  assert.equal(countLiteral(filterLogic, 'showDialogCommand'), 11);
  assert.equal(countLiteral(sheetLikeBlock, 'showSheetCommand'), 14);
  assert.equal(countLiteral(sheetLikeBlock, 'showDialogCommand'), 12);
  assert.equal(countLiteral(sheetLikeBlock, 'videoWithContextRenderer'), 7);
  assert.equal(countLiteral(ytmVideoCardBlock, 'ytm-'), 23);
  assert.equal(countLiteral(mappedFallbackBlock, 'mainworld'), 1);
  assert.equal(countLiteral(ytmStyleBlock, 'ytm-'), 22);
  assert.equal(countLiteral(ytmChannelSelectorBlock, 'ytm-'), 23);

  for (const phrase of [
    'YTM surface identity source/effect blocks: 10',
    'VIDEO_CARD_SELECTORS block `ytm-` tokens: 14',
    'bridge profile classifier `music.youtube.com` tokens: 0',
    'background `isKidsUrl()` `music.youtube.com` tokens: 0',
    'filter_logic total `compactPlaylistRenderer` tokens: 1',
    'content_bridge sheet-like collaborator block `showSheetCommand` tokens: 14',
    'content_bridge mapped YTM fallback block `mainworld` tokens: 1',
    'Runtime YTM surface identity fixtures: 10'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('YTM host scope is generic YouTube scope and compiled as Main today', () => {
  const doc = read(docPath);
  const background = read('js/background.js');
  const bridgeSettings = read('js/content/bridge_settings.js');

  const manifestCounts = {
    'manifest.json': [4, 4],
    'manifest.chrome.json': [4, 4],
    'manifest.firefox.json': [3, 3],
    'manifest.opera.json': [4, 4]
  };

  for (const [file, [youtubeCount, kidsCount]] of Object.entries(manifestCounts)) {
    const source = read(file);
    assert.equal(countLiteral(source, '*://*.youtube.com/*'), youtubeCount, `${file} youtube pattern count changed`);
    assert.equal(countLiteral(source, '*://*.youtubekids.com/*'), kidsCount, `${file} kids pattern count changed`);
    assert.equal(countLiteral(source, 'music.youtube.com'), 0, `${file} should not name music host explicitly`);
  }

  assert.match(bridgeSettings, /host\.includes\('youtubekids\.com'\) \? 'kids' : 'main'/);
  assert.match(background, /profileType === 'kids' \|\| isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(background, /requestedProfile === 'kids' \? 'kids' : \(requestedProfile === 'main' \? 'main' : \(isKidsUrl\(senderUrl\) \? 'kids' : 'main'\)\)/);

  const classifyHost = (host) => String(host || '').toLowerCase().includes('youtubekids.com') ? 'kids' : 'main';
  assert.equal(classifyHost('music.youtube.com'), 'main');
  assert.equal(classifyHost('m.youtube.com'), 'main');
  assert.equal(classifyHost('www.youtubekids.com'), 'kids');

  assert.match(doc, /Manifest generic `\*\.youtube\.com` match\/host patterns: Chrome 4, generic 4, Opera 4, Firefox 3/);
  assert.match(doc, /Manifest explicit `music\.youtube\.com` patterns: 0/);
  assert.match(doc, /YTM is covered by generic `\*\.youtube\.com` manifest patterns and is classified as Main/);
});

test('YTM JSON renderer fixtures preserve direct support and partial gaps', () => {
  const directInput = {
    contents: [{
      videoWithContextRenderer: {
        videoId: 'ytmDirect01',
        headline: { runs: [{ text: 'Direct YTM Block Target' }] },
        shortBylineText: {
          runs: [{
            text: 'Blocked Music Channel',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UCaaaaaaaaaaaaaaaaaaaaaa',
                canonicalBaseUrl: '/@blockedmusic'
              }
            }
          }]
        }
      }
    }]
  };

  assert.deepEqual(plain(runEngine(directInput, {
    filterKeywords: [keyword('Direct YTM Block Target')]
  })), { contents: [] });
  assert.deepEqual(plain(runEngine(directInput, {
    filterChannels: [{ id: 'UCaaaaaaaaaaaaaaaaaaaaaa', handle: '@blockedmusic' }]
  })), { contents: [] });

  const compactPlaylist = runCapturedRenderer('ytm-compact-playlist-renderer.json', 'compactPlaylistRenderer', {
    filterKeywords: [keyword('Mix danc pop')],
    filterChannels: [{ id: 'UCvjXCedQa9pCEMzeLKMc20A', handle: '@fabrizzioandresolguinolgui5752' }]
  });
  assert.equal(compactPlaylist.capture.provenance.source, 'YTM.json');
  assert.deepEqual(plain(compactPlaylist.output), plain(compactPlaylist.input));

  const watchPanel = loadCapture('ytm-watch-playlist-panel-json.json');
  assert.equal(watchPanel.provenance.source, 'YTM.json');
  assert.equal(watchPanel.provenance.rendererType, 'ytmWatchPlaylistPanelJsonFragments');
  assert.deepEqual(
    watchPanel.response.contents.map(item => item.playlistPanelVideoRenderer.videoId),
    ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']
  );
  assert.doesNotMatch(JSON.stringify(watchPanel.response), /NLDFEkIvcbc/);

  const showSheetBlock = runCapturedRenderer('ytm-show-sheet-collab-video-with-context-renderer.json', 'videoWithContextRenderer', {
    filterChannels: [{ id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@beele' }]
  });
  assert.equal(showSheetBlock.capture.provenance.source, 'YTM-XHR.json');
  assert.match(JSON.stringify(showSheetBlock.capture.renderer), /showSheetCommand/);
  assert.deepEqual(plain(showSheetBlock.output), plain(showSheetBlock.input));

  const showSheetWhitelist = runCapturedRenderer('ytm-show-sheet-collab-video-with-context-renderer.json', 'videoWithContextRenderer', {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@beele' }]
  });
  assert.deepEqual(plain(showSheetWhitelist.output), { contents: [] });

  const endScreen = runCapturedRenderer('ytm-end-screen-video-renderer.json', 'endScreenVideoRenderer', {
    filterKeywords: [keyword('Shakira')]
  });
  assert.equal(endScreen.capture.provenance.source, 'YTM-XHR.json');
  assert.deepEqual(plain(endScreen.output), { contents: [] });
});

test('YTM DOM and raw capture proof remains partial', () => {
  const doc = read(docPath);
  const traceability = read('docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md');
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const videoHtml = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-video-card-with-menu.html'), 'utf8');
  const postHtml = fs.readFileSync(path.join(fixtureDir, 'ytm-dom-post-card-with-menu.html'), 'utf8');
  const watchPlayerHtml = fs.readFileSync(path.join(fixtureDir, 'ytm-watch-player-dom.html'), 'utf8');
  const watchPanelJson = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'ytm-watch-playlist-panel-json.json'), 'utf8'));
  const browse = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'ytm-browse-channel-list-item-renderer.json'), 'utf8'));

  assert.match(videoHtml, /YTM-DOM\.html/);
  assert.match(videoHtml, /<ytm-video-with-context-renderer\b/);
  assert.match(videoHtml, /href="\/channel\/UCu7TZ_ATWgjgD9IrNLdnYDA"/);
  assert.match(videoHtml, /href="\/watch\?v=nUwTnJ8yFXY/);
  assert.match(videoHtml, /<ytm-menu-renderer class="media-item-menu">/);
  assert.match(videoHtml, /filtertube-quick-block-anchor/);

  assert.match(postHtml, /YTM-DOM\.html/);
  assert.match(postHtml, /<ytm-backstage-post-thread-renderer\b/);
  assert.match(postHtml, /<yt-post-header\b/);
  assert.match(postHtml, /href="\/@MajorAlex"/);
  assert.match(postHtml, /aria-label="Action menu"/);
  assert.doesNotMatch(postHtml, /filtertube-menu-item/);

  assert.match(watchPlayerHtml, /YTM-WATCH PLAYER\.html/);
  assert.match(watchPlayerHtml, /id="movie_player"/);
  assert.match(watchPlayerHtml, /<ytm-watch-player-controls\b/);
  assert.match(watchPlayerHtml, /<ytm-playlist-panel-video-renderer\b/);
  assert.match(watchPlayerHtml, /aria-selected="true"/);
  assert.match(watchPlayerHtml, /data-filtertube-hidden="true"/);

  assert.equal(watchPanelJson.provenance.source, 'YTM.json');
  assert.equal(watchPanelJson.provenance.rendererType, 'ytmWatchPlaylistPanelJsonFragments');
  assert.deepEqual(watchPanelJson.provenance.selectedRendererVideoIds, ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']);

  assert.equal(browse.provenance.source, 'ytm_browse?prettyPrint=false.json');
  assert.equal(browse.provenance.rendererType, 'channelListItemRenderer');
  assert.equal(browse.provenance.rendererCount, 983);
  assert.match(JSON.stringify(browse.response), /Kshatriya Dharma/);
  assert.match(JSON.stringify(browse.response), /@OfficialNSYNC/);

  for (const raw of ['YTM-DOM.html', 'YTM-WATCH PLAYER.html', 'ytm_browse?prettyPrint=false.json', 'YTM-LOGS.txt']) {
    assert.ok(traceability.includes(raw), `traceability should name ${raw}`);
    assert.ok(rawIndex.includes(raw), `raw extraction index should name ${raw}`);
    assert.ok(fs.existsSync(path.join(repoRoot, raw)), `${raw} should exist as local raw evidence`);
    assert.equal(git(['ls-files', raw]).length, 0, `${raw} should not be tracked source`);
  }

  assert.match(doc, /watch\/player pass-through, no-playback side-effect proof, disabled\/no-work browse budget, whitelist policy, and route-scoped negative sibling proof are still incomplete/);
});

test('YTM DOM selector and content bridge paths are not a YTM authority yet', () => {
  const doc = read(docPath);
  const extractors = read('js/content/dom_extractors.js');
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const selectorBlock = sliceBetween(extractors, 'const VIDEO_CARD_SELECTORS = [', '].join');

  for (const token of [
    'ytm-rich-item-renderer',
    'ytm-video-with-context-renderer',
    'ytm-compact-video-renderer',
    'ytm-playlist-panel-video-renderer',
    'ytm-compact-playlist-renderer',
    'ytm-shorts-lockup-view-model'
  ]) {
    assert.match(selectorBlock, new RegExp(token));
  }

  assert.match(bridge, /isYtmWatchLikeCollaboratorCard/);
  assert.match(bridge, /fetchStrategy: 'mainworld'/);
  assert.match(bridge, /currentSettings\?\.videoChannelMap\?\.\[fallbackVideoId\]/);
  assert.match(fallback, /ytm-browse ytm-rich-grid-renderer/);
  assert.match(fallback, /ytm-playlist-panel-renderer/);
  assert.match(fallback, /ytm-radio-renderer/);
  assert.match(fallback, /ytm-comment-section-renderer/);
  assert.match(fallback, /ytm-badge-and-byline-renderer a\[href\^="\/@"\]/);

  assert.match(doc, /YTM fallback can use `videoChannelMap` to attach a mapped UC id and still request `mainworld` repair/);
  assert.match(doc, /Broad scans and hides can cross Main mobile\/YTM\/Kids surfaces without per-route target-shape proof/);
});

test('YTM future authority symbols are absent from product runtime source', () => {
  const doc = read(docPath);
  const source = productRuntimeSource();

  for (const symbol of [
    'youtubeMusicSurfaceIdentityContract',
    'youtubeMusicSurfaceDecisionReport',
    'youtubeMusicProfilePolicy',
    'youtubeMusicRendererAuthority',
    'youtubeMusicDomSelectorPolicy',
    'youtubeMusicShowSheetParityReport',
    'youtubeMusicCompactPlaylistDecision',
    'youtubeMusicFixtureProvenance',
    'youtubeMusicMetricArtifact',
    'youtubeMusicJsonDomParityGate'
  ]) {
    assert.ok(doc.includes(symbol), `doc should name missing future symbol ${symbol}`);
    assert.doesNotMatch(source, new RegExp(`\\b${symbol}\\b`), `${symbol} should not exist in product runtime`);
  }
});
