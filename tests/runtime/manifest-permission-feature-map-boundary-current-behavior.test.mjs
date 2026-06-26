import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MANIFEST_PERMISSION_FEATURE_MAP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const startupPermissionNavigationDocs = [
  'docs/audit/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_MANIFEST_PERMISSION_AUTHORITY_AUDIT_2026-05-18.md',
  docPath,
  'docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_EXTERNAL_NAVIGATION_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_PROMPT_ONBOARDING_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_PROMPT_ONBOARDING_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_SEED_PAGE_GLOBAL_PATCH_TEARDOWN_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
];
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

const sourceFiles = [
  'js/background.js',
  'js/io_manager.js',
  'js/tab-view.js',
  'js/popup.js',
  'js/state_manager.js',
  'js/content/bridge_injection.js',
  'js/content/bridge_settings.js',
  'js/content_bridge.js',
  'js/settings_shared.js',
  'js/content/handle_resolver.js',
];

const fingerprintFiles = [
  ...manifestFiles,
  ...sourceFiles,
  'build.js',
];

const expectedPermissions = ['storage', 'activeTab', 'scripting', 'tabs', 'downloads'];
const expectedHostPermissions = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.youtubekids.com/*',
];
const expectedOptionalHostPermissions = [
  'http://*/*',
  'https://*/*',
];
const activeMatches = ['*://*.youtube.com/*', '*://*.youtubekids.com/*'];

const expectedFingerprints = new Map([
  ['manifest.json', [93, 2654, '95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b']],
  ['manifest.chrome.json', [93, 2654, '95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b']],
  ['manifest.firefox.json', [80, 2150, '8368c4b520a07d1e5d9647f6c141f06f8fbd24a92c8b053d722488859f201c32']],
  ['manifest.opera.json', [94, 2659, 'f9a3b4182521d8b1594d7975c327daf772e418e4869e8e3d33d286bfb25b486e']],
  ['js/background.js', [7305, 328748, '80170fd6e70156fd26a047cd97dc6463850849c9c40c71c44096cc3c26ab367a']],
  ['js/io_manager.js', [2119, 102123, 'd457bdcc4f7fc3acef401b48437fc707e2b9f2791e18ff4cafc1209f810bcc3c']],
  ['js/tab-view.js', [22700, 1081906, '5c088e40d3507cbdd0ad1fdf2a601f5e346fb87e527188192b86b9c598223f7f']],
  ['js/popup.js', [1841, 75587, 'e04d512726b38b012d3866b829570b632dd784419db014447b6645a7a6f7fd1d']],
  ['js/state_manager.js', [2491, 99780, '509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6']],
  ['js/content/bridge_injection.js', [152, 6043, 'dcb84ff6f373b24951f9c1488c502987a599d70a54d14ac5f6e14d38b5bf7d9c']],
  ['js/content/bridge_settings.js', [1473, 58402, 'bbee898990fd890385bcd723b2295611c20c23fee9642e8029489f756fbe73d2']],
  ['js/content_bridge.js', [13803, 610592, 'cc838f9f12fc6941bba04b7a0244a14ef60581461bcc24dbb8ba7a9bce8e287b']],
  ['js/settings_shared.js', [1196, 59725, '2d4458a87dce945bf560123e54534854c52fe1de20ac5dae3e3b019bf7a37311']],
  ['js/content/handle_resolver.js', [282, 9785, '67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff']],
  ['build.js', [740, 26978, 'c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04']],
]);

const permissionRegexes = {
  storageApi: /\b(?:browserAPI|runtimeAPI|browserAPI_BRIDGE|chrome|browser)\.storage\b|\bstorage\.local\b/g,
  storageLocalGet: /\bstorage\.local\.get\b/g,
  storageLocalSet: /\bstorage\.local\.set\b/g,
  storageOnChanged: /\bstorage\.onChanged\b/g,
  tabsApi: /\b(?:browserAPI|runtimeAPI|chrome|browser)\.tabs\b|\btabsApi\b/g,
  tabsQuery: /\btabs\.query\b|\btabsApi\.query\b/g,
  tabsSendMessage: /\btabs\.sendMessage\b|\btabsApi\.sendMessage\b/g,
  tabsCreate: /\btabs\.create\b|\btabsApi\.create\b/g,
  tabsUpdate: /\btabs\.update\b|\btabsApi\.update\b/g,
  scriptingExecute: /\bscripting\?\.executeScript\b|\bscripting\.executeScript\b/g,
  downloadsApi: /\b(?:browserAPI|runtimeAPI)\.downloads\b/g,
  downloadsDownload: /\bdownloads\.download\b/g,
  downloadsSearch: /\bdownloads\.search\b/g,
  downloadsErase: /\bdownloads\.erase\b/g,
  activeTab: /\bactiveTab\b/g,
};

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function lineCount(file) {
  const source = read(file);
  return source.split('\n').length - (source.endsWith('\n') ? 1 : 0);
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}

function contentScriptMatches(manifest) {
  return (manifest.content_scripts || []).flatMap((entry) => entry.matches || []);
}

function webAccessibleMatches(manifest) {
  return (manifest.web_accessible_resources || []).flatMap((entry) => entry.matches || []);
}

function runtimePermissionCounts() {
  const totals = Object.fromEntries(Object.keys(permissionRegexes).map((name) => [name, 0]));
  const perFileBroadTokens = new Map();
  const broad = /\b(?:browserAPI|runtimeAPI|browserAPI_BRIDGE|chrome|browser)\.(?:storage|tabs|scripting|downloads)\b|\bstorage\.local\b|\btabsApi\b|\bscripting\?\.executeScript\b|\bscripting\.executeScript\b|\bdownloads\.(?:download|search|erase)\b|\btabs\.(?:query|sendMessage|create|update)\b|\bactiveTab\b/g;

  for (const file of sourceFiles) {
    const source = read(file);
    const broadCount = count(source, broad);
    if (broadCount > 0) {
      perFileBroadTokens.set(file, broadCount);
    }
    for (const [name, regex] of Object.entries(permissionRegexes)) {
      totals[name] += count(source, regex);
    }
  }

  return { totals, perFileBroadTokens };
}

function trackedProductSource() {
  return execFileSync('git', ['ls-files', 'js', 'build.js', 'manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim().split('\n').filter(Boolean).map(read).join('\n');
}

test('manifest permission feature-map doc is audit-only and fingerprints are pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /Manifest permission feature-map source\/effect blocks: 8/);
  assert.match(doc, /Runtime manifest permission feature-map fixtures: 7/);

  for (const file of fingerprintFiles) {
    const [lines, byteCount, hash] = expectedFingerprints.get(file);
    assert.equal(lineCount(file), lines, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(String(byteCount)));
    assert.match(doc, new RegExp(hash));
  }
});

test('startup permission navigation and prompt docs carry the method proof gap blocker', () => {
  const gap = read(methodGapPath);

  for (const token of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5836',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5836',
    'runtime behavior changed: no',
  ]) {
    assert.ok(gap.includes(token), `method gap index missing token ${token}`);
  }

  for (const auditDoc of startupPermissionNavigationDocs) {
    const text = read(auditDoc);

    for (const token of [
      methodGapPath,
      'method semantic proof gap files covered: 69',
      'method semantic proof gap lexical callables covered: 5836',
      'files with complete per-callable semantic proof: 0',
      'lexical callables requiring semantic proof before behavior changes: 5836',
      'affected callable semantic proof: NO-GO',
      'runtime behavior changed: no',
      'JSON-first promotion',
      'optimization',
      'whitelist behavior changes',
    ]) {
      assert.ok(text.includes(token), `${auditDoc} missing blocker token ${token}`);
    }
  }
});

test('all manifests keep the current permission and host declaration map', () => {
  const doc = read(docPath);

  for (const file of manifestFiles) {
    const manifest = readJson(file);
    assert.deepEqual(manifest.permissions, expectedPermissions, `${file} permissions drifted`);
    assert.deepEqual(manifest.host_permissions, expectedHostPermissions, `${file} host permissions drifted`);
    assert.deepEqual(manifest.optional_host_permissions, expectedOptionalHostPermissions, `${file} optional pickup host permissions drifted`);
    assert.deepEqual([...new Set(contentScriptMatches(manifest))], activeMatches, `${file} content matches drifted`);
    assert.deepEqual([...new Set(webAccessibleMatches(manifest))], activeMatches, `${file} web resource matches drifted`);
  }

  const contentMatches = manifestFiles.map((file) => contentScriptMatches(readJson(file)).join('\n')).join('\n');
  const resourceMatches = manifestFiles.map((file) => webAccessibleMatches(readJson(file)).join('\n')).join('\n');
  assert.doesNotMatch(contentMatches, /youtube-nocookie\.com/);
  assert.doesNotMatch(resourceMatches, /youtube-nocookie\.com/);
  assert.match(doc, /`youtube-nocookie\.com` is host-permitted but no content script or web-accessible resource match covers it/);
});

test('runtime permission API consumers stay spread across current files', () => {
  const { perFileBroadTokens } = runtimePermissionCounts();

  assert.deepEqual([...perFileBroadTokens.keys()], sourceFiles);
  assert.deepEqual(Object.fromEntries(perFileBroadTokens), {
    'js/background.js': 73,
    'js/io_manager.js': 8,
    'js/tab-view.js': 8,
    'js/popup.js': 38,
    'js/state_manager.js': 13,
    'js/content/bridge_injection.js': 1,
    'js/content/bridge_settings.js': 1,
    'js/content_bridge.js': 9,
    'js/settings_shared.js': 1,
    'js/content/handle_resolver.js': 1,
  });

  assert.equal([...perFileBroadTokens.values()].reduce((sum, value) => sum + value, 0), 153);
  assert.match(read(docPath), /Runtime permission consumer source files: 10/);
  assert.match(read(docPath), /Broad runtime permission API tokens in those files: 153/);
});

test('storage tabs scripting and downloads callsite counts are pinned', () => {
  const { totals } = runtimePermissionCounts();

  assert.deepEqual(totals, {
    storageApi: 60,
    storageLocalGet: 19,
    storageLocalSet: 31,
    storageOnChanged: 4,
    tabsApi: 65,
    tabsQuery: 17,
    tabsSendMessage: 5,
    tabsCreate: 11,
    tabsUpdate: 1,
    scriptingExecute: 9,
    downloadsApi: 17,
    downloadsDownload: 8,
    downloadsSearch: 3,
    downloadsErase: 3,
    activeTab: 0,
  });

  const doc = read(docPath);
  for (const marker of [
    'Runtime `storage` API tokens: 60',
    'Runtime `tabs` API tokens: 65',
    'Runtime `scripting.executeScript` tokens: 9',
    'Runtime `downloads` API tokens: 17',
    'Product runtime `activeTab` tokens in scanned source files: 0',
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }
});

test('activeTab is declared in manifests but not represented by product runtime tokens', () => {
  const manifestSource = manifestFiles.map(read).join('\n');
  const runtimeSource = sourceFiles.map(read).join('\n');

  assert.equal(count(manifestSource, /\bactiveTab\b/g), 4);
  assert.equal(count(runtimeSource, /\bactiveTab\b/g), 0);
  assert.match(read(docPath), /`activeTab` appears in all four manifests and has 0 product runtime callsite tokens/);
});

test('build currently repairs script order but does not validate permission feature ownership', () => {
  const build = read('build.js');

  assert.equal(count(build, /\bensureCollabDialogScriptOrder\b/g), 2);
  assert.equal(count(build, /\bvalidateManifestPermissions\b/g), 0);
  assert.match(build, /function ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);

  for (const missingGuard of [
    'validateManifestPermissions',
    'validateHostPermissions',
    'validateWebAccessibleResources',
    'validateContentScriptWorlds',
    'manifestPermissionFeatureOwnerReport',
  ]) {
    assert.equal(build.includes(missingGuard), false, `${missingGuard} is not implemented in build.js today`);
  }
});

test('future manifest permission feature-map authority symbols are still absent', () => {
  const productSource = trackedProductSource();
  const doc = read(docPath);
  const futureSymbols = [
    'manifestPermissionFeatureMapContract',
    'manifestPermissionFeatureOwnerReport',
    'manifestStoragePermissionOwnerReport',
    'manifestTabsPermissionOwnerReport',
    'manifestScriptingPermissionOwnerReport',
    'manifestDownloadsPermissionOwnerReport',
    'manifestActiveTabPermissionUseReport',
    'manifestHostPermissionScopeReport',
    'manifestPermissionTrustedSenderMatrix',
    'manifestPermissionBuildValidationReport',
    'manifestPermissionFixtureProvenance',
    'manifestPermissionMetricArtifact',
  ];

  for (const symbol of futureSymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} unexpectedly exists in product source`);
    assert.ok(doc.includes(symbol), `doc missing future symbol ${symbol}`);
  }

  for (const riskMarker of [
    'Reliability: permission declarations are shared by prompt injection, backup',
    'False-hide/leak: host and scripting drift can create surfaces',
    'Performance: tabs, scripting, storage, and downloads work can be triggered',
    'Code burden: browser manifests, build packaging, background handlers',
  ]) {
    assert.ok(doc.includes(riskMarker), `doc missing risk marker ${riskMarker}`);
  }
});
