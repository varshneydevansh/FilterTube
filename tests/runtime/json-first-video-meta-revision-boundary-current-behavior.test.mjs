import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_REVISION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadBackgroundRevisionRuntime() {
  const background = read('js/background.js');
  const declarations = sliceBetween(
    background,
    'let compiledSettingsCache = { main: null, kids: null };',
    '\nlet autoBackupTimer = null;'
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
  const timers = [];
  let nextTimerId = 1;
  const context = {
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay });
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
      declarations,
      scheduleBlock,
      enqueueBlock,
      'globalThis.__backgroundRevisionExports = {',
      '  enqueueVideoMetaMapUpdate,',
      '  setVideoMetaCache(value) { videoMetaMapCache = value; },',
      '  setCompiledCaches(main, kids) { compiledSettingsCache.main = main; compiledSettingsCache.kids = kids; },',
      '  getState() {',
      '    return {',
      '      compiledSettingsCache,',
      '      videoMetaMapCache,',
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
    ...context.__backgroundRevisionExports,
    timers
  };
}

test('JSON-first video meta revision boundary audit is audit-only and source pinned', () => {
  const text = doc();
  const sources = {
    'js/content_bridge.js': {
      lines: 13562,
      bytes: 601080,
      hash: 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c'
    },
    'js/background.js': {
      lines: 6320,
      bytes: 285103,
      hash: '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'
    },
    'js/filter_logic.js': {
      lines: 3652,
      bytes: 172174,
      hash: '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'
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
  assert.match(text, /video-meta revision boundary source files: 3/);
});

test('video meta revision-boundary source counts remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const filterLogic = read('js/filter_logic.js');
  const slices = {
    persist: sliceBetween(bridge, 'function persistVideoMetaMapping(entries = []) {', '\n\nlet pendingVideoMetaDomRerunTimer'),
    updateMessage: sliceBetween(bridge, "} else if (type === 'FilterTube_UpdateVideoMetaMap') {", '\n        // Targeted refresh'),
    bgEnqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**'),
    bgReceiver: sliceBetween(background, '} else if (request.action === "updateVideoMetaMap") {', '\n    } else if (request.action === "recordTimeSaved")'),
    bgCompiler: sliceBetween(background, '// Pass through the video-channel map (videoId -> channelId for Shorts/playlist persistence).', '\n\n            // Kids profile keyword compilation'),
    queueVideoMeta: sliceBetween(filterLogic, 'function queueVideoMetaMapping(videoId, meta) {', '\n\n    // ============================================================================\n    // UTILITY FUNCTIONS'),
    preprocess: sliceBetween(filterLogic, "processed.videoMetaMap = (settings && typeof settings === 'object'", '\n\n            return processed;')
  };

  assert.equal(lineCount(slices.persist), 62);
  assert.equal(Buffer.byteLength(slices.persist), 2792);
  assert.equal(countLiteral(slices.persist, 'videoMetaMap'), 10);
  assert.equal(countLiteral(slices.persist, 'currentSettings'), 12);
  assert.equal(countLiteral(slices.persist, 'sendMessage'), 1);
  assert.equal(countLiteral(slices.persist, 'revision'), 0);
  assert.equal(lineCount(slices.updateMessage), 5);
  assert.equal(Buffer.byteLength(slices.updateMessage), 300);
  assert.equal(lineCount(slices.bgEnqueue), 41);
  assert.equal(Buffer.byteLength(slices.bgEnqueue), 1654);
  assert.equal(countLiteral(slices.bgEnqueue, 'videoMetaMap'), 11);
  assert.equal(countLiteral(slices.bgEnqueue, 'compiledSettingsCache'), 6);
  assert.equal(countLiteral(slices.bgEnqueue, 'revision'), 0);
  assert.equal(lineCount(slices.bgReceiver), 16);
  assert.equal(Buffer.byteLength(slices.bgReceiver), 596);
  assert.equal(lineCount(slices.bgCompiler), 15);
  assert.equal(Buffer.byteLength(slices.bgCompiler), 912);
  assert.equal(lineCount(slices.queueVideoMeta), 57);
  assert.equal(Buffer.byteLength(slices.queueVideoMeta), 2359);
  assert.equal(countLiteral(slices.queueVideoMeta, 'seenVideoMetaUpdates'), 5);
  assert.equal(countLiteral(slices.queueVideoMeta, 'pendingVideoMetaUpdates'), 4);
  assert.equal(countLiteral(slices.queueVideoMeta, 'postMessage'), 1);
  assert.equal(countLiteral(slices.queueVideoMeta, 'revision'), 0);
  assert.equal(lineCount(slices.preprocess), 3);
  assert.equal(Buffer.byteLength(slices.preprocess), 240);

  for (const expected of [
    'content_bridge persistVideoMetaMapping block lines: 62',
    'content_bridge persistVideoMetaMapping revision tokens: 0',
    'background enqueueVideoMetaMapUpdate block lines: 41',
    'background enqueueVideoMetaMapUpdate revision tokens: 0',
    'background compiler videoMetaMap pass-through block lines: 15',
    'filter_logic queueVideoMetaMapping block lines: 57',
    'filter_logic queueVideoMetaMapping revision tokens: 0',
    'filter_logic processed videoMetaMap pass-through lines: 3'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('content bridge persistence mutates disabled currentSettings and strips revision provenance fields', () => {
  const runtime = loadContentPersistenceRuntime({
    enabled: false,
    profileType: 'kids',
    settingsRevision: 'settings-old',
    videoMetaMap: {}
  });

  runtime.persistVideoMetaMapping([{
    videoId: 'REVISION001',
    lengthSeconds: ' 90 ',
    publishDate: ' 2026-01-02 ',
    uploadDate: ' 2026-01-01 ',
    category: ' Education ',
    profileType: 'main',
    settingsRevision: 'settings-new',
    sourceRoute: '/watch',
    reason: 'duration'
  }]);

  assert.deepEqual(plain(runtime.getCurrentSettings().videoMetaMap), {
    REVISION001: {
      lengthSeconds: '90',
      publishDate: '2026-01-02',
      uploadDate: '2026-01-01',
      category: 'Education'
    }
  });
  assert.deepEqual(runtime.sentMessages, [{
    action: 'updateVideoMetaMap',
    entries: [{
      videoId: 'REVISION001',
      lengthSeconds: '90',
      publishDate: '2026-01-02',
      uploadDate: '2026-01-01',
      category: 'Education'
    }]
  }]);
});

test('filter logic queue dedupes across revision-only changes and posts rows without row revision', () => {
  const runtime = loadFilterLogicQueueRuntime();

  runtime.queueVideoMetaMapping('REVISION002', {
    lengthSeconds: '120',
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education',
    settingsRevision: 'rev-a',
    profileType: 'main'
  });
  runtime.queueVideoMetaMapping('REVISION002', {
    lengthSeconds: '120',
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education',
    settingsRevision: 'rev-b',
    profileType: 'kids'
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
        videoId: 'REVISION002',
        lengthSeconds: '120',
        publishDate: '2026-01-02',
        uploadDate: '2026-01-01',
        category: 'Education'
      }],
      source: 'filter_logic'
    },
    targetOrigin: '*'
  }]);
});

test('background update patches both compiled caches with one unpartitioned metadata map', () => {
  const runtime = loadBackgroundRevisionRuntime();
  const mainCache = { profileType: 'main', videoMetaMap: { MAINONLY001: { category: 'Main' } } };
  const kidsCache = { profileType: 'kids', videoMetaMap: { KIDSONLY001: { category: 'Kids' } } };

  runtime.setVideoMetaCache({});
  runtime.setCompiledCaches(mainCache, kidsCache);
  runtime.enqueueVideoMetaMapUpdate('REVISION003', {
    lengthSeconds: 300,
    publishDate: '2026-01-03',
    uploadDate: '2026-01-02',
    category: 'Science',
    profileType: 'kids',
    settingsRevision: 'rev-c',
    route: '/results'
  });

  const state = runtime.getState();
  assert.deepEqual(plain(state.videoMetaMapCache), {
    REVISION003: {
      lengthSeconds: 300,
      publishDate: '2026-01-03',
      uploadDate: '2026-01-02',
      category: 'Science'
    }
  });
  assert.deepEqual(plain(state.pendingVideoMetaMapUpdates), [[
    'REVISION003',
    {
      lengthSeconds: 300,
      publishDate: '2026-01-03',
      uploadDate: '2026-01-02',
      category: 'Science'
    }
  ]]);
  assert.equal(state.compiledSettingsCache.main.videoMetaMap, state.videoMetaMapCache);
  assert.equal(state.compiledSettingsCache.kids.videoMetaMap, state.videoMetaMapCache);
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 75);
});

test('product runtime still lacks first-class video-meta revision boundary authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaRevisionBoundaryContract',
    'jsonFirstVideoMetaRevisionReport',
    'jsonFirstVideoMetaSettingsRevisionPolicy',
    'jsonFirstVideoMetaProfileScopePolicy',
    'jsonFirstVideoMetaSourceProvenanceReport',
    'jsonFirstVideoMetaMessageRevisionGate',
    'jsonFirstVideoMetaBackgroundRevisionGate',
    'jsonFirstVideoMetaConsumerRevisionDecision',
    'jsonFirstVideoMetaRevisionFixtureProvenance',
    'jsonFirstVideoMetaRevisionMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
