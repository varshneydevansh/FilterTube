import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

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

test('page-global patch authority audit documents current behavior and future contract', () => {
  const doc = read('docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  for (const phrase of [
    'Current Patch Surface',
    'window.fetch = function',
    'XMLHttpRequest.prototype.open',
    'window.__filtertubeXhrInterceptionInstalled',
    'page-lifetime patches',
    'patch owner id exists',
    'patches do not double-wrap after seed reinjection',
    'Page-global patch authority is not green'
  ]) {
    assert.ok(doc.includes(phrase), `missing page-global patch phrase ${phrase}`);
  }
});

test('fetch interception stores original fetch and replaces window.fetch without an installed flag', () => {
  const seed = read('js/seed.js');
  const fetchBlock = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');

  assert.match(fetchBlock, /const originalFetch = window\.fetch/);
  assert.match(fetchBlock, /window\.fetch = function\(resource, init\)/);
  assert.match(fetchBlock, /originalFetch\.apply\(this, arguments\)/);
  assert.match(fetchBlock, /fetchEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);

  assert.doesNotMatch(fetchBlock, /__filtertubeFetchInterceptionInstalled/);
  assert.doesNotMatch(fetchBlock, /restoreFetch|unpatchFetch|window\.fetch = originalFetch/);
});

test('XHR interception replaces four prototype methods and keeps only local originals', () => {
  const seed = read('js/seed.js');
  const xhrBlock = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');

  for (const token of [
    'const originalOpen = proto.open',
    'const originalSend = proto.send',
    'const originalAddEventListener = proto.addEventListener',
    'const originalRemoveEventListener = proto.removeEventListener',
    'proto.addEventListener = function',
    'proto.removeEventListener = function',
    'proto.open = function',
    'proto.send = function'
  ]) {
    assert.ok(xhrBlock.includes(token), `missing XHR patch token ${token}`);
  }

  assert.match(xhrBlock, /window\.__filtertubeXhrInterceptionInstalled/);
  assert.doesNotMatch(xhrBlock, /restoreXhr|unpatchXhr|proto\.open = originalOpen|proto\.send = originalSend/);
});

test('fetch and XHR endpoint policy currently lives inside patched functions rather than one shared authority', () => {
  const seed = read('js/seed.js');
  const fetchBlock = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const xhrBlock = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');

  assert.match(fetchBlock, /const fetchEndpoints = \[/);
  assert.match(xhrBlock, /const xhrEndpoints = \[/);
  assert.doesNotMatch(seed, /function endpointPolicy\(|const endpointPolicy|networkAuthority|patchAuthority/);
  assert.match(fetchBlock, /urlStr\.includes\(endpoint\)/);
  assert.match(xhrBlock, /urlStr\.includes\(endpoint\)/);
});

test('page-global patch restore or lifecycle registry does not exist in current source', () => {
  const pageRuntime = [
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/content/dom_fallback.js',
    'js/content/collab_dialog.js'
  ].map(read).join('\n');

  assert.doesNotMatch(pageRuntime, /lifecycleRegistry|registerLifecycle|patchAuthority|restoreFetch|restoreXhr|unpatchFetch|unpatchXhr/);
});

test('XHR response override mutates per-instance response getters after late processing', () => {
  const xhrBlock = sliceBetween(
    read('js/seed.js'),
    'function setupXhrInterception() {',
    '// ============================================================================'
  );
  const processor = sliceBetween(xhrBlock, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');

  assert.match(processor, /xhr\.__filtertube_modifiedResponse = processed/);
  assert.match(processor, /xhr\.__filtertube_modifiedResponseText = JSON\.stringify\(processed\)/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'response'/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'responseText'/);
  assert.match(processor, /if \(!cachedSettings\) return/);
  assert.match(processor, /if \(cachedSettings\.enabled === false\) return/);
});
