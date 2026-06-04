import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const commentFamilyDocs = [
  'docs/audit/FILTERTUBE_ADD_FILTERED_CHANNEL_FILTER_ALL_COMMENTS_DEFAULT_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_COMMENTS_DOM_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_AUTHOR_CHANNEL_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_RAW_URL_ADMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_KEYWORD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_JSON_FIRST_HIDE_ALL_COMMENTS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_KEYWORD_COMMENTS_SCOPE_MIGRATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_KIDS_COMMENTS_FILTER_ALL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
  'docs/audit/FILTERTUBE_MAIN_FILTER_ALL_COMMENTS_SCOPE_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_MAIN_NEXT_RELOAD_MODERN_COMMENTS_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function doc() {
  return read(docPath);
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineOf(source, needle) {
  const lines = source.split(/\r?\n/);
  const index = lines.findIndex((line) => line.includes(needle));
  assert.notEqual(index, -1, `missing source needle ${needle}`);
  return index + 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function settings(overrides = {}) {
  return {
    enabled: true,
    listMode: 'blocklist',
    filterKeywords: [],
    filterChannels: [],
    filterKeywordsComments: [],
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

function commentThreadItem(id = 'Ugw-thread') {
  return {
    commentThreadRenderer: {
      comment: {
        commentRenderer: {
          commentId: id,
          contentText: { runs: [{ text: 'Comment body' }] }
        }
      }
    }
  };
}

function commentItem(id = 'Ugw-comment') {
  return {
    commentRenderer: {
      commentId: id,
      contentText: { runs: [{ text: 'Direct comment body' }] }
    }
  };
}

function videoItem(id = 'abcdefghijk') {
  return {
    videoRenderer: {
      videoId: id,
      title: { simpleText: 'Sibling recommendation' }
    }
  };
}

function endpointPayload(command, items) {
  return {
    onResponseReceivedEndpoints: [{
      [command]: {
        continuationItems: items
      }
    }]
  };
}

function actionsPayload(command, items) {
  return {
    onResponseReceivedActions: [{
      [command]: {
        continuationItems: items
      }
    }]
  };
}

function runtime(payload, overrides = {}) {
  const instance = loadSeedRuntime({
    hostname: 'www.youtube.com',
    pathname: '/watch',
    payload,
    status: overrides.status || 207,
    statusText: overrides.statusText || 'Multi-Status',
    headers: overrides.headers || { 'content-type': 'application/json', 'x-filtertube-test': 'comments' }
  });
  instance.window.filterTube.updateSettings(settings({
    hideAllComments: true,
    ...overrides.settings
  }));
  return instance;
}

async function fetchNext(instance, url = 'https://www.youtube.com/youtubei/v1/next?prettyPrint=false') {
  const response = await instance.window.fetch(url);
  const body = await response.json();
  return { response, body };
}

function syntheticItems(body) {
  return body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('JSON-first comment continuation shortcut is audit-only and source pinned', () => {
  const text = doc();
  const methodGap = read(methodGapPath);
  const seed = read('js/seed.js');
  const seedHash = 'a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d';

  assert.match(text, /Status: audit-only current-behavior register/);
  assert.match(text, /Runtime behavior is unchanged/);
  assert.match(text, /not an implementation patch, optimization patch, comment filtering/);
  assert.match(text, /source files with comment continuation shortcut surface: 1/);
  assert.match(text, /runtime behavior changed: no/);
  assert.match(text, /not completion proof for JSON-first comment continuation authority/);

  assert.match(methodGap, /repo-wide lexical callables: 5812/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5812/);

  assert.equal(commentFamilyDocs.length, 18);
  for (const familyDocPath of commentFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5812/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5812/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: (?:no|yes)/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assert.equal(lineCount(seed), 1136);
  assert.equal(Buffer.byteLength(seed), 50026);
  assert.equal(sha256('js/seed.js'), seedHash);
  assert.match(
    text,
    new RegExp(`\\| \`js/seed\\.js\` \\| 1136 \\| 50026 \\| \`${seedHash}\` \\|`)
  );
});

test('comment continuation shortcut source rows and anchors remain current', () => {
  const text = doc();
  const seed = read('js/seed.js');
  const shortcut = sliceBetween(
    seed,
    '// Special handling for comment requests when hideAllComments is enabled',
    '// Normal processing for non-comment or non-hideAllComments requests'
  );

  const anchors = [
    ['response.clone().json()', 701],
    ['// Special handling for comment requests when hideAllComments is enabled', 702],
    ["if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {", 703],
    ['// Check if this is a comment continuation request', 704],
    ['const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint =>', 705],
    ['endpoint?.appendContinuationItemsAction?.continuationItems?.some(item =>', 706],
    ['item?.commentThreadRenderer || item?.commentRenderer', 707],
    ['if (isCommentRequest) {', 711],
    ['const emptyCommentResponse = {', 714],
    ['onResponseReceivedEndpoints: [{', 716],
    ['appendContinuationItemsAction: {', 717],
    ['continuationItems: [', 718],
    ['continuationItemRenderer: {', 721],
    ['trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN"', 722],
    ['continuationEndpoint: null', 723],
    ['return new Response(JSON.stringify(emptyCommentResponse),', 731],
    ['status: response.status,', 732],
    ['statusText: response.statusText,', 733],
    ['headers: response.headers', 734],
    ['// Normal processing for non-comment or non-hideAllComments requests', 739],
    ['const processed = processWithEngine(jsonData, dataName);', 740],
    ['return new Response(JSON.stringify(processed),', 741]
  ];

  for (const [needle, expectedLine] of anchors) {
    assert.equal(lineOf(seed, needle), expectedLine, `anchor moved: ${needle}`);
    assert.ok(text.includes(`\`js/seed.js:${expectedLine}\``), `doc should cite js/seed.js:${expectedLine}`);
  }

  assert.match(shortcut, /urlStr\.includes\('\/youtubei\/v1\/next'\) && cachedSettings\?\.hideAllComments/);
  assert.match(shortcut, /onResponseReceivedEndpoints/);
  assert.match(shortcut, /appendContinuationItemsAction/);
  assert.match(shortcut, /commentThreadRenderer \|\| item\?\.commentRenderer/);
  assert.match(shortcut, /continuationEndpoint: null/);
  assert.doesNotMatch(shortcut, /reloadContinuationItemsCommand|replaceContinuationItemsCommand|onResponseReceivedActions|onResponseReceivedCommands/);

  assert.match(text, /fetch-only shortcut branches: 1/);
  assert.match(text, /raw \/youtubei\/v1\/next shortcut gates: 1/);
  assert.match(text, /hideAllComments shortcut guards: 1/);
  assert.match(text, /response collection roots checked by shortcut: 1/);
  assert.match(text, /continuation command shapes checked by shortcut: 1/);
  assert.match(text, /comment renderer item shapes checked by shortcut: 2/);
  assert.match(text, /synthetic response replacement branches: 1/);
  assert.match(text, /synthetic end marker continuation items: 1/);
  assert.match(text, /continuationEndpoint null writer sites: 1/);
  assert.match(text, /metadata fields preserved by shortcut response: 3/);
});

test('append comment continuations currently bypass engine and return a synthetic end marker', async () => {
  const thread = runtime(endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-thread-positive')]));
  const threadResult = await fetchNext(thread);
  const threadItems = syntheticItems(threadResult.body);

  assert.equal(thread.calls.responseJson.length, 1);
  assert.equal(thread.calls.processData.length, 0);
  assert.equal(thread.calls.harvestOnly.length, 0);
  assert.equal(thread.calls.jsonStringify.length, 1);
  assert.equal(threadResult.response.status, 207);
  assert.equal(threadResult.response.statusText, 'Multi-Status');
  assert.deepEqual(threadResult.response.headers, { 'content-type': 'application/json', 'x-filtertube-test': 'comments' });
  assert.equal(threadItems?.length, 1);
  assert.equal(threadItems[0].continuationItemRenderer?.trigger, 'CONTINUATION_TRIGGER_ON_ITEM_SHOWN');
  assert.equal(threadItems[0].continuationItemRenderer?.continuationEndpoint, null);
  assert.equal(JSON.stringify(threadResult.body).includes('Ugw-thread-positive'), false);

  const direct = runtime(endpointPayload('appendContinuationItemsAction', [commentItem('Ugw-direct-positive')]));
  const directResult = await fetchNext(direct);
  const directItems = syntheticItems(directResult.body);

  assert.equal(direct.calls.responseJson.length, 1);
  assert.equal(direct.calls.processData.length, 0);
  assert.equal(direct.calls.harvestOnly.length, 0);
  assert.equal(direct.calls.jsonStringify.length, 1);
  assert.equal(directItems?.length, 1);
  assert.equal(directItems[0].continuationItemRenderer?.continuationEndpoint, null);
  assert.equal(JSON.stringify(directResult.body).includes('Ugw-direct-positive'), false);
});

test('missed comment continuation shapes currently fall through to normal engine processing', async () => {
  const reload = runtime(endpointPayload('reloadContinuationItemsCommand', [commentThreadItem('Ugw-reload-miss')]));
  const reloadResult = await fetchNext(reload);
  assert.equal(reload.calls.processData.length, 1);
  assert.equal(reload.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(reload.calls.jsonStringify.length, 1);
  assert.equal(reloadResult.body.onResponseReceivedEndpoints?.[0]?.reloadContinuationItemsCommand?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-reload-miss');
  assert.equal(syntheticItems(reloadResult.body), undefined);

  const replace = runtime(endpointPayload('replaceContinuationItemsCommand', [commentThreadItem('Ugw-replace-miss')]));
  const replaceResult = await fetchNext(replace);
  assert.equal(replace.calls.processData.length, 1);
  assert.equal(replace.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(replace.calls.jsonStringify.length, 1);
  assert.equal(replaceResult.body.onResponseReceivedEndpoints?.[0]?.replaceContinuationItemsCommand?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-replace-miss');
  assert.equal(syntheticItems(replaceResult.body), undefined);

  const actions = runtime(actionsPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-actions-miss')]));
  const actionsResult = await fetchNext(actions);
  assert.equal(actions.calls.processData.length, 1);
  assert.equal(actions.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(actions.calls.jsonStringify.length, 1);
  assert.equal(actionsResult.body.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-actions-miss');
  assert.equal(syntheticItems(actionsResult.body), undefined);
});

test('non-comment disabled-shortcut and non-next cases currently use normal processing', async () => {
  const nonComment = runtime(endpointPayload('appendContinuationItemsAction', [videoItem('video-sibling')]));
  const nonCommentResult = await fetchNext(nonComment);
  assert.equal(nonComment.calls.processData.length, 1);
  assert.equal(nonComment.calls.processData[0].dataName, 'fetch:/youtubei/v1/next');
  assert.equal(nonCommentResult.body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.videoRenderer?.videoId, 'video-sibling');
  assert.equal(syntheticItems(nonCommentResult.body)?.[0]?.continuationItemRenderer, undefined);

  const disabledShortcut = runtime(
    endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-hide-false')]),
    { settings: { hideAllComments: false } }
  );
  const disabledResult = await fetchNext(disabledShortcut);
  assert.equal(disabledShortcut.calls.processData.length, 0);
  assert.equal(disabledShortcut.calls.jsonStringify.length, 0);
  assert.equal(disabledResult.body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-hide-false');
  assert.equal(syntheticItems(disabledResult.body)?.[0]?.continuationItemRenderer, undefined);

  const nonNext = runtime(endpointPayload('appendContinuationItemsAction', [commentThreadItem('Ugw-search-endpoint')]));
  const nonNextResult = await fetchNext(nonNext, 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false');
  assert.equal(nonNext.calls.processData.length, 1);
  assert.equal(nonNext.calls.processData[0].dataName, 'fetch:/youtubei/v1/search');
  assert.equal(nonNextResult.body.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems?.[0]?.commentThreadRenderer?.comment?.commentRenderer?.commentId, 'Ugw-search-endpoint');
  assert.equal(syntheticItems(nonNextResult.body)?.[0]?.continuationItemRenderer, undefined);
});

test('comment continuation shortcut records future proof fields and missing runtime authority', () => {
  const text = doc();

  for (const row of [
    'commentShortcutBranches(1): fetchAppendContinuationSyntheticEnd',
    'rawNextShortcutGates(1): fetchUrlIncludesYoutubeiNext',
    'settingsShortcutGuards(1): cachedSettingsHideAllComments',
    'responseCollectionRootsChecked(1): onResponseReceivedEndpoints',
    'continuationCommandShapesChecked(1): appendContinuationItemsAction',
    'commentRendererItemShapesChecked(2): commentThreadRenderer,commentRenderer',
    'syntheticReplacementBranches(1): emptyCommentResponse',
    'syntheticEndMarkerItems(1): continuationItemRenderer',
    'metadataPreserved(3): status,statusText,headers',
    'runtimePositiveShortcutFixtures(2): appendCommentThreadRenderer,appendCommentRenderer',
    'runtimeMissedShapeFixtures(3): reloadContinuationItemsCommand,replaceContinuationItemsCommand,onResponseReceivedActionsAppend',
    'runtimeFallbackFixtures(3): nonCommentAppend,hideAllCommentsFalse,nonNextEndpoint',
    'engineBypassFixtures(2): appendCommentThreadRenderer,appendCommentRenderer',
    'engineFallbackFixtures(5): reloadContinuationItemsCommand,replaceContinuationItemsCommand,onResponseReceivedActionsAppend,nonCommentAppend,hideAllCommentsFalse'
  ]) {
    assert.ok(text.includes(row), `missing row ${row}`);
  }

  for (const field of [
    'transport',
    'endpoint',
    'parsedPathname',
    'rawUrl',
    'route',
    'surface',
    'profileType',
    'listMode',
    'settingsRevision',
    'hideAllComments',
    'responseCollectionRoot',
    'continuationCommand',
    'continuationItemCountBefore',
    'commentItemCountBefore',
    'nonCommentSiblingCountBefore',
    'commentRendererShape',
    'syntheticEndAllowed',
    'engineBypassAllowed',
    'harvestBypassAllowed',
    'statusPreserved',
    'statusTextPreserved',
    'headersPreserved',
    'contentTypePolicy',
    'responseBodyMode',
    'siblingPreservationPolicy',
    'appendFixture',
    'reloadFixture',
    'replaceFixture',
    'actionsFixture',
    'xhrFixture',
    'negativeNonCommentFixture',
    'negativeDisabledFixture',
    'metricArtifact'
  ]) {
    assert.ok(text.includes(field), `missing future proof field ${field}`);
  }

  const runtime = productRuntimeSource();
  for (const missing of [
    'jsonFirstCommentContinuationContract',
    'jsonFirstCommentContinuationDecision',
    'jsonFirstCommentShortcutShapeReport',
    'jsonFirstCommentSyntheticEndDecision',
    'jsonFirstCommentSiblingPreservationReport',
    'jsonFirstCommentContinuationNoWorkBudget',
    'jsonFirstCommentCommandParityReport',
    'jsonFirstCommentContinuationFixtureProvenance',
    'jsonFirstCommentContinuationMetricArtifact'
  ]) {
    assert.ok(text.includes(missing), `doc should name missing authority ${missing}`);
    assert.equal(runtime.includes(missing), false, `${missing} should remain absent from product runtime source`);
  }
});
