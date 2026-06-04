import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const registerPath = 'docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const messageTrustMutationSecurityDocs = [
  registerPath,
  'docs/audit/FILTERTUBE_MESSAGE_TRANSPORT_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md',
  'docs/audit/FILTERTUBE_MESSAGE_TRUST_HARDENING_GAP_2026-05-18.md',
  'docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SECURITY_CRYPTO_PAYLOAD_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
];

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

function doc() {
  return read(registerPath);
}

function assertMessageSideEffectConvergenceBoundary(text) {
  assert.match(text, /Message Side-Effect Convergence Boundary - 2026-05-30/);
  assert.match(text, /This addendum turns the message side-effect inventory into one convergence\s+boundary/);
  assert.match(text, /Current convergence rows:/);
  assert.match(text, /ASCII message side-effect convergence diagram: present/);
  assert.match(text, /Mermaid message side-effect convergence diagram: present/);

  for (const row of [
    'message_side_effect_background_receiver_trust_split',
    'message_side_effect_apply_settings_cache_broadcast',
    'message_side_effect_refreshnow_dom_rerun_broadcast',
    'message_side_effect_page_world_request_ownership',
    'message_side_effect_learned_identity_map_write',
    'message_side_effect_rule_mutation_storage_backup_refresh',
    'message_side_effect_stats_surface_storage',
    'message_side_effect_script_tab_network_actions',
    'message_side_effect_import_nanah_backup',
    'message_side_effect_negative_spoof_fixture_gap'
  ]) {
    assert.ok(text.includes(`| \`${row}\` |`), `missing convergence row ${row}`);
  }

  for (const token of [
    'message side-effect convergence rows: 10',
    'implementation-ready message side-effect convergence rows: 0',
    'messageSideEffectAuthority product source symbol: absent',
    'trustedUi product source symbol: absent',
    'ownedPageWorldRequest product source symbol: absent',
    'backgroundInternal product source symbol: absent',
    'runtime behavior changed by this addendum: no',
    'message side-effect implementation approval: NO-GO',
    'message trust hardening approval from this convergence: NO-GO',
    'rule mutation optimization approval: NO-GO',
    'storage/cache optimization approval: NO-GO',
    'JSON-first promotion approval: NO-GO',
    'release/public-claim use: NO-GO'
  ]) {
    assert.ok(text.includes(token), `missing convergence token ${token}`);
  }

  const combinedRuntimeSource = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/bridge_settings.js',
    'js/injector.js',
    'js/state_manager.js',
    'js/content/block_channel.js',
    'js/seed.js'
  ].map(read).join('\n');

  for (const futureToken of [
    'messageSideEffectAuthority',
    'trustedUi',
    'ownedPageWorldRequest',
    'backgroundInternal'
  ]) {
    assert.doesNotMatch(combinedRuntimeSource, new RegExp(`\\b${futureToken}\\b`), `${futureToken} should not be implemented in runtime source yet`);
  }
}

test('message side-effect register defines every current side-effect class', () => {
  const text = doc();

  for (const sideEffectClass of [
    'tabOpen',
    'scriptInjection',
    'networkFetch',
    'storageWrite',
    'compiledCacheBroadcast',
    'domRerun',
    'learnedIdentity',
    'statsMutation',
    'backupSchedule',
    'ruleMutation'
  ]) {
    assert.ok(text.includes(`\`${sideEffectClass}\``), `missing side-effect class ${sideEffectClass}`);
  }

  assert.match(text, /ignored root HTML\/JSON\/TXT capture files are evidence inputs only/i);
  assert.match(text, /not message\s+senders, product source, trusted runtime inputs, or release files/i);
});

test('message side-effect register covers high-risk background messages with future gates', () => {
  const text = doc();

  for (const message of [
    'FilterTube_OpenWhatsNew',
    'injectScripts',
    'FilterTube_EnsureSubscriptionsImportBridge',
    'FilterTube_ApplySettings',
    'updateChannelMap',
    'updateVideoChannelMap',
    'updateVideoMetaMap',
    'recordTimeSaved',
    'fetchChannelDetails',
    'FilterTube_ScheduleAutoBackup',
    'FilterTube_KidsBlockChannel',
    'addChannelPersistent',
    'addFilteredChannel',
    'toggleChannelFilterAll'
  ]) {
    assert.ok(text.includes(`| \`${message}\` |`), `missing background side-effect row for ${message}`);
  }

  for (const phrase of [
    'allowlisted release URL',
    'approved files and allowed route',
    'active subscription-import request',
    'Background-owned compiled revision',
    'Source/provenance schema',
    'Structured hide decision',
    'Explicit user action or active resolver need',
    'delay clamp',
    'Same lock/sender/profile authority as Kids whitelist',
    'menu-action proof'
  ]) {
    assert.ok(text.includes(phrase), `missing future gate phrase ${phrase}`);
  }
});

test('message side-effect register covers high-risk page-world messages with future gates', () => {
  const text = doc();

  for (const message of [
    'FilterTube_Refresh',
    'FilterTube_UpdateVideoChannelMap',
    'FilterTube_UpdateVideoMetaMap',
    'FilterTube_UpdateCustomUrlMap',
    'FilterTube_CollaboratorInfoResponse',
    'FilterTube_CacheCollaboratorInfo',
    'FilterTube_CollabDialogData'
  ]) {
    assert.ok(text.includes(`| \`${message}\` |`), `missing page-message side-effect row for ${message}`);
  }

  for (const phrase of [
    'Owned nonce/request ID',
    'before persistence, not just before DOM stamping',
    'Active metadata filter reason',
    'Route through background learned-identity authority',
    'Pending request ownership',
    'Renderer provenance',
    'Owned dialog key'
  ]) {
    assert.ok(text.includes(phrase), `missing page future gate phrase ${phrase}`);
  }
});

test('background source still proves the registered message side effects and missing shared sender contract', () => {
  const source = read('js/background.js');

  const openWhatsNew = sliceBetween(source, "} else if (action === 'FilterTube_OpenWhatsNew')", "} else if (action === 'FilterTube_SubscriptionsImportProgress')");
  const injectScripts = sliceBetween(source, '} else if (request.action === "injectScripts")', "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')");
  const importBridge = sliceBetween(source, "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')", '} else if (request.action === "processFetchData")');
  const applySettings = sliceBetween(source, '} else if (request.action === "FilterTube_ApplySettings" && request.settings)', '} else if (request.action === "updateChannelMap")');
  const learnedMaps = sliceBetween(source, '} else if (request.action === "updateChannelMap")', 'else if (request.action === "fetchChannelDetails")');
  const fetchDetails = sliceBetween(source, 'else if (request.action === "fetchChannelDetails")', '// Handle any browser-specific actions if needed');
  const kidsBlock = sliceBetween(source, "} else if (action === 'FilterTube_KidsBlockChannel')", '} else if (request.action === "injectScripts")');
  const secondary = sliceBetween(source, "if (message.type === 'addFilteredChannel')", '/**\n * Handle adding a filtered channel');

  assert.match(openWhatsNew, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(openWhatsNew, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.match(injectScripts, /\.map\(\(scriptName\) => scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`\)/);
  assert.match(injectScripts, /world: 'MAIN'/);
  assert.match(importBridge, /const tabId = Number\(request\?\.tabId\)/);
  assert.match(importBridge, /files:\s*\[[\s\S]*js\/content\/bridge_settings\.js/);
  assert.match(applySettings, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(applySettings, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(applySettings, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(applySettings, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);
  assert.match(learnedMaps, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(learnedMaps, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(learnedMaps, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);
  assert.match(learnedMaps, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.match(fetchDetails, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.match(kidsBlock, /handleAddFilteredChannel\(/);
  assert.match(kidsBlock, /'kids'/);
  assert.match(kidsBlock, /rawVideoId/);
  assert.match(secondary, /handleAddFilteredChannel\(/);
  assert.match(secondary, /handleToggleChannelFilterAll\(message\.channelId, message\.value\)/);

  for (const block of [openWhatsNew, injectScripts, importBridge, applySettings, learnedMaps, fetchDetails, kidsBlock, secondary]) {
    assert.doesNotMatch(block, /trustedUi|allowedYoutubeContentScript|ownedPageWorldRequest|backgroundInternal/);
  }
});

test('page-world source still proves registered DOM rerun and learned-identity side effects', () => {
  const source = read('js/content_bridge.js');
  const handler = sliceBetween(source, 'function handleMainWorldMessages', 'async function initialize');
  const refresh = sliceBetween(handler, "type === 'FilterTube_Refresh'", "type === 'FilterTube_UpdateChannelMap'");
  const videoChannel = sliceBetween(handler, "type === 'FilterTube_UpdateVideoChannelMap'", "type === 'FilterTube_UpdateVideoMetaMap'");
  const videoMeta = sliceBetween(handler, "type === 'FilterTube_UpdateVideoMetaMap'", "type === 'FilterTube_UpdateCustomUrlMap'");
  const customUrl = sliceBetween(handler, "type === 'FilterTube_UpdateCustomUrlMap'", "type === 'FilterTube_CollaboratorInfoResponse'");
  const collaboratorResponse = sliceBetween(handler, "type === 'FilterTube_CollaboratorInfoResponse'", "type === 'FilterTube_SubscriptionsImportProgress'");
  const collaboratorCache = sliceBetween(handler, "type === 'FilterTube_CacheCollaboratorInfo'", "type === 'FilterTube_ChannelInfoResponse'");
  const dialogData = sliceBetween(handler, "type === 'FilterTube_CollabDialogData'", '\n    }\n}\n');

  assert.match(handler, /event\.source !== window/);
  assert.match(handler, /event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.match(refresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.match(videoChannel, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(videoChannel, /applyDOMFallback\(null\)/);
  assert.match(videoMeta, /persistVideoMetaMapping\(updates\)/);
  assert.match(videoMeta, /scheduleVideoMetaDomRerun\(\)/);
  assert.match(customUrl, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.match(collaboratorResponse, /const pending = window\.pendingCollaboratorRequests\.get\(requestId\)/);
  assert.match(collaboratorResponse, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.match(collaboratorCache, /applyResolvedCollaborators\(videoId, collaborators/);
  assert.match(dialogData, /if \(collabKey && window\.pendingCollabCards\.has\(collabKey\)\)/);
  assert.match(dialogData, /if \(videoId\) \{/);
  assert.match(dialogData, /applyResolvedCollaborators\(videoId, sanitized/);

  for (const block of [refresh, videoChannel, videoMeta, customUrl, collaboratorCache]) {
    assert.doesNotMatch(block, /nonce|ownedPageWorldRequest|trustedUi|allowedYoutubeContentScript/);
  }
});

test('message side-effect register names the future fixture gates needed before behavior changes', () => {
  const text = doc();

  for (const fixtureName of [
    'message_side_effect_open_whats_new_uses_allowlisted_release_url',
    'message_side_effect_inject_scripts_uses_static_allowlist',
    'message_side_effect_subscriptions_bridge_requires_trusted_import_tab',
    'message_side_effect_apply_settings_cannot_set_compiled_cache_from_caller',
    'message_side_effect_channel_map_requires_valid_provenance',
    'message_side_effect_video_channel_map_requires_card_or_renderer_provenance',
    'message_side_effect_video_meta_map_requires_active_metadata_reason',
    'message_side_effect_record_time_saved_requires_structured_hide_decision',
    'message_side_effect_fetch_channel_details_requires_explicit_budget',
    'message_side_effect_auto_backup_schedule_requires_internal_or_trusted_actor',
    'message_side_effect_kids_block_matches_kids_whitelist_lock_policy',
    'message_side_effect_add_filtered_channel_carries_list_type_and_sender_class',
    'message_side_effect_toggle_filter_all_requires_channel_row_authority',
    'message_side_effect_page_refresh_requires_owned_nonce_or_background_broadcast',
    'message_side_effect_page_video_channel_map_cannot_persist_before_provenance',
    'message_side_effect_page_video_meta_map_cannot_touch_dom_without_reason',
    'message_side_effect_custom_url_map_routes_through_background_authority',
    'message_side_effect_collaborator_response_requires_pending_request',
    'message_side_effect_collaborator_cache_requires_owned_renderer_source',
    'message_side_effect_collab_dialog_video_apply_requires_owned_key'
  ]) {
    assert.ok(text.includes(fixtureName), `missing fixture gate ${fixtureName}`);
  }
});

test('message side-effect register is tied to existing message trust and mutation audits', () => {
  const register = doc();
  const trustGap = read('docs/audit/FILTERTUBE_MESSAGE_TRUST_HARDENING_GAP_2026-05-18.md');
  const senderMatrix = read('docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md');
  const mutationContract = read('docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md');
  const learnedIdentity = read('docs/audit/FILTERTUBE_LEARNED_IDENTITY_AUTHORITY_AUDIT_2026-05-18.md');
  const readiness = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  assert.ok(trustGap.includes('Required Sender Classes'));
  assert.ok(senderMatrix.includes('Current Background Runtime Message Inventory'));
  assert.ok(senderMatrix.includes('Current Page-World Message Inventory'));
  assert.ok(mutationContract.includes('FilterTube_ApplySettings'));
  assert.ok(learnedIdentity.includes('FilterTube_UpdateVideoChannelMap'));
  assert.ok(register.includes('message receiver'));
  assert.ok(register.includes('storage keys touched'));
  assert.ok(readiness.includes('Message trust contract'));
  assertMessageSideEffectConvergenceBoundary(register);
});

test('message trust mutation and security docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5797',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5797',
    'runtime behavior changed: no'
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of messageTrustMutationSecurityDocs) {
    const text = read(auditDoc);
    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5797',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5797',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'runtime optimization or JSON-first promotion',
      'whitelist behavior changes'
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});
