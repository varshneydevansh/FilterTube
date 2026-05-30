import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_INJECTOR_SETTINGS_CAPABILITY_AUDIT_2026-05-18.md';

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

test('injector settings capability audit documents current bridge flow and future contract', () => {
  const doc = read(auditDocPath);

  for (const marker of [
    'background compiled settings revision',
    'one seed settings apply',
    'source: "content_bridge" is a label, not proof of authority',
    'subscriptions_import',
    'active-rule-identity-needed',
    'tests/runtime/injector-settings-capability-current-behavior.test.mjs'
  ]) {
    assert.ok(doc.includes(marker), `missing marker ${marker}`);
  }

  for (const source of [
    'js/content/bridge_injection.js',
    'js/content/bridge_settings.js',
    'js/injector.js',
    'js/seed.js'
  ]) {
    assert.ok(doc.includes(source), `missing source ${source}`);
  }
});

test('bridge settings currently relays settings to injector without nonce capability token or revision', () => {
  const source = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    source,
    'function sendSettingsToMainWorld(settings)',
    'let pendingStorageRefreshTimer'
  );

  assert.match(block, /window\.postMessage\(\{/);
  assert.match(block, /type: 'FilterTube_SettingsToInjector'/);
  assert.match(block, /payload: settings/);
  assert.match(block, /source: 'content_bridge'/);
  assert.match(block, /\}, '\*'\)/);
  assert.doesNotMatch(block, /nonce|capability|revision|settingsRevision|requestId/);
});

test('bridge settings currently has direct seed apply and retry in addition to injector relay', () => {
  const source = read('js/content/bridge_settings.js');
  const directApply = sliceBetween(
    source,
    'function tryApplySettingsToSeed(settings)',
    'function ensureSeedReadyListener'
  );
  const retryBlock = sliceBetween(
    source,
    'function scheduleSeedRetry()',
    'function sendSettingsToMainWorld(settings)'
  );
  const sendBlock = sliceBetween(
    source,
    'function sendSettingsToMainWorld(settings)',
    'let pendingStorageRefreshTimer'
  );

  assert.match(directApply, /window\.filterTube\?\.updateSettings/);
  assert.match(directApply, /window\.filterTube\.updateSettings\(settings\)/);
  assert.match(retryBlock, /setTimeout\(\(\) => \{/);
  assert.match(retryBlock, /scheduleSeedRetry\(\)/);
  assert.match(sendBlock, /window\.postMessage\(\{/);
  assert.match(sendBlock, /if \(!tryApplySettingsToSeed\(settings\)\)/);
});

test('injector settings receiver currently merges payload and drains queue without revision gate', () => {
  const source = read('js/injector.js');
  const block = sliceBetween(
    source,
    "if (type === 'FilterTube_SettingsToInjector' && source === 'content_bridge')",
    '// Handle collaboration data caching from filter_logic.js'
  );

  assert.match(block, /currentSettings = \{ \.\.\.currentSettings, \.\.\.payload \};/);
  assert.match(block, /settingsReceived = true;/);
  assert.match(block, /updateSeedSettings\(\);/);
  assert.match(block, /processInitialDataQueue\(\);/);
  assert.doesNotMatch(block, /revision|settingsRevision|nonce|capability/);
});

test('injector updateSeedSettings currently can apply settings immediately and again after retry', () => {
  const source = read('js/injector.js');
  const block = sliceBetween(
    source,
    'function updateSeedSettings()',
    '// Process data with FilterTubeEngine'
  );

  assert.match(block, /window\.filterTube\.updateSettings\(currentSettings\)/);
  assert.match(block, /setTimeout\(\(\) => \{/);
  assert.match(block, /Retrying seed\.js settings update/);
  assert.match(block, /window\.filterTube\.updateSettings\(currentSettings\)/);
  assert.doesNotMatch(block, /lastApplied|revision|settingsRevision/);
});

test('seed updateSettings currently reprocesses queued and raw snapshots on every settings update', () => {
  const source = read('js/seed.js');
  const block = sliceBetween(
    source,
    'function updateSettings(newSettings)',
    '// ============================================================================\n    // GLOBAL INTERFACE'
  );

  assert.match(block, /cachedSettings = newSettings;/);
  assert.match(block, /if \(pendingDataQueue\.length > 0\)/);
  assert.match(block, /processWithEngine\(sourceData, `\$\{item\.name\}-queued`\)/);
  assert.match(block, /Reprocessing stored ytInitialData snapshot with new settings/);
  assert.match(block, /Reprocessing stored ytInitialPlayerResponse snapshot with new settings/);
  assert.doesNotMatch(block, /settingsRevision|revision|sameSettings|deepEqual|lastApplied/);
});

test('injector initialDataQueue stores revisionless process closures from the backup ytInitialData hook', () => {
  const source = read('js/injector.js');
  const declarations = sliceBetween(
    source,
    'var settingsReceived = false;',
    '// Cache for collaboration data from filter_logic.js'
  );
  const queueBlock = sliceBetween(
    source,
    'function processInitialDataQueue()',
    '// Connect to seed.js global object'
  );
  const hookBlock = sliceBetween(
    source,
    'function setupAdditionalHooks()',
    '// Set up hooks'
  );

  assert.match(declarations, /var initialDataQueue = \[\];/);
  assert.match(queueBlock, /while \(initialDataQueue\.length > 0\)/);
  assert.match(queueBlock, /const item = initialDataQueue\.shift\(\)/);
  assert.match(queueBlock, /item\.process\(\)/);
  assert.match(hookBlock, /initialDataQueue\.push\(\{/);
  assert.match(hookBlock, /name: 'ytInitialData'/);
  assert.match(hookBlock, /process: \(\) => \{/);
  assert.doesNotMatch(queueBlock + hookBlock, /revision|settingsRevision|maxQueue|queueLimit/);
});

test('injector collaborator and channel lookups use source labels and wildcard responses', () => {
  const source = read('js/injector.js');
  const collaboratorBlock = sliceBetween(
    source,
    "if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge')",
    '// Handle single-channel info request from content_bridge'
  );
  const channelBlock = sliceBetween(
    source,
    "if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge')",
    '\n        }\n\n    });'
  );

  assert.match(collaboratorBlock, /searchYtInitialDataForCollaborators\(videoId, matcher\)/);
  assert.match(collaboratorBlock, /type: 'FilterTube_CollaboratorInfoResponse'/);
  assert.match(collaboratorBlock, /source: 'injector'/);
  assert.match(collaboratorBlock, /\}, '\*'\)/);

  assert.match(channelBlock, /searchYtInitialDataForVideoChannel\(videoId/);
  assert.match(channelBlock, /type: 'FilterTube_ChannelInfoResponse'/);
  assert.match(channelBlock, /\}, '\*'\)/);

  assert.doesNotMatch(collaboratorBlock + channelBlock, /capability|activeRule|reason|nonce|settingsRevision/);
});

test('subscription import request currently uses requestId but no capability token across page message boundary', () => {
  const bridgeSettings = read('js/content/bridge_settings.js');
  const requestBlock = sliceBetween(
    bridgeSettings,
    'globalThis.FilterTubeRequestSubscribedChannelsFromMainWorld = function requestSubscribedChannelsFromMainWorld',
    "console.log('FilterTube: Sent subscriptions import request to Main World');"
  );
  const injector = read('js/injector.js');
  const receiverBlock = sliceBetween(
    injector,
    'function handleSubscriptionsImportBridgeMessage(event)',
    'function installSubscriptionsImportBridge()'
  );

  assert.match(requestBlock, /const requestId = \+\+window\.subscriptionImportRequestId;/);
  assert.match(requestBlock, /window\.pendingSubscriptionImportRequests\.set\(requestId, pendingRequest\)/);
  assert.match(requestBlock, /type: 'FilterTube_RequestSubscriptionImport'/);
  assert.match(requestBlock, /source: 'content_bridge'/);
  assert.match(receiverBlock, /type !== 'FilterTube_RequestSubscriptionImport' \|\| source !== 'content_bridge'/);
  assert.match(receiverBlock, /fetchSubscribedChannelsFromYoutubei\(requestId, payload \|\| \{\}\)/);
  assert.doesNotMatch(requestBlock + receiverBlock, /capabilityToken|actionToken|nonce|settingsRevision/);
});

test('subscription import path currently owns scroll click and credentialed youtubei fetch side effects', () => {
  const source = read('js/injector.js');
  const expansionBlock = sliceBetween(
    source,
    'async function expandSubscriptionsImportPageSeed(maxChannels, timeoutMs = 8000)',
    'function getLatestSubscriptionImportBrowseSnapshotTs()'
  );
  const fetchBlock = sliceBetween(
    source,
    'async function fetchSubscribedChannelsFromYoutubei(requestId, options = {})',
    'function tokenizeExpectedCollaboratorNames(values = [])'
  );

  assert.match(expansionBlock, /window\.scrollTo/);
  assert.match(expansionBlock, /window\.dispatchEvent\(new Event\('scroll'\)\)/);
  assert.match(expansionBlock, /button\.click\(\)/);
  assert.match(expansionBlock, /stablePasses >= 5 \|\| expansionActions >= 18/);

  assert.match(fetchBlock, /\/youtubei\/v1\/browse\?prettyPrint=false/);
  assert.match(fetchBlock, /credentials: 'include'/);
  assert.match(fetchBlock, /setTimeout\(\(\) => \{[\s\S]*abortController\.abort\(\)/);
  assert.match(fetchBlock, /maxChannels/);
});

test('bridge injection currently uses a fixed script list but background receives script names from caller', () => {
  const source = read('js/content/bridge_injection.js');
  const scriptingBlock = sliceBetween(
    source,
    'async function injectViaScriptingAPI(scripts)',
    'async function injectViaFallback(scripts)'
  );
  const fallbackBlock = sliceBetween(
    source,
    'async function injectViaFallback(scripts)',
    'globalThis.injectMainWorldScripts'
  );
  const ownerBlock = sliceBetween(
    source,
    'globalThis.injectMainWorldScripts = async function injectMainWorldScripts()',
    'var injectMainWorldScripts = globalThis.injectMainWorldScripts;'
  );

  assert.match(scriptingBlock, /action: "injectScripts"/);
  assert.match(scriptingBlock, /scripts: scripts/);
  assert.match(fallbackBlock, /script\.src = api\.runtime\.getURL\(`js\/\$\{scriptName\}\.js`\)/);
  assert.match(ownerBlock, /const scriptsToInject = \['shared\/identity', 'filter_logic'\];/);
  assert.match(ownerBlock, /if \(isFirefox\) scriptsToInject\.push\('seed'\);/);
  assert.match(ownerBlock, /scriptsToInject\.push\('injector'\);/);
  assert.match(ownerBlock, /setTimeout\(\(\) => \{[\s\S]*requestSettingsFromBackground\(\)/);
});
