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
let statsLastDate = new Date().toDateString();
let statsInitialized = false;

// Initialize stats from storage
function initializeStats() {
    if (statsInitialized || !chrome || !chrome.storage) return;
    statsInitialized = true;

    chrome.storage.local.get(['stats'], (result) => {
        const today = new Date().toDateString();
        if (result.stats && result.stats.lastDate === today) {
            // Same day, restore count
            statsCountToday = result.stats.hiddenCount || 0;
            statsLastDate = result.stats.lastDate;
        } else {
            // New day or no stats, reset
            statsCountToday = 0;
            statsLastDate = today;
        }
    });
}

function incrementHiddenStats() {
    const today = new Date().toDateString();

    // Reset if it's a new day
    if (today !== statsLastDate) {
        statsCountToday = 0;
        statsLastDate = today;
    }

    statsCountToday++;

    // Conservative estimate:
    // - Average time to evaluate a video (read title, see thumbnail, decide) = ~3-5 seconds
    // - We estimate 4 seconds per filtered video
    // - This represents the time you would have spent considering content you don't want to see
    // - Formula: (hidden_count * 4 seconds) / 60 = minutes saved
    const secondsSaved = statsCountToday * 4;
    const minutesSaved = Math.floor(secondsSaved / 60);

    // Save to storage (debounced to avoid excessive writes)
    if (chrome && chrome.storage) {
        chrome.storage.local.set({
            stats: {
                hiddenCount: statsCountToday,
                savedMinutes: minutesSaved,
                lastDate: today
            }
        });
    }
}

function extractShelfTitle(shelf) {
    if (!shelf || typeof shelf.querySelector !== 'function') return '';

    const header = shelf.querySelector(':scope #title-container, :scope #header, :scope ytd-shelf-header-renderer, :scope .grid-subheader, :scope .shelf-title-row, :scope h2');
    const headerTextCandidates = [];

    if (header) {
        headerTextCandidates.push(
            header.querySelector('#title'),
            header.querySelector('#title-text'),
            header.querySelector('yt-formatted-string#title'),
            header.querySelector('span#title'),
            header.querySelector('h2')
        );
    }

    headerTextCandidates.push(
        shelf.querySelector(':scope > #dismissible #title'),
        shelf.querySelector(':scope > #dismissible #title-text'),
        shelf.querySelector(':scope > h2')
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

    const visited = new Set();
    const queue = [root];
    const MAX_ITERATIONS = 2000;
    let iterations = 0;

    while (queue.length && iterations < MAX_ITERATIONS && (!result.handle || !result.id)) {
        const current = queue.shift();
        iterations++;

        if (!current || typeof current !== 'object') continue;
        if (visited.has(current)) continue;
        visited.add(current);

        if (Array.isArray(current)) {
            for (const item of current) {
                if (typeof item === 'string') {
                    if (!result.handle) {
                        const handle = extractHandleFromString(item);
                        if (handle) result.handle = handle;
                    }
                    if (!result.id) {
                        const id = extractChannelIdFromString(item);
                        if (id) result.id = id;
                    }
                } else if (item && typeof item === 'object' && !visited.has(item) && !(item instanceof Element) && !(item instanceof Node) && item !== window) {
                    queue.push(item);
                }
                if (result.handle && result.id) break;
            }
            continue;
        }

        for (const value of Object.values(current)) {
            if (typeof value === 'string') {
                if (!result.handle) {
                    const handle = extractHandleFromString(value);
                    if (handle) result.handle = handle;
                }
                if (!result.id) {
                    const id = extractChannelIdFromString(value);
                    if (id) result.id = id;
                }
            } else if (value && typeof value === 'object' && !visited.has(value) && !(value instanceof Element) && !(value instanceof Node) && value !== window) {
                queue.push(value);
            }

            if (result.handle && result.id) break;
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
            cacheTarget?.closest?.('yt-lockup-metadata-view-model')
        ];

        parentCandidates.forEach(parent => {
            if (!parent) return;
            addSource(parent.data);
            addSource(parent.data?.data);
            addSource(parent.data?.content);
            addSource(parent.__data);
            addSource(parent.__data?.data);
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
    // Handle new object format: { name, id, handle }
    if (typeof filterChannel === 'object' && filterChannel !== null) {
        const filterId = (filterChannel.id || '').toLowerCase();
        const filterHandle = (filterChannel.handle || '').toLowerCase();

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
 */
function toggleVisibility(element, shouldHide, reason = '') {
    if (!element) return;

    if (shouldHide) {
        const wasAlreadyHidden = element.classList.contains('filtertube-hidden');
        if (!wasAlreadyHidden) {
            element.classList.add('filtertube-hidden');
            element.setAttribute('data-filtertube-hidden', 'true');
            // debugLog(`🚫 Hiding: ${reason}`);

            // Increment stats only for newly hidden items (not already hidden)
            incrementHiddenStats();
        }
        handleMediaPlayback(element, true);
    } else {
        if (element.classList.contains('filtertube-hidden')) {
            element.classList.remove('filtertube-hidden');
            element.removeAttribute('data-filtertube-hidden');
            // debugLog(`✅ Restoring element`);
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
        child.hasAttribute('data-filtertube-hidden')
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
            // But if we are in a "restore" scenario (settings changed), we might need to re-check
            // For robustness, we'll re-check visibility logic but maybe skip heavy text extraction if possible
            // For now, let's just re-run to be safe.
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
        toggleVisibility(survey, shouldHideSurvey, 'Inline Survey Shell');

        const sectionContainer = survey.closest('ytd-rich-section-renderer');
        if (sectionContainer) {
            toggleVisibility(sectionContainer, shouldHideSurvey, 'Inline Survey Section');
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
            toggleVisibility(item, true, 'Empty Rich Item');
        }
    });

    // 3. Shorts Filtering
    const shortsContainerSelectors = 'grid-shelf-view-model, ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer';
    const shortContainers = document.querySelectorAll(shortsContainerSelectors);

    if (effectiveSettings.hideAllShorts) {
        shortContainers.forEach(container => {
            container.setAttribute('data-filtertube-hidden-by-hide-all-shorts', 'true');
            toggleVisibility(container, true, 'Hide Shorts container');
        });
    } else {
        shortContainers.forEach(container => {
            if (container.hasAttribute('data-filtertube-hidden-by-hide-all-shorts')) {
                container.removeAttribute('data-filtertube-hidden-by-hide-all-shorts');
                if (!container.hasAttribute('data-filtertube-hidden-by-shelf-title')) {
                    toggleVisibility(container, false);
                }
            }
        });
    }

    const shortsSelectors = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2';
    document.querySelectorAll(shortsSelectors).forEach(element => {
        let target = element;
        const parent = element.closest('ytd-rich-item-renderer');
        if (parent) target = parent;

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
    const shelves = document.querySelectorAll('ytd-shelf-renderer, ytd-rich-shelf-renderer, ytd-item-section-renderer, grid-shelf-view-model');
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

        updateContainerVisibility(shelf, 'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2');
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
        requestSettingsFromBackground().then(result => {
            if (result?.success) applyDOMFallback(result.settings, { forceReprocess: true });
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

window.addEventListener('message', handleMainWorldMessages, false);
try {
    browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges);
} catch (e) { }

setTimeout(() => initialize(), 50);
