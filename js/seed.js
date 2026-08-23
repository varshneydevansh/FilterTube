// js/seed.js - Early data interception for FilterTube
// Must run before YouTube scripts to ensure zero-flash filtering

(function() {
    'use strict';

    // Idempotency guard for seed.js itself
    if (window.filterTubeSeedHasRun) {
        try {
            if (window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true') {
                console.debug('FilterTube (Seed): Already initialized, skipping');
            }
        } catch (e) {
        }
        return; // Now legal because it's inside a function
    }
    window.filterTubeSeedHasRun = true;

    // Global flags and state
    window.ftSeedInitialized = false;
    
    const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
    const isMobileInterface = document.location.hostname.startsWith('m.');

    const filterTubeSeedDebugEnabled = (() => {
        try {
            return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
        } catch (e) {
            return !!window.__filtertubeDebug;
        }
    })();
    if (filterTubeSeedDebugEnabled) {
        console.log('FilterTube: seed.js initializing (MAIN world)');
    }
    
    // Settings and data management
    let cachedSettings = null;
    let pendingDataQueue = [];
    let dataHooksEstablished = false;
    let rawYtInitialData = null;
    let rawYtInitialPlayerResponse = null;

    const originalAudioState = {
        videoId: '',
        trackId: '',
        languageCode: '',
        displayName: '',
        timer: null,
        attempts: 0
    };

    // Android's native-owned playback bridge does not block ad requests. It
    // recognizes an active YouTube ad interruption, quarantines its audio, and
    // asks YouTube to skip it. When YouTube exposes separate advert and content
    // media elements, keep the advert silent behind the requested content.
    const AD_VOID_POLL_MS = 900;
    const AD_VOID_STYLE_ID = 'filtertube-ad-void-player-style';
    const adVoidState = {
        timer: null,
        active: false,
        quietPasses: 0,
        audioSnapshot: null,
        parallelContent: null,
        lastResult: 'disabled',
        sessionSequence: 0,
        sessionStartedAt: 0,
        lastRoleSignature: '',
        lastWaitingLogAt: 0,
        resumeAttempts: 0,
        advancedAdVideo: null,
        advancedAdDuration: 0,
        placement: 'unknown',
        contentTimelineAtAdStart: null,
        adEndedAt: 0,
        awaitingContentVideoId: ''
    };

    function adVoidVideoSummary(video) {
        if (!video) return null;
        let rect = null;
        try {
            const bounds = video.getBoundingClientRect();
            rect = `${Math.round(bounds.width)}x${Math.round(bounds.height)}`;
        } catch (e) {
        }
        return {
            className: String(video.className || '').slice(0, 120),
            ownerPlayer: String(video.closest?.('.html5-video-player')?.id || ''),
            duration: Number.isFinite(video.duration) ? Math.round(video.duration * 1000) / 1000 : null,
            currentTime: Number.isFinite(video.currentTime) ? Math.round(video.currentTime * 1000) / 1000 : null,
            readyState: Number(video.readyState || 0),
            paused: video.paused === true,
            ended: video.ended === true,
            muted: video.muted === true,
            connected: video.isConnected === true,
            promoted: video.getAttribute?.('data-filtertube-ad-void-content') === 'true',
            rect
        };
    }

    function adVoidTrace(event, details = {}) {
        const now = Date.now();
        const entry = {
            at: new Date(now).toISOString(),
            event,
            session: adVoidState.sessionSequence,
            elapsedMs: adVoidState.sessionStartedAt ? now - adVoidState.sessionStartedAt : 0,
            videoId: new URLSearchParams(location.search).get('v') || '',
            ...details
        };
        try {
            const history = Array.isArray(window.__filtertubeAdVoidLog)
                ? window.__filtertubeAdVoidLog
                : [];
            history.push(entry);
            if (history.length > 100) history.splice(0, history.length - 100);
            window.__filtertubeAdVoidLog = history;
        } catch (e) {
        }
        try {
            console.info('[FilterTube][Advert Void]', entry);
        } catch (e) {
        }
        return entry;
    }

    function adVoidRecordResult(result) {
        const previous = adVoidState.lastResult;
        adVoidState.lastResult = result;
        try {
            document.documentElement?.setAttribute('data-filtertube-ad-void-state', result);
        } catch (e) {
        }
        if (previous !== result) adVoidTrace('state', { previous, result });
        return result;
    }

    function syncAdVoidPresentation(enabled) {
        const root = document.documentElement;
        if (!root) return;
        root.toggleAttribute('data-filtertube-ad-void-enabled', enabled === true);
        if (!enabled) return;
        if (document.getElementById(AD_VOID_STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = AD_VOID_STYLE_ID;
        style.textContent = `
            html[data-filtertube-ad-void-enabled] .html5-video-player.ad-showing video,
            html[data-filtertube-ad-void-enabled] .html5-video-player.ad-interrupting video {
                opacity: 0 !important;
                visibility: hidden !important;
            }
            html[data-filtertube-ad-void-enabled] .html5-video-player.ad-showing video[data-filtertube-ad-void-content="true"],
            html[data-filtertube-ad-void-enabled] .html5-video-player.ad-interrupting video[data-filtertube-ad-void-content="true"] {
                position: absolute !important;
                inset: 0 !important;
                z-index: 1002 !important;
                display: block !important;
                width: 100% !important;
                height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
                opacity: 1 !important;
                visibility: visible !important;
                object-fit: contain !important;
                background: #000 !important;
            }
        `;
        (document.head || root).appendChild(style);
    }

    function isAdVoidEnabled() {
        return Boolean(
            cachedSettings
            && cachedSettings.enabled !== false
            && cachedSettings.hideSponsoredCards === true
        );
    }

    function adVoidPlayerRoot() {
        return document.getElementById('movie_player')
            || document.querySelector('.html5-video-player')
            || document.querySelector('ytm-player, ytm-player-container, ytm-watch-player, #player');
    }

    function adVoidPrimaryVideo(player) {
        const candidates = [
            player?.querySelector?.('video.html5-main-video'),
            player?.querySelector?.('video'),
            document.querySelector('video.html5-main-video'),
            document.querySelector('video')
        ].filter(Boolean);
        return candidates.find(video => {
            try {
                return video.readyState > 0 && video.getBoundingClientRect().width > 8;
            } catch (e) {
                return false;
            }
        }) || candidates[0] || null;
    }

    function adVoidExpectedContentDuration() {
        const candidates = [
            rawYtInitialPlayerResponse,
            window.ytInitialPlayerResponse,
            window.filterTube?.lastYtInitialPlayerResponse,
            window.filterTube?.rawYtInitialPlayerResponse,
            window.filterTube?.lastYtPlayerResponse,
            document.querySelector('ytd-watch-flexy')?.playerData?.videoDetails,
            document.querySelector('ytd-watch-flexy')?.data?.playerResponse
        ];
        for (const candidate of candidates) {
            const value = Number(candidate?.videoDetails?.lengthSeconds || candidate?.lengthSeconds);
            if (Number.isFinite(value) && value > 0) return value;
        }
        return 0;
    }

    function adVoidContentTimelineSnapshot(player) {
        let currentTime = null;
        let duration = null;
        let playerState = null;
        try {
            const value = Number(player?.getCurrentTime?.());
            if (Number.isFinite(value) && value >= 0) currentTime = value;
        } catch (e) {
        }
        try {
            const value = Number(player?.getDuration?.());
            if (Number.isFinite(value) && value > 0) duration = value;
        } catch (e) {
        }
        try {
            const value = Number(player?.getPlayerState?.());
            if (Number.isFinite(value)) playerState = value;
        } catch (e) {
        }
        let placement = 'unknown';
        if (currentTime !== null && duration !== null) {
            if (currentTime <= 5) placement = 'pre-roll';
            else if (duration - currentTime <= 8) placement = 'post-roll';
            else placement = 'mid-roll';
        }
        return {
            currentTime,
            duration,
            playerState,
            placement
        };
    }

    function adVoidTraceRequestedContentReady(player) {
        if (!adVoidState.adEndedAt || !adVoidState.awaitingContentVideoId) return false;
        if (adVoidHasInterruption(player)) return false;
        const currentVideoId = new URLSearchParams(location.search).get('v') || '';
        if (currentVideoId !== adVoidState.awaitingContentVideoId) {
            adVoidState.adEndedAt = 0;
            adVoidState.awaitingContentVideoId = '';
            return false;
        }
        const expectedDuration = adVoidExpectedContentDuration();
        const video = adVoidPrimaryVideo(player);
        const duration = Number(video?.duration);
        const durationMatches = expectedDuration <= 0
            || (Number.isFinite(duration) && Math.abs(duration - expectedDuration) <= 2.5);
        if (!video || video.readyState < 2 || !durationMatches) return false;
        adVoidTrace('requested-content-ready', {
            transitionMs: Date.now() - adVoidState.adEndedAt,
            placement: adVoidState.placement,
            expectedDuration: expectedDuration || null,
            content: adVoidVideoSummary(video)
        });
        adVoidState.adEndedAt = 0;
        adVoidState.awaitingContentVideoId = '';
        return true;
    }

    function adVoidMediaRoles(player) {
        // Never borrow a video from inline previews, Shorts, miniplayers, or
        // recommendation cards. Advert decisions belong to this Watch player.
        const videos = Array.from(player?.querySelectorAll?.('video') || [])
            .filter(video => video && video.readyState > 0 && player.contains(video));
        const adVideo = videos.find(video => !video.paused)
            || videos.find(video => adVoidNodeIsVisible(video))
            || videos[0]
            || null;
        const expectedDuration = adVoidExpectedContentDuration();
        let contentVideo = null;
        if (expectedDuration > 0) {
            contentVideo = videos
                .filter(video => video !== adVideo && Number.isFinite(video.duration))
                .sort((left, right) => (
                    Math.abs(left.duration - expectedDuration) - Math.abs(right.duration - expectedDuration)
                ))[0] || null;
            if (contentVideo && Math.abs(contentVideo.duration - expectedDuration) > 2.5) {
                contentVideo = null;
            }
        }
        if (!contentVideo) {
            contentVideo = videos.find(video => (
                video !== adVideo
                && video.paused
                && Number.isFinite(video.duration)
                && video.duration > 0
                && Math.abs(video.duration - Number(adVideo?.duration || 0)) > 0.5
            )) || null;
        }
        return { adVideo, contentVideo, videos, expectedDuration };
    }

    function adVoidNodeIsVisible(node) {
        if (!node || typeof node.getBoundingClientRect !== 'function') return false;
        try {
            const rect = node.getBoundingClientRect();
            if (rect.width <= 8 || rect.height <= 8) return false;
            const style = window.getComputedStyle ? window.getComputedStyle(node) : null;
            if (!style) return true;
            const opacity = Number.parseFloat(style.opacity || '1');
            return style.display !== 'none'
                && style.visibility !== 'hidden'
                && opacity > 0.05;
        } catch (e) {
            return false;
        }
    }

    const AD_VOID_SELECTORS = [
        '.video-ads',
        '.ytp-ad-module',
        '.ytp-ad-player-overlay',
        '.ytp-ad-overlay-container',
        '.ytp-ad-preview-container',
        '.ytp-ad-image-overlay',
        '.ytp-ad-skip-button',
        '.ytp-skip-ad-button'
    ];

    function adVoidContainerHasSignal(node) {
        if (!node) return false;
        const signalSelectors = [
            '.ytp-ad-player-overlay',
            '.ytp-ad-overlay-container',
            '.ytp-ad-preview-container',
            '.ytp-ad-image-overlay',
            '.ytp-ad-skip-button',
            '.ytp-skip-ad-button',
            '.ytp-ad-text',
            '.ytp-ad-simple-ad-badge',
            'button[aria-label*="Skip"]',
            'button[aria-label*="skip"]'
        ];
        for (const selector of signalSelectors) {
            const signal = node.querySelector?.(selector);
            if (signal && adVoidNodeIsVisible(signal)) return true;
        }
        const text = String(node.innerText || node.textContent || '').toLowerCase();
        return text.includes('visit advertiser')
            || text.includes('skip ads')
            || text.includes('skip ad');
    }

    function adVoidHasInterruption(player) {
        const className = String(player?.className || '');
        if (className.includes('ad-showing') || className.includes('ad-interrupting')) {
            return true;
        }
        for (const selector of AD_VOID_SELECTORS) {
            for (const candidate of document.querySelectorAll(selector)) {
                if (!adVoidNodeIsVisible(candidate)) continue;
                if (
                    (selector === '.video-ads' || selector === '.ytp-ad-module')
                    && !adVoidContainerHasSignal(candidate)
                ) {
                    continue;
                }
                return true;
            }
        }
        const textNodes = player ? [player] : [];
        for (const selector of AD_VOID_SELECTORS) {
            document.querySelectorAll(selector).forEach(node => textNodes.push(node));
        }
        return textNodes.some(node => {
            if (!adVoidNodeIsVisible(node)) return false;
            const text = String(node.innerText || node.textContent || '').toLowerCase();
            return text.includes('visit advertiser')
                || text.includes('skip ads')
                || text.includes('skip ad');
        });
    }

    function adVoidCaptureAudio(video, player) {
        if (adVoidState.audioSnapshot) return;
        let playerMuted = null;
        let playerVolume = null;
        try {
            if (player && typeof player.isMuted === 'function') playerMuted = player.isMuted() === true;
        } catch (e) {
        }
        try {
            if (player && typeof player.getVolume === 'function') {
                const volume = Number(player.getVolume());
                if (Number.isFinite(volume)) playerVolume = volume;
            }
        } catch (e) {
        }
        adVoidState.audioSnapshot = {
            playerMuted,
            playerVolume,
            video,
            videoMuted: video ? video.muted === true : null,
            videoDefaultMuted: video ? video.defaultMuted === true : null,
            videoVolume: video && Number.isFinite(video.volume) ? video.volume : null
        };
    }

    function adVoidMuteMedia(media) {
        if (!media) return;
        try { media.muted = true; } catch (e) {}
        try { media.defaultMuted = true; } catch (e) {}
        try { media.volume = 0; } catch (e) {}
        try { media.setAttribute('muted', ''); } catch (e) {}
    }

    function adVoidQuarantine(adVideo, player, contentVideo) {
        adVoidCaptureAudio(adVideo, player);
        if (!contentVideo) {
            try { if (typeof player?.mute === 'function') player.mute(); } catch (e) {}
            try { if (typeof player?.setVolume === 'function') player.setVolume(0); } catch (e) {}
        }
        const media = new Set(adVideo ? [adVideo] : []);
        for (const selector of [
            '.html5-video-player.ad-showing video',
            '.html5-video-player.ad-interrupting video',
            '.video-ads video',
            '.ytp-ad-module video',
            '.ytp-ad-player-overlay video'
        ]) {
            document.querySelectorAll(selector).forEach(node => media.add(node));
        }
        media.forEach(node => {
            if (node !== contentVideo) adVoidMuteMedia(node);
        });
    }

    function adVoidClickSkip(player) {
        if (!player) return false;
        const selectors = [
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            '.ytp-skip-ad-button',
            '.ytp-ad-skip-button-container button',
            'button[aria-label*="Skip"]',
            'button[aria-label*="skip"]'
        ];
        for (const selector of selectors) {
            const node = player.querySelector(selector);
            if (!node || typeof node.click !== 'function' || node.disabled || !adVoidNodeIsVisible(node)) continue;
            if (node.getAttribute('data-filtertube-ad-void-skip-attempted') === 'true') continue;
            try {
                node.setAttribute('data-filtertube-ad-void-skip-attempted', 'true');
                node.click();
                adVoidTrace('official-skip-clicked', { selector });
                return true;
            } catch (e) {
            }
        }
        return false;
    }

    function adVoidAdvanceConfirmedAd(adVideo, player, expectedDuration) {
        if (!adVideo || !player || !player.contains(adVideo)) return false;
        if (adVoidState.advancedAdVideo === adVideo && adVoidState.advancedAdDuration === adVideo.duration) {
            return false;
        }
        const className = String(player.className || '');
        const hasAdShowing = className.includes('ad-showing');
        const hasAdInterrupting = className.includes('ad-interrupting');
        if (!hasAdShowing && !hasAdInterrupting) return false;
        const duration = Number(adVideo.duration);
        const currentTime = Number(adVideo.currentTime || 0);
        if (!Number.isFinite(duration) || duration <= 2) return false;
        const differsFromRequestedContent = expectedDuration > 0
            && Math.abs(duration - expectedDuration) > 2.5;
        if (expectedDuration > 0 && !differsFromRequestedContent) {
            adVoidTrace('ad-advance-rejected-content-duration', {
                expectedDuration,
                ad: adVoidVideoSummary(adVideo)
            });
            return false;
        }
        // YouTube often does not render an ad badge or Skip button until
        // several seconds into a pre-roll. Do not wait for that UI when the
        // player itself supplies stronger identity: both interruption classes,
        // a playing media element owned by movie_player, and a duration that
        // differs from the requested video's known duration. If the requested
        // duration is not known, retain the conservative visible-ad guard.
        const hasImmediatePlayerIdentity = hasAdShowing
            && hasAdInterrupting
            && differsFromRequestedContent;
        if (!hasImmediatePlayerIdentity && !adVoidContainerHasSignal(player)) return false;
        // Recheck the exact element and interruption immediately before the
        // write. This prevents a YouTube transition from turning the target
        // into the requested video between discovery and advancement.
        const currentPlayerVideo = Array.from(player.querySelectorAll('video'))
            .find(video => !video.paused) || player.querySelector('video.html5-main-video');
        if (currentPlayerVideo !== adVideo || !adVoidHasInterruption(player)) return false;
        const safeEnd = Math.max(0, duration - 0.25);
        if (currentTime >= safeEnd - 0.1) return false;
        try {
            adVoidState.advancedAdVideo = adVideo;
            adVoidState.advancedAdDuration = duration;
            adVideo.currentTime = safeEnd;
            let playerDuration = null;
            let playerSeekApplied = false;
            try {
                if (typeof player.getDuration === 'function') {
                    const reportedDuration = Number(player.getDuration());
                    if (Number.isFinite(reportedDuration) && reportedDuration > 0) {
                        playerDuration = reportedDuration;
                    }
                }
                // Mirror Android's second completion signal, but only while
                // YouTube's player API reports the same duration as the
                // already-confirmed advert. A player duration belonging to the
                // requested video can therefore never be sought here.
                if (
                    typeof player.seekTo === 'function'
                    && playerDuration !== null
                    && Math.abs(playerDuration - duration) <= 0.75
                ) {
                    player.seekTo(safeEnd, true);
                    playerSeekApplied = true;
                }
            } catch (e) {
            }
            adVoidTrace('confirmed-ad-advanced', {
                from: currentTime,
                to: safeEnd,
                playerDuration,
                playerSeekApplied,
                expectedContentDuration: expectedDuration || null,
                ad: adVoidVideoSummary(adVideo)
            });
            return true;
        } catch (error) {
            adVoidTrace('confirmed-ad-advance-failed', {
                error: String(error?.name || error?.message || error || 'unknown'),
                ad: adVoidVideoSummary(adVideo)
            });
            return false;
        }
    }

    function adVoidApplyContentAudio(contentVideo) {
        if (!contentVideo) return;
        const snapshot = adVoidState.audioSnapshot;
        const shouldRemainMuted = snapshot?.playerMuted === true || snapshot?.videoMuted === true;
        try {
            if (snapshot?.videoVolume !== null && Number.isFinite(snapshot?.videoVolume)) {
                contentVideo.volume = snapshot.videoVolume;
            }
        } catch (e) {
        }
        try { contentVideo.defaultMuted = shouldRemainMuted; } catch (e) {}
        try { contentVideo.muted = shouldRemainMuted; } catch (e) {}
        try {
            if (shouldRemainMuted) contentVideo.setAttribute('muted', '');
            else contentVideo.removeAttribute('muted');
        } catch (e) {
        }
    }

    function adVoidKeepParallelContentPlaying() {
        const parallel = adVoidState.parallelContent;
        const contentVideo = parallel?.video;
        if (!contentVideo?.isConnected || !isAdVoidEnabled()) return;
        adVoidApplyContentAudio(contentVideo);
        if (!contentVideo.paused) return;
        adVoidState.resumeAttempts += 1;
        const attempt = adVoidState.resumeAttempts;
        adVoidTrace('content-play-requested', {
            attempt,
            content: adVoidVideoSummary(contentVideo)
        });
        try {
            const playResult = contentVideo.play();
            if (playResult && typeof playResult.then === 'function') {
                playResult.then(() => {
                    adVoidTrace('content-play-started', {
                        attempt,
                        content: adVoidVideoSummary(contentVideo)
                    });
                }).catch(error => {
                    adVoidTrace('content-play-rejected', {
                        attempt,
                        error: String(error?.name || error?.message || error || 'unknown'),
                        content: adVoidVideoSummary(contentVideo)
                    });
                });
            }
        } catch (e) {
            adVoidTrace('content-play-threw', {
                attempt,
                error: String(e?.name || e?.message || e || 'unknown')
            });
        }
    }

    function adVoidStartParallelContent(contentVideo) {
        if (!contentVideo) return false;
        if (adVoidState.parallelContent?.video !== contentVideo) {
            const previous = adVoidState.parallelContent;
            if (previous?.video && previous.pauseHandler) {
                previous.video.removeEventListener('pause', previous.pauseHandler, true);
                previous.video.removeAttribute('data-filtertube-ad-void-content');
            }
            const parallel = { video: contentVideo, pauseHandler: null, resumeTimer: null };
            parallel.pauseHandler = () => {
                adVoidTrace('content-paused-during-ad', {
                    content: adVoidVideoSummary(contentVideo)
                });
                if (parallel.resumeTimer) window.clearTimeout(parallel.resumeTimer);
                parallel.resumeTimer = window.setTimeout(() => {
                    parallel.resumeTimer = null;
                    adVoidKeepParallelContentPlaying();
                }, 60);
            };
            adVoidState.parallelContent = parallel;
            contentVideo.setAttribute('data-filtertube-ad-void-content', 'true');
            contentVideo.addEventListener('pause', parallel.pauseHandler, true);
            adVoidTrace('content-promoted', {
                content: adVoidVideoSummary(contentVideo)
            });
        }
        adVoidKeepParallelContentPlaying();
        return true;
    }

    function adVoidStopParallelContent() {
        const parallel = adVoidState.parallelContent;
        adVoidState.parallelContent = null;
        if (!parallel?.video) return null;
        if (parallel.resumeTimer) window.clearTimeout(parallel.resumeTimer);
        try { parallel.video.removeEventListener('pause', parallel.pauseHandler, true); } catch (e) {}
        try { parallel.video.removeAttribute('data-filtertube-ad-void-content'); } catch (e) {}
        adVoidTrace('content-released', {
            content: adVoidVideoSummary(parallel.video)
        });
        return parallel.video;
    }

    function adVoidRestoreAudio(preferredVideo = null) {
        const snapshot = adVoidState.audioSnapshot;
        adVoidState.audioSnapshot = null;
        if (!snapshot) return;
        const player = adVoidPlayerRoot();
        const video = preferredVideo?.isConnected
            ? preferredVideo
            : (snapshot.video?.isConnected ? snapshot.video : adVoidPrimaryVideo(player));
        try {
            if (snapshot.playerVolume !== null && typeof player?.setVolume === 'function') {
                player.setVolume(snapshot.playerVolume);
            }
        } catch (e) {
        }
        try {
            if (snapshot.playerMuted === true && typeof player?.mute === 'function') player.mute();
            if (snapshot.playerMuted === false && typeof player?.unMute === 'function') player.unMute();
        } catch (e) {
        }
        if (video) {
            try { if (snapshot.videoVolume !== null) video.volume = snapshot.videoVolume; } catch (e) {}
            try { if (snapshot.videoMuted !== null) video.muted = snapshot.videoMuted; } catch (e) {}
            try { if (snapshot.videoDefaultMuted !== null) video.defaultMuted = snapshot.videoDefaultMuted; } catch (e) {}
            try {
                if (snapshot.videoMuted) video.setAttribute('muted', '');
                else video.removeAttribute('muted');
            } catch (e) {
            }
        }
    }

    function runAdVoidPass() {
        if (!isAdVoidEnabled()) {
            const contentVideo = adVoidStopParallelContent();
            if (adVoidState.active || adVoidState.audioSnapshot) adVoidRestoreAudio(contentVideo);
            adVoidState.active = false;
            adVoidState.quietPasses = 0;
            return adVoidRecordResult('disabled');
        }
        const player = adVoidPlayerRoot();
        if (!adVoidHasInterruption(player)) {
            if (adVoidState.active) {
                adVoidState.quietPasses += 1;
                if (adVoidState.quietPasses >= 1) {
                    const contentVideo = adVoidStopParallelContent();
                    adVoidRestoreAudio(contentVideo);
                    adVoidTrace('ad-ended', {
                        elapsedMs: Date.now() - adVoidState.sessionStartedAt,
                        placement: adVoidState.placement,
                        content: adVoidVideoSummary(contentVideo)
                    });
                    adVoidState.adEndedAt = Date.now();
                    adVoidState.awaitingContentVideoId = new URLSearchParams(location.search).get('v') || '';
                    adVoidState.active = false;
                    adVoidState.quietPasses = 0;
                    adVoidState.sessionStartedAt = 0;
                    adVoidState.lastRoleSignature = '';
                    adVoidState.lastWaitingLogAt = 0;
                    adVoidState.resumeAttempts = 0;
                    adVoidState.advancedAdVideo = null;
                    adVoidState.advancedAdDuration = 0;
                }
            }
            adVoidTraceRequestedContentReady(player);
            return adVoidRecordResult('ad-not-active');
        }
        if (!adVoidState.active) {
            adVoidState.sessionSequence += 1;
            adVoidState.sessionStartedAt = Date.now();
            adVoidState.lastRoleSignature = '';
            adVoidState.lastWaitingLogAt = 0;
            adVoidState.resumeAttempts = 0;
            adVoidState.advancedAdVideo = null;
            adVoidState.advancedAdDuration = 0;
            adVoidState.contentTimelineAtAdStart = adVoidContentTimelineSnapshot(player);
            adVoidState.placement = adVoidState.contentTimelineAtAdStart.placement;
            adVoidState.adEndedAt = 0;
            adVoidState.awaitingContentVideoId = '';
            adVoidTrace('ad-detected', {
                placement: adVoidState.placement,
                contentTimeline: adVoidState.contentTimelineAtAdStart,
                playerClass: String(player?.className || '')
            });
        }
        adVoidState.active = true;
        adVoidState.quietPasses = 0;
        const { adVideo, contentVideo, videos, expectedDuration } = adVoidMediaRoles(player);
        const roleSignature = JSON.stringify({
            expectedDuration,
            videos: videos.map(video => {
                const summary = adVoidVideoSummary(video);
                return {
                    ownerPlayer: summary?.ownerPlayer,
                    duration: summary?.duration,
                    readyState: summary?.readyState,
                    paused: summary?.paused,
                    promoted: summary?.promoted
                };
            }),
            adIndex: videos.indexOf(adVideo),
            contentIndex: videos.indexOf(contentVideo)
        });
        if (roleSignature !== adVoidState.lastRoleSignature) {
            adVoidState.lastRoleSignature = roleSignature;
            adVoidTrace('media-roles', {
                expectedDuration,
                adIndex: videos.indexOf(adVideo),
                contentIndex: videos.indexOf(contentVideo),
                videos: videos.map(adVoidVideoSummary)
            });
        }
        adVoidQuarantine(adVideo, player, contentVideo);
        const skipRequested = adVoidClickSkip(player);
        if (adVoidStartParallelContent(contentVideo)) {
            return adVoidRecordResult('ad-void-parallel-content');
        }
        if (adVoidAdvanceConfirmedAd(adVideo, player, expectedDuration)) {
            return adVoidRecordResult('confirmed-ad-advanced');
        }
        if (
            adVoidState.advancedAdVideo === adVideo
            && adVoidState.advancedAdDuration === adVideo?.duration
        ) {
            return adVoidRecordResult('confirmed-ad-advanced-awaiting-transition');
        }
        const now = Date.now();
        if (!adVoidState.lastWaitingLogAt || now - adVoidState.lastWaitingLogAt >= 3000) {
            adVoidState.lastWaitingLogAt = now;
            adVoidTrace('waiting-for-requested-content', {
                expectedDuration,
                videos: videos.map(adVoidVideoSummary)
            });
        }
        return adVoidRecordResult(skipRequested
            ? 'ad-skip-requested-awaiting-transition'
            : 'ad-covered-awaiting-content');
    }

    function syncAdVoidRuntime() {
        const enabled = isAdVoidEnabled();
        syncAdVoidPresentation(enabled);
        if (!enabled) {
            if (adVoidState.timer) window.clearInterval(adVoidState.timer);
            adVoidState.timer = null;
            runAdVoidPass();
            return;
        }
        runAdVoidPass();
        if (!adVoidState.timer) {
            adVoidState.timer = window.setInterval(runAdVoidPass, AD_VOID_POLL_MS);
        }
    }

    function isOriginalAudioPreferenceEnabled() {
        return Boolean(
            cachedSettings
            && cachedSettings.enabled !== false
            && cachedSettings.alwaysUseOriginalAudio === true
            && !document.location.hostname.includes('youtubekids.com')
        );
    }

    function audioTrackText(value) {
        if (typeof value === 'string') return value.trim();
        if (value && typeof value.simpleText === 'string') return value.simpleText.trim();
        if (Array.isArray(value?.runs)) {
            return value.runs.map(run => String(run?.text || '')).join('').trim();
        }
        return '';
    }

    function normalizeAudioTrackId(value) {
        return String(value || '').trim().toLowerCase().replace(/_/g, '-');
    }

    function baseAudioTrackId(value) {
        return normalizeAudioTrackId(value).replace(/\.\d+$/, '');
    }

    function playerResponseCandidates(data) {
        if (Array.isArray(data)) {
            return data.flatMap(item => playerResponseCandidates(item));
        }
        if (!data || typeof data !== 'object') return [];
        const candidates = [data];
        for (const key of ['playerResponse', 'player_response']) {
            if (data[key] && typeof data[key] === 'object') candidates.push(data[key]);
        }
        return candidates;
    }

    const AD_VOID_PLAYER_PLAN_KEYS = new Set([
        'playerAds',
        'adPlacements',
        'adSlots',
        'adBreakHeartbeatParams'
    ]);

    function isAdVoidPlayerPayload(dataName) {
        const name = String(dataName || '');
        return name.includes('ytInitialPlayerResponse')
            || name.includes('/youtubei/v1/player')
            || name.includes('/youtubei/v1/get_watch');
    }

    function adVoidRemovePlayerAdPlan(data, dataName) {
        if (!isAdVoidEnabled() || !isAdVoidPlayerPayload(dataName) || !data || typeof data !== 'object') {
            return data;
        }
        const seen = new WeakSet();
        const removed = {
            playerAds: 0,
            adPlacements: 0,
            adSlots: 0,
            adBreakHeartbeatParams: 0
        };
        const visit = value => {
            if (!value || typeof value !== 'object' || seen.has(value)) return;
            seen.add(value);
            if (Array.isArray(value)) {
                value.forEach(visit);
                return;
            }
            for (const key of Object.keys(value)) {
                if (AD_VOID_PLAYER_PLAN_KEYS.has(key)) {
                    removed[key] += 1;
                    try { delete value[key]; } catch (e) {}
                    continue;
                }
                visit(value[key]);
            }
        };
        visit(data);
        const removedCount = Object.values(removed).reduce((sum, count) => sum + count, 0);
        if (removedCount > 0) {
            adVoidTrace('player-ad-plan-removed', {
                dataName,
                removed
            });
        }
        return data;
    }

    function extractProvenOriginalAudioTrack(data) {
        for (const response of playerResponseCandidates(data)) {
            const formats = [
                ...(Array.isArray(response?.streamingData?.formats) ? response.streamingData.formats : []),
                ...(Array.isArray(response?.streamingData?.adaptiveFormats) ? response.streamingData.adaptiveFormats : [])
            ];
            const tracksById = new Map();
            for (const format of formats) {
                const track = format?.audioTrack;
                const id = String(track?.id || '').trim();
                if (!id) continue;
                const existing = tracksById.get(id) || {};
                tracksById.set(id, {
                    id,
                    languageCode: String(track?.languageCode || existing.languageCode || '').trim(),
                    displayName: audioTrackText(track?.displayName) || existing.displayName || '',
                    audioIsDefault: track?.audioIsDefault === true || existing.audioIsDefault === true,
                    isAutoDubbed: track?.isAutoDubbed === true || existing.isAutoDubbed === true
                });
            }

            const tracks = [...tracksById.values()];
            const namedOriginal = tracks.find(track => (
                track.isAutoDubbed !== true
                && /(?:^|[\s(])original(?:[\s)]|$)/i.test(track.displayName)
            ));
            const sourceDefault = tracks.find(track => (
                track.audioIsDefault === true
                && track.isAutoDubbed !== true
            ));
            const original = namedOriginal || sourceDefault;
            const videoId = String(
                response?.videoDetails?.videoId
                || response?.microformat?.playerMicroformatRenderer?.externalVideoId
                || ''
            ).trim();
            if (original && videoId) return { ...original, videoId };
        }
        return null;
    }

    function playerTrackDescriptor(track) {
        if (typeof track === 'string' && track.trim()) {
            return { id: track.trim(), name: '', track };
        }
        if (!track || typeof track !== 'object') return null;
        let info = null;
        try {
            info = typeof track.getLanguageInfo === 'function' ? track.getLanguageInfo() : null;
        } catch (e) {
        }
        let id = '';
        let name = '';
        try {
            id = String(
                (info && typeof info.getId === 'function' ? info.getId() : '')
                || info?.id
                || track.id
                || track.audioTrackId
                || ''
            ).trim();
        } catch (e) {
        }
        try {
            name = String(
                (info && typeof info.getName === 'function' ? info.getName() : '')
                || info?.name
                || track.displayName
                || track.name
                || ''
            ).trim();
        } catch (e) {
        }
        return id ? { id, name, track } : null;
    }

    function currentPlayerVideoId(player) {
        try {
            const data = typeof player.getVideoData === 'function' ? player.getVideoData() : null;
            const fromPlayer = String(data?.video_id || data?.videoId || '').trim();
            if (fromPlayer) return fromPlayer;
        } catch (e) {
        }
        try {
            const fromQuery = new URL(document.location.href).searchParams.get('v');
            if (fromQuery) return String(fromQuery).trim();
            const match = document.location.pathname.match(/^\/(?:shorts|embed)\/([^/?#]+)/);
            return match ? String(match[1]).trim() : '';
        } catch (e) {
            return '';
        }
    }

    function applyOriginalAudioPreference() {
        originalAudioState.timer = null;
        if (!isOriginalAudioPreferenceEnabled()) return;
        if (!originalAudioState.videoId || !originalAudioState.trackId) return;

        const player = document.getElementById('movie_player');
        const currentVideoId = player ? currentPlayerVideoId(player) : '';
        if (!player || !currentVideoId || currentVideoId !== originalAudioState.videoId) {
            scheduleOriginalAudioPreference();
            return;
        }
        if (
            typeof player.getAvailableAudioTracks !== 'function'
            || typeof player.setAudioTrack !== 'function'
        ) {
            scheduleOriginalAudioPreference();
            return;
        }

        let available = [];
        try {
            available = player.getAvailableAudioTracks() || [];
        } catch (e) {
        }
        const descriptors = available.map(playerTrackDescriptor).filter(Boolean);
        if (descriptors.length < 2) {
            scheduleOriginalAudioPreference();
            return;
        }

        const exactId = normalizeAudioTrackId(originalAudioState.trackId);
        const exactMatches = descriptors.filter(item => normalizeAudioTrackId(item.id) === exactId);
        const baseId = baseAudioTrackId(originalAudioState.trackId || originalAudioState.languageCode);
        const baseMatches = descriptors.filter(item => baseAudioTrackId(item.id) === baseId);
        const namedMatches = descriptors.filter(item => /(?:^|[\s(])original(?:[\s)]|$)/i.test(item.name));
        const target = exactMatches.length === 1
            ? exactMatches[0]
            : (baseMatches.length === 1 ? baseMatches[0] : (namedMatches.length === 1 ? namedMatches[0] : null));
        if (!target) return;

        let current = null;
        try {
            current = typeof player.getAudioTrack === 'function'
                ? playerTrackDescriptor(player.getAudioTrack())
                : null;
        } catch (e) {
        }
        if (current && normalizeAudioTrackId(current.id) === normalizeAudioTrackId(target.id)) {
            if (originalAudioState.attempts < 6) scheduleOriginalAudioPreference();
            return;
        }

        try {
            player.setAudioTrack(target.track, true);
            seedDebugLog(`🔊 Restored original audio track for ${originalAudioState.videoId}`);
            if (originalAudioState.attempts < 6) scheduleOriginalAudioPreference();
        } catch (e) {
            scheduleOriginalAudioPreference();
        }
    }

    function scheduleOriginalAudioPreference(resetAttempts = false) {
        if (resetAttempts) originalAudioState.attempts = 0;
        if (!isOriginalAudioPreferenceEnabled()) return;
        if (!originalAudioState.videoId || !originalAudioState.trackId) return;
        if (originalAudioState.timer || originalAudioState.attempts >= 10) return;
        const attempt = originalAudioState.attempts++;
        const delay = attempt === 0 ? 0 : Math.min(250 * attempt, 1250);
        originalAudioState.timer = window.setTimeout(applyOriginalAudioPreference, delay);
    }

    function rememberOriginalAudioTrack(data) {
        const original = extractProvenOriginalAudioTrack(data);
        if (!original) return;
        const changedVideo = original.videoId !== originalAudioState.videoId;
        originalAudioState.videoId = original.videoId;
        originalAudioState.trackId = original.id;
        originalAudioState.languageCode = original.languageCode;
        originalAudioState.displayName = original.displayName;
        scheduleOriginalAudioPreference(changedVideo);
    }

    function stashNetworkSnapshot(data, dataName) {
        try {
            if (!window.filterTube) return;
            if (!data || typeof data !== 'object') return;
            const name = typeof dataName === 'string' ? dataName : '';
            if (!name) return;

            const ts = Date.now();
            if (name.includes('/youtubei/v1/search')) {
                window.filterTube.lastYtSearchResponse = data;
                window.filterTube.lastYtSearchResponseName = name;
                window.filterTube.lastYtSearchResponseTs = ts;
                const recentSearchResponses = Array.isArray(window.filterTube.recentYtSearchResponses)
                    ? window.filterTube.recentYtSearchResponses
                    : [];
                recentSearchResponses.push({
                    data,
                    name,
                    ts
                });
                window.filterTube.recentYtSearchResponses = recentSearchResponses.slice(-12);
                return;
            }
            if (name.includes('/youtubei/v1/next')) {
                window.filterTube.lastYtNextResponse = data;
                window.filterTube.lastYtNextResponseName = name;
                window.filterTube.lastYtNextResponseTs = ts;
                return;
            }
            if (name.includes('/youtubei/v1/browse')) {
                window.filterTube.lastYtBrowseResponse = data;
                window.filterTube.lastYtBrowseResponseName = name;
                window.filterTube.lastYtBrowseResponseTs = ts;
                const recentBrowseResponses = Array.isArray(window.filterTube.recentYtBrowseResponses)
                    ? window.filterTube.recentYtBrowseResponses
                    : [];
                recentBrowseResponses.push({
                    data,
                    name,
                    ts
                });
                window.filterTube.recentYtBrowseResponses = recentBrowseResponses.slice(-12);
                return;
            }
            if (name.includes('/youtubei/v1/player')) {
                window.filterTube.lastYtPlayerResponse = data;
                window.filterTube.lastYtPlayerResponseName = name;
                window.filterTube.lastYtPlayerResponseTs = ts;
                return;
            }
        } catch (e) {
        }
    }

    let replayTimer = null;
    let replayAttempts = 0;

    function replayPendingQueueIfReady() {
        try {
            if (!cachedSettings) return;
            if (!Array.isArray(pendingDataQueue) || pendingDataQueue.length === 0) return;

            const engine = window.FilterTubeEngine;
            const hasEngine = Boolean(engine && (typeof engine.processData === 'function' || typeof engine.harvestOnly === 'function'));
            if (!hasEngine) {
                replayAttempts++;
                if (replayAttempts > 50) return;
                scheduleReplay();
                return;
            }

            replayAttempts = 0;

            const queue = [...pendingDataQueue];
            pendingDataQueue = [];
            for (const item of queue) {
                try {
                    const sourceData = cloneData(item.data) || item.data;
                    processWithEngine(sourceData, `${item.name}-replay`);
                } catch (e) {
                }
            }
        } catch (e) {
        }
    }

    function scheduleReplay() {
        if (replayTimer) return;
        replayTimer = setTimeout(() => {
            replayTimer = null;
            replayPendingQueueIfReady();
        }, 250);
    }
    
    // Debug logging with sequence numbers
    let seedDebugSequence = 0;
    function isSeedDebugEnabled() {
        try {
            return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
        } catch (e) {
            try {
                return !!window.__filtertubeDebug;
            } catch (e2) {
                return false;
            }
        }
    }
    function seedDebugLog(message, ...args) {
        if (!isSeedDebugEnabled()) return;
        seedDebugSequence++;
        console.log(`[${seedDebugSequence}] FilterTube (Seed):`, message, ...args);
        
        // Also send logs to content_bridge for extension console visibility
        try {
            window.postMessage({
                type: 'FilterTube_SeedToBridge_Log',
                payload: {
                    level: 'log',
                    message: [message, ...args],
                    seq: seedDebugSequence
                },
                source: 'seed'
            }, '*');
        } catch (e) {
            // Don't let log relay failures break anything
        }
    }
    
    seedDebugLog("🌱 Seed script starting early initialization");

    // ============================================================================
    // FILTERING ENGINE INTERFACE
    // ============================================================================

    /**
     * Process data using the comprehensive filtering engine
     */
    function cloneData(data) {
        if (!data) return null;
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(data);
            } catch (err) {
                seedDebugLog('⚠️ structuredClone failed, falling back to JSON clone', err.message);
            }
        }
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (err) {
            seedDebugLog('❌ JSON clone failed:', err.message);
            return null;
        }
    }

    function hasList(value) {
        return Array.isArray(value) && value.length > 0;
    }

    function hasEnabledContentFilters(settings) {
        return Boolean(
            settings
            && settings.contentFilters
            && (
                settings.contentFilters.duration?.enabled === true
                || settings.contentFilters.uploadDate?.enabled === true
                || settings.contentFilters.uppercase?.enabled === true
            )
        );
    }

    function hasSelectedCategoryFilters(settings) {
        return Boolean(
            settings?.categoryFilters?.enabled === true
            && hasList(settings.categoryFilters.selected)
        );
    }

    function hasSelectedLanguageFilters(settings) {
        return Boolean(
            settings?.languageFilters?.enabled === true
            && hasList(settings.languageFilters.selected)
        );
    }

    function hasActiveJsonFilterRules(settings) {
        return Boolean(
            settings
            && (
                hasList(settings.filterKeywords)
                || hasList(settings.filterChannels)
                || hasList(settings.filterKeywordsComments)
                || settings.hideAllComments === true
                || settings.hideAllShorts === true
                || hasSelectedCategoryFilters(settings)
                || hasSelectedLanguageFilters(settings)
            )
        );
    }

    function hasNetworkJsonWork(settings) {
        if (!settings || settings.enabled === false) return false;
        if (settings.hideSponsoredCards === true) return true;
        if (settings.listMode === 'whitelist') return true;
        return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);
    }

    function hasFilteringJsonWork(settings) {
        if (!settings || settings.enabled === false) return false;
        if (settings.listMode === 'whitelist') return true;
        return hasEnabledContentFilters(settings) || hasActiveJsonFilterRules(settings);
    }

    function shouldCaptureRawSnapshot() {
        return Boolean(cachedSettings && hasNetworkJsonWork(cachedSettings));
    }

    function getDebugPayloadSize(data) {
        if (!isSeedDebugEnabled()) return 0;
        try {
            return data ? JSON.stringify(data).length : 0;
        } catch (e) {
            return 0;
        }
    }

    function shouldBypassYouTubeiNetworkResponse(dataName) {
        if (!cachedSettings) {
            seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (settings not loaded)`);
            return true;
        }
        if (hasNetworkJsonWork(cachedSettings)) return false;
        if (
            cachedSettings.alwaysUseOriginalAudio === true
            && String(dataName || '').includes('/youtubei/v1/player')
        ) return false;
        seedDebugLog(`⏭️ Passing through ${dataName} before JSON parse (no active JSON work)`);
        return true;
    }

    function shouldSkipEngineProcessing(data, dataName) {
        if (!data || !dataName) return false;

        const path = document.location?.pathname || '';
        const isSearchResultsPath = path.startsWith('/results');
        const isChannelPath = /^(\/(?:@|channel\/|c\/))/i.test(path);
        const mode = (cachedSettings && cachedSettings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
        const activeContentFilters = hasEnabledContentFilters(cachedSettings);
        const activeJsonFilterRules = hasActiveJsonFilterRules(cachedSettings);

        const searchActionCollections = data.onResponseReceivedCommands || data.onResponseReceivedActions || data.onResponseReceivedEndpoints;
        const hasSearchLayout = Boolean(
            data?.contents?.twoColumnSearchResultsRenderer ||
            data?.contents?.twoColumnSearchResults ||
            data?.header?.searchHeaderRenderer ||
            (Array.isArray(searchActionCollections) && searchActionCollections.some(action => {
                const continuationKeys = ['appendContinuationItemsAction', 'reloadContinuationItemsCommand', 'replaceContinuationItemsCommand'];

                return continuationKeys.some(key => {
                    const payload = action?.[key];
                    if (!payload) return false;

                    const continuationItems = payload.continuationItems;
                    if (Array.isArray(continuationItems)) {
                        return continuationItems.some(item => !!(
                            item?.itemSectionRenderer ||
                            item?.videoRenderer ||
                            item?.channelRenderer ||
                            item?.lockupViewModel ||
                            item?.lockupMetadataViewModel ||
                            item?.gridShelfViewModel ||
                            item?.shelfRenderer ||
                            item?.richItemRenderer
                        ));
                    }

                    return Boolean(
                        payload?.sectionListRenderer ||
                        payload?.gridRenderer ||
                        payload?.richGridRenderer
                    );
                });
            }))
        );

        if (isSearchResultsPath) {
            const isSearchFetch = typeof dataName === 'string' && dataName.startsWith('fetch:/youtubei/v1/search');
            if (isSearchFetch || hasSearchLayout) {
                if (mode !== 'whitelist') {
                    // Keep the old fast path only when there are no active rules. Once a
                    // blocklist rule exists, JSON filtering must run before YouTube paints.
                    if (!activeContentFilters && !activeJsonFilterRules) {
                        seedDebugLog(`⏭️ Skipping engine processing for ${dataName} (search results) to allow DOM-based restore`);
                        return true;
                    }
                }
            }
        }

        if (isChannelPath) {
            const channelIndicators = Boolean(
                data?.metadata?.channelMetadataRenderer ||
                data?.header?.c4TabbedHeaderRenderer ||
                data?.contents?.twoColumnBrowseResultsRenderer ||
                data?.contents?.twoColumnBrowseResults
            );

            const isChannelDataName = typeof dataName === 'string' && (
                dataName === 'ytInitialData' ||
                dataName.startsWith('fetch:/youtubei/v1/browse') ||
                dataName.startsWith('fetch:/youtubei/v1/next')
            );

            if (channelIndicators && isChannelDataName) {
                if (mode !== 'whitelist' && !activeContentFilters && !activeJsonFilterRules) {
                    seedDebugLog(`⏭️ Skipping engine processing for ${dataName} (channel page) to allow DOM-based restore`);
                    return true;
                }
            }
        }

        const isBrowseFetch = typeof dataName === 'string' && dataName.startsWith('fetch:/youtubei/v1/browse');
        if (!isBrowseFetch) return false;

        const isOnHomeFeed = path === '/' && !isMobileInterface;
        if (!isOnHomeFeed) return false;

        // Apply deterministic content filters JSON-first on home feed to prevent flash.
        if (activeContentFilters) return false;
        if (mode === 'whitelist') return false;
        if (activeJsonFilterRules) return false;

        const actionCollections = data.onResponseReceivedActions || data.onResponseReceivedEndpoints;
        if (!Array.isArray(actionCollections)) return false;

        const continuationKeys = ['appendContinuationItemsAction', 'reloadContinuationItemsCommand', 'replaceContinuationItemsCommand'];

        return actionCollections.some(action => {
            for (const key of continuationKeys) {
                const continuationItems = action?.[key]?.continuationItems;
                if (!Array.isArray(continuationItems)) continue;

                const hasRichGridContent = continuationItems.some(item => !!(
                    item?.richItemRenderer ||
                    item?.richSectionRenderer ||
                    item?.richShelfRenderer ||
                    item?.gridVideoRenderer ||
                    item?.compactVideoRenderer ||
                    item?.lockupViewModel ||
                    item?.lockupMetadataViewModel
                ));

                if (hasRichGridContent) {
                    return true;
                }
            }
            return false;
        });
    }

    function processWithEngine(data, dataName) {
        if (!data) {
            seedDebugLog(`⚠️ No data to process for ${dataName}`);
            return data;
        }

        if (
            String(dataName || '').includes('ytInitialPlayerResponse')
            || String(dataName || '').includes('/youtubei/v1/player')
        ) {
            rememberOriginalAudioTrack(data);
        }

        adVoidRemovePlayerAdPlan(data, dataName);

        const queueForLater = (reason) => {
            try {
                pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || '' });
                if (pendingDataQueue.length > 60) {
                    pendingDataQueue = pendingDataQueue.slice(-40);
                }
                scheduleReplay();
            } catch (e) {
            }
        };
        
        if (!cachedSettings) {
            seedDebugLog(`⚠️ No settings available for processing ${dataName}, queueing`);
            queueForLater('settings-missing');
            return data; // Return unmodified data
        }

        if (!hasFilteringJsonWork(cachedSettings)) {
            seedDebugLog(`⏭️ No active filtering work for ${dataName}; returning any Advert Void sanitization only`);
            return data; // Return unmodified data
        }

        if (cachedSettings.enabled === false) {
            seedDebugLog(`⏸️ Filtering disabled (enabled=false), skipping processing for ${dataName}`);
            return data;
        }

        if (shouldSkipEngineProcessing(data, dataName)) {
            // For search/home/channel layouts we skip MUTATING the data to allow DOM-based
            // restore, but we still want to LEARN UC ID <-> @handle mappings from the
            // same blobs so that channelMap stays fresh for 3-dot menu blocking.
            if (window.FilterTubeEngine && typeof window.FilterTubeEngine.harvestOnly === 'function') {
                seedDebugLog(`🧠 Harvest-only pass for ${dataName} (skip filtering)`);
                try {
                    window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] });
                } catch (e) {
                    seedDebugLog(`❌ Harvest-only failed for ${dataName}:`, e);
                }
            } else {
                seedDebugLog(`⚠️ FilterTubeEngine.harvestOnly not available for ${dataName}`);
                queueForLater('harvestOnly-missing');
            }

            seedDebugLog(`⏭️ Skipping engine filtering for ${dataName} to allow DOM-based restore`);
            stashNetworkSnapshot(data, dataName);
            return data;
        }

        seedDebugLog(`🔧 Starting to process ${dataName}...`);
        seedDebugLog(`Settings available:`, {
            profileType: cachedSettings.profileType,
            listMode: cachedSettings.listMode,
            keywords: cachedSettings.filterKeywords?.length || 0,
            channels: cachedSettings.filterChannels?.length || 0,
            hideAllComments: cachedSettings.hideAllComments,
            hideAllShorts: cachedSettings.hideAllShorts
        });

        // Use the comprehensive filtering engine if available
        if (window.FilterTubeEngine && window.FilterTubeEngine.processData) {
            seedDebugLog(`🔧 Processing ${dataName} with comprehensive engine`);
            try {
                const debugStatsEnabled = isSeedDebugEnabled();
                const startedAt = debugStatsEnabled ? Date.now() : 0;
                const originalSize = debugStatsEnabled ? JSON.stringify(data).length : 0;
                const result = window.FilterTubeEngine.processData(data, cachedSettings, dataName);
                const newSize = debugStatsEnabled ? JSON.stringify(result).length : 0;
                
                seedDebugLog(`✅ Successfully processed ${dataName} with engine`);
                if (debugStatsEnabled) {
                    seedDebugLog(`📊 Size change: ${originalSize} → ${newSize} chars (${originalSize - newSize} removed)`);
                    seedDebugLog(`⏱️ Engine processing time: ${Date.now() - startedAt}ms`);

                    // Check if anything was actually filtered
                    if (originalSize !== newSize) {
                        seedDebugLog(`🎯 Data was modified! Filtering is working.`);
                    } else {
                        seedDebugLog(`⚠️ No changes made to data - check filter rules and data structure`);
                    }
                }

                stashNetworkSnapshot(result, dataName);
                return result;
            } catch (e) {
                seedDebugLog(`❌ Engine processing failed for ${dataName}:`, e);
                // Fall back to basic processing
                const fallback = basicProcessing(data, dataName);
                stashNetworkSnapshot(fallback, dataName);
                return fallback;
            }
        } else {
            seedDebugLog(`⚠️ FilterTubeEngine not available yet`);
            seedDebugLog(`Available on window:`, Object.keys(window).filter(k => k.includes('Filter')));
            queueForLater('engine-missing');
            return data;
        }
    }

    /**
     * Basic fallback processing when the main engine isn't available
     */
    function basicProcessing(data, dataName) {
        if (!cachedSettings) return data;

        if (cachedSettings.enabled === false) {
            return data;
        }
        
        let modified = false;
        seedDebugLog(`🔧 Basic processing ${dataName}`);
        
        try {
            // Basic comment hiding
            if (cachedSettings.hideAllComments) {
                // Remove engagement panels with comments
                if (data.engagementPanels) {
                    for (let i = data.engagementPanels.length - 1; i >= 0; i--) {
                        const panel = data.engagementPanels[i];
                        const titleText = panel?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer?.title?.simpleText || '';
                        
                        if (titleText.toLowerCase().includes("comment")) {
                            seedDebugLog(`✂️ Removing comments panel "${titleText}"`);
                            data.engagementPanels.splice(i, 1);
                            modified = true;
                        }
                    }
                }
                
                // Remove comment sections from main content
                if (data.contents?.twoColumnWatchNextResults?.results?.results?.contents) {
                    const contents = data.contents.twoColumnWatchNextResults.results.results.contents;
                    for (let i = contents.length - 1; i >= 0; i--) {
                        if (contents[i]?.itemSectionRenderer?.sectionIdentifier === 'comment-item-section') {
                            seedDebugLog(`✂️ Removing comment section at index ${i}`);
                            contents.splice(i, 1);
                            modified = true;
                        }
                    }
                }
            }
            
            if (modified) {
                seedDebugLog(`✅ Basic processing modified ${dataName}`);
            } else {
                seedDebugLog(`ℹ️ Basic processing made no changes to ${dataName}`);
            }
        } catch (e) {
            seedDebugLog(`❌ Error in basic processing:`, e);
        }
        
        return data;
    }

    // ============================================================================
    // DATA HOOKS SETUP
    // ============================================================================

    /**
     * Set up hooks for YouTube data before it's processed by YouTube
     */
    function establishDataHooks() {
        if (dataHooksEstablished) {
            seedDebugLog("⚠️ Data hooks already established, skipping");
            return;
        }

        seedDebugLog("🎯 Setting up data interception hooks");

        // Hook ytInitialData
        let originalYtInitialData = window.ytInitialData;
        
        // Check if data already exists and process it immediately
        if (originalYtInitialData && typeof originalYtInitialData === 'object') {
            seedDebugLog("🎯 ytInitialData already exists, processing immediately");
            rawYtInitialData = shouldCaptureRawSnapshot() ? cloneData(originalYtInitialData) : null;
            const processed = processWithEngine(originalYtInitialData, 'ytInitialData-existing');
            window.ytInitialData = processed;
            if (window.filterTube) {
                window.filterTube.lastYtInitialData = processed;
                window.filterTube.rawYtInitialData = rawYtInitialData ? cloneData(rawYtInitialData) : null;
            }
        }

        // Set up defineProperty hook for future data
        const ytInitialDataDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialData');
        if (ytInitialDataDesc && ytInitialDataDesc.configurable === false) {
            seedDebugLog('⚠️ ytInitialData is non-configurable; skipping hook');
        } else {
            try {
                Object.defineProperty(window, 'ytInitialData', {
                    configurable: true,
                    get: function() {
                        return originalYtInitialData;
                    },
                    set: function(newValue) {
                        if (isSeedDebugEnabled()) {
                            seedDebugLog('🎯 ytInitialData intercepted via setter');
                            seedDebugLog('Data keys:', newValue ? Object.keys(newValue) : 'null');
                            seedDebugLog('Data size:', getDebugPayloadSize(newValue), 'chars');
                        }
                        
                        rawYtInitialData = shouldCaptureRawSnapshot() ? cloneData(newValue) : null;
                        const processed = processWithEngine(newValue, 'ytInitialData');
                        originalYtInitialData = processed;
                        
                        // Update global reference
                        if (window.filterTube) {
                            window.filterTube.lastYtInitialData = processed;
                            window.filterTube.rawYtInitialData = rawYtInitialData ? cloneData(rawYtInitialData) : null;
                        }
                    }
                });
            } catch (e) {
                seedDebugLog('⚠️ Failed to install ytInitialData hook:', e);
            }
        }

        // Hook ytInitialPlayerResponse
        let originalYtInitialPlayerResponse = window.ytInitialPlayerResponse;
        
        // Check if data already exists and process it immediately
        if (originalYtInitialPlayerResponse && typeof originalYtInitialPlayerResponse === 'object') {
            seedDebugLog("🎯 ytInitialPlayerResponse already exists, processing immediately");
            rawYtInitialPlayerResponse = shouldCaptureRawSnapshot() ? cloneData(originalYtInitialPlayerResponse) : null;
            const processed = processWithEngine(originalYtInitialPlayerResponse, 'ytInitialPlayerResponse-existing');
            window.ytInitialPlayerResponse = processed;
            if (window.filterTube) {
                window.filterTube.lastYtInitialPlayerResponse = processed;
                window.filterTube.rawYtInitialPlayerResponse = rawYtInitialPlayerResponse ? cloneData(rawYtInitialPlayerResponse) : null;
            }
        }

        // Set up defineProperty hook for future data
        const ytPlayerDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialPlayerResponse');
        if (ytPlayerDesc && ytPlayerDesc.configurable === false) {
            seedDebugLog('⚠️ ytInitialPlayerResponse is non-configurable; skipping hook');
        } else {
            try {
                Object.defineProperty(window, 'ytInitialPlayerResponse', {
                    configurable: true,
                    get: function() {
                        return originalYtInitialPlayerResponse;
                    },
                    set: function(newValue) {
                        if (isSeedDebugEnabled()) {
                            seedDebugLog('🎯 ytInitialPlayerResponse intercepted via setter');
                            seedDebugLog('Data keys:', newValue ? Object.keys(newValue) : 'null');
                            seedDebugLog('Data size:', getDebugPayloadSize(newValue), 'chars');
                        }
                        
                        rawYtInitialPlayerResponse = shouldCaptureRawSnapshot() ? cloneData(newValue) : null;
                        const processed = processWithEngine(newValue, 'ytInitialPlayerResponse');
                        originalYtInitialPlayerResponse = processed;
                        
                        // Update global reference
                        if (window.filterTube) {
                            window.filterTube.lastYtInitialPlayerResponse = processed;
                            window.filterTube.rawYtInitialPlayerResponse = rawYtInitialPlayerResponse ? cloneData(rawYtInitialPlayerResponse) : null;
                        }
                    }
                });
            } catch (e) {
                seedDebugLog('⚠️ Failed to install ytInitialPlayerResponse hook:', e);
            }
        }

        dataHooksEstablished = true;
        seedDebugLog("✅ Data hooks established successfully");
    }

    // ============================================================================
    // FETCH/XHR INTERCEPTION
    // ============================================================================

    /**
     * Set up fetch interception for dynamic content
     */
    function setupFetchInterception() {
        const fetchEndpoints = [
            '/youtubei/v1/search',
            '/youtubei/v1/guide', 
            '/youtubei/v1/browse',
            '/youtubei/v1/next',
            '/youtubei/v1/player',
            '/youtubei/v1/get_watch'
        ];

        const getPathname = (rawUrl) => {
            try {
                return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;
            } catch (e) {
                const fallback = String(rawUrl || '');
                return fallback.split('?')[0] || fallback;
            }
        };

        const originalFetch = window.fetch;
        window.fetch = function(resource, init) {
            const url = resource instanceof Request ? resource.url : resource;
            const urlStr = typeof url === 'string' ? url : String(url || '');

            if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {
                return originalFetch.apply(this, arguments);
            }

            const dataName = `fetch:${getPathname(urlStr)}`;
            if (shouldBypassYouTubeiNetworkResponse(dataName)) {
                return originalFetch.apply(this, arguments);
            }

            return originalFetch.apply(this, arguments).then(response => {
                if (!response.ok) return response;

                return response.clone().json().then(jsonData => {
                    // Special handling for comment requests when hideAllComments is enabled
                    if (urlStr.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {
                        // Check if this is a comment continuation request
                        const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint => 
                            endpoint?.appendContinuationItemsAction?.continuationItems?.some(item => 
                                item?.commentThreadRenderer || item?.commentRenderer
                            )
                        );
                        
                        if (isCommentRequest) {
                            seedDebugLog('🚫 Intercepting comment request - returning empty continuation');
                            // Return a proper "end of comments" response instead of empty data
                            const emptyCommentResponse = {
                                ...jsonData,
                                onResponseReceivedEndpoints: [{
                                    appendContinuationItemsAction: {
                                        continuationItems: [
                                            // Add a proper end marker so YouTube stops requesting more
                                            {
                                                continuationItemRenderer: {
                                                    trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN",
                                                    continuationEndpoint: null // This signals end of content
                                                }
                                            }
                                        ]
                                    }
                                }]
                            };
                            
                            return new Response(JSON.stringify(emptyCommentResponse), {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            });
                        }
                    }
                    
                    // Normal processing for non-comment or non-hideAllComments requests
                    const processed = processWithEngine(jsonData, dataName);
                    if (!hasNetworkJsonWork(cachedSettings)) {
                        return response;
                    }
                    return new Response(JSON.stringify(processed), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }).catch(err => {
                    // If JSON parsing fails, return original response
                    seedDebugLog(`⚠️ Fetch processing failed for ${url}:`, err);
                    return response;
                });
            });
        };

        seedDebugLog("✅ Fetch interception established");
    }

    function setupXhrInterception() {
        try {
            if (window.__filtertubeXhrInterceptionInstalled) return;
            window.__filtertubeXhrInterceptionInstalled = true;

            const xhrEndpoints = [
                '/youtubei/v1/search',
                '/youtubei/v1/guide',
                '/youtubei/v1/browse',
                '/youtubei/v1/next',
                '/youtubei/v1/player',
                '/youtubei/v1/get_watch'
            ];

            const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
            if (!proto) return;

            const originalOpen = proto.open;
            const originalSend = proto.send;
            const originalAddEventListener = proto.addEventListener;
            const originalRemoveEventListener = proto.removeEventListener;
            if (typeof originalOpen !== 'function' || typeof originalSend !== 'function') return;

            const getPathname = (rawUrl) => {
                try {
                    return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;
                } catch (e) {
                    const fallback = String(rawUrl || '');
                    return fallback.split('?')[0] || fallback;
                }
            };

            const listenerWrapperMap = new WeakMap();

            const getWrappedListener = (xhr, type, listener) => {
                if (typeof listener !== 'function') return listener;
                let perXhr = listenerWrapperMap.get(xhr);
                if (!perXhr) {
                    perXhr = new Map();
                    listenerWrapperMap.set(xhr, perXhr);
                }
                const key = `${type}::${listener}`;
                if (perXhr.has(key)) return perXhr.get(key);

                const wrapped = function () {
                    try {
                        if ((type === 'readystatechange' || type === 'load') && xhr?.__filtertube_shouldProcessXhr) {
                            ensureXhrResponseProcessed(xhr);
                        }
                    } catch (e) {
                    }
                    return listener.apply(this, arguments);
                };
                perXhr.set(key, wrapped);
                return wrapped;
            };

            const ensureXhrResponseProcessed = (xhr) => {
                try {
                    if (!xhr || xhr.__filtertube_responseProcessed) return;
                    if (!xhr.__filtertube_shouldProcessXhr) return;
                    if (xhr.readyState !== 4) return;
                    if (!cachedSettings) return;
                    if (cachedSettings.enabled === false) return;

                    const status = Number(xhr.status || 0);
                    if (status && status >= 400) return;

                    const urlStr = typeof xhr.__filtertube_url === 'string' ? xhr.__filtertube_url : String(xhr.__filtertube_url || '');
                    const dataName = `xhr:${getPathname(urlStr)}`;
                    if (shouldBypassYouTubeiNetworkResponse(dataName)) {
                        xhr.__filtertube_responseProcessed = true;
                        return;
                    }

                    const responseType = xhr.responseType || '';
                    let jsonData = null;

                    if (responseType === 'json') {
                        jsonData = xhr.response;
                        if (!jsonData || typeof jsonData !== 'object') return;
                    } else if (responseType === '' || responseType === 'text') {
                        const text = xhr.responseText;
                        if (!text || typeof text !== 'string') return;
                        const trimmed = text.trim();
                        if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return;
                        try {
                            jsonData = JSON.parse(trimmed);
                        } catch (e) {
                            return;
                        }
                    } else {
                        return;
                    }

                    const processed = processWithEngine(jsonData, dataName);
                    if (!processed || typeof processed !== 'object') return;
                    if (!hasNetworkJsonWork(cachedSettings)) {
                        xhr.__filtertube_responseProcessed = true;
                        return;
                    }

                    xhr.__filtertube_modifiedResponse = processed;
                    xhr.__filtertube_modifiedResponseText = JSON.stringify(processed);

                    if (!xhr.__filtertube_responseInterceptorsInstalled) {
                        xhr.__filtertube_responseInterceptorsInstalled = true;
                        try {
                            const protoResponseDesc = Object.getOwnPropertyDescriptor(proto, 'response');
                            const protoResponseTextDesc = Object.getOwnPropertyDescriptor(proto, 'responseText');

                            Object.defineProperty(xhr, 'response', {
                                configurable: true,
                                get: function () {
                                    if (this.__filtertube_modifiedResponse !== undefined) {
                                        const rt = this.responseType || '';
                                        if (rt === 'json') return this.__filtertube_modifiedResponse;
                                        if (rt === '' || rt === 'text') return this.__filtertube_modifiedResponseText;
                                        return this.__filtertube_modifiedResponse;
                                    }
                                    return protoResponseDesc && typeof protoResponseDesc.get === 'function'
                                        ? protoResponseDesc.get.call(this)
                                        : undefined;
                                }
                            });

                            Object.defineProperty(xhr, 'responseText', {
                                configurable: true,
                                get: function () {
                                    if (this.__filtertube_modifiedResponseText !== undefined) {
                                        return this.__filtertube_modifiedResponseText;
                                    }
                                    return protoResponseTextDesc && typeof protoResponseTextDesc.get === 'function'
                                        ? protoResponseTextDesc.get.call(this)
                                        : '';
                                }
                            });
                        } catch (e) {
                        }
                    }

                    xhr.__filtertube_responseProcessed = true;
                } catch (e) {
                }
            };

            if (typeof originalAddEventListener === 'function') {
                proto.addEventListener = function (type, listener, options) {
                    try {
                        if (this && this.__filtertube_shouldProcessXhr && (type === 'readystatechange' || type === 'load')) {
                            const wrapped = getWrappedListener(this, type, listener);
                            return originalAddEventListener.call(this, type, wrapped, options);
                        }
                    } catch (e) {
                    }
                    return originalAddEventListener.call(this, type, listener, options);
                };
            }

            if (typeof originalRemoveEventListener === 'function') {
                proto.removeEventListener = function (type, listener, options) {
                    try {
                        if (this && this.__filtertube_shouldProcessXhr && (type === 'readystatechange' || type === 'load')) {
                            const wrapped = getWrappedListener(this, type, listener);
                            return originalRemoveEventListener.call(this, type, wrapped, options);
                        }
                    } catch (e) {
                    }
                    return originalRemoveEventListener.call(this, type, listener, options);
                };
            }

            proto.open = function(method, url) {
                try {
                    this.__filtertube_url = url;
                    const urlStr = typeof url === 'string' ? url : String(url || '');
                    const dataName = `xhr:${getPathname(urlStr)}`;
                    this.__filtertube_shouldProcessXhr = Boolean(
                        urlStr
                        && xhrEndpoints.some(endpoint => urlStr.includes(endpoint))
                        && !shouldBypassYouTubeiNetworkResponse(dataName)
                    );
                    this.__filtertube_responseProcessed = false;
                } catch (e) {
                }
                return originalOpen.apply(this, arguments);
            };

            proto.send = function() {
                try {
                    const rawUrl = this.__filtertube_url;
                    const urlStr = typeof rawUrl === 'string' ? rawUrl : String(rawUrl || '');
                    const dataName = `xhr:${getPathname(urlStr)}`;
                    if (
                        urlStr
                        && xhrEndpoints.some(endpoint => urlStr.includes(endpoint))
                        && !shouldBypassYouTubeiNetworkResponse(dataName)
                    ) {
                        this.__filtertube_shouldProcessXhr = true;
                        this.__filtertube_responseProcessed = false;
                        const xhr = this;
                        const processIfReady = function () {
                            try {
                                ensureXhrResponseProcessed(xhr);
                            } catch (e) {
                            }
                        };

                        if (typeof originalAddEventListener === 'function') {
                            originalAddEventListener.call(this, 'readystatechange', processIfReady);
                            originalAddEventListener.call(this, 'load', processIfReady);
                        }
                    }
                } catch (e) {
                }

                return originalSend.apply(this, arguments);
            };

            seedDebugLog("✅ XHR interception established");
        } catch (e) {
        }
    }

    // ============================================================================
    // SETTINGS MANAGEMENT
    // ============================================================================

    /**
     * Update settings and process any queued data
     */
    function updateSettings(newSettings) {
        seedDebugLog('📥 Settings update received');
        seedDebugLog('Settings details:', {
            profileType: newSettings.profileType,
            listMode: newSettings.listMode,
            keywords: newSettings.filterKeywords?.length || 0,
            channels: newSettings.filterChannels?.length || 0,
            hideAllComments: newSettings.hideAllComments,
            hideAllShorts: newSettings.hideAllShorts
        });
        
        cachedSettings = newSettings;
        syncAdVoidRuntime();
        if (isOriginalAudioPreferenceEnabled()) {
            scheduleOriginalAudioPreference(true);
        } else if (originalAudioState.timer) {
            window.clearTimeout(originalAudioState.timer);
            originalAudioState.timer = null;
            originalAudioState.attempts = 0;
        }
        try {
            if (window.filterTube && typeof window.filterTube === 'object') {
                window.filterTube.settings = newSettings;
            }
        } catch (e) {
        }

        if (!hasNetworkJsonWork(cachedSettings)) {
            pendingDataQueue = [];
            rawYtInitialData = null;
            rawYtInitialPlayerResponse = null;
            try {
                if (window.filterTube && typeof window.filterTube === 'object') {
                    window.filterTube.rawYtInitialData = null;
                    window.filterTube.rawYtInitialPlayerResponse = null;
                }
            } catch (e) {
            }
            seedDebugLog('⏭️ Settings update has no active JSON work; cleared queued seed data without replay');
            return;
        }
        
        let replayedInitialData = false;
        let replayedPlayerResponse = false;

        // Process any queued data
        if (pendingDataQueue.length > 0) {
            seedDebugLog(`🔄 Processing ${pendingDataQueue.length} queued data items`);
            
            const queue = [...pendingDataQueue];
            pendingDataQueue = [];
            
            for (const item of queue) {
                seedDebugLog(`🔄 Processing queued ${item.name} (queued ${Date.now() - item.timestamp}ms ago)`);
                const sourceData = cloneData(item.data) || item.data;
                const processed = processWithEngine(sourceData, `${item.name}-queued`);
                
                // Update the appropriate global variable
                if (item.name.includes('ytInitialData')) {
                    replayedInitialData = true;
                    window.ytInitialData = processed;
                    if (window.filterTube) {
                        window.filterTube.lastYtInitialData = processed;
                    }
                } else if (item.name.includes('ytInitialPlayerResponse')) {
                    replayedPlayerResponse = true;
                    window.ytInitialPlayerResponse = processed;
                    if (window.filterTube) {
                        window.filterTube.lastYtInitialPlayerResponse = processed;
                    }
                }
            }
            
            seedDebugLog(`✅ Finished processing queued data`);
        }
        
        // Reprocess existing data if available (for settings changes)
        if (window.filterTube) {
            const sourceInitialData = rawYtInitialData
                ? cloneData(rawYtInitialData)
                : (window.filterTube.rawYtInitialData
                    ? cloneData(window.filterTube.rawYtInitialData)
                    : (window.filterTube.lastYtInitialData ? cloneData(window.filterTube.lastYtInitialData) : null));
            if (sourceInitialData && !replayedInitialData) {
                seedDebugLog('🔄 Reprocessing stored ytInitialData snapshot with new settings');
                const reprocessed = processWithEngine(sourceInitialData, 'ytInitialData-reprocess');
                window.ytInitialData = reprocessed;
                window.filterTube.lastYtInitialData = reprocessed;
            }

            const sourcePlayerResponse = rawYtInitialPlayerResponse
                ? cloneData(rawYtInitialPlayerResponse)
                : (window.filterTube.rawYtInitialPlayerResponse
                    ? cloneData(window.filterTube.rawYtInitialPlayerResponse)
                    : (window.filterTube.lastYtInitialPlayerResponse ? cloneData(window.filterTube.lastYtInitialPlayerResponse) : null));
            if (sourcePlayerResponse && !replayedPlayerResponse) {
                seedDebugLog('🔄 Reprocessing stored ytInitialPlayerResponse snapshot with new settings');
                const reprocessed = processWithEngine(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess');
                window.ytInitialPlayerResponse = reprocessed;
                window.filterTube.lastYtInitialPlayerResponse = reprocessed;
            }
        }
        
        seedDebugLog('✅ Settings update completed');
    }

    // ============================================================================
    // GLOBAL INTERFACE
    // ============================================================================

    // Create global FilterTube object for inter-script communication
    window.filterTube = {
        settings: null,
        lastYtInitialData: null,
        lastYtInitialPlayerResponse: null,
        rawYtInitialData: null,
        rawYtInitialPlayerResponse: null,
        updateSettings: updateSettings,
        
        // Advanced processing functions (can be overridden by injector.js)
        processFetchResponse: null,
        processXhrResponse: null,
        
        // Debug interface
        getStats: function() {
            return {
                settingsLoaded: !!cachedSettings,
                hooksEstablished: dataHooksEstablished,
                queuedItems: pendingDataQueue.length,
                lastYtData: !!this.lastYtInitialData,
                lastPlayerData: !!this.lastYtInitialPlayerResponse,
                adVoid: adVoidState.lastResult
            };
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    // Establish data hooks immediately
    establishDataHooks();
    
    // Set up fetch interception
    setupFetchInterception();

    setupXhrInterception();

    document.addEventListener('yt-navigate-finish', () => scheduleOriginalAudioPreference(true), true);
    document.addEventListener('yt-page-data-updated', () => scheduleOriginalAudioPreference(true), true);
    document.addEventListener('yt-navigate-finish', runAdVoidPass, true);
    document.addEventListener('yt-page-data-updated', runAdVoidPass, true);
    document.addEventListener('playing', runAdVoidPass, true);
    document.addEventListener('loadedmetadata', runAdVoidPass, true);
    document.addEventListener('durationchange', runAdVoidPass, true);
    document.addEventListener('canplay', runAdVoidPass, true);
    window.addEventListener('pagehide', () => {
        if (adVoidState.timer) window.clearInterval(adVoidState.timer);
        adVoidState.timer = null;
        adVoidRestoreAudio();
        syncAdVoidPresentation(false);
    }, { once: true });
    
    // Mark as ready and dispatch event
    window.ftSeedInitialized = true;
    
    try {
        window.dispatchEvent(new CustomEvent('filterTubeSeedReady', {
            detail: { timestamp: Date.now(), source: 'seed' }
        }));
        seedDebugLog('📢 Dispatched filterTubeSeedReady event');
    } catch (e) {
        seedDebugLog('❌ Error dispatching ready event:', e);
    }
    
    seedDebugLog('🏁 Seed initialization complete - ready for content filtering');

})(); 
