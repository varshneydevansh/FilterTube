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
        if (level === 'log' && !window.__filtertubeDebug) {
            return;
        }
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

    const pendingVideoChannelUpdates = [];
    const seenVideoChannelUpdates = new Map();
    let pendingVideoChannelFlush = null;
    function queueVideoChannelMapping(videoId, channelId) {
        if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;
        if (!channelId || typeof channelId !== 'string' || !channelId.startsWith('UC')) return;

        const key = `${videoId}:${channelId}`;
        if (seenVideoChannelUpdates.has(key)) return;
        seenVideoChannelUpdates.set(key, Date.now());

        if (seenVideoChannelUpdates.size > 4000) {
            const keys = Array.from(seenVideoChannelUpdates.keys());
            keys.slice(0, 1000).forEach(k => seenVideoChannelUpdates.delete(k));
        }

        pendingVideoChannelUpdates.push({ videoId, channelId });

        if (pendingVideoChannelFlush) return;
        pendingVideoChannelFlush = setTimeout(() => {
            pendingVideoChannelFlush = null;
            if (pendingVideoChannelUpdates.length === 0) return;

            const batch = pendingVideoChannelUpdates.splice(0, pendingVideoChannelUpdates.length);
            try {
                window.postMessage({
                    type: 'FilterTube_UpdateVideoChannelMap',
                    payload: batch,
                    source: 'filter_logic'
                }, '*');
            } catch (e) {
                // ignore
            }
        }, 50);
    }

    const pendingVideoMetaUpdates = [];
    const seenVideoMetaUpdates = new Map();
    let pendingVideoMetaFlush = null;
    function queueVideoMetaMapping(videoId, meta) {
        if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;
        if (!meta || typeof meta !== 'object') return;

        const lengthSeconds = meta.lengthSeconds;
        const publishDate = meta.publishDate;
        const uploadDate = meta.uploadDate;
        const category = meta.category;
        const hasAny = Boolean(
            (typeof lengthSeconds === 'number' && Number.isFinite(lengthSeconds) && lengthSeconds > 0)
            || (typeof lengthSeconds === 'string' && /^\d+$/.test(lengthSeconds.trim()))
            || (typeof publishDate === 'string' && publishDate.trim())
            || (typeof uploadDate === 'string' && uploadDate.trim())
            || (typeof category === 'string' && category.trim())
        );
        if (!hasAny) return;

        const signature = [
            videoId,
            (typeof lengthSeconds === 'number' ? String(lengthSeconds) : (typeof lengthSeconds === 'string' ? lengthSeconds.trim() : '')),
            (typeof publishDate === 'string' ? publishDate.trim() : ''),
            (typeof uploadDate === 'string' ? uploadDate.trim() : ''),
            (typeof category === 'string' ? category.trim() : '')
        ].join('|');
        if (seenVideoMetaUpdates.has(signature)) return;
        seenVideoMetaUpdates.set(signature, Date.now());

        if (seenVideoMetaUpdates.size > 6000) {
            const keys = Array.from(seenVideoMetaUpdates.keys());
            keys.slice(0, 1500).forEach(k => seenVideoMetaUpdates.delete(k));
        }

        pendingVideoMetaUpdates.push({
            videoId,
            lengthSeconds,
            publishDate,
            uploadDate,
            category
        });

        if (pendingVideoMetaFlush) return;
        pendingVideoMetaFlush = setTimeout(() => {
            pendingVideoMetaFlush = null;
            if (pendingVideoMetaUpdates.length === 0) return;

            const batch = pendingVideoMetaUpdates.splice(0, pendingVideoMetaUpdates.length);
            try {
                window.postMessage({
                    type: 'FilterTube_UpdateVideoMetaMap',
                    payload: batch,
                    source: 'filter_logic'
                }, '*');
            } catch (e) {
                // ignore
            }
        }, 75);
    }

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
        if (typeof textObj === 'number' && Number.isFinite(textObj)) return String(textObj);
        if (typeof textObj === 'string') return textObj;
        if (!textObj) return '';
        if (Array.isArray(textObj)) {
            return textObj
                .map(part => {
                    if (!part) return '';
                    if (typeof part === 'string') return part;
                    if (typeof part === 'number' && Number.isFinite(part)) return String(part);
                    if (typeof part === 'object') return part.text || flattenText(part);
                    return '';
                })
                .join('');
        }
        if (typeof textObj !== 'object') return '';

        // Handle new viewModel text shape: { content: "..." }
        if (typeof textObj.content === 'string' && textObj.content) return textObj.content;

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
                if (typeof value === 'number' && !Number.isNaN(value)) {
                    return String(value);
                }
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
        duration: [
            'thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText',
            'thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text',
            'lengthText.simpleText',
            'lengthText.runs.0.text'
        ],
        publishedTime: [
            'publishedTimeText.simpleText',
            'publishedTimeText.runs.0.text',
            'videoInfo.runs.0.text',
            'videoInfo.runs.2.text'
        ],
        viewCount: ['viewCountText.simpleText', 'shortViewCountText.simpleText']
    };

    const CHANNEL_ONLY_RENDERERS = new Set([
        'channelRenderer',
        'gridChannelRenderer'
    ]);

    const CHIP_RENDERERS = new Set([
        'relatedChipCloudRenderer',
        'chipCloudRenderer',
        'chipCloudChipRenderer'
    ]);

    // Comprehensive filter rules for all YouTube renderer types
    const FILTER_RULES = {
        // ------------------------------------------------------------------
        // Shared video card renderers (used across multiple surfaces)
        videoRenderer: BASE_VIDEO_RULES,
        compactVideoRenderer: BASE_VIDEO_RULES,
        gridVideoRenderer: BASE_VIDEO_RULES,
        playlistVideoRenderer: BASE_VIDEO_RULES,
        playlistPanelVideoRenderer: BASE_VIDEO_RULES,
        watchCardCompactVideoRenderer: BASE_VIDEO_RULES,
        endScreenVideoRenderer: BASE_VIDEO_RULES,

        // ------------------------------------------------------------------
        // Home feed & shelf surfaces
        richItemRenderer: {
            // richItemRenderer usually wraps other renderers, need to check content
            videoId: 'content.videoRenderer.videoId',
            title: ['content.videoRenderer.title.runs', 'content.videoRenderer.title.simpleText'],
            channelName: ['content.videoRenderer.shortBylineText.runs', 'content.videoRenderer.longBylineText.runs'],
            channelId: ['content.videoRenderer.shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId'],
            duration: [
                'content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.simpleText',
                'content.videoRenderer.thumbnailOverlays.0.thumbnailOverlayTimeStatusRenderer.text.runs.0.text',
                'content.videoRenderer.lengthText.simpleText',
                'content.videoRenderer.lengthText.runs.0.text'
            ],
            publishedTime: [
                'content.videoRenderer.publishedTimeText.simpleText',
                'content.videoRenderer.publishedTimeText.runs.0.text'
            ]
        },
        shelfRenderer: {
            title: ['header.shelfHeaderRenderer.title.simpleText']
        },
        lockupViewModel: {
            videoId: [
                'rendererContext.commandContext.onTap.innertubeCommand.watchEndpoint.videoId',
                'contentId'
            ],
            title: ['metadata.lockupMetadataViewModel.title.content', 'accessibilityText'],
            channelName: ['metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.0.text.content'],
            channelId: ['metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId'],
            channelHandle: [
                'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.canonicalBaseUrl',
                'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.commandMetadata.webCommandMetadata.url'
            ],
            metadataRows: ['metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows'],
            duration: [
                'contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text',
                'contentImage.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadgeViewModel.text',
                'contentImage.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text',
                'contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text',
                'contentImage.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailBottomOverlayViewModel.badges.0.thumbnailBadgeViewModel.text',
                'contentImage.primaryThumbnail.thumbnailViewModel.overlays.0.thumbnailOverlayBadgeViewModel.thumbnailBadges.0.thumbnailBadgeViewModel.text'
            ],
            publishedTime: [
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.0.metadataParts.1.text.content',
                'metadata.lockupMetadataViewModel.metadata.contentMetadataViewModel.metadataRows.1.metadataParts.0.text.content'
            ]
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
            channelName: ['watchCardRichHeaderRenderer.subtitle.simpleText'],
            channelId: [
                'watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.browseId',
                'watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.browseId',
                'watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.browseId',
                'watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: [
                'watchCardRichHeaderRenderer.subtitle.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'watchCardRichHeaderRenderer.subtitle.navigationEndpoint.commandMetadata.webCommandMetadata.url',
                'watchCardRichHeaderRenderer.subtitle.runs.0.navigationEndpoint.commandMetadata.webCommandMetadata.url',
                'watchCardRichHeaderRenderer.title.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'watchCardRichHeaderRenderer.title.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'
            ]
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
            videoId: [
                'navigationEndpoint.watchEndpoint.videoId',
                'videos.0.childVideoRenderer.videoId',
                'videos.0.childVideoRenderer.navigationEndpoint.watchEndpoint.videoId',
                'videos.0.playlistVideoRenderer.videoId',
                'videos.0.playlistVideoRenderer.navigationEndpoint.watchEndpoint.videoId'
            ],
            title: ['title.simpleText'],
            channelName: ['shortBylineText.runs'],
            channelId: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId'],
            channelHandle: ['shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'],
            duration: [
                'lengthText.simpleText',
                'lengthText.runs.0.text',
                'videos.0.childVideoRenderer.lengthText.simpleText',
                'videos.0.childVideoRenderer.lengthText.runs.0.text',
                'videos.0.playlistVideoRenderer.lengthText.simpleText',
                'videos.0.playlistVideoRenderer.lengthText.runs.0.text'
            ],
            publishedTime: [
                'videos.0.childVideoRenderer.publishedTimeText.simpleText',
                'videos.0.childVideoRenderer.publishedTimeText.runs.0.text',
                'videos.0.playlistVideoRenderer.publishedTimeText.simpleText',
                'videos.0.playlistVideoRenderer.publishedTimeText.runs.0.text'
            ]
        },
        gridPlaylistRenderer: {
            videoId: [
                'navigationEndpoint.watchEndpoint.videoId',
                'videos.0.childVideoRenderer.videoId',
                'videos.0.childVideoRenderer.navigationEndpoint.watchEndpoint.videoId',
                'videos.0.playlistVideoRenderer.videoId',
                'videos.0.playlistVideoRenderer.navigationEndpoint.watchEndpoint.videoId'
            ],
            title: ['title.simpleText', 'title.runs'],
            channelName: ['shortBylineText.runs', 'longBylineText.runs'],
            channelId: [
                'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId',
                'longBylineText.runs.0.navigationEndpoint.browseEndpoint.browseId'
            ],
            channelHandle: [
                'shortBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl',
                'longBylineText.runs.0.navigationEndpoint.browseEndpoint.canonicalBaseUrl'
            ],
            duration: [
                'lengthText.simpleText',
                'lengthText.runs.0.text',
                'videos.0.childVideoRenderer.lengthText.simpleText',
                'videos.0.childVideoRenderer.lengthText.runs.0.text',
                'videos.0.playlistVideoRenderer.lengthText.simpleText',
                'videos.0.playlistVideoRenderer.lengthText.runs.0.text'
            ],
            publishedTime: [
                'videos.0.childVideoRenderer.publishedTimeText.simpleText',
                'videos.0.childVideoRenderer.publishedTimeText.runs.0.text',
                'videos.0.playlistVideoRenderer.publishedTimeText.simpleText',
                'videos.0.playlistVideoRenderer.publishedTimeText.runs.0.text'
            ]
        },
        radioRenderer: {
            videoId: [
                'navigationEndpoint.watchEndpoint.videoId',
                'secondaryNavigationEndpoint.watchEndpoint.videoId'
            ],
            title: ['title.simpleText']
        },
        compactRadioRenderer: {
            videoId: [
                'navigationEndpoint.watchEndpoint.videoId',
                'secondaryNavigationEndpoint.watchEndpoint.videoId'
            ],
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
            this.debugEnabled = !!window.__filtertubeDebug;
        }

        _harvestBrowseEndpoint(node) {
            if (!node || typeof node !== 'object') return;

            const browse =
                node?.browseEndpoint ||
                node?.navigationEndpoint?.browseEndpoint ||
                node?.command?.browseEndpoint ||
                node?.innertubeCommand?.browseEndpoint ||
                node?.endpoint?.browseEndpoint ||
                null;

            const browseId = browse?.browseId;
            if (!browseId || typeof browseId !== 'string' || !browseId.startsWith('UC')) return;

            let handle = null;
            let customUrl = null;

            const canonical = browse?.canonicalBaseUrl || browse?.canonicalUrl || browse?.url || '';
            if (typeof canonical === 'string' && canonical) {
                const normalized = normalizeChannelHandle(canonical);
                if (normalized) {
                    handle = normalized;
                } else if (canonical.startsWith('/c/')) {
                    const slug = canonical.split('/')[2];
                    if (slug) customUrl = `c/${slug.split('?')[0].split('#')[0]}`;
                } else if (canonical.startsWith('/user/')) {
                    const slug = canonical.split('/')[2];
                    if (slug) customUrl = `user/${slug.split('?')[0].split('#')[0]}`;
                }
            }

            if (!handle && typeof node?.url === 'string') {
                const normalized = normalizeChannelHandle(node.url);
                if (normalized) handle = normalized;
            }

            if (!handle && typeof node?.webCommandMetadata?.url === 'string') {
                const normalized = normalizeChannelHandle(node.webCommandMetadata.url);
                if (normalized) handle = normalized;
            }

            if (handle) {
                this._registerMapping(browseId, handle);
            }
            if (customUrl) {
                this._registerCustomUrlMapping(browseId, customUrl);
            }
        }

        /**
         * Process and validate settings from background script
         */
        _processSettings(settings) {
            const contentFilterDefaults = {
                duration: { enabled: false, condition: 'between', minMinutes: 0, maxMinutes: 0, value: '' },
                uploadDate: { enabled: false, condition: 'newer', fromDate: '', toDate: '', value: '', unit: '', valueMax: 0, unitMax: '' },
                uppercase: { enabled: false, mode: 'single_word', minWordLength: 2 }
            };

            const categoryFilterDefaults = {
                enabled: false,
                mode: 'block',
                selected: []
            };

            const processed = {
                filterKeywords: [],
                filterChannels: [],
                whitelistKeywords: [],
                whitelistChannels: [],
                listMode: 'blocklist',
                hideAllComments: false,
                hideAllShorts: false,
                filterComments: false,
                useExactWordMatching: false,
                ...settings
            };

            const incomingContentFilters = (settings && typeof settings === 'object' && settings.contentFilters && typeof settings.contentFilters === 'object' && !Array.isArray(settings.contentFilters))
                ? settings.contentFilters
                : {};

            processed.contentFilters = {
                duration: {
                    ...contentFilterDefaults.duration,
                    ...(incomingContentFilters.duration && typeof incomingContentFilters.duration === 'object' ? incomingContentFilters.duration : {})
                },
                uploadDate: {
                    ...contentFilterDefaults.uploadDate,
                    ...(incomingContentFilters.uploadDate && typeof incomingContentFilters.uploadDate === 'object' ? incomingContentFilters.uploadDate : {})
                },
                uppercase: {
                    ...contentFilterDefaults.uppercase,
                    ...(incomingContentFilters.uppercase && typeof incomingContentFilters.uppercase === 'object' ? incomingContentFilters.uppercase : {})
                }
            };

            const incomingCategoryFilters = (settings && typeof settings === 'object' && settings.categoryFilters && typeof settings.categoryFilters === 'object' && !Array.isArray(settings.categoryFilters))
                ? settings.categoryFilters
                : {};
            processed.categoryFilters = {
                ...categoryFilterDefaults,
                ...incomingCategoryFilters,
                enabled: incomingCategoryFilters.enabled === true,
                mode: incomingCategoryFilters.mode === 'allow' ? 'allow' : 'block',
                selected: Array.isArray(incomingCategoryFilters.selected)
                    ? incomingCategoryFilters.selected.map(v => (typeof v === 'string' ? v.trim() : '')).filter(Boolean)
                    : []
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

            if (settings.whitelistKeywords && Array.isArray(settings.whitelistKeywords)) {
                processed.whitelistKeywords = settings.whitelistKeywords.map(item => {
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

            if (settings.whitelistChannels && Array.isArray(settings.whitelistChannels)) {
                processed.whitelistChannels = settings.whitelistChannels.map(ch => {
                    if (typeof ch === 'string') {
                        return { name: ch, id: ch, handle: null, logo: null, filterAll: false };
                    }
                    return {
                        ...ch,
                        id: ch.id ? ch.id.toLowerCase() : '',
                        handle: ch.handle ? ch.handle.toLowerCase() : '',
                        name: ch.name ? ch.name.toLowerCase() : '',
                    };
                }).filter(ch => ch);
            }

            processed.videoMetaMap = (settings && typeof settings === 'object' && settings.videoMetaMap && typeof settings.videoMetaMap === 'object' && !Array.isArray(settings.videoMetaMap))
                ? settings.videoMetaMap
                : {};

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
            let videoId = null;

            if (videoDetails) {
                videoId =
                    videoDetails.videoId ||
                    videoDetails.encryptedVideoId ||
                    videoId;
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

            if (videoId && ownerId && ownerId.startsWith('UC')) {
                this._registerVideoChannelMapping(videoId, ownerId);
            }

            if (videoId) {
                const lengthSeconds =
                    (playerMicroformat && playerMicroformat.lengthSeconds) ||
                    (videoDetails && videoDetails.lengthSeconds) ||
                    null;

                const publishDate = (playerMicroformat && playerMicroformat.publishDate) ? String(playerMicroformat.publishDate) : '';
                const uploadDate = (playerMicroformat && playerMicroformat.uploadDate) ? String(playerMicroformat.uploadDate) : '';
                const category = (playerMicroformat && (playerMicroformat.category || playerMicroformat.genre))
                    ? String(playerMicroformat.category || playerMicroformat.genre)
                    : '';

                if (lengthSeconds || publishDate || uploadDate || category) {
                    this._registerVideoMetaMapping(videoId, { lengthSeconds, publishDate, uploadDate, category });
                }
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

                    const playlistVideoId =
                        renderer?.videoId ||
                        renderer?.navigationEndpoint?.watchEndpoint?.videoId ||
                        renderer?.navigationEndpoint?.watchEndpoint?.playlistId ||
                        '';

                    const browse = renderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint;
                    const browseId = browse?.browseId;
                    const canonical = browse?.canonicalBaseUrl;
                    const normalizedHandle = normalizeChannelHandle(
                        canonical || renderer?.shortBylineText?.runs?.[0]?.text || ''
                    );
                    if (browseId && normalizedHandle) {
                        this._registerMapping(browseId, normalizedHandle);
                    }

                    if (playlistVideoId && typeof playlistVideoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(playlistVideoId) && browseId && typeof browseId === 'string' && browseId.startsWith('UC')) {
                        this._registerVideoChannelMapping(playlistVideoId, browseId);
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
                if (!node || typeof node !== 'object') return;
                if (visited.has(node)) return;
                visited.add(node);

                this._harvestBrowseEndpoint(node);

                // Identify any video renderer nested under known keys.
                let candidate = node;
                if (candidate.videoRenderer) {
                    candidate = candidate.videoRenderer;
                } else if (candidate.compactVideoRenderer) {
                    candidate = candidate.compactVideoRenderer;
                } else if (candidate.playlistVideoRenderer) {
                    candidate = candidate.playlistVideoRenderer;
                } else if (candidate.lockupViewModel) {
                    candidate = candidate.lockupViewModel;
                } else if (candidate.richItemRenderer?.content?.videoRenderer) {
                    candidate = candidate.richItemRenderer.content.videoRenderer;
                } else if (candidate.richItemRenderer?.content?.lockupViewModel) {
                    candidate = candidate.richItemRenderer.content.lockupViewModel;
                } else if (candidate.content?.videoRenderer) {
                    candidate = candidate.content.videoRenderer;
                } else if (candidate.content?.lockupViewModel) {
                    candidate = candidate.content.lockupViewModel;
                }

                this._harvestFromRendererByline(candidate);
                this._harvestVideoOwnerFromRenderer(candidate);

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

        _harvestVideoOwnerFromRenderer(renderer) {
            if (!renderer || typeof renderer !== 'object') return;

            const videoId = renderer.videoId || renderer.contentId || renderer.navigationEndpoint?.watchEndpoint?.videoId || '';
            if (!videoId || typeof videoId !== 'string' || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return;

            const ownerId =
                renderer?.kidsVideoOwnerExtension?.externalChannelId ||
                renderer?.kidsVideoOwnerExtension?.channelId ||
                '';

            if (ownerId && typeof ownerId === 'string' && ownerId.startsWith('UC')) {
                this._registerVideoChannelMapping(videoId, ownerId);
                return;
            }

            const byline = renderer.shortBylineText || renderer.longBylineText || renderer.ownerText;
            const browseId = byline?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
            if (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) {
                this._registerVideoChannelMapping(videoId, browseId);
                return;
            }

            const lockupBrowse = renderer?.metadata?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;
            const lockupBrowseId = lockupBrowse?.browseId;
            if (lockupBrowseId && typeof lockupBrowseId === 'string' && lockupBrowseId.startsWith('UC')) {
                this._registerVideoChannelMapping(videoId, lockupBrowseId);
                const canonical = lockupBrowse?.canonicalBaseUrl || '';
                const normalized = typeof canonical === 'string' ? normalizeChannelHandle(canonical) : '';
                if (normalized) {
                    this._registerMapping(lockupBrowseId, normalized);
                }
            }
        }

        _registerVideoChannelMapping(videoId, channelId) {
            if (!videoId || !channelId) return;

            const current = this.settings?.videoChannelMap && typeof this.settings.videoChannelMap === 'object'
                ? this.settings.videoChannelMap
                : null;
            if (current && current[videoId] === channelId) return;

            queueVideoChannelMapping(videoId, channelId);
        }

        _registerVideoMetaMapping(videoId, meta) {
            if (!videoId || !meta || typeof meta !== 'object') return;

            const current = this.settings?.videoMetaMap && typeof this.settings.videoMetaMap === 'object'
                ? this.settings.videoMetaMap
                : null;
            if (current && current[videoId]) {
                const existing = current[videoId];
                const nextLength = meta.lengthSeconds;
                const nextPublish = meta.publishDate;
                const nextUpload = meta.uploadDate;
                const same =
                    (existing?.lengthSeconds === nextLength)
                    && (existing?.publishDate === nextPublish)
                    && (existing?.uploadDate === nextUpload);
                if (same) return;
            }

            queueVideoMetaMapping(videoId, meta);
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
                let customUrl = null;

                const canonical = browse.canonicalBaseUrl || browse.canonicalUrl || browse.url;
                if (typeof canonical === 'string') {
                    // Check for @handle
                    const normalized = normalizeChannelHandle(canonical);
                    if (normalized) {
                        handle = normalized;
                    }
                    // Check for /c/Name or /user/Name customUrl
                    if (!handle) {
                        if (canonical.startsWith('/c/')) {
                            const slug = canonical.split('/')[2];
                            if (slug) customUrl = `c/${slug.split('?')[0].split('#')[0]}`;
                        } else if (canonical.startsWith('/user/')) {
                            const slug = canonical.split('/')[2];
                            if (slug) customUrl = `user/${slug.split('?')[0].split('#')[0]}`;
                        }
                    }
                }

                if (!handle && typeof run.text === 'string') {
                    const normalized = normalizeChannelHandle(run.text);
                    if (normalized) handle = normalized;
                }

                // Register handle → UC ID mapping
                if (handle) {
                    this._registerMapping(browseId, handle);
                }
                // Register customUrl → UC ID mapping for c/Name channels
                if (customUrl) {
                    this._registerCustomUrlMapping(browseId, customUrl);
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
            const enabled = (() => {
                try {
                    return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
                } catch (e) {
                    return !!this.debugEnabled;
                }
            })();
            if (enabled) {
                console.log(`FilterTube (Filter):`, message, ...args);
            }
        }

        /**
         * Check if an item should be blocked based on filter rules
         */
        _shouldBlock(item, rendererType) {
            if (!item || typeof item !== 'object') return false;

            if (CHIP_RENDERERS.has(rendererType)) {
                return false;
            }

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
            let videoId = '';
            if (rules.videoId) {
                const videoIdPaths = Array.isArray(rules.videoId) ? rules.videoId : [rules.videoId];
                for (const path of videoIdPaths) {
                    const candidate = getByPath(item, path);
                    if (candidate && typeof candidate === 'string') {
                        videoId = candidate;
                        break;
                    }
                }
            }
            const skipKeywordFiltering = CHANNEL_ONLY_RENDERERS.has(rendererType);
            const listMode = (this.settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
            const isCommentRenderer = rendererType.includes('comment') || rendererType.includes('Comment');

            // Shorts: if no channel identity present, try videoChannelMap (populated when user blocked Shorts)
            if (
                (!channelInfo.id && !channelInfo.handle && !channelInfo.customUrl) &&
                videoId &&
                this.settings.videoChannelMap &&
                this.settings.videoChannelMap[videoId]
            ) {
                channelInfo.id = this.settings.videoChannelMap[videoId];
            }

            // Handle collaboration videos (channelInfo is an array)
            const isCollaboration = Array.isArray(channelInfo);
            const collaborators = isCollaboration ? channelInfo : [channelInfo];

            // Register mappings for all extracted channel info (including customUrl → UC ID)
            for (const collaborator of collaborators) {
                if (collaborator.id && collaborator.handle) {
                    this._registerMapping(collaborator.id, collaborator.handle);
                }
                if (collaborator.id && collaborator.customUrl) {
                    this._registerCustomUrlMapping(collaborator.id, collaborator.customUrl);
                }
            }

            // Log extraction results for debugging
            if (this.debugEnabled && (title || (channelInfo && (Array.isArray(channelInfo) || channelInfo.name || channelInfo.id)) || description)) {
                const descPreview = description ? description.substring(0, 50) + '...' : '';
                if (isCollaboration) {
                    const channelNames = collaborators.map(c => c.name || c.handle || c.id).join(' & ');
                    this._log(`📋 Extracted COLLABORATION - Title: "${title}", Channels: "${channelNames}", Type: ${rendererType}`);
                } else {
                    this._log(`📋 Extracted - Title: "${title}", ID: "${channelInfo.id}", Desc: "${descPreview}", Type: ${rendererType}`);
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

            try {
                const path = document.location?.pathname || '';
                if (
                    path === '/results' && (
                        rendererType === 'secondarySearchContainerRenderer'
                    )
                ) {
                    return false;
                }
            } catch (e) {
            }

            if (listMode === 'whitelist' && !isCommentRenderer) {
                // Watch page scaffolding: these renderers often lack sufficient channel identity
                // for whitelist evaluation, but removing them breaks the watch page UI (description,
                // action buttons, channel row, and comment composer rendering).
                if (rendererType === 'videoPrimaryInfoRenderer' || rendererType === 'videoSecondaryInfoRenderer') {
                    return false;
                }
                const whitelistChannels = Array.isArray(this.settings.whitelistChannels) ? this.settings.whitelistChannels : [];
                const whitelistKeywords = Array.isArray(this.settings.whitelistKeywords) ? this.settings.whitelistKeywords : [];

                const hasChannelRules = whitelistChannels.length > 0;
                const hasKeywordRules = !skipKeywordFiltering && whitelistKeywords.length > 0;

                if (!hasChannelRules && !hasKeywordRules) {
                    return true;
                }

                if (hasChannelRules) {
                    for (const collaborator of collaborators) {
                        if (collaborator && (collaborator.name || collaborator.id || collaborator.handle || collaborator.customUrl)) {
                            for (const allowChannel of whitelistChannels) {
                                if (this._matchesChannel(allowChannel, collaborator)) {
                                    return false;
                                }
                            }
                        }
                    }
                }

                if (hasKeywordRules && (title || description)) {
                    const textToSearch = `${title} ${description}`.trim();
                    for (const keywordRegex of whitelistKeywords) {
                        if (keywordRegex.test(textToSearch)) {
                            return false;
                        }
                    }
                }

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

                    const commentKeywords = Array.isArray(this.settings.filterKeywordsComments)
                        ? this.settings.filterKeywordsComments
                        : this.settings.filterKeywords;

                    // Apply keyword filters to comments
                    if (commentText && commentKeywords.length > 0) {
                        for (const keywordRegex of commentKeywords) {
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

            // Content filters (duration, upload date) - applied after channel/keyword filtering
            if (!isCommentRenderer) {
                const shouldBlockByContent = this._checkContentFilters(item, rules, rendererType);
                if (shouldBlockByContent) {
                    return true;
                }

                const shouldBlockByCategory = this._checkCategoryFilters(item, rules, rendererType);
                if (shouldBlockByCategory) {
                    return true;
                }
            }

            return false;
        }

        _checkCategoryFilters(item, rules, rendererType) {
            const cf = this.settings.categoryFilters;
            if (!cf || cf.enabled !== true) return false;

            const selected = Array.isArray(cf.selected)
                ? cf.selected.map(v => (typeof v === 'string' ? v.trim().toLowerCase() : '')).filter(Boolean)
                : [];
            if (selected.length === 0) return false;
            const selectedSet = new Set(selected);

            const isVideoRenderer = [
                'videoRenderer', 'compactVideoRenderer', 'gridVideoRenderer',
                'playlistVideoRenderer', 'watchCardCompactVideoRenderer',
                'endScreenVideoRenderer', 'richItemRenderer', 'lockupViewModel',
                'shortsLockupViewModel', 'shortsLockupViewModelV2', 'reelItemRenderer',
                'richGridMedia', 'channelVideoPlayerRenderer', 'playlistPanelVideoRenderer',
                'playlistRenderer', 'gridPlaylistRenderer', 'radioRenderer', 'compactRadioRenderer'
            ].includes(rendererType);
            if (!isVideoRenderer) return false;

            const tryResolveVideoId = () => {
                const videoIdPaths = rules && rules.videoId
                    ? (Array.isArray(rules.videoId) ? rules.videoId : [rules.videoId])
                    : [];
                for (const path of videoIdPaths) {
                    const candidate = getByPath(item, path);
                    if (candidate && typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) {
                        return candidate;
                    }
                }
                return '';
            };

            const videoId = tryResolveVideoId();
            if (!videoId) return false;

            const meta = (this.settings.videoMetaMap && this.settings.videoMetaMap[videoId]) ? this.settings.videoMetaMap[videoId] : null;
            const categoryRaw = (meta && typeof meta.category === 'string') ? meta.category.trim() : '';

            if (!categoryRaw) {
                try {
                    if (typeof scheduleVideoMetaFetch === 'function') {
                        scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true });
                    }
                } catch (e) {
                }
                return false;
            }

            const categoryKey = categoryRaw.toLowerCase();
            const mode = cf.mode === 'allow' ? 'allow' : 'block';

            if (mode === 'allow') {
                return !selectedSet.has(categoryKey);
            }
            return selectedSet.has(categoryKey);
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
                'expandedDescriptionBodyText.simpleText',
                'microformat.playerMicroformatRenderer.description.simpleText',
                'microformat.playerMicroformatRenderer.description.runs',
                'videoDetails.shortDescription',
                'playerResponse.microformat.playerMicroformatRenderer.description.simpleText',
                'playerResponse.microformat.playerMicroformatRenderer.description.runs',
                'playerResponse.videoDetails.shortDescription'
            ];

            return getTextFromPaths(item, fallbackPaths);
        }

        /**
         * Parse duration string (e.g., "1:38:14" or "2:47") to seconds
         */
        _parseDurationToSeconds(durationText) {
            if (durationText === null || durationText === undefined) return null;

            const raw = String(durationText).trim();
            if (!raw) return null;

            // Support raw seconds like "317"
            if (/^\d+$/.test(raw)) {
                const seconds = parseInt(raw, 10);
                return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
            }

            // Support "H:MM:SS" or "M:SS" (tolerate 1-2 digit segments)
            const match = raw.match(/^(\d{1,4}):([0-5]?\d)(?::([0-5]?\d))?$/);
            if (match) {
                const first = parseInt(match[1], 10);
                const second = parseInt(match[2], 10);
                const third = match[3] !== undefined ? parseInt(match[3], 10) : null;
                if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
                if (third !== null && !Number.isFinite(third)) return null;
                if (second >= 60) return null;
                if (third !== null && third >= 60) return null;
                if (third !== null) return first * 3600 + second * 60 + third;
                return first * 60 + second;
            }

            // Support accessibility labels like "3 minutes, 55 seconds"
            const labelSeconds = this._parseAriaLabelDurationSeconds(raw);
            return labelSeconds > 0 ? labelSeconds : null;
        }

        _parseAriaLabelDurationSeconds(ariaLabel) {
            if (!ariaLabel || typeof ariaLabel !== 'string') return 0;
            let totalSeconds = 0;
            const hoursMatch = ariaLabel.match(/(\d+)\s*hour/i);
            if (hoursMatch) totalSeconds += parseInt(hoursMatch[1], 10) * 3600;
            const minutesMatch = ariaLabel.match(/(\d+)\s*minute/i);
            if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
            const secondsMatch = ariaLabel.match(/(\d+)\s*second/i);
            if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
            return Number.isFinite(totalSeconds) ? totalSeconds : 0;
        }

        /**
         * Parse relative time string (e.g., "5 years ago", "3 months ago") to approximate timestamp
         */
        _parseRelativeTimeToTimestamp(timeText) {
            if (!timeText || typeof timeText !== 'string') return null;
            const text = timeText.toLowerCase().trim();
            const now = Date.now();
            const msPerDay = 24 * 60 * 60 * 1000;

            const patterns = [
                { regex: /(\d+)\s+year/, multiplier: 365 * msPerDay },
                { regex: /(\d+)\s+month/, multiplier: 30 * msPerDay },
                { regex: /(\d+)\s+week/, multiplier: 7 * msPerDay },
                { regex: /(\d+)\s+day/, multiplier: msPerDay },
                { regex: /(\d+)\s+hour/, multiplier: 60 * 60 * 1000 },
                { regex: /(\d+)\s+minute/, multiplier: 60 * 1000 },
                { regex: /(\d+)\s+second/, multiplier: 1000 }
            ];

            for (const { regex, multiplier } of patterns) {
                const match = text.match(regex);
                if (match) {
                    const count = parseInt(match[1], 10);
                    if (!isNaN(count)) {
                        return now - (count * multiplier);
                    }
                }
            }

            if (text.includes('just now') || text.includes('moments ago')) {
                return now - (60 * 1000);
            }
            if (text.includes('yesterday')) {
                return now - msPerDay;
            }

            return null;
        }

        /**
         * Extract video duration in seconds from item using rules
         */
        _extractDuration(item, rules, rendererType = '', depth = 0) {
            if (!item || typeof item !== 'object') return null;
            if (depth > 3) return null;

            const tryResolveVideoId = () => {
                const videoIdPaths = rules && rules.videoId
                    ? (Array.isArray(rules.videoId) ? rules.videoId : [rules.videoId])
                    : [];
                for (const path of videoIdPaths) {
                    const candidate = getByPath(item, path);
                    if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                }

                const directCandidates = [
                    item.videoId,
                    item.contentId,
                    item.encryptedVideoId,
                    item?.navigationEndpoint?.watchEndpoint?.videoId,
                    item?.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId,
                    item?.onTap?.innertubeCommand?.watchEndpoint?.videoId
                ];
                for (const candidate of directCandidates) {
                    if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                }

                // playlistRenderer/gridPlaylistRenderer-like: try the first nested video entry
                const videos = Array.isArray(item.videos) ? item.videos : null;
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
                        if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                    }
                }
                return '';
            };

            const readNumericSeconds = (value) => {
                if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
                if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
                    const parsed = parseInt(value.trim(), 10);
                    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
                }
                return null;
            };

            // Numeric duration fields (common across some renderers)
            const numericCandidates = [
                item.lengthInSeconds,
                item.lengthSeconds,
                item.length_seconds
            ];
            for (const candidate of numericCandidates) {
                const asSeconds = readNumericSeconds(candidate);
                if (asSeconds) return asSeconds;
            }

            // videoDetails/microformat fallbacks (watch/player payloads, prefetch blobs)
            const nestedLengthCandidates = [
                item?.videoDetails?.lengthSeconds,
                item?.microformat?.playerMicroformatRenderer?.lengthSeconds,
                item?.playerResponse?.videoDetails?.lengthSeconds,
                item?.playerResponse?.microformat?.playerMicroformatRenderer?.lengthSeconds
            ];
            for (const candidate of nestedLengthCandidates) {
                const asSeconds = readNumericSeconds(candidate);
                if (asSeconds) return asSeconds;
            }

            // Rules-based lookup (fast path)
            const durationPaths = rules && rules.duration
                ? (Array.isArray(rules.duration) ? rules.duration : [rules.duration])
                : [];
            for (const path of durationPaths) {
                const text = getTextFromPaths(item, [path]);
                if (!text) continue;
                const seconds = this._parseDurationToSeconds(text);
                if (seconds !== null) return seconds;
            }

            // Common renderer shapes: lengthText.{simpleText|runs}
            const lengthText = flattenText(item.lengthText);
            if (lengthText) {
                const seconds = this._parseDurationToSeconds(lengthText);
                if (seconds !== null) return seconds;
            }

            // videoRenderer-like: thumbnailOverlays[] => thumbnailOverlayTimeStatusRenderer.text
            const thumbnailOverlays = item.thumbnailOverlays;
            if (Array.isArray(thumbnailOverlays)) {
                for (const overlay of thumbnailOverlays) {
                    const timeStatus = overlay?.thumbnailOverlayTimeStatusRenderer;
                    if (timeStatus?.text) {
                        const text = flattenText(timeStatus.text);
                        const seconds = this._parseDurationToSeconds(text);
                        if (seconds !== null) return seconds;
                    }
                }
            }

            const scanThumbnailViewModelOverlays = (thumbnailViewModel) => {
                const overlays = thumbnailViewModel?.overlays;
                if (!Array.isArray(overlays)) return null;

                for (const overlay of overlays) {
                    // Overlay badge view model: thumbnailBadges[]
                    const overlayBadge = overlay?.thumbnailOverlayBadgeViewModel;
                    if (overlayBadge) {
                        const thumbnailBadges = Array.isArray(overlayBadge.thumbnailBadges)
                            ? overlayBadge.thumbnailBadges
                            : (overlayBadge.thumbnailBadgeViewModel ? [{ thumbnailBadgeViewModel: overlayBadge.thumbnailBadgeViewModel }] : []);

                        for (const badge of thumbnailBadges) {
                            const vm = badge?.thumbnailBadgeViewModel;
                            const text = vm?.text ? flattenText(vm.text) : '';
                            const seconds = this._parseDurationToSeconds(text);
                            if (seconds !== null) return seconds;

                            const label = vm?.rendererContext?.accessibilityContext?.label;
                            const labelSeconds = this._parseDurationToSeconds(label);
                            if (labelSeconds !== null) return labelSeconds;
                        }
                    }

                    // Bottom overlay view model: badges[]
                    const bottomOverlay = overlay?.thumbnailBottomOverlayViewModel;
                    if (bottomOverlay && Array.isArray(bottomOverlay.badges)) {
                        for (const badge of bottomOverlay.badges) {
                            const vm = badge?.thumbnailBadgeViewModel;
                            const text = vm?.text ? flattenText(vm.text) : '';
                            const seconds = this._parseDurationToSeconds(text);
                            if (seconds !== null) return seconds;

                            const label = vm?.rendererContext?.accessibilityContext?.label;
                            const labelSeconds = this._parseDurationToSeconds(label);
                            if (labelSeconds !== null) return labelSeconds;
                        }
                    }
                }

                return null;
            };

            // lockupViewModel-like: contentImage.*.thumbnailViewModel.overlays[]
            const contentImage = item.contentImage;
            if (contentImage && typeof contentImage === 'object') {
                const direct = scanThumbnailViewModelOverlays(contentImage.thumbnailViewModel);
                if (direct) return direct;

                const primary = scanThumbnailViewModelOverlays(contentImage.primaryThumbnail?.thumbnailViewModel);
                if (primary) return primary;

                const collection = scanThumbnailViewModelOverlays(contentImage.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel);
                if (collection) return collection;
            }

            // playlistRenderer/gridPlaylistRenderer: fall back to the first nested video card's duration
            const playlistEntries = Array.isArray(item.videos) ? item.videos : null;
            if (playlistEntries && playlistEntries.length > 0) {
                const first = playlistEntries[0];
                const nested =
                    first?.childVideoRenderer ||
                    first?.playlistVideoRenderer ||
                    first?.compactVideoRenderer ||
                    first?.videoRenderer ||
                    first?.gridVideoRenderer ||
                    null;
                if (nested && typeof nested === 'object') {
                    const seconds = this._extractDuration(nested, BASE_VIDEO_RULES, 'nestedVideo', depth + 1);
                    if (seconds !== null) return seconds;
                }
            }

            // Wrapper renderers: unwrap and retry (home/search often wrap videoRenderer inside content)
            const unwrapContainer = item.content && typeof item.content === 'object' ? item.content : null;
            if (unwrapContainer) {
                // Prefer known keys first
                const knownKeys = [
                    'videoRenderer',
                    'compactVideoRenderer',
                    'gridVideoRenderer',
                    'playlistVideoRenderer',
                    'playlistPanelVideoRenderer',
                    'watchCardCompactVideoRenderer',
                    'endScreenVideoRenderer',
                    'lockupViewModel',
                    'richGridMedia'
                ];

                for (const key of knownKeys) {
                    if (!unwrapContainer[key]) continue;
                    const nested = unwrapContainer[key];
                    const nestedRules = FILTER_RULES[key] || {};
                    const seconds = this._extractDuration(nested, nestedRules, key, depth + 1);
                    if (seconds !== null) return seconds;
                }

                // Generic: any content child that is a known renderer type
                for (const [key, nested] of Object.entries(unwrapContainer)) {
                    if (!nested || typeof nested !== 'object') continue;
                    if (!FILTER_RULES[key]) continue;
                    const seconds = this._extractDuration(nested, FILTER_RULES[key], key, depth + 1);
                    if (seconds !== null) return seconds;
                }
            }

            // Some renderers may nest lockups directly under item (not under `.content`)
            const directKnownKeys = [
                'videoRenderer',
                'lockupViewModel'
            ];
            for (const key of directKnownKeys) {
                if (!item[key] || typeof item[key] !== 'object') continue;
                const seconds = this._extractDuration(item[key], FILTER_RULES[key] || {}, key, depth + 1);
                if (seconds !== null) return seconds;
            }

            // Last resort: consult learned videoMetaMap (videoId -> lengthSeconds)
            const resolvedVideoId = tryResolveVideoId();
            if (resolvedVideoId && this.settings.videoMetaMap && this.settings.videoMetaMap[resolvedVideoId]) {
                const meta = this.settings.videoMetaMap[resolvedVideoId];
                const asSeconds = readNumericSeconds(meta?.lengthSeconds);
                if (asSeconds) return asSeconds;
            }

            return null;
        }

        /**
         * Extract published time timestamp from item using rules
         */
        _extractPublishedTime(item, rules, rendererType = '', depth = 0) {
            if (!item || typeof item !== 'object') return null;
            if (depth > 3) return null;

            const tryResolveVideoId = () => {
                const videoIdPaths = rules && rules.videoId
                    ? (Array.isArray(rules.videoId) ? rules.videoId : [rules.videoId])
                    : [];
                for (const path of videoIdPaths) {
                    const candidate = getByPath(item, path);
                    if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                }

                const directCandidates = [
                    item.videoId,
                    item.contentId,
                    item.encryptedVideoId,
                    item?.navigationEndpoint?.watchEndpoint?.videoId,
                    item?.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId,
                    item?.onTap?.innertubeCommand?.watchEndpoint?.videoId
                ];
                for (const candidate of directCandidates) {
                    if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                }

                // playlistRenderer/gridPlaylistRenderer-like: try the first nested video entry
                const videos = Array.isArray(item.videos) ? item.videos : null;
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
                        if (typeof candidate === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
                    }
                }
                return '';
            };

            const timePaths = rules && rules.publishedTime
                ? (Array.isArray(rules.publishedTime) ? rules.publishedTime : [rules.publishedTime])
                : [];

            for (const path of timePaths) {
                const text = getTextFromPaths(item, [path]);
                if (!text) continue;
                const timestamp = this._parseRelativeTimeToTimestamp(text);
                if (timestamp !== null) return timestamp;
            }

            // lockupViewModel and podcast-like: scan metadata rows for "... ago"
            const metadataRoots = [];
            if (item.metadataRows) metadataRoots.push(item.metadataRows);
            const metadataFromRules = rules && rules.metadataRows
                ? getByPath(item, Array.isArray(rules.metadataRows) ? rules.metadataRows[0] : rules.metadataRows)
                : null;
            if (metadataFromRules) metadataRoots.push(metadataFromRules);

            for (const root of metadataRoots) {
                const rows = Array.isArray(root) ? root : (Array.isArray(root?.metadataRows) ? root.metadataRows : null);
                if (!rows) continue;

                for (const row of rows) {
                    const parts = Array.isArray(row?.metadataParts) ? row.metadataParts : null;
                    if (!parts) continue;
                    for (const part of parts) {
                        const text = flattenText(part?.text);
                        if (!text) continue;
                        const timestamp = this._parseRelativeTimeToTimestamp(text);
                        if (timestamp !== null) return timestamp;
                    }
                }
            }

            // Wrapper renderers
            const unwrapContainer = item.content && typeof item.content === 'object' ? item.content : null;
            if (unwrapContainer) {
                for (const [key, nested] of Object.entries(unwrapContainer)) {
                    if (!nested || typeof nested !== 'object') continue;
                    if (!FILTER_RULES[key]) continue;
                    const timestamp = this._extractPublishedTime(nested, FILTER_RULES[key], key, depth + 1);
                    if (timestamp !== null) return timestamp;
                }
            }

            // playlistRenderer/gridPlaylistRenderer: fall back to the first nested video card's published time
            const playlistEntries = Array.isArray(item.videos) ? item.videos : null;
            if (playlistEntries && playlistEntries.length > 0) {
                const first = playlistEntries[0];
                const nested =
                    first?.childVideoRenderer ||
                    first?.playlistVideoRenderer ||
                    first?.compactVideoRenderer ||
                    first?.videoRenderer ||
                    first?.gridVideoRenderer ||
                    null;
                if (nested && typeof nested === 'object') {
                    const timestamp = this._extractPublishedTime(nested, BASE_VIDEO_RULES, 'nestedVideo', depth + 1);
                    if (timestamp !== null) return timestamp;
                }
            }

            if (item.videoRenderer && typeof item.videoRenderer === 'object') {
                const timestamp = this._extractPublishedTime(item.videoRenderer, FILTER_RULES.videoRenderer || {}, 'videoRenderer', depth + 1);
                if (timestamp !== null) return timestamp;
            }

            // Absolute timestamps from player microformat/videoDetails (publishDate/uploadDate)
            const resolvedVideoId = tryResolveVideoId();
            if (resolvedVideoId && this.settings.videoMetaMap && this.settings.videoMetaMap[resolvedVideoId]) {
                const meta = this.settings.videoMetaMap[resolvedVideoId];
                const candidates = [meta?.uploadDate, meta?.publishDate];
                for (const raw of candidates) {
                    if (!raw || typeof raw !== 'string') continue;
                    const ms = new Date(raw).getTime();
                    if (Number.isFinite(ms)) return ms;
                }
            }

            return null;
        }

        /**
         * Check content filters (duration, upload date)
         */
        _checkContentFilters(item, rules, rendererType) {
            const cf = this.settings.contentFilters;

            // DEBUG: Log content filter check
            this._log('[FilterTube] _checkContentFilters called for ' + rendererType + ', cf.duration:', cf ? cf.duration : null);

            if (!cf) {
                this._log('[FilterTube] contentFilters is null/undefined, skipping');
                return false;
            }

            const isVideoRenderer = [
                'videoRenderer', 'compactVideoRenderer', 'gridVideoRenderer',
                'playlistVideoRenderer', 'watchCardCompactVideoRenderer',
                'endScreenVideoRenderer', 'richItemRenderer', 'lockupViewModel',
                'shortsLockupViewModel', 'shortsLockupViewModelV2', 'reelItemRenderer',
                'richGridMedia', 'channelVideoPlayerRenderer', 'playlistPanelVideoRenderer',
                'playlistRenderer', 'gridPlaylistRenderer', 'radioRenderer', 'compactRadioRenderer'
            ].includes(rendererType);

            if (!isVideoRenderer) return false;

            // Duration filter
            if (cf.duration && cf.duration.enabled) {
                const durationSeconds = this._extractDuration(item, rules, rendererType);
                this._log('[FilterTube] Duration filter ENABLED for ' + rendererType + ': condition=' + cf.duration.condition + ', minMinutes=' + cf.duration.minMinutes);
                this._log('[FilterTube] Extracted duration: ' + durationSeconds + ' seconds (' + (durationSeconds ? (durationSeconds/60).toFixed(1) : 'null') + ' min)');
                
                if (durationSeconds !== null) {
                    const durationMinutes = durationSeconds / 60;
                    const condition = cf.duration.condition || 'between';

                    const parseRangeValue = (value) => {
                        if (typeof value !== 'string') return null;
                        const trimmed = value.trim();
                        const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
                        if (!match) return null;
                        const a = parseFloat(match[1]);
                        const b = parseFloat(match[2]);
                        if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
                        return { min: a, max: b };
                    };

                    let min = Number(
                        cf.duration.minMinutes ??
                        cf.duration.minutes ??
                        cf.duration.valueMinutes ??
                        cf.duration.minutesMin ??
                        cf.duration.value ??
                        0
                    );
                    let max = Number(
                        cf.duration.maxMinutes ??
                        cf.duration.minutesMax ??
                        cf.duration.valueMinutesMax ??
                        0
                    );

                    if (!Number.isFinite(min)) min = 0;
                    if (!Number.isFinite(max)) max = 0;

                    if ((min <= 0 || max <= 0) && typeof cf.duration.value === 'string') {
                        const parsed = parseRangeValue(cf.duration.value);
                        if (parsed) {
                            if (min <= 0) min = parsed.min;
                            if (max <= 0) max = parsed.max;
                        }
                    }

                    if (max > 0 && min > max) {
                        const tmp = min;
                        min = max;
                        max = tmp;
                    }

                    let matches = false;
                    const mode = (cf.duration.mode === 'allow' || cf.duration.mode === 'block') ? cf.duration.mode : 'block';
                    if (condition === 'longer') {
                        matches = durationMinutes > min;
                        this._log('[FilterTube] Checking: ' + durationMinutes.toFixed(1) + ' > ' + min + ' = ' + matches);
                    } else if (condition === 'shorter') {
                        matches = durationMinutes < min;
                        this._log('[FilterTube] Checking: ' + durationMinutes.toFixed(1) + ' < ' + min + ' = ' + matches);
                    } else {
                        if (max > 0) {
                            // "Only between" => block outside range
                            matches = durationMinutes < min || durationMinutes > max;
                            this._log('[FilterTube] Checking: outside range ' + min + '-' + max + ' for ' + durationMinutes.toFixed(1) + ' = ' + matches);
                        }
                    }

                    const shouldBlock = condition === 'between'
                        ? matches
                        : (mode === 'allow' ? !matches : matches);

                    if (shouldBlock) {
                        this._log('[FilterTube] BLOCKING by duration filter: ' + durationMinutes.toFixed(1) + ' min (' + condition + ')');
                        return true;
                    }
                }
            }

            // Upload date filter
            if (cf.uploadDate?.enabled) {
                const publishTimestamp = this._extractPublishedTime(item, rules, rendererType);
                if (publishTimestamp !== null) {
                    const condition = cf.uploadDate.condition || 'newer';
                    let shouldBlock = false;

                    const parseDateMs = (value) => {
                        if (!value || typeof value !== 'string') return null;
                        const ms = new Date(value).getTime();
                        return Number.isFinite(ms) ? ms : null;
                    };

                    if (condition === 'newer') {
                        // "Only past X days" - block videos OLDER than the cutoff
                        const cutoffMs = parseDateMs(cf.uploadDate.fromDate);
                        if (cutoffMs !== null) shouldBlock = publishTimestamp < cutoffMs;
                    } else if (condition === 'older') {
                        // "Block older than X" - block videos OLDER than the cutoff
                        const cutoffMs = parseDateMs(cf.uploadDate.toDate);
                        if (cutoffMs !== null) shouldBlock = publishTimestamp < cutoffMs;
                    } else if (condition === 'between') {
                        // "Between X and Y" - block videos OUTSIDE the range
                        let fromMs = parseDateMs(cf.uploadDate.fromDate);
                        let toMs = parseDateMs(cf.uploadDate.toDate);
                        if (fromMs !== null && toMs !== null) {
                            if (fromMs > toMs) {
                                const tmp = fromMs;
                                fromMs = toMs;
                                toMs = tmp;
                            }
                            shouldBlock = publishTimestamp < fromMs || publishTimestamp > toMs;
                        }
                    }

                    if (shouldBlock) {
                        this._log(`🚫 Blocking by upload date filter (${condition})`);
                        return true;
                    }
                }
            }

            // Uppercase title filter (AI slop detection)
            if (cf.uppercase?.enabled) {
                const title = this._extractTitle(item, rules);
                if (title && this._checkUppercaseTitle(title, cf.uppercase)) {
                    this._log(`🚫 Blocking by uppercase title filter`);
                    return true;
                }
            }

            return false;
        }

        /**
         * Check if title contains uppercase words (AI slop detection)
         */
        _checkUppercaseTitle(title, settings) {
            if (!title || typeof title !== 'string') return false;
            const mode = settings.mode || 'single_word';
            const minLength = settings.minWordLength || 2;

            // Remove punctuation for word extraction
            const cleanTitle = title.replace(/[^\w\s]/g, ' ');
            const words = cleanTitle.split(/\s+/).filter(w => w.length >= minLength);

            if (mode === 'all_caps' || mode === 'both') {
                // Check if entire title is all caps (ignoring non-letters)
                const lettersOnly = title.replace(/[^a-zA-Z]/g, '');
                if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
                    return true;
                }
            }

            if (mode === 'single_word' || mode === 'both') {
                // Check for single uppercase words
                for (const word of words) {
                    const lettersOnly = word.replace(/[^a-zA-Z]/g, '');
                    if (lettersOnly.length >= minLength &&
                        lettersOnly === lettersOnly.toUpperCase() &&
                        lettersOnly.length === word.length) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Extract comprehensive channel information
         * For collaboration videos, returns an array of all collaborating channels
         */
        _extractChannelInfo(item, rules) {
            const channelInfo = { name: '', id: '', handle: '', customUrl: '', logo: '' };

            // PRIORITY: Avatar stack collaborations (e.g., lockupViewModel/watch-next-feed)
            // Some surfaces represent collaborations via avatarStackViewModel rather than showDialogCommand.
            // If we can extract multiple browseEndpoints, treat as a collaboration.
            try {
                const extractFromAvatarStack = (stack) => {
                    const avatars = stack?.avatars;
                    if (!Array.isArray(avatars) || avatars.length === 0) return [];
                    const collaborators = [];
                    const seen = new Set();

                    for (const entry of avatars) {
                        const vm = entry?.avatarViewModel || entry?.avatar || entry;
                        const endpoint =
                            vm?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                            vm?.onTap?.innertubeCommand?.browseEndpoint ||
                            entry?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                            null;

                        const browseId = endpoint?.browseId;
                        const canonicalBaseUrl = endpoint?.canonicalBaseUrl || vm?.commandMetadata?.webCommandMetadata?.url || '';

                        const collab = { name: '', id: '', handle: '', customUrl: '', logo: '' };
                        if (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) {
                            collab.id = browseId;
                        }

                        const logoUrl =
                            vm?.avatarViewModel?.image?.sources?.[0]?.url ||
                            vm?.image?.sources?.[0]?.url ||
                            entry?.avatarViewModel?.image?.sources?.[0]?.url ||
                            entry?.image?.sources?.[0]?.url ||
                            '';
                        if (logoUrl && typeof logoUrl === 'string') {
                            collab.logo = logoUrl;
                        }

                        if (canonicalBaseUrl && typeof canonicalBaseUrl === 'string') {
                            if (canonicalBaseUrl.startsWith('/@')) {
                                const normalized = normalizeChannelHandle(canonicalBaseUrl);
                                if (normalized) collab.handle = normalized;
                            } else if (canonicalBaseUrl.startsWith('/c/')) {
                                const slug = canonicalBaseUrl.split('/')[2];
                                if (slug) collab.customUrl = 'c/' + slug.split(/[?#]/)[0];
                            } else if (canonicalBaseUrl.startsWith('/user/')) {
                                const slug = canonicalBaseUrl.split('/')[2];
                                if (slug) collab.customUrl = 'user/' + slug.split(/[?#]/)[0];
                            }
                        }

                        const a11y = entry?.a11yLabel || vm?.a11yLabel || vm?.accessibilityText || '';
                        if (typeof a11y === 'string' && a11y.trim()) {
                            const cleaned = a11y.replace(/\bgo to channel\b/i, '').trim();
                            if (cleaned && !cleaned.startsWith('@')) {
                                collab.name = cleaned;
                            }
                        }

                        const key = (collab.id || collab.handle || collab.customUrl || '').toLowerCase();
                        if (!key || seen.has(key)) continue;
                        seen.add(key);
                        collaborators.push(collab);
                    }

                    return collaborators;
                };

                const visited = new WeakSet();
                const scanForStack = (node, depth = 0) => {
                    if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
                    visited.add(node);

                    if (node.avatarStackViewModel) {
                        const extracted = extractFromAvatarStack(node.avatarStackViewModel);
                        if (extracted.length > 1) return extracted;
                    }

                    if (Array.isArray(node)) {
                        for (const child of node.slice(0, 25)) {
                            const found = scanForStack(child, depth + 1);
                            if (found) return found;
                        }
                        return null;
                    }

                    for (const key in node) {
                        if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                        const value = node[key];
                        if (!value || typeof value !== 'object') continue;
                        const found = scanForStack(value, depth + 1);
                        if (found) return found;
                    }
                    return null;
                };

                const avatarStackCollaborators = scanForStack(item);
                if (Array.isArray(avatarStackCollaborators) && avatarStackCollaborators.length > 1) {
                    return avatarStackCollaborators;
                }
            } catch (e) {
            }

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

                                        let collabChannelInfo = { name: title || '', id: '', handle: '', customUrl: '', logo: '' };

                                        const dialogLogoUrl =
                                            listItemViewModel.leadingElement?.avatarViewModel?.image?.sources?.[0]?.url ||
                                            listItemViewModel.leadingElement?.thumbnailViewModel?.image?.sources?.[0]?.url ||
                                            listItemViewModel.leadingElement?.image?.sources?.[0]?.url ||
                                            listItemViewModel.leadingElement?.avatar?.avatarViewModel?.image?.sources?.[0]?.url ||
                                            '';
                                        if (dialogLogoUrl && typeof dialogLogoUrl === 'string') {
                                            collabChannelInfo.logo = dialogLogoUrl;
                                        }

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

            // Watch page lockupViewModel: capture channel avatar/logo
            if (!channelInfo.logo) {
                const lockupLogoUrl =
                    getByPath(item, 'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.avatarViewModel.image.sources.0.url') ||
                    getByPath(item, 'metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.avatar.image.sources.0.url') ||
                    '';
                if (lockupLogoUrl && typeof lockupLogoUrl === 'string') {
                    channelInfo.logo = lockupLogoUrl;
                }
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
                            } else if (!channelInfo.customUrl && (canonicalBaseUrl.startsWith('/c/') || canonicalBaseUrl.startsWith('/user/'))) {
                                // Use extractCustomUrlFromPath if available, otherwise fallback
                                if (typeof window.FilterTubeIdentity?.extractCustomUrlFromPath === 'function') {
                                    channelInfo.customUrl = window.FilterTubeIdentity.extractCustomUrlFromPath(canonicalBaseUrl);
                                } else {
                                    const parts = canonicalBaseUrl.split('/');
                                    const type = parts[1]; // 'c' or 'user'
                                    const slug = parts[2] ? parts[2].split(/[?#]/)[0] : '';
                                    if (slug) channelInfo.customUrl = `${type}/${slug}`;
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

            // Handle c/ChannelName and user/Name strings
            if (filter.includes('/c/') || filter.includes('/user/') || filter.startsWith('c/') || filter.startsWith('user/')) {
                let filterCustom = filter;
                try {
                    if (filter.includes('/c/')) filterCustom = 'c/' + filter.split('/c/')[1].split(/[?#]/)[0];
                    else if (filter.includes('/user/')) filterCustom = 'user/' + filter.split('/user/')[1].split(/[?#]/)[0];
                    filterCustom = decodeURIComponent(filterCustom).toLowerCase().trim();
                } catch (e) {
                    filterCustom = filter.toLowerCase().trim();
                }

                if (channelInfo.customUrl) {
                    let infoCustom = channelInfo.customUrl.toLowerCase().trim();
                    try {
                        infoCustom = decodeURIComponent(infoCustom).toLowerCase().trim();
                    } catch (e) { /* ignore */ }
                    if (infoCustom === filterCustom) return true;
                }

                // Cross-match: if filter is customUrl, check if mapped UC ID matches channelInfo.id
                const mappedId = this.channelMap[filterCustom];
                if (mappedId && channelInfo.id && channelInfo.id.toLowerCase() === mappedId.toLowerCase()) {
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

            // Global kill-switch: allow the extension to stay installed but stop mutating YouTube data.
            // We still harvest mappings above so 3-dot menu / resolver stays warm.
            if (this.settings.enabled === false) {
                this._log(`⏸️ Filtering disabled (settings.enabled=false); skipping ${dataName}`);
                return data;
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
