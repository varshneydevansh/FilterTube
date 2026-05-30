import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function homeContinuationPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'home-xhr-1',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function searchPayload() {
  return {
    header: { searchHeaderRenderer: {} },
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{ videoRenderer: { videoId: 'search-xhr-1' } }]
      }
    }]
  };
}

function loadInstrumentedSeedRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    processData: [],
    harvestOnly: [],
    jsonParse: [],
    jsonStringify: []
  };

  class InstrumentedXHR {
    constructor() {
      this._listeners = new Map();
      this._originalHookCount = 0;
      this.readyState = 0;
      this.status = 200;
      this.responseType = '';
    }

    open() {}

    send() {}

    addEventListener(type, listener) {
      this._originalHookCount += 1;
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(listener);
    }

    removeEventListener(type, listener) {
      const list = this._listeners.get(type) || [];
      const index = list.indexOf(listener);
      if (index !== -1) list.splice(index, 1);
    }

    trigger(type) {
      for (const listener of [...(this._listeners.get(type) || [])]) {
        listener.call(this);
      }
    }

    listenerCount(type) {
      return (this._listeners.get(type) || []).length;
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
    fetch() {},
    XMLHttpRequest: InstrumentedXHR,
    postMessage() {},
    dispatchEvent() {}
  };

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
    Response: class Response {},
    XMLHttpRequest: InstrumentedXHR,
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

function readyXhr(runtime, {
  url = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
  payload = searchPayload(),
  responseType = '',
  status = 200
} = {}) {
  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', url);
  xhr.readyState = 4;
  xhr.status = status;
  xhr.responseType = responseType;
  if (responseType === 'json') {
    xhr.response = clone(payload);
  } else {
    xhr.responseText = JSON.stringify(payload);
  }
  xhr.send();
  return xhr;
}

test('seed XHR no-work/list-mode audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior changed for no-active-JSON-work XHRs/);
  assert.match(doc, /XHR pass-through addendum/);
  assert.match(doc, /not completion proof for all seed XHR no-work authority/);

  const source = read('js/seed.js');
  assert.equal(lineCount(source), 1136);
  assert.equal(Buffer.byteLength(source), 50026);
  assert.equal(sha256('js/seed.js'), 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');
  assert.ok(doc.includes('`js/seed.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('seed XHR no-work/list-mode source counts remain pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');

  const shouldSkipBlock = sliceBetween(seed, '    function shouldSkipEngineProcessing(data, dataName) {', '    function processWithEngine(data, dataName) {');
  const processWithEngineBlock = sliceBetween(seed, '    function processWithEngine(data, dataName) {', "    /**\n     * Basic fallback processing when the main engine isn't available");
  const xhrInterceptionBlock = sliceBetween(seed, '    function setupXhrInterception() {', '    // ============================================================================\n    // SETTINGS MANAGEMENT');
  const xhrEndpointListBlock = sliceBetween(seed, '            const xhrEndpoints = [', '            const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;');
  const xhrProcessorBlock = sliceBetween(xhrInterceptionBlock, '            const ensureXhrResponseProcessed = (xhr) => {', "            if (typeof originalAddEventListener === 'function') {");
  const xhrListenerWrapperBlock = sliceBetween(xhrInterceptionBlock, '            const listenerWrapperMap = new WeakMap();', '            const ensureXhrResponseProcessed = (xhr) => {');
  const xhrPrototypeListenerPatchBlock = sliceBetween(xhrInterceptionBlock, "            if (typeof originalAddEventListener === 'function') {", '            proto.open = function(method, url) {');
  const xhrOpenPatchBlock = sliceBetween(xhrInterceptionBlock, '            proto.open = function(method, url) {', '            proto.send = function() {');
  const xhrSendPatchBlock = sliceBetween(xhrInterceptionBlock, '            proto.send = function() {', '            seedDebugLog("✅ XHR interception established");');

  assert.equal(lineCount(shouldSkipBlock), 120);
  assert.equal(Buffer.byteLength(shouldSkipBlock), 5578);
  assert.equal(lineCount(processWithEngineBlock), 104);
  assert.equal(Buffer.byteLength(processWithEngineBlock), 4982);
  assert.equal(lineCount(xhrInterceptionBlock), 219);
  assert.equal(Buffer.byteLength(xhrInterceptionBlock), 10322);
  assert.equal(lineCount(xhrEndpointListBlock), 8);
  assert.equal(Buffer.byteLength(xhrEndpointListBlock), 242);
  assert.equal(lineCount(xhrProcessorBlock), 85);
  assert.equal(Buffer.byteLength(xhrProcessorBlock), 4441);
  assert.equal(lineCount(xhrListenerWrapperBlock), 25);
  assert.equal(Buffer.byteLength(xhrListenerWrapperBlock), 1010);
  assert.equal(lineCount(xhrPrototypeListenerPatchBlock), 26);
  assert.equal(Buffer.byteLength(xhrPrototypeListenerPatchBlock), 1378);
  assert.equal(lineCount(xhrOpenPatchBlock), 16);
  assert.equal(Buffer.byteLength(xhrOpenPatchBlock), 740);
  assert.equal(lineCount(xhrSendPatchBlock), 31);
  assert.equal(Buffer.byteLength(xhrSendPatchBlock), 1397);

  for (const [literal, expected] of [
    ['xhrEndpoints', 3],
    ['/youtubei/v1/search', 1],
    ['/youtubei/v1/guide', 1],
    ['/youtubei/v1/browse', 1],
    ['/youtubei/v1/next', 1],
    ['/youtubei/v1/player', 1],
    ['urlStr.includes(endpoint)', 2],
    ['originalAddEventListener', 7],
    ['originalRemoveEventListener', 4],
    ['getWrappedListener', 3],
    ['ensureXhrResponseProcessed', 3],
    ['__filtertube_shouldProcessXhr', 6],
    ['__filtertube_responseProcessed', 5],
    ['JSON.parse', 1],
    ['JSON.stringify', 1],
    ['processWithEngine', 1],
    ['Object.defineProperty', 2],
    ['readystatechange', 4],
    ['load', 4],
    ['shouldBypassYouTubeiNetworkResponse', 3]
  ]) {
    assert.equal(countLiteral(xhrInterceptionBlock, literal), expected, `XHR ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['if (!cachedSettings) return', 1],
    ['if (cachedSettings.enabled === false) return', 1],
    ["responseType === 'json'", 1],
    ["responseType === '' || responseType === 'text'", 1],
    ['JSON.parse', 1],
    ['processWithEngine', 1],
    ['JSON.stringify', 1],
    ['Object.defineProperty', 2],
    ['__filtertube_responseProcessed = true', 2],
    ['shouldBypassYouTubeiNetworkResponse', 1]
  ]) {
    assert.equal(countLiteral(xhrProcessorBlock, literal), expected, `XHR processor ${literal} count changed`);
  }

  for (const [blockName, block] of [['send', xhrSendPatchBlock], ['open', xhrOpenPatchBlock]]) {
    assert.equal(countLiteral(block, 'cachedSettings'), 0, `${blockName} should not read cachedSettings`);
    assert.equal(countLiteral(block, 'enabled === false'), 0, `${blockName} should not check enabled`);
    assert.equal(countLiteral(block, 'shouldBypassYouTubeiNetworkResponse'), 1, `${blockName} should check no-work bypass`);
  }

  for (const [literal, expected] of [
    ['cachedSettings.enabled === false', 1],
    ['shouldSkipEngineProcessing', 1],
    ['harvestOnly', 4],
    ['window.FilterTubeEngine.processData', 2],
    ['hasNetworkJsonWork', 1]
  ]) {
    assert.equal(countLiteral(processWithEngineBlock, literal), expected, `processWithEngine ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ["mode !== 'whitelist'", 2],
    ['hasEnabledContentFilters', 1],
    ['hasActiveJsonFilterRules', 1],
    ['activeContentFilters', 4],
    ['activeJsonFilterRules', 4],
    ['categoryFilters?.enabled === true', 0]
  ]) {
    assert.equal(countLiteral(shouldSkipBlock, literal), expected, `shouldSkip ${literal} count changed`);
  }

  for (const phrase of [
    'seed XHR no-work/list-mode boundary source files: 1',
    'shouldSkipEngineProcessing block lines: 120',
    'processWithEngine block lines: 104',
    'setupXhrInterception block lines: 219',
    'XHR endpoint list block lines: 8',
    'XHR processor block lines: 85',
    'XHR listener wrapper block lines: 25',
    'XHR prototype listener patch block lines: 26',
    'XHR open patch block lines: 16',
    'XHR send patch block lines: 31',
    'runtime seed XHR no-work/list-mode fixtures: 8'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('search empty blocklist XHR bypasses hook body work', () => {
  const runtime = loadInstrumentedSeedRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings());

  const xhr = readyXhr(runtime, {
    url: 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
    payload: searchPayload()
  });
  xhr.trigger('load');

  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
  assert.equal(xhr.listenerCount('readystatechange'), 0);
  assert.equal(xhr.listenerCount('load'), 0);
  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(xhr.__filtertube_responseProcessed, false);
  assert.equal(typeof xhr.responseText, 'string');
});

test('search whitelist mode XHR runs processData instead of harvest-only', () => {
  const runtime = loadInstrumentedSeedRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCwhitelistxhr00000000' }]
  }));

  const xhr = readyXhr(runtime, {
    url: 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
    payload: searchPayload()
  });
  xhr.trigger('readystatechange');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/search');
  assert.equal(runtime.calls.jsonParse.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
});

test('disabled and missing-settings XHRs do not mark hook or do body work', () => {
  const disabled = loadInstrumentedSeedRuntime({ pathname: '/' });
  disabled.window.filterTube.updateSettings(settings({ enabled: false }));

  const disabledXhr = readyXhr(disabled, {
    url: 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
    payload: homeContinuationPayload()
  });
  disabledXhr.trigger('load');

  assert.equal(disabledXhr.__filtertube_shouldProcessXhr, false);
  assert.equal(disabledXhr.listenerCount('readystatechange'), 0);
  assert.equal(disabledXhr.listenerCount('load'), 0);
  assert.equal(disabled.calls.jsonParse.length, 0);
  assert.equal(disabled.calls.jsonStringify.length, 0);
  assert.equal(disabled.calls.harvestOnly.length, 0);
  assert.equal(disabled.calls.processData.length, 0);
  assert.equal(disabledXhr.__filtertube_modifiedResponse, undefined);

  const missingSettings = loadInstrumentedSeedRuntime({ pathname: '/' });
  const missingSettingsXhr = readyXhr(missingSettings, {
    url: 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
    payload: homeContinuationPayload()
  });
  missingSettingsXhr.trigger('load');

  assert.equal(missingSettingsXhr.__filtertube_shouldProcessXhr, false);
  assert.equal(missingSettingsXhr.listenerCount('readystatechange'), 0);
  assert.equal(missingSettingsXhr.listenerCount('load'), 0);
  assert.equal(missingSettings.calls.jsonParse.length, 0);
  assert.equal(missingSettings.calls.jsonStringify.length, 0);
  assert.equal(missingSettings.calls.harvestOnly.length, 0);
  assert.equal(missingSettings.calls.processData.length, 0);
  assert.equal(missingSettingsXhr.__filtertube_modifiedResponse, undefined);
});

test('disabled page load listener is not wrapped when XHR body work is bypassed', () => {
  const runtime = loadInstrumentedSeedRuntime({ pathname: '/' });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));
  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  xhr.readyState = 4;
  xhr.status = 200;
  xhr.responseType = '';
  xhr.responseText = JSON.stringify(homeContinuationPayload());
  const observed = [];

  function onLoad() {
    observed.push(this.responseText);
  }

  xhr.addEventListener('load', onLoad);
  assert.equal(xhr.listenerCount('load'), 1);
  assert.equal(xhr._listeners.get('load')[0], onLoad);

  xhr.send();
  xhr.trigger('load');

  assert.equal(observed.length, 1);
  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(xhr.__filtertube_modifiedResponse, undefined);
});

test('desktop and mobile home empty-blocklist XHRs bypass body work', () => {
  const desktop = loadInstrumentedSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/'
  });
  desktop.window.filterTube.updateSettings(settings());

  const desktopXhr = readyXhr(desktop, {
    url: 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
    payload: homeContinuationPayload()
  });
  desktopXhr.trigger('load');

  assert.equal(desktop.calls.harvestOnly.length, 0);
  assert.equal(desktop.calls.processData.length, 0);
  assert.equal(desktop.calls.jsonParse.length, 0);
  assert.equal(desktop.calls.jsonStringify.length, 0);

  const mobile = loadInstrumentedSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/'
  });
  mobile.window.filterTube.updateSettings(settings());

  const mobileXhr = readyXhr(mobile, {
    url: 'https://m.youtube.com/youtubei/v1/browse?prettyPrint=false',
    payload: homeContinuationPayload()
  });
  mobileXhr.trigger('readystatechange');

  assert.equal(mobile.calls.harvestOnly.length, 0);
  assert.equal(mobile.calls.processData.length, 0);
  assert.equal(mobile.calls.jsonParse.length, 0);
  assert.equal(mobile.calls.jsonStringify.length, 0);
});

test('empty selected category does not make search XHR active JSON work', () => {
  const runtime = loadInstrumentedSeedRuntime({ pathname: '/results' });
  runtime.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));

  const xhr = readyXhr(runtime, {
    url: 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
    payload: searchPayload()
  });
  xhr.trigger('load');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('player next and guide empty-blocklist XHRs bypass body work', () => {
  for (const endpoint of ['/youtubei/v1/player', '/youtubei/v1/next', '/youtubei/v1/guide']) {
    const runtime = loadInstrumentedSeedRuntime({ pathname: '/watch' });
    runtime.window.filterTube.updateSettings(settings());

    const xhr = readyXhr(runtime, {
      url: `https://www.youtube.com${endpoint}?prettyPrint=false`,
      payload: { endpoint, title: { runs: [{ text: 'Endpoint card' }] } }
    });
    xhr.trigger('load');

    assert.equal(runtime.calls.harvestOnly.length, 0, `${endpoint} should not harvest only`);
    assert.equal(runtime.calls.processData.length, 0, `${endpoint} should bypass processData`);
    assert.equal(runtime.calls.jsonParse.length, 0);
    assert.equal(runtime.calls.jsonStringify.length, 0);
  }
});

test('product runtime still lacks first-class seed XHR no-work authority symbols', () => {
  const source = productRuntimeSource();

  for (const symbol of [
    'jsonFirstSeedXhrNoWorkListModeContract',
    'jsonFirstSeedXhrWorkDecisionReport',
    'jsonFirstSeedXhrHookBudget',
    'jsonFirstSeedXhrListenerWrapBudget',
    'jsonFirstSeedXhrBodyWorkBudget',
    'jsonFirstSeedXhrDisabledNoWorkPolicy',
    'jsonFirstSeedXhrMissingSettingsPolicy',
    'jsonFirstSeedXhrHarvestOnlyPolicy',
    'jsonFirstSeedXhrMobileHomePolicy',
    'jsonFirstSeedXhrEndpointFamilyPolicy',
    'jsonFirstSeedXhrNoWorkFixtureProvenance',
    'jsonFirstSeedXhrMetricArtifact'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(read(docPath).includes(symbol), `${symbol} missing from audit doc`);
  }
});
