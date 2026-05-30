import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_AUTHORITY_AUDIT_2026-05-18.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `Missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `Missing end needle: ${endNeedle}`);
  return source.slice(start, end);
}

function extensionNavigationCounts() {
  const files = [
    'js/background.js',
    'js/popup.js',
    'js/tab-view.js',
    'js/content/release_notes_prompt.js'
  ];
  const patterns = {
    windowOpen: /\bwindow\.open\s*\(/g,
    locationHref: /\blocation\.href\s*=/g,
    browserTabsCreate: /\bbrowserAPI\.tabs\.create\s*\(/g,
    tabsApiCreate: /\btabsApi\.create\s*\(/g,
    runtimeTabsCreate: /\bruntimeAPI\.tabs\.create\s*\(/g,
    createBrowserTab: /\bcreateBrowserTab\s*\(/g
  };

  const byFile = {};
  for (const file of files) {
    const text = read(file);
    byFile[file] = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      byFile[file][key] = (text.match(pattern) || []).length;
    }
  }
  return byFile;
}

test('external navigation audit documents runtime static website and future authority boundaries', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'Current Extension Runtime Navigation Counts',
    'Static Extension HTML Link Surfaces',
    'Website Link Surfaces',
    'Ignored Raw Capture Boundary',
    'Future token: `externalNavigationAuthority`',
    'extension_internal',
    'official_store_listing',
    'youtube_workflow_dependency',
    'nanah_reference',
    'external_navigation_authority_counts_extension_runtime_open_surfaces'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('current extension runtime navigation primitive counts match the audit', () => {
  const counts = extensionNavigationCounts();

  assert.deepEqual(counts['js/background.js'], {
    windowOpen: 0,
    locationHref: 0,
    browserTabsCreate: 1,
    tabsApiCreate: 0,
    runtimeTabsCreate: 0,
    createBrowserTab: 0
  });
  assert.deepEqual(counts['js/popup.js'], {
    windowOpen: 5,
    locationHref: 0,
    browserTabsCreate: 0,
    tabsApiCreate: 2,
    runtimeTabsCreate: 0,
    createBrowserTab: 0
  });
  assert.deepEqual(counts['js/tab-view.js'], {
    windowOpen: 1,
    locationHref: 0,
    browserTabsCreate: 0,
    tabsApiCreate: 0,
    runtimeTabsCreate: 2,
    createBrowserTab: 2
  });
  assert.deepEqual(counts['js/content/release_notes_prompt.js'], {
    windowOpen: 1,
    locationHref: 1,
    browserTabsCreate: 0,
    tabsApiCreate: 0,
    runtimeTabsCreate: 0,
    createBrowserTab: 0
  });
});

test('What’s New navigation currently accepts caller supplied URL and release banner has fallback navigation', () => {
  const background = read('js/background.js');
  const releasePrompt = read('js/content/release_notes_prompt.js');
  const backgroundBlock = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );
  const promptBlock = sliceBetween(
    releasePrompt,
    'const targetLink = WHATS_NEW_URL || payload.link;',
    'actions.appendChild(learnBtn);'
  );

  assert.match(backgroundBlock, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(backgroundBlock, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.match(promptBlock, /api\.runtime\.sendMessage\(\{ action: 'FilterTube_OpenWhatsNew', url: targetLink \}/);
  assert.match(promptBlock, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(promptBlock, /location\.href = targetLink/);
});

test('popup internal tab opens use runtime getURL but still have window.open fallbacks', () => {
  const popup = read('js/popup.js');
  const contentControlsBlock = sliceBetween(
    popup,
    "manageInTab.addEventListener('click', () => {",
    'applyPopupVideoFiltersForActiveProfile();'
  );
  const openInTabBlock = sliceBetween(
    popup,
    'if (openInTabBtn) {',
    'if (toggleEnabledBrandBtn) {'
  );

  assert.match(contentControlsBlock, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html\?view=kids&section=content'\)/);
  assert.match(contentControlsBlock, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html\?view=filters&section=categories'\)/);
  assert.match(contentControlsBlock, /tabsApi\.create\(\{ url \}\)/);
  assert.match(contentControlsBlock, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.match(openInTabBlock, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html'\)/);
  assert.match(openInTabBlock, /tabsApi\.create\(\{ url \}\)/);
  assert.match(openInTabBlock, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
});

test('tab-view external support and subscription import opens are fixed URL workflows today', () => {
  const tabView = read('js/tab-view.js');
  const supportBlock = sliceBetween(
    tabView,
    'if (openKofiBtn) {',
    'async function createBrowserTab(createProperties)'
  );
  const importBlock = sliceBetween(
    tabView,
    "updateSubscriptionsImportWaitState('opening_fallback');",
    'preferredSubscriptionsImportTabId = createdTab.id;'
  );

  assert.match(supportBlock, /const url = 'https:\/\/ko-fi\.com\/filtertube'/);
  assert.match(supportBlock, /runtimeAPI\.tabs\.create\(\{ url \}\)/);
  assert.match(supportBlock, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.match(importBlock, /url: 'https:\/\/m\.youtube\.com\/feed\/channels'/);
  assert.match(importBlock, /active: false/);
});

test('extension static HTML target blank links are mixed rel-policy surfaces today', () => {
  const tabHtml = read('html/tab-view.html');
  const popupHtml = read('html/popup.html');
  const targetBlankCount = (tabHtml.match(/target="_blank"/g) || []).length;
  const httpsHrefCount = (tabHtml.match(/href="https?:\/\//g) || []).length;

  assert.equal(targetBlankCount, 7);
  assert.equal(httpsHrefCount, 8);
  assert.match(popupHtml, /fonts\.googleapis\.com/);
  assert.match(tabHtml, /<a href="https:\/\/filtertube\.in" target="_blank" class="brand"/);
  assert.match(tabHtml, /href="https:\/\/www\.filtertube\.in\/downloads" target="_blank" rel="noreferrer"/);
  assert.match(tabHtml, /href="https:\/\/nanah-signaling\.varshney-devansh614\.workers\.dev\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(tabHtml, /href="https:\/\/github\.com\/varshneydevansh\/nanah" target="_blank" rel="noopener noreferrer"/);
});

test('website external link data and components are public-site navigation surfaces', () => {
  const routeContent = read('website/components/route-content.js');
  const siteData = read('website/components/site-data.js');
  const marketingUi = read('website/components/marketing-ui.js');
  const downloads = read('website/app/downloads/page.js');
  const siteHeader = read('website/components/site-header.js');

  assert.match(routeContent, /export const demoVideoHref = "https:\/\/m\.youtube\.com\/watch\?v=dmLUu3lm7dE"/);
  assert.match(routeContent, /export const githubHref = "https:\/\/github\.com\/varshneydevansh\/FilterTube"/);
  assert.match(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
  assert.match(siteData, /https:\/\/chromewebstore\.google\.com\/detail\/filtertube/);
  assert.match(siteData, /https:\/\/addons\.mozilla\.org\/en-US\/firefox\/addon\/filtertube\//);
  assert.match(siteData, /https:\/\/microsoftedge\.microsoft\.com\/addons\/detail\/filtertube/);
  assert.match(marketingUi, /rel="noreferrer" target="_blank"/);
  assert.match(downloads, /rel="noreferrer"[\s\S]+target="_blank"/);
  assert.match(siteHeader, /href=\{githubHref\}[\s\S]+rel="noreferrer"[\s\S]+target="_blank"/);
});

test('external navigation authority is a future gate and raw captures remain excluded', () => {
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const productSource = git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');

  for (const fixture of [
    'external_navigation_authority_counts_extension_runtime_open_surfaces',
    'external_navigation_authority_open_whats_new_rejects_caller_supplied_url',
    'external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url',
    'external_navigation_authority_popup_internal_opens_use_runtime_geturl',
    'external_navigation_authority_kofi_link_is_fixed_and_user_initiated',
    'external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url',
    'external_navigation_authority_extension_target_blank_links_have_noopener_policy',
    'external_navigation_authority_website_external_links_share_one_component_policy',
    'external_navigation_authority_public_link_data_is_classified_by_url_class',
    'external_navigation_authority_raw_capture_urls_never_become_open_targets'
  ]) {
    assert.ok(gate.includes(fixture), `missing gate fixture ${fixture}`);
  }

  assert.doesNotMatch(productSource, /\bexternalNavigationAuthority\b/);
  assert.ok(read('docs/audit/FILTERTUBE_EXTERNAL_NAVIGATION_AUTHORITY_AUDIT_2026-05-18.md').includes('Root ignored HTML/JSON/TXT captures'));
});
