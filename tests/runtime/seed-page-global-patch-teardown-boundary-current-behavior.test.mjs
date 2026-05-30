import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

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

function loadSeedPatchRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    fetch: [],
    processData: [],
    harvestOnly: [],
    jsonParse: [],
    jsonStringify: [],
    setTimeout: [],
    dispatchEvent: [],
    xhrAddEventListener: [],
    xhrRemoveEventListener: [],
    xhrOpen: [],
    xhrSend: []
  };

  class MockResponse {
    constructor(body, init = {}) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body);
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = init.headers || {};
      this.ok = this.status >= 200 && this.status < 300;
    }

    clone() {
      return new MockResponse(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers
      });
    }

    async json() {
      return JSON.parse(this._body);
    }
  }

  function MockXhr() {
    this.readyState = 0;
    this.status = options.xhrStatus || 200;
    this.responseType = options.xhrResponseType || '';
    this.responseText = JSON.stringify(options.xhrPayload || { title: 'needle xhr payload' });
    this._listeners = {};
  }
  MockXhr.prototype.open = function open(method, url) {
    calls.xhrOpen.push({ method, url });
    this._method = method;
    this._url = url;
  };
  MockXhr.prototype.send = function send() {
    calls.xhrSend.push({ url: this._url });
    this.readyState = 4;
    for (const type of ['readystatechange', 'load']) {
      for (const listener of this._listeners[type] || []) {
        listener.call(this);
      }
    }
  };
  MockXhr.prototype.addEventListener = function addEventListener(type, listener) {
    calls.xhrAddEventListener.push({ type, listener });
    if (!this._listeners[type]) this._listeners[type] = [];
    this._listeners[type].push(listener);
  };
  MockXhr.prototype.removeEventListener = function removeEventListener(type, listener) {
    calls.xhrRemoveEventListener.push({ type, listener });
    this._listeners[type] = (this._listeners[type] || []).filter((candidate) => candidate !== listener);
  };

  const originalFetch = function originalFetch(resource, init) {
    calls.fetch.push({ resource, init });
    return Promise.resolve(new MockResponse(options.fetchPayload || { ok: true }));
  };

  const originals = {
    fetch: originalFetch,
    open: MockXhr.prototype.open,
    send: MockXhr.prototype.send,
    addEventListener: MockXhr.prototype.addEventListener,
    removeEventListener: MockXhr.prototype.removeEventListener
  };

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        return data;
      },
      harvestOnly(data, activeSettings) {
        calls.harvestOnly.push({ settings: clone(activeSettings), data: clone(data) });
      }
    },
    fetch: originalFetch,
    XMLHttpRequest: MockXhr,
    postMessage() {},
    dispatchEvent(event) {
      calls.dispatchEvent.push(event?.type || '');
    }
  };

  const documentObject = {
    location: {
      hostname: options.hostname || 'www.youtube.com',
      pathname: options.pathname || '/watch',
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
    setTimeout(callback, delay) {
      calls.setTimeout.push({ delay });
      return calls.setTimeout.length;
    },
    clearTimeout() {}
  };
  context.globalThis = context;
  vm.createContext(context);

  function runSeed() {
    vm.runInContext(source, context, { filename: path.join(repoRoot, 'js', 'seed.js') });
  }

  runSeed();

  return {
    context,
    window: context.window,
    xhrPrototype: context.window.XMLHttpRequest.prototype,
    calls,
    originals,
    runSeed
  };
}

test('seed page-global patch teardown audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for seed page-global patch teardown authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');
  assert.ok(doc.includes('| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |'));
});

test('seed page-global patch source counts remain pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');
  const hooksBlock = sliceBetween(seed, '    function establishDataHooks() {', '    // ============================================================================\n    // FETCH/XHR INTERCEPTION');
  const fetchBlock = sliceBetween(seed, '    function setupFetchInterception() {', '    function setupXhrInterception() {');
  const xhrBlock = sliceBetween(seed, '    function setupXhrInterception() {', '    // ============================================================================\n    // SETTINGS MANAGEMENT');
  const interfaceBlock = sliceBetween(seed, '    // Create global FilterTube object for inter-script communication', '    // ============================================================================\n    // INITIALIZATION');
  const initBlock = sliceBetween(seed, '    // Establish data hooks immediately', "    seedDebugLog('🏁 Seed initialization complete - ready for content filtering');");

  assert.equal(lineCount(hooksBlock), 110);
  assert.equal(Buffer.byteLength(hooksBlock), 5772);
  assert.equal(lineCount(fetchBlock), 91);
  assert.equal(Buffer.byteLength(fetchBlock), 4430);
  assert.equal(lineCount(xhrBlock), 219);
  assert.equal(Buffer.byteLength(xhrBlock), 10322);
  assert.equal(lineCount(interfaceBlock), 25);
  assert.equal(Buffer.byteLength(interfaceBlock), 867);
  assert.equal(lineCount(initBlock), 20);
  assert.equal(Buffer.byteLength(initBlock), 564);

  for (const [literal, expected] of [
    ['Object.defineProperty', 4],
    ['Object.defineProperty(window', 2],
    ['Object.defineProperty(xhr', 2],
    ['window.fetch = function', 1],
    ['const originalFetch', 1],
    ['window.filterTubeSeedHasRun', 2],
    ['window.ftSeedInitialized', 2],
    ['window.__filtertubeXhrInterceptionInstalled', 2],
    ['const originalOpen', 1],
    ['const originalSend', 1],
    ['const originalAddEventListener', 1],
    ['const originalRemoveEventListener', 1],
    ['proto.open = function', 1],
    ['proto.send = function', 1],
    ['proto.addEventListener = function', 1],
    ['proto.removeEventListener = function', 1],
    ['clearTimeout', 0],
    ['teardown', 0],
    ['dispose', 0],
    ['delete window.filterTube', 0]
  ]) {
    assert.equal(countLiteral(seed, literal), expected, `seed ${literal} count changed`);
  }

  for (const phrase of [
    'seed page-global patch teardown source files: 1',
    'establishDataHooks block lines: 110',
    'setupFetchInterception block lines: 91',
    'setupXhrInterception block lines: 219',
    'seed global interface block lines: 25',
    'seed initialization block lines: 20',
    'runtime seed page-global patch teardown fixtures: 5'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('initial seed load installs fetch XHR initial-global accessors and readiness globals', () => {
  const runtime = loadSeedPatchRuntime();

  assert.equal(runtime.window.filterTubeSeedHasRun, true);
  assert.equal(runtime.window.ftSeedInitialized, true);
  assert.equal(runtime.window.__filtertubeXhrInterceptionInstalled, true);
  assert.equal(runtime.calls.dispatchEvent.filter((type) => type === 'filterTubeSeedReady').length, 1);
  assert.notEqual(runtime.window.fetch, runtime.originals.fetch);
  assert.notEqual(runtime.xhrPrototype.open, runtime.originals.open);
  assert.notEqual(runtime.xhrPrototype.send, runtime.originals.send);
  assert.notEqual(runtime.xhrPrototype.addEventListener, runtime.originals.addEventListener);
  assert.notEqual(runtime.xhrPrototype.removeEventListener, runtime.originals.removeEventListener);

  const ytInitialDataDesc = Object.getOwnPropertyDescriptor(runtime.window, 'ytInitialData');
  const playerDesc = Object.getOwnPropertyDescriptor(runtime.window, 'ytInitialPlayerResponse');
  assert.equal(ytInitialDataDesc.configurable, true);
  assert.equal(typeof ytInitialDataDesc.get, 'function');
  assert.equal(typeof ytInitialDataDesc.set, 'function');
  assert.equal(playerDesc.configurable, true);
  assert.equal(typeof playerDesc.get, 'function');
  assert.equal(typeof playerDesc.set, 'function');
  assert.equal(typeof runtime.window.filterTube.updateSettings, 'function');
});

test('ordinary duplicate seed load is guarded and does not replace patch functions again', () => {
  const runtime = loadSeedPatchRuntime();
  const firstFetch = runtime.window.fetch;
  const firstOpen = runtime.xhrPrototype.open;
  const firstSend = runtime.xhrPrototype.send;
  const firstAdd = runtime.xhrPrototype.addEventListener;
  const firstRemove = runtime.xhrPrototype.removeEventListener;

  runtime.runSeed();

  assert.equal(runtime.window.fetch, firstFetch);
  assert.equal(runtime.xhrPrototype.open, firstOpen);
  assert.equal(runtime.xhrPrototype.send, firstSend);
  assert.equal(runtime.xhrPrototype.addEventListener, firstAdd);
  assert.equal(runtime.xhrPrototype.removeEventListener, firstRemove);
  assert.equal(runtime.calls.dispatchEvent.filter((type) => type === 'filterTubeSeedReady').length, 1);
});

test('forced seed re-entry can rewrap fetch while XHR installed flag keeps prototype stable', () => {
  const runtime = loadSeedPatchRuntime();
  const firstFetch = runtime.window.fetch;
  const firstOpen = runtime.xhrPrototype.open;
  const firstSend = runtime.xhrPrototype.send;
  const firstAdd = runtime.xhrPrototype.addEventListener;
  const firstRemove = runtime.xhrPrototype.removeEventListener;

  runtime.window.filterTubeSeedHasRun = false;
  runtime.runSeed();

  assert.notEqual(runtime.window.fetch, firstFetch);
  assert.equal(runtime.xhrPrototype.open, firstOpen);
  assert.equal(runtime.xhrPrototype.send, firstSend);
  assert.equal(runtime.xhrPrototype.addEventListener, firstAdd);
  assert.equal(runtime.xhrPrototype.removeEventListener, firstRemove);
  assert.equal(runtime.window.__filtertubeXhrInterceptionInstalled, true);
  assert.equal(runtime.calls.dispatchEvent.filter((type) => type === 'filterTubeSeedReady').length, 2);
});

test('processed XHR receives per-instance response accessors without a removal owner', () => {
  const runtime = loadSeedPatchRuntime();
  runtime.window.filterTube.updateSettings(settings());

  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  xhr.send();

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/search');
  assert.equal(typeof Object.getOwnPropertyDescriptor(xhr, 'response')?.get, 'function');
  assert.equal(typeof Object.getOwnPropertyDescriptor(xhr, 'responseText')?.get, 'function');
  assert.match(xhr.responseText, /needle xhr payload/);
  assert.equal(typeof runtime.window.filterTube.restoreXhr, 'undefined');
  assert.equal(typeof runtime.window.filterTube.unpatchXhr, 'undefined');
});

test('seed global interface exposes no restore unpatch dispose destroy teardown or clear owner', () => {
  const runtime = loadSeedPatchRuntime();

  for (const key of [
    'restoreFetch',
    'restoreXhr',
    'unpatchFetch',
    'unpatchXhr',
    'dispose',
    'destroy',
    'teardown',
    'clear'
  ]) {
    assert.equal(Object.prototype.hasOwnProperty.call(runtime.window.filterTube, key), false, `${key} unexpectedly exposed`);
  }
});

test('product runtime still lacks seed page-global patch teardown authority symbols', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of [
    'seedPageGlobalPatchTeardownContract',
    'seedPageGlobalPatchOwnerReport',
    'seedFetchPatchIdempotenceReport',
    'seedXhrPatchIdempotenceReport',
    'seedInitialGlobalAccessorOwnerReport',
    'seedXhrResponseAccessorLifetimeReport',
    'seedPageGlobalPatchRestorePolicy',
    'seedPageGlobalPatchLifetimeJustification',
    'seedPageGlobalPatchFixtureProvenance',
    'seedPageGlobalPatchMetricArtifact'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(doc.includes(symbol), `${symbol} missing from audit doc`);
  }
});
