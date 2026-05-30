import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_MERGE_SCHEMA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadBackgroundVideoMetaRuntime({ storageResult = { videoMetaMap: {} } } = {}) {
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
    storageGet(keys) {
      storageGets.push(keys);
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
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay });
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
      '  flushVideoMetaMapUpdates,',
      '  enqueueVideoMetaMapUpdate,',
      '  setVideoMetaCache(value) { videoMetaMapCache = value; },',
      '  getState() {',
      '    return {',
      '      videoMetaMapCache,',
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
  vm.runInContext(
    [
      'const engine = {',
      '  settings,',
      registerBlock,
      '};',
      'globalThis.__filterRegisterExports = {',
      '  register(videoId, meta) { return engine._registerVideoMetaMapping(videoId, meta); },',
      '  getSettings() { return engine.settings; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'filter_logic.js') }
  );
  return {
    ...context.__filterRegisterExports,
    queued
  };
}

test('JSON-first video meta merge schema audit is audit-only and source pinned', () => {
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
  assert.match(text, /not an implementation patch, optimization patch, metadata schema patch/);
  for (const [file, expected] of Object.entries(sources)) {
    const source = read(file);
    assert.equal(lineCount(source), expected.lines);
    assert.equal(Buffer.byteLength(source), expected.bytes);
    assert.equal(sha256(file), expected.hash);
    assert.match(text, new RegExp(expected.hash));
  }
  assert.match(text, /video-meta merge\/schema boundary source files: 3/);
});

test('video meta merge schema source counts remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const filterLogic = read('js/filter_logic.js');
  const slices = {
    persist: sliceBetween(bridge, 'function persistVideoMetaMapping(entries = []) {', '\n\nlet pendingVideoMetaDomRerunTimer'),
    updateBranch: sliceBetween(bridge, "} else if (type === 'FilterTube_UpdateVideoMetaMap') {", "\n    } else if (type === 'FilterTube_UpdateCustomUrlMap')"),
    bgReceiver: sliceBetween(background, '} else if (request.action === "updateVideoMetaMap") {', '\n    } else if (request.action === "recordTimeSaved")'),
    bgEnqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**'),
    bgFlush: sliceBetween(background, 'function flushVideoMetaMapUpdates() {', '\n\nfunction scheduleVideoChannelMapFlush'),
    bgCompiler: sliceBetween(background, '// Pass through the video-channel map (videoId -> channelId for Shorts/playlist persistence).', '\n\n            // Kids profile keyword compilation'),
    filterQueue: sliceBetween(filterLogic, 'function queueVideoMetaMapping(videoId, meta) {', '\n\n    // ============================================================================\n    // UTILITY FUNCTIONS'),
    filterRegister: sliceBetween(filterLogic, '        _registerVideoMetaMapping(videoId, meta) {', '\n\n        /**\n         * Given a normalized video renderer object'),
    filterHarvest: sliceBetween(filterLogic, '            if (videoId) {', '\n\n            const playlistContents =')
  };

  assert.equal(lineCount(slices.persist), 62);
  assert.equal(Buffer.byteLength(slices.persist), 2792);
  assert.equal(countLiteral(slices.persist, 'delete'), 2);
  assert.equal(countLiteral(slices.persist, '...'), 1);
  assert.equal(countLiteral(slices.persist, 'lengthSeconds'), 11);
  assert.equal(countLiteral(slices.persist, 'category'), 8);
  assert.equal(lineCount(slices.updateBranch), 26);
  assert.equal(Buffer.byteLength(slices.updateBranch), 1025);
  assert.equal(countLiteral(slices.updateBranch, 'persistVideoMetaMapping'), 1);
  assert.equal(countLiteral(slices.updateBranch, 'touchDomForVideoMetaUpdate'), 2);
  assert.equal(countLiteral(slices.updateBranch, 'scheduleVideoMetaDomRerun'), 1);
  assert.equal(lineCount(slices.bgReceiver), 16);
  assert.equal(Buffer.byteLength(slices.bgReceiver), 596);
  assert.equal(countLiteral(slices.bgReceiver, 'entries'), 4);
  assert.equal(countLiteral(slices.bgReceiver, 'category'), 0);
  assert.equal(countLiteral(slices.bgReceiver, 'request.category'), 0);
  assert.equal(lineCount(slices.bgEnqueue), 41);
  assert.equal(Buffer.byteLength(slices.bgEnqueue), 1654);
  assert.equal(countLiteral(slices.bgEnqueue, 'delete'), 1);
  assert.equal(countLiteral(slices.bgEnqueue, '...'), 0);
  assert.equal(countLiteral(slices.bgEnqueue, 'clean'), 7);
  assert.equal(countLiteral(slices.bgEnqueue, 'category'), 6);
  assert.equal(lineCount(slices.bgFlush), 21);
  assert.equal(Buffer.byteLength(slices.bgFlush), 797);
  assert.equal(lineCount(slices.bgCompiler), 15);
  assert.equal(Buffer.byteLength(slices.bgCompiler), 912);
  assert.equal(lineCount(slices.filterQueue), 57);
  assert.equal(Buffer.byteLength(slices.filterQueue), 2359);
  assert.equal(countLiteral(slices.filterQueue, 'category'), 7);
  assert.equal(lineCount(slices.filterRegister), 28);
  assert.equal(Buffer.byteLength(slices.filterRegister), 1217);
  assert.equal(countLiteral(slices.filterRegister, '...'), 2);
  assert.equal(countLiteral(slices.filterRegister, 'same'), 2);
  assert.equal(countLiteral(slices.filterRegister, 'category'), 0);
  assert.equal(lineCount(slices.filterHarvest), 16);
  assert.equal(Buffer.byteLength(slices.filterHarvest), 952);
  assert.equal(countLiteral(slices.filterHarvest, 'category'), 5);

  for (const expected of [
    'content_bridge persistVideoMetaMapping delete token occurrences: 2',
    'content_bridge FilterTube_UpdateVideoMetaMap branch lines: 26',
    'background updateVideoMetaMap receiver category tokens: 0',
    'background enqueueVideoMetaMapUpdate spread token occurrences: 0',
    'filter_logic _registerVideoMetaMapping category tokens: 0',
    'filter_logic player video-meta harvest block bytes: 952'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('content persistence category-only row replaces a complete row with partial clean metadata', () => {
  const runtime = loadContentPersistenceRuntime({
    videoMetaMap: {
      MERGESC0001: {
        lengthSeconds: '300',
        publishDate: '2026-01-03',
        uploadDate: '2026-01-01',
        category: 'Education'
      }
    }
  });

  runtime.persistVideoMetaMapping([{
    videoId: 'MERGESC0001',
    category: ' Music '
  }]);

  assert.deepEqual(plain(runtime.getCurrentSettings().videoMetaMap), {
    MERGESC0001: {
      lengthSeconds: null,
      publishDate: '',
      uploadDate: '',
      category: 'Music'
    }
  });
  assert.deepEqual(runtime.sentMessages, [{
    action: 'updateVideoMetaMap',
    entries: [{
      videoId: 'MERGESC0001',
      lengthSeconds: null,
      publishDate: '',
      uploadDate: '',
      category: 'Music'
    }]
  }]);
});

test('background category-only enqueue replaces loaded cache row and flushes partial clean metadata', async () => {
  const stored = {
    videoMetaMap: {
      MERGESC0002: {
        lengthSeconds: '240',
        publishDate: '2026-02-03',
        uploadDate: '2026-02-01',
        category: 'Education'
      }
    }
  };
  const runtime = loadBackgroundVideoMetaRuntime({ storageResult: stored });
  await runtime.ensureVideoMetaMapCache();

  runtime.enqueueVideoMetaMapUpdate('MERGESC0002', {
    category: ' Music '
  });

  assert.deepEqual(plain(runtime.getState().videoMetaMapCache), {
    MERGESC0002: {
      lengthSeconds: null,
      publishDate: '',
      uploadDate: '',
      category: 'Music'
    }
  });
  assert.deepEqual(plain(runtime.getState().pendingVideoMetaMapUpdates), [[
    'MERGESC0002',
    {
      lengthSeconds: null,
      publishDate: '',
      uploadDate: '',
      category: 'Music'
    }
  ]]);

  await runtime.flushVideoMetaMapUpdates();
  assert.deepEqual(runtime.storageSets, [{
    videoMetaMap: {
      MERGESC0002: {
        lengthSeconds: null,
        publishDate: '',
        uploadDate: '',
        category: 'Music'
      }
    }
  }]);
});

test('filter register ignores category-only changes when duration and dates are unchanged', () => {
  const runtime = loadFilterRegisterRuntime({
    videoMetaMap: {
      MERGESC0003: {
        lengthSeconds: '90',
        publishDate: '2026-03-03',
        uploadDate: '2026-03-01',
        category: 'Education'
      }
    }
  });

  runtime.register('MERGESC0003', {
    lengthSeconds: '90',
    publishDate: '2026-03-03',
    uploadDate: '2026-03-01',
    category: 'Music'
  });

  assert.deepEqual(plain(runtime.getSettings().videoMetaMap), {
    MERGESC0003: {
      lengthSeconds: '90',
      publishDate: '2026-03-03',
      uploadDate: '2026-03-01',
      category: 'Education'
    }
  });
  assert.deepEqual(runtime.queued, []);
});

test('filter register merges partial row locally but queues only the partial metadata outward', () => {
  const runtime = loadFilterRegisterRuntime({
    videoMetaMap: {
      MERGESC0004: {
        lengthSeconds: '90',
        publishDate: '2026-04-03',
        uploadDate: '2026-04-01',
        category: 'Education'
      }
    }
  });

  runtime.register('MERGESC0004', {
    lengthSeconds: '91'
  });

  assert.deepEqual(plain(runtime.getSettings().videoMetaMap), {
    MERGESC0004: {
      lengthSeconds: '91',
      publishDate: '2026-04-03',
      uploadDate: '2026-04-01',
      category: 'Education'
    }
  });
  assert.deepEqual(runtime.queued, [{
    videoId: 'MERGESC0004',
    meta: {
      lengthSeconds: '91'
    }
  }]);
});

test('background legacy single-video update shape still omits category forwarding', () => {
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
  assert.match(doc(), /legacy single-video message shape still omits category/);
});

test('product runtime still lacks first-class video-meta merge schema authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaMergeSchemaContract',
    'jsonFirstVideoMetaRowCompletenessReport',
    'jsonFirstVideoMetaPartialUpdatePolicy',
    'jsonFirstVideoMetaCategoryMergeDecision',
    'jsonFirstVideoMetaFieldLossReport',
    'jsonFirstVideoMetaLegacyMessageSchema',
    'jsonFirstVideoMetaStorageMergeReport',
    'jsonFirstVideoMetaConsumerSchemaDecision',
    'jsonFirstVideoMetaMergeFixtureProvenance',
    'jsonFirstVideoMetaMergeMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
