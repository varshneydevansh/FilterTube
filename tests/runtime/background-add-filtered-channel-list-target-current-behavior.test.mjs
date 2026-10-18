import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_ADD_FILTERED_CHANNEL_LIST_TARGET_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/background.js': [8538, 386043, 'cc89bb4a0375145e1c811b7cf5953729c39c409b6b24cacdc65c80f9f6ff44d0']
};

const blockSpecs = {
  backgroundAddFilteredChannelReceiver: {
    file: 'js/background.js',
    start: "if (message.type === 'addFilteredChannel')",
    end: "if (message.type === 'toggleChannelFilterAll')",
    startLine: 7072,
    lines: 58,
    bytes: 2408,
    hash: '3a506e117b2d2a79bc9156c5dcb782077c69bc63a3b3a3fe982d25d7f2f5553c'
  },
  backgroundHandleAddFilteredChannelFull: {
    file: 'js/background.js',
    start: 'async function handleAddFilteredChannel(input, filterAll = false',
    end: '/**\n * Handle toggling Filter All Content for a channel',
    startLine: 7156,
    lines: 1103,
    bytes: 56174,
    hash: '0813495a9a573714752a0c646b0cf6c716e83df39c3f678f1de45a4ffbdbf81c'
  },
  backgroundHandleAddFilteredChannelSignatureAndInput: {
    file: 'js/background.js',
    start: 'async function handleAddFilteredChannel(input, filterAll = false',
    end: '// Prefer canonical UC IDs via channelMap when available',
    startLine: 7156,
    lines: 219,
    bytes: 8827,
    hash: '4866592e320f225dc019d34b92bb5e8d2aa70dbc726fe3cdbc67f1e9896d72f0'
  },
  backgroundHandleAddFilteredChannelIdentityRepair: {
    file: 'js/background.js',
    start: '// Prefer canonical UC IDs via channelMap when available',
    end: '// Check if channel already exists; if so, upgrade instead of rejecting.',
    startLine: 7374,
    lines: 378,
    bytes: 20938,
    hash: '839fbf2df32d71bde14965ee5bcd6fd428303030a299c5725375d26b0ac04488'
  },
  backgroundHandleAddFilteredChannelExistingAndWrite: {
    file: 'js/background.js',
    start: '// Check if channel already exists; if so, upgrade instead of rejecting.',
    end: 'if (didMutateChannelList && Object.keys(storageWritePayload).length > 0) {',
    startLine: 7751,
    lines: 476,
    bytes: 25264,
    hash: '0b460310c480b77d27b5da33a1a54ec29cc3ccb15e84d401b5fc387987985646'
  },
  backgroundHandleAddFilteredChannelCommitAndReturn: {
    file: 'js/background.js',
    start: 'if (didMutateChannelList && Object.keys(storageWritePayload).length > 0) {',
    end: '/**\n * Handle toggling Filter All Content for a channel',
    startLine: 8226,
    lines: 33,
    bytes: 1145,
    hash: '09b31bd149e54402745971ae2b65b0f9f28f8810803c7107a173de201164fbea'
  }
};

const selectedCounts = {
  isTrustedUiSender: 0,
  isProfileSessionAuthorized: 2,
  handleAddFilteredChannel: 2,
  listType: 4,
  targetListType: 18,
  blocklist: 10,
  whitelist: 41,
  'message.listType': 1,
  'message.profile': 1,
  'message.videoId': 1,
  filterAll: 12,
  collaborationWith: 16,
  metadata: 92,
  storageWritePayload: 9,
  FT_PROFILES_V4_KEY: 5,
  ftProfilesV3: 4,
  filterChannels: 5,
  uiChannels: 1,
  whitelistChannels: 12,
  blockedChannels: 8,
  channelMap: 27,
  enqueueChannelMapUpdate: 2,
  enqueueVideoChannelMapUpdate: 1,
  'browserAPI.storage.local.set': 3,
  'compiledSettingsCache.main = null': 1,
  'compiledSettingsCache.kids = null': 1,
  schedulePostBlockEnrichment: 1,
  scheduleAutoBackupInBackground: 1,
  sendResponse: 1,
  'tabs.query': 1,
  FilterTube_RefreshNow: 1
};

const missingRuntimeSymbols = [
  'backgroundAddFilteredChannelListTargetContract',
  'backgroundAddFilteredChannelReceiverReport',
  'backgroundAddFilteredChannelSenderPolicy',
  'backgroundAddFilteredChannelListTypeForwardingPolicy',
  'backgroundAddFilteredChannelProfileTargetReport',
  'backgroundAddFilteredChannelStorageWriteReport',
  'backgroundAddFilteredChannelCacheInvalidationReport',
  'backgroundAddFilteredChannelBackupPolicy',
  'backgroundAddFilteredChannelIdentityRepairBudget',
  'backgroundAddFilteredChannelFixtureProvenance'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function countLiteral(text, needle) {
  return text.split(needle).length - 1;
}

function sliceBetween(text, spec) {
  const start = text.indexOf(spec.start);
  assert.notEqual(start, -1, `missing start needle: ${spec.start}`);
  const end = text.indexOf(spec.end, start + spec.start.length);
  assert.notEqual(end, -1, `missing end needle: ${spec.end}`);
  return {
    start,
    block: text.slice(start, end)
  };
}

function blockMetric(spec) {
  const source = read(spec.file);
  const { start, block } = sliceBetween(source, spec);
  return {
    startLine: source.slice(0, start).split(/\r?\n/).length,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block),
    hash: sha256Text(block),
    block
  };
}

function selectedSource() {
  return [
    blockMetric(blockSpecs.backgroundAddFilteredChannelReceiver).block,
    blockMetric(blockSpecs.backgroundHandleAddFilteredChannelFull).block
  ].join('\n');
}

function productRuntimeSource() {
  return execFileSync('git', ['ls-files', '*.js', '*.jsx', '*.mjs'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/'))
    .map(read)
    .join('\n');
}

function loadReceiverRuntime() {
  const receiverBlock = blockMetric(blockSpecs.backgroundAddFilteredChannelReceiver).block;
  const context = {
    __helperCalls: [],
    __backups: [],
    __responses: [],
    globalThis: {},
    console: { log() {}, warn() {}, error() {} },
    handleAddFilteredChannel(...args) {
      context.__helperCalls.push(JSON.parse(JSON.stringify(args)));
      return Promise.resolve({
        success: true,
        channelData: { id: 'UCreceiverlisttarget00001', handle: '@receiver' }
      });
    },
    scheduleAutoBackupInBackground(trigger) {
      context.__backups.push(trigger);
    },
    Promise,
    JSON,
    String,
    Boolean
  };
  vm.createContext(context);
  vm.runInContext(`
    this.runReceiver = function(message) {
      const sender = { id: 'sender-fixture' };
      const sendResponse = (response) => this.__responses.push(response);
      ${receiverBlock}
      return false;
    };
  `, context);
  return context;
}

test('background addFilteredChannel list-target audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: implementation-backed current-behavior proof/);
  assert.match(audit, /2026-05-31 receiver list-target fix/);
  assert.match(audit, /background rule-mutation authority/);
  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256File(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('background addFilteredChannel list-target source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.startLine, spec.startLine, `${name} start line changed`);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
    assert.equal(metric.hash, spec.hash, `${name} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${name}\` \\| \`${spec.file.replace('.', '\\.')}:${spec.startLine}\` \\| ${spec.lines} \\| ${spec.bytes} \\| \`${spec.hash}\` \\|`));
  }
});

test('background addFilteredChannel selected token counts remain pinned', () => {
  const source = selectedSource();
  const audit = doc();

  for (const [token, expected] of Object.entries(selectedCounts)) {
    assert.equal(countLiteral(source, token), expected, `${token} count changed`);
    assert.match(audit, new RegExp(`\\| \`${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${expected} \\|`));
  }
});

test('background addFilteredChannel missing future symbols remain absent from product runtime', () => {
  const source = productRuntimeSource();
  const audit = doc();

  for (const symbol of missingRuntimeSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in runtime`);
    assert.match(audit, new RegExp(`- \`${symbol}\``));
  }
});

test('secondary addFilteredChannel receiver forwards message.listType to helper and backup trigger', async () => {
  const runtime = loadReceiverRuntime();
  const returned = runtime.runReceiver({
    type: 'addFilteredChannel',
    input: '@receiver',
    filterAll: true,
    collaborationWith: ['@other'],
    collaborationGroupId: 'group-1',
    displayHandle: '@Receiver',
    canonicalHandle: '@receiver',
    channelName: 'Receiver Channel',
    channelLogo: 'https://example.test/logo.png',
    videoTitleHint: 'Fixture Video',
    expectedChannelName: 'Receiver Channel',
    lowConfidenceExpectedName: true,
    customUrl: 'c/Receiver',
    source: 'playlist_fallback_menu',
    profile: 'kids',
    videoId: 'abcdefghijk',
    listType: 'whitelist'
  });

  assert.equal(returned, true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(runtime.__helperCalls.length, 1);
  assert.deepEqual(runtime.__helperCalls[0], [
    '@receiver',
    true,
    ['@other'],
    'group-1',
    {
      displayHandle: '@Receiver',
      canonicalHandle: '@receiver',
      channelName: 'Receiver Channel',
      channelLogo: 'https://example.test/logo.png',
      videoTitleHint: 'Fixture Video',
      expectedChannelName: 'Receiver Channel',
      lowConfidenceExpectedName: true,
      customUrl: 'c/Receiver',
      source: 'playlist_fallback_menu'
    },
    'kids',
    'abcdefghijk',
    'whitelist'
  ]);
  assert.equal(runtime.__helperCalls[0].length, 8);
  assert.deepEqual(runtime.__backups, ['kids_whitelist_channel_added']);
  assert.equal(runtime.__responses[0].success, true);
});

test('secondary addFilteredChannel receiver defaults missing profile to main backup trigger', async () => {
  const runtime = loadReceiverRuntime();
  const returned = runtime.runReceiver({
    type: 'addFilteredChannel',
    input: 'UCdefaultprofiletarget0001',
    filterAll: false
  });

  assert.equal(returned, true);
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(runtime.__helperCalls.length, 1);
  assert.equal(runtime.__helperCalls[0][5], 'main');
  assert.equal(runtime.__helperCalls[0][6], '');
  assert.equal(runtime.__helperCalls[0][7], 'blocklist');
  assert.deepEqual(runtime.__backups, ['channel_added']);
});

test('handleAddFilteredChannel declares blocklist default and normalizes targetListType', () => {
  const full = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelFull).block;
  const signature = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelSignatureAndInput).block;

  assert.match(signature, /async function handleAddFilteredChannel\(input, filterAll = false, collaborationWith = null, collaborationGroupId = null, metadata = \{\}, profile = 'main', videoId = '', listType = 'blocklist'\)/);
  assert.match(full, /const targetListType = listType === 'whitelist' \? 'whitelist' : 'blocklist';/);
  assert.match(full, /const isKids = profile === 'kids';/);
  assert.match(full, /const rawValue = String\(input \|\| ''\)\.trim\(\);/);
  assert.match(full, /return \{ success: false, error: 'Empty input' \};/);
});

test('handleAddFilteredChannel identity repair mixes channelMap and watch identity side effects', () => {
  const block = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelIdentityRepair).block;

  for (const marker of [
    "storageGet(['channelMap'])",
    'performKidsWatchIdentityFetch(effectiveVideoId)',
    'performWatchIdentityFetch(effectiveVideoId)',
    'performShortsIdentityFetch(effectiveVideoId',
    'enqueueVideoChannelMapUpdate(effectiveVideoId, mappedId)',
    'enqueueChannelMapUpdate(resolvedHandle, mappedId)',
    'fetchChannelInfo(lookupValue)'
  ]) {
    assert.equal(block.includes(marker), true, `missing marker: ${marker}`);
  }
});

test('handleAddFilteredChannel writes profile/list-specific storage shapes', () => {
  const block = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelExistingAndWrite).block;

  assert.match(block, /const nextMainChannels = \(!isKids && targetListType === 'blocklist'\) \? channels : safeArray\(nextMain\.channels\);/);
  assert.match(block, /whitelistChannels: \(!isKids && targetListType === 'whitelist'\) \? channels : safeArray\(nextMain\.whitelistChannels\)/);
  assert.match(block, /blockedChannels: \(isKids && targetListType === 'blocklist'\) \? channels : safeArray\(nextKids\.blockedChannels\)/);
  assert.match(block, /whitelistChannels: \(isKids && targetListType === 'whitelist'\) \? channels : safeArray\(nextKids\.whitelistChannels\)/);
  assert.match(block, /blockedChannels: targetListType === 'blocklist'\s+\? channels/);
  assert.match(block, /whitelistedChannels: targetListType === 'whitelist'\s+\? channels/);
  assert.match(block, /storageWritePayload\.filterChannels = channels;/);
  assert.match(block, /storageWritePayload\.uiChannels = safeArray\(channels\)\.map/);
  assert.match(block, /storageWritePayload\.ftProfilesV3 = profilesV3;/);
});

test('handleAddFilteredChannel commit invalidates both compiled caches and queues enrichment', () => {
  const block = blockMetric(blockSpecs.backgroundHandleAddFilteredChannelCommitAndReturn).block;

  assert.match(block, /await browserAPI\.storage\.local\.set\(storageWritePayload\);/);
  assert.match(block, /compiledSettingsCache\.main = null;/);
  assert.match(block, /compiledSettingsCache\.kids = null;/);
  assert.match(block, /schedulePostBlockEnrichment\(finalChannelData, profile/);
  assert.match(block, /const result = \{\s+success: true,\s+channelData: finalChannelData,\s+updated: existingIndex !== -1\s+\};/);
  assert.match(block, /return result;/);
});

test('background addFilteredChannel audit doc records list-target behavior and open gates', () => {
  const audit = doc();

  assert.match(audit, /normalizes `message\.listType` and passes the effective list target into the helper/);
  assert.match(audit, /A caller may include `listType: 'whitelist'`, and the receiver now forwards `'whitelist'`/);
  assert.match(audit, /declares `listType = 'blocklist'`/);
  assert.match(audit, /defaults to blocklist only when the message omits `listType` or provides an unsupported value/);
  assert.match(audit, /For Main blocklist it writes V4 `main\.channels`/);
  assert.match(audit, /For Main whitelist it writes V4 `main\.whitelistChannels`/);
  assert.match(audit, /For Kids blocklist it writes V4 `kids\.blockedChannels`/);
  assert.match(audit, /for Kids whitelist it writes V4 `kids\.whitelistChannels`/);
  assert.match(audit, /query Kids tabs and send `FilterTube_RefreshNow`/);
  assert.match(audit, /null both compiled settings caches/);
  assert.match(audit, /scheduleAutoBackupInBackground\(\)/);
  assert.match(audit, /the secondary receiver and helper now agree on blocklist versus whitelist target/);
  assert.match(audit, /background add-filtered-channel contracts/);
  assert.match(audit, /list-type forwarding policies/);
  assert.match(audit, /profile target reports/);
  assert.match(audit, /storage-write reports/);
  assert.match(audit, /identity-repair budgets/);
});
