// background.js

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({ filterKeywords: "", filterChannels: "" }, function () {
        console.log('Default filters set.');
    });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "applyFilters") {
        chrome.storage.local.get(["filterKeywords", "filterChannels", "filterCategories"], function (result) {
            sendResponse({ filterKeywords: result.filterKeywords, filterChannels: result.filterChannels, filterCategories: result.filterCategories });
        });

        return true; // Keeps the message channel open to the sender until sendResponse is called
    }
});

