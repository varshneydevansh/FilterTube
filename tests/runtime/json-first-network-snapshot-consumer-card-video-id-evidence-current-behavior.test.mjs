import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22.md';

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

function sliceBetween(text, startNeedle, endNeedle = null) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = endNeedle === null ? text.length : text.indexOf(endNeedle, start + startNeedle.length);
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
  constructor(owner, initial = []) {
    this.owner = owner;
    this.values = new Set(initial);
    this.removed = [];
  }

  contains(value) {
    return this.values.has(value);
  }

  remove(value) {
    this.removed.push(value);
    this.values.delete(value);
  }
}

class FakeAnchor {
  constructor(href) {
    this.href = href;
  }

  getAttribute(name) {
    return name === 'href' ? this.href : null;
  }
}

class FakeCard {
  constructor({
    tagName = 'YTD-RICH-ITEM-RENDERER',
    attrs = {},
    hrefs = [],
    nestedChannelNodes = [],
    styleDisplay = ''
  } = {}) {
    this.tagName = tagName;
    this.attrs = new Map();
    this.hrefs = hrefs.slice();
    this.nestedChannelNodes = nestedChannelNodes;
    this.queryLog = [];
    this.removes = [];
    this.writes = [];
    this.style = { display: styleDisplay };
    this.classList = new FakeClassList(this, attrs.classList || []);
    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'classList') {
        this.attrs.set(key, String(value));
      }
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

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  querySelector(selector) {
    const text = String(selector || '');
    this.queryLog.push(text);
    if (text.includes('data-filtertube-channel')) {
      return this.nestedChannelNodes[0] || null;
    }
    for (const href of this.hrefs) {
      const idMatch = href.match(/(?:[?&]v=|\/watch\/|\/shorts\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
      if (idMatch && text.includes(idMatch[1])) return new FakeAnchor(href);
      if (text.includes('watch?v=') && href.includes('watch?v=')) return new FakeAnchor(href);
      if (text.includes('/shorts/') && href.includes('/shorts/')) return new FakeAnchor(href);
      if (text.includes('/live/') && href.includes('/live/')) return new FakeAnchor(href);
      if (text.includes('/embed/') && href.includes('/embed/')) return new FakeAnchor(href);
    }
    return null;
  }

  querySelectorAll(selector) {
    const text = String(selector || '');
    this.queryLog.push(text);
    if (text === 'a[href]') {
      return this.hrefs.map((href) => new FakeAnchor(href));
    }
    if (text.includes('data-filtertube-channel')) {
      return this.nestedChannelNodes;
    }
    return [];
  }
}

function makeLoadedCard(attrs = {}) {
  return new FakeCard({
    tagName: 'YTD-RICH-ITEM-RENDERER',
    hrefs: ['/watch?v=NEWVIDEO001'],
    styleDisplay: 'none',
    attrs: {
      'data-filtertube-video-id': 'OLDVIDEO001',
      'data-filtertube-channel-id': 'UCOLDOLDOLDOLDOLDOLDOL',
      'data-filtertube-channel-handle': '@old',
      'data-filtertube-channel-name': 'Old Channel',
      'data-filtertube-channel-custom': '/c/old',
      'data-filtertube-processed': 'true',
      'data-filtertube-last-processed-id': 'OLDVIDEO001',
      'data-filtertube-last-processed-mode': 'blocklist',
      'data-filtertube-unique-id': 'unique-old',
      'data-filtertube-duration': '1:23',
      'data-filtertube-whitelist-pending': 'true',
      'data-filtertube-hidden': 'true',
      'data-filtertube-hidden-by-channel': 'true',
      'data-filtertube-hidden-by-keyword': 'true',
      'data-filtertube-hidden-by-duration': 'true',
      'data-filtertube-hidden-by-upload-date': 'true',
      'data-filtertube-hidden-by-category': 'true',
      'data-filtertube-hidden-by-hide-all-shorts': 'true',
      'data-filtertube-blocked-channel-id': 'UCOLDOLDOLDOLDOLDOLDOL',
      'data-filtertube-blocked-channel-handle': '@old',
      'data-filtertube-blocked-channel-custom': '/c/old',
      'data-filtertube-blocked-channel-name': 'Old Channel',
      'data-filtertube-blocked-state': 'blocked',
      'data-filtertube-blocked-ts': '111',
      'data-filtertube-collaborators': JSON.stringify([{ name: 'Old Channel', handle: '@old' }]),
      'data-filtertube-collaborators-source': 'xhr',
      'data-filtertube-collaborators-ts': '123',
      'data-filtertube-expected-collaborators': '2',
      'data-filtertube-collab-state': 'resolved',
      'data-filtertube-collab-awaiting-dialog': 'true',
      'data-filtertube-collab-requested': 'mainworld',
      classList: ['filtertube-hidden'],
      ...attrs
    }
  });
}

function loadDomEvidenceRuntime(hostname = 'www.youtube.com') {
  const context = {
    console: {
      log() {},
      warn() {},
      error() {}
    },
    location: { hostname },
    document: {
      location: { origin: `https://${hostname}` },
      getElementById() {
        return null;
      }
    },
    URL,
    Array,
    Boolean,
    JSON,
    Map,
    Set,
    String,
    RegExp,
    Object
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      read('js/content/dom_extractors.js'),
      'globalThis.__videoIdEvidenceExports = { ensureVideoIdForCard, extractVideoIdFromCard, clearCachedChannelMetadata };'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_extractors.js') }
  );
  return context.__videoIdEvidenceExports;
}

function loadBridgeStampRuntime() {
  const bridge = read('js/content_bridge.js');
  const block = sliceBetween(
    bridge,
    'function resetCardIdentityIfStale(card, videoId) {',
    '\n\nfunction resolveIdFromHandle'
  );
  const context = {
    console: {
      log() {},
      warn() {},
      error() {}
    },
    clearBlockedElementAttributes() {},
    clearCachedChannelMetadata(card) {
      card?.removeAttribute?.('data-filtertube-channel-id');
      card?.removeAttribute?.('data-filtertube-channel-handle');
      card?.removeAttribute?.('data-filtertube-channel-name');
      card?.removeAttribute?.('data-filtertube-channel-custom');
    },
    extractVideoIdFromCard() {
      return '';
    },
    Boolean,
    String,
    Array
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      block,
      'globalThis.__bridgeStampEvidenceExports = {',
      '  resetCardIdentityIfStale,',
      '  cardContainsVideoIdLink,',
      '  shouldStampCardForVideoId',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );
  return context.__bridgeStampEvidenceExports;
}

test('JSON-first network snapshot consumer card video-id evidence audit is audit-only and source pinned', () => {
  const text = doc();
  const domHash = '3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237';
  const bridgeHash = '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, selector patch/);
  assert.equal(lineCount(read('js/content/dom_extractors.js')), 1102);
  assert.equal(Buffer.byteLength(read('js/content/dom_extractors.js')), 45149);
  assert.equal(sha256('js/content/dom_extractors.js'), domHash);
  assert.equal(lineCount(read('js/content_bridge.js')), 13535);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 600459);
  assert.equal(sha256('js/content_bridge.js'), bridgeHash);
  assert.match(text, new RegExp(domHash));
  assert.match(text, new RegExp(bridgeHash));
  assert.match(text, /consumer card video-id evidence source files: 2/);
});

test('card video-id evidence source counts remain pinned to current extractor and bridge behavior', () => {
  const text = doc();
  const dom = read('js/content/dom_extractors.js');
  const bridge = read('js/content_bridge.js');
  const ensureBlock = sliceBetween(dom, 'function ensureVideoIdForCard(card) {', '\n\nfunction getCardTitle');
  const extractBlock = sliceBetween(dom, 'function extractVideoIdFromCard(card) {');
  const cardLinkBlock = sliceBetween(bridge, 'function cardContainsVideoIdLink(card, videoId) {', '\n\nfunction shouldStampCardForVideoId');
  const shouldStampBlock = sliceBetween(bridge, 'function shouldStampCardForVideoId(card, videoId) {', '\n\nfunction resolveIdFromHandle');

  assert.equal(lineCount(ensureBlock), 148);
  assert.equal(countLiteral(ensureBlock, 'removeAttribute('), 50);
  assert.equal(countLiteral(ensureBlock, 'setAttribute('), 1);
  assert.equal(countLiteral(ensureBlock, 'classList.remove'), 2);
  assert.equal(countLiteral(ensureBlock, 'style.display'), 2);
  assert.equal(countLiteral(ensureBlock, 'hasAttribute('), 8);
  assert.equal(countLiteral(ensureBlock, "tag === '"), 20);
  assert.equal(lineCount(extractBlock), 156);
  assert.equal(countLiteral(extractBlock, 'querySelector('), 6);
  assert.equal(countLiteral(extractBlock, 'querySelectorAll('), 1);
  assert.equal(countLiteral(extractBlock, '.match('), 5);
  assert.equal(countLiteral(extractBlock, 'scanDataForVideoId'), 1);
  assert.equal(lineCount(cardLinkBlock), 14);
  assert.equal(countLiteral(cardLinkBlock, '`a[href*='), 4);
  assert.equal(lineCount(shouldStampBlock), 33);
  assert.equal(countLiteral(shouldStampBlock, 'resetCardIdentityIfStale('), 4);
  assert.equal(countLiteral(bridge, 'ensureVideoIdForCard('), 25);
  assert.equal(countLiteral(bridge, 'extractVideoIdFromCard('), 22);
  assert.equal(countLiteral(read('js/content/dom_fallback.js'), 'ensureVideoIdForCard(') + countLiteral(read('js/content/block_channel.js'), 'ensureVideoIdForCard(') + countLiteral(bridge, 'ensureVideoIdForCard(') + countLiteral(dom, 'ensureVideoIdForCard('), 37);
  assert.equal(countLiteral(read('js/content/dom_fallback.js'), 'extractVideoIdFromCard(') + countLiteral(read('js/content/block_channel.js'), 'extractVideoIdFromCard(') + countLiteral(bridge, 'extractVideoIdFromCard(') + countLiteral(dom, 'extractVideoIdFromCard('), 33);
  assert.equal(countLiteral(bridge, "setAttribute('data-filtertube-video-id'"), 8);
  assert.equal(countLiteral(bridge, "removeAttribute('data-filtertube-video-id')"), 3);

  assert.match(text, /ensureVideoIdForCard block lines: 148/);
  assert.match(text, /extractVideoIdFromCard block lines: 156/);
  assert.match(text, /cardContainsVideoIdLink block lines: 14/);
  assert.match(text, /shouldStampCardForVideoId block lines: 33/);
  assert.match(text, /all product ensureVideoIdForCard token occurrences: 37/);
  assert.match(text, /all product extractVideoIdFromCard token occurrences: 33/);
});

test('extractVideoIdFromCard prefers current href evidence over stale stamped video id', () => {
  const runtime = loadDomEvidenceRuntime('www.youtubekids.com');
  const card = new FakeCard({
    tagName: 'YTK-COMPACT-VIDEO-RENDERER',
    attrs: { 'data-filtertube-video-id': 'OLDVIDEO001' },
    hrefs: ['/watch?v=NEWVIDEO001']
  });

  const videoId = runtime.extractVideoIdFromCard(card);

  assert.equal(videoId, 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'OLDVIDEO001');
});

test('ensureVideoIdForCard no-cached high-risk card stamps new id and clears many markers but not display style', () => {
  const runtime = loadDomEvidenceRuntime();
  const card = makeLoadedCard({ 'data-filtertube-video-id': undefined });
  card.attrs.delete('data-filtertube-video-id');

  const videoId = runtime.ensureVideoIdForCard(card);

  assert.equal(videoId, 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-channel-id'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-state'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-requested'), null);
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
  assert.equal(card.style.display, 'none');
});

test('ensureVideoIdForCard cached high-risk mismatch restores display but retains collaborator payload markers', () => {
  const runtime = loadDomEvidenceRuntime();
  const card = makeLoadedCard();

  const videoId = runtime.ensureVideoIdForCard(card);

  assert.equal(videoId, 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-channel-id'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-state'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), JSON.stringify([{ name: 'Old Channel', handle: '@old' }]));
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), '123');
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
  assert.equal(card.style.display, '');
});

test('ensureVideoIdForCard fast-returns lower-risk cached id without anchor scans or stale marker cleanup', () => {
  const runtime = loadDomEvidenceRuntime();
  const card = new FakeCard({
    tagName: 'DIV',
    attrs: {
      'data-filtertube-video-id': 'OLDVIDEO001',
      'data-filtertube-hidden': 'true',
      classList: ['filtertube-hidden']
    },
    hrefs: ['/watch?v=NEWVIDEO001'],
    styleDisplay: 'none'
  });

  const videoId = runtime.ensureVideoIdForCard(card);

  assert.equal(videoId, 'OLDVIDEO001');
  assert.equal(card.queryLog.length, 0);
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
  assert.deepEqual(card.classList.removed, []);
  assert.equal(card.style.display, 'none');
});

test('shouldStampCardForVideoId can stamp from link proof when live and stamped evidence are absent', () => {
  const runtime = loadBridgeStampRuntime();
  const card = new FakeCard({
    tagName: 'YTD-RICH-ITEM-RENDERER',
    hrefs: ['/watch?v=REQUEST001A']
  });

  const result = runtime.shouldStampCardForVideoId(card, 'REQUEST001A');

  assert.equal(result, true);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'REQUEST001A');
  assert.deepEqual(card.removes, []);
});

test('content bridge source still has direct collaborator-cache video-id stamping outside should-stamp decision', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const cacheMessageBlock = sliceBetween(
    bridge,
    "} else if (type === 'FilterTube_CacheCollaboratorInfo') {",
    "\n    } else if (type === 'FilterTube_ChannelInfoResponse') {"
  );
  const extractionBlock = sliceBetween(
    bridge,
    'function extractCollaboratorMetadataFromElement(element) {',
    '\n    function hydrateCollaboratorsFromLinks'
  );

  assert.equal(lineCount(cacheMessageBlock), 39);
  assert.equal(countLiteral(cacheMessageBlock, '`a[href*='), 4);
  assert.equal(countLiteral(cacheMessageBlock, 'findVideoCardElement'), 1);
  assert.equal(countLiteral(cacheMessageBlock, "setAttribute('data-filtertube-video-id', videoId)"), 1);
  assert.equal(countLiteral(cacheMessageBlock, 'shouldStampCardForVideoId('), 0);
  assert.equal(lineCount(extractionBlock), 94);
  assert.equal(countLiteral(extractionBlock, 'ensureVideoIdForCard'), 3);
  assert.equal(countLiteral(extractionBlock, "setAttribute('data-filtertube-video-id'"), 2);

  assert.match(text, /directCacheCollaboratorStamp/);
  assert.match(text, /asking for collaborator metadata can mutate video-id stamps and stale markers/i);
});

test('product runtime still lacks first-class card video-id evidence authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport',
    'jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceContract',
    'jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceDecision',
    'jsonFirstNetworkSnapshotConsumerLiveVideoIdProvenanceReport',
    'jsonFirstNetworkSnapshotConsumerHrefProofPolicy',
    'jsonFirstNetworkSnapshotConsumerStampedVideoIdTrustPolicy',
    'jsonFirstNetworkSnapshotConsumerEnsureVideoIdSideEffectReport',
    'jsonFirstNetworkSnapshotConsumerVideoIdFastReturnPolicy',
    'jsonFirstNetworkSnapshotConsumerVideoIdRestoreProof',
    'jsonFirstNetworkSnapshotConsumerVideoIdEvidenceFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerVideoIdEvidenceMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
