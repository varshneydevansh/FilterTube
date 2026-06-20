import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function manifestCssFiles(file) {
  return (readJson(file).content_scripts || []).flatMap(script => script.css || []);
}

test('release package parity audit documents package roots and future gate', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'Current Build Package Model',
    'Package Surface Matrix',
    'COMMON_DIRS = js, css, html, icons, data, assets',
    'COMMON_FILES = README.md, CHANGELOG.md, LICENSE',
    'Future token: `releasePackageParity`',
    'release_package_parity_build_common_dirs_are_explicit',
    'release_package_parity_raw_captures_never_enter_package_contents'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('build script copies whole common directories and top-level common files', () => {
  const build = read('build.js');

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\]/);
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);
  assert.match(build, /fs\.copySync\(file, path\.join\(targetDir, file\), \{ filter: filterFunc \}\)/);

  for (const dir of ['js', 'css', 'html', 'icons', 'data', 'assets']) {
    assert.ok(fs.existsSync(path.join(repoRoot, dir)), `${dir} should exist as a package root`);
  }
});

test('managed delivery reference provider stays outside browser release package roots', () => {
  const build = read('build.js');
  const packageJson = readJson('package.json');

  assert.ok(fs.existsSync(path.join(repoRoot, 'scripts/managed-delivery-provider.mjs')));
  assert.match(packageJson.scripts?.['managed:provider'] || '', /scripts\/managed-delivery-provider\.mjs/);
  assert.doesNotMatch(build, /const COMMON_DIRS = \[[^\]]*'scripts'/);
  assert.doesNotMatch(build, /const COMMON_FILES = \[[^\]]*managed-delivery-provider\.mjs/);
  assert.match(read(auditDocPath), /Managed delivery reference provider stays outside browser ZIP roots/);
});

test('quarantined YouTube CSS is packaged by directory copy but not manifest loaded', () => {
  const build = read('build.js');
  assert.match(build, /'css'/);

  for (const file of ['css/filter.css', 'css/content.css', 'css/layout.css']) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} exists and is copied with css directory`);
  }
  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(manifestCssFiles(manifest), [], `${manifest} should not content-script-load CSS`);
  }

  assert.match(read('css/filter.css'), /display:\s*none\s*!important/);
  assert.match(read(auditDocPath), /Quarantined CSS still ships/);
});

test('browser package manifest is selected per target and only collaborator order is repaired', () => {
  const build = read('build.js');

  assert.match(build, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(build, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\), manifestJSON/);
  assert.match(build, /ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(build, /const collabDialogPath = 'js\/content\/collab_dialog\.js'/);
  assert.match(build, /const contentBridgePath = 'js\/content_bridge\.js'/);
  assert.doesNotMatch(build, /\breleasePackageParity\b/);
  assert.doesNotMatch(build, /\bpackageManifest\b/);
});

test('build currently regenerates UI shells and mutates README badges before packaging', () => {
  const build = read('build.js');

  assert.match(build, /execSync\('node scripts\/build-extension-ui\.mjs'/);
  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
  assert.match(build, /README\.md badges updated successfully/);
  assert.match(read(auditDocPath), /Build mutates tracked source before packaging/);
});

test('zip packaging has only junk-file ignores and no committed package content manifest', () => {
  const build = read('build.js');

  assert.match(build, /archive\.glob\('\*\*\/\*'/);
  for (const ignored of ['**/.DS_Store', '**/__MACOSX', '**/._*', '**/Thumbs.db']) {
    assert.ok(build.includes(ignored), `missing junk ignore ${ignored}`);
  }

  for (const absent of [
    'release-package-manifest.json',
    'dist/package-manifest.json',
    'release-artifacts/package-manifest.json',
    'docs/audit/FILTERTUBE_RELEASE_PACKAGE_MANIFEST.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absent)), false, `${absent} is not committed today`);
  }
});

test('GitHub release is public before asset upload proof in the current script', () => {
  const build = read('build.js');
  const createIndex = build.indexOf('const release = await createGitHubRelease');
  const uploadIndex = build.indexOf('for (const assetPath of releaseAssetPaths)');

  assert.notEqual(createIndex, -1);
  assert.notEqual(uploadIndex, -1);
  assert.ok(createIndex < uploadIndex, 'release is created before asset upload loop');
  assert.match(build, /draft:\s*false/);
  assert.match(build, /prerelease:\s*false/);
  assert.match(build, /Non-interactive terminal detected; skipping release prompt/);
  assert.match(read(auditDocPath), /GitHub release publishing is public before upload proof/);
});

test('mobile artifact staging has naming and checksum mechanics but no public claim gate', () => {
  const build = read('build.js');

  assert.match(build, /MOBILE_ARTIFACT_FILE_RE = \/\^FilterTube-mobile-tablet-v/);
  assert.match(build, /selectLatestMobileArtifacts\(matchedSourceFiles\)/);
  assert.match(build, /sha256File\(targetPath\)/);
  assert.match(build, /dist', 'mobile'/);
  assert.doesNotMatch(build, /\bpublicClaimManifest\b/);
  assert.doesNotMatch(build, /\breleaseClaimIds\b/);
  assert.match(read(auditDocPath), /Android artifact staging is deterministic but optional/);
});
