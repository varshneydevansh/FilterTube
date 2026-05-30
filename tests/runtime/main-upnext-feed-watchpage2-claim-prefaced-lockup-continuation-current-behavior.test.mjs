import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_UPNEXT_FEED_WATCHPAGE2_CLAIM_PREFACED_LOCKUP_CONTINUATION_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json';
const rawPath = 'YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json';

const futureAuthorityTokens = [
  'mainUpnextWatchpage2ClaimPrefacedContract',
  'mainUpnextWatchpage2RawClaimClassifier',
  'mainUpnextWatchpage2LockupDecisionReport',
  'mainUpnextWatchpage2CollaboratorClaimPolicy',
  'mainUpnextWatchpage2TargetIdPolicy',
  'mainUpnextWatchpage2MapSideEffectReport',
  'mainUpnextWatchpage2SiblingPreservationFixture',
  'mainUpnextWatchpage2JsonFirstGate'
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
        fragments.push({
          start,
          end: index + 1,
          line: text.slice(0, start).split('\n').length,
          text: text.slice(start, index + 1),
          bytes: Buffer.byteLength(text.slice(start, index + 1))
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
  return { fixture, output, messages: harness.messages };
}

function continuationItems(response) {
  return response.onResponseReceivedEndpoints[0].appendContinuationItemsAction.continuationItems;
}

function contentIds(response) {
  return Array.from(continuationItems(response).map((item) => item.lockupViewModel?.contentId));
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

test('claim-prefaced watchpage2 continuation audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not collaborator proof/);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, Buffer.byteLength(raw));
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'claim-prefaced prose plus balanced youtubei next JSON fragment');
  assert.equal(fixture.provenance.fragmentIndex, 0);
  assert.equal(fixture.provenance.fragmentStartLine, 63);
  assert.equal(fixture.provenance.fragmentBytes, 857711);
  assert.equal(fixture.provenance.targetId, 'watch-next-feed');
  assert.equal(fixture.provenance.rendererType, 'watchNextFeedClaimPrefacedLockupViewModel');
  assert.equal(lineCount(fixtureText), 185);
  assert.equal(Buffer.byteLength(fixtureText), 6857);
  assert.equal(sha256(fixturePath), '3d327389d733d5e775cb81680de70925dfecf8c27cbb26508029776cfe856f74');
});

test('raw watchpage2 capture is claim-prefaced prose plus one parsed watch-next-feed JSON fragment', () => {
  const raw = read(rawPath);
  const fixture = loadFixture();

  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.equal(lineCount(raw), 20079);
  assert.equal(Buffer.byteLength(raw), 863854);
  assert.equal(sha256(rawPath), '3916ffe4978ebaed0397d9f45d090541545f126ba4153dedfbecb9859d9ec8e8');

  const fragments = topLevelJsonFragments(raw);
  assert.equal(fragments.length, 1);
  assert.equal(fragments[0].line, 63);
  assert.equal(fragments[0].bytes, 857711);

  const parsed = JSON.parse(fragments[0].text);
  const action = parsed.onResponseReceivedEndpoints[0].appendContinuationItemsAction;
  assert.equal(action.targetId, 'watch-next-feed');
  assert.equal(action.continuationItems.length, 22);
  assert.equal(countKey(parsed, 'lockupViewModel'), 20);
  assert.equal(countKey(parsed, 'reelShelfRenderer'), 1);
  assert.equal(countKey(parsed, 'continuationItemRenderer'), 1);
  assert.equal(countKey(parsed, 'shortsLockupViewModel'), 3);
  assert.equal(countKey(parsed, 'browseEndpoint'), 20);
  assert.equal(countKey(parsed, 'decoratedAvatarViewModel'), 20);
  assert.equal(countKey(parsed, 'compactAutoplayRenderer'), 0);
  assert.equal(countKey(parsed, 'endScreenVideoRenderer'), 0);
  assert.equal(countKey(parsed, 'playlistPanelVideoRenderer'), 0);
  assert.equal(countKey(parsed, 'autoplayVideo'), 0);
  assert.equal(countKey(parsed, 'nextButtonVideo'), 0);
  assert.equal(countKey(parsed, 'previousButtonVideo'), 0);

  assert.equal(action.continuationItems[0].lockupViewModel.contentId, 'AM6n0J6ZXNo');
  assert.equal(action.continuationItems[0].lockupViewModel.metadata.lockupMetadataViewModel.title.content, continuationItems(fixture.response)[0].lockupViewModel.metadata.lockupMetadataViewModel.title.content);
  assert.equal(action.continuationItems[0].lockupViewModel.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId, 'UCkAQ2Y2bRUI4Cqyj5pc9wJQ');
  assert.equal(action.continuationItems[1].lockupViewModel.contentId, 'rI2gQ7K4F8g');
  assert.equal(action.continuationItems[1].lockupViewModel.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId, 'UC9D_41XZiozyLLeRKVQIBmQ');
});

test('claim-prefaced collaborator prose tokens are not parsed collaborator roster proof', () => {
  const raw = read(rawPath);
  const parsed = JSON.parse(topLevelJsonFragments(raw)[0].text);

  assert.equal(countLiteral(raw, 'showDialogCommand'), 1);
  assert.equal(countLiteral(raw, 'coAuthors'), 2);
  assert.equal(countLiteral(raw, 'ownerText'), 1);
  assert.equal(countLiteral(raw, 'bylineText'), 1);
  assert.equal(countLiteral(raw, 'avatarStackViewModel'), 0);

  assert.equal(countKey(parsed, 'showDialogCommand'), 0);
  assert.equal(countKey(parsed, 'coAuthors'), 0);
  assert.equal(countKey(parsed, 'ownerText'), 0);
  assert.equal(countKey(parsed, 'bylineText'), 0);
  assert.equal(countKey(parsed, 'avatarStackViewModel'), 0);
});

test('no-rule processing preserves both watchpage2 video lockups and queues map side effects', () => {
  const { output, messages } = runFixture();

  assert.deepEqual(contentIds(output), ['AM6n0J6ZXNo', 'rI2gQ7K4F8g']);

  const channelMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  assert.equal(channelMapMessages.length, 2);
  assert.deepEqual(plain(channelMapMessages[0].payload), [
    { id: 'UCkAQ2Y2bRUI4Cqyj5pc9wJQ', handle: '@SuiteSound_Music' }
  ]);
  assert.deepEqual(plain(channelMapMessages[1].payload), [
    { id: 'UC9D_41XZiozyLLeRKVQIBmQ', handle: '@AvtoradioMoscow' }
  ]);

  const videoMapMessages = messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(plain(videoMapMessages[0].payload), [
    { videoId: 'AM6n0J6ZXNo', channelId: 'UCkAQ2Y2bRUI4Cqyj5pc9wJQ' },
    { videoId: 'rI2gQ7K4F8g', channelId: 'UC9D_41XZiozyLLeRKVQIBmQ' }
  ]);
});

test('blocklist SuiteSound keyword and channel rules remove the first watchpage2 lockup while preserving sibling', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'SuiteSound', flags: 'i' }] });
  assert.deepEqual(contentIds(keywordRun.output), ['rI2gQ7K4F8g']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UCkAQ2Y2bRUI4Cqyj5pc9wJQ' }] });
  assert.deepEqual(contentIds(channelRun.output), ['rI2gQ7K4F8g']);
});

test('blocklist Avtoradio keyword and channel rules remove the second watchpage2 lockup while preserving sibling', () => {
  const keywordRun = runFixture({ filterKeywords: [{ pattern: 'Авторадио', flags: 'i' }] });
  assert.deepEqual(contentIds(keywordRun.output), ['AM6n0J6ZXNo']);

  const channelRun = runFixture({ filterChannels: [{ id: 'UC9D_41XZiozyLLeRKVQIBmQ' }] });
  assert.deepEqual(contentIds(channelRun.output), ['AM6n0J6ZXNo']);
});

test('whitelist channel allow preserves only the matching watchpage2 lockup', () => {
  const suiteSoundRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCkAQ2Y2bRUI4Cqyj5pc9wJQ' }]
  });
  assert.deepEqual(contentIds(suiteSoundRun.output), ['AM6n0J6ZXNo']);

  const avtoradioRun = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC9D_41XZiozyLLeRKVQIBmQ' }]
  });
  assert.deepEqual(contentIds(avtoradioRun.output), ['rI2gQ7K4F8g']);
});

test('claim-prefaced watchpage2 future authority symbols remain absent from product runtime', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `doc should name missing future token ${token}`);
    assert.equal(runtime.includes(token), false, `${token} should remain absent from product runtime source`);
  }
});
