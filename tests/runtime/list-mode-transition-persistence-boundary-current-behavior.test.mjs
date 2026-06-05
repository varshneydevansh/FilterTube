import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
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

function sourceLineCount(text) {
  return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
}

const sources = {
  background: read('js/background.js'),
  popup: read('js/popup.js'),
  tabView: read('js/tab-view.js'),
  stateManager: read('js/state_manager.js')
};

function blocks() {
  return {
    backgroundSetListModeAction: sliceBetween(
      sources.background,
      "} else if (action === 'FilterTube_SetListMode')",
      "} else if (action === 'addWhitelistChannelPersistent')"
    ),
    backgroundSetListModeMergeHelper: sliceBetween(
      sources.background,
      'const mergeAndClearBlocklistIntoWhitelist = (scope) => {',
      "if (requestedMode === 'whitelist')"
    ),
    backgroundSetListModeWriteSideEffects: sliceBetween(
      sources.background,
      'const writePayload = { [FT_PROFILES_V4_KEY]: nextProfilesV4 };',
      "sendResponse?.({ ok: true, profileType: requestedProfile, mode: requestedMode });"
    ),
    backgroundTransferWhitelistToBlocklistAction: sliceBetween(
      sources.background,
      "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')",
      "} else if (action === 'FilterTube_ScheduleAutoBackup')"
    ),
    popupRenderListModeControls: sliceBetween(
      sources.popup,
      'function renderListModeControls()',
      'let lockGateEl = null;'
    ),
    tabViewRenderListModeControls: sliceBetween(
      sources.tabView,
      'function renderListModeControls()',
      "try {\n        window.__filtertubeRenderTopBarListModeControls"
    ),
    tabViewEnableWhitelistModeAfterImport: sliceBetween(
      sources.tabView,
      'async function enableWhitelistModeAfterImport(context = {})',
      'function handleSubscriptionsImportProgress'
    ),
    stateManagerImportSubscribedChannelsToWhitelist: sliceBetween(
      sources.stateManager,
      'async function importSubscribedChannelsToWhitelist',
      '/**\n     * Remove a channel from the filter list'
    )
  };
}

test('list-mode transition persistence audit document records current boundary and fixtures', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Status: current-behavior proof slice. This is not an implementation patch.',
    '4 list-mode transition persistence source files',
    '8 source/effect blocks',
    'selected background mode-action tokens:',
    'set_list_mode_copy_false_still_merges_blocklist_to_whitelist',
    'set_list_mode_whitelist_clears_main_legacy_blocklist_mirrors',
    'set_list_mode_blocklist_does_not_transfer_whitelist_back',
    'transfer_whitelist_to_blocklist_moves_and_clears_lists',
    'tab_import_enable_whitelist_sends_copy_false',
    'popup_tab_mode_toggle_confirm_copy_only_when_whitelist_empty',
    'managed_child_surface_handles_mode_transfer_in_tab_view_without_background_action',
    'subscription_import_persistence_returns_currentMode_before_mode_toggle',
    'The copy flag is currently not an effect gate in the background whitelist branch.',
    'Batch import persistence and mode activation remain separate operations.',
    'Runtime behavior remains unchanged.'
  ]) {
    assert.ok(doc.includes(marker), `missing marker: ${marker}`);
  }
});

test('list-mode transition source fingerprints stay pinned', () => {
  const doc = read(auditDocPath);
  const expected = [
    ['js/background.js', 6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5'],
    ['js/popup.js', 1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
    ['js/tab-view.js', 14261, 662325, 'f7e2ee01219489d1e36af2fc9af06e09329a90be4c41caf1bcba0ce42be43ebb'],
    ['js/state_manager.js', 2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']
  ];

  for (const [file, lines, bytes, hash] of expected) {
    const source = read(file);
    assert.equal(sourceLineCount(source), lines, `${file} line count drifted`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('list-mode transition source/effect block metrics stay pinned in the doc', () => {
  const doc = read(auditDocPath);
  const currentBlocks = blocks();
  const expected = {
    backgroundSetListModeAction: ['background FilterTube_SetListMode action block', 215, 9958],
    backgroundSetListModeMergeHelper: ['background SetListMode merge helper block', 44, 2458],
    backgroundSetListModeWriteSideEffects: ['background SetListMode write/side-effect block', 31, 1151],
    backgroundTransferWhitelistToBlocklistAction: ['background FilterTube_TransferWhitelistToBlocklist action block', 198, 9448],
    popupRenderListModeControls: ['popup renderListModeControls block', 173, 7911],
    tabViewRenderListModeControls: ['tab-view renderListModeControls block', 174, 9296],
    tabViewEnableWhitelistModeAfterImport: ['tab-view enableWhitelistModeAfterImport block', 47, 1554],
    stateManagerImportSubscribedChannelsToWhitelist: ['StateManager importSubscribedChannelsToWhitelist block', 111, 4533]
  };

  for (const [key, [label, lines, bytes]] of Object.entries(expected)) {
    assert.deepEqual(blockStats(currentBlocks[key]), { lines, bytes }, `${key} stats drifted`);
    assert.match(doc, new RegExp(`${label}: ${lines} lines, ${bytes} bytes`));
  }
});

test('background SetListMode currently reads copy flag but always merges blocklist when whitelist is requested', () => {
  const { backgroundSetListModeAction: block } = blocks();

  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.equal(countLiteral(block, 'shouldCopyBlocklist'), 1);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);\s*\}/);
  assert.doesNotMatch(block, /requestedMode === 'whitelist' && shouldCopyBlocklist/);
  assert.match(block, /writePayload\.filterChannels = \[\]/);
  assert.match(block, /writePayload\.uiChannels = \[\]/);
  assert.match(block, /writePayload\.uiKeywords = \[\]/);
  assert.match(block, /writePayload\.filterKeywords = \[\]/);
  assert.match(block, /writePayload\.filterKeywordsComments = \[\]/);
});

test('background mode transition side effects and missing lock gate stay pinned', () => {
  const currentBlocks = blocks();
  const combined = [
    currentBlocks.backgroundSetListModeAction,
    currentBlocks.backgroundTransferWhitelistToBlocklistAction
  ].join('\n');
  const expectedCounts = {
    shouldCopyBlocklist: 1,
    copyBlocklist: 1,
    mergeAndClearBlocklistIntoWhitelist: 2,
    isTrustedUiSender: 2,
    isProfileSessionAuthorized: 0,
    'storage.local.set': 2,
    compiledSettingsCache: 4,
    scheduleAutoBackupInBackground: 2,
    'tabs.query': 2,
    sendMessageToTabQuietly: 2,
    FilterTube_RefreshNow: 2,
    FT_PROFILES_V4_KEY: 6,
    ftProfilesV3: 2,
    uiChannels: 2,
    sendResponse: 8
  };

  for (const [token, count] of Object.entries(expectedCounts)) {
    assert.equal(countLiteral(combined, token), count, `${token} count drifted`);
  }

  assert.match(currentBlocks.backgroundSetListModeAction, /scheduleAutoBackupInBackground\('mode_changed'\)/);
  assert.match(currentBlocks.backgroundTransferWhitelistToBlocklistAction, /scheduleAutoBackupInBackground\('whitelist_to_blocklist_transfer'\)/);
});

test('background transfer branch currently moves whitelist rows into blocklist rows and clears whitelist arrays', () => {
  const { backgroundTransferWhitelistToBlocklistAction: block } = blocks();

  assert.match(block, /nextKids\.blockedChannels = dedupeChannels\(\[\.\.\.blockedChannels, \.\.\.whitelistChannels\]\)/);
  assert.match(block, /nextKids\.blockedKeywords = dedupeKeywordList\(/);
  assert.match(block, /nextKids\.whitelistChannels = \[\]/);
  assert.match(block, /nextKids\.whitelistKeywords = \[\]/);
  assert.match(block, /nextKids\.mode = 'blocklist'/);
  assert.match(block, /nextMain\.channels = dedupeChannels\(\[\.\.\.blockedChannels, \.\.\.whitelistChannels\]\)/);
  assert.match(block, /nextMain\.keywords = dedupeKeywordList\(/);
  assert.match(block, /nextMain\.whitelistChannels = \[\]/);
  assert.match(block, /nextMain\.whitelistKeywords = \[\]/);
  assert.match(block, /nextMain\.mode = 'blocklist'/);
  assert.match(block, /writePayload\.filterChannels = Array\.isArray\(nextMain\.channels\) \? nextMain\.channels : \[\]/);
  assert.match(block, /writePayload\.uiKeywords = Array\.isArray\(nextMain\.keywords\) \? nextMain\.keywords : \[\]/);
});

test('popup and tab-view mode controls send list-mode messages while tab-view managed child mode uses a separate path', () => {
  const currentBlocks = blocks();

  for (const block of [currentBlocks.popupRenderListModeControls, currentBlocks.tabViewRenderListModeControls]) {
    assert.match(block, /let copyBlocklist = false/);
    assert.match(block, /if \(enablingWhitelist && whitelistEmpty\)/);
    assert.match(block, /copyBlocklist = window\.confirm/);
    assert.match(block, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
    assert.match(block, /action: 'FilterTube_SetListMode'/);
    assert.match(block, /mode: nextState \? 'whitelist' : 'blocklist'/);
    assert.match(block, /copyBlocklist/);
  }

  assert.match(currentBlocks.tabViewRenderListModeControls, /saveManagedChildSurface\(profileType, async \(target\) => \{/);
  assert.match(currentBlocks.tabViewRenderListModeControls, /target\.mode = nextState \? 'whitelist' : 'blocklist'/);
  assert.match(currentBlocks.popupRenderListModeControls, /resolveProfileTypeFromTabs/);
});

test('subscription import mode enablement sends copy false while persistence returns currentMode without toggling', () => {
  const currentBlocks = blocks();

  assert.match(currentBlocks.tabViewEnableWhitelistModeAfterImport, /action: 'FilterTube_SetListMode'/);
  assert.match(currentBlocks.tabViewEnableWhitelistModeAfterImport, /profileType: 'main'/);
  assert.match(currentBlocks.tabViewEnableWhitelistModeAfterImport, /mode: 'whitelist'/);
  assert.match(currentBlocks.tabViewEnableWhitelistModeAfterImport, /copyBlocklist: false/);
  assert.match(currentBlocks.tabViewEnableWhitelistModeAfterImport, /merged your current blocklist into whitelist/);

  assert.match(currentBlocks.stateManagerImportSubscribedChannelsToWhitelist, /action: 'FilterTube_BatchImportWhitelistChannels'/);
  assert.match(currentBlocks.stateManagerImportSubscribedChannelsToWhitelist, /currentMode: response\.currentMode \|\| \(state\.mode === 'whitelist' \? 'whitelist' : 'blocklist'\)/);
  assert.match(currentBlocks.stateManagerImportSubscribedChannelsToWhitelist, /await requestRefresh\('main'\)/);
  assert.doesNotMatch(currentBlocks.stateManagerImportSubscribedChannelsToWhitelist, /FilterTube_SetListMode/);
});

test('future list-mode transition authority symbols are not present in product runtime source yet', () => {
  const runtimeSource = [
    sources.background,
    sources.popup,
    sources.tabView,
    sources.stateManager
  ].join('\n');

  for (const symbol of [
    'listModeTransitionPersistenceContract',
    'listModeTransitionMutationReport',
    'listModeTransitionCopyFlagPolicy',
    'listModeTransitionRollbackPolicy',
    'listModeTransitionProfileLockReport',
    'listModeTransitionModeEffectReport',
    'listModeTransitionLegacyMirrorPolicy',
    'listModeTransitionCacheInvalidationReport',
    'listModeTransitionBackupRefreshBudget',
    'listModeTransitionManagedChildParityReport',
    'listModeTransitionFixtureProvenance',
    'listModeTransitionMetricArtifact'
  ]) {
    assert.doesNotMatch(runtimeSource, new RegExp(symbol), `${symbol} unexpectedly exists in runtime source`);
    assert.match(read(auditDocPath), new RegExp(symbol), `${symbol} should be named as a missing future authority`);
  }
});
