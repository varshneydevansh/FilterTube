import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_MARKER_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md';

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

function uniqueMarkers(text) {
  const markers = new Set();
  const re = /['"](data-filtertube-[a-z0-9-]+)['"]/g;
  let match;
  while ((match = re.exec(text))) {
    markers.add(match[1]);
  }
  return [...markers].sort();
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

class FakeStyle {
  constructor(display = '') {
    this.display = display;
    this.removed = [];
  }

  removeProperty(name) {
    this.removed.push(name);
    if (name === 'display') this.display = '';
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
    hrefs = ['/watch?v=NEWVIDEO001'],
    styleDisplay = 'none',
    wrapper = null
  } = {}) {
    this.tagName = tagName;
    this.attrs = new Map();
    this.hrefs = hrefs.slice();
    this.removes = [];
    this.writes = [];
    this.wrapper = wrapper;
    this.style = new FakeStyle(styleDisplay);
    this.classList = new FakeClassList(this, attrs.classList || []);
    for (const [key, value] of Object.entries(attrs)) {
      if (key !== 'classList') this.attrs.set(key, String(value));
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
    if (text.includes('data-filtertube-channel')) return null;
    for (const href of this.hrefs) {
      if (text.includes('watch?v=') && href.includes('watch?v=')) return new FakeAnchor(href);
      if (text.includes('/shorts/') && href.includes('/shorts/')) return new FakeAnchor(href);
    }
    return null;
  }

  querySelectorAll(selector) {
    if (String(selector || '') === 'a[href]') {
      return this.hrefs.map((href) => new FakeAnchor(href));
    }
    return [];
  }

  closest() {
    return this.wrapper;
  }
}

function makeLoadedCard(attrs = {}) {
  return new FakeCard({
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

function clearBlockedElementAttributes(card) {
  card?.removeAttribute?.('data-filtertube-blocked-channel-id');
  card?.removeAttribute?.('data-filtertube-blocked-channel-handle');
  card?.removeAttribute?.('data-filtertube-blocked-channel-custom');
  card?.removeAttribute?.('data-filtertube-blocked-channel-name');
  card?.removeAttribute?.('data-filtertube-blocked-state');
  card?.removeAttribute?.('data-filtertube-blocked-ts');
}

function clearCachedChannelMetadata(card) {
  card?.removeAttribute?.('data-filtertube-channel-id');
  card?.removeAttribute?.('data-filtertube-channel-handle');
  card?.removeAttribute?.('data-filtertube-channel-name');
  card?.removeAttribute?.('data-filtertube-channel-custom');
}

function loadDomExtractorRuntime() {
  const context = {
    console: { log() {}, warn() {}, error() {} },
    location: { hostname: 'www.youtube.com' },
    document: {
      location: { origin: 'https://www.youtube.com' },
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
      'globalThis.__extractorExports = { ensureVideoIdForCard, extractVideoIdFromCard };'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_extractors.js') }
  );
  return context.__extractorExports;
}

function loadBridgeRuntime() {
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
  const context = {
    console: { log() {}, warn() {}, error() {} },
    clearBlockedElementAttributes,
    clearCachedChannelMetadata,
    extractVideoIdFromCard(card) {
      return card?.liveVideoId || '';
    },
    sanitizeCollaboratorList(collaborators = []) {
      return Array.isArray(collaborators) ? collaborators.filter(Boolean) : [];
    },
    resolvedCollaboratorsByVideoId: new Map(),
    JSON,
    Map,
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
      'globalThis.__bridgeExports = {',
      '  resetCardIdentityIfStale,',
      '  getValidatedCachedCollaborators,',
      '  clearCollaboratorMetadataFromCard',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );
  return context.__bridgeExports;
}

function loadFallbackHiddenRuntime() {
  const fallback = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    fallback,
    'function clearBlockedElementAttributes(element) {',
    '\n\nfunction hasExplicitHideReasonMarker'
  );
  const context = {
    console: { log() {}, warn() {}, error() {} },
    extractVideoIdFromCard(card) {
      return card?.liveVideoId || '';
    },
    Boolean,
    String,
    Date
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(
    [
      block,
      'globalThis.__fallbackExports = { clearBlockedElementAttributes, isExplicitlyHiddenByFilterTube };'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content', 'dom_fallback.js') }
  );
  return context.__fallbackExports;
}

test('JSON-first network snapshot consumer stale-marker matrix audit is audit-only and source pinned', () => {
  const text = doc();
  const hashes = {
    'js/content/dom_extractors.js': '3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237',
    'js/content_bridge.js': '31e7234c6a4055bffb0b800bac43cf3dd1c496cb08d1d57d391ea027941277e9',
    'js/content/dom_fallback.js': '2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef'
  };

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, cleanup patch/);
  assert.equal(lineCount(read('js/content/dom_extractors.js')), 1102);
  assert.equal(Buffer.byteLength(read('js/content/dom_extractors.js')), 45149);
  assert.equal(lineCount(read('js/content_bridge.js')), 13535);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 600459);
  assert.equal(lineCount(read('js/content/dom_fallback.js')), 4838);
  assert.equal(Buffer.byteLength(read('js/content/dom_fallback.js')), 228332);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(sha256(file), hash);
    assert.match(text, new RegExp(hash));
  }
  assert.match(text, /consumer stale-marker matrix source files: 3/);
});

test('stale-marker matrix source counts and marker sets remain pinned', () => {
  const text = doc();
  const dom = read('js/content/dom_extractors.js');
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const slices = {
    ensure: sliceBetween(dom, 'function ensureVideoIdForCard(card) {', '\n\nfunction getCardTitle'),
    reset: sliceBetween(bridge, 'function resetCardIdentityIfStale(card, videoId) {', '\n\nfunction cardContainsVideoIdLink'),
    validated: sliceBetween(bridge, 'function getValidatedCachedCollaborators(card) {', '\n\nfunction clearCollaboratorMetadataFromCard'),
    clearCollab: sliceBetween(bridge, 'function clearCollaboratorMetadataFromCard(card) {', '\n\nfunction buildCollaboratorSignature'),
    fallbackHidden: sliceBetween(fallback, 'function isExplicitlyHiddenByFilterTube(element) {', '\n\nfunction hasExplicitHideReasonMarker'),
    fallbackLoop: sliceBetween(fallback, "const alreadyProcessed = element.hasAttribute('data-filtertube-processed');", '\n\n            // Extract Metadata')
  };
  const combinedMarkers = uniqueMarkers(Object.values(slices).join('\n'));

  assert.equal(combinedMarkers.length, 31);
  assert.equal(lineCount(slices.ensure), 148);
  assert.equal(uniqueMarkers(slices.ensure).length, 31);
  assert.equal(countLiteral(slices.ensure, 'removeAttribute('), 50);
  assert.equal(lineCount(slices.reset), 71);
  assert.equal(uniqueMarkers(slices.reset).length, 23);
  assert.equal(countLiteral(slices.reset, 'removeAttribute('), 34);
  assert.equal(lineCount(slices.validated), 72);
  assert.equal(uniqueMarkers(slices.validated).length, 19);
  assert.equal(countLiteral(slices.validated, 'removeAttribute('), 24);
  assert.equal(lineCount(slices.clearCollab), 13);
  assert.equal(uniqueMarkers(slices.clearCollab).length, 7);
  assert.equal(countLiteral(slices.clearCollab, 'removeAttribute('), 7);
  assert.equal(lineCount(slices.fallbackHidden), 47);
  assert.equal(uniqueMarkers(slices.fallbackHidden).length, 13);
  assert.equal(countLiteral(slices.fallbackHidden, 'removeAttribute('), 7);
  assert.equal(lineCount(slices.fallbackLoop), 152);
  assert.equal(uniqueMarkers(slices.fallbackLoop).length, 17);
  assert.equal(countLiteral(slices.fallbackLoop, 'removeAttribute('), 27);
  assert.equal(countLiteral(bridge, 'data-filtertube-video-id'), 37);
  assert.equal(countLiteral(dom, 'data-filtertube-video-id'), 5);
  assert.equal(countLiteral(fallback, 'data-filtertube-video-id'), 5);

  for (const expected of [
    'combined unique stale marker literals across matrix blocks: 31',
    'ensureVideoIdForCard marker literals: 31',
    'resetCardIdentityIfStale marker literals: 23',
    'getValidatedCachedCollaborators marker literals: 19',
    'clearCollaboratorMetadataFromCard marker literals: 7',
    'isExplicitlyHiddenByFilterTube marker literals: 13',
    'DOM fallback processed-loop marker literals: 17'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const marker of [
    'data-filtertube-video-id',
    'data-filtertube-hidden',
    'data-filtertube-collaborators-source',
    'data-filtertube-blocked-channel-custom',
    'data-filtertube-whitelist-pending'
  ]) {
    assert.ok(combinedMarkers.includes(marker), `missing matrix marker ${marker}`);
    assert.match(text, new RegExp(marker));
  }
});

test('extractor no-cached high-risk cleanup clears markers but leaves inline display hidden', () => {
  const runtime = loadDomExtractorRuntime();
  const card = makeLoadedCard();
  card.attrs.delete('data-filtertube-video-id');

  const videoId = runtime.ensureVideoIdForCard(card);

  assert.equal(videoId, 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-custom'), null);
  assert.equal(card.getAttribute('data-filtertube-whitelist-pending'), null);
  assert.equal(card.getAttribute('data-filtertube-duration'), null);
  assert.equal(card.style.display, 'none');
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
});

test('extractor cached mismatch restores display but retains collaborator marker family', () => {
  const runtime = loadDomExtractorRuntime();
  const card = makeLoadedCard();

  const videoId = runtime.ensureVideoIdForCard(card);

  assert.equal(videoId, 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-custom'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), JSON.stringify([{ name: 'Old Channel', handle: '@old' }]));
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), '123');
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '2');
  assert.equal(card.getAttribute('data-filtertube-duration'), '1:23');
  assert.equal(card.style.display, '');
});

test('bridge reset stale cleanup leaves last-mode and whitelist-pending markers outside local removal set', () => {
  const runtime = loadBridgeRuntime();
  const wrapper = makeLoadedCard();
  const card = makeLoadedCard({ wrapper });
  card.wrapper = wrapper;

  runtime.resetCardIdentityIfStale(card, 'NEWVIDEO001');

  assert.equal(card.getAttribute('data-filtertube-video-id'), 'NEWVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-custom'), null);
  assert.equal(card.getAttribute('data-filtertube-last-processed-id'), null);
  assert.equal(card.getAttribute('data-filtertube-last-processed-mode'), 'blocklist');
  assert.equal(card.getAttribute('data-filtertube-whitelist-pending'), 'true');
  assert.equal(card.style.display, '');
  assert.equal(wrapper.getAttribute('data-filtertube-hidden'), null);
  assert.equal(wrapper.style.display, '');
});

test('validated cache mismatch leaves source timestamp hidden and custom markers retained', () => {
  const runtime = loadBridgeRuntime();
  const card = makeLoadedCard();
  card.liveVideoId = 'NEWVIDEO001';

  const result = runtime.getValidatedCachedCollaborators(card);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), []);
  assert.equal(card.getAttribute('data-filtertube-collaborators'), null);
  assert.equal(card.getAttribute('data-filtertube-video-id'), null);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), '123');
  assert.equal(card.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(card.getAttribute('data-filtertube-last-processed-id'), 'OLDVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-last-processed-mode'), 'blocklist');
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-custom'), '/c/old');
  assert.equal(card.getAttribute('data-filtertube-channel-custom'), '/c/old');
});

test('DOM fallback stale-hidden cleanup restores visibility markers without explicit reason markers', () => {
  const runtime = loadFallbackHiddenRuntime();
  const card = new FakeCard({
    attrs: {
      'data-filtertube-video-id': 'OLDVIDEO001',
      'data-filtertube-processed': 'true',
      'data-filtertube-last-processed-id': 'OLDVIDEO001',
      'data-filtertube-hidden': 'true',
      classList: ['filtertube-hidden']
    }
  });
  card.liveVideoId = 'NEWVIDEO001';

  const result = runtime.isExplicitlyHiddenByFilterTube(card);

  assert.equal(result, false);
  assert.equal(card.getAttribute('data-filtertube-hidden'), null);
  assert.equal(card.getAttribute('data-filtertube-hidden-by-channel'), null);
  assert.equal(card.getAttribute('data-filtertube-blocked-channel-id'), null);
  assert.deepEqual(card.classList.removed, ['filtertube-hidden']);
  assert.deepEqual(card.style.removed, ['display']);
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'OLDVIDEO001');
  assert.equal(card.getAttribute('data-filtertube-processed'), 'true');
  assert.equal(card.getAttribute('data-filtertube-last-processed-id'), 'OLDVIDEO001');
});

test('product runtime still lacks first-class stale-marker matrix authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstNetworkSnapshotConsumerStaleMarkerReport',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerMatrix',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerCleanupDecision',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerRetentionPolicy',
    'jsonFirstNetworkSnapshotConsumerHiddenMarkerRestoreProof',
    'jsonFirstNetworkSnapshotConsumerCollaboratorMarkerRetentionPolicy',
    'jsonFirstNetworkSnapshotConsumerProcessedMarkerPolicy',
    'jsonFirstNetworkSnapshotConsumerBlockedMarkerPolicy',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerFixtureProvenance',
    'jsonFirstNetworkSnapshotConsumerStaleMarkerMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
