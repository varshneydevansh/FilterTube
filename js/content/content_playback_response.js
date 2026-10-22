// MAIN-world media bridge. A source receipt never grants profile permission or proves playback.
(function () {
    'use strict';
    if (window.__filtertubeContentPlaybackResponseInstalled) return;
    window.__filtertubeContentPlaybackResponseInstalled = true;
    let lastRequestAt = 0;
    let audioGeneration = 0;
    function trackId(track) {
        if (typeof track === 'string') return track.slice(0, 160);
        const info = track?.getLanguageInfo?.();
        const id = info?.getId?.() || info?.id || track?.id || track?.audioTrackId;
        return typeof id === 'string' ? id.slice(0, 160) : '';
    }
    function currentId() {
        return location.pathname === '/watch' ? new URLSearchParams(location.search).get('v') || '' : '';
    }
    function loadedResponse(videoId) {
        let nativeResponse = null;
        try { nativeResponse = document.getElementById('movie_player')?.getPlayerResponse?.(); } catch (_) {}
        const candidates = [
            nativeResponse,
            document.querySelector('ytd-watch-flexy')?.playerData,
            document.querySelector('ytd-watch-flexy')?.data?.playerResponse,
            window.ytInitialPlayerResponse,
            window.filterTube?.lastYtPlayerResponse,
            window.filterTube?.lastYtInitialPlayerResponse
        ];
        return candidates.find(value => value?.videoDetails?.videoId === videoId) || null;
    }
    let nativeTransaction = null;
    const nativeRequests = new Map();
    const safeText = value => typeof value === 'string' && value.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value);
    function nativeReceipt(requestId, videoId, applied, reason) {
        window.postMessage({ type: 'FilterTube_NativeContentSourceResult', source: 'injector',
            payload: { requestId, videoId, applied, reason } }, location.origin);
    }
    function rememberNative(requestId, reason) {
        const now = Date.now();
        for (const [key, value] of nativeRequests) if (now - value.at >= 60000) nativeRequests.delete(key);
        nativeRequests.delete(requestId);
        nativeRequests.set(requestId, { at: now, reason });
        while (nativeRequests.size > 32) nativeRequests.delete(nativeRequests.keys().next().value);
    }
    function nativeVideo(player) {
        return player?.querySelector?.('video.html5-main-video')
            || document.querySelector('#movie_player video.html5-main-video');
    }
    function nativeCurrent(transaction) {
        return transaction && currentId() === transaction.videoId
            && document.getElementById('movie_player') === transaction.player
            && nativeVideo(transaction.player) === transaction.node;
    }
    function pauseNative(transaction) {
        if (!nativeCurrent(transaction)) return;
        try { transaction.player.pauseVideo?.(); } catch (_) {}
        try { transaction.node.pause(); } catch (_) {}
    }
    function nativePreferences(player, response) {
        const audio = player?.getAudioTrack?.() || player?.getOption?.('audio', 'track');
        const availableAudio = player?.getAvailableAudioTracks?.();
        const caption = player?.getOption?.('captions', 'track');
        const captionId = caption?.vss_id || caption?.vssId;
        const region = window.ytcfg?.get?.('INNERTUBE_CONTEXT')?.client?.gl;
        // These observations only avoid unnecessary UX reloads. They never
        // replace isolated-world admission or grant playback permission.
        let nativeVideoId = ''; let nativeAdInactive = false;
        try {
            const id = player?.getPlayerResponse?.()?.videoDetails?.videoId;
            if (typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id)) nativeVideoId = id;
        } catch (_) {}
        try { nativeAdInactive = player?.getAdState?.() === -1; } catch (_) {}
        return { nativeVideoId, nativeAdInactive, regionCode: typeof region === 'string' && /^[A-Z]{2}$/.test(region) ? region : '',
            audioTrackId: trackId(audio), audioTrackCount: Array.isArray(availableAudio) ? availableAudio.length : null,
            audioTracks: Array.isArray(availableAudio) && availableAudio.length <= 64
                ? availableAudio.map(track => ({ id: trackId(track) })) : [],
            captionTrackId: typeof captionId === 'string' ? captionId.slice(0, 160) : '',
            captionLanguage: typeof caption?.languageCode === 'string' ? caption.languageCode.slice(0, 40) : '',
            captionsEnabled: Boolean(caption?.languageCode), audioKnown: Array.isArray(availableAudio),
            captionsKnown: Boolean(caption && typeof caption === 'object') || response?.captions == null };
    }
    function jsonClone(value, limit) {
        const serialized = JSON.stringify(value);
        if (typeof serialized !== 'string' || serialized.length > limit
            || new TextEncoder().encode(serialized).byteLength > limit) throw Error('metadata_limit');
        return JSON.parse(serialized);
    }
    function directFormat(input, kind, now) {
        if (!input || typeof input !== 'object' || input.cipher || input.signatureCipher || input.drmTrackType
            || typeof input.url !== 'string' || input.url.length > 16384 || /[\u0000-\u0020\u007f]/.test(input.url)) throw Error('source_invalid');
        const url = new URL(input.url);
        const expire = url.searchParams.get('expire');
        const expiry = /^\d+$/.test(expire || '') ? Number(expire) * 1000 : NaN;
        if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash
            || !(url.hostname === 'googlevideo.com' || url.hostname.endsWith('.googlevideo.com'))
            || url.pathname !== '/videoplayback' || url.searchParams.has('n') || url.searchParams.has('s')
            || url.searchParams.getAll('expire').length !== 1 || !Number.isSafeInteger(expiry) || expiry <= now
            || input.expiresAt !== expiry) throw Error('source_invalid');
        const queryTags = url.searchParams.getAll('xtags');
        if (queryTags.length > 1 || input.xtags != null && (typeof input.xtags !== 'string'
            || input.xtags.length > 512 || /[\u0000-\u0020\u007f]/.test(input.xtags))
            || queryTags.length === 1 && input.xtags !== queryTags[0]) throw Error('source_invalid');
        const codec = kind === 'video' ? /^video\/mp4\s*;\s*codecs="avc[13]\.[A-Za-z0-9.]+"$/i
            : /^audio\/mp4\s*;\s*codecs="mp4a\.[A-Za-z0-9.]+"$/i;
        if (typeof input.mimeType !== 'string' || input.mimeType.length > 512 || /[\u0000-\u001f\u007f]/.test(input.mimeType) || !codec.test(input.mimeType)
            || !Number.isSafeInteger(input.itag) || input.itag <= 0
            || !Number.isSafeInteger(input.contentLength) || input.contentLength <= 0 || input.contentLength > 2147483647) throw Error('source_invalid');
        const range = value => {
            if (!Number.isSafeInteger(value?.start) || !Number.isSafeInteger(value?.end)
                || value.start < 0 || value.end < value.start || value.end >= input.contentLength) throw Error('source_invalid');
            return { start: String(value.start), end: String(value.end) };
        };
        const output = { itag: input.itag, url: input.url, mimeType: input.mimeType,
            contentLength: String(input.contentLength), initRange: range(input.initRange), indexRange: range(input.indexRange) };
        if (input.xtags) output.xtags = input.xtags;
        if (input.initRange.end >= input.indexRange.start) throw Error('source_invalid');
        for (const key of ['bitrate', 'fps', 'audioChannels', 'audioSampleRate', 'approxDurationMs']) {
            if (input[key] != null) {
                if (!Number.isSafeInteger(input[key]) || input[key] < 0 || input[key] > 1000000000) throw Error('source_invalid');
                output[key] = input[key];
            }
        }
        if (kind === 'video') {
            if (!Number.isSafeInteger(input.width) || !Number.isSafeInteger(input.height)
                || input.width <= 0 || input.width > 4096 || input.height <= 0 || input.height > 1080) throw Error('source_invalid');
            output.width = input.width; output.height = input.height;
            if (safeText(input.qualityLabel)) output.qualityLabel = input.qualityLabel;
        } else if (input.audioTrack) {
            const track = input.audioTrack;
            if (!safeText(track.id) || !track.id || !safeText(track.label || '')) throw Error('source_invalid');
            output.audioTrack = { id: track.id, displayName: track.label || track.id,
                audioIsDefault: track.isDefault === true, isAutoDubbed: track.isAutoDubbed === true };
        }
        return output;
    }
    function applyNative(payload) {
        const { videoId, requestId, source, playbackIntent: intent, preferences: expected } = payload;
        let transaction = null;
        try {
            const now = Date.now();
            if (!Number.isSafeInteger(payload.issuedAt) || !Number.isSafeInteger(payload.commitDeadline)
                || payload.issuedAt > now || payload.commitDeadline <= now
                || payload.commitDeadline - payload.issuedAt <= 0 || payload.commitDeadline - payload.issuedAt > 2000
                || now - payload.issuedAt > 2000) throw Error('commit_deadline_invalid');
            const prior = nativeRequests.get(requestId);
            if (prior && Date.now() - prior.at < 60000) throw Error(prior.reason === 'cancelled' ? 'cancelled' : 'request_replayed');
            if (source?.kind !== 'adaptive_mp4') throw Error('source_kind_unsupported');
            jsonClone(source, 512 * 1024);
            const player = document.getElementById('movie_player');
            const node = nativeVideo(player);
            const original = player?.getPlayerResponse?.();
            if (!node || typeof player.loadVideoByPlayerVars !== 'function' || typeof node.pause !== 'function'
                || original?.videoDetails?.videoId !== videoId) throw Error('native_player_unavailable');
            if (original.playabilityStatus?.status !== 'OK' || original.videoDetails.isLive || original.videoDetails.isLiveContent
                || original.videoDetails.isPostLiveDvr || original.videoDetails.isUpcoming || original.playabilityStatus.liveStreamability
                || original.drmParams || original.streamingData?.drmFamilies?.length || original.streamingData?.licenseInfos?.length
                || ['formats', 'adaptiveFormats'].some(key => original.streamingData?.[key]?.some(row => row.drmTrackType || row.drmFamilies?.length))) throw Error('native_playability_unsupported');
            const duration = Number(original.videoDetails.lengthSeconds);
            if (!Number.isFinite(source.durationSeconds) || source.durationSeconds <= 0 || source.durationSeconds > 43200
                || !Number.isFinite(duration) || Math.abs(duration - source.durationSeconds) > 2.5
                || !intent || intent.videoId !== videoId || !['content', 'unrelated'].includes(intent.nativeTimeline)
                || !Number.isFinite(intent.durationSeconds) || Math.abs(intent.durationSeconds - duration) > 2.5
                || !Number.isFinite(intent.positionSeconds) || intent.positionSeconds < 0 || intent.positionSeconds > duration
                || typeof intent.paused !== 'boolean' || typeof intent.muted !== 'boolean'
                || !Number.isFinite(intent.volume) || intent.volume < 0 || intent.volume > 1
                || !Number.isFinite(intent.rate) || intent.rate <= 0 || intent.rate > 16) throw Error('playback_intent_invalid');
            if (intent.nativeTimeline === 'content' && (!Number.isFinite(node.currentTime)
                || Math.abs(node.currentTime - intent.positionSeconds) > 2.5)) throw Error('playback_intent_stale');
            const latest = nativePreferences(player, original);
            if (!expected || expected.audioKnown !== true || expected.captionsKnown !== true
                || !latest.audioKnown || !latest.captionsKnown || latest.audioTrackCount > 64
                || expected.audioTrackId !== latest.audioTrackId || expected.audioTrackCount !== latest.audioTrackCount
                || !Array.isArray(expected.audioTracks) || expected.audioTracks.length > 64
                || JSON.stringify(expected.audioTracks.map(row => row?.id)) !== JSON.stringify(latest.audioTracks.map(row => row.id))
                || expected.captionsEnabled !== latest.captionsEnabled
                || expected.captionTrackId !== latest.captionTrackId || expected.captionLanguage !== latest.captionLanguage) throw Error('native_preferences_changed');
            const video = directFormat(source.video, 'video', now);
            const selected = directFormat(source.audio, 'audio', now);
            if (source.expiresAt !== Math.min(source.video.expiresAt, source.audio.expiresAt)) throw Error('source_invalid');
            if (!Array.isArray(source.audioVariants) || source.audioVariants.length > 64) throw Error('source_invalid');
            const variants = source.audioVariants.map(row => directFormat(row, 'audio', now));
            if (variants.some(row => !row.audioTrack) || new Set(variants.map(row => row.audioTrack.id)).size !== variants.length) throw Error('source_invalid');
            const selectedId = selected.audioTrack?.id || '';
            const offeredIds = new Set(variants.map(row => row.audioTrack.id));
            if (latest.audioTracks.some(row => !row.id || !offeredIds.has(row.id))) throw Error('native_audio_unsupported');
            if (latest.audioTrackId && selectedId !== latest.audioTrackId
                && !(latest.audioTrackId === 'und' && !selectedId && latest.audioTrackCount <= 1)) throw Error('native_audio_unsupported');
            const singleProgram = source.audio.audioTrack?.singleProgram === true && selectedId === 'und'
                && latest.audioTrackId === 'und' && latest.audioTrackCount <= 1
                && source.audioVariants.every(row => row.audioTrack?.id === 'und' && row.audioTrack.singleProgram === true);
            const formats = [video];
            if (singleProgram) {
                if (variants.length !== 1 || variants[0].url !== selected.url) throw Error('source_invalid');
                delete selected.audioTrack; formats.push(selected);
            } else if (selectedId) {
                const matching = variants.find(row => row.audioTrack.id === selectedId);
                if (!matching || matching.url !== selected.url || matching.itag !== selected.itag) throw Error('source_invalid');
                for (const row of variants) { row.audioTrack.audioIsDefault = row.audioTrack.id === selectedId; formats.push(row); }
            } else {
                if (variants.length || latest.audioTrackCount > 1) throw Error('native_audio_unsupported');
                formats.push(selected);
            }
            if (new Set(formats.map(row => String(row.itag) + (row.xtags ? ';' + row.xtags : ''))).size !== formats.length) throw Error('source_invalid');
            const raw = jsonClone(original, 2 * 1024 * 1024);
            for (const field of ['playerAds', 'adPlacements', 'adSlots', 'adBreakHeartbeatParams']) delete raw[field];
            raw.streamingData = { adaptiveFormats: formats, expiresInSeconds: String(Math.max(1, Math.floor((source.expiresAt - now) / 1000))) };
            raw.playerConfig ||= {};
            raw.playerConfig.mediaCommonConfig ||= {};
            raw.playerConfig.mediaCommonConfig.useServerDrivenAbr = false;
            raw.playerConfig.playbackStartConfig ||= {};
            const position = intent.nativeTimeline === 'content' ? node.currentTime : 0;
            raw.playerConfig.playbackStartConfig.startSeconds = position;
            const watchNext = player.getWatchNextResponse?.();
            let watchNextSnapshot = null;
            if (watchNext != null) {
                if (typeof watchNext !== 'object' || Array.isArray(watchNext)) throw Error('native_navigation_unavailable');
                watchNextSnapshot = jsonClone(watchNext, 2 * 1024 * 1024);
                if (!watchNextSnapshot || typeof watchNextSnapshot !== 'object' || Array.isArray(watchNextSnapshot)) throw Error('native_navigation_unavailable');
                const navigationVideoId = watchNextSnapshot.currentVideoEndpoint?.watchEndpoint?.videoId;
                if (navigationVideoId != null && navigationVideoId !== videoId) throw Error('native_navigation_changed');
            }
            const caption = player.getOption?.('captions', 'track');
            if (latest.captionsEnabled && typeof player.setOption !== 'function') throw Error('native_captions_unavailable');
            const snapshot = { volume: node.volume, muted: node.muted, rate: node.playbackRate };
            if (!Number.isFinite(snapshot.volume) || snapshot.volume < 0 || snapshot.volume > 1
                || typeof snapshot.muted !== 'boolean' || !Number.isFinite(snapshot.rate) || snapshot.rate <= 0 || snapshot.rate > 16) throw Error('playback_intent_invalid');
            transaction = { requestId, videoId, player, node };
            if (!nativeCurrent(transaction)) throw Error('native_player_changed');
            if (Date.now() >= payload.commitDeadline) throw Error('commit_deadline_invalid');
            const finalRequest = nativeRequests.get(requestId);
            if (finalRequest?.reason === 'cancelled' && Date.now() - finalRequest.at < 60000) throw Error('cancelled');
            rememberNative(requestId, 'applied'); nativeTransaction = transaction;
            // A single synchronous paused commit. The isolated coordinator owns
            // admission, readiness verification and any later user-intended play.
            pauseNative(transaction);
            if (nativeRequests.get(requestId)?.reason === 'cancelled') throw Error('cancelled');
            // Native's second argument preserves its existing playlist object,
            // index and queue. Supplying list IDs would recreate that context.
            player.loadVideoByPlayerVars({ video_id: videoId, raw_player_response: raw,
                ...(watchNextSnapshot ? { raw_watch_next_response: watchNextSnapshot } : {}),
                start: position, startSeconds: position, pause_at_start: 1, autoplay: 0, resume: '1' }, true);
            if (nativeRequests.get(requestId)?.reason === 'cancelled') throw Error('cancelled');
            if (!nativeCurrent(transaction)) throw Error('native_player_changed');
            pauseNative(transaction);
            node.volume = snapshot.volume; node.muted = snapshot.muted; node.playbackRate = snapshot.rate;
            if (typeof player.setOption === 'function') {
                const result = player.setOption('captions', 'track', latest.captionsEnabled ? caption : {});
                if (result && typeof result.then === 'function') { result.catch?.(() => {}); throw Error('native_captions_unavailable'); }
            }
            if (nativeRequests.get(requestId)?.reason === 'cancelled') throw Error('cancelled');
            const accepted = player.getPlayerResponse?.();
            const received = accepted?.streamingData?.adaptiveFormats;
            if (accepted?.videoDetails?.videoId !== videoId || !Array.isArray(received) || received.length !== formats.length
                || formats.some(row => !received.some(value => value.itag === row.itag && value.url === row.url))) throw Error('native_source_not_accepted');
            nativeReceipt(requestId, videoId, true, 'native_source_applied');
        } catch (error) {
            pauseNative(transaction);
            const reasons = ['commit_deadline_invalid', 'cancelled', 'request_replayed', 'source_kind_unsupported', 'source_invalid', 'metadata_limit',
                'native_player_unavailable', 'native_playability_unsupported', 'playback_intent_invalid', 'playback_intent_stale',
                'native_preferences_changed', 'native_audio_unsupported', 'native_captions_unavailable', 'native_player_changed', 'native_source_not_accepted',
                'native_navigation_unavailable', 'native_navigation_changed'];
            nativeReceipt(requestId, videoId, false, reasons.includes(error?.message) ? error.message : 'native_source_failed');
        }
    }
    async function selectAudio(videoId, requestId, audioTrackId) {
        let selected = false;
        const generation = ++audioGeneration;
        let timeout = 0;
        try {
            const player = document.getElementById('movie_player');
            const tracks = player?.getAvailableAudioTracks?.();
            const matches = Array.isArray(tracks) && tracks.length <= 64
                ? tracks.filter(track => trackId(track) === audioTrackId) : [];
            if (loadedResponse(videoId)?.playabilityStatus?.status === 'OK'
                && matches.length === 1 && typeof player.setAudioTrack === 'function') {
                const deadline = Date.now() + 2000;
                await Promise.race([
                    Promise.resolve(player.setAudioTrack(matches[0])),
                    new Promise((resolve, reject) => { timeout = window.setTimeout(() => reject(new Error('audio_selection_timeout')), 2000); })
                ]);
                for (let attempt = 0; attempt < 20; attempt++) {
                    if (generation !== audioGeneration || Date.now() >= deadline
                        || currentId() !== videoId || document.getElementById('movie_player') !== player) break;
                    if (trackId(player.getAudioTrack?.()) === audioTrackId) { selected = true; break; }
                    await new Promise(resolve => window.setTimeout(resolve, 100));
                }
            }
        } catch (_) {} finally { if (timeout) window.clearTimeout(timeout); }
        window.postMessage({ type: 'FilterTube_ContentPlaybackAudioResult', source: 'injector',
            payload: { requestId, videoId, audioTrackId, selected } }, location.origin);
    }
    window.addEventListener('message', event => {
        if (event.source !== window || event.origin !== location.origin) return;
        const request = event.data;
        if (!['FilterTube_RequestContentPlayback', 'FilterTube_SelectContentPlaybackAudio', 'FilterTube_ApplyNativeContentSource',
            'FilterTube_CancelNativeContentSource', 'FilterTube_ReadNativeContentState'].includes(request?.type)
            || request.source !== 'content_bridge') return;
        const videoId = request.payload?.videoId;
        const requestId = request.payload?.requestId;
        if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,96}$/.test(requestId)
            || !/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return;
        if (request.type === 'FilterTube_CancelNativeContentSource') {
            rememberNative(requestId, 'cancelled');
            if (nativeTransaction?.requestId === requestId && nativeTransaction.videoId === videoId) {
                pauseNative(nativeTransaction); nativeTransaction = null;
            }
            nativeReceipt(requestId, videoId, false, 'cancelled'); return;
        }
        if (currentId() !== videoId) return;
        if (request.type === 'FilterTube_ApplyNativeContentSource') { applyNative(request.payload); return; }
        if (request.type === 'FilterTube_ReadNativeContentState') {
            let preferences = null; let videoIdMatched = false;
            try {
                const player = document.getElementById('movie_player');
                const response = player?.getPlayerResponse?.();
                videoIdMatched = response?.videoDetails?.videoId === videoId;
                if (videoIdMatched) preferences = nativePreferences(player, response);
            } catch (_) {}
            window.postMessage({ type: 'FilterTube_NativeContentState', source: 'injector',
                payload: { requestId, videoId, preferences, videoIdMatched } }, location.origin); return;
        }
        if (request.type === 'FilterTube_SelectContentPlaybackAudio') {
            const audioTrackId = request.payload?.audioTrackId;
            if (typeof audioTrackId === 'string' && audioTrackId.length > 0 && audioTrackId.length <= 160
                && !/[\u0000-\u001f\u007f]/.test(audioTrackId)) void selectAudio(videoId, requestId, audioTrackId);
            return;
        }
        if (Date.now() - lastRequestAt < 1000) return;
        lastRequestAt = Date.now();
        const response = loadedResponse(videoId);
        let playerResponse = null;
        let preferences = null;
        try {
            if (response) {
                // Bounded projection. Never copy advert plans, tracking data,
                // arbitrary endpoints or an entire recommendation response.
                const streaming = response.streamingData || {};
                const projected = {
                    videoDetails: response.videoDetails,
                    playabilityStatus: response.playabilityStatus,
                    captions: response.captions,
                    drmParams: response.drmParams,
                    streamingData: {
                        formats: Array.isArray(streaming.formats) ? streaming.formats.slice(0, 257) : [],
                        adaptiveFormats: Array.isArray(streaming.adaptiveFormats) ? streaming.adaptiveFormats.slice(0, 257) : [],
                        serverAbrStreamingUrl: streaming.serverAbrStreamingUrl ? 'present' : '',
                        hlsManifestUrl: streaming.hlsManifestUrl ? 'present' : '',
                        dashManifestUrl: streaming.dashManifestUrl ? 'present' : '',
                        drmFamilies: streaming.drmFamilies,
                        licenseInfos: streaming.licenseInfos
                    }
                };
                const serialized = JSON.stringify(projected);
                if (serialized.length <= 512000) playerResponse = JSON.parse(serialized);
                preferences = nativePreferences(document.getElementById('movie_player'), response);
            }
        } catch (_) {
            playerResponse = null;
        }
        window.postMessage({ type: 'FilterTube_ContentPlaybackResponse', source: 'injector',
            payload: { requestId, videoId, playerResponse, preferences } }, location.origin);
    });
})();
