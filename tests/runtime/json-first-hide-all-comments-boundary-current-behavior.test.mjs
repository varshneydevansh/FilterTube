import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideAllCommentsContract',
  'jsonFirstHideAllCommentsDecisionReport',
  'jsonFirstCommentsRendererInventoryPolicy',
  'jsonFirstCommentsJsonDomParityReport',
  'jsonFirstCommentsViewModelLeakReport',
  'jsonFirstCommentsStructuralWrapperPolicy',
  'jsonFirstCommentsContinuationResponseContract',
  'jsonFirstCommentsNoWorkBudget',
  'jsonFirstCommentsMarkerRestoreProof',
  'jsonFirstCommentsFixtureProvenance',
  'jsonFirstCommentsMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
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
  const { engine } = loadFilterTubeEngine(options);
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-all-comments-boundary-fixture'));
}

function contents(...items) {
  return { contents: items };
}

function commentRenderer(text = 'neutral comment text', author = {}) {
  return {
    commentRenderer: {
      authorText: { simpleText: author.name || 'Neutral Author' },
      authorEndpoint: {
        browseEndpoint: {
          browseId: author.id || 'UC_NEUTRAL_COMMENT',
          canonicalBaseUrl: author.handle || '/@neutralcommenter'
        }
      },
      contentText: { simpleText: text }
    }
  };
}

function commentThreadRenderer(text = 'neutral thread comment') {
  return {
    commentThreadRenderer: {
      comment: commentRenderer(text).commentRenderer
    }
  };
}

function commentSection() {
  return {
    itemSectionRenderer: {
      sectionIdentifier: 'comment-item-section',
      contents: [
        commentThreadRenderer('nested comment section text')
      ]
    }
  };
}

function commentViewModel(text = 'modern comment text') {
  return {
    commentViewModel: {
      authorText: { simpleText: 'Modern Author' },
      contentText: { simpleText: text }
    }
  };
}

function videoRenderer(text = 'normal video title') {
  return {
    videoRenderer: {
      videoId: 'VIDEO000001',
      title: { simpleText: text },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    filterCommentRules: sliceBetween(
      filterLogic,
      '        // Comment threads',
      '    };\n\n    // ============================================================================\n    // FILTERING ENGINE'
    ),
    filterCandidateCommentFlag: sliceBetween(
      filterLogic,
      '            const isComment = rendererType.includes',
      '            const isPlaylist = ('
    ),
    filterWhitelistCommentBypass: sliceBetween(
      filterLogic,
      "            if (listMode === 'whitelist' && !isCommentRenderer) {",
      '            // Channel filtering with comprehensive matching'
    ),
    filterCommentDecision: sliceBetween(
      filterLogic,
      '            // Comment filtering',
      '            // Content filters'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    seedEngineSettingsLog: sliceBetween(
      seed,
      '        seedDebugLog(`Settings available:`, {',
      '\n        });\n\n        // Use the comprehensive filtering engine'
    ),
    seedBasicCommentHide: sliceBetween(
      seed,
      '            // Basic comment hiding',
      '            \n            if (modified)'
    ),
    seedCommentContinuation: sliceBetween(
      seed,
      '                    // Special handling for comment requests when hideAllComments is enabled',
      '                    // Normal processing for non-comment or non-hideAllComments requests'
    ),
    domCssComments: sliceBetween(
      domFallback,
      '    if (settings.hideAllComments) {',
      '\n\n    const listMode'
    ),
    domCollectMobileComments: sliceBetween(
      domFallback,
      'function collectMobileCommentEntryCards()',
      '\n\nfunction handleHomeFeedFallback'
    ),
    domCommentsGlobal: sliceBetween(
      domFallback,
      'function handleCommentsFallback(settings) {',
      '    // 2. Ensure containers are visible when not globally hidden'
    ),
    domCommentsRestoreAndInputs: sliceBetween(
      domFallback,
      '    // 2. Ensure containers are visible when not globally hidden',
      '    // 3. Per-thread filtering'
    ),
    domCommentsThreadFiltering: sliceBetween(
      domFallback,
      '    // 3. Per-thread filtering',
      '    // 4. Reply/comment-renderer filtering'
    ),
    domCommentsRendererFiltering: sliceBetween(
      domFallback,
      '    // 4. Reply/comment-renderer filtering',
      '    // 5. Modern YouTube comments'
    ),
    domCommentsViewModelFiltering: sliceBetween(
      domFallback,
      '    // 5. Modern YouTube comments use ytd-comment-view-model',
      '}\n\nfunction handleGuideSubscriptionsFallback'
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    bgStorageReadKeys: sliceBetween(
      background,
      "        browserAPI.storage.local.get([\n            'enabled',",
      '        ], (items) => {'
    ),
    bgCommentsKeywordFallback: sliceBetween(
      background,
      '            // Comments-only keyword list (defaults to the full list if not present)',
      '            // Compile channels'
    ),
    bgV4CommentsCompile: sliceBetween(
      background,
      "            const hideCommentsFromV4 = boolFromV4('hideComments', items.hideAllComments || false);",
      '            // Persist any migrations we calculated'
    ),
    bgBooleanComments: sliceBetween(
      background,
      '            compiledSettings.hideAllComments = hideCommentsFromV4;',
      '            compiledSettings.hideAllShorts ='
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    )
  };
}

test('JSON-first hideAllComments boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, comments behavior/);
  assert.match(doc, /hideAllComments boundary source files: 4/);
  assert.match(doc, /runtime hideAllComments fixtures: 7/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6803 | 306710 | \`${sha256('js/background.js')}\` |`));
});

test('hideAllComments source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic comment rules block', blocks.filterCommentRules, 9, 380],
    ['filter_logic candidate comment flag block', blocks.filterCandidateCommentFlag, 1, 100],
    ['filter_logic whitelist comment bypass block', blocks.filterWhitelistCommentBypass, 110, 5535],
    ['filter_logic comment decision block', blocks.filterCommentDecision, 34, 1947],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['seed engine settings log block', blocks.seedEngineSettingsLog, 7, 394],
    ['seed basic comment hide block', blocks.seedBasicCommentHide, 28, 1574],
    ['seed comment continuation block', blocks.seedCommentContinuation, 37, 2269],
    ['DOM fallback comments CSS block', blocks.domCssComments, 16, 671],
    ['DOM fallback collect mobile comments block', blocks.domCollectMobileComments, 30, 1386],
    ['DOM fallback comments global block', blocks.domCommentsGlobal, 42, 1934],
    ['DOM fallback comments restore and inputs block', blocks.domCommentsRestoreAndInputs, 17, 781],
    ['DOM fallback comments thread filtering block', blocks.domCommentsThreadFiltering, 76, 3674],
    ['DOM fallback comments renderer filtering block', blocks.domCommentsRendererFiltering, 77, 4223],
    ['DOM fallback comments view-model filtering block', blocks.domCommentsViewModelFiltering, 99, 5312],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background comments keyword fallback block', blocks.bgCommentsKeywordFallback, 35, 1961],
    ['background V4 comments compile block', blocks.bgV4CommentsCompile, 23, 1586],
    ['background boolean comments block', blocks.bgBooleanComments, 3, 182],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideAllComments'), 3);
  assert.equal(countLiteral(blocks.filterLogic, 'filterComments'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'filterKeywordsComments'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'commentRenderer'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogic, 'commentViewModel'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideAllComments'), 9);
  assert.equal(countLiteral(blocks.seed, 'filterKeywordsComments'), 1);
  assert.equal(countLiteral(blocks.seed, 'commentRenderer'), 1);
  assert.equal(countLiteral(blocks.seed, 'commentThreadRenderer'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'hideAllComments'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'hideComments'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'filterComments'), 1);
  assert.equal(countLiteral(blocks.domFallback, 'filterKeywordsComments'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'commentRenderer'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'commentViewModel'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-mobile-comments-card'), 5);
  assert.equal(countLiteral(blocks.background, 'hideAllComments'), 9);
  assert.equal(countLiteral(blocks.background, 'hideComments'), 15);
  assert.equal(countLiteral(blocks.background, 'filterComments'), 12);
  assert.equal(countLiteral(blocks.background, 'filterKeywordsComments'), 11);

  assert.match(doc, /filter_logic total hideAllComments tokens: 3/);
  assert.match(doc, /filter_logic total filterComments tokens: 1/);
  assert.match(doc, /filter_logic total filterKeywordsComments tokens: 2/);
  assert.match(doc, /filter_logic total commentRenderer tokens: 2/);
  assert.match(doc, /filter_logic total commentThreadRenderer tokens: 1/);
  assert.match(doc, /filter_logic total commentViewModel tokens: 0/);
  assert.match(doc, /seed total hideAllComments tokens: 9/);
  assert.match(doc, /seed total filterKeywordsComments tokens: 1/);
  assert.match(doc, /seed total commentRenderer tokens: 1/);
  assert.match(doc, /seed total commentThreadRenderer tokens: 1/);
  assert.match(doc, /DOM fallback total hideAllComments tokens: 3/);
  assert.match(doc, /DOM fallback total hideComments tokens: 1/);
  assert.match(doc, /DOM fallback total filterComments tokens: 1/);
  assert.match(doc, /DOM fallback total filterKeywordsComments tokens: 3/);
  assert.match(doc, /DOM fallback total commentRenderer tokens: 3/);
  assert.match(doc, /DOM fallback total commentViewModel tokens: 2/);
  assert.match(doc, /DOM fallback total mobile-comments-card marker tokens: 5/);
  assert.match(doc, /background total hideAllComments tokens: 9/);
  assert.match(doc, /background total hideComments tokens: 15/);
  assert.match(doc, /background total filterComments tokens: 12/);
  assert.match(doc, /background total filterKeywordsComments tokens: 11/);
});

test('hideAllComments removes classic direct JSON comment renderers', () => {
  const config = { hideAllComments: true };

  assert.deepEqual(run(contents(commentRenderer('plain comment')), config), { contents: [] });
  assert.deepEqual(run(contents(commentThreadRenderer('plain thread comment')), config), { contents: [] });
});

test('JSON comment section wrapper remains after nested comments are removed', () => {
  const config = { hideAllComments: true };

  assert.deepEqual(run(contents(commentSection()), config), {
    contents: [
      {
        itemSectionRenderer: {
          sectionIdentifier: 'comment-item-section',
          contents: []
        }
      }
    ]
  });
});

test('hideAllComments does not hide ordinary videoRenderer rows', () => {
  const config = { hideAllComments: true };
  const ordinaryVideo = contents(videoRenderer('normal video title'));

  assert.deepEqual(run(ordinaryVideo, config), plain(ordinaryVideo));
});

test('direct commentViewModel currently leaks through JSON comment filtering', () => {
  const viewModel = contents(commentViewModel('blockphrase in modern comment'));

  assert.deepEqual(run(viewModel, { hideAllComments: true }), plain(viewModel));
  assert.deepEqual(run(viewModel, { filterKeywordsComments: [/blockphrase/i] }), plain(viewModel));
});

test('filterKeywordsComments applies to comments without applying to ordinary videos', () => {
  const config = { filterKeywordsComments: [/blockphrase/i] };
  const matchingComment = contents(commentRenderer('please blockphrase here'));
  const matchingVideo = contents(videoRenderer('please blockphrase here'));

  assert.deepEqual(run(matchingComment, config), { contents: [] });
  assert.deepEqual(run(matchingVideo, config), plain(matchingVideo));
});

test('comment author channel rules remove matching commentRenderer rows', () => {
  const config = { filterChannels: ['UC_BLOCKED_COMMENT'] };
  const matchingComment = contents(commentRenderer('neutral text', {
    id: 'UC_BLOCKED_COMMENT',
    name: 'Blocked Commenter'
  }));

  assert.deepEqual(run(matchingComment, config), { contents: [] });
});

test('source proof pins comment settings aliases DOM parity and missing authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.seedActiveJsonRules, /hasList\(settings\.filterKeywordsComments\)/);
  assert.match(blocks.seedActiveJsonRules, /settings\.hideAllComments === true/);
  assert.match(blocks.seedCommentContinuation, /urlStr\.includes\('\/youtubei\/v1\/next'\)/);
  assert.match(blocks.seedCommentContinuation, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(blocks.filterCommentRules, /commentRenderer/);
  assert.match(blocks.filterCommentRules, /commentThreadRenderer/);
  assert.doesNotMatch(blocks.filterCommentRules, /commentViewModel/);
  assert.match(blocks.filterCommentDecision, /this\.settings\.hideAllComments/);
  assert.match(blocks.filterCommentDecision, /this\.settings\.filterKeywordsComments/);
  assert.match(blocks.filterCommentDecision, /Blocking comment by author/);
  assert.match(blocks.filterWhitelistCommentBypass, /listMode === 'whitelist' && !isCommentRenderer/);
  assert.match(blocks.domCssComments, /ytm-comments-entry-point-renderer/);
  assert.match(blocks.domCollectMobileComments, /data-filtertube-mobile-comments-card/);
  assert.match(blocks.domCommentsViewModelFiltering, /ytd-comment-view-model/);
  assert.match(blocks.domActiveBooleanKeys, /'hideAllComments'/);
  assert.match(blocks.domActiveBooleanKeys, /'hideComments'/);
  assert.match(blocks.domActiveBooleanKeys, /'filterComments'/);
  assert.match(blocks.bgCommentsKeywordFallback, /filterKeywordsComments/);
  assert.match(blocks.bgV4CommentsCompile, /boolFromV4\('hideComments', items\.hideAllComments \|\| false\)/);
  assert.match(blocks.bgBooleanComments, /compiledSettings\.filterComments = false/);
  assert.match(blocks.bgRefreshKeys, /'filterKeywordsComments'/);
  assert.match(blocks.bgRefreshKeys, /'hideComments'/);
  assert.match(blocks.bgRefreshKeys, /'filterComments'/);
  assert.match(doc, /direct `commentViewModel` rows currently remain/);
  assert.match(doc, /empty structural wrapper/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
