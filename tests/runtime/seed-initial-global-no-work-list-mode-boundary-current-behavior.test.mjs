import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function searchPayload() {
  return {
    header: { searchHeaderRenderer: {} },
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{ videoRenderer: { videoId: 'initial-search-1' } }]
      }
    }]
  };
}

function homePayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'initial-home-1',
                title: { runs: [{ text: 'Home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function playerPayload() {
  return {
    videoDetails: {
      videoId: 'player-initial-1',
      title: 'Player metadata',
      channelId: 'UCplayerinitial000000'
    }
  };
}

function loadInitialGlobalRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    processData: [],
    harvestOnly: [],
    jsonParse: [],
    jsonStringify: [],
    dispatchEvent: []
  };

  function MockXhr() {}
  MockXhr.prototype.open = function open() {};
  MockXhr.prototype.send = function send() {};
  MockXhr.prototype.addEventListener = function addEventListener() {};
  MockXhr.prototype.removeEventListener = function removeEventListener() {};

  class MockResponse {
    constructor(body) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body);
      this.status = 200;
      this.statusText = 'OK';
      this.headers = {};
      this.ok = true;
    }

    clone() {
      return new MockResponse(this._body);
    }

    async json() {
      return JSON.parse(this._body);
    }
  }

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        if (options.processData) return options.processData(data, activeSettings, dataName);
        return data;
      },
      harvestOnly(data, activeSettings) {
        calls.harvestOnly.push({ settings: clone(activeSettings), data: clone(data) });
      }
    },
    fetch() {
      return Promise.resolve(new MockResponse({ ok: true }));
    },
    XMLHttpRequest: MockXhr,
    postMessage() {},
    dispatchEvent(event) {
      calls.dispatchEvent.push(event?.type || '');
    }
  };

  if (options.initialYtInitialData !== undefined) {
    windowObject.ytInitialData = options.initialYtInitialData;
  }
  if (options.initialYtInitialPlayerResponse !== undefined) {
    windowObject.ytInitialPlayerResponse = options.initialYtInitialPlayerResponse;
  }

  const documentObject = {
    location: {
      hostname: options.hostname || 'www.youtube.com',
      pathname: options.pathname || '/',
      origin: options.origin || 'https://www.youtube.com'
    },
    documentElement: {
      getAttribute() {
        return null;
      }
    }
  };

  const context = {
    window: windowObject,
    document: documentObject,
    console: {
      log() {},
      debug() {},
      warn() {},
      error() {}
    },
    browser: undefined,
    Request: class Request {},
    Response: MockResponse,
    XMLHttpRequest: MockXhr,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    URL,
    Date,
    Promise,
    WeakMap,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON: {
      parse(text, reviver) {
        calls.jsonParse.push(String(text));
        return JSON.parse(text, reviver);
      },
      stringify(value, replacer, space) {
        calls.jsonStringify.push(value);
        return JSON.stringify(value, replacer, space);
      }
    },
    structuredClone: clone,
    setTimeout() {
      return 0;
    },
    clearTimeout() {}
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: path.join(repoRoot, 'js', 'seed.js') });

  return { context, window: context.window, calls };
}

test('seed initial global no-work/list-mode audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior register for optimized seed global no-work gating/);
  assert.match(doc, /Runtime behavior changed by the no-work optimization/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for seed initial global no-work authority/);

  const source = read('js/seed.js');
  assert.equal(lineCount(source), 1136);
  assert.equal(Buffer.byteLength(source), 50026);
  assert.equal(sha256('js/seed.js'), 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');
  assert.ok(doc.includes('`js/seed.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('seed initial global no-work/list-mode source counts remain pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');

  const dataHooksBlock = sliceBetween(seed, '    function establishDataHooks() {', '    // ============================================================================\n    // FETCH/XHR INTERCEPTION');
  const ytDataBlock = sliceBetween(seed, '        // Hook ytInitialData', '        // Hook ytInitialPlayerResponse');
  const ytPlayerBlock = sliceBetween(seed, '        // Hook ytInitialPlayerResponse', '        dataHooksEstablished = true;');
  const updateBlock = sliceBetween(seed, '    function updateSettings(newSettings) {', '    // ============================================================================\n    // GLOBAL INTERFACE');
  const processWithEngineBlock = sliceBetween(seed, '    function processWithEngine(data, dataName) {', "    /**\n     * Basic fallback processing when the main engine isn't available");
  const shouldSkipBlock = sliceBetween(seed, '    function shouldSkipEngineProcessing(data, dataName) {', '    function processWithEngine(data, dataName) {');
  const replayBlock = sliceBetween(seed, '    function replayPendingQueueIfReady() {', '    function scheduleReplay() {');
  const cloneBlock = sliceBetween(seed, '    function cloneData(data) {', '    function shouldSkipEngineProcessing(data, dataName) {');

  assert.equal(lineCount(dataHooksBlock), 110);
  assert.equal(Buffer.byteLength(dataHooksBlock), 5772);
  assert.equal(lineCount(ytDataBlock), 49);
  assert.equal(Buffer.byteLength(ytDataBlock), 2576);
  assert.equal(lineCount(ytPlayerBlock), 49);
  assert.equal(Buffer.byteLength(ytPlayerBlock), 2841);
  assert.equal(lineCount(updateBlock), 98);
  assert.equal(Buffer.byteLength(updateBlock), 4640);
  assert.equal(lineCount(processWithEngineBlock), 104);
  assert.equal(Buffer.byteLength(processWithEngineBlock), 4982);
  assert.equal(lineCount(shouldSkipBlock), 120);
  assert.equal(Buffer.byteLength(shouldSkipBlock), 5578);
  assert.equal(lineCount(replayBlock), 29);
  assert.equal(Buffer.byteLength(replayBlock), 993);
  assert.equal(lineCount(cloneBlock), 83);
  assert.equal(Buffer.byteLength(cloneBlock), 2729);

  for (const [literal, expected] of [
    ['originalYtInitialData', 7],
    ['originalYtInitialPlayerResponse', 7],
    ['Object.defineProperty', 2],
    ['processWithEngine', 4],
    ['JSON.stringify', 0],
    ['getDebugPayloadSize', 2],
    ['cloneData', 8],
    ['shouldCaptureRawSnapshot', 4]
  ]) {
    assert.equal(countLiteral(dataHooksBlock, literal), expected, `data hooks ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['processWithEngine', 2],
    ['JSON.stringify', 0],
    ['getDebugPayloadSize', 1],
    ['originalYtInitialData = processed', 1],
    ['window.ytInitialData = processed', 1],
    ['shouldCaptureRawSnapshot', 2],
    ['cloneData', 4]
  ]) {
    assert.equal(countLiteral(ytDataBlock, literal), expected, `ytInitialData ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['processWithEngine', 2],
    ['JSON.stringify', 0],
    ['getDebugPayloadSize', 1],
    ['originalYtInitialPlayerResponse = processed', 1],
    ['window.ytInitialPlayerResponse = processed', 1],
    ['shouldCaptureRawSnapshot', 2],
    ['cloneData', 4]
  ]) {
    assert.equal(countLiteral(ytPlayerBlock, literal), expected, `ytInitialPlayerResponse ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['pendingDataQueue', 5],
    ['processWithEngine', 3],
    ['window.ytInitialData = processed', 1],
    ['window.ytInitialPlayerResponse = processed', 1],
    ['ytInitialData-reprocess', 1],
    ['ytInitialPlayerResponse-reprocess', 1],
    ['settingsRevision', 0],
    ['dirtyKeys', 0],
    ['hasNetworkJsonWork', 1],
    ['rawYtInitialData = null', 2]
  ]) {
    assert.equal(countLiteral(updateBlock, literal), expected, `updateSettings ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['cachedSettings.enabled === false', 1],
    ['shouldSkipEngineProcessing', 1],
    ['harvestOnly', 4],
    ['window.FilterTubeEngine.processData', 2],
    ['hasNetworkJsonWork', 1],
    ['queueForLater', 4]
  ]) {
    assert.equal(countLiteral(processWithEngineBlock, literal), expected, `processWithEngine ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ["dataName === 'ytInitialData'", 1],
    ["dataName.startsWith('fetch:/youtubei/v1/browse')", 2],
    ["dataName.startsWith('fetch:/youtubei/v1/next')", 1],
    ["dataName.startsWith('fetch:/youtubei/v1/search')", 1],
    ["mode !== 'whitelist'", 2],
    ['isBrowseFetch', 2]
  ]) {
    assert.equal(countLiteral(shouldSkipBlock, literal), expected, `shouldSkip ${literal} count changed`);
  }

  for (const phrase of [
    'seed initial global no-work/list-mode boundary source files: 1',
    'establishDataHooks block lines: 110',
    'ytInitialData hook block lines: 49',
    'ytInitialPlayerResponse hook block lines: 49',
    'updateSettings block lines: 98',
    'processWithEngine block lines: 104',
    'shouldSkipEngineProcessing block lines: 120',
    'replayPendingQueueIfReady block lines: 29',
    'cloneData/no-work predicate block lines: 83',
    'runtime seed initial global no-work/list-mode fixtures: 10'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('search empty blocklist ytInitialData setter bypasses debug and engine work', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings());

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
});

test('search whitelist ytInitialData setter runs processData', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCinitialwhitelist0000' }]
  }));

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'ytInitialData');
});

test('boolean content-filter ytInitialData setter runs processData', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: { duration: { enabled: true } }
  }));

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'ytInitialData');
});

test('malformed truthy content-filter ytInitialData setter remains no-work', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: { duration: { enabled: 'true' } }
  }));

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
});

test('disabled ytInitialData setter skips debug size and engine work', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
});

test('missing-settings ytInitialData queues then empty settings clear without replay', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/results' });

  runtime.window.ytInitialData = searchPayload();

  assert.equal(runtime.window.filterTube.getStats().settingsLoaded, false);
  assert.equal(runtime.window.filterTube.getStats().queuedItems, 1);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);

  runtime.window.filterTube.updateSettings(settings());

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('home ytInitialData empty blocklist bypasses engine work', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/' });
  runtime.window.filterTube.updateSettings(settings());

  runtime.window.ytInitialData = homePayload();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
});

test('ytInitialPlayerResponse empty blocklist bypasses engine work', () => {
  const runtime = loadInitialGlobalRuntime({ pathname: '/watch' });
  runtime.window.filterTube.updateSettings(settings());

  runtime.window.ytInitialPlayerResponse = playerPayload();

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.getStats().lastPlayerData, true);
});

test('existing ytInitialData before settings queues and empty settings clear without replay', () => {
  const runtime = loadInitialGlobalRuntime({
    pathname: '/results',
    initialYtInitialData: searchPayload()
  });

  assert.equal(runtime.window.filterTube.getStats().settingsLoaded, false);
  assert.equal(runtime.window.filterTube.getStats().queuedItems, 1);
  assert.equal(runtime.window.filterTube.getStats().lastYtData, true);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);

  runtime.window.filterTube.updateSettings(settings());

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('product runtime still lacks first-class seed initial global no-work authority symbols', () => {
  const source = productRuntimeSource();

  for (const symbol of [
    'jsonFirstSeedInitialGlobalNoWorkListModeContract',
    'jsonFirstSeedInitialGlobalWorkDecisionReport',
    'jsonFirstSeedInitialGlobalDebugSizeBudget',
    'jsonFirstSeedInitialGlobalQueueReplayPolicy',
    'jsonFirstSeedInitialGlobalRawSnapshotPolicy',
    'jsonFirstSeedInitialGlobalSetterAssignmentGuard',
    'jsonFirstSeedInitialGlobalHomePolicy',
    'jsonFirstSeedInitialPlayerResponsePolicy',
    'jsonFirstSeedInitialGlobalFixtureProvenance',
    'jsonFirstSeedInitialGlobalMetricArtifact'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(read(docPath).includes(symbol), `${symbol} missing from audit doc`);
  }
});
