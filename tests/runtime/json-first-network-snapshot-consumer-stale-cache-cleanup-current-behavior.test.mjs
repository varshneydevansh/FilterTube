import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22.md';

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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.removed = [];
  }

  remove(value) {
    this.removed.push(value);
    this.owner.classes.delete(value);
  }
}

class FakeStyle {
  constructor() {
    this.removed = [];
  }

  removeProperty(name) {
    this.removed.push(name);
  }
}

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map();
    this.removes = [];
    this.writes = [];
    this.classes = new Set(['filtertube-hidden']);
    this.classList = new FakeClassList(this);
    this.style = new FakeStyle();
    this.wrapper = null;
    this.liveVideoId = '';
    this.linkVideoIds = new Set();
    for (const [key, value] of Object.entries(attrs)) {
      this.attrs.set(key, String(value));
    }
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    this.writes.push([name, String(value)]);
  }

  removeAttribute(name) {
    this.attrs.delete(name);
    this.removes.push(name);
  }

  closest() {
    return this.wrapper;
  }

  querySelector(selector) {
    const text = String(selector || '');
    for (const id of this.linkVideoIds) {
      if (text.includes(id)) return new FakeElement();
    }
    return null;
  }
}

function makeLoadedCard(attrs = {}) {
  return new FakeElement({
    'data-filtertube-video-id': 'oldVideo',
    'data-filtertube-collaborators': JSON.stringify([{ name: 'Old Channel', handle: '@old' }]),
    'data-filtertube-collaborators-source': 'xhr',
    'data-filtertube-collaborators-ts': '123',
    'data-filtertube-expected-collaborators': '2',
    'data-filtertube-collab-state': 'resolved',
    'data-filtertube-collab-awaiting-dialog': 'true',
    'data-filtertube-collab-requested': 'mainworld',
    'data-filtertube-processed': 'true',
    'data-filtertube-last-processed-id': 'oldVideo',
    'data-filtertube-unique-id': 'unique-old',
    'data-filtertube-duration': '1:23',
    'data-filtertube-hidden': 'true',
    'data-filtertube-hidden-by-channel': 'true',
    'data-filtertube-hidden-by-keyword': 'true',
    'data-filtertube-hidden-by-duration': 'true',
    'data-filtertube-hidden-by-upload-date': 'true',
    'data-filtertube-hidden-by-category': 'true',
    'data-filtertube-hidden-by-hide-all-shorts': 'true',
    'data-filtertube-channel-id': 'UCOLDOLDOLDOLDOLDOLDOL',
    'data-filtertube-channel-handle': '@old',
    'data-filtertube-channel-name': 'Old Channel',
    'data-filtertube-channel-custom': '/c/old',
    'data-filtertube-blocked-channel-id': 'UCOLDOLDOLDOLDOLDOLDOL',
    'data-filtertube-blocked-channel-handle': '@old',
    'data-filtertube-blocked-channel-name': 'Old Channel',
    'data-filtertube-blocked-state': 'blocked',
    'data-filtertube-blocked-ts': '111',
    ...attrs
  });
}

function loadStaleCacheRuntime() {
  const bridge = read('js/content_bridge.js');
  const resetAndStampBlock = sliceBetween(
    bridge,
    'function resetCardIdentityIfStale(card, videoId) {',
    '\n\nfunction resolveIdFromHandle'
  );
  const validatedBlock = sliceBetween(
    bridge,
    'function getCachedCollaboratorsFromCard(card) {',
    '\n\nfunction buildCollaboratorSignature'
  );
  const blockedClearCalls = [];
  const channelClearCalls = [];

  const context = {
    console: {
      log() {},
      warn() {},
      error() {}
    },
    clearBlockedElementAttributes(card) {
      blockedClearCalls.push(card);
      card?.removeAttribute?.('data-filtertube-blocked-via-helper');
    },
    clearCachedChannelMetadata(card) {
      channelClearCalls.push(card);
      card?.removeAttribute?.('data-filtertube-channel-id');
      card?.removeAttribute?.('data-filtertube-channel-handle');
      card?.removeAttribute?.('data-filtertube-channel-name');
      card?.removeAttribute?.('data-filtertube-channel-custom');
    },
    extractVideoIdFromCard(card) {
      return card?.liveVideoId || '';
    },
    sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      return collaborators
        .filter((collab) => collab && typeof collab === 'object')
        .map((collab) => ({
          name: typeof collab.name === 'string' ? collab.name.trim() : '',
          handle: typeof collab.handle === 'string' ? collab.handle.trim() : '',
          id: typeof collab.id === 'string' ? collab.id.trim() : '',
          customUrl: typeof collab.customUrl === 'string' ? collab.customUrl.trim() : ''
        }))
        .filter((collab) => collab.name || collab.handle || collab.id || collab.customUrl);
    },
    isAmpersandTopicNameOnlyCollaboratorState() {
      return false;
    },
    clearAmpersandTopicCollaboratorState() {
    },
    resolvedCollaboratorsByVideoId: new Map(),
    JSON,
    Map,
    Set,
    Array,
    Boolean,
    String
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      resetAndStampBlock,
      validatedBlock,
      'globalThis.__staleCleanupAuditExports = {',
      '  resetCardIdentityIfStale,',
      '  cardContainsVideoIdLink,',
      '  shouldStampCardForVideoId,',
      '  getCachedCollaboratorsFromCard,',
      '  getValidatedCachedCollaborators,',
      '  clearCollaboratorMetadataFromCard',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );

  return {
    context,
    exports: context.__staleCleanupAuditExports,
    blockedClearCalls,
    channelClearCalls
  };
}

test('JSON-first network snapshot consumer stale-cache cleanup audit is audit-only and source pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const bridgeHash = '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, cache cleanup patch/);
  assert.equal(lineCount(bridge), 13571);
  assert.equal(Buffer.byteLength(bridge), 601694);
  assert.equal(sha256('js/content_bridge.js'), bridgeHash);
  assert.match(text, new RegExp(bridgeHash));
  assert.match(text, /consumer stale-cache cleanup source files: 1/);
});

test('stale-cache cleanup source counts remain pinned to current content bridge behavior', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const resetBlock = sliceBetween(bridge, 'function resetCardIdentityIfStale(card, videoId) {', '\n\nfunction cardContainsVideoIdLink');
  const stampBlock = sliceBetween(bridge, 'function shouldStampCardForVideoId(card, videoId) {', '\n\nfunction resolveIdFromHandle');
  const validatedBlock = sliceBetween(bridge, 'function getValidatedCachedCollaborators(card) {', '\n\nfunction clearCollaboratorMetadataFromCard');
  const clearBlock = sliceBetween(bridge, 'function clearCollaboratorMetadataFromCard(card) {', '\n\nfunction buildCollaboratorSignature');

  assert.equal(countLiteral(bridge, 'function resetCardIdentityIfStale'), 1);
  assert.equal(countLiteral(bridge, 'function shouldStampCardForVideoId'), 1);
  assert.equal(countLiteral(bridge, 'function getValidatedCachedCollaborators'), 1);
  assert.equal(countLiteral(bridge, 'function clearCollaboratorMetadataFromCard'), 1);
  assert.equal(countLiteral(bridge, 'function getCachedCollaboratorsFromCard'), 1);
  assert.equal(countLiteral(bridge, 'function cardContainsVideoIdLink'), 1);
  assert.equal(lineCount(resetBlock), 71);
  assert.equal(countLiteral(resetBlock, 'removeAttribute('), 34);
  assert.equal(countLiteral(resetBlock, 'setAttribute('), 1);
  assert.equal(countLiteral(resetBlock, 'classList.remove'), 2);
  assert.equal(countLiteral(resetBlock, "style.removeProperty('display')"), 2);
  assert.equal(lineCount(stampBlock), 33);
  assert.equal(lineCount(validatedBlock), 72);
  assert.equal(countLiteral(validatedBlock, 'removeAttribute('), 24);
  assert.equal(lineCount(clearBlock), 13);
  assert.equal(countLiteral(clearBlock, 'removeAttribute('), 7);
  assert.equal(countLiteral(bridge, "card.removeAttribute('data-filtertube-video-id')"), 2);
  assert.equal(countLiteral(bridge, "card.setAttribute('data-filtertube-video-id', videoId)"), 3);
  assert.equal(countLiteral(bridge, 'resetCardIdentityIfStale('), 8);
  assert.equal(countLiteral(bridge, 'cardContainsVideoIdLink('), 2);
  assert.equal(countLiteral(bridge, 'extractVideoIdFromCard(card)'), 11);
  assert.equal(countLiteral(bridge, 'resolvedCollaboratorsByVideoId.has(cachedVideoId)'), 1);

  assert.match(text, /stale-cache cleanup functions: 6/);
  assert.match(text, /resetCardIdentityIfStale block lines: 71/);
  assert.match(text, /resetCardIdentityIfStale removeAttribute callsites: 34/);
  assert.match(text, /getValidatedCachedCollaborators removeAttribute callsites: 24/);
  assert.match(text, /clearCollaboratorMetadataFromCard removeAttribute callsites: 7/);
});

test('resetCardIdentityIfStale clears stale collaborator hidden and wrapper state then stamps supplied video id', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();
  const wrapper = makeLoadedCard({ 'data-filtertube-video-id': 'wrapperOld' });
  card.wrapper = wrapper;

  runtime.exports.resetCardIdentityIfStale(card, 'newVideo');

  assert.equal(card.getAttribute('data-filtertube-video-id'), 'newVideo');
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden-by-channel'), null);
  assert.equal(card.getAttribute('data-filtertube-channel-id'), null);
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
  assert.deepEqual(card.style.removed, ['display']);
  assert.equal(wrapper.getAttribute('data-filtertube-hidden'), null);
  assert.deepEqual(wrapper.classList.removed, ['filtertube-hidden']);
  assert.deepEqual(wrapper.style.removed, ['display']);
  assert.equal(runtime.blockedClearCalls.includes(card), true);
  assert.equal(runtime.blockedClearCalls.includes(wrapper), true);
  assert.equal(runtime.channelClearCalls.includes(card), true);
});

test('shouldStampCardForVideoId rejects stale requested id when live id differs and cleans to live id', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();
  card.liveVideoId = 'liveVideo';

  const result = runtime.exports.shouldStampCardForVideoId(card, 'requestedVideo');

  assert.equal(result, false);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'liveVideo');
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden-by-keyword'), null);
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
});

test('shouldStampCardForVideoId stamped-id mismatch rejects write but retains old collaborator cache', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();

  const result = runtime.exports.shouldStampCardForVideoId(card, 'requestedVideo');

  assert.equal(result, false);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'oldVideo');
  assert.notEqual(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(card.classList.removed, []);
});

test('getValidatedCachedCollaborators clears collaborator fields when no live id exists but retains cached video id', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();

  const result = runtime.exports.getValidatedCachedCollaborators(card);

  assert.deepEqual(plain(result), []);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'oldVideo');
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-awaiting-dialog'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-requested'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
});

test('getValidatedCachedCollaborators mismatch clears many fields but retains source and timestamp markers', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();
  card.liveVideoId = 'liveVideo';
  runtime.context.resolvedCollaboratorsByVideoId.set('oldVideo', [{ name: 'Old Channel', handle: '@old' }]);

  const result = runtime.exports.getValidatedCachedCollaborators(card);

  assert.deepEqual(plain(result), []);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-video-id'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), null);
  assert.equal(card.getAttribute('data-filtertube-channel-id'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-id'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), '123');
  assert.equal(runtime.context.resolvedCollaboratorsByVideoId.has('oldVideo'), true);
});

test('getValidatedCachedCollaborators returns sanitized cache when live and cached ids match', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard({
    'data-filtertube-collaborators': JSON.stringify([
      { name: 'Kept Channel', handle: '@kept' },
      null,
      { name: '   ' }
    ])
  });
  card.liveVideoId = 'oldVideo';

  const result = runtime.exports.getValidatedCachedCollaborators(card);

  assert.deepEqual(plain(result), [
    { name: 'Kept Channel', handle: '@kept', id: '', customUrl: '' }
  ]);
  assert.notEqual(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.removes.length, 0);
});

test('clearCollaboratorMetadataFromCard removes collaborator metadata without video id or hidden-state cleanup', () => {
  const runtime = loadStaleCacheRuntime();
  const card = makeLoadedCard();

  runtime.exports.clearCollaboratorMetadataFromCard(card);

  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-awaiting-dialog'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-requested'), null);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'oldVideo');
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
});

test('product runtime still lacks first-class stale-cache cleanup authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstNetworkSnapshotConsumerStaleCacheCleanupContract',
    'jsonFirstNetworkSnapshotConsumerStaleCacheDecision',
    'jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerReport',
    'jsonFirstNetworkSnapshotConsumerGlobalCacheRetentionPolicy',
    'jsonFirstNetworkSnapshotConsumerStampRejectionCleanupPolicy',
    'jsonFirstNetworkSnapshotConsumerNoLiveCacheRetentionPolicy',
    'jsonFirstNetworkSnapshotConsumerRecycledCardRestoreProof',
    'jsonFirstNetworkSnapshotConsumerStaleCleanupFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerStaleCleanupMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
