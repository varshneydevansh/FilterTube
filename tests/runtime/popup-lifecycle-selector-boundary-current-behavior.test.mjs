import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const popupPath = path.join(root, 'js/popup.js');
const htmlPath = path.join(root, 'html/popup.html');
const auditPath = path.join(root, 'docs/audit/FILTERTUBE_POPUP_LIFECYCLE_SELECTOR_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');

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

function getBlock(source, startNeedle, endNeedle, options = {}) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing block start: ${startNeedle}`);
  const end = options.lastEnd === true
    ? source.lastIndexOf(endNeedle)
    : source.indexOf(endNeedle, start + startNeedle.length);
  assert.ok(end > start, `missing block end after start: ${endNeedle}`);
  return source.slice(start, end);
}

function blockStats(source, startNeedle, endNeedle, options = {}) {
  const block = getBlock(source, startNeedle, endNeedle, options);
  return {
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    addEventListener: count(block, /\.addEventListener\s*\(/g),
    setTimeout: count(block, /\bsetTimeout\s*\(/g),
    clearTimeout: count(block, /\bclearTimeout\s*\(/g),
    requestAnimationFrame: count(block, /\brequestAnimationFrame\s*\(/g),
    cancelAnimationFrame: count(block, /\bcancelAnimationFrame\s*\(/g),
    getElementById: count(block, /document\.getElementById\(/g),
    querySelector: count(block, /\.querySelector\s*\(/g),
    querySelectorAll: count(block, /\.querySelectorAll\s*\(/g),
    sendRuntimeMessage: count(block, /sendRuntimeMessage\s*\(/g),
    runtimeSendMessage: count(block, /\.runtime\.sendMessage\s*\(/g),
    tabsQuery: count(block, /\.tabs\.query\s*\(/g),
    tabsCreate: count(block, /\.tabs\.create\s*\(/g),
    windowOpen: count(block, /window\.open\s*\(/g),
    StateManagerSubscribe: count(block, /StateManager\.subscribe\s*\(/g),
    createElement: count(block, /document\.createElement\s*\(/g),
    innerHTML: count(block, /\.innerHTML\s*=/g),
  };
}

function idReport(js, html) {
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

test('popup lifecycle selector boundary audit is audit-only and source pinned', () => {
  const doc = read(auditPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /tests\/runtime\/popup-lifecycle-selector-boundary-current-behavior\.test\.mjs/);
  assert.deepEqual(fingerprint(popupPath), {
    lines: 1841,
    bytes: 75587,
    sha256: 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a',
  });
  assert.deepEqual(fingerprint(htmlPath), {
    lines: 31,
    bytes: 1213,
    sha256: 'c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31',
  });
});

test('popup lifecycle primitive and transport totals remain pinned', () => {
  const source = read(popupPath);
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
    addEventListener: 30,
    removeEventListener: 0,
    MutationObserver: 0,
    IntersectionObserver: 0,
    setInterval: 0,
    clearInterval: 0,
    setTimeout: 2,
    clearTimeout: 0,
    requestAnimationFrame: 1,
    cancelAnimationFrame: 0,
  });
  assert.equal(Object.values(familyCounts).reduce((sum, value) => sum + value, 0), 33);
  assert.equal(count(source, /document\.addEventListener\s*\(/g), 3);
  assert.equal(count(source, /window\.addEventListener\s*\(/g), 0);
  assert.equal(count(source, /StateManager\.subscribe\s*\(/g), 2);
  assert.equal(count(source, /sendRuntimeMessage\s*\(/g), 4);
  assert.equal(count(source, /\.runtime\.sendMessage\s*\(/g), 1);
  assert.equal(count(source, /window\.open\s*\(/g), 5);
});

test('popup DOM id and selector boundary depends on generated and dynamic markup', () => {
  const source = read(popupPath);
  const html = read(htmlPath);
  const report = idReport(source, html);

  assert.equal(report.jsIdTokenCount, 52);
  assert.equal(report.uniqueJsIds.length, 23);
  assert.equal(report.htmlIdTokenCount, 1);
  assert.deepEqual(report.uniqueHtmlIds, ['popupRoot']);
  assert.equal(report.missingIds.length, 23);
  assert.deepEqual(report.unusedHtmlIds, ['popupRoot']);
  assert.equal(count(source, /(?:document|[A-Za-z0-9_$?.]+)\.querySelector\s*\(/g), 4);
  assert.equal(count(source, /(?:document|[A-Za-z0-9_$?.]+)\.querySelectorAll\s*\(/g), 6);
  assert.equal(count(source, /document\.createElement\s*\(/g), 82);
  assert.equal(count(source, /\.innerHTML\s*=/g), 5);
  assert.deepEqual(report.missingIds, [
    'addChannelBtn',
    'addKeywordBtn',
    'channelInput',
    'channelList',
    'extensionStatusText',
    'ftProfileBadgeBtnPopup',
    'ftProfileDropdownPopup',
    'ftProfileMenuPopup',
    'ftTopBarListModeControlsPopup',
    'keywordList',
    'newKeywordInput',
    'openInTabBtn',
    'popupFiltersTabsContainer',
    'popupVideoFilter_duration_enabled',
    'popupVideoFilter_duration_enabled_kids',
    'popupVideoFilter_uploadDate_enabled',
    'popupVideoFilter_uploadDate_enabled_kids',
    'popupVideoFilter_uppercase_enabled',
    'popupVideoFilter_uppercase_enabled_kids',
    'searchChannelsPopup',
    'searchContentControlsPopup',
    'searchKeywordsPopup',
    'toggleEnabledBrandBtn',
  ]);
});

test('selected popup source/effect blocks remain pinned', () => {
  const source = read(popupPath);

  assert.deepEqual(blockStats(source, 'function initializePopupFiltersTabs() {', '// Main initialization'), {
    lines: 599,
    bytes: 26836,
    addEventListener: 7,
    setTimeout: 1,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 34,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 2,
    StateManagerSubscribe: 1,
    createElement: 55,
    innerHTML: 3,
  });
  assert.deepEqual(blockStats(source, '    // Attach listeners after delay', '    // Create tabs using UIComponents'), {
    lines: 87,
    bytes: 4269,
    addEventListener: 7,
    setTimeout: 1,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 6,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 2,
    StateManagerSubscribe: 1,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, "document.addEventListener('DOMContentLoaded', async () => {", '\n});', { lastEnd: true }), {
    lines: 1232,
    bytes: 48499,
    addEventListener: 23,
    setTimeout: 1,
    clearTimeout: 0,
    requestAnimationFrame: 1,
    cancelAnimationFrame: 0,
    getElementById: 18,
    querySelector: 4,
    querySelectorAll: 6,
    sendRuntimeMessage: 4,
    runtimeSendMessage: 1,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 3,
    StateManagerSubscribe: 1,
    createElement: 27,
    innerHTML: 2,
  });
  assert.deepEqual(blockStats(source, '    async function sendRuntimeMessage(payload) {', '    async function syncSessionUnlockStateFromBackground() {'), {
    lines: 29,
    bytes: 1155,
    addEventListener: 0,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 1,
    runtimeSendMessage: 1,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    function renderListModeControls() {', '    let lockGateEl = null;'), {
    lines: 172,
    bytes: 7911,
    addEventListener: 2,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 2,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 1,
    innerHTML: 1,
  });
  assert.deepEqual(blockStats(source, '    function closeProfileDropdown() {', '    async function showPromptModal'), {
    lines: 34,
    bytes: 1320,
    addEventListener: 0,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 1,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    async function showPromptModal', '    async function verifyPin'), {
    lines: 101,
    bytes: 3530,
    addEventListener: 4,
    setTimeout: 1,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 11,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    // Subscribe to state changes for automatic UI updates', '    // ============================================================================\n    // RENDERING'), {
    lines: 27,
    bytes: 862,
    addEventListener: 0,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 1,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    if (ftProfileBadgeBtnPopup && ftProfileDropdownPopup) {', '    // ============================================================================\n    // EVENT HANDLERS'), {
    lines: 24,
    bytes: 719,
    addEventListener: 3,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    if (searchKeywordsPopup) {', '    // Open in tab'), {
    lines: 100,
    bytes: 3501,
    addEventListener: 8,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 1,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 0,
    StateManagerSubscribe: 0,
    createElement: 0,
    innerHTML: 0,
  });
  assert.deepEqual(blockStats(source, '    // Open in tab', '\n});', { lastEnd: true }), {
    lines: 50,
    bytes: 2203,
    addEventListener: 3,
    setTimeout: 0,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0,
    getElementById: 0,
    querySelector: 0,
    querySelectorAll: 0,
    sendRuntimeMessage: 0,
    runtimeSendMessage: 0,
    tabsQuery: 0,
    tabsCreate: 0,
    windowOpen: 3,
    StateManagerSubscribe: 0,
    createElement: 0,
    innerHTML: 0,
  });
});

test('popup current lifecycle selector behaviors remain explicit', () => {
  const source = read(popupPath);

  assert.match(source, /setTimeout\(\(\) => \{/);
  assert.match(source, /}, 100\);/);
  assert.match(source, /StateManager\.subscribe\(\(eventType, data\) => \{/);
  assert.match(source, /document\.addEventListener\('DOMContentLoaded', async \(\) => \{/);
  assert.match(source, /runtimeApi\.runtime\.sendMessage\(payload/);
  assert.match(source, /action: 'FilterTube_SetListMode'/);
  assert.match(source, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
  assert.match(source, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html'\)/);
  assert.match(source, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.match(source, /ftProfileBadgeBtnPopup\.addEventListener\('click'/);
  assert.match(source, /document\.addEventListener\('keydown'/);
  assert.match(source, /toggleEnabledBrandBtn\.addEventListener\('keydown'/);
});

test('popup lifecycle selector future authority symbols are absent from product source', () => {
  const productSource = `${read(popupPath)}\n${read(htmlPath)}`;
  const futureSymbols = [
    'popupLifecycleSelectorBoundaryContract',
    'popupLifecycleDecisionReport',
    'popupSelectorAuthorityReport',
    'popupDynamicIdProvenanceReport',
    'popupGeneratedShellParityReport',
    'popupListenerOwnerReport',
    'popupDelayedBindingBudgetReport',
    'popupRuntimeMessagePolicy',
    'popupListModeMutationReport',
    'popupProfileLockMutationReport',
    'popupExternalOpenPolicy',
    'popupLifecycleFixtureProvenance',
  ];

  for (const symbol of futureSymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }
});
