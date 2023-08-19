// Define the hide function
function hideSuggestionsByPreferences(filterKeywords, filterChannels) {
    const suggestions = document.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');

    suggestions.forEach(suggestion => {
        const videoTitleElement = suggestion.querySelector('#video-title');
        const videoTitle = videoTitleElement ? videoTitleElement.textContent.toLowerCase() : "";

        const channelNameElement = suggestion.querySelector('#channel-name .yt-simple-endpoint');
        const channelName = channelNameElement ? channelNameElement.textContent.toLowerCase() : "";

        // Check against keywords
        if (filterKeywords.split(',').some(keyword => videoTitle.includes(keyword.trim().toLowerCase()))) {
            suggestion.classList.add('hidden-video');
            return;
        }

        // Check against channels
        if (filterChannels.split(',').some(channel => channelName.includes(channel.trim().toLowerCase()))) {
            suggestion.classList.add('hidden-video');
            return;
        }
    });
}

// Load initial preferences and hide suggestions
chrome.storage.local.get(['keywords', 'channels'], function (items) {
    hideSuggestionsByPreferences(items.keywords || '', items.channels || '');
});

// Observe changes to the YouTube page and reapply the filters
const observer = new MutationObserver(() => {
    chrome.storage.local.get(['keywords', 'channels'], function (items) {
        hideSuggestionsByPreferences(items.keywords || '', items.channels || '');
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Listen for changes in preferences
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.keywords || changes.channels) {
        hideSuggestionsByPreferences(changes.keywords.newValue || '', changes.channels.newValue || '');
    }
});
