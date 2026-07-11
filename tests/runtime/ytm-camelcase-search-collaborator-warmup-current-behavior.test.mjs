import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadWarmupSignalRuntime() {
  const source = read('js/content_bridge.js');
  const extractBlock = sliceBetween(
    source,
    'function extractYtmBylineText(root) {',
    'function getDesktopLockupMetadataRows'
  );
  const signalBlock = sliceBetween(
    source,
    'function hasCollaboratorWarmupSignal(card) {',
    'function needsAnyPrefetchObserverWork'
  );
  const context = {
    isMixCardElement(card) {
      return Boolean(card?.mix);
    },
    hasAttributedCollaboratorSignal() {
      return false;
    },
    extractYtmBylineFromAriaLabel() {
      return '';
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${extractBlock}\n${signalBlock}\nglobalThis.exports = { extractYtmBylineText, hasCollaboratorWarmupSignal };`, context);
  return context.exports;
}

function makeYtmCard(byline, { mix = false } = {}) {
  const bylineNode = { textContent: byline };
  return {
    tagName: mix ? 'YTM-COMPACT-RADIO-RENDERER' : 'YTM-VIDEO-WITH-CONTEXT-RENDERER',
    mix,
    querySelector(selector) {
      if (selector === '.YtmBadgeAndBylineRendererItemByline .ytAttributedStringHost') return bylineNode;
      return null;
    }
  };
}

function loadPrefetchRuntime({ byline, mix = false, resolved = [] }) {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'async function prefetchCollaboratorsForCard(videoCard, options = {}) {',
    'try {\n    window.FilterTube_prefetchCollaboratorsForCard'
  );
  const calls = { enrich: [], apply: [], fallback: [] };
  const context = {
    Math,
    parseInt,
    findVideoCardElement(card) {
      return card;
    },
    ensureVideoIdForCard(card) {
      return card.videoId;
    },
    extractVideoIdFromCard(card) {
      return card.videoId;
    },
    getValidatedCachedCollaborators() {
      return [];
    },
    extractChannelFromCard(card) {
      return { videoId: card.videoId };
    },
    promoteChannelInfoFromCollaboratorSignals(info) {
      return info;
    },
    extractCollaboratorMetadataFromElement() {
      return [];
    },
    getWatchLikeCollaborationWarmup() {
      return { collaborators: [], expectedCount: 0 };
    },
    isMixCardElement() {
      return mix;
    },
    extractYtmBylineText() {
      return byline;
    },
    parseCollaboratorNames(rawText, options = {}) {
      const names = options.allowSeparatorSplit
        ? String(rawText).split(/\s+(?:and|&)\s+/i).map(value => value.trim()).filter(Boolean)
        : [String(rawText).trim()].filter(Boolean);
      return { names, hasHiddenCollaborators: false, hiddenCount: 0 };
    },
    sanitizeCollaboratorList(list = []) {
      return Array.isArray(list) ? list.map(item => ({ ...item })) : [];
    },
    withTimeout(promise) {
      return promise;
    },
    async enrichCollaboratorsWithMainWorld(info) {
      calls.enrich.push(plain(info));
      return resolved;
    },
    applyResolvedCollaborators(videoId, collaborators, options) {
      calls.apply.push({ videoId, collaborators: plain(collaborators), options: plain(options) });
    },
    requestCollaboratorEnrichment(card, videoId, collaborators) {
      calls.fallback.push({ card, videoId, collaborators });
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${block}\nglobalThis.prefetchCollaboratorsForCard = prefetchCollaboratorsForCard;`, context);
  return { prefetchCollaboratorsForCard: context.prefetchCollaboratorsForCard, calls };
}

function loadInjectorMatcherRuntime() {
  const source = read('js/injector.js');
  const block = sliceBetween(
    source,
    'function buildExpectedMatcher(payload) {',
    'function cacheCollaboratorsIfBetter'
  );
  const context = {
    parseInt,
    Set,
    Array,
    Math,
    normalizeExpectedHandle(value) {
      return String(value || '').trim().toLowerCase();
    },
    normalizeLooseText(value) {
      return String(value || '').trim().toLowerCase();
    },
    tokenizeExpectedCollaboratorNames(values = []) {
      const normalized = new Set();
      const compact = new Set();
      for (const value of values) {
        for (const token of String(value || '').split(/\s*(?:,|&|\band\b)\s*/i)) {
          const name = token.trim().toLowerCase();
          if (!name) continue;
          normalized.add(name);
          compact.add(name.replace(/[^a-z0-9]/g, ''));
        }
      }
      return { normalized, compact };
    },
    sanitizeCollaboratorList(list = []) {
      return Array.isArray(list) ? list.map(item => ({ ...item })) : [];
    },
    markCollaboratorListSource(list, sourceLabel) {
      Object.defineProperty(list, '__filterTubeCollaboratorSource', { value: sourceLabel, configurable: true });
      return list;
    },
    getCollaboratorListSource(list) {
      return list?.__filterTubeCollaboratorSource || '';
    },
    getCollaboratorListQuality(list = []) {
      return list.length;
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${block}\nglobalThis.exports = { buildExpectedMatcher, isValidCollaboratorResponse, scoreCollaboratorCandidate, markCollaboratorListSource };`, context);
  return context.exports;
}

function loadBridgeLookupOptionsRuntime() {
  const source = read('js/content_bridge.js');
  const block = sliceBetween(
    source,
    'function buildCollaboratorLookupRequestOptions({ card = null, element = null, partialCollaborators = [], channelInfo = null } = {}) {',
    'function requestCollaboratorEnrichment'
  );
  const context = {
    parseInt,
    Set,
    Array,
    findVideoCardElement(element) {
      return element;
    },
    getCachedCollaboratorsFromCard() {
      return [];
    },
    parseCollaboratorNames(value) {
      return { names: [String(value || '').trim()].filter(Boolean), hasHiddenCollaborators: false, hiddenCount: 0 };
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(`${block}\nglobalThis.buildCollaboratorLookupRequestOptions = buildCollaboratorLookupRequestOptions;`, context);
  return context.buildCollaboratorLookupRequestOptions;
}

test('camelCase YTM A-and-B byline triggers lookup but generated Mix does not', () => {
  const runtime = loadWarmupSignalRuntime();
  const videoCard = makeYtmCard('Shakira and Spotify');
  const mixCard = makeYtmCard('Shakira, KAROL G, and more', { mix: true });

  assert.equal(runtime.extractYtmBylineText(videoCard), 'Shakira and Spotify');
  assert.equal(runtime.hasCollaboratorWarmupSignal(videoCard), true);
  assert.equal(runtime.hasCollaboratorWarmupSignal(mixCard), false);
});

test('plain YTM byline is lookup-only and promotes only the resolved sheet roster', async () => {
  const resolved = [
    { name: 'shakiraVEVO', handle: '@shakiraVEVO', id: 'UCGnjeahCJW1AF34HBmQTJ-Q', customUrl: '' },
    { name: 'Spotify', handle: '@Spotify', id: 'UCRMqQWxCWE0VMvtUElm-rEA', customUrl: '' }
  ];
  const runtime = loadPrefetchRuntime({ byline: 'Shakira and Spotify', resolved });
  const card = {
    tagName: 'YTM-VIDEO-WITH-CONTEXT-RENDERER',
    videoId: '_Wcf2rKEB8E',
    getAttribute() {
      return null;
    }
  };

  const result = await runtime.prefetchCollaboratorsForCard(card);

  assert.deepEqual(runtime.calls.enrich[0].allCollaborators.map(item => item.name), ['Shakira', 'Spotify']);
  assert.equal(runtime.calls.enrich[0].requireCollaboratorsSheet, true);
  assert.deepEqual(plain(result), resolved);
  assert.deepEqual(runtime.calls.apply[0].collaborators, resolved);
  assert.equal(runtime.calls.fallback.length, 0);
});

test('sheet-required lookup rejects fallback lists even when their names match', () => {
  const runtime = loadInjectorMatcherRuntime();
  const matcher = runtime.buildExpectedMatcher({
    expectedNames: ['Shakira', 'Spotify'],
    expectedCollaboratorCount: 2,
    requireCollaboratorsSheet: true
  });
  const rows = [
    { name: 'Shakira', id: 'UCYLNGLIzMhRTi6ZOLjAPSmw', handle: '@shakira', customUrl: '' },
    { name: 'Spotify', id: 'UCRMqQWxCWE0VMvtUElm-rEA', handle: '@Spotify', customUrl: '' }
  ];
  const sheet = runtime.markCollaboratorListSource(rows.map(item => ({ ...item })), 'collaborators-sheet');
  const fallback = runtime.markCollaboratorListSource(rows.map(item => ({ ...item })), 'collaborator-fallback-list');

  assert.equal(matcher.requireCollaboratorsSheet, true);
  assert.equal(runtime.isValidCollaboratorResponse(sheet, matcher), true);
  assert.equal(runtime.isValidCollaboratorResponse(fallback, matcher), false);
  assert.ok(runtime.scoreCollaboratorCandidate(sheet, matcher) >= 0);
  assert.equal(runtime.scoreCollaboratorCandidate(fallback, matcher), -1);
});

test('sheet requirement survives bridge lookup option construction and request payload', () => {
  const buildOptions = loadBridgeLookupOptionsRuntime();
  const options = buildOptions({
    channelInfo: {
      requireCollaboratorsSheet: true,
      expectedCollaboratorCount: 2,
      allCollaborators: [{ name: 'Shakira' }, { name: 'Spotify' }]
    }
  });
  const requestBlock = sliceBetween(
    read('js/content_bridge.js'),
    'function requestCollaboratorInfoFromMainWorld(videoId, options = {}) {',
    'function requestChannelInfoFromMainWorld'
  );

  assert.equal(options.requireCollaboratorsSheet, true);
  assert.match(requestBlock, /const requireCollaboratorsSheet = Boolean\(options\.requireCollaboratorsSheet\)/);
  assert.match(requestBlock, /allowRosterFallbackForCollabMarkup,\s+requireCollaboratorsSheet,\s+lookupToken/);
});

test('generated Mix never enters plain-byline collaborator prefetch', async () => {
  const runtime = loadPrefetchRuntime({ byline: 'Shakira, KAROL G, and more', mix: true });
  const card = {
    tagName: 'YTM-COMPACT-RADIO-RENDERER',
    videoId: '_Wcf2rKEB8E',
    getAttribute() {
      return null;
    }
  };

  assert.deepEqual(plain(await runtime.prefetchCollaboratorsForCard(card)), []);
  assert.equal(runtime.calls.enrich.length, 0);
  assert.equal(runtime.calls.apply.length, 0);
});
