// background.js

chrome.runtime.onInstalled.addListener(function() {
    // Initialization tasks can be done here, e.g. setting default storage values
    chrome.storage.local.set({ filterKeywords: "", filterChannels: "", filterCategories: "" }, function() {
        console.log('Default filters set.');
    });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "applyFilters") {
        chrome.storage.local.get(["filterKeywords", "filterChannels", "filterCategories"], function(result) {
            sendResponse({ filterKeywords: result.filterKeywords, filterChannels: result.filterChannels, filterCategories: result.filterCategories });
        });

        return true; // Keeps the message channel open to the sender until sendResponse is called
    }
});

