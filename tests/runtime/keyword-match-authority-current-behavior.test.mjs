import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle: ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle: ${endNeedle}`);
  return text.slice(start, end);
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

function videoRenderer(title) {
  return {
    contents: [{
      videoRenderer: {
        videoId: 'abcdefghijk',
        title: { runs: [{ text: title }] },
        shortBylineText: {
          runs: [{
            text: 'Calm Channel',
            navigationEndpoint: {
              browseEndpoint: {
                browseId: 'UC1234567890123456789012',
                canonicalBaseUrl: '/@calmchannel'
              }
            }
          }]
        }
      }
    }]
  };
}

function runEngine(payload, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, 'keyword-authority-fixture');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test('keyword match authority audit documents matcher drift and future gates', () => {
  const doc = read('docs/audit/FILTERTUBE_KEYWORD_MATCH_AUTHORITY_AUDIT_2026-05-18.md');

  for (const phrase of [
    'Keyword Match Authority',
    'Current Keyword Flow',
    'Exact Versus Substring Matching',
    'DOM Fallback Boundary Drift',
    'Comment Keyword Authority',
    'Channel-Derived Keyword Drift',
    'Whitelist Keyword Authority',
    'keywordMatchAuthority',
    'keyword_non_exact_substring_policy_is_explicit',
    'keyword_dom_normalized_fallback_requires_both_boundaries'
  ]) {
    assert.ok(doc.includes(phrase), `missing audit phrase: ${phrase}`);
  }
});

test('shared settings and background compile exact keywords with the same Unicode boundary shape', () => {
  const shared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const sharedCompile = sliceBetween(shared, 'function compileKeywords(keywords, predicate = null) {', 'function getChannelDerivedKey(channel) {');
  const backgroundCompile = sliceBetween(background, 'const escapeRegex = (value) =>', '// Helper to validate compiled keyword entries');

  assert.match(sharedCompile, /const exactPattern = `\(\^\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)\$\{escaped\}\(\?=\$\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)`/);
  assert.match(sharedCompile, /flags: entry\.exact \? 'iu' : 'i'/);
  assert.match(backgroundCompile, /const exactKeywordPattern = \(escaped\) => `\(\^\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)\$\{escaped\}\(\?=\$\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)`/);
  assert.match(backgroundCompile, /flags: exact \? 'iu' : 'i'/);
});

test('JSON engine currently treats non-exact keywords as substring regexes', () => {
  const input = videoRenderer('Debugging tips for families');
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('bug')]
  }));

  assert.deepEqual(plain(output), { contents: [] });
});

test('JSON engine currently honors exact Unicode boundary pattern when caller compiled it', () => {
  const exactBug = keyword('(^|[^\\p{L}\\p{N}_])bug(?=$|[^\\p{L}\\p{N}_])', 'iu');
  const nonMatch = videoRenderer('Debugging tips for families');
  const match = videoRenderer('A bug in the garden');

  assert.deepEqual(plain(runEngine(nonMatch, baseSettings({ filterKeywords: [exactBug] }))), plain(nonMatch));
  assert.deepEqual(plain(runEngine(match, baseSettings({ filterKeywords: [exactBug] }))), { contents: [] });
});

test('DOM fallback normalized keyword fallback currently uses either-side boundary logic', () => {
  const text = read('js/content/dom_fallback.js');
  const block = sliceBetween(
    text,
    'function matchesKeyword(regex, rawText, keywordData) {',
    '// ============================================================================'
  );

  assert.match(block, /const normalized = normalizeTextForMatching\(rawText\)/);
  assert.match(block, /const plainKeyword = extractPlainKeyword\(keywordData\)/);
  assert.match(block, /normalizedText\.includes\(normalizedKeyword\)/);
  assert.match(block, /const hasLeftBoundary = !beforeChar \|\| !isAlphanumeric\(beforeChar\)/);
  assert.match(block, /const hasRightBoundary = !afterChar \|\| !isAlphanumeric\(afterChar\)/);
  assert.match(block, /if \(hasLeftBoundary \|\| hasRightBoundary\) \{\s*return true/);
  assert.doesNotMatch(block, /hasLeftBoundary && hasRightBoundary/);
});

test('filter logic reconstructs serialized block and allow keywords but not serialized comment keywords', () => {
  const text = read('js/filter_logic.js');
  const processSettings = sliceBetween(
    text,
    '// Reconstruct RegExp objects from serialized patterns',
    '// Ensure filterChannels are objects'
  );
  const commentBlock = sliceBetween(
    text,
    '// Comment filtering',
    '// Content filters (duration, upload date)'
  );

  assert.match(processSettings, /settings\.filterKeywords/);
  assert.match(processSettings, /settings\.whitelistKeywords/);
  assert.doesNotMatch(processSettings, /filterKeywordsComments/);
  assert.match(commentBlock, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
  assert.match(commentBlock, /: this\.settings\.filterKeywords/);
});

test('shared settings channel-derived keywords preserve source channel exactness and comments metadata', () => {
  const text = read('js/settings_shared.js');
  const block = sliceBetween(
    text,
    'function syncFilterAllKeywords(keywords, channels) {',
    'function buildCompiledSettings({'
  );

  assert.match(block, /source: 'channel'/);
  assert.match(block, /channelRef: key/);
  assert.match(block, /exact: true/);
  assert.match(block, /comments: \(typeof channel\.filterAllComments === 'boolean'\) \? channel\.filterAllComments : true/);
  assert.match(block, /entry\.source !== 'channel'/);
  assert.match(block, /activeChannelKeys\.delete\(entry\.channelRef\)/);
});

test('background channel-derived keyword persistence currently changes metadata shape', () => {
  const text = read('js/background.js');
  const block = sliceBetween(
    text,
    '// Merge channel-based keywords with existing keywords',
    'compiledSettings.videoMetaMap = items.videoMetaMap || {};'
  );

  assert.match(block, /additionalKeywordsFromChannels/);
  assert.match(block, /keywordKey = isWhitelistMode \? 'whitelistKeywords' : 'blockedKeywords'/);
  assert.match(block, /exact: false/);
  assert.match(block, /comments: false/);
  assert.match(block, /source: 'filterAll_channel'/);
  assert.doesNotMatch(block, /source: 'channel'/);
  assert.doesNotMatch(block, /channelRef/);
});

test('keyword authority is still split across whitelist blocklist comments and channel-derived settings', () => {
  const filter = read('js/filter_logic.js');
  const settings = read('js/settings_shared.js');
  const background = read('js/background.js');
  const state = read('js/state_manager.js');

  assert.match(filter, /for \(const keywordRegex of whitelistKeywords\)/);
  assert.match(filter, /for \(const keywordRegex of this\.settings\.filterKeywords\)/);
  assert.match(filter, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
  assert.match(settings, /filterKeywordsComments: compileKeywords\(sanitizedKeywords, entry => entry\.comments === true\)/);
  assert.match(background, /compiledSettings\.filterKeywordsComments = compileKeywordEntries\(v4KeywordEntries/);
  assert.match(state, /function recomputeKeywords\(\)/);
  assert.doesNotMatch(`${filter}\n${settings}\n${background}\n${state}`, /\bkeywordMatchAuthority\b/);
});
