import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_EXTENSION_ASSET_DATA_PACKAGE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const staticGeneratedAssetFamilyDocs = [
  'docs/audit/FILTERTUBE_COMPRESS_VIDEO_SCRIPT_FAILURE_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_CSS_LOAD_STYLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_DESIGN_TOKEN_JSON_CSS_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_EXTENSION_ASSET_DATA_PACKAGE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_EXTENSION_ICON_LOGO_PACKAGE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_GENERATED_LOCAL_OUTPUT_DEPENDENCY_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_GENERATED_UI_SHELL_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
  'docs/audit/FILTERTUBE_IMMEDIACY_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_LEGACY_LAYOUT_QUARANTINE_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MEDIA_ASSET_DUPLICATE_DERIVATIVE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_PACKAGE_LOCK_SCRIPT_OPTIONAL_DEPENDENCY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_QUARANTINED_CONTENT_CSS_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md',
  'docs/audit/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md'
];
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

const assetRows = [
  ['assets/images/Android_icon.png', 2203736, '201e1b73771f39ad033241da2b20318aeaad1d81f72398b6099fc122d3df3cb0', { width: 1536, height: 1024 }],
  ['assets/images/iOS_icon.png', 1586597, 'f165dd8170531ba1f467ad7a8e5c54b2715c2559c5ea0c6688cfbf03e6763689', { width: 1536, height: 1024 }],
  ['assets/images/homepage_hero_day.mp4', 4537443, '9b1e853b60c861de124821161444ff54c0318b1a88f9c632a38128306811df74', null],
  ['icons/file.svg', 3818, '05cdc5bc1eeacc9530ec299f54e1c1465e4ba153e378b4ba845f8b3fcfc0cfff', null],
  ['icons/icon-128.png', 3406, '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755', { width: 128, height: 128 }],
  ['icons/icon-128.svg', 5434, 'c2168cc276e6070153b7ff7bb8298ed5b7f2291bc9919e70c665f90fd7d9da20', null],
  ['icons/icon-16.png', 805, '37170ccc769506289cf2e2f0460142bc0ab715208e6c4bf395e4871cd13dde6b', { width: 16, height: 16 }],
  ['icons/icon-32.png', 1396, '5e7b427aed06912c51fce9982bbbccc5b51b570f3c038c703f39d4816cbe75bf', { width: 32, height: 32 }],
  ['icons/icon-48.png', 1650, '87c4199c7734d686f875b5086a6e7d7979667cfd09b8291cbb480bb703870a53', { width: 48, height: 48 }],
  ['icons/icon-64.png', 2833, 'da1f8d1e10a4a9f2a81a81dae309b1c431de24040650243386a725a33e72de88', { width: 64, height: 64 }],
  ['data/release_notes.json', 23047, 'c9c860f17dae9f9f9e8d1536d3c0de72dd3b6bd917fc8d7fc725047adc421862', null],
  ['design/design_tokens.json', 1902, '57bada64f3690a22fedea5f07aadc029e129f971465f8c66baab4a005984b3f0', null],
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

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function sha256(file) {
  return crypto.createHash('sha256').update(readBuffer(file)).digest('hex');
}

function pngDimensions(file) {
  const buffer = readBuffer(file);
  assert.equal(buffer.slice(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} is not a PNG`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function mp4TopLevelBoxes(file) {
  const buffer = readBuffer(file);
  const boxes = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    if (size === 1) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
    }
    boxes.push({ type, size });
    if (!size) break;
    offset += size;
  }
  return boxes;
}

function count(source, needle) {
  return source.split(needle).length - 1;
}

test('extension asset data package surface doc is audit-only and fingerprint pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);
  const totalBytes = assetRows.reduce((sum, [file]) => sum + bytes(file), 0);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /asset optimization, package cleanup, release approval, or\s+design-token migration/);
  assert.match(doc, /12 files and 8,372,067 bytes/);
  assert.equal(assetRows.length, 12);
  assert.equal(totalBytes, 8372067);

  assert.equal(assetRows.filter(([file]) => file.startsWith('assets/images/')).reduce((sum, [file]) => sum + bytes(file), 0), 8327776);
  assert.equal(assetRows.filter(([file]) => file.startsWith('icons/')).reduce((sum, [file]) => sum + bytes(file), 0), 19342);

  for (const [file, byteCount, hash, dimensions] of assetRows) {
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(byteCount.toLocaleString('en-US')));
    assert.match(doc, new RegExp(hash));
    if (dimensions) {
      assert.deepEqual(pngDimensions(file), dimensions, `${file} dimensions drifted`);
      assert.match(doc, new RegExp(`${dimensions.width}x${dimensions.height}`));
    }
  }

  assert.deepEqual(mp4TopLevelBoxes('assets/images/homepage_hero_day.mp4'), [
    { type: 'ftyp', size: 28 },
    { type: 'moov', size: 4277 },
    { type: 'mdat', size: 4533138 },
  ]);
  assert.match(read('icons/file.svg'), /viewBox="0 0 128 128"/);
  assert.match(read('icons/icon-128.svg'), /width="128" height="128"/);

  assert.match(methodGap, /repo-wide lexical callables: 5473/);
  assert.match(methodGap, /files with lexical accounting: 63/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5473/);

  assert.equal(staticGeneratedAssetFamilyDocs.length, 14);
  for (const familyDocPath of staticGeneratedAssetFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 63/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5473/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5473/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }
});

test('build and manifests currently package assets data icons but not design input', () => {
  const build = read('build.js');
  const manifests = manifestFiles.map((file) => [file, readJson(file)]);
  const manifestText = manifestFiles.map(read).join('\n');

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.doesNotMatch(build, /COMMON_DIRS = \[[^\]]*'design'/);

  for (const [file, manifest] of manifests) {
    assert.deepEqual(manifest.action.default_icon, {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${file} action icons drifted`);
    assert.deepEqual(manifest.icons, {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${file} extension icons drifted`);
  }

  assert.doesNotMatch(manifestText, /icons\/icon-64\.png/);
  assert.doesNotMatch(manifestText, /icons\/icon-128\.svg/);
  assert.equal(readJson('manifest.opera.json').web_accessible_resources[0].resources.includes('icons/file.svg'), false);
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json']) {
    assert.equal(readJson(file).web_accessible_resources[0].resources.includes('icons/file.svg'), true, `${file} should expose icons/file.svg today`);
  }

  assert.match(docPath && read(docPath), /`icons\/icon-64\.png` and `icons\/icon-128\.svg` are copied into browser packages/);
  assert.match(read(docPath), /`icons\/file\.svg` is web-accessible in `manifest\.json`, `manifest\.chrome\.json`,\s+and `manifest\.firefox\.json`, but not in `manifest\.opera\.json`/);
});

test('extension UI asset consumers are source-derived and lack optimization authority', () => {
  const popupSource = read('src/extension-shell/popup.jsx');
  const tabDecorSource = read('src/extension-shell/tab-view-decor.jsx');
  const popupOutput = read('js/ui-shell/popup-shell.js');
  const tabDecorOutput = read('js/ui-shell/tab-view-decor.js');
  const tabHtml = read('html/tab-view.html');
  const doc = read(docPath);

  for (const source of [popupSource, tabDecorSource, popupOutput, tabDecorOutput]) {
    assert.match(source, /\.\.\/assets\/images\/homepage_hero_day\.mp4/);
  }

  assert.match(popupSource, /autoPlay/);
  assert.match(popupSource, /loop/);
  assert.match(popupSource, /muted/);
  assert.match(popupSource, /playsInline/);
  assert.match(popupSource, /preload="metadata"/);
  assert.match(popupSource, /\.\.\/icons\/icon-48\.png/);
  assert.match(popupOutput, /\.\.\/icons\/icon-48\.png/);

  assert.equal(count(tabHtml, '../assets/images/Android_icon.png'), 2);
  assert.equal(count(tabHtml, '../assets/images/iOS_icon.png'), 2);
  assert.match(tabHtml, /href="https:\/\/www\.filtertube\.in\/downloads" target="_blank" rel="noreferrer"/);

  assert.match(doc, /4,537,443-byte ambient video/);
  assert.match(doc, /no current asset byte budget, reduced-motion fixture,\s+startup timing metric, or low-power fallback proof/);
  assert.match(doc, /large app PNGs are loaded directly; no thumbnail or responsive derivative\s+manifest exists today/);
});

test('release notes data is staged ahead of package version and loaded as packaged data', () => {
  const releaseNotes = readJson('data/release_notes.json');
  const versionRows = releaseNotes.filter((row) => row && row.version);
  const versions = versionRows.map((row) => row.version);
  const packageVersion = readJson('package.json').version;
  const doc = read(docPath);

  assert.equal(releaseNotes.length, 24);
  assert.equal(releaseNotes.filter((row) => row && row._comment).length, 1);
  assert.equal(versionRows.length, 23);
  assert.equal(versions[0], '3.3.2');
  assert.equal(packageVersion, '3.3.1');
  assert.ok(versions.includes(packageVersion));
  assert.equal(versionRows.filter((row) => row.detailsUrl).length, 22);
  assert.deepEqual(versionRows.filter((row) => !row.detailsUrl).map((row) => row.version), ['3.3.2']);
  assert.equal(versionRows.every((row) => Array.isArray(row.highlights)), true);

  for (const manifestFile of manifestFiles) {
    assert.equal(readJson(manifestFile).version, packageVersion, `${manifestFile} package version drifted`);
  }

  const background = read('js/background.js');
  const tabView = read('js/tab-view.js');
  assert.match(background, /browserAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(background, /async function buildReleaseNotesPayload\(version\)/);
  assert.match(tabView, /runtimeAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(tabView, /: 'data\/release_notes\.json'/);

  assert.match(doc, /first version row is staged `3\.3\.2`, while `package\.json` and all four\s+browser manifests currently remain `3\.3\.1`/);
  assert.match(doc, /native runtime sync\s+audit already records that the current app runtime manifest excludes\s+`data\/release_notes\.json`/);
});

test('design token JSON is not packaged and currently diverges from CSS tokens', () => {
  const design = readJson('design/design_tokens.json');
  const css = read('css/design_tokens.css');
  const doc = read(docPath);

  assert.deepEqual(design.metadata, {
    version: '0.1.0',
    updated: '2025-11-18',
    source: 'FilterTube neuroinclusive palette',
  });
  assert.deepEqual(Object.keys(design.colors), ['brand', 'background', 'text', 'interactive', 'status', 'semantic']);
  assert.equal(design.colors.brand.primaryRed, '#FF2F2F');
  assert.equal(css.includes('#FF2F2F'), false);
  assert.match(css, /--ft-color-brand-primary: #ab4438;/);

  const productAndBuildSource = [
    'build.js',
    'package.json',
    ...manifestFiles,
    'html/popup.html',
    'html/tab-view.html',
    'js/background.js',
    'js/tab-view.js',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
  ].map(read).join('\n');
  assert.doesNotMatch(productAndBuildSource, /design\/design_tokens\.json/);

  assert.match(doc, /`build\.js` does not copy `design`/);
  assert.match(doc, /Runtime HTML loads `css\/design_tokens\.css`, not the JSON file/);
  assert.match(doc, /JSON `colors\.brand\.primaryRed` value is `#FF2F2F`/);
  assert.match(doc, /`css\/design_tokens\.css` currently sets `--ft-color-brand-primary: #ab4438;`/);
});

test('extension asset data package surface has no runtime authority symbols yet', () => {
  const doc = read(docPath);
  const source = [
    'build.js',
    ...manifestFiles,
    'html/popup.html',
    'html/tab-view.html',
    'js/background.js',
    'js/tab-view.js',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'css/design_tokens.css',
  ].map(read).join('\n');

  for (const symbol of [
    'extensionAssetPackageAuthority',
    'extensionStaticAssetManifest',
    'extensionAssetByteBudget',
    'extensionMediaReducedMotionProof',
    'extensionIconManifestParityReport',
    'extensionWebAccessibleIconParityDecision',
    'extensionReleaseNotesSchemaAuthority',
    'extensionReleaseNotesVersionGate',
    'extensionDesignTokenParityReport',
    'extensionAssetDeletionReadinessReport',
  ]) {
    assert.match(doc, new RegExp(symbol));
    assert.equal(source.includes(symbol), false, `${symbol} should not exist in product source yet`);
  }

  assert.match(doc, /This register does not close tracked-file obligations/);
  assert.match(doc, /package artifact proof, byte and startup\s+budgets, visual fixtures, reduced-motion proof/);
});
