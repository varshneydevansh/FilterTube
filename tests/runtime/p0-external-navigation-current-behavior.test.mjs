import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_P0_EXTERNAL_NAVIGATION_CURRENT_BEHAVIOR_2026-05-19.md';

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
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
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

const p0Fixtures = [
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
];

test('P0 external navigation audit documents fixture family and blocked verdict', () => {
  const doc = read(docPath);
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');
  const register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');

  assert.match(doc, /Status: current-behavior proof slice/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /P0 external navigation\/link authority family is not green/);

  for (const fixture of p0Fixtures) {
    assert.ok(doc.includes(fixture), `doc missing ${fixture}`);
    assert.ok(gate.includes(fixture), `readiness gate missing ${fixture}`);
    assert.ok(register.includes(fixture), `P0 register missing ${fixture}`);
  }
});

test('external_navigation_authority_counts_extension_runtime_open_surfaces pins current counts', () => {
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

test('external_navigation_authority_open_whats_new_rejects_caller_supplied_url is not satisfied today', () => {
  const background = read('js/background.js');
  const block = sliceBetween(
    background,
    "} else if (action === 'FilterTube_OpenWhatsNew') {",
    "} else if (action === 'FilterTube_SubscriptionsImportProgress') {"
  );

  assert.match(block, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(block, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.doesNotMatch(block, /isTrustedUiSender|allowedWhatsNewUrl|externalNavigationAuthority/);
});

test('external_navigation_authority_release_banner_fallbacks_use_allowlisted_extension_url is only partially represented today', () => {
  const prompt = read('js/content/release_notes_prompt.js');
  const block = sliceBetween(
    prompt,
    'const targetLink = WHATS_NEW_URL || payload.link;',
    'actions.appendChild(learnBtn);'
  );

  assert.match(block, /api\.runtime\.sendMessage\(\{ action: 'FilterTube_OpenWhatsNew', url: targetLink \}/);
  assert.match(block, /window\.open\(targetLink, '_blank', 'noopener'\)/);
  assert.match(block, /location\.href = targetLink/);
  assert.doesNotMatch(block, /externalNavigationAuthority|allowedWhatsNewUrl|urlClass/);
});

test('external_navigation_authority_popup_internal_opens_use_runtime_geturl is locally true with fallback drift', () => {
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
  assert.match(openInTabBlock, /runtimeApi\.runtime\.getURL\('html\/tab-view\.html'\)/);
  assert.match(contentControlsBlock + openInTabBlock, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.doesNotMatch(contentControlsBlock + openInTabBlock, /externalNavigationAuthority|urlClass|fallbackPolicy/);
});

test('external_navigation_authority_kofi_link_is_fixed_and_user_initiated is local not centralized', () => {
  const tabView = read('js/tab-view.js');
  const block = sliceBetween(
    tabView,
    'if (openKofiBtn) {',
    'async function createBrowserTab(createProperties)'
  );

  assert.match(block, /openKofiBtn\.addEventListener\('click'/);
  assert.match(block, /const url = 'https:\/\/ko-fi\.com\/filtertube'/);
  assert.match(block, /runtimeAPI\.tabs\.create\(\{ url \}\)/);
  assert.match(block, /window\.open\(url, '_blank', 'noopener,noreferrer'\)/);
  assert.doesNotMatch(block, /externalNavigationAuthority|official_support_link|userInitiated/);
});

test('external_navigation_authority_subscription_import_tab_uses_fixed_youtube_channels_url is local not centralized', () => {
  const tabView = read('js/tab-view.js');
  const block = sliceBetween(
    tabView,
    "updateSubscriptionsImportWaitState('opening_fallback');",
    'preferredSubscriptionsImportTabId = createdTab.id;'
  );

  assert.match(block, /url: 'https:\/\/m\.youtube\.com\/feed\/channels'/);
  assert.match(block, /active: false/);
  assert.doesNotMatch(block, /externalNavigationAuthority|youtube_workflow_dependency|userInitiated/);
});

test('external_navigation_authority_extension_target_blank_links_have_noopener_policy is not satisfied for every link', () => {
  const tabHtml = read('html/tab-view.html');

  assert.equal((tabHtml.match(/target="_blank"/g) || []).length, 7);
  assert.match(tabHtml, /<a href="https:\/\/filtertube\.in" target="_blank" class="brand"/);
  assert.match(tabHtml, /href="https:\/\/www\.filtertube\.in\/downloads" target="_blank" rel="noreferrer"/);
  assert.match(tabHtml, /href="https:\/\/nanah-signaling\.varshney-devansh614\.workers\.dev\/" target="_blank" rel="noopener noreferrer"/);
  assert.match(tabHtml, /href="https:\/\/github\.com\/varshneydevansh\/nanah" target="_blank" rel="noopener noreferrer"/);
});

test('external_navigation_authority_website_external_links_share_one_component_policy is only partial today', () => {
  const marketingUi = read('website/components/marketing-ui.js');
  const downloads = read('website/app/downloads/page.js');
  const siteHeader = read('website/components/site-header.js');
  const page = read('website/app/page.js');

  assert.match(marketingUi, /function ActionLink|const ActionLink|export function ActionLink/);
  assert.match(marketingUi, /rel="noreferrer" target="_blank"|target="_blank" rel="noreferrer"/);
  assert.match(downloads, /function ExternalTextLink|const ExternalTextLink/);
  assert.match(downloads, /target="_blank"/);
  assert.match(siteHeader, /href=\{githubHref\}[\s\S]+target="_blank"/);
  assert.match(page, /target="_blank"/);
});

test('external_navigation_authority_public_link_data_is_classified_by_url_class is not satisfied today', () => {
  const publicSource = [
    'website/components/route-content.js',
    'website/components/site-data.js',
    'website/components/site-header.js',
    'website/app/downloads/page.js',
    'html/tab-view.html',
    'js/tab-view.js'
  ].map(read).join('\n');

  for (const url of [
    'https://github.com/varshneydevansh/FilterTube',
    'https://chromewebstore.google.com/detail/filtertube',
    'https://addons.mozilla.org/en-US/firefox/addon/filtertube/',
    'https://m.youtube.com/watch?v=dmLUu3lm7dE',
    'https://m.youtube.com/feed/channels',
    'https://ko-fi.com/filtertube',
    'https://nanah-signaling.varshney-devansh614.workers.dev/',
    'https://support.google.com/youtubekids/answer/7178746'
  ]) {
    assert.ok(publicSource.includes(url), `missing current public URL ${url}`);
  }

  assert.doesNotMatch(publicSource, /urlClass|externalNavigationAuthority|official_store_listing|youtube_workflow_dependency/);
});

test('external_navigation_authority_raw_capture_urls_never_become_open_targets is locally true by source boundary', () => {
  const trackedProductSource = git(['ls-files', '*.js', '*.jsx', '*.mjs', '*.html'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
  const sourceBoundary = read('docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md');

  assert.ok(sourceBoundary.includes('ignored root captures'));
  assert.doesNotMatch(trackedProductSource, /WHITELIST_content|html_content|response_[0-9]+\.json/);
  assert.doesNotMatch(trackedProductSource, /rawCaptureNavigationAllowlist|rawCaptureOpenTarget/);
});
