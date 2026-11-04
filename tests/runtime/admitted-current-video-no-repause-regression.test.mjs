// #77: an already admitted current video must not be paused again (or show the
// "Checking…" overlay) when a newer settings snapshot arrives without its
// session metadata, while real rule changes and Disabled keep their behavior.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const dom = fs.readFileSync(new URL('../../js/content/dom_fallback.js', import.meta.url), 'utf8');
const videoId = 'CURRENT0001';
const channelId = 'UCabcdefghijklmnopqrstuv';
const metadata = { identityVerified: true, textVerified: true, channelId, channelName: 'Allowed owner', title: 'Ordinary video' };

function between(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `production source range: ${start}`);
  return source.slice(first, last);
}

function settings(overrides = {}) {
  return { enabled: true, listMode: 'blocklist', filterChannels: [{ id: 'UCunrelated' }], videoMetaMap: {}, ...overrides };
}

function fixture() {
  const counters = { pauses: 0, plays: 0, requests: 0 };
  const overlays = [];
  const media = { paused: false, ended: false,
    pause() { counters.pauses++; this.paused = true; },
    play() { counters.plays++; this.paused = false; return Promise.resolve(); }
  };
  const context = vm.createContext({
    currentSettings: null, window: {}, Date, console, queueMicrotask() {},
    document: {
      location: { pathname: '/watch', hostname: 'www.youtube.com' }, documentElement: { removeAttribute() {} },
      querySelector: selector => selector.includes('video') ? media : null,
      querySelectorAll: () => [], getElementById: () => null, addEventListener() {}
    },
    setTimeout() { return 1; }, clearTimeout() {},
    getCurrentWatchVideoId: () => videoId, normalizeHandleForComparison: value => value,
    clearCurrentShortAdmissionOverlay() {}, clearCurrentWatchCategoryOverlay() {},
    releaseCurrentWatchCategoryGuard() {}, toggleVisibility() {},
    scheduleCurrentVideoAdmissionMetaFetch() { counters.requests++; },
    hasDateGatedKeywords: () => false, getActiveCategoryPolicy: () => null, getActiveLanguagePolicy: () => null,
    getCompiledKeywordRegexes: list => list.map(value => new RegExp(typeof value === 'string' ? value : value.pattern, 'i')),
    keywordDateFilterAllows: () => true, matchesKeyword: (regex, text) => regex.test(String(text || '')),
    getCompiledChannelFilterIndex(_settings, list) { return { list }; },
    channelMetaMatchesIndex: (owner, index) => index.list.some(rule => rule.id === owner.id),
    shouldHideContent: () => false
  });
  vm.runInContext(fs.readFileSync(new URL('../../js/shared/view_count.js', import.meta.url), 'utf8'), context);
  vm.runInContext([
    between(dom, 'function getCurrentWatchExactOwnerMeta(settings) {', 'function getCurrentShortPlayerHost() {'),
    between(dom, 'const FILTERTUBE_DIRECT_ACCESS_PENDING_TTL_MS', 'function getCurrentWatchDescriptionText() {'),
    between(dom, 'function getCurrentWatchAdmissionDecision(settings, context = {}) {', 'function enforceCurrentChannelPageDirectAccess(settings) {'),
    between(dom, 'function enforceCurrentWatchOwnerBlock(settings) {', 'const FILTERTUBE_CATEGORY_PENDING_TTL_MS')
  ].join('\n'), context);
  context.setDirectAccessOverlay = (state, message) => overlays.push({ state, message });
  context.clearDirectAccessOverlay = () => {};
  return {
    context, counters, overlays, media,
    enforce(next) {
      context.currentSettings = next;
      context.enforceCurrentWatchOwnerBlock(next);
      return context.getDirectAccessState().decision;
    },
    reset() { counters.pauses = counters.plays = counters.requests = 0; overlays.length = 0; }
  };
}

test('a newer snapshot without session metadata does not re-pause an admitted video', () => {
  const f = fixture();
  assert.equal(f.enforce(settings({ videoMetaMap: { [videoId]: metadata } })), 'allowed');
  f.reset();
  // Same rules, new snapshot object, verified metadata missing (tab return / refresh).
  assert.equal(f.enforce(settings()), 'allowed');
  assert.equal(f.counters.pauses, 0);
  assert.equal(f.overlays.length, 0);
  // Repeated snapshots stay quiet too.
  assert.equal(f.enforce(settings()), 'allowed');
  assert.equal(f.counters.pauses, 0);
  assert.equal(f.overlays.length, 0);
});

test('a real rule change re-evaluates an admitted video and still pauses while metadata is missing', () => {
  const f = fixture();
  f.enforce(settings({ videoMetaMap: { [videoId]: metadata } }));
  f.reset();
  assert.equal(f.enforce(settings({ filterChannels: [{ id: 'UCanotherunrelated' }] })), 'pending');
  assert.equal(f.counters.pauses, 1);
  assert.equal(f.counters.requests, 1);
});

test('a rule change that matches the admitted video blocks it and revokes the admission', () => {
  const f = fixture();
  f.enforce(settings({ videoMetaMap: { [videoId]: metadata } }));
  f.reset();
  const blocking = settings({ filterChannels: [{ id: channelId }], videoMetaMap: { [videoId]: metadata } });
  assert.equal(f.enforce(blocking), 'blocked');
  assert.equal(f.overlays.at(-1).state, 'blocked');
  assert.equal(f.context.window.__filtertubeCurrentVideoAdmission, null);
  // Back to the old rules without metadata: no stale admission survives the block.
  f.reset();
  assert.equal(f.enforce(settings()), 'pending');
  assert.equal(f.counters.pauses, 1);
});

test('in-place list edits on the same snapshot object change the admission signature', () => {
  const f = fixture();
  const live = settings({ videoMetaMap: { [videoId]: metadata } });
  f.enforce(live);
  const before = f.context.getCurrentVideoAdmissionRuleSignature(live);
  live.filterChannels.push({ id: 'UCsecondunrelated' });
  assert.notEqual(f.context.getCurrentVideoAdmissionRuleSignature(live), before);
  live.videoMetaMap = {};
  f.reset();
  assert.equal(f.enforce(live), 'pending');
});

test('a not-yet-admitted video still pauses in blocklist mode while metadata is missing', () => {
  const f = fixture();
  assert.equal(f.enforce(settings()), 'pending');
  assert.equal(f.counters.pauses, 1);
  assert.equal(f.counters.requests, 1);
});

test('Disabled releases immediately and forgets the admission', () => {
  const f = fixture();
  f.enforce(settings({ videoMetaMap: { [videoId]: metadata } }));
  assert.ok(f.context.window.__filtertubeCurrentVideoAdmission);
  f.context.releaseCurrentWatchCategoryGuard = () => {};
  f.context.clearCurrentVideoAdmissionPresentation = () => {};
  f.enforce(settings({ enabled: false }));
  assert.equal(f.context.window.__filtertubeCurrentVideoAdmission, null);
  assert.equal(f.context.getDirectAccessState().decision, 'allowed');
  assert.equal(f.context.isCurrentVideoAdmittedUnderSettings(videoId, settings({ enabled: false })), false);
});
