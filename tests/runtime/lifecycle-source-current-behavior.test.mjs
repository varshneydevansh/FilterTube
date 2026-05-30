import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

const PATTERNS = {
  addEventListener: /addEventListener/g,
  removeEventListener: /removeEventListener/g,
  mutationObserver: /new\s+MutationObserver/g,
  disconnect: /\.disconnect\s*\(/g,
  setInterval: /setInterval/g,
  clearInterval: /clearInterval/g,
  setTimeout: /setTimeout/g,
  clearTimeout: /clearTimeout/g,
  requestAnimationFrame: /requestAnimationFrame/g,
  cancelAnimationFrame: /cancelAnimationFrame/g
};

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function count(sourceText, pattern) {
  return (sourceText.match(pattern) || []).length;
}

function lifecycleStats(file) {
  const text = source(file);
  return Object.fromEntries(
    Object.entries(PATTERNS).map(([name, pattern]) => [name, count(text, pattern)])
  );
}

test('page-resident lifecycle primitive counts are pinned for current behavior', () => {
  assert.deepEqual(lifecycleStats('js/content_bridge.js'), {
    addEventListener: 25,
    removeEventListener: 1,
    mutationObserver: 7,
    disconnect: 6,
    setInterval: 1,
    clearInterval: 1,
    setTimeout: 36,
    clearTimeout: 10,
    requestAnimationFrame: 10,
    cancelAnimationFrame: 0
  });

  assert.deepEqual(lifecycleStats('js/content/block_channel.js'), {
    addEventListener: 37,
    removeEventListener: 1,
    mutationObserver: 6,
    disconnect: 2,
    setInterval: 0,
    clearInterval: 0,
    setTimeout: 17,
    clearTimeout: 6,
    requestAnimationFrame: 5,
    cancelAnimationFrame: 0
  });

  assert.deepEqual(lifecycleStats('js/content/dom_fallback.js'), {
    addEventListener: 3,
    removeEventListener: 0,
    mutationObserver: 0,
    disconnect: 0,
    setInterval: 0,
    clearInterval: 0,
    setTimeout: 10,
    clearTimeout: 0,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0
  });

  assert.deepEqual(lifecycleStats('js/injector.js'), {
    addEventListener: 2,
    removeEventListener: 0,
    mutationObserver: 0,
    disconnect: 0,
    setInterval: 1,
    clearInterval: 2,
    setTimeout: 5,
    clearTimeout: 2,
    requestAnimationFrame: 0,
    cancelAnimationFrame: 0
  });
});

test('quick-block source currently installs global lifecycle work without a clearInterval teardown', () => {
  const text = source('js/content/block_channel.js');

  assert.match(text, /let quickBlockObserverStarted = false;/);
  assert.doesNotMatch(text, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(text, /document\.addEventListener\('yt-navigate-finish'/);
  assert.equal(count(text, /clearInterval/g), 0);
  assert.match(text, /window\.addEventListener\('resize'/);
  assert.match(text, /window\.addEventListener\('orientationchange'/);
});

test('quick-block observer setup currently installs lifecycle work before feature-enabled checks', () => {
  const text = source('js/content/block_channel.js');
  const start = text.indexOf('function setupQuickBlockObserver() {');
  const end = text.indexOf('function setupMenuObserver() {', start);
  assert.notEqual(start, -1, 'missing setupQuickBlockObserver');
  assert.notEqual(end, -1, 'missing setupMenuObserver after quick-block observer');
  const block = text.slice(start, end);

  const ensureStylesIndex = block.indexOf('ensureQuickBlockStyles();');
  const focusListenerIndex = block.indexOf("document.addEventListener('focusin'");
  const resizeListenerIndex = block.indexOf("window.addEventListener('resize'");
  const firstEnabledGuardIndex = block.indexOf('if (!isQuickBlockEnabled()) return;');

  assert.notEqual(ensureStylesIndex, -1, 'missing quick-block style injection');
  assert.notEqual(focusListenerIndex, -1, 'missing focus listener');
  assert.notEqual(resizeListenerIndex, -1, 'missing resize listener');
  assert.notEqual(firstEnabledGuardIndex, -1, 'missing later enabled guard');
  assert.ok(ensureStylesIndex < focusListenerIndex, 'styles are injected before lifecycle listeners');
  assert.ok(focusListenerIndex < firstEnabledGuardIndex, 'focus lifecycle listener is installed before first enabled guard');
  assert.ok(resizeListenerIndex < firstEnabledGuardIndex, 'resize lifecycle listener is installed before first enabled guard');
});

test('fallback menu source currently has warmup and scroll rescan lifecycle work', () => {
  const text = source('js/content_bridge.js');

  assert.match(text, /fallbackMenuButtonsInstalled/);
  assert.match(text, /window\.addEventListener\('scroll'/);
  assert.match(text, /const warmupTimer = setInterval/);
  assert.match(text, /clearInterval\(warmupTimer\)/);
});

test('DOM fallback source currently attaches document or window listeners without local removal paths', () => {
  const text = source('js/content/dom_fallback.js');

  assert.equal(count(text, /addEventListener/g), 3);
  assert.equal(count(text, /removeEventListener/g), 0);
  assert.match(text, /window\.addEventListener\('scroll'/);
  assert.match(text, /document\.addEventListener\('click'/);
  assert.match(text, /document\.addEventListener\('ended'/);
});
