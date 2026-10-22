import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync('js/content/content_playback_response.js', 'utf8');
const id = 'content0001';
function fixture(overrides = {}) {
  const listeners = [], sent = [];
  const player = { getAudioTrack: () => ({ id: 'es.1' }), getAvailableAudioTracks: () => [{ id: 'es.1' }],
    getOption: kind => kind === 'captions' ? { vss_id: '.es', languageCode: 'es' } : null };
  const payload = { videoDetails: { videoId: id, lengthSeconds: '90' }, playabilityStatus: { status: 'OK' },
    streamingData: { formats: [{ itag: 18, url: 'https://r1.googlevideo.com/videoplayback?expire=9999999999' }] },
    playerAds: [{ doNotCopy: true }], adSlots: [{ doNotCopy: true }], trackingParams: 'do-not-copy' };
  const location = { origin: 'https://www.youtube.com', pathname: '/watch', search: `?v=${id}`, ...overrides.location };
  const document = { querySelector: () => ({ playerData: overrides.payload || payload }), getElementById: () => player };
  const window = { addEventListener: (name, callback) => listeners.push(callback), postMessage: (...value) => sent.push(value) };
  const context = vm.createContext({ window, document, location, URLSearchParams, Date,
    fetch() { throw Error('Response bridge must not make network requests'); } });
  vm.runInContext(source, context);
  function request(extra = {}) {
    const data = { type: 'FilterTube_RequestContentPlayback', source: 'content_bridge',
      payload: { videoId: id, requestId: 'request1234567890' }, ...extra.data };
    listeners[0]({ source: window, origin: location.origin, data, ...extra });
  }
  return { request, sent, player, payload, context, window, listeners };
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
