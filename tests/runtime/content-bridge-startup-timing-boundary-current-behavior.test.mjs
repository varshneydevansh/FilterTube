import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_STARTUP_TIMING_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function lineCount(source) {
  const normalized = source.endsWith('\n') ? source.slice(0, -1) : source;
  return normalized.split('\n').length;
}

function sha256(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function count(source, pattern) {
  return source.match(pattern)?.length || 0;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('unterminated block');
}

function functionBlock(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker ${marker}`);
  const brace = source.indexOf('{', index);
  assert.notEqual(brace, -1, `missing body for ${marker}`);
  const end = findMatchingBrace(source, brace);
  return source.slice(index, end + 1);
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker ${endMarker}`);
  return source.slice(start, end);
}

function startupBlocks() {
  const bridge = read('js/content/bridge_injection.js');
  const contentBridge = read('js/content_bridge.js');
  const fallback = functionBlock(bridge, 'async function injectViaFallback');
  const injection = functionBlock(bridge, 'globalThis.injectMainWorldScripts = async function injectMainWorldScripts');
  const runtimeGate = functionBlock(contentBridge, 'function needsMainWorldRuntimeWork(settings)');
  const ensureSettings = functionBlock(contentBridge, 'async function ensureMainWorldRuntimeForSettings(settings)');
  const ensureBridgeRequest = functionBlock(contentBridge, 'async function ensureMainWorldRuntimeForBridgeRequest()');
  const startupGateCluster = sliceBetween(contentBridge, 'function bridgeHasList(value)', 'function schedulePrefetchScan()');
  const runtimeObservers = functionBlock(contentBridge, 'function refreshFilterTubeRuntimeObservers()');
  const handler = sliceBetween(contentBridge, 'function handleMainWorldMessages', 'async function initialize()');
  const initialize = functionBlock(contentBridge, 'async function initialize()');
  const domFallback = functionBlock(contentBridge, 'async function initializeDOMFallback');
  const observerSetup = sliceBetween(
    contentBridge,
    'let fallbackMutationObserverActive = false;',
    'refreshDOMFallbackMutationObserver();'
  );

  return {
    bridge,
    contentBridge,
    fallback,
    injection,
    runtimeGate,
    ensureSettings,
    ensureBridgeRequest,
    startupGateCluster,
    runtimeObservers,
    handler,
    initialize,
    domFallback,
    observerSetup
  };
}

function loadStartupGateRuntime({ currentSettings = null, latestSettings = null } = {}) {
  const events = [];
  const context = {
    __events: events,
    __currentSettings: currentSettings,
    __latestSettings: latestSettings,
    console: { log() {}, warn() {}, error() {} },
    Array,
    Boolean,
    Promise,
    String,
    parseInt
  };
  context.globalThis = context;

  const { startupGateCluster } = startupBlocks();
  vm.createContext(context);
  vm.runInContext(`
    let currentSettings = globalThis.__currentSettings;
    let latestSettings = globalThis.__latestSettings;
    async function injectMainWorldScripts() {
      globalThis.__events.push({ type: 'inject' });
      return true;
    }
    function sendSettingsToMainWorld(settings) {
      globalThis.__events.push({ type: 'send', settings });
    }
    ${startupGateCluster}
    globalThis.__exports = {
      needsMainWorldRuntimeWork,
      ensureMainWorldRuntimeForSettings,
      ensureMainWorldRuntimeForBridgeRequest,
      setCurrentSettings(value) { currentSettings = value; },
      getEvents() { return globalThis.__events; }
    };
  `, context);

  return {
    exports: context.__exports,
    events
  };
}

test('content bridge startup timing audit is audit-only and source counted', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: current-behavior proof for settings-gated MAIN-world startup and DOM fallback observer refresh',
    'Runtime behavior changed before this proof refresh to gate MAIN-world injection on active settings work',
    'This is not a startup timing implementation patch',
    'runtime content bridge startup timing fixtures: 10',
    'startup no-work gate executable rows: 4',
    'startup explicit bridge request bypass rows: 1',
    'not completion proof for content bridge startup timing authority'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  const blocks = startupBlocks();
  const selected = [
    blocks.bridge,
    blocks.runtimeGate,
    blocks.ensureSettings,
    blocks.ensureBridgeRequest,
    blocks.runtimeObservers,
    blocks.handler,
    blocks.initialize,
    blocks.domFallback
  ].join('\n');
  const expectedMetrics = {
    'bridge_injection lines': lineCount(blocks.bridge),
    'bridge_injection bytes': Buffer.byteLength(blocks.bridge),
    'content_bridge lines': lineCount(blocks.contentBridge),
    'content_bridge bytes': Buffer.byteLength(blocks.contentBridge),
    'fallback block lines': lineCount(blocks.fallback),
    'fallback block bytes': Buffer.byteLength(blocks.fallback),
    'injectMainWorldScripts block lines': lineCount(blocks.injection),
    'injectMainWorldScripts block bytes': Buffer.byteLength(blocks.injection),
    'needsMainWorldRuntimeWork block lines': lineCount(blocks.runtimeGate),
    'needsMainWorldRuntimeWork block bytes': Buffer.byteLength(blocks.runtimeGate),
    'ensureMainWorldRuntimeForSettings block lines': lineCount(blocks.ensureSettings),
    'ensureMainWorldRuntimeForSettings block bytes': Buffer.byteLength(blocks.ensureSettings),
    'ensureMainWorldRuntimeForBridgeRequest block lines': lineCount(blocks.ensureBridgeRequest),
    'ensureMainWorldRuntimeForBridgeRequest block bytes': Buffer.byteLength(blocks.ensureBridgeRequest),
    'refreshFilterTubeRuntimeObservers block lines': lineCount(blocks.runtimeObservers),
    'refreshFilterTubeRuntimeObservers block bytes': Buffer.byteLength(blocks.runtimeObservers),
    'main-world handler block lines': lineCount(blocks.handler),
    'main-world handler block bytes': Buffer.byteLength(blocks.handler),
    'initialize block lines': lineCount(blocks.initialize),
    'initialize block bytes': Buffer.byteLength(blocks.initialize),
    'initializeDOMFallback block lines': lineCount(blocks.domFallback),
    'initializeDOMFallback block bytes': Buffer.byteLength(blocks.domFallback),
    'DOM observer setup slice lines': lineCount(blocks.observerSetup),
    'DOM observer setup slice bytes': Buffer.byteLength(blocks.observerSetup),
    'selected setTimeout tokens': count(selected, /setTimeout/g),
    'selected clearTimeout tokens': count(selected, /clearTimeout/g),
    'selected addEventListener tokens': count(selected, /addEventListener/g),
    'selected removeEventListener tokens': count(selected, /removeEventListener/g),
    'selected MutationObserver tokens': count(selected, /MutationObserver/g),
    'selected requestAnimationFrame tokens': count(selected, /requestAnimationFrame/g),
    'selected requestSettingsFromBackground tokens': count(selected, /requestSettingsFromBackground/g),
    'selected injectMainWorldScripts tokens': count(selected, /injectMainWorldScripts/g),
    'selected ensureMainWorldRuntimeForSettings tokens': count(selected, /ensureMainWorldRuntimeForSettings/g),
    'selected ensureMainWorldRuntimeForBridgeRequest tokens': count(selected, /ensureMainWorldRuntimeForBridgeRequest/g),
    'selected needsMainWorldRuntimeWork tokens': count(selected, /needsMainWorldRuntimeWork/g),
    'selected sendSettingsToMainWorld tokens': count(selected, /sendSettingsToMainWorld/g),
    'selected initializeDOMFallback tokens': count(selected, /initializeDOMFallback/g),
    'selected applyDOMFallback tokens': count(selected, /applyDOMFallback/g),
    'selected FilterTube_InjectorToBridge_Ready tokens': count(selected, /FilterTube_InjectorToBridge_Ready/g),
    'selected FilterTube_InjectorBridgeReady tokens': count(selected, /FilterTube_InjectorBridgeReady/g),
    'selected DOMContentLoaded tokens': count(selected, /DOMContentLoaded/g),
    'selected startCardPrefetchObserver tokens': count(selected, /startCardPrefetchObserver/g),
    'selected installPlaylistPanelPrefetchHook tokens': count(selected, /installPlaylistPanelPrefetchHook/g),
    'selected installRightRailWhitelistObserver tokens': count(selected, /installRightRailWhitelistObserver/g),
    'selected FilterTube_refreshDOMFallbackObserver tokens': count(selected, /FilterTube_refreshDOMFallbackObserver/g),
    'selected disconnectFallbackMutationObserver tokens': count(selected, /disconnectFallbackMutationObserver/g),
    'selected hasActiveFallbackLifecycleWork tokens': count(selected, /hasActiveFallbackLifecycleWork/g)
  };

  assert.ok(doc.includes(`sha256: \`${sha256(blocks.bridge)}\``));
  assert.ok(doc.includes(`sha256: \`${sha256(blocks.contentBridge)}\``));

  for (const [label, value] of Object.entries(expectedMetrics)) {
    assert.ok(doc.includes(`${label}: ${value}`), `doc missing metric ${label}: ${value}`);
  }
});

test('fallback script injection spaces loads with a 50ms timer and no script cleanup owner', () => {
  const { fallback } = startupBlocks();

  assert.match(fallback, /document\.createElement\('script'\)/);
  assert.match(fallback, /script\.src = api\.runtime\.getURL\(`js\/\$\{scriptName\}\.js`\)/);
  assert.match(fallback, /script\.onload = \(\) => \{\s*currentIndex\+\+;\s*setTimeout\(injectNext, 50\);/);
  assert.match(fallback, /\(document\.head \|\| document\.documentElement\)\.appendChild\(script\)/);
  assert.doesNotMatch(fallback, /script\.remove\(|removeChild|contentBridgeStartupTimingContract/);
});

test('successful main-world injection schedules settings replay from a fixed 100ms timer', () => {
  const { injection } = startupBlocks();

  assert.match(injection, /bridgeState\.scriptsInjected = true;/);
  assert.match(injection, /setTimeout\(\(\) => \{\s*try \{\s*if \(typeof requestSettingsFromBackground === 'function'\) \{\s*requestSettingsFromBackground\(\);/s);
  assert.match(injection, /\}, 100\);/);
  assert.doesNotMatch(injection, /FilterTube_InjectorToBridge_Ready|contentBridgeInjectionSettingsReplayReport|clearTimeout/);
});

test('content bridge registers message listener and starts initialize from a fixed 50ms timer', () => {
  const { contentBridge } = startupBlocks();
  const tail = contentBridge.slice(contentBridge.lastIndexOf("window.addEventListener('message'"));

  assert.match(tail, /window\.addEventListener\('message', handleMainWorldMessages, false\);/);
  assert.match(tail, /setTimeout\(\(\) => initialize\(\), 50\);/);
  assert.doesNotMatch(tail, /removeEventListener|clearTimeout|startupTimerId|contentBridgeStartupTimerBudgetReport/);
});

test('initialize gets settings then gates MAIN-world runtime before detached DOM fallback', () => {
  const { initialize } = startupBlocks();

  assert.match(initialize, /initializeStats\(\);/);
  assert.match(initialize, /const response = await requestSettingsFromBackground\(\);/);
  assert.match(initialize, /if \(response\?\.success\) \{\s*await ensureMainWorldRuntimeForSettings\(response\.settings\);/);
  assert.match(initialize, /if \(response\?\.success\) \{\s*initializeDOMFallback\(response\.settings\);/);
  assert.doesNotMatch(initialize, /await injectMainWorldScripts\(\);/);
  assert.doesNotMatch(initialize, /await initializeDOMFallback|contentBridgeInitializePromiseContract/);
});

test('MAIN-world runtime injection is settings gated except explicit bridge requests', async () => {
  const { runtimeGate, ensureSettings, ensureBridgeRequest } = startupBlocks();

  assert.match(runtimeGate, /if \(!settings \|\| typeof settings !== 'object'\) return false;/);
  assert.match(runtimeGate, /if \(settings\.enabled === false\) return false;/);
  assert.match(runtimeGate, /if \(settings\.listMode === 'whitelist'\) return true;/);
  assert.match(runtimeGate, /return hasBridgeEnabledContentFilters\(settings\) \|\| hasBridgeActiveJsonFilterRules\(settings\);/);

  assert.match(ensureSettings, /if \(!needsMainWorldRuntimeWork\(settings\)\) return false;/);
  assert.match(ensureSettings, /await injectMainWorldScripts\(\);/);
  assert.match(ensureSettings, /sendSettingsToMainWorld\(settings\);/);

  assert.doesNotMatch(ensureBridgeRequest, /needsMainWorldRuntimeWork/);
  assert.match(ensureBridgeRequest, /await injectMainWorldScripts\(\);/);
  assert.match(ensureBridgeRequest, /sendSettingsToMainWorld\(settings\);/);

  const runtime = loadStartupGateRuntime({
    currentSettings: {
      enabled: true,
      listMode: 'blocklist',
      filterKeywords: [],
      filterChannels: [],
      filterKeywordsComments: [],
      contentFilters: {}
    }
  });

  assert.equal(runtime.exports.needsMainWorldRuntimeWork(null), false);
  assert.equal(runtime.exports.needsMainWorldRuntimeWork({ enabled: false, listMode: 'whitelist' }), false);
  assert.equal(runtime.exports.needsMainWorldRuntimeWork({
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: { enabled: true, selected: [] }
  }), false);
  assert.equal(await runtime.exports.ensureMainWorldRuntimeForSettings({
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    contentFilters: {}
  }), false);
  assert.deepEqual(runtime.events, []);

  const whitelistSettings = { enabled: true, listMode: 'whitelist', filterKeywords: [], filterChannels: [] };
  assert.equal(await runtime.exports.ensureMainWorldRuntimeForSettings(whitelistSettings), true);
  assert.deepEqual(runtime.events.map(event => event.type), ['inject', 'send']);
  assert.deepEqual(runtime.events.at(-1).settings, whitelistSettings);

  runtime.events.length = 0;
  assert.equal(await runtime.exports.ensureMainWorldRuntimeForBridgeRequest(), true);
  assert.deepEqual(runtime.events.map(event => event.type), ['inject', 'send']);
  assert.equal(runtime.events.at(-1).settings.listMode, 'blocklist');
});

test('main-world handler refreshes on full injector ready but ignores bridge-ready message', () => {
  const { handler } = startupBlocks();

  assert.match(handler, /if \(type === 'FilterTube_InjectorToBridge_Ready'\) \{\s*requestSettingsFromBackground\(\);/);
  assert.match(handler, /type === 'FilterTube_Refresh'/);
  assert.doesNotMatch(handler, /FilterTube_InjectorBridgeReady|contentBridgeReadyMessageDecisionReport/);
});

test('DOM fallback startup waits 1000ms, can request settings again, then applies fallback and menu setup', () => {
  const { domFallback } = startupBlocks();

  assert.match(domFallback, /async function initializeDOMFallback\(settings\) \{\s*await new Promise\(resolve => setTimeout\(resolve, 1000\)\);/);
  assert.match(domFallback, /if \(!settings\) \{\s*const response = await requestSettingsFromBackground\(\);\s*settings = response\?\.settings;/);
  assert.match(domFallback, /if \(settings\) \{\s*applyDOMFallback\(settings\);/);
  assert.match(domFallback, /ensureFallbackMenuButtons\(\);/);
  assert.doesNotMatch(domFallback, /contentBridgeFirstDomFallbackPolicy/);
});

test('DOM fallback observer attaches to body or waits for DOMContentLoaded once', () => {
  const { domFallback, observerSetup, runtimeObservers } = startupBlocks();

  assert.match(observerSetup, /const observer = new MutationObserver\(mutations => \{/);
  assert.match(observerSetup, /observer\.observe\(target, \{ childList: true, subtree: true \}\);/);
  assert.match(observerSetup, /if \(!hasActiveFallbackLifecycleWork\(\)\) \{\s*disconnectFallbackMutationObserver\(\);/);
  assert.match(observerSetup, /document\.addEventListener\('DOMContentLoaded', \(\) => \{[\s\S]*scheduleImmediateFallback\(\);[\s\S]*\}, \{ once: true \}\);/);
  assert.match(observerSetup, /window\.FilterTube_refreshDOMFallbackObserver = refreshDOMFallbackMutationObserver;/);
  assert.match(domFallback, /refreshFilterTubeRuntimeObservers\(\);/);
  assert.match(runtimeObservers, /startCardPrefetchObserver\(\);/);
  assert.match(runtimeObservers, /installPlaylistPanelPrefetchHook\(\);/);
  assert.match(runtimeObservers, /installRightRailWhitelistObserver\(\);/);
  assert.match(runtimeObservers, /schedulePrefetchScan\(\);/);
  assert.match(runtimeObservers, /window\.FilterTube_refreshDOMFallbackObserver\(\);/);
});

test('DOM fallback startup has local observer refresh and disconnect but no shared startup owner report', () => {
  const { domFallback, observerSetup } = startupBlocks();

  assert.doesNotMatch(domFallback, /domFallbackInitialized|fallbackInitialized|contentBridgeDomFallbackSingletonReport/);
  assert.match(observerSetup, /let fallbackMutationObserverActive = false;/);
  assert.match(observerSetup, /function disconnectFallbackMutationObserver\(\) \{[\s\S]*observer\.disconnect\(\);/);
  assert.match(observerSetup, /function refreshDOMFallbackMutationObserver\(\) \{/);
  assert.doesNotMatch(domFallback, /contentBridgeStartupTimingContract|contentBridgeStartupMetricArtifact/);
  assert.doesNotMatch(domFallback, /contentBridgeStartupObserverOwnerReport/);
});
