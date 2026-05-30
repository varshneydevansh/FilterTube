import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDoc = fs.readFileSync(
  path.join(repoRoot, 'docs/audit/FILTERTUBE_STATIC_GENERATED_VENDOR_AUDIT_2026-05-18.md'),
  'utf8'
);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function refsFromHtml(file) {
  return [...read(file).matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map(match => match[1]);
}

function manifestCssFiles(file) {
  return (readJson(file).content_scripts || []).flatMap(script => script.css || []);
}

function webAccessibleResources(file) {
  return (readJson(file).web_accessible_resources || [])
    .flatMap(entry => entry.resources || []);
}

function assertAuditCites(file) {
  assert.match(
    auditDoc,
    new RegExp(`\\\`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\\``),
    `${file} must be cited in the static/generated/vendor audit`
  );
}

test('static/generated/vendor audit accounts for every current surface family', () => {
  for (const file of [
    'html/popup.html',
    'html/tab-view.html',
    'html/troubleshoot.html',
    'css/design_tokens.css',
    'css/components.css',
    'css/popup.css',
    'css/tab-view.css',
    'css/serene-shell.css',
    'css/filter.css',
    'css/content.css',
    'css/layout.css',
    'src/extension-shell/popup.jsx',
    'src/extension-shell/tab-view-decor.jsx',
    'src/extension-shell/shared/runtime.js',
    'js/ui-shell/popup-shell.js',
    'js/ui-shell/tab-view-decor.js',
    'js/vendor/nanah.bundle.js',
    'js/vendor/qrcode.bundle.js',
    'data/release_notes.json'
  ]) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `${file} should exist`);
    assertAuditCites(file);
  }
});

test('extension HTML pages expose current dependency order and external request surfaces', () => {
  const popupRefs = refsFromHtml('html/popup.html');
  const tabRefs = refsFromHtml('html/tab-view.html');

  assert.ok(popupRefs.indexOf('../js/settings_shared.js') < popupRefs.indexOf('../js/popup.js'));
  assert.ok(tabRefs.indexOf('../js/vendor/qrcode.bundle.js') < tabRefs.indexOf('../js/nanah_sync_adapter.js'));
  assert.ok(tabRefs.indexOf('../js/state_manager.js') < tabRefs.indexOf('../js/render_engine.js'));
  assert.ok(tabRefs.indexOf('../js/ui-shell/tab-view-decor.js') < tabRefs.indexOf('../js/tab-view.js'));

  assert.ok(popupRefs.some(ref => ref.startsWith('https://fonts.googleapis.com/')));
  assert.ok(tabRefs.some(ref => ref.startsWith('https://fonts.googleapis.com/')));
  assert.ok(tabRefs.includes('https://www.filtertube.in/downloads'));
  assert.ok(tabRefs.includes('https://nanah-signaling.varshney-devansh614.workers.dev/'));
  assert.ok(tabRefs.includes('https://github.com/varshneydevansh/nanah'));
  assert.ok(tabRefs.some(ref => ref.startsWith('https://support.google.com/youtubekids/')));

  assert.equal(fs.statSync(path.join(repoRoot, 'html/troubleshoot.html')).size, 0);
  assert.match(auditDoc, /Extension HTML Load Order/);
  assert.match(auditDoc, /External Requests From Extension Pages/);
});

test('quarantined YouTube CSS contains broad default-hide rules but is not manifest-loaded', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(manifestCssFiles(manifestFile), [], `${manifestFile} should not manifest-load content CSS`);
  }

  assert.match(read('css/filter.css'), /ytd-video-renderer,\s*\nytd-compact-video-renderer/s);
  assert.match(read('css/filter.css'), /display:\s*none\s*!important/);
  assert.match(read('css/content.css'), /\.yt-lockup-view-model-wiz__content-image,\s*\nyt-collection-thumbnail-view-model\s*\{\s*display:\s*none\s*!important/s);
  assert.match(read('css/layout.css'), /ytd-rich-item-renderer:not\(\.filter-tube-visible\)/);
  assert.ok((read('css/layout.css').match(/!important/g) || []).length >= 300);

  assert.match(auditDoc, /Quarantined YouTube CSS Risk/);
});

test('generated shell source and generated output share markers but have no committed freshness manifest', () => {
  const popupSource = read('src/extension-shell/popup.jsx');
  const tabSource = read('src/extension-shell/tab-view-decor.jsx');
  const runtimeSource = read('src/extension-shell/shared/runtime.js');
  const popupOutput = read('js/ui-shell/popup-shell.js');
  const tabOutput = read('js/ui-shell/tab-view-decor.js');

  for (const marker of ['homepage_hero_day.mp4', 'popupRoot']) {
    assert.match(popupSource, new RegExp(marker));
    assert.match(popupOutput, new RegExp(marker));
  }
  assert.match(tabSource, /tabViewShellDecor/);
  assert.match(tabOutput, /tabViewShellDecor/);
  assert.match(runtimeSource, /ft-extension-surface/);
  assert.match(popupOutput, /ft-extension-surface/);
  assert.match(tabOutput, /ft-extension-surface/);

  for (const absentManifest of [
    'generated-artifacts.json',
    'release-artifacts/manifest.json',
    'js/ui-shell/generated-manifest.json'
  ]) {
    assert.equal(fs.existsSync(path.join(repoRoot, absentManifest)), false, `${absentManifest} is not committed today`);
  }

  assert.match(auditDoc, /Generated UI Shell Boundary/);
});

test('vendor globals, staged release notes, and browser resource parity are pinned', () => {
  assert.match(read('js/vendor/nanah.bundle.js'), /window\.FilterTubeNanah/);
  assert.match(read('js/vendor/qrcode.bundle.js'), /var FilterTubeQrCode\s*=/);

  const releaseNotes = readJson('data/release_notes.json');
  const firstReleaseNote = releaseNotes.find(entry => entry && entry.version);
  assert.equal(firstReleaseNote.version, '3.3.2');
  assert.match(firstReleaseNote.headline, /^Upcoming:/);
  assert.equal(readJson('package.json').version, '3.3.1');

  assert.ok(webAccessibleResources('manifest.json').includes('icons/file.svg'));
  assert.ok(webAccessibleResources('manifest.chrome.json').includes('icons/file.svg'));
  assert.ok(webAccessibleResources('manifest.firefox.json').includes('icons/file.svg'));
  assert.equal(webAccessibleResources('manifest.opera.json').includes('icons/file.svg'), false);

  assert.match(auditDoc, /Vendor Bundle Boundary/);
});
