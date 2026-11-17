import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

// Quiet blocking (settings.quietBlocking): blocked and pending player covers lose the brand, the
// reason, the characters and the word "blocked". Decisions and the pause guard stay the same.

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const arabicCatalog = JSON.parse(read('data/ui_locales/ar.json'));

function sliceBetween(source, startNeedle, endNeedle) {
  const start = source.indexOf(startNeedle);
  assert.notEqual(start, -1, `missing ${startNeedle}`);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  assert.notEqual(end, -1, `missing ${endNeedle}`);
  return source.slice(start, end);
}

function createRuntime({ locale = 'en', settings = {}, askState = null, history = { length: 3 } } = {}) {
  let document;
  const listeners = new Map();

  class FakeElement {
    constructor(tagName) {
      this.tagName = String(tagName || 'div').toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.attributes = new Map();
      this.dataset = {};
      this.style = {};
      this._text = '';
      this.listeners = {};
      this.paused = this.tagName === 'VIDEO';
    }
    get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; this._text = String(value ?? ''); }
    get firstChild() { return this.children[0] || null; }
    get parentElement() { return this.parentNode; }
    get isConnected() {
      let current = this;
      while (current) {
        if (current === document?.body) return true;
        current = current.parentNode;
      }
      return false;
    }
    appendChild(child) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    append(...nodes) { nodes.forEach(node => this.appendChild(node)); }
    insertBefore(child, reference) {
      child.parentNode?.removeChild(child);
      child.parentNode = this;
      const index = this.children.indexOf(reference);
      if (index < 0) this.children.push(child); else this.children.splice(index, 0, child);
      return child;
    }
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      child.parentNode = null;
      return child;
    }
    replaceChildren(...nodes) {
      this.children.slice().forEach(child => this.removeChild(child));
      this._text = '';
      nodes.forEach(node => this.appendChild(node));
    }
    remove() { this.parentNode?.removeChild(this); }
    setAttribute(name, value) {
      const key = String(name);
      const stringValue = String(value);
      this.attributes.set(key, stringValue);
      if (key === 'id') this.id = stringValue;
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = stringValue;
    }
    getAttribute(name) { return this.attributes.get(String(name)) ?? null; }
    removeAttribute(name) { this.attributes.delete(String(name)); }
    hasAttribute(name) { return this.attributes.has(String(name)); }
    addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
    click() { (this.listeners.click || []).forEach(handler => handler({ preventDefault() {}, stopPropagation() {} })); }
    querySelector(selector) { return this.all().find(node => matches(node, selector)) || null; }
    querySelectorAll(selector) { return this.all().filter(node => matches(node, selector)); }
    all() { return this.children.flatMap(child => [child, ...child.all()]); }
    pause() { this.paused = true; this.pauseCalls = (this.pauseCalls || 0) + 1; }
    play() { this.paused = false; return Promise.resolve(); }
  }

  function matches(node, selector) {
    return selector.split(',').map(part => part.trim()).some(part => {
      const attr = part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
      if (attr) return attr[2] === undefined ? node.hasAttribute(attr[1]) : node.getAttribute(attr[1]) === attr[2];
      return node.tagName === part.toUpperCase().replace(/\..*$/, '');
    });
  }

  const body = new FakeElement('body');
  document = {
    body,
    documentElement: new FakeElement('html'),
    createElement: tagName => new FakeElement(tagName),
    getElementById(id) { return body.all().find(node => node.id === id) || null; },
    querySelector(selector) { return body.querySelector(selector); },
    querySelectorAll(selector) { return body.querySelectorAll(selector); },
    addEventListener(type, handler) { (listeners.get(type) || listeners.set(type, []).get(type)).push(handler); }
  };

  const navigations = [];
  const context = {
    document,
    navigator: { language: 'en-US' },
    history: { ...history, back() { navigations.push('back'); } },
    location: { assign(url) { navigations.push(url); }, pathname: '/watch', search: '?v=abcdefghijk' },
    chrome: {
      runtime: {
        getURL: resource => `extension://filtertube/${resource}`,
        sendMessage(message, callback) { callback(askState); },
        lastError: null
      },
      storage: { local: { get(_key, callback) { callback({ ftUiLocalePreference: locale, ftCompanionMode: 'quiet' }); } } }
    },
    fetch(url) {
      const code = url.match(/\/([^/]+)\.json$/)?.[1];
      return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(read(`data/ui_locales/${code}.json`))) });
    },
    matchMedia() { return { matches: false }; },
    currentSettings: settings,
    setTimeout: () => 0,
    clearTimeout() {}
  };
  context.window = context;
  context.globalThis = context;
  context.top = context;
  vm.createContext(context);
  vm.runInContext(read('js/content/admission_overlay.js'), context);
  return { context, document, FakeElement, listeners, navigations };
}

function loadDomFallbackOverlays(runtime, playerHost) {
  const source = read('js/content/dom_fallback.js');
  const blocks = [
    sliceBetween(source, 'function setLocalizedAdmissionOverlayMessage(', 'function setCurrentShortAdmissionOverlay('),
    sliceBetween(source, 'function setDirectAccessOverlay(', 'function releaseDirectAccessGuard('),
    sliceBetween(source, 'function setCurrentWatchCategoryOverlay(', 'function pauseCurrentWatchForCategory('),
    sliceBetween(source, 'function getDirectAccessState() {', 'function hasCurrentVideoAdmissionRules('),
    sliceBetween(source, 'function installDirectAccessPlayGuard() {', '// #77: remember the last current-video admission'),
    sliceBetween(source, 'function pauseCurrentWatchForDirectAccess(', 'function setDirectAccessOverlay(')
  ];
  runtime.context.getCurrentDirectAccessPlayerHost = () => playerHost;
  runtime.context.getCurrentWatchCategoryOverlayHost = () => playerHost;
  runtime.context.isFilterTubeFilteringEnabled = settings => Boolean(settings && settings.enabled !== false);
  runtime.context.releaseDisabledDirectAccessState = () => {};
  runtime.context.getCurrentWatchVideoId = () => 'abcdefghijk';
  runtime.context.scheduleDirectAccessRecheck = () => {};
  vm.runInContext(`${blocks.join('\n')}
this.setWatchOverlay = setDirectAccessOverlay;
this.clearWatchOverlay = clearDirectAccessOverlay;
this.setCategoryOverlay = setCurrentWatchCategoryOverlay;
this.pauseForDirectAccess = pauseCurrentWatchForDirectAccess;
this.directAccessState = getDirectAccessState;`, runtime.context);
}

function setup(options = {}) {
  const runtime = createRuntime(options);
  const player = runtime.document.createElement('div');
  const video = runtime.document.createElement('video');
  video.paused = false;
  player.appendChild(video);
  runtime.document.body.appendChild(player);
  loadDomFallbackOverlays(runtime, player);
  return { ...runtime, player, video };
}

const flush = async () => {
  for (let index = 0; index < 4; index++) await new Promise(resolve => setImmediate(resolve));
};

/** Every word a child could read or hear: text, labels and image sources. */
function visibleWords(overlay) {
  const nodes = [overlay, ...overlay.all()];
  return [
    overlay.textContent,
    ...nodes.map(node => node.getAttribute('aria-label') || ''),
    ...nodes.map(node => node.src || '')
  ].join('\n');
}

function assertUnbranded(overlay) {
  const words = visibleWords(overlay);
  assert.doesNotMatch(words, /FilterTube/i);
  assert.doesNotMatch(words, /block/i);
  assert.doesNotMatch(words, /mascots|icon-48|homepage_hero/);
  assert.doesNotMatch(words, /Category|Checking/i);
  assert.equal(overlay.querySelector('[data-filtertube-admission-panel]'), null);
  assert.equal(overlay.querySelector('[data-filtertube-admission-brand]'), null);
  assert.equal(overlay.querySelector('[data-filtertube-admission-mascot]'), null);
  assert.equal(overlay.querySelector('[data-filtertube-admission-background]'), null);
  assert.equal(overlay.querySelector('[data-filtertube-ask-parent-holder]'), null);
}

test('direct-access overlay OFF keeps the branded FilterTube notice and its reason', () => {
  const { context, document } = setup({ settings: { enabled: true } });
  context.setWatchOverlay('blocked', 'Blocked channel\nSome Channel');
  const overlay = document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.getAttribute('data-filtertube-quiet'), null);
  assert.equal(overlay.__filtertubeAdmissionBrandName.textContent, 'FilterTube');
  assert.equal(overlay.__filtertubeAdmissionTitle.textContent, 'This video is blocked');
  assert.equal(overlay.__filtertubeAdmissionReason.textContent, 'Blocked channel\nSome Channel');
  assert.equal(overlay.getAttribute('aria-label'), 'Blocked channel\nSome Channel');
});

test('direct-access overlay ON shows a plain unavailable screen with a way back', () => {
  const { context, document, navigations } = setup({ settings: { enabled: true, quietBlocking: true } });
  context.setWatchOverlay('blocked', 'Blocked channel\nSome Channel');
  const overlay = document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.getAttribute('data-filtertube-quiet'), 'true');
  assert.equal(overlay.getAttribute('data-state'), 'blocked');
  assertUnbranded(overlay);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-title]').textContent, "This video isn't available");
  assert.equal(overlay.getAttribute('aria-label'), "This video isn't available");
  assert.equal(overlay.style.background, '#121212');
  const back = overlay.querySelector('[data-filtertube-quiet-action="back"]');
  assert.equal(back.textContent, 'Go back');
  back.click();
  assert.deepEqual(navigations, ['back']);
});

test('the way back goes Home when there is no history, and embeds get no button', () => {
  const lonely = setup({ settings: { enabled: true, quietBlocking: true }, history: { length: 1 } });
  lonely.context.setWatchOverlay('blocked', 'Blocked video\nVideo ID: abcdefghijk');
  lonely.document.querySelector('[data-filtertube-quiet-action="back"]').click();
  assert.deepEqual(lonely.navigations, ['/']);

  const embed = setup({ settings: { enabled: true, quietBlocking: true } });
  embed.context.top = {};
  embed.context.setWatchOverlay('blocked', 'Blocked video\nVideo ID: abcdefghijk');
  const overlay = embed.document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.querySelector('[data-filtertube-quiet-action="back"]'), null);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-title]').textContent, "This video isn't available");
});

test('pending state ON is a dark cover with no words; OFF still says it is checking', () => {
  const quiet = setup({ settings: { enabled: true, quietBlocking: true } });
  quiet.context.setWatchOverlay('pending', 'Checking FilterTube rules…');
  const overlay = quiet.document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.getAttribute('data-state'), 'pending');
  assert.equal(overlay.textContent.trim(), '');
  assert.equal(overlay.getAttribute('aria-label'), null);
  assert.equal(overlay.getAttribute('aria-busy'), 'true');
  assert.equal(overlay.style.background, '#000000');
  assert.equal(overlay.querySelector('[data-filtertube-quiet-cover]').style.display, 'none');
  assert.equal(overlay.querySelector('[data-filtertube-quiet-action="back"]'), null);
  assertUnbranded(overlay);

  const loud = setup({ settings: { enabled: true } });
  loud.context.setWatchOverlay('pending', 'Checking FilterTube rules…');
  const branded = loud.document.getElementById('filtertube-direct-access-overlay');
  assert.match(branded.textContent, /Checking FilterTube rules…/);
  assert.match(branded.textContent, /FilterTube/);
});

test('pending then blocked keeps one quiet cover and never flashes the brand', () => {
  const { context, document } = setup({ settings: { enabled: true, quietBlocking: true } });
  context.setWatchOverlay('pending', 'Checking FilterTube rules…');
  const overlay = document.getElementById('filtertube-direct-access-overlay');
  const cover = overlay.querySelector('[data-filtertube-quiet-cover]');
  context.setWatchOverlay('blocked', 'Blocked by Duration Filter\nDuration: 240 seconds');
  assert.equal(overlay.querySelector('[data-filtertube-quiet-cover]'), cover);
  assert.equal(cover.style.display, 'flex');
  assert.equal(overlay.getAttribute('aria-busy'), null);
  assertUnbranded(overlay);
});

test('category overlay OFF names the category filter; ON is the same neutral screen', () => {
  const loud = setup({ settings: { enabled: true } });
  loud.context.setCategoryOverlay('blocked', 'Blocked by Category Filter\nCategory: Gaming');
  const branded = loud.document.getElementById('filtertube-current-watch-category-overlay');
  assert.equal(branded.__filtertubeAdmissionReason.textContent, 'Blocked by Category Filter\nCategory: Gaming');
  assert.equal(branded.__filtertubeAdmissionBrandName.textContent, 'FilterTube');

  const quiet = setup({ settings: { enabled: true, quietBlocking: true } });
  quiet.context.setCategoryOverlay('blocked', 'Blocked by Category Filter\nCategory: Gaming');
  const overlay = quiet.document.getElementById('filtertube-current-watch-category-overlay');
  assertUnbranded(overlay);
  assert.doesNotMatch(visibleWords(overlay), /Gaming/);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-title]').textContent, "This video isn't available");
  assert.equal(overlay.style.position, 'absolute', 'the cover still fills only the player');

  quiet.context.setCategoryOverlay('pending', 'Checking category…');
  assert.equal(overlay.textContent.trim(), '');
  assert.equal(overlay.getAttribute('aria-busy'), 'true');
});

test('turning Quiet blocking on or off redraws an open cover with the same decision', () => {
  const { context, document } = setup({ settings: { enabled: true } });
  context.setWatchOverlay('blocked', 'Blocked keyword\nMatched: robot');
  const overlay = document.getElementById('filtertube-direct-access-overlay');
  assert.match(visibleWords(overlay), /FilterTube/);

  context.currentSettings = { enabled: true, quietBlocking: true };
  context.setWatchOverlay('blocked', 'Blocked keyword\nMatched: robot');
  assertUnbranded(overlay);
  assert.doesNotMatch(visibleWords(overlay), /robot/);

  context.currentSettings = { enabled: true, quietBlocking: false };
  context.setWatchOverlay('blocked', 'Blocked keyword\nMatched: robot');
  assert.equal(overlay.getAttribute('data-filtertube-quiet'), null);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-cover]'), null);
  assert.equal(overlay.__filtertubeAdmissionReason.textContent, 'Blocked keyword\nMatched: robot');
});

test('a blocked video stays paused with Quiet blocking on', () => {
  const { context, video, listeners } = setup({ settings: { enabled: true, quietBlocking: true } });
  const state = context.pauseForDirectAccess('abcdefghijk', 'blocked');
  state.latestSettings = context.currentSettings;
  context.setWatchOverlay('blocked', 'Blocked video\nVideo ID: abcdefghijk');
  assert.equal(video.paused, true);
  assert.equal(state.decision, 'blocked');

  // The child presses play (or the site autoplays): the guard pauses it again.
  video.paused = false;
  for (const handler of listeners.get('play') || []) handler({ target: video });
  assert.equal(video.paused, true);
  assert.ok(video.pauseCalls >= 2);

  // Pending is held the same way while the decision is made.
  const pendingState = context.pauseForDirectAccess('abcdefghijk', 'pending');
  video.paused = false;
  for (const handler of listeners.get('play') || []) handler({ target: video });
  assert.equal(pendingState.decision, 'pending');
  assert.equal(video.paused, true);
});

test('quiet covers localize their few words and stay unbranded in another language', async () => {
  const { context, document } = setup({ locale: 'ar', settings: { enabled: true, quietBlocking: true } });
  context.setWatchOverlay('blocked', 'Blocked channel\nSome Channel');
  await flush();
  const overlay = document.getElementById('filtertube-direct-access-overlay');
  assert.equal(overlay.getAttribute('dir'), 'rtl');
  assert.equal(overlay.querySelector('[data-filtertube-quiet-title]').textContent, arabicCatalog['admission.quietVideoTitle']);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-action="back"]').textContent, arabicCatalog['admission.quietBack']);
  assertUnbranded(overlay);
});

test('a quiet blocked channel page offers no ask and reads as an unavailable channel', async () => {
  const runtime = createRuntime({ askState: { isChild: true, canAsk: true, parentName: 'Mum' } });
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);
  runtime.context.__filtertubeAskParentTarget = { kind: 'channel', channelId: 'UC0123456789012345678901', blockedBy: 'channel' };
  overlay.__filtertubeAdmissionKind = 'channel';
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel\nSome Channel', { quiet: true });
  await flush();
  assertUnbranded(overlay);
  assert.doesNotMatch(visibleWords(overlay), /Some Channel|Ask|Mum/);
  assert.equal(overlay.querySelector('[data-filtertube-quiet-title]').textContent, "This channel isn't available");
  assert.equal(runtime.context.FilterTubeAdmissionOverlay.isQuiet(overlay), true);

  // Off again: the branded card and the ask come back.
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', 'Blocked channel\nSome Channel', { quiet: false });
  await flush();
  assert.match(visibleWords(overlay), /FilterTube/);
  assert.ok(overlay.querySelector('[data-filtertube-ask-parent-holder]'));
});

test('study cards are unchanged by Quiet blocking', () => {
  const runtime = createRuntime();
  const overlay = runtime.document.createElement('div');
  runtime.document.body.appendChild(overlay);
  runtime.context.FilterTubeAdmissionOverlay.render(overlay, 'blocked', "Not part of today's study", { quiet: true });
  assert.ok(overlay.querySelector('[data-filtertube-study-card]'));
  assert.equal(overlay.querySelector('[data-filtertube-quiet-cover]'), null);
});

test('Quiet blocking is a default-off, parent-locked setting carried by every settings path', () => {
  const catalog = read('js/content_controls_catalog.js');
  assert.match(catalog, /key: 'quietBlocking',\s*title: 'Quiet blocking'/);
  // Not an ordinary viewing preference: "Restore preferences" must not switch a parent's choice off.
  assert.doesNotMatch(read('js/profile_preference_defaults.js'), /quietBlocking/);
  const state = read('js/state_manager.js');
  assert.match(state, /quietBlocking: false,/);
  // updateSetting refuses while the UI is locked (child profile, PIN, Self-Control) and only accepts listed keys.
  assert.match(sliceBetween(state, 'async function updateSetting(key, value) {', 'state[key] = !!value;'), /if \(isUiLocked\(\)\)[\s\S]*'quietBlocking'/);
  const background = read('js/background.js');
  assert.match(background, /compiledSettings\.quietBlocking = boolFromV4\('quietBlocking', items\.quietBlocking \|\| false\)/);
  assert.match(read('js/settings_shared.js'), /quietBlocking: !!quietBlocking/);
  assert.match(read('js/personal_sync.js'), /'skipBlockedAutoplay', 'quietBlocking'/);
  const io = read('js/io_manager.js');
  assert.match(io, /quietBlocking: !!mainSettings\?\.quietBlocking/);
  assert.match(io, /hasOwnProperty\.call\(mainSettingsOverrides, 'quietBlocking'\)/);
  assert.match(read('js/content/bridge_settings.js'), /'quietBlocking',/);
  for (const { code } of JSON.parse(read('data/ui_locales/targets.json')).locales) {
    const locale = JSON.parse(read(`data/ui_locales/${code}.json`));
    for (const key of ['controls.title.quietBlocking', 'controls.description.quietBlocking', 'admission.quietVideoTitle', 'admission.quietChannelTitle', 'admission.quietBack']) {
      assert.equal(typeof locale[key], 'string', `${code} ${key}`);
      assert.ok(locale[key].trim(), `${code} ${key}`);
      assert.doesNotMatch(locale[key], /YouTube/, `${code} ${key}`);
    }
    for (const key of ['admission.quietVideoTitle', 'admission.quietChannelTitle', 'admission.quietBack']) {
      assert.doesNotMatch(locale[key], /FilterTube/, `${code} ${key}`);
    }
  }
});
