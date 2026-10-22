import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceRows = [
  ['build.js', 861, 33225, 'a198cc1d0bf98e410deb8f66ced0e56a046bbf987a0a5b878e1278577622fb2e'],
  ['package.json', 86, 4580, 'c9cb2c3c4fea302fa3946f462dbfbb474381a78946ca59adb653814d06a4de51'],
  ['README.md', 456, 28669, 'db3a973e936abd66a84ab7888e5f466fe7b0c1274f5b58aa999c4ea6b12fdbfd'],
  ['CHANGELOG.md', 938, 75511, 'e57906dca95911874ef251aa45d8c3a76df00df576b36277d9c0e9b9654c3036'],
  ['manifest.json', 160, 5545, 'b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9'],
  ['manifest.chrome.json', 160, 5545, 'b5229834ae6c291dbc4ad69b212c5ef086d8214b199678a0c09a46ae0eaa80c9'],
  ['manifest.firefox.json', 134, 4431, 'f5ae06e03e855cd3c8c4a88e4fcc832c70341d56eb2edab33211d380a6b5c2fb'],
  ['manifest.opera.json', 168, 5734, '5f5809782261a21e8d8a6231178011c25a9de47fd8dfc8f4af834009a9084a07'],
  ['data/release_notes.json', 433, 37594, '9132b2e8809c5e1f01bf5715a115105f62387318b422ad681c0ef6a1be63c7f9'],
];

const blockRows = [
  ['buildConfig', 'const ALL_BROWSER_TARGETS', '// Stronger filter function', 29, 46, 2153],
  ['mainBuildFlow', 'async function main()', 'function ensureCollabDialogScriptOrder', 93, 100, 3705],
  ['manifestOrderRepair', 'function ensureCollabDialogScriptOrder', 'function createZip', 193, 22, 858],
  ['createZip', 'function createZip', 'async function maybeCollectMobileArtifacts', 215, 33, 981],
  ['mobileArtifacts', 'async function maybeCollectMobileArtifacts', 'function resolveMobileArtifactPromptDir', 248, 90, 4332],
  ['mobileArtifactPromptDir', 'function resolveMobileArtifactPromptDir', 'function resolveDefaultMobileArtifactsDir', 338, 12, 314],
  ['mobileArtifactDefaults', 'function resolveDefaultMobileArtifactsDir', 'function parseMobileArtifactName', 350, 9, 376],
  ['mobileArtifactParsing', 'function parseMobileArtifactName', 'function summarizeMobileArtifacts', 359, 11, 291],
  ['mobileArtifactSummary', 'function summarizeMobileArtifacts', 'function selectLatestMobileArtifacts', 370, 35, 1174],
  ['mobileSelectionChecksum', 'function selectLatestMobileArtifacts', 'function resolveGitHubToken', 405, 16, 568],
  ['releasePromptPublish', 'async function maybePromptRelease', 'function extractLatestChangelogEntry', 445, 85, 3235],
  ['releaseBody', 'function buildReleaseBody', 'function githubCliEnv', 569, 109, 5480],
  ['githubReleaseCreate', 'function createDraftGitHubRelease', 'function listGitHubReleaseAssetNames', 712, 10, 269],
  ['githubAssetUpload', 'function uploadGitHubReleaseAssets', 'function publishDraftGitHubRelease', 732, 11, 353],
  ['readmeBadges', 'async function updateReadmeBadges', 'function shouldCountInTotalLoC', 777, 63, 2355],
];

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(filePath(file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sourceLineOf(text, offset) {
  return text.slice(0, offset).split(/\r?\n/).length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loadResolveMobileArtifactPromptDir() {
  const build = read('build.js');
  const startNeedle = 'function resolveMobileArtifactPromptDir(answer, defaultDir) {';
  const endNeedle = 'function resolveDefaultMobileArtifactsDir';
  const start = build.indexOf(startNeedle);
  const end = build.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  assert.notEqual(end, -1, `missing ${endNeedle}`);

  const context = {};
  vm.createContext(context);
  vm.runInContext(`${build.slice(start, end)}\nthis.resolveMobileArtifactPromptDir = resolveMobileArtifactPromptDir;`, context);
  return context.resolveMobileArtifactPromptDir;
}

test('release build artifact claim boundary is audit-only and fingerprint pinned', () => {
  const text = doc();

  assert.match(text, /Status: current-behavior proof with a 2026-06-01 build prompt guard addendum/);
  assert.match(text, /Extension runtime behavior is unchanged/);
  assert.match(text, /release build prompt behavior changed/);
  assert.match(text, /codebase inspection/);
  assert.match(text, /future optimization locations and first-class JSON filter blockers/);
  assert.match(text, /release build artifact boundary source files: 9/);
  assert.match(text, /release build artifact source\/effect blocks: 15/);
  assert.match(text, /build prompt behavior changed: yes/);
  assert.match(text, /runtime behavior changed: no/);

  for (const [file, expectedLines, expectedBytes, expectedHash] of sourceRows) {
    const source = read(file);
    assert.equal(lineCount(source), expectedLines, `${file} line count drifted`);
    assert.equal(fs.statSync(filePath(file)).size, expectedBytes, `${file} byte count drifted`);
    assert.equal(sha256(file), expectedHash, `${file} hash drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${escapeRegExp(file)}\` \\| ${expectedLines} \\| ${expectedBytes} \\| \`${expectedHash}\` \\|`)
    );
  }
});

test('release build artifact claim boundary pins build source and effect blocks', () => {
  const text = doc();
  const build = read('build.js');

  for (const [name, startNeedle, endNeedle, expectedStartLine, expectedLines, expectedBytes] of blockRows) {
    const start = build.indexOf(startNeedle);
    assert.notEqual(start, -1, `missing block start ${name}`);
    const end = build.indexOf(endNeedle, start + startNeedle.length);
    assert.notEqual(end, -1, `missing block end ${name}`);
    const block = build.slice(start, end);

    assert.equal(sourceLineOf(build, start), expectedStartLine, `${name} start line drifted`);
    assert.equal(lineCount(block), expectedLines, `${name} line count drifted`);
    assert.equal(Buffer.byteLength(block), expectedBytes, `${name} byte count drifted`);
    assert.match(
      text,
      new RegExp(`\\| \`${name}\` \\| ${expectedStartLine} \\| ${expectedLines} \\| ${expectedBytes} \\|`)
    );
  }
});

test('release build artifact claim boundary records package versions scripts and public README claims', () => {
  const text = doc();
  const pkg = readJson('package.json');
  const readme = read('README.md');
  const releases = readJson('data/release_notes.json');
  const releaseVersions = releases.filter((entry) => entry && typeof entry.version === 'string').map((entry) => entry.version);

  assert.equal(pkg.version, '3.4.1');
  assert.equal(pkg.scripts.build, 'node build.js');
  assert.equal(pkg.scripts['build:chrome'], 'node build.js chrome');
  assert.equal(pkg.scripts['build:firefox'], 'node build.js firefox');
  assert.equal(pkg.scripts['build:opera'], 'node build.js opera');

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(readJson(manifestFile).version, '3.4.1', `${manifestFile} version drifted`);
  }

  assert.equal(releases.length, 31);
  assert.equal(releaseVersions.length, 30);
  assert.equal(releaseVersions[0], '3.4.1');
  assert.equal(releaseVersions[1], '3.4.0');

  assert.match(readme, /filtertube\.in\/downloads/);
  assert.match(readme, /Large Blocklist Matching \(v3\.3\.1\)/);
  assert.match(readme, /200\+ saved channels do not create renderer-by-renderer scan costs/);
  assert.match(readme, /JSON-backed surfaces can be filtered before paint/);
  assert.match(readme, /Current audit work is tightening no-rule, route, lifecycle, and resolver budgets/);

  assert.match(text, /browser package version: 3\.4\.1/);
  assert.match(text, /package\.json version: 3\.4\.1/);
  assert.match(text, /newest release-note version: 3\.4\.1/);
  assert.match(text, /release note data entries: 31/);
  assert.match(text, /release note version rows: 30/);
  assert.match(text, /README public copy currently claims/);
});

test('release build artifact claim boundary records current package and release mechanics', () => {
  const text = doc();
  const build = read('build.js');
  const createIndex = build.indexOf('createDraftGitHubRelease(githubAuth, {');
  const uploadIndex = build.indexOf('uploadGitHubReleaseAssets(githubAuth, tagName, missingAssetPaths)');
  const verifyIndex = build.indexOf('const stillMissing = releaseAssetPaths');
  const publishIndex = build.indexOf('publishDraftGitHubRelease(githubAuth, tagName);');

  assert.match(build, /const COMMON_DIRS = \['_locales', 'js', 'css', 'html', 'icons', 'data', 'assets'\];/);
  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/);
  assert.match(build, /execSync\('node scripts\/build-extension-ui\.mjs', \{ stdio: 'inherit' \}\)/);
  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /archive\.glob\('\*\*\/\*'/);
  assert.match(build, /MOBILE_ARTIFACT_FILE_RE = \/\^FilterTube-mobile-tablet-v/);
  assert.match(build, /resolveMobileArtifactPromptDir\(sourceDir, defaultDir\)/);
  assert.match(build, /sha256File\(targetPath\)/);
  assert.match(build, /'--draft'/);
  assert.match(build, /'--draft=false'/);
  assert.match(build, /if \(createdDraft\) \{\s*publishDraftGitHubRelease/);
  assert.ok(createIndex >= 0 && createIndex < uploadIndex && uploadIndex < verifyIndex && verifyIndex < publishIndex);

  assert.match(text, /package source directories: _locales, js, css, html, icons, data, assets/);
  assert.match(text, /package common files: README\.md, CHANGELOG\.md, LICENSE/);
  assert.match(text, /browser ZIP checksum writer: absent/);
  assert.match(text, /release package manifest: absent/);
  assert.match(text, /public claim manifest: absent/);
  assert.match(text, /artifact manifest: absent/);
  assert.match(text, /mobile artifact prompt y\/default input: default directory/);
  assert.match(text, /public release rollback\/delete path: absent/);
});

test('release mobile artifact prompt input treats yes-like directory answers as default', () => {
  const resolvePromptDir = loadResolveMobileArtifactPromptDir();
  const defaultDir = '/Users/devanshvarshney/FilterTubeApp/release-artifacts/android-mobile-tablet';

  assert.equal(resolvePromptDir('', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('   ', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('y', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('Y', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('yes', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('default', defaultDir), defaultDir);
  assert.equal(resolvePromptDir('/tmp/filtertube-artifacts', defaultDir), '/tmp/filtertube-artifacts');
  assert.equal(resolvePromptDir('release-artifacts/mobile', defaultDir), 'release-artifacts/mobile');
});

test('release build artifact claim boundary keeps future authority gates missing', () => {
  const text = doc();
  const build = read('build.js');
  const combinedSource = [
    build,
    read('package.json'),
    read('README.md'),
    read('manifest.json'),
    read('manifest.chrome.json'),
    read('manifest.firefox.json'),
    read('manifest.opera.json'),
  ].join('\n');

  assert.equal(countLiteral(combinedSource, 'releasePackageManifest'), 0);
  assert.equal(countLiteral(combinedSource, 'publicClaimManifest'), 0);
  assert.equal(countLiteral(combinedSource, 'artifactManifest'), 0);
  assert.equal(/rollback|delete release|method:\s*'DELETE'/i.test(build), false);
  assert.equal(/filtertube-\$\{browser\}-v\$\{version\}\.zip\.sha256|zip.*sha256|sha256.*zip/i.test(build), false);

  assert.match(text, /Release copy constructs browser ZIP links and optional Android links from naming conventions, not from verified uploaded assets/);
  assert.match(text, /First-class JSON filter risk is public-copy drift/);
  assert.match(text, /No `releaseBuildArtifactClaimContract`, `releasePackageManifestAuthority`,/);
  assert.match(text, /`releaseReadmeMutationGate`, `releaseDraftFirstGate`,/);
  assert.match(text, /`releaseAssetUploadRollbackPlan`, `releaseMobileArtifactClaimGate`,/);
  assert.match(text, /`releaseZipChecksumManifest`, `releaseGeneratedUiFreshnessGate`,/);
  assert.match(text, /`releaseBrowserManifestParityReport`, `releasePublicClaimFixtureProvenance`, or/);
  assert.match(text, /`releaseFirstClassJsonClaimGate` exists/);
});
