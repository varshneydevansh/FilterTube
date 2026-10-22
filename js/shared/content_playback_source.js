// Pure planning only: no requests, player-code evaluation, admission grants or logging.
(function (root, factory) {
    'use strict';
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.FilterTubeContentPlaybackSource = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
    'use strict';
    const MAX_FORMATS = 256;
    const MAX_TRACKS = 64;
    const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value));
    const text = (value, limit = 160) => typeof value === 'string' ? value.slice(0, limit) : '';
    const positive = value => (typeof value === 'number' || (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)))
        && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
    const label = value => text(typeof value === 'string' ? value : value?.simpleText
        || (Array.isArray(value?.runs) ? value.runs.slice(0, 12).map(run => text(run?.text)).join('') : ''));

    function validatedUrl(raw, caption = false) {
        if (typeof raw !== 'string' || raw.length > 16384 || raw !== raw.trim() || /[\u0000-\u0020\u007f]/.test(raw)) return null;
        try {
            const url = new URL(raw);
            if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
            const host = url.hostname.toLowerCase();
            if (caption) {
                if (!(host === 'youtube.com' || host.endsWith('.youtube.com')) || url.pathname !== '/api/timedtext') return null;
            } else if (!(host === 'googlevideo.com' || host.endsWith('.googlevideo.com')) || url.pathname !== '/videoplayback') return null;
            return url;
        } catch (error) { return null; }
    }

    function playerCandidates(payload) {
        const values = Array.isArray(payload) ? payload : [payload];
        if (values.length > 16) return [];
        return values.map(value => object(value) ? (value.playerResponse || value.player_response || value) : null)
            .filter(value => object(value) && object(value.videoDetails));
    }

    function audioEvidence(track) {
        if (!object(track)) return null;
        const id = text(track.id);
        if (!id) return null;
        const name = label(track.displayName);
        return {
            id, languageCode: text(track.languageCode || id.replace(/\.\d+$/, ''), 40), label: name,
            isDefault: track.audioIsDefault === true,
            isOriginal: track.isOriginal === true || (track.isAutoDubbed === false && /\boriginal\b/i.test(name)),
            isAutoDubbed: track.isAutoDubbed === true
        };
    }

    function trackCapabilities(response, formats) {
        const captionRoot = response.captions?.playerCaptionsTracklistRenderer;
        const declaredCaptions = response.captions !== undefined && response.captions !== null;
        const captionRows = captionRoot?.captionTracks;
        const captionTracks = Array.isArray(captionRows) ? captionRows.slice(0, MAX_TRACKS).map((track, index) => {
            const url = validatedUrl(track?.baseUrl, true);
            return {
                id: text(track?.vssId || track?.id || `caption-${index}`), languageCode: text(track?.languageCode, 40),
                label: label(track?.name), kind: track?.kind === 'asr' ? 'asr' : 'standard',
                nativeVtt: Boolean(url && url.searchParams.get('fmt') === 'vtt'),
                url: url ? track.baseUrl : ''
            };
        }) : [];
        const audio = new Map();
        for (const format of formats) {
            const track = audioEvidence(format?.audioTrack);
            if (track && !audio.has(track.id)) audio.set(track.id, track);
        }
        if (Array.isArray(captionRoot?.audioTracks)) {
            for (const track of captionRoot.audioTracks.slice(0, MAX_TRACKS)) {
                const evidence = audioEvidence(track);
                if (evidence && !audio.has(evidence.id)) audio.set(evidence.id, evidence);
            }
        }
        return {
            captions: {
                available: captionTracks.length > 0, declared: declaredCaptions,
                metadataValid: !declaredCaptions || (object(captionRoot) && Array.isArray(captionRows)
                    && captionRows.length <= MAX_TRACKS && captionTracks.every(track => track.languageCode && track.url)),
                tracks: captionTracks
            },
            audio: { tracks: [...audio.values()].slice(0, MAX_TRACKS), switchingSupported: false }
        };
    }

    // Caller supplies the current authenticated Player payload and a bound
    // video.canPlayType probe. Planning is not an admission decision or proof
    // that the server will accept a signed URL. Unsupported results expose no
    // source/caption URLs. Requirements: captionMode ('native_vtt' only),
    // captionTrackId, captionsRequired, audioTrackId, preferOriginalAudio.
    function plan(options = {}) {
        const input = object(options) ? options : {};
        const videoId = input.videoId;
        const requirements = object(input.requirements) ? input.requirements : {};
        const now = Number.isFinite(input.now) ? input.now : Date.now();
        const unsupported = { cipher: 0, throttling: 0, adaptive: 0, manifest: 0, sabr: 0,
            invalidUrl: 0, expired: 0, incompatible: 0, notMuxed: 0, audioMismatch: 0 };
        const result = {
            supported: false, reason: '', source: null, video: null,
            capabilities: { captions: { available: false, declared: false, tracks: [] }, audio: { tracks: [], switchingSupported: false } },
            unsupported
        };
        const reject = reason => { result.reason = reason; return result; };
        if (typeof videoId !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return reject('invalid_video_id');
        if (!input.playerResponse) return reject('missing_player_response');
        const candidates = playerCandidates(input.playerResponse);
        const matches = candidates.filter(response => response.videoDetails.videoId === videoId);
        if (!matches.length) return reject(candidates.length ? 'video_identity_mismatch' : 'missing_player_response');
        if (matches.length !== 1) return reject('ambiguous_player_response');
        const response = matches[0];
        const details = response.videoDetails;
        result.video = { id: videoId, title: text(details.title, 256), durationSeconds: positive(details.lengthSeconds),
            isLive: details.isLive === true || details.isLiveContent === true || details.isPostLiveDvr === true
                || Boolean(response.playabilityStatus?.liveStreamability) };
        if (response.playabilityStatus?.status !== 'OK') return reject('playability_not_ok');
        if (result.video.isLive) return reject('live_unsupported');
        const streaming = object(response.streamingData) ? response.streamingData : {};
        if (streaming.drmFamilies?.length || streaming.licenseInfos?.length || response.drmParams) return reject('drm_unsupported');
        const formats = Array.isArray(streaming.formats) ? streaming.formats : [];
        const adaptive = Array.isArray(streaming.adaptiveFormats) ? streaming.adaptiveFormats : [];
        if (formats.length > MAX_FORMATS || adaptive.length > MAX_FORMATS) return reject('source_metadata_limit');
        unsupported.adaptive = adaptive.length;
        unsupported.manifest = Number(Boolean(streaming.hlsManifestUrl)) + Number(Boolean(streaming.dashManifestUrl));
        unsupported.sabr = Number(Boolean(streaming.serverAbrStreamingUrl));
        const capabilities = trackCapabilities(response, [...formats, ...adaptive]);
        const privateCaptionTracks = capabilities.captions.tracks;
        result.capabilities = {
            captions: { ...capabilities.captions, tracks: privateCaptionTracks.map(({ url, ...track }) => track) },
            audio: capabilities.audio
        };
        if (!capabilities.captions.metadataValid) return reject('caption_metadata_invalid');
        let selectedCaptions = [];
        if (privateCaptionTracks.length) {
            if (requirements.captionMode !== 'native_vtt') return reject('captions_unsupported');
            selectedCaptions = requirements.captionTrackId
                ? privateCaptionTracks.filter(track => track.id === requirements.captionTrackId) : privateCaptionTracks;
            if (!selectedCaptions.length) return reject('caption_track_unavailable');
            if (requirements.captionTrackId && selectedCaptions.length !== 1) return reject('caption_track_ambiguous');
            if (selectedCaptions.some(track => !track.nativeVtt)) return reject('caption_format_unsupported');
        } else if (requirements.captionTrackId || requirements.captionsRequired === true) {
            return reject('caption_track_unavailable');
        }
        if (typeof input.canPlayType !== 'function') return reject('codec_probe_required');
        const choices = [];
        for (const format of formats) {
            if (!object(format)) continue;
            if (format.signatureCipher || format.cipher) { unsupported.cipher++; continue; }
            const url = validatedUrl(format.url);
            if (!url) { unsupported.invalidUrl++; continue; }
            if (url.searchParams.has('n')) { unsupported.throttling++; continue; }
            const expire = url.searchParams.get('expire');
            const expiresAt = expire && /^\d+$/.test(expire) ? Number(expire) * 1000 : null;
            if (url.searchParams.getAll('expire').length > 1 || (expire && (!Number.isSafeInteger(expiresAt) || expiresAt <= now))) { unsupported.expired++; continue; }
            const mimeType = text(format.mimeType, 512);
            const codecs = mimeType.match(/\bcodecs\s*=\s*"([^"]+)"/i)?.[1] || '';
            const videoCodec = /(?:^|,)\s*(?:avc[13]|hev1|hvc1|vp0?[89]|av01)(?:[.,\s]|$)/i.test(codecs);
            const audioCodec = /(?:^|,)\s*(?:mp4a|opus|vorbis|ac-3|ec-3)(?:[.,\s]|$)/i.test(codecs);
            const audioFields = positive(format.audioChannels) && positive(format.audioSampleRate) && /^AUDIO_QUALITY_(?:LOW|MEDIUM|HIGH)$/.test(format.audioQuality);
            if (!/^video\/(?:mp4|webm)\s*;/i.test(mimeType) || !videoCodec || !(audioCodec || audioFields)
                || !positive(format.width) || !positive(format.height) || format.drmTrackType) {
                unsupported.notMuxed++; continue;
            }
            const track = audioEvidence(format.audioTrack);
            if ((requirements.audioTrackId && track?.id !== requirements.audioTrackId)
                || (requirements.preferOriginalAudio === true && track?.isOriginal !== true)) {
                unsupported.audioMismatch++; continue;
            }
            let compatibility = '';
            try { compatibility = input.canPlayType(mimeType); } catch (error) {}
            if (compatibility !== 'probably' && compatibility !== 'maybe') { unsupported.incompatible++; continue; }
            choices.push({ kind: 'progressive', hasAudio: true, hasVideo: true, url: format.url, mimeType,
                itag: Number.isSafeInteger(format.itag) ? format.itag : null,
                width: Number(format.width), height: Number(format.height), qualityLabel: text(format.qualityLabel, 40),
                bitrate: positive(format.bitrate), expiresAt, audioTrack: track, captionTracks: selectedCaptions.map(value => ({ ...value })) });
        }
        choices.sort((a, b) => b.height - a.height || (b.bitrate || 0) - (a.bitrate || 0));
        if (choices.length) { result.supported = true; result.reason = 'direct_progressive'; result.source = choices[0]; return result; }
        const priority = [
            ['audioMismatch', 'audio_preference_unsupported'], ['throttling', 'throttling_transform_required'],
            ['cipher', 'cipher_unsupported'], ['expired', 'source_expired'], ['incompatible', 'codec_unsupported'],
            ['notMuxed', 'muxed_format_unavailable'], ['sabr', 'sabr_unsupported'], ['adaptive', 'adaptive_unsupported'],
            ['manifest', 'manifest_unsupported'], ['invalidUrl', 'source_url_invalid']
        ];
        return reject(priority.find(([key]) => unsupported[key])?.[1] || 'media_source_unavailable');
    }
    return Object.freeze({ plan });
});
