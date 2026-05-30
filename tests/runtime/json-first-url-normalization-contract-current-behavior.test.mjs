import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md';

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
    origin: 'https://www.youtube.com',
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

test('JSON-first URL normalization contract is audit-only and source pinned', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior changed for no-work gating and URL-object fetch processing/);
  assert.match(text, /not an implementation patch, optimization patch, URL parser patch/);
  assert.match(text, /source files with URL normalization surface: 1/);
  assert.match(text, /runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work requests now bypass body work before clone\/parse\/stringify, and active fetch URL objects now reach normal engine processing/);
  assert.match(text, /not completion proof for JSON-first URL normalization authority/);

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('URL normalization source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const fetchSetup = sliceBetween(seed, 'function setupFetchInterception() {', 'function setupXhrInterception() {');
  const xhrSetup = sliceBetween(seed, 'function setupXhrInterception() {', '// ============================================================================');

  assert.equal((seed.match(/return new URL\(String\(rawUrl \|\| ''\), document\.location\?\.origin \|\| 'https:\/\/www\.youtube\.com'\)\.pathname;/g) || []).length, 2);
  assert.equal((seed.match(/return fallback\.split\('\?'\)\[0\] \|\| fallback;/g) || []).length, 2);

  const anchors = [
    ['const getPathname = (rawUrl) => {', 675],
    ["return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;", 677],
    ["const fallback = String(rawUrl || '');", 679],
    ["return fallback.split('?')[0] || fallback;", 680],
    ['const url = resource instanceof Request ? resource.url : resource;', 686],
    ["const urlStr = typeof url === 'string' ? url : String(url || '');", 687],
    ['if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {', 689],
    ['const dataName = `fetch:${getPathname(urlStr)}`;', 693],
    ['if (shouldBypassYouTubeiNetworkResponse(dataName)) {', 694],
    ["if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703],
    ['const processed = processWithEngine(jsonData, dataName);', 740],
    ['const getPathname = (rawUrl) => {', 779, 'const xhrEndpoints = ['],
    ["return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;", 781, 'const xhrEndpoints = ['],
    ["const fallback = String(rawUrl || '');", 783, 'const xhrEndpoints = ['],
    ["return fallback.split('?')[0] || fallback;", 784, 'const xhrEndpoints = ['],
    ['const processed = processWithEngine(jsonData, dataName);', 851, 'const xhrEndpoints = ['],
    ['this.__filtertube_url = url;', 926],
    ["const urlStr = typeof url === 'string' ? url : String(url || '');", 927, 'proto.open = function(method, url) {'],
    ['const dataName = `xhr:${getPathname(urlStr)}`;', 928, 'proto.open = function(method, url) {'],
    ['this.__filtertube_shouldProcessXhr = Boolean(', 929],
    ['&& !shouldBypassYouTubeiNetworkResponse(dataName)', 932],
    ['const rawUrl = this.__filtertube_url;', 942],
    ["const urlStr = typeof rawUrl === 'string' ? rawUrl : String(rawUrl || '');", 943],
    ['&& xhrEndpoints.some(endpoint => urlStr.includes(endpoint))', 947, 'proto.send = function() {'],
    ['&& !shouldBypassYouTubeiNetworkResponse(dataName)', 948, 'proto.send = function() {']
  ];

  for (const [needle, expectedLine, afterNeedle] of anchors) {
    const actualLine = afterNeedle ? lineOfAfter(seed, needle, afterNeedle) : lineOf(seed, needle);
    assert.equal(actualLine, expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  const fetchPreGate = sliceBetween(fetchSetup, 'window.fetch = function(resource, init) {', 'if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {');
  const xhrOpenPreMark = sliceBetween(xhrSetup, 'proto.open = function(method, url) {', 'this.__filtertube_shouldProcessXhr = Boolean');
  const xhrSendPreMark = sliceBetween(xhrSetup, 'proto.send = function() {', 'if (\n                        urlStr');

  assert.doesNotMatch(fetchPreGate, /getPathname|new URL|\.pathname|\.origin|\.hostname|\.search|\.hash/);
  assert.match(xhrOpenPreMark, /getPathname\(urlStr\)/);
  assert.match(xhrSendPreMark, /getPathname\(urlStr\)/);
  assert.doesNotMatch(xhrOpenPreMark, /new URL|\.pathname|\.origin|\.hostname|\.search|\.hash/);
  assert.doesNotMatch(xhrSendPreMark, /new URL|\.pathname|\.origin|\.hostname|\.search|\.hash/);

  assert.match(text, /parsed pathname helper definitions: 2/);
  assert.match(text, /unique parsed pathname helper bodies: 1/);
  assert.match(text, /pre-match parsed pathname callsites: 2/);
  assert.match(text, /post-match parsed pathname label callsites: 2/);
  assert.match(text, /parsed URL base-origin fallback sites: 2/);
  assert.match(text, /parsed URL catch fallback split-query sites: 2/);
  assert.match(text, /raw URL stringification sites before match: 3/);
  assert.match(text, /Request\.url extraction sites before match: 1/);
  assert.match(text, /raw object includes shortcut sites: 1/);
  assert.match(text, /no-work URL bypass sites before body work: 2/);
  assert.match(text, /origin validation gates before match: 0/);
  assert.match(text, /hostname validation gates before match: 0/);
  assert.match(text, /hash-fragment exclusion gates before match: 0/);
  assert.match(text, /query-value exclusion gates before match: 0/);
});

test('fetch URL normalization admits relative cross-origin hash and malformed endpoint text', async () => {
  const relative = runtimeWithSettings();
  await relative.window.fetch('/youtubei/v1/search?prettyPrint=false');
  assert.equal(relative.calls.responseJson.length, 1);
  assert.equal(relative.calls.processData.length, 1);
  assert.equal(relative.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');

  const crossOrigin = runtimeWithSettings();
  await crossOrigin.window.fetch('https://not-youtube.invalid/youtubei/v1/search?prettyPrint=false');
  assert.equal(crossOrigin.calls.responseJson.length, 1);
  assert.equal(crossOrigin.calls.processData.length, 1);
  assert.equal(crossOrigin.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');

  const hashFragment = runtimeWithSettings();
  await hashFragment.window.fetch('https://www.youtube.com/watch#/youtubei/v1/search');
  assert.equal(hashFragment.calls.responseJson.length, 1);
  assert.equal(hashFragment.calls.processData.length, 1);
  assert.equal(hashFragment.calls.processData[0].dataName, 'fetch:/watch');

  const malformed = runtimeWithSettings();
  await malformed.window.fetch('http://[/youtubei/v1/search?prettyPrint=false');
  assert.equal(malformed.calls.responseJson.length, 1);
  assert.equal(malformed.calls.processData.length, 1);
  assert.equal(malformed.calls.processData[0].dataName, 'fetch:http://[/youtubei/v1/search');
});

test('fetch URL value kinds now process both URL objects and Request objects when JSON work is active', async () => {
  const urlObject = runtimeWithSettings();
  const urlObjectResponse = await urlObject.window.fetch(new URL('https://www.youtube.com/youtubei/v1/search?prettyPrint=false'));
  assert.equal(urlObject.calls.responseJson.length, 1);
  assert.equal(urlObject.calls.processData.length, 1);
  assert.equal(urlObject.calls.jsonStringify.length, 1);
  assert.equal(urlObject.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
  assert.equal(urlObjectResponse.status, 200);

  const requestObject = runtimeWithSettings();
  await requestObject.window.fetch(new requestObject.MockRequest('https://www.youtube.com/youtubei/v1/player?prettyPrint=false'));
  assert.equal(requestObject.calls.responseJson.length, 1);
  assert.equal(requestObject.calls.processData.length, 1);
  assert.equal(requestObject.calls.jsonStringify.length, 1);
  assert.equal(requestObject.calls.processData[0].dataName, 'fetch:/youtubei/v1/player');
});

test('XHR URL normalization marks relative cross-origin hash malformed and URL-object endpoint text', () => {
  const relative = runtimeWithSettings();
  const relativeXhr = new relative.window.XMLHttpRequest();
  relativeXhr.open('GET', '/youtubei/v1/search?prettyPrint=false');
  assert.equal(relativeXhr.__filtertube_shouldProcessXhr, true);

  const crossOrigin = runtimeWithSettings();
  const crossOriginXhr = new crossOrigin.window.XMLHttpRequest();
  crossOriginXhr.open('GET', 'https://not-youtube.invalid/youtubei/v1/search?prettyPrint=false');
  assert.equal(crossOriginXhr.__filtertube_shouldProcessXhr, true);

  const hashFragment = runtimeWithSettings();
  const hashFragmentXhr = new hashFragment.window.XMLHttpRequest();
  hashFragmentXhr.open('GET', 'https://www.youtube.com/watch#/youtubei/v1/search');
  assert.equal(hashFragmentXhr.__filtertube_shouldProcessXhr, true);

  const malformed = runtimeWithSettings();
  const malformedXhr = new malformed.window.XMLHttpRequest();
  malformedXhr.open('GET', 'http://[/youtubei/v1/search?prettyPrint=false');
  assert.equal(malformedXhr.__filtertube_shouldProcessXhr, true);

  const urlObject = runtimeWithSettings();
  const urlObjectXhr = new urlObject.window.XMLHttpRequest();
  urlObjectXhr.open('POST', new URL('https://www.youtube.com/youtubei/v1/player?prettyPrint=false'));
  assert.equal(urlObjectXhr.__filtertube_shouldProcessXhr, true);
});

test('URL normalization contract records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'parsedPathnameHelperDefinitions(2): fetchGetPathname,xhrGetPathname',
    'uniqueParsedPathnameHelperBodies(1): newURLStringRawUrlWithDocumentOriginAndSplitQueryFallback',
    'preMatchParsedPathnameCallsites(2): xhrOpenDataName,xhrSendDataName',
    'postMatchParsedPathnameLabelCallsites(2): fetchProcessLabel,xhrProcessLabel',
    'rawUrlStringificationSites(3): fetchResourceUrlString,xhrOpenUrlString,xhrSendUrlString',
    'requestUrlExtractionSites(1): fetchRequestUrl',
    'rawObjectIncludesShortcutSites(1): fetchCommentShortcut',
    'preMatchUrlComponentPolicy(0): origin,hostname,query,hash',
    'runtimePositiveUrlNormalizationFixtures(8): fetchRelativePath,xhrRelativePath,fetchCrossOriginExactPath,xhrCrossOriginExactPath,fetchHashFragment,xhrHashFragment,fetchMalformedRawEndpoint,xhrMalformedRawEndpoint',
    'runtimeUrlValueKindFixtures(3): fetchUrlObjectProcess,fetchRequestObjectProcess,xhrUrlObjectMark'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'rawInputKind',
    'rawInputType',
    'rawInputString',
    'requestUrl',
    'urlObjectString',
    'documentBaseOrigin',
    'parseSucceeded',
    'parseFailureReason',
    'parsedHref',
    'parsedOrigin',
    'parsedProtocol',
    'parsedHostname',
    'parsedPathname',
    'parsedSearch',
    'parsedHash',
    'endpointToken',
    'endpointPathMatchKind',
    'endpointTextLocation',
    'sameOriginAllowed',
    'crossOriginAllowed',
    'relativeUrlAllowed',
    'malformedUrlAllowed',
    'hashEndpointTextAllowed',
    'queryEndpointTextAllowed',
    'commentShortcutAllowed',
    'bodyWorkAllowed',
    'labelPathname',
    'passThroughReason',
    'positiveRelativeFixture',
    'negativeCrossOriginFixture',
    'negativeHashFragmentFixture',
    'negativeMalformedFixture',
    'fetchUrlObjectFixture',
    'xhrUrlObjectFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstUrlNormalizationContract',
    'jsonFirstEndpointUrlParserContract',
    'jsonFirstParsedUrlDecision',
    'jsonFirstEndpointUrlValueKind',
    'jsonFirstFetchUrlObjectDecision',
    'jsonFirstXhrUrlObjectDecision',
    'jsonFirstRelativeEndpointDecision',
    'jsonFirstMalformedUrlDecision',
    'jsonFirstUrlFragmentQueryPolicy'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
