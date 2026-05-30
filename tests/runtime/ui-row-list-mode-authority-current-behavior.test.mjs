import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_UI_ROW_LIST_MODE_AUTHORITY_AUDIT_2026-05-18.md';

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

test('UI row list-mode audit documents current row authority and future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'StateManager method',
    'FilterTube_SetListMode or FilterTube_TransferWhitelistToBlocklist',
    '`copyBlocklist` has split semantics',
    'Existing blocklist users migrate each current keyword/channel as `action:block`',
    'Raw root captures listed in `.gitignore` remain ignored evidence inputs',
    'tests/runtime/ui-row-list-mode-authority-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }
});

test('keyword rows currently route comments exact and delete actions directly to StateManager', () => {
  const source = read('js/render_engine.js');
  const block = sliceBetween(
    source,
    'function createKeywordListItem(entry, config = {})',
    '// ============================================================================\n    // CHANNEL RENDERING'
  );

  assert.match(block, /StateManager\?\.toggleChannelFilterAllCommentsByRef\?\.\(entry\.channelRef\)/);
  assert.match(block, /StateManager\?\.toggleKeywordComments\(entry\.word\)/);
  assert.match(block, /StateManager\?\.toggleKidsKeywordExact\?\.\(entry\.word\)/);
  assert.match(block, /StateManager\?\.toggleKeywordExact\(entry\.word\)/);
  assert.match(block, /StateManager\?\.removeKidsKeyword\?\.\(entry\.word\)/);
  assert.match(block, /StateManager\?\.removeKeyword\(entry\.word\)/);
});

test('channel rows currently route delete and filter all actions directly to StateManager', () => {
  const source = read('js/render_engine.js');
  const minimalBlock = sliceBetween(
    source,
    'function createMinimalChannelItem(channel, index, collaborationMeta, profile, handlers = {})',
    'function createFullChannelItem(channel, index, showNodeMapping, collaborationMeta, profile, handlers = {})'
  );
  const fullBlock = sliceBetween(
    source,
    'function createFullChannelItem(channel, index, showNodeMapping, collaborationMeta, profile, handlers = {})',
    'function createFilterAllToggle(channel, index, profile = \'main\', handlers = {})'
  );
  const toggleBlock = sliceBetween(
    source,
    'function createFilterAllToggle(channel, index, profile = \'main\', handlers = {})',
    'function createFallbackFilterAllToggle'
  );

  assert.match(minimalBlock, /StateManager\?\.removeKidsChannel\?\.\(index\)/);
  assert.match(minimalBlock, /StateManager\?\.removeChannel\(index\)/);
  assert.match(fullBlock, /StateManager\?\.removeKidsChannel\?\.\(index\)/);
  assert.match(fullBlock, /StateManager\?\.removeChannel\(index\)/);
  assert.match(toggleBlock, /StateManager\?\.toggleKidsChannelFilterAll\?\.\(index\)/);
  assert.match(toggleBlock, /StateManager\?\.toggleChannelFilterAll\(index\)/);
});

test('RenderEngine currently hides Filter All control in whitelist mode', () => {
  const source = read('js/render_engine.js');
  const block = sliceBetween(
    source,
    'function createFilterAllToggle(channel, index, profile = \'main\', handlers = {})',
    'function createFallbackFilterAllToggle'
  );

  assert.match(block, /effectiveMode/);
  assert.match(block, /if \(effectiveMode === 'whitelist'\) \{/);
  assert.match(block, /spacer\.className = 'filter-all-toggle disabled'/);
  assert.match(block, /spacer\.style\.visibility = 'hidden'/);
  assert.match(block, /return spacer/);
});

test('StateManager keyword mutations currently branch on main list mode', () => {
  const source = read('js/state_manager.js');
  const addBlock = sliceBetween(source, 'async function addKeyword', 'async function toggleKeywordComments');
  const commentsBlock = sliceBetween(source, 'async function toggleKeywordComments', 'async function removeKeyword');
  const removeBlock = sliceBetween(source, 'async function removeKeyword', 'async function toggleKeywordExact');
  const exactBlock = sliceBetween(source, 'async function toggleKeywordExact', 'function recomputeKeywords');

  for (const block of [addBlock, commentsBlock, removeBlock, exactBlock]) {
    assert.match(block, /if \(state\.mode === 'whitelist'\) \{/);
    assert.match(block, /await persistMainProfiles\(\{/);
    assert.match(block, /mode: 'whitelist'/);
    assert.match(block, /await requestRefresh\('main'\)/);
  }

  assert.match(addBlock, /state\.userKeywords\.unshift\(\{/);
  assert.match(addBlock, /await saveSettings\(\)/);
  assert.match(commentsBlock, /state\.userKeywords\[index\]\.comments = nextValue/);
  assert.match(removeBlock, /state\.userKeywords\.splice\(index, 1\)/);
  assert.match(exactBlock, /state\.userKeywords\[index\]\.exact = !state\.userKeywords\[index\]\.exact/);
});

test('StateManager channel add currently chooses persistent background action from mode', () => {
  const source = read('js/state_manager.js');
  const block = sliceBetween(
    source,
    'async function addChannel(input)',
    'async function fetchSubscribedChannelsFromImportTab'
  );

  assert.match(block, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(block, /chrome\.runtime\.sendMessage\(\{/);
  assert.match(block, /action,/);
  assert.match(block, /const alreadyExists = whitelistChannels\.some\(ch => ch\?\.id && incoming\?\.id && ch\.id === incoming\.id\)/);
  assert.match(block, /const alreadyExists = state\.channels\.some\(ch => ch\.id === response\.channel\.id\)/);
});

test('StateManager channel remove and Filter All currently branch on mode and reject Filter All in whitelist', () => {
  const source = read('js/state_manager.js');
  const removeBlock = sliceBetween(
    source,
    'async function removeChannel(index)',
    'async function toggleChannelFilterAll(index)'
  );
  const filterAllBlock = sliceBetween(
    source,
    'async function toggleChannelFilterAll(index)',
    'async function toggleChannelFilterAllCommentsByRef(channelRef)'
  );
  const commentsBlock = sliceBetween(
    source,
    'async function toggleChannelFilterAllCommentsByRef(channelRef)',
    'function isDuplicateChannel(input)'
  );

  assert.match(removeBlock, /if \(state\.mode === 'whitelist'\) \{/);
  assert.match(removeBlock, /whitelistChannels: state\.whitelistChannels/);
  assert.match(removeBlock, /state\.channels\.splice\(index, 1\)/);
  assert.match(filterAllBlock, /if \(state\.mode === 'whitelist'\) \{\s*return false;\s*\}/);
  assert.match(filterAllBlock, /state\.channels\[index\]\.filterAll = !state\.channels\[index\]\.filterAll/);
  assert.match(commentsBlock, /if \(state\.mode === 'whitelist'\) \{\s*return false;\s*\}/);
  assert.match(commentsBlock, /current\.filterAllComments = !currentValue/);
});

test('popup and tab-view currently send FilterTube_SetListMode with copyBlocklist', () => {
  const popup = read('js/popup.js');
  const popupBlock = sliceBetween(popup, 'const handleModeToggle = async () => {', 'toggle.addEventListener');
  const tabView = read('js/tab-view.js');
  const tabBlock = sliceBetween(tabView, 'const nextState = currentMode !== \'whitelist\';', 'await StateManager.loadSettings();');

  for (const block of [popupBlock, tabBlock]) {
    assert.match(block, /let copyBlocklist = false/);
    assert.match(block, /copyBlocklist = window\.confirm/);
    assert.match(block, /action: 'FilterTube_SetListMode'/);
    assert.match(block, /mode: nextState \? 'whitelist' : 'blocklist'/);
    assert.match(block, /copyBlocklist/);
    assert.match(block, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
  }
});

test('subscription import flow currently enables whitelist with copyBlocklist false', () => {
  const source = read('js/tab-view.js');
  const block = sliceBetween(
    source,
    'async function enableWhitelistModeAfterImport(context = {})',
    'const totalApplied = Number(context.totalApplied) || 0'
  );

  assert.match(block, /action: 'FilterTube_SetListMode'/);
  assert.match(block, /profileType: 'main'/);
  assert.match(block, /mode: 'whitelist'/);
  assert.match(block, /copyBlocklist: false/);
});

test('background currently reads copyBlocklist but merges blocklist into whitelist whenever whitelist is requested', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(block, /const mergeAndClearBlocklistIntoWhitelist = \(scope\) => \{/);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);\s*\}/);
  assert.doesNotMatch(block, /if \(requestedMode === 'whitelist' && shouldCopyBlocklist\)/);
});

test('background whitelist transfer currently moves whitelist back into blocklist and clears whitelist arrays', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')",
    "} else if (action === 'FilterTube_ScheduleAutoBackup')"
  );

  assert.match(block, /nextMain\.channels = dedupeChannels\(\[\.\.\.blockedChannels, \.\.\.whitelistChannels\]\)/);
  assert.match(block, /nextMain\.keywords = dedupeKeywordList\(/);
  assert.match(block, /nextMain\.whitelistChannels = \[\]/);
  assert.match(block, /nextMain\.whitelistKeywords = \[\]/);
  assert.match(block, /nextMain\.mode = 'blocklist'/);
});

test('settings_shared ordinary save currently writes canonical main lists but does not own list mode switch', () => {
  const source = read('js/settings_shared.js');
  const block = sliceBetween(
    source,
    'function saveSettings(options = {})',
    'function getThemePreference()'
  );

  assert.match(block, /channels: sanitizedChannels/);
  assert.match(block, /keywords: sanitizedKeywords/);
  assert.match(block, /mode: \(typeof existingKids\.mode === 'string' && existingKids\.mode === 'whitelist'\) \? 'whitelist' : 'blocklist'/);
  assert.doesNotMatch(block, /main:\s*\{[^}]*mode:/s);
  assert.doesNotMatch(block, /whitelistChannels: sanitizedChannels/);
});
