import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_PROFILE_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }
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
      'globalThis.__contentExports = {',
      '  persistVideoMetaMapping,',
      '  getCurrentSettings() { return currentSettings; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );
  return {
    ...context.__contentExports,
    sentMessages
  };
}

function loadSchedulerAdmissionRuntime({ nowMs = 1700000000000, hostname = 'www.youtubekids.com' } = {}) {
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
    currentSettings: { videoMetaMap: {} },
    location: { hostname },
    Date: makeFixedDate(nowMs),
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return new Promise(() => {});
    },
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
    parseInt
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
  return {
    ...context.__schedulerExports,
    fetches
  };
}

function loadWatchFetchRuntime({ hostname = 'www.youtubekids.com' } = {}) {
  const bridge = read('js/content_bridge.js');
  const fetchBlock = sliceBetween(
    bridge,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '\n\n// =========================================='
  );
  const fetchCalls = [];
  const context = {
    location: { hostname },
    fetch(url, options) {
      fetchCalls.push({ url, options });
      return Promise.resolve({ ok: true, text: () => Promise.resolve('') });
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
    fetchCalls
  };
}

function loadBackgroundProfileRuntime() {
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
      'globalThis.__backgroundExports = {',
      '  enqueueVideoMetaMapUpdate,',
      '  setVideoMetaCache(value) { videoMetaMapCache = value; },',
      '  setCompiledCaches(main, kids) { compiledSettingsCache.main = main; compiledSettingsCache.kids = kids; },',
      '  getState() { return { compiledSettingsCache, videoMetaMapCache, pendingVideoMetaMapUpdates: Array.from(pendingVideoMetaMapUpdates.entries()) }; }',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'background.js') }
  );
  return {
    ...context.__backgroundExports,
    timers
  };
}

function loadFilterLogicProfileRuntime(settings) {
  const source = read('js/filter_logic.js');
  const processedBlock = sliceBetween(
    source,
    "            processed.videoMetaMap = (settings && typeof settings === 'object' && settings.videoMetaMap && typeof settings.videoMetaMap === 'object' && !Array.isArray(settings.videoMetaMap))",
    '\n\n            return processed;'
  );
  const categoryBlock = sliceBetween(
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
      'function preprocess(settings) {',
      '  const processed = { ...settings };',
      processedBlock,
      '  return processed;',
      '}',
      'class Harness {',
      '  constructor(settings) { this.settings = preprocess(settings); }',
      categoryBlock,
      '}',
      'globalThis.__filterProfileExports = { preprocess, Harness };'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'filter_logic.js') }
  );
  return {
    processed: context.__filterProfileExports.preprocess(settings),
    instance: new context.__filterProfileExports.Harness(settings),
    fetches
  };
}

function loadDomCategoryRuntime({ settings, pathname = '/results' }) {
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

test('JSON-first video meta profile/surface boundary audit is audit-only and source pinned', () => {
  const text = doc();
  const sources = {
    'js/content_bridge.js': {
      lines: 13562,
      bytes: 601080,
      hash: 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c'
    },
    'js/background.js': {
      lines: 6641,
      bytes: 298986,
      hash: '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'
    },
    'js/filter_logic.js': {
      lines: 3652,
      bytes: 172174,
      hash: '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'
    },
    'js/content/dom_fallback.js': {
      lines: 5030,
      bytes: 235555,
      hash: 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5'
    }
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, profile patch/);
  for (const [file, expected] of Object.entries(sources)) {
    const source = read(file);
    assert.equal(lineCount(source), expected.lines);
    assert.equal(Buffer.byteLength(source), expected.bytes);
    assert.equal(sha256(file), expected.hash);
    assert.match(text, new RegExp(expected.hash));
  }
  assert.match(text, /video-meta profile\/surface boundary source files: 4/);
});

test('video meta profile/surface source counts remain pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const filterLogic = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const slices = {
    persist: sliceBetween(bridge, 'function persistVideoMetaMapping(entries = []) {', '\n\nlet pendingVideoMetaDomRerunTimer'),
    schedule: sliceBetween(bridge, 'function scheduleVideoMetaFetch(videoId, options = null) {', '\n\nfunction processWatchMetaFetchQueue() {'),
    fetch: sliceBetween(bridge, 'async function fetchVideoMetaFromWatchUrl(videoId) {', '\n\n// =========================================='),
    contentReceiver: sliceBetween(bridge, "} else if (type === 'FilterTube_UpdateVideoMetaMap') {", "} else if (type === 'FilterTube_UpdateCustomUrlMap')"),
    bgTarget: sliceBetween(background, 'async function getCompiledSettings(sender = null, profileType = null, forceRefresh = false) {', '\n\n    // Return cached settings if available'),
    bgReceiver: sliceBetween(background, '} else if (action === "getCompiledSettings") {', "\n    } else if (action === 'FilterTube_SessionPinAuth')"),
    bgCompiler: sliceBetween(background, '// Pass through the video-channel map (videoId -> channelId for Shorts/playlist persistence).', '\n\n            // Kids profile keyword compilation'),
    bgEnqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**'),
    filterProcessed: sliceBetween(filterLogic, "            processed.videoMetaMap = (settings && typeof settings === 'object' && settings.videoMetaMap && typeof settings.videoMetaMap === 'object' && !Array.isArray(settings.videoMetaMap))", '\n\n            return processed;'),
    filterRegister: sliceBetween(filterLogic, '        _registerVideoMetaMapping(videoId, meta) {', '\n\n        /**\n         * Given a normalized video renderer object'),
    filterCategory: sliceBetween(filterLogic, '        _checkCategoryFilters(item, rules, rendererType) {', '\n\n        /**\n         * Extract title'),
    filterDuration: sliceBetween(filterLogic, '            // Last resort: consult learned videoMetaMap (videoId -> lengthSeconds)', '\n\n            return null;'),
    filterPublished: sliceBetween(filterLogic, '            // Absolute timestamps from player microformat/videoDetails (publishDate/uploadDate)', '\n\n            return null;'),
    domCategory: sliceBetween(domFallback, '            let hideByCategory = false;', '\n            const alreadyProcessed = element.hasAttribute'),
    domUpload: sliceBetween(domFallback, 'let hideByUploadDate = false;', "\n            try {\n                const path = document.location?.pathname ||"),
    domDuration: sliceBetween(domFallback, '            let hideByDuration = false;', '\n\n            const skipKeywordFiltering')
  };

  assert.equal(lineCount(slices.persist), 62);
  assert.equal(Buffer.byteLength(slices.persist), 2792);
  assert.equal(countLiteral(slices.persist, 'videoMetaMap'), 10);
  assert.equal(countLiteral(slices.persist, 'currentSettings'), 12);
  assert.equal(countLiteral(slices.persist, 'profile'), 0);
  assert.equal(countLiteral(slices.persist, 'listMode'), 0);
  assert.equal(countLiteral(slices.persist, 'sendMessage'), 1);
  assert.equal(lineCount(slices.schedule), 76);
  assert.equal(Buffer.byteLength(slices.schedule), 2960);
  assert.equal(countLiteral(slices.schedule, 'currentSettings'), 1);
  assert.equal(countLiteral(slices.schedule, 'profile'), 0);
  assert.equal(countLiteral(slices.schedule, 'listMode'), 0);
  assert.equal(lineCount(slices.fetch), 98);
  assert.equal(Buffer.byteLength(slices.fetch), 3382);
  assert.equal(countLiteral(slices.fetch, 'hostname'), 1);
  assert.equal(countLiteral(slices.fetch, 'youtubekids.com'), 1);
  assert.equal(lineCount(slices.contentReceiver), 27);
  assert.equal(Buffer.byteLength(slices.contentReceiver), 1030);
  assert.equal(lineCount(slices.bgTarget), 3);
  assert.equal(Buffer.byteLength(slices.bgTarget), 246);
  assert.equal(countLiteral(slices.bgTarget, 'profileType'), 2);
  assert.equal(countLiteral(slices.bgTarget, 'isKidsUrl'), 1);
  assert.equal(lineCount(slices.bgReceiver), 24);
  assert.equal(Buffer.byteLength(slices.bgReceiver), 1469);
  assert.equal(countLiteral(slices.bgReceiver, 'profileType'), 7);
  assert.equal(countLiteral(slices.bgReceiver, 'compiledSettingsCache'), 3);
  assert.equal(lineCount(slices.bgCompiler), 15);
  assert.equal(Buffer.byteLength(slices.bgCompiler), 912);
  assert.equal(lineCount(slices.bgEnqueue), 41);
  assert.equal(Buffer.byteLength(slices.bgEnqueue), 1654);
  assert.equal(countLiteral(slices.bgEnqueue, 'compiledSettingsCache'), 6);
  assert.equal(lineCount(slices.filterProcessed), 3);
  assert.equal(Buffer.byteLength(slices.filterProcessed), 252);
  assert.equal(lineCount(slices.filterRegister), 28);
  assert.equal(Buffer.byteLength(slices.filterRegister), 1217);
  assert.equal(lineCount(slices.filterCategory), 57);
  assert.equal(Buffer.byteLength(slices.filterCategory), 2683);
  assert.equal(lineCount(slices.filterDuration), 7);
  assert.equal(Buffer.byteLength(slices.filterDuration), 464);
  assert.equal(lineCount(slices.filterPublished), 11);
  assert.equal(Buffer.byteLength(slices.filterPublished), 672);
  assert.equal(lineCount(slices.domCategory), 39);
  assert.equal(Buffer.byteLength(slices.domCategory), 2136);
  assert.equal(lineCount(slices.domUpload), 170);
  assert.equal(Buffer.byteLength(slices.domUpload), 9701);
  assert.equal(lineCount(slices.domDuration), 71);
  assert.equal(Buffer.byteLength(slices.domDuration), 4492);
  assert.equal(countLiteral(slices.domDuration, 'youtubekids.com'), 1);

  [
    'content_bridge persistVideoMetaMapping profile tokens: 0',
    'content_bridge scheduleVideoMetaFetch profile tokens: 0',
    'content_bridge fetchVideoMetaFromWatchUrl youtubekids tokens: 1',
    'background getCompiledSettings receiver profileType tokens: 7',
    'DOM fallback duration youtubekids tokens: 1',
    'runtime video-meta profile/surface fixtures: 5'
  ].forEach((needle) => assert.match(text, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
});

test('content-side video meta persistence accepts Kids whitelist settings without row profile fields', () => {
  const runtime = loadContentPersistenceRuntime({
    enabled: false,
    profileType: 'kids',
    listMode: 'whitelist',
    videoMetaMap: {}
  });

  runtime.persistVideoMetaMapping([
    {
      videoId: 'abcABC12345',
      lengthSeconds: 300,
      uploadDate: '2026-05-01',
      category: 'Music',
      profileType: 'main',
      surface: 'watch'
    }
  ]);

  const settings = runtime.getCurrentSettings();
  assert.equal(settings.profileType, 'kids');
  assert.equal(settings.listMode, 'whitelist');
  assert.deepEqual(plain(settings.videoMetaMap.abcABC12345), {
    lengthSeconds: 300,
    publishDate: '',
    uploadDate: '2026-05-01',
    category: 'Music'
  });
  assert.equal(runtime.sentMessages.length, 1);
  assert.deepEqual(runtime.sentMessages[0], {
    action: 'updateVideoMetaMap',
    entries: [
      {
        videoId: 'abcABC12345',
        lengthSeconds: 300,
        publishDate: '',
        uploadDate: '2026-05-01',
        category: 'Music'
      }
    ]
  });
});

test('Kids-host metadata scheduling is admitted before the watch-fetch host guard', async () => {
  const scheduler = loadSchedulerAdmissionRuntime({ hostname: 'www.youtubekids.com' });

  scheduler.scheduleVideoMetaFetch('abcABC12345', { needDuration: true, needDates: false, needCategory: false });

  assert.deepEqual(scheduler.fetches, ['abcABC12345']);
  assert.equal(scheduler.pendingWatchMetaFetches.size, 1);
  assert.equal(scheduler.lastWatchMetaFetchAttempt.has('abcABC12345'), true);

  const watchFetch = loadWatchFetchRuntime({ hostname: 'www.youtubekids.com' });
  const result = await watchFetch.fetchVideoMetaFromWatchUrl('abcABC12345');

  assert.equal(result, null);
  assert.deepEqual(watchFetch.fetchCalls, []);
});

test('background video meta updates patch main and kids caches with one unpartitioned map', () => {
  const runtime = loadBackgroundProfileRuntime();
  const sharedMap = {};
  const mainCache = { profileType: 'main', videoMetaMap: { mainOnly: { category: 'Education' } } };
  const kidsCache = { profileType: 'kids', videoMetaMap: { kidsOnly: { category: 'Cartoons' } } };

  runtime.setVideoMetaCache(sharedMap);
  runtime.setCompiledCaches(mainCache, kidsCache);
  runtime.enqueueVideoMetaMapUpdate('abcABC12345', { lengthSeconds: 240, category: 'Gaming', profileType: 'main' });

  const state = runtime.getState();
  assert.deepEqual(plain(state.videoMetaMapCache.abcABC12345), {
    lengthSeconds: 240,
    publishDate: '',
    uploadDate: '',
    category: 'Gaming'
  });
  assert.equal(state.compiledSettingsCache.main.videoMetaMap, state.videoMetaMapCache);
  assert.equal(state.compiledSettingsCache.kids.videoMetaMap, state.videoMetaMapCache);
  assert.equal(state.compiledSettingsCache.main.videoMetaMap, state.compiledSettingsCache.kids.videoMetaMap);
  assert.equal(state.pendingVideoMetaMapUpdates.length, 1);
});

test('filter logic consumes videoMetaMap without a profile-scoped metadata view', () => {
  const videoMetaMap = {
    abcABC12345: {
      category: 'Gaming',
      lengthSeconds: 300,
      uploadDate: '2026-05-01'
    }
  };
  const runtime = loadFilterLogicProfileRuntime({
    profileType: 'kids',
    listMode: 'whitelist',
    videoMetaMap,
    categoryFilters: {
      enabled: true,
      mode: 'allow',
      selected: ['education']
    }
  });

  assert.equal(runtime.processed.videoMetaMap, videoMetaMap);
  const shouldHide = runtime.instance._checkCategoryFilters(
    { videoId: 'abcABC12345' },
    { videoId: 'videoId' },
    'videoRenderer'
  );

  assert.equal(shouldHide, true);
  assert.deepEqual(runtime.fetches, []);
});

test('DOM fallback category consumer uses global metadata row under route-local logic', () => {
  const runtime = loadDomCategoryRuntime({
    pathname: '/results',
    settings: {
      profileType: 'kids',
      listMode: 'whitelist',
      categoryFilters: {
        enabled: true,
        mode: 'allow',
        selected: ['education']
      },
      videoMetaMap: {
        abcABC12345: { category: 'Gaming' }
      }
    }
  });

  const result = runtime.run();

  assert.deepEqual(result, {
    hideByCategory: true,
    pendingCategoryMeta: false
  });
  assert.deepEqual(runtime.fetches, []);
});

test('product runtime still lacks first-class video-meta profile/surface authority symbols', () => {
  const source = productRuntimeSource();
  const text = doc();
  const missing = [
    'jsonFirstVideoMetaProfileSurfaceContract',
    'jsonFirstVideoMetaProfileScopeReport',
    'jsonFirstVideoMetaSurfacePermissionReport',
    'jsonFirstVideoMetaKidsPolicy',
    'jsonFirstVideoMetaListModePolicy',
    'jsonFirstVideoMetaSettingsGate',
    'jsonFirstVideoMetaConsumerPermissionDecision',
    'jsonFirstVideoMetaFetchSurfaceBudget',
    'jsonFirstVideoMetaProfileFixtureProvenance',
    'jsonFirstVideoMetaProfileMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.match(text, new RegExp(symbol));
    assert.doesNotMatch(source, new RegExp(symbol));
  }
});
