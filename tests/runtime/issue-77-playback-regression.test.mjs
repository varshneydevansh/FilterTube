import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Execute the production admission/guard functions with deterministic media,
// metadata and timers. Set FILTERTUBE_SOURCE_ROOT to replay against a release.
const root = process.env.FILTERTUBE_SOURCE_ROOT || process.cwd();
const source = fs.readFileSync(path.join(root, 'js/content/dom_fallback.js'), 'utf8');
const start = source.indexOf('const FILTERTUBE_DIRECT_ACCESS_PENDING_TTL_MS');
const end = source.indexOf('const FILTERTUBE_CATEGORY_PENDING_TTL_MS', start);
assert.ok(start >= 0 && end > start);
const production = source.slice(start, end);
const id = 'abcdefghijk';

function fixture({ enabled = false, successor = false, unresolved = false, route = '/watch', panel = false } = {}) {
  let now = 10000;
  let serial = 0;
  const timers = new Map();
  const elements = [];
  const listeners = new Map();
  const effects = { pauses: 0, plays: 0, nextClicks: 0, queueClicks: 0, redirects: 0, fetches: 0 };
  function element() {
    const e = {
      attrs: new Map(), textContent: '', parentElement: null,
      setAttribute(k, v) { this.attrs.set(k, v); },
      getAttribute(k) { return this.attrs.get(k); },
      removeAttribute(k) { this.attrs.delete(k); },
      appendChild(child) { child.parentElement = this; elements.push(child); },
      remove() { const i = elements.indexOf(this); if (i >= 0) elements.splice(i, 1); }
    };
    return e;
  }
  const host = element();
  const video = {
    tagName: 'VIDEO', paused: false, ended: false,
    pause() { effects.pauses++; this.paused = true; },
    play() { effects.plays++; this.paused = false; listeners.get('play')?.({ target: this }); return Promise.resolve(); }
  };
  const meta = { videoId: id, id: 'UCfixture', name: 'Fixture channel', identityVerified: true,
    textVerified: true, title: 'blocked fixture', shortDescription: 'fixture description', keywords: [] };
  const settings = { enabled, listMode: 'blocklist', filterKeywords: ['blocked'], filterChannels: [],
    videoMetaMap: unresolved ? {} : { [id]: meta } };
  const document = {
    location: { pathname: route, hostname: 'www.youtube.com', replace() { effects.redirects++; } },
    documentElement: element(), createElement: element,
    addEventListener(name, callback) { listeners.set(name, callback); },
    getElementById(key) { return elements.find(e => e.id === key) || null; },
    querySelectorAll() { return [host].filter(e => e.attrs.has('data-filtertube-current-watch-blocked')); },
    querySelector(selector) {
      if (selector.startsWith('video')) return video;
      if (selector.includes('.ytp-next-button')) return { click() { effects.nextClicks++; } };
      if (selector.includes('h1')) return { textContent: unresolved ? '' : meta.title };
      if (selector.includes('description')) return { textContent: unresolved ? '' : meta.shortDescription };
      return host;
    }
  };
  const ctx = {
    document, window: {}, currentSettings: settings,
    Date: { now: () => now },
    setTimeout(fn, delay) { const n = ++serial; timers.set(n, { fn, at: now + delay }); return n; },
    clearTimeout(n) { timers.delete(n); },
    getCurrentWatchVideoId: () => id,
    getCurrentWatchOwnerMeta: () => unresolved ? null : meta,
    getCurrentWatchExactOwnerMeta: () => unresolved ? null : meta,
    clearCurrentShortAdmissionOverlay() {}, pauseCurrentShortPlayer() { video.pause(); },
    setCurrentShortAdmissionOverlay() {}, scheduleCurrentShortIdentityResolution() {},
    scheduleVideoMetaFetch() { effects.fetches++; },
    getPlaylistPanelContainer: () => null, getPlaylistPanelRows: () => [],
    isSelectedPlaylistPanelRow: () => false, openWatchPlaylistPanelIfCollapsed: () => panel,
    findNextAllowedWatchPlaylistLink: () => successor ? { click() { effects.queueClicks++; } } : null,
    toggleVisibility() {}, isCreatorChannelPagePath: p => p.startsWith('/@'),
    buildChannelMetadata: () => meta, getCurrentPageChannelMeta: () => meta,
    getCompiledKeywordRegexes: list => list.map(s => new RegExp(s, 'i')),
    keywordDateFilterAllows: () => true, matchesKeyword: (regex, value) => regex.test(value),
    getCompiledChannelFilterIndex: (_settings, list) => list,
    channelMetaMatchesIndex: (_meta, list) => list.includes('UCfixture'),
    // Rule matching is a collaborator; enabled-gating belongs to admission.
    shouldHideContent: (text, _name, s) => s.blockedVideoIds?.includes(id) ||
      s.filterChannels?.includes('UCfixture') || s.filterKeywords.some(word => text.includes(word))
  };
  vm.createContext(ctx);
  vm.runInContext(production, ctx);
  const run = s => { ctx.currentSettings = s; ctx.enforceCurrentWatchOwnerBlock(s); };
  ctx.applyDOMFallback = s => run(s || ctx.currentSettings);
  function advance(ms) {
    const until = now + ms;
    let iterations = 0;
    while (true) {
      const next = [...timers].filter(([, t]) => t.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      assert.ok(++iterations < 500, 'timer runaway');
      timers.delete(next[0]); now = next[1].at; next[1].fn();
    }
    now = until;
  }
  return { ctx, run, advance, settings, effects, video, timers, document };
}

test('disabled keyword match never pauses or auto-skips over ten seconds', () => {
  const f = fixture();
  f.run(f.settings); f.advance(10000);
  assert.equal(f.effects.pauses, 0, JSON.stringify(f.effects));
  assert.equal(f.effects.nextClicks + f.effects.queueClicks, 0);
  assert.equal(f.video.paused, false);
});

test('enabled keyword match still blocks playback (positive control)', () => {
  const f = fixture({ enabled: true });
  f.run(f.settings); f.advance(10000);
  assert.ok(f.effects.pauses > 0);
  assert.equal(f.video.paused, true);
  assert.equal(f.ctx.getDirectAccessState().decision, 'blocked');
});

test('disabling a blocked player clears overlay and releases play-event guard', () => {
  const f = fixture({ enabled: true, route: '/embed/abcdefghijk' });
  f.run(f.settings);
  assert.equal(f.video.paused, true);
  f.run({ ...f.settings, enabled: false });
  assert.equal(f.ctx.getDirectAccessState().decision, 'allowed');
  assert.equal(f.document.getElementById('filtertube-direct-access-overlay'), null);
  f.video.play();
  assert.equal(f.video.paused, false);
});

test('disabling pending metadata cancels recheck and restores playback', () => {
  const f = fixture({ enabled: true, unresolved: true });
  f.settings.filterChannels = ['UCfixture'];
  f.run(f.settings);
  assert.equal(f.ctx.getDirectAccessState().decision, 'pending');
  f.run({ ...f.settings, enabled: false });
  assert.equal(f.ctx.getDirectAccessState().decision, 'allowed', 'Disabled must release immediately');
  f.advance(10000);
  assert.equal(f.ctx.getDirectAccessState().decision, 'allowed');
  assert.equal(f.video.paused, false);
  assert.equal(f.timers.size, 0);
});

test('disabled matching channel page never redirects', () => {
  const f = fixture({ route: '/@fixture' });
  f.settings.filterChannels = ['UCfixture'];
  f.ctx.enforceCurrentChannelPageDirectAccess(f.settings);
  assert.equal(f.effects.redirects, 0);
});

test('enabled allowed playlist successor still advances (positive control)', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings); f.advance(60);
  assert.equal(f.effects.queueClicks, 1);
});

test('disabling before a queued playlist click prevents that click', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings);
  assert.equal(f.effects.queueClicks, 0);
  f.run({ ...f.settings, enabled: false }); f.advance(100);
  assert.equal(f.effects.queueClicks, 0, 'old scheduled click must respect Disabled');
});

test('disabling while a retry is queued cannot restore old enabled settings', () => {
  const f = fixture({ enabled: true });
  f.run(f.settings);
  f.run({ ...f.settings, enabled: false }); f.advance(5000);
  assert.equal(f.ctx.getDirectAccessState().decision, 'allowed');
  assert.equal(f.video.paused, false);
});

test('disabling cancels the playlist-panel retry as well', () => {
  const f = fixture({ enabled: true, panel: true });
  f.run(f.settings);
  assert.equal(f.timers.size, 1);
  f.run({ ...f.settings, enabled: false });
  assert.equal(f.timers.size, 0);
  f.advance(1000);
  assert.equal(f.video.paused, false);
});

test('already queued callbacks stay invalid after disable and re-enable', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings);
  const oldCallback = [...f.timers.values()][0].fn;
  f.run({ ...f.settings, enabled: false });
  f.run({ ...f.settings, enabled: true });
  oldCallback(); // Simulate a callback already dispatched before cancellation.
  assert.equal(f.effects.queueClicks, 0);
  f.advance(60);
  assert.equal(f.effects.queueClicks, 1, 'newly scheduled work remains valid');
});

test('route changes prevent delayed navigation even before admission reruns', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings);
  f.ctx.getCurrentWatchVideoId = () => 'differentID';
  f.advance(100);
  assert.equal(f.effects.queueClicks, 0);
});

test('releasing a guard cancels queued navigation on an allowed video', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings);
  f.run({ ...f.settings, filterKeywords: [] });
  f.advance(100);
  assert.equal(f.effects.queueClicks, 0);
  assert.equal(f.video.paused, false);
});

test('playlist target is resolved again using the latest rules', () => {
  const f = fixture({ enabled: true, successor: true });
  f.run(f.settings);
  const latest = { ...f.settings, blockedVideoIds: ['successorID'] };
  f.ctx.currentSettings = latest;
  let checked = false;
  f.ctx.findNextAllowedWatchPlaylistLink = settings => {
    assert.equal(settings, latest);
    checked = true;
    return null;
  };
  f.advance(60);
  assert.equal(checked, true);
  assert.equal(f.effects.queueClicks, 0);
});

test('retry dispatch uses current settings rather than the captured object', () => {
  const f = fixture({ enabled: true });
  f.run(f.settings);
  f.ctx.currentSettings = { ...f.settings, filterKeywords: [] };
  f.advance(1300);
  assert.equal(f.video.paused, false);
  assert.equal(f.ctx.getDirectAccessState().decision, 'allowed');
});
