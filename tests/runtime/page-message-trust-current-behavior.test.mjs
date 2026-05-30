import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function lineOf(file, needle) {
  const lines = read(file).split(/\r?\n/);
  const index = lines.findIndex(line => line.includes(needle));
  assert.ok(index >= 0, `${file} missing ${needle}`);
  return index + 1;
}

function uniqueAcceptedContentBridgeMessageTypes() {
  const source = read('js/content_bridge.js');
  const handler = sliceBetween(source, 'function handleMainWorldMessages', 'async function initialize');
  return [...new Set([...handler.matchAll(/type === '(FilterTube_[^']+)'/g)].map(match => match[1]))];
}

function assertSameWindowStateChangingMessageSnapshot(doc) {
  const acceptedTypes = uniqueAcceptedContentBridgeMessageTypes();
  const stateChangingWithoutRequiredPending = [
    'FilterTube_Refresh',
    'FilterTube_UpdateChannelMap',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap',
    'FilterTube_UpdateCustomUrlMap',
    'FilterTube_CollaboratorInfoResponse',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_CollabDialogData'
  ];
  const sourcePins = [
    ['FilterTube_InjectorToBridge_Ready', 'js/content_bridge.js', "type === 'FilterTube_InjectorToBridge_Ready'"],
    ['FilterTube_Refresh', 'js/content_bridge.js', "type === 'FilterTube_Refresh'"],
    ['FilterTube_UpdateChannelMap', 'js/content_bridge.js', "type === 'FilterTube_UpdateChannelMap'"],
    ['FilterTube_UpdateVideoChannelMap', 'js/content_bridge.js', "type === 'FilterTube_UpdateVideoChannelMap'"],
    ['FilterTube_UpdateVideoMetaMap', 'js/content_bridge.js', "type === 'FilterTube_UpdateVideoMetaMap'"],
    ['FilterTube_UpdateCustomUrlMap', 'js/content_bridge.js', "type === 'FilterTube_UpdateCustomUrlMap'"],
    ['FilterTube_CollaboratorInfoResponse', 'js/content_bridge.js', "type === 'FilterTube_CollaboratorInfoResponse'"],
    ['FilterTube_SubscriptionsImportProgress', 'js/content_bridge.js', "type === 'FilterTube_SubscriptionsImportProgress'"],
    ['FilterTube_SubscriptionsImportResponse', 'js/content_bridge.js', "type === 'FilterTube_SubscriptionsImportResponse'"],
    ['FilterTube_CacheCollaboratorInfo', 'js/content_bridge.js', "type === 'FilterTube_CacheCollaboratorInfo'"],
    ['FilterTube_ChannelInfoResponse', 'js/content_bridge.js', "type === 'FilterTube_ChannelInfoResponse'"],
    ['FilterTube_CollabDialogData', 'js/content_bridge.js', "type === 'FilterTube_CollabDialogData'"]
  ];

  assert.match(doc, /Same-Window State-Changing Message Snapshot - 2026-05-27/);
  assert.match(doc, /content_bridge accepted FilterTube message rows: 12/);
  assert.match(doc, /state-changing rows without required pending request ownership: 8/);
  assert.match(doc, /content_bridge pending request maps: 3/);
  assert.match(doc, /injector string-source message listener rows: 1/);
  assert.match(doc, /subscription string-source message listener rows: 1/);
  assert.match(doc, /wildcard collab dialog broadcaster rows: 1/);
  assert.match(doc, /page-message trust behavior approval from this addendum: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.equal(acceptedTypes.length, 12);

  for (const type of stateChangingWithoutRequiredPending) {
    assert.ok(acceptedTypes.includes(type), `missing state-changing type ${type}`);
  }

  for (const [type, file, needle] of sourcePins) {
    const line = lineOf(file, needle);
    assert.ok(doc.includes(`| \`${type}\` | \`${file}:${line}\` |`), `missing source pin for ${type}`);
  }

  for (const [name, line] of [
    ['pendingCollaboratorRequests', lineOf('js/content_bridge.js', 'window.pendingCollaboratorRequests = new Map();')],
    ['pendingChannelInfoRequests', lineOf('js/content_bridge.js', 'window.pendingChannelInfoRequests = new Map();')],
    ['pendingSubscriptionImportRequests', lineOf('js/content_bridge.js', 'window.pendingSubscriptionImportRequests = new Map();')]
  ]) {
    assert.ok(doc.includes(`| \`${name}\` | \`js/content_bridge.js:${line}\` |`), `missing pending map ${name}`);
  }

  assert.ok(doc.includes(`| \`injector_message_listener\` | \`js/injector.js:${lineOf('js/injector.js', "window.addEventListener('message', (event) => {")}\` |`));
  assert.ok(doc.includes(`| \`subscription_import_listener\` | \`js/content/bridge_settings.js:${lineOf('js/content/bridge_settings.js', "window.addEventListener('message', (event) => {")}\` |`));
  const collabStart = lineOf('js/content/collab_dialog.js', 'window.postMessage({');
  const collabEnd = lineOf('js/content/collab_dialog.js', "source: 'collab_dialog'");
  assert.ok(doc.includes(`| \`collab_dialog_broadcast\` | \`js/content/collab_dialog.js:${collabStart}-${collabEnd}\` |`));
}

test('page-message trust audit documents current receivers and state-changing messages', () => {
  const doc = read(auditDocPath);

  for (const receiver of [
    'js/content_bridge.js',
    'js/injector.js',
    'js/content/bridge_settings.js',
    'js/content/collab_dialog.js'
  ]) {
    assert.ok(doc.includes(receiver), `missing receiver ${receiver}`);
  }

  for (const type of [
    'FilterTube_UpdateChannelMap',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap',
    'FilterTube_UpdateCustomUrlMap',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_CollabDialogData',
    'FilterTube_Refresh',
    'FilterTube_SettingsToInjector',
    'FilterTube_SubscriptionsImportResponse'
  ]) {
    assert.ok(doc.includes(type), `missing message type ${type}`);
  }

  assert.match(doc, /message type\s+-> allowed sender source label/);
  assert.match(doc, /page_message_spoof_update_video_channel_map/);
  assertSameWindowStateChangingMessageSnapshot(doc);
});

test('content bridge currently accepts same-window FilterTube messages without nonce or origin proof', () => {
  const source = read('js/content_bridge.js');
  const handler = sliceBetween(source, 'function handleMainWorldMessages', 'async function initialize');

  assert.match(handler, /event\.source !== window/);
  assert.match(handler, /event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.match(handler, /event\.data\.source === 'content_bridge'/);
  assert.doesNotMatch(handler, /\bevent\.origin\b/);
  assert.doesNotMatch(handler, /\bnonce\b|\btrustedSource\b|\ballowedSource\b/);

  assert.match(handler, /type === 'FilterTube_UpdateChannelMap'/);
  assert.match(handler, /type === 'FilterTube_UpdateVideoChannelMap'/);
  assert.match(handler, /type === 'FilterTube_UpdateVideoMetaMap'/);
  assert.match(handler, /type === 'FilterTube_CollabDialogData'/);
});

test('state-changing map and dialog messages are not all tied to pending request ownership today', () => {
  const source = read('js/content_bridge.js');
  const handler = sliceBetween(source, 'function handleMainWorldMessages', 'async function initialize');

  const updateVideoChannelMap = sliceBetween(handler, "type === 'FilterTube_UpdateVideoChannelMap'", "type === 'FilterTube_UpdateVideoMetaMap'");
  assert.match(updateVideoChannelMap, /persistVideoChannelMapping/);
  assert.match(updateVideoChannelMap, /applyDOMFallback\(null\)/);
  assert.doesNotMatch(updateVideoChannelMap, /pending[A-Za-z]+Requests|get\(requestId\)|requestId/);

  const updateVideoMetaMap = sliceBetween(handler, "type === 'FilterTube_UpdateVideoMetaMap'", "type === 'FilterTube_UpdateCustomUrlMap'");
  assert.match(updateVideoMetaMap, /persistVideoMetaMapping/);
  assert.match(updateVideoMetaMap, /scheduleVideoMetaDomRerun/);
  assert.doesNotMatch(updateVideoMetaMap, /pending[A-Za-z]+Requests|get\(requestId\)|requestId/);

  const updateCustomUrlMap = sliceBetween(handler, "type === 'FilterTube_UpdateCustomUrlMap'", "type === 'FilterTube_CollaboratorInfoResponse'");
  assert.match(updateCustomUrlMap, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.doesNotMatch(updateCustomUrlMap, /pending[A-Za-z]+Requests|get\(requestId\)|requestId/);

  const cacheCollaboratorInfo = sliceBetween(handler, "type === 'FilterTube_CacheCollaboratorInfo'", "type === 'FilterTube_ChannelInfoResponse'");
  assert.match(cacheCollaboratorInfo, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.doesNotMatch(cacheCollaboratorInfo, /pending[A-Za-z]+Requests|get\(requestId\)|requestId/);

  const collabDialogData = sliceBetween(handler, "type === 'FilterTube_CollabDialogData'", '\n    }\n}\n');
  assert.match(collabDialogData, /window\.pendingCollabCards\.has\(collabKey\)/);
  assert.match(collabDialogData, /if \(videoId\) \{/);
  assert.match(collabDialogData, /applyResolvedCollaborators\(videoId/);
});

test('FilterTube_Refresh currently lets same-window page messages force DOM fallback reprocessing', () => {
  const source = read('js/content_bridge.js');
  const handler = sliceBetween(source, 'function handleMainWorldMessages', 'async function initialize');
  const block = sliceBetween(
    handler,
    "type === 'FilterTube_Refresh'",
    "type === 'FilterTube_UpdateChannelMap'"
  );

  assert.match(block, /requestSettingsFromBackground\(\)\.then\(result =>/);
  assert.match(block, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.doesNotMatch(block, /pending[A-Za-z]+Requests|get\(requestId\)|requestId/);
  assert.doesNotMatch(block, /nonce|trustedSource|allowedSource/);
});

test('main-world listeners use string source labels and wildcard postMessage responses today', () => {
  const injector = read('js/injector.js');
  const injectorListener = sliceBetween(injector, '// Listen for settings and data requests from content_bridge', 'window.filterTubeInjectorBridgeReady = true');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const subscriptionListener = sliceBetween(bridgeSettings, "window.addEventListener('message'", '    });\n}');
  const collabDialog = read('js/content/collab_dialog.js');
  const collabBroadcast = sliceBetween(collabDialog, 'function broadcastCollabDialogData', 'function extractCollaboratorsFromDialog');

  assert.match(injectorListener, /event\.source !== window/);
  assert.match(injectorListener, /source === 'injector'/);
  assert.match(injectorListener, /source === 'content_bridge'/);
  assert.match(injectorListener, /source === 'filter_logic'/);
  assert.doesNotMatch(injectorListener, /\bevent\.origin\b|\bnonce\b|\btrustedSource\b/);
  assert.match(injectorListener, /\}, '\*'\)/);

  assert.match(subscriptionListener, /event\.source !== window/);
  assert.match(subscriptionListener, /data\.source !== 'injector'/);
  assert.match(subscriptionListener, /pendingSubscriptionImportRequests\.get\(requestId\)/);

  assert.match(collabBroadcast, /window\.postMessage/);
  assert.match(collabBroadcast, /source: 'collab_dialog'/);
  assert.match(collabBroadcast, /\}, '\*'\)/);
});
