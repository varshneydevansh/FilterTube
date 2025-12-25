// js/content/dom_fallback.js - Isolated World
//
// DOM fallback filtering pipeline used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

const CHANNEL_ONLY_TAGS = new Set([
    'ytd-universal-watch-card-renderer',
    'ytm-universal-watch-card-renderer'
]);

function channelMatchesFilter(meta, filterChannel, channelMap = {}) {
    const sharedChannelMatchesFilter = window.FilterTubeIdentity?.channelMatchesFilter;
    if (typeof sharedChannelMatchesFilter === 'function') {
        return sharedChannelMatchesFilter(meta, filterChannel, channelMap);
    }
    return false;
}

function markElementAsBlocked(element, channelInfo, state = 'pending') {
    if (!element || !channelInfo) return;

    if (channelInfo.id) {
        element.setAttribute('data-filtertube-blocked-channel-id', channelInfo.id);
    }
    if (channelInfo.handle) {
        element.setAttribute('data-filtertube-blocked-channel-handle', channelInfo.handle);
    }
    if (channelInfo.customUrl) {
        element.setAttribute('data-filtertube-blocked-channel-custom', channelInfo.customUrl);
    }
    if (channelInfo.name) {
        element.setAttribute('data-filtertube-blocked-channel-name', channelInfo.name);
    }
    element.setAttribute('data-filtertube-blocked-state', state);
    element.setAttribute('data-filtertube-blocked-ts', Date.now().toString());
}

function clearBlockedElementAttributes(element) {
    if (!element) return;
    element.removeAttribute('data-filtertube-blocked-channel-id');
    element.removeAttribute('data-filtertube-blocked-channel-handle');
    element.removeAttribute('data-filtertube-blocked-channel-custom');
    element.removeAttribute('data-filtertube-blocked-channel-name');
    element.removeAttribute('data-filtertube-blocked-state');
    element.removeAttribute('data-filtertube-blocked-ts');
}

function ensureContentControlStyles(settings) {
    if (!settings || typeof settings !== 'object') return;
    if (!document.head) return;

    const supportsHasSelector = (() => {
        try {
            return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(:has(*))');
        } catch (e) {
            return false;
        }
    })();

    const styleId = 'filtertube-content-controls-style';
    let style = document.getElementById(styleId);
    if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
    }

    const rules = [];

    if (settings.hideHomeFeed) {
        rules.push(`
            ytd-browse[page-subtype="home"] .ytd-rich-grid-renderer,
            ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
                display: none !important;
            }
        `);
    }

    if (settings.hideSponsoredCards) {
        rules.push(`
            ytd-ad-slot-renderer,
            ytd-in-feed-ad-layout-renderer,
            ytd-promoted-sparkles-web-renderer,
            ytd-promoted-sparkles-text-search-renderer,
            ytd-search-pyv-renderer,
            ytd-display-ad-renderer,
            ytd-companion-slot-renderer,
            ytd-action-companion-ad-renderer,
            ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"] {
                display: none !important;
            }
        `);
    }

    if (settings.hideWatchPlaylistPanel) {
        rules.push(`
            ytd-playlist-panel-renderer {
                display: none !important;
            }
        `);
    }

    if (settings.hidePlaylistCards) {
        rules.push(`
            ytd-playlist-renderer,
            ytd-grid-playlist-renderer,
            ytd-compact-playlist-renderer,
            /* New lockup-based playlist cards (Home/Search) */
            /* Avoid matching Mix/Radio lockups (they are also collection stacks) */
            yt-lockup-view-model.yt-lockup-view-model--collection-stack-2:has(yt-collection-thumbnail-view-model):not(:has(a[href*="start_radio=1"])),
            yt-lockup-view-model:has(yt-collections-stack):not(:has(a[href*="start_radio=1"])),
            /* Playlist shelves on channel/home using lockup stacks */
            ytd-horizontal-list-renderer:has(yt-lockup-view-model.yt-lockup-view-model--collection-stack-2):not(:has(a[href*="start_radio=1"])),
            ytd-shelf-renderer:has(yt-lockup-view-model.yt-lockup-view-model--collection-stack-2):not(:has(a[href*="start_radio=1"])) {
                display: none !important;
            }
        `);
    }

    if (settings.hideMixPlaylists) {
        rules.push(`
            ytd-radio-renderer,
            ytd-compact-radio-renderer,
            ytd-rich-item-renderer:has(a[href*="start_radio=1"]),
            yt-lockup-view-model:has(a[href*="start_radio=1"]),
            a[href*="start_radio=1"],
            .ytp-videowall-still[data-is-mix="true"] {
                display: none !important;
            }
        `);
    }

    if (settings.hideMembersOnly) {
        rules.push(`
            /* Feed and shelf cards with Members-only badge */
            ytd-grid-video-renderer:has(.yt-badge-shape--membership),
            ytd-rich-grid-media:has(.yt-badge-shape--membership),
            yt-lockup-view-model:has(.yt-badge-shape--membership),
            ytd-rich-item-renderer:has(.yt-badge-shape--membership),
            ytd-video-renderer:has(.yt-badge-shape--membership),
            ytd-playlist-video-renderer:has(.yt-badge-shape--membership),
            /* Members-only shelf containers */
            ytd-shelf-renderer:has(.yt-badge-shape--membership) {
                display: none !important;
            }
        `);
    }

    // If :has() isn't supported (common in some Firefox versions), the CSS rules above won't apply.
    // In that case we rely on a JS fallback in applyDOMFallback().
    if (!supportsHasSelector) {
        // Keep CSS empty for these features to avoid giving a false sense of support.
        // (Other non-:has rules still apply.)
    }

    if (settings.hideVideoSidebar) {
        rules.push(`
            #secondary.ytd-watch-flexy {
                display: none !important;
            }
        `);
    }

    if (settings.hideRecommended) {
        rules.push(`
            #related,
            #items.ytd-watch-next-secondary-results-renderer {
                display: none !important;
            }
        `);
    }

    if (settings.hideLiveChat) {
        rules.push(`
            ytd-live-chat-frame#chat,
            #chat-container {
                display: none !important;
            }
        `);
    }

    const hideInfoMaster = !!settings.hideVideoInfo;

    if (hideInfoMaster || settings.hideVideoButtonsBar) {
        rules.push(`
            #actions.ytd-watch-metadata,
            #info > #menu-container {
                display: none !important;
            }
        `);
    }

    if (hideInfoMaster || settings.hideAskButton) {
        rules.push(`
            a[aria-label="Ask"],
            button[aria-label="Ask"] {
                display: none !important;
            }
        `);
    }

    if (hideInfoMaster || settings.hideVideoChannelRow) {
        rules.push(`
            #owner.ytd-watch-metadata,
            #top-row.ytd-video-secondary-info-renderer {
                display: none !important;
            }
        `);
    }

    if (hideInfoMaster || settings.hideVideoDescription) {
        rules.push(`
            #description.ytd-watch-metadata,
            ytd-expander.ytd-video-secondary-info-renderer {
                display: none !important;
            }
        `);
    }

    if (hideInfoMaster || settings.hideMerchTicketsOffers) {
        rules.push(`
            #ticket-shelf,
            ytd-merch-shelf-renderer,
            #offer-module,
            #clarify-box {
                display: none !important;
            }
        `);
    }

    if (settings.hideEndscreenVideowall) {
        rules.push(`
            #movie_player .ytp-endscreen-content,
            #movie_player .ytp-fullscreen-grid-stills-container {
                display: none !important;
            }
        `);
    }

    if (settings.hideEndscreenCards) {
        rules.push(`
            #movie_player .ytp-ce-element {
                display: none !important;
            }
        `);
    }

    if (settings.disableAutoplay) {
        rules.push(`
            button[data-tooltip-target-id="ytp-autonav-toggle-button"],
            .autonav-endscreen {
                display: none !important;
            }
        `);
    }

    if (settings.disableAnnotations) {
        rules.push(`
            .annotation,
            .iv-branding {
                display: none !important;
            }
        `);
    }

    if (settings.hideTopHeader) {
        rules.push(`
            #masthead-container {
                display: none !important;
            }
        `);
    }

    if (settings.hideNotificationBell) {
        rules.push(`
            ytd-notification-topbar-button-renderer,
            ytd-notification-topbar-button-shape-renderer {
                display: none !important;
            }
        `);
    }

    if (settings.hideExploreTrending) {
        rules.push(`
            .yt-simple-endpoint[href^="/feed/explore"],
            .yt-simple-endpoint[href^="/feed/trending"],
            ytd-browse[page-subtype="trending"] {
                display: none !important;
            }
        `);
    }

    if (settings.hideMoreFromYouTube) {
        rules.push(`
            #sections > ytd-guide-section-renderer:nth-last-child(2) {
                display: none !important;
            }
        `);
    }

    if (settings.hideSubscriptions) {
        rules.push(`
            .yt-simple-endpoint[href^="/feed/subscriptions"],
            ytd-browse[page-subtype="subscriptions"] {
                display: none !important;
            }
        `);
    }

    if (settings.hideSearchShelves) {
        rules.push(`
            #primary > .ytd-two-column-search-results-renderer ytd-shelf-renderer,
            #primary > .ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer {
                display: none !important;
            }
        `);
    }

    style.textContent = rules.join('\n');
}

function normalizeTextForMatching(value) {
    if (!value || typeof value !== 'string') return '';

    let normalized = value;
    try {
        normalized = value.normalize('NFKD');
    } catch (error) {
        // Some environments may not support String.prototype.normalize
        normalized = value;
    }

    // Strip combining marks and zero-width joiners/variation selectors that can interfere with matching
    normalized = normalized.replace(/[\u0300-\u036f]/g, '');
    normalized = normalized.replace(/[\u200D\uFE0E\uFE0F]/g, '');
    return normalized;
}

function extractPlainKeyword(keywordData) {
    if (!keywordData) return '';

    if (keywordData instanceof RegExp) {
        return keywordData.source.replace(/\\b/g, '').replace(/\\/g, '');
    }

    if (keywordData.pattern) {
        return keywordData.pattern.replace(/\\b/g, '').replace(/\\/g, '');
    }

    if (typeof keywordData === 'string') {
        return keywordData;
    }

    return '';
}

function isAlphanumeric(char) {
    if (!char) return false;

    if (char.length !== 1) return false;

    const code = char.charCodeAt(0);
    if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        return true;
    }

    // Basic heuristic for extended Unicode letters
    return char.toUpperCase() !== char.toLowerCase();
}

function matchesKeyword(regex, rawText, keywordData) {
    if (!rawText) return false;

    regex.lastIndex = 0;
    if (regex.test(rawText)) {
        return true;
    }

    const normalized = normalizeTextForMatching(rawText);
    if (normalized && normalized !== rawText) {
        regex.lastIndex = 0;
        return regex.test(normalized);
    }

    const plainKeyword = extractPlainKeyword(keywordData);
    if (plainKeyword) {
        const normalizedKeyword = normalizeTextForMatching(plainKeyword).toLowerCase();
        const normalizedText = normalized.toLowerCase();

        if (normalizedKeyword && normalizedText.includes(normalizedKeyword)) {
            const index = normalizedText.indexOf(normalizedKeyword);
            const beforeChar = index > 0 ? normalizedText[index - 1] : '';
            const afterCharIndex = index + normalizedKeyword.length;
            const afterChar = afterCharIndex < normalizedText.length ? normalizedText[afterCharIndex] : '';

            const hasLeftBoundary = !beforeChar || !isAlphanumeric(beforeChar);
            const hasRightBoundary = !afterChar || !isAlphanumeric(afterChar);

            if (hasLeftBoundary || hasRightBoundary) {
                return true;
            }
        }
    }
    return false;
}

// ============================================================================
// FALLBACK FILTERING LOGIC
// ============================================================================

function handleCommentsFallback(settings) {
    const commentContainers = document.querySelectorAll(
        '#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"]'
    );
    const commentThreads = document.querySelectorAll('ytd-comment-thread-renderer, ytm-comment-thread-renderer');

    // 1. Global Hide
    if (settings.hideAllComments) {
        commentContainers.forEach(container => {
            toggleVisibility(container, true, 'Hide All Comments');
        });
        commentThreads.forEach(thread => {
            toggleVisibility(thread, true, 'Hide All Comments');
        });
        return;
    }

    // 2. Ensure containers are visible when not globally hidden
    commentContainers.forEach(container => {
        toggleVisibility(container, false, '', true);
    });

    const hasChannelFilters = Array.isArray(settings.filterChannels) && settings.filterChannels.length > 0;
    const commentKeywordList = Array.isArray(settings.filterKeywordsComments)
        ? settings.filterKeywordsComments
        : settings.filterKeywords;
    const shouldFilterKeywords = Boolean(settings.filterComments && commentKeywordList?.length > 0);

    // 3. Per-thread filtering
    commentThreads.forEach(thread => {
        const authorAnchor = thread.querySelector(
            '#author-text.yt-simple-endpoint, ' +
            'a#author-text, ' +
            '#author-text a'
        );

        const channelName = authorAnchor?.textContent?.trim() || thread.querySelector('#author-text')?.textContent?.trim() || '';
        const channelHref = authorAnchor?.getAttribute?.('href') || authorAnchor?.href || '';
        const channelMeta = buildChannelMetadata(channelName, channelHref);

        // Honour pending/confirmed hides from the 3-dot UI, even if keyword filtering is off.
        const blockedChannelId = thread.getAttribute('data-filtertube-blocked-channel-id') || '';
        const blockedChannelHandle = thread.getAttribute('data-filtertube-blocked-channel-handle') || '';
        const blockedChannelCustom = thread.getAttribute('data-filtertube-blocked-channel-custom') || '';
        const blockedChannelState = thread.getAttribute('data-filtertube-blocked-state') || '';
        const blockedTimestamp = parseInt(thread.getAttribute('data-filtertube-blocked-ts') || '0', 10);
        const blockAgeMs = blockedTimestamp ? Date.now() - blockedTimestamp : Number.POSITIVE_INFINITY;

        if (blockedChannelId || blockedChannelHandle || blockedChannelCustom) {
            const isStillBlocked = hasChannelFilters && settings.filterChannels.some(fc => {
                if (typeof fc === 'object') {
                    return (blockedChannelId && fc.id?.toLowerCase() === blockedChannelId.toLowerCase()) ||
                        (blockedChannelHandle && fc.handle?.toLowerCase() === blockedChannelHandle.toLowerCase()) ||
                        (blockedChannelCustom && fc.customUrl?.toLowerCase() === blockedChannelCustom.toLowerCase());
                }
                const normalized = (fc || '').toLowerCase();
                return normalized === blockedChannelId.toLowerCase() ||
                    normalized === blockedChannelHandle.toLowerCase() ||
                    normalized === blockedChannelCustom.toLowerCase();
            });

            if (isStillBlocked) {
                markElementAsBlocked(thread, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle,
                    customUrl: blockedChannelCustom
                }, 'confirmed');
                toggleVisibility(thread, true, `Blocked comment author: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                return;
            }

            const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 2000;
            if (waitForConfirmation) {
                toggleVisibility(thread, true, `Pending channel block: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                return;
            }

            clearBlockedElementAttributes(thread);
            toggleVisibility(thread, false, '', true);
        }

        // If nothing is enabled, restore and stop.
        if (!hasChannelFilters && !shouldFilterKeywords) {
            toggleVisibility(thread, false, '', true);
            return;
        }

        const commentText = thread.textContent || '';
        const shouldHide = shouldHideContent(commentText, channelName, {
            ...settings,
            filterKeywords: commentKeywordList
        }, {
            skipKeywords: !shouldFilterKeywords,
            channelHref,
            channelMeta,
            contentTag: (thread.tagName || '').toLowerCase()
        });

        let reason = 'Comment Filter';
        if (shouldHide && hasChannelFilters && (channelMeta.handle || channelMeta.id || channelMeta.customUrl)) {
            const blockedLabel = channelMeta.handle || channelMeta.customUrl || channelMeta.id;
            if (blockedLabel) {
                reason = `Blocked comment author: ${blockedLabel}`;
            }
        }

        toggleVisibility(thread, shouldHide, reason);
    });
}

// DOM fallback function that processes already-rendered content
function applyDOMFallback(settings, options = {}) {
    const effectiveSettings = settings || currentSettings;
    if (!effectiveSettings || typeof effectiveSettings !== 'object') return;

    const supportsHasSelector = (() => {
        try {
            return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(:has(*))');
        } catch (e) {
            return false;
        }
    })();

    currentSettings = effectiveSettings;

    const { forceReprocess = false, preserveScroll = true } = options;

    // Start tracking hide/restore operations
    filteringTracker.reset();

    // Removed diagnostic logging - issue identified and fixed
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const previousScrollTop = scrollingElement ? scrollingElement.scrollTop : window.pageYOffset;
    const previousScrollLeft = scrollingElement ? scrollingElement.scrollLeft : window.pageXOffset;
    ensureStyles();
    ensureContentControlStyles(effectiveSettings);

    // Robust DOM-based passes (needed because :has() support varies across browsers and YouTube markup).
    // We run these even if :has() is supported, because they are cheap and ensure consistent behavior.
    try {
        if (effectiveSettings.hideMembersOnly) {
            const badgeNodes = document.querySelectorAll('.yt-badge-shape--membership');
            badgeNodes.forEach(badge => {
                const host = badge.closest(
                    'ytd-grid-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer, ytd-video-renderer, yt-lockup-view-model, ytd-playlist-video-renderer'
                );
                if (host) {
                    host.style.setProperty('display', 'none', 'important');
                    host.setAttribute('data-filtertube-hidden', 'true');

                    const shelf = host.closest('ytd-shelf-renderer');
                    if (shelf) {
                        shelf.style.setProperty('display', 'none', 'important');
                        shelf.setAttribute('data-filtertube-hidden', 'true');
                    }
                }
            });

            // Members-only shelf can also be represented as a named playlist section.
            const memberShelfLinks = document.querySelectorAll('a[href*="list=UUMO"], a[title="Members-only videos"]');
            memberShelfLinks.forEach(a => {
                const shelf = a.closest('ytd-shelf-renderer');
                if (shelf) {
                    shelf.style.setProperty('display', 'none', 'important');
                    shelf.setAttribute('data-filtertube-hidden', 'true');
                }
            });
        }

        if (effectiveSettings.hidePlaylistCards) {
            // Hide playlist lockups but exclude Mix/Radio (start_radio=1)
            const lockups = document.querySelectorAll('yt-lockup-view-model.yt-lockup-view-model--collection-stack-2');
            lockups.forEach(lockup => {
                const isRadio = !!lockup.querySelector('a[href*="start_radio=1"]');
                if (isRadio) return;
                const hasStack = !!lockup.querySelector('yt-collections-stack, yt-collection-thumbnail-view-model');
                if (!hasStack) return;
                const a = lockup.querySelector('a[href*="list="]');
                const href = a?.getAttribute('href') || '';
                if (!href.includes('list=')) return;
                lockup.style.setProperty('display', 'none', 'important');
                lockup.setAttribute('data-filtertube-hidden', 'true');

                const shelf = lockup.closest('ytd-shelf-renderer');
                if (shelf) {
                    shelf.style.setProperty('display', 'none', 'important');
                    shelf.setAttribute('data-filtertube-hidden', 'true');
                }
                const horiz = lockup.closest('ytd-horizontal-list-renderer');
                if (horiz) {
                    horiz.style.setProperty('display', 'none', 'important');
                    horiz.setAttribute('data-filtertube-hidden', 'true');
                }
            });
        }

        if (effectiveSettings.hideMixPlaylists) {
            // Hide the "Mixes" filter chip on Home when mixes are hidden.
            const chips = document.querySelectorAll('yt-chip-cloud-chip-renderer');
            chips.forEach(chip => {
                const txt = (chip.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (txt === 'mixes') {
                    chip.style.setProperty('display', 'none', 'important');
                    chip.setAttribute('data-filtertube-hidden', 'true');
                }
            });
        } else {
            // Restore any previously hidden Mixes chip when the toggle is off.
            const hiddenMixChips = document.querySelectorAll('yt-chip-cloud-chip-renderer[data-filtertube-hidden]');
            hiddenMixChips.forEach(chip => {
                const txt = (chip.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
                if (txt === 'mixes') {
                    chip.style.removeProperty('display');
                    chip.removeAttribute('data-filtertube-hidden');
                }
            });
        }
    } catch (e) {
    }

    if (effectiveSettings.enabled === false) {
        try {
            const contentControlStyle = document.getElementById('filtertube-content-controls-style');
            if (contentControlStyle) {
                contentControlStyle.textContent = '';
            }
            document.querySelectorAll('[data-filtertube-hidden], .filtertube-hidden').forEach(el => {
                toggleVisibility(el, false, '', true);
            });
        } catch (e) {
        }
        return;
    }

    // 1. Video/Content Filtering
    const videoElements = document.querySelectorAll(VIDEO_CARD_SELECTORS);

    if (!window.__filtertubePlaylistNavGuardInstalled) {
        window.__filtertubePlaylistNavGuardInstalled = true;
        document.addEventListener('click', (event) => {
            try {
                const target = event?.target;
                if (!(target instanceof Element)) return;
                const btn = target.closest('.ytp-next-button, .ytp-prev-button');
                if (!btn) return;

                const isWatch = (document.location?.pathname || '').startsWith('/watch');
                const params = new URLSearchParams(document.location?.search || '');
                const isPlaylistWatch = params.has('list');
                if (!isWatch || !isPlaylistWatch) return;

                const playlistPanel = document.querySelector('ytd-playlist-panel-renderer');
                if (!playlistPanel) return;
                const items = Array.from(playlistPanel.querySelectorAll('ytd-playlist-panel-video-renderer'));
                if (items.length === 0) return;

                const selected = items.find(el => el.hasAttribute('selected') || el.getAttribute('aria-selected') === 'true') || null;
                if (!selected) return;
                const idx = items.indexOf(selected);
                if (idx < 0) return;

                const state = window.__filtertubePlaylistSkipState || (window.__filtertubePlaylistSkipState = { lastAttemptTs: 0, lastSelectedVideoId: '', lastDirection: 1 });
                const direction = btn.classList.contains('ytp-prev-button') ? -1 : 1;
                state.lastDirection = direction;

                const pickNext = (start, step) => {
                    for (let i = start; i >= 0 && i < items.length; i += step) {
                        const cand = items[i];
                        if (!cand) continue;
                        const candHidden = cand.classList.contains('filtertube-hidden') || cand.hasAttribute('data-filtertube-hidden');
                        if (candHidden) continue;
                        const link = cand.querySelector('a[href*="watch?v="]');
                        if (link) return link;
                    }
                    return null;
                };

                const immediate = items[idx + direction];
                const immediateHidden = immediate && (immediate.classList.contains('filtertube-hidden') || immediate.hasAttribute('data-filtertube-hidden'));
                if (!immediateHidden) return;

                const targetLink = pickNext(idx + direction, direction);
                if (!targetLink) return;

                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();

                try {
                    const video = document.querySelector('video.html5-main-video');
                    if (video && typeof video.pause === 'function') {
                        video.pause();
                    }
                } catch (e) {
                }

                targetLink.click();
            } catch (e) {
            }
        }, true);

        if (!window.__filtertubePlaylistAutoplayGuardInstalled) {
            window.__filtertubePlaylistAutoplayGuardInstalled = true;
            document.addEventListener('ended', (event) => {
                try {
                    const target = event?.target;
                    if (!(target instanceof HTMLVideoElement)) return;

                    const isWatch = (document.location?.pathname || '').startsWith('/watch');
                    const params = new URLSearchParams(document.location?.search || '');
                    const isPlaylistWatch = params.has('list');
                    if (!isWatch || !isPlaylistWatch) return;

                    // Let YouTube handle normal autoplay, but when the immediate next playlist item
                    // is hidden, force a Next click so our click-guard can skip deterministically.
                    const playlistPanel = document.querySelector('ytd-playlist-panel-renderer');
                    if (!playlistPanel) return;
                    const items = Array.from(playlistPanel.querySelectorAll('ytd-playlist-panel-video-renderer'));
                    if (items.length === 0) return;
                    const selected = items.find(el => el.hasAttribute('selected') || el.getAttribute('aria-selected') === 'true') || null;
                    if (!selected) return;
                    const idx = items.indexOf(selected);
                    if (idx < 0) return;

                    const nextItem = items[idx + 1];
                    const nextHidden = nextItem && (nextItem.classList.contains('filtertube-hidden') || nextItem.hasAttribute('data-filtertube-hidden'));
                    if (!nextHidden) return;

                    const nextBtn = document.querySelector('.ytp-next-button');
                    if (!nextBtn) return;

                    // Defer to avoid racing YouTube's internal end-of-video transition.
                    setTimeout(() => {
                        try {
                            nextBtn.click();
                        } catch (e) {
                        }
                    }, 0);
                } catch (e) {
                }
            }, true);
        }
    }

    videoElements.forEach(element => {
        try {
            const elementTag = (element.tagName || '').toLowerCase();
            const alreadyProcessed = element.hasAttribute('data-filtertube-processed');
            const uniqueId = element.getAttribute('data-filtertube-unique-id') || extractVideoIdFromCard(element) || '';
            const lastProcessedId = element.getAttribute('data-filtertube-last-processed-id') || '';
            const contentChanged = alreadyProcessed && uniqueId && lastProcessedId && uniqueId !== lastProcessedId;

            if ((forceReprocess || contentChanged) && alreadyProcessed) {
                element.removeAttribute('data-filtertube-processed');
                element.removeAttribute('data-filtertube-last-processed-id');
                clearCachedChannelMetadata(element);
            } else if (contentChanged) {
                clearCachedChannelMetadata(element);
            }

            if (alreadyProcessed && !forceReprocess && !contentChanged) {
                // Skip already processed elements to avoid duplicate counting
                return;
            }

            // Extract Metadata
            const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, yt-formatted-string#title, span#title');
            let channelElement = null;
            if (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer') {
                channelElement = element.querySelector('#byline, #byline-container #byline');
            }
            if (!channelElement) {
                channelElement = element.querySelector(
                    '#channel-name a, ' +
                    '.ytd-channel-name a, ' +
                    'ytd-channel-name a, ' +
                    '#byline-container #byline, ' +
                    '#text, ' +
                    '.ytd-video-owner-renderer a, ' +
                    '.yt-lockup-metadata-view-model-wiz__metadata, ' +
                    '.yt-content-metadata-view-model__metadata-text, ' +
                    'yt-formatted-string[slot="subtitle"], ' +
                    '.watch-card-tertiary-text a'
                );
            }
            const channelSubtitleElement = element.querySelector('#watch-card-subtitle, #watch-card-subtitle yt-formatted-string');
            const channelAnchor = (channelElement || channelSubtitleElement)?.closest('a') || element.querySelector('a[href*="/channel"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"]');

            let title = titleElement?.textContent?.trim() || '';
            if (!title) {
                const ownAriaLabel = element.getAttribute('aria-label');
                if (ownAriaLabel) {
                    title = ownAriaLabel.trim();
                }
            }
            if (!title) {
                const labelledById = element.getAttribute('aria-labelledby');
                if (labelledById) {
                    const labelSource = document.getElementById(labelledById.trim());
                    if (labelSource?.textContent) {
                        title = labelSource.textContent.trim();
                    }
                }
            }
            if (!title) {
                const titledAnchor = element.querySelector('a[title]');
                if (titledAnchor?.getAttribute) {
                    const anchorTitle = titledAnchor.getAttribute('title');
                    if (anchorTitle) {
                        title = anchorTitle.trim();
                    }
                }
            }
            const channelPrimaryText = channelElement?.textContent?.trim() || '';
            const channelSubtitleText = channelSubtitleElement?.textContent?.trim() || '';
            let channel = [channelPrimaryText, channelSubtitleText].filter(Boolean).join(' | ');
            if (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer') {
                const compact = channelPrimaryText
                    .split('\n')[0]
                    .split('•')[0]
                    .trim();
                channel = compact;
            }
            const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
            const relatedElements = [channelAnchor, channelElement, channelSubtitleElement];
            let channelMeta = extractChannelMetadataFromElement(element, channel, channelHref, {
                cacheTarget: channelAnchor || element,
                relatedElements
            });
            const collaboratorMetas = extractCollaboratorMetadataFromElement(element);

            // If channel identity is missing, try videoChannelMap lookup (Shorts + playlist panels + other DOM-heavy cards).
            const isPlaylistPanelRow = (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer');
            const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id || channelMeta.customUrl);
            let mappedChannelId = '';
            if (!hasChannelIdentity && effectiveSettings.videoChannelMap) {
                const videoId = element.getAttribute('data-filtertube-video-id') || extractVideoIdFromCard(element);
                if (videoId && effectiveSettings.videoChannelMap[videoId]) {
                    mappedChannelId = effectiveSettings.videoChannelMap[videoId];
                    channelMeta = { ...channelMeta, id: mappedChannelId };
                }
            }

            // Determine Visibility
            const shortThumbnailAnchor = element.querySelector('#thumbnail[href^="/shorts"], #video-title[href^="/shorts"], a[href^="/shorts/"]');
            const shortOverlay = element.querySelector('ytd-thumbnail-overlay-time-status-renderer[overlay-style="SHORTS"], badge-shape[aria-label="Shorts"]');
            const shortBadgeText = element.querySelector('.yt-badge-shape__text')?.textContent?.trim()?.toLowerCase() || '';
            const shortBadgeDetected = shortBadgeText.includes('short');

            const isShortVideoRenderer = elementTag === 'ytd-video-renderer' && (
                element.hasAttribute('is-shorts-video') ||
                Boolean(shortThumbnailAnchor) ||
                Boolean(shortOverlay) ||
                shortBadgeDetected
            );

            if (isShortVideoRenderer) {
                element.setAttribute('data-filtertube-short', 'true');
            } else {
                element.removeAttribute('data-filtertube-short');
            }

            const skipKeywordFiltering = CHANNEL_ONLY_TAGS.has(elementTag);
            const matchesFilters = shouldHideContent(title, channel, effectiveSettings, {
                skipKeywords: skipKeywordFiltering,
                channelHref,
                channelMeta,
                collaborators: collaboratorMetas,
                contentTag: elementTag
            });

            // Handle Container Logic (e.g., rich-grid-media inside rich-item)
            let targetToHide = element;
            if (elementTag === 'ytd-rich-grid-media') {
                const parent = element.closest('ytd-rich-item-renderer');
                if (parent) targetToHide = parent;
            } else if (elementTag === 'yt-lockup-view-model' || elementTag === 'yt-lockup-metadata-view-model') {
                const parent = element.closest('ytd-rich-item-renderer');
                if (parent) targetToHide = parent;
            } else if (elementTag === 'ytd-playlist-panel-video-renderer') {
                const wrapper = element.closest('ytd-playlist-panel-video-wrapper-renderer');
                if (wrapper) targetToHide = wrapper;
            }

            let hideReason = `Content: ${title}`;
            let shouldHide = matchesFilters;

            // Sticky-hide for watch-playlist panel rows:
            // If a row was already hidden, and we can't currently resolve identity, do NOT restore it.
            // This prevents temporarily restored-but-blocked items from becoming playable during enrichment.
            if (isPlaylistPanelRow) {
                const wasHidden = targetToHide.classList.contains('filtertube-hidden') || targetToHide.hasAttribute('data-filtertube-hidden');
                const identityResolvedNow = Boolean(hasChannelIdentity || mappedChannelId);
                if (wasHidden && !identityResolvedNow && !shouldHide) {
                    shouldHide = true;
                    hideReason = hideReason || 'Playlist row (pending identity)';
                }
            }

            if (isShortVideoRenderer) {
                const hideByGlobalShorts = Boolean(effectiveSettings.hideAllShorts);

                if (hideByGlobalShorts) {
                    shouldHide = true;
                    hideReason = 'Shorts hidden globally';
                    targetToHide.setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true');
                    targetToHide.removeAttribute('data-filtertube-hidden-by-keyword');
                } else {
                    targetToHide.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');

                    if (matchesFilters) {
                        targetToHide.setAttribute('data-filtertube-hidden-by-keyword', 'true');
                    } else {
                        targetToHide.removeAttribute('data-filtertube-hidden-by-keyword');
                    }
                }
            }

            toggleVisibility(targetToHide, shouldHide, hideReason);
            element.setAttribute('data-filtertube-processed', 'true');
            if (uniqueId) {
                element.setAttribute('data-filtertube-last-processed-id', uniqueId);
            } else {
                element.removeAttribute('data-filtertube-last-processed-id');
            }
        } catch (e) {
        }
    });

    // Inline survey containers embed filtered videos; hide shell when everything inside is hidden
    document.querySelectorAll('ytd-inline-survey-renderer').forEach(survey => {
        const embeddedItems = survey.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer');
        if (embeddedItems.length === 0) return;

        const hasVisibleItem = Array.from(embeddedItems).some(item =>
            !(item.classList.contains('filtertube-hidden') || item.hasAttribute('data-filtertube-hidden'))
        );

        const shouldHideSurvey = !hasVisibleItem;
        // SKIP STATS: This is just a wrapper/container cleanup
        toggleVisibility(survey, shouldHideSurvey, 'Inline Survey Shell', true);

        const sectionContainer = survey.closest('ytd-rich-section-renderer');
        if (sectionContainer) {
            // SKIP STATS: Wrapper cleanup
            toggleVisibility(sectionContainer, shouldHideSurvey, 'Inline Survey Section', true);
        }
    });

    // 2. Chip Filtering (Home/Search chip bars)
    document.querySelectorAll('yt-chip-cloud-chip-renderer').forEach(chip => {
        const label = chip.textContent?.trim() || '';
        const hideChip = shouldHideContent(label, '', effectiveSettings);
        toggleVisibility(chip, hideChip, `Chip: ${label}`);
    });

    // Hide any rich items that ended up empty after filtering to avoid blank cards
    document.querySelectorAll('ytd-rich-item-renderer').forEach(item => {
        const contentEl = item.querySelector('#content');
        if (!contentEl) return;
        const hasVisibleChild = Array.from(contentEl.children).some(child => child.offsetParent !== null);
        if (!hasVisibleChild && !item.hasAttribute('data-filtertube-hidden')) {
            // SKIP STATS: This is container cleanup, not actual content filtering
            // The actual video inside was already counted when it was hidden
            toggleVisibility(item, true, 'Empty Rich Item', true);
        }
    });

    // 3. Shorts Filtering
    const shortsContainerSelectors = 'grid-shelf-view-model, ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer';
    const shortContainers = document.querySelectorAll(shortsContainerSelectors);

    // Also target the Shorts guide entry in the sidebar
    const shortsGuideEntries = document.querySelectorAll('ytd-guide-entry-renderer a[title="Shorts"]');
    const shortsGuideRenderers = Array.from(shortsGuideEntries).map(a => a.closest('ytd-guide-entry-renderer')).filter(Boolean);

    const allShortsElements = [...shortContainers, ...shortsGuideRenderers];

    if (effectiveSettings.hideAllShorts) {
        allShortsElements.forEach(container => {
            container.setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true');
            // SKIP STATS: Container hiding - individual shorts inside are counted separately
            toggleVisibility(container, true, 'Hide Shorts container', true);
        });
    } else {
        allShortsElements.forEach(container => {
            if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) {
                container.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                // Only unhide if it's not also hidden by a shelf title
                if (!container.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
                    // SKIP STATS: Container unhiding
                    toggleVisibility(container, false, '', true);
                }
            }
        });
    }

    const shortsSelectors = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2';

    // Helper: robustly extract Shorts videoId from multiple attribute patterns
    function extractShortsVideoId(node) {
        if (!node) return null;

        // 1) Direct data attributes commonly used in yt-lockup
        const directAttrs = ['data-video-id', 'video-id', 'data-videoid'];
        for (const attr of directAttrs) {
            const val = node.getAttribute(attr);
            if (val && /^[a-zA-Z0-9_-]{11}$/.test(val)) return val;
        }

        // 2) Anchors with shorts links
        const linkSelectors = [
            'a[href*="/shorts/"]',
            'a[href^="/shorts/"]',
            'a[href*="shorts/"]'
        ];
        for (const sel of linkSelectors) {
            const link = node.querySelector(sel);
            const href = link?.getAttribute('href') || link?.href || '';
            if (href) {
                const m = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                if (m && m[1]) return m[1];
            }
        }

        // 3) Any attribute value containing a shorts URL
        for (const attr of node.getAttributeNames ? node.getAttributeNames() : []) {
            const val = node.getAttribute(attr) || '';
            if (typeof val === 'string') {
                const m = val.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                if (m && m[1]) return m[1];
            }
        }

        // 4) Fallback: search child anchors generically
        const anyLink = node.querySelector('a[href]');
        const href = anyLink?.getAttribute('href') || anyLink?.href || '';
        const m = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (m && m[1]) return m[1];

        return null;
    }

    document.querySelectorAll(shortsSelectors).forEach(element => {
        let target = element;
        // 1. Check for Desktop container (ytd-rich-item-renderer)
        const richItemParent = element.closest('ytd-rich-item-renderer');
        if (richItemParent) {
            target = richItemParent;
        }
        // 2. Check for Grid Shelf container (The specific issue you found)
        // This div holds the width/margin styles, so we MUST hide this to collapse the gap
        else {
            const gridShelfItem = element.closest('.ytGridShelfViewModelGridShelfItem');
            if (gridShelfItem) {
                target = gridShelfItem;
            }
        }

        let title = '';
        const titleSelectors = [
            '#video-title',
            '.shortsLockupViewModelHostMetadataTitle',
            '.shortsLockupViewModelHostOutsideMetadataTitle',
            'a[title]',
            'h3',
            'yt-formatted-string[role="text"]',
            'span[role="text"]'
        ];

        for (const selector of titleSelectors) {
            const node = element.querySelector(selector);
            const text = node?.textContent?.trim();
            if (text) {
                title = text;
                break;
            }
        }

        if (!title) {
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) title = ariaLabel.trim();
        }

        // Check if this element was blocked via 3-dot menu (has blocked channel attributes)
        const blockedChannelId = target.getAttribute('data-filtertube-blocked-channel-id');
        const blockedChannelHandle = target.getAttribute('data-filtertube-blocked-channel-handle');
        const blockedChannelCustom = target.getAttribute('data-filtertube-blocked-channel-custom');
        const blockedChannelState = target.getAttribute('data-filtertube-blocked-state');
        const blockedTimestamp = parseInt(target.getAttribute('data-filtertube-blocked-ts') || '0', 10);
        const blockAgeMs = blockedTimestamp ? Date.now() - blockedTimestamp : Number.POSITIVE_INFINITY;

        // If this card was blocked via 3-dot UI, honour pending/confirmed states
        if (blockedChannelId || blockedChannelHandle || blockedChannelCustom) {
            const isStillBlocked = effectiveSettings.filterChannels?.some(fc => {
                if (typeof fc === 'object') {
                    return (blockedChannelId && fc.id?.toLowerCase() === blockedChannelId.toLowerCase()) ||
                        (blockedChannelHandle && fc.handle?.toLowerCase() === blockedChannelHandle.toLowerCase()) ||
                        (blockedChannelCustom && fc.customUrl?.toLowerCase() === blockedChannelCustom.toLowerCase());
                }
                const normalized = (fc || '').toLowerCase();
                return normalized === blockedChannelId?.toLowerCase() ||
                    normalized === blockedChannelHandle?.toLowerCase() ||
                    normalized === blockedChannelCustom?.toLowerCase();
            });

            if (isStillBlocked) {
                // Keep it hidden - mark as confirmed so future passes don't treat it as pending
                markElementAsBlocked(target, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle,
                    customUrl: blockedChannelCustom
                }, 'confirmed');
                toggleVisibility(target, true, `Blocked channel: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                return; // Skip further processing for this element
            } else {
                // If blocklist no longer contains this channel but the state is still pending,
                // keep it hidden for a short grace period to avoid flicker while background saves
                const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 2000;
                if (waitForConfirmation) {
                    toggleVisibility(target, true, `Pending channel block: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                    return;
                }

                // Channel was unblocked, remove the attributes and let normal filtering proceed
                clearBlockedElementAttributes(target);
                // Also clear it on the card itself if the target was a container
                if (target !== element) {
                    clearBlockedElementAttributes(element);
                }

                // Immediately restore visibility so layout snaps back before keyword logic reruns
                toggleVisibility(target, false, '', true);
            }
        }

        const channelAnchor = element.querySelector('a[href*="/channel"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"]');
        const channelText = channelAnchor?.textContent?.trim() || '';
        const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
        let channelMeta = extractChannelMetadataFromElement(element, channelText, channelHref, {
            cacheTarget: channelAnchor || element
        });

        // For Shorts without channel identity, try videoChannelMap lookup
        const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id || channelMeta.customUrl);
        if (!hasChannelIdentity && effectiveSettings.videoChannelMap) {
            // Extract videoId from Shorts card (support lockup/home/search variants)
            const videoId = extractShortsVideoId(element);

            if (videoId && effectiveSettings.videoChannelMap[videoId]) {
                // Found channel ID from videoChannelMap
                channelMeta = { ...channelMeta, id: effectiveSettings.videoChannelMap[videoId] };
            }
        }

        const hideByKeywords = shouldHideContent(title, channelText, effectiveSettings, {
            channelHref,
            channelMeta
        });

        if (hideByKeywords) {
            target.setAttribute('data-filtertube-hidden-by-keyword', 'true');
        } else if (!effectiveSettings.hideAllShorts) {
            target.removeAttribute('data-filtertube-hidden-by-keyword');
        }

        const shouldHideShort = effectiveSettings.hideAllShorts || hideByKeywords;
        const reason = effectiveSettings.hideAllShorts ? 'Hide All Shorts' : `Short: ${title || channelText}`;
        toggleVisibility(target, shouldHideShort, reason);
    });

    // 4. Comments Filtering
    handleCommentsFallback(effectiveSettings);

    // 5. Container Cleanup (Shelves, Grids)
    // Hide shelves if all their items are hidden
    const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-item-section-renderer, grid-shelf-view-model, yt-section-header-view-model');
    shelves.forEach(shelf => {
        const shelfTitle = extractShelfTitle(shelf);
        const shelfTitleMatches = shelfTitle && shouldHideContent(shelfTitle, '', effectiveSettings);

        if (shelfTitleMatches) {
            shelf.setAttribute('data-filtertube-hidden-by-shelf-title', 'true');
            toggleVisibility(shelf, true, `Shelf title: ${shelfTitle}`);
            return;
        }

        if (shelf.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
            shelf.removeAttribute('data-filtertube-hidden-by-shelf-title');
            toggleVisibility(shelf, false);
        }

        updateContainerVisibility(shelf, 'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, .ytGridShelfViewModelGridShelfItem');
    });

    if (preserveScroll && scrollingElement) {
        if (typeof scrollingElement.scrollTo === 'function') {
            scrollingElement.scrollTo({ top: previousScrollTop, left: previousScrollLeft, behavior: 'instant' });
        } else {
            window.scrollTo(previousScrollLeft, previousScrollTop);
        }
    }

    // Log hide/restore summary
    filteringTracker.logSummary();

    try {
        if (!window.__filtertubePlaylistSkipState) {
            window.__filtertubePlaylistSkipState = { lastAttemptTs: 0, lastSelectedVideoId: '', lastDirection: 1 };
        }
        const state = window.__filtertubePlaylistSkipState;
        const now = Date.now();
        if (now - (state.lastAttemptTs || 0) > 80) {
            const isWatch = (document.location?.pathname || '').startsWith('/watch');
            const params = new URLSearchParams(document.location?.search || '');
            const isPlaylistWatch = params.has('list');
            const playlistPanel = document.querySelector('ytd-playlist-panel-renderer');
            if (isWatch && isPlaylistWatch && playlistPanel) {
                const items = Array.from(playlistPanel.querySelectorAll('ytd-playlist-panel-video-renderer'));
                if (items.length > 0) {
                    const selected = items.find(el => el.hasAttribute('selected') || el.getAttribute('aria-selected') === 'true') || null;
                    const isHidden = selected && (selected.classList.contains('filtertube-hidden') || selected.hasAttribute('data-filtertube-hidden'));
                    if (selected && isHidden) {
                        const selectedHref = selected.querySelector('a[href*="watch?v="]')?.getAttribute('href') || '';
                        const selectedVid = (selectedHref.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || [])[1] || '';
                        if (!selectedVid || state.lastSelectedVideoId !== selectedVid) {
                            const idx = items.indexOf(selected);
                            const pickNext = (start, step) => {
                                for (let i = start; i >= 0 && i < items.length; i += step) {
                                    const cand = items[i];
                                    if (!cand) continue;
                                    const candHidden = cand.classList.contains('filtertube-hidden') || cand.hasAttribute('data-filtertube-hidden');
                                    if (candHidden) continue;
                                    const link = cand.querySelector('a[href*="watch?v="]');
                                    if (link) return link;
                                }
                                return null;
                            };

                            const direction = state.lastDirection === -1 ? -1 : 1;
                            const preferred = pickNext(idx + direction, direction);
                            const fallback = preferred ? null : pickNext(idx - direction, -direction);
                            const target = preferred || fallback;
                            if (target) {
                                try {
                                    const video = document.querySelector('video.html5-main-video');
                                    if (video && typeof video.pause === 'function') {
                                        video.pause();
                                        if (typeof video.currentTime === 'number') {
                                            video.currentTime = 0;
                                        }
                                    }
                                } catch (e) {
                                }
                                state.lastAttemptTs = now;
                                state.lastSelectedVideoId = selectedVid;
                                target.click();
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        // ignore
    }
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings, options = {}) {
    if (!title && !channel) return false;

    const {
        skipKeywords = false,
        channelHref = '',
        channelMeta: providedChannelMeta = null,
        collaborators = [],
        contentTag = ''
    } = options;
    const channelMeta = providedChannelMeta || buildChannelMetadata(channel, channelHref);
    const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id || channelMeta.customUrl);

    // Debug logging (disabled by default - set to true for troubleshooting)
    const debugFiltering = false;
    if (debugFiltering && (channelMeta.handle || channelMeta.id)) {
        console.log(`FilterTube DEBUG: Checking "${title.substring(0, 50)}..."`, {
            channelHandle: channelMeta.handle,
            channelId: channelMeta.id,
            hasFilters: settings.filterChannels?.length || 0,
            filterChannelsArray: settings.filterChannels,
            keywords: settings.filterKeywords?.length || 0
        });
    }

    // Keyword filtering
    if (!skipKeywords && settings.filterKeywords && settings.filterKeywords.length > 0) {
        for (const keywordData of settings.filterKeywords) {
            let regex;
            try {
                if (keywordData instanceof RegExp) {
                    regex = keywordData;
                } else if (keywordData.pattern) {
                    regex = new RegExp(keywordData.pattern, keywordData.flags);
                } else {
                    regex = new RegExp(keywordData.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                }
            } catch (error) {
                // debugLog('⚠️ Invalid keyword regex:', error);
                continue;
            }

            if (matchesKeyword(regex, title) || matchesKeyword(regex, channel)) {
                return true;
            }
        }
    }

    if (settings.filterChannels && settings.filterChannels.length > 0 && !hasChannelIdentity && (!collaborators || collaborators.length === 0)) {
        const normalizedChannelName = (value) => {
            if (!value || typeof value !== 'string') return '';
            return value.trim().toLowerCase().replace(/\s+/g, ' ');
        };

        const tag = (contentTag || '').toLowerCase();
        const isPlaylistPanelItem = tag === 'ytd-playlist-panel-video-renderer' || tag === 'ytd-playlist-panel-video-wrapper-renderer';
        if (isPlaylistPanelItem) {
            const candidate = normalizedChannelName(channel);
            if (candidate) {
                for (const filterChannel of settings.filterChannels) {
                    if (!filterChannel || typeof filterChannel !== 'object') continue;
                    const blockedName = normalizedChannelName(filterChannel.name || filterChannel.handleDisplay || '');
                    if (!blockedName) continue;
                    if (candidate === blockedName) {
                        return true;
                    }
                }
            }
        }
    }

    // Channel filtering
    if (settings.filterChannels && settings.filterChannels.length > 0 && (hasChannelIdentity || collaborators.length > 0)) {
        const channelMap = settings.channelMap || {};

        const collaboratorMetas = Array.isArray(collaborators) ? collaborators : [];

        // 1. Normal Check (Fast path - direct match or existing channelMap lookup)
        for (const filterChannel of settings.filterChannels) {
            if (hasChannelIdentity && channelMatchesFilter(channelMeta, filterChannel, channelMap)) {
                if (debugFiltering) {
                    console.log(`FilterTube DEBUG: MATCH FOUND! Video will be hidden.`, {
                        title: title.substring(0, 50),
                        videoChannel: channelMeta,
                        matchedFilter: filterChannel
                    });
                }
                return true;
            }

            if (collaboratorMetas.length > 0) {
                const collaboratorMatched = collaboratorMetas.some(collaborator => channelMatchesFilter(collaborator, filterChannel, channelMap));
                if (collaboratorMatched) {
                    if (debugFiltering) {
                        console.log(`FilterTube DEBUG: Collaborator match found. Video will be hidden.`, {
                            title: title.substring(0, 50),
                            collaborators: collaboratorMetas,
                            matchedFilter: filterChannel
                        });
                    }
                    return true;
                }
            }
        }

        // 2. Active Resolution (Safety net for missing mappings)
        // This runs when the blocklist has a Handle (e.g. @shakira) 
        // but the content on screen only shows a UC ID (UC...)
        if (channelMeta.id && !channelMeta.handle) {
            const contentId = channelMeta.id.toLowerCase();

            // Iterate through our blocked channels to see if we need to fetch any IDs
            for (const filterChannel of settings.filterChannels) {
                let filterHandle = null;

                // Extract handle from filter object/string
                if (typeof filterChannel === 'string' && filterChannel.startsWith('@')) {
                    filterHandle = filterChannel.toLowerCase();
                } else if (filterChannel && filterChannel.handle) {
                    filterHandle = filterChannel.handle.toLowerCase();
                }

                if (filterHandle) {
                    const handleKey = filterHandle.replace('@', ''); // "shakira"

                    // Check if we ALREADY know the ID for this blocked handle
                    // Try both format keys for safety
                    const knownId = channelMap[`@${handleKey}`] || channelMap[handleKey];

                    if (knownId) {
                        // If we have a map, 'channelMatchesFilter' (Step 1) would have caught it 
                        // if it matched. Since it didn't, this filter doesn't match this content.
                        continue;
                    }

                    // We DON'T know the ID for this blocked handle. 
                    // We must fetch it to see if it matches the current content ID.
                    const cachedState = resolvedHandleCache.get(handleKey);

                    if (!cachedState) {
                        // Not known, not fetching. Start async fetch now.
                        fetchIdForHandle(filterHandle);
                    } else if (cachedState !== 'PENDING') {
                        // We just resolved it in memory! Check if it matches.
                        if (cachedState.toLowerCase() === contentId) {
                            return true; // Match found via active resolution
                        }
                    }
                }
            }
        }
    }

    return false;
}
