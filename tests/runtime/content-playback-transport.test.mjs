import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const sourceCode = fs.readFileSync('js/content/content_playback_transport.js', 'utf8');

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, new Set());
    this.listeners.get(name).add(callback);
  }
  removeEventListener(name, callback) { this.listeners.get(name)?.delete(callback); }
  emit(name) { for (const callback of [...(this.listeners.get(name) || [])]) callback({ type: name }); }
}

function sidx({ count = 8, bytes = 16, ticks = 5000, version = 0, earliest = 0, firstOffset = 0, referenceType = 0 } = {}) {
  const data = new Uint8Array((version ? 40 : 32) + count * 12), view = new DataView(data.buffer);
  view.setUint32(0, data.length); data.set([115, 105, 100, 120], 4); data[8] = version;
  view.setUint32(12, 1); view.setUint32(16, 1000);
  let cursor = 20;
  for (const value of [earliest, firstOffset]) {
    if (version) { view.setUint32(cursor, Math.floor(value / 4294967296)); view.setUint32(cursor + 4, value >>> 0); cursor += 8; }
    else { view.setUint32(cursor, value); cursor += 4; }
  }
  cursor += 2; view.setUint16(cursor, count); cursor += 2;
  for (let index = 0; index < count; index++) {
    view.setUint32(cursor, bytes | (referenceType ? 0x80000000 : 0));
    view.setUint32(cursor + 4, ticks); view.setUint32(cursor + 8, 0x90000000); cursor += 12;
  }
  return data;
}

function mediaDescriptor(type, options = {}) {
  const index = options.index || sidx(options);
  const content = new Uint8Array(8 + index.length + (options.count || 8) * (options.bytes || 16));
  content.set([0, 0, 0, 8, 102, 116, 121, 112]); content.set(index, 8); content.fill(type === 'video' ? 86 : 65, 8 + index.length);
  return { descriptor: {
    url: `https://r1.googlevideo.com/videoplayback?track=${type}`,
    mimeType: type === 'video' ? 'video/mp4; codecs="avc1.42001E"' : 'audio/mp4; codecs="mp4a.40.2"',
    initRange: { start: 0, end: 7 }, indexRange: { start: 8, end: 8 + index.length - 1 }, contentLength: content.length
  }, content };
}

function fixture({ readableRange = true, count = 8, ticks = 5000, responseChange, descriptorChange, alternateAudio = false, bodyDelay, stallAppend = false, cancelNeverSettles = false, segmentBytes = 16 } = {}) {
  const calls = [], instances = [], errors = [], revoked = [], timers = new Map(); let nextTimer = 0, valid = true;
  const sources = ['video', 'audio'].map(type => mediaDescriptor(type, { count, ticks, bytes: segmentBytes }));
  const duration = count * ticks / 1000;
  const source = { kind: 'adaptive_mp4', video: sources[0].descriptor, audio: sources[1].descriptor,
    durationSeconds: duration, expiresAt: Date.now() + 60000 };
  if (alternateAudio) {
    const alternate = mediaDescriptor('audio-es', { count, ticks, bytes: segmentBytes }); sources.push(alternate);
    sources[1].descriptor.audioTrack = { id: 'en', label: 'English' }; alternate.descriptor.audioTrack = { id: 'es', label: 'Español' };
    source.audioTrackId = 'en'; source.audioVariants = [sources[1].descriptor, alternate.descriptor];
  }
  descriptorChange?.(source);
  class Buffer extends Events {
    constructor(type) { super(); this.type = type; this.updating = false; this.appends = []; this.removes = []; }
    appendBuffer(bytes) { assert.equal(this.updating, false); this.updating = true; this.appends.push(new Uint8Array(bytes));
      assert.equal(instances[0].buffers.length, 2, 'both codec buffers exist before either initialization append');
      if (!stallAppend) queueMicrotask(() => { this.updating = false; this.emit('updateend'); }); }
    remove(start, end) { assert.equal(this.updating, false); this.updating = true; this.removes.push({ start, end });
      queueMicrotask(() => { this.updating = false; this.emit('updateend'); }); }
    abort() { this.updating = false; }
  }
  class MediaSource extends Events {
    static isTypeSupported(mime) { return /^(video|audio)\/mp4/.test(mime); }
    constructor() { super(); this.readyState = 'closed'; this.buffers = []; instances.push(this); }
    addSourceBuffer(type) { const buffer = new Buffer(type); this.buffers.push(buffer); return buffer; }
    endOfStream() { this.readyState = 'ended'; }
  }
  class LocalURL extends URL {}
  LocalURL.createObjectURL = value => {
    queueMicrotask(() => { value.readyState = 'open'; value.emit('sourceopen'); });
    return `blob:transport-${instances.length}`;
  };
  LocalURL.revokeObjectURL = value => revoked.push(value);
  const video = new Events(); video.currentTime = 0; video.src = '';
  video.paused = false; video.playCalls = 0; video.pauseCalls = 0;
  video.pause = () => { video.paused = true; video.pauseCalls++; video.emit('pause'); };
  video.play = async () => { video.paused = false; video.playCalls++; video.emit('play'); };
  video.removeAttribute = name => { if (name === 'src') video.src = ''; }; video.load = () => {};
  const window = { MediaSource,
    setTimeout(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay, interval: false }); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval(callback, delay) { const id = ++nextTimer; timers.set(id, { callback, delay, interval: true }); return id; },
    clearInterval(id) { timers.delete(id); } };
  const mediaByUrl = new Map(sources.map(item => [item.descriptor.url, item]));
  const fetch = async (requestUrl, options) => {
    const match = /([?&])range=(\d+)-(\d+)$/.exec(requestUrl); assert.ok(match);
    const url = requestUrl.slice(0, match.index);
    const entry = mediaByUrl.get(url);
    assert.ok(entry); assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers?.Range, undefined);
    const start = Number(match[2]), end = Number(match[3]);
    const call = { url, requestUrl, start, end, signal: options.signal }; calls.push(call);
    let chunks = [entry.content.slice(start, end + 1)], status = 206;
    let contentRange = readableRange ? `bytes ${start}-${end}/${entry.content.length}` : null;
    let contentLength = String(end - start + 1);
    const change = responseChange?.(call, { chunks, status, contentRange, contentLength, fullContent: entry.content });
    if (change) { chunks = change.chunks || chunks; status = change.status ?? status;
      contentRange = change.contentRange === undefined ? contentRange : change.contentRange;
      contentLength = change.contentLength === undefined ? contentLength : change.contentLength;
    }
    let used = 0;
    return { status, headers: { get(name) { return name === 'content-range' ? contentRange : name === 'content-length' ? contentLength : null; } },
      body: { getReader() { return {
        async read() { await bodyDelay?.(call); if (options.signal.aborted) throw new Error('aborted');
          return used < chunks.length ? { done: false, value: chunks[used++] } : { done: true }; },
        cancel() { return cancelNeverSettles ? new Promise(() => {}) : Promise.resolve(); }, releaseLock() {}
      }; } } };
  };
  const context = vm.createContext({ window, URL: LocalURL, Uint8Array, DataView, AbortController, Date });
  vm.runInContext(sourceCode, context);
  const api = window.FilterTubeContentPlaybackTransport;
  const transport = () => api.create({ video, source, fetch, isCurrent: () => valid, onError: error => errors.push(error) });
  const settle = async () => { for (let index = 0; index < 30; index++) await new Promise(resolve => setImmediate(resolve)); };
  return { api, transport, video, source, calls, instances, errors, revoked, timers, settle, sources,
    invalidate() { valid = false; }, interval() { for (const timer of [...timers.values()]) if (timer.interval) timer.callback(); } };
}

test('sidx parser calculates absolute fragment ranges and presentation times for versions 0 and 1', () => {
  for (const version of [0, 1]) {
    const state = fixture(); const bytes = sidx({ version, count: 2, bytes: 10, earliest: 2000, firstOffset: 9 });
    const segments = state.api.parseSidx(bytes, { start: 100, end: 100 + bytes.length - 1, contentLength: 1000 });
    assert.equal(segments.length, 2); assert.equal(segments[0].start, 100 + bytes.length + 9);
    assert.equal(segments[0].end, segments[0].start + 9); assert.equal(segments[1].start, segments[0].end + 1);
    assert.equal(segments[0].time, 2); assert.equal(segments[0].endTime, 7); assert.equal(segments[1].endTime, 12);
    assert.equal(segments[0].startsWithSap, true);
  }
});

test('sidx parser rejects nested indexes, zero durations, unsafe integers, bad ranges and overflowing references', () => {
  const state = fixture();
  for (const bytes of [sidx({ referenceType: 1 }), sidx({ ticks: 0 }), sidx({ bytes: 0 }), sidx({ version: 2 }),
    sidx({ version: 1, firstOffset: Number.MAX_SAFE_INTEGER }), sidx({ version: 1, earliest: Number.MAX_SAFE_INTEGER })]) {
    assert.throws(() => state.api.parseSidx(bytes, { start: 8, end: 8 + bytes.length - 1, contentLength: 1000 }));
  }
  const bytes = sidx();
  assert.throws(() => state.api.parseSidx(bytes, { start: 8, end: 8 + bytes.length, contentLength: 1000 }), /invalid_index_range/);
  assert.throws(() => state.api.parseSidx(bytes, { start: 8, end: 8 + bytes.length - 1, contentLength: 150 }), /segment_outside_source/);
  const broken = bytes.slice(); new DataView(broken.buffer).setUint32(16, 0);
  assert.throws(() => state.api.parseSidx(broken, { start: 8, end: 8 + broken.length - 1, contentLength: 1000 }), /invalid_index_timescale/);
});

test('adaptive transport is inert until started and fetches only init, index and bounded lookahead fragments', async () => {
  const state = fixture({ count: 100 }); const transport = state.transport();
  assert.equal(state.calls.length, 0); assert.equal(state.instances.length, 0);
  await transport.start();
  assert.ok(state.calls.length < 18, 'the first playable pair returns before downloading thirty seconds');
  await state.settle();
  assert.equal(state.instances.length, 1); assert.equal(state.instances[0].buffers.length, 2);
  assert.equal(state.calls.length, 18, 'two initialization requests, one tail access sample and six five-second fragments per track');
  assert.equal(state.calls.every(call => call.end - call.start + 1 < 2048), true);
  assert.equal(state.instances[0].buffers.every(buffer => buffer.appends.length === 7), true);
  transport.destroy(); assert.equal(state.video.src, ''); assert.equal(state.timers.size, 0);
  assert.deepEqual(state.revoked, ['blob:transport-1']);
});

test('CORS-hidden Content-Range is accepted only with 206 and exact requested byte counts', async () => {
  const state = fixture({ readableRange: false }); const transport = state.transport(); await transport.start();
  await state.settle();
  assert.equal(state.errors.length, 0); assert.equal(state.calls.length, 18); transport.destroy();
});

test('readable incorrect range, unexpected status, short and overflowing bodies fail without unbounded reads', async () => {
  for (const change of [
    () => ({ contentRange: 'bytes 1-8/999' }), () => ({ status: 204 }),
    (call, response) => ({ chunks: [response.chunks[0].slice(1)] }),
    (call, response) => ({ chunks: [...response.chunks, new Uint8Array(1)] })
  ]) {
    const state = fixture({ responseChange: change }); const transport = state.transport();
    await assert.rejects(transport.start()); assert.equal(state.errors.length, 1);
    assert.equal(state.video.src, ''); assert.equal(state.timers.size, 0);
  }
});

test('query ranges accept actual 200 responses only when their bounded bodies match the exact requested length', async () => {
  for (const readableRange of [false, true]) {
    const state = fixture({ readableRange, responseChange: () => ({ status: 200 }) });
    const transport = state.transport(); await transport.start(); await state.settle();
    assert.equal(state.errors.length, 0); assert.equal(state.calls.length, 18); transport.destroy();
  }
});

test('a 200 full resource, wrong readable length, overflowing or short query-range body is refused', async () => {
  for (const change of [
    (call, response) => ({ status: 200, chunks: [response.fullContent], contentLength: String(response.fullContent.length) }),
    (call, response) => ({ status: 200, chunks: [response.fullContent], contentLength: null }),
    () => ({ status: 200, contentLength: '99999999' }),
    () => ({ status: 200, contentLength: 'not-a-number' }),
    (call, response) => ({ status: 200, chunks: [response.chunks[0].slice(1)], contentLength: null }),
    (call, response) => ({ status: 200, chunks: [...response.chunks, new Uint8Array(1)], contentLength: null })
  ]) {
    const state = fixture({ readableRange: false, responseChange: change });
    await assert.rejects(state.transport().start(), /range_size_mismatch/);
    assert.equal(state.errors.length, 1); assert.equal(state.video.src, '');
    assert.equal(state.calls.every(call => call.signal.aborted), true, 'unread rejected resource bodies are aborted');
  }
});

test('unsigned query ranges append without reserializing existing signatures or opaque query bytes', async () => {
  const suffix = '&sig=a%2Fb%2Bc%3D&opaque=hello+world&x=%7e%2f%2B';
  const state = fixture({ descriptorChange: value => { value.video.url += suffix; value.audio.url += suffix; } });
  const transport = state.transport(); await transport.start(); await state.settle();
  for (const call of state.calls) assert.equal(call.requestUrl, `${call.url}&range=${call.start}-${call.end}`);
  assert.equal(state.calls.every(call => call.url.endsWith(suffix)), true); transport.destroy();
});

test('an existing range or a range declared in signed parameter lists cannot be replaced or appended', () => {
  for (const suffix of ['&range=0-7', '&%72ange=0-7', '&sparams=id%2Crange%2Cexpire', '&lsparams=range', '&sparams=id&sparams=range']) {
    const state = fixture({ descriptorChange: value => { value.video.url += suffix; } });
    assert.throws(() => state.transport(), /signed_range_unsupported/); assert.equal(state.calls.length, 0);
  }
});

test('stream cancellation that never settles cannot hold startup or media cleanup open', async () => {
  const state = fixture({ cancelNeverSettles: true }); const transport = state.transport();
  await transport.start(); await state.settle();
  assert.equal(state.calls.length, 18); assert.equal(state.errors.length, 0);
  transport.destroy(); assert.equal(state.timers.size, 0); assert.equal(state.video.src, '');
});

test('seek fetches indexed fragments near the new time and evicts the previous retained buffers', async () => {
  const state = fixture({ count: 100 }); const transport = state.transport(); await transport.start();
  await state.settle();
  const initialCalls = state.calls.length; state.video.currentTime = 310; state.video.emit('seeking'); await state.settle();
  assert.equal(state.errors.length, 0);
  const mediaStart = state.source.video.indexRange.end + 1;
  const videoCalls = state.calls.slice(initialCalls).filter(call => call.url === state.source.video.url);
  assert.equal(videoCalls[0].start, mediaStart + 62 * 16);
  assert.equal(videoCalls.length, 6); assert.equal(state.instances[0].buffers.every(buffer => buffer.removes.length >= 1), true);
  transport.destroy();
});

test('playhead progression evicts behind ten seconds and extends bounded lookahead', async () => {
  const state = fixture({ count: 100 }); const transport = state.transport(); await transport.start();
  await state.settle();
  state.video.currentTime = 25; state.video.emit('timeupdate'); await state.settle();
  assert.equal(state.errors.length, 0);
  assert.equal(state.instances[0].buffers.every(buffer => buffer.removes.some(range => range.end === 15)), true);
  assert.equal(state.calls.length, 28, 'only five newly needed fragments per track'); transport.destroy();
});

test('authority loss destroys transport and subsequent events cannot make requests', async () => {
  const state = fixture(); const transport = state.transport(); await transport.start();
  state.invalidate(); const before = state.calls.length; state.interval(); await state.settle();
  assert.equal(state.errors[0].code, 'transport_authority_lost'); assert.equal(state.video.src, '');
  state.video.currentTime = 35; state.video.emit('seeking'); await state.settle();
  assert.equal(state.calls.length, before); assert.equal(state.timers.size, 0);
});

test('wrong index content duration is rejected before any media fragment is requested', async () => {
  const state = fixture(); state.source.durationSeconds = 100;
  await assert.rejects(state.transport().start(), /index_content_duration_mismatch/);
  assert.equal(state.calls.length, 4); assert.equal(state.instances.length, 0);
});

test('transport validates exact HTTPS media endpoints and bounded disjoint init/index descriptors', () => {
  for (const change of [
    source => { source.video.url = 'https://googlevideo.com.evil.invalid/videoplayback'; },
    source => { source.audio.url = 'http://r1.googlevideo.com/videoplayback'; },
    source => { source.video.initRange.start = 1; },
    source => { source.audio.indexRange.start = 3; },
    source => { source.video.contentLength = Number.MAX_SAFE_INTEGER + 1; },
    source => { source.audio.mimeType = 'audio/webm; codecs="opus"'; }
  ]) {
    const state = fixture({ descriptorChange: change }); assert.throws(() => state.transport());
    assert.equal(state.calls.length, 0);
  }
});

test('audio switching replaces only the whitelisted audio source around the current playhead and preserves controls', async () => {
  const state = fixture({ alternateAudio: true, count: 100 }); const transport = state.transport();
  await transport.start(); await state.settle();
  Object.assign(state.video, { currentTime: 17, volume: 0.7, playbackRate: 1.5 });
  const result = await transport.switchAudio('es'); await state.settle();
  assert.equal(result.audioTrackId, 'es'); assert.equal(state.errors.length, 0);
  assert.equal(state.video.currentTime, 17); assert.equal(state.video.volume, 0.7); assert.equal(state.video.playbackRate, 1.5);
  assert.equal(state.video.paused, false); assert.equal(state.video.playCalls, 1);
  const alternate = state.source.audioVariants[1];
  const requests = state.calls.filter(call => call.url === alternate.url);
  assert.equal(requests[0].start, 0); assert.equal(requests[1].start, alternate.indexRange.start);
  assert.equal(requests[2].start, alternate.indexRange.end + 1 + 99 * 16, 'later access is sampled before replacing audio');
  assert.equal(requests[3].start, alternate.indexRange.end + 1 + 3 * 16);
  assert.equal(state.instances[0].buffers[1].removes.some(range => range.end === 501), true);
  assert.equal(state.instances[0].buffers[0].removes.some(range => range.end === 501), false);
  transport.destroy();
});

test('audio switching preserves an already-paused video and cannot fetch an unlisted track', async () => {
  const state = fixture({ alternateAudio: true }); const transport = state.transport(); await transport.start(); await state.settle();
  state.video.paused = true; await transport.switchAudio('es');
  assert.equal(state.video.paused, true); assert.equal(state.video.playCalls, 0);
  const before = state.calls.length;
  await assert.rejects(transport.switchAudio('unknown'), /audio_switch_unavailable/);
  assert.equal(state.calls.length, before); transport.destroy();
});

test('copied audio variants cannot be retargeted after transport creation', async () => {
  const state = fixture({ alternateAudio: true }); const expected = state.source.audioVariants[1].url;
  const transport = state.transport(); state.source.audioVariants[1].url = 'https://elsewhere.invalid/leak';
  await transport.start(); await state.settle(); await transport.switchAudio('es');
  assert.ok(state.calls.some(call => call.url === expected)); assert.equal(state.errors.length, 0); transport.destroy();
});

test('an audio fetch failure aborts the transport rather than playing partially replaced or wrong-language audio', async () => {
  const state = fixture({ alternateAudio: true, responseChange: call => call.url.includes('audio-es') ? { status: 403 } : undefined });
  const transport = state.transport(); await transport.start(); await state.settle();
  await assert.rejects(transport.switchAudio('es'), /range_response_required/);
  assert.equal(state.video.paused, true); assert.equal(state.video.playCalls, 0);
  assert.equal(state.video.src, ''); assert.equal(state.errors.length, 1);
});

test('authority loss during initialization cancels every pending request before more source bytes are accepted', async () => {
  const state = fixture({ bodyDelay: call => new Promise((resolve, reject) => {
    call.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
  }) });
  const transport = state.transport(); const pending = transport.start(); await state.settle();
  state.invalidate(); state.interval(); await assert.rejects(pending);
  assert.equal(state.calls.length, 4); assert.equal(state.calls.every(call => call.signal.aborted), true);
  assert.equal(state.errors.length, 1); assert.equal(state.video.src, '');
});

test('seek cancellation drains old segment writes before clearing buffers and appending the new target', async () => {
  let delay = true;
  const state = fixture({ count: 100, bodyDelay: call => {
    const firstOffset = 8 + sidx({ count: 100 }).length;
    if (delay && call.start === firstOffset + 16) return new Promise((resolve, reject) => {
      call.signal.addEventListener('abort', () => reject(new Error('cancelled')), { once: true });
    });
  } });
  const transport = state.transport(); await transport.start(); await state.settle();
  const stale = state.calls.filter(call => call.start === state.source.video.indexRange.end + 17);
  assert.equal(stale.length, 2); delay = false; state.video.currentTime = 310; state.video.emit('seeking'); await state.settle();
  assert.equal(stale.every(call => call.signal.aborted), true); assert.equal(state.errors.length, 0);
  assert.ok(state.calls.some(call => call.start === state.source.video.indexRange.end + 1 + 62 * 16)); transport.destroy();
});

test('stalled SourceBuffer initialization times out and releases owned media resources', async () => {
  const state = fixture({ stallAppend: true }); const transport = state.transport(); const pending = transport.start();
  await state.settle();
  for (const timer of [...state.timers.values()]) if (!timer.interval) timer.callback();
  await assert.rejects(pending, /source_buffer_timeout/);
  assert.equal(state.errors.length, 1); assert.equal(state.video.src, ''); assert.equal(state.timers.size, 0);
});

test('duplicate audio program IDs or a selected descriptor differing from the declared variant are refused', () => {
  const duplicate = fixture({ alternateAudio: true }); duplicate.source.audioVariants[1].audioTrack.id = 'en';
  assert.throws(() => duplicate.transport(), /invalid_audio_variants/);
  const mismatch = fixture({ alternateAudio: true }); mismatch.source.audio = { ...mismatch.source.audio, url: mismatch.source.audio.url + '&different=1' };
  assert.throws(() => mismatch.transport(), /selected_audio_variant_mismatch/);
});

test('a source exposing only its prefix cannot create SourceBuffers or start an owned media timeline', async () => {
  const farOffset = 8 + sidx({ count: 100 }).length + 99 * 16;
  const state = fixture({ count: 100, responseChange: call => call.start === farOffset ? { status: 403 } : undefined });
  const transport = state.transport();
  await assert.rejects(transport.start(), /range_response_required/);
  assert.equal(state.instances.length, 0, 'later access failure occurs before any MediaSource or SourceBuffer exists');
  assert.equal(state.video.src, ''); assert.equal(state.video.playCalls, 0);
  assert.equal(state.calls.length, 6); assert.equal(state.calls.filter(call => call.start === farOffset).length, 2);
  assert.equal(state.errors.length, 1); assert.equal(state.timers.size, 0);
});

test('preflight samples at most 1024 tail bytes on each track and also covers short content', async () => {
  for (const count of [4, 100]) {
    const state = fixture({ count, segmentBytes: 2048 }); const transport = state.transport();
    await transport.start(); await state.settle();
    const mediaStart = state.source.video.indexRange.end + 1;
    const sampledOffset = mediaStart + (count - 1) * 2048;
    const samples = state.calls.slice(4, 6);
    assert.equal(samples.length, 2); assert.equal(samples.every(call => call.start === sampledOffset), true);
    assert.equal(samples.every(call => call.end - call.start + 1 === 1024), true);
    transport.destroy();
  }
});
