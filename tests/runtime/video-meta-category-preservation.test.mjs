import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
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
  vm.runInContext([
    persistBlock,
    'globalThis.exports = {',
    '  persistVideoMetaMapping,',
    '  getCurrentSettings() { return currentSettings; }',
    '};'
  ].join('\n'), context);
  return { ...context.exports, sentMessages };
}

function loadFilterRegisterRuntime(initialSettings = {}) {
  const filterLogic = read('js/filter_logic.js');
  const registerBlock = sliceBetween(
    filterLogic,
    '        _registerVideoMetaMapping(videoId, meta) {',
    '\n\n        /**\n         * Given a normalized video renderer object'
  );
  const queued = [];
  const context = {
    queueVideoMetaMapping(videoId, meta) {
      queued.push({ videoId, meta: plain(meta) });
    },
    settings: initialSettings,
    Array,
    Boolean,
    Number,
    Object,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    'const engine = {',
    '  settings,',
    registerBlock,
    '};',
    'globalThis.exports = {',
    '  register(videoId, meta) { return engine._registerVideoMetaMapping(videoId, meta); },',
    '  getSettings() { return engine.settings; }',
    '};'
  ].join('\n'), context);
  return { ...context.exports, queued };
}

function loadBackgroundRuntime(storageResult) {
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
  const storageSets = [];
  const context = {
    storageGet() {
      return Promise.resolve(storageResult);
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
    setTimeout() {
      return 1;
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
  vm.runInContext([
    declarations,
    ensureBlock,
    enforceBlock,
    flushBlock,
    scheduleBlock,
    enqueueBlock,
    'globalThis.exports = {',
    '  ensureVideoMetaMapCache,',
    '  enqueueVideoMetaMapUpdate,',
    '  flushVideoMetaMapUpdates,',
    '  getCache() { return videoMetaMapCache; }',
    '};'
  ].join('\n'), context);
  return { ...context.exports, storageSets };
}

const completeEducationRow = {
  lengthSeconds: '300',
  publishDate: '2026-01-03',
  uploadDate: '2026-01-01',
  category: 'Education'
};

test('content persistence merges a category-only update without erasing other metadata', () => {
  const runtime = loadContentPersistenceRuntime({
    videoMetaMap: { VIDEOID0001: { ...completeEducationRow } }
  });

  runtime.persistVideoMetaMapping([{ videoId: 'VIDEOID0001', category: ' Music ' }]);

  assert.deepEqual(plain(runtime.getCurrentSettings().videoMetaMap.VIDEOID0001), {
    ...completeEducationRow,
    category: 'Music'
  });
  assert.deepEqual(runtime.sentMessages[0].entries[0], {
    videoId: 'VIDEOID0001',
    ...completeEducationRow,
    category: 'Music'
  });
});

test('filter register treats category as metadata identity and queues the complete merged row', () => {
  const runtime = loadFilterRegisterRuntime({
    videoMetaMap: { VIDEOID0002: { ...completeEducationRow } }
  });

  runtime.register('VIDEOID0002', { ...completeEducationRow, category: 'Music' });
  runtime.register('VIDEOID0002', { lengthSeconds: '301' });

  assert.deepEqual(plain(runtime.getSettings().videoMetaMap.VIDEOID0002), {
    ...completeEducationRow,
    lengthSeconds: '301',
    category: 'Music'
  });
  assert.deepEqual(runtime.queued, [
    {
      videoId: 'VIDEOID0002',
      meta: { ...completeEducationRow, category: 'Music' }
    },
    {
      videoId: 'VIDEOID0002',
      meta: { ...completeEducationRow, lengthSeconds: '301', category: 'Music' }
    }
  ]);
});

test('filter register preserves a known category when a later player payload omits it', () => {
  const runtime = loadFilterRegisterRuntime({
    videoMetaMap: { VIDEOID0004: { ...completeEducationRow } }
  });

  runtime.register('VIDEOID0004', {
    lengthSeconds: '301',
    publishDate: '',
    uploadDate: '',
    category: ''
  });

  assert.deepEqual(plain(runtime.getSettings().videoMetaMap.VIDEOID0004), {
    ...completeEducationRow,
    lengthSeconds: '301'
  });
  assert.deepEqual(runtime.queued, [{
    videoId: 'VIDEOID0004',
    meta: {
      ...completeEducationRow,
      lengthSeconds: '301'
    }
  }]);
});

test('background category-only enqueue and flush preserve the loaded complete row', async () => {
  const runtime = loadBackgroundRuntime({
    videoMetaMap: { VIDEOID0003: { ...completeEducationRow } }
  });
  await runtime.ensureVideoMetaMapCache();

  runtime.enqueueVideoMetaMapUpdate('VIDEOID0003', { category: ' Music ' });
  await runtime.flushVideoMetaMapUpdates();

  const expected = { ...completeEducationRow, category: 'Music' };
  assert.deepEqual(plain(runtime.getCache().VIDEOID0003), expected);
  assert.deepEqual(runtime.storageSets, [{ videoMetaMap: { VIDEOID0003: expected } }]);
});

test('legacy single-video metadata messages forward category', () => {
  const background = read('js/background.js');
  const receiver = sliceBetween(
    background,
    '} else if (request.action === "updateVideoMetaMap") {',
    '\n    } else if (request.action === "recordTimeSaved")'
  );
  assert.match(receiver, /category: request\.category/);
});
