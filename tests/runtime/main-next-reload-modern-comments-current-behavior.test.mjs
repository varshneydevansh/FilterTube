import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_MAIN_NEXT_RELOAD_MODERN_COMMENTS_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/main-next-reload-modern-comments.json';
const rawPath = 'YT_MAIN_NEXT.json';

const futureAuthorityTokens = [
  'mainNextReloadModernCommentsContract',
  'mainNextReloadModernCommentsClassificationReport',
  'mainNextReloadModernCommentsDecisionReport',
  'mainNextReloadModernCommentsContinuationPolicy',
  'mainNextReloadModernCommentsKeywordPolicy',
  'mainNextReloadModernCommentsHeaderPolicy',
  'mainNextReloadModernCommentsSyntheticEndParityReport',
  'mainNextReloadModernCommentsFixtureProvenance',
  'mainNextReloadModernCommentsMetricArtifact',
  'mainNextReloadModernCommentsJsonFirstGate'
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
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

function countToken(text, token) {
  return (text.match(new RegExp(token, 'g')) || []).length;
}

function baseSettings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    whitelistKeywords: [],
    whitelistChannels: [],
    filterKeywordsComments: [],
    hideAllComments: false,
    hideAllShorts: false,
    ...overrides
  };
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
}

function runFixture(settings = {}) {
  const input = plain(loadFixture().response);
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { input, output, messages: harness.messages };
}

function endpointItems(response, index) {
  return response.onResponseReceivedEndpoints[index].reloadContinuationItemsCommand.continuationItems;
}

function itemKeys(response, index) {
  return endpointItems(response, index).map((item) => Object.keys(item)[0]);
}

function commentIds(response) {
  return endpointItems(response, 1)
    .filter((item) => item.commentThreadRenderer)
    .map((item) => item.commentThreadRenderer.commentViewModel.commentViewModel.commentId);
}

function productRuntimeSource() {
  return [
    'js/filter_logic.js',
    'js/seed.js',
    'js/content/dom_fallback.js',
    'js/content_bridge.js'
  ].map(read).join('\n');
}

test('main next reload modern comments doc and fixture provenance are pinned', () => {
  const fixture = loadFixture();
  const raw = read(rawPath);
  const doc = read(docPath);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, byteSize(rawPath));
  assert.equal(fixture.provenance.sourceLines, newlineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'direct JSON /youtubei/v1/next reloadContinuationItemsCommand comment response');
  assert.equal(fixture.provenance.rendererType, 'reloadModernCommentThreadRenderer');
  assert.deepEqual(fixture.provenance.rendererTypes, [
    'commentsHeaderRenderer',
    'commentThreadRenderer',
    'commentViewModel',
    'continuationItemRenderer'
  ]);
  assert.equal(fixture.provenance.releaseInputAllowed, false);

  assert.ok(doc.includes('main-next-reload-modern-comments.json'));
  assert.ok(doc.includes('8efea8f6fb83ad38847b12e05b07b04a00a4d8bd39e9046b562eb5522701f7bc'));
  assert.ok(doc.includes('not a watch rail, playlist, autoplay, or end-screen'));
});

test('raw YT_MAIN_NEXT is a comments reload response, not watch/autoplay evidence', () => {
  const raw = read(rawPath);
  const parsed = JSON.parse(raw);

  assert.deepEqual(Object.keys(parsed), [
    'responseContext',
    'trackingParams',
    'onResponseReceivedEndpoints',
    'frameworkUpdates'
  ]);
  assert.equal(parsed.onResponseReceivedEndpoints.length, 2);
  assert.deepEqual(parsed.onResponseReceivedEndpoints.map((endpoint) => endpoint.reloadContinuationItemsCommand.slot), [
    'RELOAD_CONTINUATION_SLOT_HEADER',
    'RELOAD_CONTINUATION_SLOT_BODY'
  ]);
  assert.deepEqual(parsed.onResponseReceivedEndpoints.map((endpoint) => endpoint.reloadContinuationItemsCommand.continuationItems.length), [1, 21]);

  assert.equal(countToken(raw, 'reloadContinuationItemsCommand'), 2);
  assert.equal(countToken(raw, 'appendContinuationItemsAction'), 0);
  assert.equal(countToken(raw, 'commentThreadRenderer'), 21);
  assert.equal(countToken(raw, 'commentViewModel'), 41);
  assert.equal(countToken(raw, 'commentRenderer'), 0);
  assert.equal(countToken(raw, 'commentsHeaderRenderer'), 2);
  assert.equal(countToken(raw, 'continuationItemRenderer'), 20);

  assert.equal(countKey(parsed, 'reloadContinuationItemsCommand'), 2);
  assert.equal(countKey(parsed, 'appendContinuationItemsAction'), 0);
  assert.equal(countKey(parsed, 'commentThreadRenderer'), 20);
  assert.equal(countKey(parsed, 'commentViewModel'), 40);
  assert.equal(countKey(parsed, 'commentRenderer'), 0);
  assert.equal(countKey(parsed, 'commentsHeaderRenderer'), 1);
  assert.equal(countKey(parsed, 'continuationItemRenderer'), 19);

  for (const absentWatchKey of [
    'twoColumnWatchNextResults',
    'playlistPanelVideoRenderer',
    'endScreenVideoRenderer',
    'compactAutoplayRenderer',
    'autoplayVideo',
    'nextButtonVideo',
    'previousButtonVideo'
  ]) {
    assert.equal(countKey(parsed, absentWatchKey), 0, `${absentWatchKey} should not be parsed from this raw capture`);
  }
});

test('reduced fixture preserves header, modern comments, and body continuation sibling', () => {
  const response = loadFixture().response;

  assert.deepEqual(itemKeys(response, 0), ['commentsHeaderRenderer']);
  assert.deepEqual(itemKeys(response, 1), [
    'commentThreadRenderer',
    'commentThreadRenderer',
    'continuationItemRenderer'
  ]);
  assert.deepEqual(commentIds(response), [
    'UgzDXgm-fr-N5JK99f14AaABAg',
    'UgyyyK520KB5LXsiteR4AaABAg'
  ]);
  assert.equal(endpointItems(response, 0)[0].commentsHeaderRenderer.countText.runs.map((run) => run.text).join(''), '32,58,782 Comments');
  assert.equal(endpointItems(response, 1)[2].continuationItemRenderer.continuationEndpoint.commandMetadata.webCommandMetadata.apiUrl, '/youtubei/v1/next');
});

test('no-rule processing passes the reduced reload response through unchanged', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(plain(output), plain(input));
  assert.deepEqual(messages.filter((message) => message.type?.startsWith('FilterTube_Update')), []);
});

test('hideAllComments removes modern thread wrappers but preserves header and continuation item', () => {
  const { output } = runFixture({ hideAllComments: true });

  assert.deepEqual(plain(itemKeys(output, 0)), ['commentsHeaderRenderer']);
  assert.deepEqual(plain(itemKeys(output, 1)), ['continuationItemRenderer']);
  assert.equal(JSON.stringify(output).includes('commentThreadRenderer'), false);
  assert.equal(JSON.stringify(output).includes('commentViewModel'), false);
  assert.equal(
    endpointItems(output, 1)[0].continuationItemRenderer.continuationEndpoint.commandMetadata.webCommandMetadata.apiUrl,
    '/youtubei/v1/next'
  );
  assert.equal(output.onResponseReceivedEndpoints.length, 2);
});

test('modern comment reload payload text is not actionable through keyword rules today', () => {
  for (const settings of [
    { filterKeywordsComments: [keyword('UgzDXgm-fr-N5JK99f14AaABAg')] },
    { filterKeywords: [keyword('UgyyyK520KB5LXsiteR4AaABAg')] },
    { listMode: 'whitelist', whitelistKeywords: [keyword('UgzDXgm-fr-N5JK99f14AaABAg')] }
  ]) {
    const { input, output } = runFixture(settings);
    assert.deepEqual(plain(output), plain(input));
  }
});

test('current runtime lacks a first-class main next reload modern comments authority', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const token of futureAuthorityTokens) {
    assert.ok(doc.includes(token), `audit doc should name ${token}`);
    assert.equal(runtime.includes(token), false, `${token} should remain absent from product runtime`);
  }
});
