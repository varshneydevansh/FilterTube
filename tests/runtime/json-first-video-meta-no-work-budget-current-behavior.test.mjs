import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md';

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

function makeMutableDate(nowMs) {
  let currentNow = nowMs;
  let nowCalls = 0;
  function FixedDate(...args) {
    return args.length > 0 ? new Date(...args) : new Date(currentNow);
  }
  FixedDate.now = () => {
    nowCalls += 1;
    return currentNow;
  };
  FixedDate.parse = Date.parse;
  FixedDate.UTC = Date.UTC;
  FixedDate.prototype = Date.prototype;
  return {
    DateCtor: FixedDate,
    setNow(value) {
      currentNow = value;
    },
    get nowCalls() {
      return nowCalls;
    },
    resetNowCalls() {
      nowCalls = 0;
    }
  };
}

function loadSchedulerRuntime({ initialSettings = {}, nowMs = 1700000000000, neverResolveFetches = true } = {}) {
  const bridge = read('js/content_bridge.js');
  const declarations = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nfunction scheduleVideoMetaFetch'
  );
  const scheduleAndQueueBlock = sliceBetween(
    bridge,
    'function scheduleVideoMetaFetch(videoId, options = null) {',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  const mutableDate = makeMutableDate(nowMs);
  const fetchCalls = [];
  const context = {
    currentSettings: { ...initialSettings },
    Date: mutableDate.DateCtor,
    Array,
    Boolean,
    Map,
    Math,
    Number,
    Object,
    Promise,
    RegExp,
    Set,
    String,
    parseInt,
    fetchVideoMetaFromWatchUrl(...args) {
      fetchCalls.push(plain(args));
      if (neverResolveFetches) {
        return new Promise(() => {});
      }
      return Promise.resolve(null);
    }
  };
  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    [
      declarations,
      scheduleAndQueueBlock,
      'globalThis.__schedulerExports = {',
      '  scheduleVideoMetaFetch,',
      '  pendingWatchMetaFetches,',
      '  queuedWatchMetaFetches,',
      '  watchMetaFetchQueue,',
      '  lastWatchMetaFetchAttempt,',
      '  get activeWatchMetaFetches() { return activeWatchMetaFetches; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );

  const exported = context.__schedulerExports;
  return {
    scheduleVideoMetaFetch: exported.scheduleVideoMetaFetch,
    pendingWatchMetaFetches: exported.pendingWatchMetaFetches,
    queuedWatchMetaFetches: exported.queuedWatchMetaFetches,
    watchMetaFetchQueue: exported.watchMetaFetchQueue,
    lastWatchMetaFetchAttempt: exported.lastWatchMetaFetchAttempt,
    setNow: mutableDate.setNow,
    resetNowCalls: mutableDate.resetNowCalls,
    get nowCalls() {
      return mutableDate.nowCalls;
    },
    get activeWatchMetaFetches() {
      return context.__schedulerExports.activeWatchMetaFetches;
    },
    fetchCalls
  };
}

class FakeElement {
  constructor(attrs = {}, options = {}) {
    this.attrs = new Map();
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
  }

  removeAttribute(name) {
    this.attrs.delete(name);
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

function loadDomUploadDateRuntime({ settings, nowMs = 1700000000000 } = {}) {
  const source = read('js/content/dom_fallback.js');
  const uploadBlock = sliceBetween(
    source,
    '            let hideByUploadDate = false;',
    '\n            try {\n                const path = document.location?.pathname ||'
  );
  const fetches = [];
  const context = {
    document: { location: { pathname: '/', search: '' } },
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
      return false;
    },
    isSelectedPlaylistPanelRow() {
      return false;
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
    run(element = new FakeElement({ 'data-filtertube-video-id': 'UPLOADDT001' })) {
      return plain(context.__runDomUploadDate(element, settings));
    },
    fetches
  };
}

function loadDomDurationRuntime({ settings, hostname = 'www.youtube.com', extractedDuration = null } = {}) {
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
    run(element = new FakeElement({ 'data-filtertube-video-id': 'MIXFETCH001' }, {
      href: '/watch?v=MIXFETCH001&list=RDMIXFETCH001&start_radio=1'
    })) {
      return plain(context.__runDomDuration(element, settings, 'ytd-video-renderer'));
    },
    fetches
  };
}

test('JSON-first video meta no-work budget audit is audit-only and source pinned', () => {
  const text = doc();
  const hashes = {
    'js/content_bridge.js': '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3',
    'js/content/dom_fallback.js': '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef',
    'js/filter_logic.js': '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, scheduler patch/);
  assert.equal(lineCount(read('js/content_bridge.js')), 13571);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 601694);
  assert.equal(lineCount(read('js/content/dom_fallback.js')), 4838);
  assert.equal(Buffer.byteLength(read('js/content/dom_fallback.js')), 228332);
  assert.equal(lineCount(read('js/filter_logic.js')), 3652);
  assert.equal(Buffer.byteLength(read('js/filter_logic.js')), 172174);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(sha256(file), hash);
    assert.match(text, new RegExp(hash));
  }
  assert.match(text, /video-meta no-work budget source files: 3/);
});

test('video meta no-work source counts and queue reason-loss sites remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const filterLogic = read('js/filter_logic.js');
  const slices = {
    schedule: sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nfunction processWatchMetaFetchQueue() {'),
    queue: sliceBetween(bridge, 'function processWatchMetaFetchQueue() {', '\n\nasync function fetchVideoMetaFromWatchUrl'),
    fetchWatch: sliceBetween(bridge, 'async function fetchVideoMetaFromWatchUrl(videoId) {', '\n\n// =========================================='),
    domUpload: sliceBetween(fallback, 'let hideByUploadDate = false;', '\n            try {\n                const path = document.location?.pathname ||'),
    domDuration: sliceBetween(fallback, 'let hideByDuration = false;', '\n\n            const skipKeywordFiltering'),
    filterCategory: sliceBetween(filterLogic, '        _checkCategoryFilters(item, rules, rendererType) {', '\n\n        /**\n         * Extract title')
  };

  assert.equal(lineCount(slices.schedule), 76);
  assert.equal(Buffer.byteLength(slices.schedule), 2960);
  assert.equal(countLiteral(slices.schedule, 'Date.now()'), 1);
  assert.equal(countLiteral(slices.schedule, 'lastWatchMetaFetchAttempt.get'), 1);
  assert.equal(countLiteral(slices.schedule, 'lastWatchMetaFetchAttempt.set'), 1);
  assert.equal(countLiteral(slices.schedule, 'pendingWatchMetaFetches.has'), 1);
  assert.equal(countLiteral(slices.schedule, 'queuedWatchMetaFetches.has'), 1);
  assert.equal(countLiteral(slices.schedule, 'watchMetaFetchQueue.push'), 1);
  assert.equal(countLiteral(slices.schedule, 'processWatchMetaFetchQueue()'), 1);
  assert.equal(countLiteral(slices.schedule, 'needDuration'), 8);
  assert.equal(countLiteral(slices.schedule, 'needDates'), 8);
  assert.equal(countLiteral(slices.schedule, 'needCategory'), 8);
  assert.equal(lineCount(slices.queue), 17);
  assert.equal(Buffer.byteLength(slices.queue), 727);
  assert.equal(countLiteral(slices.queue, 'fetchVideoMetaFromWatchUrl(nextVideoId)'), 1);
  assert.equal(countLiteral(slices.queue, 'fetchVideoMetaFromWatchUrl(nextVideoId,'), 0);
  assert.equal(lineCount(slices.fetchWatch), 98);
  assert.equal(Buffer.byteLength(slices.fetchWatch), 3382);
  assert.equal(lineCount(slices.domUpload), 170);
  assert.equal(Buffer.byteLength(slices.domUpload), 9701);
  assert.equal(countLiteral(slices.domUpload, 'Date.now()'), 1);
  assert.equal(countLiteral(slices.domUpload, 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })'), 1);
  assert.equal(countLiteral(slices.domUpload, 'didScheduleMetaFetch = true'), 1);
  assert.equal(countLiteral(slices.domUpload, 'needsTimestamp'), 2);
  assert.equal(lineCount(slices.domDuration), 71);
  assert.equal(Buffer.byteLength(slices.domDuration), 4480);
  assert.equal(countLiteral(slices.domDuration, 'scheduleVideoMetaFetch(videoId, { needDuration: true, needDates: false, needCategory: false })'), 1);
  assert.equal(countLiteral(slices.domDuration, 'scheduleVideoMetaFetch(videoId);'), 1);
  assert.equal(lineCount(slices.filterCategory), 57);
  assert.equal(Buffer.byteLength(slices.filterCategory), 2683);
  assert.equal(countLiteral(slices.filterCategory, 'selected.length === 0'), 1);

  for (const expected of [
    'content_bridge scheduleVideoMetaFetch Date.now callsites: 1',
    'content_bridge queue-to-fetch option forwarding callsites: 0',
    'content_bridge queue-to-fetch video-id-only callsites: 1',
    'DOM fallback upload-date needsTimestamp tokens: 2',
    'DOM fallback default duration fetch callsites: 1',
    'filter_logic category selected-empty guard callsites: 1'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('scheduler skips timestamp cooldown queue and fetch work for invalid satisfied and all-false requests', () => {
  const runtime = loadSchedulerRuntime({
    initialSettings: {
      videoMetaMap: {
        FULLMETA001: {
          lengthSeconds: '60',
          uploadDate: '2026-01-01',
          publishDate: '2026-01-02',
          category: 'Education'
        }
      }
    }
  });

  runtime.scheduleVideoMetaFetch('bad id', { needDuration: true, needDates: true, needCategory: true });
  runtime.scheduleVideoMetaFetch('FULLMETA001', { needDuration: true, needDates: true, needCategory: true });
  runtime.scheduleVideoMetaFetch('ANYNOOP0001', { needDuration: false, needDates: false, needCategory: false });

  assert.equal(runtime.nowCalls, 0);
  assert.deepEqual(runtime.fetchCalls, []);
  assert.equal(runtime.lastWatchMetaFetchAttempt.size, 0);
  assert.equal(runtime.queuedWatchMetaFetches.size, 0);
  assert.equal(runtime.watchMetaFetchQueue.length, 0);
});

test('scheduler admits default duration work and drops need flags before fetch execution', () => {
  const runtime = loadSchedulerRuntime({
    initialSettings: {
      videoMetaMap: {
        DATEONLY001: {
          uploadDate: '2026-01-01',
          publishDate: '2026-01-02',
          category: 'Education'
        }
      }
    }
  });

  runtime.scheduleVideoMetaFetch('DATEONLY001');
  runtime.scheduleVideoMetaFetch('MULTINEED01', { needDuration: false, needDates: false, needCategory: true });
  runtime.scheduleVideoMetaFetch('MULTINEED01', { needDuration: false, needDates: true, needCategory: false });

  assert.deepEqual(runtime.fetchCalls, [['DATEONLY001'], ['MULTINEED01']]);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('DATEONLY001'), true);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('MULTINEED01'), true);
  assert.equal(runtime.pendingWatchMetaFetches.size, 2);
  assert.equal(runtime.activeWatchMetaFetches, 2);
});

test('duplicate pending metadata fetch refreshes cooldown without starting a second fetch', () => {
  const runtime = loadSchedulerRuntime({ nowMs: 1700000000000 });

  runtime.scheduleVideoMetaFetch('COOLDOWN001', { needDuration: false, needDates: true, needCategory: false });
  assert.deepEqual(runtime.fetchCalls, [['COOLDOWN001']]);
  assert.equal(runtime.pendingWatchMetaFetches.has('COOLDOWN001'), true);
  assert.equal(runtime.lastWatchMetaFetchAttempt.get('COOLDOWN001'), 1700000000000);

  runtime.setNow(1700000061000);
  runtime.scheduleVideoMetaFetch('COOLDOWN001', { needDuration: false, needDates: false, needCategory: true });
  assert.deepEqual(runtime.fetchCalls, [['COOLDOWN001']]);
  assert.equal(runtime.lastWatchMetaFetchAttempt.get('COOLDOWN001'), 1700000061000);

  runtime.pendingWatchMetaFetches.delete('COOLDOWN001');
  runtime.setNow(1700000062000);
  runtime.scheduleVideoMetaFetch('COOLDOWN001', { needDuration: false, needDates: true, needCategory: true });
  assert.deepEqual(runtime.fetchCalls, [['COOLDOWN001']]);
  assert.equal(runtime.lastWatchMetaFetchAttempt.get('COOLDOWN001'), 1700000061000);
});

test('DOM upload-date and duration callsites admit fetch work before final no-work proof exists', () => {
  const uploadRuntime = loadDomUploadDateRuntime({
    settings: {
      contentFilters: {
        uploadDate: {
          enabled: true,
          condition: 'newer',
          fromDate: '',
          toDate: ''
        }
      },
      videoMetaMap: {}
    }
  });
  const uploadResult = uploadRuntime.run();

  assert.deepEqual(uploadResult, {
    hideByUploadDate: false,
    pendingUploadDateMeta: false
  });
  assert.deepEqual(plain(uploadRuntime.fetches), [{
    videoId: 'UPLOADDT001',
    options: { needDuration: false, needDates: true }
  }]);

  const durationRuntime = loadDomDurationRuntime({
    settings: {
      contentFilters: {
        duration: {
          enabled: true,
          condition: 'longer',
          minMinutes: 30
        }
      },
      videoMetaMap: {}
    }
  });
  const durationResult = durationRuntime.run();

  assert.deepEqual(durationResult, {
    hideByDuration: false,
    durationSeconds: null
  });
  assert.equal(durationRuntime.fetches.length, 1);
  assert.equal(durationRuntime.fetches[0].videoId, 'MIXFETCH001');
  assert.equal(durationRuntime.fetches[0].options, undefined);
});

test('product runtime still lacks first-class video-meta no-work budget authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaNoWorkBudgetContract',
    'jsonFirstVideoMetaSchedulerSkipReport',
    'jsonFirstVideoMetaSchedulerNeedReasonReport',
    'jsonFirstVideoMetaSchedulerCooldownPolicy',
    'jsonFirstVideoMetaQueueReasonRetentionPolicy',
    'jsonFirstVideoMetaDuplicatePendingRetryPolicy',
    'jsonFirstVideoMetaUploadDateCutoffWorkGate',
    'jsonFirstVideoMetaDefaultDurationFetchPolicy',
    'jsonFirstVideoMetaNoWorkMetricArtifact',
    'jsonFirstVideoMetaNoWorkRevisionPolicy'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
