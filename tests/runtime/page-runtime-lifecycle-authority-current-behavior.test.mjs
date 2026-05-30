import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function source(file) {
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

const pageRuntimeFiles = [
  'js/seed.js',
  'js/content_bridge.js',
  'js/content/block_channel.js',
  'js/content/dom_fallback.js',
  'js/content/collab_dialog.js',
  'js/content/bridge_settings.js',
  'js/content/bridge_injection.js',
  'js/content/handle_resolver.js',
  'js/injector.js'
];

test('page runtime lifecycle authority audit documents the current owner families and future rule', () => {
  const doc = source('docs/audit/FILTERTUBE_PAGE_RUNTIME_LIFECYCLE_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Seed network interception',
    'Content bridge prefetch / hydration',
    'Fallback menu scan lifecycle',
    'Quick block viewport lifecycle',
    'Normal menu observer / Kids passive listener',
    'DOM fallback guards',
    'Collaborator dialog lifecycle',
    'Every page-resident observer/listener/timer/prototype patch should have'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('page runtime currently has no shared lifecycle registry symbol across page-resident source', () => {
  const combined = pageRuntimeFiles.map(source).join('\n');
  assert.doesNotMatch(
    combined,
    /lifecycleRegistry|registerLifecycle|disposeAll|teardownAll|observerRegistry|timerRegistry|cleanupRegistry/
  );
});

test('seed XHR interception patches prototypes for page lifetime without a restore owner', () => {
  const text = source('js/seed.js');
  const block = sliceBetween(text, 'function setupXhrInterception() {', '// ============================================================================\n    // SETTINGS MANAGEMENT');

  assert.match(block, /const originalOpen = proto\.open;/);
  assert.match(block, /const originalSend = proto\.send;/);
  assert.match(block, /const originalAddEventListener = proto\.addEventListener;/);
  assert.match(block, /proto\.addEventListener = function/);
  assert.match(block, /proto\.removeEventListener = function/);
  assert.match(block, /proto\.open = function/);
  assert.match(block, /proto\.send = function/);
  assert.match(block, /urlStr\.includes\(endpoint\)/);
  assert.doesNotMatch(block, /proto\.open\s*=\s*originalOpen/);
  assert.doesNotMatch(block, /proto\.send\s*=\s*originalSend/);
});

test('content bridge prefetch lifecycle owns anonymous listeners without a shared removal owner', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(text, '// PREFETCH / HYDRATION QUEUE', 'function installRightRailWhitelistObserver() {');

  assert.match(block, /prefetchObserver = new IntersectionObserver/);
  assert.match(block, /document\.addEventListener\('visibilitychange', \(\) =>/);
  assert.match(block, /document\.addEventListener\('scroll', \(event\) =>/);
  assert.match(block, /const observer = new MutationObserver/);
  assert.match(block, /document\.addEventListener\('yt-navigate-finish', \(\) =>/);
  assert.match(block, /observer\.disconnect\(\)/);
  assert.doesNotMatch(block, /removeEventListener/);
});

test('fallback menu scan lifecycle is desktop-hover lazy but still has no teardown owner', () => {
  const text = source('js/content_bridge.js');
  const block = sliceBetween(text, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  assert.match(block, /fallbackMenuButtonsInstalled = true;/);
  assert.match(block, /const observer = new MutationObserver/);
  assert.match(block, /observer\.observe\(target, \{ childList: true, subtree: true \}\)/);
  assert.match(block, /document\.addEventListener\('yt-navigate-finish', \(\) =>/);
  assert.match(block, /document\.addEventListener\('click', \(event\) =>/);
  assert.match(block, /document\.addEventListener\('pointerover', scheduleHoveredFallbackCard/);
  assert.match(block, /document\.addEventListener\('focusin', scheduleHoveredFallbackCard/);
  assert.match(block, /window\.addEventListener\('scroll', \(\) =>/);
  assert.match(block, /const warmupTimer = setInterval/);
  assert.match(block, /clearInterval\(warmupTimer\)/);
  assert.match(block, /shouldEagerFallbackMenuScan\(\)/);
  assert.doesNotMatch(block, /observer\.disconnect\(\)/);
  assert.doesNotMatch(block, /removeEventListener/);
});

test('quick block lifecycle entry-gates disabled mode and keeps pointer recovery dynamically removable', () => {
  const text = source('js/content/block_channel.js');
  const block = sliceBetween(text, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');

  const focusListenerIndex = block.indexOf("document.addEventListener('focusin'");
  const resizeListenerIndex = block.indexOf("window.addEventListener('resize'");
  const enabledGuardIndex = block.indexOf('if (!isQuickBlockEnabled()) return false;');
  assert.ok(focusListenerIndex > -1 && enabledGuardIndex > -1 && enabledGuardIndex < focusListenerIndex);
  assert.ok(resizeListenerIndex > -1 && enabledGuardIndex < resizeListenerIndex);
  assert.match(block, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(block, /document\.addEventListener\('yt-navigate-finish'/);
  assert.doesNotMatch(block, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.doesNotMatch(block, /clearInterval/);
  assert.match(block, /document\.removeEventListener\('pointermove'/);
});

test('normal and Kids menu observer lifecycles have split owners without shared teardown', () => {
  const text = source('js/content/block_channel.js');
  const block = sliceBetween(text, 'function setupMenuObserver() {', 'function captureKidsMenuContext(menuButton) {');

  assert.match(block, /if \(isKidsSite\) \{\s*setupKidsPassiveBlockListener\(\);/);
  assert.match(block, /document\.addEventListener\('click', \(e\) =>/);
  assert.match(block, /const observer = new MutationObserver/);
  assert.match(block, /observer\.observe\(document\.body,/);
  assert.match(block, /function setupKidsPassiveBlockListener\(\)/);
  assert.match(block, /const observer = new MutationObserver/);
  assert.doesNotMatch(block, /removeEventListener/);
  assert.doesNotMatch(block, /observer\.disconnect\(\)/);
});

test('DOM fallback installs playlist and media guards once without local removal paths', () => {
  const text = source('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    "if (!window.__filtertubePlaylistNavGuardInstalled) {",
    'try {\n        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {'
  );

  assert.match(block, /window\.__filtertubePlaylistNavGuardInstalled = true/);
  assert.match(block, /document\.addEventListener\('click', \(event\) =>/);
  assert.match(block, /window\.__filtertubePlaylistAutoplayGuardInstalled = true/);
  assert.match(block, /document\.addEventListener\('ended', \(event\) =>/);
  assert.match(block, /video\.pause\(\)/);
  assert.match(block, /nextBtn\.click\(\)/);
  assert.doesNotMatch(block, /removeEventListener/);
});

test('collaborator dialog lifecycle is pending-card gated and has explicit listener/observer teardown', () => {
  const text = source('js/content/collab_dialog.js');

  assert.match(text, /let collabDialogObserver = null;/);
  assert.match(text, /document\.addEventListener\('click', handlePotentialCollabTrigger, true\)/);
  assert.match(text, /document\.addEventListener\('keydown', handlePotentialCollabTriggerKeydown, true\)/);
  assert.match(text, /function removeCollabTriggerListeners\(\)/);
  assert.match(text, /collabDialogObserver = new MutationObserver/);
  assert.match(text, /if \(!hasPendingCollabCards\(\)\) return false;/);
  assert.match(text, /const target = document\.documentElement \|\| document\.body/);
  assert.match(text, /collabDialogObserver\.observe\(target,/);
  assert.match(text, /document\.addEventListener\('DOMContentLoaded', \(\) =>/);
  assert.equal(count(text, /removeEventListener/g), 2);
  assert.equal(count(text, /collabDialogObserver\?\.disconnect\?\.\(\)/g), 1);
});
