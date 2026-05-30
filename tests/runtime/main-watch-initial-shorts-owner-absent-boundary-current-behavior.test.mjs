import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_INITIAL_SHORTS_OWNER_ABSENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-initial-lockup-shorts-json.json';
const rawPath = 'YT_MAIN.json';

const futureAuthorityTokens = [
  'mainWatchInitialShortsOwnerAbsentContract',
  'mainWatchInitialShortsOwnerDecisionReport',
  'mainWatchInitialShortsChannelAuthorityPolicy',
  'mainWatchInitialShortsWhitelistIdentityPolicy',
  'mainWatchInitialShortsMapSideEffectBudget',
  'shortsLockupOwnerAbsentJsonFirstGate',
  'mainWatchInitialShortsOwnerAbsentMetricArtifact'
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

function shortsShelf(response) {
  return response.engagementPanels[0].engagementPanelSectionListRenderer.content
    .structuredDescriptionContentRenderer.items[0].reelShelfRenderer;
}

function isolatedShelfInput() {
  return {
    contents: [
      {
        reelShelfRenderer: plain(shortsShelf(loadFixture().response))
      }
    ]
  };
}

function shelfItemsFromInput(input) {
  return input.contents[0].reelShelfRenderer.items;
}

function shelfVideoIds(input) {
  return shelfItemsFromInput(input)
    .map((item) => item.shortsLockupViewModel?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId)
    .filter(Boolean);
}

function runShelf(overrides = {}) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    isolatedShelfInput(),
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

test('Main watch initial Shorts owner-absent audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /negative authority boundary/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.rendererType, 'watchInitialLockupAndShortsJson');
  assert.equal(fixture.captureFixtureTraceability.releaseInputAllowed, false);
  assert.equal(lineCount(fixtureText), 296);
  assert.equal(Buffer.byteLength(fixtureText), 12468);
  assert.equal(sha256(fixturePath), '274f7b1f766aa43f7194fe0f8c601ac1316f713c43b1aff9a1a1e73b6128d1bb');
});

test('reduced watch-initial Shorts shelf has title and video id but no owner identity fields', () => {
  const shelf = shortsShelf(loadFixture().response);
  const items = shelf.items.map((item) => item.shortsLockupViewModel);

  assert.equal(shelf.title.runs[0].text, 'Shorts remixing this video');
  assert.deepEqual(items.map((item) => item.onTap.innertubeCommand.reelWatchEndpoint.videoId), [
    '_NsY2tXTveU',
    'lJ4Ty2Xos08'
  ]);
  assert.deepEqual(items.map((item) => item.overlayMetadata.primaryText.content), [
    "Prepared a Big Tasty better than McDonald's | How to make a tasty burger at home",
    'the most FUN WATERMELON project'
  ]);

  for (const item of items) {
    assert.equal(typeof item.accessibilityText, 'string');
    assert.doesNotMatch(JSON.stringify(item), /browseEndpoint/);
    assert.doesNotMatch(JSON.stringify(item), /canonicalBaseUrl/);
    assert.doesNotMatch(JSON.stringify(item), /belowThumbnailMetadata/);
    assert.doesNotMatch(JSON.stringify(item), /decoratedAvatarViewModel/);
    assert.doesNotMatch(JSON.stringify(item), /ownerText/);
    assert.doesNotMatch(JSON.stringify(item), /shortBylineText/);
    assert.doesNotMatch(JSON.stringify(item), /longBylineText/);
    assert.doesNotMatch(JSON.stringify(item), /channelId/);
    assert.doesNotMatch(JSON.stringify(item), /channelName/);
  }
});

test('isolated owner-absent Shorts shelf preserves channel blocklist rows and emits no map side effects', () => {
  const { output, messages } = runShelf({
    filterChannels: [{ id: 'UCFAKEOWNER00000000000000' }]
  });

  assert.deepEqual(shelfVideoIds(output), ['_NsY2tXTveU', 'lJ4Ty2Xos08']);
  assert.equal(messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap').length, 0);
  assert.equal(messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap').length, 0);
});

test('isolated owner-absent Shorts shelf still supports keyword filtering and hideAllShorts', () => {
  const keywordRun = runShelf({ filterKeywords: [{ pattern: 'watermelon', flags: 'i' }] });
  assert.deepEqual(shelfVideoIds(keywordRun.output), ['_NsY2tXTveU']);
  assert.equal(keywordRun.messages.length, 0);

  const hideAllShortsRun = runShelf({ hideAllShorts: true });
  assert.deepEqual(shelfVideoIds(hideAllShortsRun.output), []);
  assert.equal(hideAllShortsRun.messages.length, 0);
});

test('isolated owner-absent Shorts shelf whitelist fails closed for channel identity but allows keywords', () => {
  const channelRun = runShelf({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCFAKEOWNER00000000000000' }]
  });
  assert.deepEqual(shelfVideoIds(channelRun.output), []);
  assert.equal(channelRun.messages.length, 0);

  const keywordRun = runShelf({
    listMode: 'whitelist',
    whitelistKeywords: [{ pattern: 'Big Tasty', flags: 'i' }]
  });
  assert.deepEqual(shelfVideoIds(keywordRun.output), ['_NsY2tXTveU']);
  assert.equal(keywordRun.messages.length, 0);
});

test('Main watch initial Shorts owner-absent boundary indexes and future symbols stay audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const runtimeResults = read('docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md');

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const indexPath of indexPaths) {
    assert.match(read(indexPath), /Main watch initial Shorts owner-absent boundary addendum/);
    assert.match(read(indexPath), /main-watch-initial-shorts-owner-absent-boundary-current-behavior\.test\.mjs/);
  }

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
