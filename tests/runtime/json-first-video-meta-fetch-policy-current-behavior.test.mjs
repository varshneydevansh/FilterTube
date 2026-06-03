import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FETCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const videoMetaMethodGapDocs = [
  docPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_NO_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_MERGE_SCHEMA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CATEGORY_PARITY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_CONTENT_PARITY_CURRENT_BEHAVIOR_2026-05-22.md'
];

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

function makeFixedDate(nowMs) {
  function FixedDate(...args) {
    return args.length > 0 ? new Date(...args) : new Date(nowMs);
  }
  FixedDate.now = () => nowMs;
  FixedDate.parse = Date.parse;
  FixedDate.UTC = Date.UTC;
  FixedDate.prototype = Date.prototype;
  return FixedDate;
}

function loadSchedulerRuntime({ initialSettings = {}, nowMs = 1700000000000, neverResolveFetches = false } = {}) {
  const bridge = read('js/content_bridge.js');
  const declarations = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nfunction scheduleVideoMetaFetch'
  );
  const scheduleBlock = sliceBetween(
    bridge,
    'function scheduleVideoMetaFetch(videoId, options = null) {',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );

  const fetches = [];
  const context = {
    currentSettings: { ...initialSettings },
    Date: makeFixedDate(nowMs),
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
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
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
      scheduleBlock,
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
    get activeWatchMetaFetches() {
      return context.__schedulerExports.activeWatchMetaFetches;
    },
    context,
    fetches
  };
}

function loadWatchFetchRuntime({
  hostname = 'www.youtube.com',
  html = '',
  ok = true,
  touchResult = true
} = {}) {
  const bridge = read('js/content_bridge.js');
  const fetchBlock = sliceBetween(
    bridge,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '\n\n// =========================================='
  );

  const fetchCalls = [];
  const persisted = [];
  const touched = [];
  const reruns = [];
  const context = {
    location: { hostname },
    fetch(url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve({
        ok,
        text: () => Promise.resolve(html)
      });
    },
    persistVideoMetaMapping(entries) {
      persisted.push(JSON.parse(JSON.stringify(entries)));
    },
    touchDomForVideoMetaUpdate(videoId) {
      touched.push(videoId);
      return touchResult;
    },
    scheduleVideoMetaDomRerun() {
      reruns.push(true);
    },
    Array,
    Boolean,
    Date,
    JSON,
    Math,
    Number,
    Object,
    Promise,
    String
  };
  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    [
      fetchBlock,
      'globalThis.__watchFetchExports = { fetchVideoMetaFromWatchUrl };'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );

  return {
    ...context.__watchFetchExports,
    fetchCalls,
    persisted,
    touched,
    reruns
  };
}

test('JSON-first video meta fetch policy audit is audit-only and source pinned', () => {
  const text = doc();
  const hashes = {
    'js/content_bridge.js': 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c',
    'js/content/dom_fallback.js': 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5',
    'js/filter_logic.js': '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, network patch/);
  assert.equal(lineCount(read('js/content_bridge.js')), 13571);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 601694);
  assert.equal(lineCount(read('js/content/dom_fallback.js')), 5030);
  assert.equal(Buffer.byteLength(read('js/content/dom_fallback.js')), 235555);
  assert.equal(lineCount(read('js/filter_logic.js')), 3652);
  assert.equal(Buffer.byteLength(read('js/filter_logic.js')), 172174);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(sha256(file), hash);
    assert.match(text, new RegExp(hash));
  }
  assert.match(text, /video-meta fetch policy source files: 3/);
});

test('video metadata JSON-first family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  for (const marker of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5744',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5744',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(marker), `method gap source missing ${marker}`);
  }

  assert.equal(videoMetaMethodGapDocs.length, 8);
  for (const file of videoMetaMethodGapDocs) {
    const text = read(file);
    assert.ok(text.includes(methodGapPath), `${file} should cite method gap source`);
    assert.match(text, /## Method Semantic Proof Gap Boundary/);
    assert.match(text, /method semantic proof gap files covered: 69/);
    assert.match(text, /method semantic proof gap lexical callables covered: 5744/);
    assert.match(text, /files with complete per-callable semantic proof: 0/);
    assert.match(text, /lexical callables requiring semantic proof before behavior changes: 5744/);
    assert.match(text, /affected callable semantic proof: NO-GO/);
    assert.match(text, /runtime behavior changed: no/);
    assert.match(text, /do not approve runtime\s+optimization/);
    assert.match(text, /JSON-first behavior/);
    assert.match(text, /video metadata fetch changes/);
  }
});

test('video meta fetch policy counts and callsite matrix remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const filterLogic = read('js/filter_logic.js');
  const slices = {
    schedule: sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nfunction processWatchMetaFetchQueue() {'),
    queue: sliceBetween(bridge, 'function processWatchMetaFetchQueue() {', '\n\nasync function fetchVideoMetaFromWatchUrl'),
    fetchWatch: sliceBetween(bridge, 'async function fetchVideoMetaFromWatchUrl(videoId) {', '\n\n// =========================================='),
    domCategory: sliceBetween(fallback, 'let hideByCategory = false;', '\n            const alreadyProcessed'),
    domUploadDate: sliceBetween(fallback, 'let hideByUploadDate = false;', "\n            try {\n                const path = document.location?.pathname ||"),
    domDuration: sliceBetween(fallback, 'let hideByDuration = false;', '\n\n            const skipKeywordFiltering'),
    filterCategory: sliceBetween(filterLogic, '_checkCategoryFilters(item, rules, rendererType) {', '\n\n        /**\n         * Extract title')
  };

  assert.equal(lineCount(slices.schedule), 76);
  assert.equal(Buffer.byteLength(slices.schedule), 2960);
  assert.equal(countLiteral(slices.schedule, 'needDuration'), 8);
  assert.equal(countLiteral(slices.schedule, 'needDates'), 8);
  assert.equal(countLiteral(slices.schedule, 'needCategory'), 8);
  assert.equal(countLiteral(slices.schedule, 'lastWatchMetaFetchAttempt'), 5);
  assert.equal(lineCount(slices.queue), 17);
  assert.equal(Buffer.byteLength(slices.queue), 727);
  assert.equal(lineCount(slices.fetchWatch), 98);
  assert.equal(Buffer.byteLength(slices.fetchWatch), 3382);
  assert.equal(countLiteral(slices.fetchWatch, 'fetch('), 1);
  assert.equal(countLiteral(slices.fetchWatch, 'JSON.parse'), 1);
  assert.equal(countLiteral(slices.fetchWatch, 'persistVideoMetaMapping'), 1);
  assert.equal(countLiteral(slices.fetchWatch, 'touchDomForVideoMetaUpdate'), 1);
  assert.equal(countLiteral(slices.fetchWatch, 'scheduleVideoMetaDomRerun'), 1);
  assert.equal(countLiteral(bridge, 'scheduleVideoMetaFetch'), 1);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch'), 8);
  assert.equal(countLiteral(filterLogic, 'scheduleVideoMetaFetch'), 2);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })'), 1);
  assert.equal(countLiteral(filterLogic, 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })'), 1);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: true })'), 1);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch(videoId, { needDuration: true, needDates: false, needCategory: false })'), 1);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch(videoId);'), 1);

  for (const expected of [
    'content_bridge scheduleVideoMetaFetch body lines: 76',
    'content_bridge scheduleVideoMetaFetch body bytes: 2960',
    'content_bridge scheduleVideoMetaFetch needDuration tokens: 8',
    'content_bridge processWatchMetaFetchQueue body lines: 17',
    'content_bridge fetchVideoMetaFromWatchUrl body lines: 98',
    'watch meta fetch concurrency limit: 3',
    'watch meta fetch cooldown milliseconds: 60000',
    'watch meta fetch attempt map cap: 3000',
    'watch meta fetch attempt map trim count: 800',
    'DOM fallback default duration fetch callsites: 1',
    'filter_logic category fetch callsites: 1'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(slices.domCategory, /categoryRaw/);
  assert.match(slices.domUploadDate, /didScheduleMetaFetch = true/);
  assert.match(slices.domDuration, /isKidsHost/);
  assert.match(slices.domDuration, /isMixLike/);
  assert.match(slices.filterCategory, /selected\.length === 0/);
});

test('scheduleVideoMetaFetch applies current need flags cache satisfaction cooldown and defaults', () => {
  const runtime = loadSchedulerRuntime({
    initialSettings: {
      videoMetaMap: {
        FULLMETA001: {
          lengthSeconds: '60',
          publishDate: '2026-01-02',
          uploadDate: '',
          category: 'Education'
        },
        NODURAT0001: {
          publishDate: '2026-01-02',
          category: 'Education'
        }
      }
    }
  });

  runtime.scheduleVideoMetaFetch('FULLMETA001', {
    needDuration: true,
    needDates: true,
    needCategory: true
  });
  runtime.scheduleVideoMetaFetch('CATEGORY001', {
    needDuration: false,
    needDates: false,
    needCategory: true
  });
  runtime.scheduleVideoMetaFetch('CATEGORY001', {
    needDuration: false,
    needDates: false,
    needCategory: true
  });
  runtime.scheduleVideoMetaFetch('DATEFETCH01', {
    needDuration: false,
    needDates: true
  });
  runtime.scheduleVideoMetaFetch('NODURAT0001');
  runtime.scheduleVideoMetaFetch('bad id', {
    needDuration: true
  });

  assert.deepEqual(runtime.fetches, ['CATEGORY001', 'DATEFETCH01', 'NODURAT0001']);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('FULLMETA001'), false);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('CATEGORY001'), true);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('DATEFETCH01'), true);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('NODURAT0001'), true);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('bad id'), false);
});

test('watch metadata fetch queue starts only three active fetches before waiting', () => {
  const runtime = loadSchedulerRuntime({ neverResolveFetches: true });
  for (const videoId of ['FETCHPOL001', 'FETCHPOL002', 'FETCHPOL003', 'FETCHPOL004', 'FETCHPOL005']) {
    runtime.scheduleVideoMetaFetch(videoId, {
      needDuration: false,
      needDates: false,
      needCategory: true
    });
  }

  assert.deepEqual(runtime.fetches, ['FETCHPOL001', 'FETCHPOL002', 'FETCHPOL003']);
  assert.equal(runtime.activeWatchMetaFetches, 3);
  assert.equal(runtime.pendingWatchMetaFetches.size, 3);
  assert.equal(runtime.queuedWatchMetaFetches.size, 2);
  assert.equal(runtime.watchMetaFetchQueue.length, 2);
});

test('fetchVideoMetaFromWatchUrl skips Kids and otherwise persists parsed watch metadata with DOM rerun after touch', async () => {
  const kids = loadWatchFetchRuntime({ hostname: 'www.youtubekids.com' });
  assert.equal(await kids.fetchVideoMetaFromWatchUrl('FETCHMETA10'), null);
  assert.deepEqual(kids.fetchCalls, []);

  const html = [
    '<html><script>',
    'var ytInitialPlayerResponse = {"videoDetails":{"lengthSeconds":"123"},',
    '"microformat":{"playerMicroformatRenderer":{"publishDate":"2026-01-02","uploadDate":"2026-01-01","category":"Education"}}};',
    '</script></html>'
  ].join('');
  const runtime = loadWatchFetchRuntime({ html, touchResult: true });

  const result = await runtime.fetchVideoMetaFromWatchUrl('FETCHMETA10');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    videoId: 'FETCHMETA10',
    lengthSeconds: '123',
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education'
  });
  assert.equal(runtime.fetchCalls.length, 1);
  assert.equal(runtime.fetchCalls[0].url, 'https://www.youtube.com/watch?v=FETCHMETA10');
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.fetchCalls[0].options)), {
    credentials: 'same-origin',
    headers: { Accept: 'text/html' }
  });
  assert.deepEqual(runtime.persisted, [[{
    videoId: 'FETCHMETA10',
    lengthSeconds: '123',
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education'
  }]]);
  assert.deepEqual(runtime.touched, ['FETCHMETA10']);
  assert.deepEqual(runtime.reruns, [true]);

  const noTouch = loadWatchFetchRuntime({ html, touchResult: false });
  await noTouch.fetchVideoMetaFromWatchUrl('FETCHMETA10');
  assert.deepEqual(noTouch.touched, ['FETCHMETA10']);
  assert.deepEqual(noTouch.reruns, []);
});

test('product runtime still lacks first-class video-meta fetch policy authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaFetchPolicyContract',
    'jsonFirstVideoMetaFetchReasonMatrix',
    'jsonFirstVideoMetaFetchBudgetReport',
    'jsonFirstVideoMetaFetchCallsiteAuthority',
    'jsonFirstVideoMetaFetchNeedFlagReport',
    'jsonFirstVideoMetaFetchConcurrencyPolicy',
    'jsonFirstVideoMetaFetchKidsPolicy',
    'jsonFirstVideoMetaFetchMetricArtifact',
    'jsonFirstVideoMetaFetchRevisionPolicy',
    'jsonFirstVideoMetaFetchNoWorkBudget'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
