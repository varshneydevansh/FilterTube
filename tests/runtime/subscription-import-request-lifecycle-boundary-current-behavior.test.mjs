import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const sourcePaths = [
  'js/content/bridge_settings.js',
  'js/content_bridge.js',
  'js/injector.js',
  'js/state_manager.js',
  'js/tab-view.js',
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];

const authoritySymbols = [
  'subscriptionImportRequestLifecycleContract',
  'subscriptionImportRequesterOverrideReport',
  'subscriptionImportCapabilityToken',
  'subscriptionImportPageMessageTrustReport',
  'subscriptionImportProgressResponsePolicy',
  'subscriptionImportTimeoutBudget',
  'subscriptionImportYoutubeiFetchBudget',
  'subscriptionImportManifestLoadOrderReport',
  'subscriptionImportProfileMutationReport',
  'subscriptionImportUiProgressPolicy',
  'subscriptionImportFixtureProvenance',
  'subscriptionImportMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
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

function sourceBlocks() {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const contentBridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const stateManager = read('js/state_manager.js');
  const tabView = read('js/tab-view.js');

  return {
    bridgeSettings,
    contentBridge,
    injector,
    stateManager,
    tabView,
    bridgeRequester: sliceBetween(
      bridgeSettings,
      "if (typeof globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld !== 'function') {",
      '\n}\n\nif (!window.__filtertubeSubscriptionImportMessageListenerAttached)'
    ),
    bridgeSubscriptionListener: sliceBetween(
      bridgeSettings,
      "if (!window.__filtertubeSubscriptionImportMessageListenerAttached) {",
      '\n}\n\nif (window.__filtertubeRuntimeBridgeListenerAttached'
    ),
    bridgeRuntimeImportAction: sliceBetween(
      bridgeSettings,
      "} else if (request.action === 'FilterTube_ImportSubscribedChannels') {",
      "\n        } else if (request.action === 'FilterTube_ApplySettings' && request.settings)"
    ),
    contentRequester: sliceBetween(
      contentBridge,
      'function requestSubscribedChannelsFromMainWorld(options = {}, onProgress = null) {',
      '\n}\n\nwindow.FilterTubeRequestSubscribedChannelsFromMainWorld'
    ),
    contentAssignment: sliceBetween(
      contentBridge,
      'window.FilterTubeRequestSubscribedChannelsFromMainWorld = requestSubscribedChannelsFromMainWorld;',
      '\n\n/**\n * Normalize collaborator names'
    ),
    contentMessageHandlerHeader: sliceBetween(
      contentBridge,
      'function handleMainWorldMessages(event) {',
      "\n    if (type === 'FilterTube_InjectorToBridge_Ready')"
    ),
    contentSubscriptionResponse: sliceBetween(
      contentBridge,
      "} else if (type === 'FilterTube_SubscriptionsImportProgress') {",
      "\n    } else if (type === 'FilterTube_CacheCollaboratorInfo')"
    ),
    injectorBridgeInstall: sliceBetween(
      injector,
      "const SUBSCRIPTIONS_IMPORT_BRIDGE_VERSION = '2026-04-09-1';",
      '\n\n    installSubscriptionsImportBridge();'
    ),
    injectorFetchImport: sliceBetween(
      injector,
      'async function fetchSubscribedChannelsFromYoutubei(requestId, options = {}) {',
      '\n\n    function tokenizeExpectedCollaboratorNames'
    ),
    stateManagerFetchImport: sliceBetween(
      stateManager,
      'async function fetchSubscribedChannelsFromImportTab(tabId, options = {}) {',
      '\n\n    async function importSubscribedChannelsToWhitelist'
    ),
    stateManagerImportToWhitelist: sliceBetween(
      stateManager,
      'async function importSubscribedChannelsToWhitelist(options = {}) {',
      '\n\n    /**\n     * Remove a channel'
    ),
    tabViewImport: sliceBetween(
      tabView,
      "async function startSubscribedChannelsImport(trigger = 'manual') {",
      '\n\n    function resolveViewAccess'
    ),
    tabViewProgressListener: sliceBetween(
      tabView,
      'if (runtimeAPI?.runtime?.onMessage?.addListener) {',
      '\n    }\n\n    if (importSubscriptionsActions)'
    )
  };
}

function coreSelectedBlocks(blocks) {
  return [
    blocks.bridgeRequester,
    blocks.bridgeSubscriptionListener,
    blocks.bridgeRuntimeImportAction,
    blocks.contentRequester,
    blocks.contentAssignment,
    blocks.contentSubscriptionResponse,
    blocks.injectorBridgeInstall,
    blocks.injectorFetchImport
  ].join('\n');
}

test('subscription import lifecycle audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, subscription import/);
  assert.match(doc, /profile, storage, DOM, or settings behavior/);
  assert.match(doc, /subscription import request lifecycle source files: 9/);
  assert.match(doc, /subscription import request lifecycle JS source files: 5/);
  assert.match(doc, /subscription import request lifecycle manifest files: 4/);
  assert.match(doc, /runtime subscription import lifecycle fixtures: 8/);
  assert.match(doc, /not completion proof for subscription import lifecycle authority/);

  for (const file of sourcePaths) {
    const source = read(file);
    assert.ok(doc.includes(`| \`${file}\` | ${lineCount(source)} | ${Buffer.byteLength(source)} | \`${sha256(file)}\` |`), file);
  }
});

test('subscription import lifecycle source and effect counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['bridge_settings guarded requester block', blocks.bridgeRequester, 40, 1938],
    ['bridge_settings subscription listener block', blocks.bridgeSubscriptionListener, 50, 2295],
    ['bridge_settings runtime import action block', blocks.bridgeRuntimeImportAction, 52, 2614],
    ['content_bridge requester block', blocks.contentRequester, 38, 1648],
    ['content_bridge requester assignment block', blocks.contentAssignment, 1, 97],
    ['content_bridge message handler header block', blocks.contentMessageHandlerHeader, 5, 229],
    ['content_bridge subscription progress/response block', blocks.contentSubscriptionResponse, 27, 1412],
    ['injector subscription bridge install block', blocks.injectorBridgeInstall, 71, 2766],
    ['injector fetchSubscribedChannelsFromYoutubei block', blocks.injectorFetchImport, 450, 19755],
    ['StateManager fetchSubscribedChannelsFromImportTab block', blocks.stateManagerFetchImport, 54, 2213],
    ['StateManager importSubscribedChannelsToWhitelist block', blocks.stateManagerImportToWhitelist, 109, 4527],
    ['tab-view startSubscribedChannelsImport block', blocks.tabViewImport, 201, 8431],
    ['tab-view runtime progress listener block', blocks.tabViewProgressListener, 22, 874]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  const core = coreSelectedBlocks(blocks);
  const coreCounts = [
    ['core selected FilterTube_RequestSubscriptionImport tokens: 3', countLiteral(core, 'FilterTube_RequestSubscriptionImport')],
    ['core selected FilterTube_SubscriptionsImportProgress tokens: 4', countLiteral(core, 'FilterTube_SubscriptionsImportProgress')],
    ['core selected FilterTube_SubscriptionsImportResponse tokens: 3', countLiteral(core, 'FilterTube_SubscriptionsImportResponse')],
    ['core selected FilterTubeRequestSubscribedChannelsFromMainWorld tokens: 4', countLiteral(core, 'FilterTubeRequestSubscribedChannelsFromMainWorld')],
    ['core selected requestId tokens: 41', countLiteral(core, 'requestId')],
    ['core selected wildcard postMessage target callsites: 5', countLiteral(core, "}, '*');")],
    ['core selected setTimeout callsites: 5', countLiteral(core, 'setTimeout(')],
    ['core selected clearTimeout callsites: 6', countLiteral(core, 'clearTimeout(')]
  ];

  for (const [label, actual] of coreCounts) {
    const expected = Number(label.match(/: (\d+)$/)[1]);
    assert.equal(actual, expected, label);
    assert.ok(doc.includes(label), label);
  }

  assert.equal(countLiteral(blocks.injectorFetchImport, 'fetch('), 1);
  assert.equal(countLiteral(blocks.injectorFetchImport, 'AbortController'), 2);
  assert.ok(doc.includes('injector fetch import fetch() callsites: 1'));
  assert.ok(doc.includes('injector fetch import AbortController tokens: 2'));
});

test('manifest content-script order keeps bridge_settings before content_bridge in every browser manifest', () => {
  const doc = read(docPath);

  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const manifest = JSON.parse(read(file));
    const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
    const bridgeSettingsIndex = scripts.indexOf('js/content/bridge_settings.js');
    const contentBridgeIndex = scripts.indexOf('js/content_bridge.js');

    assert.notEqual(bridgeSettingsIndex, -1, `${file} has bridge_settings`);
    assert.notEqual(contentBridgeIndex, -1, `${file} has content_bridge`);
    assert.ok(bridgeSettingsIndex < contentBridgeIndex, `${file} load order`);
  }

  assert.match(doc, /All four manifests load `js\/content\/bridge_settings\.js` before `js\/content_bridge\.js`/);
  assert.match(doc, /Manifest load-order report/);
});

test('effective requester override and timeout drift stay pinned to current behavior', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.match(blocks.bridgeRequester, /typeof globalThis\.FilterTubeRequestSubscribedChannelsFromMainWorld !== 'function'/);
  assert.match(blocks.bridgeRequester, /Math\.min\(parseInt\(options\.timeoutMs, 10\) \|\| 60000, 120000\)/);
  assert.match(blocks.contentRequester, /Math\.min\(parseInt\(options\.timeoutMs, 10\) \|\| 60000, 150000\)/);
  assert.equal(blocks.contentAssignment.trim(), 'window.FilterTubeRequestSubscribedChannelsFromMainWorld = requestSubscribedChannelsFromMainWorld;');
  assert.match(blocks.bridgeRuntimeImportAction, /const importer = globalThis\.FilterTubeRequestSubscribedChannelsFromMainWorld/);
  assert.match(doc, /effective timeout clamp from the bridge-settings 120000 ms max to the content-bridge 150000 ms max/);

  const postedMessages = [];
  let nextTimer = 0;
  const window = {
    pendingSubscriptionImportRequests: new Map(),
    subscriptionImportRequestId: 0,
    postMessage(message, target) {
      postedMessages.push({ message, target });
    }
  };
  const context = {
    window,
    console: { log() {} },
    setTimeout() {
      nextTimer += 1;
      return `timer-${nextTimer}`;
    },
    parseInt,
    Math,
    Promise,
    Map,
    isFinite
  };
  vm.runInNewContext(`${blocks.contentRequester}\n}\n${blocks.contentAssignment}`, context);

  const promise = window.FilterTubeRequestSubscribedChannelsFromMainWorld({
    timeoutMs: 999999,
    maxChannels: 999999,
    pageDelayMs: 1
  }, () => {});

  assert.equal(typeof promise.then, 'function');
  assert.equal(window.subscriptionImportRequestId, 1);
  assert.equal(window.pendingSubscriptionImportRequests.size, 1);
  assert.equal(postedMessages.length, 1);
  assert.equal(postedMessages[0].target, '*');
  assert.deepEqual(JSON.parse(JSON.stringify(postedMessages[0].message)), {
    type: 'FilterTube_RequestSubscriptionImport',
    payload: {
      requestId: 1,
      timeoutMs: 150000,
      maxChannels: 5000,
      pageDelayMs: 50
    },
    source: 'content_bridge'
  });
});

test('progress and response page-message trust gates remain split between bridge files', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.match(blocks.bridgeSubscriptionListener, /if \(event\.source !== window\) return/);
  assert.match(blocks.bridgeSubscriptionListener, /if \(data\.source !== 'injector'\) return/);
  assert.match(blocks.bridgeSubscriptionListener, /FilterTube_SubscriptionsImportProgress/);
  assert.match(blocks.bridgeSubscriptionListener, /FilterTube_SubscriptionsImportResponse/);

  assert.match(blocks.contentMessageHandlerHeader, /event\.source !== window \|\| !event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.match(blocks.contentMessageHandlerHeader, /event\.data\.source === 'content_bridge'/);
  assert.doesNotMatch(blocks.contentMessageHandlerHeader, /data\.source !== 'injector'/);
  assert.doesNotMatch(blocks.contentSubscriptionResponse, /data\.source !== 'injector'/);
  assert.match(blocks.contentSubscriptionResponse, /FilterTube_SubscriptionsImportProgress/);
  assert.match(blocks.contentSubscriptionResponse, /FilterTube_SubscriptionsImportResponse/);
  assert.match(blocks.contentSubscriptionResponse, /clearTimeout\(pending\.timeoutId\)/);
  assert.match(blocks.contentSubscriptionResponse, /window\.pendingSubscriptionImportRequests\.delete\(requestId\)/);

  assert.match(doc, /bridge_settings\.js` message handling requires `data\.source === 'injector'`/);
  assert.match(doc, /content_bridge\.js` accepts same-window `FilterTube_\*` messages unless `source === 'content_bridge'`/);
  assert.match(doc, /Page-message trust report/);
});

test('injector bridge and YouTubei fetch loop keep credentialed network and wildcard page-message behavior', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.match(blocks.injectorBridgeInstall, /SUBSCRIPTIONS_IMPORT_BRIDGE_VERSION = '2026-04-09-1'/);
  assert.match(blocks.injectorBridgeInstall, /type !== 'FilterTube_RequestSubscriptionImport' \|\| source !== 'content_bridge'/);
  assert.match(blocks.injectorBridgeInstall, /fetchSubscribedChannelsFromYoutubei\(requestId, payload \|\| \{\}\)/);
  assert.match(blocks.injectorBridgeInstall, /type: 'FilterTube_SubscriptionsImportResponse'/);
  assert.equal(countLiteral(blocks.injectorBridgeInstall, "}, '*');"), 2);

  assert.match(blocks.injectorFetchImport, /type: 'FilterTube_SubscriptionsImportProgress'/);
  assert.match(blocks.injectorFetchImport, /\/youtubei\/v1\/browse\?prettyPrint=false/);
  assert.match(blocks.injectorFetchImport, /method: 'POST'/);
  assert.match(blocks.injectorFetchImport, /credentials: 'include'/);
  assert.match(blocks.injectorFetchImport, /headers: buildSubscriptionImportHeaders\(requestProfile\)/);
  assert.match(blocks.injectorFetchImport, /body: JSON\.stringify\(requestBody\)/);
  assert.match(blocks.injectorFetchImport, /new AbortController\(\)/);
  assert.match(blocks.injectorFetchImport, /abortController\.abort\(\)/);
  assert.match(blocks.injectorFetchImport, /clearTimeout\(abortTimer\)/);
  assert.match(blocks.injectorFetchImport, /await sleep\(pageDelayMs\)/);
  assert.doesNotMatch(blocks.injectorBridgeInstall + blocks.injectorFetchImport, /subscriptionImportCapabilityToken/);

  assert.match(doc, /performs one credentialed YouTubei POST\s+path with abort timers and continuation delays/);
  assert.match(doc, /YouTubei fetch budget/);
});

test('StateManager and tab-view add profile, tab, request, and UI progress gates outside page-message authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();

  assert.match(blocks.stateManagerFetchImport, /action: 'FilterTube_ImportSubscribedChannels'/);
  assert.match(blocks.stateManagerFetchImport, /for \(let attempt = 0; attempt < 12; attempt \+= 1\)/);
  assert.match(blocks.stateManagerFetchImport, /subscriptions_import_unavailable/);
  assert.match(blocks.stateManagerFetchImport, /await delay\(Math\.min\(1800, 300 \+ \(attempt \* 180\)\)\)/);

  assert.match(blocks.stateManagerImportToWhitelist, /isUiLocked\(\)/);
  assert.match(blocks.stateManagerImportToWhitelist, /targetProfileId/);
  assert.match(blocks.stateManagerImportToWhitelist, /activeId !== targetProfileId/);
  assert.match(blocks.stateManagerImportToWhitelist, /FilterTube_BatchImportWhitelistChannels/);
  assert.match(blocks.stateManagerImportToWhitelist, /await loadSettings\(\{ notify: true \}\)/);
  assert.match(blocks.stateManagerImportToWhitelist, /await requestRefresh\('main'\)/);

  assert.match(blocks.tabViewImport, /resolveSubscriptionsImportTab\(\)/);
  assert.match(blocks.tabViewImport, /await updateBrowserTab\(sourceTab\.id, \{ active: true \}\)/);
  assert.match(blocks.tabViewImport, /timeoutMs: 150000/);
  assert.match(blocks.tabViewImport, /maxChannels: 5000/);
  assert.match(blocks.tabViewImport, /pageDelayMs: 140/);
  assert.match(blocks.tabViewImport, /enableWhitelistModeAfterImport/);

  assert.match(blocks.tabViewProgressListener, /FilterTube_SubscriptionsImportProgress/);
  assert.match(blocks.tabViewProgressListener, /subscriptionsImportState\.inProgress/);
  assert.match(blocks.tabViewProgressListener, /normalizeString\(message\?\.requestId\) !== normalizeString\(subscriptionsImportState\.requestId\)/);
  assert.match(blocks.tabViewProgressListener, /subscriptionsImportState\.sourceTabId !== sourceTabId/);
  assert.match(blocks.tabViewProgressListener, /handleSubscriptionsImportProgress\(message\?\.progress \|\| \{\}\)/);

  assert.match(doc, /StateManager and tab-view add profile, lock, tab, request id, and source tab\s+gates/);
  assert.match(doc, /End-to-end progress policy/);
});

test('future subscription import lifecycle authority symbols remain absent from product runtime source', () => {
  const doc = read(docPath);
  const runtimeSource = productRuntimeSource();

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc records missing symbol ${symbol}`);
    assert.equal(runtimeSource.includes(symbol), false, `runtime source unexpectedly contains ${symbol}`);
  }

  assert.match(doc, /No `subscriptionImportRequestLifecycleContract`/);
  assert.match(doc, /`subscriptionImportMetricArtifact` exists in product runtime source yet/);
});
