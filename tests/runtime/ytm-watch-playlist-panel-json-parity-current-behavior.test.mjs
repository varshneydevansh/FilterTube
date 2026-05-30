import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'YTM.json';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-watch-playlist-panel-json.json';
const domFixturePath = 'tests/runtime/fixtures/captures/ytm-watch-player-dom.html';
const docPath = 'docs/audit/FILTERTUBE_YTM_WATCH_PLAYLIST_PANEL_JSON_PARITY_CURRENT_BEHAVIOR_2026-05-23.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';
const ledgerPath = 'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md';
const activeGoalPath = 'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md';
const obligationPath = 'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md';

const futureAuthorityTokens = [
  'ytmWatchPlaylistPanelJsonContract',
  'ytmWatchPlaylistPanelJsonDomParityReport',
  'ytmWatchPlaylistPanelSelectedRowPolicy',
  'ytmWatchPlaylistPanelCurrentVideoFixture',
  'ytmWatchPlaylistPanelWhitelistParityReport',
  'ytmWatchPlaylistPanelNoPlaybackSideEffectReport',
  'ytmWatchPlaylistPanelMetricArtifact',
  'ytmWatchPlaylistPanelJsonFirstGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function balancedFragments(text) {
  const fragments = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (start < 0) {
      if (char === '{' || char === '[') {
        start = index;
        depth = 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        fragments.push({
          start,
          end: index + 1,
          startLine: text.slice(0, start).split(/\r?\n/).length,
          text: text.slice(start, index + 1)
        });
        start = -1;
      }
    }
  }

  return fragments;
}

function walkPlaylistPanelRows(value, pathParts = [], rows = []) {
  if (!value || typeof value !== 'object') return rows;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPlaylistPanelRows(item, [...pathParts, index], rows));
    return rows;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === 'playlistPanelVideoRenderer') {
      rows.push({
        path: [...pathParts, key].join('.'),
        renderer: child
      });
    }
    walkPlaylistPanelRows(child, [...pathParts, key], rows);
  }

  return rows;
}

function textFromRuns(value) {
  if (!value) return '';
  if (typeof value.simpleText === 'string') return value.simpleText;
  if (Array.isArray(value.runs)) return value.runs.map(run => run.text || '').join('');
  return '';
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
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
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    videoChannelMap: {},
    channelMap: {},
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function runFixture(settings = {}) {
  const { engine, messages } = loadFilterTubeEngine();
  const input = plain(loadFixture().response);
  const output = engine.processData(input, baseSettings(settings), 'ytm-watch-playlist-panel-json-parity');
  return { input, output, messages };
}

function videoIds(response) {
  return plain((response.contents || []).map(item => item.playlistPanelVideoRenderer?.videoId).filter(Boolean));
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/block_channel.js'
  ].map(read).join('\n');
}

test('YTM watch playlist-panel JSON parity doc and reduced fixture are pinned', () => {
  const doc = read(docPath);
  const fixtureText = read(fixturePath);
  const fixture = JSON.parse(fixtureText);
  const runtimeResults = read(runtimeResultsPath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /YTM watch\/player DOM and whitelist\s+work has JSON-side evidence/);

  assert.equal(fixture.provenance.source, 'YTM.json');
  assert.equal(fixture.provenance.sourceSha256, '9eacd68076c85f2c0eb218ddafbd543d631dfc26ac6f761f4611bc7eb0991e8d');
  assert.equal(fixture.provenance.sourceBytes, 1312137);
  assert.equal(fixture.provenance.sourceLogicalLines, 17335);
  assert.equal(fixture.provenance.sourceNewlineCount, 17334);
  assert.deepEqual(fixture.provenance.fragmentStartLines, [16070, 16284, 16498]);
  assert.deepEqual(fixture.provenance.selectedRendererVideoIds, ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']);
  assert.equal(fixture.provenance.domVisibleSiblingVideoId, '75NRE2KB8jc');
  assert.equal(fixture.provenance.domSelectedHiddenVideoIdMissingFromJson, 'NLDFEkIvcbc');
  assert.equal(lineCount(fixtureText), 184);
  assert.equal(Buffer.byteLength(fixtureText), 5282);
  assert.equal(sha256(fixturePath), '4e04ab54a720cd2133625ed65eccc922a5840e1073e048788eac7497e3b46e25');

  assert.match(doc, /Reduced fixture lines \| 184/);
  assert.match(doc, /Reduced fixture bytes \| 5282/);
  assert.ok(runtimeResults.includes('tests/runtime/ytm-watch-playlist-panel-json-parity-current-behavior.test.mjs'));
});

test('raw YTM JSON fragments prove three watch playlist-panel rows and no selected row', () => {
  const raw = read(rawPath);
  const fragments = balancedFragments(raw);
  const parsedRows = [];

  assert.equal(lineCount(raw), 17335);
  assert.equal(raw.split(/\r?\n/).length - 1, 17334);
  assert.equal(Buffer.byteLength(raw), 1312137);
  assert.equal(sha256(rawPath), '9eacd68076c85f2c0eb218ddafbd543d631dfc26ac6f761f4611bc7eb0991e8d');
  assert.equal(fragments.length, 6);
  assert.deepEqual(fragments.map(fragment => fragment.startLine), [1, 5405, 10647, 16070, 16284, 16498]);
  assert.equal(countLiteral(raw, 'playlistPanelVideoRenderer'), 4);
  assert.equal(countLiteral(raw, 'videoWithContextRenderer'), 38);
  assert.equal(countLiteral(raw, 'compactPlaylistRenderer'), 2);
  assert.equal(countLiteral(raw, 'endScreenVideoRenderer'), 0);
  assert.equal(countLiteral(raw, 'autoplayVideo'), 0);
  assert.equal(countLiteral(raw, 'nextButtonVideo'), 0);

  for (const fragment of fragments.slice(3, 6)) {
    parsedRows.push(...walkPlaylistPanelRows(JSON.parse(fragment.text)));
  }

  assert.equal(parsedRows.length, 3);
  assert.deepEqual(parsedRows.map(row => row.renderer.videoId), ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']);
  assert.deepEqual(parsedRows.map(row => row.renderer.selected), [false, false, false]);
  assert.deepEqual(parsedRows.map(row => textFromRuns(row.renderer.shortBylineText)), [
    'Angelina Jordan Official',
    'AC/DC',
    'NYUSHA MUSIC'
  ]);
  assert.deepEqual(parsedRows.map(row => row.renderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId), [
    'UC1Pwa4nFvIPbtYVLcBGDpjA',
    'UCB0JSO6d5ysH2Mmqz5I9rIw',
    'UCm9VWKAFz0aXpuEHPHMae7w'
  ]);
  assert.equal(parsedRows.some(row => row.renderer.videoId === 'NLDFEkIvcbc'), false);
  assert.equal(parsedRows.some(row => row.renderer.selected === true), false);
});

test('current engine decisions for reduced YTM playlist-panel JSON remain pinned', () => {
  const noRule = runFixture();
  const keywordBlock = runFixture({ filterKeywords: [keyword('Nyusha')] });
  const channelBlock = runFixture({
    filterChannels: [{ id: 'UCm9VWKAFz0aXpuEHPHMae7w', handle: '@NYUSHAmusic' }]
  });
  const whitelistMatch = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCm9VWKAFz0aXpuEHPHMae7w', handle: '@NYUSHAmusic' }]
  });
  const whitelistEmpty = runFixture({ listMode: 'whitelist' });

  assert.deepEqual(videoIds(noRule.output), ['1U6WY_z8Vu8', 'xRQnJyP77tY', '75NRE2KB8jc']);
  assert.deepEqual(noRule.messages, []);
  assert.deepEqual(videoIds(keywordBlock.output), ['1U6WY_z8Vu8', 'xRQnJyP77tY']);
  assert.deepEqual(videoIds(channelBlock.output), ['1U6WY_z8Vu8', 'xRQnJyP77tY']);
  assert.deepEqual(videoIds(whitelistMatch.output), ['75NRE2KB8jc']);
  assert.deepEqual(videoIds(whitelistEmpty.output), []);
});

test('YTM playlist-panel JSON and rendered DOM fixtures preserve the current parity gap', () => {
  const fixture = loadFixture();
  const dom = read(domFixturePath);
  const doc = read(docPath);
  const jsonText = JSON.stringify(fixture.response);

  assert.match(jsonText, /75NRE2KB8jc/);
  assert.doesNotMatch(jsonText, /NLDFEkIvcbc/);
  assert.doesNotMatch(jsonText, /"selected":true/);
  assert.match(dom, /data-filtertube-video-id="NLDFEkIvcbc"/);
  assert.match(dom, /aria-selected="true"/);
  assert.match(dom, /data-filtertube-hidden="true"/);
  assert.match(dom, /data-filtertube-video-id="75NRE2KB8jc"/);
  assert.match(doc, /JSON has no `selected: true` row/);
  assert.match(doc, /JSON does not contain the DOM selected hidden video id `NLDFEkIvcbc`/);
  assert.match(doc, /cannot yet replace the DOM selected-row\s+policy/);
});

test('product source still splits JSON playlist rules from DOM selected-row policy', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);

  assert.match(read('js/filter_logic.js'), /playlistPanelVideoRenderer:\s*BASE_VIDEO_RULES/);
  assert.match(read('js/content/dom_fallback.js'), /isSelectedPlaylistPanelRow/);
  assert.match(read('js/content/dom_fallback.js'), /shouldHideSelectedRow/);
  assert.match(source, /ytm-playlist-panel-video-renderer/);
  assert.match(doc, /DOM branch restores\s+selected rows in whitelist mode/);
  assert.match(doc, /JSON branch has no selected\/current\s+row exemption/);
});

test('YTM watch playlist-panel future authorities are absent and ledgers cite the open gate', () => {
  const source = productRuntimeSource();
  const doc = read(docPath);
  const ledger = read(ledgerPath);
  const activeGoal = read(activeGoalPath);
  const obligation = read(obligationPath);

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `doc should name ${token}`);
    assert.doesNotMatch(source, new RegExp(`\\b${token}\\b`), `${token} should not exist in product runtime`);
  }

  for (const text of [ledger, activeGoal, obligation]) {
    assert.match(text, /YTM watch playlist-panel JSON parity addendum/);
    assert.match(text, /ytm-watch-playlist-panel-json\.json/);
    assert.match(text, /implementation gate/);
  }
}
);
