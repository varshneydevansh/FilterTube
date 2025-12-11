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

            // First check cache (for dynamically loaded videos)
            let collaboratorInfo = collaboratorCache.get(videoId);
            let collaboratorScore = getCollaboratorListQuality(collaboratorInfo);

            // If not in cache, or ytInitialData has richer data, search ytInitialData
            const ytInitialDataCollaborators = searchYtInitialDataForCollaborators(videoId);
            const ytScore = getCollaboratorListQuality(ytInitialDataCollaborators);
            if (ytScore > collaboratorScore) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
            } else if (!collaboratorInfo && Array.isArray(ytInitialDataCollaborators)) {
                collaboratorInfo = cacheCollaboratorsIfBetter(videoId, ytInitialDataCollaborators);
                collaboratorScore = ytScore;
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
            const { videoId, requestId } = payload || {};
            postLog('log', `Received channel info request for video: ${videoId}`);

            let channel = null;
            if (videoId) {
                channel = searchYtInitialDataForVideoChannel(videoId);
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

        let renderer = obj;
        if (renderer.content?.videoRenderer) {
            renderer = renderer.content.videoRenderer;
        } else if (renderer.richItemRenderer?.content?.videoRenderer) {
            renderer = renderer.richItemRenderer.content.videoRenderer;
        } else if (renderer.gridVideoRenderer) {
            renderer = renderer.gridVideoRenderer;
        } else if (renderer.playlistVideoRenderer) {
            renderer = renderer.playlistVideoRenderer;
        } else if (renderer.videoRenderer) {
            renderer = renderer.videoRenderer;
        } else if (renderer.data?.content?.videoRenderer) {
            renderer = renderer.data.content.videoRenderer;
        }

        if (!renderer || typeof renderer !== 'object') return null;

        const bylineText = renderer.shortBylineText || renderer.longBylineText;
        if (bylineText?.runs) {
            for (const run of bylineText.runs) {
                const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
                if (!showDialogCommand) continue;

                const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;
                if (!Array.isArray(listItems) || listItems.length === 0) continue;

                const collaborators = [];
                for (const item of listItems) {
                    const viewModel = item.listItemViewModel;
                    if (!viewModel) continue;

                    const title = viewModel.title?.content;
                    const subtitle = viewModel.subtitle?.content;
                    const browseEndpoint = viewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;

                    const collab = { name: title };
                    if (browseEndpoint?.canonicalBaseUrl) {
                        const handleMatch = browseEndpoint.canonicalBaseUrl.match(/@([\w.-]+)/);
                        if (handleMatch) {
                            collab.handle = `@${handleMatch[1]}`;
                        }
                    }
                    if (!collab.handle && subtitle) {
                        const handleMatch = subtitle.match(/@([\w.-]+)/);
                        if (handleMatch) {
                            collab.handle = `@${handleMatch[1]}`;
                        }
                    }
                    if (browseEndpoint?.browseId?.startsWith('UC')) {
                        collab.id = browseEndpoint.browseId;
                    }

                    if (collab.handle || collab.id || collab.name) {
                        collaborators.push(collab);
                    }
                }

                if (collaborators.length > 0) {
                    return collaborators;
                }
            }
        }

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
                    const handleMatch = browseEndpoint.canonicalBaseUrl.match(/@([\w.-]+)/);
                    if (handleMatch) {
                        fallback.handle = `@${handleMatch[1]}`;
                    }
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
    function searchYtInitialDataForVideoChannel(videoId) {
        if (!videoId) {
            postLog('log', 'Channel search skipped - missing videoId');
            return null;
        }

        if (!window.ytInitialData) {
            postLog('log', 'Channel search skipped - ytInitialData not available');
            return null;
        }

        postLog('log', `Searching ytInitialData for channel of video: ${videoId}`);

        let foundVideoObject = false;
        const visited = new WeakSet();

        function searchObject(obj, path) {
            if (!obj || typeof obj !== 'object' || visited.has(obj)) return null;
            visited.add(obj);

            // Direct hit: object with our videoId
            if (obj.videoId === videoId) {
                foundVideoObject = true;

                // Priority 1: navigationEndpoint.browseEndpoint on the video renderer
                const nav = obj.navigationEndpoint && obj.navigationEndpoint.browseEndpoint;
                if (nav) {
                    const browseId = nav.browseId;
                    const canonicalBaseUrl = nav.canonicalBaseUrl;
                    const name = (obj.shortBylineText?.runs?.[0]?.text) || (obj.longBylineText?.runs?.[0]?.text) || undefined;

                    if (canonicalBaseUrl) {
                        const handleMatch = canonicalBaseUrl.match(/@([\w.-]+)/);
                        const handle = handleMatch ? `@${handleMatch[1]}` : null;
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
                const byline = obj.shortBylineText || obj.longBylineText;
                if (byline?.runs) {
                    for (const run of byline.runs) {
                        const browseEndpoint = run.navigationEndpoint?.browseEndpoint;
                        if (!browseEndpoint) continue;

                        const browseId = browseEndpoint.browseId;
                        const canonicalBaseUrl = browseEndpoint.canonicalBaseUrl;
                        const name = run.text;

                        if (canonicalBaseUrl) {
                            const handleMatch = canonicalBaseUrl.match(/@([\w.-]+)/);
                            const handle = handleMatch ? `@${handleMatch[1]}` : null;
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
                }
            }

            // Recurse
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    const result = searchObject(obj[i], `${path}[${i}]`);
                    if (result) return result;
                }
            } else {
                for (const key in obj) {
                    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
                    const value = obj[key];
                    if (!value || typeof value !== 'object') continue;
                    const result = searchObject(value, `${path}.${key}`);
                    if (result) return result;
                }
            }

            return null;
        }

        const result = searchObject(window.ytInitialData, 'root');

        if (!foundVideoObject) {
            postLog('log', `Channel search: video ID not found in ytInitialData: ${videoId}`);
        } else if (!result) {
            postLog('log', `Channel search: video found but no channel info extracted for: ${videoId}`);
        }

        return result;
    }

    /**
     * Hybrid search for collaborator info (global cache + DOM hydration)
     * @param {string} videoId
     * @returns {Array|null}
     */
    function searchYtInitialDataForCollaborators(videoId) {
        if (!videoId) {
            postLog('log', 'Collaborator search skipped - missing videoId');
            return null;
        }

        postLog('log', `Searching collaborators for ${videoId}...`);

        let result = null;
        if (window.ytInitialData) {
            const visited = new WeakSet();
            function searchObject(obj, depth = 0) {
                if (!obj || typeof obj !== 'object' || visited.has(obj) || depth > 12) return null;
                visited.add(obj);

                if (obj.videoId === videoId) {
                    const extracted = extractCollaboratorsFromDataObject(obj);
                    if (Array.isArray(extracted) && extracted.length > 0) {
                        postLog('log', '✅ Found collaborators via global ytInitialData');
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

            result = searchObject(window.ytInitialData);
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
        } else {
            postLog('warn', `❌ Could not find DOM element for ${videoId}`);
        }

        const attemptExtraction = (element, label) => {
            if (!element) return null;
            const dataCandidates = [
                element.data,
                element.__data?.data,
                element.__data?.item,
                element.__data
            ];
            for (const candidate of dataCandidates) {
                const extracted = extractCollaboratorsFromDataObject(candidate);
                if (Array.isArray(extracted) && extracted.length > 0) {
                    postLog('log', `✅ Hydrated collaborators from ${label} .data`);
                    return extracted;
                }
            }
            return null;
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
        if (!Object.getOwnPropertyDescriptor(window, 'ytInitialData')?.get) {
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