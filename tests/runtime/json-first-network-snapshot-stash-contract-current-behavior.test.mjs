import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

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

function payloadFor(resource) {
  const url = String(resource || '');
  const parsed = new URL(url, 'https://www.youtube.com');
  const id = Number(parsed.searchParams.get('id') || 0);
  const endpoint = parsed.pathname.split('/').at(-1);
  if (parsed.pathname.includes('/youtubei/v1/search')) {
    return {
      endpoint,
      id,
      contents: {
        twoColumnSearchResultsRenderer: {
          primaryContents: { sectionListRenderer: { contents: [] } }
        }
      }
    };
  }
  return { endpoint, id, title: `needle ${endpoint} ${id}` };
}

function loadSnapshotRuntime(options = {}) {
  const source = read('js/seed.js');
  const calls = {
    fetch: [],
    responseJson: [],
    processData: [],
    harvestOnly: [],
    jsonStringify: []
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

  const windowObject = {
    __filtertubeDebug: false,
    FilterTubeEngine: {
      processData(data, activeSettings, dataName) {
        calls.processData.push({ dataName, settings: clone(activeSettings), data: clone(data) });
        if (options.processData) return options.processData(data, activeSettings, dataName);
        return { ...data, processedBy: dataName };
      },
      harvestOnly(data, activeSettings) {
        calls.harvestOnly.push({ settings: clone(activeSettings), data: clone(data) });
      }
    },
    fetch(resource, init) {
      calls.fetch.push({ resource, init });
      const payload = options.payloadFor ? options.payloadFor(resource) : payloadFor(resource);
      return Promise.resolve(new MockResponse(payload, {
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        headers: options.headers || { 'content-type': 'application/json' },
        source: 'original'
      }));
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
  return { context, window: context.window, calls };
}

async function fetchEndpoint(runtime, endpoint, id = 0) {
  const response = await runtime.window.fetch(`https://www.youtube.com/youtubei/v1/${endpoint}?id=${id}`);
  return response.json();
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first network snapshot stash contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, snapshot patch/);
  assert.match(text, /source files with network snapshot stash surface: 2/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`));
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('network snapshot stash source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const seedLines = seed.split(/\r?\n/);
  const injectorLines = injector.split(/\r?\n/);
  const stashBlock = sliceBetween(seed, 'function stashNetworkSnapshot(data, dataName)', 'let replayTimer = null;');

  const seedAnchors = [
    ['function stashNetworkSnapshot(data, dataName) {', 43],
    ['if (!window.filterTube) return;', 45],
    ["if (!data || typeof data !== 'object') return;", 46],
    ["const name = typeof dataName === 'string' ? dataName : '';", 47],
    ['if (!name) return;', 48],
    ['const ts = Date.now();', 50],
    ["if (name.includes('/youtubei/v1/search')) {", 51],
    ['window.filterTube.lastYtSearchResponse = data;', 52],
    ['window.filterTube.lastYtSearchResponseName = name;', 53],
    ['window.filterTube.lastYtSearchResponseTs = ts;', 54],
    ['const recentSearchResponses = Array.isArray(window.filterTube.recentYtSearchResponses)', 55],
    ['recentSearchResponses.push({', 58],
    ['window.filterTube.recentYtSearchResponses = recentSearchResponses.slice(-12);', 63],
    ["if (name.includes('/youtubei/v1/next')) {", 66],
    ['window.filterTube.lastYtNextResponse = data;', 67],
    ['window.filterTube.lastYtNextResponseName = name;', 68],
    ['window.filterTube.lastYtNextResponseTs = ts;', 69],
    ["if (name.includes('/youtubei/v1/browse')) {", 72],
    ['window.filterTube.lastYtBrowseResponse = data;', 73],
    ['window.filterTube.lastYtBrowseResponseName = name;', 74],
    ['window.filterTube.lastYtBrowseResponseTs = ts;', 75],
    ['const recentBrowseResponses = Array.isArray(window.filterTube.recentYtBrowseResponses)', 76],
    ['recentBrowseResponses.push({', 79],
    ['window.filterTube.recentYtBrowseResponses = recentBrowseResponses.slice(-12);', 84],
    ["if (name.includes('/youtubei/v1/player')) {", 87],
    ['window.filterTube.lastYtPlayerResponse = data;', 88],
    ['window.filterTube.lastYtPlayerResponseName = name;', 89],
    ['window.filterTube.lastYtPlayerResponseTs = ts;', 90],
    ['stashNetworkSnapshot(data, dataName);', 433],
    ['const result = window.FilterTubeEngine.processData(data, cachedSettings, dataName);', 454],
    ['stashNetworkSnapshot(result, dataName);', 470],
    ['const fallback = basicProcessing(data, dataName);', 475],
    ['stashNetworkSnapshot(fallback, dataName);', 476],
    ['window.filterTube.lastYtInitialData = reprocessed;', 1062],
    ['window.filterTube.lastYtInitialPlayerResponse = reprocessed;', 1074]
  ];

  const injectorAnchors = [
    ['const recentBrowseResponses = Array.isArray(window.filterTube?.recentYtBrowseResponses)', 776],
    ['window.filterTube?.lastYtBrowseResponse,', 787],
    ['const recent = Array.isArray(window.filterTube?.recentYtBrowseResponses)', 978],
    ['const fallbackTs = Number(window.filterTube?.lastYtBrowseResponseTs) || 0;', 986],
    ['// from stashed network snapshots (lastYtBrowseResponse/lastYtNextResponse/lastYtPlayerResponse).', 2575],
    ['if (window.filterTube?.lastYtSearchResponse) {', 2743],
    ['if (Array.isArray(window.filterTube?.recentYtSearchResponses)) {', 2746],
    ['if (window.filterTube?.lastYtNextResponse) {', 2754],
    ['if (window.filterTube?.lastYtBrowseResponse) {', 2757],
    ['if (window.filterTube?.lastYtPlayerResponse) {', 2768],
    ['if (window.filterTube?.lastYtSearchResponse) {', 3123],
    ['if (Array.isArray(window.filterTube?.recentYtSearchResponses)) {', 3126],
    ['if (window.filterTube?.lastYtNextResponse) {', 3134],
    ['if (window.filterTube?.lastYtBrowseResponse) {', 3137]
  ];

  for (const [needle, expectedLine] of seedAnchors) {
    assert.ok(seedLines[expectedLine - 1].includes(needle), `seed anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }
  for (const [needle, expectedLine] of injectorAnchors) {
    assert.ok(injectorLines[expectedLine - 1].includes(needle), `injector anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/injector.js:${expectedLine}\``), `doc should cite js/injector.js:${expectedLine}`);
  }

  assert.match(stashBlock, /\/youtubei\/v1\/search/);
  assert.match(stashBlock, /\/youtubei\/v1\/next/);
  assert.match(stashBlock, /\/youtubei\/v1\/browse/);
  assert.match(stashBlock, /\/youtubei\/v1\/player/);
  assert.doesNotMatch(stashBlock, /\/youtubei\/v1\/guide|lastYtGuide|recentYtGuide/);
  assert.equal(countLiteral(injector, 'recentYtSearchResponses'), 6);
  assert.equal(countLiteral(injector, 'recentYtBrowseResponses'), 4);
  assert.equal(countLiteral(injector, 'lastYtBrowseResponse'), 9);

  assert.match(text, /seed snapshot endpoint families written: 4/);
  assert.match(text, /seed snapshot endpoint families not written from fetch endpoint list: 1/);
  assert.match(text, /recent snapshot retained tail size: 12/);
  assert.match(text, /injector snapshot consumer clusters: 3/);
});

test('search and browse snapshots retain processed latest objects and cap recent arrays at 12', async () => {
  const search = loadSnapshotRuntime();
  search.window.filterTube.updateSettings(settings());
  for (let i = 0; i < 14; i++) {
    await fetchEndpoint(search, 'search', i);
  }

  assert.equal(search.window.filterTube.lastYtSearchResponse.id, 13);
  assert.equal(search.window.filterTube.lastYtSearchResponse.processedBy, 'fetch:/youtubei/v1/search');
  assert.equal(search.window.filterTube.lastYtSearchResponseName, 'fetch:/youtubei/v1/search');
  assert.equal(typeof search.window.filterTube.lastYtSearchResponseTs, 'number');
  assert.equal(search.window.filterTube.recentYtSearchResponses.length, 12);
  assert.equal(search.window.filterTube.recentYtSearchResponses[0].data.id, 2);
  assert.equal(search.window.filterTube.recentYtSearchResponses.at(-1).data.id, 13);
  assert.ok(search.window.filterTube.recentYtSearchResponses.every((entry) => entry.name === 'fetch:/youtubei/v1/search'));
  assert.ok(search.window.filterTube.recentYtSearchResponses.every((entry) => typeof entry.ts === 'number'));

  const browse = loadSnapshotRuntime();
  browse.window.filterTube.updateSettings(settings());
  for (let i = 0; i < 13; i++) {
    await fetchEndpoint(browse, 'browse', i);
  }

  assert.equal(browse.window.filterTube.lastYtBrowseResponse.id, 12);
  assert.equal(browse.window.filterTube.lastYtBrowseResponse.processedBy, 'fetch:/youtubei/v1/browse');
  assert.equal(browse.window.filterTube.lastYtBrowseResponseName, 'fetch:/youtubei/v1/browse');
  assert.equal(typeof browse.window.filterTube.lastYtBrowseResponseTs, 'number');
  assert.equal(browse.window.filterTube.recentYtBrowseResponses.length, 12);
  assert.equal(browse.window.filterTube.recentYtBrowseResponses[0].data.id, 1);
  assert.equal(browse.window.filterTube.recentYtBrowseResponses.at(-1).data.id, 12);
  assert.ok(browse.window.filterTube.recentYtBrowseResponses.every((entry) => entry.name === 'fetch:/youtubei/v1/browse'));
});

test('next and player snapshots keep latest processed objects without recent arrays', async () => {
  const runtime = loadSnapshotRuntime();
  runtime.window.filterTube.updateSettings(settings());

  await fetchEndpoint(runtime, 'next', 7);
  await fetchEndpoint(runtime, 'player', 9);

  assert.equal(runtime.window.filterTube.lastYtNextResponse.id, 7);
  assert.equal(runtime.window.filterTube.lastYtNextResponse.processedBy, 'fetch:/youtubei/v1/next');
  assert.equal(runtime.window.filterTube.lastYtNextResponseName, 'fetch:/youtubei/v1/next');
  assert.equal(typeof runtime.window.filterTube.lastYtNextResponseTs, 'number');
  assert.equal(runtime.window.filterTube.recentYtNextResponses, undefined);

  assert.equal(runtime.window.filterTube.lastYtPlayerResponse.id, 9);
  assert.equal(runtime.window.filterTube.lastYtPlayerResponse.processedBy, 'fetch:/youtubei/v1/player');
  assert.equal(runtime.window.filterTube.lastYtPlayerResponseName, 'fetch:/youtubei/v1/player');
  assert.equal(typeof runtime.window.filterTube.lastYtPlayerResponseTs, 'number');
  assert.equal(runtime.window.filterTube.recentYtPlayerResponses, undefined);
});

test('guide endpoint is processed and returned but has no network snapshot family', async () => {
  const runtime = loadSnapshotRuntime();
  runtime.window.filterTube.updateSettings(settings());

  const guideBody = await fetchEndpoint(runtime, 'guide', 3);

  assert.equal(guideBody.endpoint, 'guide');
  assert.equal(guideBody.processedBy, 'fetch:/youtubei/v1/guide');
  assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), ['fetch:/youtubei/v1/guide']);
  assert.equal(runtime.window.filterTube.lastYtGuideResponse, undefined);
  assert.equal(runtime.window.filterTube.lastYtSearchResponse, undefined);
  assert.equal(runtime.window.filterTube.lastYtBrowseResponse, undefined);
  assert.equal(runtime.window.filterTube.lastYtNextResponse, undefined);
  assert.equal(runtime.window.filterTube.lastYtPlayerResponse, undefined);
});

test('no-active-rule search path bypasses harvest-only processing and snapshot writes', async () => {
  const runtime = loadSnapshotRuntime({
    pathname: '/results',
    payloadFor(resource) {
      return {
        endpoint: 'search',
        id: Number(new URL(String(resource), 'https://www.youtube.com').searchParams.get('id') || 0),
        contents: {
          twoColumnSearchResultsRenderer: {
            primaryContents: { sectionListRenderer: { contents: [] } }
          }
        }
      };
    }
  });
  runtime.window.filterTube.updateSettings(settings({ filterKeywords: [] }));

  const body = await fetchEndpoint(runtime, 'search', 21);

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(body.processedBy, undefined);
  assert.equal(runtime.window.filterTube.lastYtSearchResponse, undefined);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses, undefined);
});

test('network snapshot stash contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'seedSnapshotBranches(4): search,next,browse,player',
    'seedFetchEndpointWithoutSnapshotBranch(1): guide',
    'latestSnapshotFields(12): lastYtSearchResponse,lastYtSearchResponseName,lastYtSearchResponseTs,lastYtNextResponse,lastYtNextResponseName,lastYtNextResponseTs,lastYtBrowseResponse,lastYtBrowseResponseName,lastYtBrowseResponseTs,lastYtPlayerResponse,lastYtPlayerResponseName,lastYtPlayerResponseTs',
    'recentSnapshotArrays(2): recentYtSearchResponses,recentYtBrowseResponses',
    'recentSnapshotEntryFields(3): data,name,ts',
    'recentSnapshotRetainTail(1): 12',
    'stashCallsites(3): harvestOnlySkip,engineResult,engineFallback',
    'initialGlobalSnapshotAssignments(2): lastYtInitialData,lastYtInitialPlayerResponse',
    'injectorConsumerClusters(3): subscriptionImportSeed,subscriptionImportTimestamp,identitySearchRoots',
    'injectorRecentBrowseConsumerClusters(2): importSeedCandidates,importTimestamp',
    'injectorRecentSearchConsumerClusters(2): searchTargets,secondaryRoots',
    'injectorLatestEndpointConsumerClusters(4): search,next,browse,player',
    'runtimeSnapshotFixtures(8): latestSearch,latestNext,latestBrowse,latestPlayer,recentSearchCap,recentBrowseCap,guideNoSnapshot,harvestOnlyOriginalSnapshot'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'snapshotOwner',
    'snapshotAdmissionDecision',
    'transport',
    'endpoint',
    'parsedPathname',
    'rawUrl',
    'dataName',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevision',
    'activeRuleState',
    'sourceEffect',
    'mutationState',
    'harvestState',
    'snapshotFamily',
    'latestField',
    'recentField',
    'recentCap',
    'consumerCluster',
    'consumerReadLimit',
    'snapshotTimestamp',
    'snapshotAgeMs',
    'freshnessPolicy',
    'clonePolicy',
    'retentionPolicy',
    'guideEndpointPolicy',
    'nextHistoryPolicy',
    'playerHistoryPolicy',
    'consumerRoutePermission',
    'consumerProfilePermission',
    'staleSnapshotFixture',
    'missingSnapshotFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstNetworkSnapshotStashContract',
    'jsonFirstNetworkSnapshotAdmissionDecision',
    'jsonFirstNetworkSnapshotEndpointPolicy',
    'jsonFirstNetworkSnapshotFreshnessReport',
    'jsonFirstNetworkSnapshotClonePolicy',
    'jsonFirstNetworkSnapshotConsumerPermission',
    'jsonFirstNetworkSnapshotGuidePolicy',
    'jsonFirstNetworkSnapshotFixtureProvenance',
    'jsonFirstNetworkSnapshotMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
