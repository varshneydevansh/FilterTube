import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-comment-append-entity-response.json';

const sourceFingerprints = {
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  [fixturePath]: [96, 3560, '6e8dfcdde0dd21610f602ad01eb46b4cb5ce45903188c0f457cefb970b7fec8f']
};

const blockSpecs = {
  filterLogicCommentRules: {
    file: 'js/filter_logic.js',
    start: '        // Comment threads',
    end: '    };\n\n    // ============================================================================\n    // FILTERING ENGINE',
    lines: 9,
    bytes: 380
  },
  filterLogicCandidateMetadata: {
    file: 'js/filter_logic.js',
    start: '            const metadataParts = [',
    end: '            return {',
    lines: 46,
    bytes: 2507
  },
  filterLogicCommentDecision: {
    file: 'js/filter_logic.js',
    start: '            // Comment filtering',
    end: '            // Content filters',
    lines: 34,
    bytes: 1947
  },
  filterLogicObjectRendererRemoval: {
    file: 'js/filter_logic.js',
    start: '            // Handle objects - check if this object should be filtered',
    end: '            // Recursively process all properties',
    lines: 11,
    bytes: 536
  },
  filterLogicRecursivePropertyCopy: {
    file: 'js/filter_logic.js',
    start: '            // Recursively process all properties',
    end: '            return result;',
    lines: 9,
    bytes: 347
  },
  seedFetchShortcut: {
    file: 'js/seed.js',
    start: '// Special handling for comment requests when hideAllComments is enabled',
    end: '// Normal processing for non-comment or non-hideAllComments requests',
    lines: 38,
    bytes: 2269
  },
  fixtureEntityPayload: {
    file: fixturePath,
    start: '    "frameworkUpdates": {',
    end: '  }\n}',
    lines: 47,
    bytes: 1834
  }
};

const authoritySymbols = [
  'jsonCommentEntityPayloadProvenanceContract',
  'jsonCommentEntityPayloadDecisionReport',
  'jsonCommentEntityPayloadRuleManifest',
  'jsonCommentEntityTextExtractionPolicy',
  'jsonCommentEntityAuthorExtractionPolicy',
  'jsonCommentEntityJoinPolicy',
  'jsonCommentEntityCleanupPolicy',
  'jsonCommentEntityFetchShortcutPolicy',
  'jsonCommentEntityFixtureProvenance',
  'jsonCommentEntityMetricArtifact'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function blockMetric(spec) {
  const block = sliceBetween(read(spec.file), spec.start, spec.end);
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...overrides
  };
}

function loadCapture() {
  return JSON.parse(read(fixturePath));
}

function runEngine(overrides = {}) {
  const { engine } = loadFilterTubeEngine();
  return plain(engine.processData(plain(loadCapture().response), settings(overrides), fixturePath));
}

function entityPayload(response) {
  return response.frameworkUpdates?.entityBatchUpdate?.mutations?.[0]?.payload?.commentEntityPayload;
}

function visibleItems(response) {
  return response.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

function syntheticItems(response) {
  return response.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

test('JSON comment entity payload provenance slice is audit-only and pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, entity payload patch/);
  assert.match(text, /JSON comment entity payload provenance source\/fixture files: 3/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON comment entity payload authority/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(
      text,
      new RegExp(`\\| \`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`)
    );
  }
});

test('source blocks fixture anchors and selected product runtime gaps remain current', () => {
  const text = doc();
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const fixture = read(fixturePath);
  const selectedRuntime = [read('js/filter_logic.js'), read('js/seed.js'), read('js/content/dom_fallback.js')].join('\n');

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
  }

  const anchors = [
    [filterLogic, 'commentRenderer: {', 827, 'js/filter_logic.js'],
    [filterLogic, "commentText: ['contentText.simpleText', 'contentText.runs']", 830, 'js/filter_logic.js'],
    [filterLogic, 'commentThreadRenderer: {', 832, 'js/filter_logic.js'],
    [filterLogic, '...this._collectTextFromPaths(item, rules.commentText),', 1729, 'js/filter_logic.js'],
    [filterLogic, '// Comment filtering', 2076, 'js/filter_logic.js'],
    [filterLogic, 'const commentText = rules.commentText ? getTextFromPaths(item, Array.isArray(rules.commentText) ? rules.commentText : [rules.commentText]) : \'\';', 2083, 'js/filter_logic.js'],
    [filterLogic, 'const commentChannelInfo = isCollaboration ? collaborators[0] : channelInfo;', 2101, 'js/filter_logic.js'],
    [seed, "if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703, 'js/seed.js'],
    [seed, '...jsonData,', 715, 'js/seed.js'],
    [seed, 'onResponseReceivedEndpoints: [{', 716, 'js/seed.js'],
    [fixture, 'frameworkUpdates.entityBatchUpdate.mutations.0.commentEntityPayload', 6, fixturePath],
    [fixture, '"commentKey": "EhpVZ3dnWHhWbUdsS0pNYVNETXU1NEFhQUJBZyAoKAE%3D"', 36, fixturePath],
    [fixture, '"entityKey": "EhpVZ3dnWHhWbUdsS0pNYVNETXU1NEFhQUJBZyAoKAE%3D"', 52, fixturePath],
    [fixture, '"commentEntityPayload": {', 55, fixturePath],
    [fixture, '"content": "Let\'s admit it, We all got surprised during YOONGI\'S part."', 60, fixturePath],
    [fixture, '"authorButtonA11y": "@miguelsantiagocalderonmore9380"', 64, fixturePath],
    [fixture, '"channelId": "UCUooqKoZc3DF4KlktYF_vzQ"', 67, fixturePath],
    [fixture, '"browseId": "UCUooqKoZc3DF4KlktYF_vzQ"', 83, fixturePath]
  ];

  for (const [source, needle, expectedLine, file] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
  }

  for (const literal of ['commentEntityPayload', 'frameworkUpdates', 'entityBatchUpdate', 'entityKey', 'authorButtonA11y', 'channelPageEndpoint']) {
    assert.equal(countLiteral(selectedRuntime, literal), 0, `${literal} should be absent from selected runtime JS`);
  }

  assert.equal(countLiteral(fixture, 'commentEntityPayload'), 2);
  assert.equal(countLiteral(fixture, 'frameworkUpdates'), 2);
  assert.equal(countLiteral(fixture, 'entityBatchUpdate'), 2);
  assert.equal(countLiteral(fixture, 'commentKey'), 1);
  assert.equal(countLiteral(fixture, 'entityKey'), 1);
  assert.equal(countLiteral(fixture, 'YOONGI'), 1);
  assert.equal(countLiteral(fixture, 'UCUooqKoZc3DF4KlktYF_vzQ'), 2);
  assert.equal(countLiteral(fixture, 'miguelsantiagocalderonmore9380'), 4);
});

test('fixture ties visible comment shell to entity payload but visible shell lacks comment text and author identity', () => {
  const capture = loadCapture();
  const shell = visibleItems(capture.response)?.[0]?.commentThreadRenderer;
  const entity = entityPayload(capture.response);

  assert.equal(capture.provenance.source, 'YT_MAIN_NEXT_RESPONSE_COMMENT.json');
  assert.equal(capture.provenance.rendererType, 'commentThreadRenderer');
  assert.equal(capture.provenance.endpointFamily, '/youtubei/v1/next');
  assert.equal(shell?.commentViewModel?.commentViewModel?.commentKey, 'EhpVZ3dnWHhWbUdsS0pNYVNETXU1NEFhQUJBZyAoKAE%3D');
  assert.equal(capture.response.frameworkUpdates.entityBatchUpdate.mutations[0].entityKey, shell.commentViewModel.commentViewModel.commentKey);
  assert.equal(entity.key, shell.commentViewModel.commentViewModel.commentKey);
  assert.equal(entity.properties.content.content, "Let's admit it, We all got surprised during YOONGI'S part.");
  assert.equal(entity.properties.authorButtonA11y, '@miguelsantiagocalderonmore9380');
  assert.equal(entity.author.channelId, 'UCUooqKoZc3DF4KlktYF_vzQ');
  assert.equal(entity.author.channelPageEndpoint.innertubeCommand.browseEndpoint.browseId, 'UCUooqKoZc3DF4KlktYF_vzQ');
  assert.equal(JSON.stringify(shell).includes('YOONGI'), false);
  assert.equal(JSON.stringify(shell).includes('UCUooqKoZc3DF4KlktYF_vzQ'), false);
});

test('global keyword matching only entity payload text currently leaves capture response unchanged', () => {
  const input = plain(loadCapture().response);
  const output = runEngine({ filterKeywords: [keyword('YOONGI')] });

  assert.deepEqual(output, input);
  assert.equal(entityPayload(output).properties.content.content.includes('YOONGI'), true);
});

test('comments-only keyword matching only entity payload text currently leaves capture response unchanged', () => {
  const input = plain(loadCapture().response);
  const output = runEngine({ filterKeywordsComments: [keyword('YOONGI')] });

  assert.deepEqual(output, input);
  assert.equal(entityPayload(output).properties.content.content.includes('YOONGI'), true);
});

test('author channel filters matching only entity payload author id or handle currently leave response unchanged', () => {
  const input = plain(loadCapture().response);
  const byId = runEngine({
    filterChannels: [{
      id: 'UCUooqKoZc3DF4KlktYF_vzQ'
    }]
  });
  const byHandle = runEngine({
    filterChannels: [{
      handle: '@miguelsantiagocalderonmore9380'
    }]
  });

  assert.deepEqual(byId, input);
  assert.deepEqual(byHandle, input);
  assert.equal(entityPayload(byId).author.channelId, 'UCUooqKoZc3DF4KlktYF_vzQ');
  assert.equal(entityPayload(byHandle).author.displayName, '@miguelsantiagocalderonmore9380');
});

test('hideAllComments removes visible continuation item while preserving entity payload text and author identity', () => {
  const output = runEngine({ hideAllComments: true });
  const entity = entityPayload(output);

  assert.deepEqual(visibleItems(output), []);
  assert.equal(entity.properties.content.content, "Let's admit it, We all got surprised during YOONGI'S part.");
  assert.equal(entity.author.channelId, 'UCUooqKoZc3DF4KlktYF_vzQ');
  assert.equal(entity.author.channelPageEndpoint.innertubeCommand.browseEndpoint.canonicalBaseUrl, '/@miguelsantiagocalderonmore9380');
});

test('hideAllComments plus global entity keyword still preserves frameworkUpdates entity payload', () => {
  const output = runEngine({
    hideAllComments: true,
    filterKeywords: [keyword('YOONGI')]
  });

  assert.deepEqual(visibleItems(output), []);
  assert.equal(entityPayload(output).properties.content.content.includes('YOONGI'), true);
  assert.equal(entityPayload(output).author.channelId, 'UCUooqKoZc3DF4KlktYF_vzQ');
});

test('fetch shortcut bypasses engine writes synthetic end marker and preserves frameworkUpdates entity payload', async () => {
  const capture = loadCapture();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: capture.response,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'entity-payload' }
  });
  runtime.window.filterTube.updateSettings(settings({ hideAllComments: true }));

  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  const items = syntheticItems(body);

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(items?.length, 1);
  assert.equal(items[0].continuationItemRenderer?.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('commentThreadRenderer'), false);
  assert.equal(entityPayload(body).properties.content.content.includes('YOONGI'), true);
  assert.equal(entityPayload(body).author.channelId, 'UCUooqKoZc3DF4KlktYF_vzQ');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'entity-payload' });
});

test('entity payload provenance slice records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime JSON comment entity payload provenance fixtures: 10',
    'global keyword matching only entity payload text leaves the response',
    'comments-only keyword matching only entity payload text leaves the response',
    'channel-id filter matching only entity payload author id leaves the',
    'channel-handle filter matching only entity payload author handle leaves the',
    '`hideAllComments:true` removes the visible continuation item and preserves',
    'fetch shortcut under `hideAllComments:true` bypasses the engine',
    'partial append-continuation extraction'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'rawCapture',
    'reducedFixture',
    'endpoint',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settings mode',
    'visibleRendererPath',
    'entityPayloadPath',
    'commentKey',
    'entityKey',
    'payloadKey',
    'entityTextPath',
    'entityAuthorIdPath',
    'entityAuthorHandlePath',
    'entityAuthorEndpointPath',
    'rendererRulePath',
    'joinPolicy',
    'cleanupPolicy',
    'keywordDecision',
    'authorDecision',
    'transport',
    'responseBodyMode',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.ok(text.includes(symbol), `doc should name missing authority ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
  }
});
