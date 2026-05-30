import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstKeywordMatchContract',
  'jsonFirstKeywordDecisionReport',
  'jsonFirstKeywordBoundaryPolicy',
  'jsonFirstKeywordCommentScopeReport',
  'jsonFirstKeywordSourceProvenance',
  'jsonFirstKeywordDomParityReport',
  'jsonFirstKeywordWhitelistMissReport',
  'jsonFirstKeywordRegexStateReport',
  'jsonFirstChannelDerivedKeywordProvenance',
  'jsonFirstKeywordFixtureProvenance'
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

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
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
  return engine.processData(payload, settings(overrides), options.dataName || 'keyword-match-boundary-fixture');
}

function contents(...items) {
  return { contents: items };
}

function videoRenderer(overrides = {}) {
  return {
    videoRenderer: {
      videoId: overrides.videoId || 'kwVideo00001',
      title: { runs: [{ text: 'Neutral video' }] },
      shortBylineText: {
        runs: [{
          text: 'Neutral Channel',
          navigationEndpoint: {
            browseEndpoint: {
              browseId: 'UCkeyword000000000000000',
              canonicalBaseUrl: '/@keywordneutral'
            }
          }
        }]
      },
      ...overrides
    }
  };
}

function channelRenderer(overrides = {}) {
  return {
    channelRenderer: {
      channelId: 'UCkeywordchannel00000000',
      title: { simpleText: 'Blocked Keyword Channel' },
      navigationEndpoint: {
        browseEndpoint: {
          browseId: 'UCkeywordchannel00000000',
          canonicalBaseUrl: '/@blockedkeywordchannel'
        }
      },
      ...overrides
    }
  };
}

function commentRenderer(text = 'ordinary comment text', overrides = {}) {
  return {
    commentRenderer: {
      commentId: 'Ugw-keyword-boundary',
      authorText: { simpleText: 'Comment Author' },
      authorEndpoint: {
        browseEndpoint: {
          browseId: 'UCcommentkeyword0000000',
          canonicalBaseUrl: '/@commentkeyword'
        }
      },
      contentText: { simpleText: text },
      ...overrides
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const settingsShared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const domFallback = read('js/content/dom_fallback.js');

  return {
    filterLogic,
    settingsShared,
    background,
    domFallback,
    processRegex: sliceBetween(
      filterLogic,
      '            // Reconstruct RegExp objects from serialized patterns',
      '            // Ensure filterChannels are objects'
    ),
    candidateSearch: sliceBetween(
      filterLogic,
      '        _candidateSearchText(candidate) {',
      '        _regexMatches(regex, text) {'
    ),
    regexMatches: sliceBetween(
      filterLogic,
      '        _regexMatches(regex, text) {',
      '        _shouldBlock(item, rendererType) {'
    ),
    whitelistKeyword: sliceBetween(
      filterLogic,
      '                if (hasKeywordRules) {\n                    const textToSearch = this._candidateSearchText(candidate);',
      '                if (hasChannelRules && !hasStableChannelIdentity'
    ),
    blockKeyword: sliceBetween(
      filterLogic,
      '            // Keyword filtering (check title AND description)',
      '            // Comment filtering'
    ),
    commentKeyword: sliceBetween(
      filterLogic,
      '            // Comment filtering',
      '            // Content filters (duration, upload date)'
    ),
    sharedCompile: sliceBetween(
      settingsShared,
      '    function compileKeywords(keywords, predicate = null) {',
      '    function getChannelDerivedKey(channel) {'
    ),
    backgroundCompile: sliceBetween(
      background,
      '            const compileKeywordEntries = (entries, predicate = null) => {',
      '            // Helper to validate compiled keyword entries'
    ),
    backgroundComments: sliceBetween(
      background,
      '            // Comments-only keyword list (defaults to the full list if not present)',
      '            // Compile channels - preserve objects with name, id, handle, filterAll'
    ),
    domMatches: sliceBetween(
      domFallback,
      'function matchesKeyword(regex, rawText, keywordData) {',
      '// ============================================================================'
    )
  };
}

test('JSON-first keyword match boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: current-behavior proof slice/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /proof chain/);
  assert.match(doc, /keyword match boundary source files: 4/);
  assert.match(doc, /runtime keyword match fixtures: 8/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6320 | 285103 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
});

test('keyword match boundary source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic keyword regex reconstruction block', blocks.processRegex, 29, 1445],
    ['filter_logic candidate search text block', blocks.candidateSearch, 15, 663],
    ['filter_logic _regexMatches block', blocks.regexMatches, 18, 488],
    ['filter_logic whitelist keyword block', blocks.whitelistKeyword, 15, 687],
    ['filter_logic blocklist keyword block', blocks.blockKeyword, 21, 1123],
    ['filter_logic comment keyword block', blocks.commentKeyword, 34, 1947],
    ['settings_shared compileKeywords block', blocks.sharedCompile, 15, 740],
    ['background compileKeywordEntries block', blocks.backgroundCompile, 23, 1040],
    ['background comments keyword fallback block', blocks.backgroundComments, 35, 1961],
    ['DOM fallback matchesKeyword block', blocks.domMatches, 36, 1278]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, '_regexMatches'), 7);
  assert.equal(countLiteral(blocks.filterLogic, 'filterKeywordsComments'), 2);
  assert.equal(countLiteral(blocks.settingsShared, 'compileKeywords'), 4);
  assert.equal(countLiteral(blocks.background, 'compileKeywordEntries'), 4);
  assert.equal(countLiteral(blocks.domFallback, 'matchesKeyword'), 4);

  assert.match(doc, /filter_logic total _regexMatches tokens: 7/);
  assert.match(doc, /filter_logic total filterKeywordsComments tokens: 2/);
  assert.match(doc, /settings_shared compileKeywords tokens: 4/);
  assert.match(doc, /background compileKeywordEntries tokens: 4/);
  assert.match(doc, /DOM fallback matchesKeyword tokens: 4/);
});

test('substring and exact JSON keyword matching remain distinct current behavior', () => {
  const substring = run(contents(videoRenderer({ title: { simpleText: 'Debugging tips' } })), {
    filterKeywords: [keyword('bug')]
  });
  const exactPattern = keyword('(^|[^\\p{L}\\p{N}_])bug(?=$|[^\\p{L}\\p{N}_])', 'iu');
  const exactNonMatch = run(contents(videoRenderer({ title: { simpleText: 'Debugging tips' } })), {
    filterKeywords: [exactPattern]
  });
  const exactMatch = run(contents(videoRenderer({ title: { simpleText: 'A bug appears' } })), {
    filterKeywords: [exactPattern]
  });

  assert.deepEqual(plain(substring), { contents: [] });
  assert.deepEqual(plain(exactNonMatch), contents(videoRenderer({ title: { simpleText: 'Debugging tips' } })));
  assert.deepEqual(plain(exactMatch), { contents: [] });
});

test('global keyword regex state is reset across repeated JSON siblings', () => {
  const result = run(contents(
    videoRenderer({ videoId: 'kwGlobal0001', title: { simpleText: 'Alpha one' } }),
    videoRenderer({ videoId: 'kwGlobal0002', title: { simpleText: 'Alpha two' } })
  ), {
    filterKeywords: [keyword('alpha', 'gi')]
  });

  assert.deepEqual(plain(result), { contents: [] });
});

test('candidate search text can match title description tags metadata and channel display text', () => {
  const cases = [
    videoRenderer({ title: { simpleText: 'Needle title' } }),
    videoRenderer({ descriptionSnippet: { simpleText: 'Needle description' } }),
    videoRenderer({ videoDetails: { keywords: ['Needle tag'] } }),
    videoRenderer({ metadataText: { simpleText: 'Needle metadata' } }),
    videoRenderer({
      shortBylineText: {
        runs: [{
          text: 'Needle channel',
          navigationEndpoint: {
            browseEndpoint: {
              browseId: 'UCneedlechannel0000000',
              canonicalBaseUrl: '/@needlechannel'
            }
          }
        }]
      }
    })
  ];

  for (const item of cases) {
    const result = run(contents(item), {
      filterKeywords: [keyword('Needle')]
    });
    assert.deepEqual(plain(result), { contents: [] });
  }
});

test('comment keyword handling differs for serialized direct and global keyword paths', () => {
  const input = contents(commentRenderer('spider appears in comment body'));
  const serializedCommentOnly = run(input, {
    filterKeywordsComments: [keyword('spider')]
  });
  const directCommentRegex = run(input, {
    filterKeywordsComments: [/spider/i]
  });
  const explicitEmptyCommentListWithGlobal = run(input, {
    filterKeywords: [keyword('spider')],
    filterKeywordsComments: []
  });

  assert.deepEqual(plain(serializedCommentOnly), plain(input));
  assert.deepEqual(plain(directCommentRegex), { contents: [] });
  assert.deepEqual(plain(explicitEmptyCommentListWithGlobal), { contents: [] });
});

test('whitelist keyword match allows while whitelist keyword miss fails closed', () => {
  const matching = contents(videoRenderer({ title: { simpleText: 'Please allow this lesson' } }));
  const nonMatching = contents(videoRenderer({ title: { simpleText: 'Ordinary lesson' } }));

  assert.deepEqual(plain(run(matching, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('allow')]
  })), plain(matching));

  assert.deepEqual(plain(run(nonMatching, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('allow')]
  })), { contents: [] });
});

test('channel-only renderers skip JSON keyword matching', () => {
  const input = contents(channelRenderer());
  const result = run(input, {
    filterKeywords: [keyword('Blocked Keyword')]
  });

  assert.deepEqual(plain(result), plain(input));
});

test('keyword match boundary doc records current risks and missing authority symbols', () => {
  const doc = read(docPath);

  assert.match(doc, /serialized `filterKeywordsComments` is ignored by the engine/);
  assert.match(doc, /global keywords can still hide comments through candidate metadata/);
  assert.match(doc, /whitelist keyword matches allow content/);
  assert.match(doc, /channel-only renderers skip keyword matching/);
  assert.match(doc, /DOM fallback/);
  assert.match(doc, /Reliability/);
  assert.match(doc, /False-hide\/leak/);
  assert.match(doc, /Performance/);
  assert.match(doc, /Code burden/);

  for (const symbol of authoritySymbols) {
    assert.match(doc, new RegExp(symbol));
    assert.doesNotMatch(productRuntimeSource(), new RegExp(`\\b${symbol}\\b`));
  }
});
