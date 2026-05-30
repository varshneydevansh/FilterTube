import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const fixturePath = 'tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_WATCHPAGE_EMBEDDED_POST_RENDERER_CURRENT_BEHAVIOR_2026-05-23.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function parseEmbeddedYtInitialData(raw) {
  const marker = 'var ytInitialData =';
  const markerIndex = raw.indexOf(marker);
  assert.notEqual(markerIndex, -1, 'watchpage raw capture should contain var ytInitialData');

  const start = raw.indexOf('{', markerIndex);
  assert.notEqual(start, -1, 'watchpage raw capture should contain an object after var ytInitialData');

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  assert.notEqual(end, -1, 'watchpage raw capture should contain a balanced ytInitialData object');
  return {
    markerIndex,
    start,
    end,
    embeddedText: raw.slice(start, end),
    data: JSON.parse(raw.slice(start, end))
  };
}

function formatPath(pathParts) {
  return pathParts.map((part, index) => {
    if (typeof part === 'number') return `[${part}]`;
    return index === 0 ? part : `.${part}`;
  }).join('').replace(/\.\[/g, '[');
}

function collectKeyPaths(node, targetKey, pathParts = [], paths = []) {
  if (!node || typeof node !== 'object') return paths;

  if (Object.prototype.hasOwnProperty.call(node, targetKey)) {
    paths.push(formatPath([...pathParts, targetKey]));
  }

  if (Array.isArray(node)) {
    node.forEach((child, index) => collectKeyPaths(child, targetKey, [...pathParts, index], paths));
  } else {
    for (const [key, value] of Object.entries(node)) {
      collectKeyPaths(value, targetKey, [...pathParts, key], paths);
    }
  }

  return paths;
}

function countKeys(node, targetKey) {
  return collectKeyPaths(node, targetKey).length;
}

function runEngine(input, settings) {
  const { engine, messages } = loadFilterTubeEngine();
  const output = engine.processData(plain(input), baseSettings(settings), 'main-watchpage-embedded-post-renderer.json');
  return { output, messages };
}

function filterRulesBlock() {
  const source = read('js/filter_logic.js');
  const startNeedle = 'const FILTER_RULES = {';
  const endNeedle = '// ============================================================================\n    // FILTERING ENGINE';
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start);
  assert.notEqual(start, -1, 'missing FILTER_RULES start');
  assert.notEqual(end, -1, 'missing FILTER_RULES end');
  return source.slice(start, end);
}

test('watchpage.json is a Markdown plus embedded ytInitialData container, not direct JSON', () => {
  const raw = read('watchpage.json');
  const parsed = parseEmbeddedYtInitialData(raw);

  assert.throws(() => JSON.parse(raw));
  assert.match(raw.slice(0, 120), /Kids vs Main Filter UX Consistency Audit/);
  assert.equal(parsed.markerIndex, 10448);
  assert.equal(parsed.start, 10468);
  assert.equal(parsed.end, 4572046);
  assert.equal(parsed.embeddedText.length, 4561578);
  assert.equal((raw.match(/postRenderer/g) || []).length, 3);
  assert.ok(raw.includes('"value": "FEwhat_to_watch"'));
});

test('embedded watchpage ytInitialData postRenderer paths are browse rich-grid posts, not watch-next rows', () => {
  const { data } = parseEmbeddedYtInitialData(read('watchpage.json'));
  const postPaths = collectKeyPaths(data, 'postRenderer');

  assert.ok(data.contents.twoColumnBrowseResultsRenderer);
  assert.equal(data.contents.twoColumnWatchNextResults, undefined);
  assert.equal(countKeys(data, 'postRenderer'), 2);
  assert.equal(countKeys(data, 'lockupViewModel'), 24);
  assert.equal(countKeys(data, 'shortsLockupViewModel'), 18);
  assert.deepEqual(postPaths, [
    'contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[8].richSectionRenderer.content.richShelfRenderer.contents[0].richItemRenderer.content.postRenderer',
    'contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[8].richSectionRenderer.content.richShelfRenderer.contents[1].richItemRenderer.content.postRenderer'
  ]);
});

test('reduced watchpage postRenderer fixture preserves raw provenance and post identities', () => {
  const capture = loadFixture();

  assert.equal(capture.provenance.source, 'watchpage.json');
  assert.equal(capture.provenance.sourceSha256, 'baf8a78adbbc5509c3ab50e4a26131ba294293771b89666498f34324cbd82ab3');
  assert.equal(capture.provenance.sourceBytes, 4572676);
  assert.equal(capture.provenance.sourceLines, 32116);
  assert.equal(capture.provenance.rawContainer, 'Markdown/planning text followed by a var ytInitialData object; not direct JSON');
  assert.equal(capture.provenance.embeddedRouteMarker, 'FEwhat_to_watch');
  assert.equal(capture.provenance.rendererType, 'postRenderer');
  assert.equal(capture.provenance.route, 'browse/feed, not watch-next');
  assert.equal(capture.provenance.releaseInputAllowed, false);
  assert.deepEqual(
    capture.response.contents.map((item) => item.postRenderer.authorEndpoint.browseEndpoint.browseId),
    ['UC20a2HcBo8q8BgvQU-nBgnQ', 'UCXRt-HjEaTF6J6regWoopjw']
  );
  assert.deepEqual(
    capture.response.contents.map((item) => item.postRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl),
    ['/@TheTVPolicePodcast', '/@Russianlanguage']
  );
});

test('postRenderer has no direct FILTER_RULES entry while legacy backstage post renderers are covered', () => {
  const rules = filterRulesBlock();

  assert.doesNotMatch(rules, /\n\s*postRenderer\s*:/);
  assert.doesNotMatch(rules, /\n\s*sharedPostRenderer\s*:/);
  assert.match(rules, /\n\s*backstagePostThreadRenderer\s*:/);
  assert.match(rules, /\n\s*backstagePostRenderer\s*:/);
});

test('captured watchpage postRenderer rows pass through blocklist keyword and channel rules while queuing channel-map side effects', () => {
  const capture = loadFixture();
  const input = capture.response;

  for (const settings of [
    { filterKeywords: [keyword('Nastya')] },
    { filterChannels: [{ id: 'UCXRt-HjEaTF6J6regWoopjw', handle: '@Russianlanguage' }] }
  ]) {
    const { output, messages } = runEngine(input, settings);
    const updates = messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');

    assert.deepEqual(plain(output), plain(input));
    assert.deepEqual(plain(updates.map((message) => message.payload)), [
      [{ id: 'UC20a2HcBo8q8BgvQU-nBgnQ', handle: '@TheTVPolicePodcast' }],
      [{ id: 'UCXRt-HjEaTF6J6regWoopjw', handle: '@Russianlanguage' }]
    ]);
  }
});

test('captured watchpage postRenderer rows pass through whitelist matching and nonmatching modes today', () => {
  const capture = loadFixture();
  const input = capture.response;

  for (const settings of [
    {
      listMode: 'whitelist',
      whitelistChannels: [{ id: 'UC20a2HcBo8q8BgvQU-nBgnQ', handle: '@TheTVPolicePodcast' }]
    },
    {
      listMode: 'whitelist',
      whitelistKeywords: [keyword('not present in either captured post')]
    }
  ]) {
    const { output, messages } = runEngine(input, settings);

    assert.deepEqual(plain(output), plain(input));
    assert.equal(messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap').length, 2);
  }
});

test('supported backstagePostRenderer sibling can be filtered while captured postRenderer remains visible', () => {
  const capture = loadFixture();
  const postItem = capture.response.contents[1];
  const supportedSibling = {
    backstagePostRenderer: {
      contentText: {
        runs: [
          { text: 'Russian with Nastya legacy backstage post' }
        ]
      },
      authorText: {
        simpleText: 'Russian with Nastya'
      },
      authorEndpoint: {
        browseEndpoint: {
          browseId: 'UCXRt-HjEaTF6J6regWoopjw',
          canonicalBaseUrl: '/@Russianlanguage'
        }
      }
    }
  };
  const input = { contents: [postItem, supportedSibling] };
  const { output } = runEngine(input, {
    filterKeywords: [keyword('Nastya')]
  });

  assert.deepEqual(plain(output), { contents: [postItem] });
});

test('watchpage embedded postRenderer audit doc and runtime results cite the new proof slice', () => {
  const doc = read(docPath);
  const results = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  for (const token of [
    'Status: current-behavior audit only',
    'main-watchpage-embedded-post-renderer.json',
    'watchpage.json',
    'var ytInitialData',
    'FEwhat_to_watch',
    'browse/feed, not watch-next',
    'postRenderer',
    'FilterTube_UpdateChannelMap',
    'implementation gate remains closed'
  ]) {
    assert.ok(doc.includes(token), `missing doc token ${token}`);
  }

  assert.ok(results.includes('tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs'));
});
