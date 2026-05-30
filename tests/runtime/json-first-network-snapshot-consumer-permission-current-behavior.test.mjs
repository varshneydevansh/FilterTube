import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md';

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

function disabledKidsWhitelistSettings() {
  return {
    enabled: false,
    profileType: 'kids',
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: []
  };
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

function collaboratorPayload(videoId, firstId, secondId) {
  return {
    contents: [
      {
        videoRenderer: {
          videoId,
          avatarStackViewModel: {
            avatars: [
              {
                avatarViewModel: {
                  a11yLabel: 'Alpha collaborator',
                  rendererContext: {
                    commandContext: {
                      onTap: {
                        innertubeCommand: {
                          browseEndpoint: {
                            browseId: firstId,
                            canonicalBaseUrl: `/channel/${firstId}`
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                avatarViewModel: {
                  a11yLabel: 'Beta collaborator',
                  rendererContext: {
                    commandContext: {
                      onTap: {
                        innertubeCommand: {
                          browseEndpoint: {
                            browseId: secondId,
                            canonicalBaseUrl: `/channel/${secondId}`
                          }
                        }
                      }
                    }
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

test('JSON-first network snapshot consumer permission audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, consumer-permission\s+patch/);
  assert.match(text, /consumer source files with snapshot permission surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('consumer permission source rows and current counts are pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');

  for (const marker of [
    'consumer functions with direct snapshot reads: 4',
    'subscription import route gates: 1',
    'identity watch-context calculations: 1',
    'identity current-video calculations: 1',
    'snapshot consumer currentSettings reads: 0',
    'snapshot consumer settingsReceived reads: 0',
    'snapshot consumer profile/list-mode reads: 0',
    'snapshot consumer enabled-state reads: 0',
    'runtime host-agnostic import fixtures: 3',
    'runtime settings-mirror import fixtures: 1',
    'runtime route-agnostic identity fixtures: 3',
    'runtime settings-mirror identity fixtures: 2',
    'runtime collaborator snapshot permission fixtures: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [133, 142, 520, 767, 776, 787, 976, 986, 1933, 1934, 2567, 2590, 2597, 2743, 2746, 2754, 2757, 2768, 3102, 3123, 3126, 3134, 3137, 3339]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(injector, 'function collectSubscriptionImportPageSeed(maxChannels)'), 1);
  assert.equal(countLiteral(injector, 'function getLatestSubscriptionImportBrowseSnapshotTs()'), 1);
  assert.equal(countLiteral(injector, 'function searchYtInitialDataForVideoChannel(videoId, expectations = {})'), 1);
  assert.equal(countLiteral(injector, 'function searchYtInitialDataForCollaborators(videoId, matcher = null)'), 1);
  assert.equal(countLiteral(injector, 'return String(location?.pathname || \'\') === \'/feed/channels\';'), 1);
  assert.equal(countLiteral(injector, 'const isWatchContext = (() => {'), 1);
  assert.equal(countLiteral(injector, 'const isCurrentWatchVideo = (() => {'), 1);
});

test('snapshot consumer root-selection blocks do not read shared settings permission fields', () => {
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
  assert.match(timestampPicker, /window\.filterTube\?\.lastYtBrowseResponseTs/);
  assert.match(channelSearch, /window\.filterTube\?\.lastYtSearchResponse/);
  assert.match(channelSearch, /window\.filterTube\?\.lastYtPlayerResponse/);
  assert.match(collaboratorSearch, /window\.filterTube\?\.lastYtSearchResponse/);
  assert.match(collaboratorSearch, /window\.filterTube\?\.lastYtBrowseResponse/);

  for (const block of [importSeed, timestampPicker, channelSearch, collaboratorSearch]) {
    assert.doesNotMatch(block, /\bcurrentSettings\b/);
    assert.doesNotMatch(block, /\bsettingsReceived\b/);
    assert.doesNotMatch(block, /\bprofileType\b/);
    assert.doesNotMatch(block, /\blistMode\b/);
    assert.doesNotMatch(block, /\benabled\b/);
    assert.doesNotMatch(block, /\bsettingsRevision\b/);
    assert.doesNotMatch(block, /\bconsumerPermission\b/);
  }
});

test('subscription import consumes browse snapshots across hosts and disabled settings mirror on channels feed', () => {
  for (const hostname of ['www.youtube.com', 'music.youtube.com', 'm.youtube.com']) {
    const channelId = ucId(hostname.startsWith('music') ? 'm' : hostname.startsWith('m.') ? 'b' : 'a');
    const runtime = loadInjectorRuntime({
      hostname,
      pathname: '/feed/channels',
      filterTube: {
        settings: disabledKidsWhitelistSettings(),
        lastYtBrowseResponse: channelPayload(channelId, `${hostname} channel`),
        lastYtBrowseResponseTs: 1
      }
    });

    const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
    assert.equal(seed.channels.length, 1, hostname);
    assert.equal(seed.channels[0].id, channelId, hostname);
    assert.equal(seed.channels[0].name, `${hostname} channel`, hostname);
    assert.equal(runtime.exports.getLatestSubscriptionImportBrowseSnapshotTs(), 1);
  }
});

test('subscription import route gate still blocks browse snapshots off channels feed', () => {
  const channelId = ucId('c');
  const runtime = loadInjectorRuntime({
    hostname: 'music.youtube.com',
    pathname: '/watch',
    search: '?v=currentVideo',
    filterTube: {
      settings: disabledKidsWhitelistSettings(),
      lastYtBrowseResponse: channelPayload(channelId, 'Route blocked channel'),
      lastYtBrowseResponseTs: 1
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(seed.channels.length, 0);
  assert.equal(seed.tokens.length, 0);
  assert.equal(seed.continuationRequests.length, 0);
  assert.equal(runtime.exports.getLatestSubscriptionImportBrowseSnapshotTs(), 1);
});

test('channel identity consumes search snapshots across routes with disabled settings mirror', () => {
  const videoId = 'routeVideo42';
  for (const [pathname, search, seed] of [
    ['/watch', '?v=differentVideo', 'd'],
    ['/results', '?search_query=needle', 'e'],
    ['/shorts', '', 'f']
  ]) {
    const channelId = ucId(seed);
    const runtime = loadInjectorRuntime({
      pathname,
      search,
      filterTube: {
        settings: disabledKidsWhitelistSettings(),
        lastYtSearchResponse: videoSearchPayload(videoId, channelId, `${pathname} channel`),
        lastYtSearchResponseTs: 1
      }
    });

    const result = runtime.exports.searchYtInitialDataForVideoChannel(videoId);
    assert.equal(result.id, channelId, pathname);
    assert.equal(result.name, `${pathname} channel`, pathname);
  }
});

test('collaborator identity consumes search snapshots on shorts with disabled settings mirror', () => {
  const videoId = 'collabVideo42';
  const firstId = ucId('g');
  const secondId = ucId('h');
  const runtime = loadInjectorRuntime({
    pathname: '/shorts',
    filterTube: {
      settings: disabledKidsWhitelistSettings(),
      lastYtSearchResponse: collaboratorPayload(videoId, firstId, secondId),
      lastYtSearchResponseTs: 1
    }
  });

  const collaborators = runtime.exports.searchYtInitialDataForCollaborators(videoId);
  assert.equal(collaborators.length, 2);
  assert.deepEqual(Array.from(collaborators, (entry) => entry.id).sort(), [firstId, secondId].sort());
});

test('network snapshot consumer permission authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotConsumerPermissionDecision',
    'snapshotConsumerCluster',
    'snapshotConsumerReason',
    'snapshotProducerRevision',
    'snapshotSettingsRevision',
    'snapshotFamily',
    'snapshotName',
    'snapshotAge',
    'route',
    'surface',
    'hostname',
    'profileType',
    'listMode',
    'enabled',
    'currentVideoId',
    'requestedVideoId',
    'readAllowed',
    'readDeniedReason'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerPermissionContract',
    'jsonFirstNetworkSnapshotConsumerPermissionDecision',
    'jsonFirstNetworkSnapshotConsumerClusterReport',
    'jsonFirstNetworkSnapshotConsumerSettingsRevisionGate',
    'jsonFirstNetworkSnapshotConsumerRoutePolicy',
    'jsonFirstNetworkSnapshotConsumerHostPolicy',
    'jsonFirstNetworkSnapshotConsumerProfilePolicy',
    'jsonFirstNetworkSnapshotConsumerReadReason',
    'jsonFirstNetworkSnapshotConsumerFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
