import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('js/content/content_playback_player.js', 'utf8');
const videoId = 'content0001';

class Node {
  constructor(tag, document) {
    this.tagName = tag; this.ownerDocument = document; this.children = []; this.listeners = new Map();
    this.isConnected = true; this.hidden = false; this.attributes = new Map();
    const values = new Map(), priorities = new Map();
    this.style = { setProperty(k, v, p = '') { values.set(k, v); priorities.set(k, p); },
      removeProperty(k) { values.delete(k); priorities.delete(k); },
      getPropertyValue: k => values.get(k) || '', getPropertyPriority: k => priorities.get(k) || '' };
    if (tag === 'track') this.track = { mode: 'disabled' };
  }
  appendChild(node) { this.children.push(node); node.parent = this; return node; }
  remove() { this.isConnected = false; if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, properties = {}) { for (const callback of [...(this.listeners.get(type) || [])]) callback({ type, target: this, ...properties }); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'src') this.src = ''; }
}

class Media extends Node {
  constructor(document, events) {
    super('video', document); this.events = events; this.currentTime = 0; this.volume = 1; this.muted = false;
    this.playbackRate = 1; this.paused = true; this.readyState = 0; this.seeking = false;
    this.textTracks = []; this.audioTracks = []; this.playCalls = 0; this.pauseCalls = 0;
  }
  canPlayType() { return this.ownerDocument.supportedType; }
  play() { this.playCalls++; this.events.push({ type: 'play', video: this });
    if (this.ownerDocument.rejectPlay && this !== this.ownerDocument.original) return Promise.reject(new Error('blocked'));
    this.paused = false; this.emit('play'); return Promise.resolve(); }
  pause() { this.pauseCalls++; this.paused = true; this.events.push({ type: 'pause', video: this }); }
  load() {}
}

function fixture({ paused = false, leaseLifetime = 30000, sourceLifetime = 60000, synchronizeNativeAudio } = {}) {
  let clock = 10000, leaseExpiry = clock + leaseLifetime, valid = true, nextTimer = 0;
  let validator = () => valid, originalContent = true;
  const timers = new Map(), events = [], states = [], fallbacks = [], created = [], blobs = [], revoked = [];
  const document = { supportedType: 'probably', rejectPlay: false,
    createElement(tag) { const node = tag === 'video' ? new Media(document, events) : new Node(tag, document); created.push(node); return node; } };
  const original = new Media(document, events); document.original = original;
  Object.assign(original, { currentTime: 30, volume: 0.4, muted: false, playbackRate: 1.25, paused, readyState: 4 });
  const surface = new Node('div', document); surface.appendChild(original); surface.style.setProperty('display', 'grid');
  const host = new Node('div', document);
  const timer = (callback, delay, interval = false) => { const id = ++nextTimer; timers.set(id, { callback, at: clock + delay, delay, interval }); return id; };
  const window = { navigator: { userActivation: { isActive: true } },
    setTimeout: (cb, delay) => timer(cb, delay), clearTimeout: id => timers.delete(id),
    setInterval: (cb, delay) => timer(cb, delay, true), clearInterval: id => timers.delete(id) };
  class LocalURL extends URL {}
  LocalURL.createObjectURL = blob => { const url = `blob:local-${blobs.length + 1}`; blobs.push({ url, blob }); return url; };
  LocalURL.revokeObjectURL = url => revoked.push(url);
  class ClockDate extends Date { static now() { return clock; } }
  const context = vm.createContext({ window, URL: LocalURL, Blob, TextEncoder, Date: ClockDate });
  vm.runInContext(source, context, { filename: 'js/content/content_playback_player.js' });
  const lease = Object.freeze({ get expiresAt() { return leaseExpiry; } });
  const mediaSource = { kind: 'progressive', hasAudio: true, hasVideo: true,
    url: 'https://r1.googlevideo.com/videoplayback?expire=9999999999', mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
    itag: 18, expiresAt: clock + sourceLifetime };
  const featurePlan = { allowed: true, captionsPreserved: true, audioPreserved: true, captionTracks: [] };
  const controller = window.FilterTubeContentPlaybackPlayer.create({ host, originalVideo: original, originalSurface: surface,
    validateLease: (...args) => validator(...args), now: () => clock,
    isOriginalContent: () => originalContent,
    synchronizeNativeAudio,
    onState: state => states.push(state), onFallback: state => fallbacks.push(state) });
  const advance = ms => {
    const end = clock + ms;
    for (let i = 0; i < 10000; i++) {
      const due = [...timers].filter(([, item]) => item.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) { clock = end; return; }
      const [id, item] = due; clock = item.at;
      if (item.interval) item.at += item.delay; else timers.delete(id);
      item.callback();
    }
    throw new Error('timer fixture did not settle');
  };
  const input = () => ({ videoId, lease, source: mediaSource, featurePlan });
  const owned = () => created.filter(n => n.tagName === 'video').at(-1);
  const playing = () => { const video = owned(); video.readyState = 4; video.emit('playing'); return video; };
  return { controller, host, original, surface, document, window, mediaSource, featurePlan, lease,
    input, owned, playing, advance, created, timers, states, fallbacks, events, blobs, revoked,
    invalidate: () => { valid = false; }, renew: ms => { leaseExpiry = clock + ms; },
    setOriginalContent: value => { originalContent = value; },
    setValidator: callback => { validator = callback; } };
}

test('creating the controller is inert and never starts playback or creates DOM', () => {
  const state = fixture();
  assert.equal(state.created.length, 0); assert.equal(state.timers.size, 0);
  assert.equal(state.original.pauseCalls, 0); assert.equal(state.host.children.length, 0);
});

test('unapproved features or authority create no owned media', async () => {
  for (const field of ['allowed', 'captionsPreserved', 'audioPreserved']) {
    const state = fixture(); state.featurePlan[field] = false;
    assert.equal((await state.controller.start(state.input())).status, 'fallback');
    assert.equal(state.created.length, 0); assert.equal(state.original.pauseCalls, 0);
  }
  const denied = fixture(); denied.invalidate();
  assert.equal((await denied.controller.start(denied.input())).reason, 'authorization_invalid');
  assert.equal(denied.created.length, 0);
});

test('source must be explicit combined progressive media on the exact HTTPS Googlevideo endpoint', async () => {
  for (const change of [
    { url: 'http://r1.googlevideo.com/videoplayback' }, { url: 'https://googlevideo.com.evil.invalid/videoplayback' },
    { url: 'https://user:password@r1.googlevideo.com/videoplayback' }, { url: 'https://r1.googlevideo.com:444/videoplayback' },
    { url: 'https://r1.googlevideo.com/not-playback' }, { url: 'https://r1.googlevideo.com/videoplayback#fragment' },
    { kind: 'adaptive' }, { hasAudio: false }, { hasVideo: false }, { mimeType: 'audio/mp4' }
  ]) {
    const state = fixture(); Object.assign(state.mediaSource, change);
    assert.equal((await state.controller.start(state.input())).reason, 'unsupported_source');
    assert.equal(state.created.length, 0); assert.equal(state.original.pauseCalls, 0);
  }
});

test('expired, malformed and unsupported media cannot take over playback', async () => {
  const expired = fixture({ leaseLifetime: 0 });
  assert.equal((await expired.controller.start(expired.input())).reason, 'expired');
  const missing = fixture(); delete missing.mediaSource.expiresAt;
  assert.equal((await missing.controller.start(missing.input())).reason, 'expiry_required');
  const type = fixture(); type.document.supportedType = '';
  assert.equal((await type.controller.start(type.input())).reason, 'unsupported_media_type');
  assert.equal(type.host.children.length, 0);
});

test('a trusted action must retain user activation and use an external host', async () => {
  const gesture = fixture(); gesture.window.navigator.userActivation.isActive = false;
  assert.equal((await gesture.controller.start(gesture.input())).reason, 'user_gesture_required');
  const nested = fixture(); nested.surface.appendChild(nested.host);
  assert.equal((await nested.controller.start(nested.input())).reason, 'invalid_host');
});

test('candidate remains muted and native surface visible until real playing, then preserves playback state', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  const video = state.owned();
  assert.equal(state.surface.hidden, false); assert.equal(state.host.children[0].hidden, true);
  assert.equal(state.original.paused, false); assert.equal(video.muted, true);
  state.playing(); assert.equal((await pending).status, 'active');
  assert.equal(state.surface.hidden, true); assert.equal(state.host.children[0].hidden, false);
  assert.equal(video.currentTime, 30); assert.equal(video.volume, 0.4);
  assert.equal(video.playbackRate, 1.25); assert.equal(video.muted, false);
  assert.equal(video.style.height, '100%'); assert.equal(video.style.objectFit, 'contain');
  assert.equal(state.original.paused, true);
});

test('asynchronous or throwing authorization is refused instead of treated as a truthy grant', async () => {
  for (const callback of [() => Promise.resolve(true), () => { throw new Error('unavailable'); }]) {
    const state = fixture(); state.setValidator(callback);
    assert.equal((await state.controller.start(state.input())).reason, 'authorization_invalid');
    assert.equal(state.created.length, 0); assert.equal(state.original.playCalls, 0);
  }
});

test('position restoration must finish before the native surface is hidden', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  const video = state.owned(); video.seeking = true; state.playing();
  assert.equal(state.surface.hidden, false);
  video.seeking = false; video.emit('seeked');
  assert.equal((await pending).status, 'active'); assert.equal(video.currentTime, 30);
});

test('caption payload bounds and loss of the mounted surface fail closed', async () => {
  const large = fixture(); large.featurePlan.captionTracks = [{ languageCode: 'en', kind: 'captions', vttText: `WEBVTT\n${'x'.repeat(2 * 1024 * 1024)}` }];
  assert.equal((await large.controller.start(large.input())).reason, 'unsupported_captions');
  assert.equal(large.created.length, 0);
  const removed = fixture(); const pending = removed.controller.start(removed.input());
  removed.host.isConnected = false; removed.advance(250);
  assert.equal((await pending).reason, 'authorization_invalid'); assert.equal(removed.original.playCalls, 0);
});

test('a paused original remains paused after the successful muted readiness check', async () => {
  const state = fixture({ paused: true }); const pending = state.controller.start(state.input());
  const video = state.playing(); assert.equal((await pending).paused, true);
  assert.equal(video.paused, true); state.controller.stop();
  assert.equal(state.original.playCalls, 0); assert.equal(state.original.paused, true);
});

test('media error and rejected play leave the unready original completely untouched', async () => {
  for (const failure of ['error', 'reject']) {
    const state = fixture(); state.document.rejectPlay = failure === 'reject';
    const pending = state.controller.start(state.input());
    if (failure === 'error') state.owned().emit('error');
    assert.equal((await pending).status, 'fallback');
    assert.equal(state.surface.hidden, false); assert.equal(state.host.children.length, 0);
    assert.equal(state.original.playCalls, 0); assert.equal(state.original.pauseCalls, 0);
    assert.equal(state.original.paused, false); assert.equal(state.timers.size, 0);
  }
});

test('muted preparation lets native playback advance and a failed candidate never rewinds it', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.original.currentTime = 47; state.original.volume = 0.7; state.original.playbackRate = 1.5;
  await state.original.play();
  assert.equal(state.original.paused, false); assert.equal(state.owned().muted, true);
  state.owned().emit('error'); await pending;
  assert.equal(state.original.currentTime, 47); assert.equal(state.original.volume, 0.7);
  assert.equal(state.original.playbackRate, 1.5); assert.equal(state.original.pauseCalls, 0);
  assert.equal(state.original.playCalls, 1, 'only the explicit native play attempt occurred');
});

test('handoff preserves the latest native position, controls and paused state rather than the start snapshot', async () => {
  for (const paused of [false, true]) {
    const state = fixture(); const pending = state.controller.start(state.input());
    Object.assign(state.original, { currentTime: 48, volume: 0.9, muted: true, playbackRate: 1.75, paused });
    const video = state.playing(); await pending;
    assert.equal(video.currentTime, 48); assert.equal(video.volume, 0.9); assert.equal(video.muted, true);
    assert.equal(video.playbackRate, 1.75); assert.equal(video.paused, paused);
    assert.equal(state.original.paused, true);
  }
});

test('detectable native caption or audio selection changes abort staging without replacing native playback', async () => {
  for (const kind of ['captions', 'audio']) {
    const state = fixture();
    const target = new Node('track-list', state.document);
    const list = kind === 'captions' ? [{ id: 'en', language: 'en', mode: 'disabled' }]
      : [{ id: 'en', enabled: true }, { id: 'es', enabled: false }];
    list.addEventListener = target.addEventListener.bind(target);
    list.removeEventListener = target.removeEventListener.bind(target);
    if (kind === 'captions') {
      state.original.textTracks = list;
      state.featurePlan.captionTracks = [{ id: 'en', languageCode: 'en', kind: 'captions', vttText: 'WEBVTT\n' }];
    } else {
      state.original.audioTracks = list; state.mediaSource.audioTrackId = 'en';
    }
    const pending = state.controller.start(state.input());
    if (kind === 'captions') list[0].mode = 'showing';
    else { list[0].enabled = false; list[1].enabled = true; }
    target.emit('change');
    assert.equal((await pending).reason, 'native_feature_selection_changed');
    assert.equal(state.original.pauseCalls, 0); assert.equal(state.original.playCalls, 0);
    assert.equal(state.original.paused, false); assert.equal(state.surface.hidden, false);
  }
});

test('readiness timeout returns to the original surface', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.advance(10000);
  assert.equal((await pending).reason, 'startup_timeout');
  assert.equal(state.host.children.length, 0); assert.equal(state.original.paused, false);
});

test('pending start cannot activate after its lease is invalidated', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.invalidate(); state.playing();
  assert.equal((await pending).reason, 'authorization_invalid');
  assert.equal(state.original.playCalls, 0); assert.equal(state.surface.hidden, false);
  assert.equal(state.owned().paused, true); assert.equal(state.host.children.length, 0);
});

test('expired or invalid active authority stops owned media without seeking or resuming native content', async () => {
  for (const cause of ['expiry', 'profile', 'route']) {
    const state = fixture({ leaseLifetime: 1000 }); const pending = state.controller.start(state.input());
    const video = state.playing(); await pending; video.currentTime = 80;
    if (cause !== 'expiry') state.invalidate();
    state.advance(cause === 'expiry' ? 1000 : 250);
    assert.equal(video.paused, true); assert.equal(state.original.currentTime, 30);
    assert.equal(state.original.playCalls, 0); assert.equal(state.surface.hidden, false);
    assert.equal(state.host.children.length, 0);
  }
});

test('renewed readonly lease survives its former timer but never extends the source expiry', async () => {
  const state = fixture({ leaseLifetime: 1000, sourceLifetime: 2200 });
  const pending = state.controller.start(state.input()); state.playing(); await pending;
  state.advance(600); state.renew(2000); state.advance(500);
  assert.equal(state.surface.hidden, true, 'the old 1000ms timer must read the renewed getter');
  state.advance(1100);
  assert.equal(state.surface.hidden, false); assert.equal(state.owned().paused, true);
  assert.equal(state.original.playCalls, 0);
});

test('valid fallback preserves the owned position, volume, pause and rate and restores original display', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  const video = state.playing(); await pending;
  Object.assign(video, { currentTime: 72, volume: 0.8, muted: true, playbackRate: 2 }); video.pause();
  state.controller.stop('closed');
  assert.equal(state.original.currentTime, 72); assert.equal(state.original.volume, 0.8);
  assert.equal(state.original.muted, true); assert.equal(state.original.playbackRate, 2);
  assert.equal(state.original.paused, true); assert.equal(state.surface.style.getPropertyValue('display'), 'grid');
  assert.equal(state.surface.hidden, false); assert.equal(state.host.children.length, 0);
});

test('native play attempts cannot produce a second audible player during owned playback', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  const video = state.playing(); await pending; await state.original.play();
  assert.equal(state.original.paused, true); assert.equal(video.paused, false);
  state.controller.stop();
  const lastPause = state.events.findLastIndex(event => event.type === 'pause' && event.video === video);
  const nativeResume = state.events.findLastIndex(event => event.type === 'play' && event.video === state.original);
  assert.ok(lastPause < nativeResume, 'owned audio must stop before restoring native playback');
});

test('repeated starts and destruction remove old listeners, timers and media sources', async () => {
  const state = fixture(); const first = state.controller.start(state.input()); const old = state.playing(); await first;
  const second = state.controller.start(state.input()); const latest = state.playing(); await second;
  old.emit('playing');
  assert.equal(state.host.children.length, 1); assert.notEqual(old, latest); assert.equal(old.src, '');
  assert.equal([...old.listeners.values()].reduce((n, set) => n + set.size, 0), 0);
  state.controller.destroy();
  assert.equal(state.timers.size, 0); assert.equal(state.host.children.length, 0); assert.equal(latest.src, '');
  assert.equal((await state.controller.start(state.input())).reason, 'destroyed');
});

test('caller source mutation cannot retarget an in-progress player', async () => {
  const state = fixture(); const expected = state.mediaSource.url;
  const pending = state.controller.start(state.input()); state.mediaSource.url = 'https://elsewhere.invalid/file';
  state.playing(); await pending; assert.equal(state.owned().src, expected);
});

test('selected captions or alternate audio cannot silently disappear', async () => {
  const captions = fixture(); captions.featurePlan.selectedCaptionLanguage = 'es';
  assert.equal((await captions.controller.start(captions.input())).reason, 'selected_captions_unavailable');
  const nativeCaptions = fixture(); nativeCaptions.original.textTracks = [{ language: 'es', mode: 'disabled' }];
  assert.equal((await nativeCaptions.controller.start(nativeCaptions.input())).reason, 'captions_unavailable');
  const audio = fixture(); audio.featurePlan.audioTrackId = 'alternate';
  assert.equal((await audio.controller.start(audio.input())).reason, 'selected_audio_unavailable');
});

test('vetted VTT selection must load before takeover and every owned Blob URL is revoked', async () => {
  const state = fixture();
  state.featurePlan.captionTracks = [{ languageCode: 'es', label: 'Español', kind: 'subtitles', vttText: 'WEBVTT\n\n00:00.000 --> 00:01.000\nHola\n' }];
  state.featurePlan.selectedCaptionLanguage = 'es';
  const pending = state.controller.start(state.input()); state.playing();
  assert.equal(state.surface.hidden, false, 'captions must be ready before hiding native controls');
  const track = state.owned().children[0]; track.emit('load');
  assert.equal((await pending).status, 'active'); assert.equal(track.track.mode, 'showing');
  assert.equal(state.blobs.length, 1); assert.equal(state.blobs[0].blob.type, 'text/vtt');
  state.controller.destroy(); assert.deepEqual(state.revoked, [track.src]);
});

test('caption error or invalid authority revokes staged VTT and leaves native content visible', async () => {
  for (const failure of ['track', 'authority']) {
    const state = fixture(); state.featurePlan.captionTracks = [{ languageCode: 'en', label: 'English', kind: 'captions', vttText: 'WEBVTT\n' }];
    state.featurePlan.selectedCaptionLanguage = 'en';
    const pending = state.controller.start(state.input()); const track = state.owned().children[0];
    if (failure === 'track') track.emit('error'); else { state.invalidate(); state.advance(250); }
    assert.equal((await pending).status, 'fallback'); assert.equal(state.surface.hidden, false);
    assert.deepEqual(state.revoked, [track.src]);
  }
});

test('loading an alternate caption after takeover preserves the user selection', async () => {
  const state = fixture();
  state.featurePlan.captionTracks = ['en', 'es'].map(languageCode => ({
    languageCode, kind: 'subtitles', vttText: 'WEBVTT\n'
  }));
  state.featurePlan.selectedCaptionLanguage = 'en';
  const pending = state.controller.start(state.input()); state.playing();
  const [english, spanish] = state.owned().children;
  english.emit('load'); assert.equal((await pending).status, 'active');
  english.track.mode = 'disabled'; spanish.track.mode = 'showing'; spanish.emit('load');
  assert.equal(spanish.track.mode, 'showing'); assert.equal(english.track.mode, 'disabled');
  assert.equal(state.surface.hidden, true);
});

test('an exact selected caption ID preserves same-language alternatives without choosing another track', async () => {
  const state = fixture();
  state.featurePlan.captionTracks = ['manual-en', 'auto-en'].map(id => ({
    id, languageCode: 'en', label: id, kind: 'subtitles', vttText: 'WEBVTT\n'
  }));
  state.featurePlan.selectedCaptionLanguage = 'en'; state.featurePlan.selectedCaptionId = 'auto-en';
  const pending = state.controller.start(state.input()); state.playing();
  const [manual, automatic] = state.owned().children;
  manual.emit('load'); assert.equal(state.surface.hidden, false);
  automatic.emit('load'); assert.equal((await pending).status, 'active');
  assert.equal(manual.default, false); assert.equal(manual.track.mode, 'disabled');
  assert.equal(automatic.default, true); assert.equal(automatic.track.mode, 'showing');
  assert.equal(state.owned().children.length, 2);
});

test('missing, duplicate or language-mismatched selected caption IDs fail before media creation', async () => {
  for (const [ids, language] of [[['other'], 'en'], [['chosen', 'chosen'], 'en'], [['chosen'], 'es'], [['chosen'], '']]) {
    const state = fixture();
    state.featurePlan.captionTracks = ids.map(id => ({ id, languageCode: 'en', kind: 'subtitles', vttText: 'WEBVTT\n' }));
    state.featurePlan.selectedCaptionId = 'chosen'; state.featurePlan.selectedCaptionLanguage = language;
    assert.equal((await state.controller.start(state.input())).reason, 'selected_captions_unavailable');
    assert.equal(state.created.length, 0);
  }
});

test('malformed or ambiguous caption plans are refused before creating media', async () => {
  for (const tracks of [
    [{ languageCode: 'en', kind: 'captions', vttText: '<html>not VTT</html>' }],
    [{ languageCode: 'en', kind: 'captions', vttText: 'WEBVTT\n' }, { languageCode: 'en', kind: 'captions', vttText: 'WEBVTT\n' }]
  ]) {
    const state = fixture(); state.featurePlan.captionTracks = tracks; state.featurePlan.selectedCaptionLanguage = 'en';
    assert.equal((await state.controller.start(state.input())).status, 'fallback'); assert.equal(state.created.length, 0);
  }
});

function independentInput(state, overrides = {}) {
  return { ...state.input(), playbackIntent: {
    videoId, nativeTimeline: 'unrelated', durationSeconds: 120, positionSeconds: 8,
    volume: 0.6, muted: false, rate: 1, paused: false, ...overrides
  } };
}

test('independent content starts at exact-video intent without inheriting advert time or controls', async () => {
  const state = fixture();
  Object.assign(state.original, { currentTime: 17, duration: 30, volume: 0.2, muted: true, playbackRate: 2 });
  const pending = state.controller.start(independentInput(state));
  Object.assign(state.original, { currentTime: 23, volume: 0.9, muted: true, playbackRate: 1.75 });
  state.owned().duration = 120;
  const video = state.playing();
  assert.equal((await pending).status, 'active');
  assert.equal(video.currentTime, 8); assert.equal(video.volume, 0.6);
  assert.equal(video.muted, false); assert.equal(video.playbackRate, 1);
  assert.equal(video.paused, false); assert.equal(state.original.paused, true);
});

test('independent candidate must match the resolved content duration before pausing native media', async () => {
  for (const duration of [30, Infinity, NaN, undefined]) {
    const state = fixture(); const pending = state.controller.start(independentInput(state));
    state.owned().duration = duration; state.playing();
    assert.equal((await pending).reason, 'content_duration_mismatch');
    assert.equal(state.original.pauseCalls, 0); assert.equal(state.original.playCalls, 0);
    assert.equal(state.surface.hidden, false); assert.equal(state.host.children.length, 0);
  }
});

test('independent seek readiness keeps unrelated native playback usable until the candidate is positioned', async () => {
  const state = fixture(); const pending = state.controller.start(independentInput(state));
  const video = state.owned(); video.duration = 120; video.seeking = true; state.playing();
  assert.equal(state.original.pauseCalls, 0); assert.equal(state.original.paused, false);
  assert.equal(state.surface.hidden, false);
  video.seeking = false; video.emit('seeked');
  assert.equal((await pending).status, 'active'); assert.equal(state.original.paused, true);
});

test('unrelated native timeline is never sought or resumed on valid user close', async () => {
  const state = fixture(); const pending = state.controller.start(independentInput(state));
  state.owned().duration = 120; const video = state.playing(); await pending;
  Object.assign(video, { currentTime: 81, volume: 0.8, playbackRate: 1.5 });
  state.controller.stop('user_close');
  assert.equal(state.original.currentTime, 30); assert.equal(state.original.volume, 0.4);
  assert.equal(state.original.playbackRate, 1.25); assert.equal(state.original.playCalls, 0);
  assert.equal(state.original.paused, true); assert.equal(state.surface.hidden, false);
  assert.equal(video.paused, true); assert.equal(state.host.children.length, 0);
});

test('independent playback authority loss cannot transfer content state into native media', async () => {
  const state = fixture(); const pending = state.controller.start(independentInput(state));
  state.owned().duration = 120; const video = state.playing(); await pending;
  video.currentTime = 82; state.invalidate(); state.advance(250);
  assert.equal(video.paused, true); assert.equal(state.original.currentTime, 30);
  assert.equal(state.original.playCalls, 0); assert.equal(state.surface.hidden, false);
});

test('failed independent preparation preserves advancing native state without touching its controls', async () => {
  const state = fixture(); const pending = state.controller.start(independentInput(state));
  Object.assign(state.original, { currentTime: 45, volume: 0.7, playbackRate: 1.5 });
  state.owned().emit('error'); await pending;
  assert.equal(state.original.currentTime, 45); assert.equal(state.original.volume, 0.7);
  assert.equal(state.original.playbackRate, 1.5); assert.equal(state.original.pauseCalls, 0);
  assert.equal(state.original.playCalls, 0); assert.equal(state.surface.hidden, false);
});

test('independent intent is immutable after start and explicit paused intent remains paused', async () => {
  const state = fixture(); const input = independentInput(state, { paused: true });
  const pending = state.controller.start(input);
  Object.assign(input.playbackIntent, { videoId: 'other000001', positionSeconds: 80, durationSeconds: 50, paused: false });
  state.owned().duration = 120; const video = state.playing();
  assert.equal((await pending).paused, true); assert.equal(video.currentTime, 8);
  assert.equal(video.paused, true);
});

test('known native content still preserves its latest controls and supports same-timeline return', async () => {
  const state = fixture();
  const pending = state.controller.start(independentInput(state, { nativeTimeline: 'content' }));
  Object.assign(state.original, { currentTime: 49, volume: 0.8, playbackRate: 1.5 });
  state.owned().duration = 120; const video = state.playing(); await pending;
  assert.equal(video.currentTime, 49); assert.equal(video.volume, 0.8); assert.equal(video.playbackRate, 1.5);
  video.currentTime = 67; state.controller.stop('user_close');
  assert.equal(state.original.currentTime, 67); assert.equal(state.original.playCalls, 1);
});

test('malformed or wrong-video playback intents fail before owned media or native controls are touched', async () => {
  for (const change of [
    { videoId: 'different01' }, { nativeTimeline: 'unknown' }, { durationSeconds: 0 },
    { durationSeconds: Infinity }, { positionSeconds: -1 }, { positionSeconds: 121 },
    { positionSeconds: NaN }, { paused: undefined }, { muted: undefined }, { volume: -1 },
    { volume: 1.1 }, { rate: 0 }, { rate: 17 }
  ]) {
    const state = fixture();
    assert.equal((await state.controller.start(independentInput(state, change))).reason, 'invalid_playback_intent');
    assert.equal(state.created.length, 0); assert.equal(state.original.pauseCalls, 0);
  }
  const state = fixture(); const input = state.input(); input.playbackIntent = null;
  assert.equal((await state.controller.start(input)).reason, 'invalid_playback_intent');
});

test('a trusted exact-video action survives async resolution after transient activation expires', async () => {
  const state = fixture();
  const token = state.window.FilterTubeContentPlaybackPlayer.captureTrustedAction({ isTrusted: true }, videoId);
  assert.ok(token); state.window.navigator.userActivation.isActive = false; state.advance(5000);
  const pending = state.controller.start({ ...state.input(), actionToken: token });
  state.playing(); assert.equal((await pending).status, 'active');
});

test('trusted action tokens cannot be forged, replayed, retargeted or used after thirty seconds', async () => {
  for (const kind of ['forged', 'expired', 'wrong-video', 'replay']) {
    const state = fixture({ leaseLifetime: 60000 });
    const api = state.window.FilterTubeContentPlaybackPlayer;
    const token = kind === 'forged' ? {} : api.captureTrustedAction({ isTrusted: true }, kind === 'wrong-video' ? 'different01' : videoId);
    if (kind === 'expired') state.advance(30000);
    if (kind === 'replay') {
      const pending = state.controller.start({ ...state.input(), actionToken: token }); state.playing(); await pending; state.controller.stop();
    }
    const before = state.created.length;
    assert.equal((await state.controller.start({ ...state.input(), actionToken: token })).reason, 'user_gesture_required');
    assert.equal(state.created.length, before);
  }
});

test('untrusted events and inactive user activation cannot mint action tokens', () => {
  const state = fixture(); const api = state.window.FilterTubeContentPlaybackPlayer;
  assert.equal(api.captureTrustedAction({ isTrusted: false }, videoId), null);
  assert.equal(api.captureTrustedAction({ isTrusted: true }, 'wrong'), null);
  state.window.navigator.userActivation.isActive = false;
  assert.equal(api.captureTrustedAction({ isTrusted: true }, videoId), null);
});

test('native timeline changing to an advert during staging cannot replace independent content intent', async () => {
  const state = fixture();
  const pending = state.controller.start(independentInput(state, { nativeTimeline: 'content' }));
  state.setOriginalContent(false); Object.assign(state.original, { currentTime: 19, volume: 0.1, playbackRate: 2 });
  state.owned().duration = 120; const video = state.playing();
  assert.equal((await pending).status, 'active'); assert.equal(video.currentTime, 8);
  assert.equal(video.volume, 0.6); assert.equal(video.playbackRate, 1);
  state.controller.stop('user_close'); assert.equal(state.original.currentTime, 19); assert.equal(state.original.playCalls, 0);
});

test('native timeline becoming unrelated after takeover prevents seek or resume during valid fallback', async () => {
  const state = fixture(); const pending = state.controller.start(independentInput(state, { nativeTimeline: 'content' }));
  state.owned().duration = 120; const video = state.playing(); await pending;
  state.setOriginalContent(false); state.original.currentTime = 5; video.currentTime = 80;
  state.controller.stop('user_close'); assert.equal(state.original.currentTime, 5); assert.equal(state.original.playCalls, 0);
});

test('a legacy attempt without explicit content intent cannot take over after losing native timeline evidence', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.setOriginalContent(false); state.playing();
  assert.equal((await pending).reason, 'content_timeline_unknown'); assert.equal(state.original.pauseCalls, 0);
});

test('paired-source controller waits for transport startup and destroys it on fallback', async () => {
  const state = fixture(); let ready, destroyed = 0;
  state.window.FilterTubeContentPlaybackTransport = { create(options) {
    assert.equal(options.isCurrent(), true); options.video.duration = 120;
    return { start() { return new Promise(resolve => { ready = resolve; }); }, destroy() { destroyed++; } };
  } };
  Object.assign(state.mediaSource, { kind: 'adaptive_mp4', video: {}, audio: {}, durationSeconds: 120 });
  const pending = state.controller.start(independentInput(state));
  assert.equal(state.owned().playCalls, 0); assert.equal(state.original.pauseCalls, 0);
  ready(); await new Promise(resolve => setImmediate(resolve)); state.playing();
  assert.equal((await pending).status, 'active'); state.controller.stop(); assert.equal(destroyed, 1);
});

test('paired-source transport failure leaves native controls usable and authority loss cannot restart it', async () => {
  for (const failure of ['transport', 'authority']) {
    const state = fixture(); let options, ready, destroyed = 0;
    state.window.FilterTubeContentPlaybackTransport = { create(value) { options = value;
      return { start() { return new Promise(resolve => { ready = resolve; }); }, destroy() { destroyed++; } };
    } };
    state.mediaSource.kind = 'adaptive_mp4'; const pending = state.controller.start(independentInput(state));
    if (failure === 'transport') options.onError({ code: 'range_response_required' });
    else { state.invalidate(); state.advance(250); }
    assert.equal((await pending).status, 'fallback'); assert.equal(state.original.pauseCalls, 0);
    ready(); await new Promise(resolve => setImmediate(resolve)); assert.equal(state.owned().playCalls, 0);
    assert.equal(destroyed, 1); assert.equal(state.surface.hidden, false);
  }
});

function alternateAudio(state, switchAudio = async () => {}) {
  Object.assign(state.mediaSource, { kind: 'adaptive_mp4', audioTrackId: 'en', durationSeconds: 120,
    audioVariants: ['en', 'es'].map(id => ({ audioTrack: { id, label: id === 'en' ? 'English' : 'Español' } })) });
  state.featurePlan.audioTrackId = 'en';
  state.window.FilterTubeContentPlaybackTransport = { create(options) {
    options.video.duration = 120;
    return { start: async () => {}, switchAudio, destroy() {} };
  } };
}

async function activateAlternateAudio(state, switchAudio) {
  alternateAudio(state, switchAudio);
  const pending = state.controller.start(independentInput(state));
  await new Promise(resolve => setImmediate(resolve)); state.playing();
  assert.equal((await pending).status, 'active');
  return state.created.find(node => node.tagName === 'select');
}

test('alternate audio controls require an authoritative native synchronization callback', async () => {
  const state = fixture(); alternateAudio(state);
  assert.equal((await state.controller.start(independentInput(state))).reason, 'audio_switch_unavailable');
  assert.equal(state.created.length, 0); assert.equal(state.original.pauseCalls, 0);
});

test('accessible audio selection synchronizes native choice before switching the owned source', async () => {
  const order = [], state = fixture({ synchronizeNativeAudio: async request => {
    order.push(`native:${request.audioTrackId}`); assert.equal(request.videoId, videoId); return true;
  } });
  const select = await activateAlternateAudio(state, async id => { order.push(`owned:${id}`); });
  assert.equal(select.attributes.get('aria-label'), 'Audio track'); assert.equal(select.style.minHeight, '44px');
  assert.equal(select.children.length, 2); assert.equal(select.value, 'en');
  select.value = 'es'; select.emit('change', { isTrusted: true });
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(order, ['native:es', 'owned:es']); assert.equal(select.disabled, false);
  assert.equal(state.states.at(-1).status, 'audio_changed'); assert.equal(state.states.at(-1).audioTrackId, 'es');
  assert.equal(state.surface.hidden, true); assert.equal(state.owned().paused, false);
});

test('unacknowledged audio selection keeps the previous owned track and restores its selection label', async () => {
  let switches = 0;
  const state = fixture({ synchronizeNativeAudio: async () => false });
  const select = await activateAlternateAudio(state, async () => { switches++; });
  select.value = 'es'; select.emit('change', { isTrusted: true }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(switches, 0); assert.equal(select.value, 'en'); assert.equal(state.states.at(-1).status, 'audio_switch_failed');
  assert.equal(state.surface.hidden, true); assert.equal(state.owned().paused, false);
});

test('untrusted audio events and unknown track IDs cannot call native synchronization or transport', async () => {
  let requests = 0;
  const state = fixture({ synchronizeNativeAudio: async () => { requests++; return true; } });
  const select = await activateAlternateAudio(state, async () => { requests++; });
  select.value = 'es'; select.emit('change', { isTrusted: false });
  select.value = 'unknown'; select.emit('change', { isTrusted: true }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 0); assert.equal(select.value, 'en'); assert.equal(state.surface.hidden, true);
});

test('coordinated native audio acknowledgment updates the baseline without suppressing subsequent feature changes', async () => {
  let state, target, list;
  state = fixture({ synchronizeNativeAudio: async () => {
    list[0].enabled = false; list[1].enabled = true; target.emit('change'); return true;
  } });
  target = new Node('audio-list', state.document); list = [{ id: 'en', enabled: true }, { id: 'es', enabled: false }];
  list.addEventListener = target.addEventListener.bind(target); list.removeEventListener = target.removeEventListener.bind(target);
  state.original.audioTracks = list;
  const select = await activateAlternateAudio(state);
  select.value = 'es'; select.emit('change', { isTrusted: true }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.surface.hidden, true); assert.equal(state.states.at(-1).status, 'audio_changed');
  list[0].enabled = true; list[1].enabled = false; target.emit('change');
  assert.equal(state.surface.hidden, false); assert.equal(state.fallbacks.at(-1).reason, 'native_feature_selection_changed');
});

test('profile revocation while native audio acknowledgment is pending cannot switch or resume owned media', async () => {
  let acknowledge, switches = 0;
  const state = fixture({ synchronizeNativeAudio: () => new Promise(resolve => { acknowledge = resolve; }) });
  const select = await activateAlternateAudio(state, async () => { switches++; });
  select.value = 'es'; select.emit('change', { isTrusted: true });
  state.invalidate(); state.advance(250); acknowledge(true); await new Promise(resolve => setImmediate(resolve));
  assert.equal(switches, 0); assert.equal(state.owned().paused, true); assert.equal(state.original.playCalls, 0);
  assert.equal(state.surface.hidden, false);
});

test('an acknowledged audio switch failure returns to native without transferring unrelated content time', async () => {
  const state = fixture({ synchronizeNativeAudio: async () => true });
  const select = await activateAlternateAudio(state, async () => { throw new Error('media unavailable'); });
  select.value = 'es'; select.emit('change', { isTrusted: true }); await new Promise(resolve => setImmediate(resolve));
  assert.equal(state.surface.hidden, false); assert.equal(state.fallbacks.at(-1).reason, 'audio_switch_failed');
  assert.equal(state.original.currentTime, 30); assert.equal(state.original.playCalls, 0);
});

test('synchronous authority loss during native state restoration cannot resume native playback', async () => {
  const state = fixture(); const pending = state.controller.start(state.input()); state.playing(); await pending;
  let position = state.original.currentTime;
  Object.defineProperty(state.original, 'currentTime', { configurable: true, get: () => position,
    set(value) { position = value; state.invalidate(); } });
  state.owned().currentTime = 70; state.controller.stop('user_close');
  assert.equal(position, 70); assert.equal(state.original.playCalls, 0); assert.equal(state.original.paused, true);
});

test('only an active authorized owned player can publish its exact-video ended event', async () => {
  const state = fixture(); const pending = state.controller.start(state.input());
  state.owned().emit('ended'); assert.equal(state.states.some(value => value.status === 'ended'), false);
  const video = state.playing(); await pending; video.emit('ended');
  assert.equal(state.states.at(-1).status, 'ended'); assert.equal(state.states.at(-1).videoId, videoId);
  assert.equal(state.original.playCalls, 0, 'the controller never starts a native next video');
  state.invalidate(); video.emit('ended');
  assert.equal(state.states.filter(value => value.status === 'ended').length, 1);
  assert.equal(state.fallbacks.at(-1).reason, 'authorization_invalid'); assert.equal(state.original.playCalls, 0);
  video.emit('ended'); assert.equal(state.states.filter(value => value.status === 'ended').length, 1);
});
