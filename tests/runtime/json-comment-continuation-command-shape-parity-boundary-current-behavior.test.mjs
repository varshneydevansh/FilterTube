import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/seed.js': [1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d'],
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5']
};

const blockSpecs = {
  seedFetchShortcut: {
    file: 'js/seed.js',
    start: '// Special handling for comment requests when hideAllComments is enabled',
    end: '// Normal processing for non-comment or non-hideAllComments requests',
    lines: 38,
    bytes: 2269
  },
  seedFetchNormal: {
    file: 'js/seed.js',
    start: '// Normal processing for non-comment or non-hideAllComments requests',
    end: '                }).catch(err => {',
    lines: 7,
    bytes: 395
  },
  filterLogicArrayRecursion: {
    file: 'js/filter_logic.js',
    start: '            // Handle arrays',
    end: '            // Handle objects - check if this object should be filtered',
    lines: 20,
    bytes: 726
  },
  filterLogicObjectRendererRemoval: {
    file: 'js/filter_logic.js',
    start: '            // Handle objects - check if this object should be filtered',
    end: '            // Recursively process all properties',
    lines: 11,
    bytes: 536
  },
  filterLogicCommentDecision: {
    file: 'js/filter_logic.js',
    start: '            // Comment filtering',
    end: '            // Content filters',
    lines: 34,
    bytes: 1947
  }
};

const authoritySymbols = [
  'jsonCommentContinuationCommandShapeParityContract',
  'jsonCommentContinuationCommandShapeDecisionReport',
  'jsonCommentContinuationAppendCommandPolicy',
  'jsonCommentContinuationReloadCommandPolicy',
  'jsonCommentContinuationReplaceCommandPolicy',
  'jsonCommentContinuationMixedCommandCleanupPolicy',
  'jsonCommentContinuationNonCommentCommandSiblingPolicy',
  'jsonCommentContinuationCommandEngineBypassReport',
  'jsonCommentContinuationCommandFixtureProvenance',
  'jsonCommentContinuationCommandMetricArtifact'
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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

function commentThreadItem(id) {
  return {
    commentThreadRenderer: {
      comment: {
        commentRenderer: {
          commentId: id,
          contentText: { simpleText: `comment ${id}` }
        }
      }
    }
  };
}

function videoItem(id) {
  return {
    videoRenderer: {
      videoId: id,
      title: { simpleText: `video ${id}` }
    }
  };
}

function endpoint(command, items) {
  return {
    [command]: {
      continuationItems: items
    }
  };
}

function payload(endpoints, marker = 'command-shape-marker') {
  return {
    trackingParams: marker,
    frameworkUpdates: {
      entityBatchUpdate: {
        mutations: [{ entityKey: marker }]
      }
    },
    onResponseReceivedEndpoints: endpoints
  };
}

function items(body, index, command) {
  return body.onResponseReceivedEndpoints?.[index]?.[command]?.continuationItems;
}

function syntheticItems(body) {
  return body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

async function fetchProcessed(input, overrides = {}) {
  const engineRuntime = loadFilterTubeEngine();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: input,
    status: 209,
    statusText: 'Content Returned',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'command-shape' },
    processData(data, activeSettings, dataName) {
      return engineRuntime.engine.processData(clone(data), activeSettings, dataName);
    }
  });
  runtime.window.filterTube.updateSettings(settings(overrides));
  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  return { runtime, response, body };
}

test('command-shape parity slice is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes/);
  assert.match(text, /not an implementation patch, optimization patch, command-shape patch/);
  assert.match(text, /JSON comment continuation command-shape parity source files: 2/);
  assert.match(text, /runtime behavior changed: yes/);
  assert.match(text, /not completion proof for JSON comment continuation command-shape parity authority/);

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

test('source rows pin append-only shortcut detection against reload and replace commands', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const shortcut = blockMetric(blockSpecs.seedFetchShortcut).block;
  const normal = blockMetric(blockSpecs.seedFetchNormal).block;
  const continuationKeyRow = "const continuationKeys = ['appendContinuationItemsAction', 'reloadContinuationItemsCommand', 'replaceContinuationItemsCommand'];";

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
  }

  const anchors = [
    [seed, 'const searchActionCollections = data.onResponseReceivedCommands || data.onResponseReceivedActions || data.onResponseReceivedEndpoints;', 273, 'js/seed.js'],
    [seed, continuationKeyRow, 279, 'js/seed.js'],
    [seed, 'const actionCollections = data.onResponseReceivedActions || data.onResponseReceivedEndpoints;', 355, 'js/seed.js'],
    [seed, continuationKeyRow, 279, 'js/seed.js'],
    [seed, "if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703, 'js/seed.js'],
    [seed, 'const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint =>', 705, 'js/seed.js'],
    [seed, 'endpoint?.appendContinuationItemsAction?.continuationItems?.some(item =>', 706, 'js/seed.js'],
    [seed, 'const emptyCommentResponse = {', 714, 'js/seed.js'],
    [seed, '...jsonData,', 715, 'js/seed.js'],
    [seed, 'onResponseReceivedEndpoints: [{', 716, 'js/seed.js'],
    [seed, '// Normal processing for non-comment or non-hideAllComments requests', 739, 'js/seed.js'],
    [seed, 'const processed = processWithEngine(jsonData, dataName);', 740, 'js/seed.js'],
    [filterLogic, '// Comment filtering', 2213, 'js/filter_logic.js'],
    [filterLogic, '// Handle arrays', 3533, 'js/filter_logic.js'],
    [filterLogic, 'if (item !== null) {', 3538, 'js/filter_logic.js'],
    [filterLogic, '// Handle objects - check if this object should be filtered', 3553, 'js/filter_logic.js'],
    [filterLogic, 'return null; // Remove this entire object', 3560, 'js/filter_logic.js']
  ];

  for (const [source, needle, expectedLine, file] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
  }
  assert.equal(seed.split(/\r?\n/).findIndex((line, index) => index > 279 && line.includes(continuationKeyRow)) + 1, 358);
  assert.ok(text.includes('`js/seed.js:358`'), 'doc should cite js/seed.js:358');

  assert.equal(countLiteral(shortcut, 'appendContinuationItemsAction'), 2);
  assert.equal(countLiteral(shortcut, 'reloadContinuationItemsCommand'), 0);
  assert.equal(countLiteral(shortcut, 'replaceContinuationItemsCommand'), 0);
  assert.equal(countLiteral(shortcut, 'processWithEngine'), 0);
  assert.equal(countLiteral(normal, 'processWithEngine'), 1);
  assert.equal(countLiteral(seed, continuationKeyRow), 2);
});

test('append endpoint comments trigger shortcut and bypass engine', async () => {
  const { runtime, response, body } = await fetchProcessed(payload([
    endpoint('appendContinuationItemsAction', [commentThreadItem('append-trigger')])
  ]));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(response.status, 209);
  assert.equal(response.statusText, 'Content Returned');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'command-shape' });
  assert.equal(syntheticItems(body).length, 1);
  assert.equal(syntheticItems(body)[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('append-trigger'), false);
});

test('reload endpoint comments miss shortcut and are cleaned by normal engine path', async () => {
  const { runtime, body } = await fetchProcessed(payload([
    endpoint('reloadContinuationItemsCommand', [commentThreadItem('reload-cleaned')])
  ]));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.deepEqual(items(body, 0, 'reloadContinuationItemsCommand'), []);
  assert.equal(syntheticItems(body), undefined);
  assert.equal(JSON.stringify(body).includes('reload-cleaned'), false);
});

test('replace endpoint comments miss shortcut and are cleaned by normal engine path', async () => {
  const { runtime, body } = await fetchProcessed(payload([
    endpoint('replaceContinuationItemsCommand', [commentThreadItem('replace-cleaned')])
  ]));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.deepEqual(items(body, 0, 'replaceContinuationItemsCommand'), []);
  assert.equal(syntheticItems(body), undefined);
  assert.equal(JSON.stringify(body).includes('replace-cleaned'), false);
});

test('append non-comment plus reload and replace comments uses normal per-command engine cleanup', async () => {
  const { runtime, body } = await fetchProcessed(payload([
    endpoint('appendContinuationItemsAction', [videoItem('abcdefghijk')]),
    endpoint('reloadContinuationItemsCommand', [commentThreadItem('reload-removed')]),
    endpoint('replaceContinuationItemsCommand', [commentThreadItem('replace-removed')])
  ]));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(items(body, 0, 'appendContinuationItemsAction')[0].videoRenderer.videoId, 'abcdefghijk');
  assert.deepEqual(items(body, 1, 'reloadContinuationItemsCommand'), []);
  assert.deepEqual(items(body, 2, 'replaceContinuationItemsCommand'), []);
  assert.equal(JSON.stringify(body).includes('reload-removed'), false);
  assert.equal(JSON.stringify(body).includes('replace-removed'), false);
});

test('append comment trigger drops reload and replace comment commands without engine decisions', async () => {
  const { runtime, body } = await fetchProcessed(payload([
    endpoint('appendContinuationItemsAction', [commentThreadItem('append-trigger')]),
    endpoint('reloadContinuationItemsCommand', [commentThreadItem('reload-dropped')]),
    endpoint('replaceContinuationItemsCommand', [commentThreadItem('replace-dropped')])
  ]));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(body.onResponseReceivedEndpoints.length, 1);
  assert.equal(syntheticItems(body).length, 1);
  assert.equal(syntheticItems(body)[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('append-trigger'), false);
  assert.equal(JSON.stringify(body).includes('reload-dropped'), false);
  assert.equal(JSON.stringify(body).includes('replace-dropped'), false);
});

test('append comment trigger drops non-comment reload and replace command siblings', async () => {
  const { runtime, body } = await fetchProcessed(payload([
    endpoint('appendContinuationItemsAction', [commentThreadItem('append-trigger')]),
    endpoint('reloadContinuationItemsCommand', [videoItem('bcdefghijkl')]),
    endpoint('replaceContinuationItemsCommand', [videoItem('cdefghijklm')])
  ], 'command-shape-spread-proof'));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(body.trackingParams, 'command-shape-spread-proof');
  assert.equal(body.frameworkUpdates.entityBatchUpdate.mutations[0].entityKey, 'command-shape-spread-proof');
  assert.equal(body.onResponseReceivedEndpoints.length, 1);
  assert.equal(syntheticItems(body)[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('bcdefghijkl'), false);
  assert.equal(JSON.stringify(body).includes('cdefghijklm'), false);
});

test('command-shape parity slice records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime JSON comment continuation command-shape parity fixtures: 6',
    'Endpoint-root append classic comments trigger the fetch shortcut',
    'Endpoint-root reload classic comments do not trigger the shortcut',
    'Endpoint-root replace classic comments do not trigger the shortcut',
    'Endpoint-root append non-comment items plus reload/replace comments do not',
    'Endpoint-root append classic comments plus reload/replace classic comments',
    'Endpoint-root append classic comments plus reload/replace non-comment items'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'endpoint',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settings mode',
    'responseCollectionRoot',
    'continuationCommand',
    'commandIndex',
    'commentItemCountBefore',
    'commentItemCountAfter',
    'nonCommentSiblingCountBefore',
    'nonCommentSiblingCountAfter',
    'shortcutTriggered',
    'syntheticEndAllowed',
    'engineBypassAllowed',
    'commandShapeParityPolicy',
    'mixedCommandCleanupPolicy',
    'nonCommentCommandSiblingPolicy',
    'fixtureProvenance',
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
