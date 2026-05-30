import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_AUTHORITY_AUDIT_2026-05-18.md';

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

function count(text, needle) {
  return text.split(needle).length - 1;
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

test('background message authority audit documents listeners guards mutations and raw evidence boundary', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'runtime.onMessage listener #1',
    'runtime.onMessage listener #2',
    'Guarded UI Paths',
    'Unguarded Or Split Mutation Paths',
    'Injection And Broadcast Paths',
    'docs/json_paths_encyclopedia.md',
    'docs/youtube_renderer_inventory.md'
  ]) {
    assert.ok(doc.includes(marker), `missing audit marker: ${marker}`);
  }

  for (const action of [
    'FilterTube_SetListMode',
    'FilterTube_ApplySettings',
    'FilterTube_KidsBlockChannel',
    'addChannelPersistent',
    'addFilteredChannel',
    'updateVideoChannelMap',
    'FilterTube_EnsureSubscriptionsImportBridge'
  ]) {
    assert.ok(doc.includes(action), `missing action ${action}`);
  }
});

test('background currently has two runtime message listeners with different action shapes', () => {
  const source = read('js/background.js');

  assert.equal(count(source, 'browserAPI.runtime.onMessage.addListener'), 2);

  const primary = sliceBetween(
    source,
    'browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse)',
    '// Listen for storage changes to re-compile settings'
  );
  const secondary = sliceBetween(
    source,
    'browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) =>',
    '/**\n * Handle adding a filtered channel'
  );

  assert.match(primary, /const action = request\?\.action \|\| request\?\.type;/);
  assert.match(secondary, /if \(!message\?\.type\) return false;/);
  assert.match(secondary, /message\.type === 'addFilteredChannel'/);
  assert.match(secondary, /message\.type === 'toggleChannelFilterAll'/);
});

test('trusted UI guard coverage is present for several direct settings and whitelist actions', () => {
  const source = read('js/background.js');
  const guardedActionBlocks = [
    ["} else if (action === 'FilterTube_SessionPinAuth')", "} else if (action === 'FilterTube_ClearSessionPin')"],
    ["} else if (action === 'FilterTube_ClearSessionPin')", "} else if (action === 'FilterTube_SetListMode')"],
    ["} else if (action === 'FilterTube_SetListMode')", "} else if (action === 'addWhitelistChannelPersistent')"],
    ["} else if (action === 'addWhitelistChannelPersistent')", "} else if (action === 'FilterTube_BatchImportWhitelistChannels')"],
    ["} else if (action === 'FilterTube_BatchImportWhitelistChannels')", "} else if (action === 'FilterTube_KidsWhitelistChannel')"],
    ["} else if (action === 'FilterTube_KidsWhitelistChannel')", "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"],
    ["} else if (action === 'FilterTube_TransferWhitelistToBlocklist')", "} else if (action === 'FilterTube_ScheduleAutoBackup')"]
  ];

  for (const [start, end] of guardedActionBlocks) {
    const block = sliceBetween(source, start, end);
    assert.match(block, /isTrustedUiSender\(sender\)/, `${start} should currently have UI sender guard`);
  }
});

test('Kids block channel path currently lacks the trusted UI guard used by Kids whitelist', () => {
  const source = read('js/background.js');
  const kidsWhitelist = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsWhitelistChannel')",
    "} else if (action === 'FilterTube_TransferWhitelistToBlocklist')"
  );
  const kidsBlock = sliceBetween(
    source,
    "} else if (action === 'FilterTube_KidsBlockChannel')",
    "} else if (request.action === \"injectScripts\")"
  );

  assert.match(kidsWhitelist, /isTrustedUiSender\(sender\)/);
  assert.doesNotMatch(kidsBlock, /isTrustedUiSender\(sender\)/);
  assert.match(kidsBlock, /handleAddFilteredChannel\(/);
});

test('FilterTube_ApplySettings recompiles background settings before cache and broadcast', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.match(block, /compiledSettingsCache\[targetProfile\] = null;/);
  assert.match(block, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(block, /browserAPI\.tabs\.query\(\{ url: urlPattern \}/);
  assert.match(block, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(block, /compiledSettingsCache\[targetProfile\] = request\.settings/);
  assert.doesNotMatch(block, /settings: request\.settings/);
});

test('FilterTube_OpenWhatsNew currently accepts caller supplied URL without UI sender guard', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "} else if (action === 'FilterTube_OpenWhatsNew')",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress')"
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.match(block, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL;/);
  assert.match(block, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
});

test('map metadata and stats message paths currently mutate background state without trusted UI guard', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    '} else if (request.action === "updateChannelMap")',
    'else if (request.action === "fetchChannelDetails")'
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.match(block, /enqueueChannelMapMappings\(request\.mappings\)/);
  assert.match(block, /enqueueVideoChannelMapUpdate\(request\.videoId, request\.channelId\)/);
  assert.match(block, /enqueueVideoMetaMapUpdate\(videoId, entry\)/);
  assert.match(block, /browserAPI\.storage\.local\.set\(\{ stats \}\)/);
});

test('recordTimeSaved currently accepts raw caller seconds without finite or range validation', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    '} else if (request.action === "recordTimeSaved")',
    'else if (request.action === "fetchChannelDetails")'
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.match(block, /const oldSeconds = stats\.savedSeconds \|\| 0;/);
  assert.match(block, /stats\.savedSeconds = oldSeconds \+ \(request\.seconds \|\| 0\);/);
  assert.doesNotMatch(block, /Number\.isFinite|Math\.max|Math\.min|clamp|parseFloat|parseInt/);
});

test('fetchChannelDetails currently exposes caller-triggered YouTube channel fetch work', () => {
  const source = read('js/background.js');
  const actionBlock = sliceBetween(
    source,
    'else if (request.action === "fetchChannelDetails")',
    '// Handle any browser-specific actions if needed'
  );
  const fetchBlock = sliceBetween(
    source,
    'async function fetchChannelInfo(channelIdOrHandle) {',
    '/**\n * Handle adding a filtered channel'
  );

  assert.doesNotMatch(actionBlock, /isTrustedUiSender/);
  assert.match(actionBlock, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.match(fetchBlock, /fetch\(channelUrl, \{[\s\S]*credentials: 'include'/);
});

test('script injection and subscription bridge actions currently use caller supplied target data', () => {
  const source = read('js/background.js');
  const injectBlock = sliceBetween(
    source,
    '} else if (request.action === "injectScripts")',
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
  );
  const bridgeBlock = sliceBetween(
    source,
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')",
    '} else if (request.action === "processFetchData")'
  );

  assert.doesNotMatch(injectBlock, /isTrustedUiSender/);
  assert.match(injectBlock, /const scripts = Array\.isArray\(request\?\.scripts\)/);
  assert.match(injectBlock, /scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`/);
  assert.match(injectBlock, /world: 'MAIN'/);
  assert.doesNotMatch(injectBlock, /allowedScripts|allowedScript|new Set|sender\.tab\.url|tabs\.get|youtube\.com|youtubekids\.com/);

  assert.doesNotMatch(bridgeBlock, /isTrustedUiSender/);
  assert.match(bridgeBlock, /const tabId = Number\(request\?\.tabId\)/);
  assert.match(bridgeBlock, /world: 'ISOLATED'/);
  assert.match(bridgeBlock, /'js\/content\/bridge_settings\.js'/);
  assert.doesNotMatch(bridgeBlock, /sender\.tab\.id|sender\.tab\.url|tabs\.get|tabs\.query|youtube\.com\/feed\/channels|isTrustedUiSender/);
});

test('second addFilteredChannel listener currently omits listType and owns backup side effects', () => {
  const source = read('js/background.js');
  const block = sliceBetween(
    source,
    "if (message.type === 'addFilteredChannel')",
    "if (message.type === 'toggleChannelFilterAll')"
  );

  assert.doesNotMatch(block, /isTrustedUiSender/);
  assert.doesNotMatch(block, /message\.listType/);
  assert.match(block, /handleAddFilteredChannel\(/);
  assert.match(block, /scheduleAutoBackupInBackground\(\(message\.profile === 'kids'\) \? 'kids_channel_added' : 'channel_added'\)/);
});

test('ignored root capture files are evidence inputs and not background source authority', () => {
  const captureDoc = read('docs/audit/FILTERTUBE_CAPTURE_CORPUS_INVENTORY_2026-05-17.md');
  const boundaryDoc = read('docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md');

  for (const file of [
    'DOMs.html',
    'YT_MAIN_NEXT.json',
    'YT_MAIN_WATCH.html',
    'YTM-XHR.json',
    'YT_KIDS.json',
    'ytkids_browse?alt=json.json',
    'reel_item_watch?prettyPrint=False.JSON'
  ]) {
    assert.equal(gitOk(['check-ignore', file]), true, `${file} should stay ignored raw evidence`);
    assert.ok(captureDoc.includes(file), `capture inventory should cite ${file}`);
  }

  assert.ok(boundaryDoc.includes('Raw captures stay ignored.'));
  assert.ok(captureDoc.includes('docs/json_paths_encyclopedia.md'));
  assert.ok(captureDoc.includes('docs/youtube_renderer_inventory.md'));
});
