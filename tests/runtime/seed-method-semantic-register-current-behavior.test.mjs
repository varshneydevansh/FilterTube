import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'js/seed.js';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const hotRuntimeMethodRegisterDocs = [
  docPath,
  'docs/audit/FILTERTUBE_BLOCK_CHANNEL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_HANDLE_RESOLVER_METHOD_SEMANTIC_REGISTER_2026-05-21.md'
];
const broadCallableRe = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>|(?:^|\n)\s*([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?function\s*\(|(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function groupForRow(row) {
  const name = row.name;

  if (['seedIifeEntrypoint', 'filterTubeSeedDebugEnabled.initializer'].includes(name)) return 'bootstrapAndIdempotency';
  if (['stashNetworkSnapshot', 'replayPendingQueueIfReady', 'scheduleReplay', 'replayTimer.setTimeout', 'shouldCaptureRawSnapshot'].includes(name)) return 'snapshotAndReplayQueue';
  if (['isSeedDebugEnabled', 'seedDebugLog', 'cloneData', 'getDebugPayloadSize'].includes(name)) return 'debugAndCloneHelpers';
  if ([
    'hasList',
    'hasEnabledContentFilters',
    'hasSelectedCategoryFilters',
    'hasActiveJsonFilterRules',
    'hasNetworkJsonWork',
    'shouldBypassYouTubeiNetworkResponse',
    'shouldSkipEngineProcessing',
    'processWithEngine',
    'queueForLater',
    'basicProcessing'
  ].includes(name)) return 'engineDispatchAndNoWorkBoundary';
  if (['establishDataHooks', 'ytInitialData.get', 'ytInitialData.set', 'ytInitialPlayerResponse.get', 'ytInitialPlayerResponse.set'].includes(name)) return 'initialDataHooksAndAccessors';
  if (['setupFetchInterception', 'window.fetch'].includes(name)) return 'fetchInterception';
  if (name === 'getPathname' && row.line < 760) return 'fetchInterception';
  if ([
    'setupXhrInterception',
    'XMLHttpRequest.prototype.addEventListener',
    'XMLHttpRequest.prototype.removeEventListener',
    'XMLHttpRequest.prototype.open',
    'XMLHttpRequest.prototype.send',
    'getWrappedListener',
    'getWrappedListener.wrapped',
    'ensureXhrResponseProcessed',
    'processIfReady',
    'XMLHttpRequest.response.get',
    'XMLHttpRequest.responseText.get'
  ].includes(name)) return 'xhrInterception';
  if (name === 'getPathname' && row.line > 760) return 'xhrInterception';
  if (['updateSettings', 'window.filterTube.getStats'].includes(name)) return 'settingsRelayAndGlobalInterface';

  return 'UNCLASSIFIED';
}

function seedRows() {
  const source = read('js/seed.js');
  const lines = source.split(/\r?\n/);
  const rows = [];
  let accessorTarget = null;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^    function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) rows.push({ line: lineNumber, scope: 'topLevelFunction', name: match[1] });

    match = line.match(/^\s{8,}const\s+(queueForLater|getPathname|getWrappedListener|ensureXhrResponseProcessed)\s*=\s*/);
    if (match) rows.push({ line: lineNumber, scope: 'localHelperFunction', name: match[1] });

    match = line.match(/^\s{8,}const\s+(processIfReady)\s*=\s*function\s*\(/);
    if (match) rows.push({ line: lineNumber, scope: 'localHelperFunction', name: match[1] });

    if (line.includes('const wrapped = function ()')) rows.push({ line: lineNumber, scope: 'localCallbackFunction', name: 'getWrappedListener.wrapped' });
    if (line.includes('replayTimer = setTimeout(() =>')) rows.push({ line: lineNumber, scope: 'timerCallback', name: 'replayTimer.setTimeout' });
    if (line.includes('window.fetch = function')) rows.push({ line: lineNumber, scope: 'pagePatchFunction', name: 'window.fetch' });
    if (line.includes('proto.addEventListener = function')) rows.push({ line: lineNumber, scope: 'pagePatchFunction', name: 'XMLHttpRequest.prototype.addEventListener' });
    if (line.includes('proto.removeEventListener = function')) rows.push({ line: lineNumber, scope: 'pagePatchFunction', name: 'XMLHttpRequest.prototype.removeEventListener' });
    if (line.includes('proto.open = function')) rows.push({ line: lineNumber, scope: 'pagePatchFunction', name: 'XMLHttpRequest.prototype.open' });
    if (line.includes('proto.send = function')) rows.push({ line: lineNumber, scope: 'pagePatchFunction', name: 'XMLHttpRequest.prototype.send' });
    if (/^        getStats: function\(\)/.test(line)) rows.push({ line: lineNumber, scope: 'globalObjectMethod', name: 'window.filterTube.getStats' });

    if (line.includes("Object.defineProperty(window, 'ytInitialData'")) accessorTarget = 'ytInitialData';
    if (line.includes("Object.defineProperty(window, 'ytInitialPlayerResponse'")) accessorTarget = 'ytInitialPlayerResponse';
    if (line.includes("Object.defineProperty(xhr, 'response'")) accessorTarget = 'XMLHttpRequest.response';
    if (line.includes("Object.defineProperty(xhr, 'responseText'")) accessorTarget = 'XMLHttpRequest.responseText';
    if (accessorTarget && /get: function\s*\(/.test(line)) {
      rows.push({ line: lineNumber, scope: 'propertyAccessorFunction', name: `${accessorTarget}.get` });
    }
    if (accessorTarget && /set: function\s*\(/.test(line)) {
      rows.push({ line: lineNumber, scope: 'propertyAccessorFunction', name: `${accessorTarget}.set` });
    }
    if (accessorTarget && line.trim() === '});') accessorTarget = null;
  });

  rows.push({ line: 4, scope: 'bootstrapEntrypoint', name: 'seedIifeEntrypoint' });
  rows.push({ line: 25, scope: 'bootstrapEntrypoint', name: 'filterTubeSeedDebugEnabled.initializer' });

  return rows
    .sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
    .map(row => ({ ...row, group: groupForRow(row) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function countByName(values) {
  const out = {};
  for (const value of values) out[value] = (out[value] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sourceStats(file) {
  const text = read(file);
  return {
    bytes: readBuffer(file).length,
    sha256: sha256(file),
    splitLines: text.split(/\r?\n/).length
  };
}

function broadCallableRows() {
  const rows = [];
  const src = read(sourcePath);
  let match;
  while ((match = broadCallableRe.exec(src))) {
    rows.push(match.slice(1).find(Boolean));
  }
  broadCallableRe.lastIndex = 0;
  return rows;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
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

function commentContinuationPayload() {
  return {
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          commentThreadRenderer: {
            comment: {
              commentRenderer: {
                contentText: { runs: [{ text: 'visible comment' }] }
              }
            }
          }
        }]
      }
    }]
  };
}

test('seed method semantic register is audit-only and scoped to current behavior', () => {
  const text = doc();
  const stats = sourceStats(sourcePath);

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/seed\.js/);
  assert.match(text, /runtime owner: main-world seed runtime/);
  assert.match(text, /global interface: window\.filterTube/);
  assert.equal(stats.splitLines, 1137);
  assert.equal(stats.bytes, 50026);
  assert.equal(stats.sha256, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d');
  assert.match(text, /split source lines: 1137/);
  assert.match(text, /wc line count: 1136/);
  assert.match(text, /source bytes: 50026/);
  assert.match(text, /source sha256: a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d/);
  assert.match(text, /broad lexical matches: 92/);
  assert.match(text, /method and callback rows: 43/);
  assert.match(text, /accepted declaration\/inventory rows: 43/);
  assert.match(text, /semantic method rows promoted: 43/);
  assert.match(text, /top-level function declarations: 21/);
  assert.match(text, /local helper functions: 6/);
  assert.match(text, /page\/prototype patch functions: 5/);
  assert.match(text, /property accessor functions: 6/);
  assert.match(text, /timer callbacks: 1/);
  assert.match(text, /semantic method groups: 8/);
  assert.match(text, /control-flow lexical artifacts: 58/);
  assert.match(text, /file-local executable proof probes: 7/);
  assert.match(text, /not completion proof for every inline array predicate callback/);
});

test('hot-runtime method semantic registers carry the method proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  for (const marker of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5827',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5827',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(marker), `method gap source missing ${marker}`);
  }

  assert.equal(hotRuntimeMethodRegisterDocs.length, 5);
  for (const file of hotRuntimeMethodRegisterDocs) {
    const text = read(file);
    assert.ok(text.includes(methodGapPath), `${file} should cite method gap source`);
    assert.match(text, /## Method Semantic Proof Gap Boundary/);
    assert.match(text, /method semantic proof gap files covered: 69/);
    assert.match(text, /method semantic proof gap lexical callables covered: 5827/);
    assert.match(text, /files with complete per-callable semantic proof: 0/);
    assert.match(text, /lexical callables requiring semantic proof before behavior changes: 5827/);
    assert.match(text, /affected callable semantic proof: NO-GO/);
    assert.match(text, /runtime behavior changed: no/);
    assert.match(text, /do not approve runtime\s+optimization/);
    assert.match(text, /JSON-first behavior/);
    assert.match(text, /method deletion/);
  }
});

test('seed method semantic register accounts for every current seed method and callback row in scope', () => {
  const rows = seedRows();

  assert.equal(rows.length, 43);
  assert.deepEqual(countBy(rows, 'scope'), {
    bootstrapEntrypoint: 2,
    globalObjectMethod: 1,
    localCallbackFunction: 1,
    localHelperFunction: 6,
    pagePatchFunction: 5,
    propertyAccessorFunction: 6,
    timerCallback: 1,
    topLevelFunction: 21
  });
  assert.deepEqual(countBy(rows, 'group'), {
    bootstrapAndIdempotency: 2,
    debugAndCloneHelpers: 4,
    engineDispatchAndNoWorkBoundary: 10,
    fetchInterception: 3,
    initialDataHooksAndAccessors: 5,
    settingsRelayAndGlobalInterface: 2,
    snapshotAndReplayQueue: 5,
    xhrInterception: 12
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.scope}:${row.name}:${row.line} should be classified`);
  }
});

test('seed broad lexical reconciliation separates semantic rows from parser artifacts', () => {
  const text = doc();
  const rows = seedRows();
  const broad = broadCallableRows();

  assert.equal(broad.length, 92);
  assert.equal(rows.length, 43);
  assert.deepEqual(countByName(broad.filter(name => name === 'if' || name === 'for')), {
    for: 5,
    if: 53
  });

  for (const token of [
    'broad parser source matches: 92',
    'broad source names promoted or expanded: 34',
    'semantic rows added from bootstrap/timer/page-patch context: 9',
    'semantic method rows promoted: 43',
    'rejected broad parser artifacts: 58',
    'rejected `if` artifacts: 53',
    'rejected `for` artifacts: 5',
    'five page/prototype patch assignments'
  ]) {
    assert.ok(text.includes(token), `missing reconciliation token ${token}`);
  }
});

test('seed method semantic register preserves every source row and future proof field', () => {
  const rows = seedRows();
  const text = doc();

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.scope}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing seed row ${row.scope}:${row.name}:${row.line}`
    );
  }

  for (const field of [
    'methodReference',
    'sourceLine',
    'semanticGroup',
    'ownerRuntime',
    'callerClass',
    'installTrigger',
    'routeOrEndpoint',
    'settingsModeInput',
    'profileInput',
    'listModeInput',
    'jsonSource',
    'identitySourceTier',
    'observableSideEffects',
    'endpointBodyWork',
    'harvestOnlyBehavior',
    'disabledBehavior',
    'noRuleBehavior',
    'emptyListBehavior',
    'queueOrReplayBoundary',
    'teardownOrPatchOwner',
    'positiveFixture',
    'disabledFixture',
    'noRuleFixture',
    'negativeSiblingFixture',
    'performanceBudget',
    'fixtureProvenance'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }
});

test('seed method semantic register pins current transport lifecycle and no-work boundaries', () => {
  const text = doc();
  const seed = read('js/seed.js');

  assert.match(seed, /window\.filterTubeSeedHasRun/);
  assert.match(seed, /window\.ftSeedInitialized = false/);
  assert.match(seed, /window\.ftSeedInitialized = true/);
  assert.match(seed, /replayTimer = setTimeout\(\(\) =>/);
  assert.doesNotMatch(seed, /setInterval\s*\(/);
  assert.doesNotMatch(seed, /MutationObserver/);

  assert.match(seed, /response\.clone\(\)\.json\(\)\.then\(jsonData =>/);
  assert.match(seed, /new Response\(JSON\.stringify\(processed\)/);
  assert.match(seed, /window\.FilterTubeEngine\.harvestOnly\(data, cachedSettings/);
  assert.match(seed, /window\.FilterTubeEngine\.processData\(data, cachedSettings, dataName\)/);
  assert.match(seed, /Object\.defineProperty\(window, 'ytInitialData'/);
  assert.match(seed, /Object\.defineProperty\(window, 'ytInitialPlayerResponse'/);
  assert.match(seed, /window\.__filtertubeXhrInterceptionInstalled/);
  assert.match(seed, /listenerWrapperMap = new WeakMap/);
  assert.match(seed, /window\.dispatchEvent\(new CustomEvent\('filterTubeSeedReady'/);

  for (const token of [
    'fetch interception checks the no-work bypass before cloning',
    'harvest-only behavior are separate effect classes',
    'marking is gated by the same no-work bypass',
    'page-lifetime work',
    'through the installed setters',
    '`removeEventListener()`',
    'not a general revision authority'
  ]) {
    assert.ok(text.includes(token), `missing boundary token ${token}`);
  }
});

test('seed executable proof pins ready fetch queue harvest comments setter and XHR mark behavior', async () => {
  const text = doc();

  const readyRuntime = loadSeedRuntime();
  assert.equal(readyRuntime.window.filterTubeSeedHasRun, true);
  assert.equal(readyRuntime.window.ftSeedInitialized, true);
  assert.equal(typeof readyRuntime.window.filterTube.updateSettings, 'function');
  assert.deepEqual(readyRuntime.calls.dispatchEvent, ['filterTubeSeedReady']);

  const missingSettingsRuntime = loadSeedRuntime({
    pathname: '/results',
    payload: { contents: { twoColumnSearchResultsRenderer: {} } }
  });
  const missingResponse = await missingSettingsRuntime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.deepEqual(await missingResponse.json(), { contents: { twoColumnSearchResultsRenderer: {} } });
  assert.equal(missingSettingsRuntime.calls.processData.length, 0);
  assert.equal(missingSettingsRuntime.calls.harvestOnly.length, 0);
  assert.equal(missingSettingsRuntime.window.filterTube.getStats().queuedItems, 0);

  const harvestRuntime = loadSeedRuntime({
    pathname: '/results',
    payload: { contents: { twoColumnSearchResultsRenderer: {} } }
  });
  harvestRuntime.window.filterTube.updateSettings(settings());
  const harvestResponse = await harvestRuntime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.deepEqual(await harvestResponse.json(), { contents: { twoColumnSearchResultsRenderer: {} } });
  assert.equal(harvestRuntime.calls.harvestOnly.length, 0);
  assert.equal(harvestRuntime.calls.processData.length, 0);
  assert.equal(harvestRuntime.window.filterTube.lastYtSearchResponseName, undefined);

  const activeRuleRuntime = loadSeedRuntime({
    pathname: '/',
    payload: { onResponseReceivedActions: [] },
    processData(data, currentSettings, dataName) {
      return { ...data, processedBy: dataName, keywordCount: currentSettings.filterKeywords.length };
    }
  });
  activeRuleRuntime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ keyword: 'blocked', searchTerm: 'blocked' }]
  }));
  const activeRuleResponse = await activeRuleRuntime.window.fetch('https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  assert.deepEqual(await activeRuleResponse.json(), {
    onResponseReceivedActions: [],
    processedBy: 'fetch:/youtubei/v1/browse',
    keywordCount: 1
  });
  assert.equal(activeRuleRuntime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
  assert.equal(activeRuleRuntime.window.filterTube.lastYtBrowseResponse.processedBy, 'fetch:/youtubei/v1/browse');

  const commentRuntime = loadSeedRuntime({
    payload: commentContinuationPayload()
  });
  commentRuntime.window.filterTube.updateSettings(settings({ hideAllComments: true }));
  const commentResponse = await commentRuntime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const commentBody = await commentResponse.json();
  assert.equal(commentRuntime.calls.processData.length, 0);
  assert.equal(commentRuntime.calls.harvestOnly.length, 0);
  assert.equal(
    commentBody.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems[0].continuationItemRenderer.continuationEndpoint,
    null
  );

  const setterRuntime = loadSeedRuntime({
    processData(data, currentSettings, dataName) {
      return { ...data, processedBy: dataName, mode: currentSettings.listMode };
    }
  });
  setterRuntime.window.filterTube.updateSettings(settings({ listMode: 'whitelist' }));
  setterRuntime.window.ytInitialData = { contents: { twoColumnBrowseResultsRenderer: {} } };
  assert.equal(setterRuntime.calls.processData.at(-1).dataName, 'ytInitialData');
  assert.equal(setterRuntime.window.ytInitialData.processedBy, 'ytInitialData');
  assert.equal(setterRuntime.window.filterTube.lastYtInitialData.mode, 'whitelist');

  const xhrRuntime = loadSeedRuntime();
  xhrRuntime.window.filterTube.updateSettings(settings({ enabled: false }));
  const xhr = new xhrRuntime.window.XMLHttpRequest();
  xhr.open('GET', 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  assert.equal(xhr.__filtertube_shouldProcessXhr, false);
  assert.equal(xhr.__filtertube_responseProcessed, false);

  for (const token of [
    'ready dispatch executable proof: seed load sets idempotency flags and emits one ready event',
    'missing-settings executable proof: matching fetch bypasses cloning and queue work before engine calls',
    'empty-blocklist executable proof: search no-work bypass performs no harvest or stash work',
    'active-rule executable proof: matching browse fetch calls processData and stashes processed output',
    'hide-all-comments executable proof: append comment continuation returns synthetic end marker before engine',
    'ytInitialData setter executable proof: accessor processes assignment and updates last snapshot',
    'XHR no-work executable proof: open does not mark matching YouTubei URLs when disabled'
  ]) {
    assert.ok(text.includes(token), `missing executable proof token ${token}`);
  }
});

test('seed method semantic register names missing runtime authorities without implementing them', () => {
  const text = doc();
  const runtime = productRuntimeSource();

  for (const authority of [
    'seedMethodAuthority',
    'seedMethodEffectReport',
    'seedNoWorkBudget',
    'seedTransportPatchOwner',
    'seedReplayQueueBudget',
    'seedAccessorContract',
    'seedPageGlobalFixtureProvenance'
  ]) {
    assert.ok(text.includes(authority), `doc should name future authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(authority), `${authority} should not exist in runtime source yet`);
  }
});
