import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

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
  filterLogicRecursivePropertyCopy: {
    file: 'js/filter_logic.js',
    start: '            // Recursively process all properties',
    end: '            return result;',
    lines: 18,
    bytes: 743
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
  'jsonCommentContinuationSiblingPreservationContract',
  'jsonCommentContinuationSiblingDecisionReport',
  'jsonCommentContinuationMixedCollectionPolicy',
  'jsonCommentContinuationHeaderPreservationPolicy',
  'jsonCommentContinuationVideoSiblingPolicy',
  'jsonCommentContinuationEndpointPreservationPolicy',
  'jsonCommentContinuationFetchReplacementReport',
  'jsonCommentContinuationEngineParityReport',
  'jsonCommentContinuationSiblingFixtureProvenance',
  'jsonCommentContinuationSiblingMetricArtifact'
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
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...overrides
  };
}

function commentThreadItem(id = 'Ugw-sibling-comment', text = 'needle comment body') {
  return {
    commentThreadRenderer: {
      comment: {
        commentRenderer: {
          commentId: id,
          contentText: { simpleText: text }
        }
      }
    }
  };
}

function commentRendererItem(id = 'Ugw-sibling-direct-comment', text = 'needle direct comment body') {
  return {
    commentRenderer: {
      commentId: id,
      contentText: { simpleText: text }
    }
  };
}

function commentsHeaderItem() {
  return {
    commentsHeaderRenderer: {
      countText: { runs: [{ text: '42 Comments' }] },
      sortMenu: { sortFilterSubMenuRenderer: { title: 'Sort by' } }
    }
  };
}

function videoItem() {
  return {
    videoRenderer: {
      videoId: 'abcdefghijk',
      title: { simpleText: 'Visible recommendation sibling' }
    }
  };
}

function originalContinuationItem() {
  return {
    continuationItemRenderer: {
      trigger: 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN',
      continuationEndpoint: {
        continuationCommand: {
          token: 'original-next-token'
        }
      }
    }
  };
}

function mixedPayload(items = [commentThreadItem(), commentsHeaderItem(), videoItem(), originalContinuationItem()]) {
  return {
    trackingParams: 'mixed-comments-sibling-proof',
    onResponseReceivedEndpoints: [{
      appendContinuationItemsAction: {
        continuationItems: items
      }
    }],
    frameworkUpdates: {
      entityBatchUpdate: {
        mutations: [{
          entityKey: 'sibling-proof',
          payload: { marker: 'spread-field-should-survive-fetch-shortcut' }
        }]
      }
    }
  };
}

function continuationItems(body) {
  return body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

function runEngine(payload, overrides = {}) {
  const { engine } = loadFilterTubeEngine();
  return clone(engine.processData(clone(payload), settings(overrides), 'json-comment-continuation-sibling-preservation'));
}

async function fetchProcessed(payload, overrides = {}) {
  const engineRuntime = loadFilterTubeEngine();
  const runtime = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload,
    status: 209,
    statusText: 'Content Returned',
    headers: { 'content-type': 'application/json', 'x-filtertube-test': 'sibling-preservation' },
    processData(data, activeSettings, dataName) {
      return engineRuntime.engine.processData(clone(data), activeSettings, dataName);
    }
  });
  runtime.window.filterTube.updateSettings(settings(overrides));
  const response = await runtime.window.fetch('https://www.youtube.com/youtubei/v1/next?prettyPrint=false');
  const body = await response.json();
  return { runtime, response, body };
}

test('JSON comment continuation sibling preservation slice is audit-only and pinned', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior proof slice/);
  assert.match(text, /Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes/);
  assert.match(text, /not an implementation patch, optimization patch, continuation patch/);
  assert.match(text, /JSON comment continuation sibling preservation source files: 2/);
  assert.match(text, /runtime behavior changed: yes/);
  assert.match(text, /not completion proof for JSON comment continuation sibling preservation authority/);

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

test('source rows and selected token counts pin shortcut versus engine sibling behavior', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const filterLogic = read('js/filter_logic.js');
  const selected = [seed, filterLogic].join('\n');
  const shortcut = blockMetric(blockSpecs.seedFetchShortcut).block;

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
    [seed, 'continuationItemRenderer: {', 721, 'js/seed.js'],
    [seed, 'continuationEndpoint: null', 723, 'js/seed.js'],
    [seed, '// Normal processing for non-comment or non-hideAllComments requests', 739, 'js/seed.js'],
    [seed, 'const processed = processWithEngine(jsonData, dataName);', 740, 'js/seed.js'],
    [filterLogic, '// Handle arrays', 3533, 'js/filter_logic.js'],
    [filterLogic, 'if (item !== null) {', 3538, 'js/filter_logic.js'],
    [filterLogic, '// Handle objects - check if this object should be filtered', 3553, 'js/filter_logic.js'],
    [filterLogic, 'return null; // Remove this entire object', 3560, 'js/filter_logic.js'],
    [filterLogic, '// Recursively process all properties', 3564, 'js/filter_logic.js'],
    [filterLogic, 'if (filteredValue !== null) {', 3573, 'js/filter_logic.js'],
    [filterLogic, '// Comment filtering', 2213, 'js/filter_logic.js']
  ];

  for (const [source, needle, expectedLine, file] of anchors) {
    assert.equal(lineOf(source, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`${file}:${expectedLine}\``), `doc should cite ${file}:${expectedLine}`);
  }

  assert.equal(countLiteral(selected, 'commentsHeaderRenderer'), 0);
  assert.equal(countLiteral(selected, 'commentHeaderRenderer'), 0);
  assert.equal(countLiteral(selected, 'continuationItemRenderer'), 1);
  assert.equal(countLiteral(selected, 'appendContinuationItemsAction'), 4);
  assert.equal(countLiteral(selected, 'continuationItems'), 10);
  assert.equal(countLiteral(selected, 'onResponseReceivedEndpoints'), 4);
  assert.equal(countLiteral(shortcut, 'commentsHeaderRenderer'), 0);
  assert.equal(countLiteral(shortcut, 'videoRenderer'), 0);
  assert.equal(countLiteral(shortcut, 'continuationItemRenderer'), 1);
  assert.equal(countLiteral(shortcut, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(shortcut, 'commentRenderer'), 1);
});

test('engine hideAllComments removes comment item while preserving mixed continuation siblings', () => {
  const output = runEngine(mixedPayload(), { hideAllComments: true });
  const items = continuationItems(output);

  assert.equal(items.length, 3);
  assert.equal(items[0].commentsHeaderRenderer.countText.runs[0].text, '42 Comments');
  assert.equal(items[1].videoRenderer.videoId, 'abcdefghijk');
  assert.equal(items[2].continuationItemRenderer.continuationEndpoint.continuationCommand.token, 'original-next-token');
  assert.equal(JSON.stringify(output).includes('commentThreadRenderer'), false);
  assert.equal(output.frameworkUpdates.entityBatchUpdate.mutations[0].payload.marker, 'spread-field-should-survive-fetch-shortcut');
});

test('fetch shortcut drops mixed continuation siblings and returns only synthetic end marker', async () => {
  const { runtime, response, body } = await fetchProcessed(mixedPayload(), { hideAllComments: true });
  const items = continuationItems(body);

  assert.equal(runtime.calls.processData.length, 0);
  assert.equal(runtime.calls.harvestOnly.length, 0);
  assert.equal(runtime.calls.jsonStringify.length, 1);
  assert.equal(response.status, 209);
  assert.equal(response.statusText, 'Content Returned');
  assert.deepEqual(response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'sibling-preservation' });
  assert.equal(items.length, 1);
  assert.equal(items[0].continuationItemRenderer.trigger, 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN');
  assert.equal(items[0].continuationItemRenderer.continuationEndpoint, null);
  assert.equal(JSON.stringify(body).includes('commentsHeaderRenderer'), false);
  assert.equal(JSON.stringify(body).includes('Visible recommendation sibling'), false);
  assert.equal(JSON.stringify(body).includes('original-next-token'), false);
});

test('fetch shortcut preserves spread fields outside replaced continuation root', async () => {
  const { body } = await fetchProcessed(mixedPayload(), { hideAllComments: true });

  assert.equal(body.trackingParams, 'mixed-comments-sibling-proof');
  assert.equal(
    body.frameworkUpdates.entityBatchUpdate.mutations[0].payload.marker,
    'spread-field-should-survive-fetch-shortcut'
  );
});

test('fetch normal path with comment keyword removes comment and preserves siblings', async () => {
  const payload = mixedPayload([commentRendererItem(), commentsHeaderItem(), videoItem(), originalContinuationItem()]);
  const { runtime, body } = await fetchProcessed(payload, {
    hideAllComments: false,
    filterKeywordsComments: [/needle/i]
  });
  const items = continuationItems(body);

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(items.length, 3);
  assert.equal(items[0].commentsHeaderRenderer.countText.runs[0].text, '42 Comments');
  assert.equal(items[1].videoRenderer.videoId, 'abcdefghijk');
  assert.equal(items[2].continuationItemRenderer.continuationEndpoint.continuationCommand.token, 'original-next-token');
  assert.equal(JSON.stringify(body).includes('commentThreadRenderer'), false);
});

test('non-comment-only append continuation does not trigger shortcut and reaches normal engine processing', async () => {
  const payload = mixedPayload([commentsHeaderItem(), videoItem(), originalContinuationItem()]);
  const { runtime, body } = await fetchProcessed(payload, { hideAllComments: true });
  const items = continuationItems(body);

  assert.equal(runtime.calls.processData.length, 1);
  assert.equal(runtime.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(items.length, 3);
  assert.equal(items[0].commentsHeaderRenderer.countText.runs[0].text, '42 Comments');
  assert.equal(items[1].videoRenderer.videoId, 'abcdefghijk');
  assert.equal(items[2].continuationItemRenderer.continuationEndpoint.continuationCommand.token, 'original-next-token');
});

test('sibling preservation slice records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'runtime JSON comment continuation sibling preservation fixtures: 8',
    'Engine filtering with `hideAllComments:true` removes the classic comment',
    'Fetch shortcut with the same mixed append continuation bypasses the engine',
    'Fetch shortcut drops the header-like sibling.',
    'Fetch shortcut drops the video sibling.',
    'Fetch shortcut overwrites the original continuation item and its endpoint.',
    'Fetch shortcut preserves response metadata and spread fields outside',
    'Fetch normal path with `hideAllComments:false` and a comments-only keyword',
    'non-comment-only append continuation does not trigger the shortcut'
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
    'continuationItemCountBefore',
    'commentItemCountBefore',
    'headerSiblingCountBefore',
    'videoSiblingCountBefore',
    'originalContinuationCountBefore',
    'syntheticEndAllowed',
    'engineBypassAllowed',
    'siblingDropAllowed',
    'headerPreservationPolicy',
    'videoSiblingPolicy',
    'continuationEndpointPolicy',
    'metadataPreservationPolicy',
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
