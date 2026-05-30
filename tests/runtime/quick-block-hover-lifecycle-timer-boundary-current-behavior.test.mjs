import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content/block_channel.js': [3175, 127396, '1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83']
};

const blockSpecs = {
  quickBlockGlobals: {
    file: 'js/content/block_channel.js',
    start: 'const dropdownVisibilityObservers = new WeakMap();',
    end: 'const FT_DROPDOWN_SELECTORS =',
    startLine: 80,
    lines: 22,
    bytes: 1055,
    hash: '5c9dbc252a94d17b25e29e5c35233d551deeef0d8e1ee0e52c67c5065be9651d'
  },
  quickBlockSurfacePredicates: {
    file: 'js/content/block_channel.js',
    start: 'const isMobileYouTubeSurface = () => {',
    end: 'const isElementVisibleForQuickBlock =',
    startLine: 121,
    lines: 31,
    bytes: 974,
    hash: 'b0319db9efb0cb16f6dac8b450949df41542075f1eb4cd11be20db4e786d8dcf'
  },
  quickBlockOcclusionCache: {
    file: 'js/content/block_channel.js',
    start: 'function invalidateQuickBlockSurfaceStateCache() {',
    end: 'function untrackQuickBlockViewportHost(hostCard) {',
    startLine: 237,
    lines: 73,
    bytes: 2579,
    hash: '0a257411a4f81964972bfe4e340a65761e21e7548c325783ad8821072f74aa44'
  },
  quickBlockViewportPruning: {
    file: 'js/content/block_channel.js',
    start: 'function untrackQuickBlockViewportHost(hostCard) {',
    end: 'const isMobileWatchNextQuickBlockHost =',
    startLine: 310,
    lines: 143,
    bytes: 4741,
    hash: '0d20205995c8c9459ca992a24e942f6eeaae89ef7812dea411eca2f6412338f7'
  },
  quickBlockViewportRefresh: {
    file: 'js/content/block_channel.js',
    start: 'function isQuickBlockHostNearViewport(hostCard, margin = 900) {',
    end: 'function setQuickBlockHoverStateForHost',
    startLine: 925,
    lines: 97,
    bytes: 3961,
    hash: 'b136e450414bb439083d8dc505c6b92b70ceebbf600395d2523b22d5e59e67d2'
  },
  quickBlockHoverState: {
    file: 'js/content/block_channel.js',
    start: 'function setQuickBlockHoverStateForHost(hostCard, active, stickyMs = 0) {',
    end: 'const QUICK_BLOCK_CARD_SELECTORS =',
    startLine: 1022,
    lines: 67,
    bytes: 2162,
    hash: '58f5cc099c0e78d55405794747e669a110d6f3f54425d91853f9e92058069dcc'
  },
  quickBlockCardTargetFastPath: {
    file: 'js/content/block_channel.js',
    start: 'const QUICK_BLOCK_CARD_SELECTORS = [',
    end: 'const isQuickBlockEnabled = () => {',
    startLine: 1089,
    lines: 116,
    bytes: 3885,
    hash: '1912076cdad42fd711131fadfe294de91970d226e08784b83f2c72fa42137500'
  },
  quickBlockActionFallback: {
    file: 'js/content/block_channel.js',
    start: 'async function runQuickBlockAction(videoCard, triggerBtn) {',
    end: 'function attachQuickBlockWrapHoverEvents',
    startLine: 1740,
    lines: 34,
    bytes: 1448,
    hash: 'ec5afa97351525978b400c7d020dbaa39cbe2e3edae0fd3717c53e72ca89ebf2'
  },
  quickBlockWrapHoverEvents: {
    file: 'js/content/block_channel.js',
    start: 'function attachQuickBlockWrapHoverEvents(wrap, hostCard) {',
    end: 'function ensureQuickBlockButton',
    startLine: 1774,
    lines: 14,
    bytes: 888,
    hash: '44533bcceeb20e45528a041e9a1770bd264c393f1872a458efc3ccea6fc8509c'
  },
  quickBlockEnsureButton: {
    file: 'js/content/block_channel.js',
    start: 'function ensureQuickBlockButton(card) {',
    end: 'function sweepQuickBlockButtons',
    startLine: 1788,
    lines: 150,
    bytes: 6556,
    hash: 'fc46ee05e9bfb3e63f057563c7c4a50d73dc43792f6b8da4b67fe62e460af78c'
  },
  quickBlockSweepSchedule: {
    file: 'js/content/block_channel.js',
    start: 'function sweepQuickBlockButtons(root = document) {',
    end: 'function setupQuickBlockObserver',
    startLine: 1938,
    lines: 41,
    bytes: 1342,
    hash: '931331c0e6890d9a364b586463a46b255d17a7b7d5610de81dcf754bb96f2103'
  },
  quickBlockObserverSetup: {
    file: 'js/content/block_channel.js',
    start: 'function setupQuickBlockObserver() {',
    end: '/**\n * Observe dropdowns',
    startLine: 1979,
    lines: 322,
    bytes: 13896,
    hash: 'cf6b14c4d67b40cdc33a0126b920c224ef184a60c361481b22c025c9328dffc5'
  }
};

const selectedCounts = {
  quickBlockStylesInjected: 1,
  quickBlockObserverStarted: 5,
  quickBlockSweepTimer: 4,
  quickBlockPeriodicTimer: 0,
  quickBlockViewportUpdateScheduled: 4,
  quickBlockHostVisibilityObserver: 7,
  quickBlockViewportHosts: 16,
  quickBlockSurfaceStateCache: 7,
  quickBlockOcclusionCache: 10,
  QUICK_BLOCK_SURFACE_STATE_CACHE_MS: 2,
  QUICK_BLOCK_OCCLUSION_CACHE_MS: 2,
  QUICK_BLOCK_HOVER_STICKY_MS: 11,
  QUICK_BLOCK_LEAVE_STICKY_MS: 10,
  QUICK_BLOCK_POINTER_RECOVERY_ARM_MS: 3,
  QUICK_BLOCK_VIEWPORT_HOST_LIMIT: 3,
  QUICK_BLOCK_VIEWPORT_REFRESH_HOST_LIMIT: 2,
  QUICK_BLOCK_DESKTOP_HOVER_INTENT_MS: 2,
  quickBlockPointerRecoveryArmedUntil: 5,
  quickBlockPointerRecoveryArmer: 4,
  quickBlockHoverIntentTimer: 7,
  quickBlockHoverIntentCard: 6,
  cancelQuickBlockHoverIntent: 4,
  scheduleQuickBlockHoverIntent: 2,
  invalidateQuickBlockOcclusionCache: 4,
  getQuickBlockViewportOcclusionBounds: 1,
  pruneQuickBlockViewportHosts: 3,
  untrackQuickBlockViewportHost: 4,
  isMobileYouTubeSurface: 5,
  isHoverCapableDesktopSurface: 2,
  shouldEagerQuickBlockSweep: 5,
  requestAnimationFrame: 3,
  setTimeout: 8,
  clearTimeout: 4,
  'window.setInterval': 0,
  clearInterval: 0,
  MutationObserver: 1,
  IntersectionObserver: 3,
  'observer.observe': 2,
  addEventListener: 33,
  removeEventListener: 1,
  DOMContentLoaded: 1,
  focusin: 4,
  focusout: 4,
  pointerenter: 4,
  pointerleave: 3,
  pointermove: 2,
  mouseenter: 5,
  mouseleave: 5,
  resize: 1,
  orientationchange: 1,
  scroll: 1,
  click: 2,
  'data-filtertube-quick-hover': 6,
  'data-filtertube-quick-sticky': 8,
  'data-filtertube-quick-events': 2,
  'data-filtertube-quick-anchor-events': 2,
  'data-filtertube-quick-wrap-events': 2,
  'filtertube-quick-block-wrap': 7,
  'filtertube-quick-block-host': 3,
  isQuickBlockEnabled: 14,
  removeQuickBlockButtons: 4,
  scheduleQuickBlockSweep: 5,
  sweepQuickBlockButtons: 3,
  ensureQuickBlockButton: 5,
  syncQuickBlockSurfaceState: 6,
  getQuickBlockSurfaceState: 5,
  invalidateQuickBlockSurfaceStateCache: 5,
  scheduleQuickBlockViewportRefresh: 3,
  trackQuickBlockViewportHost: 6,
  findQuickBlockCardFromTarget: 3,
  QUICK_BLOCK_CARD_TAGS: 2,
  QUICK_BLOCK_CARD_CLASS_NAMES: 2,
  isYouTubeOverlaySurfaceOpen: 3,
  isMobileSearchSurfaceOpen: 3,
  'applyDOMFallback(null, { preserveScroll: true })': 1,
  handleBlockChannelClick: 2,
  runQuickBlockFallback: 1,
  applyQuickBlockImmediateHide: 1,
  'data-busy': 3,
  pickHostFromTarget: 2,
  getHostFromCachedTarget: 3,
  pickHostFromPoint: 2,
  elementsFromPoint: 1,
  resolveOutermostShortsQuickBlockHost: 1
};

const zeroPolicyCounts = [
  'quickBlockHoverLifecycleContract',
  'quickBlockHoverLifecycleReport',
  'quickBlockTimerBudget',
  'quickBlockObserverOwnerReport',
  'quickBlockPeriodicSweepBudget',
  'quickBlockViewportRafBudget',
  'quickBlockHoverStickyPolicy',
  'quickBlockTeardownRegistry',
  'quickBlockLifecycleReportContract',
  'quickBlockLifecycleReportApproval',
  'quickBlockLifecycleNoWorkBudgetReport',
  'quickBlockLifecycleNegativeFixturePacket',
  'quickBlockLifecyclePlacementParityProof',
  'quickBlockLifecycleRollbackReport'
];

const missingRuntimeSymbols = [
  'quickBlockHoverLifecycleContract',
  'quickBlockHoverLifecycleReport',
  'quickBlockTimerBudget',
  'quickBlockObserverOwnerReport',
  'quickBlockPeriodicSweepBudget',
  'quickBlockViewportRafBudget',
  'quickBlockHoverStickyPolicy',
  'quickBlockTeardownRegistry',
  'quickBlockActionFallbackRerunBudget',
  'quickBlockLifecycleMetricArtifact',
  'quickBlockLifecycleReportContract',
  'quickBlockLifecycleReportApproval',
  'quickBlockLifecycleNoWorkBudgetReport',
  'quickBlockLifecycleNegativeFixturePacket',
  'quickBlockLifecyclePlacementParityProof',
  'quickBlockLifecycleRollbackReport'
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

function quickBlockSurfaceStateSource() {
  const text = read('js/content/block_channel.js');
  const start = text.indexOf('const isMobileYouTubeSurface = () => {');
  assert.notEqual(start, -1, 'missing quick-block surface state start');
  const end = text.indexOf('const isMobileWatchNextQuickBlockHost =', start);
  assert.notEqual(end, -1, 'missing quick-block surface state end');
  return text.slice(start, end);
}

function sourceSlice(startNeedle, endNeedle) {
  return sliceBetween(read('js/content/block_channel.js'), {
    start: startNeedle,
    end: endNeedle
  }).block;
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .map(read)
    .join('\n');
}

function assertQuickBlockLifecycleReportContract(text) {
  assert.match(text, /Quick-Block Lifecycle Report Contract Continuation - 2026-05-29/);
  assert.match(text, /quick-block lifecycle report contract rows: 12/);
  assert.match(text, /required quick-block lifecycle report fields: 20/);
  assert.match(text, /implementation-ready quick-block lifecycle report rows: 0/);
  assert.match(text, /runtime quick-block lifecycle report approvals: 0/);
  assert.match(text, /quick-block lifecycle optimization approval from report contract: NO-GO/);
  assert.match(text, /runtime behavior changed by this continuation: no/);
  assert.match(text, /quick-block lifecycle owner/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /Fixtures\["Positive and negative fixture packet"\]/);

  for (const rowId of [
    'FT-QBLR-00-scope',
    'FT-QBLR-01-enablement',
    'FT-QBLR-02-surface-cache',
    'FT-QBLR-03-viewport-budget',
    'FT-QBLR-04-hover-intent',
    'FT-QBLR-05-target-resolution',
    'FT-QBLR-06-pointer-recovery',
    'FT-QBLR-07-sweep-observer',
    'FT-QBLR-08-button-dom',
    'FT-QBLR-09-action-fallback',
    'FT-QBLR-10-cross-feature',
    'FT-QBLR-11-artifact-gate'
  ]) {
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(rowId)}\` \\|`), `missing report row ${rowId}`);
  }

  for (const field of [
    'route',
    'surface',
    'profile',
    'listMode',
    'deviceClass',
    'activeRuleState',
    'firstRuleAffordance',
    'nativeOverlayState',
    'surfaceCacheState',
    'viewportHostCount',
    'hoverIntentState',
    'pointerRecoveryState',
    'sweepAdmission',
    'observerAdmission',
    'buttonDomState',
    'actionFallbackState',
    'optimisticHideEffect',
    'domFallbackRerunEffect',
    'negativeNoWorkProof',
    'metricArtifact'
  ]) {
    assert.match(text, new RegExp(`\\b${escapeRegExp(field)}\\b`), `missing required report field ${field}`);
  }

  const surface = blockMetric(blockSpecs.quickBlockSurfacePredicates).block;
  const viewport = blockMetric(blockSpecs.quickBlockViewportRefresh).block;
  const setup = blockMetric(blockSpecs.quickBlockObserverSetup).block;
  const action = blockMetric(blockSpecs.quickBlockActionFallback).block;

  assert.match(surface, /const isMobileYouTubeSurface = \(\) =>/);
  assert.match(viewport, /QUICK_BLOCK_VIEWPORT_REFRESH_HOST_LIMIT/);
  assert.match(setup, /shouldEagerQuickBlockSweep\(\)/);
  assert.match(setup, /document\.removeEventListener\('pointermove', onPointerMove, \{ capture: true \}\)/);
  assert.doesNotMatch(setup, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(action, /applyQuickBlockImmediateHide/);
  assert.match(action, /setTimeout\(\(\) => applyDOMFallback\(null, \{ preserveScroll: true \}\), 120\)/);
}

class FakeElement {
  constructor(name = 'el') {
    this.name = name;
    this.attrs = new Map();
    this.listeners = [];
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  addEventListener(type, handler, options) {
    this.listeners.push({ type, handler, options });
  }
}

class QuickBlockDomNode extends FakeElement {
  constructor(tagName = 'div', { classNames = [], attrs = {} } = {}) {
    super(tagName);
    this.tagName = tagName.toUpperCase();
    this.parentElement = null;
    this.children = [];
    this.nodeAttrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.classNames = new Set(classNames);
    this.classList = {
      contains: (name) => this.classNames.has(name)
    };
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getAttribute(name) {
    if (this.nodeAttrs.has(name)) return this.nodeAttrs.get(name);
    return super.getAttribute(name);
  }

  matches(selector) {
    return String(selector || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .some((item) => this.matchesOne(item));
  }

  matchesOne(selector) {
    if (!selector) return false;
    if (selector.startsWith('.')) {
      return this.classList.contains(selector.slice(1));
    }
    if (/^a\[href\*=["']\/shorts\/["']\]$/i.test(selector)) {
      return this.tagName.toLowerCase() === 'a' && String(this.getAttribute('href') || '').includes('/shorts/');
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    const stack = [...this.children];
    while (stack.length > 0) {
      const child = stack.shift();
      if (child.matches(selector)) return child;
      stack.unshift(...child.children);
    }
    return null;
  }
}

function loadQuickBlockShortsHostRuntime() {
  const context = {
    Element: QuickBlockDomNode
  };
  vm.runInNewContext(
    [
      blockMetric(blockSpecs.quickBlockCardTargetFastPath).block,
      sourceSlice('function isShortsQuickBlockCard(card) {', 'function resolveQuickBlockHideTarget(videoCard) {'),
      'globalThis.__api = { findQuickBlockCardFromTarget, resolveQuickBlockHost, resolveOutermostShortsQuickBlockHost, QUICK_BLOCK_CARD_SELECTORS };'
    ].join('\n'),
    context
  );
  return context.__api;
}

function loadHoverRuntime({ mobileOpen = false, overlayOpen = false, viewportOk = true } = {}) {
  const timers = [];
  const cleared = [];
  const syncCalls = [];
  const viewportCalls = [];
  const context = {
    Element: FakeElement,
    setTimeout(fn, delay) {
      const timer = { fn, delay, active: true };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      if (timer) timer.active = false;
      cleared.push(timer);
    },
    isMobileSearchSurfaceOpen: () => mobileOpen,
    isYouTubeOverlaySurfaceOpen: () => overlayOpen,
    updateQuickBlockViewportStateForHost(host) {
      viewportCalls.push(host);
      return viewportOk;
    },
    syncQuickBlockSurfaceState() {
      syncCalls.push(true);
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.quickBlockHoverState).block}\nglobalThis.__api = { setQuickBlockHoverStateForHost };`, context);
  return {
    ...context.__api,
    timers,
    cleared,
    syncCalls,
    viewportCalls
  };
}

function loadViewportRuntime(hosts) {
  const rafQueue = [];
  const syncCalls = [];
  const updates = [];
  const context = {
    Element: FakeElement,
    requestAnimationFrame(fn) {
      rafQueue.push(fn);
    },
    isQuickBlockEnabled: () => true,
    syncQuickBlockSurfaceState() {
      syncCalls.push(true);
    },
    updateQuickBlockViewportStateForHost(host) {
      updates.push(host);
      return true;
    },
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, '.filtertube-quick-block-host');
        return hosts;
      }
    }
  };
  vm.runInNewContext(
    `${blockMetric(blockSpecs.quickBlockGlobals).block}\n${blockMetric(blockSpecs.quickBlockViewportPruning).block}\n${blockMetric(blockSpecs.quickBlockViewportRefresh).block}\nglobalThis.__api = { scheduleQuickBlockViewportRefresh, getScheduled: () => quickBlockViewportUpdateScheduled };`,
    context
  );
  return {
    ...context.__api,
    rafQueue,
    syncCalls,
    updates
  };
}

function loadSweepRuntime(cards) {
  const timers = [];
  const ensured = [];
  const removed = [];
  const root = {
    querySelectorAll(selector) {
      assert.equal(selector, 'quick-card-selector');
      return cards;
    }
  };
  const context = {
    Element: FakeElement,
    document: root,
    setTimeout(fn, delay) {
      const timer = { fn, delay };
      timers.push(timer);
      return timer;
    },
    isQuickBlockEnabled: () => true,
    removeQuickBlockButtons() {
      removed.push(true);
    },
    ensureQuickBlockButton(card) {
      ensured.push(card);
    }
  };
  vm.runInNewContext(
    `${blockMetric(blockSpecs.quickBlockGlobals).block}\nconst QUICK_BLOCK_CARD_SELECTORS = 'quick-card-selector';\n${blockMetric(blockSpecs.quickBlockSweepSchedule).block}\nglobalThis.__api = { scheduleQuickBlockSweep, sweepQuickBlockButtons, getTimer: () => quickBlockSweepTimer };`,
    context
  );
  return {
    ...context.__api,
    timers,
    ensured,
    removed,
    root
  };
}

test('quick-block lifecycle audit is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior proof slice with 2026-05-26 second-pass idle-detach addendum/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not approval\s+to change runtime filtering, JSON mutation, DOM mutation, storage, message,\s+lifecycle, network, prompt, or settings semantics/);
  assert.match(text, /codebase inspection is finding optimization locations and first-class JSON filter blockers/);
  assert.match(text, /quick-block hover lifecycle timer source files: 1/);
  assert.match(text, /quick-block hover lifecycle timer source\/effect blocks: 12/);
  assert.match(text, /descendant `\/shorts\/` anchor or `\.shortsLockupViewModelHost` inner render node to the outer `ytd-rich-item-renderer`/);
  assertQuickBlockLifecycleReportContract(text);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`));
  }
});

test('quick-block lifecycle source/effect blocks and selected counts stay pinned', () => {
  const text = doc();
  const selected = selectedSource();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drift`);
    assert.equal(metric.lines, spec.lines, `${name} line count drift`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drift`);
    assert.equal(metric.hash, spec.hash, `${name} hash drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(name)}\` \\| ${spec.startLine} \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }
});

test('quick-block hover active and leave paths keep sticky timers explicit', () => {
  const host = new FakeElement('host');
  const runtime = loadHoverRuntime();

  runtime.setQuickBlockHoverStateForHost(host, true, 1200);
  assert.equal(host.getAttribute('data-filtertube-quick-hover'), 'true');
  assert.equal(host.getAttribute('data-filtertube-quick-sticky'), 'true');
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 1200);

  runtime.timers[0].fn();
  assert.equal(host.hasAttribute('data-filtertube-quick-sticky'), false);
  assert.equal(host.__filtertubeQuickHoverTimer, 0);

  runtime.setQuickBlockHoverStateForHost(host, true, 1200);
  const firstLeaveTimer = host.__filtertubeQuickHoverTimer;
  runtime.setQuickBlockHoverStateForHost(host, false, 700);
  assert.equal(runtime.cleared.at(-1), firstLeaveTimer);
  assert.equal(host.hasAttribute('data-filtertube-quick-hover'), false);
  assert.equal(host.getAttribute('data-filtertube-quick-sticky'), 'true');
  assert.equal(runtime.timers.at(-1).delay, 700);

  runtime.timers.at(-1).fn();
  assert.equal(host.hasAttribute('data-filtertube-quick-sticky'), false);
});

test('quick-block overlay or hidden viewport path clears hover without scheduling sticky timers', () => {
  for (const runtime of [
    loadHoverRuntime({ mobileOpen: true }),
    loadHoverRuntime({ overlayOpen: true }),
    loadHoverRuntime({ viewportOk: false })
  ]) {
    const host = new FakeElement('blocked-host');
    host.setAttribute('data-filtertube-quick-hover', 'true');
    host.setAttribute('data-filtertube-quick-sticky', 'true');

    runtime.setQuickBlockHoverStateForHost(host, true, 1200);
    assert.equal(host.hasAttribute('data-filtertube-quick-hover'), false);
    assert.equal(host.hasAttribute('data-filtertube-quick-sticky'), false);
    assert.equal(runtime.timers.length, 0);
    assert.equal(runtime.syncCalls.length, 1);
  }
});

test('quick-block viewport refresh coalesces one RAF and updates current hosts', () => {
  const hosts = [new FakeElement('one'), new FakeElement('two')];
  const runtime = loadViewportRuntime(hosts);

  runtime.scheduleQuickBlockViewportRefresh();
  runtime.scheduleQuickBlockViewportRefresh();

  assert.equal(runtime.rafQueue.length, 1);
  assert.equal(runtime.getScheduled(), true);

  runtime.rafQueue[0]();
  assert.equal(runtime.getScheduled(), false);
  assert.equal(runtime.syncCalls.length, 1);
  assert.deepEqual(runtime.updates, hosts);
});

test('quick-block surface state caches broad overlay checks but force refresh bypasses cache', () => {
  let now = 1000;
  let queryCount = 0;
  const toggles = [];
  const context = {
    Element: FakeElement,
    Date: { now: () => now },
    location: { hostname: 'www.youtube.com', pathname: '/', search: '' },
    window: {
      matchMedia: () => ({ matches: false }),
      innerWidth: 1200,
      innerHeight: 900,
      getComputedStyle: () => ({ display: 'block', visibility: 'visible' })
    },
    document: {
      documentElement: {
        clientWidth: 1200,
        clientHeight: 900,
        toggleAttribute(name, value) {
          toggles.push({ name, value });
        }
      },
      activeElement: null,
      querySelectorAll() {
        queryCount += 1;
        return [];
      }
    }
  };
  vm.runInNewContext(
    `let quickBlockSurfaceStateCache = { ts: 0, path: '', searchOpen: false, overlayOpen: false };\nconst QUICK_BLOCK_SURFACE_STATE_CACHE_MS = 120;\nconst FT_YOUTUBE_OVERLAY_SELECTORS = 'overlay-selector';\n${quickBlockSurfaceStateSource()}\nglobalThis.__api = { syncQuickBlockSurfaceState, getQuickBlockSurfaceState, invalidateQuickBlockSurfaceStateCache };`,
    context
  );

  context.__api.syncQuickBlockSurfaceState({ force: true });
  context.__api.syncQuickBlockSurfaceState();
  assert.equal(queryCount, 1);

  now += 50;
  context.__api.syncQuickBlockSurfaceState();
  assert.equal(queryCount, 1);

  context.__api.invalidateQuickBlockSurfaceStateCache();
  context.__api.syncQuickBlockSurfaceState();
  assert.equal(queryCount, 2);
  assert.equal(toggles.length, 8);
});

test('quick-block sweep scheduler coalesces one timer and ensures cards after 80 ms', () => {
  const cards = [new FakeElement('card-one'), new FakeElement('card-two')];
  const runtime = loadSweepRuntime(cards);

  runtime.scheduleQuickBlockSweep(runtime.root);
  runtime.scheduleQuickBlockSweep(runtime.root);

  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 80);
  assert.ok(runtime.getTimer());

  runtime.timers[0].fn();
  assert.equal(runtime.getTimer(), 0);
  assert.deepEqual(runtime.ensured, cards);
  assert.deepEqual(runtime.removed, []);
});

test('quick-block observer setup owns page listeners, mutation observer, and periodic sweep without teardown', () => {
  const text = doc();
  const setup = blockMetric(blockSpecs.quickBlockObserverSetup).block;

  assert.match(setup, /if \(quickBlockObserverStarted\) return/);
  assert.match(setup, /ensureQuickBlockStyles\(\)/);
  assert.match(setup, /document\.addEventListener\('focusin'/);
  assert.match(setup, /document\.addEventListener\('focusout'/);
  assert.match(setup, /document\.addEventListener\('input'/);
  assert.match(setup, /document\.addEventListener\('click'/);
  assert.match(setup, /document\.addEventListener\('scroll'/);
  assert.match(setup, /window\.addEventListener\('resize'/);
  assert.match(setup, /window\.addEventListener\('orientationchange'/);
  assert.match(setup, /document\.addEventListener\('pointerenter'/);
  assert.match(setup, /document\.addEventListener\('pointermove'/);
  assert.match(setup, /document\.addEventListener\('mouseleave'/);
  assert.match(setup, /quickBlockPointerRecoveryArmer = \(\) =>/);
  assert.match(setup, /document\.removeEventListener\('pointermove', onPointerMove, \{ capture: true \}\)/);
  assert.match(setup, /schedulePointerMoveRecoveryStop\(\)/);
  assert.match(setup, /findQuickBlockCardFromTarget\(event\?\.target\)/);
  assert.match(setup, /document\.addEventListener\('pointermove', onPointerMove, \{ passive: true, capture: true \}\)/);
  assert.match(setup, /new MutationObserver/);
  assert.match(setup, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(setup, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(setup, /document\.addEventListener\('yt-navigate-finish'/);
  assert.equal(countLiteral(setup, 'removeEventListener'), 1);
  assert.equal(countLiteral(setup, 'clearInterval'), 0);
  assert.match(text, /paired pointermove `removeEventListener` only for the dynamic recovery listener/);
});

test('quick-block empty desktop first-rule lifecycle correction is source-pinned', () => {
  const text = doc();
  const source = read('js/content/block_channel.js');
  const enabledGate = sourceSlice('const isQuickBlockEnabled = () => {', 'function hasActiveQuickBlockRuleContext(settings) {');
  const ruleContext = sourceSlice('function hasActiveQuickBlockRuleContext(settings) {', 'function shouldEagerQuickBlockSweep() {');
  const setup = blockMetric(blockSpecs.quickBlockObserverSetup).block;
  const emptyDesktopFixture = read('tests/runtime/empty-install-idle-observer-budget-current-behavior.test.mjs');

  assert.match(text, /Empty Desktop First-Rule Lifecycle Correction - 2026-05-30/);
  assert.match(text, /quick-block empty desktop correction rows: 5/);
  assert.match(text, /empty desktop first-rule page listeners: PRESENT/);
  assert.match(text, /empty desktop active rule context: ABSENT/);
  assert.match(text, /empty desktop body observer: ABSENT/);
  assert.match(text, /runtime behavior changed by this correction: no/);
  assert.match(text, /first-rule quick-cross can appear/);
  assert.match(text, /No desktop body MutationObserver/);

  assert.match(enabledGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(enabledGate, /currentSettings\.listMode === 'whitelist'/);
  assert.match(enabledGate, /return true;/);
  assert.doesNotMatch(enabledGate, /hasActiveQuickBlockRuleContext/);

  assert.match(ruleContext, /hasList\(settings\.filterKeywords\)/);
  assert.match(ruleContext, /hasList\(settings\.filterChannels\)/);
  assert.match(ruleContext, /hasList\(settings\.filterKeywordsComments\)/);
  assert.match(ruleContext, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\);/);

  assert.match(setup, /if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.doesNotMatch(setup, /hasActiveQuickBlockRuleContext/);
  assert.ok(
    setup.indexOf('if (!isQuickBlockEnabled()) return false;') <
      setup.indexOf('quickBlockObserverStarted = true;')
  );
  assert.ok(setup.indexOf('quickBlockObserverStarted = true;') < setup.indexOf('ensureQuickBlockStyles();'));
  assert.match(setup, /document\.addEventListener\('pointerenter'/);
  assert.match(setup, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(source, /function shouldEagerQuickBlockSweep\(\) \{\s+return isMobileYouTubeSurface\(\);\s+\}/);
  assert.match(setup, /if \(shouldEagerQuickBlockSweep\(\)\) \{[\s\S]*new MutationObserver/);

  assert.match(
    emptyDesktopFixture,
    /empty desktop quick-block must keep the hover entrypoint for first-rule creation/
  );
  assert.match(
    emptyDesktopFixture,
    /empty desktop quick-block must keep SPA refresh hooks without body scans/
  );
  assert.match(emptyDesktopFixture, /desktop startup must not observe document\.body/);
});

test('quick-block button guards and fallback DOM rerun fanout stay source-derived', () => {
  const ensure = blockMetric(blockSpecs.quickBlockEnsureButton).block;
  const wrap = blockMetric(blockSpecs.quickBlockWrapHoverEvents).block;
  const action = blockMetric(blockSpecs.quickBlockActionFallback).block;

  assert.match(ensure, /const resolvedHostCard = resolveQuickBlockHost\(card\)/);
  assert.match(ensure, /const hostCard = resolveOutermostShortsQuickBlockHost\(resolvedHostCard\)/);
  assert.match(ensure, /const parentCard = hostCard\.parentElement\?\.closest\?\.\(QUICK_BLOCK_CARD_SELECTORS\)/);
  assert.match(ensure, /if \(parentCard && parentCard !== hostCard\) return/);
  assert.match(ensure, /data-filtertube-quick-events/);
  assert.match(ensure, /data-filtertube-quick-anchor-events/);
  assert.match(wrap, /data-filtertube-quick-wrap-events/);
  assert.match(ensure, /trigger\.addEventListener\('click'/);
  assert.match(ensure, /requestAnimationFrame\(\(\) =>/);
  assert.match(action, /data-busy/);
  assert.match(action, /handleBlockChannelClick/);
  assert.match(action, /runQuickBlockFallback/);
  assert.match(action, /applyQuickBlockImmediateHide/);
  assert.match(action, /setTimeout\(\(\) => applyDOMFallback\(null, \{ preserveScroll: true \}\), 120\)/);

  const runtime = loadQuickBlockShortsHostRuntime();
  const outerHomeCard = new QuickBlockDomNode('ytd-rich-item-renderer');
  const innerShortsHost = outerHomeCard.appendChild(new QuickBlockDomNode('div', {
    classNames: ['shortsLockupViewModelHost']
  }));
  const shortsAnchor = innerShortsHost.appendChild(new QuickBlockDomNode('a', {
    attrs: { href: '/shorts/SHORTS12345' }
  }));

  const initialHit = runtime.findQuickBlockCardFromTarget(shortsAnchor);
  const resolvedHost = runtime.resolveQuickBlockHost(initialHit);
  const outermostHost = runtime.resolveOutermostShortsQuickBlockHost(resolvedHost);

  assert.equal(initialHit, innerShortsHost);
  assert.equal(resolvedHost, outerHomeCard);
  assert.equal(outermostHost, outerHomeCard);
  assert.equal(outermostHost.parentElement?.closest?.(runtime.QUICK_BLOCK_CARD_SELECTORS) || null, null);
});

test('quick-block lifecycle future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  for (const token of zeroPolicyCounts) {
    assert.equal(countLiteral(runtime, token), 0, `${token} unexpectedly exists in runtime`);
    assert.match(text, new RegExp(`\\\`${escapeRegExp(token)}\\\``));
  }

  for (const token of missingRuntimeSymbols) {
    assert.equal(countLiteral(runtime, token), 0, `${token} unexpectedly exists in runtime`);
  }

  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /first-class quick-block lifecycle authority gates/);
});
