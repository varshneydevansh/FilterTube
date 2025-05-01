/**
 * Content script for the FilterTube extension.
 *
 * This script runs on youtube.com pages and is responsible for:
 * 1. Loading filter preferences (keywords, channels) from storage.
 * 2. Identifying video elements on the page.
 * 3. Checking video titles, channel names, and (TODO) descriptions against the filters.
 * 4. Hiding videos that match the filter criteria.
 * 5. Observing page changes (like infinite scrolling) to apply filters dynamically.
 */

// Global variables to cache filter settings from storage.
// Initialized as empty strings and populated by loadSettings.
let filterKeywords = '';
let filterChannels = '';

/**
 * Clears the cached filter values.
 * Called when storage changes to ensure fresh values are used.
 */
function clearCache() {
    filterKeywords = '';
    filterChannels = '';
    // In a more complex scenario, might need to immediately re-filter
    // but current logic re-filters after fetching new values anyway.
}

/**
 * Loads filter settings (keywords, channels) from chrome.storage.local
 * and initiates the first filtering pass.
 */
function loadSettings() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        // Perform initial filtering once settings are loaded.
        hideSuggestionsByPreferences(filterKeywords, filterChannels);
    });
}

// Load initial settings when the content script is injected.
loadSettings();

// Listen for changes in chrome.storage.local (e.g., when the user saves in the popup).
chrome.storage.onChanged.addListener(function (changes, areaName) {
    // Ensure the change happened in the 'local' storage area.
    if (areaName === 'local') {
        let needsRefilter = false;
        // Update cached keywords if they changed.
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || '';
            needsRefilter = true;
        }
        // Update cached channels if they changed.
        if (changes.filterChannels) {
            filterChannels = changes.filterChannels.newValue || '';
            needsRefilter = true;
        }
        // If any filter changed, re-apply the filtering logic to the page.
        if (needsRefilter) {
            hideSuggestionsByPreferences(filterKeywords, filterChannels);
        }
    }
});

/**
 * Prepares filter strings (keywords, channels) by splitting, trimming,
 * and converting to lowercase, then calls the main hiding logic.
 * @param {string} keywords - Comma-separated keywords string.
 * @param {string} channels - Comma-separated channel names string.
 */
function hideSuggestionsByPreferences(keywords, channels) {
    // Split strings into arrays, trim whitespace, filter out empty strings, and convert to lowercase.
    const trimmedKeywords = (keywords || '').split(',')
                                          .map(keyword => keyword.trim().toLowerCase())
                                          .filter(Boolean); // Remove empty strings resulting from extra commas
    const trimmedChannels = (channels || '').split(',')
                                           .map(channel => channel.trim().toLowerCase())
                                           .filter(Boolean); // Remove empty strings

    // Only proceed if there are actually filters defined.
    if (trimmedKeywords.length > 0 || trimmedChannels.length > 0) {
        // Hide individual videos first
        hideVideos(trimmedKeywords, trimmedChannels);
        // Then hide relevant playlists/shelves
        hidePlaylistsAndShelves(trimmedKeywords, trimmedChannels);
        // Then hide relevant channel elements
        hideChannelElements(trimmedKeywords, trimmedChannels);
        // Then hide shorts
        hideShorts(trimmedKeywords, trimmedChannels);

    } else {
        // Optional: If all filters are removed, unhide previously hidden videos/elements.
        document.querySelectorAll('.hidden-video').forEach(el => el.classList.remove('hidden-video'));
    }
}

/**
 * Finds individual video elements on the page and hides them based on keywords and channel names.
 * Targets various video renderers across different YouTube sections (home, search, watch page, etc.).
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by.
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hideVideos(trimmedKeywords, trimmedChannels, rootNode = document) {
    // Selectors for different types of video containers YouTube uses.
    // Added ytd-rich-grid-media (home page), ytd-watch-card-compact-video-renderer (playlists in search/channel), ytd-grid-video-renderer (channel page grids)
    const videoSelectors = [
        'ytd-video-renderer',           // Standard search results / recommendations
        'ytd-compact-video-renderer',   // Recommendations sidebar on watch page
        'ytd-grid-video-renderer',      // Grid view (e.g., channel page videos tab, subscriptions)
        'ytd-rich-item-renderer',       // Main home page feed items (often wrap grid/compact renderers)
        'ytd-watch-card-compact-video-renderer', // Videos within playlist/mix cards
        'ytd-channel-video-player-renderer' // Featured video on channel page
    ].join(', ');

    // Find potential video containers. Use try/catch for robustness.
    let suggestions = [];
    try {
        suggestions = rootNode.querySelectorAll(videoSelectors);
    } catch (e) {
        console.error('FilterTube: Error finding video elements with selectors:', videoSelectors, e);
        return;
    }

    suggestions.forEach(suggestion => {
        // Check if this element itself should be hidden or if it contains a nested video element
        // ytd-rich-item-renderer often contains another renderer like ytd-grid-video-renderer
        const actualVideoElement = suggestion.matches('ytd-rich-item-renderer')
                                    ? suggestion.querySelector('ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-video-renderer') || suggestion
                                    : suggestion;

        // Attempt to find elements within the actual video container or the broader suggestion container
        const videoTitleElement = actualVideoElement.querySelector('#video-title, #video-title-link yt-formatted-string');
        let channelNameElement = actualVideoElement.querySelector('#channel-name .yt-simple-endpoint, #channel-name a.yt-simple-endpoint, .ytd-channel-name a.yt-simple-endpoint, #channel-name yt-formatted-string');
        const descriptionElement = actualVideoElement.querySelector(
            'div.metadata-snippet-container yt-formatted-string.metadata-snippet-text, /* Search results snippet */' +
            '.metadata-snippet-text, /* Fallback snippet */' +
            '#description-text, /* General description */' +
            '.ytd-video-renderer #description .yt-formatted-string, /* Description within video renderer */' +
            '#description yt-formatted-string.content, /* Description on channel page */' +
            '#description-inline-expander' /* Expanded description container */
        );
        // Find hashtags within the broader suggestion container (including info line and description)
        const hashtagElements = suggestion.querySelectorAll('a.yt-simple-endpoint[href^="/hashtag/"]');
        // Find game card title within the broader suggestion container
        const gameCardTitleElement = suggestion.querySelector('ytd-rich-metadata-renderer #title');

        // If no title, it's likely not a standard video item we want to filter directly here
        if (!videoTitleElement) {
            // console.log('FilterTube: Skipping element, no title found:', suggestion); // Keep this commented unless debugging non-video items
            return;
        }

        // Fallback for channel name if primary selectors fail
        if (!channelNameElement) {
            channelNameElement = actualVideoElement.querySelector('yt-formatted-string.ytd-channel-name, #channel-name');
        }

        // Extract text content, convert to lowercase, and trim whitespace. Use empty string as default.
        const videoTitle = (videoTitleElement?.textContent || '').toLowerCase().trim();
        const channelName = (channelNameElement?.textContent || '').toLowerCase().trim();
        const descriptionText = (descriptionElement?.textContent || '').toLowerCase().trim();
        // Combine text from all found hashtags (remove the '#' prefix for matching)
        const hashtagText = Array.from(hashtagElements)
                                .map(el => (el.textContent || '').replace(/^#/, '').toLowerCase().trim())
                                .join(' '); // Join with space to treat as separate words
        const gameCardTitle = (gameCardTitleElement?.textContent || '').toLowerCase().trim();

        // --- Debugging Log ---
        /*
        console.log("FilterTube Scan:", {
             Title: videoTitle,
             Channel: channelName,
             Desc: descriptionText,
             Hashtags: hashtagText,
             GameCard: gameCardTitle,
             Element: suggestion
        });
        */
        // --- End Debugging Log ---

        let shouldHide = false;

        // 1. Check against blocked channel names.
        if (trimmedChannels.length > 0 && channelName && trimmedChannels.some(blockedChannel => channelName.includes(blockedChannel))) {
            // console.log(`FilterTube: Hiding [${videoTitle}] due to channel: ${channelName}`);
            shouldHide = true;
        }

        // 2. Check keywords against title, channel name, description, hashtags, and game card title (if not already hidden).
        if (!shouldHide && trimmedKeywords.length > 0) {
            const checkText = (text) => text && trimmedKeywords.some(keyword => text.includes(keyword));

            if (checkText(videoTitle)) {
                // console.log(`FilterTube: Hiding [${videoTitle}] due to title keyword.`);
                shouldHide = true;
            }
            else if (checkText(channelName)) {
                // console.log(`FilterTube: Hiding [${videoTitle}] due to channel name keyword.`);
                shouldHide = true;
            }
            else if (checkText(descriptionText)) {
                // console.log(`FilterTube: Hiding [${videoTitle}] due to description keyword.`);
                shouldHide = true;
            }
            else if (checkText(hashtagText)) {
                // console.log(`FilterTube: Hiding [${videoTitle}] due to hashtag keyword.`);
                shouldHide = true;
            }
            else if (checkText(gameCardTitle)) {
                // console.log(`FilterTube: Hiding [${videoTitle}] due to game card title keyword.`);
                shouldHide = true;
            }
        }

        // Apply or remove the 'hidden-video' class to the original container (suggestion)
        if (shouldHide) {
            suggestion.classList.add('hidden-video');
        } else {
            suggestion.classList.remove('hidden-video');
        }
    });
}

/**
 * Finds and hides playlist/shelf elements if their title matches keywords
 * or if their associated channel matches blocked channels.
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by.
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hidePlaylistsAndShelves(trimmedKeywords, trimmedChannels, rootNode = document) {
    // Selectors for playlist/shelf containers - Added ytd-universal-watch-card-renderer
    const shelfSelectors = [
        'ytd-shelf-renderer',                   // Generic shelf (e.g., channel page)
        'ytd-reel-shelf-renderer',              // Shelf containing Shorts
        'ytd-horizontal-card-list-renderer',    // Another type of horizontal list/shelf
        'ytd-universal-watch-card-renderer'     // Playlist/Mix card in search results
        // Removed ytd-watch-card-rich-header-renderer as it's *inside* the universal card
    ].join(', ');

    let shelves = [];
    try {
        shelves = rootNode.querySelectorAll(shelfSelectors);
    } catch (e) {
        console.error('FilterTube: Error finding shelf/card elements with selectors:', shelfSelectors, e);
        return;
    }

    shelves.forEach(shelf => {
        let titleElement = null;
        let channelElement = null;
        let titleText = '';
        let channelText = '';
        let shouldHide = false;

        // --- Logic specific to ytd-universal-watch-card-renderer ---
        if (shelf.matches('ytd-universal-watch-card-renderer')) {
            // Try finding the title in the hero section first
            titleElement = shelf.querySelector('ytd-watch-card-hero-video-renderer #watch-card-title yt-formatted-string');
            // Try finding the channel name in the header
            channelElement = shelf.querySelector('ytd-watch-card-rich-header-renderer ytd-channel-name yt-formatted-string#text');

            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            channelText = (channelElement?.textContent || '').toLowerCase().trim();

            // Hide if playlist title contains a keyword
            if (trimmedKeywords.length > 0 && titleText && trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                // console.log(`FilterTube: Hiding Universal Card [${titleText}] due to keyword in title.`);
                shouldHide = true;
            }
            // Hide if channel name contains a keyword (often the playlist title for official channels)
            else if (!shouldHide && trimmedKeywords.length > 0 && channelText && trimmedKeywords.some(keyword => channelText.includes(keyword))) {
                // console.log(`FilterTube: Hiding Universal Card [${titleText || channelText}] due to keyword in channel name.`);
                shouldHide = true;
            }
            // Hide if channel name is in the blocked list
            else if (!shouldHide && trimmedChannels.length > 0 && channelText && trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
                // console.log(`FilterTube: Hiding Universal Card [${titleText || channelText}] due to blocked channel: ${channelText}`);
                shouldHide = true;
            }
        }
        // --- Logic for other shelf types ---
        else {
            // Find title and channel elements within the shelf (existing logic)
            titleElement = shelf.querySelector('#title, #shelf-title, .ytd-shelf-renderer #title span'); // Simplified title selector
            channelElement = shelf.querySelector('ytd-channel-name #text a'); // Common pattern for channel link in headers

            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            channelText = (channelElement?.textContent || '').toLowerCase().trim();

            // Hide if shelf title contains a keyword
            if (trimmedKeywords.length > 0 && titleText && trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                // console.log(`FilterTube: Hiding Shelf [${titleText}] due to keyword.`);
                shouldHide = true;
            }
            // Hide if shelf's associated channel is blocked
            else if (!shouldHide && trimmedChannels.length > 0 && channelText && trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
                // console.log(`FilterTube: Hiding Shelf [${titleText}] due to blocked channel: ${channelText}`);
                shouldHide = true;
            }
        }


        // Apply or remove the class based on the check results.
        if (shouldHide) {
            shelf.classList.add('hidden-video'); // Reuse class for simplicity
        } else {
            // If the shelf itself shouldn't be hidden, ensure it's visible
            // and let hideVideos handle filtering individual items within it (if applicable).
            shelf.classList.remove('hidden-video');
        }
    });
}

/**
 * Finds and hides channel elements (links, cards) if the channel name matches.
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by (check if channel name contains keyword).
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hideChannelElements(trimmedKeywords, trimmedChannels, rootNode = document) {
    const channelSelectors = [
        'ytd-channel-renderer',      // Channel result in search
        'ytd-grid-channel-renderer' // Channel card in grids/shelves
    ].join(', ');

    let channelElements = [];
    try {
        channelElements = rootNode.querySelectorAll(channelSelectors);
    } catch (e) {
        console.error('FilterTube: Error finding channel elements with selectors:', channelSelectors, e);
        return;
    }

    channelElements.forEach(channelElement => {
        const nameElement = channelElement.querySelector('#channel-title, #title'); // Common selectors for channel name within these renderers
        const channelName = (nameElement?.textContent || '').toLowerCase().trim();

        let shouldHide = false;

        // Hide if channel name is in the blocked channels list
        if (trimmedChannels.length > 0 && channelName && trimmedChannels.some(blockedChannel => channelName.includes(blockedChannel))) {
            shouldHide = true;
        }
        // Hide if channel name contains a blocked keyword
        else if (trimmedKeywords.length > 0 && channelName && trimmedKeywords.some(keyword => channelName.includes(keyword))) {
            shouldHide = true;
        }

        if (shouldHide) {
            channelElement.classList.add('hidden-video');
        } else {
            channelElement.classList.remove('hidden-video');
        }
    });
}

/**
 * Finds and hides YouTube Shorts elements.
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by.
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hideShorts(trimmedKeywords, trimmedChannels, rootNode = document) {
    // Selector for Shorts items (may need adjustments based on YT updates)
    const shortsSelector = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model'; // Covers desktop and potentially mobile web structures

    let shortsItems = [];
    try {
        shortsItems = rootNode.querySelectorAll(shortsSelector);
    } catch(e) {
        console.error('FilterTube: Error finding Shorts elements:', e);
        return;
    }

    shortsItems.forEach(item => {
        const titleElement = item.querySelector('#video-title, .shortsLockupViewModelHostMetadataTitle');
        const channelElement = item.querySelector('#channel-name .yt-simple-endpoint, .shortsLockupViewModelHostMetadataTitle'); // Shorts channel name might be less consistently identifiable, sometimes part of title

        const titleText = (titleElement?.textContent || '').toLowerCase().trim();
        // Channel name extraction for shorts might be less reliable
        const channelText = (channelElement && channelElement !== titleElement ? channelElement.textContent : '').toLowerCase().trim();

        let shouldHide = false;

        // Check channel first
        if (trimmedChannels.length > 0 && channelText && trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
             shouldHide = true;
        }

        // Check keywords in title (and potentially channel text if extracted)
        if (!shouldHide && trimmedKeywords.length > 0) {
            if (titleText && trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                shouldHide = true;
            }
            // Optional: check channel text again for keywords if relevant
            // else if (channelText && trimmedKeywords.some(keyword => channelText.includes(keyword))) {
            //    shouldHide = true;
            // }
        }

        if (shouldHide) {
            item.classList.add('hidden-video');
        } else {
            item.classList.remove('hidden-video');
        }
    });
}

// --- Dynamic Content Handling (MutationObserver & Interval) ---

// Use throttling to prevent the filter function from running too often during rapid DOM changes.
let throttleTimeout = null;
const FILTER_DELAY = 1000; // Reduced delay to 1 second for potentially faster updates

/**
 * Callback function for the MutationObserver.
 * It throttles the execution of hideSuggestionsByPreferences.
 * @param {MutationRecord[]} mutations - An array of mutation records (not directly used here).
 * @param {MutationObserver} observer - The observer instance.
 */
const observerCallback = (mutations, observer) => {
    // If a timeout is already set, it means filtering is scheduled; do nothing.
    if (throttleTimeout) return;

    // Set a timeout to run the filtering logic after FILTER_DELAY milliseconds.
    throttleTimeout = setTimeout(() => {
        console.log("FilterTube: Applying filters due to DOM change."); // Added log
        // Call the main preference function which now handles all element types
        hideSuggestionsByPreferences(filterKeywords, filterChannels);
        // Reset the timeout ID so the next mutation can schedule a new run.
        throttleTimeout = null;
    }, FILTER_DELAY);
};

// Create a MutationObserver instance with the callback.
const observer = new MutationObserver(observerCallback);

// Configuration for the observer:
// - childList: Watch for additions/removals of child nodes.
// - subtree: Watch for changes in all descendants of the target node.
const observerConfig = {
    childList: true,
    subtree: true
};

// Start observing the document body for configured mutations.
// Using document.body is broad but necessary to catch dynamically loaded content anywhere.
observer.observe(document.body, observerConfig);

// Fallback mechanism: Periodically re-apply filters using setInterval.
// This can catch videos missed by the MutationObserver, especially during complex page transitions or if the observer fails.
// Note: This adds some overhead, but ensures filters are applied eventually.
const intervalCheck = setInterval(() => {
    // console.log("FilterTube: Applying filters via interval check."); // Can be noisy, keep commented unless debugging
    // Call the main preference function which now handles all element types
    hideSuggestionsByPreferences(filterKeywords, filterChannels);
}, FILTER_DELAY * 3); // Run less frequently than the mutation observer throttle delay

// Optional: Clean up observer and interval when the script unloads (e.g., page navigation)
// This isn't strictly necessary for content scripts usually, but good practice.
window.addEventListener('unload', () => {
    if (observer) {
        observer.disconnect();
    }
    if (intervalCheck) {
        clearInterval(intervalCheck);
    }
    if (throttleTimeout) {
        clearTimeout(throttleTimeout);
    }
    console.log("FilterTube: Cleaned up observer and interval.");
});

console.log("FilterTube Content Script Loaded"); // Confirmation message
