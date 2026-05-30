import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function sourceLineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
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

function blockStats(text) {
  return {
    lines: text.split('\n').length,
    bytes: Buffer.byteLength(text)
  };
}

const sources = {
  background: read('js/background.js'),
  stateManager: read('js/state_manager.js'),
  contentBridge: read('js/content_bridge.js'),
  blockChannel: read('js/content/block_channel.js')
};

function blocks() {
  return {
    stateManagerAddChannel: sliceBetween(
      sources.stateManager,
      'async function addChannel(input)',
      'async function fetchSubscribedChannelsFromImportTab'
    ),
    stateManagerAddKidsChannel: sliceBetween(
      sources.stateManager,
      'async function addKidsChannel(input)',
      'async function removeKidsChannel'
    ),
    backgroundAddWhitelistChannelPersistent: sliceBetween(
      sources.background,
      "} else if (action === 'addWhitelistChannelPersistent')",
      "} else if (action === 'FilterTube_BatchImportWhitelistChannels')"
    ),
    backgroundKidsWhitelistChannel: sliceBetween(
      sources.background,
      "} else if (action === 'FilterTube_KidsWhitelistChannel')",
      "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"
    ),
    backgroundKidsBlockChannel: sliceBetween(
      sources.background,
      "} else if (action === 'FilterTube_KidsBlockChannel')",
      '} else if (request.action === "injectScripts")'
    ),
    backgroundAddChannelPersistentAction: sliceBetween(
      sources.background,
      '} else if (request.action === "addChannelPersistent")',
      '} else if (request.action === "FilterTube_ApplySettings" && request.settings)'
    ),
    backgroundSecondaryAddFilteredChannel: sliceBetween(
      sources.background,
      "if (message.type === 'addFilteredChannel')",
      "if (message.type === 'toggleChannelFilterAll')"
    ),
    backgroundHandleAddFilteredChannel: sliceBetween(
      sources.background,
      'async function handleAddFilteredChannel(input, filterAll = false',
      '/**\n * Handle toggling Filter All Content for a channel'
    ),
    contentBridgeAddChannelDirectly: sliceBetween(
      sources.contentBridge,
      'async function addChannelDirectly(input, filterAll = false',
      '/**\n * Add "Filter All Content" checkbox below the blocked channel'
    ),
    quickBlockEnabledGate: sliceBetween(
      sources.blockChannel,
      'const isQuickBlockEnabled = () => {',
      'function hasActiveQuickBlockRuleContext(settings)'
    ),
    quickBlockAction: sliceBetween(
      sources.blockChannel,
      'const targetGroup = (info?.channelInfo?.collaborationGroupId',
      'function attachQuickBlockWrapHoverEvents'
    ),
    menuInjectedGate: sliceBetween(
      sources.contentBridge,
      'async function injectFilterTubeMenuItem(dropdown, videoCard) {',
      '// Extract initial channel info (synchronous from DOM)'
    ),
    contentBridgeHandleBlockChannelClickHead: sliceBetween(
      sources.contentBridge,
      'async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {',
      '    const confirmOptimisticHide'
    )
  };
}

function assertMenuQuickRuleMutationIngressSnapshot(doc) {
  const currentBlocks = blocks();

  assert.match(doc, /Menu And Quick-Block Rule Mutation Ingress Snapshot - 2026-05-27/);
  assert.match(doc, /release-facing quick-cross and 3-dot menu action\s+paths/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /visible user action/);
  assert.match(doc, /quick-cross action/);
  assert.match(doc, /No single rule mutation report yet/);
  assert.match(doc, /menu\/quick rule mutation ingress authority: NO-GO/);
  assert.match(doc, /single-channel list-target authority: NO-GO/);
  assert.match(doc, /single-channel side-effect budget authority: NO-GO/);
  assert.match(doc, /runtime behavior changed by this addendum: no/);
  assert.match(doc, /A future optimization must keep all of those paths\s+consistent/);

  for (const row of [
    '| Quick-cross enabled gate | `js/content/block_channel.js:1205-1222` |',
    '| Quick-cross mutation handoff | `js/content/block_channel.js:1648-1748` |',
    '| 3-dot menu injected gate | `js/content_bridge.js:10517-10529` |',
    '| 3-dot block handler | `js/content_bridge.js:11985-12054` |',
    '| Direct content mutation payload | `js/content_bridge.js:13219-13237` |',
    '| Dashboard Main add | `js/state_manager.js:1635-1653` |',
    '| Dashboard Main remove | `js/state_manager.js:1856-1869` |',
    '| Background Main whitelist add | `js/background.js:3518-3544` |',
    '| Background legacy block add | `js/background.js:4205-4372` |',
    '| Shared helper storage/cache fanout | `js/background.js:5309-6192` |'
  ]) {
    assert.ok(doc.includes(row), `missing ingress snapshot row ${row}`);
  }

  assert.match(currentBlocks.quickBlockEnabledGate, /currentSettings\.showQuickBlockButton !== true/);
  assert.match(currentBlocks.quickBlockEnabledGate, /currentSettings\.listMode === 'whitelist'/);
  assert.match(currentBlocks.quickBlockAction, /handleBlockChannelClick\(info\.channelInfo, synthetic, false, videoCard\)/);
  assert.match(currentBlocks.quickBlockAction, /type: 'addFilteredChannel'/);
  assert.match(currentBlocks.quickBlockAction, /profile: isKidsSite \? 'kids' : 'main'/);
  assert.match(currentBlocks.quickBlockAction, /applyDOMFallback\(null, \{ preserveScroll: true \}\)/);
  assert.match(currentBlocks.menuInjectedGate, /currentSettings\?\.listMode === 'whitelist'/);
  assert.match(currentBlocks.menuInjectedGate, /currentSettings\?\.showBlockMenuItem === false/);
  assert.match(currentBlocks.contentBridgeHandleBlockChannelClickHead, /filterAll = isFilterAllToggleActive\(domToggle\)/);
  assert.match(currentBlocks.contentBridgeHandleBlockChannelClickHead, /const optimisticHideState = \[\]/);
  assert.match(currentBlocks.contentBridgeAddChannelDirectly, /type: 'addFilteredChannel'/);
  assert.match(currentBlocks.contentBridgeAddChannelDirectly, /FilterTube_ScheduleAutoBackup/);

  const runtimeSource = [
    sources.background,
    sources.stateManager,
    sources.contentBridge,
    sources.blockChannel
  ].join('\n');
  assert.doesNotMatch(runtimeSource, /menuQuickRuleMutationIngressAuthority|singleChannelListTargetAuthority|singleChannelSideEffectBudgetAuthority/);
}

test('single-channel rule mutation persistence audit document records current boundary and fixtures', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Status: current-behavior proof slice. Updated after the 2026-05-31 receiver',
    '3 single-channel rule mutation persistence source files',
    '9 source/effect blocks',
    'state_manager_add_channel_chooses_background_action_from_main_mode',
    'state_manager_add_kids_channel_chooses_background_action_from_kids_mode',
    'main_whitelist_single_add_is_trusted_sender_gated_but_not_session_locked',
    'kids_block_single_add_uses_background_helper_without_trusted_sender_gate',
    'secondary_addFilteredChannel_forwards_explicit_list_type',
    'content_bridge_addChannelDirectly_schedules_a_second_backup_request_after_success',
    'Main, Kids, content quick-block, and legacy background additions do not share one mutation path.',
    'Runtime behavior changed by the 2026-05-31 receiver fix: explicit addFilteredChannel listType is now forwarded.'
  ]) {
    assert.ok(doc.includes(marker), `missing marker: ${marker}`);
  }

  assertMenuQuickRuleMutationIngressSnapshot(doc);
});

test('single-channel rule mutation source fingerprints stay pinned', () => {
  const doc = read(auditDocPath);
  const expected = [
    ['js/background.js', 6320, 285103, '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'],
    ['js/state_manager.js', 2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6'],
    ['js/content_bridge.js', 13571, 601694, '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3']
  ];

  for (const [file, lines, bytes, hash] of expected) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('single-channel rule mutation source/effect block metrics stay pinned in the doc', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    stateManagerAddChannel: ['StateManager addChannel block', 75, 3276],
    stateManagerAddKidsChannel: ['StateManager addKidsChannel block', 79, 3400],
    backgroundAddWhitelistChannelPersistent: ['background addWhitelistChannelPersistent block', 40, 1329],
    backgroundKidsWhitelistChannel: ['background FilterTube_KidsWhitelistChannel block', 54, 2107],
    backgroundKidsBlockChannel: ['background FilterTube_KidsBlockChannel block', 43, 1769],
    backgroundAddChannelPersistentAction: ['background addChannelPersistent action block', 287, 13345],
    backgroundSecondaryAddFilteredChannel: ['background secondary addFilteredChannel receiver block', 39, 1579],
    backgroundHandleAddFilteredChannel: ['background handleAddFilteredChannel block', 894, 45226],
    contentBridgeAddChannelDirectly: ['content_bridge addChannelDirectly block', 55, 2662]
  };

  for (const [key, [label, lines, bytes]] of Object.entries(expected)) {
    assert.deepEqual(blockStats(currentBlocks[key]), { lines, bytes }, `${key} stats drifted`);
    assert.match(doc, new RegExp(`${label}: ${lines} lines, ${bytes} bytes`));
  }
});

test('StateManager channel additions choose background actions from Main and Kids modes', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.stateManagerAddChannel, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(currentBlocks.stateManagerAddChannel, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(currentBlocks.stateManagerAddChannel, /action,/);
  assert.match(currentBlocks.stateManagerAddChannel, /await loadSettings\(\)/);

  assert.match(currentBlocks.stateManagerAddKidsChannel, /const action = kids\.mode === 'whitelist' \? 'FilterTube_KidsWhitelistChannel' : 'FilterTube_KidsBlockChannel'/);
  assert.match(currentBlocks.stateManagerAddKidsChannel, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(currentBlocks.stateManagerAddKidsChannel, /source: 'user'/);
  assert.match(currentBlocks.stateManagerAddKidsChannel, /await loadSettings\(\)/);
});

test('single-channel background sender and lock gates remain split across sibling actions', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.backgroundAddWhitelistChannelPersistent, /isTrustedUiSender\(sender\)/);
  assert.match(currentBlocks.backgroundKidsWhitelistChannel, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(currentBlocks.backgroundKidsBlockChannel, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(currentBlocks.backgroundAddChannelPersistentAction, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(currentBlocks.backgroundSecondaryAddFilteredChannel, /isTrustedUiSender\(sender\)/);

  for (const block of [
    currentBlocks.backgroundAddWhitelistChannelPersistent,
    currentBlocks.backgroundKidsWhitelistChannel,
    currentBlocks.backgroundKidsBlockChannel,
    currentBlocks.backgroundAddChannelPersistentAction,
    currentBlocks.backgroundSecondaryAddFilteredChannel
  ]) {
    assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|sessionPinCache|lockAuthority/);
  }
});

test('single-channel list target routing forwards explicit secondary addFilteredChannel listType', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.backgroundAddWhitelistChannelPersistent, /handleAddFilteredChannel\(\s*input,\s*false,\s*null,\s*null,\s*\{ source: 'user' \},\s*'main',\s*'',\s*'whitelist'\s*\)/);
  assert.match(currentBlocks.backgroundKidsWhitelistChannel, /handleAddFilteredChannel\([\s\S]*'kids',\s*rawVideoId,\s*'whitelist'\s*\)/);
  assert.match(currentBlocks.backgroundKidsBlockChannel, /handleAddFilteredChannel\([\s\S]*'kids',\s*rawVideoId\s*\)/);
  assert.match(currentBlocks.backgroundSecondaryAddFilteredChannel, /const targetProfile = message\.profile \|\| 'main'/);
  assert.match(currentBlocks.backgroundSecondaryAddFilteredChannel, /const targetListType = message\.listType === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(currentBlocks.backgroundSecondaryAddFilteredChannel, /handleAddFilteredChannel\([\s\S]*targetProfile,\s*message\.videoId \|\| '',\s*targetListType\s*\)/);
  assert.match(currentBlocks.backgroundHandleAddFilteredChannel, /listType = 'blocklist'/);
  assert.match(currentBlocks.backgroundHandleAddFilteredChannel, /const targetListType = listType === 'whitelist' \? 'whitelist' : 'blocklist'/);
});

test('legacy addChannelPersistent remains a separate inline persistence path from the shared helper', () => {
  const { backgroundAddChannelPersistentAction: block } = blocks();

  assert.match(block, /const normalizeChannelInput = \(rawInput\) => \{/);
  assert.match(block, /fetchChannelInfo\(lookupValue\)/);
  assert.match(block, /channels\.unshift\(newEntry\)/);
  assert.match(block, /writePayload\[FT_PROFILES_V4_KEY\] = nextProfilesV4/);
  assert.match(block, /browserAPI\.storage\.local\.set\(writePayload/);
  assert.match(block, /scheduleAutoBackupInBackground\('channel_added'\)/);
  assert.doesNotMatch(block, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(block, /compiledSettingsCache\.main = null/);
});

test('shared handleAddFilteredChannel currently mixes network identity repair storage writes cache invalidation and post-block enrichment', () => {
  const { backgroundHandleAddFilteredChannel: block } = blocks();

  for (const marker of [
    'fetchChannelInfo(lookupValue)',
    'performWatchIdentityFetch',
    'performKidsWatchIdentityFetch',
    'performShortsIdentityFetch',
    'enqueueVideoChannelMapUpdate',
    'enqueueChannelMapUpdate',
    'browserAPI.storage.local.set({ channelMap',
    'storageWritePayload[FT_PROFILES_V4_KEY]',
    'storageWritePayload.ftProfilesV3',
    'storageWritePayload.filterChannels = channels',
    'storageWritePayload.uiChannels',
    'await browserAPI.storage.local.set(storageWritePayload)',
    'compiledSettingsCache.main = null',
    'compiledSettingsCache.kids = null',
    'schedulePostBlockEnrichment(finalChannelData, profile'
  ]) {
    assert.ok(block.includes(marker), `missing helper marker: ${marker}`);
  }

  assert.match(block, /whitelistChannels: \(!isKids && targetListType === 'whitelist'\) \? channels : safeArray\(nextMain\.whitelistChannels\)/);
  assert.match(block, /blockedChannels: \(isKids && targetListType === 'blocklist'\) \? channels : safeArray\(nextKids\.blockedChannels\)/);
  assert.match(block, /whitelistChannels: \(isKids && targetListType === 'whitelist'\) \? channels : safeArray\(nextKids\.whitelistChannels\)/);
});

test('selected background mutation token counts stay pinned', () => {
  const currentBlocks = blocks();
  const selected = [
    currentBlocks.backgroundAddWhitelistChannelPersistent,
    currentBlocks.backgroundKidsWhitelistChannel,
    currentBlocks.backgroundKidsBlockChannel,
    currentBlocks.backgroundAddChannelPersistentAction,
    currentBlocks.backgroundSecondaryAddFilteredChannel,
    currentBlocks.backgroundHandleAddFilteredChannel
  ].join('\n');
  const expectedCounts = {
    isTrustedUiSender: 2,
    isProfileSessionAuthorized: 0,
    handleAddFilteredChannel: 5,
    addChannelPersistent: 1,
    addFilteredChannel: 1,
    'storage.local.set': 5,
    'browserAPI.storage.local.set': 5,
    compiledSettingsCache: 2,
    scheduleAutoBackupInBackground: 5,
    FilterTube_RefreshNow: 1,
    'tabs.query': 1,
    sendMessageToTabQuietly: 1,
    channelMap: 39,
    fetchChannelInfo: 6,
    performWatchIdentityFetch: 7,
    performKidsWatchIdentityFetch: 3,
    performShortsIdentityFetch: 2,
    enqueueChannelMapUpdate: 2,
    enqueueVideoChannelMapUpdate: 1,
    schedulePostBlockEnrichment: 1,
    targetListType: 17,
    whitelistChannels: 12,
    blockedChannels: 8,
    filterChannels: 7,
    ftProfilesV3: 5,
    FT_PROFILES_V4_KEY: 6,
    sendResponse: 20
  };

  for (const [token, expected] of Object.entries(expectedCounts)) {
    assert.equal(countLiteral(selected, token), expected, `${token} count drifted`);
  }
});

test('content bridge addChannelDirectly sends addFilteredChannel and can schedule a second backup after success', () => {
  const { contentBridgeAddChannelDirectly: block } = blocks();

  assert.match(block, /browserAPI_BRIDGE\.runtime\.sendMessage\(\{/);
  assert.match(block, /type: 'addFilteredChannel'/);
  assert.match(block, /profile,/);
  assert.match(block, /customUrl: metadata\.customUrl \|\| null/);
  assert.match(block, /source: metadata\.source \|\| null/);
  assert.match(block, /if \(response && response\.success\) \{/);
  assert.match(block, /FilterTube_ScheduleAutoBackup/);
  assert.match(block, /triggerType: 'channel_added'/);
  assert.match(block, /window\.FilterTubeIO\.scheduleAutoBackup\('channel_added'\)/);
});

test('future single-channel rule mutation authority symbols are not present in product runtime source yet', () => {
  const runtimeSource = [
    sources.background,
    sources.stateManager,
    sources.contentBridge
  ].join('\n');
  const doc = read(auditDocPath);

  for (const symbol of [
    'singleChannelRuleMutationPersistenceContract',
    'singleChannelRuleMutationReport',
    'singleChannelRuleMutationSenderPolicy',
    'singleChannelRuleMutationProfileLockReport',
    'singleChannelRuleMutationListTypePolicy',
    'singleChannelRuleMutationStorageWriteReport',
    'singleChannelRuleMutationCacheInvalidationReport',
    'singleChannelRuleMutationNetworkBudget',
    'singleChannelRuleMutationBackupPolicy',
    'singleChannelRuleMutationPostEnrichmentPolicy',
    'singleChannelRuleMutationFixtureProvenance',
    'singleChannelRuleMutationMetricArtifact'
  ]) {
    assert.doesNotMatch(runtimeSource, new RegExp(symbol), `${symbol} unexpectedly exists in runtime source`);
    assert.match(doc, new RegExp(symbol), `${symbol} should be named as missing future authority`);
  }
});
