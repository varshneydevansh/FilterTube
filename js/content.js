let filterKeywords = '';
let filterChannels = '';

// Function to clear the cached filter values.
function clearCache() {
    filterKeywords = '';
    filterChannels = '';
}

// Load initial settings.
chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
    filterKeywords = items.filterKeywords || '';
    filterChannels = items.filterChannels || '';
    hideSuggestionsByPreferences(filterKeywords, filterChannels);
});

// Listen for storage changes and update cached values.
chrome.storage.onChanged.addListener(function (changes) {
    clearCache(); // Clear the cache when a change is detected.
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
        let channelNameElement = suggestion.querySelector('#channel-name, .yt-simple-endpoint');

        // Special handling for the channel page to avoid hiding the channel's own name and videos
        if (window.location.href.includes("/@")) {
            channelNameElement = suggestion.querySelector('.ytd-channel-name a.yt-simple-endpoint');
        }
        
        if (!videoTitleElement || !channelNameElement) {
            console.warn('YouTube structure might have changed! Please review the extension.');
            return;
        }

        const videoTitle = videoTitleElement.textContent.toLowerCase();
        const channelName = channelNameElement.textContent.toLowerCase();

        if (trimmedKeywords.some(keyword => videoTitle.includes(keyword))) {
            suggestion.classList.add('hidden-video');
        }
    });
}

let throttleTimeout = null;
const FILTER_DELAY = 1500; // 1.5 seconds

const observerCallback = (mutations) => {
    if (throttleTimeout) return;  // If already waiting to run, skip

    throttleTimeout = setTimeout(() => {
        hideSuggestionsByPreferences(filterKeywords, filterChannels);
        throttleTimeout = null;
    }, FILTER_DELAY);  // Runs once every FILTER_DELAY/1000 seconds
};

const observer = new MutationObserver(observerCallback);
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Handle YouTube's Gradual Page Transitions
setInterval(() => {
    hideSuggestionsByPreferences(filterKeywords, filterChannels);
}, FILTER_DELAY);
