import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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
      listeners[`document:${type}`] = listeners[`document:${type}`] || [];
      listeners[`document:${type}`].push(handler);
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
      listeners[`window:${type}`] = listeners[`window:${type}`] || [];
      listeners[`window:${type}`].push(handler);
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

function dispatchWindowMessage(runtime, data) {
  const handlers = runtime.listeners['window:message'] || [];
  assert.ok(handlers.length > 0, 'injector message listeners should be registered');
  for (const handler of handlers) {
    handler({ source: runtime.window, data });
  }
}

function ucId(seed = 'a') {
  return `UC${seed.repeat(22)}`;
}

function videoRendererLeaf(videoId, channelId, name = 'Effect Boundary Channel') {
  return {
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
  };
}

function collaboratorVideoLeaf(videoId, ids) {
  return {
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

test('JSON-first network snapshot consumer effect boundary audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';
  const bridgeHash = '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, effect-boundary patch/);
  assert.match(text, /consumer effect-boundary source files: 2/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));

  assert.equal(lineCount(bridge), 13535);
  assert.equal(Buffer.byteLength(bridge), 600459);
  assert.equal(sha256('js/content_bridge.js'), bridgeHash);
  assert.match(text, new RegExp(`\\| \`js/content_bridge\\.js\` \\| 13535 \\| 600459 \\| \`${bridgeHash}\` \\|`));
});

test('consumer effect boundary source rows and current counts are pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');

  const injectorCollaboratorRequest = sliceBetween(
    injector,
    "if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge') {",
    '        // Handle single-channel info request'
  );
  const injectorChannelRequest = sliceBetween(
    injector,
    "if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge') {",
    '    });\n\n    window.filterTubeInjectorBridgeReady'
  );
  const bridgeChannelResponse = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_ChannelInfoResponse') {",
    "    } else if (type === 'FilterTube_CollabDialogData') {"
  );
  const bridgeCollaboratorResponse = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_CollaboratorInfoResponse') {",
    "    } else if (type === 'FilterTube_SubscriptionsImportProgress') {"
  );
  const bridgeUpdateVideoChannelMap = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_UpdateVideoChannelMap') {",
    "    } else if (type === 'FilterTube_UpdateVideoMetaMap') {"
  );
  const bridgePrefetch = sliceBetween(
    bridge,
    'async function prefetchIdentityForCard({ videoId, card }) {',
    'function stampChannelIdentity(card, info, options = {})'
  );
  const bridgeSearchWrapper = sliceBetween(
    bridge,
    'async function searchYtInitialDataForVideoChannel(videoId, options = null) {',
    '/**\n * Deeply inspect a ytInitialData-like object'
  );

  for (const marker of [
    'injector channel info response postMessage sites: 1',
    'injector channel info storage/message/persist/stamp/rerun sites: 0',
    'injector collaborator info response postMessage sites: 1',
    'injector collaborator cache update callsites inside request handling: 2',
    'content bridge channel response pending resolve sites: 1',
    'content bridge channel response persist/stamp/rerun sites: 0',
    'content bridge collaborator response pending resolve sites: 1',
    'content bridge collaborator response applyResolvedCollaborators sites: 1',
    'content bridge update video-channel map persist sites: 1',
    'content bridge update video-channel map stamp sites: 2',
    'content bridge update video-channel map DOM fallback mentions: 2',
    'content bridge prefetch snapshot lookup sites: 2',
    'content bridge prefetch persist video-channel map sites: 3',
    'content bridge search wrapper positive cache writes: 1',
    'content bridge search wrapper negative cache writes: 2',
    'runtime channel request no-cache fixtures: 1',
    'runtime collaborator local-cache fixtures: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [1913, 1928, 1935, 1938, 1950, 1963, 1970, 1976]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }
  for (const line of [1246, 1256, 1293, 1303, 5482, 5490, 5497, 5513, 5522, 5525, 5570, 5591, 5623, 5656, 5662, 5671, 7350, 7431, 7435, 7442]) {
    assert.ok(text.includes(`\`js/content_bridge.js:${line}\``), `doc should cite js/content_bridge.js:${line}`);
  }

  assert.equal(countLiteral(injectorChannelRequest, 'window.postMessage'), 1);
  assert.equal(countLiteral(injectorChannelRequest, 'searchYtInitialDataForVideoChannel'), 1);
  assert.doesNotMatch(injectorChannelRequest, /storage|sendMessage|persistVideoChannelMapping|stampChannelIdentity|applyDOMFallback/);

  assert.equal(countLiteral(injectorCollaboratorRequest, 'window.postMessage'), 1);
  assert.equal(countLiteral(injectorCollaboratorRequest, 'cacheCollaboratorsIfBetter'), 2);
  assert.doesNotMatch(injectorCollaboratorRequest, /storage|sendMessage|persistVideoChannelMapping|stampChannelIdentity|applyDOMFallback/);

  assert.equal(countLiteral(bridgeChannelResponse, 'pending.resolve'), 1);
  assert.doesNotMatch(bridgeChannelResponse, /persistVideoChannelMapping|stampChannelIdentity|applyDOMFallback|applyResolvedCollaborators|browserAPI_BRIDGE\.runtime\.sendMessage/);

  assert.equal(countLiteral(bridgeCollaboratorResponse, 'pending.resolve'), 1);
  assert.equal(countLiteral(bridgeCollaboratorResponse, 'applyResolvedCollaborators'), 1);
  assert.doesNotMatch(bridgeCollaboratorResponse, /persistVideoChannelMapping|stampChannelIdentity|browserAPI_BRIDGE\.runtime\.sendMessage/);

  assert.equal(countLiteral(bridgeUpdateVideoChannelMap, 'persistVideoChannelMapping'), 1);
  assert.equal(countLiteral(bridgeUpdateVideoChannelMap, 'stampChannelIdentity'), 2);
  assert.equal(countLiteral(bridgeUpdateVideoChannelMap, 'applyDOMFallback'), 2);

  assert.equal(countLiteral(bridgePrefetch, 'searchYtInitialDataForVideoChannel'), 2);
  assert.equal(countLiteral(bridgePrefetch, 'persistVideoChannelMapping'), 3);
  assert.equal(countLiteral(bridgePrefetch, 'browserAPI_BRIDGE.runtime.sendMessage'), 1);

  assert.equal(countLiteral(bridgeSearchWrapper, 'requestChannelInfoFromMainWorld'), 1);
  assert.equal(countLiteral(bridgeSearchWrapper, 'ytInitialDataChannelCache.set'), 1);
  assert.equal(countLiteral(bridgeSearchWrapper, 'ytInitialDataChannelNegativeExpiry.set'), 2);
  assert.doesNotMatch(bridgeSearchWrapper, /persistVideoChannelMapping|stampChannelIdentity|applyDOMFallback|browserAPI_BRIDGE\.runtime\.sendMessage/);
});

test('injector channel info response is not retained after the matching snapshot root is removed', () => {
  const videoId = 'effectVideo42';
  const channelId = ucId('e');
  const runtime = loadInjectorRuntime({
    filterTube: {
      lastYtSearchResponse: videoRendererLeaf(videoId, channelId, 'Effect Boundary Channel')
    }
  });

  runtime.messages.length = 0;
  dispatchWindowMessage(runtime, {
    type: 'FilterTube_RequestChannelInfo',
    source: 'content_bridge',
    payload: { videoId, requestId: 'channel-one' }
  });

  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.messages[0].type, 'FilterTube_ChannelInfoResponse');
  assert.equal(runtime.messages[0].source, 'injector');
  assert.equal(runtime.messages[0].payload.videoId, videoId);
  assert.equal(runtime.messages[0].payload.requestId, 'channel-one');
  assert.equal(runtime.messages[0].payload.channel.id, channelId);
  assert.equal(runtime.messages[0].payload.channel.name, 'Effect Boundary Channel');

  runtime.window.filterTube.lastYtSearchResponse = null;
  runtime.messages.length = 0;
  dispatchWindowMessage(runtime, {
    type: 'FilterTube_RequestChannelInfo',
    source: 'content_bridge',
    payload: { videoId, requestId: 'channel-two' }
  });

  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.messages[0].type, 'FilterTube_ChannelInfoResponse');
  assert.equal(runtime.messages[0].payload.videoId, videoId);
  assert.equal(runtime.messages[0].payload.requestId, 'channel-two');
  assert.equal(runtime.messages[0].payload.channel, null);
});

test('injector collaborator info response can be served from local cache after the snapshot root is removed', () => {
  const videoId = 'effectCollab42';
  const collaboratorIds = [ucId('f'), ucId('g')];
  const runtime = loadInjectorRuntime({
    filterTube: {
      lastYtSearchResponse: collaboratorVideoLeaf(videoId, collaboratorIds)
    }
  });

  runtime.messages.length = 0;
  dispatchWindowMessage(runtime, {
    type: 'FilterTube_RequestCollaboratorInfo',
    source: 'content_bridge',
    payload: { videoId, requestId: 'collab-one' }
  });

  const firstResponses = runtime.messages.filter((message) =>
    message.type === 'FilterTube_CollaboratorInfoResponse' && message.payload?.requestId === 'collab-one'
  );
  assert.equal(firstResponses.length, 1);
  assert.equal(firstResponses[0].source, 'injector');
  assert.equal(firstResponses[0].payload.videoId, videoId);
  assert.deepEqual(
    Array.from(firstResponses[0].payload.collaborators, (entry) => entry.id).sort(),
    [...collaboratorIds].sort()
  );

  runtime.window.filterTube.lastYtSearchResponse = null;
  runtime.messages.length = 0;
  dispatchWindowMessage(runtime, {
    type: 'FilterTube_RequestCollaboratorInfo',
    source: 'content_bridge',
    payload: { videoId, requestId: 'collab-two' }
  });

  const secondResponses = runtime.messages.filter((message) =>
    message.type === 'FilterTube_CollaboratorInfoResponse' && message.payload?.requestId === 'collab-two'
  );
  assert.equal(secondResponses.length, 1);
  assert.equal(secondResponses[0].payload.videoId, videoId);
  assert.deepEqual(
    Array.from(secondResponses[0].payload.collaborators, (entry) => entry.id).sort(),
    [...collaboratorIds].sort()
  );
});

test('network snapshot consumer effect boundary authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotConsumerEffectDecision',
    'consumerCluster',
    'requestType',
    'sourceRootLabel',
    'sourceRootTimestamp',
    'route',
    'profileType',
    'listMode',
    'settingsRevision',
    'requestedVideoId',
    'expectedHandle',
    'expectedName',
    'resultConfidence',
    'cacheEffect',
    'mapWriteEffect',
    'domStampEffect',
    'domRerunEffect',
    'hideOrAllowEffect',
    'targetScope',
    'senderClass',
    'messageType',
    'allowedEffects',
    'blockedEffects',
    'fixtureProvenance',
    'metricArtifact'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerEffectBoundaryContract',
    'jsonFirstNetworkSnapshotConsumerEffectDecision',
    'jsonFirstNetworkSnapshotConsumerResponseEffectReport',
    'jsonFirstNetworkSnapshotConsumerCacheEffectReport',
    'jsonFirstNetworkSnapshotConsumerMapWriteEffectReport',
    'jsonFirstNetworkSnapshotConsumerDomStampEffectReport',
    'jsonFirstNetworkSnapshotConsumerDomRerunEffectReport',
    'jsonFirstNetworkSnapshotConsumerTargetScopeReport',
    'jsonFirstNetworkSnapshotConsumerEffectFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerEffectMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
