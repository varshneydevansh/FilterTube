import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5']
};

const blockSpecs = {
  filterLogicCommentRendererRules: {
    file: 'js/filter_logic.js',
    start: '        commentRenderer: {',
    end: '        commentThreadRenderer: {',
    lines: 5,
    bytes: 229
  },
  filterLogicFilterChannelsNormalization: {
    file: 'js/filter_logic.js',
    start: '            // Ensure filterChannels are objects with all properties',
    end: '            if (settings.whitelistChannels && Array.isArray(settings.whitelistChannels)) {',
    lines: 17,
    bytes: 1026
  },
  filterLogicShouldBlockSetup: {
    file: 'js/filter_logic.js',
    start: '        _shouldBlock(item, rendererType) {',
    end: '            // Handle collaboration videos (channelInfo is an array)',
    lines: 45,
    bytes: 2191
  },
  filterLogicWhitelistCommentBypass: {
    file: 'js/filter_logic.js',
    start: "            if (listMode === 'whitelist' && !isCommentRenderer) {",
    end: '            // Channel filtering with comprehensive matching',
    lines: 110,
    bytes: 5535
  },
  filterLogicGlobalChannelBranch: {
    file: 'js/filter_logic.js',
    start: '            // Channel filtering with comprehensive matching',
    end: '            // Keyword filtering (check title AND description)',
    lines: 17,
    bytes: 1090
  },
  filterLogicCommentBranchAuthor: {
    file: 'js/filter_logic.js',
    start: '            // Comment filtering',
    end: '            // Content filters (duration, upload date)',
    lines: 34,
    bytes: 1947
  },
  settingsSharedSanitizeChannelEntry: {
    file: 'js/settings_shared.js',
    start: '    function sanitizeChannelEntry(entry, overrides = {}) {',
    end: '    function normalizeChannels(rawChannels) {',
    lines: 82,
    bytes: 3619
  },
  backgroundCompiledChannelObject: {
    file: 'js/background.js',
    start: "                    } else if (ch && typeof ch === 'object') {",
    end: '                    return null;',
    lines: 40,
    bytes: 2893
  }
};

const authoritySymbols = [
  'jsonCommentAuthorChannelProvenanceContract',
  'jsonCommentAuthorChannelFilterAllCommentsPolicy',
  'jsonCommentAuthorChannelGlobalBranchReport',
  'jsonCommentAuthorChannelWhitelistModeReport',
  'jsonCommentAuthorChannelCompiledMetadataReport',
  'jsonCommentAuthorChannelDecisionOrderReport',
  'jsonCommentAuthorChannelFalseHideBudget',
  'jsonCommentAuthorChannelFixtureProvenance',
  'jsonCommentAuthorChannelMetricArtifact',
  'jsonCommentAuthorChannelAuthorityGate'
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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

const blockedAuthorId = 'UCauthorblocked00000000';

function commentPayload(authorId = blockedAuthorId) {
  return {
    contents: [{
      commentRenderer: {
        commentId: 'Ugw-json-comment-author-channel-provenance',
        authorText: { simpleText: 'Blocked Author' },
        authorEndpoint: {
          browseEndpoint: {
            browseId: authorId,
            canonicalBaseUrl: '/@blockedauthor'
          }
        },
        contentText: { simpleText: 'ordinary comment' }
      }
    }]
  };
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterKeywordsComments: [],
    filterChannels: [],
    whitelistChannels: [],
    whitelistKeywords: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...overrides
  };
}

function runComment(settings = {}, authorId = blockedAuthorId) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(plain(commentPayload(authorId)), baseSettings(settings), 'json-comment-author-channel-provenance-fixture');
}

function scopedBlockedChannel(overrides = {}) {
  return {
    id: blockedAuthorId,
    name: 'Blocked Author',
    handle: '@blockedauthor',
    filterAll: false,
    filterAllComments: false,
    ...overrides
  };
}

test('JSON comment author channel provenance audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /JSON comment author channel provenance boundary source files: 3/);
  assert.match(audit, /JSON comment author channel provenance source\/effect blocks: 8/);
  assert.match(audit, /runtime JSON comment author channel provenance fixtures: 10/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('JSON comment author channel provenance source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count`);
  }

  assert.match(audit, /filter_logic comment renderer rules block lines: 5/);
  assert.match(audit, /filter_logic comment renderer rules block bytes: 229/);
  assert.match(audit, /filter_logic filterChannels normalization block lines: 17/);
  assert.match(audit, /filter_logic filterChannels normalization block bytes: 1026/);
  assert.match(audit, /filter_logic shouldBlock setup block lines: 45/);
  assert.match(audit, /filter_logic shouldBlock setup block bytes: 2191/);
  assert.match(audit, /filter_logic whitelist comment bypass block lines: 110/);
  assert.match(audit, /filter_logic whitelist comment bypass block bytes: 5535/);
  assert.match(audit, /filter_logic global channel branch block lines: 17/);
  assert.match(audit, /filter_logic global channel branch block bytes: 1090/);
  assert.match(audit, /filter_logic comment branch author block lines: 34/);
  assert.match(audit, /filter_logic comment branch author block bytes: 1947/);
  assert.match(audit, /settings_shared sanitizeChannelEntry block lines: 82/);
  assert.match(audit, /settings_shared sanitizeChannelEntry block bytes: 3619/);
  assert.match(audit, /background compiled channel object block lines: 40/);
  assert.match(audit, /background compiled channel object block bytes: 2893/);
});

test('JSON comment author channel provenance selected token counts remain pinned', () => {
  const audit = doc();
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));

  assert.equal(countLiteral(blocks.filterLogicFilterChannelsNormalization, 'filterChannels'), 5);
  assert.equal(countLiteral(blocks.filterLogicShouldBlockSetup, 'isCommentRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogicShouldBlockSetup, 'listMode'), 3);
  assert.equal(countLiteral(blocks.filterLogicWhitelistCommentBypass, 'isCommentRenderer'), 1);
  assert.equal(countLiteral(blocks.filterLogicWhitelistCommentBypass, '_matchesAnyChannel'), 2);
  assert.equal(countLiteral(blocks.filterLogicGlobalChannelBranch, 'filterChannels'), 2);
  assert.equal(countLiteral(blocks.filterLogicGlobalChannelBranch, '_matchesAnyChannel'), 1);
  assert.equal(countLiteral(blocks.filterLogicGlobalChannelBranch, 'filterAllComments'), 0);
  assert.equal(countLiteral(blocks.filterLogicCommentBranchAuthor, 'filterChannels'), 2);
  assert.equal(countLiteral(blocks.filterLogicCommentBranchAuthor, 'commentChannelInfo'), 9);
  assert.equal(countLiteral(blocks.filterLogicCommentBranchAuthor, '_matchesAnyChannel'), 1);
  assert.equal(countLiteral(blocks.filterLogicCommentBranchAuthor, 'filterAllComments'), 0);
  assert.equal(countLiteral(blocks.settingsSharedSanitizeChannelEntry, 'filterAllComments'), 8);
  assert.equal(countLiteral(blocks.backgroundCompiledChannelObject, 'filterAllComments'), 4);

  assert.match(audit, /filter_logic filterChannels normalization filterChannels tokens: 5/);
  assert.match(audit, /filter_logic shouldBlock setup isCommentRenderer tokens: 1/);
  assert.match(audit, /filter_logic shouldBlock setup listMode tokens: 3/);
  assert.match(audit, /filter_logic whitelist comment bypass isCommentRenderer tokens: 1/);
  assert.match(audit, /filter_logic whitelist comment bypass _matchesAnyChannel tokens: 2/);
  assert.match(audit, /filter_logic global channel branch filterChannels tokens: 2/);
  assert.match(audit, /filter_logic global channel branch _matchesAnyChannel tokens: 1/);
  assert.match(audit, /filter_logic global channel branch filterAllComments tokens: 0/);
  assert.match(audit, /filter_logic comment branch author filterChannels tokens: 2/);
  assert.match(audit, /filter_logic comment branch author commentChannelInfo tokens: 9/);
  assert.match(audit, /filter_logic comment branch author _matchesAnyChannel tokens: 1/);
  assert.match(audit, /filter_logic comment branch author filterAllComments tokens: 0/);
  assert.match(audit, /settings_shared sanitizeChannelEntry filterAllComments tokens: 8/);
  assert.match(audit, /background compiled channel object filterAllComments tokens: 4/);
});

test('JSON comment author channel provenance missing future symbols remain absent from product runtime', () => {
  const productSource = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.match(doc(), new RegExp(escapeRegex(symbol)));
  }
});

test('matching filterChannels row removes a comment author despite filterAllComments false', () => {
  const result = runComment({
    filterChannels: [scopedBlockedChannel()]
  });

  assert.equal(result.contents.length, 0);
});

test('nonmatching filterChannels row preserves the comment author', () => {
  const result = runComment({
    filterChannels: [scopedBlockedChannel({ id: 'UCotherauthor0000000000' })]
  });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentRenderer.authorText.simpleText, 'Blocked Author');
});

test('whitelist mode still removes comment author when matching filterChannels row remains', () => {
  const result = runComment({
    listMode: 'whitelist',
    filterChannels: [scopedBlockedChannel()],
    whitelistChannels: []
  });

  assert.equal(result.contents.length, 0);
});

test('empty whitelist without blocklist author row preserves comment renderer', () => {
  const result = runComment({
    listMode: 'whitelist',
    filterChannels: [],
    whitelistChannels: []
  });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentRenderer.contentText.simpleText, 'ordinary comment');
});

test('whitelist channel row alone does not route comment author through whitelist allow branch', () => {
  const result = runComment({
    listMode: 'whitelist',
    filterChannels: [],
    whitelistChannels: [scopedBlockedChannel({ filterAllComments: true })]
  });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentRenderer.authorEndpoint.browseEndpoint.browseId, blockedAuthorId);
});

test('source order exposes global channel branch before comment-author branch without comments-scope checks', () => {
  const shouldBlock = read('js/filter_logic.js').slice(
    read('js/filter_logic.js').indexOf('        _shouldBlock(item, rendererType) {'),
    read('js/filter_logic.js').indexOf('        _checkCategoryFilters(item, rules, rendererType) {')
  );
  const globalChannel = blockMetric(blockSpecs.filterLogicGlobalChannelBranch).block;
  const commentAuthor = blockMetric(blockSpecs.filterLogicCommentBranchAuthor).block;
  const whitelist = blockMetric(blockSpecs.filterLogicWhitelistCommentBypass).block;
  const rules = blockMetric(blockSpecs.filterLogicCommentRendererRules).block;

  assert.match(rules, /channelId: \['authorEndpoint\.browseEndpoint\.browseId'\]/);
  assert.match(rules, /channelName: \['authorText\.simpleText'\]/);
  assert.match(whitelist, /listMode === 'whitelist' && !isCommentRenderer/);
  assert.ok(shouldBlock.indexOf('// Channel filtering with comprehensive matching') < shouldBlock.indexOf('// Comment filtering'));
  assert.doesNotMatch(globalChannel, /filterAllComments/);
  assert.doesNotMatch(commentAuthor, /filterAllComments/);
  assert.match(doc(), /global channel branch runs before comment-specific filtering/);
  assert.match(doc(), /Neither branch checks filterAllComments/);
});
