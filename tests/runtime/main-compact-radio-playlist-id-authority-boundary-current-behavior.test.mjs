import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_COMPACT_RADIO_PLAYLIST_ID_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-compact-radio-renderer.json';
const rawPath = 'playlist.json';

const futureAuthorityTokens = [
  'mainCompactRadioPlaylistIdentityContract',
  'mainCompactRadioDecisionReport',
  'mainCompactRadioPlaylistIdPolicy',
  'mainCompactRadioDisplayBylinePolicy',
  'mainCompactRadioWhitelistIdentityPolicy',
  'mainCompactRadioHideMixJsonParityGate',
  'mainCompactRadioSideEffectBudget',
  'mainCompactRadioJsonFirstGate'
];

const indexPaths = [
  'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
  'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
  'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md',
  'docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md',
  'docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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

function inputFromFixture() {
  return {
    contents: [
      {
        compactRadioRenderer: plain(loadFixture().renderer)
      }
    ]
  };
}

function compactRadioRows(output) {
  return (output.contents || [])
    .map((item) => item.compactRadioRenderer)
    .filter(Boolean);
}

function runFixture(overrides = {}) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    inputFromFixture(),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { output: plain(output), messages: plain(harness.messages) };
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('Main compact radio playlist id authority doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /primary-identity boundary/);

  assert.equal(lineCount(raw), 3610);
  assert.equal(Buffer.byteLength(raw), 165443);
  assert.equal(sha256(rawPath), 'f5766312bdddcceb20ecd2a4b54045843dfab89108b75c2f5bc8a0ee368d4ce5');
  assert.equal(lineCount(fixtureText), 60);
  assert.equal(Buffer.byteLength(fixtureText), 1186);
  assert.equal(sha256(fixturePath), 'b30c66b9932c6a248e6b3221385323c37aa7d9517a3204ad1e5534aa404b6c7f');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'compactRadioRenderer');
  assert.equal(fixture.provenance.surface, 'Main generated Mix/radio playlist card');
});

test('reduced compact radio fixture carries playlist and seed ids but no owner channel fields', () => {
  const renderer = loadFixture().renderer;
  const serialized = JSON.stringify(renderer);

  assert.equal(renderer.playlistId, 'RDEPo5wWmKEaI');
  assert.equal(renderer.navigationEndpoint.watchEndpoint.videoId, 'EPo5wWmKEaI');
  assert.equal(renderer.navigationEndpoint.watchEndpoint.playlistId, 'RDEPo5wWmKEaI');
  assert.equal(renderer.secondaryNavigationEndpoint.watchEndpoint.videoId, 't4H_Zoh7G5A');
  assert.equal(renderer.secondaryNavigationEndpoint.watchEndpoint.playlistId, 'RDEPo5wWmKEaI');
  assert.equal(renderer.title.runs[0].text, 'Mix - Pitbull - Give Me Everything ft. Ne-Yo, Afrojack, Nayer');
  assert.equal(renderer.shortBylineText.runs[0].text, 'YouTube');
  assert.equal(renderer.longBylineText.runs[0].text, 'YouTube');
  assert.equal(renderer.videoCountText.runs[0].text, '50+ videos');

  assert.doesNotMatch(serialized, /browseEndpoint/);
  assert.doesNotMatch(serialized, /canonicalBaseUrl/);
  assert.doesNotMatch(serialized, /channelId/);
  assert.doesNotMatch(serialized, /externalChannelId/);
  assert.doesNotMatch(serialized, /ownerText/);
  assert.doesNotMatch(serialized, /authorEndpoint/);
});

test('compact radio no-rule and channel blocklist preserve row with no map side effects', () => {
  const noRuleRun = runFixture();
  assert.deepEqual(compactRadioRows(noRuleRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);
  assert.equal(noRuleRun.messages.length, 0);

  const channelRun = runFixture({
    filterChannels: [{ id: 'UC4-TgOSMJHn-LtY4zCzbQhw', handle: '@pitbull' }]
  });
  assert.deepEqual(compactRadioRows(channelRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);
  assert.equal(channelRun.messages.length, 0);
});

test('compact radio title keyword filters while playlist and seed ids are not keyword content', () => {
  const titleRun = runFixture({ filterKeywords: [{ pattern: 'Pitbull', flags: 'i' }] });
  assert.deepEqual(compactRadioRows(titleRun.output), []);

  const playlistIdRun = runFixture({ filterKeywords: [{ pattern: 'RDEPo5wWmKEaI', flags: '' }] });
  assert.deepEqual(compactRadioRows(playlistIdRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);

  const seedVideoRun = runFixture({ filterKeywords: [{ pattern: 'EPo5wWmKEaI', flags: '' }] });
  assert.deepEqual(compactRadioRows(seedVideoRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);
});

test('compact radio whitelist and hideMixPlaylists boundaries remain split today', () => {
  const channelRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC4-TgOSMJHn-LtY4zCzbQhw', handle: '@pitbull' }]
  });
  assert.deepEqual(compactRadioRows(channelRun.output), []);

  const titleRun = runFixture({
    listMode: 'whitelist',
    whitelistKeywords: [{ pattern: 'Pitbull', flags: 'i' }]
  });
  assert.deepEqual(compactRadioRows(titleRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);

  const hideMixRun = runFixture({ hideMixPlaylists: true });
  assert.deepEqual(compactRadioRows(hideMixRun.output).map((row) => row.playlistId), ['RDEPo5wWmKEaI']);
});

test('compact radio playlist id boundary indexes and future symbols stay audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const indexPath of indexPaths) {
    assert.match(read(indexPath), /Main compact radio playlist id authority boundary addendum/);
    assert.match(read(indexPath), /main-compact-radio-playlist-id-authority-boundary-current-behavior\.test\.mjs/);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
