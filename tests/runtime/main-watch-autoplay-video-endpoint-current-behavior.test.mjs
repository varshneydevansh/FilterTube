import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_AUTOPLAY_VIDEO_ENDPOINT_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-autoplay-video-endpoint.json';
const rawPath = 'get_watch?prettyPrint=false.json';

const futureAuthorityTokens = [
  'mainWatchAutoplayVideoEndpointContract',
  'mainWatchAutoplayEndpointDecisionReport',
  'mainWatchAutoplayEndpointWhitelistPolicy',
  'mainWatchAutoplayEndpointBlocklistPolicy',
  'mainWatchAutoplayEndpointSideEffectBudget',
  'mainWatchAutoplayEndpointRendererInventoryPolicy',
  'mainWatchAutoplayEndpointMetricArtifact'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function newlineCount(text) {
  return (text.match(/\n/g) || []).length;
}

function countToken(text, token) {
  return (text.match(new RegExp(token, 'g')) || []).length;
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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

function autoplayWatchIds(output) {
  return plain(output.autoplay.autoplay.sets.map((entry) => entry.autoplayVideo.watchEndpoint.videoId));
}

function nextButtonWatchIds(output) {
  return plain(output.autoplay.autoplay.sets.map((entry) => entry.nextButtonVideo.watchEndpoint.videoId));
}

function modifiedAutoplayPlaylistIds(output) {
  return plain(output.autoplay.autoplay.modifiedSets.map((entry) => entry.autoplayVideo.watchPlaylistEndpoint.playlistId));
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

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return source.slice(start, end);
}

test('main watch autoplay endpoint audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = loadFixture();
  const raw = read(rawPath);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, fs.statSync(path.join(repoRoot, rawPath)).size);
  assert.equal(fixture.provenance.sourceLines, newlineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'direct JSON array');
  assert.equal(fixture.provenance.rootPath, '1.watchNextResponse.contents.twoColumnWatchNextResults');
  assert.equal(fixture.provenance.rendererType, 'watchAutoplayEndpoint');
  assert.deepEqual(fixture.provenance.rendererTypes, [
    'playlistPanelVideoRenderer',
    'autoplayVideo',
    'nextButtonVideo'
  ]);

  assert.ok(doc.includes('main-watch-autoplay-video-endpoint.json'));
  assert.ok(doc.includes('578230df9dc00dfebc8ac0ec4cc1ec2f796abf7cf4584c9e4ece67856fdf90e0'));
  assert.ok(doc.includes('endpoint objects rather than'));
});

test('raw get-watch capture has autoplay endpoint objects but no compactAutoplayRenderer', () => {
  const raw = read(rawPath);
  const parsed = JSON.parse(raw);

  assert.equal(Array.isArray(parsed), true);
  assert.equal(parsed.length, 2);
  assert.equal(countToken(raw, 'autoplayVideo'), 2);
  assert.equal(countToken(raw, 'nextButtonVideo'), 2);
  assert.equal(countToken(raw, 'previousButtonVideo'), 0);
  assert.equal(countToken(raw, 'compactAutoplayRenderer'), 0);
  assert.equal(countToken(raw, 'playlistPanelVideoRenderer'), 26);
  assert.equal(countToken(raw, 'endScreenVideoRenderer'), 9);
  assert.equal(
    parsed[1].watchNextResponse.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0].autoplayVideo.watchEndpoint.videoId,
    'TUVcZfQe-Kw'
  );
});

test('reduced watch autoplay fixture ties a supported playlist row to endpoint autoplay for the same video', () => {
  const fixture = loadFixture();
  const response = fixture.watchNextResponse;

  assert.deepEqual(playlistIds(response), ['TUVcZfQe-Kw']);
  assert.deepEqual(autoplayWatchIds(response), ['TUVcZfQe-Kw']);
  assert.deepEqual(nextButtonWatchIds(response), ['TUVcZfQe-Kw']);
  assert.deepEqual(modifiedAutoplayPlaylistIds(response), ['RD41ZY18JqI2A']);
  assert.equal(
    response.playlist.contents[0].playlistPanelVideoRenderer.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId,
    'UC-J-KZfRV8c13fOCkhXdLiQ'
  );
});

test('watch autoplay endpoint fixture passes through with no active rules and queues only playlist-row map side effect', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(autoplayWatchIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(plain(messages), [{
    type: 'FilterTube_UpdateVideoChannelMap',
    payload: [{ videoId: 'TUVcZfQe-Kw', channelId: 'UC-J-KZfRV8c13fOCkhXdLiQ' }],
    source: 'filter_logic'
  }]);
});

test('endpoint-only autoplay objects pass through and queue no map side effects', () => {
  const fixture = loadFixture();
  const input = { autoplay: plain(fixture.watchNextResponse.autoplay) };
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(), fixturePath);
  harness.flushTimers();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(plain(harness.messages), []);
});

test('blocklist keyword removes supported playlist row while autoplay endpoint still points to same video', () => {
  const { output } = runFixture({
    filterKeywords: [keyword('Dua')]
  });

  assert.deepEqual(playlistIds(output), []);
  assert.deepEqual(autoplayWatchIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(nextButtonWatchIds(output), ['TUVcZfQe-Kw']);
});

test('blocklist channel removes supported playlist row while autoplay endpoint still points to same video', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UC-J-KZfRV8c13fOCkhXdLiQ' }]
  });

  assert.deepEqual(playlistIds(output), []);
  assert.deepEqual(autoplayWatchIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(nextButtonWatchIds(output), ['TUVcZfQe-Kw']);
});

test('whitelist nonmatch removes supported playlist row while endpoint-only autoplay remains', () => {
  const { output } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC-does-not-match' }]
  });

  assert.deepEqual(playlistIds(output), []);
  assert.deepEqual(autoplayWatchIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(nextButtonWatchIds(output), ['TUVcZfQe-Kw']);
});

test('whitelist match preserves playlist row but endpoint autoplay still lacks explicit allow authority', () => {
  const { output } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC-J-KZfRV8c13fOCkhXdLiQ' }]
  });

  assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(autoplayWatchIds(output), ['TUVcZfQe-Kw']);
  assert.deepEqual(nextButtonWatchIds(output), ['TUVcZfQe-Kw']);
});

test('product source has no direct autoplay endpoint renderer authority today', () => {
  const filter = read('js/filter_logic.js');
  const domFallback = read('js/content/dom_fallback.js');
  const directRules = sliceBetween(filter, 'const FILTER_RULES = {', 'videoWithContextRenderer: {');
  const nestedKeys = sliceBetween(filter, 'const knownKeys = [', '];');
  const autoplayCss = sliceBetween(domFallback, 'if (settings.disableAutoplay) {', 'if (settings.disableAnnotations) {');

  for (const token of ['autoplayVideo', 'nextButtonVideo', 'previousButtonVideo', 'compactAutoplayRenderer']) {
    assert.doesNotMatch(directRules, new RegExp(token));
    assert.doesNotMatch(nestedKeys, new RegExp(token));
  }

  assert.match(autoplayCss, /button\[data-tooltip-target-id="ytp-autonav-toggle-button"\]/);
  assert.match(autoplayCss, /\.autonav-endscreen/);
  assert.doesNotMatch(autoplayCss, /autoplayVideo|nextButtonVideo|watchEndpoint/);
});

test('future Main watch autoplay endpoint authority is absent from runtime source today', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
