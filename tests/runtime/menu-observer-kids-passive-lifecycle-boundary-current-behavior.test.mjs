import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content/block_channel.js': [3175, 127396, '1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83']
};

const blockSpecs = {
  menuInjectionStateGlobals: {
    file: 'js/content/block_channel.js',
    start: '/**\n * Track the last clicked 3-dot button',
    end: '// Menu helpers',
    startLine: 1,
    lines: 52,
    bytes: 1568,
    hash: '30b0bc360d1dc665932dfe0f023441c1a9a54e0aafb3c2964fb4f0070b694abc'
  },
  dropdownPendingStateGlobals: {
    file: 'js/content/block_channel.js',
    start: '/**\n * Synchronous lock to prevent race conditions',
    end: 'let quickBlockStylesInjected = false;',
    startLine: 56,
    lines: 25,
    bytes: 762,
    hash: '02ed8c46d56a872e008bdf31d59b8951ca743e50f5640cd7c39610c6402ec7ed'
  },
  normalMenuObserverSetup: {
    file: 'js/content/block_channel.js',
    start: 'function setupMenuObserver() {',
    end: '/**\n * YouTube Kids: passively listen',
    startLine: 2304,
    lines: 287,
    bytes: 10680,
    hash: 'a01a8b8f7e6a0b0e66f81b07abbae1072d18e597f5f0951591be2a3f8a8b46df'
  },
  kidsPassiveBlockListener: {
    file: 'js/content/block_channel.js',
    start: 'function setupKidsPassiveBlockListener() {',
    end: 'function captureKidsMenuContext',
    startLine: 2595,
    lines: 46,
    bytes: 2558,
    hash: '884e53829c9c9d0cd6f6c9c320668fae939fc52fee2078499d86e7ae535943c8'
  },
  kidsMenuContextCapture: {
    file: 'js/content/block_channel.js',
    start: 'function captureKidsMenuContext(menuButton) {',
    end: 'async function handleKidsNativeBlock',
    startLine: 2641,
    lines: 123,
    bytes: 5460,
    hash: '0af71c6e8f0c358f41dfa7832ebe65d7d1e1da2e12954227aef87e3c3626d109'
  },
  kidsNativeBlockHandler: {
    file: 'js/content/block_channel.js',
    start: "async function handleKidsNativeBlock(blockType = 'video', options = {}) {",
    end: '/**\n * Try to inject',
    startLine: 2764,
    lines: 97,
    bytes: 3790,
    hash: '7fe5918cc38d98701e8b70f45dde0ae729d862f49f092fe94f4615c49db1bcc7'
  },
  tryVisibleDropdown: {
    file: 'js/content/block_channel.js',
    start: 'function tryInjectIntoVisibleDropdown() {',
    end: '/**\n * Handle when a dropdown appears',
    startLine: 2864,
    lines: 27,
    bytes: 1027,
    hash: 'bd2e1fc88b50f431c6528a9317bd4c1aa8aa4bfc888da34cd03736fc60f540b2'
  },
  dropdownAppearedLock: {
    file: 'js/content/block_channel.js',
    start: 'async function handleDropdownAppeared(dropdown) {',
    end: '/**\n * Internal handler',
    startLine: 2894,
    lines: 16,
    bytes: 526,
    hash: '71b0ffd34887d9e0e05d86f2b182bc7078934241e02814295d5f4940f40ce209'
  },
  dropdownAppearedInternal: {
    file: 'js/content/block_channel.js',
    start: 'async function handleDropdownAppearedInternal(dropdown) {',
    end: '// Initialize menu observer after a delay',
    startLine: 2913,
    lines: 258,
    bytes: 12301,
    hash: '5464ca8f80e0e127fbbc7efb74e7b955d1ee44df5bf0a06be666f3313681bcd2'
  },
  menuObserverStartupTimer: {
    file: 'js/content/block_channel.js',
    start: '// Initialize menu observer after a delay',
    end: null,
    startLine: 3171,
    lines: 5,
    bytes: 127,
    hash: 'eceb4cf282168121db45a952ea7ca860c1a577ab45a9592a8b2166f1e096befd'
  }
};

const selectedCounts = {
  lastClickedMenuButton: 9,
  isKidsSite: 2,
  lastKidsMenuContext: 6,
  KIDS_MENU_CONTEXT_TTL_MS: 2,
  lastKidsBlockActionTs: 3,
  lastKidsBlockClickTs: 3,
  handledKidsBlockActions: 4,
  injectedDropdowns: 13,
  isWhitelistModeActive: 2,
  cleanupInjectedMenuItems: 2,
  processingDropdowns: 5,
  pendingDropdownFetches: 2,
  dropdownVisibilityObservers: 3,
  FT_DROPDOWN_SELECTORS: 5,
  'document.addEventListener': 4,
  setTimeout: 9,
  MutationObserver: 5,
  'observer.observe': 2,
  'obs.observe': 1,
  disconnect: 3,
  removeEventListener: 0,
  clearTimeout: 2,
  clearInterval: 0,
  tryInjectIntoVisibleDropdown: 2,
  ensureDropdownVisibilityObserver: 2,
  handleDropdownAppeared: 7,
  handleDropdownAppearedInternal: 2,
  setupKidsPassiveBlockListener: 2,
  captureKidsMenuContext: 3,
  handleKidsNativeBlock: 3,
  FilterTube_KidsBlockChannel: 1,
  'data-filtertube-video-id': 3,
  'data-filtertube-unique-id': 2,
  'filtertube-block-channel-item': 4,
  'data-filtertube-quick': 0,
  'aria-hidden': 9,
  "style.display = 'none'": 0,
  querySelectorAll: 8,
  querySelector: 18,
  closest: 11,
  "startsWith('/watch')": 3,
  "startsWith('/shorts/')": 1,
  "startsWith('/channel/')": 1,
  'isWhitelistModeActive()': 1,
  'pendingDropdownFetches.get': 1,
  'fetchData.cancelled = true': 1,
  'injectedDropdowns.set': 3,
  'injectedDropdowns.delete': 5,
  'processingDropdowns.add': 1,
  'processingDropdowns.delete': 1,
  'lastKidsBlockActionTs < 1000': 1,
  'lastKidsBlockClickTs < 2000': 1,
  'handledKidsBlockActions.add': 1,
  'handledKidsBlockActions.delete': 1,
  'Date.now()': 5,
  'chrome.runtime?.sendMessage': 1,
  injectFilterTubeMenuItem: 2,
  'setupMenuObserver();': 1,
  'setupQuickBlockObserver();': 1
};

const zeroPolicyCounts = [
  'menuDropdownLifecycleContract',
  'menuDropdownLifecycleReport',
  'menuDropdownObserverOwnerReport',
  'menuDropdownPendingFetchCancellationPolicy',
  'menuDropdownInjectionStateReport',
  'kidsPassiveBlockLifecycleContract',
  'kidsNativeBlockDedupBudget',
  'kidsBlockMessageAuthority',
  'nativeMenuOpenCloseLifecycleContract',
  'nativeMenuDropdownCloseDecisionReport',
  'nativeMenuOutsidePointerPolicy',
  'nativeMenuReusableNodeStatePolicy',
  'menuLifecycleReportContract',
  'menuLifecycleReportApproval',
  'menuLifecycleNoWorkBudgetReport',
  'menuLifecycleNegativeFixturePacket',
  'menuLifecycleReusableNodeProof',
  'menuLifecycleCommentMenuProof',
  'menuLifecycleMetricArtifact'
];

const missingRuntimeSymbols = [
  'menuDropdownLifecycleContract',
  'menuDropdownLifecycleReport',
  'menuDropdownObserverOwnerReport',
  'menuDropdownPendingFetchCancellationPolicy',
  'menuDropdownInjectionStateReport',
  'kidsPassiveBlockLifecycleContract',
  'kidsNativeBlockDedupBudget',
  'kidsBlockMessageAuthority',
  'menuObserverTeardownRegistry',
  'menuDropdownLifecycleMetricArtifact',
  'nativeMenuOpenCloseLifecycleContract',
  'nativeMenuDropdownCloseDecisionReport',
  'nativeMenuOutsidePointerPolicy',
  'nativeMenuReusableNodeStatePolicy',
  'menuLifecycleReportContract',
  'menuLifecycleReportApproval',
  'menuLifecycleNoWorkBudgetReport',
  'menuLifecycleNegativeFixturePacket',
  'menuLifecycleReusableNodeProof',
  'menuLifecycleCommentMenuProof',
  'menuLifecycleMetricArtifact'
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

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = spec.end === null ? text.length : text.indexOf(spec.end, start + spec.start.length);
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
    hash: sha256(block),
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

function assertNativeDropdownOpenCloseOwnerFlow(text) {
  assert.match(text, /Native Dropdown Open-Close Owner Flow Addendum - 2026-05-27/);
  assert.match(text, /native dropdown open-close owner rows: 10/);
  assert.match(text, /ASCII native dropdown open-close flow diagram: present/);
  assert.match(text, /Mermaid native dropdown open-close flow diagram: present/);
  assert.match(text, /native dropdown open-close source proof: PARTIAL/);
  assert.match(text, /menu lifecycle optimization approval from owner flow: NO-GO/);
  assert.match(text, /runtime behavior changed by this addendum: no/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /3-dot menu button click\/keyboard/);
  assert.match(text, /outside pointer \/ card removal can close only FilterTube-enriched dropdowns/);

  for (const [rowId, sourcePin] of [
    ['native_menu_button_capture_owner', 'js/content/block_channel.js:2356-2372'],
    ['native_dropdown_forced_hidden_repair_owner', 'js/content/block_channel.js:2325-2353'],
    ['native_dropdown_visibility_observer_owner', 'js/content/block_channel.js:2374-2402'],
    ['native_dropdown_deferred_injection_owner', 'js/content/block_channel.js:2420-2445'],
    ['native_dropdown_existing_scan_owner', 'js/content/block_channel.js:2459-2467'],
    ['native_dropdown_outside_pointer_owner', 'js/content/block_channel.js:2469-2513'],
    ['native_dropdown_bounded_discovery_owner', 'js/content/block_channel.js:2515-2566'],
    ['native_menu_keyboard_discovery_owner', 'js/content/block_channel.js:2568-2576'],
    ['native_dropdown_injection_lock_owner', 'js/content/block_channel.js:2864-2908'],
    ['native_dropdown_identity_injection_owner', 'js/content/block_channel.js:2913-3169']
  ]) {
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(rowId)}\` \\| \`${escapeRegExp(sourcePin)}\``),
      `missing native dropdown owner row ${rowId}`
    );
  }

  const normalMenuSetup = blockMetric(blockSpecs.normalMenuObserverSetup).block;
  const internal = blockMetric(blockSpecs.dropdownAppearedInternal).block;

  assert.match(normalMenuSetup, /const forceHidden = el\.getAttribute\('data-filtertube-force-hidden'\) === 'true'/);
  assert.match(normalMenuSetup, /if \(!forceHidden\) return/);
  assert.match(normalMenuSetup, /if \(target\?\.closest\?\.\(menuButtonSelector\)\) return/);
  assert.match(normalMenuSetup, /if \(!dropdown\.querySelector\?\.\('\.filtertube-block-channel-item'\)\) return/);
  assert.match(normalMenuSetup, /if \(target && \(dropdown\.contains\(target\) \|\| eventPath\.includes\(dropdown\)\)\) return/);
  assert.match(normalMenuSetup, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\)/);
  assert.doesNotMatch(normalMenuSetup, /const obs = new MutationObserver\(\(\) => \{\s*try \{\s*repairFilterTubeHiddenDropdownState\(dropdown\);/);
  assert.match(internal, /if \(isWhitelistModeActive\(\)\) \{\s*cleanupInjectedMenuItems\(dropdown\);\s*return;/);
  assert.match(internal, /const commentContextCard = lastClickedMenuButton\.closest/);
  assert.match(internal, /pendingDropdownFetches\.get\(dropdown\)/);
  assert.match(internal, /fetchData\.cancelled = true/);
  assert.match(internal, /injectFilterTubeMenuItem\(dropdown, videoCard\)/);
  assert.doesNotMatch(internal, /dropdown\.style\.display = 'none'/);
}

function assertMenuLifecycleReportContract(text) {
  assert.match(text, /Menu Lifecycle Report Contract Continuation - 2026-05-29/);
  assert.match(text, /menu lifecycle report contract rows: 12/);
  assert.match(text, /required menu lifecycle report fields: 20/);
  assert.match(text, /implementation-ready menu lifecycle report rows: 0/);
  assert.match(text, /runtime menu lifecycle report approvals: 0/);
  assert.match(text, /menu lifecycle optimization approval from report contract: NO-GO/);
  assert.match(text, /runtime behavior changed by this continuation: no/);
  assert.match(text, /explicit user menu action/);
  assert.match(text, /flowchart TD/);
  assert.match(text, /Proof\["Negative fixtures and no-work budgets"\]/);

  for (const rowId of [
    'FT-MLR-00-scope',
    'FT-MLR-01-forced-hidden-repair',
    'FT-MLR-02-visibility-observer',
    'FT-MLR-03-deferred-injection-lock',
    'FT-MLR-04-bounded-discovery',
    'FT-MLR-05-outside-pointer-close',
    'FT-MLR-06-identity-injection',
    'FT-MLR-07-pending-fetch-stale-state',
    'FT-MLR-08-kids-context-dedupe',
    'FT-MLR-09-startup-fanout',
    'FT-MLR-10-cross-feature-boundary',
    'FT-MLR-11-artifact-gate'
  ]) {
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(rowId)}\` \\|`), `missing report row ${rowId}`);
  }

  for (const field of [
    'route',
    'surface',
    'profile',
    'listMode',
    'menuOwner',
    'userAction',
    'menuButtonSelector',
    'dropdownNode',
    'visibilityState',
    'injectedState',
    'closeReason',
    'pendingFetchEffect',
    'staleItemEffect',
    'kidsContext',
    'dedupeTimer',
    'noWorkBudget',
    'negativeOutsideClickProof',
    'negativeCommentMenuProof',
    'reusableNodeProof',
    'metricArtifact'
  ]) {
    assert.match(text, new RegExp(`\\b${escapeRegExp(field)}\\b`), `missing required report field ${field}`);
  }

  const normalMenuSetup = blockMetric(blockSpecs.normalMenuObserverSetup).block;
  const kidsBlock = blockMetric(blockSpecs.kidsNativeBlockHandler).block;
  const startup = blockMetric(blockSpecs.menuObserverStartupTimer).block;

  assert.match(normalMenuSetup, /dropdownDiscoveryStopTimer = setTimeout\(stopDropdownDiscoveryObserver, 2500\)/);
  assert.match(normalMenuSetup, /if \(!dropdown\.querySelector\?\.\('\.filtertube-block-channel-item'\)\) return/);
  assert.match(kidsBlock, /lastKidsBlockActionTs < 1000/);
  assert.match(kidsBlock, /handledKidsBlockActions\.delete\(dedupKey\)/);
  assert.match(startup, /setupMenuObserver\(\);/);
  assert.match(startup, /setupQuickBlockObserver\(\);/);
}

class FakeElement {
  constructor(name = 'el') {
    this.name = name;
    this.attrs = new Map();
    this.style = { display: '' };
    this.children = [];
    this.events = [];
    this.parentElement = null;
    this.nodeType = 1;
    this.tagName = name.toUpperCase();
    this.textContent = '';
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  matches(selector) {
    return this.matchSelector === selector || this.matchesAny === true;
  }

  closest(selector) {
    if (typeof this.closestImpl === 'function') return this.closestImpl(selector);
    return null;
  }

  querySelector(selector) {
    if (typeof this.querySelectorImpl === 'function') return this.querySelectorImpl(selector);
    return null;
  }

  querySelectorAll(selector) {
    if (typeof this.querySelectorAllImpl === 'function') return this.querySelectorAllImpl(selector);
    return [];
  }

  contains(node) {
    return node === this || this.children.includes(node);
  }

  remove() {
    this.removed = true;
  }

  dispatchEvent(event) {
    this.events.push(event);
    return true;
  }
}

function createMutationObserverRecorder(store) {
  return class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = false;
      store.push(this);
    }

    observe(target, options) {
      this.observed.push({ target, options });
    }

    disconnect() {
      this.disconnected = true;
    }
  };
}

function loadNormalMenuRuntime({ dropdowns = [], includeForceCloseDropdown = true } = {}) {
  const listeners = [];
  const timers = [];
  const observers = [];
  const appeared = [];
  const closed = [];
  const context = {
    Element: FakeElement,
    isKidsSite: false,
    FT_DROPDOWN_SELECTORS: 'dropdown-selector',
    dropdownVisibilityObservers: new WeakMap(),
    injectedDropdowns: new WeakMap(),
    MutationObserver: createMutationObserverRecorder(observers),
    KeyboardEvent: function KeyboardEvent(type, init) {
      this.type = type;
      Object.assign(this, init);
    },
    setTimeout(fn, delay) {
      const timer = { fn, delay };
      timers.push(timer);
      return timer;
    },
    clearTimeout() {},
    window: {
      getComputedStyle(node) {
        return {
          display: node.style.display || '',
          visibility: node.visibility || ''
        };
      }
    },
    document: {
      body: new FakeElement('body'),
      addEventListener(type, handler, options) {
        listeners.push({ type, handler, options });
      },
      querySelectorAll(selector) {
        assert.equal(selector, 'dropdown-selector');
        return dropdowns;
      }
    },
    blockChannelDebugLog() {},
    console,
    setupKidsPassiveBlockListener() {
      throw new Error('Kids setup should not run for non-Kids menu observer fixture');
    },
    handleDropdownAppeared(dropdown) {
      appeared.push(dropdown);
      return Promise.resolve();
    }
  };
  if (includeForceCloseDropdown) {
    context.forceCloseDropdown = function forceCloseDropdown(dropdown) {
      closed.push(dropdown);
    };
  }

  vm.runInNewContext(
    `${blockMetric(blockSpecs.normalMenuObserverSetup).block}\n${blockMetric(blockSpecs.tryVisibleDropdown).block}\nglobalThis.__api = { setupMenuObserver };`,
    context
  );
  return {
    ...context.__api,
    listeners,
    timers,
    observers,
    appeared,
    closed,
    context
  };
}

function loadKidsPassiveRuntime({ now = 10000 } = {}) {
  const listeners = [];
  const timers = [];
  const observers = [];
  const handled = [];
  const context = {
    Element: FakeElement,
    lastClickedMenuButton: null,
    lastKidsMenuContext: null,
    lastKidsBlockClickTs: 0,
    Date: {
      now: () => now
    },
    setTimeout(fn, delay) {
      const timer = { fn, delay };
      timers.push(timer);
      return timer;
    },
    MutationObserver: createMutationObserverRecorder(observers),
    document: {
      body: new FakeElement('body'),
      addEventListener(type, handler, options) {
        listeners.push({ type, handler, options });
      }
    },
    console,
    blockChannelDebugLog() {},
    captureKidsMenuContext(menuButton) {
      return { ts: now, channelName: 'Kid Channel', menuButton };
    },
    handleKidsNativeBlock(blockType, options) {
      handled.push({ blockType, options });
      return Promise.resolve();
    }
  };

  vm.runInNewContext(
    `${blockMetric(blockSpecs.kidsPassiveBlockListener).block}\nglobalThis.__api = { setupKidsPassiveBlockListener, getClickTs: () => lastKidsBlockClickTs, getContext: () => lastKidsMenuContext };`,
    context
  );
  return {
    ...context.__api,
    listeners,
    timers,
    observers,
    handled,
    context
  };
}

function loadKidsNativeBlockRuntime({ now = 50000, contextOverride = null } = {}) {
  const timers = [];
  const messages = [];
  const context = {
    KIDS_MENU_CONTEXT_TTL_MS: 15000,
    lastKidsBlockActionTs: 0,
    lastKidsMenuContext: contextOverride || {
      ts: now,
      videoId: 'abcdefghijk',
      channelId: 'UCabcdefghijabcdefghijab',
      channelHandle: '@kidchannel',
      customUrl: 'c/kidchannel',
      channelName: 'Kid Channel'
    },
    lastClickedMenuButton: null,
    handledKidsBlockActions: new Set(),
    Date: {
      now: () => now
    },
    setTimeout(fn, delay) {
      const timer = { fn, delay };
      timers.push(timer);
      return timer;
    },
    chrome: {
      runtime: {
        sendMessage(message, callback) {
          messages.push(message);
          if (callback) callback({ success: true });
        }
      }
    },
    window: {
      FilterTubeIdentity: {}
    },
    console,
    blockChannelDebugLog() {},
    captureKidsMenuContext() {
      return context.lastKidsMenuContext;
    }
  };

  vm.runInNewContext(
    `${blockMetric(blockSpecs.kidsNativeBlockHandler).block}\nglobalThis.__api = { handleKidsNativeBlock, getLastActionTs: () => lastKidsBlockActionTs, getHandledSize: () => handledKidsBlockActions.size };`,
    context
  );
  return {
    ...context.__api,
    timers,
    messages,
    context
  };
}

function loadDropdownLockRuntime() {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const calls = [];
  const context = {
    processingDropdowns: new WeakSet(),
    blockChannelDebugLog() {},
    handleDropdownAppearedInternal(dropdown) {
      calls.push(dropdown);
      return pending;
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.dropdownAppearedLock).block}\nglobalThis.__api = { handleDropdownAppeared };`, context);
  return {
    ...context.__api,
    calls,
    release
  };
}

function loadDropdownInternalWhitelistRuntime() {
  const cleaned = [];
  const injected = [];
  const context = {
    lastClickedMenuButton: new FakeElement('menu-button'),
    isWhitelistModeActive: () => true,
    cleanupInjectedMenuItems(dropdown) {
      cleaned.push(dropdown);
    },
    blockChannelDebugLog() {},
    injectFilterTubeMenuItem(dropdown, card) {
      injected.push({ dropdown, card });
      return Promise.resolve();
    },
    document: {
      location: { pathname: '/', search: '' },
      querySelector: () => null
    },
    URLSearchParams,
    MutationObserver: createMutationObserverRecorder([]),
    pendingDropdownFetches: new WeakMap(),
    injectedDropdowns: new WeakMap(),
    console,
    Element: FakeElement
  };
  vm.runInNewContext(
    `${blockMetric(blockSpecs.dropdownAppearedInternal).block}\nglobalThis.__api = { handleDropdownAppearedInternal };`,
    context
  );
  return {
    ...context.__api,
    cleaned,
    injected
  };
}

test('menu observer Kids passive lifecycle audit is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior proof only/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not approval\s+to change runtime filtering, JSON mutation, DOM mutation, storage, message,\s+lifecycle, network, prompt, or settings semantics/);
  assert.match(text, /codebase inspection is finding optimization locations and first-class JSON filter blockers/);
  assert.match(text, /menu observer Kids passive lifecycle source files: 1/);
  assert.match(text, /menu observer Kids passive lifecycle source\/effect blocks: 10/);
  assertNativeDropdownOpenCloseOwnerFlow(text);
  assertMenuLifecycleReportContract(text);

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`));
  }
});

test('menu observer Kids passive lifecycle blocks and selected counts stay pinned', () => {
  const text = doc();
  const selected = selectedSource();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line drift`);
    assert.equal(metric.lines, spec.lines, `${name} line count drift`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count drift`);
    assert.equal(metric.hash, spec.hash, `${name} hash drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(name)}\` \\| ${spec.startLine} \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(token)}\` \\| ${expected} \\|`));
  }
});

test('normal menu observer installs capture click, dropdown observers, body observer, and 150 ms retry', async () => {
  const dropdown = new FakeElement('dropdown');
  const runtime = loadNormalMenuRuntime({ dropdowns: [dropdown] });

  runtime.setupMenuObserver();

  assert.equal(runtime.listeners.length, 3);
  assert.equal(runtime.listeners[0].type, 'click');
  assert.equal(runtime.listeners[0].options, true);
  assert.equal(runtime.listeners[1].type, 'mousedown');
  assert.equal(runtime.listeners[1].options, true);
  assert.equal(runtime.listeners[2].type, 'keydown');
  assert.equal(runtime.listeners[2].options, true);
  assert.equal(runtime.observers.length, 0, 'dropdown/body observers are armed lazily after menu-button activation');

  dropdown.querySelectorImpl = (selector) => selector === '.filtertube-block-channel-item'
    ? new FakeElement('injected-item')
    : null;
  const outside = new FakeElement('outside');
  runtime.listeners[1].handler({ target: outside, composedPath: () => [outside] });
  assert.deepEqual(runtime.closed, [dropdown], 'outside pointer fallback closes injected dropdowns without stopping the event');

  const menuButton = new FakeElement('menu-button');
  const target = new FakeElement('target');
  target.closestImpl = (selector) => {
    assert.match(selector, /button\[aria-label\*="More"\]/);
    return menuButton;
  };
  const event = { target };
  runtime.listeners[0].handler(event);
  assert.equal(runtime.observers.length, 2);
  assert.equal(runtime.observers[0].observed[0].options.attributes, true);
  assert.deepEqual(Array.from(runtime.observers[0].observed[0].options.attributeFilter), ['style', 'aria-hidden', 'hidden']);
  assert.equal(runtime.observers[1].observed[0].options.childList, true);
  assert.equal(runtime.observers[1].observed[0].options.subtree, true);

  const retryTimer = runtime.timers.find((timer) => timer.delay === 150);
  assert.ok(retryTimer, 'menu click should schedule a 150 ms visible-dropdown retry');
  retryTimer.fn();
  await Promise.resolve();
  assert.deepEqual(runtime.appeared, [dropdown]);

  const stopTimer = runtime.timers.find((timer) => timer.delay === 2500);
  assert.ok(stopTimer, 'menu click should schedule bounded dropdown discovery shutdown');
  stopTimer.fn();
  assert.equal(runtime.observers[1].disconnected, true, 'bounded body discovery observer disconnects at 2500 ms');

  const fallbackDropdown = new FakeElement('fallback-dropdown');
  fallbackDropdown.querySelectorImpl = (selector) => selector === '.filtertube-block-channel-item'
    ? new FakeElement('injected-item')
    : null;
  const fallbackRuntime = loadNormalMenuRuntime({
    dropdowns: [fallbackDropdown],
    includeForceCloseDropdown: false
  });

  fallbackRuntime.setupMenuObserver();
  const pointerListener = fallbackRuntime.listeners.find((listener) => listener.type === 'mousedown');
  assert.ok(pointerListener);
  const fallbackOutside = new FakeElement('fallback-outside');
  pointerListener.handler({ target: fallbackOutside, composedPath: () => [fallbackOutside] });
  assert.deepEqual(fallbackRuntime.closed, []);
  assert.equal(fallbackDropdown.events.length, 1);
  assert.equal(fallbackDropdown.events[0].type, 'keydown');
  assert.equal(fallbackDropdown.events[0].key, 'Escape');
});

test('Kids passive listener handles native menu clicks and suppresses recent toast fallback', async () => {
  const runtime = loadKidsPassiveRuntime({ now: 20000 });

  runtime.setupKidsPassiveBlockListener();
  assert.equal(runtime.listeners.length, 1);
  assert.equal(runtime.listeners[0].type, 'click');
  assert.equal(runtime.listeners[0].options, true);
  assert.equal(runtime.observers.length, 1);
  assert.equal(runtime.observers[0].observed[0].options.childList, true);
  assert.equal(runtime.observers[0].observed[0].options.subtree, true);

  const menuButton = new FakeElement('menu-button');
  const menuItem = new FakeElement('menu-item');
  menuItem.textContent = 'Block this channel';
  runtime.listeners[0].handler({
    target: {
      closest(selector) {
        if (selector.includes('ytk-menu-renderer')) return menuButton;
        if (selector.includes('ytk-menu-service-item-renderer')) return menuItem;
        return null;
      }
    }
  });

  assert.equal(runtime.getClickTs(), 20000);
  assert.equal(runtime.getContext().menuButton, menuButton);
  assert.equal(runtime.handled.length, 1);
  assert.equal(runtime.handled[0].blockType, 'channel');
  assert.equal(runtime.handled[0].options.source, 'click');

  const toast = new FakeElement('toast');
  toast.textContent = 'Channel blocked';
  toast.matches = (selector) => selector === 'tp-yt-paper-toast#toast';
  runtime.observers[0].callback([{ addedNodes: [toast] }]);
  await Promise.resolve();

  assert.equal(runtime.handled.length, 1, 'toast fallback should be suppressed after recent click handling');
});

test('Kids native block handler sends background message and keeps throttle/dedupe timers explicit', async () => {
  const runtime = loadKidsNativeBlockRuntime({ now: 50000 });

  await runtime.handleKidsNativeBlock('channel', { source: 'click' });

  assert.equal(runtime.getLastActionTs(), 50000);
  assert.equal(runtime.getHandledSize(), 1);
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 10000);
  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.messages[0].action, 'FilterTube_KidsBlockChannel');
  assert.equal(runtime.messages[0].videoId, 'abcdefghijk');
  assert.equal(runtime.messages[0].channel.id, 'UCabcdefghijabcdefghijab');
  assert.equal(runtime.messages[0].channel.handle, '@kidchannel');
  assert.equal(runtime.messages[0].channel.customUrl, 'c/kidchannel');
  assert.equal(runtime.messages[0].channel.originalInput, 'UCabcdefghijabcdefghijab');

  await runtime.handleKidsNativeBlock('channel', { source: 'toast' });
  assert.equal(runtime.messages.length, 1, '1000 ms action throttle should suppress immediate duplicate work');
});

test('dropdown appearance lock suppresses concurrent work and releases in finally', async () => {
  const dropdown = new FakeElement('dropdown');
  const runtime = loadDropdownLockRuntime();

  const first = runtime.handleDropdownAppeared(dropdown);
  await runtime.handleDropdownAppeared(dropdown);
  assert.equal(runtime.calls.length, 1);

  runtime.release();
  await first;

  runtime.handleDropdownAppeared(dropdown);
  assert.equal(runtime.calls.length, 2);
});

test('dropdown internal whitelist mode cleans injected menu items before injection', async () => {
  const dropdown = new FakeElement('dropdown');
  const runtime = loadDropdownInternalWhitelistRuntime();

  await runtime.handleDropdownAppearedInternal(dropdown);

  assert.deepEqual(runtime.cleaned, [dropdown]);
  assert.deepEqual(runtime.injected, []);
});

test('dropdown internals keep cancellation, stale cleanup, identity stamping, and startup fanout source-derived', () => {
  const text = doc();
  const normalMenuSetup = blockMetric(blockSpecs.normalMenuObserverSetup).block;
  const internal = blockMetric(blockSpecs.dropdownAppearedInternal).block;
  const startup = blockMetric(blockSpecs.menuObserverStartupTimer).block;

  assert.match(normalMenuSetup, /const forceHidden = el\.getAttribute\('data-filtertube-force-hidden'\) === 'true'/);
  assert.match(normalMenuSetup, /if \(!forceHidden\) return/);
  assert.doesNotMatch(normalMenuSetup, /staleDesktopMenu|staleDesktopRoot/);
  assert.match(internal, /pendingDropdownFetches\.get\(dropdown\)/);
  assert.match(internal, /fetchData\.cancelled = true/);
  assert.match(internal, /dropdownObserver\.disconnect\(\)/);
  assert.match(internal, /observer\.disconnect\(\)/);
  assert.doesNotMatch(internal, /dropdown\.style\.display = 'none'/);
  assert.doesNotMatch(internal, /dropdown\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(internal, /forceCloseDropdown\(dropdown\)/);
  assert.match(internal, /data-filtertube-video-id/);
  assert.match(internal, /data-filtertube-unique-id/);
  assert.match(internal, /filtertube-block-channel-item/);
  assert.match(internal, /injectFilterTubeMenuItem\(dropdown, videoCard\)/);
  assert.match(startup, /setTimeout\(\(\) => \{/);
  assert.match(startup, /setupMenuObserver\(\);/);
  assert.match(startup, /setupQuickBlockObserver\(\);/);
  assert.match(startup, /\}, 1000\)/);
  assert.match(text, /pending dropdown fetch cancellation on `aria-hidden`/);
  assert.match(text, /startup timer still delays 1000 ms/);
  assert.match(text, /native dropdown discovery stop executable rows: 1/);
  assert.match(text, /native dropdown escape fallback executable rows: 1/);
  assert.match(text, /bounded body discovery observer disconnects at 2500 ms/);
  assert.match(text, /shared closer absent -> Escape fallback/);
});

test('menu observer Kids passive lifecycle future authority symbols remain absent from product runtime', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  for (const token of zeroPolicyCounts) {
    assert.equal(countLiteral(runtime, token), 0, `${token} unexpectedly exists in runtime`);
    assert.match(text, new RegExp(`\\\`${escapeRegExp(token)}\\\``));
  }

  for (const token of missingRuntimeSymbols) {
    assert.equal(countLiteral(runtime, token), 0, `${token} unexpectedly exists in runtime`);
  }

  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /first-class menu observer lifecycle authority gates/);
});
