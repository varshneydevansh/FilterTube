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
            'filterChannels',
            'hideAllComments',
            'filterComments',
            'useExactWordMatching',
            'hideAllShorts'
        ], (items) => {
            const compiledSettings = {};
            
            // Compile keywords into regex pattern strings (not RegExp objects)
            const keywordsString = items.filterKeywords || '';
            const useExact = items.useExactWordMatching || false;
            
            compiledSettings.filterKeywords = keywordsString
                .split(',')
                .map(k => k.trim())
                .filter(k => k)
                .map(k => {
                    try {
                        // Escape special regex characters in the keyword
                        const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        if (useExact) {
                            return { pattern: `\\b${escapedK}\\b`, flags: 'i' };
                        } else {
                            return { pattern: escapedK, flags: 'i' };
                        }
                    } catch (e) {
                        console.error(`FilterTube: Invalid regex pattern created from keyword: ${k}`, e);
                        return null; // Skip invalid patterns
                    }
                })
                .filter(regex => regex !== null); // Remove nulls from failed regex compilation

            // Compile channels into lowercase strings
            const channelsString = items.filterChannels || '';
            compiledSettings.filterChannels = channelsString
                .split(',')
                .map(c => c.trim().toLowerCase())
                .filter(c => c);

            // Pass through boolean flags
            compiledSettings.hideAllComments = items.hideAllComments || false;
            compiledSettings.filterComments = items.filterComments || false;
            compiledSettings.useExactWordMatching = useExact;
            compiledSettings.hideAllShorts = items.hideAllShorts || false;
            
            console.log('FilterTube Background: Compiled settings:', JSON.stringify(compiledSettings));
            
            resolve(compiledSettings);
        });
    });
}

// Extension installed or updated handler
browserAPI.runtime.onInstalled.addListener(function(details) {
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

