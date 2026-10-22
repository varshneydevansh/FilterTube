(function (root) {
    'use strict';

    // Isolated-world, explicitly started controller. The caller owns admission,
    // profile/settings generations and source/feature planning; presence alone
    // never authorizes media. Renewed leases are read again at every boundary.
    const CHECK_INTERVAL_MS = 250;
    const STARTUP_TIMEOUT_MS = 10000;
    const ACTION_TTL_MS = 30000;
    const trustedActions = new WeakMap();

    function captureTrustedAction(event, videoId) {
        if (event?.isTrusted !== true || !/^[A-Za-z0-9_-]{11}$/.test(videoId || '')
            || (root.navigator?.userActivation && root.navigator.userActivation.isActive !== true)) return null;
        const token = Object.freeze({});
        trustedActions.set(token, { videoId, issuedAt: Date.now() });
        return token;
    }

    function consumeAction(token, videoId) {
        if (!token || (typeof token !== 'object' && typeof token !== 'function')) return false;
        const action = trustedActions.get(token);
        trustedActions.delete(token);
        const age = Date.now() - action?.issuedAt;
        return action?.videoId === videoId && Number.isFinite(age) && age >= 0 && age < ACTION_TTL_MS;
    }

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

    function playbackIntent(value, videoId) {
        if (!value || value.videoId !== videoId || !['content', 'unrelated'].includes(value.nativeTimeline)
            || !Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0
            || !Number.isFinite(value.positionSeconds) || value.positionSeconds < 0
            || value.positionSeconds > value.durationSeconds
            || typeof value.paused !== 'boolean' || typeof value.muted !== 'boolean'
            || !Number.isFinite(value.volume) || value.volume < 0 || value.volume > 1
            || !Number.isFinite(value.rate) || value.rate <= 0 || value.rate > 16) return null;
        return Object.freeze({ videoId, nativeTimeline: value.nativeTimeline, durationSeconds: value.durationSeconds,
            position: value.positionSeconds, volume: value.volume, muted: value.muted,
            rate: value.rate, paused: value.paused });
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

        function originalIsContent() {
            if (typeof options.isOriginalContent !== 'function') return true;
            try { return options.isOriginalContent() === true; } catch (_) { return false; }
        }

        function restoreAuthority(session) {
            if (now() >= deadline(session) || !originalIsContent()) return false;
            try { return validateLease(session.lease, { videoId: session.videoId, source: session.source }) === true; }
            catch (_) { return false; }
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
            try { session.transport?.destroy(); } catch (_) { }
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
            if (canRestore && session.nativeTaken && session.restoreNativeTimeline && originalIsContent()) {
                try {
                    originalVideo.currentTime = restore.position;
                    originalVideo.volume = restore.volume;
                    originalVideo.muted = restore.muted;
                    originalVideo.playbackRate = restore.rate;
                    if (restore.paused) originalVideo.pause();
                    else if (restoreAuthority(session)) Promise.resolve(originalVideo.play()).catch(() => {});
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
            if (input.actionToken !== undefined && !consumeAction(input.actionToken, videoId)) return reject('user_gesture_required', videoId);
            const intent = input.playbackIntent === undefined ? null : playbackIntent(input.playbackIntent, videoId);
            if (input.playbackIntent !== undefined && !intent) return reject('invalid_playback_intent', videoId);
            if (!featurePlan || featurePlan.allowed !== true || featurePlan.captionsPreserved !== true
                || featurePlan.audioPreserved !== true || !Array.isArray(featurePlan.captionTracks)) {
                return reject('feature_parity_unavailable', videoId);
            }
            const supplied = input.source || {};
            const adaptive = supplied.kind === 'adaptive_mp4';
            const url = adaptive ? null : httpsUrl(supplied.url, true);
            if ((!adaptive && (!url || supplied.kind !== 'progressive'
                || typeof supplied.mimeType !== 'string' || !/^video\//i.test(supplied.mimeType)))
                || (adaptive && typeof root.FilterTubeContentPlaybackTransport?.create !== 'function')
                || supplied.hasAudio !== true || supplied.hasVideo !== true) {
                return reject('unsupported_source', videoId);
            }
            if (!Number.isFinite(lease?.expiresAt) || !Number.isFinite(supplied.expiresAt)) {
                return reject('expiry_required', videoId);
            }
            const expiresAt = Math.min(lease.expiresAt, supplied.expiresAt);
            if (now() >= expiresAt) return reject('expired', videoId);
            if (originalSurface.contains(host) || !document) return reject('invalid_host', videoId);
            if (input.actionToken === undefined && root.navigator?.userActivation && root.navigator.userActivation.isActive !== true) {
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
            const audioChoices = [];
            if (adaptive && supplied.audioVariants !== undefined) {
                if (!Array.isArray(supplied.audioVariants) || supplied.audioVariants.length > 64) return reject('selected_audio_unavailable', videoId);
                for (const variant of supplied.audioVariants) {
                    const id = variant?.audioTrack?.id;
                    if (typeof id !== 'string' || !id || id.length > 160 || audioChoices.some(choice => choice.id === id)) {
                        return reject('selected_audio_unavailable', videoId);
                    }
                    audioChoices.push({ id, label: String(variant.audioTrack.label || variant.audioTrack.displayName || id).slice(0, 200) });
                }
                if (!audioChoices.some(choice => choice.id === (audioTrackId || supplied.audioTrackId))) return reject('selected_audio_unavailable', videoId);
                if (audioChoices.length > 1 && typeof options.synchronizeNativeAudio !== 'function') return reject('audio_switch_unavailable', videoId);
            }
            const source = Object.freeze({ ...supplied, url });
            let resolve;
            const result = new Promise(done => { resolve = done; });
            const session = { lease, videoId, source, resolve, listeners: [], blobUrls: [],
                prior: intent || mediaState(originalVideo), intent,
                restoreNativeTimeline: !intent || intent.nativeTimeline === 'content',
                closed: false, active: false, played: false,
                positioned: false, nativeTaken: false, surfaceHidden: false, captionsReady: !captionLanguage,
                selectedAudioId: audioTrackId || supplied.audioTrackId || '' };
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
            const supported = adaptive ? 'probably' : video.canPlayType?.(source.mimeType);
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
                if (session.intent && (!Number.isFinite(video.duration)
                    || Math.abs(video.duration - session.intent.durationSeconds) > 2.5)) {
                    finish(session, 'content_duration_mismatch'); return;
                }
                if (session.restoreNativeTimeline && !originalIsContent()) {
                    if (!session.intent) { finish(session, 'content_timeline_unknown'); return; }
                    session.restoreNativeTimeline = false;
                    session.prior = session.intent;
                    session.positioned = false;
                }
                if (!session.nativeTaken && session.restoreNativeTimeline) {
                    // Native controls remain usable during muted preparation.
                    // Only a known main-content timeline can supply position or
                    // controls; an advert must never overwrite the caller's
                    // exact-video playback intent.
                    session.prior = mediaState(originalVideo);
                    originalVideo.pause();
                    if (originalVideo.paused !== true) { finish(session, 'native_pause_failed'); return; }
                    session.nativeTaken = true;
                }
                if (!session.positioned) {
                    try {
                        if (!Number.isFinite(video.currentTime) || Math.abs(video.currentTime - session.prior.position) > 0.05) {
                            video.currentTime = session.prior.position;
                        }
                        session.positioned = true;
                    } catch (_) { finish(session, 'position_unavailable'); return; }
                }
                if (video.seeking || !session.captionsReady) return;
                if (!check()) return;
                // Keep the original visible until the candidate has really played.
                originalVideo.pause();
                if (originalVideo.paused !== true) { finish(session, 'native_pause_failed'); return; }
                session.nativeTaken = true;
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
            listen(video, 'ended', () => {
                if (session.active && check()) notify('onState', { status: 'ended', videoId });
            });
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
            let initialSelection = nativeSelection(), synchronizingAudio = false;
            const selectionChanged = () => {
                if (synchronizingAudio) {
                    if (JSON.stringify(JSON.parse(nativeSelection()).captions) !== JSON.stringify(JSON.parse(initialSelection).captions)) {
                        finish(session, 'native_feature_selection_changed');
                    }
                    return;
                }
                if (nativeSelection() !== initialSelection) finish(session, 'native_feature_selection_changed');
            };
            for (const list of [originalVideo.textTracks, originalVideo.audioTracks]) {
                if (typeof list?.addEventListener === 'function') listen(list, 'change', selectionChanged);
            }
            if (audioChoices.length > 1) {
                const label = document.createElement('label');
                label.textContent = 'Audio';
                Object.assign(label.style, { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px',
                    minHeight: '44px', color: '#fff', background: '#111', font: '14px/1.5 system-ui,sans-serif' });
                const select = document.createElement('select');
                select.setAttribute('aria-label', 'Audio track');
                Object.assign(select.style, { minHeight: '44px', maxWidth: '100%', padding: '8px', font: 'inherit' });
                for (const choice of audioChoices) {
                    const option = document.createElement('option'); option.value = choice.id; option.textContent = choice.label;
                    select.appendChild(option);
                }
                select.value = session.selectedAudioId;
                listen(select, 'change', async event => {
                    if (event.isTrusted !== true || !session.active || select.disabled || !check()) return;
                    const id = select.value;
                    if (!audioChoices.some(choice => choice.id === id) || id === session.selectedAudioId) {
                        select.value = session.selectedAudioId; return;
                    }
                    select.disabled = true; let acknowledged = false;
                    try {
                        synchronizingAudio = true;
                        acknowledged = await options.synchronizeNativeAudio({ videoId, audioTrackId: id }) === true;
                        if (!check()) return;
                        selectionChanged();
                        if (session.closed) return;
                        if (!acknowledged) {
                            select.value = session.selectedAudioId;
                            notify('onState', { status: 'audio_switch_failed', videoId, audioTrackId: session.selectedAudioId });
                            return;
                        }
                        initialSelection = nativeSelection(); synchronizingAudio = false;
                        await session.transport.switchAudio(id);
                        if (!check()) return;
                        session.selectedAudioId = id;
                        notify('onState', { status: 'audio_changed', videoId, audioTrackId: id });
                    } catch (_) {
                        if (acknowledged) finish(session, 'audio_switch_failed');
                        else if (!session.closed) {
                            select.value = session.selectedAudioId;
                            notify('onState', { status: 'audio_switch_failed', videoId, audioTrackId: session.selectedAudioId });
                        }
                    } finally {
                        synchronizingAudio = false; select.disabled = false;
                        if (!acknowledged && !session.closed) selectionChanged();
                    }
                });
                label.appendChild(select); stage.appendChild(label);
                video.style.height = 'calc(100% - 56px)';
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
                if (adaptive) {
                    session.transport = root.FilterTubeContentPlaybackTransport.create({ video, source,
                        fetch: options.fetch || root.fetch?.bind(root), isCurrent: () => authorized(session),
                        onError: error => finish(session, error?.code || 'adaptive_transport_failed') });
                    Promise.resolve(session.transport.start()).then(() => {
                        if (check()) return video.play();
                    }).catch(() => finish(session, 'adaptive_start_failed'));
                } else {
                    video.src = source.url;
                    if (!check()) return result;
                    Promise.resolve(video.play()).catch(() => finish(session, 'play_rejected'));
                }
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

    root.FilterTubeContentPlaybackPlayer = Object.freeze({ create, captureTrustedAction });
})(typeof window !== 'undefined' ? window : globalThis);
