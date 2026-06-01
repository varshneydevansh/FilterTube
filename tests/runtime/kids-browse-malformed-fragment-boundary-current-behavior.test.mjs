import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_KIDS_BROWSE_MALFORMED_FRAGMENT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md';
const fixturePath = 'tests/runtime/fixtures/captures/kids-browse-malformed-fragment-compact-video.json';

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

function countLiteral(text, literal) {
  return text.split(literal).length - 1;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
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
          text: text.slice(start, index + 1)
        });
        start = -1;
      }
    }
  }

  return fragments;
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
    'kids-browse-malformed-fragment-fixture'
  );
  return { ...harness, result };
}

function ownerItems(data) {
  return data.contents.kidsLibraryRenderer.anchors[0]
    .anchoredSectionRenderer.content.sectionListRenderer.contents[0]
    .itemSectionRenderer.contents;
}

function videoItems(data) {
  return data.contents.kidsLibraryRenderer.anchors[1]
    .anchoredSectionRenderer.content.sectionListRenderer.contents[0]
    .itemSectionRenderer.contents;
}

function ownerNames(data) {
  return ownerItems(data).map((item) => item.kidsSlimOwnerRenderer.title.runs[0].text);
}

function videoIds(data) {
  return videoItems(data).map((item) => item.compactVideoRenderer.videoId);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

test('Kids browse malformed fragment audit is audit-only and source pinned', () => {
  const doc = read(docPath);
  const raw = read('ytkids_browse?alt=json.json');
  const filterLogic = read('js/filter_logic.js');
  const fixture = read(fixturePath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /This is not an implementation patch/);
  assert.match(doc, /not completion proof for Kids browse raw-container authority/);

  assert.equal(lineCount(raw), 8630);
  assert.equal(Buffer.byteLength(raw), 446776);
  assert.equal(sha256('ytkids_browse?alt=json.json'), 'fdadb983bbb5fa2e19b81c29bde860a0019c4a171bee00b36e42ae25adc3f240');
  assert.equal(lineCount(filterLogic), 3652);
  assert.equal(Buffer.byteLength(filterLogic), 172174);
  assert.equal(sha256('js/filter_logic.js'), '953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5');
  assert.equal(lineCount(fixture), 235);
  assert.equal(Buffer.byteLength(fixture), 9959);
  assert.equal(sha256(fixturePath), '40f84c7de6a385a111bf55aa23179e170f0e1a274cc96ae4cc092203ba8f954f');

  for (const artifact of [
    'docs/audit/FILTERTUBE_CAPTURE_FIXTURE_TRACEABILITY_2026-05-18.md',
    'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md',
    'docs/audit/FILTERTUBE_KIDS_LATEST_JSON_OWNER_EXTENSION_FIXTURE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md',
    'docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md',
    'docs/audit/FILTERTUBE_JSON_SECTION_COVERAGE_INDEX_2026-05-20.md'
  ]) {
    assert.ok(doc.includes(artifact), `missing linked artifact ${artifact}`);
  }
});

test('Kids browse malformed raw container and fragment counts stay pinned', () => {
  const doc = read(docPath);
  const raw = read('ytkids_browse?alt=json.json');
  const filterLogic = read('js/filter_logic.js');
  const fragments = topLevelJsonFragments(raw);

  assert.throws(() => JSON.parse(raw), SyntaxError);
  assert.equal(fragments.length, 5);
  assert.equal(fragments[4].line, 688);
  assert.equal(Buffer.byteLength(fragments[4].text), 423123);
  assert.deepEqual(Object.keys(JSON.parse(fragments[4].text)), ['responseContext', 'contents', 'trackingParams']);

  assert.equal(countLiteral(raw, '"compactVideoRenderer"'), 40);
  assert.equal(countLiteral(raw, '"kidsVideoOwnerExtension"'), 40);
  assert.equal(countLiteral(raw, '"externalChannelId"'), 40);
  assert.equal(countLiteral(raw, '"KIDS_BLOCK"'), 40);
  assert.equal(countLiteral(raw, '"kidsSlimOwnerRenderer"'), 5);
  assert.equal(countLiteral(raw, 'accounts_list?alt=json'), 1);
  assert.equal(countLiteral(raw, 'next XHR -'), 2);

  assert.equal(countLiteral(filterLogic, 'kidsSlimOwnerRenderer'), 0);
  assert.equal(countLiteral(filterLogic, 'kidsLibraryRenderer'), 0);
  assert.equal(countLiteral(filterLogic, 'compactVideoRenderer'), 9);
  assert.equal(countLiteral(filterLogic, 'kidsVideoOwnerExtension'), 2);
  assert.equal(countLiteral(filterLogic, 'videoChannelMap'), 10);

  for (const phrase of [
    'Kids browse malformed fragment source/fixture files: 3',
    'raw ytkids_browse direct JSON parse ok: false',
    'raw ytkids_browse balanced top-level JSON fragments: 5',
    'raw ytkids_browse browse fragment start line: 688',
    'raw ytkids_browse browse fragment bytes: 423123',
    'raw ytkids_browse compactVideoRenderer tokens: 40',
    'raw ytkids_browse kidsSlimOwnerRenderer tokens: 5',
    'filter_logic kidsSlimOwnerRenderer tokens: 0',
    'runtime Kids browse malformed fragment fixtures: 7'
  ]) {
    assert.ok(doc.includes(phrase), `missing count phrase ${phrase}`);
  }
});

test('reduced fixture records malformed ytkids browse provenance, owner rail, and compact siblings', () => {
  const fixture = loadFixture();

  assert.equal(fixture.provenance.source, 'ytkids_browse?alt=json.json');
  assert.equal(fixture.provenance.rawContainer, 'malformed direct JSON with request/log prelude plus balanced JSON fragments');
  assert.equal(fixture.provenance.fragmentIndex, 4);
  assert.equal(fixture.provenance.fragmentStartLine, 688);
  assert.equal(fixture.provenance.fragmentBytes, 423123);
  assert.equal(fixture.provenance.rendererType, 'compactVideoRenderer');
  assert.equal(fixture.provenance.ownerRailRendererType, 'kidsSlimOwnerRenderer');
  assert.match(fixture.provenance.extractedPath, /kidsLibraryRenderer\.anchors\.1/);
  assert.match(fixture.provenance.ownerRailPath, /kidsLibraryRenderer\.anchors\.0/);

  assert.deepEqual(ownerNames(fixture.response), ['Thomas & Friends UK', 'Little Learners']);
  assert.deepEqual(videoIds(fixture.response), ['Gh-XKNuvvC4', 'G-xKXHAWPYU']);

  const [first, second] = videoItems(fixture.response).map((item) => item.compactVideoRenderer);
  assert.equal(first.kidsVideoOwnerExtension.externalChannelId, 'UC5PYHgAzJ1wLEidB58SK6Xw');
  assert.equal(second.kidsVideoOwnerExtension.externalChannelId, 'UCw0Mbalwv25Zk756uAONAmg');
  assert.equal(first.menu.menuRenderer.items[0].menuServiceItemRenderer.icon.iconType, 'KIDS_BLOCK');
  assert.equal(second.menu.menuRenderer.items[0].menuServiceItemRenderer.icon.iconType, 'KIDS_BLOCK');
});

test('Kids browse blocklist removes matching compact video while owner rail remains visible', () => {
  const fixture = loadFixture();
  const { result } = run(fixture.response, {
    filterChannels: [{ id: 'UCw0Mbalwv25Zk756uAONAmg' }]
  });

  assert.deepEqual(plain(videoIds(result)), ['Gh-XKNuvvC4']);
  assert.deepEqual(plain(ownerNames(result)), ['Thomas & Friends UK', 'Little Learners']);
});

test('Kids browse whitelist preserves matching compact video while owner rail remains visible', () => {
  const fixture = loadFixture();
  const { result } = run(fixture.response, {
    listMode: 'whitelist',
    whitelistChannels: [{ id: 'UC5PYHgAzJ1wLEidB58SK6Xw' }]
  });

  assert.deepEqual(plain(videoIds(result)), ['Gh-XKNuvvC4']);
  assert.deepEqual(plain(ownerNames(result)), ['Thomas & Friends UK', 'Little Learners']);
});

test('Kids browse malformed fixture queues owner rail and compact video map updates', () => {
  const fixture = loadFixture();
  const harness = run(fixture.response);
  harness.flushTimers();

  const channelMapMessages = harness.messages.filter((message) => message.type === 'FilterTube_UpdateChannelMap');
  assert.equal(channelMapMessages.length, 3);
  assert.deepEqual(plain(channelMapMessages.map((message) => message.payload[0])), [
    { id: 'UCo5AoxvDzhX1Gua_aU2Rr6w', handle: '@thomasandfriends_uk' },
    { id: 'UCw0Mbalwv25Zk756uAONAmg', handle: '@Little-Learners-Channel' },
    { id: 'UC5PYHgAzJ1wLEidB58SK6Xw', handle: '@Blippi' }
  ]);

  const videoMapMessages = harness.messages.filter((message) => message.type === 'FilterTube_UpdateVideoChannelMap');
  assert.equal(videoMapMessages.length, 1);
  assert.deepEqual(plain(videoMapMessages[0].payload), [
    { videoId: 'Gh-XKNuvvC4', channelId: 'UC5PYHgAzJ1wLEidB58SK6Xw' },
    { videoId: 'G-xKXHAWPYU', channelId: 'UCw0Mbalwv25Zk756uAONAmg' }
  ]);
});

test('Kids browse malformed future authority symbols remain absent from product runtime', () => {
  const runtime = productRuntimeSource();
  const doc = read(docPath);

  for (const symbol of [
    'kidsBrowseMalformedFragmentContract',
    'kidsBrowseRawContainerAdmissionReport',
    'kidsBrowseFragmentExtractionPolicy',
    'kidsBrowseCompactVideoDecisionReport',
    'kidsBrowseOwnerRailDecisionReport',
    'kidsBrowseOwnerRailWhitelistPolicy',
    'kidsBrowseVideoMapSideEffectReport',
    'kidsBrowseNativeWebViewParityReport',
    'kidsBrowseMetricArtifact',
    'kidsBrowseJsonFirstAuthorityGate'
  ]) {
    assert.ok(doc.includes(symbol), `doc should name missing future symbol ${symbol}`);
    assert.equal(runtime.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
  }
});
