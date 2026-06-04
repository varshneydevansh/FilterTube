import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BUILD_SCRIPT_METHOD_SEMANTIC_REGISTER_2026-05-27.md';
const sourcePath = 'build.js';
const packagePath = 'package.json';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';

const methodGroups = new Map([
  ['filterFunc', 'packageCopySurface'],
  ['main', 'packageBuildOrchestration'],
  ['ensureCollabDialogScriptOrder', 'manifestRewriteSurface'],
  ['createZip', 'zipArtifactCreation'],
  ['maybeCollectMobileArtifacts', 'mobileArtifactStaging'],
  ['resolveMobileArtifactPromptDir', 'mobileArtifactStaging'],
  ['resolveDefaultMobileArtifactsDir', 'mobileArtifactStaging'],
  ['parseMobileArtifactName', 'mobileArtifactStaging'],
  ['summarizeMobileArtifacts', 'mobileArtifactStaging'],
  ['selectLatestMobileArtifacts', 'mobileArtifactStaging'],
  ['extractAndroidVersionCode', 'mobileArtifactStaging'],
  ['sha256File', 'mobileArtifactStaging'],
  ['maybePromptRelease', 'releasePublication'],
  ['extractLatestChangelogEntry', 'releaseBodyGeneration'],
  ['deriveSubtitle', 'releaseBodyGeneration'],
  ['buildReleaseTitle', 'releaseBodyGeneration'],
  ['buildReleaseBody', 'releaseBodyGeneration'],
  ['assetLink', 'releaseBodyGeneration'],
  ['releaseAssetLink', 'releaseBodyGeneration'],
  ['createGitHubRelease', 'releasePublication'],
  ['uploadReleaseAsset', 'releasePublication'],
  ['contentTypeForAsset', 'releasePublication'],
  ['httpRequest', 'releasePublication'],
  ['promptYesNo', 'interactivePromptSurface'],
  ['promptText', 'interactivePromptSurface'],
  ['updateReadmeBadges', 'readmeBadgeMutation'],
  ['formatLoC', 'readmeBadgeMutation'],
  ['shouldCountInTotalLoC', 'readmeBadgeMutation'],
  ['sumFileLines', 'readmeBadgeMutation']
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(path.join(repoRoot, file));
}

function readJson(file) {
  return JSON.parse(read(file));
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function sourceLineCount(file = sourcePath) {
  const source = read(file);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function countRegex(source, regex) {
  return (source.match(regex) || []).length;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function methodRows() {
  const rows = [];
  const lines = read(sourcePath).split(/\r?\n/);

  lines.forEach((line, index) => {
    const asyncFunction = line.match(/^async function\s+([A-Za-z_$][\w$]*)\s*\(/);
    const plainFunction = line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
    const arrowFunction = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/);
    const name = asyncFunction?.[1] || plainFunction?.[1] || arrowFunction?.[1];
    if (!name || !methodGroups.has(name)) return;

    rows.push({
      line: index + 1,
      kind: asyncFunction ? 'asyncFunction' : arrowFunction ? 'arrowFunction' : 'function',
      name,
      group: methodGroups.get(name)
    });
  });

  return rows;
}

function currentPackageScripts() {
  return readJson(packagePath).scripts || {};
}

function trackedSearchCorpus() {
  const files = git(['ls-files', 'build.js', 'package.json', 'manifest*.json', 'js/*.js', 'js/**/*.js', 'src/**/*.js', 'src/**/*.jsx', 'scripts/*.mjs', 'docs/*.md'])
    .filter((file) => !file.startsWith('tests/') && !file.startsWith('docs/audit/'));
  return files.map((file) => read(file)).join('\n');
}

function assertDocIncludesMethodRows(text, rows) {
  for (const row of rows) {
    assert.ok(
      text.includes(`| \`build.js\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing build method row ${row.kind}:${row.name}:${row.line}`
    );
  }
}

test('build script method semantic register is audit-only and source fingerprinted', () => {
  const text = doc();
  const source = read(sourcePath);

  assert.match(text, /Status: current-behavior register with a 2026-06-01 build prompt guard/);
  assert.match(text, /Extension runtime behavior is unchanged/);
  assert.match(text, /build prompt behavior changed/);
  assert.match(text, /source-derived method semantic slice/);
  assert.match(text, /not completion proof for release package safety/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /build behavior changed: yes/);

  assert.equal(sourceLineCount(), 740);
  assert.equal(readBuffer(sourcePath).byteLength, 26978);
  assert.equal(sha256(sourcePath), 'c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04');
  assert.match(text, /build script line count: 740/);
  assert.match(text, /build script bytes: 26978/);
  assert.match(text, /build script sha256: c8485cb2600aad89f44015cd7e49ebe4746ebcc35c91c1ff2bf29aec2f087a04/);
  assert.equal(countLiteral(source, 'main().catch'), 1);
  assert.match(text, /npm script entrypoint: npm run build -> node build\.js/);
});

test('build script register accounts for every current semantic method row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 29);
  assert.deepEqual(countBy(rows, 'kind'), {
    arrowFunction: 4,
    asyncFunction: 4,
    function: 21
  });
  assert.deepEqual(countBy(rows, 'group'), {
    interactivePromptSurface: 2,
    manifestRewriteSurface: 1,
    mobileArtifactStaging: 8,
    packageBuildOrchestration: 1,
    packageCopySurface: 1,
    readmeBadgeMutation: 4,
    releaseBodyGeneration: 6,
    releasePublication: 5,
    zipArtifactCreation: 1
  });

  assert.match(text, /lexical callable rows in this semantic slice: 29/);
  assert.match(text, /plain function declarations: 21/);
  assert.match(text, /async function declarations: 4/);
  assert.match(text, /arrow callable rows: 4/);
  assert.match(text, /semantic method groups: 9/);
  assertDocIncludesMethodRows(text, rows);
});

test('build script register pins current side-effect and release-publication tokens', () => {
  const text = doc();
  const source = read(sourcePath);

  const pairs = [
    ['arrow token sites in build script', countRegex(source, /=>/g), 42],
    ['require calls', countRegex(source, /\brequire\(/g), 8],
    ['await expressions', countRegex(source, /\bawait\b/g), 9],
    ['execSync occurrences', countLiteral(source, 'execSync'), 3],
    ['fs.copySync occurrences', countLiteral(source, 'fs.copySync'), 3],
    ['fs.copyFileSync occurrences', countLiteral(source, 'fs.copyFileSync'), 1],
    ['fs.rmSync occurrences', countLiteral(source, 'fs.rmSync'), 2],
    ['fs.writeJsonSync occurrences', countLiteral(source, 'fs.writeJsonSync'), 1],
    ['fs.writeFileSync occurrences', countLiteral(source, 'fs.writeFileSync'), 2],
    ['https.request occurrences', countLiteral(source, 'https.request'), 2],
    ['readline.createInterface occurrences', countLiteral(source, 'readline.createInterface'), 2],
    ['process.stdout.isTTY occurrences', countLiteral(source, 'process.stdout.isTTY'), 2],
    ['draft false occurrences', countLiteral(source, 'draft: false'), 1],
    ['MOBILE_ARTIFACT_FILE_RE occurrences', countLiteral(source, 'MOBILE_ARTIFACT_FILE_RE'), 3],
    ['console callsites', countRegex(source, /\bconsole\./g), 28]
  ];

  for (const [label, actual, expected] of pairs) {
    assert.equal(actual, expected, `${label} should remain pinned`);
    assert.ok(text.includes(`${label}: ${expected}`), `doc missing ${label}: ${expected}`);
  }

  for (const phrase of [
    'normal npm run build mutates README.md badge URLs',
    'TTY release publication creates a public non-draft GitHub release before uploading assets',
    'asset upload happens one file at a time after public release creation',
    'manifest rewrite repairs collab_dialog load order but does not validate permission',
    'build failure sets process.exitCode but does not rollback README'
  ]) {
    assert.ok(text.includes(phrase), `missing build boundary phrase: ${phrase}`);
  }
});

test('build script register pins package scripts and copied release roots', () => {
  const text = doc();
  const scripts = currentPackageScripts();
  const source = read(sourcePath);

  assert.equal(scripts.build, 'node build.js');
  assert.equal(scripts['build:chrome'], 'node build.js chrome');
  assert.equal(scripts['build:firefox'], 'node build.js firefox');
  assert.equal(scripts['build:opera'], 'node build.js opera');
  assert.match(source, /const ALL_BROWSER_TARGETS = \['chrome', 'firefox', 'opera'\]/);
  assert.match(source, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(source, /const COMMON_FILES = \['README\.md', 'CHANGELOG\.md', 'LICENSE'\]/);
  assert.match(source, /execSync\('node scripts\/build-extension-ui\.mjs'/);
  assert.doesNotMatch(source, /scripts\/build-nanah-vendor\.mjs/);
  assert.doesNotMatch(source, /scripts\/sync-native-runtime\.mjs/);

  for (const phrase of [
    'target browsers: chrome, firefox, opera',
    'common copied directories: js, css, html, icons, data, assets',
    'common copied files: README.md, CHANGELOG.md, LICENSE',
    'normal package build invokes: node scripts/build-extension-ui.mjs',
    'normal package build does not invoke: scripts/build-nanah-vendor.mjs',
    'normal package build does not invoke: scripts/sync-native-runtime.mjs',
    'ZIP output pattern: dist/filtertube-<browser>-v<version>.zip',
    'GitHub release draft state: false',
    'README mutation: updateReadmeBadges(VERSION) runs during main()'
  ]) {
    assert.ok(text.includes(phrase), `missing package/release phrase: ${phrase}`);
  }
});

test('build script register keeps future build authorities absent and method gap open', () => {
  const text = doc();
  const methodGap = read(methodGapPath);
  const corpus = trackedSearchCorpus();

  for (const token of [
    'buildScriptMethodAuthority',
    'buildPackageManifestAuthority',
    'buildReleaseDraftFirstGate',
    'buildReadmeMutationGate',
    'buildZipChecksumManifest',
    'buildMobileArtifactManifest',
    'buildManifestValidationReport',
    'buildReleaseAssetPreflightReport',
    'buildReleaseRollbackPlan',
    'buildDirtyWorktreePolicy',
    'buildGeneratedOutputFreshnessReport',
    'buildPackageFixtureProvenance'
  ]) {
    assert.ok(text.includes(token), `doc should name missing authority ${token}`);
    assert.equal(countLiteral(corpus, token), 0, `${token} should remain absent from product/package/core-doc surfaces`);
  }

  assert.ok(text.includes(methodGapPath));
  assert.match(text, /method semantic proof gap files covered: 69/);
  assert.match(text, /method semantic proof gap lexical callables covered: 5827/);
  assert.match(text, /files with complete per-callable semantic proof: 0/);
  assert.match(text, /affected callable semantic proof: NO-GO/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /repo-wide behavior-change approval from method proof: NO-GO/);
});
