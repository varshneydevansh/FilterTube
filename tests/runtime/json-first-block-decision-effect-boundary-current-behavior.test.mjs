import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function run(payload, overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const result = harness.engine.processData(payload, settings(overrides), options.dataName || 'block-decision-fixture');
  return { ...harness, result };
}

function videoRenderer(overrides = {}) {
  return {
    videoId: 'video000001',
    title: { runs: [{ text: 'Neutral Video' }] },
    shortBylineText: {
      runs: [{
        text: 'Neutral Channel',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UCneutral0000000000000000',
            canonicalBaseUrl: '/@neutral'
          }
        }
      }]
    },
    ...overrides
  };
}

function reelItemRenderer(overrides = {}) {
  return {
    videoId: 'short000001',
    headline: { simpleText: 'Shorts item' },
    ...overrides
  };
}

function channelRenderer(overrides = {}) {
  return {
    channelId: 'UCblockdecision0000000000',
    title: { simpleText: 'Blocked Keyword Channel' },
    navigationEndpoint: {
      browseEndpoint: {
        browseId: 'UCblockdecision0000000000',
        canonicalBaseUrl: '/@blockdecision'
      }
    },
    ...overrides
  };
}

function commentRenderer(overrides = {}) {
  return {
    authorText: { simpleText: 'Comment Author' },
    authorEndpoint: {
      browseEndpoint: {
        browseId: 'UCcomment000000000000000',
        canonicalBaseUrl: '/@commenter'
      }
    },
    contentText: { simpleText: 'ordinary comment text' },
    ...overrides
  };
}

function collaboratorRun() {
  return {
    text: 'Creator One and Creator Two',
    navigationEndpoint: {
      showDialogCommand: {
        panelLoadingStrategy: {
          inlineContent: {
            dialogViewModel: {
              customContent: {
                listViewModel: {
                  listItems: [
                    {
                      listItemViewModel: {
                        title: { content: 'Creator One' },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCCreatorOne000000000000',
                                  canonicalBaseUrl: '/@creatorone'
                                }
                              }
                            }
                          }
                        }
                      }
                    },
                    {
                      listItemViewModel: {
                        title: { content: 'Creator Two' },
                        rendererContext: {
                          commandContext: {
                            onTap: {
                              innertubeCommand: {
                                browseEndpoint: {
                                  browseId: 'UCCreatorTwo000000000000',
                                  canonicalBaseUrl: '/@creatortwo'
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  };
}

function collaborationVideo() {
  return videoRenderer({
    videoId: 'collab00001',
    title: { runs: [{ text: 'Joint Upload' }] },
    shortBylineText: {
      runs: [collaboratorRun()]
    }
  });
}

test('JSON-first block decision effect boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior register/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for JSON-first block decision or effect authority/);

  const source = read('js/filter_logic.js');
  assert.equal(lineCount(source), 3652);
  assert.equal(Buffer.byteLength(source), 172174);
  assert.equal(sha256('js/filter_logic.js'), '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5');
  assert.ok(doc.includes('`js/filter_logic.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_RENDERER_TRAVERSAL_MUTATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('block decision source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');

  const shouldBlockBlock = sliceBetween(filterLogic, '_shouldBlock(item, rendererType) {', '        _checkCategoryFilters(item, rules, rendererType) {');
  const collaborationCacheBlock = sliceBetween(filterLogic, '            // Send collaboration data to Main World for caching', '            // Shorts filtering');
  const shortsBlock = sliceBetween(filterLogic, '            // Shorts filtering', "            try {\n                const path = document.location?.pathname || '';");
  const routeBlock = sliceBetween(filterLogic, "            try {\n                const path = document.location?.pathname || '';", "            if (listMode === 'whitelist' && !isCommentRenderer) {");
  const whitelistBlock = sliceBetween(filterLogic, "            if (listMode === 'whitelist' && !isCommentRenderer) {", '            // Channel filtering with comprehensive matching');
  const channelBlock = sliceBetween(filterLogic, '            // Channel filtering with comprehensive matching', '            // Keyword filtering (check title AND description)');
  const keywordBlock = sliceBetween(filterLogic, '            // Keyword filtering (check title AND description)', '            // Comment filtering');
  const commentBlock = sliceBetween(filterLogic, '            // Comment filtering', '            // Content filters (duration, upload date) - applied after channel/keyword filtering');
  const contentCategoryBlock = sliceBetween(filterLogic, '            // Content filters (duration, upload date) - applied after channel/keyword filtering', '            return false;\n        }\n\n        _checkCategoryFilters');

  assert.equal(lineCount(shouldBlockBlock), 306);
  assert.equal(Buffer.byteLength(shouldBlockBlock), 15523);
  assert.equal(lineCount(collaborationCacheBlock), 17);
  assert.equal(Buffer.byteLength(collaborationCacheBlock), 786);
  assert.equal(lineCount(shortsBlock), 6);
  assert.equal(Buffer.byteLength(shortsBlock), 328);
  assert.equal(lineCount(routeBlock), 15);
  assert.equal(Buffer.byteLength(routeBlock), 460);
  assert.equal(lineCount(whitelistBlock), 110);
  assert.equal(Buffer.byteLength(whitelistBlock), 5535);
  assert.equal(lineCount(channelBlock), 17);
  assert.equal(Buffer.byteLength(channelBlock), 1090);
  assert.equal(lineCount(keywordBlock), 21);
  assert.equal(Buffer.byteLength(keywordBlock), 1123);
  assert.equal(lineCount(commentBlock), 34);
  assert.equal(Buffer.byteLength(commentBlock), 1947);
  assert.equal(lineCount(contentCategoryBlock), 13);
  assert.equal(Buffer.byteLength(contentCategoryBlock), 542);

  for (const [literal, expected] of [
    ['return true', 11],
    ['return false', 11],
    ['_logWhitelistDecision', 6],
    ['_matchesAnyChannel', 4],
    ['_regexMatches', 6],
    ['postMessage', 1],
    ['hideAllShorts', 1],
    ['filterKeywordsComments', 2],
    ['_checkContentFilters', 1],
    ['_checkCategoryFilters', 1],
    ['document.location', 2],
    ['WHITELIST_CONTAINER_RENDERERS', 1],
    ['CHANNEL_ONLY_RENDERERS', 1],
    ['CHIP_RENDERERS', 1]
  ]) {
    assert.equal(countLiteral(shouldBlockBlock, literal), expected, `${literal} count changed`);
  }

  for (const phrase of [
    'block decision/effect source/effect blocks: 9',
    'filter_logic _shouldBlock block lines: 306',
    'collaboration cache block lines: 17',
    'Shorts decision block lines: 6',
    'route exception block lines: 15',
    'whitelist decision block lines: 110',
    'runtime block decision/effect fixtures: 6'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('feed channels route exception preserves a video that empty whitelist would otherwise remove', () => {
  const payload = {
    contents: [{ videoRenderer: videoRenderer() }]
  };

  const ordinary = run(payload, { listMode: 'whitelist' });
  const routed = run(payload, { listMode: 'whitelist' }, { pathname: '/feed/channels' });

  assert.deepEqual(plain(ordinary.result), { contents: [] });
  assert.equal(routed.result.contents.length, 1);
  assert.equal(routed.result.contents[0].videoRenderer.videoId, 'video000001');
});

test('hideAllShorts blocks before the feed channels route exception can preserve the renderer', () => {
  const payload = {
    contents: [{ reelItemRenderer: reelItemRenderer() }]
  };

  const routed = run(payload, { hideAllShorts: true }, { pathname: '/feed/channels' });

  assert.deepEqual(plain(routed.result), { contents: [] });
});

test('channel-only renderers skip keyword filtering but still honor channel rules', () => {
  const payload = {
    contents: [{ channelRenderer: channelRenderer() }]
  };

  const keywordOnly = run(payload, {
    filterKeywords: [keyword('Blocked Keyword')]
  });
  const channelBlocked = run(payload, {
    filterChannels: [{ id: 'UCblockdecision0000000000' }]
  });

  assert.equal(keywordOnly.result.contents.length, 1);
  assert.equal(keywordOnly.result.contents[0].channelRenderer.channelId, 'UCblockdecision0000000000');
  assert.deepEqual(plain(channelBlocked.result), { contents: [] });
});

test('comments bypass non-comment empty whitelist fail-closed but still honor comment keyword blocking', () => {
  const neutralPayload = {
    contents: [{ commentRenderer: commentRenderer() }]
  };
  const matchingPayload = {
    contents: [{
      commentRenderer: commentRenderer({
        contentText: { simpleText: 'blocked phrase appears here' }
      })
    }]
  };

  const neutralWhitelist = run(neutralPayload, { listMode: 'whitelist' });
  const keywordBlocked = run(matchingPayload, {
    listMode: 'whitelist',
    filterKeywords: [keyword('blocked phrase')]
  });

  assert.equal(neutralWhitelist.result.contents.length, 1);
  assert.equal(neutralWhitelist.result.contents[0].commentRenderer.authorText.simpleText, 'Comment Author');
  assert.deepEqual(plain(keywordBlocked.result), { contents: [] });
});

test('collaboration cache message can be emitted while the renderer remains allowed', () => {
  const payload = {
    contents: [{ videoRenderer: collaborationVideo() }]
  };

  const allowed = run(payload, {
    filterChannels: [{ id: 'UCunmatched0000000000000' }]
  });

  assert.equal(allowed.result.contents.length, 1);
  assert.equal(allowed.result.contents[0].videoRenderer.videoId, 'collab00001');
  assert.ok(
    allowed.messages.some((message) => message && message.type === 'FilterTube_CacheCollaboratorInfo' && message.payload?.videoId === 'collab00001'),
    'collaboration cache message should be emitted before a no-block result returns'
  );
});

test('any matching collaborator can remove the renderer after the cache side effect is posted', () => {
  const payload = {
    contents: [{ videoRenderer: collaborationVideo() }]
  };

  const blocked = run(payload, {
    filterChannels: [{ id: 'UCCreatorTwo000000000000' }]
  });

  assert.deepEqual(plain(blocked.result), { contents: [] });
  assert.ok(
    blocked.messages.some((message) => message && message.type === 'FilterTube_CacheCollaboratorInfo' && message.payload?.videoId === 'collab00001'),
    'collaboration cache message should be emitted before the block decision returns'
  );
});

test('product runtime still lacks first-class block decision effect authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstBlockDecisionContract',
    'jsonFirstBlockDecisionEffectReport',
    'jsonFirstDecisionOrderReport',
    'jsonFirstDecisionSideEffectBudget',
    'jsonFirstCollaborationEffectDecision',
    'jsonFirstRouteExceptionDecision',
    'jsonFirstCommentDecisionPolicy',
    'jsonFirstChannelOnlyFieldPolicy',
    'jsonFirstDecisionShortCircuitReport',
    'jsonFirstBlockDecisionFixtureProvenance'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing runtime symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});
