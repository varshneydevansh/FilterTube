import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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

function docNumberForSource(file, value) {
  return file === 'js/background.js' ? String(value) : value.toLocaleString('en-US');
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
      'async function addChannel(input, options = {})',
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
    ['js/background.js', 8538, 386043, 'cc89bb4a0375145e1c811b7cf5953729c39c409b6b24cacdc65c80f9f6ff44d0'],
    ['js/state_manager.js', 2979, 124009, '04879b5b1dcac9229c70d0ea14241667755682649865ad1d52030c1ce21950d3'],
    ['js/content_bridge.js', 15053, 678250, 'c653324d1f042c0473cf2102d81bcd161bfaa26f8c7ee545e250226594dc9618']
  ];

  for (const [file, lines, bytes, hash] of expected) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    const escapedFile = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const lineText = docNumberForSource(file, lines);
    const byteText = docNumberForSource(file, bytes);
    assert.match(doc, new RegExp(`\\| \`${escapedFile}\` \\| ${lineText} \\| ${byteText} \\| \`${hash}\` \\|`));
  }
});

test('single-channel rule mutation source/effect block metrics stay pinned in the doc', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    stateManagerAddChannel: ['StateManager addChannel block', 76, 3393],
    stateManagerAddKidsChannel: ['StateManager addKidsChannel block', 80, 3450],
    backgroundAddWhitelistChannelPersistent: ['background addWhitelistChannelPersistent block', 40, 1329],
    backgroundKidsWhitelistChannel: ['background FilterTube_KidsWhitelistChannel block', 54, 2107],
    backgroundKidsBlockChannel: ['background FilterTube_KidsBlockChannel block', 43, 1769],
    backgroundAddChannelPersistentAction: ['background addChannelPersistent action block', 311, 14558],
    backgroundSecondaryAddFilteredChannel: ['background secondary addFilteredChannel receiver block', 58, 2408],
    backgroundHandleAddFilteredChannel: ['background handleAddFilteredChannel block', 1104, 56174],
    contentBridgeAddChannelDirectly: ['content_bridge addChannelDirectly block', 56, 2759]
  };

  for (const [key, [label, lines, bytes]] of Object.entries(expected)) {
    assert.deepEqual(blockStats(currentBlocks[key]), { lines, bytes }, `${key} stats drifted`);
    assert.match(doc, new RegExp(`${label}: ${lines} lines, ${bytes} bytes`));
  }
});

test('StateManager channel additions choose background actions from Main and Kids modes', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.stateManagerAddChannel, /const action = useAllowList \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(currentBlocks.stateManagerAddChannel, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(currentBlocks.stateManagerAddChannel, /action,/);
  assert.match(currentBlocks.stateManagerAddChannel, /await loadSettings\(\)/);

  assert.match(currentBlocks.stateManagerAddKidsChannel, /const action = listKey === 'whitelistChannels' \? 'FilterTube_KidsWhitelistChannel' : 'FilterTube_KidsBlockChannel'/);
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
    currentBlocks.backgroundSecondaryAddFilteredChannel
  ]) {
    assert.doesNotMatch(block, /isProfileSessionAuthorized|profile_locked|sessionPinCache|lockAuthority/);
    assert.match(block, /handleAddFilteredChannel\(/, 'receiver delegates to the shared authorized writer');
  }
  assert.match(currentBlocks.backgroundAddChannelPersistentAction, /isProfileSessionAuthorized\(profilesV4ForMutation, activeProfileIdForMutation\)/);
  assert.match(currentBlocks.backgroundHandleAddFilteredChannel, /isProfileSessionAuthorized/);
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
  assert.match(block, /compiledSettingsCache\.main = null/);
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
    isProfileSessionAuthorized: 3,
    handleAddFilteredChannel: 5,
    addChannelPersistent: 1,
    addFilteredChannel: 1,
    'storage.local.set': 5,
    'browserAPI.storage.local.set': 5,
    compiledSettingsCache: 4,
    scheduleAutoBackupInBackground: 5,
    FilterTube_RefreshNow: 1,
    'tabs.query': 1,
    sendMessageToTabQuietly: 1,
    channelMap: 41,
    fetchChannelInfo: 6,
    performWatchIdentityFetch: 7,
    performKidsWatchIdentityFetch: 3,
    performShortsIdentityFetch: 2,
    enqueueChannelMapUpdate: 2,
    enqueueVideoChannelMapUpdate: 1,
    schedulePostBlockEnrichment: 1,
    targetListType: 18,
    whitelistChannels: 12,
    blockedChannels: 8,
    filterChannels: 8,
    ftProfilesV3: 5,
    FT_PROFILES_V4_KEY: 9,
    sendResponse: 22
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


test('actual legacy single-channel writer rejects a locked active profile before network or storage writes', async () => {
  const root = { schemaVersion: 4, activeProfileId: 'locked', profiles: { locked: {
    security: { profilePinVerifier: { hash: 'fixture-only-verifier' } }, main: {}, kids: {}
  } } };
  let writes = 0;
  let fetches = 0;
  let respond;
  const response = new Promise(resolve => { respond = resolve; });
  const context = vm.createContext({
    console: { log() {}, warn() {}, error() {} }, URL, Date, Map, decodeURIComponent,
    DEFAULT_PROFILE_ID: 'default', FT_PROFILES_V4_KEY: 'ftProfilesV4', sessionPinCache: new Map(),
    request: { action: 'addChannelPersistent', input: '@example' }, sendResponse: respond,
    isValidProfilesV4: value => value?.schemaVersion === 4,
    browserAPI: { storage: { local: { get(_, callback) { callback({ ftProfilesV4: structuredClone(root), filterChannels: [] }); }, set() { writes++; } } } },
    fetchChannelInfo() { fetches++; throw new Error('network must not run'); }
  });
  for (const name of ['safeObject', 'normalizeString', 'extractPinVerifierFromProfilesV4', 'isSessionPinCacheEntryFresh', 'isProfileSessionAuthorized']) {
    const start = sources.background.indexOf(`function ${name}(`);
    const end = sources.background.indexOf('\n}', start) + 2;
    assert.ok(start >= 0 && end > start);
    vm.runInContext(sources.background.slice(start, end), context);
  }
  vm.runInContext(`(function(){ if(false){ ${blocks().backgroundAddChannelPersistentAction} } })()`, context);
  assert.equal((await response).errorCode, 'profile_locked');
  assert.equal(writes, 0);
  assert.equal(fetches, 0);
});
