/*
 * MAIN-world bridge for Google-owned YouTube players.
 *
 * Google Search may run the embedded YouTube player in the Google document
 * instead of a youtube.com iframe. Capture only the admission metadata from
 * the Player/Next/resolve_url responses and relay a sanitized record to the
 * isolated FilterTube guard. The response itself is never modified.
 */
(function installFilterTubeExternalYouTubeNetworkBridge(root) {
    'use strict';

    if (!root || root.__filtertubeExternalYouTubeNetworkInstalled) return;
    root.__filtertubeExternalYouTubeNetworkInstalled = true;

    const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
    const ENDPOINT_PATTERN = /\/(?:youtubei\/v1\/(?:resolve_url|player|next))(?:\?|$)/;
    const CONTROL_SOURCE = 'filtertube-external-guard';
    const NETWORK_SOURCE = 'filtertube-external-network';
    let admissionActive = false;
    let currentVideoId = '';
    let latestMetadata = null;
    let policyRevision = null;
    const isDecorativeMedia = media => media?.getAttribute?.('data-filtertube-admission-background') === 'true';
    const decisionsByVideoId = new Map();
    const heldMedia = new Map();

    function isYouTubeEmbedDocument() {
        try {
            const url = new URL(String(root.location?.href || ''));
            return /(^|\.)(youtube\.com|youtube-nocookie\.com)$/i.test(url.hostname)
                && url.pathname.startsWith('/embed/');
        } catch (e) {
            return false;
        }
    }

    function extractLocationVideoId() {
        try {
            const url = new URL(String(root.location?.href || ''));
            const routeMatch = url.pathname.match(/^\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})(?:\/|$)/);
            if (routeMatch) return routeMatch[1];
            const watchId = url.pathname.startsWith('/watch') ? url.searchParams.get('v') : '';
            if (VIDEO_ID_PATTERN.test(String(watchId || ''))) return watchId;
            let hash = url.hash || '';
            try { hash = decodeURIComponent(hash); } catch (e) {}
            return hash.match(/(?:^|[,:;&])vid[:=]([A-Za-z0-9_-]{11})(?=$|[,:;&])/i)?.[1] || '';
        } catch (e) {
            return '';
        }
    }

    function playbackVideoId() {
        const routeVideoId = extractLocationVideoId();
        if (routeVideoId) currentVideoId = routeVideoId;
        return VIDEO_ID_PATTERN.test(currentVideoId) ? currentVideoId : '';
    }

    function postPlaybackAttempt(videoId) {
        if (!VIDEO_ID_PATTERN.test(videoId)) return;
        root.postMessage({
            type: 'FilterTube_ExternalYouTubePlaybackAttempt',
            source: NETWORK_SOURCE,
            payload: { videoId }
        }, '*');
    }

    const mediaPrototype = root.HTMLMediaElement?.prototype;
    const originalMediaPlay = mediaPrototype?.play;
    const originalMediaPause = mediaPrototype?.pause;

    function pauseMedia(media, videoId) {
        if (isDecorativeMedia(media)) return false;
        if (!media || (!VIDEO_ID_PATTERN.test(videoId) && !isYouTubeEmbedDocument())) return false;
        heldMedia.set(media, videoId);
        try {
            if (typeof originalMediaPause === 'function') originalMediaPause.call(media);
            else media.pause?.();
        } catch (e) {}
        postPlaybackAttempt(videoId);
        return true;
    }

    function shouldHold(videoId) {
        if (!admissionActive || !isYouTubeEmbedDocument()) return false;
        if (!VIDEO_ID_PATTERN.test(videoId)) return true;
        return decisionsByVideoId.get(videoId) !== 'allowed';
    }

    function resumeHeldMedia(videoId = '') {
        for (const [media, heldVideoId] of [...heldMedia.entries()]) {
            if (videoId && heldVideoId !== videoId) continue;
            heldMedia.delete(media);
            try {
                if (typeof originalMediaPlay === 'function') originalMediaPlay.call(media)?.catch?.(() => {});
                else media.play?.()?.catch?.(() => {});
            } catch (e) {}
        }
    }

    if (mediaPrototype && typeof originalMediaPlay === 'function') {
        mediaPrototype.play = function filterTubeExternalMediaPlay() {
            if (isDecorativeMedia(this)) return originalMediaPlay.apply(this, arguments);
            const videoId = playbackVideoId();
            if (shouldHold(videoId)) {
                pauseMedia(this, videoId);
                return Promise.resolve();
            }
            return originalMediaPlay.apply(this, arguments);
        };
    }

    function holdPlayingMedia(event) {
        const media = event?.composedPath?.()?.[0] || event?.target;
        if (!mediaPrototype || !mediaPrototype.isPrototypeOf(media)) return;
        const videoId = playbackVideoId();
        if (shouldHold(videoId)) pauseMedia(media, videoId);
    }

    try {
        root.document?.addEventListener?.('play', holdPlayingMedia, true);
        root.document?.addEventListener?.('playing', holdPlayingMedia, true);
    } catch (e) {}

    function acceptControlMessage(data) {
        if (data?.source !== CONTROL_SOURCE) return;
        if (data?.type === 'FilterTube_ExternalYouTubeAdmissionControl') {
            if (data.revision !== undefined && policyRevision === data.revision) return;
            policyRevision = data.revision;
            admissionActive = data.active === true;
            if (!admissionActive) {
                decisionsByVideoId.clear();
                resumeHeldMedia();
            } else {
                // A settings refresh revokes every older allow decision until the
                // isolated owner re-evaluates the current Player metadata.
                decisionsByVideoId.clear();
                for (const media of root.document?.querySelectorAll?.('video') || []) {
                    if (isYouTubeEmbedDocument() && !media.paused) pauseMedia(media, playbackVideoId());
                }
                if (latestMetadata) {
                    root.postMessage({
                        type: 'FilterTube_ExternalYouTubeMetadata',
                        source: NETWORK_SOURCE,
                        payload: latestMetadata
                    }, '*');
                }
            }
            return;
        }
        if (data?.type !== 'FilterTube_ExternalYouTubeAdmissionDecision') return;
        const videoId = String(data.videoId || '');
        const decision = String(data.decision || '');
        if (!VIDEO_ID_PATTERN.test(videoId) || !['pending', 'allowed', 'blocked'].includes(decision)) return;
        decisionsByVideoId.set(videoId, decision);
        if (decision === 'allowed') resumeHeldMedia(videoId);
    }
    function handleControlMessage(event) {
        if (event.source !== root) return;
        acceptControlMessage(event.data);
    }
    root.addEventListener?.('message', handleControlMessage);

    function normalizeLanguageCode(value) {
        const raw = typeof value === 'string' ? value.trim().replace(/_/g, '-') : '';
        if (!raw) return '';
        const base = raw.split('-')[0].toLowerCase();
        return /^[a-z]{2,3}$/.test(base) ? base : '';
    }

    function inferLanguage(playerResponse) {
        const formats = [
            ...(Array.isArray(playerResponse?.streamingData?.formats) ? playerResponse.streamingData.formats : []),
            ...(Array.isArray(playerResponse?.streamingData?.adaptiveFormats) ? playerResponse.streamingData.adaptiveFormats : [])
        ];
        const audioTracks = formats.map(format => format?.audioTrack).filter(Boolean);
        const original = audioTracks.find(track => track.audioIsDefault === true && track.isAutoDubbed !== true)
            || audioTracks.find(track => track.isAutoDubbed !== true && /\boriginal\b/i.test(String(track.displayName || '')))
            || audioTracks.find(track => track.audioIsDefault === true);
        const fromFormat = normalizeLanguageCode(String(original?.id || '').replace(/\.\d+$/, ''));
        if (fromFormat) return fromFormat;

        const renderer = playerResponse?.captions?.playerCaptionsTracklistRenderer;
        const captionTracks = Array.isArray(renderer?.captionTracks) ? renderer.captionTracks : [];
        const audioTrack = Array.isArray(renderer?.audioTracks)
            ? renderer.audioTracks[renderer.defaultAudioTrackIndex || 0]
            : null;
        const captionIndex = Number.isInteger(audioTrack?.defaultCaptionTrackIndex)
            ? audioTrack.defaultCaptionTrackIndex
            : -1;
        return normalizeLanguageCode(captionIndex >= 0 ? captionTracks[captionIndex]?.languageCode : '');
    }

    function sanitizePlayerMetadata(payload) {
        const playerResponse = payload?.playerResponse || payload?.response || payload;
        const details = playerResponse?.videoDetails;
        const microformat = playerResponse?.microformat?.playerMicroformatRenderer;
        const videoId = String(details?.videoId || microformat?.externalVideoId || '').trim();
        if (!VIDEO_ID_PATTERN.test(videoId)) return null;
        const ownerProfileUrl = String(microformat?.ownerProfileUrl || '');
        const handleMatch = ownerProfileUrl.match(/\/@([^/?#]+)/);
        return {
            videoId,
            title: String(details?.title || microformat?.title?.simpleText || '').trim(),
            shortDescription: String(details?.shortDescription || microformat?.description?.simpleText || '').trim(),
            keywords: Array.isArray(details?.keywords)
                ? details.keywords.map(value => String(value || '').trim()).filter(Boolean)
                : [],
            lengthSeconds: details?.lengthSeconds || microformat?.lengthSeconds || null,
            channelId: String(details?.channelId || microformat?.externalChannelId || '').trim(),
            channelName: String(details?.author || microformat?.ownerChannelName || '').trim(),
            channelHandle: handleMatch?.[1] ? `@${handleMatch[1]}` : '',
            publishDate: String(microformat?.publishDate || '').trim(),
            uploadDate: String(microformat?.uploadDate || '').trim(),
            category: String(microformat?.category || microformat?.genre || '').trim(),
            languageCode: inferLanguage(playerResponse),
            identityVerified: true,
            textVerified: true
        };
    }

    function extractEndpointVideoId(payload) {
        const candidates = [
            payload?.endpoint?.watchEndpoint?.videoId,
            payload?.currentVideoEndpoint?.watchEndpoint?.videoId,
            payload?.currentVideoEndpoint?.commandMetadata?.webCommandMetadata?.url?.match?.(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1]
        ];
        return candidates.find(value => VIDEO_ID_PATTERN.test(String(value || ''))) || '';
    }

    function relayPayload(url, payload) {
        if (!payload || typeof payload !== 'object') return;
        const metadata = sanitizePlayerMetadata(payload);
        const videoId = metadata?.videoId || extractEndpointVideoId(payload);
        if (!VIDEO_ID_PATTERN.test(videoId)) return;
        currentVideoId = videoId;
        latestMetadata = metadata || (latestMetadata?.videoId === videoId ? latestMetadata : { videoId });
        for (const [media, heldVideoId] of heldMedia) {
            if (VIDEO_ID_PATTERN.test(heldVideoId)) continue;
            heldMedia.set(media, videoId);
            pauseMedia(media, videoId);
        }
        root.postMessage({
            type: 'FilterTube_ExternalYouTubeMetadata',
            source: NETWORK_SOURCE,
            payload: latestMetadata
        }, '*');
    }

    function shouldInspect(rawUrl) {
        try {
            return ENDPOINT_PATTERN.test(new URL(String(rawUrl || ''), root.location?.origin).pathname);
        } catch (e) {
            return ENDPOINT_PATTERN.test(String(rawUrl || '').split('#')[0]);
        }
    }

    const originalFetch = root.fetch;
    if (typeof originalFetch === 'function') {
        root.fetch = function filterTubeExternalFetch(resource, init) {
            const rawUrl = resource instanceof Request ? resource.url : resource;
            const responsePromise = originalFetch.apply(this, arguments);
            if (!shouldInspect(rawUrl)) return responsePromise;
            return responsePromise.then(async response => {
                try {
                    if (response?.ok) relayPayload(String(rawUrl || ''), await response.clone().json());
                } catch (e) {
                }
                return response;
            });
        };
    }

    try {
        const proto = root.XMLHttpRequest?.prototype;
        const originalOpen = proto?.open;
        if (typeof originalOpen === 'function') {
            proto.open = function filterTubeExternalXhrOpen(method, url) {
                this.__filtertubeExternalUrl = String(url || '');
                if (shouldInspect(url)) {
                    this.addEventListener('readystatechange', () => {
                        if (this.readyState !== 4 || this.__filtertubeExternalRelayed) return;
                        this.__filtertubeExternalRelayed = true;
                        try {
                            const payload = this.responseType === 'json'
                                ? this.response
                                : JSON.parse(String(this.responseText || '').replace(/^\)\]\}'\s*/, ''));
                            relayPayload(this.__filtertubeExternalUrl, payload);
                        } catch (e) {
                        }
                    }, true);
                }
                return originalOpen.apply(this, arguments);
            };
        }
    } catch (e) {
    }

    root.FilterTubeExternalYouTubeNetwork = {
        extractLocationVideoId,
        isYouTubeEmbedDocument,
        relayPayload,
        handleControlMessage,
        acceptControlMessage
    };
})(typeof window !== 'undefined' ? window : globalThis);
