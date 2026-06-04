import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_INJECTION_ACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const menuDialogFamilyDocs = [
  'docs/audit/FILTERTUBE_COLLAB_DIALOG_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_COLLAB_DIALOG_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_ENRICHMENT_RETRY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_IDENTITY_PROMOTION_HANDOFF_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_MAIN_WORLD_MERGE_MUTATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_COLLABORATOR_METADATA_EXTRACTION_SIDE_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_ACTION_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_BLOCKED_STATE_LIST_SHAPE_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_INJECTION_ACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_CONTENT_MENU_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_FALLBACK_MENU_ACTION_GATE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_INJECTOR_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_INJECTOR_SETTINGS_CAPABILITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_MAIN_COLLAB_RESOLVED_SEARCH_CARD_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_MENU_OBSERVER_KIDS_PASSIVE_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_QUICK_BLOCK_BLOCK_MENU_AFFORDANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_QUICK_BLOCK_DEFAULT_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_QUICK_BLOCK_HOVER_LIFECYCLE_TIMER_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

const sourceFingerprints = {
  'js/content_bridge.js': [13636, 604184, '8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d']
};

const blockSpecs = {
  contentBridgeMetadataPayload: {
    file: 'js/content_bridge.js',
    start: 'function buildChannelMetadataPayload(channelInfo = {}) {',
    end: 'function pickMenuChannelDisplayName',
    startLine: 127,
    lines: 76,
    bytes: 3754,
    hash: 'd6c3da5000cfb20dec65c73d66926e70e518fe501a931ea730afb03a655d55eb'
  },
  contentBridgeDropdownCleanup: {
    file: 'js/content_bridge.js',
    start: 'function registerActiveCollaborationMenu(videoId, dropdown, videoCard, state = {}) {',
    end: 'function clearFilterTubeMenuItems',
    startLine: 440,
    lines: 151,
    bytes: 5372,
    hash: '9aef97fd142a584b06e06b742565f75c301c7c12d673badebc385ac7b2c75aec'
  },
  contentBridgeMenuInjectionEntry: {
    file: 'js/content_bridge.js',
    start: 'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    end: '/**\n * Inject into NEW menu structure',
    startLine: 10738,
    lines: 735,
    bytes: 34684,
    hash: '9310a960d3a007775483683d00dfdcf2fedd773efd33e329fd01aa6f0d52605b'
  },
  contentBridgeMenuHandlers: {
    file: 'js/content_bridge.js',
    start: 'function attachFilterTubeMenuHandlers({ menuItem, toggle, channelInfo, videoCard, injectionOptions = {} }) {',
    end: 'function createFilterTubeIconElement',
    startLine: 11476,
    lines: 71,
    bytes: 2490,
    hash: '07e0e72b5c4c4a7f95615c0e752bd1ea987fd4851f31e23e3569e8d3bcadd540'
  },
  contentBridgeBlockedMarkerAndTargets: {
    file: 'js/content_bridge.js',
    start: "function markElementAsBlocked(element, channelInfo, state = 'pending') {",
    end: 'function syncBlockedElementsWithFilters',
    startLine: 12047,
    lines: 119,
    bytes: 5113,
    hash: 'c6eb72ca074bc60447f2914cf3a58f421eafe8db9a18ce44f398c86d3cf8d7f7'
  },
  contentBridgeHandleBlockChannelClick: {
    file: 'js/content_bridge.js',
    start: 'async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {',
    end: '/**\n * Add channel directly',
    startLine: 12206,
    lines: 1226,
    bytes: 60722,
    hash: '459943dd5f26638ac63bc413a7cee220e862225929aaf2a4a0b6e068cd32ef9f'
  },
  contentBridgeAddChannelDirectly: {
    file: 'js/content_bridge.js',
    start: 'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {',
    end: '/**\n * Add "Filter All Content" checkbox',
    startLine: 13440,
    lines: 54,
    bytes: 2662,
    hash: '4eb280573a5611b695c8284a8e6b85d17b2a97c459143a3054d02374cdf7c2ca'
  }
};

const selectedCounts = {
  buildChannelMetadataPayload: 8,
  canonicalHandle: 11,
  handleDisplay: 21,
  channelName: 4,
  lowConfidenceExpectedName: 3,
  pendingDropdownFetches: 7,
  'pendingDropdownFetches.set': 1,
  channelInfoPromise: 3,
  collaboratorPromise: 3,
  cancelled: 6,
  initialChannelInfo: 117,
  injectFilterTubeMenuItem: 2,
  'currentSettings?.listMode': 1,
  showBlockMenuItem: 1,
  clearFilterTubeMenuItems: 3,
  clearMultiStepStateForDropdown: 2,
  waitForMenu: 2,
  MutationObserver: 2,
  'observer.observe': 1,
  'closeObserver.observe': 1,
  setTimeout: 6,
  clearTimeout: 1,
  'waitForNextFrameDelay(250)': 1,
  renderFilterTubeMenuEntries: 3,
  registerActiveCollaborationMenu: 5,
  unregisterActiveCollaborationMenu: 3,
  enrichCollaboratorsWithMainWorld: 2,
  searchYtInitialDataForVideoChannel: 4,
  fetchIdForHandle: 4,
  updateInjectedMenuChannelName: 1,
  attachFilterTubeMenuHandlers: 1,
  addEventListener: 2,
  handleBlockChannelClick: 2,
  isFilterAllToggleActive: 3,
  toggleMultiStepSelection: 2,
  markElementAsBlocked: 6,
  clearBlockedElementAttributes: 1,
  resolveCommentHideTarget: 3,
  resolveClickedContentHideTarget: 5,
  'filtertube-hidden': 15,
  'data-filtertube-hidden': 8,
  'data-filtertube-blocked-state': 4,
  restoreOptimisticHide: 3,
  confirmOptimisticHide: 2,
  addChannelDirectly: 9,
  "type: 'addFilteredChannel'": 1,
  FilterTube_ScheduleAutoBackup: 1,
  'forceReprocess: true': 1,
  'preserveScroll: true': 1,
  requestSettingsFromBackground: 1,
  applyDOMFallback: 1,
  enrichVisibleShortsWithChannelInfo: 1,
  enrichVisiblePlaylistRowsWithChannelInfo: 1,
  forceCloseDropdown: 3,
  "style.display = 'none'": 7,
  '✓ Channel Blocked': 2,
  '✗ Failed to block': 1,
  'Fetching...': 2,
  'filtertube-pending': 4,
  'aria-busy': 4
};

const zeroPolicyCounts = [
  'contentBridgeMenuActionContract',
  'contentBridgeMenuActionReport',
  'contentBridgePendingDropdownFetchPolicy',
  'contentBridgeMenuOptimisticHideReport',
  'contentBridgeMenuMutationFanoutBudget',
  'contentBridgeMenuDomFallbackBudget',
  'contentBridgeMenuBackupSchedulePolicy',
  'contentBridgeMenuIdentityEnrichmentPolicy'
];

const missingRuntimeSymbols = [
  'contentBridgeMenuActionContract',
  'contentBridgeMenuActionReport',
  'contentBridgePendingDropdownFetchPolicy',
  'contentBridgeMenuOptimisticHideReport',
  'contentBridgeMenuMutationFanoutBudget',
  'contentBridgeMenuDomFallbackBudget',
  'contentBridgeMenuBackupSchedulePolicy',
  'contentBridgeMenuIdentityEnrichmentPolicy',
  'contentBridgeMenuActionFixtureProvenance',
  'contentBridgeMenuActionMetricArtifact'
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

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(name = 'el') {
    this.name = name;
    this.tagName = name.toUpperCase();
    this.attrs = new Map();
    this.style = {};
    this.classList = new FakeClassList();
    this.listeners = [];
    this.children = [];
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  hasAttribute(name) {
    return this.attrs.has(name);
  }

  addEventListener(type, handler, options) {
    this.listeners.push({ type, handler, options });
  }

  blur() {
    this.blurred = true;
  }

  querySelector(selector) {
    if (typeof this.querySelectorImpl === 'function') return this.querySelectorImpl(selector);
    return null;
  }

  closest(selector) {
    if (typeof this.closestImpl === 'function') return this.closestImpl(selector);
    return null;
  }

  contains(node) {
    return this === node || this.children.includes(node);
  }
}

function loadMetadataPayloadRuntime() {
  const context = {
    extractRawHandle(value) {
      const text = String(value || '').trim();
      if (!text) return '';
      if (text.startsWith('@')) return text;
      const match = text.match(/\/@([a-zA-Z0-9_.-]+)/);
      return match ? `@${match[1]}` : '';
    },
    isLowConfidenceExpectedChannelLabel(info) {
      return info?.lowConfidenceExpectedName === true;
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.contentBridgeMetadataPayload).block}\nglobalThis.__api = { buildChannelMetadataPayload };`, context);
  return context.__api;
}

function loadDropdownCleanupRuntime() {
  const cleaned = [];
  const clearedMulti = [];
  const context = {
    activeCollaborationDropdowns: new Map(),
    injectedDropdowns: new WeakMap(),
    pendingDropdownFetches: new WeakMap(),
    document: { querySelector: () => null },
    KeyboardEvent: function KeyboardEvent() {},
    clearFilterTubeMenuItems(dropdown) {
      cleaned.push(dropdown);
    },
    clearMultiStepStateForDropdown(dropdown) {
      clearedMulti.push(dropdown);
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.contentBridgeDropdownCleanup).block}\nglobalThis.__api = { registerActiveCollaborationMenu, unregisterActiveCollaborationMenu, cleanupDropdownState };`, context);
  return {
    ...context.__api,
    activeCollaborationDropdowns: context.activeCollaborationDropdowns,
    injectedDropdowns: context.injectedDropdowns,
    pendingDropdownFetches: context.pendingDropdownFetches,
    cleaned,
    clearedMulti
  };
}

function loadMenuHandlersRuntime() {
  const blockCalls = [];
  const multiStepCalls = [];
  const context = {
    isCommentContextTag: () => false,
    isFilterAllToggleActive: () => true,
    toggleMultiStepSelection(menuItem, channelInfo) {
      multiStepCalls.push({ menuItem, channelInfo });
    },
    handleBlockChannelClick(channelInfo, menuItem, filterAll, videoCard) {
      blockCalls.push({ channelInfo, menuItem, filterAll, videoCard });
      return Promise.resolve();
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.contentBridgeMenuHandlers).block}\nglobalThis.__api = { attachFilterTubeMenuHandlers };`, context);
  return {
    ...context.__api,
    blockCalls,
    multiStepCalls
  };
}

function loadBlockedMarkerRuntime(now = 123456) {
  const context = {
    Element: FakeElement,
    Date: { now: () => now },
    document: { querySelectorAll: () => [] }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.contentBridgeBlockedMarkerAndTargets).block}\nglobalThis.__api = { markElementAsBlocked, clearBlockedElementAttributes, resolveClickedContentHideTarget };`, context);
  return context.__api;
}

function loadAddChannelDirectlyRuntime(hostname = 'www.youtube.com') {
  const messages = [];
  const context = {
    location: { hostname },
    window: {},
    console,
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(message, callback) {
          messages.push(message);
          if (message.type === 'addFilteredChannel') {
            callback?.({ success: true, channelData: { id: 'UCabcdefghijklmnopqrstuv' } });
          } else {
            callback?.({ success: true });
          }
        }
      }
    }
  };
  vm.runInNewContext(`${blockMetric(blockSpecs.contentBridgeAddChannelDirectly).block}\nglobalThis.__api = { addChannelDirectly };`, context);
  return {
    ...context.__api,
    messages
  };
}

test('content bridge menu injection action audit is audit-only and source pinned', () => {
  const text = doc();
  const methodGap = read(methodGapPath);

  assert.match(text, /Status: current-behavior proof only/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not approval\s+to change runtime filtering, JSON mutation, DOM mutation, storage, message,\s+lifecycle, network, prompt, or settings semantics/);
  assert.match(text, /codebase inspection is finding optimization locations and first-class JSON filter blockers/);
  assert.match(text, /content bridge menu injection action source files: 1/);
  assert.match(text, /content bridge menu injection action source\/effect blocks: 7/);

  assert.match(methodGap, /repo-wide lexical callables: 5797/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5797/);

  assert.equal(menuDialogFamilyDocs.length, 19);
  for (const familyDocPath of menuDialogFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5797/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5797/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: (?:no|yes; collaborator dialog listeners and MutationObserver are lazy)/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  for (const [file, [expectedLines, expectedBytes, expectedHash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drift`);
    assert.equal(Buffer.byteLength(source), expectedBytes, `${file} byte count drift`);
    assert.equal(sha256(source), expectedHash, `${file} hash drift`);
    assert.match(text, new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines.toLocaleString('en-US')} \\| ${expectedBytes.toLocaleString('en-US')} \\| \`${expectedHash}\` \\|`));
  }
});

test('content bridge menu injection action blocks and selected counts stay pinned', () => {
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

test('metadata payload keeps display handle strict and name separate', () => {
  const { buildChannelMetadataPayload } = loadMetadataPayloadRuntime();

  const payload = buildChannelMetadataPayload({
    canonicalHandle: 'https://youtube.com/@realhandle',
    handleDisplay: 'Not A Handle',
    name: 'Useful Channel',
    expectedChannelName: 'Expected Channel',
    videoId: 'abcdefghijk',
    videoTitleHint: 'Video title',
    customUrl: 'c/useful',
    source: 'menu',
    lowConfidenceExpectedName: false
  });

  assert.equal(payload.canonicalHandle, '@realhandle');
  assert.equal(payload.handleDisplay, '@realhandle');
  assert.equal(payload.channelName, 'Useful Channel');
  assert.equal(payload.videoId, 'abcdefghijk');
  assert.equal(payload.videoTitleHint, 'Video title');
  assert.equal(payload.expectedChannelName, 'Expected Channel');
  assert.equal(payload.customUrl, 'c/useful');
  assert.equal(payload.source, 'menu');
  assert.equal(payload.lowConfidenceExpectedName, false);

  const lowConfidence = buildChannelMetadataPayload({
    handleDisplay: 'Channel',
    expectedChannelName: 'Expected But Weak',
    lowConfidenceExpectedName: true
  });
  assert.equal(lowConfidence.handleDisplay, null);
  assert.equal(lowConfidence.channelName, null);
  assert.equal(lowConfidence.lowConfidenceExpectedName, true);
});

test('dropdown cleanup cancels pending fetches and clears injected collaboration state', () => {
  const runtime = loadDropdownCleanupRuntime();
  const dropdown = new FakeElement('dropdown');
  const videoCard = new FakeElement('card');
  const fetchData = { cancelled: false };

  runtime.injectedDropdowns.set(dropdown, { videoCardId: 'abc', isComplete: true });
  runtime.pendingDropdownFetches.set(dropdown, fetchData);
  runtime.registerActiveCollaborationMenu('video-1', dropdown, videoCard, { expectedCount: 2, groupId: 'group-1' });
  assert.equal(dropdown.getAttribute('data-filtertube-collab-video-id'), 'video-1');
  assert.equal(runtime.activeCollaborationDropdowns.has('video-1'), true);

  runtime.cleanupDropdownState(dropdown);

  assert.equal(fetchData.cancelled, true);
  assert.equal(runtime.pendingDropdownFetches.has(dropdown), false);
  assert.equal(runtime.injectedDropdowns.has(dropdown), false);
  assert.equal(runtime.activeCollaborationDropdowns.has('video-1'), false);
  assert.equal(dropdown.hasAttribute('data-filtertube-collab-video-id'), false);
  assert.deepEqual(runtime.cleaned, [dropdown]);
  assert.deepEqual(runtime.clearedMulti, [dropdown]);
});

test('menu handlers gate disabled, toggle, placeholder, multi-step, and block-click paths', async () => {
  const runtime = loadMenuHandlersRuntime();
  const menuItem = new FakeElement('menu-item');
  const toggle = new FakeElement('toggle');
  const videoCard = new FakeElement('card');
  const channelInfo = { id: 'UCabcdefghijklmnopqrstuv', name: 'Channel' };

  runtime.attachFilterTubeMenuHandlers({ menuItem, toggle, channelInfo, videoCard });
  assert.equal(menuItem.listeners.length, 2);
  assert.equal(menuItem.listeners[0].type, 'click');
  assert.deepEqual(Object.assign({}, menuItem.listeners[0].options), { capture: true });
  assert.equal(menuItem.listeners[1].type, 'keydown');

  const toggleEvent = {
    target: toggle,
    preventDefaultCalled: false,
    preventDefault() { this.preventDefaultCalled = true; },
    stopPropagation() { throw new Error('toggle path should not stop propagation'); },
    stopImmediatePropagation() { throw new Error('toggle path should not stop immediate propagation'); }
  };
  await menuItem.listeners[0].handler(toggleEvent);
  assert.equal(toggleEvent.preventDefaultCalled, true);
  assert.equal(runtime.blockCalls.length, 0);

  const event = {
    target: menuItem,
    preventDefault() {},
    stopPropagation() {},
    stopImmediatePropagation() {}
  };
  await menuItem.listeners[0].handler(event);
  assert.equal(runtime.blockCalls.length, 1);
  assert.equal(runtime.blockCalls[0].filterAll, true);
  assert.equal(runtime.blockCalls[0].videoCard, videoCard);

  const member = new FakeElement('member');
  member.setAttribute('data-multi-step', 'true');
  runtime.attachFilterTubeMenuHandlers({ menuItem: member, toggle: null, channelInfo, videoCard });
  await member.listeners[0].handler(event);
  assert.equal(runtime.multiStepCalls.length, 1);
});

test('blocked marker writer stamps and clears current optimistic hide metadata', () => {
  const runtime = loadBlockedMarkerRuntime(987654);
  const element = new FakeElement('target');

  runtime.markElementAsBlocked(element, {
    id: 'UCabcdefghijklmnopqrstuv',
    handle: '@handle',
    customUrl: 'c/custom',
    name: 'Channel Name'
  }, 'pending');

  assert.equal(element.getAttribute('data-filtertube-blocked-channel-id'), 'UCabcdefghijklmnopqrstuv');
  assert.equal(element.getAttribute('data-filtertube-blocked-channel-handle'), '@handle');
  assert.equal(element.getAttribute('data-filtertube-blocked-channel-custom'), 'c/custom');
  assert.equal(element.getAttribute('data-filtertube-blocked-channel-name'), 'Channel Name');
  assert.equal(element.getAttribute('data-filtertube-blocked-state'), 'pending');
  assert.equal(element.getAttribute('data-filtertube-blocked-ts'), '987654');

  runtime.clearBlockedElementAttributes(element);
  assert.equal(element.hasAttribute('data-filtertube-blocked-channel-id'), false);
  assert.equal(element.hasAttribute('data-filtertube-blocked-channel-handle'), false);
  assert.equal(element.hasAttribute('data-filtertube-blocked-state'), false);
});

test('addChannelDirectly forwards metadata and schedules background backup after success', async () => {
  const runtime = loadAddChannelDirectlyRuntime('www.youtube.com');

  const emptyResult = await runtime.addChannelDirectly('', false);
  assert.equal(emptyResult.success, false);
  assert.equal(emptyResult.error, 'Empty input');

  const result = await runtime.addChannelDirectly('@handle', true, ['Other'], 'group-1', {
    handleDisplay: '@handle',
    canonicalHandle: '@handle',
    channelName: 'Channel Name',
    channelLogo: 'logo.png',
    videoId: 'abcdefghijk',
    videoTitleHint: 'Video title',
    expectedChannelName: 'Expected Channel',
    lowConfidenceExpectedName: true,
    customUrl: 'c/custom',
    source: 'menu'
  });

  assert.equal(result.success, true);
  assert.equal(runtime.messages.length, 2);
  assert.equal(runtime.messages[0].type, 'addFilteredChannel');
  assert.equal(runtime.messages[0].input, '@handle');
  assert.equal(runtime.messages[0].filterAll, true);
  assert.deepEqual(runtime.messages[0].collaborationWith, ['Other']);
  assert.equal(runtime.messages[0].collaborationGroupId, 'group-1');
  assert.equal(runtime.messages[0].displayHandle, '@handle');
  assert.equal(runtime.messages[0].canonicalHandle, '@handle');
  assert.equal(runtime.messages[0].channelName, 'Channel Name');
  assert.equal(runtime.messages[0].videoId, 'abcdefghijk');
  assert.equal(runtime.messages[0].expectedChannelName, 'Expected Channel');
  assert.equal(runtime.messages[0].lowConfidenceExpectedName, true);
  assert.equal(runtime.messages[0].profile, 'main');
  assert.equal(runtime.messages[0].customUrl, 'c/custom');
  assert.equal(runtime.messages[0].source, 'menu');
  assert.equal(runtime.messages[1].action, 'FilterTube_ScheduleAutoBackup');
  assert.equal(runtime.messages[1].triggerType, 'channel_added');
  assert.equal(runtime.messages[1].delay, 1000);

  const kidsRuntime = loadAddChannelDirectlyRuntime('www.youtubekids.com');
  await kidsRuntime.addChannelDirectly('UCabcdefghijklmnopqrstuv', false);
  assert.equal(kidsRuntime.messages[0].profile, 'kids');
});

test('menu injection and block click fanout stay source-derived', () => {
  const injection = blockMetric(blockSpecs.contentBridgeMenuInjectionEntry).block;
  const action = blockMetric(blockSpecs.contentBridgeHandleBlockChannelClick).block;

  assert.match(injection, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(injection, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(injection, /observer\.observe\(dropdown, \{ childList: true, subtree: true \}\)/);
  assert.match(injection, /closeObserver\.observe\(dropdown, \{ attributes: true, attributeFilter: \['style', 'aria-hidden', 'hidden'\] \}\)/);
  assert.match(injection, /timeoutId = setTimeout\(\(\) => \{/);
  assert.match(injection, /waitForNextFrameDelay\(250\)/);
  assert.match(injection, /pendingDropdownFetches\.set\(dropdown, \{/);
  assert.match(injection, /channelInfoPromise: fetchPromise/);
  assert.match(injection, /collaboratorPromise: collaboratorEnrichmentPromise/);
  assert.match(injection, /initialChannelInfo: initialChannelInfo/);
  assert.match(injection, /pendingDropdownFetches\.get\(dropdown\)\?\.cancelled/);
  assert.match(injection, /updateInjectedMenuChannelName\(dropdown, enrichedInfo\)/);

  assert.match(action, /titleSpan\.textContent = 'Fetching\.\.\.'/);
  assert.match(action, /menuItem\.classList\.add\('filtertube-pending'\)/);
  assert.match(action, /recordOptimisticHide/);
  assert.match(action, /restoreOptimisticHide/);
  assert.match(action, /confirmOptimisticHide/);
  assert.match(action, /let result = await addChannelDirectly/);
  assert.match(action, /setTimeout\(\(\) => \{\s*forceCloseDropdown\(successDropdown\);\s*\}, 90\)/);
  assert.match(action, /requestSettingsFromBackground\(\)/);
  assert.match(action, /applyDOMFallback\(refreshedSettings \|\| currentSettings, \{ forceReprocess: true, preserveScroll: true \}\)/);
  assert.match(action, /enrichVisibleShortsWithChannelInfo\(channelInfo\.id, refreshedSettings \|\| currentSettings\)/);
  assert.match(action, /enrichVisiblePlaylistRowsWithChannelInfo\(channelInfo\.id, refreshedSettings \|\| currentSettings\)/);
});

test('content bridge menu action future authority symbols remain absent from product runtime', () => {
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
  assert.match(text, /first-class content bridge menu action gates/);
});
