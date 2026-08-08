import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

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

function baseSettings(categoryFilters, category = 'Gaming') {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    categoryFilters,
    videoMetaMap: {
      abcdefghijk: { category }
    }
  };
}

function videoPayload() {
  return {
    contents: [{
      videoRenderer: {
        videoId: 'abcdefghijk',
        title: { simpleText: 'Category policy fixture' },
        shortBylineText: {
          runs: [{
            text: 'Fixture Channel',
            navigationEndpoint: {
              browseEndpoint: { browseId: 'UC1234567890123456789012' }
            }
          }]
        }
      }
    }]
  };
}

for (const scenario of [
  { name: 'Block selected hides a selected category', mode: 'block', selected: ['Gaming'], kept: false },
  { name: 'Block selected keeps an unselected category', mode: 'block', selected: ['Education'], kept: true },
  { name: 'Allow only selected keeps a selected category', mode: 'allow', selected: ['Gaming'], kept: true },
  { name: 'Allow only selected hides an unselected category', mode: 'allow', selected: ['Education'], kept: false }
]) {
  test(scenario.name, () => {
    const { engine } = loadFilterTubeEngine();
    const output = engine.processData(videoPayload(), baseSettings({
      enabled: true,
      mode: scenario.mode,
      selected: scenario.selected
    }), 'category-user-intent');

    assert.equal(output.contents.length, scenario.kept ? 1 : 0);
  });
}

test('category card is inserted after Core and before Feeds with official-source guidance', () => {
  const source = read('js/tab-view.js');
  const categoryBlock = sliceBetween(
    source,
    "const categoryFiltersSection = document.createElement('div');",
    '\n\n    let isApplyingCategoryFiltersUI'
  );

  assert.match(categoryBlock, /official YouTube category independently of the profile Blocklist or Whitelist mode/);
  assert.match(categoryBlock, /contentTab\.insertBefore\(categoryFiltersSection, feedControlsSection\)/);
  assert.ok(
    source.indexOf("groupEl.id = 'feedControlsSection'") < source.indexOf("const categoryFiltersSection = document.createElement('div');"),
    'Feeds must exist before the standalone Category card is inserted ahead of it'
  );
});

test('popup exposes active-profile category mode, toggle, selection count, clear, and category chips', () => {
  const popup = read('js/popup.js');

  for (const expected of [
    "categoryMode.id = 'popupCategoryFilter_mode'",
    "categoryEnabled.id = 'popupCategoryFilter_enabled'",
    "categorySelectionCount.setAttribute('aria-live', 'polite')",
    "categoryClear.textContent = 'Clear'",
    'StateManager.updateKidsCategoryFilters(next)',
    'StateManager.updateCategoryFilters(next)',
    'contentTab.insertBefore(categoryGroup, feedGroupElement)'
  ]) {
    assert.ok(popup.includes(expected), `missing popup category contract: ${expected}`);
  }
  assert.match(popup, /official categories independently of Blocklist or Whitelist mode/);
});

test('extension surfaces consume one shared official category registry', () => {
  const catalog = read('js/content_controls_catalog.js');
  const tabView = read('js/tab-view.js');
  const popup = read('js/popup.js');

  assert.match(catalog, /function getCategoryOptions\(\)/);
  assert.match(catalog, /label: 'Education'/);
  assert.match(catalog, /label: 'Gaming'/);
  assert.equal((tabView.match(/getCategoryOptions\?\.\(\)/g) || []).length, 2);
  assert.equal((popup.match(/getCategoryOptions\?\.\(\)/g) || []).length, 1);
  assert.match(tabView, /No categories selected — filter is inactive/);
  assert.match(tabView, /Clear selection/);
});

test('category selection is visibly and programmatically explicit in full and popup UI', () => {
  const tabView = read('js/tab-view.js');
  const popup = read('js/popup.js');
  const tabCss = read('css/tab-view.css');
  const popupCss = read('css/popup.css');

  for (const source of [tabView, popup]) {
    assert.match(source, /ft-category-selection-mark/);
    assert.match(source, /selected' : 'not selected'/);
    assert.match(source, /Allowed/);
    assert.match(source, /Blocked/);
  }
  for (const source of [tabCss, popupCss]) {
    assert.match(source, /\.ft-category-selection-mark/);
    assert.match(source, /aria-pressed="true"/);
    assert.match(source, /border: 2px solid var\(--ft-category-color/);
  }
});

test('Help and product docs clearly describe the working independent category filter', () => {
  const help = read('html/tab-view.html');
  const functionality = read('docs/FUNCTIONALITY.md');
  const currentBehavior = read('docs/CATEGORY_FILTER_CURRENT_BEHAVIOR_2026-08-08.md');
  const changelog = read('CHANGELOG.md');

  assert.match(help, /Category Filters Are Working/);
  assert.match(help, /Block selected/);
  assert.match(help, /Allow only selected/);
  assert.match(help, /independent/);
  assert.match(help, /official category supplied by YouTube/);
  assert.match(functionality, /categoryFilters:\s*\{/);
  assert.match(functionality, /mode: 'allow'/);
  assert.match(currentBehavior, /microformat\.playerMicroformatRenderer\.category/);
  assert.match(currentBehavior, /at most three simultaneous Player requests/);
  assert.match(currentBehavior, /24 starts in a rolling 60-second window/);
  assert.match(changelog, /Category filtering is working end to end/);
});

test('allow-only gives unresolved actual viewport cards a per-card pending state', () => {
  const source = read('js/content/dom_fallback.js');
  const categoryBlock = sliceBetween(
    source,
    'let hideByCategory = false;',
    '\n            const alreadyProcessed'
  );

  assert.match(categoryBlock, /isCategoryPolicyEligibleVideoElement\(element, videoId\)/);
  assert.match(categoryBlock, /isVisibleOrNear = rect\.bottom > 0 && rect\.top < viewportHeight/);
  assert.match(categoryBlock, /if \(isVisibleOrNear\)[\s\S]*priority: 'high'/);
  assert.match(categoryBlock, /categoryFetchScheduled = scheduleVideoMetaFetch/);
  assert.match(categoryBlock, /pendingCategoryMeta = mode === 'allow' \|\| categoryFetchScheduled === true/);
  assert.doesNotMatch(categoryBlock, /priority: 'low'/);
});

test('block-selected veils an unknown card only while its category request is active', () => {
  const source = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    source,
    'function scheduleVideoMetaFetch(videoId, options = null)',
    '\n\nfunction processWatchMetaFetchQueue'
  );

  assert.match(scheduler, /pendingWatchMetaFetches\.has\(v\)\) return true/);
  assert.match(scheduler, /queuedWatchMetaFetches\.has\(v\)/);
  assert.match(scheduler, /return true;[\s\S]*processWatchMetaFetchQueue\(\);[\s\S]*return true/);
  assert.match(scheduler, /CATEGORY_META_NEGATIVE_CACHE_TTL_MS\) return false/);
  assert.match(scheduler, /if \(!enqueueWatchMetaFetch\(v, wants\.priority\)\) return false/);
});

test('modern lockup descendants collapse to one outer visual visibility owner', () => {
  const source = read('js/content/dom_fallback.js');
  const ownerHelpers = sliceBetween(
    source,
    'function getFilterTubeVisualCardOwner(element)',
    '\n\nfunction getCategoryPolicySignature'
  );

  class FakeElement {
    constructor(owner = null) {
      this.owner = owner;
      this.tagName = owner ? 'YT-LOCKUP-VIEW-MODEL' : 'YTD-RICH-ITEM-RENDERER';
    }
    closest(selector) {
      if (selector.includes('ytd-rich-item-renderer')) return this.owner || this;
      return null;
    }
  }

  const outer = new FakeElement();
  const lockup = new FakeElement(outer);
  const metadata = new FakeElement(outer);
  const context = {
    Element: FakeElement,
    Set,
    Array,
    document: {
      querySelectorAll() { return [outer, lockup, metadata]; }
    }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    ownerHelpers,
    'globalThis.exports = { collectFilterTubeVisualCardOwners };'
  ].join('\n'), context);

  assert.deepEqual(Array.from(context.exports.collectFilterTubeVisualCardOwners('*')), [outer]);
});

test('category policy identity is independent from keyword/channel list mode', () => {
  const source = read('js/content/dom_fallback.js');
  const signatureHelper = sliceBetween(
    source,
    'function getCategoryPolicySignature(settings)',
    '\n\nfunction reconcileFilterTubeCardVisibility'
  );
  const context = { Array, String };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    signatureHelper,
    'globalThis.exports = { getCategoryPolicySignature };'
  ].join('\n'), context);

  const categoryFilters = { enabled: true, mode: 'allow', selected: ['Gaming', 'Education'] };
  const blocklistSignature = context.exports.getCategoryPolicySignature({ listMode: 'blocklist', categoryFilters });
  const whitelistSignature = context.exports.getCategoryPolicySignature({ listMode: 'whitelist', categoryFilters });
  assert.equal(blocklistSignature, '1:allow:education,gaming');
  assert.equal(whitelistSignature, blocklistSignature);
});

test('a later rule pass cannot restore a card with an active category marker', () => {
  const source = read('js/content/dom_fallback.js');
  const reconcile = sliceBetween(
    source,
    'function reconcileFilterTubeCardVisibility(element, shouldHide, reason = \'\', pendingMetaOnly = false)',
    '\n\nfunction isPlaylistPanelRowElement'
  );
  const calls = [];
  const context = {
    hasExplicitHideReasonMarker() { return true; },
    toggleVisibility(...args) { calls.push(args); }
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    reconcile,
    'globalThis.exports = { reconcileFilterTubeCardVisibility };'
  ].join('\n'), context);

  const card = {};
  context.exports.reconcileFilterTubeCardVisibility(card, false, 'nested pass', false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], card);
  assert.equal(calls[0][1], true);
  assert.equal(calls[0][3], true);
});

test('category filtering admits Mix seed cards but rejects ordinary collections and nested lockup components', () => {
  const source = read('js/content/dom_fallback.js');
  const eligibility = sliceBetween(
    source,
    'function isCategoryPolicyEligibleVideoElement',
    '\n\nfunction isPlaylistPanelRowElement'
  );

  assert.match(eligibility, /tag === 'yt-lockup-metadata-view-model'/);
  assert.match(eligibility, /isFilterTubeCommentSurfaceElement\(element\)/);
  assert.match(eligibility, /parentDesktopLockup !== element/);
  assert.match(eligibility, /parentRichItem !== element/);
  assert.match(eligibility, /const isMixSeedCard = isFilterTubeMixOrRadioElement\(element\)/);
  assert.match(eligibility, /!isMixSeedCard && element\.querySelector/);
  assert.match(eligibility, /yt-collection-thumbnail-view-model/);
  assert.match(eligibility, /start_radio=1/);
});

test('category filtering never owns active playback queues or Watch rails', () => {
  const source = read('js/content/dom_fallback.js');
  const eligibility = sliceBetween(
    source,
    'function isCategoryPolicyEligibleVideoElement',
    '\n\nfunction getFilterTubeVisualCardOwner'
  );
  const bridge = read('js/content_bridge.js');
  const viewportCheck = sliceBetween(
    bridge,
    'function isVideoNearCategoryViewport(videoId)',
    '\n\nfunction pruneWatchMetaFetchStartTimes'
  );

  for (const block of [eligibility, viewportCheck]) {
    assert.match(block, /path\.startsWith\('\/watch'\)/);
    assert.match(block, /path\.startsWith\('\/shorts\/'\)/);
    assert.match(block, /path === '\/playlist'/);
  }
  assert.match(eligibility, /ytd-playlist-panel-renderer/);
  assert.match(eligibility, /ytd-watch-next-secondary-results-renderer/);
  assert.match(eligibility, /#secondary/);
});

test('category card loop clears only stale category state from comment surfaces', () => {
  const source = read('js/content/dom_fallback.js');
  const commentGuard = sliceBetween(
    source,
    'if (isFilterTubeCommentSurfaceElement(element)) {',
    '\n                    continue;'
  );

  assert.match(commentGuard, /data-filtertube-pending-category/);
  assert.match(commentGuard, /data-filtertube-hidden-by-category/);
  assert.match(commentGuard, /data-filtertube-duration/);
  assert.doesNotMatch(commentGuard, /data-filtertube-collaborators/);
  assert.doesNotMatch(commentGuard, /clearCachedChannelMetadata/);
});

test('visible-comments path clears stale video/category ownership and shelf cleanup skips comments', () => {
  const source = read('js/content/dom_fallback.js');
  const commentsRestore = sliceBetween(
    source,
    '    // 2. Ensure containers are visible when not globally hidden',
    '    // 3. Per-thread filtering'
  );
  const shelfCleanup = sliceBetween(
    source,
    '    // 5. Container Cleanup (Shelves, Grids)',
    '    // Log hide/restore summary'
  );

  for (const marker of [
    'data-filtertube-duration',
    'data-filtertube-video-id',
    'data-filtertube-processed',
    'data-filtertube-pending-category',
    'data-filtertube-hidden-by-category',
    'filtertube-hidden-shelf'
  ]) {
    assert.match(commentsRestore, new RegExp(marker));
  }
  assert.match(commentsRestore, /toggleVisibility\(container, false, '', true\)/);
  assert.match(shelfCleanup, /if \(isFilterTubeCommentSurfaceElement\(shelf\)\)/);
  assert.match(shelfCleanup, /remove\('filtertube-hidden-shelf'\)/);
  assert.match(shelfCleanup, /continue;/);
});

test('modern camelCase comment hosts remain explicit non-card surfaces', () => {
  const source = read('js/content/dom_fallback.js');
  const commentClassifier = sliceBetween(
    source,
    'function isFilterTubeCommentSurfaceElement(element)',
    '\n\nfunction collectMobileCommentEntryCards'
  );

  for (const selector of [
    '.ytwCommentViewModelHost',
    '.ytCommentViewModelHost',
    '.ytGhostCommentsHost',
    '.ytwPinnedCommentBadgeRendererHost'
  ]) {
    assert.match(commentClassifier, new RegExp(selector.replaceAll('.', '\\.')));
  }
});

test('Hide All Comments requires an explicit boolean true through storage and DOM ownership', () => {
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const domFallback = read('js/content/dom_fallback.js');

  assert.match(settingsShared, /profileSettings\.hideComments === true/);
  assert.match(settingsShared, /result\.hideAllComments === true/);
  assert.match(background, /hasProfilesV4\s*\? activeSettings\.hideComments === true/);
  assert.match(background, /items\.hideAllComments === true/);
  assert.match(domFallback, /if \(settings\.hideAllComments === true\)/);
});

test('valid V4 profile does not resurrect stale legacy Hide All Comments during category save', async () => {
  const storageState = {
    hideAllComments: true,
    ftProfilesV4: {
      schemaVersion: 4,
      activeProfileId: 'default',
      profiles: {
        default: {
          type: 'account',
          name: 'Default',
          settings: {
            enabled: true,
            categoryFilters: { enabled: true, mode: 'allow', selected: ['Education'] }
          },
          main: { channels: [], keywords: [] },
          kids: {}
        }
      }
    }
  };
  const storage = {
    get(keys, callback) {
      const result = {};
      for (const key of keys || []) {
        if (Object.prototype.hasOwnProperty.call(storageState, key)) result[key] = storageState[key];
      }
      callback(result);
    },
    set(payload, callback) {
      Object.assign(storageState, JSON.parse(JSON.stringify(payload)));
      callback?.();
    }
  };
  const context = {
    window: {},
    console,
    chrome: { runtime: { lastError: null }, storage: { local: storage } }
  };
  context.window.window = context.window;
  vm.createContext(context);
  vm.runInContext(read('js/settings_shared.js'), context);

  const loaded = await context.window.FilterTubeSettings.loadSettings();
  assert.equal(loaded.hideComments, false);

  const saved = await context.window.FilterTubeSettings.saveSettings({
    keywords: loaded.keywords,
    channels: loaded.channels,
    enabled: loaded.enabled,
    hideComments: loaded.hideComments,
    categoryFilters: { enabled: true, mode: 'allow', selected: ['Education', 'Gaming'] }
  });
  assert.equal(saved.compiledSettings.hideAllComments, false);
  assert.equal(storageState.hideAllComments, false);
  assert.equal(storageState.ftProfilesV4.profiles.default.settings.hideComments, false);
});

test('category hydration uses structured Player JSON and never background-fetches Watch HTML', () => {
  const source = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const fetcher = sliceBetween(
    source,
    'async function fetchVideoMetaFromWatchUrl(videoId)',
    'function generateCollaborationGroupId'
  );

  assert.match(fetcher, /requestVideoMetaFromMainWorld\(videoId\)/);
  assert.doesNotMatch(fetcher, /fetch\s*\(/);
  assert.doesNotMatch(fetcher, /\/watch\?v=/);
  assert.match(injector, /\/youtubei\/v1\/player\?prettyPrint=false/);
  assert.match(injector, /context: profile\.context,[\s\S]*videoId,[\s\S]*contentCheckOk: false,[\s\S]*racyCheckOk: false/);
});

test('MAIN-world Player bridge returns normalized category and seed-owner identity metadata', async () => {
  const injector = read('js/injector.js');
  const fetchBlock = sliceBetween(
    injector,
    'async function fetchVideoMetaFromYoutubeiPlayer(videoId) {',
    '\n\n    function isYoutubeChannelsFeedPath'
  );
  const calls = [];
  const context = {
    buildSubscriptionImportRequestProfiles() {
      return {
        apiKey: 'test-key',
        profiles: [{
          context: { client: { clientName: 'WEB', clientVersion: 'test' } },
          headerClientName: '1',
          headerClientVersion: 'test'
        }]
      };
    },
    buildSubscriptionImportHeaders() { return { 'content-type': 'application/json' }; },
    fetch(url, options) {
      calls.push({ url, options });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          videoDetails: {
            lengthSeconds: '1573',
            channelId: 'UCTXqDy7RTOoi_p2JyySAa_A',
            author: 'Mande'
          },
          microformat: {
            playerMicroformatRenderer: {
              category: 'Gaming',
              publishDate: '2026-08-06',
              uploadDate: '2026-08-06',
              ownerProfileUrl: 'https://www.youtube.com/@Mande_'
            }
          },
          streamingData: { formats: [{ cipher: 'not relayed' }] }
        })
      });
    },
    AbortController,
    Array,
    JSON,
    Promise,
    String,
    clearTimeout,
    encodeURIComponent,
    setTimeout
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    fetchBlock,
    'globalThis.fetchVideoMetaFromYoutubeiPlayer = fetchVideoMetaFromYoutubeiPlayer;'
  ].join('\n'), context);

  const result = await context.fetchVideoMetaFromYoutubeiPlayer('rbUXNNagtbI');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    success: true,
    metadata: {
      videoId: 'rbUXNNagtbI',
      lengthSeconds: '1573',
      publishDate: '2026-08-06',
      uploadDate: '2026-08-06',
      category: 'Gaming',
      channelId: 'UCTXqDy7RTOoi_p2JyySAa_A',
      channelName: 'Mande',
      channelHandle: '@Mande_'
    },
    errorCode: ''
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/youtubei/v1/player?prettyPrint=false&key=test-key');
  assert.equal(JSON.parse(calls[0].options.body).videoId, 'rbUXNNagtbI');
  assert.equal(Object.hasOwn(result.metadata, 'streamingData'), false);
});

test('current Watch category guard pauses and overlays without navigating or mutating a queue', () => {
  const source = read('js/content/dom_fallback.js');
  const guard = sliceBetween(
    source,
    'function enforceCurrentWatchCategoryPolicy(settings)',
    '\n\nconst FILTERTUBE_WATCH_RAIL_CATEGORY_SELECTOR'
  );

  assert.match(guard, /getCurrentWatchVideoId\(\)/);
  assert.match(guard, /getCategoryPolicyDecision\(settings, category\)/);
  assert.match(guard, /scheduleVideoMetaFetch\(videoId/);
  assert.match(guard, /pauseCurrentWatchForCategory\(videoId\)/);
  assert.match(guard, /setCurrentWatchCategoryOverlay/);
  assert.match(guard, /'unavailable'/);
  assert.match(guard, /Category unavailable/);
  assert.doesNotMatch(guard, /\.click\(/);
  assert.doesNotMatch(guard, /getPlaylistPanelRows/);
  assert.doesNotMatch(guard, /toggleVisibility/);
});

test('Watch rail veils pending cards, collapses blocked or unavailable cards, and never owns queue rows', () => {
  const source = read('js/content/dom_fallback.js');
  const rail = sliceBetween(
    source,
    'function enforceWatchRailCategoryPolicy(settings)',
    '\n\nfunction markedChannelIsStillBlocked'
  );
  const css = read('js/content/dom_helpers.js');

  assert.match(rail, /FILTERTUBE_WATCH_RAIL_CATEGORY_SELECTOR/);
  assert.match(source, /function getWatchRailCategoryCardOwner\(candidate\)/);
  assert.match(rail, /getWatchRailCategoryCardOwner\(candidate\)/);
  assert.match(rail, /ytd-playlist-panel-renderer/);
  assert.match(source, /data-filtertube-watch-category-state/);
  assert.match(rail, /scheduleVideoMetaFetch\(videoId/);
  assert.match(rail, /!scheduled && previousTs/);
  assert.match(rail, /setWatchRailCategoryState\(card, 'unavailable', ''\)/);
  assert.doesNotMatch(rail, /toggleVisibility/);
  assert.doesNotMatch(rail, /style\.setProperty\(['"]display/);
  assert.match(css, /\[data-filtertube-watch-category-state="pending"\] > \*/);
  assert.match(css, /visibility: hidden !important/);
  assert.match(css, /\[data-filtertube-watch-category-state="blocked"\][\s\S]*display: none !important/);
  assert.match(css, /\[data-filtertube-watch-category-state="unavailable"\][\s\S]*display: none !important/);
  assert.doesNotMatch(rail, /Filtered by category/);
});

test('new allow-only cards are synchronously veiled before the debounced fallback pass', () => {
  const source = read('js/content_bridge.js');
  const prime = sliceBetween(
    source,
    'function primeAllowOnlyCategoryCards(mutations, settingsOverride = null)',
    '\n\n        primeAllowOnlyCategoryCards([{ addedNodes:'
  );
  const observerSearchStart = source.indexOf('function fallbackMutationSummary(mutations)');
  const observerStart = source.indexOf('const observer = new MutationObserver(mutations => {', observerSearchStart);
  const observerEnd = source.indexOf('\n        const observeTarget = () => {', observerStart);
  assert.notEqual(observerSearchStart, -1);
  assert.notEqual(observerStart, -1);
  assert.notEqual(observerEnd, -1);
  const observer = source.slice(observerStart, observerEnd);

  assert.match(prime, /categoryFilters\?\.mode !== 'allow'/);
  assert.match(prime, /isCategoryPolicyEligibleVideoElement\(card, videoId\)/);
  assert.match(prime, /data-filtertube-pending-category/);
  assert.match(prime, /setWatchRailCategoryState\(card, 'pending'/);
  assert.match(prime, /scheduleVideoMetaFetch\(videoId/);
  assert.match(observer, /primeAllowOnlyCategoryCards\(mutations\)/);
  assert.ok(
    observer.indexOf('primeAllowOnlyCategoryCards(mutations)') < observer.indexOf('scheduleImmediateFallback()'),
    'the click-blocking veil must be attached before the debounced full fallback pass'
  );
});

test('Allow-only unknown cards collapse after their bounded pending window instead of flashing through', () => {
  const source = read('js/content/dom_fallback.js');
  const css = read('js/content/dom_helpers.js');

  assert.match(source, /categoryAllowOnlyUnknown/);
  assert.match(source, /categoryUnavailableMeta = categoryAllowOnlyUnknown/);
  assert.match(source, /!categoryFetchScheduled && prev/);
  assert.match(source, /targetToHide\.setAttribute\('data-filtertube-category-unavailable', 'true'\)/);
  assert.match(source, /pendingMetaOnly \|\| categoryUnavailableOnly/);
  assert.match(css, /\[data-filtertube-category-unavailable\] \{[\s\S]*display: none !important/);
  assert.doesNotMatch(css, /content:\s*attr\(data-filtertube-category-unavailable-message\)/);
});

test('Watch allow-only shell gate is installed before the delayed fallback scan', () => {
  const source = read('js/content_bridge.js');
  const initialize = sliceBetween(
    source,
    'async function initialize()',
    '\n\nasync function initializeDOMFallback(settings)'
  );
  const fallbackStart = sliceBetween(
    source,
    'async function initializeDOMFallback(settings)',
    '\n        function primeAllowOnlyCategoryCards'
  );
  const css = read('js/content/dom_helpers.js');

  assert.match(initialize, /syncCategoryPolicyShellState\(response\.settings\)/);
  assert.ok(
    fallbackStart.indexOf('syncCategoryPolicyShellState(settings)') < fallbackStart.indexOf('setTimeout(resolve, 1000)'),
    'the root gate must exist before the one-second fallback delay'
  );
  assert.match(css, /data-filtertube-watch-category-allow-only="true"/);
  assert.match(css, /document\.head \|\| document\.documentElement/);
});

test('Watch metadata scheduler admits only the current video or visible non-queue rail cards', () => {
  const source = read('js/content_bridge.js');
  const viewport = sliceBetween(
    source,
    'function isVideoNearCategoryViewport(videoId)',
    '\n\nfunction pruneWatchMetaFetchStartTimes'
  );

  assert.match(viewport, /currentWatchVideoId === videoId/);
  assert.match(viewport, /ytd-watch-next-secondary-results-renderer, #secondary/);
  assert.match(viewport, /ytd-playlist-panel-renderer/);
  assert.match(viewport, /continue;/);
});

test('Mix seed category hydration also warms the three-dot menu owner without another request', () => {
  const source = read('js/content_bridge.js');
  const fetcher = sliceBetween(
    source,
    'async function fetchVideoMetaFromWatchUrl(videoId)',
    '\n\n// =========================================='
  );

  assert.match(fetcher, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(fetcher, /data-filtertube-mix-seed-owner/);
  assert.match(fetcher, /stampChannelIdentity/);
  assert.match(source, /isMixSeedOwner: true/);
  assert.match(source, /\$\{resolvedDisplay\} \(Mix seed\)/);
});

test('JSON category filtering excludes playlist and radio containers', () => {
  const source = read('js/filter_logic.js');
  const categoryBlock = sliceBetween(
    source,
    '_checkCategoryFilters(item, rules, rendererType) {',
    '\n\n        /**\n         * Extract title with fallback methods'
  );

  assert.doesNotMatch(categoryBlock, /'playlistRenderer'/);
  assert.doesNotMatch(categoryBlock, /'gridPlaylistRenderer'/);
  assert.doesNotMatch(categoryBlock, /'radioRenderer'/);
  assert.match(categoryBlock, /contentImage\.collectionThumbnailViewModel/);
  assert.match(categoryBlock, /watchEndpoint\.playlistId/);
});

test('JSON category filtering does not apply a seed video category to a Mix lockup', () => {
  const { engine } = loadFilterTubeEngine();
  const input = {
    contents: [{
      lockupViewModel: {
        contentId: 'RDEMgF031uDlRkNZ1d0qT2a8QA',
        rendererContext: {
          commandContext: {
            onTap: {
              innertubeCommand: {
                watchEndpoint: {
                  videoId: 'abcdefghijk',
                  playlistId: 'RDEMgF031uDlRkNZ1d0qT2a8QA'
                }
              }
            }
          }
        },
        contentImage: {
          collectionThumbnailViewModel: {
            primaryThumbnail: { thumbnailViewModel: {} }
          }
        }
      }
    }]
  };

  const output = engine.processData(input, baseSettings({
    enabled: true,
    mode: 'block',
    selected: ['Gaming']
  }), 'category-mix-lockup');

  assert.equal(output.contents.length, 1);
});

test('metadata scheduler uses a bounded visible micro-batch and prioritizes visible category work', () => {
  const bridge = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  const fetches = [];
  const context = {
    currentSettings: { videoMetaMap: {} },
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return new Promise(() => {});
    },
    Date,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    scheduler,
    'globalThis.exports = { scheduleVideoMetaFetch, watchMetaFetchQueue };'
  ].join('\n'), context);

  for (const videoId of ['ACTIVEVID01', 'ACTIVEVID02', 'ACTIVEVID03']) {
    context.exports.scheduleVideoMetaFetch(videoId, { needDuration: false, needCategory: true });
  }
  context.exports.scheduleVideoMetaFetch('OFFSCREEN01', {
    needDuration: false,
    needCategory: true,
    priority: 'low'
  });
  context.exports.scheduleVideoMetaFetch('VISIBLE0001', {
    needDuration: false,
    needCategory: true,
    priority: 'high'
  });

  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), ['VISIBLE0001', 'OFFSCREEN01']);
  assert.deepEqual(fetches, ['ACTIVEVID01', 'ACTIVEVID02', 'ACTIVEVID03']);
});

test('a paced queue drain fills the next bounded category micro-batch', async () => {
  const bridge = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  let now = 1700000000000;
  const timers = [];
  const fetches = [];
  const resolvers = new Map();
  const context = {
    currentSettings: { videoMetaMap: {} },
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return new Promise(resolve => resolvers.set(videoId, resolve));
    },
    setTimeout(callback, delay) {
      timers.push({ callback, delay });
      return timers.length;
    },
    clearTimeout() {},
    Date: { now: () => now },
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    scheduler,
    'globalThis.exports = { scheduleVideoMetaFetch, watchMetaFetchQueue };'
  ].join('\n'), context);

  const ids = ['BATCHVID001', 'BATCHVID002', 'BATCHVID003', 'BATCHVID004', 'BATCHVID005', 'BATCHVID006'];
  ids.forEach(videoId => {
    context.exports.scheduleVideoMetaFetch(videoId, { needDuration: false, needCategory: true });
  });
  assert.deepEqual(fetches, ids.slice(0, 3));
  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), ids.slice(3));

  ids.slice(0, 3).forEach(videoId => resolvers.get(videoId)(null));
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(timers.length, 1);
  now += 1200;
  timers.shift().callback();

  assert.deepEqual(fetches, ids);
  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), []);
});

test('category hydration queue is idle-paced, rate-capped, and discards stale offscreen work', () => {
  const bridge = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );

  assert.match(scheduler, /WATCH_META_FETCH_CONCURRENCY = 3/);
  assert.match(scheduler, /WATCH_META_FETCH_PARALLEL_JOIN_WINDOW_MS = 100/);
  assert.match(scheduler, /WATCH_META_FETCH_BURST_INTERVAL_MS = 1200/);
  assert.match(scheduler, /WATCH_META_FETCH_SUSTAINED_INTERVAL_MS = 3500/);
  assert.match(scheduler, /WATCH_META_FETCH_BURST_SIZE = 9/);
  assert.match(scheduler, /WATCH_META_FETCH_BURST_WINDOW_MS = 10 \* 1000/);
  assert.match(scheduler, /WATCH_META_FETCH_SCROLL_IDLE_MS = 500/);
  assert.match(scheduler, /WATCH_META_FETCH_MAX_PER_WINDOW = 24/);
  assert.match(scheduler, /canJoinActiveBatch/);
  assert.match(scheduler, /while \([\s\S]*activeWatchMetaFetches < WATCH_META_FETCH_CONCURRENCY/);
  assert.match(scheduler, /watchMetaFetchStartTimes\.length >= WATCH_META_FETCH_MAX_PER_WINDOW/);
  assert.match(scheduler, /isCategoryOnlyMetaFetch\(needs\) && !isVideoNearCategoryViewport\(nextVideoId\)/);
  assert.match(scheduler, /areWatchMetaFetchNeedsSatisfied\(nextVideoId, needs\)/);

  const fetches = [];
  const context = {
    currentSettings: { videoMetaMap: {} },
    document: {
      hidden: false,
      querySelectorAll() { return []; },
      documentElement: { clientHeight: 800 }
    },
    window: {
      innerHeight: 800,
      addEventListener() {},
      getComputedStyle() { return { display: 'block', visibility: 'visible' }; }
    },
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return Promise.resolve(null);
    },
    setTimeout() { return 1; },
    clearTimeout() {},
    Date,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    scheduler,
    'globalThis.exports = { scheduleVideoMetaFetch, watchMetaFetchQueue, lastWatchMetaFetchAttempt };'
  ].join('\n'), context);

  context.exports.scheduleVideoMetaFetch('OFFSCREEN01', {
    needDuration: false,
    needDates: false,
    needCategory: true,
    priority: 'high'
  });

  assert.deepEqual(fetches, []);
  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), []);
  assert.equal(context.exports.lastWatchMetaFetchAttempt.has('OFFSCREEN01'), false);
});

test('cold viewport category results are committed as one DOM batch', () => {
  const bridge = read('js/content_bridge.js');
  const rerun = sliceBetween(
    bridge,
    'let pendingVideoMetaDomRerunTimer = 0;',
    '\n\nfunction touchDomForVideoMetaUpdate'
  );

  assert.match(rerun, /VIDEO_META_DOM_RERUN_DEBOUNCE_MS = 1200/);
  assert.match(rerun, /clearTimeout\(pendingVideoMetaDomRerunTimer\)/);
  assert.match(rerun, /forceReprocess: true/);
  assert.match(rerun, /preserveScroll: true/);
});

test('metadata queued before storage hydration is rechecked before dispatch', async () => {
  const bridge = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  const fetches = [];
  let resolveFirst;
  const context = {
    currentSettings: { videoMetaMap: {} },
    fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return new Promise(resolve => {
        if (videoId === 'FIRSTVID001') resolveFirst = resolve;
      });
    },
    Date,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    scheduler,
    'globalThis.exports = { scheduleVideoMetaFetch, watchMetaFetchQueue, flush() { lastWatchMetaFetchStartedAt = 0; processWatchMetaFetchQueue(); } };'
  ].join('\n'), context);

  context.exports.scheduleVideoMetaFetch('FIRSTVID001', { needDuration: false, needCategory: true });
  context.exports.scheduleVideoMetaFetch('BLOCKER0001', { needDuration: false, needCategory: true });
  context.exports.scheduleVideoMetaFetch('BLOCKER0002', { needDuration: false, needCategory: true });
  context.exports.scheduleVideoMetaFetch('CACHED00001', { needDuration: false, needCategory: true });
  context.currentSettings.videoMetaMap.CACHED00001 = { category: 'Gaming' };
  resolveFirst(null);
  await Promise.resolve();
  await Promise.resolve();
  context.exports.flush();

  assert.deepEqual(fetches, ['FIRSTVID001', 'BLOCKER0001', 'BLOCKER0002']);
  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), []);
});

test('category filtering does not join the broad identity prefetch observer', () => {
  const bridge = read('js/content_bridge.js');
  const observerWork = sliceBetween(
    bridge,
    'function needsAnyPrefetchObserverWork(settings)',
    '\n\nfunction hasBridgeEnabledContentFilters'
  );
  const queueWork = sliceBetween(
    bridge,
    'function queuePrefetchForCard(card)',
    '\n\nfunction enqueuePrefetchItem'
  );

  assert.doesNotMatch(observerWork, /Category/);
  assert.doesNotMatch(queueWork, /scheduleVideoMetaFetch/);
});

test('learned category metadata reprocesses the outer visual card with current settings', () => {
  const bridge = read('js/content_bridge.js');
  const rerun = sliceBetween(
    bridge,
    'function scheduleVideoMetaDomRerun()',
    '\n\nfunction touchDomForVideoMetaUpdate'
  );
  const touch = sliceBetween(
    bridge,
    'function touchDomForVideoMetaUpdate(videoId)',
    '\n\nconst pendingWatchMetaFetches'
  );

  assert.match(rerun, /applyDOMFallback\(currentSettings, \{/);
  assert.match(rerun, /forceReprocess: true/);
  assert.match(rerun, /preserveScroll: true/);
  assert.match(touch, /closest\?\.\('ytd-rich-item-renderer, ytm-rich-item-renderer'\)/);
  assert.match(touch, /touched\.add\(categoryOwner\)/);
});

test('successful player response without category is negative-cached for category-only hydration', async () => {
  const bridge = read('js/content_bridge.js');
  const scheduler = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  const fetchBlock = sliceBetween(
    bridge,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '\n\n// =========================================='
  );
  let playerRequestCount = 0;
  const context = {
    currentSettings: { videoMetaMap: {} },
    location: { hostname: 'www.youtube.com' },
    requestVideoMetaFromMainWorld(videoId) {
      playerRequestCount++;
      return Promise.resolve({ videoId, lengthSeconds: '123', publishDate: '2026-01-02' });
    },
    persistVideoMetaMapping() {},
    touchDomForVideoMetaUpdate() { return false; },
    scheduleVideoMetaDomRerun() {},
    Date,
    JSON,
    Map,
    Set,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Math,
    Promise,
    RegExp,
    parseInt
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext([
    scheduler,
    fetchBlock,
    'globalThis.exports = { scheduleVideoMetaFetch, fetchVideoMetaFromWatchUrl, categoryMetaFetchMisses, watchMetaFetchQueue };'
  ].join('\n'), context);

  await context.exports.fetchVideoMetaFromWatchUrl('NOCATEGORY1');
  assert.equal(context.exports.categoryMetaFetchMisses.has('NOCATEGORY1'), true);

  context.exports.scheduleVideoMetaFetch('NOCATEGORY1', {
    needDuration: false,
    needDates: false,
    needCategory: true,
    priority: 'high'
  });

  assert.equal(playerRequestCount, 1);
  assert.deepEqual(Array.from(context.exports.watchMetaFetchQueue), []);
});
