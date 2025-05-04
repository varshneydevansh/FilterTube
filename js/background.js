// background.js

/**
 * Background script for FilterTube - handles:
 * - Browser action click
 * - Installation/update events
 * - Message passing between extension components
 */

// Log when the background script loads
console.log('FilterTube background script loaded');

// Handle clicks on the extension icon
chrome.action.onClicked.addListener(function(tab) {
    // Open the popup interface by default
    // This is a fallback if the popup doesn't open automatically
    
    // First try to open our website directly
    chrome.tabs.create({
        url: 'https://varshneydevansh.github.io/FilterTube/website/'
    }, (tab) => {
        console.log('Opened FilterTube website from icon click');
    });
});

// Example event listener for when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    console.log('FilterTube extension installed');
    
    // Initialize with some default settings if desired
    chrome.storage.local.set({
      filterKeywords: '',
      filterChannels: ''
    });
    
    // Optionally open a welcome page or tutorial
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('FilterTube extension updated from version ' + details.previousVersion);
    
    // You could handle migration of settings between versions here if needed
  }
});

// Listen for messages sent from other parts of the extension (e.g., content scripts, popup).
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // Check if the message is intended to retrieve the current filter settings.
    // Note: This listener is currently NOT USED by popup.js or content.js,
    // as they access chrome.storage.local directly. It might be for future features.
    if (request.action == "applyFilters") {
        console.log("FilterTube Background: Received applyFilters message (currently unused).");
        // Retrieve the requested filter values from storage.
        chrome.storage.local.get(["filterKeywords", "filterChannels"], function (result) {
             if (chrome.runtime.lastError) {
                console.error("Error getting filters from storage:", chrome.runtime.lastError);
                // Send an error response or empty object back if desired.
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                 // Send the retrieved filter values back to the message sender.
                sendResponse({ filterKeywords: result.filterKeywords, filterChannels: result.filterChannels });
            }
        });

        // Return true to indicate that sendResponse will be called asynchronously.
        // This keeps the message channel open until the storage retrieval completes.
        return true;
    }

    // If the message action is not recognized, return false or undefined (implicitly).
    // return false; // Uncomment if handling other message types
});

console.log("FilterTube Background Service Worker Loaded.");

