import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22.md';

const endpointFamilies = [
  '/youtubei/v1/search',
  '/youtubei/v1/guide',
  '/youtubei/v1/browse',
  '/youtubei/v1/next',
  '/youtubei/v1/player'
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
    hostname: 'www.youtube.com',
    pathname: '/',
    payload,
    ...overrides
  });
  runtime.window.filterTube.updateSettings(settings(overrides.settings || {}));
  return runtime;
}

async function fetchAndParse(runtime, url) {
  const response = await runtime.window.fetch(url);
  return response.json();
}

function snapshotFields(runtime) {
  const ft = runtime.window.filterTube;
  return {
    search: ft.lastYtSearchResponse,
    guide: ft.lastYtGuideResponse,
    browse: ft.lastYtBrowseResponse,
    next: ft.lastYtNextResponse,
    player: ft.lastYtPlayerResponse
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

test('JSON-first network snapshot endpoint admission audit is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, endpoint-admission\s+patch/);
  assert.match(text, /source files with snapshot endpoint admission surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first network snapshot authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(text, new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`));
});

test('snapshot endpoint admission source rows and current counts are pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchBlock = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const xhrBlock = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  const stashBlock = sliceBetween(seed, 'function stashNetworkSnapshot(data, dataName)', 'let replayTimer = null;');

  for (const marker of [
    'fetch endpoint entries: 5',
    'XHR endpoint entries: 5',
    'snapshot writer endpoint branches: 4',
    'fetch endpoint families without snapshot branch: 1',
    'raw fetch endpoint gate sites: 1',
    'raw XHR endpoint mark sites: 2',
    'parsed data label callsites: 2',
    'snapshot label substring branch sites: 4',
    'runtime exact endpoint snapshot fixtures: 4',
    'runtime guide no-snapshot fixtures: 1',
    'runtime longer-path snapshot fixtures: 1',
    'runtime query-or-fragment no-snapshot fixtures: 3',
    'runtime cross-origin exact snapshot fixtures: 1',
    'runtime XHR raw mark fixtures: 2'
  ]) {
    assert.ok(text.includes(marker), `missing doc marker: ${marker}`);
  }

  for (const line of [51, 66, 72, 87, 668, 669, 671, 672, 689, 703, 740, 763, 764, 766, 767, 851, 928, 944]) {
    assert.ok(text.includes(`\`js/seed.js:${line}\``), `doc should cite js/seed.js:${line}`);
  }

  for (const endpoint of endpointFamilies) {
    assert.ok(fetchBlock.includes(endpoint), `fetch endpoint missing ${endpoint}`);
    assert.ok(xhrBlock.includes(endpoint), `XHR endpoint missing ${endpoint}`);
  }
  assert.equal(countLiteral(stashBlock, "name.includes('/youtubei/v1/search')"), 1);
  assert.equal(countLiteral(stashBlock, "name.includes('/youtubei/v1/next')"), 1);
  assert.equal(countLiteral(stashBlock, "name.includes('/youtubei/v1/browse')"), 1);
  assert.equal(countLiteral(stashBlock, "name.includes('/youtubei/v1/player')"), 1);
  assert.equal(countLiteral(stashBlock, "name.includes('/youtubei/v1/guide')"), 0);
  assert.equal(countLiteral(stashBlock, 'lastYtGuideResponse'), 0);
  assert.match(fetchBlock, /urlStr\.includes\(endpoint\)/);
  assert.match(xhrBlock, /urlStr\.includes\(endpoint\)/);
  assert.match(fetchBlock, /processWithEngine\(jsonData, dataName\)/);
  assert.match(xhrBlock, /processWithEngine\(jsonData, dataName\)/);
});

test('exact fetch endpoint labels admit the four current snapshot families while guide has no family', async () => {
  for (const [endpoint, field, nameField] of [
    ['search', 'lastYtSearchResponse', 'lastYtSearchResponseName'],
    ['browse', 'lastYtBrowseResponse', 'lastYtBrowseResponseName'],
    ['next', 'lastYtNextResponse', 'lastYtNextResponseName'],
    ['player', 'lastYtPlayerResponse', 'lastYtPlayerResponseName']
  ]) {
    const runtime = runtimeFor({ endpoint, id: endpoint });
    await fetchAndParse(runtime, `https://www.youtube.com/youtubei/v1/${endpoint}?prettyPrint=false`);
    assert.equal(runtime.window.filterTube[field].endpoint, endpoint);
    assert.equal(runtime.window.filterTube[nameField], `fetch:/youtubei/v1/${endpoint}`);
    assert.deepEqual(runtime.calls.processData.map((call) => call.dataName), [`fetch:/youtubei/v1/${endpoint}`]);
  }

  const guide = runtimeFor({ endpoint: 'guide' });
  await fetchAndParse(guide, 'https://www.youtube.com/youtubei/v1/guide?prettyPrint=false');
  assert.equal(guide.calls.processData[0].dataName, 'fetch:/youtubei/v1/guide');
  assert.deepEqual(snapshotFields(guide), {
    search: undefined,
    guide: undefined,
    browse: undefined,
    next: undefined,
    player: undefined
  });
});

test('longer search pathname is processed and admitted as a search snapshot family', async () => {
  const runtime = runtimeFor({ endpoint: 'searchExtra', id: 1 });
  const body = await fetchAndParse(runtime, 'https://www.youtube.com/youtubei/v1/searchExtra?prettyPrint=false');

  assert.equal(body.endpoint, 'searchExtra');
  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/searchExtra');
  assert.equal(runtime.window.filterTube.lastYtSearchResponse.endpoint, 'searchExtra');
  assert.equal(runtime.window.filterTube.lastYtSearchResponseName, 'fetch:/youtubei/v1/searchExtra');
  assert.equal(runtime.window.filterTube.recentYtSearchResponses.length, 1);
});

test('raw query hash and relative endpoint text can process without creating a snapshot family', async () => {
  for (const url of [
    'https://example.invalid/log?u=/youtubei/v1/search',
    'https://www.youtube.com/watch#/youtubei/v1/next',
    '/watch?u=/youtubei/v1/player'
  ]) {
    const runtime = runtimeFor({ endpoint: 'raw-text-only', url });
    await fetchAndParse(runtime, url);

    assert.equal(runtime.calls.responseJson.length, 1, `${url} should be admitted to body work`);
    assert.equal(runtime.calls.processData.length, 1, `${url} should be processed`);
    assert.doesNotMatch(runtime.calls.processData[0].dataName, /\/youtubei\/v1\/(?:search|browse|next|player|guide)$/);
    assert.deepEqual(snapshotFields(runtime), {
      search: undefined,
      guide: undefined,
      browse: undefined,
      next: undefined,
      player: undefined
    });
  }
});

test('cross-origin exact endpoint path still creates a snapshot family', async () => {
  const runtime = runtimeFor({ endpoint: 'browse', origin: 'cross-origin' });
  await fetchAndParse(runtime, 'https://example.invalid/youtubei/v1/browse?prettyPrint=false');

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/browse');
  assert.equal(runtime.window.filterTube.lastYtBrowseResponse.endpoint, 'browse');
  assert.equal(runtime.window.filterTube.lastYtBrowseResponseName, 'fetch:/youtubei/v1/browse');
});

test('XHR raw endpoint marks are independent of snapshot family creation until body processing', () => {
  for (const [url, expectedMark] of [
    ['https://example.invalid/log?u=/youtubei/v1/search', true],
    ['https://www.youtube.com/youtubei/v1/searchExtra?prettyPrint=false', true],
    ['https://www.youtube.com/api/stats/watchtime', false]
  ]) {
    const runtime = runtimeFor();
    const xhr = new runtime.window.XMLHttpRequest();
    xhr.open('GET', url);
    xhr.send();
    assert.equal(xhr.__filtertube_shouldProcessXhr, expectedMark, url);
    assert.deepEqual(snapshotFields(runtime), {
      search: undefined,
      guide: undefined,
      browse: undefined,
      next: undefined,
      player: undefined
    });
  }
});

test('network snapshot endpoint admission authority symbols are not implemented in runtime source yet', () => {
  const runtime = productRuntimeSource();
  const text = doc();

  for (const field of [
    'snapshotEndpointAdmissionDecision',
    'snapshotEndpointFamilyPolicy',
    'snapshotFalsePositiveReport',
    'snapshotTransportParityReport',
    'snapshotGuideEndpointPolicy',
    'snapshotEndpointMetricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  for (const missing of [
    'jsonFirstNetworkSnapshotEndpointAdmissionContract',
    'jsonFirstNetworkSnapshotParsedFamilyDecision',
    'jsonFirstNetworkSnapshotEndpointFamilyPolicy',
    'jsonFirstNetworkSnapshotGuideEndpointPolicy',
    'jsonFirstNetworkSnapshotFalsePositiveReport',
    'jsonFirstNetworkSnapshotTransportParityReport',
    'jsonFirstNetworkSnapshotEndpointFixtureProvenance',
    'jsonFirstNetworkSnapshotEndpointMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
