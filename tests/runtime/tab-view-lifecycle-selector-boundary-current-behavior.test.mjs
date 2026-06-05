import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const tabViewPath = path.join(root, 'js/tab-view.js');
const htmlPath = path.join(root, 'html/tab-view.html');
const auditPath = path.join(root, 'docs/audit/FILTERTUBE_TAB_VIEW_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function lineCount(text) {
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function fingerprint(filePath) {
  const text = read(filePath);
  return {
    lines: lineCount(text),
    bytes: Buffer.byteLength(text),
    sha256: crypto.createHash('sha256').update(text).digest('hex'),
  };
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function getBlock(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing block start: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing block end: ${endNeedle}`);
  return source.slice(start, end);
}

function blockStats(source, startNeedle, endNeedle) {
  const block = getBlock(source, startNeedle, endNeedle);
  return {
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    addEventListener: count(block, /\.addEventListener\s*\(/g),
    setTimeout: count(block, /\bsetTimeout\s*\(/g),
    clearTimeout: count(block, /\bclearTimeout\s*\(/g),
    setInterval: count(block, /\bsetInterval\s*\(/g),
    clearInterval: count(block, /\bclearInterval\s*\(/g),
    requestAnimationFrame: count(block, /\brequestAnimationFrame\s*\(/g),
    cancelAnimationFrame: count(block, /\bcancelAnimationFrame\s*\(/g),
    getElementById: count(block, /document\.getElementById\(/g),
    querySelector: count(block, /\.querySelector\s*\(/g),
    querySelectorAll: count(block, /\.querySelectorAll\s*\(/g),
    runtimeOnMessageAddListener: count(block, /\.runtime\.onMessage\.addListener\s*\(/g),
  };
}

function jsIdReport(js, html) {
  const jsIds = [...js.matchAll(/document\.getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1]);
  const uniqueJsIds = [...new Set(jsIds)].sort();
  const htmlIds = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const uniqueHtmlIds = [...new Set(htmlIds)].sort();
  const htmlIdSet = new Set(uniqueHtmlIds);
  return {
    jsIdTokenCount: jsIds.length,
    uniqueJsIds,
    htmlIdTokenCount: htmlIds.length,
    uniqueHtmlIds,
    missingIds: uniqueJsIds.filter((id) => !htmlIdSet.has(id)),
    unusedHtmlIds: uniqueHtmlIds.filter((id) => !uniqueJsIds.includes(id)),
  };
}

test('tab-view lifecycle selector boundary audit is audit-only and source pinned', () => {
  const doc = read(auditPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /tests\/runtime\/tab-view-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.deepEqual(fingerprint(tabViewPath), {
    lines: 14584,
    bytes: 676581,
    sha256: '7f3de6750e95adb81bfdec5df53425427be86b08044a833bc0288bfe8cbe6e58',
  });
  assert.deepEqual(fingerprint(htmlPath), {
    lines: 1577,
    bytes: 133585,
    sha256: 'e33ef1e0d1f2c3d607cb58c3275137df54c1c82ed06cf5cd03c053690fedb0b6',
  });
});

test('tab-view lifecycle primitive totals remain pinned', () => {
  const source = read(tabViewPath);
  const familyCounts = {
    addEventListener: count(source, /\.addEventListener\s*\(/g),
    removeEventListener: count(source, /\.removeEventListener\s*\(/g),
    MutationObserver: count(source, /\bMutationObserver\b/g),
    IntersectionObserver: count(source, /\bIntersectionObserver\b/g),
    setInterval: count(source, /\bsetInterval\s*\(/g),
    clearInterval: count(source, /\bclearInterval\s*\(/g),
    setTimeout: count(source, /\bsetTimeout\s*\(/g),
    clearTimeout: count(source, /\bclearTimeout\s*\(/g),
    requestAnimationFrame: count(source, /\brequestAnimationFrame\s*\(/g),
    cancelAnimationFrame: count(source, /\bcancelAnimationFrame\s*\(/g),
  };

  assert.deepEqual(familyCounts, {
    addEventListener: 147,
    removeEventListener: 0,
    MutationObserver: 0,
    IntersectionObserver: 0,
    setInterval: 1,
    clearInterval: 1,
    setTimeout: 14,
    clearTimeout: 4,
    requestAnimationFrame: 11,
    cancelAnimationFrame: 2,
  });
  assert.equal(Object.values(familyCounts).reduce((sum, value) => sum + value, 0), 180);
  assert.equal(count(source, /\.runtime\.onMessage\.addListener\s*\(/g), 1);
  assert.equal(count(source, /window\.addEventListener\s*\(/g), 5);
  assert.equal(count(source, /document\.addEventListener\s*\(/g), 2);
  assert.equal(count(source, /StateManager\.subscribe\s*\(/g), 3);
});

test('tab-view DOM id and selector boundary remains split between static and dynamic ids', () => {
  const source = read(tabViewPath);
  const html = read(htmlPath);
  const report = jsIdReport(source, html);

  assert.equal(report.jsIdTokenCount, 234);
  assert.equal(report.uniqueJsIds.length, 175);
  assert.equal(report.htmlIdTokenCount, 100);
  assert.equal(report.uniqueHtmlIds.length, 100);
  assert.equal(report.missingIds.length, 85);
  assert.equal(report.unusedHtmlIds.length, 10);
  assert.equal(count(source, /(?:document|[A-Za-z0-9_$?.]+)\.querySelector\s*\(/g), 30);
  assert.equal(count(source, /(?:document|[A-Za-z0-9_$?.]+)\.querySelectorAll\s*\(/g), 27);
  assert.deepEqual(report.unusedHtmlIds, [
    'dashboardAppsTitle',
    'dashboardView',
    'donateView',
    'filtersView',
    'kidsView',
    'semanticView',
    'settingsView',
    'syncView',
    'tabViewShellDecor',
    'viewContainer',
  ]);
  for (const dynamicOrMissingId of [
    'addKeywordBtn',
    'addChannelBtn',
    'keywordInput',
    'channelInput',
    'searchContentControls',
    'ftProfileSelector',
    'importSubscriptionsActions',
    'videoFilter_duration_enabled',
    'kidsVideoFilter_duration_enabled',
    'setting_syncKidsToMain',
  ]) {
    assert.ok(report.missingIds.includes(dynamicOrMissingId), `${dynamicOrMissingId} should remain outside static HTML id set`);
  }
});

test('selected tab-view source/effect blocks remain pinned', () => {
  const source = read(tabViewPath);

  assert.deepEqual(blockStats(source, 'function initializeResponsiveNav() {', 'function initializeFiltersTabs() {'), {
    lines: 32,
    bytes: 893,
    addEventListener: 3,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 3,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function scheduleSaveVideoFilters(options = {}) {', 'function maybeSelectOptionRadioFromElement(element) {'), {
    lines: 12,
    bytes: 379,
    addEventListener: 0,
    setTimeout: 1,
    clearTimeout: 1,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function scheduleSaveKidsCategoryFilters(options = {}) {', 'function saveKidsCategoryFilters(options = {}) {'), {
    lines: 12,
    bytes: 383,
    addEventListener: 0,
    setTimeout: 1,
    clearTimeout: 1,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function scheduleSaveKidsVideoFilters(options = {}) {', 'function saveKidsVideoFilters(options = {}) {'), {
    lines: 12,
    bytes: 345,
    addEventListener: 0,
    setTimeout: 1,
    clearTimeout: 1,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function closeProfileDropdownTab() {', 'function renderProfileSelectorTab(profilesV4) {'), {
    lines: 137,
    bytes: 5150,
    addEventListener: 0,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 3,
    cancelAnimationFrame: 2,
    getElementById: 0,
    querySelector: 1,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'async function showChoiceModal', 'function isNanahAvailable()'), {
    lines: 103,
    bytes: 3728,
    addEventListener: 4,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 1,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function scheduleDashboardStatsRotation() {', 'function updateStats() {'), {
    lines: 42,
    bytes: 1513,
    addEventListener: 0,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 1,
    clearInterval: 1,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function updateStats() {', '    // Initial render'), {
    lines: 60,
    bytes: 2643,
    addEventListener: 2,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 7,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'if (runtimeAPI?.runtime?.onMessage?.addListener) {', '    if (!subscriptionsImportFlowConsumed) {'), {
    lines: 47,
    bytes: 1687,
    addEventListener: 2,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 1,
  });
  assert.deepEqual(blockStats(source, '    if (quickAddKeywordBtn) {', '});\n\n// ============================================================================\n// NAVIGATION'), {
    lines: 41,
    bytes: 1647,
    addEventListener: 6,
    setTimeout: 3,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 2,
    querySelector: 6,
    querySelectorAll: 0,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, 'function setupNavigation() {', 'function switchView(viewId) {'), {
    lines: 23,
    bytes: 850,
    addEventListener: 1,
    setTimeout: 0,
    clearTimeout: 0,
    setInterval: 0,
    clearInterval: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 3,
    querySelector: 1,
    querySelectorAll: 2,
    runtimeOnMessageAddListener: 0,
  });
  assert.deepEqual(blockStats(source, "document.addEventListener('DOMContentLoaded', async () => {", 'function setupNavigation() {'), {
    lines: 8740,
    bytes: 398152,
    addEventListener: 111,
    setTimeout: 8,
    clearTimeout: 0,
    setInterval: 1,
    clearInterval: 1,
    requestAnimationFrame: 6,
    cancelAnimationFrame: 2,
    getElementById: 130,
    querySelector: 13,
    querySelectorAll: 6,
    runtimeOnMessageAddListener: 1,
  });
});

test('tab-view current lifecycle and selector behaviors remain explicit', () => {
  const source = read(tabViewPath);

  assert.match(source, /navToggle\.dataset\.ftNavBound === 'true'/);
  assert.match(source, /navToggle\.dataset\.ftNavBound = 'true'/);
  assert.match(source, /pendingVideoFiltersSaveTimer = setTimeout\(\(\) => \{/);
  assert.match(source, /pendingKidsCategorySaveTimer = setTimeout\(\(\) => \{/);
  assert.match(source, /pendingKidsSaveTimer = setTimeout\(\(\) => \{/);
  assert.match(source, /dashboardStatsRotationTimer = setInterval\(\(\) => \{/);
  assert.match(source, /dashboardStatsMainBtn\.__filtertubeBound = true/);
  assert.match(source, /dashboardStatsKidsBtn\.__filtertubeBound = true/);
  assert.match(source, /message\?\.action !== 'FilterTube_SubscriptionsImportProgress'/);
  assert.match(source, /normalizeString\(message\?\.requestId\) !== normalizeString\(subscriptionsImportState\.requestId\)/);
  assert.match(source, /subscriptionsImportState\.sourceTabId !== sourceTabId/);
  assert.match(source, /window\.addEventListener\('hashchange', handleNavigationIntent\)/);
  assert.match(source, /window\.addEventListener\('popstate', handleNavigationIntent\)/);
  assert.equal(count(source, /StateManager\.subscribe\s*\(/g), 3);
});

test('tab-view lifecycle selector future authority symbols are absent from product source', () => {
  const productSource = `${read(tabViewPath)}\n${read(htmlPath)}`;
  const futureSymbols = [
    'tabViewLifecycleSelectorBoundaryContract',
    'tabViewLifecycleDecisionReport',
    'tabViewSelectorAuthorityReport',
    'tabViewDynamicIdProvenanceReport',
    'tabViewStaticIdParityReport',
    'tabViewListenerOwnerReport',
    'tabViewTimerBudgetReport',
    'tabViewRuntimeMessageListenerPolicy',
    'tabViewBootstrapSplitReport',
    'tabViewSettingsSaveTimerReport',
    'tabViewDashboardRotationMetricArtifact',
    'tabViewLifecycleFixtureProvenance',
  ];

  for (const symbol of futureSymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }
});
