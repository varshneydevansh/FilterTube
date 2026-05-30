import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'playlist.json';
const fixturePath = 'tests/runtime/fixtures/captures/playlist-json-player-metadata.json';
const compactRadioFixturePath = 'tests/runtime/fixtures/captures/main-compact-radio-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_PLAYLIST_JSON_PLAYER_METADATA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';

const futureAuthorityTokens = [
  'playlistJsonPlayerMetadataBoundaryContract',
  'playlistJsonPlayerMetadataDecisionReport',
  'playlistJsonMixedFragmentClassifier',
  'playlistJsonCurrentVideoOwnerPolicy',
  'playlistJsonCreatorIdentityPromotionGate',
  'playlistJsonPlayerMetadataSideEffectReport',
  'playlistJsonPlayerMetadataJsonFirstAuthorityGate'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(read(file)).digest('hex');
}

function lineCount(text) {
  const newlines = text.match(/\r?\n/g);
  return newlines ? newlines.length : 0;
}

function topLevelJsonFragments(text) {
  const fragments = [];
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === '}') {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const fragmentText = text.slice(start, index + 1);
        fragments.push({
          start,
          end: index + 1,
          line: text.slice(0, start).split('\n').length,
          text: fragmentText,
          bytes: Buffer.byteLength(fragmentText),
          sha256: crypto.createHash('sha256').update(fragmentText).digest('hex')
        });
        start = -1;
      }
    }
  }

  return fragments;
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
    contentFilters: {
      duration: { enabled: false },
      uploadDate: { enabled: false },
      uppercase: { enabled: false }
    },
    categoryFilters: { enabled: false, selected: [] },
    ...overrides
  };
}

function runFixture(overrides = {}) {
  const fixture = loadFixture();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(fixture.response),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { fixture, output: plain(output), messages: plain(harness.messages) };
}

function endscreenStyles(response) {
  return response.endscreen.endscreenRenderer.elements
    .map((entry) => entry.endscreenElementRenderer.style);
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

test('playlist.json player metadata boundary doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /current-video metadata, not playlist creator authority/);
  assert.match(doc, /not creator channel identity proof for the playlist/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.fragmentIndex, 1);
  assert.equal(fixture.provenance.fragmentStartLine, 288);
  assert.equal(fixture.provenance.fragmentBytes, 148701);
  assert.equal(fixture.provenance.fragmentSha256, 'e0798e02cc864bed06899c5c6ab94a3900c6050c7baa494edc14d7822b5aa72a');
  assert.equal(fixture.provenance.rendererType, 'playlistPlayerMetadataFragment');
  assert.equal(fixture.provenance.route, 'watch/mix');
  assert.equal(fixture.captureFixtureTraceability.releaseInputAllowed, false);
  assert.equal(lineCount(fixtureText), 181);
  assert.equal(Buffer.byteLength(fixtureText), 6067);
  assert.equal(sha256(fixturePath), 'c3f1134676f5ea96cb2dadf6b757ef96c607d334372fe31b2bea4eb4f616369b');
});

test('raw playlist.json is a prose-prefaced mixed capture with compact radio and player fragments', () => {
  const raw = read(rawPath);

  assert.equal(lineCount(raw), 3609);
  assert.equal(Buffer.byteLength(raw), 165443);
  assert.equal(sha256(rawPath), 'f5766312bdddcceb20ecd2a4b54045843dfab89108b75c2f5bc8a0ee368d4ce5');
  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.match(raw.slice(0, 80), /YouTube Generated Mix Card JSON/);
  assert.match(raw, /var ytInitialPlayerResponse =/);

  const fragments = topLevelJsonFragments(raw);
  assert.equal(fragments.length, 2);
  assert.equal(fragments[0].line, 3);
  assert.equal(fragments[0].bytes, 16485);
  assert.equal(fragments[0].sha256, '52b52269372f0c9160cc33362dcc6d1c4977be650b1da78848d76799f79e5450');
  assert.equal(fragments[1].line, 288);
  assert.equal(fragments[1].bytes, 148701);
  assert.equal(fragments[1].sha256, 'e0798e02cc864bed06899c5c6ab94a3900c6050c7baa494edc14d7822b5aa72a');
});

test('raw playlist player fragment has current-video owner fields and no playlist-panel creator renderer', () => {
  const player = JSON.parse(topLevelJsonFragments(read(rawPath))[1].text);

  assert.equal(player.videoDetails.videoId, 'Pkh8UtuejGw');
  assert.equal(player.videoDetails.channelId, 'UC4-TgOSMJHn-LtY4zCzbQhw');
  assert.equal(player.videoDetails.author, 'ShawnMendesVEVO');
  assert.equal(player.microformat.playerMicroformatRenderer.ownerProfileUrl, 'http://www.youtube.com/@shawnmendesvevo');
  assert.equal(player.microformat.playerMicroformatRenderer.externalChannelId, 'UC4-TgOSMJHn-LtY4zCzbQhw');
  assert.equal(player.microformat.playerMicroformatRenderer.ownerChannelName, 'ShawnMendesVEVO');
  assert.equal(player.microformat.playerMicroformatRenderer.externalVideoId, 'Pkh8UtuejGw');
  assert.equal(countKey(player, 'videoDetails'), 1);
  assert.equal(countKey(player, 'playerMicroformatRenderer'), 1);
  assert.equal(countKey(player, 'cardRenderer'), 1);
  assert.equal(countKey(player, 'endscreenElementRenderer'), 3);
  assert.equal(countKey(player, 'playlistPanelRenderer'), 0);
  assert.equal(countKey(player, 'playlistPanelVideoRenderer'), 0);
  assert.equal(countKey(player, 'playlistHeaderRenderer'), 0);
  assert.equal(countKey(player, 'compactAutoplayRenderer'), 0);
});

test('reduced playlist player metadata fixture keeps metadata separate from compact radio creator gaps', () => {
  const fixture = loadFixture();
  const compactRadio = JSON.parse(read(compactRadioFixturePath)).renderer;
  const compactRadioText = JSON.stringify(compactRadio);

  assert.equal(fixture.response.videoDetails.videoId, 'Pkh8UtuejGw');
  assert.equal(fixture.response.videoDetails.channelId, 'UC4-TgOSMJHn-LtY4zCzbQhw');
  assert.equal(fixture.response.microformat.playerMicroformatRenderer.ownerChannelName, 'ShawnMendesVEVO');
  assert.equal(fixture.response.microformat.playerMicroformatRenderer.embed.iframeUrl, 'https://www.youtube.com/embed/Pkh8UtuejGw?list=RDUc8KFRqO3IM');
  assert.deepEqual(endscreenStyles(fixture.response), ['CHANNEL', 'PLAYLIST', 'VIDEO']);

  assert.match(compactRadioText, /RDEPo5wWmKEaI/);
  assert.match(compactRadioText, /"YouTube"/);
  assert.doesNotMatch(compactRadioText, /channelId|externalChannelId|ownerChannelName|ownerProfileUrl/);
});

test('no-rule and disabled modes preserve playlist player metadata while queuing owner/meta side effects', () => {
  for (const settings of [baseSettings(), baseSettings({ enabled: false })]) {
    const { fixture, output, messages } = runFixture(settings);
    assert.deepEqual(output, fixture.response);
    assert.deepEqual(messages, [
      {
        type: 'FilterTube_UpdateChannelMap',
        payload: [{ id: 'UC4-TgOSMJHn-LtY4zCzbQhw', handle: '@shawnmendesvevo' }],
        source: 'filter_logic'
      },
      {
        type: 'FilterTube_UpdateVideoChannelMap',
        payload: [{ videoId: 'Pkh8UtuejGw', channelId: 'UC4-TgOSMJHn-LtY4zCzbQhw' }],
        source: 'filter_logic'
      },
      {
        type: 'FilterTube_UpdateVideoMetaMap',
        payload: [{
          videoId: 'Pkh8UtuejGw',
          lengthSeconds: '206',
          publishDate: '2019-06-20T20:57:42-07:00',
          uploadDate: '2019-06-20T20:57:42-07:00',
          category: 'Music'
        }],
        source: 'filter_logic'
      }
    ]);
  }
});

test('blocklist and whitelist rules do not remove playlist player metadata rows today', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'Senorita', flags: 'i' }] });
  assert.deepEqual(keywordRun.output, keywordRun.fixture.response);
  assert.deepEqual(endscreenStyles(keywordRun.output), ['CHANNEL', 'PLAYLIST', 'VIDEO']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UC4-TgOSMJHn-LtY4zCzbQhw' }] });
  assert.deepEqual(channelRun.output, channelRun.fixture.response);
  assert.deepEqual(endscreenStyles(channelRun.output), ['CHANNEL', 'PLAYLIST', 'VIDEO']);

  const whitelistRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCdoesnotmatch000000000000' }]
  });
  assert.deepEqual(whitelistRun.output, whitelistRun.fixture.response);
  assert.deepEqual(endscreenStyles(whitelistRun.output), ['CHANNEL', 'PLAYLIST', 'VIDEO']);
});

test('playlist JSON player metadata boundary is linked from ledgers without closing creator authority', () => {
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
    'current-video metadata, not playlist creator authority',
    'not creator channel identity proof for the playlist',
    'compact radio fragment remains display-only YouTube byline proof',
    'playlist creator fixture remains required'
  ]) {
    assert.ok(doc.includes(phrase), `missing doc phrase ${phrase}`);
  }

  for (const ledger of ledgers) {
    assert.ok(ledger.includes(docPath), `ledger should cite ${docPath}`);
    assert.ok(ledger.includes('playlist-json-player-metadata-boundary-current-behavior.test.mjs'));
    assert.ok(ledger.includes('playlist-json-player-metadata.json'));
    assert.match(ledger, /current-video metadata, not playlist creator authority|not creator channel identity proof for the playlist/);
    assert.match(ledger, /playlist creator fixture remains required|real playlist creator fixture is still required/);
  }
});

test('future playlist JSON player metadata authority tokens are absent from runtime source today', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
