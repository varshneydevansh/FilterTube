import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const rawPath = 'playlist.html';
const rawJsonPath = 'playlist.json';
const fixturePath = 'tests/runtime/fixtures/captures/playlist-panel-header-mix-dom.html';
const selectedRowFixturePath = 'tests/runtime/fixtures/captures/playlist-selected-row.html';
const compactRadioFixturePath = 'tests/runtime/fixtures/captures/main-compact-radio-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_PLAYLIST_PANEL_HEADER_MIX_CREATOR_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'playlistPanelHeaderCreatorIdentityContract',
  'playlistPanelHeaderCreatorDecisionReport',
  'playlistPanelHeaderMixPublisherPolicy',
  'playlistSelectedRowBylineIdentityReport',
  'playlistHeaderCreatorFixtureGate',
  'playlistPanelHeaderJsonFirstAuthorityGate',
  'playlistCreatorNoPlaybackSideEffectReport'
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

function firstPlaylistPanelHeader(raw) {
  const start = raw.indexOf('<ytd-playlist-panel-renderer');
  assert.notEqual(start, -1, 'playlist panel renderer should exist');
  const end = raw.indexOf('<div id="content-header"', start);
  assert.notEqual(end, -1, 'playlist panel header boundary should exist');
  return raw.slice(start, end);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js',
    'js/content/dom_extractors.js'
  ].map(read).join('\n');
}

test('raw playlist.html header evidence is pinned and lacks canonical creator identity', () => {
  const raw = read(rawPath);
  const header = firstPlaylistPanelHeader(raw);

  assert.equal(lineCount(raw), 24055);
  assert.equal(Buffer.byteLength(raw), 2905258);
  assert.equal(sha256(rawPath), '62d5819d489a417c49c0dfe1384a8efb5a2ab85146a00207dd135a87b93e877d');

  assert.equal(countLiteral(header, 'Mix \u2013 Shakira'), 4);
  assert.equal(countLiteral(header, 'Be\u00e9le'), 4);
  assert.equal(countLiteral(header, 'Mixes are playlists YouTube makes for you'), 2);
  assert.match(header, /playlist-type="RDUc"/);

  for (const absent of [
    'RDUc8KFRqO3IM',
    'href="/channel/',
    'href="/@',
    'data-filtertube-channel-id',
    'data-filtertube-hidden',
    'filtertube-hidden',
    'selected="'
  ]) {
    assert.equal(countLiteral(header, absent), 0, `header should not contain ${absent}`);
  }
});

test('reduced playlist panel header fixture preserves Mix publisher proof without channel authority', () => {
  const fixture = read(fixturePath);

  assert.equal(lineCount(fixture), 31);
  assert.equal(Buffer.byteLength(fixture), 1626);
  assert.equal(sha256(fixturePath), '6bcf21a9b43ae53ab21312335b111d6c8a9a56dc90380d87577f5b04a26debe3');

  for (const phrase of [
    'source: playlist.html',
    'classification: playlist panel header DOM evidence, not creator channel identity proof',
    'playlist-type="RDUc"',
    'Mix &#8211; Shakira',
    'Be&#233;le',
    'Mixes are playlists YouTube makes for you'
  ]) {
    assert.ok(fixture.includes(phrase), `missing fixture phrase ${phrase}`);
  }

  for (const absent of [
    'RDUc8KFRqO3IM',
    'href="/channel/',
    'href="/@',
    'data-filtertube-channel-id',
    'data-filtertube-hidden',
    'filtertube-hidden',
    'selected="'
  ]) {
    assert.doesNotMatch(fixture, new RegExp(absent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('playlist selected-row fixture remains display-only byline proof, not creator identity', () => {
  const selectedRow = read(selectedRowFixturePath);

  assert.match(selectedRow, /<ytd-playlist-panel-video-renderer\b/);
  assert.match(selectedRow, /selected=""/);
  assert.match(selectedRow, /href="\/watch\?v=tlYcUqEPN58&amp;list=RDUc8KFRqO3IM/);
  assert.match(selectedRow, /Ed Sheeran - Sing \[Official Music Video\]/);
  assert.match(selectedRow, />\s*Ed Sheeran\s*</);
  assert.match(selectedRow, /aria-label="Action menu"/);

  assert.doesNotMatch(selectedRow, /data-filtertube-channel-id/);
  assert.doesNotMatch(selectedRow, /href="\/channel\//);
  assert.doesNotMatch(selectedRow, /href="\/@/);
});

test('playlist.json player metadata is current-video metadata, not playlist header creator proof', () => {
  const rawJson = read(rawJsonPath);
  const compactRadio = JSON.parse(read(compactRadioFixturePath)).renderer;
  const compactRadioText = JSON.stringify(compactRadio);

  for (const phrase of [
    '"videoDetails"',
    '"channelId": "UC4-TgOSMJHn-LtY4zCzbQhw"',
    '"author": "ShawnMendesVEVO"',
    '"ownerProfileUrl": "http://www.youtube.com/@shawnmendesvevo"',
    '"externalChannelId": "UC4-TgOSMJHn-LtY4zCzbQhw"',
    '"ownerChannelName": "ShawnMendesVEVO"'
  ]) {
    assert.ok(rawJson.includes(phrase), `playlist.json should contain current-video player metadata ${phrase}`);
  }

  assert.match(compactRadioText, /RDEPo5wWmKEaI/);
  assert.match(compactRadioText, /"YouTube"/);
  assert.doesNotMatch(compactRadioText, /browseEndpoint|canonicalBaseUrl|channelId|externalChannelId|ownerChannelName|ownerProfileUrl/);
});

test('playlist panel header Mix audit is linked from ledgers without closing creator identity gate', () => {
  const doc = read(docPath);
  const ledgers = [
    'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md',
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_P0_CAPTURE_FIXTURE_TRACEABILITY_CURRENT_BEHAVIOR_2026-05-19.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md',
    'docs/audit/FILTERTUBE_STABILIZATION_FIX_ORDER_2026-05-19.md',
    'docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md'
  ].map(read);

  for (const phrase of [
    'not creator channel identity proof',
    'not playlist creator identity proof',
    'current-video metadata, not playlist header authority',
    'real playlist creator fixture is still required'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('playlist-panel-header-mix-creator-current-behavior.test.mjs'));
    assert.ok(ledger.includes('playlist-panel-header-mix-dom.html'));
    assert.match(ledger, /not creator channel identity proof|not playlist creator identity proof/);
    assert.match(ledger, /real playlist creator fixture is still required|creator fixture remains required/);
  }
});

test('future playlist panel header creator authority tokens are absent from runtime source today', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
