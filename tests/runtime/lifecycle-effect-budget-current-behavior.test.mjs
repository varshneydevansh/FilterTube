import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_LIFECYCLE_EFFECT_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const lifecycleGateDocs = [
  'docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md',
  docPath,
  'docs/audit/FILTERTUBE_LIFECYCLE_OWNER_MATRIX_2026-05-18.md',
  'docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_DECISION_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md',
  'docs/audit/FILTERTUBE_REPO_LIFECYCLE_PRIMITIVE_COVERAGE_2026-05-18.md',
  'docs/audit/FILTERTUBE_PAGE_RUNTIME_LIFECYCLE_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_PAGE_RUNTIME_OWNER_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_DOM_FALLBACK_LIFECYCLE_CALLBACK_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_UI_COMPONENTS_PORTAL_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start ${startNeedle}`);
  const end = endNeedle ? text.indexOf(endNeedle, start) : text.length;
  assert.notEqual(end, -1, `missing end ${endNeedle}`);
  return text.slice(start, end);
}

test('lifecycle effect budget doc is audit-only and separates source confidence from work permission', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior audit artifact/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /source-confidence order/);
  assert.match(doc, /permission layer/);
  assert.match(doc, /do not scan, observe, patch, fetch, mutate, hide, restore, or count/);
  assert.match(doc, /Runtime behavior remains not-ready-for-lifecycle optimization/);
});

test('lifecycle and runtime-owner docs carry the method proof gap blocker', () => {
  const gapText = read(methodGapPath);
  const indexTokens = [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5681',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5681',
    'runtime behavior changed: no'
  ];
  const registerTokens = [
    'method semantic proof gap files covered: 69',
    'method semantic proof gap lexical callables covered: 5681',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5681',
    'affected callable semantic proof: NO-GO',
    'runtime behavior changed: no'
  ];

  for (const token of indexTokens) {
    assert.ok(gapText.includes(token), `method proof gap index missing ${token}`);
  }

  for (const file of lifecycleGateDocs) {
    const text = read(file);
    assert.ok(text.includes('## Method Semantic Proof Gap Boundary'), `${file} should name the method proof gap boundary`);
    assert.ok(text.includes(methodGapPath), `${file} should cite the method proof gap index`);
    for (const token of registerTokens) {
      assert.ok(text.includes(token), `${file} missing method proof gap token ${token}`);
    }
    assert.match(text, /They do not approve runtime\s+optimization, JSON-first behavior, method deletion, method merging, lifecycle\s+cleanup, no-work changes, or whitelist behavior changes\./);
  }
});

test('lifecycle effect budget doc names page-runtime lifecycle owners and allowed effects', () => {
  const doc = read(docPath);

  for (const owner of [
    'Seed transport',
    'Content bridge prefetch / hydration',
    'DOM fallback observer',
    'Fallback 3-dot menu',
    'Quick block',
    'Normal menu / Kids passive menu',
    'DOM fallback playlist guards',
    'Collaborator dialog'
  ]) {
    assert.ok(doc.includes(owner), `missing owner ${owner}`);
  }

  for (const effect of [
    'mutate JSON responses',
    'identity hydration',
    'pending whitelist evaluation',
    'button injection',
    'quick cross buttons',
    'Kids native block actions',
    'Skip hidden playlist items',
    'Capture collaborator cards'
  ]) {
    assert.ok(doc.includes(effect), `missing effect ${effect}`);
  }
});

test('runtime currently lacks shared lifecycle effect budget authority tokens', () => {
  const combined = [
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/collab_dialog.js',
    'js/injector.js'
  ].map(read).join('\n');

  for (const absent of [
    'lifecycleEffectBudget',
    'lifecycleOwnerDecision',
    'routeSurfaceLifecycleScope',
    'fullscreenPauseAuthority',
    'nativeOverlayPauseAuthority',
    'noRuleLifecycleCounter'
  ]) {
    assert.equal(combined.includes(absent), false, `${absent} should not exist in runtime source yet`);
  }
});

test('content bridge prefetch installs observer and route listeners without one lifecycle budget report', () => {
  const source = read('js/content_bridge.js');
  const prefetch = sliceBetween(source, 'function startCardPrefetchObserver() {', 'let playlistPanelPrefetchHookInstalled = false;');
  const playlistHook = sliceBetween(source, 'function installPlaylistPanelPrefetchHook() {', 'function installRightRailWhitelistObserver() {');

  assert.match(prefetch, /new IntersectionObserver/);
  assert.match(prefetch, /document\.addEventListener\('visibilitychange'/);
  assert.match(prefetch, /attachPrefetchObservers\(\)/);
  assert.match(playlistHook, /document\.addEventListener\('scroll'/);
  assert.match(playlistHook, /new MutationObserver/);
  assert.match(playlistHook, /document\.addEventListener\('yt-navigate-finish'/);
  assert.equal(prefetch.includes('lifecycleEffectBudget'), false);
  assert.equal(playlistHook.includes('lifecycleEffectBudget'), false);
});

test('fallback menu lifecycle scans broad surfaces with native-overlay quiet only as a local guard', () => {
  const source = read('js/content_bridge.js');
  const fallbackMenu = sliceBetween(source, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  for (const token of [
    'ytd-playlist-panel-video-renderer',
    'yt-lockup-view-model',
    'ytm-video-with-context-renderer',
    'ytm-shorts-lockup-view-model',
    'ytd-comment-thread-renderer',
    'ytm-comment-thread-renderer',
    'new MutationObserver',
    "document.addEventListener('yt-navigate-finish'",
    "document.addEventListener('click'",
    "window.addEventListener('scroll'",
    'const warmupTimer = setInterval'
  ]) {
    assert.ok(fallbackMenu.includes(token), `missing fallback lifecycle token ${token}`);
  }

  assert.match(fallbackMenu, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.equal(/document\.fullscreenElement|ytp-fullscreen|fullscreenPauseAuthority/.test(fallbackMenu), false);
});

test('fullscreen and native overlay pause gap is local to some owners rather than shared lifecycle authority', () => {
  const doc = read(docPath);
  const bridge = read('js/content_bridge.js');
  const quick = read('js/content/block_channel.js');
  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');
  const quickBlock = sliceBetween(quick, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');

  assert.match(doc, /Fullscreen And Native Overlay Pause Gap/);
  assert.match(doc, /some content-bridge scans quiet down\s+under native fullscreen\/overlay flags/);
  assert.match(doc, /does not yet have a\s+shared `fullscreenPauseAuthority`/);

  for (const token of [
    'window.__filterTubeNativeOverlayCovered',
    'data-filtertube-native-overlay-covered',
    'window.__filterTubeNativeFullscreenActive',
    'data-filtertube-native-fullscreen'
  ]) {
    assert.ok(bridge.includes(token), `content bridge should still check ${token}`);
  }

  assert.match(fallbackMenu, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.match(quickBlock, /window\.addEventListener\('resize'/);
  assert.match(quickBlock, /window\.addEventListener\('orientationchange'/);
  assert.match(quickBlock, /scheduleQuickBlockViewportRefresh\(\)/);
  assert.match(quick, /const isYouTubeOverlaySurfaceOpen = \(\) =>/);
  assert.match(quickBlock, /getQuickBlockSurfaceState\(\)/);
  assert.match(quickBlock, /surfaceState\.searchOpen \|\| surfaceState\.overlayOpen/);
  assert.equal(quickBlock.includes('isFilterTubeNativeOverlayQuietMode'), false);

  const combined = [bridge, quick, read('js/content/dom_fallback.js'), read('js/seed.js')].join('\n');
  assert.equal(combined.includes('fullscreenPauseAuthority'), false);
});

test('quick block lifecycle installs viewport and mutation work before the enabled guard can fully no-op it', () => {
  const source = read('js/content/block_channel.js');
  const quickBlock = sliceBetween(source, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');

  const focusListener = quickBlock.indexOf("document.addEventListener('focusin'");
  const resizeListener = quickBlock.indexOf("window.addEventListener('resize'");
  const enabledGuard = quickBlock.indexOf('if (!isQuickBlockEnabled()) return;');

  assert.ok(focusListener >= 0, 'missing focus listener');
  assert.ok(resizeListener >= 0, 'missing resize listener');
  assert.ok(enabledGuard >= 0, 'missing enabled guard');
  assert.ok(focusListener < enabledGuard, 'focus lifecycle currently installs before first enabled guard');
  assert.ok(resizeListener < enabledGuard, 'resize lifecycle currently installs before first enabled guard');
  assert.match(quickBlock, /new MutationObserver/);
  assert.doesNotMatch(quickBlock, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(quickBlock, /document\.addEventListener\('yt-navigate-finish'/);
  assert.equal(quickBlock.includes('clearInterval'), false);
});

test('normal menu and Kids passive menu are separate lifecycle owners from fallback menu', () => {
  const source = read('js/content/block_channel.js');
  const normalMenu = sliceBetween(source, 'function setupMenuObserver() {', 'function setupKidsPassiveBlockListener() {');
  const kidsPassive = sliceBetween(source, 'function setupKidsPassiveBlockListener() {', 'function captureKidsMenuContext(menuButton) {');

  assert.match(normalMenu, /document\.addEventListener\('click'/);
  assert.match(normalMenu, /new MutationObserver/);
  assert.match(normalMenu, /dropdownVisibilityObservers\.set/);
  assert.match(kidsPassive, /document\.addEventListener\('click'/);
  assert.match(kidsPassive, /new MutationObserver/);
  assert.match(kidsPassive, /handleKidsNativeBlock/);
  assert.equal(normalMenu.includes('fallbackMenuButtonsRescan'), false);
});

test('DOM fallback playlist guards are page-lifetime listeners with local route and list-mode checks', () => {
  const source = read('js/content/dom_fallback.js');
  const guard = sliceBetween(source, "if (!window.__filtertubePlaylistNavGuardInstalled) {", 'try {\n        for (let elementIndex = 0;');

  assert.match(guard, /document\.addEventListener\('click'/);
  assert.match(guard, /document\.addEventListener\('ended'/);
  assert.match(guard, /document\.location\?\.pathname/);
  assert.match(guard, /params\.has\('list'\)/);
  assert.match(guard, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(guard, /video\.pause\(\)/);
  assert.match(guard, /targetLink\.click\(\)/);
  assert.equal(guard.includes('routeSurfaceLifecycleScope'), false);
});

test('lifecycle effect budget doc requires future negative budgets before optimization', () => {
  const doc = read(docPath);

  for (const requirement of [
    'disabled/no-rule/route-inactive states',
    'native overlay',
    'fullscreen',
    'hidden tab',
    'teardown',
    'zero work',
    'Only then remove duplicate scans'
  ]) {
    assert.ok(doc.includes(requirement), `missing future requirement ${requirement}`);
  }
});
