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
     * Enhanced to handle arrays: when encountering an array, finds the first
     * element that contains the next key (enables paths without explicit indices).
     * Also supports bracket notation like "metadataRows[0]" for explicit access.
     * @param {Object} obj - Source object
     * @param {string|Array} path - Property path (e.g., 'title.simpleText' or ['title', 'simpleText'])
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Property value or default
     */
    function getByPath(obj, path, defaultValue = undefined) {
        if (!obj || typeof obj !== 'object') return defaultValue;

        const keys = Array.isArray(path) ? path : path.split('.');
        let current = obj;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (current === null || current === undefined) {
                return defaultValue;
            }

            // Handle bracket notation like "metadataRows[0]" or "metadataRows[1]"
            if (/\[\d+\]/.test(key)) {
                const parts = key.match(/^([^\[]+)(?:\[(\d+)\])+$/);
                if (parts) {
                    const baseName = parts[1];
                    const indices = [...key.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1], 10));
                    
                    if (baseName && baseName in current) {
                        current = current[baseName];
                    } else if (baseName) {
                        return defaultValue;
                    }
                    
                    for (const idx of indices) {
                        if (!Array.isArray(current) || idx >= current.length) {
                            return defaultValue;
                        }
                        current = current[idx];
                    }
                    continue;
                }
            }

            // If current is an array and key is not a number, find first element with that key
            if (Array.isArray(current)) {
                const found = current.find(item => item && typeof item === 'object' && key in item);
                if (found === undefined) {
                    return defaultValue;
                }
                current = found[key];
            } else if (key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
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

    function getFirstValueByPaths(obj, paths) {
        for (const path of paths) {
            const value = getByPath(obj, path);
            if (value !== undefined && value !== null) {
                return value;
            }
        }
        return undefined;
    }

    function extractBrowseEndpoint(candidate) {
        if (!candidate || typeof candidate !== 'object') return null;

        if (candidate.browseEndpoint) return candidate.browseEndpoint;
        if (candidate.navigationEndpoint?.browseEndpoint) return candidate.navigationEndpoint.browseEndpoint;
        if (candidate.onTap) {
            const tapCommand = candidate.onTap.innertubeCommand || candidate.onTap;
            if (tapCommand?.browseEndpoint) {
                return tapCommand.browseEndpoint;
            }
        }
        if (candidate.commandContext?.onTap) {
            const nested = extractBrowseEndpoint(candidate.commandContext.onTap);
            if (nested) return nested;
        }
        if (candidate.innertubeCommand?.browseEndpoint) {
            return candidate.innertubeCommand.browseEndpoint;
        }

        return null;
    }

    function applyBrowseEndpointToChannelInfo(channelInfo, endpoint) {
        if (!endpoint) return false;
        let changed = false;

        const browseId = endpoint.browseId;
        if (!channelInfo.id && typeof browseId === 'string' && browseId.startsWith('UC')) {
            channelInfo.id = browseId;
            changed = true;
        }

        if (!channelInfo.handle && endpoint.canonicalBaseUrl) {
            const normalizedHandle = normalizeChannelHandle(endpoint.canonicalBaseUrl);
            if (normalizedHandle) {
                channelInfo.handle = normalizedHandle;
                changed = true;
            }
        }

        return changed;
    }

    function extractBrowseEndpointFromRuns(runs) {
        if (!Array.isArray(runs)) return null;
        for (const run of runs) {
            const endpoint = extractBrowseEndpoint(run);
            if (endpoint) return endpoint;

            if (run.commandRuns) {
                const nested = extractBrowseEndpointFromCommandRuns(run.commandRuns);
                if (nested) return nested;
            }
        }
        return null;
    }

    function extractBrowseEndpointFromCommandRuns(commandRuns) {
        if (!Array.isArray(commandRuns)) return null;
        for (const commandRun of commandRuns) {
            const endpoint = extractBrowseEndpoint(commandRun);
            if (endpoint) return endpoint;
        }
        return null;
    }

    function extractBrowseEndpointFromMetadataRows(rows) {
        if (!rows) return null;
        let processedRows = rows;
        if (!Array.isArray(processedRows)) {
            processedRows = processedRows.metadataRows || processedRows.rows || [];
        }

        if (!Array.isArray(processedRows)) return null;

        for (const row of processedRows) {
            if (!row) continue;

            if (Array.isArray(row.metadataParts)) {
                for (const part of row.metadataParts) {
                    if (!part) continue;
                    const direct = extractBrowseEndpoint(part);
                    if (direct) return direct;

                    const textEndpoint = extractBrowseEndpoint(part.text);
                    if (textEndpoint) return textEndpoint;

                    const commandRuns = part.text?.commandRuns;
                    const nested = extractBrowseEndpointFromCommandRuns(commandRuns);
                    if (nested) return nested;
                }
            }

            const rowCommands = extractBrowseEndpointFromCommandRuns(row.commandRuns);
            if (rowCommands) return rowCommands;
        }

        return null;
    }

    function normalizeChannelHandle(rawHandle) {
        if (typeof rawHandle !== 'string') return '';
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

        return `@${handleCore}`;
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
            // Channel name from metadata rows (auto-traverses arrays with enhanced getByPath)
            channelName: [
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.metadataParts.text.content',
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content'
            ],
            // Channel ID extraction paths (ordered by reliability)
            channelId: [
                // Primary: via decorated avatar image link
                'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId',
                // Via metadata rows (auto-traverses arrays)
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.metadataParts.text.commandRuns.onTap.innertubeCommand.browseEndpoint.browseId',
                // Explicit array indices as fallback
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.commandRuns.0.onTap.innertubeCommand.browseEndpoint.browseId',
                // Via byline
                'metadata.lockupMetadataViewModel.byline.commandRuns.onTap.innertubeCommand.browseEndpoint.browseId',
                // Direct rendererContext path
                'rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId'
            ],
            channelHandle: [
                // Primary: via decorated avatar image link
                'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                // Via metadata rows (auto-traverses arrays)
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.metadataParts.text.commandRuns.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                // Explicit array indices as fallback
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.commandRuns.0.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                // Via byline
                'metadata.lockupMetadataViewModel.byline.commandRuns.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                // Direct rendererContext path
                'rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl'
            ],
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
        playlistPanelVideoRenderer: {
            videoId: 'videoId',
            title: ['title.simpleText', 'title.runs'],
            channelName: ['shortBylineText.simpleText', 'shortBylineText.runs', 'longBylineText.simpleText', 'longBylineText.runs'],
            // Channel ID paths (auto-traverses arrays for flexible extraction)
            channelId: [
                'shortBylineText.runs.navigationEndpoint.browseEndpoint.browseId',
                'longBylineText.runs.navigationEndpoint.browseEndpoint.browseId',
                // Explicit indices as fallback
                'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
                'longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: [
                'shortBylineText.runs.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'longBylineText.runs.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                // Explicit indices as fallback
                'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'
            ]
        },
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
            this.channelNames = settings.channelNames || {}; // UC ID -> { name, handle } for name-based fallback matching
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

            // Ensure filterChannels are objects with all properties
            if (settings.filterChannels && Array.isArray(settings.filterChannels)) {
                processed.filterChannels = settings.filterChannels.map(ch => {
                    // Convert legacy string format to object if necessary
                    if (typeof ch === 'string') {
                        return { name: ch, id: ch, handle: null, logo: null, filterAll: false };
                    }
                    // For objects, ensure properties exist (case is preserved; matching code lowercases when needed)
                    return {
                        ...ch,
                        id: ch.id || '',
                        handle: ch.handle || '',
                        name: ch.name || '',
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

            // 1. Check Channel Metadata (appears on channel pages)
            const meta = data?.metadata?.channelMetadataRenderer;
            if (meta?.externalId) {
                const id = meta.externalId;
                let handle = null;

                // Method A: Check vanityChannelUrl (Standard)
                if (meta.vanityChannelUrl) {
                    const match = meta.vanityChannelUrl.match(/@[\w.-]+/);
                    if (match) handle = match[0];
                }

                // Method B: Check ownerUrls (Alternative location, used by Shakira's channel)
                if (!handle && meta.ownerUrls && Array.isArray(meta.ownerUrls)) {
                    for (const url of meta.ownerUrls) {
                        const match = url.match(/@[\w.-]+/);
                        if (match) {
                            handle = match[0];
                            break;
                        }
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
                const handleMatch = handleUrl ? handleUrl.match(/@[\w.-]+/) : null;

                if (idMatch && handleMatch) {
                    this._registerMapping(idMatch[1], handleMatch[0]);
                }
            }

            // 3. Check response context (sometimes contains channel info)
            const responseContext = data?.responseContext;
            if (responseContext?.webResponseContextExtensionData?.ytConfigData) {
                const ytConfig = responseContext.webResponseContextExtensionData.ytConfigData;
                if (ytConfig.channelId && ytConfig.channelName) {
                    // Try to find handle from canonicalBaseUrl
                    const handleMatch = ytConfig.canonicalBaseUrl?.match(/@[\w.-]+/);
                    if (handleMatch) {
                        this._registerMapping(ytConfig.channelId, handleMatch[0]);
                    }
                }
            }
        }

        /**
         * Register a bidirectional mapping between UC ID and handle
         * @param {string} id - Channel UC ID
         * @param {string} handle - Channel @handle
         * @param {string} [name] - Optional channel display name
         */
        _registerMapping(id, handle, name = '') {
            if (!id || !handle) return;

            // Keys are lowercase for case-insensitive lookup
            // Values preserve ORIGINAL case from YouTube
            const keyId = id.toLowerCase();
            const keyHandle = handle.toLowerCase();

            // Only save if this is a new mapping
            if (this.channelMap[keyId] !== handle) {
                this.channelMap[keyId] = handle;      // UC... -> @BTS (original case)
                this.channelMap[keyHandle] = id;      // @bts -> UCLkAepWjdylmXSltofFvsYQ (original case)

                postLogToBridge('log', `🧠 LEARNED MAPPING: ${id} <-> ${handle}${name ? ` (${name})` : ''}`);

                // Send to background via content_bridge to persist in storage
                // Include name so background can build channelNames dictionary
                try {
                    window.postMessage({
                        type: 'FilterTube_UpdateChannelMap',
                        payload: [{ id: id, handle: handle, name: name || '' }],  // Send original case + name
                        source: 'filter_logic'
                    }, '*');
                } catch (e) {
                    console.warn('FilterTube: Failed to send channel map update', e);
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

            // Watch page diagnostics: surface when channel extraction failed for playlist/right-rail renderers
            if (this.debugEnabled && !isCollaboration && (!channelInfo?.id && !channelInfo?.handle)) {
                const isWatchRenderer = rendererType === 'playlistPanelVideoRenderer' || rendererType === 'lockupViewModel';
                if (isWatchRenderer) {
                    this._log(
                        `🕵️ Watch renderer missing channel identity: ${rendererType}`,
                        {
                            titlePreview: title?.substring(0, 60) || 'N/A',
                            hasByline: Boolean(item.shortBylineText || item.longBylineText),
                            hasMetadataRows: Boolean(item.metadata?.lockupMetadataViewModel || item.metadataRows),
                            videoId
                        }
                    );
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

            // Cache single-channel metadata for later lookup (watch page playlists, etc.)
            if (!isCollaboration && videoId && collaborators[0]) {
                const primaryChannel = collaborators[0];
                if (primaryChannel.handle || primaryChannel.id || primaryChannel.name) {
                    try {
                        window.postMessage({
                            type: 'FilterTube_CacheChannelInfo',
                            payload: {
                                videoId,
                                channel: primaryChannel
                            },
                            source: 'filter_logic'
                        }, '*');
                    } catch (e) {
                        postLogToBridge('warn', 'Failed to send channel data to Main World:', e);
                    }
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
            const channelInfo = { name: '', id: '', handle: '' };

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

                                        let collabChannelInfo = { name: title || '', id: '', handle: '' };

                                        // Extract handle from canonicalBaseUrl
                                        if (canonicalBaseUrl) {
                                            const handleMatch = canonicalBaseUrl.match(/@([\w-]+)/);
                                            if (handleMatch) {
                                                collabChannelInfo.handle = `@${handleMatch[1]}`;
                                            }
                                        }

                                        // Extract UC ID
                                        if (browseId?.startsWith('UC')) {
                                            collabChannelInfo.id = browseId;
                                        }

                                        if (collabChannelInfo.handle || collabChannelInfo.id) {
                                            collaborators.push(collabChannelInfo);
                                            postLogToBridge('log', '✅ Extracted collaborator in filter_logic:', collabChannelInfo);

                                            // Register mapping for this collaborator (include name)
                                            if (collabChannelInfo.id && collabChannelInfo.handle) {
                                                this._registerMapping(collabChannelInfo.id, collabChannelInfo.handle, collabChannelInfo.name || '');
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
                // Handle both single path and array of paths
                const idPaths = Array.isArray(rules.channelId) ? rules.channelId : [rules.channelId];
                for (const path of idPaths) {
                    const id = getByPath(item, path);
                    if (id && typeof id === 'string' && id.startsWith('UC')) {
                        channelInfo.id = id;
                        break;
                    }
                }
            }

            if (rules.channelHandle) {
                const handlePaths = Array.isArray(rules.channelHandle) ? rules.channelHandle : [rules.channelHandle];
                channelInfo.handle = extractChannelHandleFromPaths(item, handlePaths);
            }

            // Additional fallback extraction attempts
            if (!channelInfo.name || !channelInfo.id) {
                // Try common paths for channel data (Renderer patterns)
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
                    'channelId',
                    // ViewModel-specific paths
                    'metadata.lockupMetadataViewModel.metadata.avatarViewModel.avatarRendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId',
                    'rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId'
                ];

                if (!channelInfo.name) {
                    channelInfo.name = getTextFromPaths(item, fallbackNamePaths);
                }

                if (!channelInfo.id) {
                    channelInfo.id = getTextFromPaths(item, fallbackIdPaths);
                }

                if (!channelInfo.handle) {
                    const fallbackHandlePaths = [
                        'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        // ViewModel-specific paths
                        'metadata.lockupMetadataViewModel.metadata.avatarViewModel.avatarRendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                        'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                        'rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl'
                    ];

                    channelInfo.handle = extractChannelHandleFromPaths(item, fallbackHandlePaths);
                }
            }

            // Attempt to extract browse endpoint references for watch-page ViewModels
            if (!channelInfo.id || !channelInfo.handle) {
                const runPaths = [
                    'shortBylineText.runs',
                    'longBylineText.runs',
                    'ownerText.runs',
                    'channelName.runs',
                    'attributedChannelName.runs'
                ];

                for (const path of runPaths) {
                    const runs = getByPath(item, path);
                    const endpoint = extractBrowseEndpointFromRuns(runs);
                    if (endpoint && applyBrowseEndpointToChannelInfo(channelInfo, endpoint)) {
                        if (channelInfo.id && channelInfo.handle) break;
                    }
                }

                if (!channelInfo.id || !channelInfo.handle) {
                    const commandRunPaths = [
                        'metadata.lockupMetadataViewModel.byline.commandRuns',
                        'byline.commandRuns'
                    ];
                    for (const path of commandRunPaths) {
                        const commandRuns = getByPath(item, path);
                        const endpoint = extractBrowseEndpointFromCommandRuns(commandRuns);
                        if (endpoint && applyBrowseEndpointToChannelInfo(channelInfo, endpoint)) {
                            if (channelInfo.id && channelInfo.handle) break;
                        }
                    }
                }

                if (!channelInfo.id || !channelInfo.handle) {
                    const metadataRowsPaths = [];
                    if (rules.metadataRows) {
                        const ruleMetadataPaths = Array.isArray(rules.metadataRows) ? rules.metadataRows : [rules.metadataRows];
                        metadataRowsPaths.push(...ruleMetadataPaths);
                    }
                    metadataRowsPaths.push('metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows');
                    metadataRowsPaths.push('metadata.contentMetadataViewModel.metadataRows');
                    metadataRowsPaths.push('metadataRows');

                    const metadataRowsValue = getFirstValueByPaths(item, metadataRowsPaths);
                    const endpoint = extractBrowseEndpointFromMetadataRows(metadataRowsValue);
                    if (endpoint) {
                        applyBrowseEndpointToChannelInfo(channelInfo, endpoint);
                    }
                }

                if (!channelInfo.id || !channelInfo.handle) {
                    const directEndpointPaths = [
                        'metadata.lockupMetadataViewModel.metadata.avatarViewModel.avatarRendererContext.commandContext.onTap',
                        'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.rendererContext.commandContext.onTap',
                        'channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.navigationEndpoint',
                        'channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer',
                        'navigationEndpoint'
                    ];

                    for (const path of directEndpointPaths) {
                        const candidate = getByPath(item, path);
                        const endpoint = extractBrowseEndpoint(candidate);
                        if (endpoint && applyBrowseEndpointToChannelInfo(channelInfo, endpoint)) {
                            if (channelInfo.id && channelInfo.handle) break;
                        }
                    }
                }
            }

            // LAST RESORT: Recursive search for browseEndpoint in ViewModels
            if (!channelInfo.id && !channelInfo.handle) {
                const found = this._findBrowseEndpointRecursive(item, 4); // Max depth 4 for watch page payloads
                if (found) {
                    if (found.browseId?.startsWith('UC') && !channelInfo.id) {
                        channelInfo.id = found.browseId;
                    }
                    if (found.canonicalBaseUrl && !channelInfo.handle) {
                        channelInfo.handle = normalizeChannelHandle(found.canonicalBaseUrl);
                    }
                }
            }

            if (!Array.isArray(channelInfo)) {
                if (channelInfo.id && !channelInfo.handle) {
                    const mappedHandle = this.channelMap[channelInfo.id.toLowerCase()];
                    if (mappedHandle?.startsWith('@')) {
                        channelInfo.handle = mappedHandle;
                    }
                }
                if (channelInfo.handle && !channelInfo.id) {
                    const mappedId = this.channelMap[channelInfo.handle.toLowerCase()];
                    if (mappedId?.startsWith('UC')) {
                        channelInfo.id = mappedId;
                    }
                }
            }

            if (!Array.isArray(channelInfo) && channelInfo.id && channelInfo.handle) {
                this._registerMapping(channelInfo.id, channelInfo.handle, channelInfo.name || '');
            }

            return channelInfo;
        }

        /**
         * Recursively search for browseEndpoint in an object (for ViewModels)
         * @param {Object} obj - Object to search
         * @param {number} maxDepth - Maximum recursion depth
         * @param {number} currentDepth - Current recursion depth
         * @returns {Object|null} - browseEndpoint object or null
         */
        _findBrowseEndpointRecursive(obj, maxDepth = 3, currentDepth = 0) {
            if (!obj || typeof obj !== 'object' || currentDepth > maxDepth) return null;

            // Check if this object IS a browseEndpoint
            if (obj.browseId?.startsWith('UC') || obj.canonicalBaseUrl?.includes('/@')) {
                return obj;
            }

            // Skip arrays and certain keys to avoid performance issues
            if (Array.isArray(obj)) {
                for (const item of obj.slice(0, 5)) { // Only check first 5 items
                    const result = this._findBrowseEndpointRecursive(item, maxDepth, currentDepth + 1);
                    if (result) return result;
                }
                return null;
            }

            // Check for browseEndpoint property directly
            if (obj.browseEndpoint) {
                const endpoint = obj.browseEndpoint;
                if (endpoint.browseId?.startsWith('UC') || endpoint.canonicalBaseUrl?.includes('/@')) {
                    return endpoint;
                }
            }

            // Recurse into specific ViewModel paths that likely contain channel info
            const priorityKeys = ['metadata', 'rendererContext', 'avatarViewModel', 'byline', 'onTap', 'innertubeCommand'];
            for (const key of priorityKeys) {
                if (obj[key] && typeof obj[key] === 'object') {
                    const result = this._findBrowseEndpointRecursive(obj[key], maxDepth, currentDepth + 1);
                    if (result) return result;
                }
            }

            return null;
        }

        /**
         * Check if a channel matches a filter with comprehensive logic
         * Handles both legacy string filters and new object filters with name/id/handle
         */
        _matchesChannel(filterChannel, channelInfo = {}) {
            const candidateHandle = (channelInfo.handle || '').toLowerCase();
            const candidateId = (channelInfo.id || '').toLowerCase();
            const candidateName = (channelInfo.name || '').trim().toLowerCase();

            // New object format (has id/handle/name fields)
            if (filterChannel && typeof filterChannel === 'object') {
                const filterId = (filterChannel.id || '').toLowerCase();
                const filterHandle = (filterChannel.handle || '').toLowerCase();
                const filterName = (filterChannel.name || '').trim().toLowerCase();

                if (filterId && candidateId === filterId) return true;
                if (filterHandle && candidateHandle === filterHandle) return true;

                if (filterId && candidateHandle) {
                    const mappedHandle = this.channelMap[filterId];
                    if (typeof mappedHandle === 'string' && candidateHandle === mappedHandle.toLowerCase()) {
                        return true;
                    }
                }

                if (filterHandle && candidateId) {
                    const mappedId = this.channelMap[filterHandle];
                    if (typeof mappedId === 'string' && candidateId === mappedId.toLowerCase()) {
                        return true;
                    }
                }

                if (filterName && candidateName && filterName === candidateName) {
                    return true;
                }

                // Cross-matching: If candidate only has name, check channelNames for filter's known name
                if (candidateName && !candidateId && !candidateHandle) {
                    // Try ID -> Name lookup via channelNames dictionary
                    if (filterId) {
                        const nameData = this.channelNames[filterId] || this.channelNames[filterId.toUpperCase()];
                        if (nameData && nameData.name) {
                            if (candidateName === nameData.name.toLowerCase()) {
                                return true;
                            }
                        }
                    }
                    // Try Handle -> Name lookup via channelNames
                    if (filterHandle) {
                        // Look up the ID for this handle, then check channelNames
                        const mappedId = this.channelMap[filterHandle];
                        if (mappedId) {
                            const nameData = this.channelNames[mappedId] || this.channelNames[mappedId.toLowerCase()];
                            if (nameData && nameData.name) {
                                if (candidateName === nameData.name.toLowerCase()) {
                                    return true;
                                }
                            }
                        }
                    }
                    // Also check if filterName matches any stored name in channelNames
                    if (filterName) {
                        for (const [id, data] of Object.entries(this.channelNames)) {
                            if (data.name && data.name.toLowerCase() === candidateName) {
                                // Found a match - the candidate name matches a known channel
                                return true;
                            }
                        }
                    }
                }

                return false;
            }

            // Legacy string filter
            const filter = String(filterChannel || '').trim().toLowerCase();
            if (!filter) return false;

            if (filter.startsWith('@')) {
                if (candidateHandle === filter) return true;

                const mappedId = this.channelMap[filter];
                if (typeof mappedId === 'string' && candidateId === mappedId.toLowerCase()) {
                    return true;
                }

                const filterWithoutAt = filter.substring(1);
                if (candidateName && candidateName === filterWithoutAt) {
                    return true;
                }

                return false;
            }

            if (filter.startsWith('channel/')) {
                const filterIdPart = filter.substring(8);
                if (candidateId === filterIdPart) return true;

                const mappedHandle = this.channelMap[filterIdPart];
                if (typeof mappedHandle === 'string' && candidateHandle === mappedHandle.toLowerCase()) {
                    return true;
                }

                return false;
            }

            if (filter.startsWith('uc')) {
                if (candidateId === filter) return true;

                const mappedHandle = this.channelMap[filter];
                if (typeof mappedHandle === 'string' && candidateHandle === mappedHandle.toLowerCase()) {
                    return true;
                }

                if (candidateHandle) {
                    const mappedId = this.channelMap[candidateHandle];
                    if (typeof mappedId === 'string' && mappedId.toLowerCase() === filter) {
                        return true;
                    }
                }

                return false;
            }

            if (candidateName && filter && candidateName === filter) {
                return true;
            }

            return false;
        }

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
            // Extract renderer types from this object's keys
            const rendererTypes = Object.keys(obj).filter(key => 
                key.endsWith('Renderer') || key.endsWith('ViewModel')
            );

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
        processData: function (data, settings, dataName = 'data') {
            const filter = new YouTubeDataFilter(settings);
            return filter.processData(data, dataName);
        }
    };

    postLogToBridge('log', 'Comprehensive filtering engine loaded successfully');

})(); 