import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md';

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

function gitOk(args) {
  try {
    execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return true;
  } catch {
    return false;
  }
}

function assertRuleMutationConvergenceBoundary(doc) {
  assert.match(doc, /Rule Mutation Convergence Boundary - 2026-05-30/);
  assert.match(doc, /This addendum joins the split rule-mutation slices into one convergence\s+boundary/);
  assert.match(doc, /Current convergence rows:/);
  assert.match(doc, /ASCII rule mutation convergence diagram: present/);
  assert.match(doc, /Mermaid rule mutation convergence diagram: present/);

  for (const row of [
    'rule_mutation_state_manager_mode_inferred_rows',
    'rule_mutation_background_sender_split',
    'rule_mutation_content_quick_menu_payload',
    'rule_mutation_filter_all_comment_scope',
    'rule_mutation_list_mode_transfer_copy_policy',
    'rule_mutation_batch_whitelist_import_mode',
    'rule_mutation_managed_child_direct_write',
    'rule_mutation_import_nanah_apply',
    'rule_mutation_storage_cache_backup_refresh_fanout',
    'rule_mutation_learned_identity_rule_input'
  ]) {
    assert.ok(doc.includes(`| \`${row}\` |`), `missing convergence row ${row}`);
  }

  for (const token of [
    'rule mutation convergence rows: 10',
    'implementation-ready rule mutation convergence rows: 0',
    'ruleMutationAuthority product source symbol: absent',
    'mutationReport product source symbol: absent',
    'runtime behavior changed by this addendum: no',
    'rule mutation implementation approval: NO-GO',
    'blocklist/whitelist mutation optimization approval: NO-GO',
    'quick/menu mutation rewrite approval: NO-GO',
    'Filter All mutation optimization approval: NO-GO',
    'import/Nanah mutation optimization approval: NO-GO',
    'storage/cache optimization approval from rule mutation: NO-GO',
    'JSON-first promotion approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(doc.includes(token), `missing convergence token ${token}`);
  }

  const combinedRuntimeSource = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/block_channel.js',
    'js/state_manager.js',
    'js/render_engine.js',
    'js/io_manager.js',
    'js/nanah_sync_adapter.js',
    'js/tab-view.js',
    'js/popup.js'
  ].map(read).join('\n');

  for (const futureToken of [
    'ruleMutationAuthority',
    'mutationReport'
  ]) {
    assert.doesNotMatch(combinedRuntimeSource, new RegExp(`\\b${futureToken}\\b`), `${futureToken} should not be implemented in runtime source yet`);
  }
}

test('rule mutation entrypoint audit documents every current writer family and evidence boundary', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'Entrypoint Map',
    'UI And StateManager Writers',
    'Background Writers',
    'Import, Export, And Nanah Writers',
    'Learned Identity And Cache Writers',
    'ruleMutationAuthority',
    'Root-level JSON/HTML/TXT captures listed in `.gitignore`'
  ]) {
    assert.ok(doc.includes(marker), `missing audit marker ${marker}`);
  }

  for (const token of [
    'StateManager.addKeyword()',
    'StateManager.addChannel()',
    'FilterTube_SetListMode',
    'addWhitelistChannelPersistent',
    'FilterTube_BatchImportWhitelistChannels',
    'FilterTube_KidsBlockChannel',
    'addFilteredChannel',
    'FilterTubeIO.importV3()',
    'FilterTubeNanahAdapter.applyScopedPortablePayload()',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_ApplySettings'
  ]) {
    assert.ok(doc.includes(token), `missing mutation token ${token}`);
  }

  assertRuleMutationConvergenceBoundary(doc);
});

test('StateManager currently exposes many direct rule and policy mutation primitives', () => {
  const source = read('js/state_manager.js');
  const exportsBlock = sliceBetween(source, 'return {', '};\n})();');

  for (const api of [
    'addKeyword',
    'removeKeyword',
    'toggleKeywordExact',
    'toggleKeywordComments',
    'addKidsKeyword',
    'removeKidsKeyword',
    'toggleKidsKeywordExact',
    'toggleKidsKeywordComments',
    'addChannel',
    'importSubscribedChannelsToWhitelist',
    'removeChannel',
    'toggleChannelFilterAll',
    'toggleChannelFilterAllCommentsByRef',
    'addKidsChannel',
    'removeKidsChannel',
    'toggleKidsChannelFilterAll',
    'updateSetting'
  ]) {
    assert.match(exportsBlock, new RegExp(`\\b${api}\\b`), `StateManager should expose ${api}`);
  }
});

test('StateManager current main rule writes branch on list mode rather than per-entry action metadata', () => {
  const source = read('js/state_manager.js');
  const keywordBlock = sliceBetween(source, 'async function addKeyword', 'async function toggleKeywordComments');
  const channelBlock = sliceBetween(source, 'async function addChannel', '/**\n     * Remove a channel');
  const removeBlock = sliceBetween(source, 'async function removeChannel', '/**\n     * Toggle "Filter All Content"');
  const toggleBlock = sliceBetween(source, 'async function toggleChannelFilterAll', '/**\n     * Toggle whether a channel-derived keyword');

  assert.match(keywordBlock, /if \(state\.mode === 'whitelist'\)/);
  assert.match(keywordBlock, /state\.userWhitelistKeywords/);
  assert.match(keywordBlock, /state\.userKeywords\.unshift/);

  assert.match(channelBlock, /const action = state\.mode === 'whitelist' \? 'addWhitelistChannelPersistent' : 'addChannelPersistent'/);
  assert.match(removeBlock, /if \(state\.mode === 'whitelist'\)/);
  assert.match(toggleBlock, /if \(state\.mode === 'whitelist'\) \{\s*return false;/);
  assert.doesNotMatch(keywordBlock + channelBlock + removeBlock + toggleBlock, /\bentryAction\b|\bruleAction\b|\blistTarget\b/);
});

test('RenderEngine row actions currently call StateManager directly unless caller injects managed-child handlers', () => {
  const source = read('js/render_engine.js');
  const keywordBlock = sliceBetween(source, 'function createKeywordListItem', '/**\n     * Render channel list');
  const channelBlock = sliceBetween(source, 'function createFullChannelItem', '/**\n     * Create node mapping visualization');
  const filterAllBlock = sliceBetween(source, 'function createFilterAllToggle', 'function createFallbackFilterAllToggle');

  assert.match(keywordBlock, /if \(typeof onToggleComments === 'function'\)/);
  assert.match(keywordBlock, /StateManager\?\.toggleChannelFilterAllCommentsByRef/);
  assert.match(keywordBlock, /StateManager\?\.toggleKeywordExact/);
  assert.match(keywordBlock, /StateManager\?\.removeKeyword/);

  assert.match(channelBlock, /if \(typeof onDelete === 'function'\)/);
  assert.match(channelBlock, /StateManager\?\.removeKidsChannel/);
  assert.match(channelBlock, /StateManager\?\.removeChannel/);
  assert.match(filterAllBlock, /StateManager\?\.toggleKidsChannelFilterAll/);
  assert.match(filterAllBlock, /StateManager\?\.toggleChannelFilterAll/);
  assert.match(filterAllBlock, /if \(effectiveMode === 'whitelist'\)/);
});

test('background currently has guarded UI writers and unguarded content-script shaped writers for similar rule effects', () => {
  const source = read('js/background.js');
  const setMode = sliceBetween(source, "} else if (action === 'FilterTube_SetListMode')", "} else if (action === 'addWhitelistChannelPersistent')");
  const whitelistAdd = sliceBetween(source, "} else if (action === 'addWhitelistChannelPersistent')", "} else if (action === 'FilterTube_BatchImportWhitelistChannels')");
  const batchImport = sliceBetween(source, "} else if (action === 'FilterTube_BatchImportWhitelistChannels')", "} else if (action === 'FilterTube_KidsWhitelistChannel')");
  const kidsWhitelist = sliceBetween(source, "} else if (action === 'FilterTube_KidsWhitelistChannel')", "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')");
  const kidsBlock = sliceBetween(source, "} else if (action === 'FilterTube_KidsBlockChannel')", "} else if (request.action === \"injectScripts\")");
  const secondaryAdd = sliceBetween(source, "if (message.type === 'addFilteredChannel')", "if (message.type === 'toggleChannelFilterAll')");
  const secondaryToggle = sliceBetween(source, "if (message.type === 'toggleChannelFilterAll')", '/**\n * Handle adding a filtered channel');

  for (const guarded of [setMode, whitelistAdd, batchImport, kidsWhitelist]) {
    assert.match(guarded, /isTrustedUiSender\(sender\)/);
  }

  assert.doesNotMatch(kidsBlock, /isTrustedUiSender\(sender\)/);
  assert.match(kidsBlock, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(secondaryAdd, /isTrustedUiSender\(sender\)/);
  assert.match(secondaryAdd, /const targetListType = message\.listType === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(secondaryAdd, /targetProfile,\s*message\.videoId \|\| '',\s*targetListType/);
  assert.match(secondaryAdd, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(secondaryToggle, /isTrustedUiSender\(sender\)/);
  assert.match(secondaryToggle, /handleToggleChannelFilterAll/);
});

test('tab-view currently owns managed child direct V4 writes and list-mode transfer UI decisions', () => {
  const source = read('js/tab-view.js');
  const managedBlock = sliceBetween(source, 'async function saveManagedChildSurface', 'try {\n        window.__filtertubeIsManagedChildEditFor');
  const modeBlock = sliceBetween(source, 'const handleModeToggle = async () =>', "toggle.addEventListener('click', handleModeToggle)");

  assert.match(managedBlock, /canActiveProfileManageProfile\(fresh, profileId\)/);
  assert.match(managedBlock, /await io\.saveProfilesV4/);
  assert.match(managedBlock, /await StateManager\.loadSettings/);
  assert.match(modeBlock, /saveManagedChildSurface\(profileType/);
  assert.match(modeBlock, /action: 'FilterTube_TransferWhitelistToBlocklist'/);
  assert.match(modeBlock, /action: 'FilterTube_SetListMode'/);
  assert.match(modeBlock, /copyBlocklist/);
});

test('import and Nanah scoped sync currently write rule state through IO paths outside StateManager row APIs', () => {
  const io = read('js/io_manager.js');
  const nanah = read('js/nanah_sync_adapter.js');
  const importBlock = sliceBetween(io, 'async function importV3', 'async function exportV3Encrypted');
  const encryptedBlock = sliceBetween(io, 'async function importV3Encrypted', '// ============================================================================\n    // AUTO-BACKUP SYSTEM');
  const scopedBlock = sliceBetween(nanah, 'async function applyScopedPortablePayload', 'function generateId');
  const envelopeBlock = sliceBetween(nanah, 'async function applyIncomingEnvelope', 'global.FilterTubeNanahAdapter');

  assert.match(importBlock, /await SettingsAPI\.saveSettings\(payload\)/);
  assert.match(importBlock, /await saveProfilesV3\(nextProfiles\)/);
  assert.match(importBlock, /await saveProfilesV4\(/);
  assert.match(importBlock, /await writeStorage\(\{ channelMap: nextChannelMap \}\)/);
  assert.match(encryptedBlock, /return importV3\(decrypted, \{ strategy, scope, auth \}\)/);
  assert.doesNotMatch(encryptedBlock, /targetProfileId/);

  assert.match(scopedBlock, /await io\.saveProfilesV4\(/);
  assert.match(scopedBlock, /const incomingChannels = Array\.isArray\(data\.channels\) \? data\.channels : data\.blockedChannels/);
  assert.match(scopedBlock, /mergeChannelLists\(currentMain\.channels, incomingChannels\)/);
  assert.match(scopedBlock, /mergeChannelLists\(currentKids\.blockedChannels, data\.blockedChannels\)/);
  assert.match(envelopeBlock, /return applyScopedPortablePayload/);
  assert.match(envelopeBlock, /return io\.importV3/);
});

test('content and page-world paths currently mutate rule-adjacent identity without shared mutation authority', () => {
  const bridge = read('js/content_bridge.js');
  const background = read('js/background.js');
  const messageBlock = sliceBetween(bridge, 'function handleMainWorldMessages', 'window.addEventListener');
  const applySettings = sliceBetween(background, '} else if (request.action === "FilterTube_ApplySettings" && request.settings)', '} else if (request.action === "updateChannelMap")');
  const mapBlock = sliceBetween(background, '} else if (request.action === "updateChannelMap")', 'else if (request.action === "fetchChannelDetails")');

  assert.match(messageBlock, /event\.source !== window/);
  assert.match(messageBlock, /FilterTube_UpdateVideoChannelMap/);
  assert.match(messageBlock, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(messageBlock, /FilterTube_UpdateVideoMetaMap/);
  assert.match(messageBlock, /persistVideoMetaMapping\(updates\)/);
  assert.match(messageBlock, /FilterTube_UpdateCustomUrlMap/);
  assert.match(messageBlock, /storage\.local\.set\(\{ channelMap \}/);

  assert.match(applySettings, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(applySettings, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.doesNotMatch(applySettings, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.doesNotMatch(applySettings + mapBlock, /ruleMutationAuthority|mutationReport|ownedPageWorldRequest|allowedYoutubeContentScript/);
});

test('ignored root captures remain evidence-only inputs for mutation and renderer audit claims', () => {
  const gitignore = read('.gitignore');
  const doc = read(auditDocPath);

  for (const file of [
    'DOMs.html',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_WATCH.html',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'ytkids_browse?alt=json.json',
    'post_opt1_logs.txt',
    'extracted_watch_paths.txt'
  ]) {
    assert.ok(gitignore.includes(file), `${file} should be named in .gitignore evidence corpus`);
    assert.equal(gitOk(['check-ignore', file]), true, `${file} should remain ignored`);
  }

  assert.ok(doc.includes('docs/json_paths_encyclopedia.md'));
  assert.ok(doc.includes('docs/youtube_renderer_inventory.md'));
  assert.ok(doc.includes('minimal fixtures'));
});
