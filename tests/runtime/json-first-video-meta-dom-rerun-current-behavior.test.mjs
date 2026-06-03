import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const repoRoot = process.cwd();
const docPath = 'docs/audit/FILTERTUBE_JSON_FIRST_VIDEO_META_DOM_RERUN_CURRENT_BEHAVIOR_2026-05-22.md';

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

function countLiteral(source, literal) {
  return source.split(literal).length - 1;
}

function sliceBetween(text, startNeedle, endNeedle) {
  const start = text.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing start needle ${startNeedle}`);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing end needle ${endNeedle}`);
  return text.slice(start, end);
}

function productRuntimeSource() {
  return git(['ls-files', '*.js', '*.jsx', '*.mjs'])
    .filter((file) => !file.startsWith('tests/'))
    .filter((file) => !file.startsWith('website/'))
    .filter((file) => !file.startsWith('js/vendor/'))
    .map(read)
    .join('\n');
}

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map();
    this.removes = [];
    this.writes = [];
    for (const [key, value] of Object.entries(attrs)) {
      this.attrs.set(key, String(value));
    }
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
    this.writes.push([name, String(value)]);
  }

  removeAttribute(name) {
    this.attrs.delete(name);
    this.removes.push(name);
  }
}

class FakeAnchor {
  constructor(videoId, card) {
    this.videoId = videoId;
    this.card = card;
  }
}

function makeFixedDate(nowMs) {
  function FixedDate(...args) {
    return args.length > 0 ? new Date(...args) : new Date(nowMs);
  }
  FixedDate.now = () => nowMs;
  FixedDate.parse = Date.parse;
  FixedDate.UTC = Date.UTC;
  FixedDate.prototype = Date.prototype;
  return FixedDate;
}

function loadVideoMetaRuntime({ initialSettings = {}, cards = [], anchors = [], nowMs = 1700000000000 } = {}) {
  const bridge = read('js/content_bridge.js');
  const persistBlock = sliceBetween(
    bridge,
    'function persistVideoMetaMapping(entries = []) {',
    '\n\nlet pendingVideoMetaDomRerunTimer'
  );
  const scheduleBlock = sliceBetween(
    bridge,
    'let pendingVideoMetaDomRerunTimer = 0;',
    '\n\nfunction touchDomForVideoMetaUpdate'
  );
  const touchBlock = sliceBetween(
    bridge,
    'function touchDomForVideoMetaUpdate(videoId) {',
    '\n\nconst pendingWatchMetaFetches'
  );
  const fetchQueueBlock = sliceBetween(
    bridge,
    'const pendingWatchMetaFetches = new Map();',
    '\n\nasync function fetchVideoMetaFromWatchUrl'
  );
  const messageBlock = sliceBetween(
    bridge,
    'function handleMainWorldMessages(event) {',
    '\n\nasync function initialize()'
  );

  const messages = [];
  const timers = [];
  const clearedTimers = [];
  const fallbackCalls = [];
  const fetches = [];
  let nextTimerId = 1;

  const documentObject = {
    querySelectorAll(selector) {
      const text = String(selector || '');
      const direct = text.match(/^\[data-filtertube-video-id="([^"]+)"\]$/);
      if (direct) {
        return cards.filter((card) => card.getAttribute('data-filtertube-video-id') === direct[1]);
      }
      return anchors.filter((anchor) => {
        return text.includes(`watch?v=${anchor.videoId}`) ||
          text.includes(`/watch?v=${anchor.videoId}`) ||
          text.includes(`/shorts/${anchor.videoId}`) ||
          text.includes(`/watch/${anchor.videoId}`);
      });
    },
    querySelector() {
      return null;
    }
  };

  const context = {
    currentSettings: { ...initialSettings },
    document: documentObject,
    console: { log() {}, warn() {}, error() {} },
    browserAPI_BRIDGE: {
      runtime: {
        sendMessage(message) {
          messages.push(message);
        }
      }
    },
    setTimeout(handler, delay) {
      const id = nextTimerId++;
      timers.push({ id, handler, delay, cleared: false, fired: false });
      return id;
    },
    clearTimeout(id) {
      clearedTimers.push(id);
      const timer = timers.find((entry) => entry.id === id);
      if (timer) timer.cleared = true;
    },
    applyDOMFallback(...args) {
      fallbackCalls.push(args);
    },
    clearCachedChannelMetadata(node) {
      node.removeAttribute('data-filtertube-channel-id');
      node.removeAttribute('data-filtertube-channel-handle');
      node.removeAttribute('data-filtertube-channel-name');
      node.removeAttribute('data-filtertube-channel-custom');
    },
    findVideoCardElement(anchor) {
      return anchor?.card || null;
    },
    async fetchVideoMetaFromWatchUrl(videoId) {
      fetches.push(videoId);
      return null;
    },
    Date: makeFixedDate(nowMs),
    Array,
    Boolean,
    JSON,
    Map,
    Math,
    Number,
    Object,
    Promise,
    Set,
    String,
    parseInt
  };
  context.window = context;
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    [
      persistBlock,
      scheduleBlock,
      touchBlock,
      fetchQueueBlock,
      messageBlock,
      'globalThis.__videoMetaExports = {',
      '  persistVideoMetaMapping,',
      '  scheduleVideoMetaDomRerun,',
      '  touchDomForVideoMetaUpdate,',
      '  scheduleVideoMetaFetch,',
      '  handleMainWorldMessages',
      '};'
    ].join('\n'),
    context,
    { filename: path.join(repoRoot, 'js', 'content_bridge.js') }
  );

  return {
    ...context.__videoMetaExports,
    context,
    messages,
    timers,
    clearedTimers,
    fallbackCalls,
    fetches,
    dispatchMessage(data) {
      context.__messageData = data;
      vm.runInContext(
        'handleMainWorldMessages({ source: window, data: __messageData });',
        context
      );
      delete context.__messageData;
    },
    fireTimer(id) {
      const timer = timers.find((entry) => entry.id === id);
      assert.ok(timer, `missing timer ${id}`);
      assert.equal(timer.cleared, false, `timer ${id} was cleared`);
      timer.fired = true;
      timer.handler();
    }
  };
}

test('JSON-first video meta DOM rerun audit is audit-only and source pinned', () => {
  const text = doc();
  const hashes = {
    'js/content_bridge.js': 'c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c',
    'js/content/dom_fallback.js': 'fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5',
    'js/background.js': '77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad'
  };

  assert.match(text, /Status: current-behavior register with a narrow no-op DOM work fix/);
  assert.match(text, /duplicate video metadata page-message rows/);
  assert.match(text, /not a broad JSON-first patch/);
  assert.equal(lineCount(read('js/content_bridge.js')), 13571);
  assert.equal(Buffer.byteLength(read('js/content_bridge.js')), 601694);
  assert.equal(lineCount(read('js/content/dom_fallback.js')), 5030);
  assert.equal(Buffer.byteLength(read('js/content/dom_fallback.js')), 235555);
  assert.equal(lineCount(read('js/background.js')), 6320);
  assert.equal(Buffer.byteLength(read('js/background.js')), 285103);
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(sha256(file), hash);
    assert.match(text, new RegExp(hash));
  }
  assert.match(text, /video-meta DOM rerun source files: 3/);
});

test('video meta source counts remain pinned across bridge fallback and background owners', () => {
  const text = doc();
  const bridge = read('js/content_bridge.js');
  const fallback = read('js/content/dom_fallback.js');
  const background = read('js/background.js');
  const slices = {
    persist: sliceBetween(bridge, 'function persistVideoMetaMapping(entries = []) {', '\n\nlet pendingVideoMetaDomRerunTimer'),
    schedule: sliceBetween(bridge, 'let pendingVideoMetaDomRerunTimer = 0;', '\n\nfunction touchDomForVideoMetaUpdate'),
    touch: sliceBetween(bridge, 'function touchDomForVideoMetaUpdate(videoId) {', '\n\nconst pendingWatchMetaFetches'),
    fetchQueue: sliceBetween(bridge, 'const pendingWatchMetaFetches = new Map();', '\n\nasync function fetchVideoMetaFromWatchUrl'),
    fetchWatch: sliceBetween(bridge, 'async function fetchVideoMetaFromWatchUrl(videoId) {', '\n\n// =========================================='),
    message: sliceBetween(bridge, "} else if (type === 'FilterTube_UpdateVideoMetaMap') {", "\n    } else if (type === 'FilterTube_UpdateCustomUrlMap')"),
    fallbackCategory: sliceBetween(fallback, 'let hideByCategory = false;', '\n            const alreadyProcessed'),
    backgroundEnqueue: sliceBetween(background, 'function enqueueVideoMetaMapUpdate(videoId, meta) {', '\n\n/**')
  };

  assert.equal(lineCount(slices.persist), 62);
  assert.equal(countLiteral(slices.persist, 'videoMetaMap'), 10);
  assert.equal(countLiteral(slices.persist, 'sendMessage'), 1);
  assert.equal(countLiteral(slices.persist, 'return []'), 2);
  assert.equal(countLiteral(slices.persist, 'return cleaned.map'), 1);
  assert.equal(lineCount(slices.schedule), 16);
  assert.equal(countLiteral(slices.schedule, 'setTimeout('), 1);
  assert.equal(countLiteral(slices.schedule, 'clearTimeout('), 1);
  assert.equal(lineCount(slices.touch), 57);
  assert.equal(countLiteral(slices.touch, 'removeAttribute('), 3);
  assert.equal(countLiteral(slices.touch, 'setAttribute('), 1);
  assert.equal(countLiteral(slices.touch, 'querySelectorAll'), 2);
  assert.equal(lineCount(slices.fetchQueue), 101);
  assert.equal(lineCount(slices.fetchWatch), 98);
  assert.equal(countLiteral(slices.fetchWatch, 'fetch('), 1);
  assert.equal(countLiteral(slices.fetchWatch, 'JSON.parse'), 1);
  assert.equal(lineCount(slices.message), 26);
  assert.equal(countLiteral(slices.message, 'touchDomForVideoMetaUpdate'), 2);
  assert.equal(countLiteral(slices.message, 'changedVideoIds'), 3);
  assert.equal(lineCount(slices.fallbackCategory), 39);
  assert.equal(countLiteral(slices.fallbackCategory, 'scheduleVideoMetaFetch'), 2);
  assert.equal(lineCount(slices.backgroundEnqueue), 41);
  assert.equal(countLiteral(bridge, 'touchDomForVideoMetaUpdate'), 4);
  assert.equal(countLiteral(bridge, 'scheduleVideoMetaDomRerun'), 3);
  assert.equal(countLiteral(bridge, 'persistVideoMetaMapping'), 3);
  assert.equal(countLiteral(bridge, 'FilterTube_UpdateVideoMetaMap'), 1);
  assert.equal(countLiteral(fallback, 'scheduleVideoMetaFetch'), 8);
  assert.equal(countLiteral(fallback, 'videoMetaMap'), 10);
  assert.equal(countLiteral(background, 'videoMetaMapFlushTimer'), 4);
  assert.equal(countLiteral(background, 'videoMetaMap'), 40);

  for (const expected of [
    'persistVideoMetaMapping block lines: 62',
    'video-meta DOM rerun debounce milliseconds: 550',
    'touchDomForVideoMetaUpdate block lines: 57',
    'watch meta fetch queue block lines: 101',
    'watch meta fetch concurrency limit: 3',
    'watch meta fetch cooldown milliseconds: 60000',
    'fetchVideoMetaFromWatchUrl block lines: 98',
    'FilterTube_UpdateVideoMetaMap message branch lines: 26',
    'DOM fallback category videoMetaMap block lines: 39',
    'background enqueueVideoMetaMapUpdate block lines: 41',
    'background videoMetaMap flush debounce milliseconds: 75'
  ]) {
    assert.match(text, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('persistVideoMetaMapping stores cleaned metadata and only forwards non-empty rows', () => {
  const runtime = loadVideoMetaRuntime();

  const changed = runtime.persistVideoMetaMapping([
    {
      videoId: ' VIDMETA0001 ',
      lengthSeconds: ' 42 ',
      publishDate: ' 2026-01-02 ',
      uploadDate: ' 2026-01-01 ',
      category: ' Education '
    },
    { videoId: 'EMPTYMETA01', lengthSeconds: '', publishDate: '', uploadDate: '', category: '' },
    { videoId: '', lengthSeconds: 99 }
  ]);
  assert.deepEqual(Array.from(changed), ['VIDMETA0001']);

  assert.deepEqual(JSON.parse(JSON.stringify(runtime.context.currentSettings.videoMetaMap.VIDMETA0001)), {
    lengthSeconds: '42',
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education'
  });
  assert.equal(runtime.context.currentSettings.videoMetaMap.EMPTYMETA01, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(runtime.messages)), [{
    action: 'updateVideoMetaMap',
    entries: [{
      videoId: 'VIDMETA0001',
      lengthSeconds: '42',
      publishDate: '2026-01-02',
      uploadDate: '2026-01-01',
      category: 'Education'
    }]
  }]);

  const duplicateChanged = runtime.persistVideoMetaMapping([{
    videoId: 'VIDMETA0001',
    lengthSeconds: 42,
    publishDate: '2026-01-02',
    uploadDate: '2026-01-01',
    category: 'Education'
  }]);

  assert.deepEqual(Array.from(duplicateChanged), []);
  assert.equal(runtime.messages.length, 1);
});

test('touchDomForVideoMetaUpdate clears processed duration and channel markers without broad stale cleanup', () => {
  const directCard = new FakeElement({
    'data-filtertube-video-id': 'VIDMETA0002',
    'data-filtertube-duration': '10:00',
    'data-filtertube-processed': 'true',
    'data-filtertube-last-processed-id': 'VIDMETA0002',
    'data-filtertube-channel-id': 'UCOLDOLDOLDOLDOLDOLDOL',
    'data-filtertube-channel-handle': '@old',
    'data-filtertube-channel-name': 'Old Channel',
    'data-filtertube-channel-custom': '/c/old',
    'data-filtertube-hidden': 'true',
    'data-filtertube-collaborators': '[]',
    'data-filtertube-blocked-state': 'blocked',
    'data-filtertube-whitelist-pending': 'true'
  });
  const anchorCard = new FakeElement({
    'data-filtertube-duration': '11:00',
    'data-filtertube-processed': 'true',
    'data-filtertube-last-processed-id': 'VIDMETA0002',
    'data-filtertube-channel-id': 'UCANCHORANCHORANCHORAN',
    'data-filtertube-hidden': 'true',
    'data-filtertube-blocked-state': 'blocked'
  });
  const runtime = loadVideoMetaRuntime({
    cards: [directCard],
    anchors: [new FakeAnchor('VIDMETA0002', anchorCard), new FakeAnchor('VIDMETA0002', directCard)]
  });

  const touched = runtime.touchDomForVideoMetaUpdate(' VIDMETA0002 ');

  assert.equal(touched, true);
  assert.equal(directCard.getAttribute('data-filtertube-duration'), null);
  assert.equal(directCard.getAttribute('data-filtertube-processed'), null);
  assert.equal(directCard.getAttribute('data-filtertube-last-processed-id'), null);
  assert.equal(directCard.getAttribute('data-filtertube-channel-id'), null);
  assert.equal(directCard.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(directCard.getAttribute('data-filtertube-collaborators'), '[]');
  assert.equal(directCard.getAttribute('data-filtertube-blocked-state'), 'blocked');
  assert.equal(directCard.getAttribute('data-filtertube-whitelist-pending'), 'true');
  assert.equal(anchorCard.getAttribute('data-filtertube-video-id'), 'VIDMETA0002');
  assert.equal(anchorCard.getAttribute('data-filtertube-duration'), null);
  assert.equal(anchorCard.getAttribute('data-filtertube-processed'), null);
  assert.equal(anchorCard.getAttribute('data-filtertube-channel-id'), null);
  assert.equal(anchorCard.getAttribute('data-filtertube-hidden'), 'true');
  assert.equal(anchorCard.getAttribute('data-filtertube-blocked-state'), 'blocked');
  assert.equal(runtime.touchDomForVideoMetaUpdate(''), false);
  assert.equal(runtime.touchDomForVideoMetaUpdate('MISSING00001'), false);
});

test('scheduleVideoMetaDomRerun replaces pending timer and runs applyDOMFallback once', () => {
  const runtime = loadVideoMetaRuntime();

  runtime.scheduleVideoMetaDomRerun();
  runtime.scheduleVideoMetaDomRerun();

  assert.deepEqual(runtime.timers.map((timer) => timer.delay), [550, 550]);
  assert.deepEqual(runtime.clearedTimers, [1]);
  assert.deepEqual(runtime.fallbackCalls, []);

  runtime.fireTimer(2);

  assert.deepEqual(runtime.fallbackCalls, [[null]]);
});

test('FilterTube_UpdateVideoMetaMap persists metadata and schedules rerun only after a DOM touch', () => {
  const card = new FakeElement({
    'data-filtertube-video-id': 'VIDMETA0003',
    'data-filtertube-duration': '12:00',
    'data-filtertube-processed': 'true',
    'data-filtertube-last-processed-id': 'VIDMETA0003'
  });
  const runtime = loadVideoMetaRuntime({ cards: [card] });

  runtime.dispatchMessage({
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: [{ videoId: ' VIDMETA0003 ', category: 'Music' }]
  });

  assert.equal(runtime.context.currentSettings.videoMetaMap.VIDMETA0003.category, 'Music');
  assert.equal(card.getAttribute('data-filtertube-processed'), null);
  assert.equal(runtime.timers.length, 1);
  assert.equal(runtime.timers[0].delay, 550);
  assert.equal(runtime.messages.length, 1);

  runtime.dispatchMessage({
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: [{ videoId: 'VIDMETA0003', category: 'Music' }]
  });
  assert.equal(runtime.messages.length, 1);
  assert.equal(runtime.timers.length, 1);

  runtime.dispatchMessage({
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: [{ videoId: 'NODOMMETA01', category: 'Sports' }]
  });
  assert.equal(runtime.messages.length, 2);
  assert.equal(runtime.timers.length, 1);

  runtime.dispatchMessage({
    type: 'FilterTube_UpdateVideoMetaMap',
    payload: []
  });
  runtime.dispatchMessage({
    type: 'FilterTube_UpdateVideoMetaMap',
    source: 'content_bridge',
    payload: [{ videoId: 'VIDMETA0003', category: 'Ignored' }]
  });
  assert.equal(runtime.messages.length, 2);
});

test('scheduleVideoMetaFetch skips satisfied metadata and queues missing requested fields once', () => {
  const runtime = loadVideoMetaRuntime({
    initialSettings: {
      videoMetaMap: {
        FETCHMETA01: {
          lengthSeconds: '60',
          publishDate: '2026-01-02',
          uploadDate: '',
          category: 'Education'
        }
      }
    }
  });

  runtime.scheduleVideoMetaFetch('FETCHMETA01', {
    needDuration: true,
    needDates: true,
    needCategory: true
  });
  assert.deepEqual(runtime.fetches, []);

  runtime.scheduleVideoMetaFetch('FETCHMETA02', {
    needDuration: false,
    needDates: false,
    needCategory: true
  });
  runtime.scheduleVideoMetaFetch('FETCHMETA02', {
    needDuration: false,
    needDates: false,
    needCategory: true
  });
  runtime.scheduleVideoMetaFetch('bad id', {
    needDuration: true
  });

  assert.deepEqual(runtime.fetches, ['FETCHMETA02']);
});

test('product runtime still lacks first-class video-meta DOM rerun authority symbols', () => {
  const source = productRuntimeSource();
  const missing = [
    'jsonFirstVideoMetaDomRerunContract',
    'jsonFirstVideoMetaDomTouchReport',
    'jsonFirstVideoMetaFetchBudget',
    'jsonFirstVideoMetaMessageEffectReport',
    'jsonFirstVideoMetaMapPersistencePolicy',
    'jsonFirstVideoMetaDomRerunTimerRegistry',
    'jsonFirstVideoMetaFixtureProvenance',
    'jsonFirstVideoMetaMetricArtifact',
    'jsonFirstVideoMetaCategoryFetchPolicy',
    'jsonFirstVideoMetaBackgroundFlushAuthority'
  ];

  for (const symbol of missing) {
    assert.equal(source.includes(symbol), false, `${symbol} should remain absent from product runtime source`);
    assert.match(doc(), new RegExp(symbol));
  }
});
