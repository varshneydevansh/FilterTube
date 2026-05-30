import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
}

function manifestCssFiles(file) {
  return (readJson(file).content_scripts || []).flatMap(script => script.css || []);
}

test('CSS style hide audit documents live style authority and quarantined legacy CSS', () => {
  const doc = read('docs/audit/FILTERTUBE_CSS_STYLE_HIDE_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Current Style Authority Map',
    'Manifest content CSS',
    'Build-packaged `css/` directory',
    'Runtime hide helper style',
    'Runtime content-control style',
    'Class Model Drift',
    'filtertube-style',
    'filtertube-content-controls-style',
    'filtertube-fallback-menu-style'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('current manifests do not load CSS content scripts on YouTube surfaces', () => {
  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(manifestCssFiles(manifestFile), [], `${manifestFile} should not content-load CSS`);
  }
});

test('release build still packages css directory even though content CSS is not manifest-loaded', () => {
  const build = read('build.js');

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);
  assert.match(build, /const zipPath = await createZip\(browser, targetDir, versionForZip\)/);
  assert.match(build, /function createZip\(browser, sourceDir, version\)/);
  assert.match(build, /archive\.glob\('\*\*\/\*', \{/);
});

test('legacy CSS files use old default-hide and filter-tube-visible reveal model', () => {
  const expected = {
    'css/filter.css': { displayNoneImportant: 5, oldReveal: 5, newHidden: 0 },
    'css/content.css': { displayNoneImportant: 6, oldReveal: 5, newHidden: 0 },
    'css/layout.css': { displayNoneImportant: 11, oldReveal: 62, newHidden: 6 }
  };

  for (const [file, counts] of Object.entries(expected)) {
    const text = read(file);
    assert.equal(count(text, /display:\s*none\s*!important/g), counts.displayNoneImportant, `${file}: display none count drift`);
    assert.equal(count(text, /:not\(\.filter-tube-visible\)/g), counts.oldReveal, `${file}: old reveal count drift`);
    assert.equal(count(text, /filtertube-hidden/g), counts.newHidden, `${file}: new hidden class count drift`);
  }

  assert.match(read('css/filter.css'), /^ytd-video-renderer,\s*\nytd-compact-video-renderer,/m);
  assert.match(read('css/layout.css'), /ytd-rich-item-renderer:not\(\.filter-tube-visible\)/);
});

test('active runtime hide helper injects current filtertube-hidden model and not legacy reveal CSS', () => {
  const text = read('js/content/dom_helpers.js');
  const block = sliceBetween(text, 'function ensureStyles() {', '/**\n * Toggles visibility');

  assert.match(block, /style\.id = 'filtertube-style'/);
  assert.match(block, /\.filtertube-hidden \{ display: none !important; \}/);
  assert.match(block, /\.filtertube-hidden-shelf \{ display: none !important; \}/);
  assert.match(block, /filtertube-pending-shimmer/);
  assert.doesNotMatch(block, /filter-tube-visible/);
  assert.doesNotMatch(block, /ytd-video-renderer,\s*\nytd-compact-video-renderer/);
});

test('dynamic content-control style can own broad content hides and must be tied to settings', () => {
  const text = read('js/content/dom_fallback.js');
  const block = sliceBetween(text, 'function ensureContentControlStyles(settings) {', 'function hideYouTubeOpenAppButtons() {');

  assert.match(block, /styleId = 'filtertube-content-controls-style'/);
  assert.match(block, /style\.textContent = rules\.join\('\\n'\)/);
  assert.match(block, /ytm-button-renderer a\[href\^="intent:\/\/"\]/);
  assert.match(block, /if \(settings\.hideHomeFeed\)/);
  assert.match(block, /if \(settings\.hidePlaylistCards\)/);
  assert.match(block, /if \(settings\.hideMixPlaylists\)/);
  assert.match(block, /if \(settings\.hideMembersOnly\)/);
  assert.match(block, /ytd-watch-flexy:has\(\.yt-badge-shape--membership\)/);
  assert.match(block, /if \(settings\.hideEndscreenVideowall\)/);
  assert.match(block, /if \(settings\.hideEndscreenCards\)/);
  assert.equal(count(block, /display:\s*none\s*!important/g), 26);
  assert.doesNotMatch(block, /filter-tube-visible/);
});

test('fallback menu style is dynamically injected but does not contain content hide rules', () => {
  const text = read('js/content_bridge.js');
  const block = sliceBetween(text, 'function ensureFallbackMenuButtons() {', 'let playlistFallbackPopoverState = null;');

  assert.match(block, /styleId = 'filtertube-fallback-menu-style'/);
  assert.match(block, /style\.textContent = `/);
  assert.match(block, /\.filtertube-playlist-menu-fallback-btn/);
  assert.equal(count(block, /display:\s*none\s*!important/g), 0);
  assert.doesNotMatch(block, /ytd-video-renderer/);
  assert.doesNotMatch(block, /filter-tube-visible/);
});
