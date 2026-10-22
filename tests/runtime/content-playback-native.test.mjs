import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const code = fs.readFileSync('js/content/content_playback_native.js', 'utf8');
const videoId = 'content0001';
const expectedPreferences = { audioKnown: true, captionsKnown: true, audioTrackId: 'en.0', audioTrackCount: 1,
  audioTracks: [{ id: 'en.0' }], captionsEnabled: false, captionTrackId: '', captionLanguage: '' };

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback);
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event = {}) { for (const callback of [...(this.listeners.get(type) || [])]) callback({ type, ...event }); }
  count() { return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0); }
}

function fixture({ paused = false, rejectPlay = false, leaseLifetime = 30000, onState, allowAutomaticStart } = {}) {
  let clock = 10000, leaseExpiry = clock + leaseLifetime, valid = true, content = true, nextTimer = 0, nextNonce = 0;
  const timers = new Map(), posts = [], states = [], fallbacks = [];
  let reevaluations = 0;
  const document = new Events(), video = new Events(), surface = new Events();
  Object.assign(video, { tagName: 'VIDEO', isConnected: true, currentSrc: 'blob:old-native', src: 'blob:old-native',
    readyState: 4, duration: 120, currentTime: 30, volume: 0.4, muted: false, playbackRate: 1.25, paused,
    pauseCalls: 0, playCalls: 0 });
  video.pause = () => { video.pauseCalls++; video.paused = true; };
  video.play = () => {
    video.playCalls++;
    if (rejectPlay) return Promise.reject(new Error('native play refused'));
    video.paused = false; document.emit('play', { target: video });
    if (!video.paused) document.emit('playing', { target: video });
    return Promise.resolve();
  };
  let currentVideo = video;
  Object.assign(surface, { isConnected: true, ownerDocument: document,
    querySelector: () => currentVideo, contains: target => target === video || target === currentVideo });
  document.getElementById = id => id === 'movie_player' ? surface : null;
  document.createElement = () => { throw new Error('native transactions must not create media or overlay DOM'); };
  const timer = (callback, delay, interval = false) => {
    const id = ++nextTimer; timers.set(id, { callback, at: clock + delay, delay, interval }); return id;
  };
  const window = new Events();
  Object.assign(window, { location: { hostname: 'www.youtube.com', pathname: '/watch', search: `?v=${videoId}`, origin: 'https://www.youtube.com' },
    navigator: { userActivation: { isActive: true } },
    crypto: { getRandomValues(bytes) { bytes.fill(++nextNonce); return bytes; } },
    postMessage(message, origin) { assert.equal(origin, window.location.origin); posts.push(message); },
    setTimeout: (cb, delay) => timer(cb, delay), clearTimeout: id => timers.delete(id),
    setInterval: (cb, delay) => timer(cb, delay, true), clearInterval: id => timers.delete(id) });
  class ClockDate extends Date { static now() { return clock; } }
  vm.runInContext(code, vm.createContext({ window, Date: ClockDate, URLSearchParams, Uint8Array }));
  const api = window.FilterTubeContentPlaybackNative;
  const controllerOptions = { originalVideo: video, originalSurface: surface,
    validateLease: () => valid, isOriginalContent: () => content, now: () => clock,
    allowAutomaticStart,
    enforceNativeAdmission: () => { reevaluations++; },
    onState: value => { states.push(value); onState?.(value); }, onFallback: value => fallbacks.push(value) };
  const controller = api.create(controllerOptions);
  const lease = Object.freeze({ get expiresAt() { return leaseExpiry; } });
  const input = () => ({ videoId, lease, source: { kind: 'adaptive_mp4', expiresAt: 70000 },
    featurePlan: { allowed: true, captionsPreserved: true, audioPreserved: true },
    playbackIntent: { videoId, nativeTimeline: 'content', durationSeconds: 120, positionSeconds: 30,
      volume: 0.4, muted: false, rate: 1.25, paused },
    preferences: { ...expectedPreferences }, actionToken: api.captureTrustedAction({ isTrusted: true }, videoId) });
  const last = type => posts.filter(message => message.type === type).at(-1);
  const reply = (type, payload, event = {}) => window.emit('message', { source: window, origin: window.location.origin,
    data: { type, source: 'injector', payload }, ...event });
  const ack = (applied = true, reason = '') => {
    const request = last('FilterTube_ApplyNativeContentSource').payload;
    reply('FilterTube_NativeContentSourceResult', { requestId: request.requestId, videoId, applied, reason });
  };
  const cancelAck = () => {
    const request = last('FilterTube_CancelNativeContentSource').payload;
    reply('FilterTube_NativeContentSourceResult', { requestId: request.requestId, videoId: request.videoId, applied: false, reason: 'cancelled' });
  };
  const ready = () => {
    video.currentSrc = 'blob:new-native'; document.emit('loadstart', { target: video });
    Object.assign(video, { readyState: 4, duration: 120 }); document.emit('loadedmetadata', { target: video });
  };
  const stateReply = (preferences = expectedPreferences, matched = true) => {
    const request = last('FilterTube_ReadNativeContentState').payload;
    reply('FilterTube_NativeContentState', { requestId: request.requestId, videoId, videoIdMatched: matched, preferences });
  };
  const advance = ms => {
    const end = clock + ms;
    for (let iteration = 0; iteration < 10000; iteration++) {
      const due = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) { clock = end; return; }
      const [id, value] = due; clock = value.at;
      if (value.interval) value.at += value.delay; else timers.delete(id);
      value.callback();
    }
    throw new Error('fixture timers did not settle');
  };
  const flush = () => new Promise(resolve => setImmediate(resolve));
  return { api, controller, controllerOptions, window, document, surface, video, timers, posts, states, fallbacks, input,
    last, reply, ack, cancelAck, ready, stateReply, advance, flush,
    invalidate() { valid = false; }, renew(ms) { leaseExpiry = clock + ms; },
    setContent(value) { content = value; }, setValidator(value) { valid = value; },
    replaceVideo() { currentVideo = { tagName: 'VIDEO', isConnected: true, pauseCalls: 0,
      pause() { this.pauseCalls++; } }; return currentVideo; },
    reevaluations: () => reevaluations };
}

test('native transaction creation is inert and never creates another media element or player UI', () => {
  const state = fixture(); assert.equal(state.posts.length, 0); assert.equal(state.timers.size, 0);
  assert.equal(state.document.count(), 0); assert.equal(state.window.count(), 0); assert.equal(state.video.pauseCalls, 0);
});

test('a successful paused source transaction hands the same native player back without retaining guards', async () => {
  const state = fixture({ paused: true }); const input = state.input(); delete input.featurePlan;
  const pending = state.controller.start(input);
  state.ready(); state.ack(); state.stateReply(); const result = await pending;
  assert.equal(result.status, 'active'); assert.equal(result.handedOff, true); assert.equal(result.paused, true);
  assert.deepEqual(JSON.parse(JSON.stringify(state.last('FilterTube_ApplyNativeContentSource').payload.preferences.audioTracks)), [{ id: 'en.0' }]);
  assert.equal(state.video.playCalls, 0); assert.equal(state.document.count(), 0); assert.equal(state.window.count(), 0);
  assert.equal(state.timers.size, 0); const pauses = state.video.pauseCalls;
  await state.controller.stop('closed'); await state.controller.destroy(); await state.video.play();
  assert.equal(state.video.pauseCalls, pauses); assert.equal(state.video.paused, false);
  assert.equal(state.last('FilterTube_CancelNativeContentSource'), undefined);
});

test('fresh source metadata, matching features and a renewed lease allow exactly one native resume', async () => {
  const state = fixture({ leaseLifetime: 1000 }); const input = state.input();
  const pending = state.controller.start(input); state.advance(500); state.renew(3000);
  state.ready(); state.ack(); state.stateReply(); const result = await pending;
  assert.equal(result.status, 'active'); assert.equal(state.video.playCalls, 1); assert.equal(state.video.paused, false);
  assert.equal(state.video.currentTime, 30); assert.equal(state.video.volume, input.playbackIntent.volume);
  assert.equal(state.document.count(), 0); assert.equal(state.reevaluations(), 0);
});

test('unexpected native play is paused before acknowledgment and does not create a second player', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  await state.video.play(); assert.equal(state.video.paused, true); assert.equal(state.video.playCalls, 1);
  state.ready(); state.ack(); state.stateReply(); await pending;
  assert.equal(state.video.playCalls, 2); assert.equal(state.video.paused, false); assert.equal(state.document.count(), 0);
});

test('the old same-video readyState and duration cannot count as proof of a fresh source', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.ack();
  assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined);
  state.advance(12000); assert.ok(state.last('FilterTube_CancelNativeContentSource')); state.cancelAck();
  assert.equal((await pending).reason, 'native_transaction_timeout'); assert.equal(state.video.playCalls, 0);
  assert.equal(state.document.count(), 0);
});

test('a matching ready event without MAIN acknowledgment never starts playback', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.ready();
  assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined); assert.equal(state.video.playCalls, 0);
  state.controller.stop('user_close'); state.cancelAck(); assert.equal((await pending).reason, 'user_close');
});

test('wrong origin, sender, request ID and video acknowledgments cannot authorize the transaction', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.ready();
  const payload = { ...state.last('FilterTube_ApplyNativeContentSource').payload, applied: true };
  state.reply('FilterTube_NativeContentSourceResult', payload, { origin: 'https://example.invalid' });
  state.reply('FilterTube_NativeContentSourceResult', payload, { source: {} });
  state.reply('FilterTube_NativeContentSourceResult', { ...payload, requestId: 'not-the-request' });
  state.reply('FilterTube_NativeContentSourceResult', { ...payload, videoId: 'different01' });
  assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined); assert.equal(state.video.playCalls, 0);
  state.ack(); state.stateReply(); assert.equal((await pending).status, 'active');
});

test('pending lease revocation pauses, cancels and waits for cancellation acknowledgment before removing guards', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.invalidate(); state.advance(100);
  assert.equal(state.video.paused, true); assert.ok(state.last('FilterTube_CancelNativeContentSource'));
  assert.ok(state.document.count() > 0); state.ack(); assert.ok(state.document.count() > 0, 'late apply acknowledgment cannot beat cancellation');
  state.cancelAck(); assert.equal((await pending).reason, 'admission_changed'); assert.equal(state.document.count(), 0);
  assert.equal(state.window.count(), 0); assert.equal(state.timers.size, 0); assert.ok(state.reevaluations() > 0);
});

test('native play while a revoked transaction is cancelling is paused synchronously before the next heartbeat', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.invalidate(); state.advance(100);
  const pauses = state.video.pauseCalls;
  await state.video.play();
  assert.equal(state.video.paused, true); assert.equal(state.video.pauseCalls, pauses + 1);
  state.cancelAck(); assert.equal((await pending).reason, 'admission_changed');
  assert.equal(state.document.count(), 0); assert.equal(state.timers.size, 0);
});

test('an unacknowledged cancellation has bounded cleanup and hands back to current native policy enforcement', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.controller.stop('user_close');
  await state.video.play(); assert.equal(state.video.paused, true);
  state.advance(2000); const result = await pending;
  assert.equal(result.reason, 'ownership_unconfirmed'); assert.equal(result.cause, 'user_close');
  assert.equal(state.document.count(), 0); assert.equal(state.window.count(), 0); assert.equal(state.timers.size, 0);
  const pauses = state.video.pauseCalls; await state.video.play(); assert.equal(state.video.pauseCalls, pauses);
  assert.ok(state.reevaluations() >= 2, 'the existing current-profile native guard receives ownership');
});

test('a route change cannot let an old transaction pause or resume the reused native node on the new route', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.window.location.search = '?v=different01'; const pauses = state.video.pauseCalls;
  state.controller.stop('navigation'); await state.video.play(); assert.equal(state.video.pauseCalls, pauses);
  state.cancelAck(); assert.equal((await pending).reason, 'navigation'); assert.equal(state.document.count(), 0);
});

test('a replacement video node is paused and refused instead of inheriting the captured node authorization', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); const replacement = state.replaceVideo();
  state.document.emit('play', { target: replacement }); assert.equal(replacement.pauseCalls, 1);
  state.cancelAck(); assert.equal((await pending).reason, 'native_node_replaced'); assert.equal(state.video.playCalls, 0);
});

test('wrong duration or unknown content identity cannot resume native playback', async () => {
  for (const kind of ['duration', 'identity']) {
    const state = fixture(); const pending = state.controller.start(state.input()); state.ready();
    if (kind === 'duration') state.video.duration = 40; else state.setContent(false);
    state.ack(); assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined);
    state.controller.stop('user_close'); state.cancelAck(); await pending; assert.equal(state.video.playCalls, 0);
  }
});

test('selected audio and exact manual or automatic captions must survive the native commit', async () => {
  for (const changed of [
    { ...expectedPreferences, audioTrackId: 'es.0' },
    { ...expectedPreferences, captionsEnabled: true, captionTrackId: '.en', captionLanguage: 'en' }
  ]) {
    const state = fixture(); const pending = state.controller.start(state.input()); state.ready(); state.ack(); state.stateReply(changed);
    await state.flush(); state.cancelAck(); assert.equal((await pending).reason, 'native_features_unconfirmed'); assert.equal(state.video.playCalls, 0);
  }
  const state = fixture(); const input = state.input();
  input.preferences = { ...expectedPreferences, captionsEnabled: true, captionTrackId: '.en', captionLanguage: 'en' };
  const pending = state.controller.start(input); state.ready(); state.ack();
  state.stateReply({ ...input.preferences, captionTrackId: 'a.en' }); await state.flush(); state.cancelAck();
  assert.equal((await pending).reason, 'native_features_unconfirmed'); assert.equal(state.video.playCalls, 0);
});

test('state replies with a stale nonce cannot bypass feature verification or the bounded read deadline', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.ready(); state.ack();
  const request = state.last('FilterTube_ReadNativeContentState').payload;
  state.reply('FilterTube_NativeContentState', { requestId: request.requestId + 'wrong', videoId, videoIdMatched: true, preferences: expectedPreferences });
  state.advance(2000); await state.flush(); state.cancelAck();
  assert.equal((await pending).reason, 'native_features_unconfirmed'); assert.equal(state.video.playCalls, 0);
});

test('resume rejection leaves native playback paused and never retries autoplay', async () => {
  const state = fixture({ rejectPlay: true }); const pending = state.controller.start(state.input());
  state.ready(); state.ack(); state.stateReply(); await state.flush(); state.cancelAck();
  assert.equal((await pending).reason, 'native_resume_failed'); assert.equal(state.video.playCalls, 1); assert.equal(state.video.paused, true);
  state.advance(10000); assert.equal(state.video.playCalls, 1); assert.equal(state.document.count(), 0);
});

test('a refusal before native mutation leaves the original playback usable and performs no source rollback', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.ack(false, 'preferences_changed');
  assert.equal((await pending).reason, 'preferences_changed'); assert.equal(state.video.pauseCalls, 0); assert.equal(state.video.paused, false);
  assert.equal(state.last('FilterTube_CancelNativeContentSource'), undefined); assert.equal(state.document.count(), 0);
});

test('trusted native action tokens survive resolution but reject forged, stale, wrong-video and reused values', async () => {
  for (const kind of ['forged', 'stale', 'wrong-video', 'reused']) {
    const state = fixture({ leaseLifetime: 60000 }); const input = state.input();
    if (kind === 'forged') input.actionToken = {};
    if (kind === 'stale') state.advance(30000);
    if (kind === 'wrong-video') input.actionToken = state.api.captureTrustedAction({ isTrusted: true }, 'different01');
    if (kind === 'reused') {
      const pending = state.controller.start(input); state.ack(false, 'preferences_changed'); await pending;
    }
    assert.equal((await state.controller.start(input)).reason, 'user_gesture_required');
  }
  const state = fixture(); const input = state.input(); state.window.navigator.userActivation.isActive = false;
  state.advance(5000); const pending = state.controller.start(input); state.ready(); state.ack(); state.stateReply();
  assert.equal((await pending).status, 'active');
});

test('invalid input and asynchronous authority cannot mutate the native player', async () => {
  for (const change of [
    input => { input.playbackIntent.videoId = 'different01'; }, input => { input.source.kind = 'progressive'; },
    input => { input.preferences.audioTracks = []; }, input => { input.preferences.captionsKnown = false; }
  ]) {
    const state = fixture(); const input = state.input(); change(input);
    assert.equal((await state.controller.start(input)).status, 'fallback'); assert.equal(state.posts.length, 0); assert.equal(state.video.pauseCalls, 0);
  }
  const state = fixture(); state.setValidator(Promise.resolve(true));
  assert.equal((await state.controller.start(state.input())).reason, 'authorization_invalid'); assert.equal(state.posts.length, 0);
});

test('destroying a pending transaction retains provisional safety only until its cancellation settles', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.controller.destroy();
  assert.ok(state.document.count() > 0); state.cancelAck(); assert.equal((await pending).reason, 'destroyed');
  assert.equal(state.document.count(), 0); assert.equal(state.window.count(), 0); assert.equal(state.timers.size, 0);
  assert.equal((await state.controller.start(state.input())).reason, 'destroyed');
});

test('available audio programs cannot disappear or change language while the selected program stays the same', async () => {
  const expected = { ...expectedPreferences, audioTrackCount: 2, audioTracks: [{ id: 'en.0' }, { id: 'es.0' }] };
  for (const actual of [expectedPreferences, { ...expected, audioTracks: [{ id: 'en.0' }, { id: 'fr.0' }] }]) {
    const state = fixture(); const input = state.input(); input.preferences = expected;
    const pending = state.controller.start(input); state.ready(); state.ack(); state.stateReply(actual); await state.flush();
    state.cancelAck(); assert.equal((await pending).reason, 'native_features_unconfirmed'); assert.equal(state.video.playCalls, 0);
  }
  const state = fixture(); const input = state.input(); input.preferences = expected;
  const pending = state.controller.start(input); state.ready(); state.ack();
  state.stateReply({ ...expected, audioTracks: [{ id: 'es.0' }, { id: 'en.0' }] });
  assert.equal((await pending).status, 'active', 'catalog ordering may change while exact programs and selection remain');
});

test('a known und single-program baseline with no offered audio tracks must retain that exact catalog', async () => {
  const expected = { ...expectedPreferences, audioTrackId: 'und', audioTrackCount: 0, audioTracks: [] };
  for (const match of [true, false]) {
    const state = fixture(); const input = state.input(); input.preferences = expected;
    const pending = state.controller.start(input); state.ready(); state.ack();
    state.stateReply(match ? expected : { ...expected, audioTrackCount: 1, audioTracks: [{ id: 'und' }] });
    if (match) assert.equal((await pending).status, 'active');
    else { await state.flush(); state.cancelAck(); assert.equal((await pending).reason, 'native_features_unconfirmed'); }
  }
});

test('a second controller cannot start while the same native video has a pending or cancelling owner', async () => {
  const state = fixture(), second = state.api.create(state.controllerOptions);
  const pending = state.controller.start(state.input()); const firstApply = state.last('FilterTube_ApplyNativeContentSource');
  assert.equal((await second.start(state.input())).reason, 'transaction_in_progress');
  state.controller.stop('user_close');
  const staleCancel = [...state.timers.values()].find(timer => !timer.interval && timer.delay === 2000).callback;
  assert.equal((await second.start(state.input())).reason, 'transaction_in_progress');
  assert.equal(state.posts.filter(value => value.type === 'FilterTube_ApplyNativeContentSource').length, 1);
  state.cancelAck(); await pending;
  const replacement = second.start(state.input()); const secondApply = state.last('FilterTube_ApplyNativeContentSource');
  assert.notEqual(firstApply.payload.requestId, secondApply.payload.requestId);
  staleCancel();
  const third = state.api.create(state.controllerOptions);
  assert.equal((await third.start(state.input())).reason, 'transaction_in_progress', 'old cleanup cannot remove a newer owner');
  state.reply('FilterTube_NativeContentSourceResult', { requestId: firstApply.payload.requestId, videoId, applied: true });
  assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined);
  state.ready(); state.ack(); state.stateReply(); assert.equal((await replacement).status, 'active');
  const pauses = state.video.pauseCalls; staleCancel(); await state.video.play(); assert.equal(state.video.pauseCalls, pauses);
});

test('an invalid attempt never claims ownership of an otherwise usable native video', async () => {
  const state = fixture(); state.invalidate();
  assert.equal((await state.controller.start(state.input())).reason, 'authorization_invalid');
  state.setValidator(true); const second = state.api.create(state.controllerOptions);
  const pending = second.start(state.input()); state.ready(); state.ack(); state.stateReply();
  assert.equal((await pending).status, 'active');
});

test('apply messages carry a fresh bounded commit deadline and late acknowledgment cannot revive a revoked lease', async () => {
  const state = fixture({ leaseLifetime: 1000 }); const input = state.input(); state.advance(500);
  const pending = state.controller.start(input); const payload = state.last('FilterTube_ApplyNativeContentSource').payload;
  assert.equal(payload.issuedAt, 10500); assert.equal(payload.commitDeadline, 12500);
  assert.equal(payload.commitDeadline - payload.issuedAt, 2000);
  state.advance(2500); state.ready(); state.ack();
  assert.equal(state.last('FilterTube_ReadNativeContentState'), undefined); state.cancelAck();
  assert.equal((await pending).status, 'fallback'); assert.equal(state.video.playCalls, 0);
});

test('cancellation bridge failure still has bounded guard cleanup and current native admission handback', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.window.postMessage = () => { throw new Error('bridge disconnected'); };
  state.controller.stop('user_close'); state.advance(2000);
  assert.equal((await pending).reason, 'ownership_unconfirmed'); assert.equal(state.document.count(), 0);
  assert.equal(state.timers.size, 0); assert.ok(state.reevaluations() > 0);
});

test('synchronous policy revocation during the staging notification prevents an apply message', async () => {
  let state;
  state = fixture({ onState: value => { if (value.status === 'staging') state.invalidate(); } });
  const pending = state.controller.start(state.input());
  assert.equal(state.last('FilterTube_ApplyNativeContentSource'), undefined);
  state.cancelAck(); assert.equal((await pending).reason, 'admission_changed'); assert.equal(state.video.playCalls, 0);
});

function automaticInput(state) {
  const input = state.input(); input.mode = 'automatic'; delete input.actionToken; return input;
}

test('an explicitly enabled isolated automatic transaction needs no forged gesture and preserves paused intent', async () => {
  let expectedLease;
  const state = fixture({ paused: true, allowAutomaticStart: context => {
    assert.equal(context.videoId, videoId); assert.equal(context.lease, expectedLease); return true;
  } });
  const input = automaticInput(state); expectedLease = input.lease;
  state.window.navigator.userActivation.isActive = false;
  const pending = state.controller.start(input); state.ready(); state.ack(); state.stateReply();
  assert.equal((await pending).status, 'active'); assert.equal(state.video.paused, true); assert.equal(state.video.playCalls, 0);
  assert.equal(state.document.count(), 0); assert.equal(state.timers.size, 0);
});

test('automatic mode requires a synchronous strict-true isolated callback regardless of page or source flags', async () => {
  for (const callback of [undefined, true, () => false, () => 1, () => Promise.resolve(true), () => { throw new Error('unavailable'); }]) {
    const state = fixture({ allowAutomaticStart: callback }); const input = automaticInput(state);
    input.source.allowAutomaticStart = true; input.preferences.automatic = true; input.actionToken = {};
    assert.equal((await state.controller.start(input)).reason, 'automatic_start_disabled');
    assert.equal(state.posts.length, 0); assert.equal(state.document.count(), 0); assert.equal(state.video.pauseCalls, 0);
  }
});

test('an enabled automatic callback cannot replace current profile admission or detached-route checks', async () => {
  for (const failure of ['lease', 'route', 'detached']) {
    const state = fixture({ allowAutomaticStart: () => true }); const input = automaticInput(state);
    if (failure === 'lease') state.invalidate();
    if (failure === 'route') state.window.location.search = '?v=different01';
    if (failure === 'detached') state.video.isConnected = false;
    assert.equal((await state.controller.start(input)).reason, 'authorization_invalid');
    assert.equal(state.posts.length, 0); assert.equal(state.video.playCalls, 0);
  }
});

test('turning the isolated automatic setting off during staging prevents the apply message', async () => {
  let enabled = true;
  const state = fixture({ allowAutomaticStart: () => enabled,
    onState: value => { if (value.status === 'staging') enabled = false; } });
  const pending = state.controller.start(automaticInput(state));
  assert.equal(state.last('FilterTube_ApplyNativeContentSource'), undefined);
  state.cancelAck(); assert.equal((await pending).reason, 'admission_changed'); assert.equal(state.video.playCalls, 0);
});

test('turning automatic mode off after source readiness cannot resume playback from a late feature reply', async () => {
  let enabled = true;
  const state = fixture({ allowAutomaticStart: () => enabled }); const pending = state.controller.start(automaticInput(state));
  state.ready(); state.ack(); enabled = false; state.stateReply(); await state.flush();
  state.cancelAck(); assert.equal((await pending).reason, 'admission_changed'); assert.equal(state.video.playCalls, 0);
  assert.equal(state.video.paused, true); assert.equal(state.document.count(), 0);
});

test('automatic resume respects browser autoplay refusal without changing mute state or retrying playback', async () => {
  const state = fixture({ rejectPlay: true, allowAutomaticStart: () => true });
  state.window.navigator.userActivation.isActive = false;
  const pending = state.controller.start(automaticInput(state)); state.ready(); state.ack(); state.stateReply();
  await state.flush(); state.cancelAck(); assert.equal((await pending).reason, 'native_resume_failed');
  assert.equal(state.video.playCalls, 1); assert.equal(state.video.muted, false); assert.equal(state.video.paused, true);
  state.advance(10000); assert.equal(state.video.playCalls, 1);
});

test('automatic permission revoked synchronously by native play is paused before ownership can be handed off', async () => {
  let enabled = true;
  const state = fixture({ allowAutomaticStart: () => enabled });
  const play = state.video.play; state.video.play = () => { enabled = false; return play(); };
  const pending = state.controller.start(automaticInput(state)); state.ready(); state.ack(); state.stateReply();
  await state.flush(); assert.equal(state.video.paused, true); state.cancelAck();
  assert.equal((await pending).reason, 'admission_changed');
  assert.equal(state.states.some(value => value.status === 'active'), false); assert.equal(state.video.playCalls, 1);
});

test('manual default and explicit manual mode retain trusted-action requirements even when automatic mode is enabled', async () => {
  for (const mode of [undefined, 'manual']) {
    const state = fixture({ allowAutomaticStart: () => true }); const input = state.input();
    input.mode = mode; delete input.actionToken;
    assert.equal((await state.controller.start(input)).reason, 'user_gesture_required'); assert.equal(state.posts.length, 0);
  }
  const state = fixture({ allowAutomaticStart: () => false }); const input = state.input(); input.mode = 'manual';
  const pending = state.controller.start(input); state.ready(); state.ack(); state.stateReply();
  assert.equal((await pending).status, 'active');
});

test('unsupported mode strings and page messages cannot enable native automatic startup', async () => {
  const state = fixture({ allowAutomaticStart: () => true }); const input = automaticInput(state); input.mode = 'page-authorized';
  assert.equal((await state.controller.start(input)).reason, 'invalid_start_mode');
  state.reply('FilterTube_NativeContentSourceResult', { requestId: 'page-request', videoId, applied: true, mode: 'automatic' });
  assert.equal(state.posts.length, 0); assert.equal(state.video.playCalls, 0); assert.equal(state.document.count(), 0);
});

test('successful automatic handoff leaves later native controls, source changes and profile ownership untouched', async () => {
  let automaticEnabled = true;
  const state = fixture({ allowAutomaticStart: () => automaticEnabled });
  const input = state.input(); input.mode = 'automatic'; delete input.actionToken;
  const pending = state.controller.start(input);
  state.ready(); state.ack(); state.stateReply();
  assert.equal((await pending).handedOff, true);
  const posts = state.posts.length;
  const pauses = state.video.pauseCalls;
  const plays = state.video.playCalls;
  const states = state.states.length;
  automaticEnabled = false; state.invalidate();
  Object.assign(state.video, { volume: .15, muted: true, playbackRate: 1.75,
    currentTime: 81, paused: false, currentSrc: 'blob:later-native-source', duration: 150 });
  for (const type of ['loadstart', 'emptied', 'error', 'loadedmetadata', 'playing', 'durationchange']) {
    state.document.emit(type, { target: state.video });
  }
  const old = state.last('FilterTube_ApplyNativeContentSource').payload;
  state.reply('FilterTube_NativeContentSourceResult', { requestId: old.requestId, videoId, applied: false, reason: 'cancelled' });
  state.advance(120000); await state.flush();
  await state.controller.stop('settings_changed'); await state.controller.destroy();
  assert.equal(state.posts.length, posts);
  assert.equal(state.video.pauseCalls, pauses); assert.equal(state.video.playCalls, plays);
  assert.equal(state.video.volume, .15); assert.equal(state.video.muted, true); assert.equal(state.video.playbackRate, 1.75);
  assert.equal(state.video.currentTime, 81); assert.equal(state.video.paused, false);
  assert.equal(state.states.length, states); assert.equal(state.reevaluations(), 0);
  assert.equal(state.timers.size, 0); assert.equal(state.document.count(), 0); assert.equal(state.window.count(), 0);
});
