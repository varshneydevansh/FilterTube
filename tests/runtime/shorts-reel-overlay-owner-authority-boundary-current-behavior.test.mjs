import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_SHORTS_REEL_OVERLAY_OWNER_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-reel-player-overlay-renderer.json';
const rawPath = 'reel_item_watch?prettyPrint=False.JSON';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const owner = {
  id: 'UC-6YsZ1GcOMIehkb8eHioUQ',
  handle: '@ElectricRevolution',
  canonical: '/@ElectricRevolution/shorts'
};

const futureAuthorityTokens = [
  'shortsReelOverlayOwnerAuthorityContract',
  'shortsReelOverlayDecisionReport',
  'reelPlayerOverlayRendererFilterRulePromotion',
  'shortsReelOverlayMetapanelOwnerPolicy',
  'shortsReelOverlayWhitelistPolicy',
  'shortsReelOverlayVideoIdJoinPolicy',
  'shortsReelOverlaySideEffectBudget',
  'shortsReelOverlayJsonFirstGate'
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

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function countKey(value, targetKey) {
  let count = 0;
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (key === targetKey) count += 1;
      visit(child);
    }
  };
  visit(value);
  return count;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
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

function runPayload(input, settings = {}) {
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { output: plain(output), messages: plain(harness.messages) };
}

function channelMapPayloads(messages) {
  return messages
    .filter((message) => message.type === 'FilterTube_UpdateChannelMap')
    .map((message) => message.payload);
}

function directOverlayInput() {
  const fixture = loadFixture();
  return {
    overlay: {
      [fixture.provenance.rendererType]: plain(fixture.renderer)
    }
  };
}

function wrappedReelItemInput(headline = 'Neutral captured overlay reel') {
  const fixture = loadFixture();
  return {
    contents: [{
      reelItemRenderer: {
        videoId: 'abcdefghijk',
        headline: { simpleText: headline },
        navigationEndpoint: {
          reelWatchEndpoint: {
            overlay: {
              reelPlayerOverlayRenderer: plain(fixture.renderer)
            }
          }
        }
      }
    }]
  };
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

test('Shorts reel overlay owner audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const filterLogic = read('js/filter_logic.js');
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is\s+unchanged/);
  assert.match(doc, /not first-class JSON filter\s+authority/);
  assert.match(doc, /JSON-first optimization trap/);

  assert.equal(lineCount(raw), 1971);
  assert.equal(Buffer.byteLength(raw), 149486);
  assert.equal(sha256(rawPath), 'cc8befaef3cf44c893f3809af34cdc1c798a3b855e0aacfd9b2034381f0b1026');
  assert.equal(countLiteral(raw, 'reelPlayerOverlayRenderer'), 2);
  assert.equal(countLiteral(raw, owner.id), 6);
  assert.equal(countLiteral(raw, owner.handle), 11);

  assert.equal(lineCount(fixtureText), 108);
  assert.equal(Buffer.byteLength(fixtureText), 3706);
  assert.equal(sha256(fixturePath), '99452336bec6d1be5a2242b9c3cefe06061fe980c256ac675fc721cb6a2a648e');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'reelPlayerOverlayRenderer');
  assert.equal(fixture.provenance.extractedPath, 'overlay.reelPlayerOverlayRenderer');
  assert.equal(countLiteral(fixtureText, 'reelPlayerOverlayRenderer'), 2);
  assert.equal(countLiteral(fixtureText, owner.id), 4);
  assert.equal(countLiteral(fixtureText, owner.handle), 7);

  assert.equal(lineCount(filterLogic), 3498);
  assert.equal(Buffer.byteLength(filterLogic), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
});

test('captured active overlay carries owner UC, handle, subscribe, and avatar evidence without video id', () => {
  const fixture = loadFixture();
  const renderer = fixture.renderer;
  const channelBar = renderer.metapanel.reelMetapanelViewModel.metadataItems[0].reelChannelBarViewModel;
  const decoratedCommand = channelBar.decoratedAvatarViewModel.decoratedAvatarViewModel.rendererContext
    .commandContext.onTap.innertubeCommand;
  const channelCommand = channelBar.channelName.commandRuns[0].onTap.innertubeCommand;
  const subscribe = channelBar.subscribeButtonViewModel.subscribeButtonViewModel;

  assert.equal(channelBar.channelName.content, owner.handle);
  assert.equal(decoratedCommand.browseEndpoint.browseId, owner.id);
  assert.equal(decoratedCommand.browseEndpoint.canonicalBaseUrl, owner.canonical);
  assert.equal(channelCommand.browseEndpoint.browseId, owner.id);
  assert.equal(channelCommand.browseEndpoint.canonicalBaseUrl, owner.canonical);
  assert.equal(subscribe.channelId, owner.id);
  assert.deepEqual(subscribe.subscribeButtonContent.subscribeEndpoint.channelIds, [owner.id]);
  assert.match(
    channelBar.decoratedAvatarViewModel.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources[0].url,
    /^https:\/\/yt3\.ggpht\.com\//
  );

  assert.equal(countKey(renderer, 'videoId'), 0);
  assert.equal(countKey(renderer, 'reelWatchEndpoint'), 0);
  assert.equal(countKey(renderer, 'channelTitleText'), 0);
  assert.equal(countKey(renderer, 'reelChannelBarViewModel'), 1);
  assert.equal(countKey(renderer, 'subscribeButtonViewModel'), 2);
});

test('direct reelPlayerOverlayRenderer payload passes through matching blocklist and whitelist owner rules today', () => {
  const input = directOverlayInput();
  const expectedMapPayloads = [[{ id: owner.id, handle: owner.handle }]];

  const blockRun = runPayload(input, {
    filterChannels: [{ id: owner.id, handle: owner.handle }]
  });
  assert.deepEqual(blockRun.output, plain(input));
  assert.deepEqual(channelMapPayloads(blockRun.messages), expectedMapPayloads);

  const allowRun = runPayload(input, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: owner.id, handle: owner.handle }]
  });
  assert.deepEqual(allowRun.output, plain(input));
  assert.deepEqual(channelMapPayloads(allowRun.messages), expectedMapPayloads);
});

test('wrapped reelItemRenderer ignores captured metapanel owner fields but still filters title keywords', () => {
  const input = wrappedReelItemInput();
  const expectedMapPayloads = [[{ id: owner.id, handle: owner.handle }]];

  const channelBlockRun = runPayload(input, {
    filterChannels: [{ id: owner.id, handle: owner.handle }]
  });
  assert.deepEqual(channelBlockRun.output, plain(input));
  assert.deepEqual(channelMapPayloads(channelBlockRun.messages), expectedMapPayloads);

  const whitelistRun = runPayload(input, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: owner.id, handle: owner.handle }]
  });
  assert.deepEqual(whitelistRun.output, { contents: [] });

  const keywordInput = wrappedReelItemInput('Electric captured overlay reel');
  const keywordRun = runPayload(keywordInput, {
    filterKeywords: [{ pattern: 'Electric captured', flags: 'i' }]
  });
  assert.deepEqual(keywordRun.output, { contents: [] });
});

test('Shorts reel overlay owner authority remains a future JSON-first gate', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const rawIndex = read('docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md');
  const objectiveLedger = read('docs/audit/FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18.md');
  const activeGoal = read('docs/audit/FILTERTUBE_ACTIVE_GOAL_COMPLETION_AUDIT_2026-05-21.md');
  const trackedFileIndex = read('docs/audit/FILTERTUBE_TRACKED_FILE_OBLIGATION_INDEX_2026-05-20.md');
  const productSource = productRuntimeSource();

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);
  assert.match(runtimeResults, /shorts-reel-overlay-owner-authority-boundary-current-behavior\.test\.mjs/);
  assert.match(rawIndex, /FILTERTUBE_SHORTS_REEL_OVERLAY_OWNER_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(objectiveLedger, /Shorts reel overlay owner authority boundary addendum/);
  assert.match(activeGoal, /Shorts reel overlay owner authority boundary addendum/);
  assert.match(trackedFileIndex, /Shorts reel overlay owner authority boundary addendum/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(productSource, new RegExp(token));
  }

  assert.doesNotMatch(read('js/filter_logic.js'), /\n\s*reelPlayerOverlayRenderer\s*:/);
});
