import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const auditDocPath = 'docs/audit/FILTERTUBE_NETWORK_AUTHORITY_AUDIT_2026-05-18.md';

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
      const count = (text.match(pattern) || []).length;
      row[key] = count;
      total[key] += count;
      sum += count;
    }
    if (sum) byFile[file] = row;
  }
  return { total, byFile };
}

test('network authority audit documents primitive counts families and future gate', () => {
  const doc = read(auditDocPath);

  for (const phrase of [
    'fetch: 14',
    'XMLHttpRequest references: 2',
    'credentials option sites: 11',
    'tabs.create: 3',
    'window.open: 7',
    'Extension-Resource Fetches',
    'YouTube Identity Fallback Fetches',
    'Subscription Import Fetches',
    'Passive YouTubei Interception',
    'Website Remote Surfaces',
    'Future token: `networkAuthority`'
  ]) {
    assert.ok(doc.includes(phrase), `missing ${phrase}`);
  }
});

test('current tracked non-vendor network primitive counts match the audit', () => {
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

test('background owns release resource and credentialed YouTube identity fetches', () => {
  const background = read('js/background.js');
  const releaseBlock = sliceBetween(
    background,
    'async function loadReleaseNotesData()',
    'async function buildReleaseNotesPayload(version)'
  );
  const shortsBlock = sliceBetween(
    background,
    'async function performShortsIdentityFetch(videoId, normalizedHandle)',
    'function extractIdentityFromPreview'
  );
  const kidsBlock = sliceBetween(
    background,
    'async function performKidsWatchIdentityFetch(videoId)',
    'async function performWatchIdentityFetch(videoId)'
  );
  const watchBlock = sliceBetween(
    background,
    'async function performWatchIdentityFetch(videoId)',
    'async function fetchChannelInfo(channelIdOrHandle)'
  );
  const channelBlock = sliceBetween(
    background,
    'async function fetchChannelInfo(channelIdOrHandle)',
    'async function handleAddFilteredChannel(input, filterAll = false'
  );

  assert.match(releaseBlock, /browserAPI\.runtime\.getURL\('data\/release_notes\.json'\)/);
  assert.match(releaseBlock, /fetch\(url\)/);
  assert.match(shortsBlock, /fetch\(`https:\/\/www\.youtube\.com\/shorts\/\$\{videoId\}`/);
  assert.match(shortsBlock, /credentials: 'include'/);
  assert.match(kidsBlock, /fetch\(`https:\/\/www\.youtubekids\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(kidsBlock, /credentials: 'include'/);
  assert.match(watchBlock, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(watchBlock, /credentials: 'include'/);
  assert.match(channelBlock, /fetch\(channelUrl,/);
  assert.match(channelBlock, /credentials: 'include'/);
  assert.match(channelBlock, /fetch\(fallbackUrl,/);
  assert.match(channelBlock, /credentials: 'omit'/);
});

test('content bridge active fetches are watch metadata or same-origin identity fallbacks', () => {
  const bridge = read('js/content_bridge.js');
  const metaBlock = sliceBetween(
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

  assert.match(metaBlock, /fetch\(`https:\/\/www\.youtube\.com\/watch\?v=\$\{videoId\}`/);
  assert.match(metaBlock, /credentials: 'same-origin'/);
  assert.match(shortsBlock, /fetch\(`\/shorts\/\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(shortsBlock, /credentials: 'same-origin'/);
  assert.match(watchBlock, /fetch\(`\/watch\?v=\$\{encodeURIComponent\(videoId\)\}`/);
  assert.match(watchBlock, /credentials: 'same-origin'/);
});

test('subscription import is the only injector fetch and is credentialed POST work', () => {
  const injector = read('js/injector.js');
  const block = sliceBetween(
    injector,
    'const performScrollStep = async () => {',
    "window.postMessage({\n                type: 'FilterTube_CollaboratorInfoResponse'"
  );

  assert.equal((injector.match(/\bfetch\s*\(/g) || []).length, 1);
  assert.match(block, /fetch\(endpointUrl,/);
  assert.match(block, /method: 'POST'/);
  assert.match(block, /credentials: 'include'/);
  assert.match(block, /\/youtubei\/v1\/browse/);
});

test('seed fetch and XHR interception are passive wrappers without networkAuthority yet', () => {
  const seed = read('js/seed.js');
  const fetchBlock = sliceBetween(seed, 'function setupFetchInterception()', 'function setupXhrInterception()');
  const xhrBlock = sliceBetween(seed, 'function setupXhrInterception()', 'function updateSettings(newSettings)');
  const productSource = [
    'js/background.js',
    'js/content_bridge.js',
    'js/content/handle_resolver.js',
    'js/injector.js',
    'js/seed.js',
    'js/tab-view.js',
    'js/popup.js'
  ].map(read).join('\n');

  assert.match(fetchBlock, /const originalFetch = window\.fetch/);
  assert.match(fetchBlock, /window\.fetch = function\(resource, init\)/);
  assert.match(fetchBlock, /response\.clone\(\)\.json\(\)/);
  assert.match(xhrBlock, /window\.__filtertubeXhrInterceptionInstalled/);
  assert.match(xhrBlock, /const originalOpen = proto\.open/);
  assert.match(xhrBlock, /const originalSend = proto\.send/);
  assert.doesNotMatch(productSource, /\bnetworkAuthority\b/);
});

test('website remotes are website-only and not extension runtime fetches', () => {
  const layout = read('website/app/layout.js');
  const routeContent = read('website/components/route-content.js');
  const privacy = read('website/app/privacy/page.js');

  assert.match(layout, /@vercel\/analytics\/next/);
  assert.match(routeContent, /cdnjs\.cloudflare\.com\/ajax\/libs\/browser-logos/);
  assert.match(privacy, /Vercel Web Analytics is used only on filtertube\.in/);
  assert.match(privacy, /It is not included in the browser extension or native apps/);
});

test('network authority fixtures are named before network behavior changes', () => {
  const gate = read('docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md');

  for (const fixture of [
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
  ]) {
    assert.ok(gate.includes(fixture), `missing gate fixture ${fixture}`);
  }
}
);
