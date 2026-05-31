import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
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
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    videoChannelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function keywordSettings() {
  return settings({
    filterKeywords: [{ pattern: 'Blocked', flags: 'i' }]
  });
}

function videoItem(videoId, title) {
  return {
    videoRenderer: {
      videoId,
      title: { runs: [{ text: title }] },
      shortBylineText: { runs: [{ text: 'Source Channel' }] }
    }
  };
}

test('JSON-first renderer traversal mutation boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior changed: yes;\s+seed no-work admission now bypasses inactive YouTubei body parsing before\s+traversal/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for JSON-first renderer traversal or mutation authority/);

  for (const [file, lines, bytes, hash] of [
    ['js/filter_logic.js', 3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
    ['js/seed.js', 1136, 50026, 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d']
  ]) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.ok(doc.includes(`\`${file}\``), `doc should list ${file}`);
  }

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_METHOD_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('renderer traversal source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');

  const filterBlock = sliceBetween(filterLogic, "filter(obj, path = 'root') {", '        /**\n         * Process YouTube data with filtering');
  const processDataBlock = sliceBetween(filterLogic, "processData(data, dataName = 'unknown') {", '    }\n\n    // ============================================================================\n    // GLOBAL INTERFACE');
  const globalInterfaceBlock = sliceBetween(filterLogic, 'window.FilterTubeEngine = {', "    postLogToBridge('log', 'Comprehensive filtering engine loaded successfully');");
  const unwrapBlock = sliceBetween(filterLogic, '_unwrapRendererForFiltering(item, rendererType) {', '        _paths(value) {');
  const shouldBlockBlock = sliceBetween(filterLogic, '_shouldBlock(item, rendererType) {', '        _checkCategoryFilters(item, rules, rendererType) {');
  const seedProcessBlock = sliceBetween(seed, 'function processWithEngine(data, dataName) {', 'function setupFetchInterception() {');

  assert.equal(lineCount(filterBlock), 40);
  assert.equal(Buffer.byteLength(filterBlock), 1448);
  assert.equal(countLiteral(filterBlock, 'filter('), 4);
  assert.equal(countLiteral(filterBlock, '_shouldBlock'), 1);
  assert.equal(countLiteral(filterBlock, 'Array.isArray'), 1);
  assert.equal(countLiteral(filterBlock, 'filtered.push'), 1);
  assert.equal(countLiteral(filterBlock, 'return filtered'), 1);
  assert.equal(countLiteral(filterBlock, 'return null'), 1);
  assert.equal(countLiteral(filterBlock, 'Object.keys'), 1);
  assert.equal(countLiteral(filterBlock, 'Object.entries'), 1);
  assert.equal(countLiteral(filterBlock, 'result[key]'), 1);

  assert.equal(lineCount(processDataBlock), 32);
  assert.equal(Buffer.byteLength(processDataBlock), 1232);
  assert.equal(countLiteral(processDataBlock, 'Date.now'), 2);
  assert.equal(countLiteral(processDataBlock, 'filter('), 1);
  assert.equal(countLiteral(processDataBlock, 'return filtered'), 1);

  assert.equal(lineCount(globalInterfaceBlock), 23);
  assert.equal(Buffer.byteLength(globalInterfaceBlock), 892);
  assert.equal(countLiteral(globalInterfaceBlock, 'processData'), 2);
  assert.equal(countLiteral(globalInterfaceBlock, 'harvestOnly'), 2);

  assert.equal(lineCount(unwrapBlock), 44);
  assert.equal(Buffer.byteLength(unwrapBlock), 1907);
  assert.equal(countLiteral(unwrapBlock, 'preferredNestedRenderers'), 2);
  assert.equal(countLiteral(unwrapBlock, 'wrapperRendererType'), 3);
  assert.equal(countLiteral(unwrapBlock, 'ViewModel'), 3);

  assert.equal(lineCount(shouldBlockBlock), 301);
  assert.equal(Buffer.byteLength(shouldBlockBlock), 15380);
  assert.equal(countLiteral(shouldBlockBlock, 'return true'), 11);
  assert.equal(countLiteral(shouldBlockBlock, 'return false'), 11);
  assert.equal(countLiteral(shouldBlockBlock, 'whitelist'), 20);
  assert.equal(countLiteral(shouldBlockBlock, 'filterKeywords'), 5);
  assert.equal(countLiteral(shouldBlockBlock, 'filterChannels'), 4);
  assert.equal(countLiteral(shouldBlockBlock, '_checkContentFilters'), 1);
  assert.equal(countLiteral(shouldBlockBlock, '_checkCategoryFilters'), 1);
  assert.equal(countLiteral(shouldBlockBlock, 'postMessage'), 1);

  assert.equal(lineCount(seedProcessBlock), 284);
  assert.equal(Buffer.byteLength(seedProcessBlock), 13626);
  assert.equal(countLiteral(seedProcessBlock, 'FilterTubeEngine.processData'), 2);
  assert.equal(countLiteral(seedProcessBlock, 'harvestOnly'), 4);
  assert.equal(countLiteral(seedProcessBlock, 'JSON.stringify'), 2);

  for (const phrase of [
    'renderer traversal/mutation source/effect blocks: 5',
    'filter_logic filter block lines: 40',
    'filter_logic processData block lines: 32',
    'filter_logic unwrapRendererForFiltering block lines: 44',
    'filter_logic _shouldBlock block lines: 301',
    'seed processWithEngine block lines: 284'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('active traversal rebuilds object and array containers even when no renderer is removed', () => {
  const { engine } = loadFilterTubeEngine();
  const payload = {
    contents: [
      videoItem('allowed0001', 'Allowed Title')
    ],
    metadata: { label: 'unchanged' }
  };

  const result = engine.processData(payload, settings(), 'renderer-noop-fixture');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), JSON.parse(JSON.stringify(payload)));
  assert.notEqual(result, payload);
  assert.notEqual(result.contents, payload.contents);
  assert.notEqual(result.contents[0], payload.contents[0]);
  assert.notEqual(result.contents[0].videoRenderer, payload.contents[0].videoRenderer);
  assert.notEqual(result.metadata, payload.metadata);
});

test('disabled traversal boundary returns the original payload reference', () => {
  const { engine } = loadFilterTubeEngine();
  const payload = {
    contents: [
      videoItem('blocked0001', 'Blocked Title')
    ]
  };

  const result = engine.processData(payload, settings({ enabled: false }), 'renderer-disabled-fixture');

  assert.equal(result, payload);
  assert.equal(result.contents, payload.contents);
  assert.equal(result.contents[0], payload.contents[0]);
});

test('array traversal compacts blocked renderer items while preserving allowed siblings', () => {
  const { engine } = loadFilterTubeEngine();
  const payload = {
    contents: [
      videoItem('blocked0001', 'Blocked Title'),
      videoItem('allowed0001', 'Allowed Title')
    ]
  };

  const result = engine.processData(payload, keywordSettings(), 'renderer-array-fixture');

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].videoRenderer.videoId, 'allowed0001');
  assert.equal(payload.contents.length, 2, 'input array remains available to the caller');
});

test('object property traversal omits nested blocked renderer children', () => {
  const { engine } = loadFilterTubeEngine();
  const payload = {
    contents: [{
      slot: {
        videoRenderer: {
          videoId: 'blocked0001',
          title: { runs: [{ text: 'Blocked Title' }] }
        },
        shelfRenderer: {
          title: { simpleText: 'Sibling shelf' }
        }
      },
      keeper: {
        videoRenderer: {
          videoId: 'allowed0001',
          title: { runs: [{ text: 'Allowed Title' }] }
        }
      }
    }]
  };

  const result = engine.processData(payload, keywordSettings(), 'renderer-object-fixture');

  assert.deepEqual(Object.keys(result.contents[0]), ['keeper']);
  assert.equal(result.contents[0].keeper.videoRenderer.videoId, 'allowed0001');
});

test('richItemRenderer wrapper removal follows preferred nested renderer blocking', () => {
  const { engine } = loadFilterTubeEngine();
  const payload = {
    items: [
      {
        richItemRenderer: {
          content: {
            videoRenderer: {
              videoId: 'blocked0001',
              title: { runs: [{ text: 'Blocked Title' }] }
            }
          },
          trackingParams: 'blocked-wrapper'
        }
      },
      {
        richItemRenderer: {
          content: {
            videoRenderer: {
              videoId: 'allowed0001',
              title: { runs: [{ text: 'Allowed Title' }] }
            }
          },
          trackingParams: 'allowed-wrapper'
        }
      }
    ]
  };

  const result = engine.processData(payload, keywordSettings(), 'renderer-wrapper-fixture');

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].richItemRenderer.trackingParams, 'allowed-wrapper');
  assert.equal(result.items[0].richItemRenderer.content.videoRenderer.videoId, 'allowed0001');
});

test('product runtime still lacks first-class renderer traversal mutation authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstRendererTraversalContract',
    'jsonFirstRendererMutationBudget',
    'jsonFirstRecursiveFilterReport',
    'jsonFirstArrayCompactionPolicy',
    'jsonFirstObjectOmissionPolicy',
    'jsonFirstRendererWrapperPolicy',
    'jsonFirstRendererSiblingPolicy',
    'jsonFirstFilterNoopIdentityPolicy',
    'jsonFirstTraversalMetricArtifact',
    'jsonFirstRendererMutationFixtureProvenance'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing runtime symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});
