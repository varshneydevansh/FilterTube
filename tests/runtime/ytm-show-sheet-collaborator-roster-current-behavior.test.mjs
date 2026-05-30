import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const rawPath = 'YTM-XHR.json';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json';
const docPath = 'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24.md';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

const collaborators = [
  {
    title: 'shakiraVEVO',
    id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    handle: '@shakiraVEVO',
    canonicalBaseUrl: '/@shakiraVEVO'
  },
  {
    title: 'Spotify',
    id: 'UCYLNGLIzMhRTi6ZOLjAPSmw',
    handle: '@spotify',
    canonicalBaseUrl: '/@spotify'
  },
  {
    title: 'Beele',
    id: 'UCRMqQWxCWE0VMvtUElm-rEA',
    handle: '@beele',
    canonicalBaseUrl: '/@beele'
  }
];

const futureAuthorityTokens = [
  'ytmShowSheetCollaboratorContract',
  'ytmShowSheetCollaboratorDecisionReport',
  'ytmShowSheetCollaboratorWhitelistPolicy',
  'ytmShowSheetCollaboratorBlocklistPolicy',
  'ytmShowSheetCollaboratorCandidateExtractionReport',
  'ytmShowSheetCollaboratorSideEffectBudget',
  'ytmShowSheetCollaboratorNoWorkBudget',
  'ytmShowSheetCollaboratorJsonFirstGate'
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function keyword(pattern, flags = 'i') {
  return { pattern, flags };
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

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

function inputFromFixture() {
  const fixture = loadFixture();
  return {
    fixture,
    input: {
      contents: [{
        videoWithContextRenderer: plain(fixture.renderer)
      }]
    }
  };
}

function runFixture(overrides = {}) {
  const { fixture, input } = inputFromFixture();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { fixture, input, output: plain(output), messages: plain(harness.messages) };
}

function expectedMapMessages() {
  return collaborators.map((collaborator) => ({
    type: 'FilterTube_UpdateChannelMap',
    payload: [{
      id: collaborator.id,
      handle: collaborator.handle
    }],
    source: 'filter_logic'
  }));
}

function rosterItems(renderer) {
  return renderer.shortBylineText.runs[0].navigationEndpoint.showSheetCommand
    .panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems
    .map((item) => item.listItemViewModel);
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

test('YTM showSheet collaborator audit doc and fixture provenance are pinned', () => {
  const doc = read(docPath);
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const fixture = loadFixture();

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /first-class JSON filter authority/);
  assert.match(doc, /## Filter-Authority Flow - 2026-05-27/);
  assert.match(doc, /```text\nYTM-XHR\.json/);
  assert.match(doc, /```mermaid\nflowchart TD/);
  assert.match(doc, /filter_logic\.js has 0 showSheetCommand tokens/);
  assert.match(doc, /Blocklist channel rule leaks/);
  assert.match(doc, /Whitelist channel allow false-hides/);
  assert.match(doc, /FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(doc, /FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(doc, /Kully B & Gussy G - Topic/);

  assert.equal(lineCount(raw), 49806);
  assert.equal(Buffer.byteLength(raw), 5141307);
  assert.equal(sha256(rawPath), '8c3f3695c69dc865d2eade43eb8e0dc7b44e2fdeff19417269a8cb24a7b54773');
  assert.equal(lineCount(fixtureText), 104);
  assert.equal(Buffer.byteLength(fixtureText), 3818);
  assert.equal(sha256(fixturePath), 'e23da0992cec33040ce286d767c002a9171543dc07c5f5983cc505265fbaabfc');
  assert.equal(fixture.provenance.source, rawPath);
  assert.equal(fixture.provenance.rendererType, 'videoWithContextRenderer');
  assert.equal(
    fixture.provenance.extractedPath,
    'onResponseReceivedEndpoints.0.appendContinuationItemsAction.continuationItems.3.videoWithContextRenderer'
  );
});

test('YTM showSheet raw source and reduced fixture carry the three collaborator identities', () => {
  const raw = read(rawPath);
  const fixtureText = read(fixturePath);
  const renderer = loadFixture().renderer;
  const items = rosterItems(renderer);

  assert.equal(countLiteral(raw, 'showSheetCommand'), 116);
  assert.equal(countLiteral(raw, 'showDialogCommand'), 0);
  assert.equal(countLiteral(raw, 'videoWithContextRenderer'), 59);
  assert.equal(countLiteral(raw, 'listItemViewModel'), 67);
  assert.equal(countLiteral(raw, 'browseEndpoint'), 274);
  assert.equal(countLiteral(fixtureText, 'showSheetCommand'), 2);
  assert.equal(countLiteral(fixtureText, 'showDialogCommand'), 0);
  assert.equal(items.length, 3);

  assert.equal(renderer.videoId, 'capture-show-sheet-collab');
  assert.equal(
    renderer.headline.runs.map((run) => run.text).join(''),
    "Shakira, Ed Sheeran, Beele - Hips Don't Lie (Anniversary Version)"
  );
  assert.equal(renderer.shortBylineText.runs[0].text, 'Shakira and 2 more');

  collaborators.forEach((collaborator, index) => {
    const browse = items[index].rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint;
    assert.equal(items[index].title.content, collaborator.title);
    assert.equal(browse.browseId, collaborator.id);
    assert.equal(browse.canonicalBaseUrl, collaborator.canonicalBaseUrl);
    assert.match(raw, new RegExp(collaborator.id));
  });
});

test('filter logic supports videoWithContextRenderer but does not parse showSheet collaborator rosters today', () => {
  const filterLogic = read('js/filter_logic.js');
  const candidateDoc = read('docs/audit/FILTERTUBE_JSON_FIRST_CANDIDATE_EXTRACTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md');
  const rendererAuthorityDoc = read('docs/audit/FILTERTUBE_P0_RENDERER_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md');

  assert.match(filterLogic, /videoWithContextRenderer:\s*\{/);
  assert.equal(countLiteral(filterLogic, 'videoWithContextRenderer'), 10);
  assert.equal(countLiteral(filterLogic, 'showDialogCommand'), 11);
  assert.equal(countLiteral(filterLogic, 'showSheetCommand'), 0);
  assert.match(candidateDoc, /showSheet collaborators/);
  assert.match(candidateDoc, /not parsed by this extractor today/);
  assert.match(rendererAuthorityDoc, /renderer_authority_show_sheet_collaborator_blocklist_and_whitelist_gap/);
});

test('candidate extraction collapses the showSheet roster to a display byline today', () => {
  const fixture = loadFixture();
  const { engine, messages } = loadFilterTubeEngine();
  const filter = new engine.YouTubeDataFilter(baseSettings());
  const candidate = filter._buildCandidate(plain(fixture.renderer), 'videoWithContextRenderer', null, {
    extractChannelIdentity: true
  });

  assert.equal(candidate.videoId, '');
  assert.equal(candidate.title, "Shakira, Ed Sheeran, Beele - Hips Don't Lie (Anniversary Version)");
  assert.equal(Array.isArray(candidate.channel), false);
  assert.equal(candidate.channel.name, 'Shakira and 2 more');
  assert.equal(candidate.channel.id, '');
  assert.equal(candidate.channel.handle, '');
  assert.equal(candidate.channel.customUrl, '');
  assert.equal(candidate.collaborators.length, 1);
  assert.deepEqual(candidate.collaborators[0], candidate.channel);
  assert.deepEqual(messages, []);
});

test('no-rule and disabled YTM showSheet processing preserve the row but still harvest roster map messages', () => {
  for (const overrides of [{}, { enabled: false }]) {
    const run = runFixture(overrides);

    assert.deepEqual(run.output, run.input);
    assert.deepEqual(run.messages, expectedMapMessages());
  }
});

test('blocklist title filtering works but showSheet collaborator channel blocklist rules leak today', () => {
  const titleRun = runFixture({
    filterKeywords: [keyword('Anniversary Version')]
  });

  assert.deepEqual(titleRun.output, { contents: [] });
  assert.deepEqual(titleRun.messages, expectedMapMessages());

  for (const collaborator of collaborators) {
    const channelRun = runFixture({
      filterChannels: [{
        id: collaborator.id,
        handle: collaborator.handle
      }]
    });

    assert.deepEqual(channelRun.output, channelRun.input);
    assert.deepEqual(channelRun.messages, expectedMapMessages());
  }
});

test('whitelist title allow works but showSheet collaborator channel allow false-hides today', () => {
  const titleAllowRun = runFixture({
    listMode: 'whitelist',
    whitelistKeywords: [keyword('Anniversary Version')]
  });

  assert.deepEqual(titleAllowRun.output, titleAllowRun.input);
  assert.deepEqual(titleAllowRun.messages, expectedMapMessages());

  for (const collaborator of collaborators) {
    const channelAllowRun = runFixture({
      listMode: 'whitelist',
      whitelistChannels: [{
        id: collaborator.id,
        handle: collaborator.handle
      }]
    });

    assert.deepEqual(channelAllowRun.output, { contents: [] });
    assert.deepEqual(channelAllowRun.messages, expectedMapMessages());
  }
});

test('YTM showSheet collaborator roster remains a future JSON-first authority gate', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const productSource = productRuntimeSource();

  assert.ok(runtimeResults.includes('tests/runtime/ytm-show-sheet-collaborator-roster-current-behavior.test.mjs'));
  assert.match(runtimeResults, /YTM showSheetCommand collaborator roster/);
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(productSource, new RegExp(token));
  }
});
