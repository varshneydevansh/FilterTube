import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

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
    lines: 12,
    bytes: 404
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
  'jsonCommentContinuationCollectionRootParityContract',
  'jsonCommentContinuationCollectionRootDecisionReport',
  'jsonCommentContinuationActionRootPolicy',
  'jsonCommentContinuationCommandRootPolicy',
  'jsonCommentContinuationRootPrecedencePolicy',
  'jsonCommentContinuationCrossRootCleanupPolicy',
  'jsonCommentContinuationMixedRootLeakBudget',
  'jsonCommentContinuationRootEngineBypassReport',
  'jsonCommentContinuationCollectionRootFixtureProvenance',
  'jsonCommentContinuationCollectionRootMetricArtifact'
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

function commentItem(id) {
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

function videoItem(id = 'abcdefghijk') {
  return {
    videoRenderer: {
      videoId: id,
      title: { simpleText: `video ${id}` }
    }
  };
}

function rootEntry(command, items) {
  return {
    [command]: {
      continuationItems: items
    }
  };
}

function payload({ endpoints, actions, commands, marker = 'root-parity-marker' } = {}) {
  const data = {
    trackingParams: marker,
    frameworkUpdates: {
      entityBatchUpdate: {
        mutations: [{ entityKey: marker }]
      }
    }
  };
  if (endpoints) data.onResponseReceivedEndpoints = endpoints;
  if (actions) data.onResponseReceivedActions = actions;
  if (commands) data.onResponseReceivedCommands = commands;
  return data;
}

function items(body, root, command = 'appendContinuationItemsAction') {
  return body[root]?.[0]?.[command]?.continuationItems;
}

async function fetchProcessed(input, overrides = {}) {
  const engineRuntime = loadFilterTubeEngine();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload: input,
    status: 208,
    statusText: 'Already Reported',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'root-parity' },
    processData(data, activeSettings, dataName) {
      return engineRuntime.engine.processData(clone(data), activeSettings, dataName);
    }
  });
  runtime.window.filterTube.updateSettings(settings(overrides));
  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  return { runtime, response, body };
}

test('collection-root parity slice is audit-only and source pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes/);
  assert.match(text, /not an implementation patch, optimization patch, collection-root patch/);
  assert.match(text, /JSON comment continuation collection-root parity source files: 2/);
  assert.match(text, /runtime behavior changed: yes/);
  assert.match(text, /not completion proof for JSON comment continuation collection-root parity authority/);

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

test('source rows and token counts pin endpoint-only shortcut detection', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const selected = [seed, filterLogic].join('\n');
  const shortcut = blockMetric(blockSpecs.seedFetchShortcut).block;
  const normal = blockMetric(blockSpecs.seedFetchNormal).block;

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count changed`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count changed`);
  }

  const anchors = [
    [seed, "if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703, 'js/seed.js'],
    [seed, 'const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint =>', 705, 'js/seed.js'],
    [seed, 'endpoint?.appendContinuationItemsAction?.continuationItems?.some(item =>', 706, 'js/seed.js'],
    [seed, 'item?.commentThreadRenderer || item?.commentRenderer', 707, 'js/seed.js'],
    [seed, 'const emptyCommentResponse = {', 714, 'js/seed.js'],
    [seed, '...jsonData,', 715, 'js/seed.js'],
    [seed, 'onResponseReceivedEndpoints: [{', 716, 'js/seed.js'],
    [seed, '// Normal processing for non-comment or non-hideAllComments requests', 739, 'js/seed.js'],
    [seed, 'const processed = processWithEngine(jsonData, dataName);', 740, 'js/seed.js'],
    [filterLogic, '// Handle arrays', 3396, 'js/filter_logic.js'],
    [filterLogic, 'if (item !== null) {', 3401, 'js/filter_logic.js'],
    [filterLogic, '// Handle objects - check if this object should be filtered', 3408, 'js/filter_logic.js'],
    [filterLogic, 'return null; // Remove this entire object', 3415, 'js/filter_logic.js'],
    [filterLogic, '// Comment filtering', 2076, 'js/filter_logic.js']
  ];

  for (const [source, needle, expectedLine, file] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
  }

  assert.equal(countLiteral(shortcut, 'onResponseReceivedEndpoints'), 2);
  assert.equal(countLiteral(shortcut, 'onResponseReceivedActions'), 0);
  assert.equal(countLiteral(shortcut, 'onResponseReceivedCommands'), 0);
  assert.equal(countLiteral(shortcut, 'appendContinuationItemsAction'), 2);
  assert.equal(countLiteral(shortcut, 'processWithEngine'), 0);
  assert.equal(countLiteral(normal, 'processWithEngine'), 1);
  assert.equal(countLiteral(selected, 'onResponseReceivedCommands'), 1);
  assert.equal(countLiteral(selected, 'onResponseReceivedActions'), 2);
  assert.equal(countLiteral(selected, 'onResponseReceivedEndpoints'), 4);
});

test('endpoint-root append comments trigger shortcut and bypass engine', async () => {
  const { runtime, response, body } = await fetchProcessed(payload({
    endpoints: [rootEntry('appendContinuationItemsAction', [commentItem('endpoint-comment')])]
  }));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(response.status, 208);
  assert.equal(response.statusText, 'Already Reported');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'root-parity' });
  assert.equal(items(body, 'onResponseReceivedEndpoints').length, 1);
  assert.equal(items(body, 'onResponseReceivedEndpoints')[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('endpoint-comment'), false);
});

test('action-root append comments miss shortcut and are removed by normal engine path', async () => {
  const { runtime, body } = await fetchProcessed(payload({
    actions: [rootEntry('appendContinuationItemsAction', [commentItem('action-comment')])]
  }));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.deepEqual(items(body, 'onResponseReceivedActions'), []);
  assert.equal(JSON.stringify(body).includes('action-comment'), false);
});

test('command-root append comments miss shortcut and are removed by normal engine path', async () => {
  const { runtime, body } = await fetchProcessed(payload({
    commands: [rootEntry('appendContinuationItemsAction', [commentItem('command-comment')])]
  }));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.deepEqual(items(body, 'onResponseReceivedCommands'), []);
  assert.equal(JSON.stringify(body).includes('command-comment'), false);
});

test('mixed roots leak action and command comments when endpoint root triggers shortcut', async () => {
  const { runtime, body } = await fetchProcessed(payload({
    endpoints: [rootEntry('appendContinuationItemsAction', [commentItem('endpoint-trigger')])],
    actions: [rootEntry('appendContinuationItemsAction', [commentItem('action-survives')])],
    commands: [rootEntry('appendContinuationItemsAction', [commentItem('command-survives')])]
  }));

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(items(body, 'onResponseReceivedEndpoints').length, 1);
  assert.equal(items(body, 'onResponseReceivedEndpoints')[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(items(body, 'onResponseReceivedActions')[0].commentThreadRenderer.comment.commentRenderer.commentId, 'action-survives');
  assert.equal(items(body, 'onResponseReceivedCommands')[0].commentThreadRenderer.comment.commentRenderer.commentId, 'command-survives');
  assert.equal(JSON.stringify(body).includes('endpoint-trigger'), false);
});

test('non-comment endpoint root lets action and command comments reach engine cleanup', async () => {
  const { runtime, body } = await fetchProcessed(payload({
    endpoints: [rootEntry('appendContinuationItemsAction', [videoItem('abcdefghijk')])],
    actions: [rootEntry('appendContinuationItemsAction', [commentItem('action-removed')])],
    commands: [rootEntry('appendContinuationItemsAction', [commentItem('command-removed')])]
  }));

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(items(body, 'onResponseReceivedEndpoints')[0].videoRenderer.videoId, 'abcdefghijk');
  assert.deepEqual(items(body, 'onResponseReceivedActions'), []);
  assert.deepEqual(items(body, 'onResponseReceivedCommands'), []);
});

test('endpoint shortcut preserves non-endpoint roots and spread metadata', async () => {
  const { body } = await fetchProcessed(payload({
    endpoints: [rootEntry('appendContinuationItemsAction', [commentItem('endpoint-trigger')])],
    actions: [rootEntry('appendContinuationItemsAction', [videoItem('bcdefghijkl')])],
    marker: 'root-parity-spread-proof'
  }));

  assert.equal(body.trackingParams, 'root-parity-spread-proof');
  assert.equal(body.frameworkUpdates.entityBatchUpdate.mutations[0].entityKey, 'root-parity-spread-proof');
  assert.equal(items(body, 'onResponseReceivedActions')[0].videoRenderer.videoId, 'bcdefghijkl');
  assert.equal(JSON.stringify(body).includes('endpoint-trigger'), false);
});

test('collection-root parity slice records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime JSON comment continuation collection-root parity fixtures: 8',
    'Endpoint-root append comments trigger the fetch shortcut and bypass the',
    'Action-root append comments alone miss the shortcut and are removed by the',
    'Command-root append comments alone miss the shortcut and are removed by the',
    'Mixed endpoint/action/command roots with an endpoint-root comment trigger the',
    'Endpoint-root non-comment append items do not trigger the shortcut',
    'Endpoint-root classic comments plus action-root non-comment rows preserve the',
    'The shortcut preserves spread metadata outside the endpoint root.',
    'The shortcut source still has no `onResponseReceivedActions` or'
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
    'rootType',
    'responseCollectionRoot',
    'continuationCommand',
    'commentItemCountBefore',
    'commentItemCountAfter',
    'shortcutTriggered',
    'engineBypassAllowed',
    'actionRootCleanupPolicy',
    'commandRootCleanupPolicy',
    'crossRootPreservationPolicy',
    'mixedRootLeakBudget',
    'rootPrecedencePolicy',
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
