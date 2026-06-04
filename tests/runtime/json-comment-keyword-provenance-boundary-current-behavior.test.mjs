import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const sourceFingerprints = {
  'js/filter_logic.js': [3652, 172174, '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5'],
  'js/settings_shared.js': [1181, 57535, '9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c'],
  'js/background.js': [6773, 305166, 'b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5']
};

const blockSpecs = {
  sharedCompileKeywords: {
    file: 'js/settings_shared.js',
    start: '    function compileKeywords(keywords, predicate = null) {',
    end: '    function getChannelDerivedKey(channel) {',
    lines: 15,
    bytes: 740
  },
  sharedSyncFilterAllKeywords: {
    file: 'js/settings_shared.js',
    start: '    function syncFilterAllKeywords(keywords, channels) {',
    end: '    function buildCompiledSettings({',
    lines: 72,
    bytes: 2971
  },
  sharedBuildCompiledComments: {
    file: 'js/settings_shared.js',
    start: '            filterKeywords: compileKeywords(sanitizedKeywords),',
    end: '            filterChannels: sanitizedChannels,',
    lines: 2,
    bytes: 170
  },
  filterLogicProcessSettingsRegex: {
    file: 'js/filter_logic.js',
    start: '            // Reconstruct RegExp objects from serialized patterns',
    end: '            // Ensure filterChannels are objects',
    lines: 29,
    bytes: 1445
  },
  filterLogicCandidateMetadataSearch: {
    file: 'js/filter_logic.js',
    start: '        _buildCandidate(item, rendererType, wrapperRendererType = null, options = {}) {',
    end: '        _regexMatches(regex, text) {',
    lines: 218,
    bytes: 10724
  },
  filterLogicGlobalCommentKeywordBranch: {
    file: 'js/filter_logic.js',
    start: '            // Keyword filtering (check title AND description)',
    end: '            // Content filters (duration, upload date)',
    lines: 55,
    bytes: 3070
  },
  backgroundV4CommentCompile: {
    file: 'js/background.js',
    start: '            if (v4KeywordEntries) {',
    end: '            // Persist any migrations we calculated',
    lines: 7,
    bytes: 370
  },
  backgroundLegacyCommentsFallback: {
    file: 'js/background.js',
    start: '            // Comments-only keyword list (defaults to the full list if not present)',
    end: '            // Compile channels - preserve objects with name, id, handle, filterAll',
    lines: 35,
    bytes: 1961
  }
};

const authoritySymbols = [
  'jsonCommentKeywordProvenanceContract',
  'jsonCommentKeywordGlobalPrecedenceReport',
  'jsonCommentKeywordChannelScopePolicy',
  'jsonCommentKeywordCompiledMetadataReport',
  'jsonCommentKeywordSerializedReconstructionReport',
  'jsonCommentKeywordDecisionOrderReport',
  'jsonCommentKeywordFalseHideBudget',
  'jsonCommentKeywordFixtureProvenance',
  'jsonCommentKeywordMetricArtifact',
  'jsonCommentKeywordAuthorityGate'
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

function loadSettingsSharedRuntime() {
  const context = {
    console,
    Date,
    JSON,
    Promise,
    window: null,
    globalThis: null,
    chrome: {
      storage: {
        local: {
          get(_keys, callback) { callback({}); },
          set(_payload, callback) { callback?.(); }
        }
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.runInContext(read('js/settings_shared.js'), vm.createContext(context), {
    filename: path.join(repoRoot, 'js/settings_shared.js')
  });
  return context.FilterTubeSettings;
}

function buildCompiledSettings({ filterAllComments = false } = {}) {
  const Settings = loadSettingsSharedRuntime();
  return Settings.buildCompiledSettings({
    keywords: [],
    channels: [{
      id: 'UCmuted0000000000000000',
      name: 'Muted Channel',
      handle: '@muted',
      filterAll: true,
      filterAllComments,
      addedAt: 1
    }],
    enabled: true,
    hideShorts: false,
    hideComments: false,
    contentFilters: {},
    categoryFilters: {}
  });
}

function commentPayload(text = 'I mention Muted Channel here') {
  return {
    contents: [{
      commentRenderer: {
        commentId: 'Ugw-json-comment-keyword-provenance',
        authorText: { simpleText: 'Other Author' },
        authorEndpoint: {
          browseEndpoint: {
            browseId: 'UCother0000000000000000',
            canonicalBaseUrl: '/@other'
          }
        },
        contentText: { simpleText: text }
      }
    }]
  };
}

function processComment(settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(plain(commentPayload()), {
    enabled: true,
    listMode: 'blocklist',
    filterChannels: [],
    whitelistChannels: [],
    whitelistKeywords: [],
    hideAllComments: false,
    hideAllShorts: false,
    contentFilters: {},
    categoryFilters: {},
    ...settings
  }, 'json-comment-keyword-provenance-fixture');
}

test('JSON comment keyword provenance audit is audit-only and source pinned', () => {
  const audit = doc();

  assert.match(audit, /Status: audit-only current-behavior proof slice/);
  assert.match(audit, /Runtime behavior is unchanged/);
  assert.match(audit, /not an implementation patch/);
  assert.match(audit, /JSON comment keyword provenance boundary source files: 3/);
  assert.match(audit, /JSON comment keyword provenance source\/effect blocks: 8/);
  assert.match(audit, /runtime JSON comment keyword provenance fixtures: 10/);

  for (const [file, [lines, bytes, hash]] of Object.entries(sourceFingerprints)) {
    const source = read(file);
    assert.equal(lineCount(source), lines, `${file} line count changed`);
    assert.equal(Buffer.byteLength(source), bytes, `${file} byte count changed`);
    assert.equal(sha256(file), hash, `${file} hash changed`);
    assert.match(audit, new RegExp(`\\| \`${escapeRegex(file)}\` \\| ${lines} \\| ${bytes} \\| \`${hash}\` \\|`));
  }
});

test('JSON comment keyword provenance source and effect blocks remain pinned', () => {
  const audit = doc();

  for (const [name, spec] of Object.entries(blockSpecs)) {
    const metric = blockMetric(spec);
    assert.equal(metric.lines, spec.lines, `${name} line count`);
    assert.equal(metric.bytes, spec.bytes, `${name} byte count`);
  }

  assert.match(audit, /settings_shared compileKeywords block lines: 15/);
  assert.match(audit, /settings_shared compileKeywords block bytes: 740/);
  assert.match(audit, /settings_shared syncFilterAllKeywords block lines: 72/);
  assert.match(audit, /settings_shared syncFilterAllKeywords block bytes: 2971/);
  assert.match(audit, /settings_shared buildCompiledSettings comments block lines: 2/);
  assert.match(audit, /settings_shared buildCompiledSettings comments block bytes: 170/);
  assert.match(audit, /filter_logic processSettings regex block lines: 29/);
  assert.match(audit, /filter_logic processSettings regex block bytes: 1445/);
  assert.match(audit, /filter_logic candidate metadata\/search block lines: 218/);
  assert.match(audit, /filter_logic candidate metadata\/search block bytes: 10724/);
  assert.match(audit, /filter_logic global\/comment keyword branch block lines: 55/);
  assert.match(audit, /filter_logic global\/comment keyword branch block bytes: 3070/);
  assert.match(audit, /background V4 comment compile block lines: 7/);
  assert.match(audit, /background V4 comment compile block bytes: 370/);
  assert.match(audit, /background legacy comments fallback block lines: 35/);
  assert.match(audit, /background legacy comments fallback block bytes: 1961/);
});

test('JSON comment keyword provenance selected token counts remain pinned', () => {
  const audit = doc();
  const blocks = Object.fromEntries(Object.entries(blockSpecs).map(([name, spec]) => [name, blockMetric(spec).block]));

  assert.equal(countLiteral(blocks.sharedCompileKeywords, 'source'), 2);
  assert.equal(countLiteral(blocks.sharedCompileKeywords, 'channelRef'), 2);
  assert.equal(countLiteral(blocks.sharedSyncFilterAllKeywords, 'filterAllComments'), 2);
  assert.equal(countLiteral(blocks.sharedSyncFilterAllKeywords, 'channelRef'), 7);
  assert.equal(countLiteral(blocks.sharedBuildCompiledComments, 'filterKeywordsComments'), 1);
  assert.equal(countLiteral(blocks.filterLogicProcessSettingsRegex, 'RegExp'), 5);
  assert.equal(countLiteral(blocks.filterLogicCandidateMetadataSearch, 'commentText'), 1);
  assert.equal(countLiteral(blocks.filterLogicCandidateMetadataSearch, 'metadataText'), 5);
  assert.equal(countLiteral(blocks.filterLogicGlobalCommentKeywordBranch, 'filterKeywords'), 5);
  assert.equal(countLiteral(blocks.filterLogicGlobalCommentKeywordBranch, 'filterKeywordsComments'), 2);
  assert.equal(countLiteral(blocks.filterLogicGlobalCommentKeywordBranch, 'commentText'), 8);
  assert.equal(countLiteral(blocks.filterLogicGlobalCommentKeywordBranch, '_regexMatches'), 5);
  assert.equal(countLiteral(blocks.backgroundV4CommentCompile, 'filterKeywordsComments'), 1);
  assert.equal(countLiteral(blocks.backgroundLegacyCommentsFallback, 'filterKeywordsComments'), 5);

  assert.match(audit, /settings_shared compileKeywords source tokens: 2/);
  assert.match(audit, /settings_shared compileKeywords channelRef tokens: 2/);
  assert.match(audit, /settings_shared syncFilterAllKeywords filterAllComments tokens: 2/);
  assert.match(audit, /settings_shared syncFilterAllKeywords channelRef tokens: 7/);
  assert.match(audit, /settings_shared buildCompiledSettings filterKeywordsComments tokens: 1/);
  assert.match(audit, /filter_logic processSettings RegExp tokens: 5/);
  assert.match(audit, /filter_logic candidate metadata\/search commentText tokens: 1/);
  assert.match(audit, /filter_logic candidate metadata\/search metadataText tokens: 5/);
  assert.match(audit, /filter_logic global\/comment keyword branch filterKeywords tokens: 5/);
  assert.match(audit, /filter_logic global\/comment keyword branch filterKeywordsComments tokens: 2/);
  assert.match(audit, /filter_logic global\/comment keyword branch commentText tokens: 8/);
  assert.match(audit, /filter_logic global\/comment keyword branch _regexMatches tokens: 5/);
  assert.match(audit, /background V4 comment compile filterKeywordsComments tokens: 1/);
  assert.match(audit, /background legacy comments fallback filterKeywordsComments tokens: 5/);
});

test('JSON comment keyword provenance missing future symbols remain absent from product runtime', () => {
  const productSource = productRuntimeSource();
  for (const symbol of authoritySymbols) {
    assert.equal(productSource.includes(symbol), false, `${symbol} unexpectedly exists in product runtime source`);
    assert.match(doc(), new RegExp(escapeRegex(symbol)));
  }
});

test('settings_shared keeps comments-false channel-derived keywords global while excluding comments-only list', () => {
  const compiled = buildCompiledSettings({ filterAllComments: false });

  assert.equal(compiled.filterKeywords.length, 1);
  assert.equal(compiled.filterKeywordsComments.length, 0);
  assert.deepEqual(Object.keys(compiled.filterKeywords[0]).sort(), ['flags', 'pattern']);
  assert.match(compiled.filterKeywords[0].pattern, /Muted Channel/);
  assert.equal(Object.hasOwn(compiled.filterKeywords[0], 'source'), false);
  assert.equal(Object.hasOwn(compiled.filterKeywords[0], 'channelRef'), false);
  assert.equal(Object.hasOwn(compiled.filterKeywords[0], 'comments'), false);
});

test('settings_shared comments-true channel-derived comments keyword still has no row provenance', () => {
  const compiled = buildCompiledSettings({ filterAllComments: true });

  assert.equal(compiled.filterKeywords.length, 1);
  assert.equal(compiled.filterKeywordsComments.length, 1);
  assert.deepEqual(Object.keys(compiled.filterKeywordsComments[0]).sort(), ['flags', 'pattern']);
  assert.match(compiled.filterKeywordsComments[0].pattern, /Muted Channel/);
  assert.equal(Object.hasOwn(compiled.filterKeywordsComments[0], 'source'), false);
  assert.equal(Object.hasOwn(compiled.filterKeywordsComments[0], 'channelRef'), false);
  assert.equal(Object.hasOwn(compiled.filterKeywordsComments[0], 'comments'), false);
});

test('JSON engine removes a comment through global channel-derived keyword despite filterAllComments false', () => {
  const compiled = buildCompiledSettings({ filterAllComments: false });
  const result = processComment(compiled);

  assert.equal(result.contents.length, 0);
});

test('same JSON comment survives when global keyword list is absent and comments-only list is empty', () => {
  const compiled = buildCompiledSettings({ filterAllComments: false });
  const result = processComment({
    ...compiled,
    filterKeywords: [],
    filterKeywordsComments: []
  });

  assert.equal(result.contents.length, 1);
  assert.equal(result.contents[0].commentRenderer.contentText.simpleText, 'I mention Muted Channel here');
});

test('serialized comments-only pattern is ignored while direct RegExp comment keyword blocks', () => {
  const serialized = processComment({
    filterKeywords: [],
    filterKeywordsComments: [{ pattern: 'Muted Channel', flags: 'i' }]
  });
  const direct = processComment({
    filterKeywords: [],
    filterKeywordsComments: [/Muted Channel/i]
  });

  assert.equal(serialized.contents.length, 1);
  assert.equal(direct.contents.length, 0);
});

test('source order and candidate metadata expose global-before-comment provenance gap', () => {
  const candidateBlock = blockMetric(blockSpecs.filterLogicCandidateMetadataSearch).block;
  const keywordBlock = blockMetric(blockSpecs.filterLogicGlobalCommentKeywordBranch).block;

  assert.match(candidateBlock, /\.\.\.this\._collectTextFromPaths\(item, rules\.commentText\)/);
  assert.match(candidateBlock, /candidate\.metadataText/);
  assert.ok(keywordBlock.indexOf('this.settings.filterKeywords.length > 0') < keywordBlock.indexOf('const commentKeywords = Array.isArray(this.settings.filterKeywordsComments)'));
  assert.ok(keywordBlock.indexOf('this._candidateSearchText(candidate)') < keywordBlock.indexOf('const commentText = rules.commentText'));
  assert.match(doc(), /global keyword branch runs before the comment-specific\s+branch/);
  assert.match(doc(), /A comment mentioning a Filter All channel can be removed by the global keyword branch even when that channel row has `filterAllComments: false`/);
  assert.match(doc(), /JSON comment keyword provenance\s+gates/);
});
