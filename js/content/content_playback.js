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
    let mount = null;
    let busy = false;
    let captionAbort = null;
    let clearOriginalInteraction = null;
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
            ? { decision: 'pending' } : { decision: 'inactive', profileId: settings?.activeProfileId };
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
    function setStatus(value) { if (status) status.textContent = value; }
    function invalidate(reason = 'invalidated') {
        generation++;
        busy = false;
        captionAbort?.abort();
        captionAbort = null;
        clearOriginalInteraction?.();
        clearOriginalInteraction = null;
        if (reason === 'user_close') {
            // A deliberate return can restore playback only while the old
            // admission lease is still valid. Policy invalidation cannot.
            controller?.stop(reason);
            controller?.destroy();
            controller = null;
        }
        gate?.invalidate(reason);
        lease = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = 0;
        for (const request of pending.values()) request.finish(null);
        pending.clear();
        controller?.stop(reason);
        controller?.destroy();
        controller = null;
        mount?.remove();
        mount = null;
        if (action) {
            action.disabled = false;
            action.textContent = text('content.playback.try', 'Try content player (experimental)');
        }
        if (reason === 'settings_changed' || reason === 'storage_changed') queueMicrotask(refresh);
    }
    function requestResponse(id) {
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
            pending.set(requestId, { videoId: id, finish });
            root.postMessage({ type: 'FilterTube_RequestContentPlayback', source: 'content_bridge',
                payload: { requestId, videoId: id } }, location.origin);
        });
    }
    function keepLease() {
        if (!lease || !gate?.renew(lease)) {
            invalidate('admission_changed');
            setStatus(text('content.playback.stopped', 'Content player stopped. Checking the current profile rules.'));
        }
    }
    async function start() {
        if (controller || busy) { invalidate('user_close'); setStatus(''); return; }
        if (busy || !gate || !videoId()) return;
        const id = videoId();
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
            if (event.isTrusted && busy) {
                invalidate('native_controls_changed');
                setStatus(text('content.playback.cancelled', 'Kept the YouTube player and your latest controls.'));
            }
        };
        surface.addEventListener('pointerdown', nativeInteraction, true);
        surface.addEventListener('keydown', nativeInteraction, true);
        clearOriginalInteraction = () => {
            surface.removeEventListener('pointerdown', nativeInteraction, true);
            surface.removeEventListener('keydown', nativeInteraction, true);
        };
        action.disabled = false;
        action.textContent = text('content.playback.cancel', 'Cancel');
        setStatus(text('content.playback.checking', 'Checking this video’s source, captions and audio…'));
        heartbeat = setInterval(keepLease, 250);
        const response = await requestResponse(id);
        if (attempt !== generation) return;
        if (!gate.validate(lease) || videoId() !== id) { invalidate('admission_changed'); return; }
        const requirements = {
            audioTrackId: response?.preferences?.audioTrackId || '',
            captionTrackId: response?.preferences?.captionsEnabled ? response.preferences.captionTrackId : '',
            captionsRequired: response?.preferences?.captionsEnabled === true,
            preferOriginalAudio: currentSettings?.alwaysUseOriginalAudio === true
        };
        let playerResponse = response?.playerResponse;
        const makePlan = (payload, needs) => root.FilterTubeContentPlaybackSource.plan({ playerResponse: payload,
            videoId: id, requirements: needs, canPlayType: mime => original.canPlayType(mime) });
        let plan = makePlan(playerResponse, requirements);
        let captionTracks = [];
        if (plan.reason.startsWith('caption') && root.FilterTubeContentPlaybackCaptions && playerResponse?.captions) {
            // Check source coverage without captions for diagnosis only; it is
            // never used as the permission or feature verdict for playback.
            const { captions, ...withoutCaptions } = playerResponse;
            const sourceProbe = makePlan(withoutCaptions, { ...requirements, captionsRequired: false, captionTrackId: '' });
            if (sourceProbe.supported) {
                captionAbort = new AbortController();
                const prepared = await root.FilterTubeContentPlaybackCaptions.prepare(playerResponse, {
                    videoId: id, fetch: root.fetch.bind(root), signal: captionAbort.signal,
                    isCurrent: () => attempt === generation && videoId() === id && gate.validate(lease)
                });
                if (attempt !== generation) return;
                if (!gate.validate(lease)) { invalidate('admission_changed'); return; }
                captionAbort = null;
                if (prepared.supported) {
                    playerResponse = { ...playerResponse, captions: prepared.captions };
                    captionTracks = prepared.tracks;
                    plan = makePlan(playerResponse, { ...requirements, captionMode: 'native_vtt' });
                }
            }
        }
        const tracks = plan.capabilities.audio.tracks;
        const originalIsContent = () => document.getElementById('movie_player') === surface
            && surface.querySelector('video.html5-main-video') === original
            && !surface.classList.contains('ad-showing') && !surface.classList.contains('ad-interrupting')
            && Number.isFinite(original.duration) && plan.video?.durationSeconds > 0
            && Math.abs(original.duration - plan.video.durationSeconds) <= 2.5;
        const captionSelectionKnown = !response?.preferences?.captionsEnabled || (
            response.preferences.captionTrackId && response.preferences.captionLanguage
            && captionTracks.filter(track => track.id === response.preferences.captionTrackId
                && track.languageCode === response.preferences.captionLanguage).length === 1
        );
        if (!plan.supported || tracks.length > 1 || response?.preferences?.audioKnown !== true
            || response?.preferences?.captionsKnown !== true
            || !captionSelectionKnown
            || response.preferences.audioTrackCount > 1 || !originalIsContent()) {
            const reason = !plan.supported ? plan.reason : !originalIsContent() ? 'content_timeline_unknown' : 'feature_selection_unsupported';
            invalidate('source_unsupported');
            setStatus(text('content.playback.unsupported', 'This video needs the YouTube player. Its captions and audio options stay available there.'));
            if (panel) panel.dataset.result = reason;
            return;
        }
        mount = document.createElement('div');
        mount.setAttribute('data-filtertube-content-player-host', 'true');
        Object.assign(mount.style, { position: 'absolute', inset: '0', zIndex: '50', background: '#000', display: 'none' });
        surface.parentElement.appendChild(mount);
        controller = root.FilterTubeContentPlaybackPlayer.create({ host: mount, originalVideo: original,
            originalSurface: surface, validateLease: value => gate.validate(value) && originalIsContent(),
            onState: state => {
                if (state.status === 'active') {
                    clearOriginalInteraction?.();
                    clearOriginalInteraction = null;
                    mount.style.display = 'block';
                    action.disabled = false;
                    action.textContent = text('content.playback.return', 'Return to YouTube player');
                    setStatus(state.paused ? text('content.playback.paused', 'FilterTube player is paused.')
                        : text('content.playback.active', 'Playing with FilterTube.'));
                }
            },
            onFallback: () => {
                // The media controller performs its own valid-lease restore;
                // dispose coordinator resources after that stack completes.
                queueMicrotask(() => {
                    invalidate('player_fallback');
                    setStatus(text('content.playback.fallback', 'Returned to the YouTube player.'));
                });
            }
        });
        const result = await controller.start({ lease, videoId: id,
            source: { ...plan.source, audioTrackId: plan.source.audioTrack?.id || '' },
            featurePlan: { allowed: true, captionsPreserved: true, audioPreserved: true, captionTracks,
                selectedCaptionLanguage: response.preferences.captionsEnabled ? response.preferences.captionLanguage : '',
                selectedCaptionId: response.preferences.captionsEnabled ? response.preferences.captionTrackId : '',
                audioTrackId: response.preferences.audioTrackId || '' } });
        if (attempt !== generation) return;
        busy = false;
        action.disabled = false;
        if (result?.status !== 'active') invalidate('player_fallback');
    }
    function refresh() {
        if (!initialized || !videoId() || !currentSettings?.enabled || currentSettings?.hideSponsoredCards !== true) {
            panel?.remove(); panel = null; action = null; status = null;
            return;
        }
        if (panel?.isConnected) return;
        const target = document.querySelector('ytd-watch-flexy #above-the-fold');
        if (!target) return;
        panel = document.createElement('details');
        panel.setAttribute('data-filtertube-content-playback-options', 'true');
        Object.assign(panel.style, { font: '14px/1.5 system-ui,sans-serif', margin: '12px 0', padding: '8px 12px',
            border: '1px solid currentColor', borderRadius: '10px', color: 'var(--yt-spec-text-primary)', maxWidth: '100%', boxSizing: 'border-box' });
        const summary = document.createElement('summary');
        summary.textContent = text('content.playback.options', 'FilterTube playback options');
        summary.style.minHeight = '28px';
        action = document.createElement('button');
        action.type = 'button';
        action.textContent = text('content.playback.try', 'Try content player (experimental)');
        Object.assign(action.style, { minHeight: '44px', padding: '8px 16px', margin: '8px 0', cursor: 'pointer',
            borderRadius: '8px', border: '1px solid currentColor', color: 'inherit', background: 'transparent' });
        action.addEventListener('click', event => {
            if (!event.isTrusted) return;
            start().catch(() => { invalidate('player_error'); setStatus(text('content.playback.fallback', 'Returned to the YouTube player.')); });
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
        if (initialized || !gate || !root.FilterTubeContentPlaybackSource || !root.FilterTubeContentPlaybackPlayer) return;
        initialized = true;
        root.addEventListener('message', event => {
            if (event.source !== root || event.origin !== location.origin || event.data?.source !== 'injector'
                || event.data?.type !== 'FilterTube_ContentPlaybackResponse') return;
            const payload = event.data.payload;
            const request = pending.get(payload?.requestId);
            if (request && request.videoId === payload.videoId && videoId() === payload.videoId) request.finish(payload);
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
