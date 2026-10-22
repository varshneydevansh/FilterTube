(function (root) {
    'use strict';
    const ACTION_TTL_MS = 30000;
    const TRANSACTION_TIMEOUT_MS = 12000;
    const CANCEL_TIMEOUT_MS = 2000;
    const STATE_TIMEOUT_MS = 2000;
    const actions = new WeakMap();
    const owners = new WeakMap();
    const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{11}$/.test(value);

    function captureTrustedAction(event, videoId) {
        if (event?.isTrusted !== true || !validId(videoId)
            || (root.navigator?.userActivation && root.navigator.userActivation.isActive !== true)) return null;
        const token = Object.freeze({});
        actions.set(token, { videoId, time: Date.now() });
        return token;
    }
    function consumeAction(token, videoId) {
        if (!token || typeof token !== 'object') return false;
        const action = actions.get(token); actions.delete(token);
        const age = Date.now() - action?.time;
        return action?.videoId === videoId && Number.isFinite(age) && age >= 0 && age < ACTION_TTL_MS;
    }
    function nonce() {
        const bytes = new Uint8Array(18); root.crypto.getRandomValues(bytes);
        return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    }
    function intentFor(value, videoId) {
        if (!value || value.videoId !== videoId || !['content', 'unrelated'].includes(value.nativeTimeline)
            || !Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0
            || !Number.isFinite(value.positionSeconds) || value.positionSeconds < 0 || value.positionSeconds > value.durationSeconds
            || typeof value.paused !== 'boolean' || typeof value.muted !== 'boolean'
            || !Number.isFinite(value.volume) || value.volume < 0 || value.volume > 1
            || !Number.isFinite(value.rate) || value.rate <= 0 || value.rate > 16) return null;
        return { videoId, nativeTimeline: value.nativeTimeline, durationSeconds: value.durationSeconds,
            positionSeconds: value.positionSeconds, paused: value.paused, muted: value.muted, volume: value.volume, rate: value.rate };
    }
    function selectedPreferences(value) {
        if (!value || value.audioKnown !== true || value.captionsKnown !== true || typeof value.captionsEnabled !== 'boolean'
            || !Number.isInteger(value.audioTrackCount) || value.audioTrackCount < 0 || value.audioTrackCount > 64
            || !Array.isArray(value.audioTracks) || value.audioTracks.length !== value.audioTrackCount) return null;
        const audioTracks = [];
        for (const track of value.audioTracks) {
            if (typeof track?.id !== 'string' || !track.id || track.id.length > 160 || /[\u0000-\u001f\u007f]/.test(track.id)
                || audioTracks.some(row => row.id === track.id)) return null;
            audioTracks.push({ id: track.id });
        }
        if ([['audioTrackId', 160], ['captionTrackId', 160], ['captionLanguage', 40]].some(([key, limit]) =>
            typeof value[key] !== 'string' || value[key].length > limit || /[\u0000-\u001f\u007f]/.test(value[key]))) return null;
        const { audioTrackId, captionTrackId, captionLanguage } = value;
        if (value.captionsEnabled && (!captionTrackId || !captionLanguage)) return null;
        return { audioKnown: true, captionsKnown: true, audioTrackId, captionsEnabled: value.captionsEnabled,
            captionTrackId, captionLanguage, audioTrackCount: value.audioTrackCount, audioTracks };
    }
    function preferencesMatch(expected, raw) {
        const actual = selectedPreferences(raw);
        if (!actual || actual.captionsEnabled !== expected.captionsEnabled) return false;
        if (actual.audioTrackCount !== expected.audioTrackCount
            || expected.audioTracks.some(track => !actual.audioTracks.some(row => row.id === track.id))) return false;
        if (actual.audioTrackId !== expected.audioTrackId) return false;
        return !expected.captionsEnabled || (actual.captionTrackId === expected.captionTrackId && actual.captionLanguage === expected.captionLanguage);
    }

    function create(options = {}) {
        const { originalVideo, originalSurface, validateLease, allowAutomaticStart } = options;
        if (!originalVideo || !originalSurface || typeof validateLease !== 'function') throw new TypeError('Native media and lease authority are required');
        const document = originalSurface.ownerDocument;
        const now = typeof options.now === 'function' ? options.now : () => Date.now();
        let current = null, destroyed = false;
        function notify(name, value) { try { options[name]?.(value); } catch (_) { } }
        function routeId() {
            const location = root.location;
            if (location?.hostname !== 'www.youtube.com' || location.pathname !== '/watch') return '';
            return new URLSearchParams(location.search).get('v') || '';
        }
        function sameNode(session) {
            return routeId() === session.videoId && originalVideo.isConnected === true && originalSurface.isConnected === true
                && document?.getElementById('movie_player') === originalSurface
                && originalSurface.querySelector('video.html5-main-video') === originalVideo;
        }
        function currentSource() { return originalVideo.currentSrc || originalVideo.src || ''; }
        function automaticAllowed(videoId, lease) {
            // Only the isolated caller's current-setting callback can enable
            // automatic transactions. Source data and MAIN receipts cannot.
            if (typeof allowAutomaticStart !== 'function') return false;
            try { return allowAutomaticStart({ videoId, lease }) === true; }
            catch (_) { return false; }
        }
        function authority(session) {
            if (!sameNode(session) || !Number.isFinite(session.lease?.expiresAt)
                || now() >= session.lease.expiresAt || now() >= session.sourceExpiry) return false;
            if (session.mode === 'automatic' && !automaticAllowed(session.videoId, session.lease)) return false;
            try { return validateLease(session.lease, { videoId: session.videoId, source: session.source }) === true; }
            catch (_) { return false; }
        }
        function allowed(session) {
            return current === session && !session.closed && owners.get(originalVideo) === session && authority(session);
        }
        function pauseCaptured(session) {
            // A reused element on a different route belongs to the new native
            // admission owner. An old transaction must not pause or seek it.
            if (owners.get(originalVideo) !== session || routeId() !== session.videoId || originalVideo.isConnected !== true
                || !originalSurface.contains(originalVideo)) return;
            try { originalVideo.pause(); } catch (_) { }
        }
        function send(type, payload) { root.postMessage({ type, source: 'content_bridge', payload }, root.location.origin); }
        function cleanup(session) {
            root.clearTimeout(session.timer); root.clearTimeout(session.cancelTimer); root.clearInterval(session.heartbeat);
            for (const remove of session.removers.splice(0)) remove();
            if (session.stateRequest) { root.clearTimeout(session.stateRequest.timer); session.stateRequest.resolve(null); session.stateRequest = null; }
            if (owners.get(originalVideo) === session) owners.delete(originalVideo);
        }
        function reevaluate() {
            try { Promise.resolve(options.enforceNativeAdmission?.()).catch(() => {}); } catch (_) { }
        }
        function complete(session, result) {
            if (session.closed) return;
            session.closed = true; cleanup(session);
            if (current === session) current = null;
            if (result.status !== 'active') reevaluate();
            session.resolve(result); notify('onState', result);
            if (result.status !== 'active') notify('onFallback', { reason: result.reason, videoId: session.videoId });
        }
        function cancel(session, reason) {
            if (session.closed || current !== session) return session.result;
            if (session.phase === 'cancelling') return session.result;
            session.phase = 'cancelling'; session.reason = reason;
            root.clearTimeout(session.timer);
            pauseCaptured(session); reevaluate();
            try { send('FilterTube_CancelNativeContentSource', { requestId: session.requestId, videoId: session.videoId }); } catch (_) { }
            session.cancelTimer = root.setTimeout(() => {
                pauseCaptured(session);
                complete(session, { status: 'fallback', reason: 'ownership_unconfirmed', cause: session.reason, videoId: session.videoId });
            }, CANCEL_TIMEOUT_MS);
            return session.result;
        }
        function readState(session) {
            return new Promise(resolve => {
                const requestId = nonce();
                const timer = root.setTimeout(() => {
                    if (session.stateRequest?.requestId === requestId) session.stateRequest = null;
                    resolve(null);
                }, STATE_TIMEOUT_MS);
                session.stateRequest = { requestId, resolve, timer };
                send('FilterTube_ReadNativeContentState', { requestId, videoId: session.videoId });
            });
        }
        function metadataReady(session) {
            if (!session.sourceTransition && currentSource() === session.originalSource) return false;
            if (originalVideo.readyState < 2 || !Number.isFinite(originalVideo.duration)
                || Math.abs(originalVideo.duration - session.intent.durationSeconds) > 2.5) return false;
            try { return typeof options.isOriginalContent !== 'function' || options.isOriginalContent() === true; }
            catch (_) { return false; }
        }
        async function maybeReady(session) {
            if (session.closed || session.phase !== 'committing' || !session.acknowledged || session.checking || !metadataReady(session)) return;
            if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
            session.checking = true;
            const state = await readState(session);
            if (session.closed || session.phase !== 'committing') return;
            if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
            if (!state || state.videoIdMatched !== true || !preferencesMatch(session.preferences, state.preferences)) {
                cancel(session, 'native_features_unconfirmed'); return;
            }
            if (!metadataReady(session)) { cancel(session, 'native_source_changed'); return; }
            try {
                originalVideo.volume = session.intent.volume; originalVideo.muted = session.intent.muted;
                originalVideo.playbackRate = session.intent.rate;
                if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
                if (session.intent.paused) pauseCaptured(session);
                else {
                    session.phase = 'resuming';
                    await originalVideo.play();
                    if (session.closed || session.phase !== 'resuming') return;
                    if (!allowed(session) || !metadataReady(session)) { cancel(session, 'admission_changed'); return; }
                    if (originalVideo.paused !== false) { cancel(session, 'native_resume_failed'); return; }
                }
                complete(session, { status: 'active', handedOff: true, videoId: session.videoId, paused: originalVideo.paused });
            } catch (_) { cancel(session, 'native_resume_failed'); }
        }
        function reject(reason, videoId = '') {
            const result = { status: 'fallback', reason, videoId };
            notify('onState', result); notify('onFallback', { reason, videoId });
            return Promise.resolve(result);
        }
        function start(input = {}) {
            if (destroyed) return reject('destroyed');
            if (current || owners.has(originalVideo)) return reject('transaction_in_progress');
            const { videoId, lease, source } = input;
            const mode = input.mode === undefined ? 'manual' : input.mode;
            const intent = intentFor(input.playbackIntent, videoId);
            const preferences = selectedPreferences(input.preferences);
            if (!validId(videoId) || !intent) return reject('invalid_playback_intent', videoId);
            if (!['manual', 'automatic'].includes(mode)) return reject('invalid_start_mode', videoId);
            if (mode === 'automatic' && !automaticAllowed(videoId, lease)) return reject('automatic_start_disabled', videoId);
            if (mode === 'manual' && !consumeAction(input.actionToken, videoId)) return reject('user_gesture_required', videoId);
            if (source?.kind !== 'adaptive_mp4' || !Number.isFinite(source.expiresAt)) return reject('unsupported_source', videoId);
            if (!preferences) {
                return reject('feature_parity_unavailable', videoId);
            }
            let resolve;
            const result = new Promise(done => { resolve = done; });
            const session = { videoId, lease, source, sourceExpiry: source.expiresAt, intent, preferences, mode, resolve, result,
                requestId: nonce(), phase: 'committing', acknowledged: false, checking: false, closed: false,
                originalSource: currentSource(), sourceTransition: false, removers: [], stateRequest: null };
            if (!authority(session)) return reject('authorization_invalid', videoId);
            if (owners.has(originalVideo)) return reject('transaction_in_progress', videoId);
            current = session; owners.set(originalVideo, session);
            const listen = (target, type, callback, capture = false) => {
                target.addEventListener(type, callback, capture);
                session.removers.push(() => target.removeEventListener(type, callback, capture));
            };
            const mediaEvent = event => {
                if (session.closed || current !== session || owners.get(originalVideo) !== session) return;
                const target = event.target;
                if (target !== originalVideo && !originalSurface.contains(target)) return;
                if (target?.tagName?.toLowerCase() !== 'video') return;
                if (target !== originalVideo) {
                    if (routeId() === videoId) { try { target.pause(); } catch (_) { } }
                    cancel(session, 'native_node_replaced'); return;
                }
                if (session.phase === 'cancelling') { pauseCaptured(session); return; }
                if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
                if (event.type === 'loadstart' || event.type === 'emptied') session.sourceTransition = true;
                if (event.type === 'error') { cancel(session, 'native_media_error'); return; }
                if (['play', 'playing', 'loadstart'].includes(event.type) && session.phase !== 'resuming') pauseCaptured(session);
                if (session.phase === 'resuming' && event.type === 'loadstart') { cancel(session, 'native_source_changed'); return; }
                maybeReady(session).catch(() => cancel(session, 'native_state_failed'));
            };
            for (const type of ['play', 'playing', 'loadstart', 'emptied', 'loadedmetadata', 'loadeddata', 'durationchange', 'canplay', 'error']) {
                listen(document, type, mediaEvent, true);
            }
            listen(root, 'message', event => {
                if (event.source !== root || event.origin !== root.location.origin || event.data?.source !== 'injector') return;
                const payload = event.data.payload;
                if (payload?.videoId !== videoId) return;
                if (event.data.type === 'FilterTube_NativeContentState' && payload.requestId === session.stateRequest?.requestId) {
                    const request = session.stateRequest; session.stateRequest = null; root.clearTimeout(request.timer); request.resolve(payload); return;
                }
                if (event.data.type !== 'FilterTube_NativeContentSourceResult' || payload.requestId !== session.requestId) return;
                if (session.phase === 'cancelling') {
                    if (payload.applied === false) complete(session, { status: 'fallback', reason: session.reason, videoId });
                    return;
                }
                if (payload.applied !== true) {
                    if (session.sourceTransition || currentSource() !== session.originalSource) cancel(session, payload.reason || 'native_source_refused');
                    else complete(session, { status: 'fallback', reason: payload.reason || 'native_source_refused', videoId });
                    return;
                }
                session.acknowledged = true;
                if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
                maybeReady(session).catch(() => cancel(session, 'native_state_failed'));
            });
            session.heartbeat = root.setInterval(() => {
                if (session.closed) return;
                if (session.phase === 'cancelling') { pauseCaptured(session); return; }
                if (!allowed(session)) { cancel(session, 'admission_changed'); return; }
                maybeReady(session).catch(() => cancel(session, 'native_state_failed'));
            }, 100);
            session.timer = root.setTimeout(() => cancel(session, 'native_transaction_timeout'), TRANSACTION_TIMEOUT_MS);
            notify('onState', { status: 'staging', native: true, videoId });
            if (session.closed || session.phase !== 'committing') return result;
            if (!allowed(session)) { cancel(session, 'admission_changed'); return result; }
            const issuedAt = now();
            try { send('FilterTube_ApplyNativeContentSource', { requestId: session.requestId, videoId, source,
                playbackIntent: intent, preferences, issuedAt, commitDeadline: issuedAt + 2000 }); }
            catch (_) { complete(session, { status: 'fallback', reason: 'native_bridge_unavailable', videoId }); }
            return result;
        }
        return Object.freeze({ start,
            stop(reason = 'stopped') { return current ? cancel(current, reason) : Promise.resolve(); },
            destroy() { destroyed = true; return current ? cancel(current, 'destroyed') : Promise.resolve(); }
        });
    }
    root.FilterTubeContentPlaybackNative = Object.freeze({ create, captureTrustedAction });
})(typeof window !== 'undefined' ? window : globalThis);
