// js/seed.js - Early data interception for FilterTube
// Must run before YouTube scripts to ensure zero-flash filtering

(function() {
    'use strict';

    // Idempotency guard for seed.js itself
    if (window.filterTubeSeedHasRun) {
        console.warn('FilterTube (Seed): Already initialized, skipping');
        return; // Now legal because it's inside a function
    }
    window.filterTubeSeedHasRun = true;

    // Global flags and state
    window.ftSeedInitialized = false;
    
    const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
    const isMobileInterface = document.location.hostname.startsWith('m.');

    console.log('FilterTube: seed.js initializing (MAIN world)');
    
    // Settings and data management
    let cachedSettings = null;
    let pendingDataQueue = [];
    let dataHooksEstablished = false;
    let rawYtInitialData = null;
    let rawYtInitialPlayerResponse = null;

    function stashNetworkSnapshot(data, dataName) {
        try {
            if (!window.filterTube) return;
            if (!data || typeof data !== 'object') return;
            const name = typeof dataName === 'string' ? dataName : '';
            if (!name) return;

            const ts = Date.now();
            if (name.includes('/youtubei/v1/next')) {
                window.filterTube.lastYtNextResponse = data;
                window.filterTube.lastYtNextResponseName = name;
                window.filterTube.lastYtNextResponseTs = ts;
                return;
            }
            if (name.includes('/youtubei/v1/browse')) {
                window.filterTube.lastYtBrowseResponse = data;
                window.filterTube.lastYtBrowseResponseName = name;
                window.filterTube.lastYtBrowseResponseTs = ts;
                return;
            }
            if (name.includes('/youtubei/v1/player')) {
                window.filterTube.lastYtPlayerResponse = data;
                window.filterTube.lastYtPlayerResponseName = name;
                window.filterTube.lastYtPlayerResponseTs = ts;
                return;
            }
        } catch (e) {
        }
    }

    let replayTimer = null;
    let replayAttempts = 0;

    function replayPendingQueueIfReady() {
        try {
            if (!cachedSettings) return;
            if (!Array.isArray(pendingDataQueue) || pendingDataQueue.length === 0) return;

            const engine = window.FilterTubeEngine;
            const hasEngine = Boolean(engine && (typeof engine.processData === 'function' || typeof engine.harvestOnly === 'function'));
            if (!hasEngine) {
                replayAttempts++;
                if (replayAttempts > 50) return;
                scheduleReplay();
                return;
            }

            replayAttempts = 0;

            const queue = [...pendingDataQueue];
            pendingDataQueue = [];
            for (const item of queue) {
                try {
                    const sourceData = cloneData(item.data) || item.data;
                    processWithEngine(sourceData, `${item.name}-replay`);
                } catch (e) {
                }
            }
        } catch (e) {
        }
    }

    function scheduleReplay() {
        if (replayTimer) return;
        replayTimer = setTimeout(() => {
            replayTimer = null;
            replayPendingQueueIfReady();
        }, 250);
    }
    
    // Debug logging with sequence numbers
    let seedDebugSequence = 0;
    function isSeedDebugEnabled() {
        try {
            return !!window.__filtertubeDebug || document.documentElement?.getAttribute('data-filtertube-debug') === 'true';
        } catch (e) {
            try {
                return !!window.__filtertubeDebug;
            } catch (e2) {
                return false;
            }
        }
    }
    function seedDebugLog(message, ...args) {
        if (!isSeedDebugEnabled()) return;
        seedDebugSequence++;
        console.log(`[${seedDebugSequence}] FilterTube (Seed):`, message, ...args);
        
        // Also send logs to content_bridge for extension console visibility
        try {
            window.postMessage({
                type: 'FilterTube_SeedToBridge_Log',
                payload: {
                    level: 'log',
                    message: [message, ...args],
                    seq: seedDebugSequence
                },
                source: 'seed'
            }, '*');
        } catch (e) {
            // Don't let log relay failures break anything
        }
    }
    
    seedDebugLog("🌱 Seed script starting early initialization");

    // ============================================================================
    // FILTERING ENGINE INTERFACE
    // ============================================================================

    /**
     * Process data using the comprehensive filtering engine
     */
    function cloneData(data) {
        if (!data) return null;
        if (typeof structuredClone === 'function') {
            try {
                return structuredClone(data);
            } catch (err) {
                seedDebugLog('⚠️ structuredClone failed, falling back to JSON clone', err.message);
            }
        }
        try {
            return JSON.parse(JSON.stringify(data));
        } catch (err) {
            seedDebugLog('❌ JSON clone failed:', err.message);
            return null;
        }
    }

    function shouldSkipEngineProcessing(data, dataName) {
        if (!data || !dataName) return false;

        const path = document.location?.pathname || '';
        const isSearchResultsPath = path.startsWith('/results');
        const isChannelPath = /^(\/(?:@|channel\/|c\/))/i.test(path);

        const hasEnabledContentFilters = Boolean(
            cachedSettings
            && cachedSettings.contentFilters
            && (
                cachedSettings.contentFilters.duration?.enabled
                || cachedSettings.contentFilters.uploadDate?.enabled
                || cachedSettings.contentFilters.uppercase?.enabled
            )
        );

        const searchActionCollections = data.onResponseReceivedCommands || data.onResponseReceivedActions || data.onResponseReceivedEndpoints;
        const hasSearchLayout = Boolean(
            data?.contents?.twoColumnSearchResultsRenderer ||
            data?.contents?.twoColumnSearchResults ||
            data?.header?.searchHeaderRenderer ||
            (Array.isArray(searchActionCollections) && searchActionCollections.some(action => {
                const continuationKeys = ['appendContinuationItemsAction', 'reloadContinuationItemsCommand', 'replaceContinuationItemsCommand'];

                return continuationKeys.some(key => {
                    const payload = action?.[key];
                    if (!payload) return false;

                    const continuationItems = payload.continuationItems;
                    if (Array.isArray(continuationItems)) {
                        return continuationItems.some(item => !!(
                            item?.itemSectionRenderer ||
                            item?.videoRenderer ||
                            item?.channelRenderer ||
                            item?.lockupViewModel ||
                            item?.lockupMetadataViewModel ||
                            item?.gridShelfViewModel ||
                            item?.shelfRenderer ||
                            item?.richItemRenderer
                        ));
                    }

                    return Boolean(
                        payload?.sectionListRenderer ||
                        payload?.gridRenderer ||
                        payload?.richGridRenderer
                    );
                });
            }))
        );

        if (isSearchResultsPath) {
            const isSearchFetch = typeof dataName === 'string' && dataName.startsWith('fetch:/youtubei/v1/search');
            if (isSearchFetch || hasSearchLayout) {
                const mode = (cachedSettings && cachedSettings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
                if (mode !== 'whitelist') {
                    // Historically we skipped search JSON mutation in blocklist mode so DOM fallback
                    // could "restore" items during identity enrichment. Content filters (duration/date/
                    // uppercase) are deterministic and should be applied JSON-first to avoid flash.
                    if (!hasEnabledContentFilters) {
                        seedDebugLog(`⏭️ Skipping engine processing for ${dataName} (search results) to allow DOM-based restore`);
                        return true;
                    }
                }
            }
        }

        if (isChannelPath) {
            const channelIndicators = Boolean(
                data?.metadata?.channelMetadataRenderer ||
                data?.header?.c4TabbedHeaderRenderer ||
                data?.contents?.twoColumnBrowseResultsRenderer ||
                data?.contents?.twoColumnBrowseResults
            );

            const isChannelDataName = typeof dataName === 'string' && (
                dataName === 'ytInitialData' ||
                dataName.startsWith('fetch:/youtubei/v1/browse') ||
                dataName.startsWith('fetch:/youtubei/v1/next')
            );

            if (channelIndicators && isChannelDataName) {
                if (!hasEnabledContentFilters) {
                    seedDebugLog(`⏭️ Skipping engine processing for ${dataName} (channel page) to allow DOM-based restore`);
                    return true;
                }
            }
        }

        const isBrowseFetch = typeof dataName === 'string' && dataName.startsWith('fetch:/youtubei/v1/browse');
        if (!isBrowseFetch) return false;

        const isOnHomeFeed = path === '/' && !isMobileInterface;
        if (!isOnHomeFeed) return false;

        // Apply deterministic content filters JSON-first on home feed to prevent flash.
        if (hasEnabledContentFilters) return false;

        const actionCollections = data.onResponseReceivedActions || data.onResponseReceivedEndpoints;
        if (!Array.isArray(actionCollections)) return false;

        const continuationKeys = ['appendContinuationItemsAction', 'reloadContinuationItemsCommand', 'replaceContinuationItemsCommand'];

        return actionCollections.some(action => {
            for (const key of continuationKeys) {
                const continuationItems = action?.[key]?.continuationItems;
                if (!Array.isArray(continuationItems)) continue;

                const hasRichGridContent = continuationItems.some(item => !!(
                    item?.richItemRenderer ||
                    item?.richSectionRenderer ||
                    item?.richShelfRenderer ||
                    item?.gridVideoRenderer ||
                    item?.compactVideoRenderer ||
                    item?.lockupViewModel ||
                    item?.lockupMetadataViewModel
                ));

                if (hasRichGridContent) {
                    return true;
                }
            }
            return false;
        });
    }

    function processWithEngine(data, dataName) {
        if (!data) {
            seedDebugLog(`⚠️ No data to process for ${dataName}`);
            return data;
        }

        const queueForLater = (reason) => {
            try {
                pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now(), reason: reason || '' });
                if (pendingDataQueue.length > 60) {
                    pendingDataQueue = pendingDataQueue.slice(-40);
                }
                scheduleReplay();
            } catch (e) {
            }
        };
        
        if (!cachedSettings) {
            seedDebugLog(`⚠️ No settings available for processing ${dataName}, queueing`);
            pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now() });
            return data; // Return unmodified data
        }

        if (cachedSettings.enabled === false) {
            seedDebugLog(`⏸️ Filtering disabled (enabled=false), skipping processing for ${dataName}`);
            return data;
        }

        if (shouldSkipEngineProcessing(data, dataName)) {
            // For search/home/channel layouts we skip MUTATING the data to allow DOM-based
            // restore, but we still want to LEARN UC ID <-> @handle mappings from the
            // same blobs so that channelMap stays fresh for 3-dot menu blocking.
            if (window.FilterTubeEngine && typeof window.FilterTubeEngine.harvestOnly === 'function') {
                seedDebugLog(`🧠 Harvest-only pass for ${dataName} (skip filtering)`);
                try {
                    window.FilterTubeEngine.harvestOnly(data, cachedSettings || { filterChannels: [], filterKeywords: [] });
                } catch (e) {
                    seedDebugLog(`❌ Harvest-only failed for ${dataName}:`, e);
                }
            } else {
                seedDebugLog(`⚠️ FilterTubeEngine.harvestOnly not available for ${dataName}`);
                queueForLater('harvestOnly-missing');
            }

            seedDebugLog(`⏭️ Skipping engine filtering for ${dataName} to allow DOM-based restore`);
            stashNetworkSnapshot(data, dataName);
            return data;
        }

        seedDebugLog(`🔧 Starting to process ${dataName}...`);
        seedDebugLog(`Settings available:`, {
            profileType: cachedSettings.profileType,
            listMode: cachedSettings.listMode,
            keywords: cachedSettings.filterKeywords?.length || 0,
            channels: cachedSettings.filterChannels?.length || 0,
            hideAllComments: cachedSettings.hideAllComments,
            hideAllShorts: cachedSettings.hideAllShorts
        });

        // Use the comprehensive filtering engine if available
        if (window.FilterTubeEngine && window.FilterTubeEngine.processData) {
            seedDebugLog(`🔧 Processing ${dataName} with comprehensive engine`);
            try {
                const originalSize = JSON.stringify(data).length;
                const result = window.FilterTubeEngine.processData(data, cachedSettings, dataName);
                const newSize = JSON.stringify(result).length;
                
                seedDebugLog(`✅ Successfully processed ${dataName} with engine`);
                seedDebugLog(`📊 Size change: ${originalSize} → ${newSize} chars (${originalSize - newSize} removed)`);
                
                // Check if anything was actually filtered
                if (originalSize !== newSize) {
                    seedDebugLog(`🎯 Data was modified! Filtering is working.`);
                } else {
                    seedDebugLog(`⚠️ No changes made to data - check filter rules and data structure`);
                }

                stashNetworkSnapshot(result, dataName);
                return result;
            } catch (e) {
                seedDebugLog(`❌ Engine processing failed for ${dataName}:`, e);
                // Fall back to basic processing
                const fallback = basicProcessing(data, dataName);
                stashNetworkSnapshot(fallback, dataName);
                return fallback;
            }
        } else {
            seedDebugLog(`⚠️ FilterTubeEngine not available yet`);
            seedDebugLog(`Available on window:`, Object.keys(window).filter(k => k.includes('Filter')));
            queueForLater('engine-missing');
            return data;
        }
    }

    /**
     * Basic fallback processing when the main engine isn't available
     */
    function basicProcessing(data, dataName) {
        if (!cachedSettings) return data;

        if (cachedSettings.enabled === false) {
            return data;
        }
        
        let modified = false;
        seedDebugLog(`🔧 Basic processing ${dataName}`);
        
        try {
            // Basic comment hiding
            if (cachedSettings.hideAllComments) {
                // Remove engagement panels with comments
                if (data.engagementPanels) {
                    for (let i = data.engagementPanels.length - 1; i >= 0; i--) {
                        const panel = data.engagementPanels[i];
                        const titleText = panel?.engagementPanelSectionListRenderer?.header?.engagementPanelTitleHeaderRenderer?.title?.simpleText || '';
                        
                        if (titleText.toLowerCase().includes("comment")) {
                            seedDebugLog(`✂️ Removing comments panel "${titleText}"`);
                            data.engagementPanels.splice(i, 1);
                            modified = true;
                        }
                    }
                }
                
                // Remove comment sections from main content
                if (data.contents?.twoColumnWatchNextResults?.results?.results?.contents) {
                    const contents = data.contents.twoColumnWatchNextResults.results.results.contents;
                    for (let i = contents.length - 1; i >= 0; i--) {
                        if (contents[i]?.itemSectionRenderer?.sectionIdentifier === 'comment-item-section') {
                            seedDebugLog(`✂️ Removing comment section at index ${i}`);
                            contents.splice(i, 1);
                            modified = true;
                        }
                    }
                }
            }
            
            if (modified) {
                seedDebugLog(`✅ Basic processing modified ${dataName}`);
            } else {
                seedDebugLog(`ℹ️ Basic processing made no changes to ${dataName}`);
            }
        } catch (e) {
            seedDebugLog(`❌ Error in basic processing:`, e);
        }
        
        return data;
    }

    // ============================================================================
    // DATA HOOKS SETUP
    // ============================================================================

    /**
     * Set up hooks for YouTube data before it's processed by YouTube
     */
    function establishDataHooks() {
        if (dataHooksEstablished) {
            seedDebugLog("⚠️ Data hooks already established, skipping");
            return;
        }

        seedDebugLog("🎯 Setting up data interception hooks");

        // Hook ytInitialData
        let originalYtInitialData = window.ytInitialData;
        
        // Check if data already exists and process it immediately
        if (originalYtInitialData && typeof originalYtInitialData === 'object') {
            seedDebugLog("🎯 ytInitialData already exists, processing immediately");
            rawYtInitialData = cloneData(originalYtInitialData);
            const processed = processWithEngine(originalYtInitialData, 'ytInitialData-existing');
            window.ytInitialData = processed;
            if (window.filterTube) {
                window.filterTube.lastYtInitialData = processed;
                window.filterTube.rawYtInitialData = cloneData(rawYtInitialData);
            }
        }

        // Set up defineProperty hook for future data
        const ytInitialDataDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialData');
        if (ytInitialDataDesc && ytInitialDataDesc.configurable === false) {
            seedDebugLog('⚠️ ytInitialData is non-configurable; skipping hook');
        } else {
            try {
                Object.defineProperty(window, 'ytInitialData', {
                    configurable: true,
                    get: function() {
                        return originalYtInitialData;
                    },
                    set: function(newValue) {
                        seedDebugLog('🎯 ytInitialData intercepted via setter');
                        seedDebugLog('Data keys:', newValue ? Object.keys(newValue) : 'null');
                        seedDebugLog('Data size:', newValue ? JSON.stringify(newValue).length : 0, 'chars');
                        
                        const processed = processWithEngine(newValue, 'ytInitialData');
                        originalYtInitialData = processed;
                        
                        // Update global reference
                        if (window.filterTube) {
                            window.filterTube.lastYtInitialData = processed;
                        }
                    }
                });
            } catch (e) {
                seedDebugLog('⚠️ Failed to install ytInitialData hook:', e);
            }
        }

        // Hook ytInitialPlayerResponse
        let originalYtInitialPlayerResponse = window.ytInitialPlayerResponse;
        
        // Check if data already exists and process it immediately
        if (originalYtInitialPlayerResponse && typeof originalYtInitialPlayerResponse === 'object') {
            seedDebugLog("🎯 ytInitialPlayerResponse already exists, processing immediately");
            rawYtInitialPlayerResponse = cloneData(originalYtInitialPlayerResponse);
            const processed = processWithEngine(originalYtInitialPlayerResponse, 'ytInitialPlayerResponse-existing');
            window.ytInitialPlayerResponse = processed;
            if (window.filterTube) {
                window.filterTube.lastYtInitialPlayerResponse = processed;
                window.filterTube.rawYtInitialPlayerResponse = cloneData(rawYtInitialPlayerResponse);
            }
        }

        // Set up defineProperty hook for future data
        const ytPlayerDesc = Object.getOwnPropertyDescriptor(window, 'ytInitialPlayerResponse');
        if (ytPlayerDesc && ytPlayerDesc.configurable === false) {
            seedDebugLog('⚠️ ytInitialPlayerResponse is non-configurable; skipping hook');
        } else {
            try {
                Object.defineProperty(window, 'ytInitialPlayerResponse', {
                    configurable: true,
                    get: function() {
                        return originalYtInitialPlayerResponse;
                    },
                    set: function(newValue) {
                        seedDebugLog('🎯 ytInitialPlayerResponse intercepted via setter');
                        seedDebugLog('Data keys:', newValue ? Object.keys(newValue) : 'null');
                        seedDebugLog('Data size:', newValue ? JSON.stringify(newValue).length : 0, 'chars');
                        
                        const processed = processWithEngine(newValue, 'ytInitialPlayerResponse');
                        originalYtInitialPlayerResponse = processed;
                        
                        // Update global reference
                        if (window.filterTube) {
                            window.filterTube.lastYtInitialPlayerResponse = processed;
                        }
                    }
                });
            } catch (e) {
                seedDebugLog('⚠️ Failed to install ytInitialPlayerResponse hook:', e);
            }
        }

        dataHooksEstablished = true;
        seedDebugLog("✅ Data hooks established successfully");
    }

    // ============================================================================
    // FETCH/XHR INTERCEPTION
    // ============================================================================

    /**
     * Set up fetch interception for dynamic content
     */
    function setupFetchInterception() {
        const fetchEndpoints = [
            '/youtubei/v1/search',
            '/youtubei/v1/guide', 
            '/youtubei/v1/browse',
            '/youtubei/v1/next',
            '/youtubei/v1/player'
        ];

        const getPathname = (rawUrl) => {
            try {
                return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;
            } catch (e) {
                const fallback = String(rawUrl || '');
                return fallback.split('?')[0] || fallback;
            }
        };

        const originalFetch = window.fetch;
        window.fetch = function(resource, init) {
            const url = resource instanceof Request ? resource.url : resource;
            const urlStr = typeof url === 'string' ? url : String(url || '');

            if (!fetchEndpoints.some(endpoint => urlStr.includes(endpoint))) {
                return originalFetch.apply(this, arguments);
            }

            return originalFetch.apply(this, arguments).then(response => {
                if (!response.ok) return response;
                
                return response.clone().json().then(jsonData => {
                    // Special handling for comment requests when hideAllComments is enabled
                    if (url.includes('/youtubei/v1/next') && cachedSettings?.hideAllComments) {
                        // Check if this is a comment continuation request
                        const isCommentRequest = jsonData?.onResponseReceivedEndpoints?.some(endpoint => 
                            endpoint?.appendContinuationItemsAction?.continuationItems?.some(item => 
                                item?.commentThreadRenderer || item?.commentRenderer
                            )
                        );
                        
                        if (isCommentRequest) {
                            seedDebugLog('🚫 Intercepting comment request - returning empty continuation');
                            // Return a proper "end of comments" response instead of empty data
                            const emptyCommentResponse = {
                                ...jsonData,
                                onResponseReceivedEndpoints: [{
                                    appendContinuationItemsAction: {
                                        continuationItems: [
                                            // Add a proper end marker so YouTube stops requesting more
                                            {
                                                continuationItemRenderer: {
                                                    trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN",
                                                    continuationEndpoint: null // This signals end of content
                                                }
                                            }
                                        ]
                                    }
                                }]
                            };
                            
                            return new Response(JSON.stringify(emptyCommentResponse), {
                                status: response.status,
                                statusText: response.statusText,
                                headers: response.headers
                            });
                        }
                    }
                    
                    // Normal processing for non-comment or non-hideAllComments requests
                    const processed = processWithEngine(jsonData, `fetch:${getPathname(urlStr)}`);
                    return new Response(JSON.stringify(processed), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }).catch(err => {
                    // If JSON parsing fails, return original response
                    seedDebugLog(`⚠️ Fetch processing failed for ${url}:`, err);
                    return response;
                });
            });
        };

        seedDebugLog("✅ Fetch interception established");
    }

    function setupXhrInterception() {
        try {
            if (window.__filtertubeXhrInterceptionInstalled) return;
            window.__filtertubeXhrInterceptionInstalled = true;

            const xhrEndpoints = [
                '/youtubei/v1/search',
                '/youtubei/v1/guide',
                '/youtubei/v1/browse',
                '/youtubei/v1/next',
                '/youtubei/v1/player'
            ];

            const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
            if (!proto) return;

            const originalOpen = proto.open;
            const originalSend = proto.send;
            const originalAddEventListener = proto.addEventListener;
            const originalRemoveEventListener = proto.removeEventListener;
            if (typeof originalOpen !== 'function' || typeof originalSend !== 'function') return;

            const getPathname = (rawUrl) => {
                try {
                    return new URL(String(rawUrl || ''), document.location?.origin || 'https://www.youtube.com').pathname;
                } catch (e) {
                    const fallback = String(rawUrl || '');
                    return fallback.split('?')[0] || fallback;
                }
            };

            const listenerWrapperMap = new WeakMap();

            const getWrappedListener = (xhr, type, listener) => {
                if (typeof listener !== 'function') return listener;
                let perXhr = listenerWrapperMap.get(xhr);
                if (!perXhr) {
                    perXhr = new Map();
                    listenerWrapperMap.set(xhr, perXhr);
                }
                const key = `${type}::${listener}`;
                if (perXhr.has(key)) return perXhr.get(key);

                const wrapped = function () {
                    try {
                        if ((type === 'readystatechange' || type === 'load') && xhr?.__filtertube_shouldProcessXhr) {
                            ensureXhrResponseProcessed(xhr);
                        }
                    } catch (e) {
                    }
                    return listener.apply(this, arguments);
                };
                perXhr.set(key, wrapped);
                return wrapped;
            };

            const ensureXhrResponseProcessed = (xhr) => {
                try {
                    if (!xhr || xhr.__filtertube_responseProcessed) return;
                    if (!xhr.__filtertube_shouldProcessXhr) return;
                    if (xhr.readyState !== 4) return;
                    if (!cachedSettings) return;
                    if (cachedSettings.enabled === false) return;

                    const status = Number(xhr.status || 0);
                    if (status && status >= 400) return;

                    const responseType = xhr.responseType || '';
                    let jsonData = null;

                    if (responseType === 'json') {
                        jsonData = xhr.response;
                        if (!jsonData || typeof jsonData !== 'object') return;
                    } else if (responseType === '' || responseType === 'text') {
                        const text = xhr.responseText;
                        if (!text || typeof text !== 'string') return;
                        const trimmed = text.trim();
                        if (!trimmed || (trimmed[0] !== '{' && trimmed[0] !== '[')) return;
                        try {
                            jsonData = JSON.parse(trimmed);
                        } catch (e) {
                            return;
                        }
                    } else {
                        return;
                    }

                    const urlStr = typeof xhr.__filtertube_url === 'string' ? xhr.__filtertube_url : String(xhr.__filtertube_url || '');
                    const processed = processWithEngine(jsonData, `xhr:${getPathname(urlStr)}`);
                    if (!processed || typeof processed !== 'object') return;

                    xhr.__filtertube_modifiedResponse = processed;
                    xhr.__filtertube_modifiedResponseText = JSON.stringify(processed);

                    if (!xhr.__filtertube_responseInterceptorsInstalled) {
                        xhr.__filtertube_responseInterceptorsInstalled = true;
                        try {
                            const protoResponseDesc = Object.getOwnPropertyDescriptor(proto, 'response');
                            const protoResponseTextDesc = Object.getOwnPropertyDescriptor(proto, 'responseText');

                            Object.defineProperty(xhr, 'response', {
                                configurable: true,
                                get: function () {
                                    if (this.__filtertube_modifiedResponse !== undefined) {
                                        const rt = this.responseType || '';
                                        if (rt === 'json') return this.__filtertube_modifiedResponse;
                                        if (rt === '' || rt === 'text') return this.__filtertube_modifiedResponseText;
                                        return this.__filtertube_modifiedResponse;
                                    }
                                    return protoResponseDesc && typeof protoResponseDesc.get === 'function'
                                        ? protoResponseDesc.get.call(this)
                                        : undefined;
                                }
                            });

                            Object.defineProperty(xhr, 'responseText', {
                                configurable: true,
                                get: function () {
                                    if (this.__filtertube_modifiedResponseText !== undefined) {
                                        return this.__filtertube_modifiedResponseText;
                                    }
                                    return protoResponseTextDesc && typeof protoResponseTextDesc.get === 'function'
                                        ? protoResponseTextDesc.get.call(this)
                                        : '';
                                }
                            });
                        } catch (e) {
                        }
                    }

                    xhr.__filtertube_responseProcessed = true;
                } catch (e) {
                }
            };

            if (typeof originalAddEventListener === 'function') {
                proto.addEventListener = function (type, listener, options) {
                    try {
                        if (this && this.__filtertube_shouldProcessXhr && (type === 'readystatechange' || type === 'load')) {
                            const wrapped = getWrappedListener(this, type, listener);
                            return originalAddEventListener.call(this, type, wrapped, options);
                        }
                    } catch (e) {
                    }
                    return originalAddEventListener.call(this, type, listener, options);
                };
            }

            if (typeof originalRemoveEventListener === 'function') {
                proto.removeEventListener = function (type, listener, options) {
                    try {
                        if (this && this.__filtertube_shouldProcessXhr && (type === 'readystatechange' || type === 'load')) {
                            const wrapped = getWrappedListener(this, type, listener);
                            return originalRemoveEventListener.call(this, type, wrapped, options);
                        }
                    } catch (e) {
                    }
                    return originalRemoveEventListener.call(this, type, listener, options);
                };
            }

            proto.open = function(method, url) {
                try {
                    this.__filtertube_url = url;
                    const urlStr = typeof url === 'string' ? url : String(url || '');
                    this.__filtertube_shouldProcessXhr = Boolean(urlStr && xhrEndpoints.some(endpoint => urlStr.includes(endpoint)));
                    this.__filtertube_responseProcessed = false;
                } catch (e) {
                }
                return originalOpen.apply(this, arguments);
            };

            proto.send = function() {
                try {
                    const rawUrl = this.__filtertube_url;
                    const urlStr = typeof rawUrl === 'string' ? rawUrl : String(rawUrl || '');
                    if (urlStr && xhrEndpoints.some(endpoint => urlStr.includes(endpoint))) {
                        this.__filtertube_shouldProcessXhr = true;
                        this.__filtertube_responseProcessed = false;
                        const xhr = this;
                        const processIfReady = function () {
                            try {
                                ensureXhrResponseProcessed(xhr);
                            } catch (e) {
                            }
                        };

                        if (typeof originalAddEventListener === 'function') {
                            originalAddEventListener.call(this, 'readystatechange', processIfReady);
                            originalAddEventListener.call(this, 'load', processIfReady);
                        }
                    }
                } catch (e) {
                }

                return originalSend.apply(this, arguments);
            };

            seedDebugLog("✅ XHR interception established");
        } catch (e) {
        }
    }

    // ============================================================================
    // SETTINGS MANAGEMENT
    // ============================================================================

    /**
     * Update settings and process any queued data
     */
    function updateSettings(newSettings) {
        seedDebugLog('📥 Settings update received');
        seedDebugLog('Settings details:', {
            profileType: newSettings.profileType,
            listMode: newSettings.listMode,
            keywords: newSettings.filterKeywords?.length || 0,
            channels: newSettings.filterChannels?.length || 0,
            hideAllComments: newSettings.hideAllComments,
            hideAllShorts: newSettings.hideAllShorts
        });
        
        cachedSettings = newSettings;
        try {
            if (window.filterTube && typeof window.filterTube === 'object') {
                window.filterTube.settings = newSettings;
            }
        } catch (e) {
        }
        
        // Process any queued data
        if (pendingDataQueue.length > 0) {
            seedDebugLog(`🔄 Processing ${pendingDataQueue.length} queued data items`);
            
            const queue = [...pendingDataQueue];
            pendingDataQueue = [];
            
            for (const item of queue) {
                seedDebugLog(`🔄 Processing queued ${item.name} (queued ${Date.now() - item.timestamp}ms ago)`);
                const sourceData = cloneData(item.data) || item.data;
                const processed = processWithEngine(sourceData, `${item.name}-queued`);
                
                // Update the appropriate global variable
                if (item.name.includes('ytInitialData')) {
                    window.ytInitialData = processed;
                    if (window.filterTube) {
                        window.filterTube.lastYtInitialData = processed;
                    }
                } else if (item.name.includes('ytInitialPlayerResponse')) {
                    window.ytInitialPlayerResponse = processed;
                    if (window.filterTube) {
                        window.filterTube.lastYtInitialPlayerResponse = processed;
                    }
                }
            }
            
            seedDebugLog(`✅ Finished processing queued data`);
        }
        
        // Reprocess existing data if available (for settings changes)
        if (window.filterTube) {
            const sourceInitialData = rawYtInitialData ? cloneData(rawYtInitialData) : (window.filterTube.rawYtInitialData ? cloneData(window.filterTube.rawYtInitialData) : null);
            if (sourceInitialData) {
                seedDebugLog('🔄 Reprocessing stored ytInitialData snapshot with new settings');
                const reprocessed = processWithEngine(sourceInitialData, 'ytInitialData-reprocess');
                window.ytInitialData = reprocessed;
                window.filterTube.lastYtInitialData = reprocessed;
            }

            const sourcePlayerResponse = rawYtInitialPlayerResponse ? cloneData(rawYtInitialPlayerResponse) : (window.filterTube.rawYtInitialPlayerResponse ? cloneData(window.filterTube.rawYtInitialPlayerResponse) : null);
            if (sourcePlayerResponse) {
                seedDebugLog('🔄 Reprocessing stored ytInitialPlayerResponse snapshot with new settings');
                const reprocessed = processWithEngine(sourcePlayerResponse, 'ytInitialPlayerResponse-reprocess');
                window.ytInitialPlayerResponse = reprocessed;
                window.filterTube.lastYtInitialPlayerResponse = reprocessed;
            }
        }
        
        seedDebugLog('✅ Settings update completed');
    }

    // ============================================================================
    // GLOBAL INTERFACE
    // ============================================================================

    // Create global FilterTube object for inter-script communication
    window.filterTube = {
        settings: null,
        lastYtInitialData: null,
        lastYtInitialPlayerResponse: null,
        rawYtInitialData: null,
        rawYtInitialPlayerResponse: null,
        updateSettings: updateSettings,
        
        // Advanced processing functions (can be overridden by injector.js)
        processFetchResponse: null,
        processXhrResponse: null,
        
        // Debug interface
        getStats: function() {
            return {
                settingsLoaded: !!cachedSettings,
                hooksEstablished: dataHooksEstablished,
                queuedItems: pendingDataQueue.length,
                lastYtData: !!this.lastYtInitialData,
                lastPlayerData: !!this.lastYtInitialPlayerResponse
            };
        }
    };

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    // Establish data hooks immediately
    establishDataHooks();
    
    // Set up fetch interception
    setupFetchInterception();

    setupXhrInterception();
    
    // Mark as ready and dispatch event
    window.ftSeedInitialized = true;
    
    try {
        window.dispatchEvent(new CustomEvent('filterTubeSeedReady', {
            detail: { timestamp: Date.now(), source: 'seed' }
        }));
        seedDebugLog('📢 Dispatched filterTubeSeedReady event');
    } catch (e) {
        seedDebugLog('❌ Error dispatching ready event:', e);
    }
    
    seedDebugLog('🏁 Seed initialization complete - ready for content filtering');

})(); 