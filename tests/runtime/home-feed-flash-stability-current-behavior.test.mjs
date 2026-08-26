import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

test('Home filtering stays paint-coalesced and does not mutate card geometry', () => {
  const dom = read('js/content/dom_fallback.js');
  const polish = sliceBetween(dom, 'function installFilterTubeHomeFeedPolish()', 'function getFilterTubeChannelHrefFromCard');
  const css = polish.slice(polish.indexOf('style.textContent = `'), polish.indexOf('`;\n        document.head'));
  const chipRail = sliceBetween(dom, 'function restoreFilterTubeHomeChipRailPosition()', 'function applyFilterTubeHomeFeedPolish');
  const fallback = sliceBetween(dom, 'async function applyDOMFallback(settings, options = {})', 'function installFilterTubeRoutineConsoleGate');

  assert.match(css, /transition:\s*none/);
  assert.doesNotMatch(css, /position:\s*(?:fixed|sticky)/);
  assert.doesNotMatch(css, /font-size|line-height|padding|margin|scrollIntoView/);
  assert.doesNotMatch(chipRail, /scrollIntoView\s*\?\./);
  assert.match(chipRail, /scrollLeft/);
  assert.match(fallback, /if \(isFilterTubeHomeRoute\(\)\) return Promise\.resolve\(\)/);
  assert.match(fallback, /layoutChangedDuringRun/);
});

test('Home fallback starts before the delayed main-world setup', () => {
  const bridge = read('js/content_bridge.js');
  const initialize = sliceBetween(bridge, 'async function initialize() {', 'async function initializeDOMFallback(settings)');
  const fallbackStart = bridge.indexOf('async function initializeDOMFallback(settings) {');
  assert.notEqual(fallbackStart, -1, 'missing DOM fallback initializer');
  const fallbackStartup = bridge.slice(fallbackStart, fallbackStart + 1800);

  assert.match(initialize, /initializeDOMFallback\(response\.settings\);\s*await ensureMainWorldRuntimeForSettings/s);
  assert.match(fallbackStartup, /await applyDOMFallback\(settings, \{ preserveScroll: false, forceReprocess: true \}\)/);
  assert.match(fallbackStartup, /await new Promise\(resolve => setTimeout\(resolve, 1000\)\)/);
});
