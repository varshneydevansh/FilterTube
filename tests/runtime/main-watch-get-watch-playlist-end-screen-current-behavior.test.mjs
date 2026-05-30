import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_GET_WATCH_PLAYLIST_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-get-watch-playlist-end-screen.json';
const rawPath = 'get_watch?prettyPrint=false.json';
const watchpagePath = 'watchpage.json';

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function byteSize(file) {
  return fs.statSync(path.join(repoRoot, file)).size;
}

function newlineCount(text) {
  return (text.match(/\n/g) || []).length;
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

function runFixture(settings = {}) {
  const fixture = loadFixture();
  const input = plain(fixture.watchNextResponse);
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { fixture, input, output, messages: harness.messages };
}

function playlistIds(output) {
  return plain(output.playlist.contents.map((entry) => entry.playlistPanelVideoRenderer.videoId));
}

function endScreenIds(output) {
  return plain(output.endScreen.results.map((entry) => entry.endScreenVideoRenderer.videoId));
}

function countToken(text, token) {
  return (text.match(new RegExp(token, 'g')) || []).length;
}

test('main watch get-watch audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = loadFixture();
  const raw = read(rawPath);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, byteSize(rawPath));
  assert.equal(fixture.provenance.sourceLines, newlineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'direct JSON array');
  assert.equal(fixture.provenance.rootPath, '1.watchNextResponse');
  assert.equal(fixture.provenance.rendererType, 'watchNextResponse');
  assert.deepEqual(fixture.provenance.rendererTypes, [
    'playlistPanelVideoRenderer',
    'endScreenVideoRenderer'
  ]);

  assert.ok(doc.includes('main-watch-get-watch-playlist-end-screen.json'));
  assert.ok(doc.includes(sha256(fixturePath)));
  assert.ok(doc.includes(sha256(rawPath)));
  assert.ok(doc.includes('watchpage.json'));
});

test('raw get-watch capture is direct JSON and watchpage.json remains a non-direct container warning', () => {
  const raw = JSON.parse(read(rawPath));
  const watchpage = read(watchpagePath);

  assert.equal(Array.isArray(raw), true);
  assert.equal(raw.length, 2);
  assert.ok(raw[1].watchNextResponse);
  assert.equal(countToken(read(rawPath), 'playlistPanelVideoRenderer'), 26);
  assert.equal(countToken(read(rawPath), 'endScreenVideoRenderer'), 9);
  assert.equal(countToken(read(rawPath), 'compactAutoplayRenderer'), 0);
  assert.equal(countToken(read(rawPath), 'videoSecondaryInfoRenderer'), 2);
  assert.equal(countToken(read(rawPath), 'videoOwnerRenderer'), 2);

  assert.throws(() => JSON.parse(watchpage), SyntaxError);
  assert.match(watchpage.slice(0, 200), /Kids vs Main Filter UX Consistency Audit/);
  assert.match(watchpage, /var ytInitialData = \{/);
  assert.match(watchpage, /"value": "FEwhat_to_watch"/);
});

test('reduced watch fixture carries playlist-panel and end-screen sibling pairs', () => {
  const fixture = loadFixture();
  const playlist = fixture.watchNextResponse.playlist.contents;
  const endScreen = fixture.watchNextResponse.endScreen.results;

  assert.deepEqual(playlist.map((entry) => entry.playlistPanelVideoRenderer.videoId), [
    'TUVcZfQe-Kw',
    'eVli-tstM5E'
  ]);
  assert.deepEqual(playlist.map((entry) => entry.playlistPanelVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId), [
    'UC-J-KZfRV8c13fOCkhXdLiQ',
    'UCPKWE1H6xhxwPlqUlKgHb_w'
  ]);
  assert.deepEqual(endScreen.map((entry) => entry.endScreenVideoRenderer.videoId), [
    'W3sBr9f0Il0',
    'NrNejxB91bA'
  ]);
  assert.deepEqual(endScreen.map((entry) => entry.endScreenVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId), [
    'UCXZBlY5to9iJRM3xPyHRwng',
    'UC7ZkJ5hZv6v0b-OfC2r68BA'
  ]);
});

test('watch playlist and end-screen rows pass through with no active rules', () => {
  const { input, output } = runFixture();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw', 'eVli-tstM5E']);
  assert.deepEqual(endScreenIds(output), ['W3sBr9f0Il0', 'NrNejxB91bA']);
});

test('blocklist removes matching playlist panel row while preserving nonmatching siblings', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UC-J-KZfRV8c13fOCkhXdLiQ' }]
  });

  assert.deepEqual(playlistIds(output), ['eVli-tstM5E']);
  assert.deepEqual(endScreenIds(output), ['W3sBr9f0Il0', 'NrNejxB91bA']);
});

test('blocklist removes matching end-screen row while preserving nonmatching siblings', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UCXZBlY5to9iJRM3xPyHRwng' }]
  });

  assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw', 'eVli-tstM5E']);
  assert.deepEqual(endScreenIds(output), ['NrNejxB91bA']);
});

test('whitelist mode is global across playlist and end-screen rows in the reduced watch response', () => {
  const playlistAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC-J-KZfRV8c13fOCkhXdLiQ' }]
  }).output;
  const endScreenAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCXZBlY5to9iJRM3xPyHRwng' }]
  }).output;

  assert.deepEqual(playlistIds(playlistAllowed), ['TUVcZfQe-Kw']);
  assert.deepEqual(endScreenIds(playlistAllowed), []);
  assert.deepEqual(playlistIds(endScreenAllowed), []);
  assert.deepEqual(endScreenIds(endScreenAllowed), ['W3sBr9f0Il0']);
});

test('watch fixture queues current learned-map side effects during no-rule processing', () => {
  const { messages } = runFixture();
  const channelMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  const videoMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');

  assert.deepEqual(plain(channelMapMessages), [{
    type: 'FilterTube_UpdateChannelMap',
    payload: [{
      id: 'UCXZBlY5to9iJRM3xPyHRwng',
      handle: '@ClassicalAtHome'
    }],
    source: 'filter_logic'
  }]);
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(plain(videoMapMessages[0]), {
    type: 'FilterTube_UpdateVideoChannelMap',
    payload: [
      { videoId: 'TUVcZfQe-Kw', channelId: 'UC-J-KZfRV8c13fOCkhXdLiQ' },
      { videoId: 'eVli-tstM5E', channelId: 'UCPKWE1H6xhxwPlqUlKgHb_w' },
      { videoId: 'W3sBr9f0Il0', channelId: 'UCXZBlY5to9iJRM3xPyHRwng' },
      { videoId: 'NrNejxB91bA', channelId: 'UC7ZkJ5hZv6v0b-OfC2r68BA' }
    ],
    source: 'filter_logic'
  });
});

test('main watch get-watch audit records future authority fields absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');

  for (const symbol of [
    'mainWatchGetWatchPlaylistEndScreenContract',
    'mainWatchGetWatchFixtureAdmissionReport',
    'mainWatchPlaylistPanelDecisionReport',
    'mainWatchEndScreenDecisionReport',
    'mainWatchWhitelistFamilyScopePolicy',
    'mainWatchVideoMapSideEffectReport',
    'mainWatchRawShapeClassifier',
    'mainWatchCompactAutoplayFixtureGate',
    'mainWatchDomWallParityReport',
    'mainWatchJsonFirstOptimizationBudget'
  ]) {
    assert.ok(doc.includes(symbol), `doc should name ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} must remain absent from product runtime source`);
  }
});
