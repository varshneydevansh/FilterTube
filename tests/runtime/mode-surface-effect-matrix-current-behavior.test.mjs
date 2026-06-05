import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md';

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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function videoRenderer(overrides = {}) {
  return {
    videoRenderer: {
      videoId: 'modeSurface01',
      title: { runs: [{ text: 'calm piano lesson' }] },
      shortBylineText: {
        runs: [{
          text: 'Trusted Lessons',
          navigationEndpoint: {
            browseEndpoint: {
              browseId: 'UC4444444444444444444444',
              canonicalBaseUrl: '/@trustedlessons'
            }
          }
        }]
      },
      ...overrides
    }
  };
}

function runEngine(contents, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData({ contents }, settings, 'mode-surface-effect-matrix');
}

test('mode surface effect matrix doc treats waterfall as source priority not effect permission', () => {
  const doc = read(docPath);

  for (const phrase of [
    'Status: audit-only proof',
    'Runtime behavior is unchanged',
    'source-priority model',
    'which effects are allowed',
    'modeSurfaceEffectAuthority',
    'FilterTube prefers high-confidence JSON/page/player data',
    'No-rule or disabled mode means zero work'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase: ${phrase}`);
  }
});

test('background compile chooses surface and emits child viewing-space route gate', () => {
  const background = read('js/background.js');
  const messageBlock = sliceBetween(
    background,
    'const requestedProfile = request.profileType;',
    'console.log(`FilterTube Background: Received getCompiledSettings message'
  );
  const compileBlock = sliceBetween(
    background,
    'const mainModeFromV4 = (typeof activeMain.mode ===',
    'const boolFromV4 = (key, legacyValue) => {'
  );

  assert.match(messageBlock, /isKidsUrl\(senderUrl\) \? 'kids' : 'main'/);
  assert.match(compileBlock, /compiledSettings\.listMode = shouldUseKidsProfile \? kidsModeFromV4 : mainModeFromV4/);
  assert.match(compileBlock, /compiledSettings\.profileType = targetProfile/);
  assert.match(compileBlock, /const allowMainViewing = activeSettings\.allowMainViewing !== false/);
  assert.match(compileBlock, /const allowKidsViewing = activeSettings\.allowKidsViewing !== false/);
  assert.match(compileBlock, /compiledSettings\.managedViewingRouteGate = \{/);
  assert.match(compileBlock, /schema: 'filtertube_managed_viewing_space_route_gate'/);
  assert.doesNotMatch(`${messageBlock}\n${compileBlock}`, /runtimeAllowed|modeSurfaceEffectAuthority/);
});

test('profile UI owns viewing-space flags while runtime source lacks enforcement authority token', () => {
  const tabView = read('js/tab-view.js');
  const background = read('js/background.js');
  const accessBlock = sliceBetween(
    tabView,
    'function getProfileViewingAccess(profile) {',
    'function viewingAccessLabel(profile) {'
  );
  const updateBlock = sliceBetween(
    tabView,
    'async function updateProfileViewingAccess(profileId, patch) {',
    'function isUiLocked() {'
  );

  assert.match(accessBlock, /main: settings\.allowMainViewing !== false/);
  assert.match(accessBlock, /kids: settings\.allowKidsViewing !== false/);
  assert.match(updateBlock, /allowMainViewing: nextMain/);
  assert.match(updateBlock, /allowKidsViewing: nextKids/);
  assert.doesNotMatch(background, /modeSurfaceEffectAuthority|profileViewingAuthority|runtimeAllowed/);
});

test('empty blocklist and empty whitelist remain opposite effect policies in JSON engine behavior', () => {
  const input = [videoRenderer()];

  const blocklistResult = runEngine(input, {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  const whitelistResult = runEngine(input, {
    enabled: true,
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: []
  });

  const allowWhitelistResult = runEngine(input, {
    enabled: true,
    listMode: 'whitelist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [{ pattern: 'calm', flags: 'i' }],
    whitelistChannels: []
  });

  assert.deepEqual(plain(blocklistResult), { contents: input });
  assert.deepEqual(plain(whitelistResult), { contents: [] });
  assert.deepEqual(plain(allowWhitelistResult), { contents: input });
});

test('seed no-work logic is route and mode scoped rather than global zero work', () => {
  const seed = read('js/seed.js');
  const skipBlock = sliceBetween(
    seed,
    'function shouldSkipEngineProcessing(data, dataName) {',
    'function processWithEngine(data, dataName)'
  );
  const processBlock = sliceBetween(
    seed,
    'if (shouldSkipEngineProcessing(data, dataName)) {',
    'seedDebugLog(`🔧 Starting to process ${dataName}...`);'
  );

  assert.match(skipBlock, /const isSearchResultsPath = path\.startsWith\('\/results'\)/);
  assert.match(skipBlock, /const isChannelPath = \/\^\(\\\/\(\?:@\|channel\\\/\|c\\\/\)\)\/i\.test\(path\)/);
  assert.match(skipBlock, /const isBrowseFetch = typeof dataName === 'string' && dataName\.startsWith\('fetch:\/youtubei\/v1\/browse'\)/);
  assert.match(skipBlock, /if \(mode !== 'whitelist'\)/);
  assert.match(processBlock, /FilterTubeEngine\.harvestOnly/);
  assert.match(processBlock, /stashNetworkSnapshot\(data, dataName\)/);
});

test('DOM fallback active-work predicate treats whitelist as active and blocklist as rule dependent', () => {
  const dom = read('js/content/dom_fallback.js');
  const predicate = sliceBetween(
    dom,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );

  assert.match(predicate, /if \(settings\.enabled === false\) return false/);
  assert.match(predicate, /const listMode = settings\.listMode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(predicate, /if \(listMode === 'whitelist'\) return true/);
  assert.match(predicate, /hasList\(settings\.filterKeywords\)/);
  assert.match(predicate, /booleanFilterKeys\.some\(key => settings\[key\] === true\)/);
  assert.match(predicate, /categoryFilters\?\.enabled === true/);
});

test('whitelist pending hides are a mode-specific effect separate from source tier', () => {
  const bridge = read('js/content_bridge.js');
  const pendingBlock = sliceBetween(
    bridge,
    'function queueWhitelistPendingHide(mutations, delayMs = 40) {',
    'function fallbackRelevantSelector() {'
  );

  assert.match(pendingBlock, /const listMode = currentSettings\?\.listMode === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(pendingBlock, /if \(listMode !== 'whitelist'\) return/);
  assert.match(pendingBlock, /data-filtertube-whitelist-pending/);
  assert.match(pendingBlock, /element\.classList\.add\('filtertube-hidden'\)/);
  assert.match(pendingBlock, /scheduleWhitelistPendingRecheck\(\)/);
});

test('normal 3-dot menu action is gated, but lifecycle and enrichment need separate budgets', () => {
  const bridge = read('js/content_bridge.js');
  const menuBlock = sliceBetween(
    bridge,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName = (videoCard.tagName || \'\').toLowerCase();'
  );
  const actionBlock = sliceBetween(
    bridge,
    'async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {',
    'async function addChannelDirectly(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = {}) {'
  );

  assert.match(menuBlock, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(menuBlock, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(actionBlock, /enrichVisibleShortsWithChannelInfo/);
  assert.match(actionBlock, /enrichVisiblePlaylistRowsWithChannelInfo/);
  assert.doesNotMatch(actionBlock, /modeSurfaceEffectAuthority|postActionIdentityFanoutBudget/);
});

test('surface-specific docs name YTM Kids Shorts watch playlist Mix comments and posts as separate proof rows', () => {
  const doc = read(docPath);

  for (const surface of [
    'Kids surface',
    'YTM/mobile surface',
    'Watch/current video',
    'Shorts',
    'Playlist/Mix',
    'Comments/posts',
    'Native overlays/fullscreen'
  ]) {
    assert.ok(doc.includes(surface), `missing surface row ${surface}`);
  }

  assert.match(doc, /Settings Mode Cross-Feature Continuation - 2026-05-28/);
  assert.match(doc, /settings mode, rule\s+state, feature flag, and surface decide the allowed effect together/);
  assert.match(doc, /optimization authority: NO-GO until each edge has fixtures and budgets/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /Runtime behavior changed by this continuation: no/);

  for (const state of [
    'Empty blocklist',
    'Empty whitelist',
    'Disabled settings',
    'Content-control flags',
    'Quick block and normal menu',
    'Native overlay/fullscreen/app shell'
  ]) {
    assert.ok(doc.includes(`| ${state} |`), `missing continuation row ${state}`);
  }

  for (const boundary of [
    'Do not collapse empty blocklist into a global zero-work state',
    'Do not reuse blocklist no-work shortcuts for whitelist',
    'No-rule optimization must include content-control validity and route ownership',
    'Keep action affordance, lifecycle, and post-action fanout as distinct budgets',
    'Native quieting cannot be treated as a global lifecycle off switch'
  ]) {
    assert.ok(doc.includes(boundary), `missing boundary ${boundary}`);
  }
});

test('runtime source lacks the future mode surface effect authority tokens', () => {
  const combined = [
    'js/background.js',
    'js/seed.js',
    'js/filter_logic.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/tab-view.js',
    'js/state_manager.js',
    'js/settings_shared.js'
  ].map(read).join('\n');

  for (const token of [
    'modeSurfaceEffectAuthority',
    'modeSurfaceEffectDecision',
    'profileModeSurfacePolicy',
    'emptyListModePolicy',
    'surfaceModeEffectBudget',
    'runtimeViewingSpacePolicy'
  ]) {
    assert.doesNotMatch(combined, new RegExp(token), `runtime should not yet contain ${token}`);
  }
});
