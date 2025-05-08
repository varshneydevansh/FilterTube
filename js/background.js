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

// Extension installed or updated handler
browserAPI.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('FilterTube extension installed');
    
    // Initialize with some default settings if desired
    browserAPI.storage.local.set({
      filterKeywords: '',
      filterChannels: '',
      useExactWordMatching: false
    });
    
    // Optionally open a welcome page or tutorial
    // browserAPI.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('FilterTube extension updated from version ' + details.previousVersion);
    
    // You could handle migration of settings between versions here if needed
  }
});

// Listen for messages sent from other parts of the extension (e.g., content scripts, popup).
browserAPI.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the message is intended to retrieve the current filter settings.
    if (request.action == "applyFilters") {
        console.log("FilterTube Background: Received applyFilters message.");
        
        // Retrieve the requested filter values from storage.
        browserAPI.storage.local.get(["filterKeywords", "filterChannels", "useExactWordMatching"], function (result) {
             if (browserAPI.runtime.lastError) {
                console.error("Error getting filters from storage:", browserAPI.runtime.lastError);
                // Send an error response or empty object back if desired.
                sendResponse({ error: browserAPI.runtime.lastError.message });
            } else {
                 // Send the retrieved filter values back to the message sender.
                sendResponse({ 
                    filterKeywords: result.filterKeywords, 
                    filterChannels: result.filterChannels,
                    useExactWordMatching: result.useExactWordMatching
                });
            }
        });

        // Return true to indicate that sendResponse will be called asynchronously.
        return true;
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

console.log(`FilterTube Background ${IS_FIREFOX ? 'Script' : 'Service Worker'} Loaded (v1.4.9).`);

