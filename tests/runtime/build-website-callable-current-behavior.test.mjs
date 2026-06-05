import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = path.join(repoRoot, 'docs/audit/FILTERTUBE_BUILD_WEBSITE_CALLABLE_AUDIT_2026-05-18.md');
const auditDoc = fs.readFileSync(auditDocPath, 'utf8');
const buildSemanticDocPath = path.join(repoRoot, 'docs/audit/FILTERTUBE_BUILD_SCRIPT_METHOD_SEMANTIC_REGISTER_2026-05-27.md');
const buildSemanticDoc = fs.readFileSync(buildSemanticDocPath, 'utf8');

const accountedFiles = [
  'build.js',
  'scripts/audit-proof-drift.mjs',
  'scripts/build-extension-ui.mjs',
  'scripts/build-nanah-vendor.mjs',
  'scripts/run-test-lane.mjs',
  'scripts/sync-native-runtime.mjs',
  'scripts/test-lane-config.mjs',
  'website/app/[slug]/page.js',
  'website/app/downloads/page.js',
  'website/app/layout.js',
  'website/app/not-found.js',
  'website/app/page.js',
  'website/app/privacy/page.js',
  'website/app/robots.js',
  'website/app/sitemap.js',
  'website/app/terms/page.js',
  'website/components/browser-logo-rail.js',
  'website/components/footer-signal-art.js',
  'website/components/hero-video.js',
  'website/components/marketing-ui.js',
  'website/components/reveal.js',
  'website/components/route-content.js',
  'website/components/scene-controller.js',
  'website/components/scenic-detail-page.js',
  'website/components/scenic-illustration.js',
  'website/components/scenic-tones.js',
  'website/components/site-data.js',
  'website/components/site-footer.js',
  'website/components/site-header.js',
  'website/components/site-shell-data.js',
  'website/components/theme-toggle.js'
];

const expectedCounts = new Map([
  ['build.js', 29],
  ['scripts/audit-proof-drift.mjs', 12],
  ['scripts/build-extension-ui.mjs', 2],
  ['scripts/build-nanah-vendor.mjs', 4],
  ['scripts/run-test-lane.mjs', 22],
  ['scripts/sync-native-runtime.mjs', 0],
  ['scripts/test-lane-config.mjs', 0],
  ['website/app/[slug]/page.js', 3],
  ['website/app/downloads/page.js', 3],
  ['website/app/layout.js', 1],
  ['website/app/not-found.js', 1],
  ['website/app/page.js', 3],
  ['website/app/privacy/page.js', 5],
  ['website/app/robots.js', 1],
  ['website/app/sitemap.js', 1],
  ['website/app/terms/page.js', 1],
  ['website/components/browser-logo-rail.js', 1],
  ['website/components/footer-signal-art.js', 20],
  ['website/components/hero-video.js', 2],
  ['website/components/marketing-ui.js', 5],
  ['website/components/reveal.js', 1],
  ['website/components/route-content.js', 0],
  ['website/components/scene-controller.js', 5],
  ['website/components/scenic-detail-page.js', 3],
  ['website/components/scenic-illustration.js', 3],
  ['website/components/scenic-tones.js', 1],
  ['website/components/site-data.js', 0],
  ['website/components/site-footer.js', 2],
  ['website/components/site-header.js', 3],
  ['website/components/site-shell-data.js', 0],
  ['website/components/theme-toggle.js', 8]
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(rel));
    } else if (/\.(?:js|mjs)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lexicalCallableCount(source) {
  const matcher = /(?:^|\n)\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?[A-Za-z_$][\w$]*\s*=>/g;
  return [...source.matchAll(matcher)].length;
}

function lineCount(source) {
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function countLiteral(source, token) {
  return source.split(token).length - 1;
}

function groupForBuildMethod(name) {
  if (name === 'filterFunc') return 'packageCopySurface';
  if (name === 'main') return 'packageBuildOrchestration';
  if (name === 'ensureCollabDialogScriptOrder') return 'manifestRewriteSurface';
  if (name === 'createZip') return 'zipArtifactCreation';
  if ([
    'maybeCollectMobileArtifacts',
    'resolveMobileArtifactPromptDir',
    'resolveDefaultMobileArtifactsDir',
    'parseMobileArtifactName',
    'summarizeMobileArtifacts',
    'selectLatestMobileArtifacts',
    'extractAndroidVersionCode',
    'sha256File'
  ].includes(name)) return 'mobileArtifactStaging';
  if (['extractLatestChangelogEntry', 'deriveSubtitle', 'buildReleaseTitle', 'buildReleaseBody', 'assetLink', 'releaseAssetLink'].includes(name)) return 'releaseBodyGeneration';
  if (['maybePromptRelease', 'createGitHubRelease', 'uploadReleaseAsset', 'contentTypeForAsset', 'httpRequest'].includes(name)) return 'releasePublication';
  if (['promptYesNo', 'promptText'].includes(name)) return 'interactivePromptSurface';
  if (['updateReadmeBadges', 'formatLoC', 'shouldCountInTotalLoC', 'sumFileLines'].includes(name)) return 'readmeBadgeMutation';
  return 'UNCLASSIFIED';
}

function buildMethodRows() {
  const rows = [];
  read('build.js').split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    let match = line.match(/^(async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      const name = match[2];
      rows.push({
        file: 'build.js',
        line: lineNumber,
        kind: match[1] ? 'asyncFunction' : 'function',
        name,
        group: groupForBuildMethod(name)
      });
      return;
    }

    match = line.match(/^\s*const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/);
    if (match) {
      const name = match[1];
      rows.push({
        file: 'build.js',
        line: lineNumber,
        kind: 'arrowFunction',
        name,
        group: groupForBuildMethod(name)
      });
    }
  });
  return rows;
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) counts[row[key]] = (counts[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(counts).sort());
}

test('build/website callable audit accounts for every current build and website source file', () => {
  const currentFiles = [
    'build.js',
    ...walk('scripts'),
    ...walk('website/app'),
    ...walk('website/components')
  ].sort();

  assert.deepEqual(currentFiles, [...accountedFiles].sort());

  for (const file of accountedFiles) {
    assert.match(auditDoc, new RegExp(`\\\`${escapeRegex(file)}\\\``), `${file} must be cited in the build/website audit`);
  }

  assert.match(buildSemanticDoc, /Status: current-behavior register with a 2026-06-01 build prompt guard\s+addendum/);
  assert.match(buildSemanticDoc, /Extension runtime behavior is unchanged/);
  assert.match(buildSemanticDoc, /build prompt behavior changed/);
  assert.match(buildSemanticDoc, /build script: build\.js/);
  assert.match(buildSemanticDoc, /This is not completion proof/);
  assert.match(auditDoc, /Build Script Method Semantic Addendum - 2026-05-27/);
  assert.match(auditDoc, /FILTERTUBE_BUILD_SCRIPT_METHOD_SEMANTIC_REGISTER_2026-05-27\.md/);
  assert.match(auditDoc, /29 lexical callable rows across 9 semantic method groups/);
});

test('build/website callable counts match the current lexical source surface', () => {
  let total = 0;
  for (const file of accountedFiles) {
    const count = lexicalCallableCount(read(file));
    total += count;
    assert.equal(count, expectedCounts.get(file), `${file} callable count drifted`);
  }

  assert.equal(total, 142);
  assert.match(auditDoc, /\| Build and sync scripts \| 7 \| 69 \|/);
  assert.match(auditDoc, /\| Total \| 31 \| 142 \|/);

  const build = read('build.js');
  const buildRows = buildMethodRows();
  assert.equal(lineCount(build), 740);
  assert.equal(Buffer.byteLength(build), 26978);
  assert.equal(lexicalCallableCount(build), 29);
  assert.equal(buildRows.length, 29);
  assert.deepEqual(countBy(buildRows, 'kind'), {
    arrowFunction: 4,
    asyncFunction: 4,
    function: 21
  });
  assert.deepEqual(countBy(buildRows, 'group'), {
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

  for (const row of buildRows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.name} should be grouped`);
    assert.ok(
      buildSemanticDoc.includes(`| \`${row.file}\` | ${row.line} | \`${row.kind}\` | \`${row.name}\` | \`${row.group}\` |`),
      `missing build method row ${row.file}:${row.line}:${row.kind}:${row.name}`
    );
  }
});

test('build/website audit pins high-risk release and public claim patterns to current source', () => {
  const build = read('build.js');
  const vendor = read('scripts/build-nanah-vendor.mjs');
  const nativeSync = read('scripts/sync-native-runtime.mjs');
  const layout = read('website/app/layout.js');
  const downloads = read('website/app/downloads/page.js');
  const privacy = read('website/app/privacy/page.js');
  const routeContent = read('website/components/route-content.js');
  const browserRail = read('website/components/browser-logo-rail.js');
  const home = read('website/app/page.js');
  const sitemap = read('website/app/sitemap.js');

  assert.match(build, /await updateReadmeBadges\(VERSION\)/);
  assert.match(build, /fs\.writeFileSync\(readmePath, readme, 'utf8'\)/);
  assert.match(build, /draft: false/);
  assert.match(build, /for \(const assetPath of releaseAssetPaths\)/);
  assert.match(build, /fs\.writeFileSync\(checksumPath, `\$\{sha256File\(targetPath\)\}  \$\{fileName\}\\n`/);
  assert.match(build, /Non-interactive terminal detected; skipping release prompt/);

  assert.match(vendor, /path\.resolve\(rootDir, '\.\.', 'nanah'\)/);
  assert.match(vendor, /window\.FilterTubeNanah/);
  assert.match(nativeSync, /FILTERTUBE_APP_REPO/);
  assert.match(nativeSync, /tools", "sync-runtime-from-extension\.mjs"/);

  assert.match(layout, /@vercel\/analytics\/next/);
  assert.match(layout, /<Analytics \/>/);
  assert.match(privacy, /Vercel Analytics is not\s+included in the FilterTube browser extension, Android app,\s+iOS\/iPad app, or TV app path/);

  assert.match(downloads, /label: "Direct APK releases"/);
  assert.match(downloads, /href: latestReleaseHref/);
  assert.match(downloads, /signed release APK can be attached/);

  assert.match(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
  assert.match(browserRail, /src=\{browser\.logo\}/);

  const heroVideo = read('website/components/hero-video.js');
  assert.match(home, /<HeroVideo src=\{heroVideoUrl\} \/>/);
  assert.match(heroVideo, /preload="metadata"/);
  assert.match(heroVideo, /IntersectionObserver/);

  assert.match(sitemap, /lastModified: "2026-05-16"/);

  for (const finding of [
    'Release publishing is not atomic',
    'Normal builds mutate README',
    'Mobile artifact checksums exist, but there is no release manifest',
    'Vendor/protocol freshness is not proven',
    'Native app runtime freshness is not proven',
    'Third-party logo CDN',
    'Download claims need artifact gates',
    'Website media can affect low-end visitors'
  ]) {
    assert.match(auditDoc, new RegExp(escapeRegex(finding)));
  }

  assert.match(buildSemanticDoc, /build script line count: 740/);
  assert.match(buildSemanticDoc, /build script bytes: 26978/);
  assert.match(buildSemanticDoc, /lexical callable rows in this semantic slice: 29/);
  assert.match(buildSemanticDoc, /plain function declarations: 21/);
  assert.match(buildSemanticDoc, /async function declarations: 4/);
  assert.match(buildSemanticDoc, /arrow callable rows: 4/);
  assert.match(buildSemanticDoc, /semantic method groups: 9/);

  for (const [label, value] of [
    ['arrow token sites in build script', countLiteral(build, '=>')],
    ['require calls', [...build.matchAll(/\brequire\(/g)].length],
    ['await expressions', [...build.matchAll(/\bawait\b/g)].length],
    ['execSync occurrences', countLiteral(build, 'execSync')],
    ['fs.copySync occurrences', countLiteral(build, 'fs.copySync')],
    ['fs.copyFileSync occurrences', countLiteral(build, 'fs.copyFileSync')],
    ['fs.rmSync occurrences', countLiteral(build, 'fs.rmSync')],
    ['fs.writeJsonSync occurrences', countLiteral(build, 'fs.writeJsonSync')],
    ['fs.writeFileSync occurrences', countLiteral(build, 'fs.writeFileSync')],
    ['https.request occurrences', countLiteral(build, 'https.request')],
    ['readline.createInterface occurrences', countLiteral(build, 'readline.createInterface')],
    ['process.stdout.isTTY occurrences', countLiteral(build, 'process.stdout.isTTY')],
    ['draft false occurrences', countLiteral(build, 'draft: false')],
    ['MOBILE_ARTIFACT_FILE_RE occurrences', countLiteral(build, 'MOBILE_ARTIFACT_FILE_RE')],
    ['console callsites', [...build.matchAll(/console\./g)].length]
  ]) {
    assert.match(buildSemanticDoc, new RegExp(`${escapeRegex(label)}: ${value}`));
  }

  for (const token of [
    'normal npm run build mutates README.md badge URLs',
    'normal npm run build packages whole js/css/html/icons/data/assets roots',
    'non-TTY builds skip release publication instead of providing a CI release contract',
    'TTY release publication creates a public non-draft GitHub release before uploading assets',
    'manifest rewrite repairs collab_dialog load order but does not validate permission, host, world, or web-accessible drift',
    'ZIP creation ignores filesystem junk but does not write a checksum or expected-file manifest',
    'build failure sets process.exitCode but does not rollback README, dist, staged mobile artifacts, or created releases'
  ]) {
    assert.ok(buildSemanticDoc.includes(token), `missing build semantic boundary token ${token}`);
  }

  const futureFields = [
    'buildScriptMethodReference',
    'entrypointCommand',
    'cliArgs',
    'environmentInputs',
    'publicDocMutation',
    'releaseDraftState',
    'releaseAssetPreflight',
    'releaseUploadVerification',
    'releaseRollbackPlan',
    'checksumManifest',
    'packageFileManifest',
    'dirtyWorktreePolicy'
  ];
  for (const field of futureFields) {
    assert.match(buildSemanticDoc, new RegExp(field));
  }

  const currentSurfaces = [
    'build.js',
    'package.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'README.md',
    'data/release_notes.json',
    'scripts/build-extension-ui.mjs',
    'scripts/build-nanah-vendor.mjs',
    'scripts/sync-native-runtime.mjs'
  ].map(read).join('\n');
  for (const missingAuthority of [
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
    assert.match(buildSemanticDoc, new RegExp(missingAuthority));
    assert.doesNotMatch(currentSurfaces, new RegExp(missingAuthority));
  }
});
