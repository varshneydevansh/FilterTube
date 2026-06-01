import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const sideEffectOwnershipDocs = [
  docPath,
  'docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_HIDE_RESTORE_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_CSS_STYLE_HIDE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_DOM_FALLBACK_RUN_STATE_VISIBILITY_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_ENGAGEMENT_BUDGET_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_ENGAGEMENT_SIDE_EFFECT_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_STATS_TIME_SAVED_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_STATS_SURFACE_LEGACY_METRIC_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md'
];

const pageRuntimeFiles = [
  'js/content/dom_helpers.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content_bridge.js'
];

const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];

const providerLoadOrder = {
  helper: 'js/content/dom_helpers.js',
  extractor: 'js/content/dom_extractors.js',
  bridge: 'js/content_bridge.js'
};

const expectedRefs = [
  'js/content/dom_helpers.js:91',
  'js/content/dom_fallback.js:1424',
  'js/content/dom_fallback.js:2184',
  'js/content/dom_fallback.js:2206',
  'js/content/dom_fallback.js:2212',
  'js/content/dom_fallback.js:2224',
  'js/content/dom_fallback.js:2237',
  'js/content/dom_fallback.js:2264',
  'js/content/dom_fallback.js:2269',
  'js/content/dom_fallback.js:2274',
  'js/content/dom_fallback.js:2286',
  'js/content/block_channel.js:1733',
  'js/content_bridge.js:509',
  'js/content_bridge.js:558',
  'js/content_bridge.js:6301',
  'js/content_bridge.js:7436',
  'js/content_bridge.js:8421',
  'js/content_bridge.js:8540',
  'js/content_bridge.js:12228',
  'js/content_bridge.js:12280',
  'js/content_bridge.js:12536',
  'js/content_bridge.js:13272',
  'js/content_bridge.js:13289'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function helperStackForManifest(file) {
  const manifest = readJson(file);
  const entry = (manifest.content_scripts || []).find((contentScript) => {
    const scripts = contentScript.js || [];
    return scripts.includes(providerLoadOrder.helper) &&
      scripts.includes(providerLoadOrder.extractor) &&
      scripts.includes(providerLoadOrder.bridge);
  });

  assert.ok(entry, `${file} missing shared helper provider stack`);
  return entry.js || [];
}

function providerLoadOrderRows() {
  return manifestFiles.map((file) => {
    const scripts = helperStackForManifest(file);
    return {
      file,
      helperIndex: scripts.indexOf(providerLoadOrder.helper),
      extractorIndex: scripts.indexOf(providerLoadOrder.extractor),
      bridgeIndex: scripts.indexOf(providerLoadOrder.bridge)
    };
  });
}

function manifestDocPositionRows(doc) {
  const rows = new Map();
  const manifestPositionRowPattern =
    /^\| `([^`]+)` \| [^|]+ \| (\d+) \| (\d+) \| (\d+) \| [^|]+ \|$/;

  for (const line of doc.split(/\r?\n/)) {
    const match = line.match(manifestPositionRowPattern);
    if (!match) continue;
    rows.set(match[1], {
      helperIndex: Number(match[2]),
      extractorIndex: Number(match[3]),
      bridgeIndex: Number(match[4])
    });
  }

  return rows;
}

function directDisplayNoneRefs() {
  const refs = [];
  const directDisplayPattern = /style\.display\s*=\s*['"]none['"]|style\.setProperty\(['"]display['"],\s*['"]none['"]/;

  for (const file of pageRuntimeFiles) {
    const lines = read(file).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (directDisplayPattern.test(line)) {
        refs.push(`${file}:${index + 1}`);
      }
    });
  }

  return refs;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function countMatches(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function createFakeElement({ hidden = false, whitelistPending = false } = {}) {
  const classes = new Set(hidden ? ['filtertube-hidden'] : []);
  const attrs = new Map();
  const styleOps = [];

  if (hidden) attrs.set('data-filtertube-hidden', 'true');
  if (whitelistPending) attrs.set('data-filtertube-whitelist-pending', 'true');

  return {
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name)
    },
    getAttribute: (name) => attrs.has(name) ? attrs.get(name) : null,
    setAttribute: (name, value) => attrs.set(name, String(value)),
    removeAttribute: (name) => attrs.delete(name),
    hasAttribute: (name) => attrs.has(name),
    style: {
      setProperty: (...args) => styleOps.push(['setProperty', ...args]),
      removeProperty: (...args) => styleOps.push(['removeProperty', ...args])
    },
    querySelectorAll: () => [],
    __classes: classes,
    __attrs: attrs,
    __styleOps: styleOps
  };
}

function runDomHelpersContext(overrides = {}) {
  const context = {
    console,
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, textContent: '' }),
      head: { appendChild: () => {} }
    },
    ...overrides
  };
  vm.createContext(context);
  vm.runInContext(read('js/content/dom_helpers.js'), context);
  assert.equal(typeof context.toggleVisibility, 'function');
  return context;
}

test('direct hide writer register is audit-only and names the missing authority', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /wrong decision\s+-> wrong DOM target\s+-> wrong visual writer \/ missing restore owner/);
  assert.match(doc, /hideWriterRegistry/);
  assert.match(doc, /hideRestoreAuthority/);
  assert.match(doc, /Shared Helper External Dependency Boundary/);
  assert.match(doc, /external shared-helper dependency symbols: 5/);
  assert.match(doc, /external shared-helper side-effect callsites: 9/);
  assert.match(doc, /skipStats-guarded stats\/tracker callsites: 5/);
  assert.match(doc, /skipStats-unguarded media callsites: 2/);
  assert.match(doc, /provider guard checks in toggleVisibility: 0/);
  assert.match(doc, /provider try\/catch wrappers in toggleVisibility: 0/);
  assert.match(doc, /Current manifest provider load-order boundary/);
  assert.match(doc, /manifest helper-stack rows checked: 4/);
  assert.match(doc, /manifest rows with dom_helpers before dom_extractors: 4/);
  assert.match(doc, /manifest rows with dom_extractors before content_bridge: 4/);
  assert.match(doc, /manifest rows with dom_helpers before content_bridge: 4/);
  assert.match(doc, /provider symbols available from a pre-bridge provider file: 1/);
  assert.match(doc, /provider symbols defined only in content_bridge: 4/);
  assert.match(doc, /call-time provider authority: absent/);
  assert.match(doc, /missing-provider scenarios pinned: 4/);
  assert.match(doc, /missing-provider paths that mutate before throwing: 3/);
  assert.match(doc, /missing-provider paths that throw before visual mutation: 1/);
  assert.match(doc, /sharedHideSideEffectAuthority/);
  assert.match(doc, /implementation blockers, not cleanup permission/);
});

test('side-effect ownership docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5681',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5681',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of sideEffectOwnershipDocs) {
    const text = read(auditDoc);

    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5681',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5681',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'JSON-first promotion',
      'optimization',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('direct hide writer register enumerates every active page-runtime display-none writer', () => {
  const doc = read(docPath);
  const refs = directDisplayNoneRefs();

  assert.deepEqual(refs, expectedRefs);
  assert.equal(refs.length, 23);

  for (const ref of expectedRefs) {
    assert.ok(doc.includes(ref), `register missing direct hide writer ref ${ref}`);
  }

  for (const count of [
    '| `js/content/dom_helpers.js` | 1 |',
    '| `js/content/dom_fallback.js` | 10 |',
    '| `js/content/block_channel.js` | 1 |',
    '| `js/content_bridge.js` | 11 |',
    '| **Total** | **23** |'
  ]) {
    assert.ok(doc.includes(count), `missing count row ${count}`);
  }
});

test('direct hide writer register separates shell cleanup broad fallback pending user action and enrichment classes', () => {
  const doc = read(docPath);

  for (const className of [
    'Shared helper',
    'Shell/menu cleanup',
    'Broad-control fallback',
    'Pending identity',
    'User-action optimistic/confirmed hide',
    'Post-action enrichment hide'
  ]) {
    assert.ok(doc.includes(className), `missing risk class ${className}`);
  }

  assert.match(doc, /Whitelist fail-closed can be correct, but needs identity outcome and TTL proof/);
  assert.match(doc, /Successful channel block can hide additional visible Shorts\/playlist rows/);
  assert.match(doc, /These should not count as content filtering, but no shared policy says that/);
});

test('direct hide writer register is backed by current source snippets for each writer family', () => {
  const doc = read(docPath);
  const helpers = read('js/content/dom_helpers.js');
  const extractors = read('js/content/dom_extractors.js');
  const fallback = read('js/content/dom_fallback.js');
  const quick = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');

  const toggle = sliceBetween(helpers, 'function toggleVisibility', '/**\n * Recursively checks');
  const openApp = sliceBetween(fallback, 'function hideYouTubeOpenAppButtons()', 'function normalizeTextForMatching');
  const members = sliceBetween(fallback, 'if (effectiveSettings.hideMembersOnly) {', '        if (effectiveSettings.hidePlaylistCards) {');
  const playlists = sliceBetween(fallback, 'if (effectiveSettings.hidePlaylistCards) {', '        if (effectiveSettings.hideMixPlaylists) {');
  const quickHide = sliceBetween(quick, 'function applyQuickBlockImmediateHide', 'async function runQuickBlockAction');
  const pendingWhitelist = sliceBetween(bridge, 'function applyWhitelistPendingHide', '        function fallbackRelevantSelector()');
  const fallbackMenu = sliceBetween(bridge, 'const performBlock = async (channelInfo, filterAll) => {', '        try {\n            if (channelInfo?.isBlockAllOption');
  const playlistEnrichment = sliceBetween(bridge, 'const hideRow = (row, info = {}) => {', 'for (const row of rows)');
  const optimistic = sliceBetween(bridge, 'const optimisticHideState = []', "    let requestedHandle = '';");
  const immediate = sliceBetween(bridge, 'if (!didOptimisticHide) {', '        const successDropdown = dropdown || menuItem.closest');

  assert.match(toggle, /style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(toggle, /filteringTracker\.recordHide/);
  assert.match(toggle, /handleMediaPlayback\(element, true\)/);
  assert.equal(countMatches(toggle, /filteringTracker\.(?:recordHide|recordRestore)/g), 3);
  assert.equal(countMatches(toggle, /incrementHiddenStats\(element\)/g), 2);
  assert.equal(countMatches(toggle, /extractVideoDuration\(element\)/g), 1);
  assert.equal(countMatches(toggle, /decrementHiddenStats\(element\)/g), 1);
  assert.equal(countMatches(toggle, /handleMediaPlayback\(element, (?:true|false)\)/g), 2);
  assert.equal(countMatches(toggle, /typeof\s+(?:filteringTracker|incrementHiddenStats|extractVideoDuration|decrementHiddenStats|handleMediaPlayback)/g), 0);
  assert.equal(countMatches(toggle, /try\s*\{/g), 2);
  assert.equal(countMatches(toggle, /catch\s*\(e\)/g), 2);
  assert.match(bridge, /let filteringTracker = \{/);
  assert.match(bridge, /window\.filteringTracker = filteringTracker;/);
  assert.match(bridge, /function incrementHiddenStats\(element\)/);
  assert.match(bridge, /function decrementHiddenStats\(element\)/);
  assert.match(bridge, /function handleMediaPlayback\(element, shouldHide\)/);
  assert.match(extractors, /function extractVideoDuration\(element\)/);
  assert.match(openApp, /data-filtertube-hidden-open-app/);
  assert.match(members, /data-filtertube-members-only-hidden/);
  assert.match(playlists, /lockup\.style\.setProperty\('display', 'none', 'important'\)/);
  assert.match(quickHide, /targetToHide\.style\.display = 'none'/);
  assert.match(pendingWhitelist, /data-filtertube-whitelist-pending/);
  assert.match(fallbackMenu, /row\.style\.display = 'none'/);
  assert.match(playlistEnrichment, /data-filtertube-hidden-by-playlist-enrichment/);
  assert.match(optimistic, /optimisticHideState/);
  assert.match(optimistic, /restoreOptimisticHide/);
  assert.match(immediate, /commentTarget\.style\.display = 'none'/);
  assert.match(immediate, /containerToHide\.style\.display = 'none'/);

  const loadOrderRows = providerLoadOrderRows();
  const docPositionRows = manifestDocPositionRows(doc);
  assert.equal(loadOrderRows.length, 4);
  assert.equal(docPositionRows.size, 4);
  assert.equal(loadOrderRows.filter((row) => row.helperIndex < row.extractorIndex).length, 4);
  assert.equal(loadOrderRows.filter((row) => row.extractorIndex < row.bridgeIndex).length, 4);
  assert.equal(loadOrderRows.filter((row) => row.helperIndex < row.bridgeIndex).length, 4);

  for (const row of loadOrderRows) {
    assert.deepEqual(
      docPositionRows.get(row.file),
      {
        helperIndex: row.helperIndex,
        extractorIndex: row.extractorIndex,
        bridgeIndex: row.bridgeIndex
      },
      `${row.file} manifest helper stack index docs drifted`
    );
    assert.ok(doc.includes(`| \`${row.file}\` |`), `doc missing manifest row ${row.file}`);
  }

  const noProviders = runDomHelpersContext();
  const beforeMutation = createFakeElement();

  assert.throws(
    () => noProviders.toggleVisibility(beforeMutation, true, 'missing duration', false),
    /extractVideoDuration is not defined/
  );
  assert.equal(beforeMutation.__classes.has('filtertube-hidden'), false);
  assert.equal(beforeMutation.__attrs.has('data-filtertube-hidden'), false);
  assert.deepEqual(beforeMutation.__styleOps, []);

  const missingTracker = runDomHelpersContext({
    extractVideoDuration: () => 42
  });
  const hiddenBeforeTrackerThrow = createFakeElement();
  assert.throws(
    () => missingTracker.toggleVisibility(hiddenBeforeTrackerThrow, true, 'missing tracker', false),
    /filteringTracker is not defined/
  );
  assert.equal(hiddenBeforeTrackerThrow.__classes.has('filtertube-hidden'), true);
  assert.equal(hiddenBeforeTrackerThrow.__attrs.get('data-filtertube-hidden'), 'true');
  assert.deepEqual(hiddenBeforeTrackerThrow.__styleOps, [['setProperty', 'display', 'none', 'important']]);

  const skipStatsMissingMedia = runDomHelpersContext();
  const hiddenBeforeMediaThrow = createFakeElement();
  assert.throws(
    () => skipStatsMissingMedia.toggleVisibility(hiddenBeforeMediaThrow, true, 'missing media', true),
    /handleMediaPlayback is not defined/
  );
  assert.equal(hiddenBeforeMediaThrow.__classes.has('filtertube-hidden'), true);
  assert.equal(hiddenBeforeMediaThrow.__attrs.get('data-filtertube-hidden'), 'true');
  assert.deepEqual(hiddenBeforeMediaThrow.__styleOps, [['setProperty', 'display', 'none', 'important']]);

  const restoredBeforeMediaThrow = createFakeElement({ hidden: true });
  assert.throws(
    () => skipStatsMissingMedia.toggleVisibility(restoredBeforeMediaThrow, false, '', true),
    /handleMediaPlayback is not defined/
  );
  assert.equal(restoredBeforeMediaThrow.__classes.has('filtertube-hidden'), false);
  assert.equal(restoredBeforeMediaThrow.__attrs.has('data-filtertube-hidden'), false);
  assert.deepEqual(restoredBeforeMediaThrow.__styleOps, [['removeProperty', 'display']]);
});

test('direct hide writer register confirms runtime lacks central writer authority symbols', () => {
  const doc = read(docPath);
  const runtime = pageRuntimeFiles.map(read).join('\n');

  for (const symbol of [
    'hideWriterRegistry',
    'hideWriterDecision',
    'hideRestoreAuthority',
    'directHideWriterReport',
    'displayWriterStatsPolicy',
    'displayWriterRestoreOwner',
    'sharedHideSideEffectAuthority'
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(runtime, new RegExp(`\\b${symbol}\\b`));
  }
});
