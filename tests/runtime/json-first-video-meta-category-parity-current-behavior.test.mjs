import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
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

function countLiteral(source, literal) {
  return source.split(literal).length - 1;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function getByPath(obj, dottedPath) {
  return String(dottedPath || '').split('.').reduce((current, part) => {
    if (current === null || current === undefined) return undefined;
    if (/^\d+$/.test(part)) return current[Number(part)];
    return current[part];
  }, obj);
}

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.writes = [];
    this.removes = [];
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    this.writes.push([name, String(value)]);
  }

  removeAttribute(name) {
    this.attrs.delete(name);
    this.removes.push(name);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }
}

function loadJsonCategoryRuntime(settings) {
  const source = read('js/filter_logic.js');
  const methodBlock = sliceBetween(
    source,
    '        _checkCategoryFilters(item, rules, rendererType) {',
    '\n\n        /**\n         * Extract title'
  );
  const fetches = [];
  const context = {
    getByPath,
    scheduleVideoMetaFetch(videoId, options) {
      fetches.push({ videoId, options });
    },
    Array,
    Boolean,
    Object,
    RegExp,
    Set,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      'class Harness {',
      '  constructor(settings) { this.settings = settings; }',
      methodBlock,
      '}',
      'globalThis.__Harness = Harness;'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'filter_logic.js') }
  );
  return {
    instance: new context.__Harness(settings),
    fetches
  };
}

function loadDomCategoryRuntime({ settings, pathname = '/' }) {
  const source = read('js/content/dom_fallback.js');
  const categoryBlock = sliceBetween(
    source,
    '            let hideByCategory = false;',
    '\n            const alreadyProcessed = element.hasAttribute'
  );
  const fetches = [];
  const context = {
    document: { location: { pathname } },
    ensureVideoIdForCard(element) {
      return element.getAttribute('data-filtertube-video-id') || '';
    },
    scheduleVideoMetaFetch(videoId, options) {
      fetches.push({ videoId, options });
    },
    Array,
    Boolean,
    Object,
    Set,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      'function runDomCategory(element, effectiveSettings) {',
      categoryBlock,
      '  return { hideByCategory, pendingCategoryMeta };',
      '}',
      'globalThis.__runDomCategory = runDomCategory;'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') }
  );
  return {
    run(element = new FakeElement({ 'data-filtertube-video-id': 'abcABC12345' })) {
      return plain(context.__runDomCategory(element, settings));
    },
    fetches
  };
}

function loadPendingMarkerRuntime({ nowMs = 1700000000000 } = {}) {
  const source = read('js/content/dom_fallback.js');
  const pendingBlock = sliceBetween(
    source,
    '            const pendingMetaTtlMs = 8000;',
    '\n\n            if (isKidsHost && listMode ==='
  );
  const timers = [];
  let nextTimerId = 1;
  const context = {
    Date: { now: () => nowMs },
    window: {},
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay });
      return id;
    },
    applyDOMFallback() {},
    parseInt,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      'function runPending(targetToHide, state) {',
      "  let pendingCategoryMeta = state.pendingCategoryMeta === true;",
      "  let pendingUploadDateMeta = state.pendingUploadDateMeta === true;",
      "  let shouldHide = state.shouldHide === true;",
      "  let hideReason = state.hideReason || 'Content';",
      pendingBlock,
      '  return { pendingCategoryMeta, pendingUploadDateMeta, pendingMetaOnly, hideReason };',
      '}',
      'globalThis.__runPending = runPending;'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') }
  );
  return {
    run(target, state) {
      return context.__runPending(target, state);
    },
    timers
  };
}

function runCategoryMarkerBlock(target, { hideByCategory, shouldHide }) {
  const source = read('js/content/dom_fallback.js');
  const markerBlock = sliceBetween(
    source,
    '            try {\n                if (hideByCategory && shouldHide) {',
    '\n\n            toggleVisibility(targetToHide'
  );
  const context = {
    targetToHide: target,
    hideByCategory,
    shouldHide
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(markerBlock, context, { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') });
}

test('JSON-first video meta category parity audit is audit-only and source pinned', () => {
  const text = doc();
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, category-filter patch/);
  assert.equal(lineCount(filterLogic), 3498);
  assert.equal(Buffer.byteLength(filterLogic), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
  assert.equal(lineCount(domFallback), 4838);
  assert.equal(Buffer.byteLength(domFallback), 228332);
  assert.equal(sha256('js/content/dom_fallback.js'), '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef');
  assert.equal(lineCount(contentBridge), 13571);
  assert.equal(Buffer.byteLength(contentBridge), 601694);
  assert.equal(sha256('js/content_bridge.js'), '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3');
  assert.match(text, /video-meta category parity source files: 3/);
});

test('video meta category parity source counts remain pinned', () => {
  const text = doc();
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const contentBridge = read('js/content_bridge.js');
  const slices = {
    filterCategory: sliceBetween(filterLogic, '        _checkCategoryFilters(item, rules, rendererType) {', '\n\n        /**\n         * Extract title'),
    filterCall: sliceBetween(filterLogic, '            // Content filters (duration, upload date) - applied after channel/keyword filtering', '\n\n            return false;'),
    domCategory: sliceBetween(domFallback, '            let hideByCategory = false;', '\n            const alreadyProcessed = element.hasAttribute'),
    domPending: sliceBetween(domFallback, '            const pendingMetaTtlMs = 8000;', '\n\n            if (isKidsHost && listMode ==='),
    domMarker: sliceBetween(domFallback, '            try {\n                if (hideByCategory && shouldHide) {', '\n\n            toggleVisibility(targetToHide'),
    scheduleFetch: sliceBetween(contentBridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nasync function fetchVideoMetaFromWatchUrl')
  };
  const rendererBlock = sliceBetween(slices.filterCategory, 'const isVideoRenderer = [', '].includes(rendererType);');

  assert.equal(lineCount(slices.filterCategory), 57);
  assert.equal(Buffer.byteLength(slices.filterCategory), 2683);
  assert.equal(countLiteral(slices.filterCategory, 'videoMetaMap'), 3);
  assert.equal(countLiteral(slices.filterCategory, 'scheduleVideoMetaFetch'), 2);
  assert.equal(countLiteral(slices.filterCategory, 'category'), 9);
  assert.equal((rendererBlock.match(/'[^']+'/g) || []).length, 19);
  assert.equal(lineCount(slices.filterCall), 12);
  assert.equal(lineCount(slices.domCategory), 39);
  assert.equal(Buffer.byteLength(slices.domCategory), 2136);
  assert.equal(countLiteral(slices.domCategory, 'videoMetaMap'), 3);
  assert.equal(countLiteral(slices.domCategory, 'scheduleVideoMetaFetch'), 2);
  assert.equal(countLiteral(slices.domCategory, 'category'), 10);
  assert.equal(countLiteral(slices.domCategory, 'pendingCategory'), 2);
  assert.equal(lineCount(slices.domPending), 75);
  assert.equal(Buffer.byteLength(slices.domPending), 4103);
  assert.equal(countLiteral(slices.domPending, 'setTimeout('), 2);
  assert.equal(countLiteral(slices.domPending, 'data-filtertube-pending-category'), 6);
  assert.equal(lineCount(slices.domMarker), 8);
  assert.equal(Buffer.byteLength(slices.domMarker), 333);
  assert.equal(countLiteral(slices.domMarker, 'data-filtertube-hidden-by-category'), 2);
  assert.equal(lineCount(slices.scheduleFetch), 94);
  assert.equal(Buffer.byteLength(slices.scheduleFetch), 3689);
  assert.equal(countLiteral(slices.scheduleFetch, 'category'), 4);

  assert.match(text, /filter_logic category method block lines: 57/);
  assert.match(text, /filter_logic category renderer allowlist entries: 19/);
  assert.match(text, /DOM fallback pending metadata block lines: 75/);
  assert.match(text, /content_bridge scheduleVideoMetaFetch function lines: 94/);
});

test('JSON engine category decision hides only when category metadata is present and matched by mode', () => {
  const videoId = 'abcABC12345';
  const rules = { videoId: 'videoId' };
  const item = { videoId };

  let runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' },
    videoMetaMap: { [videoId]: { category: ' Music ' } }
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'videoRenderer'), true);
  assert.deepEqual(runtime.fetches, []);

  runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' },
    videoMetaMap: { [videoId]: { category: 'Education' } }
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'videoRenderer'), false);

  runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'allow' },
    videoMetaMap: { [videoId]: { category: 'Music' } }
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'videoRenderer'), false);

  runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'allow' },
    videoMetaMap: { [videoId]: { category: 'Education' } }
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'videoRenderer'), true);

  runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'allow' },
    videoMetaMap: {}
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'videoRenderer'), false);
  assert.deepEqual(plain(runtime.fetches), [
    { videoId, options: { needDuration: false, needDates: false, needCategory: true } }
  ]);

  runtime = loadJsonCategoryRuntime({
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' },
    videoMetaMap: { [videoId]: { category: 'Music' } }
  });
  assert.equal(runtime.instance._checkCategoryFilters(item, rules, 'commentThreadRenderer'), false);
  assert.deepEqual(runtime.fetches, []);
});

test('DOM fallback category decision adds pending metadata state beyond the JSON engine decision', () => {
  const videoId = 'abcABC12345';
  const base = {
    categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' },
    videoMetaMap: { [videoId]: { category: 'Music' } }
  };

  let runtime = loadDomCategoryRuntime({ settings: base, pathname: '/' });
  assert.deepEqual(runtime.run(), { hideByCategory: true, pendingCategoryMeta: false });
  assert.deepEqual(runtime.fetches, []);

  runtime = loadDomCategoryRuntime({
    settings: { categoryFilters: { enabled: true, selected: ['Music'], mode: 'allow' }, videoMetaMap: { [videoId]: { category: 'Education' } } },
    pathname: '/watch'
  });
  assert.deepEqual(runtime.run(), { hideByCategory: true, pendingCategoryMeta: false });

  runtime = loadDomCategoryRuntime({
    settings: { categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' }, videoMetaMap: {} },
    pathname: '/'
  });
  assert.deepEqual(runtime.run(), { hideByCategory: false, pendingCategoryMeta: true });
  assert.deepEqual(plain(runtime.fetches), [
    { videoId, options: { needDuration: false, needDates: false, needCategory: true } }
  ]);

  runtime = loadDomCategoryRuntime({
    settings: { categoryFilters: { enabled: true, selected: ['Music'], mode: 'block' }, videoMetaMap: {} },
    pathname: '/watch'
  });
  assert.deepEqual(runtime.run(), { hideByCategory: false, pendingCategoryMeta: false });
  assert.equal(runtime.fetches.length, 1);

  runtime = loadDomCategoryRuntime({
    settings: { categoryFilters: { enabled: true, selected: ['Music'], mode: 'allow' }, videoMetaMap: {} },
    pathname: '/watch'
  });
  assert.deepEqual(runtime.run(), { hideByCategory: false, pendingCategoryMeta: true });
  assert.equal(runtime.fetches.length, 1);
});

test('DOM pending category marker writes timestamp and schedules one delayed recheck while pending-only', () => {
  const target = new FakeElement();
  const runtime = loadPendingMarkerRuntime({ nowMs: 1700000000000 });
  const result = runtime.run(target, { pendingCategoryMeta: true, shouldHide: false });

  assert.equal(result.pendingMetaOnly, true);
  assert.equal(result.hideReason, 'Pending category metadata');
  assert.equal(target.getAttribute('data-filtertube-pending-category'), 'true');
  assert.equal(target.getAttribute('data-filtertube-pending-category-ts'), '1700000000000');
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 8120);

  const second = runtime.run(target, { pendingCategoryMeta: true, shouldHide: false });
  assert.equal(second.pendingMetaOnly, true);
  assert.equal(runtime.timers.length, 1);

  const staleTarget = new FakeElement({
    'data-filtertube-pending-category': 'true',
    'data-filtertube-pending-category-ts': '1699999991000'
  });
  const stale = runtime.run(staleTarget, { pendingCategoryMeta: true, shouldHide: false });
  assert.equal(stale.pendingCategoryMeta, false);
  assert.equal(stale.pendingMetaOnly, false);
  assert.equal(staleTarget.getAttribute('data-filtertube-pending-category'), null);
});

test('DOM category hidden marker is written only when category decision and final hide both hold', () => {
  const target = new FakeElement();
  runCategoryMarkerBlock(target, { hideByCategory: true, shouldHide: true });
  assert.equal(target.getAttribute('data-filtertube-hidden-by-category'), 'true');

  runCategoryMarkerBlock(target, { hideByCategory: true, shouldHide: false });
  assert.equal(target.getAttribute('data-filtertube-hidden-by-category'), null);
  assert.deepEqual(target.removes.includes('data-filtertube-hidden-by-category'), true);
});

test('product runtime still lacks first-class video-meta category parity authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const missingSymbols = [
    'jsonFirstVideoMetaCategoryParityContract',
    'jsonFirstVideoMetaJsonDomCategoryDecisionReport',
    'jsonFirstVideoMetaCategoryPendingPolicy',
    'jsonFirstVideoMetaCategoryMarkerReport',
    'jsonFirstVideoMetaCategoryFetchPolicy',
    'jsonFirstVideoMetaCategoryNoWorkBudget',
    'jsonFirstVideoMetaCategoryFixtureProvenance',
    'jsonFirstVideoMetaCategoryMetricArtifact',
    'jsonFirstVideoMetaCategoryAllowBlockParity',
    'jsonFirstVideoMetaCategoryRevisionPolicy'
  ];

  for (const symbol of missingSymbols) {
    assert.match(text, new RegExp(symbol));
    assert.equal(runtime.includes(symbol), false, `${symbol} should not exist in product runtime yet`);
  }
});
