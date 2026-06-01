import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const networkSnapshotFamilyDocs = [
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
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
    __INITIAL_DATA__: options.__INITIAL_DATA__,
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

function collaboratorPayload(videoId, ids, labelPrefix = 'Collaborator') {
  return {
    contents: [
      {
        videoRenderer: {
          videoId,
          avatarStackViewModel: {
            avatars: ids.map((id, index) => ({
              avatarViewModel: {
                a11yLabel: `${labelPrefix} ${index + 1}`,
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

test('JSON-first network snapshot source precedence audit is audit-only and source pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const injectorHash = '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, source-precedence\s+patch/);
  assert.match(text, /consumer source files with snapshot source precedence surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), injectorHash);
  assert.match(text, new RegExp(`\\| \`js/injector\\.js\` \\| 3593 \\| 155830 \\| \`${injectorHash}\` \\|`));
});

test('network snapshot family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  assert.match(methodGap, /repo-wide lexical callables: 5673/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5673/);

  assert.equal(networkSnapshotFamilyDocs.length, 15);
  for (const familyDocPath of networkSnapshotFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5673/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5673/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('snapshot source precedence source rows and current counts are pinned', () => {
  const text = doc();
  const injector = read('js/injector.js');
  const importSeed = sliceBetween(
    injector,
    'function collectSubscriptionImportPageSeed(maxChannels)',
    'function buildSubscriptionImportContext'
  );
  const mergeHelper = sliceBetween(
    injector,
    'function mergeSubscriptionImportEntries(existing, incoming)',
    'function getSubscriptionsImportTrackedMatches'
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

  for (const marker of [
    'subscription import fixed seed candidates before recent spread: 5',
    'subscription import recent browse spread sites: 1',
    'subscription import merge sites in page seed: 2',
    'channel identity search target push sites: 10',
    'channel identity recent search spread sites: 1',
    'channel identity first-result break sites: 1',
    'collaborator identity root push sites: 7',
    'collaborator identity recent search spread sites: 1',
    'collaborator identity strict greater-score replacement sites: 1',
    'runtime subscription latest-before-recent fixtures: 2',
    'runtime channel first-root fixtures: 3',
    'runtime collaborator scoring fixtures: 2'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [782, 787, 788, 796, 810, 825, 837, 1123, 1135, 1142, 1149, 2730, 2743, 2747, 2754, 2757, 2768, 3075, 3079, 3112, 3123, 3127, 3134, 3137, 1865, 3178, 3204]) {
    assert.ok(text.includes(`\`js/injector.js:${line}\``), `doc should cite js/injector.js:${line}`);
  }

  assert.equal(countLiteral(importSeed, 'window.filterTube?.lastYtBrowseResponse'), 1);
  assert.equal(countLiteral(importSeed, '...recentBrowseResponses'), 1);
  assert.equal(countLiteral(importSeed, 'mergeSubscriptionImportEntries(existing, normalized)'), 2);
  assert.match(mergeHelper, /\.\.\.existing/);
  assert.match(mergeHelper, /name: \(existingLooksWeak && incomingName\) \? incomingName : \(existingName \|\| incomingName \|\| ''\)/);
  assert.match(mergeHelper, /addedAt: Math\.min/);
  assert.equal(countLiteral(channelSearch, 'searchTargets.push({ root:'), 10);
  assert.match(channelSearch, /if \(result\) break/);
  assert.equal(countLiteral(collaboratorSearch, 'roots.push({ root:'), 7);
  assert.match(collaboratorSearch, /score >= 0 && \(!bestCandidate \|\| score > bestCandidate\.score\)/);
});

test('subscription import uses latest browse before recent browse for channel budget and duplicate merge', () => {
  const latestId = ucId('a');
  const recentId = ucId('b');
  const runtime = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: channelPayload(latestId, 'Latest browse channel', '20'),
      recentYtBrowseResponses: [
        {
          data: channelPayload(recentId, 'Recent browse channel', '10'),
          name: 'fetch:/youtubei/v1/browse',
          ts: 10
        }
      ]
    }
  });

  const one = runtime.exports.collectSubscriptionImportPageSeed(1);
  assert.equal(one.channels.length, 1);
  assert.equal(one.channels[0].id, latestId);
  assert.equal(one.channels[0].name, 'Latest browse channel');

  const sameId = ucId('c');
  const duplicate = loadInjectorRuntime({
    pathname: '/feed/channels',
    filterTube: {
      lastYtBrowseResponse: channelPayload(sameId, 'Latest strong name', '20'),
      recentYtBrowseResponses: [
        {
          data: channelPayload(sameId, 'Recent replacement name', '10'),
          name: 'fetch:/youtubei/v1/browse',
          ts: 10
        }
      ]
    }
  });
  const merged = duplicate.exports.collectSubscriptionImportPageSeed(10);
  assert.equal(merged.channels.length, 1);
  assert.equal(merged.channels[0].id, sameId);
  assert.equal(merged.channels[0].name, 'Latest strong name');
  assert.equal(merged.channels[0].addedAt, 10);
});

test('channel identity currently returns the first successful source root', () => {
  const videoId = 'priorityVideo42';
  const initialId = ucId('d');
  const searchId = ucId('e');
  const recentId = ucId('f');
  const nextId = ucId('g');

  const initialFirst = loadInjectorRuntime({
    pathname: '/watch',
    search: '?v=anotherVideo',
    ytInitialData: videoSearchPayload(videoId, initialId, 'Initial channel'),
    filterTube: {
      lastYtSearchResponse: videoSearchPayload(videoId, searchId, 'Search channel')
    }
  });
  assert.equal(initialFirst.exports.searchYtInitialDataForVideoChannel(videoId).id, initialId);

  const latestSearchFirst = loadInjectorRuntime({
    pathname: '/watch',
    search: '?v=anotherVideo',
    filterTube: {
      lastYtSearchResponse: videoSearchPayload(videoId, searchId, 'Search channel'),
      recentYtSearchResponses: [
        {
          data: videoSearchPayload(videoId, recentId, 'Recent channel'),
          name: 'fetch:/youtubei/v1/search',
          ts: 30
        }
      ]
    }
  });
  assert.equal(latestSearchFirst.exports.searchYtInitialDataForVideoChannel(videoId).id, searchId);

  const searchBeforeNext = loadInjectorRuntime({
    pathname: '/watch',
    search: '?v=anotherVideo',
    filterTube: {
      lastYtSearchResponse: videoSearchPayload(videoId, searchId, 'Search channel'),
      lastYtNextResponse: videoSearchPayload(videoId, nextId, 'Next channel')
    }
  });
  assert.equal(searchBeforeNext.exports.searchYtInitialDataForVideoChannel(videoId).id, searchId);
});

test('collaborator identity uses score replacement, with equal scores preserving earlier roots', () => {
  const videoId = 'collabPriority42';
  const searchTwo = [ucId('h'), ucId('i')];
  const nextThree = [ucId('j'), ucId('k'), ucId('l')];

  const higherScoreLater = loadInjectorRuntime({
    pathname: '/watch',
    filterTube: {
      lastYtSearchResponse: collaboratorPayload(videoId, searchTwo, 'Search collaborator'),
      lastYtNextResponse: collaboratorPayload(videoId, nextThree, 'Next collaborator')
    }
  });
  const higher = higherScoreLater.exports.searchYtInitialDataForCollaborators(videoId);
  assert.deepEqual(Array.from(higher, (entry) => entry.id).sort(), nextThree.slice().sort());

  const searchEqual = [ucId('m'), ucId('n')];
  const nextEqual = [ucId('o'), ucId('p')];
  const equalScoreEarlier = loadInjectorRuntime({
    pathname: '/watch',
    filterTube: {
      lastYtSearchResponse: collaboratorPayload(videoId, searchEqual, 'Search equal'),
      lastYtNextResponse: collaboratorPayload(videoId, nextEqual, 'Next equal')
    }
  });
  const equal = equalScoreEarlier.exports.searchYtInitialDataForCollaborators(videoId);
  assert.deepEqual(Array.from(equal, (entry) => entry.id).sort(), searchEqual.slice().sort());
});

test('network snapshot source precedence authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotSourcePrecedenceDecision',
    'consumerCluster',
    'requestedVideoId',
    'candidateRootLabel',
    'candidateSnapshotFamily',
    'candidateTimestamp',
    'candidateSettingsRevision',
    'candidateRoute',
    'candidateProfileType',
    'candidateListMode',
    'candidateScore',
    'winnerRootLabel',
    'winnerReason',
    'tiePolicy',
    'fieldMergePolicy',
    'fieldSourceProvenance',
    'budgetStopReason',
    'staleConflictReport',
    'metricArtifact'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotSourcePrecedenceContract',
    'jsonFirstNetworkSnapshotSourcePrecedenceDecision',
    'jsonFirstNetworkSnapshotConsumerWinnerReport',
    'jsonFirstNetworkSnapshotSourceTiePolicy',
    'jsonFirstNetworkSnapshotFieldMergeProvenance',
    'jsonFirstNetworkSnapshotStaleConflictReport',
    'jsonFirstNetworkSnapshotCandidateScoreReport',
    'jsonFirstNetworkSnapshotBudgetStopReason',
    'jsonFirstNetworkSnapshotSourceFixtureProvenance',
    'jsonFirstNetworkSnapshotSourceMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
