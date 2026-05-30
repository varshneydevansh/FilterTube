import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function parseArrayItems(block) {
  const out = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').trim().replace(/,$/, '').trim();
    if (!line) continue;
    const quoted = /^['"]([^'"]+)['"]$/.exec(line);
    if (quoted) out.push(quoted[1]);
  }
  return out;
}

function arrayFromSource(source, startNeedle, endNeedle) {
  return parseArrayItems(sliceBetween(source, startNeedle, endNeedle));
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

function loadFetchMetadataRuntime(options = {}) {
  const source = read('js/seed.js');
  const payload = options.payload ?? {};
  const calls = {
    fetch: [],
    responseJson: [],
    responseText: [],
    responseClone: [],
    responseConstruct: [],
    processData: [],
    harvestOnly: [],
    jsonStringify: []
  };
  let originalResponse = null;

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
      this.url = init.url || '';
      this.redirected = init.redirected === true;
      this.type = init.type || 'default';
      this.bodyUsed = false;
      this._calls = calls;
      this._source = init.source || 'constructed';
      this._initKeys = Object.keys(init)
        .filter((key) => !['calls', 'source'].includes(key))
        .sort();
      calls.responseConstruct.push({
        source: this._source,
        initKeys: this._initKeys,
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        url: this.url,
        redirected: this.redirected,
        type: this.type,
        response: this
      });
    }

    clone() {
      if (this._calls) {
        this._calls.responseClone.push({ source: this._source, url: this.url });
      }
      return new MockResponse(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
        url: this.url,
        redirected: this.redirected,
        type: this.type,
        calls: this._calls,
        source: 'clone'
      });
    }

    async json() {
      this.bodyUsed = true;
      if (this._calls) {
        this._calls.responseJson.push({ source: this._source, body: this._body });
      }
      return JSON.parse(this._body);
    }

    async text() {
      this.bodyUsed = true;
      if (this._calls) {
        this._calls.responseText.push({ source: this._source, body: this._body });
      }
      return this._body;
    }
  }

  function makeXhr() {}
  makeXhr.prototype.open = function open() {};
  makeXhr.prototype.send = function send() {};
  makeXhr.prototype.addEventListener = function addEventListener() {};
  makeXhr.prototype.removeEventListener = function removeEventListener() {};

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
    fetch(resource, init) {
      calls.fetch.push({ resource, init });
      originalResponse = new MockResponse(payload, {
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: options.headers || {},
        url: options.responseUrl || 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false',
        redirected: options.redirected === true,
        type: options.type || 'cors',
        calls,
        source: 'original'
      });
      return Promise.resolve(originalResponse);
    },
    XMLHttpRequest: makeXhr,
    postMessage() {},
    dispatchEvent() {}
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
    setTimeout() {
      return 0;
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
    get originalResponse() {
      return originalResponse;
    }
  };
}

function latestConstructedResponse(runtime) {
  const constructed = runtime.calls.responseConstruct.filter((entry) => entry.source === 'constructed');
  assert.ok(constructed.length > 0, 'expected a constructed replacement response');
  return constructed.at(-1).response;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first fetch response rebuild metadata contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, fetch patch/);
  assert.match(text, /source files with fetch response rebuild surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first fetch response rebuild authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('fetch response rebuild source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const lines = seed.split(/\r?\n/);

  assert.deepEqual(arrayFromSource(fetchSetup, 'const fetchEndpoints = [', '];\n\n        const getPathname'), endpoints);

  const anchors = [
    ['const url = resource instanceof Request ? resource.url : resource;', 686],
    ["const urlStr = typeof url === 'string' ? url : String(url || '');", 687],
    ['if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {', 689],
    ['return originalFetch.apply(this, arguments);', 690],
    ['return originalFetch.apply(this, arguments);', 695],
    ['return originalFetch.apply(this, arguments).then(response => {', 698],
    ['if (!response.ok) return response;', 699],
    ['return response.clone().json().then(jsonData => {', 701],
    ["if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703],
    ['return new Response(JSON.stringify(emptyCommentResponse),', 731],
    ['status: response.status,', 732],
    ['statusText: response.statusText,', 733],
    ['headers: response.headers', 734],
    ['const processed = processWithEngine(jsonData, dataName);', 740],
    ['return new Response(JSON.stringify(processed),', 741],
    ['status: response.status,', 742],
    ['statusText: response.statusText,', 743],
    ['headers: response.headers', 744],
    ['return response;', 749]
  ];

  for (const [needle, expectedLine] of anchors) {
    assert.ok(lines[expectedLine - 1].includes(needle), `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.equal((fetchSetup.match(/return new Response\(JSON\.stringify/g) || []).length, 2);
  assert.equal((fetchSetup.match(/status: response\.status/g) || []).length, 2);
  assert.equal((fetchSetup.match(/statusText: response\.statusText/g) || []).length, 2);
  assert.equal((fetchSetup.match(/headers: response\.headers/g) || []).length, 2);
  assert.doesNotMatch(fetchSetup, /headers\.clone|new Headers|content-type|Content-Type|response\.url|response\.redirected|response\.type/);

  assert.match(text, /fetch response clone body-read sites: 1/);
  assert.match(text, /fetch response rebuild branches: 2/);
  assert.match(text, /new Response body writer sites: 2/);
  assert.match(text, /JSON\.stringify rebuild body sites: 2/);
  assert.match(text, /selected metadata fields preserved per rebuild: 3/);
  assert.match(text, /selected metadata assignment sites: 6/);
  assert.match(text, /headers clone\/copy sites: 0/);
  assert.match(text, /content-type decision sites: 0/);
  assert.match(text, /body mode decision sites: 0/);
  assert.match(text, /response identity metadata writer sites: 0/);
  assert.match(text, /pass-through branches returning original response: 4/);
});

test('normal fetch rebuild preserves selected metadata but not original response identity metadata', async () => {
  const headers = { 'content-type': 'application/json', 'x-filtertube-test': 'normal-rebuild' };
  const originalUrl = 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false';
  const runtime = loadFetchMetadataRuntime({
    payload: { title: 'needle normal body' },
    status: 202,
    statusText: 'Accepted',
    headers,
    responseUrl: originalUrl,
    redirected: true,
    type: 'cors',
    processData(data, activeSettings, dataName) {
      return { rebuilt: true, dataName, original: data };
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  const replacement = latestConstructedResponse(runtime);
  const body = await response.json();

  assert.equal(response, replacement);
  assert.deepEqual(body, {
    rebuilt: true,
    dataName: 'fetch:/youtubei/v1/search',
    original: { title: 'needle normal body' }
  });
  assert.equal(response.status, 202);
  assert.equal(response.statusText, 'Accepted');
  assert.equal(response.headers, headers);
  assert.equal(response.url, '');
  assert.equal(response.redirected, false);
  assert.equal(response.type, 'default');
  assert.deepEqual(response._initKeys, ['headers', 'status', 'statusText']);
  assert.equal(runtime.originalResponse.url, originalUrl);
  assert.equal(runtime.originalResponse.redirected, true);
  assert.equal(runtime.originalResponse.type, 'cors');
  assert.equal(runtime.originalResponse.bodyUsed, false);
  assert.equal(runtime.calls.responseClone.length, 1);
  assert.equal(runtime.calls.responseJson.filter((entry) => entry.source === 'clone').length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(runtime.calls.processData.length, 1);
});

test('comment shortcut rebuild uses the same selected metadata shape and drops original response identity metadata', async () => {
  const headers = { 'content-type': 'application/json', 'x-filtertube-test': 'comment-rebuild' };
  const originalUrl = 'https://rr.youtube.com/youtubei/v1/next?prettyPrint=false';
  const runtime = loadFetchMetadataRuntime({
    payload: {
      onResponseReceivedEndpoints: [{
        appendContinuationItemsAction: {
          continuationItems: [{
            commentThreadRenderer: {
              comment: {
                commentRenderer: { commentId: 'Ugw-needle-comment' }
              }
            }
          }]
        }
      }]
    },
    status: 207,
    statusText: 'Multi-Status',
    headers,
    responseUrl: originalUrl,
    redirected: true,
    type: 'cors'
  });
  runtime.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const replacement = latestConstructedResponse(runtime);
  const body = await response.json();
  const items = body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;

  assert.equal(response, replacement);
  assert.equal(response.status, 207);
  assert.equal(response.statusText, 'Multi-Status');
  assert.equal(response.headers, headers);
  assert.equal(response.url, '');
  assert.equal(response.redirected, false);
  assert.equal(response.type, 'default');
  assert.deepEqual(response._initKeys, ['headers', 'status', 'statusText']);
  assert.equal(items?.length, 1);
  assert.equal(items[0].continuationItemRenderer?.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('Ugw-needle-comment'), false);
  assert.equal(runtime.originalResponse.url, originalUrl);
  assert.equal(runtime.originalResponse.redirected, true);
  assert.equal(runtime.originalResponse.type, 'cors');
  assert.equal(runtime.calls.responseClone.length, 1);
  assert.equal(runtime.calls.responseJson.filter((entry) => entry.source === 'clone').length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(runtime.calls.processData.length, 0);
});

test('fetch pass-through branches return the original response object without rebuild metadata changes', async () => {
  const nonmatching = loadFetchMetadataRuntime({
    payload: { title: 'needle pass through' },
    responseUrl: 'https://rr.youtube.com/api/stats/watchtime',
    redirected: true,
    type: 'cors'
  });
  nonmatching.window.filterTube.updateSettings(settings());
  const nonmatchingResponse = await nonmatching.window.fetch('https://www.youtube.com/api/stats/watchtime');
  assert.equal(nonmatchingResponse, nonmatching.originalResponse);
  assert.equal(nonmatchingResponse.url, 'https://rr.youtube.com/api/stats/watchtime');
  assert.equal(nonmatchingResponse.redirected, true);
  assert.equal(nonmatching.calls.responseClone.length, 0);
  assert.equal(nonmatching.calls.responseJson.length, 0);
  assert.equal(nonmatching.calls.jsonStringify.length, 0);
  assert.equal(nonmatching.calls.processData.length, 0);

  const noActiveJsonWork = loadFetchMetadataRuntime({
    payload: { title: 'needle inactive work' },
    responseUrl: 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false',
    redirected: true,
    type: 'cors'
  });
  noActiveJsonWork.window.filterTube.updateSettings(settings({ filterKeywords: [] }));
  const noActiveResponse = await noActiveJsonWork.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(noActiveResponse, noActiveJsonWork.originalResponse);
  assert.equal(noActiveResponse.url, 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(noActiveResponse.redirected, true);
  assert.equal(noActiveJsonWork.calls.responseClone.length, 0);
  assert.equal(noActiveJsonWork.calls.responseJson.length, 0);
  assert.equal(noActiveJsonWork.calls.jsonStringify.length, 0);
  assert.equal(noActiveJsonWork.calls.processData.length, 0);

  const nonOk = loadFetchMetadataRuntime({
    payload: { title: 'needle error' },
    status: 503,
    statusText: 'Service Unavailable',
    responseUrl: 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false',
    redirected: true,
    type: 'cors'
  });
  nonOk.window.filterTube.updateSettings(settings());
  const nonOkResponse = await nonOk.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(nonOkResponse, nonOk.originalResponse);
  assert.equal(nonOkResponse.status, 503);
  assert.equal(nonOkResponse.statusText, 'Service Unavailable');
  assert.equal(nonOkResponse.url, 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(nonOk.calls.responseClone.length, 0);
  assert.equal(nonOk.calls.responseJson.length, 0);
  assert.equal(nonOk.calls.jsonStringify.length, 0);
  assert.equal(nonOk.calls.processData.length, 0);

  const invalidJson = loadFetchMetadataRuntime({
    payload: '{"title":',
    responseUrl: 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false',
    redirected: true,
    type: 'cors'
  });
  invalidJson.window.filterTube.updateSettings(settings());
  const invalidResponse = await invalidJson.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(invalidResponse, invalidJson.originalResponse);
  assert.equal(invalidResponse.url, 'https://rr.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(invalidJson.calls.responseClone.length, 1);
  assert.equal(invalidJson.calls.responseJson.filter((entry) => entry.source === 'clone').length, 1);
  assert.equal(invalidJson.calls.jsonStringify.length, 0);
  assert.equal(invalidJson.calls.processData.length, 0);
});

test('fetch response rebuild metadata contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    `fetchEndpoints(5): ${endpoints.join(',')}`,
    'fetchResponseCloneJsonSites(1): response.clone().json',
    'fetchResponseRebuildBranches(2): commentContinuationSyntheticEnd,normalProcessWithEngine',
    'fetchResponseBodyWriters(2): JSON.stringify(emptyCommentResponse),JSON.stringify(processed)',
    'fetchResponseMetadataPreserved(3): status,statusText,headers',
    'fetchResponseMetadataAssignments(6): commentStatus,commentStatusText,commentHeaders,normalStatus,normalStatusText,normalHeaders',
    'fetchHeaderCloneSites(0): none',
    'fetchContentTypeDecisionSites(0): none',
    'fetchBodyModeDecisionSites(0): none',
    'fetchIdentityMetadataWriters(0): url,redirected,type,bodyUsed',
    'fetchOriginalResponsePassThroughBranches(4): nonMatchingUrl,noActiveJsonWork,nonOkResponse,jsonParseFailure',
    'runtimeRebuildPositiveFixtures(2): normalProcessRebuild,commentShortcutRebuild',
    'runtimeOriginalResponseFixtures(4): nonMatchingUrl,noActiveJsonWork,nonOkResponse,jsonParseFailure'
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
    'rebuildBranch',
    'mutationAllowed',
    'parseAllowed',
    'stringifyAllowed',
    'bodyModeBefore',
    'bodyModeAfter',
    'bodySizeBefore',
    'bodySizeAfter',
    'statusPreserved',
    'statusTextPreserved',
    'headersPreserved',
    'headersClonePolicy',
    'contentTypeBefore',
    'contentTypeAfter',
    'urlPreservationPolicy',
    'redirectedPreservationPolicy',
    'responseTypePreservationPolicy',
    'bodyUsedPolicy',
    'streamPolicy',
    'trailerPolicy',
    'passThroughReason',
    'normalRebuildFixture',
    'commentShortcutRebuildFixture',
    'nonMatchingPassThroughFixture',
    'nonOkPassThroughFixture',
    'parseFailurePassThroughFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstFetchResponseRebuildContract',
    'jsonFirstFetchResponseMetadataDecision',
    'jsonFirstFetchBodyModeReport',
    'jsonFirstFetchHeaderClonePolicy',
    'jsonFirstFetchResponseIdentityReport',
    'jsonFirstFetchPassThroughReason',
    'jsonFirstFetchRebuildFixtureProvenance',
    'jsonFirstFetchResponseMetricArtifact',
    'jsonFirstFetchContentTypeDecision'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
