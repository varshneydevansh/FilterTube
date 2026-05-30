import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md';

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

function filterRulesBlock() {
  return sliceBetween(
    read('js/filter_logic.js'),
    'const FILTER_RULES = {',
    '// ============================================================================\n    // FILTERING ENGINE'
  );
}

function ruleEntry(name) {
  const rules = filterRulesBlock();
  const startNeedle = `${name}: {`;
  const start = rules.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing rule entry ${name}`);
  const braceStart = rules.indexOf('{', start);
  assert.notEqual(braceStart, -1, `missing opening brace for ${name}`);
  let depth = 0;
  for (let i = braceStart; i < rules.length; i += 1) {
    if (rules[i] === '{') depth += 1;
    if (rules[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        return rules.slice(start, i + 1);
      }
    }
  }
  assert.fail(`missing closing brace for ${name}`);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('json runtime coverage gap register is audit-only and defines coverage classes', () => {
  const doc = read(docPath);

  for (const token of [
    'Status: audit-only proof',
    'Runtime behavior is unchanged',
    'This is not an implementation patch',
    '`direct-rule`',
    '`harvest-only`',
    '`joined-by-video-id`',
    '`documented-gap`',
    '`unsupported/direct-gap`',
    'documented JSON field',
    'is the field consumed by the current runtime path'
  ]) {
    assert.ok(doc.includes(token), `missing token ${token}`);
  }
});

test('shorts documented owner fields are not direct FILTER_RULES coverage today', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const lockupRule = ruleEntry('shortsLockupViewModel');
  const lockupV2Rule = ruleEntry('shortsLockupViewModelV2');
  const harvest = sliceBetween(
    read('js/filter_logic.js'),
    '_harvestVideoOwnerFromRenderer(renderer) {',
    '_registerVideoChannelMapping(videoId, channelId) {'
  );

  assert.match(docs, /metadata\.lockupMetadataViewModel\.image\.decoratedAvatarViewModel.*browseEndpoint\.browseId/s);
  assert.match(docs, /belowThumbnailMetadata\.avatar\.avatarViewModel\.endpoint\.innertubeCommand\.browseEndpoint\.browseId/);
  assert.match(lockupRule, /videoId/);
  assert.match(lockupRule, /accessibilityText/);
  assert.doesNotMatch(lockupRule, /channelId|channelHandle|canonicalBaseUrl|decoratedAvatarViewModel|belowThumbnailMetadata/);
  assert.doesNotMatch(lockupV2Rule, /channelId|channelHandle|canonicalBaseUrl|decoratedAvatarViewModel|belowThumbnailMetadata/);
  assert.match(harvest, /lockupMetadataViewModel\?\.image\?\.decoratedAvatarViewModel/);
  assert.match(harvest, /this\._registerVideoChannelMapping\(videoId, lockupBrowseId\)/);
});

test('reel JSON owner id handle and logo are documented but direct reel rule is name-only beyond video id', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const reelRule = ruleEntry('reelItemRenderer');

  assert.match(docs, /reelPlayerOverlayRenderer/);
  assert.match(docs, /reelChannelBarViewModel\.channelTitle\.onTap\.innertubeCommand\.browseEndpoint\.browseId/);
  assert.match(docs, /reelChannelBarViewModel\.channelTitle\.commandRuns\[0\]\.onTap\.innertubeCommand\.browseEndpoint\.canonicalBaseUrl/);
  assert.match(docs, /reelChannelBarViewModel\.avatar\.avatarViewModel\.image\.sources\[0\]\.url/);
  assert.match(reelRule, /videoId:\s*'videoId'/);
  assert.match(reelRule, /channelName/);
  assert.doesNotMatch(reelRule, /channelId|channelHandle|canonicalBaseUrl|avatarViewModel|browseId/);
});

test('showSheet collaborator paths are documented while direct filter logic scans showDialog today', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const channelBlock = sliceBetween(read('js/filter_logic.js'), '_extractChannelInfo(item, rules) {', '_matchesChannel(filterChannel, channelInfo)');

  assert.match(docs, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel\.content\.listViewModel\.listItems/);
  assert.match(docs, /listItemViewModel\.leadingAccessory\.avatarViewModel\.image\.sources\[0\]\.url/);
  assert.match(channelBlock, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.match(channelBlock, /dialogViewModel\?\.customContent\?\.listViewModel\?\.listItems/);
  assert.doesNotMatch(channelBlock, /showSheetCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.sheetViewModel/);
});

test('compact playlist and direct watch-card documented renderers remain direct-rule gaps', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const inventory = read('docs/youtube_renderer_inventory.md');
  const rules = filterRulesBlock();

  assert.match(docs, /### `compactPlaylistRenderer`/);
  assert.match(docs, /shortBylineText\.runs\[0\]\.navigationEndpoint\.browseEndpoint\.browseId/);
  assert.match(docs, /watchCardHeroVideoRenderer\.watchEndpoint\.videoId/);
  assert.match(inventory, /watchCardHeroVideoRenderer`\s*\|\s*⚠️ \*\*STILL MISSING\*\*/);

  for (const renderer of [
    'compactPlaylistRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer',
    'watchCardRichHeaderRenderer'
  ]) {
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${renderer}\\s*:`), `${renderer} should not be direct FILTER_RULES coverage yet`);
  }
});

test('mix radio rules do not model documented playlistId as primary identity today', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const radioRule = ruleEntry('radioRenderer');
  const compactRadioRule = ruleEntry('compactRadioRenderer');

  assert.match(docs, /playlistId \(always RD\.\.\., primary identity\)/);
  assert.match(docs, /Mix usually has no owner channelId in payload/);
  assert.match(radioRule, /videoId/);
  assert.match(radioRule, /description/);
  assert.doesNotMatch(radioRule, /playlistId|channelId|channelHandle/);
  assert.match(compactRadioRule, /videoId/);
  assert.match(compactRadioRule, /description/);
  assert.doesNotMatch(compactRadioRule, /playlistId|channelId|channelHandle/);
});

test('shared posts and comment metadata are documented beyond current direct runtime fields', () => {
  const docs = read('docs/json_paths_encyclopedia.md');
  const rules = filterRulesBlock();
  const commentRule = ruleEntry('commentRenderer');

  assert.match(docs, /### `sharedPostRenderer`/);
  assert.match(docs, /originalPost\.postRenderer/);
  assert.doesNotMatch(rules, /\n\s*sharedPostRenderer\s*:/);
  assert.match(commentRule, /authorEndpoint\.browseEndpoint\.browseId/);
  assert.match(commentRule, /authorText\.simpleText/);
  assert.match(commentRule, /contentText\.simpleText/);
  assert.match(docs, /authorEndpoint\.commandMetadata\.webCommandMetadata\.url/);
  assert.match(docs, /authorThumbnail\.thumbnails\[0\]\.url/);
  assert.match(docs, /commentId/);
  assert.doesNotMatch(commentRule, /commandMetadata|authorThumbnail|commentId|authorIsChannelOwner/);
});

test('json runtime coverage authority does not exist in runtime source yet', () => {
  const doc = read(docPath);
  const source = productRuntimeSource();

  assert.match(doc, /jsonRuntimeCoverageAuthority/);
  assert.match(doc, /jsonRuntimeCoverageDecision/);
  assert.match(doc, /rendererFieldCoverageClass/);
  assert.match(doc, /jsonFieldEffectAuthority/);
  assert.match(doc, /jsonDocumentedButUnsupported/);
  assert.doesNotMatch(source, /\bjsonRuntimeCoverageAuthority\b/);
  assert.doesNotMatch(source, /\bjsonRuntimeCoverageDecision\b/);
  assert.doesNotMatch(source, /\brendererFieldCoverageClass\b/);
  assert.doesNotMatch(source, /\bjsonFieldEffectAuthority\b/);
  assert.doesNotMatch(source, /\bjsonDocumentedButUnsupported\b/);
});

test('json runtime coverage gap register links the source-derived filter logic direct renderer rule addendum', () => {
  const doc = read(docPath);

  for (const token of [
    'Filter Logic Direct Renderer Rule Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs',
    '45 current top-level `FILTER_RULES` declarations',
    '44 unique renderer keys',
    'duplicate `gridVideoRenderer` source declarations',
    '7 `BASE_VIDEO_RULES` aliases',
    'unsupported direct gaps explicit',
    '`compactPlaylistRenderer`',
    '`watchCardHeroVideoRenderer`',
    '`sharedPostRenderer`',
    '`reelPlayerOverlayRenderer`',
    'filterLogicDirectRuleAuthority',
    'rendererRuleFieldPathManifest',
    'rendererRuleFixtureProvenance'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic direct rule addendum token ${token}`);
  }
});

test('json runtime coverage gap register links the source-derived filter logic rule path addendum', () => {
  const doc = read(docPath);

  for (const token of [
    'Filter Logic Rule Path Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-path-semantic-register-current-behavior.test.mjs',
    'current executable runtime path strings',
    '440 effective runtime path rows',
    '174 unique effective path literals',
    '177 effective renderer-field pairs',
    '151 text-match path rows',
    '152 channel identity path rows',
    '34 video identity path rows',
    '103 metadata predicate path rows',
    '157 effective path rows use dot numeric indexes',
    '0 use bracket numeric indexes',
    'runtime/build source does not load `docs/json_paths_encyclopedia.md`',
    'documented Shorts, reel, collaborator, compact playlist, Mix, direct watch-card, post, and comment metadata paths remain gap classes',
    'filterLogicRulePathAuthority',
    'filterLogicRulePathManifest',
    'filterLogicRulePathSyntaxContract',
    'filterLogicEffectiveRendererPathReport',
    'filterLogicDuplicatePathOverridePolicy',
    'filterLogicJsonDomParityReport',
    'filterLogicPathFixtureProvenance',
    'filterLogicJsonFirstReadinessGate',
    'filterLogicPathEffectDecision',
    'filterLogicPathNoRuleBudget'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic rule path addendum token ${token}`);
  }
});

test('json runtime coverage gap register links the source-derived filter logic rule field effect addendum', () => {
  const doc = read(docPath);

  for (const token of [
    'Filter Logic Rule Field Effect Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-rule-field-effect-semantic-register-current-behavior.test.mjs',
    'field availability from effect authority',
    '11 runtime consumer fields',
    '9 consumer methods',
    '20 method-field consumer pairs',
    '63',
    '`viewCount` is metadata/search text only',
    'no current view-count threshold predicate',
    '`videoId` is a join key rather than channel identity',
    'category filtering can schedule `scheduleVideoMetaFetch()`',
    'disabled filtering still occurs after harvest',
    'Documented paths cannot be promoted to first-class JSON filters',
    'native parity',
    'category-fetch',
    'filterLogicRuleFieldEffectAuthority',
    'filterLogicRuleFieldEffectManifest',
    'filterLogicJsonPathEffectDecision',
    'filterLogicFieldConsumerReport',
    'filterLogicViewCountPredicateAuthority',
    'filterLogicCategoryFetchBudget',
    'filterLogicWhitelistFieldEffectReport',
    'filterLogicRuleFieldFixtureProvenance',
    'filterLogicRuleFieldNoWorkBudget',
    'filterLogicJsonFirstEffectGate'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic rule field effect addendum token ${token}`);
  }
});

test('json runtime coverage gap register links the JSON-first filter readiness gate addendum', () => {
  const doc = read(docPath);

  for (const token of [
    'JSON-First Readiness Gate Addendum',
    'docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md',
    'tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs',
    'blocked promotion matrix',
    '13 blocked rows',
    'normalized path syntax',
    'renderer ownership',
    'field-effect authority',
    'route/surface scope',
    'list-mode semantics',
    'identity confidence',
    'mutation effect',
    'category/network budget',
    'no-rule/no-work budget',
    'fixture provenance',
    'DOM fallback parity',
    'native parity',
    'optimization budget',
    'dot-index runtime paths',
    'bracket-index docs paths',
    '`viewCount` as metadata/search text only',
    '`videoId` as a join key rather than channel identity',
    'category metadata fetch work through `scheduleVideoMetaFetch()`',
    'harvest before disabled filtering',
    'whitelist mode bypassing the old no-rule fast path',
    'jsonFirstFilterReadinessGate',
    'jsonFirstPathSyntaxManifest',
    'jsonFirstRendererCoverageDecision',
    'jsonFirstFieldEffectDecision',
    'jsonFirstRouteSurfaceReport',
    'jsonFirstListModeMatrix',
    'jsonFirstIdentityConfidenceReport',
    'jsonFirstMutationEffectReport',
    'jsonFirstCategoryFetchBudget',
    'jsonFirstNoWorkBudget',
    'jsonFirstFixtureProvenance',
    'jsonFirstDomParityReport',
    'jsonFirstNativeParityReport',
    'jsonFirstOptimizationBudget'
  ]) {
    assert.ok(doc.includes(token), `missing JSON-first readiness gap token ${token}`);
  }
});
