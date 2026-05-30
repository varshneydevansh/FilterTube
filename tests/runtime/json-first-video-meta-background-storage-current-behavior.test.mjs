import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_BACKGROUND_STORAGE_CURRENT_BEHAVIOR_2026-05-22.md';

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
      '  scheduleVideoMetaMapFlush,',
      '  enqueueVideoMetaMapUpdate,',
      '  setVideoMetaCache(value) { videoMetaMapCache = value; },',
      '  setCompiledCaches(main, kids) { compiledSettingsCache.main = main; compiledSettingsCache.kids = kids; },',
      '  getState() {',
      '    return {',
      '      compiledSettingsCache,',
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
    context,
    storageGets,
    storageSets,
    timers,
    async fireTimer(id) {
      const timer = timers.find((entry) => entry.id === id);
      assert.ok(timer, `missing timer ${id}`);
      timer.fired = true;
      await timer.handler();
    }
  };
}

test('JSON-first video meta background storage audit is audit-only and source pinned', () => {
  const text = doc();
  const source = read('js/background.js');

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, storage patch/);
  assert.equal(lineCount(source), 6320);
  assert.equal(Buffer.byteLength(source), 285103);
  assert.equal(sha256('js/background.js'), '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad');
  assert.match(text, /77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad/);
  assert.match(text, /video-meta background storage source files: 1/);
});

test('background video meta source counts remain pinned', () => {
  const text = doc();
  const background = read('js/background.js');
  const slices = {
    declarations: sliceBetween(background, 'let compiledSettingsCache = { main: null, kids: null };', '\nlet autoBackupTimer = null;'),
    ensure: sliceBetween(background, 'function ensureVideoMetaMapCache() {', '\n\nfunction enforceVideoChannelMapCap'),
    enforce: sliceBetween(background, 'function enforceVideoMetaMapCap(map) {', '\n\nfunction flushVideoChannelMapUpdates'),
    flush: sliceBetween(background, 'function flushVideoMetaMapUpdates() {', '\n\nfunction scheduleVideoChannelMapFlush'),
    schedule: sliceBetween(background, 'function scheduleVideoMetaMapFlush() {', '\n\nfunction enqueueVideoChannelMapUpdate'),
    enqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**'),
    receiver: sliceBetween(background, '} else if (request.action === "updateVideoMetaMap") {', '\n    } else if (request.action === "recordTimeSaved")'),
    compiler: sliceBetween(background, '// Pass through the video-channel map (videoId -> channelId for Shorts/playlist persistence).', '\n\n            // Kids profile keyword compilation')
  };

  assert.equal(lineCount(slices.declarations), 19);
  assert.equal(Buffer.byteLength(slices.declarations), 655);
  assert.equal(lineCount(slices.ensure), 19);
  assert.equal(countLiteral(slices.ensure, 'videoMetaMap'), 15);
  assert.equal(countLiteral(slices.ensure, 'storageGet'), 1);
  assert.equal(lineCount(slices.enforce), 13);
  assert.equal(lineCount(slices.flush), 21);
  assert.equal(countLiteral(slices.flush, 'pendingVideoMetaMapUpdates'), 3);
  assert.equal(countLiteral(slices.flush, 'storage.local.set'), 1);
  assert.equal(lineCount(slices.schedule), 7);
  assert.equal(countLiteral(slices.schedule, 'setTimeout('), 1);
  assert.equal(lineCount(slices.enqueue), 41);
  assert.equal(countLiteral(slices.enqueue, 'videoMetaMap'), 11);
  assert.equal(countLiteral(slices.enqueue, 'compiledSettingsCache'), 6);
  assert.equal(lineCount(slices.receiver), 16);
  assert.equal(countLiteral(slices.receiver, 'enqueueVideoMetaMapUpdate'), 1);
  assert.equal(lineCount(slices.compiler), 15);
  assert.equal(countLiteral(background, 'videoMetaMap'), 40);
  assert.equal(countLiteral(background, 'pendingVideoMetaMapUpdates'), 5);
  assert.equal(countLiteral(background, 'videoMetaMapFlushTimer'), 4);
  assert.equal(countLiteral(background, 'updateVideoMetaMap'), 1);
  assert.equal(countLiteral(background, 'enqueueVideoMetaMapUpdate'), 2);
  assert.equal(countLiteral(background, 'compiledSettingsCache'), 39);

  for (const expected of [
    'background videoMetaMap declaration block lines: 19',
    'background videoMetaMap declaration block bytes: 655',
    'ensureVideoMetaMapCache block lines: 19',
    'ensureVideoMetaMapCache videoMetaMap token occurrences: 15',
    'enforceVideoMetaMapCap block lines: 13',
    'videoMetaMap cap maximum entries: 2000',
    'videoMetaMap cap eviction count: 500',
    'flushVideoMetaMapUpdates block lines: 21',
    'scheduleVideoMetaMapFlush block lines: 7',
    'background videoMetaMap flush debounce milliseconds: 75',
    'enqueueVideoMetaMapUpdate block lines: 41',
    'updateVideoMetaMap message branch lines: 16',
    'compiler videoMetaMap pass-through block lines: 15'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('ensureVideoMetaMapCache loads once caches a shallow copy and recovers from storage errors', async () => {
  const stored = { videoMetaMap: { OLDVIDEO001: { category: 'Old' } } };
  const runtime = loadBackgroundVideoMetaRuntime({ storageResult: stored });

  const first = await runtime.ensureVideoMetaMapCache();
  stored.videoMetaMap.NEW_AFTER_LOAD = { category: 'New' };
  const second = await runtime.ensureVideoMetaMapCache();

  assert.deepEqual(plain(first), { OLDVIDEO001: { category: 'Old' } });
  assert.equal(first, second);
  assert.equal(first.NEW_AFTER_LOAD, undefined);
  assert.deepEqual(plain(runtime.storageGets), [['videoMetaMap']]);

  const failing = loadBackgroundVideoMetaRuntime({ rejectStorage: true });
  const fallback = await failing.ensureVideoMetaMapCache();
  assert.deepEqual(plain(fallback), {});
  assert.deepEqual(plain(failing.storageGets), [['videoMetaMap']]);
});

test('enqueueVideoMetaMapUpdate cleans metadata patches loaded cache and schedules one flush timer', () => {
  const runtime = loadBackgroundVideoMetaRuntime();
  const loadedCache = { EXISTING0001: { category: 'Existing' } };
  const mainCompiled = { videoMetaMap: { stale: true } };
  const kidsCompiled = { videoMetaMap: { stale: true } };
  runtime.setVideoMetaCache(loadedCache);
  runtime.setCompiledCaches(mainCompiled, kidsCompiled);

  runtime.enqueueVideoMetaMapUpdate(' VIDMETA0004 ', {
    lengthSeconds: ' 90 ',
    publishDate: ' 2026-02-01 ',
    uploadDate: '',
    category: ' Music '
  });
  runtime.enqueueVideoMetaMapUpdate('EMPTYMETA04', {
    lengthSeconds: '',
    publishDate: '',
    uploadDate: '',
    category: ''
  });
  runtime.enqueueVideoMetaMapUpdate('VIDMETA0005', {
    lengthSeconds: 0,
    publishDate: '',
    uploadDate: '2026-02-02',
    category: ''
  });

  const state = runtime.getState();
  assert.deepEqual(plain(state.pendingVideoMetaMapUpdates), [
    ['VIDMETA0004', {
      lengthSeconds: '90',
      publishDate: '2026-02-01',
      uploadDate: '',
      category: 'Music'
    }],
    ['VIDMETA0005', {
      lengthSeconds: 0,
      publishDate: '',
      uploadDate: '2026-02-02',
      category: ''
    }]
  ]);
  assert.equal(state.videoMetaMapCache, loadedCache);
  assert.equal(state.compiledSettingsCache.main.videoMetaMap, loadedCache);
  assert.equal(state.compiledSettingsCache.kids.videoMetaMap, loadedCache);
  assert.equal(loadedCache.VIDMETA0004.category, 'Music');
  assert.equal(loadedCache.EMPTYMETA04, undefined);
  assert.deepEqual(runtime.timers.map((timer) => timer.delay), [75]);
});

test('flushVideoMetaMapUpdates merges pending updates enforces cap and writes storage', async () => {
  const manyEntries = {};
  for (let index = 0; index < 2001; index++) {
    manyEntries[`OLD${String(index).padStart(4, '0')}`] = { category: 'Old' };
  }
  const runtime = loadBackgroundVideoMetaRuntime({ storageResult: { videoMetaMap: manyEntries } });

  runtime.enqueueVideoMetaMapUpdate('VIDMETA0006', {
    lengthSeconds: '120',
    publishDate: '',
    uploadDate: '',
    category: 'Education'
  });
  await runtime.flushVideoMetaMapUpdates();

  const state = runtime.getState();
  assert.deepEqual(plain(state.pendingVideoMetaMapUpdates), []);
  assert.equal(runtime.storageSets.length, 1);
  const storedMap = runtime.storageSets[0].videoMetaMap;
  assert.equal(Object.keys(storedMap).length, 1502);
  assert.equal(storedMap.OLD0000, undefined);
  assert.equal(storedMap.OLD0499, undefined);
  assert.deepEqual(storedMap.VIDMETA0006, {
    lengthSeconds: '120',
    publishDate: '',
    uploadDate: '',
    category: 'Education'
  });
});

test('scheduleVideoMetaMapFlush creates one timer until the handler clears it', async () => {
  const runtime = loadBackgroundVideoMetaRuntime();

  runtime.scheduleVideoMetaMapFlush();
  runtime.scheduleVideoMetaMapFlush();

  assert.deepEqual(runtime.timers.map((timer) => timer.delay), [75]);
  assert.equal(runtime.getState().videoMetaMapFlushTimer, 1);

  await runtime.fireTimer(1);

  assert.equal(runtime.getState().videoMetaMapFlushTimer, null);
});

test('updateVideoMetaMap receiver preserves category only for array entries today', () => {
  const background = read('js/background.js');
  const receiver = sliceBetween(
    background,
    '} else if (request.action === "updateVideoMetaMap") {',
    '\n    } else if (request.action === "recordTimeSaved")'
  );

  assert.match(receiver, /const entries = Array\.isArray\(request\.entries\)/);
  assert.match(receiver, /videoId: request\.videoId/);
  assert.match(receiver, /lengthSeconds: request\.lengthSeconds/);
  assert.match(receiver, /publishDate: request\.publishDate/);
  assert.match(receiver, /uploadDate: request\.uploadDate/);
  assert.doesNotMatch(receiver, /category: request\.category/);
  assert.match(doc(), /legacy single-video request shape omits category/);
});

test('product runtime still lacks first-class video-meta background storage authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaBackgroundStorageContract',
    'jsonFirstVideoMetaBackgroundFlushReport',
    'jsonFirstVideoMetaCompiledCachePatchReport',
    'jsonFirstVideoMetaBackgroundMessageSchema',
    'jsonFirstVideoMetaBackgroundRevisionPolicy',
    'jsonFirstVideoMetaEvictionPolicyReport',
    'jsonFirstVideoMetaStorageErrorReport',
    'jsonFirstVideoMetaBackgroundFixtureProvenance',
    'jsonFirstVideoMetaBackgroundMetricArtifact',
    'jsonFirstVideoMetaBackgroundContentRerunParity'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
