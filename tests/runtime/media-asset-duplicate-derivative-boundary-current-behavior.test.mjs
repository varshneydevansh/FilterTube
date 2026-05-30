import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MEDIA_ASSET_DUPLICATE_DERIVATIVE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const mp4Rows = [
  ['assets/images/homepage_hero_day.mp4', 4537443, '9b1e853b60c861de124821161444ff54c0318b1a88f9c632a38128306811df74'],
  ['website/assets/videos/homepage/day/homepage_hero_day.mp4', 12419424, '3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3'],
  ['website/public/videos/homepage/day/homepage_hero_day.mp4', 12419424, '3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3'],
  ['website/public/videos/homepage/homepage_hero_day.mp4', 12419424, '3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3'],
  ['website/assets/videos/ios/ios.mp4', 6152963, '6a6b2b08fe198440ca1e25695f3029d9311039d5ce3d75e30c171d4fe5ebd463'],
  ['website/public/videos/ios/ios_hero_slow_540.mp4', 2179940, '00da591840296f2c0005dbb83800a6987edad7efda1536cf7b20304f92ba78fc']
];

const textRows = [
  ['website/assets/videos/README.md', 61, 1681, 'c321b21761749792069312d52d297900071494d116c4a7af2a905f759e58137f'],
  ['website/assets/videos/homepage/dawn/prompt.txt', 13, 1441, 'ca487df5e75359a0fa8ceac72d43977351cdc223a179fcdcf2dd10ccbde1e4db'],
  ['website/assets/videos/homepage/night/prompt.txt', 13, 1439, 'a90a86b6bea54ef6a1275636d97d0b4ec57556378f595b56c7f053e42db9061e'],
  ['website/assets/videos/homepage/sunset/prompt.txt', 13, 1438, 'f67cbbea5c8abba14d2b4e4762681839a956776438e033b6bd01d5917354455a']
];

const authorityTokens = [
  'mediaAssetDuplicateDerivativeBoundaryContract',
  'mediaAssetProvenanceManifest',
  'mediaDerivativeManifest',
  'mediaByteBudgetReport',
  'mediaRouteConsumerReport',
  'extensionWebsiteMediaSplitPolicy',
  'mediaDuplicateCleanupGate',
  'mediaCompressionCommandProvenance',
  'mediaReducedMotionBudget',
  'mediaPackageSizeBudget',
  'mediaArtifactHashManifest'
];

function abs(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(abs(file), 'utf8');
}

function readBuffer(file) {
  return fs.readFileSync(abs(file));
}

function bytes(file) {
  return fs.statSync(abs(file)).size;
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function lineCount(file) {
  const source = read(file);
  return source.split(/\r?\n/).length - (source.endsWith('\n') ? 1 : 0);
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function trackedTextSourceForAuthorityScan() {
  return git(['ls-files'])
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => /\.(js|jsx|mjs|json|html|css|md|txt|swift|yml|yaml)$/.test(file) || file === 'build.js' || file === 'package.json')
    .map((file) => read(file))
    .join('\n');
}

function trackedWebsiteTextSource() {
  return git(['ls-files', 'website'])
    .filter((file) => /\.(js|mjs|json|css|md|txt|gitignore|vercelignore)$/.test(file))
    .map((file) => read(file))
    .join('\n');
}

test('media asset duplicate derivative boundary doc is audit-only and source pinned', () => {
  const doc = read(docPath);
  const totalMp4Bytes = mp4Rows.reduce((sum, [file]) => sum + bytes(file), 0);
  const totalTextBytes = textRows.reduce((sum, [file]) => sum + bytes(file), 0);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /asset optimization patch, website media\s+change, package cleanup, release approval, or public-claim gate/);
  assert.match(doc, /tracked media\/provenance files: 10/);
  assert.match(doc, /tracked MP4 files: 6/);
  assert.match(doc, /tracked MP4 bytes: 50,128,618/);
  assert.match(doc, /tracked media text\/provenance files: 4/);
  assert.match(doc, /tracked media text\/provenance bytes: 5,999/);
  assert.equal(totalMp4Bytes, 50128618);
  assert.equal(totalTextBytes, 5999);

  for (const [file, byteCount, hash] of mp4Rows) {
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
  }

  for (const [file, lines, byteCount, hash] of textRows) {
    assert.equal(lineCount(file), lines, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(`${lines}`));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
  }
});

test('media duplicate and derivative byte budgets remain current behavior facts', () => {
  const doc = read(docPath);
  const homepageHash = '3cf0edad24d9301bb3c43f3427996c8b364cd489a391c0d7ba917e58018b47f3';
  const homepageFiles = mp4Rows.filter(([, , hash]) => hash === homepageHash);
  const homepageBytes = homepageFiles.reduce((sum, [file]) => sum + bytes(file), 0);
  const duplicateOverhead = homepageBytes - bytes(homepageFiles[0][0]);
  const iosReduction = bytes('website/assets/videos/ios/ios.mp4') - bytes('website/public/videos/ios/ios_hero_slow_540.mp4');

  assert.equal(homepageFiles.length, 3);
  assert.equal(homepageBytes, 37258272);
  assert.equal(duplicateOverhead, 24838848);
  assert.equal(iosReduction, 3973023);

  assert.match(doc, /homepage duplicate group files: 3/);
  assert.match(doc, /homepage duplicate group bytes: 37,258,272/);
  assert.match(doc, /homepage duplicate overhead beyond one retained copy: 24,838,848/);
  assert.match(doc, /iOS derivative source bytes: 6,152,963/);
  assert.match(doc, /iOS derivative public bytes: 2,179,940/);
  assert.match(doc, /iOS derivative byte reduction: 3,973,023/);
  assert.match(doc, /one of\s+which is a public alias with no current source URL reference/);
});

test('media route consumers and extension package consumers are split today', () => {
  const doc = read(docPath);
  const build = read('build.js');
  const popupSource = read('src/extension-shell/popup.jsx');
  const tabDecorSource = read('src/extension-shell/tab-view-decor.jsx');
  const popupOutput = read('js/ui-shell/popup-shell.js');
  const tabDecorOutput = read('js/ui-shell/tab-view-decor.js');
  const routeContent = read('website/components/route-content.js');
  const websiteText = trackedWebsiteTextSource();

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);

  const extensionVideoRefs = [
    popupSource,
    tabDecorSource,
    popupOutput,
    tabDecorOutput
  ].reduce((sum, source) => sum + count(source, '../assets/images/homepage_hero_day.mp4'), 0);
  assert.equal(extensionVideoRefs, 4);

  assert.match(routeContent, /export const heroVideoUrl = "\/videos\/homepage\/day\/homepage_hero_day\.mp4"/);
  assert.match(routeContent, /src: "\/videos\/ios\/ios_hero_slow_540\.mp4"/);
  assert.equal(count(websiteText, '/videos/homepage/day/homepage_hero_day.mp4'), 2);
  assert.equal(count(websiteText, '/videos/ios/ios_hero_slow_540.mp4'), 1);
  assert.equal(count(websiteText, '/videos/homepage/homepage_hero_day.mp4'), 0);

  assert.match(doc, /extension ambient video source\/output references: 4/);
  assert.match(doc, /website served media URL references: 2/);
  assert.match(doc, /website unreferenced public homepage alias source references: 0/);
  assert.match(doc, /`build\.js` still copies the root `assets` directory/);
  assert.match(doc, /`website\/components\/route-content\.js` exports\s+`\/videos\/homepage\/day\/homepage_hero_day\.mp4`/);
  assert.match(doc, /uses `\/videos\/ios\/ios_hero_slow_540\.mp4`/);
});

test('media compression provenance is documentation-only and not wired into build paths', () => {
  const doc = read(docPath);
  const pkg = JSON.parse(read('package.json'));
  const build = read('build.js');
  const changelog = read('docs/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG.md');
  const nonDocTrackedSource = git(['ls-files'])
    .filter((file) => !file.startsWith('docs/'))
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => file !== 'scripts/compress-video.swift')
    .filter((file) => /\.(js|jsx|mjs|json|html|css|md|txt|swift)$/.test(file) || file === 'build.js' || file === 'package.json')
    .map((file) => read(file))
    .join('\n');

  assert.equal(Object.values(pkg.scripts || {}).filter((script) => script.includes('compress-video')).length, 0);
  assert.equal(count(build, 'compress-video'), 0);
  assert.equal(count(nonDocTrackedSource, 'compress-video.swift'), 0);
  assert.match(changelog, /ffmpeg -y -i website\/assets\/videos\/ios\/ios\.mp4/);
  assert.match(changelog, /website\/public\/videos\/ios\/ios_hero_slow_540\.mp4/);

  assert.match(doc, /package scripts referencing compress-video: 0/);
  assert.match(doc, /build\.js compress-video references: 0/);
  assert.match(doc, /tracked non-doc source callers outside scripts\/compress-video\.swift: 0/);
  assert.match(doc, /`docs\/WEBSITE_APP_RELEASE_SURFACE_CHANGELOG\.md` records an `ffmpeg` command/);
  assert.match(doc, /`scripts\/compress-video\.swift` is not called by\s+`package\.json`, `build\.js`, or tracked non-doc source/);
});

test('media asset duplicate derivative authority symbols remain absent from product source', () => {
  const doc = read(docPath);
  const source = trackedTextSourceForAuthorityScan();

  for (const token of authorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.equal(source.includes(token), false, `${token} should not exist in tracked product source yet`);
  }

  assert.match(doc, /No tracked product, website, build, or support source currently implements/);
  assert.match(doc, /This proof does not close the media optimization, package, website asset,\s+public-claim, or support-script rows/);
  assert.match(doc, /route\/render evidence/);
  assert.match(doc, /package\/deploy artifact proof/);
  assert.match(doc, /reduced-motion and startup budgets/);
  assert.match(doc, /derivative\s+command provenance/);
  assert.match(doc, /duplicate-cleanup gates/);
});
