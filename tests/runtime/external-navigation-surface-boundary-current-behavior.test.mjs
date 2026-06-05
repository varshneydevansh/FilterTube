import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const selectedFiles = [
  'js/background.js',
  'js/popup.js',
  'js/tab-view.js',
  'js/content/release_notes_prompt.js',
  'html/popup.html',
  'html/tab-view.html',
  'website/components/marketing-ui.js',
  'website/components/site-header.js',
  'website/components/site-footer.js',
  'website/components/browser-logo-rail.js',
  'website/components/scenic-detail-page.js',
  'website/components/site-shell-data.js',
  'website/app/page.js',
  'website/app/downloads/page.js',
  'website/app/privacy/page.js',
];

const expectedFingerprints = new Map([
  ['js/background.js', [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5']],
  ['js/popup.js', [1841, 75587, 'cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a']],
  ['js/tab-view.js', [14584, 676581, '7f3de6750e95adb81bfdec5df53425427be86b08044a833bc0288bfe8cbe6e58']],
  ['js/content/release_notes_prompt.js', [250, 9866, '30b624cbbda1004f354f98dbf3b4513f8ebc298adecbceb4358782f248f80474']],
  ['html/popup.html', [31, 1213, 'c5e03a38b2737dbd01e2cd0c243b37754936e2e349e9d2275b195350159aea31']],
  ['html/tab-view.html', [1577, 133585, 'd11914a138ab29fb764a6aede4921c4d491bacaad83ecd44f8d7392758ece3e1']],
  ['website/components/marketing-ui.js', [89, 3155, 'f16f6e72b9761b09dc65e2fcd69f786e30b893afba76118401577254d8160302']],
  ['website/components/site-header.js', [186, 7700, '6ffe1ff1815300d7e9f407c27bebe7bff14e2e6c1a794ce5290b9c0eb8c6f734']],
  ['website/components/site-footer.js', [131, 5926, '627ef370918b75bb7066c84c640ddb6a659a5ef2137101fdc24251d0b65a412a']],
  ['website/components/browser-logo-rail.js', [64, 2681, '2c6cf5821cc1120adfae0204e37336e69c2e90a2db603afe558b68188fc4652b']],
  ['website/components/scenic-detail-page.js', [332, 14521, '2c8fcc51be06adc875c7496f478f6b61022d2ae8235216714f988ab8a5c27701']],
  ['website/components/site-shell-data.js', [21, 473, '28a1ac9ce4806438149720a36b7e4c586dd09f99142ebc63e1c863afcbd145d0']],
  ['website/app/page.js', [656, 31731, '40d595f905284d11a3fcab3600955dd6c1432b6874c502202bdc9e047acaa7a4']],
  ['website/app/downloads/page.js', [373, 15729, '5b520ccf1fc879a02b7d6c67bd29bd49705aa00208110d693a20cd169cae801e']],
  ['website/app/privacy/page.js', [819, 35232, '41e818a2f2f8bf9da3daa81e2e7b25863951b9090ce19f8a6aaec353af6f0cb9']],
]);

const navigationRegexes = {
  tabsCreate: /\bbrowserAPI\.tabs\.create\s*\(|\btabsApi\.create\s*\(|\bruntimeAPI\.tabs\.create\s*\(/g,
  windowOpen: /\bwindow\.open\s*\(/g,
  locationHref: /\blocation\.href\s*=/g,
  runtimeGetURL: /\bruntime(?:API|Api)?\.runtime\.getURL\s*\(|\bbrowserAPI\.runtime\.getURL\s*\(|\bapi\.runtime\.getURL\s*\(/g,
  targetBlank: /target=["']_blank["']/g,
  relNoopener: /rel=["'][^"']*noopener[^"']*["']/g,
  relNoreferrer: /rel=["'][^"']*noreferrer[^"']*["']/g,
  externalHref: /href=["']https?:\/\//g,
  mailto: /href=["']mailto:/g,
  httpsLiteral: /https?:\/\/[A-Za-z0-9._~:/?#[\]@!$&'()*+,;=%-]+/g,
  filterTubeOpenWhatsNew: /FilterTube_OpenWhatsNew/g,
  createBrowserTab: /\bcreateBrowserTab\s*\(/g,
  updateBrowserTab: /\bupdateBrowserTab\s*\(/g,
  queryBrowserTabs: /\bqueryBrowserTabs\s*\(/g,
};

function filePath(file) {
  return path.join(repoRoot, file);
}

function read(file) {
  return fs.readFileSync(filePath(file), 'utf8');
}

function lineCount(file) {
  const source = read(file);
  return source.split('\n').length - (source.endsWith('\n') ? 1 : 0);
}

function bytes(file) {
  return fs.statSync(filePath(file)).size;
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function count(source, regex) {
  return (source.match(regex) || []).length;
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function navigationCounts() {
  const totals = Object.fromEntries(Object.keys(navigationRegexes).map((name) => [name, 0]));
  const perFile = {};

  for (const file of selectedFiles) {
    const source = read(file);
    perFile[file] = {};
    for (const [name, regex] of Object.entries(navigationRegexes)) {
      const value = count(source, regex);
      perFile[file][name] = value;
      totals[name] += value;
    }
  }

  return { totals, perFile };
}

function trackedNavigationSource() {
  return execFileSync('git', ['ls-files', 'js', 'html', 'website'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim().split('\n')
    .filter(Boolean)
    .filter((file) => !file.includes('/package-lock.json'))
    .map(read)
    .join('\n');
}

test('external navigation surface boundary doc is audit-only and fingerprints are pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /External navigation surface source\/effect blocks: 10/);
  assert.match(doc, /Runtime external-navigation surface fixtures: 7/);

  for (const file of selectedFiles) {
    const [lines, byteCount, hash] = expectedFingerprints.get(file);
    assert.equal(lineCount(file), lines, `${file} line count drifted`);
    assert.equal(bytes(file), byteCount, `${file} byte count drifted`);
    assert.equal(sha256(file), hash, `${file} hash drifted`);
    assert.match(doc, new RegExp(file.replace(/[/.]/g, '\\$&')));
    assert.match(doc, new RegExp(String(byteCount)));
    assert.match(doc, new RegExp(hash));
  }
});

test('selected navigation primitive counts stay pinned', () => {
  const { totals } = navigationCounts();

  assert.deepEqual(totals, {
    tabsCreate: 5,
    windowOpen: 7,
    locationHref: 1,
    runtimeGetURL: 8,
    targetBlank: 15,
    relNoopener: 4,
    relNoreferrer: 14,
    externalHref: 15,
    mailto: 2,
    httpsLiteral: 35,
    filterTubeOpenWhatsNew: 2,
    createBrowserTab: 2,
    updateBrowserTab: 5,
    queryBrowserTabs: 4,
  });

  const doc = read(docPath);
  for (const marker of [
    'Runtime `tabs.create` callsites in selected files: 5',
    'Runtime `window.open` callsites in selected files: 7',
    'Runtime `location.href` assignment callsites in selected files: 1',
    'Static/component `target="_blank"` tokens in selected files: 15',
    'Static/component `rel` tokens containing `noopener`: 4',
    'Static/component `rel` tokens containing `noreferrer`: 14',
    'HTTPS literal tokens in selected files: 35',
  ]) {
    assert.ok(doc.includes(marker), `doc missing marker ${marker}`);
  }
});

test('privileged and fallback extension open surfaces remain split today', () => {
  const background = read('js/background.js');
  const releasePrompt = read('js/content/release_notes_prompt.js');
  const popup = read('js/popup.js');
  const tabView = read('js/tab-view.js');
  const whatsNewBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );
  const releaseBlock = sliceBetween(
    releasePrompt,
    'const targetLink = WHATS_NEW_URL || payload.link;',
    'actions.appendChild(learnBtn);'
  );
  const popupOpenBlock = sliceBetween(
    popup,
    "manageInTab.addEventListener('click', () => {",
    'applyPopupVideoFiltersForActiveProfile();'
  ) + sliceBetween(
    popup,
    'if (openInTabBtn) {',
    'if (toggleEnabledBrandBtn) {'
  );
  const supportBlock = sliceBetween(
    tabView,
    'if (openKofiBtn) {',
    'if (dashboardDonateBtn) {'
  );

  assert.match(whatsNewBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(whatsNewBlock, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.doesNotMatch(whatsNewBlock, /isTrustedUiSender|allowedWhatsNewUrl|externalNavigationAuthority/);

  assert.match(releaseBlock, /api\.runtime\.sendMessage\(\{ action: 'FilterTube_OpenWhatsNew', url: targetLink \}/);
  assert.match(releaseBlock, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(releaseBlock, /location\.href = targetLink/);

  assert.match(popupOpenBlock, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html/);
  assert.match(popupOpenBlock, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.match(supportBlock, /const url = 'https:\/\/ko-fi\.com\/filtertube'/);
  assert.match(supportBlock, /runtimeAPI\.tabs\.create\(\{ url \}\)/);
});

test('subscription import tab movement uses fixed YouTube channels URL but no shared navigation policy', () => {
  const tabView = read('js/tab-view.js');
  const buildBlock = sliceBetween(
    tabView,
    'function buildYoutubeChannelsFeedUrl(url) {',
    'function renderSubscriptionsImportState() {'
  );
  const resolveBlock = sliceBetween(
    tabView,
    'async function resolveSubscriptionsImportTab() {',
    'async function startSubscribedChannelsImport(trigger = \'manual\') {'
  );

  assert.match(buildBlock, /return 'https:\/\/m\.youtube\.com\/feed\/channels'/);
  assert.match(resolveBlock, /const targetUrl = buildYoutubeChannelsFeedUrl\(candidate\.url\)/);
  assert.match(resolveBlock, /updateBrowserTab\(candidate\.id, \{ url: targetUrl, active: false \}\)/);
  assert.match(resolveBlock, /createBrowserTab\(\{\s*url: 'https:\/\/m\.youtube\.com\/feed\/channels',\s*active: false\s*\}\)/);
  assert.doesNotMatch(resolveBlock, /externalNavigationAuthority|youtubeWorkflowNavigationPolicy|urlClass/);
});

test('extension static target-blank anchors keep uneven rel policy pinned', () => {
  const popupHtml = read('html/popup.html');
  const tabHtml = read('html/tab-view.html');

  assert.equal(count(tabHtml, /target="_blank"/g), 7);
  assert.equal(count(tabHtml, /rel="noopener noreferrer"/g), 4);
  assert.equal(count(tabHtml, /rel="noreferrer"/g), 2);
  assert.match(tabHtml, /<a href="https:\/\/filtertube\.in" target="_blank" class="brand"/);
  assert.match(tabHtml, /href="https:\/\/www\.filtertube\.in\/downloads" target="_blank" rel="noreferrer"/);
  assert.match(tabHtml, /href="https:\/\/support\.google\.com\/youtubekids\/answer\/7178746\?hl=en" target="_blank" rel="noopener noreferrer"/);
  assert.equal(count(popupHtml, /href="https:\/\/fonts\.googleapis\.com/g), 1);
  assert.equal(count(tabHtml, /href="https:\/\/fonts\.googleapis\.com/g), 1);
});

test('website external links are split across shared and page-local helpers', () => {
  const marketing = read('website/components/marketing-ui.js');
  const header = read('website/components/site-header.js');
  const footer = read('website/components/site-footer.js');
  const downloads = read('website/app/downloads/page.js');
  const homepage = read('website/app/page.js');
  const privacy = read('website/app/privacy/page.js');

  assert.match(marketing, /export function ActionLink/);
  assert.match(marketing, /<a className=\{classes\} href=\{href\} rel="noreferrer" target="_blank">/);
  assert.match(header, /href=\{githubHref\}[\s\S]+rel="noreferrer"[\s\S]+target="_blank"/);
  assert.match(footer, /function FooterLink\(\{ link \}\)/);
  assert.match(footer, /rel="noreferrer"[\s\S]+target="_blank"/);
  assert.match(downloads, /function ExternalTextLink\(\{ href, children \}\)/);
  assert.match(downloads, /<ActionLink external href=\{action\.href\}/);
  assert.match(homepage, /href=\{demoVideoHref\}[\s\S]+target="_blank"/);
  assert.match(homepage, /support\.google\.com\/youtubekids\/thread\/54509605/);
  assert.match(privacy, /function PolicyLink\(\{ href, children \}\)/);
  assert.match(privacy, /target=\{href\.startsWith\("http"\) \? "_blank" : undefined\}/);
});

test('future external navigation authority symbols are absent from product and website source', () => {
  const source = trackedNavigationSource();
  const doc = read(docPath);
  const futureSymbols = [
    'externalNavigationSurfaceBoundaryContract',
    'externalNavigationDecisionReport',
    'externalNavigationUrlClassReport',
    'externalNavigationTrustedSenderReport',
    'externalNavigationWhatsNewUrlPolicy',
    'externalNavigationReleaseFallbackPolicy',
    'externalNavigationExtensionHtmlLinkPolicy',
    'externalNavigationWebsiteLinkPolicy',
    'externalNavigationSubscriptionImportTabPolicy',
    'externalNavigationPublicUrlDataReport',
    'externalNavigationFixtureProvenance',
    'externalNavigationMetricArtifact',
  ];

  for (const symbol of futureSymbols) {
    assert.equal(source.includes(symbol), false, `${symbol} unexpectedly exists in source`);
    assert.ok(doc.includes(symbol), `doc missing future symbol ${symbol}`);
  }

  for (const riskMarker of [
    'Reliability: runtime opens, static anchors, website links',
    'False-hide/leak: a caller-supplied or drifted link can move users',
    'Performance: subscription import can query, update, create, and ping tabs',
    'Code burden: extension runtime, static HTML, website components',
  ]) {
    assert.ok(doc.includes(riskMarker), `doc missing risk marker ${riskMarker}`);
  }
});
