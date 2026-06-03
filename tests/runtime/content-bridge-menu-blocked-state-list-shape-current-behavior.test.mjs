import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MENU_BLOCKED_STATE_LIST_SHAPE_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/content_bridge.js': [13623, 603362, 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c']
};

const blockSpecs = {
  contentBridgeFindStoredChannelEntry: {
    file: 'js/content_bridge.js',
    start: 'function findStoredChannelEntry(channelInfo) {',
    end: 'function scheduleDropdownCleanup',
    startLine: 2079,
    lines: 16,
    bytes: 581,
    hash: 'e774f81a3dcfb0cd4830c7a06faf7c6307b2d739651c0a4d49a6b195723418ad'
  },
  contentBridgeCheckIfChannelBlocked: {
    file: 'js/content_bridge.js',
    start: 'async function checkIfChannelBlocked(channelInfo, menuItem) {',
    end: 'function markElementAsBlocked',
    startLine: 11977,
    lines: 57,
    bytes: 2949,
    hash: '232452835d96009435593a555877dea029e32b587b72c0f007d1dfc83dd31c79'
  },
  contentBridgeSyncBlockedElementsWithFilters: {
    file: 'js/content_bridge.js',
    start: 'function syncBlockedElementsWithFilters(effectiveSettings) {',
    end: '/**\n * Handle click on "Block Channel" menu item',
    startLine: 12153,
    lines: 33,
    bytes: 1521,
    hash: 'ed51361346f28f1bdf6accc4de5f5ee1625c6a921b4d0b53cc5441ca21513615'
  }
};

const selectedCounts = {
  findStoredChannelEntry: 2,
  checkIfChannelBlocked: 1,
  syncBlockedElementsWithFilters: 1,
  filterChannels: 9,
  whitelistChannels: 0,
  listMode: 0,
  channelMap: 10,
  channelMatchesFilter: 3,
  isChannelBlocked: 2,
  currentSettings: 3,
  'browserAPI_BRIDGE.storage.local.get': 1,
  filterAll: 1,
  applyFilterAllStateToToggle: 1,
  addFilterAllContentCheckbox: 1,
  querySelector: 3,
  querySelectorAll: 1,
  'data-filtertube-blocked-channel-id': 2,
  'data-filtertube-blocked-channel-handle': 2,
  'data-filtertube-blocked-channel-name': 1,
  markElementAsBlocked: 1,
  clearBlockedElementAttributes: 1,
  toggleVisibility: 3,
  isCommentContextTag: 1,
  normalizeHandleValue: 2
};

const missingRuntimeSymbols = [
  'contentBridgeMenuBlockedStateListModeContract',
  'contentBridgeMenuBlockedStateDecision',
  'contentBridgeMenuBlockedStateListTargetPolicy',
  'contentBridgeMenuStoredEntryReport',
  'contentBridgeBlockedElementSyncReport',
  'contentBridgeBlockedElementRestorePolicy',
  'contentBridgeMenuWhitelistInteractionReport',
  'contentBridgeMenuFilterAllStatePolicy',
  'contentBridgeMenuBlockedStateFixtureProvenance',
  'contentBridgeMenuBlockedStateMetricArtifact'
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

function executableSource() {
  return selectedSource();
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

class FakeTitle {
  constructor() {
    this.textContent = '';
    this.style = {};
  }
}

class FakeMenuItem {
  constructor() {
    this.title = new FakeTitle();
    this.toggle = { state: null };
    this.style = {};
    this.addedCheckboxes = [];
  }

  querySelector(selector) {
    if (selector === '.filtertube-menu-title') return this.title;
    if (selector === '.filtertube-filter-all-toggle') return this.toggle;
    return null;
  }
}

class FakeElement {
  constructor(attrs = {}, tagName = 'YTD-RICH-ITEM-RENDERER') {
    this.attrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.tagName = tagName;
    this.marked = [];
    this.cleared = 0;
    this.visibility = [];
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }
}

function loadMenuStateRuntime({
  currentSettings = {},
  storageResult = { filterChannels: [], channelMap: {} },
  useSharedIdentity = true,
  blockedElements = []
} = {}) {
  const storageGets = [];
  const appliedFilterAll = [];
  const addedCheckboxes = [];
  const toggles = [];
  const marks = [];
  const clears = [];
  const context = {
    __storageGets: storageGets,
    __appliedFilterAll: appliedFilterAll,
    __addedCheckboxes: addedCheckboxes,
    __toggles: toggles,
    __marks: marks,
    __clears: clears,
    currentSettings,
    console: { log() {}, warn() {}, error() {} },
    filterTubeDebugLog() {},
    browserAPI_BRIDGE: {
      storage: {
        local: {
          async get(keys) {
            storageGets.push(keys);
            return plain(storageResult);
          }
        }
      }
    },
    document: {
      querySelectorAll(selector) {
        context.__lastSelector = selector;
        return blockedElements;
      }
    },
    window: {},
    JSON,
    Map,
    Set,
    Array,
    Math,
    Number,
    String,
    Boolean,
    RegExp,
    parseInt,
    isNaN
  };

  const sharedIdentity = {
    channelMatchesFilter(meta, filterChannel, channelMap = {}) {
      const metaHandle = normalizeHandleForHarness(meta.handle || '');
      const filterHandle = normalizeHandleForHarness(filterChannel.handle || '');
      const metaId = String(meta.id || '').toLowerCase();
      const filterId = String(filterChannel.id || '').toLowerCase();
      const mappedId = metaHandle ? channelMap[metaHandle] : '';
      return Boolean(
        (metaHandle && filterHandle && metaHandle === filterHandle) ||
        (metaId && filterId && metaId === filterId) ||
        (mappedId && filterId && String(mappedId).toLowerCase() === filterId)
      );
    },
    isChannelBlocked(channels, channelInfo, channelMap = {}) {
      return (Array.isArray(channels) ? channels : []).some((channel) => sharedIdentity.channelMatchesFilter(channelInfo, channel, channelMap));
    }
  };
  if (useSharedIdentity) {
    context.window.FilterTubeIdentity = sharedIdentity;
  }

  context.globalThis = context;

  const harness = `
    function normalizeHandleValue(value = '') {
      const cleaned = String(value || '').trim();
      if (!cleaned) return '';
      return cleaned.startsWith('@') ? cleaned : '@' + cleaned.replace(/^\\/+/, '');
    }

    function applyFilterAllStateToToggle(toggle, filterAll) {
      globalThis.__appliedFilterAll.push(Boolean(filterAll));
      if (toggle) toggle.state = Boolean(filterAll);
    }

    function addFilterAllContentCheckbox(menuItem, storedEntry) {
      globalThis.__addedCheckboxes.push(JSON.parse(JSON.stringify(storedEntry || {})));
      if (menuItem?.addedCheckboxes) menuItem.addedCheckboxes.push(storedEntry);
    }

    function markElementAsBlocked(element, meta, state = 'pending') {
      globalThis.__marks.push({ meta: JSON.parse(JSON.stringify(meta)), state });
      element.marked.push({ meta, state });
    }

    function clearBlockedElementAttributes(element) {
      globalThis.__clears.push(JSON.parse(JSON.stringify({
        id: element.getAttribute('data-filtertube-blocked-channel-id') || '',
        handle: element.getAttribute('data-filtertube-blocked-channel-handle') || ''
      })));
      element.cleared += 1;
      element.removeAttribute('data-filtertube-blocked-channel-id');
      element.removeAttribute('data-filtertube-blocked-channel-handle');
      element.removeAttribute('data-filtertube-blocked-channel-name');
    }

    function toggleVisibility(element, hidden, reason = '', restoring = false) {
      globalThis.__toggles.push({ hidden, reason, restoring });
      element.visibility.push({ hidden, reason, restoring });
    }

    function isCommentContextTag(tag = '') {
      return String(tag || '').includes('comment');
    }

    function channelMatchesFilter(meta, filterChannel, channelMap = {}) {
      const metaHandle = normalizeHandleValue(meta.handle || '').toLowerCase();
      const filterHandle = normalizeHandleValue(filterChannel.handle || '').toLowerCase();
      const metaId = String(meta.id || '').toLowerCase();
      const filterId = String(filterChannel.id || '').toLowerCase();
      const mappedId = metaHandle ? channelMap[metaHandle] : '';
      return Boolean(
        (metaHandle && filterHandle && metaHandle === filterHandle) ||
        (metaId && filterId && metaId === filterId) ||
        (mappedId && filterId && String(mappedId).toLowerCase() === filterId)
      );
    }

    ${executableSource()}

    globalThis.__exports = {
      findStoredChannelEntry,
      checkIfChannelBlocked,
      syncBlockedElementsWithFilters
    };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context);
  return {
    exports: context.__exports,
    storageGets,
    appliedFilterAll,
    addedCheckboxes,
    toggles,
    marks,
    clears,
    context
  };
}

function normalizeHandleForHarness(value = '') {
  const cleaned = String(value || '').trim();
  if (!cleaned) return '';
  return (cleaned.startsWith('@') ? cleaned : '@' + cleaned.replace(/^\/+/, '')).toLowerCase();
}

test('menu blocked-state list-shape audit is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /This is not an implementation patch/);
  assert.match(text, /not completion proof for menu blocked-state authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.ok(text.includes(`\`${file}\``), `doc should cite ${file}`);
  }
});

test('menu blocked-state source and effect blocks remain pinned', () => {
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

test('menu blocked-state token counts remain pinned', () => {
  const text = doc();
  const source = selectedSource();

  for (const [literal, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, literal), expected, `${literal} count changed`);
    assert.match(text, new RegExp(`\\\`${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\` \\\\| ${expected}`));
  }
});

test('menu blocked-state missing future symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(runtime.includes(symbol), false, `${symbol} unexpectedly exists in product runtime`);
    assert.ok(text.includes(`\`${symbol}\``), `doc should list missing future symbol ${symbol}`);
  }
});

test('findStoredChannelEntry reads currentSettings.filterChannels only', () => {
  const stored = { handle: '@alice', id: 'UCALICE123456789012345', name: 'Alice', filterAll: true };
  const runtime = loadMenuStateRuntime({
    currentSettings: {
      listMode: 'whitelist',
      filterChannels: [stored],
      whitelistChannels: [{ handle: '@bob', id: 'UCBOB12345678901234567' }]
    }
  });

  assert.deepEqual(runtime.exports.findStoredChannelEntry({ handle: '@alice' }), stored);
  assert.equal(runtime.exports.findStoredChannelEntry({ handle: '@bob' }), null);
});

test('findStoredChannelEntry returns null without filterChannels even when whitelist fields exist', () => {
  const runtime = loadMenuStateRuntime({
    currentSettings: {
      listMode: 'whitelist',
      whitelistChannels: [{ handle: '@alice', id: 'UCALICE123456789012345' }]
    }
  });

  assert.equal(runtime.exports.findStoredChannelEntry({ handle: '@alice' }), null);
});

test('checkIfChannelBlocked uses storage filterChannels and shared identity to disable menu state', async () => {
  const stored = { handle: '@alice', id: 'UCALICE123456789012345', name: 'Alice', filterAll: true };
  const menuItem = new FakeMenuItem();
  const runtime = loadMenuStateRuntime({
    currentSettings: { filterChannels: [stored], listMode: 'whitelist', whitelistChannels: [] },
    storageResult: {
      filterChannels: [stored],
      channelMap: {}
    }
  });

  await runtime.exports.checkIfChannelBlocked({ handle: '@alice', id: 'UCALICE123456789012345' }, menuItem);

  assert.deepEqual(plain(runtime.storageGets), [['filterChannels', 'channelMap']]);
  assert.equal(menuItem.title.textContent, '✓ Channel Blocked');
  assert.equal(menuItem.title.style.color, '#10b981');
  assert.equal(menuItem.style.pointerEvents, 'none');
  assert.deepEqual(plain(runtime.appliedFilterAll), [true]);
  assert.deepEqual(plain(runtime.addedCheckboxes), [stored]);
});

test('checkIfChannelBlocked fallback matching works without shared identity helpers', async () => {
  const menuItem = new FakeMenuItem();
  const runtime = loadMenuStateRuntime({
    useSharedIdentity: false,
    currentSettings: { filterChannels: [] },
    storageResult: {
      filterChannels: [{ handle: '@alice', id: 'UCALICE123456789012345', filterAll: false }],
      channelMap: {}
    }
  });

  await runtime.exports.checkIfChannelBlocked({ handle: 'alice' }, menuItem);

  assert.equal(menuItem.title.textContent, '✓ Channel Blocked');
  assert.equal(menuItem.style.pointerEvents, 'none');
  assert.deepEqual(plain(runtime.appliedFilterAll), [false]);
  assert.deepEqual(plain(runtime.addedCheckboxes), [{ handle: '@alice', id: 'UCALICE123456789012345', filterAll: false }]);
});

test('syncBlockedElementsWithFilters keeps still-blocked elements hidden', () => {
  const element = new FakeElement({
    'data-filtertube-blocked-channel-id': 'UCALICE123456789012345',
    'data-filtertube-blocked-channel-handle': '@alice',
    'data-filtertube-blocked-channel-name': 'Alice'
  });
  const runtime = loadMenuStateRuntime({ blockedElements: [element] });

  runtime.exports.syncBlockedElementsWithFilters({
    filterChannels: [{ handle: '@alice', id: 'UCALICE123456789012345' }],
    channelMap: {}
  });

  assert.deepEqual(plain(runtime.marks), [{
    meta: { id: 'UCALICE123456789012345', handle: '@alice', name: 'Alice' },
    state: 'confirmed'
  }]);
  assert.deepEqual(plain(runtime.toggles), [{
    hidden: true,
    reason: 'Blocked channel: @alice',
    restoring: false
  }]);
  assert.equal(element.cleared, 0);
});

test('syncBlockedElementsWithFilters clears stale blocked attrs and restores visibility when filterChannels is empty', () => {
  const element = new FakeElement({
    'data-filtertube-blocked-channel-id': 'UCALICE123456789012345',
    'data-filtertube-blocked-channel-handle': '@alice',
    'data-filtertube-blocked-channel-name': 'Alice'
  });
  const runtime = loadMenuStateRuntime({ blockedElements: [element] });

  runtime.exports.syncBlockedElementsWithFilters({
    filterChannels: [],
    whitelistChannels: [{ handle: '@alice', id: 'UCALICE123456789012345' }],
    listMode: 'whitelist',
    channelMap: {}
  });

  assert.deepEqual(plain(runtime.marks), []);
  assert.deepEqual(plain(runtime.clears), [{ id: 'UCALICE123456789012345', handle: '@alice' }]);
  assert.deepEqual(plain(runtime.toggles), [{
    hidden: false,
    reason: '',
    restoring: true
  }]);
  assert.equal(element.getAttribute('data-filtertube-blocked-channel-id'), null);
});

test('menu blocked-state audit doc records runtime fixture behavior and open gates', () => {
  const text = doc();

  assert.match(text, /`findStoredChannelEntry\(\)` returns entries from `currentSettings\.filterChannels`/);
  assert.match(text, /does not inspect whitelist arrays/);
  assert.match(text, /returns `null` when `currentSettings\.filterChannels` is absent/);
  assert.match(text, /`checkIfChannelBlocked\(\)` reads only `filterChannels` and `channelMap` from storage/);
  assert.match(text, /fallback matching works by normalized handle or exact id/);
  assert.match(text, /`syncBlockedElementsWithFilters\(\)` keeps stamped blocked elements hidden/);
  assert.match(text, /clears blocked attrs and restores visibility when no `filterChannels` entry remains/);
  assert.match(text, /9 `filterChannels` tokens, 0 `whitelistChannels` tokens, and 0 `listMode` tokens/);
  assert.match(text, /This slice does not close the audit rows/);
  assert.match(text, /menu blocked-state contracts/);
  assert.match(text, /list target policies/);
  assert.match(text, /whitelist\/list-mode reports/);
  assert.match(text, /blocked-element sync reports/);
  assert.match(text, /first-class menu blocked-state gates/);
});
