import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_ENRICHMENT_RETRY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13623, 603362, 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c']
};

const blockSpecs = {
  contentBridgeCollaboratorPendingDialogState: {
    file: 'js/content_bridge.js',
    start: 'function generateCollabEntryKey(card, videoId) {',
    end: 'function scheduleCollaboratorRetry',
    startLine: 3299,
    lines: 66,
    bytes: 2426,
    hash: '2fb03120d2c077a1700cdfd7c8dc46a906440eee4e63a5f140f77e1298315165'
  },
  contentBridgeCollaboratorRetry: {
    file: 'js/content_bridge.js',
    start: 'function scheduleCollaboratorRetry(element, videoId, options = {}) {',
    end: 'function buildCollaboratorLookupRequestOptions',
    startLine: 3365,
    lines: 17,
    bytes: 778,
    hash: 'cbf39cc96640174f6df8bf2184b155bd8abde10ed01f759208ad577be474760f'
  },
  contentBridgeCollaboratorLookupOptions: {
    file: 'js/content_bridge.js',
    start: 'function buildCollaboratorLookupRequestOptions({ card = null, element = null, partialCollaborators = [], channelInfo = null } = {}) {',
    end: 'function requestCollaboratorEnrichment',
    startLine: 3382,
    lines: 54,
    bytes: 2358,
    hash: '710a851d88bb76cd65f3102c489accfdaa68e278a3967c070662cc033be40e7d'
  },
  contentBridgeCollaboratorEnrichmentRequest: {
    file: 'js/content_bridge.js',
    start: 'function requestCollaboratorEnrichment(element, videoId, partialCollaborators = []) {',
    end: 'function applyResolvedCollaborators',
    startLine: 3436,
    lines: 56,
    bytes: 2572,
    hash: '80f0359372c11ac0614e4eceb12291bc2c853fe0504e4f195c2eb5c37b60c444'
  },
  contentBridgeApplyResolvedCollaborators: {
    file: 'js/content_bridge.js',
    start: 'function applyResolvedCollaborators(videoId, collaborators, options = {}) {',
    end: 'function applyCollaboratorsByVideoId',
    startLine: 3492,
    lines: 102,
    bytes: 3877,
    hash: '1e7fbf0db7c63fb93aceb9d952f65a97da5d26a442c5bfae080d8d789dc435e4'
  },
  contentBridgeApplyCollaboratorsByVideoId: {
    file: 'js/content_bridge.js',
    start: 'function applyCollaboratorsByVideoId(videoId, collaborators, options = {}) {',
    end: '// Initialize stats from storage',
    startLine: 3594,
    lines: 105,
    bytes: 3995,
    hash: '3774b5599d4a959c83f6ea1c441985ba1b74304cb5d0720a79fd94006818459c'
  }
};

const selectedCounts = {
  generateCollabEntryKey: 2,
  pendingCollabCards: 8,
  'data-filtertube-collab-key': 2,
  'data-filtertube-collab-awaiting-dialog': 4,
  'data-filtertube-collab-state': 5,
  'data-filtertube-collab-requested': 5,
  'data-filtertube-collab-retries': 4,
  'data-filtertube-expected-collaborators': 13,
  expiryTimeout: 3,
  20000: 1,
  scheduleCollaboratorRetry: 3,
  maxRetries: 2,
  setTimeout: 4,
  requestCollaboratorEnrichment: 2,
  requestCollaboratorInfoFromMainWorld: 1,
  buildCollaboratorLookupRequestOptions: 2,
  expectedNames: 5,
  expectedHandles: 5,
  allowRosterFallbackForCollabMarkup: 3,
  cachedCollaborators: 2,
  parseCollaboratorNames: 1,
  applyResolvedCollaborators: 2,
  applyCollaboratorsByVideoId: 2,
  resolvedCollaboratorsByVideoId: 4,
  getCollaboratorListQuality: 6,
  force: 9,
  'JSON.stringify': 2,
  querySelectorAll: 2,
  shouldStampCardForVideoId: 2,
  'data-filtertube-collaborators': 4,
  'data-filtertube-collaborators-source': 1,
  'data-filtertube-collaborators-ts': 1,
  refreshActiveCollaborationMenu: 2,
  refreshOpenPlaylistFallbackPopoverForVideo: 2,
  applyDOMFallback: 4,
  'forceReprocess: true': 2,
  'preserveScroll: true': 2,
  collabDialogModule: 4,
  applyCollaboratorsToCard: 1
};

const missingRuntimeSymbols = [
  'contentBridgeCollaboratorEnrichmentContract',
  'contentBridgeCollaboratorRetryPolicy',
  'contentBridgeCollaboratorPendingCardReport',
  'contentBridgeCollaboratorLookupOptionsPolicy',
  'contentBridgeCollaboratorApplicationReport',
  'contentBridgeCollaboratorDomFallbackBudget',
  'contentBridgeCollaboratorMenuRefreshReport',
  'contentBridgeCollaboratorFixtureProvenance',
  'contentBridgeCollaboratorMetricArtifact',
  'contentBridgeCollaboratorAuthorityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256Text(block),
    block
  };
}

function selectedSource() {
  return Object.values(blockSpecs)
    .map((spec) => blockMetric(spec).block)
    .join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .map(read)
    .join('\n');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  querySelector() {
    return null;
  }
}

function loadCollaboratorRuntime({ responseFactory = null } = {}) {
  const bridge = read('js/content_bridge.js');
  const source = Object.values(blockSpecs)
    .map((spec) => sliceBetween(bridge, spec).block)
    .join('\n');

  const cards = [];
  const requests = [];
  const timers = [];
  const activeMenuRefreshes = [];
  const playlistRefreshes = [];
  const domFallbackCalls = [];
  const dialogApplications = [];
  const fixedNow = 1700000000000;

  const documentObject = {
    querySelector(selector) {
      const match = String(selector || '').match(/^\[data-filtertube-video-id="([^"]+)"\]$/);
      if (!match) return null;
      return cards.find((card) => card.getAttribute('data-filtertube-video-id') === match[1]) || null;
    },
    querySelectorAll(selector) {
      const match = String(selector || '').match(/^\[data-filtertube-video-id="([^"]+)"\]$/);
      if (!match) return [];
      return cards.filter((card) => card.getAttribute('data-filtertube-video-id') === match[1]);
    }
  };

  const windowObject = {
    pendingCollabCards: new Map(),
    collabDialogModule: {
      applyCollaboratorsToCard(entry, collaborators) {
        dialogApplications.push({ key: entry?.key || '', collaborators: plain(collaborators) });
      }
    }
  };

  const context = {
    __cards: cards,
    __requests: requests,
    __timers: timers,
    __activeMenuRefreshes: activeMenuRefreshes,
    __playlistRefreshes: playlistRefreshes,
    __domFallbackCalls: domFallbackCalls,
    __dialogApplications: dialogApplications,
    __fixedNow: fixedNow,
    __responseFactory(videoId, options) {
      requests.push({ videoId, options: plain(options) });
      if (responseFactory) return responseFactory(videoId, options);
      return Promise.resolve([]);
    },
    window: windowObject,
    document: documentObject,
    console: { log() {}, warn() {}, error() {} },
    setTimeout(handler, delay) {
      const timer = { handler, delay, fired: false };
      timers.push(timer);
      return timers.length;
    },
    clearTimeout(timerId) {
      const timer = timers[timerId - 1];
      if (timer) timer.cleared = true;
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
    parseInt,
    isNaN
  };
  context.globalThis = context;

  const harness = `
    const resolvedCollaboratorsByVideoId = new Map();

    function normalizeHandleValue(value) {
      if (!value || typeof value !== 'string') return '';
      const trimmed = value.trim();
      if (!trimmed) return '';
      return trimmed.startsWith('@') ? trimmed : '@' + trimmed.replace(/^\\/+/, '');
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const output = [];
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
        output.push(normalized);
      }
      return output;
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

    function parseCollaboratorNames(rawText = '') {
      if (!rawText || typeof rawText !== 'string') {
        return { names: [], hasHiddenCollaborators: false, hiddenCount: 0 };
      }
      const normalizedText = rawText.replace(/\\s+/g, ' ').trim();
      const hiddenCountMatches = normalizedText.match(/\\b(\\d+)\\s+more\\b/gi) || [];
      let hiddenCount = 0;
      for (const match of hiddenCountMatches) {
        const countMatch = match.match(/(\\d+)\\s+more/i);
        hiddenCount += countMatch ? parseInt(countMatch[1], 10) : 1;
      }
      const hasHiddenCollaborators = hiddenCountMatches.length > 0;
      const base = hasHiddenCollaborators
        ? normalizedText.replace(/\\s*(?:,|&|\\band\\b)\\s+\\d+\\s+more\\b.*$/i, '').trim()
        : normalizedText;
      return {
        names: base ? [base] : [],
        hasHiddenCollaborators,
        hiddenCount
      };
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

    function findVideoCardElement(element) {
      return element?.card || element || null;
    }

    function shouldStampCardForVideoId(card, videoId) {
      return Boolean(card?.isConnected !== false && card?.getAttribute?.('data-filtertube-video-id') === videoId);
    }

    function requestCollaboratorInfoFromMainWorld(videoId, options) {
      return globalThis.__responseFactory(videoId, options);
    }

    function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {
      globalThis.__activeMenuRefreshes.push({ videoId, collaborators: JSON.parse(JSON.stringify(collaborators)), options });
    }

    function refreshOpenPlaylistFallbackPopoverForVideo(videoId) {
      globalThis.__playlistRefreshes.push(videoId);
    }

    function applyDOMFallback(...args) {
      globalThis.__domFallbackCalls.push(args);
    }

    ${source}

    globalThis.__exports = {
      generateCollabEntryKey,
      markCardForDialogEnrichment,
      scheduleCollaboratorRetry,
      buildCollaboratorLookupRequestOptions,
      requestCollaboratorEnrichment,
      applyResolvedCollaborators,
      applyCollaboratorsByVideoId,
      resolvedCollaboratorsByVideoId,
      pendingCollabCards: window.pendingCollabCards
    };
  `;

  vm.runInNewContext(harness, context);

  return {
    ...context,
    exports: context.__exports,
    fireTimer(index) {
      const timer = timers[index];
      assert.ok(timer, `missing timer at index ${index}`);
      timer.fired = true;
      return timer.handler();
    },
    async flush() {
      await Promise.resolve();
      await Promise.resolve();
    }
  };
}

function ucId(fill = 'A') {
  return `UC${String(fill).repeat(22).slice(0, 22)}`;
}

test('content bridge collaborator enrichment retry audit is audit-only and source pinned', () => {
  const text = doc();
  assert.match(text, /Status: current-behavior proof only\./);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /content-bridge collaborator enrichment retry path in `js\/content_bridge\.js`/);
  assert.match(text, /content bridge collaborator enrichment retry source files: 1/);
  assert.match(text, /content bridge collaborator enrichment retry source\/effect blocks: 6/);
  assert.match(text, /tests\/runtime\/content-bridge-collaborator-enrichment-retry-boundary-current-behavior\.test\.mjs/);
});

test('content bridge collaborator enrichment retry source fingerprints and block metrics remain pinned', () => {
  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file}: line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file}: byte count changed`);
    assert.equal(sha256File(file), hash, `${file}: hash changed`);
  }

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const actual = blockMetric(spec);
    assert.deepEqual(
      {
        startLine: actual.startLine,
        lines: actual.lines,
        bytes: actual.bytes,
        hash: actual.hash
      },
      {
        startLine: spec.startLine,
        lines: spec.lines,
        bytes: spec.bytes,
        hash: spec.hash
      },
      `${name} metrics drifted`
    );
  }
});

test('content bridge collaborator enrichment retry selected token counts remain pinned', () => {
  const source = selectedSource();
  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(doc(), new RegExp(`\\| \`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${expected} \\|`));
  }
});

test('content bridge collaborator enrichment retry authority symbols are still absent from product runtime', () => {
  const runtime = productRuntimeSource();
  for (const symbol of missingRuntimeSymbols) {
    assert.doesNotMatch(runtime, new RegExp(symbol));
    assert.match(doc(), new RegExp(`- \`${symbol}\``));
  }
});

test('markCardForDialogEnrichment stores pending state and expires it after 20000 ms', () => {
  const runtime = loadCollaboratorRuntime();
  const card = new FakeElement({ 'data-filtertube-expected-collaborators': '4' });

  runtime.exports.markCardForDialogEnrichment(card, 'VIDEOABC123', [{ name: 'Alice' }]);

  const entry = runtime.exports.pendingCollabCards.get('vid:VIDEOABC123');
  assert.ok(entry);
  assert.equal(entry.key, 'vid:VIDEOABC123');
  assert.equal(entry.videoId, 'VIDEOABC123');
  assert.deepEqual(plain(entry.partialCollaborators), [{ name: 'Alice' }]);
  assert.equal(entry.expectedCollaboratorCount, 4);
  assert.equal(card.getAttribute('data-filtertube-collab-awaiting-dialog'), 'true');
  assert.equal(card.getAttribute('data-filtertube-collab-state'), 'pending');
  assert.equal(card.getAttribute('data-filtertube-video-id'), 'VIDEOABC123');
  assert.equal(runtime.__timers[0].delay, 20000);

  runtime.fireTimer(0);
  assert.equal(runtime.exports.pendingCollabCards.has('vid:VIDEOABC123'), false);
  assert.equal(card.getAttribute('data-filtertube-collab-awaiting-dialog'), null);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), null);
});

test('scheduleCollaboratorRetry caps retries and clears requested state before retrying', () => {
  const runtime = loadCollaboratorRuntime({
    responseFactory() {
      return Promise.resolve([]);
    }
  });
  const card = new FakeElement({ 'data-filtertube-collab-requested': 'mainworld' });

  runtime.exports.scheduleCollaboratorRetry(card, 'VIDEORTY001');
  assert.equal(card.getAttribute('data-filtertube-collab-retries'), '1');
  assert.equal(card.getAttribute('data-filtertube-collab-requested'), null);
  assert.equal(runtime.__timers.at(-1).delay, 700);

  runtime.fireTimer(runtime.__timers.length - 1);
  assert.equal(runtime.__requests.length, 1);
  assert.equal(runtime.__requests[0].videoId, 'VIDEORTY001');

  const exhausted = new FakeElement({ 'data-filtertube-collab-retries': '3' });
  const timerCount = runtime.__timers.length;
  runtime.exports.scheduleCollaboratorRetry(exhausted, 'VIDEORTY002');
  assert.equal(runtime.__timers.length, timerCount);
});

test('buildCollaboratorLookupRequestOptions merges cached partial and channel hints', () => {
  const runtime = loadCollaboratorRuntime();
  const card = new FakeElement({
    'data-filtertube-collaborators': JSON.stringify([{ name: 'Cached Creator', handle: '@cached' }]),
    'data-filtertube-expected-collaborators': '2'
  });
  const options = runtime.exports.buildCollaboratorLookupRequestOptions({
    card,
    partialCollaborators: [{ name: 'Partial Creator', handle: '@partial' }],
    channelInfo: {
      name: 'Alice and 3 more',
      expectedChannelName: 'Expected Creator',
      handle: '@primary',
      expectedCollaboratorCount: 1,
      allCollaborators: [{ name: 'Listed Creator', handle: '@listed' }]
    }
  });

  assert.ok(options.expectedNames.includes('Partial Creator'));
  assert.ok(options.expectedNames.includes('Cached Creator'));
  assert.ok(options.expectedNames.includes('Alice and 3 more'));
  assert.ok(options.expectedNames.includes('Alice'));
  assert.ok(options.expectedNames.includes('Expected Creator'));
  assert.ok(options.expectedHandles.includes('@partial'));
  assert.ok(options.expectedHandles.includes('@listed'));
  assert.ok(options.expectedHandles.includes('@primary'));
  assert.equal(options.allowRosterFallbackForCollabMarkup, true);
  assert.equal(options.expectedCollaboratorCount, 4);
  assert.deepEqual(plain(options.cachedCollaborators), [{ name: 'Cached Creator', handle: '@cached', id: '', customUrl: '' }]);
});

test('requestCollaboratorEnrichment applies non-empty responses and retries empty responses', async () => {
  const successful = loadCollaboratorRuntime({
    responseFactory() {
      return Promise.resolve([{ name: 'Resolved Creator', handle: '@resolved', id: ucId('R') }]);
    }
  });
  const successCard = new FakeElement({ 'data-filtertube-video-id': 'VIDEOSUCC01' });
  successful.__cards.push(successCard);

  successful.exports.requestCollaboratorEnrichment(successCard, 'VIDEOSUCC01', [{ name: 'Seed' }]);
  await successful.flush();

  assert.equal(successful.__requests.length, 1);
  assert.equal(successCard.getAttribute('data-filtertube-collab-requested'), null);
  assert.equal(successCard.getAttribute('data-filtertube-collab-state'), 'resolved');
  assert.match(successCard.getAttribute('data-filtertube-collaborators'), /Resolved Creator/);
  assert.equal(successful.__activeMenuRefreshes.length, 1);
  assert.deepEqual(successful.__playlistRefreshes, ['VIDEOSUCC01']);
  assert.equal(successful.__timers.some((timer) => timer.delay === 0), true);

  const empty = loadCollaboratorRuntime({
    responseFactory() {
      return Promise.resolve([]);
    }
  });
  const emptyCard = new FakeElement({ 'data-filtertube-video-id': 'VIDEOEMPTY1' });
  empty.exports.requestCollaboratorEnrichment(emptyCard, 'VIDEOEMPTY1', [{ name: 'Seed' }]);
  await empty.flush();

  assert.equal(empty.__requests.length, 1);
  assert.equal(emptyCard.getAttribute('data-filtertube-collab-retries'), '1');
  assert.equal(empty.__timers.some((timer) => timer.delay === 700), true);

  const duplicate = loadCollaboratorRuntime();
  const duplicateCard = new FakeElement({ 'data-filtertube-collab-requested': 'mainworld' });
  duplicate.exports.requestCollaboratorEnrichment(duplicateCard, 'VIDEODUPE01', []);
  assert.equal(duplicate.__requests.length, 0);
  assert.equal(duplicate.exports.pendingCollabCards.has('vid:VIDEODUPE01'), true);
});

test('applyCollaboratorsByVideoId creates pending entry refreshes collaborators and schedules forced fallback', () => {
  const runtime = loadCollaboratorRuntime();
  const card = new FakeElement({ 'data-filtertube-video-id': 'VIDEOBATCH1' });
  runtime.__cards.push(card);

  const result = runtime.exports.applyCollaboratorsByVideoId('VIDEOBATCH1', [
    { name: 'Batch Creator', handle: '@batch', id: ucId('B') }
  ]);

  assert.equal(result, true);
  assert.equal(runtime.exports.pendingCollabCards.has('vid:VIDEOBATCH1'), true);
  assert.match(card.getAttribute('data-filtertube-collaborators'), /Batch Creator/);
  assert.equal(card.getAttribute('data-filtertube-collab-state'), 'resolved');
  assert.equal(runtime.__dialogApplications.length, 1);
  assert.equal(runtime.__activeMenuRefreshes.length, 1);
  assert.deepEqual(runtime.__playlistRefreshes, ['VIDEOBATCH1']);

  const fallbackTimerIndex = runtime.__timers.findIndex((timer) => timer.delay === 0);
  assert.notEqual(fallbackTimerIndex, -1);
  runtime.fireTimer(fallbackTimerIndex);
  assert.deepEqual(plain(runtime.__domFallbackCalls), [[null, { preserveScroll: true, forceReprocess: true }]]);
});

test('applyCollaboratorsByVideoId keeps richer resolved cache unless force is provided', () => {
  const runtime = loadCollaboratorRuntime();
  const rich = [{ name: 'Rich Creator', handle: '@rich', id: ucId('Z') }];
  runtime.exports.resolvedCollaboratorsByVideoId.set('VIDEORICH01', rich);

  const skipped = runtime.exports.applyCollaboratorsByVideoId('VIDEORICH01', [
    { name: 'Name Only Creator' }
  ]);
  assert.equal(skipped, false);
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('VIDEORICH01')), rich);

  const forced = runtime.exports.applyCollaboratorsByVideoId('VIDEORICH01', [
    { name: 'Name Only Creator' }
  ], { force: true });
  assert.equal(forced, false);
  assert.deepEqual(plain(runtime.exports.resolvedCollaboratorsByVideoId.get('VIDEORICH01')), [
    { name: 'Name Only Creator', handle: '', id: '', customUrl: '' }
  ]);
});
