import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_MANIFEST_PERMISSION_CURRENT_BEHAVIOR_2026-05-19.md';
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';
const registerPath = 'docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md';
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function webAccessibleResources(manifestFile) {
  return (readJson(manifestFile).web_accessible_resources || []).flatMap((entry) => entry.resources || []);
}

function webAccessibleMatches(manifestFile) {
  return (readJson(manifestFile).web_accessible_resources || []).flatMap((entry) => entry.matches || []);
}

function contentScriptMatches(manifestFile) {
  return (readJson(manifestFile).content_scripts || []).flatMap((entry) => entry.matches || []);
}

test('P0 manifest permission doc lists fixture family and blocked verdict', () => {
  const doc = read(docPath);
  const readiness = read(readinessPath);
  const register = read(registerPath);

  for (const fixture of [
    'chrome_manifest_main_world_seed_ready',
    'firefox_fallback_injection_reports_seed_ready',
    'opera_world_model_is_proven_or_not_claimed',
    'youtube_nocookie_host_scope_is_classified',
    'web_accessible_resources_are_allowlisted',
    'build_rejects_manifest_permission_drift',
    'permissions_map_to_trusted_sender_features'
  ]) {
    assert.ok(doc.includes(fixture), `doc missing fixture ${fixture}`);
    assert.ok(readiness.includes(fixture), `readiness gate missing fixture ${fixture}`);
    assert.ok(register.includes(fixture), `P0 register missing fixture ${fixture}`);
  }

  for (const marker of [
    'Status: current-behavior proof',
    'This is not an implementation patch',
    'manifestAuthority',
    'Browser manifests decide the first runtime owner',
    'Blocked now'
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }
});

test('chrome_manifest_main_world_seed_ready is source-local satisfied for default and chrome packages', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json']) {
    const manifest = readJson(file);
    const [mainEntry, isolatedEntry] = manifest.content_scripts;

    assert.equal(mainEntry.world, 'MAIN', `${file} first entry should be MAIN`);
    assert.equal(mainEntry.run_at, 'document_start', `${file} seed should run at document_start`);
    assert.deepEqual(mainEntry.matches, ['*://*.youtube.com/*', '*://*.youtubekids.com/*']);
    assert.deepEqual(mainEntry.js, ['js/seed.js']);

    assert.equal(isolatedEntry.world, 'ISOLATED', `${file} helper stack should be isolated`);
    assert.equal(isolatedEntry.run_at, 'document_start');
    assert.ok(isolatedEntry.js.indexOf('js/content/bridge_injection.js') < isolatedEntry.js.indexOf('js/content_bridge.js'));
    assert.ok(isolatedEntry.js.indexOf('js/content/collab_dialog.js') < isolatedEntry.js.indexOf('js/content_bridge.js'));
  }
});

test('firefox_fallback_injection_reports_seed_ready is not satisfied today', () => {
  const manifest = readJson('manifest.firefox.json');
  const bridgeInjection = read('js/content/bridge_injection.js');

  assert.equal(manifest.content_scripts.length, 1);
  assert.equal(manifest.content_scripts[0].world, undefined);
  assert.ok(manifest.content_scripts[0].js.includes('js/content/bridge_injection.js'));
  assert.ok(manifest.content_scripts[0].js.includes('js/content_bridge.js'));
  assert.match(bridgeInjection, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(bridgeInjection, /injectViaFallback\(scriptsToInject\)/);
  assert.doesNotMatch(`${manifest.content_scripts[0].js.join('\n')}\n${bridgeInjection}`, /seedReady|fallbackInjectionReady|manifestAuthority|startupReport/);
});

test('opera_world_model_is_proven_or_not_claimed is not satisfied today', () => {
  const manifest = readJson('manifest.opera.json');

  assert.equal(manifest.content_scripts.length, 2);
  for (const entry of manifest.content_scripts) {
    assert.equal(entry.world, undefined, 'Opera manifest currently has no explicit world declaration');
    assert.equal(entry.run_at, 'document_start');
  }
  assert.equal(manifest.developer?.url, 'https://filtertube.in');
});

test('youtube_nocookie_host_scope_is_classified is not satisfied today', () => {
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    const runtimeMatches = contentScriptMatches(file).join('\n');
    const resourceMatches = webAccessibleMatches(file).join('\n');

    assert.ok(manifest.host_permissions.includes('*://*.youtube-nocookie.com/*'), `${file} host-permits youtube-nocookie`);
    assert.doesNotMatch(runtimeMatches, /youtube-nocookie\.com/);
    assert.doesNotMatch(resourceMatches, /youtube-nocookie\.com/);
  }

  const allManifestText = manifestFiles.map(read).join('\n');
  assert.doesNotMatch(allManifestText, /hostScopeClass|activeRuntimeHost|resourceOnlyHost|reservedHost/);
});

test('web_accessible_resources_are_allowlisted is only source-local today', () => {
  const runtimeResources = [
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/shared/identity.js',
  ];

  for (const file of manifestFiles) {
    const resources = webAccessibleResources(file);
    for (const resource of runtimeResources) {
      assert.ok(resources.includes(resource), `${file} missing web-accessible runtime resource ${resource}`);
    }
    assert.deepEqual([...new Set(webAccessibleMatches(file))], ['*://*.youtube.com/*', '*://*.youtubekids.com/*']);
  }

  assert.equal(webAccessibleResources('manifest.opera.json').includes('icons/file.svg'), false);
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json']) {
    assert.equal(webAccessibleResources(file).includes('icons/file.svg'), true, `${file} exposes icons/file.svg today`);
  }

  const repoText = [
    read('manifest.json'),
    read('manifest.chrome.json'),
    read('manifest.firefox.json'),
    read('manifest.opera.json'),
    read('build.js'),
  ].join('\n');
  assert.doesNotMatch(repoText, /webAccessibleResourceReason|resourceAllowlist|manifestAuthority/);
});

test('build_rejects_manifest_permission_drift is not satisfied today', () => {
  const build = read('build.js');

  assert.match(build, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(build, /function ensureCollabDialogScriptOrder\(manifestJSON\)/);

  for (const missingGuard of [
    'validateManifestPermissions',
    'validateHostPermissions',
    'validateWebAccessibleResources',
    'validateContentScriptWorlds',
    'manifestAuthorityReport',
    'buildValidationResult'
  ]) {
    assert.equal(build.includes(missingGuard), false, `${missingGuard} is not implemented today`);
  }
});

test('permissions_map_to_trusted_sender_features is not satisfied today', () => {
  const expectedPermissions = ['storage', 'activeTab', 'scripting', 'tabs', 'downloads'];
  const source = [
    ...manifestFiles.map(read),
    read('docs/audit/FILTERTUBE_MANIFEST_PERMISSION_AUTHORITY_AUDIT_2026-05-18.md'),
    read('docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md'),
  ].join('\n');

  for (const file of manifestFiles) {
    assert.deepEqual(readJson(file).permissions, expectedPermissions, `${file} permission set drifted`);
  }

  assert.doesNotMatch(source, /permissionFeatureOwner|trustedSenderClass.*scripting|trustedSenderClass.*tabs|trustedSenderClass.*downloads|manifestAuthority\(/s);
});
