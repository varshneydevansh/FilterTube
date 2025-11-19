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

            // Process channel names to lowercase for matching
            if (settings.filterChannels && Array.isArray(settings.filterChannels)) {
                processed.filterChannels = settings.filterChannels.map(ch =>
                    typeof ch === 'string' ? ch.toLowerCase() : ch
                ).filter(ch => ch);
            }

            return processed;
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

            // Log extraction results for debugging
            if (this.debugEnabled && (title || channelInfo.name || channelInfo.id || description)) {
                const descPreview = description ? description.substring(0, 50) + '...' : '';
                this._log(`📋 Extracted - Title: "${title}", Channel: "${channelInfo.name}", ID: "${channelInfo.id}", Desc: "${descPreview}", Type: ${rendererType}`);
            }

            // Shorts filtering
            if (this.settings.hideAllShorts && (rendererType === 'reelItemRenderer' || rendererType === 'shortsLockupViewModel' || rendererType === 'shortsLockupViewModelV2')) {
                this._log(`🚫 Blocking Shorts: ${title || 'Unknown'}`);
                return true;
            }

            // Channel filtering with comprehensive matching
            if (this.settings.filterChannels.length > 0 && (channelInfo.name || channelInfo.id || channelInfo.handle)) {
                for (const filterChannel of this.settings.filterChannels) {
                    if (this._matchesChannel(filterChannel, channelInfo)) {
                        this._log(`🚫 Blocking channel: ${channelInfo.name || channelInfo.id || channelInfo.handle} (matched filter: ${filterChannel})`);
                        return true;
                    }
                }
            }

            // Keyword filtering (check title AND description)
            if (this.settings.filterKeywords.length > 0 && (title || description)) {
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
                    if ((channelInfo.name || channelInfo.id || channelInfo.handle) && this.settings.filterChannels.length > 0) {
                        for (const filterChannel of this.settings.filterChannels) {
                            if (this._matchesChannel(filterChannel, channelInfo)) {
                                this._log(`🚫 Blocking comment by author: ${channelInfo.name || channelInfo.id || channelInfo.handle}`);
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
         */
        _extractChannelInfo(item, rules) {
            const channelInfo = { name: '', id: '', handle: '' };

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

                if (!channelInfo.handle) {
                    const fallbackHandlePaths = [
                        'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'ownerText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                        'navigationEndpoint.browseEndpoint.canonicalBaseUrl'
                    ];

                    channelInfo.handle = extractChannelHandleFromPaths(item, fallbackHandlePaths);
                }
            }

            return channelInfo;
        }

        /**
         * Check if a channel matches a filter with comprehensive logic
         */
        _matchesChannel(filterChannel, channelInfo) {
            const filter = filterChannel.toLowerCase();

            // Direct handle matching (@username)
            if (filter.startsWith('@')) {
                if (channelInfo.handle && channelInfo.handle.toLowerCase() === filter) {
                    return true;
                }
                // Also check if channel name matches without @
                const filterWithoutAt = filter.substring(1);
                if (channelInfo.name && channelInfo.name.toLowerCase() === filterWithoutAt) {
                    return true;
                }
            }

            // Channel ID matching (UC...)
            if (filter.startsWith('uc') && channelInfo.id) {
                if (channelInfo.id.toLowerCase() === filter) {
                    return true;
                }
            }

            // Partial name matching
            if (channelInfo.name) {
                const lowerName = channelInfo.name.toLowerCase();
                if (lowerName.includes(filter) || filter.includes(lowerName)) {
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