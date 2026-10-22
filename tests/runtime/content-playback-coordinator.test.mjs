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
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  removeEventListener(name, callback) { if (this.listeners.get(name) === callback) this.listeners.delete(name); }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  append(...children) { for (const child of children) this.appendChild(child); }
  prepend(child) { child.parentElement = this; this.children.unshift(child); }
  remove() { this.isConnected = false; if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(x => x !== this); }
}
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function fixture({ child = false, decision = 'allowed', paused = false } = {}) {
  let at = 10000, serial = 0;
  const timers = new Map(), messages = [], calls = [], created = [], rootListeners = new Map(), docListeners = new Map();
  const target = new Element('section'), surface = new Element('div'), parent = new Element('div');
  parent.appendChild(surface);
  const original = { duration: 180, currentTime: 25, volume: 0.7, playbackRate: 1.25, paused,
    canPlayType: () => 'probably', pause() { this.paused = true; }, play() { this.paused = false; return Promise.resolve(); } };
  let nativeVideo = original;
  const playerClasses = new Set();
  surface.classList = { contains: name => playerClasses.has(name) };
  surface.querySelector = selector => selector === 'video.html5-main-video' ? nativeVideo : null;
  const root = { addEventListener(name, callback) { rootListeners.set(name, callback); },
    postMessage(message) { messages.push(message); }, fetch() { throw new Error('unexpected media or caption fetch'); } };
  const settings = { enabled: true, hideSponsoredCards: true, activeProfileId: child ? 'child-a' : 'parent-a',
    activeProfileKind: child ? 'child' : 'account', profileType: 'main', videoMetaMap: {} };
  root.__filtertubeDirectAccessState = { videoId: id, decision, routeTransitionPending: false, latestSettings: settings };
  const document = { documentElement: new Element('html'),
    querySelector: selector => selector.includes('video.html5-main-video') ? nativeVideo : selector.includes('#above-the-fold') ? target : null,
    getElementById: value => value === 'movie_player' ? surface : null,
    createElement(tag) { const node = new Element(tag); created.push(node); return node; },
    addEventListener(name, callback) { docListeners.set(name, callback); } };
  const timer = (callback, delay, interval) => { const key = ++serial; timers.set(key, { callback, delay, interval }); return key; };
  Object.assign(root, { setTimeout: (callback, delay) => timer(callback, delay, false), clearTimeout: key => timers.delete(key),
    setInterval: (callback, delay) => timer(callback, delay, true), clearInterval: key => timers.delete(key) });
  const context = vm.createContext({ window: root, document, currentSettings: settings,
    location: { origin: 'https://www.youtube.com', hostname: 'www.youtube.com', pathname: '/watch', search: `?v=${id}` },
    URL, URLSearchParams, crypto: webcrypto, AbortController, queueMicrotask,
    Date: class extends Date { static now() { return at; } },
    setTimeout: root.setTimeout, clearTimeout: root.clearTimeout, setInterval: root.setInterval, clearInterval: root.clearInterval,
    isFilterTubeNativeOverlayQuietMode: () => root.__filterTubeNativeOverlayCovered === true
      || root.__filterTubeNativeFullscreenActive === true
      || document.documentElement.hasAttribute('data-filtertube-native-overlay-covered')
      || document.documentElement.hasAttribute('data-filtertube-native-fullscreen'),
    enforceCurrentVideoAdmissionForRoute() { root.__filtertubeDirectAccessState.latestSettings = context.currentSettings; },
    getCategoryPolicyDecision: () => 'inactive', getLanguagePolicyDecision: () => 'inactive' });
  for (const file of ['js/content/content_playback_admission.js', 'js/shared/content_playback_source.js']) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  root.FilterTubeContentPlaybackPlayer = { create(options) {
    const record = { options, input: null, closed: false, priorPaused: original.paused }; calls.push(record);
    const controller = { async start(input) {
      record.input = input;
      assert.equal(options.validateLease(input.lease), true, 'real admission owner must validate its own opaque token');
      original.pause(); options.onState({ status: 'active' }); return { status: 'active' };
    }, stop(reason) {
      if (record.closed) return; record.closed = true;
      record.stopped = reason; record.canRestore = options.validateLease(record.input?.lease);
      if (record.canRestore) original.paused = record.priorPaused;
      options.onFallback({ reason });
    }, destroy() { record.destroyed = true; } };
    record.check = () => {
      const valid = options.validateLease(record.input?.lease);
      if (!valid) controller.stop('authorization_invalid');
      return valid;
    };
    return controller;
  } };
  vm.runInContext(fs.readFileSync('js/content/content_playback.js', 'utf8'), context, { filename: 'js/content/content_playback.js' });
  const button = () => created.find(node => node.tagName === 'button' && node.isConnected);
  const click = async (trusted = true) => { button().listeners.get('click')({ isTrusted: trusted }); await flush(); };
  const response = (overrides = {}) => {
    const request = messages.at(-1)?.payload;
    assert.ok(request, 'a source request must exist');
    const payload = { requestId: request.requestId, videoId: request.videoId,
      playerResponse: { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
        streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=1000',
          mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', width: 640, height: 360 }] } },
      preferences: { audioKnown: true, audioTrackCount: 1, audioTrackId: '', captionsKnown: true, captionsEnabled: false }, ...overrides };
    rootListeners.get('message')({ source: root, origin: context.location.origin,
      data: { type: 'FilterTube_ContentPlaybackResponse', source: 'injector', payload } });
    return payload;
  };
  return { root, context, document, settings, timers, messages, calls, created, original, surface,
    button, click, response, playerClasses, replaceNativeVideo: value => { nativeVideo = value; },
    init: () => root.FilterTubeContentPlayback.initialize(),
    tick: () => { at += 250; for (const item of [...timers.values()]) if (item.interval) item.callback(); },
    navigate: () => docListeners.get('yt-navigate-start')(),
    emit: payload => rootListeners.get('message')?.({ source: root, origin: context.location.origin, data: payload }) };
}

test('loading and initializing the actual coordinator causes no source request or media start', async () => {
  const state = fixture(); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
  state.init(); await flush();
  assert.ok(state.button()); assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
  await state.click(false); assert.equal(state.messages.length, 0);
});

for (const decision of ['pending', 'blocked']) {
  test(`a child ${decision} decision cannot even request a media source`, async () => {
    const state = fixture({ child: true, decision }); state.init(); await state.click();
    assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
  });
}

test('a supported plan uses an actual isolated lease and ignores unsolicited MAIN permission', async () => {
  const state = fixture(); state.init();
  state.emit({ type: 'FilterTube_AllowPlayback', source: 'injector', payload: { allowed: true, videoId: id } });
  assert.equal(state.calls.length, 0);
  await state.click(); assert.equal(state.messages.length, 1);
  state.response({ lease: { expiresAt: 999999 }, allowed: true }); await flush();
  assert.equal(state.calls.length, 1); assert.ok(Object.isFrozen(state.calls[0].input.lease));
  assert.equal(state.calls[0].input.lease.expiresAt, 11000);
});

for (const cause of ['navigation', 'profile change']) {
  test(`pending source completion after ${cause} cannot start and leaves no request timers`, async () => {
    const state = fixture(); state.init(); await state.click();
    if (cause === 'navigation') state.navigate();
    else {
      state.context.currentSettings = { ...state.settings, activeProfileId: 'child-b', activeProfileKind: 'child' };
      state.root.FilterTubeContentPlayback.invalidate('settings_changed');
    }
    state.response(); await flush();
    assert.equal(state.calls.length, 0);
    assert.equal(state.timers.size, 0);
  });
}

test('cipher-only, unknown audio, unknown captions and active native overlay preserve the native player', async () => {
  for (const cause of ['cipher', 'audio', 'captions', 'native-overlay']) {
    const state = fixture(); state.init();
    if (cause === 'native-overlay') state.document.documentElement.setAttribute('data-filtertube-native-overlay-covered', 'true');
    await state.click();
    if (cause === 'native-overlay') assert.equal(state.messages.length, 0);
    else {
      const payload = cause === 'cipher' ? { playerResponse: { videoDetails: { videoId: id, lengthSeconds: '180' },
        playabilityStatus: { status: 'OK' }, streamingData: { formats: [{ signatureCipher: 's=unsupported' }] } } }
        : { preferences: { audioKnown: cause !== 'audio', captionsKnown: cause !== 'captions',
          audioTrackCount: 1, captionsEnabled: false } };
      state.response(payload); await flush();
    }
    assert.equal(state.calls.length, 0, cause);
    assert.equal(state.original.paused, false, cause);
  }
});

for (const paused of [true, false]) {
  test(`deliberate user close restores native pause intent while its old lease is valid (${paused})`, async () => {
    const state = fixture({ paused }); state.init(); await state.click(); state.response(); await flush();
    await state.click();
    assert.equal(state.calls[0].stopped, 'user_close');
    assert.equal(state.calls[0].canRestore, true);
    assert.equal(state.original.paused, paused);
    assert.equal(state.timers.size, 0);
  });
}

test('revoked policy stops the owned player without restoring native playback', async () => {
  const state = fixture(); state.init(); await state.click(); state.response(); await flush();
  state.root.FilterTubeContentPlayback.invalidate('direct_admission_changed'); await flush();
  assert.equal(state.calls[0].canRestore, false);
  assert.equal(state.original.paused, true);
  assert.equal(state.timers.size, 0);
});

test('configured child time policy remains on the native player until fresh time authority exists', async () => {
  const state = fixture({ child: true });
  state.settings.managedTimeLimitPolicy = { schema: 'filtertube_managed_time_limit', version: 1, enabled: true,
    profileId: state.settings.activeProfileId, policyRevision: 1, policyHash: 'known' };
  state.init(); await state.click();
  assert.equal(state.messages.length, 0); assert.equal(state.calls.length, 0);
});

test('a child with no configured time policy can use the same explicitly admitted content path', async () => {
  const state = fixture({ child: true }); state.init(); await state.click();
  assert.equal(state.messages.length, 1); state.response(); await flush();
  assert.equal(state.calls.length, 1);
});

test('a source timeout cleans preparation and leaves native playback untouched', async () => {
  const state = fixture(); state.init(); await state.click();
  const timeout = [...state.timers].find(([, timer]) => !timer.interval && timer.delay === 3000);
  assert.ok(timeout); state.timers.delete(timeout[0]); timeout[1].callback(); await flush();
  assert.equal(state.calls.length, 0); assert.equal(state.original.paused, false); assert.equal(state.timers.size, 0);
});

test('an old reply cannot satisfy a replacement source request', async () => {
  const state = fixture(); state.init(); await state.click();
  const old = { ...state.messages.at(-1).payload };
  state.root.FilterTubeContentPlayback.invalidate('settings_changed'); await flush();
  await state.click(); assert.equal(state.messages.length, 2);
  state.emit({ type: 'FilterTube_ContentPlaybackResponse', source: 'injector',
    payload: { ...old, playerResponse: {}, preferences: {} } }); await flush();
  assert.equal(state.calls.length, 0);
  state.response(); await flush(); assert.equal(state.calls.length, 1);
});

test('navigation aborts pending caption preparation and a late completion cannot start media', async () => {
  const state = fixture(); let resolve; let options;
  state.root.FilterTubeContentPlaybackCaptions = { prepare(payload, value) {
    options = value; return new Promise(done => { resolve = done; });
  } };
  state.init(); await state.click();
  state.response({ playerResponse: { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
    captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.en', languageCode: 'en',
      baseUrl: 'https://www.youtube.com/api/timedtext?fmt=json3' }] } },
    streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=1000',
      mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', width: 640, height: 360 }] } },
    preferences: { audioKnown: true, audioTrackCount: 1, captionsKnown: true, captionsEnabled: true,
      captionLanguage: 'en', captionTrackId: '.en' } });
  await flush(); assert.ok(options); assert.equal(options.signal.aborted, false);
  state.navigate(); assert.equal(options.signal.aborted, true); assert.equal(options.isCurrent(), false);
  resolve({ supported: false }); await flush();
  assert.equal(state.calls.length, 0); assert.equal(state.timers.size, 0);
});

for (const loss of ['ad-showing', 'ad-interrupting', 'changed duration', 'unknown duration', 'replaced native node']) {
  test(`post-start native ownership loss fails the media validator: ${loss}`, async () => {
    const state = fixture(); state.init(); await state.click(); state.response(); await flush();
    assert.equal(state.calls.length, 1);
    if (loss.startsWith('ad-')) state.playerClasses.add(loss);
    if (loss === 'changed duration') state.original.duration = 210;
    if (loss === 'unknown duration') state.original.duration = NaN;
    if (loss === 'replaced native node') state.replaceNativeVideo({ duration: 180 });
    assert.equal(state.calls[0].check(), false);
    await flush();
    assert.equal(state.calls[0].canRestore, false, 'lost native ownership cannot restart or seek the original');
    assert.equal(state.original.paused, true);
    assert.equal(state.original.currentTime, 25);
    assert.equal(state.timers.size, 0);
  });
}

function captionReply(preferences = {}) {
  return { playerResponse: { videoDetails: { videoId: id, lengthSeconds: '180' }, playabilityStatus: { status: 'OK' },
    captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.en', languageCode: 'en',
      baseUrl: 'https://www.youtube.com/api/timedtext?fmt=json3' }] } },
    streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=1000',
      mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"', width: 640, height: 360 }] } },
    preferences: { audioKnown: true, audioTrackCount: 1, captionsKnown: true, captionsEnabled: true,
      captionLanguage: 'en', captionTrackId: '.en', ...preferences } };
}
function preparedCaptions(state, duplicate = false) {
  state.root.FilterTubeContentPlaybackCaptions = { async prepare() {
    const row = { vssId: '.en', languageCode: 'en', baseUrl: 'https://www.youtube.com/api/timedtext?fmt=vtt' };
    const track = { id: '.en', languageCode: 'en', kind: 'captions', vttText: 'WEBVTT\n\n' };
    return { supported: true,
      captions: { playerCaptionsTracklistRenderer: { captionTracks: duplicate ? [row, { ...row }] : [row] } },
      tracks: duplicate ? [track, { ...track }] : [track] };
  } };
}

test('known enabled captions pass the exact selected ID and language through the actual planner', async () => {
  const state = fixture(); preparedCaptions(state); state.init(); await state.click();
  state.response(captionReply()); await flush();
  assert.equal(state.calls.length, 1);
  const features = state.calls[0].input.featurePlan;
  assert.equal(features.selectedCaptionId, '.en'); assert.equal(features.selectedCaptionLanguage, 'en');
  assert.equal(features.captionTracks.length, 1); assert.equal(features.captionTracks[0].id, '.en');
});

for (const [selection, preferences, duplicate] of [
  ['missing ID', { captionTrackId: '' }, false],
  ['wrong ID', { captionTrackId: '.missing' }, false],
  ['wrong language', { captionLanguage: 'fr' }, false],
  ['missing language', { captionLanguage: '' }, false],
  ['ambiguous ID and language', {}, true]
]) {
  test(`enabled captions cannot silently change selection: ${selection}`, async () => {
    const state = fixture(); preparedCaptions(state, duplicate); state.init(); await state.click();
    state.response(captionReply(preferences)); await flush();
    assert.equal(state.calls.length, 0); assert.equal(state.original.paused, false);
    assert.equal(state.original.currentTime, 25); assert.equal(state.timers.size, 0);
  });
}

test('captions that were off remain off while prepared tracks stay available', async () => {
  const state = fixture(); preparedCaptions(state); state.init(); await state.click();
  state.response(captionReply({ captionsEnabled: false })); await flush();
  assert.equal(state.calls.length, 1);
  assert.equal(state.calls[0].input.featurePlan.selectedCaptionId, '');
  assert.equal(state.calls[0].input.featurePlan.selectedCaptionLanguage, '');
  assert.equal(state.calls[0].input.featurePlan.captionTracks.length, 1);
});

test('Cancel during the pending source request cleans timers and ignores its eventual reply', async () => {
  const state = fixture(); state.init(); await state.click();
  assert.equal(state.button().textContent, 'Cancel'); assert.equal(state.button().disabled, false);
  await state.click();
  assert.equal(state.timers.size, 0); assert.equal(state.original.paused, false);
  state.response(); await flush(); assert.equal(state.calls.length, 0);
});

test('Cancel during caption preparation aborts it and cannot activate after completion', async () => {
  const state = fixture(); let options, finish;
  state.root.FilterTubeContentPlaybackCaptions = { prepare(payload, value) {
    options = value; return new Promise(resolve => { finish = resolve; });
  } };
  state.init(); await state.click(); state.response(captionReply()); await flush();
  assert.ok(options); await state.click();
  assert.equal(options.signal.aborted, true); assert.equal(state.timers.size, 0);
  finish({ supported: false }); await flush();
  assert.equal(state.calls.length, 0); assert.equal(state.original.paused, false);
});

test('trusted native control interaction during preparation cancels without restoring an obsolete native state', async () => {
  const state = fixture(); state.init(); await state.click();
  state.surface.listeners.get('pointerdown')({ isTrusted: false });
  assert.equal(state.timers.size, 2);
  state.original.currentTime = 50;
  state.surface.listeners.get('pointerdown')({ isTrusted: true });
  assert.equal(state.timers.size, 0); assert.equal(state.surface.listeners.has('pointerdown'), false);
  state.response(); await flush();
  assert.equal(state.calls.length, 0); assert.equal(state.original.currentTime, 50); assert.equal(state.original.paused, false);
});
