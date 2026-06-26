import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceRows = [
  ['build.js', 740, 26978, 'c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04'],
  ['package.json', 67, 2954, '6f0b5dc130399998ad5435ef3b273573234e80561ceba32e0da078b91851e229'],
  ['README.md', 423, 24084, '07e93a903e334c456b3e315c61a4124f799e7a3ceb6b17f1554b85ed6d3d1854'],
  ['CHANGELOG.md', 591, 40124, 'e22a87ce7eeb88d171587d4b0f4676881a2c3081a7fbf15978d7e8d8582cdfdd'],
  ['manifest.json', 93, 2654, '95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b'],
  ['manifest.chrome.json', 93, 2654, '95496eac74d72fd90491302211b7dc07f492ed405d4eb1a001b8b600a02bc16b'],
  ['manifest.firefox.json', 80, 2150, '8368c4b520a07d1e5d9647f6c141f06f8fbd24a92c8b053d722488859f201c32'],
  ['manifest.opera.json', 94, 2659, 'f9a3b4182521d8b1594d7975c327daf772e418e4869e8e3d33d286bfb25b486e'],
  ['data/release_notes.json', 319, 23455, '7a2fdb97743c695a7167a151ec0bcef419ca9973e1a66db6a48ab1c228c4220f'],
];

const blockRows = [
  ['buildConfig', 'const ALL_BROWSER_TARGETS', '// Stronger filter function', 28, 40, 1688],
  ['mainBuildFlow', 'async function main()', 'function ensureCollabDialogScriptOrder', 82, 79, 2790],
  ['manifestOrderRepair', 'function ensureCollabDialogScriptOrder', 'function createZip', 161, 22, 858],
  ['createZip', 'function createZip', 'async function maybeCollectMobileArtifacts', 183, 33, 981],
  ['mobileArtifacts', 'async function maybeCollectMobileArtifacts', 'function resolveMobileArtifactPromptDir', 216, 67, 2783],
  ['mobileArtifactPromptDir', 'function resolveMobileArtifactPromptDir', 'function resolveDefaultMobileArtifactsDir', 283, 12, 314],
  ['mobileArtifactDefaults', 'function resolveDefaultMobileArtifactsDir', 'function parseMobileArtifactName', 295, 9, 376],
  ['mobileArtifactParsing', 'function parseMobileArtifactName', 'function summarizeMobileArtifacts', 304, 11, 291],
  ['mobileArtifactSummary', 'function summarizeMobileArtifacts', 'function selectLatestMobileArtifacts', 315, 11, 376],
  ['mobileSelectionChecksum', 'function selectLatestMobileArtifacts', 'async function maybePromptRelease', 326, 16, 568],
  ['releasePromptPublish', 'async function maybePromptRelease', 'function extractLatestChangelogEntry', 342, 58, 1805],
  ['releaseBody', 'function buildReleaseBody', 'function createGitHubRelease', 438, 98, 4491],
  ['githubReleaseCreate', 'function createGitHubRelease', 'function uploadReleaseAsset', 536, 25, 699],
  ['githubAssetUpload', 'function uploadReleaseAsset', 'function contentTypeForAsset', 561, 35, 1350],
  ['readmeBadges', 'async function updateReadmeBadges', 'function shouldCountInTotalLoC', 656, 63, 2355],
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

  assert.equal(pkg.version, '3.3.2');
  assert.equal(pkg.scripts.build, 'node build.js');
  assert.equal(pkg.scripts['build:chrome'], 'node build.js chrome');
  assert.equal(pkg.scripts['build:firefox'], 'node build.js firefox');
  assert.equal(pkg.scripts['build:opera'], 'node build.js opera');

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(readJson(manifestFile).version, '3.3.2', `${manifestFile} version drifted`);
  }

  assert.equal(releases.length, 24);
  assert.equal(releaseVersions.length, 23);
  assert.equal(releaseVersions[0], '3.3.2');
  assert.equal(releaseVersions[1], '3.3.1');

  assert.match(readme, /filtertube\.in\/downloads/);
  assert.match(readme, /Large Blocklist Matching \(v3\.3\.1\)/);
  assert.match(readme, /200\+ saved channels do not create renderer-by-renderer scan costs/);
  assert.match(readme, /JSON-backed surfaces can be filtered before paint/);
  assert.match(readme, /Current audit work is tightening no-rule, route, lifecycle, and resolver budgets/);

  assert.match(text, /browser package version: 3\.3\.2/);
  assert.match(text, /package\.json version: 3\.3\.2/);
  assert.match(text, /newest release-note version: 3\.3\.2/);
  assert.match(text, /release note data entries: 24/);
  assert.match(text, /release note version rows: 23/);
  assert.match(text, /README public copy currently claims/);
});

test('release build artifact claim boundary records current package and release mechanics', () => {
  const text = doc();
  const build = read('build.js');
  const createIndex = build.indexOf('const release = await createGitHubRelease');
  const uploadIndex = build.indexOf('for (const assetPath of releaseAssetPaths)');

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\];/);
  assert.match(build, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\];/);
  assert.match(build, /execSync\('node scripts\/build-extension-ui\.mjs', \{ stdio: 'inherit' \}\)/);
  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /archive\.glob\('\*\*\/\*'/);
  assert.match(build, /MOBILE_ARTIFACT_FILE_RE = \/\^FilterTube-mobile-tablet-v/);
  assert.match(build, /resolveMobileArtifactPromptDir\(sourceDir, defaultDir\)/);
  assert.match(build, /sha256File\(targetPath\)/);
  assert.match(build, /draft:\s*false/);
  assert.match(build, /prerelease:\s*false/);
  assert.ok(createIndex !== -1 && uploadIndex !== -1 && createIndex < uploadIndex);

  assert.match(text, /package source directories: js, css, html, icons, data, assets/);
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
