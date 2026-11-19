// Issue #82: outside a playlist or Mix, "Skip blocked autoplay videos" (on by default for new
// installs) lets autoplay and Next move past a blocked video to the first allowed Up next /
// related video, through the same decision model as playlists (queue_blocked_skip.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const dom = read('js/content/dom_fallback.js');
const skipModule = read('js/content/queue_blocked_skip.js');

function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `production source range: ${start}`);
  return source.slice(first, last);
}

const relatedSource = between(dom, 'function isBlockedAutoplaySkipAllowed(', 'function enforceCurrentWatchOwnerBlock(');

function card(f, videoId, { hidden = false, pending = false, href } = {}) {
  const link = { getAttribute: () => href || `/watch?v=${videoId}`, click() { f.navigations.push(videoId); } };
  return {
    closest: selector => (hidden && selector.includes('filtertube-hidden')) || (pending && selector.includes('whitelist-pending')) ? {} : null,
    querySelector: () => link
  };
}

function makeFixture({ settings = { enabled: true, skipBlockedAutoplay: true }, related = [] } = {}) {
  const f = { now: 1_000_000, timers: [], listeners: {}, navigations: [], toasts: [], settings };
  f.location = { videoId: 'FIRSTVID001' };
  f.admission = { videoId: '', decision: 'idle' };
  const context = vm.createContext({
    window: {},
    document: { querySelectorAll: () => f.cards },
    isFilterTubeFilteringEnabled: value => Boolean(value && typeof value === 'object' && value.enabled !== false)
  });
  vm.runInContext(`${relatedSource}\nthis.allowed = isBlockedAutoplaySkipAllowed;\nthis.related = getBlockedAutoplayRelatedCandidates;`, context);
  const api = (() => { const window = {}; vm.runInNewContext(skipModule, { window, globalThis: window, URLSearchParams }); return window.FilterTubeQueueBlockedSkip; })();
  f.cards = related.map(entry => card(f, entry.id, entry));
  const toastNode = { style: {}, setAttribute() {}, remove() {}, set textContent(value) { f.toasts.push(value); } };
  const doc = {
    addEventListener(type, handler) { (f.listeners[type] ||= []).push(handler); },
    getElementById: () => null, createElement: () => toastNode, body: { appendChild() {} }
  };
  f.controller = api.createController({
    document: doc,
    window: { addEventListener(type, handler) { (f.listeners[type] ||= []).push(handler); } },
    now: () => f.now,
    setTimeout(callback) { f.timers.push({ callback, active: true }); return f.timers.length; },
    clearTimeout(id) { if (f.timers[id - 1]) f.timers[id - 1].active = false; },
    currentVideoId: () => f.location.videoId,
    currentList: () => '',
    currentIndex: () => 0,
    isEnabled: value => value?.enabled !== false,
    latestSettings: () => f.settings,
    signature: () => 'rules-v1',
    rows: () => [],
    rowVideoId: () => '', rowLink: () => null, rowIsSelected: () => false, rowBlockedByPage: () => false,
    hideRow() {}, restoreRow() {},
    skipOutsideLists: value => context.allowed(value),
    relatedCandidates: videoId => context.related(videoId),
    autoplayOn: () => f.autoplaySwitch !== false,
    isEnded: () => f.media.ended === true,
    isStillBlocked: videoId => f.admission.decision === 'blocked' && f.admission.videoId === videoId,
    media: () => f.media,
    isQuiet: () => false,
    text: (key, fallback) => fallback,
    loadLocale: () => null
  });
  f.controller.install();
  f.media = { ended: false, duration: 100, currentTime: 10 };
  f.emit = (type, event = {}) => (f.listeners[type] || []).forEach(handler => handler({ type, isTrusted: true, ...event }));
  f.go = videoId => { f.now += 100; f.emit('yt-navigate-start'); f.location.videoId = videoId; f.now += 400; };
  f.autoplayTo = videoId => { f.media = { ended: true, duration: 100, currentTime: 100 }; f.go(videoId); f.media = { ended: false, duration: 100, currentTime: 0 }; };
  f.nextTo = videoId => { f.emit('pointerdown', { target: { closest: s => (s === '.ytp-next-button' ? {} : null) } }); f.go(videoId); };
  f.block = videoId => {
    f.admission = { videoId, decision: 'blocked' };
    return f.controller.onBlocked(videoId, f.settings, 'Not in Allow only selected');
  };
  f.flush = () => {
    const due = f.timers.filter(timer => timer.active);
    due.forEach(timer => { timer.active = false; });
    f.now += 300;
    due.forEach(timer => timer.callback());
  };
  return f;
}

const related = () => [
  { id: 'HIDDENVID01', hidden: true },
  { id: 'PENDINGVID1', pending: true },
  { id: 'PLAYLISTV01', href: '/watch?v=PLAYLISTV01&list=PLx' },
  { id: 'SHORTVIDEO1', href: '/shorts/SHORTVIDEO1' },
  { id: 'NEXTVIDEO01', href: '/watch?v=NEXTVIDEO01&list=RDNEXTVIDEO01&start_radio=1&pp=oAcB' },
  { id: 'NEXTVIDEO02' }
];

// Related cards link as the video's own radio (list=RD<id>&start_radio=1): that is still the video.
test('autoplay onto a blocked video skips to the first allowed related video, with a toast', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), true);
  assert.deepEqual(f.navigations, []);
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
  assert.deepEqual(f.toasts, ['Skipped a video your filters hide']);
});

test('Allow only selected (#82): cards still being checked or hidden are passed over', () => {
  const f = makeFixture({ settings: { enabled: true, listMode: 'whitelist', skipBlockedAutoplay: true }, related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
});

test('autoplay never goes back to a video this tab just played', () => {
  const f = makeFixture({ related: [{ id: 'FIRSTVID001' }, { id: 'NEXTVIDEO02' }] });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO02']);
});

test('the player Next button onto a blocked video skips too', () => {
  const f = makeFixture({ related: related() });
  f.nextTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
});

test('setting off, or Disable autoplay, never schedules a skip outside lists', () => {
  for (const settings of [{ enabled: true }, { enabled: true, skipBlockedAutoplay: true, disableAutoplay: true }]) {
    const f = makeFixture({ settings, related: related() });
    f.autoplayTo('BLOCKEDV001');
    assert.equal(f.block('BLOCKEDV001'), false);
    f.flush();
    assert.deepEqual(f.navigations, []);
    assert.equal(f.timers.length, 0);
  }
});

test('a direct load or a click keeps the blocked card', () => {
  const f = makeFixture({ related: related() });
  f.location.videoId = 'BLOCKEDV001';
  f.block('BLOCKEDV001');
  f.flush();
  f.emit('pointerdown', { target: { closest: () => null } });
  f.go('BLOCKEDV002');
  f.block('BLOCKEDV002');
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('user input before the skip fires cancels it, and so does a settings delivery that turns it off', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.emit('keydown', { key: ' ' });
  f.flush();
  const g = makeFixture({ related: related() });
  g.autoplayTo('BLOCKEDV001');
  g.block('BLOCKEDV001');
  g.settings = { enabled: true, skipBlockedAutoplay: false };
  g.controller.cancel();
  g.settings = { enabled: true, skipBlockedAutoplay: true };
  g.flush();
  assert.deepEqual([...f.navigations, ...g.navigations], []);
});

test('an ordinary settings delivery (metadata learned) keeps the pending skip', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.settings = { ...f.settings };
  f.controller.cancel();
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
});

test('Disable arriving during the delay revokes the skip', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.settings = { enabled: false, skipBlockedAutoplay: true };
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('Previous outside a list keeps the card (the way back is the browser history)', () => {
  const f = makeFixture({ related: related() });
  f.emit('pointerdown', { target: { closest: s => (s === '.ytp-prev-button' ? {} : null) } });
  f.go('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('a skip chain through blocked related videos stops at 25', () => {
  const ids = Array.from({ length: 40 }, (_, i) => `RELATED${String(i).padStart(4, '0')}`);
  const f = makeFixture({ related: ids.map(id => ({ id })) });
  f.autoplayTo(ids[0]);
  let current = ids[0];
  for (;;) {
    f.block(current);
    const before = f.navigations.length;
    f.flush();
    if (f.navigations.length === before) break;
    current = f.navigations.at(-1);
    f.go(current);
  }
  assert.equal(f.navigations.length, 25);
});

test('wiring: settings delivery and Disable cancel through the controller; the toggle defaults on for new installs', () => {
  assert.match(read('js/content/bridge_settings.js'), /cancelBlockedAutoplaySkip\(\)/);
  assert.match(dom, /function cancelBlockedAutoplaySkip\(\) \{\s*try \{\s*filterTubeQueueBlockedSkipController\?\.cancel\(\);/);
  assert.match(read('js/profile_preference_defaults.js'), /\['skipBlockedAutoplay', true, /);
  assert.match(read('js/background.js'), /reason === 'install'[\s\S]{0,900}skipBlockedAutoplay: true/);
  assert.doesNotMatch(read('js/content_controls_catalog.js'), /up to 3 tries/);
});

// #82 in Allow only selected: the site ends the video on its "Up next" card and never moves.
function endAndStall(f) {
  f.media = { ended: true, duration: 100, currentTime: 100 };
  f.emit('ended', { target: { tagName: 'VIDEO' } });
  f.now += 9500;
}

test('a stalled autoplay at the end of a video goes on to the first allowed related video', () => {
  const f = makeFixture({ related: related() });
  endAndStall(f);
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
  // That arrival counts as autoplay: a late block there keeps moving.
  f.go('NEXTVIDEO01');
  assert.equal(f.controller.selection.entry, 'autoplay');
});

test('no stall action when the site moved on, the user acted, autoplay is off, or the setting is off', () => {
  const moved = makeFixture({ related: related() });
  endAndStall(moved);
  moved.go('SITEPICK001');
  moved.flush();
  const acted = makeFixture({ related: related() });
  endAndStall(acted);
  acted.emit('pointerdown', { target: { closest: () => null } });
  acted.flush();
  const off = makeFixture({ related: related() });
  off.autoplaySwitch = false;
  endAndStall(off);
  off.flush();
  const settingOff = makeFixture({ settings: { enabled: true }, related: related() });
  endAndStall(settingOff);
  settingOff.flush();
  const disabled = makeFixture({ settings: { enabled: true, skipBlockedAutoplay: true, disableAutoplay: true }, related: related() });
  endAndStall(disabled);
  disabled.flush();
  assert.deepEqual([moved, acted, off, settingOff, disabled].flatMap(f => f.navigations), []);
});
