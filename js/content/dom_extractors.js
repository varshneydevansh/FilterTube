// js/content/dom_extractors.js - Isolated World
//
// DOM metadata/extraction utilities used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

// ============================================================================
// CARD / SELECTOR HELPERS
// ============================================================================

const VIDEO_CARD_SELECTORS = [
    'ytd-rich-item-renderer',
    'ytd-rich-grid-media',
    'ytd-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-watch-card-compact-video-renderer',
    'ytd-watch-card-hero-video-renderer',
    'ytd-watch-card-rhs-panel-video-renderer',
    'ytd-playlist-panel-video-renderer',
    'ytd-playlist-panel-video-wrapper-renderer',
    'ytd-reel-item-renderer',
    'ytd-playlist-renderer',
    'ytd-grid-playlist-renderer',
    'ytd-compact-playlist-renderer',
    'ytd-playlist-video-renderer',
    'ytd-radio-renderer',
    'ytd-compact-radio-renderer',
    'yt-lockup-view-model',
    'yt-lockup-metadata-view-model',
    'ytd-channel-renderer',
    'ytd-grid-channel-renderer',
    'ytd-universal-watch-card-renderer',
    'ytd-channel-video-player-renderer',
    'ytd-channel-featured-content-renderer',
    'yt-official-card-view-model',
    'ytm-shorts-lockup-view-model',
    'ytm-shorts-lockup-view-model-v2',

    // YouTube Kids (DOM-only)
    'ytk-compact-video-renderer',
    'ytk-grid-video-renderer',
    'ytk-video-renderer',
    'ytk-compact-channel-renderer',
    'ytk-compact-playlist-renderer',
    'ytk-kids-slim-owner-renderer'
].join(', ');

function ensureVideoIdForCard(card) {
    if (!card || typeof card.getAttribute !== 'function') return '';
    const cachedVideoId = card.getAttribute('data-filtertube-video-id') || '';
    const tag = (card.tagName || '').toLowerCase();
    const isKidsHost = (() => {
        try {
            return tag.startsWith('ytk-') || String(location.hostname || '').includes('youtubekids.com');
        } catch (e) {
            return tag.startsWith('ytk-');
        }
    })();

    const canFastReturnStamp = !isKidsHost && cachedVideoId && /^[a-zA-Z0-9_-]{11}$/.test(cachedVideoId)
        && !(tag === 'yt-lockup-view-model' ||
            tag === 'yt-lockup-metadata-view-model' ||
            tag === 'ytd-rich-item-renderer' ||
            tag === 'ytd-video-renderer' ||
            tag === 'ytd-grid-video-renderer' ||
            tag === 'ytd-compact-video-renderer' ||
            tag === 'ytm-video-with-context-renderer' ||
            tag === 'ytm-compact-video-renderer' ||
            tag === 'ytd-playlist-panel-video-renderer' ||
            tag === 'ytd-playlist-panel-video-wrapper-renderer');
    if (canFastReturnStamp) {
        return cachedVideoId;
    }

    let extractedVideoId = '';
    try {
        extractedVideoId = extractVideoIdFromCard(card) || '';
    } catch (e) {
        extractedVideoId = '';
    }

    if (extractedVideoId) {
        const shouldClearOnMismatch = (isKidsHost ||
            tag === 'yt-lockup-view-model' ||
            tag === 'yt-lockup-metadata-view-model' ||
            tag === 'ytd-rich-item-renderer' ||
            tag === 'ytd-video-renderer' ||
            tag === 'ytd-grid-video-renderer' ||
            tag === 'ytd-compact-video-renderer' ||
            tag === 'ytm-video-with-context-renderer' ||
            tag === 'ytm-compact-video-renderer' ||
            tag === 'ytd-playlist-panel-video-renderer' ||
            tag === 'ytd-playlist-panel-video-wrapper-renderer');

        // IMPORTANT: YouTube frequently recycles DOM nodes. If this element did not previously have our
        // `data-filtertube-video-id` stamp but still has old FilterTube identity/hidden markers from a
        // prior video, stamping a new videoId without clearing those markers can poison the mapping
        // (e.g., playlist "next" rows hiding unrelated videos). Clear stale state before stamping.
        if (shouldClearOnMismatch && !cachedVideoId) {
            try {
                const hasAnyIdentity = Boolean(
                    card.hasAttribute('data-filtertube-channel-id') ||
                    card.hasAttribute('data-filtertube-channel-handle') ||
                    card.hasAttribute('data-filtertube-channel-custom') ||
                    card.hasAttribute('data-filtertube-channel-name') ||
                    card.querySelector?.('[data-filtertube-channel-id],[data-filtertube-channel-handle],[data-filtertube-channel-custom],[data-filtertube-channel-name]')
                );
                const hasAnyState = Boolean(
                    card.hasAttribute('data-filtertube-processed') ||
                    card.hasAttribute('data-filtertube-hidden') ||
                    card.classList?.contains('filtertube-hidden') ||
                    card.hasAttribute('data-filtertube-collaborators') ||
                    card.hasAttribute('data-filtertube-blocked-state')
                );

                if (hasAnyIdentity || hasAnyState) {
                    // Clear any nested channel metadata too (search surfaces often stamp on inner anchors).
                    clearCachedChannelMetadata(card);
                    card.removeAttribute('data-filtertube-channel-name');
                    card.removeAttribute('data-filtertube-channel-custom');

                    card.removeAttribute('data-filtertube-processed');
                    card.removeAttribute('data-filtertube-last-processed-id');
                    card.removeAttribute('data-filtertube-last-processed-mode');
                    card.removeAttribute('data-filtertube-unique-id');
                    card.removeAttribute('data-filtertube-duration');
                    card.removeAttribute('data-filtertube-whitelist-pending');

                    card.removeAttribute('data-filtertube-hidden');
                    card.removeAttribute('data-filtertube-hidden-by-channel');
                    card.removeAttribute('data-filtertube-hidden-by-keyword');
                    card.removeAttribute('data-filtertube-hidden-by-duration');
                    card.removeAttribute('data-filtertube-hidden-by-upload-date');
                    card.removeAttribute('data-filtertube-hidden-by-category');
                    card.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                    card.classList.remove('filtertube-hidden');

                    card.removeAttribute('data-filtertube-blocked-channel-id');
                    card.removeAttribute('data-filtertube-blocked-channel-handle');
                    card.removeAttribute('data-filtertube-blocked-channel-custom');
                    card.removeAttribute('data-filtertube-blocked-channel-name');
                    card.removeAttribute('data-filtertube-blocked-state');
                    card.removeAttribute('data-filtertube-blocked-ts');

                    card.removeAttribute('data-filtertube-collaborators');
                    card.removeAttribute('data-filtertube-collaborators-source');
                    card.removeAttribute('data-filtertube-collaborators-ts');
                    card.removeAttribute('data-filtertube-expected-collaborators');
                    card.removeAttribute('data-filtertube-collab-state');
                    card.removeAttribute('data-filtertube-collab-awaiting-dialog');
                    card.removeAttribute('data-filtertube-collab-requested');
                }
            } catch (e) {
            }
        }

        if (shouldClearOnMismatch && cachedVideoId && cachedVideoId !== extractedVideoId) {
            try {
                card.removeAttribute('data-filtertube-processed');
                card.removeAttribute('data-filtertube-last-processed-id');
                card.removeAttribute('data-filtertube-last-processed-mode');
                card.removeAttribute('data-filtertube-unique-id');
                card.removeAttribute('data-filtertube-channel-id');
                card.removeAttribute('data-filtertube-channel-handle');
                card.removeAttribute('data-filtertube-channel-name');
                card.removeAttribute('data-filtertube-channel-custom');
                card.removeAttribute('data-filtertube-whitelist-pending');
                card.removeAttribute('data-filtertube-hidden');
                card.removeAttribute('data-filtertube-hidden-by-channel');
                card.removeAttribute('data-filtertube-hidden-by-keyword');
                card.removeAttribute('data-filtertube-hidden-by-duration');
                card.removeAttribute('data-filtertube-hidden-by-upload-date');
                card.removeAttribute('data-filtertube-hidden-by-category');
                card.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                card.removeAttribute('data-filtertube-blocked-channel-id');
                card.removeAttribute('data-filtertube-blocked-channel-handle');
                card.removeAttribute('data-filtertube-blocked-channel-custom');
                card.removeAttribute('data-filtertube-blocked-channel-name');
                card.removeAttribute('data-filtertube-blocked-state');
                card.removeAttribute('data-filtertube-blocked-ts');
                card.classList.remove('filtertube-hidden');
                if (card.style && card.style.display === 'none') {
                    card.style.display = '';
                }
            } catch (e) {
            }
        }
        if (!cachedVideoId || cachedVideoId !== extractedVideoId) {
            card.setAttribute('data-filtertube-video-id', extractedVideoId);
        }
        return extractedVideoId;
    }

    return cachedVideoId;
}

function getCardTitle(card) {
    if (!card || typeof card.querySelector !== 'function') return '';
    const titleElement = card.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, h3 a, yt-formatted-string#title, span#title');
    if (titleElement?.textContent?.trim()) {
        return titleElement.textContent.trim();
    }
    const ariaLabel = card.getAttribute?.('aria-label');
    if (ariaLabel) return ariaLabel.trim();
    const labelledById = card.getAttribute?.('aria-labelledby');
    if (labelledById) {
        const labelSource = document.getElementById(labelledById.trim());
        if (labelSource?.textContent) {
            return labelSource.textContent.trim();
        }
    }
    return '';
}

function findVideoCardElement(element) {
    if (!element || !(element instanceof Element)) return null;
    if (element.matches(VIDEO_CARD_SELECTORS)) return element;
    return element.closest(VIDEO_CARD_SELECTORS) || element;
}

// ============================================================================
// DURATION HELPERS
// ============================================================================

/**
 * Extract video duration from element - UPDATED for YouTube 2025
 * @param {HTMLElement} element - The video element
 * @returns {number|null} Duration in seconds, or null if not found
 */
function extractVideoDuration(element) {
    if (!element) return null;

    // Check cache first
    const cached = element.getAttribute('data-filtertube-duration');
    if (cached !== null) {
        if (cached === '') {
            // Some surfaces hydrate the duration badge async (notably playlists/mixes).
            // Only re-scan when we can observe at least one duration indicator in the DOM.
            const durationCandidates = Array.from(element.querySelectorAll(
                '.yt-badge-shape__text, badge-shape[aria-label], ytd-thumbnail-overlay-time-status-renderer span#text, span.ytd-thumbnail-overlay-time-status-renderer, #time-status span'
            ));
            const hasDurationIndicator = durationCandidates.some(node => {
                try {
                    const text = (node?.getAttribute?.('aria-label') || node?.textContent || '').trim();
                    if (!text) return false;
                    if (!/\d/.test(text)) return false;
                    if (text.includes(':')) return true;
                    if (/hour|minute|second/i.test(text)) return true;
                    return false;
                } catch (e) {
                    return false;
                }
            });
            if (!hasDurationIndicator) return null;
            try {
                element.removeAttribute('data-filtertube-duration');
            } catch (e) {
            }
        } else if (cached !== '') {
            const parsed = parseInt(cached, 10);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
        }
    }

    // 1. NEW: Check for badge-shape text (e.g., "3:54")
    // Path: badge-shape -> div.yt-badge-shape__text
    const badgeText = element.querySelector('.yt-badge-shape__text');
    if (badgeText) {
        const seconds = parseDuration(badgeText.textContent.trim());
        if (seconds > 0) {
            element.setAttribute('data-filtertube-duration', seconds.toString());
            return seconds;
        }
    }

    // 2. NEW: Check for badge-shape aria-label (e.g., "3 minutes, 54 seconds")
    const badgeAria = element.querySelector('badge-shape[aria-label]');
    if (badgeAria) {
        const seconds = parseAriaLabelDuration(badgeAria.getAttribute('aria-label'));
        if (seconds > 0) {
            element.setAttribute('data-filtertube-duration', seconds.toString());
            return seconds;
        }
    }

    // 3. LEGACY: Old span selectors
    const legacySelectors = [
        'ytd-thumbnail-overlay-time-status-renderer span#text',
        'span.ytd-thumbnail-overlay-time-status-renderer',
        '#time-status span'
    ];

    for (const selector of legacySelectors) {
        const el = element.querySelector(selector);
        if (el && el.textContent) {
            const seconds = parseDuration(el.textContent.trim());
            if (seconds > 0) {
                element.setAttribute('data-filtertube-duration', seconds.toString());
                return seconds;
            }
        }
    }

    // Cache failure to prevent re-querying
    element.setAttribute('data-filtertube-duration', '');
    return null;
}

/**
 * Parse duration from aria-label format (e.g., "7 minutes, 51 seconds")
 * @param {string} ariaLabel - Aria label text
 * @returns {number} Duration in seconds
 */
function parseAriaLabelDuration(ariaLabel) {
    if (!ariaLabel) return 0;

    let totalSeconds = 0;

    // Extract hours
    const hoursMatch = ariaLabel.match(/(\d+)\s*hour/i);
    if (hoursMatch) {
        totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
    }

    // Extract minutes
    const minutesMatch = ariaLabel.match(/(\d+)\s*minute/i);
    if (minutesMatch) {
        totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    }

    // Extract seconds
    const secondsMatch = ariaLabel.match(/(\d+)\s*second/i);
    if (secondsMatch) {
        totalSeconds += parseInt(secondsMatch[1], 10);
    }

    return totalSeconds;
}

/**
 * Parse duration string (e.g., "1:38:14" or "2:47") to seconds
 * @param {string} durationText - Duration string
 * @returns {number} Duration in seconds
 */
function parseDuration(durationText) {
    if (!durationText) return 0;

    const parts = durationText.split(':').map(Number);

    if (parts.length === 3) {
        // HH:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // SS
        return parts[0];
    }

    return 0;
}

// ============================================================================
// SHELF HELPERS
// ============================================================================

function extractShelfTitle(shelf) {
    if (!shelf || typeof shelf.querySelector !== 'function') return '';

    // Standard headers
    const header = shelf.querySelector(':scope #title-container, :scope #header, :scope ytd-shelf-header-renderer, :scope .grid-subheader, :scope .shelf-title-row, :scope h2, :scope yt-section-header-view-model');
    const headerTextCandidates = [];

    if (header) {
        headerTextCandidates.push(
            header.querySelector('#title'),
            header.querySelector('#title-text'),
            header.querySelector('yt-formatted-string#title'),
            header.querySelector('span#title'),
            header.querySelector('h2'),
            header.querySelector('.yt-shelf-header-layout__title')
        );
    }

    // Direct children checks (fallback)
    headerTextCandidates.push(
        shelf.querySelector(':scope > #dismissible #title'),
        shelf.querySelector(':scope > #dismissible #title-text'),
        shelf.querySelector(':scope > h2'),
        shelf.querySelector('.yt-shelf-header-layout__title')
    );

    for (const candidate of headerTextCandidates) {
        const text = candidate?.textContent?.trim();
        if (text) return text;
    }

    const headerAria = header?.getAttribute?.('aria-label');
    if (headerAria?.trim()) return headerAria.trim();

    const shelfAria = shelf.getAttribute('aria-label');
    if (shelfAria?.trim()) return shelfAria.trim();

    return '';
}

// ============================================================================
// CHANNEL METADATA HELPERS
// ============================================================================

function extractChannelIdFromString(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/UC[0-9A-Za-z_-]{22}/);
    return match ? match[0] : '';
}

function normalizeHrefForParsing(href) {
    if (!href || typeof href !== 'string') return '';
    try {
        const url = new URL(href, document.location?.origin || 'https://www.youtube.com');
        return url.pathname || '';
    } catch (e) {
        return href;
    }
}

function extractCustomUrlFromPath(path) {
    if (!path || typeof path !== 'string') return '';
    let working = path;
    try {
        if (/^https?:\/\//i.test(working)) {
            working = new URL(working).pathname;
        }
    } catch (e) { /* ignore */ }

    if (!working.startsWith('/')) working = '/' + working;

    // Normalize: remove trailing slash and common query/fragment markers
    working = working.split(/[?#]/)[0].replace(/\/$/, '');

    if (working.startsWith('/c/')) {
        const parts = working.split('/');
        if (parts[2]) return `c/${parts[2]}`;
    } else if (working.startsWith('/user/')) {
        const parts = working.split('/');
        if (parts[2]) return `user/${parts[2]}`;
    }

    // Some legacy URLs might be just /ChannelName (rare but possible if not a handle)
    // We only match these if they aren't common YouTube paths or @handles
    if (working.includes('/@') || working.startsWith('/channel/')) return '';

    // We already handled /c/ and /user/
    return '';
}

function buildChannelMetadata(channelText = '', channelHref = '') {
    const normalizedHref = normalizeHrefForParsing(channelHref);
    const handle = extractHandleFromString(channelText) || extractHandleFromString(normalizedHref);
    const id = extractChannelIdFromString(normalizedHref) || extractChannelIdFromString(channelText);
    const customUrl = extractCustomUrlFromPath(normalizedHref) || extractCustomUrlFromPath(channelHref);

    return { handle, id, customUrl };
}

function collectDatasetValues(element) {
    if (!element || !element.dataset) return '';
    return Object.values(element.dataset).join(' ');
}

function collectAttributeValues(element) {
    if (!element || typeof element.getAttributeNames !== 'function') return '';
    return element.getAttributeNames()
        .map(name => element.getAttribute(name))
        .filter(Boolean)
        .join(' ');
}

function scanDataForVideoId(root) {
    if (!root || typeof root !== 'object') return '';

    const directVideoId = root.videoId;
    if (typeof directVideoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(directVideoId)) {
        return directVideoId;
    }

    const directEncrypted = root.encryptedVideoId;
    if (typeof directEncrypted === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(directEncrypted)) {
        return directEncrypted;
    }

    const navWatchId = root?.navigationEndpoint?.watchEndpoint?.videoId;
    if (typeof navWatchId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(navWatchId)) {
        return navWatchId;
    }

    const watchId = root?.watchEndpoint?.videoId;
    if (typeof watchId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(watchId)) {
        return watchId;
    }

    const videos = Array.isArray(root.videos) ? root.videos : null;
    if (videos && videos.length > 0) {
        const first = videos[0];
        const nestedCandidates = [
            first?.childVideoRenderer?.videoId,
            first?.childVideoRenderer?.navigationEndpoint?.watchEndpoint?.videoId,
            first?.playlistVideoRenderer?.videoId,
            first?.playlistVideoRenderer?.navigationEndpoint?.watchEndpoint?.videoId,
            first?.videoRenderer?.videoId,
            first?.videoRenderer?.navigationEndpoint?.watchEndpoint?.videoId
        ];
        for (const candidate of nestedCandidates) {
            if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
                return candidate;
            }
        }
    }

    const updateItems = root?.updateKidsBlacklistEndpoint?.items;
    if (Array.isArray(updateItems) && updateItems.length > 0) {
        const candidate = updateItems[0]?.encryptedVideoId;
        if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
            return candidate;
        }
    }

    return '';
}

function scanDataForChannelIdentifiers(root) {
    const result = { handle: '', id: '', customUrl: '' };
    if (!root || typeof root !== 'object') return result;

    // Direct check on the object first (most common case)
    // Check for channelId, browseId (often channel ID), canonicalBaseUrl (often /channel/...)
    if (root.channelId) result.id = root.channelId;
    else if (root.externalChannelId && typeof root.externalChannelId === 'string' && root.externalChannelId.startsWith('UC')) {
        result.id = root.externalChannelId;
    }
    else if (root.kidsVideoOwnerExtension?.externalChannelId && typeof root.kidsVideoOwnerExtension.externalChannelId === 'string' && root.kidsVideoOwnerExtension.externalChannelId.startsWith('UC')) {
        result.id = root.kidsVideoOwnerExtension.externalChannelId;
    }
    else if (root.browseId && root.browseId.startsWith('UC')) result.id = root.browseId;

    if (root.canonicalBaseUrl) {
        if (root.canonicalBaseUrl.includes('/@')) {
            const handle = extractHandleFromString(root.canonicalBaseUrl);
            if (handle) result.handle = handle;
        } else {
            const custom = extractCustomUrlFromPath(root.canonicalBaseUrl);
            if (custom) result.customUrl = custom;
        }
    }

    if (result.id && (result.handle || result.customUrl)) return result;

    // Shallow scan of specific known properties to avoid deep recursion into related items
    // We explicitly avoid 'items', 'contents', 'results' which usually contain OTHER videos/channels
    const safeProperties = ['navigationEndpoint', 'command', 'browseEndpoint', 'urlEndpoint', 'owner', 'channelName', 'shortBylineText', 'longBylineText', 'runs', 'text'];

    for (const prop of safeProperties) {
        if (root[prop]) {
            const val = root[prop];
            if (typeof val === 'object') {
                // Check nested navigation endpoint
                if (val.browseId && val.browseId.startsWith('UC')) {
                    if (!result.id) result.id = val.browseId;
                }

                const url = val.url || (val.browseEndpoint && val.browseEndpoint.canonicalBaseUrl);
                if (url) {
                    if (url.includes('/@')) {
                        const handle = extractHandleFromString(url);
                        if (handle && !result.handle) result.handle = handle;
                    } else if (!result.customUrl) {
                        const custom = extractCustomUrlFromPath(url);
                        if (custom) result.customUrl = custom;
                    }
                }

                // Check text runs for handles
                if (Array.isArray(val)) {
                    for (const run of val) {
                        if (run.text && run.text.startsWith('@') && !result.handle) {
                            const normalized = normalizeHandleValue(run.text);
                            if (normalized) result.handle = normalized;
                        }
                        if (run.navigationEndpoint) {
                            const nav = run.navigationEndpoint;
                            if (nav.browseEndpoint) {
                                if (nav.browseEndpoint.browseId && nav.browseEndpoint.browseId.startsWith('UC') && !result.id) {
                                    result.id = nav.browseEndpoint.browseId;
                                }
                                if (nav.browseEndpoint.canonicalBaseUrl && !result.customUrl) {
                                    const custom = extractCustomUrlFromPath(nav.browseEndpoint.canonicalBaseUrl);
                                    if (custom) result.customUrl = custom;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return result;
}

function extractChannelMetadataFromElement(element, channelText = '', channelHref = '', options = {}) {
    const cacheTarget = options.cacheTarget || element || null;
    const relatedElements = Array.isArray(options.relatedElements) ? options.relatedElements.filter(Boolean) : [];

    if (!element && !cacheTarget && relatedElements.length === 0) {
        return buildChannelMetadata(channelText, channelHref);
    }

    const cacheSource = cacheTarget || element || relatedElements[0] || null;

    const cachedHandle = cacheSource?.getAttribute?.('data-filtertube-channel-handle');
    const cachedId = cacheSource?.getAttribute?.('data-filtertube-channel-id');

    const normalizedHref = normalizeHrefForParsing(channelHref);
    const hrefHandle = extractHandleFromString(normalizedHref) || extractHandleFromString(channelHref);
    const hrefId = extractChannelIdFromString(normalizedHref) || extractChannelIdFromString(channelHref);

    const normalizedCachedHandle = cachedHandle ? normalizeHandleValue(cachedHandle) : '';
    const isChannelIdHref = Boolean(hrefId && normalizedHref && normalizedHref.startsWith('/channel/'));
    const shouldTrustCachedHandle = Boolean(
        normalizedCachedHandle &&
        (!isChannelIdHref && (!hrefHandle || normalizedCachedHandle === normalizeHandleValue(hrefHandle)))
    );
    const shouldTrustCachedId = Boolean(
        cachedId &&
        (
            (hrefId && cachedId === hrefId) ||
            (!hrefId && !hrefHandle)
        )
    );

    if (cachedHandle && !shouldTrustCachedHandle) {
        cacheSource?.removeAttribute?.('data-filtertube-channel-handle');
    }
    if (cachedId && !shouldTrustCachedId) {
        cacheSource?.removeAttribute?.('data-filtertube-channel-id');
    }

    if (shouldTrustCachedHandle || shouldTrustCachedId) {
        // Still extract customUrl from href even when using cached handle/id
        const cachedMeta = buildChannelMetadata(channelText, channelHref);
        return {
            handle: shouldTrustCachedHandle ? normalizedCachedHandle : '',
            id: shouldTrustCachedId ? (cachedId || '') : '',
            customUrl: cachedMeta.customUrl || null
        };
    }

    const meta = buildChannelMetadata(channelText, channelHref);

    if (!meta.handle || !meta.id) {
        const valueSources = [...new Set([cacheTarget, ...relatedElements].filter(Boolean))];
        if (!cacheTarget || cacheTarget === element) {
            valueSources.unshift(element);
        }

        // Prevent false handle extraction from unrelated text (e.g., video titles mentioning @someone).
        // When we have explicit channel-related nodes (anchor/byline), only use those for handle discovery.
        const handleSources = (cacheTarget || relatedElements.length > 0)
            ? [...new Set([cacheTarget, ...relatedElements].filter(Boolean))]
            : valueSources;

        const datasetValues = valueSources
            .filter(src => src && src.dataset)
            .map(src => collectDatasetValues(src))
            .filter(Boolean)
            .join(' ');

        const datasetValuesForHandle = handleSources
            .filter(src => src && src.dataset)
            .map(src => collectDatasetValues(src))
            .filter(Boolean)
            .join(' ');

        const attributeValues = valueSources
            .filter(src => src)
            .map(src => collectAttributeValues(src))
            .filter(Boolean)
            .join(' ');

        const attributeValuesForHandle = handleSources
            .filter(src => src)
            .map(src => collectAttributeValues(src))
            .filter(Boolean)
            .join(' ');

        if (datasetValues) {
            if (!meta.handle) {
                const dsHandle = extractHandleFromString(datasetValuesForHandle);
                if (dsHandle) meta.handle = dsHandle;
            }
            if (!meta.id) {
                const dsId = extractChannelIdFromString(datasetValues);
                if (dsId) meta.id = dsId;
            }
        }

        if (attributeValues) {
            if (!meta.handle) {
                const attrHandle = extractHandleFromString(attributeValuesForHandle);
                if (attrHandle) meta.handle = attrHandle;
            }
            if (!meta.id) {
                const attrId = extractChannelIdFromString(attributeValues);
                if (attrId) meta.id = attrId;
            }
        }
    }

    if (!meta.handle || !meta.id) {
        const possibleSources = new Set();
        const addSource = source => {
            if (!source || typeof source !== 'object') return;
            if (source instanceof Element || source instanceof Node || source === window) return;
            possibleSources.add(source);
        };

        const potentialElements = [...new Set([element, cacheTarget, ...relatedElements].filter(Boolean))];

        potentialElements.forEach(el => {
            addSource(el?.data);
            addSource(el?.data?.data);
            addSource(el?.data?.content);
            addSource(el?.data?.metadata);
            addSource(el?.data?.renderer);
            addSource(el?.__data);
            addSource(el?.__data?.data);
            addSource(el?.__data?.content);
            addSource(el?.__data?.metadata);
            addSource(el?.__dataHost);
            addSource(el?.__dataHost?.data);
        });

        const parentCandidates = [
            cacheTarget?.closest?.('ytd-rich-item-renderer'),
            cacheTarget?.closest?.('ytd-video-renderer'),
            cacheTarget?.closest?.('ytd-playlist-renderer'),
            cacheTarget?.closest?.('ytd-radio-renderer'),
            cacheTarget?.closest?.('ytd-grid-video-renderer'),
            cacheTarget?.closest?.('yt-lockup-view-model'),
            cacheTarget?.closest?.('yt-lockup-metadata-view-model'),
            // Add specific check for channel page header
            cacheTarget?.closest?.('ytd-channel-name')
        ];

        parentCandidates.forEach(parent => {
            if (!parent) return;
            // Prioritize direct data properties
            if (parent.data) addSource(parent.data);
            if (parent.__data) addSource(parent.__data);

            // Only go deeper if it's a channel name renderer
            if (parent.tagName === 'YTD-CHANNEL-NAME') {
                addSource(parent.data?.channelName);
            }
        });

        for (const source of possibleSources) {
            const identifiers = scanDataForChannelIdentifiers(source);
            if (!meta.handle && identifiers.handle) meta.handle = identifiers.handle;
            if (!meta.id && identifiers.id) meta.id = identifiers.id;
            if (!meta.customUrl && identifiers.customUrl) meta.customUrl = identifiers.customUrl;
            if (meta.handle && meta.id && meta.customUrl) break;
        }
    }

    if (!meta.handle || !meta.id) {
        const anchorCandidates = new Set();
        const elementForAnchors = [...new Set([element, cacheTarget, ...relatedElements].filter(el => el && typeof el.querySelectorAll === 'function'))];

        elementForAnchors.forEach(el => {
            el.querySelectorAll('a[href]').forEach(anchor => anchorCandidates.add(anchor));
        });

        for (const anchor of anchorCandidates) {
            const href = anchor.getAttribute('href') || anchor.href || '';
            const normalizedHref = href ? normalizeHrefForParsing(href) : '';
            const isChannelLink = Boolean(normalizedHref && (
                normalizedHref.startsWith('/@') ||
                normalizedHref.startsWith('/channel/') ||
                normalizedHref.startsWith('/c/') ||
                normalizedHref.startsWith('/user/')
            ));

            if (href) {
                const idFromHref = extractChannelIdFromString(href) || extractChannelIdFromString(normalizedHref);
                if (!meta.id && idFromHref) {
                    meta.id = idFromHref;
                }

                const handleFromHref = isChannelLink
                    ? (extractHandleFromString(href) || extractHandleFromString(normalizedHref))
                    : '';

                if (handleFromHref) {
                    meta.handle = handleFromHref;
                }
            }

            if (isChannelLink) {
                // Extract customUrl for /c/ and /user/ type channels
                if (!meta.customUrl && normalizedHref) {
                    if (normalizedHref.startsWith('/c/')) {
                        const slug = normalizedHref.split('/')[2];
                        if (slug) meta.customUrl = `c/${slug.split('?')[0].split('#')[0]}`;
                    } else if (normalizedHref.startsWith('/user/')) {
                        const slug = normalizedHref.split('/')[2];
                        if (slug) meta.customUrl = `user/${slug.split('?')[0].split('#')[0]}`;
                    }
                }

                if (!meta.handle) {
                    const anchorDatasetValues = collectDatasetValues(anchor);
                    if (anchorDatasetValues) {
                        const dsHandle = extractHandleFromString(anchorDatasetValues);
                        if (dsHandle) meta.handle = dsHandle;
                    }
                }

                if (!meta.id) {
                    const anchorDatasetValues = collectDatasetValues(anchor);
                    if (anchorDatasetValues) {
                        const dsId = extractChannelIdFromString(anchorDatasetValues);
                        if (dsId) meta.id = dsId;
                    }
                }

                if (!meta.handle) {
                    const anchorAttributeValues = collectAttributeValues(anchor);
                    if (anchorAttributeValues) {
                        const attrHandle = extractHandleFromString(anchorAttributeValues);
                        if (attrHandle) meta.handle = attrHandle;
                    }
                }

                if (!meta.id) {
                    const anchorAttributeValues = collectAttributeValues(anchor);
                    if (anchorAttributeValues) {
                        const attrId = extractChannelIdFromString(anchorAttributeValues);
                        if (attrId) meta.id = attrId;
                    }
                }

                if (!meta.handle) {
                    const anchorText = anchor.textContent || '';
                    if (anchorText) {
                        const textHandle = extractHandleFromString(anchorText);
                        if (textHandle) meta.handle = textHandle;
                    }
                }
            }

            if (meta.handle && meta.id) break;
        }
    }

    if (!meta.handle) {
        const fallbackSources = [...new Set([channelText, cacheTarget?.innerText, element?.innerText, ...relatedElements.map(el => el?.innerText)].filter(Boolean))];
        for (const sourceText of fallbackSources) {
            const fallbackHandle = extractHandleFromString(sourceText);
            if (fallbackHandle) {
                meta.handle = fallbackHandle;
                break;
            }
        }
    }

    if (meta.handle) {
        meta.handle = normalizeHandleValue(meta.handle);
    }

    // Note: Channel IDs are case-sensitive and must NOT be lowercased
    // They typically start with "UC" in uppercase

    if (cacheSource) {
        if (meta.handle) {
            cacheSource.setAttribute('data-filtertube-channel-handle', meta.handle);
        } else {
            cacheSource.removeAttribute?.('data-filtertube-channel-handle');
        }

        if (meta.id) {
            cacheSource.setAttribute('data-filtertube-channel-id', meta.id);
        } else {
            cacheSource.removeAttribute?.('data-filtertube-channel-id');
        }
    }

    return meta;
}

function clearCachedChannelMetadata(root) {
    if (!root || typeof root.querySelectorAll !== 'function') {
        if (root?.removeAttribute) {
            root.removeAttribute('data-filtertube-channel-handle');
            root.removeAttribute('data-filtertube-channel-id');
        }
        return;
    }

    const targets = new Set([root]);
    root.querySelectorAll('[data-filtertube-channel-handle],[data-filtertube-channel-id]').forEach(el => targets.add(el));

    targets.forEach(el => {
        try {
            el.removeAttribute('data-filtertube-channel-handle');
            el.removeAttribute('data-filtertube-channel-id');
        } catch (e) {
            // ignore
        }
    });
}

// ============================================================================
// VIDEO ID EXTRACTION
// ============================================================================

/**
 * Extract video ID from a video card element
 * @param {Element} card - The video card element
 * @returns {string|null} - Video ID or null
 */
function extractVideoIdFromCard(card) {
    if (!card) return null;

    try {
        const tag = (card.tagName || '').toLowerCase();
        const isKidsHost = (() => {
            try {
                return tag.startsWith('ytk-') || String(location.hostname || '').includes('youtubekids.com');
            } catch (e) {
                return tag.startsWith('ytk-');
            }
        })();

        const extractFromHref = (href) => {
            if (!href || typeof href !== 'string') return null;
            const watchMatch = href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
            if (watchMatch) return watchMatch[1];
            const watchPathMatch = href.match(/\/watch\/([a-zA-Z0-9_-]{11})(?:[/?#]|$)/);
            if (watchPathMatch) return watchPathMatch[1];
            const shortsMatch = href.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (shortsMatch) return shortsMatch[1];
            const liveMatch = href.match(/\/live\/([a-zA-Z0-9_-]{11})/);
            if (liveMatch) return liveMatch[1];
            const embedMatch = href.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch) return embedMatch[1];
            return null;
        };

        const primaryHrefSelectors = [
            'a.yt-lockup-view-model__content-image[href*="watch?v="]',
            'a.yt-lockup-metadata-view-model__title[href*="watch?v="]',
            'a#thumbnail[href*="watch?v="]',
            'a#video-title[href*="watch?v="]',
            'h3 a[href*="watch?v="]'
        ];
        for (const selector of primaryHrefSelectors) {
            try {
                const a = card.querySelector(selector);
                const href = a?.getAttribute?.('href') || '';
                const match = extractFromHref(href);
                if (match) return match;
            } catch (e) {
            }
        }

        // On SPA surfaces (notably YouTube Kids), cards can be recycled and keep stale
        // data-filtertube-video-id attributes. Always prefer the current /watch?v=... href.
        if (isKidsHost) {
            try {
                const hrefAnchor = card.querySelector('a[href*="/watch?v="], a[href^="/watch?v="]');
                const href = hrefAnchor?.getAttribute('href') || '';
                const fromHref = extractFromHref(href);
                if (fromHref) {
                    return fromHref;
                }
            } catch (e) {
            }

            const stamped = card.getAttribute?.('data-filtertube-video-id') || '';
            if (stamped && /^[a-zA-Z0-9_-]{11}$/.test(stamped)) {
                return stamped;
            }
        }

        // YouTube Kids: anchor structure differs; scan all links aggressively.
        if (tag.startsWith('ytk-')) {
            const anchors = card.querySelectorAll('a[href]');
            for (const anchor of anchors) {
                const href = anchor.getAttribute('href') || '';
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 1: From thumbnail link href
        const thumbnailLink = card.querySelector('a#thumbnail[href*="watch?v="], a[href*="/watch?v="]');
        if (thumbnailLink) {
            const href = thumbnailLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 2: From video-title link
        const titleLink = card.querySelector('a#video-title[href*="watch?v="], a.yt-lockup-metadata-view-model__title[href*="watch?v="], a[href*="/watch?v="]');
        if (titleLink) {
            const href = titleLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 3: From any watch link in the card
        const anyWatchLink = card.querySelector('a[href*="/watch?v="]:not(.yt-core-attributed-string__link)');
        if (anyWatchLink) {
            const href = anyWatchLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        // Method 4: Shorts-style links
        const anyShortsLink = card.querySelector('a[href*="/shorts/"]');
        if (anyShortsLink) {
            const href = anyShortsLink.getAttribute('href');
            if (href) {
                const match = extractFromHref(href);
                if (match) return match;
            }
        }

        const datasetValues = collectDatasetValues(card);
        if (datasetValues) {
            const match = extractFromHref(datasetValues);
            if (match) return match;
        }

        const attrValues = collectAttributeValues(card);
        if (attrValues) {
            const match = extractFromHref(attrValues);
            if (match) return match;
        }

        const possibleSources = new Set();
        const addSource = source => {
            if (!source || typeof source !== 'object') return;
            if (source instanceof Element || source instanceof Node || source === window) return;
            possibleSources.add(source);
        };

        addSource(card?.data);
        addSource(card?.data?.data);
        addSource(card?.data?.content);
        addSource(card?.data?.metadata);
        addSource(card?.data?.renderer);
        addSource(card?.__data);
        addSource(card?.__data?.data);
        addSource(card?.__data?.content);
        addSource(card?.__data?.metadata);
        addSource(card?.__dataHost);
        addSource(card?.__dataHost?.data);

        for (const source of possibleSources) {
            const found = scanDataForVideoId(source);
            if (found) return found;
        }

        return null;
    } catch (error) {
        console.error('FilterTube: Error extracting video ID from card:', error);
        return null;
    }
}
