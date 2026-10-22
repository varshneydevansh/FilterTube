import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/content/content_playback_response.js', 'utf8');
const id = 'content0001';
function fixture(overrides = {}) {
  const listeners = [], sent = [], setters = [], timers = [];
  let now = 10000; let nextTimer = 1;
  let currentAudio = overrides.selectedAudio || { id: 'es.1' };
  const tracks = overrides.tracks || [{ id: 'es.1' }];
  const player = {
    getAudioTrack: () => currentAudio,
    getAvailableAudioTracks: () => tracks,
    setAudioTrack: value => { setters.push(value); currentAudio = value; },
    getOption: kind => kind === 'captions' ? { vss_id: '.es', languageCode: 'es' } : null,
    ...overrides.player
  };
  let currentPlayer = player;
  const payload = overrides.payload || { videoDetails: { videoId: id, lengthSeconds: '90' }, playabilityStatus: { status: 'OK' },
    streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=9999999999' }] },
    playerAds: [{ doNotCopy: true }], adSlots: [{ doNotCopy: true }], trackingParams: 'do-not-copy' };
  const location = { origin: 'https://www.youtube.com', pathname: '/watch', search: `?v=${id}`, ...overrides.location };
  const document = { querySelector: () => ({ playerData: payload }), getElementById: () => currentPlayer };
  const window = {
    addEventListener: (name, callback) => listeners.push(callback),
    postMessage: (...value) => sent.push(value),
    setTimeout: (callback, milliseconds) => { const timerId = nextTimer++; timers.push({ id: timerId, callback, milliseconds, at: now + milliseconds }); return timerId; },
    clearTimeout: timerId => { const index = timers.findIndex(timer => timer.id === timerId); if (index >= 0) timers.splice(index, 1); }
  };
  const context = vm.createContext({ window, document, location, URLSearchParams, URL, TextEncoder, Date: { now: () => now },
    fetch() { throw Error('Response bridge must not make network requests'); } });
  vm.runInContext(source, context);
  function request(extra = {}) {
    const { data: dataOverride, ...eventOverride } = extra;
    const data = { type: 'FilterTube_RequestContentPlayback', source: 'content_bridge',
      payload: { videoId: id, requestId: 'request1234567890' }, ...dataOverride };
    listeners[0]({ source: window, origin: location.origin, data, ...eventOverride });
  }
  function select(audioTrackId = 'es.1', extra = {}) {
    request({ ...extra, data: { type: 'FilterTube_SelectContentPlaybackAudio', source: 'content_bridge',
      payload: { videoId: id, requestId: 'audio123456789012', audioTrackId }, ...extra.data } });
  }
  async function flush() { for (let i = 0; i < 8; i++) await Promise.resolve(); }
  async function tick(milliseconds) {
    await flush();
    timers.sort((a, b) => a.at - b.at || a.id - b.id);
    const timer = timers.shift();
    assert.ok(timer, 'a pending timer is required');
    now = milliseconds === undefined ? Math.max(now, timer.at) : now + milliseconds;
    timer.callback();
    await flush();
  }
  return { request, select, tick, flush, sent, setters, timers, player, tracks, payload, context, window, listeners, location,
    setPlayer(value) { currentPlayer = value; }, setAudio(value) { currentAudio = value; }, setNow(value) { now = value; }, getNow() { return now; } };
}

test('main-world source bridge is inert until a bounded current-video request', () => {
  const state = fixture(); assert.equal(state.sent.length, 0);
  state.request();
  assert.equal(state.sent.length, 1);
  const [response, origin] = state.sent[0];
  assert.equal(origin, 'https://www.youtube.com');
  assert.equal(response.payload.playerResponse.videoDetails.videoId, id);
  assert.equal(response.payload.preferences.audioTrackId, 'es.1');
  assert.equal(response.payload.preferences.audioTrackCount, 1);
  assert.equal(response.payload.preferences.captionLanguage, 'es');
  for (const field of ['playerAds', 'adSlots', 'trackingParams']) assert.equal(field in response.payload.playerResponse, false);
});

test('foreign origins, windows, request types, IDs and routes cannot request a source', () => {
  for (const extra of [{ source: {} }, { origin: 'https://example.test' },
    { data: { type: 'Other' } }, { data: { type: 'FilterTube_RequestContentPlayback', source: 'page', payload: {} } },
    { data: { type: 'FilterTube_RequestContentPlayback', source: 'content_bridge', payload: { videoId: id, requestId: 'short' } } }]) {
    const state = fixture(); state.request(extra); assert.equal(state.sent.length, 0);
  }
  const wrongRoute = fixture({ location: { pathname: '/shorts/content0001' } });
  wrongRoute.request(); assert.equal(wrongRoute.sent.length, 0);
});

test('mismatched or oversized loaded responses never yield media data', () => {
  for (const payload of [{ videoDetails: { videoId: 'another0001' } },
    { videoDetails: { videoId: id, shortDescription: 'x'.repeat(512001) } }]) {
    const state = fixture({ payload }); state.request();
    assert.equal(state.sent[0][0].payload.playerResponse, null);
  }
});

test('prototype functions do not turn unknown audio selection into proven availability', () => {
  const state = fixture(); delete state.player.getAvailableAudioTracks;
  state.request(); assert.equal(state.sent[0][0].payload.preferences.audioKnown, false);
});

test('repeated requests are rate limited and installation is idempotent', () => {
  const state = fixture(); vm.runInContext(source, state.context);
  assert.equal(state.listeners.length, 1);
  state.request(); state.request(); assert.equal(state.sent.length, 1);
});

test('audio selection passes the exact currently available object and returns matching receipt identifiers', async () => {
  const track = { id: 'en.0', privateNativeObject: { identity: true } };
  const state = fixture({ tracks: [track] });
  state.select('en.0');
  await state.flush();
  assert.equal(state.setters.length, 1);
  assert.strictEqual(state.setters[0], track, 'setter needs the actual native API object, not a reconstructed ID');
  const [result, origin] = state.sent[0];
  assert.equal(origin, 'https://www.youtube.com');
  assert.equal(result.type, 'FilterTube_ContentPlaybackAudioResult');
  assert.equal(result.source, 'injector');
  assert.equal(result.payload.requestId, 'audio123456789012');
  assert.equal(result.payload.videoId, id);
  assert.equal(result.payload.audioTrackId, 'en.0');
  assert.equal(result.payload.selected, true);
  assert.equal(JSON.stringify(result).includes('privateNativeObject'), false);
});

test('descriptor language information resolves the exact available audio object', async () => {
  const track = { getLanguageInfo: () => ({ getId: () => 'fr.1' }) };
  const state = fixture({ tracks: [track] });
  state.select('fr.1');
  await state.flush();
  assert.strictEqual(state.setters[0], track);
  assert.equal(state.sent[0][0].payload.selected, true);
});

for (const [name, extra, fixtureOverrides] of [
  ['foreign window', { source: {} }],
  ['foreign origin', { origin: 'https://example.test' }],
  ['wrong source', { data: { source: 'page' } }],
  ['short nonce', { data: { payload: { videoId: id, requestId: 'short', audioTrackId: 'es.1' } } }],
  ['long nonce', { data: { payload: { videoId: id, requestId: 'x'.repeat(97), audioTrackId: 'es.1' } } }],
  ['malformed nonce', { data: { payload: { videoId: id, requestId: 'nonce/123456789012', audioTrackId: 'es.1' } } }],
  ['mismatched video', { data: { payload: { videoId: 'foreign0001', requestId: 'audio123456789012', audioTrackId: 'es.1' } } }],
  ['wrong route', {}, { location: { pathname: '/shorts/' + id } }],
  ['empty audio id', { data: { payload: { videoId: id, requestId: 'audio123456789012', audioTrackId: '' } } }],
  ['long audio id', { data: { payload: { videoId: id, requestId: 'audio123456789012', audioTrackId: 'x'.repeat(161) } } }],
  ['control character in audio id', { data: { payload: { videoId: id, requestId: 'audio123456789012', audioTrackId: 'es.1\n' } } }]
]) test('invalid audio request never calls the native setter: ' + name, () => {
  const state = fixture(fixtureOverrides);
  state.select('es.1', extra);
  assert.equal(state.setters.length, 0);
  assert.equal(state.sent.length, 0);
});

for (const [name, tracks, player] of [
  ['missing requested track', [{ id: 'en.0' }], {}],
  ['ambiguous requested track', [{ id: 'es.1' }, { id: 'es.1' }], {}],
  ['unavailable track API', [], { getAvailableAudioTracks: undefined }],
  ['oversized track list', Array.from({ length: 65 }, (_, i) => ({ id: i === 0 ? 'es.1' : 'track' + i })), {}],
  ['missing setter', [{ id: 'es.1' }], { setAudioTrack: undefined }],
  ['throwing setter', [{ id: 'es.1' }], { setAudioTrack() { throw Error('native setter failed'); } }]
]) test('unavailable audio selection returns false without fabricating a receipt: ' + name, () => {
  const state = fixture({ tracks, player });
  state.select('es.1');
  assert.equal(state.setters.length, 0);
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
});

test('audio selection refuses mismatched loaded response and a nonplayable current response', () => {
  for (const payload of [
    { videoDetails: { videoId: 'foreign0001' }, playabilityStatus: { status: 'OK' } },
    { videoDetails: { videoId: id }, playabilityStatus: { status: 'LOGIN_REQUIRED' } }
  ]) {
    const state = fixture({ payload });
    state.select('es.1');
    assert.equal(state.setters.length, 0);
    assert.equal(state.sent[0][0].payload.selected, false);
  }
});

test('setter invocation alone is not a successful selection; native readback must match', async () => {
  let calls = 0;
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack() { calls++; } } });
  state.select('en.0');
  await state.flush();
  assert.equal(calls, 1);
  assert.equal(state.sent.length, 0);
  state.setAudio({ id: 'en.0' });
  await state.tick();
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, true);
});

test('route change during an asynchronous selection yields false even if the new native track matches', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack() {} } });
  state.select('en.0');
  await state.flush();
  state.location.search = '?v=foreign0001';
  state.setAudio({ id: 'en.0' });
  await state.tick();
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
});

test('player replacement during asynchronous selection cannot acknowledge the prior player', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack() {} } });
  state.select('en.0');
  await state.flush();
  state.setPlayer({ getAudioTrack: () => ({ id: 'en.0' }) });
  state.setAudio({ id: 'en.0' });
  await state.tick();
  assert.equal(state.sent[0][0].payload.selected, false);
});

test('selection timeout produces a false receipt with bounded pending work', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack() {} } });
  state.select('en.0');
  await state.flush();
  for (let i = 0; i < 25 && state.timers.length; i++) await state.tick();
  assert.equal(state.timers.length, 0);
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
});

test('audio projection retains only bounded ids, with no native object serialization', () => {
  const privateValue = { secret: 'never-project', nested: { secret: 'never-project' } };
  const state = fixture({ tracks: [{ id: 'en.0', ...privateValue }, { getLanguageInfo: () => ({ getId: () => 'fr.1' }), ...privateValue }] });
  state.request();
  const preferences = state.sent[0][0].payload.preferences;
  assert.deepEqual(JSON.parse(JSON.stringify(preferences.audioTracks)), [{ id: 'en.0' }, { id: 'fr.1' }]);
  assert.equal(JSON.stringify(preferences).includes('never-project'), false);
  const oversized = fixture({ tracks: Array.from({ length: 65 }, (_, index) => ({ id: 'track' + index })) });
  oversized.request();
  assert.equal(oversized.sent[0][0].payload.preferences.audioTracks.length, 0);
  assert.equal(oversized.sent[0][0].payload.preferences.audioTrackCount, 65);
});

test('a rejected asynchronous native setter produces false without an unhandled rejection or pending timer', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack: () => Promise.reject(Error('native rejected')) } });
  state.select('en.0');
  await state.flush();
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
  assert.equal(state.timers.length, 0);
});

test('an unresolved asynchronous native setter cannot wait past the selection deadline', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack: () => new Promise(() => {}) } });
  state.select('en.0');
  await state.tick();
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
  assert.equal(state.timers.length, 0);
});

test('a background-delayed poll cannot claim success after two seconds even if the track later matches', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }], player: { setAudioTrack() {} } });
  state.select('en.0');
  await state.flush();
  state.setAudio({ id: 'en.0' });
  await state.tick(2500);
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.selected, false);
  assert.equal(state.timers.length, 0);
});

test('a newer audio selection supersedes an older pending selection with separate correlated receipts', async () => {
  const state = fixture({ tracks: [{ id: 'en.0' }, { id: 'fr.1' }], player: { setAudioTrack() {} } });
  state.select('en.0', { data: { payload: { videoId: id, requestId: 'first123456789012', audioTrackId: 'en.0' } } });
  await state.flush();
  state.select('fr.1', { data: { payload: { videoId: id, requestId: 'second12345678901', audioTrackId: 'fr.1' } } });
  state.setAudio({ id: 'fr.1' });
  await state.flush();
  const second = state.sent.find(([result]) => result.payload.requestId === 'second12345678901');
  assert.ok(second); assert.equal(second[0].payload.selected, true);
  await state.tick();
  const first = state.sent.find(([result]) => result.payload.requestId === 'first123456789012');
  assert.ok(first); assert.equal(first[0].payload.selected, false);
  assert.equal(state.timers.length, 0);
});

function nativeFixture(options = {}) {
  const calls = [], captionCalls = [], nativeLoads = [];
  const node = { currentTime: 12, duration: 90, paused: false, volume: .35, muted: true, playbackRate: 1.25,
    pause() { this.paused = true; calls.push('pause'); } };
  let caption = options.caption || { vssId: '.es', languageCode: 'es', privateNativeCaption: true };
  const payload = { videoDetails: { videoId: id, lengthSeconds: '90', title: 'Current content' },
    playabilityStatus: { status: 'OK' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.es', languageCode: 'es' }] } },
    streamingData: { serverAbrStreamingUrl: 'stale-manifest' }, playerAds: [{}], adPlacements: [{}], adSlots: [{}], adBreakHeartbeatParams: {},
    playerConfig: { mediaCommonConfig: { useServerDrivenAbr: true, unrelatedOption: { preserved: true } },
      playbackStartConfig: { startSeconds: 72 }, webPlayerConfig: { nativeUi: true } }, ...options.payload };
  let response = payload;
  let state;
  const player = { querySelector: () => node, getPlayerResponse: () => response,
    getOption: kind => kind === 'captions' ? caption : null,
    pauseVideo() { node.paused = true; calls.push('native-pause'); },
    loadVideoByPlayerVars(args, preservePlaylist) { calls.push(args); nativeLoads.push({ args, preservePlaylist });
      response = args.raw_player_response; options.onLoad?.(state, args, preservePlaylist); },
    setOption(kind, name, value) { captionCalls.push({ kind, name, value }); caption = value; }, ...options.player };
  state = fixture({ payload, player, ...options.fixture });
  const url = tag => `https://r1.googlevideo.com/videoplayback?expire=600&itag=${tag}`;
  const video = { itag: 137, url: url(137), mimeType: 'video/mp4; codecs="avc1.640028"',
    initRange: { start: 0, end: 99 }, indexRange: { start: 100, end: 199 }, contentLength: 10000,
    expiresAt: 600000, bitrate: 800000, width: 1920, height: 1080, qualityLabel: '1080p' };
  const audio = { itag: 140, url: url(140), mimeType: 'audio/mp4; codecs="mp4a.40.2"',
    initRange: { start: 0, end: 49 }, indexRange: { start: 50, end: 99 }, contentLength: 5000,
    expiresAt: 600000, bitrate: 128000, audioChannels: 2,
    audioTrack: { id: 'es.1', label: 'Spanish', isDefault: true, isAutoDubbed: false } };
  const sourcePlan = { kind: 'adaptive_mp4', durationSeconds: 90, expiresAt: 600000, video, audio, audioVariants: [audio] };
  const intent = { videoId: id, nativeTimeline: 'content', durationSeconds: 90, positionSeconds: 12,
    paused: false, volume: .35, muted: true, rate: 1.25 };
  const preferences = { audioKnown: true, captionsKnown: true, audioTrackId: 'es.1', audioTrackCount: 1, audioTracks: [{ id: 'es.1' }],
    captionTrackId: '.es', captionLanguage: 'es', captionsEnabled: true };
  function nativeRequest(type, extra = {}, event = {}) {
    state.request({ ...event, data: { type, source: 'content_bridge',
      payload: { videoId: id, requestId: 'native123456789012', issuedAt: state.getNow(), commitDeadline: state.getNow() + 2000,
        source: sourcePlan, playbackIntent: intent, preferences, ...extra }, ...event.data } });
  }
  const apply = (extra, event) => nativeRequest('FilterTube_ApplyNativeContentSource', extra, event);
  const cancel = extra => nativeRequest('FilterTube_CancelNativeContentSource', extra);
  const read = extra => nativeRequest('FilterTube_ReadNativeContentState', extra);
  Object.assign(state, { apply, cancel, read });
  return { ...state, node, calls, captionCalls, nativeLoads, sourcePlan, intent, preferences, original: payload, apply, cancel, read,
    setResponse(value) { response = value; }, setCaption(value) { caption = value; } };
}
const plain = value => JSON.parse(JSON.stringify(value));

test('native source commit uses current native metadata and preserves captions, UI config and paused playback', () => {
  const state = nativeFixture();
  const before = plain(state.original);
  state.window.ytInitialPlayerResponse = { videoDetails: { videoId: 'foreign0001' } };
  state.apply();
  const commits = state.calls.filter(value => typeof value === 'object');
  assert.equal(commits.length, 1);
  const args = commits[0];
  assert.equal(args.video_id, id);
  assert.equal(args.pause_at_start, 1); assert.equal(args.autoplay, 0); assert.equal(args.resume, '1');
  assert.equal(args.startSeconds, 12);
  assert.equal(args.raw_player_response.playerConfig.playbackStartConfig.startSeconds, 12);
  assert.equal(args.raw_player_response.playerConfig.mediaCommonConfig.useServerDrivenAbr, false);
  assert.deepEqual(plain(args.raw_player_response.playerConfig.mediaCommonConfig.unrelatedOption), { preserved: true });
  assert.deepEqual(plain(args.raw_player_response.captions), before.captions);
  assert.deepEqual(plain(state.original), before, 'native original response must remain untouched');
  assert.equal(args.raw_player_response.streamingData.adaptiveFormats.length, 2);
  assert.equal('serverAbrStreamingUrl' in args.raw_player_response.streamingData, false);
  for (const key of ['playerAds', 'adPlacements', 'adSlots', 'adBreakHeartbeatParams']) assert.equal(key in args.raw_player_response, false);
  assert.equal(state.node.paused, true);
  assert.equal(state.node.volume, .35); assert.equal(state.node.playbackRate, 1.25); assert.equal(state.node.muted, true);
  assert.strictEqual(state.captionCalls[0].value.privateNativeCaption, true);
  assert.equal(state.sent[0][0].payload.applied, true);
  assert.equal(state.sent[0][0].payload.requestId, 'native123456789012');
  assert.equal(JSON.stringify(state.sent).includes('googlevideo'), false, 'receipt never discloses signed source URLs');
});

for (const [name, mutate] of [
  ['expired URL', state => { state.sourcePlan.video.url = 'https://r1.googlevideo.com/videoplayback?expire=1'; state.sourcePlan.video.expiresAt = 1000; }],
  ['foreign media host', state => { state.sourcePlan.video.url = 'https://googlevideo.com.evil.test/videoplayback?expire=600'; }],
  ['unresolved signature transform', state => { state.sourcePlan.video.url += '&n=unresolved'; }],
  ['duplicate expiry', state => { state.sourcePlan.video.url += '&expire=600'; }],
  ['URL and descriptor expiry mismatch', state => { state.sourcePlan.video.expiresAt = 600001; }],
  ['invalid byte bounds', state => { state.sourcePlan.audio.indexRange.end = 5000; }],
  ['overlapping initialization and index', state => { state.sourcePlan.video.indexRange.start = 99; }],
  ['oversized video dimensions', state => { state.sourcePlan.video.height = 2160; }],
  ['unknown audio identities', state => { state.sourcePlan.audioVariants.push({ ...state.sourcePlan.audio }); }],
  ['too many variants', state => { state.sourcePlan.audioVariants = Array(65).fill(state.sourcePlan.audio); }],
  ['oversized source metadata', state => { state.sourcePlan.untrustedExtra = 'x'.repeat(512 * 1024); }],
  ['nonadaptive source', state => { state.sourcePlan.kind = 'progressive'; }],
  ['stale content position', state => { state.node.currentTime = 30; }],
  ['wrong intent video', state => { state.intent.videoId = 'foreign0001'; }],
  ['mismatched duration', state => { state.sourcePlan.durationSeconds = 180; }],
  ['mismatched native current response', state => { state.setResponse({ videoDetails: { videoId: 'foreign0001' } }); }],
  ['non-OK original playability', state => { state.original.playabilityStatus.status = 'LOGIN_REQUIRED'; }],
  ['original DRM', state => { state.original.drmParams = 'present'; }],
  ['original live stream', state => { state.original.videoDetails.isLive = true; }],
  ['changed caption selection', state => { state.setCaption({ vssId: '.en', languageCode: 'en' }); }],
  ['changed audio selection', state => { state.setAudio({ id: 'en.0' }); }],
  ['unknown feature state', state => { state.preferences.captionsKnown = false; }],
  ['unsupported selected program', state => { state.sourcePlan.audio.audioTrack.id = 'en.0'; }],
  ['oversized native response', state => { state.original.shortDescription = 'x'.repeat(2 * 1024 * 1024); }]
]) test('native source refusal happens before any mutation: ' + name, () => {
  const state = nativeFixture(); mutate(state); state.apply();
  assert.equal(state.calls.length, 0); assert.equal(state.captionCalls.length, 0);
  assert.equal(state.node.paused, false);
  assert.equal(state.sent.length, 1); assert.equal(state.sent[0][0].payload.applied, false);
});

test('cancel before queued apply tombstones the nonce and never loads or pauses untouched native content', () => {
  const state = nativeFixture(); state.cancel(); state.apply();
  assert.equal(state.calls.length, 0);
  assert.equal(state.sent.length, 2);
  assert.equal(state.sent[1][0].payload.reason, 'cancelled');
});

test('cancel after native apply synchronously pauses only the captured current video', () => {
  const state = nativeFixture(); state.apply(); state.node.paused = false; state.cancel();
  assert.equal(state.node.paused, true);
  const count = state.calls.length;
  state.location.search = '?v=foreign0001'; state.node.paused = false; state.cancel();
  assert.equal(state.node.paused, false); assert.equal(state.calls.length, count);
});

test('reentrant cancellation during native load cannot produce a late applied receipt', () => {
  const state = nativeFixture({ onLoad(value) { value.cancel(); } }); state.apply();
  assert.equal(state.sent.length, 2);
  assert.ok(state.sent.every(([result]) => result.payload.applied === false));
  assert.equal(state.sent[1][0].payload.reason, 'cancelled');
  assert.equal(state.node.paused, true);
});

test('duplicate apply is rejected and a native-node replacement prevents success', () => {
  const state = nativeFixture(); state.apply(); state.apply();
  assert.equal(state.calls.filter(value => typeof value === 'object').length, 1);
  assert.equal(state.sent[1][0].payload.reason, 'request_replayed');
  const replaced = nativeFixture({ onLoad(value) { value.player.querySelector = () => ({ pause() {} }); } });
  replaced.apply(); assert.equal(replaced.sent[0][0].payload.applied, false);
  assert.equal(replaced.sent[0][0].payload.reason, 'native_player_changed');
});

test('unrelated native timeline starts at zero without inheriting an advert position', () => {
  const state = nativeFixture(); state.intent.nativeTimeline = 'unrelated'; state.node.currentTime = 57; state.apply();
  const args = state.calls.find(value => typeof value === 'object');
  assert.equal(args.startSeconds, 0);
  assert.equal(args.raw_player_response.playerConfig.playbackStartConfig.startSeconds, 0);
});

test('native state reads are fresh, bounded and independent of source-request throttling', () => {
  const state = nativeFixture(); state.request(); state.read(); state.setCaption({ vss_id: '.en', languageCode: 'en' }); state.read();
  assert.equal(state.sent.length, 3);
  assert.equal(state.sent[1][0].type, 'FilterTube_NativeContentState');
  assert.equal(state.sent[1][0].payload.preferences.captionTrackId, '.es');
  assert.equal(state.sent[2][0].payload.preferences.captionTrackId, '.en');
  assert.equal(state.sent[2][0].payload.videoIdMatched, true);
  assert.equal(JSON.stringify(state.sent.slice(1)).includes('privateNativeCaption'), false);
  assert.equal(JSON.stringify(state.sent.slice(1)).includes('googlevideo'), false);
  state.setResponse({ videoDetails: { videoId: 'foreign0001' } }); state.read();
  assert.equal(state.sent[3][0].payload.videoIdMatched, false);
  assert.equal(state.sent[3][0].payload.preferences, null);
});

for (const [name, event] of [ ['foreign window', { source: {} }], ['foreign origin', { origin: 'https://example.test' }],
  ['wrong bridge', { data: { source: 'page' } }], ['malformed nonce', { data: { payload: { videoId: id, requestId: 'short' } } }]
]) test('native mutation rejects invalid envelope: ' + name, () => {
  const state = nativeFixture(); state.apply({}, event);
  assert.equal(state.calls.length, 0); assert.equal(state.sent.length, 0);
});

test('synthetic und single-program evidence never creates a native alternate-language choice', () => {
  const state = nativeFixture({ fixture: { selectedAudio: { id: 'und' }, tracks: [] } });
  state.preferences.audioTrackId = 'und'; state.preferences.audioTrackCount = 0; state.preferences.audioTracks = [];
  state.sourcePlan.audio.audioTrack = { id: 'und', label: '', isDefault: true, singleProgram: true };
  state.apply();
  const args = state.calls.find(value => typeof value === 'object');
  assert.ok(args);
  const audio = args.raw_player_response.streamingData.adaptiveFormats.find(row => row.itag === 140);
  assert.equal('audioTrack' in audio, false);
  assert.equal(state.sent[0][0].payload.applied, true);
});

test('distinct native xtags retain alternate programs sharing an itag and selected audio becomes native default', () => {
  const state = nativeFixture();
  state.sourcePlan.audio.xtags = 'lang=es'; state.sourcePlan.audio.url += '&xtags=lang%3Des';
  const english = { ...state.sourcePlan.audio, xtags: 'lang=en',
    url: state.sourcePlan.audio.url.replace('lang%3Des', 'lang%3Den'),
    audioTrack: { id: 'en.0', label: 'English', isDefault: true } };
  state.sourcePlan.audioVariants.push(english);
  state.apply();
  const args = state.calls.find(value => typeof value === 'object');
  assert.ok(args);
  const rows = args.raw_player_response.streamingData.adaptiveFormats.filter(row => row.audioTrack);
  assert.equal(rows.length, 2);
  assert.deepEqual(plain(rows.map(row => [row.xtags, row.audioTrack.id, row.audioTrack.audioIsDefault])),
    [['lang=es', 'es.1', true], ['lang=en', 'en.0', false]]);
});

for (const [name, mutate] of [
  ['duplicate native itag without xtags', state => { state.sourcePlan.audioVariants.push({ ...state.sourcePlan.audio,
    url: state.sourcePlan.audio.url + '&lang=en', audioTrack: { id: 'en.0', label: 'English' } }); }],
  ['unmatched URL tags', state => { state.sourcePlan.audio.xtags = 'lang=en'; state.sourcePlan.audio.url += '&xtags=lang%3Des'; }],
  ['multiple URL tags', state => { state.sourcePlan.audio.url += '&xtags=a&xtags=b'; }],
  ['oversized native tags', state => { state.sourcePlan.audio.xtags = 'x'.repeat(513); }],
  ['caption API unavailable while captions enabled', state => { state.player.setOption = undefined; }],
  ['unknown native audio tracks', state => { state.player.getAvailableAudioTracks = undefined; }],
  ['DRM in progressive original formats', state => { state.original.streamingData.formats = [{ drmFamilies: ['WIDEVINE'] }]; }],
  ['upcoming original content', state => { state.original.videoDetails.isUpcoming = true; }],
  ['control character in codec', state => { state.sourcePlan.video.mimeType = 'video/mp4;\ncodecs="avc1.640028"'; }]
]) test('native transport and feature integrity refusal: ' + name, () => {
  const state = nativeFixture(); mutate(state); state.apply();
  assert.equal(state.calls.length, 0); assert.equal(state.sent[0][0].payload.applied, false);
});

test('native caption-off snapshot stays off and a native source refusal remains paused', () => {
  const off = nativeFixture({ caption: {} });
  Object.assign(off.preferences, { captionsEnabled: false, captionTrackId: '', captionLanguage: '' });
  off.apply();
  assert.deepEqual(plain(off.captionCalls[0].value), {});
  assert.equal(off.sent[0][0].payload.applied, true);
  const refused = nativeFixture({ player: { loadVideoByPlayerVars() { throw Error('private runtime error with URL'); } } });
  refused.apply();
  assert.equal(refused.node.paused, true);
  assert.equal(refused.sent[0][0].payload.reason, 'native_source_failed');
  assert.equal(JSON.stringify(refused.sent).includes('private runtime error'), false);
});

test('tombstones expire after one minute and storage evicts the oldest beyond 32 nonces', () => {
  const expired = nativeFixture(); expired.cancel(); expired.setNow(70000); expired.apply();
  assert.equal(expired.sent[1][0].payload.applied, true);
  const state = nativeFixture(); state.cancel();
  for (let index = 0; index < 32; index++) state.cancel({ requestId: 'cancel' + String(index).padStart(16, '0') });
  state.apply();
  assert.equal(state.sent.at(-1)[0].payload.applied, true);
});

test('a cancellation for a different request cannot pause an active native transaction', () => {
  const state = nativeFixture(); state.apply(); state.node.paused = false;
  const previous = state.calls.length;
  state.cancel({ requestId: 'different123456789' });
  assert.equal(state.node.paused, false); assert.equal(state.calls.length, previous);
  state.cancel(); assert.equal(state.node.paused, true);
});

test('source state read bounds oversized track collections without exposing native objects', () => {
  const state = nativeFixture({ fixture: { tracks: Array.from({ length: 65 }, (_, index) => ({ id: 'audio' + index, privateField: true })) } });
  state.read();
  assert.equal(state.sent[0][0].payload.preferences.audioTrackCount, 65);
  assert.equal(state.sent[0][0].payload.preferences.audioTracks.length, 0);
  assert.equal(JSON.stringify(state.sent).includes('privateField'), false);
});

test('an available alternate native audio program cannot disappear during handoff', () => {
  const state = nativeFixture({ fixture: { tracks: [{ id: 'es.1' }, { id: 'en.0' }] } });
  state.preferences.audioTrackCount = 2; state.preferences.audioTracks = [{ id: 'es.1' }, { id: 'en.0' }];
  state.apply();
  assert.equal(state.calls.length, 0);
  assert.equal(state.sent[0][0].payload.reason, 'native_audio_unsupported');
});

test('an asynchronous caption setter is never accepted as a completed native source transaction', async () => {
  const state = nativeFixture({ player: { setOption: () => Promise.reject(Error('private native error')) } });
  state.apply(); await state.flush();
  assert.equal(state.node.paused, true);
  assert.equal(state.sent[0][0].payload.applied, false);
  assert.equal(state.sent[0][0].payload.reason, 'native_captions_unavailable');
});

for (const [name, values] of [
  ['missing issuance', { issuedAt: undefined }],
  ['missing deadline', { commitDeadline: undefined }],
  ['fractional issuance', { issuedAt: 9999.5 }],
  ['future issuance', { issuedAt: 10001 }],
  ['expired deadline', { issuedAt: 8000, commitDeadline: 10000 }],
  ['stale issuance', { issuedAt: 7999, commitDeadline: 10001 }],
  ['oversized TTL', { issuedAt: 10000, commitDeadline: 12001 }],
  ['negative TTL', { issuedAt: 10000, commitDeadline: 9999 }],
  ['nonfinite deadline', { commitDeadline: Infinity }]
]) test('native apply commit window rejects before mutation: ' + name, () => {
  const state = nativeFixture(); state.apply(values);
  assert.equal(state.calls.length, 0);
  assert.equal(state.sent[0][0].payload.reason, 'commit_deadline_invalid');
});

test('delayed apply cannot reactivate after its cancellation tombstone expires or is evicted', () => {
  for (const evict of [false, true]) {
    const state = nativeFixture();
    const delayed = { issuedAt: state.getNow(), commitDeadline: state.getNow() + 2000 };
    state.cancel();
    if (evict) for (let index = 0; index < 32; index++) state.cancel({ requestId: 'cancel' + String(index).padStart(16, '0') });
    state.setNow(evict ? 12001 : 70001);
    state.apply(delayed);
    assert.equal(state.calls.length, 0);
    assert.equal(state.sent.at(-1)[0].payload.applied, false);
    assert.equal(state.sent.at(-1)[0].payload.reason, 'commit_deadline_invalid');
  }
});

test('source projection prefers exact current native response over stale same-video watch data', () => {
  const stale = { videoDetails: { videoId: id, title: 'Stale watch data' }, playabilityStatus: { status: 'OK' } };
  const fresh = { videoDetails: { videoId: id, title: 'Fresh native data' }, playabilityStatus: { status: 'OK' } };
  const state = fixture({ payload: stale, player: { getPlayerResponse: () => fresh } });
  state.request();
  assert.equal(state.sent[0][0].payload.playerResponse.videoDetails.title, 'Fresh native data');
  const foreign = fixture({ payload: stale, player: { getPlayerResponse: () => ({ videoDetails: { videoId: 'foreign0001' } }) } });
  foreign.request();
  assert.equal(foreign.sent[0][0].payload.playerResponse.videoDetails.title, 'Stale watch data');
});

test('a transient native response getter failure keeps bounded watch-response fallback available', () => {
  const state = fixture({ player: { getPlayerResponse() { throw Error('native unavailable'); } } });
  state.request();
  assert.equal(state.sent.length, 1);
  assert.equal(state.sent[0][0].payload.playerResponse.videoDetails.videoId, id);
});

test('native handoff preserves the actual playlist object and index without reconstructing a queue', () => {
  const queue = { listId: 'RDcontent0001', index: 7, items: [{ videoId: id }, { videoId: 'nextvideo01' }], order: [1, 0] };
  let nativeQueue = queue;
  const state = nativeFixture({ player: { getPlaylist: () => nativeQueue },
    onLoad(_state, _args, preservePlaylist) { if (!preservePlaylist) nativeQueue = null; } });
  state.apply();
  assert.equal(state.sent[0][0].payload.applied, true);
  assert.strictEqual(state.player.getPlaylist(), queue);
  assert.equal(state.player.getPlaylist().index, 7);
  assert.equal(state.nativeLoads[0].preservePlaylist, true);
  for (const key of ['list', 'playlist', 'index', 'api', 'external_list']) assert.equal(key in state.nativeLoads[0].args, false);
});

test('native handoff retains the current watch-next navigation context locally without inventing entries', () => {
  const watchNext = { currentVideoEndpoint: { watchEndpoint: { videoId: id } },
    contents: { twoColumnWatchNextResults: { autoplay: { autoplay: { sets: [{ autoplayVideo: { watchEndpoint: { videoId: 'nextvideo01' } } }] } } } },
    playerOverlays: { playerOverlayRenderer: { endScreen: { watchNextEndScreenRenderer: { results: [{ endScreenVideoRenderer: { videoId: 'nextvideo01' } }] } } } } };
  const before = plain(watchNext);
  const state = nativeFixture({ player: { getWatchNextResponse: () => watchNext } });
  state.apply();
  assert.equal(state.sent[0][0].payload.applied, true);
  const preserved = state.nativeLoads[0].args.raw_watch_next_response;
  assert.deepEqual(plain(preserved), before);
  assert.notStrictEqual(preserved, watchNext);
  assert.deepEqual(watchNext, before);
  assert.equal(JSON.stringify(state.sent).includes('nextvideo01'), false, 'navigation data must remain in MAIN');
  assert.equal(state.node.paused, true, 'preserving Next never grants autoplay');
});

for (const [name, value] of [
  ['absent API', undefined], ['no loaded navigation', () => null]
]) test('simple native videos remain supported with ' + name, () => {
  const state = nativeFixture({ player: { getWatchNextResponse: value } }); state.apply();
  assert.equal(state.sent[0][0].payload.applied, true);
  assert.equal(state.nativeLoads[0].preservePlaylist, true);
  assert.equal('raw_watch_next_response' in state.nativeLoads[0].args, false);
});

for (const [name, value] of [
  ['foreign current video', { currentVideoEndpoint: { watchEndpoint: { videoId: 'foreign0001' } } }],
  ['invalid primitive', 'untrusted navigation'],
  ['invalid array', []],
  ['oversized response', { oversized: 'x'.repeat(2 * 1024 * 1024) }],
  ['circular response', (() => { const value = {}; value.loop = value; return value; })()]
]) test('invalid watch-next context is rejected before touching native navigation: ' + name, () => {
  const state = nativeFixture({ player: { getWatchNextResponse: () => value } }); state.apply();
  assert.equal(state.calls.length, 0); assert.equal(state.captionCalls.length, 0);
  assert.equal(state.sent[0][0].payload.applied, false);
  assert.equal(state.node.paused, false);
});

test('native UX observations report exact current identity and strict inactive-ad evidence', () => {
  const state = nativeFixture({ player: { getAdState: () => -1 } }); state.read();
  const preferences = state.sent[0][0].payload.preferences;
  assert.equal(preferences.nativeVideoId, id);
  assert.equal(preferences.nativeAdInactive, true);
  assert.equal(preferences.audioTrackId, 'es.1');
  assert.equal(preferences.captionTrackId, '.es');
});

for (const [name, api] of [
  ['missing API', undefined], ['active advertisement', () => 1], ['other native state', () => 0],
  ['string minus one', () => '-1'], ['null state', () => null], ['throwing API', () => { throw Error('unavailable'); }]
]) test('native UX observation remains unknown when ad state lacks strict evidence: ' + name, () => {
  const state = nativeFixture({ player: { getAdState: api } }); state.read();
  const preferences = state.sent[0][0].payload.preferences;
  assert.equal(preferences.nativeAdInactive, false);
  assert.equal(preferences.nativeVideoId, id);
  assert.equal(preferences.audioTrackId, 'es.1');
  assert.equal(preferences.captionTrackId, '.es');
});

for (const [name, getter, expected] of [
  ['missing native response API', undefined, ''],
  ['malformed native id', () => ({ videoDetails: { videoId: 'short' } }), ''],
  ['foreign native id', () => ({ videoDetails: { videoId: 'foreign0001' } }), 'foreign0001'],
  ['native response API throws', () => { throw Error('transient native failure'); }, '']
]) test('native UX identity never infers current playback from watch-response fallback: ' + name, () => {
  const state = fixture({ player: { getPlayerResponse: getter, getAdState: () => -1 } }); state.request();
  const { playerResponse, preferences } = state.sent[0][0].payload;
  assert.equal(playerResponse.videoDetails.videoId, id, 'watch metadata still provides bounded source context');
  assert.equal(preferences.nativeVideoId, expected);
  assert.equal(preferences.nativeVideoId === id && preferences.nativeAdInactive, false);
  assert.equal(preferences.audioTrackId, 'es.1');
  assert.equal(preferences.captionTrackId, '.es');
});
