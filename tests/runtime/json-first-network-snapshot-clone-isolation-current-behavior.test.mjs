import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadSeedRuntime(options = {}) {
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
        calls.processData.push({ dataName, settings: clone(activeSettings), data });
        if (options.processData) return options.processData(data, activeSettings, dataName, calls);
        return { ...data, processedBy: dataName };
      },
      harvestOnly(data, activeSettings) {
        calls.harvestOnly.push({ settings: clone(activeSettings), data });
        if (options.harvestOnly) return options.harvestOnly(data, activeSettings, calls);
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
  return {
    response,
    body: await response.json()
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

test('JSON-first network snapshot clone isolation audit is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior reflects the scoped no-active-JSON-work fast-path optimization/);
  assert.match(text, /not an implementation patch, optimization patch, clone patch/);
  assert.match(text, /source files with snapshot clone and reference surface: 2/);
  assert.match(text, /runtime behavior changed: yes/);
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

test('clone isolation audit records direct source rows and missing clone guards', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const injector = read('js/injector.js');
  const stashBlock = sliceBetween(seed, 'function stashNetworkSnapshot(data, dataName)', 'let replayTimer = null;');
  const fetchBlock = sliceBetween(seed, 'window.fetch = function(resource, init)', 'seedDebugLog("✅ Fetch interception established");');
  const importSeedBlock = sliceBetween(
    injector,
    'function collectSubscriptionImportPageSeed(maxChannels)',
    'async function expandSubscriptionsImportPageSeed'
  );

  for (const marker of [
    'direct latest snapshot object assignment sites: 4',
    'direct recent entry data writes: 2',
    'snapshot writer clone callsites: 0',
    'snapshot writer object freeze or seal callsites: 0',
    'normal fetch response stringify sites after processing: 1',
    'subscription import object-identity dedupe sites: 1',
    'runtime latest/recent alias fixtures: 2',
    'runtime latest-only alias fixtures: 2',
    'runtime fallback direct-reference fixtures: 1',
    'runtime no-active-rule bypass fixtures: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [43, 52, 58, 63, 67, 73, 79, 84, 88, 433, 454, 470, 475, 476, 740, 741]) {
    assert.ok(text.includes(`\`js/seed.js:${line}\``), `doc should cite js/seed.js:${line}`);
  }
  for (const line of [787, 788, 789]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(stashBlock, 'new Response'), 0);
  assert.equal(countLiteral(stashBlock, 'structuredClone'), 0);
  assert.equal(countLiteral(stashBlock, 'cloneData('), 0);
  assert.equal(countLiteral(stashBlock, 'Object.freeze'), 0);
  assert.equal(countLiteral(stashBlock, 'Object.seal'), 0);
  assert.equal(countLiteral(stashBlock, 'lastYtSearchResponse = data'), 1);
  assert.equal(countLiteral(stashBlock, 'lastYtNextResponse = data'), 1);
  assert.equal(countLiteral(stashBlock, 'lastYtBrowseResponse = data'), 1);
  assert.equal(countLiteral(stashBlock, 'lastYtPlayerResponse = data'), 1);
  assert.equal(countLiteral(stashBlock, '\n                    data,'), 2);
  assert.match(fetchBlock, /const processed = processWithEngine\(jsonData, dataName\)/);
  assert.equal(countLiteral(fetchBlock, 'JSON.stringify(processed)'), 1);
  assert.match(importSeedBlock, /array\.indexOf\(candidate\) === index/);
});

test('search snapshots store the engine result object directly in latest and recent fields', async () => {
  const resultObject = { endpoint: 'search', marker: 'engine-result', nested: { value: 1 } };
  const runtime = loadSeedRuntime({
    processData() {
      return resultObject;
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  const { body } = await fetchEndpoint(runtime, 'search', 1);

  assert.equal(runtime.window.filterTube.lastYtSearchResponse, resultObject);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses.length, 1);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses[0].data, resultObject);
  runtime.window.filterTube.lastYtSearchResponse.nested.value = 99;
  assert.equal(runtime.window.filterTube.recentYtSearchResponses[0].data.nested.value, 99);
  assert.notEqual(body, resultObject);
  assert.equal(body.nested.value, 1);
});

test('browse snapshots store the engine result object directly in latest and recent fields', async () => {
  const resultObject = { endpoint: 'browse', marker: 'engine-result', nested: { value: 2 } };
  const runtime = loadSeedRuntime({
    processData() {
      return resultObject;
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  const { body } = await fetchEndpoint(runtime, 'browse', 2);

  assert.equal(runtime.window.filterTube.lastYtBrowseResponse, resultObject);
  assert.equal(runtime.window.filterTube.recentYtBrowseResponses.length, 1);
  assert.equal(runtime.window.filterTube.recentYtBrowseResponses[0].data, resultObject);
  runtime.window.filterTube.recentYtBrowseResponses[0].data.nested.value = 77;
  assert.equal(runtime.window.filterTube.lastYtBrowseResponse.nested.value, 77);
  assert.notEqual(body, resultObject);
  assert.equal(body.nested.value, 2);
});

test('next and player snapshots store latest engine result objects without clone or history fields', async () => {
  const nextResult = { endpoint: 'next', marker: 'next-engine-result', nested: { value: 3 } };
  const playerResult = { endpoint: 'player', marker: 'player-engine-result', nested: { value: 4 } };
  const runtime = loadSeedRuntime({
    processData(data, activeSettings, dataName) {
      return dataName.includes('/youtubei/v1/next') ? nextResult : playerResult;
    }
  });
  runtime.window.filterTube.updateSettings(settings());

  const next = await fetchEndpoint(runtime, 'next', 3);
  const player = await fetchEndpoint(runtime, 'player', 4);

  assert.equal(runtime.window.filterTube.lastYtNextResponse, nextResult);
  assert.equal(runtime.window.filterTube.recentYtNextResponses, undefined);
  assert.equal(runtime.window.filterTube.lastYtPlayerResponse, playerResult);
  assert.equal(runtime.window.filterTube.recentYtPlayerResponses, undefined);
  runtime.window.filterTube.lastYtNextResponse.nested.value = 30;
  runtime.window.filterTube.lastYtPlayerResponse.nested.value = 40;
  assert.equal(next.body.nested.value, 3);
  assert.equal(player.body.nested.value, 4);
});

test('engine fallback stashes the same parsed object that failed engine processing', async () => {
  let engineInput = null;
  const runtime = loadSeedRuntime({
    processData(data) {
      engineInput = data;
      throw new Error('forced processData failure');
    }
  });
  runtime.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const { body } = await fetchEndpoint(runtime, 'next', 5);

  assert.equal(runtime.calls.processData.length, 1);
  assert.ok(engineInput);
  assert.equal(runtime.window.filterTube.lastYtNextResponse, engineInput);
  runtime.window.filterTube.lastYtNextResponse.afterFallbackMutation = true;
  assert.equal(engineInput.afterFallbackMutation, true);
  assert.notEqual(body, engineInput);
  assert.equal(body.afterFallbackMutation, undefined);
});

test('no-active-rule search path bypasses parsing processing and snapshot writes', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payloadFor(resource) {
      return {
        endpoint: 'search',
        id: Number(new URL(String(resource), 'https://www.youtube.com').searchParams.get('id') || 0),
        contents: {
          twoColumnSearchResultsRenderer: {
            primaryContents: { sectionListRenderer: { contents: [] } }
          }
        },
        nested: { value: 6 }
      };
    }
  });
  runtime.window.filterTube.updateSettings(settings({ filterKeywords: [] }));

  const { body } = await fetchEndpoint(runtime, 'search', 6);

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.lastYtSearchResponse, undefined);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses, undefined);
  assert.equal(body.nested.value, 6);
});

test('network snapshot clone isolation authority symbols are not implemented in runtime source yet', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const field of [
    'snapshotClonePolicy',
    'snapshotMutationIsolationReport',
    'snapshotReferenceAliasReport',
    'snapshotFreezePolicy',
    'consumerMutationBudget',
    'responseBodyIsolationReport',
    'referenceAliasFixture',
    'cloneIsolationMetricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const missing of [
    'jsonFirstNetworkSnapshotCloneIsolationContract',
    'jsonFirstNetworkSnapshotClonePolicy',
    'jsonFirstNetworkSnapshotMutationIsolationReport',
    'jsonFirstNetworkSnapshotReferenceAliasReport',
    'jsonFirstNetworkSnapshotConsumerMutationBudget',
    'jsonFirstNetworkSnapshotResponseBodyIsolationReport',
    'jsonFirstNetworkSnapshotObjectFreezePolicy',
    'jsonFirstNetworkSnapshotCloneFixtureProvenance'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
