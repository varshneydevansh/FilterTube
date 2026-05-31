import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
};

const blockSpecs = {
  seedFetchInterception: {
    file: 'js/seed.js',
    start: 'function setupFetchInterception() {',
    end: '    function setupXhrInterception() {',
    lines: 91,
    bytes: 4426
  },
  seedFetchShortcut: {
    file: 'js/seed.js',
    start: '// Special handling for comment requests when hideAllComments is enabled',
    end: '// Normal processing for non-comment or non-hideAllComments requests',
    lines: 38,
    bytes: 2269
  },
  seedXhrInterception: {
    file: 'js/seed.js',
    start: 'function setupXhrInterception() {',
    end: '    // ============================================================================',
    lines: 219,
    bytes: 10318
  },
  seedXhrProcessor: {
    file: 'js/seed.js',
    start: 'const ensureXhrResponseProcessed = (xhr) => {',
    end: '            if (typeof originalAddEventListener ===',
    lines: 85,
    bytes: 4429
  },
  seedXhrEndpoints: {
    file: 'js/seed.js',
    start: '            const xhrEndpoints = [',
    end: '            const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;',
    lines: 8,
    bytes: 242
  },
  seedXhrSendHooks: {
    file: 'js/seed.js',
    start: '            proto.send = function() {',
    end: '            seedDebugLog("✅ XHR interception established");',
    lines: 31,
    bytes: 1397
  }
};

const authoritySymbols = [
  'xhrCommentContinuationParityContract',
  'xhrCommentContinuationDecisionReport',
  'xhrCommentContinuationTransportParityReport',
  'xhrCommentContinuationSyntheticEndPolicy',
  'xhrCommentContinuationEngineBypassReport',
  'xhrCommentContinuationBodyModeReport',
  'xhrCommentContinuationViewModelParityReport',
  'xhrCommentContinuationCommandParityReport',
  'xhrCommentContinuationFixtureProvenance',
  'xhrCommentContinuationMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
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

function blockMetric(spec) {
  const block = sliceBetween(read(spec.file), spec.start, spec.end);
  return {
    block,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block)
  };
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
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
    whitelistChannels: [],
    whitelistKeywords: [],
    hideAllComments: true,
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

function commentThreadItem(id = 'Ugw-xhr-thread') {
  return {
    commentThreadRenderer: {
      comment: {
        commentRenderer: {
          commentId: id,
          contentText: { simpleText: 'XHR continuation comment' }
        }
      }
    }
  };
}

function commentRendererItem(id = 'Ugw-fetch-comment') {
  return {
    commentRenderer: {
      commentId: id,
      contentText: { simpleText: 'Fetch continuation comment' }
    }
  };
}

function commentViewModelItem(id = 'Ugw-xhr-view-model') {
  return {
    commentViewModel: {
      commentId: id,
      contentText: { runs: [{ text: 'Modern comment view model text' }] }
    }
  };
}

function endpointPayload(command, items) {
  return {
    onResponseReceivedEndpoints: [{
      [command]: {
        continuationItems: items
      }
    }]
  };
}

function actionsPayload(command, items) {
  return {
    onResponseReceivedActions: [{
      [command]: {
        continuationItems: items
      }
    }]
  };
}

function loadInstrumentedSeedRuntime(options = {}) {
  const source = read('js/seed.js');
  const engineRuntime = loadFilterTubeEngine();
  const calls = {
    processData: [],
    harvestOnly: [],
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
        listener.call(this, { type, target: this });
      }
    }
  }

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        if (options.processData) return options.processData(data, activeSettings, dataName);
        return engineRuntime.engine.processData(clone(data), clone(activeSettings), dataName);
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
      hostname: 'www.youtube.com',
      pathname: '/watch',
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

function openReadyXhr(runtime, {
  url = 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false',
  responseType = '',
  responseText,
  response,
  status = 200,
  settingsOverride
} = {}) {
  if (settingsOverride !== null) {
    runtime.window.filterTube.updateSettings(settings(settingsOverride || {}));
  }
  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('POST', url);
  xhr.readyState = 4;
  xhr.status = status;
  xhr.responseType = responseType;
  if (responseText !== undefined) xhr.responseText = responseText;
  if (response !== undefined) xhr.response = response;
  xhr.send();
  return xhr;
}

function parseXhrResponse(xhr) {
  return JSON.parse(xhr.responseText);
}

function syntheticItems(body) {
  return body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

test('XHR comment continuation parity slice is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior changed for no-active-JSON-work XHRs/);
  assert.match(text, /not an implementation patch, optimization patch, XHR patch/);
  assert.match(text, /XHR comment continuation parity source files: 2/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for XHR comment continuation parity authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(
      text,
      new RegExp(`\\| \`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`)
    );
  }
});

test('fetch shortcut and XHR processor source rows remain transport-asymmetric', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchShortcut = blockMetric(blockSpecs.seedFetchShortcut).block;
  const xhrBlock = blockMetric(blockSpecs.seedXhrInterception).block;

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
  }

  const anchors = [
    ['function setupFetchInterception() {', 666],
    ["if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703],
    ['const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint =>', 705],
    ['endpoint?.appendContinuationItemsAction?.continuationItems?.some(item =>', 706],
    ['item?.commentThreadRenderer || item?.commentRenderer', 707],
    ['continuationItemRenderer: {', 721],
    ['continuationEndpoint: null', 723],
    ['function setupXhrInterception() {', 757],
    ['const ensureXhrResponseProcessed = (xhr) => {', 813],
    ['xhr.__filtertube_modifiedResponseText = JSON.stringify(processed);', 855],
    ["Object.defineProperty(xhr, 'response',", 863],
    ["Object.defineProperty(xhr, 'responseText',", 878],
    ["originalAddEventListener.call(this, 'readystatechange', processIfReady);", 961],
    ["originalAddEventListener.call(this, 'load', processIfReady);", 962]
  ];

  for (const [needle, expectedLine] of anchors) {
    assert.equal(lineOf(seed, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }
  assert.ok(seed.split(/\r?\n/)[766 - 1].includes("'/youtubei/v1/next',"));
  assert.ok(text.includes('`js/seed.js:766`'), 'doc should cite js/seed.js:766');
  assert.ok(seed.split(/\r?\n/)[851 - 1].includes('const processed = processWithEngine(jsonData, dataName);'));
  assert.ok(text.includes('`js/seed.js:851`'), 'doc should cite js/seed.js:851');

  assert.equal(countLiteral(fetchShortcut, 'hideAllComments'), 2);
  assert.equal(countLiteral(fetchShortcut, '/youtubei/v1/next'), 1);
  assert.equal(countLiteral(fetchShortcut, 'onResponseReceivedEndpoints'), 2);
  assert.equal(countLiteral(fetchShortcut, 'appendContinuationItemsAction'), 2);
  assert.equal(countLiteral(fetchShortcut, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(fetchShortcut, 'commentRenderer'), 1);
  assert.equal(countLiteral(fetchShortcut, 'continuationItemRenderer'), 1);
  assert.equal(countLiteral(fetchShortcut, 'continuationEndpoint: null'), 1);
  assert.equal(countLiteral(fetchShortcut, 'processWithEngine'), 0);

  assert.equal(countLiteral(xhrBlock, 'hideAllComments'), 0);
  assert.equal(countLiteral(xhrBlock, 'onResponseReceivedEndpoints'), 0);
  assert.equal(countLiteral(xhrBlock, 'appendContinuationItemsAction'), 0);
  assert.equal(countLiteral(xhrBlock, 'commentThreadRenderer'), 0);
  assert.equal(countLiteral(xhrBlock, 'commentRenderer'), 0);
  assert.equal(countLiteral(xhrBlock, 'continuationItemRenderer'), 0);
  assert.equal(countLiteral(xhrBlock, 'continuationEndpoint: null'), 0);
  assert.equal(countLiteral(xhrBlock, 'processWithEngine'), 1);
  assert.equal(countLiteral(xhrBlock, 'responseText'), 3);
  assert.equal(countLiteral(xhrBlock, 'responseType'), 6);
});

test('fetch append comment continuation bypasses engine and returns a synthetic end marker', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: endpointPayload('appendContinuationItemsAction', [commentRendererItem('Ugw-fetch-shortcut')]),
    status: 206,
    statusText: 'Partial Content',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'fetch-shortcut' }
  });
  runtime.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  const items = syntheticItems(body);

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(response.status, 206);
  assert.equal(response.statusText, 'Partial Content');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'fetch-shortcut' });
  assert.equal(items?.length, 1);
  assert.equal(items[0].continuationItemRenderer?.trigger, 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN');
  assert.equal(items[0].continuationItemRenderer?.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('Ugw-fetch-shortcut'), false);
});

test('XHR text append comment continuation uses generic engine processing without synthetic end marker', () => {
  const runtime = loadInstrumentedSeedRuntime();
  const payload = endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-xhr-text')]);
  const xhr = openReadyXhr(runtime, { responseText: JSON.stringify(payload) });

  xhr.trigger('load');

  const body = parseXhrResponse(xhr);
  assert.equal(runtime.calls.jsonParse.length, 1);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/next');
  assert.equal(runtime.calls.processData[0].settings.hideAllComments, true);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.deepEqual(body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems, []);
  assert.equal(JSON.stringify(body).includes('Ugw-xhr-text'), false);
  assert.equal(JSON.stringify(body).includes('continuationItemRenderer'), false);
  assert.equal(JSON.stringify(body).includes('continuationEndpoint'), false);
  assert.equal(xhr.response, xhr.responseText);
});

test('XHR json append comment continuation returns object response and string responseText after engine processing', () => {
  const runtime = loadInstrumentedSeedRuntime();
  const payload = endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-xhr-json')]);
  const xhr = openReadyXhr(runtime, {
    responseType: 'json',
    response: payload
  });

  xhr.trigger('readystatechange');

  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/next');
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.deepEqual(clone(xhr.response.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems), []);
  assert.equal(typeof xhr.responseText, 'string');
  assert.equal(JSON.stringify(xhr.response), xhr.responseText);
  assert.equal(JSON.stringify(xhr.response).includes('Ugw-xhr-json'), false);
  assert.equal(JSON.stringify(xhr.response).includes('continuationItemRenderer'), false);
});

test('XHR modern commentViewModel continuation survives hideAllComments through generic engine path', () => {
  const runtime = loadInstrumentedSeedRuntime();
  const payload = endpointPayload('appendContinuationItemsAction', [commentViewModelItem('Ugw-xhr-view-model')]);
  const xhr = openReadyXhr(runtime, { responseText: JSON.stringify(payload) });

  xhr.trigger('load');

  const body = parseXhrResponse(xhr);
  const items = body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/next');
  assert.equal(items?.length, 1);
  assert.equal(items[0].commentViewModel?.commentId, 'Ugw-xhr-view-model');
  assert.equal(JSON.stringify(body).includes('continuationItemRenderer'), false);
  assert.equal(JSON.stringify(body).includes('continuationEndpoint'), false);
});

test('XHR reload replace and actions continuations share generic engine path instead of fetch shortcut detection', () => {
  const cases = [
    {
      name: 'reload',
      payload: endpointPayload('reloadContinuationItemsCommand', [commentThreadItem('Ugw-xhr-reload')]),
      root: 'onResponseReceivedEndpoints',
      command: 'reloadContinuationItemsCommand'
    },
    {
      name: 'replace',
      payload: endpointPayload('replaceContinuationItemsCommand', [commentThreadItem('Ugw-xhr-replace')]),
      root: 'onResponseReceivedEndpoints',
      command: 'replaceContinuationItemsCommand'
    },
    {
      name: 'actions-append',
      payload: actionsPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-xhr-actions')]),
      root: 'onResponseReceivedActions',
      command: 'appendContinuationItemsAction'
    }
  ];

  for (const scenario of cases) {
    const runtime = loadInstrumentedSeedRuntime();
    const xhr = openReadyXhr(runtime, { responseText: JSON.stringify(scenario.payload) });
    xhr.trigger('load');

    const body = parseXhrResponse(xhr);
    assert.equal(runtime.calls.processData.length, 1, scenario.name);
    assert.equal(runtime.calls.processData[0].dataName, 'xhr:/youtubei/v1/next', scenario.name);
    assert.deepEqual(body[scenario.root]?.[0]?.[scenario.command]?.continuationItems, [], scenario.name);
    assert.equal(JSON.stringify(body).includes('continuationItemRenderer'), false, scenario.name);
    assert.equal(JSON.stringify(body).includes('continuationEndpoint'), false, scenario.name);
  }
});

test('XHR disabled mode bypasses next endpoint without marking hooks processing or response override', () => {
  const runtime = loadInstrumentedSeedRuntime();
  const payload = endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-xhr-disabled')]);
  const xhr = openReadyXhr(runtime, {
    responseText: JSON.stringify(payload),
    settingsOverride: { enabled: false, hideAllComments: true }
  });

  xhr.trigger('load');

  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
  assert.equal((xhr._listeners.get('readystatechange') || []).length, 0);
  assert.equal((xhr._listeners.get('load') || []).length, 0);
  assert.equal(runtime.calls.jsonParse.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(xhr.__filtertube_modifiedResponse, undefined);
  assert.equal(xhr.__filtertube_modifiedResponseText, undefined);
  assert.equal(JSON.parse(xhr.responseText).onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-xhr-disabled');
});

test('XHR comment continuation parity records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime XHR comment continuation parity fixtures: 8',
    'Fetch append comment continuation under `hideAllComments:true` bypasses the',
    'XHR text-like append comment continuation under the same setting calls',
    'XHR `responseType:"json"` append comment continuation follows the same',
    'XHR comment continuations containing `commentViewModel` currently follow',
    'XHR reload continuation command payloads use the same generic engine path.',
    'XHR replace continuation command payloads use the same generic engine path.',
    'XHR `onResponseReceivedActions` append payloads use the same generic engine',
    'XHR disabled mode now bypasses endpoint marking and ready hooks'
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
    'settings mode',
    'responseCollectionRoot',
    'continuationCommand',
    'commentRendererShape',
    'synthetic-end',
    'engine-bypass',
    'responseType',
    'body-mode',
    'listener-hook',
    'no-work budget',
    'metric',
    'fixture'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.ok(text.includes(symbol), `doc should name missing authority ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
  }
});
