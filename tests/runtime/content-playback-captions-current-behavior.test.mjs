import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const sourcePlanner = createRequire(import.meta.url)('../../js/shared/content_playback_source.js');

const videoId = 'abcdefghijk';
const vtt = 'WEBVTT\n\n00:00.000 --> 00:01.000\nSynthetic 音楽 😀\n';
const url = 'https://www.youtube.com/api/timedtext?v=abcdefghijk&sig=keep%2bBYTES%20here&x=a+b';
const clone = value => JSON.parse(JSON.stringify(value));
const row = (changes = {}) => ({ vssId: '.en', languageCode: 'en', name: { simpleText: 'English' }, baseUrl: url, ...changes });
const response = (rows = [row()]) => ({ videoDetails: { videoId }, playabilityStatus: { status: 'OK' },
  streamingData: { formats: [{ url: 'private-unchanged-media' }] },
  captions: { playerCaptionsTracklistRenderer: { captionTracks: rows, translationLanguages: [{ languageCode: 'hi' }] } } });
function load({ origin = 'https://www.youtube.com/watch?v=abcdefghijk', fakeTimers = false } = {}) {
  const timers = new Map(); let id = 0;
  const context = { URL, AbortController, TextDecoder, Promise, location: { href: origin },
    setTimeout: fakeTimers ? (callback, delay) => { const key = ++id; timers.set(key, { callback, delay }); return key; } : setTimeout,
    clearTimeout: fakeTimers ? key => timers.delete(key) : clearTimeout };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('js/content/content_playback_captions.js', 'utf8'), context);
  return { api: context.FilterTubeContentPlaybackCaptions, timers };
}
function controlled() {
  let controller; const cancellations = [];
  const stream = new ReadableStream({ start(value) { controller = value; }, cancel(reason) { cancellations.push(reason); } }, { highWaterMark: 0 });
  return { stream, cancellations, send: value => controller.enqueue(new TextEncoder().encode(value)), close: () => controller.close() };
}
const options = changes => ({ videoId, fetch: async () => new Response(vtt, { headers: { 'content-type': 'text/vtt' } }), isCurrent: () => true, ...changes });

test('fetches bounded same-origin VTT, preserves signature bytes and clones captions only', async () => {
  const { api } = load(); const input = response(); const before = clone(input); const calls = [];
  const result = await api.prepare(input, options({ fetch: async (request, init) => {
    calls.push({ request, init }); return new Response(vtt, { headers: { 'content-type': 'text/vtt' } });
  } }));
  assert.equal(result.supported, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].request, `${url}&fmt=vtt`);
  assert.equal(calls[0].init.credentials, 'same-origin');
  assert.equal(calls[0].init.redirect, 'error');
  assert.deepEqual(Object.keys(calls[0].init).sort(), ['credentials', 'redirect', 'signal']);
  assert.equal(calls[0].init.signal.aborted, true, 'owned fetch signal is disposed after preparation');
  assert.deepEqual(clone(result.tracks), [{ id: '.en', languageCode: 'en', label: 'English', kind: 'subtitles', vttText: vtt }]);
  assert.equal(result.captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl, `${url}&fmt=vtt`);
  assert.deepEqual(input, before);
  result.captions.playerCaptionsTracklistRenderer.translationLanguages.push({ languageCode: 'fr' });
  assert.deepEqual(input, before, 'returned captions do not alias original nested metadata');
  assert.equal('streamingData' in result, false, 'helper does not copy or expose signed media sources');
});

test('replaces only existing fmt bytes without URLSearchParams reserializing signatures', async () => {
  const { api } = load(); const calls = [];
  const result = await api.prepare(response([row({ baseUrl: `${url}&fmt=json3&another=%7e%2f` })]), options({
    fetch: async request => { calls.push(request); return new Response(vtt); }
  }));
  assert.equal(result.supported, true);
  assert.deepEqual(calls, [`${url}&fmt=vtt&another=%7e%2f`]);
});

for (const badUrl of [
  url.replace('https:', 'http:'), url.replace('www.youtube.com', 'evil.invalid'),
  url.replace('www.youtube.com', 'm.youtube.com'), url.replace('www.youtube.com', 'www.youtube.com.evil.invalid'),
  url.replace('www.youtube.com', 'user:pass@www.youtube.com'), url.replace('www.youtube.com', 'www.youtube.com:444'),
  url.replace('/api/timedtext', '/other'), url.replace('abcdefghijk', 'foreignABCD'),
  `${url}&v=foreignABCD`, `${url}&fmt=json3&fmt=vtt`, `${url}#fragment`, 'data:text/vtt,WEBVTT'
]) {
  test(`unsafe, cross-origin or foreign-video caption URL never fetches: ${badUrl.split('?')[0]}`, async () => {
    const { api } = load(); let calls = 0;
    const result = await api.prepare(response([row({ baseUrl: badUrl })]), options({ fetch: async () => { calls++; return new Response(vtt); } }));
    assert.equal(result.supported, false); assert.equal(calls, 0);
    assert.equal(JSON.stringify(result).includes('keep%2bBYTES'), false);
  });
}

for (const scenario of [
  { input: response(), change: { videoId: 'foreignABCD' } },
  { input: { ...response(), playabilityStatus: { status: 'LOGIN_REQUIRED' } } },
  { input: response(), change: { isCurrent: undefined } },
  { input: response(), change: { isCurrent: () => false } },
  { input: response(Array.from({ length: 33 }, (_, index) => row({ vssId: `.${index}` }))) },
  { input: response([row(), row()]) }
]) {
  test(`invalid authority, playability or track metadata blocks all caption requests: ${JSON.stringify(scenario.change || Object.keys(scenario.input)).slice(0, 40)}`, async () => {
    const { api } = load(); let calls = 0;
    const result = await api.prepare(scenario.input, options({ ...scenario.change, fetch: async () => { calls++; return new Response(vtt); } }));
    assert.equal(result.supported, false); assert.equal(calls, 0);
  });
}

test('selected metadata becomes stale while fetch awaits: no text or prepared captions escape', async () => {
  const { api } = load(); let current = true; let resolve;
  const pending = api.prepare(response(), options({ isCurrent: () => current, fetch: () => new Promise(done => { resolve = done; }) }));
  current = false; resolve(new Response(vtt));
  const result = await pending;
  assert.equal(result.reason, 'caption_stale'); assert.equal(result.captions, null); assert.equal(result.tracks.length, 0);
});

test('external abort settles an ignored pending fetch and clears the timeout', async () => {
  const { api, timers } = load({ fakeTimers: true }); const external = new AbortController(); let signal;
  const pending = api.prepare(response(), options({ signal: external.signal, fetch: (url, init) => { signal = init.signal; return new Promise(() => {}); } }));
  external.abort();
  assert.equal((await pending).reason, 'caption_aborted'); assert.equal(signal.aborted, true); assert.equal(timers.size, 0);
});

test('eight-second total timeout bounds even a fetch that ignores cancellation', async () => {
  const { api, timers } = load({ fakeTimers: true });
  const pending = api.prepare(response(), options({ fetch: () => new Promise(() => {}) }));
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0]; assert.equal(timer.delay, 8000); timer.callback();
  assert.equal((await pending).reason, 'caption_timeout'); assert.equal(timers.size, 0);
});

test('abort during a pending body read cancels and unlocks the upstream reader', async () => {
  const { api } = load(); const source = controlled(); const external = new AbortController();
  const pending = api.prepare(response(), options({ signal: external.signal, fetch: async () => new Response(source.stream) }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(source.stream.locked, true);
  external.abort();
  assert.equal((await pending).reason, 'caption_aborted');
  assert.equal(source.cancellations.length, 1); assert.equal(source.stream.locked, false);
});

test('aggregate byte budget covers all tracks and cancels the failing body without exposing partial success', async () => {
  const { api } = load(); const source = controlled(); let calls = 0;
  const pending = api.prepare(response([row(), row({ vssId: '.hi', languageCode: 'hi' })]), options({
    maxBytes: new TextEncoder().encode(vtt).byteLength + 4,
    fetch: async () => ++calls === 1 ? new Response(vtt) : new Response(source.stream)
  }));
  await new Promise(resolve => setImmediate(resolve));
  source.send('WEBVTT\nmore');
  const result = await pending;
  assert.equal(result.reason, 'caption_size_limit'); assert.equal(result.tracks.length, 0);
  assert.equal(source.cancellations.length, 1); assert.equal(source.stream.locked, false);
});

for (const [body, init, reason] of [
  ['{"not":"captions"}', { headers: { 'content-type': 'text/vtt' } }, 'caption_not_vtt'],
  ['<html>not captions</html>', {}, 'caption_not_vtt'],
  ['WEBVTTwrong\n', {}, 'caption_not_vtt'],
  [vtt, { status: 403 }, 'caption_http_error'],
  [vtt, { headers: { 'content-length': '3000000' } }, 'caption_size_limit']
]) {
  test(`unusable HTTP/body response fails honestly: ${reason}`, async () => {
    const { api } = load();
    const result = await api.prepare(response(), options({ fetch: async () => new Response(body, init) }));
    assert.equal(result.reason, reason); assert.equal(result.supported, false);
  });
}

test('one-byte UTF-8 chunks and missing MIME header still preserve a genuine VTT response', async () => {
  const { api } = load(); const bytes = new TextEncoder().encode(vtt);
  const body = new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); } });
  const result = await api.prepare(response(), options({ fetch: async () => new Response(body) }));
  assert.equal(result.supported, true); assert.equal(result.tracks[0].vttText, vtt);
});


test('prepared caption metadata and text compose with the actual progressive planner without modifying the original Player response', async () => {
  const { api } = load(); const input = response();
  input.streamingData = { formats: [{ itag: 18, width: 640, height: 360,
    mimeType: 'video/mp4; codecs="avc1.42001E, mp4a.40.2"',
    url: 'https://rr1.googlevideo.com/videoplayback?expire=1900000000&sig=media-secret' }] };
  const before = clone(input);
  assert.equal(sourcePlanner.plan({ playerResponse: input, videoId, canPlayType: () => 'probably' }).reason, 'captions_unsupported');
  const prepared = await api.prepare(input, options());
  const planned = sourcePlanner.plan({ playerResponse: { ...input, captions: prepared.captions }, videoId,
    canPlayType: () => 'probably', requirements: { captionMode: 'native_vtt' } });
  assert.equal(planned.supported, true);
  assert.equal(planned.source.captionTracks[0].id, prepared.tracks[0].id);
  assert.equal(planned.source.captionTracks[0].languageCode, prepared.tracks[0].languageCode);
  assert.equal(prepared.tracks[0].vttText, vtt);
  assert.deepEqual(input, before);
});

test('authority change during a body read cancels the source and never returns prepared text', async () => {
  const { api } = load(); const source = controlled(); let current = true;
  const pending = api.prepare(response(), options({ isCurrent: () => current, fetch: async () => new Response(source.stream) }));
  await new Promise(resolve => setImmediate(resolve));
  current = false; source.send(vtt);
  const result = await pending;
  assert.equal(result.reason, 'caption_stale'); assert.equal(result.tracks.length, 0);
  assert.equal(source.cancellations.length, 1); assert.equal(source.stream.locked, false);
});

test('HTTP failure cancels even an unread response body rather than retaining a reader', async () => {
  const { api } = load(); const source = controlled();
  const result = await api.prepare(response(), options({ fetch: async () => new Response(source.stream, { status: 403 }) }));
  assert.equal(result.reason, 'caption_http_error');
  assert.equal(source.cancellations.length, 1); assert.equal(source.stream.locked, false);
});
