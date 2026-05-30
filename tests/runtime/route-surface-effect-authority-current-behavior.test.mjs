import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const routeSourceAuthorityDocs = [
  docPath,
  'docs/audit/FILTERTUBE_ROUTE_IDENTITY_DECISION_INDEX_2026-05-20.md',
  'docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md'
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

test('route surface effect authority doc is audit-only and links information lifecycle and effects', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior audit artifact/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /information availability\s+->\s+lifecycle budget\s+->\s+allowed effect/);
  assert.match(doc, /which effects may run/);
  assert.match(doc, /Runtime behavior remains not-ready-for-route-surface optimization/);
});

test('route and source authority docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  for (const marker of [
    'tracked JS/JSX/MJS files: 63',
    'repo-wide lexical callables: 5469',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5469',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(marker), `method gap source missing ${marker}`);
  }

  assert.equal(routeSourceAuthorityDocs.length, 4);
  for (const file of routeSourceAuthorityDocs) {
    const text = read(file);
    assert.ok(text.includes(methodGapPath), `${file} should cite method gap source`);
    assert.match(text, /## Method Semantic Proof Gap Boundary/);
    assert.match(text, /method semantic proof gap files covered: 63/);
    assert.match(text, /method semantic proof gap lexical callables covered: 5469/);
    assert.match(text, /files with complete per-callable semantic proof: 0/);
    assert.match(text, /lexical callables requiring semantic proof before behavior changes: 5469/);
    assert.match(text, /affected callable semantic proof: NO-GO/);
    assert.match(text, /runtime behavior changed: no/);
    assert.match(text, /do not approve runtime\s+optimization/);
    assert.match(text, /JSON-first behavior/);
    assert.match(text, /route\/surface effect changes/);
  }
});

test('route surface effect authority doc lists high-risk route and surface classes', () => {
  const doc = read(docPath);

  for (const route of [
    'YouTubei endpoints',
    'Main home/search',
    'Main watch/current video',
    'Shorts',
    'Playlist/Mix',
    'Comments/posts/community',
    'YouTube Kids',
    'YouTube Music/mobile `ytm-*`',
    'Native overlays/fullscreen/app shells'
  ]) {
    assert.ok(doc.includes(route), `missing route/surface ${route}`);
  }
});

test('runtime currently lacks a shared route surface effect authority token', () => {
  const runtime = [
    'js/seed.js',
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js',
    'js/content_bridge.js',
    'js/background.js'
  ].map(read).join('\n');

  for (const absent of [
    'routeSurfaceEffectAuthority',
    'routeSurfaceEffectDecision',
    'watchSurfaceEffectBudget',
    'menuAffordanceSurfaceAuthority',
    'routeInactiveNoWorkCounter',
    'sideEffectRouteBudget'
  ]) {
    assert.equal(runtime.includes(absent), false, `${absent} should not exist in runtime yet`);
  }
});

test('seed endpoint interception is endpoint-family based before route surface effect reporting', () => {
  const source = read('js/seed.js');
  const fetchBlock = sliceBetween(source, 'function setupFetchInterception() {', 'function setupXhrInterception() {');

  for (const endpoint of [
    '/youtubei/v1/search',
    '/youtubei/v1/guide',
    '/youtubei/v1/browse',
    '/youtubei/v1/next',
    '/youtubei/v1/player'
  ]) {
    assert.ok(fetchBlock.includes(endpoint), `missing endpoint ${endpoint}`);
  }

  assert.match(fetchBlock, /urlStr\.includes\(endpoint\)/);
  assert.match(fetchBlock, /shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(fetchBlock, /response\.clone\(\)\.json\(\)/);
  assert.ok(
    fetchBlock.indexOf('shouldBypassYouTubeiNetworkResponse(dataName)') < fetchBlock.indexOf('response.clone().json()'),
    'inactive endpoint work should bypass fetch body parsing before route/surface reporting exists'
  );
  assert.match(fetchBlock, /processWithEngine\(jsonData, dataName\)/);
  assert.equal(fetchBlock.includes('routeSurfaceEffectDecision'), false);
});

test('filter engine has local route exceptions but remains endpoint agnostic', () => {
  const source = read('js/filter_logic.js');
  const block = sliceBetween(source, '_shouldBlock(item, rendererType) {', 'filter(obj, path = \'root\') {');

  assert.match(block, /const path = document\.location\?\.pathname \|\| ''/);
  assert.match(block, /path === '\/feed\/channels'/);
  assert.match(block, /path === '\/results'/);
  assert.match(block, /rendererType === 'secondarySearchContainerRenderer'/);
  assert.match(block, /videoPrimaryInfoRenderer/);
  assert.match(block, /videoSecondaryInfoRenderer/);
  assert.match(block, /listMode === 'whitelist'/);
  assert.equal(block.includes('watchSurfaceEffectBudget'), false);
});

test('DOM fallback uses broad active predicates before route specific effects', () => {
  const source = read('js/content/dom_fallback.js');
  const active = sliceBetween(source, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  const applyBody = source.slice(source.indexOf('async function applyDOMFallback(settings, options = {}) {'));

  assert.match(active, /if \(listMode === 'whitelist'\) return true/);
  assert.match(active, /booleanFilterKeys/);
  assert.match(active, /hideVideoSidebar/);
  assert.match(active, /hideEndscreenVideowall/);
  assert.match(active, /categoryFilters\?\.enabled === true/);
  assert.match(applyBody, /hasActiveDOMFallbackWork\(effectiveSettings\)/);
  assert.match(applyBody, /document\.querySelectorAll\(VIDEO_CARD_SELECTORS\)/);
  assert.match(applyBody, /path === '\/feed\/channels'/);
  assert.equal(active.includes('routeInactiveNoWorkCounter'), false);
});

test('watch current-video effects include pause and click side effects behind local route checks', () => {
  const source = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    source,
    'function enforceCurrentWatchOwnerBlock(settings) {',
    'function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {'
  );

  assert.match(block, /path\.startsWith\('\/watch'\)/);
  assert.match(block, /listMode === 'whitelist'/);
  assert.match(block, /shouldHideContent\(title, ownerName, settings/);
  assert.match(block, /video\.pause\(\)/);
  assert.match(block, /targetLink\.click\(\)/);
  assert.match(block, /nextButton\.click\(\)/);
  assert.equal(block.includes('sideEffectRouteBudget'), false);
});

test('quick block and menu affordances use split route and action gates today', () => {
  const quick = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const quickEnabled = sliceBetween(quick, 'const isQuickBlockEnabled = () => {', 'function ensureQuickBlockStyles() {');
  const mobileWatch = sliceBetween(quick, 'const isMobileWatchNextQuickBlockHost = (hostCard) => {', 'function isPostLikeQuickBlockCard(card) {');
  const primaryMenu = sliceBetween(bridge, 'async function injectFilterTubeMenuItem(dropdown, videoCard) {', 'const videoCardTagName =');
  const fallbackScan = sliceBetween(bridge, 'const scan = (root = document) => {', 'let scanQueued = false;');

  assert.match(quickEnabled, /showQuickBlockButton !== true/);
  assert.match(quickEnabled, /currentSettings\.listMode === 'whitelist'/);
  assert.match(mobileWatch, /host\.includes\('m\.youtube\.com'\)/);
  assert.match(mobileWatch, /path\.startsWith\('\/watch'\)/);
  assert.match(primaryMenu, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(primaryMenu, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(fallbackScan, /isFilterTubeNativeOverlayQuietMode\(\)/);
  assert.doesNotMatch(fallbackScan, /showBlockMenuItem/);
  assert.doesNotMatch(fallbackScan, /listMode/);
});

test('route surface effect authority doc requires future effect and negative budgets', () => {
  const doc = read(docPath);

  for (const token of [
    'parseEndpoint',
    'mutateJson',
    'harvestOnly',
    'scanDom',
    'hideDom',
    'restoreDom',
    'injectQuick',
    'injectMenu',
    'resolveIdentity',
    'fetchIdentity',
    'pausePlayer',
    'clickNavigation',
    'countStats',
    'no parse/mutate/scan/inject/fetch/pause/click/count'
  ]) {
    assert.ok(doc.includes(token), `missing effect budget token ${token}`);
  }
});
