import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_FILTER_LOGIC_DIRECT_RENDERER_RULE_SEMANTIC_REGISTER_2026-05-21.md';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function doc() {
  return read(docPath);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter(file => !file.startsWith('tests/'))
    .filter(file => !file.startsWith('website/'))
    .filter(file => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineForIndex(starts, index) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (starts[mid] <= index) low = mid + 1;
    else high = mid - 1;
  }
  return high + 1;
}

function findFilterRulesBounds(source) {
  const startNeedle = 'const FILTER_RULES = {';
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, 'missing FILTER_RULES start');
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = null;
  for (let i = braceStart; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return { braceStart, end: i };
    }
  }
  assert.fail('missing FILTER_RULES end');
}

function groupForRule(entry) {
  if (entry.valueShape === 'BASE_VIDEO_RULES') return 'baseVideoSharedRules';
  if (['videoWithContextRenderer', 'lockupViewModel'].includes(entry.name)) return 'channelContextAndLockupRules';
  if ([
    'videoPrimaryInfoRenderer',
    'videoSecondaryInfoRenderer',
    'universalWatchCardRenderer',
    'secondarySearchContainerRenderer',
    'channelVideoPlayerRenderer'
  ].includes(entry.name)) return 'watchAndScaffoldingRules';
  if ([
    'richItemRenderer',
    'shelfRenderer',
    'relatedChipCloudRenderer',
    'chipCloudRenderer',
    'chipCloudChipRenderer',
    'richGridMedia',
    'richShelfRenderer'
  ].includes(entry.name)) return 'structuralContainerAndChipRules';
  if (
    (entry.name === 'gridVideoRenderer' && entry.line === 604) ||
    ['playlistRenderer', 'gridPlaylistRenderer'].includes(entry.name)
  ) return 'playlistAndGridSpecificRules';
  if (['radioRenderer', 'compactRadioRenderer', 'ticketShelfRenderer', 'podcastRenderer'].includes(entry.name)) return 'mixRadioPodcastAndTicketRules';
  if (['channelRenderer', 'gridChannelRenderer'].includes(entry.name)) return 'channelSurfaceRules';
  if (['backstagePostThreadRenderer', 'backstagePostRenderer', 'backstagePollRenderer', 'backstageQuizRenderer'].includes(entry.name)) return 'backstagePostRules';
  if ([
    'notificationRenderer',
    'commentVideoThumbnailHeaderRenderer',
    'thumbnailOverlayPlaybackStatusRenderer',
    'thumbnailOverlayTimeStatusRenderer',
    'thumbnailOverlayResumePlaybackRenderer',
    'thumbnailOverlayNowPlayingRenderer'
  ].includes(entry.name)) return 'notificationAndOverlayRules';
  if (['reelItemRenderer', 'shortsLockupViewModel', 'shortsLockupViewModelV2'].includes(entry.name)) return 'shortsAndReelRules';
  if (['commentRenderer', 'commentThreadRenderer'].includes(entry.name)) return 'commentRules';
  return 'UNCLASSIFIED';
}

function filterRuleDeclarations() {
  const source = read('js/filter_logic.js');
  const starts = lineStarts(source);
  const { braceStart, end } = findFilterRulesBounds(source);
  const entries = [];
  let depth = 1;
  let quote = null;
  let escaped = false;
  let comment = null;
  let token = '';

  for (let i = braceStart + 1; i < end; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (comment === 'line') {
      if (char === '\n') comment = null;
      continue;
    }
    if (comment === 'block') {
      if (char === '*' && next === '/') {
        comment = null;
        i += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      comment = 'line';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      comment = 'block';
      i += 1;
      continue;
    }
    if (['"', "'", '`'].includes(char)) {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      continue;
    }
    if (depth !== 1) continue;
    if (/[A-Za-z0-9_$]/.test(char)) {
      token += char;
      continue;
    }
    if (char === ':' && token) {
      let valueStart = i + 1;
      while (/\s/.test(source[valueStart])) valueStart += 1;
      const line = lineForIndex(starts, i - token.length);
      const valueShape = source.startsWith('BASE_VIDEO_RULES', valueStart) ? 'BASE_VIDEO_RULES' : 'objectLiteral';
      const entry = { name: token, line, valueShape };
      entries.push({ ...entry, group: groupForRule(entry) });
      token = '';
      continue;
    }
    if (!/\s/.test(char)) token = '';
  }

  return entries;
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) out[row[key]] = (out[row[key]] || 0) + 1;
  return Object.fromEntries(Object.entries(out).sort());
}

test('filter logic direct renderer rule register is audit-only and scoped to current behavior', () => {
  const text = doc();

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /source file: js\/filter_logic\.js/);
  assert.match(text, /rule object: FILTER_RULES/);
  assert.match(text, /direct rule declarations: 45/);
  assert.match(text, /unique direct rule names: 44/);
  assert.match(text, /duplicate direct rule name: gridVideoRenderer at lines 431 and 604/);
  assert.match(text, /BASE_VIDEO_RULES alias declarations: 7/);
  assert.match(text, /object literal rule declarations: 38/);
  assert.match(text, /semantic rule groups: 11/);
  assert.match(text, /not completion proof for every JSON path/);
});

test('filter logic direct renderer rule register accounts for every current FILTER_RULES declaration', () => {
  const rows = filterRuleDeclarations();
  const names = rows.map(row => row.name);
  const uniqueNames = new Set(names);

  assert.equal(rows.length, 45);
  assert.equal(uniqueNames.size, 44);
  assert.deepEqual(names.filter(name => name === 'gridVideoRenderer'), ['gridVideoRenderer', 'gridVideoRenderer']);
  assert.deepEqual(countBy(rows, 'valueShape'), {
    BASE_VIDEO_RULES: 7,
    objectLiteral: 38
  });
  assert.deepEqual(countBy(rows, 'group'), {
    backstagePostRules: 4,
    baseVideoSharedRules: 7,
    channelContextAndLockupRules: 2,
    channelSurfaceRules: 2,
    commentRules: 2,
    mixRadioPodcastAndTicketRules: 4,
    notificationAndOverlayRules: 6,
    playlistAndGridSpecificRules: 3,
    shortsAndReelRules: 3,
    structuralContainerAndChipRules: 7,
    watchAndScaffoldingRules: 5
  });

  for (const row of rows) {
    assert.notEqual(row.group, 'UNCLASSIFIED', `${row.name}:${row.line} should be classified`);
  }
});

test('filter logic direct renderer rule register preserves every source declaration row and future fields', () => {
  const rows = filterRuleDeclarations();
  const text = doc();

  for (const row of rows) {
    assert.ok(
      text.includes(`| ${row.line} | \`${row.name}\` | \`${row.group}\` | \`${row.valueShape}\` |`),
      `missing declaration row for ${row.name}:${row.line}`
    );
  }

  for (const field of [
    'ruleDeclarationId',
    'rendererKey',
    'sourceLine',
    'valueShape',
    'semanticRuleGroup',
    'effectiveRuntimeKey',
    'duplicatePolicy',
    'baseRuleAliasPolicy',
    'documentedSectionStatus',
    'routeOrEndpoint',
    'listMode',
    'fieldPathSet',
    'identitySourceTier',
    'mutationEffect',
    'wrapperOrContainerPolicy',
    'siblingVisibleBoundary',
    'unsupportedGapRelation',
    'fixtureProvenance',
    'noRuleBudget',
    'positiveFixture',
    'whitelistFixture',
    'negativeUnsupportedFixture',
    'falseHideFixture'
  ]) {
    assert.ok(text.includes(field), `missing future field ${field}`);
  }
});

test('filter logic source still proves direct-rule boundaries and unsupported gaps', () => {
  const source = read('js/filter_logic.js');
  const docs = read('docs/json_paths_encyclopedia.md');
  const inventory = read('docs/youtube_renderer_inventory.md');
  const documentedEvidence = `${docs}\n${inventory}`;

  assert.match(source, /videoRenderer:\s*BASE_VIDEO_RULES/);
  assert.match(source, /gridVideoRenderer:\s*BASE_VIDEO_RULES/);
  assert.match(source, /gridVideoRenderer:\s*\{/);
  assert.match(source, /shortsLockupViewModel:\s*\{/);
  assert.match(source, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.doesNotMatch(source, /showSheetCommand\?\.panelLoadingStrategy\?\.inlineContent\?\.sheetViewModel/);

  for (const renderer of [
    'compactPlaylistRenderer',
    'watchCardHeroVideoRenderer',
    'watchCardRHPanelVideoRenderer',
    'watchCardRichHeaderRenderer',
    'searchRefinementCardRenderer',
    'compactChannelRenderer',
    'sharedPostRenderer',
    'reelPlayerOverlayRenderer'
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\n\\s*${renderer}\\s*:`), `${renderer} should not be a direct FILTER_RULES declaration`);
    assert.ok(documentedEvidence.includes(renderer), `${renderer} should remain documented evidence`);
  }
});

test('runtime source lacks filter logic direct renderer rule authority symbols', () => {
  const text = doc();
  const runtime = productRuntimeSource();
  const authorities = [
    'filterLogicDirectRuleAuthority',
    'filterLogicRendererRuleReport',
    'rendererRuleDuplicatePolicy',
    'rendererRuleFieldPathManifest',
    'rendererRuleEffectDecision',
    'rendererRuleFixtureProvenance'
  ];

  for (const authority of authorities) {
    assert.ok(text.includes(authority), `doc should name missing authority ${authority}`);
    assert.doesNotMatch(runtime, new RegExp(`\\b${authority}\\b`), `${authority} should not exist in runtime source`);
  }
});
