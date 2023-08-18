// background.js

chrome.runtime.onInstalled.addListener(function() {
    // Initialization tasks can be done here, e.g. setting default storage values

    // For instance, you can set up default filters or any setup related data
    chrome.storage.sync.set({ filterKeywords: "", filterChannels: "", filterCategories: "" }, function() {
        console.log('Default filters set.');
    });
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action == "applyFilters") {
            // If you receive a message to apply filters, 
            // you can fetch filters from storage and then send them to content script
            
            chrome.storage.sync.get(["filterKeywords", "filterChannels", "filterCategories"], function(result) {
                sendResponse({ filterKeywords: result.filterKeywords, filterChannels: result.filterChannels, filterCategories: result.filterCategories });
            });

            // This will keep the message channel open to the sender until sendResponse is called
            return true;
        }
    }
);
