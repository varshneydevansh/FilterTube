let filterKeywords = '';
let filterChannels = '';

// Load initial settings.
chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
    filterKeywords = items.filterKeywords || '';
    filterChannels = items.filterChannels || '';
    hideSuggestionsByPreferences(filterKeywords, filterChannels);
});

// Listen for storage changes and update cached values.
chrome.storage.onChanged.addListener(function (changes) {
    if (changes.filterKeywords) {
        filterKeywords = changes.filterKeywords.newValue || '';
    }
    if (changes.filterChannels) {
        filterChannels = changes.filterChannels.newValue || '';
    }
    hideSuggestionsByPreferences(filterKeywords, filterChannels);
});

function hideSuggestionsByPreferences(keywords, channels) {
    const trimmedKeywords = keywords.split(',').map(keyword => keyword.trim().toLowerCase());
    const trimmedChannels = channels.split(',').map(channel => channel.trim().toLowerCase());
    hideSuggestions(trimmedKeywords, trimmedChannels);
}

function hideSuggestions(trimmedKeywords, trimmedChannels, rootNode = document) {
    const suggestions = rootNode.querySelectorAll('ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer');

    suggestions.forEach(suggestion => {
        const videoTitleElement = suggestion.querySelector('#video-title');
        const channelNameElement = suggestion.querySelector('#channel-name, .yt-simple-endpoint');

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
        }
    });
}

let throttleTimeout = null;

const observerCallback = (mutations) => {
    if (throttleTimeout) return;  // If already waiting to run, skip

    throttleTimeout = setTimeout(() => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {  // Check if the added node is an element
                    hideSuggestions(filterKeywords.split(',').map(keyword => keyword.trim().toLowerCase()), filterChannels.split(',').map(channel => channel.trim().toLowerCase()), node);
                }
            });
        });
        throttleTimeout = null;
    }, 1000);  // Runs once every second
};

const observer = new MutationObserver(observerCallback);
observer.observe(document.body, {
    childList: true,
    subtree: true
});
