// js/injector.js - MAIN world script

(function () {
    'use strict';

    // Idempotency guard - prevent multiple executions
    if (window.filterTubeInjectorHasRun) {
        console.warn('FilterTube (Injector): Already initialized, skipping');
        return; // Now legal because it's inside a function
    }
    window.filterTubeInjectorHasRun = true;

    // Debug logging with sequence numbers and bridge relay
    let injectorDebugSequence = 0;
    function postLog(level, ...args) {
        if (level === 'log' && !window.__filtertubeDebug) {
            return;
        }
        injectorDebugSequence++;
        console[level](`[${injectorDebugSequence}] FilterTube (Injector):`, ...args);

        // Relay to content_bridge for extension console visibility
        try {
            window.postMessage({
                type: 'FilterTube_InjectorToBridge_Log',
                payload: {
                    level: level,
                    message: args,
                    seq: injectorDebugSequence
                },
                source: 'injector'
            }, '*');
        } catch (e) {
            // Don't let relay failures break functionality
        }
    }

    postLog('log', 'Starting initialization in MAIN world');

    // Default settings with safe fallbacks
    var currentSettings = {
        filterKeywords: [],
        filterChannels: [],
        hideAllComments: false,
        filterComments: false,
        useExactWordMatching: false,
        hideAllShorts: false
    };

    var settingsReceived = false;
    var initialDataQueue = [];

    // Cache for collaboration data from filter_logic.js
    var collaboratorCache = new Map(); // videoId -> collaborators array

    const HANDLE_TERMINATOR_REGEX = /[\/\s?#"'<>\u2022\u00B7]/;
    function extractRawHandle(value) {
        const sharedExtractRawHandle = window.FilterTubeIdentity?.extractRawHandle;
        if (typeof sharedExtractRawHandle === 'function') {
            return sharedExtractRawHandle(value);
        }
        if (!value || typeof value !== 'string') return '';
        let working = value.trim();
        if (!working) return '';
        const atIndex = working.indexOf('@');
        if (atIndex === -1) return '';
        working = working.substring(atIndex + 1);
        if (!working) return '';

        let buffer = '';
        for (let i = 0; i < working.length; i++) {
            const char = working[i];
            if (char === '%' && i + 2 < working.length && /[0-9A-Fa-f]{2}/.test(working.substring(i + 1, i + 3))) {
                buffer += working.substring(i, i + 3);
                i += 2;
                continue;
            }
            if (HANDLE_TERMINATOR_REGEX.test(char)) {
                break;
            }
            buffer += char;
        }

        if (!buffer) return '';
        try {
            buffer = decodeURIComponent(buffer);
        } catch (err) {
            // ignore
        }
        buffer = buffer.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
        buffer = buffer.trim();
        if (!buffer) return '';
        return `@${buffer}`;
    }

    function getCollaboratorListQuality(list) {
        if (!Array.isArray(list) || list.length === 0) return 0;
        return list.reduce((score, collaborator) => {
            if (!collaborator) return score;
            let entryScore = 10;
            if (collaborator.name) entryScore += 1;
            if (collaborator.handle) entryScore += 3;
            if (collaborator.id) entryScore += 5;
            return score + entryScore;
        }, 0);
    }

    function normalizeLooseText(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function normalizeExpectedHandle(value) {
        const raw = extractRawHandle(value) || (typeof value === 'string' ? value.trim() : '');
        if (!raw) return '';
        const norm = raw.startsWith('@') ? raw : `@${raw.replace(/^@+/, '')}`;
        return norm.toLowerCase();
    }

    function buildExpectedMatcher(payload) {
        const expectedNames = Array.isArray(payload?.expectedNames) ? payload.expectedNames : [];
        const expectedHandles = Array.isArray(payload?.expectedHandles) ? payload.expectedHandles : [];

        const nameSet = new Set(expectedNames.map(normalizeLooseText).filter(Boolean));
        const handleSet = new Set(expectedHandles.map(normalizeExpectedHandle).filter(Boolean));

        // If caller didn't send expectations, we must not reject results solely on that.
        const hasAny = nameSet.size > 0 || handleSet.size > 0;

        return {
            hasAny,
            matchesAny(collaborator) {
                if (!hasAny) return true;
                if (!collaborator || typeof collaborator !== 'object') return false;
                const name = normalizeLooseText(collaborator.name);
                const handle = normalizeExpectedHandle(collaborator.handle);
                return (name && nameSet.has(name)) || (handle && handleSet.has(handle));
            }
        };
    }

    function isValidCollaboratorResponse(list, matcher) {
        if (!Array.isArray(list) || list.length < 2) return false;

        // Prevent obvious garbage: all entries empty/placeholder-ish.
        const hasAnyIdentity = list.some(c => {
            if (!c || typeof c !== 'object') return false;
            const id = typeof c.id === 'string' ? c.id.trim() : '';
            const handle = typeof c.handle === 'string' ? c.handle.trim() : '';
            const name = typeof c.name === 'string' ? c.name.trim() : '';
            const customUrl = typeof c.customUrl === 'string' ? c.customUrl.trim() : '';
            return Boolean(id || handle || customUrl || name);
        });
        if (!hasAnyIdentity) return false;

        // If expectations were provided, require at least one collaborator to match.
        if (matcher && matcher.hasAny) {
            return list.some(c => matcher.matchesAny(c));
        }

        return true;
    }

    function cacheCollaboratorsIfBetter(videoId, collaborators = []) {
        if (!videoId || !Array.isArray(collaborators) || collaborators.length === 0) {
            return collaboratorCache.get(videoId) || null;
        }
        const incomingScore = getCollaboratorListQuality(collaborators);
        const existing = collaboratorCache.get(videoId);
        const existingScore = getCollaboratorListQuality(existing);
        if (!existing || incomingScore >= existingScore) {
            collaboratorCache.set(videoId, collaborators);
            return collaborators;
        }
        return existing;
    }

    // Listen for settings and data requests from content_bridge
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data) return;

        const { type, payload, source } = event.data;

        // Ignore our own messages and only accept from content_bridge or filter_logic
        if (source === 'injector') return;

        if (type === 'FilterTube_SettingsToInjector' && source === 'content_bridge') {
            postLog('log', 'Received settings from content_bridge:', {
                keywords: payload.filterKeywords?.length || 0,
                channels: payload.filterChannels?.length || 0,
                hideAllComments: payload.hideAllComments,
                hideAllShorts: payload.hideAllShorts
            });

            // Update current settings
            currentSettings = { ...currentSettings, ...payload };
            settingsReceived = true;

            // Update seed.js via global filterTube object
            updateSeedSettings();

            // Process any queued data
            processInitialDataQueue();
        }

        // Handle collaboration data caching from filter_logic.js
        if (type === 'FilterTube_CacheCollaboratorInfo' && source === 'filter_logic') {
            const { videoId, collaborators } = payload;
            if (videoId && Array.isArray(collaborators) && collaborators.length > 0) {
                const cached = cacheCollaboratorsIfBetter(videoId, collaborators);
                if (cached === collaborators) {
                    postLog('log', `📥 Cached collaboration data for video: ${videoId}, collaborators: ${collaborators.length}`);
                } else {
                    postLog('log', `📥 Ignored poorer collaboration cache for video: ${videoId}`);
                }
            }
        }

        // Handle collaborator info request from content_bridge (Isolated World)
        if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge') {
            const { videoId, requestId } = payload;
            postLog('log', `Received collaborator info request for video: ${videoId}`);

            const matcher = buildExpectedMatcher(payload || {});

            // First check cache (for dynamically loaded videos)
            let collaboratorInfo = collaboratorCache.get(videoId);
            let collaboratorScore = getCollaboratorListQuality(collaboratorInfo);

            // If not in cache, or ytInitialData has richer data, search ytInitialData
            const ytInitialDataCollaborators = searchYtInitialDataForCollaborators(videoId, matcher);
            const ytScore = getCollaboratorListQuality(ytInitialDataCollaborators);

            const cacheValid = isValidCollaboratorResponse(collaboratorInfo, matcher);
            const ytValid = isValidCollaboratorResponse(ytInitialDataCollaborators, matcher);

            if (ytValid && (!cacheValid || ytScore > collaboratorScore)) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
            } else if (!cacheValid && ytValid) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
            } else if (!cacheValid) {
                // Do not return a single-channel or mismatched collaborator list; it can poison block actions.
                collaboratorInfo = null;
            }

            // Send response back to content_bridge
            window.postMessage({
                type: 'FilterTube_CollaboratorInfoResponse',
                payload: {
                    videoId,
                    requestId,
                    collaborators: collaboratorInfo || null
                },
                source: 'injector'
            }, '*');

            postLog('log', `Sent collaborator info response:`, collaboratorInfo?.length || 0, 'collaborators');
        }

        // Handle single-channel info request from content_bridge (for UC ID + handle lookup)
        if (type === 'FilterTube_RequestChannelInfo' && source === 'content_bridge') {
            const { videoId, requestId, expectedHandle, expectedName } = payload || {};
            postLog('log', `Received channel info request for video: ${videoId}`);

            let channel = null;
            if (videoId) {
                channel = searchYtInitialDataForVideoChannel(videoId, {
                    expectedHandle: extractRawHandle(expectedHandle) || expectedHandle,
                    expectedName
                });
            }

            window.postMessage({
                type: 'FilterTube_ChannelInfoResponse',
                payload: {
                    videoId,
                    requestId,
                    channel
                },
                source: 'injector'
            }, '*');

            if (channel) {
                postLog('log', 'Sent channel info response:', channel);
            } else {
                postLog('log', 'No channel info found for video:', videoId);
            }
        }
    });

    /**
     * Extract collaborators from a raw renderer/data object
     * Works for both cached ytInitialData objects and live DOM component data
     * @param {Object} obj
     * @returns {Array|null}
     */
    function extractCollaboratorsFromDataObject(obj) {
        if (!obj || typeof obj !== 'object') return null;

        const extractFromAvatarStackViewModel = (stack) => {
            const avatars = stack?.avatars;
            if (!Array.isArray(avatars) || avatars.length === 0) return null;
            const collaborators = [];
            const seen = new Set();

            const parseBrowseIdFromUrl = (url) => {
                if (!url || typeof url !== 'string') return '';
                const match = url.match(/(?:channel\/)?(UC[\w-]{22})/i);
                return match?.[1] || '';
            };

            const pickEndpointUrl = (node) => {
                if (!node || typeof node !== 'object') return '';
                return (
                    node?.commandMetadata?.webCommandMetadata?.url ||
                    node?.webCommandMetadata?.url ||
                    node?.url ||
                    ''
                );
            };

            const resolveBrowseEndpoint = (node) => {
                if (!node || typeof node !== 'object') return null;
                return (
                    node?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                    node?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    node?.rendererContext?.commandContext?.onTap?.browseEndpoint ||
                    node?.onTap?.innertubeCommand?.browseEndpoint ||
                    node?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    node?.onTap?.browseEndpoint ||
                    node?.navigationEndpoint?.browseEndpoint ||
                    node?.browseEndpoint ||
                    null
                );
            };

            for (const entry of avatars) {
                const vm = entry?.avatarViewModel || entry?.avatar || entry;

                const endpoint = resolveBrowseEndpoint(vm) || resolveBrowseEndpoint(entry) || null;
                const browseId = endpoint?.browseId || '';
                const endpointUrl = pickEndpointUrl(endpoint) || pickEndpointUrl(vm) || pickEndpointUrl(entry) || '';
                const canonicalBaseUrl = endpoint?.canonicalBaseUrl || endpointUrl || '';

                const collab = { name: '', id: '', handle: '', customUrl: '' };
                const inferredId = (browseId && typeof browseId === 'string') ? browseId : '';
                const urlId = parseBrowseIdFromUrl(canonicalBaseUrl);
                const finalId = (inferredId && inferredId.toUpperCase().startsWith('UC')) ? inferredId : (urlId ? urlId : '');
                if (finalId) collab.id = finalId;

                if (canonicalBaseUrl && typeof canonicalBaseUrl === 'string') {
                    const extracted = extractRawHandle(canonicalBaseUrl);
                    if (extracted) collab.handle = extracted;
                    const custom = extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl);
                    if (custom) collab.customUrl = custom;
                }

                const label = entry?.a11yLabel || vm?.a11yLabel || vm?.accessibilityText || '';
                if (typeof label === 'string' && label.trim()) {
                    const cleaned = label.replace(/\bgo to channel\b/i, '').trim();
                    if (cleaned && !cleaned.startsWith('@')) {
                        collab.name = cleaned;
                    }
                }

                const key = (collab.id || collab.handle || collab.customUrl || collab.name || '').toLowerCase();
                if (!key || seen.has(key)) continue;
                seen.add(key);
                collaborators.push(collab);
            }

            return collaborators.length > 0 ? collaborators : null;
        };

        const extractFromShowDialogCommand = (showDialogCommand) => {
            const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;
            if (!Array.isArray(listItems) || listItems.length === 0) return null;

            const collaborators = [];
            for (const item of listItems) {
                const viewModel = item?.listItemViewModel;
                if (!viewModel) continue;

                const title = viewModel.title?.content;
                const subtitle = viewModel.subtitle?.content;
                const browseEndpoint = viewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;

                const collab = { name: title };
                if (browseEndpoint?.canonicalBaseUrl) {
                    const extracted = extractRawHandle(browseEndpoint.canonicalBaseUrl);
                    if (extracted) collab.handle = extracted;
                }
                if (!collab.handle && subtitle) {
                    const extracted = extractRawHandle(subtitle);
                    if (extracted) collab.handle = extracted;
                }
                if (browseEndpoint?.browseId?.startsWith('UC')) {
                    collab.id = browseEndpoint.browseId;
                }

                if (collab.handle || collab.id || collab.name) {
                    collaborators.push(collab);
                }
            }

            return collaborators.length > 0 ? collaborators : null;
        };

        // Handle raw stack objects passed directly.
        if (Array.isArray(obj.avatars)) {
            const extracted = extractFromAvatarStackViewModel(obj);
            if (Array.isArray(extracted) && extracted.length > 1) return extracted;
        }
        if (obj.avatarStackViewModel && Array.isArray(obj.avatarStackViewModel.avatars)) {
            const extracted = extractFromAvatarStackViewModel(obj.avatarStackViewModel);
            if (Array.isArray(extracted) && extracted.length > 1) return extracted;
        }

        let renderer = obj;
        if (renderer.content?.videoRenderer) {
            renderer = renderer.content.videoRenderer;
        } else if (renderer.richItemRenderer?.content?.videoRenderer) {
            renderer = renderer.richItemRenderer.content.videoRenderer;
        } else if (renderer.richItemRenderer?.content?.lockupViewModel) {
            renderer = renderer.richItemRenderer.content.lockupViewModel;
        } else if (renderer.lockupViewModel) {
            renderer = renderer.lockupViewModel;
        } else if (renderer.gridVideoRenderer) {
            renderer = renderer.gridVideoRenderer;
        } else if (renderer.playlistVideoRenderer) {
            renderer = renderer.playlistVideoRenderer;
        } else if (renderer.videoRenderer) {
            renderer = renderer.videoRenderer;
        } else if (renderer.data?.content?.videoRenderer) {
            renderer = renderer.data.content.videoRenderer;
        } else if (renderer.data?.content?.lockupViewModel) {
            renderer = renderer.data.content.lockupViewModel;
        }

        if (!renderer || typeof renderer !== 'object') return null;

        const bylineText = renderer.shortBylineText || renderer.longBylineText;
        if (bylineText?.runs) {
            for (const run of bylineText.runs) {
                const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
                if (!showDialogCommand) continue;

                const collaborators = extractFromShowDialogCommand(showDialogCommand);
                if (collaborators) return collaborators;
            }
        }

        // Some surfaces expose collaboration via avatarStackViewModel rather than showDialogCommand.
        // Handle both wrapper objects ({ avatarStackViewModel: {...} }) and a raw stack object ({ avatars: [...] }).
        try {
            const visited = new WeakSet();
            const scan = (node, depth = 0) => {
                if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
                visited.add(node);
                if (node.avatarStackViewModel) {
                    const extracted = extractFromAvatarStackViewModel(node.avatarStackViewModel);
                    if (Array.isArray(extracted) && extracted.length > 1) {
                        return extracted;
                    }
                }
                if (Array.isArray(node.avatars)) {
                    const extracted = extractFromAvatarStackViewModel(node);
                    if (Array.isArray(extracted) && extracted.length > 1) {
                        return extracted;
                    }
                }
                if (Array.isArray(node)) {
                    for (const child of node.slice(0, 25)) {
                        const found = scan(child, depth + 1);
                        if (found) return found;
                    }
                    return null;
                }
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    const found = scan(value, depth + 1);
                    if (found) return found;
                }
                return null;
            };
            const stacked = scan(renderer);
            if (Array.isArray(stacked) && stacked.length > 1) {
                return stacked;
            }
        } catch (e) {
        }

        // Home lockupViewModel often doesn't expose bylineText runs; fall back to a bounded deep scan
        // for showDialogCommand anywhere inside the renderer.
        const visited = new WeakSet();
        function deepScanForShowDialog(node, depth = 0) {
            if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
            visited.add(node);

            if (node.showDialogCommand) {
                const collaborators = extractFromShowDialogCommand(node.showDialogCommand);
                if (collaborators) return collaborators;
            }

            if (Array.isArray(node)) {
                for (const child of node.slice(0, 25)) {
                    const found = deepScanForShowDialog(child, depth + 1);
                    if (found) return found;
                }
                return null;
            }

            for (const key in node) {
                if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                const value = node[key];
                if (!value || typeof value !== 'object') continue;
                const found = deepScanForShowDialog(value, depth + 1);
                if (found) return found;
            }

            return null;
        }

        const deepScanned = deepScanForShowDialog(renderer);
        if (deepScanned) return deepScanned;

        const ownerRuns = renderer.ownerText?.runs || bylineText?.runs;
        if (ownerRuns) {
            for (const run of ownerRuns) {
                const browseEndpoint = run.navigationEndpoint?.browseEndpoint;
                if (!browseEndpoint) continue;

                const fallback = {
                    id: browseEndpoint.browseId,
                    name: run.text
                };
                if (browseEndpoint.canonicalBaseUrl) {
                    const extracted = extractRawHandle(browseEndpoint.canonicalBaseUrl);
                    if (extracted) fallback.handle = extracted;
                }

                if (fallback.id || fallback.handle || fallback.name) {
                    return [fallback];
                }
            }
        }

        return null;
    }

    /**
     * Search ytInitialData (MAIN world) for channel info associated with a video ID
     * Returns { id, handle, name } when possible.
     * This lives in injector.js because content_bridge (Isolated World) cannot
     * read window.ytInitialData directly.
     * @param {string} videoId
     * @returns {Object|null}
     */
    function normalizeChannelName(value) {
        if (!value || typeof value !== 'string') return '';
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function extractCustomUrlFromCanonicalBaseUrl(value) {
        if (!value || typeof value !== 'string') return '';
        const trimmed = value.trim();
        if (!trimmed) return '';
        const decoded = (() => {
            try {
                return decodeURIComponent(trimmed);
            } catch (e) {
                return trimmed;
            }
        })();

        const path = decoded.startsWith('http') ? (() => {
            try {
                return new URL(decoded).pathname;
            } catch (e) {
                return decoded;
            }
        })() : decoded;

        if (path.startsWith('/c/')) {
            const slug = path.split('/')[2] || '';
            return slug ? `c/${slug}` : '';
        }
        if (path.startsWith('/user/')) {
            const slug = path.split('/')[2] || '';
            return slug ? `user/${slug}` : '';
        }
        return '';
    }

    function extractChannelLogoFromObject(obj) {
        if (!obj || typeof obj !== 'object') return '';

        const candidates = [
            obj?.lockupMetadataViewModel?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.avatar?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.avatarViewModel?.image?.sources?.[0]?.url,
            obj?.channelAvatar?.sources?.[0]?.url,
            obj?.thumbnail?.thumbnails?.[0]?.url,
            obj?.thumbnail?.thumbnails?.[1]?.url,
            obj?.thumbnails?.[0]?.url,
            obj?.thumbnails?.[1]?.url
        ];

        for (const cand of candidates) {
            if (typeof cand === 'string' && cand.trim()) return cand.trim();
        }
        return '';
    }

    function mergeChannelCandidates(...candidates) {
        const merged = { id: null, handle: null, name: null, logo: null, customUrl: null };
        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== 'object') continue;
            if (!merged.id && typeof candidate.id === 'string' && candidate.id.trim()) merged.id = candidate.id.trim();
            if (!merged.handle && typeof candidate.handle === 'string' && candidate.handle.trim()) merged.handle = candidate.handle.trim();
            if (!merged.name && typeof candidate.name === 'string' && candidate.name.trim()) merged.name = candidate.name.trim();
            if (!merged.logo && typeof candidate.logo === 'string' && candidate.logo.trim()) merged.logo = candidate.logo.trim();
            if (!merged.customUrl && typeof candidate.customUrl === 'string' && candidate.customUrl.trim()) merged.customUrl = candidate.customUrl.trim();
        }
        const hasAny = Boolean(merged.id || merged.handle || merged.name || merged.logo || merged.customUrl);
        return hasAny ? merged : null;
    }

    function searchYtInitialDataForVideoChannel(videoId, expectations = {}) {
        if (!videoId) {
            postLog('log', 'Channel search skipped - missing videoId');
            return null;
        }

        // IMPORTANT: Do not require ytInitialData to exist.
        // On many surfaces (especially YouTube Kids), the most reliable identity comes
        // from stashed network snapshots (lastYtBrowseResponse/lastYtNextResponse/lastYtPlayerResponse).
        // This function must continue as long as ANY snapshot root exists.
        postLog('log', `Searching snapshots for channel of video: ${videoId}`);

        let foundVideoObject = false;
        let matchedTargetVideo = false;
        const visited = new WeakSet();
        const options = (expectations && typeof expectations === 'object') ? expectations : {};
        const normalizedExpectedHandle = typeof options.expectedHandle === 'string'
            ? (extractRawHandle(options.expectedHandle) || options.expectedHandle).trim().toLowerCase()
            : '';
        const normalizedExpectedName = normalizeChannelName(options.expectedName);
        const hasExpectations = Boolean(normalizedExpectedHandle || normalizedExpectedName);
        let fallbackCandidate = null;

        const isWatchContext = (() => {
            try {
                return typeof document !== 'undefined' && (document.location?.pathname || '').startsWith('/watch');
            } catch (e) {
                return false;
            }
        })();
        const isCurrentWatchVideo = (() => {
            if (!isWatchContext) return false;
            try {
                const params = new URLSearchParams(document.location?.search || '');
                return params.get('v') === videoId;
            } catch (e) {
                return false;
            }
        })();

        const extractOwnerCandidate = (ownerRenderer) => {
            if (!ownerRenderer || typeof ownerRenderer !== 'object') return null;
            const endpoint =
                ownerRenderer?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                null;
            const browseId = endpoint?.browseId || '';
            const canonicalBaseUrl = endpoint?.canonicalBaseUrl || '';
            const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || null) : null;
            const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || null) : null;
            const name = ownerRenderer?.title?.runs?.[0]?.text || ownerRenderer?.title?.simpleText || ownerRenderer?.shortBylineText?.runs?.[0]?.text || '';
            const logo = extractChannelLogoFromObject(ownerRenderer) || '';
            const candidate = {
                id: (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) ? browseId : null,
                handle: handle || null,
                name: name || null,
                logo: logo || null,
                customUrl: customUrl || null
            };

            if (!candidate.id && !candidate.handle && !candidate.name && !candidate.logo && !candidate.customUrl) {
                return null;
            }
            if (!hasExpectations || matchesExpectations(candidate)) {
                return candidate;
            }
            if (!fallbackCandidate) {
                fallbackCandidate = candidate;
            }
            return null;
        };

        const extractFromPlayerResponse = (player) => {
            if (!player || typeof player !== 'object') return null;
            const details = player.videoDetails || null;
            const micro = player.microformat?.playerMicroformatRenderer || null;
            const playerVideoId = (typeof details?.videoId === 'string') ? details.videoId : '';
            if (!playerVideoId) return null;
            if (playerVideoId !== videoId) return null;
            matchedTargetVideo = true;
            const id = details?.channelId || null;
            const name = details?.author || micro?.ownerChannelName || null;
            const profileUrl = micro?.ownerProfileUrl || micro?.ownerProfileUrl?.url || null;
            const handle = profileUrl ? (extractRawHandle(profileUrl) || null) : null;
            const customUrl = profileUrl ? (extractCustomUrlFromCanonicalBaseUrl(profileUrl) || null) : null;
            const candidate = { id, handle, name, customUrl };
            return mergeChannelCandidates(candidate);
        };

        const watchOwnerCandidate = (() => {
            const initialDataRoot = window.ytInitialData || window.filterTube?.lastYtInitialData || window.filterTube?.rawYtInitialData || null;
            if (!isCurrentWatchVideo || !initialDataRoot) return null;
            const visitedOwner = new WeakSet();
            const scan = (node, depth = 0) => {
                if (!node || typeof node !== 'object' || visitedOwner.has(node) || depth > 10) return null;
                visitedOwner.add(node);
                if (node.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer) {
                    const cand = extractOwnerCandidate(node.videoSecondaryInfoRenderer.owner.videoOwnerRenderer);
                    if (cand) return cand;
                }
                if (node.videoOwnerRenderer) {
                    const cand = extractOwnerCandidate(node.videoOwnerRenderer);
                    if (cand) return cand;
                }
                if (Array.isArray(node)) {
                    for (const child of node.slice(0, 40)) {
                        const found = scan(child, depth + 1);
                        if (found) return found;
                    }
                    return null;
                }
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    const found = scan(value, depth + 1);
                    if (found) return found;
                }
                return null;
            };
            return scan(initialDataRoot);
        })();

        // Build the list of roots to search.
        // We include ytInitialData when present, but DO NOT depend on it.
        const searchTargets = [];
        if (window.ytInitialData) {
            searchTargets.push({ root: window.ytInitialData, label: 'ytInitialData' });
        }
        if (window.filterTube?.lastYtInitialData) {
            searchTargets.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
        }
        if (window.filterTube?.rawYtInitialData) {
            searchTargets.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
        }

        if (window.filterTube?.lastYtNextResponse) {
            searchTargets.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
        }
        if (window.filterTube?.lastYtBrowseResponse) {
            searchTargets.push({ root: window.filterTube.lastYtBrowseResponse, label: 'filterTube.lastYtBrowseResponse' });
        }

        const ftPlayer = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse;
        if (ftPlayer) {
            searchTargets.push({ root: ftPlayer, label: 'filterTube.lastYtInitialPlayerResponse' });
        } else if (window.ytInitialPlayerResponse) {
            searchTargets.push({ root: window.ytInitialPlayerResponse, label: 'ytInitialPlayerResponse' });
        }

        if (window.filterTube?.lastYtPlayerResponse) {
            searchTargets.push({ root: window.filterTube.lastYtPlayerResponse, label: 'filterTube.lastYtPlayerResponse' });
        }

        if (searchTargets.length === 0) {
            postLog('log', 'Channel search skipped - no snapshot roots available');
            return null;
        }

        function matchesExpectations(candidate) {
            if (!candidate) return false;
            if (!hasExpectations) return true;
            if (normalizedExpectedHandle) {
                const candidateHandle = candidate.handle ? candidate.handle.toLowerCase() : '';
                // Only enforce when candidate has a handle; some ytInitialData nodes provide UC ID only.
                if (candidateHandle && candidateHandle !== normalizedExpectedHandle) {
                    return false;
                }
            }
            if (normalizedExpectedName) {
                const candidateName = normalizeChannelName(candidate.name);
                // Only enforce when candidate has a name; some nodes omit byline text.
                if (candidateName && candidateName !== normalizedExpectedName) {
                    return false;
                }
            }
            return true;
        }

        const extractVideoIdFromNode = (node) => {
            if (!node || typeof node !== 'object') return '';
            const direct =
                node.videoId ||
                node.contentId ||
                node?.watchEndpoint?.videoId ||
                node?.navigationEndpoint?.watchEndpoint?.videoId ||
                node?.reelWatchEndpoint?.videoId ||
                node?.navigationEndpoint?.reelWatchEndpoint?.videoId ||
                '';
            if (direct && typeof direct === 'string') return direct;

            const urlCandidate =
                node?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.navigationEndpoint?.watchEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.commandMetadata?.webCommandMetadata?.url ||
                '';
            if (urlCandidate && typeof urlCandidate === 'string') {
                const match = urlCandidate.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (match && match[1]) return match[1];
                const watchMatch = urlCandidate.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (watchMatch && watchMatch[1]) return watchMatch[1];
            }
            return '';
        };

        function searchNode(node, visited) {
            if (!node || typeof node !== 'object' || visited.has(node)) return null;
            visited.add(node);

            // Direct hit: object with our videoId
            const nodeVideoId = extractVideoIdFromNode(node);

            if (nodeVideoId === videoId) {
                foundVideoObject = true;
                matchedTargetVideo = true;

                // Priority 1: navigationEndpoint.browseEndpoint on the video renderer
                const nav = node.navigationEndpoint && node.navigationEndpoint.browseEndpoint;
                if (nav) {
                    const browseId = nav.browseId;
                    const canonicalBaseUrl = nav.canonicalBaseUrl;
                    const name = (node.shortBylineText?.runs?.[0]?.text) || (node.longBylineText?.runs?.[0]?.text) || undefined;

                    if (canonicalBaseUrl) {
                        const handle = extractRawHandle(canonicalBaseUrl) || null;
                        if (handle && browseId && browseId.startsWith('UC')) {
                            return { id: browseId, handle, name };
                        }
                        if (handle) {
                            return { handle, name };
                        }
                    }

                    if (browseId && browseId.startsWith('UC')) {
                        return { id: browseId, name };
                    }
                }

                // Priority 2: byline runs
                const byline = node.shortBylineText || node.longBylineText || node.ownerText;
                if (byline?.runs && Array.isArray(byline.runs)) {
                    for (const run of byline.runs) {
                        const browse = run?.navigationEndpoint?.browseEndpoint;
                        if (!browse) continue;

                        const browseId = browse.browseId;
                        const canonicalBaseUrl = browse.canonicalBaseUrl;
                        const name = run.text;

                        if (canonicalBaseUrl) {
                            const handle = extractRawHandle(canonicalBaseUrl) || null;
                            if (handle) {
                                console.log('FilterTube: Found channel in ytInitialData (deep search):', { handle, id: browseId });
                                const candidate = { handle, id: browseId, name };
                                if (!hasExpectations || matchesExpectations(candidate)) {
                                    return candidate;
                                }
                                if (!fallbackCandidate) {
                                    fallbackCandidate = candidate;
                                }
                            } else if (browseId && browseId.startsWith('UC')) {
                                const candidate = { id: browseId, name };
                                if (!hasExpectations || matchesExpectations(candidate)) {
                                    return candidate;
                                }
                                if (!fallbackCandidate) {
                                    fallbackCandidate = candidate;
                                }
                            }
                        }
                    }
                }

                const ownerRenderer =
                    node?.videoSecondaryInfoRenderer?.owner?.videoOwnerRenderer ||
                    node?.owner?.videoOwnerRenderer ||
                    node?.videoOwnerRenderer ||
                    null;
                if (ownerRenderer) {
                    const ownerCandidate = extractOwnerCandidate(ownerRenderer);
                    if (ownerCandidate) return ownerCandidate;
                }
            }

            // Recurse
            if (Array.isArray(node)) {
                for (const child of node) {
                    const found = searchNode(child, visited);
                    if (found) return found;
                }
            } else {
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    if (Array.isArray(value)) {
                        for (const child of value) {
                            const found = searchNode(child, visited);
                            if (found) return found;
                        }
                    } else {
                        const found = searchNode(value, visited);
                        if (found) return found;
                    }
                }
            }

            return null;
        }

        function searchRoot(root, label) {
            if (!root || typeof root !== 'object') return null;
            postLog('log', `Channel search: looking in ${label}`);
            const visited = new WeakSet();
            const result = searchNode(root, visited);
            if (!foundVideoObject) {
                postLog('log', `Channel search: video ID not found in ${label}: ${videoId}`);
            } else if (result) {
                postLog('log', `Channel search: found channel in ${label}`);
                return result;
            }
            return null;
        }

        let result = null;
        const playerCandidate = (() => {
            const ftPlayer = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse;
            const basePlayer = ftPlayer || window.ytInitialPlayerResponse;
            const extracted = extractFromPlayerResponse(basePlayer);
            if (extracted) {
                if (!hasExpectations || matchesExpectations(extracted)) {
                    return extracted;
                }
                if (!fallbackCandidate) fallbackCandidate = extracted;
            }
            return null;
        })();

        if (watchOwnerCandidate) {
            matchedTargetVideo = true;
            const mergedWatch = mergeChannelCandidates(watchOwnerCandidate, playerCandidate);
            if (mergedWatch) {
                if (!hasExpectations || matchesExpectations(mergedWatch)) {
                    return mergedWatch;
                }
                if (!fallbackCandidate) fallbackCandidate = mergedWatch;
            }
        }

        for (const target of searchTargets) {
            // Reset per-root flags while preserving global fallback
            const prevFoundFlag = foundVideoObject;
            result = searchRoot(target.root, target.label);
            if (result) break;
            if (!foundVideoObject) {
                // reset so other roots can log properly
                foundVideoObject = prevFoundFlag;
            }
        }

        if (!result && !fallbackCandidate) {
            postLog('log', `Channel search: no channel info extracted for ${videoId} across ${searchTargets.length} roots`);
        }
        if (result) return result;
        if (fallbackCandidate && matchedTargetVideo) return fallbackCandidate;
        if (fallbackCandidate && !matchedTargetVideo) {
            postLog('warn', `Channel search: ignoring unanchored fallback for ${videoId}`);
        }
        return null;
    }

    /**
     * Hybrid search for collaborator info (global cache + DOM hydration)
     * @param {string} videoId
     * @returns {Array|null}
     */
    function searchYtInitialDataForCollaborators(videoId, matcher = null) {
        if (!videoId) {
            postLog('log', 'Collaborator search skipped - missing videoId');
            return null;
        }

        postLog('log', `Searching collaborators for ${videoId}...`);

        let result = null;

        const roots = [];
        if (window.ytInitialData) {
            roots.push({ root: window.ytInitialData, label: 'ytInitialData' });
        }
        if (window.filterTube?.lastYtInitialData) {
            roots.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
        }
        if (window.filterTube?.rawYtInitialData) {
            roots.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
        }

        if (window.filterTube?.lastYtNextResponse) {
            roots.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
        }
        if (window.filterTube?.lastYtBrowseResponse) {
            roots.push({ root: window.filterTube.lastYtBrowseResponse, label: 'filterTube.lastYtBrowseResponse' });
        }

        const extractVideoIdFromNode = (node) => {
            if (!node || typeof node !== 'object') return '';
            const direct =
                node.videoId ||
                node.contentId ||
                node?.watchEndpoint?.videoId ||
                node?.navigationEndpoint?.watchEndpoint?.videoId ||
                node?.reelWatchEndpoint?.videoId ||
                node?.navigationEndpoint?.reelWatchEndpoint?.videoId ||
                '';
            if (direct && typeof direct === 'string') return direct;

            const urlCandidate =
                node?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.navigationEndpoint?.watchEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.commandMetadata?.webCommandMetadata?.url ||
                '';
            if (urlCandidate && typeof urlCandidate === 'string') {
                const match = urlCandidate.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
                if (match && match[1]) return match[1];
                const watchMatch = urlCandidate.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
                if (watchMatch && watchMatch[1]) return watchMatch[1];
            }
            return '';
        };

        for (const target of roots) {
            const visited = new WeakSet();
            function searchObject(obj, depth = 0) {
                if (!obj || typeof obj !== 'object' || visited.has(obj) || depth > 12) return null;
                visited.add(obj);

                const nodeVideoId = extractVideoIdFromNode(obj);
                if (nodeVideoId === videoId) {
                    const extracted = extractCollaboratorsFromDataObject(obj);
                    if (Array.isArray(extracted) && extracted.length > 0) {
                        // Only treat this as a valid collaboration result when it is a true roster (2+ channels)
                        // and matches expectations from the clicked card (when provided).
                        if (!isValidCollaboratorResponse(extracted, matcher)) {
                            return null;
                        }
                        postLog('log', `✅ Found collaborators via ${target.label}`);
                        return extracted;
                    }
                }

                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                    const value = obj[key];
                    if (!value || typeof value !== 'object') continue;
                    if (Array.isArray(value)) {
                        for (let i = 0; i < value.length; i++) {
                            const nested = searchObject(value[i], depth + 1);
                            if (nested) return nested;
                        }
                    } else {
                        const nested = searchObject(value, depth + 1);
                        if (nested) return nested;
                    }
                }

                return null;
            }

            result = searchObject(target.root);
            if (result) {
                return result;
            }
        }

        postLog('log', '⚠️ Global search failed. Attempting DOM hydration…');
        if (typeof document === 'undefined') {
            postLog('warn', 'DOM hydration unavailable - document not defined');
            return null;
        }

        const candidates = [];
        const selector = `[data-filtertube-video-id="${videoId}"]`;
        const baseElement = document.querySelector(selector);
        if (baseElement) {
            candidates.push(baseElement);
            const wrapper = baseElement.closest('ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-playlist-video-renderer, ytd-video-renderer');
            if (wrapper && wrapper !== baseElement) {
                candidates.push(wrapper);
            }

            // Late-loaded lockup cards often keep the collaborator endpoints on nested avatar-stack elements.
            try {
                const avatarStack = baseElement.querySelector('yt-avatar-stack-view-model, .yt-avatar-stack-view-model');
                if (avatarStack) {
                    candidates.push(avatarStack);
                }
                const nestedAvatarStacks = baseElement.querySelectorAll?.('yt-avatar-stack-view-model, .yt-avatar-stack-view-model');
                if (nestedAvatarStacks && nestedAvatarStacks.length > 1) {
                    for (const node of Array.from(nestedAvatarStacks).slice(0, 3)) {
                        if (node && !candidates.includes(node)) {
                            candidates.push(node);
                        }
                    }
                }
            } catch (e) {
                // ignore
            }
        } else {
            postLog('warn', `❌ Could not find DOM element for ${videoId}`);
        }

        const hydrateFromStampedAttributes = (element, label) => {
            if (!element || typeof element.getAttribute !== 'function') return null;
            const raw = element.getAttribute('data-filtertube-collaborators') || '';
            if (!raw) return null;
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    postLog('log', `✅ Hydrated collaborators from ${label} data-filtertube-collaborators`);
                    return parsed;
                }
            } catch (e) {
                // ignore
            }
            return null;
        };

        const attemptExtraction = (element, label) => {
            if (!element) return null;

            let best = null;
            let bestScore = 0;

            const stamped = hydrateFromStampedAttributes(element, label);
            if (Array.isArray(stamped) && stamped.length > 0) {
                best = stamped;
                bestScore = getCollaboratorListQuality(stamped);
            }

            const dataCandidates = [
                element.data,
                element.data?.content,
                element.data?.content?.videoRenderer,
                element.data?.content?.lockupViewModel,
                element.__data?.data,
                element.__data?.data?.content,
                element.__data?.data?.content?.videoRenderer,
                element.__data?.data?.content?.lockupViewModel,
                element.__data?.item,
                element.__data
            ];
            for (const candidate of dataCandidates) {
                const extracted = extractCollaboratorsFromDataObject(candidate);
                if (Array.isArray(extracted) && extracted.length > 0) {
                    const score = getCollaboratorListQuality(extracted);
                    if (score > bestScore) {
                        best = extracted;
                        bestScore = score;
                    }
                }
            }

            // Some lockup view-models store collaborators on nested metadata elements.
            try {
                const nestedStamped = element.querySelector?.('[data-filtertube-collaborators]');
                if (nestedStamped) {
                    const nested = hydrateFromStampedAttributes(nestedStamped, `${label} descendant`);
                    if (Array.isArray(nested) && nested.length > 0) {
                        const score = getCollaboratorListQuality(nested);
                        if (score > bestScore) {
                            best = nested;
                            bestScore = score;
                        }
                    }
                }
            } catch (e) {
                // ignore
            }

            if (best) {
                postLog('log', `✅ Hydrated collaborators from ${label} (score=${bestScore})`);
            }
            return best;
        };

        for (const element of candidates) {
            result = attemptExtraction(element, element === baseElement ? 'element' : 'ancestor');
            if (result) return result;
        }

        return null;
    }

    // Function to update seed.js settings
    function updateSeedSettings() {
        if (window.filterTube && typeof window.filterTube.updateSettings === 'function') {
            postLog('log', 'Updating seed.js with received settings');
            window.filterTube.updateSettings(currentSettings);
            postLog('log', 'Seed.js settings updated successfully');
        } else {
            postLog('warn', 'window.filterTube.updateSettings not available yet, will retry');

            // Retry after delay
            setTimeout(() => {
                if (window.filterTube && typeof window.filterTube.updateSettings === 'function') {
                    postLog('log', 'Retrying seed.js settings update');
                    window.filterTube.updateSettings(currentSettings);
                    postLog('log', 'Seed.js settings updated successfully on retry');
                } else {
                    postLog('error', 'Failed to update seed.js settings after retry');
                }
            }, 300);
        }
    }

    // Process data with FilterTubeEngine
    function processDataWithFilterLogic(data, dataName) {
        if (!window.FilterTubeEngine?.processData) {
            postLog('warn', `FilterTubeEngine not available for ${dataName}`);
            return data;
        }

        try {
            postLog('log', `Processing ${dataName} with FilterTubeEngine`);
            const result = window.FilterTubeEngine.processData(data, currentSettings, dataName);
            postLog('log', `${dataName} processed successfully`);
            return result;
        } catch (error) {
            postLog('error', `Error processing ${dataName}:`, error.message);
            return data;
        }
    }

    // Process queued data
    function processInitialDataQueue() {
        if (!settingsReceived || !window.FilterTubeEngine) {
            postLog('log', `Queue processing delayed - Settings: ${settingsReceived}, Engine: ${!!window.FilterTubeEngine}`);
            return;
        }

        if (initialDataQueue.length === 0) {
            postLog('log', 'No queued data to process');
            return;
        }

        postLog('log', `Processing ${initialDataQueue.length} queued data items`);

        while (initialDataQueue.length > 0) {
            const item = initialDataQueue.shift();
            postLog('log', `Processing queued ${item.name}`);

            if (typeof item.process === 'function') {
                item.process();
            }
        }

        postLog('log', 'Finished processing queued data');
    }

    // Connect to seed.js global object
    function connectToSeedGlobal() {
        if (!window.filterTube) {
            postLog('warn', 'window.filterTube not available yet');
            return false;
        }

        postLog('log', 'Connecting to seed.js global object');

        // Set up processing functions for seed.js
        window.filterTube.processFetchResponse = function (url, data) {
            postLog('log', `Processing fetch response from ${url.pathname}`);
            return processDataWithFilterLogic(data, `fetch:${url.pathname}`);
        };

        window.filterTube.processXhrResponse = function (url, data) {
            postLog('log', `Processing XHR response from ${url.pathname}`);
            return processDataWithFilterLogic(data, `xhr:${url.pathname}`);
        };

        // Update settings if already received
        if (settingsReceived) {
            window.filterTube.updateSettings(currentSettings);
            postLog('log', 'Updated seed.js with current settings');
        }

        return true;
    }

    // Try connecting to seed.js
    if (!connectToSeedGlobal()) {
        postLog('log', 'Will retry connecting to seed.js');
        setTimeout(() => {
            if (!connectToSeedGlobal()) {
                postLog('warn', 'Failed to connect to seed.js after retry');
            }
        }, 200);
    }

    // Set up additional data hooks if seed.js didn't handle them
    function setupAdditionalHooks() {
        // Hook ytInitialData if not already hooked
        const ytInitialDataDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialData');
        if (ytInitialDataDesc && ytInitialDataDesc.configurable === false) {
            postLog('warn', 'ytInitialData is non-configurable; skipping injector hook');
            return;
        }

        if (!ytInitialDataDesc?.get) {
            postLog('log', 'Setting up ytInitialData hook (seed.js backup)');

            let ytInitialDataValue = window.ytInitialData;

            if (ytInitialDataValue !== undefined) {
                postLog('log', 'ytInitialData exists, processing');

                if (settingsReceived && window.FilterTubeEngine) {
                    ytInitialDataValue = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                    window.ytInitialData = ytInitialDataValue;
                } else {
                    initialDataQueue.push({
                        name: 'ytInitialData',
                        process: () => {
                            const processed = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                            window.ytInitialData = processed;
                        }
                    });
                }
            }

            try {
                Object.defineProperty(window, 'ytInitialData', {
                    configurable: true,
                    get: () => ytInitialDataValue,
                    set: (newValue) => {
                        postLog('log', 'ytInitialData setter called (injector hook)');

                        if (settingsReceived && window.FilterTubeEngine) {
                            ytInitialDataValue = processDataWithFilterLogic(newValue, 'ytInitialData');
                        } else {
                            ytInitialDataValue = newValue;
                            initialDataQueue.push({
                                name: 'ytInitialData',
                                process: () => {
                                    ytInitialDataValue = processDataWithFilterLogic(ytInitialDataValue, 'ytInitialData');
                                }
                            });
                        }
                    }
                });
            } catch (e) {
                postLog('warn', 'Failed to install ytInitialData injector hook', e);
            }
        } else {
            postLog('log', 'ytInitialData hook already exists (seed.js handled it)');
        }
    }

    // Set up hooks
    setupAdditionalHooks();

    // Wait for FilterTubeEngine and signal readiness
    const engineCheckInterval = setInterval(() => {
        if (window.FilterTubeEngine?.processData) {
            postLog('log', 'FilterTubeEngine is now available');
            clearInterval(engineCheckInterval);

            // Process any queued data
            if (settingsReceived) {
                processInitialDataQueue();
            }

            // Signal full initialization
            window.ftInitialized = true;
            window.dispatchEvent(new CustomEvent('filterTubeReady'));

            // Signal readiness to content_bridge
            window.postMessage({
                type: 'FilterTube_InjectorToBridge_Ready',
                source: 'injector'
            }, '*');
            postLog('log', 'FilterTube fully initialized and ready');
        }
    }, 100);

    // Timeout for engine check
    setTimeout(() => {
        clearInterval(engineCheckInterval);
        if (!window.FilterTubeEngine?.processData) {
            postLog('error', 'FilterTubeEngine failed to load within timeout');
        }
    }, 5000);

    postLog('log', 'Injector.js setup complete');

})(); // End of IIFE 
