import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_BUILD_RELEASE_METHOD_SEMANTIC_REGISTER_2026-05-21.md';
const sourcePath = 'build.js';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function doc() {
  return read(docPath);
}

function source() {
  return read(sourcePath);
}

function count(text, regex) {
  return [...text.matchAll(regex)].length;
}

function countLiteral(text, token) {
  return text.split(token).length - 1;
}

function sourceLineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function groupForName(name) {
  if (['filterFunc', 'main', 'ensureCollabDialogScriptOrder', 'createZip'].includes(name)) {
    return 'buildPackageAssembly';
  }
  if (['maybeCollectMobileArtifacts', 'selectLatestMobileArtifacts', 'extractAndroidVersionCode', 'sha256File'].includes(name)) {
    return 'buildMobileArtifactStaging';
  }
  if (['maybePromptRelease', 'extractLatestChangelogEntry', 'deriveSubtitle', 'buildReleaseTitle', 'buildReleaseBody', 'assetLink', 'releaseAssetLink'].includes(name)) {
    return 'buildReleasePromptAndBody';
  }
  if (['createGitHubRelease', 'uploadReleaseAsset', 'contentTypeForAsset', 'httpRequest'].includes(name)) {
    return 'buildGitHubReleaseTransport';
  }
  if (['promptYesNo', 'promptText'].includes(name)) {
    return 'buildInteractivePromptHelpers';
  }
  if (['updateReadmeBadges', 'formatLoC', 'shouldCountInTotalLoC', 'sumFileLines'].includes(name)) {
    return 'buildReadmeBadgeAndLocMutation';
  }
  return 'UNCLASSIFIED';
}

function methodRows() {
  const rows = [];
  source().split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^\s*async function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'asyncFunction', name: match[1] });
      return;
    }
    match = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      rows.push({ line: lineNumber, kind: 'function', name: match[1] });
      return;
    }
    match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
    if (match) {
      rows.push({ line: lineNumber, kind: line.includes('async') ? 'constAsyncArrow' : 'constArrow', name: match[1] });
      return;
    }
    match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/);
    if (match) {
      rows.push({ line: lineNumber, kind: line.includes('async') ? 'constAsyncArrow' : 'constArrow', name: match[1] });
    }
  });
  return rows.map((row) => ({ ...row, group: groupForName(row.name) }));
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

test('build release method semantic register is audit-only and source scoped', () => {
  const text = doc();
  const build = source();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: build\.js/);
  assert.equal(sourceLineCount(build), 686);
  assert.match(text, /line count: 686/);
  assert.match(text, /named method\/helper\/callback declarations in scope: 25/);
  assert.match(text, /plain function declarations: 17/);
  assert.match(text, /async function declarations: 4/);
  assert.match(text, /const arrow helper\/callback declarations: 4/);
  assert.match(text, /semantic method groups: 6/);
  assert.match(text, /arrow token sites: 37/);
  assert.match(text, /callback-like sites: 35/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for package manifest authority/);
});

test('build release register accounts for every current method row', () => {
  const text = doc();
  const rows = methodRows();

  assert.equal(rows.length, 25);
  assert.deepEqual(countBy(rows, 'kind'), {
    asyncFunction: 4,
    constArrow: 4,
    function: 17
  });
  assert.deepEqual(countBy(rows, 'group'), {
    buildGitHubReleaseTransport: 4,
    buildInteractivePromptHelpers: 2,
    buildMobileArtifactStaging: 4,
    buildPackageAssembly: 4,
    buildReadmeBadgeAndLocMutation: 4,
    buildReleasePromptAndBody: 7
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.kind}:${row.name}:${row.line} should be classified`);
    assert.ok(
      text.includes(`| ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing build release method row ${row.kind}:${row.name}:${row.line}`
    );
  }
});

test('build release register pins filesystem network prompt and release counts', () => {
  const text = doc();
  const build = source();
  const countPairs = [
    ['fs.copySync references', countLiteral(build, 'fs.copySync')],
    ['fs.readJsonSync references', countLiteral(build, 'fs.readJsonSync')],
    ['fs.writeJsonSync references', countLiteral(build, 'fs.writeJsonSync')],
    ['fs.createWriteStream references', countLiteral(build, 'fs.createWriteStream')],
    ['fs.ensureDirSync references', countLiteral(build, 'fs.ensureDirSync')],
    ['fs.copyFileSync references', countLiteral(build, 'fs.copyFileSync')],
    ['fs.writeFileSync references', countLiteral(build, 'fs.writeFileSync')],
    ['fs.readFileSync references', countLiteral(build, 'fs.readFileSync')],
    ['fs.existsSync references', countLiteral(build, 'fs.existsSync')],
    ['fs.rmSync references', countLiteral(build, 'fs.rmSync')],
    ['fs.mkdirSync references', countLiteral(build, 'fs.mkdirSync')],
    ['fs.statSync references', countLiteral(build, 'fs.statSync')],
    ['fs.readdirSync references', countLiteral(build, 'fs.readdirSync')],
    ['fs.createReadStream references', countLiteral(build, 'fs.createReadStream')],
    ['path.join references', countLiteral(build, 'path.join')],
    ['path.resolve references', countLiteral(build, 'path.resolve')],
    ['path.basename references', countLiteral(build, 'path.basename')],
    ['path.extname references', countLiteral(build, 'path.extname')],
    ['execSync references', countLiteral(build, 'execSync')],
    ['crypto.createHash references', countLiteral(build, 'crypto.createHash')],
    ['https.request references', countLiteral(build, 'https.request')],
    ['readline.createInterface references', countLiteral(build, 'readline.createInterface')],
    ['process.argv references', countLiteral(build, 'process.argv')],
    ['process.env references', countLiteral(build, 'process.env')],
    ['process.stdout.isTTY references', countLiteral(build, 'process.stdout.isTTY')],
    ['process.exitCode references', countLiteral(build, 'process.exitCode')],
    ['console.log references', countLiteral(build, 'console.log')],
    ['console.warn references', countLiteral(build, 'console.warn')],
    ['console.error references', countLiteral(build, 'console.error')],
    ['await expressions', count(build, /\bawait\b/g)],
    ['new Promise references', countLiteral(build, 'new Promise')],
    ['JSON.parse references', countLiteral(build, 'JSON.parse')],
    ['JSON.stringify references', countLiteral(build, 'JSON.stringify')],
    ['Buffer.concat references', countLiteral(build, 'Buffer.concat')],
    ['Buffer.byteLength references', countLiteral(build, 'Buffer.byteLength')],
    ['encodeURIComponent references', countLiteral(build, 'encodeURIComponent')],
    ['archive.glob references', countLiteral(build, 'archive.glob')],
    ['archive.finalize references', countLiteral(build, 'archive.finalize')],
    ['archive.pipe references', countLiteral(build, 'archive.pipe')],
    ['output.on references', countLiteral(build, 'output.on')],
    ['archive.on references', countLiteral(build, 'archive.on')],
    ['res.on references', countLiteral(build, 'res.on')],
    ['req.on references', countLiteral(build, 'req.on')],
    ['req.write references', countLiteral(build, 'req.write')],
    ['req.end references', countLiteral(build, 'req.end')],
    ['GITHUB_TOKEN references', countLiteral(build, 'GITHUB_TOKEN')],
    ['draft: false references', countLiteral(build, 'draft: false')],
    ['prerelease: false references', countLiteral(build, 'prerelease: false')],
    ['README.md references', countLiteral(build, 'README.md')],
    ['CHANGELOG.md references', countLiteral(build, 'CHANGELOG.md')],
    ['LICENSE references', countLiteral(build, 'LICENSE')],
    ['manifest.${browser}.json references', countLiteral(build, 'manifest.${browser}.json')],
    ['manifest.json references', countLiteral(build, 'manifest.json')],
    ['collab_dialog.js references', countLiteral(build, 'collab_dialog.js')],
    ['content_bridge.js references', countLiteral(build, 'content_bridge.js')],
    ['dist references', countLiteral(build, 'dist')],
    ['release-artifacts references', countLiteral(build, 'release-artifacts')],
    ['filtertube-${browser}-v${version}.zip references', countLiteral(build, 'filtertube-${browser}-v${version}.zip')],
    ['.sha256 references', countLiteral(build, '.sha256')],
    ['.apk references', countLiteral(build, '.apk')],
    ['.aab references', countLiteral(build, '.aab')],
    ['try blocks', count(build, /\btry\s*\{/g)],
    ['catch token occurrences', count(build, /\bcatch\s*\(/g)],
    ['finally blocks', count(build, /\bfinally\b/g)],
    ['addEventListener calls', count(build, /addEventListener\s*\(/g)],
    ['setTimeout calls', count(build, /setTimeout\s*\(/g)],
    ['setInterval calls', count(build, /setInterval\s*\(/g)],
    ['MutationObserver references', countLiteral(build, 'MutationObserver')],
    ['fetch calls', count(build, /\bfetch\s*\(/g)],
    ['new Error calls', count(build, /new\s+Error/g)]
  ];

  for (const [label, value] of countPairs) {
    assert.match(text, new RegExp(`${escapeRegExp(label)}: ${value}`));
  }
});

test('build release register preserves package release mobile and README behavior boundaries', () => {
  const text = doc();
  const build = source();
  const main = sliceBetween(build, 'async function main()', 'function ensureCollabDialogScriptOrder');
  const mobile = sliceBetween(build, 'async function maybeCollectMobileArtifacts', 'function selectLatestMobileArtifacts');
  const release = sliceBetween(build, 'async function maybePromptRelease', 'function extractLatestChangelogEntry');
  const github = sliceBetween(build, 'function createGitHubRelease', 'function promptYesNo');
  const readme = sliceBetween(build, 'async function updateReadmeBadges', 'function shouldCountInTotalLoC');
  const packageJson = readJson('package.json');

  assert.equal(packageJson.scripts.build, 'node build.js');
  assert.equal(packageJson.scripts['build:chrome'], 'node build.js chrome');
  assert.equal(packageJson.scripts['build:firefox'], 'node build.js firefox');
  assert.equal(packageJson.scripts['build:opera'], 'node build.js opera');

  assert.match(main, /execSync\('node scripts\/build-extension-ui\.mjs', \{ stdio: 'inherit' \}\)/);
  assert.match(main, /await updateReadmeBadges\(VERSION\)/);
  assert.match(main, /if \(!targetBrowser && fs\.existsSync\('dist'\)\)/);
  assert.match(main, /COMMON_DIRS\.forEach\(dir =>/);
  assert.match(main, /COMMON_FILES\.forEach\(file =>/);
  assert.match(main, /const manifestFile = `manifest\.\$\{browser\}\.json`/);
  assert.match(main, /ensureCollabDialogScriptOrder\(manifestJSON\)/);
  assert.match(main, /fs\.writeJsonSync\(path\.join\(targetDir, 'manifest\.json'\)/);
  assert.match(main, /await createZip\(browser, targetDir, versionForZip\)/);

  assert.match(mobile, /process\.stdout\.isTTY/);
  assert.match(mobile, /MOBILE_ARTIFACT_FILE_RE\.test\(name\)/);
  assert.match(mobile, /selectLatestMobileArtifacts\(matchedSourceFiles\)/);
  assert.match(mobile, /fs\.copyFileSync\(sourcePath, targetPath\)/);
  assert.match(mobile, /fs\.writeFileSync\(checksumPath, `\$\{sha256File\(targetPath\)\}  \$\{fileName\}\\n`/);

  assert.match(release, /Non-interactive terminal detected; skipping release prompt/);
  assert.match(release, /No release assets produced; skipping release prompt/);
  assert.match(release, /process\.env\.GITHUB_TOKEN/);
  assert.match(release, /await createGitHubRelease\(token/);
  assert.match(release, /for \(const assetPath of releaseAssetPaths\)/);
  assert.match(release, /await uploadReleaseAsset\(token, uploadUrl, assetPath\)/);
  assert.match(release, /Failed to publish release/);

  assert.match(github, /draft: false/);
  assert.match(github, /prerelease: false/);
  assert.match(github, /hostname: 'api\.github\.com'/);
  assert.match(github, /path: `\/repos\/\$\{REPO_OWNER\}\/\$\{REPO_NAME\}\/releases`/);
  assert.match(github, /https\.request\(uploadUrl, options, res =>/);
  assert.match(github, /fs\.createReadStream\(filePath\)\.pipe\(req\)/);
  assert.match(github, /new Error\(`Upload failed/);

  assert.match(readme, /execSync\('git ls-files'/);
  assert.match(readme, /readme\.replace\(/);
  assert.match(readme, /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
  assert.match(readme, /Failed to update README badges/);

  for (const token of [
    'package source directories: js, css, html, icons, data, assets',
    'manifest repair scope: collab_dialog.js before content_bridge.js only',
    'GitHub release mode: draft false and prerelease false',
    'asset upload behavior: after public release creation, upload each path sequentially',
    'normal build mutates README badges before copying packages',
    'package roots are broad directories, not only manifest-referenced files',
    'ZIP creation is archive-glob based and does not emit a checksum manifest',
    'mobile checksum files are staged but not bound to signing fingerprint or package name proof',
    'non-interactive terminal skips release prompt and has no CI publish path',
    'GitHub release is created as public before asset uploads start',
    'asset upload failures are caught after public release creation and no rollback/delete path is present',
    'README badge mutation failures warn and continue'
  ]) {
    assert.ok(text.includes(token), `missing build release boundary token ${token}`);
  }
});

test('build release register preserves future proof fields and missing authority boundary', () => {
  const text = doc();
  const buildAndScripts = [
    'build.js',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');

  for (const field of [
    'buildMethodReference',
    'commandName',
    'browserTarget',
    'manifestValidationResult',
    'packageFamily',
    'quarantineStatus',
    'zipChecksum',
    'releaseAssetChecksum',
    'androidPackageName',
    'signingFingerprint',
    'githubReleaseDraftState',
    'assetUploadStatus',
    'rollbackPolicy',
    'readmeMutationAllowed',
    'sourceFamilyProvenance'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingAuthority of [
    'buildReleaseMethodAuthority',
    'buildPackageManifestAuthority',
    'buildReadmeMutationContract',
    'buildReleaseDraftFirstContract',
    'buildMobileArtifactClaimGate',
    'buildGitHubAssetUploadManifest',
    'buildGeneratedUiFreshnessReport',
    'buildManifestParityReport',
    'buildVendorNativeFreshnessContract',
    'buildReleaseFixtureProvenance'
  ]) {
    assert.match(text, new RegExp(missingAuthority));
    assert.doesNotMatch(buildAndScripts, new RegExp(missingAuthority));
  }
});
