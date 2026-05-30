import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistKeywords: [],
    whitelistChannels: [],
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

function homeContinuationPayload() {
  return {
    onResponseReceivedActions: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          richItemRenderer: {
            content: {
              videoRenderer: {
                videoId: 'home0000001',
                title: { runs: [{ text: 'Calm home card' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function searchPayload() {
  return {
    header: { searchHeaderRenderer: {} },
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{ videoRenderer: { videoId: 'search00001' } }]
      }
    }]
  };
}

function appendCommentPayload() {
  return {
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          commentThreadRenderer: {
            comment: {
              commentRenderer: {
                commentId: 'Ugw-seed-comment',
                contentText: { runs: [{ text: 'Comment body' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

function reloadCommentPayload() {
  return {
    onResponseReceivedEndpoints: [{
      reloadContinuationItemsCommand: {
        continuationItems: [{
          commentThreadRenderer: {
            comment: {
              commentRenderer: {
                commentId: 'Ugw-seed-reload-comment',
                contentText: { runs: [{ text: 'Reloaded comment body' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

test('seed fetch no-work/list-mode audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior changed for no-active-JSON-work fetches/);
  assert.match(doc, /fetch pass-through addendum/);
  assert.match(doc, /not completion proof for all seed fetch no-work authority/);

  const source = read('js/seed.js');
  assert.equal(lineCount(source), 1136);
  assert.equal(Buffer.byteLength(source), 50026);
  assert.equal(sha256('js/seed.js'), 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');
  assert.ok(doc.includes('`js/seed.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('seed fetch no-work/list-mode source counts remain pinned', () => {
  const doc = read(docPath);
  const seed = read('js/seed.js');

  const shouldSkipBlock = sliceBetween(seed, '    function shouldSkipEngineProcessing(data, dataName) {', '    function processWithEngine(data, dataName) {');
  const processWithEngineBlock = sliceBetween(seed, '    function processWithEngine(data, dataName) {', "    /**\n     * Basic fallback processing when the main engine isn't available");
  const fetchInterceptionBlock = sliceBetween(seed, '    function setupFetchInterception() {', '    function setupXhrInterception() {');
  const fetchEndpointListBlock = sliceBetween(seed, '        const fetchEndpoints = [', '        const getPathname = (rawUrl) => {');
  const fetchBodyWorkBlock = sliceBetween(seed, '            return originalFetch.apply(this, arguments).then(response => {', '        };\n\n        seedDebugLog("✅ Fetch interception established");');
  const commentShortcutBlock = sliceBetween(seed, '                    // Special handling for comment requests when hideAllComments is enabled', '                    // Normal processing for non-comment or non-hideAllComments requests');
  const xhrInterceptionBlock = sliceBetween(seed, '    function setupXhrInterception() {', '    // ============================================================================\n    // SETTINGS MANAGEMENT');

  assert.equal(lineCount(shouldSkipBlock), 120);
  assert.equal(Buffer.byteLength(shouldSkipBlock), 5578);
  assert.equal(lineCount(processWithEngineBlock), 104);
  assert.equal(Buffer.byteLength(processWithEngineBlock), 4982);
  assert.equal(lineCount(fetchInterceptionBlock), 91);
  assert.equal(Buffer.byteLength(fetchInterceptionBlock), 4430);
  assert.equal(lineCount(fetchEndpointListBlock), 8);
  assert.equal(Buffer.byteLength(fetchEndpointListBlock), 217);
  assert.equal(lineCount(fetchBodyWorkBlock), 54);
  assert.equal(Buffer.byteLength(fetchBodyWorkBlock), 3140);
  assert.equal(lineCount(commentShortcutBlock), 37);
  assert.equal(Buffer.byteLength(commentShortcutBlock), 2269);
  assert.equal(lineCount(xhrInterceptionBlock), 219);
  assert.equal(Buffer.byteLength(xhrInterceptionBlock), 10322);

  for (const [literal, expected] of [
    ['fetchEndpoints', 2],
    ['/youtubei/v1/search', 1],
    ['/youtubei/v1/guide', 1],
    ['/youtubei/v1/browse', 1],
    ['/youtubei/v1/next', 2],
    ['/youtubei/v1/player', 1],
    ['response.clone().json', 1],
    ['JSON.stringify', 2],
    ['processWithEngine', 1],
    ['hideAllComments', 3],
    ['new Response', 2],
    ['response.ok', 1],
    ['shouldBypassYouTubeiNetworkResponse', 1]
  ]) {
    assert.equal(countLiteral(fetchInterceptionBlock, literal), expected, `fetch ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ['cachedSettings.enabled === false', 1],
    ['shouldSkipEngineProcessing', 1],
    ['harvestOnly', 4],
    ['queueForLater', 4],
    ['pendingDataQueue', 4],
    ['window.FilterTubeEngine.processData', 2],
    ['return data', 6],
    ['stashNetworkSnapshot', 3],
    ['hasNetworkJsonWork', 1]
  ]) {
    assert.equal(countLiteral(processWithEngineBlock, literal), expected, `processWithEngine ${literal} count changed`);
  }

  for (const [literal, expected] of [
    ["mode !== 'whitelist'", 2],
    ['hasEnabledContentFilters', 1],
    ['hasActiveJsonFilterRules', 1],
    ['activeContentFilters', 4],
    ['activeJsonFilterRules', 4],
    ['categoryFilters?.enabled === true', 0],
    ['isSearchResultsPath', 2],
    ['isChannelPath', 2],
    ['isBrowseFetch', 2],
    ['isOnHomeFeed', 2],
    ['isMobileInterface', 1]
  ]) {
    assert.equal(countLiteral(shouldSkipBlock, literal), expected, `shouldSkip ${literal} count changed`);
  }

  for (const phrase of [
    'seed fetch no-work/list-mode boundary source files: 1',
    'shouldSkipEngineProcessing block lines: 120',
    'processWithEngine block lines: 104',
    'setupFetchInterception block lines: 91',
    'fetch endpoint list block lines: 8',
    'fetch body-work block lines: 54',
    'fetch comment shortcut block lines: 37',
    'runtime seed fetch no-work/list-mode fixtures: 10'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('search empty blocklist passes through without parse stringify or harvest-only', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('search whitelist mode runs processData instead of the empty-blocklist harvest-only path', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCwhitelistfetch00000000' }]
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
});

test('boolean content-filter settings activate seed JSON work', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: {
      duration: { enabled: true },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
});

test('malformed truthy content-filter settings do not activate seed JSON work', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    contentFilters: {
      duration: { enabled: 'true' },
      uploadDate: { enabled: 1 },
      uppercase: { enabled: 'yes' }
    }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('disabled and missing-settings fetches pass through without body work', async () => {
  const disabledRuntime = loadSeedRuntime({
    pathname: '/',
    payload: homeContinuationPayload()
  });
  disabledRuntime.window.filterTube.updateSettings(settings({ enabled: false }));

  await disabledRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(disabledRuntime.calls.harvestOnly.length, 0);
  assert.equal(disabledRuntime.calls.processData.length, 0);
  assert.equal(disabledRuntime.calls.responseJson.length, 0);
  assert.equal(disabledRuntime.calls.jsonStringify.length, 0);

  const missingSettingsRuntime = loadSeedRuntime({
    pathname: '/',
    payload: homeContinuationPayload()
  });

  await missingSettingsRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(missingSettingsRuntime.calls.harvestOnly.length, 0);
  assert.equal(missingSettingsRuntime.calls.processData.length, 0);
  assert.equal(missingSettingsRuntime.calls.responseJson.length, 0);
  assert.equal(missingSettingsRuntime.calls.jsonStringify.length, 0);
});

test('desktop and mobile home empty-blocklist fetches share pass-through no-work behavior', async () => {
  const desktopRuntime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  desktopRuntime.window.filterTube.updateSettings(settings());

  await desktopRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(desktopRuntime.calls.harvestOnly.length, 0);
  assert.equal(desktopRuntime.calls.processData.length, 0);
  assert.equal(desktopRuntime.calls.responseJson.length, 0);
  assert.equal(desktopRuntime.calls.jsonStringify.length, 0);

  const mobileRuntime = loadSeedRuntime({
    hostname: 'm.youtube.com',
    origin: 'https://m.youtube.com',
    pathname: '/',
    payload: homeContinuationPayload()
  });
  mobileRuntime.window.filterTube.updateSettings(settings());

  await mobileRuntime.window.fetch('https://m.youtube.com/youtubei/v1/browse?prettyPrint=false');

  assert.equal(mobileRuntime.calls.harvestOnly.length, 0);
  assert.equal(mobileRuntime.calls.processData.length, 0);
  assert.equal(mobileRuntime.calls.responseJson.length, 0);
  assert.equal(mobileRuntime.calls.jsonStringify.length, 0);
});

test('empty selected category is inactive for search fetch JSON work', async () => {
  const runtime = loadSeedRuntime({
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings({
    categoryFilters: { enabled: true, mode: 'block', selected: [] }
  }));

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.responseJson.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 0);
});

test('append comments shortcut bypasses engine but reload comments still call processData', async () => {
  const appendRuntime = loadSeedRuntime({
    pathname: '/watch',
    payload: appendCommentPayload()
  });
  appendRuntime.window.filterTube.updateSettings(settings({
    hideAllComments: true
  }));

  const appendResponse = await appendRuntime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const appendBody = await appendResponse.json();
  const appendItems = appendBody.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;

  assert.equal(appendRuntime.calls.harvestOnly.length, 0);
  assert.equal(appendRuntime.calls.processData.length, 0);
  assert.equal(appendItems?.[0]?.continuationItemRenderer?.continuationEndpoint, null);

  const reloadRuntime = loadSeedRuntime({
    pathname: '/watch',
    payload: reloadCommentPayload()
  });
  reloadRuntime.window.filterTube.updateSettings(settings({
    hideAllComments: true
  }));

  await reloadRuntime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(reloadRuntime.calls.harvestOnly.length, 0);
  assert.equal(reloadRuntime.calls.processData.length, 1);
  assert.equal(reloadRuntime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
});

test('product runtime still lacks first-class seed fetch no-work authority symbols', () => {
  const source = productRuntimeSource();

  for (const symbol of [
    'jsonFirstSeedFetchNoWorkListModeContract',
    'jsonFirstSeedFetchWorkDecisionReport',
    'jsonFirstSeedFetchParseStringifyBudget',
    'jsonFirstSeedFetchDisabledPassThroughPolicy',
    'jsonFirstSeedFetchMissingSettingsQueueReport',
    'jsonFirstSeedFetchHarvestOnlyPolicy',
    'jsonFirstSeedFetchMobileHomePolicy',
    'jsonFirstSeedFetchCategorySelectedPolicy',
    'jsonFirstSeedFetchCommentContinuationPolicy',
    'jsonFirstSeedFetchNoWorkFixtureProvenance'
  ]) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.ok(read(docPath).includes(symbol), `${symbol} missing from audit doc`);
  }
});
