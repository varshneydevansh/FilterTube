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
        const sharedNormalizeHandleValue = window.FilterTubeIdentity?.normalizeHandleValue;
        if (typeof sharedNormalizeHandleValue === 'function') {
            const raw = typeof sharedExtractRawHandle === 'function'
                ? (sharedExtractRawHandle(value) || value || '')
                : (value || '');
            return sharedNormalizeHandleValue(raw) || '';
        }
        if (typeof sharedExtractRawHandle === 'function') {
            const extracted = sharedExtractRawHandle(value);
            if (!extracted) return '';
            const core = extracted.replace(/^@+/, '').trim();
            if (!/^[A-Za-z0-9._-]{3,60}$/.test(core) || !/[A-Za-z0-9]/.test(core)) return '';
            return `@${core.toLowerCase()}`;
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
        if (!/^[A-Za-z0-9._-]{3,60}$/.test(buffer) || !/[A-Za-z0-9]/.test(buffer)) return '';
        return `@${buffer.toLowerCase()}`;
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
        const comparableExpectedNames = Array.from(nameSet)
            .map((value) => value
                .replace(/\b(?:vevo|topic)\b/g, ' ')
                .replace(/[^a-z0-9]+/g, '')
                .trim()
            )
            .filter(Boolean);

        // If caller didn't send expectations, we must not reject results solely on that.
        const hasAny = nameSet.size > 0 || handleSet.size > 0;

        return {
            hasAny,
            nameCount: nameSet.size,
            handleCount: handleSet.size,
            matchesAny(collaborator) {
                if (!hasAny) return true;
                if (!collaborator || typeof collaborator !== 'object') return false;
                const name = normalizeLooseText(collaborator.name);
                const handle = normalizeExpectedHandle(collaborator.handle);
                const compactName = name
                    ? name
                        .replace(/\b(?:vevo|topic)\b/g, ' ')
                        .replace(/[^a-z0-9]+/g, '')
                        .trim()
                    : '';
                const fuzzyNameMatch = compactName
                    ? comparableExpectedNames.some((expected) => {
                        if (!expected) return false;
                        const minLen = Math.min(expected.length, compactName.length);
                        if (minLen < 4) return false;
                        return compactName.startsWith(expected) || expected.startsWith(compactName);
                    })
                    : false;
                return (
                    (name && nameSet.has(name)) ||
                    fuzzyNameMatch ||
                    (handle && handleSet.has(handle))
                );
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

    function scoreCollaboratorCandidate(list, matcher, depth = 0) {
        if (!Array.isArray(list) || list.length < 2) return -1;

        const hasMatch = matcher?.hasAny
            ? list.some(c => matcher.matchesAny(c))
            : true;
        if (!hasMatch) return -1;

        const matchCount = matcher?.hasAny
            ? list.reduce((count, collaborator) => count + (matcher.matchesAny(collaborator) ? 1 : 0), 0)
            : list.length;
        const matchRatio = matcher?.hasAny ? matchCount / list.length : 1;

        const idMatchCount = list.reduce((count, collaborator) => {
            if (!collaborator || typeof collaborator !== 'object') return count;
            if (collaborator.id) count += 1;
            if (collaborator.handle) count += 0.5;
            if (collaborator.customUrl) count += 0.5;
            return count;
        }, 0);

        const quality = getCollaboratorListQuality(list);
        const depthPenalty = Math.min(10, Math.max(0, depth));

        return (
            quality * 25 +
            list.length * 12 +
            idMatchCount * 8 +
            matchCount * 6 +
            matchRatio * 50 -
            depthPenalty
        );
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
            const ytLooseValid = isValidCollaboratorResponse(ytInitialDataCollaborators, null);
            const strictHandleExpectation = Boolean(matcher?.handleCount);

            if (ytValid && (!cacheValid || ytScore > collaboratorScore)) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
            } else if (!cacheValid && ytValid) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
            } else if (
                ytLooseValid &&
                !strictHandleExpectation &&
                (!cacheValid || ytScore > collaboratorScore)
            ) {
                // VideoId-anchored fallback: return the best roster even when name hints
                // are slightly mismatched (e.g. "Shakira" vs "shakiraVEVO").
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
            const { videoId, channelId, requestId, expectedHandle, expectedName } = payload || {};
            postLog('log', `Received channel info request for video/channel: ${videoId || 'n/a'} / ${channelId || 'n/a'}`);

            let channel = null;
            if (videoId) {
                channel = searchYtInitialDataForVideoChannel(videoId, {
                    expectedHandle: extractRawHandle(expectedHandle) || expectedHandle,
                    expectedName
                });
            }
            if (!channel && channelId) {
                channel = searchYtInitialDataForChannelId(channelId, {
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
                postLog('log', 'No channel info found for video/channel:', videoId || 'n/a', channelId || 'n/a');
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

        const extractListItemsFromSheetLikeCommand = (command) => {
            if (!command || typeof command !== 'object') return [];
            const candidates = [
                command?.listViewModel?.listItems,
                command?.content?.listViewModel?.listItems,
                command?.customContent?.listViewModel?.listItems,
                command?.presenterDialogViewModel?.listViewModel?.listItems,
                command?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.presenterDialogViewModel?.customContent?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.listViewModel?.listItems,
                command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.content?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel?.listViewModel?.listItems,
                command?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems,
                command?.dialog?.presenterDialogViewModel?.listViewModel?.listItems,
                command?.dialog?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.dialog?.dialogViewModel?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.presenterDialogViewModel?.customContent?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.presenterDialogViewModel?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.dialogViewModel?.customContent?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.dialogViewModel?.listViewModel?.listItems,
                command?.showDialogCommand?.dialog?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.content?.listViewModel?.listItems,
                command?.showSheetCommand?.presenterDialogViewModel?.content?.listViewModel?.listItems,
                command?.showSheetCommand?.presenterDialogViewModel?.customContent?.listViewModel?.listItems,
            ];
            for (const candidate of candidates) {
                if (Array.isArray(candidate) && candidate.length > 0) return candidate;
            }
            return [];
        };

        const extractFromSheetLikeCommand = (sheetCommand) => {
            const listItems = extractListItemsFromSheetLikeCommand(sheetCommand);
            if (!Array.isArray(listItems) || listItems.length === 0) return null;

            const collaborators = [];
            const parseCustomUrl = (value) => {
                if (!value || typeof value !== 'string') return '';
                const match = value.match(/\/(c|user)\/([^/?#]+)/);
                if (!match || !match[1] || !match[2]) return '';
                try {
                    return `${match[1]}/${decodeURIComponent(match[2])}`;
                } catch (e) {
                    return `${match[1]}/${match[2]}`;
                }
            };

            const pickBrowseEndpoint = (viewModel) => {
                if (!viewModel || typeof viewModel !== 'object') return null;
                const fromContext = (
                    viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint ||
                    viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                    viewModel?.rendererContext?.commandContext?.onTap?.browseEndpoint ||
                    null
                );
                const commandRuns = Array.isArray(viewModel?.title?.commandRuns) ? viewModel.title.commandRuns : [];
                let fromTitleRuns = null;
                for (const run of commandRuns) {
                    const browse =
                        run?.onTap?.innertubeCommand?.browseEndpoint ||
                        run?.onTap?.innertubeCommand?.command?.browseEndpoint ||
                        run?.onTap?.browseEndpoint ||
                        null;
                    if (browse) {
                        fromTitleRuns = browse;
                        break;
                    }
                }
                const normalizeUc = (value) => {
                    const raw = typeof value === 'string' ? value.trim() : '';
                    return /^UC[\w-]{22}$/i.test(raw) ? raw : '';
                };
                const contextId = normalizeUc(fromContext?.browseId || '');
                const titleId = normalizeUc(fromTitleRuns?.browseId || '');
                const idsConflict = Boolean(contextId && titleId && contextId !== titleId);
                const preferred = idsConflict ? fromContext : (fromTitleRuns || fromContext);
                if (!preferred) return null;
                return {
                    ...(fromContext || {}),
                    ...(fromTitleRuns || {}),
                    browseId: idsConflict
                        ? (fromContext?.browseId || '')
                        : (fromTitleRuns?.browseId || fromContext?.browseId || ''),
                    canonicalBaseUrl: idsConflict
                        ? (fromContext?.canonicalBaseUrl || '')
                        : (fromTitleRuns?.canonicalBaseUrl || fromContext?.canonicalBaseUrl || ''),
                    __idsConflict: idsConflict
                };
            };

            const pickMetadataUrl = (viewModel) => {
                const direct = viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url ||
                    viewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.command?.commandMetadata?.webCommandMetadata?.url ||
                    '';
                if (direct) return direct;
                const commandRuns = Array.isArray(viewModel?.title?.commandRuns) ? viewModel.title.commandRuns : [];
                for (const run of commandRuns) {
                    const candidate = run?.onTap?.innertubeCommand?.commandMetadata?.webCommandMetadata?.url ||
                        run?.onTap?.innertubeCommand?.command?.commandMetadata?.webCommandMetadata?.url ||
                        run?.onTap?.commandMetadata?.webCommandMetadata?.url ||
                        '';
                    if (candidate) return candidate;
                }
                return '';
            };

            for (const item of listItems) {
                const viewModel = item?.listItemViewModel;
                if (!viewModel) continue;

                const title = viewModel.title?.content;
                const subtitle = viewModel.subtitle?.content;
                const browseEndpoint = pickBrowseEndpoint(viewModel);

                const collab = { name: title };
                if (browseEndpoint?.canonicalBaseUrl) {
                    const extracted = extractRawHandle(browseEndpoint.canonicalBaseUrl);
                    if (extracted) collab.handle = extracted;
                }
                if (!collab.customUrl) {
                    const metadataUrl = pickMetadataUrl(viewModel);
                    const parsedCustom = parseCustomUrl(metadataUrl);
                    if (parsedCustom) collab.customUrl = parsedCustom;
                }
                if (browseEndpoint?.browseId?.startsWith('UC')) {
                    collab.id = browseEndpoint.browseId;
                }
                if (!collab.handle && subtitle) {
                    const extracted = extractRawHandle(subtitle);
                    if (extracted) collab.handle = extracted;
                }
                if (browseEndpoint?.__idsConflict && collab.id && collab.handle) {
                    collab.handle = '';
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
                const showSheetCommand = run.navigationEndpoint?.showSheetCommand;
                const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
                const sheetLikeCommand = showSheetCommand || showDialogCommand;
                if (!sheetLikeCommand) continue;

                const collaborators = extractFromSheetLikeCommand(sheetLikeCommand);
                if (collaborators) return collaborators;
            }
        }

        // Home/watch lockups can expose collaborator rosters on owner text command runs
        // even when byline-level deep scans miss the exact command payload path.
        const ownerRunsForCommands = Array.isArray(renderer.ownerText?.runs) ? renderer.ownerText.runs : [];
        for (const run of ownerRunsForCommands) {
            const ownerSheetCommand = run?.navigationEndpoint?.showDialogCommand || run?.navigationEndpoint?.showSheetCommand;
            if (!ownerSheetCommand) continue;
            const collaborators = extractFromSheetLikeCommand(ownerSheetCommand);
            if (collaborators) return collaborators;
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

        // Home/watch lockups can expose either showDialogCommand or showSheetCommand.
        // Fall back to a bounded deep scan for either command anywhere inside the renderer.
        const visited = new WeakSet();
        function deepScanForShowDialog(node, depth = 0) {
            if (!node || typeof node !== 'object' || visited.has(node) || depth > 10) return null;
            visited.add(node);

            const sheetLikeCommand = node.showSheetCommand || node.showDialogCommand;
            if (sheetLikeCommand) {
                const collaborators = extractFromSheetLikeCommand(sheetLikeCommand);
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
        const merged = { id: null, handle: null, name: null, logo: null, customUrl: null, allCollaborators: null };
        for (const candidate of candidates) {
            if (!candidate || typeof candidate !== 'object') continue;
            if (!merged.id && typeof candidate.id === 'string' && candidate.id.trim()) merged.id = candidate.id.trim();
            if (!merged.handle && typeof candidate.handle === 'string' && candidate.handle.trim()) merged.handle = candidate.handle.trim();
            if (!merged.name && typeof candidate.name === 'string' && candidate.name.trim()) merged.name = candidate.name.trim();
            if (!merged.logo && typeof candidate.logo === 'string' && candidate.logo.trim()) merged.logo = candidate.logo.trim();
            if (!merged.customUrl && typeof candidate.customUrl === 'string' && candidate.customUrl.trim()) merged.customUrl = candidate.customUrl.trim();
            if (!merged.allCollaborators && Array.isArray(candidate.allCollaborators) && candidate.allCollaborators.length > 0) {
                merged.allCollaborators = candidate.allCollaborators;
            }
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
        const isLikelyBadName = (value) => {
            if (!value || typeof value !== 'string') return true;
            const trimmed = value.trim();
            if (!trimmed) return true;
            const lower = trimmed.toLowerCase();
            if (lower.startsWith('@')) return true;
            if (/^uc[\w-]{22}$/i.test(trimmed)) return true;
            if (trimmed.includes('•')) return true;
            if (/\bviews?\b/i.test(trimmed)) return true;
            if (/\bago\b/i.test(trimmed)) return true;
            if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
            if (/\band\s+\d+\s+more\b/i.test(trimmed) || /\band\s+more\b/i.test(trimmed)) return true;
            if (/^\s*mix\b/i.test(trimmed)) return true;
            if (trimmed.toLowerCase() === 'channel') return true;
            return false;
        };
        const extractChannelThumbnailA11yName = (node) => {
            if (!node || typeof node !== 'object') return '';
            const rawLabel =
                node?.channelThumbnail?.channelThumbnailWithLinkRenderer?.accessibility?.accessibilityData?.label ||
                node?.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.accessibility?.accessibilityData?.label ||
                '';
            if (typeof rawLabel !== 'string' || !rawLabel.trim()) return '';
            const cleaned = rawLabel.replace(/^go to channel\s+/i, '').trim();
            if (!cleaned || isLikelyBadName(cleaned)) return '';
            return cleaned;
        };
        const pickPreferredName = (node, baseName) => {
            const cleanedBase = (typeof baseName === 'string' && !isLikelyBadName(baseName))
                ? baseName.trim()
                : '';
            const a11yName = extractChannelThumbnailA11yName(node);
            if (a11yName && /\s-\sTopic$/i.test(a11yName) && !/\s-\sTopic$/i.test(cleanedBase || '')) {
                return a11yName;
            }
            return cleanedBase || a11yName || '';
        };

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

            const extractOwnerCommandCollaborators = (command) => {
                if (!command || typeof command !== 'object') return null;
                const visited = new WeakSet();
                const collectCommands = (root, depth = 0) => {
                    if (!root || typeof root !== 'object' || depth > 12 || visited.has(root)) return [];
                    visited.add(root);

                    const nested = [
                        root,
                        root?.showDialogCommand,
                        root?.showSheetCommand,
                        root?.command,
                        root?.command?.showDialogCommand,
                        root?.command?.showSheetCommand,
                        root?.command?.dialog?.presenterDialogViewModel,
                        root?.command?.dialog?.dialogViewModel,
                        root?.command?.dialog?.listViewModel,
                        root?.dialog?.presenterDialogViewModel,
                        root?.dialog?.dialogViewModel,
                        root?.dialog?.listViewModel,
                        root?.showDialogCommand?.dialog?.presenterDialogViewModel,
                        root?.showDialogCommand?.dialog?.dialogViewModel,
                        root?.showDialogCommand?.dialog?.listViewModel,
                        root?.showSheetCommand?.dialog?.presenterDialogViewModel,
                        root?.showDialogCommand?.dialog?.dialogViewModel,
                        root?.showSheetCommand?.dialog?.dialogViewModel,
                        root?.showDialogCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                        root?.showSheetCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                        root?.showDialogCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel,
                        root?.showDialogCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel,
                        root?.showSheetCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel,
                        root?.showSheetCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel,
                        root?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.dialogViewModel,
                        root?.showDialogCommand?.showDialogCommand,
                        root?.showDialogCommand?.showSheetCommand,
                        root?.showSheetCommand?.showDialogCommand,
                        root?.showSheetCommand?.showSheetCommand,
                        root?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                        root?.panelLoadingStrategy?.inlineContent?.sheetViewModel,
                        root?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel,
                        root?.panelLoadingStrategy?.inlineContent?.sheetViewModel?.presenterDialogViewModel,
                        root?.presenterDialogViewModel,
                        root?.content,
                        root?.customContent
                    ];

                    const candidates = [];
                    for (const child of nested) {
                        if (!child || typeof child !== 'object') continue;
                        const children = collectCommands(child, depth + 1);
                        for (const collected of children) {
                            candidates.push(collected);
                        }
                    }
                    return [root, ...candidates];
                };

                const commandCandidates = collectCommands(command);
                for (const candidateCommand of commandCandidates) {
                    const collaborators = extractFromSheetLikeCommand(candidateCommand);
                    if (Array.isArray(collaborators) && collaborators.length > 0) return collaborators;
                }
                return null;
            };

            const looksLikeCollapsedByline = (value) => {
                if (!value || typeof value !== 'string') return false;
                const trimmed = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
                if (!trimmed) return false;
                if (trimmed.includes('•')) return true;
                if (/,/.test(trimmed)) return true;
                if (/\band\s+\d+\s+more\b/i.test(trimmed) || /\band\s+more\b/i.test(trimmed)) return true;
                return false;
            };

            const ownerNavCommands = [
                ownerRenderer?.navigationEndpoint,
                ownerRenderer?.navigationEndpoint?.command,
                ownerRenderer?.navigationEndpoint?.showDialogCommand,
                ownerRenderer?.navigationEndpoint?.showSheetCommand,
                ownerRenderer?.navigationEndpoint?.command?.showDialogCommand,
                ownerRenderer?.navigationEndpoint?.command?.showSheetCommand,
                ownerRenderer?.navigationEndpoint?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.dialog?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.dialog?.listViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.showDialogCommand,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.showSheetCommand,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.showDialogCommand,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.showSheetCommand,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.dialog?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.dialog?.listViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.dialog?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.dialog?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.dialog?.listViewModel,
                ownerRenderer?.navigationEndpoint?.command?.showDialogCommand?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.command?.dialog?.presenterDialogViewModel,
                ownerRenderer?.navigationEndpoint?.command?.dialog?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.command?.dialog?.listViewModel,
                ownerRenderer?.navigationEndpoint?.command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.command?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel,
                ownerRenderer?.navigationEndpoint?.command?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel,
                ownerRenderer?.navigationEndpoint?.showDialogCommand?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel,
                ownerRenderer?.navigationEndpoint?.showSheetCommand?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
            ];

            let allCollaborators = [];
            for (const ownerNavCommand of ownerNavCommands) {
                if (!ownerNavCommand) continue;
                const directFromOwnerCommand = extractOwnerCommandCollaborators(ownerNavCommand);
                if (Array.isArray(directFromOwnerCommand) && directFromOwnerCommand.length > 0) {
                    allCollaborators = directFromOwnerCommand;
                    break;
                }
            }

            if (!allCollaborators.length) {
                const allRuns = [
                    ...(Array.isArray(ownerRenderer?.title?.runs) ? ownerRenderer.title.runs : []),
                    ...(Array.isArray(ownerRenderer?.shortBylineText?.runs) ? ownerRenderer.shortBylineText.runs : [])
                ];
                for (const run of allRuns) {
                    const command = run?.navigationEndpoint?.showDialogCommand
                        || run?.navigationEndpoint?.showSheetCommand
                        || run?.navigationEndpoint
                        || run?.navigationEndpoint?.command?.showDialogCommand
                        || run?.navigationEndpoint?.command?.showSheetCommand
                        || run?.navigationEndpoint?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.dialog?.listViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.dialog?.listViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.showDialogCommand?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.showDialogCommand?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.listViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.presenterDialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.dialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.dialog?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel
                        || run?.navigationEndpoint?.showDialogCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel
                        || run?.navigationEndpoint?.showSheetCommand?.panelLoadingStrategy?.inlineContent?.sheetViewModel;
                    if (!command) continue;
                    const fromRunCommand = extractOwnerCommandCollaborators(command);
                    if (Array.isArray(fromRunCommand) && fromRunCommand.length > 0) {
                        allCollaborators = fromRunCommand;
                        break;
                    }
                }
            }

            const endpoint =
                ownerRenderer?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                ownerRenderer?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint ||
                null;
            const browseId = endpoint?.browseId || '';
            const canonicalBaseUrl = endpoint?.canonicalBaseUrl || '';
            const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || null) : null;
            const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || null) : null;
            const rawName = ownerRenderer?.title?.runs?.[0]?.text || ownerRenderer?.title?.simpleText || ownerRenderer?.shortBylineText?.runs?.[0]?.text || '';
            const name = (typeof rawName === 'string' && !isLikelyBadName(rawName)) ? rawName.trim() : '';
            const logo = extractChannelLogoFromObject(ownerRenderer) || '';
            const candidate = {
                id: (browseId && typeof browseId === 'string' && browseId.startsWith('UC')) ? browseId : null,
                handle: handle || null,
                name: name || null,
                logo: logo || null,
                customUrl: customUrl || null,
                allCollaborators: Array.isArray(allCollaborators) ? allCollaborators : null
            };

            const candidateNameIsCollapsed = looksLikeCollapsedByline(candidate.name);
            if ((!candidate.name || candidateNameIsCollapsed) && Array.isArray(candidate.allCollaborators) && candidate.allCollaborators.length > 0) {
                const firstCollaboratorName = (candidate.allCollaborators[0]?.name || '').trim();
                if (firstCollaboratorName && !looksLikeCollapsedByline(firstCollaboratorName) && !isLikelyBadName(firstCollaboratorName)) {
                    candidate.name = firstCollaboratorName;
                }
            }

            if (!candidate.id && !candidate.handle && !candidate.name && !candidate.logo && !candidate.customUrl) {
                if (Array.isArray(candidate.allCollaborators) && candidate.allCollaborators.length > 0 && candidate.allCollaborators[0]?.name) {
                    candidate.name = candidate.allCollaborators[0].name;
                }
            }

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
            if (!isCurrentWatchVideo) return null;

            const watchOwnerRoots = [];
            if (window.ytInitialData) {
                watchOwnerRoots.push({ root: window.ytInitialData, label: 'ytInitialData' });
            }
            if (window.filterTube?.lastYtInitialData) {
                watchOwnerRoots.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
            }
            if (window.filterTube?.rawYtInitialData) {
                watchOwnerRoots.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
            }
            if (window.filterTube?.lastYtNextResponse) {
                watchOwnerRoots.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
            }
            const watchPlayerRoot = window.filterTube?.lastYtPlayerResponse || window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse;
            if (watchPlayerRoot) {
                watchOwnerRoots.push({ root: watchPlayerRoot, label: 'filterTube.watchPlayerRoot' });
            } else if (window.ytInitialPlayerResponse) {
                watchOwnerRoots.push({ root: window.ytInitialPlayerResponse, label: 'ytInitialPlayerResponse' });
            }

            const scanWithLog = (root, rootLabel) => {
                if (!root || typeof root !== 'object') return null;
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
                const found = scan(root);
                if (found) {
                    postLog('log', `Watch owner candidate found in ${rootLabel}`);
                }
                return found;
            };

            for (const target of watchOwnerRoots) {
                const found = scanWithLog(target.root, target.label);
                if (found) return found;
            }

            return null;
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
                    const name = pickPreferredName(
                        node,
                        (node.shortBylineText?.runs?.[0]?.text) || (node.longBylineText?.runs?.[0]?.text) || ''
                    ) || undefined;

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
                        const runOwnerCandidate = run?.navigationEndpoint
                            ? extractOwnerCandidate({ navigationEndpoint: run.navigationEndpoint })
                            : null;
                        if (
                            runOwnerCandidate &&
                            (
                                runOwnerCandidate.id ||
                                runOwnerCandidate.handle ||
                                runOwnerCandidate.customUrl ||
                                runOwnerCandidate.allCollaborators?.length > 0 ||
                                runOwnerCandidate.name
                            )
                        ) {
                            if (!hasExpectations || matchesExpectations(runOwnerCandidate)) {
                                return runOwnerCandidate;
                            }
                            if (!fallbackCandidate) {
                                fallbackCandidate = runOwnerCandidate;
                            }
                        }

                        const browse = run?.navigationEndpoint?.browseEndpoint;
                        if (!browse) continue;

                        const browseId = browse.browseId;
                        const canonicalBaseUrl = browse.canonicalBaseUrl;
                        const name = pickPreferredName(node, run.text);

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

                const channelThumbnailRenderer =
                    node?.channelThumbnail?.channelThumbnailWithLinkRenderer ||
                    node?.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer ||
                    null;
                if (channelThumbnailRenderer) {
                    const nav = channelThumbnailRenderer?.navigationEndpoint || {};
                    const browse = nav?.browseEndpoint || null;
                    const browseId = (typeof browse?.browseId === 'string' && browse.browseId.startsWith('UC'))
                        ? browse.browseId
                        : '';
                    const canonicalBaseUrl = browse?.canonicalBaseUrl || nav?.commandMetadata?.webCommandMetadata?.url || '';
                    const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || null) : null;
                    const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || null) : null;
                    const a11yLabel = channelThumbnailRenderer?.accessibility?.accessibilityData?.label || '';
                    const rawA11yName = (typeof a11yLabel === 'string' && a11yLabel.trim())
                        ? a11yLabel.replace(/^go to channel\s+/i, '').trim()
                        : '';
                    const name = (!rawA11yName || isLikelyBadName(rawA11yName)) ? null : rawA11yName;
                    const logo = extractChannelLogoFromObject(channelThumbnailRenderer) || null;
                    if (browseId || handle || customUrl) {
                        const candidate = mergeChannelCandidates({
                            id: browseId || null,
                            handle: handle || null,
                            customUrl: customUrl || null,
                            name: name || null,
                            logo: logo || null
                        });
                        if (candidate) {
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
            const ftPlayer = window.filterTube?.lastYtPlayerResponse ||
                window.filterTube?.lastYtInitialPlayerResponse ||
                window.filterTube?.rawYtInitialPlayerResponse ||
                window.ytInitialPlayerResponse;
            const extracted = extractFromPlayerResponse(ftPlayer);
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

    function searchYtInitialDataForChannelId(channelId, expectations = {}) {
        const normalizeUc = (value) => {
            const raw = typeof value === 'string' ? value.trim() : '';
            return /^UC[\w-]{22}$/i.test(raw) ? raw : '';
        };
        const targetId = normalizeUc(channelId);
        if (!targetId) return null;

        const options = (expectations && typeof expectations === 'object') ? expectations : {};
        const normalizedExpectedHandle = typeof options.expectedHandle === 'string'
            ? (extractRawHandle(options.expectedHandle) || options.expectedHandle).trim().toLowerCase()
            : '';
        const normalizedExpectedName = normalizeChannelName(options.expectedName);
        const hasExpectations = Boolean(normalizedExpectedHandle || normalizedExpectedName);

        const isLikelyBadName = (value) => {
            if (!value || typeof value !== 'string') return true;
            const trimmed = value.trim();
            if (!trimmed) return true;
            const lower = trimmed.toLowerCase();
            if (lower.startsWith('@')) return true;
            if (/^uc[\w-]{22}$/i.test(trimmed)) return true;
            if (/\band\s+\d+\s+more\b/i.test(trimmed)) return true;
            if (/^like\s+this\s+video\??$/i.test(trimmed)) return true;
            if (/^\s*channel\s*$/i.test(trimmed)) return true;
            if (/\bsubscribers?\b/i.test(trimmed)) return true;
            if (/\bviews?\b/i.test(trimmed)) return true;
            if (/\bago\b/i.test(trimmed)) return true;
            if (/^\s*mix\b/i.test(trimmed)) return true;
            if (/\s[-–]\s/.test(trimmed) && /\bmix\b/i.test(trimmed)) return true;
            if (trimmed.includes('•')) return true;
            return false;
        };

        const normalizeCandidate = (candidate) => {
            if (!candidate || typeof candidate !== 'object') return null;
            const id = normalizeUc(candidate.id || '') || targetId;
            const handle = typeof candidate.handle === 'string'
                ? (extractRawHandle(candidate.handle) || '').trim().toLowerCase()
                : '';
            const customUrl = typeof candidate.customUrl === 'string' ? candidate.customUrl.trim() : '';
            const nameRaw = typeof candidate.name === 'string' ? candidate.name.trim() : '';
            const name = (!nameRaw || isLikelyBadName(nameRaw)) ? '' : nameRaw;
            const logo = typeof candidate.logo === 'string' ? candidate.logo.trim() : '';
            if (!id && !handle && !customUrl && !name && !logo) return null;
            return {
                id: id || targetId,
                handle: handle || null,
                customUrl: customUrl || null,
                name: name || null,
                logo: logo || null
            };
        };

        const matchesExpectations = (candidate) => {
            if (!candidate) return false;
            if (!hasExpectations) return true;
            if (normalizedExpectedHandle) {
                const candidateHandle = candidate.handle ? candidate.handle.toLowerCase() : '';
                if (candidateHandle && candidateHandle !== normalizedExpectedHandle) {
                    return false;
                }
            }
            if (normalizedExpectedName) {
                const candidateName = normalizeChannelName(candidate.name);
                if (candidateName && candidateName !== normalizedExpectedName) {
                    return false;
                }
            }
            return true;
        };

        const candidateScore = (candidate, matched) => {
            if (!candidate) return -1;
            let score = 0;
            if (candidate.id) score += 6;
            if (candidate.handle) score += 4;
            if (candidate.customUrl) score += 2;
            if (candidate.name) score += 3;
            if (candidate.logo) score += 1;
            if (matched) score += 5;
            return score;
        };

        const extractCandidateFromNode = (node) => {
            if (!node || typeof node !== 'object') return null;
            const endpointCandidates = [
                node?.browseEndpoint,
                node?.navigationEndpoint?.browseEndpoint,
                node?.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint,
                node?.command?.browseEndpoint,
                node?.onTap?.innertubeCommand?.browseEndpoint
            ].filter(Boolean);

            let matchedEndpoint = null;
            for (const endpoint of endpointCandidates) {
                const browseId = normalizeUc(endpoint?.browseId || '');
                if (browseId && browseId.toLowerCase() === targetId.toLowerCase()) {
                    matchedEndpoint = endpoint;
                    break;
                }
            }

            const directId = normalizeUc(node?.browseId || node?.channelId || node?.externalChannelId || node?.ownerChannelId || node?.ownerDocid || node?.externalId || '');
            const hasIdMatch = Boolean(
                (directId && directId.toLowerCase() === targetId.toLowerCase()) ||
                matchedEndpoint
            );
            if (!hasIdMatch) return null;

            const canonicalBaseUrl = (
                matchedEndpoint?.canonicalBaseUrl ||
                node?.canonicalBaseUrl ||
                node?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url ||
                node?.commandMetadata?.webCommandMetadata?.url ||
                node?.webCommandMetadata?.url ||
                ''
            );

            const handle = canonicalBaseUrl ? (extractRawHandle(canonicalBaseUrl) || '') : '';
            const customUrl = canonicalBaseUrl ? (extractCustomUrlFromCanonicalBaseUrl(canonicalBaseUrl) || '') : '';
            const nameCandidates = [
                node?.shortBylineText?.runs?.[0]?.text,
                node?.longBylineText?.runs?.[0]?.text,
                node?.ownerText?.runs?.[0]?.text,
                node?.slimOwnerRenderer?.title?.runs?.[0]?.text,
                node?.videoOwnerRenderer?.title?.runs?.[0]?.text,
                node?.channelMetadataRenderer?.title,
                node?.metadata?.channelMetadataRenderer?.title,
                node?.listItemViewModel?.title?.content,
                node?.subtitle?.content,
                (() => {
                    const raw =
                        node?.channelThumbnail?.channelThumbnailWithLinkRenderer?.accessibility?.accessibilityData?.label ||
                        node?.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.accessibility?.accessibilityData?.label ||
                        '';
                    if (typeof raw !== 'string' || !raw.trim()) return '';
                    return raw.replace(/^go to channel\s+/i, '').trim();
                })()
            ];
            const name = nameCandidates.find((value) => {
                return typeof value === 'string' && value.trim() && !isLikelyBadName(value);
            }) || '';
            const logo = extractChannelLogoFromObject(node) || '';

            return normalizeCandidate({
                id: targetId,
                handle,
                customUrl,
                name,
                logo
            });
        };

        const roots = [];
        if (window.ytInitialData) roots.push({ root: window.ytInitialData, label: 'ytInitialData' });
        if (window.filterTube?.lastYtInitialData) roots.push({ root: window.filterTube.lastYtInitialData, label: 'filterTube.lastYtInitialData' });
        if (window.filterTube?.rawYtInitialData) roots.push({ root: window.filterTube.rawYtInitialData, label: 'filterTube.rawYtInitialData' });
        if (window.filterTube?.lastYtNextResponse) roots.push({ root: window.filterTube.lastYtNextResponse, label: 'filterTube.lastYtNextResponse' });
        if (window.filterTube?.lastYtBrowseResponse) roots.push({ root: window.filterTube.lastYtBrowseResponse, label: 'filterTube.lastYtBrowseResponse' });
        if (window.filterTube?.lastYtPlayerResponse) roots.push({ root: window.filterTube.lastYtPlayerResponse, label: 'filterTube.lastYtPlayerResponse' });
        const ftPlayer = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse || window.ytInitialPlayerResponse;
        if (ftPlayer) roots.push({ root: ftPlayer, label: 'playerResponse' });
        if (roots.length === 0) return null;

        let bestMatched = null;
        let bestMatchedScore = -1;
        let bestFallback = null;
        let bestFallbackScore = -1;

        for (const target of roots) {
            const visited = new WeakSet();
            const scan = (node, depth = 0) => {
                if (!node || typeof node !== 'object' || visited.has(node) || depth > 14) return;
                visited.add(node);

                const candidate = extractCandidateFromNode(node);
                if (candidate) {
                    const matched = matchesExpectations(candidate);
                    const score = candidateScore(candidate, matched);
                    if (matched && score > bestMatchedScore) {
                        bestMatched = candidate;
                        bestMatchedScore = score;
                    } else if (!matched && score > bestFallbackScore) {
                        bestFallback = candidate;
                        bestFallbackScore = score;
                    }
                }

                if (Array.isArray(node)) {
                    for (const child of node) scan(child, depth + 1);
                    return;
                }
                for (const key in node) {
                    if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
                    const value = node[key];
                    if (!value || typeof value !== 'object') continue;
                    scan(value, depth + 1);
                }
            };
            scan(target.root, 0);
        }

        if (bestMatched) {
            postLog('log', `Channel-id lookup matched for ${targetId}:`, bestMatched);
            return bestMatched;
        }
        if (bestFallback) {
            postLog('log', `Channel-id lookup fallback for ${targetId}:`, bestFallback);
            return bestFallback;
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

        let bestMatched = null;
        let bestMatchedScore = -1;
        let bestMatchedDepth = Infinity;
        let bestFallback = null;
        let bestFallbackScore = -1;
        let bestFallbackDepth = Infinity;

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
        if (window.filterTube?.lastYtPlayerResponse) {
            roots.push({ root: window.filterTube.lastYtPlayerResponse, label: 'filterTube.lastYtPlayerResponse' });
        }
        const playerRoot = window.filterTube?.lastYtInitialPlayerResponse || window.filterTube?.rawYtInitialPlayerResponse || window.ytInitialPlayerResponse;
        if (playerRoot) {
            roots.push({ root: playerRoot, label: 'filterTube.playerResponse' });
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
                if (!obj || typeof obj !== 'object' || visited.has(obj) || depth > 20) return;
                visited.add(obj);

                const nodeVideoId = extractVideoIdFromNode(obj);
                if (nodeVideoId === videoId) {
                    const extracted = extractCollaboratorsFromDataObject(obj);
                    if (Array.isArray(extracted) && extracted.length > 0) {
                        const isMatch = matcher?.hasAny
                            ? extracted.some(candidate => matcher.matchesAny(candidate))
                            : false;
                        const score = scoreCollaboratorCandidate(extracted, matcher, depth);

                        // First-class candidate: matches expected identity signals (when available)
                        if (isMatch) {
                            if (score > bestMatchedScore || (score === bestMatchedScore && depth < bestMatchedDepth)) {
                                bestMatchedScore = score;
                                bestMatchedDepth = depth;
                                bestMatched = extracted;
                            }
                        } else if (isValidCollaboratorResponse(extracted, null)) {
                            // Secondary candidate: valid roster that does not match expected signals yet.
                            const fallbackScore = scoreCollaboratorCandidate(extracted, null, depth);
                            if (fallbackScore > bestFallbackScore || (fallbackScore === bestFallbackScore && depth < bestFallbackDepth)) {
                                bestFallbackScore = fallbackScore;
                                bestFallbackDepth = depth;
                                bestFallback = extracted;
                            }
                        }
                    }
                }

                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                    const value = obj[key];
                    if (!value || typeof value !== 'object') continue;
                    if (Array.isArray(value)) {
                        for (let i = 0; i < value.length; i++) {
                            searchObject(value[i], depth + 1);
                        }
                    } else {
                        searchObject(value, depth + 1);
                    }
                }
            }

            searchObject(target.root);
        }

        if (bestMatched) {
            postLog('log', `✅ Found collaborators for ${videoId} via matched roster`);
            return bestMatched;
        }

        if (bestFallback) {
            postLog('log', `⚠️ Found collaborators for ${videoId} via fallback roster`);
            return bestFallback;
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
            const wrapper = baseElement.closest(
                'ytd-rich-item-renderer, ' +
                'ytd-grid-video-renderer, ' +
                'ytd-compact-video-renderer, ' +
                'ytd-playlist-video-renderer, ' +
                'ytd-playlist-panel-video-renderer, ' +
                'ytd-playlist-panel-video-wrapper-renderer, ' +
                'ytm-playlist-panel-video-renderer, ' +
                'ytm-playlist-panel-video-wrapper-renderer, ' +
                'ytd-video-renderer'
            );
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

        // Watch-page fallback: selected playlist row and owner metadata often keep the
        // collaborator dialog command when card-level stamps are incomplete during SPA swaps.
        try {
            const currentVideoId = (() => {
                try {
                    const params = new URLSearchParams(window.location?.search || '');
                    return params.get('v') || '';
                } catch (err) {
                    return '';
                }
            })();
            if (currentVideoId && currentVideoId === videoId) {
                const watchCandidates = document.querySelectorAll(
                    'ytd-watch-metadata, ' +
                    'ytd-video-owner-renderer, ' +
                    'ytd-playlist-panel-video-renderer[selected], ' +
                    'ytd-playlist-panel-video-wrapper-renderer[selected] ytd-playlist-panel-video-renderer'
                );
                for (const node of Array.from(watchCandidates).slice(0, 8)) {
                    if (node && !candidates.includes(node)) {
                        candidates.push(node);
                    }
                }
            }
        } catch (e) {
            // ignore
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
