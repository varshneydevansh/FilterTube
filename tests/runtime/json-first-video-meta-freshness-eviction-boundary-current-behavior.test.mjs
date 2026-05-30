import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_FRESHNESS_EVICTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadContentPersistenceRuntime(initialSettings = {}) {
  const bridge = read('js/content_bridge.js');
  const persistBlock = sliceBetween(
    bridge,
    'function persistVideoMetaMapping(entries = []) {',
    '\n\nlet pendingVideoMetaDomRerunTimer'
  );
  const sentMessages = [];
  const context = {
    currentSettings: initialSettings,
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(message) {
          sentMessages.push(plain(message));
        }
      }
    },
    Array,
    Boolean,
    Number,
    Object,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      persistBlock,
      'globalThis.__contentPersistenceExports = {',
      '  persistVideoMetaMapping,',
      '  getCurrentSettings() { return currentSettings; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );
  return {
    ...context.__contentPersistenceExports,
    sentMessages
  };
}

function loadSchedulerRuntime({ initialSettings = {}, nowMs = 4102444800000 } = {}) {
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
    fetches
  };
}

function loadBackgroundVideoMetaRuntime({ storageResult = { videoMetaMap: {} }, rejectStorage = false } = {}) {
  const background = read('js/background.js');
  const declarations = sliceBetween(
    background,
    'let compiledSettingsCache = { main: null, kids: null };',
    '\nlet autoBackupTimer = null;'
  );
  const ensureBlock = sliceBetween(
    background,
    'function ensureVideoMetaMapCache() {',
    '\n\nfunction enforceVideoChannelMapCap'
  );
  const enforceBlock = sliceBetween(
    background,
    'function enforceVideoMetaMapCap(map) {',
    '\n\nfunction flushVideoChannelMapUpdates'
  );
  const flushBlock = sliceBetween(
    background,
    'function flushVideoMetaMapUpdates() {',
    '\n\nfunction scheduleVideoChannelMapFlush'
  );
  const scheduleBlock = sliceBetween(
    background,
    'function scheduleVideoMetaMapFlush() {',
    '\n\nfunction enqueueVideoChannelMapUpdate'
  );
  const enqueueBlock = sliceBetween(
    background,
    'function enqueueVideoMetaMapUpdate(videoId, meta) {',
    '\n\n/**'
  );

  const storageGets = [];
  const storageSets = [];
  const timers = [];
  let nextTimerId = 1;

  const context = {
    __storageResult: storageResult,
    __rejectStorage: rejectStorage,
    storageGet(keys) {
      storageGets.push(keys);
      if (context.__rejectStorage) {
        return Promise.reject(new Error('storage failed'));
      }
      return Promise.resolve(context.__storageResult);
    },
    browserAPI: {
      storage: {
        local: {
          async set(payload) {
            storageSets.push(plain(payload));
          }
        }
      }
    },
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay, fired: false });
      return id;
    },
    Array,
    Boolean,
    JSON,
    Map,
    Math,
    Number,
    Object,
    Promise,
    String
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    [
      declarations,
      ensureBlock,
      enforceBlock,
      flushBlock,
      scheduleBlock,
      enqueueBlock,
      'globalThis.__backgroundVideoMetaExports = {',
      '  ensureVideoMetaMapCache,',
      '  enforceVideoMetaMapCap,',
      '  flushVideoMetaMapUpdates,',
      '  enqueueVideoMetaMapUpdate,',
      '  setVideoMetaCache(value) { videoMetaMapCache = value; },',
      '  getState() {',
      '    return {',
      '      videoMetaMapCache,',
      '      videoMetaMapLoadPromise,',
      '      videoMetaMapFlushTimer,',
      '      pendingVideoMetaMapUpdates: Array.from(pendingVideoMetaMapUpdates.entries())',
      '    };',
      '  }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'background.js') }
  );

  return {
    ...context.__backgroundVideoMetaExports,
    storageGets,
    storageSets,
    timers
  };
}

function loadFilterLogicQueueRuntime({ nowMs = 1700000000000 } = {}) {
  const filterLogic = read('js/filter_logic.js');
  const queueBlock = sliceBetween(
    filterLogic,
    'const pendingVideoMetaUpdates = [];',
    '\n\n    // ============================================================================\n    // UTILITY FUNCTIONS'
  );
  const messages = [];
  const timers = [];
  let nextTimerId = 1;
  const context = {
    window: {
      postMessage(message, targetOrigin) {
        messages.push({ message: plain(message), targetOrigin });
      }
    },
    Date: class extends Date {
      static now() { return nowMs; }
    },
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay, fired: false });
      return id;
    },
    Array,
    Boolean,
    Map,
    Number,
    Object,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      queueBlock,
      'globalThis.__filterQueueExports = {',
      '  queueVideoMetaMapping,',
      '  getPending() { return pendingVideoMetaUpdates; },',
      '  getSeenSize() { return seenVideoMetaUpdates.size; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'filter_logic.js') }
  );
  return {
    ...context.__filterQueueExports,
    messages,
    timers,
    fireTimer(id) {
      const timer = timers.find((entry) => entry.id === id);
      assert.ok(timer, `missing timer ${id}`);
      timer.fired = true;
      timer.handler();
    }
  };
}

test('JSON-first video meta freshness eviction audit is audit-only and source pinned', () => {
  const text = doc();
  const sources = {
    'js/content_bridge.js': {
      lines: 13571,
      bytes: 601694,
      hash: '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3'
    },
    'js/background.js': {
      lines: 6313,
      bytes: 284710,
      hash: '46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb'
    },
    'js/filter_logic.js': {
      lines: 3498,
      bytes: 165151,
      hash: '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641'
    }
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, storage patch/);
  for (const [file, expected] of Object.entries(sources)) {
    const source = read(file);
    assert.equal(lineCount(source), expected.lines);
    assert.equal(Buffer.byteLength(source), expected.bytes);
    assert.equal(sha256(file), expected.hash);
    assert.match(text, new RegExp(expected.hash));
  }
  assert.match(text, /video-meta freshness\/eviction boundary source files: 3/);
});

test('video meta freshness eviction source counts remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const filterLogic = read('js/filter_logic.js');
  const slices = {
    persist: sliceBetween(bridge, 'function persistVideoMetaMapping(entries = []) {', '\n\nlet pendingVideoMetaDomRerunTimer'),
    schedule: sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nfunction processWatchMetaFetchQueue() {'),
    queue: sliceBetween(bridge, 'function processWatchMetaFetchQueue() {', '\n\nasync function fetchVideoMetaFromWatchUrl'),
    bgEnsure: sliceBetween(background, 'function ensureVideoMetaMapCache() {', '\n\nfunction enforceVideoChannelMapCap'),
    bgEnforce: sliceBetween(background, 'function enforceVideoMetaMapCap(map) {', '\n\nfunction flushVideoChannelMapUpdates'),
    bgFlush: sliceBetween(background, 'function flushVideoMetaMapUpdates() {', '\n\nfunction scheduleVideoChannelMapFlush'),
    bgEnqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**'),
    filterQueue: sliceBetween(filterLogic, 'function queueVideoMetaMapping(videoId, meta) {', '\n\n    // ============================================================================\n    // UTILITY FUNCTIONS'),
    filterRegister: sliceBetween(filterLogic, '        _registerVideoMetaMapping(videoId, meta) {', '\n\n        /**\n         * Given a normalized video renderer object'),
    filterPreprocess: sliceBetween(filterLogic, "            processed.videoMetaMap = (settings && typeof settings === 'object'", '\n\n            return processed;')
  };

  assert.equal(lineCount(slices.persist), 62);
  assert.equal(Buffer.byteLength(slices.persist), 2792);
  assert.equal(countLiteral(slices.persist, 'Date.now'), 0);
  assert.equal(countLiteral(slices.persist, 'fetchedAt'), 0);
  assert.equal(countLiteral(slices.persist, 'updatedAt'), 0);
  assert.equal(countLiteral(slices.persist, 'expiresAt'), 0);
  assert.equal(countLiteral(slices.persist, 'Object.keys'), 1);
  assert.equal(countLiteral(slices.persist, 'slice(0, EVICT_COUNT)'), 1);
  assert.equal(lineCount(slices.schedule), 76);
  assert.equal(Buffer.byteLength(slices.schedule), 2960);
  assert.equal(countLiteral(slices.schedule, 'Date.now'), 1);
  assert.equal(countLiteral(slices.schedule, 'lastWatchMetaFetchAttempt'), 5);
  assert.equal(countLiteral(slices.schedule, 'fetchedAt'), 0);
  assert.equal(countLiteral(slices.schedule, 'updatedAt'), 0);
  assert.equal(countLiteral(slices.schedule, 'expiresAt'), 0);
  assert.equal(lineCount(slices.queue), 17);
  assert.equal(Buffer.byteLength(slices.queue), 727);
  assert.equal(lineCount(slices.bgEnsure), 19);
  assert.equal(Buffer.byteLength(slices.bgEnsure), 685);
  assert.equal(countLiteral(slices.bgEnsure, 'fetchedAt'), 0);
  assert.equal(lineCount(slices.bgEnforce), 13);
  assert.equal(Buffer.byteLength(slices.bgEnforce), 376);
  assert.equal(countLiteral(slices.bgEnforce, 'Object.keys'), 1);
  assert.equal(countLiteral(slices.bgEnforce, 'slice(0, EVICT_COUNT)'), 1);
  assert.equal(lineCount(slices.bgFlush), 21);
  assert.equal(Buffer.byteLength(slices.bgFlush), 797);
  assert.equal(lineCount(slices.bgEnqueue), 41);
  assert.equal(Buffer.byteLength(slices.bgEnqueue), 1654);
  assert.equal(countLiteral(slices.bgEnqueue, 'fetchedAt'), 0);
  assert.equal(countLiteral(slices.bgEnqueue, 'updatedAt'), 0);
  assert.equal(countLiteral(slices.bgEnqueue, 'expiresAt'), 0);
  assert.equal(lineCount(slices.filterQueue), 57);
  assert.equal(Buffer.byteLength(slices.filterQueue), 2359);
  assert.equal(countLiteral(slices.filterQueue, 'Date.now'), 1);
  assert.equal(countLiteral(slices.filterQueue, 'seenVideoMetaUpdates'), 5);
  assert.equal(countLiteral(slices.filterQueue, 'fetchedAt'), 0);
  assert.equal(countLiteral(slices.filterQueue, 'updatedAt'), 0);
  assert.equal(countLiteral(slices.filterQueue, 'expiresAt'), 0);
  assert.equal(lineCount(slices.filterRegister), 28);
  assert.equal(Buffer.byteLength(slices.filterRegister), 1217);
  assert.equal(lineCount(slices.filterPreprocess), 3);
  assert.equal(Buffer.byteLength(slices.filterPreprocess), 252);

  for (const expected of [
    'content_bridge persistVideoMetaMapping Date.now callsites: 0',
    'content_bridge persistVideoMetaMapping Object.keys callsites: 1',
    'content_bridge scheduleVideoMetaFetch Date.now callsites: 1',
    'content_bridge scheduleVideoMetaFetch lastWatchMetaFetchAttempt tokens: 5',
    'background ensureVideoMetaMapCache block bytes: 685',
    'background enforceVideoMetaMapCap Object.keys callsites: 1',
    'background enforceVideoMetaMapCap eviction slice callsites: 1',
    'background enqueueVideoMetaMapUpdate fetchedAt tokens: 0',
    'filter_logic queueVideoMetaMapping seenVideoMetaUpdates tokens: 5',
    'filter_logic _registerVideoMetaMapping block bytes: 1217',
    'videoMetaMap cap maximum entries: 2000',
    'videoMetaMap cap eviction count: 500'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('content persistence strips freshness fields and evicts by first object keys', () => {
  const videoMetaMap = {};
  for (let index = 0; index < 2001; index++) {
    videoMetaMap[`OLDMETA${String(index).padStart(4, '0')}`] = {
      lengthSeconds: '10',
      uploadDate: '2001-01-01',
      category: 'Old',
      fetchedAt: 999999999999 - index
    };
  }
  const runtime = loadContentPersistenceRuntime({ videoMetaMap });

  runtime.persistVideoMetaMapping([{
    videoId: 'FRESHADD001',
    lengthSeconds: ' 101 ',
    publishDate: ' 2026-05-21 ',
    uploadDate: ' 2026-05-20 ',
    category: ' Education ',
    fetchedAt: 4102444800000,
    updatedAt: 4102444800000,
    expiresAt: 4102448400000,
    source: 'watch-html'
  }]);

  const map = runtime.getCurrentSettings().videoMetaMap;
  assert.equal(Object.keys(map).length, 1502);
  assert.equal(map.OLDMETA0000, undefined);
  assert.equal(map.OLDMETA0499, undefined);
  assert.deepEqual(plain(map.OLDMETA0500), {
    lengthSeconds: '10',
    uploadDate: '2001-01-01',
    category: 'Old',
    fetchedAt: 999999999499
  });
  assert.deepEqual(plain(map.FRESHADD001), {
    lengthSeconds: '101',
    publishDate: '2026-05-21',
    uploadDate: '2026-05-20',
    category: 'Education'
  });
  assert.deepEqual(runtime.sentMessages, [{
    action: 'updateVideoMetaMap',
    entries: [{
      videoId: 'FRESHADD001',
      lengthSeconds: '101',
      publishDate: '2026-05-21',
      uploadDate: '2026-05-20',
      category: 'Education'
    }]
  }]);
});

test('stale but parseable scheduler row suppresses metadata fetch without spending cooldown', () => {
  const runtime = loadSchedulerRuntime({
    initialSettings: {
      videoMetaMap: {
        STALEMETA01: {
          lengthSeconds: '42',
          uploadDate: '2009-01-01',
          category: 'Education',
          fetchedAt: 1,
          expiresAt: 2
        }
      }
    }
  });

  runtime.scheduleVideoMetaFetch('STALEMETA01', {
    needDuration: true,
    needDates: true,
    needCategory: true
  });

  assert.deepEqual(runtime.fetches, []);
  assert.equal(runtime.lastWatchMetaFetchAttempt.has('STALEMETA01'), false);
  assert.equal(runtime.pendingWatchMetaFetches.size, 0);
  assert.equal(runtime.queuedWatchMetaFetches.size, 0);
  assert.equal(runtime.watchMetaFetchQueue.length, 0);
  assert.equal(runtime.activeWatchMetaFetches, 0);
});

test('background load and flush retain legacy stale rows while cleaning new freshness fields', async () => {
  const oldRow = {
    lengthSeconds: '33',
    uploadDate: '2008-01-01',
    category: 'Old',
    fetchedAt: 1,
    expiresAt: 2,
    source: 'legacy-watch'
  };
  const storedMap = { OLDLOAD0001: oldRow };
  const runtime = loadBackgroundVideoMetaRuntime({ storageResult: { videoMetaMap: storedMap } });

  const loaded = await runtime.ensureVideoMetaMapCache();
  assert.notEqual(loaded, storedMap);
  assert.equal(loaded.OLDLOAD0001, oldRow);
  assert.deepEqual(plain(runtime.storageGets), [['videoMetaMap']]);

  runtime.enqueueVideoMetaMapUpdate('FRESHBG0001', {
    lengthSeconds: ' 77 ',
    publishDate: ' 2026-05-22 ',
    uploadDate: '',
    category: ' Science ',
    fetchedAt: 4102444800000,
    updatedAt: 4102444800000,
    expiresAt: 4102448400000
  });
  await runtime.flushVideoMetaMapUpdates();

  assert.equal(runtime.storageSets.length, 1);
  assert.deepEqual(runtime.storageSets[0].videoMetaMap.OLDLOAD0001, oldRow);
  assert.deepEqual(runtime.storageSets[0].videoMetaMap.FRESHBG0001, {
    lengthSeconds: '77',
    publishDate: '2026-05-22',
    uploadDate: '',
    category: 'Science'
  });
});

test('background cap evicts first object keys independent of fetchedAt recency', () => {
  const runtime = loadBackgroundVideoMetaRuntime();
  const map = {};
  for (let index = 0; index < 2001; index++) {
    map[`CAPMETA${String(index).padStart(4, '0')}`] = {
      category: 'Cap',
      fetchedAt: 999999999999 - index
    };
  }

  runtime.enforceVideoMetaMapCap(map);

  assert.equal(Object.keys(map).length, 1501);
  assert.equal(map.CAPMETA0000, undefined);
  assert.equal(map.CAPMETA0499, undefined);
  assert.deepEqual(map.CAPMETA0500, {
    category: 'Cap',
    fetchedAt: 999999999499
  });
  assert.deepEqual(map.CAPMETA2000, {
    category: 'Cap',
    fetchedAt: 999999997999
  });
});

test('filter logic queue dedupes freshness-only changes and posts no freshness fields', () => {
  const runtime = loadFilterLogicQueueRuntime();

  runtime.queueVideoMetaMapping('FRESHMETA01', {
    lengthSeconds: '77',
    publishDate: '',
    uploadDate: '2026-05-22',
    category: 'Gaming',
    fetchedAt: 1,
    expiresAt: 2
  });
  runtime.queueVideoMetaMapping('FRESHMETA01', {
    lengthSeconds: '77',
    publishDate: '',
    uploadDate: '2026-05-22',
    category: 'Gaming',
    fetchedAt: 4102444800000,
    expiresAt: 4102448400000
  });

  assert.equal(runtime.getSeenSize(), 1);
  assert.equal(runtime.getPending().length, 1);
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 75);

  runtime.fireTimer(runtime.timers[0].id);

  assert.deepEqual(runtime.messages, [{
    message: {
      type: 'FilterTube_UpdateVideoMetaMap',
      payload: [{
        videoId: 'FRESHMETA01',
        lengthSeconds: '77',
        publishDate: '',
        uploadDate: '2026-05-22',
        category: 'Gaming'
      }],
      source: 'filter_logic'
    },
    targetOrigin: '*'
  }]);
});

test('product runtime still lacks first-class video-meta freshness eviction authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaFreshnessEvictionContract',
    'jsonFirstVideoMetaFreshnessReport',
    'jsonFirstVideoMetaAgePolicy',
    'jsonFirstVideoMetaRowProvenanceReport',
    'jsonFirstVideoMetaFetchFreshnessGate',
    'jsonFirstVideoMetaEvictionPolicyReport',
    'jsonFirstVideoMetaAttemptCooldownReport',
    'jsonFirstVideoMetaStaleRowFixtureProvenance',
    'jsonFirstVideoMetaFreshnessMetricArtifact',
    'jsonFirstVideoMetaConsumerFreshnessDecision'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
