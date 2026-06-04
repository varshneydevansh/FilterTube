import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const endpointNetworkFamilyDocs = [
  docPath,
  'docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_NETWORK_CREDENTIAL_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md',
  'docs/audit/FILTERTUBE_OPEN_APP_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_P0_NETWORK_AUTHORITY_CURRENT_BEHAVIOR_2026-05-18.md',
  'docs/audit/FILTERTUBE_NETWORK_AUTHORITY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md'
];

const endpoints = [
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

function lineOf(source, needle) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.notEqual(index, -1, `missing source needle ${needle}`);
  return index + 1;
}

function lineOfAfter(source, needle, afterNeedle) {
  const start = source.indexOf(afterNeedle);
  assert.notEqual(start, -1, `missing after needle ${afterNeedle}`);
  const index = source.indexOf(needle, start + afterNeedle.length);
  assert.notEqual(index, -1, `missing source needle ${needle} after ${afterNeedle}`);
  return source.slice(0, index).split(/\r?\n/).length;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function parseArrayItems(block) {
  const out = [];
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.replace(/\/\/.*$/, '').trim().replace(/,$/, '').trim();
    if (!line) continue;
    const quoted = /^['"]([^'"]+)['"]$/.exec(line);
    if (quoted) out.push(quoted[1]);
  }
  return out;
}

function arrayFromSource(source, startNeedle, endNeedle) {
  return parseArrayItems(sliceBetween(source, startNeedle, endNeedle));
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

function runtimeWithSettings() {
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  runtime.window.filterTube.updateSettings(settings());
  return runtime;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first endpoint match policy is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior changed for no-work gating/);
  assert.match(text, /not an implementation patch, optimization patch, endpoint parser patch/);
  assert.match(text, /source files with endpoint match surface: 1/);
  assert.match(text, /runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work requests now bypass endpoint body work before clone\/parse\/stringify/);
  assert.match(text, /not completion proof for JSON-first endpoint match authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('endpoint and network family docs carry the method semantic proof gap blocker', () => {
  const methodGap = read(methodGapPath);

  for (const marker of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5830',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5830',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(marker), `method gap source missing ${marker}`);
  }

  assert.equal(endpointNetworkFamilyDocs.length, 13);
  for (const file of endpointNetworkFamilyDocs) {
    const text = read(file);
    assert.ok(text.includes(methodGapPath), `${file} should cite method gap source`);
    assert.match(text, /## Method Semantic Proof Gap Boundary/);
    assert.match(text, /method semantic proof gap files covered: 69/);
    assert.match(text, /method semantic proof gap lexical callables covered: 5830/);
    assert.match(text, /files with complete per-callable semantic proof: 0/);
    assert.match(text, /lexical callables requiring semantic proof before behavior changes: 5830/);
    assert.match(text, /affected callable semantic proof: NO-GO/);
    assert.match(text, /runtime behavior changed: no/);
    assert.match(text, /do not approve runtime\s+optimization/);
    assert.match(text, /JSON-first behavior/);
    assert.match(text, /network authority changes/);
  }
});

test('endpoint match source rows and counts remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');

  assert.deepEqual(arrayFromSource(fetchSetup, 'const fetchEndpoints = [', '];\n\n        const getPathname'), endpoints);
  assert.deepEqual(arrayFromSource(xhrSetup, 'const xhrEndpoints = [', '];\n\n            const proto'), endpoints);

  const anchors = [
    ['const fetchEndpoints = [', 667],
    ["'/youtubei/v1/player'", 672, 'const fetchEndpoints = ['],
    ['const getPathname = (rawUrl) => {', 675],
    ['const url = resource instanceof Request ? resource.url : resource;', 686],
    ["const urlStr = typeof url === 'string' ? url : String(url || '');", 687],
    ['if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {', 689],
    ['const dataName = `fetch:${getPathname(urlStr)}`;', 693],
    ['if (shouldBypassYouTubeiNetworkResponse(dataName)) {', 694],
    ["urlStr.includes('/youtubei/v1/next')", 703],
    ['const processed = processWithEngine(jsonData, dataName);', 740],
    ['const xhrEndpoints = [', 762],
    ['const processed = processWithEngine(jsonData, dataName);', 851, 'const xhrEndpoints = ['],
    ['proto.open = function(method, url) {', 924],
    ['this.__filtertube_shouldProcessXhr = Boolean(', 929],
    ['&& !shouldBypassYouTubeiNetworkResponse(dataName)', 932],
    ['proto.send = function() {', 940],
    ['&& xhrEndpoints.some(endpoint => urlStr.includes(endpoint))', 947, 'proto.send = function() {'],
    ['&& !shouldBypassYouTubeiNetworkResponse(dataName)', 948, 'proto.send = function() {']
  ];

  for (const [needle, expectedLine, afterNeedle] of anchors) {
    const actualLine = afterNeedle ? lineOfAfter(seed, needle, afterNeedle) : lineOf(seed, needle);
    assert.equal(actualLine, expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.match(text, /fetch endpoint entries: 5/);
  assert.match(text, /XHR endpoint entries: 5/);
  assert.match(text, /endpoint arrays with identical values: 2/);
  assert.match(text, /fetch raw substring endpoint gate sites: 1/);
  assert.match(text, /XHR raw substring endpoint gate sites: 2, both gated by no-work bypass/);
  assert.match(text, /raw next URL shortcut sites: 1/);
  assert.match(text, /parsed pathname helper definitions: 2/);
  assert.match(text, /parsed pathname label callsites: 2/);
  assert.match(text, /origin validation gates before endpoint match: 0/);
  assert.match(text, /pathname equality gates before endpoint match: 0/);
  assert.match(text, /pathname segment-boundary gates before endpoint match: 0/);

  const fetchPreGate = sliceBetween(fetchSetup, 'window.fetch = function(resource, init) {', 'if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {');
  assert.doesNotMatch(fetchPreGate, /new URL|\.pathname|\.origin|\.hostname/);
  assert.match(fetchSetup, /fetchEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(fetchSetup, /shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(fetchSetup, /processWithEngine\(jsonData, dataName\)/);
  assert.match(xhrSetup, /xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)/);
  assert.match(xhrSetup, /shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(xhrSetup, /processWithEngine\(jsonData, dataName\)/);
});

test('fetch endpoint matching uses raw substring before parsed pathname labels', async () => {
  const nonmatching = runtimeWithSettings();
  await nonmatching.window.fetch('https://www.youtube.com/api/stats/watchtime');
  assert.equal(nonmatching.calls.responseJson.length, 0);
  assert.equal(nonmatching.calls.jsonStringify.length, 0);
  assert.equal(nonmatching.calls.processData.length, 0);

  const queryOnly = runtimeWithSettings();
  await queryOnly.window.fetch('https://example.invalid/log?u=/youtubei/v1/search');
  assert.equal(queryOnly.calls.responseJson.length, 1);
  assert.equal(queryOnly.calls.jsonStringify.length, 1);
  assert.equal(queryOnly.calls.processData.length, 1);
  assert.equal(queryOnly.calls.processData[0].dataName, 'fetch:/log');

  const longerPath = runtimeWithSettings();
  await longerPath.window.fetch('https://www.youtube.com/youtubei/v1/searchExtra?prettyPrint=false');
  assert.equal(longerPath.calls.responseJson.length, 1);
  assert.equal(longerPath.calls.jsonStringify.length, 1);
  assert.equal(longerPath.calls.processData.length, 1);
  assert.equal(longerPath.calls.processData[0].dataName, 'fetch:/youtubei/v1/searchExtra');

  const requestObject = runtimeWithSettings();
  await requestObject.window.fetch(new requestObject.MockRequest('https://www.youtube.com/youtubei/v1/player?prettyPrint=false'));
  assert.equal(requestObject.calls.responseJson.length, 1);
  assert.equal(requestObject.calls.jsonStringify.length, 1);
  assert.equal(requestObject.calls.processData.length, 1);
  assert.equal(requestObject.calls.processData[0].dataName, 'fetch:/youtubei/v1/player');
});

test('XHR endpoint matching marks raw substring matches before parsed pathname processing', () => {
  const nonmatching = runtimeWithSettings();
  const nonmatchingXhr = new nonmatching.window.XMLHttpRequest();
  nonmatchingXhr.open('GET', 'https://www.youtube.com/api/stats/watchtime');
  nonmatchingXhr.send();
  assert.equal(nonmatchingXhr.__filtertube_shouldProcessXhr, false);

  const queryOnly = runtimeWithSettings();
  const queryOnlyXhr = new queryOnly.window.XMLHttpRequest();
  queryOnlyXhr.open('GET', 'https://example.invalid/log?u=/youtubei/v1/search');
  assert.equal(queryOnlyXhr.__filtertube_shouldProcessXhr, true);

  const longerPath = runtimeWithSettings();
  const longerPathXhr = new longerPath.window.XMLHttpRequest();
  longerPathXhr.open('GET', 'https://www.youtube.com/youtubei/v1/searchExtra?prettyPrint=false');
  assert.equal(longerPathXhr.__filtertube_shouldProcessXhr, true);

  const urlObject = runtimeWithSettings();
  const urlObjectXhr = new urlObject.window.XMLHttpRequest();
  urlObjectXhr.open('POST', new URL('https://www.youtube.com/youtubei/v1/player?prettyPrint=false'));
  assert.equal(urlObjectXhr.__filtertube_shouldProcessXhr, true);

  const sendRemark = runtimeWithSettings();
  const sendRemarkXhr = new sendRemark.window.XMLHttpRequest();
  sendRemarkXhr.open('POST', 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false');
  sendRemarkXhr.__filtertube_shouldProcessXhr = false;
  sendRemarkXhr.send();
  assert.equal(sendRemarkXhr.__filtertube_shouldProcessXhr, true);
});

test('endpoint match policy records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    `fetchEndpoints(5): ${endpoints.join(',')}`,
    `xhrEndpoints(5): ${endpoints.join(',')}`,
    'rawSubstringMatchSites(4): fetchEndpointGate,fetchCommentNextShortcut,xhrOpenGate,xhrSendGate',
    'parsedPathnameLabelSites(2): fetchProcessLabel,xhrProcessLabel',
    'preMatchParsedUrlPolicy(0): origin,hostname,pathnameEquality,segmentBoundary',
    'runtimePositiveEndpointFalsePositiveFixtures(4): fetchQueryOnly,fetchLongerPath,xhrQueryOnly,xhrLongerPath',
    'runtimeNegativeBypassFixtures(2): fetchNonMatching,xhrNonMatching',
    'nonStringUrlValueFixtures(2): fetchRequestObject,xhrUrlObject'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'sourceOwner',
    'rawUrl',
    'urlValueKind',
    'parsedOrigin',
    'parsedHostname',
    'parsedPathname',
    'parsedSearch',
    'endpointToken',
    'endpointFamily',
    'endpointMatchKind',
    'endpointBoundary',
    'queryContainsEndpointToken',
    'longerPathContainsEndpointToken',
    'requestObjectPolicy',
    'urlObjectPolicy',
    'relativeUrlPolicy',
    'malformedUrlPolicy',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevision',
    'activeRuleState',
    'parseAllowed',
    'mutationAllowed',
    'commentShortcutAllowed',
    'xhrHookAllowed',
    'passThroughReason',
    'positiveExactEndpointFixture',
    'negativeQueryOnlyFixture',
    'negativeLongerPathFixture',
    'negativeOriginFixture',
    'negativeMalformedUrlFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstEndpointMatchPolicy',
    'jsonFirstEndpointParserContract',
    'jsonFirstParsedEndpointDecision',
    'jsonFirstRawUrlMatchReport',
    'jsonFirstEndpointBoundaryFixtureProvenance',
    'jsonFirstEndpointNegativeFixtureReport',
    'jsonFirstFetchEndpointDecision',
    'jsonFirstXhrEndpointDecision',
    'jsonFirstCommentEndpointDecision'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
