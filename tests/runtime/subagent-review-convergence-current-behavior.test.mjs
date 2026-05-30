import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SUBAGENT_REVIEW_CONVERGENCE_2026-05-19.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

test('subagent convergence document is audit-only and keeps the full objective open', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: read-only audit consolidation/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /The implementation gate remains closed/);
  assert.match(doc, /does not complete the\s+full objective/);
});

test('subagent convergence records all five independent review slices', () => {
  const doc = read(docPath);

  for (const slice of [
    'JSON/renderers',
    'DOM/lifecycle',
    'Endpoint/network/performance',
    'Settings/mutation/security',
    'Release/static/native'
  ]) {
    assert.ok(doc.includes(slice), `missing review slice ${slice}`);
  }

  for (const sourceSurface of [
    'js/filter_logic.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/seed.js',
    'js/background.js',
    'js/settings_shared.js',
    'js/state_manager.js',
    'js/nanah_sync_adapter.js',
    'build.js'
  ]) {
    assert.ok(doc.includes(sourceSurface), `missing source surface ${sourceSurface}`);
  }
});

test('subagent convergence preserves the no-work problem as body work before pass-through', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');

  assert.match(doc, /response\.clone\(\)\.json\(\)/);
  assert.match(doc, /new Response\(JSON\.stringify/);
  assert.match(doc, /compiledRuleState\.noWork === true/);

  assert.match(seed, /response\.clone\(\)\.json\(\)/);
  assert.match(seed, /new Response\(JSON\.stringify\(processed\)/);
});

test('subagent convergence preserves DOM false-hide broad-container risks', () => {
  const doc = read(docPath);
  const fallback = read('js/content/dom_fallback.js');

  for (const token of [
    'members-only',
    'playlist lockup',
    'ytd-horizontal-list-renderer',
    'ytd-shelf-renderer',
    'negative sibling-visible proof'
  ]) {
    assert.ok(doc.includes(token), `missing DOM risk token ${token}`);
  }

  assert.match(fallback, /yt-badge-shape--membership/);
  assert.match(fallback, /ytd-horizontal-list-renderer/);
  assert.match(fallback, /ytd-shelf-renderer/);
});

test('subagent convergence preserves quick-block and fallback-menu lifecycle risks', () => {
  const doc = read(docPath);
  const quickBlock = read('js/content/block_channel.js');
  const bridge = read('js/content_bridge.js');
  const setupBlock = sliceBetween(quickBlock, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');
  const fallbackMenu = sliceBetween(bridge, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  assert.match(doc, /lifecycleRegistry\.owner/);
  assert.ok(setupBlock.indexOf("document.addEventListener('focusin'") < setupBlock.indexOf('if (!isQuickBlockEnabled()) return;'));
  assert.match(setupBlock, /document\.addEventListener\('yt-navigate-finish'/);
  assert.doesNotMatch(setupBlock, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.match(fallbackMenu, /new MutationObserver/);
  assert.match(fallbackMenu, /setInterval/);
});

test('subagent convergence preserves JSON renderer authority gaps before expansion', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const inventory = read('docs/youtube_renderer_inventory.md');

  for (const token of [
    'compactPlaylistRenderer',
    'showSheetCommand',
    'watchCardRichHeaderRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer'
  ]) {
    assert.ok(doc.includes(token), `missing renderer gap ${token}`);
  }

  assert.match(filterLogic, /compactPlaylistRenderer/);
  assert.match(inventory, /showSheetCommand/);
});

test('subagent convergence preserves engagement side-effect budget blockers', () => {
  const doc = read(docPath);
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const injector = read('js/injector.js');

  assert.match(doc, /engagementSideEffectAuthority/);
  assert.match(doc, /direct watch\/shorts\s+fetches/);
  assert.match(doc, /synthetic clicks/);
  assert.match(doc, /media pause\/stop/);

  assert.match(bridge, /fetchVideoMetaFromWatchUrl/);
  assert.match(fallback, /targetLink\.click\(\)|nextButton\.click\(\)/);
  assert.match(injector, /window\.scrollTo/);
});

test('subagent convergence preserves mutation and release gates before product changes', () => {
  const doc = read(docPath);

  for (const phrase of [
    'ruleMutationAuthority.report',
    'actor class',
    'target profile',
    'lock result',
    'compiled revision',
    'Package roots are broader than manifest truth',
    'release claim expansion'
  ]) {
    assert.ok(doc.includes(phrase), `missing mutation/release phrase ${phrase}`);
  }
});
