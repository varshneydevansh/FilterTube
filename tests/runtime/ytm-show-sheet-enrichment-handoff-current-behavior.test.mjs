import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_YTM_SHOW_SHEET_ENRICHMENT_HANDOFF_CURRENT_BEHAVIOR_2026-05-24.md';
const fixturePath = 'tests/runtime/fixtures/captures/ytm-show-sheet-collab-video-with-context-renderer.json';
const runtimeResultsPath = 'docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md';

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
  'ytmShowSheetEnrichmentHandoffContract',
  'ytmShowSheetBridgeLookupOptionReport',
  'ytmShowSheetInjectorMatcherReport',
  'ytmShowSheetEnrichmentApplicationReport',
  'ytmShowSheetFilterAuthorityBoundary',
  'ytmShowSheetHandoffSideEffectBudget',
  'ytmShowSheetHandoffNoWorkBudget',
  'ytmShowSheetSharedRosterDecisionGate'
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

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function loadFixture() {
  return JSON.parse(read(fixturePath));
}

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map(Object.entries(attrs).map(([key, value]) => [key, String(value)]));
    this.card = this;
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }
}

function loadBridgeLookupRuntime() {
  const bridge = read('js/content_bridge.js');
  const lookupBlock = sliceBetween(
    bridge,
    'function buildCollaboratorLookupRequestOptions({ card = null, element = null, partialCollaborators = [], channelInfo = null } = {}) {',
    'function requestCollaboratorEnrichment'
  );

  const context = {
    JSON,
    Set,
    Array,
    Math,
    parseInt
  };
  context.globalThis = context;

  const harness = `
    function findVideoCardElement(element) {
      return element?.card || element || null;
    }

    function normalizeHandleValue(value) {
      const raw = String(value || '').trim().replace(/^\\/+/, '');
      if (!raw) return '';
      return raw.startsWith('@') ? raw : '@' + raw;
    }

    function sanitizeCollaboratorList(collaborators = []) {
      if (!Array.isArray(collaborators)) return [];
      const seen = new Set();
      const out = [];
      for (const collab of collaborators) {
        if (!collab || typeof collab !== 'object') continue;
        const normalized = {
          name: String(collab.name || '').trim(),
          handle: normalizeHandleValue(collab.handle || ''),
          id: String(collab.id || '').trim(),
          customUrl: String(collab.customUrl || '').trim()
        };
        const key = (normalized.id || normalized.handle || normalized.customUrl || normalized.name).toLowerCase();
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(normalized);
      }
      return out;
    }

    function getCachedCollaboratorsFromCard(card) {
      const raw = card?.getAttribute?.('data-filtertube-collaborators') || '';
      if (!raw) return [];
      try {
        return sanitizeCollaboratorList(JSON.parse(raw));
      } catch (_) {
        return [];
      }
    }

    function parseCollaboratorNames(rawText = '') {
      if (!rawText || typeof rawText !== 'string') {
        return { names: [], hasHiddenCollaborators: false, hiddenCount: 0 };
      }
      const normalized = rawText.replace(/\\s+/g, ' ').trim();
      const hiddenMatch = normalized.match(/\\b(\\d+)\\s+more\\b/i);
      const hiddenCount = hiddenMatch ? parseInt(hiddenMatch[1], 10) || 0 : 0;
      const hasHiddenCollaborators = hiddenCount > 0;
      const baseText = hasHiddenCollaborators
        ? normalized.replace(/\\s*(?:,|&|\\band\\b)\\s+\\d+\\s+more\\b.*$/i, '').trim()
        : normalized;
      const names = baseText
        ? baseText.split(/\\s*(?:,|&|\\band\\b)\\s*/i).map(item => item.trim()).filter(Boolean)
        : [];
      return { names, hasHiddenCollaborators, hiddenCount };
    }

    ${lookupBlock}

    globalThis.__bridgeAuditExports = { buildCollaboratorLookupRequestOptions };
  `;

  vm.createContext(context);
  vm.runInContext(harness, context, { filename: path.join(repoRoot, 'js', 'content_bridge.js') });
  return context.__bridgeAuditExports;
}

function bridgeOptionsForCapturedPartialSeed() {
  const bridgeRuntime = loadBridgeLookupRuntime();
  const card = new FakeElement({
    'data-filtertube-video-id': 'capture-show-sheet-collab',
    'data-filtertube-expected-collaborators': '3'
  });

  return bridgeRuntime.buildCollaboratorLookupRequestOptions({
    card,
    partialCollaborators: [{ name: 'Shakira', handle: '', id: '', customUrl: '' }]
  });
}

function loadInjectorRuntime(options = {}) {
  const source = read('js/injector.js');
  const marker = '})(); // End of IIFE';
  assert.ok(source.includes(marker), 'injector IIFE marker must exist for audit exports');
  const instrumented = source.replace(
    marker,
    [
      'window.__filterTubeAuditExports = {',
      '  buildExpectedMatcher,',
      '  isValidCollaboratorResponse,',
      '  searchYtInitialDataForCollaborators,',
      '  extractCollaboratorsFromDataObject',
      '};',
      marker
    ].join('\n')
  );

  const messages = [];
  const listeners = {};
  const timers = { intervals: [], timeouts: [] };
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
    'js/content_bridge.js',
    'js/injector.js',
    'js/filter_logic.js',
    'js/seed.js'
  ].map(read).join('\n');
}

test('YTM showSheet enrichment handoff doc and source facts are pinned', () => {
  const doc = read(docPath);
  const bridge = read('js/content_bridge.js');
  const injector = read('js/injector.js');
  const filterLogic = read('js/filter_logic.js');
  const fixture = read(fixturePath);

  assert.match(doc, /Status: audit-only current-behavior fixture slice/);
  assert.match(doc, /Runtime behavior is\s+unchanged/);
  assert.match(doc, /not an implementation patch/);
  assert.match(doc, /headerless YTM showSheet/);

  assert.equal(lineCount(bridge), 13571);
  assert.equal(Buffer.byteLength(bridge), 601694);
  assert.equal(sha256('js/content_bridge.js'), '1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3');
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

test('content bridge lookup options preserve captured partial seed and expected roster count', () => {
  const options = bridgeOptionsForCapturedPartialSeed();

  assert.deepEqual(plain(options.expectedNames), ['Shakira']);
  assert.deepEqual(plain(options.expectedHandles), []);
  assert.equal(options.expectedCollaboratorCount, 3);
  assert.equal(options.allowRosterFallbackForCollabMarkup, false);
  assert.deepEqual(plain(options.cachedCollaborators), []);
});

test('injector matcher promotes bridge expected count into collaborator roster fallback', () => {
  const runtime = loadInjectorRuntime();
  const bridgeOptions = bridgeOptionsForCapturedPartialSeed();
  const matcher = runtime.exports.buildExpectedMatcher(bridgeOptions);

  assert.equal(matcher.hasAny, true);
  assert.equal(matcher.expectedCollaboratorCount, 3);
  assert.equal(matcher.allowRosterFallbackForCollabMarkup, true);
  assert.equal(matcher.matchesAny(collaborators[0]), true);
  assert.equal(runtime.exports.isValidCollaboratorResponse(collaborators, matcher), true);
});

test('injector snapshot lookup returns the full captured roster from bridge handoff options', () => {
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
  const matcher = runtime.exports.buildExpectedMatcher(bridgeOptionsForCapturedPartialSeed());

  const found = runtime.exports.searchYtInitialDataForCollaborators('capture-show-sheet-collab', matcher);

  assert.deepEqual(plain(found), collaborators);
});

test('YTM showSheet enrichment handoff remains outside filter authority and future gates', () => {
  const doc = read(docPath);
  const runtimeResults = read(runtimeResultsPath);
  const filterLogic = read('js/filter_logic.js');
  const source = productRuntimeSource();

  assert.equal(countLiteral(filterLogic, 'showSheetCommand'), 0);
  assert.ok(runtimeResults.includes('tests/runtime/ytm-show-sheet-enrichment-handoff-current-behavior.test.mjs'));
  assert.match(runtimeResults, /tests 4457/);
  assert.match(runtimeResults, /pass 4457/);

  for (const token of futureAuthorityTokens) {
    assert.match(doc, new RegExp(token));
    assert.doesNotMatch(source, new RegExp(token));
  }
});
