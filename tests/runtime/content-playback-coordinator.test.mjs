import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const id = 'abcdefghijk';
class Element {
  constructor(tag) { this.tagName = tag; this.style = {}; this.dataset = {}; this.children = []; this.listeners = new Map();
    this.attributes = new Map(); this.isConnected = true; this.disabled = false; this.classList = { contains: () => false }; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  hasAttribute(key) { return this.attributes.has(key); }
  contains(node) { for (let current = node; current; current = current.parentElement) if (current === this) return true; return false; }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  removeEventListener(name, callback) { if (this.listeners.get(name) === callback) this.listeners.delete(name); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  append(...children) { for (const child of children) this.appendChild(child); }
  prepend(child) { child.parentElement = this; this.children.unshift(child); }
  remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
}
const flush = async () => { for (let i = 0; i < 120; i++) await Promise.resolve(); };
function adaptiveResponse(extraAudio = []) {
  const format = (kind, track) => ({ itag: kind === 'video' ? 134 : 140,
    url: `https://r1.googlevideo.com/videoplayback?expire=1000&kind=${kind}${track ? '&track=' + track : ''}`,
    mimeType: kind === 'video' ? 'video/mp4; codecs="avc1.42001E"' : 'audio/mp4; codecs="mp4a.40.2"',
    contentLength: '5000', initRange: { start: '0', end: '99' }, indexRange: { start: '100', end: '199' },
    ...(kind === 'video' ? { width: 640, height: 360 } : { audioTrack: { id: track,
      languageCode: track.split('.')[0], displayName: track, audioIsDefault: track === 'en.4', isOriginal: track === 'en.4' } }) });
  return { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
    streamingData: { adaptiveFormats: [format('video'), format('audio', 'en.4'), ...extraAudio.map(track => format('audio', track))] } };
}
function fixture({ child = false, decision = 'allowed', paused = false, deferNative = false } = {}) {
  let at = 10000, serial = 0, nativeVideo, targetReady = true, fresh = adaptiveResponse(), fetchDelegate = null;
  const timers = new Map(), messages = [], calls = [], created = [], fetches = [], actions = new WeakSet();
  const rootListeners = new Map(), docListeners = new Map(), playerClasses = new Set();
  const target = new Element('section'), surface = new Element('div'), parent = new Element('div'); parent.appendChild(surface);
  const original = { duration: 180, currentTime: 25, volume: 0.7, playbackRate: 1.25, muted: false, paused, pauseCalls: 0, playCalls: 0,
    canPlayType: () => 'probably', pause() { this.pauseCalls++; this.paused = true; },
    play() { this.playCalls++; this.paused = false; return Promise.resolve(); } };
  nativeVideo = original; surface.appendChild(original); surface.classList = { contains: name => playerClasses.has(name) };
  surface.querySelector = selector => selector === 'video.html5-main-video' ? nativeVideo : null;
  const root = { addEventListener(name, callback) { rootListeners.set(name, callback); },
    postMessage(message) { messages.push(message); },
    fetch(url, options) {
      fetches.push({ url, options });
      if (fetchDelegate) return fetchDelegate(url, options);
      return Promise.resolve(new Response(JSON.stringify(String(url).includes('/visitor_id')
        ? { responseContext: { visitorData: 'opaque-test-visitor' } } : fresh), { headers: { 'content-type': 'application/json' } }));
    } };
  const settings = { enabled: true, hideSponsoredCards: true, activeProfileId: child ? 'child-a' : 'parent-a',
    activeProfileKind: child ? 'child' : 'account', profileType: 'main', videoMetaMap: {} };
  root.__filtertubeDirectAccessState = { videoId: id, decision, routeTransitionPending: false, latestSettings: settings };
  const document = { documentElement: new Element('html'),
    querySelector: selector => selector.includes('video.html5-main-video') ? nativeVideo : selector.includes('#above-the-fold') && targetReady ? target : null,
    getElementById: value => value === 'movie_player' ? surface : null,
    createElement(tag) { const node = new Element(tag); created.push(node); return node; },
    addEventListener(name, callback) { docListeners.set(name, callback); },
    removeEventListener(name, callback) { if (docListeners.get(name) === callback) docListeners.delete(name); } };
  const timer = (callback, delay, interval) => { const key = ++serial; timers.set(key, { callback, delay, interval }); return key; };
  Object.assign(root, { setTimeout: (callback, delay) => timer(callback, delay, false), clearTimeout: key => timers.delete(key),
    setInterval: (callback, delay) => timer(callback, delay, true), clearInterval: key => timers.delete(key) });
  let category = 'inactive', language = 'inactive';
  const context = vm.createContext({ window: root, document, currentSettings: settings,
    location: { href: `https://www.youtube.com/watch?v=${id}`, origin: 'https://www.youtube.com', hostname: 'www.youtube.com', pathname: '/watch', search: `?v=${id}` },
    URL, URLSearchParams, Uint8Array, TextDecoder, crypto: webcrypto, AbortController, queueMicrotask,
    Date: class extends Date { static now() { return at; } },
    setTimeout: root.setTimeout, clearTimeout: root.clearTimeout, setInterval: root.setInterval, clearInterval: root.clearInterval,
    isFilterTubeNativeOverlayQuietMode: () => root.__filterTubeNativeOverlayCovered === true
      || root.__filterTubeNativeFullscreenActive === true
      || document.documentElement.hasAttribute('data-filtertube-native-overlay-covered')
      || document.documentElement.hasAttribute('data-filtertube-native-fullscreen'),
    enforceCurrentVideoAdmissionForRoute() { root.__filtertubeDirectAccessState.latestSettings = context.currentSettings; },
    getCategoryPolicyDecision: () => category, getLanguagePolicyDecision: () => language });
  root.location = context.location; root.crypto = webcrypto;
  for (const file of ['js/content/content_playback_admission.js', 'js/shared/content_playback_source.js', 'js/shared/content_playback_resolver.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  // This suite exercises actual admission/resolution/coordinator code. The
  // native controller is the explicit boundary mock; its separate suite owns
  // MAIN cue acknowledgements, guard installation and actual media events.
  root.FilterTubeContentPlaybackNative = {
    captureTrustedAction(event, videoId) { if (!event.isTrusted || videoId !== id) return null;
      const token = Object.freeze({}); actions.add(token); return token; },
    create(options) {
      assert.equal(options.originalVideo, original); assert.equal(options.originalSurface, surface);
      const record = { options, input: null, closed: false, handedOff: false }; calls.push(record);
      let finish;
      const controller = {
        start(input) {
          record.input = input;
          assert.equal(input.videoId, id); assert.equal(input.playbackIntent.videoId, id);
          assert.equal(input.source.kind, 'adaptive_mp4');
          assert.equal(input.preferences.audioKnown, true); assert.equal(input.preferences.captionsKnown, true);
          assert.ok(actions.has(input.actionToken), 'a trusted captured action must reach the native transaction'); actions.delete(input.actionToken);
          assert.equal(options.validateLease(input.lease), true, 'real admission must validate its own opaque token');
          const result = new Promise(resolve => { finish = resolve; });
          if (!deferNative) complete(); return result;
        },
        stop(reason) {
          if (record.closed || record.handedOff) return;
          record.closed = true; record.stopped = reason; record.canRestore = options.validateLease(record.input?.lease);
          if (!record.canRestore) original.pause();
          finish?.({ status: 'fallback', reason }); options.onFallback({ reason });
        },
        destroy() { record.destroyed = true; if (!record.handedOff) controller.stop('destroyed'); }
      };
      function complete() {
        if (record.closed) return;
        if (!options.validateLease(record.input.lease)) { controller.stop('authorization_invalid'); return; }
        options.enforceNativeAdmission(); record.handedOff = true; options.onState({ status: 'active' });
        finish({ status: 'active', handedOff: true });
      }
      record.complete = complete;
      record.check = () => { const valid = options.validateLease(record.input?.lease);
        if (!valid) controller.stop('authorization_invalid'); return valid; };
      return controller;
    }
  };
  root.FilterTubeContentPlaybackPlayer = { create() { throw new Error('a competing owned player must not be created'); } };
  root.FilterTubeContentPlaybackCaptions = { prepare() { throw new Error('native captions must not be rebuilt'); } };
  vm.runInContext(fs.readFileSync('js/content/content_playback.js', 'utf8'), context, { filename: 'js/content/content_playback.js' });
  const button = () => created.find(node => node.tagName === 'button' && node.isConnected);
  const click = async (trusted = true) => { button().listeners.get('click')({ isTrusted: trusted }); await flush(); };
  const response = (overrides = {}) => {
    const request = messages.at(-1)?.payload; assert.ok(request, 'a source request must exist');
    const payload = { requestId: request.requestId, videoId: request.videoId,
      playerResponse: { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
        streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=1000',
          mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', width: 640, height: 360 }] } },
      preferences: { audioKnown: true, audioTrackCount: 1, audioTrackId: 'en.4', audioTracks: [{ id: 'en.4' }],
        captionsKnown: true, captionsEnabled: false }, ...overrides };
    rootListeners.get('message')({ source: root, origin: context.location.origin,
      data: { type: 'FilterTube_ContentPlaybackResponse', source: 'injector', payload } }); return payload;
  };
  return { root, context, document, settings, timers, messages, calls, created, original, surface, parent, fetches,
    button, click, response, playerClasses, setTargetReady: value => { targetReady = value; },
    replaceNativeVideo: value => { nativeVideo = value; }, setFresh: value => { fresh = value; },
    setFetch: value => { fetchDelegate = value; }, setCategory: value => { category = value; }, setLanguage: value => { language = value; },
    init: () => root.FilterTubeContentPlayback.initialize(),
    tick: () => { at += 250; for (const item of [...timers.values()]) if (item.interval) item.callback(); },
    navigate: () => docListeners.get('yt-navigate-start')(),
    interact: (trusted, target = original, type = 'pointerdown') => docListeners.get(type)?.({ isTrusted: trusted, target }),
    hasNativeInputGuard: () => docListeners.has('pointerdown') || docListeners.has('keydown'),
    emit: payload => rootListeners.get('message')?.({ source: root, origin: context.location.origin, data: payload }) };
}

async function begin(state, response) { state.init(); await state.click(); state.response(response); await flush(); }
function noReplacementPlayer(state) {
  assert.equal(state.created.some(node => node.tagName === 'video'), false);
  assert.equal(state.created.some(node => node.hasAttribute('data-filtertube-content-player-host')), false);
  assert.equal(state.parent.children.length, 1); assert.equal(state.parent.children[0], state.surface);
  assert.ok(state.fetches.every(call => /\/youtubei\/v1\/(?:visitor_id|player)\?/.test(String(call.url))), 'no caption or media fetch belongs to this coordinator');
}

test('initialization and untrusted clicks do not resolve media or change ordinary playback', async () => {
  const state = fixture(); state.init(); await flush(); assert.ok(state.button()); await state.click(false);
  assert.equal(state.messages.length, 0); assert.equal(state.fetches.length, 0); assert.equal(state.calls.length, 0);
  assert.equal(state.original.pauseCalls, 0); noReplacementPlayer(state);
});
for (const decision of ['pending', 'blocked']) {
  test(`a child ${decision} decision cannot request or resolve a media source`, async () => {
    const state = fixture({ child: true, decision }); state.init(); await state.click();
    assert.equal(state.messages.length, 0); assert.equal(state.fetches.length, 0); assert.equal(state.calls.length, 0);
  });
}

test('real adaptive resolution hands off the original player without leaving a source lease or heartbeat', async () => {
  const state = fixture(); await begin(state);
  assert.equal(state.calls.length, 1); const transaction = state.calls[0];
  assert.ok(Object.isFrozen(transaction.input.lease)); assert.equal(transaction.input.source.kind, 'adaptive_mp4');
  assert.equal(transaction.handedOff, true); assert.equal(transaction.destroyed, true); assert.equal(transaction.stopped, undefined);
  assert.equal(transaction.options.validateLease(transaction.input.lease), false, 'the preparation lease ends at native handoff');
  assert.equal(state.timers.size, 0); assert.equal(state.original.pauseCalls, 0); assert.equal(state.original.playCalls, 0);
  assert.equal(state.original.paused, false); assert.equal(state.fetches.length, 2); assert.equal(state.hasNativeInputGuard(), false); noReplacementPlayer(state);
});
for (const paused of [true, false]) {
  test(`handoff preserves original paused intent ${paused} and subsequent cleanup does not own native playback`, async () => {
    const state = fixture({ paused }); await begin(state); assert.equal(state.calls[0].input.playbackIntent.paused, paused);
    state.root.FilterTubeContentPlayback.invalidate('settings_changed'); await flush();
    assert.equal(state.original.paused, paused); assert.equal(state.original.pauseCalls, 0); assert.equal(state.calls[0].stopped, undefined);
  });
}

test('unsolicited MAIN permission and forged lease fields never replace isolated admission', async () => {
  const state = fixture({ child: true, decision: 'blocked' }); state.init();
  state.emit({ type: 'FilterTube_AllowPlayback', source: 'injector', payload: { allowed: true, videoId: id, lease: { expiresAt: 999999 } } });
  await state.click(); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
});
for (const cause of ['navigation', 'profile change']) {
  test(`late source reply after ${cause} cannot begin a native transaction`, async () => {
    const state = fixture(); state.init(); await state.click();
    if (cause === 'navigation') state.navigate();
    else { state.context.currentSettings = { ...state.settings, activeProfileId: 'child-b', activeProfileKind: 'child' };
      state.root.FilterTubeContentPlayback.invalidate('settings_changed'); }
    state.response(); await flush(); assert.equal(state.calls.length, 0); assert.equal(state.fetches.length, 0); assert.equal(state.timers.size, 0);
  });
}
for (const feature of ['audioKnown', 'captionsKnown']) {
  test(`unknown ${feature} retains native playback before any extraction request`, async () => {
    const state = fixture(); await begin(state, { preferences: { audioKnown: true, captionsKnown: true, [feature]: false } });
    assert.equal(state.calls.length, 0); assert.equal(state.fetches.length, 0); assert.equal(state.original.pauseCalls, 0);
  });
}
test('native overlay ownership prevents source requests', async () => {
  const state = fixture(); state.document.documentElement.setAttribute('data-filtertube-native-overlay-covered', 'true');
  state.init(); await state.click(); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
});
for (const field of ['categoryFilters', 'languageFilters']) {
  test(`unresolved enabled ${field} cannot refresh the source`, async () => {
    const state = fixture({ child: true }); state.settings[field] = { enabled: true };
    if (field === 'categoryFilters') state.setCategory('unknown'); else state.setLanguage('unknown');
    state.init(); await state.click(); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
  });
}
test('a current category guard pause cannot be bypassed by fresh media resolution', async () => {
  const state = fixture({ child: true }); state.settings.categoryFilters = { enabled: true }; state.setCategory('allowed');
  state.root.__filtertubeCurrentWatchCategoryState = { videoId: id, pausedByGuard: true };
  state.init(); await state.click(); assert.equal(state.messages.length, 0);
});

test('a child with no configured time policy can make the same admitted native handoff', async () => {
  const state = fixture({ child: true }); await begin(state); assert.equal(state.calls.length, 1); assert.equal(state.calls[0].handedOff, true);
});
test('configured child time limits require a fresh authoritative permit before source discovery', async () => {
  const state = fixture({ child: true }); state.settings.managedTimeLimitPolicy = { schema: 'filtertube_managed_time_limit', version: 1,
    enabled: true, profileId: state.settings.activeProfileId, policyRevision: 1, policyHash: 'known' };
  state.init(); await state.click(); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
});
test('loss of a fresh child time allowance cancels a native transaction before handoff', async () => {
  const state = fixture({ child: true, deferNative: true });
  state.settings.managedTimeLimitPolicy = { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
    profileId: state.settings.activeProfileId, policyRevision: 1, policyHash: 'known' };
  let permit = Object.freeze({ decision: 'allowed', videoId: id, profileId: state.settings.activeProfileId,
    policyRevision: 1, policyHash: 'known', expiresAt: 12000 });
  state.root.FilterTubeManagedPlaybackPermit = { read: input => input.settings === state.settings && input.href === state.context.location.href ? permit : null };
  await begin(state); assert.equal(state.calls.length, 1); permit = null; state.tick(); await flush();
  assert.equal(state.calls[0].canRestore, false); assert.equal(state.calls[0].handedOff, false); assert.equal(state.original.paused, true);
  assert.equal(state.timers.size, 0);
});
for (const reason of ['direct_admission_changed', 'category_admission_changed', 'managed_route_denied', 'settings_changed']) {
  test(`${reason} cancels in-flight native preparation without restoring playback`, async () => {
    const state = fixture({ deferNative: true }); await begin(state); const transaction = state.calls[0];
    state.root.FilterTubeContentPlayback.invalidate(reason); await flush(); transaction.complete(); await flush();
    assert.equal(transaction.handedOff, false); assert.equal(transaction.canRestore, false); assert.equal(state.original.paused, true);
    assert.equal(state.timers.size, 0);
  });
}
test('replacing the native node during preparation cancels the old transaction', async () => {
  const state = fixture({ deferNative: true }); await begin(state); state.replaceNativeVideo({ duration: 180 });
  assert.equal(state.calls[0].check(), false); await flush(); assert.equal(state.calls[0].canRestore, false); assert.equal(state.timers.size, 0);
});
test('independent source refresh during an advert carries zero content position', async () => {
  const state = fixture({ deferNative: true }); state.original.duration = 15; state.original.currentTime = 9; state.playerClasses.add('ad-showing');
  await begin(state); assert.equal(state.calls[0].input.playbackIntent.nativeTimeline, 'unrelated');
  assert.equal(state.calls[0].input.playbackIntent.positionSeconds, 0); assert.equal(state.calls[0].options.isOriginalContent(), false);
  state.root.FilterTubeContentPlayback.invalidate('user_close'); await flush();
});

test('a source timeout removes discovery timers and leaves native controls untouched', async () => {
  const state = fixture(); state.init(); await state.click();
  const timeout = [...state.timers].find(([, timer]) => !timer.interval && timer.delay === 3000); assert.ok(timeout);
  state.timers.delete(timeout[0]); timeout[1].callback(); await flush();
  assert.equal(state.calls.length, 0); assert.equal(state.original.pauseCalls, 0); assert.equal(state.timers.size, 0);
});
test('Cancel before the metadata reply ignores its eventual completion', async () => {
  const state = fixture(); state.init(); await state.click(); assert.equal(state.button().textContent, 'Cancel'); await state.click();
  state.response(); await flush(); assert.equal(state.calls.length, 0); assert.equal(state.timers.size, 0); assert.equal(state.original.pauseCalls, 0);
});
test('Cancel during source extraction aborts it and cannot start a late native transaction', async () => {
  const state = fixture(); let resolve, request;
  state.setFetch((url, options) => { request = options; return new Promise(done => { resolve = done; }); });
  state.init(); await state.click(); state.response(); await flush(); assert.ok(request); assert.equal(request.signal.aborted, false);
  await state.click(); assert.equal(request.signal.aborted, true);
  resolve(new Response(JSON.stringify({ responseContext: { visitorData: 'late' } }), { headers: { 'content-type': 'application/json' } }));
  await flush(); assert.equal(state.calls.length, 0); assert.equal(state.timers.size, 0); assert.equal(state.original.pauseCalls, 0);
});
test('trusted native interaction cancels preparation while preserving the latest position', async () => {
  const state = fixture(); state.init(); await state.click(); state.interact(false);
  state.original.currentTime = 50; state.interact(true);
  state.response(); await flush(); assert.equal(state.calls.length, 0); assert.equal(state.original.currentTime, 50);
  assert.equal(state.original.pauseCalls, 0); assert.equal(state.timers.size, 0);
});
test('trusted input outside the native player does not cancel its pending source refresh', async () => {
  const state = fixture(); state.init(); await state.click(); state.interact(true, state.button());
  assert.equal(state.hasNativeInputGuard(), true); state.response(); await flush();
  assert.equal(state.calls.length, 1); assert.equal(state.calls[0].handedOff, true); assert.equal(state.hasNativeInputGuard(), false);
});

test('trusted native keyboard input cancels preparation and removes its capture guard', async () => {
  const state = fixture(); state.init(); await state.click(); state.interact(true, state.original, 'keydown');
  state.response(); await flush(); assert.equal(state.calls.length, 0); assert.equal(state.hasNativeInputGuard(), false);
  assert.equal(state.original.pauseCalls, 0); assert.equal(state.timers.size, 0);
});

test('an old metadata reply cannot satisfy a replacement source request', async () => {
  const state = fixture(); state.init(); await state.click(); const old = { ...state.messages.at(-1).payload };
  state.root.FilterTubeContentPlayback.invalidate('settings_changed'); await flush(); await state.click();
  state.emit({ type: 'FilterTube_ContentPlaybackResponse', source: 'injector', payload: { ...old, playerResponse: adaptiveResponse() } });
  await flush(); assert.equal(state.calls.length, 0); state.response(); await flush(); assert.equal(state.calls.length, 1);
});

for (const captionsEnabled of [true, false]) {
  test(`caption preferences and native catalog remain available without rebuilding VTT (enabled=${captionsEnabled})`, async () => {
    const state = fixture(); const response = { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
      captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.en', languageCode: 'en',
        baseUrl: 'https://www.youtube.com/api/timedtext?fmt=json3' }] } }, streamingData: { formats: [{ signatureCipher: 'unresolved' }] } };
    const preferences = { audioKnown: true, audioTrackCount: 1, audioTrackId: 'en.4', audioTracks: [{ id: 'en.4' }],
      captionsKnown: true, captionsEnabled, captionTrackId: '.en', captionLanguage: 'en' };
    await begin(state, { playerResponse: response, preferences }); assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].input.preferences, preferences); assert.equal(response.captions.playerCaptionsTracklistRenderer.captionTracks[0].vssId, '.en');
    noReplacementPlayer(state);
  });
}
test('an incomplete alternate-audio source catalog refuses handoff', async () => {
  const state = fixture(); await begin(state, { preferences: { audioKnown: true, captionsKnown: true, captionsEnabled: false,
    audioTrackCount: 2, audioTrackId: 'en.4', audioTracks: [{ id: 'en.4' }, { id: 'es.4' }] } });
  assert.equal(state.calls.length, 0); assert.equal(state.original.pauseCalls, 0);
});
test('complete alternate-audio identities reach native controls unchanged', async () => {
  const state = fixture(); state.setFresh(adaptiveResponse(['es.4']));
  const preferences = { audioKnown: true, captionsKnown: true, captionsEnabled: false,
    audioTrackCount: 2, audioTrackId: 'en.4', audioTracks: [{ id: 'en.4' }, { id: 'es.4' }] };
  await begin(state, { preferences }); assert.equal(state.calls.length, 1); assert.equal(state.calls[0].input.preferences, preferences);
  assert.deepEqual(Array.from(state.calls[0].input.source.audioVariants, row => row.audioTrack.id), ['en.4', 'es.4']);
});
test('fresh inaccessible sources cannot replace the current native player', async () => {
  const state = fixture(); state.setFresh({ ...adaptiveResponse(), playabilityStatus: { status: 'LOGIN_REQUIRED' } });
  await begin(state); assert.equal(state.calls.length, 0); assert.equal(state.original.pauseCalls, 0);
});
test('post-handoff playlist/autoplay stays with native guards rather than a private completion hook', async () => {
  const state = fixture(); let nextClicks = 0; const prior = state.surface.querySelector;
  state.surface.querySelector = selector => selector === 'a.ytp-next-button[href]' ? { click() { nextClicks++; } } : prior(selector);
  await begin(state); state.calls[0].options.onState({ status: 'ended', videoId: id }); await flush();
  assert.equal(nextClicks, 0); assert.equal(state.calls[0].stopped, undefined); assert.equal(state.timers.size, 0);
});

test('late watch UI mounting retries briefly and stops after mounting once', async () => {
  const state = fixture(); state.setTargetReady(false); state.init(); assert.equal(state.button(), undefined); assert.equal(state.timers.size, 1);
  state.setTargetReady(true); const [key, timer] = [...state.timers][0]; assert.equal(timer.delay, 500);
  state.timers.delete(key); timer.callback(); await flush(); assert.ok(state.button()); assert.equal(state.timers.size, 0);
  assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
});
test('missing watch UI retries are bounded and navigation clears the pending retry', () => {
  const state = fixture(); state.setTargetReady(false); state.init(); let count = 0;
  while (state.timers.size) { const [key, timer] = [...state.timers][0]; state.timers.delete(key); timer.callback(); count++; assert.ok(count <= 20); }
  assert.equal(count, 20); const other = fixture(); other.setTargetReady(false); other.init(); other.navigate(); assert.equal(other.timers.size, 0);
});
