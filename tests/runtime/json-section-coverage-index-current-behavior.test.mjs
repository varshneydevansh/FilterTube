import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md';

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

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function encyclopediaHeadings() {
  return read('docs/json_paths_encyclopedia.md')
    .split(/\r?\n/)
    .filter(line => /^### `/.test(line))
    .map(line => line.replace(/^### /, '').trim());
}

test('json section coverage index is audit-only and defines current coverage classes', () => {
  const doc = read(docPath);

  for (const token of [
    'Status: audit-only proof',
    'Runtime behavior is unchanged',
    'This is not an implementation patch',
    'documented JSON section != live filtering authority',
    '`direct-rule`',
    '`direct-rule-partial`',
    '`harvest-only`',
    '`joined-by-video-id`',
    '`support-model`',
    '`unsupported/direct-gap`'
  ]) {
    assert.ok(doc.includes(token), `missing token ${token}`);
  }
});

test('json section coverage index accounts for every encyclopedia section heading', () => {
  const doc = read(docPath);
  const headings = encyclopediaHeadings();

  assert.equal(headings.length, 20, 'expected the current encyclopedia section count to stay explicit');

  for (const heading of headings) {
    const codeSpans = [...heading.matchAll(/`([^`]+)`/g)].map(match => match[1]);
    assert.ok(codeSpans.length > 0, `heading should expose at least one code span: ${heading}`);
    const covered = codeSpans.every(sectionName => doc.includes(`\`${sectionName}\``));
    assert.ok(covered, `coverage index missing heading ${heading}`);
  }
});

test('json section coverage index separates direct rules from unsupported direct gaps', () => {
  const doc = read(docPath);
  const rules = filterRulesBlock();

  for (const renderer of [
    'radioRenderer',
    'compactRadioRenderer',
    'playlistPanelVideoRenderer',
    'playlistVideoRenderer',
    'shortsLockupViewModel',
    'reelItemRenderer',
    'universalWatchCardRenderer',
    'videoWithContextRenderer',
    'lockupViewModel',
    'compactVideoRenderer',
    'backstagePostRenderer',
    'commentRenderer'
  ]) {
    assert.match(rules, new RegExp(`\\n\\s*${renderer}\\s*:`), `${renderer} should be present as direct rule evidence`);
  }

  for (const renderer of [
    'compactPlaylistRenderer',
    'reelPlayerOverlayRenderer',
    'searchRefinementCardRenderer',
    'compactChannelRenderer',
    'sharedPostRenderer'
  ]) {
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${renderer}\\s*:`), `${renderer} should remain a direct gap today`);
    const rowStart = doc.indexOf(`| \`${renderer}\``);
    assert.notEqual(rowStart, -1, `missing ${renderer} row`);
    const rowEnd = doc.indexOf('\n', rowStart);
    const row = doc.slice(rowStart, rowEnd);
    assert.ok(row.includes('`unsupported/direct-gap`'), `${renderer} row should be unsupported/direct-gap`);
  }
});

test('json section coverage index pins representative partial-field boundaries to source', () => {
  const doc = read(docPath);
  const rules = filterRulesBlock();
  const filter = read('js/filter_logic.js');

  const shortsRule = sliceBetween(rules, 'shortsLockupViewModel: {', 'shortsLockupViewModelV2: {');
  assert.match(shortsRule, /videoId/);
  assert.match(shortsRule, /accessibilityText/);
  assert.doesNotMatch(shortsRule, /canonicalBaseUrl|belowThumbnailMetadata|decoratedAvatarViewModel/);
  assert.match(doc, /Documented owner id\/handle\/logo paths are not fully direct-rule coverage/);

  const radioRule = sliceBetween(rules, 'radioRenderer: {', 'compactRadioRenderer: {');
  assert.match(radioRule, /videoId/);
  assert.match(radioRule, /description/);
  assert.doesNotMatch(radioRule, /playlistId/);
  assert.match(doc, /`playlistId` is documented as primary Mix identity but is not modeled as primary runtime identity/);

  const channelBlock = sliceBetween(filter, '_extractChannelInfo(item, rules) {', '_matchesChannel(filterChannel, channelInfo)');
  assert.match(channelBlock, /showDialogCommand/);
  assert.doesNotMatch(channelBlock, /showSheetCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.sheetViewModel/);
  assert.match(doc, /Documented `showSheetCommand` collaborator roster is not consumed by the filter-logic collaborator scanner today/);
});

test('json section coverage index records support-model sections without pretending direct renderer authority', () => {
  const doc = read(docPath);
  const rules = filterRulesBlock();
  const bridge = read('js/content_bridge.js');
  const filter = read('js/filter_logic.js');

  for (const section of [
    'yt-badge-view-model',
    'yt-avatar-stack-view-model',
    'ytm-bottom-sheet-renderer'
  ]) {
    const rowStart = doc.indexOf(`| \`${section}\``);
    assert.notEqual(rowStart, -1, `missing ${section} row`);
    const rowEnd = doc.indexOf('\n', rowStart);
    const row = doc.slice(rowStart, rowEnd);
    assert.ok(row.includes('`support-model`'), `${section} row should be support-model`);
    assert.doesNotMatch(rules, new RegExp(`\\n\\s*${section.replaceAll('-', '')}\\s*:`));
  }

  assert.match(bridge, /yt-avatar-stack-view-model/);
  assert.match(filter, /avatarStackViewModel/);
});

test('json section coverage authority does not exist in runtime source yet', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of [
    'jsonSectionCoverageDecision',
    'jsonSectionCoverageIndex',
    'documentedJsonSectionAuthority',
    'jsonSectionFieldEffectAuthority'
  ]) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(`\\b${token}\\b`));
  }
});

test('json section coverage index links the source-derived filter logic direct renderer rule addendum', () => {
  const doc = read(docPath);

  for (const token of [
    'Filter Logic Direct Renderer Rule Addendum',
    'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md',
    'tests/runtime/filter-logic-direct-renderer-rule-semantic-register-current-behavior.test.mjs',
    '45 top-level `FILTER_RULES` source declarations',
    '44 unique direct renderer names',
    '7 `BASE_VIDEO_RULES` aliases',
    '38 object literal rules',
    '11 semantic rule groups',
    '`gridVideoRenderer` duplicate',
    'source-burden and JSON-path authority boundary',
    'filterLogicDirectRuleAuthority',
    'rendererRuleDuplicatePolicy',
    'rendererRuleFieldPathManifest',
    'rendererRuleFixtureProvenance'
  ]) {
    assert.ok(doc.includes(token), `missing filter logic direct rule addendum token ${token}`);
  }
});
