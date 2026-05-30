import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13571, 601694, '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3']
};

const blockSpecs = {
  contentBridgeWatchLikeCollaborationWarmup: {
    file: 'js/content_bridge.js',
    start: 'function getWatchLikeCollaborationWarmup(videoCard) {',
    end: 'function promoteYtmWatchRowIdentityFromCollaboratorMetadata',
    startLine: 4822,
    lines: 30,
    bytes: 1297,
    hash: '53d862a7e45c0dacd6795046e53cf9e257dee3394deeed10a06eb5ec1a1dfda2'
  },
  contentBridgeYtmCollaboratorIdentityPromotion: {
    file: 'js/content_bridge.js',
    start: 'function promoteYtmWatchRowIdentityFromCollaboratorMetadata(channelInfo, videoCard) {',
    end: 'function cardHasCollaborationDomSignal',
    startLine: 4852,
    lines: 92,
    bytes: 3296,
    hash: 'deefe23561a642fd66ccf80bcab3ff513472356c9141dc145d9a1e2227b2b140'
  },
  contentBridgeCollaborationDomSignal: {
    file: 'js/content_bridge.js',
    start: 'function cardHasCollaborationDomSignal(videoCard) {',
    end: 'function normalizeCollaboratorChannelInfoForCard',
    startLine: 4944,
    lines: 120,
    bytes: 5285,
    hash: '9a17597d1f08ebb5c4e4ed9bdd74dcdae28dd00135e3151e0e6575f682aca32a'
  },
  contentBridgeCollaboratorChannelInfoNormalization: {
    file: 'js/content_bridge.js',
    start: 'function normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, options = {}) {',
    end: 'function promoteChannelInfoFromCollaboratorSignals',
    startLine: 5064,
    lines: 154,
    bytes: 6370,
    hash: 'a1b488fd8228fa830e2914f872e3911cb9b8b6e092a7201540867e6b31cf94d0'
  },
  contentBridgeCollaboratorSignalPromotion: {
    file: 'js/content_bridge.js',
    start: 'function promoteChannelInfoFromCollaboratorSignals(channelInfo, videoCard) {',
    end: 'function normalizeHandleForComparison',
    startLine: 5218,
    lines: 86,
    bytes: 3081,
    hash: '55ff41d06a422df35dd5c241198978dbd19df3428f0969e06193860652a8a31d'
  },
  contentBridgeExtractChannelCollaborationPriority: {
    file: 'js/content_bridge.js',
    start: '        // PRIORITY: Check for collaboration videos (Search attributed-channel-name, Home metadata rows, Avatar stack)',
    end: '        // Method 2: Check for data attributes (added by FilterTube',
    startLine: 9915,
    lines: 32,
    bytes: 1622,
    hash: '8e2087627598bda37bb8814981dd27df4a44f9970fd0165a8829d390ecfcbfe4'
  },
  contentBridgeLockupCollaborationHandoff: {
    file: 'js/content_bridge.js',
    start: '        // Method 5: Homepage Lockup / Modern Metadata fallback',
    end: '                const avatarImg = lockupMetadata.querySelector',
    startLine: 10382,
    lines: 24,
    bytes: 1290,
    hash: '163574a088d8e8bd725e9b668974e39da9e85d17a578dbb834bd6d451a8d0bae'
  }
};

const selectedCounts = {
  getWatchLikeCollaborationWarmup: 1,
  promoteYtmWatchRowIdentityFromCollaboratorMetadata: 1,
  cardHasCollaborationDomSignal: 2,
  normalizeCollaboratorChannelInfoForCard: 1,
  promoteChannelInfoFromCollaboratorSignals: 1,
  extractCollaboratorMetadataFromElement: 4,
  sanitizeCollaboratorList: 9,
  resolvedCollaboratorsByVideoId: 2,
  clearCollaboratorMetadataFromCard: 4,
  isMixCardElement: 5,
  isYtmWatchLikeCollaboratorCard: 2,
  isDesktopWatchLikeCollaboratorCard: 1,
  extractVideoIdFromCard: 6,
  ensureVideoIdForCard: 4,
  'data-filtertube-expected-collaborators': 8,
  'data-filtertube-collaborators': 1,
  setAttribute: 2,
  getValidatedCachedCollaborators: 1,
  extractCollaboratorsFromAvatarStackElement: 1,
  mergeCollaboratorLists: 1,
  getCollaboratorListQuality: 8,
  hasCompleteCollaboratorRoster: 1,
  buildCollaboratorSignature: 1,
  needsEnrichment: 8,
  isCollaboration: 10,
  allCollaborators: 12,
  expectedCollaboratorCount: 20,
  videoId: 63,
  parseCollaboratorNames: 3,
  countDistinctChannelLinks: 1,
  querySelector: 14,
  'yt-avatar-stack-view-model': 3,
  extractYtmBylineText: 4,
  extractDesktopWatchLikeBylineText: 3,
  lockupMetadata: 2,
  avatarStackSignal: 2,
  hasCollaboratorSeparatorEvidence: 4,
  isAmpersandTopicNameOnlyCollaboratorState: 6,
  getResolvedCollaboratorsForCard: 5,
  rejectAmpersandTopicCollaboratorWrite: 1,
  shouldStampCardForVideoId: 1
};

const missingRuntimeSymbols = [
  'contentBridgeCollaboratorIdentityPromotionContract',
  'contentBridgeCollaboratorIdentityPromotionDecision',
  'contentBridgeCollaboratorPromotionSideEffectReport',
  'contentBridgeCollaboratorPromotionPureReadPolicy',
  'contentBridgeCollaboratorPromotionCallerPolicy',
  'contentBridgeCollaboratorPromotionRouteScopeReport',
  'contentBridgeCollaboratorPromotionCacheWriteReport',
  'contentBridgeCollaboratorPromotionFixtureProvenance',
  'contentBridgeCollaboratorPromotionMetricArtifact',
  'contentBridgeCollaboratorPromotionAuthorityGate'
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
  return Object.values(blockSpecs).map((spec) => blockMetric(spec).block).join('\n');
}

function executablePromotionSource() {
  return [
    blockSpecs.contentBridgeWatchLikeCollaborationWarmup,
    blockSpecs.contentBridgeYtmCollaboratorIdentityPromotion,
    blockSpecs.contentBridgeCollaborationDomSignal,
    blockSpecs.contentBridgeCollaboratorChannelInfoNormalization,
    blockSpecs.contentBridgeCollaboratorSignalPromotion
  ].map((spec) => blockMetric(spec).block).join('\n');
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

class FakeNode {
  constructor({ tagName = 'YTD-VIDEO-RENDERER', textContent = '', attrs = {}, children = {}, all = {} } = {}) {
    this.tagName = tagName;
    this.textContent = textContent;
    this.attrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.children = children;
    this.all = all;
    this.writes = [];
    this.queries = [];
    this.isConnected = true;
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
  }

  querySelector(selector) {
    const key = String(selector || '');
    this.queries.push(key);
    return this.children[key] || null;
  }

  querySelectorAll(selector) {
    const key = String(selector || '');
    this.queries.push(key);
    return this.all[key] || [];
  }

  closest() {
    return null;
  }

  matches(selector) {
    return String(selector || '').split(',').map((part) => part.trim().toLowerCase()).includes(String(this.tagName || '').toLowerCase());
  }
}

function ucId(label) {
  return `UC${label.padEnd(22, label).slice(0, 22)}`;
}

function collaborator(name, extras = {}) {
  return {
    name,
    handle: extras.handle || '',
    id: extras.id || '',
    customUrl: extras.customUrl || ''
  };
}

function loadPromotionRuntime() {
  const extractCalls = [];
  const clearCalls = [];
  const context = {
    __extractCalls: extractCalls,
    __clearCalls: clearCalls,
    console: { log() {}, warn() {}, error() {} },
    JSON,
    Map,
    Set,
    WeakSet,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    parseInt,
    isNaN
  };
  context.globalThis = context;

  const harness = `
    const resolvedCollaboratorsByVideoId = new Map();

    function isMixCardElement(card) {
      return Boolean(card?.isMixCard);
    }

    function clearCollaboratorMetadataFromCard(card) {
      globalThis.__clearCalls.push(card?.label || card?.tagName || 'card');
    }

    function isDesktopWatchPlaylistPanelCard(card) {
      return Boolean(card?.isDesktopPlaylist);
    }

    function isYtmWatchLikeCollaboratorCard(card) {
      return Boolean(card?.isYtmWatchLike || String(card?.tagName || '').toLowerCase().startsWith('ytm-'));
    }

    function isDesktopWatchLikeCollaboratorCard(card) {
      return Boolean(card?.isDesktopWatchLike);
    }

    function extractDesktopWatchLikeBylineText(card) {
      return card?.desktopBylineText || '';
    }

    function extractYtmBylineText(card) {
      return card?.ytmBylineText || '';
    }

    function parseCollaboratorNames(rawText = '', options = {}) {
      if (!rawText || typeof rawText !== 'string') {
        return { names: [], hasHiddenCollaborators: false, hiddenCount: 0 };
      }
      const normalized = rawText.replace(/\\s+/g, ' ').trim();
      const hiddenMatches = normalized.match(/\\b(\\d+)\\s+more\\b/gi) || [];
      let hiddenCount = 0;
      for (const item of hiddenMatches) {
        const count = item.match(/(\\d+)\\s+more/i);
        hiddenCount += count ? parseInt(count[1], 10) : 1;
      }
      const base = hiddenMatches.length > 0
        ? normalized.replace(/\\s*(?:,|&|\\band\\b)\\s+\\d+\\s+more\\b.*$/i, '').trim()
        : normalized;
      const names = options?.allowSeparatorSplit
        ? base.split(/\\s*(?:,|\\band\\b)\\s*/i).map(item => item.trim()).filter(Boolean)
        : (base ? [base] : []);
      return { names, hasHiddenCollaborators: hiddenMatches.length > 0, hiddenCount };
    }

    function extractVideoIdFromCard(card) {
      return card?.extractedVideoId || '';
    }

    function ensureVideoIdForCard(card) {
      return card?.ensuredVideoId || card?.getAttribute?.('data-filtertube-video-id') || '';
    }

    function normalizeHandleValue(value = '') {
      const cleaned = String(value || '').trim().replace(/^\\/+/, '');
      if (!cleaned) return '';
      return cleaned.startsWith('@') ? cleaned : '@' + cleaned;
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const out = [];
      for (const collab of collaborators) {
        if (!collab || typeof collab !== 'object') continue;
        const normalized = {
          name: String(collab.name || '').trim(),
          handle: normalizeHandleValue(collab.handle || ''),
          id: String(collab.id || '').trim(),
          customUrl: String(collab.customUrl || '').trim()
        };
        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl) continue;
        const key = (normalized.id || normalized.handle || normalized.customUrl || normalized.name).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
      }
      return out;
    }

    function extractCollaboratorMetadataFromElement(card) {
      globalThis.__extractCalls.push(card?.label || card?.tagName || 'card');
      return sanitizeCollaboratorList(card?.extractedCollaborators || []);
    }

    function hasAttributedCollaboratorSignal(node) {
      return Boolean(node?.collabSignal);
    }

    function countDistinctChannelLinks(card) {
      return card?.distinctLinks || 0;
    }

    function hasCollaboratorSeparatorEvidence(card, rawText = '') {
      const text = String(rawText || '').replace(/\\s+/g, ' ').trim();
      if (/\\band\\s+\\d+\\s+more\\b/i.test(text) || /\\b\\d+\\s+more\\b/i.test(text)) return true;
      if (card?.querySelector?.('yt-avatar-stack-view-model')) return true;
      if (hasAttributedCollaboratorSignal(card?.querySelector?.('#attributed-channel-name, [id="attributed-channel-name"]'))) return true;
      return countDistinctChannelLinks(card) >= 2;
    }

    function getCollaboratorListQuality(list = []) {
      return sanitizeCollaboratorList(list).reduce((score, collab) => {
        return score + 1 + (collab.name ? 1 : 0) + (collab.handle ? 3 : 0) + (collab.id ? 5 : 0) + (collab.customUrl ? 2 : 0);
      }, 0);
    }

    function getValidatedCachedCollaborators(card) {
      return sanitizeCollaboratorList(card?.validatedCollaborators || []);
    }

    function extractCollaboratorsFromAvatarStackElement(element) {
      return sanitizeCollaboratorList(element?.stackCollaborators || []);
    }

    function mergeCollaboratorLists(left = [], right = []) {
      return sanitizeCollaboratorList([...left, ...right]);
    }

    function resolveExpectedCollaboratorCount(rawCollaborators, sanitizedCollaborators, ...hints) {
      const rawLength = Array.isArray(rawCollaborators) ? rawCollaborators.length : 0;
      const sanitizedLength = Array.isArray(sanitizedCollaborators) ? sanitizedCollaborators.length : 0;
      const numeric = hints.map(value => parseInt(value || '0', 10) || 0);
      return Math.max(rawLength, sanitizedLength, ...numeric);
    }

    function hasCompleteCollaboratorRoster(collaborators = [], expectedCount = 0) {
      const sanitized = sanitizeCollaboratorList(collaborators);
      if (sanitized.length === 0) return false;
      return sanitized.every(collab => Boolean(collab.id || collab.handle || collab.customUrl)) &&
        (!expectedCount || sanitized.length >= expectedCount);
    }

    function buildCollaboratorSignature(collaborators = []) {
      return sanitizeCollaboratorList(collaborators)
        .map(collab => (collab.id || collab.handle || collab.customUrl || collab.name).toLowerCase())
        .join('|');
    }

    ${executablePromotionSource()}

    globalThis.__exports = {
      getWatchLikeCollaborationWarmup,
      promoteYtmWatchRowIdentityFromCollaboratorMetadata,
      cardHasCollaborationDomSignal,
      normalizeCollaboratorChannelInfoForCard,
      promoteChannelInfoFromCollaboratorSignals,
      resolvedCollaboratorsByVideoId
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context);
  return {
    exports: context.__exports,
    extractCalls,
    clearCalls
  };
}

function loadQuickBlockActionRuntime() {
  const clearCalls = [];
  const context = {
    console: { log() {}, warn() {}, error() {} },
    JSON,
    Map,
    Set,
    WeakSet,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    Date,
    parseInt,
    isNaN,
    __quickBlockClearCalls: clearCalls
  };
  context.globalThis = context;

  const source = read('js/content/block_channel.js');
  const startNeedle = 'function collectQuickBlockCollaborators(base = {}, videoCard = null) {';
  const endNeedle = 'function buildQuickBlockFallbackMetadata';
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);

  const harness = `
    const currentSettings = { videoChannelMap: {} };

    function blockChannelDebugLog() {}

    function normalizeHandleValue(value = '') {
      const cleaned = String(value || '').trim().replace(/^\\/+/, '');
      if (!cleaned) return '';
      return cleaned.startsWith('@') ? cleaned : '@' + cleaned;
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const out = [];
      for (const collab of collaborators) {
        if (!collab || typeof collab !== 'object') continue;
        const normalized = {
          name: String(collab.name || '').trim(),
          handle: normalizeHandleValue(collab.handle || ''),
          id: String(collab.id || '').trim(),
          customUrl: String(collab.customUrl || '').trim(),
          logo: collab.logo || '',
          channelLogo: collab.channelLogo || '',
          videoId: collab.videoId || '',
          videoTitleHint: collab.videoTitleHint || '',
          source: collab.source || ''
        };
        if (!normalized.name && !normalized.handle && !normalized.id && !normalized.customUrl && !normalized.videoId) continue;
        const key = (normalized.id || normalized.handle || normalized.customUrl || normalized.name || normalized.videoId).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
      }
      return out;
    }

    function extractCollaboratorMetadataFromElement(card) {
      return sanitizeCollaboratorList(card?.extractedCollaborators || []);
    }

    function extractChannelFromCard(card) {
      return card?.baseChannel || {};
    }

    function promoteChannelInfoFromCollaboratorSignals(base, card) {
      return card?.promotedChannelInfo || base;
    }

    function normalizeCollaboratorChannelInfoForCard(base, card) {
      return { channelInfo: card?.normalizedChannelInfo || base };
    }

    function isShortsContentElement() {
      return false;
    }

    function ensureVideoIdForCard(card) {
      return card?.ensuredVideoId || card?.getAttribute?.('data-filtertube-video-id') || '';
    }

    function extractVideoIdFromCard(card) {
      return card?.extractedVideoId || '';
    }

    function extractShortsVideoIdFromElement() {
      return '';
    }

    function normalizeCollaboratorLabelForComparison(value = '') {
      return String(value || '').replace(/\\s+/g, ' ').trim().toLowerCase();
    }

    function getLiteralAmpersandTopicByline(card) {
      const normalized = String(
        card?.topicBylineText ||
        card?.desktopBylineText ||
        card?.ytmBylineText ||
        card?.textContent ||
        card?.baseChannel?.name ||
        ''
      ).replace(/\\s+/g, ' ').trim();
      if (!normalized) return '';
      if (!/\\s&\\s/.test(normalized) || !/\\s-\\sTopic$/i.test(normalized)) return '';
      return normalized;
    }

    function isAmpersandTopicNameOnlyCollaboratorState(card, collaborators = []) {
      const topicByline = getLiteralAmpersandTopicByline(card);
      if (!topicByline) return false;
      const sanitized = sanitizeCollaboratorList(collaborators);
      if (sanitized.length < 2) return false;
      if (!sanitized.every(collab => collab?.name && !collab.handle && !collab.id && !collab.customUrl)) return false;
      return normalizeCollaboratorLabelForComparison(sanitized.map(collab => collab.name).join(' & ')) === normalizeCollaboratorLabelForComparison(topicByline);
    }

    function clearAmpersandTopicCollaboratorState(card, videoId = '') {
      globalThis.__quickBlockClearCalls.push({ label: card?.label || '', videoId });
    }

    function generateCollaborationGroupId() {
      return 'quick-topic-proof';
    }

    ${source.slice(start, end)}

    globalThis.__exports = {
      collectQuickBlockCollaborators,
      buildQuickBlockContext,
      getQuickBlockActionInfo
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context);
  return {
    exports: context.__exports,
    clearCalls
  };
}

test('collaborator identity promotion handoff audit and implementation addendum are source pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior proof with 2026-05-28 and 2026-05-29 implementation addenda/);
  assert.match(text, /bare `and` text no longer enters collaborator mode without stronger evidence/);
  assert.match(text, /blocks literal ampersand Topic name-only rosters before collaborator writer paths stamp card or resolved-cache state/);
  assert.match(text, /runtime behavior changed by this addendum: yes/);
  assert.match(text, /not completion proof for collaborator identity promotion authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.ok(text.includes(`\`${file}\``), `doc should cite ${file}`);
  }
});

test('collaborator identity promotion handoff source and effect blocks remain pinned', () => {
  const text = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.ok(text.includes(String(spec.lines)), `doc should include line count for ${name}`);
    assert.ok(text.includes(String(spec.bytes)), `doc should include byte count for ${name}`);
    assert.ok(text.includes(spec.hash), `doc should include hash for ${name}`);
  }
});

test('collaborator identity promotion handoff token counts remain pinned', () => {
  const text = doc();
  const source = selectedSource();

  for (const [literal, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, literal), expected, `${literal} count changed`);
    assert.match(text, new RegExp(`\\\`${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\` \\\\| ${expected}`));
  }
});

test('collaborator identity promotion missing future symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
  }
});

test('watch-like collaboration warmup requires evidence and skips Mix cards', () => {
  const runtime = loadPromotionRuntime();
  const watchCard = new FakeNode();
  watchCard.desktopBylineText = 'Alice and Bob';
  watchCard.distinctLinks = 2;

  assert.deepEqual(plain(runtime.exports.getWatchLikeCollaborationWarmup(watchCard)), {
    collaborators: [
      { name: 'Alice', handle: '', id: '', customUrl: '' },
      { name: 'Bob', handle: '', id: '', customUrl: '' }
    ],
    expectedCount: 2
  });

  const mixCard = new FakeNode();
  mixCard.isMixCard = true;
  mixCard.desktopBylineText = 'Alice and Bob';
  assert.deepEqual(plain(runtime.exports.getWatchLikeCollaborationWarmup(mixCard)), {
    collaborators: [],
    expectedCount: 0
  });
});

test('watch-like collaboration warmup does not split ampersand Topic bylines', () => {
  const runtime = loadPromotionRuntime();
  const topicCard = new FakeNode();
  topicCard.isDesktopWatchLike = true;
  topicCard.desktopBylineText = 'Kully B & Gussy G - Topic';

  assert.deepEqual(plain(runtime.exports.getWatchLikeCollaborationWarmup(topicCard)), {
    collaborators: [],
    expectedCount: 0
  });
  assert.equal(runtime.exports.cardHasCollaborationDomSignal(topicCard), false);

  const staleStateCard = new FakeNode({
    tagName: 'YTM-VIDEO-WITH-CONTEXT-RENDERER',
    attrs: {
      'data-filtertube-video-id': 'o4LJY7Zhxjk',
      'data-filtertube-expected-collaborators': '2'
    }
  });
  staleStateCard.label = 'topic-stale-card';
  staleStateCard.isYtmWatchLike = true;
  staleStateCard.extractedVideoId = 'o4LJY7Zhxjk';
  staleStateCard.desktopBylineText = 'Kully B & Gussy G - Topic';
  staleStateCard.ytmBylineText = 'Kully B & Gussy G - Topic';
  staleStateCard.extractedCollaborators = [
    collaborator('Kully B'),
    collaborator('Gussy G - Topic')
  ];

  assert.deepEqual(plain(runtime.exports.getWatchLikeCollaborationWarmup(staleStateCard)), {
    collaborators: [],
    expectedCount: 0
  });

  const promoted = runtime.exports.promoteYtmWatchRowIdentityFromCollaboratorMetadata({
    name: 'Kully B & Gussy G - Topic',
    videoId: 'o4LJY7Zhxjk'
  }, staleStateCard);

  assert.equal(promoted.isCollaboration, undefined);
  assert.equal(promoted.videoId, 'o4LJY7Zhxjk');
  assert.equal(promoted.allCollaborators, undefined);

  const genericPromoted = runtime.exports.promoteChannelInfoFromCollaboratorSignals({
    name: 'Kully B & Gussy G - Topic',
    videoId: 'o4LJY7Zhxjk'
  }, staleStateCard);

  assert.equal(genericPromoted.isCollaboration, undefined);
  assert.equal(genericPromoted.allCollaborators, undefined);
  assert.deepEqual(runtime.clearCalls, ['topic-stale-card', 'topic-stale-card']);
});

test('ampersand Topic quick-block action stays single-channel and rejects stale collaborator-shaped Topic input', () => {
  const quick = loadQuickBlockActionRuntime();
  const topicCard = new FakeNode({
    tagName: 'YT-LOCKUP-VIEW-MODEL',
    attrs: {
      'data-filtertube-video-id': 'o4LJY7Zhxjk'
    }
  });
  topicCard.label = 'topic-quick-card';
  topicCard.extractedVideoId = 'o4LJY7Zhxjk';
  topicCard.topicBylineText = 'Kully B & Gussy G - Topic';
  topicCard.baseChannel = {
    name: 'Kully B & Gussy G - Topic',
    videoId: 'o4LJY7Zhxjk'
  };
  topicCard.extractedCollaborators = [];
  topicCard.promotedChannelInfo = {
    name: 'Kully B & Gussy G - Topic',
    videoId: 'o4LJY7Zhxjk',
    allCollaborators: []
  };

  const cleanContext = quick.exports.buildQuickBlockContext(topicCard);
  assert.equal(cleanContext.videoId, 'o4LJY7Zhxjk');
  assert.deepEqual(plain(cleanContext.collaborators), [{
    name: 'Kully B & Gussy G - Topic',
    handle: '',
    id: '',
    customUrl: '',
    logo: '',
    channelLogo: '',
    videoId: 'o4LJY7Zhxjk',
    videoTitleHint: '',
    source: ''
  }]);

  const cleanAction = quick.exports.getQuickBlockActionInfo(cleanContext);
  assert.equal(cleanAction.channelInfo.name, 'Kully B & Gussy G - Topic');
  assert.equal(cleanAction.channelInfo.isBlockAllOption, undefined);
  assert.equal(cleanAction.attrs['data-is-block-all'], undefined);

  const staleBase = {
    name: 'Kully B & Gussy G - Topic',
    videoId: 'o4LJY7Zhxjk',
    allCollaborators: [
      collaborator('Kully B'),
      collaborator('Gussy G - Topic')
    ]
  };
  const staleContext = {
    base: staleBase,
    videoId: 'o4LJY7Zhxjk',
    collaborators: quick.exports.collectQuickBlockCollaborators(staleBase, topicCard)
  };

  assert.deepEqual(plain(staleContext.collaborators), [
    {
      name: 'Kully B & Gussy G - Topic',
      handle: '',
      id: '',
      customUrl: '',
      logo: '',
      channelLogo: '',
      videoId: 'o4LJY7Zhxjk',
      videoTitleHint: '',
      source: ''
    }
  ]);
  const staleAction = quick.exports.getQuickBlockActionInfo(staleContext);
  assert.equal(staleAction.channelInfo.isBlockAllOption, undefined);
  assert.equal(staleAction.channelInfo.name, 'Kully B & Gussy G - Topic');
  assert.equal(staleAction.attrs['data-is-block-all'], undefined);
  assert.deepEqual(plain(quick.clearCalls), [{ label: 'topic-quick-card', videoId: 'o4LJY7Zhxjk' }]);
});

test('YTM collaborator promotion calls extraction and returns collaboration-shaped identity', () => {
  const runtime = loadPromotionRuntime();
  const card = new FakeNode({
    tagName: 'YTM-VIDEO-WITH-CONTEXT-RENDERER',
    attrs: {
      'data-filtertube-expected-collaborators': '3'
    }
  });
  card.label = 'ytm-row';
  card.isYtmWatchLike = true;
  card.extractedVideoId = 'VIDEOYTM001';
  card.extractedCollaborators = [
    collaborator('Alice', { handle: '@alice' }),
    collaborator('Bob')
  ];

  const promoted = runtime.exports.promoteYtmWatchRowIdentityFromCollaboratorMetadata({ name: '3 views ago' }, card);

  assert.deepEqual(runtime.extractCalls, ['ytm-row']);
  assert.equal(promoted.isCollaboration, true);
  assert.equal(promoted.videoId, 'VIDEOYTM001');
  assert.equal(promoted.expectedCollaboratorCount, 3);
  assert.equal(promoted.needsEnrichment, true);
  assert.deepEqual(plain(promoted.allCollaborators), [
    { name: 'Alice', handle: '@alice', id: '', customUrl: '' },
    { name: 'Bob', handle: '', id: '', customUrl: '' }
  ]);
});

test('generic collaborator signal promotion prefers richer resolved cache over weaker extraction', () => {
  const runtime = loadPromotionRuntime();
  const card = new FakeNode({
    attrs: {
      'data-filtertube-expected-collaborators': '2'
    }
  });
  card.label = 'generic-card';
  card.extractedVideoId = 'VIDEOCACHE01';
  card.ytmBylineText = 'Alice and Bob';
  card.children['yt-avatar-stack-view-model, #attributed-channel-name'] = new FakeNode();
  card.extractedCollaborators = [collaborator('Alice')];
  runtime.exports.resolvedCollaboratorsByVideoId.set('VIDEOCACHE01', [
    collaborator('Alice', { handle: '@alice', id: ucId('A') }),
    collaborator('Bob', { handle: '@bob', id: ucId('B') })
  ]);

  const promoted = runtime.exports.promoteChannelInfoFromCollaboratorSignals({}, card);

  assert.deepEqual(runtime.extractCalls, ['generic-card']);
  assert.equal(promoted.isCollaboration, true);
  assert.equal(promoted.videoId, 'VIDEOCACHE01');
  assert.equal(promoted.needsEnrichment, false);
  assert.deepEqual(plain(promoted.allCollaborators), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' }
  ]);
});

test('collaborator channel-info normalization merges resolved and avatar stack data then writes card cache', () => {
  const runtime = loadPromotionRuntime();
  const avatarStack = new FakeNode();
  avatarStack.stackCollaborators = [
    collaborator('Carol', { handle: '@carol', id: ucId('C') })
  ];
  const card = new FakeNode({
    attrs: {
      'data-filtertube-expected-collaborators': '2'
    },
    children: {
      'yt-avatar-stack-view-model': avatarStack
    }
  });
  card.extractedVideoId = 'VIDEONORM01';
  runtime.exports.resolvedCollaboratorsByVideoId.set('VIDEONORM01', [
    collaborator('Alice', { handle: '@alice', id: ucId('A') }),
    collaborator('Bob', { handle: '@bob', id: ucId('B') })
  ]);

  const normalized = runtime.exports.normalizeCollaboratorChannelInfoForCard({
    isCollaboration: true,
    videoId: 'VIDEONORM01',
    allCollaborators: [collaborator('Alice')]
  }, card, { expectedCount: 3 });

  assert.equal(card.getAttribute('data-filtertube-expected-collaborators'), '4');
  assert.deepEqual(JSON.parse(card.getAttribute('data-filtertube-collaborators')), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' },
    { name: 'Carol', handle: '@carol', id: ucId('C'), customUrl: '' }
  ]);
  assert.equal(normalized.rosterComplete, false);
  assert.equal(normalized.signature, '');
  assert.deepEqual(plain(normalized.collaborators), [
    { name: 'Alice', handle: '@alice', id: ucId('A'), customUrl: '' },
    { name: 'Bob', handle: '@bob', id: ucId('B'), customUrl: '' },
    { name: 'Carol', handle: '@carol', id: ucId('C'), customUrl: '' }
  ]);
});

test('Mix-card promotion and normalization clear collaborator metadata and keep base identity', () => {
  const runtime = loadPromotionRuntime();
  const card = new FakeNode({ tagName: 'YTD-RADIO-RENDERER' });
  card.label = 'mix-card';
  card.isMixCard = true;
  card.extractedCollaborators = [
    collaborator('Alice', { handle: '@alice' }),
    collaborator('Bob', { handle: '@bob' })
  ];

  const ytmPromoted = runtime.exports.promoteYtmWatchRowIdentityFromCollaboratorMetadata({ name: 'Mix' }, card);
  const normalized = runtime.exports.normalizeCollaboratorChannelInfoForCard({ name: 'Mix', isCollaboration: true }, card);

  assert.deepEqual(plain(ytmPromoted), { name: 'Mix' });
  assert.deepEqual(plain(normalized), {
    channelInfo: { name: 'Mix', isCollaboration: true },
    collaborators: [],
    expectedCollaboratorCount: 0,
    rosterComplete: false,
    signature: ''
  });
  assert.deepEqual(runtime.clearCalls, ['mix-card', 'mix-card']);
  assert.deepEqual(runtime.extractCalls, []);
});

test('collaborator identity promotion audit doc records runtime fixture behavior and open gates', () => {
  const text = doc();

  assert.match(text, /Watch-like collaboration warmup now requires stronger separator evidence/);
  assert.match(text, /ampersand-only music Topic\/right-rail bylines such as `Kully B & Gussy G - Topic` and no-evidence single-channel names/);
  assert.match(text, /YTM watch-like promotion calls collaborator extraction/);
  assert.match(text, /Generic collaborator signal promotion can prefer a richer resolved-cache roster/);
  assert.match(text, /Collaborator channel-info normalization can merge an existing collaborator roster/);
  assert.match(text, /expected count can include overlapping raw roster inputs/);
  assert.match(text, /Mix-card handling clears collaborator metadata/);
  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /collaborator identity promotion contracts/);
  assert.match(text, /promotion decisions/);
  assert.match(text, /caller-side side-effect budgets/);
  assert.match(text, /pure-read promotion policy/);
  assert.match(text, /cache-write reports/);
  assert.match(text, /first-class collaborator promotion gates/);

  const runtime = productRuntimeSource();
  const contentBridgeSource = read('js/content_bridge.js');
  const parserBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function parseCollaboratorNames(rawText = \'\', options = {}) {'),
    contentBridgeSource.indexOf('function hasAttributedCollaboratorSignal', contentBridgeSource.indexOf('function parseCollaboratorNames(rawText = \'\', options = {}) {'))
  );

  for (const token of [
    'Ampersand Topic Source-Flow Addendum - 2026-05-27',
    'parseCollaboratorNames splits comma / "and", not plain "&"',
    'collaboration extractor requires avatar stack, "N more", attributed markup',
    'single-channel / unresolved lookup path, not Block All collaborators',
    'ampersand Topic source-flow rows: 5',
    'ASCII ampersand Topic source-flow diagram: present',
    'Mermaid ampersand Topic source-flow diagram: present',
    'topic ampersand proof: PARTIAL',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing ampersand Topic addendum token: ${token}`);
  }

  for (const token of [
    'Byline Grammar Evidence-Gate Addendum - 2026-05-27',
    'plain "&" stays literal unless trimming an "N more" suffix',
    '"and" splits only after caller and separator evidence admit split mode',
    'watch-like rows require separator evidence before warming collaborators',
    'single-channel "and" watch-like false-positive risk: GATED_BY_SEPARATOR_EVIDENCE',
    'byline grammar source-flow rows: 6',
    'ASCII byline grammar diagram: present',
    'Mermaid byline grammar diagram: present'
  ]) {
    assert.ok(text.includes(token), `missing byline grammar addendum token: ${token}`);
  }

  for (const token of [
    'Single-Channel And Negative Fixture Packet - 2026-05-27',
    'single-channel and-name negative fixture rows: 6',
    'single-channel and-name current-risk rows: 0',
    'single-channel and-name evidence-gated rows: 3',
    'single-channel and-name control rows: 3',
    'ASCII single-channel and-name fixture diagram: present',
    'Mermaid single-channel and-name fixture diagram: present',
    'Rows marked `GATED` are names that should be treated'
  ]) {
    assert.ok(text.includes(token), `missing single-channel and fixture token: ${token}`);
  }

  for (const token of [
    'Watch-Like And Route-Surface Matrix Addendum - 2026-05-27',
    'watch-like and route-surface matrix rows: 8',
    'watch-like and current-risk rows: 0',
    'watch-like and evidence-gated rows: 1',
    'watch-like and control/admission rows: 7',
    'ASCII watch-like and matrix diagram: present',
    'Mermaid watch-like and matrix diagram: present',
    'bare `and` bylines no longer admit separator',
    'runtime behavior changed by 2026-05-28 continuation: yes',
    'Separator Evidence Gate Implementation Addendum - 2026-05-28',
    'hasCollaboratorSeparatorEvidence',
    'single-channel and-name no-evidence false-positive risk: GATED',
    'true text-only collaborator leak risk: PRESENT'
  ]) {
    assert.ok(text.includes(token), `missing watch-like and matrix token: ${token}`);
  }

  for (const token of [
    'Topic Stale Collaborator State Guard Addendum - 2026-05-28',
    'stale same-video data-filtertube-collaborators',
    'ampersand Topic name-only guard compares visible byline to roster',
    'clear collaborator attrs and delete resolved cache entry',
    'promotion/action layer falls back to single-channel or unresolved state',
    'topic stale collaborator state rows: 5',
    'topic stale ampersand-topic guard rows: 4',
    'topic stale action-layer trust rows: 0',
    'topic stale installed-tab parity status: MISSING',
    'topic stale collaborator state risk: GATED_FOR_NAME_ONLY_AMPERSAND_TOPIC',
    'ASCII topic stale collaborator state diagram: present',
    'Mermaid topic stale collaborator state diagram: present',
    'runtime behavior changed by this addendum: yes'
  ]) {
    assert.ok(text.includes(token), `missing Topic stale collaborator state token: ${token}`);
  }

  for (const token of [
    'Collaborator Cache Provenance Readiness Addendum - 2026-05-28',
    'cache provenance',
    'ampersand Topic name-only roster is rejected',
    'source label may exist, but validator does not make it authoritative',
    'timestamp may exist, but validator does not age-check it',
    'Block All cleanup branch',
    'delete guarded by !has(videoId)',
    'collaborator cache provenance readiness rows: 7',
    'collaborator cache ampersand-topic guard rows: 1',
    'collaborator cache source-label write-only rows: 2',
    'collaborator cache stale-delete no-op rows: 1',
    'collaborator cache provenance validation rows: 1',
    'collaborator cache runtime behavior changed: yes',
    'collaborator cache provenance risk: PARTIAL',
    'ASCII collaborator cache provenance diagram: present',
    'Mermaid collaborator cache provenance diagram: present'
  ]) {
    assert.ok(text.includes(token), `missing collaborator cache provenance token: ${token}`);
  }

  for (const token of [
    'Installed Topic Menu Parity Addendum - 2026-05-29',
    'Kully B & Gussy G - Topic',
    'data-filtertube-collab-state="resolved"',
    'writer paths and action renderers',
    'release fix needs writer-side evidence gating plus installed-tab parity proof',
    'installed Topic menu parity rows: 5',
    'installed Topic menu live DOM shape: OBSERVED_BY_USER',
    'ampersand Topic reader guard status: PRESENT',
    'collaborator writer grammar authority: NO-GO',
    'quick-block Topic parity proof: PARTIAL_GO',
    'menu renderer Topic parity proof: PARTIAL_GO_SOURCE',
    'Default profile workspace path proof: PARTIAL',
    'installed-tab byte parity trace: MISSING',
    'It proves Chrome\'s Default profile is configured to load this workspace as the',
    'It still does not prove a specific already-open YouTube tab reloaded',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing installed Topic menu parity token: ${token}`);
  }

  for (const token of [
    'Topic Writer-Side Readiness Addendum - 2026-05-29',
    'where the runtime now stops the state before it becomes',
    'writer-side negative guard runs here',
    'preserve stronger evidence: avatar stack, N more, distinct links',
    'only accepted rosters may write attrs',
    'Topic writer-side readiness rows: 6',
    'writer-side reusable guard available: PRESENT',
    'applyResolved writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY',
    'applyByVideoId writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY',
    'renderer hydration writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY',
    'cache-result writer guard status: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY',
    'action-layer patch as primary fix: NO-GO',
    'narrow runtime patch approval from this addendum: USED_2026_05_29',
    'runtime behavior changed by this addendum: yes'
  ]) {
    assert.ok(text.includes(token), `missing Topic writer-side readiness token: ${token}`);
  }

  for (const token of [
    'Topic Quick-Block/Menu Clean-State Parity Fixture Addendum - 2026-05-29',
    'clean ampersand Topic state produces one single-channel quick-block action',
    'stale collaborator-shaped `base.allCollaborators` input is stripped before quick-block Block All construction',
    'quick-block now applies the same literal ampersand Topic negative guard before action construction',
    'topic quick-block clean-state fixture rows: 3',
    'quick-block clean-state Topic action: SINGLE_CHANNEL',
    'stale collaborator-shaped quick-block action: SINGLE_CHANNEL_AFTER_TOPIC_GUARD',
    'menu renderer action-layer grammar authority: NO-GO',
    'quick-block full Topic parity authority: PARTIAL_GO',
    'Default profile workspace path proof: PARTIAL',
    'installed-tab byte parity trace: MISSING',
    'runtime behavior changed by this addendum: yes'
  ]) {
    assert.ok(text.includes(token), `missing Topic quick-block clean-state token: ${token}`);
  }

  for (const token of [
    'Ampersand Topic Source Recheck Addendum - 2026-05-30',
    'current source and focused tests prove the main parser, writer,',
    'remaining discrepancy boundary: installed-tab byte parity or uncovered writer path',
    '2026-05-30 ampersand Topic source recheck rows: 5',
    'current source Topic parser proof: GO_SOURCE',
    'current source writer guard proof: GO_SOURCE',
    'current source quick-block guard proof: GO_SOURCE',
    'JSON/showSheet collaborator parity: PARTIAL_NO_AUTHORITY',
    'installed-tab byte parity trace: MISSING',
    'runtime behavior changed by this addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing 2026-05-30 ampersand Topic recheck token: ${token}`);
  }

  for (const token of [
    'Installed Topic Reload Parity Gap Addendum - 2026-05-30',
    'the proof gap is not the',
    'source parser itself',
    'stale content-script bytes / unreloaded YouTube document',
    'uncovered writer path before menu rendering',
    'installed Topic reload parity rows: 4',
    'source-focused Topic guard tests: PASS',
    'runtime behavior changed by reload parity addendum: no',
    'installed reloaded-tab byte trace: MISSING',
    'uncovered writer-path proof: MISSING',
    'menu-layer grammar fix approval: NO-GO'
  ]) {
    assert.ok(text.includes(token), `missing installed Topic reload parity token: ${token}`);
  }

  for (const token of [
    'Topic Writer-Path Source Census Addendum - 2026-05-30',
    'current-source paths that can stamp',
    'data-filtertube-collaborators',
    'Topic writer-path source census rows: 9',
    'DOM collaborator attr writer rows covered: 6',
    'resolved-map writer rows covered: 5',
    'entrypoint funnel rows covered: 3',
    'known content_bridge DOM attr writer coverage: PRESENT_FOR_AMPERSAND_TOPIC_NAME_ONLY',
    'uncovered writer-path proof from source census: PARTIAL_SOURCE_CENSUS',
    'installed reloaded-tab byte trace: MISSING',
    'runtime behavior changed by writer-path census addendum: no',
    'menu-layer grammar fix approval: NO-GO'
  ]) {
    assert.ok(text.includes(token), `missing Topic writer-path source census token: ${token}`);
  }

  for (const token of [
    'Ampersand Topic Root-Cause Boundary Addendum - 2026-05-30',
    'Current source does not use a plain `&` as a',
    'collaborator-shaped roster',
    'menu renderer and quick-block action builder are downstream consumers',
    'renderer is not grammar authority',
    'ampersand Topic root-cause rows: 5',
    'menu root-cause status: DOWNSTREAM_RENDERER_NOT_CLASSIFIER',
    'current source fresh parser status: NO_PLAIN_AMPERSAND_SPLIT',
    'current source stale name-only roster status: REJECTED_FOR_VISIBLE_TOPIC_LABEL',
    'true collaborator preservation status: STRONGER_EVIDENCE_STILL_ADMITTED',
    'runtime behavior changed by root-cause addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing ampersand Topic root-cause token: ${token}`);
  }

  for (const token of [
    'Installed Chrome DOM Evidence Boundary - 2026-05-30',
    'live installed YouTube tab',
    'data-filtertube-route-watch=true',
    '301 FilterTube-stamped DOM nodes',
    '236 data-filtertube-video-id attrs',
    '235 processed card attrs',
    '20 hidden card/container attrs',
    '4 quick-block event wrappers',
    'no data-filtertube-collaborators attrs observed in this sampled tab',
    'direct chrome-extension source resource probe blocked by browser policy',
    'installed Chrome DOM evidence rows: 5',
    'installed Chrome sampled URL: https://www.youtube.com/watch?v=aJOTlE1K90k',
    'installed Chrome FilterTube stamped nodes observed: 301',
    'installed Chrome processed card attrs observed: 235',
    'installed Chrome hidden attrs observed: 20',
    'installed Chrome collaborator attrs observed in sampled tab: 0',
    'installed Chrome source resource probe: BLOCKED_BY_BROWSER_POLICY',
    'installed Chrome extension activity status: OBSERVED_DOM_STAMPS',
    'installed Chrome source byte parity status: NOT_PROVED',
    'runtime behavior changed by installed Chrome DOM evidence addendum: no'
  ]) {
    assert.ok(text.includes(token), `missing installed Chrome DOM evidence token: ${token}`);
  }

  for (const row of [
    'installed_chrome_dom_activity_observed',
    'installed_chrome_dom_processing_counts',
    'installed_chrome_quick_block_presence',
    'installed_chrome_collaborator_absence_sample',
    'installed_chrome_byte_parity_blocked'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing installed Chrome DOM evidence row ${row}`);
  }

  for (const row of [
    'topic_ampersand_parser_guard',
    'topic_lockup_metadata_gate',
    'topic_watch_warmup_gate',
    'topic_menu_promotion_gate',
    'topic_quick_block_gate'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing ampersand Topic source-flow row ${row}`);
  }

  for (const row of [
    'grammar_ampersand_literal_gate',
    'grammar_watch_and_positive_gate',
    'grammar_watch_and_single_name_risk',
    'grammar_lockup_evidence_gate',
    'grammar_ytm_byline_gate',
    'grammar_quick_menu_action_gate'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing byline grammar source-flow row ${row}`);
  }

  for (const row of [
    'and_negative_watch_institute',
    'and_negative_watch_law_crime',
    'and_negative_watch_research_markets',
    'and_control_real_collab',
    'and_control_mix_card',
    'and_control_ampersand_topic'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing single-channel and fixture row ${row}`);
  }

  for (const row of [
    'and_matrix_generic_no_evidence_safe',
    'and_matrix_watch_like_current_risk',
    'and_matrix_watch_like_real_collab_control',
    'and_matrix_mix_guard_control',
    'and_matrix_ampersand_topic_control',
    'and_matrix_hidden_more_admission',
    'and_matrix_distinct_links_admission',
    'and_matrix_y_t_m_show_sheet_gap'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing watch-like and matrix row ${row}`);
  }

  for (const row of [
    'topic_parser_no_ampersand_split',
    'topic_cached_card_roster_guard',
    'topic_y_t_m_promotion_guard',
    'topic_generic_promotion_guard',
    'topic_menu_refresh_guard'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing Topic stale state row ${row}`);
  }

  for (const row of [
    'collab_cache_ampersand_topic_negative_guard',
    'collab_cache_source_label_write_only',
    'collab_cache_by_id_without_source_stamp',
    'collab_cache_extraction_precedes_fresh_parse',
    'collab_cache_resolved_map_guarded_topic_only',
    'collab_cache_block_all_cleanup_noop',
    'collab_cache_installed_tab_cleanup_missing'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing collaborator cache provenance row ${row}`);
  }

  for (const row of [
    'topic_installed_attr_shape',
    'topic_writer_video_id_only_gate',
    'topic_renderer_hydration_stamp_path',
    'topic_quick_block_action_trust_boundary',
    'topic_menu_renderer_not_grammar_authority'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing installed Topic menu parity row ${row}`);
  }

  for (const row of [
    'topic_writer_guard_reuse_point',
    'topic_apply_resolved_writer_guard',
    'topic_apply_by_video_id_writer_guard',
    'topic_renderer_hydration_writer_guard',
    'topic_cache_result_writer_guard',
    'topic_action_layer_non_fix_boundary'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing Topic writer-side readiness row ${row}`);
  }

  for (const row of [
    'topic_quick_block_clean_single_channel_fixture',
    'topic_quick_block_stale_collaborator_shape_fixture',
    'topic_menu_action_layer_boundary_fixture'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing Topic quick-block clean-state row ${row}`);
  }

  for (const row of [
    'topic_2026_05_30_source_parser_recheck',
    'topic_2026_05_30_writer_guard_recheck',
    'topic_2026_05_30_quick_block_recheck',
    'topic_2026_05_30_json_show_sheet_scope',
    'topic_2026_05_30_installed_discrepancy_boundary'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing 2026-05-30 ampersand Topic recheck row ${row}`);
  }

  for (const row of [
    'topic_reload_parity_source_guard',
    'topic_reload_parity_stale_tab_boundary',
    'topic_reload_parity_writer_boundary',
    'topic_reload_parity_menu_boundary'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing installed Topic reload parity row ${row}`);
  }

  for (const row of [
    'topic_writer_census_active_menu_refresh_attr',
    'topic_writer_census_apply_resolved_attr',
    'topic_writer_census_apply_by_video_id_attr',
    'topic_writer_census_renderer_hydration_attr',
    'topic_writer_census_cache_result_attr',
    'topic_writer_census_normalize_prime_attr',
    'topic_writer_census_message_entry_funnels',
    'topic_writer_census_menu_promise_map_writes',
    'topic_writer_census_non_writer_boundaries'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing Topic writer-path source census row ${row}`);
  }

  for (const row of [
    'topic_root_cause_plain_ampersand',
    'topic_root_cause_upstream_shape',
    'topic_root_cause_writer_guard',
    'topic_root_cause_action_layer',
    'topic_root_cause_true_collab_preservation'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing ampersand Topic root-cause row ${row}`);
  }

  for (const sourcePin of [
    'js/content_bridge.js:2775-2830',
    'js/content_bridge.js:2673-2745',
    'js/content_bridge.js:1594-1626',
    'js/content_bridge.js:3501-3601',
    'js/content_bridge.js:3603-3673',
    'js/content_bridge.js:4284-4363',
    'js/content_bridge.js:4482-4504',
    'js/content_bridge.js:876-935',
    'js/content_bridge.js:4309-4368',
    'js/content_bridge.js:5064-5192',
    'js/content_bridge.js:11099-11176',
    'js/content_bridge.js:11368-11390',
    'js/content_bridge.js:3012-3021',
    'js/content/block_channel.js:1428-1640',
    'js/content_bridge.js:4555-4577',
    'js/content_bridge.js:4580-4601',
    'js/content_bridge.js:4604-4633',
    'js/content_bridge.js:4822-4851',
    'js/content_bridge.js:4944-4975',
    'js/content_bridge.js:4852-4920',
    'js/content_bridge.js:5218-5303',
    'js/content_bridge.js:3501-3601',
    'js/content_bridge.js:3603-3707',
    'js/content_bridge.js:12542-12546',
    'js/content_bridge.js:874-935',
    'js/content_bridge.js:9665-9685',
    'js/content_bridge.js:11055-11098',
    'js/content_bridge.js:11046-11101',
    'js/content/block_channel.js:1519-1598'
  ]) {
    assert.ok(text.includes(`\`${sourcePin}\``), `missing source pin ${sourcePin}`);
  }

  assert.ok(
    parserBlock.includes("const tokens = normalizedText.split(/\\s*(?:,|\\band\\b)\\s*/i);"),
    'separator-mode parser should split comma/and but not plain ampersand'
  );
  assert.ok(
    parserBlock.includes('.replace(/\\s*(?:,|&|\\band\\b)\\s+\\d+\\s+more\\b.*$/i, \'\')'),
    'ampersand remains allowed only for collapsed hidden-collaborator suffix cleanup'
  );

  const validatedCacheBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function getValidatedCachedCollaborators(card) {'),
    contentBridgeSource.indexOf('function clearCollaboratorMetadataFromCard', contentBridgeSource.indexOf('function getValidatedCachedCollaborators(card) {'))
  );
  assert.ok(validatedCacheBlock.includes('const currentVideoId = extractVideoIdFromCard(card);'));
  assert.ok(validatedCacheBlock.includes("const cachedVideoId = card.getAttribute('data-filtertube-video-id');"));
  assert.ok(validatedCacheBlock.includes('if (cachedVideoId !== currentVideoId) {'));
  assert.ok(validatedCacheBlock.includes('isAmpersandTopicNameOnlyCollaboratorState(card, cachedCollaborators)'));
  assert.ok(validatedCacheBlock.includes('clearAmpersandTopicCollaboratorState(card, currentVideoId)'));
  assert.doesNotMatch(validatedCacheBlock, /getAttribute\('data-filtertube-collaborators-source'\)/);
  assert.doesNotMatch(validatedCacheBlock, /getAttribute\('data-filtertube-collaborators-ts'\)/);
  assert.doesNotMatch(validatedCacheBlock, /Grammar|Provenance|Evidence/);

  const applyResolvedBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function applyResolvedCollaborators(videoId, collaborators, options = {}) {'),
    contentBridgeSource.indexOf('function applyCollaboratorsByVideoId', contentBridgeSource.indexOf('function applyResolvedCollaborators(videoId, collaborators, options = {}) {'))
  );
  assert.ok(applyResolvedBlock.includes("const sourceLabel = options.sourceLabel || '';"));
  assert.ok(applyResolvedBlock.includes("card.setAttribute('data-filtertube-collaborators-source', sourceLabel);"));
  assert.ok(applyResolvedBlock.includes("typeof rejectAmpersandTopicCollaboratorWrite === 'function' && rejectAmpersandTopicCollaboratorWrite(videoId, sanitized, writerCandidates)"));
  assert.ok(applyResolvedBlock.indexOf('rejectAmpersandTopicCollaboratorWrite(videoId, sanitized, writerCandidates)') < applyResolvedBlock.indexOf("card.setAttribute('data-filtertube-collaborators', serialized);"));
  assert.ok(applyResolvedBlock.indexOf('resolvedCollaboratorsByVideoId.set(videoId, sanitized);') < applyResolvedBlock.indexOf('refreshActiveCollaborationMenu(videoId, sanitized'));

  const applyByVideoIdBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function applyCollaboratorsByVideoId(videoId, collaborators, options = {}) {'),
    contentBridgeSource.indexOf('function initializeStats', contentBridgeSource.indexOf('function applyCollaboratorsByVideoId(videoId, collaborators, options = {}) {'))
  );
  assert.ok(applyByVideoIdBlock.includes("card.setAttribute('data-filtertube-collaborators', serialized);"));
  assert.ok(applyByVideoIdBlock.includes("card.setAttribute('data-filtertube-collab-state', 'resolved');"));
  assert.ok(applyByVideoIdBlock.includes('resolvedCollaboratorsByVideoId.set(videoId, sanitized);'));
  assert.ok(applyByVideoIdBlock.includes("typeof rejectAmpersandTopicCollaboratorWrite === 'function' && rejectAmpersandTopicCollaboratorWrite(videoId, sanitized, writerCandidates)"));
  assert.ok(applyByVideoIdBlock.indexOf('rejectAmpersandTopicCollaboratorWrite(videoId, sanitized, writerCandidates)') < applyByVideoIdBlock.indexOf('resolvedCollaboratorsByVideoId.set(videoId, sanitized);'));
  assert.doesNotMatch(applyByVideoIdBlock, /data-filtertube-collaborators-source/);
  assert.doesNotMatch(applyByVideoIdBlock, /data-filtertube-collaborators-ts/);

  const extractionBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function extractCollaboratorMetadataFromElement(element) {'),
    contentBridgeSource.indexOf('function isYtmWatchLikeCollaboratorCard', contentBridgeSource.indexOf('function extractCollaboratorMetadataFromElement(element) {'))
  );
  assert.ok(extractionBlock.indexOf('const cachedCollaborators = getValidatedCachedCollaborators(card);') < extractionBlock.indexOf('const collaborators = [];'));
  assert.ok(extractionBlock.includes('return cachedCollaborators;'));

  const rendererHydrationWriterBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('const rendererCollaborators = card ? hydrateCollaboratorsFromRendererData(card) : [];'),
    contentBridgeSource.indexOf('    /**', contentBridgeSource.indexOf('const rendererCollaborators = card ? hydrateCollaboratorsFromRendererData(card) : [];'))
  );
  assert.ok(rendererHydrationWriterBlock.includes("card.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedRenderer));"));
  assert.ok(rendererHydrationWriterBlock.includes("card.setAttribute('data-filtertube-collaborators-source', 'lockup');"));
  assert.ok(rendererHydrationWriterBlock.includes('applyResolvedCollaborators(resolvedVideoId, rendererCollaborators'));
  assert.ok(rendererHydrationWriterBlock.includes('rejectAmpersandTopicCollaboratorWrite(rendererVideoId, sanitizedRenderer, [card])'));
  assert.ok(rendererHydrationWriterBlock.indexOf('rejectAmpersandTopicCollaboratorWrite(rendererVideoId, sanitizedRenderer, [card])') < rendererHydrationWriterBlock.indexOf("card.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedRenderer));"));

  const cacheResultWriterBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function cacheResultAndMaybeEnrich({'),
    contentBridgeSource.indexOf('        if (triggerEnrichment && cacheTarget) {', contentBridgeSource.indexOf('function cacheResultAndMaybeEnrich({'))
  );
  assert.ok(cacheResultWriterBlock.includes('resolvedCollaboratorsByVideoId.set(resolvedVideoId, bestList);'));
  assert.ok(cacheResultWriterBlock.includes('applyResolvedCollaborators(resolvedVideoId, bestList, {'));
  assert.ok(cacheResultWriterBlock.includes('rejectAmpersandTopicCollaboratorWrite(rejectionVideoId, bestList, [targetCard, cacheTarget])'));
  assert.ok(cacheResultWriterBlock.indexOf('rejectAmpersandTopicCollaboratorWrite(rejectionVideoId, bestList, [targetCard, cacheTarget])') < cacheResultWriterBlock.indexOf('resolvedCollaboratorsByVideoId.set(resolvedVideoId, bestList);'));
  assert.doesNotMatch(cacheResultWriterBlock, /sourceLabel/);

  const blockAllCleanupBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('// After a Block All/Done operation, clear any stale collaborator cache for this video'),
    contentBridgeSource.indexOf('// Close dropdown', contentBridgeSource.indexOf('// After a Block All/Done operation, clear any stale collaborator cache for this video'))
  );
  assert.ok(blockAllCleanupBlock.includes('if (cacheVideoId && !resolvedCollaboratorsByVideoId.has(cacheVideoId)) {'));
  assert.ok(blockAllCleanupBlock.includes('resolvedCollaboratorsByVideoId.delete(cacheVideoId);'));

  const shouldStampBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function shouldStampCardForVideoId(card, videoId) {'),
    contentBridgeSource.indexOf('function resolveIdFromHandle', contentBridgeSource.indexOf('function shouldStampCardForVideoId(card, videoId) {'))
  );
  assert.ok(shouldStampBlock.includes('extractVideoIdFromCard(card)'));
  assert.ok(shouldStampBlock.includes('cardContainsVideoIdLink(card, videoId)'));
  assert.doesNotMatch(shouldStampBlock, /isAmpersandTopicNameOnlyCollaboratorState/);
  assert.doesNotMatch(shouldStampBlock, /data-filtertube-collaborators-source/);

  const quickBlockSource = read('js/content/block_channel.js');
  const quickBlockActionBlock = quickBlockSource.slice(
    quickBlockSource.indexOf('function collectQuickBlockCollaborators(base = {}, videoCard = null) {'),
    quickBlockSource.indexOf('function buildQuickBlockFallbackMetadata', quickBlockSource.indexOf('function collectQuickBlockCollaborators(base = {}, videoCard = null) {'))
  );
  assert.ok(quickBlockActionBlock.includes('skipAmpersandTopicNameOnlyRoster'));
  assert.ok(quickBlockActionBlock.includes('isAmpersandTopicNameOnlyCollaboratorState(videoCard, collaborators)'));
  assert.ok(quickBlockActionBlock.includes('clearAmpersandTopicCollaboratorState(videoCard, videoId)'));
  assert.ok(quickBlockActionBlock.includes('pushCollaboratorList(base.allCollaborators);'));
  assert.ok(quickBlockActionBlock.includes('const fromDom = extractCollaboratorMetadataFromElement(videoCard);'));
  assert.ok(quickBlockActionBlock.includes('pushCollaboratorList(fromDom);'));
  assert.ok(quickBlockActionBlock.includes('if (collaborators.length >= 2) {'));

  const activeMenuRefreshBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {'),
    contentBridgeSource.indexOf('// Statistics tracking', contentBridgeSource.indexOf('function refreshActiveCollaborationMenu(videoId, collaborators, options = {}) {'))
  );
  assert.ok(activeMenuRefreshBlock.includes('isAmpersandTopicNameOnlyCollaboratorState(context.videoCard, sanitized)'));
  assert.ok(activeMenuRefreshBlock.includes('clearAmpersandTopicCollaboratorState(context.videoCard, videoId)'));
  assert.ok(activeMenuRefreshBlock.includes("context.videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitized));"));
  assert.ok(activeMenuRefreshBlock.indexOf('isAmpersandTopicNameOnlyCollaboratorState(context.videoCard, sanitized)') < activeMenuRefreshBlock.indexOf("context.videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitized));"));

  const normalizePrimeBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('function normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, options = {}) {'),
    contentBridgeSource.indexOf('function promoteChannelInfoFromCollaboratorSignals', contentBridgeSource.indexOf('function normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, options = {}) {'))
  );
  assert.ok(normalizePrimeBlock.includes('channelInfo.isCollaboration && isAmpersandTopicNameOnlyCollaboratorState(videoCard, channelInfo.allCollaborators || [])'));
  assert.ok(normalizePrimeBlock.includes('const cachedResolved = getResolvedCollaboratorsForCard(videoId, videoCard);'));
  assert.ok(normalizePrimeBlock.includes('const cachedOnCard = getValidatedCachedCollaborators(videoCard);'));
  assert.ok(normalizePrimeBlock.includes("videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedCollaborators));"));
  assert.ok(normalizePrimeBlock.indexOf('channelInfo.isCollaboration && isAmpersandTopicNameOnlyCollaboratorState(videoCard, channelInfo.allCollaborators || [])') < normalizePrimeBlock.indexOf("videoCard.setAttribute('data-filtertube-collaborators', JSON.stringify(sanitizedCollaborators));"));

  const cacheMessageBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf("} else if (type === 'FilterTube_CacheCollaboratorInfo') {"),
    contentBridgeSource.indexOf("} else if (type === 'FilterTube_ChannelInfoResponse') {", contentBridgeSource.indexOf("} else if (type === 'FilterTube_CacheCollaboratorInfo') {"))
  );
  assert.ok(cacheMessageBlock.includes('applyResolvedCollaborators(videoId, collaborators, {'));
  assert.ok(cacheMessageBlock.includes("sourceLabel: 'xhr'"));
  assert.doesNotMatch(cacheMessageBlock, /setAttribute\('data-filtertube-collaborators'/);

  const dialogDataBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf("} else if (type === 'FilterTube_CollabDialogData') {"),
    contentBridgeSource.indexOf('async function initialize()', contentBridgeSource.indexOf("} else if (type === 'FilterTube_CollabDialogData') {"))
  );
  assert.ok(dialogDataBlock.includes('applyResolvedCollaborators(videoId, sanitized, {'));
  assert.ok(dialogDataBlock.includes("sourceLabel: 'dialog'"));
  assert.doesNotMatch(dialogDataBlock, /setAttribute\('data-filtertube-collaborators'/);

  const menuPromiseMapBlock = contentBridgeSource.slice(
    contentBridgeSource.indexOf('const fetchPromise = (async () => {'),
    contentBridgeSource.indexOf('function attachFilterTubeMenuHandlers', contentBridgeSource.indexOf('const fetchPromise = (async () => {'))
  );
  assert.ok(menuPromiseMapBlock.includes('let normalizedMenuInfo = normalizeCollaboratorChannelInfoForCard(initialChannelInfo, videoCard, {'));
  assert.ok(menuPromiseMapBlock.includes('resolvedCollaboratorsByVideoId.set(videoId, sanitized);'));
  assert.equal(countLiteral(menuPromiseMapBlock, 'resolvedCollaboratorsByVideoId.set(videoId, sanitized);'), 2);
  assert.doesNotMatch(menuPromiseMapBlock, /setAttribute\('data-filtertube-collaborators'/);

  const grammarRuntime = loadPromotionRuntime();
  for (const [input, expectedNames] of [
    ['The Institute of Art and Ideas', ['The Institute of Art and Ideas']],
    ['Law and Crime Network', ['Law and Crime Network']],
    ['Research and Markets', ['Research and Markets']]
  ]) {
    const ambiguousWatchCard = new FakeNode();
    ambiguousWatchCard.isDesktopWatchLike = true;
    ambiguousWatchCard.desktopBylineText = input;
    assert.deepEqual(plain(grammarRuntime.exports.getWatchLikeCollaborationWarmup(ambiguousWatchCard)), {
      collaborators: [],
      expectedCount: 0
    }, `${input} should remain a single-channel byline without stronger collaborator evidence`);
    assert.equal(grammarRuntime.exports.cardHasCollaborationDomSignal(ambiguousWatchCard), false, `${input} should not produce a DOM collaboration signal without stronger evidence`);
    assert.deepEqual(expectedNames, [input], `${input} should stay unsplit in the negative corpus`);
  }

  const genericNoEvidenceCard = new FakeNode();
  genericNoEvidenceCard.desktopBylineText = 'The Institute of Art and Ideas';
  assert.equal(grammarRuntime.exports.cardHasCollaborationDomSignal(genericNoEvidenceCard), false);

  const hiddenMoreCard = new FakeNode();
  hiddenMoreCard.desktopBylineText = 'Alice and 2 more';
  assert.equal(grammarRuntime.exports.cardHasCollaborationDomSignal(hiddenMoreCard), true);

  const distinctLinksCard = new FakeNode();
  distinctLinksCard.desktopBylineText = 'Alice and Bob';
  distinctLinksCard.distinctLinks = 2;
  assert.equal(grammarRuntime.exports.cardHasCollaborationDomSignal(distinctLinksCard), true);

  const realCollabControl = new FakeNode();
  realCollabControl.isDesktopWatchLike = true;
  realCollabControl.desktopBylineText = 'Alice and Bob';
  realCollabControl.distinctLinks = 2;
  assert.deepEqual(plain(grammarRuntime.exports.getWatchLikeCollaborationWarmup(realCollabControl)), {
    collaborators: [
      { name: 'Alice', handle: '', id: '', customUrl: '' },
      { name: 'Bob', handle: '', id: '', customUrl: '' }
    ],
    expectedCount: 2
  });

  const mixControl = new FakeNode();
  mixControl.isMixCard = true;
  mixControl.isDesktopWatchLike = true;
  mixControl.desktopBylineText = 'Alice and Bob';
  assert.deepEqual(plain(grammarRuntime.exports.getWatchLikeCollaborationWarmup(mixControl)), {
    collaborators: [],
    expectedCount: 0
  });

  const ampersandTopicControl = new FakeNode();
  ampersandTopicControl.isDesktopWatchLike = true;
  ampersandTopicControl.desktopBylineText = 'Kully B & Gussy G - Topic';
  assert.deepEqual(plain(grammarRuntime.exports.getWatchLikeCollaborationWarmup(ampersandTopicControl)), {
    collaborators: [],
    expectedCount: 0
  });
  assert.equal(grammarRuntime.exports.cardHasCollaborationDomSignal(ampersandTopicControl), false);

  for (const symbol of [
    'contentBridgeAmpersandTopicBylineAuthority',
    'contentBridgeTopicBylineCollaboratorDecision',
    'contentBridgeTopicBylineNegativeFixturePacket',
    'contentBridgeTopicBylineMenuParityReport',
    'contentBridgeBylineGrammarEvidenceGate',
    'contentBridgeSingleChannelAndNameNegativeCorpus',
    'contentBridgeCollaboratorBylineRouteSurfaceMatrix',
    'contentBridgeBylineGrammarMetricArtifact',
    'contentBridgeWatchLikeAndBylineAuthority'
  ]) {
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should not exist in product runtime`);
  }

  for (const symbol of [
    'contentBridgeTopicStaleCollaboratorStateReport',
    'contentBridgeCollaboratorCacheEvidenceGate',
    'contentBridgeCollaboratorCacheGrammarVersion',
    'contentBridgeCollaboratorCacheProvenanceStamp',
    'contentBridgeInstalledTabByteParityTrace'
  ]) {
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should not exist in product runtime`);
  }

  for (const symbol of [
    'contentBridgeCollaboratorCacheProvenanceValidationReport',
    'contentBridgeCollaboratorCacheSourceLabelPolicy',
    'contentBridgeCollaboratorCacheStaleInvalidationReport',
    'contentBridgeResolvedCollaboratorGrammarEvidenceStamp',
    'contentBridgeCollaboratorCacheInstalledTabCleanupPlan'
  ]) {
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should not exist in product runtime`);
  }

  for (const ledgerPath of [
    'docs/audit/FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
    'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md'
  ]) {
    const ledger = read(ledgerPath);
    assert.ok(ledger.includes('2026-05-27 collaborator Topic source-flow continuation'), `${ledgerPath} should cite the continuation`);
    assert.ok(ledger.includes('2026-05-28 collaborator byline grammar evidence-gate implementation'), `${ledgerPath} should cite the grammar implementation`);
    assert.ok(ledger.includes('2026-05-28 single-channel `and` negative fixture refresh'), `${ledgerPath} should cite the single-channel and refresh`);
    assert.ok(ledger.includes('2026-05-28 watch-like `and` route-surface matrix refresh'), `${ledgerPath} should cite the watch-like and matrix refresh`);
    assert.ok(ledger.includes('2026-05-28 topic stale collaborator state continuation'), `${ledgerPath} should cite the Topic stale state continuation`);
    assert.ok(ledger.includes('2026-05-28 collaborator cache provenance readiness continuation'), `${ledgerPath} should cite the cache provenance continuation`);
    assert.ok(ledger.includes('2026-05-29 Topic quick-block clean-state parity fixture continuation'), `${ledgerPath} should cite the Topic quick-block clean-state continuation`);
    assert.ok(ledger.includes('2026-05-29 Topic menu renderer parity report contract continuation'), `${ledgerPath} should cite the Topic menu renderer report contract continuation`);
    assert.ok(ledger.includes('2026-05-30 Topic writer-path source census continuation'), `${ledgerPath} should cite the Topic writer-path source census continuation`);
    assert.ok(ledger.includes('2026-05-30 ampersand Topic root-cause boundary continuation'), `${ledgerPath} should cite the ampersand Topic root-cause continuation`);
    assert.ok(ledger.includes('docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md'), `${ledgerPath} should cite the menu action list-target audit`);
    assert.ok(ledger.includes(docPath), `${ledgerPath} should cite ${docPath}`);
    assert.ok(ledger.includes('Kully B & Gussy G - Topic'), `${ledgerPath} should keep the concrete Topic example`);
    assert.ok(ledger.replace(/\s+/g, ' ').includes('single-channel `and` false-positive risk'), `${ledgerPath} should keep the current and-name risk`);
    assert.match(ledger, /collaborator cache provenance readiness rows:\s+7/, `${ledgerPath} should pin cache provenance row count`);
    assert.match(ledger, /collaborator cache stale-delete no-op rows:\s+1/, `${ledgerPath} should pin stale-delete no-op count`);
    assert.match(ledger, /Topic writer-path source census rows:\s+9/, `${ledgerPath} should pin Topic writer-path source census row count`);
    assert.match(ledger, /ampersand\s+Topic root-cause\s+rows:\s+5/, `${ledgerPath} should pin ampersand Topic root-cause row count`);
  }
});
