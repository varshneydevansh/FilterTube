import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_CONTENT_CONTROL_DOM_STYLE_SELECTOR_MATRIX_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'contentControlDomStyleSelectorMatrix',
  'contentControlDomStyleSelectorManifest',
  'contentControlStyleSelectorOwnerReport',
  'contentControlStyleSelectorEffectDecision',
  'contentControlStyleRestoreProof',
  'contentControlStyleSiblingFixtureReport',
  'contentControlHasSelectorSupportPolicy',
  'contentControlStyleNoWorkBudget',
  'contentControlStyleMetricArtifact',
  'contentControlStyleFirstClassJsonGate'
];

const runtimeStyleAliases = new Map([
  ['hideComments', 'hideAllComments']
]);

const branchRows = [
  ['hideHomeFeed', 6, 0, 0],
  ['hideSponsoredCards', 9, 0, 0],
  ['hideWatchPlaylistPanel', 3, 0, 0],
  ['hidePlaylistCards', 7, 8, 4],
  ['hideMixPlaylists', 9, 4, 0],
  ['hideMembersOnly', 31, 31, 0],
  ['hideVideoSidebar', 1, 0, 0],
  ['hideRecommended', 2, 0, 0],
  ['hideLiveChat', 2, 0, 0],
  ['hideAllComments', 10, 0, 0],
  ['hideVideoButtonsBar', 2, 0, 0],
  ['hideAskButton', 2, 0, 0],
  ['hideVideoChannelRow', 2, 0, 0],
  ['hideVideoDescription', 2, 0, 0],
  ['hideMerchTicketsOffers', 4, 0, 0],
  ['hideEndscreenVideowall', 2, 0, 0],
  ['hideEndscreenCards', 1, 0, 0],
  ['disableAutoplay', 2, 0, 0],
  ['disableAnnotations', 2, 0, 0],
  ['hideTopHeader', 1, 0, 0],
  ['hideNotificationBell', 2, 0, 0],
  ['hideExploreTrending', 3, 0, 0],
  ['hideMoreFromYouTube', 1, 0, 0],
  ['hideSubscriptions', 3, 3, 1],
  ['hideSearchShelves', 2, 0, 0]
].map(([key, selectorCount, hasCount, notHasCount]) => ({ key, selectorCount, hasCount, notHasCount }));

const branchNeedles = new Map([
  ['hideHomeFeed', ['    if (settings.hideHomeFeed) {', '\n\n    if (settings.hideSponsoredCards) {']],
  ['hideSponsoredCards', ['    if (settings.hideSponsoredCards) {', '\n\n    if (settings.hideWatchPlaylistPanel) {']],
  ['hideWatchPlaylistPanel', ['    if (settings.hideWatchPlaylistPanel) {', '\n\n    if (settings.hidePlaylistCards) {']],
  ['hidePlaylistCards', ['    if (settings.hidePlaylistCards) {', '\n\n    if (settings.hideMixPlaylists) {']],
  ['hideMixPlaylists', ['    if (settings.hideMixPlaylists) {', '\n\n    if (settings.hideMembersOnly) {']],
  ['hideMembersOnly', ['    if (settings.hideMembersOnly) {', '\n\n    // If :has()']],
  ['hideVideoSidebar', ['    if (settings.hideVideoSidebar) {', '\n\n    if (settings.hideRecommended) {']],
  ['hideRecommended', ['    if (settings.hideRecommended) {', '\n\n    if (settings.hideLiveChat) {']],
  ['hideLiveChat', ['    if (settings.hideLiveChat) {', '\n\n    if (settings.hideAllComments) {']],
  ['hideAllComments', ['    if (settings.hideAllComments) {', '\n\n    const listMode']],
  ['hideVideoButtonsBar', ["    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoButtonsBar)) {", '\n\n    if (hideInfoMaster || settings.hideAskButton) {']],
  ['hideAskButton', ['    if (hideInfoMaster || settings.hideAskButton) {', "\n\n    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoChannelRow)) {"]],
  ['hideVideoChannelRow', ["    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoChannelRow)) {", "\n\n    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoDescription)) {"]],
  ['hideVideoDescription', ["    if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoDescription)) {", '\n\n    if (hideInfoMaster || settings.hideMerchTicketsOffers) {']],
  ['hideMerchTicketsOffers', ['    if (hideInfoMaster || settings.hideMerchTicketsOffers) {', '\n\n    if (settings.hideEndscreenVideowall) {']],
  ['hideEndscreenVideowall', ['    if (settings.hideEndscreenVideowall) {', '\n\n    if (settings.hideEndscreenCards) {']],
  ['hideEndscreenCards', ['    if (settings.hideEndscreenCards) {', '\n\n    if (settings.disableAutoplay) {']],
  ['disableAutoplay', ['    if (settings.disableAutoplay) {', '\n\n    if (settings.disableAnnotations) {']],
  ['disableAnnotations', ['    if (settings.disableAnnotations) {', '\n\n    if (settings.hideTopHeader) {']],
  ['hideTopHeader', ['    if (settings.hideTopHeader) {', '\n\n    if (settings.hideNotificationBell) {']],
  ['hideNotificationBell', ['    if (settings.hideNotificationBell) {', '\n\n    if (settings.hideExploreTrending) {']],
  ['hideExploreTrending', ['    if (settings.hideExploreTrending) {', '\n\n    if (settings.hideMoreFromYouTube) {']],
  ['hideMoreFromYouTube', ['    if (settings.hideMoreFromYouTube) {', '\n\n    if (settings.hideSubscriptions) {']],
  ['hideSubscriptions', ['    if (settings.hideSubscriptions) {', '\n\n    if (settings.hideSearchShelves) {']],
  ['hideSearchShelves', ['    if (settings.hideSearchShelves) {', "\n\n    style.textContent = rules.join"]]
]);

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function extractTemplate(block) {
  const match = block.match(/rules\.push\(`([\s\S]*?)`\);/);
  assert.ok(match, 'missing rules.push template');
  return match[1];
}

function selectorLines(css) {
  const dynamicSelectors = [];
  const dynamicHasPattern = /\$\{supportsHasSelector \? '([^']*)' : ''\}/g;
  let dynamicMatch;
  while ((dynamicMatch = dynamicHasPattern.exec(css))) {
    dynamicSelectors.push(dynamicMatch[1].replace(/,$/, '').trim());
  }

  const staticCss = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(dynamicHasPattern, '');

  const staticSelectors = staticCss
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes('display: none'))
    .map((line) => line.replace(/\s*\{\s*$/, '').replace(/,$/, '').trim())
    .filter((line) => line && line !== '}');

  return [...staticSelectors, ...dynamicSelectors].filter(Boolean);
}

function loadCatalog() {
  const sandbox = { window: {}, console };
  sandbox.window.window = sandbox.window;
  vm.createContext(sandbox);
  vm.runInContext(read('js/content_controls_catalog.js'), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.FilterTubeContentControlsCatalog.getCatalog()));
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function styleSource() {
  const domFallback = read('js/content/dom_fallback.js');
  const styleBlock = sliceBetween(
    domFallback,
    'function ensureContentControlStyles(settings) {',
    'function hideYouTubeOpenAppButtons()'
  );
  const firstPush = styleBlock.match(/rules\.push\(`([\s\S]*?)`\);/);
  assert.ok(firstPush, 'missing unconditional open-app rules.push');
  const branches = new Map();
  for (const row of branchRows) {
    const [start, end] = branchNeedles.get(row.key);
    const block = sliceBetween(styleBlock, start, end);
    branches.set(row.key, { block, css: extractTemplate(block) });
  }
  return { styleBlock, openAppCss: firstPush[1], branches };
}

test('content-control DOM style selector matrix is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch,\s+optimization patch, selector patch/);
  assert.match(doc, /content-control DOM style selector matrix source files: 2/);
  assert.match(doc, /content-control DOM style selector source\/effect blocks: 27/);
  assert.match(doc, /catalog controls: 29/);
  assert.match(doc, /controls that can affect DOM style output: 26/);
  assert.match(doc, /direct style selector branches: 25/);
  assert.match(doc, /catalog controls without DOM style branch: 3/);
  assert.match(doc, /catalog controls resolved through DOM style runtime alias: 1/);
  assert.match(doc, /unconditional mobile open-app selector rows: 5/);
  assert.match(doc, /control-gated selector rows: 111/);
  assert.match(doc, /total selector rows emitted by the style writer when all branches are active: 116/);
  assert.match(doc, /`:has\(\)` selector token count in style writer: 46/);
  assert.match(doc, /`:not\(:has\(\.\.\.\)\)` selector token count in style writer: 5/);
  assert.match(doc, /runtime content-control DOM style selector matrix fixtures: 6/);

  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content_controls_catalog.js\` | 222 | 7822 | \`${sha256('js/content_controls_catalog.js')}\` |`));
});

test('ensureContentControlStyles source counts remain pinned', () => {
  const doc = read(docPath);
  const { styleBlock, openAppCss } = styleSource();

  assert.equal(lineCount(styleBlock), 345);
  assert.equal(Buffer.byteLength(styleBlock), 12583);
  assert.equal(lineCount(openAppCss), 9);
  assert.equal(Buffer.byteLength(openAppCss), 309);
  assert.equal(countLiteral(styleBlock, 'rules.push'), 26);
  assert.equal(countLiteral(styleBlock, 'display: none !important'), 26);
  assert.equal(countLiteral(styleBlock, 'style.textContent'), 1);
  assert.equal(countLiteral(styleBlock, 'supportsHasSelector'), 3);
  assert.equal(countLiteral(styleBlock, 'hideInfoMaster'), 6);
  assert.equal(countLiteral(styleBlock, "listMode !== 'whitelist'"), 4);

  assert.match(doc, /ensureContentControlStyles block lines: 345/);
  assert.match(doc, /ensureContentControlStyles block bytes: 12583/);
  assert.match(doc, /unconditional open-app style block lines: 9/);
  assert.match(doc, /unconditional open-app style block bytes: 309/);
  assert.match(doc, /rules\.push callsites in style writer: 26/);
  assert.match(doc, /display none declarations in style writer: 26/);
  assert.match(doc, /style textContent assignment callsites in style writer: 1/);
  assert.match(doc, /supportsHasSelector tokens in style writer: 3/);
  assert.match(doc, /hideInfoMaster tokens in style writer: 6/);
  assert.match(doc, /`listMode !== 'whitelist'` tokens in style writer: 4/);
});

test('catalog and style selector branches preserve the current matrix shape', () => {
  const doc = read(docPath);
  const catalog = loadCatalog();
  const catalogKeys = catalog.flatMap((group) => (group.controls || []).map((control) => control.key));
  const branchKeys = branchRows.map((row) => row.key);
  const styleBackedCatalogKeys = catalogKeys.filter((key) => branchKeys.includes(runtimeStyleAliases.get(key) || key));
  const nonStyleCatalogKeys = catalogKeys.filter((key) => !branchKeys.includes(runtimeStyleAliases.get(key) || key));

  assert.deepEqual(catalog.map((group) => group.id), ['core', 'feed', 'watch', 'video_info', 'player', 'navigation', 'search']);
  assert.equal(catalogKeys.length, 29);
  assert.equal(branchRows.length, 25);
  assert.ok(styleBackedCatalogKeys.includes('hideComments'));
  assert.deepEqual(nonStyleCatalogKeys, [
    'hideShorts',
    'showQuickBlockButton',
    'showBlockMenuItem',
    'hideVideoInfo'
  ]);

  assert.match(doc, /`hideShorts`, `showQuickBlockButton`, and `showBlockMenuItem` are catalog\s+controls without direct DOM style branches/);
  assert.match(doc, /Catalog `hideComments` is represented in this style writer by the runtime\s+alias branch `hideAllComments`/);
  assert.match(doc, /`hideVideoInfo` is not a standalone selector branch/);
  assert.match(doc, /It drives five child\s+branches through `hideInfoMaster`/);
});

test('style selector matrix counts selector rows and has-selector tokens from current source', () => {
  const doc = read(docPath);
  const { openAppCss, branches } = styleSource();
  const openAppSelectors = selectorLines(openAppCss);
  let controlSelectorCount = 0;
  let hasSelectorTokenCount = countLiteral(openAppCss, ':has(');
  let notHasSelectorTokenCount = countLiteral(openAppCss, ':not(:has(');

  assert.deepEqual(openAppSelectors, [
    'ytm-button-renderer a[href^="intent://"]',
    'ytm-button-renderer a[href*="youtube://"]',
    'ytm-button-renderer a[href*="open_app"]',
    'ytm-button-renderer a[href*="play.google.com/store/apps/details"]',
    'a[href^="intent://"]'
  ]);

  for (const row of branchRows) {
    const source = branches.get(row.key);
    const selectors = selectorLines(source.css);
    controlSelectorCount += selectors.length;
    hasSelectorTokenCount += countLiteral(source.css, ':has(');
    notHasSelectorTokenCount += countLiteral(source.css, ':not(:has(');

    assert.equal(selectors.length, row.selectorCount, `${row.key} selector count`);
    assert.equal(countLiteral(source.css, ':has('), row.hasCount, `${row.key} :has count`);
    assert.equal(countLiteral(source.css, ':not(:has('), row.notHasCount, `${row.key} :not(:has count`);
    assert.match(doc, new RegExp(`\\| \`${row.key}\` \\| ${row.selectorCount} \\| ${row.hasCount} \\| ${row.notHasCount} \\|`));
  }

  assert.equal(openAppSelectors.length, 5);
  assert.equal(controlSelectorCount, 111);
  assert.equal(openAppSelectors.length + controlSelectorCount, 116);
  assert.equal(hasSelectorTokenCount, 46);
  assert.equal(notHasSelectorTokenCount, 5);
});

test('DOM style selector matrix records high-risk selector and mode boundaries', () => {
  const doc = read(docPath);
  const { styleBlock, branches } = styleSource();

  assert.match(branches.get('hidePlaylistCards').css, /:not\(:has\(a\[href\*="start_radio=1"\]\)\)/);
  assert.match(branches.get('hideMembersOnly').css, /ytd-watch-flexy:has\(\.yt-badge-shape--membership\)/);
  assert.match(branches.get('hideSubscriptions').css, /\$\{supportsHasSelector \? '#sections > ytd-guide-section-renderer:has/);
  assert.match(branches.get('hideAllComments').css, /html\[data-filtertube-route-watch="true"\] \[data-filtertube-mobile-comments-card="true"\]/);
  assert.match(branches.get('disableAutoplay').css, /button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]/);
  assert.match(branches.get('disableAnnotations').css, /\.iv-branding/);
  assert.match(styleBlock, /const hideInfoMaster = \(listMode !== 'whitelist'\) && !!settings\.hideVideoInfo/);
  assert.match(styleBlock, /if \(hideInfoMaster \|\| settings\.hideAskButton\)/);
  assert.match(styleBlock, /if \(hideInfoMaster \|\| settings\.hideMerchTicketsOffers\)/);

  assert.match(doc, /Playlist, Mix, members-only, and subscription style selectors depend on\s+browser `:has\(\)` support/);
  assert.match(doc, /`hideAskButton` and `hideMerchTicketsOffers` are not directly guarded by\s+`listMode !== 'whitelist'`/);
  assert.match(doc, /`disableAutoplay` and `disableAnnotations` are style branches but are not\s+DOM active-gate booleans/);
});

test('content-control DOM style selector matrix records missing authority symbols', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  assert.match(doc, /Content-control DOM style selectors still need selector ownership/);
  assert.match(doc, /route\/surface\s+scope/);
  assert.match(doc, /target-shape reports/);
  assert.match(doc, /`:has\(\)` support policy/);
  assert.match(doc, /list-mode effect reports/);
  assert.match(doc, /restore proof/);
  assert.match(doc, /negative sibling-visible fixtures/);
  assert.match(doc, /no-work budgets/);
  assert.match(doc, /JSON\/DOM parity decisions/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc missing missing-authority symbol ${symbol}`);
    assert.doesNotMatch(runtime, new RegExp(symbol));
  }
});
