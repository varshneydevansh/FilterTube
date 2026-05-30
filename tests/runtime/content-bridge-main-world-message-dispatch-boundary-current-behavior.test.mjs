import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_BRIDGE_MAIN_WORLD_MESSAGE_DISPATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

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

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker ${endMarker}`);
  return source.slice(start, end);
}

function contentBridgeBlocks() {
  const contentBridge = read('js/content_bridge.js');
  const handler = sliceBetween(
    contentBridge,
    'function handleMainWorldMessages(event) {',
    'async function initialize()'
  );

  return { contentBridge, handler };
}

function messageTypes(handler) {
  return [...handler.matchAll(/type === '([^']+)'/g)].map((match) => match[1]);
}

function loadMessageDispatchRuntime() {
  const { handler } = contentBridgeBlocks();
  const events = [];
  const windowObject = {};
  const context = {
    __events: events,
    window: windowObject,
    Promise,
    console: { log() {}, warn() {}, error() {} }
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(`
    function requestSettingsFromBackground() {
      globalThis.__events.push({ type: 'requestSettingsFromBackground' });
      return Promise.resolve({ success: true, settings: { enabled: true, listMode: 'blocklist' } });
    }
    function applyDOMFallback(settings, options) {
      globalThis.__events.push({ type: 'applyDOMFallback', settings, options });
    }
    ${handler}
    globalThis.__exports = { handleMainWorldMessages };
  `, context);

  return {
    exports: context.__exports,
    events,
    window: windowObject
  };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

test('content bridge main-world dispatch audit is audit-only and source counted', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: current-behavior proof with a narrow learned-map no-op DOM work fix',
    'Runtime behavior changed only for duplicate learned-map page messages',
    'not a broad message-trust',
    'runtime content bridge main-world message dispatch fixtures: 8',
    'message dispatch executable ingress rows: 5',
    'message dispatch executable behavior changed: no',
    'message dispatch executable approval: NO-GO',
    'not completion proof for page-message trust'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  const { contentBridge, handler } = contentBridgeBlocks();
  const expectedMetrics = {
    'handler lines': lineCount(handler),
    'handler bytes': Buffer.byteLength(handler),
    'handler FilterTube type branches': count(handler, /type === 'FilterTube_/g),
    'handler startsWith FilterTube tokens': count(handler, /startsWith\('FilterTube_'\)/g),
    'handler source content_bridge guard tokens': count(handler, /source === 'content_bridge'/g),
    'handler event.source window guards': count(handler, /event\.source !== window/g),
    'handler event.origin tokens': count(handler, /event\.origin/g),
    'handler nonce tokens': count(handler, /\bnonce\b/g),
    'handler trustedSource tokens': count(handler, /trustedSource/g),
    'handler allowedSource tokens': count(handler, /allowedSource/g),
    'handler pending request get tokens': count(handler, /pending[A-Za-z]+Requests\.get/g),
    'handler pending map get tokens': count(handler, /pendingCollabCards\.get/g),
    'handler clearTimeout tokens': count(handler, /clearTimeout/g),
    'handler setTimeout tokens': count(handler, /setTimeout/g),
    'handler requestAnimationFrame tokens': count(handler, /requestAnimationFrame/g),
    'handler applyDOMFallback tokens': count(handler, /applyDOMFallback/g),
    'handler persistChannelMappings tokens': count(handler, /persistChannelMappings/g),
    'handler persistVideoChannelMapping tokens': count(handler, /persistVideoChannelMapping/g),
    'handler persistVideoMetaMapping tokens': count(handler, /persistVideoMetaMapping/g),
    'handler storage local set tokens': count(handler, /storage\.local\.set/g),
    'handler stampChannelIdentity tokens': count(handler, /stampChannelIdentity/g),
    'handler applyResolvedCollaborators tokens': count(handler, /applyResolvedCollaborators/g),
    'handler sanitizeCollaboratorList tokens': count(handler, /sanitizeCollaboratorList/g),
    'handler document.querySelectorAll tokens': count(handler, /document\.querySelectorAll/g),
    'handler document.querySelector tokens': count(handler, /document\.querySelector/g),
    'handler sourceLabel tokens': count(handler, /sourceLabel/g),
    'handler force true tokens': count(handler, /force: true/g),
    'handler return statements': count(handler, /\breturn\b/g),
    'handler browserAPI_BRIDGE tokens': count(handler, /browserAPI_BRIDGE/g)
  };

  assert.ok(doc.includes(`lines: ${lineCount(contentBridge)}`));
  assert.ok(doc.includes(`bytes: ${Buffer.byteLength(contentBridge)}`));
  assert.ok(doc.includes(`sha256: \`${sha256(contentBridge)}\``));

  for (const [label, value] of Object.entries(expectedMetrics)) {
    assert.ok(doc.includes(`${label}: ${value}`), `doc missing metric ${label}: ${value}`);
  }
});

test('content bridge dispatch branch inventory is pinned exactly', () => {
  const { handler } = contentBridgeBlocks();

  assert.deepEqual(messageTypes(handler), [
    'FilterTube_InjectorToBridge_Ready',
    'FilterTube_Refresh',
    'FilterTube_UpdateChannelMap',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap',
    'FilterTube_UpdateCustomUrlMap',
    'FilterTube_CollaboratorInfoResponse',
    'FilterTube_SubscriptionsImportProgress',
    'FilterTube_SubscriptionsImportResponse',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_ChannelInfoResponse',
    'FilterTube_CollabDialogData'
  ]);
});

test('content bridge receiver accepts same-window FilterTube messages with only a self-source exclusion', async () => {
  const { handler } = contentBridgeBlocks();

  assert.match(handler, /if \(event\.source !== window \|\| !event\.data\?\.type\?\.startsWith\('FilterTube_'\)\) return;/);
  assert.match(handler, /if \(event\.data\.source === 'content_bridge'\) return;/);
  assert.match(handler, /const \{ type, payload \} = event\.data;/);
  assert.doesNotMatch(handler, /\bevent\.origin\b|\bnonce\b|\btrustedSource\b|\ballowedSource\b|senderCapability|settingsRevision|routePolicy/);

  const runtime = loadMessageDispatchRuntime();

  runtime.exports.handleMainWorldMessages({ source: {}, data: { type: 'FilterTube_Refresh' } });
  runtime.exports.handleMainWorldMessages({ source: runtime.window, data: { type: 'Noise_Refresh' } });
  runtime.exports.handleMainWorldMessages({
    source: runtime.window,
    data: { type: 'FilterTube_Refresh', source: 'content_bridge' }
  });
  await flushMicrotasks();
  assert.deepEqual(runtime.events, []);

  runtime.exports.handleMainWorldMessages({ source: runtime.window, data: { type: 'FilterTube_InjectorToBridge_Ready' } });
  assert.deepEqual(runtime.events.map(event => event.type), ['requestSettingsFromBackground']);

  runtime.events.length = 0;
  runtime.exports.handleMainWorldMessages({ source: runtime.window, data: { type: 'FilterTube_Refresh' } });
  await flushMicrotasks();
  assert.deepEqual(runtime.events.map(event => event.type), ['requestSettingsFromBackground', 'applyDOMFallback']);
  assert.equal(runtime.events.at(-1).options.forceReprocess, true);
});

test('refresh and readiness messages can request settings and force DOM fallback without pending ownership', () => {
  const { handler } = contentBridgeBlocks();
  const readiness = sliceBetween(handler, "type === 'FilterTube_InjectorToBridge_Ready'", "type === 'FilterTube_Refresh'");
  const refresh = sliceBetween(handler, "type === 'FilterTube_Refresh'", "type === 'FilterTube_UpdateChannelMap'");

  assert.match(readiness, /requestSettingsFromBackground\(\);/);
  assert.match(refresh, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(refresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.doesNotMatch(refresh, /pending[A-Za-z]+Requests|get\(requestId\)|requestId|contentBridgeRefreshOwnershipReport/);
});

test('learned map messages persist identity metadata and can rerun DOM work from page messages', () => {
  const { handler } = contentBridgeBlocks();
  const channelMap = sliceBetween(handler, "type === 'FilterTube_UpdateChannelMap'", "type === 'FilterTube_UpdateVideoChannelMap'");
  const videoChannel = sliceBetween(handler, "type === 'FilterTube_UpdateVideoChannelMap'", "type === 'FilterTube_UpdateVideoMetaMap'");
  const videoMeta = sliceBetween(handler, "type === 'FilterTube_UpdateVideoMetaMap'", "type === 'FilterTube_UpdateCustomUrlMap'");
  const customUrl = sliceBetween(handler, "type === 'FilterTube_UpdateCustomUrlMap'", "type === 'FilterTube_CollaboratorInfoResponse'");

  assert.match(channelMap, /persistChannelMappings\(payload\)/);
  assert.match(videoChannel, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(videoChannel, /document\.querySelectorAll\(`\[data-filtertube-video-id="\$\{videoId\}"\]`\)/);
  assert.match(videoChannel, /stampChannelIdentity\(card, \{ id: channelId \}, \{ scheduleFallback: false \}\)/);
  assert.match(videoChannel, /requestAnimationFrame\(\(\) => \{/);
  assert.match(videoChannel, /applyDOMFallback\(null\)/);
  assert.match(videoMeta, /persistVideoMetaMapping\(updates\)/);
  assert.match(videoMeta, /touchDomForVideoMetaUpdate\(videoId\)/);
  assert.match(videoMeta, /scheduleVideoMetaDomRerun\(\)/);
  assert.match(customUrl, /browserAPI_BRIDGE\.storage\.local\.get\(\['channelMap'\]/);
  assert.match(customUrl, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);

  for (const block of [channelMap, videoChannel, videoMeta, customUrl]) {
    assert.doesNotMatch(block, /nonce|ownedPageWorldRequest|trustedSource|contentBridgeLearnedMapMessagePolicy/);
  }
});

test('pending response messages use request ids but do not make request id a sender capability', () => {
  const { handler } = contentBridgeBlocks();
  const collaborator = sliceBetween(handler, "type === 'FilterTube_CollaboratorInfoResponse'", "type === 'FilterTube_SubscriptionsImportProgress'");
  const subProgress = sliceBetween(handler, "type === 'FilterTube_SubscriptionsImportProgress'", "type === 'FilterTube_SubscriptionsImportResponse'");
  const subResponse = sliceBetween(handler, "type === 'FilterTube_SubscriptionsImportResponse'", "type === 'FilterTube_CacheCollaboratorInfo'");
  const channel = sliceBetween(handler, "type === 'FilterTube_ChannelInfoResponse'", "type === 'FilterTube_CollabDialogData'");

  assert.match(collaborator, /window\.pendingCollaboratorRequests\.get\(requestId\)/);
  assert.match(collaborator, /clearTimeout\(pending\.timeoutId\)/);
  assert.match(collaborator, /pending\.resolve\(collaborators\)/);
  assert.match(collaborator, /if \(videoId && Array\.isArray\(collaborators\) && collaborators\.length > 0\)/);
  assert.match(collaborator, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.match(subProgress, /window\.pendingSubscriptionImportRequests\.get\(requestId\)/);
  assert.match(subProgress, /pending\.timeoutId = setTimeout\(\(\) => \{/);
  assert.match(subResponse, /window\.pendingSubscriptionImportRequests\.get\(requestId\)/);
  assert.match(subResponse, /pending\.resolve\(payload \|\| \{ success: false/);
  assert.match(channel, /window\.pendingChannelInfoRequests\.get\(requestId\)/);
  assert.match(channel, /pending\.resolve\(channel \|\| null\)/);

  for (const block of [collaborator, subProgress, subResponse, channel]) {
    assert.doesNotMatch(block, /nonce|senderCapability|contentBridgePendingResponseCorrelationReport/);
  }
});

test('cache and dialog collaborator messages can apply collaborators without pending request ownership', () => {
  const { handler } = contentBridgeBlocks();
  const cache = sliceBetween(handler, "type === 'FilterTube_CacheCollaboratorInfo'", "type === 'FilterTube_ChannelInfoResponse'");
  const dialog = sliceBetween(handler, "type === 'FilterTube_CollabDialogData'", '\n    }\n}\n');

  assert.match(cache, /const videoId = payload\?\.videoId/);
  assert.match(cache, /document\.querySelectorAll\(selectors\.join\(','\)\)/);
  assert.match(cache, /card\.setAttribute\('data-filtertube-video-id', videoId\)/);
  assert.match(cache, /applyResolvedCollaborators\(videoId, collaborators, \{/);
  assert.match(cache, /sourceLabel: 'xhr'/);
  assert.doesNotMatch(cache, /pending[A-Za-z]+Requests|get\(requestId\)|requestId|nonce|contentBridgeUnsolicitedCollaboratorPolicy/);

  assert.match(dialog, /window\.pendingCollabCards\.has\(collabKey\)/);
  assert.match(dialog, /window\.pendingCollabCards\.get\(collabKey\)/);
  assert.match(dialog, /if \(videoId\) \{\s*applyResolvedCollaborators\(videoId, sanitized, \{/s);
  assert.match(dialog, /sourceLabel: 'dialog'/);
  assert.match(dialog, /force: true/);
  assert.doesNotMatch(dialog, /pending[A-Za-z]+Requests|get\(requestId\)|requestId|nonce|contentBridgeUnsolicitedCollaboratorPolicy/);
});

test('product runtime has no shared content bridge main-world dispatch authority symbols yet', () => {
  const runtime = read('js/content_bridge.js');

  for (const missingAuthority of [
    'contentBridgeMainWorldMessageDispatchContract',
    'contentBridgePageMessageSenderPolicy',
    'contentBridgePageMessageNonceReport',
    'contentBridgeMessageTypeSideEffectReport',
    'contentBridgeRefreshOwnershipReport',
    'contentBridgeLearnedMapMessagePolicy',
    'contentBridgePendingResponseCorrelationReport',
    'contentBridgeUnsolicitedCollaboratorPolicy',
    'contentBridgeMessageDispatchMetricArtifact',
    'contentBridgeMainWorldMessageFixtureProvenance'
  ]) {
    assert.equal(runtime.includes(missingAuthority), false, `${missingAuthority} should remain absent in current product runtime`);
  }
});
