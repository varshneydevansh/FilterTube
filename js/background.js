// background.js

/**
 * Background script for FilterTube extension
 *
 * This script runs in the background as a service worker in Chrome,
 * and as a background script in Firefox MV3.
 *
 * Currently minimal functionality is needed here, but it could be extended to:
 * - Handle messages from content script
 * - Manage extension state across browser tabs
 * - Implement storage change listeners
 * - Implement optional features in the future
 */

// Browser detection for compatibility
const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.runtime;
const browserAPI = IS_FIREFOX ? browser : chrome;

// Log when the background script loads with browser info
console.log(`FilterTube background script loaded in ${IS_FIREFOX ? 'Firefox' : 'Chrome/Edge/Other'}`);

// Function to compile settings from storage
async function getCompiledSettings() {
    return new Promise((resolve) => {
        browserAPI.storage.local.get([
            'filterKeywords',
            'uiKeywords',
            'filterChannels',
            'channelMap',
            'hideAllComments',
            'filterComments',
            'useExactWordMatching',
            'hideAllShorts'
        ], (items) => {
            const compiledSettings = {};
            const storageUpdates = {};

            const storedCompiled = items.filterKeywords;
            const storedUiKeywords = Array.isArray(items.uiKeywords) ? items.uiKeywords : null;
            const storedUiChannels = Array.isArray(items.uiChannels) ? items.uiChannels : null;
            const useExact = items.useExactWordMatching || false;

            // Helper to validate compiled keyword entries
            const sanitizeCompiledList = (list = []) => list.filter(entry => {
                return entry && typeof entry.pattern === 'string' && typeof entry.flags === 'string';
            });

            if (Array.isArray(storedCompiled)) {
                compiledSettings.filterKeywords = sanitizeCompiledList(storedCompiled);

                // If we don't yet have uiKeywords, attempt to reconstruct them from the compiled list
                if (!storedUiKeywords && compiledSettings.filterKeywords.length) {
                    storageUpdates.uiKeywords = compiledSettings.filterKeywords.map(keyword => {
                        const isExact = keyword.pattern.startsWith('\\b') && keyword.pattern.endsWith('\\b');
                        const raw = keyword.pattern
                            .replace(/^\\b/, '')
                            .replace(/\\b$/, '')
                            .replace(/\\(.)/g, '$1');
                        return { word: raw, exact: isExact };
                    });
                }
            } else if (typeof storedCompiled === 'string') {
                // Legacy string storage fallback
                const keywordsString = storedCompiled;
                const parsedKeywords = keywordsString
                    .split(',')
                    .map(k => k.trim())
                    .filter(Boolean);

                compiledSettings.filterKeywords = parsedKeywords.map(keyword => {
                    try {
                        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        return {
                            pattern: useExact ? `\\b${escaped}\\b` : escaped,
                            flags: 'i'
                        };
                    } catch (error) {
                        console.error(`FilterTube: Invalid regex from legacy keyword: ${keyword}`, error);
                        return null;
                    }
                }).filter(Boolean);

                storageUpdates.filterKeywords = compiledSettings.filterKeywords;
                storageUpdates.uiKeywords = parsedKeywords.map(keyword => ({ word: keyword, exact: useExact }));
            } else {
                compiledSettings.filterKeywords = [];
            }

            // Persist any migrations we calculated
            if (Object.keys(storageUpdates).length > 0) {
                browserAPI.storage.local.set(storageUpdates);
            }

            // Compile channels - preserve objects with name, id, handle, filterAll
            const storedChannels = items.filterChannels;
            let compiledChannels = [];
            const additionalKeywordsFromChannels = [];

            if (Array.isArray(storedChannels)) {
                compiledChannels = storedChannels.map(ch => {
                    if (typeof ch === 'string') {
                        // Legacy string format - convert to object format
                        return {
                            name: ch.trim(),
                            id: ch.trim(), // Preserve case for UC IDs
                            handle: null,
                            filterAll: false
                        };
                    } else if (ch && typeof ch === 'object') {
                        // New object format - preserve the original case for IDs
                        const channelObj = {
                            name: ch.name,
                            id: ch.id || '', // Preserve case for UC IDs
                            handle: (ch.handle || '').toLowerCase() || null, // Lowercase handles for consistency
                            filterAll: !!ch.filterAll
                        };

                        // If filterAll is enabled, add the channel name to keywords
                        if (channelObj.filterAll && channelObj.name && channelObj.name !== channelObj.id) {
                            const escaped = channelObj.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            additionalKeywordsFromChannels.push({
                                pattern: escaped,
                                flags: 'i'
                            });
                        }

                        return channelObj;
                    }
                    return null;
                }).filter(Boolean);

                if (!storedUiChannels) {
                    storageUpdates.uiChannels = storedChannels
                        .map(ch => typeof ch === 'string' ? ch.trim() : ch)
                        .filter(Boolean);
                }
            } else if (typeof storedChannels === 'string') {
                // Legacy string format
                compiledChannels = storedChannels
                    .split(',')
                    .map(c => c.trim()) // Preserve case for UC IDs
                    .filter(Boolean)
                    .map(c => ({ name: c, id: c, handle: null, filterAll: false }));
                storageUpdates.filterChannels = compiledChannels;
                storageUpdates.uiChannels = compiledChannels.map(ch => ch.name);
            }

            compiledSettings.filterChannels = compiledChannels;

            // Merge channel-based keywords with existing keywords
            if (additionalKeywordsFromChannels.length > 0) {
                compiledSettings.filterKeywords = [
                    ...compiledSettings.filterKeywords,
                    ...additionalKeywordsFromChannels
                ];
            }

            // Pass through the channel map (UC ID <-> @handle mappings)
            compiledSettings.channelMap = items.channelMap || {};

            // Pass through boolean flags
            compiledSettings.hideAllComments = items.hideAllComments || false;
            compiledSettings.filterComments = items.filterComments || false;
            compiledSettings.useExactWordMatching = useExact;
            compiledSettings.hideAllShorts = items.hideAllShorts || false;

            console.log(`FilterTube Background: Compiled ${compiledChannels.length} channels, ${Object.keys(compiledSettings.channelMap).length / 2} mappings`);

            resolve(compiledSettings);
        });
    });
}

// Extension installed or updated handler
browserAPI.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        console.log('FilterTube extension installed');

        // Initialize with some default settings
        browserAPI.storage.local.set({
            filterKeywords: '',
            filterChannels: '',
            useExactWordMatching: false,
            hideAllComments: false,
            filterComments: false,
            hideAllShorts: false
        });
    } else if (details.reason === 'update') {
        console.log('FilterTube extension updated from version ' + details.previousVersion);

        // You could handle migration of settings between versions here if needed
    }
});

// Listen for messages sent from other parts of the extension (e.g., content scripts, popup).
browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getCompiledSettings") {
        console.log("FilterTube Background: Received getCompiledSettings message.");
        getCompiledSettings().then(compiledSettings => {
            // Check for runtime.lastError to catch any errors during storage access within getCompiledSettings
            if (browserAPI.runtime.lastError) {
                console.error("FilterTube Background: Error retrieving settings from storage:", browserAPI.runtime.lastError);
                sendResponse({ error: browserAPI.runtime.lastError.message });
            } else {
                sendResponse(compiledSettings);
            }
        }).catch(error => {
            // Catch any other errors from the promise chain
            console.error("FilterTube Background: Unhandled error in getCompiledSettings promise:", error);
            sendResponse({ error: error.message || "Unknown error occurred while compiling settings." });
        });
        return true; // Indicates that the response is sent asynchronously.
    } else if (request.action === "injectScripts") {
        // Handle script injection via Chrome scripting API
        console.log("FilterTube Background: Received injectScripts request for:", request.scripts);

        if (!browserAPI.scripting?.executeScript) {
            console.error("FilterTube Background: scripting API not available");
            sendResponse({ success: false, error: "Scripting API not available" });
            return false;
        }

        if (!sender.tab?.id) {
            console.error("FilterTube Background: No tab ID available from sender");
            sendResponse({ success: false, error: "No tab ID available" });
            return false;
        }

        // Inject scripts sequentially
        const injectSequentially = async () => {
            try {
                for (const scriptName of request.scripts) {
                    console.log(`FilterTube Background: Injecting ${scriptName}.js into tab ${sender.tab.id}`);

                    await browserAPI.scripting.executeScript({
                        target: { tabId: sender.tab.id },
                        files: [`js/${scriptName}.js`],
                        world: 'MAIN'
                    });

                    console.log(`FilterTube Background: Successfully injected ${scriptName}.js`);
                }

                sendResponse({ success: true });
            } catch (error) {
                console.error("FilterTube Background: Script injection failed:", error);
                sendResponse({ success: false, error: error.message });
            }
        };

        injectSequentially();
        return true; // Indicates that the response is sent asynchronously
    } else if (request.action === "processFetchData") {
        // Handle fetch/XHR data processing from content_bridge
        if (request.url && request.data) {
            console.log(`FilterTube Background: Received data to process from ${request.url}`);
            // You could implement centralized data processing here if needed
            // For now, we'll let content scripts handle filtering
        }
        return false; // No response needed
    } else if (request.action === 'FilterTube_ApplySettings' && request.settings) {
        // Forward compiled settings to all relevant tabs for immediate application
        browserAPI.tabs.query({ url: ["*://*.youtube.com/*", "*://*.youtubekids.com/*"] }, tabs => {
            tabs.forEach(tab => {
                browserAPI.tabs.sendMessage(tab.id, { action: 'FilterTube_ApplySettings', settings: request.settings }, () => {
                    if (browserAPI.runtime.lastError && !/Receiving end does not exist/i.test(browserAPI.runtime.lastError.message)) {
                        console.warn('FilterTube Background: sendMessage error', browserAPI.runtime.lastError.message);
                    }
                });
            });
        });
        sendResponse({ acknowledged: true });
        return false;
    } else if (request.action === "updateChannelMap") {
        // Handle learned ID/Handle mappings from filter_logic
        browserAPI.storage.local.get(['channelMap'], (result) => {
            const currentMap = result.channelMap || {};
            let hasChange = false;

            request.mappings.forEach(m => {
                // Keys are lowercase for case-insensitive lookup
                // Values preserve ORIGINAL case from YouTube
                const keyId = m.id.toLowerCase();
                const keyHandle = m.handle.toLowerCase();

                if (currentMap[keyId] !== m.handle) {
                    currentMap[keyId] = m.handle;    // UC... -> @BTS (original case)
                    currentMap[keyHandle] = m.id;    // @bts -> UCLkAepWjdylmXSltofFvsYQ (original case)
                    hasChange = true;
                }
            });

            if (hasChange) {
                browserAPI.storage.local.set({ channelMap: currentMap });
                console.log("FilterTube Background: Channel map updated in storage");
            }
        });
        return false; // No response needed
    }

    // Handle any browser-specific actions if needed
    if (request.action === "getBrowserInfo") {
        sendResponse({
            isFirefox: IS_FIREFOX,
            browser: IS_FIREFOX ? "Firefox" : "Chrome/Edge/Other"
        });
        return false; // Synchronous response
    }
});

// Listen for storage changes to re-compile settings
browserAPI.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        const relevantKeys = ['filterKeywords', 'filterChannels', 'hideAllComments', 'filterComments', 'useExactWordMatching', 'hideAllShorts'];
        let settingsChanged = false;
        for (const key of relevantKeys) {
            if (changes[key]) {
                settingsChanged = true;
                console.log(`FilterTube Background: Setting changed - ${key}:`, changes[key]);
                break;
            }
        }

        if (settingsChanged) {
            console.log('FilterTube Background: Settings changed, re-compiling.');
            getCompiledSettings().then(compiledSettings => {
                console.log('FilterTube Background: New compiled settings ready');
                // The content_bridge.js will request these updated settings on its own
                // via storage.onChanged listener and chrome.runtime.sendMessage
            });
        }
    }
});

console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} loaded and ready to serve filtered content.`);

