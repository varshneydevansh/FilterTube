import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_MIX_PLAYLISTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md';

const authoritySymbols = [
  'jsonFirstHideMixPlaylistsContract',
  'jsonFirstHideMixPlaylistsDecisionReport',
  'jsonFirstMixRendererInventoryPolicy',
  'jsonFirstMixJsonDomParityReport',
  'jsonFirstMixDomOnlyPolicy',
  'jsonFirstMixBackgroundCacheReport',
  'jsonFirstMixPlaylistInteractionPolicy',
  'jsonFirstMixNoWorkBudget',
  'jsonFirstMixMarkerRestoreProof',
  'jsonFirstMixFixtureProvenance',
  'jsonFirstMixMetricArtifact'
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
  return plain(engine.processData(payload, settings(overrides), options.dataName || 'hide-mix-playlists-boundary-fixture'));
}

function makeFilter(overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const filter = new harness.engine.YouTubeDataFilter(settings(overrides));
  return { ...harness, filter };
}

function contents(...items) {
  return { contents: items };
}

function radioRenderer() {
  return {
    radioRenderer: {
      title: { simpleText: 'YouTube Mix' },
      navigationEndpoint: {
        watchEndpoint: {
          videoId: 'VIDEOMIX001',
          playlistId: 'RDVIDEOMIX001'
        }
      },
      longBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function compactRadioRenderer() {
  return {
    compactRadioRenderer: {
      title: { simpleText: 'Mix - Neutral' },
      navigationEndpoint: {
        watchEndpoint: {
          videoId: 'VIDEOMIX002',
          playlistId: 'RDVIDEOMIX002'
        }
      },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
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

function videoRenderer() {
  return {
    videoRenderer: {
      videoId: 'VIDEONORMAL',
      title: { simpleText: 'Normal Video' },
      shortBylineText: { runs: [{ text: 'Neutral Channel' }] }
    }
  };
}

function sourceBlocks() {
  const filterLogic = read('js/filter_logic.js');
  const seed = read('js/seed.js');
  const domFallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const bgRefreshStart = background.indexOf('// Listen for storage changes to re-compile settings');

  return {
    filterLogic,
    seed,
    domFallback,
    background,
    filterRadioRules: sliceBetween(
      filterLogic,
      '        radioRenderer: {',
      '        ticketShelfRenderer: {'
    ),
    filterUnwrapMixNested: sliceBetween(
      filterLogic,
      "                        'radioRenderer',",
      '                    ];\n\n                    for (const nestedRendererType'
    ),
    filterExtractPlaylistId: sliceBetween(
      filterLogic,
      '        _extractPlaylistId(item) {',
      '\n\n        _emptyChannelInfo()'
    ),
    filterCandidateMixFlag: sliceBetween(
      filterLogic,
      '            const isMix = (',
      '            const isShort = ('
    ),
    filterCategoryRendererAllowlist: sliceBetween(
      filterLogic,
      '            const isVideoRenderer = [',
      '            if (!isVideoRenderer) return false;'
    ),
    seedActiveJsonRules: sliceBetween(
      seed,
      '    function hasActiveJsonFilterRules(settings) {',
      '\n\n    function hasNetworkJsonWork'
    ),
    domMixHelper: sliceBetween(
      domFallback,
      'function isFilterTubeMixOrRadioElement(element) {',
      '\nfunction isPlaylistPanelRowElement'
    ),
    domCssMixRules: sliceBetween(
      domFallback,
      '    if (settings.hideMixPlaylists) {',
      '\n\n    if (settings.hideMembersOnly) {'
    ),
    domActiveBooleanKeys: sliceBetween(
      domFallback,
      "            'hideAllComments',",
      '        ];\n        if (booleanFilterKeys.some'
    ),
    domPlaylistCardsExcludeRadio: sliceBetween(
      domFallback,
      '        if (effectiveSettings.hidePlaylistCards) {',
      '        if (effectiveSettings.hideMixPlaylists) {'
    ),
    domMixChipDirect: sliceBetween(
      domFallback,
      '        if (effectiveSettings.hideMixPlaylists) {\n            // Hide the "Mixes" filter chip on Home when mixes are hidden.',
      '    } catch (e) {\n    }\n\n    if (effectiveSettings.enabled === false)'
    ),
    domMixCardDecision: sliceBetween(
      domFallback,
      '            if (effectiveSettings.hideMixPlaylists && isFilterTubeMixOrRadioElement(element)) {',
      '            const pendingMetaTtlMs = 8000;'
    ),
    domChipFiltering: sliceBetween(
      domFallback,
      '    // 2. Chip Filtering (Home/Search chip bars)',
      '    // Hide any rich items that ended up empty'
    ),
    bgStorageReadKeys: sliceBetween(
      background,
      "        browserAPI.storage.local.get([\n            'enabled',",
      '        ], (items) => {'
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
    )
  };
}

test('JSON-first hideMixPlaylists boundary audit is audit-only and source pinned', () => {
  const doc = read(docPath);

  assert.match(doc, /Status: audit-only current-behavior proof slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch, optimization patch, Mix behavior/);
  assert.match(doc, /hideMixPlaylists boundary source files: 4/);
  assert.match(doc, /runtime hideMixPlaylists fixtures: 6/);

  assert.ok(doc.includes(`| \`js/filter_logic.js\` | 3498 | 165151 | \`${sha256('js/filter_logic.js')}\` |`));
  assert.ok(doc.includes(`| \`js/seed.js\` | 1136 | 50026 | \`${sha256('js/seed.js')}\` |`));
  assert.ok(doc.includes(`| \`js/content/dom_fallback.js\` | 4838 | 228332 | \`${sha256('js/content/dom_fallback.js')}\` |`));
  assert.ok(doc.includes(`| \`js/background.js\` | 6320 | 285103 | \`${sha256('js/background.js')}\` |`));
});

test('hideMixPlaylists source counts remain pinned', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const countRows = [
    ['filter_logic radio rules block', blocks.filterRadioRules, 17, 833],
    ['filter_logic unwrap mix nested block', blocks.filterUnwrapMixNested, 4, 183],
    ['filter_logic extract playlist id block', blocks.filterExtractPlaylistId, 15, 676],
    ['filter_logic candidate mix flag block', blocks.filterCandidateMixFlag, 7, 314],
    ['filter_logic category renderer allowlist block', blocks.filterCategoryRendererAllowlist, 8, 618],
    ['seed active JSON rules block', blocks.seedActiveJsonRules, 13, 463],
    ['DOM fallback mix helper block', blocks.domMixHelper, 48, 2207],
    ['DOM fallback mix CSS rules block', blocks.domCssMixRules, 15, 588],
    ['DOM fallback active boolean keys block', blocks.domActiveBooleanKeys, 28, 905],
    ['DOM fallback playlist cards exclude radio block', blocks.domPlaylistCardsExcludeRadio, 27, 1459],
    ['DOM fallback mix chip direct block', blocks.domMixChipDirect, 21, 1127],
    ['DOM fallback mix card decision block', blocks.domMixCardDecision, 14, 566],
    ['DOM fallback chip filtering block', blocks.domChipFiltering, 24, 968],
    ['background storage read keys block', blocks.bgStorageReadKeys, 44, 1408],
    ['background boolean pass-through block', blocks.bgBooleanPassThrough, 35, 3596],
    ['background storage refresh keys block', blocks.bgRefreshKeys, 16, 461]
  ];

  for (const [label, block, expectedLines, expectedBytes] of countRows) {
    assert.equal(lineCount(block), expectedLines, label);
    assert.equal(Buffer.byteLength(block), expectedBytes, label);
    assert.match(doc, new RegExp(`${label} lines: ${expectedLines}`));
    assert.match(doc, new RegExp(`${label} bytes: ${expectedBytes}`));
  }

  assert.equal(countLiteral(blocks.filterLogic, 'hideMixPlaylists'), 0);
  assert.equal(countLiteral(blocks.filterLogic, 'isMix'), 2);
  assert.equal(countLiteral(blocks.filterLogic, 'radioRenderer'), 5);
  assert.equal(countLiteral(blocks.filterLogic, 'compactRadioRenderer'), 5);
  assert.equal(countLiteral(blocks.filterLogic, 'playlistId'), 11);
  assert.equal(countLiteral(blocks.seed, 'hideMixPlaylists'), 0);
  assert.equal(countLiteral(blocks.domFallback, 'hideMixPlaylists'), 5);
  assert.equal(countLiteral(blocks.domFallback, 'isMix'), 2);
  assert.equal(countLiteral(blocks.domFallback, 'data-filtertube-hidden-by-mix-radio'), 3);
  assert.equal(countLiteral(blocks.domFallback, 'start_radio=1'), 10);
  assert.equal(countLiteral(blocks.background, 'hideMixPlaylists'), 12);

  assert.match(doc, /filter_logic total hideMixPlaylists tokens: 0/);
  assert.match(doc, /filter_logic total isMix tokens: 2/);
  assert.match(doc, /filter_logic total radioRenderer tokens: 5/);
  assert.match(doc, /filter_logic total compactRadioRenderer tokens: 5/);
  assert.match(doc, /filter_logic total playlistId tokens: 11/);
  assert.match(doc, /seed total hideMixPlaylists tokens: 0/);
  assert.match(doc, /DOM fallback total hideMixPlaylists tokens: 5/);
  assert.match(doc, /DOM fallback total isMix tokens: 2/);
  assert.match(doc, /DOM fallback total hidden-by-mix-radio marker tokens: 3/);
  assert.match(doc, /DOM fallback total start_radio markers: 10/);
  assert.match(doc, /background total hideMixPlaylists tokens: 12/);
});

test('hideMixPlaylists does not remove JSON radio renderer families', () => {
  const config = { hideMixPlaylists: true };
  const radio = contents(radioRenderer());
  const compactRadio = contents(compactRadioRenderer());

  assert.deepEqual(run(radio, config), plain(radio));
  assert.deepEqual(run(compactRadio, config), plain(compactRadio));
});

test('hideMixPlaylists does not remove JSON playlist rows with Mix evidence', () => {
  const config = { hideMixPlaylists: true };
  const rdPlaylist = contents(playlistRenderer({
    playlistId: 'RDVIDEOMIX003',
    title: { simpleText: 'Normal Playlist' }
  }));
  const titleMixPlaylist = contents(playlistRenderer({
    playlistId: 'PLNORMAL001',
    title: { simpleText: 'Mix - Neutral Songs' }
  }));

  assert.deepEqual(run(rdPlaylist, config), plain(rdPlaylist));
  assert.deepEqual(run(titleMixPlaylist, config), plain(titleMixPlaylist));
});

test('hideMixPlaylists leaves ordinary playlist and video rows visible in JSON', () => {
  const config = { hideMixPlaylists: true };
  const ordinaryPlaylist = contents(playlistRenderer());
  const ordinaryVideo = contents(videoRenderer());

  assert.deepEqual(run(ordinaryPlaylist, config), plain(ordinaryPlaylist));
  assert.deepEqual(run(ordinaryVideo, config), plain(ordinaryVideo));
});

test('JSON candidate extraction still classifies Mix-like rows as isMix', () => {
  const { filter } = makeFilter({ hideMixPlaylists: true });

  assert.equal(filter._buildCandidate(radioRenderer().radioRenderer, 'radioRenderer').isMix, true);
  assert.equal(filter._buildCandidate(compactRadioRenderer().compactRadioRenderer, 'compactRadioRenderer').isMix, true);
  assert.equal(filter._buildCandidate(playlistRenderer({ playlistId: 'RDVIDEOMIX003' }).playlistRenderer, 'playlistRenderer').isMix, true);
  assert.equal(filter._buildCandidate(playlistRenderer({ title: { simpleText: 'Mix - Neutral Songs' } }).playlistRenderer, 'playlistRenderer').isMix, true);
  assert.equal(filter._buildCandidate(playlistRenderer().playlistRenderer, 'playlistRenderer').isMix, false);
});

test('source proof pins DOM-only Mix hiding and missing refresh key authority', () => {
  const doc = read(docPath);
  const blocks = sourceBlocks();
  const runtime = productRuntimeSource();

  assert.match(blocks.filterRadioRules, /radioRenderer/);
  assert.match(blocks.filterRadioRules, /compactRadioRenderer/);
  assert.match(blocks.filterCandidateMixFlag, /rendererType === 'radioRenderer'/);
  assert.match(blocks.filterCandidateMixFlag, /playlistId && playlistId\.startsWith\('RD'\)/);
  assert.match(blocks.filterCandidateMixFlag, /lowerTitle\.includes\('youtube mix'\)/);
  assert.doesNotMatch(blocks.filterLogic, /hideMixPlaylists/);
  assert.doesNotMatch(blocks.seedActiveJsonRules, /hideMixPlaylists/);
  assert.match(blocks.domCssMixRules, /start_radio=1/);
  assert.match(blocks.domMixHelper, /badgeText === 'mix'/);
  assert.match(blocks.domMixHelper, /my mix/);
  assert.match(blocks.domMixCardDecision, /data-filtertube-hidden-by-mix-radio/);
  assert.match(blocks.domPlaylistCardsExcludeRadio, /if \(isRadio\) return/);
  assert.match(blocks.domMixChipDirect, /txt === 'mixes'/);
  assert.match(blocks.domChipFiltering, /normalizedLabel === 'mixes'/);
  assert.match(blocks.domActiveBooleanKeys, /'hideMixPlaylists'/);
  assert.match(blocks.bgStorageReadKeys, /'hideMixPlaylists'/);
  assert.match(blocks.bgBooleanPassThrough, /compiledSettings\.hideMixPlaylists = boolFromV4\('hideMixPlaylists', items\.hideMixPlaylists \|\| false\)/);
  assert.doesNotMatch(blocks.bgRefreshKeys, /'hideMixPlaylists'/);
  assert.match(doc, /`filter_logic\.js` has no `hideMixPlaylists` token/);
  assert.match(doc, /Background storage-change invalidation does not list `hideMixPlaylists`/);

  for (const symbol of authoritySymbols) {
    assert.ok(doc.includes(symbol), `doc should name missing symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime`);
  }
});
