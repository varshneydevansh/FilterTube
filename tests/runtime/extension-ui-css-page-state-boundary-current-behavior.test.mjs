import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_EXTENSION_UI_CSS_PAGE_STATE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const activeCssRows = [
  ['css/design_tokens.css', 301, 10361, '7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc', 12, 0, 0, 1, 0, 0, 0, 0, 0, 5, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ['css/components.css', 1686, 45567, 'db01d30c717e34c108e48d92807ce3df4bcafccace62a1808d86d03ed7047ebc', 240, 47, 1, 5, 1, 0, 1, 49, 53, 53, 0, 0, 2, 18, 1, 0, 19, 20, 5, 3, 4, 0],
  ['css/popup.css', 1151, 29731, '812cb4ba8b4c9be732bd8a2a6f7b06b5d8d0a8c3fb7416f391f475ae627d45fa', 182, 5, 3, 2, 0, 1, 3, 23, 52, 75, 0, 0, 5, 6, 0, 0, 8, 8, 1, 1, 2, 0],
  ['css/tab-view.css', 2834, 68789, 'e328965f44468e90cca22bb11b25103b1821ed2037775fbe312e2025c241c7c9', 422, 24, 14, 12, 4, 2, 1, 28, 26, 74, 0, 0, 1, 20, 0, 0, 17, 17, 15, 12, 12, 1],
  ['css/serene-shell.css', 3414, 87230, '785e988dd0176b16defcc08f77925de8eaa60ea831d53cd57147eb601c490f0a', 494, 39, 7, 16, 1, 0, 11, 34, 124, 124, 54, 0, 4, 3, 0, 0, 12, 46, 17, 10, 14, 0]
];

const selectedSourceRows = [
  ['css/design_tokens.css', 301, 10361, '7da73da79df23e6325c921e45fd786270488ee8ad212b57b7e634b63898c27dc'],
  ['css/components.css', 1686, 45567, 'db01d30c717e34c108e48d92807ce3df4bcafccace62a1808d86d03ed7047ebc'],
  ['css/popup.css', 1151, 29731, '812cb4ba8b4c9be732bd8a2a6f7b06b5d8d0a8c3fb7416f391f475ae627d45fa'],
  ['css/tab-view.css', 2834, 68789, 'e328965f44468e90cca22bb11b25103b1821ed2037775fbe312e2025c241c7c9'],
  ['css/serene-shell.css', 3414, 87230, '785e988dd0176b16defcc08f77925de8eaa60ea831d53cd57147eb601c490f0a'],
  ['html/popup.html', 31, 1213, 'c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31'],
  ['html/tab-view.html', 1599, 136238, '7533a194eb509f340ec80894f34280e79ba0a17b40b59bf9c98dc49c92ce716d'],
  ['src/extension-shell/popup.jsx', 113, 3864, '3a3772e7d77f8466fea609a80c1d4f09873e47022aee17f3b8b09858397b298c'],
  ['src/extension-shell/tab-view-decor.jsx', 34, 1101, '354cd36fa62b215a415e88b8b0c84bd43725196613766d6af921eac44d1f63f1'],
  ['src/extension-shell/shared/runtime.js', 52, 1462, 'd54cc87b8f48736df6ca063fa79e37b2439b580710746e215e8b428fc7207ec8'],
  ['js/ui-shell/popup-shell.js', 374, 21080, 'dc750d44dd4b9fde63b85b4dfc9f5ce9ba76964afbd6dfcedc7b3b7cce084b05'],
  ['js/ui-shell/tab-view-decor.js', 323, 18289, '234171091e523aa5de4c3c0f97e7341c55893bdd31b3e25a075490170fa9742f'],
  ['js/popup.js', 1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a'],
  ['js/tab-view.js', 13695, 632194, 'b0c71608c02a00a74920f780b7c958cc58b42703cd301a946c748cb894ab1279']
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function tagAttrValues(html, tag, attr) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*?${attr}="([^"]+)"[^>]*>`, 'g'))].map((match) => match[1]);
}

function productSource() {
  return git(['ls-files', '*.js', '*.mjs', '*.jsx', '*.css', '*.html', '*.json'])
    .filter((file) => !file.startsWith('docs/audit/'))
    .filter((file) => !file.startsWith('tests/'))
    .map(read)
    .join('\n');
}

test('extension UI CSS page-state boundary doc is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not a CSS cleanup, UI redesign, generated-shell rebuild, manifest change, or\s+visual-regression approval/);
  assert.match(doc, /This slice covers 14 selected source files/);

  for (const [file, lines, bytes, hash] of selectedSourceRows) {
    const text = read(file);
    assert.equal(lineCount(text), lines, `${file}: line count changed`);
    assert.equal(Buffer.byteLength(text), bytes, `${file}: byte count changed`);
    assert.equal(sha256(file), hash, `${file}: hash changed`);
    assert.ok(doc.includes(`| \`${file}\` |`), `doc should list ${file}`);
    assert.ok(doc.includes(`${lines.toLocaleString('en-US')} | ${bytes.toLocaleString('en-US')} | \`${hash}\``), `doc should pin ${file} metrics`);
  }
});

test('active extension UI CSS state counters match current source', () => {
  const doc = read(docPath);
  const totals = {
    lines: 0,
    bytes: 0,
    rules: 0,
    important: 0,
    displayNone: 0,
    media: 0,
    keyframes: 0,
    hiddenAttr: 0,
    focusVisible: 0,
    hover: 0,
    dark: 0,
    dataTheme: 0,
    dataSurface: 0,
    dataScene: 0,
    aria: 0,
    active: 0,
    show: 0,
    hiddenClass: 0,
    transition: 0,
    transform: 0,
    zIndex: 0,
    pointerNone: 0,
    overflowHidden: 0,
    reducedMotion: 0
  };

  for (const [file, lines, bytes, , rules, important, displayNone, media, keyframes, hiddenAttr, focusVisible, hover, dark, dataTheme, dataSurface, dataScene, aria, active, show, hiddenClass, transition, transform, zIndex, pointerNone, overflowHidden, reducedMotion] of activeCssRows) {
    const text = read(file);
    assert.equal(lineCount(text), lines, `${file}: line count changed`);
    assert.equal(Buffer.byteLength(text), bytes, `${file}: byte count changed`);
    assert.equal(count(text, /{/g), rules, `${file}: rule count changed`);
    assert.equal(count(text, /!important/g), important, `${file}: !important count changed`);
    assert.equal(count(text, /display\s*:\s*none\s*!important|display\s*:\s*none\s*;/gi), displayNone, `${file}: display none count changed`);
    assert.equal(count(text, /@media/g), media, `${file}: @media count changed`);
    assert.equal(count(text, /@keyframes/g), keyframes, `${file}: @keyframes count changed`);
    assert.equal(count(text, /\[hidden\]/g), hiddenAttr, `${file}: hidden attr count changed`);
    assert.equal(count(text, /:focus-visible/g), focusVisible, `${file}: focus-visible count changed`);
    assert.equal(count(text, /:hover/g), hover, `${file}: hover count changed`);
    assert.equal(count(text, /html\[data-theme="dark"\]/g), dark, `${file}: dark prefix count changed`);
    assert.equal(count(text, /data-theme/g), dataTheme, `${file}: data-theme count changed`);
    assert.equal(count(text, /data-surface/g), dataSurface, `${file}: data-surface count changed`);
    assert.equal(count(text, /data-scene/g), dataScene, `${file}: data-scene count changed`);
    assert.equal(count(text, /aria-/g), aria, `${file}: aria selector count changed`);
    assert.equal(count(text, /\.active\b/g), active, `${file}: active class count changed`);
    assert.equal(count(text, /\.show\b/g), show, `${file}: show class count changed`);
    assert.equal(count(text, /\.hidden\b/g), hiddenClass, `${file}: hidden class count changed`);
    assert.equal(count(text, /transition\s*:/g), transition, `${file}: transition count changed`);
    assert.equal(count(text, /transform\s*:/g), transform, `${file}: transform count changed`);
    assert.equal(count(text, /z-index\s*:/g), zIndex, `${file}: z-index count changed`);
    assert.equal(count(text, /pointer-events\s*:\s*none/g), pointerNone, `${file}: pointer-events none count changed`);
    assert.equal(count(text, /overflow\s*:\s*hidden|overflow-x\s*:\s*hidden|overflow-y\s*:\s*hidden/g), overflowHidden, `${file}: overflow hidden count changed`);
    assert.equal(count(text, /prefers-reduced-motion/g), reducedMotion, `${file}: reduced motion count changed`);

    totals.lines += lines;
    totals.bytes += bytes;
    totals.rules += rules;
    totals.important += important;
    totals.displayNone += displayNone;
    totals.media += media;
    totals.keyframes += keyframes;
    totals.hiddenAttr += hiddenAttr;
    totals.focusVisible += focusVisible;
    totals.hover += hover;
    totals.dark += dark;
    totals.dataTheme += dataTheme;
    totals.dataSurface += dataSurface;
    totals.dataScene += dataScene;
    totals.aria += aria;
    totals.active += active;
    totals.show += show;
    totals.hiddenClass += hiddenClass;
    totals.transition += transition;
    totals.transform += transform;
    totals.zIndex += zIndex;
    totals.pointerNone += pointerNone;
    totals.overflowHidden += overflowHidden;
    totals.reducedMotion += reducedMotion;
  }

  assert.deepEqual(totals, {
    lines: 9386,
    bytes: 241678,
    rules: 1350,
    important: 115,
    displayNone: 25,
    media: 36,
    keyframes: 6,
    hiddenAttr: 3,
    focusVisible: 16,
    hover: 134,
    dark: 255,
    dataTheme: 331,
    dataSurface: 54,
    dataScene: 7,
    aria: 12,
    active: 47,
    show: 1,
    hiddenClass: 0,
    transition: 56,
    transform: 91,
    zIndex: 38,
    pointerNone: 26,
    overflowHidden: 32,
    reducedMotion: 1
  });

  assert.match(doc, /9,386 counted source lines/);
  assert.match(doc, /241,678 bytes, 1,350 lexical rule blocks/);
  assert.match(doc, /115 `!important` declarations, 25\s+`display:none` declarations/);
  assert.match(doc, /36 `@media` blocks, 6 `@keyframes` blocks, 3\s+`\[hidden\]` selectors/);
  assert.match(doc, /16 `:focus-visible` selectors, 134 `:hover` selectors/);
  assert.match(doc, /255 dark-theme selector prefixes, 331 `data-theme` tokens, 54 `data-surface`\s+tokens, 7 `data-scene` tokens/);
  assert.match(doc, /47 `\.active`\s+selectors, 1 `\.show` selector, 0 `\.hidden` selectors/);
  assert.match(doc, /56 `transition`\s+declarations, 91 `transform` declarations, 38 `z-index` declarations/);
  assert.match(doc, /26\s+`pointer-events:none` declarations, 32 overflow-hidden declarations, and 1\s+`prefers-reduced-motion` token/);
});

test('popup and tab-view CSS loader order is tied to generated shell before hand-owned runtime', () => {
  const doc = read(docPath);
  const popupHtml = read('html/popup.html');
  const tabHtml = read('html/tab-view.html');

  assert.deepEqual(tagAttrValues(popupHtml, 'link', 'href'), [
    '../css/design_tokens.css',
    '../css/components.css',
    '../css/popup.css',
    '../css/serene-shell.css',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  ]);
  assert.deepEqual(tagAttrValues(tabHtml, 'link', 'href'), [
    '../css/design_tokens.css',
    '../css/components.css',
    '../css/tab-view.css',
    '../css/serene-shell.css',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=JetBrains+Mono:wght@500;700&family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  ]);

  const popupScripts = tagAttrValues(popupHtml, 'script', 'src');
  const tabScripts = tagAttrValues(tabHtml, 'script', 'src');
  assert.equal(popupScripts.length, 9);
  assert.equal(tabScripts.length, 15);
  assert.ok(popupScripts.indexOf('../js/ui-shell/popup-shell.js') < popupScripts.indexOf('../js/popup.js'));
  assert.ok(tabScripts.indexOf('../js/ui-shell/tab-view-decor.js') < tabScripts.indexOf('../js/tab-view.js'));
  assert.ok(tabScripts.indexOf('../js/managed_admin_authority.js') < tabScripts.indexOf('../js/tab-view.js'));
  assert.deepEqual(tagAttrValues(popupHtml, 'div', 'id'), ['popupRoot']);
  assert.equal([...tabHtml.matchAll(/id="([^"]+)"/g)].length, 106);
  assert.equal([...tabHtml.matchAll(/data-tab="([^"]+)"/g)].length, 9);

  assert.match(doc, /`html\/popup\.html` loads 9 scripts and places `\.\.\/js\/ui-shell\/popup-shell\.js`\s+before `\.\.\/js\/popup\.js`/);
  assert.match(doc, /`html\/tab-view\.html` loads 15 scripts and places\s+`\.\.\/js\/ui-shell\/tab-view-decor\.js` and\s+`\.\.\/js\/managed_admin_authority\.js` before `\.\.\/js\/tab-view\.js`/);
  assert.match(doc, /It has 1 static id: `popupRoot`/);
  assert.match(doc, /It has 106 static ids\s+and 9 `data-tab` values/);
});

test('generated shell environment and hand-owned UI runtime state tokens remain split', () => {
  const doc = read(docPath);
  const runtimeSource = read('src/extension-shell/shared/runtime.js');
  const popupShellSource = read('src/extension-shell/popup.jsx');
  const popupShellOutput = read('js/ui-shell/popup-shell.js');
  const tabDecorSource = read('src/extension-shell/tab-view-decor.jsx');
  const tabDecorOutput = read('js/ui-shell/tab-view-decor.js');
  const popupRuntime = read('js/popup.js');
  const tabRuntime = read('js/tab-view.js');

  assert.match(runtimeSource, /root\.dataset\.scene = getSceneForHour\(\)/);
  assert.match(runtimeSource, /root\.dataset\.theme = getSystemTheme\(\)/);
  assert.match(runtimeSource, /root\.dataset\.surface = surface/);
  assert.match(runtimeSource, /body\.dataset\.surface = surface/);
  assert.match(runtimeSource, /body\.classList\.add\("ft-extension-surface"\)/);
  assert.match(runtimeSource, /const popupWidth = "392px"/);

  assert.equal(count(popupShellSource, /ft-popup-shell/g), 13);
  assert.equal(count(popupShellOutput, /ft-popup-shell/g), 13);
  assert.equal(count(tabDecorSource, /ft-tab-view-ambient/g), 11);
  assert.equal(count(tabDecorOutput, /ft-tab-view-ambient/g), 11);
  assert.equal(count(popupShellSource, /homepage_hero_day\.mp4/g), 1);
  assert.equal(count(popupShellOutput, /homepage_hero_day\.mp4/g), 1);
  assert.equal(count(tabDecorSource, /homepage_hero_day\.mp4/g), 1);
  assert.equal(count(tabDecorOutput, /homepage_hero_day\.mp4/g), 1);

  assert.equal(count(popupRuntime, /ft-enabled/g), 1);
  assert.equal(count(popupRuntime, /ft-disabled/g), 1);
  assert.equal(count(popupRuntime, /is-locked/g), 2);
  assert.equal(count(popupRuntime, /aria-expanded/g), 2);
  assert.equal(count(popupRuntime, /aria-pressed/g), 2);
  assert.equal(count(tabRuntime, /is-locked/g), 2);
  assert.equal(count(tabRuntime, /aria-expanded/g), 2);
  assert.equal(count(tabRuntime, /aria-pressed/g), 8);

  assert.match(doc, /`src\/extension-shell\/shared\/runtime\.js` sets `root\.dataset\.scene`/);
  assert.match(doc, /popup inline width values\s+of `392px`/);
  assert.match(doc, /supply 13\s+`ft-popup-shell` tokens and 1 `homepage_hero_day\.mp4` token each/);
  assert.match(doc, /supply 11 `ft-tab-view-ambient` tokens and 1\s+`homepage_hero_day\.mp4` token each/);
  assert.match(doc, /`js\/popup\.js` currently supplies 1 `ft-enabled` token, 1 `ft-disabled`\s+token, 2 `is-locked` tokens, 2 `aria-expanded` tokens, and 2 `aria-pressed`\s+tokens/);
  assert.match(doc, /`js\/tab-view\.js` currently supplies 2 `is-locked` tokens, 2 `aria-expanded`\s+tokens, and 8 `aria-pressed` tokens/);
});

test('extension UI CSS page-state boundary keeps future authority symbols absent', () => {
  const doc = read(docPath);
  const source = productSource();

  for (const missing of [
    'extensionUiCssPageStateAuthority',
    'extensionUiCssStateSelectorReport',
    'extensionUiCssShellStateParityReport',
    'extensionUiCssResponsiveFixtureReport',
    'extensionUiCssAccessibilityFixtureReport',
    'extensionUiCssMotionBudgetReport',
    'extensionUiCssVisualRegressionReport',
    'extensionUiCssGeneratedShellParityGate',
    'extensionUiCssThemeScenePolicy',
    'extensionUiCssRuntimeStateOwnerReport',
    'extensionUiCssFixtureProvenance'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(source.includes(missing), false, `${missing} should not exist in product source`);
  }

  assert.match(doc, /static HTML cannot prove page-state coverage/);
  assert.match(doc, /generated output freshness is not\s+expressed as a manifest/);
  assert.match(doc, /visual\/accessibility\/responsive proof is still missing/);
  assert.match(doc, /This addendum does not close the active extension UI CSS rows/);
  assert.match(doc, /future UI CSS work still needs generated source-output parity manifests,\s+browser visual fixtures, responsive and accessibility checks, reduced-motion\s+proof, theme\/scene policy, runtime state owner reports, and fixture provenance/);
});
