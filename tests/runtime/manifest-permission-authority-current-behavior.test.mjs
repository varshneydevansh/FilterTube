import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
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

function contentScriptJs(manifestFile) {
  return (readJson(manifestFile).content_scripts || []).map((entry) => entry.js || []);
}

function contentScriptMatches(manifestFile) {
  return (readJson(manifestFile).content_scripts || []).flatMap((entry) => entry.matches || []);
}

function webAccessibleResources(manifestFile) {
  return (readJson(manifestFile).web_accessible_resources || []).flatMap((entry) => entry.resources || []);
}

function webAccessibleMatches(manifestFile) {
  return (readJson(manifestFile).web_accessible_resources || []).flatMap((entry) => entry.matches || []);
}

test('manifest permission audit documents browser package authority and future gates', () => {
  const doc = read('docs/audit/FILTERTUBE_MANIFEST_PERMISSION_AUTHORITY_AUDIT_2026-05-18.md');

  for (const marker of [
    'Default/Chrome manifest',
    'Firefox manifest',
    'Opera manifest',
    'Build manifest mutation',
    'Host/content mismatch',
    'Web-accessible resource parity',
    'Manifest/permission authority is mapped but not implementation-ready',
  ]) {
    assert.ok(doc.includes(marker), `missing manifest audit marker ${marker}`);
  }

  for (const gate of [
    'Browser-package parity fixture',
    'Host scope classification',
    'Web-accessible resource allowlist',
    'Manifest build validation',
    'Browser-specific seed/injector readiness proof',
    'Permission-to-feature matrix',
  ]) {
    assert.ok(doc.includes(gate), `missing manifest future gate ${gate}`);
  }
});

test('all browser manifests share the current core permission and host permission set', () => {
  const expectedPermissions = ['storage', 'activeTab', 'scripting', 'tabs', 'downloads'];
  const expectedHosts = [
    '*://*.youtube.com/*',
    '*://*.youtube-nocookie.com/*',
    '*://*.youtubekids.com/*',
  ];

  for (const file of manifestFiles) {
    const manifest = readJson(file);
    assert.deepEqual(manifest.permissions, expectedPermissions, `${file} permissions drifted`);
    assert.deepEqual(manifest.host_permissions, expectedHosts, `${file} host permissions drifted`);
    assert.equal(manifest.manifest_version, 3, `${file} should remain MV3`);
    assert.equal(manifest.version, '3.3.2', `${file} version should match current extension baseline`);
  }
});

test('default and chrome manifests currently use MAIN-world seed plus isolated helper stack', () => {
  for (const file of ['manifest.json', 'manifest.chrome.json']) {
    const manifest = readJson(file);
    const [mainEntry, isolatedEntry] = manifest.content_scripts;

    assert.equal(mainEntry.world, 'MAIN', `${file} first entry should be MAIN`);
    assert.equal(mainEntry.run_at, 'document_start');
    assert.deepEqual(mainEntry.js, ['js/seed.js']);

    assert.equal(isolatedEntry.world, 'ISOLATED', `${file} second entry should be ISOLATED`);
    assert.equal(isolatedEntry.run_at, 'document_start');
    assert.ok(isolatedEntry.js.indexOf('js/content/bridge_injection.js') < isolatedEntry.js.indexOf('js/content_bridge.js'));
    assert.ok(isolatedEntry.js.indexOf('js/content/collab_dialog.js') < isolatedEntry.js.indexOf('js/content_bridge.js'));
    assert.ok(isolatedEntry.js.includes('js/content/release_notes_prompt.js'));
    assert.ok(isolatedEntry.js.includes('js/content/first_run_prompt.js'));
  }
});

test('firefox manifest currently relies on fallback page-script injection rather than manifest MAIN world', () => {
  const manifest = readJson('manifest.firefox.json');
  assert.deepEqual(manifest.background.scripts, ['js/shared/identity.js', 'js/background.js']);
  assert.equal(manifest.content_scripts.length, 1);
  assert.equal(manifest.content_scripts[0].world, undefined);
  assert.ok(manifest.content_scripts[0].js.includes('js/content/bridge_injection.js'));
  assert.ok(manifest.content_scripts[0].js.includes('js/content_bridge.js'));

  const bridgeInjection = read('js/content/bridge_injection.js');
  assert.match(bridgeInjection, /const scriptsToInject = \['shared\/identity', 'filter_logic'\]/);
  assert.match(bridgeInjection, /if \(isFirefox\) scriptsToInject\.push\('seed'\)/);
  assert.match(bridgeInjection, /scriptsToInject\.push\('injector'\)/);
  assert.match(bridgeInjection, /injectViaFallback\(scriptsToInject\)/);
});

test('opera manifest currently omits explicit world declarations and differs in web-accessible icon resource', () => {
  const manifest = readJson('manifest.opera.json');
  assert.equal(manifest.developer?.url, 'https://filtertube.in');
  assert.equal(manifest.content_scripts.length, 2);
  for (const entry of manifest.content_scripts) {
    assert.equal(entry.world, undefined, 'Opera manifest currently has no explicit content-script world');
    assert.equal(entry.run_at, 'document_start');
  }

  assert.equal(webAccessibleResources('manifest.opera.json').includes('icons/file.svg'), false);
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json']) {
    assert.equal(webAccessibleResources(file).includes('icons/file.svg'), true, `${file} exposes icons/file.svg today`);
  }
});

test('youtube-nocookie is host-permitted but not a content-script or web-accessible match today', () => {
  for (const file of manifestFiles) {
    const manifest = readJson(file);
    assert.ok(manifest.host_permissions.includes('*://*.youtube-nocookie.com/*'), `${file} should host-permit youtube-nocookie`);

    const runtimeMatches = contentScriptMatches(file).join('\n');
    const resourceMatches = webAccessibleMatches(file).join('\n');
    assert.doesNotMatch(runtimeMatches, /youtube-nocookie\.com/, `${file} content scripts should not currently match youtube-nocookie`);
    assert.doesNotMatch(resourceMatches, /youtube-nocookie\.com/, `${file} web resources should not currently match youtube-nocookie`);
  }
});

test('web-accessible resources currently expose the main page runtime files to YouTube and Kids pages', () => {
  const expectedRuntimeResources = [
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/shared/identity.js',
  ];

  for (const file of manifestFiles) {
    const resources = webAccessibleResources(file);
    for (const resource of expectedRuntimeResources) {
      assert.ok(resources.includes(resource), `${file} missing ${resource}`);
    }
    assert.deepEqual(
      [...new Set(webAccessibleMatches(file))],
      ['*://*.youtube.com/*', '*://*.youtubekids.com/*'],
      `${file} web-accessible matches drifted`
    );
  }
});

test('build script currently repairs only collaborator-before-bridge order during manifest copy', () => {
  const build = read('build.js');
  assert.match(build, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(build, /function ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build, /const collabDialogPath = 'js\/content\/collab_dialog\.js'/);
  assert.match(build, /const contentBridgePath = 'js\/content_bridge\.js'/);

  for (const absentGuard of [
    'validateManifestPermissions',
    'validateHostPermissions',
    'validateWebAccessibleResources',
    'validateContentScriptWorlds',
    'manifestAuthorityReport',
  ]) {
    assert.equal(build.includes(absentGuard), false, `${absentGuard} is not implemented today`);
  }
});

test('manifest scripts are tracked source files and no CSS content scripts are declared', () => {
  const tracked = new Set(
    execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean)
  );

  for (const file of manifestFiles) {
    const manifest = readJson(file);
    for (const scripts of contentScriptJs(file)) {
      for (const script of scripts) {
        assert.ok(tracked.has(script), `${file} references untracked script ${script}`);
      }
    }
    for (const entry of manifest.content_scripts || []) {
      assert.deepEqual(entry.css || [], [], `${file} should not declare content CSS`);
    }
  }
});
