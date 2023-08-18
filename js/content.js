function hideSuggestionsByPreferences(filterKeywords, filterChannels) {
    const suggestions = document.querySelectorAll('ytd-compact-video-renderer');

    suggestions.forEach(suggestion => {
        const videoTitle = suggestion.querySelector('span#video-title').textContent.toLowerCase();
        
        // Logic to extract the channel name from the suggestion DOM
        const channelNameElement = suggestion.querySelector('yt-formatted-string.yt-simple-endpoint.style-scope.ytd-video-meta-block');
        const channelName = channelNameElement ? channelNameElement.textContent.toLowerCase() : ""; 

        // Check against keywords
        if (filterKeywords.split(',').some(keyword => videoTitle.includes(keyword.trim().toLowerCase()))) {
            suggestion.style.display = 'none';
            return; // Exit early if a match is found
        }

        // Check against channels
        if (filterChannels.split(',').some(channel => channelName.includes(channel.trim().toLowerCase()))) {
            suggestion.style.display = 'none';
            return; // Exit early if a match is found
        }
    });
}

chrome.storage.sync.get(['keywords', 'channels'], function(items) {
    console.log(items.keywords, items.channels);
});

// When the page is loaded or updated
chrome.storage.local.get(['keywords', 'channels'], function(items) {
    hideSuggestionsByPreferences(items.keywords || '', items.channels || '');
});

// Listen for changes in preferences
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
        hideSuggestionsByPreferences(changes.keywords.newValue || '', changes.channels.newValue || '');
    }
});
