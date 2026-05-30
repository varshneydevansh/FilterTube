import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'tmp.json';
const fixturePath = 'tests/runtime/fixtures/captures/main-watch-tmp-playlist-collab-dialog.json';
const docPath = 'docs/audit/FILTERTUBE_MAIN_WATCH_TMP_PLAYLIST_COLLAB_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md';

const futureAuthorityTokens = [
  'mainWatchTmpPlaylistCollabDialogContract',
  'mainWatchTmpPlaylistCollabIdentityReconciliationReport',
  'mainWatchTmpPlaylistCollabRendererContextPolicy',
  'mainWatchTmpPlaylistCollabTitleCommandPolicy',
  'mainWatchTmpPlaylistCollabWhitelistDecisionReport',
  'mainWatchTmpPlaylistCollabSideEffectReport',
  'mainWatchTmpMixedContainerAdmissionGate',
  'mainWatchTmpPlaylistCollabJsonFirstOptimizationBudget'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function sha256(file) {
  return sha256Text(read(file));
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function extractJsonValueAt(raw, start) {
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
    } else if (char === '{' || char === '[') {
      depth += 1;
    } else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  assert.notEqual(end, -1, 'could not find balanced JSON value');
  const text = raw.slice(start, end);
  return {
    start,
    end,
    text,
    bytes: Buffer.byteLength(text),
    startLine: lineCount(raw.slice(0, start)) + 1,
    endLine: lineCount(raw.slice(0, end)),
    object: JSON.parse(text)
  };
}

function extractGetWatchArray(raw) {
  const marker = 'get_watch?printPretty=Flase JSON';
  const markerIndex = raw.indexOf(marker);
  assert.notEqual(markerIndex, -1, 'missing get_watch marker');
  const arrayStart = raw.indexOf('[', markerIndex);
  assert.notEqual(arrayStart, -1, 'missing get_watch array start');
  return extractJsonValueAt(raw, arrayStart);
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
  const input = plain(fixture.watchNextResponse);
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(plain(input), baseSettings(settings), fixturePath);
  harness.flushTimers();
  return { fixture, input, output: plain(output), messages: plain(harness.messages) };
}

function playlistRows(output) {
  return output.contents.twoColumnWatchNextResults.playlist.playlist.contents;
}

function playlistIds(output) {
  return playlistRows(output).map((entry) => entry.playlistPanelVideoRenderer.videoId);
}

function collaboratorPayload(messages) {
  const message = messages.find((entry) => entry.type === 'FilterTube_CacheCollaboratorInfo');
  return message ? message.payload : null;
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

test('tmp playlist collaborator audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const fixture = loadFixture();
  const raw = read(rawPath);

  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.sourceSha256, sha256(rawPath));
  assert.equal(fixture.provenance.sourceBytes, fs.statSync(path.join(repoRoot, rawPath)).size);
  assert.equal(fixture.provenance.sourceLines, lineCount(raw));
  assert.equal(fixture.provenance.rawShape, 'mixed var ytInitialData assignment plus get_watch array');
  assert.equal(fixture.provenance.rootPath, 'get_watch array[1].watchNextResponse.contents.twoColumnWatchNextResults.playlist.playlist.contents[0..1]');

  for (const file of [rawPath, fixturePath, 'main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs']) {
    assert.ok(doc.includes(file), `doc should cite ${file}`);
  }
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /UCGnjeahCJW1AF34HBmQTJ-Q/);
  assert.match(doc, /UCYLNGLIzMhRTi6ZOLjAPSmw/);
});

test('raw tmp capture has mixed browse assignment plus get-watch array with playlist collaborator proof', () => {
  const raw = read(rawPath);
  const array = extractGetWatchArray(raw);

  assert.equal(lineCount(raw), 81428);
  assert.equal(Buffer.byteLength(raw), 10241427);
  assert.equal(sha256(rawPath), '4ffc80cf815c461a0251ca491431b392671e0569268b39e1c22c1ff833a56529');
  assert.equal(countLiteral(raw, 'var ytInitialData = '), 1);
  assert.equal(countLiteral(raw, 'get_watch?printPretty=Flase JSON'), 1);

  assert.equal(array.startLine, 28512);
  assert.equal(array.bytes, 6048291);
  assert.equal(Array.isArray(array.object), true);
  assert.equal(array.object.length, 2);
  assert.equal(countKey(array.object, 'watchNextResponse'), 1);
  assert.equal(countKey(array.object, 'playlistPanelVideoRenderer'), 25);
  assert.equal(countKey(array.object, 'endScreenVideoRenderer'), 8);
  assert.equal(countKey(array.object, 'autoplayVideo'), 2);
  assert.equal(countKey(array.object, 'nextButtonVideo'), 2);
  assert.equal(countKey(array.object, 'previousButtonVideo'), 0);
  assert.equal(countKey(array.object, 'showDialogCommand'), 10);
  assert.equal(countKey(array.object, 'listItemViewModel'), 196);
  assert.equal(countKey(array.object, 'compactAutoplayRenderer'), 0);
  assert.equal(countLiteral(array.text, 'playlistPanelVideoRenderer'), 26);
  assert.equal(countLiteral(array.text, 'listItemViewModel'), 197);
});

test('reduced tmp fixture preserves selected collaborator row and normal sibling row', () => {
  const fixture = loadFixture();
  const rows = playlistRows(fixture.watchNextResponse).map((entry) => entry.playlistPanelVideoRenderer);
  const collab = rows[0];
  const sibling = rows[1];
  const listItems = collab.shortBylineText.runs[0].navigationEndpoint
    .showDialogCommand.panelLoadingStrategy.inlineContent.dialogViewModel
    .customContent.listViewModel.listItems;

  assert.deepEqual(rows.map((row) => row.videoId), ['41ZY18JqI2A', 'TUVcZfQe-Kw']);
  assert.equal(collab.selected, true);
  assert.equal(collab.shortBylineText.runs[0].text, 'Shakira and 2 more');
  assert.deepEqual(listItems.map((entry) => entry.listItemViewModel.title.content), [
    'shakiraVEVO',
    'Spotify',
    'Beele'
  ]);
  assert.equal(
    listItems[0].listItemViewModel.title.commandRuns[0].onTap.innertubeCommand.browseEndpoint.browseId,
    'UCGnjeahCJW1AF34HBmQTJ-Q'
  );
  assert.equal(
    listItems[0].listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId,
    'UCYLNGLIzMhRTi6ZOLjAPSmw'
  );
  assert.equal(sibling.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId, 'UC-J-KZfRV8c13fOCkhXdLiQ');
});

test('no-rule processing preserves rows and queues only current harvest side effects', () => {
  const { input, output, messages } = runFixture();

  assert.deepEqual(output, input);
  assert.deepEqual(playlistIds(output), ['41ZY18JqI2A', 'TUVcZfQe-Kw']);
  assert.equal(collaboratorPayload(messages), null);
  assert.deepEqual(messages, [
    {
      type: 'FilterTube_UpdateChannelMap',
      payload: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q', handle: '@shakiraVEVO' }],
      source: 'filter_logic'
    },
    {
      type: 'FilterTube_UpdateVideoChannelMap',
      payload: [{ videoId: 'TUVcZfQe-Kw', channelId: 'UC-J-KZfRV8c13fOCkhXdLiQ' }],
      source: 'filter_logic'
    }
  ]);
});

test('blocklist collaborator matching uses renderer-context IDs and preserves the sibling row', () => {
  for (const id of [
    'UCYLNGLIzMhRTi6ZOLjAPSmw',
    'UCRMqQWxCWE0VMvtUElm-rEA',
    'UCYAQgXVSRzUeNo34-RJOWUw'
  ]) {
    const { output, messages } = runFixture({ filterChannels: [{ id }] });
    const collab = collaboratorPayload(messages);

    assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw']);
    assert.equal(collab.videoId, '41ZY18JqI2A');
    assert.deepEqual(collab.collaborators.map((entry) => entry.id), [
      'UCYLNGLIzMhRTi6ZOLjAPSmw',
      'UCRMqQWxCWE0VMvtUElm-rEA',
      'UCYAQgXVSRzUeNo34-RJOWUw'
    ]);
  }
});

test('blocklist title-command shakira identity does not remove the collaborator row today', () => {
  const { output, messages } = runFixture({
    filterChannels: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q' }]
  });

  assert.deepEqual(playlistIds(output), ['41ZY18JqI2A', 'TUVcZfQe-Kw']);
  assert.deepEqual(messages[0], {
    type: 'FilterTube_UpdateChannelMap',
    payload: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q', handle: '@shakiraVEVO' }],
    source: 'filter_logic'
  });
  assert.equal(collaboratorPayload(messages).collaborators[0].id, 'UCYLNGLIzMhRTi6ZOLjAPSmw');
});

test('whitelist mode preserves collaborator row only for renderer-context collaborator identity', () => {
  const rendererContextAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCYLNGLIzMhRTi6ZOLjAPSmw' }]
  }).output;
  const titleCommandAllowed = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCGnjeahCJW1AF34HBmQTJ-Q' }]
  }).output;

  assert.deepEqual(playlistIds(rendererContextAllowed), ['41ZY18JqI2A']);
  assert.deepEqual(playlistIds(titleCommandAllowed), []);
});

test('whitelist mode can preserve the non-collaboration sibling while removing the collaborator row', () => {
  const { output, messages } = runFixture({
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC-J-KZfRV8c13fOCkhXdLiQ' }]
  });

  assert.deepEqual(playlistIds(output), ['TUVcZfQe-Kw']);
  assert.equal(collaboratorPayload(messages).videoId, '41ZY18JqI2A');
});

test('current source has collaborator parsing but no tmp playlist identity reconciliation authority', () => {
  const filter = read('js/filter_logic.js');
  const runtime = productRuntimeSource();

  assert.match(filter, /const showDialogCommand = run\.navigationEndpoint\?\.showDialogCommand/);
  assert.match(filter, /listItemViewModel\.rendererContext\?\.commandContext\?\.onTap/);
  assert.match(filter, /listItemViewModel\.title\?\.content/);
  assert.doesNotMatch(runtime, /mainWatchTmpPlaylistCollabIdentityReconciliationReport/);
  assert.doesNotMatch(runtime, /mainWatchTmpPlaylistCollabTitleCommandPolicy/);
});

test('future tmp playlist collaborator authority tokens remain audit-only', () => {
  const doc = read(docPath);
  const runtime = productRuntimeSource();
  const testSource = read('tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs');

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.match(testSource, new RegExp(token));
    assert.doesNotMatch(runtime, new RegExp(token));
  }
});
