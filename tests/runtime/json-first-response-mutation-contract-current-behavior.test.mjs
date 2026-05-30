import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

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

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineOfOccurrence(source, needle, occurrence = 1) {
  const lines = source.split(/\r?\n/);
  let seen = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].includes(needle)) continue;
    seen += 1;
    if (seen === occurrence) return index + 1;
  }
  assert.fail(`missing source needle occurrence ${occurrence}: ${needle}`);
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

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first response mutation contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior changed: yes;\s+inactive YouTubei requests now bypass body parsing before response mutation/);
  assert.match(text, /not an implementation patch, optimization patch, or permission/);
  assert.match(text, /source files with response mutation surface: 1/);
  assert.match(text, /runtime behavior changed: yes; no-work gate bypasses inactive YouTubei response parsing before fetch clone or XHR body processing/);
  assert.match(text, /not completion proof for JSON-first response mutation authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('response mutation source rows and counts remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');
  const processor = sliceBetween(xhrSetup, 'const ensureXhrResponseProcessed = (xhr) => {', 'if (typeof originalAddEventListener ===');

  assert.deepEqual(arrayFromSource(fetchSetup, 'const fetchEndpoints = [', '];\n\n        const getPathname'), endpoints);
  assert.deepEqual(arrayFromSource(xhrSetup, 'const xhrEndpoints = [', '];\n\n            const proto'), endpoints);

  const anchors = [
    ['const dataName = `fetch:${getPathname(urlStr)}`;', 693],
    ['response.clone().json()', 701],
    ["urlStr.includes('/youtubei/v1/next')", 703],
    ['return new Response(JSON.stringify(emptyCommentResponse),', 731],
    ['const processed = processWithEngine(jsonData, dataName);', 740, 1],
    ['return new Response(JSON.stringify(processed),', 741],
    ['const ensureXhrResponseProcessed = (xhr) => {', 813],
    ['const dataName = `xhr:${getPathname(urlStr)}`;', 825],
    ["if (responseType === 'json') {", 834],
    ["} else if (responseType === '' || responseType === 'text') {", 837],
    ['jsonData = JSON.parse(trimmed);', 843],
    ['const processed = processWithEngine(jsonData, dataName);', 851, 2],
    ['xhr.__filtertube_modifiedResponse = processed;', 854],
    ['xhr.__filtertube_modifiedResponseText = JSON.stringify(processed);', 855],
    ["Object.defineProperty(xhr, 'response',", 863],
    ["Object.defineProperty(xhr, 'responseText',", 878],
    ['proto.open = function(method, url) {', 924],
    ['proto.send = function() {', 940]
  ];
  for (const [needle, expectedLine, occurrence = 1] of anchors) {
    assert.equal(lineOfOccurrence(seed, needle, occurrence), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.match(text, /fetch endpoint entries: 5/);
  assert.match(text, /XHR endpoint entries: 5/);
  assert.match(text, /fetch response replacement branches: 2/);
  assert.match(text, /fetch replacement branches preserving status\/statusText\/headers: 2/);
  assert.match(text, /fetch JSON parse failure pass-through branches: 1/);
  assert.match(text, /fetch non-ok response pass-through branches: 1/);
  assert.match(text, /XHR body parse modes: 2/);
  assert.match(text, /XHR modified response fields: 2/);
  assert.match(text, /XHR per-instance property override sites: 2/);

  assert.match(fetchSetup, /if \(!fetchEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)\)/);
  assert.match(fetchSetup, /if \(!response\.ok\) return response/);
  assert.match(fetchSetup, /response\.clone\(\)\.json\(\)/);
  assert.match(fetchSetup, /status: response\.status/);
  assert.match(fetchSetup, /statusText: response\.statusText/);
  assert.match(fetchSetup, /headers: response\.headers/);
  assert.match(fetchSetup, /\.catch\(err => \{[\s\S]*return response;/);

  assert.match(xhrSetup, /proto\.addEventListener = function/);
  assert.match(xhrSetup, /proto\.removeEventListener = function/);
  assert.match(xhrSetup, /proto\.open = function/);
  assert.match(xhrSetup, /proto\.send = function/);
  assert.match(xhrSetup, /urlStr[\s\S]*&& xhrEndpoints\.some\(endpoint => urlStr\.includes\(endpoint\)\)[\s\S]*&& !shouldBypassYouTubeiNetworkResponse\(dataName\)/);
  assert.match(processor, /if \(!cachedSettings\) return/);
  assert.match(processor, /if \(cachedSettings\.enabled === false\) return/);
  assert.match(processor, /JSON\.parse\(trimmed\)/);
  assert.match(processor, /JSON\.stringify\(processed\)/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'response'/);
  assert.match(processor, /Object\.defineProperty\(xhr, 'responseText'/);
});

test('fetch response rebuild currently preserves selected metadata while replacing bodies', async () => {
  const payload = { contents: { playerOverlayRenderer: { title: 'Original' } } };
  const headers = { 'content-type': 'application/json', 'x-filtertube-test': 'seed' };
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload,
    status: 206,
    statusText: 'Partial Content',
    headers,
    processData() {
      return { rewritten: true };
    }
  });
  runtime.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'Original', flags: 'i' }]
  }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false');
  const body = await response.json();

  assert.deepEqual(body, { rewritten: true });
  assert.equal(response.status, 206);
  assert.equal(response.statusText, 'Partial Content');
  assert.equal(response.headers, headers);
  assert.equal(runtime.calls.responseJson.length, 1);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(runtime.calls.processData.length, 1);
});

test('fetch pass-through cases remain current behavior for nonmatching non-ok and invalid JSON responses', async () => {
  const matchingNoWork = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/results',
    payload: { noWork: true }
  });
  matchingNoWork.window.filterTube.updateSettings(settings());
  await matchingNoWork.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(matchingNoWork.calls.responseJson.length, 0);
  assert.equal(matchingNoWork.calls.jsonStringify.length, 0);
  assert.equal(matchingNoWork.calls.processData.length, 0);

  const nonmatching = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { ok: true }
  });
  nonmatching.window.filterTube.updateSettings(settings());
  await nonmatching.window.fetch('https://www.youtube.com/api/stats/watchtime');
  assert.equal(nonmatching.calls.responseJson.length, 0);
  assert.equal(nonmatching.calls.jsonStringify.length, 0);
  assert.equal(nonmatching.calls.processData.length, 0);

  const nonOk = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: { error: true },
    status: 503,
    statusText: 'Service Unavailable'
  });
  nonOk.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'anything', flags: 'i' }]
  }));
  const nonOkResponse = await nonOk.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(nonOkResponse.status, 503);
  assert.equal(nonOkResponse.statusText, 'Service Unavailable');
  assert.equal(nonOk.calls.responseJson.length, 0);
  assert.equal(nonOk.calls.jsonStringify.length, 0);
  assert.equal(nonOk.calls.processData.length, 0);

  const invalidJson = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/',
    payload: 'not json'
  });
  invalidJson.window.filterTube.updateSettings(settings({
    filterKeywords: [{ pattern: 'anything', flags: 'i' }]
  }));
  const invalidResponse = await invalidJson.window.fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(await invalidResponse.text(), 'not json');
  assert.equal(invalidJson.calls.responseJson.length, 1);
  assert.equal(invalidJson.calls.jsonStringify.length, 0);
  assert.equal(invalidJson.calls.processData.length, 0);
});

test('response mutation contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    `fetchEndpoints(5): ${endpoints.join(',')}`,
    `xhrEndpoints(5): ${endpoints.join(',')}`,
    'fetchResponseReplacementBranches(2): commentContinuationSyntheticEnd,normalProcessWithEngine',
    'fetchResponseMetadataPreserved(3): status,statusText,headers',
    'fetchPassThroughBranches(3): nonMatchingUrl,nonOkResponse,jsonParseFailure',
    'xhrParseModes(2): responseType-json,responseType-empty-or-text',
    'xhrLateGuardBranches(8): alreadyProcessed,notMarked,notReady,noSettings,disabled,errorStatus,nonJsonBody,unsupportedResponseType',
    'xhrMutationFields(4): __filtertube_modifiedResponse,__filtertube_modifiedResponseText,responseGetter,responseTextGetter',
    'xhrListenerHookSites(4): addEventListenerWrapper,removeEventListenerWrapper,sendReadyStateHook,sendLoadHook'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'sourceOwner',
    'endpoint',
    'parsedOrigin',
    'parsedPathname',
    'rawUrl',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevision',
    'activeRuleState',
    'responseStatus',
    'responseStatusText',
    'responseHeaders',
    'responseContentType',
    'responseBodyMode',
    'responseBodySizeBefore',
    'responseBodySizeAfter',
    'parseAllowed',
    'mutationAllowed',
    'stringifyAllowed',
    'responseRebuildAllowed',
    'xhrOverrideAllowed',
    'passThroughReason',
    'commentShortcutReason',
    'positiveMutationFixture',
    'negativeNoRuleFixture',
    'negativeDisabledFixture',
    'negativeParseFailureFixture',
    'negativeEndpointFixture',
    'negativeSiblingFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstResponseMutationAuthority',
    'jsonFirstResponseMutationContract',
    'jsonFirstEndpointParserContract',
    'jsonFirstFetchResponseDecision',
    'jsonFirstXhrResponseDecision',
    'jsonFirstResponseMetadataReport',
    'jsonFirstResponsePassThroughReason',
    'jsonFirstCommentContinuationDecision',
    'jsonFirstResponseMutationFixtureProvenance'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
