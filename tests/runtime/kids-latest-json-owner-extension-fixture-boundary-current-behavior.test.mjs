import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const methodGapPath = 'docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md';
const fixturePath = 'tests/runtime/fixtures/captures/kids-latest-compact-video-owner-extension.json';
const kidsJsonFamilyDocs = [
  'docs/audit/FILTERTUBE_KIDS_BROWSE_MALFORMED_FRAGMENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
  'docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md'
];

function read(file) {
  return fs.readFileSync(path.join(repoRoot, file), 'utf8');
}

function git(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, file))).digest('hex');
}

function lineCount(text) {
  return text.split(/\r?\n/).length - (text.endsWith('\n') ? 1 : 0);
}

function blockLineCount(text) {
  return text.split(/\r?\n/).length;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
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
    filterKeywordsComments: [],
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
    videoChannelMap: {},
    ...overrides
  };
}

function run(response, overrides = {}, options = {}) {
  const harness = loadFilterTubeEngine(options);
  const result = harness.engine.processData(
    plain(response),
    baseSettings(overrides),
    'kids-latest-owner-extension-fixture'
  );
  return { ...harness, result };
}

function compactItems(data) {
  return data.contents.kidsHomeScreenRenderer.anchors[0]
    .anchoredSectionRenderer.content.sectionListRenderer.contents[0]
    .itemSectionRenderer.contents;
}

function videoIds(data) {
  return compactItems(data).map((item) => item.compactVideoRenderer.videoId);
}

function stripBylineEndpoints(response) {
  const next = plain(response);
  const first = compactItems(next)[0].compactVideoRenderer;
  delete first.shortBylineText.runs[0].navigationEndpoint;
  delete first.longBylineText.runs[0].navigationEndpoint;
  return next;
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('Kids latest JSON owner extension fixture audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const methodGap = read(methodGapPath);
  const raw = read('yt_kids_latest.json');
  const filterLogic = read('js/filter_logic.js');
  const fixture = read(fixturePath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for Kids JSON owner-extension authority/);

  assert.match(methodGap, /repo-wide lexical callables: 5673/);
  assert.match(methodGap, /files with lexical accounting: 69/);
  assert.match(methodGap, /files with complete per-callable semantic proof: 0/);
  assert.match(methodGap, /lexical callables requiring semantic proof before behavior changes: 5673/);

  assert.equal(kidsJsonFamilyDocs.length, 2);
  for (const familyDocPath of kidsJsonFamilyDocs) {
    const familyDoc = read(familyDocPath);
    assert.ok(familyDoc.includes(methodGapPath), `${familyDocPath} should cite method semantic proof gap index`);
    assert.match(familyDoc, /## Method Semantic Proof Gap Boundary/);
    assert.match(familyDoc, /method semantic proof gap files covered: 69/);
    assert.match(familyDoc, /method semantic proof gap lexical callables covered: 5673/);
    assert.match(familyDoc, /files with complete per-callable semantic proof: 0/);
    assert.match(familyDoc, /lexical callables requiring semantic proof before behavior changes: 5673/);
    assert.match(familyDoc, /affected callable semantic proof: NO-GO/);
    assert.match(familyDoc, /runtime behavior changed: no/);
    assert.match(familyDoc, /do not approve runtime\s+optimization/);
  }

  assert.equal(lineCount(raw), 11409);
  assert.equal(Buffer.byteLength(raw), 604928);
  assert.equal(sha256('yt_kids_latest.json'), '7c74f1a0d7b3d0196de53fefed88aa3d2f3e6560acdb5a590752021e38cb6596');
  assert.equal(lineCount(filterLogic), 3652);
  assert.equal(Buffer.byteLength(filterLogic), 172174);
  assert.equal(sha256('js/filter_logic.js'), '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5');
  assert.equal(lineCount(fixture), 203);
  assert.equal(Buffer.byteLength(fixture), 9321);
  assert.equal(sha256(fixturePath), '7eb63cd3d1d27b837e286df7eebadac79e3b2bd62ca8ac33ad2b99ee55034529');

  for (const artifact of [
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_SURFACE_INFORMATION_AVAILABILITY_CURRENT_BEHAVIOR_2026-05-20.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_CHANNEL_MATCH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('Kids latest owner-extension source counts stay pinned', () => {
  const doc = read(docPath);
  const raw = read('yt_kids_latest.json');
  const filterLogic = read('js/filter_logic.js');

  const baseVideoRules = sliceBetween(filterLogic, '    const BASE_VIDEO_RULES = {', '    const CHANNEL_ONLY_RENDERERS = new Set([');
  const sharedVideoMapping = sliceBetween(filterLogic, '        // Shared video card renderers', '        videoWithContextRenderer: {');
  const harvestMappings = sliceBetween(filterLogic, '        _harvestRendererChannelMappings(root) {', '        _harvestVideoOwnerFromRenderer(renderer) {');
  const harvestOwner = sliceBetween(filterLogic, '        _harvestVideoOwnerFromRenderer(renderer) {', '        _registerVideoChannelMapping(videoId, channelId) {');
  const registerVideo = sliceBetween(filterLogic, '        _registerVideoChannelMapping(videoId, channelId) {', '        _registerVideoMetaMapping(videoId, meta) {');
  const fallbackBlock = sliceBetween(filterLogic, '            // Shorts: if no channel identity present, try videoChannelMap', '            // Handle collaboration videos');

  assert.equal(countLiteral(raw, '"compactVideoRenderer"'), 60);
  assert.equal(countLiteral(raw, '"kidsVideoOwnerExtension"'), 60);
  assert.equal(countLiteral(raw, '"externalChannelId"'), 60);
  assert.equal(countLiteral(raw, '"KIDS_BLOCK"'), 60);

  assert.equal(blockLineCount(baseVideoRules), 36);
  assert.equal(Buffer.byteLength(baseVideoRules), 1575);
  assert.equal(blockLineCount(sharedVideoMapping), 9);
  assert.equal(Buffer.byteLength(sharedVideoMapping), 415);
  assert.equal(blockLineCount(harvestMappings), 55);
  assert.equal(Buffer.byteLength(harvestMappings), 2535);
  assert.equal(blockLineCount(harvestOwner), 36);
  assert.equal(Buffer.byteLength(harvestOwner), 1887);
  assert.equal(blockLineCount(registerVideo), 17);
  assert.equal(Buffer.byteLength(registerVideo), 636);
  assert.equal(blockLineCount(fallbackBlock), 13);
  assert.equal(Buffer.byteLength(fallbackBlock), 556);

  for (const [literal, expected] of [
    ['kidsVideoOwnerExtension', 2],
    ['compactVideoRenderer', 9],
    ['videoChannelMap', 10],
    ['FilterTube_UpdateVideoChannelMap', 1]
  ]) {
    assert.equal(countLiteral(filterLogic, literal), expected, `${literal} count drifted`);
  }

  for (const phrase of [
    'Kids latest JSON owner extension source/fixture files: 3',
    'raw yt_kids_latest compactVideoRenderer tokens: 60',
    'base video rules block lines: 36',
    'harvest Kids owner block lines: 36',
    'video map fallback decision block lines: 13',
    'runtime Kids latest owner extension fixtures: 6'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('reduced fixture records yt_kids_latest provenance and two Kids compact siblings', () => {
  const fixture = loadFixture();

  assert.equal(fixture.provenance.source, 'yt_kids_latest.json');
  assert.equal(fixture.provenance.rendererType, 'compactVideoRenderer');
  assert.equal(fixture.provenance.extractedBlockIndex, 0);
  assert.equal(fixture.provenance.siblingBlockIndex, 1);
  assert.match(fixture.provenance.extractedPath, /kidsHomeScreenRenderer/);
  assert.deepEqual(videoIds(fixture.response), ['nGKm7EQ09rE', 'HgwlTY7M4og']);

  const [first, second] = compactItems(fixture.response).map((item) => item.compactVideoRenderer);
  assert.equal(first.kidsVideoOwnerExtension.externalChannelId, 'UCO0vPDAqN7BTK9kNAeP3sKw');
  assert.equal(second.kidsVideoOwnerExtension.externalChannelId, 'UChhs18W6Mp4MSB3FskumnXw');
  assert.equal(first.menu.menuRenderer.items[0].menuServiceItemRenderer.icon.iconType, 'KIDS_BLOCK');
  assert.equal(second.menu.menuRenderer.items[0].menuServiceItemRenderer.icon.iconType, 'KIDS_BLOCK');
});

test('Kids compact blocklist decision removes matching owner and preserves sibling', () => {
  const fixture = loadFixture();
  const { result } = run(fixture.response, {
    filterChannels: [{ id: 'UCO0vPDAqN7BTK9kNAeP3sKw' }]
  });

  assert.deepEqual(plain(videoIds(result)), ['HgwlTY7M4og']);
  assert.equal(compactItems(result)[0].compactVideoRenderer.title.runs[0].text, 'Car Bike Game: McQueen and Indian Tractor');
});

test('Kids owner extension can drive same-pass filtering through harvested videoChannelMap fallback', () => {
  const fixture = loadFixture();
  const stripped = stripBylineEndpoints(fixture.response);
  const first = compactItems(stripped)[0].compactVideoRenderer;

  assert.equal(first.shortBylineText.runs[0].navigationEndpoint, undefined);
  assert.equal(first.longBylineText.runs[0].navigationEndpoint, undefined);
  assert.equal(first.kidsVideoOwnerExtension.externalChannelId, 'UCO0vPDAqN7BTK9kNAeP3sKw');

  const { result } = run(stripped, {
    filterChannels: [{ id: 'UCO0vPDAqN7BTK9kNAeP3sKw' }]
  });

  assert.deepEqual(plain(videoIds(result)), ['HgwlTY7M4og']);
});

test('Kids compact whitelist decision preserves matching owner and removes nonmatching sibling', () => {
  const fixture = loadFixture();
  const { result } = run(fixture.response, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UCO0vPDAqN7BTK9kNAeP3sKw' }]
  });

  assert.deepEqual(plain(videoIds(result)), ['nGKm7EQ09rE']);
});

test('Kids latest fixture queues video-channel map updates for both compact video owners', () => {
  const fixture = loadFixture();
  const harness = run(fixture.response);
  harness.flushTimers();

  const videoMapMessages = harness.messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(plain(videoMapMessages[0].payload), [
    { videoId: 'nGKm7EQ09rE', channelId: 'UCO0vPDAqN7BTK9kNAeP3sKw' },
    { videoId: 'HgwlTY7M4og', channelId: 'UChhs18W6Mp4MSB3FskumnXw' }
  ]);

  const channelMapMessages = harness.messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  assert.equal(channelMapMessages.length, 2);
  assert.deepEqual(plain(channelMapMessages.map((message) => message.payload[0].id)), [
    'UCO0vPDAqN7BTK9kNAeP3sKw',
    'UChhs18W6Mp4MSB3FskumnXw'
  ]);
});

test('Kids latest owner-extension future authority symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of [
    'kidsLatestJsonOwnerExtensionFixtureContract',
    'kidsLatestCompactVideoOwnerDecisionReport',
    'kidsLatestOwnerExtensionHarvestReport',
    'kidsLatestSiblingPreservationFixture',
    'kidsLatestWhitelistDecisionPolicy',
    'kidsLatestRawCaptureProvenance',
    'kidsLatestVideoChannelMapSideEffectReport',
    'kidsLatestNativeParityReport',
    'kidsLatestMetricArtifact',
    'kidsLatestJsonFirstAuthorityGate'
  ]) {
    assert.ok(doc.includes(symbol), `doc should name missing future symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
  }
});
