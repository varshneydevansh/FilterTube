import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_EMPTY_INSTALL_IDLE_OBSERVER_BUDGET_CURRENT_BEHAVIOR_2026-05-26.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function assertIdleObserverBudgetLedgerAddendum() {
  const doc = read(auditDocPath);

  assert.match(doc, /Idle Observer Budget Ledger Addendum - 2026-05-27/);
  assert.match(doc, /desktop YouTube, empty blocklist/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /No response clone, parse, hold, or replay/);
  assert.match(doc, /No startup body observer or pointermove listener/);
  assert.match(doc, /No dropdown scan until user menu action/);
  assert.match(doc, /No fallback body observer or warmup interval/);
  assert.match(doc, /No dialog capture listeners or observer while pending map is empty/);
  assert.match(doc, /\| Quick-block idle gate \| `js\/content\/block_channel\.js:353`, `js\/content\/block_channel\.js:1291`, `js\/content\/block_channel\.js:1979-2022` \|/);
  assert.match(doc, /\| Native dropdown discovery \| `js\/content\/block_channel\.js:2493-2541` \|/);
  assert.match(doc, /\| Fallback menu eager gate \| `js\/content_bridge\.js:6289-6301`, `js\/content_bridge\.js:7014` \|/);
  assert.match(doc, /\| Collaborator dialog lifecycle \| `js\/content\/collab_dialog\.js:31`, `js\/content\/collab_dialog\.js:370` \|/);
  assert.match(doc, /\| DOM fallback and prefetch gates \| `js\/content_bridge\.js:1006`, `js\/content_bridge\.js:1211`, `js\/content_bridge\.js:6200-6286` \|/);
  assert.match(doc, /\| Seed JSON idle pass-through \| `js\/seed\.js:97-131`, `js\/seed\.js:690-698` \|/);
  assert.match(doc, /empty-install idle observer release proof: PARTIAL/);
  assert.match(doc, /live Chrome performance trace authority: NO-GO/);
  assert.match(doc, /active-rule\/mobile\/whitelist observer budget authority: NO-GO/);
  assert.match(doc, /broad observer\/listener\/timer completion: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = String(tagName).toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.classList = {
      contains: () => false,
      add: () => {},
      remove: () => {}
    };
    this.style = {
      setProperty: () => {},
      removeProperty: () => {}
    };
  }

  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) || null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  toggleAttribute(name, force) {
    if (force) this.setAttribute(name, '');
    else this.removeAttribute(name);
  }

  matches() {
    return false;
  }

  closest() {
    return null;
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  getBoundingClientRect() {
    return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 };
  }
}

test('empty desktop install keeps quick-block body observation mobile-only and pointer recovery target-gated', () => {
  assertIdleObserverBudgetLedgerAddendum();

  const source = read('js/content/block_channel.js');
  const setup = sliceBetween(
    source,
    'function setupQuickBlockObserver() {',
    '/**\n * Observe dropdowns'
  );
  const pointerMove = sliceBetween(
    setup,
    'onPointerMove = (event) => {',
    'quickBlockPointerRecoveryArmer ='
  );

  assert.match(source, /function shouldEagerQuickBlockSweep\(\) \{\s*return isMobileYouTubeSurface\(\);\s*\}/);
  assert.match(source, /function hasActiveQuickBlockRuleContext\(settings\) \{/);
  assert.match(source, /currentSettings\.enabled === false/);
  assert.match(source, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(source, /Keep desktop work hover-lazy instead of disabling the affordance when lists are empty/);
  assert.match(source, /function shouldRefreshQuickBlockRuntimeState\(\) \{\s*pruneQuickBlockViewportHosts\(\);\s*return shouldEagerQuickBlockSweep\(\) \|\| quickBlockViewportHosts\.size > 0;\s*\}/);
  assert.match(source, /function refreshQuickBlockRuntimeState\(options = \{\}\) \{/);
  assert.match(source, /function refreshQuickBlockAvailability\(options = \{\}\) \{/);
  assert.match(source, /if \(!quickBlockObserverStarted\) \{\s*return setupQuickBlockObserver\(\);\s*\}/);
  assert.match(source, /window\.FilterTube_refreshQuickBlockAvailability = refreshQuickBlockAvailability/);
  assert.match(setup, /if \(quickBlockObserverStarted\) return true;\s*if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.match(setup, /if \(shouldEagerQuickBlockSweep\(\)\) \{\s*syncQuickBlockSurfaceState\(\{ force: true \}\);\s*scheduleQuickBlockSweep\(document\);\s*\}/);
  assert.match(setup, /if \(shouldEagerQuickBlockSweep\(\)\) \{\s*const observer = new MutationObserver/);
  assert.match(setup, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(setup, /refreshQuickBlockRuntimeState\(\{ force: true \}\)/);
  assert.equal(countLiteral(setup, 'observer.observe(document.body'), 1);
  assert.equal(countLiteral(setup, 'quickBlockPeriodicTimer'), 0);
  assert.doesNotMatch(setup, /window\.setInterval/);

  assert.match(source, /const QUICK_BLOCK_DESKTOP_HOVER_INTENT_MS = 180/);
  assert.match(source, /const QUICK_BLOCK_OCCLUSION_CACHE_MS = 250/);
  assert.match(source, /const QUICK_BLOCK_VIEWPORT_REFRESH_HOST_LIMIT = 32/);
  assert.match(source, /function getQuickBlockViewportOcclusionBounds\(options = \{\}\) \{/);
  assert.match(source, /const occlusion = getQuickBlockViewportOcclusionBounds\(\)/);
  assert.match(source, /function scheduleQuickBlockHoverIntent\(card, event\) \{/);
  assert.match(source, /armQuickBlockPointerRecovery\(\)/);
  assert.match(setup, /scheduleQuickBlockHoverIntent\(card, event\)/);
  assert.match(source, /const QUICK_BLOCK_POINTER_RECOVERY_ARM_MS = 1800/);
  assert.match(setup, /quickBlockPointerRecoveryArmer = \(\) => \{/);
  assert.match(setup, /document\.addEventListener\('pointermove', onPointerMove, \{ passive: true, capture: true \}\)/);
  assert.match(setup, /document\.removeEventListener\('pointermove', onPointerMove, \{ capture: true \}\)/);
  assert.match(setup, /schedulePointerMoveRecoveryStop\(\)/);
  assert.match(pointerMove, /const target = event\.target instanceof Element \? event\.target : null/);
  assert.match(pointerMove, /const targetHost = getHostFromCachedTarget\(target\)/);
  assert.match(pointerMove, /if \(!lastHost && Date\.now\(\) > quickBlockPointerRecoveryArmedUntil\) return/);
  assert.match(pointerMove, /if \(!lastHost && !targetHost\) return/);
  assert.match(setup, /let host = lastTargetHost \|\| getHostFromCachedTarget\(lastTarget\) \|\| pickHostFromPoint\(lastX, lastY\)/);
});

test('desktop startup runtime keeps quick-block hover-lazy without pointermove body observers or dropdown scans at idle', () => {
  const source = read('js/content/block_channel.js');
  const documentListeners = [];
  const windowListeners = [];
  const bodyObserveCalls = [];
  const documentQueries = [];
  let timeoutId = 0;

  const body = new FakeElement('body');
  const head = new FakeElement('head');
  const documentElement = new FakeElement('html');

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target, options) {
      if (target === body) {
        bodyObserveCalls.push(options || {});
      }
    }

    disconnect() {}
  }

  const fakeDocument = {
    body,
    head,
    documentElement,
    readyState: 'complete',
    addEventListener(type, listener, options) {
      documentListeners.push({ type, listener, options });
    },
    removeEventListener(type, listener, options) {
      documentListeners.push({ type: `remove:${type}`, listener, options });
    },
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    createElementNS(_ns, tagName) {
      return new FakeElement(tagName);
    },
    querySelector(selector) {
      documentQueries.push({ method: 'querySelector', selector });
      return null;
    },
    querySelectorAll(selector) {
      documentQueries.push({ method: 'querySelectorAll', selector });
      return [];
    }
  };

  const context = {
    console: { log() {}, warn() {}, error() {} },
    currentSettings: {
      enabled: true,
      listMode: 'blocklist',
      showQuickBlockButton: true,
      filterKeywords: [],
      filterChannels: [],
      filterKeywordsComments: [],
      contentFilters: {
        duration: { enabled: false },
        uploadDate: { enabled: false },
        uppercase: { enabled: false }
      },
      categoryFilters: { enabled: false, selected: [] }
    },
    document: fakeDocument,
    location: {
      hostname: 'www.youtube.com',
      pathname: '/watch',
      search: '?v=abcdefghijk'
    },
    window: {
      __filtertubeDebug: false,
      innerWidth: 1440,
      innerHeight: 900,
      addEventListener(type, listener, options) {
        windowListeners.push({ type, listener, options });
      },
      removeEventListener(type, listener, options) {
        windowListeners.push({ type: `remove:${type}`, listener, options });
      },
      matchMedia(query) {
        return { matches: query.includes('(hover: hover)') || query.includes('(pointer: fine)') };
      },
      getComputedStyle() {
        return { display: 'none', visibility: 'hidden' };
      }
    },
    Element: FakeElement,
    WeakMap,
    WeakSet,
    Map,
    Set,
    URL,
    URLSearchParams,
    Date,
    Promise,
    MutationObserver: FakeMutationObserver,
    IntersectionObserver: undefined,
    setTimeout(callback) {
      timeoutId += 1;
      callback();
      return timeoutId;
    },
    clearTimeout() {},
    requestAnimationFrame(callback) {
      callback();
      return 1;
    }
  };
  context.window.document = fakeDocument;
  context.window.location = context.location;

  vm.runInNewContext(source, context, { filename: 'js/content/block_channel.js' });

  assert.ok(documentListeners.some(entry => entry.type === 'click'), 'native menu click listener should remain available');
  assert.ok(documentListeners.some(entry => entry.type === 'keydown'), 'keyboard menu listener should remain available');
  assert.equal(documentListeners.some(entry => entry.type === 'pointerenter'), true, 'empty desktop quick-block must keep the hover entrypoint for first-rule creation');
  assert.equal(documentListeners.some(entry => entry.type === 'yt-navigate-finish'), true, 'empty desktop quick-block must keep SPA refresh hooks without body scans');
  assert.equal(documentListeners.some(entry => entry.type === 'pointermove'), false, 'pointermove must not attach at desktop startup');
  assert.equal(bodyObserveCalls.length, 0, 'desktop startup must not observe document.body');
  assert.equal(
    documentQueries.some(entry => entry.method === 'querySelectorAll' && String(entry.selector).includes('tp-yt-iron-dropdown')),
    false,
    'startup must not scan existing dropdown containers'
  );

  documentQueries.length = 0;
  assert.equal(context.window.FilterTube_refreshQuickBlockAvailability({ force: true }), true);
  assert.equal(
    documentQueries.some(entry => String(entry.selector).includes('tp-yt-iron-dropdown')),
    false,
    'empty desktop quick-block availability refresh must not force overlay scans'
  );
});

test('quick-block SPA refresh is gated and prunes stale tracked hosts', () => {
  const source = read('js/content/block_channel.js');
  const shouldRefresh = sliceBetween(
    source,
    'function shouldRefreshQuickBlockRuntimeState() {',
    'function refreshQuickBlockRuntimeState(options = {}) {'
  );
  const navigateFinish = sliceBetween(
    source,
    "document.addEventListener('yt-navigate-finish', () => {",
    '        });\n    };'
  );

  assert.match(source, /const QUICK_BLOCK_VIEWPORT_HOST_LIMIT = 80/);
  assert.match(source, /function pruneQuickBlockViewportHosts\(\) \{/);
  assert.match(source, /function untrackQuickBlockViewportHost\(hostCard\) \{/);
  assert.match(shouldRefresh, /pruneQuickBlockViewportHosts\(\)/);
  assert.match(navigateFinish, /invalidateQuickBlockSurfaceStateCache\(\)/);
  assert.match(navigateFinish, /if \(!isQuickBlockEnabled\(\)\) \{\s*removeQuickBlockButtons\(\);\s*return;\s*\}/);
  assert.match(navigateFinish, /refreshQuickBlockRuntimeState\(\{ force: true \}\)/);
  assert.doesNotMatch(navigateFinish, /syncQuickBlockSurfaceState\(\{ force: true \}\)/);
});

test('initial settings load retries lazy runtime observers so quick-block does not miss startup', () => {
  const source = read('js/content/bridge_settings.js');
  const sendSettings = sliceBetween(
    source,
    'function sendSettingsToMainWorld(settings) {',
    '\n}\n\nlet pendingStorageRefreshTimer'
  );
  const refreshObservers = sliceBetween(
    source,
    'function refreshRuntimeObserversAfterSettingsUpdate() {',
    '\n}\n\nfunction scheduleSettingsRefreshFromStorage'
  );

  assert.match(sendSettings, /currentSettings = settings/);
  assert.match(sendSettings, /refreshRuntimeObserversAfterSettingsUpdate\(\)/);
  assert.ok(
    sendSettings.indexOf('currentSettings = settings') < sendSettings.indexOf('refreshRuntimeObserversAfterSettingsUpdate()'),
    'settings must be visible before lazy observers retry'
  );
  assert.match(refreshObservers, /refreshFilterTubeRuntimeObservers\(\)/);
  assert.match(refreshObservers, /window\.FilterTube_refreshRuntimeObservers\(\)/);
  assert.match(refreshObservers, /window\.FilterTube_refreshQuickBlockAvailability\(\{ force: true \}\)/);
});

test('empty desktop install arms native dropdown discovery only after menu interaction', () => {
  const source = read('js/content/block_channel.js');
  const setup = sliceBetween(
    source,
    'function setupMenuObserver() {',
    '/**\n * YouTube Kids:'
  );
  const visibilityObserver = sliceBetween(
    setup,
    'function ensureDropdownVisibilityObserver(dropdown) {',
    'const isDropdownVisible = (dropdown) => {'
  );
  const startObserver = sliceBetween(
    setup,
    'const startObserver = () => {',
    'startObserver();'
  );

  assert.match(setup, /const armDropdownDiscoveryObserver = \(\) => \{/);
  assert.match(setup, /const scheduleDropdownInjection = \(dropdown\) => \{/);
  assert.match(setup, /requestAnimationFrame\(\(\) => setTimeout\(run, 0\)\)/);
  assert.match(setup, /scheduleDropdownInjection\(dropdown\)/);
  assert.match(visibilityObserver, /if \(isVisible\) \{\s*scheduleDropdownInjection\(dropdown\);\s*\}/);
  assert.doesNotMatch(visibilityObserver, /handleDropdownAppeared\(dropdown\)/);
  assert.match(setup, /dropdownDiscoveryObserver\.observe\(document\.body, \{/);
  assert.match(setup, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\)/);
  assert.match(setup, /document\.addEventListener\('click'/);
  assert.match(setup, /document\.addEventListener\('keydown'/);
  assert.match(setup, /armDropdownDiscoveryObserver\(\)/);
  assert.match(setup, /const armDropdownDiscoveryObserver = \(\) => \{\s*if \(!document\.body\) return;\s*scanExistingDropdowns\(\);/);
  assert.doesNotMatch(startObserver, /scanExistingDropdowns\(\)/);
  assert.doesNotMatch(startObserver, /new MutationObserver/);
  assert.doesNotMatch(startObserver, /observe\(document\.body/);
});

test('empty desktop install does not attach fallback menu body observer or warmup interval', () => {
  const source = read('js/content_bridge.js');
  const fallbackMenu = sliceBetween(
    source,
    'function ensureFallbackMenuButtons() {',
    'let playlistFallbackPopoverState = null;'
  );
  const eagerAttach = sliceBetween(
    fallbackMenu,
    'if (shouldEagerFallbackMenuScan()) {',
    "document.addEventListener('yt-navigate-finish'"
  );

  assert.match(source, /function shouldEagerFallbackMenuScan\(\) \{/);
  assert.match(source, /function shouldInstallFallbackMenuButtons\(\) \{\s*return shouldEagerFallbackMenuScan\(\);\s*\}/);
  assert.match(fallbackMenu, /if \(!shouldInstallFallbackMenuButtons\(\)\) \{\s*return;\s*\}/);
  assert.match(eagerAttach, /if \(!observeTarget\(\)\)/);
  assert.match(eagerAttach, /scheduleVisibleScan\(\)/);
  assert.match(fallbackMenu, /document\.addEventListener\('pointerover', scheduleHoveredFallbackCard/);
  assert.match(fallbackMenu, /document\.addEventListener\('focusin', scheduleHoveredFallbackCard/);
  assert.match(fallbackMenu, /window\.addEventListener\('scroll'/);
  assert.match(fallbackMenu, /if \(!shouldEagerFallbackMenuScan\(\)\) return/);
  assert.match(fallbackMenu, /if \(shouldEagerFallbackMenuScan\(\)\) \{\s*let warmupScans = 0;\s*const warmupTimer = setInterval/);
  assert.equal(countLiteral(fallbackMenu, 'observer.observe(target, { childList: true, subtree: true })'), 1);
});

test('empty desktop install keeps collaborator dialog observer lazy until pending cards exist', () => {
  const source = read('js/content/collab_dialog.js');
  const documentEvents = [];
  const observeCalls = [];
  let disconnects = 0;
  const documentElement = new FakeElement('html');

  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target, options) {
      observeCalls.push({ target, options });
    }

    disconnect() {
      disconnects += 1;
    }
  }

  const context = {
    window: {},
    document: {
      documentElement,
      body: null,
      addEventListener(type, listener, options) {
        documentEvents.push({ type, listener, options });
      },
      removeEventListener(type, listener, options) {
        documentEvents.push({ type: `remove:${type}`, listener, options });
      }
    },
    Element: FakeElement,
    HTMLElement: FakeElement,
    MutationObserver: FakeMutationObserver,
    Map,
    Set,
    Date,
    console: { log() {}, warn() {}, error() {} },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    applyDOMFallback() {}
  };
  context.window.window = context.window;
  context.window.document = context.document;
  context.window.pendingCollabCards = new Map();

  vm.runInNewContext(source, context, { filename: 'js/content/collab_dialog.js' });
  const domReady = documentEvents.find(entry => entry.type === 'DOMContentLoaded')?.listener;
  assert.equal(typeof domReady, 'function');

  domReady();
  assert.equal(documentEvents.some(entry => entry.type === 'click'), false);
  assert.equal(documentEvents.some(entry => entry.type === 'keydown'), false);
  assert.equal(observeCalls.length, 0);

  context.window.pendingCollabCards.set('vid:abcdefghijk', {
    key: 'vid:abcdefghijk',
    card: new FakeElement('ytd-rich-item-renderer'),
    videoId: 'abcdefghijk'
  });
  assert.equal(context.window.collabDialogModule.refreshCollabDialogRuntime(), true);
  assert.ok(documentEvents.some(entry => entry.type === 'click'));
  assert.ok(documentEvents.some(entry => entry.type === 'keydown'));
  assert.equal(observeCalls.length, 1);
  assert.equal(observeCalls[0].options.childList, true);
  assert.equal(observeCalls[0].options.subtree, true);

  context.window.pendingCollabCards.clear();
  assert.equal(context.window.collabDialogModule.refreshCollabDialogRuntime(), false);
  assert.ok(documentEvents.some(entry => entry.type === 'remove:click'));
  assert.ok(documentEvents.some(entry => entry.type === 'remove:keydown'));
  assert.equal(disconnects, 1);
});

test('empty blocklist keeps DOM fallback and identity prefetch observers settings-gated', () => {
  const source = read('js/content_bridge.js');
  const prefetch = sliceBetween(
    source,
    'function schedulePrefetchScan() {',
    'function queuePrefetchForCard(card) {'
  );
  const initializer = sliceBetween(
    source,
    'async function initializeDOMFallback(settings) {',
    'let fallbackMenuButtonsInstalled = false;'
  );

  assert.match(source, /function needsIdentityPrefetchWork\(settings\) \{/);
  assert.match(prefetch, /if \(!needsIdentityPrefetchWork\(currentSettings\)\) return/);
  assert.match(source, /return bridgeHasList\(settings\.filterChannels\)/);
  assert.match(prefetch, /function installRightRailWhitelistObserver\(\) \{\s*if \(currentSettings\?\.listMode !== 'whitelist'\) return/);
  assert.match(prefetch, /function refreshFilterTubeRuntimeObservers\(\) \{/);

  assert.match(initializer, /function refreshDOMFallbackMutationObserver\(\)/);
  assert.match(initializer, /if \(!hasActiveFallbackLifecycleWork\(\)\) \{\s*disconnectFallbackMutationObserver\(\);\s*return false;/);
  assert.match(initializer, /window\.FilterTube_refreshDOMFallbackObserver = refreshDOMFallbackMutationObserver/);
  assert.match(initializer, /refreshDOMFallbackMutationObserver\(\)/);
  assert.match(initializer, /refreshFilterTubeRuntimeObservers\(\)/);
});
