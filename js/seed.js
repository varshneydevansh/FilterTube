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
    
    // Debug logging with sequence numbers
    let seedDebugSequence = 0;
    function seedDebugLog(message, ...args) {
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

    function processWithEngine(data, dataName) {
        if (!data) {
            seedDebugLog(`⚠️ No data to process for ${dataName}`);
            return data;
        }
        
        if (!cachedSettings) {
            seedDebugLog(`⚠️ No settings available for processing ${dataName}, queueing`);
            pendingDataQueue.push({ data: data, name: dataName, timestamp: Date.now() });
            return data; // Return unmodified data
        }

        seedDebugLog(`🔧 Starting to process ${dataName}...`);
        seedDebugLog(`Settings available:`, {
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
                
                return result;
            } catch (e) {
                seedDebugLog(`❌ Engine processing failed for ${dataName}:`, e);
                // Fall back to basic processing
                return basicProcessing(data, dataName);
            }
        } else {
            seedDebugLog(`⚠️ FilterTubeEngine not available yet`);
            seedDebugLog(`Available on window:`, Object.keys(window).filter(k => k.includes('Filter')));
            return basicProcessing(data, dataName);
        }
    }

    /**
     * Basic fallback processing when the main engine isn't available
     */
    function basicProcessing(data, dataName) {
        if (!cachedSettings) return data;
        
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

        const originalFetch = window.fetch;
        window.fetch = function(resource, init) {
            const url = resource instanceof Request ? resource.url : resource;
            
            if (!fetchEndpoints.some(endpoint => url.includes(endpoint))) {
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
                    const processed = processWithEngine(jsonData, `fetch:${new URL(url).pathname}`);
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

    // ============================================================================
    // SETTINGS MANAGEMENT
    // ============================================================================

    /**
     * Update settings and process any queued data
     */
    function updateSettings(newSettings) {
        seedDebugLog('📥 Settings update received');
        seedDebugLog('Settings details:', {
            keywords: newSettings.filterKeywords?.length || 0,
            channels: newSettings.filterChannels?.length || 0,
            hideAllComments: newSettings.hideAllComments,
            hideAllShorts: newSettings.hideAllShorts
        });
        
        cachedSettings = newSettings;
        
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