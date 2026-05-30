import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SHARED_POST_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixtureDir = 'tests/runtime/fixtures/captures';
const postFixturePath = 'tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json';

const futureAuthorityTokens = [
  'sharedPostRendererRouteFixtureContract',
  'sharedPostRendererDecisionReport',
  'sharedPostRendererSharerOriginalPolicy',
  'sharedPostRendererWhitelistPolicy',
  'sharedPostRendererSiblingFixture',
  'sharedPostRendererDomInsertionFixture',
  'sharedPostRendererNoRuleBudget',
  'sharedPostRendererJsonFirstGate'
];

const indexPaths = [
  'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
  'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function walk(relativePath, result = []) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return result;
  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(absolutePath)) {
      walk(path.join(relativePath, entry), result);
    }
    return result;
  }
  result.push(relativePath.replaceAll(path.sep, '/'));
  return result;
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

function syntheticSharedPost() {
  return {
    sharedPostRenderer: {
      postId: 'Ugsharedpostcurrentboundary',
      displayName: {
        runs: [
          { text: 'Sharing Channel' }
        ]
      },
      endpoint: {
        browseEndpoint: {
          browseId: 'UCsharingchannel000000000',
          canonicalBaseUrl: '/@sharing'
        }
      },
      originalPost: {
        postRenderer: {
          postId: 'Ugoriginalpostcurrentboundary',
          authorText: {
            runs: [
              {
                text: 'Original Channel',
                navigationEndpoint: {
                  browseEndpoint: {
                    browseId: 'UCoriginalchannel0000000',
                    canonicalBaseUrl: '/@original'
                  }
                }
              }
            ]
          },
          authorEndpoint: {
            browseEndpoint: {
              browseId: 'UCoriginalchannel0000000',
              canonicalBaseUrl: '/@original'
            }
          },
          contentText: {
            runs: [
              { text: 'Nested blocked phrase inside shared post' }
            ]
          }
        }
      }
    }
  };
}

function runSharedPost(settings = {}, input = { contents: [syntheticSharedPost()] }) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    baseSettings(settings),
    'synthetic-shared-post-renderer'
  );
  harness.flushTimers();
  return { output: plain(output), messages: plain(harness.messages) };
}

function sharedPostIds(output) {
  return (output.contents || [])
    .map((item) => item.sharedPostRenderer?.postId)
    .filter(Boolean);
}

function channelMapPayloads(messages) {
  return messages
    .filter((message) => message.type === 'FilterTube_UpdateChannelMap')
    .map((message) => message.payload[0]);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('shared post renderer doc is audit-only and source-backed', () => {
  const doc = read(docPath);
  const jsonPaths = read('docs/json_paths_encyclopedia.md');
  const rules = filterRulesBlock();

  assert.match(doc, /Status: audit-only current-behavior source and fixture-gap slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(jsonPaths, /### `sharedPostRenderer`/);
  assert.match(jsonPaths, /originalPost\.postRenderer/);
  assert.match(jsonPaths, /originalPost\.backstagePostRenderer/);
  assert.match(rules, /\n\s*backstagePostThreadRenderer\s*:/);
  assert.match(rules, /\n\s*backstagePostRenderer\s*:/);
  assert.doesNotMatch(rules, /\n\s*postRenderer\s*:/);
  assert.doesNotMatch(rules, /\n\s*sharedPostRenderer\s*:/);
});

test('committed fixture corpus has modern post proof but no real sharedPostRenderer row', () => {
  const fixtureFiles = walk(fixtureDir);
  const fixtureText = fixtureFiles.map(read).join('\n');
  const postFixture = JSON.parse(read(postFixturePath));

  assert.match(fixtureText, /postRenderer/);
  assert.ok(fixtureFiles.includes(postFixturePath));
  assert.doesNotMatch(fixtureText, /sharedPostRenderer/);
  assert.equal(postFixture.provenance.rendererType, 'postRenderer');
  assert.equal(postFixture.response.contents.length, 2);
  assert.ok(postFixture.response.contents.every((item) => item.postRenderer));
});

test('synthetic sharedPostRenderer preserves row under keyword and channel blocklist matches', () => {
  for (const settings of [
    {},
    { filterKeywords: [keyword('Nested blocked phrase')] },
    { filterChannels: [{ id: 'UCoriginalchannel0000000', handle: '@original' }] },
    { filterChannels: [{ id: 'UCsharingchannel000000000', handle: '@sharing' }] }
  ]) {
    const { output, messages } = runSharedPost(settings);

    assert.deepEqual(sharedPostIds(output), ['Ugsharedpostcurrentboundary']);
    assert.deepEqual(channelMapPayloads(messages), [
      { id: 'UCsharingchannel000000000', handle: '@sharing' },
      { id: 'UCoriginalchannel0000000', handle: '@original' }
    ]);
  }
});

test('synthetic sharedPostRenderer preserves row under whitelist match and nonmatch modes', () => {
  for (const settings of [
    {
      listMode: 'whitelist',
      whitelistChannels: [{ id: 'UCsharingchannel000000000', handle: '@sharing' }]
    },
    {
      listMode: 'whitelist',
      whitelistChannels: [{ id: 'UCoriginalchannel0000000', handle: '@original' }]
    },
    {
      listMode: 'whitelist',
      whitelistKeywords: [keyword('not present in shared post')]
    }
  ]) {
    const { output, messages } = runSharedPost(settings);

    assert.deepEqual(sharedPostIds(output), ['Ugsharedpostcurrentboundary']);
    assert.deepEqual(channelMapPayloads(messages), [
      { id: 'UCsharingchannel000000000', handle: '@sharing' },
      { id: 'UCoriginalchannel0000000', handle: '@original' }
    ]);
  }
});

test('supported legacy backstage post sibling filters while shared post remains visible', () => {
  const sharedPost = syntheticSharedPost();
  const legacySibling = {
    backstagePostRenderer: {
      contentText: {
        runs: [
          { text: 'legacy blocked phrase post' }
        ]
      },
      authorText: {
        simpleText: 'Legacy Channel'
      },
      authorEndpoint: {
        browseEndpoint: {
          browseId: 'UClegacychannel0000000000',
          canonicalBaseUrl: '/@legacy'
        }
      }
    }
  };
  const { output } = runSharedPost(
    { filterKeywords: [keyword('legacy blocked phrase')] },
    { contents: [sharedPost, legacySibling] }
  );

  assert.deepEqual(plain(output), { contents: [sharedPost] });
});

test('shared post renderer boundary indexes and future symbols stay audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const indexPath of indexPaths) {
    assert.match(read(indexPath), /Shared post renderer source-only boundary addendum/);
    assert.match(read(indexPath), /shared-post-renderer-source-only-boundary-current-behavior\.test\.mjs/);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
