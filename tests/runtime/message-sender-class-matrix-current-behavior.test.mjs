import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md';

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

function extractActionBranches(source) {
  const names = new Set();
  const regex = /\b(?:request\.)?action\s*===\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(source))) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function extractMessageTypeBranches(source) {
  const names = new Set();
  const regex = /\b(?:message\.type|type)\s*===\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(source))) {
    names.add(match[1]);
  }
  return [...names].sort();
}

test('message sender class matrix documents the ignored capture corpus as evidence only', () => {
  const doc = read(auditDocPath);
  const gitignore = read('.gitignore');

  for (const capture of [
    'DOMs.html',
    'YT_MAIN.json',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_UPNEXT_FEED_WATCHPAGE',
    'YT_MAIN_WATCH.html',
    'YT_MAIN_NEXT_RESPONSE_COMMENT.json',
    'playlist.json',
    'collab.json',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'ytkids_browse?alt=json.json'
  ]) {
    assert.ok(gitignore.includes(capture), `${capture} should remain ignored evidence`);
    assert.ok(doc.includes(capture), `${capture} should be named in the sender-class evidence boundary`);
  }

  assert.ok(doc.includes('valid evidence inputs, not runtime source'));
  assert.ok(doc.includes('must not become runtime fetch targets'));
});

test('background runtime action inventory is pinned to current branch set', () => {
  const background = read('js/background.js');
  const actions = extractActionBranches(background)
    .filter(name => name !== 'ucid' && name !== 'handle');

  assert.deepEqual(actions, [
    'FilterTube_ApplySettings',
    'FilterTube_BatchImportWhitelistChannels',
    'FilterTube_ClearSessionPin',
    'FilterTube_EnsureSubscriptionsImportBridge',
    'FilterTube_FirstRunCheck',
    'FilterTube_FirstRunComplete',
    'FilterTube_KidsBlockChannel',
    'FilterTube_KidsWhitelistChannel',
    'FilterTube_OpenWhatsNew',
    'FilterTube_ReleaseNotesAck',
    'FilterTube_ReleaseNotesCheck',
    'FilterTube_ScheduleAutoBackup',
    'FilterTube_SessionPinAuth',
    'FilterTube_SetListMode',
    'FilterTube_SubscriptionsImportProgress',
    'FilterTube_TransferWhitelistToBlocklist',
    'addChannelPersistent',
    'addWhitelistChannelPersistent',
    'fetchChannelDetails',
    'fetchShortsIdentity',
    'fetchWatchIdentity',
    'getBrowserInfo',
    'getCompiledSettings',
    'injectScripts',
    'processFetchData',
    'recordTimeSaved',
    'updateChannelMap',
    'updateVideoChannelMap',
    'updateVideoMetaMap'
  ]);

  assert.equal(actions.length, 29);

  const doc = read(auditDocPath);
  for (const action of actions) {
    assert.ok(doc.includes(`\`${action}\``), `audit doc missing background action ${action}`);
  }
});

test('secondary background typed-message inventory is pinned and documented', () => {
  const background = read('js/background.js');
  const secondary = sliceBetween(
    background,
    '// MESSAGE HANDLERS - Support 3-Dot Menu Feature',
    '/**\n * Handle adding a filtered channel'
  );
  const types = extractMessageTypeBranches(secondary);

  assert.deepEqual(types, [
    'addFilteredChannel',
    'toggleChannelFilterAll'
  ]);

  const doc = read(auditDocPath);
  for (const type of types) {
    assert.ok(doc.includes(`\`${type}\``), `audit doc missing secondary message ${type}`);
  }
});

test('content bridge page-message inventory is pinned to current branch set', () => {
  const bridge = read('js/content_bridge.js');
  const handler = sliceBetween(bridge, 'function handleMainWorldMessages', 'async function initialize');
  const types = extractMessageTypeBranches(handler);

  assert.deepEqual(types, [
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_ChannelInfoResponse',
    'FilterTube_CollabDialogData',
    'FilterTube_CollaboratorInfoResponse',
    'FilterTube_InjectorToBridge_Ready',
    'FilterTube_Refresh',
    'FilterTube_SubscriptionsImportProgress',
    'FilterTube_SubscriptionsImportResponse',
    'FilterTube_UpdateChannelMap',
    'FilterTube_UpdateCustomUrlMap',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap'
  ]);

  assert.equal(types.length, 12);

  const doc = read(auditDocPath);
  for (const type of types) {
    assert.ok(doc.includes(`\`${type}\``), `audit doc missing page message ${type}`);
  }
});

test('main-world receiver inventory is pinned across injector and subscription bridge', () => {
  const injector = read('js/injector.js');
  const bridgeSettings = read('js/content/bridge_settings.js');

  const injectorListener = sliceBetween(
    injector,
    '// Listen for settings and data requests from content_bridge',
    'window.filterTubeInjectorBridgeReady = true'
  );
  const bridgeRuntimeListener = sliceBetween(
    bridgeSettings,
    'browserAPI_BRIDGE.runtime.onMessage.addListener',
    'let pendingSeedSettings = null'
  );

  assert.deepEqual(extractMessageTypeBranches(injectorListener), [
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_RequestChannelInfo',
    'FilterTube_RequestCollaboratorInfo',
    'FilterTube_SettingsToInjector'
  ]);

  assert.deepEqual(extractActionBranches(bridgeRuntimeListener), [
    'FilterTube_ApplySettings',
    'FilterTube_ImportSubscribedChannels',
    'FilterTube_Ping',
    'FilterTube_RefreshNow'
  ]);

  const doc = read(auditDocPath);
  for (const name of [
    'FilterTube_SettingsToInjector',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_RequestCollaboratorInfo',
    'FilterTube_RequestChannelInfo',
    'FilterTube_Ping',
    'FilterTube_RefreshNow',
    'FilterTube_ImportSubscribedChannels',
    'FilterTube_ApplySettings'
  ]) {
    assert.ok(doc.includes(`\`${name}\``), `audit doc missing main-world receiver ${name}`);
  }
});

test('similar channel mutations currently have uneven sender gates', () => {
  const source = read('js/background.js');
  const kidsWhitelist = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsWhitelistChannel')",
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"
  );
  const kidsBlock = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsBlockChannel')",
    '} else if (request.action === "injectScripts")'
  );
  const mainWhitelist = sliceBetween(
    source,
    "} else if (action === 'addWhitelistChannelPersistent')",
    "} else if (action === 'FilterTube_BatchImportWhitelistChannels')"
  );
  const mainBlock = sliceBetween(
    source,
    '} else if (request.action === "addChannelPersistent")',
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)'
  );

  assert.match(kidsWhitelist, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(kidsBlock, /isTrustedUiSender\(sender\)/);
  assert.match(mainWhitelist, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(mainBlock, /isTrustedUiSender\(sender\)/);

  const doc = read(auditDocPath);
  assert.ok(doc.includes('Similar Mutations Have Different Gates'));
});

test('future messageSenderClassMatrix contract names side-effect columns', () => {
  const doc = read(auditDocPath);

  assert.ok(doc.includes('messageSenderClassMatrix'));
  for (const senderClass of [
    'trustedUi',
    'allowedYoutubeContentScript',
    'ownedPageWorldRequest',
    'backgroundInternal'
  ]) {
    assert.ok(doc.includes(senderClass), `missing sender class ${senderClass}`);
  }

  for (const column of [
    'receiver',
    'action/messageType',
    'current gate',
    'future sender class',
    'allowed sender files',
    'target profile/surface/list',
    'storage keys touched',
    'network/tab/script side effects',
    'pending request or nonce requirement',
    'route requirement',
    'backup/cache/broadcast side effects',
    'negative spoof fixture'
  ]) {
    assert.ok(doc.includes(column), `missing future matrix column ${column}`);
  }
});
