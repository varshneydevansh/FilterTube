import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_QUARANTINED_CONTENT_CSS_PACKAGE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';
const quarantinedCssRows = [
  ['css/content.css', 385, 12890, '442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b', 45, 113, 6, 5, 35, 0, 0, 0, 0, 0, 1],
  ['css/filter.css', 74, 2412, 'e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032', 6, 12, 5, 5, 6, 0, 0, 0, 1, 1, 1],
  ['css/layout.css', 803, 28581, '9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941', 86, 353, 11, 62, 126, 6, 14, 1, 7, 9, 8]
];
const activeManifestPaths = [
  'manifest.json',
  'manifest.chrome.json',
  'manifest.firefox.json',
  'manifest.opera.json'
];
const distManifestPaths = [
  'dist/chrome/manifest.json',
  'dist/firefox/manifest.json',
  'dist/opera/manifest.json'
];
const extensionHtmlPaths = [
  'html/popup.html',
  'html/tab-view.html',
  'html/troubleshoot.html'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function count(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

function manifestStats(paths) {
  const quarantinedFiles = new Set(quarantinedCssRows.map(([file]) => file));
  const stats = {
    manifestFiles: paths.length,
    contentScriptEntries: 0,
    contentScriptJsRefs: 0,
    contentScriptCssRefs: 0,
    webAccessibleEntries: 0,
    webAccessibleResourceRefs: 0,
    quarantinedCssContentScriptRefs: 0,
    quarantinedCssWebAccessibleRefs: 0
  };

  for (const manifestPath of paths) {
    const manifest = JSON.parse(read(manifestPath));
    for (const entry of manifest.content_scripts || []) {
      stats.contentScriptEntries += 1;
      for (const script of entry.js || []) stats.contentScriptJsRefs += 1;
      for (const css of entry.css || []) {
        stats.contentScriptCssRefs += 1;
        if (quarantinedFiles.has(css) || css === 'css/*' || css === '**/*') {
          stats.quarantinedCssContentScriptRefs += 1;
        }
      }
    }

    for (const entry of manifest.web_accessible_resources || []) {
      stats.webAccessibleEntries += 1;
      for (const resource of entry.resources || []) {
        stats.webAccessibleResourceRefs += 1;
        if (quarantinedFiles.has(resource) || resource === 'css/*' || resource === '**/*') {
          stats.quarantinedCssWebAccessibleRefs += 1;
        }
      }
    }
  }

  return stats;
}

function extensionHtmlLinkStats() {
  const stats = {
    htmlFiles: extensionHtmlPaths.length,
    linkTags: 0,
    quarantinedCssLinks: 0
  };

  for (const htmlPath of extensionHtmlPaths) {
    const links = [...read(htmlPath).matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/g)]
      .map(match => match[1]);
    stats.linkTags += links.length;
    stats.quarantinedCssLinks += links.filter(link => (
      link.includes('content.css') ||
      link.includes('filter.css') ||
      link.includes('layout.css')
    )).length;
  }

  return stats;
}

function productSource() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx', '*.css', '*.html', '*.json', '*.md'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('docs/audit/'))
    .map(read)
    .join('\n');
}

function productFilterTubeVisibleRows() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx', '*.css', '*.html', '*.json'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('docs/audit/'))
    .map(file => [file, count(read(file), /filter-tube-visible/g)])
    .filter(([, hits]) => hits > 0);
}

test('quarantined content CSS package boundary is audit-only and source scoped', () => {
  const text = doc();
  const totals = {
    lines: 0,
    bytes: 0,
    rules: 0,
    important: 0,
    displayNone: 0,
    notVisible: 0,
    visible: 0,
    hidden: 0,
    hasSelector: 0,
    clipPath: 0,
    pointerEventsNone: 0,
    visibilityHidden: 0,
    opacityZero: 0
  };

  assert.match(text, /Status: audit-only current-behavior package boundary/);
  assert.match(text, /Runtime, build, and\s+packaging behavior are unchanged/);
  assert.match(text, /This is not CSS deletion readiness/);
  assert.match(text, /Selected quarantined content CSS files: 3/);

  for (const [file, lines, bytes, hash, rules, important, displayNone, notVisible, visible, hidden, hasSelector, clipPath, pointerEventsNone, visibilityHidden, opacityZero] of quarantinedCssRows) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(fs.statSync(path.join(repoRoot, file)).size, bytes, `${file} bytes changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.equal(count(source, /{/g), rules, `${file} rule blocks changed`);
    assert.equal(count(source, /!important/g), important, `${file} important count changed`);
    assert.equal(count(source, /display\s*:\s*none\s*!important|display\s*:\s*none\s*;/gi), displayNone, `${file} display none count changed`);
    assert.equal(count(source, /:not\(\.filter-tube-visible\)/g), notVisible, `${file} old reveal selector count changed`);
    assert.equal(count(source, /filter-tube-visible/g), visible, `${file} old visible token count changed`);
    assert.equal(count(source, /filtertube-hidden/g), hidden, `${file} current hidden token count changed`);
    assert.equal(count(source, /:has\(/g), hasSelector, `${file} :has count changed`);
    assert.equal(count(source, /clip-path/g), clipPath, `${file} clip-path count changed`);
    assert.equal(count(source, /pointer-events\s*:\s*none/g), pointerEventsNone, `${file} pointer-events count changed`);
    assert.equal(count(source, /visibility\s*:\s*hidden/g), visibilityHidden, `${file} visibility count changed`);
    assert.equal(count(source, /opacity\s*:\s*0/g), opacityZero, `${file} opacity count changed`);
    assert.ok(text.includes(`| \`${file}\` |`), `doc should list ${file}`);
    assert.ok(text.includes(hash), `doc should pin ${file} hash`);

    totals.lines += lines;
    totals.bytes += bytes;
    totals.rules += rules;
    totals.important += important;
    totals.displayNone += displayNone;
    totals.notVisible += notVisible;
    totals.visible += visible;
    totals.hidden += hidden;
    totals.hasSelector += hasSelector;
    totals.clipPath += clipPath;
    totals.pointerEventsNone += pointerEventsNone;
    totals.visibilityHidden += visibilityHidden;
    totals.opacityZero += opacityZero;
  }

  assert.deepEqual(totals, {
    lines: 1262,
    bytes: 43883,
    rules: 137,
    important: 478,
    displayNone: 22,
    notVisible: 72,
    visible: 167,
    hidden: 6,
    hasSelector: 14,
    clipPath: 1,
    pointerEventsNone: 8,
    visibilityHidden: 10,
    opacityZero: 10
  });
  assert.match(text, /selected counted source lines: 1262/);
  assert.match(text, /selected source bytes: 43883/);
  assert.match(text, /selected lexical rule blocks: 137/);
  assert.match(text, /selected !important declarations: 478/);
});

test('quarantined content CSS is packaged but not manifest or extension HTML loaded', () => {
  const text = doc();
  const build = read('build.js');
  const activeStats = manifestStats(activeManifestPaths);
  const distStats = manifestStats(distManifestPaths);
  const htmlStats = extensionHtmlLinkStats();

  assert.deepEqual(activeStats, {
    manifestFiles: 4,
    contentScriptEntries: 7,
    contentScriptJsRefs: 55,
    contentScriptCssRefs: 0,
    webAccessibleEntries: 4,
    webAccessibleResourceRefs: 19,
    quarantinedCssContentScriptRefs: 0,
    quarantinedCssWebAccessibleRefs: 0
  });
  assert.deepEqual(distStats, {
    manifestFiles: 3,
    contentScriptEntries: 5,
    contentScriptJsRefs: 41,
    contentScriptCssRefs: 0,
    webAccessibleEntries: 3,
    webAccessibleResourceRefs: 14,
    quarantinedCssContentScriptRefs: 0,
    quarantinedCssWebAccessibleRefs: 0
  });
  assert.deepEqual(htmlStats, {
    htmlFiles: 3,
    linkTags: 10,
    quarantinedCssLinks: 0
  });

  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);

  for (const browser of ['chrome', 'firefox', 'opera']) {
    for (const [sourceFile] of quarantinedCssRows) {
      const distFile = `dist/${browser}/${sourceFile}`;
      assert.equal(fs.existsSync(path.join(repoRoot, distFile)), true, `${distFile} should exist`);
      assert.equal(sha256(distFile), sha256(sourceFile), `${distFile} should match source`);
    }
  }

  for (const token of [
    'active manifest files checked: 4',
    'active manifest content_script entries checked: 7',
    'active manifest content script JS refs checked: 55',
    'active manifest content script CSS refs checked: 0',
    'active manifest web_accessible_resources entries checked: 4',
    'active manifest web-accessible resource refs checked: 19',
    'active manifest quarantined CSS content script refs: 0',
    'active manifest quarantined CSS web-accessible refs: 0',
    'dist manifest files checked: 3',
    'dist manifest content_script entries checked: 5',
    'dist manifest content script JS refs checked: 41',
    'dist manifest content script CSS refs checked: 0',
    'dist manifest web_accessible_resources entries checked: 3',
    'dist manifest web-accessible resource refs checked: 14',
    'dist manifest quarantined CSS content script refs: 0',
    'dist manifest quarantined CSS web-accessible refs: 0',
    'extension HTML files checked: 3',
    'extension HTML link tags checked: 10',
    'extension HTML quarantined CSS link refs: 0',
    'packaged dist CSS copies: 9',
    'dist CSS copies hash-match source: yes'
  ]) {
    assert.ok(text.includes(token), `doc missing load/package token ${token}`);
  }
});

test('quarantined content CSS pins old reveal model and false-hide activation risk', () => {
  const text = doc();

  assert.match(read('css/filter.css'), /^ytd-video-renderer,\s*\nytd-compact-video-renderer,/m);
  assert.match(read('css/filter.css'), /\.filter-tube-visible\s*\{/);
  assert.match(read('css/layout.css'), /ytd-rich-section-renderer:has\(ytd-rich-shelf-renderer\[is-shorts\]\)/);
  assert.match(read('css/layout.css'), /ytd-rich-item-renderer:not\(\.filter-tube-visible\)/);
  assert.match(read('css/layout.css'), /ytd-video-renderer:not\(\.filter-tube-visible\)/);
  assert.match(read('css/content.css'), /\.filter-tube-visible/);
  assert.match(read('js/content/dom_helpers.js'), /\.filtertube-hidden \{ display: none !important; \}/);
  assert.match(read('js/content/dom_helpers.js'), /\.filtertube-hidden-shelf \{ display: none !important; \}/);

  assert.deepEqual(productFilterTubeVisibleRows(), [
    ['css/content.css', 35],
    ['css/filter.css', 6],
    ['css/layout.css', 126],
    ['js/layout.js', 32]
  ]);

  assert.match(text, /old quarantined model:/);
  assert.match(text, /default-hide renderer\/card families with :not\(\.filter-tube-visible\)/);
  assert.match(text, /current active runtime model:/);
  assert.match(text, /hide selected elements with \.filtertube-hidden \/ \.filtertube-hidden-shelf/);
  assert.match(text, /only one\s+remaining `filter-tube-visible` consumer: `js\/layout\.js` with 32 token\s+occurrences/);
  assert.match(text, /Accidental manifest activation could false-hide renderer families/);
  assert.match(text, /Silent deletion could hide package, dist, release, native parity, or fallback\s+dependency drift/);
});

test('quarantined content CSS package authority symbols remain absent from product source', () => {
  const text = doc();
  const source = productSource();

  for (const missing of [
    'quarantinedContentCssPackageBoundaryContract',
    'quarantinedContentCssManifestLoadReport',
    'quarantinedContentCssDistCopyParityReport',
    'quarantinedContentCssLegacyRevealPolicy',
    'quarantinedContentCssActivationFixtureProvenance',
    'quarantinedContentCssDeletionReadinessArtifact',
    'quarantinedContentCssNativeSyncParityReport',
    'quarantinedContentCssFalseHideFixtureReport',
    'quarantinedContentCssPackageCleanupGate',
    'quarantinedContentCssWebAccessiblePolicy'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(source.includes(missing), false, `${missing} should remain absent from product source`);
  }
});
