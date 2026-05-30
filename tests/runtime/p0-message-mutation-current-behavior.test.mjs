import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

const messageMutationFixtures = [
  'message_sender_matrix_channel_mutations_have_uniform_sender_classes',
  'background_rejects_untrusted_apply_settings',
  'background_rejects_untrusted_script_injection',
  'background_rejects_untrusted_subscriptions_bridge_injection',
  'background_rejects_arbitrary_whats_new_url',
  'background_rejects_untrusted_channel_detail_fetch',
  'page_message_rejects_spoof_refresh',
  'page_message_rejects_spoof_video_channel_map',
  'page_message_requires_pending_collaborator_response',
  'content_script_rejects_add_filtered_channel_without_ui_owner',
  'nanah_apply_requires_target_profile_authority',
  'set_list_mode_copy_false_does_not_clear_blocklist',
  'apply_settings_payload_cannot_override_background_revision',
  'rule_mutation_report_exists_for_background_add_filtered_channel',
  'rule_mutation_report_exists_for_kids_block_and_whitelist',
  'rule_mutation_report_exists_for_list_mode_transfer',
  'content_script_channel_add_requires_allowed_youtube_action',
  'page_world_identity_update_requires_owned_request'
];

test('P0 message mutation audit documents fixture families and current non-green verdict', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  for (const fixture of messageMutationFixtures) {
    assert.ok(doc.includes(fixture), `missing fixture in doc ${fixture}`);
    assert.ok(readiness.includes(fixture), `fixture should remain in readiness gate ${fixture}`);
  }

  for (const fixture of [
    'set_list_mode_copy_false_does_not_clear_blocklist',
    'apply_settings_payload_cannot_override_background_revision',
    'nanah_apply_requires_target_profile_authority'
  ]) {
    assert.ok(p0Register.includes(fixture), `fixture should remain in P0 register ${fixture}`);
  }

  for (const phrase of [
    'P0 message/mutation slice is not green',
    'Current behavior is proof-pinned',
    'Runtime behavior remains unchanged',
    'senderClass',
    'negative spoof fixture'
  ]) {
    assert.ok(doc.includes(phrase), `missing contract phrase ${phrase}`);
  }
});

test('message_sender_matrix_channel_mutations_have_uniform_sender_classes is not satisfied', () => {
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
  const secondaryAdd = sliceBetween(
    source,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );
  const secondaryToggle = sliceBetween(
    source,
    "if (message.type === 'toggleChannelFilterAll')",
    '/**\n * Handle adding a filtered channel'
  );

  assert.match(kidsWhitelist, /isTrustedUiSender\(sender\)/);
  assert.match(mainWhitelist, /isTrustedUiSender\(sender\)/);
  for (const block of [kidsBlock, mainBlock, secondaryAdd, secondaryToggle]) {
    assert.doesNotMatch(block, /isTrustedUiSender\(sender\)/);
  }
  assert.match(kidsBlock, /handleAddFilteredChannel\(/);
  assert.match(mainBlock, /browserAPI\.storage\.local\.set\(writePayload/);
  assert.match(secondaryAdd, /handleAddFilteredChannel\(/);
  assert.match(secondaryToggle, /handleToggleChannelFilterAll/);
});

test('background apply-settings no longer lets caller payload become compiled cache authority', () => {
  const block = sliceBetween(
    read('js/background.js'),
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.match(block, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(block, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.doesNotMatch(block, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(block, /settingsRevision|backgroundRevision|mutationReport/);
});

test('background script injection and subscriptions bridge injection are not trusted-flow gated', () => {
  const source = read('js/background.js');
  const injectScripts = sliceBetween(
    source,
    '} else if (request.action === "injectScripts")',
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
  );
  const subscriptionsBridge = sliceBetween(
    source,
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')",
    '} else if (request.action === "processFetchData")'
  );

  assert.match(injectScripts, /\.map\(\(scriptName\) => scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`\)/);
  assert.match(injectScripts, /world: 'MAIN'/);
  assert.doesNotMatch(injectScripts, /isTrustedUiSender|trustedUi|backgroundInternal|allowedScripts|scriptAllowlist/);

  assert.match(subscriptionsBridge, /const tabId = Number\(request\?\.tabId\)/);
  assert.match(subscriptionsBridge, /files:\s*\[[\s\S]*js\/content\/bridge_settings\.js/);
  assert.doesNotMatch(subscriptionsBridge, /isTrustedUiSender|pendingSubscriptionImport|trustedUi|targetUrl|allowedYoutubeContentScript/);
});

test('background arbitrary whats-new URL and channel detail fetch rejection are not satisfied', () => {
  const source = read('js/background.js');
  const openWhatsNew = sliceBetween(
    source,
    "} else if (action === 'FilterTube_OpenWhatsNew')",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress')"
  );
  const fetchDetails = sliceBetween(
    source,
    'else if (request.action === "fetchChannelDetails")',
    '// Handle any browser-specific actions if needed'
  );

  assert.match(openWhatsNew, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openWhatsNew, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.doesNotMatch(openWhatsNew, /isTrustedUiSender|allowedUrls|WHATS_NEW_PAGE_URL\s*===\s*url/);

  assert.match(fetchDetails, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.doesNotMatch(fetchDetails, /isTrustedUiSender|allowedYoutubeContentScript|networkAuthority|fetchBudget|explicitReason/);
});

test('page spoof refresh and video-channel-map rejection are not satisfied', () => {
  const handler = sliceBetween(
    read('js/content_bridge.js'),
    'function handleMainWorldMessages(event) {',
    'async function initialize() {'
  );
  const refresh = sliceBetween(
    handler,
    "type === 'FilterTube_Refresh'",
    "type === 'FilterTube_UpdateChannelMap'"
  );
  const videoChannelMap = sliceBetween(
    handler,
    "type === 'FilterTube_UpdateVideoChannelMap'",
    "type === 'FilterTube_UpdateVideoMetaMap'"
  );

  assert.match(handler, /event\.source !== window/);
  assert.match(handler, /event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.doesNotMatch(handler, /nonce|ownedPageWorldRequest|allowedPageMessage|messageCapability/);

  assert.match(refresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.match(videoChannelMap, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.ok(
    videoChannelMap.indexOf('persistVideoChannelMapping(videoId, channelId)') <
      videoChannelMap.indexOf('shouldStampCardForVideoId(card, videoId)'),
    'current behavior persists learned identity before DOM card provenance checks'
  );
  assert.match(videoChannelMap, /applyDOMFallback\(null\)/);
});

test('page_message_requires_pending_collaborator_response is only partial today', () => {
  const block = sliceBetween(
    read('js/content_bridge.js'),
    "type === 'FilterTube_CollaboratorInfoResponse'",
    "type === 'FilterTube_SubscriptionsImportProgress'"
  );

  assert.match(block, /const pending = window\.pendingCollaboratorRequests\.get\(requestId\)/);
  assert.match(block, /if \(pending\) \{/);
  assert.match(block, /pending\.resolve\(collaborators\)/);
  assert.match(block, /if \(videoId && Array\.isArray\(collaborators\) && collaborators\.length > 0\)/);
  assert.match(block, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.ok(
    block.indexOf('applyResolvedCollaborators(videoId, collaborators') > block.indexOf('if (pending) {'),
    'current behavior can apply collaborators by videoId after the pending branch'
  );
  assert.doesNotMatch(block, /return;\s*}\s*if \(videoId/);
  assert.doesNotMatch(block, /ownedDialogKey|rendererProvenance|ownedPageWorldRequest/);
});

test('set_list_mode_copy_false_does_not_clear_blocklist is not satisfied', () => {
  const block = sliceBetween(
    read('js/background.js'),
    "} else if (action === 'FilterTube_SetListMode')",
    "} else if (action === 'addWhitelistChannelPersistent')"
  );

  assert.match(block, /const shouldCopyBlocklist = request\?\.copyBlocklist === true/);
  assert.match(block, /const mergeAndClearBlocklistIntoWhitelist = \(scope\) => \{/);
  assert.match(block, /nextKids\.blockedChannels = \[\]/);
  assert.match(block, /nextKids\.blockedKeywords = \[\]/);
  assert.match(block, /nextMain\.channels = \[\]/);
  assert.match(block, /nextMain\.keywords = \[\]/);
  assert.match(block, /if \(requestedMode === 'whitelist'\) \{\s*mergeAndClearBlocklistIntoWhitelist\(requestedProfile\);/);
  assert.doesNotMatch(block, /if \(shouldCopyBlocklist\)[\s\S]{0,160}mergeAndClearBlocklistIntoWhitelist/);
  assert.doesNotMatch(block, /mutationReport|dryRun|migrationPlan/);
});

test('content script addFilteredChannel and Nanah scoped apply lack future authority reports today', () => {
  const background = read('js/background.js');
  const secondaryAdd = sliceBetween(
    background,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );
  const secondaryToggle = sliceBetween(
    background,
    "if (message.type === 'toggleChannelFilterAll')",
    '/**\n * Handle adding a filtered channel'
  );
  const nanah = sliceBetween(
    read('js/nanah_sync_adapter.js'),
    'async function applyScopedPortablePayload',
    'function generateId'
  );

  assert.match(secondaryAdd, /handleAddFilteredChannel\(/);
  assert.doesNotMatch(secondaryAdd, /message\.listType/);
  assert.doesNotMatch(secondaryAdd, /isTrustedUiSender|allowedYoutubeContentScript|ruleMutationAuthority|mutationReport/);

  assert.match(secondaryToggle, /handleToggleChannelFilterAll\(message\.channelId, message\.value\)/);
  assert.doesNotMatch(secondaryToggle, /isTrustedUiSender|allowedYoutubeContentScript|ruleMutationAuthority|mutationReport/);

  assert.match(nanah, /await io\.saveProfilesV4\(/);
  assert.match(nanah, /activeProfileId/);
  assert.match(nanah, /targetProfileId/);
  assert.doesNotMatch(nanah, /ruleMutationAuthority|mutationReport|settingsRevision|lockAuthority|isProfileSessionAuthorized/);
});
