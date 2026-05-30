import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DOM_FALLBACK_RUN_STATE_VISIBILITY_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content/dom_helpers.js': [206, 8292, 'a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242'],
  'js/content/dom_fallback.js': [4838, 228332, '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef']
};

const blockSpecs = {
  domHelpersToggleVisibility: {
    file: 'js/content/dom_helpers.js',
    start: "function toggleVisibility(element, shouldHide, reason = '', skipStats = false) {",
    end: '/**\n * Recursively checks',
    startLine: 67,
    lines: 84,
    bytes: 3286,
    hash: '23e68a0a3522deb7dc786dbcf836723a5a1c63681e82888b14b4c2125015e623'
  },
  domHelpersContainerVisibility: {
    file: 'js/content/dom_helpers.js',
    start: 'function updateContainerVisibility(container, childSelector) {',
    end: null,
    startLine: 154,
    lines: 53,
    bytes: 2177,
    hash: 'd3018c075d23c41add85406382b4f6dc2327cb031c96935db0fdecfe5edcf91d'
  },
  domFallbackExplicitHidden: {
    file: 'js/content/dom_fallback.js',
    start: 'function clearBlockedElementAttributes(element) {',
    end: 'function hasExplicitHideReasonMarker',
    startLine: 991,
    lines: 58,
    bytes: 2864,
    hash: '341302faf4f61e9fbabe2df16b59992a8bf41dadf2cb4b0017133599812be604'
  },
  domFallbackHasActiveWork: {
    file: 'js/content/dom_fallback.js',
    start: 'function hasActiveDOMFallbackWork(settings) {',
    end: 'function clearStaleDOMFallbackVisibility',
    startLine: 1933,
    lines: 68,
    bytes: 2333,
    hash: '394f7a99044dcf8da10d631b5b7ec216235c427228f78d53583ebb07cbb0d583'
  },
  domFallbackStaleVisibilityCleanup: {
    file: 'js/content/dom_fallback.js',
    start: 'function clearStaleDOMFallbackVisibility() {',
    end: '// DOM fallback function that processes already-rendered content',
    startLine: 2001,
    lines: 33,
    bytes: 1412,
    hash: 'c43b2bb0bdcaa495f1c077b5c164d5666d2ed74ff334afb5ddd41dd217fe8412'
  },
  domFallbackApplyRunHead: {
    file: 'js/content/dom_fallback.js',
    start: 'async function applyDOMFallback(settings, options = {}) {',
    end: '    const scrollState = window.__filtertubeScrollState',
    startLine: 2035,
    lines: 63,
    bytes: 2188,
    hash: 'c8f88f62bbd72cd9ed3c70476948919cdcb4aa7a125e26c1d684d3267dd8ee43'
  },
  domFallbackApplyScrollAndWatchCleanup: {
    file: 'js/content/dom_fallback.js',
    start: '    const scrollState = window.__filtertubeScrollState',
    end: '    // Robust DOM-based passes',
    startLine: 2098,
    lines: 71,
    bytes: 3055,
    hash: 'ef270a74e07e72c6767c65446da33adee02bb6541d02044fd4cafd6edfd5d707'
  },
  domFallbackDisabledCleanup: {
    file: 'js/content/dom_fallback.js',
    start: '    if (effectiveSettings.enabled === false) {',
    end: '    // 1. Video/Content Filtering',
    startLine: 2304,
    lines: 21,
    bytes: 959,
    hash: '74a2a03bddccb449441616a374260b720067023533b9077e26bbc0aa6cc926b3'
  },
  domFallbackApplyScrollRestore: {
    file: 'js/content/dom_fallback.js',
    start: '    if (allowPreserveScroll && scrollingElement) {',
    end: '    // Log hide/restore summary',
    startLine: 4427,
    lines: 22,
    bytes: 893,
    hash: '62ffc9b810d4515e5db8da3ccd9e98c6c4cbbae2b90fd8778ce647d816fb5508'
  },
  domFallbackApplyFinally: {
    file: 'js/content/dom_fallback.js',
    start: '    } finally {',
    end: '}\n\n// Helper function to check if content should be hidden',
    startLine: 4522,
    lines: 11,
    bytes: 342,
    hash: '068457333a32e3b43aa59be0d1172964832201c6a6602121440e95ba3ebbf37e'
  }
};

const selectedCounts = {
  'filtertube-hidden': 55,
  'filtertube-hidden-shelf': 11,
  'data-filtertube-hidden': 28,
  'data-filtertube-whitelist-pending': 8,
  'data-filtertube-pending-category': 6,
  'data-filtertube-pending-upload-date': 6,
  'toggleVisibility(': 7,
  skipStats: 8,
  handleMediaPlayback: 2,
  'getFilteringTracker().reset': 1,
  hasActiveDOMFallbackWork: 2,
  "listMode === 'whitelist'": 4,
  'settings.enabled === false': 1,
  'settings.filterKeywords': 2,
  'settings.filterChannels': 1,
  'settings.filterKeywordsComments': 1,
  booleanFilterKeys: 2,
  'contentFilters?.duration?.enabled': 1,
  'categoryFilters?.enabled': 1,
  clearStaleDOMFallbackVisibility: 2,
  'window.__filtertubeDomFallbackRunState': 2,
  'runState.running': 3,
  'runState.pending': 3,
  'runState.latestSettings': 2,
  'runState.latestOptions': 2,
  'setTimeout(resolve, 0)': 1,
  'setTimeout(() => applyDOMFallback': 1,
  'window.__filtertubeDomFallbackActiveRun': 2,
  'window.__filtertubeDomFallbackPerfState': 4,
  'window.__filtertubeScrollState': 2,
  'scrollState.listenerAttached': 2,
  "addEventListener('scroll'": 1,
  allowPreserveScroll: 2,
  didScrollDuringRun: 2,
  isUserScrollingNow: 2,
  scrollTo: 5,
  "document.location?.pathname || ''": 1,
  "path === '/feed/channels'": 1,
  ensureContentControlStyles: 1,
  "contentControlStyle.textContent = ''": 2,
  'delete window.__filtertubeDomFallbackActiveRun': 1
};

const zeroPolicyCounts = [
  'domFallbackRunStateVisibilityCleanupContract',
  'domFallbackRunStateReport',
  'domFallbackStaleVisibilityCleanupPolicy',
  'domFallbackScrollRestoreBudget',
  'domFallbackPendingRerunBudget',
  'domFallbackActiveWorkDecisionReport',
  'domFallbackVisibilityOwnershipReport',
  'domFallbackCleanupFixtureProvenance'
];

const missingRuntimeSymbols = [
  'domFallbackRunStateVisibilityCleanupContract',
  'domFallbackRunStateReport',
  'domFallbackStaleVisibilityCleanupPolicy',
  'domFallbackScrollRestoreBudget',
  'domFallbackPendingRerunBudget',
  'domFallbackActiveWorkDecisionReport',
  'domFallbackVisibilityOwnershipReport',
  'domFallbackCleanupFixtureProvenance',
  'domFallbackSelectorBudgetReport',
  'domFallbackMetricArtifact'
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

  removeProperty(name) {
    const previous = this.values.get(name);
    this.values.delete(name);
    if (name === 'display') this.display = '';
    return previous?.value || '';
  }
}

class FakeElement {
  constructor({ classes = [], attrs = {}, children = [], liveVideoId = '' } = {}) {
    this.classList = new FakeClassList(classes);
    this.attrs = new Map(Object.entries(attrs));
    this.children = children;
    this.liveVideoId = liveVideoId;
    this.style = new FakeStyle();
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

  querySelectorAll() {
    return this.children;
  }

  closest(selector) {
    if (selector === '.filtertube-hidden' && this.classList.contains('filtertube-hidden')) return this;
    if (selector === '.filtertube-hidden-shelf' && this.classList.contains('filtertube-hidden-shelf')) return this;
    return null;
  }
}

function evaluateBlock(specName, globals = {}) {
  const context = {
    console: { warn() {}, error() {}, log() {} },
    ...globals
  };
  context.globalThis = context;
  if (!context.window) context.window = context;
  vm.createContext(context);
  vm.runInContext(blockMetric(blockSpecs[specName]).block, context, { filename: `${specName}.vm.js` });
  return context;
}

test('DOM fallback run-state visibility cleanup doc is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior boundary/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch/);
  assert.match(text, /DOM fallback run-state visibility cleanup source files pinned: 2/);
  assert.match(text, /DOM fallback run-state visibility cleanup source\/effect blocks pinned: 10/);
  assert.match(text, /finding concrete optimization locations and the blockers to making JSON a first-class filter path/);

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

test('DOM fallback run-state visibility cleanup source/effect blocks remain pinned', () => {
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

test('DOM fallback run-state visibility selected token counts remain current', () => {
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

test('DOM fallback helper visibility toggles still hide and restore current markers', () => {
  const calls = { hide: 0, restore: 0, inc: 0, dec: 0, media: [] };
  const context = evaluateBlock('domHelpersToggleVisibility', {
    filteringTracker: {
      recordHide() { calls.hide += 1; },
      recordRestore() { calls.restore += 1; }
    },
    incrementHiddenStats() { calls.inc += 1; },
    decrementHiddenStats() { calls.dec += 1; },
    extractVideoDuration() { return '1:23'; },
    handleMediaPlayback(element, hidden) { calls.media.push([element, hidden]); }
  });

  const element = new FakeElement();
  context.toggleVisibility(element, true, 'fixture hide', false);
  assert.equal(element.classList.contains('filtertube-hidden'), true);
  assert.equal(element.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(element.style.display, 'none');
  assert.equal(calls.hide, 1);
  assert.equal(calls.inc, 1);

  context.toggleVisibility(element, false, '', false);
  assert.equal(element.classList.contains('filtertube-hidden'), false);
  assert.equal(element.hasAttribute('data-filtertube-hidden'), false);
  assert.equal(element.style.display, '');
  assert.equal(calls.restore, 1);
  assert.equal(calls.dec, 1);
  assert.deepEqual(calls.media.map(([, hidden]) => hidden), [true, false]);
});

test('DOM fallback recycled hidden row detection remains current behavior', () => {
  const context = evaluateBlock('domFallbackExplicitHidden', {
    extractVideoIdFromCard(element) {
      return element.liveVideoId || '';
    }
  });

  const recycled = new FakeElement({
    classes: ['filtertube-hidden'],
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-last-processed-id': 'old-video-id',
      'data-filtertube-processed': 'true'
    },
    liveVideoId: 'new-video-id'
  });
  recycled.style.setProperty('display', 'none', 'important');

  assert.equal(context.isExplicitlyHiddenByFilterTube(recycled), false);
  assert.equal(recycled.classList.contains('filtertube-hidden'), false);
  assert.equal(recycled.hasAttribute('data-filtertube-hidden'), false);
  assert.equal(recycled.style.display, '');

  const stillCurrent = new FakeElement({
    classes: ['filtertube-hidden'],
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-last-processed-id': 'same-video-id',
      'data-filtertube-processed': 'true'
    },
    liveVideoId: 'same-video-id'
  });
  assert.equal(context.isExplicitlyHiddenByFilterTube(stillCurrent), true);

  const explicitReason = new FakeElement({
    classes: ['filtertube-hidden'],
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-hidden-by-channel': 'true',
      'data-filtertube-last-processed-id': 'old-video-id',
      'data-filtertube-processed': 'true'
    },
    liveVideoId: 'new-video-id'
  });
  assert.equal(context.isExplicitlyHiddenByFilterTube(explicitReason), true);
});

test('DOM fallback active-work decision fixtures remain current', () => {
  const context = evaluateBlock('domFallbackHasActiveWork');
  const hasWork = context.hasActiveDOMFallbackWork;

  assert.equal(hasWork(null), false);
  assert.equal(hasWork({ enabled: false, listMode: 'whitelist' }), false);
  assert.equal(hasWork({ enabled: true, listMode: 'blocklist' }), false);
  assert.equal(hasWork({ enabled: true, listMode: 'whitelist' }), true);
  assert.equal(hasWork({ enabled: true, filterKeywords: ['title'] }), true);
  assert.equal(hasWork({ enabled: true, filterChannels: ['channel'] }), true);
  assert.equal(hasWork({ enabled: true, filterKeywordsComments: ['comment'] }), true);
  assert.equal(hasWork({ enabled: true, hideAllShorts: true }), true);
  assert.equal(hasWork({ enabled: true, contentFilters: { duration: { enabled: true } } }), true);
  assert.equal(hasWork({ enabled: true, categoryFilters: { enabled: true } }), false);
  assert.equal(hasWork({ enabled: true, categoryFilters: { enabled: true, selected: ['music'] } }), true);
});

test('DOM fallback stale visibility cleanup restores selected hidden and pending markers', () => {
  const cleaned = new FakeElement({
    classes: ['filtertube-hidden', 'filtertube-hidden-shelf'],
    attrs: {
      'data-filtertube-hidden': 'true',
      'data-filtertube-whitelist-pending': 'true',
      'data-filtertube-pending-category': 'true',
      'data-filtertube-pending-upload-date': 'true',
      'data-filtertube-pending-category-ts': '123',
      'data-filtertube-pending-upload-date-ts': '456',
      'data-filtertube-hidden-by-hide-all-shorts': 'true',
      'data-filtertube-ignore-empty-hide': 'true'
    }
  });
  const contentStyle = { textContent: 'previous-css' };
  const toggles = [];
  const documentMock = {
    lastSelector: '',
    querySelectorAll(selector) {
      this.lastSelector = selector;
      return [cleaned];
    },
    getElementById(id) {
      return id === 'filtertube-content-controls-style' ? contentStyle : null;
    }
  };

  const context = evaluateBlock('domFallbackStaleVisibilityCleanup', {
    document: documentMock,
    toggleVisibility(element, shouldHide, reason, skipStats) {
      toggles.push({ element, shouldHide, reason, skipStats });
      element.classList.remove('filtertube-hidden');
      element.classList.remove('filtertube-hidden-shelf');
      element.removeAttribute('data-filtertube-hidden');
    }
  });

  context.clearStaleDOMFallbackVisibility();

  assert.match(documentMock.lastSelector, /\[data-filtertube-hidden\]/);
  assert.match(documentMock.lastSelector, /\.filtertube-hidden-shelf/);
  assert.match(documentMock.lastSelector, /\[data-filtertube-whitelist-pending="true"\]/);
  assert.match(documentMock.lastSelector, /\[data-filtertube-pending-category\]/);
  assert.match(documentMock.lastSelector, /\[data-filtertube-pending-upload-date\]/);
  assert.equal(toggles.length, 1);
  assert.deepEqual(toggles[0], { element: cleaned, shouldHide: false, reason: '', skipStats: true });
  for (const attr of [
    'data-filtertube-hidden',
    'data-filtertube-whitelist-pending',
    'data-filtertube-pending-category',
    'data-filtertube-pending-upload-date',
    'data-filtertube-pending-category-ts',
    'data-filtertube-pending-upload-date-ts',
    'data-filtertube-hidden-by-hide-all-shorts',
    'data-filtertube-ignore-empty-hide'
  ]) {
    assert.equal(cleaned.hasAttribute(attr), false, `${attr} should be removed`);
  }
  assert.equal(contentStyle.textContent, '');
});

test('DOM fallback run-state and scroll cleanup remain source-derived', () => {
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));
  const text = doc();

  assert.match(blocks.domHelpersContainerVisibility, /data-filtertube-ignore-empty-hide/);
  assert.match(blocks.domHelpersContainerVisibility, /data-filtertube-container-had-children/);
  assert.match(blocks.domHelpersContainerVisibility, /container\.classList\.add\('filtertube-hidden-shelf'\)/);
  assert.match(blocks.domFallbackHasActiveWork, /if \(settings\.enabled === false\) return false/);
  assert.match(blocks.domFallbackHasActiveWork, /if \(listMode === 'whitelist'\) return true/);
  assert.match(blocks.domFallbackHasActiveWork, /hideWatchPlaylistPanel/);
  assert.match(blocks.domFallbackHasActiveWork, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(blocks.domFallbackApplyRunHead, /window\.__filtertubeDomFallbackRunState/);
  assert.match(blocks.domFallbackApplyRunHead, /runState\.latestSettings = effectiveSettings/);
  assert.match(blocks.domFallbackApplyRunHead, /if \(runState\.running\)/);
  assert.match(blocks.domFallbackApplyRunHead, /runState\.pending = true/);
  assert.match(blocks.domFallbackApplyRunHead, /clearStaleDOMFallbackVisibility\(\)/);
  assert.match(blocks.domFallbackApplyScrollAndWatchCleanup, /window\.__filtertubeScrollState/);
  assert.match(blocks.domFallbackApplyScrollAndWatchCleanup, /window\.addEventListener\('scroll'/);
  assert.match(blocks.domFallbackApplyScrollAndWatchCleanup, /now - \(scrollState\.lastScrollTs \|\| 0\) < 150/);
  assert.match(blocks.domFallbackApplyScrollAndWatchCleanup, /path === '\/feed\/channels'/);
  assert.match(blocks.domFallbackApplyScrollAndWatchCleanup, /watchMeta\.querySelectorAll/);
  assert.match(blocks.domFallbackDisabledCleanup, /effectiveSettings\.enabled === false/);
  assert.match(blocks.domFallbackDisabledCleanup, /contentControlStyle\.textContent = ''/);
  assert.match(blocks.domFallbackDisabledCleanup, /return/);
  assert.match(blocks.domFallbackApplyScrollRestore, /didScrollDuringRun/);
  assert.match(blocks.domFallbackApplyScrollRestore, /isUserScrollingNow/);
  assert.match(blocks.domFallbackApplyScrollRestore, /scrollingElement\.scrollTo/);
  assert.match(blocks.domFallbackApplyFinally, /delete window\.__filtertubeDomFallbackActiveRun/);
  assert.match(blocks.domFallbackApplyFinally, /runState\.running = false/);
  assert.match(blocks.domFallbackApplyFinally, /setTimeout\(\(\) => applyDOMFallback\(runState\.latestSettings, runState\.latestOptions\), 0\)/);
  assert.match(text, /DOM fallback run-state visibility cleanup still needs/);
});

test('DOM fallback run-state visibility cleanup future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  assert.match(text, /a run-state and pending-rerun contract/);
  assert.match(text, /stale visibility cleanup policy by marker family/);
  assert.match(text, /scroll restoration budget and user-scroll policy/);
  assert.match(text, /visibility ownership reports across DOM fallback, content bridge, quick-block, and playlist\/comment writers/);
  assert.match(text, /selector budget reports for disabled, empty blocklist, empty whitelist, and JSON-first no-work cases/);

  for (const symbol of missingRuntimeSymbols) {
    assert.match(text, new RegExp(escapeRegExp(symbol)));
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
  }

  assert.match(
    text,
    /No `domFallbackRunStateVisibilityCleanupContract`, `domFallbackRunStateReport`, `domFallbackStaleVisibilityCleanupPolicy`, `domFallbackScrollRestoreBudget`, `domFallbackPendingRerunBudget`, `domFallbackActiveWorkDecisionReport`, `domFallbackVisibilityOwnershipReport`, `domFallbackCleanupFixtureProvenance`, `domFallbackSelectorBudgetReport`, or `domFallbackMetricArtifact` exists/
  );
});
