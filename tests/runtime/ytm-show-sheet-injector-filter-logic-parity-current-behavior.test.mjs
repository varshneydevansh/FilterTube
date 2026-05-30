import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFilterTubeEngine } from './harness/load-filter-engine.mjs';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24.md';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';
const rawIndexPath = 'docs/audit/FILTERTUBE_RAW_CAPTURE_EXTRACTION_OBLIGATION_INDEX_2026-05-20.md';

const collaborators = [
  {
    name: 'shakiraVEVO',
    id: 'UCGnjeahCJW1AF34HBmQTJ-Q',
    handle: '@shakiraVEVO',
    customUrl: ''
  },
  {
    name: 'Spotify',
    id: 'UCYLNGLIzMhRTi6ZOLjAPSmw',
    handle: '@spotify',
    customUrl: ''
  },
  {
    name: 'Beele',
    id: 'UCRMqQWxCWE0VMvtUElm-rEA',
    handle: '@beele',
    customUrl: ''
  }
];

const futureAuthorityTokens = [
  'ytmShowSheetInjectorFilterLogicParityContract',
  'ytmShowSheetInjectorFilterLogicDecisionReport',
  'ytmShowSheetMainWorldRosterFilterParityReport',
  'ytmShowSheetSnapshotToFilterCandidateContract',
  'ytmShowSheetCollaboratorSharedExtractionPolicy',
  'ytmShowSheetWhitelistParityFixture',
  'ytmShowSheetBlocklistParityFixture',
  'ytmShowSheetParitySideEffectBudget',
  'ytmShowSheetParityNoWorkBudget',
  'ytmShowSheetParityJsonFirstGate'
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

function runFilterLogic(overrides = {}) {
  const { input } = inputFromFixture();
  const harness = loadFilterTubeEngine();
  const output = harness.engine.processData(
    plain(input),
    baseSettings(overrides),
    fixturePath
  );
  harness.flushTimers();
  return { input, output: plain(output), messages: plain(harness.messages) };
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

function loadInjectorRuntime(options = {}) {
  const source = read('js/injector.js');
  const marker = '})(); // End of IIFE';
  assert.ok(source.includes(marker), 'injector IIFE marker must exist for audit exports');
  const instrumented = source.replace(
    marker,
    [
      'window.__filterTubeAuditExports = {',
      '  extractCollaboratorsFromDataObject,',
      '  searchYtInitialDataForCollaborators',
      '};',
      marker
    ].join('\n')
  );

  const messages = [];
  const timers = { intervals: [], timeouts: [] };
  const listeners = {};
  const locationObject = {
    hostname: options.hostname || 'music.youtube.com',
    host: options.host || options.hostname || 'music.youtube.com',
    pathname: options.pathname || '/watch',
    search: options.search || '',
    origin: options.origin || `https://${options.hostname || 'music.youtube.com'}`
  };

  class EventStub {
    constructor(type) {
      this.type = type;
    }
  }

  class CustomEventStub extends EventStub {
    constructor(type, init = {}) {
      super(type);
      this.detail = init.detail;
    }
  }

  class NodeStub {}
  class ElementStub extends NodeStub {}

  const documentObject = {
    location: locationObject,
    documentElement: {
      getAttribute() {
        return null;
      }
    },
    body: {
      appendChild() {},
      removeChild() {}
    },
    addEventListener(type, handler) {
      listeners[`document:${type}`] = handler;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return new ElementStub();
    }
  };

  const windowObject = {
    filterTube: options.filterTube || {},
    ytInitialData: options.ytInitialData,
    ytInitialPlayerResponse: options.ytInitialPlayerResponse,
    __filtertubeDebug: false,
    location: locationObject,
    document: documentObject,
    top: null,
    self: null,
    FilterTubeIdentity: {
      extractCustomUrlFromPath(value) {
        const match = String(value || '').match(/\/c\/([^/?#]+)/);
        return match ? `/c/${match[1]}` : '';
      },
      extractChannelIdFromPath(value) {
        const match = String(value || '').match(/\/channel\/(UC[\w-]{22})/i);
        return match ? match[1] : '';
      }
    },
    addEventListener(type, handler) {
      listeners[`window:${type}`] = handler;
    },
    removeEventListener() {},
    postMessage(message) {
      messages.push(message);
    },
    dispatchEvent() {},
    scrollTo() {},
    setTimeout(handler, delay) {
      timers.timeouts.push({ handler, delay });
      return timers.timeouts.length;
    },
    clearTimeout() {},
    setInterval(handler, delay) {
      timers.intervals.push({ handler, delay });
      return timers.intervals.length;
    },
    clearInterval() {}
  };
  windowObject.top = windowObject;
  windowObject.self = windowObject;

  const context = {
    window: windowObject,
    document: documentObject,
    location: locationObject,
    console: {
      log() {},
      debug() {},
      warn() {},
      error() {}
    },
    browser: undefined,
    chrome: undefined,
    fetch: async () => ({
      ok: false,
      status: 500,
      json: async () => ({})
    }),
    AbortController,
    Event: EventStub,
    CustomEvent: CustomEventStub,
    Node: NodeStub,
    Element: ElementStub,
    URL,
    URLSearchParams,
    Date,
    Promise,
    WeakSet,
    Set,
    Map,
    Array,
    Object,
    String,
    Number,
    Boolean,
    JSON,
    setTimeout: windowObject.setTimeout,
    clearTimeout: windowObject.clearTimeout,
    setInterval: windowObject.setInterval,
    clearInterval: windowObject.clearInterval
  };
  context.globalThis = context;
  context.self = windowObject;
  vm.createContext(context);
  vm.runInContext(instrumented, context, { filename: path.join(repoRoot, 'js', 'injector.js') });

  return {
    exports: windowObject.__filterTubeAuditExports,
    messages,
    timers,
    listeners
  };
}

function productRuntimeSource() {
  return [
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js',
    'js/content_bridge.js',
    'js/content/dom_extractors.js',
    'js/content/dom_fallback.js'
  ].map(read).join('\n');
}

test('YTM showSheet injector/filter-logic parity doc and source facts are pinned', () => {
  const doc = read(docPath);
  const injector = read('js/injector.js');
  const filterLogic = read('js/filter_logic.js');
  const fixture = read(fixturePath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is unchanged/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /cross-owner mismatch/);
  assert.match(doc, /2026-05-30 Central Ledger Linkage/);
  assert.match(doc, /FILTERTUBE_OBJECTIVE_COVERAGE_LEDGER_2026-05-18\.md/);
  assert.match(doc, /FILTERTUBE_AUDIT_COMPLETION_GAP_REGISTER_2026-05-20\.md/);
  assert.match(doc, /ASCII flow:/);
  assert.match(doc, /flowchart TD/);
  assert.match(doc, /runtime behavior changed by this continuation: no/);
  assert.match(doc, /Shared JSON-first authority: NO-GO/);

  assert.equal(lineCount(injector), 3593);
  assert.equal(Buffer.byteLength(injector), 155830);
  assert.equal(sha256('js/injector.js'), '634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04');
  assert.equal(lineCount(filterLogic), 3498);
  assert.equal(Buffer.byteLength(filterLogic), 165151);
  assert.equal(sha256('js/filter_logic.js'), '4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641');
  assert.equal(lineCount(fixture), 104);
  assert.equal(Buffer.byteLength(fixture), 3818);
  assert.equal(sha256(fixturePath), 'e23da0992cec33040ce286d767c002a9171543dc07c5f5983cc505265fbaabfc');
});

test('injector recognizes showSheet collaborator shapes that filter_logic does not parse today', () => {
  const injector = read('js/injector.js');
  const filterLogic = read('js/filter_logic.js');

  assert.equal(countLiteral(injector, 'showSheetCommand'), 14);
  assert.equal(countLiteral(injector, 'showDialogCommand'), 15);
  assert.equal(countLiteral(injector, 'extractCollaboratorsFromDataObject'), 4);
  assert.equal(countLiteral(injector, 'searchYtInitialDataForCollaborators'), 2);
  assert.equal(countLiteral(injector, 'collaborators-sheet'), 2);
  assert.equal(countLiteral(injector, 'collaborator-fallback-list'), 1);

  assert.equal(countLiteral(filterLogic, 'showSheetCommand'), 0);
  assert.equal(countLiteral(filterLogic, 'showDialogCommand'), 11);
  assert.equal(countLiteral(filterLogic, 'extractCollaboratorsFromDataObject'), 0);
  assert.equal(countLiteral(filterLogic, 'searchYtInitialDataForCollaborators'), 0);
});

test('injector direct extraction returns the captured YTM showSheet roster', () => {
  const fixture = loadFixture();
  const runtime = loadInjectorRuntime();

  const extracted = runtime.exports.extractCollaboratorsFromDataObject(plain(fixture.renderer));

  assert.deepEqual(plain(extracted), collaborators);
  assert.ok(runtime.messages.some((message) => message.type === 'FilterTube_InjectorBridgeReady'));
});

test('injector snapshot search finds the captured YTM showSheet roster by video id', () => {
  const fixture = loadFixture();
  const runtime = loadInjectorRuntime({
    filterTube: {
      lastYtNextResponse: {
        contents: [{
          videoWithContextRenderer: plain(fixture.renderer)
        }]
      }
    }
  });

  const found = runtime.exports.searchYtInitialDataForCollaborators('capture-show-sheet-collab');

  assert.deepEqual(plain(found), collaborators);
});

test('filter logic still uses display byline for the same fixture and diverges by list mode', () => {
  const fixture = loadFixture();
  const { engine } = loadFilterTubeEngine();
  const filter = new engine.YouTubeDataFilter(baseSettings());
  const candidate = filter._buildCandidate(plain(fixture.renderer), 'videoWithContextRenderer', null, {
    extractChannelIdentity: true
  });

  assert.equal(candidate.channel.name, 'Shakira and 2 more');
  assert.equal(candidate.channel.id, '');
  assert.equal(candidate.channel.handle, '');
  assert.equal(candidate.collaborators.length, 1);

  const titleRun = runFilterLogic({
    filterKeywords: [keyword('Anniversary Version')]
  });
  assert.deepEqual(titleRun.output, { contents: [] });

  const blockRun = runFilterLogic({
    filterChannels: [{ id: collaborators[2].id, handle: collaborators[2].handle }]
  });
  assert.deepEqual(blockRun.output, blockRun.input);
  assert.deepEqual(blockRun.messages, expectedMapMessages());

  const allowRun = runFilterLogic({
    listMode: 'whitelist',
    whitelistChannels: [{ id: collaborators[2].id, handle: collaborators[2].handle }]
  });
  assert.deepEqual(allowRun.output, { contents: [] });
  assert.deepEqual(allowRun.messages, expectedMapMessages());
});

test('YTM-XHR raw capture index records the injector/filter-logic parity gap as partial coverage', () => {
  const rawIndex = read(rawIndexPath);
  const runtimeResults = read(runtimeResultsPath);

  assert.match(rawIndex, /`YTM-XHR\.json`/);
  assert.match(rawIndex, /ytm-show-sheet-collab-video-with-context-renderer\.json/);
  assert.match(rawIndex, /FILTERTUBE_YTM_SHOW_SHEET_COLLABORATOR_ROSTER_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(rawIndex, /FILTERTUBE_YTM_SHOW_SHEET_INJECTOR_FILTER_LOGIC_PARITY_CURRENT_BEHAVIOR_2026-05-24\.md/);
  assert.match(rawIndex, /injector can recover the showSheet roster while filter_logic still does not use it for blocklist\/whitelist decisions/);

  assert.ok(runtimeResults.includes('tests/runtime/ytm-show-sheet-injector-filter-logic-parity-current-behavior.test.mjs'));
  assert.match(runtimeResults, /can parse the same YTM showSheet roster that `js\/filter_logic\.js` does not consume as candidate channel identity/);
});

test('YTM showSheet injector/filter-logic parity remains a future authority gate', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const productSource = productRuntimeSource();

  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(productSource, new RegExp(token));
  }
});
