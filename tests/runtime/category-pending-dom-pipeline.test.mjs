import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
function slice(startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.ok(start >= 0 && end > start, startNeedle);
  return source.slice(start, end);
}

// Execute the entire production pass, including its real timer callback and
// processed-card shortcut. Only unrelated browser/services and the final
// visibility side effect are stubbed; category decisions are not recreated.
const runtimeSource = [
  'const categoryMetadataWaitByCard = new WeakMap();',
  slice('function isCategoryPolicyEligibleVideoElement(', '\nfunction getFilterTubeVisualCardOwner('),
  slice('function getCategoryPolicySignature(', '\nfunction getLanguagePolicySignature('),
  slice('function getLanguagePolicySignature(', '\nfunction '),
  slice('function reconcileFilterTubeCardVisibility(', '\nfunction isPlaylistPanelRowElement('),
  slice('async function applyDOMFallback(', '\n// Helper function to check if content should be hidden')
].join('\n');

class Card {
  constructor(videoId = 'abcdefghijk') {
    this.tagName = 'YTD-VIDEO-RENDERER';
    this.videoId = videoId;
    this.rect = { top: 10, bottom: 200 };
    this.attrs = new Map();
    this.classList = { contains: () => false, add() {}, remove() {} };
    this.style = { setProperty() {}, removeProperty() {} };
  }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  hasAttribute(key) { return this.attrs.has(key); }
  removeAttribute(key) { this.attrs.delete(key); }
  closest(selector) {
    return selector === '[data-filtertube-pending-category]' && this.hasAttribute('data-filtertube-pending-category')
      ? this : null;
  }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return this.rect; }
}

function runtime(mode = 'block') {
  let now = 100000;
  let timerId = 0;
  let queued = true;
  const timers = new Map();
  const cards = [new Card()];
  const visibility = [];
  const settings = {
    enabled: true, listMode: 'blocklist', filterKeywords: [], filterChannels: [],
    categoryFilters: { enabled: true, mode, selected: ['music'] },
    videoMetaMap: {}, contentFilters: {}
  };
  const context = {
    console, Element: Card, URLSearchParams,
    Date: class extends Date { static now() { return now; } },
    currentSettings: settings,
    window: { innerHeight: 800, addEventListener() {} },
    document: {
      location: { pathname: '/results', search: '' },
      documentElement: { clientHeight: 800, getAttribute() { return null; } },
      querySelectorAll() { return []; }, querySelector() { return null; }, addEventListener() {}
    },
    CHANNEL_ONLY_TAGS: new Set(), VIDEO_CARD_SELECTORS: 'ytd-video-renderer',
    setTimeout(callback, delay) {
      const id = ++timerId;
      timers.set(id, { callback, deadline: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    toggleVisibility(card, hidden, reason, pending) {
      visibility.push({ card, hidden, reason, pending });
    },
    getFilteringTracker: () => ({ reset() {} }),
    collectFilterTubeVisualCardOwners: () => cards,
    collectFilterTubeVisualCardOwnersFromCandidates: () => cards,
    getCurrentPageChannelMeta: () => null,
    extractChannelMetadataFromElement: () => ({ id: `UC${'a'.repeat(22)}`, name: 'Other Author' }),
    extractCollaboratorMetadataFromElement: () => [],
    ensureVideoIdForCard: card => card.videoId,
    extractVideoIdFromCard: card => card.videoId,
    scheduleVideoMetaFetch: () => queued,
    isFilterTubeFilteringEnabled: () => true,
    hasActiveDOMFallbackWork: () => true,
    isFilterTubeHomeRoute: () => false,
    isFilterTubeChipFilterRoute: () => false,
    isFilterTubeCommentSurfaceElement: () => false,
    isFilterTubeMixOrRadioElement: () => false,
    shouldHideElementByViewCount: () => false,
    hasExplicitHideReasonMarker: card => card.hasAttribute('data-filtertube-hidden-by-category')
      || card.hasAttribute('data-filtertube-hidden-by-channel'),
    shouldHideContent: () => false,
    isPlaylistPanelRowElement: () => false,
    hasDateGatedKeywords: () => false
  };
  for (const name of [
    'syncCategoryPolicyShellState', 'enforceCurrentChannelPageDirectAccess', 'enforceCurrentWatchOwnerBlock',
    'syncRouteScopedContentControls', 'applyFilterTubeHomeFeedPolish', 'clearCachedChannelMetadata',
    'handleCommentsFallback', 'enforceCurrentWatchCategoryPolicy', 'enforceWatchRailCategoryPolicy',
    'handleHomeFeedFallback', 'handleGuideSubscriptionsFallback', 'scheduleFilterTubeContinuationNudge'
  ]) context[name] = () => false;
  vm.runInContext(runtimeSource, vm.createContext(context), { filename: 'actual-dom-fallback-category-pipeline.js' });

  return {
    cards, settings, timers, visibility,
    setNow(value) { now = value; },
    setQueued(value) { queued = value; },
    lastVisibility(card = cards[0]) { return visibility.filter(row => row.card === card).at(-1); },
    async pass(options = {}) {
      await context.applyDOMFallback(settings, {
        incrementalVideoCards: true, candidateElements: cards, ...options
      });
      assert.equal(context.window.__filtertubeDomFallbackRunState.running, false);
    },
    async fireNextTimer() {
      const [id, timer] = [...timers].sort((a, b) => a[1].deadline - b[1].deadline)[0] || [];
      assert.ok(timer, 'expected a scheduled production recheck');
      timers.delete(id);
      now = Math.max(now, timer.deadline);
      timer.callback();
      await Promise.resolve();
      assert.equal(context.window.__filtertubeDomFallbackRunState.running, false);
    }
  };
}

test('actual timer clears a queued block-mode placeholder and its processed-card state cannot reblank it', async () => {
  const state = runtime();
  const [card] = state.cards;
  await state.pass();
  assert.equal(card.getAttribute('data-filtertube-pending-category'), 'true');
  assert.equal(card.getAttribute('data-filtertube-processed'), 'true');
  assert.equal(state.lastVisibility().pending, true);
  state.setNow(104000);
  await state.pass();
  assert.equal(card.getAttribute('data-filtertube-pending-category-ts'), '100000');
  assert.equal(state.timers.size, 1);
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(card.hasAttribute('data-filtertube-pending-category-ts'), false);
  assert.equal(state.lastVisibility().hidden, false);
  assert.equal(state.lastVisibility().pending, false);
  state.setNow(161000);
  await state.pass({ forceReprocess: true });
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(state.timers.size, 0);
});

test('actual allow-only pass changes pending to unavailable without allowing unresolved content', async () => {
  const state = runtime('allow');
  state.setQueued(false);
  const [card] = state.cards;
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), true);
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(card.getAttribute('data-filtertube-category-unavailable'), 'true');
  assert.equal(state.lastVisibility().pending, true);
  assert.match(state.lastVisibility().reason, /Category unavailable/);
  state.setNow(161000);
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), true);
  assert.equal(state.timers.size, 0);
});

test('real metadata resolution replaces pending state with the actual category decision', async () => {
  const state = runtime();
  const [card] = state.cards;
  await state.pass();
  state.settings.videoMetaMap[card.videoId] = { category: 'Music' };
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(card.hasAttribute('data-filtertube-hidden-by-category'), true);
  assert.equal(state.lastVisibility().hidden, true);
  state.settings.videoMetaMap[card.videoId] = { category: 'Education' };
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-hidden-by-category'), false);
  assert.equal(state.lastVisibility().hidden, false);
});

test('expiry never clears an independent channel hide owner', async () => {
  const state = runtime();
  const [card] = state.cards;
  await state.pass();
  card.setAttribute('data-filtertube-hidden-by-channel', 'true');
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(card.hasAttribute('data-filtertube-hidden-by-channel'), true);
  assert.equal(state.lastVisibility().hidden, true);
});

test('shared production timer preserves independent deadlines for staggered cards', async () => {
  const state = runtime();
  const [first] = state.cards;
  await state.pass();
  state.setNow(104000);
  const second = new Card('lmnopqrstuv');
  state.cards.push(second);
  await state.pass();
  assert.equal(state.timers.size, 1);
  await state.fireNextTimer();
  assert.equal(first.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(second.hasAttribute('data-filtertube-pending-category'), true);
  assert.equal(state.timers.size, 1);
  await state.fireNextTimer();
  assert.equal(second.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(state.timers.size, 0);
});

test('recycled video and changed category policy get a new bounded wait', async () => {
  const state = runtime();
  const [card] = state.cards;
  await state.pass();
  await state.fireNextTimer();
  card.videoId = 'lmnopqrstuv';
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), true);
  await state.fireNextTimer();
  state.settings.categoryFilters.mode = 'allow';
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), true);
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), true);
});

test('offscreen allow-only card does not expire before its first visible lookup opportunity', async () => {
  const state = runtime('allow');
  const [card] = state.cards;
  card.rect = { top: 1200, bottom: 1400 };
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(state.timers.size, 0);
  state.setNow(109000);
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), false);
  card.rect = { top: 10, bottom: 200 };
  await state.pass();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), true);
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), false);
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), true);
});

test('a visible allow-only wait retains its original deadline after the card scrolls offscreen', async () => {
  const state = runtime('allow');
  const [card] = state.cards;
  await state.pass();
  card.rect = { top: 1200, bottom: 1400 };
  state.setNow(104000);
  await state.pass();
  assert.equal(card.getAttribute('data-filtertube-pending-category-ts'), '100000');
  assert.equal(state.timers.size, 1);
  await state.fireNextTimer();
  assert.equal(card.hasAttribute('data-filtertube-pending-category'), false);
  assert.equal(card.hasAttribute('data-filtertube-category-unavailable'), true);
});
