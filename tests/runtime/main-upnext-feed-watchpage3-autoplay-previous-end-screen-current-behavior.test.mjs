import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE3_AUTOPLAY_PREVIOUS_END_SCREEN_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json';
const rawPath = 'YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json';

const futureAuthorityTokens = [
  'mainUpnextWatchpage3YtInitialDataContract',
  'mainUpnextWatchpage3PreviousEndpointPolicy',
  'mainUpnextWatchpage3PlayerOverlayEndScreenParityReport',
  'mainUpnextWatchpage3WhitelistEndpointDecisionReport',
  'mainUpnextWatchpage3RawShapeExtractor',
  'mainUpnextWatchpage3EndpointSideEffectReport',
  'mainUpnextWatchpage3JsonFirstOptimizationBudget'
];

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

function countToken(text, token) {
  return (text.match(new RegExp(token, 'g')) || []).length;
}

function extractYtInitialData(source) {
  const assignmentStart = source.indexOf('var ytInitialData =');
  assert.notEqual(assignmentStart, -1);
  const braceStart = source.indexOf('{', assignmentStart);
  assert.notEqual(braceStart, -1);

  let depth = 0;
  let inString = false;
  let quote = '';
  let escaped = false;

  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        inString = false;
        quote = '';
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const json = source.slice(braceStart, index + 1);
        return {
          assignmentStart,
          braceStart,
          braceEnd: index,
          extractedBytes: Buffer.byteLength(json),
          data: JSON.parse(json)
        };
      }
    }
  }

  assert.fail('unterminated ytInitialData assignment');
}

function walk(value, visit, propertyPath = []) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visit, propertyPath.concat(index)));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    visit(key, child, propertyPath.concat(key));
    walk(child, visit, propertyPath.concat(key));
  }
}

function countKey(value, targetKey) {
  let count = 0;
  walk(value, (key) => {
    if (key === targetKey) count += 1;
  });
  return count;
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
  const input = plain(fixture.ytInitialData);
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { fixture, input, output, messages: harness.messages };
}

function watchNext(output) {
  return output.contents.twoColumnWatchNextResults;
}

function playlistIds(output) {
  return plain(watchNext(output).playlist.playlist.contents.map((entry) => entry.playlistPanelVideoRenderer.videoId));
}

function endScreenIds(output) {
  return plain(output.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results
    .map((entry) => entry.endScreenVideoRenderer.videoId));
}

function autoplayWatchIds(output) {
  return plain(watchNext(output).autoplay.autoplay.sets
    .map((entry) => entry.autoplayVideo?.watchEndpoint?.videoId)
    .filter(Boolean));
}

function nextButtonWatchIds(output) {
  return plain(watchNext(output).autoplay.autoplay.sets
    .map((entry) => entry.nextButtonVideo?.watchEndpoint?.videoId)
    .filter(Boolean));
}

function previousButtonWatchIds(output) {
  return plain(watchNext(output).autoplay.autoplay.sets
    .map((entry) => entry.previousButtonVideo?.watchEndpoint?.videoId)
    .filter(Boolean));
}

function modifiedPlaylistIds(output) {
  return plain(watchNext(output).autoplay.autoplay.modifiedSets.map((entry) => [
    entry.autoplayVideo.watchPlaylistEndpoint.playlistId,
    entry.nextButtonVideo.watchPlaylistEndpoint.playlistId,
    entry.previousButtonVideo.watchPlaylistEndpoint.playlistId
  ]));
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

test('watchpage3 audit doc and reduced fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = loadFixture();
  const raw = read(rawPath);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, byteSize(rawPath));
  assert.equal(fixture.provenance.sourceLines, newlineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'prose plus var ytInitialData assignment');
  assert.equal(fixture.provenance.rootPath, 'ytInitialData');
  assert.equal(fixture.provenance.rendererType, 'watchpage3AutoplayPreviousEndpoint');
  assert.deepEqual(fixture.provenance.rendererTypes, [
    'playlistPanelVideoRenderer',
    'autoplayVideo',
    'nextButtonVideo',
    'previousButtonVideo',
    'endScreenVideoRenderer'
  ]);

  assert.ok(doc.includes('main-upnext-feed-watchpage3-autoplay-previous-end-screen.json'));
  assert.ok(doc.includes('cd7bea15c5bc0b5dbac5ef78d9f8046de8153a83d4adb44ce2961c41c1062b1a'));
  assert.ok(doc.includes('previousButtonVideo` is removed'));
});

test('raw watchpage3 capture is an embedded ytInitialData container with previous endpoint evidence', () => {
  const raw = read(rawPath);
  const extracted = extractYtInitialData(raw);
  const data = extracted.data;

  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.match(raw.slice(0, 80), /here are YtInitail\*/);
  assert.equal(extracted.assignmentStart, 23);
  assert.equal(extracted.braceStart, 43);
  assert.equal(extracted.braceEnd, 5942993);
  assert.equal(extracted.extractedBytes, 5945215);

  assert.ok(data.contents.twoColumnWatchNextResults);
  assert.equal(data.currentVideoEndpoint.watchEndpoint.videoId, 'mqgEYRtWMJU');
  assert.equal(data.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.length, 12);

  assert.equal(countToken(raw, 'autoplayVideo'), 2);
  assert.equal(countToken(raw, 'nextButtonVideo'), 2);
  assert.equal(countToken(raw, 'previousButtonVideo'), 2);
  assert.equal(countToken(raw, 'compactAutoplayRenderer'), 0);
  assert.equal(countToken(raw, 'playlistPanelVideoRenderer'), 29);
  assert.equal(countToken(raw, 'endScreenVideoRenderer'), 12);
  assert.equal(countKey(data, 'playlistPanelVideoRenderer'), 28);
  assert.equal(countKey(data, 'endScreenVideoRenderer'), 11);

  const autoplay = data.contents.twoColumnWatchNextResults.autoplay.autoplay.sets[0];
  assert.equal(autoplay.autoplayVideo.watchEndpoint.videoId, 'UrAhnndvrSU');
  assert.equal(autoplay.nextButtonVideo.watchEndpoint.videoId, 'UrAhnndvrSU');
  assert.equal(autoplay.previousButtonVideo.watchEndpoint.videoId, 'TSHg9Kg_ciM');
});

test('reduced watchpage3 fixture ties playlist rows, endpoints, and player overlay end screen', () => {
  const response = loadFixture().ytInitialData;

  assert.deepEqual(playlistIds(response), ['TSHg9Kg_ciM', 'mqgEYRtWMJU', 'UrAhnndvrSU']);
  assert.deepEqual(endScreenIds(response), ['Xq0joZ24D9Y', '8Li0Tyeqlc4']);
  assert.deepEqual(autoplayWatchIds(response), ['UrAhnndvrSU']);
  assert.deepEqual(nextButtonWatchIds(response), ['UrAhnndvrSU']);
  assert.deepEqual(previousButtonWatchIds(response), ['TSHg9Kg_ciM']);
  assert.deepEqual(modifiedPlaylistIds(response), [['RDMM', 'RDMM', 'RDMM']]);
  assert.equal(response.currentVideoEndpoint.watchEndpoint.videoId, 'mqgEYRtWMJU');
});

test('watchpage3 fixture passes through with no active rules while queuing learned row side effects', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(playlistIds(output), ['TSHg9Kg_ciM', 'mqgEYRtWMJU', 'UrAhnndvrSU']);
  assert.deepEqual(endScreenIds(output), ['Xq0joZ24D9Y', '8Li0Tyeqlc4']);

  const videoMapPayloads = messages
    .filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap')
    .flatMap((message) => message.payload);
  assert.deepEqual(plain(videoMapPayloads.map((entry) => entry.videoId)), [
    'TSHg9Kg_ciM',
    'mqgEYRtWMJU',
    'UrAhnndvrSU',
    'Xq0joZ24D9Y',
    '8Li0Tyeqlc4'
  ]);
});

test('endpoint-only autoplay and previous-button objects pass through without map side effects', () => {
  const fixture = loadFixture();
  const input = {
    contents: {
      twoColumnWatchNextResults: {
        autoplay: plain(fixture.ytInitialData.contents.twoColumnWatchNextResults.autoplay)
      }
    }
  };
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(), fixturePath);
  harness.flushTimers();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(autoplayWatchIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(nextButtonWatchIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(previousButtonWatchIds(output), ['TSHg9Kg_ciM']);
  assert.deepEqual(plain(harness.messages), []);
});

test('blocklist channel removes matching playlist, end-screen rows, and matching autoplay endpoints', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UCUhkVZeSoGkZefR7sDRQB5Q' }]
  });

  assert.deepEqual(playlistIds(output), ['TSHg9Kg_ciM', 'mqgEYRtWMJU']);
  assert.deepEqual(endScreenIds(output), ['8Li0Tyeqlc4']);
  assert.deepEqual(autoplayWatchIds(output), []);
  assert.deepEqual(nextButtonWatchIds(output), []);
  assert.deepEqual(previousButtonWatchIds(output), ['TSHg9Kg_ciM']);
});

test('blocklist previous row removes visible playlist sibling and previous endpoint', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UCdIuLHQyQiwqud2WpTgdCkg' }]
  });

  assert.deepEqual(playlistIds(output), ['mqgEYRtWMJU', 'UrAhnndvrSU']);
  assert.deepEqual(endScreenIds(output), ['Xq0joZ24D9Y', '8Li0Tyeqlc4']);
  assert.deepEqual(previousButtonWatchIds(output), []);
});

test('whitelist nonmatch removes supported rows and endpoint-only watch controls', () => {
  const { output } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC-does-not-match' }]
  });

  assert.deepEqual(playlistIds(output), []);
  assert.deepEqual(endScreenIds(output), []);
  assert.deepEqual(plain(watchNext(output).autoplay.autoplay.sets), []);
});

test('whitelist match preserves supported Stephen Barton rows and allowed endpoints only', () => {
  const { output } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCUhkVZeSoGkZefR7sDRQB5Q' }]
  });

  assert.deepEqual(playlistIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(endScreenIds(output), ['Xq0joZ24D9Y']);
  assert.deepEqual(autoplayWatchIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(nextButtonWatchIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(previousButtonWatchIds(output), []);
});

test('blocklist keyword proves row authority but not autoplay endpoint authority', () => {
  const { output } = runFixture({
    filterKeywords: [keyword('Jumpmaster')]
  });

  assert.deepEqual(playlistIds(output), ['TSHg9Kg_ciM', 'mqgEYRtWMJU']);
  assert.deepEqual(endScreenIds(output), ['Xq0joZ24D9Y', '8Li0Tyeqlc4']);
  assert.deepEqual(autoplayWatchIds(output), ['UrAhnndvrSU']);
  assert.deepEqual(nextButtonWatchIds(output), ['UrAhnndvrSU']);
});

test('end-screen settings remove watch autoplay endpoint sets directly', () => {
  const cardsRun = runFixture({ hideEndscreenCards: true });
  const videowallRun = runFixture({ hideEndscreenVideowall: true });

  assert.deepEqual(plain(watchNext(cardsRun.output).autoplay.autoplay.sets), []);
  assert.deepEqual(plain(watchNext(cardsRun.output).autoplay.autoplay.modifiedSets), []);
  assert.deepEqual(plain(watchNext(videowallRun.output).autoplay.autoplay.sets), []);
  assert.deepEqual(plain(watchNext(videowallRun.output).autoplay.autoplay.modifiedSets), []);
});

test('product source now has direct previous/autoplay endpoint authority outside renderer rules', () => {
  const filter = read('js/filter_logic.js');
  const directRules = sliceBetween(filter, 'const FILTER_RULES = {', 'videoWithContextRenderer: {');
  const autoplayEndpointMethods = sliceBetween(filter, '_extractAutoplayEndpointVideoId(endpoint) {', '        _regexMatches(regex, text) {');

  for (const token of ['autoplayVideo', 'nextButtonVideo', 'previousButtonVideo', 'compactAutoplayRenderer']) {
    assert.doesNotMatch(directRules, new RegExp(token));
  }
  for (const token of ['autoplayVideo', 'nextButtonVideo', 'previousButtonVideo']) {
    assert.match(filter, new RegExp(token));
  }
});

test('future watchpage3 endpoint reporting symbols remain absent from product runtime source', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
