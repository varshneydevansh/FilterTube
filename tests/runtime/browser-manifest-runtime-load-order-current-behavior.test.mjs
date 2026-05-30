import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BROWSER_MANIFEST_RUNTIME_LOAD_ORDER_CURRENT_BEHAVIOR_2026-05-21.md';
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

const helperStack = [
  'js/shared/identity.js',
  'js/content/menu.js',
  'js/content/dom_helpers.js',
  'js/content/dom_extractors.js',
  'js/content/dom_fallback.js',
  'js/content/block_channel.js',
  'js/content/bridge_injection.js',
  'js/content/bridge_settings.js',
  'js/content/handle_resolver.js',
  'js/content/collab_dialog.js',
  'js/content/release_notes_prompt.js',
  'js/content/first_run_prompt.js',
  'js/content_bridge.js',
];

const commonMatches = [
  '*://*.youtube.com/*',
  '*://*.youtubekids.com/*',
];

const commonPermissions = [
  'storage',
  'activeTab',
  'scripting',
  'tabs',
  'downloads',
];

const commonHostPermissions = [
  '*://*.youtube.com/*',
  '*://*.youtube-nocookie.com/*',
  '*://*.youtubekids.com/*',
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function lineCount(file) {
  return (read(file).match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function contentScriptRefs(manifest) {
  return (manifest.content_scripts || []).flatMap((entry) => entry.js || []);
}

function contentScriptMatches(manifest) {
  return (manifest.content_scripts || []).flatMap((entry) => entry.matches || []);
}

function webAccessibleResources(manifest) {
  return (manifest.web_accessible_resources || []).flatMap((entry) => entry.resources || []);
}

function webAccessibleMatches(manifest) {
  return (manifest.web_accessible_resources || []).flatMap((entry) => entry.matches || []);
}

function trackedFiles() {
  return new Set(
    execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
  );
}

test('browser manifest runtime load-order doc is audit-only and manifest fingerprints are pinned', () => {
  const doc = read(docPath);
  const expected = [
    ['manifest.json', 87, 2470, '96eb5e5c8733ecdfa9d3eb447d51a3bfc2c4743a80b1fde1f12d71bd46d1c8e4'],
    ['manifest.chrome.json', 87, 2470, '96eb5e5c8733ecdfa9d3eb447d51a3bfc2c4743a80b1fde1f12d71bd46d1c8e4'],
    ['manifest.firefox.json', 74, 1994, '5d7175c23dbce4f9e86b0db0f34b1ae61bb465a9725ff37fc7069a45d4ceac5c'],
    ['manifest.opera.json', 88, 2475, 'f76d4a48b51fc5da65492347ce3f7cb31ebff057afd2185573176991e7d1d4b7'],
  ];

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /manifest change, package release gate, browser parity\s+claim, or JSON-first promotion/);
  assert.match(doc, /4 files, 336 newline counts, and 9,409 bytes/);

  for (const [file, lines, byteCount, hash] of expected) {
    assert.equal(lineCount(file), lines, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
  }

  assert.equal(read('manifest.json'), read('manifest.chrome.json'));
  assert.match(doc, /`manifest\.json` and `manifest\.chrome\.json` are byte-identical today/);
});

test('common manifest permissions hosts action icons and active matches stay aligned', () => {
  for (const file of manifestFiles) {
    const manifest = readJson(file);

    assert.equal(manifest.manifest_version, 3, `${file} MV3 drifted`);
    assert.equal(manifest.name, 'FilterTube', `${file} name drifted`);
    assert.equal(manifest.version, '3.3.1', `${file} version drifted`);
    assert.deepEqual(manifest.permissions, commonPermissions, `${file} permissions drifted`);
    assert.deepEqual(manifest.host_permissions, commonHostPermissions, `${file} host permissions drifted`);
    assert.deepEqual([...new Set(contentScriptMatches(manifest))], commonMatches, `${file} content matches drifted`);
    assert.deepEqual([...new Set(webAccessibleMatches(manifest))], commonMatches, `${file} WAR matches drifted`);
    assert.deepEqual(manifest.action.default_icon, {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${file} action icons drifted`);
    assert.deepEqual(manifest.icons, {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${file} extension icons drifted`);
  }

  const allContentMatches = manifestFiles.map((file) => contentScriptMatches(readJson(file)).join('\n')).join('\n');
  const allResourceMatches = manifestFiles.map((file) => webAccessibleMatches(readJson(file)).join('\n')).join('\n');
  assert.doesNotMatch(allContentMatches, /youtube-nocookie\.com/);
  assert.doesNotMatch(allResourceMatches, /youtube-nocookie\.com/);
  assert.match(read(docPath), /`youtube-nocookie\.com` is host-permitted but not content-script or\s+web-resource matched/);
});

test('default chrome firefox and opera runtime load order remains browser-specific', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json']) {
    const manifest = readJson(file);
    assert.equal(manifest.background.service_worker, 'js/background.js');
    assert.equal(manifest.content_scripts.length, 2);
    assert.deepEqual(manifest.content_scripts[0], {
      matches: commonMatches,
      js: ['js/seed.js'],
      run_at: 'document_start',
      world: 'MAIN',
    }, `${file} MAIN seed entry drifted`);
    assert.deepEqual(manifest.content_scripts[1].matches, commonMatches);
    assert.deepEqual(manifest.content_scripts[1].js, helperStack);
    assert.equal(manifest.content_scripts[1].run_at, 'document_start');
    assert.equal(manifest.content_scripts[1].world, 'ISOLATED');
  }

  const firefox = readJson('manifest.firefox.json');
  assert.deepEqual(firefox.background.scripts, ['js/shared/identity.js', 'js/background.js']);
  assert.equal(firefox.content_scripts.length, 1);
  assert.deepEqual(firefox.content_scripts[0].js, helperStack);
  assert.equal(firefox.content_scripts[0].run_at, 'document_start');
  assert.equal(firefox.content_scripts[0].world, undefined);
  assert.equal(firefox.browser_specific_settings.gecko.id, 'filtertube@devanshvarshney.com');
  assert.deepEqual(firefox.browser_specific_settings.gecko.data_collection_permissions.required, ['none']);

  const opera = readJson('manifest.opera.json');
  assert.equal(opera.background.service_worker, 'js/background.js');
  assert.equal(opera.content_scripts.length, 2);
  assert.deepEqual(opera.content_scripts[0].js, ['js/seed.js']);
  assert.equal(opera.content_scripts[0].world, undefined);
  assert.deepEqual(opera.content_scripts[1].js, helperStack);
  assert.equal(opera.content_scripts[1].world, undefined);
  assert.deepEqual(opera.developer, { name: 'Devansh Varshney', url: 'https://filtertube.in' });
});

test('manifest content script references are tracked and no content CSS is declared', () => {
  const tracked = trackedFiles();
  const refs = [];

  for (const file of manifestFiles) {
    const manifest = readJson(file);
    for (const entry of manifest.content_scripts || []) {
      refs.push(...(entry.js || []));
      assert.deepEqual(entry.css || [], [], `${file} should not declare content script CSS`);
    }
    for (const resource of webAccessibleResources(manifest)) {
      assert.ok(tracked.has(resource), `${file} web resource ${resource} is not tracked`);
    }
  }

  assert.equal(refs.length, 55);
  assert.equal(new Set(refs).size, 14);
  for (const ref of refs) {
    assert.ok(tracked.has(ref), `manifest content script ${ref} is not tracked`);
  }

  assert.match(read(docPath), /55 content-script file references across all manifests/);
  assert.match(read(docPath), /14 unique content-script files/);
  assert.match(read(docPath), /No manifest declares `content_scripts\.css`/);
});

test('web accessible resources differ only by Opera file icon omission today', () => {
  const expectedWithIcon = [
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/shared/identity.js',
    'icons/file.svg',
  ];
  const expectedOpera = [
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/shared/identity.js',
  ];

  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json']) {
    assert.deepEqual(webAccessibleResources(readJson(file)), expectedWithIcon, `${file} WAR resources drifted`);
  }
  assert.deepEqual(webAccessibleResources(readJson('manifest.opera.json')), expectedOpera);
});

test('firefox fallback injection and build manifest mutation boundaries remain current behavior', () => {
  const bridgeInjection = read('js/content/bridge_injection.js');
  const build = read('build.js');

  assert.match(bridgeInjection, /const scriptsToInject = \['shared\/identity', 'filter_logic'\]/);
  assert.match(bridgeInjection, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(bridgeInjection, /scriptsToInject\.push\('injector'\)/);
  assert.match(bridgeInjection, /await injectViaFallback\(scriptsToInject\)/);

  assert.match(build, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(build, /ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(build, /const collabDialogPath = 'js\/content\/collab_dialog\.js'/);
  assert.match(build, /const contentBridgePath = 'js\/content_bridge\.js'/);

  for (const missing of [
    'validateManifestPermissions',
    'validateHostPermissions',
    'validateWebAccessibleResources',
    'validateContentScriptWorlds',
    'browserManifestRuntimeLoadOrderAuthority',
    'browserManifestBuildValidationReport',
  ]) {
    assert.equal(build.includes(missing), false, `${missing} should not exist in build source yet`);
  }
});

test('browser manifest runtime load-order authority symbols are not implemented in product source', () => {
  const doc = read(docPath);
  const productSource = [
    ...manifestFiles,
    'build.js',
    'js/content/bridge_injection.js',
    'package.json',
  ].map(read).join('\n');

  for (const symbol of [
    'browserManifestRuntimeLoadOrderAuthority',
    'browserManifestPackageParityReport',
    'browserManifestContentScriptWorldReport',
    'browserManifestSeedReadyReport',
    'browserManifestHostScopeClassification',
    'browserManifestWebAccessibleResourceDecision',
    'browserManifestPermissionFeatureMap',
    'browserManifestBuildValidationReport',
    'browserManifestPackageQuarantineReport',
    'browserManifestJsonFirstStartupGate',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(productSource.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }

  assert.match(doc, /This register does not close browser-manifest tracked-file obligations/);
  assert.match(doc, /startup readiness reports, host classification, resource reasons/);
});
