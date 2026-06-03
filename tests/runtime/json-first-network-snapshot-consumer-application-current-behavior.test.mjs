import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22.md';

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

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map();
    this.writes = [];
    this.removes = [];
    this.isConnected = true;
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

  querySelector() {
    return null;
  }
}

function ucId(suffix = 'A') {
  return `UC${String(suffix).repeat(22).slice(0, 22)}`;
}

function loadContentBridgeApplicationRuntime() {
  const bridge = read('js/content_bridge.js');
  const refreshBlock = sliceBetween(
    bridge,
    'function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {',
    '\n\n// Statistics tracking'
  );
  const applyBlock = sliceBetween(
    bridge,
    'function applyResolvedCollaborators(videoId, collaborators, options = {}) {',
    '\n\nfunction applyCollaboratorsByVideoId'
  );

  const cards = [];
  const scheduledTimers = [];
  const playlistRefreshes = [];
  const domFallbackCalls = [];
  const renderCalls = [];
  const fixedNow = 1700000000000;

  const documentObject = {
    querySelectorAll(selector) {
      const match = String(selector || '').match(/^\[data-filtertube-video-id="([^"]+)"\]$/);
      if (!match) return [];
      return cards.filter((card) => card.getAttribute('data-filtertube-video-id') === match[1]);
    }
  };

  const context = {
    __cards: cards,
    __playlistRefreshes: playlistRefreshes,
    __domFallbackCalls: domFallbackCalls,
    __renderCalls: renderCalls,
    __fixedNow: fixedNow,
    document: documentObject,
    console: {
      log() {},
      warn() {},
      error() {}
    },
    setTimeout(handler, delay) {
      scheduledTimers.push({ handler, delay, fired: false });
      return scheduledTimers.length;
    },
    Date: {
      now() {
        return fixedNow;
      }
    },
    JSON,
    Map,
    Set,
    Array,
    Math,
    Number,
    String,
    Boolean,
    parseInt
  };
  context.globalThis = context;

  const harness = `
    const activeCollaborationDropdowns = new Map();
    const resolvedCollaboratorsByVideoId = new Map();

    function normalizeHandleValue(value) {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      return trimmed.startsWith('@') ? trimmed : '@' + trimmed.replace(/^\\/+/, '');
    }

    function normalizeCollaboratorName(name) {
      if (!name || typeof name !== 'string') return '';
      return name.trim().toLowerCase().replace(/\\s+/g, ' ');
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const out = [];
      for (const collab of collaborators) {
        if (!collab || typeof collab !== 'object') continue;
        const normalized = {
          name: typeof collab.name === 'string' ? collab.name.trim() : '',
          handle: normalizeHandleValue(collab.handle || ''),
          id: typeof collab.id === 'string' && /^UC[\\w-]{22}$/i.test(collab.id.trim()) ? collab.id.trim() : '',
          customUrl: typeof collab.customUrl === 'string' ? collab.customUrl.trim() : ''
        };
        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl) continue;
        const key = normalized.id || normalized.handle || normalized.customUrl || normalized.name.toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
      }
      return out;
    }

    function resolveExpectedCollaboratorCount(rawCollaborators, sanitizedCollaborators, ...countHints) {
      const sanitizedCount = Array.isArray(sanitizedCollaborators) ? sanitizedCollaborators.length : 0;
      const numericHints = countHints
        .map(value => parseInt(value || '0', 10) || 0)
        .filter(value => value > 0);
      return Math.max(sanitizedCount, ...numericHints);
    }

    function getCollaboratorListQuality(list = []) {
      const sanitized = sanitizeCollaboratorList(list);
      if (!Array.isArray(sanitized) || sanitized.length === 0) return 0;
      return sanitized.reduce((score, collaborator) => {
        if (!collaborator) return score;
        let entryScore = 10;
        if (collaborator.name) entryScore += 1;
        if (collaborator.handle) entryScore += 3;
        if (collaborator.id) entryScore += 5;
        return score + entryScore;
      }, 0);
    }

    function getCachedCollaboratorsFromCard(card) {
      if (!card || typeof card.getAttribute !== 'function') return [];
      const cached = card.getAttribute('data-filtertube-collaborators');
      if (!cached) return [];
      try {
        return sanitizeCollaboratorList(JSON.parse(cached));
      } catch (_) {
        return [];
      }
    }

    function getValidatedCachedCollaborators(card) {
      return getCachedCollaboratorsFromCard(card);
    }

    function isAmpersandTopicNameOnlyCollaboratorState() {
      return false;
    }

    function clearAmpersandTopicCollaboratorState() {
    }

    function getResolvedCollaboratorsForCard(videoId) {
      return resolvedCollaboratorsByVideoId.get(videoId) || [];
    }

    function extractCollaboratorsFromAvatarStackElement() {
      return [];
    }

    function mergeCollaboratorLists(primary = [], supplemental = []) {
      return sanitizeCollaboratorList([...(Array.isArray(primary) ? primary : []), ...(Array.isArray(supplemental) ? supplemental : [])]);
    }

    function buildCollaboratorSignature(collaborators = []) {
      if (!Array.isArray(collaborators) || collaborators.length === 0) return '';
      return collaborators
        .map(collab => (collab.id || collab.handle || collab.customUrl || collab.name || '').toLowerCase())
        .filter(Boolean)
        .join('|');
    }

    function hasCompleteCollaboratorRoster(collaborators = [], expectedCount = 0) {
      if (!Array.isArray(collaborators) || collaborators.length === 0) return false;
      const identifiersReady = collaborators.every(collab => Boolean(collab?.id || collab?.handle || collab?.customUrl));
      const meetsExpected = !expectedCount || collaborators.length >= expectedCount;
      return identifiersReady && meetsExpected;
    }

    function shouldStampCardForVideoId(card, videoId) {
      if (!card || !videoId) return false;
      const stampedVideoId = (card.getAttribute?.('data-filtertube-video-id') || '').trim();
      return !stampedVideoId || stampedVideoId === videoId;
    }

    function refreshOpenPlaylistFallbackPopoverForVideo(videoId) {
      __playlistRefreshes.push(videoId);
    }

    function applyDOMFallback(...args) {
      __domFallbackCalls.push(args);
    }

    function renderFilterTubeMenuEntries(args) {
      __renderCalls.push(args);
    }

    ${refreshBlock}
    ${applyBlock}

    globalThis.__applicationAuditExports = {
      activeCollaborationDropdowns,
      resolvedCollaboratorsByVideoId,
      refreshActiveCollaborationMenu,
      applyResolvedCollaborators
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context, { filename: path.join(repoRoot, 'js', 'content_bridge.js') });

  return {
    context,
    cards,
    scheduledTimers,
    playlistRefreshes,
    domFallbackCalls,
    renderCalls,
    fixedNow,
    exports: context.__applicationAuditExports
  };
}

function fireAllTimers(runtime) {
  for (const timer of runtime.scheduledTimers) {
    if (timer.fired) continue;
    timer.fired = true;
    timer.handler();
  }
}

test('JSON-first network snapshot consumer application audit is audit-only and source pinned', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const bridgeHash = 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, cache patch, DOM patch/);
  assert.equal(lineCount(bridge), 13623);
  assert.equal(Buffer.byteLength(bridge), 603362);
  assert.equal(sha256('js/content_bridge.js'), bridgeHash);
  assert.match(text, new RegExp(bridgeHash));
  assert.match(text, /consumer application source files: 1/);
});

test('application source counts remain pinned to current content bridge behavior', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const applyBlock = sliceBetween(
    bridge,
    'function applyResolvedCollaborators(videoId, collaborators, options = {}) {',
    '\n\nfunction applyCollaboratorsByVideoId'
  );
  const refreshBlock = sliceBetween(
    bridge,
    'function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {',
    '\n\n// Statistics tracking'
  );

  assert.equal(countLiteral(bridge, 'const resolvedCollaboratorsByVideoId = new Map();'), 1);
  assert.equal(countLiteral(bridge, 'const activeCollaborationDropdowns = new Map();'), 1);
  assert.equal(countLiteral(bridge, 'applyResolvedCollaborators('), 8);
  assert.equal(countLiteral(bridge, 'refreshActiveCollaborationMenu('), 4);
  assert.equal(countLiteral(bridge, 'resolvedCollaboratorsByVideoId.set('), 5);
  assert.equal(countLiteral(bridge, 'resolvedCollaboratorsByVideoId.get('), 5);
  assert.equal(countLiteral(applyBlock, "card.setAttribute('data-filtertube-collaborators', serialized);"), 1);
  assert.equal(countLiteral(applyBlock, "card.setAttribute('data-filtertube-collaborators-source', sourceLabel);"), 1);
  assert.equal(countLiteral(applyBlock, "card.setAttribute('data-filtertube-collaborators-ts', String(timestamp));"), 1);
  assert.equal(countLiteral(applyBlock, "card.setAttribute('data-filtertube-collab-state', 'resolved');"), 1);
  assert.equal(countLiteral(applyBlock, "card.removeAttribute('data-filtertube-collab-awaiting-dialog');"), 1);
  assert.equal(countLiteral(applyBlock, "card.removeAttribute('data-filtertube-collab-requested');"), 1);
  assert.equal(countLiteral(applyBlock, 'refreshActiveCollaborationMenu(videoId, sanitized,'), 1);
  assert.equal(countLiteral(applyBlock, 'refreshOpenPlaylistFallbackPopoverForVideo(videoId);'), 1);
  assert.equal(countLiteral(applyBlock, 'applyDOMFallback(null, { preserveScroll: true, forceReprocess: true });'), 1);
  assert.equal(countLiteral(refreshBlock, 'activeCollaborationDropdowns.get(videoId)'), 1);
  assert.equal(countLiteral(refreshBlock, 'activeCollaborationDropdowns.delete(videoId)'), 1);
  assert.equal(countLiteral(refreshBlock, 'resolvedCollaboratorsByVideoId.get(videoId)'), 1);
  assert.equal(countLiteral(refreshBlock, "context.videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitized));"), 1);
  assert.equal(countLiteral(refreshBlock, 'renderFilterTubeMenuEntries({'), 1);

  assert.match(text, /resolved collaborator cache maps: 1/);
  assert.match(text, /active collaboration menu maps: 1/);
  assert.match(text, /applyResolvedCollaborators token occurrences: 8/);
  assert.match(text, /applyResolvedCollaborators callsites outside declaration: 7/);
  assert.match(text, /refreshActiveCollaborationMenu token occurrences: 4/);
  assert.match(text, /refreshActiveCollaborationMenu callsites outside declaration: 3/);
  assert.match(text, /resolved collaborator map set callsites: 5/);
  assert.match(text, /resolved collaborator map get callsites: 5/);
});

test('applyResolvedCollaborators stamps matching cards caches roster and schedules DOM fallback rerun', () => {
  const runtime = loadContentBridgeApplicationRuntime();
  const card = new FakeElement({
    'data-filtertube-video-id': 'videoA',
    'data-filtertube-collab-awaiting-dialog': 'true',
    'data-filtertube-collab-requested': 'mainworld',
    'data-filtertube-expected-collaborators': '2'
  });
  runtime.cards.push(card);

  const collaborators = [
    { name: 'Alpha Channel', handle: '@alpha' },
    { name: 'Beta Channel', id: ucId('B') }
  ];
  const result = runtime.exports.applyResolvedCollaborators('videoA', collaborators, {
    expectedCount: 2,
    sourceLabel: 'xhr'
  });

  assert.equal(result, true);
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')).map((item) => item.name), ['Alpha Channel', 'Beta Channel']);
  assert.equal(card.getAttribute('data-filtertube-collaborators-source'), 'xhr');
  assert.equal(card.getAttribute('data-filtertube-collaborators-ts'), String(runtime.fixedNow));
  assert.equal(card.getAttribute('data-filtertube-collab-state'), 'resolved');
  assert.equal(card.getAttribute('data-filtertube-collab-awaiting-dialog'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-requested'), null);
  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '2');
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('videoA')).map((item) => item.name), ['Alpha Channel', 'Beta Channel']);
  assert.deepEqual(runtime.playlistRefreshes, ['videoA']);
  assert.deepEqual(runtime.scheduledTimers.map((timer) => timer.delay), [0]);

  fireAllTimers(runtime);
  assert.deepEqual(plain(runtime.domFallbackCalls), [[null, { preserveScroll: true, forceReprocess: true }]]);
});

test('applyResolvedCollaborators with no target card still caches and schedules follow-on work while returning false', () => {
  const runtime = loadContentBridgeApplicationRuntime();
  const collaborators = [
    { name: 'No Card Alpha', handle: '@nocarda' },
    { name: 'No Card Beta', handle: '@nocardb' }
  ];

  const result = runtime.exports.applyResolvedCollaborators('missingVideo', collaborators, {
    expectedCount: 2
  });

  assert.equal(result, false);
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('missingVideo')).map((item) => item.handle), ['@nocarda', '@nocardb']);
  assert.deepEqual(runtime.playlistRefreshes, ['missingVideo']);
  assert.deepEqual(runtime.scheduledTimers.map((timer) => timer.delay), [0]);

  fireAllTimers(runtime);
  assert.equal(runtime.domFallbackCalls.length, 1);
});

test('richer global resolved cache blocks lower quality incoming collaborators unless force is set', () => {
  const runtime = loadContentBridgeApplicationRuntime();
  const rich = [
    { name: 'Rich Alpha', handle: '@richalpha', id: ucId('R') },
    { name: 'Rich Beta', handle: '@richbeta', id: ucId('S') }
  ];
  runtime.exports.resolvedCollaboratorsByVideoId.set('videoRich', rich);

  const result = runtime.exports.applyResolvedCollaborators('videoRich', [
    { name: 'Weak Alpha' }
  ]);

  assert.equal(result, false);
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('videoRich')).map((item) => item.name), ['Rich Alpha', 'Rich Beta']);
  assert.deepEqual(runtime.playlistRefreshes, []);
  assert.deepEqual(runtime.scheduledTimers, []);
});

test('force bypasses global richer-cache gate but does not overwrite richer card cache', () => {
  const runtime = loadContentBridgeApplicationRuntime();
  const rich = [
    { name: 'Card Alpha', handle: '@cardalpha', id: ucId('C') },
    { name: 'Card Beta', handle: '@cardbeta', id: ucId('D') }
  ];
  const card = new FakeElement({
    'data-filtertube-video-id': 'videoForce',
    'data-filtertube-collaborators': JSON.stringify(rich)
  });
  runtime.cards.push(card);
  runtime.exports.resolvedCollaboratorsByVideoId.set('videoForce', rich);

  const result = runtime.exports.applyResolvedCollaborators('videoForce', [
    { name: 'Forced Weak' }
  ], {
    force: true
  });

  assert.equal(result, true);
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')).map((item) => item.name), ['Card Alpha', 'Card Beta']);
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('videoForce')).map((item) => item.name), ['Forced Weak']);
  assert.equal(card.writes.some(([name]) => name === 'data-filtertube-collab-state'), false);
  assert.deepEqual(runtime.playlistRefreshes, ['videoForce']);
  assert.deepEqual(runtime.scheduledTimers.map((timer) => timer.delay), [0]);
});

test('refreshActiveCollaborationMenu prefers richer resolved cache and updates active menu state', () => {
  const runtime = loadContentBridgeApplicationRuntime();
  const card = new FakeElement({
    'data-filtertube-video-id': 'videoMenu',
    'data-filtertube-collaborators': JSON.stringify([{ name: 'Card Only', handle: '@cardonly' }]),
    'data-filtertube-expected-collaborators': '2'
  });
  const dropdown = new FakeElement();
  dropdown.isConnected = true;
  const richResolved = [
    { name: 'Resolved Alpha', handle: '@resolvedalpha', id: ucId('E') },
    { name: 'Resolved Beta', handle: '@resolvedbeta', id: ucId('F') }
  ];
  runtime.exports.resolvedCollaboratorsByVideoId.set('videoMenu', richResolved);
  runtime.exports.activeCollaborationDropdowns.set('videoMenu', {
    dropdown,
    videoCard: card,
    awaitingFullRender: true,
    expectedCount: 2,
    lastSignature: '',
    channelInfo: { videoId: 'videoMenu', name: 'Original' }
  });

  runtime.exports.refreshActiveCollaborationMenu('videoMenu', [
    { name: 'Incoming Only', handle: '@incomingonly' }
  ], {
    expectedCount: 2
  });

  assert.equal(runtime.renderCalls.length, 1);
  const rendered = plain(runtime.renderCalls[0]);
  assert.equal(rendered.placeholder, false);
  assert.deepEqual(rendered.channelInfo.allCollaborators.map((item) => item.name), ['Resolved Alpha', 'Resolved Beta']);
  assert.equal(rendered.channelInfo.expectedCollaboratorCount, 2);
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')).map((item) => item.name), ['Resolved Alpha', 'Resolved Beta']);

  const context = runtime.exports.activeCollaborationDropdowns.get('videoMenu');
  assert.equal(context.awaitingFullRender, false);
  assert.equal(context.expectedCount, 2);
  assert.equal(context.lastSignature, `${ucId('E').toLowerCase()}|${ucId('F').toLowerCase()}`);
});

test('product runtime still lacks first-class consumer application authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstNetworkSnapshotConsumerApplicationContract',
    'jsonFirstNetworkSnapshotConsumerApplicationDecision',
    'jsonFirstNetworkSnapshotConsumerResolvedCacheReport',
    'jsonFirstNetworkSnapshotConsumerDomStampReport',
    'jsonFirstNetworkSnapshotConsumerActiveMenuRefreshReport',
    'jsonFirstNetworkSnapshotConsumerPlaylistPopoverRefreshReport',
    'jsonFirstNetworkSnapshotConsumerDomFallbackRerunBudget',
    'jsonFirstNetworkSnapshotConsumerCacheDowngradePolicy',
    'jsonFirstNetworkSnapshotConsumerCardStampCorrelationReport',
    'jsonFirstNetworkSnapshotConsumerApplicationMetricArtifact'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
