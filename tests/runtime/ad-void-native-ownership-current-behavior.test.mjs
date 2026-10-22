import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSeedRuntime } from './harness/load-seed-runtime.mjs';

const source = fs.readFileSync('js/seed.js', 'utf8');
const id = 'abcdefghijk';
const settings = { enabled: true, hideSponsoredCards: true, listMode: 'blocklist',
  filterChannels: [], filterKeywords: [], filterKeywordsComments: [], contentFilters: {},
  categoryFilters: { enabled: false, selected: [] }, languageFilters: { enabled: false, selected: [] } };
const copy = value => JSON.parse(JSON.stringify(value));
function fixture({ hostname = 'www.youtube.com', pathname = '/watch', separateContent = true } = {}) {
  const base = loadSeedRuntime({ hostname, pathname });
  const docEvents = new Map(), windowEvents = new Map(), intervals = new Map(), timeouts = new Map(), styles = new Map();
  const rootAttributes = new Map(); let serial = 0, networkPayload = {};
  const mutations = [];
  const listen = (store, name, fn) => { const listeners = store.get(name) || new Set(); listeners.add(fn); store.set(name, listeners); };
  const emit = (store, name, target) => { for (const fn of [...(store.get(name) || [])]) fn({ type: name, target }); };
  const document = base.context.document;
  Object.assign(document.location, { hostname, origin: `https://${hostname}`, pathname, search: `?v=${id}` });
  document.documentElement = {
    toggleAttribute(name, present) { if (present) rootAttributes.set(name, ''); else rootAttributes.delete(name); },
    setAttribute(name, value) { rootAttributes.set(name, value); }, getAttribute: name => rootAttributes.get(name) ?? null,
    removeAttribute(name) { rootAttributes.delete(name); }
  };
  const media = (name, duration, paused) => {
    const attributes = new Map(), events = new Map();
    const values = { volume: 0.7, muted: false, defaultMuted: false, currentTime: name === 'content' ? 25 : 0 };
    const node = { tagName: 'VIDEO', duration, paused, readyState: 4, isConnected: true, ended: false,
      currentSrc: `blob:test-${name}`, src: `blob:test-${name}`,
      getBoundingClientRect: () => ({ width: 640, height: 360 }),
      getAttribute: name => attributes.get(name) ?? null, hasAttribute: name => attributes.has(name),
      setAttribute(key, value) { mutations.push([name, 'setAttribute', key, value]); attributes.set(key, value); },
      removeAttribute(key) { mutations.push([name, 'removeAttribute', key]); attributes.delete(key); },
      addEventListener(type, fn) { listen(events, type, fn); }, removeEventListener(type, fn) { events.get(type)?.delete(fn); },
      play() { mutations.push([name, 'play']); this.paused = false; emit(docEvents, 'play', this); return Promise.resolve(); },
      pause() { mutations.push([name, 'pause']); const changed = !this.paused; this.paused = true; if (changed) emit(events, 'pause', this); },
      pauseListeners: () => events.get('pause')?.size || 0
    };
    for (const key of Object.keys(values)) Object.defineProperty(node, key, {
      get: () => values[key], set(value) { mutations.push([name, key, value]); values[key] = value; }, configurable: true
    });
    return node;
  };
  const ad = media('advert', 30, false), content = media('content', 215, true);
  const videos = separateContent ? [ad, content] : [ad];
  const skipAttributes = new Map();
  const skip = { disabled: false, getBoundingClientRect: () => ({ width: 100, height: 30 }),
    getAttribute: key => skipAttributes.get(key) ?? null, setAttribute(key, value) { skipAttributes.set(key, value); },
    click() { mutations.push(['player', 'skip']); } };
  const player = { className: 'html5-video-player ad-showing ad-interrupting', contains: node => videos.includes(node),
    querySelectorAll: selector => selector === 'video' || selector.includes('video') ? videos : [],
    querySelector: selector => selector.includes('skip') || selector.includes('Skip') ? skip
      : selector.includes('video') ? ad : null,
    getDuration: () => 30, isMuted: () => false, getVolume: () => 70,
    mute() { mutations.push(['player', 'mute']); }, unMute() { mutations.push(['player', 'unMute']); },
    setVolume(value) { mutations.push(['player', 'setVolume', value]); }, seekTo(...args) { mutations.push(['player', 'seekTo', ...args]); }
  };
  Object.assign(document, {
    addEventListener(type, fn) { listen(docEvents, type, fn); },
    removeEventListener(type, fn) { docEvents.get(type)?.delete(fn); },
    getElementById: key => key === 'movie_player' ? player : styles.get(key) || null,
    querySelector: selector => selector.includes('video') ? ad : selector.includes('movie_player') ? player : null,
    querySelectorAll: selector => selector.includes('video') ? videos : [],
    createElement: () => ({ style: {}, setAttribute() {}, removeAttribute() {}, remove() { styles.delete(this.id); } }),
    head: { appendChild(node) { styles.set(node.id, node); } }
  });
  const window = { fetch: async () => new Response(JSON.stringify(networkPayload)),
    location: document.location,
    XMLHttpRequest: base.context.XMLHttpRequest, postMessage() {}, dispatchEvent() {},
    addEventListener(type, fn) { listen(windowEvents, type, fn); }, removeEventListener(type, fn) { windowEvents.get(type)?.delete(fn); },
    setInterval(fn, delay) { const key = ++serial; intervals.set(key, { fn, delay }); return key; }, clearInterval(key) { intervals.delete(key); },
    setTimeout(fn, delay) { const key = ++serial; timeouts.set(key, { fn, delay }); return key; }, clearTimeout(key) { timeouts.delete(key); },
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' })
  };
  const context = { ...base.context, document, location: document.location, window,
    URLSearchParams, Response, Request, Headers, ReadableStream, TextEncoder, TextDecoder };
  context.globalThis = context;
  vm.createContext(context); vm.runInContext(source, context, { filename: 'js/seed.js' });
  const payload = { videoDetails: { videoId: id, lengthSeconds: '215', title: 'Ordinary main video' },
    playabilityStatus: { status: 'OK' }, playerAds: [{ slot: 'synthetic' }], adPlacements: [{ slot: 'synthetic' }],
    captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.en', languageCode: 'en' }] } },
    streamingData: { adaptiveFormats: [{ itag: 140, audioTrack: { id: 'en.4', displayName: 'Original' } }] } };
  window.filterTube.updateSettings({ ...settings }); window.ytInitialPlayerResponse = copy(payload);
  return { window, context, document, player, ad, content, mutations, intervals, timeouts, styles, rootAttributes,
    payload, setNetwork: value => { networkPayload = value; }, emit: type => emit(docEvents, type, content), windowEvent: type => emit(windowEvents, type),
    allEvents() { for (const type of ['playing', 'loadedmetadata', 'durationchange', 'canplay', 'yt-page-data-updated', 'yt-navigate-finish']) emit(docEvents, type, content); },
    drain() { for (const timer of [...timeouts.values()]) timer.fn(); timeouts.clear(); for (const timer of [...intervals.values()]) timer.fn(); },
    update: change => window.filterTube.updateSettings({ ...settings, ...change }) };
}

for (const contentOnlyPlayback of [undefined, true, false]) {
  test(`desktop Watch never mutates native media regardless of content-only preference ${String(contentOnlyPlayback)}`, () => {
    const state = fixture(); state.update({ contentOnlyPlayback }); state.allEvents(); state.drain();
    for (const enabled of [false, true]) { state.update({ enabled, contentOnlyPlayback }); state.allEvents(); state.drain(); }
    assert.deepEqual(state.mutations, []); assert.equal(state.intervals.size, 0); assert.equal(state.timeouts.size, 0);
    assert.equal(state.content.pauseListeners(), 0); assert.equal(state.content.paused, true);
    assert.equal(state.rootAttributes.get('data-filtertube-ad-void-state'), 'native-player-owned');
    assert.equal(state.rootAttributes.has('data-filtertube-ad-void-enabled'), false); assert.equal(state.styles.size, 0);
  });
}

test('desktop retirement still filters explicit ad plans while preserving captions, audio and ordinary content', () => {
  const state = fixture(); const filtered = copy(state.window.ytInitialPlayerResponse);
  assert.equal(filtered.playerAds, undefined); assert.equal(filtered.adPlacements, undefined);
  const expected = copy(state.payload); delete expected.playerAds; delete expected.adPlacements;
  assert.deepEqual(filtered, expected); assert.deepEqual(state.mutations, []);
});

test('a real parent play guard and a user pause remain authoritative over all old fallback events', () => {
  const state = fixture(); const dom = fs.readFileSync('js/content/dom_fallback.js', 'utf8');
  const a = dom.indexOf('function installDirectAccessPlayGuard() {'), b = dom.indexOf('function pauseCurrentWatchForDirectAccess(', a);
  const direct = { videoId: id, decision: 'blocked', latestSettings: settings, routeTransitionPending: false };
  Object.assign(state.context, { getDirectAccessState: () => direct, isFilterTubeFilteringEnabled: () => true,
    getCurrentWatchVideoId: () => id, releaseDisabledDirectAccessState() {}, scheduleDirectAccessRecheck() {} });
  vm.runInContext(dom.slice(a, b) + '\ninstallDirectAccessPlayGuard();', state.context);
  state.content.play(); assert.equal(state.content.paused, true, 'the production parent guard pauses the explicit play');
  state.mutations.length = 0;
  for (let round = 0; round < 4; round++) { state.allEvents(); state.update({ contentOnlyPlayback: round % 2 === 0 }); state.drain(); }
  assert.deepEqual(state.mutations, []); assert.equal(state.content.paused, true); assert.equal(state.content.pauseListeners(), 0);
});

test('retained mobile fallback never resumes paused main content against user intent', () => {
  const state = fixture({ hostname: 'm.youtube.com' }); state.mutations.length = 0;
  for (let round = 0; round < 4; round++) { state.allEvents(); state.drain(); }
  assert.equal(state.content.paused, true); assert.equal(state.content.pauseListeners(), 0);
  assert.equal(state.mutations.some(([owner, action]) => owner === 'content' && action === 'play'), false);
});


test('desktop network filtering removes only explicit advert owners without media side effects', async () => {
  const state = fixture();
  const organic = { videoRenderer: { videoId: id, title: { simpleText: 'Art about advertising' } } };
  state.setNetwork({ playerResponse: copy(state.payload), contents: [organic, { adSlotRenderer: { slotId: 'test-ad' } }] });
  const response = await state.window.fetch('/youtubei/v1/get_watch');
  const filtered = await response.json();
  assert.deepEqual(filtered.contents, [organic]);
  const expected = copy(state.payload); delete expected.playerAds; delete expected.adPlacements;
  assert.deepEqual(filtered.playerResponse, expected);
  assert.deepEqual(state.mutations, []); assert.equal(state.intervals.size, 0);
});

function audioOrTransportChanges(state) {
  return state.mutations.filter(([, action]) => !['setAttribute', 'removeAttribute'].includes(action));
}

test('leaving retained fallback for desktop cancels ownership without restoring stale audio', () => {
  const state = fixture({ hostname: 'm.youtube.com' }); assert.equal(state.intervals.size, 1);
  state.emit('yt-navigate-start'); state.mutations.length = 0;
  state.document.location.hostname = 'www.youtube.com'; state.document.location.origin = 'https://www.youtube.com';
  state.ad.currentSrc = 'blob:new-native-source'; state.content.currentSrc = 'blob:new-main-source';
  state.emit('yt-navigate-finish'); state.allEvents(); state.drain();
  assert.equal(state.intervals.size, 0); assert.equal(state.timeouts.size, 0); assert.equal(state.styles.size, 0);
  assert.deepEqual(audioOrTransportChanges(state), []); assert.equal(state.content.pauseListeners(), 0);
  assert.equal(state.rootAttributes.get('data-filtertube-ad-void-state'), 'native-player-owned');
});

test('pagehide prevents late media events from restarting fallback or restoring audio', () => {
  const state = fixture({ hostname: 'm.youtube.com' }); assert.equal(state.intervals.size, 1);
  state.windowEvent('pagehide'); state.mutations.length = 0;
  state.allEvents(); state.update({ contentOnlyPlayback: false }); state.drain();
  assert.equal(state.intervals.size, 0); assert.equal(state.timeouts.size, 0); assert.equal(state.styles.size, 0);
  assert.deepEqual(audioOrTransportChanges(state), []); assert.equal(state.content.pauseListeners(), 0);
  state.windowEvent('pageshow'); assert.equal(state.intervals.size, 1, 'retained surfaces may restart once when shown');
  state.windowEvent('pageshow'); assert.equal(state.intervals.size, 1);
  assert.equal(state.mutations.some(([, action]) => action === 'play'), false);
});

test('retained fallback may present already-playing content but never starts or restarts it', () => {
  const state = fixture({ hostname: 'm.youtube.com' }); state.content.paused = false; state.mutations.length = 0;
  state.emit('playing');
  assert.equal(state.content.getAttribute('data-filtertube-ad-void-content'), 'true');
  assert.equal(state.content.pauseListeners(), 0); assert.equal(state.timeouts.size, 0);
  state.content.pause(); state.mutations.length = 0; state.allEvents(); state.drain();
  assert.equal(state.content.paused, true); assert.equal(state.content.getAttribute('data-filtertube-ad-void-content'), null);
  assert.equal(state.mutations.some(([, action]) => action === 'play'), false); assert.equal(state.timeouts.size, 0);
});

for (const change of ['video-source', 'route']) {
  test(`retained fallback never restores stale audio after ${change} changes`, () => {
    const state = fixture({ hostname: 'm.youtube.com', separateContent: false });
    if (change === 'video-source') { state.ad.currentSrc = 'blob:new-source'; state.ad.src = 'blob:new-source'; }
    else state.document.location.search = '?v=lmnopqrstuv';
    state.mutations.length = 0; state.update({ hideSponsoredCards: false });
    assert.deepEqual(audioOrTransportChanges(state), []); assert.equal(state.intervals.size, 0);
  });
}
