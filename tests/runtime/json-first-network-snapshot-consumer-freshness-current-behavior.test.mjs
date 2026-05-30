import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md';

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

function loadInjectorRuntime(options = {}) {
  const source = read('js/injector.js');
  const marker = '})(); // End of IIFE';
  assert.ok(source.includes(marker), 'injector IIFE marker must exist for audit exports');
  const instrumented = source.replace(
    marker,
    [
      'window.__filterTubeAuditExports = {',
      '  collectSubscriptionImportPageSeed,',
      '  getLatestSubscriptionImportBrowseSnapshotTs,',
      '  searchYtInitialDataForVideoChannel,',
      '  searchYtInitialDataForCollaborators',
      '};',
      marker
    ].join('\n')
  );

  const timers = { intervals: [], timeouts: [] };
  const messages = [];
  const listeners = {};
  const locationObject = {
    hostname: options.hostname || 'www.youtube.com',
    pathname: options.pathname || '/watch',
    search: options.search || '',
    origin: 'https://www.youtube.com'
  };

  class EventStub {
    constructor(type) {
      this.type = type;
    }
  }

  class CustomEventStub extends EventStub {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  }

  class NodeStub {}
  class ElementStub extends NodeStub {}

  const documentObject = {
    location: locationObject,
    documentElement: {
      getAttribute() {
        return null;
      }
    },
    body: {
      appendChild() {},
      removeChild() {}
    },
    addEventListener(type, handler) {
      listeners[`document:${type}`] = handler;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return new ElementStub();
    }
  };

  const windowObject = {
    filterTube: options.filterTube || {},
    ytInitialData: options.ytInitialData,
    ytInitialPlayerResponse: options.ytInitialPlayerResponse,
    __filtertubeDebug: false,
    location: locationObject,
    document: documentObject,
    top: null,
    self: null,
    FilterTubeIdentity: {
      extractCustomUrlFromPath(value) {
        const match = String(value || '').match(/\/c\/([^/?#]+)/);
        return match ? `/c/${match[1]}` : '';
      },
      extractChannelIdFromPath(value) {
        const match = String(value || '').match(/\/channel\/(UC[\w-]{22})/i);
        return match ? match[1] : '';
      }
    },
    addEventListener(type, handler) {
      listeners[`window:${type}`] = handler;
    },
    removeEventListener() {},
    postMessage(message) {
      messages.push(message);
    },
    dispatchEvent() {},
    scrollTo() {},
    setTimeout(handler, delay) {
      timers.timeouts.push({ handler, delay });
      return timers.timeouts.length;
    },
    clearTimeout() {},
    setInterval(handler, delay) {
      timers.intervals.push({ handler, delay });
      return timers.intervals.length;
    },
    clearInterval() {}
  };
  windowObject.top = windowObject;
  windowObject.self = windowObject;

  const context = {
    window: windowObject,
    document: documentObject,
    location: locationObject,
    console: {
      log() {},
      debug() {},
      warn() {},
      error() {}
    },
    browser: undefined,
    chrome: undefined,
    fetch: async () => ({
      ok: false,
      status: 500,
      json: async () => ({})
    }),
    AbortController,
    Event: EventStub,
    CustomEvent: CustomEventStub,
    Node: NodeStub,
    Element: ElementStub,
    URL,
    URLSearchParams,
    Date,
    Promise,
    WeakSet,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON,
    setTimeout: windowObject.setTimeout,
    clearTimeout: windowObject.clearTimeout,
    setInterval: windowObject.setInterval,
    clearInterval: windowObject.clearInterval
  };
  context.globalThis = context;
  context.self = windowObject;
  vm.createContext(context);
  vm.runInContext(instrumented, context, { filename: path.join(repoRoot, 'js', 'injector.js') });
  return {
    context,
    window: windowObject,
    exports: windowObject.__filterTubeAuditExports,
    messages,
    timers
  };
}

function ucId(seed = 'a') {
  return `UC${seed.repeat(22)}`;
}

function channelPayload(id, name) {
  return {
    contents: [
      {
        channelRenderer: {
          channelId: id,
          title: { simpleText: name },
          navigationEndpoint: {
            browseEndpoint: {
              browseId: id,
              canonicalBaseUrl: `/channel/${id}`
            }
          },
          thumbnail: { thumbnails: [{ url: `https://yt3.ggpht.com/${id}` }] },
          timestampMs: '1'
        }
      }
    ],
    continuation: {
      nextContinuationData: {
        continuation: `token-${id}`,
        clickTrackingParams: `click-${id}`
      },
      collapsedItemCount: 99
    }
  };
}

function videoSearchPayload(videoId, channelId, name = 'Stale Snapshot Channel') {
  return {
    contents: [
      {
        videoRenderer: {
          videoId,
          navigationEndpoint: {
            browseEndpoint: {
              browseId: channelId,
              canonicalBaseUrl: `/channel/${channelId}`
            }
          },
          shortBylineText: {
            runs: [
              {
                text: name,
                navigationEndpoint: {
                  browseEndpoint: {
                    browseId: channelId,
                    canonicalBaseUrl: `/channel/${channelId}`
                  }
                }
              }
            ]
          }
        }
      }
    ]
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

test('JSON-first network snapshot consumer freshness audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, freshness patch/);
  assert.match(text, /snapshot consumer source files: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('consumer freshness audit records the exact source rows and current counts', () => {
  const text = doc();
  const injector = read('js/injector.js');

  for (const marker of [
    'consumer functions with direct snapshot reads: 4',
    'subscription import snapshot seed functions: 2',
    'identity snapshot consumer functions: 2',
    'recent browse consumer read limit: writer-retained tail',
    'recent search consumer read limit: 6',
    'explicit snapshot max age checks: 0',
    'explicit settings revision gates: 0',
    'explicit current-route permission gates for identity snapshots: 0',
    'runtime stale import fixtures: 2',
    'runtime stale identity fixtures: 2'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  const expectedAnchors = [
    768, 776, 787, 978, 986, 2575, 2743, 2746, 2754, 2757, 2768, 3123, 3126, 3134, 3137
  ];
  for (const line of expectedAnchors) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(injector, 'recentYtSearchResponses.slice(-6)'), 2);
  assert.equal(countLiteral(injector, 'recentYtBrowseResponses'), 4);
  assert.equal(countLiteral(injector, 'lastYtBrowseResponseTs'), 1);
  assert.equal(countLiteral(injector, 'lastYtSearchResponseTs'), 0);
  assert.equal(countLiteral(injector, 'lastYtNextResponseTs'), 0);
  assert.equal(countLiteral(injector, 'lastYtPlayerResponseTs'), 0);
});

test('source consumers currently read snapshots without shared age route or revision gates', () => {
  const injector = read('js/injector.js');
  const importSeed = sliceBetween(
    injector,
    'function collectSubscriptionImportPageSeed(maxChannels)',
    'async function expandSubscriptionsImportPageSeed'
  );
  const timestampPicker = sliceBetween(
    injector,
    'function getLatestSubscriptionImportBrowseSnapshotTs()',
    'async function waitForSubscriptionImportSeed'
  );
  const channelSearch = sliceBetween(
    injector,
    'function searchYtInitialDataForVideoChannel(videoId, expectations = {})',
    '/**\n     * Hybrid search for collaborator info'
  );
  const collaboratorSearch = sliceBetween(
    injector,
    'function searchYtInitialDataForCollaborators(videoId, matcher = null)',
    '    // Function to update seed.js settings'
  );

  assert.match(importSeed, /if \(!isYoutubeChannelsFeedPath\(\)\)/);
  assert.match(importSeed, /window\.filterTube\?\.lastYtBrowseResponse/);
  assert.match(importSeed, /window\.filterTube\.recentYtBrowseResponses\s*\.map\(\(entry\) => entry\?\.data\)/);
  assert.doesNotMatch(importSeed, /lastYtBrowseResponseTs|entry\?\.ts|settingsRevision|maxAge|snapshotAge|freshness|permission/);

  assert.match(timestampPicker, /const latestTs = Number\(latest\?\.ts\) \|\| 0/);
  assert.match(timestampPicker, /const fallbackTs = Number\(window\.filterTube\?\.lastYtBrowseResponseTs\) \|\| 0/);
  assert.doesNotMatch(timestampPicker, /Date\.now|maxAge|snapshotAge|freshness|settingsRevision|permission/);

  assert.match(channelSearch, /window\.filterTube\?\.lastYtSearchResponse/);
  assert.match(channelSearch, /window\.filterTube\.recentYtSearchResponses\.slice\(-6\)/);
  assert.match(channelSearch, /window\.filterTube\?\.lastYtNextResponse/);
  assert.match(channelSearch, /window\.filterTube\?\.lastYtBrowseResponse/);
  assert.match(channelSearch, /window\.filterTube\?\.lastYtPlayerResponse/);
  assert.doesNotMatch(channelSearch, /lastYtSearchResponseTs|lastYtNextResponseTs|lastYtBrowseResponseTs|lastYtPlayerResponseTs|settingsRevision|maxAge|snapshotAge|freshnessPolicy|consumerPermission/);

  assert.match(collaboratorSearch, /window\.filterTube\?\.lastYtSearchResponse/);
  assert.match(collaboratorSearch, /window\.filterTube\.recentYtSearchResponses\.slice\(-6\)/);
  assert.match(collaboratorSearch, /window\.filterTube\?\.lastYtNextResponse/);
  assert.match(collaboratorSearch, /window\.filterTube\?\.lastYtBrowseResponse/);
  assert.doesNotMatch(collaboratorSearch, /lastYtSearchResponseTs|lastYtNextResponseTs|lastYtBrowseResponseTs|settingsRevision|maxAge|snapshotAge|freshnessPolicy|consumerPermission/);
});

test('subscription import currently consumes stale browse snapshot data on channels feed', () => {
  const oldTs = 1;
  const latestId = ucId('a');
  const recentId = ucId('b');
  const runtime = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: channelPayload(latestId, 'Latest stale browse channel'),
      lastYtBrowseResponseTs: oldTs,
      recentYtBrowseResponses: [
        {
          data: channelPayload(recentId, 'Recent stale browse channel'),
          name: 'fetch:/youtubei/v1/browse',
          ts: oldTs
        }
      ]
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(seed.channels.length, 2);
  assert.deepEqual(seed.channels.map((entry) => entry.id).sort(), [latestId, recentId].sort());
  assert.equal(seed.channels.find((entry) => entry.id === latestId).name, 'Latest stale browse channel');
  assert.equal(seed.channels.find((entry) => entry.id === recentId).name, 'Recent stale browse channel');
  assert.equal(runtime.exports.getLatestSubscriptionImportBrowseSnapshotTs(), oldTs);
});

test('subscription import currently blocks snapshots by channels route but not by age', () => {
  const oldTs = 1;
  const latestId = ucId('c');
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    search: '?v=currentVideo',
    filterTube: {
      lastYtBrowseResponse: channelPayload(latestId, 'Wrong route browse channel'),
      lastYtBrowseResponseTs: oldTs,
      recentYtBrowseResponses: [
        {
          data: channelPayload(ucId('d'), 'Wrong route recent channel'),
          name: 'fetch:/youtubei/v1/browse',
          ts: oldTs
        }
      ]
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(seed.channels.length, 0);
  assert.equal(seed.tokens.length, 0);
  assert.equal(seed.continuationRequests.length, 0);
  assert.equal(runtime.exports.getLatestSubscriptionImportBrowseSnapshotTs(), oldTs);
});

test('channel identity currently consumes stale recent search snapshots without a current-watch gate', () => {
  const staleVideoId = 'staleVideo42';
  const currentVideoId = 'currentVideo';
  const channelId = ucId('e');
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    search: `?v=${currentVideoId}`,
    filterTube: {
      recentYtSearchResponses: [
        {
          data: videoSearchPayload(staleVideoId, channelId, 'Stale search channel'),
          name: 'fetch:/youtubei/v1/search',
          ts: 1
        }
      ]
    }
  });

  const result = runtime.exports.searchYtInitialDataForVideoChannel(staleVideoId);
  assert.equal(result.id, channelId);
  assert.equal(result.name, 'Stale search channel');
});

test('channel identity currently reads latest network snapshot roots without timestamp fields', () => {
  const targetVideoId = 'targetVideo99';
  const searchId = ucId('f');
  const nextId = ucId('g');
  const browseId = ucId('h');

  for (const [field, channelId] of [
    ['lastYtSearchResponse', searchId],
    ['lastYtNextResponse', nextId],
    ['lastYtBrowseResponse', browseId]
  ]) {
    const runtime = loadInjectorRuntime({
      pathname: '/watch',
      search: '?v=anotherVideo',
      filterTube: {
        [field]: videoSearchPayload(targetVideoId, channelId, `${field} channel`),
        [`${field}Ts`]: 1
      }
    });

    const result = runtime.exports.searchYtInitialDataForVideoChannel(targetVideoId);
    assert.equal(result.id, channelId, `${field} should be searched without timestamp rejection`);
    assert.equal(result.name, `${field} channel`);
  }
});

test('network snapshot consumer freshness authority symbols are not implemented in runtime source yet', () => {
  const source = productRuntimeSource();
  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerFreshnessContract',
    'jsonFirstNetworkSnapshotAgePolicy',
    'jsonFirstNetworkSnapshotRoutePermission',
    'jsonFirstNetworkSnapshotProfilePermission',
    'jsonFirstNetworkSnapshotSettingsRevisionGate',
    'jsonFirstNetworkSnapshotStaleFixture',
    'jsonFirstNetworkSnapshotCurrentVideoGate',
    'jsonFirstNetworkSnapshotImportAgeBudget'
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\b${missingSymbol}\\b`));
    assert.match(doc(), new RegExp(missingSymbol));
  }
});
