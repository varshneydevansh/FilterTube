import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();

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

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

test('XHR no-work boundary audit documents current behavior and future counters', () => {
  const doc = read('docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'Current XHR Flow',
    'urlStr.includes(endpoint)',
    'Disabled/no-settings/no-work lifecycle',
    'Listener wrapping',
    'Response override',
    'xhrReadyHooks: 0',
    'compiledRuleState',
    'XHR no-work boundary is partially green'
  ]) {
    assert.ok(doc.includes(phrase), `missing XHR audit phrase ${phrase}`);
  }
});

test('XHR open bypasses YouTubei URLs before settings exist', () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });

  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
  assert.equal(xhr.__filtertube_responseProcessed, false);
});

test('XHR open bypasses matching URLs when filtering is disabled', () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  const xhr = new runtime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');

  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
  assert.equal(xhr.__filtertube_responseProcessed, false);
});

test('XHR interception keeps substring endpoint detection but gates it through no-work bypass in open and send', () => {
  const setup = sliceBetween(
    read('js/seed.js'),
    'function setupXhrInterception() {',
    '// ============================================================================'
  );

  assert.match(setup, /xhrEndpoints = \[/);
  assert.match(setup, /proto\.open = function\(method, url\)/);
  assert.match(setup, /this\.__filtertube_shouldProcessXhr = Boolean\(\s*urlStr\s*&& xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)\s*&& !shouldBypassYouTubeiNetworkResponse\(dataName\)\s*\)/);
  assert.match(setup, /proto\.send = function\(\)/);

  const sendBlock = sliceBetween(setup, 'proto.send = function() {', 'return originalSend.apply(this, arguments);');
  assert.match(sendBlock, /urlStr\s*&& xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(sendBlock, /!shouldBypassYouTubeiNetworkResponse\(dataName\)/);
});

test('XHR send installs ready-state hooks only after endpoint and no-work gates pass', () => {
  const setup = sliceBetween(
    read('js/seed.js'),
    'function setupXhrInterception() {',
    '// ============================================================================'
  );
  const sendBlock = sliceBetween(setup, 'proto.send = function() {', 'return originalSend.apply(this, arguments);');
  const processor = sliceBetween(setup, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');

  assert.match(sendBlock, /originalAddEventListener\.call\(this, 'readystatechange', processIfReady\)/);
  assert.match(sendBlock, /originalAddEventListener\.call\(this, 'load', processIfReady\)/);
  assert.match(sendBlock, /!shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(processor, /if \(!cachedSettings\) return/);
  assert.match(processor, /if \(cachedSettings\.enabled === false\) return/);
  assert.doesNotMatch(sendBlock, /!cachedSettings/);
  assert.doesNotMatch(sendBlock, /enabled === false/);
});

test('XHR processing path can override response bodies after JSON parsing', () => {
  const setup = sliceBetween(
    read('js/seed.js'),
    'function setupXhrInterception() {',
    '// ============================================================================'
  );
  const processor = sliceBetween(setup, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');

  assert.match(processor, /JSON\.parse\(trimmed\)/);
  assert.match(processor, /processWithEngine\(jsonData, dataName\)/);
  assert.match(processor, /xhr\.__filtertube_modifiedResponse = processed/);
  assert.match(processor, /xhr\.__filtertube_modifiedResponseText = JSON\.stringify\(processed\)/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'response'/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'responseText'/);
});
