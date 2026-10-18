import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const dom = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
const helpers = fs.readFileSync('js/content/dom_helpers.js', 'utf8');
function slice(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.ok(start >= 0 && end > start, startNeedle);
  return source.slice(start, end);
}
const production = [
  slice(dom, 'function isPlaylistPanelRowElement(', '\nfunction extractPlaylistPanelBylineChannelName('),
  slice(dom, 'function getCurrentWatchExactOwnerMeta(', '\nfunction getCurrentShortPlayerHost('),
  slice(dom, 'function getDirectAccessRuleRequirements(', '\nfunction scheduleCurrentVideoAdmissionMetadata('),
  slice(dom, 'function getCurrentWatchAdmissionDecision(', '\nfunction formatCurrentWatchAdmissionMessage('),
  slice(dom, 'function enforceCurrentWatchOwnerBlock(', '\nconst FILTERTUBE_CATEGORY_PENDING_TTL_MS'),
  slice(helpers, 'function toggleVisibility(', '\n/**')
].join('\n');

class Row {
  constructor(tag, classes = []) {
    this.tagName = tag.toUpperCase();
    this.attrs = new Map();
    this.classes = new Set(classes);
    this.classList = {
      contains: name => this.classes.has(name), add: name => this.classes.add(name),
      remove: name => this.classes.delete(name)
    };
    this.styles = new Map();
    this.style = {
      setProperty: (key, value) => this.styles.set(key, value),
      removeProperty: key => this.styles.delete(key)
    };
  }
  setAttribute(key, value) { this.attrs.set(key, String(value)); }
  getAttribute(key) { return this.attrs.get(key) ?? null; }
  hasAttribute(key) { return this.attrs.has(key); }
  removeAttribute(key) { this.attrs.delete(key); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
}

function runtime(tag, classes = [], selection = ['selected', '']) {
  const selected = new Row(tag, classes);
  selected.setAttribute(...selection);
  const blockedSuccessor = new Row(tag, classes);
  blockedSuccessor.setAttribute('data-filtertube-hidden-by-channel', 'true');
  blockedSuccessor.setAttribute('data-filtertube-hidden', 'true');
  blockedSuccessor.classList.add('filtertube-hidden');
  blockedSuccessor.style.setProperty('display', 'none');
  const rows = [selected, blockedSuccessor];
  const panel = {
    querySelectorAll(selector) {
      const parts = selector.split(',').map(value => value.trim());
      return rows.filter(row => parts.includes(row.tagName.toLowerCase())
        || [...row.classes].some(name => parts.includes(`.${name}`)));
    }
  };
  const events = { pauses: 0, admission: [], banners: [], timers: 0, cleanup: 0, clicks: 0 };
  const settings = { enabled: true, blockedVideoIds: ['abcdefghijk'] };
  const context = {
    console, Date, Element: Row, currentSettings: settings, window: {},
    document: {
      location: { pathname: '/watch', hostname: 'www.youtube.com' },
      querySelectorAll: selector => panel.querySelectorAll(selector),
      querySelector(selector) {
        if (selector.includes('video.html5')) return { pause() { events.pauses++; } };
        return selector.includes('playlist-panel-renderer') ? panel : null;
      }
    },
    isFilterTubeFilteringEnabled: value => value.enabled !== false,
    getDirectAccessState: () => ({}), getCurrentWatchVideoId: () => 'abcdefghijk',
    getCurrentWatchViewCountDecision: () => ({ blocked: false }),
    hasDateGatedKeywords: () => false, getActiveCategoryPolicy: () => null, getActiveLanguagePolicy: () => null,
    installDirectAccessPlayGuard() {},
    pauseCurrentWatchForDirectAccess(videoId, decision) { events.admission.push({ videoId, decision }); return {}; },
    formatCurrentWatchAdmissionMessage: () => 'Blocked video',
    setDirectAccessOverlay(state, message) { events.banners.push({ state, message }); },
    releaseDisabledDirectAccessState() { events.cleanup++; },
    handleMediaPlayback() {},
    setTimeout() { events.timers++; },
    findNextAllowedWatchPlaylistLink() { events.clicks++; throw new Error('No successor may be chosen'); }
  };
  vm.runInContext(production, vm.createContext(context), { filename: 'actual-watch-admission-with-visibility.js' });
  return { selected, blockedSuccessor, events, settings, context,
    enforce() { context.enforceCurrentWatchOwnerBlock(settings); } };
}

const variants = [
  ['desktop', 'ytd-playlist-panel-video-renderer', [], ['selected', '']],
  ['mobile', 'ytm-playlist-panel-video-renderer', [], ['aria-selected', 'true']],
  ['mobile playlist video', 'ytm-playlist-video-renderer', [], ['data-selected', 'true']],
  ['modern mobile V2', 'div', ['ytmPlaylistPanelVideoRendererV2Host'], ['aria-current', 'true']]
];

for (const [name, tag, classes, selection] of variants) {
  test(`blocked admission preserves the selected ${name} row and never selects a successor`, () => {
    const state = runtime(tag, classes, selection);
    assert.equal(state.context.getPlaylistPanelRows().length, 2, 'actual row collection includes the variant');
    state.enforce();
    assert.equal(state.selected.hasAttribute('data-filtertube-current-watch-blocked'), true);
    assert.equal(state.selected.hasAttribute('data-filtertube-hidden'), false);
    assert.equal(state.selected.styles.has('display'), false);
    assert.equal(state.blockedSuccessor.styles.get('display'), 'none');
    assert.deepEqual(state.events.admission, [{ videoId: 'abcdefghijk', decision: 'blocked' }]);
    assert.deepEqual(state.events.banners, [{ state: 'blocked', message: 'Blocked video' }]);
    assert.ok(state.events.pauses > 0);
    assert.equal(state.events.timers, 0);
    assert.equal(state.events.clicks, 0);
  });

  test(`blocked admission restores the previously hidden selected ${name} row`, () => {
    const state = runtime(tag, classes, selection);
    state.selected.setAttribute('data-filtertube-hidden-by-channel', 'true');
    state.selected.setAttribute('data-filtertube-hidden', 'true');
    state.selected.classList.add('filtertube-hidden');
    state.selected.style.setProperty('display', 'none');
    state.enforce();
    assert.equal(state.selected.hasAttribute('data-filtertube-hidden'), false);
    assert.equal(state.selected.hasAttribute('data-filtertube-hidden-by-channel'), false);
    assert.equal(state.selected.styles.has('display'), false);
    assert.equal(state.selected.classList.contains('filtertube-hidden'), false);
    assert.equal(state.blockedSuccessor.hasAttribute('data-filtertube-hidden'), true);
  });
}

test('Disabled still cleans up before selected-row mutation or admission', () => {
  const state = runtime('ytd-playlist-panel-video-renderer');
  state.settings.enabled = false;
  state.enforce();
  assert.equal(state.events.cleanup, 1);
  assert.equal(state.events.admission.length, 0);
  assert.equal(state.selected.hasAttribute('data-filtertube-current-watch-blocked'), false);
});
