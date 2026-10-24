// ISOLATED-world coordinator. The page supplies media data, never permission.
(function (root) {
    'use strict';
    if (root.FilterTubeContentPlayback) return;
    let initialized = false;
    let routeEpoch = 0;
    let generation = 0;
    let controller = null;
    let lease = null;
    let heartbeat = 0;
    let busy = false;
    let sourceAbort = null;
    let clearOriginalInteraction = null;
    let clearNativePlaybackWait = null;
    let retryTimer = 0;
    let readinessDeadline = 0;
    let contextKey = '';
    let attemptedKey = '';
    let preflightCount = 0;
    const pending = new Map();
    function videoId() {
        if (location.hostname !== 'www.youtube.com' || location.pathname !== '/watch') return '';
        const id = new URLSearchParams(location.search).get('v') || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
    }
    function snapshot() {
        const settings = typeof currentSettings === 'object' ? currentSettings : null;
        const id = videoId();
        const metadata = settings?.videoMetaMap?.[id] || {};
        let categoryState = null;
        if (settings?.categoryFilters?.enabled === true || settings?.languageFilters?.enabled === true) {
            const category = typeof getCategoryPolicyDecision === 'function'
                ? getCategoryPolicyDecision(settings, metadata.category) : 'unknown';
            const language = typeof getLanguagePolicyDecision === 'function'
                ? getLanguagePolicyDecision(settings, metadata.languageCode) : 'unknown';
            categoryState = { videoId: id, decision: [category, language].every(value => value === 'allowed' || value === 'inactive')
                ? 'allowed' : 'pending' };
            if (root.__filtertubeCurrentWatchCategoryState?.pausedByGuard) categoryState.decision = 'pending';
        }
        // Until the authoritative heartbeat publishes an explicit fresh permit,
        // any configured time policy stays on the existing, complete player.
        const rawTimePolicy = settings?.managedTimeLimitPolicy;
        const managedTimeState = rawTimePolicy && rawTimePolicy.enabled !== false
            ? root.FilterTubeManagedPlaybackPermit?.read({ settings, videoId: id, href: location.href }) || { decision: 'pending' }
            : { decision: 'inactive', profileId: settings?.activeProfileId };
        return {
            settings, videoId: id, routeEpoch,
            directState: root.__filtertubeDirectAccessState,
            categoryState, managedTimeState,
            managedDenied: root.__filtertubeManagedViewingRouteDenied === true || root.__filtertubeManagedTimeLimitTimedOut === true,
            nativeCovered: typeof isFilterTubeNativeOverlayQuietMode === 'function'
                ? isFilterTubeNativeOverlayQuietMode()
                : root.__filterTubeNativeOverlayCovered === true || root.__filterTubeNativeFullscreenActive === true
                    || document.documentElement?.hasAttribute('data-filtertube-native-overlay-covered') === true
                    || document.documentElement?.hasAttribute('data-filtertube-native-fullscreen') === true
        };
    }
    const gate = root.FilterTubeContentPlaybackAdmission?.create({ readSnapshot: snapshot });
    const resolver = root.FilterTubeContentPlaybackResolver?.create();
    function setStatus(value) {
        document.documentElement?.setAttribute('data-filtertube-content-playback-state', value);
    }
    function enabled() {
        return typeof currentSettings === 'object' && currentSettings?.enabled === true
            && currentSettings.hideSponsoredCards === true && currentSettings.contentOnlyPlayback !== false;
    }
    function currentContext() {
        return JSON.stringify([routeEpoch, videoId(), currentSettings?.activeProfileId || '',
            currentSettings?.activeProfileKind || '', currentSettings?.profileType || '']);
    }
    function schedule() {
        if (!retryTimer && enabled() && Date.now() < readinessDeadline && attemptedKey !== contextKey) {
            retryTimer = setTimeout(() => { retryTimer = 0; refresh(); }, 500);
        }
    }
    function invalidate(reason = 'invalidated') {
        generation++;
        busy = false;
        sourceAbort?.abort();
        sourceAbort = null;
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = 0;
        clearOriginalInteraction?.();
        clearOriginalInteraction = null;
        clearNativePlaybackWait?.();
        clearNativePlaybackWait = null;
        gate?.invalidate(reason);
        lease = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = 0;
        for (const request of pending.values()) request.finish(null);
        pending.clear();
        controller?.stop(reason);
        controller?.destroy();
        controller = null;
        if (['settings_changed', 'storage_changed', 'storage_settings_changed'].includes(reason)) queueMicrotask(refresh);
        if (['direct_admission_changed', 'category_admission_changed'].includes(reason)) queueMicrotask(schedule);
    }
    function requestResponse(id, audioTrackId = '', stateOnly = false) {
        return new Promise(resolve => {
            const bytes = new Uint8Array(18);
            crypto.getRandomValues(bytes);
            const requestId = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
            const timer = setTimeout(() => finish(null), stateOnly ? 2000 : 3000);
            function finish(value) {
                clearTimeout(timer);
                pending.delete(requestId);
                resolve(value);
            }
            const replyType = stateOnly ? 'FilterTube_NativeContentState' : audioTrackId
                ? 'FilterTube_ContentPlaybackAudioResult' : 'FilterTube_ContentPlaybackResponse';
            pending.set(requestId, { videoId: id, audioTrackId, replyType, finish });
            root.postMessage({ type: stateOnly ? 'FilterTube_ReadNativeContentState' : audioTrackId ? 'FilterTube_SelectContentPlaybackAudio' : 'FilterTube_RequestContentPlayback', source: 'content_bridge',
                payload: { requestId, videoId: id, ...(audioTrackId ? { audioTrackId } : {}) } }, location.origin);
        });
    }
    function sameNativeFeatures(before, after) {
        if (!before || !after || before.audioKnown !== true || after.audioKnown !== true
            || before.captionsKnown !== true || after.captionsKnown !== true
            || typeof before.captionsEnabled !== 'boolean' || after.captionsEnabled !== before.captionsEnabled
            || !Number.isInteger(before.audioTrackCount) || before.audioTrackCount < 0 || before.audioTrackCount > 64
            || after.audioTrackCount !== before.audioTrackCount) return false;
        const ids = value => {
            if (!Array.isArray(value.audioTracks) || value.audioTracks.length !== value.audioTrackCount) return null;
            const tracks = value.audioTracks.map(track => track?.id);
            return tracks.every(id => typeof id === 'string' && id.length > 0 && id.length <= 160
                && !/[\u0000-\u001f\u007f]/.test(id)) && new Set(tracks).size === tracks.length ? tracks.sort() : null;
        };
        const expected = ids(before); const actual = ids(after);
        if (!expected || !actual || expected.some((id, index) => id !== actual[index])) return false;
        return ['audioTrackId', 'captionTrackId', 'captionLanguage'].every(key => {
            const previous = before[key] ?? ''; const current = after[key] ?? '';
            return typeof previous === 'string' && typeof current === 'string' && previous === current;
        });
    }
    function keepLease() {
        if (!lease || !gate?.renew(lease)) {
            invalidate('admission_changed');
            setStatus('admission_changed');
        }
    }
    function waitForNativePlayback(original, surface, key) {
        invalidate('native_waiting_for_playback');
        // A paused startup is not a user request to reload and remain paused.
        // Let the existing native player/admission guards establish playback
        // first. This observer never plays media or grants admission itself.
        attemptedKey = '';
        const attempt = generation;
        const wake = event => {
            if (attempt !== generation || currentContext() !== key
                || document.getElementById('movie_player') !== surface
                || surface.querySelector('video.html5-main-video') !== original) {
                clearNativePlaybackWait?.(); clearNativePlaybackWait = null; return;
            }
            if (event.isTrusted !== true || event.target !== original || original.paused !== false || busy || controller) return;
            clearNativePlaybackWait?.(); clearNativePlaybackWait = null;
            queueMicrotask(() => { if (attempt === generation && currentContext() === key) refresh(); });
        };
        document.addEventListener('play', wake, true);
        document.addEventListener('playing', wake, true);
        clearNativePlaybackWait = () => {
            document.removeEventListener('play', wake, true);
            document.removeEventListener('playing', wake, true);
        };
        setStatus('native_waiting_for_playback');
    }
    async function start() {
        if (busy || controller || !gate || !enabled() || !videoId() || attemptedKey === contextKey) return;
        const id = videoId();
        const key = currentContext();
        const original = document.querySelector('#movie_player video.html5-main-video');
        const surface = document.getElementById('movie_player');
        if (!original || !surface || original.ended === true || !surface.parentElement) { schedule(); return; }
        if (original.paused !== false) { waitForNativePlayback(original, surface, key); return; }
        clearNativePlaybackWait?.(); clearNativePlaybackWait = null;
        // Run the existing admission evaluator. Its explicit receipt is needed
        // even when the current profile has no blocking rules.
        if (typeof enforceCurrentVideoAdmissionForRoute === 'function') enforceCurrentVideoAdmissionForRoute(currentSettings);
        lease = gate.issue();
        if (!lease) {
            setStatus('waiting_for_admission');
            schedule();
            return;
        }
        busy = true;
        const attempt = ++generation;
        const nativeInteraction = event => {
            const target = event.target;
            const editable = target?.isContentEditable === true || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);
            const playbackKey = event.type === 'keydown' && !editable
                && [' ', 'Spacebar', 'k', 'K', 'MediaPause', 'MediaPlayPause'].includes(event.key);
            if (event.isTrusted && busy && (surface.contains(target) || playbackKey)) {
                invalidate('native_controls_changed');
                attemptedKey = key;
                setStatus('native_controls_changed');
            }
        };
        // movie_player.addEventListener is YouTube's player API, not the DOM
        // EventTarget method. Capture actual input through the document.
        document.addEventListener('pointerdown', nativeInteraction, true);
        document.addEventListener('keydown', nativeInteraction, true);
        clearOriginalInteraction = () => {
            document.removeEventListener('pointerdown', nativeInteraction, true);
            document.removeEventListener('keydown', nativeInteraction, true);
        };
        setStatus('preparing');
        preflightCount++;
        heartbeat = setInterval(keepLease, 250);
        const response = await requestResponse(id);
        if (attempt !== generation) return;
        if (!gate.validate(lease) || videoId() !== id) { invalidate('admission_changed'); return; }
        if (original.paused !== false) { waitForNativePlayback(original, surface, key); return; }
        const requirements = {
            nativeAdaptiveOnly: true,
            audioTrackId: response?.preferences?.audioTrackId || '',
            audioTrackCount: response?.preferences?.audioTrackCount,
            regionCode: response?.preferences?.regionCode || '',
            captionTrackId: response?.preferences?.captionsEnabled ? response.preferences.captionTrackId : '',
            captionsRequired: response?.preferences?.captionsEnabled === true,
            preferOriginalAudio: currentSettings?.alwaysUseOriginalAudio === true
        };
        const ownsNativeNode = () => document.getElementById('movie_player') === surface
            && surface.querySelector('video.html5-main-video') === original;
        const isCurrent = () => attempt === generation && videoId() === id && ownsNativeNode() && gate.validate(lease);
        const nativeAlreadyReady = (preferences = response?.preferences) => {
            const duration = Number(response?.playerResponse?.videoDetails?.lengthSeconds);
            return isCurrent() && preferences?.nativeVideoId === id
                && preferences.nativeAdInactive === true
                && response.playerResponse?.videoDetails?.videoId === id
                && Number.isFinite(duration) && duration > 0 && original.readyState >= 3
                && Number.isFinite(original.currentTime) && original.currentTime >= 1 && original.ended !== true
                && Number.isFinite(original.duration) && Math.abs(original.duration - duration) <= 2.5
                && !surface.classList.contains('ad-showing') && !surface.classList.contains('ad-interrupting');
        };
        const keepReadyNative = () => {
            attemptedKey = key;
            invalidate('native_ready');
            setStatus('native_ready');
        };
        if (nativeAlreadyReady()) { keepReadyNative(); return; }
        if (response?.preferences?.audioKnown !== true || response?.preferences?.captionsKnown !== true) {
            invalidate('native_not_ready');
            setStatus('native_not_ready');
            if (preflightCount < 3) schedule();
            else attemptedKey = key;
            return;
        }
        attemptedKey = key;
        sourceAbort = new AbortController();
        let plan = await resolver.resolve({ videoId: id, playerResponse: response?.playerResponse,
            requirements, signal: sourceAbort.signal, isCurrent, fetch: root.fetch.bind(root),
            canPlayType: mime => original.canPlayType(mime) });
        if (attempt !== generation) return;
        if (!isCurrent()) { invalidate('admission_changed'); return; }
        sourceAbort = null;
        if (original.paused !== false) { waitForNativePlayback(original, surface, key); return; }
        const originalIsContent = () => ownsNativeNode()
            && !surface.classList.contains('ad-showing') && !surface.classList.contains('ad-interrupting')
            && Number.isFinite(original.duration) && plan.video?.durationSeconds > 0
            && Math.abs(original.duration - plan.video.durationSeconds) <= 2.5;
        const offeredAudio = response.preferences.audioTracks;
        const resolvedAudioIds = new Set((plan.source?.audioVariants || []).map(row => row.audioTrack?.id).filter(Boolean));
        const audioChoicesPreserved = !(response.preferences.audioTrackCount > 1) || (
            Array.isArray(offeredAudio) && offeredAudio.length === response.preferences.audioTrackCount
            && offeredAudio.every(track => track.id && resolvedAudioIds.has(track.id))
            && new Set(offeredAudio.map(track => track.id)).size === offeredAudio.length
        );
        // The native engine retains its WEB caption catalog and controls. Do
        // not fetch/rebuild captions or create a competing video element.
        if (!plan.supported || plan.source?.kind !== 'adaptive_mp4' || !audioChoicesPreserved || !ownsNativeNode()) {
            const reason = !plan.supported ? plan.reason : !audioChoicesPreserved
                ? 'feature_selection_unsupported' : 'native_source_unsupported';
            invalidate('source_unsupported');
            setStatus(reason);
            return;
        }
        // Re-read native state after resolution: an advert may have ended or
        // a feature selection may have changed while the source was pending.
        const freshState = await requestResponse(id, '', true);
        if (attempt !== generation) return;
        if (!isCurrent()) { invalidate('admission_changed'); return; }
        if (!freshState || freshState.videoIdMatched !== true) {
            invalidate('native_state_unknown'); setStatus('native_state_unknown'); return;
        }
        if (!sameNativeFeatures(response.preferences, freshState.preferences)) {
            invalidate('native_preferences_changed'); setStatus('native_preferences_changed'); return;
        }
        if (nativeAlreadyReady(freshState.preferences)) { keepReadyNative(); return; }
        if (original.paused !== false) { waitForNativePlayback(original, surface, key); return; }
        controller = root.FilterTubeContentPlaybackNative.create({ originalVideo: original, originalSurface: surface,
            validateLease: value => gate.validate(value) && ownsNativeNode(),
            isOriginalContent: originalIsContent,
            allowAutomaticStart: () => enabled() && currentContext() === key,
            enforceNativeAdmission: () => {
                if (typeof enforceCurrentVideoAdmissionForRoute === 'function') enforceCurrentVideoAdmissionForRoute(currentSettings);
            },
            onState: state => {
                if (state.status === 'active') {
                    clearOriginalInteraction?.();
                    clearOriginalInteraction = null;
                    setStatus('native_active');
                }
            },
            onFallback: result => {
                if (typeof result?.reason === 'string') setStatus(result.reason);
                queueMicrotask(() => {
                    if (attempt !== generation) return;
                    invalidate('player_fallback');
                    setStatus(result?.reason || 'native_fallback');
                });
            }
        });
        const result = await controller.start({ mode: 'automatic', lease, videoId: id,
            playbackIntent: { videoId: id, nativeTimeline: originalIsContent() ? 'content' : 'unrelated',
                durationSeconds: plan.video.durationSeconds, positionSeconds: originalIsContent() ? original.currentTime : 0,
                paused: original.paused, volume: original.volume, muted: original.muted === true, rate: original.playbackRate },
            source: plan.source, preferences: freshState.preferences });
        if (attempt !== generation) return;
        busy = false;
        if (result?.status !== 'active' || result.handedOff !== true) { invalidate('player_fallback'); return; }
        // This is a one-shot admitted source transaction. The native engine
        // and the existing profile guards own ordinary playback afterward.
        controller.destroy();
        controller = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = 0;
        gate.invalidate('native_handoff');
        lease = null;
    }
    function refresh() {
        if (!initialized) return;
        if (!videoId() || !enabled()) {
            if (busy || controller || clearNativePlaybackWait) invalidate('disabled');
            if (retryTimer) clearTimeout(retryTimer);
            retryTimer = 0; contextKey = ''; attemptedKey = ''; preflightCount = 0; readinessDeadline = 0;
            setStatus('disabled');
            return;
        }
        const key = currentContext();
        if (contextKey !== key) {
            contextKey = key; attemptedKey = ''; preflightCount = 0;
            readinessDeadline = Date.now() + 15000;
        }
        if (busy || controller || attemptedKey === key) return;
        // Automatic startup is a local preference, not a page-supplied allow
        // verdict. Admission must become ready before source discovery begins.
        start().catch(() => {
            attemptedKey = key;
            invalidate('player_error');
            setStatus('native_fallback');
        });
    }
    function initialize() {
        if (initialized || !gate || !resolver || !root.FilterTubeContentPlaybackNative) return;
        initialized = true;
        root.addEventListener('message', event => {
            if (event.source !== root || event.origin !== location.origin || event.data?.source !== 'injector'
                || !['FilterTube_ContentPlaybackResponse', 'FilterTube_ContentPlaybackAudioResult', 'FilterTube_NativeContentState'].includes(event.data?.type)) return;
            const payload = event.data.payload;
            const request = pending.get(payload?.requestId);
            const audioReply = event.data.type === 'FilterTube_ContentPlaybackAudioResult';
            if (request && request.replyType === event.data.type && request.videoId === payload.videoId && videoId() === payload.videoId
                && Boolean(request.audioTrackId) === audioReply
                && (!audioReply || request.audioTrackId === payload.audioTrackId)) request.finish(payload);
        });
        const transition = () => { routeEpoch++; invalidate('navigation'); setStatus('navigation'); };
        document.addEventListener('yt-navigate-start', transition, true);
        root.addEventListener('popstate', transition, true);
        root.addEventListener('pagehide', transition, true);
        document.addEventListener('yt-navigate-finish', refresh, true);
        refresh();
    }
    root.FilterTubeContentPlayback = Object.freeze({ initialize, invalidate, refresh });
})(typeof window !== 'undefined' ? window : globalThis);
