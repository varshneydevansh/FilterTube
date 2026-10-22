// Caption preparation only. Media/admission ownership stays with the caller.
(function (root) {
    'use strict';
    const MAX_BYTES = 2 * 1024 * 1024;
    const MAX_TRACKS = 32;
    const TIMEOUT_MS = 8000;
    const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
    const text = (value, limit = 160) => typeof value === 'string' ? value.slice(0, limit) : '';
    const label = value => text(typeof value === 'string' ? value : value?.simpleText
        || (Array.isArray(value?.runs) ? value.runs.slice(0, 12).map(run => text(run?.text)).join('') : ''));

    function vttUrl(raw, videoId, origin) {
        if (typeof raw !== 'string' || raw.length > 16384 || /[\u0000-\u0020\u007f]/.test(raw)) return '';
        try {
            const url = new URL(raw);
            if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password || url.port || url.hash
                || url.pathname !== '/api/timedtext' || url.searchParams.getAll('v').length !== 1
                || url.searchParams.get('v') !== videoId || url.searchParams.getAll('fmt').length > 1) return '';
            // URLSearchParams would reserialize every signed query byte. Change
            // only fmt's value and preserve all other parameters verbatim.
            const query = raw.indexOf('?');
            if (query < 0) return '';
            let replaced = false;
            const parts = raw.slice(query + 1).split('&').map(part => {
                const key = decodeURIComponent(part.split('=')[0].replace(/\+/g, ' '));
                if (key !== 'fmt') return part;
                replaced = true;
                return 'fmt=vtt';
            });
            if (!replaced) parts.push('fmt=vtt');
            return `${raw.slice(0, query + 1)}${parts.join('&')}`;
        } catch (error) { return ''; }
    }

    async function prepare(playerResponse, options = {}) {
        const fail = reason => ({ supported: false, reason, captions: null, tracks: [] });
        const videoId = options.videoId;
        const response = playerResponse?.playerResponse || playerResponse?.player_response || playerResponse;
        if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '') || response?.videoDetails?.videoId !== videoId) return fail('video_identity_mismatch');
        if (response.playabilityStatus?.status !== 'OK') return fail('playability_not_ok');
        if (typeof options.isCurrent !== 'function') return fail('current_authority_required');
        if (typeof options.fetch !== 'function' || typeof AbortController !== 'function' || typeof TextDecoder !== 'function') return fail('caption_fetch_unavailable');
        let origin;
        try {
            const location = new URL(root.location?.href || root.location?.origin || '');
            if (location.protocol !== 'https:' || !(location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com'))) return fail('caption_origin_unavailable');
            origin = location.origin;
        } catch (error) { return fail('caption_origin_unavailable'); }
        let captions;
        try {
            const serialized = JSON.stringify(response.captions);
            if (!serialized || serialized.length > 262144) return fail('caption_metadata_invalid');
            captions = JSON.parse(serialized);
        } catch (error) { return fail('caption_metadata_invalid'); }
        const rows = captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!Array.isArray(rows) || !rows.length || rows.length > MAX_TRACKS) return fail('caption_metadata_invalid');
        const ids = new Set();
        const tracks = [];
        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            if (!object(row)) return fail('caption_metadata_invalid');
            const id = text(row.vssId || row.id || `caption-${index}`);
            const languageCode = text(row.languageCode, 40);
            const url = vttUrl(row.baseUrl, videoId, origin);
            if (!id || ids.has(id) || !languageCode || !url) return fail('caption_track_invalid');
            ids.add(id);
            row.baseUrl = url;
            tracks.push({ id, languageCode, label: label(row.name) || languageCode,
                kind: row.kind === 'asr' ? 'captions' : 'subtitles', url });
        }
        const limit = Number.isSafeInteger(options.maxBytes) && options.maxBytes > 0
            ? Math.min(options.maxBytes, MAX_BYTES) : MAX_BYTES;
        const controller = new AbortController();
        let reason = '';
        let reader = null;
        let total = 0;
        const abort = value => { reason = reason || value; controller.abort(); };
        const externalAbort = () => abort('caption_aborted');
        const aborted = new Promise((resolve, reject) => controller.signal.addEventListener('abort', () => reject(new Error('caption_aborted')), { once: true }));
        aborted.catch(() => {});
        const timer = root.setTimeout(() => abort('caption_timeout'), TIMEOUT_MS);
        options.signal?.addEventListener?.('abort', externalAbort, { once: true });
        if (options.signal?.aborted) externalAbort();
        const check = () => {
            if (controller.signal.aborted) throw new Error('caption_aborted');
            let current = false;
            try { current = options.isCurrent() === true; } catch (error) {}
            if (!current) { abort('caption_stale'); throw new Error('caption_stale'); }
        };
        const wait = promise => Promise.race([promise, aborted]);
        try {
            const prepared = [];
            for (const track of tracks) {
                check();
                const http = await wait(options.fetch(track.url, { credentials: 'same-origin', redirect: 'error', signal: controller.signal }));
                if (http?.body && typeof http.body.getReader === 'function') reader = http.body.getReader();
                check();
                if (!http?.ok) { reason = 'caption_http_error'; throw new Error(reason); }
                const length = http.headers?.get?.('content-length');
                if (length && /^\d+$/.test(length) && Number(length) > limit - total) { reason = 'caption_size_limit'; throw new Error(reason); }
                if (!reader) { reason = 'caption_stream_unavailable'; throw new Error(reason); }
                const decoder = new TextDecoder('utf-8', { fatal: true });
                let vttText = '';
                for (;;) {
                    const chunk = await wait(reader.read());
                    check();
                    if (chunk.value) {
                        total += chunk.value.byteLength;
                        if (total > limit) { reason = 'caption_size_limit'; throw new Error(reason); }
                    }
                    vttText += decoder.decode(chunk.value, { stream: !chunk.done });
                    if (chunk.done) break;
                }
                reader.releaseLock();
                reader = null;
                // A claimed MIME type alone cannot turn JSON/HTML into usable
                // captions. Native track rendering needs the actual VTT header.
                if (!/^WEBVTT(?:[ \t\r\n]|$)/.test(vttText)) { reason = 'caption_not_vtt'; throw new Error(reason); }
                prepared.push({ id: track.id, languageCode: track.languageCode, label: track.label, kind: track.kind, vttText });
            }
            check();
            return { supported: true, reason: 'prepared_vtt', captions, tracks: prepared };
        } catch (error) {
            return fail(reason || 'caption_fetch_failed');
        } finally {
            root.clearTimeout(timer);
            options.signal?.removeEventListener?.('abort', externalAbort);
            controller.abort();
            if (reader) {
                try { Promise.resolve(reader.cancel()).catch(() => {}); } catch (error) {}
                try { reader.releaseLock(); } catch (error) {}
            }
        }
    }
    const api = Object.freeze({ prepare });
    root.FilterTubeContentPlaybackCaptions = api;
    if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
