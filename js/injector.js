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

    // Listen for settings from content_bridge
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
            if (videoId && collaborators && Array.isArray(collaborators)) {
                collaboratorCache.set(videoId, collaborators);
                postLog('log', `📥 Cached collaboration data for video: ${videoId}, collaborators: ${collaborators.length}`);
            }
        }

        // Handle collaborator info request from content_bridge (Isolated World)
        if (type === 'FilterTube_RequestCollaboratorInfo' && source === 'content_bridge') {
            const { videoId, requestId } = payload;
            postLog('log', `Received collaborator info request for video: ${videoId}`);

            // First check cache (for dynamically loaded videos)
            let collaboratorInfo = collaboratorCache.get(videoId);

            // If not in cache, search ytInitialData (for initial page load videos)
            if (!collaboratorInfo) {
                collaboratorInfo = searchYtInitialDataForCollaborators(videoId);
            }

            // Send response back to content_bridge
            window.postMessage({
                type: 'FilterTube_CollaboratorInfoResponse',
                payload: {
                    videoId,
                    requestId,
                    collaborators: collaboratorInfo
                },
                source: 'injector'
            }, '*');

            postLog('log', `Sent collaborator info response:`, collaboratorInfo?.length || 0, 'collaborators');
        }
    });

    /**
     * Search ytInitialData for collaborator info for a specific video
     * @param {string} videoId - The YouTube video ID to search for
     * @returns {Array|null} - Array of collaborator objects or null
     */
    function searchYtInitialDataForCollaborators(videoId) {
        if (!window.ytInitialData || !videoId) {
            postLog('log', 'ytInitialData search skipped - no data or videoId');
            return null;
        }

        postLog('log', 'Searching ytInitialData for video collaborators:', videoId);

        // Recursively search for video ID and extract collaborator info
        function searchObject(obj, path = '') {
            if (!obj || typeof obj !== 'object') return null;

            // Check if this object contains our video ID
            if (obj.videoId === videoId) {
                postLog('log', 'Found video object at path:', path);

                // Check for collaboration video (showDialogCommand in byline)
                const bylineText = obj.shortBylineText || obj.longBylineText;
                if (bylineText?.runs) {
                    for (const run of bylineText.runs) {
                        const showDialogCommand = run.navigationEndpoint?.showDialogCommand;
                        if (showDialogCommand) {
                            postLog('log', 'Detected COLLABORATION video via showDialogCommand');

                            // Extract all collaborating channels from listItems
                            const listItems = showDialogCommand?.panelLoadingStrategy?.inlineContent?.dialogViewModel?.customContent?.listViewModel?.listItems;

                            if (listItems && Array.isArray(listItems)) {
                                const collaborators = [];

                                for (const item of listItems) {
                                    const listItemViewModel = item.listItemViewModel;
                                    if (listItemViewModel) {
                                        const browseEndpoint = listItemViewModel.rendererContext?.commandContext?.onTap?.innertubeCommand?.browseEndpoint;
                                        const title = listItemViewModel.title?.content;
                                        const subtitle = listItemViewModel.subtitle?.content;

                                        let channelInfo = { name: title };

                                        // Extract handle from canonicalBaseUrl first
                                        if (browseEndpoint?.canonicalBaseUrl) {
                                            const handleMatch = browseEndpoint.canonicalBaseUrl.match(/@([\w-]+)/);
                                            if (handleMatch) {
                                                channelInfo.handle = `@${handleMatch[1]}`;
                                            }
                                        }

                                        // Fallback: Extract handle from subtitle (format: "‎⁨@fern-tv⁩ • ⁨42.7 lakh subscribers⁩")
                                        if (!channelInfo.handle && subtitle) {
                                            const handleMatch = subtitle.match(/@([\w-]+)/);
                                            if (handleMatch) {
                                                channelInfo.handle = `@${handleMatch[1]}`;
                                            }
                                        }

                                        // Extract UC ID from browseId
                                        if (browseEndpoint?.browseId?.startsWith('UC')) {
                                            channelInfo.id = browseEndpoint.browseId;
                                        }

                                        if (channelInfo.handle || channelInfo.id || channelInfo.name) {
                                            collaborators.push(channelInfo);
                                            postLog('log', 'Extracted collaborator:', channelInfo);
                                        }
                                    }
                                }

                                if (collaborators.length > 0) {
                                    postLog('log', `Found ${collaborators.length} collaborators for video ${videoId}`);
                                    return collaborators;
                                }
                            }
                        }
                    }
                }

                // Single channel video - extract from channelThumbnailWithLinkRenderer or similar
                if (obj.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer) {
                    const renderer = obj.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer;
                    const browseEndpoint = renderer.navigationEndpoint?.browseEndpoint;
                    if (browseEndpoint) {
                        const channelInfo = {};
                        if (browseEndpoint.browseId?.startsWith('UC')) {
                            channelInfo.id = browseEndpoint.browseId;
                        }
                        if (browseEndpoint.canonicalBaseUrl) {
                            const handleMatch = browseEndpoint.canonicalBaseUrl.match(/@([\w-]+)/);
                            if (handleMatch) {
                                channelInfo.handle = `@${handleMatch[1]}`;
                            }
                        }
                        const ownerText = obj.ownerText?.runs?.[0]?.text || obj.shortBylineText?.runs?.[0]?.text;
                        if (ownerText) {
                            channelInfo.name = ownerText;
                        }
                        if (channelInfo.handle || channelInfo.id) {
                            return [channelInfo];
                        }
                    }
                }
            }

            // Recursively search arrays and objects
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    const value = obj[key];
                    if (Array.isArray(value)) {
                        for (let i = 0; i < value.length; i++) {
                            const result = searchObject(value[i], `${path}.${key}[${i}]`);
                            if (result) return result;
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        const result = searchObject(value, `${path}.${key}`);
                        if (result) return result;
                    }
                }
            }

            return null;
        }

        return searchObject(window.ytInitialData);
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