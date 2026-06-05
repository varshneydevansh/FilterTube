import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CSS_LOAD_STYLE_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md';

const cssRows = [
  ['css/components.css', 'active extension UI shared CSS', 1686, 45567, 'db01d30c717e34c108e48d92807ce3df4bcafccace62a1808d86d03ed7047ebc', 240, 47, 1, 0, 0, 0, 5, 1, 0],
  ['css/content.css', 'packaged quarantined content CSS', 385, 12890, '442c6ad823ebed5075099036b057c29914b218b0bea9e823e9e0b216d771141b', 45, 113, 6, 5, 35, 0, 0, 0, 0],
  ['css/design_tokens.css', 'active extension UI token CSS', 301, 10361, '7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc', 12, 0, 0, 0, 0, 0, 1, 0, 0],
  ['css/filter.css', 'packaged quarantined content CSS', 74, 2412, 'e2462d446b1a3738d937945eabf013ec05173224970b0c877593901aba5a5032', 6, 12, 5, 5, 6, 0, 0, 0, 0],
  ['css/layout.css', 'packaged quarantined content CSS', 803, 28581, '9ae38491aeb2dc3a58027d4a005c6136042c66dc438786483285fdbd91cb1941', 86, 353, 11, 62, 126, 6, 0, 0, 0],
  ['css/popup.css', 'active extension popup CSS', 1151, 29731, '812cb4ba8b4c9be732bd8a2a6f7b06b5d8d0a8c3fb7416f391f475ae627d45fa', 182, 5, 3, 0, 0, 0, 2, 0, 1],
  ['css/serene-shell.css', 'active extension shell CSS', 3414, 87230, '785e988dd0176b16defcc08f77925de8eaa60ea831d53cd57147eb601c490f0a', 494, 39, 7, 0, 0, 0, 16, 1, 0],
  ['css/tab-view.css', 'active extension dashboard CSS', 2940, 71227, '4b080ea7a91f5fa8a1b555ddc40184b298151d99de7dfa03859fcf6a43510767', 438, 24, 14, 0, 0, 0, 12, 4, 2],
  ['website/app/globals.css', 'website-only global CSS', 486, 12528, '2b583fc11e8f5a3a6fa5113daebf71b91d46bf685b02c544727167cf9ed7f760', 69, 0, 0, 0, 0, 0, 1, 1, 0]
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

function manifestCssFiles(file) {
  return (readJson(file).content_scripts || []).flatMap((script) => script.css || []);
}

function productSource() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx', '*.css', '*.html', '*.json'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('docs/audit/'))
    .map(read)
    .join('\n');
}

test('CSS load style surface register is audit-only and covers every tracked CSS file', () => {
  const doc = read(docPath);
  const trackedCss = git(['ls-files', '*.css']);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not a CSS cleanup, UI redesign, manifest change, or package pruning patch/);
  assert.equal(trackedCss.length, 9);
  assert.deepEqual(trackedCss.sort(), cssRows.map(([file]) => file).sort());

  const totals = { lines: 0, bytes: 0, rules: 0, important: 0, displayNone: 0, notVisible: 0, visible: 0, hidden: 0, media: 0, keyframes: 0, hiddenAttr: 0 };
  for (const [file, family, lines, bytes, hash, rules, important, displayNone, notVisible, visible, hidden, media, keyframes, hiddenAttr] of cssRows) {
    const text = read(file);
    assert.equal(lineCount(text), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(text), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`| \`${file}\` | ${family} |`), `doc should classify ${file}`);
    totals.lines += lines;
    totals.bytes += bytes;
    totals.rules += rules;
    totals.important += important;
    totals.displayNone += displayNone;
    totals.notVisible += notVisible;
    totals.visible += visible;
    totals.hidden += hidden;
    totals.media += media;
    totals.keyframes += keyframes;
    totals.hiddenAttr += hiddenAttr;
  }

  assert.deepEqual(totals, {
    lines: 11240,
    bytes: 300527,
    rules: 1572,
    important: 593,
    displayNone: 47,
    notVisible: 72,
    visible: 167,
    hidden: 6,
    media: 37,
    keyframes: 7,
    hiddenAttr: 3
  });
  assert.match(doc, /9 CSS files, 11,240 counted source lines/);
  assert.match(doc, /300,527 bytes, 1,572 lexical rule blocks/);
  assert.match(doc, /593 `!important` declarations, 47\s+`display:none` declarations/);
});

test('CSS selector and hide counters match current source', () => {
  for (const [file, , , , , rules, important, displayNone, notVisible, visible, hidden, media, keyframes, hiddenAttr] of cssRows) {
    const text = read(file);
    assert.equal(count(text, /{/g), rules, `${file}: rule count changed`);
    assert.equal(count(text, /!important/g), important, `${file}: important count changed`);
    assert.equal(count(text, /display\s*:\s*none\s*!important|display\s*:\s*none\s*;/gi), displayNone, `${file}: display none count changed`);
    assert.equal(count(text, /:not\(\.filter-tube-visible\)/g), notVisible, `${file}: old reveal selector count changed`);
    assert.equal(count(text, /filter-tube-visible/g), visible, `${file}: old visible token count changed`);
    assert.equal(count(text, /filtertube-hidden/g), hidden, `${file}: current hidden token count changed`);
    assert.equal(count(text, /@media/g), media, `${file}: media count changed`);
    assert.equal(count(text, /@keyframes/g), keyframes, `${file}: keyframes count changed`);
    assert.equal(count(text, /\[hidden\]/g), hiddenAttr, `${file}: hidden attribute selector count changed`);
  }
});

test('CSS load topology separates extension pages website and quarantined content CSS', () => {
  const doc = read(docPath);
  const popup = read('html/popup.html');
  const tabView = read('html/tab-view.html');
  const websiteLayout = read('website/app/layout.js');

  for (const href of ['../css/design_tokens.css', '../css/components.css', '../css/popup.css', '../css/serene-shell.css']) {
    assert.match(popup, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  for (const href of ['../css/design_tokens.css', '../css/components.css', '../css/tab-view.css', '../css/serene-shell.css']) {
    assert.match(tabView, new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }
  assert.match(popup, /fonts\.googleapis\.com/);
  assert.match(tabView, /fonts\.googleapis\.com/);
  assert.match(websiteLayout, /import "\.\/globals\.css"/);

  for (const manifestFile of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    assert.deepEqual(manifestCssFiles(manifestFile), [], `${manifestFile} should not load content CSS`);
  }

  const build = read('build.js');
  assert.match(build, /const COMMON_DIRS = \['js', 'css', 'html', 'icons', 'data', 'assets'\]/);
  assert.match(build, /fs\.copySync\(dir, path\.join\(targetDir, dir\), \{ filter: filterFunc \}\)/);

  assert.match(doc, /Active extension UI CSS/);
  assert.match(doc, /Quarantined content CSS/);
  assert.match(doc, /Website CSS/);
  assert.match(doc, /Packaged by build, not manifest-loaded/);
});

test('CSS class model split and dynamic style surface are explicitly pinned', () => {
  const doc = read(docPath);
  const runtime = [
    'js/content/block_channel.js',
    'js/content/first_run_prompt.js',
    'js/content/menu.js',
    'js/content/release_notes_prompt.js',
    'js/content/dom_helpers.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js'
  ].map(read).join('\n');

  assert.match(read('css/filter.css'), /^ytd-video-renderer,\s*\nytd-compact-video-renderer,/m);
  assert.match(read('css/layout.css'), /ytd-rich-item-renderer:not\(\.filter-tube-visible\)/);
  assert.match(read('css/content.css'), /\.filter-tube-visible/);
  assert.match(read('js/content/dom_helpers.js'), /\.filtertube-hidden \{ display: none !important; \}/);
  assert.match(read('js/content/dom_helpers.js'), /\.filtertube-hidden-shelf \{ display: none !important; \}/);

  for (const file of [
    'js/content/block_channel.js',
    'js/content/first_run_prompt.js',
    'js/content/menu.js',
    'js/content/release_notes_prompt.js',
    'js/content/dom_helpers.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js'
  ]) {
    assert.ok(doc.includes(`\`${file}\``), `doc should list dynamic style file ${file}`);
  }

  assert.match(runtime, /createElement\('style'\)|createElement\("style"\)/);
  assert.doesNotMatch(productSource(), /insertCSS|scripting\.insertCSS|tabs\.insertCSS|adoptedStyleSheets|new CSSStyleSheet/);
  assert.match(doc, /packaged quarantined content CSS/);
  assert.match(doc, /default-hide renderer families and reveal with \.filter-tube-visible/);
  assert.match(doc, /active runtime hide model/);
  assert.match(doc, /default-show content and hide with \.filtertube-hidden \/ \.filtertube-hidden-shelf/);
});

test('CSS load style surface authority symbols are still absent from product source', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const missing of [
    'cssLoadSurfaceAuthority',
    'cssPackageQuarantineManifest',
    'cssExtensionPageLoadManifest',
    'cssContentScriptActivationGate',
    'cssLegacyRevealModelDecision',
    'cssSelectorEffectReport',
    'cssImportantDebtBudget',
    'cssResponsiveVisualFixtureReport',
    'cssDynamicStyleLifecycleRegistry',
    'cssWebsiteExtensionBoundaryReport',
    'cssDeletionReadinessReport'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(source.includes(missing), false, `${missing} should remain absent from product source`);
  }
});
