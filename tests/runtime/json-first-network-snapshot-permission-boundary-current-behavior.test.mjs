import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function countLiteral(source, literal) {
  return source.split(literal).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function settings(overrides = {}) {
  return {
    enabled: true,
    profileType: 'main',
    listMode: 'blocklist',
    filterKeywords: [{ pattern: 'needle', flags: 'i' }],
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

function runtimeFor(payload = { marker: 'payload' }, overrides = {}) {
  const runtime = loadSeedRuntime({
    repoRoot,
    hostname: overrides.hostname || 'www.youtube.com',
    pathname: overrides.pathname || '/watch',
    origin: overrides.origin || `https://${overrides.hostname || 'www.youtube.com'}`,
    payload,
    ...overrides
  });
  if (overrides.withoutSettings !== true) {
    runtime.window.filterTube.updateSettings(settings(overrides.settings || {}));
  }
  return runtime;
}

async function fetchAndParse(runtime, url) {
  const response = await runtime.window.fetch(url);
  return response.json();
}

function endpointSnapshots(runtime) {
  const ft = runtime.window.filterTube;
  return {
    search: ft.lastYtSearchResponse,
    browse: ft.lastYtBrowseResponse,
    next: ft.lastYtNextResponse,
    player: ft.lastYtPlayerResponse,
    recentSearch: ft.recentYtSearchResponses,
    recentBrowse: ft.recentYtBrowseResponses
  };
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first network snapshot permission boundary audit is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, snapshot-permission\s+patch/);
  assert.match(text, /source files with snapshot permission boundary surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(text, new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`));
});

test('snapshot permission boundary source rows and current counts are pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const stashBlock = sliceBetween(seed, 'function stashNetworkSnapshot(data, dataName)', 'let replayTimer = null;');
  const processBlock = sliceBetween(seed, 'function processWithEngine(data, dataName)', 'function basicProcessing(data, dataName)');
  const updateBlock = sliceBetween(seed, 'function updateSettings(newSettings)', '// ============================================================================\n    // GLOBAL INTERFACE');
  const globalBlock = sliceBetween(seed, 'window.filterTube = {', '// ============================================================================\n    // INITIALIZATION');

  for (const marker of [
    'snapshot writer functions: 1',
    'snapshot writer route or hostname reads: 0',
    'snapshot writer profile or list-mode reads: 0',
    'snapshot writer enabled-state reads: 0',
    'pre-writer settings gates: 2',
    'settings-update endpoint snapshot clear sites: 0',
    'global endpoint snapshot initializers: 0',
    'runtime route/surface snapshot fixtures: 4',
    'runtime host snapshot fixtures: 3',
    'runtime profile/list-mode snapshot fixtures: 4',
    'runtime no-settings no-snapshot fixtures: 1',
    'runtime disabled no-snapshot fixtures: 1',
    'runtime settings-change retention fixtures: 1'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [43, 50, 51, 66, 72, 87, 353, 359, 913, 916, 977]) {
    assert.ok(text.includes(`\`js/seed.js:${line}\``), `doc should cite js/seed.js:${line}`);
  }

  assert.equal(countLiteral(seed, 'function stashNetworkSnapshot(data, dataName)'), 1);
  assert.equal(countLiteral(stashBlock, 'document.location'), 0);
  assert.equal(countLiteral(stashBlock, 'location.'), 0);
  assert.equal(countLiteral(stashBlock, 'hostname'), 0);
  assert.equal(countLiteral(stashBlock, 'profileType'), 0);
  assert.equal(countLiteral(stashBlock, 'listMode'), 0);
  assert.equal(countLiteral(stashBlock, 'cachedSettings'), 0);
  assert.equal(countLiteral(stashBlock, 'enabled'), 0);
  assert.equal(countLiteral(processBlock, 'if (!cachedSettings)'), 1);
  assert.equal(countLiteral(processBlock, 'cachedSettings.enabled === false'), 1);
  assert.equal(countLiteral(updateBlock, 'lastYtSearchResponse'), 0);
  assert.equal(countLiteral(updateBlock, 'recentYtSearchResponses'), 0);
  assert.equal(countLiteral(updateBlock, 'lastYtBrowseResponse'), 0);
  assert.equal(countLiteral(updateBlock, 'recentYtBrowseResponses'), 0);
  assert.equal(countLiteral(updateBlock, 'lastYtNextResponse'), 0);
  assert.equal(countLiteral(updateBlock, 'lastYtPlayerResponse'), 0);
  assert.equal(countLiteral(globalBlock, 'lastYtSearchResponse'), 0);
  assert.equal(countLiteral(globalBlock, 'recentYtSearchResponses'), 0);
  assert.equal(countLiteral(globalBlock, 'lastYtBrowseResponse'), 0);
  assert.equal(countLiteral(globalBlock, 'lastYtNextResponse'), 0);
  assert.equal(countLiteral(globalBlock, 'lastYtPlayerResponse'), 0);
});

test('enabled settings currently write search snapshots across route and surface path contexts', async () => {
  for (const pathname of ['/watch', '/feed/channels', '/shorts', '/results']) {
    const runtime = runtimeFor({ endpoint: 'search', pathname }, { pathname });

    await fetchAndParse(runtime, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

    assert.equal(runtime.window.filterTube.lastYtSearchResponse.pathname, pathname);
    assert.equal(runtime.window.filterTube.lastYtSearchResponseName, 'fetch:/youtubei/v1/search');
    assert.equal(runtime.calls.processData.length, 1);
    assert.equal(runtime.calls.processData[0].settings.profileType, 'main');
    assert.equal(runtime.calls.processData[0].settings.listMode, 'blocklist');
  }
});

test('enabled settings currently write browse snapshots across host contexts', async () => {
  for (const hostname of ['www.youtube.com', 'music.youtube.com', 'm.youtube.com']) {
    const runtime = runtimeFor({ endpoint: 'browse', hostname }, { hostname, pathname: '/feed/channels' });

    await fetchAndParse(runtime, `https://${hostname}/youtubei/v1/browse?prettyPrint=false`);

    assert.equal(runtime.window.filterTube.lastYtBrowseResponse.hostname, hostname);
    assert.equal(runtime.window.filterTube.lastYtBrowseResponseName, 'fetch:/youtubei/v1/browse');
    assert.equal(runtime.window.filterTube.recentYtBrowseResponses.length, 1);
  }
});

test('enabled settings currently write snapshots across profile and list-mode combinations', async () => {
  for (const mode of [
    { profileType: 'main', listMode: 'blocklist' },
    { profileType: 'main', listMode: 'whitelist' },
    { profileType: 'kids', listMode: 'blocklist' },
    { profileType: 'kids', listMode: 'whitelist' }
  ]) {
    const runtime = runtimeFor({ endpoint: 'search', mode }, { settings: mode });

    await fetchAndParse(runtime, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

    assert.equal(runtime.window.filterTube.lastYtSearchResponse.mode.profileType, mode.profileType);
    assert.equal(runtime.window.filterTube.lastYtSearchResponse.mode.listMode, mode.listMode);
    assert.equal(runtime.calls.processData[0].settings.profileType, mode.profileType);
    assert.equal(runtime.calls.processData[0].settings.listMode, mode.listMode);
    assert.equal(runtime.window.filterTube.recentYtSearchResponses.length, 1);
  }
});

test('no settings and disabled settings stop new endpoint snapshots before the writer', async () => {
  const noSettings = runtimeFor({ endpoint: 'search', case: 'no-settings' }, { withoutSettings: true });
  await fetchAndParse(noSettings, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(noSettings.window.filterTube.getStats().queuedItems, 0);
  assert.equal(noSettings.calls.processData.length, 0);
  assert.deepEqual(endpointSnapshots(noSettings), {
    search: undefined,
    browse: undefined,
    next: undefined,
    player: undefined,
    recentSearch: undefined,
    recentBrowse: undefined
  });

  const disabled = runtimeFor(
    { endpoint: 'search', case: 'disabled' },
    { settings: { enabled: false, profileType: 'kids', listMode: 'whitelist' } }
  );
  await fetchAndParse(disabled, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(disabled.window.filterTube.getStats().queuedItems, 0);
  assert.equal(disabled.calls.processData.length, 0);
  assert.deepEqual(endpointSnapshots(disabled), {
    search: undefined,
    browse: undefined,
    next: undefined,
    player: undefined,
    recentSearch: undefined,
    recentBrowse: undefined
  });
});

test('settings changes currently retain existing endpoint snapshots and recent entries', async () => {
  const runtime = runtimeFor({ endpoint: 'search', marker: 'before-switch' });

  await fetchAndParse(runtime, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  const initialSnapshot = runtime.window.filterTube.lastYtSearchResponse;
  const initialRecent = runtime.window.filterTube.recentYtSearchResponses[0];
  assert.equal(initialSnapshot.marker, 'before-switch');
  assert.equal(initialRecent.data, initialSnapshot);

  runtime.window.filterTube.updateSettings(settings({
    enabled: false,
    profileType: 'kids',
    listMode: 'whitelist'
  }));
  await fetchAndParse(runtime, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');

  assert.equal(runtime.window.filterTube.settings.enabled, false);
  assert.equal(runtime.window.filterTube.settings.profileType, 'kids');
  assert.equal(runtime.window.filterTube.settings.listMode, 'whitelist');
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.window.filterTube.lastYtSearchResponse, initialSnapshot);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses[0], initialRecent);
  assert.equal(runtime.window.filterTube.recentYtSearchResponses[0].data, initialSnapshot);
});

test('network snapshot permission boundary authority symbols are not implemented in runtime source yet', () => {
  const text = doc();
  const runtimeSource = productRuntimeSource();

  for (const field of [
    'snapshotProducerPermissionDecision',
    'snapshotConsumerPermissionDecision',
    'snapshotRoutePermission',
    'snapshotSurfacePermission',
    'snapshotHostPermission',
    'snapshotProfilePermission',
    'snapshotListModePermission',
    'snapshotSettingsRevisionGate',
    'snapshotDisabledStateInvalidationReport',
    'snapshotRetentionPolicy',
    'snapshotMetricArtifact'
  ]) {
    assert.match(text, new RegExp(field));
  }

  for (const missingSymbol of [
    'jsonFirstNetworkSnapshotPermissionBoundaryContract',
    'jsonFirstNetworkSnapshotProducerPermissionDecision',
    'jsonFirstNetworkSnapshotRoutePermission',
    'jsonFirstNetworkSnapshotSurfacePermission',
    'jsonFirstNetworkSnapshotHostPermission',
    'jsonFirstNetworkSnapshotProfilePermission',
    'jsonFirstNetworkSnapshotSettingsRevisionGate',
    'jsonFirstNetworkSnapshotRetentionPolicy',
    'jsonFirstNetworkSnapshotDisabledInvalidationReport',
    'jsonFirstNetworkSnapshotPermissionMetricArtifact'
  ]) {
    assert.match(text, new RegExp(missingSymbol));
    assert.doesNotMatch(runtimeSource, new RegExp(missingSymbol));
  }
});
