import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const bridgeSource = fs.readFileSync('js/content_bridge.js', 'utf8');
const settingsSource = fs.readFileSync('js/content/bridge_settings.js', 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing production start: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing production end: ${end}`);
  return source.slice(from, to);
}

const helpers = between(bridgeSource, 'function bridgeHasList(value)', 'function needsIdentityPrefetchWork(settings)')
  + between(bridgeSource, 'function hasBridgeEnabledContentFilters(settings)', 'async function ensureMainWorldRuntimeForBridgeRequest()');
const dispatch = between(settingsSource, 'function sendSettingsToMainWorld(settings)', 'let pendingStorageRefreshTimer');
const initialize = between(bridgeSource, 'async function initialize()', 'async function initializeDOMFallback(settings)');

function fixture({ denied = false, inject = async () => {}, available = true, settings = null } = {}) {
  const events = [];
  const context = vm.createContext({
    mainWorldSettingsDispatchRevision: 0,
    managedContentPlaybackPermit: { clear() {} },
    latestSettings: null,
    currentSettings: null,
    pendingSeedSettings: null,
    pendingSeedSettingsRevision: 0,
    isFilterTubeManagedViewingRouteDenied: () => denied,
    retainVerifiedVideoMetadata() {},
    applyManagedViewingRouteGate: () => false,
    releaseManagedTimeLimitRuntime() {},
    applyManagedTimeLimitRuntime() {},
    tryApplySettingsToSeed(value, revision) {
      events.push({ type: 'seed', settings: value, revision });
      return true;
    },
    ensureSeedReadyListener() { throw new Error('ready seed must not need a listener'); },
    scheduleSeedRetry() { throw new Error('ready seed must not need retries'); },
    refreshRuntimeObserversAfterSettingsUpdate() {},
    window: { postMessage(message, target) { events.push({ type: 'message', message, target }); } },
    initializeStats() {},
    requestSettingsFromBackground: async () => ({ success: true, settings }),
    syncCategoryPolicyShellState() {},
    initializeDOMFallback(value) { events.push({ type: 'dom', settings: value }); },
    debugLog() {}
  });
  if (available) {
    context.injectMainWorldScripts = async () => {
      events.push({ type: 'inject' });
      await inject();
      events.push({ type: 'injected' });
    };
  }
  vm.runInContext(helpers + dispatch + initialize, context, { filename: 'actual-advert-startup-helpers.js' });
  return { context, events };
}

function adOnly(overrides = {}) {
  return { enabled: true, listMode: 'blocklist', hideSponsoredCards: true, ...overrides };
}

test('advert-only startup loads MAIN runtime and forwards the same settings through the actual dispatcher', async () => {
  const settings = adOnly();
  const { context, events } = fixture();
  assert.equal(context.needsMainWorldRuntimeWork(settings), true);
  assert.equal(await context.ensureMainWorldRuntimeForSettings(settings), true);
  assert.deepEqual(events.map(event => event.type), ['inject', 'injected', 'message', 'seed']);
  const sent = events.find(event => event.type === 'message');
  assert.equal(sent.message.type, 'FilterTube_SettingsToInjector');
  assert.equal(sent.message.source, 'content_bridge');
  assert.equal(sent.message.payload, settings);
  assert.equal(sent.message.revision, 1);
  assert.equal(sent.target, '*');
  assert.equal(events.find(event => event.type === 'seed').settings, settings);
  assert.equal(context.currentSettings, settings);
});

test('settings are not forwarded until advert runtime injection has completed', async () => {
  let finish;
  const injection = new Promise(resolve => { finish = resolve; });
  const { context, events } = fixture({ inject: () => injection });
  const result = context.ensureMainWorldRuntimeForSettings(adOnly());
  assert.deepEqual(events.map(event => event.type), ['inject']);
  finish();
  assert.equal(await result, true);
  assert.deepEqual(events.map(event => event.type), ['inject', 'injected', 'message', 'seed']);
});

test('global Disabled prevents advert injection and dispatch even with other active work', async () => {
  const { context, events } = fixture();
  const settings = adOnly({ enabled: false, listMode: 'whitelist', filterChannels: ['UCexample'] });
  assert.equal(context.needsMainWorldRuntimeWork(settings), false);
  assert.equal(await context.ensureMainWorldRuntimeForSettings(settings), false);
  assert.equal(events.length, 0);
});

test('absent or inactive advert settings with no other work do not load or dispatch MAIN runtime', async () => {
  for (const settings of [null, {}, adOnly({ hideSponsoredCards: false }), adOnly({ hideSponsoredCards: undefined }), adOnly({ hideSponsoredCards: 'true' })]) {
    const { context, events } = fixture();
    assert.equal(context.needsMainWorldRuntimeWork(settings), false);
    assert.equal(await context.ensureMainWorldRuntimeForSettings(settings), false);
    assert.equal(events.length, 0);
  }
});

test('managed route denial still takes precedence over advert runtime work', async () => {
  const { context, events } = fixture({ denied: true });
  assert.equal(context.needsMainWorldRuntimeWork(adOnly()), false);
  assert.equal(await context.ensureMainWorldRuntimeForSettings(adOnly()), false);
  assert.equal(events.length, 0);
});

test('other existing filter modes continue to start MAIN when sponsored hiding is off', async () => {
  for (const overrides of [
    { listMode: 'whitelist' },
    { filterKeywords: ['blocked title'] },
    { contentFilters: { duration: { enabled: true } } },
    { categoryFilters: { enabled: true, selected: ['Gaming'] } }
  ]) {
    const { context, events } = fixture();
    assert.equal(await context.ensureMainWorldRuntimeForSettings(adOnly({ hideSponsoredCards: false, ...overrides })), true);
    assert.equal(events.filter(event => event.type === 'inject').length, 1);
    assert.equal(events.filter(event => event.type === 'message').length, 1);
  }
});

test('missing or failed injection cannot falsely forward advert settings to a ready runtime', async () => {
  const missing = fixture({ available: false });
  assert.equal(await missing.context.ensureMainWorldRuntimeForSettings(adOnly()), false);
  assert.equal(missing.events.length, 0);
  const failed = fixture({ inject: async () => { throw new Error('injection refused'); } });
  await assert.rejects(failed.context.ensureMainWorldRuntimeForSettings(adOnly()), /injection refused/);
  assert.deepEqual(failed.events.map(event => event.type), ['inject']);
});

test('actual initialization starts DOM work and then boots advert-only MAIN with compiled settings', async () => {
  const settings = adOnly();
  const { context, events } = fixture({ settings });
  await context.initialize();
  assert.deepEqual(events.map(event => event.type), ['dom', 'inject', 'injected', 'message', 'seed']);
  assert.equal(events[0].settings, settings);
  assert.equal(events.find(event => event.type === 'seed').settings, settings);
});

test('actual initialization keeps Disabled and empty profiles out of MAIN startup', async () => {
  for (const settings of [adOnly({ enabled: false }), adOnly({ hideSponsoredCards: false })]) {
    const { context, events } = fixture({ settings });
    await context.initialize();
    assert.deepEqual(events.map(event => event.type), ['dom']);
  }
});

function contentStylesFixture(pathname = '/watch') {
  const source = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
  const elements = new Map();
  const attributes = new Map();
  const document = {
    location: { pathname },
    documentElement: { setAttribute(name, value) { attributes.set(name, value); } },
    head: { appendChild(element) { elements.set(element.id, element); } },
    createElement: tagName => ({ tagName, id: '', textContent: '' }),
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => []
  };
  const context = vm.createContext({
    document,
    CSS: { supports: () => false },
    ensureStyles() {},
    hideYouTubeOpenAppButtons() {},
    hideInlineMobileSearchResultControls() {}
  });
  vm.runInContext(
    between(source, 'function ensureContentControlStyles(settings)', 'const INLINE_MOBILE_SEARCH_CONTROL_HOST_SELECTORS')
    + between(source, 'function restoreInlineMobileSearchResultControls()', 'function isInlineMobileSearchResultControl(element)')
    + between(source, 'function syncRouteScopedContentControls(settings)', 'function hideYouTubeOpenAppButtons()'),
    context,
    { filename: 'actual-advert-content-styles.js' }
  );
  return {
    context,
    attributes,
    style: () => elements.get('filtertube-content-controls-style'),
    styles: () => elements.get('filtertube-content-controls-style')?.textContent || ''
  };
}

function hiddenSelectors(css) {
  const selectors = new Set();
  for (const [, header, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!/display\s*:\s*none\s*!important\s*;/.test(declarations)) continue;
    for (const selector of header.split(',')) selectors.add(selector.trim());
  }
  return selectors;
}

const advertSelectors = [
  'ytd-ad-slot-renderer',
  'ytm-ad-slot-renderer',
  'ytd-promoted-video-renderer',
  'ytd-video-masthead-ad-renderer',
  'ytd-video-masthead-ad-v3-renderer',
  'ytm-video-masthead-ad-v3-renderer'
];

test('actual route controls hide exact desktop/mobile advert owners on Home, search and watch', () => {
  for (const pathname of ['/', '/results', '/watch']) {
    const state = contentStylesFixture(pathname);
    state.context.syncRouteScopedContentControls(adOnly());
    const selectors = hiddenSelectors(state.styles());
    for (const selector of advertSelectors) assert.ok(selectors.has(selector), `missing ${selector} on ${pathname}`);
    assert.equal(state.attributes.get('data-filtertube-route-watch'), pathname === '/watch' ? 'true' : 'false');
    assert.equal(state.attributes.get('data-filtertube-route-home'), pathname === '/' ? 'true' : 'false');
    assert.equal(state.attributes.get('data-filtertube-route-search'), pathname === '/results' ? 'true' : 'false');
  }
});

test('advert-only generated CSS does not hide the ordinary navigation masthead', () => {
  const state = contentStylesFixture();
  state.context.syncRouteScopedContentControls(adOnly());
  const selectors = hiddenSelectors(state.styles());
  assert.ok(selectors.has('ytd-video-masthead-ad-v3-renderer'), 'positive control: ad masthead is hidden');
  assert.equal(selectors.has('ytd-masthead'), false);
  assert.equal(selectors.has('#masthead-container'), false);
  assert.equal(selectors.has('header'), false);
});

test('turning advert hiding off rewrites the existing style without leaving advert selectors', () => {
  const state = contentStylesFixture();
  state.context.syncRouteScopedContentControls(adOnly());
  const originalStyle = state.style();
  assert.ok(hiddenSelectors(state.styles()).has('ytm-ad-slot-renderer'));
  state.context.syncRouteScopedContentControls(adOnly({ hideSponsoredCards: false }));
  assert.equal(state.style(), originalStyle, 'the existing shared style is rewritten');
  const selectors = hiddenSelectors(state.styles());
  for (const selector of advertSelectors) assert.equal(selectors.has(selector), false, `${selector} must stop being hidden`);
});

test('global Disabled clears actual content-control styles even while advert preference remains on', () => {
  const state = contentStylesFixture();
  state.context.syncRouteScopedContentControls(adOnly());
  assert.ok(state.styles().length > 0);
  state.context.syncRouteScopedContentControls(adOnly({ enabled: false }));
  assert.equal(state.styles(), '');
  state.context.syncRouteScopedContentControls(adOnly());
  assert.ok(hiddenSelectors(state.styles()).has('ytd-video-masthead-ad-v3-renderer'));
});
