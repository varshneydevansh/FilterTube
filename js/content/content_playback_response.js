// MAIN-world data bridge only. It never grants playback or fetches another client.
(function () {
    'use strict';
    if (window.__filtertubeContentPlaybackResponseInstalled) return;
    window.__filtertubeContentPlaybackResponseInstalled = true;
    let lastRequestAt = 0;
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
        const candidates = [
            document.querySelector('ytd-watch-flexy')?.playerData,
            document.querySelector('ytd-watch-flexy')?.data?.playerResponse,
            window.ytInitialPlayerResponse,
            window.filterTube?.lastYtPlayerResponse,
            window.filterTube?.lastYtInitialPlayerResponse
        ];
        return candidates.find(value => value?.videoDetails?.videoId === videoId) || null;
    }
    window.addEventListener('message', event => {
        if (event.source !== window || event.origin !== location.origin) return;
        const request = event.data;
        if (request?.type !== 'FilterTube_RequestContentPlayback' || request.source !== 'content_bridge') return;
        const videoId = request.payload?.videoId;
        const requestId = request.payload?.requestId;
        if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,96}$/.test(requestId)
            || !/^[a-zA-Z0-9_-]{11}$/.test(videoId || '') || currentId() !== videoId) return;
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
                const player = document.getElementById('movie_player');
                const audio = player?.getAudioTrack?.() || player?.getOption?.('audio', 'track');
                const availableAudio = player?.getAvailableAudioTracks?.();
                const caption = player?.getOption?.('captions', 'track');
                preferences = {
                    audioTrackId: trackId(audio),
                    audioTrackCount: Array.isArray(availableAudio) ? availableAudio.length : null,
                    captionTrackId: typeof caption?.vss_id === 'string' ? caption.vss_id.slice(0, 160) : '',
                    captionLanguage: typeof caption?.languageCode === 'string' ? caption.languageCode.slice(0, 40) : '',
                    captionsEnabled: Boolean(caption?.languageCode),
                    // Missing player API evidence is not proof that captions
                    // or alternate audio are off.
                    audioKnown: Array.isArray(availableAudio),
                    captionsKnown: Boolean(caption && typeof caption === 'object') || response.captions == null
                };
            }
        } catch (_) {
            playerResponse = null;
        }
        window.postMessage({ type: 'FilterTube_ContentPlaybackResponse', source: 'injector',
            payload: { requestId, videoId, playerResponse, preferences } }, location.origin);
    });
})();
