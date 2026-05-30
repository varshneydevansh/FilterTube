import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_RAW_URL_ADMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprint = ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'];

const blockSpecs = {
  seedFetchInterception: {
    start: 'function setupFetchInterception() {',
    end: '    function setupXhrInterception() {',
    lines: 91,
    bytes: 4426
  },
  seedFetchAdmission: {
    start: 'window.fetch = function(resource, init) {',
    end: '            return originalFetch.apply(this, arguments).then(response => {',
    lines: 13,
    bytes: 557
  },
  seedFetchShortcut: {
    start: '// Special handling for comment requests when hideAllComments is enabled',
    end: '// Normal processing for non-comment or non-hideAllComments requests',
    lines: 38,
    bytes: 2269
  },
  seedFetchCatch: {
    start: '                }).catch(err => {',
    end: '            });\n        };',
    lines: 5,
    bytes: 247
  }
};

const authoritySymbols = [
  'jsonCommentContinuationRawUrlAdmissionContract',
  'jsonCommentContinuationParsedEndpointDecision',
  'jsonCommentContinuationRawUrlDecisionReport',
  'jsonCommentContinuationQueryEndpointPolicy',
  'jsonCommentContinuationHashEndpointPolicy',
  'jsonCommentContinuationLongerPathPolicy',
  'jsonCommentContinuationCrossOriginPolicy',
  'jsonCommentContinuationUrlObjectPolicy',
  'jsonCommentContinuationRawUrlFixtureProvenance',
  'jsonCommentContinuationRawUrlMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
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

function blockMetric(spec) {
  const block = sliceBetween(read('js/seed.js'), spec.start, spec.end);
  return {
    block,
    lines: lineCount(block),
    bytes: Buffer.byteLength(block)
  };
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
    whitelistChannels: [],
    whitelistKeywords: [],
    hideAllComments: true,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...overrides
  };
}

function commentPayload(id = 'raw-url-comment') {
  return {
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: [{
          commentThreadRenderer: {
            comment: {
              commentRenderer: {
                commentId: id,
                contentText: { simpleText: `comment ${id}` }
              }
            }
          }
        }]
      }
    }]
  };
}

function runtime(payload = commentPayload(), overrides = {}) {
  const instance = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    origin: 'https://www.youtube.com',
    payload,
    status: 210,
    statusText: 'Content Different',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'raw-url' }
  });
  instance.window.filterTube.updateSettings(settings(overrides));
  return instance;
}

async function fetchJson(instance, resource) {
  const response = await instance.window.fetch(resource);
  const body = await response.json();
  return { response, body };
}

function syntheticItems(body) {
  return body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

function assertSyntheticEnd(instance, body) {
  assert.equal(instance.calls.processData.length, 0);
  assert.equal(instance.calls.responseJson.length, 1);
  assert.equal(instance.calls.jsonStringify.length, 1);
  assert.equal(syntheticItems(body).length, 1);
  assert.equal(syntheticItems(body)[0].continuationItemRenderer.continuationEndpoint, null);
}

test('raw-URL admission slice is audit-only and source pinned', () => {
  const text = doc();
  const [file, lines, bytes, hash] = sourceFingerprint;
  const source = read(file);

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes/);
  assert.match(text, /not an implementation patch, optimization patch, URL parser patch/);
  assert.match(text, /JSON comment continuation raw-URL admission source files: 1/);
  assert.match(text, /runtime behavior changed: yes/);
  assert.match(text, /not completion proof for JSON comment continuation raw-URL admission authority/);

  assert.equal(lineCount(source), lines);
  assert.equal(Buffer.byteLength(source), bytes);
  assert.equal(sha256(file), hash);
  assert.match(text, new RegExp(`\\| \`${file.replace('.', '\\.')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
});

test('source rows pin raw URL admission before parsed comment endpoint policy', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const admission = blockMetric(blockSpecs.seedFetchAdmission).block;
  const shortcut = blockMetric(blockSpecs.seedFetchShortcut).block;
  const normal = sliceBetween(seed, '// Normal processing for non-comment or non-hideAllComments requests', '                }).catch(err => {');

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
  }

  const anchors = [
    [seed, 'const url = resource instanceof Request ? resource.url : resource;', 686],
    [seed, "const urlStr = typeof url === 'string' ? url : String(url || '');", 687],
    [seed, 'if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {', 689],
    [seed, 'return originalFetch.apply(this, arguments);', 690],
    [seed, 'const dataName = `fetch:${getPathname(urlStr)}`;', 693],
    [seed, 'if (shouldBypassYouTubeiNetworkResponse(dataName)) {', 694],
    [seed, 'return response.clone().json().then(jsonData => {', 701],
    [seed, "if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703],
    [seed, 'const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint =>', 705],
    [seed, 'return new Response(JSON.stringify(emptyCommentResponse), {', 731],
    [seed, 'const processed = processWithEngine(jsonData, dataName);', 740],
    [seed, '// If JSON parsing fails, return original response', 747]
  ];
  for (const [source, needle, expectedLine] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }
  assert.equal(lineOfAfter(seed, 'return response;', '// If JSON parsing fails, return original response'), 749);
  assert.ok(text.includes('`js/seed.js:749`'), 'doc should cite js/seed.js:749');

  assert.equal(countLiteral(admission, 'resource instanceof Request'), 1);
  assert.equal(countLiteral(admission, 'urlStr.includes(endpoint)'), 1);
  assert.equal(countLiteral(shortcut, "urlStr.includes('/youtubei/v1/next')"), 1);
  assert.equal(countLiteral(shortcut, 'processWithEngine'), 0);
  assert.equal(countLiteral(normal, 'processWithEngine'), 1);
  assert.match(text, /fetch endpoint raw urlStr includes gates: 1/);
  assert.match(text, /fetch comment shortcut raw url includes gates: 1/);
  assert.match(text, /fetch Request\.url extraction sites: 1/);
  assert.match(text, /fetch catch original-response return sites: 1/);
});

test('exact string next URL triggers synthetic comment end marker', async () => {
  const instance = runtime(commentPayload('exact-string'));
  const { response, body } = await fetchJson(instance, 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false');

  assert.equal(response.status, 210);
  assert.equal(response.statusText, 'Content Different');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'raw-url' });
  assertSyntheticEnd(instance, body);
  assert.equal(JSON.stringify(body).includes('exact-string'), false);
});

test('query-only raw next text can trigger synthetic comment end marker on non-endpoint path', async () => {
  const instance = runtime(commentPayload('query-only'));
  const { body } = await fetchJson(instance, 'https://www.youtube.com/watch?redirect=/youtubei/v1/next');

  assertSyntheticEnd(instance, body);
  assert.equal(JSON.stringify(body).includes('query-only'), false);
});

test('hash-fragment raw next text can trigger synthetic comment end marker on non-endpoint path', async () => {
  const instance = runtime(commentPayload('hash-fragment'));
  const { body } = await fetchJson(instance, 'https://www.youtube.com/watch#/youtubei/v1/next');

  assertSyntheticEnd(instance, body);
  assert.equal(JSON.stringify(body).includes('hash-fragment'), false);
});

test('longer-path and cross-origin raw next text can trigger synthetic comment end marker', async () => {
  const longerPath = runtime(commentPayload('longer-path'));
  const longerPathResult = await fetchJson(longerPath, 'https://www.youtube.com/youtubei/v1/nextExtra?prettyPrint=false');
  assertSyntheticEnd(longerPath, longerPathResult.body);
  assert.equal(JSON.stringify(longerPathResult.body).includes('longer-path'), false);

  const crossOrigin = runtime(commentPayload('cross-origin'));
  const crossOriginResult = await fetchJson(crossOrigin, 'https://not-youtube.invalid/youtubei/v1/next?prettyPrint=false');
  assertSyntheticEnd(crossOrigin, crossOriginResult.body);
  assert.equal(JSON.stringify(crossOriginResult.body).includes('cross-origin'), false);
});

test('Request object follows string URL shortcut path while URL object returns original body after shortcut throw', async () => {
  const requestObject = runtime(commentPayload('request-object'));
  const requestResult = await fetchJson(
    requestObject,
    new requestObject.MockRequest('https://www.youtube.com/youtubei/v1/next?prettyPrint=false')
  );
  assertSyntheticEnd(requestObject, requestResult.body);
  assert.equal(JSON.stringify(requestResult.body).includes('request-object'), false);

  const urlObject = runtime(commentPayload('url-object'));
  const urlResult = await fetchJson(urlObject, new URL('https://www.youtube.com/youtubei/v1/next?prettyPrint=false'));
  assert.equal(urlObject.calls.responseJson.length, 1);
  assert.equal(urlObject.calls.processData.length, 0);
  assert.equal(urlObject.calls.jsonStringify.length, 1);
  assert.equal(JSON.stringify(urlResult.body).includes('url-object'), false);
  assert.equal(syntheticItems(urlResult.body)[0].continuationItemRenderer.continuationEndpoint, null);
});

test('query-only raw next text with shortcut disabled and no active JSON work bypasses body work', async () => {
  const instance = runtime(commentPayload('query-hide-false'), { hideAllComments: false });
  const { body } = await fetchJson(instance, 'https://www.youtube.com/watch?redirect=/youtubei/v1/next');

  assert.equal(instance.calls.responseJson.length, 1);
  assert.equal(instance.calls.processData.length, 0);
  assert.equal(instance.calls.jsonStringify.length, 0);
  assert.equal(body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'query-hide-false');
});

test('nonmatching raw URL bypasses clone parse processing stringify and shortcut work', async () => {
  const instance = runtime(commentPayload('nonmatching'));
  const { body } = await fetchJson(instance, 'https://www.youtube.com/watch?v=abc123');

  assert.equal(instance.calls.responseJson.length, 1);
  assert.equal(instance.calls.processData.length, 0);
  assert.equal(instance.calls.jsonStringify.length, 0);
  assert.equal(body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'nonmatching');
});

test('raw-URL admission slice records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime JSON comment continuation raw-URL admission fixtures: 9',
    'Exact string `/youtubei/v1/next` with an endpoint-root append classic comment',
    'Query-only raw `/youtubei/v1/next` text on `/watch` can return the same',
    'Hash-fragment raw `/youtubei/v1/next` text on `/watch` can return the same',
    'Longer-path raw `/youtubei/v1/nextExtra` can return the same synthetic end',
    'Cross-origin exact `/youtubei/v1/next` can return the same synthetic end',
    'A fetch `Request` object follows the string URL path',
    'A fetch `URL` object now follows the urlStr shortcut path and returns the',
    'Query-only raw endpoint text with `hideAllComments:false` and no active JSON work bypasses',
    'A nonmatching raw URL does not clone, parse, process, stringify, or run the'
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
    'parsedOrigin',
    'parsedHostname',
    'parsedPathname',
    'parsedSearch',
    'parsedHash',
    'endpointToken',
    'endpointTextLocation',
    'endpointMatchKind',
    'commentShortcutAllowed',
    'syntheticEndAllowed',
    'engineBypassAllowed',
    'catchFallbackReason',
    'originalResponseReturned',
    'queryEndpointTextPolicy',
    'hashEndpointTextPolicy',
    'longerPathEndpointPolicy',
    'crossOriginEndpointPolicy',
    'requestObjectPolicy',
    'urlObjectPolicy',
    'passThroughReason',
    'fixtureProvenance',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtimeSource = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.ok(text.includes(symbol), `doc should name missing authority ${symbol}`);
    assert.equal(runtimeSource.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
  }
});
