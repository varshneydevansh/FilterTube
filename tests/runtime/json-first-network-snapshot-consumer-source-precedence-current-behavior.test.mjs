import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md';

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
    host: options.host || options.hostname || 'www.youtube.com',
    pathname: options.pathname || '/watch',
    search: options.search || '',
    origin: options.origin || `https://${options.hostname || 'www.youtube.com'}`
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
    timers,
    listeners
  };
}

function ucId(seed = 'a') {
  return `UC${seed.repeat(22)}`;
}

function channelPayload(id, name, timestampMs = '1') {
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
          timestampMs
        }
      }
    ]
  };
}

function videoSearchPayload(videoId, channelId, name = 'Snapshot Channel') {
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

function collaboratorPayload(videoId, ids) {
  return {
    contents: [
      {
        videoRenderer: {
          videoId,
          avatarStackViewModel: {
            avatars: ids.map((id, index) => ({
              avatarViewModel: {
                a11yLabel: `${String.fromCharCode(65 + index)} collaborator`,
                rendererContext: {
                  commandContext: {
                    onTap: {
                      innertubeCommand: {
                        browseEndpoint: {
                          browseId: id,
                          canonicalBaseUrl: `/channel/${id}`
                        }
                      }
                    }
                  }
                }
              }
            }))
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

test('JSON-first network snapshot consumer source precedence audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, source-precedence\s+patch/);
  assert.match(text, /consumer source files with snapshot source-precedence surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('consumer source precedence source rows and authority gaps are pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const importSeed = sliceBetween(
    injector,
    'function collectSubscriptionImportPageSeed(maxChannels)',
    'async function expandSubscriptionsImportPageSeed'
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
  const runtimeSource = productRuntimeSource();

  for (const marker of [
    'subscription import ordered seed candidate arrays: 1',
    'subscription import fixed candidate slots before recent spread: 5',
    'subscription import recent browse spread slots: 1',
    'subscription import merge functions: 1',
    'channel identity ordered target arrays: 1',
    'channel identity root push sites: 10',
    'channel identity first-result break sites: 1',
    'collaborator identity ordered root arrays: 1',
    'collaborator identity root push sites: 7',
    'collaborator identity score arbitration sites: 1',
    'collaborator identity strict-greater score update sites: 1',
    'runtime subscription maxChannels precedence fixtures: 1',
    'runtime subscription duplicate-merge precedence fixtures: 1',
    'runtime channel first-root precedence fixtures: 2',
    'runtime collaborator equal-score tie fixtures: 1',
    'runtime collaborator higher-score later-root fixtures: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [767, 782, 787, 788, 810, 1123, 1865, 1887, 1888, 1889, 1890, 1891, 1892, 1893, 2567, 2733, 2736, 2739, 2743, 2747, 2754, 2757, 2761, 2764, 2768, 3079, 3102, 3113, 3116, 3119, 3123, 3127, 3134, 3137, 3178]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.match(importSeed, /const seedCandidates = \[/);
  assert.match(importSeed, /window\.ytInitialData/);
  assert.match(importSeed, /window\.__INITIAL_DATA__/);
  assert.match(importSeed, /window\.filterTube\?\.lastYtInitialData/);
  assert.match(importSeed, /window\.filterTube\?\.rawYtInitialData/);
  assert.match(importSeed, /window\.filterTube\?\.lastYtBrowseResponse/);
  assert.match(importSeed, /\.\.\.recentBrowseResponses/);
  assert.match(importSeed, /if \(collected\.size >= maxChannels\)/);
  assert.equal(countLiteral(injector, 'function mergeSubscriptionImportEntries(existing, incoming)'), 1);

  assert.equal(countLiteral(channelSearch, 'searchTargets.push'), 10);
  assert.match(channelSearch, /for \(const target of searchTargets\)/);
  assert.match(channelSearch, /if \(result\) break;/);
  assert.match(channelSearch, /filterTube\.lastYtSearchResponse/);
  assert.match(channelSearch, /filterTube\.lastYtNextResponse/);
  assert.match(channelSearch, /filterTube\.lastYtBrowseResponse/);
  assert.match(channelSearch, /filterTube\.lastYtPlayerResponse/);

  assert.equal(countLiteral(collaboratorSearch, 'roots.push'), 7);
  assert.match(collaboratorSearch, /for \(const target of roots\)/);
  assert.match(collaboratorSearch, /score > bestCandidate\.score/);
  assert.match(collaboratorSearch, /filterTube\.lastYtSearchResponse/);
  assert.match(collaboratorSearch, /filterTube\.lastYtNextResponse/);
  assert.match(collaboratorSearch, /filterTube\.lastYtBrowseResponse/);

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerSourcePrecedenceContract',
    'jsonFirstNetworkSnapshotConsumerRootOrderDecision',
    'jsonFirstNetworkSnapshotConsumerWinningRootReport',
    'jsonFirstNetworkSnapshotConsumerRejectedRootReport',
    'jsonFirstNetworkSnapshotConsumerScoreReport',
    'jsonFirstNetworkSnapshotConsumerTiePolicy',
    'jsonFirstNetworkSnapshotConsumerMergePolicy',
    'jsonFirstNetworkSnapshotConsumerFreshnessOverridePolicy',
    'jsonFirstNetworkSnapshotConsumerSourceFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerSourceMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});

test('subscription import maxChannels preserves earlier browse root before recent browse entries', () => {
  const earlierId = ucId('a');
  const laterId = ucId('b');
  const runtime = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: channelPayload(earlierId, 'Earlier browse channel'),
      recentYtBrowseResponses: [
        { data: channelPayload(laterId, 'Later recent channel'), timestamp: 2, endpoint: 'browse' }
      ]
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(1);
  assert.equal(seed.channels.length, 1);
  assert.equal(seed.channels[0].id, earlierId);
  assert.equal(seed.channels[0].name, 'Earlier browse channel');
});

test('subscription import duplicate merge keeps earlier strong name over later duplicate root', () => {
  const channelId = ucId('c');
  const runtime = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: channelPayload(channelId, 'Preferred earlier name', '1'),
      recentYtBrowseResponses: [
        { data: channelPayload(channelId, 'Later duplicate name', '2'), timestamp: 2, endpoint: 'browse' }
      ]
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(seed.channels.length, 1);
  assert.equal(seed.channels[0].id, channelId);
  assert.equal(seed.channels[0].name, 'Preferred earlier name');
});

test('channel identity returns last search snapshot before later next snapshot for same video', () => {
  const videoId = 'sourceVideo42';
  const searchId = ucId('d');
  const nextId = ucId('e');
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    search: `?v=${videoId}`,
    filterTube: {
      lastYtSearchResponse: videoSearchPayload(videoId, searchId, 'Search root channel'),
      lastYtNextResponse: videoSearchPayload(videoId, nextId, 'Next root channel')
    }
  });

  const result = runtime.exports.searchYtInitialDataForVideoChannel(videoId);
  assert.equal(result.id, searchId);
  assert.equal(result.name, 'Search root channel');
});

test('channel identity returns ytInitialData before snapshot roots for same video', () => {
  const videoId = 'pageRootVideo';
  const pageId = ucId('f');
  const searchId = ucId('g');
  const runtime = loadInjectorRuntime({
    pathname: '/results',
    ytInitialData: videoSearchPayload(videoId, pageId, 'Page root channel'),
    filterTube: {
      lastYtSearchResponse: videoSearchPayload(videoId, searchId, 'Snapshot root channel')
    }
  });

  const result = runtime.exports.searchYtInitialDataForVideoChannel(videoId);
  assert.equal(result.id, pageId);
  assert.equal(result.name, 'Page root channel');
});

test('collaborator identity equal-score tie keeps earlier root', () => {
  const videoId = 'tieCollabVideo';
  const earlierIds = [ucId('h'), ucId('i')];
  const laterIds = [ucId('j'), ucId('k')];
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    filterTube: {
      lastYtSearchResponse: collaboratorPayload(videoId, earlierIds),
      lastYtNextResponse: collaboratorPayload(videoId, laterIds)
    }
  });

  const collaborators = runtime.exports.searchYtInitialDataForCollaborators(videoId);
  assert.deepEqual(Array.from(collaborators, (entry) => entry.id).sort(), [...earlierIds].sort());
});

test('collaborator identity higher-scored later root replaces earlier root', () => {
  const videoId = 'higherScoreCollabVideo';
  const earlierIds = [ucId('l'), ucId('m')];
  const laterIds = [ucId('n'), ucId('o'), ucId('p')];
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    filterTube: {
      lastYtSearchResponse: collaboratorPayload(videoId, earlierIds),
      lastYtNextResponse: collaboratorPayload(videoId, laterIds)
    }
  });

  const collaborators = runtime.exports.searchYtInitialDataForCollaborators(videoId);
  assert.deepEqual(Array.from(collaborators, (entry) => entry.id).sort(), [...laterIds].sort());
});
