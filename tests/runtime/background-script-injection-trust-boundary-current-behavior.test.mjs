import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BACKGROUND_SCRIPT_INJECTION_TRUST_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function lineCount(source) {
  const normalized = source.endsWith('\n') ? source.slice(0, -1) : source;
  return normalized.split('\n').length;
}

function sha256(source) {
  return crypto.createHash('sha256').update(source).digest('hex');
}

function count(source, pattern) {
  return source.match(pattern)?.length || 0;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('unterminated block');
}

function functionBlock(source, marker) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `missing marker ${marker}`);
  const brace = source.indexOf('{', index);
  assert.notEqual(brace, -1, `missing body for ${marker}`);
  const end = findMatchingBrace(source, brace);
  return source.slice(index, end + 1);
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker ${endMarker}`);
  return source.slice(start, end);
}

function blocks() {
  const background = read('js/background.js');
  const bridge = read('js/content/bridge_injection.js');
  const injectScripts = sliceBetween(
    background,
    '} else if (request.action === "injectScripts")',
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')"
  );
  const subscriptionsBridge = sliceBetween(
    background,
    "} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge')",
    '} else if (request.action === "processFetchData")'
  );
  const scriptingApi = functionBlock(bridge, 'async function injectViaScriptingAPI');
  const fallback = functionBlock(bridge, 'async function injectViaFallback');
  const orchestrator = functionBlock(bridge, 'globalThis.injectMainWorldScripts = async function injectMainWorldScripts');
  const selected = `${injectScripts}\n${subscriptionsBridge}\n${scriptingApi}\n${fallback}\n${orchestrator}`;

  return {
    background,
    bridge,
    injectScripts,
    subscriptionsBridge,
    scriptingApi,
    fallback,
    orchestrator,
    selected
  };
}

function currentInjectScriptsFileMapping(entries) {
  const scripts = Array.isArray(entries)
    ? entries
        .map((entry) => String(entry || '').trim())
        .filter(Boolean)
    : [];

  return scripts
    .map((scriptName) => scriptName.startsWith('js/') ? scriptName : `js/${scriptName}.js`)
    .filter(Boolean);
}

test('background script injection trust audit is audit-only and source counted', () => {
  const doc = read(docPath);

  for (const marker of [
    'Status: audit-only',
    'Runtime behavior is unchanged',
    'This is not an implementation patch',
    'runtime background script injection trust fixtures: 8',
    'not completion proof for background script injection trust authority'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }

  const b = blocks();
  const expectedMetrics = {
    'background lines': lineCount(b.background),
    'background bytes': Buffer.byteLength(b.background),
    'bridge_injection lines': lineCount(b.bridge),
    'bridge_injection bytes': Buffer.byteLength(b.bridge),
    'injectScripts block lines': lineCount(b.injectScripts),
    'injectScripts block bytes': Buffer.byteLength(b.injectScripts),
    'subscriptions bridge block lines': lineCount(b.subscriptionsBridge),
    'subscriptions bridge block bytes': Buffer.byteLength(b.subscriptionsBridge),
    'injectViaScriptingAPI block lines': lineCount(b.scriptingApi),
    'injectViaScriptingAPI block bytes': Buffer.byteLength(b.scriptingApi),
    'injectViaFallback block lines': lineCount(b.fallback),
    'injectViaFallback block bytes': Buffer.byteLength(b.fallback),
    'injectMainWorldScripts block lines': lineCount(b.orchestrator),
    'injectMainWorldScripts block bytes': Buffer.byteLength(b.orchestrator),
    'selected injectScripts tokens': count(b.selected, /injectScripts/g),
    'selected request.scripts tokens': count(b.selected, /request\.scripts/g),
    'selected sender tab tokens': count(b.selected, /sender\?\.tab\?\.id/g),
    'selected sender frame tokens': count(b.selected, /sender\?\.frameId/g),
    'selected executeScript tokens': count(b.selected, /executeScript/g),
    'selected world MAIN tokens': count(b.selected, /world:\s*'MAIN'/g),
    'selected world ISOLATED tokens': count(b.selected, /world:\s*'ISOLATED'/g),
    'selected isTrustedUiSender tokens': count(b.selected, /isTrustedUiSender/g),
    'selected allowlist tokens': count(b.selected, /allowlist|allowedScripts|scriptAllowlist|allowedScript|SCRIPT_ALLOWLIST/g),
    'selected sender url tokens': count(b.selected, /sender\?\.tab\?\.url|sender\.tab\.url/g),
    'selected tabs.get tokens': count(b.selected, /tabs\.get/g),
    'selected tabs.query tokens': count(b.selected, /tabs\.query/g),
    'selected youtube host tokens': count(b.selected, /youtube\.com|youtubekids\.com/g),
    'selected sendResponse success tokens': count(b.selected, /sendResponse\(\{ success: true \}\)/g),
    'selected sendResponse failure tokens': count(b.selected, /sendResponse\(\{ success: false/g),
    'selected return true tokens': count(b.selected, /return true/g),
    'selected return false tokens': count(b.selected, /return false/g),
    'selected frameIds tokens': count(b.selected, /frameIds/g),
    'selected tabId tokens': count(b.selected, /tabId/g),
    'selected files tokens': count(b.selected, /files/g),
    'selected setTimeout tokens': count(b.selected, /setTimeout/g)
  };

  assert.ok(doc.includes(`sha256: \`${sha256(b.background)}\``));
  assert.ok(doc.includes(`sha256: \`${sha256(b.bridge)}\``));

  for (const [label, value] of Object.entries(expectedMetrics)) {
    assert.ok(doc.includes(`${label}: ${value}`), `doc missing metric ${label}: ${value}`);
  }
});

test('manifests carry scripting permission and bridge asks background to inject scripts', () => {
  const { scriptingApi, orchestrator } = blocks();

  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.ok(readJson(manifest).permissions.includes('scripting'), `${manifest} should declare scripting`);
  }

  assert.match(scriptingApi, /api\.runtime\.sendMessage\(\{\s*action: "injectScripts",\s*scripts: scripts/s);
  assert.match(scriptingApi, /api\.runtime\.lastError \|\| !response\?\.success/);
  assert.match(orchestrator, /const scriptsToInject = \['shared\/identity', 'filter_logic'\]/);
  assert.match(orchestrator, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(orchestrator, /scriptsToInject\.push\('injector'\)/);
  assert.match(orchestrator, /if \(!isFirefox && api\.scripting\?\.executeScript\)/);
  assert.match(orchestrator, /await injectViaScriptingAPI\(scriptsToInject\)/);
});

test('background injectScripts derives target from sender tab and frame with early failure paths', () => {
  const { injectScripts } = blocks();

  assert.match(injectScripts, /const tabId = Number\(sender\?\.tab\?\.id\);/);
  assert.match(injectScripts, /const frameId = Number\(sender\?\.frameId\);/);
  assert.match(injectScripts, /if \(!Number\.isFinite\(tabId\)\) \{\s*sendResponse\(\{ success: false, error: 'No sender tab available for script injection' \}\);\s*return false;/s);
  assert.match(injectScripts, /if \(!browserAPI\?\.scripting\?\.executeScript\) \{\s*sendResponse\(\{ success: false, error: 'Scripting API unavailable' \}\);\s*return false;/s);
  assert.match(injectScripts, /const target = Number\.isFinite\(frameId\)\s*\? \{ tabId, frameIds: \[frameId\] \}\s*: \{ tabId \};/);
});

test('background injectScripts normalizes caller scripts and treats empty files as success without execution', () => {
  const { injectScripts } = blocks();

  assert.match(injectScripts, /const scripts = Array\.isArray\(request\?\.scripts\)/);
  assert.match(injectScripts, /\.map\(\(entry\) => String\(entry \|\| ''\)\.trim\(\)\)/);
  assert.match(injectScripts, /\.map\(\(scriptName\) => scriptName\.startsWith\('js\/'\) \? scriptName : `js\/\$\{scriptName\}\.js`\)/);
  assert.match(injectScripts, /if \(!files\.length\) \{\s*sendResponse\(\{ success: true \}\);\s*return false;/s);
  assert.deepEqual(currentInjectScriptsFileMapping([' shared/identity ', 'js/filter_logic.js', '', null]), [
    'js/shared/identity.js',
    'js/filter_logic.js'
  ]);
});

test('background injectScripts executes MAIN world asynchronously without trust or allowlist gates', () => {
  const { injectScripts } = blocks();

  assert.match(injectScripts, /browserAPI\.scripting\.executeScript\(\{\s*target,\s*files,\s*world: 'MAIN'\s*\}\)/s);
  assert.match(injectScripts, /\.then\(\(\) => \{\s*sendResponse\(\{ success: true \}\);/s);
  assert.match(injectScripts, /\.catch\(\(error\) => \{\s*console\.warn\('FilterTube Background: injectScripts failed', error\);/s);
  assert.match(injectScripts, /return true;/);
  assert.doesNotMatch(injectScripts, /isTrustedUiSender|trustedUi|allowedScripts|scriptAllowlist|sender\.tab\.url|tabs\.get|tabs\.query|youtube\.com|youtubekids\.com/);
});

test('subscriptions bridge injection uses caller tab id with fixed isolated script list', () => {
  const { subscriptionsBridge } = blocks();

  assert.match(subscriptionsBridge, /const tabId = Number\(request\?\.tabId\);/);
  assert.match(subscriptionsBridge, /target: \{ tabId \}/);
  assert.match(subscriptionsBridge, /world: 'ISOLATED'/);

  for (const file of [
    'js/shared/identity.js',
    'js/content/dom_helpers.js',
    'js/content/dom_extractors.js',
    'js/content/dom_fallback.js',
    'js/content/bridge_injection.js',
    'js/content/bridge_settings.js'
  ]) {
    assert.ok(subscriptionsBridge.includes(`'${file}'`), `missing subscription bridge file ${file}`);
  }

  assert.doesNotMatch(subscriptionsBridge, /isTrustedUiSender|sender\?\.tab\?\.id|sender\?\.frameId|sender\.tab\.url|tabs\.get|tabs\.query|youtube\.com|youtubekids\.com|pendingSubscriptionImport/);
});

test('current script name mapping allows unclassified path shape before browser executeScript result', () => {
  const { injectScripts } = blocks();

  assert.match(injectScripts, /\.filter\(Boolean\);/);
  assert.deepEqual(currentInjectScriptsFileMapping(['../unexpected', 'content/bridge_settings']), [
    'js/../unexpected.js',
    'js/content/bridge_settings.js'
  ]);
  assert.doesNotMatch(injectScripts, /normalizePath|path\.normalize|URLPattern|backgroundScriptInjectionWebAccessibleResourceReason/);
});

test('product runtime has no shared background script injection authority symbols yet', () => {
  const productRuntime = `${read('js/background.js')}\n${read('js/content/bridge_injection.js')}`;

  for (const missingAuthority of [
    'backgroundScriptInjectionTrustContract',
    'backgroundInjectScriptsAllowedScriptReport',
    'backgroundInjectScriptsSenderClassReport',
    'backgroundInjectScriptsTargetScopeReport',
    'backgroundInjectScriptsWorldPolicy',
    'backgroundSubscriptionsBridgeInjectionPolicy',
    'backgroundScriptingPermissionOwnerReport',
    'backgroundScriptInjectionFixtureProvenance',
    'backgroundScriptInjectionMetricArtifact',
    'backgroundScriptInjectionWebAccessibleResourceReason'
  ]) {
    assert.equal(productRuntime.includes(missingAuthority), false, `${missingAuthority} should remain absent in current product runtime`);
  }
});
