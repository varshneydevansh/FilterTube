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
    let panel = null;
    let action = null;
    let status = null;
    let busy = false;
    let sourceAbort = null;
    let clearOriginalInteraction = null;
    let mountRetry = 0;
    let mountAttempts = 0;
    const pending = new Map();
    function videoId() {
        if (location.hostname !== 'www.youtube.com' || location.pathname !== '/watch') return '';
        const id = new URLSearchParams(location.search).get('v') || '';
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : '';
    }
    function text(key, fallback) {
        return typeof filterTubeContentMenuText === 'function' ? filterTubeContentMenuText(key, fallback) : fallback;
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
    function setStatus(value) { if (status) status.textContent = value; }
    function invalidate(reason = 'invalidated') {
        generation++;
        busy = false;
        sourceAbort?.abort();
        sourceAbort = null;
        if (mountRetry) clearTimeout(mountRetry);
        mountRetry = 0;
        mountAttempts = 0;
        clearOriginalInteraction?.();
        clearOriginalInteraction = null;
        gate?.invalidate(reason);
        lease = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = 0;
        for (const request of pending.values()) request.finish(null);
        pending.clear();
        controller?.stop(reason);
        controller?.destroy();
        controller = null;
        if (action) {
            action.disabled = false;
            action.textContent = text('content.playback.native.try', 'Refresh main video source (experimental)');
        }
        if (reason === 'settings_changed' || reason === 'storage_changed') queueMicrotask(refresh);
    }
    function requestResponse(id, audioTrackId = '') {
        return new Promise(resolve => {
            const bytes = new Uint8Array(18);
            crypto.getRandomValues(bytes);
            const requestId = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
            const timer = setTimeout(() => finish(null), 3000);
            function finish(value) {
                clearTimeout(timer);
                pending.delete(requestId);
                resolve(value);
            }
            pending.set(requestId, { videoId: id, audioTrackId, finish });
            root.postMessage({ type: audioTrackId ? 'FilterTube_SelectContentPlaybackAudio' : 'FilterTube_RequestContentPlayback', source: 'content_bridge',
                payload: { requestId, videoId: id, ...(audioTrackId ? { audioTrackId } : {}) } }, location.origin);
        });
    }
    function keepLease() {
        if (!lease || !gate?.renew(lease)) {
            invalidate('admission_changed');
            setStatus(text('content.playback.native.stopped', 'Source refresh stopped. Checking the current profile rules.'));
        }
    }
    async function start(event) {
        if (controller || busy) { invalidate('user_close'); setStatus(''); return; }
        if (busy || !gate || !videoId()) return;
        const id = videoId();
        const userAction = root.FilterTubeContentPlaybackNative.captureTrustedAction?.(event, id);
        const original = document.querySelector('#movie_player video.html5-main-video');
        const surface = document.getElementById('movie_player');
        if (!original || !surface || !surface.parentElement) return;
        // Run the existing admission evaluator. Its explicit receipt is needed
        // even when the current profile has no blocking rules.
        if (typeof enforceCurrentVideoAdmissionForRoute === 'function') enforceCurrentVideoAdmissionForRoute(currentSettings);
        lease = gate.issue();
        if (!lease) {
            setStatus(text('content.playback.rules', 'Keep using the YouTube player while profile checks or time limits apply.'));
            return;
        }
        busy = true;
        const attempt = ++generation;
        const nativeInteraction = event => {
            if (event.isTrusted && busy && surface.contains(event.target)) {
                invalidate('native_controls_changed');
                setStatus(text('content.playback.cancelled', 'Kept the YouTube player and your latest controls.'));
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
        action.disabled = false;
        action.textContent = text('content.playback.cancel', 'Cancel');
        setStatus(text('content.playback.native.checking', 'Checking the main video source and your current playback options…'));
        heartbeat = setInterval(keepLease, 250);
        const response = await requestResponse(id);
        if (attempt !== generation) return;
        if (!gate.validate(lease) || videoId() !== id) { invalidate('admission_changed'); return; }
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
        if (response?.preferences?.audioKnown !== true || response?.preferences?.captionsKnown !== true) {
            invalidate('source_unsupported');
            setStatus(text('content.playback.unsupported', 'This video needs the YouTube player. Its captions and audio options stay available there.'));
            return;
        }
        sourceAbort = new AbortController();
        let plan = await resolver.resolve({ videoId: id, playerResponse: response?.playerResponse,
            requirements, signal: sourceAbort.signal, isCurrent, fetch: root.fetch.bind(root),
            canPlayType: mime => original.canPlayType(mime) });
        if (attempt !== generation) return;
        if (!isCurrent()) { invalidate('admission_changed'); return; }
        sourceAbort = null;
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
            setStatus(text('content.playback.native.unsupported', 'Kept the current YouTube player and playback options.'));
            if (panel) panel.dataset.result = reason;
            return;
        }
        controller = root.FilterTubeContentPlaybackNative.create({ originalVideo: original, originalSurface: surface,
            validateLease: value => gate.validate(value) && ownsNativeNode(),
            isOriginalContent: originalIsContent,
            enforceNativeAdmission: () => {
                if (typeof enforceCurrentVideoAdmissionForRoute === 'function') enforceCurrentVideoAdmissionForRoute(currentSettings);
            },
            onState: state => {
                if (state.status === 'active') {
                    clearOriginalInteraction?.();
                    clearOriginalInteraction = null;
                    if (panel) panel.dataset.result = 'native_active';
                    setStatus(text('content.playback.native.active', 'Main video loaded. Keep using YouTube’s playback controls.'));
                }
            },
            onFallback: result => {
                if (panel && typeof result?.reason === 'string') panel.dataset.result = result.reason;
                queueMicrotask(() => {
                    if (attempt !== generation) return;
                    invalidate('player_fallback');
                    setStatus(text('content.playback.native.fallback', 'Source refresh stopped. Use YouTube’s controls, or reload the page if playback is unavailable.'));
                });
            }
        });
        const result = await controller.start({ lease, videoId: id, actionToken: userAction,
            playbackIntent: { videoId: id, nativeTimeline: originalIsContent() ? 'content' : 'unrelated',
                durationSeconds: plan.video.durationSeconds, positionSeconds: originalIsContent() ? original.currentTime : 0,
                paused: original.paused, volume: original.volume, muted: original.muted === true, rate: original.playbackRate },
            source: plan.source, preferences: response.preferences });
        if (attempt !== generation) return;
        busy = false;
        action.disabled = false;
        if (result?.status !== 'active' || result.handedOff !== true) { invalidate('player_fallback'); return; }
        // This is a one-shot admitted source transaction. The native engine
        // and the existing profile guards own ordinary playback afterward.
        controller.destroy();
        controller = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = 0;
        gate.invalidate('native_handoff');
        lease = null;
        action.textContent = text('content.playback.native.try', 'Refresh main video source (experimental)');
    }
    function refresh() {
        if (!initialized || !videoId() || !currentSettings?.enabled || currentSettings?.hideSponsoredCards !== true) {
            if (mountRetry) clearTimeout(mountRetry);
            mountRetry = 0; mountAttempts = 0;
            panel?.remove(); panel = null; action = null; status = null;
            return;
        }
        if (panel?.isConnected) return;
        const target = document.querySelector('ytd-watch-flexy #above-the-fold');
        if (!target) {
            // YouTube may mount its watch UI after settings hydration. Retry
            // briefly without a permanent observer or background scan loop.
            if (!mountRetry && mountAttempts < 20) {
                mountAttempts++;
                mountRetry = setTimeout(() => { mountRetry = 0; refresh(); }, 500);
            }
            return;
        }
        if (mountRetry) clearTimeout(mountRetry);
        mountRetry = 0; mountAttempts = 0;
        panel = document.createElement('details');
        panel.setAttribute('data-filtertube-content-playback-options', 'true');
        Object.assign(panel.style, { font: '14px/1.5 system-ui,sans-serif', margin: '12px 0', padding: '8px 12px',
            border: '1px solid currentColor', borderRadius: '10px', color: 'var(--yt-spec-text-primary)', maxWidth: '100%', boxSizing: 'border-box' });
        const summary = document.createElement('summary');
        summary.textContent = text('content.playback.options', 'FilterTube playback options');
        summary.style.minHeight = '28px';
        action = document.createElement('button');
        action.type = 'button';
        action.textContent = text('content.playback.native.try', 'Refresh main video source (experimental)');
        Object.assign(action.style, { minHeight: '44px', padding: '8px 16px', margin: '8px 0', cursor: 'pointer',
            borderRadius: '8px', border: '1px solid currentColor', color: 'inherit', background: 'transparent' });
        action.addEventListener('click', event => {
            if (!event.isTrusted) return;
            start(event).catch(() => { invalidate('player_error'); setStatus(text('content.playback.fallback', 'Returned to the YouTube player.')); });
        });
        status = document.createElement('p');
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        panel.append(summary, action, status);
        const focusStyle = document.createElement('style');
        focusStyle.textContent = '[data-filtertube-content-playback-options] :is(button,summary):focus-visible { outline: 2px solid Highlight; outline-offset: 3px; }';
        panel.appendChild(focusStyle);
        target.prepend(panel);
    }
    function initialize() {
        if (initialized || !gate || !resolver || !root.FilterTubeContentPlaybackNative) return;
        initialized = true;
        root.addEventListener('message', event => {
            if (event.source !== root || event.origin !== location.origin || event.data?.source !== 'injector'
                || !['FilterTube_ContentPlaybackResponse', 'FilterTube_ContentPlaybackAudioResult'].includes(event.data?.type)) return;
            const payload = event.data.payload;
            const request = pending.get(payload?.requestId);
            const audioReply = event.data.type === 'FilterTube_ContentPlaybackAudioResult';
            if (request && request.videoId === payload.videoId && videoId() === payload.videoId
                && Boolean(request.audioTrackId) === audioReply
                && (!audioReply || request.audioTrackId === payload.audioTrackId)) request.finish(payload);
        });
        const transition = () => { routeEpoch++; invalidate('navigation'); panel?.remove(); panel = null; };
        document.addEventListener('yt-navigate-start', transition, true);
        root.addEventListener('popstate', transition, true);
        root.addEventListener('pagehide', transition, true);
        document.addEventListener('yt-navigate-finish', refresh, true);
        refresh();
    }
    root.FilterTubeContentPlayback = Object.freeze({ initialize, invalidate, refresh });
})(typeof window !== 'undefined' ? window : globalThis);
