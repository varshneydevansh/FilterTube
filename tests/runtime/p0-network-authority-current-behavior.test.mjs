import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();

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

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function searchPayload() {
  return {
    onResponseReceivedCommands: [{
      appendContinuationItemsAction: {
        continuationItems: [{ videoRenderer: { videoId: 'abcdefghijk' } }]
      }
    }]
  };
}

function networkPrimitiveCounts() {
  const files = git(['ls-files', '*.js', '*.mjs', '*.jsx'])
    .filter(file => !file.includes('/vendor/'));
  const patterns = {
    fetch: /\bfetch\s*\(/g,
    xhr: /\bXMLHttpRequest\b/g,
    credentials: /credentials\s*:/g,
    tabsCreate: /tabs\.create\s*\(/g,
    open: /window\.open\s*\(/g
  };

  const total = { fetch: 0, xhr: 0, credentials: 0, tabsCreate: 0, open: 0 };
  const byFile = {};
  for (const file of files) {
    const text = read(file);
    const row = {};
    let sum = 0;
    for (const [key, pattern] of Object.entries(patterns)) {
      const n = (text.match(pattern) || []).length;
      row[key] = n;
      total[key] += n;
      sum += n;
    }
    if (sum) byFile[file] = row;
  }
  return { total, byFile };
}

const p0NetworkFixtures = [
  'network_authority_counts_all_tracked_fetch_xhr_open_surfaces',
  'network_authority_release_note_fetches_are_extension_resource_only',
  'network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason',
  'network_authority_kids_identity_fetch_requires_kids_surface_reason',
  'network_authority_channel_detail_fetch_rejects_untrusted_sender',
  'network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason',
  'network_authority_subscription_import_fetch_requires_explicit_user_import',
  'network_authority_seed_interception_no_rule_passes_through_without_parse',
  'network_authority_fetch_credentials_policy_is_declared_per_owner',
  'network_authority_website_remotes_are_website_only_claims',
  'network_authority_external_tab_open_urls_are_allowlisted',
  'network_authority_raw_capture_urls_never_become_runtime_fetch_targets'
];

test('P0 network audit documents current behavior and future network contract', () => {
  const doc = read('docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md');
  const p0Register = read('docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md');
  const readinessGate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  for (const fixture of p0NetworkFixtures) {
    assert.ok(doc.includes(fixture), `missing network fixture ${fixture}`);
    assert.ok(p0Register.includes(fixture), `fixture must remain in P0 register ${fixture}`);
    assert.ok(readinessGate.includes(fixture), `fixture must remain in readiness gate ${fixture}`);
  }

  for (const phrase of [
    'networkAuthority owner id exists',
    'trigger and sender class exist',
    'credentials policy is declared by owner',
    'activeRuleReason or metadataReason exists',
    'pass-through endpoint decisions happen before JSON parse/stringify',
    'raw capture path count in runtime fetch targets: 0',
    'P0 network/fetch authority family is not green'
  ]) {
    assert.ok(doc.includes(phrase), `missing network contract phrase ${phrase}`);
  }
});

test('network_authority_counts_all_tracked_fetch_xhr_open_surfaces pins current primitive counts', () => {
  const counts = networkPrimitiveCounts();

  assert.deepEqual(counts.total, {
    fetch: 14,
    xhr: 2,
    credentials: 11,
    tabsCreate: 3,
    open: 7
  });
  assert.deepEqual(counts.byFile['js/background.js'], { fetch: 7, xhr: 0, credentials: 6, tabsCreate: 1, open: 0 });
  assert.deepEqual(counts.byFile['js/content_bridge.js'], { fetch: 4, xhr: 0, credentials: 3, tabsCreate: 0, open: 0 });
  assert.deepEqual(counts.byFile['js/injector.js'], { fetch: 1, xhr: 0, credentials: 1, tabsCreate: 0, open: 0 });
  assert.deepEqual(counts.byFile['js/seed.js'], { fetch: 0, xhr: 2, credentials: 0, tabsCreate: 0, open: 0 });
});

test('network_authority_release_note_fetches_are_extension_resource_only is pinned for current behavior', () => {
  const background = read('js/background.js');
  const tabView = read('js/tab-view.js');
  const backgroundBlock = sliceBetween(background, 'async function loadReleaseNotesData()', 'async function buildReleaseNotesPayload(version)');
  const tabViewBlock = sliceBetween(tabView, 'async function loadReleaseNotesIntoDashboard()', '        const validNotes = notes.filter');

  assert.match(backgroundBlock, /browserAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(backgroundBlock, /fetch\(url\)/);
  assert.doesNotMatch(backgroundBlock, /youtube\.com|youtubekids\.com|youtubei/);
  assert.match(tabViewBlock, /runtimeAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(tabViewBlock, /: 'data\/release_notes\.json'/);
  assert.match(tabViewBlock, /fetch\(url\)/);
  assert.doesNotMatch(tabViewBlock, /youtube\.com|youtubekids\.com|youtubei/);
});

test('network_authority_watch_identity_fetch_requires_valid_video_id_and_active_reason is not fully satisfied today', () => {
  const background = read('js/background.js');
  const block = sliceBetween(background, 'async function performWatchIdentityFetch(videoId)', 'async function fetchChannelInfo(channelIdOrHandle)');

  assert.ok(block.includes("!/^[a-zA-Z0-9_-]{11}$/.test(videoId)"));
  assert.match(block, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(block, /credentials: 'include'/);
  assert.doesNotMatch(block, /activeRuleReason|metadataReason|networkAuthority|maxPerNavigation/);
});

test('network_authority_kids_identity_fetch_requires_kids_surface_reason is not fully satisfied today', () => {
  const background = read('js/background.js');
  const block = sliceBetween(background, 'async function performKidsWatchIdentityFetch(videoId)', 'async function performWatchIdentityFetch(videoId)');

  assert.ok(block.includes("!/^[a-zA-Z0-9_-]{11}$/.test(videoId)"));
  assert.match(block, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(block, /credentials: 'include'/);
  assert.doesNotMatch(block, /targetSurface|kidsSurfaceReason|networkAuthority|maxPerNavigation/);
});

test('network_authority_channel_detail_fetch_rejects_untrusted_sender is not satisfied by current behavior', () => {
  const background = read('js/background.js');
  const block = sliceBetween(background, 'else if (request.action === "fetchChannelDetails")', '// Handle any browser-specific actions if needed');

  assert.match(background, /function isTrustedUiSender\(sender\)/);
  assert.match(block, /fetchChannelInfo\(request\.channelIdOrHandle\)/);
  assert.doesNotMatch(block, /isTrustedUiSender|trustedUi|allowedYoutubeContentScript/);
});

test('network_authority_content_bridge_watch_fetch_requires_metadata_or_identity_reason is not fully satisfied today', () => {
  const bridge = read('js/content_bridge.js');
  const metadataBlock = sliceBetween(
    bridge,
    'async function fetchVideoMetaFromWatchUrl(videoId) {',
    '        if (!lengthSeconds && !publishDate && !uploadDate && !category) return null;'
  );
  const shortsBlock = sliceBetween(
    bridge,
    'async function fetchChannelFromShortsUrlDirect(videoId, requestedHandle = null, normalizedExpected = null) {',
    '/**\n * Fetch channel information from the /watch?v=ID page'
  );
  const watchBlock = sliceBetween(
    bridge,
    'async function fetchChannelFromWatchUrl(videoId, requestedHandle = null) {',
    'async function injectFilterTubeMenuItem'
  );

  assert.match(metadataBlock, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(metadataBlock, /credentials: 'same-origin'/);
  assert.match(shortsBlock, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /videoId\.length !== 11/);
  assert.doesNotMatch(metadataBlock + shortsBlock + watchBlock, /networkAuthority|metadataReason|identityReason|maxPerNavigation/);
});

test('network_authority_subscription_import_fetch_requires_explicit_user_import is only partially represented today', () => {
  const injector = read('js/injector.js');
  const bridge = read('js/content_bridge.js');
  const bridgeSettings = read('js/content/bridge_settings.js');
  const block = sliceBetween(
    injector,
    'const performScrollStep = async () => {',
    "window.postMessage({\n                type: 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.equal((injector.match(/\bfetch\s*\(/g) || []).length, 1);
  assert.match(injector, /FilterTube_RequestSubscriptionImport/);
  assert.match(bridge + bridgeSettings, /FilterTube_RequestSubscriptionImport/);
  assert.match(block, /fetch\(endpointUrl,/);
  assert.match(block, /method: 'POST'/);
  assert.match(block, /credentials: 'include'/);
  assert.match(block, /\/youtubei\/v1\/browse/);
  assert.doesNotMatch(block, /networkAuthority|trustedUi|explicitUserImport/);
});

test('network_authority_seed_interception_no_rule_passes_through_without_parse is satisfied by current behavior', async () => {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/results',
    payload: searchPayload()
  });
  runtime.window.filterTube.updateSettings(settings());

  await runtime.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 0, 'search skips processData');
  assert.equal(runtime.calls.harvestOnly.length, 0, 'search skips harvest without active work');
  assert.equal(runtime.calls.responseJson.length, 0, 'search does not parse a cloned response');
  assert.equal(runtime.calls.jsonStringify.length, 0, 'search does not rebuild the response body');
});

test('network_authority_fetch_credentials_policy_is_declared_per_owner is not satisfied by current behavior', () => {
  const productSource = [
    'js/background.js',
    'js/content_bridge.js',
    'js/injector.js',
    'js/content/handle_resolver.js',
    'js/seed.js'
  ].map(read).join('\n');

  assert.equal((productSource.match(/credentials\s*:/g) || []).length, 11);
  assert.match(productSource, /credentials: 'include'/);
  assert.match(productSource, /credentials: 'same-origin'/);
  assert.match(productSource, /credentials: 'omit'/);
  assert.doesNotMatch(productSource, /networkAuthority|credentialsPolicy|ownerCredentialPolicy/);
});

test('network_authority_website_remotes_are_website_only_claims is pinned for current behavior', () => {
  const layout = read('website/app/layout.js');
  const routeContent = read('website/components/route-content.js');
  const privacy = read('website/app/privacy/page.js');
  const extensionRuntime = [
    'manifest.json',
    'manifest.chrome.json',
    'manifest.firefox.json',
    'manifest.opera.json',
    'js/background.js',
    'js/content_bridge.js',
    'js/seed.js',
    'js/injector.js'
  ].map(read).join('\n');

  assert.match(layout, /@vercel\/analytics\/next/);
  assert.match(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
  assert.match(privacy, /Vercel Web Analytics is used only on filtertube\.in/);
  assert.match(privacy, /It is not included in the browser extension or native apps/);
  assert.doesNotMatch(extensionRuntime, /@vercel\/analytics|cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
});

test('network_authority_external_tab_open_urls_are_allowlisted is not fully satisfied today', () => {
  const background = read('js/background.js');
  const block = sliceBetween(background, "else if (action === 'FilterTube_OpenWhatsNew')", "else if (action === 'FilterTube_SubscriptionsImportProgress')");
  const popup = read('js/popup.js');
  const tabView = read('js/tab-view.js');

  assert.match(block, /const url = request\?\.url \|\| WHATS_NEW_PAGE_URL/);
  assert.match(block, /browserAPI\.tabs\.create\(\{ url: url, active: true \}/);
  assert.doesNotMatch(block, /allowlist|allowedUrl|isTrustedUiSender/);
  assert.ok((popup.match(/window\.open\s*\(/g) || []).length > 0);
  assert.ok((tabView.match(/tabs\.create\s*\(/g) || []).length > 0);
});

test('network_authority_raw_capture_urls_never_become_runtime_fetch_targets is pinned for current behavior', () => {
  const ignoredCaptureNames = read('.gitignore')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => /\.(?:json|html|txt|JS|js|md)$/i.test(line))
    .filter(line => /YT_|YTM|ytkids|watch|playlist|collab|comments|logs|tmp|stash|reset|WHITELIST|DOMs|guide|reel|import_channels|extracted_watch_paths|strange_ytInitialData/.test(line));
  const productFiles = git(['ls-files', 'js', 'manifest*.json', 'html', 'data', 'scripts'])
    .filter(file => !file.includes('/vendor/'));
  const productSource = productFiles.map(file => read(file)).join('\n');

  assert.ok(ignoredCaptureNames.length >= 40, 'expected ignored raw capture corpus names');
  for (const captureName of ignoredCaptureNames) {
    assert.doesNotMatch(productSource, new RegExp(captureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
