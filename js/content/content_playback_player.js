(function (root) {
    'use strict';

    // Isolated-world, explicitly started controller. The caller owns admission,
    // profile/settings generations and source/feature planning; presence alone
    // never authorizes media. Renewed leases are read again at every boundary.
    const CHECK_INTERVAL_MS = 250;
    const STARTUP_TIMEOUT_MS = 10000;

    function httpsUrl(value, media) {
        try {
            const url = new URL(value);
            if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return null;
            if (media && (!(url.hostname === 'googlevideo.com' || url.hostname.endsWith('.googlevideo.com'))
                || url.pathname !== '/videoplayback')) return null;
            return url.href;
        } catch (_) {
            return null;
        }
    }

    function mediaState(video) {
        return {
            position: Number.isFinite(video.currentTime) && video.currentTime >= 0 ? video.currentTime : 0,
            volume: Number.isFinite(video.volume) ? Math.max(0, Math.min(1, video.volume)) : 1,
            muted: video.muted === true,
            rate: Number.isFinite(video.playbackRate) && video.playbackRate > 0 ? video.playbackRate : 1,
            paused: video.paused !== false
        };
    }

    function create(options) {
        const { host, originalVideo, originalSurface, validateLease } = options || {};
        if (!host || !originalVideo || !originalSurface || typeof validateLease !== 'function') {
            throw new TypeError('A host, original media surface, video and lease validator are required');
        }
        const now = typeof options.now === 'function' ? options.now : () => Date.now();
        const document = host.ownerDocument;
        let current = null;
        let destroyed = false;

        function notify(name, value) {
            try { options[name]?.(value); } catch (_) { }
        }

        function deadline(session) {
            const leaseExpiry = session.lease?.expiresAt;
            return Number.isFinite(leaseExpiry) ? Math.min(leaseExpiry, session.source.expiresAt) : 0;
        }

        function authorized(session) {
            if (destroyed || current !== session || session.closed || now() >= deadline(session)
                || host.isConnected !== true || originalSurface.isConnected !== true
                || originalVideo.isConnected !== true) return false;
            try {
                return validateLease(session.lease, {
                    videoId: session.videoId, source: session.source
                }) === true && now() < deadline(session);
            } catch (_) {
                return false;
            }
        }

        function finish(session, reason) {
            if (!session || session.closed) return;
            const canRestore = authorized(session);
            const restore = session.active ? mediaState(session.video) : session.prior;
            session.closed = true;
            if (current === session) current = null;
            root.clearTimeout(session.expiryTimer);
            root.clearTimeout(session.startupTimer);
            root.clearInterval(session.checkTimer);
            for (const remove of session.listeners) remove();
            try { session.video?.pause(); } catch (_) { }
            try {
                session.video?.removeAttribute('src');
                session.video?.load();
                session.stage?.remove();
            } catch (_) { }
            for (const url of session.blobUrls || []) {
                try { URL.revokeObjectURL(url); } catch (_) { }
            }
            if (session.surfaceHidden) {
                originalSurface.hidden = session.oldHidden;
                if (session.oldDisplay) {
                    originalSurface.style.setProperty('display', session.oldDisplay, session.oldDisplayPriority);
                } else {
                    originalSurface.style.removeProperty('display');
                }
            }
            // Lost authority must never seek or restart a newly selected route/profile.
            if (canRestore && session.nativeTaken) {
                try {
                    originalVideo.currentTime = restore.position;
                    originalVideo.volume = restore.volume;
                    originalVideo.muted = restore.muted;
                    originalVideo.playbackRate = restore.rate;
                    if (restore.paused) originalVideo.pause();
                    else Promise.resolve(originalVideo.play()).catch(() => {});
                } catch (_) { }
            }
            const result = { status: 'fallback', reason, videoId: session.videoId };
            session.resolve(result);
            notify('onState', result);
            notify('onFallback', { reason, videoId: session.videoId });
        }

        function reject(reason, videoId = '') {
            const result = { status: 'fallback', reason, videoId };
            notify('onState', result);
            notify('onFallback', { reason, videoId });
            return Promise.resolve(result);
        }

        function start(input = {}) {
            if (destroyed) return reject('destroyed');
            if (current) finish(current, 'replaced');
            const { lease, videoId, featurePlan } = input;
            if (!/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) return reject('invalid_video');
            if (!featurePlan || featurePlan.allowed !== true || featurePlan.captionsPreserved !== true
                || featurePlan.audioPreserved !== true || !Array.isArray(featurePlan.captionTracks)) {
                return reject('feature_parity_unavailable', videoId);
            }
            const supplied = input.source || {};
            const url = httpsUrl(supplied.url, true);
            if (!url || supplied.kind !== 'progressive' || supplied.hasAudio !== true || supplied.hasVideo !== true
                || typeof supplied.mimeType !== 'string' || !/^video\//i.test(supplied.mimeType)) {
                return reject('unsupported_source', videoId);
            }
            if (!Number.isFinite(lease?.expiresAt) || !Number.isFinite(supplied.expiresAt)) {
                return reject('expiry_required', videoId);
            }
            const expiresAt = Math.min(lease.expiresAt, supplied.expiresAt);
            if (now() >= expiresAt) return reject('expired', videoId);
            if (originalSurface.contains(host) || !document) return reject('invalid_host', videoId);
            if (root.navigator?.userActivation && root.navigator.userActivation.isActive !== true) {
                return reject('user_gesture_required', videoId);
            }

            const tracks = [];
            let captionSize = 0;
            if (featurePlan.captionTracks.length > 32) return reject('unsupported_captions', videoId);
            for (const track of featurePlan.captionTracks) {
                const hasText = typeof track?.vttText === 'string';
                const trackUrl = hasText ? null : httpsUrl(track?.url, false);
                if (hasText) captionSize += new TextEncoder().encode(track.vttText).byteLength;
                if ((!trackUrl && !hasText) || (hasText && !/^\uFEFF?WEBVTT(?:[ \t][^\r\n]*)?(?:\r?\n|$)/.test(track.vttText))
                    || captionSize > 2 * 1024 * 1024 || !track.languageCode || !['subtitles', 'captions'].includes(track.kind)) {
                    return reject('unsupported_captions', videoId);
                }
                tracks.push({ id: typeof track.id === 'string' ? track.id : '',
                    url: trackUrl, vttText: hasText ? track.vttText : null, languageCode: String(track.languageCode),
                    label: String(track.label || track.languageCode), kind: track.kind });
            }
            const originalCaption = Array.from(originalVideo.textTracks || []).find(track => track.mode === 'showing');
            const captionLanguage = typeof featurePlan.selectedCaptionLanguage === 'string'
                ? featurePlan.selectedCaptionLanguage : originalCaption?.language || '';
            const captionId = typeof featurePlan.selectedCaptionId === 'string' ? featurePlan.selectedCaptionId : '';
            if ((originalVideo.textTracks?.length || 0) > 0 && !tracks.length) {
                return reject('captions_unavailable', videoId);
            }
            const selectedTracks = captionId ? tracks.filter(track => track.id === captionId)
                : tracks.filter(track => track.languageCode === captionLanguage);
            if ((captionId && (selectedTracks.length !== 1 || !captionLanguage
                || selectedTracks[0].languageCode !== captionLanguage))
                || (!captionId && captionLanguage && selectedTracks.length !== 1)) {
                return reject('selected_captions_unavailable', videoId);
            }
            const originalAudio = Array.from(originalVideo.audioTracks || []).find(track => track.enabled);
            const audioTrackId = featurePlan.audioTrackId || originalAudio?.id || '';
            if ((audioTrackId && supplied.audioTrackId !== audioTrackId)
                || ((originalVideo.audioTracks?.length || 0) > 1 && !audioTrackId)) {
                return reject('selected_audio_unavailable', videoId);
            }
            const source = Object.freeze({ ...supplied, url });
            let resolve;
            const result = new Promise(done => { resolve = done; });
            const session = { lease, videoId, source, resolve, listeners: [], blobUrls: [],
                prior: mediaState(originalVideo), closed: false, active: false, played: false,
                positioned: false, nativeTaken: false, surfaceHidden: false, captionsReady: !captionLanguage };
            current = session;
            if (!authorized(session)) {
                finish(session, 'authorization_invalid');
                return result;
            }

            const listen = (target, name, callback) => {
                target.addEventListener(name, callback);
                session.listeners.push(() => target.removeEventListener(name, callback));
            };
            const video = document.createElement('video');
            session.video = video;
            const supported = video.canPlayType?.(source.mimeType);
            if (supported !== 'maybe' && supported !== 'probably') {
                finish(session, 'unsupported_media_type');
                return result;
            }
            const stage = document.createElement('div');
            session.stage = stage;
            stage.setAttribute('data-filtertube-owned-content-player', videoId);
            stage.hidden = true;
            video.controls = true;
            video.playsInline = true;
            video.preload = 'auto';
            video.muted = true;
            if (tracks.some(track => track.url)) video.crossOrigin = 'anonymous';
            video.style.width = '100%';
            stage.style.height = '100%';
            video.style.height = '100%';
            video.style.objectFit = 'contain';
            video.style.display = 'block';
            stage.appendChild(video);

            function check() {
                if (now() >= deadline(session)) { finish(session, 'expired'); return false; }
                if (!authorized(session)) { finish(session, 'authorization_invalid'); return false; }
                return true;
            }

            function ready() {
                if (!check() || session.active || !session.played || video.readyState < 1 || video.paused !== false) return;
                if (!session.captionsReady) return;
                if (!session.nativeTaken) {
                    // Native controls remain usable during muted preparation.
                    // Freeze their latest state only when a candidate is ready.
                    session.prior = mediaState(originalVideo);
                    originalVideo.pause();
                    if (originalVideo.paused !== true) { finish(session, 'native_pause_failed'); return; }
                    session.nativeTaken = true;
                }
                if (!session.positioned) {
                    try {
                        video.currentTime = session.prior.position;
                        session.positioned = true;
                    } catch (_) { finish(session, 'position_unavailable'); return; }
                }
                if (video.seeking || !session.captionsReady) return;
                if (!check()) return;
                // Keep the original visible until the candidate has really played.
                originalVideo.pause();
                if (originalVideo.paused !== true) { finish(session, 'native_pause_failed'); return; }
                session.oldHidden = originalSurface.hidden;
                session.oldDisplay = originalSurface.style.getPropertyValue('display');
                session.oldDisplayPriority = originalSurface.style.getPropertyPriority('display');
                session.surfaceHidden = true;
                originalSurface.hidden = true;
                originalSurface.style.setProperty('display', 'none', 'important');
                stage.hidden = false;
                video.volume = session.prior.volume;
                video.playbackRate = session.prior.rate;
                if (session.prior.paused) video.pause();
                video.muted = session.prior.muted;
                session.active = true;
                root.clearTimeout(session.startupTimer);
                const value = { status: 'active', videoId, paused: video.paused };
                session.resolve(value);
                notify('onState', value);
            }

            for (const track of tracks) {
                const element = document.createElement('track');
                element.kind = track.kind;
                element.srclang = track.languageCode;
                element.label = track.label;
                try {
                    element.src = track.url || URL.createObjectURL(new Blob([track.vttText], { type: 'text/vtt' }));
                    if (!track.url) session.blobUrls.push(element.src);
                } catch (_) { finish(session, 'caption_blob_unavailable'); return result; }
                element.default = captionId ? track.id === captionId : track.languageCode === captionLanguage;
                listen(element, 'error', () => finish(session, 'caption_error'));
                listen(element, 'load', () => {
                    if (!check()) return;
                    // Once controls are live, loading a user-selected alternative
                    // must not reset that selection to the original language.
                    if (session.active) return;
                    if (element.track) element.track.mode = element.default ? 'showing' : 'disabled';
                    if (element.default) session.captionsReady = true;
                    ready();
                });
                video.appendChild(element);
            }
            listen(video, 'playing', () => { session.played = true; ready(); });
            listen(video, 'play', check);
            listen(video, 'loadedmetadata', ready);
            listen(video, 'seeked', ready);
            listen(video, 'error', () => finish(session, 'media_error'));
            listen(originalVideo, 'play', () => {
                if (!check()) return;
                if (session.nativeTaken) originalVideo.pause();
            });
            const nativeSelection = () => JSON.stringify({
                captions: Array.from(originalVideo.textTracks || []).filter(track => track.mode === 'showing')
                    .map(track => [track.id || '', track.language || '', track.label || '', track.kind || '']),
                audio: Array.from(originalVideo.audioTracks || []).filter(track => track.enabled)
                    .map(track => [track.id || '', track.language || '', track.label || ''])
            });
            const initialSelection = nativeSelection();
            const selectionChanged = () => {
                if (nativeSelection() !== initialSelection) finish(session, 'native_feature_selection_changed');
            };
            for (const list of [originalVideo.textTracks, originalVideo.audioTracks]) {
                if (typeof list?.addEventListener === 'function') listen(list, 'change', selectionChanged);
            }
            function armExpiry() {
                const remaining = deadline(session) - now();
                if (remaining <= 0) { finish(session, 'expired'); return; }
                session.expiryTimer = root.setTimeout(() => {
                    // The admission owner may renew the same opaque lease.
                    if (check()) armExpiry();
                }, Math.min(2147483647, remaining));
            }
            armExpiry();
            session.checkTimer = root.setInterval(check, CHECK_INTERVAL_MS);
            session.startupTimer = root.setTimeout(() => finish(session, 'startup_timeout'), STARTUP_TIMEOUT_MS);
            notify('onState', { status: 'staging', videoId });
            try {
                if (!check()) return result;
                host.appendChild(stage);
                video.src = source.url;
                if (!check()) return result;
                Promise.resolve(video.play()).catch(() => finish(session, 'play_rejected'));
            } catch (_) {
                finish(session, 'media_start_failed');
            }
            return result;
        }

        return {
            start,
            stop(reason = 'stopped') { if (current) finish(current, reason); },
            destroy() { if (current) finish(current, 'destroyed'); destroyed = true; }
        };
    }

    root.FilterTubeContentPlaybackPlayer = Object.freeze({ create });
})(typeof window !== 'undefined' ? window : globalThis);
