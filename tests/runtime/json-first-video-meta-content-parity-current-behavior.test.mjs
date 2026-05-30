import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function videoRenderer(videoId = 'CONTENT0001', overrides = {}) {
  return {
    videoId,
    title: { runs: [{ text: 'Calm metadata video' }] },
    shortBylineText: { runs: [{ text: 'Calm Channel' }] },
    ...overrides
  };
}

function runEngine(input, settings) {
  const { engine } = loadFilterTubeEngine();
  return plain(engine.processData(input, settings, 'json-first-video-meta-content-parity'));
}

class FakeElement {
  constructor(attrs = {}, options = {}) {
    this.attrs = new Map();
    this.writes = [];
    this.removes = [];
    this.metadataText = options.metadataText || '';
    this.href = options.href || '';
    this.mixBadgeText = options.mixBadgeText || '';
    for (const [key, value] of Object.entries(attrs)) {
      this.attrs.set(key, String(value));
    }
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

  querySelector(selector) {
    if ([
      '#metadata-line',
      '.ytd-video-meta-block',
      '.yt-lockup-metadata-view-model__metadata',
      '.yt-content-metadata-view-model__metadata-row',
      '#video-info'
    ].includes(selector)) {
      return this.metadataText ? { textContent: this.metadataText } : null;
    }
    if (selector === 'a[href]') {
      return this.href ? { getAttribute: () => this.href } : null;
    }
    if (selector === 'a[href*="start_radio=1"]') {
      return this.href.includes('start_radio=1') ? { getAttribute: () => this.href } : null;
    }
    if (selector === '.yt-badge-shape__text') {
      return this.mixBadgeText ? { textContent: this.mixBadgeText } : null;
    }
    return null;
  }
}

function loadDomUploadDateRuntime({
  settings,
  pathname = '/',
  search = '',
  nowMs = 1700000000000,
  isPlaylistRow = false,
  isSelectedRow = false
}) {
  const source = read('js/content/dom_fallback.js');
  const uploadBlock = sliceBetween(
    source,
    '            let hideByUploadDate = false;',
    "\n            try {\n                const path = document.location?.pathname ||"
  );
  const fetches = [];
  const context = {
    document: { location: { pathname, search } },
    Date: class extends Date {
      static now() { return nowMs; }
    },
    ensureVideoIdForCard(element) {
      return element.getAttribute('data-filtertube-video-id') || '';
    },
    scheduleVideoMetaFetch(videoId, options) {
      fetches.push({ videoId, options });
    },
    isPlaylistPanelRowElement() {
      return isPlaylistRow;
    },
    isSelectedPlaylistPanelRow() {
      return isSelectedRow;
    },
    URLSearchParams,
    Array,
    Boolean,
    Number,
    Object,
    RegExp,
    String,
    parseInt,
    isNaN
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      'function runDomUploadDate(element, effectiveSettings) {',
      uploadBlock,
      '  return { hideByUploadDate, pendingUploadDateMeta };',
      '}',
      'globalThis.__runDomUploadDate = runDomUploadDate;'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') }
  );
  return {
    run(element = new FakeElement({ 'data-filtertube-video-id': 'CONTENT0002' })) {
      return plain(context.__runDomUploadDate(element, settings));
    },
    fetches
  };
}

function loadDomDurationRuntime({
  settings,
  hostname = 'www.youtube.com',
  elementTag = 'ytd-video-renderer',
  extractedDuration = null
}) {
  const source = read('js/content/dom_fallback.js');
  const durationBlock = sliceBetween(
    source,
    '            let hideByDuration = false;',
    '\n\n            const skipKeywordFiltering'
  );
  const fetches = [];
  const context = {
    location: { hostname },
    extractVideoDuration() {
      return extractedDuration;
    },
    ensureVideoIdForCard(element) {
      return element.getAttribute('data-filtertube-video-id') || '';
    },
    scheduleVideoMetaFetch(videoId, options) {
      fetches.push({ videoId, options });
    },
    Number,
    String,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      'function runDomDuration(element, effectiveSettings, elementTag) {',
      durationBlock,
      '  return { hideByDuration, durationSeconds };',
      '}',
      'globalThis.__runDomDuration = runDomDuration;'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') }
  );
  return {
    run(element = new FakeElement({ 'data-filtertube-video-id': 'CONTENT0003' })) {
      return plain(context.__runDomDuration(element, settings, elementTag));
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
      '  let pendingCategoryMeta = state.pendingCategoryMeta === true;',
      '  let pendingUploadDateMeta = state.pendingUploadDateMeta === true;',
      '  let shouldHide = state.shouldHide === true;',
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

test('JSON-first video meta content parity audit is audit-only and source pinned', () => {
  const text = doc();
  const hashes = {
    'js/filter_logic.js': '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641',
    'js/content/dom_fallback.js': '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef',
    'js/content_bridge.js': '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9'
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, content-filter patch/);
  assert.match(text, /Content Filter Field Semantics Addendum - 2026-05-27/);
  assert.match(text, /content-filter field semantics rows: 8/);
  assert.match(text, /content-filter field semantics contract approval: NO-GO/);
  assert.match(text, /JSON-first first-class content-filter promotion approval: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.match(text, /Content Filter Validity Gate Addendum - 2026-05-28/);
  assert.match(text, /content-filter validity rows: 6/);
  assert.match(text, /active-work value validation owner: absent/);
  assert.match(text, /DOM metadata fetch validity report: absent/);
  assert.match(text, /flowchart TD/);
  assert.equal(lineCount(read('js/filter_logic.js')), 3498);
  assert.equal(Buffer.byteLength(read('js/filter_logic.js')), 165151);
  assert.equal(lineCount(read('js/content/dom_fallback.js')), 4838);
  assert.equal(Buffer.byteLength(read('js/content/dom_fallback.js')), 228332);
  assert.equal(lineCount(read('js/content_bridge.js')), 13535);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 600459);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(sha256(file), hash);
    assert.match(text, new RegExp(hash));
  }
  assert.match(text, /video-meta content parity source files: 3/);
});

test('video meta content parity source counts remain pinned', () => {
  const text = doc();
  const filterLogic = read('js/filter_logic.js');
  const fallback = read('js/content/dom_fallback.js');
  const bridge = read('js/content_bridge.js');
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const slices = {
    extractDuration: sliceBetween(filterLogic, "_extractDuration(item, rules, rendererType = '', depth = 0) {", '\n\n        /**\n         * Extract published time timestamp'),
    extractPublished: sliceBetween(filterLogic, "_extractPublishedTime(item, rules, rendererType = '', depth = 0) {", '\n\n        /**\n         * Check content filters'),
    checkContent: sliceBetween(filterLogic, '_checkContentFilters(item, rules, rendererType) {', '\n\n        /**\n         * Check if title contains uppercase words'),
    contentCall: sliceBetween(filterLogic, 'const shouldBlockByContent = this._checkContentFilters(item, rules, rendererType);', '\n\n            return false;'),
    domUpload: sliceBetween(fallback, 'let hideByUploadDate = false;', "\n            try {\n                const path = document.location?.pathname ||"),
    domDuration: sliceBetween(fallback, 'let hideByDuration = false;', '\n\n            const skipKeywordFiltering'),
    pending: sliceBetween(fallback, 'const pendingMetaTtlMs = 8000;', '\n\n            if (isKidsHost && listMode ==='),
    schedule: sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nfunction processWatchMetaFetchQueue() {'),
    seedGate: sliceBetween(seed, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {'),
    injectorGate: sliceBetween(injector, 'function hasEnabledContentFilters(settings) {', 'function hasSelectedCategoryFilters(settings) {'),
    bridgeGate: sliceBetween(bridge, 'function hasBridgeEnabledContentFilters(settings) {', 'function hasBridgeSelectedCategoryFilters(settings) {')
  };

  assert.equal(lineCount(slices.extractDuration), 234);
  assert.equal(Buffer.byteLength(slices.extractDuration), 11823);
  assert.equal(countLiteral(slices.extractDuration, 'videoMetaMap'), 4);
  assert.equal(countLiteral(slices.extractDuration, 'lengthSeconds'), 7);
  assert.equal(lineCount(slices.extractPublished), 126);
  assert.equal(Buffer.byteLength(slices.extractPublished), 6495);
  assert.equal(countLiteral(slices.extractPublished, 'videoMetaMap'), 3);
  assert.equal(countLiteral(slices.extractPublished, 'uploadDate'), 2);
  assert.equal(countLiteral(slices.extractPublished, 'publishDate'), 2);
  assert.equal(lineCount(slices.checkContent), 155);
  assert.equal(Buffer.byteLength(slices.checkContent), 7739);
  const rendererAllowlist = slices.checkContent.match(/const isVideoRenderer = \[([\s\S]*?)\]\.includes/)[1];
  assert.equal((rendererAllowlist.match(/'[^']+'/g) || []).length, 19);
  assert.equal(lineCount(slices.contentCall), 10);
  assert.equal(lineCount(slices.domUpload), 170);
  assert.equal(Buffer.byteLength(slices.domUpload), 9701);
  assert.equal(countLiteral(slices.domUpload, 'videoMetaMap'), 3);
  assert.equal(countLiteral(slices.domUpload, 'scheduleVideoMetaFetch'), 2);
  assert.equal(countLiteral(slices.domUpload, 'parseDateMs'), 11);
  assert.equal(lineCount(slices.domDuration), 71);
  assert.equal(Buffer.byteLength(slices.domDuration), 4480);
  assert.equal(countLiteral(slices.domDuration, 'videoMetaMap'), 4);
  assert.equal(countLiteral(slices.domDuration, 'scheduleVideoMetaFetch'), 4);
  assert.equal(countLiteral(slices.domDuration, "setAttribute('data-filtertube-duration'"), 1);
  assert.equal(lineCount(slices.pending), 75);
  assert.equal(Buffer.byteLength(slices.pending), 4091);
  assert.equal(countLiteral(slices.pending, 'data-filtertube-pending-upload-date'), 6);
  assert.equal(countLiteral(slices.pending, 'setTimeout('), 2);
  assert.equal(lineCount(slices.schedule), 76);
  assert.equal(Buffer.byteLength(slices.schedule), 2960);
  assert.equal(countLiteral(slices.schedule, 'needDuration'), 8);
  assert.equal(countLiteral(slices.schedule, 'needDates'), 8);
  assert.equal(countLiteral(slices.schedule, 'needCategory'), 8);
  assert.match(slices.checkContent, /cf\.duration && cf\.duration\.enabled/);
  assert.match(slices.checkContent, /cf\.duration\.valueMinutes/);
  assert.match(slices.checkContent, /cf\.duration\.valueMinutesMax/);
  assert.match(slices.checkContent, /const shouldBlock = condition === 'between'/);
  assert.match(slices.domDuration, /durationSettings && durationSettings\.enabled/);
  assert.match(slices.domDuration, /durationSettings\.minMinutes \?\? durationSettings\.minutes \?\? durationSettings\.value \?\? durationSettings\.minutesMin/);
  assert.equal(slices.domDuration.includes('valueMinutes'), false);
  assert.equal(slices.domDuration.includes('valueMinutesMax'), false);
  assert.match(slices.domUpload, /didScheduleMetaFetch = true/);
  assert.match(slices.domUpload, /pendingUploadDateMeta = true/);
  for (const gate of [slices.seedGate, slices.injectorGate, slices.bridgeGate]) {
    assert.match(gate, /duration\?\.enabled === true/);
    assert.match(gate, /uploadDate\?\.enabled === true/);
    assert.match(gate, /uppercase\?\.enabled === true/);
    assert.doesNotMatch(gate, /minMinutes|maxMinutes|minutesMin|minutesMax|fromDate|toDate|valueMinutes/);
  }
  assert.match(text, /enabled === true is enough to admit work/);
  assert.match(text, /duration thresholds are not validated here/);
  assert.match(text, /upload-date cutoffs are not validated here/);

  for (const expected of [
    'filter_logic extract duration block lines: 234',
    'filter_logic extract published time block lines: 126',
    'filter_logic check content filters block lines: 155',
    'filter_logic content renderer allowlist entries: 19',
    'DOM fallback upload-date block lines: 170',
    'DOM fallback duration block lines: 71',
    'DOM fallback pending metadata block lines: 75',
    'content_bridge scheduleVideoMetaFetch body lines: 76',
    'runtime video-meta content parity fixtures: 5'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('JSON engine duration uses videoMetaMap lengthSeconds with current block and allow semantics', () => {
  const videoId = 'CONTENT0001';
  const input = { contents: [{ videoRenderer: videoRenderer(videoId) }] };
  const durationFilter = { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0 };

  const blockHidden = runEngine(input, baseSettings({
    contentFilters: {
      duration: { ...durationFilter, mode: 'block' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { lengthSeconds: '900' } }
  }));
  const allowKept = runEngine(input, baseSettings({
    contentFilters: {
      duration: { ...durationFilter, mode: 'allow' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { lengthSeconds: '900' } }
  }));
  const allowHidden = runEngine(input, baseSettings({
    contentFilters: {
      duration: { ...durationFilter, mode: 'allow' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { lengthSeconds: '300' } }
  }));

  assert.deepEqual(blockHidden, { contents: [] });
  assert.equal(allowKept.contents.length, 1);
  assert.deepEqual(allowHidden, { contents: [] });

  const zeroLongerHidden = runEngine({
    contents: [{ videoRenderer: videoRenderer(videoId, { lengthText: { simpleText: '4:00' } }) }]
  }, baseSettings({
    contentFilters: {
      duration: { enabled: true, condition: 'longer', minMinutes: 0, maxMinutes: 0, value: '' },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));
  assert.deepEqual(zeroLongerHidden, { contents: [] });
});

test('JSON engine upload-date uses videoMetaMap dates and blank cutoffs no-op', () => {
  const videoId = 'CONTENT0001';
  const input = { contents: [{ videoRenderer: videoRenderer(videoId) }] };

  const oldHidden = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01', toDate: '' },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { uploadDate: '2025-01-01' } }
  }));
  const newKept = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01', toDate: '' },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { uploadDate: '2026-02-01' } }
  }));
  const blankCutoffKept = runEngine(input, baseSettings({
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '' },
      uppercase: { enabled: false }
    },
    videoMetaMap: { [videoId]: { uploadDate: '2025-01-01' } }
  }));

  assert.deepEqual(oldHidden, { contents: [] });
  assert.equal(newKept.contents.length, 1);
  assert.equal(blankCutoffKept.contents.length, 1);
});

test('DOM fallback upload-date uses metadata when present and pending state only after valid cutoff need', () => {
  const videoId = 'CONTENT0002';
  const settings = {
    contentFilters: {
      uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01', toDate: '' }
    },
    videoMetaMap: { [videoId]: { uploadDate: '2025-01-01' } }
  };
  const runtime = loadDomUploadDateRuntime({ settings });
  const element = new FakeElement({ 'data-filtertube-video-id': videoId });

  assert.deepEqual(runtime.run(element), { hideByUploadDate: true, pendingUploadDateMeta: false });
  assert.deepEqual(runtime.fetches, []);

  const missingRuntime = loadDomUploadDateRuntime({
    settings: {
      contentFilters: {
        uploadDate: { enabled: true, condition: 'newer', fromDate: '2026-01-01', toDate: '' }
      },
      videoMetaMap: {}
    }
  });
  assert.deepEqual(missingRuntime.run(new FakeElement({ 'data-filtertube-video-id': videoId })), {
    hideByUploadDate: false,
    pendingUploadDateMeta: true
  });
  assert.deepEqual(plain(missingRuntime.fetches), [{
    videoId,
    options: { needDuration: false, needDates: true }
  }]);

  const blankRuntime = loadDomUploadDateRuntime({
    settings: {
      contentFilters: {
        uploadDate: { enabled: true, condition: 'newer', fromDate: '', toDate: '' }
      },
      videoMetaMap: {}
    }
  });
  assert.deepEqual(blankRuntime.run(new FakeElement({ 'data-filtertube-video-id': videoId })), {
    hideByUploadDate: false,
    pendingUploadDateMeta: false
  });
  assert.deepEqual(plain(blankRuntime.fetches), [{
    videoId,
    options: { needDuration: false, needDates: true }
  }]);
});

test('DOM fallback duration writes cached metadata and schedules Kids or mix-like fetches when missing', () => {
  const videoId = 'CONTENT0003';
  const runtime = loadDomDurationRuntime({
    settings: {
      contentFilters: {
        duration: { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0 }
      },
      videoMetaMap: { [videoId]: { lengthSeconds: '900' } }
    }
  });
  const element = new FakeElement({ 'data-filtertube-video-id': videoId });

  assert.deepEqual(runtime.run(element), { hideByDuration: true, durationSeconds: 900 });
  assert.equal(element.getAttribute('data-filtertube-duration'), '900');

  const kidsRuntime = loadDomDurationRuntime({
    hostname: 'www.youtubekids.com',
    settings: {
      contentFilters: {
        duration: { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0 }
      },
      videoMetaMap: {}
    }
  });
  assert.deepEqual(kidsRuntime.run(new FakeElement({ 'data-filtertube-video-id': videoId })), {
    hideByDuration: false,
    durationSeconds: null
  });
  assert.deepEqual(plain(kidsRuntime.fetches), [{
    videoId,
    options: { needDuration: true, needDates: false, needCategory: false }
  }]);

  const mixRuntime = loadDomDurationRuntime({
    settings: {
      contentFilters: {
        duration: { enabled: true, condition: 'longer', minMinutes: 10, maxMinutes: 0 }
      },
      videoMetaMap: {}
    }
  });
  mixRuntime.run(new FakeElement({ 'data-filtertube-video-id': videoId }, {
    href: '/watch?v=CONTENT0003&start_radio=1'
  }));
  assert.deepEqual(plain(mixRuntime.fetches), [{ videoId }]);
});

test('DOM pending upload-date marker writes timestamp schedules one recheck and clears stale state', () => {
  const nowMs = 1700000000000;
  const runtime = loadPendingMarkerRuntime({ nowMs });
  const target = new FakeElement();

  const first = runtime.run(target, { pendingUploadDateMeta: true, shouldHide: false });
  assert.equal(first.pendingMetaOnly, true);
  assert.equal(first.hideReason, 'Pending upload date metadata');
  assert.equal(target.getAttribute('data-filtertube-pending-upload-date'), 'true');
  assert.equal(target.getAttribute('data-filtertube-pending-upload-date-ts'), String(nowMs));
  assert.deepEqual(runtime.timers.map((timer) => timer.delay), [8120]);

  const second = runtime.run(target, { pendingUploadDateMeta: true, shouldHide: false });
  assert.equal(second.pendingMetaOnly, true);
  assert.equal(runtime.timers.length, 1);

  const staleTarget = new FakeElement({
    'data-filtertube-pending-upload-date': 'true',
    'data-filtertube-pending-upload-date-ts': String(nowMs - 9000)
  });
  const stale = runtime.run(staleTarget, { pendingUploadDateMeta: true, shouldHide: false });
  assert.equal(stale.pendingUploadDateMeta, false);
  assert.equal(staleTarget.getAttribute('data-filtertube-pending-upload-date'), null);
  assert.equal(staleTarget.getAttribute('data-filtertube-pending-upload-date-ts'), null);
});

test('product runtime still lacks first-class video-meta content parity authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaContentParityContract',
    'jsonFirstVideoMetaDurationDecisionReport',
    'jsonFirstVideoMetaUploadDateDecisionReport',
    'jsonFirstVideoMetaJsonDomContentDecisionReport',
    'jsonFirstVideoMetaUploadDatePendingPolicy',
    'jsonFirstVideoMetaDurationCachePolicy',
    'jsonFirstVideoMetaContentNoWorkBudget',
    'jsonFirstVideoMetaContentFixtureProvenance',
    'jsonFirstVideoMetaContentMetricArtifact',
    'jsonFirstVideoMetaContentRevisionPolicy',
    'jsonFirstContentFilterFieldSemanticsContract',
    'jsonFirstContentFilterJsonDomParityReport',
    'jsonFirstContentFilterActiveGateStrictnessPolicy',
    'jsonFirstContentFilterDurationAliasPolicy',
    'jsonFirstContentFilterUploadDatePendingReport',
    'jsonFirstContentFilterUppercaseDomParityPolicy',
    'jsonFirstContentFilterSettingsIngressNormalizer',
    'jsonFirstContentFilterPromotionMetricArtifact',
    'jsonFirstContentFilterValidityGate',
    'jsonFirstContentFilterDurationThresholdPolicy',
    'jsonFirstContentFilterUploadDateCutoffPolicy',
    'jsonFirstContentFilterMetadataFetchValidityReport',
    'jsonFirstContentFilterZeroThresholdDecisionReport',
    'jsonFirstContentFilterAdmissionDecisionReport'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }

  for (const ledgerPath of [
    'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
  ]) {
    const ledger = read(ledgerPath);
    assert.ok(ledger.includes('2026-05-27 content-filter field semantics continuation'), `${ledgerPath} should cite field semantics continuation`);
    assert.match(ledger, /JSON-first\s+first-class(?:\s+content-filter)?\s+promotion/);
    assert.match(ledger, /runtime\s+behavior changes remain `NO-GO`/);
  }
});
