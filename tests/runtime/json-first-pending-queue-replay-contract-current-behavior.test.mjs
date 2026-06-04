import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [{ pattern: 'needle', flags: 'i' }],
    filterChannels: [],
    filterKeywordsComments: [],
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

function loadSeedQueueRuntime(options = {}) {
  const source = read('js/seed.js');
  const payload = options.payload ?? { title: 'needle queued body' };
  const timers = [];
  const calls = {
    fetch: [],
    responseJson: [],
    responseConstruct: [],
    processData: [],
    harvestOnly: [],
    jsonStringify: [],
    setTimeout: [],
    dispatchEvent: []
  };

  class MockRequest {
    constructor(url) {
      this.url = url;
    }
  }

  class MockResponse {
    constructor(body, init = {}) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body);
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = init.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
      this._source = init.source || 'constructed';
      calls.responseConstruct.push({ source: this._source, body: this._body, response: this });
    }

    clone() {
      return new MockResponse(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        source: 'clone'
      });
    }

    async json() {
      calls.responseJson.push({ source: this._source, body: this._body });
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }
  }

  function makeXhr() {}
  makeXhr.prototype.open = function open() {};
  makeXhr.prototype.send = function send() {};
  makeXhr.prototype.addEventListener = function addEventListener() {};
  makeXhr.prototype.removeEventListener = function removeEventListener() {};

  const engine = {
    processData(data, activeSettings, dataName) {
      calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
      if (options.processData) return options.processData(data, activeSettings, dataName);
      return { processedBy: dataName, original: data };
    },
    harvestOnly(data, activeSettings) {
      calls.harvestOnly.push({ settings: clone(activeSettings), data: clone(data) });
    }
  };

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: engine,
    fetch(resource, init) {
      calls.fetch.push({ resource, init });
      return Promise.resolve(new MockResponse(payload, {
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: options.headers || { 'content-type': 'application/json' },
        source: 'original'
      }));
    },
    XMLHttpRequest: makeXhr,
    postMessage() {},
    dispatchEvent(event) {
      calls.dispatchEvent.push(event?.type || '');
    }
  };

  const documentObject = {
    location: {
      hostname: 'www.youtube.com',
      pathname: options.pathname || '/watch',
      origin: 'https://www.youtube.com'
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
    Request: MockRequest,
    Response: MockResponse,
    XMLHttpRequest: makeXhr,
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
        return JSON.parse(text, reviver);
      },
      stringify(value, replacer, space) {
        calls.jsonStringify.push(value);
        return JSON.stringify(value, replacer, space);
      }
    },
    structuredClone: clone,
    setTimeout(callback, delay) {
      timers.push(callback);
      calls.setTimeout.push({ delay });
      return timers.length;
    },
    clearTimeout() {}
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(source, context, { filename: path.join(repoRoot, 'js', 'seed.js') });

  return {
    context,
    window: context.window,
    calls,
    engine,
    runNextTimer() {
      const callback = timers.shift();
      assert.equal(typeof callback, 'function', 'expected queued timer callback');
      callback();
    }
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first pending queue replay contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, queue patch, timer/);
  assert.match(text, /source files with pending queue replay surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first pending queue replay authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('pending queue replay source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const lines = seed.split(/\r?\n/);
  const replayBlock = sliceBetween(seed, 'function replayPendingQueueIfReady()', 'function scheduleReplay()');
  const scheduleBlock = sliceBetween(seed, 'function scheduleReplay()', '// Debug logging with sequence numbers');
  const processBlock = sliceBetween(seed, 'function processWithEngine(data, dataName)', 'function basicProcessing(data, dataName)');
  const updateBlock = sliceBetween(seed, 'function updateSettings(newSettings)', '// ============================================================================\n    // GLOBAL INTERFACE');
  const statsBlock = sliceBetween(seed, 'getStats: function() {', '// ============================================================================\n    // INITIALIZATION');

  const anchors = [
    ['let pendingDataQueue = [];', 38],
    ['let replayTimer = null;', 97],
    ['let replayAttempts = 0;', 98],
    ['function replayPendingQueueIfReady() {', 100],
    ['if (!cachedSettings) return;', 102],
    ['if (!Array.isArray(pendingDataQueue) || pendingDataQueue.length === 0) return;', 103],
    ['if (!hasEngine) {', 107],
    ['replayAttempts++;', 108],
    ['if (replayAttempts > 50) return;', 109],
    ['scheduleReplay();', 110],
    ['const queue = [...pendingDataQueue];', 116],
    ['pendingDataQueue = [];', 117],
    ['const sourceData = cloneData(item.data) || item.data;', 120],
    ['processWithEngine(sourceData, `${item.name}-replay`);', 121],
    ['function scheduleReplay() {', 129],
    ['if (replayTimer) return;', 130],
    ['replayTimer = setTimeout(() => {', 131],
    ['}, 250);', 134],
    ['const queueForLater = (reason) => {', 389],
    ['pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || \'\' });', 391],
    ['if (pendingDataQueue.length > 60) {', 392],
    ['pendingDataQueue = pendingDataQueue.slice(-40);', 393],
    ['scheduleReplay();', 395],
    ['if (!cachedSettings) {', 400],
    ["queueForLater('settings-missing');", 402],
    ['return data; // Return unmodified data', 403],
    ["queueForLater('harvestOnly-missing');", 429],
    ["queueForLater('engine-missing');", 482],
    ['if (pendingDataQueue.length > 0) {', 1021],
    ['const queue = [...pendingDataQueue];', 1039],
    ['pendingDataQueue = [];', 1025],
    ['const sourceData = cloneData(item.data) || item.data;', 1029],
    ['const processed = processWithEngine(sourceData, `${item.name}-queued`);', 1030],
    ["if (item.name.includes('ytInitialData')) {", 1033],
    ['window.ytInitialData = processed;', 1035],
    ["} else if (item.name.includes('ytInitialPlayerResponse')) {", 1039],
    ['window.ytInitialPlayerResponse = processed;', 1041],
    ['queuedItems: pendingDataQueue.length,', 1103]
  ];

  for (const [needle, expectedLine] of anchors) {
    assert.ok(lines[expectedLine - 1].includes(needle), `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.match(replayBlock, /if \(!cachedSettings\) return/);
  assert.match(replayBlock, /if \(!hasEngine\) \{[\s\S]*replayAttempts\+\+;[\s\S]*scheduleReplay\(\);/);
  assert.match(replayBlock, /processWithEngine\(sourceData, `\$\{item\.name\}-replay`\)/);
  assert.match(scheduleBlock, /setTimeout\(\(\) => \{[\s\S]*replayPendingQueueIfReady\(\);[\s\S]*\}, 250\)/);
  assert.match(processBlock, /if \(!cachedSettings\)[\s\S]{0,180}queueForLater\('settings-missing'\)/);
  assert.match(processBlock, /if \(pendingDataQueue\.length > 60\)[\s\S]{0,80}slice\(-40\)[\s\S]{0,80}scheduleReplay\(\)/);
  assert.match(updateBlock, /processWithEngine\(sourceData, `\$\{item\.name\}-queued`\)/);
  assert.match(updateBlock, /window\.ytInitialData = processed/);
  assert.match(updateBlock, /window\.ytInitialPlayerResponse = processed/);
  assert.match(statsBlock, /queuedItems: pendingDataQueue\.length/);

  assert.match(text, /direct processWithEngine no-settings queue cap sites: 1/);
  assert.match(text, /direct processWithEngine no-settings schedule sites: 1/);
  assert.match(text, /fetch\/XHR no-settings network queue sites: 0/);
  assert.match(text, /queueForLater cap threshold: 60/);
  assert.match(text, /queueForLater retained tail size: 40/);
  assert.match(text, /scheduled replay delay ms: 250/);
});

test('matching fetch before settings bypasses JSON parse and does not queue startup work', async () => {
  const runtime = loadSeedQueueRuntime({
    payload: { title: 'needle startup fetch' },
    processData(data, activeSettings, dataName) {
      return { processedBy: dataName, title: data.title };
    }
  });

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  const beforeSettingsBody = await response.json();

  assert.deepEqual(beforeSettingsBody, { title: 'needle startup fetch' });
  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.responseJson.filter((entry) => entry.source === 'clone').length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.setTimeout.length, 0);

  runtime.window.filterTube.updateSettings(settings());

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), []);
  assert.equal(runtime.window.filterTube.lastYtSearchResponse, undefined);
  assert.deepEqual(await response.json(), { title: 'needle startup fetch' });
});

test('repeated fetches before settings do not parse clone bodies or grow the pending queue', async () => {
  const runtime = loadSeedQueueRuntime({ payload: { title: 'needle repeated no settings' } });

  for (let i = 0; i < 65; i++) {
    await runtime.window.fetch(`https://www.youtube.com/youtubei/v1/search?prettyPrint=false&n=${i}`);
  }

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.responseJson.filter((entry) => entry.source === 'clone').length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.setTimeout.length, 0);
});

test('engine-missing queueForLater path caps queue and scheduled replay drains with replay suffix', async () => {
  const runtime = loadSeedQueueRuntime({ payload: { title: 'needle engine missing' } });
  runtime.window.filterTube.updateSettings(settings());
  runtime.window.FilterTubeEngine = null;

  for (let i = 0; i < 65; i++) {
    await runtime.window.fetch(`https://www.youtube.com/youtubei/v1/search?prettyPrint=false&engineMissing=${i}`);
  }

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 44);
  assert.equal(runtime.calls.setTimeout.length, 1);
  assert.equal(runtime.calls.setTimeout[0].delay, 250);
  assert.equal(runtime.calls.processData.length, 0);

  runtime.window.FilterTubeEngine = runtime.engine;
  runtime.runNextTimer();

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.processData.length, 44);
  assert.ok(runtime.calls.processData.every((call) => call.dataName === 'fetch:/youtubei/v1/search-replay'));
});

test('queued ytInitialData drains through updateSettings and assignment re-enters installed setter', () => {
  const runtime = loadSeedQueueRuntime({
    processData(data, activeSettings, dataName) {
      return { processedBy: dataName, original: data };
    }
  });

  runtime.window.ytInitialData = { title: 'needle initial global' };

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 1);
  assert.equal(runtime.calls.processData.length, 0);

  runtime.window.filterTube.updateSettings(settings());

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), [
    'ytInitialData-queued',
    'ytInitialData'
  ]);
  assert.equal(runtime.window.ytInitialData.processedBy, 'ytInitialData');
  assert.equal(runtime.window.ytInitialData.original.processedBy, 'ytInitialData-queued');
});

test('pending queue replay contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'pendingQueueState(1): pendingDataQueue',
    'replayState(2): replayTimer,replayAttempts',
    'replayReadinessGuards(4): noSettings,emptyQueue,noEngine,attemptLimit',
    'replayQueueMutationSites(2): copyPendingQueue,clearPendingQueue',
    'replayProcessingSuffixes(1): -replay',
    'scheduleReplayDelayMs(1): 250',
    'directProcessWithEngineNoSettingsQueuePushes(1): queueForLater(settings-missing)',
    'directProcessWithEngineNoSettingsQueueCapSites(1): queueForLater',
    'directProcessWithEngineNoSettingsScheduleSites(1): scheduleReplay',
    'fetchXhrNoSettingsQueueSites(0): bypassBeforeJsonParse',
    'queueForLaterPushes(1): queueForLater',
    'queueForLaterCapPolicy(2): threshold60,retainLast40',
    'queueForLaterScheduleSites(1): scheduleReplay',
    'queueForLaterReasons(3): settings-missing,harvestOnly-missing,engine-missing',
    'settingsDrainQueueMutationSites(2): copyPendingQueue,clearPendingQueue',
    'settingsDrainProcessingSuffixes(1): -queued',
    'settingsDrainGlobalAssignments(2): ytInitialData,ytInitialPlayerResponse',
    'queueStatsFields(1): queuedItems',
    'runtimeQueueFixtures(4): fetchNoSettingsBypass,repeatedFetchNoSettingsBypass,engineMissingCapAndTimer,globalSetterQueuedAssignment'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'queueOwner',
    'queueAdmissionReason',
    'transport',
    'dataName',
    'endpoint',
    'rawUrl',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevisionAtAdmission',
    'settingsRevisionAtReplay',
    'engineReadinessState',
    'activeRuleState',
    'queuedItemSize',
    'queuedItemAgeMs',
    'queueCapPolicy',
    'queueOverflowDecision',
    'timerDelayMs',
    'timerInstallAllowed',
    'timerTeardownPolicy',
    'replayAllowed',
    'replayWorkBudget',
    'responseAlreadyReturned',
    'responseEffectPolicy',
    'globalAssignmentAllowed',
    'setterReentryPolicy',
    'passThroughReason',
    'networkQueueFixture',
    'engineMissingFixture',
    'globalSetterFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstPendingQueueReplayContract',
    'jsonFirstPendingQueueAdmissionDecision',
    'jsonFirstPendingQueueCapPolicy',
    'jsonFirstPendingQueueReplayBudget',
    'jsonFirstPendingQueueResponseEffectReport',
    'jsonFirstPendingQueueSettingsRevision',
    'jsonFirstPendingQueueTimerPolicy',
    'jsonFirstPendingQueueGlobalAssignmentGuard',
    'jsonFirstPendingQueueFixtureProvenance',
    'jsonFirstPendingQueueMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
