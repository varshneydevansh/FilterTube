// js/content_bridge.js - Isolated world script

console.log("FilterTube: content_bridge.js loaded (Isolated World)");

const IS_FIREFOX_BRIDGE = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI_BRIDGE = IS_FIREFOX_BRIDGE ? browser : chrome;

// Debug counter for tracking
let debugSequence = 0;
let currentSettings = null;
function debugLog(message, ...args) {
    debugSequence++;
    // console.log(`[${debugSequence}] FilterTube (Bridge ${IS_FIREFOX_BRIDGE ? 'Fx' : 'Cr'}):`, message, ...args);
}

// ==========================================
// ACTIVE RESOLVER - Fetches UC ID for @handles
// ==========================================
const resolvedHandleCache = new Map();

async function fetchIdForHandle(handle) {
    const cleanHandle = handle.toLowerCase().replace('@', '');
    if (!cleanHandle) return null;

    // If we already have a result, return it
    if (resolvedHandleCache.has(cleanHandle)) {
        return resolvedHandleCache.get(cleanHandle);
    }

    // Mark as pending to prevent Loop
    resolvedHandleCache.set(cleanHandle, 'PENDING');

    try {
        // console.log(`FilterTube: 🕵️ Actively resolving ID for @${cleanHandle}...`);
        const response = await fetch(`https://www.youtube.com/@${cleanHandle}/about`);
        const text = await response.text();

        const match = text.match(/channel\/(UC[\w-]{22})/);
        if (match && match[1]) {
            const id = match[1];

            // Update Cache
            resolvedHandleCache.set(cleanHandle, id);

            // Broadcast to Background (Permanent Storage)
            window.postMessage({
                type: 'FilterTube_UpdateChannelMap',
                payload: [{ id: id, handle: `@${cleanHandle}` }],
                source: 'content_bridge'
            }, '*');

            console.log(`FilterTube: ✅ Resolved @${cleanHandle} -> ${id}`);

            // DO NOT CALL applyDOMFallback HERE. 
            // The next scroll event or mutation observer will pick up the new cache value naturally.
            // This prevents the Infinite Loop.
            // Safe re-process: This triggers the filter again to hide the content immediately.
            // Because the cache is now set to the ID (not PENDING), the next pass won't fetch again.
            setTimeout(() => {
                if (typeof applyDOMFallback === 'function') {
                    applyDOMFallback(currentSettings, { forceReprocess: true });
                }
            }, 50);
            return id;
        }
    } catch (e) {
        console.warn(`FilterTube: Failed to resolve @${cleanHandle}`, e);
        resolvedHandleCache.delete(cleanHandle); // Delete so we can retry later if it was just a network blip
    }
    return null;
}

// Statistics tracking
let statsCountToday = 0;
let statsTotalSeconds = 0; // Track total seconds saved instead of using multiplier
let statsLastDate = new Date().toDateString();
let statsInitialized = false;

// Initialize stats from storage
function initializeStats() {
    if (statsInitialized || !chrome || !chrome.storage) return;
    statsInitialized = true;

    chrome.storage.local.get(['stats'], (result) => {
        const today = new Date().toDateString();
        if (result.stats && result.stats.lastDate === today) {
            // Same day, restore count and seconds
            statsCountToday = result.stats.hiddenCount || 0;
            statsTotalSeconds = result.stats.savedSeconds || 0;
            statsLastDate = result.stats.lastDate;
        } else {
            // New day or no stats, reset
            statsCountToday = 0;
            statsTotalSeconds = 0;
            statsLastDate = today;
        }
    });
}

/**
 * Extract video duration from element - UPDATED for YouTube 2025
 * @param {HTMLElement} element - The video element
 * @returns {number|null} Duration in seconds, or null if not found
 */
function extractVideoDuration(element) {
    if (!element) return null;

    // Check cache first
    const cached = element.getAttribute('data-filtertube-duration');
    if (cached !== null && cached !== '') {
        return parseInt(cached, 10);
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

/**
 * Determine content type from element
 * @param {HTMLElement} element - The content element
 * @returns {string} Content type: 'video', 'short', 'comment', 'chip', 'shelf', 'playlist', 'mix'
 */
function getContentType(element) {
    if (!element) return 'video';

    const tagName = element.tagName?.toLowerCase();

    // Shorts
    if (tagName === 'ytd-reel-item-renderer' ||
        tagName === 'ytd-shorts-lockup-view-model' ||
        element.closest('ytd-reel-shelf-renderer')) {
        return 'short';
    }

    // Comments
    if (tagName === 'ytd-comment-view-model' ||
        tagName === 'ytd-comment-renderer' ||
        tagName === 'ytd-comment-thread-renderer') {
        return 'comment';
    }

    // Chips (topic filters)
    if (tagName === 'yt-chip-cloud-chip-renderer' ||
        element.classList?.contains('chip')) {
        return 'chip';
    }

    // Playlists and Mixes (these are containers, not individual videos)
    if (tagName === 'ytd-playlist-renderer' ||
        tagName === 'ytd-radio-renderer' ||
        element.querySelector('[aria-label*="Mix"]') ||
        element.querySelector('[title*="Mix"]')) {
        return 'playlist';
    }

    // Shelves (containers)
    if (tagName === 'ytd-rich-section-renderer' ||
        tagName === 'ytd-shelf-renderer' ||
        tagName === 'ytd-rich-shelf-renderer' ||
        tagName === 'grid-shelf-view-model' ||
        element.classList?.contains('filtertube-hidden-shelf')) {
        return 'shelf';
    }

    // Default to video
    return 'video';
}

/**
 * Estimate time saved based on content type and duration
 * @param {string} contentType - Type of content
 * @param {number|null} duration - Video duration in seconds (if available)
 * @returns {number} Estimated seconds saved
 */
function estimateTimeSaved(contentType, duration = null) {
    // Don't count containers (they're just wrappers, not actual content)
    if (contentType === 'shelf' || contentType === 'playlist') return 0;

    // Comments and chips take minimal time to evaluate
    if (contentType === 'comment') return 1;
    if (contentType === 'chip') return 0.5;

    // Shorts: use actual duration if available, otherwise estimate
    if (contentType === 'short') {
        return duration && duration > 0 ? duration : 30; // Default 30 sec for shorts
    }

    // Videos: use actual duration when available
    if (contentType === 'video') {
        if (duration && duration > 0) {
            return duration; // Return the actual video duration
        }
        // Fallback estimate if no duration available
        return 180; // Default 3 minutes estimate
    }

    // Default fallback
    return 4;
}

/**
 * Increment hidden stats when content is hidden
 * @param {HTMLElement} element - The hidden element
 */
function incrementHiddenStats(element) {
    const today = new Date().toDateString();

    if (today !== statsLastDate) {
        statsCountToday = 0;
        statsTotalSeconds = 0;
        statsLastDate = today;
    }

    // Determine content type
    const contentType = getContentType(element);

    // 1. Extract Title
    const titleEl = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, yt-formatted-string#title, span#title');
    const title = titleEl?.textContent?.trim() || element.getAttribute('aria-label') || 'Unknown';

    // 2. IMMEDIATE REJECTIONS (Layout Cleanup)
    // If it's "Unknown", "Albums", or "Results with...", it is NOT a video.
    if (title === 'Unknown' || title === 'Albums' || title.startsWith('Results with') || title.startsWith('Results for')) {
        return;
    }

    // 3. CRITICAL: LINK CHECK
    // Real videos MUST have a link to watch them. Headers do not.
    // If it's not a short, and it doesn't have a watch link, ignore it.
    const hasVideoLink = element.querySelector('a[href*="/watch?"]');
    const hasShortsLink = element.querySelector('a[href*="/shorts/"]');

    if (contentType !== 'short' && !hasVideoLink && !hasShortsLink) {
        return; // It's a container/header, not a video
    }

    // 4. Ignore Container Types
    if (contentType === 'shelf' || contentType === 'playlist' || contentType === 'mix') {
        return;
    }

    // 5. Get Duration
    const duration = extractVideoDuration(element);
    let secondsSaved = 0;

    // Calculate time
    if (duration && duration > 0) {
        secondsSaved = duration;
    } else if (contentType === 'short' || hasShortsLink) {
        secondsSaved = 45; // Average short
    } else if (contentType === 'video') {
        secondsSaved = 180; // Fallback for videos
    }

    // Only increment if valid
    if (secondsSaved > 0) {
        statsCountToday++;
        statsTotalSeconds += secondsSaved;

        if (element) {
            element.setAttribute('data-filtertube-time-saved', secondsSaved.toString());
        }

        // Formatting for log
        const channelEl = element.querySelector('#channel-name a, .ytd-channel-name a, ytd-channel-name a');
        const channelInfo = element.getAttribute('data-filtertube-channel-handle') || channelEl?.textContent?.trim() || '';

        console.log(`FilterTube: Saved ${secondsSaved}s from "${title}"${channelInfo ? ' - ' + channelInfo : ''}`);

        saveStats();
    }
}

/**
 * Decrement hidden stats when content is unhidden
 * @param {HTMLElement} element - The unhidden element
 */
function decrementHiddenStats(element) {
    if (statsCountToday <= 0) return;

    // Get the time that was saved when this element was hidden
    const savedTime = parseFloat(element?.getAttribute('data-filtertube-time-saved') || '0');

    if (savedTime > 0) {
        statsCountToday = Math.max(0, statsCountToday - 1);
        statsTotalSeconds = Math.max(0, statsTotalSeconds - savedTime);

        // Remove the attribute
        if (element) {
            element.removeAttribute('data-filtertube-time-saved');
        }

        saveStats();
    }
}

/**
 * Save stats to storage
 */
function saveStats() {
    const minutesSaved = Math.floor(statsTotalSeconds / 60);

    if (chrome && chrome.storage) {
        chrome.storage.local.set({
            stats: {
                hiddenCount: statsCountToday,
                savedMinutes: minutesSaved,
                savedSeconds: statsTotalSeconds,
                lastDate: statsLastDate
            }
        });
    }
}


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

function handleMediaPlayback(element, shouldHide) {
    if (!element || typeof element.querySelectorAll !== 'function') return;

    const mediaElements = element.querySelectorAll('video, audio');
    mediaElements.forEach(media => {
        try {
            if (shouldHide) {
                if (!media.dataset.filtertubeStoredAutoplay && (media.autoplay || media.hasAttribute('autoplay'))) {
                    media.dataset.filtertubeStoredAutoplay = 'true';
                }
                if (typeof media.pause === 'function') {
                    media.pause();
                }
                media.autoplay = false;
            } else {
                if (media.dataset.filtertubeStoredAutoplay === 'true') {
                    media.autoplay = true;
                }
            }
        } catch (error) {
            debugLog('⚠️ Failed to adjust media playback', error);
        }
    });

    if (shouldHide) {
        const moviePlayer = element.querySelector('#movie_player');
        if (moviePlayer) {
            try {
                if (typeof moviePlayer.pauseVideo === 'function') {
                    moviePlayer.pauseVideo();
                } else if (typeof moviePlayer.stopVideo === 'function') {
                    moviePlayer.stopVideo();
                }
            } catch (error) {
                debugLog('⚠️ Failed to pause movie player', error);
            }
        }
    }
}

const CHANNEL_ONLY_TAGS = new Set([
    'ytd-universal-watch-card-renderer',
    'ytm-universal-watch-card-renderer'
]);

function extractHandleFromString(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/@([A-Za-z0-9._-]+)/);
    return match ? `@${match[1].toLowerCase()}` : '';
}

function extractChannelIdFromString(value) {
    if (!value || typeof value !== 'string') return '';
    const match = value.match(/UC[0-9A-Za-z_-]{22}/i);
    return match ? match[0].toLowerCase() : '';
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

function buildChannelMetadata(channelText = '', channelHref = '') {
    const normalizedHref = normalizeHrefForParsing(channelHref);
    const handle = extractHandleFromString(channelText) || extractHandleFromString(normalizedHref);
    const id = extractChannelIdFromString(normalizedHref) || extractChannelIdFromString(channelText);
    return { handle, id };
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

function scanDataForChannelIdentifiers(root) {
    const result = { handle: '', id: '' };
    if (!root || typeof root !== 'object') return result;

    // Direct check on the object first (most common case)
    // Check for channelId, browseId (often channel ID), canonicalBaseUrl (often /channel/...)
    if (root.channelId) result.id = root.channelId;
    else if (root.browseId && root.browseId.startsWith('UC')) result.id = root.browseId;

    if (root.canonicalBaseUrl && root.canonicalBaseUrl.includes('/@')) {
        const match = root.canonicalBaseUrl.match(/@([A-Za-z0-9._-]+)/);
        if (match) result.handle = `@${match[1].toLowerCase()}`;
    }

    if (result.id && result.handle) return result;

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
                if (val.url && val.url.includes('/@')) {
                    const match = val.url.match(/@([A-Za-z0-9._-]+)/);
                    if (match && !result.handle) result.handle = `@${match[1].toLowerCase()}`;
                }
                // Check text runs for handles
                if (Array.isArray(val)) {
                    for (const run of val) {
                        if (run.text && run.text.startsWith('@') && !result.handle) {
                            result.handle = run.text.toLowerCase();
                        }
                        if (run.navigationEndpoint) {
                            const nav = run.navigationEndpoint;
                            if (nav.browseEndpoint && nav.browseEndpoint.browseId && nav.browseEndpoint.browseId.startsWith('UC') && !result.id) {
                                result.id = nav.browseEndpoint.browseId;
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
    if ((cachedHandle && cachedHandle !== '') || (cachedId && cachedId !== '')) {
        return {
            handle: cachedHandle || '',
            id: cachedId || ''
        };
    }

    const meta = buildChannelMetadata(channelText, channelHref);

    if (!meta.handle || !meta.id) {
        const datasetValues = [...new Set([element, cacheTarget, ...relatedElements])]
            .filter(src => src && src.dataset)
            .map(src => collectDatasetValues(src))
            .filter(Boolean)
            .join(' ');

        const attributeValues = [...new Set([element, cacheTarget, ...relatedElements])]
            .filter(src => src)
            .map(src => collectAttributeValues(src))
            .filter(Boolean)
            .join(' ');

        if (datasetValues) {
            if (!meta.handle) {
                const dsHandle = extractHandleFromString(datasetValues);
                if (dsHandle) meta.handle = dsHandle;
            }
            if (!meta.id) {
                const dsId = extractChannelIdFromString(datasetValues);
                if (dsId) meta.id = dsId;
            }
        }

        if (attributeValues) {
            if (!meta.handle) {
                const attrHandle = extractHandleFromString(attributeValues);
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
            if (meta.handle && meta.id) break;
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
            if (href) {
                const normalizedHref = normalizeHrefForParsing(href);
                if (!meta.handle) {
                    const handleFromHref = extractHandleFromString(href) || extractHandleFromString(normalizedHref);
                    if (handleFromHref) meta.handle = handleFromHref;
                }
                if (!meta.id) {
                    const idFromHref = extractChannelIdFromString(href) || extractChannelIdFromString(normalizedHref);
                    if (idFromHref) meta.id = idFromHref;
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
        meta.handle = meta.handle.toLowerCase();
        if (!meta.handle.startsWith('@') && meta.handle) {
            meta.handle = `@${meta.handle.replace(/^@+/, '')}`;
        }
    }

    if (meta.id) {
        meta.id = meta.id.toLowerCase();
    }

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

function channelMatchesFilter(meta, filterChannel, channelMap = {}) {
    // Safety: Don't match against empty or invalid filters
    if (!filterChannel) return false;

    // Handle new object format: { name, id, handle }
    if (typeof filterChannel === 'object' && filterChannel !== null) {
        const filterId = (filterChannel.id || '').toLowerCase();
        const filterHandle = (filterChannel.handle || '').toLowerCase();

        // Safety: If both ID and handle are empty, don't match anything
        if (!filterId && !filterHandle) return false;

        // Direct match by UC ID
        if (filterId && meta.id && meta.id.toLowerCase() === filterId) {
            return true;
        }

        // Direct match by handle
        if (filterHandle && meta.handle && meta.handle.toLowerCase() === filterHandle) {
            return true;
        }

        // Cross-match using channelMap: blocking UC ID should also block its handle
        if (filterId && meta.handle) {
            const mappedHandle = channelMap[filterId];
            if (mappedHandle && meta.handle.toLowerCase() === mappedHandle) {
                return true;
            }
        }

        // Cross-match using channelMap: blocking handle should also block its UC ID
        if (filterHandle && meta.id) {
            const mappedId = channelMap[filterHandle];
            if (mappedId && meta.id.toLowerCase() === mappedId) {
                return true;
            }
        }

        return false;
    }

    // Legacy string format
    if (!filterChannel || typeof filterChannel !== 'string') return false;
    const normalized = filterChannel.trim().toLowerCase();
    if (!normalized) return false;

    // Direct handle match
    if (normalized.startsWith('@')) {
        if (meta.handle && meta.handle === normalized) {
            return true;
        }

        // Check channelMap: if filter is a handle, get its UC ID and match
        // Keep the @ in the key to match filter_logic.js convention
        const mappedId = channelMap[normalized];
        if (mappedId && meta.id && meta.id.toLowerCase() === mappedId) {
            return true;
        }
    }

    // Direct UC ID match
    if (normalized.startsWith('uc')) {
        if (meta.id && meta.id === normalized) {
            return true;
        }

        // Check channelMap: if filter is UC ID, also match its handle
        const mappedHandle = channelMap[normalized];
        if (mappedHandle && meta.handle && meta.handle.toLowerCase() === mappedHandle) {
            return true;
        }
    }

    // Reverse check: if meta has handle, check if mapped ID matches filter
    if (meta.handle && normalized.startsWith('uc')) {
        const handleLower = meta.handle.toLowerCase();
        const mappedId = channelMap[handleLower];
        if (mappedId && mappedId === normalized) {
            return true;
        }
    }

    return false;
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
// DOM MANIPULATION HELPERS (SOFT HIDE)
// ============================================================================

// Ensure CSS style for hiding exists
function ensureStyles() {
    if (!document.getElementById('filtertube-style')) {
        const style = document.createElement('style');
        style.id = 'filtertube-style';
        style.textContent = `
            .filtertube-hidden { display: none !important; }
            .filtertube-hidden-shelf { display: none !important; }
            /* Debugging aid (optional, can be toggled) */
            /* .filtertube-hidden { display: block !important; opacity: 0.1 !important; border: 2px solid red !important; } */
        `;
        document.head.appendChild(style);
    }
}

/**
 * Toggles visibility of an element using CSS classes.
 * This allows for immediate restoration without page reload.
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} shouldHide - Whether to hide the element
 * @param {string} reason - Debug reason for the toggle
 * @param {boolean} skipStats - If true, do not affect statistics (used for cleanup/containers)
 */
function toggleVisibility(element, shouldHide, reason = '', skipStats = false) {
    if (!element) return;

    if (shouldHide) {
        const wasAlreadyHidden = element.classList.contains('filtertube-hidden');

        if (!wasAlreadyHidden) {
            // IMPORTANT: Extract duration BEFORE hiding the element
            // This ensures we can access all DOM elements before any visual changes
            if (!skipStats) {
                const duration = extractVideoDuration(element);
            }

            // Now hide the element
            element.classList.add('filtertube-hidden');
            element.setAttribute('data-filtertube-hidden', 'true');
            // debugLog(`🚫 Hiding: ${reason}`);

            // Increment stats only for newly hidden items (not already hidden)
            // AND only if skipStats is false (meaning this is a direct filter hit, not a container cleanup)
            if (!skipStats) {
                incrementHiddenStats(element);
            }
        }
        handleMediaPlayback(element, true);
    } else {
        const wasHidden = element.classList.contains('filtertube-hidden');

        if (wasHidden) {
            element.classList.remove('filtertube-hidden');
            element.removeAttribute('data-filtertube-hidden');
            // debugLog(`✅ Restoring element`);

            // Decrement stats when unhiding content (only if we had counted it)
            if (!skipStats) {
                decrementHiddenStats(element);
            }
        }
        handleMediaPlayback(element, false);
    }
}

/**
 * Recursively checks if a container should be hidden because all its relevant children are hidden.
 */
function updateContainerVisibility(container, childSelector) {
    if (!container) return;
    if (container.hasAttribute('data-filtertube-hidden-by-shelf-title')) return;
    if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) return;

    const children = container.querySelectorAll(childSelector);
    if (children.length === 0) return; // Don't hide empty containers that might be loading

    // Check if all children are hidden
    const allHidden = Array.from(children).every(child =>
        child.classList.contains('filtertube-hidden') ||
        child.hasAttribute('data-filtertube-hidden') ||
        child.closest('.filtertube-hidden') !== null
    );

    if (allHidden) {
        container.classList.add('filtertube-hidden-shelf');
    } else {
        container.classList.remove('filtertube-hidden-shelf');
        if (container.classList.contains('filtertube-hidden')) {
            container.classList.remove('filtertube-hidden');
            container.removeAttribute('data-filtertube-hidden');
        }
    }
}

// ============================================================================
// FALLBACK FILTERING LOGIC
// ============================================================================

function handleCommentsFallback(settings) {
    const commentSections = document.querySelectorAll('#comments, ytd-comments, ytd-item-section-renderer[section-identifier="comment-item-section"], ytd-comment-thread-renderer');

    commentSections.forEach(section => {
        // 1. Global Hide
        if (settings.hideAllComments) {
            toggleVisibility(section, true, 'Hide All Comments');
            return;
        }

        // 2. Restore if global hide disabled
        if (!settings.filterComments && !settings.hideAllComments) {
            toggleVisibility(section, false);

            // Also restore all individual comments that were hidden by keyword filtering
            const comments = section.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer');
            comments.forEach(comment => {
                toggleVisibility(comment, false);
            });
        }

        // 3. Content Filtering
        if (settings.filterComments && settings.filterKeywords?.length > 0) {
            const comments = section.querySelectorAll('ytd-comment-view-model, ytd-comment-renderer, ytd-comment-thread-renderer');
            let visibleCount = 0;

            comments.forEach(comment => {
                const commentText = comment.textContent || '';
                const channelName = comment.querySelector('#author-text, #channel-name, yt-formatted-string')?.textContent || '';

                const shouldHide = shouldHideContent(commentText, channelName, settings);
                toggleVisibility(comment, shouldHide, 'Comment Filter');

                if (!shouldHide) visibleCount++;
            });
        }
    });
}

// DOM fallback function that processes already-rendered content
function applyDOMFallback(settings, options = {}) {
    const effectiveSettings = settings || currentSettings;
    if (!effectiveSettings || typeof effectiveSettings !== 'object') return;

    currentSettings = effectiveSettings;

    const { forceReprocess = false, preserveScroll = true } = options;

    // Removed diagnostic logging - issue identified and fixed
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const previousScrollTop = scrollingElement ? scrollingElement.scrollTop : window.pageYOffset;
    const previousScrollLeft = scrollingElement ? scrollingElement.scrollLeft : window.pageXOffset;
    ensureStyles();

    // 1. Video/Content Filtering
    const VIDEO_SELECTORS = [
        'ytd-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-compact-video-renderer',
        'ytd-reel-item-renderer',
        'ytd-playlist-renderer',
        'ytd-radio-renderer',
        'yt-lockup-view-model',
        'yt-lockup-metadata-view-model',
        'ytd-channel-renderer',
        'ytd-grid-channel-renderer',
        'ytd-rich-grid-media',
        'ytd-universal-watch-card-renderer',
        'ytd-channel-video-player-renderer',
        'ytd-channel-featured-content-renderer'
    ].join(', ');

    const elements = document.querySelectorAll(VIDEO_SELECTORS);

    elements.forEach(element => {
        // Optimization: Skip if already processed and not forced
        if (!forceReprocess && element.hasAttribute('data-filtertube-processed')) {
            // Skip already processed elements to avoid duplicate counting
            return;
        }

        // Extract Metadata
        const titleElement = element.querySelector('#video-title, .ytd-video-meta-block #video-title, h3 a, .metadata-snippet-container #video-title, #video-title-link, .yt-lockup-metadata-view-model-wiz__title, .yt-lockup-metadata-view-model__title, .yt-lockup-metadata-view-model__heading-reset, yt-formatted-string#title, span#title');
        const channelElement = element.querySelector('#channel-name a, .ytd-channel-name a, ytd-channel-name a, #text, .ytd-video-owner-renderer a, .yt-lockup-metadata-view-model-wiz__metadata, .yt-content-metadata-view-model__metadata-text, yt-formatted-string[slot="subtitle"], .watch-card-tertiary-text a');
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
        const channel = [channelPrimaryText, channelSubtitleText].filter(Boolean).join(' | ');
        const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
        const relatedElements = [channelAnchor, channelElement, channelSubtitleElement];
        const channelMeta = extractChannelMetadataFromElement(element, channel, channelHref, {
            cacheTarget: channelAnchor || element,
            relatedElements
        });

        // Determine Visibility
        const elementTag = element.tagName.toLowerCase();
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
            channelMeta
        });

        // Handle Container Logic (e.g., rich-grid-media inside rich-item)
        let targetToHide = element;
        if (elementTag === 'ytd-rich-grid-media') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        } else if (elementTag === 'yt-lockup-view-model' || elementTag === 'yt-lockup-metadata-view-model') {
            const parent = element.closest('ytd-rich-item-renderer');
            if (parent) targetToHide = parent;
        }

        let hideReason = `Content: ${title}`;
        let shouldHide = matchesFilters;

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

        const channelAnchor = element.querySelector('a[href*="/channel"], a[href^="/@"], a[href*="/user/"], a[href*="/c/"]');
        const channelText = channelAnchor?.textContent?.trim() || '';
        const channelHref = channelAnchor?.getAttribute('href') || channelAnchor?.href || '';
        const channelMeta = extractChannelMetadataFromElement(element, channelText, channelHref, {
            cacheTarget: channelAnchor || element
        });

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
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings, options = {}) {
    if (!title && !channel) return false;

    const { skipKeywords = false, channelHref = '', channelMeta: providedChannelMeta = null } = options;
    const channelMeta = providedChannelMeta || buildChannelMetadata(channel, channelHref);
    const hasChannelIdentity = Boolean(channelMeta.handle || channelMeta.id);

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

    // Channel filtering
    if (settings.filterChannels && settings.filterChannels.length > 0 && hasChannelIdentity) {
        const channelMap = settings.channelMap || {};

        // 1. Normal Check (Fast path - direct match or existing channelMap lookup)
        for (const filterChannel of settings.filterChannels) {
            if (channelMatchesFilter(channelMeta, filterChannel, channelMap)) {
                if (debugFiltering) {
                    console.log(`FilterTube DEBUG: MATCH FOUND! Video will be hidden.`, {
                        title: title.substring(0, 50),
                        videoChannel: channelMeta,
                        matchedFilter: filterChannel
                    });
                }
                return true;
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

// ============================================================================
// COMMUNICATION & INIT
// ============================================================================

browserAPI_BRIDGE.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request) return;

    if (request.action === 'FilterTube_RefreshNow') {
        debugLog('🔄 Refresh requested via runtime messaging');
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
        sendResponse?.({ acknowledged: true });
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        debugLog('⚡ Applying settings pushed from UI');
        sendSettingsToMainWorld(request.settings);
        applyDOMFallback(request.settings, { forceReprocess: true });
        sendResponse?.({ acknowledged: true });
    }
});

let scriptsInjected = false;
let injectionInProgress = false;
let pendingSeedSettings = null;
let seedListenerAttached = false;

async function injectMainWorldScripts() {
    if (scriptsInjected || injectionInProgress) return;
    injectionInProgress = true;

    const scriptsToInject = ['filter_logic'];
    if (IS_FIREFOX_BRIDGE) scriptsToInject.push('seed');
    scriptsToInject.push('injector');

    try {
        if (!IS_FIREFOX_BRIDGE && browserAPI_BRIDGE.scripting?.executeScript) {
            await injectViaScriptingAPI(scriptsToInject);
        } else {
            await injectViaFallback(scriptsToInject);
        }
        scriptsInjected = true;
        setTimeout(() => requestSettingsFromBackground(), 100);
    } catch (error) {
        debugLog("❌ Script injection failed:", error);
        injectionInProgress = false;
    }
    injectionInProgress = false;
}

async function injectViaScriptingAPI(scripts) {
    return new Promise((resolve, reject) => {
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "injectScripts",
            scripts: scripts
        }, (response) => {
            if (browserAPI_BRIDGE.runtime.lastError || !response?.success) {
                reject(new Error(browserAPI_BRIDGE.runtime.lastError?.message || response?.error));
            } else {
                resolve();
            }
        });
    });
}

async function injectViaFallback(scripts) {
    return new Promise((resolve) => {
        let currentIndex = 0;
        function injectNext() {
            if (currentIndex >= scripts.length) {
                resolve();
                return;
            }
            const scriptName = scripts[currentIndex];
            const script = document.createElement('script');
            script.src = browserAPI_BRIDGE.runtime.getURL(`js/${scriptName}.js`);
            script.onload = () => {
                currentIndex++;
                setTimeout(injectNext, 50);
            };
            (document.head || document.documentElement).appendChild(script);
        }
        injectNext();
    });
}

function requestSettingsFromBackground() {
    return new Promise((resolve) => {
        browserAPI_BRIDGE.runtime.sendMessage({ action: "getCompiledSettings" }, (response) => {
            if (response && !response.error) {
                sendSettingsToMainWorld(response);
                resolve({ success: true, settings: response });
            } else {
                resolve({ success: false });
            }
        });
    });
}

function tryApplySettingsToSeed(settings) {
    if (window.filterTube?.updateSettings) {
        try {
            window.filterTube.updateSettings(settings);
            pendingSeedSettings = null;
            return true;
        } catch (error) {
            debugLog('❌ Failed to forward settings to seed.js:', error);
        }
    }
    return false;
}

function ensureSeedReadyListener() {
    if (seedListenerAttached) return;
    seedListenerAttached = true;
    window.addEventListener('filterTubeSeedReady', () => {
        if (pendingSeedSettings) {
            tryApplySettingsToSeed(pendingSeedSettings);
        }
    });
}

function scheduleSeedRetry() {
    setTimeout(() => {
        if (pendingSeedSettings) {
            if (!tryApplySettingsToSeed(pendingSeedSettings)) {
                scheduleSeedRetry();
            }
        }
    }, 250);
}

function sendSettingsToMainWorld(settings) {
    latestSettings = settings;
    currentSettings = settings;
    window.postMessage({
        type: 'FilterTube_SettingsToInjector',
        payload: settings,
        source: 'content_bridge'
    }, '*');

    if (!tryApplySettingsToSeed(settings)) {
        pendingSeedSettings = settings;
        ensureSeedReadyListener();
        scheduleSeedRetry();
    }
}

function handleMainWorldMessages(event) {
    if (event.source !== window || !event.data?.type?.startsWith('FilterTube_')) return;
    if (event.data.source === 'content_bridge') return;

    const { type, payload } = event.data;
    if (type === 'FilterTube_InjectorToBridge_Ready') {
        requestSettingsFromBackground();
    } else if (type === 'FilterTube_Refresh') {
        requestSettingsFromBackground().then(result => {
            if (result?.success) applyDOMFallback(result.settings, { forceReprocess: true });
        });
    } else if (type === 'FilterTube_UpdateChannelMap') {
        // Forward learned channel mappings to background for persistence
        browserAPI_BRIDGE.runtime.sendMessage({
            action: "updateChannelMap",
            mappings: payload
        });
    }
}

function handleStorageChanges(changes, area) {
    if (area !== 'local') return;
    const relevantKeys = ['filterKeywords', 'filterChannels', 'uiChannels', 'channelMap', 'hideAllComments', 'filterComments', 'hideAllShorts'];
    if (Object.keys(changes).some(key => relevantKeys.includes(key))) {
        // FIX: Apply changes IMMEDIATELY without debounce
        requestSettingsFromBackground().then(result => {
            if (result?.success) {
                // Force immediate reprocess with no scroll preservation for instant feedback
                applyDOMFallback(result.settings, { forceReprocess: true });
            }
        });
    }
}

async function initialize() {
    try {
        initializeStats(); // Initialize statistics tracking
        await injectMainWorldScripts();
        const response = await requestSettingsFromBackground();
        if (response?.success) {
            initializeDOMFallback(response.settings);
        }
    } catch (error) {
        debugLog('❌ Error during initialization:', error);
    }
}

async function initializeDOMFallback(settings) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!settings) {
        const response = await requestSettingsFromBackground();
        settings = response?.settings;
    }
    if (settings) {
        applyDOMFallback(settings);

        // Set up a mutation observer to handle dynamic loading
        // We use a debounced version of the fallback to prevent performance issues
        const debouncedFallback = debounce(() => {
            applyDOMFallback(null);
        }, 200);

        let immediateFallbackScheduled = false;
        function scheduleImmediateFallback() {
            if (immediateFallbackScheduled) return;
            immediateFallbackScheduled = true;
            requestAnimationFrame(() => {
                immediateFallbackScheduled = false;
                applyDOMFallback(null);
            });
        }

        const observer = new MutationObserver(mutations => {
            let hasNewContent = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    hasNewContent = true;
                    break;
                }
            }

            if (hasNewContent) {
                scheduleImmediateFallback();
            } else {
                debouncedFallback();
            }
        });
        const observeTarget = () => {
            const target = document.body || document.documentElement;
            if (!target) return false;
            observer.observe(target, { childList: true, subtree: true });
            return true;
        };

        if (!observeTarget()) {
            document.addEventListener('DOMContentLoaded', () => {
                if (!observeTarget()) return;
                scheduleImmediateFallback();
            }, { once: true });
        }
    }
}

// Debounce helper
function debounce(func, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
            timeoutId = null;
        }, delay);
    };
}

// ==========================================
// 3-DOT MENU - BLOCK CHANNEL FEATURE
// ==========================================

/**
 * Recursively search ytInitialData for channel info associated with a video ID
 * @param {string} videoId - The YouTube video ID to search for
 * @returns {Object|null} - {handle, name} or {id, name} or null
 */
function searchYtInitialDataForVideoChannel(videoId) {
    if (!window.ytInitialData || !videoId) {
        console.log('FilterTube: ytInitialData search skipped - no data or videoId');
        return null;
    }

    console.log('FilterTube: Searching ytInitialData for video:', videoId);
    let foundVideoObject = false;

    // Recursively search for video ID and associated channel browse endpoint
    function searchObject(obj, path = '') {
        if (!obj || typeof obj !== 'object') return null;

        // Check if this object contains our video ID
        if (obj.videoId === videoId) {
            foundVideoObject = true;
            console.log('FilterTube: Found video object at path:', path);
            console.log('FilterTube: Video object keys:', Object.keys(obj));

            // Look for browseEndpoint with channel or @handle
            if (obj.navigationEndpoint?.browseEndpoint?.browseId) {
                const browseId = obj.navigationEndpoint.browseEndpoint.browseId;
                const canonicalBaseUrl = obj.navigationEndpoint.browseEndpoint.canonicalBaseUrl;

                console.log('FilterTube: Found navigationEndpoint:', { browseId, canonicalBaseUrl });

                // Extract handle from canonicalBaseUrl
                if (canonicalBaseUrl) {
                    const handleMatch = canonicalBaseUrl.match(/@([\w-]+)/);
                    if (handleMatch) {
                        console.log('FilterTube: Extracted handle from navigationEndpoint:', `@${handleMatch[1]}`);
                        return { handle: `@${handleMatch[1]}`, name: undefined };
                    }
                }

                // If browseId is a channel ID (starts with UC)
                if (browseId?.startsWith('UC')) {
                    console.log('FilterTube: Extracted UC ID from navigationEndpoint:', browseId);
                    return { id: browseId, name: undefined };
                }
            }

            // Check for ownerBadges (indicates we're in the right object)
            if (obj.ownerBadges || obj.shortBylineText || obj.longBylineText) {
                console.log('FilterTube: Found byline/owner info');
                // Look for channel info in byline text
                const bylineText = obj.shortBylineText || obj.longBylineText;
                if (bylineText?.runs) {
                    console.log('FilterTube: Checking byline runs:', bylineText.runs.length);
                    for (const run of bylineText.runs) {
                        if (run.navigationEndpoint?.browseEndpoint) {
                            const browseId = run.navigationEndpoint.browseEndpoint.browseId;
                            const canonicalBaseUrl = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
                            const name = run.text;

                            console.log('FilterTube: Found byline endpoint:', { browseId, canonicalBaseUrl, name });

                            if (canonicalBaseUrl) {
                                const handleMatch = canonicalBaseUrl.match(/@([\w-]+)/);
                                if (handleMatch) {
                                    console.log('FilterTube: Extracted handle from byline:', `@${handleMatch[1]}`);
                                    return { handle: `@${handleMatch[1]}`, name };
                                }
                            }
                            if (browseId?.startsWith('UC')) {
                                console.log('FilterTube: Extracted UC ID from byline:', browseId);
                                return { id: browseId, name };
                            }
                        }
                    }
                }
            }
        }

        // Recursively search nested objects and arrays
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const result = searchObject(obj[i], `${path}[${i}]`);
                if (result) return result;
            }
        } else {
            for (const key in obj) {
                const result = searchObject(obj[key], `${path}.${key}`);
                if (result) return result;
            }
        }

        return null;
    }

    const result = searchObject(window.ytInitialData);

    if (!foundVideoObject) {
        console.warn('FilterTube: Video ID not found in ytInitialData:', videoId);
    } else if (!result) {
        console.warn('FilterTube: Video found but no channel info extracted for:', videoId);
    }

    return result;
}

/**
 * Fetch channel information from a shorts URL
 * @param {string} videoId - The shorts video ID
 * @returns {Promise<Object|null>} - {handle, name} or null
 */
async function fetchChannelFromShortsUrl(videoId) {
    // Check if there's already a pending fetch for this video
    if (pendingShortsFetches.has(videoId)) {
        console.log('FilterTube: Reusing existing fetch for shorts video:', videoId);
        return await pendingShortsFetches.get(videoId);
    }

    // Create new fetch promise
    const fetchPromise = (async () => {
        try {
            console.log('FilterTube: Fetching shorts page for video:', videoId);
            const response = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'text/html'
                }
            });

            if (!response.ok) {
                console.error('FilterTube: Failed to fetch shorts page:', response.status);
                return null;
            }

            const html = await response.text();

            // Method 1: Extract from ytInitialData JSON in the HTML
            const ytInitialDataMatch = html.match(/var ytInitialData = ({.+?});/);
            if (ytInitialDataMatch) {
                try {
                    const ytInitialData = JSON.parse(ytInitialDataMatch[1]);

                    // Look for channel info in various locations
                    const engagementPanels = ytInitialData?.engagementPanels;
                    const overlay = ytInitialData?.overlay?.reelPlayerOverlayRenderer;
                    const contents = ytInitialData?.contents;

                    // Try to find channel info in engagement panels (common location)
                    if (engagementPanels && Array.isArray(engagementPanels)) {
                        for (const panel of engagementPanels) {
                            const header = panel?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer;
                            if (header?.menu?.menuRenderer?.items) {
                                for (const item of header.menu.menuRenderer.items) {
                                    const endpoint = item?.menuNavigationItemRenderer?.navigationEndpoint?.browseEndpoint;
                                    if (endpoint?.browseId && endpoint?.canonicalBaseUrl) {
                                        const handle = endpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                                        console.log('FilterTube: Found channel in ytInitialData (engagement panel):', handle);
                                        return { handle, name: '' };
                                    }
                                }
                            }
                        }
                    }

                    // Try overlay data
                    if (overlay?.reelPlayerHeaderSupportedRenderers?.reelPlayerHeaderRenderer) {
                        const headerRenderer = overlay.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer;
                        const channelNavEndpoint = headerRenderer?.channelNavigationEndpoint?.browseEndpoint;
                        if (channelNavEndpoint?.browseId && channelNavEndpoint?.canonicalBaseUrl) {
                            const handle = channelNavEndpoint.canonicalBaseUrl.replace('/user/', '@').replace(/^\//, '');
                            console.log('FilterTube: Found channel in ytInitialData (overlay):', handle);
                            return { handle, name: headerRenderer.channelTitleText?.runs?.[0]?.text || '' };
                        }
                    }
                } catch (e) {
                    console.warn('FilterTube: Failed to parse ytInitialData from shorts page:', e);
                }
            }

            // Method 2: Extract from meta tags
            const channelUrlMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/@([\w-]+)"/);
            if (channelUrlMatch) {
                const handle = `@${channelUrlMatch[1]}`;
                console.log('FilterTube: Found channel in canonical link:', handle);
                return { handle, name: '' };
            }

            // Method 3: Extract from page owner link
            const ownerLinkMatch = html.match(/<link itemprop="url" href="https?:\/\/www\.youtube\.com\/@([\w-]+)">/);
            if (ownerLinkMatch) {
                const handle = `@${ownerLinkMatch[1]}`;
                console.log('FilterTube: Found channel in owner link:', handle);
                return { handle, name: '' };
            }

            console.warn('FilterTube: Could not extract channel info from shorts page');
            return null;
        } catch (error) {
            console.error('FilterTube: Error fetching shorts page:', error);
            return null;
        } finally {
            // Clean up pending fetch
            pendingShortsFetches.delete(videoId);
        }
    })();

    // Store the promise
    pendingShortsFetches.set(videoId, fetchPromise);

    return await fetchPromise;
}

/**
 * Extract channel information from a video/short card
 * @param {Element} card - The video or short card element
 * @returns {Object|null|Promise<Object|null>} - {id, handle, name}, {videoId, needsFetch: true}, or null
 */
function extractChannelFromCard(card) {
    if (!card) return null;

    try {
        // SPECIAL CASE: Detect if this is a Shorts card
        const isShortsCard = card.querySelector('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, .reel-item-endpoint');

        if (isShortsCard) {
            console.log('FilterTube: Detected SHORTS card, using special extraction');

            // Method 1: Try data-filtertube attributes added by filter_logic.js
            const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
                card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
            const dataId = card.getAttribute('data-filtertube-channel-id') ||
                card.querySelector('[data-filtertube-channel-id]')?.getAttribute('data-filtertube-channel-id');

            if (dataHandle || dataId) {
                console.log('FilterTube: Found SHORTS channel from data attributes:', { handle: dataHandle, id: dataId });
                return { handle: dataHandle, id: dataId, name: undefined };
            }

            // Method 2: Try to find channel link in DOM
            const shortsChannelLink = card.querySelector(
                'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' +
                'ytm-shorts-lockup-view-model a[href*="/@"], ' +
                '.shortsLockupViewModelHostOutsideMetadata a[href*="/@"], ' +
                'a.yt-simple-endpoint[href*="/@"]'
            );

            if (shortsChannelLink) {
                const href = shortsChannelLink.getAttribute('href');
                const handleMatch = href?.match(/@([\w-]+)/);
                if (handleMatch) {
                    const handle = `@${handleMatch[1]}`;
                    const name = shortsChannelLink.textContent?.trim();
                    console.log('FilterTube: Extracted from SHORTS DOM link:', { handle, name });
                    return { handle, name };
                }
            }

            // Method 3: Extract from shorts URL (fetch the page)
            console.log('FilterTube: Attempting to extract channel from shorts URL');
            const shortsLink = card.querySelector('a[href*="/shorts/"]');
            if (shortsLink) {
                const href = shortsLink.getAttribute('href');
                const videoIdMatch = href?.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
                if (videoIdMatch) {
                    const videoId = videoIdMatch[1];
                    console.log('FilterTube: Extracted shorts video ID:', videoId);
                    // Return a promise marker - we'll need to handle this async
                    return { videoId, needsFetch: true };
                }
            }

            console.warn('FilterTube: SHORTS card detected but no channel info found in card - skipping menu injection');
            // Return null - we can't block without channel info
            return null;
        }

        // Method 1: Check for data attributes (added by FilterTube's own processing)
        const dataHandle = card.getAttribute('data-filtertube-channel-handle') ||
            card.querySelector('[data-filtertube-channel-handle]')?.getAttribute('data-filtertube-channel-handle');
        if (dataHandle) {
            const name = card.querySelector('#channel-name, ytd-channel-name, .channel-name')?.textContent?.trim();
            console.log('FilterTube: Extracted from data attribute:', { handle: dataHandle, name });
            return { handle: dataHandle, name };
        }

        // Method 2: Find ANY link with channel info (comprehensive selectors)
        const channelLink = card.querySelector(
            'a[href*="/@"]:not([href*="/shorts"]), ' +  // Not a shorts link
            'a[href*="/channel/"], ' +
            '#avatar-link, ' +
            '#channel-info a, ' +
            '#metadata a[href^="/@"], ' +
            '.ytd-channel-name a, ' +
            'ytd-channel-name a, ' +
            '#owner a, ' +
            '#channel-thumbnail, ' +
            '.reel-item-endpoint a[href*="/@"]'
        );

        if (channelLink) {
            const href = channelLink.getAttribute('href');
            if (href) {
                // Extract @handle
                const handleMatch = href.match(/@([\w-]+)/);
                if (handleMatch) {
                    const handle = `@${handleMatch[1]}`;
                    // Try multiple selectors for channel name
                    const channelName = channelLink.textContent?.trim() ||
                        card.querySelector('#channel-name, ytd-channel-name, .ytd-channel-name, #text, .channel-name')?.textContent?.trim();
                    console.log('FilterTube: Extracted from link:', { handle, name: channelName });
                    return { handle, name: channelName };
                }

                // Extract UC ID
                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    const id = ucMatch[1];
                    const channelName = channelLink.textContent?.trim() ||
                        card.querySelector('#channel-name, ytd-channel-name, .ytd-channel-name')?.textContent?.trim();
                    console.log('FilterTube: Extracted from link (UC):', { id, name: channelName });
                    return { id, name: channelName };
                }
            }
        }

        // Method 3: Fallback - search deeper in metadata
        const channelNameEl = card.querySelector(
            '#channel-name .yt-simple-endpoint, ' +
            'ytd-channel-name a, ' +
            '.ytd-channel-name a, ' +
            '#owner-name a, ' +
            '#metadata #channel-name a'
        );

        if (channelNameEl) {
            const href = channelNameEl.getAttribute('href');
            const name = channelNameEl.textContent?.trim();

            if (href) {
                const handleMatch = href.match(/@([\w-]+)/);
                if (handleMatch) {
                    console.log('FilterTube: Extracted from metadata:', { handle: `@${handleMatch[1]}`, name });
                    return { handle: `@${handleMatch[1]}`, name };
                }

                const ucMatch = href.match(/\/(UC[\w-]{22})/);
                if (ucMatch) {
                    console.log('FilterTube: Extracted from metadata (UC):', { id: ucMatch[1], name });
                    return { id: ucMatch[1], name };
                }
            }
        }

        // Debug: Log card structure to help identify missing selectors
        console.warn('FilterTube: Failed to extract channel. Card type:', card.tagName,
            'Is Shorts?:', !!isShortsCard,
            'Card HTML:', card.outerHTML.substring(0, 2000));

    } catch (error) {
        console.error('FilterTube: Error extracting channel from card:', error);
    }

    return null;
}

/**
 * Inject "Block Channel" menu item into 3-dot dropdown
 * @param {Element} dropdown - The dropdown menu element
 * @param {Element} videoCard - The video/short card that was clicked
 */
async function injectFilterTubeMenuItem(dropdown, videoCard) {
    if (!dropdown || !videoCard) return;

    // ALWAYS remove old FilterTube items first (prevents stale UI from previous videos)
    const oldItems = dropdown.querySelectorAll('.filtertube-block-channel-item');
    if (oldItems.length > 0) {
        console.log('FilterTube: Removing', oldItems.length, 'old menu items');
        oldItems.forEach(item => item.remove());
    }

    // Extract initial channel info (synchronous from DOM)
    let initialChannelInfo = extractChannelFromCard(videoCard);
    if (!initialChannelInfo) {
        console.log('FilterTube: Could not extract channel info from card');
        return;
    }

    console.log('FilterTube: Initial channel info:', initialChannelInfo);

    // Wait for menu to be populated by YouTube (with timeout)
    const waitForMenu = () => {
        return new Promise((resolve) => {
            const checkMenu = () => {
                // Detect menu structure type (new vs old) - COMPREHENSIVE DETECTION
                const newMenuList = dropdown.querySelector('yt-list-view-model');
                const oldMenuList = dropdown.querySelector(
                    'tp-yt-paper-listbox, ' +
                    'ytd-menu-popup-renderer, ' +
                    'ytd-menu-service-item-renderer, ' +
                    '#items.ytd-menu-popup-renderer, ' +
                    '#items.style-scope.ytd-menu-popup-renderer'
                );

                if (newMenuList || oldMenuList) {
                    console.log('FilterTube: Menu detected - newMenuList:', !!newMenuList, 'oldMenuList:', !!oldMenuList);
                    resolve({ newMenuList, oldMenuList });
                    return true;
                }
                return false;
            };

            // Try immediately first
            if (checkMenu()) return;

            // If not found, observe for menu to be added
            console.log('FilterTube: Menu not ready, waiting for YouTube to populate...');
            let attempts = 0;
            const maxAttempts = 20; // 2 seconds max wait

            const observer = new MutationObserver(() => {
                attempts++;
                if (checkMenu()) {
                    observer.disconnect();
                } else if (attempts >= maxAttempts) {
                    console.warn('FilterTube: Menu not populated after waiting, giving up');
                    console.log('FilterTube: Dropdown HTML:', dropdown.innerHTML.substring(0, 500));
                    observer.disconnect();
                    resolve({ newMenuList: null, oldMenuList: null });
                }
            });

            observer.observe(dropdown, { childList: true, subtree: true });

            // Also set a timeout as backup
            setTimeout(() => {
                observer.disconnect();
                const result = checkMenu();
                if (!result) {
                    console.warn('FilterTube: Timeout waiting for menu');
                    resolve({ newMenuList: null, oldMenuList: null });
                }
            }, 2000);
        });
    };

    // Wait for menu to be ready
    const { newMenuList, oldMenuList } = await waitForMenu();

    // IMMEDIATELY inject menu item with initial info (instant UI feedback)
    if (newMenuList) {
        console.log('FilterTube: Detected NEW menu structure - injecting immediately');
        injectIntoNewMenu(newMenuList, initialChannelInfo, videoCard);
    } else if (oldMenuList) {
        console.log('FilterTube: Detected OLD menu structure - injecting immediately');
        injectIntoOldMenu(oldMenuList, initialChannelInfo, videoCard);
    } else {
        console.log('FilterTube: Could not detect menu structure after waiting');
        return;
    }

    // Start background fetch for complete channel info (non-blocking)
    const fetchPromise = (async () => {
        let finalChannelInfo = initialChannelInfo;

        // For shorts, fetch channel info from shorts URL
        if (initialChannelInfo.needsFetch && initialChannelInfo.videoId) {
            console.log('FilterTube: Background fetch - shorts channel info for:', initialChannelInfo.videoId);
            const fetchedInfo = await fetchChannelFromShortsUrl(initialChannelInfo.videoId);
            if (fetchedInfo) {
                finalChannelInfo = fetchedInfo;
                console.log('FilterTube: Background fetch complete - shorts channel:', fetchedInfo);
            } else {
                console.warn('FilterTube: Background fetch failed for shorts');
            }
        }

        // For all videos (including shorts after fetch), resolve @handle to UC ID
        if (finalChannelInfo.handle && finalChannelInfo.handle.startsWith('@')) {
            console.log('FilterTube: Background fetch - resolving @handle to UC ID:', finalChannelInfo.handle);
            const ucId = await fetchIdForHandle(finalChannelInfo.handle);
            if (ucId) {
                finalChannelInfo.id = ucId;
                console.log('FilterTube: Background fetch complete - resolved to UC ID:', ucId);
            }
        }

        return finalChannelInfo;
    })();

    // Store the fetch promise for later use (when user clicks "Block Channel")
    pendingDropdownFetches.set(dropdown, {
        channelInfoPromise: fetchPromise,
        cancelled: false,
        initialChannelInfo: initialChannelInfo
    });

    console.log('FilterTube: Menu injected immediately, fetch running in background');
}

/**
 * Inject into NEW menu structure (yt-list-view-model)
 */
function injectIntoNewMenu(menuList, channelInfo, videoCard) {
    // Create FilterTube menu item (NEW structure)
    const filterTubeItem = document.createElement('yt-list-item-view-model');
    filterTubeItem.className = 'yt-list-item-view-model filtertube-block-channel-item';
    filterTubeItem.setAttribute('role', 'menuitem');
    filterTubeItem.setAttribute('tabindex', '0');

    // Inline SVG for FilterTube logo (user-provided SVG)
    const filterTubeSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" style="display: block;">
        <path fill="#FF3333" d="M53.004837,77.261787 C55.004650,68.586563 48.961483,63.525127 45.151901,57.831970 C36.636456,45.106262 27.572891,32.747910 18.776752,20.208942 C17.048302,17.745022 18.246574,14.746576 21.199722,14.076863 C22.310389,13.824986 23.520674,14.001245 24.685543,14.001154 C51.482349,13.999036 78.279152,13.997606 105.075958,14.002748 C107.511017,14.003215 110.410080,13.422483 111.785439,15.933891 C113.178085,18.476864 111.026321,20.660681 109.690315,22.593620 C99.594292,37.200588 89.433075,51.763405 79.158081,66.244827 C77.520378,68.552994 76.925735,70.848900 76.965294,73.583061 C77.066391,80.572067 76.851021,87.568138 77.069214,94.551788 C77.160759,97.481934 76.221825,99.467453 74.122963,101.447235 C69.040611,106.241264 64.241066,111.333801 59.229191,116.204849 C58.138329,117.265060 57.330574,119.514366 55.379189,118.670372 C53.447678,117.834984 52.933788,115.906029 52.954082,113.675346 C53.063110,101.692680 53.005142,89.708488 53.004837,77.261787 z"/>
        <path fill="#FF0000" d="M63.316730,58.295921 C61.783310,59.317360 60.616657,60.253048 59.307014,60.898705 C55.871113,62.592613 54.045387,61.557888 54.023708,57.807045 C53.960236,46.824589 53.943741,35.841064 54.033154,24.858967 C54.064426,21.018126 56.738575,19.503649 60.024136,21.659582 C67.653084,26.665573 75.198029,31.814018 82.579330,37.176819 C86.212624,39.816536 85.950592,42.679234 82.150856,45.360466 C76.029831,49.679680 69.801399,53.846684 63.316730,58.295921 z"/>
    </svg>`;

    filterTubeItem.innerHTML = `
        <div class="yt-list-item-view-model__label yt-list-item-view-model__container yt-list-item-view-model__container--compact yt-list-item-view-model__container--tappable yt-list-item-view-model__container--in-popup">
            <div aria-hidden="true" class="yt-list-item-view-model__image-container yt-list-item-view-model__leading" style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0;">
                ${filterTubeSvg}
            </div>
            <div class="yt-list-item-view-model__text-wrapper" style="flex: 1; min-width: 0;">
                <div class="yt-list-item-view-model__title-wrapper" style="display: flex !important; align-items: center; gap: 8px; width: 100%;">
                    <span class="yt-core-attributed-string yt-list-item-view-model__title yt-core-attributed-string--white-space-pre-wrap filtertube-menu-title" role="text" style="
                        min-width: 100px !important;
                        max-width: 150px !important;
                        font-size: 14px !important;
                        color: #ef4444 !important;
                        font-weight: 500 !important;
                        display: inline-block !important;
                        visibility: visible !important;
                        opacity: 1 !important;
                        white-space: nowrap !important;
                        overflow: visible !important;
                        flex-shrink: 0 !important;
                    ">Block Channel</span>
                    <div class="filtertube-filter-all-toggle" style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 4px 10px;
                        border-radius: 999px;
                        border: 1px solid #d0d0d0;
                        background: transparent;
                        color: #606060;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.06em;
                        cursor: pointer;
                        transition: all 0.2s;
                        flex-shrink: 0;
                        user-select: none;
                        white-space: nowrap;
                        margin-left: auto;
                    ">
                        Filter All
                    </div>
                </div>
            </div>
        </div>
    `;

    // Get title span and ensure it's visible
    const titleSpan = filterTubeItem.querySelector('.filtertube-menu-title');
    if (titleSpan) {
        // Force text content
        titleSpan.textContent = 'Block Channel';
        // Add additional inline styles as backup
        titleSpan.style.setProperty('min-width', '100px', 'important');
        titleSpan.style.setProperty('display', 'inline-block', 'important');
        titleSpan.style.setProperty('flex-shrink', '0', 'important');
    }

    // Get toggle button
    const toggle = filterTubeItem.querySelector('.filtertube-filter-all-toggle');

    // Toggle click handler (prevent menu item click and provide visual feedback)
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = toggle.classList.toggle('active');

        // Update styles for visual feedback
        if (isActive) {
            toggle.style.backgroundColor = 'rgba(180, 67, 57, 0.2)';
            toggle.style.color = '#dc2626';
            toggle.style.borderColor = '#dc2626';
        } else {
            toggle.style.backgroundColor = 'transparent';
            toggle.style.color = '#606060';
            toggle.style.borderColor = '#d0d0d0';
        }

        console.log('FilterTube: Filter All toggled:', isActive);
    });

    // Menu item click handler (block channel)
    filterTubeItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        const filterAll = toggle.classList.contains('active');
        await handleBlockChannelClick(channelInfo, filterTubeItem, filterAll, videoCard);
    });

    // Insert at the TOP of the menu (as first child)
    menuList.insertBefore(filterTubeItem, menuList.firstChild);

    // Check if channel is already blocked and update UI accordingly
    checkIfChannelBlocked(channelInfo, filterTubeItem);

    console.log('FilterTube: Injected NEW menu item at TOP');
}

/**
 * Inject into OLD menu structure (tp-yt-paper-listbox)
 */
function injectIntoOldMenu(menuContainer, channelInfo, videoCard) {
    const menuList = menuContainer.querySelector('tp-yt-paper-listbox') || menuContainer;

    // Inline SVG for FilterTube logo (user-provided SVG)
    const filterTubeSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 128 128" style="display: block;">
        <path fill="#FF3333" d="M53.004837,77.261787 C55.004650,68.586563 48.961483,63.525127 45.151901,57.831970 C36.636456,45.106262 27.572891,32.747910 18.776752,20.208942 C17.048302,17.745022 18.246574,14.746576 21.199722,14.076863 C22.310389,13.824986 23.520674,14.001245 24.685543,14.001154 C51.482349,13.999036 78.279152,13.997606 105.075958,14.002748 C107.511017,14.003215 110.410080,13.422483 111.785439,15.933891 C113.178085,18.476864 111.026321,20.660681 109.690315,22.593620 C99.594292,37.200588 89.433075,51.763405 79.158081,66.244827 C77.520378,68.552994 76.925735,70.848900 76.965294,73.583061 C77.066391,80.572067 76.851021,87.568138 77.069214,94.551788 C77.160759,97.481934 76.221825,99.467453 74.122963,101.447235 C69.040611,106.241264 64.241066,111.333801 59.229191,116.204849 C58.138329,117.265060 57.330574,119.514366 55.379189,118.670372 C53.447678,117.834984 52.933788,115.906029 52.954082,113.675346 C53.063110,101.692680 53.005142,89.708488 53.004837,77.261787 z"/>
        <path fill="#FF0000" d="M63.316730,58.295921 C61.783310,59.317360 60.616657,60.253048 59.307014,60.898705 C55.871113,62.592613 54.045387,61.557888 54.023708,57.807045 C53.960236,46.824589 53.943741,35.841064 54.033154,24.858967 C54.064426,21.018126 56.738575,19.503649 60.024136,21.659582 C67.653084,26.665573 75.198029,31.814018 82.579330,37.176819 C86.212624,39.816536 85.950592,42.679234 82.150856,45.360466 C76.029831,49.679680 69.801399,53.846684 63.316730,58.295921 z"/>
    </svg>`;

    // Create FilterTube menu item (OLD structure)
    const filterTubeItem = document.createElement('ytd-menu-service-item-renderer');
    filterTubeItem.className = 'style-scope ytd-menu-popup-renderer filtertube-block-channel-item';
    filterTubeItem.setAttribute('system-icons', '');
    filterTubeItem.setAttribute('role', 'menuitem');
    filterTubeItem.setAttribute('use-icons', '');
    filterTubeItem.setAttribute('tabindex', '-1');

    filterTubeItem.innerHTML = `
        <tp-yt-paper-item class="style-scope ytd-menu-service-item-renderer" style-target="host" role="option" tabindex="0" aria-disabled="false" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px;">
            <div style="width: 24px; height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                ${filterTubeSvg}
            </div>
            <span class="filtertube-menu-title" style="
                min-width: 100px !important;
                max-width: 150px !important;
                font-size: 14px !important;
                color: #ef4444 !important;
                font-weight: 500 !important;
                display: inline-block !important;
                visibility: visible !important;
                opacity: 1 !important;
                white-space: nowrap !important;
                overflow: visible !important;
                flex-shrink: 0 !important;
            ">Block Channel</span>
            <div class="filtertube-filter-all-toggle" style="
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4px 10px;
                border-radius: 999px;
                border: 1px solid #d0d0d0;
                background: transparent;
                color: #606060;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
                user-select: none;
                margin-left: auto;
            ">
                Filter All
            </div>
        </tp-yt-paper-item>
    `;

    // Get title span and ensure text is set
    const titleSpan = filterTubeItem.querySelector('.filtertube-menu-title');
    if (titleSpan) {
        titleSpan.textContent = 'Block Channel';
        // Add additional inline styles as backup
        titleSpan.style.setProperty('min-width', '100px', 'important');
        titleSpan.style.setProperty('display', 'inline-block', 'important');
        titleSpan.style.setProperty('flex-shrink', '0', 'important');
    }

    // Get toggle button
    const toggle = filterTubeItem.querySelector('.filtertube-filter-all-toggle');

    // Toggle click handler (prevent menu item click and provide visual feedback)
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = toggle.classList.toggle('active');

        // Update styles for visual feedback
        if (isActive) {
            toggle.style.backgroundColor = 'rgba(180, 67, 57, 0.2)';
            toggle.style.color = '#dc2626';
            toggle.style.borderColor = '#dc2626';
        } else {
            toggle.style.backgroundColor = 'transparent';
            toggle.style.color = '#606060';
            toggle.style.borderColor = '#d0d0d0';
        }

        console.log('FilterTube: Filter All toggled:', isActive);
    });

    // Menu item click handler (block channel)
    filterTubeItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        const filterAll = toggle.classList.contains('active');
        await handleBlockChannelClick(channelInfo, filterTubeItem, filterAll, videoCard);
    });

    // Insert at the TOP of the menu (as first child)
    menuList.insertBefore(filterTubeItem, menuList.firstChild);

    // Check if channel is already blocked and update UI accordingly
    checkIfChannelBlocked(channelInfo, filterTubeItem);

    console.log('FilterTube: Injected OLD menu item at TOP');
}

/**
 * Check if a channel is already blocked and update the menu item UI
 * @param {Object} channelInfo - {id, handle, name}
 * @param {Element} menuItem - The menu item element
 */
async function checkIfChannelBlocked(channelInfo, menuItem) {
    try {
        // Get current filtered channels from storage
        const result = await browserAPI_BRIDGE.storage.local.get(['filteredChannels']);
        const channels = result.filteredChannels || [];

        // Check if this channel is already in the list (by handle or ID)
        const input = channelInfo.handle || channelInfo.id;
        const isBlocked = channels.some(channel => {
            // Match by handle (case-insensitive) or by ID
            if (input.startsWith('@')) {
                return channel.handle && channel.handle.toLowerCase() === input.toLowerCase();
            } else {
                return channel.id === input;
            }
        });

        if (isBlocked) {
            // Channel is already blocked - show success state
            const titleSpan = menuItem.querySelector('.filtertube-menu-title');
            if (titleSpan) {
                titleSpan.textContent = '✓ Channel Blocked';
                titleSpan.style.color = '#10b981'; // green
                menuItem.style.pointerEvents = 'none'; // Disable clicks
            }
            console.log('FilterTube: Channel already blocked:', channelInfo);
        }
    } catch (error) {
        console.error('FilterTube: Error checking if channel is blocked:', error);
    }
}

/**
 * Handle click on "Block Channel" menu item
 * @param {Object} channelInfo - {id, handle, name}
 * @param {Element} menuItem - The menu item element
 * @param {boolean} filterAll - Whether to enable Filter All for this channel
 * @param {Element} videoCard - The video card element to hide after blocking
 */
async function handleBlockChannelClick(channelInfo, menuItem, filterAll = false, videoCard = null) {
    const titleSpan = menuItem.querySelector('.filtertube-menu-title');
    if (!titleSpan) return;

    const originalText = titleSpan.textContent;

    // Show "Fetching..." state IMMEDIATELY for instant user feedback
    titleSpan.textContent = 'Fetching...';
    titleSpan.style.color = '#9ca3af'; // gray
    menuItem.style.pointerEvents = 'none';

    // Get the dropdown to check for pending fetches
    const dropdown = menuItem.closest('tp-yt-iron-dropdown, ytd-menu-popup-renderer');

    // Check if there's a background fetch in progress with complete channel info
    const fetchData = dropdown ? pendingDropdownFetches.get(dropdown) : null;
    if (fetchData && !fetchData.cancelled && fetchData.channelInfoPromise) {
        console.log('FilterTube: Waiting for background fetch to complete...');
        try {
            // Wait for the background fetch to complete (likely already done by now)
            const fetchedChannelInfo = await fetchData.channelInfoPromise;
            if (fetchedChannelInfo && (fetchedChannelInfo.id || fetchedChannelInfo.handle)) {
                console.log('FilterTube: Using pre-fetched channel info:', fetchedChannelInfo);
                channelInfo = fetchedChannelInfo;
            }
        } catch (error) {
            console.warn('FilterTube: Background fetch failed, using initial channel info:', error);
            // Fall back to initial channelInfo passed to this function
        }
    }

    try {
        // Use the channel identifier (handle or ID)
        const input = channelInfo.handle || channelInfo.id;

        // Add channel via background script with filterAll preference
        const result = await addChannelDirectly(input, filterAll);

        if (result.success) {
            // Success state (matching existing UI)
            titleSpan.textContent = '✓ Channel Blocked';
            titleSpan.style.color = '#10b981'; // green

            console.log('FilterTube: Successfully blocked channel:', channelInfo, 'filterAll:', filterAll);

            // IMMEDIATELY hide the video card for instant feedback
            if (videoCard) {
                console.log('FilterTube: Hiding video card immediately');
                videoCard.style.display = 'none';
                videoCard.setAttribute('data-filtertube-hidden', 'true');

                // Close the dropdown since the video is now hidden
                const dropdown = menuItem.closest('tp-yt-iron-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                    dropdown.setAttribute('aria-hidden', 'true');
                }
            }

            // The storage change event will trigger a full page re-filter automatically
        } else {
            // Error state
            titleSpan.textContent = '✗ Failed to block';
            titleSpan.style.color = '#ef4444'; // red
            setTimeout(() => {
                titleSpan.textContent = originalText;
                titleSpan.style.color = '#ef4444';
                menuItem.style.pointerEvents = 'auto';
            }, 2000);
        }
    } catch (error) {
        console.error('FilterTube: Error blocking channel:', error);
        titleSpan.textContent = '✗ Error';
        titleSpan.style.color = '#ef4444';
        setTimeout(() => {
            titleSpan.textContent = originalText;
            titleSpan.style.color = '#ef4444';
            menuItem.style.pointerEvents = 'auto';
        }, 2000);
    }
}

/**
 * Add channel directly using chrome.storage (bypassing StateManager for content script)
 * @param {string} input - Channel identifier (@handle or UC ID)
 * @param {boolean} filterAll - Whether to enable Filter All for this channel
 * @returns {Promise<Object>} Result with success status
 */
async function addChannelDirectly(input, filterAll = false) {
    try {
        const rawValue = input.trim();
        if (!rawValue) {
            return { success: false, error: 'Empty input' };
        }

        // Send message to background script to add channel with filterAll preference
        return new Promise((resolve) => {
            browserAPI_BRIDGE.runtime.sendMessage({
                type: 'addFilteredChannel',
                input: rawValue,
                filterAll: filterAll
            }, (response) => {
                resolve(response || { success: false, error: 'No response from background' });
            });
        });

    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Add "Filter All Content" checkbox below the blocked channel
 * @param {Element} menuItem - The menu item element
 * @param {Object} channelData - Channel data from add result
 */
function addFilterAllContentCheckbox(menuItem, channelData) {
    // Try NEW menu structure first
    let container = menuItem.querySelector('.yt-list-item-view-model__text-wrapper');

    // Fallback to OLD menu structure
    if (!container) {
        container = menuItem.querySelector('tp-yt-paper-item');
    }

    if (!container) {
        console.error('FilterTube: Could not find container for checkbox');
        return;
    }

    // Don't add if already exists
    if (container.querySelector('.filtertube-filter-all-checkbox')) {
        return;
    }

    const checkboxWrapper = document.createElement('div');
    checkboxWrapper.className = 'filtertube-filter-all-checkbox';
    checkboxWrapper.style.cssText = 'margin-top: 8px; padding-left: 4px; font-size: 12px; color: #aaa; cursor: pointer; user-select: none;';

    checkboxWrapper.innerHTML = `
        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="checkbox" class="filtertube-filter-all-toggle" style="cursor: pointer;" />
            <span>Filter All Content</span>
        </label>
    `;

    const checkbox = checkboxWrapper.querySelector('input[type="checkbox"]');

    // Add click event on checkbox itself
    checkbox.addEventListener('click', (e) => {
        // Allow the click to toggle the checkbox
        e.stopPropagation();
    });

    // Add change event to handle the toggle
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const checked = checkbox.checked;

        // Send message to background to toggle filterAll
        browserAPI_BRIDGE.runtime.sendMessage({
            type: 'toggleChannelFilterAll',
            channelId: channelData?.id || channelData?.handle,
            value: checked
        }, (response) => {
            if (response && response.success) {
                console.log('FilterTube: Successfully toggled Filter All Content:', checked);
            } else {
                console.error('FilterTube: Failed to toggle Filter All Content');
            }
        });

        console.log('FilterTube: Toggled Filter All Content:', checked);
    });

    container.appendChild(checkboxWrapper);
    console.log('FilterTube: Added Filter All Content checkbox');
}

/**
 * Track the last clicked 3-dot button to find associated video card
 */
let lastClickedMenuButton = null;

/**
 * Track which dropdowns we've already injected into (prevent flashing)
 * Map: dropdown -> {videoCardId, isProcessing}
 */
const injectedDropdowns = new WeakMap();

/**
 * Track pending async channel fetches for shorts (prevents duplicates)
 * Map: videoId -> Promise
 */
const pendingShortsFetches = new Map();

/**
 * Track pending channel info fetches per dropdown (for instant UI + background fetch)
 * WeakMap: dropdown -> {channelInfoPromise, cancelled, initialChannelInfo}
 */
const pendingDropdownFetches = new WeakMap();

/**
 * Observe dropdowns and inject FilterTube menu items
 */
function setupMenuObserver() {
    // Track clicks on 3-dot buttons (comprehensive selectors for all YouTube contexts)
    document.addEventListener('click', (e) => {
        const menuButton = e.target.closest(
            'button[aria-label*="More"], ' +
            'button[aria-label*="Action"], ' +
            'button[aria-label*="menu"], ' +
            'yt-icon-button.dropdown-trigger, ' +
            'yt-icon-button#button.dropdown-trigger, ' +
            '.shortsLockupViewModelHostOutsideMetadataMenu button, ' +
            'ytd-menu-renderer button, ' +
            '#menu button[aria-label], ' +
            'ytd-reel-item-renderer button[aria-label*="More"], ' +
            'ytd-reel-video-renderer button[aria-label*="More"], ' +
            'ytm-menu-renderer button'
        );
        if (menuButton) {
            lastClickedMenuButton = menuButton;
            console.log('FilterTube: 3-dot button clicked, button:', menuButton.getAttribute('aria-label'));

            // Also try to find and inject immediately into existing dropdown
            setTimeout(() => {
                tryInjectIntoVisibleDropdown();
            }, 150);
        }
    }, true);

    // Wait for document.body to be ready
    const startObserver = () => {
        if (!document.body) {
            setTimeout(startObserver, 100);
            return;
        }

        // Observe dropdown menus appearing (childList for new nodes)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Check for new nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const dropdown = node.matches?.('tp-yt-iron-dropdown') ? node : node.querySelector?.('tp-yt-iron-dropdown');

                    if (dropdown) {
                        console.log('FilterTube: Dropdown added to DOM');
                        // Call async function without awaiting (fire and forget)
                        handleDropdownAppeared(dropdown).catch(err => {
                            console.error('FilterTube: Error in handleDropdownAppeared:', err);
                        });
                    }
                }

                // Check for attribute changes (dropdown becoming visible)
                if (mutation.type === 'attributes' && mutation.target.matches?.('tp-yt-iron-dropdown')) {
                    const dropdown = mutation.target;
                    const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

                    if (isVisible) {
                        console.log('FilterTube: Dropdown became visible (attribute change)');
                        // Call async function without awaiting (fire and forget)
                        handleDropdownAppeared(dropdown).catch(err => {
                            console.error('FilterTube: Error in handleDropdownAppeared:', err);
                        });
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'aria-hidden']
        });

        console.log('FilterTube: Menu observer started');
    };

    startObserver();
}

/**
 * Try to inject into currently visible dropdown
 */
function tryInjectIntoVisibleDropdown() {
    const visibleDropdowns = document.querySelectorAll('tp-yt-iron-dropdown');

    for (const dropdown of visibleDropdowns) {
        const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

        if (isVisible) {
            console.log('FilterTube: Found visible dropdown');
            // Call async function without awaiting (fire and forget)
            handleDropdownAppeared(dropdown).catch(err => {
                console.error('FilterTube: Error in handleDropdownAppeared:', err);
            });
            break; // Only inject into first visible one
        }
    }
}

/**
 * Handle when a dropdown appears (either added or made visible)
 */
async function handleDropdownAppeared(dropdown) {
    if (!lastClickedMenuButton) {
        console.log('FilterTube: No button reference, skipping injection');
        return;
    }

    console.log('FilterTube: Dropdown appeared, finding video card...');

    // Find the associated video/short card from the button (comprehensive selectors)
    const videoCard = lastClickedMenuButton.closest(
        'ytd-rich-item-renderer, ' +
        'ytd-video-renderer, ' +
        'ytd-grid-video-renderer, ' +
        'ytd-compact-video-renderer, ' +
        'ytd-reel-item-renderer, ' +
        'ytd-reel-video-renderer, ' +
        'reel-item-endpoint, ' +
        'ytd-compact-promoted-video-renderer, ' +
        'ytm-compact-video-renderer, ' +
        'ytm-video-with-context-renderer, ' +
        'ytd-post-renderer, ' +                          // ← YouTube Posts
        'ytd-playlist-panel-video-renderer, ' +         // ← Playlist videos
        'ytd-playlist-video-renderer, ' +               // ← Playlist videos (alternate)
        'ytm-shorts-lockup-view-model, ' +              // ← Shorts in mobile/search
        'ytm-shorts-lockup-view-model-v2, ' +           // ← Shorts variant
        'ytm-item-section-renderer, ' +                 // ← Container for shorts
        'ytd-rich-shelf-renderer'                       // ← Shelf containing shorts
    );

    if (videoCard) {
        console.log('FilterTube: Found video card:', videoCard.tagName);

        // Get unique ID for this video card
        let videoCardId = videoCard.getAttribute('data-filtertube-unique-id');
        if (!videoCardId) {
            // Try to extract video ID from links
            const videoLink = videoCard.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
            const videoIdMatch = videoLink?.href.match(/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);

            if (videoIdMatch) {
                videoCardId = videoIdMatch[1];
            } else {
                // Fallback: generate random ID
                videoCardId = `card-${Math.random().toString(36).substr(2, 9)}`;
            }
            videoCard.setAttribute('data-filtertube-unique-id', videoCardId);
        }

        // CRITICAL: Check if this dropdown is already being processed for this video
        const dropdownState = injectedDropdowns.get(dropdown);

        if (dropdownState?.videoCardId === videoCardId) {
            if (dropdownState.isProcessing) {
                console.log('FilterTube: Dropdown already processing for this video, skipping');
                return;
            }
            if (dropdownState.isComplete) {
                console.log('FilterTube: Dropdown already injected for this video, skipping');
                return;
            }
        }

        if (dropdownState && dropdownState.videoCardId !== videoCardId) {
            console.log('FilterTube: Dropdown reused for different video - will clean and reinject');
            // Old items will be removed by injectFilterTubeMenuItem automatically
        }

        // Mark as being processed IMMEDIATELY (prevents duplicate calls)
        injectedDropdowns.set(dropdown, { videoCardId, isProcessing: true, isComplete: false });

        // Watch for card removal (video hidden) and close dropdown
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === videoCard || node.contains(videoCard)) {
                        console.log('FilterTube: Video card removed, closing dropdown');
                        dropdown.style.display = 'none';
                        dropdown.setAttribute('aria-hidden', 'true');
                        observer.disconnect();
                    }
                }
            }
        });

        if (videoCard.parentElement) {
            observer.observe(videoCard.parentElement, { childList: true });
        }

        // Watch for dropdown closing (to cancel pending fetches if user doesn't block)
        const dropdownObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'aria-hidden') {
                    const isHidden = dropdown.getAttribute('aria-hidden') === 'true';
                    if (isHidden) {
                        // Dropdown closed - mark any pending fetch as cancelled
                        const fetchData = pendingDropdownFetches.get(dropdown);
                        if (fetchData) {
                            fetchData.cancelled = true;
                            console.log('FilterTube: Dropdown closed, marked fetch as cancelled');
                        }
                        dropdownObserver.disconnect();
                    }
                }
            }
        });
        dropdownObserver.observe(dropdown, { attributes: true, attributeFilter: ['aria-hidden'] });

        // Determine if this is a shorts card
        const isShorts = videoCard.tagName.toLowerCase().includes('shorts') ||
            videoCard.tagName.toLowerCase().includes('reel');

        try {
            // For shorts, we might need to wait for async channel fetch
            // Do the injection WITHOUT setTimeout to avoid race conditions
            await injectFilterTubeMenuItem(dropdown, videoCard);

            // Mark as complete
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: true });
        } catch (error) {
            console.error('FilterTube: Error injecting menu item:', error);
            // Reset state on error so it can be retried
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: false });
        }
    } else {
        console.log('FilterTube: Could not find video card from button');

        // CRITICAL: Clean up any stale FilterTube items from dropdown
        // (prevents old "✓ Channel Blocked" showing when we can't identify the video)
        const oldItems = dropdown.querySelectorAll('.filtertube-block-channel-item');
        if (oldItems.length > 0) {
            console.log('FilterTube: Removing stale FilterTube items from dropdown');
            oldItems.forEach(item => item.remove());
        }
    }
}

// Initialize menu observer after a delay
setTimeout(() => {
    setupMenuObserver();
}, 1000);

window.addEventListener('message', handleMainWorldMessages, false);
try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }

setTimeout(() => initialize(), 50);

// Duplicate function removed - using the version at line 105
