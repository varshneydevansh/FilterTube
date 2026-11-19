// A playlist or Mix video blocked only once its Watch page loads: queue-driven arrivals move on,
// direct ones keep the card. Port of Android NativeMainQueueBlockedSkip (fde90885d).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../js/content/queue_blocked_skip.js', import.meta.url), 'utf8');
const dom = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
const overlay = fs.readFileSync(new URL('../../js/content/admission_overlay.js', import.meta.url), 'utf8');

function load(extra = {}) {
  const window = { ...extra };
  vm.runInNewContext(source, { window, globalThis: window, URLSearchParams });
  return window.FilterTubeQueueBlockedSkip;
}

const Q = load();
const { Entry } = Q;
const ids = n => Array.from({ length: n }, (_, i) => `VIDEO${String(i).padStart(6, '0')}`);
const cands = (list, blocked = []) => list.map(videoId => ({ key: videoId, videoId, precheckBlocked: blocked.includes(videoId) }));

// --- Pure model -------------------------------------------------------------------------------

test('Next skips forward to the first allowed row; Previous goes back, nearest first', () => {
  const rows = ids(6);
  const forward = Q.candidatesInDirection(rows, 2, false);
  assert.deepEqual(forward, rows.slice(3));
  const backward = Q.candidatesInDirection(rows, 2, true);
  assert.deepEqual(backward, [rows[1], rows[0]]);

  const next = Q.decide({
    selection: Q.selection(Entry.NEXT, rows[1]), selectedVideoId: rows[2], blocked: true,
    candidates: cands(forward, [rows[3]])
  });
  assert.equal(next.step.kind, 'skip');
  assert.equal(next.step.target.videoId, rows[4]);
  assert.equal(next.step.next.entry, Entry.NEXT);
  assert.equal(next.step.next.chain, 1);

  const previous = Q.decide({
    selection: Q.selection(Entry.PREVIOUS, rows[3]), selectedVideoId: rows[2], blocked: true,
    candidates: cands(backward)
  });
  assert.equal(previous.step.kind, 'skip');
  assert.equal(previous.step.target.videoId, rows[1]);
  assert.equal(previous.step.next.entry, Entry.PREVIOUS);
});

test('never wraps: Next on the last row and Previous on the first end the queue', () => {
  const rows = ids(4);
  assert.deepEqual(Q.candidatesInDirection(rows, 3, false), []);
  assert.deepEqual(Q.candidatesInDirection(rows, 0, true), []);
  for (const [entry, at] of [[Entry.NEXT, 3], [Entry.AUTOPLAY, 3], [Entry.PREVIOUS, 0]]) {
    const result = Q.decide({
      selection: Q.selection(entry, 'SOMEOTHERID'), selectedVideoId: rows[at], blocked: true,
      candidates: cands(Q.candidatesInDirection(rows, at, Q.isBackward(entry)))
    });
    assert.equal(result.step.kind, 'endOfQueue', entry);
  }
});

test('every remaining row blocked: the blocked card with the end-of-queue line', () => {
  const rows = ids(5);
  const result = Q.decide({
    selection: Q.selection(Entry.AUTOPLAY, rows[0]), selectedVideoId: rows[1], blocked: true,
    candidates: cands(rows.slice(2), rows.slice(2))
  });
  assert.equal(result.step.kind, 'endOfQueue');
  assert.equal(Q.END_LINE, 'Nothing left in this queue that your filters allow');
});

test('a skip chain stops at 25', () => {
  const allowed = cands(['ALLOWEDVID1']);
  const at24 = Q.decide({ selection: Q.selection(Entry.NEXT, 'X', 'BLOCKEDVID1', 24), selectedVideoId: 'BLOCKEDVID1', blocked: true, candidates: allowed });
  assert.equal(at24.step.kind, 'skip');
  assert.equal(at24.step.next.chain, 25);
  const at25 = Q.decide({ selection: at24.step.next, selectedVideoId: 'BLOCKEDVID2', blocked: true, candidates: allowed });
  assert.equal(Q.MAX_CHAIN, 25);
  assert.equal(at25.step.kind, 'endOfQueue');
});

test('a direct selection, or none at all (reload, typed URL), keeps the blocked card', () => {
  const direct = Q.decide({ selection: Q.selection(Entry.DIRECT, 'A', 'BLOCKEDVID1'), selectedVideoId: 'BLOCKEDVID1', blocked: true, candidates: cands(['ALLOWEDVID1']) });
  assert.equal(direct.step.kind, 'keepCard');
  const none = Q.decide({ selection: null, selectedVideoId: 'BLOCKEDVID1', blocked: true, candidates: cands(['ALLOWEDVID1']) });
  assert.equal(none.step.kind, 'keepCard');
  // Decided once per arrival; re-passes do nothing.
  const again = Q.decide({ selection: Q.selection(Entry.NEXT, 'A'), selectedVideoId: 'BLOCKEDVID1', blocked: true, candidates: cands(['ALLOWEDVID1']), handledVideoId: 'BLOCKEDVID1' });
  assert.equal(again.step.kind, 'none');
});

test('navigation entry: player buttons and keys are queue-driven, clicks and history are direct', () => {
  const at = 10_000;
  const base = { at, fromVideoId: 'FROMVIDEO01', fromList: 'RDxyz', fromIndex: 4 };
  assert.equal(Q.classifyNavigation({ ...base, input: { kind: 'next', at: at - 200 } }).entry, Entry.NEXT);
  assert.equal(Q.classifyNavigation({ ...base, input: { kind: 'previous', at: at - 200 } }).entry, Entry.PREVIOUS);
  // A click on a playlist row (or anything else) is direct.
  assert.equal(Q.classifyNavigation({ ...base, input: { kind: 'other', at: at - 200 } }).entry, Entry.DIRECT);
  // The video ended (the playlist's own advance), then no input.
  assert.equal(Q.classifyNavigation({ ...base, ended: { videoId: 'FROMVIDEO01', at: at - 300 } }).entry, Entry.AUTOPLAY);
  // A row click after the video ended is still the user's choice.
  assert.equal(Q.classifyNavigation({ ...base, ended: { videoId: 'FROMVIDEO01', at: at - 900 }, input: { kind: 'other', at: at - 100 } }).entry, Entry.DIRECT);
  // Browser Back / Forward.
  assert.equal(Q.classifyNavigation({ ...base, ended: { videoId: 'FROMVIDEO01', at: at - 900 }, popstateAt: at - 50 }).entry, Entry.DIRECT);
  // Stale input does not count.
  assert.equal(Q.classifyNavigation({ ...base, fromList: '', input: { kind: 'next', at: at - 5000 } }).entry, Entry.DIRECT);
  // No input (media keys): resolved from the playlist index once the video lands.
  const adjacent = Q.classifyNavigation(base);
  assert.equal(adjacent.entry, Entry.ADJACENT);
  assert.equal(Q.boundTo(adjacent, 'TOVIDEO0001', { list: 'RDxyz', index: 5 }).entry, Entry.NEXT);
  assert.equal(Q.boundTo(adjacent, 'TOVIDEO0001', { list: 'RDxyz', index: 3 }).entry, Entry.PREVIOUS);
  assert.equal(Q.boundTo(adjacent, 'TOVIDEO0001', { list: 'RDxyz', index: 9 }).entry, Entry.DIRECT);
  assert.equal(Q.boundTo(adjacent, 'TOVIDEO0001', { list: 'PLother', index: 5 }).entry, Entry.DIRECT);
  assert.equal(Q.classifyInput({ type: 'pointerdown', isTrusted: true, target: { closest: s => (s === '.ytp-next-button' ? {} : null) } }), 'next');
  assert.equal(Q.classifyInput({ type: 'pointerdown', isTrusted: true, target: { closest: s => (s === '.ytp-prev-button' ? {} : null) } }), 'previous');
  assert.equal(Q.classifyInput({ type: 'pointerdown', isTrusted: false, target: { closest: () => ({}) } }), null);
  assert.equal(Q.classifyInput({ type: 'keydown', isTrusted: true, key: 'N', shiftKey: true }), 'next');
  assert.equal(Q.classifyInput({ type: 'keydown', isTrusted: true, key: 'MediaTrackPrevious' }), 'previous');
});

test('the verdict cache goes stale when the rules change', () => {
  const cache = Q.createVerdictCache();
  cache.remember('BLOCKEDVID1', 'rules-v1', 'Blocked keyword');
  assert.deepEqual({ ...cache.lookup('BLOCKEDVID1', 'rules-v1') }, { reason: 'Blocked keyword' });
  assert.equal(cache.lookup('BLOCKEDVID1', 'rules-v2'), null);
  // Stale entries are dropped, not revived by going back to the old rules.
  assert.equal(cache.lookup('BLOCKEDVID1', 'rules-v1'), null);
  assert.equal(cache.size, 0);
  // Filtering off (no signature) never reads a verdict.
  cache.remember('BLOCKEDVID2', 'rules-v1', 'x');
  assert.equal(cache.lookup('BLOCKEDVID2', ''), null);
  // Bounded.
  const small = Q.createVerdictCache(3);
  ids(5).forEach(id => small.remember(id, 's', 'r'));
  assert.equal(small.size, 3);
});

test('verdicts are never persisted: no storage, sync or backup path, nothing serializable', () => {
  const calls = [];
  const spy = new Proxy({}, { get: (_, key) => (...args) => { calls.push(key); return undefined; } });
  const api = load({ chrome: { storage: { local: spy, sync: spy, session: spy } }, localStorage: spy, sessionStorage: spy });
  const cache = api.createVerdictCache();
  cache.remember('BLOCKEDVID1', 'rules-v1', 'Blocked keyword');
  assert.equal(JSON.stringify({ cache }), '{}');
  const harness = makeController({ api });
  harness.press('next');
  harness.navigate(2);
  harness.block();
  harness.flush();
  assert.deepEqual(calls, []);
  assert.doesNotMatch(source, /\.storage\b|\bstorage\.(?:local|sync|session)|localStorage|sessionStorage|indexedDB|runtime\.sendMessage|postMessage/);
});

// --- Controller with a fake page --------------------------------------------------------------

function makeController({ api = Q, playlist = ids(8), blocked = [], list = 'RDmix', signature = 'rules-v1', quiet = false } = {}) {
  const h = {
    now: 1_000_000, timers: [], listeners: {}, clicks: [], toasts: [], hidden: new Set(), cards: 0,
    signature, admission: { videoId: '', decision: 'idle' }, location: { videoId: playlist[0], index: 1, list }
  };
  const rows = playlist.map((videoId, i) => {
    const attrs = new Map();
    const href = `/watch?v=${videoId}&list=${list}&index=${i + 1}`;
    return {
      videoId, attrs,
      link: { getAttribute: () => href, click() { h.clicks.push(videoId); } },
      hasAttribute: key => attrs.has(key), setAttribute: (key, value) => attrs.set(key, value), removeAttribute: key => attrs.delete(key)
    };
  });
  h.rows = rows;
  const toastNode = { style: {}, setAttribute() {}, remove() {}, set textContent(value) { h.toasts.push(value); } };
  const document = {
    addEventListener(type, handler) { (h.listeners[type] ||= []).push(handler); },
    getElementById: () => null,
    createElement: () => toastNode,
    body: { appendChild() {} }
  };
  const controller = api.createController({
    document,
    window: { addEventListener(type, handler) { (h.listeners[type] ||= []).push(handler); } },
    now: () => h.now,
    setTimeout(callback, delay) { h.timers.push({ callback, delay, active: true }); return h.timers.length; },
    clearTimeout(id) { if (h.timers[id - 1]) h.timers[id - 1].active = false; },
    currentVideoId: () => h.location.videoId,
    currentList: () => h.location.list,
    currentIndex: () => h.location.index,
    isEnabled: settings => settings?.enabled !== false,
    latestSettings: () => h.settings,
    signature: () => h.signature,
    rows: () => rows,
    rowVideoId: row => row.videoId,
    rowLink: row => row.link,
    rowIsSelected: row => row.videoId === h.location.videoId,
    rowBlockedByPage: row => blocked.includes(row.videoId),
    hideRow: row => h.hidden.add(row.videoId),
    restoreRow: row => h.hidden.delete(row.videoId),
    isStillBlocked: videoId => h.admission.decision === 'blocked' && h.admission.videoId === videoId,
    media: () => h.media,
    isQuiet: () => quiet,
    text: (key, fallback) => fallback,
    loadLocale: () => null,
    refreshBlockedCard: () => { h.cards++; }
  });
  controller.install();
  h.settings = { enabled: true };
  h.controller = controller;
  h.emit = (type, event = {}) => (h.listeners[type] || []).forEach(handler => handler({ type, isTrusted: true, ...event }));
  h.press = kind => h.emit('pointerdown', { target: { closest: s => ((kind === 'next' && s === '.ytp-next-button') || (kind === 'previous' && s === '.ytp-prev-button') ? {} : null) } });
  h.clickRow = () => h.emit('pointerdown', { target: { closest: () => null } });
  // The site's SPA navigation to the row at this 1-based index.
  h.navigate = index => {
    h.now += 100;
    h.emit('yt-navigate-start');
    h.location.videoId = playlist[index - 1];
    h.location.index = index;
    h.now += 400;
  };
  h.block = (message = 'Blocked keyword') => {
    h.admission = { videoId: h.location.videoId, decision: 'blocked' };
    return controller.onBlocked(h.location.videoId, h.settings, message);
  };
  h.allow = () => {
    h.admission = { videoId: h.location.videoId, decision: 'allowed' };
    controller.onAllowed(h.location.videoId);
  };
  h.flush = () => {
    const due = h.timers.filter(timer => timer.active);
    due.forEach(timer => { timer.active = false; });
    h.now += 300;
    due.forEach(timer => timer.callback());
  };
  return h;
}

test('Next onto a late-blocked video skips forward once, through the row link, with a toast', () => {
  const h = makeController();
  h.press('next');
  h.navigate(2);
  assert.equal(h.block(), true);
  assert.deepEqual(h.clicks, []);
  h.flush();
  assert.deepEqual(h.clicks, [h.rows[2].videoId]);
  assert.deepEqual(h.toasts, ['Skipped a video your filters hide']);
  // Re-passes for the same arrival never skip twice.
  h.block();
  h.flush();
  assert.equal(h.clicks.length, 1);
});

test('Previous onto a late-blocked video goes back', () => {
  const h = makeController();
  h.navigate(5);
  h.allow();
  h.press('previous');
  h.navigate(4);
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, [h.rows[2].videoId]);
});

test('the playlist advance at the end of a video skips forward; known-blocked rows are passed over', () => {
  const playlist = ids(6);
  const h = makeController({ playlist, blocked: [playlist[2]] });
  h.media = { ended: true, duration: 100, currentTime: 100 };
  h.navigate(2);
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, [playlist[3]]);
});

test('a direct click on a playlist row keeps the card', () => {
  const h = makeController();
  h.clickRow();
  h.navigate(3);
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, []);
  assert.deepEqual(h.toasts, []);
  assert.equal(h.controller.endLineFor(h.location.videoId), '');
});

test('a reload or pasted URL (no site navigation) keeps the card', () => {
  const h = makeController();
  h.location.videoId = h.rows[3].videoId;
  h.location.index = 4;
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, []);
});

test('our own skip continues the chain; a blocked tail ends with the end-of-queue line', () => {
  const playlist = ids(4);
  const h = makeController({ playlist });
  h.press('next');
  h.navigate(2);
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, [playlist[2]]);
  h.navigate(3); // the skip's navigation, no user input
  assert.equal(h.controller.selection.entry, Q.Entry.NEXT);
  assert.equal(h.controller.selection.chain, 1);
  h.block();
  h.flush();
  assert.deepEqual(h.clicks, [playlist[2], playlist[3]]);
  h.navigate(4);
  h.block();
  h.flush();
  assert.equal(h.clicks.length, 2, 'no wrap to the first row');
  assert.equal(h.controller.endLineFor(playlist[3]), Q.END_LINE);
  assert.equal(h.cards, 1);
});

test('a long all-blocked run stops after 25 skips', () => {
  const playlist = ids(40);
  const h = makeController({ playlist });
  h.press('next');
  h.navigate(2);
  let index = 2;
  for (;;) {
    h.block();
    const before = h.clicks.length;
    h.flush();
    if (h.clicks.length === before) break;
    index += 1;
    h.navigate(index);
  }
  assert.equal(h.clicks.length, 25);
  assert.equal(h.controller.endLineFor(playlist[index - 1]), Q.END_LINE);
});

test('user input before the skip fires cancels it', () => {
  const h = makeController();
  h.press('next');
  h.navigate(2);
  h.block();
  h.clickRow();
  h.flush();
  assert.deepEqual(h.clicks, []);
});

test('outside a playlist the module steps aside; quiet blocking shows no toast', () => {
  const h = makeController({ list: '' });
  h.location.list = '';
  h.press('next');
  h.navigate(2);
  assert.equal(h.block(), false);
  const quiet = makeController({ quiet: true });
  quiet.press('next');
  quiet.navigate(2);
  quiet.block();
  quiet.flush();
  assert.equal(quiet.clicks.length, 1);
  assert.deepEqual(quiet.toasts, []);
});

test('known-blocked rows hide in place and come back when the rules change', () => {
  const h = makeController();
  h.clickRow();
  h.navigate(3);
  h.block();
  // Still selected: never hidden.
  h.controller.applyPanelVerdicts(h.settings);
  assert.equal(h.hidden.size, 0);
  h.clickRow();
  h.navigate(5);
  h.allow();
  h.controller.applyPanelVerdicts(h.settings);
  assert.deepEqual([...h.hidden], [h.rows[2].videoId]);
  assert.equal(h.rows[2].hasAttribute(Q.VERDICT_MARKER), true);
  // Next / Previous pass over it before it starts.
  assert.deepEqual({ ...h.controller.cachedVerdict(h.rows[2].videoId, h.settings) }, { reason: 'Blocked keyword' });
  h.signature = 'rules-v2';
  assert.equal(h.controller.cachedVerdict(h.rows[2].videoId, h.settings), null);
  h.controller.applyPanelVerdicts(h.settings);
  assert.equal(h.hidden.size, 0);
  assert.equal(h.rows[2].hasAttribute(Q.VERDICT_MARKER), false);
});

// --- Wiring -----------------------------------------------------------------------------------

test('dom_fallback routes every blocked Watch through the queue model before the #82 autoplay skip', () => {
  const glue = dom.slice(dom.indexOf('function handleCurrentWatchBlocked('), dom.indexOf('function enforceCurrentWatchOwnerBlock('));
  assert.match(glue, /onBlocked\(videoId, settings, message\)\) return;[\s\S]*scheduleBlockedAutoplaySkip\(videoId, settings\)/);
  const admission = dom.slice(dom.indexOf('function enforceCurrentWatchOwnerBlock('), dom.indexOf('const FILTERTUBE_CATEGORY_PENDING_TTL_MS'));
  assert.equal((admission.match(/handleCurrentWatchBlocked\(/g) || []).length, 4);
  assert.doesNotMatch(admission, /scheduleBlockedAutoplaySkip\(/);
  assert.doesNotMatch(admission, /\.click\(/);
  // #82 still ignores playlists by itself.
  assert.match(dom, /params\.has\('list'\)\) return false;/);
  assert.match(overlay, /'Nothing left in this queue that your filters allow': 'admission\.queueEndAllBlocked'/);
  for (const file of ['manifest.json', 'manifest.chrome.json', 'manifest.firefox.json', 'manifest.opera.json']) {
    const text = fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
    assert.ok(text.indexOf('js/content/queue_blocked_skip.js') > 0 && text.indexOf('js/content/queue_blocked_skip.js') < text.indexOf('js/content/dom_fallback.js'), file);
  }
});

test('the toast and end-of-queue line are translated in every ui_locale', () => {
  const dir = new URL('../../data/ui_locales/', import.meta.url);
  const targets = JSON.parse(fs.readFileSync(new URL('targets.json', dir), 'utf8')).locales.map(locale => locale.code);
  assert.equal(targets.length, 38);
  for (const code of targets) {
    const catalog = JSON.parse(fs.readFileSync(new URL(`${code}.json`, dir), 'utf8'));
    for (const key of ['admission.queueSkipped', 'admission.queueEndAllBlocked']) {
      assert.equal(typeof catalog[key], 'string', `${code} ${key}`);
      assert.ok(catalog[key].trim(), `${code} ${key}`);
    }
  }
  const en = JSON.parse(fs.readFileSync(new URL('en.json', dir), 'utf8'));
  assert.equal(en['admission.queueSkipped'], Q.SKIPPED_TEXT);
  assert.equal(en['admission.queueEndAllBlocked'], Q.END_LINE);
});
