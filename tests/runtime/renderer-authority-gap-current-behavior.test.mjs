import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const rendererSourceReadinessDocs = [
  'docs/audit/FILTERTUBE_RENDERER_AUTHORITY_GAP_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md',
  'docs/audit/FILTERTUBE_FUNCTION_COVERAGE_2026-05-17.md',
  'docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md',
  'docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_RAW_CORPUS_CENSUS_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_NOTIFICATION_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_SHARED_POST_RENDERER_SOURCE_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_MAIN_POST_COMMUNITY_DOM_INSERTION_FIXTURE_GAP_CURRENT_BEHAVIOR_2026-05-24.md',
  'docs/audit/FILTERTUBE_SOURCE_BOUNDARY_AUDIT_2026-05-18.md',
  'docs/audit/FILTERTUBE_SOURCE_SURFACE_INVENTORY_2026-05-17.md'
];

function source(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
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
    source('js/filter_logic.js'),
    'const FILTER_RULES = {',
    '// ============================================================================\n    // FILTERING ENGINE'
  );
}

test('renderer and source coverage docs carry the method proof gap blocker', () => {
  const methodGap = source(methodGapPath);

  for (const phrase of [
    'tracked JS/JSX/MJS files: 69',
    'repo-wide lexical callables: 5797',
    'files with complete per-callable semantic proof: 0',
    'lexical callables requiring semantic proof before behavior changes: 5797',
    'optimization work and a first-class JSON\nfilter model remain blocked',
    'runtime behavior changed: no'
  ]) {
    assert.ok(methodGap.includes(phrase), `method gap source missing ${phrase}`);
  }

  for (const docPath of rendererSourceReadinessDocs) {
    const doc = source(docPath);
    assert.ok(doc.includes(methodGapPath), `${docPath} must cite method semantic gap source`);
    assert.ok(doc.includes('method semantic proof gap lexical callables covered: 5797'), `${docPath} must pin callable gap count`);
    assert.ok(doc.includes('affected callable semantic proof: NO-GO'), `${docPath} must keep behavior-change blocker`);
    assert.ok(doc.includes('runtime behavior changed: no'), `${docPath} must preserve audit-only boundary`);
  }
});

test('renderer authority gap audit documents the current high-risk leak and false-hide families', () => {
  const doc = source('docs/audit/FILTERTUBE_RENDERER_AUTHORITY_GAP_AUDIT_2026-05-18.md');

  for (const phrase of [
    'compactPlaylistRenderer',
    'showSheetCommand',
    'Direct watch-card parts',
    'Shorts owner identity',
    '`lockupViewModel` metadata-row owner',
    'Community/search refinement renderers',
    '`shelfRenderer` and `richShelfRenderer`',
    '`radioRenderer` / `compactRadioRenderer` avatar stacks',
    'Duplicate `gridVideoRenderer` rule',
    'No renderer should move from gap -> rule without'
  ]) {
    assert.match(doc, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('compactPlaylistRenderer is unwrapped from richItemRenderer but still has no direct FILTER_RULES entry', () => {
  const text = source('js/filter_logic.js');
  const rules = filterRulesBlock();
  const unwrap = sliceBetween(
    text,
    '_unwrapRendererForFiltering(item, rendererType) {',
    '_paths(value) {'
  );

  assert.match(unwrap, /'compactPlaylistRenderer'/);
  assert.doesNotMatch(rules, /\n\s*compactPlaylistRenderer\s*:/);

  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');
  const extracted = source('tests/runtime/extracted-capture-current-behavior.test.mjs');
  assert.match(fixtures, /compactPlaylistRenderer currently has no direct JSON rule/);
  assert.match(fixtures, /richItemRenderer wrapping compactPlaylistRenderer currently unwraps to missing direct rule/);
  assert.match(extracted, /extracted YTM compactPlaylistRenderer currently passes through keyword and channel rules/);
});

test('collaboration extraction currently handles showDialogCommand but not showSheetCommand in filter logic', () => {
  const text = source('js/filter_logic.js');
  const docs = source('docs/json_paths_encyclopedia.md');
  const block = sliceBetween(
    text,
    '_extractChannelInfo(item, rules) {',
    '_matchesChannel(filterChannel, channelInfo)'
  );
  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');

  assert.match(docs, /showSheetCommand\.panelLoadingStrategy\.inlineContent\.sheetViewModel/);
  assert.match(block, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.match(block, /dialogViewModel\?\.customContent\?\.listViewModel\?\.listItems/);
  assert.doesNotMatch(block, /showSheetCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.sheetViewModel\?\.content\?\.listViewModel\?\.listItems/);
  assert.match(fixtures, /videoWithContextRenderer currently ignores showSheetCommand collaborator roster/);
  assert.match(fixtures, /videoWithContextRenderer currently blocks showDialogCommand collaborator roster/);
});

test('direct watch-card renderer gaps are distinct from the covered universal watch-card wrapper', () => {
  const rules = filterRulesBlock();
  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');
  const inventory = source('docs/youtube_renderer_inventory.md');

  assert.match(rules, /\n\s*universalWatchCardRenderer\s*:/);
  assert.match(rules, /\n\s*watchCardCompactVideoRenderer:\s*BASE_VIDEO_RULES/);
  assert.doesNotMatch(rules, /\n\s*watchCardRichHeaderRenderer\s*:/);
  assert.doesNotMatch(rules, /\n\s*watchCardHeroVideoRenderer\s*:/);
  assert.doesNotMatch(rules, /\n\s*watchCardRHPanelVideoRenderer\s*:/);
  assert.match(inventory, /watchCardRHPanelVideoRenderer[\s\S]*not parsed/);
  assert.match(fixtures, /direct watchCardRichHeaderRenderer currently has no direct JSON rule/);
  assert.match(fixtures, /direct watchCardHeroVideoRenderer currently has no direct JSON rule/);
  assert.match(fixtures, /direct watchCardRHPanelVideoRenderer currently has no direct JSON rule/);
});

test('shorts, reel, and lockup owner identity gaps are fixture-backed against documented paths', () => {
  const rules = filterRulesBlock();
  const docs = source('docs/json_paths_encyclopedia.md');
  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');

  const shortsRule = sliceBetween(rules, 'shortsLockupViewModel: {', 'shortsLockupViewModelV2: {');
  const reelRule = sliceBetween(rules, 'reelItemRenderer: {', 'shortsLockupViewModel: {');
  const lockupRule = sliceBetween(rules, 'lockupViewModel: {', '// ------------------------------------------------------------------\n        // Watch page');

  assert.match(shortsRule, /title: \['accessibilityText'\]/);
  assert.doesNotMatch(shortsRule, /belowThumbnailMetadata/);
  assert.match(reelRule, /channelTitleText\.simpleText/);
  assert.doesNotMatch(reelRule, /browseEndpoint\.browseId/);
  assert.match(lockupRule, /decoratedAvatarViewModel/);
  assert.doesNotMatch(lockupRule, /metadataParts\.0\.text\.commandRuns/);

  assert.match(docs, /belowThumbnailMetadata/);
  assert.match(docs, /reelItemRenderer/);
  assert.match(docs, /lockupViewModel/);
  assert.match(fixtures, /shortsLockupViewModel currently ignores belowThumbnailMetadata owner identity/);
  assert.match(fixtures, /reelItemRenderer currently blocks by title keyword but has no UC or handle extraction path/);
  assert.match(fixtures, /lockupViewModel currently ignores metadata row command-run channel id/);
});

test('broad container and avatar-stack false-hide risks are pinned to source and fixtures', () => {
  const text = source('js/filter_logic.js');
  const rules = filterRulesBlock();
  const candidateBlock = sliceBetween(
    text,
    '_extractChannelInfo(item, rules) {',
    '// PRIORITY: Check for collaboration video'
  );
  const removeBlock = sliceBetween(
    text,
    '// Handle objects - check if this object should be filtered',
    '// Recursively process all properties'
  );
  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');
  const docs = source('docs/json_paths_encyclopedia.md');

  assert.match(rules, /shelfRenderer:\s*\{\s*title: \['header\.shelfHeaderRenderer\.title\.simpleText'\]/);
  assert.match(rules, /richShelfRenderer:\s*\{\s*title: \['title\.simpleText', 'title\.runs'\]/);
  assert.match(removeBlock, /return null; \/\/ Remove this entire object/);
  assert.match(candidateBlock, /avatarStackViewModel/);
  assert.match(candidateBlock, /return avatarStackCollaborators/);
  assert.match(docs, /radioRenderer` and `compactRadioRenderer` are Mix\/Radio playlist renderers, not collaborator renderers/);
  assert.match(fixtures, /shelfRenderer currently hides the whole shelf/);
  assert.match(fixtures, /richShelfRenderer currently hides the whole rich shelf/);
  assert.match(fixtures, /radioRenderer avatar stacks currently can be treated as collaboration identity/);
});

test('gridVideoRenderer duplicate rule and missing community/search renderer rules remain current gaps', () => {
  const rules = filterRulesBlock();
  const fixtures = source('tests/runtime/filter-engine-current-behavior.test.mjs');
  const contract = source('docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md');

  assert.equal((rules.match(/\n\s*gridVideoRenderer\s*:/g) || []).length, 2);
  for (const renderer of [
    'postRenderer',
    'sharedPostRenderer',
    'compactChannelRenderer',
    'searchRefinementCardRenderer',
    'horizontalCardListRenderer',
    'channelMetadataRenderer',
    'expandableMetadataRenderer'
  ]) {
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${renderer}\\s*:`));
    assert.match(contract, new RegExp(`${renderer}.*pass-current-gap`, 's'));
  }

  assert.match(fixtures, /duplicate gridVideoRenderer rule currently ignores descriptionSnippet text/);
  assert.match(fixtures, /postRenderer currently has no direct JSON rule/);
  assert.match(fixtures, /sharedPostRenderer currently has no direct JSON rule/);
  assert.match(fixtures, /searchRefinementCardRenderer currently has no direct JSON rule/);
});
