import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dom = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
const bridge = fs.readFileSync(new URL('../../js/content_bridge.js', import.meta.url), 'utf8');
const videoId = 'CURRENT0001';
const channelId = 'UCabcdefghijklmnopqrstuv';
const metadata = { identityVerified: true, textVerified: true, channelId, channelName: 'Allowed owner', title: 'Ordinary video' };

function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `production source range: ${start}`);
  return source.slice(first, last);
}

function settings(overrides = {}) {
  return { enabled: true, listMode: 'blocklist', filterChannels: [{ id: 'UCunrelated' }], videoMetaMap: {}, ...overrides };
}

function fixture(initialSettings) {
  const counters = { pauses: 0, plays: 0, requests: 0, decisions: 0 };
  const overlays = [];
  let hydration;
  const media = { paused: false, ended: false,
    pause() { counters.pauses++; this.paused = true; },
    play() { counters.plays++; this.paused = false; return Promise.resolve(); }
  };
  const context = vm.createContext({
    currentSettings: initialSettings, window: {}, Date, console,
    document: {
      location: { pathname: '/watch', hostname: 'www.youtube.com' }, documentElement: { removeAttribute() {} },
      querySelector: selector => selector.includes('video') ? media : null,
      querySelectorAll: () => [], getElementById: () => null, addEventListener() {}
    },
    setTimeout(callback, delay) { if (delay === 1000 && !hydration) hydration = callback; return 1; }, clearTimeout() {},
    syncCategoryPolicyShellState() {}, installCurrentVideoAdmissionNavigationListeners() {},
    isFilterTubeManagedViewingRouteDenied: () => false, Element: class {},
    enforceCurrentChannelPageDirectAccess: () => false,
    syncRouteScopedContentControls() {}, applyFilterTubeHomeFeedPolish() {}, hasActiveDOMFallbackWork: () => false,
    clearStaleDOMFallbackVisibility() {}, clearContentControlStyles() {}, ensureFallbackMenuButtons() {},
    // Stop after initialization has executed its actual delayed DOM pass.
    debounce() { throw new Error('observer setup outside fixture'); },
    getCurrentWatchVideoId: () => videoId, normalizeHandleForComparison: value => value,
    clearCurrentShortAdmissionOverlay() {}, clearCurrentWatchCategoryOverlay() {},
    releaseCurrentWatchCategoryGuard() {}, toggleVisibility() {},
    scheduleCurrentVideoAdmissionMetaFetch() { counters.requests++; },
    hasDateGatedKeywords: () => false, getActiveCategoryPolicy: () => null, getActiveLanguagePolicy: () => null,
    getCompiledKeywordRegexes: list => list.map(value => new RegExp(typeof value === 'string' ? value : value.pattern, 'i')),
    keywordDateFilterAllows: () => true, matchesKeyword: (regex, text) => regex.test(String(text || '')),
    getCompiledChannelFilterIndex(_settings, list) { counters.decisions++; return { list }; },
    channelMetaMatchesIndex: (owner, index) => index.list.some(rule => rule.id === owner.id),
    shouldHideContent: () => false
  });
  vm.runInContext(fs.readFileSync(new URL('../../js/shared/view_count.js', import.meta.url), 'utf8'), context);
  vm.runInContext([
    between(dom, 'function getCurrentWatchExactOwnerMeta(settings) {', 'function getCurrentShortPlayerHost() {'),
    between(dom, 'const FILTERTUBE_DIRECT_ACCESS_PENDING_TTL_MS', 'function getCurrentWatchDescriptionText() {'),
    between(dom, 'function getCurrentWatchAdmissionDecision(settings, context = {}) {', 'function enforceCurrentChannelPageDirectAccess(settings) {'),
    between(dom, 'function enforceCurrentWatchOwnerBlock(settings) {', 'const FILTERTUBE_CATEGORY_PENDING_TTL_MS'),
    between(dom, 'async function applyDOMFallback(settings, options = {}) {', '// Helper function to check if content should be hidden'),
    between(bridge, 'async function initializeDOMFallback(settings) {', 'let fallbackMenuButtonsInstalled = false;')
  ].join('\n'), context);
  // Presentation is recorded; the actual admission, route, pause/release and
  // full DOM-pass/initialization functions remain in use.
  context.setDirectAccessOverlay = (state, message) => overlays.push({ state, message });
  context.clearDirectAccessOverlay = () => {};
  return { context, counters, overlays, media,
    async startAndReplace(fresh) {
      const pending = context.initializeDOMFallback(initialSettings);
      assert.equal(typeof hydration, 'function');
      context.currentSettings = fresh;
      counters.pauses = counters.plays = counters.requests = counters.decisions = 0;
      overlays.length = 0;
      hydration();
      await assert.rejects(pending, /observer setup outside fixture/);
    }
  };
}

test('actual delayed initialization retains newer exact-video metadata without pausing or refetching it', async () => {
  const old = settings();
  const fresh = settings({ videoMetaMap: { [videoId]: metadata } });
  const f = fixture(old);
  await f.startAndReplace(fresh);
  assert.equal(f.context.currentSettings, fresh);
  assert.equal(f.context.currentSettings.videoMetaMap[videoId], metadata);
  assert.equal(f.context.getDirectAccessState().decision, 'allowed');
  assert.equal(f.counters.pauses, 0);
  assert.equal(f.counters.requests, 0);
  assert.equal(f.overlays.length, 0);
});

test('a newer Disabled snapshot cannot be replaced by enabled delayed initialization', async () => {
  const f = fixture(settings());
  const fresh = settings({ enabled: false });
  await f.startAndReplace(fresh);
  assert.equal(f.context.currentSettings, fresh);
  assert.equal(f.context.getDirectAccessState().latestSettings.enabled, false);
  assert.equal(f.counters.decisions, 0);
  assert.equal(f.counters.pauses, 0);
  assert.equal(f.counters.requests, 0);
});

test('new allow-only settings still hold unresolved metadata after older Disabled initialization', async () => {
  const f = fixture(settings({ enabled: false }));
  const fresh = settings({ listMode: 'whitelist', filterChannels: [], whitelistChannels: [{ id: channelId }] });
  await f.startAndReplace(fresh);
  assert.equal(f.context.currentSettings, fresh);
  assert.equal(f.context.getDirectAccessState().decision, 'pending');
  assert.equal(f.counters.pauses, 1);
  assert.equal(f.counters.requests, 1);
  assert.equal(f.counters.plays, 0);
});

test('newly blocked rules take effect against retained metadata despite an older allowed snapshot', async () => {
  const f = fixture(settings({ videoMetaMap: { [videoId]: metadata } }));
  const fresh = settings({ filterChannels: [{ id: channelId }], videoMetaMap: { [videoId]: metadata } });
  await f.startAndReplace(fresh);
  assert.equal(f.context.currentSettings, fresh);
  assert.equal(f.context.getDirectAccessState().decision, 'blocked');
  assert.ok(f.counters.pauses > 0);
  assert.equal(f.overlays.at(-1).state, 'blocked');
  assert.equal(f.counters.plays, 0);
});

test('a delayed queued or enrichment pass uses the published snapshot and preserves normal blocklist pending', async () => {
  const stale = settings({ enabled: false });
  const fresh = settings();
  const f = fixture(fresh);
  await f.context.applyDOMFallback(stale);
  assert.equal(f.context.currentSettings, fresh);
  assert.equal(f.context.getDirectAccessState().decision, 'pending');
  assert.equal(f.counters.pauses, 1);
  assert.equal(f.counters.requests, 1);
  assert.equal(f.counters.plays, 0);
});

test('a cold DOM pass can bootstrap from its supplied settings before publication', async () => {
  const f = fixture(null);
  const first = settings({ videoMetaMap: { [videoId]: metadata } });
  await f.context.applyDOMFallback(first);
  assert.equal(f.context.currentSettings, first);
  assert.equal(f.context.getDirectAccessState().decision, 'allowed');
  assert.equal(f.counters.pauses, 0);
  assert.equal(f.counters.requests, 0);
  assert.equal(f.counters.plays, 0);
});

for (const [label, meta, blocked] of [
  ['known exact low total', { viewCount: '99' }, true],
  ['exact threshold', { viewCount: '500' }, false],
  ['unknown total', {}, false],
  ['invalid total', { viewCount: 'unknown' }, false],
  ['live viewer count', { viewCount: '2', isLive: true }, false],
  ['upcoming count', { viewCount: '2', isUpcoming: true }, false]
]) {
  test(`views-only Watch: ${label} never requests or waits for metadata`, async () => {
    const latest = settings({ filterChannels: [], contentFilters: { views: { enabled: true, minViews: 500 } }, videoMetaMap: { [videoId]: meta } });
    const f = fixture(latest);
    await f.context.applyDOMFallback(latest);
    assert.equal(f.context.getDirectAccessState().decision, blocked ? 'blocked' : 'allowed');
    assert.equal(f.counters.requests, 0);
    assert.equal(f.counters.plays, 0);
    assert.equal(f.counters.pauses, blocked ? 1 : 0);
    assert.equal(f.overlays.length, blocked ? 1 : 0);
    if (blocked) assert.match(f.overlays[0].message, /View Count Filter/);
  });
}

test('views-only Watch never reads a different video total or weakens other strict metadata rules', async () => {
  const latest = settings({ contentFilters: { views: { enabled: true, minViews: 500 } }, videoMetaMap: { WRONGVID001: { viewCount: '1' } } });
  const f = fixture(latest);
  await f.context.applyDOMFallback(latest);
  assert.equal(f.context.getDirectAccessState().decision, 'pending', 'missing channel identity still requires verification');
  assert.equal(f.counters.requests, 1);
  assert.equal(f.counters.plays, 0);
  assert.equal(f.overlays.some(item => /View Count Filter/.test(item.message)), false);
  latest.filterChannels = [];
  await f.context.applyDOMFallback(latest);
  assert.equal(f.context.getDirectAccessState().decision, 'allowed', 'another video total cannot block this route');
});

test('actual DOM view-count helper accepts only own-card total fields and leaves live or unknown content visible', () => {
  const f = fixture(settings());
  const context = f.context;
  context.VIDEO_CARD_SELECTORS = 'ytd-video-renderer';
  vm.runInContext(between(dom, 'function getFilterTubeVisualCardOwner(element) {', 'function collectFilterTubeVisualCardOwners(selector) {'), context);
  class Card extends context.Element {
    constructor() { super(); this.tagName = 'YTD-VIDEO-RENDERER'; this.nodes = []; this.live = []; }
    closest(selector) { return selector === context.VIDEO_CARD_SELECTORS ? this : null; }
    querySelectorAll(selector) {
      if (selector.includes('overlay-style')) return this.live;
      if (selector.startsWith('.view-count')) return this.nodes.filter(node => node.dedicated);
      return this.nodes.filter(node => !node.dedicated);
    }
  }
  const card = new Card(), sibling = new Card();
  const node = (textContent, owner = card, dedicated = false) => ({ textContent, dedicated, closest: () => owner });
  const policy = settings({ contentFilters: { views: { enabled: true, minViews: 500 } } });
  const decide = meta => context.shouldHideElementByViewCount(card, policy, meta);
  card.nodes = [node('99 views')];
  assert.equal(decide(), true);
  card.nodes = [node('99 vues')];
  assert.equal(decide(), true, 'localized total views labels are accepted');
  for (const text of ['99', '99 subscribers', '99 years ago', '0:30', '99 watching', 'A title mentioning 99 views']) {
    card.nodes = [node(text)];
    assert.equal(decide(), false, text);
  }
  card.nodes = [node('99 views', sibling)];
  assert.equal(decide(), false, 'a nested/sibling owner cannot supply the outer card total');
  card.nodes = [node('99 views')]; card.live = [node('', sibling)];
  assert.equal(decide(), true, 'another owner live badge cannot exempt this card');
  card.live = [node('')];
  assert.equal(decide(), false, 'own live badge keeps concurrent counts out of lifetime filtering');
  card.live = [];
  assert.equal(decide({ viewCount: '999' }), false, 'exact keyed Player metadata wins over rounded DOM');
  assert.equal(decide({ viewCount: '1', isLive: true }), false);
  card.nodes = [node('99', card, true)];
  assert.equal(decide(), true, 'dedicated total-count fields can contain bare numbers');
  card.tagName = 'YTD-CHANNEL-RENDERER';
  assert.equal(decide(), false, 'channel lifetime totals are not a video count');
  card.tagName = 'YTD-PLAYLIST-RENDERER';
  assert.equal(decide(), false, 'playlist totals are not a video count');
  card.tagName = 'YTD-VIDEO-RENDERER';
  policy.enabled = false;
  assert.equal(decide(), false);
});

test('views-only settings activate the actual DOM work predicate and card visibility decision', () => {
  const f = fixture(settings());
  vm.runInContext(between(dom, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {'), f.context);
  const latest = settings({ filterChannels: [], contentFilters: { views: { enabled: true, minViews: 500 } } });
  assert.equal(f.context.hasActiveDOMFallbackWork(latest), true);
  assert.equal(f.context.hasActiveDOMFallbackWork({ ...latest, enabled: false }), false);
  const evidenceStart = dom.indexOf('            const hideByViews = Boolean(');
  const evidenceEnd = dom.indexOf('            const lastCategoryStateSignature', evidenceStart);
  const evidence = dom.slice(evidenceStart, evidenceEnd);
  const start = dom.indexOf('            let hideReason = `Content: ${title}`;');
  const end = dom.indexOf('            if (listMode', start);
  const decision = dom.slice(start, end);
  const run = vm.runInContext(`(function(element, effectiveSettings, keywordVideoMeta) {
    const title = 'Own video', matchesFilters = false, hideByDuration = false,
      hideByUploadDate = false, hideByCategory = false, hideByLanguage = false,
      categoryVideoId = '${videoId}', categoryPolicySignature = '', resolvedCategoryForState = '',
      languagePolicySignature = '', resolvedLanguageForState = '';
    effectiveSettings = { ...effectiveSettings, videoMetaMap: { [categoryVideoId]: keywordVideoMeta } };
    ${evidence}
    ${decision}
    return { shouldHide, categoryStateSignature };
  })`, f.context);
  const card = { querySelectorAll: () => [] };
  f.context.getFilterTubeVisualCardOwner = element => element;
  const low = run(card, latest, { viewCount: '1' });
  const high = run(card, latest, { viewCount: '1000' });
  assert.equal(low.shouldHide, true);
  assert.equal(high.shouldHide, false);
  assert.notEqual(low.categoryStateSignature, high.categoryStateSignature, 'same-video count changes invalidate the actual processed-card cache');
  assert.equal(run(card, latest, {}).shouldHide, false);
});
