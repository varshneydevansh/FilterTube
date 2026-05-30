import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_EXTENSION_ICON_LOGO_PACKAGE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const manifestFiles = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json',
];

const selectedFiles = [
  ['icons/file.svg', 3818, '05cdc5bc1eeacc9530ec299f54e1c1465e4ba153e378b4ba845f8b3fcfc0cfff', null],
  ['icons/icon-128.png', 3406, '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755', { width: 128, height: 128 }],
  ['icons/icon-128.svg', 5434, 'c2168cc276e6070153b7ff7bb8298ed5b7f2291bc9919e70c665f90fd7d9da20', null],
  ['icons/icon-16.png', 805, '37170ccc769506289cf2e2f0460142bc0ab715208e6c4bf395e4871cd13dde6b', { width: 16, height: 16 }],
  ['icons/icon-32.png', 1396, '5e7b427aed06912c51fce9982bbbccc5b51b570f3c038c703f39d4816cbe75bf', { width: 32, height: 32 }],
  ['icons/icon-48.png', 1650, '87c4199c7734d686f875b5086a6e7d7979667cfd09b8291cbb480bb703870a53', { width: 48, height: 48 }],
  ['icons/icon-64.png', 2833, 'da1f8d1e10a4a9f2a81a81dae309b1c431de24040650243386a725a33e72de88', { width: 64, height: 64 }],
  ['website/app/icon.png', 3406, '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755', { width: 128, height: 128 }],
  ['website/assets/images/logo.png', 3406, '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755', { width: 128, height: 128 }],
  ['website/public/brand/logo.png', 3406, '2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755', { width: 128, height: 128 }],
];

const futureSymbols = [
  'extensionIconLogoPackageParityContract',
  'extensionIconManifestReferenceReport',
  'extensionIconWebAccessibleParityReport',
  'extensionIconPackageInclusionReport',
  'extensionIconInactiveAssetDecision',
  'websiteLogoDuplicateManifest',
  'websiteLogoRouteConsumerReport',
  'iconLogoReleaseArtifactParityReport',
  'iconLogoVisualFixtureProvenance',
  'iconLogoDeletionReadinessGate',
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

function count(source, needle) {
  return source.split(needle).length - 1;
}

test('extension icon logo package parity doc is audit-only and file fingerprint pinned', () => {
  const doc = read(docPath);
  const totalBytes = selectedFiles.reduce((sum, [file]) => sum + bytes(file), 0);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /icon replacement, package cleanup, website asset\s+migration, or release approval/);
  assert.match(doc, /10 tracked binary\/vector files and 29,560\s+bytes/);
  assert.equal(selectedFiles.length, 10);
  assert.equal(totalBytes, 29560);

  for (const [file, byteCount, hash, dimensions] of selectedFiles) {
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

  assert.match(read('icons/file.svg'), /viewBox="0 0 128 128"/);
  assert.match(read('icons/icon-128.svg'), /width="128" height="128"/);
});

test('duplicate 128px icon logo group remains byte-identical but not deletion-ready', () => {
  const doc = read(docPath);
  const duplicateGroup = [
    'icons/icon-128.png',
    'website/app/icon.png',
    'website/assets/images/logo.png',
    'website/public/brand/logo.png',
  ];
  const hashes = duplicateGroup.map(sha256);
  const groupBytes = duplicateGroup.reduce((sum, file) => sum + bytes(file), 0);

  assert.deepEqual([...new Set(hashes)], ['2ae3aa4258aab5165f16d02d1a3e721cef68a57cca63542d50543bc6f02b9755']);
  assert.equal(groupBytes, 13624);
  assert.equal(groupBytes - bytes('icons/icon-128.png'), 10218);
  assert.match(doc, /byte-identical across\s+`icons\/icon-128\.png`, `website\/app\/icon\.png`,\s+`website\/assets\/images\/logo\.png`, and `website\/public\/brand\/logo\.png`/);
  assert.match(doc, /group is 13,624 bytes/);
  assert.match(doc, /duplicate overhead beyond one retained copy is\s+10,218 bytes/);
  assert.match(doc, /not deletion-ready\s+because the files have different package and route roles/);
});

test('browser manifests keep current active icon references and web-accessible drift', () => {
  const doc = read(docPath);

  for (const manifestFile of manifestFiles) {
    const manifest = readJson(manifestFile);
    assert.deepEqual(manifest.action.default_icon, {
      16: 'icons/icon-16.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${manifestFile} action icon drifted`);
    assert.deepEqual(manifest.icons, {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    }, `${manifestFile} extension icon drifted`);
  }

  const actionIconRefs = manifestFiles
    .map(readJson)
    .reduce((sum, manifest) => sum + Object.keys(manifest.action.default_icon).length, 0);
  const extensionIconRefs = manifestFiles
    .map(readJson)
    .reduce((sum, manifest) => sum + Object.keys(manifest.icons).length, 0);
  assert.equal(actionIconRefs, 12);
  assert.equal(extensionIconRefs, 16);
  assert.equal(actionIconRefs + extensionIconRefs, 28);

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json']) {
    assert.equal(readJson(manifestFile).web_accessible_resources[0].resources.includes('icons/file.svg'), true);
  }
  assert.equal(readJson('manifest.opera.json').web_accessible_resources[0].resources.includes('icons/file.svg'), false);

  assert.match(doc, /28 active manifest icon references/);
  assert.match(doc, /12 action\s+icon entries and 16 extension icon entries/);
  assert.match(doc, /`manifest\.json`, `manifest\.chrome\.json`, and `manifest\.firefox\.json` expose\s+`icons\/file\.svg`/);
  assert.match(doc, /`manifest\.opera\.json` does not expose `icons\/file\.svg`/);
});

test('current package and source consumers keep inactive icon and website logo gaps explicit', () => {
  const doc = read(docPath);
  const build = read('build.js');
  const selectedTrackedSource = [
    'build.js',
    ...manifestFiles,
    'html/tab-view.html',
    'src/extension-shell/popup.jsx',
    'js/ui-shell/popup-shell.js',
    'website/app/layout.js',
    'website/components/site-header.js',
  ].map(read).join('\n');

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.equal(count(read('html/tab-view.html'), '../icons/icon-128.png'), 1);
  assert.equal(count(read('src/extension-shell/popup.jsx'), '../icons/icon-48.png'), 1);
  assert.equal(count(read('js/ui-shell/popup-shell.js'), '../icons/icon-48.png'), 1);
  assert.equal(count(read('website/app/layout.js'), '/brand/logo.png'), 2);
  assert.equal(count(read('website/components/site-header.js'), '/brand/logo.png'), 1);
  assert.equal(count(selectedTrackedSource, 'icons/icon-64.png'), 0);
  assert.equal(count(selectedTrackedSource, 'icons/icon-128.svg'), 0);
  assert.equal(count(selectedTrackedSource, 'website/assets/images/logo.png'), 0);

  assert.match(doc, /`icons\/icon-64\.png` and `icons\/icon-128\.svg` are copied into browser packages/);
  assert.match(doc, /selected tracked non-doc source does not\s+reference those paths today/);
  assert.match(doc, /`html\/tab-view\.html` references `\.\.\/icons\/icon-128\.png` once/);
  assert.match(doc, /`src\/extension-shell\/popup\.jsx` references `\.\.\/icons\/icon-48\.png` once/);
  assert.match(doc, /`js\/ui-shell\/popup-shell\.js` references `\.\.\/icons\/icon-48\.png` once/);
  assert.match(doc, /`website\/app\/layout\.js` references `\/brand\/logo\.png` twice/);
  assert.match(doc, /`website\/components\/site-header\.js` references `\/brand\/logo\.png` once/);
  assert.match(doc, /`website\/assets\/images\/logo\.png` is tracked and byte-identical to the served\s+public logo/);
});

test('future icon logo authority symbols are absent from selected product source', () => {
  const doc = read(docPath);
  const source = [
    'build.js',
    ...manifestFiles,
    'html/tab-view.html',
    'src/extension-shell/popup.jsx',
    'js/ui-shell/popup-shell.js',
    'website/app/layout.js',
    'website/components/site-header.js',
  ].map(read).join('\n');

  for (const symbol of futureSymbols) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(source, new RegExp(symbol));
  }

  assert.match(doc, /does not close tracked-file obligations/);
  assert.match(doc, /package artifact proof/);
  assert.match(doc, /manifest parity reports/);
  assert.match(doc, /native\/store parity proof/);
  assert.match(doc, /visual fixtures/);
  assert.match(doc, /deletion-readiness gate/);
});
