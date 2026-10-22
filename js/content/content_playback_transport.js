(function (root) {
    'use strict';
    const INDEX_LIMIT = 1024 * 1024;
    const SEGMENT_LIMIT = 16 * 1024 * 1024;
    const BUFFER_LIMIT = 64 * 1024 * 1024;
    const LOOKAHEAD_SECONDS = 30;
    const RETAIN_BEHIND_SECONDS = 10;
    const REQUEST_TIMEOUT_MS = 10000;

    function problem(code) { const error = new Error(code); error.code = code; return error; }
    const integer = value => Number.isSafeInteger(value) && value >= 0;

    // The index bytes are tied to the descriptor's exact requested byte range.
    // References point to media fragments, never another remotely fetched index.
    function parseSidx(bytes, range) {
        if (!(bytes instanceof Uint8Array) || bytes.byteLength > INDEX_LIMIT || !integer(range?.start)
            || !integer(range?.end) || !integer(range?.contentLength)
            || range.end - range.start + 1 !== bytes.byteLength || range.end >= range.contentLength) {
            throw problem('invalid_index_range');
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const word = offset => { if (offset + 4 > bytes.byteLength) throw problem('truncated_index'); return view.getUint32(offset); };
        const wide = offset => {
            const value = word(offset) * 4294967296 + word(offset + 4);
            if (!integer(value)) throw problem('unsafe_index_integer');
            return value;
        };
        let offset = 0, found = null;
        while (offset + 8 <= bytes.byteLength) {
            let size = word(offset), header = 8;
            const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
            if (size === 1) { size = wide(offset + 8); header = 16; }
            if (size === 0) size = bytes.byteLength - offset;
            if (size < header || offset + size > bytes.byteLength) throw problem('invalid_index_box');
            if (type === 'sidx') {
                if (found) throw problem('ambiguous_index');
                const end = offset + size;
                let cursor = offset + header;
                const take = length => { if (cursor + length > end) throw problem('truncated_index'); const at = cursor; cursor += length; return at; };
                const version = bytes[take(4)];
                if (version !== 0 && version !== 1) throw problem('unsupported_index_version');
                take(4); // reference_ID
                const timescale = word(take(4));
                if (!timescale) throw problem('invalid_index_timescale');
                const earliest = version ? wide(take(8)) : word(take(4));
                const firstOffset = version ? wide(take(8)) : word(take(4));
                take(2);
                const count = view.getUint16(take(2));
                if (!count || count > 20000 || cursor + count * 12 !== end) throw problem('invalid_index_references');
                let byteOffset = range.start + end + firstOffset, time = earliest;
                if (!integer(byteOffset) || byteOffset <= range.end) throw problem('invalid_segment_offset');
                const segments = [];
                for (let index = 0; index < count; index++) {
                    const reference = word(take(4)), ticks = word(take(4)), sap = word(take(4));
                    const sizeBytes = reference & 0x7fffffff;
                    if (reference >>> 31) throw problem('nested_index_unsupported');
                    if (!sizeBytes || sizeBytes > SEGMENT_LIMIT || !ticks) throw problem('invalid_segment_reference');
                    const endByte = byteOffset + sizeBytes - 1, endTime = time + ticks;
                    if (!integer(endByte) || endByte >= range.contentLength || !integer(endTime)) throw problem('segment_outside_source');
                    segments.push(Object.freeze({ index, start: byteOffset, end: endByte,
                        time: time / timescale, endTime: endTime / timescale,
                        startsWithSap: Boolean(sap >>> 31), bytes: sizeBytes }));
                    byteOffset = endByte + 1; time = endTime;
                }
                found = Object.freeze(segments);
            }
            offset += size;
        }
        if (offset !== bytes.byteLength || !found) throw problem('missing_segment_index');
        return found;
    }

    function descriptor(value, type) {
        if (!value || typeof value.url !== 'string' || value.url.length > 16384
            || value.url !== value.url.trim() || /[\u0000-\u0020\u007f]/.test(value.url)) throw problem('invalid_media_descriptor');
        let url;
        try { url = new URL(value.url); } catch (_) { throw problem('invalid_media_descriptor'); }
        if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash
            || !(url.hostname === 'googlevideo.com' || url.hostname.endsWith('.googlevideo.com'))
            || url.pathname !== '/videoplayback' || typeof value.mimeType !== 'string'
            || !value.mimeType.startsWith(`${type}/mp4`) || !/\bcodecs\s*=/.test(value.mimeType)
            || !integer(value.contentLength) || value.contentLength === 0) throw problem('invalid_media_descriptor');
        if (url.searchParams.has('range') || ['sparams', 'lsparams'].some(key => url.searchParams.getAll(key)
            .some(fields => fields.split(',').some(field => field.trim() === 'range')))) throw problem('signed_range_unsupported');
        const init = value.initRange, index = value.indexRange;
        if (!init || !index || ![init.start, init.end, index.start, index.end].every(integer)
            || init.start !== 0 || init.end < init.start || index.start <= init.end || index.end < index.start
            || index.end >= value.contentLength || init.end - init.start + 1 > INDEX_LIMIT
            || index.end - index.start + 1 > INDEX_LIMIT) throw problem('invalid_media_descriptor');
        return Object.freeze({ url: value.url, mimeType: value.mimeType, contentLength: value.contentLength,
            initRange: Object.freeze({ start: init.start, end: init.end }),
            indexRange: Object.freeze({ start: index.start, end: index.end }) });
    }

    function create(options = {}) {
        const { video, source, isCurrent } = options;
        const fetchMedia = options.fetch || root.fetch?.bind(root);
        const MediaSource = root.MediaSource;
        if (!video || source?.kind !== 'adaptive_mp4' || typeof isCurrent !== 'function' || typeof fetchMedia !== 'function'
            || !MediaSource || typeof MediaSource.isTypeSupported !== 'function'
            || !Number.isFinite(source.durationSeconds) || source.durationSeconds <= 0
            || !Number.isFinite(source.expiresAt)) throw problem('unsupported_adaptive_source');
        const duration = source.durationSeconds, expiresAt = source.expiresAt;
        const tracks = ['video', 'audio'].map(type => ({ type, descriptor: descriptor(source[type], type), retained: new Map() }));
        if (tracks.some(track => !MediaSource.isTypeSupported(track.descriptor.mimeType))) throw problem('unsupported_adaptive_codec');
        const audioVariants = new Map();
        let selectedAudioId = typeof source.audioTrackId === 'string' ? source.audioTrackId : source.audio?.audioTrack?.id || '';
        if (source.audioVariants !== undefined) {
            if (!Array.isArray(source.audioVariants) || source.audioVariants.length > 64) throw problem('invalid_audio_variants');
            for (const variant of source.audioVariants) {
                const id = variant?.audioTrack?.id;
                if (typeof id !== 'string' || !id || id.length > 160 || audioVariants.has(id)) throw problem('invalid_audio_variants');
                const value = descriptor(variant, 'audio');
                if (!MediaSource.isTypeSupported(value.mimeType)) throw problem('unsupported_adaptive_codec');
                audioVariants.set(id, value);
            }
            const selected = audioVariants.get(selectedAudioId);
            if (!selected || JSON.stringify(selected) !== JSON.stringify(tracks[1].descriptor)) throw problem('selected_audio_variant_mismatch');
        }
        let destroyed = false, started = false, initialized = false, pumping = null, pumpAgain = false;
        let switching = false, controlEpoch = 0;
        let epoch = 0, resetRequired = false, mediaSource = null, objectUrl = '', timer = 0, retainedBytes = 0, reservedBytes = 0;
        const requests = new Set(), removers = [], lifetime = new AbortController();

        function current() {
            if (destroyed || Date.now() >= expiresAt) return false;
            try { return isCurrent() === true; } catch (_) { return false; }
        }
        function check(expectedEpoch) {
            if (!current()) throw problem('transport_authority_lost');
            if (expectedEpoch !== undefined && expectedEpoch !== epoch) throw problem('obsolete_segment_request');
        }
        function listen(target, name, callback) {
            target.addEventListener(name, callback);
            removers.push(() => target.removeEventListener(name, callback));
        }
        function destroy() {
            if (destroyed) return;
            destroyed = true; lifetime.abort();
            root.clearInterval(timer);
            for (const request of requests) request.abort();
            requests.clear();
            for (const remove of removers.splice(0)) remove();
            for (const track of tracks) {
                try { if (track.buffer?.updating) track.buffer.abort(); } catch (_) { }
                track.retained.clear();
            }
            retainedBytes = 0;
            if (objectUrl) {
                try { if (video.src === objectUrl) { video.removeAttribute('src'); video.load(); } } catch (_) { }
                try { URL.revokeObjectURL(objectUrl); } catch (_) { }
                objectUrl = '';
            }
        }
        function fail(error) {
            if (destroyed) return;
            destroy();
            const code = typeof error?.code === 'string' ? error.code
                : error?.name === 'QuotaExceededError' ? 'adaptive_buffer_quota' : 'adaptive_transport_failed';
            try { options.onError?.({ code }); } catch (_) { }
        }
        async function rangeBytes(track, range, expectedEpoch) {
            check(expectedEpoch);
            const count = range.end - range.start + 1;
            if (!integer(range.start) || !integer(range.end) || count <= 0 || count > SEGMENT_LIMIT
                || range.end >= track.descriptor.contentLength) throw problem('range_outside_source');
            const abort = new AbortController(); requests.add(abort);
            const timeout = root.setTimeout(() => abort.abort(), REQUEST_TIMEOUT_MS);
            let reader = null;
            try {
                // YouTube's range query convention preserves all existing
                // signed bytes and avoids treating an ignored Range header as
                // permission to receive the full resource. A fixed descriptor
                // never contains or signs the appended range field.
                const separator = track.descriptor.url.includes('?') ? '&' : '?';
                const requestUrl = `${track.descriptor.url}${separator}range=${range.start}-${range.end}`;
                const response = await fetchMedia(requestUrl, { method: 'GET', credentials: 'omit',
                    redirect: 'error', signal: abort.signal });
                check(expectedEpoch);
                if (response.status !== 200 && response.status !== 206) throw problem('range_response_required');
                const contentLength = response.headers?.get('content-length');
                if (contentLength !== null && contentLength !== undefined
                    && (!/^\d+$/.test(contentLength) || Number(contentLength) !== count)) throw problem('range_size_mismatch');
                // Googlevideo's CORS response may omit Content-Range from the
                // exposed headers. When readable, it must match exactly.
                const contentRange = response.headers?.get('content-range');
                if (contentRange) {
                    const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(contentRange);
                    if (!match || Number(match[1]) !== range.start || Number(match[2]) !== range.end
                        || Number(match[3]) !== track.descriptor.contentLength) throw problem('range_response_mismatch');
                }
                if (typeof response.body?.getReader !== 'function') throw problem('range_body_unavailable');
                reader = response.body.getReader();
                const bytes = new Uint8Array(count); let used = 0;
                for (;;) {
                    const result = await reader.read(); check(expectedEpoch);
                    if (result.done) break;
                    if (!(result.value instanceof Uint8Array) || used + result.value.byteLength > count) throw problem('range_size_mismatch');
                    bytes.set(result.value, used); used += result.value.byteLength;
                }
                if (used !== count) throw problem('range_size_mismatch');
                return bytes;
            } finally {
                root.clearTimeout(timeout); requests.delete(abort);
                // Also stop unread bodies rejected by their status or exposed
                // length. Cleanup must not await a stalled stream cancellation.
                abort.abort();
                try { reader?.cancel()?.catch(() => {}); } catch (_) { }
                try { reader?.releaseLock(); } catch (_) { }
            }
        }
        function update(track, operation) {
            return new Promise((resolve, reject) => {
                const buffer = track.buffer;
                const cleanup = () => {
                    root.clearTimeout(timeout);
                    buffer.removeEventListener('updateend', done);
                    buffer.removeEventListener('error', failed);
                    lifetime.signal.removeEventListener('abort', cancelled);
                };
                const done = () => { cleanup(); try { check(); resolve(); } catch (error) { reject(error); } };
                const failed = () => { cleanup(); reject(problem('source_buffer_failed')); };
                const cancelled = () => { cleanup(); reject(problem('transport_destroyed')); };
                const timeout = root.setTimeout(() => { cleanup(); reject(problem('source_buffer_timeout')); }, REQUEST_TIMEOUT_MS);
                if (lifetime.signal.aborted) { cancelled(); return; }
                buffer.addEventListener('updateend', done);
                buffer.addEventListener('error', failed);
                lifetime.signal.addEventListener('abort', cancelled, { once: true });
                try { check(); operation(); } catch (error) { cleanup(); reject(error); }
            });
        }
        async function loadTrack(track) {
            const [initBytes, indexBytes] = await Promise.all([
                rangeBytes(track, track.descriptor.initRange), rangeBytes(track, track.descriptor.indexRange)
            ]);
            check();
            track.segments = parseSidx(indexBytes, { ...track.descriptor.indexRange, contentLength: track.descriptor.contentLength });
            if (track.segments[0].time > 1 || Math.abs(track.segments.at(-1).endTime - duration) > 2.5) {
                throw problem('index_content_duration_mismatch');
            }
            return initBytes;
        }
        async function preflight(track) {
            // A decodable prefix does not prove access to later media. Sample
            // a bounded piece near the tail before exposing an owned player;
            // all later requests retain their own authority and byte checks.
            const time = duration > 30 ? Math.max(duration / 2, duration - 5) : Math.max(0, duration - 1);
            const segment = track.segments.find(value => value.endTime > time) || track.segments.at(-1);
            await rangeBytes(track, { start: segment.start, end: Math.min(segment.end, segment.start + 1023) });
        }
        async function clearBuffers() {
            for (const track of tracks) {
                await update(track, () => track.buffer.remove(0, duration + 1));
                for (const segment of track.retained.values()) retainedBytes -= segment.bytes;
                track.retained.clear();
            }
        }
        async function evict(track, time) {
            const cutoff = Math.max(0, time - RETAIN_BEHIND_SECONDS);
            const old = [...track.retained.values()].filter(segment => segment.endTime <= cutoff);
            if (!old.length) return;
            await update(track, () => track.buffer.remove(0, cutoff));
            for (const segment of old) { track.retained.delete(segment.index); retainedBytes -= segment.bytes; }
        }
        async function fillTrack(track, time, expectedEpoch, initialOnly = false) {
            check(expectedEpoch);
            await evict(track, time);
            let first = track.segments.findIndex(segment => segment.endTime > time);
            if (first < 0) return;
            if (track.type === 'video') {
                while (first > 0 && !track.segments[first].startsWithSap) first--;
                if (time - track.segments[first].time > LOOKAHEAD_SECONDS) throw problem('seek_random_access_unavailable');
            }
            for (let index = first; index < track.segments.length; index++) {
                const segment = track.segments[index];
                if (segment.time >= time + LOOKAHEAD_SECONDS) break;
                if (track.retained.has(index)) continue;
                check(expectedEpoch);
                if (retainedBytes + reservedBytes + segment.bytes > BUFFER_LIMIT) throw problem('adaptive_buffer_limit');
                reservedBytes += segment.bytes;
                try {
                    const bytes = await rangeBytes(track, segment, expectedEpoch);
                    check(expectedEpoch);
                    await update(track, () => track.buffer.appendBuffer(bytes));
                    check(expectedEpoch);
                    track.retained.set(index, segment); retainedBytes += segment.bytes;
                } finally { reservedBytes -= segment.bytes; }
                if (initialOnly) break;
            }
        }
        async function pumpOnce(expectedEpoch, initialOnly) {
            check(expectedEpoch);
            if (resetRequired) { resetRequired = false; await clearBuffers(); check(expectedEpoch); }
            const time = Number.isFinite(video.currentTime) ? Math.max(0, Math.min(duration, video.currentTime)) : 0;
            // Keep both tracks close to the playhead. A long video response
            // cannot fill all memory while its audio request is still waiting.
            const results = await Promise.allSettled(tracks.map(track => fillTrack(track, time, expectedEpoch, initialOnly)));
            const failed = results.find(result => result.status === 'rejected');
            if (failed) throw failed.reason;
            check(expectedEpoch);
            if (tracks.every(track => track.retained.has(track.segments.length - 1))
                && mediaSource.readyState === 'open' && tracks.every(track => !track.buffer.updating)) mediaSource.endOfStream();
        }
        function pump(initialOnly = false) {
            if (!initialized || destroyed || switching) return Promise.resolve();
            if (pumping) { pumpAgain = true; return pumping; }
            pumping = (async () => {
                do {
                    pumpAgain = false; const expectedEpoch = epoch;
                    try { await pumpOnce(expectedEpoch, initialOnly); initialOnly = false; }
                    catch (error) {
                        if (destroyed) return;
                        if (expectedEpoch !== epoch) pumpAgain = true;
                        else { fail(error); throw error; }
                    }
                } while (pumpAgain && !destroyed && !switching);
            })().finally(() => { pumping = null; });
            return pumping;
        }
        function schedule() { pump().catch(() => {}); }
        async function switchAudio(id) {
            if (!initialized || switching || !audioVariants.has(id)) throw problem('audio_switch_unavailable');
            check();
            if (id === selectedAudioId) return { audioTrackId: id };
            const paused = video.paused === true;
            const position = Number.isFinite(video.currentTime) ? video.currentTime : 0;
            const controls = controlEpoch;
            switching = true; epoch++;
            for (const request of requests) request.abort();
            try {
                video.pause();
                await pumping;
                check();
                const track = tracks[1], next = { type: 'audio', descriptor: audioVariants.get(id) };
                const initBytes = await loadTrack(next); await preflight(next); check();
                if (track.descriptor.mimeType !== next.descriptor.mimeType && typeof track.buffer.changeType !== 'function') {
                    throw problem('audio_codec_switch_unsupported');
                }
                await update(track, () => track.buffer.remove(0, duration + 1));
                for (const segment of track.retained.values()) retainedBytes -= segment.bytes;
                track.retained.clear();
                if (track.descriptor.mimeType !== next.descriptor.mimeType) track.buffer.changeType(next.descriptor.mimeType);
                track.descriptor = next.descriptor; track.segments = next.segments;
                await update(track, () => track.buffer.appendBuffer(initBytes));
                await fillTrack(track, position, epoch, true); check();
                selectedAudioId = id; switching = false;
                check();
                if (!paused && controls === controlEpoch && video.paused === true) await video.play();
                check();
                schedule();
                return { audioTrackId: id };
            } catch (error) { fail(error); throw error; }
            finally { switching = false; }
        }
        async function start() {
            if (started || destroyed) throw problem('transport_already_started');
            started = true;
            try {
                check();
                timer = root.setInterval(() => {
                    if (!current()) { fail(problem('transport_authority_lost')); return; }
                    schedule();
                }, 500);
                const initialization = await Promise.all(tracks.map(loadTrack)); check();
                await Promise.all(tracks.map(preflight)); check();
                mediaSource = new MediaSource();
                const opened = new Promise((resolve, reject) => {
                    const cleanup = () => { root.clearTimeout(timeout); mediaSource.removeEventListener('sourceopen', done); lifetime.signal.removeEventListener('abort', cancelled); };
                    const done = () => { cleanup(); resolve(); };
                    const cancelled = () => { cleanup(); reject(problem('transport_destroyed')); };
                    const timeout = root.setTimeout(() => { cleanup(); reject(problem('media_source_open_timeout')); }, REQUEST_TIMEOUT_MS);
                    mediaSource.addEventListener('sourceopen', done);
                    lifetime.signal.addEventListener('abort', cancelled, { once: true });
                });
                objectUrl = URL.createObjectURL(mediaSource); video.src = objectUrl;
                await opened; check();
                // Establish the complete codec configuration before appending
                // either initialization segment. Neither track may alter the
                // parser configuration while the other buffer is being added.
                for (const track of tracks) track.buffer = mediaSource.addSourceBuffer(track.descriptor.mimeType);
                await Promise.all(tracks.map((track, index) => update(track, () => track.buffer.appendBuffer(initialization[index]))));
                check();
                mediaSource.duration = duration; initialized = true;
                listen(video, 'timeupdate', schedule);
                for (const name of ['pointerdown', 'keydown']) listen(video, name, event => {
                    if (event.isTrusted === true) controlEpoch++;
                });
                listen(video, 'seeking', () => {
                    epoch++; resetRequired = true;
                    for (const request of requests) request.abort();
                    schedule();
                });
                await pump(true);
                schedule();
            } catch (error) { fail(error); throw error; }
        }
        return Object.freeze({ start, destroy, switchAudio });
    }
    root.FilterTubeContentPlaybackTransport = Object.freeze({ create, parseSidx });
})(typeof window !== 'undefined' ? window : globalThis);
