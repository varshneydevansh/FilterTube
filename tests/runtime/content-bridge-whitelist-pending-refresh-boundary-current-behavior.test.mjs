import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13535, 600459, '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef']
};

const blockSpecs = {
  contentBridgeRightRailWhitelistObserver: {
    file: 'js/content_bridge.js',
    start: 'function installRightRailWhitelistObserver() {',
    end: 'function queuePrefetchForCard(card) {',
    startLine: 1217,
    lines: 100,
    bytes: 3255,
    hash: '25809587e6d3175b0e4d064c84c86b0708e6c89027c32fa3a7f81c30e6a16988'
  },
  contentBridgeInitializeFallbackThrottle: {
    file: 'js/content_bridge.js',
    start: 'async function initializeDOMFallback(settings) {',
    end: '        const whitelistPendingRefreshState = {',
    startLine: 6088,
    lines: 60,
    bytes: 2297,
    hash: 'b4da976a738c117f0ba7e5f4c379ff80fca9010f2c1e944982cef27c9fe21272'
  },
  contentBridgeWhitelistPendingQueue: {
    file: 'js/content_bridge.js',
    start: '        const whitelistPendingRefreshState = {',
    end: '        function applyWhitelistPendingHide(candidates) {',
    startLine: 6148,
    lines: 69,
    bytes: 3952,
    hash: '1155ce5403825a26516b2383a686bcff2dd0a64949e5eb40e8197766510855f9'
  },
  contentBridgeWhitelistPendingApply: {
    file: 'js/content_bridge.js',
    start: '        function applyWhitelistPendingHide(candidates) {',
    end: '        function fallbackRelevantSelector() {',
    startLine: 6217,
    lines: 111,
    bytes: 5760,
    hash: '3d2510570b99e4f08e600de63911dce5dc348a4ffd2b28c20d1beadd9ffe028b'
  },
  contentBridgeFallbackMutationObserver: {
    file: 'js/content_bridge.js',
    start: '        function fallbackRelevantSelector() {',
    end: '        refreshDOMFallbackMutationObserver();',
    startLine: 6328,
    lines: 137,
    bytes: 5492,
    hash: 'a97a95ca977eb192a0426f00413b69bc1fe92fb65b1dd9b795488de7244b6d19'
  },
  domFallbackOnlyWhitelistPendingSelector: {
    file: 'js/content/dom_fallback.js',
    start: '    // 1. Video/Content Filtering',
    end: '    if (!window.__filtertubePlaylistNavGuardInstalled) {',
    startLine: 2325,
    lines: 12,
    bytes: 468,
    hash: '29ac6ab76923722538fb7004f088bda03416d9da1a80c88ef8698f0c96e5e16d'
  },
  domFallbackWhitelistPendingStateReset: {
    file: 'js/content/dom_fallback.js',
    start: "            const alreadyProcessed = element.hasAttribute('data-filtertube-processed');",
    end: "            const cachedVideoId = element.getAttribute('data-filtertube-video-id') || '';",
    startLine: 2504,
    lines: 54,
    bytes: 3079,
    hash: '1f4523c7359119a8c375614e4fb739f5656ad8186573ea20e6de21ca492f4402'
  },
  domFallbackWhitelistPendingIdentityHide: {
    file: 'js/content/dom_fallback.js',
    start: '            let hideReason = `Content: ${title}`;',
    end: '            if (hideByDuration) {',
    startLine: 3656,
    lines: 16,
    bytes: 960,
    hash: 'db535d5bb1b6d0f6c2e3913e008ab1d67479982ec3155788821410a66b2eb7c1'
  },
  domFallbackOnlyWhitelistPendingReturn: {
    file: 'js/content/dom_fallback.js',
    start: "    if (onlyWhitelistPending && listMode === 'whitelist') {",
    end: '    // Inline survey containers',
    startLine: 3947,
    lines: 4,
    bytes: 83,
    hash: '438296f1dbec1d892317f6177e74323886b6830fd0697eb1b1c12e4779776ad0'
  }
};

const selectedCounts = {
  whitelistPendingRefreshState: 15,
  pendingHideTimer: 4,
  pendingHideCandidates: 9,
  WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT: 5,
  scheduleWhitelistPendingRecheck: 2,
  queueWhitelistPendingHide: 2,
  applyWhitelistPendingHide: 2,
  onlyWhitelistPending: 3,
  'data-filtertube-whitelist-pending': 6,
  'filtertube-hidden': 10,
  'data-filtertube-hidden': 4,
  'forceReprocess: true': 1,
  'preserveScroll: true': 2,
  setTimeout: 6,
  requestAnimationFrame: 1,
  MutationObserver: 11,
  'observer.observe': 2,
  'observer.disconnect': 2,
  'yt-navigate-finish': 2,
  isFilterTubeNativeOverlayQuietMode: 8,
  'currentSettings?.listMode': 6,
  "listMode !== 'whitelist'": 5,
  "path === '/'": 2,
  "path === '/results'": 2,
  "path === '/feed/channels'": 2,
  "path.startsWith('/watch')": 2,
  VIDEO_CARD_SELECTORS: 7,
  queuePrefetchForCard: 1,
  'data-filtertube-processed': 6,
  'data-filtertube-last-processed-id': 5,
  clearCachedChannelMetadata: 4,
  hasExplicitHideReasonMarker: 1,
  'applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true })': 1,
  hasActiveFallbackLifecycleWork: 3,
  fallbackMutationObserverActive: 4,
  disconnectFallbackMutationObserver: 3,
  FilterTube_refreshDOMFallbackObserver: 3
};

const zeroPolicyCounts = [
  'contentBridgeWhitelistPendingRefreshContract',
  'contentBridgeWhitelistPendingRefreshReport',
  'whitelistPendingHideQueueBudget',
  'whitelistPendingPlaceholderPolicy',
  'whitelistPendingObserverOwnerReport',
  'whitelistPendingRouteExclusionPolicy',
  'whitelistPendingRerunBudgetReport',
  'whitelistPendingDomFallbackConsumerParity'
];

const missingRuntimeSymbols = [
  'contentBridgeWhitelistPendingRefreshContract',
  'contentBridgeWhitelistPendingRefreshReport',
  'whitelistPendingHideQueueBudget',
  'whitelistPendingPlaceholderPolicy',
  'whitelistPendingObserverOwnerReport',
  'whitelistPendingRouteExclusionPolicy',
  'whitelistPendingRerunBudgetReport',
  'whitelistPendingDomFallbackConsumerParity',
  'whitelistPendingFixtureProvenance',
  'whitelistPendingMetricArtifact'
];

const missingIntakeGateSymbols = [
  'whitelistPendingIntakeReleaseGate',
  'shouldRunWhitelistPendingIntake',
  'whitelistPendingIntakeNoWorkBudget',
  'whitelistPendingIntakeRoutePolicy',
  'whitelistPendingIntakeMutationBudget',
  'whitelistPendingIntakeParityReport'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = spec.end === null ? text.length : text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256(block),
    block
  };
}

function selectedSource() {
  return Object.values(blockSpecs)
    .map((spec) => blockMetric(spec).block)
    .join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

class FakeClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  contains(value) {
    return this.values.has(value);
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }
}

class FakeStyle {
  constructor() {
    this.values = new Map();
    this.display = '';
  }

  setProperty(name, value, priority = '') {
    this.values.set(name, { value, priority });
    if (name === 'display') this.display = value;
  }
}

class FakeElement {
  constructor({ tagName = 'ytd-rich-item-renderer', attrs = {}, classes = [], children = [], closestMap = {} } = {}) {
    this.tagName = tagName;
    this.attrs = new Map(Object.entries(attrs));
    this.classList = new FakeClassList(classes);
    this.children = children;
    this.closestMap = closestMap;
    this.style = new FakeStyle();
    this.querySelectorCalls = 0;
    this.querySelectorAllCalls = 0;
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  matches(selector) {
    const tag = String(this.tagName || '').toLowerCase();
    return String(selector || '')
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .includes(tag);
  }

  querySelector(selector) {
    this.querySelectorCalls += 1;
    return this.children.find((child) => child.matches?.(selector)) || null;
  }

  querySelectorAll(selector) {
    this.querySelectorAllCalls += 1;
    return this.children.filter((child) => child.matches?.(selector));
  }

  closest(selector) {
    for (const [needle, value] of Object.entries(this.closestMap)) {
      if (String(selector).includes(needle)) return value || this;
    }
    return null;
  }
}

function loadWhitelistPendingRuntime({ listMode = 'whitelist', pathname = '/feed/subscriptions', quiet = false } = {}) {
  const timers = [];
  const fallbackCalls = [];
  const prefetchCalls = [];
  let nextTimerId = 1;
  const context = {
    Element: FakeElement,
    VIDEO_CARD_SELECTORS: 'ytd-rich-item-renderer,ytd-video-renderer,ytd-compact-video-renderer,ytd-playlist-panel-video-renderer,yt-lockup-view-model,yt-lockup-metadata-view-model',
    currentSettings: { listMode },
    document: { location: { pathname } },
    isFilterTubeNativeOverlayQuietMode() { return quiet; },
    applyDOMFallback(...args) { fallbackCalls.push(args); },
    queuePrefetchForCard(card) { prefetchCalls.push(card); },
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay, fired: false });
      return id;
    },
    console: { warn() {}, error() {}, log() {} }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      blockMetric(blockSpecs.contentBridgeWhitelistPendingQueue).block,
      blockMetric(blockSpecs.contentBridgeWhitelistPendingApply).block,
      'globalThis.__exports = {',
      '  whitelistPendingRefreshState,',
      '  scheduleWhitelistPendingRecheck,',
      '  queueWhitelistPendingHide,',
      '  applyWhitelistPendingHide',
      '};'
    ].join('\n'),
    context,
    { filename: 'content-bridge-whitelist-pending.vm.js' }
  );
  return { context, timers, fallbackCalls, prefetchCalls, api: context.__exports };
}

test('content bridge whitelist pending refresh doc is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior boundary with a narrow runtime no-work optimization/);
  assert.match(text, /Runtime behavior changed only for whitelist pending-hide mutation intake/);
  assert.match(text, /not a cache patch, JSON filtering patch, DOM\s+fallback behavior patch/);
  assert.match(text, /content bridge whitelist pending refresh source files pinned: 2/);
  assert.match(text, /content bridge whitelist pending refresh source\/effect blocks pinned: 9/);
  assert.match(text, /whitelist optimization and first-class JSON filtering/);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(source), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('content bridge whitelist pending refresh source/effect blocks remain pinned', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drifted`);
    assert.equal(metric.lines, spec.lines, `${name} line count drifted`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drifted`);
    assert.equal(metric.hash, spec.hash, `${name} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| \`${escapeRegExp(spec.file)}:${spec.startLine}\` \\| ${spec.startLine.toLocaleString('en-US')} \\| ${spec.lines} \\| ${spec.bytes.toLocaleString('en-US')} \\| \`${spec.hash}\` \\|`)
    );
  }
});

test('content bridge whitelist pending refresh selected token counts remain current', () => {
  const text = doc();
  const selected = selectedSource();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drifted`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }

  for (const token of zeroPolicyCounts) {
    assert.equal(countLiteral(selected, token), 0, `${token} unexpectedly appeared`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| 0 \\|`));
  }
});

test('whitelist pending recheck coalesces and calls focused DOM fallback', () => {
  const { api, timers, fallbackCalls } = loadWhitelistPendingRuntime();

  api.scheduleWhitelistPendingRecheck();
  api.scheduleWhitelistPendingRecheck();
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 120);
  assert.notEqual(api.whitelistPendingRefreshState.timer, 0);

  timers[0].handler();
  assert.equal(api.whitelistPendingRefreshState.timer, 0);
  assert.equal(fallbackCalls.length, 1);
  assert.equal(fallbackCalls[0][0], null);
  assert.equal(fallbackCalls[0][1].preserveScroll, true);
  assert.equal(fallbackCalls[0][1].onlyWhitelistPending, true);
});

test('whitelist pending hide applies temporary markers and recheck outside excluded routes', () => {
  const { api, timers, prefetchCalls } = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  const card = new FakeElement({ tagName: 'ytd-rich-item-renderer' });

  api.applyWhitelistPendingHide([card]);

  assert.equal(card.classList.contains('filtertube-hidden'), true);
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(card.getAttribute('data-filtertube-whitelist-pending'), 'true');
  assert.equal(card.style.display, 'none');
  assert.deepEqual(prefetchCalls, [card]);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 120);
});

test('whitelist pending hide skips current route, mode, and state exclusions', () => {
  const blocklist = loadWhitelistPendingRuntime({ listMode: 'blocklist', pathname: '/feed/subscriptions' });
  const blocklistCard = new FakeElement();
  blocklist.api.applyWhitelistPendingHide([blocklistCard]);
  assert.equal(blocklistCard.hasAttribute('data-filtertube-whitelist-pending'), false);

  for (const pathname of ['/', '/results', '/feed/channels', '/watch']) {
    const runtime = loadWhitelistPendingRuntime({ pathname });
    const card = new FakeElement();
    runtime.api.applyWhitelistPendingHide([card]);
    assert.equal(card.hasAttribute('data-filtertube-whitelist-pending'), false, `${pathname} should be excluded`);
  }

  const selectedPlaylist = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  const selected = new FakeElement({
    tagName: 'ytd-playlist-panel-video-renderer',
    attrs: { selected: '' }
  });
  selectedPlaylist.api.applyWhitelistPendingHide([selected]);
  assert.equal(selected.hasAttribute('data-filtertube-whitelist-pending'), false);

  for (const attrs of [
    { 'data-filtertube-processed': 'true' },
    { 'data-filtertube-whitelist-pending': 'true' },
    { 'data-filtertube-hidden': 'true' }
  ]) {
    const runtime = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
    const card = new FakeElement({ attrs });
    runtime.api.applyWhitelistPendingHide([card]);
    assert.equal(card.classList.contains('filtertube-hidden'), false);
  }
});

test('emptyWhitelistAdmittedRoutePreservesPendingHide whitelistRulesAdmittedRoutePreservesNestedDiscovery', () => {
  const { api, timers } = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  const direct = new FakeElement({ tagName: 'ytd-video-renderer' });
  const nested = new FakeElement({ tagName: 'yt-lockup-view-model' });
  const container = new FakeElement({ tagName: 'div', children: [nested] });
  const script = new FakeElement({ tagName: 'script' });

  api.queueWhitelistPendingHide([
    { addedNodes: [direct, direct, container, script] }
  ]);

  assert.equal(api.whitelistPendingRefreshState.pendingHideCandidates.length, 2);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, 40);

  timers[0].handler();
  assert.equal(api.whitelistPendingRefreshState.pendingHideCandidates.length, 0);
  assert.equal(direct.getAttribute('data-filtertube-whitelist-pending'), 'true');
  assert.equal(nested.getAttribute('data-filtertube-whitelist-pending'), 'true');
  assert.equal(script.getAttribute('data-filtertube-whitelist-pending'), null);
});

test('blocklistModeRejectsBeforeSelectorTraversal homeRouteRejectsBeforeSelectorTraversal searchRouteRejectsBeforeSelectorTraversal feedChannelsRouteRejectsBeforeSelectorTraversal watchRouteRejectsBeforeSelectorTraversal', () => {
  const blocklist = loadWhitelistPendingRuntime({ listMode: 'blocklist', pathname: '/feed/subscriptions' });
  const nested = new FakeElement({ tagName: 'ytd-video-renderer' });
  const container = new FakeElement({ tagName: 'div', children: [nested] });

  blocklist.api.queueWhitelistPendingHide([{ addedNodes: [container] }]);

  assert.equal(container.querySelectorCalls, 0);
  assert.equal(container.querySelectorAllCalls, 0);
  assert.equal(blocklist.api.whitelistPendingRefreshState.pendingHideCandidates.length, 0);
  assert.equal(blocklist.timers.length, 0);
  assert.equal(nested.hasAttribute('data-filtertube-whitelist-pending'), false);
  assert.deepEqual(blocklist.prefetchCalls, []);
  for (const pathname of ['/', '/results', '/feed/channels', '/watch']) {
    const runtime = loadWhitelistPendingRuntime({ listMode: 'whitelist', pathname });
    const nested = new FakeElement({ tagName: 'yt-lockup-view-model' });
    const container = new FakeElement({ tagName: 'div', children: [nested] });

    runtime.api.queueWhitelistPendingHide([{ addedNodes: [container] }]);

    assert.equal(container.querySelectorCalls, 0, `${pathname} should reject before querySelector`);
    assert.equal(container.querySelectorAllCalls, 0, `${pathname} should reject before querySelectorAll`);
    assert.equal(runtime.api.whitelistPendingRefreshState.pendingHideCandidates.length, 0);
    assert.equal(runtime.timers.length, 0);
    assert.equal(nested.hasAttribute('data-filtertube-whitelist-pending'), false, `${pathname} should stay unhidden`);
    assert.deepEqual(runtime.prefetchCalls, []);
  }
});

test('removeOnlyMutationsRejectBeforeQueue and resourceOnlyAddedNodesRejectBeforeSelectorTraversal', () => {
  const removeOnly = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  const removed = new FakeElement({ tagName: 'ytd-video-renderer' });

  removeOnly.api.queueWhitelistPendingHide([{ removedNodes: [removed] }]);

  assert.equal(removeOnly.api.whitelistPendingRefreshState.pendingHideCandidates.length, 0);
  assert.equal(removeOnly.timers.length, 0);

  const resourceOnly = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  const script = new FakeElement({ tagName: 'script' });
  const link = new FakeElement({ tagName: 'link' });

  resourceOnly.api.queueWhitelistPendingHide([{ addedNodes: [script, link] }]);

  assert.equal(script.querySelectorCalls, 0);
  assert.equal(script.querySelectorAllCalls, 0);
  assert.equal(link.querySelectorCalls, 0);
  assert.equal(link.querySelectorAllCalls, 0);
  assert.equal(resourceOnly.api.whitelistPendingRefreshState.pendingHideCandidates.length, 0);
  assert.equal(resourceOnly.timers.length, 0);
});

test('fullCandidateQueueRejectsBeforeNestedTraversal', () => {
  const { api, timers } = loadWhitelistPendingRuntime({ pathname: '/feed/subscriptions' });
  for (let index = 0; index < 160; index += 1) {
    api.whitelistPendingRefreshState.pendingHideCandidates.push(new FakeElement({ tagName: 'ytd-video-renderer' }));
  }

  const nested = new FakeElement({ tagName: 'yt-lockup-view-model' });
  const container = new FakeElement({ tagName: 'div', children: [nested] });

  api.queueWhitelistPendingHide([{ addedNodes: [container] }]);

  assert.equal(container.querySelectorCalls, 0);
  assert.equal(container.querySelectorAllCalls, 0);
  assert.equal(api.whitelistPendingRefreshState.pendingHideCandidates.length, 160);
  assert.equal(api.whitelistPendingRefreshState.pendingHideCandidates.includes(nested), false);
  assert.equal(timers.length, 0);
});

test('content bridge and DOM fallback whitelist pending flow remains source-derived', () => {
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));
  const text = doc();

  assert.match(blocks.contentBridgeRightRailWhitelistObserver, /rightRailWhitelistObserverInstalled/);
  assert.match(blocks.contentBridgeRightRailWhitelistObserver, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.match(blocks.contentBridgeRightRailWhitelistObserver, /startsWith\('\/watch'\)/);
  assert.match(blocks.contentBridgeRightRailWhitelistObserver, /forceReprocess: true/);
  assert.match(blocks.contentBridgeInitializeFallbackThrottle, /await new Promise\(resolve => setTimeout\(resolve, 1000\)\)/);
  assert.match(blocks.contentBridgeInitializeFallbackThrottle, /const MIN_FALLBACK_INTERVAL_MS = 250/);
  assert.match(blocks.contentBridgeInitializeFallbackThrottle, /requestAnimationFrame/);
  assert.match(blocks.contentBridgeWhitelistPendingQueue, /const WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT = 160/);
  assert.match(blocks.contentBridgeWhitelistPendingQueue, /applyDOMFallback\(null, \{ preserveScroll: true, onlyWhitelistPending: true \}\)/);
  assert.match(blocks.contentBridgeWhitelistPendingQueue, /currentSettings\?\.listMode !== 'whitelist'/);
  assert.match(blocks.contentBridgeWhitelistPendingQueue, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);
  assert.match(blocks.contentBridgeWhitelistPendingQueue, /if \(tagName === 'script' \|\| tagName === 'style' \|\| tagName === 'link' \|\| tagName === 'svg' \|\| tagName === 'path'\) return/);
  assert.match(blocks.contentBridgeWhitelistPendingApply, /const listMode = currentSettings\?\.listMode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(blocks.contentBridgeWhitelistPendingApply, /path === '\/' \|\| path === '\/results' \|\| path === '\/feed\/channels' \|\| path\.startsWith\('\/watch'\)/);
  assert.match(blocks.contentBridgeWhitelistPendingApply, /element\.setAttribute\('data-filtertube-whitelist-pending', 'true'\)/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /nodeLooksFallbackRelevant/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /hasActiveFallbackLifecycleWork/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /disconnectFallbackMutationObserver/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /window\.FilterTube_refreshDOMFallbackObserver = refreshDOMFallbackMutationObserver/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /queueWhitelistPendingHide\(mutations\)/);
  assert.ok(
    blocks.contentBridgeFallbackMutationObserver.indexOf('queueWhitelistPendingHide(mutations)') <
    blocks.contentBridgeFallbackMutationObserver.indexOf('scheduleImmediateFallback()'),
    'observer should show queue work precedes immediate fallback scheduling'
  );
  assert.match(blocks.contentBridgeFallbackMutationObserver, /scheduleImmediateFallback\(\)/);
  assert.match(blocks.contentBridgeFallbackMutationObserver, /observer\.observe\(target, \{ childList: true, subtree: true \}\)/);
  assert.match(blocks.domFallbackOnlyWhitelistPendingSelector, /\$\{VIDEO_CARD_SELECTORS\}\[data-filtertube-whitelist-pending="true"\]/);
  assert.match(blocks.domFallbackWhitelistPendingStateReset, /const hasWhitelistPending = element\.getAttribute\('data-filtertube-whitelist-pending'\) === 'true'/);
  assert.match(blocks.domFallbackWhitelistPendingStateReset, /if \(alreadyProcessed && hasWhitelistPending\)/);
  assert.match(blocks.domFallbackWhitelistPendingIdentityHide, /hideReason = 'Pending whitelist identity'/);
  assert.match(blocks.domFallbackOnlyWhitelistPendingReturn, /if \(onlyWhitelistPending && listMode === 'whitelist'\)/);
  assert.match(text, /temporary false-hide state while identity is pending/);
  assert.match(text, /Release Optimization Acceptance Gate/);
  assert.match(text, /release whitelist-pending intake gate rows: 10/);
  for (const rowId of [
    'WL-INTAKE-00-native-overlay-quiet',
    'WL-INTAKE-01-blocklist-mode',
    'WL-INTAKE-02-empty-whitelist-fail-close',
    'WL-INTAKE-03-whitelist-rules-admitted-route',
    'WL-INTAKE-04-route-exclusions',
    'WL-INTAKE-05-remove-only-mutations',
    'WL-INTAKE-06-resource-only-added-nodes',
    'WL-INTAKE-07-nested-card-container',
    'WL-INTAKE-08-candidate-cap-exhaustion',
    'WL-INTAKE-09-current-behavior-parity'
  ]) {
    assert.match(text, new RegExp(escapeRegExp(rowId)));
  }
});

test('content bridge whitelist pending future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  assert.match(text, /Content bridge whitelist pending refresh still needs/);
  assert.match(text, /pending hide queue and candidate budget reports/);
  assert.match(text, /placeholder hide policy by route and renderer/);
  assert.match(text, /observer and timer ownership reports/);
  assert.match(text, /DOM fallback focused-rerun parity proof/);

  for (const symbol of missingRuntimeSymbols) {
    assert.match(text, new RegExp(escapeRegExp(symbol)));
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }
  for (const symbol of missingIntakeGateSymbols) {
    assert.match(text, new RegExp(escapeRegExp(symbol)));
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }

  assert.match(
    text,
    /No `contentBridgeWhitelistPendingRefreshContract`, `contentBridgeWhitelistPendingRefreshReport`, `whitelistPendingHideQueueBudget`, `whitelistPendingPlaceholderPolicy`, `whitelistPendingObserverOwnerReport`, `whitelistPendingRouteExclusionPolicy`, `whitelistPendingRerunBudgetReport`, `whitelistPendingDomFallbackConsumerParity`, `whitelistPendingFixtureProvenance`, or `whitelistPendingMetricArtifact` exists/
  );
  assert.match(
    text,
    /No\s+`whitelistPendingIntakeReleaseGate`, `shouldRunWhitelistPendingIntake`,\s+`whitelistPendingIntakeNoWorkBudget`, `whitelistPendingIntakeRoutePolicy`,\s+`whitelistPendingIntakeMutationBudget`, or\s+`whitelistPendingIntakeParityReport` exists/
  );
});
