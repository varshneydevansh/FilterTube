import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'YT_MAIN_WATCH.html';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-html-embedded-playlist-endscreen-json.json';
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_HTML_EMBEDDED_PLAYLIST_ENDSCREEN_JSON_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'mainWatchHtmlEmbeddedJsonContract',
  'mainWatchHtmlEmbeddedPlaylistEndScreenDecisionReport',
  'mainWatchHtmlEmbeddedJsonDomWallBoundary',
  'mainWatchHtmlEmbeddedWhitelistFamilyReport',
  'mainWatchHtmlEmbeddedMapSideEffectReport',
  'mainWatchHtmlEmbeddedJsonFirstOptimizationBudget'
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

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function extractAssignedObjects(raw, name) {
  const needle = `var ${name} = `;
  const objects = [];
  let searchFrom = 0;

  while (true) {
    const assignmentIndex = raw.indexOf(needle, searchFrom);
    if (assignmentIndex === -1) break;

    let start = assignmentIndex + needle.length;
    while (/\s/.test(raw[start])) start += 1;

    let depth = 0;
    let inString = false;
    let escaped = false;
    let end = -1;

    for (let index = start; index < raw.length; index += 1) {
      const char = raw[index];
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
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end = index + 1;
          break;
        }
      }
    }

    assert.notEqual(end, -1, `could not find object end for ${name}`);
    const text = raw.slice(start, end);
    objects.push({
      start,
      end,
      text,
      bytes: Buffer.byteLength(text),
      sha256: crypto.createHash('sha256').update(text).digest('hex'),
      object: JSON.parse(text)
    });
    searchFrom = end;
  }

  return objects;
}

function walk(value, visit) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => walk(entry, visit));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    visit(key, child);
    walk(child, visit);
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
  return { fixture, input, output: plain(output), messages: plain(harness.messages) };
}

function watchNext(output) {
  return output.contents.twoColumnWatchNextResults;
}

function playlistIds(output) {
  return plain(watchNext(output).playlist.playlist.contents
    .map((entry) => entry.playlistPanelVideoRenderer.videoId));
}

function endScreenIds(output) {
  return plain(output.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results
    .map((entry) => entry.endScreenVideoRenderer.videoId));
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

test('YT_MAIN_WATCH embedded JSON audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not a DOM wall fixture/);
  assert.match(doc, /94627b77ac43fbcc45e6690d7934bd99077244f8156243289fa4add498a1be6c/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.rootPath, 'ytInitialData[1]');
  assert.equal(fixture.provenance.rendererType, 'watchHtmlEmbeddedPlaylistEndScreenJson');
  assert.deepEqual(fixture.provenance.rendererTypes, [
    'playlistPanelVideoRenderer',
    'endScreenVideoRenderer'
  ]);
  assert.equal(fixture.captureFixtureTraceability.releaseInputAllowed, false);
  assert.equal(lineCount(fixtureText), 215);
  assert.equal(Buffer.byteLength(fixtureText), 8768);
  assert.equal(sha256(fixturePath), '94627b77ac43fbcc45e6690d7934bd99077244f8156243289fa4add498a1be6c');
});

test('raw YT_MAIN_WATCH embedded assignment 1 is watch-next JSON, not rendered player DOM', () => {
  const raw = read(rawPath);
  const initialData = extractAssignedObjects(raw, 'ytInitialData');
  const embedded = initialData[1].object;

  assert.equal(lineCount(raw), 69613);
  assert.equal(Buffer.byteLength(raw), 7873780);
  assert.equal(sha256(rawPath), '3d6de64dc55e211790c1b555d90420fb6bdb47104cb7c38cb903a3dbc966160c');
  assert.equal(initialData.length, 2);
  assert.deepEqual(
    initialData.map(({ start, end, bytes, sha256: hash }) => ({ start, end, bytes, hash })),
    [
      {
        start: 920557,
        end: 3631119,
        bytes: 2714517,
        hash: '0fabab4c16be074cd627021557aa458567d07718709f8cd2442e94861e6c2fcf'
      },
      {
        start: 4505651,
        end: 7857979,
        bytes: 3356005,
        hash: '62961f85f1ca83bbe70cdc8e5424bb3751b1e7f9d18ed6c63308e12ca9f06cd9'
      }
    ]
  );
  assert.equal(countKey(embedded, 'playlistPanelVideoRenderer'), 26);
  assert.equal(countKey(embedded, 'endScreenVideoRenderer'), 12);
  assert.equal(countKey(embedded, 'compactAutoplayRenderer'), 0);
  assert.equal(countLiteral(raw, 'ytp-endscreen-content'), 0);
  assert.equal(countLiteral(raw, 'ytp-ce-element'), 0);
});

test('reduced embedded fixture pins playlist-panel and player-overlay end-screen sibling pairs', () => {
  const response = loadFixture().ytInitialData;

  assert.deepEqual(playlistIds(response), ['pcbnucHE3gU', '1U6WY_z8Vu8']);
  assert.deepEqual(endScreenIds(response), ['84kbG2ExdZs', '8Li0Tyeqlc4']);
  assert.match(JSON.stringify(response), /playlistPanelVideoRenderer/);
  assert.match(JSON.stringify(response), /endScreenVideoRenderer/);
  assert.doesNotMatch(JSON.stringify(response), /compactAutoplayRenderer/);
});

test('no-rule processing preserves embedded playlist and end-screen rows while queuing map side effects', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(output, input);
  assert.deepEqual(playlistIds(output), ['pcbnucHE3gU', '1U6WY_z8Vu8']);
  assert.deepEqual(endScreenIds(output), ['84kbG2ExdZs', '8Li0Tyeqlc4']);
  assert.deepEqual(messages, [
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id: 'UCVZ2A50--jZieMK_qyMd1Yw', handle: '@TronLegacyScore' }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateVideoChannelMap',
      payload: [
        { videoId: 'pcbnucHE3gU', channelId: 'UCm9VWKAFz0aXpuEHPHMae7w' },
        { videoId: '1U6WY_z8Vu8', channelId: 'UC1Pwa4nFvIPbtYVLcBGDpjA' },
        { videoId: '84kbG2ExdZs', channelId: 'UCm9VWKAFz0aXpuEHPHMae7w' },
        { videoId: '8Li0Tyeqlc4', channelId: 'UCVZ2A50--jZieMK_qyMd1Yw' }
      ],
      source: 'filter_logic'
    }
  ]);
});

test('blocklist channel removes matching embedded playlist and end-screen rows', () => {
  const { output } = runFixture({
    filterChannels: [{ id: 'UCm9VWKAFz0aXpuEHPHMae7w' }]
  });

  assert.deepEqual(playlistIds(output), ['1U6WY_z8Vu8']);
  assert.deepEqual(endScreenIds(output), ['8Li0Tyeqlc4']);
});

test('blocklist keyword removes only the matching embedded end-screen row', () => {
  const { output } = runFixture({
    filterKeywords: [{ pattern: 'Tron', flags: 'i' }]
  });

  assert.deepEqual(playlistIds(output), ['pcbnucHE3gU', '1U6WY_z8Vu8']);
  assert.deepEqual(endScreenIds(output), ['84kbG2ExdZs']);
});

test('whitelist channel mode preserves matching embedded rows and removes unsupported siblings', () => {
  const nyushaAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCm9VWKAFz0aXpuEHPHMae7w' }]
  }).output;
  const angelinaAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC1Pwa4nFvIPbtYVLcBGDpjA' }]
  }).output;

  assert.deepEqual(playlistIds(nyushaAllowed), ['pcbnucHE3gU']);
  assert.deepEqual(endScreenIds(nyushaAllowed), ['84kbG2ExdZs']);
  assert.deepEqual(playlistIds(angelinaAllowed), ['1U6WY_z8Vu8']);
  assert.deepEqual(endScreenIds(angelinaAllowed), []);
});

test('YT_MAIN_WATCH embedded JSON future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
  assert.match(runtime, /endScreenVideoRenderer: BASE_VIDEO_RULES/);
  assert.doesNotMatch(runtime, /compactAutoplayRenderer: BASE_VIDEO_RULES/);
});
