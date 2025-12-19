// js/content/dom_fallback.js - Isolated World
//
// DOM fallback filtering pipeline used by `js/content_bridge.js`.
// Loaded as an Isolated World content script before `content_bridge.js`.

const CHANNEL_ONLY_TAGS = new Set([
    'ytd-universal-watch-card-renderer',
    'ytm-universal-watch-card-renderer'
]);

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

    // Start tracking hide/restore operations
    filteringTracker.reset();

    // Removed diagnostic logging - issue identified and fixed
    const scrollingElement = document.scrollingElement || document.documentElement || document.body;
    const previousScrollTop = scrollingElement ? scrollingElement.scrollTop : window.pageYOffset;
    const previousScrollLeft = scrollingElement ? scrollingElement.scrollLeft : window.pageXOffset;
    ensureStyles();

    // 1. Video/Content Filtering
    const videoElements = document.querySelectorAll(VIDEO_CARD_SELECTORS);

    videoElements.forEach(element => {
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
        const collaboratorMetas = extractCollaboratorMetadataFromElement(element);

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
            channelMeta,
            collaborators: collaboratorMetas
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
        if (uniqueId) {
            element.setAttribute('data-filtertube-last-processed-id', uniqueId);
        } else {
            element.removeAttribute('data-filtertube-last-processed-id');
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
        const blockedChannelState = target.getAttribute('data-filtertube-blocked-state');
        const blockedTimestamp = parseInt(target.getAttribute('data-filtertube-blocked-ts') || '0', 10);
        const blockAgeMs = blockedTimestamp ? Date.now() - blockedTimestamp : Number.POSITIVE_INFINITY;

        // If this card was blocked via 3-dot UI, honour pending/confirmed states
        if (blockedChannelId || blockedChannelHandle) {
            const isStillBlocked = effectiveSettings.filterChannels?.some(fc => {
                if (typeof fc === 'object') {
                    return (blockedChannelId && fc.id?.toLowerCase() === blockedChannelId.toLowerCase()) ||
                        (blockedChannelHandle && fc.handle?.toLowerCase() === blockedChannelHandle.toLowerCase());
                }
                const normalized = (fc || '').toLowerCase();
                return normalized === blockedChannelId?.toLowerCase() || normalized === blockedChannelHandle?.toLowerCase();
            });

            if (isStillBlocked) {
                // Keep it hidden - mark as confirmed so future passes don't treat it as pending
                markElementAsBlocked(target, {
                    id: blockedChannelId,
                    handle: blockedChannelHandle
                }, 'confirmed');
                toggleVisibility(target, true, `Blocked channel: ${blockedChannelHandle || blockedChannelId}`);
                return; // Skip further processing for this element
            } else {
                // If blocklist no longer contains this channel but the state is still pending,
                // keep it hidden for a short grace period to avoid flicker while background saves
                const waitForConfirmation = blockedChannelState === 'pending' && blockAgeMs < 2000;
                if (waitForConfirmation) {
                    toggleVisibility(target, true, `Pending channel block: ${blockedChannelHandle || blockedChannelId}`);
                    return;
                }

                // Channel was unblocked, remove the attributes and let normal filtering proceed
                target.removeAttribute('data-filtertube-blocked-channel-id');
                target.removeAttribute('data-filtertube-blocked-channel-handle');
                target.removeAttribute('data-filtertube-blocked-state');
                target.removeAttribute('data-filtertube-blocked-ts');

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
            // Extract videoId from Shorts card
            const shortsLink = element.querySelector('a[href*="/shorts/"]');
            const shortsHref = shortsLink?.getAttribute('href') || '';
            const videoIdMatch = shortsHref.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            
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
}

// Helper function to check if content should be hidden
function shouldHideContent(title, channel, settings, options = {}) {
    if (!title && !channel) return false;

    const {
        skipKeywords = false,
        channelHref = '',
        channelMeta: providedChannelMeta = null,
        collaborators = []
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
