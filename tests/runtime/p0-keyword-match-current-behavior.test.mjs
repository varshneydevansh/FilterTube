import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const p0DocPath = 'docs/audit/FILTERTUBE_P0_KEYWORD_MATCH_CURRENT_BEHAVIOR_2026-05-19.md';
const auditDocPath = 'docs/audit/FILTERTUBE_KEYWORD_MATCH_AUTHORITY_AUDIT_2026-05-18.md';
const readinessPath = 'docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md';

const fixtures = [
  'keyword_non_exact_substring_policy_is_explicit',
  'keyword_exact_unicode_boundary_matches_json_and_dom',
  'keyword_dom_normalized_fallback_requires_both_boundaries',
  'keyword_comment_serialized_rules_are_reconstructed',
  'keyword_global_rules_do_not_affect_comments_unless_enabled',
  'keyword_channel_derived_metadata_round_trips',
  'keyword_channel_derived_comments_policy_round_trips',
  'keyword_kids_to_main_sync_preserves_source_and_action',
  'keyword_whitelist_keyword_miss_reports_fail_closed_reason',
  'keyword_import_legacy_compiled_exactness_round_trips'
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

function runEngine(payload, settings) {
  const { engine } = loadFilterTubeEngine();
  return engine.processData(payload, settings, 'p0-keyword-match-fixture');
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function videoRenderer(title) {
  return {
    contents: [{
      videoRenderer: {
        videoId: 'kwfixture001',
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

function commentRenderer(text) {
  return {
    contents: [{
      commentRenderer: {
        commentId: 'Ugw-keyword-fixture',
        authorText: { simpleText: 'Calm Commenter' },
        authorEndpoint: {
          browseEndpoint: {
            browseId: 'UC4444444444444444444444',
            canonicalBaseUrl: '/@calmcommenter'
          }
        },
        contentText: { runs: [{ text }] }
      }
    }]
  };
}

function productSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('P0 keyword match audit documents fixture family and current blocked verdict', () => {
  const doc = read(p0DocPath);
  const audit = read(auditDocPath);
  const readiness = read(readinessPath);

  assert.match(doc, /P0 keyword match slice is not green/);
  assert.match(doc, /Runtime behavior remains unchanged/);
  assert.match(doc, /Implementation gate remains closed/);
  assert.match(doc, /keywordMatchAuthority/);
  assert.match(audit, /The main finding is split matcher authority/);

  for (const fixture of fixtures) {
    assert.ok(doc.includes(fixture), `missing P0 doc fixture: ${fixture}`);
    assert.ok(readiness.includes(fixture), `missing readiness fixture: ${fixture}`);
  }
});

test('keyword_non_exact_substring_policy_is_explicit is not centrally reported today', () => {
  const input = videoRenderer('Debugging tips for families');
  const output = runEngine(input, baseSettings({
    filterKeywords: [keyword('bug')]
  }));
  const settingsShared = read('js/settings_shared.js');
  const compileBlock = sliceBetween(settingsShared, 'function compileKeywords(keywords, predicate = null) {', 'function getChannelDerivedKey(channel) {');

  assert.deepEqual(plain(output), { contents: [] });
  assert.match(compileBlock, /pattern: entry\.exact \? exactPattern : escaped/);
  assert.doesNotMatch(productSource(), /\bkeywordMatchAuthority\b/);
});

test('keyword_exact_unicode_boundary_matches_json_and_dom is only partially unified today', () => {
  const exactBug = keyword('(^|[^\\p{L}\\p{N}_])bug(?=$|[^\\p{L}\\p{N}_])', 'iu');
  const nonMatch = videoRenderer('Debugging tips for families');
  const match = videoRenderer('A bug in the garden');
  const domFallback = read('js/content/dom_fallback.js');
  const domMatchBlock = sliceBetween(domFallback, 'function matchesKeyword(regex, rawText, keywordData) {', '// ============================================================================');

  assert.deepEqual(plain(runEngine(nonMatch, baseSettings({ filterKeywords: [exactBug] }))), plain(nonMatch));
  assert.deepEqual(plain(runEngine(match, baseSettings({ filterKeywords: [exactBug] }))), { contents: [] });
  assert.match(domMatchBlock, /normalizeTextForMatching\(rawText\)/);
  assert.match(domMatchBlock, /extractPlainKeyword\(keywordData\)/);
  assert.doesNotMatch(domMatchBlock, /keywordMatchAuthority/);
});

test('keyword_dom_normalized_fallback_requires_both_boundaries is not satisfied today', () => {
  const domFallback = read('js/content/dom_fallback.js');
  const block = sliceBetween(domFallback, 'function matchesKeyword(regex, rawText, keywordData) {', '// ============================================================================');

  assert.match(block, /const hasLeftBoundary = !beforeChar \|\| !isAlphanumeric\(beforeChar\)/);
  assert.match(block, /const hasRightBoundary = !afterChar \|\| !isAlphanumeric\(afterChar\)/);
  assert.match(block, /if \(hasLeftBoundary \|\| hasRightBoundary\) \{\s*return true/);
  assert.doesNotMatch(block, /hasLeftBoundary && hasRightBoundary/);
});

test('keyword_comment_serialized_rules_are_reconstructed is not satisfied today', () => {
  const input = commentRenderer('spider appears in comment body');
  const output = runEngine(input, baseSettings({
    filterKeywordsComments: [keyword('spider')]
  }));
  const filterLogic = read('js/filter_logic.js');
  const processSettings = sliceBetween(filterLogic, '// Reconstruct RegExp objects from serialized patterns', '// Ensure filterChannels are objects');

  assert.deepEqual(plain(output), plain(input));
  assert.match(processSettings, /settings\.filterKeywords/);
  assert.match(processSettings, /settings\.whitelistKeywords/);
  assert.doesNotMatch(processSettings, /filterKeywordsComments/);
});

test('keyword_global_rules_do_not_affect_comments_unless_enabled is only implicit today', () => {
  const input = commentRenderer('spider appears in comment body');
  const globalOutput = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')]
  }));
  const explicitEmptyCommentOutput = runEngine(input, baseSettings({
    filterKeywords: [keyword('spider')],
    filterKeywordsComments: []
  }));
  const filterLogic = read('js/filter_logic.js');
  const commentBlock = sliceBetween(filterLogic, '// Comment filtering', '// Content filters (duration, upload date)');

  assert.deepEqual(plain(globalOutput), { contents: [] });
  assert.deepEqual(plain(explicitEmptyCommentOutput), { contents: [] });
  assert.match(commentBlock, /const commentKeywords = Array\.isArray\(this\.settings\.filterKeywordsComments\)/);
  assert.match(commentBlock, /: this\.settings\.filterKeywords/);
  assert.doesNotMatch(commentBlock, /globalCommentPolicy|keywordMatchAuthority/);
});

test('keyword_channel_derived_metadata_round_trips is not satisfied by background persistence today', () => {
  const shared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const sharedBlock = sliceBetween(shared, 'function syncFilterAllKeywords(keywords, channels) {', 'function buildCompiledSettings({');
  const backgroundBlock = sliceBetween(background, '// Merge channel-based keywords with existing keywords', 'compiledSettings.videoMetaMap = items.videoMetaMap || {};');

  assert.match(sharedBlock, /source: 'channel'/);
  assert.match(sharedBlock, /channelRef: key/);
  assert.match(sharedBlock, /exact: true/);
  assert.match(backgroundBlock, /source: 'filterAll_channel'/);
  assert.match(backgroundBlock, /exact: false/);
  assert.doesNotMatch(backgroundBlock, /channelRef/);
});

test('keyword_channel_derived_comments_policy_round_trips is not satisfied by background persistence today', () => {
  const shared = read('js/settings_shared.js');
  const background = read('js/background.js');
  const sharedBlock = sliceBetween(shared, 'function syncFilterAllKeywords(keywords, channels) {', 'function buildCompiledSettings({');
  const backgroundBlock = sliceBetween(background, '// Merge channel-based keywords with existing keywords', 'compiledSettings.videoMetaMap = items.videoMetaMap || {};');

  assert.match(sharedBlock, /comments: \(typeof channel\.filterAllComments === 'boolean'\) \? channel\.filterAllComments : true/);
  assert.match(sharedBlock, /comments: \(typeof nextKeyword\?\.comments === 'boolean'\) \? nextKeyword\.comments : entry\.comments/);
  assert.match(backgroundBlock, /comments: false/);
  assert.doesNotMatch(backgroundBlock, /filterAllComments/);
});

test('keyword_kids_to_main_sync_preserves_source_and_action is not centrally reported today', () => {
  const stateManager = read('js/state_manager.js');
  const recompute = sliceBetween(stateManager, 'function recomputeKeywords() {', '// ============================================================================\n    // CHANNEL MANAGEMENT');

  assert.match(recompute, /state\.syncKidsToMain && kidsMode === mainMode/);
  assert.match(recompute, /channelsForKeywords = \[\.\.\.\(Array\.isArray\(state\.channels\)/);
  assert.match(recompute, /SettingsAPI\.syncFilterAllKeywords\(state\.userKeywords, channelsForKeywords\)/);
  assert.doesNotMatch(recompute, /sourceSurface|sourceAction|kidsDerived|keywordMatchAuthority/);
});

test('keyword_whitelist_keyword_miss_reports_fail_closed_reason is not structured today', () => {
  const input = videoRenderer('No matching whitelist keyword here');
  const output = runEngine(input, baseSettings({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('minecraft')]
  }));
  const filterLogic = read('js/filter_logic.js');
  const whitelistBlock = sliceBetween(filterLogic, "if (listMode === 'whitelist' && !isCommentRenderer) {", '// Channel filtering with comprehensive matching');

  assert.deepEqual(plain(output), { contents: [] });
  assert.match(whitelistBlock, /block:no_whitelist_match/);
  assert.match(whitelistBlock, /allow:matched_keyword/);
  assert.doesNotMatch(whitelistBlock, /keywordMissReport|failClosedReason|keywordMatchAuthority/);
});

test('keyword_import_legacy_compiled_exactness_round_trips is source-local but lacks authority report today', () => {
  const shared = read('js/settings_shared.js');
  const normalize = sliceBetween(shared, 'function normalizeKeywords(rawKeywords, compiledKeywords) {', 'function sanitizeChannelEntry(entry, overrides = {})');
  const profiles = sliceBetween(shared, 'function buildProfilesV4FromLegacyState(storage, mainChannels, mainKeywords) {', 'function sanitizeKeywordEntry(entry, overrides = {})');

  assert.match(normalize, /const unicodeExactPrefix = '\(\^\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)'/);
  assert.match(normalize, /const unicodeExactSuffix = '\(\?=\$\|\[\^\\\\p\{L\}\\\\p\{N\}_\]\)'/);
  assert.match(normalize, /exact: true/);
  assert.match(normalize, /sanitizeKeywordEntry\(\{ word: raw, exact: parsed\.exact \}/);
  assert.match(profiles, /keywords: safeArray\(mainKeywords\)/);
  assert.doesNotMatch(normalize + profiles, /keywordMatchAuthority|legacyCompiledSource|compiledFlags/);
});
