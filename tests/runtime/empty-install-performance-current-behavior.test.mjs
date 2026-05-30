import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

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

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
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
    showQuickBlockButton: false,
    showBlockMenuItem: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function homeContinuationPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'abcdefghijk',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

test('empty-install performance audit documents no-rule work and required future gates', () => {
  const doc = source('docs/audit/FILTERTUBE_EMPTY_INSTALL_PERFORMANCE_AUDIT_2026-05-18.md');
  const releaseDoc = source('docs/audit/FILTERTUBE_RELEASE_REGRESSION_LAG_AND_BLOCKLIST_FIX_2026-05-26.md');

  for (const phrase of [
    'Empty Install Definition',
    'Current No-Rule Work Map',
    'Mobile home browse',
    'Fallback menu',
    'Quick block',
    'compiledRuleState',
    'endpointPolicy',
    'page lifecycle registry',
    'zero DOM scans'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(releaseDoc, /Empty\/no-rule mode: YouTube should not pay JSON engine or DOM scan work/);
  assert.match(releaseDoc, /Quick-block and menu affordances may keep minimal page-level entrypoints/);
  assert.match(releaseDoc, /must not run periodic full-page sweeps, desktop body observers, or eager menu body observation/);
});

test('seed fetch interception returns native fetch promise before response hooks when no JSON work is active', () => {
  const seed = source('js/seed.js');
  const fetchHook = sliceBetween(
    seed,
    'window.fetch = function(resource, init) {',
    '        seedDebugLog("✅ Fetch interception established");'
  );

  assert.match(fetchHook, /const dataName = `fetch:\$\{getPathname\(urlStr\)\}`;\s*if \(shouldBypassYouTubeiNetworkResponse\(dataName\)\) \{\s*return originalFetch\.apply\(this, arguments\);\s*\}/);
  assert.equal(
    countLiteral(fetchHook, 'shouldBypassYouTubeiNetworkResponse(dataName)'),
    1,
    'fetch bypass should be decided once before attaching response processing'
  );
});

test('empty blocklist passes mobile browse player watch-next and guide endpoints through without body work', async () => {
  const cases = [
    {
      name: 'mobile browse',
      runtime: {
        hostname: 'm.youtube.com',
        origin: 'https://m.youtube.com',
        pathname: '/',
        payload: homeContinuationPayload()
      },
      url: 'https://m.youtube.com/youtubei/v1/browse?prettyPrint=false',
      dataName: 'fetch:/youtubei/v1/browse'
    },
    {
      name: 'player',
      runtime: {
        pathname: '/watch',
        payload: { playabilityStatus: { status: 'OK' }, videoDetails: { title: 'Calm watch video' } }
      },
      url: 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
      dataName: 'fetch:/youtubei/v1/player'
    },
    {
      name: 'watch next',
      runtime: {
        pathname: '/watch',
        payload: {
          contents: {
            twoColumnWatchNextResults: {
              secondaryResults: { secondaryResults: { results: [] } }
            }
          }
        }
      },
      url: 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false',
      dataName: 'fetch:/youtubei/v1/next'
    },
    {
      name: 'guide',
      runtime: {
        pathname: '/',
        payload: { items: [{ guideEntryRenderer: { formattedTitle: { simpleText: 'Subscriptions' } } }] }
      },
      url: 'https://www.youtube.com/youtubei/v1/guide?prettyPrint=false',
      dataName: 'fetch:/youtubei/v1/guide'
    }
  ];

  for (const item of cases) {
    const runtime = loadSeedRuntime(item.runtime);
    runtime.window.filterTube.updateSettings(settings());

    await runtime.window.fetch(item.url);

    assert.equal(runtime.calls.harvestOnly.length, 0, `${item.name}: unexpected harvest-only`);
    assert.equal(runtime.calls.processData.length, 0, `${item.name}: unexpected processData`);
    assert.equal(runtime.calls.responseJson.length, 0, `${item.name}: unexpected response clone JSON parse`);
    assert.equal(runtime.calls.jsonStringify.length, 0, `${item.name}: unexpected rewritten response body`);
  }
});

test('empty blocklist search and desktop home fast paths are true pass-through before JSON parse', async () => {
  const cases = [
    {
      name: 'search',
      runtime: {
        pathname: '/results',
        payload: {
          header: { searchHeaderRenderer: {} },
          onResponseReceivedCommands: [{
            appendContinuationItemsAction: {
              continuationItems: [{ videoRenderer: { videoId: 'abcdefghijk' } }]
            }
          }]
        }
      },
      url: 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false'
    },
    {
      name: 'desktop home',
      runtime: {
        hostname: 'www.youtube.com',
        pathname: '/',
        payload: homeContinuationPayload()
      },
      url: 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false'
    }
  ];

  for (const item of cases) {
    const runtime = loadSeedRuntime(item.runtime);
    runtime.window.filterTube.updateSettings(settings());

    await runtime.window.fetch(item.url);

    assert.equal(runtime.calls.processData.length, 0, `${item.name}: expected no processData`);
    assert.equal(runtime.calls.harvestOnly.length, 0, `${item.name}: unexpected harvest-only`);
    assert.equal(runtime.calls.responseJson.length, 0, `${item.name}: unexpected response clone JSON parse`);
    assert.equal(runtime.calls.jsonStringify.length, 0, `${item.name}: unexpected response stringify`);
  }
});

test('disabled filtering passes intercepted YouTubei responses through before JSON parse', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  runtime.window.filterTube.updateSettings(settings({ enabled: false }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('settings-not-loaded seed path does not parse stringify clone or replay no-rule data', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: {
      contents: {
        twoColumnWatchNextResults: {
          secondaryResults: { secondaryResults: { results: [] } }
        }
      }
    }
  });

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  runtime.window.ytInitialData = homeContinuationPayload();

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.getStats().queuedItems, 1);

  runtime.window.filterTube.updateSettings(settings());

  assert.equal(runtime.window.filterTube.getStats().queuedItems, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
  assert.equal(runtime.window.filterTube.rawYtInitialData, null);
});

test('active keyword rule still runs JSON-first fetch processing', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: {
      contents: {
        twoColumnWatchNextResults: {
          secondaryResults: { secondaryResults: { results: [] } }
        }
      }
    }
  });
  runtime.window.filterTube.updateSettings(settings({ filterKeywords: ['spider'] }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
});

test('hide all comments keeps the fetch continuation shortcut active', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: {
      onResponseReceivedEndpoints: [{
        appendContinuationItemsAction: {
          continuationItems: [{ commentThreadRenderer: { comment: { commentRenderer: {} } } }]
        }
      }]
    }
  });
  runtime.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.deepEqual(
    body.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems,
    [{
      continuationItemRenderer: {
        trigger: 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN',
        continuationEndpoint: null
      }
    }]
  );
});

test('blank category selection is no JSON work but selected category remains active', async () => {
  const blank = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  blank.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, selected: [] }
  }));

  await blank.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(blank.calls.processData.length, 0);
  assert.equal(blank.calls.responseJson.length, 0);
  assert.equal(blank.calls.jsonStringify.length, 0);

  const selected = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  selected.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, selected: ['music'] }
  }));

  await selected.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(selected.calls.processData.length, 1);
  assert.equal(selected.calls.responseJson.length, 1);
  assert.equal(selected.calls.jsonStringify.length, 1);
});

test('DOM fallback empty blocklist predicate gates mutation and prefetch lifecycle work', () => {
  const fallback = source('js/content/dom_fallback.js');
  const bridge = source('js/content_bridge.js');
  const bridgeSettings = source('js/content/bridge_settings.js');
  const predicate = sliceBetween(
    fallback,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );
  const initializer = sliceBetween(
    bridge,
    'async function initializeDOMFallback(settings) {',
    'let fallbackMenuButtonsInstalled = false;'
  );

  assert.match(predicate, /if \(!settings \|\| typeof settings !== 'object'\) return false/);
  assert.match(predicate, /if \(settings\.enabled === false\) return false/);
  assert.match(predicate, /if \(listMode === 'whitelist'\) return true/);
  assert.match(predicate, /hasList\(settings\.filterKeywords\)/);
  assert.match(predicate, /categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);
  assert.match(initializer, /applyDOMFallback\(settings\)/);
  assert.match(initializer, /ensureFallbackMenuButtons\(\)/);
  assert.match(initializer, /const observer = new MutationObserver/);
  assert.match(initializer, /function refreshDOMFallbackMutationObserver\(\)/);
  assert.match(initializer, /if \(!hasActiveFallbackLifecycleWork\(\)\) \{\s*disconnectFallbackMutationObserver\(\);\s*return false;/);
  assert.match(initializer, /observer\.observe\(target, \{ childList: true, subtree: true \}\)/);
  assert.match(initializer, /window\.FilterTube_refreshDOMFallbackObserver = refreshDOMFallbackMutationObserver/);
  assert.match(initializer, /refreshDOMFallbackMutationObserver\(\)/);
  assert.match(initializer, /refreshFilterTubeRuntimeObservers\(\)/);
  assert.match(bridge, /function refreshFilterTubeRuntimeObservers\(\) \{/);
  assert.match(bridge, /startCardPrefetchObserver\(\)/);
  assert.match(bridge, /installPlaylistPanelPrefetchHook\(\)/);
  assert.match(bridge, /installRightRailWhitelistObserver\(\)/);
  assert.match(bridge, /function needsIdentityPrefetchWork\(settings\) \{/);
  assert.match(bridge, /if \(!needsIdentityPrefetchWork\(currentSettings\)\) return/);
  assert.match(bridge, /return bridgeHasList\(settings\.filterChannels\)/);
  assert.match(bridgeSettings, /function refreshRuntimeObserversAfterSettingsUpdate\(\) \{/);
  assert.match(bridgeSettings, /refreshRuntimeObserversAfterSettingsUpdate\(\)/);
});

test('quick block action is disabled by default and desktop eager sweeps are lazy', () => {
  const text = source('js/content/block_channel.js');
  const enabledBlock = sliceBetween(text, 'const isQuickBlockEnabled = () => {', 'function ensureQuickBlockStyles()');
  const enabledGateOnly = sliceBetween(text, 'const isQuickBlockEnabled = () => {', 'function hasActiveQuickBlockRuleContext(settings) {');
  const setupBlock = sliceBetween(text, 'function setupQuickBlockObserver() {', 'function setupMenuObserver() {');

  assert.match(enabledBlock, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(enabledBlock, /currentSettings\.enabled === false/);
  assert.match(enabledBlock, /currentSettings\.listMode === 'whitelist'/);
  assert.doesNotMatch(enabledGateOnly, /hasActiveQuickBlockRuleContext/);
  assert.match(enabledBlock, /function hasActiveQuickBlockRuleContext\(settings\) \{/);
  assert.match(enabledBlock, /Quick-block is the entry point for creating the first channel rule/);
  assert.match(enabledBlock, /return true/);
  assert.match(enabledBlock, /function shouldEagerQuickBlockSweep\(\) \{\s*return isMobileYouTubeSurface\(\);\s*\}/);
  assert.match(setupBlock, /if \(quickBlockObserverStarted\) return true;\s*if \(!isQuickBlockEnabled\(\)\) return false;/);
  assert.match(setupBlock, /ensureQuickBlockStyles\(\)/);
  assert.match(setupBlock, /document\.addEventListener\('focusin'/);
  assert.match(setupBlock, /document\.addEventListener\('scroll'/);
  assert.match(setupBlock, /window\.addEventListener\('resize'/);
  assert.match(setupBlock, /window\.addEventListener\('orientationchange'/);
  assert.match(setupBlock, /if \(shouldEagerQuickBlockSweep\(\)\) \{\s*scheduleQuickBlockSweep\(document\);\s*\}/);
  assert.match(setupBlock, /if \(shouldEagerQuickBlockSweep\(\)\) \{\s*const observer = new MutationObserver/);
  assert.match(setupBlock, /observer\.observe\(document\.body, \{ childList: true, subtree: true \}\)/);
  assert.match(setupBlock, /const targetHost = getHostFromCachedTarget\(target\)/);
  assert.match(setupBlock, /if \(!lastHost && !targetHost\) return/);
  assert.match(setupBlock, /document\.addEventListener\('yt-navigate-finish'/);
  assert.doesNotMatch(setupBlock, /quickBlockPeriodicTimer = window\.setInterval/);
  assert.ok(
    setupBlock.indexOf('if (!isQuickBlockEnabled()) return false;') < setupBlock.indexOf("document.addEventListener('focusin'"),
    'quick-block enablement gate runs before page listeners are installed'
  );
});

test('fallback menu lifecycle keeps desktop scans hover lazy without sharing normal menu gates', () => {
  const text = source('js/content_bridge.js');
  const normalMenu = sliceBetween(
    text,
    'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
    'const videoCardTagName ='
  );
  const fallback = sliceBetween(
    text,
    'function ensureFallbackMenuButtons() {',
    'let playlistFallbackPopoverState = null;'
  );

  assert.match(normalMenu, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(normalMenu, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(fallback, /const observer = new MutationObserver/);
  assert.match(text, /function shouldEagerFallbackMenuScan\(\) \{/);
  assert.match(text, /if \(shouldEagerFallbackMenuScan\(\) && typeof fallbackMenuButtonsRescan === 'function'\)/);
  assert.match(fallback, /if \(!shouldEagerFallbackMenuScan\(\)\) return/);
  assert.match(fallback, /if \(shouldEagerFallbackMenuScan\(\)\) \{\s*if \(!observeTarget\(\)\)/);
  assert.match(fallback, /document\.addEventListener\('yt-navigate-finish'/);
  assert.match(fallback, /document\.addEventListener\('click'/);
  assert.match(fallback, /document\.addEventListener\('pointerover', scheduleHoveredFallbackCard/);
  assert.match(fallback, /document\.addEventListener\('focusin', scheduleHoveredFallbackCard/);
  assert.match(fallback, /const clickedFallbackSurface =/);
  assert.match(fallback, /if \(!clickedFallbackSurface\) return/);
  assert.match(fallback, /scheduleScan\(clickedFallbackSurface\)/);
  assert.match(fallback, /window\.addEventListener\('scroll'/);
  assert.match(fallback, /if \(!shouldEagerFallbackMenuScan\(\)\) return;\s*if \(isFilterTubeNativeOverlayQuietMode\(\)\)/);
  assert.match(fallback, /const scanVisible = \(\) => \{/);
  assert.match(fallback, /skippedOffscreen/);
  assert.match(fallback, /if \(shouldEagerFallbackMenuScan\(\)\) scheduleVisibleScan\(\)/);
  assert.match(fallback, /if \(shouldEagerFallbackMenuScan\(\)\) \{\s*let warmupScans = 0;\s*const warmupTimer = setInterval/);
  assert.match(fallback, /const warmupTimer = setInterval/);
  assert.doesNotMatch(fallback, /showBlockMenuItem/);
  assert.doesNotMatch(fallback, /listMode === 'whitelist'/);
});

test('blank enabled category is inactive in seed and DOM while content filters still use enabled flags', () => {
  const seed = source('js/seed.js');
  const fallback = source('js/content/dom_fallback.js');
  const seedPredicate = sliceBetween(
    seed,
    'function shouldSkipEngineProcessing(data, dataName) {',
    'function processWithEngine(data, dataName) {'
  );
  const fallbackPredicate = sliceBetween(
    fallback,
    'function hasActiveDOMFallbackWork(settings) {',
    'function clearStaleDOMFallbackVisibility() {'
  );

  assert.match(seed, /function hasNetworkJsonWork\(settings\) \{/);
  assert.match(seed, /function getDebugPayloadSize\(data\) \{/);
  assert.match(seed, /if \(!cachedSettings\) \{\s*seedDebugLog\(`⏭️ Passing through \$\{dataName\} before JSON parse \(settings not loaded\)`\);\s*return true;\s*\}/);
  assert.match(seed, /if \(!hasNetworkJsonWork\(cachedSettings\)\) \{\s*pendingDataQueue = \[\];/);
  assert.match(seed, /function hasSelectedCategoryFilters\(settings\) \{/);
  assert.match(seedPredicate, /hasEnabledContentFilters\(cachedSettings\)/);
  assert.match(seedPredicate, /hasActiveJsonFilterRules\(cachedSettings\)/);
  assert.match(seed, /settings\?\.categoryFilters\?\.enabled === true/);
  assert.match(seed, /hasList\(settings\.categoryFilters\.selected\)/);
  assert.doesNotMatch(seedPredicate, /fromDate/);
  assert.doesNotMatch(seedPredicate, /minMinutes/);

  assert.match(fallbackPredicate, /contentFilters\?\.duration\?\.enabled === true/);
  assert.match(fallbackPredicate, /contentFilters\?\.uploadDate\?\.enabled === true/);
  assert.match(fallbackPredicate, /return categoryFilters\?\.enabled === true && hasList\(categoryFilters\.selected\)/);
});
