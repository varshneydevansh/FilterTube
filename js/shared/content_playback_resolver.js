// FilterTube-owned transport resolution. Media metadata never grants playback permission.
(function (root, factory) {
    'use strict';
    const planner = typeof module === 'object' && module.exports
        ? require('./content_playback_source.js') : root.FilterTubeContentPlaybackSource;
    const api = factory(root, planner);
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.FilterTubeContentPlaybackResolver = api;
})(typeof window !== 'undefined' ? window : globalThis, function (root, planner) {
    'use strict';
    const LIMIT = 512 * 1024;
    const BUDGET_MS = 8000;
    const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
    const text = (value, limit = 160) => typeof value === 'string' ? value.slice(0, limit) : '';
    const integer = value => (typeof value === 'number' || typeof value === 'string' && /^\d+$/.test(value))
        && Number.isSafeInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
    const fail = (reason, resolverId = '') => ({ supported: false, reason, resolverId, video: null,
        source: null, playerResponse: null, capabilities: null, requiresFeatureValidation: true });

    function exactResponse(input, videoId) {
        const values = Array.isArray(input) ? input : [input];
        if (values.length > 16) return null;
        const matches = values.map(value => value?.playerResponse || value?.player_response || value)
            .filter(value => object(value) && value.videoDetails?.videoId === videoId);
        return matches.length === 1 ? matches[0] : null;
    }
    function projection(input, videoId) {
        const response = exactResponse(input, videoId);
        if (!response) return null;
        const streaming = response.streamingData || {};
        if (streaming.formats?.length > 256 || streaming.adaptiveFormats?.length > 256) return null;
        const details = response.videoDetails;
        const value = {
            videoDetails: { videoId, title: text(details.title, 256), lengthSeconds: details.lengthSeconds,
                isLive: details.isLive === true, isLiveContent: details.isLiveContent === true,
                isPostLiveDvr: details.isPostLiveDvr === true },
            playabilityStatus: { status: response.playabilityStatus?.status,
                liveStreamability: response.playabilityStatus?.liveStreamability ? { present: true } : undefined },
            captions: response.captions,
            drmParams: response.drmParams ? 'present' : undefined,
            streamingData: { formats: Array.isArray(streaming.formats) ? streaming.formats : [],
                adaptiveFormats: Array.isArray(streaming.adaptiveFormats) ? streaming.adaptiveFormats : [],
                drmFamilies: streaming.drmFamilies, licenseInfos: streaming.licenseInfos }
        };
        const serialized = JSON.stringify(value);
        return serialized.length <= LIMIT ? JSON.parse(serialized) : null;
    }
    function mediaUrl(raw, now) {
        if (typeof raw !== 'string' || raw.length > 16384 || /[\u0000-\u0020\u007f]/.test(raw)) return null;
        try {
            const url = new URL(raw);
            if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash
                || !(url.hostname === 'googlevideo.com' || url.hostname.endsWith('.googlevideo.com'))
                || url.pathname !== '/videoplayback' || url.searchParams.has('n') || url.searchParams.has('s')
                || url.searchParams.getAll('expire').length !== 1) return null;
            const expiry = url.searchParams.get('expire');
            const expiresAt = /^\d+$/.test(expiry || '') ? Number(expiry) * 1000 : NaN;
            return Number.isSafeInteger(expiresAt) && expiresAt > now ? { url: raw, expiresAt } : null;
        } catch (_) { return null; }
    }
    function byteRange(value, length) {
        const start = integer(value?.start); const end = integer(value?.end);
        return start !== null && end !== null && start <= end && end < length ? { start, end } : null;
    }
    function audioTrack(value) {
        if (!object(value) || !text(value.id)) return null;
        const label = text(typeof value.displayName === 'string' ? value.displayName : value.displayName?.simpleText);
        return { id: text(value.id), languageCode: text(value.languageCode, 40), label,
            isDefault: value.audioIsDefault === true,
            isOriginal: value.isOriginal === true || value.isAutoDubbed === false && /\boriginal\b/i.test(label),
            isAutoDubbed: value.isAutoDubbed === true };
    }
    function descriptor(format, kind, options) {
        if (!object(format) || format.signatureCipher || format.cipher || format.drmTrackType) return null;
        const checked = mediaUrl(format.url, options.now);
        const length = integer(format.contentLength);
        const mimeType = text(format.mimeType, 512);
        const codec = kind === 'video' ? /^video\/mp4\s*;\s*codecs="avc[13]\.[A-Za-z0-9.]+"$/i
            : /^audio\/mp4\s*;\s*codecs="mp4a\.[A-Za-z0-9.]+"$/i;
        if (!checked || !length || length > 2147483647 || !codec.test(mimeType)) return null;
        const initRange = byteRange(format.initRange, length); const indexRange = byteRange(format.indexRange, length);
        if (!initRange || !indexRange || initRange.end >= indexRange.start) return null;
        let compatible = '';
        try { compatible = options.canPlayType(mimeType); } catch (_) {}
        if (compatible !== 'probably' && compatible !== 'maybe') return null;
        const urlTags = new URL(checked.url).searchParams.getAll('xtags');
        const rawTags = format.xtags;
        if (urlTags.length > 1 || rawTags != null && (typeof rawTags !== 'string' || rawTags.length > 512 || /[\u0000-\u0020\u007f]/.test(rawTags))
            || urlTags.some(value => value.length > 512 || /[\u0000-\u0020\u007f]/.test(value))
            || rawTags && urlTags.length === 1 && rawTags !== urlTags[0]) return null;
        const xtags = rawTags || urlTags[0] || '';
        const value = { url: checked.url, mimeType, initRange, indexRange, contentLength: length, xtags,
            expiresAt: checked.expiresAt, itag: integer(format.itag), bitrate: integer(format.bitrate) || 0 };
        if (kind === 'video') {
            const height = integer(format.height); const width = integer(format.width);
            if (!height || !width || height > 1080 || width > 4096) return null;
            return { ...value, width, height, qualityLabel: text(format.qualityLabel, 40) };
        }
        return { ...value, audioTrack: audioTrack(format.audioTrack), audioChannels: integer(format.audioChannels) };
    }
    function normalize(raw, options, resolverId, adaptiveAllowed) {
        const response = projection(raw, options.videoId);
        if (!response) return fail('video_identity_or_metadata_invalid', resolverId);
        const details = response.videoDetails;
        if (response.playabilityStatus.status !== 'OK') return fail('playability_not_ok', resolverId);
        if (details.isLive || details.isLiveContent || details.isPostLiveDvr || response.playabilityStatus.liveStreamability) return fail('live_unsupported', resolverId);
        const streaming = response.streamingData;
        if (response.drmParams || streaming.drmFamilies?.length || streaming.licenseInfos?.length) return fail('drm_unsupported', resolverId);
        const duration = Number(details.lengthSeconds);
        if (!Number.isFinite(duration) || duration <= 0 || duration > 43200) return fail('duration_invalid', resolverId);
        if (typeof options.canPlayType !== 'function') return fail('codec_probe_required', resolverId);
        // This is transport planning only. The caller must prepare and validate
        // the original captions and selected features before any player handoff.
        const { captions, ...transportResponse } = response;
        const progressive = planner?.plan({ playerResponse: transportResponse, videoId: options.videoId, now: options.now,
            canPlayType: options.canPlayType, requirements: { ...options.requirements,
                captionsRequired: false, captionTrackId: '', captionMode: undefined } });
        if (options.requirements?.nativeAdaptiveOnly !== true && progressive?.supported && mediaUrl(progressive.source.url, options.now)) {
            return { supported: true, reason: progressive.reason, resolverId, video: progressive.video,
                source: progressive.source, playerResponse: response, capabilities: progressive.capabilities, requiresFeatureValidation: true };
        }
        if (!adaptiveAllowed) return fail(progressive?.reason || 'source_unavailable', resolverId);
        const formats = streaming.adaptiveFormats;
        const videos = formats.map(row => descriptor(row, 'video', options)).filter(Boolean)
            .sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);
        const audios = formats.map(row => descriptor(row, 'audio', options)).filter(Boolean)
            .sort((a, b) => b.bitrate - a.bitrate);
        if (!videos.length || !audios.length) return fail('adaptive_source_unavailable', resolverId);
        const requirements = options.requirements || {};
        const undSelected = requirements.audioTrackId === 'und';
        const undeclaredSingleProgram = formats.filter(row => /^audio\//.test(row?.mimeType || '')).every(row => !row.audioTrack)
            && !audios.some(row => row.audioTrack)
            && Number.isSafeInteger(requirements.audioTrackCount) && requirements.audioTrackCount >= 0 && requirements.audioTrackCount <= 1;
        if (undSelected && undeclaredSingleProgram && requirements.preferOriginalAudio !== true) {
            for (const row of audios) row.audioTrack = { id: 'und', languageCode: '', label: '',
                isOriginal: false, isDefault: true, singleProgram: true };
        }
        let candidates = audios.filter(row => (!requirements.audioTrackId || row.audioTrack?.id === requirements.audioTrackId)
            && (requirements.preferOriginalAudio !== true || row.audioTrack?.isOriginal === true));
        if (!requirements.audioTrackId && requirements.preferOriginalAudio !== true) {
            const programs = new Set(audios.map(row => row.audioTrack?.id || ''));
            if (programs.size > 1) {
                const defaults = new Set(audios.filter(row => row.audioTrack?.isDefault).map(row => row.audioTrack.id));
                candidates = defaults.size === 1 ? candidates.filter(row => row.audioTrack?.id === [...defaults][0]) : [];
            }
        }
        const selected = candidates[0];
        if (!selected) return fail('audio_preference_unsupported', resolverId);
        // UI choices identify audio programs, not several bitrate encodings of
        // the same program. Keep the best compatible encoding for each known
        // identity; unidentified streams are never offered as invented tracks.
        const variants = new Map();
        for (const row of audios) if (row.audioTrack && !variants.has(row.audioTrack.id)) variants.set(row.audioTrack.id, row);
        if (selected.audioTrack) variants.set(selected.audioTrack.id, selected);
        const audioVariants = [...variants.values()];
        const video = videos[0];
        return { supported: true, reason: 'direct_adaptive_mp4', resolverId,
            video: { id: options.videoId, title: details.title, durationSeconds: duration, isLive: false },
            source: { kind: 'adaptive_mp4', hasVideo: true, hasAudio: true, durationSeconds: duration,
                video, audio: selected, audioTrack: selected.audioTrack,
                audioVariants, expiresAt: Math.min(video.expiresAt, selected.expiresAt) },
            playerResponse: response,
            capabilities: { audio: { tracks: audioVariants.map(row => row.audioTrack), switchingSupported: audioVariants.length > 1 },
                captions: { available: Boolean(captions?.playerCaptionsTracklistRenderer?.captionTracks?.length),
                    declared: captions != null } }, requiresFeatureValidation: true };
    }
    async function readJson(response, context) {
        const rejectBody = reason => {
            try { response?.body?.cancel?.()?.catch?.(() => {}); } catch (_) {}
            throw Error(reason);
        };
        if (!response || response.status !== 200 || response.redirected
            || !/^application\/json(?:\s*;|$)/i.test(response.headers?.get?.('content-type') || '')) rejectBody('source_response_invalid');
        const declared = response.headers.get('content-length');
        if (declared && (!/^\d+$/.test(declared) || Number(declared) > context.remainingBytes())) rejectBody('source_response_limit');
        const reader = response.body?.getReader?.();
        if (!reader) rejectBody('source_response_unreadable');
        const decoder = new TextDecoder(); let total = 0; let body = '';
        try {
            while (true) {
                context.check();
                const { done, value } = await context.race(reader.read());
                if (done) break;
                if (!(value instanceof Uint8Array)) throw Error('source_response_invalid');
                total += value.byteLength;
                context.consumeBytes(value.byteLength);
                if (total > LIMIT) throw Error('source_response_limit');
                body += decoder.decode(value, { stream: true });
            }
            body += decoder.decode(); context.check();
            return JSON.parse(body);
        } finally {
            try { const cleanup = reader.cancel(); cleanup?.catch?.(() => {}); } catch (_) {}
            try { reader.releaseLock(); } catch (_) {}
        }
    }
    const defaults = [
        { id: 'loaded-progressive', adaptive: false, resolve: context => context.playerResponse },
        { id: 'fresh-visionos-json', adaptive: true, async resolve(context) {
            if (root.location?.origin !== 'https://www.youtube.com' || typeof context.fetch !== 'function'
                || typeof root.crypto?.getRandomValues !== 'function') throw Error('source_fetch_unavailable');
            // A fixed, maintained extraction client. Obtain its real anonymous
            // visitor context; do not invent visitors or rotate clients after
            // a refusal. Protocol fields follow NewPipe's VisionOS strategy.
            const region = /^[A-Z]{2}$/.test(context.requirements?.regionCode || '') ? context.requirements.regionCode : '';
            const client = { clientName: 'VISIONOS', clientVersion: '1.04', clientScreen: 'WATCH',
                platform: 'MOBILE', deviceMake: 'Apple', deviceModel: 'RealityDevice17,1', osName: 'visionOS',
                osVersion: '26.6.0.23O770', utcOffsetMinutes: 0,
                userAgent: `com.google.visionos.youtube/1.04(RealityDevice17,1; U; CPU visionOS 26_6_0 like Mac OS X${region ? '; ' + region : ''})` };
            const requestContext = { client, request: { internalExperimentFlags: [], useSsl: true } };
            const headers = { 'Content-Type': 'application/json', 'X-Youtube-Client-Name': '101',
                'X-Youtube-Client-Version': '1.04', 'X-Goog-Api-Format-Version': '2' };
            const post = async (endpoint, body) => {
                context.check();
                const response = await context.race(context.fetch(endpoint, { method: 'POST', credentials: 'omit',
                    redirect: 'error', signal: context.signal, headers, body: JSON.stringify(body) }));
                return readJson(response, context);
            };
            const visitor = await post('/youtubei/v1/visitor_id?prettyPrint=false', { context: requestContext });
            const visitorData = visitor?.responseContext?.visitorData;
            if (typeof visitorData !== 'string' || !/^[A-Za-z0-9+/_=%-]{1,4096}$/.test(visitorData)
                || /%(?![a-fA-F0-9]{2})/.test(visitorData)) throw Error('source_visitor_invalid');
            context.check();
            client.visitorData = visitorData;
            const bytes = new Uint8Array(16);
            root.crypto.getRandomValues(bytes);
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
            const cpn = Array.from(bytes, value => alphabet[value & 63]).join('');
            return post('/youtubei/v1/player?prettyPrint=false&id=' + context.videoId, { context: requestContext,
                videoId: context.videoId, cpn, contentCheckOk: false, racyCheckOk: false });
        } }
    ];
    function create(config = {}) {
        const clock = typeof config.now === 'function' ? config.now : Date.now;
        const configured = config.adapters === undefined ? defaults : config.adapters;
        if (!Array.isArray(configured) || !configured.length || configured.length > 4
            || configured.some(row => !/^[a-z][a-z0-9-]{0,63}$/.test(row?.id || '') || typeof row.resolve !== 'function')
            || new Set(configured.map(row => row.id)).size !== configured.length) throw new TypeError('Invalid local resolver adapters');
        const adapters = configured.map(row => Object.freeze({ id: row.id, adaptive: row.adaptive === true, resolve: row.resolve }));
        return Object.freeze({ async resolve(input = {}) {
            if (!/^[A-Za-z0-9_-]{11}$/.test(input.videoId || '')) return fail('invalid_video_id');
            if (typeof input.isCurrent !== 'function') return fail('current_authority_required');
            const initial = exactResponse(input.playerResponse, input.videoId);
            if (initial && initial.playabilityStatus?.status !== 'OK') return fail('playability_not_ok');
            const controller = new AbortController(); let reason = ''; let settled = false; let receivedBytes = 0;
            const deadline = clock() + BUDGET_MS;
            const abort = value => { if (!reason) reason = value; controller.abort(); };
            const externalAbort = () => abort('source_aborted');
            const check = () => {
                if (input.signal?.aborted) abort('source_aborted');
                try { if (!input.isCurrent()) abort('source_stale'); } catch (_) { abort('source_stale'); }
                if (clock() >= deadline) abort('source_timeout');
                if (controller.signal.aborted) throw Error(reason || 'source_aborted');
            };
            const aborted = new Promise((resolve, reject) => controller.signal.addEventListener('abort', () => reject(Error(reason)), { once: true }));
            aborted.catch(() => {});
            const race = promise => Promise.race([promise, aborted]);
            input.signal?.addEventListener('abort', externalAbort, { once: true });
            const timeout = setTimeout(() => abort('source_timeout'), BUDGET_MS);
            const freshness = setInterval(() => { if (!settled) { try { check(); } catch (_) {} } }, 100);
            let last = fail('source_unavailable');
            try {
                check();
                for (const adapter of adapters) {
                    check();
                    try {
                        const raw = await race(Promise.resolve().then(() => adapter.resolve({
                            videoId: input.videoId, playerResponse: input.playerResponse, requirements: input.requirements || {},
                            signal: controller.signal, isCurrent: input.isCurrent, fetch: input.fetch, race, check,
                            remainingBytes: () => LIMIT - receivedBytes, consumeBytes: count => {
                                receivedBytes += count; if (receivedBytes > LIMIT) throw Error('source_response_limit');
                            }
                        })));
                        check();
                        last = normalize(raw, { videoId: input.videoId, requirements: input.requirements || {},
                            canPlayType: input.canPlayType, now: clock() }, adapter.id, adapter.adaptive);
                        check();
                        if (last.supported || ['playability_not_ok', 'live_unsupported', 'drm_unsupported'].includes(last.reason)) return last;
                    } catch (error) {
                        if (reason) throw error;
                        const safe = ['source_response_invalid', 'source_response_limit', 'source_response_unreadable', 'source_fetch_unavailable', 'source_visitor_invalid'];
                        last = fail(safe.includes(error?.message) ? error.message : 'source_adapter_failed', adapter.id);
                    }
                }
                return last;
            } catch (_) { return fail(reason || 'source_adapter_failed', last.resolverId); }
            finally {
                settled = true; clearTimeout(timeout); clearInterval(freshness);
                input.signal?.removeEventListener('abort', externalAbort);
                controller.abort();
            }
        } });
    }
    return Object.freeze({ create });
});
