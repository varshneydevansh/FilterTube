import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'YTM-WATCH PLAYER.html';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html';
const docPath = 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_SELECTED_ROW_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const futureAuthorityTokens = [
  'ytmWatchPlayerSelectedRowPlaybackPolicy',
  'ytmWatchPlayerNoPlaybackSideEffectReport',
  'ytmWatchPlayerPlaylistSkipDecisionReport',
  'ytmWatchPlayerSelectedRowModeMatrix',
  'ytmWatchPlayerAutoplayGuardBudget',
  'ytmWatchPlayerSyntheticNavigationBudget',
  'ytmWatchPlayerCollapsedPanelBudget',
  'ytmWatchPlayerSelectedRowRestoreReport'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

function elementBlocks(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, 'g'))].map((match) => match[0]);
}

function openingTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map((match) => match[0]);
}

function attr(tagOrBlock, name) {
  return tagOrBlock.match(new RegExp(`${name}="([^"]*)"`))?.[1] || '';
}

function productRuntimeSource() {
  return [
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('YTM selected-row side-effect boundary audit doc is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /selected\/current-row side-effect boundary/);
  assert.match(doc, /raw aria-selected=true tokens: 8/);
  assert.match(doc, /raw data-filtertube-hidden=true tokens: 5/);
  assert.match(doc, /raw data-filtertube-blocked-state=confirmed tokens: 1/);
  assert.match(doc, /raw html5-main-video tokens: 1/);
  assert.match(doc, /selected row video id: NLDFEkIvcbc/);
  assert.match(doc, /selected row channel id: UCfg5XmOVjJ4yoeE0XkqmGAQ/);
  assert.match(doc, /visible sibling video id: 75NRE2KB8jc/);
  assert.match(doc, /hidden sibling video id: BRycGIKZzpQ/);
  assert.match(doc, /Current Side Effect Owners/);
});

test('raw and reduced YTM watch/player DOM prove selected hidden row plus player video context', () => {
  const raw = read(rawPath);
  const fixture = read(fixturePath);
  const playlistRows = elementBlocks(fixture, 'ytm-playlist-panel-video-renderer');

  assert.equal(countLiteral(raw, 'aria-selected="true"'), 8);
  assert.equal(countLiteral(raw, 'data-filtertube-hidden="true"'), 5);
  assert.equal(countLiteral(raw, 'data-filtertube-blocked-state="confirmed"'), 1);
  assert.equal(countLiteral(raw, 'html5-main-video'), 1);
  assert.equal(playlistRows.length, 3);

  const selected = playlistRows[0];
  assert.equal(attr(selected, 'aria-selected'), 'true');
  assert.equal(attr(selected, 'data-filtertube-video-id'), 'NLDFEkIvcbc');
  assert.equal(attr(selected, 'data-filtertube-channel-id'), 'UCfg5XmOVjJ4yoeE0XkqmGAQ');
  assert.equal(attr(selected, 'data-filtertube-blocked-state'), 'confirmed');
  assert.equal(attr(selected, 'data-filtertube-hidden'), 'true');
  assert.match(attr(openingTags(selected, 'ytm-playlist-panel-video-renderer')[0], 'class'), /filtertube-hidden/);

  assert.equal(attr(playlistRows[1], 'data-filtertube-video-id'), '75NRE2KB8jc');
  assert.equal(attr(playlistRows[1], 'data-filtertube-hidden'), '');
  assert.equal(attr(playlistRows[2], 'data-filtertube-video-id'), 'BRycGIKZzpQ');
  assert.equal(attr(playlistRows[2], 'data-filtertube-hidden'), 'true');
});

test('selected playlist row detection includes YTM rows but has no YTM playback policy authority', () => {
  const source = read('js/content/dom_fallback.js');
  const selectedHelper = sliceBetween(
    source,
    'function isPlaylistPanelRowElement(elementOrTag) {',
    'function extractPlaylistPanelBylineChannelName(value) {'
  );

  assert.match(selectedHelper, /ytm-playlist-panel-video-renderer/);
  assert.match(selectedHelper, /ytm-playlist-panel-video-wrapper-renderer/);
  assert.match(selectedHelper, /ytm-playlist-video-renderer/);
  assert.match(selectedHelper, /row\.getAttribute\('aria-selected'\) === 'true'/);
  assert.match(selectedHelper, /row\.getAttribute\('aria-current'\) === 'true'/);
  assert.match(selectedHelper, /row\.getAttribute\('data-selected'\) === 'true'/);
  assert.match(selectedHelper, /ytm-playlist-panel-video-renderer-selected/);
  assert.doesNotMatch(selectedHelper, /ytmWatchPlayerSelectedRowPlaybackPolicy|ytmWatchPlayerSelectedRowModeMatrix/);
});

test('current-watch owner block can pause media hide selected row and synthesize navigation today', () => {
  const source = read('js/content/dom_fallback.js');
  const currentWatch = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );

  assert.match(currentWatch, /if \(listMode === 'whitelist'\) return/);
  assert.match(currentWatch, /video\.pause\(\)/);
  assert.match(currentWatch, /toggleVisibility\(selected, true, `Current watch blocked: \$\{ownerName\}`, true\)/);
  assert.match(currentWatch, /targetLink\.click\(\)/);
  assert.match(currentWatch, /openWatchPlaylistPanelIfCollapsed\(\)/);
  assert.match(currentWatch, /applyDOMFallback\(settings, \{ preserveScroll: true, forceReprocess: true \}\)/);
  assert.match(currentWatch, /nextButton\.click\(\)/);
  assert.match(currentWatch, /toggleVisibility\(shell, true, `Current watch blocked: \$\{ownerName\}`, true\)/);
  assert.doesNotMatch(currentWatch, /ytmWatchPlayerNoPlaybackSideEffectReport|ytmWatchPlayerSyntheticNavigationBudget/);
});

test('playlist click ended selected-row and retry paths are separate side-effect owners today', () => {
  const source = read('js/content/dom_fallback.js');
  const guardBlock = sliceBetween(
    source,
    "if (!window.__filtertubePlaylistNavGuardInstalled) {",
    'try {\n        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {'
  );
  const selectedRowBlock = sliceBetween(
    source,
    '// Never hide the currently-selected playlist row.',
    'if (isShortVideoRenderer) {'
  );
  const hiddenSelectedRetryBlock = sliceBetween(
    source,
    'if (!window.__filtertubePlaylistSkipState) {',
    '    } finally {'
  );

  assert.match(guardBlock, /document\.addEventListener\('click'/);
  assert.match(guardBlock, /document\.addEventListener\('ended'/);
  assert.match(guardBlock, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(guardBlock, /event\.preventDefault\(\)/);
  assert.match(guardBlock, /event\.stopImmediatePropagation\(\)/);
  assert.match(guardBlock, /video\.pause\(\)/);
  assert.match(guardBlock, /targetLink\.click\(\)/);
  assert.match(guardBlock, /nextBtn\.click\(\)/);

  assert.match(selectedRowBlock, /hasExplicitBlockMarker/);
  assert.match(selectedRowBlock, /hasActiveBlockRules && matchesFilters/);
  assert.match(selectedRowBlock, /listMode !== 'whitelist'/);
  assert.match(selectedRowBlock, /window\.__filtertubeLastPlaylistSkipTs = now/);
  assert.match(selectedRowBlock, /nextBtn\.click\(\)/);

  assert.match(hiddenSelectedRetryBlock, /window\.__filtertubePlaylistSkipState/);
  assert.match(hiddenSelectedRetryBlock, /isExplicitlyHiddenByFilterTube\(selected\)/);
  assert.match(hiddenSelectedRetryBlock, /video\.pause\(\)/);
  assert.match(hiddenSelectedRetryBlock, /video\.currentTime = 0/);
  assert.match(hiddenSelectedRetryBlock, /target\.click\(\)/);
  assert.doesNotMatch(guardBlock + selectedRowBlock + hiddenSelectedRetryBlock, /ytmWatchPlayerPlaylistSkipDecisionReport|ytmWatchPlayerAutoplayGuardBudget/);
});

test('YTM selected-row side-effect future authority symbols are absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const runtimeResults = read(runtimeResultsPath);

  assert.ok(runtimeResults.includes('tests/runtime/ytm-watch-player-selected-row-side-effect-boundary-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM selected\/current-row side-effect boundary/);

  for (const token of futureAuthorityTokens) {
    assert.doesNotMatch(runtime, new RegExp(`\\b${token}\\b`), `${token} should not exist in product source yet`);
  }
});
