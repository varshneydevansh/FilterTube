import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

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

function videoRenderer(overrides = {}) {
  return {
    videoId: 'wlvideo0001',
    title: { runs: [{ text: 'Allowed Hiking Tutorial' }] },
    shortBylineText: {
      runs: [{
        text: 'Allowed Creator',
        navigationEndpoint: {
          browseEndpoint: {
            browseId: 'UCallowedcreator00000000',
            canonicalBaseUrl: '/@allowedcreator'
          }
        }
      }]
    },
    ...overrides
  };
}

function identitylessVideoRenderer(overrides = {}) {
  return {
    videoId: 'noid0000001',
    title: { runs: [{ text: 'Identity Missing' }] },
    ...overrides
  };
}

function shortsLockupViewModel(overrides = {}) {
  return {
    onTap: {
      innertubeCommand: {
        reelWatchEndpoint: {
          videoId: 'shortwl0001'
        }
      }
    },
    accessibilityText: 'Whitelisted creator short',
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

function payload(rendererType, renderer) {
  return { contents: [{ [rendererType]: renderer }] };
}

function run(data, overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const result = harness.engine.processData(data, settings(overrides), options.dataName || 'whitelist-identity-fixture');
  return { ...harness, result };
}

function runWithPageChannelMeta(data, overrides = {}, pageChannelMeta = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const filter = new harness.engine.YouTubeDataFilter(settings(overrides));
  filter.pageChannelMeta = pageChannelMeta;
  const result = filter.processData(data, options.dataName || 'whitelist-page-meta-fixture');
  return { ...harness, filter, result };
}

test('JSON-first whitelist decision identity audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: release-fix evidence register/);
  assert.match(doc, /Runtime behavior changed on 2026-05-31/);
  assert.match(doc, /not a broad\s+optimization patch/);
  assert.match(doc, /not completion proof for JSON-first whitelist decision authority/);

  const source = read('js/filter_logic.js');
  assert.equal(lineCount(source), 3652);
  assert.equal(Buffer.byteLength(source), 172174);
  assert.equal(sha256('js/filter_logic.js'), '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5');
  assert.ok(doc.includes('`js/filter_logic.js`'));

  for (const artifact of [
    'docs/audit/FILTERTUBE_JSON_FIRST_BLOCK_DECISION_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_KEYWORD_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_FEATURE_SOURCE_DEPENDENCY_REGISTER_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('whitelist decision source counts remain pinned', () => {
  const doc = read(docPath);
  const filterLogic = read('js/filter_logic.js');

  const shouldBlockBlock = sliceBetween(filterLogic, '_shouldBlock(item, rendererType) {', '        _checkCategoryFilters(item, rules, rendererType) {');
  const whitelistBlock = sliceBetween(filterLogic, "            if (listMode === 'whitelist' && !isCommentRenderer) {", '            // Channel filtering with comprehensive matching');
  const noRuleBlock = sliceBetween(whitelistBlock, '                if (!hasChannelRules && !hasKeywordRules) {', '                if (hasChannelRules) {');
  const channelLoop = sliceBetween(whitelistBlock, '                if (hasChannelRules) {', '                if (hasKeywordRules) {');
  const keywordLoop = sliceBetween(whitelistBlock, '                if (hasKeywordRules) {', '                const shouldTryCreatorPageFallback = hasChannelRules');
  const unresolvedBlock = sliceBetween(whitelistBlock, '                const shouldTryCreatorPageFallback = hasChannelRules', "                this._logWhitelistDecision('block:no_whitelist_match',");
  const noMatchTail = sliceBetween(whitelistBlock, "                this._logWhitelistDecision('block:no_whitelist_match',", '            }\n');

  assert.equal(lineCount(shouldBlockBlock), 306);
  assert.equal(Buffer.byteLength(shouldBlockBlock), 15523);
  assert.equal(lineCount(whitelistBlock), 110);
  assert.equal(Buffer.byteLength(whitelistBlock), 5535);
  assert.equal(lineCount(noRuleBlock), 9);
  assert.equal(Buffer.byteLength(noRuleBlock), 327);
  assert.equal(lineCount(channelLoop), 17);
  assert.equal(Buffer.byteLength(channelLoop), 961);
  assert.equal(lineCount(keywordLoop), 15);
  assert.equal(Buffer.byteLength(keywordLoop), 687);
  assert.equal(lineCount(unresolvedBlock), 32);
  assert.equal(Buffer.byteLength(unresolvedBlock), 1522);
  assert.equal(lineCount(noMatchTail), 8);
  assert.equal(Buffer.byteLength(noMatchTail), 288);

  for (const [literal, expected] of [
    ['_logWhitelistDecision', 6],
    ['allow:matched_channel', 1],
    ['allow:matched_keyword', 1],
    ['allow:creator_page_whitelisted', 1],
    ['block:no_whitelist_rules', 1],
    ['block:unresolved_identity', 1],
    ['block:no_whitelist_match', 1],
    ['WHITELIST_CONTAINER_RENDERERS', 1],
    ['videoPrimaryInfoRenderer', 1],
    ['videoSecondaryInfoRenderer', 1],
    ['hasStableChannelIdentity', 2],
    ['hasNameSignal', 2],
    ['isShortsLikeRenderer', 2],
    ['_matchesAnyChannel', 2],
    ['_regexMatches', 1],
    ['pageChannelMeta', 3],
    ['isCreatorPage', 2],
    ['return false', 5],
    ['return true', 3],
    ['shouldTryCreatorPageFallback', 2]
  ]) {
    assert.equal(countLiteral(whitelistBlock, literal), expected, `${literal} count changed`);
  }

  for (const phrase of [
    'whitelist decision identity boundary source files: 1',
    'filter_logic _shouldBlock block lines: 306',
    'whitelist decision branch lines: 110',
    'whitelist no-rule block lines: 9',
    'whitelist channel loop lines: 17',
    'whitelist keyword loop lines: 15',
    'whitelist unresolved/page fallback lines: 32',
    'runtime whitelist identity fixtures: 7'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('empty whitelist fail-closes a normal video while channel allow preserves it', () => {
  const data = payload('videoRenderer', videoRenderer());

  const emptyWhitelist = run(data, { listMode: 'whitelist' });
  const channelAllowed = run(data, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCallowedcreator00000000' }]
  });

  assert.deepEqual(plain(emptyWhitelist.result), { contents: [] });
  assert.equal(channelAllowed.result.contents.length, 1);
  assert.equal(channelAllowed.result.contents[0].videoRenderer.videoId, 'wlvideo0001');
});

test('whitelist keyword allow can preserve identityless JSON but nonmatching keywords still block', () => {
  const matchingData = payload('videoRenderer', identitylessVideoRenderer({
    title: { runs: [{ text: 'Tutorial Match' }] }
  }));
  const nonmatchingData = payload('videoRenderer', identitylessVideoRenderer({
    title: { runs: [{ text: 'Unrelated Clip' }] }
  }));

  const keywordAllowed = run(matchingData, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('tutorial')]
  });
  const noMatchBlocked = run(nonmatchingData, {
    listMode: 'whitelist',
    whitelistKeywords: [keyword('tutorial')]
  });

  assert.equal(keywordAllowed.result.contents.length, 1);
  assert.equal(keywordAllowed.result.contents[0].videoRenderer.videoId, 'noid0000001');
  assert.deepEqual(plain(noMatchBlocked.result), { contents: [] });
});

test('creator page fallback requires pageChannelMeta before allowing identityless JSON', () => {
  const data = payload('videoRenderer', identitylessVideoRenderer());
  const whitelist = {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCpagecreator000000000000' }]
  };

  const withoutPageMeta = run(data, whitelist, { pathname: '/@pagecreator' });
  const withPageMeta = runWithPageChannelMeta(data, whitelist, {
    id: 'UCpagecreator000000000000',
    handle: '@pagecreator',
    name: 'Page Creator'
  }, { pathname: '/@pagecreator' });

  assert.deepEqual(plain(withoutPageMeta.result), { contents: [] });
  assert.equal(withPageMeta.result.contents.length, 1);
  assert.equal(withPageMeta.result.contents[0].videoRenderer.videoId, 'noid0000001');
});

test('whitelisted channel Shorts page preserves Shorts when hideAllShorts is disabled', () => {
  const data = payload('shortsLockupViewModel', shortsLockupViewModel());
  const whitelist = {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCpagecreator000000000000' }],
    hideAllShorts: false
  };

  const withoutPageMeta = run(data, whitelist, { pathname: '/@pagecreator/shorts' });
  const withPageMeta = runWithPageChannelMeta(data, whitelist, {
    id: 'UCpagecreator000000000000',
    handle: '@pagecreator',
    name: 'Page Creator'
  }, { pathname: '/@pagecreator/shorts' });
  const hideAllShorts = runWithPageChannelMeta(data, {
    ...whitelist,
    hideAllShorts: true
  }, {
    id: 'UCpagecreator000000000000',
    handle: '@pagecreator',
    name: 'Page Creator'
  }, { pathname: '/@pagecreator/shorts' });

  assert.deepEqual(plain(withoutPageMeta.result), { contents: [] });
  assert.equal(withPageMeta.result.contents.length, 1);
  assert.equal(
    withPageMeta.result.contents[0].shortsLockupViewModel.onTap.innertubeCommand.reelWatchEndpoint.videoId,
    'shortwl0001'
  );
  assert.deepEqual(plain(hideAllShorts.result), { contents: [] });
});

test('channel-rule whitelist blocks unresolved identity when creator fallback is unavailable', () => {
  const data = payload('videoRenderer', identitylessVideoRenderer());

  const unresolved = run(data, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCmissing0000000000000' }]
  });

  assert.deepEqual(plain(unresolved.result), { contents: [] });
});

test('comments bypass empty whitelist fail-closed but still honor comment keyword blocking', () => {
  const neutralData = payload('commentRenderer', commentRenderer());
  const matchingData = payload('commentRenderer', commentRenderer({
    contentText: { simpleText: 'blocked phrase appears here' }
  }));

  const neutralWhitelist = run(neutralData, { listMode: 'whitelist' });
  const keywordBlocked = run(matchingData, {
    listMode: 'whitelist',
    filterKeywords: [keyword('blocked phrase')]
  });

  assert.equal(neutralWhitelist.result.contents.length, 1);
  assert.equal(neutralWhitelist.result.contents[0].commentRenderer.authorText.simpleText, 'Comment Author');
  assert.deepEqual(plain(keywordBlocked.result), { contents: [] });
});

test('product runtime still lacks first-class whitelist decision identity authority symbols', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const missing of [
    'jsonFirstWhitelistDecisionContract',
    'jsonFirstWhitelistIdentityDecisionReport',
    'jsonFirstWhitelistEmptyRulePolicy',
    'jsonFirstWhitelistChannelAllowReport',
    'jsonFirstWhitelistKeywordAllowReport',
    'jsonFirstWhitelistCreatorPageFallbackReport',
    'jsonFirstWhitelistUnresolvedIdentityPolicy',
    'jsonFirstWhitelistCommentPolicy',
    'jsonFirstWhitelistNoMatchReason',
    'jsonFirstWhitelistDecisionFixtureProvenance'
  ]) {
    assert.ok(doc.includes(missing), `doc should name missing runtime symbol ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from runtime source`);
  }
});
