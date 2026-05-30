import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_MESSAGE_TRUST_HARDENING_GAP_2026-05-18.md';

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

function actionBlock(source, start, end) {
  return sliceBetween(source, start, end);
}

test('message trust hardening gap defines sender classes and negative fixture gates', () => {
  const doc = read(auditDocPath);

  for (const senderClass of [
    'trustedUi',
    'allowedYoutubeContentScript',
    'ownedPageWorldRequest',
    'backgroundInternal'
  ]) {
    assert.ok(doc.includes(senderClass), `missing sender class ${senderClass}`);
  }

  for (const fixtureName of [
    'background_rejects_untrusted_apply_settings',
    'background_rejects_untrusted_script_injection',
    'background_rejects_untrusted_subscriptions_bridge_injection',
    'background_rejects_arbitrary_whats_new_url',
    'background_rejects_untrusted_channel_detail_fetch',
    'background_rejects_invalid_learned_channel_map_entries',
    'background_rejects_invalid_video_channel_map_entries',
    'background_rejects_invalid_video_meta_map_entries',
    'background_rejects_unbounded_time_saved_stats',
    'page_message_rejects_spoof_refresh',
    'page_message_rejects_spoof_video_channel_map',
    'page_message_rejects_spoof_video_meta_map',
    'page_message_rejects_spoof_custom_url_map',
    'page_message_requires_pending_collaborator_response',
    'page_message_requires_owned_collab_dialog_key'
  ]) {
    assert.ok(doc.includes(fixtureName), `missing negative fixture gate ${fixtureName}`);
  }
});

test('background high-risk actions currently lack one shared sender class contract', () => {
  const source = read('js/background.js');
  const actions = [
    [
      'FilterTube_OpenWhatsNew',
      actionBlock(
        source,
        "} else if (action === 'FilterTube_OpenWhatsNew')",
        "} else if (action === 'FilterTube_SubscriptionsImportProgress')"
      ),
      /browserAPI\.tabs\.create\(\{ url: url, active: true \}/
    ],
    [
      'injectScripts',
      actionBlock(
        source,
        '} else if (request.action === "injectScripts")',
        "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
      ),
      /world: 'MAIN'/
    ],
    [
      'FilterTube_EnsureSubscriptionsImportBridge',
      actionBlock(
        source,
        "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')",
        '} else if (request.action === "processFetchData")'
      ),
      /const tabId = Number\(request\?\.tabId\)/
    ],
    [
      'FilterTube_ApplySettings',
      actionBlock(
        source,
        '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
        '} else if (request.action === "updateChannelMap")'
      ),
      /getCompiledSettings\(syntheticSender, targetProfile, true\)/
    ],
    [
      'fetchChannelDetails',
      actionBlock(
        source,
        'else if (request.action === "fetchChannelDetails")',
        '// Handle any browser-specific actions if needed'
      ),
      /fetchChannelInfo\(request\.channelIdOrHandle\)/
    ]
  ];

  for (const [name, block, requiredSideEffect] of actions) {
    assert.doesNotMatch(block, /isTrustedUiSender\(sender\)/, `${name} currently has no trusted UI guard`);
    assert.doesNotMatch(block, /trustedUi|allowedYoutubeContentScript|ownedPageWorldRequest|backgroundInternal/);
    assert.match(block, requiredSideEffect, `${name} should still prove its current side effect`);
  }
});

test('background learned map and stats actions currently accept caller payloads without schema-level reject gates', () => {
  const source = read('js/background.js');
  const block = actionBlock(
    source,
    '} else if (request.action === "updateChannelMap")',
    'else if (request.action === "fetchChannelDetails")'
  );

  assert.doesNotMatch(block, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(block, /trustedUi|allowedYoutubeContentScript|ownedPageWorldRequest|backgroundInternal/);
  assert.match(block, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(block, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(block, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);
  assert.match(block, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\)/);
  assert.doesNotMatch(block, /Number\.isFinite|Math\.max|Math\.min|clamp|UC[a-zA-Z0-9_-]{20,}/);
});

test('learned video-channel updates currently merge into compiled settings before storage flush', () => {
  const source = read('js/background.js');
  const enqueueBlock = actionBlock(
    source,
    'function enqueueVideoChannelMapUpdate(videoId, channelId) {',
    'function enqueueVideoMetaMapUpdate(videoId, meta) {'
  );
  const compileBlock = actionBlock(
    source,
    'const compiledVideoChannelMap = {',
    'compiledSettings.videoMetaMap = items.videoMetaMap || {};'
  );

  assert.match(enqueueBlock, /pendingVideoChannelMapUpdates\.set\(v, c\)/);
  assert.match(enqueueBlock, /compiledSettingsCache\.main\.videoChannelMap = \{/);
  assert.match(enqueueBlock, /compiledSettingsCache\.kids\.videoChannelMap = \{/);
  assert.match(enqueueBlock, /scheduleVideoChannelMapFlush\(\)/);

  assert.match(compileBlock, /pendingVideoChannelMapUpdates\.entries\(\)/);
  assert.match(compileBlock, /compiledVideoChannelMap\[pendingVideoId\] = pendingChannelId/);
  assert.match(compileBlock, /compiledSettings\.videoChannelMap = compiledVideoChannelMap/);
});

test('content bridge page messages can currently persist maps or rerun DOM fallback without pending ownership', () => {
  const source = read('js/content_bridge.js');
  const handler = actionBlock(source, 'function handleMainWorldMessages', 'async function initialize');

  const refresh = actionBlock(handler, "type === 'FilterTube_Refresh'", "type === 'FilterTube_UpdateChannelMap'");
  const videoMap = actionBlock(handler, "type === 'FilterTube_UpdateVideoChannelMap'", "type === 'FilterTube_UpdateVideoMetaMap'");
  const videoMeta = actionBlock(handler, "type === 'FilterTube_UpdateVideoMetaMap'", "type === 'FilterTube_UpdateCustomUrlMap'");
  const customUrl = actionBlock(handler, "type === 'FilterTube_UpdateCustomUrlMap'", "type === 'FilterTube_CollaboratorInfoResponse'");
  const cacheCollab = actionBlock(handler, "type === 'FilterTube_CacheCollaboratorInfo'", "type === 'FilterTube_ChannelInfoResponse'");

  assert.match(handler, /event\.source !== window/);
  assert.match(handler, /event\.data\?\.type\?\.startsWith\('FilterTube_'\)/);
  assert.doesNotMatch(handler, /event\.origin|nonce|trustedUi|allowedYoutubeContentScript|ownedPageWorldRequest/);

  assert.match(refresh, /applyDOMFallback\(result\.settings, \{ forceReprocess: true \}\)/);
  assert.match(videoMap, /persistVideoChannelMapping\(videoId, channelId\)/);
  assert.match(videoMap, /applyDOMFallback\(null\)/);
  assert.match(videoMeta, /persistVideoMetaMapping\(updates\)/);
  assert.match(videoMeta, /scheduleVideoMetaDomRerun\(\)/);
  assert.match(customUrl, /browserAPI_BRIDGE\.storage\.local\.set\(\{ channelMap \}/);
  assert.match(cacheCollab, /applyResolvedCollaborators\(videoId, collaborators/);

  for (const block of [refresh, videoMap, videoMeta, customUrl, cacheCollab]) {
    assert.doesNotMatch(block, /pending[A-Za-z]+Requests\.get|requestId|nonce|ownedPageWorldRequest/);
  }
});

test('collaborator page messages currently allow video-id application outside owned key proof', () => {
  const source = read('js/content_bridge.js');
  const handler = actionBlock(source, 'function handleMainWorldMessages', 'async function initialize');
  const collaboratorResponse = actionBlock(
    handler,
    "type === 'FilterTube_CollaboratorInfoResponse'",
    "type === 'FilterTube_SubscriptionsImportProgress'"
  );
  const dialogData = actionBlock(
    handler,
    "type === 'FilterTube_CollabDialogData'",
    '\n    }\n}\n'
  );

  assert.match(collaboratorResponse, /const pending = window\.pendingCollaboratorRequests\.get\(requestId\)/);
  assert.match(collaboratorResponse, /if \(pending\) \{/);
  assert.match(collaboratorResponse, /if \(videoId && Array\.isArray\(collaborators\)/);
  assert.match(collaboratorResponse, /applyResolvedCollaborators\(videoId, collaborators/);

  assert.match(dialogData, /if \(collabKey && window\.pendingCollabCards\.has\(collabKey\)\)/);
  assert.match(dialogData, /if \(videoId\) \{/);
  assert.match(dialogData, /applyResolvedCollaborators\(videoId, sanitized/);
});

test('message trust hardening gap is tied back to existing background and page-message audits', () => {
  const doc = read(auditDocPath);
  const backgroundDoc = read('docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_AUTHORITY_AUDIT_2026-05-18.md');
  const pageDoc = read('docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md');

  assert.ok(doc.includes('background `runtime.onMessage` actions'));
  assert.ok(doc.includes('same-window page messages'));
  assert.ok(backgroundDoc.includes('Unguarded Or Split Mutation Paths'));
  assert.ok(pageDoc.includes('Required Future Trust Contract'));
  assert.ok(doc.includes('Learned Identity Poison Chain'));
});
