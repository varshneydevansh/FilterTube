function hideSuggestionsByPreferences(filterKeywords, filterChannels) {
    const suggestions = document.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');

    const trimmedKeywords = filterKeywords.split(',').map(keyword => keyword.trim().toLowerCase());
    const trimmedChannels = filterChannels.split(',').map(channel => channel.trim().toLowerCase());

    suggestions.forEach(suggestion => {
        const videoTitleElement = suggestion.querySelector('#video-title');
        const channelNameElement = suggestion.querySelector('#channel-name .yt-simple-endpoint');

        if (!videoTitleElement || !channelNameElement) {
            console.warn('YouTube structure might have changed! Please review the extension.');
            return;
        }

        const videoTitle = videoTitleElement.textContent.toLowerCase();
        const channelName = channelNameElement.textContent.toLowerCase();

        if (trimmedKeywords.some(keyword => videoTitle.includes(keyword))) {
            suggestion.classList.add('hidden-video');
            return;
        }

        if (trimmedChannels.some(channel => channelName.includes(channel))) {
            suggestion.classList.add('hidden-video');
            return;
        }
    });
}

chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
    hideSuggestionsByPreferences(items.filterKeywords || '', items.filterChannels || '');
});

const observer = new MutationObserver(() => {
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
        hideSuggestionsByPreferences(items.filterKeywords || '', items.filterChannels || '');
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.filterKeywords || changes.filterChannels) {
        hideSuggestionsByPreferences(changes.filterKeywords.newValue || '', changes.filterChannels.newValue || '');
    }
});
