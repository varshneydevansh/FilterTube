import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const videoId = 'abcdefghijk';
const now = 1700000000000;
const sourceUrl = 'https://rr1---sn-example.googlevideo.com/videoplayback?expire=1900000000&id=main&sig=unmodified%2Bsignature';
const clone = value => JSON.parse(JSON.stringify(value));
const audio = (changes = {}) => ({ itag: 140, url: sourceUrl + '&itag=140', mimeType: 'audio/mp4; codecs="mp4a.40.2"',
  initRange: { start: '0', end: '699' }, indexRange: { start: '700', end: '999' }, contentLength: '8192',
  bitrate: 128000, audioChannels: 2, ...changes });
const video = (changes = {}) => ({ itag: 134, url: sourceUrl + '&itag=134', mimeType: 'video/mp4; codecs="avc1.4d401e"',
  width: 640, height: 360, initRange: { start: '0', end: '749' }, indexRange: { start: '750', end: '1000' },
  contentLength: '16384', bitrate: 400000, ...changes });
const payload = (changes = {}) => ({ videoDetails: { videoId, title: 'Synthetic exact video', lengthSeconds: '215' },
  playabilityStatus: { status: 'OK' }, streamingData: { formats: [], adaptiveFormats: [video(), audio()] }, ...changes });
function runtime() {
  const context = { URL, URLSearchParams, Date, AbortController, TextDecoder, Uint8Array,
    setTimeout, clearTimeout, setInterval, clearInterval, crypto: webcrypto, location: { origin: 'https://www.youtube.com' } };
  vm.createContext(context);
  for (const file of ['js/shared/content_playback_source.js', 'js/shared/content_playback_resolver.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  return context;
}
const visitorData = 'CgtsZXN0dmlzaXRvcg%3D%3D';
const visitorResponse = () => jsonResponse({ responseContext: { visitorData } });
const jsonResponse = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const options = (changes = {}) => ({ videoId, playerResponse: payload(), requirements: { audioTrackId: 'und', audioTrackCount: 0 },
  isCurrent: () => true, canPlayType: () => 'probably', ...changes });
const localAdapter = (value, changes = {}) => ({ id: 'local-fixture', adaptive: true, resolve: () => value, ...changes });
const plain = value => JSON.parse(JSON.stringify(value));

test('packaged resolver exposes only a create contract, without automatic requests or remote evaluation', () => {
  const context = runtime();
  assert.equal(typeof context.FilterTubeContentPlaybackResolver.create, 'function');
  assert.deepEqual(Object.keys(context.FilterTubeContentPlaybackResolver), ['create']);
  const source = fs.readFileSync('js/shared/content_playback_resolver.js', 'utf8');
  assert.doesNotMatch(source, /\beval\s*\(|new\s+Function\s*\(|\bconsole\./);
});

test('fresh default adapter resolves independently supplied MP4 video/audio and excludes advert plans', async () => {
  const context = runtime(); const requests = [];
  const response = payload({ adPlacements: [{ signed: 'never-copy' }], playbackTracking: { secret: 'never-copy' } });
  const original = clone(response);
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({
    fetch: async (url, init) => { requests.push({ url, init }); return url.includes('/visitor_id?') ? visitorResponse() : jsonResponse(response); }
  }));
  assert.equal(result.supported, true); assert.equal(result.resolverId, 'fresh-visionos-json');
  assert.equal(result.source.kind, 'adaptive_mp4');
  assert.equal(result.source.video.url, response.streamingData.adaptiveFormats[0].url);
  assert.equal(result.source.audio.url, response.streamingData.adaptiveFormats[1].url);
  assert.equal(result.source.audio.audioTrack.id, 'und'); assert.equal(result.source.audio.audioTrack.singleProgram, true);
  assert.deepEqual(plain(result.source.video.initRange), { start: 0, end: 749 });
  assert.equal(result.source.durationSeconds, 215); assert.equal(result.source.expiresAt, 1900000000000);
  assert.equal(result.requiresFeatureValidation, true);
  assert.equal(JSON.stringify(result).includes('never-copy'), false);
  assert.deepEqual(response, original);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, '/youtubei/v1/visitor_id?prettyPrint=false');
  const request = requests[1];
  assert.equal(request.url, '/youtubei/v1/player?prettyPrint=false&id=' + videoId);
  assert.equal(request.init.credentials, 'omit'); assert.equal(request.init.redirect, 'error');
  const body = JSON.parse(request.init.body);
  assert.equal(body.videoId, videoId); assert.equal(body.contentCheckOk, false); assert.equal(body.racyCheckOk, false);
  assert.equal(body.context.client.clientName, 'VISIONOS');
  assert.equal(request.init.headers['X-Youtube-Client-Name'], '101');
  assert.equal(body.context.client.clientVersion, request.init.headers['X-Youtube-Client-Version']);
  assert.equal(body.context.client.visitorData, visitorData);
  assert.match(body.cpn, /^[A-Za-z0-9_-]{16}$/);
  assert.equal(JSON.stringify(result).includes(visitorData), false);
  assert.equal(JSON.stringify(result).includes(body.cpn), false);
  assert.doesNotMatch(JSON.stringify(body), /poToken|authorization|cookie|playbackTracking/);
});

test('loaded progressive avoids a new request while retaining untouched captions for mandatory later preparation', async () => {
  const context = runtime(); let requests = 0;
  const captions = { playerCaptionsTracklistRenderer: { captionTracks: [{ vssId: '.en', languageCode: 'en', baseUrl: 'https://www.youtube.com/api/timedtext?v=' + videoId }] } };
  const response = payload({ captions, streamingData: { formats: [{ ...video(), itag: 18,
    mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"' }] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({
    playerResponse: response, requirements: { captionsRequired: true, captionTrackId: '.en' },
    fetch: () => { requests++; assert.fail('loaded source should be sufficient for transport planning'); }
  }));
  assert.equal(result.supported, true); assert.equal(result.resolverId, 'loaded-progressive');
  assert.equal(result.requiresFeatureValidation, true); assert.deepEqual(plain(result.playerResponse.captions), captions);
  assert.equal(requests, 0);
});

test('chooses compatible video no higher than 1080p and the exact selected original audio', async () => {
  const context = runtime();
  const selected = { id: 'en.0', displayName: 'English original', isOriginal: true };
  const response = payload({ streamingData: { adaptiveFormats: [video(), video({ height: 2160 }), video({ height: 1080, width: 1920 }),
    audio({ audioTrack: { id: 'fr.1', displayName: 'French', isAutoDubbed: true }, bitrate: 200000 }),
    audio({ audioTrack: selected }), audio({ audioTrack: selected, bitrate: 100000 })] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options({
    requirements: { audioTrackId: 'en.0', audioTrackCount: 2, preferOriginalAudio: true }
  }));
  assert.equal(result.supported, true); assert.equal(result.source.video.height, 1080);
  assert.equal(result.source.audio.audioTrack.id, 'en.0'); assert.equal(result.source.audio.bitrate, 128000);
  assert.equal(result.source.audioVariants.length, 2); assert.equal(result.capabilities.audio.tracks.length, 2);
});

for (const requirements of [
  { audioTrackId: 'en.0', audioTrackCount: 0 },
  { audioTrackId: 'und', audioTrackCount: 2 },
  { audioTrackId: 'und' },
  { audioTrackId: 'und', audioTrackCount: 0, preferOriginalAudio: true }
]) test('refuses unproven selected audio ' + JSON.stringify(requirements), async () => {
  const context = runtime();
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(payload())] }).resolve(options({ requirements }));
  assert.equal(result.supported, false); assert.equal(result.reason, 'audio_preference_unsupported');
  assert.equal(result.source, null); assert.equal(JSON.stringify(result).includes('unmodified'), false);
});

test('und cannot silently choose an undeclared source when another audio format declares a distinct program', async () => {
  const context = runtime();
  const response = payload({ streamingData: { adaptiveFormats: [video(), audio(), audio({ mimeType: 'audio/webm; codecs="opus"', audioTrack: { id: 'fr.1' } })] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options());
  assert.equal(result.supported, false); assert.equal(result.reason, 'audio_preference_unsupported');
});

for (const [name, modify] of [
  ['unresolved n', row => ({ ...row, url: row.url + '&n=unresolved' })],
  ['signature cipher', row => ({ ...row, signatureCipher: 's=private' })],
  ['expired URL', row => ({ ...row, url: row.url.replace('1900000000', '1600000000') })],
  ['missing expiry', row => ({ ...row, url: row.url.replace('expire=1900000000&', '') })],
  ['duplicate expiry', row => ({ ...row, url: row.url + '&expire=1900000000' })],
  ['foreign host', row => ({ ...row, url: row.url.replace('.googlevideo.com', '.googlevideo.com.evil.invalid') })],
  ['credentials', row => ({ ...row, url: row.url.replace('https://', 'https://user:pass@') })],
  ['port', row => ({ ...row, url: row.url.replace('/videoplayback', ':444/videoplayback') })],
  ['wrong path', row => ({ ...row, url: row.url.replace('/videoplayback', '/arbitrary') })],
  ['missing init', row => ({ ...row, initRange: undefined })],
  ['index beyond length', row => ({ ...row, indexRange: { start: 750, end: 50000 } })],
  ['overlapping ranges', row => ({ ...row, indexRange: { start: 1, end: 900 } })],
  ['noninteger range', row => ({ ...row, initRange: { start: '0.5', end: 699 } })],
  ['missing content length', row => ({ ...row, contentLength: undefined })],
  ['DRM format', row => ({ ...row, drmTrackType: 'WIDEVINE' })]
]) test('refuses adaptive source with ' + name, async () => {
  const context = runtime();
  const response = payload({ streamingData: { adaptiveFormats: [modify(video()), audio()] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options());
  assert.equal(result.supported, false); assert.equal(result.source, null);
  assert.equal(JSON.stringify(result).includes('unmodified'), false);
});

for (const [name, response, reason] of [
  ['wrong video', payload({ videoDetails: { videoId: 'foreignABCD', lengthSeconds: '215' } }), 'video_identity_or_metadata_invalid'],
  ['ambiguous exact video', [payload(), payload()], 'video_identity_or_metadata_invalid'],
  ['login required', payload({ playabilityStatus: { status: 'LOGIN_REQUIRED' } }), 'playability_not_ok'],
  ['live video', payload({ videoDetails: { videoId, lengthSeconds: '215', isLive: true } }), 'live_unsupported'],
  ['DRM response', payload({ drmParams: 'private' }), 'drm_unsupported'],
  ['missing duration', payload({ videoDetails: { videoId } }), 'duration_invalid'],
  ['malicious direct adapter source', { supported: true, source: { kind: 'progressive', url: 'https://evil.invalid/' } }, 'video_identity_or_metadata_invalid']
]) test('custom adapter metadata is independently validated: ' + name, async () => {
  const context = runtime();
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options());
  assert.equal(result.supported, false); assert.equal(result.reason, reason);
});

test('does not use another adapter or fresh request to override an original access denial', async () => {
  const context = runtime(); let invoked = false;
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(payload(), { resolve() { invoked = true; return payload(); } })] }).resolve(options({
    playerResponse: payload({ playabilityStatus: { status: 'LOGIN_REQUIRED' } })
  }));
  assert.equal(result.reason, 'playability_not_ok'); assert.equal(invoked, false);
});

test('terminal fresh denial does not rotate to another client adapter', async () => {
  const context = runtime(); let secondCalled = false;
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [
    localAdapter(payload({ playabilityStatus: { status: 'LOGIN_REQUIRED' } })),
    localAdapter(payload(), { id: 'second', resolve() { secondCalled = true; return payload(); } })
  ] }).resolve(options());
  assert.equal(result.reason, 'playability_not_ok'); assert.equal(secondCalled, false);
});

for (const [name, factory, reason] of [
  ['HTTP refusal', () => new Response('', { status: 403 }), 'source_response_invalid'],
  ['wrong content type', () => new Response('{}', { headers: { 'content-type': 'text/html' } }), 'source_response_invalid'],
  ['oversize header', () => new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': String(512 * 1024 + 1) } }), 'source_response_limit'],
  ['oversize streamed body', () => new Response(' '.repeat(512 * 1024 + 1), { headers: { 'content-type': 'application/json' } }), 'source_response_limit'],
  ['malformed JSON', () => new Response('{', { headers: { 'content-type': 'application/json' } }), 'source_adapter_failed']
]) test('bounds fresh response: ' + name, async () => {
  const context = runtime();
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ fetch: async () => factory() }));
  assert.equal(result.reason, reason); assert.equal(result.source, null);
});

test('requires an explicit current-authority callback and refuses stale work before requests', async () => {
  const context = runtime(); let calls = 0;
  const resolver = context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(payload(), { resolve() { calls++; return payload(); } })] });
  assert.equal((await resolver.resolve(options({ isCurrent: undefined }))).reason, 'current_authority_required');
  assert.equal((await resolver.resolve(options({ isCurrent: () => false }))).reason, 'source_stale');
  assert.equal(calls, 0);
});

test('abort ends an uncooperative adapter promptly and suppresses later adapters', async () => {
  const context = runtime(); const controller = new AbortController(); let secondCalled = false;
  const resolver = context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [
    localAdapter(null, { resolve: () => new Promise(() => {}) }),
    localAdapter(payload(), { id: 'second', resolve() { secondCalled = true; return payload(); } })
  ] });
  const pending = resolver.resolve(options({ signal: controller.signal }));
  controller.abort();
  assert.equal((await pending).reason, 'source_aborted'); assert.equal(secondCalled, false);
});

test('authority changes during a hung request cancel its signal and close the reader', async () => {
  const context = runtime(); let current = true; let cancelled = false; let requestSignal;
  const body = new ReadableStream({ pull() { return new Promise(() => {}); }, cancel() { cancelled = true; } });
  const pending = context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({
    isCurrent: () => current, fetch: async (url, init) => { requestSignal = init.signal; return new Response(body, { headers: { 'content-type': 'application/json' } }); }
  }));
  await new Promise(resolve => setTimeout(resolve, 10)); current = false;
  assert.equal((await pending).reason, 'source_stale');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(requestSignal.aborted, true); assert.equal(cancelled, true);
});

test('single deadline covers adapters that ignore abort and cannot restart an eight-second budget', async () => {
  const context = runtime(); let clock = now;
  const resolver = context.FilterTubeContentPlaybackResolver.create({ now: () => clock,
    adapters: [localAdapter(null, { resolve: () => new Promise(() => {}) })] });
  const pending = resolver.resolve(options()); clock += 8001;
  assert.equal((await pending).reason, 'source_timeout');
});

test('adapter failures expose a bounded reason rather than signed URLs or thrown payload text', async () => {
  const context = runtime();
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now,
    adapters: [localAdapter(null, { resolve: () => { throw Error(sourceUrl); } })] }).resolve(options());
  assert.equal(result.reason, 'source_adapter_failed'); assert.equal(JSON.stringify(result).includes('unmodified'), false);
});

test('adapter definitions are snapshotted and reject duplicate ids or remote configuration values', async () => {
  const context = runtime(); const api = context.FilterTubeContentPlaybackResolver;
  for (const adapters of [[], [{ id: 'https://remote.invalid', resolve() {} }], [{ id: 'valid', resolve: 'remote code' }], [localAdapter(payload()), localAdapter(payload())]]) {
    assert.throws(() => api.create({ adapters }), /Invalid local resolver adapters/);
  }
  const adapter = localAdapter(payload()); const resolver = api.create({ now: () => now, adapters: [adapter] });
  adapter.resolve = () => { throw Error('changed after creation'); };
  assert.equal((await resolver.resolve(options())).supported, true);
});


test('missing explicit audio selection respects the declared default rather than a louder-bandwidth dub', async () => {
  const context = runtime();
  const response = payload({ streamingData: { adaptiveFormats: [video(),
    audio({ audioTrack: { id: 'fr.1', isAutoDubbed: true }, bitrate: 256000 }),
    audio({ audioTrack: { id: 'en.0', audioIsDefault: true }, bitrate: 128000 })] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options({ requirements: {} }));
  assert.equal(result.supported, true); assert.equal(result.source.audio.audioTrack.id, 'en.0');
  delete response.streamingData.adaptiveFormats[2].audioTrack.audioIsDefault;
  const ambiguous = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options({ requirements: {} }));
  assert.equal(ambiguous.reason, 'audio_preference_unsupported');
});


test('audio bitrate encodings become one canonical program choice and selected source uses that descriptor', async () => {
  const context = runtime();
  const response = payload({ streamingData: { adaptiveFormats: [video(), audio({ bitrate: 64000 }), audio({ bitrate: 128000 })] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options());
  assert.equal(result.supported, true);
  assert.equal(result.source.audioVariants.length, 1);
  assert.equal(result.source.audioVariants[0].audioTrack.id, 'und');
  assert.equal(result.source.audioVariants[0].bitrate, 128000);
  assert.strictEqual(result.source.audio, result.source.audioVariants[0]);
  assert.equal(result.capabilities.audio.switchingSupported, false);
});

test('unidentified audio is not presented as a switchable invented program', async () => {
  const context = runtime();
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(payload())] }).resolve(options({ requirements: { audioTrackCount: 0 } }));
  assert.equal(result.supported, true);
  assert.equal(result.source.audio.audioTrack, null);
  assert.equal(result.source.audioVariants.length, 0);
  assert.equal(result.capabilities.audio.tracks.length, 0);
  assert.equal(result.capabilities.audio.switchingSupported, false);
});

for (const value of [undefined, '', 'bad visitor', '<script>', '%notencoded', 'x'.repeat(4097)]) {
  test('fresh VisionOS refuses invalid visitor data before any media request: ' + String(value).slice(0, 24), async () => {
    const context = runtime(); let calls = 0;
    const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ fetch: async () => {
      calls++; return jsonResponse({ responseContext: { visitorData: value } });
    } }));
    assert.equal(result.supported, false); assert.equal(result.reason, 'source_visitor_invalid');
    assert.equal(calls, 1); assert.equal(result.source, null);
  });
}

for (const [regionCode, suffix] of [['IN', '; IN)'], ['GB', '; GB)'], [undefined, 'Mac OS X)'], ['in', 'Mac OS X)'], ['IN; injected', 'Mac OS X)']]) {
  test('fresh fixed client uses only a validated optional region in its UA: ' + regionCode, async () => {
    const context = runtime(); const bodies = [];
    const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({
      requirements: { audioTrackId: 'und', audioTrackCount: 0, regionCode },
      fetch: async (url, init) => { bodies.push(JSON.parse(init.body)); return url.includes('/visitor_id?') ? visitorResponse() : jsonResponse(payload()); }
    }));
    assert.equal(result.supported, true);
    const first = bodies[0].context.client; const second = bodies[1].context.client;
    assert.equal(first.clientName, 'VISIONOS'); assert.equal(first.clientVersion, '1.04');
    assert.equal(first.osName, 'visionOS'); assert.equal(first.osVersion, '26.6.0.23O770');
    assert.ok(first.userAgent.endsWith(suffix));
    assert.equal(first.visitorData, undefined); assert.equal(second.visitorData, visitorData);
    assert.equal(first.gl, undefined, 'do not invent a country policy for the request');
    assert.equal(bodies[1].contentCheckOk, false); assert.equal(bodies[1].racyCheckOk, false);
  });
}

test('both fresh JSON responses share one aggregate 512 KiB budget', async () => {
  const context = runtime(); let calls = 0;
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ fetch: async url => {
    calls++;
    return url.includes('/visitor_id?') ? jsonResponse({ responseContext: { visitorData }, irrelevant: 'x'.repeat(270 * 1024) })
      : jsonResponse({ ...payload(), irrelevant: 'y'.repeat(270 * 1024) });
  } }));
  assert.equal(result.reason, 'source_response_limit'); assert.equal(result.source, null); assert.equal(calls, 2);
});

test('declared player bytes cannot exceed the remaining aggregate budget after the visitor response', async () => {
  const context = runtime(); let calls = 0; let cancelled = false;
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ fetch: async url => {
    calls++;
    if (url.includes('/visitor_id?')) return jsonResponse({ responseContext: { visitorData }, irrelevant: 'x'.repeat(200 * 1024) });
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    return new Response(body, { headers: { 'content-type': 'application/json', 'content-length': String(400 * 1024) } });
  } }));
  assert.equal(result.reason, 'source_response_limit'); assert.equal(calls, 2);
  await Promise.resolve(); assert.equal(cancelled, true);
});

test('cancelling during the visitor request never starts a subsequent player request', async () => {
  const context = runtime(); const abort = new AbortController(); let calls = 0; let requestSignal;
  const pending = context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ signal: abort.signal,
    fetch: async (url, init) => { calls++; requestSignal = init.signal; return new Promise(() => {}); }
  }));
  for (let i = 0; i < 12; i++) await Promise.resolve();
  assert.equal(calls, 1); abort.abort();
  assert.equal((await pending).reason, 'source_aborted'); assert.equal(requestSignal.aborted, true);
  assert.equal(calls, 1);
});

test('cancelling during the player body stops both request lifecycle and the unread body', async () => {
  const context = runtime(); const abort = new AbortController(); let calls = 0; let cancelled = false; let requestSignal; let readerAcquired = false;
  const pending = context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({ signal: abort.signal,
    fetch: async (url, init) => {
      calls++; requestSignal = init.signal;
      if (url.includes('/visitor_id?')) return visitorResponse();
      const response = new Response(new ReadableStream({ pull() { return new Promise(() => {}); }, cancel() { cancelled = true; } }),
        { headers: { 'content-type': 'application/json' } });
      return { status: response.status, headers: response.headers, redirected: false,
        body: { getReader() { readerAcquired = true; return response.body.getReader(); } } };
    }
  }));
  for (let i = 0; i < 70 && !readerAcquired; i++) await Promise.resolve();
  assert.equal(readerAcquired, true); assert.equal(calls, 2); abort.abort();
  assert.equal((await pending).reason, 'source_aborted'); assert.equal(requestSignal.aborted, true);
  await Promise.resolve(); assert.equal(cancelled, true);
});

test('the second request cannot restart the eight-second deadline consumed by visitor resolution', async () => {
  const context = runtime(); let clock = now; let calls = 0;
  const pending = context.FilterTubeContentPlaybackResolver.create({ now: () => clock }).resolve(options({ fetch: async url => {
    calls++;
    if (url.includes('/visitor_id?')) { clock += 7999; return visitorResponse(); }
    return new Promise(() => {});
  } }));
  for (let i = 0; i < 50 && calls < 2; i++) await Promise.resolve();
  assert.equal(calls, 2); clock += 2;
  assert.equal((await pending).reason, 'source_timeout');
});

test('native adaptive requirement bypasses an otherwise playable loaded progressive response', async () => {
  const context = runtime(); const requests = [];
  const loaded = payload({ streamingData: { formats: [{ ...video(), itag: 18,
    mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"' }] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now }).resolve(options({
    playerResponse: loaded, requirements: { nativeAdaptiveOnly: true, audioTrackId: 'und', audioTrackCount: 0 },
    fetch: async url => { requests.push(url); return url.includes('/visitor_id?') ? visitorResponse() : jsonResponse(payload()); }
  }));
  assert.equal(result.supported, true); assert.equal(result.source.kind, 'adaptive_mp4');
  assert.equal(result.resolverId, 'fresh-visionos-json'); assert.equal(requests.length, 2);
});

test('keeps exact bounded audio identity tags required by the native format catalog', async () => {
  const context = runtime(); const tag = 'acont=original:lang=en';
  const response = payload({ streamingData: { adaptiveFormats: [video(), audio({
    url: sourceUrl + '&itag=140&xtags=' + encodeURIComponent(tag), xtags: tag,
    audioTrack: { id: 'en.0', displayName: 'English original', isOriginal: true }
  })] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] })
    .resolve(options({ requirements: { audioTrackId: 'en.0', audioTrackCount: 1 } }));
  assert.equal(result.supported, true); assert.equal(result.source.audio.xtags, tag);
  assert.equal(result.source.audio.url, response.streamingData.adaptiveFormats[1].url);
});

for (const changes of [
  { xtags: 'x'.repeat(513) }, { xtags: 'lang=en\n' },
  { xtags: 'lang=en', url: sourceUrl + '&xtags=lang%3Dfr' },
  { url: sourceUrl + '&xtags=lang%3Den&xtags=lang%3Dfr' }
]) test('refuses ambiguous or malformed native audio identity tags ' + JSON.stringify(changes).slice(0,90), async () => {
  const context = runtime();
  const response = payload({ streamingData: { adaptiveFormats: [video(), audio(changes)] } });
  const result = await context.FilterTubeContentPlaybackResolver.create({ now: () => now, adapters: [localAdapter(response)] }).resolve(options());
  assert.equal(result.supported, false);
});
