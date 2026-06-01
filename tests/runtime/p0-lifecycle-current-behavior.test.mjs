import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

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

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

const lifecycleFixtures = [
  'quick_block_disabled_zero_lifecycle_work',
  'menu_disabled_zero_fallback_insertion',
  'native_overlay_quiet_mode_pauses_runtime',
  'fullscreen_pauses_non_player_runtime',
  'navigation_disconnects_route_observers'
];

const domLifecycleReadinessDocs = [
  'docs/audit/FILTERTUBE_DOCUMENT_START_ZERO_FLASH_BOUNDARY_2026-05-21.md',
  'docs/audit/FILTERTUBE_DOMS_HTML_MUTATED_MAIN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_DOM_FALLBACK_SELECTOR_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md',
  'docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

test('P0 lifecycle audit documents current behavior and future lifecycle contract', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  for (const fixture of lifecycleFixtures) {
    assert.ok(doc.includes(fixture), `missing lifecycle fixture ${fixture}`);
    assert.ok(p0Register.includes(fixture), `fixture must remain in P0 register ${fixture}`);
  }

  for (const phrase of [
    'lifecycle owner id exists',
    'compiled active-state predicate exists',
    'native overlay pause reason exists',
    'fullscreen pause reason exists',
    'disabled quick-block lifecycle count: 0',
    'disabled fallback-menu insertion count: 0',
    'P0 lifecycle family is partially green'
  ]) {
    assert.ok(doc.includes(phrase), `missing lifecycle contract phrase ${phrase}`);
  }
});

test('DOM lifecycle and runtime observer docs carry the method proof gap blocker', () => {
  for (const docPath of domLifecycleReadinessDocs) {
    const doc = read(docPath);

    assert.ok(doc.includes('## Method Semantic Proof Gap Boundary'), `${docPath} missing method proof gap section`);
    assert.ok(doc.includes(methodGapPath), `${docPath} missing method proof gap source path`);
    assert.match(doc, /method semantic proof gap files covered: 69/, `${docPath} missing file count`);
    assert.match(doc, /method semantic proof gap lexical callables covered: 5681/, `${docPath} missing callable count`);
    assert.match(doc, /files with complete per-callable semantic proof: 0/, `${docPath} missing complete proof count`);
    assert.match(doc, /lexical callables requiring semantic proof before behavior changes: 5681/, `${docPath} missing required proof count`);
    assert.match(doc, /affected callable semantic proof: NO-GO/, `${docPath} missing callable NO-GO`);
    assert.match(doc, /runtime behavior changed: no/, `${docPath} missing runtime unchanged boundary`);
    assert.match(doc, /do not approve runtime optimization/, `${docPath} missing audit-only approval warning`);
    assert.match(doc, /JSON-first behavior/, `${docPath} missing JSON-first blocker`);
    assert.match(doc, /lifecycle cleanup/, `${docPath} missing lifecycle blocker`);
    assert.match(doc, /whitelist behavior changes/, `${docPath} missing whitelist blocker`);
  }
});

test('quick_block_disabled_zero_lifecycle_work is satisfied at setup entry by current behavior', () => {
  const text = read('js/content/block_channel.js');
  const block = sliceBetween(text, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');

  const enabledGuardIndex = block.indexOf('if (!isQuickBlockEnabled()) return false;');
  assert.notEqual(enabledGuardIndex, -1, 'quick block has an entry guard');
  assert.ok(enabledGuardIndex < block.indexOf('ensureQuickBlockStyles();'), 'entry guard runs before style injection');

  for (const lifecycleToken of [
    'ensureQuickBlockStyles();',
    "document.addEventListener('focusin'",
    "document.addEventListener('input'",
    "document.addEventListener('click'",
    "document.addEventListener('scroll'",
    "window.addEventListener('resize'",
    "window.addEventListener('orientationchange'",
    'new MutationObserver',
    "document.addEventListener('yt-navigate-finish'"
  ]) {
    const index = block.indexOf(lifecycleToken);
    assert.notEqual(index, -1, `missing quick-block lifecycle token ${lifecycleToken}`);
    assert.ok(index > enabledGuardIndex, `${lifecycleToken} should be after the entry enabled guard in current behavior`);
  }

  assert.doesNotMatch(block, /clearInterval/);
  assert.match(block, /removeEventListener\('pointermove'/);
});

test('quick_block_disabled_zero_lifecycle_work source budget is pinned', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md');
  const block = sliceBetween(
    read('js/content/block_channel.js'),
    'function setupQuickBlockObserver() {',
    'function setupMenuObserver() {'
  );

  const budget = {
    docListeners: count(block, /document\.addEventListener\(/g),
    winListeners: count(block, /window\.addEventListener\(/g),
    mutationObservers: count(block, /new MutationObserver/g),
    intervals: count(block, /setInterval/g),
    timeouts: count(block, /setTimeout/g),
    rafCallbacks: count(block, /requestAnimationFrame/g),
    querySelectorAll: count(block, /querySelectorAll/g),
    removeListeners: count(block, /removeEventListener/g),
    disconnects: count(block, /\.disconnect\(/g)
  };

  assert.deepEqual(budget, {
    docListeners: 9,
    winListeners: 3,
    mutationObservers: 1,
    intervals: 0,
    timeouts: 3,
    rafCallbacks: 1,
    querySelectorAll: 1,
    removeListeners: 1,
    disconnects: 0
  });
  assert.ok(doc.includes('| `setupQuickBlockObserver()` | 9 | 3 | 1 | 0 | 3 | 1 | 1 `querySelectorAll` | 1 `removeEventListener`, 0 `disconnect` |'));
});

test('menu_disabled_zero_fallback_insertion is not satisfied by current behavior', () => {
  const text = read('js/content_bridge.js');
  const block = sliceBetween(text, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  for (const token of [
    "const styleId = 'filtertube-fallback-menu-style'",
    'style.id = styleId',
    'appendChild(style)',
    'const observer = new MutationObserver',
    "document.addEventListener('yt-navigate-finish'",
    "document.addEventListener('click'",
    "window.addEventListener('scroll'",
    'const warmupTimer = setInterval',
    'querySelectorAll(fallbackMenuCardSelector)'
  ]) {
    assert.match(block, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(block, /showBlockMenuItem/);
  assert.doesNotMatch(block, /listMode\s*===\s*['"]whitelist['"]/);
  assert.doesNotMatch(block, /observer\.disconnect\(\)/);
});

test('menu_disabled_zero_fallback_insertion source budget is pinned', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_LIFECYCLE_CURRENT_BEHAVIOR_2026-05-18.md');
  const block = sliceBetween(
    read('js/content_bridge.js'),
    'function ensureFallbackMenuButtons() {',
    'let playlistFallbackPopoverState = null;'
  );

  const budget = {
    docListeners: count(block, /document\.addEventListener\(/g),
    winListeners: count(block, /window\.addEventListener\(/g),
    mutationObservers: count(block, /new MutationObserver/g),
    intervals: count(block, /setInterval/g),
    timeouts: count(block, /setTimeout/g),
    rafCallbacks: count(block, /requestAnimationFrame/g),
    querySelectorAll: count(block, /querySelectorAll/g),
    querySelector: count(block, /querySelector\(/g),
    removeListeners: count(block, /removeEventListener/g),
    disconnects: count(block, /\.disconnect\(/g)
  };

  assert.deepEqual(budget, {
    docListeners: 5,
    winListeners: 1,
    mutationObservers: 1,
    intervals: 1,
    timeouts: 4,
    rafCallbacks: 2,
    querySelectorAll: 4,
    querySelector: 23,
    removeListeners: 0,
    disconnects: 0
  });
  assert.ok(doc.includes('| `ensureFallbackMenuButtons()` | 5 | 1 | 1 | 1 | 4 | 2 | 4 `querySelectorAll`, 23 `querySelector` | 0 `removeEventListener`, 0 `disconnect` |'));
});

test('native_overlay_quiet_mode_pauses_runtime is only partial in current behavior', () => {
  const bridge = read('js/content_bridge.js');
  const quickBlock = sliceBetween(
    read('js/content/block_channel.js'),
    'function setupQuickBlockObserver() {',
    'function setupMenuObserver() {'
  );
  const domFallback = read('js/content/dom_fallback.js');

  assert.match(bridge, /function isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.match(bridge, /data-filtertube-native-overlay-covered/);
  assert.match(bridge, /data-filtertube-native-fullscreen/);
  assert.match(bridge, /__filterTubeNativeOverlayCovered/);
  assert.match(bridge, /__filterTubeNativeFullscreenActive/);

  assert.doesNotMatch(quickBlock, /isFilterTubeNativeOverlayQuietMode/);
  assert.doesNotMatch(quickBlock, /data-filtertube-native-/);
  assert.doesNotMatch(domFallback, /isFilterTubeNativeOverlayQuietMode/);
});

test('fullscreen_pauses_non_player_runtime is not satisfied by current behavior', () => {
  const pageRuntime = [
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/collab_dialog.js'
  ].map(read).join('\n');
  const quickBlock = sliceBetween(
    read('js/content/block_channel.js'),
    'function setupQuickBlockObserver() {',
    'function setupMenuObserver() {'
  );
  const fallbackMenu = sliceBetween(
    read('js/content_bridge.js'),
    'function ensureFallbackMenuButtons() {',
    'let playlistFallbackPopoverState = null;'
  );

  assert.doesNotMatch(pageRuntime, /lifecycleRegistry|registerLifecycle|fullscreenPause|pauseNonPlayer|nonPlayerRuntime/);
  assert.doesNotMatch(quickBlock, /fullscreenElement|ytp-fullscreen|data-filtertube-native-fullscreen/);
  assert.match(fallbackMenu, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.doesNotMatch(fallbackMenu, /document\.fullscreenElement|ytp-fullscreen/);
});

test('navigation_disconnects_route_observers is not satisfied by current behavior', () => {
  const bridge = read('js/content_bridge.js');
  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');
  const quickBlock = sliceBetween(read('js/content/block_channel.js'), 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');
  const collab = read('js/content/collab_dialog.js');

  assert.match(bridge, /document\.addEventListener\('yt-navigate-finish'/);
  assert.ok(count(bridge, /observer\.disconnect\(\)/g) > 0, 'some bridge observers disconnect today');

  assert.match(fallbackMenu, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallbackMenu, /observer\.observe\(target, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(fallbackMenu, /observer\.disconnect\(\)/);
  assert.doesNotMatch(fallbackMenu, /removeEventListener/);

  assert.match(quickBlock, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(quickBlock, /yt-navigate-finish/);
  assert.doesNotMatch(quickBlock, /observer\.disconnect\(\)/);

  assert.match(collab, /collabDialogObserver = new MutationObserver/);
  assert.equal(count(collab, /removeEventListener/g), 2);
  assert.equal(count(collab, /collabDialogObserver\?\.disconnect\?\.\(\)/g), 1);
});
