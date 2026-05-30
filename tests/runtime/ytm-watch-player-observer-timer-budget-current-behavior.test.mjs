import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'YTM-WATCH PLAYER.html';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html';
const docPath = 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_OBSERVER_TIMER_BUDGET_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const futureAuthorityTokens = [
  'ytmWatchPlayerObserverTimerBudget',
  'ytmWatchPlayerLifecycleOwnerReport',
  'ytmWatchPlayerMutationObserverBudget',
  'ytmWatchPlayerQuickBlockObserverBudget',
  'ytmWatchPlayerPlaylistGuardListenerReport',
  'ytmWatchPlayerWhitelistNoWorkObserverReport',
  'ytmWatchPlayerRerunTimerBudget',
  'ytmWatchPlayerObserverMetricArtifact'
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

function blockMetric(file, startNeedle, endNeedle) {
  const block = sliceBetween(read(file), startNeedle, endNeedle);
  return {
    block,
    lines: block.split(/\r?\n/).length,
    bytes: Buffer.byteLength(block)
  };
}

function productRuntimeSource() {
  return [
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('YTM watch/player observer timer budget doc is audit-only and metric pinned', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: current-behavior fixture slice with 2026-05-25 SPA drag optimization addendum',
    'not an implementation patch',
    'Raw `data-filtertube-observing=true` tokens | 6',
    'Raw quick-block button tokens | 70',
    'Raw YTM playlist panel rows | 25',
    'Raw YTM related video rows | 30',
    'Reduced fixture quick-block buttons | 3',
    'Reduced fixture observer markers | 0',
    'DOM playlist navigation guard | `js/content/dom_fallback.js` | 108 | 4954',
    'Whitelist pending queue | `js/content_bridge.js` | 181 | 9704',
    'Fallback mutation observer | `js/content_bridge.js` | 143 | 5592',
    'YTM fallback menu scan | `js/content_bridge.js` | 282 | 9841',
    'Quick-block card selectors | `js/content/block_channel.js` | 117 | 3885',
    'Quick-block observer setup | `js/content/block_channel.js` | 323 | 13896'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }
});

test('raw and reduced YTM watch/player fixtures pin current observer and button markers', () => {
  const raw = read(rawPath);
  const fixture = read(fixturePath);

  assert.equal(countLiteral(raw, 'data-filtertube-observing="true"'), 6);
  assert.equal(countLiteral(raw, 'filtertube-quick-block-btn'), 70);
  assert.equal(countLiteral(raw, '<ytm-playlist-panel-video-renderer'), 25);
  assert.equal(countLiteral(raw, '<ytm-video-with-context-renderer'), 30);

  assert.equal(countLiteral(fixture, 'data-filtertube-observing="true"'), 0);
  assert.equal(countLiteral(fixture, 'filtertube-quick-block-btn'), 3);
  assert.equal(countLiteral(fixture, '<ytm-playlist-panel-video-renderer'), 3);
  assert.equal(countLiteral(fixture, '<ytm-video-with-context-renderer'), 1);
});

test('DOM fallback playlist guards remain installed owners with whitelist early returns', () => {
  const guard = blockMetric(
    'js/content/dom_fallback.js',
    'if (!window.__filtertubePlaylistNavGuardInstalled) {',
    '    try {\n        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {'
  );

  assert.equal(guard.lines, 108);
  assert.equal(guard.bytes, 4954);
  assert.match(guard.block, /window\.__filtertubePlaylistNavGuardInstalled = true/);
  assert.match(guard.block, /document\.addEventListener\('click'/);
  assert.match(guard.block, /document\.addEventListener\('ended'/);
  assert.match(guard.block, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(guard.block, /video\.pause\(\)/);
  assert.match(guard.block, /targetLink\.click\(\)/);
  assert.match(guard.block, /setTimeout\(\(\) =>/);
  assert.match(guard.block, /nextBtn\.click\(\)/);
});

test('content bridge fallback queues and YTM menu scan own mutation and timer work', () => {
  const pendingQueue = blockMetric(
    'js/content_bridge.js',
    'const whitelistPendingRefreshState = {',
    '        function fallbackRelevantSelector() {'
  );
  const fallbackObserver = blockMetric(
    'js/content_bridge.js',
    '        function fallbackRelevantSelector() {',
    'let fallbackMenuButtonsInstalled = false;'
  );
  const ytmScan = blockMetric(
    'js/content_bridge.js',
    '    const fallbackMenuCardSelector = [',
    'let playlistFallbackPopoverState = null;'
  );

  assert.equal(pendingQueue.lines, 181);
  assert.equal(pendingQueue.bytes, 9704);
  assert.match(pendingQueue.block, /WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT = 160/);
  assert.match(pendingQueue.block, /setTimeout\(\(\) =>/);
  assert.match(pendingQueue.block, /onlyWhitelistPending: true/);
  assert.match(pendingQueue.block, /path\.startsWith\('\/watch'\)\) return/);

  assert.equal(fallbackObserver.lines, 143);
  assert.equal(fallbackObserver.bytes, 5592);
  assert.match(fallbackObserver.block, /new MutationObserver\(mutations =>/);
  assert.match(fallbackObserver.block, /queueWhitelistPendingHide\(mutations\)/);
  assert.match(fallbackObserver.block, /scheduleImmediateFallback\(\)/);
  assert.match(fallbackObserver.block, /document\.addEventListener\('DOMContentLoaded'/);
  assert.match(fallbackObserver.block, /refreshFilterTubeRuntimeObservers\(\)/);

  assert.equal(ytmScan.lines, 282);
  assert.equal(ytmScan.bytes, 9841);
  assert.match(ytmScan.block, /ytm-playlist-panel-video-renderer/);
  assert.match(ytmScan.block, /ytm-video-with-context-renderer/);
  assert.match(ytmScan.block, /new MutationObserver\(\(mutations\) =>/);
  assert.match(ytmScan.block, /document\.addEventListener\('click'/);
  assert.match(ytmScan.block, /window\.addEventListener\('scroll'/);
  assert.match(ytmScan.block, /setInterval\(\(\) =>/);
});

test('block_channel quick-block lifecycle admits YTM rows while action eligibility excludes whitelist', () => {
  const selectors = blockMetric(
    'js/content/block_channel.js',
    'const QUICK_BLOCK_CARD_SELECTORS = [',
    'const isQuickBlockEnabled = () => {'
  );
  const setup = blockMetric(
    'js/content/block_channel.js',
    'function setupQuickBlockObserver() {',
    '/**\n * Observe dropdowns and inject FilterTube menu items'
  );
  const actionGate = sliceBetween(
    read('js/content/block_channel.js'),
    'const isQuickBlockEnabled = () => {',
    'function ensureQuickBlockStyles() {'
  );

  assert.equal(selectors.lines, 117);
  assert.equal(selectors.bytes, 3885);
  assert.equal(countLiteral(selectors.block, 'ytm-'), 30);
  assert.match(selectors.block, /ytm-playlist-panel-video-renderer/);
  assert.match(selectors.block, /ytm-video-with-context-renderer/);

  assert.equal(setup.lines, 323);
  assert.equal(setup.bytes, 13896);
  assert.match(setup.block, /document\.addEventListener\('focusin'/);
  assert.match(setup.block, /document\.addEventListener\('pointermove'/);
  assert.match(setup.block, /new MutationObserver\(\(mutations\) =>/);
  assert.match(setup.block, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(setup.block, /window\.setInterval\(\(\) =>/);
  assert.match(setup.block, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(setup.block, /window\.addEventListener\('DOMContentLoaded'/);

  assert.match(actionGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(actionGate, /currentSettings\.listMode === 'whitelist'/);
});

test('YTM watch/player observer budget future authority symbols are absent and ledgers cite the open gate', () => {
  const runtime = productRuntimeSource();
  const runtimeResults = read(runtimeResultsPath);
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoalAudit = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const obligationIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');

  assert.ok(runtimeResults.includes('tests/runtime/ytm-watch-player-observer-timer-budget-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM Watch Player Observer Timer Budget Addendum/);
  assert.match(objectiveLedger, /YTM watch\/player observer timer budget addendum/);
  assert.match(activeGoalAudit, /YTM watch\/player observer timer budget addendum/);
  assert.match(obligationIndex, /YTM watch\/player observer timer budget addendum/);

  for (const token of futureAuthorityTokens) {
    assert.doesNotMatch(runtime, new RegExp(`\\b${token}\\b`), `${token} should not exist in product source yet`);
  }
});
