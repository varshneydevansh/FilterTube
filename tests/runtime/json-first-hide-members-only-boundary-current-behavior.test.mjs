import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MEMBERS_ONLY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideMembersOnlyContract',
  'jsonFirstHideMembersOnlyDecisionReport',
  'jsonFirstMembersOnlyRendererInventoryPolicy',
  'jsonFirstMembersOnlyJsonDomParityReport',
  'jsonFirstMembersOnlyDomOnlyPolicy',
  'jsonFirstMembersOnlyBroadHideReport',
  'jsonFirstMembersOnlyNoWorkBudget',
  'jsonFirstMembersOnlyMarkerRestoreProof',
  'jsonFirstMembersOnlySettingsParityReport',
  'jsonFirstMembersOnlyFixtureProvenance',
  'jsonFirstMembersOnlyMetricArtifact'
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

function sliceBetween(text, startNeedle, endNeedle, fromIndex = 0) {
  const start = text.indexOf(startNeedle, fromIndex);
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
    hideMembersOnly: false,
    hideMixPlaylists: false,
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-members-only-boundary-fixture'));
}

function makeFilter(overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const filter = new harness.engine.YouTubeDataFilter(settings(overrides));
  return { ...harness, filter };
}

function contents(...items) {
  return { contents: items };
}

function videoRenderer(overrides = {}) {
  return {
    videoRenderer: {
      videoId: 'MEMBER00001',
      title: { simpleText: 'Neutral Video' },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] },
      ...overrides
    }
  };
}

function memberBadgeVideoRenderer() {
  return videoRenderer({
    badges: [
      {
        metadataBadgeRenderer: {
          label: 'Members only'
        }
      }
    ],
    accessibility: {
      accessibilityData: {
        label: 'Members only - Neutral Video by Neutral Channel'
      }
    }
  });
}

function accessibilityMemberVideoRenderer() {
  return videoRenderer({
    videoId: 'MEMBER00002',
    accessibility: {
      accessibilityData: {
        label: 'Members only - Accessible Neutral Video'
      }
    }
  });
}

function playlistRenderer(overrides = {}) {
  return {
    playlistRenderer: {
      playlistId: 'PLNORMAL001',
      title: { simpleText: 'Normal Playlist' },
      videos: [
        {
          playlistVideoRenderer: {
            videoId: 'VIDEOPLAY01'
          }
        }
      ],
      ...overrides
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const settingsShared = read('js/settings_shared.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    settingsShared,
    filterCandidateBuilder: sliceBetween(
      filterLogic,
      '        _buildCandidate(item, rendererType, wrapperRendererType = null, options = {}) {',
      '\n\n        _candidateSearchText'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domMembersCssRules: sliceBetween(
      domFallback,
      '    if (settings.hideMembersOnly) {',
      "\n\n    // If :has() isn"
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    domMembersDirectBlock: sliceBetween(
      domFallback,
      '        if (effectiveSettings.hideMembersOnly) {',
      '        if (effectiveSettings.hidePlaylistCards) {'
    ),
    bgBooleanPassThrough: sliceBetween(
      background,
      '            // Pass through boolean flags',
      '            const profileContentFilters ='
    ),
    bgRefreshKeys: sliceBetween(
      background,
      '        const relevantKeys = [',
      '        let settingsChanged = false;',
      bgRefreshStart
    ),
    sharedSettingsKeys: sliceBetween(
      settingsShared,
      '    const SETTINGS_KEYS = [',
      '\n\n    const SETTINGS_CHANGE_KEYS'
    ),
    sharedBuildCompiledSettings: sliceBetween(
      settingsShared,
      '    function buildCompiledSettings({',
      '            hideVideoSidebar: !!hideVideoSidebar,'
    )
  };
}

test('JSON-first hideMembersOnly boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, members-only behavior/);
  assert.match(doc, /hideMembersOnly boundary source files: 5/);
  assert.match(doc, /runtime hideMembersOnly fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3652 | 172174 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 5,030 | 235,555 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6803 | 306710 | \`${sha256('js/background.js')}\` |`));
  assert.ok(doc.includes(`| \`js/settings_shared.js\` | 1181 | 57535 | \`${sha256('js/settings_shared.js')}\` |`));
});

test('hideMembersOnly source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic candidate builder block', blocks.filterCandidateBuilder, 79, 4266],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback members CSS rules block', blocks.domMembersCssRules, 41, 2483],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['DOM fallback members direct block', blocks.domMembersDirectBlock, 81, 5060],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461],
    ['settings_shared settings keys block', blocks.sharedSettingsKeys, 38, 1031],
    ['settings_shared build compiled settings block', blocks.sharedBuildCompiledSettings, 54, 1916]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideMembersOnly'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'membership'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'Members only'), 0);
  assert.equal(countLiteral(blocks.seed, 'hideMembersOnly'), 0);
  assert.equal(countLiteral(blocks.seed, 'membership'), 0);
  assert.equal(countLiteral(blocks.seed, 'Members only'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideMembersOnly'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'membership'), 18);
  assert.equal(countLiteral(blocks.domFallback, 'yt-badge-shape--membership'), 13);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-members-only-hidden'), 7);
  assert.equal(countLiteral(blocks.domFallback, 'list=UUMO'), 3);
  assert.equal(countLiteral(blocks.background, 'hideMembersOnly'), 13);
  assert.equal(countLiteral(blocks.settingsShared, 'hideMembersOnly'), 23);

  assert.match(doc, /filter_logic total hideMembersOnly tokens: 0/);
  assert.match(doc, /filter_logic total membership-evidence tokens: 0/);
  assert.match(doc, /seed total hideMembersOnly tokens: 0/);
  assert.match(doc, /seed total membership-evidence tokens: 0/);
  assert.match(doc, /DOM fallback total hideMembersOnly tokens: 3/);
  assert.match(doc, /DOM fallback total membership tokens: 18/);
  assert.match(doc, /DOM fallback total yt-badge-shape--membership tokens: 13/);
  assert.match(doc, /DOM fallback total data-filtertube-members-only-hidden marker tokens: 7/);
  assert.match(doc, /DOM fallback total UUMO markers: 3/);
  assert.match(doc, /background total hideMembersOnly tokens: 13/);
  assert.match(doc, /settings_shared total hideMembersOnly tokens: 23/);
});

test('hideMembersOnly does not remove JSON video rows with membership evidence', () => {
  const config = { hideMembersOnly: true };
  const badgeVideo = contents(memberBadgeVideoRenderer());
  const ariaVideo = contents(accessibilityMemberVideoRenderer());

  assert.deepEqual(run(badgeVideo, config), plain(badgeVideo));
  assert.deepEqual(run(ariaVideo, config), plain(ariaVideo));
});

test('hideMembersOnly does not remove JSON playlist rows with membership evidence', () => {
  const config = { hideMembersOnly: true };
  const titlePlaylist = contents(playlistRenderer({
    playlistId: 'PLMEMBERS01',
    title: { simpleText: 'Members-only videos' }
  }));
  const uumoPlaylist = contents(playlistRenderer({
    playlistId: 'UUMOCHANNEL001',
    title: { simpleText: 'Normal Playlist' }
  }));

  assert.deepEqual(run(titlePlaylist, config), plain(titlePlaylist));
  assert.deepEqual(run(uumoPlaylist, config), plain(uumoPlaylist));
});

test('hideMembersOnly leaves ordinary playlist and video rows visible in JSON', () => {
  const config = { hideMembersOnly: true };
  const ordinaryVideo = contents(videoRenderer());
  const ordinaryPlaylist = contents(playlistRenderer());

  assert.deepEqual(run(ordinaryVideo, config), plain(ordinaryVideo));
  assert.deepEqual(run(ordinaryPlaylist, config), plain(ordinaryPlaylist));
});

test('JSON candidate extraction exposes membership evidence only as generic metadata', () => {
  const { filter } = makeFilter({ hideMembersOnly: true });
  const candidate = filter._buildCandidate(memberBadgeVideoRenderer().videoRenderer, 'videoRenderer');

  assert.match(candidate.metadataText, /Members only/);
  assert.equal(Object.hasOwn(candidate, 'isMembersOnly'), false);
  assert.equal(candidate.isMembersOnly, undefined);
  assert.equal(candidate.isMix, false);
  assert.equal(candidate.isPlaylist, false);
});

test('source proof pins DOM-owned Members-only hiding and settings parity gap', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.filterCandidateBuilder, /accessibility\.accessibilityData\.label/);
  assert.doesNotMatch(blocks.filterLogic, /hideMembersOnly/);
  assert.doesNotMatch(blocks.filterLogic, /isMembersOnly/);
  assert.doesNotMatch(blocks.filterLogic, /membership/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideMembersOnly/);
  assert.match(blocks.domMembersCssRules, /yt-badge-shape--membership/);
  assert.match(blocks.domMembersCssRules, /ytd-watch-flexy:has/);
  assert.match(blocks.domMembersCssRules, /list=UUMO/);
  assert.match(blocks.domMembersDirectBlock, /data-filtertube-members-only-hidden/);
  assert.match(blocks.domMembersDirectBlock, /document\.querySelectorAll\('#video-title/);
  assert.match(blocks.domMembersDirectBlock, /membershipBadges/);
  assert.match(blocks.domMembersDirectBlock, /membershipLinks/);
  assert.match(blocks.domMembersDirectBlock, /previouslyHidden/);
  assert.match(blocks.domActiveBooleanKeys, /'hideMembersOnly'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideMembersOnly = boolFromV4\('hideMembersOnly', items\.hideMembersOnly \|\| false\)/);
  assert.match(blocks.bgRefreshKeys, /'hideMembersOnly'/);
  assert.match(blocks.sharedSettingsKeys, /'hideMembersOnly'/);
  assert.match(blocks.sharedBuildCompiledSettings, /hideMembersOnly: !!hideMembersOnly/);
  assert.match(doc, /Seed JSON active-work detection does not include `hideMembersOnly`/);
  assert.match(doc, /exposes no `isMembersOnly` field/);
  assert.match(doc, /DOM CSS hides card renderers, metadata blocks, watch containers, shelves, and `UUMO` playlist links/);
  assert.match(doc, /broad DOM selectors can\s+also hide watch or shelf containers/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
