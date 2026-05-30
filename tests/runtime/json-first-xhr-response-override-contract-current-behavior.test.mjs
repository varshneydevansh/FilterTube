import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

const endpoints = [
  '/youtubei/v1/search',
  '/youtubei/v1/guide',
  '/youtubei/v1/browse',
  '/youtubei/v1/next',
  '/youtubei/v1/player'
];

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

function lineOf(source, needle) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.notEqual(index, -1, `missing source needle ${needle}`);
  return index + 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadInstrumentedSeedRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    processData: [],
    jsonParse: [],
    jsonStringify: []
  };
  class InstrumentedXHR {
    constructor() {
      this._listeners = new Map();
      this.readyState = 0;
      this.status = 200;
      this.responseType = '';
    }

    open() {}

    send() {}

    addEventListener(type, listener) {
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
  }
  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        if (options.processData) return options.processData(data, activeSettings, dataName);
        return { ...data, rewrittenByTest: true };
      },
      harvestOnly() {}
    },
    fetch() {},
    XMLHttpRequest: InstrumentedXHR,
    postMessage() {},
    dispatchEvent() {}
  };
  const documentObject = {
    location: {
      hostname: 'www.youtube.com',
      pathname: options.pathname || '/',
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

function openReadyXhr(runtime, { responseType = '', responseText, response, status = 200, settingsOverride } = {}) {
  if (settingsOverride !== null) {
    runtime.window.filterTube.updateSettings(settings(settingsOverride || {}));
  }
  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  xhr.readyState = 4;
  xhr.status = status;
  xhr.responseType = responseType;
  if (responseText !== undefined) xhr.responseText = responseText;
  if (response !== undefined) xhr.response = response;
  xhr.send();
  return xhr;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first XHR response override contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior changed for no-work gating/);
  assert.match(text, /not an implementation patch, optimization patch, XHR patch/);
  assert.match(text, /source files with XHR response override surface: 1/);
  assert.match(text, /runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work XHRs now bypass mark, hooks, parse, stringify, and override work/);
  assert.match(text, /not completion proof for JSON-first XHR response override authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('XHR response override source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  const processor = sliceBetween(xhrSetup, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');

  const anchors = [
    ['const getWrappedListener = (xhr, type, listener) => {', 790],
    ["if ((type === 'readystatechange' || type === 'load') && xhr?.__filtertube_shouldProcessXhr) {", 802],
    ['ensureXhrResponseProcessed(xhr);', 803],
    ['const ensureXhrResponseProcessed = (xhr) => {', 813],
    ['if (!xhr || xhr.__filtertube_responseProcessed) return;', 815],
    ['if (!xhr.__filtertube_shouldProcessXhr) return;', 816],
    ['if (xhr.readyState !== 4) return;', 817],
    ['if (!cachedSettings) return;', 818],
    ['if (cachedSettings.enabled === false) return;', 819],
    ['if (status && status >= 400) return;', 822],
    ["const responseType = xhr.responseType || '';", 831],
    ["if (responseType === 'json') {", 834],
    ["} else if (responseType === '' || responseType === 'text') {", 837],
    ['const text = xhr.responseText;', 838],
    ["if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return;", 841],
    ['jsonData = JSON.parse(trimmed);', 843],
    ['const processed = processWithEngine(jsonData, dataName);', 851],
    ["if (!processed || typeof processed !== 'object') return;", 852],
    ['xhr.__filtertube_modifiedResponse = processed;', 854],
    ['xhr.__filtertube_modifiedResponseText = JSON.stringify(processed);', 855],
    ['if (!xhr.__filtertube_responseInterceptorsInstalled) {', 857],
    ['xhr.__filtertube_responseInterceptorsInstalled = true;', 858],
    ["const protoResponseDesc = Object.getOwnPropertyDescriptor(proto, 'response');", 860],
    ["const protoResponseTextDesc = Object.getOwnPropertyDescriptor(proto, 'responseText');", 861],
    ["Object.defineProperty(xhr, 'response',", 863],
    ['if (this.__filtertube_modifiedResponse !== undefined) {', 866],
    ["if (rt === 'json') return this.__filtertube_modifiedResponse;", 868],
    ["if (rt === '' || rt === 'text') return this.__filtertube_modifiedResponseText;", 869],
    ['return this.__filtertube_modifiedResponse;', 870],
    ['return protoResponseDesc && typeof protoResponseDesc.get === \'function\'', 872],
    ["Object.defineProperty(xhr, 'responseText',", 878],
    ['if (this.__filtertube_modifiedResponseText !== undefined) {', 881],
    ['return this.__filtertube_modifiedResponseText;', 882],
    ['return protoResponseTextDesc && typeof protoResponseTextDesc.get === \'function\'', 884],
    ['xhr.__filtertube_responseProcessed = true;', 893],
    ["originalAddEventListener.call(this, 'readystatechange', processIfReady);", 961],
    ["originalAddEventListener.call(this, 'load', processIfReady);", 962]
  ];

  for (const [needle, expectedLine] of anchors) {
    assert.ok(seed.split(/\r?\n/)[expectedLine - 1].includes(needle), `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.deepEqual(
    [...xhrSetup.matchAll(/'\/youtubei\/v1\/(?:search|guide|browse|next|player)'/g)].map((match) => match[0].slice(1, -1)),
    endpoints
  );
  assert.match(processor, /if \(!cachedSettings\) return/);
  assert.match(processor, /if \(cachedSettings\.enabled === false\) return/);
  assert.match(processor, /JSON\.parse\(trimmed\)/);
  assert.match(processor, /JSON\.stringify\(processed\)/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'response'/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'responseText'/);

  assert.match(text, /XHR mark sites before body guards: 2, now gated by no-work bypass/);
  assert.match(text, /send-time ready\/load hook installs: 2/);
  assert.match(text, /listener wrapper hook sites: 2/);
  assert.match(text, /pre-parse guard branches: 7/);
  assert.match(text, /response body parse modes: 2/);
  assert.match(text, /modified response backing fields: 2/);
  assert.match(text, /per-instance response getter override sites: 2/);
  assert.match(text, /response getter return branches after mutation: 3/);
});

test('text-like XHR response override returns string response and responseText after mutation', () => {
  const runtime = loadInstrumentedSeedRuntime({
    processData(data, activeSettings, dataName) {
      return { changed: true, dataName, original: data };
    }
  });
  const xhr = openReadyXhr(runtime, {
    responseType: '',
    responseText: '{"title":"needle text body"}'
  });

  xhr.trigger('load');

  assert.equal(runtime.calls.jsonParse.length, 1);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/search');
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(xhr.__filtertube_responseProcessed, true);
  assert.equal(xhr.__filtertube_responseInterceptorsInstalled, true);
  assert.deepEqual(xhr.__filtertube_modifiedResponse, {
    changed: true,
    dataName: 'xhr:/youtubei/v1/search',
    original: { title: 'needle text body' }
  });
  assert.equal(xhr.response, xhr.__filtertube_modifiedResponseText);
  assert.equal(xhr.responseText, xhr.__filtertube_modifiedResponseText);
  assert.deepEqual(JSON.parse(xhr.responseText), xhr.__filtertube_modifiedResponse);
});

test('json XHR response override returns object response and string responseText after mutation', () => {
  const runtime = loadInstrumentedSeedRuntime({
    processData(data, activeSettings, dataName) {
      return { changed: true, dataName, nested: data.nested };
    }
  });
  const xhr = openReadyXhr(runtime, {
    responseType: 'json',
    response: { nested: { title: 'needle json body' } }
  });

  xhr.trigger('readystatechange');

  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/search');
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(xhr.__filtertube_responseProcessed, true);
  assert.deepEqual(xhr.response, {
    changed: true,
    dataName: 'xhr:/youtubei/v1/search',
    nested: { title: 'needle json body' }
  });
  assert.equal(xhr.responseText, xhr.__filtertube_modifiedResponseText);
  assert.deepEqual(JSON.parse(xhr.responseText), xhr.response);
});

test('no-work XHR bypass avoids marks hooks and response overrides before late body guards', () => {
  const noSettings = loadInstrumentedSeedRuntime();
  const noSettingsXhr = openReadyXhr(noSettings, {
    responseText: '{"title":"needle"}',
    settingsOverride: null
  });
  noSettingsXhr.trigger('load');
  assert.equal(noSettingsXhr.__filtertube_shouldProcessXhr, false);
  assert.equal(noSettings.calls.processData.length, 0);
  assert.equal(noSettings.calls.jsonParse.length, 0);
  assert.equal(noSettingsXhr.__filtertube_modifiedResponse, undefined);
  assert.equal(noSettingsXhr.__filtertube_responseProcessed, false);
  assert.equal(noSettingsXhr._listeners.get('load')?.length || 0, 0);

  const disabled = loadInstrumentedSeedRuntime();
  const disabledXhr = openReadyXhr(disabled, {
    responseText: '{"title":"needle"}',
    settingsOverride: { enabled: false }
  });
  disabledXhr.trigger('load');
  assert.equal(disabledXhr.__filtertube_shouldProcessXhr, false);
  assert.equal(disabled.calls.processData.length, 0);
  assert.equal(disabled.calls.jsonParse.length, 0);
  assert.equal(disabledXhr.__filtertube_modifiedResponse, undefined);
  assert.equal(disabledXhr._listeners.get('load')?.length || 0, 0);

  const errorStatus = loadInstrumentedSeedRuntime();
  const errorXhr = openReadyXhr(errorStatus, {
    responseText: '{"title":"needle"}',
    status: 500
  });
  errorXhr.trigger('load');
  assert.equal(errorXhr.__filtertube_shouldProcessXhr, true);
  assert.equal(errorStatus.calls.processData.length, 0);
  assert.equal(errorXhr.__filtertube_modifiedResponse, undefined);

  const invalidJson = loadInstrumentedSeedRuntime();
  const invalidXhr = openReadyXhr(invalidJson, {
    responseText: '{"title":'
  });
  invalidXhr.trigger('load');
  assert.equal(invalidJson.calls.jsonParse.length, 1);
  assert.equal(invalidJson.calls.processData.length, 0);
  assert.equal(invalidXhr.__filtertube_modifiedResponse, undefined);

  const unsupported = loadInstrumentedSeedRuntime();
  const unsupportedXhr = openReadyXhr(unsupported, {
    responseType: 'arraybuffer',
    response: new ArrayBuffer(8)
  });
  unsupportedXhr.trigger('load');
  assert.equal(unsupported.calls.processData.length, 0);
  assert.equal(unsupportedXhr.__filtertube_modifiedResponse, undefined);
});

test('marked load listener observes modified responseText because wrapper processes first', () => {
  const runtime = loadInstrumentedSeedRuntime({
    processData(data) {
      return { listenerChanged: true, original: data };
    }
  });
  runtime.window.filterTube.updateSettings(settings());
  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  xhr.readyState = 4;
  xhr.status = 200;
  xhr.responseType = '';
  xhr.responseText = '{"title":"needle listener"}';
  const observed = [];

  xhr.addEventListener('load', function onLoad() {
    observed.push(this.responseText);
  });
  xhr.trigger('load');

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(observed.length, 1);
  assert.deepEqual(JSON.parse(observed[0]), {
    listenerChanged: true,
    original: { title: 'needle listener' }
  });
});

test('XHR response override contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    `xhrEndpoints(5): ${endpoints.join(',')}`,
    'xhrPreBodyMarkSites(2): openShouldProcess,sendShouldProcess',
    'xhrReadyLoadHookInstalls(2): readystatechange,load',
    'xhrListenerWrapperSites(2): addEventListenerWrapper,removeEventListenerWrapper',
    'xhrPreParseGuards(7): missingXhr,alreadyProcessed,notMarked,notReady,noSettings,disabled,errorStatus',
    'xhrBodyParseModes(2): responseType-json,responseType-empty-or-text',
    'xhrBodyGuardBranches(6): jsonNonObject,textMissingOrNonString,textNotJsonLooking,textParseFailure,unsupportedResponseType,processedNonObject',
    'xhrMutationBackingFields(2): __filtertube_modifiedResponse,__filtertube_modifiedResponseText',
    'xhrGetterOverrideSites(2): response,responseText',
    'xhrResponseGetterBranches(3): jsonReturnsObject,textReturnsString,otherReturnsObject',
    'xhrFallbackGetterBranches(2): protoGetterFallback,emptyOrUndefinedFallback',
    'runtimePositiveOverrideFixtures(2): textResponseOverride,jsonResponseOverride',
    'runtimeNoMutationFixtures(5): noSettings,disabled,errorStatus,invalidJson,unsupportedResponseType',
    'runtimeListenerWrapperFixtures(1): markedLoadListenerProcessesBeforePageListener'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'endpoint',
    'parsedPathname',
    'rawUrl',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevision',
    'activeRuleState',
    'listenerHookAllowed',
    'bodyParseAllowed',
    'mutationAllowed',
    'responseType',
    'readyState',
    'status',
    'responseBeforeType',
    'responseTextBeforeSize',
    'parseSucceeded',
    'parseFailureReason',
    'processedValueType',
    'responseGetterReturnType',
    'responseTextGetterReturnType',
    'prototypeGetterFallbackPolicy',
    'pageListenerReadOrder',
    'overrideInstallAllowed',
    'overrideLifetime',
    'passThroughReason',
    'textResponseFixture',
    'jsonResponseFixture',
    'disabledFixture',
    'noSettingsFixture',
    'errorStatusFixture',
    'invalidJsonFixture',
    'unsupportedResponseTypeFixture',
    'listenerOrderFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstXhrResponseOverrideContract',
    'jsonFirstXhrResponseOverrideDecision',
    'jsonFirstXhrBodyModeReport',
    'jsonFirstXhrGetterCompatibilityReport',
    'jsonFirstXhrListenerOrderReport',
    'jsonFirstXhrPassThroughReason',
    'jsonFirstXhrOverrideLifetimeRegistry',
    'jsonFirstXhrResponseOverrideFixtureProvenance',
    'jsonFirstXhrResponseOverrideMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
