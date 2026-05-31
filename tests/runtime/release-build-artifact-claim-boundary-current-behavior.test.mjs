import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const sourceRows = [
  ['build.js', 686, 24689, 'f6778ce29f1d7f520a66ab689f8c1a2999e5887ffa8c53bd5039f4976b2671b6'],
  ['package.json', 46, 1376, 'cd24685d1fb4940c1a67f12ce143bc1466200a299a82dbfa6f553b99e24ae23f'],
  ['README.md', 416, 24330, '8435890aa3fc5bb10fb9206353978a53b4b1847809ce9ca3ffbb4f7bfecac9ac'],
  ['CHANGELOG.md', 591, 40157, '71949d5506a2e9acd27b7f1a1578edef49b06dc578314293863d425d32251bd5'],
  ['manifest.json', 88, 2513, 'c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1'],
  ['manifest.chrome.json', 88, 2513, 'c39c38d4e389f17803b1915c2d2d0673c60dd87e68a9301fac4faad14bfd31e1'],
  ['manifest.firefox.json', 75, 2029, '89e2f70a5f6bb34356ebed2f4ad357213a28a2872cfaebeff2474e702a98719d'],
  ['manifest.opera.json', 89, 2518, 'ef0fa857517710853e82942bdb05bc14c9f2e2202b49775fd6e6a59a27e77017'],
  ['data/release_notes.json', 316, 23039, 'e012f6c071fffa67958f55544ecae9bbb26e7ec91edd2066df4d06a62de69962'],
];

const blockRows = [
  ['buildConfig', 'const ALL_BROWSER_TARGETS', '// Stronger filter function', 28, 38, 1476],
  ['mainBuildFlow', 'async function main()', 'function ensureCollabDialogScriptOrder', 80, 79, 2790],
  ['manifestOrderRepair', 'function ensureCollabDialogScriptOrder', 'function createZip', 159, 22, 858],
  ['createZip', 'function createZip', 'async function maybeCollectMobileArtifacts', 181, 33, 981],
  ['mobileArtifacts', 'async function maybeCollectMobileArtifacts', 'function selectLatestMobileArtifacts', 214, 61, 2331],
  ['mobileSelectionChecksum', 'function selectLatestMobileArtifacts', 'async function maybePromptRelease', 275, 17, 625],
  ['releasePromptPublish', 'async function maybePromptRelease', 'function extractLatestChangelogEntry', 292, 58, 1805],
  ['releaseBody', 'function buildReleaseBody', 'function createGitHubRelease', 388, 94, 4166],
  ['githubReleaseCreate', 'function createGitHubRelease', 'function uploadReleaseAsset', 482, 25, 699],
  ['githubAssetUpload', 'function uploadReleaseAsset', 'function contentTypeForAsset', 507, 35, 1350],
  ['readmeBadges', 'async function updateReadmeBadges', 'function shouldCountInTotalLoC', 602, 63, 2355],
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

test('release build artifact claim boundary is audit-only and fingerprint pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /codebase inspection/);
  assert.match(text, /future optimization locations and first-class JSON filter blockers/);
  assert.match(text, /release build artifact boundary source files: 9/);
  assert.match(text, /release build artifact source\/effect blocks: 11/);
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

  assert.equal(pkg.version, '3.3.1');
  assert.equal(pkg.scripts.build, 'node build.js');
  assert.equal(pkg.scripts['build:chrome'], 'node build.js chrome');
  assert.equal(pkg.scripts['build:firefox'], 'node build.js firefox');
  assert.equal(pkg.scripts['build:opera'], 'node build.js opera');

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.equal(readJson(manifestFile).version, '3.3.1', `${manifestFile} version drifted`);
  }

  assert.equal(releases.length, 24);
  assert.equal(releaseVersions.length, 23);
  assert.equal(releaseVersions[0], '3.3.2');
  assert.equal(releaseVersions[1], '3.3.1');

  assert.match(readme, /filtertube\.in\/downloads/);
  assert.match(readme, /Large blocked-channel lists filter faster/);
  assert.match(readme, /JSON-backed surfaces can be filtered before paint/);
  assert.match(readme, /Current audit work is tightening no-rule, route, lifecycle, and resolver budgets/);

  assert.match(text, /browser package version: 3\.3\.1/);
  assert.match(text, /package\.json version: 3\.3\.1/);
  assert.match(text, /staged newest release-note version: 3\.3\.2/);
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
  assert.match(text, /public release rollback\/delete path: absent/);
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
