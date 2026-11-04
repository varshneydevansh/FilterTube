// Issue #82: opt-in skip when autoplay lands on a blocked regular watch video.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dom = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
const bridgeSettings = fs.readFileSync(new URL('../../js/content/bridge_settings.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `production source range: ${start}`);
  return source.slice(first, last);
}

const skipSource = between(dom, '// Issue #82: opt-in "Skip blocked autoplay videos"', 'function getCurrentWatchCategoryOverlayHost() {');

function card(videoId, { hidden = false, pending = false, href } = {}) {
  const clicks = [];
  const link = { getAttribute: () => href || `/watch?v=${videoId}`, click() { clicks.push(videoId); fixture.navigations.push(videoId); } };
  const fixture = card.fixture;
  return {
    clicks,
    closest: selector => (hidden && selector.includes('filtertube-hidden')) || (pending && selector.includes('whitelist-pending')) ? {} : null,
    getClientRects: () => [{}],
    querySelector: () => link
  };
}

function makeFixture({ settings = { enabled: true, skipBlockedAutoplay: true }, related = [] } = {}) {
  const fixture = { now: 1_000_000, timers: [], listeners: {}, navigations: [], cards: [] };
  card.fixture = fixture;
  fixture.location = { pathname: '/watch', search: '?v=FIRSTVID001', hostname: 'www.youtube.com' };
  fixture.admission = { videoId: '', decision: 'idle' };
  const FakeDate = class extends Date {
    static now() { return fixture.now; }
  };
  const context = vm.createContext({
    window: {},
    Date: FakeDate,
    URLSearchParams,
    currentSettings: settings,
    document: {
      location: fixture.location,
      addEventListener(type, handler) { (fixture.listeners[type] ||= []).push(handler); },
      querySelector: selector => selector.includes('video') ? fixture.media : null,
      querySelectorAll: () => fixture.cards
    },
    setTimeout(callback, delay) { fixture.timers.push({ callback, delay, active: true }); return fixture.timers.length; },
    clearTimeout(id) { if (fixture.timers[id - 1]) fixture.timers[id - 1].active = false; },
    getCurrentWatchVideoId: () => new URLSearchParams(fixture.location.search).get('v') || '',
    getDirectAccessState: () => fixture.admission,
    isFilterTubeFilteringEnabled: value => Boolean(value && typeof value === 'object' && value.enabled !== false)
  });
  vm.runInContext(skipSource, context);
  fixture.context = context;
  fixture.cards = related.map(entry => card(entry.id, entry));
  fixture.media = { tagName: 'VIDEO', ended: false, duration: 100, currentTime: 10 };
  fixture.emit = (type, event = {}) => (fixture.listeners[type] || []).forEach(handler => handler({ isTrusted: true, target: fixture.media, ...event }));
  fixture.go = videoId => { fixture.location.search = `?v=${videoId}`; };
  // The real admission path pauses, shows the overlay and then calls this.
  fixture.block = videoId => {
    fixture.admission.videoId = videoId;
    fixture.admission.decision = 'blocked';
    return context.scheduleBlockedAutoplaySkip(videoId, context.currentSettings);
  };
  fixture.flush = () => {
    const due = fixture.timers.filter(timer => timer.active);
    fixture.timers.forEach(timer => { timer.active = false; });
    fixture.now += 1500;
    due.forEach(timer => timer.callback());
  };
  fixture.autoplayTo = videoId => {
    context.installBlockedAutoplaySkipSignals();
    fixture.emit('ended');
    fixture.now += 3000;
    fixture.go(videoId);
  };
  return fixture;
}

const related = () => [
  { id: 'HIDDENVID01', hidden: true },
  { id: 'PENDINGVID1', pending: true },
  { id: 'PLAYLISTV01', href: '/watch?v=PLAYLISTV01&list=PLx' },
  { id: 'NEXTVIDEO01' },
  { id: 'NEXTVIDEO02' },
  { id: 'NEXTVIDEO03' },
  { id: 'NEXTVIDEO04' }
];

test('an opted-in autoplay arrival on a blocked video skips to the next visible allowed card', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), true);
  assert.equal(f.timers.filter(timer => timer.active).length, 1);
  assert.deepEqual(f.navigations, []);
  f.flush();
  assert.deepEqual(f.navigations, ['NEXTVIDEO01']);
});

test('default-off settings never schedule a skip', () => {
  const f = makeFixture({ settings: { enabled: true }, related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), false);
  f.flush();
  assert.deepEqual(f.navigations, []);
  assert.equal(f.timers.length, 0);
});

test('Disable Autoplay suppresses the skip', () => {
  const f = makeFixture({ settings: { enabled: true, skipBlockedAutoplay: true, disableAutoplay: true }, related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), false);
  assert.equal(f.timers.length, 0);
});

test('a direct URL load is not treated as autoplay', () => {
  const f = makeFixture({ related: related() });
  f.context.installBlockedAutoplaySkipSignals();
  f.go('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), false);
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('a user click or key press after the previous video ended is not autoplay', () => {
  const f = makeFixture({ related: related() });
  f.context.installBlockedAutoplaySkipSignals();
  f.emit('ended');
  f.now += 1000;
  f.emit('pointerdown');
  f.go('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), false);
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('an ended signal older than the arrival window does not count', () => {
  const f = makeFixture({ related: related() });
  f.context.installBlockedAutoplaySkipSignals();
  f.emit('ended');
  f.now += 60_000;
  f.go('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), false);
});

test('Disable while a skip is pending leaves the user on the blocked video', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), true);
  f.context.currentSettings = { enabled: false, skipBlockedAutoplay: true };
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('a settings change cancels a pending skip even if it is re-enabled before the timer', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  assert.equal(f.block('BLOCKEDV001'), true);
  f.context.cancelBlockedAutoplaySkip();
  f.context.currentSettings = { enabled: true, skipBlockedAutoplay: true };
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('the pending skip re-checks video identity and admission when it fires', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.block('BLOCKEDV001');
  f.go('SOMEOTHER01');
  f.flush();
  assert.deepEqual(f.navigations, []);

  const g = makeFixture({ related: related() });
  g.autoplayTo('BLOCKEDV001');
  g.block('BLOCKEDV001');
  g.admission.decision = 'allowed';
  g.flush();
  assert.deepEqual(g.navigations, []);
});

test('consecutive blocked arrivals skip at most three times and never revisit a tried video', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  for (let i = 0; i < 5; i++) {
    f.block(f.context.getCurrentWatchVideoId());
    f.flush();
    const target = f.navigations.at(-1);
    if (target && f.context.getCurrentWatchVideoId() !== target) f.go(target);
  }
  assert.deepEqual(f.navigations, ['NEXTVIDEO01', 'NEXTVIDEO02', 'NEXTVIDEO03']);
  assert.equal(f.context.getCurrentWatchVideoId(), 'NEXTVIDEO03');
});

test('playlist watch pages keep the existing stay-on-overlay behavior', () => {
  const f = makeFixture({ related: related() });
  f.autoplayTo('BLOCKEDV001');
  f.location.search = '?v=BLOCKEDV001&list=PLabc';
  assert.equal(f.block('BLOCKEDV001'), false);
  f.flush();
  assert.deepEqual(f.navigations, []);
});

test('watch admission and Disable paths are wired to the opt-in skip', () => {
  const enforce = between(dom, 'function enforceCurrentWatchOwnerBlock(settings) {', 'const FILTERTUBE_CATEGORY_PENDING_TTL_MS');
  assert.match(enforce, /if \(isEmbedRoute\) return;[\s\S]*scheduleBlockedAutoplaySkip\(ownerMeta\.videoId, settings\)/);
  const release = between(dom, 'function releaseDisabledDirectAccessState() {', 'function scheduleDirectAccessRecheck(');
  assert.match(release, /cancelBlockedAutoplaySkip\(\)/);
  const send = between(bridgeSettings, 'function sendSettingsToMainWorld(settings) {', 'retainVerifiedVideoMetadata(settings);');
  assert.match(send, /cancelBlockedAutoplaySkip\(\)/);
});
