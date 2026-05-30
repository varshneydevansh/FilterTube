import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md';

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

function nestAtDepth(depth, leaf) {
  let node = leaf;
  for (let i = 0; i < depth; i += 1) {
    node = { child: node };
  }
  return node;
}

function channelRendererLeaf(id, name) {
  return {
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
  };
}

function videoRendererLeaf(videoId, channelId, name = 'Deep Channel') {
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

function recentEntries(count, matchingIndex, payloadFactory) {
  return Array.from({ length: count }, (_, index) => ({
    data: index === matchingIndex
      ? payloadFactory('recentCapVideo', ucId('r'), 'Retained recent channel')
      : payloadFactory(`otherVideo${index}`, ucId(String.fromCharCode(97 + index)), `Other ${index}`),
    timestamp: index + 1,
    endpoint: 'search'
  }));
}

function collaboratorRecentEntries(count, matchingIndex) {
  return Array.from({ length: count }, (_, index) => ({
    data: index === matchingIndex
      ? { contents: [collaboratorVideoLeaf('recentCapCollabVideo', [ucId('s'), ucId('t')])] }
      : { contents: [collaboratorVideoLeaf(`otherCollab${index}`, [ucId('u'), ucId('v')])] },
    timestamp: index + 1,
    endpoint: 'search'
  }));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first network snapshot consumer traversal budget audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, traversal-budget\s+patch/);
  assert.match(text, /consumer source files with snapshot traversal-budget surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('consumer traversal budget source rows and current counts are pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const subscriptionArtifacts = sliceBetween(
    injector,
    'function collectSubscriptionImportArtifacts(root)',
    'function collectSubscriptionImportDomSeed(maxChannels)'
  );
  const channelSearchNode = sliceBetween(
    injector,
    'function searchNode(node, visited)',
    'function searchRoot(root, label)'
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
  const collaboratorExtractor = sliceBetween(
    injector,
    'function extractCollaboratorsFromDataObject(obj)',
    'function searchYtInitialDataForVideoChannel(videoId, expectations = {})'
  );

  for (const marker of [
    'subscription artifact recursive visitor functions: 1',
    'subscription artifact visited sets: 1',
    'subscription artifact explicit depth caps: 0',
    'subscription artifact array slice caps: 0',
    'channel identity root recursive search functions: 1',
    'channel identity root search visited weaksets: 1',
    'channel identity root search explicit depth caps: 0',
    'channel identity recent search retained-root caps: 1',
    'collaborator identity root search depth caps: 1',
    'collaborator identity recent search retained-root caps: 1',
    'collaborator extractor nested depth caps: 2',
    'collaborator extractor nested array caps: 2',
    'runtime deep subscription traversal fixtures: 1',
    'runtime deep channel traversal fixtures: 1',
    'runtime collaborator depth-boundary fixtures: 2',
    'runtime channel recent-search cap fixtures: 2',
    'runtime collaborator recent-search cap fixtures: 2'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [554, 559, 576, 581, 585, 616, 2700, 2813, 2814, 2992, 3028, 3080, 3121, 3123, 2334, 2349, 2375, 2385]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(subscriptionArtifacts, 'const visit = (node) => {'), 1);
  assert.equal(countLiteral(subscriptionArtifacts, 'const visited = new Set();'), 1);
  assert.doesNotMatch(subscriptionArtifacts, /depth\s*[><=]/);
  assert.doesNotMatch(subscriptionArtifacts, /slice\(0/);
  assert.match(subscriptionArtifacts, /for \(let i = 0; i < node\.length; i \+= 1\)/);

  assert.equal(countLiteral(channelSearchNode, 'function searchNode(node, visited)'), 1);
  assert.doesNotMatch(channelSearchNode, /depth\s*[><=]/);
  assert.doesNotMatch(channelSearchNode, /slice\(0/);
  assert.match(channelSearch, /const visited = new WeakSet\(\);\s+const result = searchNode\(root, visited\)/);
  assert.equal(countLiteral(channelSearch, 'recentYtSearchResponses.slice(-6)'), 1);

  assert.equal(countLiteral(collaboratorSearch, 'depth > 12'), 1);
  assert.equal(countLiteral(collaboratorSearch, 'recentYtSearchResponses.slice(-6)'), 1);
  assert.equal(countLiteral(collaboratorExtractor, 'depth > 10'), 2);
  assert.equal(countLiteral(collaboratorExtractor, 'slice(0, 25)'), 2);
});

test('subscription import can collect a deeply nested channel renderer without an explicit depth cap', () => {
  const channelId = ucId('a');
  const runtime = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: nestAtDepth(24, channelRendererLeaf(channelId, 'Deep subscription channel'))
    }
  });

  const seed = runtime.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(seed.channels.length, 1);
  assert.equal(seed.channels[0].id, channelId);
  assert.equal(seed.channels[0].name, 'Deep subscription channel');
});

test('channel identity can find a deeply nested video renderer without an explicit root-search depth cap', () => {
  const videoId = 'deepVideo42';
  const channelId = ucId('b');
  const runtime = loadInjectorRuntime({
    pathname: '/watch',
    search: `?v=${videoId}`,
    filterTube: {
      lastYtSearchResponse: nestAtDepth(24, videoRendererLeaf(videoId, channelId, 'Deep identity channel'))
    }
  });

  const result = runtime.exports.searchYtInitialDataForVideoChannel(videoId);
  assert.equal(result.id, channelId);
  assert.equal(result.name, 'Deep identity channel');
});

test('collaborator identity depth boundary finds depth 12 and drops depth 13', () => {
  const videoId = 'depthBoundCollabVideo';
  const ids = [ucId('c'), ucId('d')];
  const atDepth12 = loadInjectorRuntime({
    filterTube: {
      lastYtSearchResponse: nestAtDepth(12, collaboratorVideoLeaf(videoId, ids))
    }
  });
  const atDepth13 = loadInjectorRuntime({
    filterTube: {
      lastYtSearchResponse: nestAtDepth(13, collaboratorVideoLeaf(videoId, ids))
    }
  });

  const found = atDepth12.exports.searchYtInitialDataForCollaborators(videoId);
  assert.deepEqual(Array.from(found, (entry) => entry.id).sort(), [...ids].sort());
  assert.equal(atDepth13.exports.searchYtInitialDataForCollaborators(videoId), null);
});

test('channel identity recent search traversal uses only the last six recent roots', () => {
  const outsideWindow = loadInjectorRuntime({
    filterTube: {
      recentYtSearchResponses: recentEntries(7, 0, videoRendererLeaf)
    }
  });
  const insideWindow = loadInjectorRuntime({
    filterTube: {
      recentYtSearchResponses: recentEntries(7, 1, videoRendererLeaf)
    }
  });

  assert.equal(outsideWindow.exports.searchYtInitialDataForVideoChannel('recentCapVideo'), null);
  const retained = insideWindow.exports.searchYtInitialDataForVideoChannel('recentCapVideo');
  assert.equal(retained.id, ucId('r'));
  assert.equal(retained.name, 'Retained recent channel');
});

test('collaborator identity recent search traversal uses only the last six recent roots', () => {
  const outsideWindow = loadInjectorRuntime({
    filterTube: {
      recentYtSearchResponses: collaboratorRecentEntries(7, 0)
    }
  });
  const insideWindow = loadInjectorRuntime({
    filterTube: {
      recentYtSearchResponses: collaboratorRecentEntries(7, 1)
    }
  });

  assert.equal(outsideWindow.exports.searchYtInitialDataForCollaborators('recentCapCollabVideo'), null);
  const retained = insideWindow.exports.searchYtInitialDataForCollaborators('recentCapCollabVideo');
  assert.deepEqual(Array.from(retained, (entry) => entry.id).sort(), [ucId('s'), ucId('t')].sort());
});

test('network snapshot consumer traversal budget authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotConsumerTraversalDecision',
    'consumerCluster',
    'rootLabel',
    'rootFamily',
    'route',
    'profileType',
    'listMode',
    'enabled',
    'settingsRevision',
    'requestedVideoId',
    'maxDepth',
    'visitedNodeCount',
    'visitedArrayItemCount',
    'retainedRecentRootCount',
    'skippedRecentRootCount',
    'cutoffReason',
    'winnerDepth',
    'candidateDepth',
    'traversalDurationMs',
    'metricArtifact',
    'fixtureProvenance'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotConsumerTraversalBudgetContract',
    'jsonFirstNetworkSnapshotConsumerTraversalDecision',
    'jsonFirstNetworkSnapshotConsumerVisitedNodeReport',
    'jsonFirstNetworkSnapshotConsumerDepthPolicy',
    'jsonFirstNetworkSnapshotConsumerArrayCapPolicy',
    'jsonFirstNetworkSnapshotConsumerRecentRootHorizon',
    'jsonFirstNetworkSnapshotConsumerCutoffReason',
    'jsonFirstNetworkSnapshotConsumerTraversalMetricArtifact',
    'jsonFirstNetworkSnapshotConsumerTraversalFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerTraversalDurationReport'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
