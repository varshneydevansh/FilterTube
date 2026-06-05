import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_STATIC_HTML_SUPPORT_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function bytes(file) {
  return fs.statSync(path.join(repoRoot, file)).size;
}

function wcLines(file) {
  const source = read(file);
  return (source.match(/\n/g) || []).length;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function scriptSources(html) {
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
}

function linkHrefs(html) {
  return [...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/g)].map(match => match[1]);
}

function ids(html) {
  return [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
}

function dataTabs(html) {
  return [...html.matchAll(/\bdata-tab=["']([^"']+)["']/g)].map(match => match[1]);
}

function externalUrls(html) {
  return [...html.matchAll(/https?:\/\/[^"'\s<>]+/g)].map(match => match[0]);
}

function targetBlankAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)].map(match => match[0]);
}

function gitTrackedSourceWithoutDocsAndTests() {
  return execFileSync('git', ['ls-files'], { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean)
    .filter(file => !file.startsWith('docs/') && !file.startsWith('tests/'))
    .filter(file => /\.(js|mjs|jsx|json|html|swift)$/.test(file) || file === 'build.js' || file === 'package.json')
    .map(read)
    .join('\n');
}

test('static html support script surface doc is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an\s+implementation patch/);
  assert.match(doc, /not covered\s+well by method-only source registers/);

  for (const [file, lines, byteCount, hash] of [
    ['html/popup.html', 31, 1213, 'c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31'],
    ['html/tab-view.html', 1601, 136371, 'accda6df396aea61d154936bd3b885e0db18e543cd34fa9945f31d536601219d'],
    ['html/troubleshoot.html', 0, 0, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['scripts/compress-video.swift', 97, 3339, '196c1ebf918b94e3d36fd2bd04658c4fa4762a85ad5657b49ede7aaa93e2e36b']
  ]) {
    assert.equal(wcLines(file), lines, `${file} line count drift`);
    assert.equal(bytes(file), byteCount, `${file} byte count drift`);
    assert.equal(sha256(file), hash, `${file} hash drift`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(formatNumber(lines)));
    assert.match(doc, new RegExp(formatNumber(byteCount)));
    assert.match(doc, new RegExp(hash));
  }
});

test('popup and dashboard html loader order is current source not authority backed', () => {
  const popup = read('html/popup.html');
  const tabView = read('html/tab-view.html');

  assert.deepEqual(linkHrefs(popup), [
    '../css/design_tokens.css',
    '../css/components.css',
    '../css/popup.css',
    '../css/serene-shell.css',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  ]);
  assert.deepEqual(scriptSources(popup), [
    '../js/settings_shared.js',
    '../js/content_controls_catalog.js',
    '../js/ui_components.js',
    '../js/security_manager.js',
    '../js/io_manager.js',
    '../js/state_manager.js',
    '../js/render_engine.js',
    '../js/ui-shell/popup-shell.js',
    '../js/popup.js'
  ]);
  assert.equal(ids(popup).length, 1);
  assert.equal(ids(popup)[0], 'popupRoot');
  assert.equal(dataTabs(popup).length, 0);
  assert.equal(targetBlankAnchors(popup).length, 0);

  assert.deepEqual(linkHrefs(tabView), [
    '../css/design_tokens.css',
    '../css/components.css',
    '../css/tab-view.css',
    '../css/serene-shell.css',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  ]);
  assert.deepEqual(scriptSources(tabView), [
    '../js/settings_shared.js',
    '../js/security_manager.js',
    '../js/managed_admin_authority.js',
    '../js/io_manager.js',
    '../js/vendor/qrcode.bundle.js',
    '../js/vendor/nanah.bundle.js',
    '../js/nanah_sync_adapter.js',
    '../js/nanah_managed_mailbox_client.js',
    '../js/nanah_managed_live_policy.js',
    '../js/nanah_managed_open_sync.js',
    '../js/content_controls_catalog.js',
    '../js/ui_components.js',
    '../js/state_manager.js',
    '../js/render_engine.js',
    '../js/ui-shell/tab-view-decor.js',
    '../js/managed_parent_command_center.js',
    '../js/tab-view.js'
  ]);

  for (const manifest of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const parsed = JSON.parse(read(manifest));
    assert.equal(parsed.action.default_popup, 'html/popup.html', `${manifest} popup path drift`);
    assert.equal(parsed.content_security_policy, undefined, `${manifest} now has a root CSP field`);
  }

  const openers = [
    'js/background.js',
    'js/popup.js',
    'js/content/release_notes_prompt.js'
  ].map(read).join('\n');
  for (const url of [
    'html/tab-view.html',
    'html/tab-view.html?view=kids&section=content',
    'html/tab-view.html?view=filters&section=categories',
    'html/tab-view.html?view=whatsnew'
  ]) {
    assert.ok(openers.includes(url), `missing current tab-view opener ${url}`);
  }
});

test('dashboard external navigation and route surface remain explicit current source', () => {
  const tabView = read('html/tab-view.html');
  const tabIds = ids(tabView);
  const tabs = dataTabs(tabView);
  const urls = externalUrls(tabView);
  const anchors = targetBlankAnchors(tabView);

  assert.equal(tabIds.length, 106);
  assert.equal(new Set(tabIds).size, 106);
  assert.deepEqual(tabs, [
    'dashboard',
    'filters',
    'semantic',
    'kids',
    'settings',
    'sync',
    'whatsnew',
    'help',
    'donate'
  ]);
  assert.match(tabView, /data-tab="semantic" hidden aria-hidden="true" data-feature-state="future"/);

  assert.equal(urls.length, 8);
  assert.equal(new Set(urls).size, 7);
  for (const url of [
    'https://filtertube.in',
    'https://www.filtertube.in/downloads',
    'https://nanah-signaling.varshney-devansh614.workers.dev/',
    'https://github.com/varshneydevansh/nanah',
    'https://support.google.com/youtubekids/answer/7178746?hl=en#zippy=%2Cunblock-individual-channels-from-youtube-using-your-linked-parent-account',
    'https://support.google.com/youtubekids/answer/7178746?hl=en'
  ]) {
    assert.ok(urls.includes(url), `missing external URL ${url}`);
  }

  assert.equal(anchors.length, 7);
  assert.equal(anchors.filter(anchor => anchor.includes('rel="noreferrer"')).length, 2);
  assert.equal(anchors.filter(anchor => anchor.includes('rel="noopener noreferrer"')).length, 4);
  assert.equal(anchors.filter(anchor => !/\brel=/.test(anchor)).length, 1);
  assert.match(anchors.find(anchor => !/\brel=/.test(anchor)) || '', /href="https:\/\/filtertube\.in"/);
});

test('troubleshoot html is empty and has no current product source opener', () => {
  assert.equal(read('html/troubleshoot.html'), '');

  const productOpeners = [
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'build.js',
    'package.json',
    'js/background.js',
    'js/popup.js',
    'js/content/release_notes_prompt.js'
  ].map(read).join('\n');

  assert.doesNotMatch(productOpeners, /html\/troubleshoot\.html/);
  assert.doesNotMatch(productOpeners, /troubleshoot\.html/);
});

test('compress-video swift deletes existing output before export and lacks dry-run atomic contract', () => {
  const source = read('scripts/compress-video.swift');
  const pkg = JSON.parse(read('package.json'));
  const scripts = Object.values(pkg.scripts || {}).join('\n');

  for (const preset of [
    'AVAssetExportPreset640x480',
    'AVAssetExportPreset960x540',
    'AVAssetExportPreset1280x720',
    'AVAssetExportPresetMediumQuality'
  ]) {
    assert.ok(source.includes(preset), `missing preset ${preset}`);
  }

  assert.match(source, /exporter\.shouldOptimizeForNetworkUse = true/);
  assert.match(source, /try await exporter\.export\(to: outputURL, as: \.mp4\)/);
  assert.match(source, /exporter\.exportAsynchronously/);
  assert.match(source, /DispatchSemaphore/);

  const removeIndex = source.indexOf('try fileManager.removeItem(at: outputURL)');
  const fileTypeIndex = source.indexOf('exporter.supportedFileTypes.contains(.mp4)');
  const asyncExportIndex = source.indexOf('try await exporter.export(to: outputURL, as: .mp4)');
  assert.ok(removeIndex > -1, 'missing existing-output deletion');
  assert.ok(fileTypeIndex > -1, 'missing supported file type check');
  assert.ok(asyncExportIndex > -1, 'missing async export path');
  assert.ok(removeIndex < fileTypeIndex, 'output deletion no longer happens before .mp4 support check');
  assert.ok(removeIndex < asyncExportIndex, 'output deletion no longer happens before export');

  assert.doesNotMatch(source, /\bdryRun\b|--dry-run|\btemporary\b|\.moveItem\b|replaceItem/);
  assert.doesNotMatch(scripts, /compress-video/);
});

test('product source lacks static html support script authority symbols', () => {
  const source = gitTrackedSourceWithoutDocsAndTests();

  for (const missingAuthority of [
    'staticHtmlSurfaceAuthority',
    'extensionHtmlLoaderOrderManifest',
    'extensionHtmlCspResourceReport',
    'extensionHtmlRouteStateReport',
    'extensionHtmlExternalNavigationReport',
    'extensionHtmlSmokeFixture',
    'troubleshootHtmlSurfaceDecision',
    'compressVideoScriptAuthority',
    'compressVideoDryRunContract',
    'compressVideoAtomicOutputContract',
    'supportScriptFailureModeReport'
  ]) {
    assert.doesNotMatch(source, new RegExp(missingAuthority));
  }
});
