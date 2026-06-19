import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function currentBackgroundActions() {
  const source = read('js/background.js');
  const patterns = [
    /\b(?:action|request\.action)\s*===\s*['"]([^'"]+)['"]/g,
    /message\.type\s*===\s*['"]([^'"]+)['"]/g
  ];
  const rows = [];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      rows.push({ action: match[1], line });
    }
  }

  return rows.sort((a, b) => a.line - b.line || a.action.localeCompare(b.action));
}

test('background message action semantic register is audit-only and scoped to current behavior', () => {
  const source = doc();

  assert.match(source, /Status: audit-only proof/);
  assert.match(source, /This is not an implementation patch/);
  assert.match(source, /Runtime behavior is unchanged/);
  assert.match(source, /runtime\.onMessage listeners: 2/);
  assert.match(source, /current action\/type branches: 34/);
  assert.match(source, /This is not completion proof for every background method/);
});

test('background message action semantic register accounts for every current background action branch', () => {
  const source = doc();
  const actions = currentBackgroundActions();

  assert.equal(actions.length, 34);
  assert.equal(new Set(actions.map((row) => row.action)).size, 34);

  for (const { action, line } of actions) {
    assert.ok(source.includes(`| \`${action}\` |`), `missing action table row for ${action}`);
    assert.ok(source.includes(`js/background.js:${line}`), `missing source line for ${action}`);
  }
});

test('background message action semantic register classifies high-risk action families', () => {
  const source = doc();

  for (const semanticClass of [
    'promptOrRelease',
    'progressRelay',
    'settingsCompileCache',
    'securitySession',
    'ruleMutation',
    'backupSchedule',
    'identityNetworkResolver',
    'scriptInjection',
    'legacyDiagnostic',
    'learnedIdentityWrite',
    'statsMutation',
    'diagnosticResponse'
  ]) {
    assert.ok(source.includes(`\`${semanticClass}\``), `missing semantic class ${semanticClass}`);
  }

  for (const futureField of [
    'senderClass',
    'routeOrOrigin',
    'profileType',
    'targetList',
    'lockSessionState',
    'inputSchema',
    'storageKeysTouched',
    'networkAuthority',
    'scriptInjectionAuthority',
    'tabBroadcastAuthority',
    'compiledCacheRevision',
    'learnedIdentityProvenance',
    'negativeSenderFixture',
    'restoreOrRollbackProof'
  ]) {
    assert.ok(source.includes(futureField), `missing future action contract field ${futureField}`);
  }
});

test('background source still proves selected action side effects and split guards', () => {
  const source = read('js/background.js');
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
  const applySettings = sliceBetween(
    primary,
    '} else if (request.action === "FilterTube_ApplySettings" && request.settings)',
    '} else if (request.action === "updateChannelMap")'
  );
  const identityFetches = sliceBetween(
    source,
    'function handleFetchShortsIdentityMessage(request, sendResponse)',
    'function storageGet(keys)'
  );
  const injection = sliceBetween(
    primary,
    '} else if (request.action === "injectScripts")',
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
  );

  assert.match(primary, /const action = request\?\.action \|\| request\?\.type/);
  assert.match(secondary, /if \(!message\?\.type\) return false/);
  assert.match(secondary, /message\.type === 'addFilteredChannel'/);
  assert.match(secondary, /const targetProfile = message\.profile \|\| 'main'/);
  assert.match(secondary, /const targetListType = message\.listType === 'whitelist' \? 'whitelist' : 'blocklist'/);
  assert.match(secondary, /handleAddFilteredChannel\([\s\S]*targetProfile[\s\S]*message\.videoId \|\| ''[\s\S]*targetListType/);

  assert.match(applySettings, /compiledSettingsCache\[targetProfile\] = null/);
  assert.match(applySettings, /getCompiledSettings\(syntheticSender, targetProfile, true\)/);
  assert.match(applySettings, /sendMessageToTabQuietly\(tab\.id, \{ action: 'FilterTube_ApplySettings', settings: compiledSettings \}\)/);
  assert.doesNotMatch(applySettings, /compiledSettingsCache\[targetProfile\] = request\.settings|settings: request\.settings/);

  assert.match(identityFetches, /performShortsIdentityFetch\(videoId, normalizedHandle\)/);
  assert.match(identityFetches, /performKidsWatchIdentityFetch\(videoId\) \|\| await performWatchIdentityFetch\(videoId\)/);
  assert.match(source, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`,[\s\S]*credentials: 'include'/);
  assert.match(source, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`,[\s\S]*credentials: 'include'/);

  assert.match(injection, /scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`/);
  assert.match(injection, /world: 'MAIN'/);
});

test('runtime source lacks background message action semantic authority symbols', () => {
  const source = doc();
  const runtime = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/state_manager.js',
    'js/settings_shared.js'
  ].map(read).join('\n');

  for (const authority of [
    'backgroundMessageActionAuthority',
    'backgroundActionSemanticReport',
    'messageActionEffectDecision',
    'messageActionSenderContract'
  ]) {
    assert.ok(source.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(authority), `${authority} should not exist in runtime source yet`);
  }
});
