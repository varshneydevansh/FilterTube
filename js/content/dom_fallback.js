// js/content/dom_fallback.js - Isolated World
//
// DOM fallback filtering pipeline used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

const CHANNEL_ONLY_TAGS = new Set([
    'ytd-universal-watch-card-renderer',
    'ytm-universal-watch-card-renderer'
]);

const compiledKeywordRegexCache = new WeakMap();
const compiledChannelFilterIndexCache = new WeakMap();
const compiledChannelFilterIndexCacheByList = new WeakMap();

function normalizeUcIdForComparison(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/(UC[\w-]{22})/i);
    return match ? match[1].toLowerCase() : '';
}

function normalizeChannelNameForComparison(value) {
    if (!value || typeof value !== 'string') return '';
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeCustomUrlForComparison(value) {
    if (!value || typeof value !== 'string') return '';
    let cleaned = value.trim();
    if (!cleaned) return '';
    try {
        cleaned = decodeURIComponent(cleaned);
    } catch (e) {
    }
    cleaned = cleaned.split(/[?#]/)[0];
    cleaned = cleaned.replace(/^https?:\/\/[^/]+/i, '');
    cleaned = cleaned.replace(/^\//, '');
    cleaned = cleaned.replace(/\/$/, '');
    cleaned = cleaned.toLowerCase();
    if (cleaned.startsWith('c/')) return cleaned;
    if (cleaned.startsWith('user/')) return cleaned;
    if (cleaned.includes('/c/')) {
        const parts = cleaned.split('/c/');
        if (parts[1]) return `c/${parts[1].split('/')[0]}`;
    }
    if (cleaned.includes('/user/')) {
        const parts = cleaned.split('/user/');
        if (parts[1]) return `user/${parts[1].split('/')[0]}`;
    }
    return '';
}

function normalizeHandleForComparison(value) {
    try {
        const fn = window.FilterTubeIdentity?.normalizeHandleForComparison;
        if (typeof fn === 'function') {
            return fn(value) || '';
        }
    } catch (e) {
    }
    if (!value || typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    const raw = trimmed.startsWith('@') ? trimmed : (trimmed.includes('@') ? trimmed.substring(trimmed.indexOf('@')) : '');
    if (!raw) return '';
    const handle = raw.split(/[\s/?#]/)[0].replace(/^@+/, '');
    return handle ? `@${handle.toLowerCase()}` : '';
}

function getCompiledKeywordRegexes(rawList) {
    if (!Array.isArray(rawList) || rawList.length === 0) return [];

    const cached = compiledKeywordRegexCache.get(rawList);
    if (cached) return cached;

    const compiled = [];
    for (const keywordData of rawList) {
        try {
            if (keywordData instanceof RegExp) {
                compiled.push(keywordData);
                continue;
            }
            if (keywordData && keywordData.pattern) {
                compiled.push(new RegExp(keywordData.pattern, keywordData.flags || 'i'));
                continue;
            }
            if (typeof keywordData === 'string' && keywordData.trim()) {
                const escaped = keywordData.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                compiled.push(new RegExp(escaped, 'i'));
            }
        } catch (e) {
            // ignore invalid
        }
    }

    compiledKeywordRegexCache.set(rawList, compiled);
    return compiled;
}

function getChannelMapLookup(channelMap) {
    return (key) => {
        try {
            if (!channelMap || typeof channelMap !== 'object') return '';
            if (!key || typeof key !== 'string') return '';
            const normalized = key.toLowerCase();
            return channelMap[normalized] || channelMap[normalized.replace(/^@/, '')] || '';
        } catch (e) {
            return '';
        }
    };
}

function getCompiledChannelFilterIndex(settings, listOverride = null) {
    if (!settings || typeof settings !== 'object') return null;
    const list = Array.isArray(listOverride) ? listOverride : settings.filterChannels;
    if (!Array.isArray(list) || list.length === 0) return null;

    const channelMap = settings.channelMap || {};
    const existing = listOverride
        ? compiledChannelFilterIndexCacheByList.get(list)
        : compiledChannelFilterIndexCache.get(settings);
    if (existing && existing.sourceList === list && existing.sourceChannelMap === channelMap) {
        return existing;
    }

    const lookupChannelMap = getChannelMapLookup(channelMap);

    const ids = new Set();
    const handles = new Set();
    const customUrls = new Set();
    const names = new Set();
    const unresolvedHandleKeys = [];
    const unresolvedHandleKeysSeen = new Set();

    const addId = (candidate) => {
        const id = normalizeUcIdForComparison(typeof candidate === 'string' ? candidate : '');
        if (id) ids.add(id);
    };
    const addHandle = (candidate) => {
        const h = normalizeHandleForComparison(typeof candidate === 'string' ? candidate : '');
        if (!h) return;
        handles.add(h);
        const withoutAt = h.replace(/^@/, '');
        const normalizedWithoutAt = normalizeChannelNameForComparison(withoutAt);
        if (normalizedWithoutAt) {
            names.add(normalizedWithoutAt);
        }
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(h));
        if (mappedId) ids.add(mappedId);

        const key = h.replace(/^@/, '');
        if (key && !lookupChannelMap(h) && !unresolvedHandleKeysSeen.has(key)) {
            unresolvedHandleKeysSeen.add(key);
            unresolvedHandleKeys.push(key);
        }
    };
    const addCustomUrl = (candidate) => {
        const custom = normalizeCustomUrlForComparison(typeof candidate === 'string' ? candidate : '');
        if (!custom) return;
        customUrls.add(custom);
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(custom));
        if (mappedId) ids.add(mappedId);
    };
    const addName = (candidate) => {
        const name = normalizeChannelNameForComparison(typeof candidate === 'string' ? candidate : '');
        if (!name) return;
        names.add(name);
    };

    for (const entry of list) {
        if (!entry) continue;

        if (typeof entry === 'string') {
            const s = entry.trim();
            if (!s) continue;
            addId(s);
            addHandle(s);
            addCustomUrl(s);
            addName(s);
            continue;
        }

        if (typeof entry === 'object') {
            addId(entry.id);
            addId(entry.originalInput);

            addHandle(entry.handle);
            addHandle(entry.canonicalHandle);
            addHandle(entry.handleDisplay);
            addHandle(entry.originalInput);

            addCustomUrl(entry.customUrl);
            addCustomUrl(entry.originalInput);

            addName(entry.name);
            addName(entry.handle);
            addName(entry.originalInput);

            const idKey = normalizeUcIdForComparison(entry.id || '');
            if (idKey) {
                const mappedHandle = normalizeHandleForComparison(lookupChannelMap(idKey));
                if (mappedHandle) handles.add(mappedHandle);
            }
        }
    }

    const index = {
        sourceList: list,
        sourceChannelMap: channelMap,
        ids,
        handles,
        customUrls,
        names,
        unresolvedHandleKeys
    };

    if (listOverride) {
        compiledChannelFilterIndexCacheByList.set(list, index);
    } else {
        compiledChannelFilterIndexCache.set(settings, index);
    }
    return index;
}

function channelMetaMatchesIndex(meta, index, channelMap) {
    if (!meta || !index) return false;
    const lookupChannelMap = getChannelMapLookup(channelMap || {});

    const metaId = normalizeUcIdForComparison(meta.id || '');
    if (metaId && index.ids.has(metaId)) return true;

    const metaHandle = normalizeHandleForComparison(meta.handle || meta.canonicalHandle || meta.handleDisplay || '');
    if (metaHandle && index.handles.has(metaHandle)) return true;

    const metaCustomUrl = normalizeCustomUrlForComparison(meta.customUrl || '');
    if (metaCustomUrl && index.customUrls.has(metaCustomUrl)) return true;

    const metaName = normalizeChannelNameForComparison(meta.name || '');
    if (metaName && index.names.has(metaName)) return true;

    if (metaHandle) {
        const withoutAt = metaHandle.replace(/^@/, '');
        if (withoutAt && index.names.has(withoutAt)) return true;
    }

    if (metaId) {
        const mappedHandle = normalizeHandleForComparison(lookupChannelMap(metaId));
        if (mappedHandle && index.handles.has(mappedHandle)) return true;
    }
    if (metaHandle) {
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(metaHandle));
        if (mappedId && index.ids.has(mappedId)) return true;
    }
    if (metaCustomUrl) {
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(metaCustomUrl));
        if (mappedId && index.ids.has(mappedId)) return true;
    }

    return false;
}

function markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom) {
    if (!settings || typeof settings !== 'object') return false;
    if (!Array.isArray(settings.filterChannels) || settings.filterChannels.length === 0) return false;

    const index = getCompiledChannelFilterIndex(settings);
    if (!index) return false;

    const channelMap = settings.channelMap || {};
    const lookupChannelMap = getChannelMapLookup(channelMap);

    const id = normalizeUcIdForComparison(blockedChannelId || '');
    if (id && index.ids.has(id)) return true;

    const handle = normalizeHandleForComparison(blockedChannelHandle || '');
    if (handle && index.handles.has(handle)) return true;

    const customUrl = normalizeCustomUrlForComparison(blockedChannelCustom || '');
    if (customUrl && index.customUrls.has(customUrl)) return true;

    if (handle) {
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(handle));
        if (mappedId && index.ids.has(mappedId)) return true;
    }
    if (customUrl) {
        const mappedId = normalizeUcIdForComparison(lookupChannelMap(customUrl));
        if (mappedId && index.ids.has(mappedId)) return true;
    }

    return false;
}

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
            /* Feed and shelf cards with Members-only badge or aria label */
            ytd-grid-video-renderer:has(.yt-badge-shape--membership),
            ytd-grid-video-renderer:has([aria-label*="Members only"]),
            ytd-grid-video-renderer:has([aria-label*="Member-only"]),
            ytd-rich-grid-media:has(.yt-badge-shape--membership),
            ytd-rich-grid-media:has([aria-label*="Members only"]),
            ytd-rich-grid-media:has([aria-label*="Member-only"]),
            yt-lockup-view-model:has(.yt-badge-shape--membership),
            yt-lockup-view-model:has([aria-label*="Members only"]),
            yt-lockup-view-model:has([aria-label*="Member-only"]),
            ytd-rich-item-renderer:has(.yt-badge-shape--membership),
            ytd-rich-item-renderer:has([aria-label*="Members only"]),
            ytd-rich-item-renderer:has([aria-label*="Member-only"]),
            ytd-video-renderer:has(.yt-badge-shape--membership),
            ytd-video-renderer:has([aria-label*="Members only"]),
            ytd-video-renderer:has([aria-label*="Member-only"]),
            ytd-compact-video-renderer:has(.yt-badge-shape--membership),
            ytd-compact-video-renderer:has([aria-label*="Members only"]),
            ytd-compact-video-renderer:has([aria-label*="Member-only"]),
            ytd-playlist-video-renderer:has(.yt-badge-shape--membership),
            ytd-playlist-video-renderer:has([aria-label*="Members only"]),
            ytd-playlist-video-renderer:has([aria-label*="Member-only"]),
            /* Metadata block fallback */
            ytd-video-meta-block:has([aria-label*="Members only"]),
            ytd-video-meta-block:has([aria-label*="Member-only"]),
            /* Watch page containers with Members-only badge */
            ytd-watch-flexy:has(.yt-badge-shape--membership),
            ytd-watch-metadata:has(.yt-badge-shape--membership),
            ytd-video-primary-info-renderer:has(.yt-badge-shape--membership),
            /* Members-only shelves/playlists */
            ytd-shelf-renderer:has(.yt-badge-shape--membership),
            ytd-shelf-renderer:has([aria-label*="Members only"]),
            ytd-shelf-renderer:has([aria-label*="Member-only"]),
            ytd-shelf-renderer:has(a[href*="list=UUMO"]),
            ytd-playlist-video-renderer:has(a[href*="list=UUMO"]) {
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

    try {
        const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
        if (listMode === 'whitelist') {
            commentContainers.forEach(container => {
                toggleVisibility(container, false, '', true);
            });

            const composer = document.querySelector('#simple-box, ytd-comment-simplebox-renderer');
            if (composer) {
                toggleVisibility(composer, false, '', true);
            }

            commentThreads.forEach(thread => {
                toggleVisibility(thread, true, 'Whitelist Comments', true);
            });
            return;
        }
    } catch (e) {
    }

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
        const channelMeta = (typeof extractChannelMetadataFromElement === 'function')
            ? extractChannelMetadataFromElement(thread, channelName, channelHref, {
                cacheTarget: authorAnchor || thread,
                relatedElements: [authorAnchor].filter(Boolean)
            })
            : buildChannelMetadata(channelName, channelHref);

        // Honour pending/confirmed hides from the 3-dot UI, even if keyword filtering is off.
        const blockedChannelId = thread.getAttribute('data-filtertube-blocked-channel-id') || '';
        const blockedChannelHandle = thread.getAttribute('data-filtertube-blocked-channel-handle') || '';
        const blockedChannelCustom = thread.getAttribute('data-filtertube-blocked-channel-custom') || '';
        const blockedChannelState = thread.getAttribute('data-filtertube-blocked-state') || '';
        const blockedTimestamp = parseInt(thread.getAttribute('data-filtertube-blocked-ts') || '0', 10);
        const blockAgeMs = blockedTimestamp ? Date.now() - blockedTimestamp : Number.POSITIVE_INFINITY;

        if (blockedChannelId || blockedChannelHandle || blockedChannelCustom) {
            const isStillBlocked = hasChannelFilters && markedChannelIsStillBlocked(settings, blockedChannelId, blockedChannelHandle, blockedChannelCustom);

            if (isStillBlocked) {
                markElementAsBlocked(thread, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle,
                    customUrl: blockedChannelCustom
                }, 'confirmed');
                toggleVisibility(thread, true, `Blocked comment author: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                return;
            }

            const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 8000;
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

function handleGuideSubscriptionsFallback(settings) {
    try {
        const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
        if (listMode !== 'whitelist') return;
        if (!Array.isArray(settings.whitelistChannels) || settings.whitelistChannels.length === 0) {
            return;
        }

        const anchors = document.querySelectorAll(
            'ytd-guide-renderer a#endpoint[href^="/@"], ' +
            'ytd-guide-renderer a#endpoint[href^="/channel/"], ' +
            'ytd-guide-renderer a#endpoint[href^="/c/"], ' +
            'ytd-guide-renderer a#endpoint[href^="/user/"]'
        );

        anchors.forEach(anchor => {
            try {
                const href = anchor?.getAttribute?.('href') || anchor?.href || '';
                if (!href) return;

                const entry = anchor.closest('ytd-guide-entry-renderer');
                if (!entry) return;

                const labelNode = entry.querySelector('yt-formatted-string.title') || entry.querySelector('.title');
                const channelText = labelNode?.textContent?.trim() || anchor.getAttribute('title') || '';

                const channelMeta = (typeof extractChannelMetadataFromElement === 'function')
                    ? extractChannelMetadataFromElement(entry, channelText, href, { cacheTarget: anchor, relatedElements: [anchor] })
                    : buildChannelMetadata(channelText, href);

                const shouldHide = shouldHideContent('', channelText, settings, {
                    skipKeywords: true,
                    channelHref: href,
                    channelMeta,
                    contentTag: 'ytd-guide-entry-renderer'
                });

                toggleVisibility(entry, shouldHide, shouldHide ? `Guide: ${channelText}` : '', true);
            } catch (e) {
            }
        });
    } catch (e) {
    }
}

// DOM fallback function that processes already-rendered content
async function applyDOMFallback(settings, options = {}) {
    const effectiveSettings = settings || currentSettings;
    if (!effectiveSettings || typeof effectiveSettings !== 'object') return;

    const listMode = (effectiveSettings && effectiveSettings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';

    const runState = window.__filtertubeDomFallbackRunState || (window.__filtertubeDomFallbackRunState = {
        running: false,
        pending: false,
        latestSettings: null,
        latestOptions: null
    });

    runState.latestSettings = effectiveSettings;
    runState.latestOptions = options;
    if (runState.running) {
        runState.pending = true;
        return;
    }
    runState.running = true;

    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    try {

    const supportsHasSelector = (() => {
        try {
            return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(:has(*))');
        } catch (e) {
            return false;
        }
    })();

    currentSettings = effectiveSettings;

    const scrollState = window.__filtertubeScrollState || (window.__filtertubeScrollState = {
        lastScrollTs: 0,
        listenerAttached: false
    });
    if (!scrollState.listenerAttached) {
        scrollState.listenerAttached = true;
        try {
            window.addEventListener('scroll', () => {
                scrollState.lastScrollTs = Date.now();
            }, { passive: true, capture: true });
        } catch (e) {
        }
    }

    const { forceReprocess = false, preserveScroll = true } = options;
    const now = Date.now();
    const isUserScrolling = now - (scrollState.lastScrollTs || 0) < 150;
    const allowPreserveScroll = preserveScroll && !forceReprocess && !isUserScrolling;
    const runStartedAt = now;

    // Start tracking hide/restore operations
    filteringTracker.reset();

    // Removed diagnostic logging - issue identified and fixed
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const previousScrollTop = scrollingElement ? scrollingElement.scrollTop : window.pageYOffset;
    const previousScrollLeft = scrollingElement ? scrollingElement.scrollLeft : window.pageXOffset;
    ensureStyles();
    ensureContentControlStyles(effectiveSettings);

    if (listMode === 'whitelist') {
        try {
            const watchTargets = [
                document.querySelector('ytd-watch-metadata'),
                document.querySelector('ytd-video-primary-info-renderer'),
                document.querySelector('ytd-video-secondary-info-renderer')
            ].filter(Boolean);
            watchTargets.forEach(el => toggleVisibility(el, false, '', true));
            document.querySelectorAll('#actions.ytd-watch-metadata, #owner.ytd-watch-metadata, #description.ytd-watch-metadata').forEach(el => {
                toggleVisibility(el, false, '', true);
            });
        } catch (e) {
        }
    }

    // Robust DOM-based passes (needed because :has() support varies across browsers and YouTube markup).
    // We run these even if :has() is supported, because they are cheap and ensure consistent behavior.
    try {
        if (effectiveSettings.hideMembersOnly) {
            // 1) Aria-label on titles (most reliable; includes watch sidebar)
            const titleNodes = document.querySelectorAll('#video-title, #video-title-link, .yt-lockup-metadata-view-model__title');
            titleNodes.forEach(titleNode => {
                const aria = (titleNode.getAttribute('aria-label') || '').toLowerCase();
                if (aria.includes('members only') || aria.includes('member-only') || aria.includes('member only')) {
                    const host = titleNode.closest(
                        'ytd-grid-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer, ' +
                        'ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model, ' +
                        'ytd-playlist-video-renderer, ytd-watch-card-compact-video-renderer'
                    );
                    if (host) {
                        host.style.setProperty('display', 'none', 'important');
                        host.setAttribute('data-filtertube-hidden', 'true');
                        host.setAttribute('data-filtertube-members-only-hidden', 'true');
                    }
                }
            });

            // 1) Badge/aria detection on cards (includes compact/watch sidebar and lockups)
            const membershipBadges = document.querySelectorAll('.yt-badge-shape--membership, [aria-label="Members only"], .badge-style-type-membership, ytd-badge-supported-renderer, .yt-badge-shape');
            membershipBadges.forEach(badge => {
                const text = (badge.textContent || '').toLowerCase();
                const aria = (badge.getAttribute('aria-label') || '').toLowerCase();
                const isMembership = badge.classList.contains('yt-badge-shape--membership') ||
                    text.includes('members only') ||
                    text.includes('member-only') ||
                    aria.includes('members only');
                if (!isMembership) return;

                const host = badge.closest(
                    'ytd-grid-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, yt-lockup-view-model, ytd-playlist-video-renderer, ytd-watch-flexy, ytd-watch-metadata, ytd-video-primary-info-renderer'
                );
                if (host) {
                    host.style.setProperty('display', 'none', 'important');
                    host.setAttribute('data-filtertube-hidden', 'true');
                    host.setAttribute('data-filtertube-members-only-hidden', 'true');

                    const shelf = host.closest('ytd-shelf-renderer, ytd-horizontal-list-renderer, ytd-rich-section-renderer, ytd-item-section-renderer');
                    if (shelf) {
                        shelf.style.setProperty('display', 'none', 'important');
                        shelf.setAttribute('data-filtertube-hidden', 'true');
                        shelf.setAttribute('data-filtertube-members-only-hidden', 'true');
                    }
                }
            });

            // 2) Shelves/playlists identified by UUMO playlist id or label text
            const membershipLinks = document.querySelectorAll('a[href*="list=UUMO"], a[title="Members-only videos"], a[href*="Members-only videos"]');
            membershipLinks.forEach(link => {
                const shelf = link.closest('ytd-shelf-renderer, ytd-horizontal-list-renderer, ytd-rich-section-renderer, ytd-item-section-renderer');
                if (shelf) {
                    shelf.style.setProperty('display', 'none', 'important');
                    shelf.setAttribute('data-filtertube-hidden', 'true');
                    shelf.setAttribute('data-filtertube-members-only-hidden', 'true');
                }
            });

            // 3) Shelf title fallback
            const memberShelfTitles = document.querySelectorAll('ytd-shelf-renderer h2, ytd-shelf-renderer #title');
            memberShelfTitles.forEach(titleNode => {
                const txt = (titleNode.textContent || '').toLowerCase();
                if (txt.includes('members-only') || txt.includes('members only')) {
                    const shelf = titleNode.closest('ytd-shelf-renderer');
                    if (shelf) {
                        shelf.style.setProperty('display', 'none', 'important');
                        shelf.setAttribute('data-filtertube-hidden', 'true');
                        shelf.setAttribute('data-filtertube-members-only-hidden', 'true');
                    }
                }
            });
        } else {
            // Restore anything we hid for members-only when the toggle is off.
            const previouslyHidden = document.querySelectorAll('[data-filtertube-members-only-hidden]');
            previouslyHidden.forEach(el => {
                el.style.removeProperty('display');
                el.removeAttribute('data-filtertube-hidden');
                el.removeAttribute('data-filtertube-members-only-hidden');
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

    try {
        for (let elementIndex = 0; elementIndex < videoElements.length; elementIndex++) {
            const element = videoElements[elementIndex];
            try {
            const elementTag = (element.tagName || '').toLowerCase();
            const alreadyProcessed = element.hasAttribute('data-filtertube-processed');
            const hasWhitelistPending = element.getAttribute('data-filtertube-whitelist-pending') === 'true';
            const uniqueId = element.getAttribute('data-filtertube-unique-id') || (elementTag.startsWith('ytk-') ? ensureVideoIdForCard(element) : extractVideoIdFromCard(element)) || '';
            const lastProcessedId = element.getAttribute('data-filtertube-last-processed-id') || '';
            const contentChanged = alreadyProcessed && uniqueId && lastProcessedId && uniqueId !== lastProcessedId;

            if (alreadyProcessed && hasWhitelistPending) {
                element.removeAttribute('data-filtertube-processed');
                element.removeAttribute('data-filtertube-last-processed-id');
                clearCachedChannelMetadata(element);
            }

            const cachedVideoId = element.getAttribute('data-filtertube-video-id') || '';
            if (cachedVideoId) {
                try {
                    const extractedVideoId = extractVideoIdFromCard(element) || '';
                    if (extractedVideoId && cachedVideoId !== extractedVideoId) {
                        element.removeAttribute('data-filtertube-processed');
                        element.removeAttribute('data-filtertube-last-processed-id');
                        element.removeAttribute('data-filtertube-video-id');
                        clearCachedChannelMetadata(element);
                    }
                } catch (e) {
                }
            }

            if ((forceReprocess || contentChanged) && alreadyProcessed) {
                element.removeAttribute('data-filtertube-processed');
                element.removeAttribute('data-filtertube-last-processed-id');
                clearCachedChannelMetadata(element);
            } else if (contentChanged) {
                clearCachedChannelMetadata(element);
            }

            if (alreadyProcessed && !forceReprocess && !contentChanged) {
                const hasIdentityAttr =
                    element.hasAttribute('data-filtertube-channel-id') ||
                    element.hasAttribute('data-filtertube-channel-handle') ||
                    element.hasAttribute('data-filtertube-channel-custom');

                // Some surfaces (notably Search + Watch right-rail) render the card first and inject the
                // channel/byline anchor later. In whitelist mode, that can cause the card to be hidden
                // before identity exists and then never re-evaluated. If we now see a real channel link,
                // allow one reprocess pass.
                if (!hasIdentityAttr) {
                    try {
                        const hasChannelLinkNow = !!element.querySelector(
                            'a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]'
                        );
                        if (hasChannelLinkNow) {
                            element.removeAttribute('data-filtertube-processed');
                            element.removeAttribute('data-filtertube-last-processed-id');
                            clearCachedChannelMetadata(element);
                        }
                    } catch (e) {
                    }
                }

                const wasClearedForReprocess = !element.hasAttribute('data-filtertube-processed');
                if (wasClearedForReprocess) {
                    // Continue with normal processing below.
                } else {

                const hasVideoChannelMap = effectiveSettings.videoChannelMap && typeof effectiveSettings.videoChannelMap === 'object';
                if (!hasIdentityAttr && hasVideoChannelMap) {
                    const fromUniqueId = (uniqueId && /^[a-zA-Z0-9_-]{11}$/.test(uniqueId)) ? uniqueId : '';
                    const videoId = elementTag.startsWith('ytk-')
                        ? ensureVideoIdForCard(element)
                        : (fromUniqueId || extractVideoIdFromCard(element));

                    if (videoId && effectiveSettings.videoChannelMap[videoId]) {
                        element.removeAttribute('data-filtertube-processed');
                        element.removeAttribute('data-filtertube-last-processed-id');
                        clearCachedChannelMetadata(element);
                    } else {
                        // Skip already processed elements to avoid duplicate counting
                        continue;
                    }
                } else {
                    // Skip already processed elements to avoid duplicate counting
                    continue;
                }
                }
            }

            // Extract Metadata
            const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, yt-formatted-string#title, span#title');
            let channelElement = null;
            if (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer') {
                channelElement = element.querySelector('#byline, #byline-container #byline');
            }
            if (!channelElement && elementTag === 'ytd-video-renderer') {
                channelElement = element.querySelector(
                    '#channel-info ytd-channel-name a, ' +
                    '#channel-info a[href^="/@"], ' +
                    '#channel-info a[href^="/channel/"], ' +
                    '#channel-info a[href^="/c/"], ' +
                    '#channel-info a[href^="/user/"]'
                );
            }
            if (!channelElement && (elementTag === 'ytd-reel-item-renderer' || elementTag === 'ytm-shorts-lockup-view-model' || elementTag === 'ytm-shorts-lockup-view-model-v2')) {
                channelElement = element.querySelector(
                    '#channel-name a, ' +
                    'ytd-channel-name a, ' +
                    'a[href^="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' +
                    'a[href^="/channel/"], ' +
                    'a[href^="/c/"], ' +
                    'a[href^="/user/"]'
                );
            }
            if (!channelElement) {
                channelElement = element.querySelector(
                    '.yt-content-metadata-view-model__metadata-row a[href^="/@"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href^="/channel/"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href^="/c/"], ' +
                    '.yt-content-metadata-view-model__metadata-row a[href^="/user/"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href^="/@"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href^="/channel/"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href^="/c/"], ' +
                    '.yt-lockup-metadata-view-model__metadata a[href^="/user/"]'
                );
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
                const titleAria = titleElement?.getAttribute?.('aria-label');
                if (titleAria) {
                    title = titleAria.trim();
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

            // YouTube Kids specific extraction from aria-label
            if (!channel && elementTag.startsWith('ytk-')) {
                const labelElement = element.querySelector('[aria-label]') || (element.getAttribute('aria-label') ? element : null);
                const label = labelElement?.getAttribute?.('aria-label') || '';
                if (label) {
                    // Pattern 1: "... by [Channel Name] [Stats/Duration]"
                    const byMatch = label.match(/\s+by\s+(.+?)(?:\s+\d|$)/i);
                    if (byMatch && byMatch[1]) {
                        channel = byMatch[1].trim();
                    }
                    // Pattern 2: "Video [Title] I [Channel Name] I [Duration]"
                    else if (label.includes(' I ')) {
                        const parts = label.split(' I ');
                        if (parts.length >= 2) {
                            channel = parts[1].trim();
                        }
                    }
                    // Pattern 3: "Channel [Name]"
                    else if (label.toLowerCase().startsWith('channel ')) {
                        channel = label.substring(8).trim();
                    }
                    // Pattern 4: Fallback for channel card
                    else if (elementTag === 'ytk-compact-channel-renderer') {
                        channel = label.replace(/^Channel\s+/i, '').trim();
                    }
                }
            }
            if (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer') {
                const compact = channelPrimaryText
                    .split('\n')[0]
                    .split('•')[0]
                    .trim();
                channel = compact;
            }

            let descriptionText = '';
            try {
                const descEl = element.querySelector(
                    '#description-text, ' +
                    '.metadata-snippet-container, ' +
                    'ytd-text-inline-expander#description, ' +
                    'ytd-text-inline-expander #expanded, ' +
                    '.yt-lockup-metadata-view-model-wiz__description, ' +
                    '.yt-lockup-metadata-view-model__description'
                );
                const desc = descEl?.textContent?.trim() || '';
                if (desc) descriptionText = desc;
            } catch (e) {
            }
            const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
            const relatedElements = [channelAnchor, channelElement, channelSubtitleElement];
            let channelMeta = extractChannelMetadataFromElement(element, channel, channelHref, {
                cacheTarget: element,
                relatedElements
            });
            const collaboratorMetas = extractCollaboratorMetadataFromElement(element);

            // If channel identity is missing, try videoChannelMap lookup (Shorts + playlist panels + other DOM-heavy cards).
            const isPlaylistPanelRow = (elementTag === 'ytd-playlist-panel-video-renderer' || elementTag === 'ytd-playlist-panel-video-wrapper-renderer');
            const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id || channelMeta.customUrl);
            let mappedChannelId = '';
            if (!hasChannelIdentity && effectiveSettings.videoChannelMap) {
                const videoId = ensureVideoIdForCard(element);
                if (videoId && effectiveSettings.videoChannelMap[videoId]) {
                    mappedChannelId = effectiveSettings.videoChannelMap[videoId];
                    channelMeta = { ...channelMeta, id: mappedChannelId };
                    try {
                        element.setAttribute('data-filtertube-channel-id', mappedChannelId);
                    } catch (e) {
                    }
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

            const skipKeywordFiltering = listMode !== 'whitelist' && CHANNEL_ONLY_TAGS.has(elementTag);
            const keywordTarget = (listMode === 'whitelist' && descriptionText)
                ? `${title} ${descriptionText}`
                : title;

            const matchesFilters = shouldHideContent(keywordTarget, channel, effectiveSettings, {
                skipKeywords: skipKeywordFiltering,
                channelHref,
                channelMeta,
                collaborators: collaboratorMetas,
                contentTag: elementTag
            });

            // Handle Container Logic (e.g., rich-grid-media inside rich-item)
            let targetToHide = element;
            if (elementTag.startsWith('ytk-')) {
                // YouTube Kids frequently uses component nodes that act like display: contents.
                // In that case, hiding the component itself may not hide the visually-rendered box.
                // Prefer a real layout wrapper when possible.
                const listItem = element.closest('[role="listitem"]');
                if (listItem) {
                    targetToHide = listItem;
                } else {
                    try {
                        const computed = window.getComputedStyle(element);
                        if (computed && computed.display === 'contents' && element.parentElement) {
                            targetToHide = element.parentElement;
                        }
                    } catch (e) {
                    }
                }
            } else if (elementTag === 'ytd-rich-grid-media') {
                const parent = element.closest('ytd-rich-item-renderer, ytd-item-section-renderer');
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

            if (elementIndex > 0 && elementIndex % 60 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    // Inline survey containers embed filtered videos; hide shell when everything inside is hidden
    try {
        const surveys = document.querySelectorAll('ytd-inline-survey-renderer');
        for (let i = 0; i < surveys.length; i++) {
            const survey = surveys[i];
            const embeddedItems = survey.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-rich-grid-media, ytd-rich-item-renderer');
            if (embeddedItems.length === 0) continue;

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

            if (i > 0 && i % 40 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    // 2. Chip Filtering (Home/Search chip bars)
    try {
        const chips = document.querySelectorAll('yt-chip-cloud-chip-renderer');
        for (let i = 0; i < chips.length; i++) {
            const chip = chips[i];
            const label = chip.textContent?.trim() || '';
            if (listMode === 'whitelist') {
                toggleVisibility(chip, false, '', true);
                continue;
            }
            const hideChip = shouldHideContent(label, '', effectiveSettings);
            toggleVisibility(chip, hideChip, `Chip: ${label}`);
            if (i > 0 && i % 60 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    // Hide any rich items that ended up empty after filtering to avoid blank cards
    try {
        const richItems = document.querySelectorAll('ytd-rich-item-renderer');
        for (let i = 0; i < richItems.length; i++) {
            const item = richItems[i];
            const contentEl = item.querySelector('#content');
            if (!contentEl) continue;
            const hasVisibleChild = Array.from(contentEl.children).some(child => child.offsetParent !== null);
            if (!hasVisibleChild && !item.hasAttribute('data-filtertube-hidden')) {
                // SKIP STATS: This is container cleanup, not actual content filtering
                // The actual video inside was already counted when it was hidden
                toggleVisibility(item, true, 'Empty Rich Item', true);
            }
            if (i > 0 && i % 60 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

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
            container.removeAttribute('data-filtertube-ignore-empty-hide');
            // SKIP STATS: Container hiding - individual shorts inside are counted separately
            toggleVisibility(container, true, 'Hide Shorts container', true);
        });
    } else {
        allShortsElements.forEach(container => {
            if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) {
                container.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                container.setAttribute('data-filtertube-ignore-empty-hide', 'true');
                container.classList.remove('filtertube-hidden-shelf');
                // Only unhide if it's not also hidden by a shelf title
                if (!container.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
                    // SKIP STATS: Container unhiding
                    toggleVisibility(container, false, '', true);
                }
            }
        });
    }

    // Detect Shorts that are rendered as normal video cards (e.g., watch sidebar)
    const disguisedShortsSelectors = 'ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-watch-card-compact-video-renderer';
    try {
        const disguisedCards = document.querySelectorAll(disguisedShortsSelectors);
        for (let i = 0; i < disguisedCards.length; i++) {
            const card = disguisedCards[i];
            // Skip if already marked as a Short
            if (card.getAttribute('data-filtertube-short') === 'true') continue;

        const hrefShort = card.querySelector('a#thumbnail[href*="/shorts/"], a#video-title[href*="/shorts/"], a.yt-simple-endpoint[href*="/shorts/"]');
        const ariaLabel = card.querySelector('#video-title')?.getAttribute('aria-label') || '';
        const overlayStyle = card.querySelector('ytd-thumbnail-overlay-time-status-renderer')?.getAttribute('overlay-style') || '';

        const isShortLike = Boolean(
            hrefShort ||
            (ariaLabel && ariaLabel.toLowerCase().includes('play short')) ||
            (overlayStyle && overlayStyle.toUpperCase().includes('SHORTS'))
        );

            if (isShortLike) {
                card.setAttribute('data-filtertube-short', 'true');
            }
            if (i > 0 && i % 60 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    const shortsSelectors = [
        'ytd-reel-item-renderer',
        'ytm-shorts-lockup-view-model',
        'ytm-shorts-lockup-view-model-v2',
        'ytd-video-renderer[data-filtertube-short]',
        'ytd-grid-video-renderer[data-filtertube-short]',
        'ytd-compact-video-renderer[data-filtertube-short]',
        'ytd-watch-card-compact-video-renderer[data-filtertube-short]'
    ].join(', ');

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

    try {
        const shortsCards = document.querySelectorAll(shortsSelectors);
        for (let elementIndex = 0; elementIndex < shortsCards.length; elementIndex++) {
            const element = shortsCards[elementIndex];
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
            const isStillBlocked = markedChannelIsStillBlocked(effectiveSettings, blockedChannelId, blockedChannelHandle, blockedChannelCustom);

            if (isStillBlocked) {
                // Keep it hidden - mark as confirmed so future passes don't treat it as pending
                markElementAsBlocked(target, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle,
                    customUrl: blockedChannelCustom
                }, 'confirmed');
                toggleVisibility(target, true, `Blocked channel: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                continue; // Skip further processing for this element
            } else {
                // If blocklist no longer contains this channel but the state is still pending,
                // keep it hidden for a short grace period to avoid flicker while background saves
                const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 8000;
                if (waitForConfirmation) {
                    toggleVisibility(target, true, `Pending channel block: ${blockedChannelHandle || blockedChannelCustom || blockedChannelId}`);
                    continue;
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

        const channelAnchor = element.querySelector(
            '#channel-info ytd-channel-name a, ' +
            'ytd-video-meta-block ytd-channel-name a, ' +
            '#byline-container ytd-channel-name a, ' +
            '.yt-content-metadata-view-model__metadata-row a[href^="/@"], ' +
            '.yt-content-metadata-view-model__metadata-row a[href^="/channel/"], ' +
            '.yt-content-metadata-view-model__metadata-row a[href^="/c/"], ' +
            '.yt-content-metadata-view-model__metadata-row a[href^="/user/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href^="/@"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href^="/channel/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href^="/c/"], ' +
            '.yt-lockup-metadata-view-model__metadata a[href^="/user/"], ' +
            'a[href^="/channel/UC"], ' +
            'a[href^="/@"], ' +
            'a[href^="/c/"], ' +
            'a[href^="/user/"]'
        );
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
            if (elementIndex > 0 && elementIndex % 60 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    // 4. Comments Filtering
    handleCommentsFallback(effectiveSettings);

    // 4b. Left guide (subscriptions) filtering
    handleGuideSubscriptionsFallback(effectiveSettings);

    // 5. Container Cleanup (Shelves, Grids)
    // Hide shelves if all their items are hidden
    try {
        const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-reel-shelf-renderer, ytd-item-section-renderer, grid-shelf-view-model, yt-section-header-view-model');
        for (let i = 0; i < shelves.length; i++) {
            const shelf = shelves[i];
            const shelfTitle = extractShelfTitle(shelf);
            const shelfTitleMatches = shelfTitle && shouldHideContent(shelfTitle, '', effectiveSettings);

            if (shelfTitleMatches) {
                shelf.setAttribute('data-filtertube-hidden-by-shelf-title', 'true');
                toggleVisibility(shelf, true, `Shelf title: ${shelfTitle}`);
                continue;
            }

            if (shelf.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
                shelf.removeAttribute('data-filtertube-hidden-by-shelf-title');
                toggleVisibility(shelf, false);
            }

            updateContainerVisibility(shelf, 'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, .ytGridShelfViewModelGridShelfItem');

            if (i > 0 && i % 30 === 0) {
                await yieldToMain();
            }
        }
    } catch (e) {
    }

    if (allowPreserveScroll && scrollingElement) {
        const didScrollDuringRun = (scrollState.lastScrollTs || 0) > runStartedAt;
        const now2 = Date.now();
        const isUserScrollingNow = now2 - (scrollState.lastScrollTs || 0) < 150;
        if (didScrollDuringRun || isUserScrollingNow) {
            // User scrolled while we were processing; do not fight the scroll position.
        } else {
        try {
            if (typeof scrollingElement.scrollTo === 'function') {
                scrollingElement.scrollTo({ top: previousScrollTop, left: previousScrollLeft, behavior: 'auto' });
            } else {
                window.scrollTo(previousScrollLeft, previousScrollTop);
            }
        } catch (e) {
            try {
                window.scrollTo(previousScrollLeft, previousScrollTop);
            } catch (e2) {
            }
        }
        }
    }

    // Log hide/restore summary
    try {
        if (window.__filtertubeDebug) {
            filteringTracker.logSummary();
        }
    } catch (e) {
    }

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
    } finally {
        runState.running = false;
        if (runState.pending) {
            runState.pending = false;
            setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);
        }
    }
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings, options = {}) {
    const {
        skipKeywords = false,
        channelHref = '',
        channelMeta: providedChannelMeta = null,
        collaborators = [],
        contentTag = ''
    } = options;
    const channelMeta = providedChannelMeta || buildChannelMetadata(channel, channelHref);
    const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id || channelMeta.customUrl);

    if (!title && !channel && !hasChannelIdentity && (!collaborators || collaborators.length === 0)) return false;

    const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
    const isCommentContext = typeof contentTag === 'string' && contentTag.toLowerCase().includes('comment');
    if (listMode === 'whitelist' && !isCommentContext) {
        const whitelistChannels = Array.isArray(settings.whitelistChannels) ? settings.whitelistChannels : [];
        const whitelistKeywords = Array.isArray(settings.whitelistKeywords) ? settings.whitelistKeywords : [];

        const hasChannelRules = whitelistChannels.length > 0;
        const hasKeywordRules = !skipKeywords && whitelistKeywords.length > 0;

        if (!hasChannelRules && !hasKeywordRules) return true;

        if (hasKeywordRules) {
            const compiled = getCompiledKeywordRegexes(whitelistKeywords);
            for (const regex of compiled) {
                if (matchesKeyword(regex, title) || matchesKeyword(regex, channel)) {
                    return false;
                }
            }
        }

        if (hasChannelRules) {
            const channelMap = settings.channelMap || {};
            const index = getCompiledChannelFilterIndex(settings, whitelistChannels);
            if (index) {
                if (hasChannelIdentity && channelMetaMatchesIndex(channelMeta, index, channelMap)) {
                    return false;
                }
                const collaboratorMetas = Array.isArray(collaborators) ? collaborators : [];
                if (collaboratorMetas.length > 0) {
                    for (const collaborator of collaboratorMetas) {
                        if (channelMetaMatchesIndex(collaborator, index, channelMap)) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

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
        const compiled = getCompiledKeywordRegexes(settings.filterKeywords);
        for (const regex of compiled) {
            if (matchesKeyword(regex, title) || matchesKeyword(regex, channel)) {
                return true;
            }
        }
    }

    if (settings.filterChannels && settings.filterChannels.length > 0 && !hasChannelIdentity && (!collaborators || collaborators.length === 0)) {
        const tag = (contentTag || '').toLowerCase();
        const isPlaylistPanelItem = tag === 'ytd-playlist-panel-video-renderer' || tag === 'ytd-playlist-panel-video-wrapper-renderer';
        if (isPlaylistPanelItem) {
            const index = getCompiledChannelFilterIndex(settings);
            const candidate = normalizeChannelNameForComparison(channel);
            if (index && candidate && index.names.has(candidate)) {
                return true;
            }
        }
    }

    // Channel filtering
    if (settings.filterChannels && settings.filterChannels.length > 0 && (hasChannelIdentity || collaborators.length > 0)) {
        const channelMap = settings.channelMap || {};
        const index = getCompiledChannelFilterIndex(settings);
        if (index) {
            // 1. Normal Check (Fast path - direct match or existing channelMap lookup)
            if (hasChannelIdentity && channelMetaMatchesIndex(channelMeta, index, channelMap)) {
                return true;
            }
            const collaboratorMetas = Array.isArray(collaborators) ? collaborators : [];
            if (collaboratorMetas.length > 0) {
                for (const collaborator of collaboratorMetas) {
                    if (channelMetaMatchesIndex(collaborator, index, channelMap)) {
                        return true;
                    }
                }
            }

            // 2. Active Resolution (Safety net for missing mappings)
            // This runs when the blocklist has a Handle (e.g. @shakira)
            // but the content on screen only shows a UC ID (UC...)
            if (channelMeta.id && !channelMeta.handle && Array.isArray(index.unresolvedHandleKeys) && index.unresolvedHandleKeys.length > 0) {
                try {
                    const contentId = normalizeUcIdForComparison(channelMeta.id);
                    if (contentId) {
                        const hasResolvedCache = typeof resolvedHandleCache !== 'undefined' && resolvedHandleCache && typeof resolvedHandleCache.get === 'function';
                        const hasFetchId = typeof fetchIdForHandle === 'function';
                        if (!hasResolvedCache && !hasFetchId) {
                            return false;
                        }

                        const state = window.__filtertubeActiveHandleResolveState || (window.__filtertubeActiveHandleResolveState = { idx: 0, lastTs: 0 });
                        const now = Date.now();
                        if (now - (state.lastTs || 0) > 1500) {
                            state.lastTs = now;
                            const key = index.unresolvedHandleKeys[state.idx % index.unresolvedHandleKeys.length];
                            state.idx = (state.idx + 1) % index.unresolvedHandleKeys.length;
                            const cachedState = hasResolvedCache ? resolvedHandleCache.get(key) : null;
                            if (cachedState && cachedState !== 'PENDING') {
                                if (String(cachedState).toLowerCase() === contentId) {
                                    return true;
                                }
                            } else if (!cachedState && hasFetchId) {
                                const isKidsHost = (() => {
                                    try {
                                        return typeof location !== 'undefined' && String(location.hostname || '').includes('youtubekids.com');
                                    } catch (e) {
                                        return false;
                                    }
                                })();
                                fetchIdForHandle(`@${key}`, { skipNetwork: isKidsHost });
                            }
                        }
                    }
                } catch (e) {
                }
            }
        }
    }

    return false;
}
