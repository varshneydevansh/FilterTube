import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_PAGE_RUNTIME_OWNER_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md';

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

test('page runtime owner/effect matrix is audit-only and separates data source from side-effect permission', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior audit artifact/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /source waterfall answers where data came from/);
  assert.match(doc, /which owner can spend\s+that lifecycle work and what side effect it can cause today/);
  assert.match(doc, /no scan, no stamp, no fetch, no hide, no restore/);
  assert.match(doc, /Do not use this matrix as permission to remove runtime code/);
});

test('page runtime owner/effect matrix lists the current page-runtime owners', () => {
  const doc = read(docPath);

  for (const owner of [
    'Seed page transport',
    'Bridge settings relay',
    'Bridge learned-map receiver',
    'Bridge prefetch / playlist hydration',
    'Bridge whitelist pending',
    'Bridge fallback menu',
    'Quick block',
    'Normal menu / Kids passive',
    'DOM fallback core',
    'DOM playlist/player guard',
    'Collaborator dialog',
    'Prompt surfaces'
  ]) {
    assert.ok(doc.includes(owner), `missing owner ${owner}`);
  }

  for (const effect of [
    'Parse/clone/stringify YouTubei payloads',
    'Persist maps',
    'Directly apply pending hidden classes',
    'Inject fallback buttons/popovers',
    'Inject quick cross buttons',
    'hide/restore',
    'pause playback',
    'acknowledge prompt state'
  ]) {
    assert.ok(doc.includes(effect), `missing effect ${effect}`);
  }
});

test('runtime currently lacks a shared page runtime owner/effect authority', () => {
  const source = [
    'js/seed.js',
    'js/content/bridge_settings.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/collab_dialog.js',
    'js/content/first_run_prompt.js',
    'js/content/release_notes_prompt.js'
  ].map(read).join('\n');

  for (const absent of [
    'pageRuntimeOwnerEffectMatrix',
    'lifecycleOwnerActionDecision',
    'noRuleOwnerWorkBudget',
    'fullscreenNonPlayerPauseDecision',
    'nativeOverlayOwnerPauseDecision',
    'routeOwnerTeardownDecision'
  ]) {
    assert.equal(source.includes(absent), false, `${absent} should not exist in runtime source yet`);
  }
});

test('seed transport owns page-global endpoint and initial-data side effects', () => {
  const source = read('js/seed.js');

  for (const token of [
    'function setupFetchInterception()',
    'function setupXhrInterception()',
    "Object.defineProperty(window, 'ytInitialData'",
    "Object.defineProperty(window, 'ytInitialPlayerResponse'",
    'function updateSettings(newSettings)',
    'processWithEngine',
    'harvestOnly',
    'replayPendingQueueIfReady'
  ]) {
    assert.ok(source.includes(token), `missing seed token ${token}`);
  }

  assert.equal(source.includes('pageRuntimeOwnerEffectMatrix'), false);
});

test('content bridge has separate learned-map, prefetch, whitelist-pending, and fallback-menu owners', () => {
  const source = read('js/content_bridge.js');
  const prefetch = sliceBetween(source, 'function startCardPrefetchObserver() {', 'let playlistPanelPrefetchHookInstalled = false;');
  const playlistHook = sliceBetween(source, 'function installPlaylistPanelPrefetchHook() {', 'function installRightRailWhitelistObserver() {');
  const fallbackMenu = sliceBetween(source, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  assert.match(source, /FilterTube_UpdateVideoChannelMap/);
  assert.match(source, /persistVideoChannelMapping/);
  assert.match(source, /pendingVideoMetaDomRerunTimer/);
  assert.match(source, /function applyWhitelistPendingHide/);
  assert.match(source, /data-filtertube-whitelist-pending/);

  assert.match(prefetch, /new IntersectionObserver/);
  assert.match(prefetch, /document\.addEventListener\('visibilitychange'/);
  assert.match(playlistHook, /document\.addEventListener\('scroll'/);
  assert.match(playlistHook, /new MutationObserver/);

  assert.match(fallbackMenu, /new MutationObserver/);
  assert.match(fallbackMenu, /const warmupTimer = setInterval/);
  assert.match(fallbackMenu, /window\.addEventListener\('scroll'/);
  assert.match(source, /function openFilterTubePlaylistFallbackPopover/);
  assert.match(source, /function refreshOpenPlaylistFallbackPopoverForVideo/);
  assert.equal(fallbackMenu.includes('lifecycleOwnerActionDecision'), false);
});

test('quick block, normal menu, and Kids passive menu are separate owners without a unified affordance budget', () => {
  const source = read('js/content/block_channel.js');
  const quickBlock = sliceBetween(source, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');
  const normalMenu = sliceBetween(source, 'function setupMenuObserver() {', 'function setupKidsPassiveBlockListener() {');
  const kidsPassive = sliceBetween(source, 'function setupKidsPassiveBlockListener() {', 'function captureKidsMenuContext(menuButton) {');

  for (const token of [
    "window.addEventListener('resize'",
    "window.addEventListener('orientationchange'",
    "document.addEventListener('yt-navigate-finish'",
    'new MutationObserver',
    'if (!isQuickBlockEnabled()) return;'
  ]) {
    assert.ok(quickBlock.includes(token), `missing quick-block token ${token}`);
  }

  assert.match(normalMenu, /document\.addEventListener\('click'/);
  assert.match(normalMenu, /dropdownVisibilityObservers\.set/);
  assert.match(kidsPassive, /handleKidsNativeBlock/);
  assert.match(kidsPassive, /new MutationObserver/);
  assert.equal(source.includes('nativeOverlayOwnerPauseDecision'), false);
});

test('DOM fallback core and playlist/player guard own hide restore media and navigation effects', () => {
  const source = read('js/content/dom_fallback.js');
  const fallbackCore = sliceBetween(source, 'function hasActiveDOMFallbackWork(settings) {', 'function clearStaleDOMFallbackVisibility() {');
  const applyFallback = sliceBetween(source, 'async function applyDOMFallback(settings, options = {}) {', "if (!window.__filtertubePlaylistNavGuardInstalled) {");
  const guard = sliceBetween(source, "if (!window.__filtertubePlaylistNavGuardInstalled) {", 'try {\n        for (let elementIndex = 0;');

  assert.match(fallbackCore, /contentFilters/);
  assert.match(fallbackCore, /categoryFilters/);
  assert.match(applyFallback, /clearStaleDOMFallbackVisibility/);
  assert.match(applyFallback, /toggleVisibility/);
  assert.match(applyFallback, /querySelectorAll/);

  assert.match(guard, /document\.addEventListener\('click'/);
  assert.match(guard, /document\.addEventListener\('ended'/);
  assert.match(guard, /video\.pause\(\)/);
  assert.match(guard, /targetLink\.click\(\)/);
  assert.equal(guard.includes('routeOwnerTeardownDecision'), false);
});

test('collaborator and prompt owners are page runtime side-effect owners outside core filtering', () => {
  const collab = read('js/content/collab_dialog.js');
  const firstRun = read('js/content/first_run_prompt.js');
  const release = read('js/content/release_notes_prompt.js');

  assert.match(collab, /document\.addEventListener\('click', handlePotentialCollabTrigger, true\)/);
  assert.match(collab, /document\.addEventListener\('keydown', handlePotentialCollabTriggerKeydown, true\)/);
  assert.match(collab, /collabDialogObserver = new MutationObserver/);
  assert.match(collab, /applyDOMFallback\(null/);

  assert.match(firstRun, /document\.addEventListener\('DOMContentLoaded', createPrompt/);
  assert.match(firstRun, /FilterTube_FirstRunCheck/);
  assert.match(firstRun, /FilterTube_FirstRunComplete/);
  assert.match(release, /document\.addEventListener\('DOMContentLoaded', ready/);
  assert.match(release, /FilterTube_ReleaseNotesCheck/);
  assert.match(release, /FilterTube_ReleaseNotesAck/);
  assert.match(release, /FilterTube_OpenWhatsNew/);
});
