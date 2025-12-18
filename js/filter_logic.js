// js/filter_logic.js - Comprehensive YouTube content filtering logic
// FilterTube - Independent implementation inspired by data interception concepts

(function () {
    'use strict';

    // Idempotency guard
    if (window.filterTubeLogicHasRun) {
        console.warn('FilterTube (FilterLogic): Already initialized, skipping');
        return; // Now legal because it's inside a function
    }
    window.filterTubeLogicHasRun = true;

    // Debug logging with sequence numbers and bridge relay
    let filterLogicDebugSequence = 0;
    function postLogToBridge(level, ...args) {
        filterLogicDebugSequence++;
        console[level](`[${filterLogicDebugSequence}] FilterTube (FilterLogic):`, ...args);

        // Relay to content_bridge for extension console visibility
        try {
            window.postMessage({
                type: 'FilterTube_FilterLogicToBridge_Log',
                payload: {
                    level: level,
                    message: args,
                    seq: filterLogicDebugSequence
                },
                source: 'filter_logic'
            }, '*');
        } catch (e) {
            // Don't let relay failures break functionality
        }
    }

    postLogToBridge('log', 'filter_logic.js loaded and initializing FilterTubeEngine');

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Get nested object property by dot-notation path
     * @param {Object} obj - Source object
     * @param {string|Array} path - Property path (e.g., 'title.simpleText' or ['title', 'simpleText'])
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Property value or default
     */
    function getByPath(obj, path, defaultValue = undefined) {
        if (!obj || typeof obj !== 'object') return defaultValue;

        const keys = Array.isArray(path) ? path : path.split('.');
        let current = obj;

        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return defaultValue;
            }
            current = current[key];
        }

        return current;
    }

    /**
     * Flatten YouTube's text structures (runs, simpleText) into plain strings
     * @param {Object|string} textObj - YouTube text object or plain string
     * @returns {string} Flattened text
     */
    function flattenText(textObj) {
        if (typeof textObj === 'string') return textObj;
        if (!textObj || typeof textObj !== 'object') return '';

        // Handle simpleText
        if (textObj.simpleText) return textObj.simpleText;

        // Handle runs array
        if (textObj.runs && Array.isArray(textObj.runs)) {
            return textObj.runs.map(run => run.text || '').join('');
        }

        return '';
    }

    /**
     * Get text content from multiple possible paths
     * @param {Object} obj - Source object
     * @param {Array} paths - Array of possible paths to check
     * @returns {string} First found text or empty string
     */
    function getTextFromPaths(obj, paths) {
        for (const path of paths) {
            const value = getByPath(obj, path);
            if (value) {
                const text = flattenText(value);
                if (text) return text;
            }
        }
        return '';
    }

    function normalizeChannelHandle(rawHandle) {
        if (typeof rawHandle !== 'string') return '';

        const sharedExtractRawHandle = window.FilterTubeIdentity?.extractRawHandle;
        if (typeof sharedExtractRawHandle === 'function') {
            return sharedExtractRawHandle(rawHandle) || '';
        }
        let candidate = rawHandle.trim();
        if (!candidate) return '';

        if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
            try {
                const url = new URL(candidate);
                candidate = url.pathname || '';
            } catch (e) {
                // Ignore malformed URL; fall back to original string
            }
        }

        const atIndex = candidate.indexOf('@');
        if (atIndex === -1) return '';

        const handleCore = candidate.substring(atIndex + 1).split(/[/?#]/)[0];
        if (!handleCore) return '';

        let decoded = handleCore;
        try {
            decoded = decodeURIComponent(decoded);
        } catch (e) {
            // ignore decode failures
        }
        decoded = decoded.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '').trim();
        if (!decoded) return '';
        return `@${decoded}`;
    }

    function findHandleInValue(value) {
        if (!value) return '';

        if (typeof value === 'string') {
            const normalized = normalizeChannelHandle(value);
            if (normalized) return normalized;
        }

        if (typeof value === 'object') {
            if (value.simpleText || value.runs) {
                const textHandle = normalizeChannelHandle(flattenText(value));
                if (textHandle) return textHandle;
            }

            const candidateKeys = [
                'canonicalBaseUrl',
                'browseEndpoint.canonicalBaseUrl',
                'commandMetadata.webCommandMetadata.url',
                'url',
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.commandMetadata.webCommandMetadata.url',
                'text'
            ];

            for (const key of candidateKeys) {
                const nested = getByPath(value, key);
                const handle = findHandleInValue(nested);
                if (handle) return handle;
            }
        }

        return '';
    }

    function extractChannelHandleFromPaths(obj, paths = []) {
        for (const path of paths) {
            const value = getByPath(obj, path);
            const handle = findHandleInValue(value);
            if (handle) return handle;
        }
        return '';
    }

    function flattenMetadataRow(row) {
        if (!row || typeof row !== 'object') return '';

        const parts = [];

        if (Array.isArray(row.metadataParts)) {
            for (const part of row.metadataParts) {
                if (!part) continue;
                if (part.text) {
                    const text = flattenText(part.text);
                    if (text) parts.push(text);
                } else if (part.simpleText) {
                    parts.push(part.simpleText);
                } else if (part.runs) {
                    const text = flattenText(part);
                    if (text) parts.push(text);
                }
            }
        }

        const additionalKeys = ['text', 'title', 'subtitle', 'badgeText'];
        for (const key of additionalKeys) {
            if (row[key]) {
                const text = flattenText(row[key]);
                if (text) parts.push(text);
            }
        }

        return parts.filter(Boolean).join(' ');
    }

    function flattenMetadataRowsContainer(container) {
        if (!container) return '';

        let rows = container;
        if (!Array.isArray(rows)) {
            rows = rows.metadataRows || rows.rows || [];
        }

        if (!Array.isArray(rows)) return '';

        const collected = [];
        for (const row of rows) {
            const text = flattenMetadataRow(row);
            if (text) collected.push(text);
        }

        return collected.join(' | ');
    }

    function getMetadataRowsText(obj, paths) {
        for (const path of paths) {
            const value = getByPath(obj, path);
            const text = flattenMetadataRowsContainer(value);
            if (text) return text;
        }
        return '';
    }

    // ============================================================================
    // FILTER RULES - YouTube Renderer Definitions
    // ============================================================================

    // Base video rules that can be reused across different renderer types
    const BASE_VIDEO_RULES = {
        videoId: 'videoId',
        title: ['title.simpleText', 'title.runs', 'title'],
        channelName: ['shortBylineText.runs', 'longBylineText.runs', 'ownerText.runs'],
        channelId: [
            'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
            'longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
            'ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId'
        ],
        channelHandle: [
            'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
            'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
            'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'
        ],
        description: [
            'descriptionSnippet.runs',
            'descriptionSnippet.simpleText',
            'detailedMetadataSnippets.0.snippetText.runs',
            'detailedMetadataSnippets.0.snippetText.simpleText'
        ],
        duration: ['thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText'],
        viewCount: ['viewCountText.simpleText', 'shortViewCountText.simpleText']
    };

    const CHANNEL_ONLY_RENDERERS = new Set([
        'channelRenderer',
        'gridChannelRenderer',
        'universalWatchCardRenderer'
    ]);

    // Comprehensive filter rules for all YouTube renderer types
    const FILTER_RULES = {
        // ------------------------------------------------------------------
        // Shared video card renderers (used across multiple surfaces)
        videoRenderer: BASE_VIDEO_RULES,
        compactVideoRenderer: BASE_VIDEO_RULES,
        gridVideoRenderer: BASE_VIDEO_RULES,
        playlistVideoRenderer: BASE_VIDEO_RULES,
        watchCardCompactVideoRenderer: BASE_VIDEO_RULES,

        // ------------------------------------------------------------------
        // Home feed & shelf surfaces
        richItemRenderer: {
            // richItemRenderer usually wraps other renderers, need to check content
            videoId: 'content.videoRenderer.videoId',
            title: ['content.videoRenderer.title.runs', 'content.videoRenderer.title.simpleText'],
            channelName: ['content.videoRenderer.shortBylineText.runs', 'content.videoRenderer.longBylineText.runs'],
            channelId: ['content.videoRenderer.shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId']
        },
        shelfRenderer: {
            title: ['header.shelfHeaderRenderer.title.simpleText']
        },
        lockupViewModel: {
            videoId: 'contentId',
            title: ['metadata.lockupMetadataViewModel.title.content', 'accessibilityText'],
            channelName: ['metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content'],
            metadataRows: ['metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows']
        },

        // ------------------------------------------------------------------
        // Watch page (primary metadata)
        videoPrimaryInfoRenderer: {
            title: ['title.runs', 'title.simpleText']
        },
        videoSecondaryInfoRenderer: {
            channelId: ['owner.videoOwnerRenderer.navigationEndpoint.browseEndpoint.browseId'],
            channelName: ['owner.videoOwnerRenderer.title.runs']
        },

        // ------------------------------------------------------------------
        // Watch page related modules & secondary surfaces
        universalWatchCardRenderer: {
            videoId: 'watchCardRichHeaderRenderer.navigationEndpoint.videoId',
            title: ['watchCardRichHeaderRenderer.title.simpleText'],
            channelName: ['watchCardRichHeaderRenderer.subtitle.simpleText']
        },
        relatedChipCloudRenderer: {
            title: ['title.simpleText', 'title.runs'],
            description: ['subtitle.simpleText', 'subtitle.runs']
        },
        chipCloudRenderer: {
            title: ['title.simpleText', 'title.runs']
        },
        chipCloudChipRenderer: {
            title: ['text.simpleText', 'text.runs', 'chipText.simpleText', 'chipText.runs'],
            description: ['secondaryText.simpleText', 'secondaryText.runs'],
            channelName: [
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.browseEndpoint.browseId',
                'navigationEndpoint.commandMetadata.webCommandMetadata.url'
            ],
            channelId: ['navigationEndpoint.browseEndpoint.browseId'],
            channelHandle: [
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.commandMetadata.webCommandMetadata.url',
                'text.simpleText',
                'text.runs'
            ]
        },
        secondarySearchContainerRenderer: {
            // Usually contains other renderers, process recursively
        },

        // ------------------------------------------------------------------
        // Channel Page & Grid Surfaces
        richGridMedia: {
            videoId: 'videoId',
            title: ['headline.simpleText', 'headline.runs', 'title.simpleText', 'title.runs'],
            channelName: ['shortBylineText.runs', 'longBylineText.runs'],
            description: ['descriptionSnippet.simpleText', 'descriptionSnippet.runs'],
            channelId: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId']
        },
        gridVideoRenderer: {
            videoId: 'videoId',
            title: ['title.simpleText', 'title.runs'],
            channelName: ['shortBylineText.runs', 'longBylineText.runs'],
            channelId: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId']
        },

        // ------------------------------------------------------------------
        // Search results & generic lists
        playlistRenderer: {
            title: ['title.simpleText'],
            channelName: ['shortBylineText.runs'],
            channelId: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId'],
            channelHandle: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl']
        },
        radioRenderer: {
            title: ['title.simpleText']
        },
        compactRadioRenderer: {
            title: ['title.simpleText']
        },
        ticketShelfRenderer: {
            title: ['header.ticketShelfHeaderRenderer.title.simpleText']
        },
        podcastRenderer: {
            title: ['title.simpleText', 'title.runs'],
            description: ['description.simpleText', 'description.runs', 'subtitle.simpleText', 'subtitle.runs'],
            channelName: [
                'publisherMetadata.publisherName.simpleText',
                'publisherMetadata.publisherName.runs'
            ],
            channelId: [
                'publisherMetadata.navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: ['publisherMetadata.navigationEndpoint.browseEndpoint.canonicalBaseUrl'],
            metadataRows: ['metadataRows', 'decoratedMetadataRows.rows']
        },
        richShelfRenderer: {
            title: ['title.simpleText', 'title.runs']
        },

        // ------------------------------------------------------------------
        // Channel experience
        channelVideoPlayerRenderer: {
            videoId: 'videoId',
            title: ['title.runs', 'title.simpleText']
        },
        channelRenderer: {
            channelId: 'channelId',
            channelName: ['title.simpleText', 'displayName.simpleText'],
            channelHandle: ['navigationEndpoint.browseEndpoint.canonicalBaseUrl']
        },
        gridChannelRenderer: {
            channelId: 'channelId',
            channelName: ['title.simpleText'],
            channelHandle: ['navigationEndpoint.browseEndpoint.canonicalBaseUrl']
        },
        backstagePostThreadRenderer: {
            title: ['post.backstagePostRenderer.contentText.runs', 'post.backstagePostRenderer.contentText.simpleText'],
            description: ['post.backstagePostRenderer.expandedContentText.runs', 'post.backstagePostRenderer.backstageAttachment.captionText.runs'],
            channelName: ['post.backstagePostRenderer.authorText.simpleText'],
            channelId: ['post.backstagePostRenderer.authorEndpoint.browseEndpoint.browseId'],
            channelHandle: ['post.backstagePostRenderer.authorEndpoint.browseEndpoint.canonicalBaseUrl']
        },
        backstagePostRenderer: {
            title: ['contentText.runs', 'contentText.simpleText'],
            description: ['expandedContentText.runs', 'expandedContentText.simpleText', 'backstageAttachment.captionText.runs'],
            channelName: ['authorText.simpleText'],
            channelId: ['authorEndpoint.browseEndpoint.browseId'],
            channelHandle: ['authorEndpoint.browseEndpoint.canonicalBaseUrl']
        },
        backstagePollRenderer: {
            title: ['pollQuestion.simpleText', 'pollQuestion.runs'],
            description: [
                'choices.0.choiceText.simpleText',
                'choices.0.choiceText.runs',
                'choices.1.choiceText.simpleText',
                'choices.1.choiceText.runs'
            ]
        },
        backstageQuizRenderer: {
            title: ['quizQuestion.simpleText', 'quizQuestion.runs'],
            description: [
                'options.0.text.simpleText',
                'options.0.text.runs',
                'options.1.text.simpleText',
                'options.1.text.runs'
            ]
        },

        // ------------------------------------------------------------------
        // Notifications & inbox surfaces
        notificationRenderer: {
            title: ['title.simpleText', 'title.runs', 'shortMessage.simpleText', 'shortMessage.runs'],
            description: ['longMessage.simpleText', 'longMessage.runs', 'sentTimeText.simpleText'],
            channelName: [
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.commandMetadata.webCommandMetadata.url',
                'collapseStateButton.toggleButtonRenderer.defaultText.simpleText'
            ],
            channelId: [
                'navigationEndpoint.browseEndpoint.browseId',
                'feedbackButton.buttonRenderer.navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: [
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.commandMetadata.webCommandMetadata.url'
            ]
        },
        commentVideoThumbnailHeaderRenderer: {
            title: ['title.simpleText', 'title.runs', 'headline.simpleText', 'headline.runs'],
            description: ['subtitle.simpleText', 'subtitle.runs'],
            channelName: [
                'channelTitle.simpleText',
                'channelTitle.runs',
                'channelName.simpleText',
                'channelName.runs'
            ],
            channelId: [
                'channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.browseId',
                'navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: [
                'channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'navigationEndpoint.browseEndpoint.canonicalBaseUrl'
            ]
        },
        thumbnailOverlayPlaybackStatusRenderer: {
            title: ['text.simpleText', 'text.runs']
        },
        thumbnailOverlayTimeStatusRenderer: {
            title: ['text.simpleText', 'text.runs']
        },
        thumbnailOverlayResumePlaybackRenderer: {
            description: ['resumePlaybackRenderer.accessibility.accessibilityData.label']
        },
        thumbnailOverlayNowPlayingRenderer: {
            title: ['text.simpleText', 'text.runs']
        },

        // ------------------------------------------------------------------
        // Shorts surfaces
        reelItemRenderer: {
            videoId: 'videoId',
            title: ['headline.simpleText'],
            channelName: ['navigationEndpoint.reelWatchEndpoint.overlay.reelPlayerOverlayRenderer.reelPlayerHeaderSupportedRenderers.reelPlayerHeaderRenderer.channelTitleText.simpleText']
        },
        shortsLockupViewModel: {
            videoId: ['onTap.innertubeCommand.reelWatchEndpoint.videoId'],
            title: ['accessibilityText']
        },
        shortsLockupViewModelV2: {
            videoId: ['onTap.innertubeCommand.reelWatchEndpoint.videoId'],
            title: ['accessibilityText']
        },

        // ------------------------------------------------------------------
        // Comment threads
        commentRenderer: {
            channelId: ['authorEndpoint.browseEndpoint.browseId'],
            channelName: ['authorText.simpleText'],
            commentText: ['contentText.simpleText', 'contentText.runs']
        },
        commentThreadRenderer: {
            // Usually contains commentRenderer, handled by recursive processing
        }
    };

    // ============================================================================
    // FILTERING ENGINE
    // ============================================================================

    /**
     * Main filtering class that recursively processes YouTube data structures
     */
    class YouTubeDataFilter {
        constructor(settings) {
            this.settings = this._processSettings(settings);
            this.channelMap = settings.channelMap || {}; // UC ID <-> @handle mappings
            this.blockedCount = 0;
            this.debugEnabled = true;
        }

        /**
         * Process and validate settings from background script
         */
        _processSettings(settings) {
            const processed = {
                filterKeywords: [],
                filterChannels: [],
                hideAllComments: false,
                hideAllShorts: false,
                filterComments: false,
                useExactWordMatching: false,
                ...settings
            };

            // Reconstruct RegExp objects from serialized patterns
            if (settings.filterKeywords && Array.isArray(settings.filterKeywords)) {
                processed.filterKeywords = settings.filterKeywords.map(item => {
                    if (item && typeof item === 'object' && item.pattern && item.flags) {
                        try {
                            return new RegExp(item.pattern, item.flags);
                        } catch (e) {
                            console.error('FilterTube: Failed to reconstruct RegExp:', item, e);
                            return null;
                        }
                    }
                    return null;
                }).filter(regex => regex !== null);
            }

            // Ensure filterChannels are objects with all properties, and can be matched case-insensitively
            if (settings.filterChannels && Array.isArray(settings.filterChannels)) {
                processed.filterChannels = settings.filterChannels.map(ch => {
                    // Convert legacy string format to object if necessary
                    if (typeof ch === 'string') {
                        return { name: ch, id: ch, handle: null, logo: null, filterAll: false };
                    }
                    // For objects, ensure properties exist for later matching (e.g., lowercasing for internal checks)
                    return {
                        ...ch,
                        id: ch.id ? ch.id.toLowerCase() : '',
                        handle: ch.handle ? ch.handle.toLowerCase() : '',
                        name: ch.name ? ch.name.toLowerCase() : '', // Lowercase name for internal matching consistency
                    };
                }).filter(ch => ch);
            }

            return processed;
        }

        /**
         * Harvest channel ID/Handle mappings from YouTube data
         * This learns the connection between UC IDs and @handles automatically
         */
        _harvestChannelData(data) {
            if (!data || typeof data !== 'object') return;

            // Player/watch responses (ytInitialPlayerResponse, /player fetch) expose direct owner metadata
            this._harvestPlayerOwnerData(data);

            // 1. Check Channel Metadata (appears on channel pages)
            const meta = data?.metadata?.channelMetadataRenderer;
            if (meta?.externalId) {
                const id = meta.externalId;
                let handle = null;

                // Method A: Check vanityChannelUrl (Standard)
                if (meta.vanityChannelUrl) {
                    const normalized = normalizeChannelHandle(meta.vanityChannelUrl);
                    if (normalized) handle = normalized;
                }

                // Method B: Check ownerUrls (Alternative location, used by Shakira's channel)
                if (!handle && meta.ownerUrls && Array.isArray(meta.ownerUrls)) {
                    for (const url of meta.ownerUrls) {
                        const normalized = normalizeChannelHandle(url);
                        if (!normalized) continue;
                        handle = normalized;
                        break;
                    }
                }

                if (id && handle) {
                    this._registerMapping(id, handle);
                }
            }

            // 2. Check Microformat (appears in video/channel responses)
            const micro = data?.microformat?.microformatDataRenderer;
            if (micro?.urlCanonical && (micro?.vanityChannelUrl || micro?.ownerProfileUrl)) {
                const idMatch = micro.urlCanonical.match(/channel\/(UC[\w-]{22})/);
                // Sometimes it's in vanityChannelUrl, sometimes ownerProfileUrl
                const handleUrl = micro.vanityChannelUrl || micro.ownerProfileUrl;

                const handle = handleUrl ? normalizeChannelHandle(handleUrl) : '';
                if (idMatch && handle) {
                    this._registerMapping(idMatch[1], handle);
                }
            }

            // 3. Check response context (sometimes contains channel info)
            const responseContext = data?.responseContext;
            if (responseContext?.webResponseContextExtensionData?.ytConfigData) {
                const ytConfig = responseContext.webResponseContextExtensionData.ytConfigData;
                if (ytConfig.channelId && ytConfig.channelName) {
                    // Try to find handle from canonicalBaseUrl
                    const handle = normalizeChannelHandle(ytConfig.canonicalBaseUrl);
                    if (handle) {
                        this._registerMapping(ytConfig.channelId, handle);
                    }
                }
            }

            // 4. Harvest mappings from per-video renderers in generic data blobs
            //    (e.g., search results, watch suggestions, lockupViewModel trees).
            //    This allows us to learn UC ID <-> @handle pairs such as
            //    browseId "UCM6nZ84qXYFWPWzlO_zpkWw" + canonicalBaseUrl
            //    "/@Santasmusicroom.Official" directly from ytInitialData.
            try {
                this._harvestRendererChannelMappings(data);
            } catch (e) {
                console.warn('FilterTube: Renderer channel harvest failed', e);
            }
        }

        /**
         * Harvest mappings from ytInitialPlayerResponse / player fetch payloads
         * that include explicit videoOwnerChannelId + ownerProfileUrl.
         */
        _harvestPlayerOwnerData(data) {
            const videoDetails = data?.videoDetails;
            const playerMicroformat = data?.microformat?.playerMicroformatRenderer;

            let ownerId = null;
            let ownerHandle = null;

            if (videoDetails) {
                ownerId =
                    videoDetails.videoOwnerChannelId ||
                    videoDetails.channelId ||
                    videoDetails.externalChannelId ||
                    videoDetails.authorExternalChannelId ||
                    ownerId;
            }

            if (!ownerId && playerMicroformat) {
                ownerId =
                    playerMicroformat.externalChannelId ||
                    playerMicroformat.channelId ||
                    playerMicroformat.ownerChannelId ||
                    ownerId;
            }

            if (playerMicroformat) {
                ownerHandle =
                    normalizeChannelHandle(playerMicroformat.ownerProfileUrl) ||
                    normalizeChannelHandle(playerMicroformat.canonicalBaseUrl) ||
                    normalizeChannelHandle(playerMicroformat.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl) ||
                    ownerHandle;
            }

            if (!ownerHandle && typeof videoDetails?.author === 'string') {
                ownerHandle = normalizeChannelHandle(videoDetails.author);
            }

            if (ownerId && ownerHandle) {
                this._registerMapping(ownerId, ownerHandle);
            }

            const playlistContents =
                data?.playlist?.contents ||
                data?.playlistPanel?.contents ||
                data?.contents?.twoColumnWatchNextResults?.playlist?.playlist?.contents ||
                data?.contents?.playlistPanelRenderer?.contents ||
                [];

            if (Array.isArray(playlistContents) && playlistContents.length > 0) {
                playlistContents.forEach(entry => {
                    const renderer =
                        entry?.playlistPanelVideoRenderer ||
                        entry?.playlistPanelVideoWrapperRenderer?.primaryRenderer;
                    if (!renderer) return;

                    const browse = renderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint;
                    const browseId = browse?.browseId;
                    const canonical = browse?.canonicalBaseUrl;
                    const normalizedHandle = normalizeChannelHandle(
                        canonical || renderer?.shortBylineText?.runs?.[0]?.text || ''
                    );
                    if (browseId && normalizedHandle) {
                        this._registerMapping(browseId, normalizedHandle);
                    }
                });
            }
        }

        /**
         * Recursively scan a data tree for video-like renderers and register
         * any UC ID <-> @handle pairs found in their byline navigation endpoints.
         */
        _harvestRendererChannelMappings(root) {
            if (!root || typeof root !== 'object') return;

            const visited = new WeakSet();

            const visit = (node) => {
                if (!node || typeof node !== 'object' || visited.has(node)) return;
                visited.add(node);

                // Unwrap common renderer containers to normalize shape
                let candidate = node;
                if (candidate.videoRenderer) {
                    candidate = candidate.videoRenderer;
                } else if (candidate.gridVideoRenderer) {
                    candidate = candidate.gridVideoRenderer;
                } else if (candidate.compactVideoRenderer) {
                    candidate = candidate.compactVideoRenderer;
                } else if (candidate.playlistVideoRenderer) {
                    candidate = candidate.playlistVideoRenderer;
                } else if (candidate.richItemRenderer?.content?.videoRenderer) {
                    candidate = candidate.richItemRenderer.content.videoRenderer;
                } else if (candidate.content?.videoRenderer) {
                    candidate = candidate.content.videoRenderer;
                }

                this._harvestFromRendererByline(candidate);

                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (value && typeof value === 'object') {
                        visit(value);
                    }
                }
            };

            visit(root);
        }

        /**
         * Given a normalized video renderer object, extract channel browseId and
         * canonicalBaseUrl/@handle from its byline/owner fields and register
         * a mapping when possible.
         */
        _harvestFromRendererByline(renderer) {
            if (!renderer || typeof renderer !== 'object') return;

            const byline = renderer.shortBylineText || renderer.longBylineText || renderer.ownerText;
            if (!byline || !Array.isArray(byline.runs)) return;

            for (const run of byline.runs) {
                if (!run || typeof run !== 'object') continue;

                const browse = run.navigationEndpoint?.browseEndpoint;
                if (!browse) continue;

                const browseId = browse.browseId;
                if (!browseId || typeof browseId !== 'string' || !browseId.startsWith('UC')) continue;

                let handle = null;

                const canonical = browse.canonicalBaseUrl || browse.canonicalUrl || browse.url;
                if (typeof canonical === 'string') {
                    const normalized = normalizeChannelHandle(canonical);
                    if (normalized) handle = normalized;
                }

                if (!handle && typeof run.text === 'string') {
                    const normalized = normalizeChannelHandle(run.text);
                    if (normalized) handle = normalized;
                }

                if (handle) {
                    this._registerMapping(browseId, handle);
                }
            }
        }

        /**
         * Register a bidirectional mapping between UC ID and handle
         */
        _registerMapping(id, handle) {
            if (!id || !handle) return;

            // Keys are lowercase for case-insensitive lookup
            // Values preserve ORIGINAL case from YouTube
            const keyId = id.toLowerCase();
            const keyHandle = handle.toLowerCase();

            // Only save if this is a new mapping
            if (this.channelMap[keyId] !== handle) {
                this.channelMap[keyId] = handle;      // UC... -> @BTS (original case)
                this.channelMap[keyHandle] = id;      // @bts -> UCLkAepWjdylmXSltofFvsYQ (original case)

                postLogToBridge('log', `🧠 LEARNED MAPPING: ${id} <-> ${handle}`);

                // Send to background via content_bridge to persist in storage
                try {
                    window.postMessage({
                        type: 'FilterTube_UpdateChannelMap',
                        payload: [{ id: id, handle: handle }],  // Send original case
                        source: 'filter_logic'
                    }, '*');
                } catch (e) {
                    console.warn('FilterTube: Failed to send channel map update', e);
                }
            }
        }

        /**
         * Register a mapping between customUrl (c/Name or user/Name) and UC ID
         */
        _registerCustomUrlMapping(id, customUrl) {
            if (!id || !customUrl) return;

            // Normalize customUrl: decode and lowercase for key
            let normalizedCustomUrl = customUrl.toLowerCase();
            try {
                normalizedCustomUrl = decodeURIComponent(normalizedCustomUrl).toLowerCase();
            } catch (e) {
                // ignore
            }

            // Only save if this is a new mapping
            if (this.channelMap[normalizedCustomUrl] !== id) {
                this.channelMap[normalizedCustomUrl] = id;  // c/name -> UC... (original case)

                postLogToBridge('log', `🧠 LEARNED CUSTOM URL MAPPING: ${customUrl} -> ${id}`);

                // Send to background via content_bridge to persist in storage
                try {
                    window.postMessage({
                        type: 'FilterTube_UpdateCustomUrlMap',
                        payload: { customUrl: normalizedCustomUrl, id: id },
                        source: 'filter_logic'
                    }, '*');
                } catch (e) {
                    console.warn('FilterTube: Failed to send custom URL map update', e);
                }
            }
        }

        /**
         * Debug logging function
         */
        _log(message, ...args) {
            if (this.debugEnabled) {
                console.log(`FilterTube (Filter):`, message, ...args);
            }
        }

        /**
         * Check if an item should be blocked based on filter rules
         */
        _shouldBlock(item, rendererType) {
            if (!item || typeof item !== 'object') return false;

            const rules = FILTER_RULES[rendererType];
            if (!rules) {
                // Log unrecognized renderer types for debugging
                if (this.debugEnabled && (rendererType.endsWith('Renderer') || rendererType.endsWith('ViewModel'))) {
                    this._log(`⚠️ No rules for renderer type: ${rendererType}`);
                }
                return false;
            }

            // Extract data using filter rules with multiple fallback attempts
            const title = this._extractTitle(item, rules);
            const channelInfo = this._extractChannelInfo(item, rules);
            const description = this._extractDescription(item, rules);
            const videoId = rules.videoId ? getByPath(item, rules.videoId) : '';
            const skipKeywordFiltering = CHANNEL_ONLY_RENDERERS.has(rendererType);

            // Handle collaboration videos (channelInfo is an array)
            const isCollaboration = Array.isArray(channelInfo);
            const collaborators = isCollaboration ? channelInfo : [channelInfo];

            // Log extraction results for debugging
            if (this.debugEnabled && (title || (channelInfo && (Array.isArray(channelInfo) || channelInfo.name || channelInfo.id)) || description)) {
                const descPreview = description ? description.substring(0, 50) + '...' : '';
                if (isCollaboration) {
                    const channelNames = collaborators.map(c => c.name || c.handle || c.id).join(' & ');
                    this._log(`📋 Extracted COLLABORATION - Title: "${title}", Channels: "${channelNames}", Type: ${rendererType}`);
                } else {
                    this._log(`📋 Extracted - Title: "${channelInfo.name}", ID: "${channelInfo.id}", Desc: "${descPreview}", Type: ${rendererType}`);
                }
            }

            // Send collaboration data to Main World for caching
            if (isCollaboration && videoId && collaborators.length > 1) {
                try {
                    window.postMessage({
                        type: 'FilterTube_CacheCollaboratorInfo',
                        payload: {
                            videoId: videoId,
                            collaborators: collaborators
                        },
                        source: 'filter_logic'
                    }, '*');
                    postLogToBridge('log', `📤 Sent collaboration data to Main World for caching: ${videoId}`);
                } catch (e) {
                    postLogToBridge('warn', 'Failed to send collaboration data to Main World:', e);
                }
            }

            // Shorts filtering
            if (this.settings.hideAllShorts && (rendererType === 'reelItemRenderer' || rendererType === 'shortsLockupViewModel' || rendererType === 'shortsLockupViewModelV2')) {
                this._log(`🚫 Blocking Shorts: ${title || 'Unknown'}`);
                return true;
            }

            // Channel filtering with comprehensive matching
            // For collaboration videos, block if ANY of the collaborators match a filter
            if (this.settings.filterChannels.length > 0) {
                for (const collaborator of collaborators) {
                    if (collaborator.name || collaborator.id || collaborator.handle) {
                        for (const filterChannel of this.settings.filterChannels) {
                            if (this._matchesChannel(filterChannel, collaborator)) {
                                if (isCollaboration) {
                                    this._log(`🚫 Blocking COLLABORATION video: "${title}" (collaborator "${collaborator.name || collaborator.handle || collaborator.id}" matched filter)`);
                                } else {
                                    this._log(`🚫 Blocking channel: ${collaborator.name || collaborator.id || collaborator.handle} (matched filter: ${filterChannel})`);
                                }
                                return true;
                            }
                        }
                    }
                }
            }

            // Keyword filtering (check title AND description)
            if (!skipKeywordFiltering && this.settings.filterKeywords.length > 0 && (title || description)) {
                const textToSearch = `${title} ${description}`.trim();

                for (const keywordRegex of this.settings.filterKeywords) {
                    if (keywordRegex.test(textToSearch)) {
                        let matchLocation = '';
                        if (keywordRegex.test(title)) matchLocation += 'title';
                        if (keywordRegex.test(description)) {
                            matchLocation += matchLocation ? '+desc' : 'desc';
                        }

                        this._log(`🚫 Blocking by keyword in ${matchLocation}: "${title.substring(0, 30)}..." (matched: ${keywordRegex.source})`);
                        return true;
                    }
                }
            }

            // Comment filtering
            if (rendererType.includes('comment') || rendererType.includes('Comment')) {
                if (this.settings.hideAllComments) {
                    this._log(`🚫 Blocking comment (hideAllComments enabled)`);
                    return true;
                }

                if (this.settings.filterComments) {
                    const commentText = rules.commentText ? getTextFromPaths(item, Array.isArray(rules.commentText) ? rules.commentText : [rules.commentText]) : '';

                    // Apply keyword filters to comments
                    if (commentText && this.settings.filterKeywords.length > 0) {
                        for (const keywordRegex of this.settings.filterKeywords) {
                            if (keywordRegex.test(commentText)) {
                                this._log(`🚫 Blocking comment by keyword: ${commentText.substring(0, 50)}...`);
                                return true;
                            }
                        }
                    }

                    // Apply channel filters to comment authors
                    // For comments, channelInfo should always be a single object, not an array
                    const commentChannelInfo = isCollaboration ? collaborators[0] : channelInfo;
                    if ((commentChannelInfo.name || commentChannelInfo.id || commentChannelInfo.handle) && this.settings.filterChannels.length > 0) {
                        for (const filterChannel of this.settings.filterChannels) {
                            if (this._matchesChannel(filterChannel, commentChannelInfo)) {
                                this._log(`🚫 Blocking comment by author: ${commentChannelInfo.name || commentChannelInfo.id || commentChannelInfo.handle}`);
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
        }

        /**
         * Extract title with fallback methods
         */
        _extractTitle(item, rules) {
            if (!rules.title) return '';

            const titlePaths = Array.isArray(rules.title) ? rules.title : [rules.title];
            for (const path of titlePaths) {
                const title = getTextFromPaths(item, [path]);
                if (title) return title;
            }

            // Additional fallback attempts for title
            const fallbackPaths = [
                'title.simpleText',
                'title.runs.0.text',
                'headline.simpleText',
                'accessibilityText',
                'text.simpleText'
            ];

            return getTextFromPaths(item, fallbackPaths);
        }

        /**
         * Extract description with fallback methods
         */
        _extractDescription(item, rules) {
            if (!rules.description && !rules.metadataRows) return '';

            if (rules.description) {
                const descPaths = Array.isArray(rules.description) ? rules.description : [rules.description];
                for (const path of descPaths) {
                    const desc = getTextFromPaths(item, [path]);
                    if (desc) return desc;
                }
            }

            if (rules.metadataRows) {
                const metadataPaths = Array.isArray(rules.metadataRows) ? rules.metadataRows : [rules.metadataRows];
                const metadataText = getMetadataRowsText(item, metadataPaths);
                if (metadataText) return metadataText;
            }

            // Additional fallback attempts for description
            const fallbackPaths = [
                'snippetText.runs',
                'snippetText.simpleText',
                'metadataText.simpleText',
                'expandedDescriptionBodyText.simpleText'
            ];

            return getTextFromPaths(item, fallbackPaths);
        }

        /**
         * Extract comprehensive channel information
         * For collaboration videos, returns an array of all collaborating channels
         */
        _extractChannelInfo(item, rules) {
            const channelInfo = { name: '', id: '', handle: '', customUrl: '' };

            // PRIORITY: Check for collaboration video (showDialogCommand in byline)
            const bylineText = item.shortBylineText || item.longBylineText;

            // DEBUG: Log when we're checking byline
            if (bylineText) {
                const bylineTextContent = flattenText(bylineText);
                if (bylineTextContent && (bylineTextContent.includes(' and ') || bylineTextContent.includes(' & '))) {
                    postLogToBridge('log', '[COLLAB DEBUG] Found potential collaboration byline:', bylineTextContent);
                    postLogToBridge('log', '[COLLAB DEBUG] Byline has runs?', !!bylineText.runs, 'runs length:', bylineText.runs?.length);
                }
            }

            if (bylineText?.runs) {
                for (const run of bylineText.runs) {
                    // DEBUG: Log run structure
                    if (run.text && (run.text.includes(' and ') || run.text.includes(' & '))) {
                        postLogToBridge('log', '[COLLAB DEBUG] Checking run with text:', run.text);
                        postLogToBridge('log', '[COLLAB DEBUG] Has navigationEndpoint?', !!run.navigationEndpoint);
                        postLogToBridge('log', '[COLLAB DEBUG] Has showDialogCommand?', !!run.navigationEndpoint?.showDialogCommand);
                    }

                    // Look for showDialogCommand which indicates a collaboration video
                    const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
                    if (showDialogCommand) {
                        postLogToBridge('log', '🎯 Detected COLLABORATION video via showDialogCommand in filter_logic');

                        // Extract all collaborating channels from listItems
                        const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;

                        if (listItems && Array.isArray(listItems)) {
                            const collaborators = [];

                            for (const item of listItems) {
                                const listItemViewModel = item.listItemViewModel;
                                if (listItemViewModel) {
                                    const browseEndpoint = listItemViewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;
                                    const title = listItemViewModel.title?.content;

                                    if (browseEndpoint) {
                                        const browseId = browseEndpoint.browseId;
                                        const canonicalBaseUrl = browseEndpoint.canonicalBaseUrl;

                                        let collabChannelInfo = { name: title || '', id: '', handle: '', customUrl: '' };

                                        // Extract handle or customUrl from canonicalBaseUrl
                                        if (canonicalBaseUrl) {
                                            if (canonicalBaseUrl.startsWith('/@')) {
                                                const normalized = normalizeChannelHandle(canonicalBaseUrl);
                                                if (normalized) {
                                                    collabChannelInfo.handle = normalized;
                                                }
                                            } else if (canonicalBaseUrl.startsWith('/c/')) {
                                                const slug = canonicalBaseUrl.split('/')[2];
                                                if (slug) {
                                                    collabChannelInfo.customUrl = 'c/' + slug;
                                                }
                                            } else if (canonicalBaseUrl.startsWith('/user/')) {
                                                const slug = canonicalBaseUrl.split('/')[2];
                                                if (slug) {
                                                    collabChannelInfo.customUrl = 'user/' + slug;
                                                }
                                            }
                                        }

                                        // Extract UC ID
                                        if (browseId?.startsWith('UC')) {
                                            collabChannelInfo.id = browseId;
                                        }

                                        if (collabChannelInfo.handle || collabChannelInfo.id || collabChannelInfo.customUrl) {
                                            collaborators.push(collabChannelInfo);
                                            postLogToBridge('log', '✅ Extracted collaborator in filter_logic:', collabChannelInfo);

                                            // Register mapping for this collaborator
                                            if (collabChannelInfo.id && collabChannelInfo.handle) {
                                                this._registerMapping(collabChannelInfo.id, collabChannelInfo.handle);
                                            }
                                            // Also register customUrl → UC ID mapping
                                            if (collabChannelInfo.id && collabChannelInfo.customUrl) {
                                                this._registerCustomUrlMapping(collabChannelInfo.id, collabChannelInfo.customUrl);
                                            }
                                        }
                                    }
                                }
                            }

                            if (collaborators.length > 1) {
                                postLogToBridge('log', '🎉 Found', collaborators.length, 'collaborating channels:', collaborators);

                                // Send collaboration data to Main World for caching
                                // Note: We need the videoId to cache this, but we don't have it here
                                // The videoId will be available in _shouldBlock, so we'll send it from there

                                // Return an array of all collaborators for special handling
                                return collaborators;
                            } else if (collaborators.length === 1) {
                                // Single channel, not a collaboration
                                postLogToBridge('log', '⚠️ Only 1 collaborator found, treating as single channel');
                                return collaborators[0];
                            }
                        } else {
                            postLogToBridge('log', '⚠️ showDialogCommand found but no listItems');
                        }
                    }
                }
            }

            // Extract using rules
            if (rules.channelName) {
                const paths = Array.isArray(rules.channelName) ? rules.channelName : [rules.channelName];
                channelInfo.name = getTextFromPaths(item, paths);
            }

            if (rules.channelId) {
                channelInfo.id = getByPath(item, rules.channelId);
            }

            if (rules.channelHandle) {
                const handlePaths = Array.isArray(rules.channelHandle) ? rules.channelHandle : [rules.channelHandle];
                channelInfo.handle = extractChannelHandleFromPaths(item, handlePaths);
            }

            // Additional fallback extraction attempts
            if (!channelInfo.name || !channelInfo.id) {
                // Try common paths for channel data
                const fallbackNamePaths = [
                    'shortBylineText.runs.0.text',
                    'longBylineText.runs.0.text',
                    'ownerText.runs.0.text',
                    'authorText.simpleText',
                    'ownerBadges.metadataBadgeRenderer.tooltip'
                ];

                const fallbackIdPaths = [
                    'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
                    'longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
                    'ownerText.runs.0.navigationEndpoint.browseEndpoint.browseId',
                    'authorEndpoint.browseEndpoint.browseId',
                    'channelId'
                ];

                if (!channelInfo.name) {
                    channelInfo.name = getTextFromPaths(item, fallbackNamePaths);
                }

                if (!channelInfo.id) {
                    channelInfo.id = getTextFromPaths(item, fallbackIdPaths);
                }

                if (!channelInfo.handle || !channelInfo.customUrl) {
                    const fallbackHandlePaths = [
                        'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'navigationEndpoint.browseEndpoint.canonicalBaseUrl'
                    ];

                    // Try to extract handle or customUrl from canonicalBaseUrl
                    for (const path of fallbackHandlePaths) {
                        const canonicalBaseUrl = getByPath(item, path);
                        if (canonicalBaseUrl && typeof canonicalBaseUrl === 'string') {
                            if (!channelInfo.handle && canonicalBaseUrl.startsWith('/@')) {
                                const normalized = normalizeChannelHandle(canonicalBaseUrl);
                                if (normalized) {
                                    channelInfo.handle = normalized;
                                }
                            } else if (!channelInfo.customUrl && canonicalBaseUrl.startsWith('/c/')) {
                                const slug = canonicalBaseUrl.split('/')[2];
                                if (slug) {
                                    channelInfo.customUrl = 'c/' + slug;
                                }
                            } else if (!channelInfo.customUrl && canonicalBaseUrl.startsWith('/user/')) {
                                const slug = canonicalBaseUrl.split('/')[2];
                                if (slug) {
                                    channelInfo.customUrl = 'user/' + slug;
                                }
                            }
                        }
                        // Stop if we have what we need
                        if (channelInfo.handle && channelInfo.customUrl) break;
                    }
                }
            }

            return channelInfo;
        }

        /**
         * Check if a channel matches a filter with comprehensive logic
         * Handles both legacy string filters and new object filters with name/id/handle
         */
        _matchesChannel(filterChannel, channelInfo) {
            const sharedChannelMatchesFilter = window.FilterTubeIdentity?.channelMatchesFilter;
            if (typeof sharedChannelMatchesFilter === 'function') {
                return sharedChannelMatchesFilter(channelInfo, filterChannel, this.channelMap);
            }
            // Handle new object format: { name, id, handle, customUrl }
            if (typeof filterChannel === 'object' && filterChannel !== null) {
                const filterId = (filterChannel.id || '').toLowerCase();
                const filterHandle = (filterChannel.handle || '').toLowerCase();
                let filterCustomUrl = (filterChannel.customUrl || '').toLowerCase();
                // Decode percent-encoding in customUrl for matching
                try {
                    filterCustomUrl = decodeURIComponent(filterCustomUrl).toLowerCase();
                } catch (e) {
                    // ignore
                }

                // Direct match by UC ID
                if (filterId && channelInfo.id && channelInfo.id.toLowerCase() === filterId) {
                    return true;
                }

                // Direct match by handle
                if (filterHandle && channelInfo.handle && channelInfo.handle.toLowerCase() === filterHandle) {
                    return true;
                }

                // Direct match by customUrl (c/Name or user/Name)
                if (filterCustomUrl && channelInfo.customUrl) {
                    let infoCustomUrl = channelInfo.customUrl.toLowerCase();
                    try {
                        infoCustomUrl = decodeURIComponent(infoCustomUrl).toLowerCase();
                    } catch (e) {
                        // ignore
                    }
                    if (infoCustomUrl === filterCustomUrl) {
                        return true;
                    }
                }

                // Use channelMap to cross-match: if we're blocking UC ID, also block its handle
                if (filterId && channelInfo.handle) {
                    const mappedHandle = this.channelMap[filterId];
                    if (mappedHandle && channelInfo.handle.toLowerCase() === mappedHandle) {
                        return true;
                    }
                }

                // Use channelMap to cross-match: if we're blocking handle, also block its UC ID
                if (filterHandle && channelInfo.id) {
                    const mappedId = this.channelMap[filterHandle];
                    if (mappedId && channelInfo.id.toLowerCase() === mappedId) {
                        return true;
                    }
                }

                // Use channelMap to cross-match: if we're blocking customUrl, match its UC ID
                if (filterCustomUrl && channelInfo.id) {
                    const mappedId = this.channelMap[filterCustomUrl];
                    if (mappedId && channelInfo.id.toLowerCase() === mappedId.toLowerCase()) {
                        return true;
                    }
                }

                // Use channelMap to cross-match: if channelInfo has customUrl, check if its mapped UC ID matches filterId
                if (filterId && channelInfo.customUrl) {
                    let infoCustomUrl = channelInfo.customUrl.toLowerCase();
                    try {
                        infoCustomUrl = decodeURIComponent(infoCustomUrl).toLowerCase();
                    } catch (e) {
                        // ignore
                    }
                    const mappedId = this.channelMap[infoCustomUrl];
                    if (mappedId && mappedId.toLowerCase() === filterId) {
                        return true;
                    }
                }

                return false;
            }

            // Legacy string format
            const filter = String(filterChannel).toLowerCase();

            // Direct handle matching (@username)
            if (filter.startsWith('@')) {
                if (channelInfo.handle && channelInfo.handle.toLowerCase() === filter) {
                    return true;
                }

                // Check channelMap: if filter is a handle, get its UC ID and match
                const mappedId = this.channelMap[filter];
                if (mappedId && channelInfo.id && channelInfo.id.toLowerCase() === mappedId) {
                    return true;
                }

                // Also check if channel name matches without @
                const filterWithoutAt = filter.substring(1);
                if (channelInfo.name && channelInfo.name.toLowerCase() === filterWithoutAt) {
                    return true;
                }
            }

            // Channel ID matching (UC... or channel/UC...)
            if (channelInfo.id) {
                const channelId = channelInfo.id.toLowerCase();

                // Support both "UCxxxxx" and "channel/UCxxxxx" formats
                if (filter.startsWith('channel/')) {
                    const filterIdPart = filter.substring(8); // Remove "channel/" prefix
                    if (channelId === filterIdPart) {
                        return true;
                    }

                    // Check channelMap for cross-matching
                    const mappedHandle = this.channelMap[filterIdPart];
                    if (mappedHandle && channelInfo.handle && channelInfo.handle.toLowerCase() === mappedHandle) {
                        return true;
                    }
                } else if (filter.startsWith('uc')) {
                    if (channelId === filter) {
                        return true;
                    }

                    // Check channelMap: if filter is UC ID, also match its handle
                    const mappedHandle = this.channelMap[filter];
                    if (mappedHandle && channelInfo.handle && channelInfo.handle.toLowerCase() === mappedHandle) {
                        return true;
                    }
                }
            }

            // Reverse check: if channelInfo has handle, check if mapped ID matches filter
            if (channelInfo.handle && filter.startsWith('uc')) {
                const handleLower = channelInfo.handle.toLowerCase();
                const mappedId = this.channelMap[handleLower];
                if (mappedId && mappedId === filter) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Recursively filter a YouTube data object
         */
        filter(obj, path = 'root') {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }

            // Handle arrays
            if (Array.isArray(obj)) {
                const filtered = [];
                for (let i = 0; i < obj.length; i++) {
                    const item = this.filter(obj[i], `${path}[${i}]`);
                    if (item !== null) {
                        filtered.push(item);
                    }
                }
                return filtered;
            }

            // Handle objects - check if this object should be filtered
            const rendererTypes = Object.keys(obj).filter(key => key.endsWith('Renderer') || key.endsWith('ViewModel'));

            for (const rendererType of rendererTypes) {
                if (this._shouldBlock(obj[rendererType], rendererType)) {
                    this.blockedCount++;
                    this._log(`✂️ Removed ${rendererType} at ${path}`);
                    return null; // Remove this entire object
                }
            }

            // Recursively process all properties
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                const filteredValue = this.filter(value, `${path}.${key}`);
                if (filteredValue !== null) {
                    result[key] = filteredValue;
                }
            }

            return result;
        }

        /**
         * Process YouTube data with filtering
         */
        processData(data, dataName = 'unknown') {
            if (!data) {
                this._log(`⚠️ No data to process for ${dataName}`);
                return data;
            }

            // 1. HARVEST FIRST: Learn ID/Handle mappings before filtering
            try {
                this._harvestChannelData(data);
            } catch (e) {
                console.warn('FilterTube: Harvesting failed', e);
            }

            // 2. THEN FILTER
            this._log(`🔄 Starting to filter ${dataName}`);
            this.blockedCount = 0;

            const startTime = Date.now();
            const filtered = this.filter(data);
            const endTime = Date.now();

            this._log(`✅ Filtered ${dataName} in ${endTime - startTime}ms, blocked ${this.blockedCount} items`);

            return filtered;
        }
    }

    // ============================================================================
    // GLOBAL INTERFACE
    // ============================================================================

    // Export the filtering functionality globally
    window.FilterTubeEngine = {
        YouTubeDataFilter,

        // Full processing: harvest + filtering
        processData: function (data, settings, dataName = 'data') {
            const filter = new YouTubeDataFilter(settings);
            return filter.processData(data, dataName);
        },

        // Harvest-only entry point used when seed.js wants to learn
        // UC ID <-> @handle mappings from ytInitialData/fetch blobs
        // without mutating the data (e.g., search results, home feed).
        harvestOnly: function (data, settings) {
            if (!data) return;
            try {
                const filter = new YouTubeDataFilter(settings || { filterChannels: [], filterKeywords: [] });
                filter._harvestChannelData(data);
            } catch (e) {
                console.warn('FilterTube: harvestOnly failed', e);
            }
        }
    };

    postLogToBridge('log', 'Comprehensive filtering engine loaded successfully');

})(); 