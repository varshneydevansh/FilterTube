import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'YTM-WATCH PLAYER.html';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html';
const docPath = 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_DOM_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const futureAuthorityTokens = [
  'ytmWatchPlayerDomContract',
  'ytmWatchPlayerSelectedRowDecisionReport',
  'ytmWatchPlayerSiblingPreservationFixture',
  'ytmWatchPlayerWhitelistModeReport',
  'ytmWatchPlayerNoPlaybackSideEffectReport',
  'ytmWatchPlayerObserverBudget',
  'ytmWatchPlayerJsonDomParityReport',
  'ytmWatchPlayerJsonFirstGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

function openingTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

function elementBlocks(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, 'g'))].map((match) => match[0]);
}

function attr(tagOrBlock, name) {
  return tagOrBlock.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '';
}

function productRuntimeSource() {
  return [
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('raw YTM watch/player DOM capture metadata and token counts are pinned', () => {
  const raw = read(rawPath);

  assert.equal(lineCount(raw), 16412);
  assert.equal(Buffer.byteLength(raw), 2279232);
  assert.equal(sha256(rawPath), 'd0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3');
  assert.equal(countLiteral(raw, 'html5-video-player'), 2);
  assert.equal(countLiteral(raw, 'movie_player'), 4);
  assert.equal(countLiteral(raw, '<ytm-watch-player-controls'), 1);
  assert.equal(countLiteral(raw, '<ytm-playlist-panel-renderer'), 1);
  assert.equal(countLiteral(raw, '<ytm-playlist-panel-video-renderer'), 25);
  assert.equal(countLiteral(raw, '</ytm-playlist-panel-video-renderer>'), 25);
  assert.equal(countLiteral(raw, 'ytmPlaylistPanelVideoRendererV2Host'), 25);
  assert.equal(countLiteral(raw, '<ytm-video-with-context-renderer'), 30);
  assert.equal(countLiteral(raw, '<ytm-radio-renderer'), 3);
  assert.equal(countLiteral(raw, 'data-filtertube-hidden="true"'), 5);
  assert.equal(countLiteral(raw, 'filtertube-hidden'), 10);
  assert.equal(countLiteral(raw, 'filtertube-quick-block-btn'), 70);
  assert.equal(countLiteral(raw, 'data-filtertube-channel-id'), 42);
  assert.equal(countLiteral(raw, 'data-filtertube-observing="true"'), 6);
  assert.equal(countLiteral(raw, 'ytmusic-player'), 0);
  assert.equal(countLiteral(raw, 'ytm-player'), 0);
});

test('reduced YTM watch/player fixture preserves player and selected playlist-row state', () => {
  const fixture = read(fixturePath);
  const playlistRows = elementBlocks(fixture, 'ytm-playlist-panel-video-renderer');
  const relatedRows = elementBlocks(fixture, 'ytm-video-with-context-renderer');

  assert.match(fixture, /Raw SHA-256: d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3/);
  assert.match(fixture, /Text labels are ASCII-reduced/);
  assert.equal(countLiteral(fixture, 'id="movie_player"'), 1);
  assert.equal(countLiteral(fixture, '<ytm-watch-player-controls'), 1);
  assert.equal(countLiteral(fixture, '<ytm-playlist-panel-renderer'), 1);
  assert.equal(playlistRows.length, 3);
  assert.equal(relatedRows.length, 1);

  const selected = playlistRows[0];
  assert.equal(attr(selected, 'data-filtertube-video-id'), 'NLDFEkIvcbc');
  assert.equal(attr(selected, 'aria-selected'), 'true');
  assert.equal(attr(selected, 'data-filtertube-channel-id'), 'UCfg5XmOVjJ4yoeE0XkqmGAQ');
  assert.equal(attr(selected, 'data-filtertube-blocked-state'), 'confirmed');
  assert.equal(attr(selected, 'data-filtertube-hidden'), 'true');
  assert.match(attr(openingTags(selected, 'ytm-playlist-panel-video-renderer')[0], 'class'), /filtertube-hidden/);
  assert.match(attr(selected, 'style'), /display: none/);

  const visibleSibling = playlistRows[1];
  assert.equal(attr(visibleSibling, 'data-filtertube-video-id'), '75NRE2KB8jc');
  assert.equal(attr(visibleSibling, 'aria-selected'), 'false');
  assert.equal(attr(visibleSibling, 'data-filtertube-channel-id'), 'UCm9VWKAFz0aXpuEHPHMae7w');
  assert.equal(attr(visibleSibling, 'data-filtertube-hidden'), '');
  assert.doesNotMatch(attr(openingTags(visibleSibling, 'ytm-playlist-panel-video-renderer')[0], 'class'), /filtertube-hidden/);

  const hiddenSibling = playlistRows[2];
  assert.equal(attr(hiddenSibling, 'data-filtertube-video-id'), 'BRycGIKZzpQ');
  assert.equal(attr(hiddenSibling, 'aria-selected'), 'false');
  assert.equal(attr(hiddenSibling, 'data-filtertube-channel-id'), 'UCP6D2gsLQkUcRYE2dy_d2qQ');
  assert.equal(attr(hiddenSibling, 'data-filtertube-hidden'), 'true');

  const related = relatedRows[0];
  assert.equal(attr(related, 'data-filtertube-video-id'), 'BRycGIKZzpQ');
  assert.equal(attr(related, 'data-filtertube-hidden'), 'true');
});

test('raw YTM playlist rows prove selected hidden, visible sibling, and hidden sibling states', () => {
  const raw = read(rawPath);
  const rows = elementBlocks(raw, 'ytm-playlist-panel-video-renderer');

  assert.equal(rows.length, 25);
  assert.equal(attr(rows[0], 'data-filtertube-video-id'), 'NLDFEkIvcbc');
  assert.equal(attr(rows[0], 'aria-selected'), 'true');
  assert.equal(attr(rows[0], 'data-filtertube-channel-id'), 'UCfg5XmOVjJ4yoeE0XkqmGAQ');
  assert.equal(attr(rows[0], 'data-filtertube-hidden'), 'true');
  assert.equal(attr(rows[0], 'data-filtertube-blocked-state'), 'confirmed');
  assert.match(attr(openingTags(rows[0], 'ytm-playlist-panel-video-renderer')[0], 'class'), /ytmPlaylistPanelVideoRendererV2Selected/);
  assert.match(attr(openingTags(rows[0], 'ytm-playlist-panel-video-renderer')[0], 'class'), /filtertube-hidden/);

  assert.equal(attr(rows[1], 'data-filtertube-video-id'), '75NRE2KB8jc');
  assert.equal(attr(rows[1], 'aria-selected'), 'false');
  assert.equal(attr(rows[1], 'data-filtertube-channel-id'), 'UCm9VWKAFz0aXpuEHPHMae7w');
  assert.equal(attr(rows[1], 'data-filtertube-hidden'), '');
  assert.doesNotMatch(attr(openingTags(rows[1], 'ytm-playlist-panel-video-renderer')[0], 'class'), /filtertube-hidden/);

  assert.equal(attr(rows[7], 'data-filtertube-video-id'), 'BRycGIKZzpQ');
  assert.equal(attr(rows[7], 'aria-selected'), 'false');
  assert.equal(attr(rows[7], 'data-filtertube-channel-id'), 'UCP6D2gsLQkUcRYE2dy_d2qQ');
  assert.equal(attr(rows[7], 'data-filtertube-hidden'), 'true');
});

test('product source currently owns YTM watch/player DOM through broad selectors and selected-row side effects', () => {
  const dom = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const watchPanelCss = sliceBetween(dom, 'if (settings.hideWatchPlaylistPanel) {', 'if (settings.hidePlaylistCards) {');
  const playerCss = sliceBetween(dom, 'if (settings.hideEndscreenVideowall) {', 'if (settings.hideTopHeader) {');
  const selectedRowBlock = sliceBetween(dom, '// Never hide the currently-selected playlist row.', 'if (isShortVideoRenderer) {');
  const ytmQuickBlock = sliceBetween(bridge, "tagName === 'ytm-playlist-panel-video-renderer'", "if (isCommentContextTag(tagName))");
  const ytmIdentity = sliceBetween(bridge, "const isYtmVideoLikeCard = (", 'if (ytmChannelLink) {');

  assert.match(watchPanelCss, /ytm-playlist-panel-renderer/);
  assert.match(watchPanelCss, /ytm-playlist-panel-renderer-v2/);
  assert.match(playerCss, /#movie_player \.ytp-endscreen-content/);
  assert.match(playerCss, /#movie_player \.ytp-fullscreen-grid-stills-container/);
  assert.match(playerCss, /#movie_player \.ytp-ce-element/);
  assert.match(selectedRowBlock, /isSelectedPlaylistPanelRow/);
  assert.match(selectedRowBlock, /shouldHideSelectedRow/);
  assert.match(selectedRowBlock, /nextBtn\.click\(\)/);
  assert.match(ytmQuickBlock, /YtmCompactMediaItemHost/);
  assert.match(ytmQuickBlock, /filtertube-fallback-menu-slot--ytm/);
  assert.match(ytmIdentity, /ytm-playlist-panel-video-renderer/);
  assert.match(ytmIdentity, /YtmCompactMediaItemByline/);
});

test('YTM watch/player DOM audit doc keeps JSON-first optimization incomplete', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const selectorAuthority = read('docs/audit/FILTERTUBE_P0_SELECTOR_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'Status: audit-only current-behavior fixture slice',
    'Runtime behavior is unchanged',
    /already\s+FilterTube-mutated DOM/,
    /selected\s+hidden playlist row/,
    /YTM browse channel-list JSON fixture remains a separate proof slice/,
    'selected/current-row policy',
    'ytmWatchPlayerJsonFirstGate'
  ]) {
    if (phrase instanceof RegExp) {
      assert.match(doc, phrase);
    } else {
      assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
    }
  }

  assert.match(rawIndex, /`YTM-WATCH PLAYER\.html` \| `youtube-music` \| yes \| partial: `ytm-watch-player-dom\.html`/);
  assert.match(selectorAuthority, /mobile `ytm-\*` card\/playlist\/comment\/watch-player surfaces/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.ok(runtimeResults.includes('tests/runtime/ytm-watch-player-dom-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM-WATCH PLAYER\.html/);
});

test('no YTM watch/player authority symbols exist in product runtime source yet', () => {
  const combined = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.doesNotMatch(combined, new RegExp(`\\b${token}\\b`), `${token} should not exist in product source yet`);
  }
});
