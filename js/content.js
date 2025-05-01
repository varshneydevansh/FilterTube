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
        const actualVideoElement = suggestion.matches('ytd-rich-item-renderer')
                                    ? suggestion.querySelector('ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-video-renderer') || suggestion
                                    : suggestion;

        const videoTitleElement = actualVideoElement.querySelector('#video-title, #video-title-link yt-formatted-string');
        let channelNameElement = actualVideoElement.querySelector('#channel-name .yt-simple-endpoint, #channel-name a.yt-simple-endpoint, .ytd-channel-name a.yt-simple-endpoint, #channel-name yt-formatted-string');

        // --- SELECTOR REFINEMENT V3 FOR SEARCH RESULTS ---
        // Description Snippet: Focus specifically on the metadata snippet classes/container
        const descriptionElement = actualVideoElement.querySelector(
            'yt-formatted-string.metadata-snippet-text, ' + // Primary target class
            '.metadata-snippet-container yt-formatted-string.metadata-snippet-text'
            // Keep watch page selector as fallback
            // ', #description-inline-expander .yt-core-attributed-string'
        );

        // Hashtags: Look primarily *inside* the found description snippet, fallback to metadata line
        let hashtagElements = [];
        if (descriptionElement) {
             // Look for hashtags linked within the description snippet element itself
            hashtagElements = descriptionElement.querySelectorAll('a[href^="/hashtag/"]');
        }
        // If none found in snippet, check the metadata line (sibling/nearby element)
        if (hashtagElements.length === 0) {
            hashtagElements = actualVideoElement.querySelectorAll('#metadata-line a[href^="/hashtag/"]');
        }
         // --- END SELECTOR REFINEMENT ---

        const gameCardTitleElement = suggestion.querySelector('ytd-rich-metadata-renderer #title');

        // Skip processing if essential element (like title) isn't found for a video card
        if (!videoTitleElement && suggestion.matches('ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer')) {
             // console.warn("FilterTube: Skipping potential video item with no title:", suggestion);
            return;
        }

        // Fallback for channel name
        if (!channelNameElement && actualVideoElement.querySelector('#channel-name')) { // Added check to avoid error if #channel-name doesn't exist
            channelNameElement = actualVideoElement.querySelector('yt-formatted-string.ytd-channel-name, #channel-name');
        }

        // Extract text content
        const videoTitle = (videoTitleElement?.textContent || '').toLowerCase().trim();
        const channelName = (channelNameElement?.textContent || '').toLowerCase().trim();
        const descriptionText = (descriptionElement?.textContent || '').toLowerCase().trim();
        const hashtagRawTexts = Array.from(hashtagElements).map(el => el.textContent || '');
        const hashtagText = hashtagRawTexts.map(ht => ht.replace(/^#/, '').toLowerCase().trim()).filter(Boolean).join(' ');
        const gameCardTitle = (gameCardTitleElement?.textContent || '').toLowerCase().trim();
        const combinedDescAndHashtags = (descriptionText + ' ' + hashtagText).trim().toLowerCase();

        // --- Debugging Log (Comment out when working) ---
        /*
        console.log("FilterTube Scan (hideVideos):", {
             Title: videoTitle,
             Channel: channelName,
             DescElementFound: descriptionElement ? 'Yes' : 'No',
             DescRawHTML: descriptionElement?.outerHTML || 'Desc Element Not Found',
             DescProcessed: descriptionText,
             HashtagsElementSelectorContext: descriptionElement ? 'Inside Desc Element' : '#metadata-line',
             HashtagsRaw: hashtagRawTexts.join(', ') || 'No Hashtags Found',
             HashtagsProcessed: hashtagText,
             CombinedDescHashtags: combinedDescAndHashtags,
             GameCard: gameCardTitle,
             Element: suggestion
        });
        */
        // --- End Debugging Log ---

        let shouldHide = false; // Determine if it SHOULD be hidden

        // 1. Check against blocked channel names.
        if (trimmedChannels.length > 0 && channelName && trimmedChannels.some(blockedChannel => channelName.includes(blockedChannel))) {
            shouldHide = true;
        }

        // 2. Check keywords against title, channel name, combined desc/hashtags, game card
        if (!shouldHide && trimmedKeywords.length > 0) {
            const checkText = (text) => text && trimmedKeywords.some(keyword => text.includes(keyword));
            if (checkText(videoTitle) || checkText(channelName) || (combinedDescAndHashtags && checkText(combinedDescAndHashtags)) || checkText(gameCardTitle)) {
                shouldHide = true;
            }
        }

        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            suggestion.classList.add('filter-tube-visible');
        } else {
            // Ensure it remains hidden (or explicitly hide if needed, though CSS should handle it)
             suggestion.classList.remove('filter-tube-visible');
             // suggestion.classList.add('hidden-video'); // Optional: Can explicitly add hidden-video too
        }
    });
}

/**
 * Finds and hides playlist/shelf/mix elements if their title matches keywords
 * or if their associated channel matches blocked channels.
 * Updated: Adds .filter-tube-visible class to elements that should NOT be hidden.
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by.
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hidePlaylistsAndShelves(trimmedKeywords, trimmedChannels, rootNode = document) {
    const containerSelectors = [
        'ytd-shelf-renderer',
        'ytd-reel-shelf-renderer',
        'ytd-horizontal-card-list-renderer',
        'ytd-universal-watch-card-renderer',
        'ytd-radio-renderer'
    ].join(', ');

    let containers = [];
    try {
        containers = rootNode.querySelectorAll(containerSelectors);
    } catch (e) {
        console.error('FilterTube: Error finding shelf/card/mix elements:', containerSelectors, e);
        return;
    }

    containers.forEach(container => {
        let titleElement = null;
        let channelElement = null;
        let titleText = '';
        let channelText = '';
        let shouldHide = false; // Determine if it SHOULD be hidden

        // Logic to find title/channel and set shouldHide based on type
        if (container.matches('ytd-universal-watch-card-renderer')) {
            titleElement = container.querySelector('ytd-watch-card-hero-video-renderer #watch-card-title yt-formatted-string');
            channelElement = container.querySelector('ytd-watch-card-rich-header-renderer ytd-channel-name yt-formatted-string#text');
            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            channelText = (channelElement?.textContent || '').toLowerCase().trim();
            if (trimmedKeywords.some(keyword => titleText.includes(keyword) || channelText.includes(keyword)) ||
                trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
                shouldHide = true;
            }
        } else if (container.matches('ytd-radio-renderer')) {
            titleElement = container.querySelector('.yt-lockup-metadata-view-model-wiz__title span.yt-core-attributed-string');
            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            if (trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                shouldHide = true;
            }
        } else { // Other shelf types
            titleElement = container.querySelector('#title, #shelf-title, .ytd-shelf-renderer #title span');
            channelElement = container.querySelector('ytd-channel-name #text a');
            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            channelText = (channelElement?.textContent || '').toLowerCase().trim();
            if (trimmedKeywords.some(keyword => titleText.includes(keyword)) ||
                trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
                shouldHide = true;
            }
        }

        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            container.classList.add('filter-tube-visible');
        } else {
            container.classList.remove('filter-tube-visible');
        }
    });
}

/**
 * Finds and hides channel elements (links, cards) if the channel name matches keywords or blocked list.
 * Updated: Adds .filter-tube-visible class to elements that should NOT be hidden.
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
        console.error('FilterTube: Error finding channel elements:', channelSelectors, e);
        return;
    }

    channelElements.forEach(channelElement => {
        const nameElement = channelElement.querySelector('#channel-title, #title');
        const channelName = (nameElement?.textContent || '').toLowerCase().trim();
        let shouldHide = false; // Determine if it SHOULD be hidden

        if ((trimmedChannels.length > 0 && channelName && trimmedChannels.some(blockedChannel => channelName.includes(blockedChannel))) ||
            (trimmedKeywords.length > 0 && channelName && trimmedKeywords.some(keyword => channelName.includes(keyword)))) {
            shouldHide = true;
        }

        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            channelElement.classList.add('filter-tube-visible');
        } else {
            channelElement.classList.remove('filter-tube-visible');
        }
    });
}

/**
 * Finds and hides YouTube Shorts elements.
 * Updated: Adds .filter-tube-visible class to elements that should NOT be hidden.
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by.
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by.
 * @param {Node} rootNode - The root element to search within (defaults to document).
 */
function hideShorts(trimmedKeywords, trimmedChannels, rootNode = document) {
    const shortsSelector = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model';

    let shortsItems = [];
    try {
        shortsItems = rootNode.querySelectorAll(shortsSelector);
    } catch(e) {
        console.error('FilterTube: Error finding Shorts elements:', e);
        return;
    }

    shortsItems.forEach(item => {
        const titleElement = item.querySelector('#video-title, .shortsLockupViewModelHostMetadataTitle');
        const channelElement = item.querySelector('#channel-name .yt-simple-endpoint, .shortsLockupViewModelHostMetadataTitle');
        const titleText = (titleElement?.textContent || '').toLowerCase().trim();
        const channelText = (channelElement && channelElement !== titleElement ? channelElement.textContent : '').toLowerCase().trim();
        let shouldHide = false; // Determine if it SHOULD be hidden

        if ((trimmedChannels.length > 0 && channelText && trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) ||
            (trimmedKeywords.length > 0 && titleText && trimmedKeywords.some(keyword => titleText.includes(keyword)))) {
            // Optional: check channel text again for keywords if relevant
            // || (trimmedKeywords.length > 0 && channelText && trimmedKeywords.some(keyword => channelText.includes(keyword)))
             shouldHide = true;
        }

        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            item.classList.add('filter-tube-visible');
        } else {
            item.classList.remove('filter-tube-visible');
        }
    });
}

// --- Dynamic Content Handling (MutationObserver & Interval) ---

let throttleTimeout = null;
const FILTER_DELAY = 500; // Shortened delay slightly, as initial hide is faster

/**
 * Main filtering function called on load and on changes.
 * Applies the inverted logic (revealing wanted content).
 */
function applyFilters(keywords, channels) {
    const trimmedKeywords = (keywords || '').split(',')
                                          .map(keyword => keyword.trim().toLowerCase())
                                          .filter(Boolean);
    const trimmedChannels = (channels || '').split(',')
                                           .map(channel => channel.trim().toLowerCase())
                                           .filter(Boolean);

    // Combine all relevant selectors
    const allSelectors = [
        'ytd-video-renderer',
        'ytd-compact-video-renderer',
        'ytd-grid-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-watch-card-compact-video-renderer',
        'ytd-channel-video-player-renderer',
        'ytd-shelf-renderer',
        'ytd-reel-shelf-renderer',
        'ytd-horizontal-card-list-renderer',
        'ytd-universal-watch-card-renderer',
        'ytd-radio-renderer',
        'ytd-channel-renderer',
        'ytd-grid-channel-renderer',
        'ytd-reel-item-renderer',
        'ytm-shorts-lockup-view-model'
    ].join(', ');

    // If no filters are set, reveal ALL initially hidden items
    if (trimmedKeywords.length === 0 && trimmedChannels.length === 0) {
        try {
            document.querySelectorAll(allSelectors).forEach(el => {
                el.classList.add('filter-tube-visible');
                el.classList.remove('hidden-video'); // Clean up old class if present
            });
        } catch (e) {
             console.error("FilterTube: Error revealing all elements:", e);
        }
        return; // Stop processing if no filters
    }

    // Run filtering logic for each type of element
    // These functions now add .filter-tube-visible if item should be shown
    hideVideos(trimmedKeywords, trimmedChannels); // Renaming is misleading now, but keeps structure
    hidePlaylistsAndShelves(trimmedKeywords, trimmedChannels);
    hideChannelElements(trimmedKeywords, trimmedChannels);
    hideShorts(trimmedKeywords, trimmedChannels);
}

/**
 * Callback function for the MutationObserver.
 * It throttles the execution of applyFilters.
 * @param {MutationRecord[]} mutations - An array of mutation records.
 * @param {MutationObserver} observer - The observer instance.
 */
const observerCallback = (mutations, observer) => {
    // Optimization: Check if any added nodes *could* be relevant containers before scheduling
    let potentiallyRelevantChange = false;
    for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                // Quick check if the added node itself or its children might match our selectors
                // This is imperfect but avoids running filters for totally unrelated DOM changes
                if (node.nodeType === Node.ELEMENT_NODE && (
                    node.matches(allSelectors) || node.querySelector(allSelectors)
                 )) {
                    potentiallyRelevantChange = true;
                    break;
                }
            }
        }
        if (potentiallyRelevantChange) break;
    }

    if (!potentiallyRelevantChange) return; // Skip if no relevant nodes were likely added

    if (throttleTimeout) return;

    throttleTimeout = setTimeout(() => {
        console.log("FilterTube: Applying filters due to potential relevant DOM change.");
        applyFilters(filterKeywords, filterChannels);
        throttleTimeout = null;
    }, FILTER_DELAY);
};

// Create a MutationObserver instance with the callback.
const observer = new MutationObserver(observerCallback);

// Configuration for the observer:
const observerConfig = {
    childList: true,
    subtree: true
};

// Get all selectors for observer check (defined within applyFilters scope)
const allSelectors = [
    'ytd-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-watch-card-compact-video-renderer',
    'ytd-channel-video-player-renderer',
    'ytd-shelf-renderer',
    'ytd-reel-shelf-renderer',
    'ytd-horizontal-card-list-renderer',
    'ytd-universal-watch-card-renderer',
    'ytd-radio-renderer',
    'ytd-channel-renderer',
    'ytd-grid-channel-renderer',
    'ytd-reel-item-renderer',
    'ytm-shorts-lockup-view-model'
].join(', ');

// Start observing the document body
// Wait for body to exist if running at document_start
if (document.body) {
    observer.observe(document.body, observerConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if(document.body) { // Double check
             observer.observe(document.body, observerConfig);
        }
    });
}

// Initial load and storage change handling
function loadAndApplyInitialFilters() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        applyFilters(filterKeywords, filterChannels); // Initial filter application
    });
}

// Load initial settings when the script runs (now document_start)
// Wait slightly for the body to likely exist, or use DOMContentLoaded
if (document.readyState === 'loading') { // Or 'interactive' or 'complete'
    document.addEventListener('DOMContentLoaded', loadAndApplyInitialFilters);
} else {
    loadAndApplyInitialFilters(); // Already loaded
}

// Listen for changes in chrome.storage.local
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'local') {
        let needsRefilter = false;
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || '';
            needsRefilter = true;
        }
        if (changes.filterChannels) {
            filterChannels = changes.filterChannels.newValue || '';
            needsRefilter = true;
        }
        if (needsRefilter) {
            applyFilters(filterKeywords, filterChannels);
        }
    }
});

// Fallback interval check - less critical now but can remain as safety net
const intervalCheck = setInterval(() => {
    // console.log("FilterTube: Applying filters via interval check.");
    applyFilters(filterKeywords, filterChannels);
}, FILTER_DELAY * 5); // Run much less frequently

window.addEventListener('unload', () => {
    if (observer) observer.disconnect();
    if (intervalCheck) clearInterval(intervalCheck);
    if (throttleTimeout) clearTimeout(throttleTimeout);
    console.log("FilterTube: Cleaned up observer and interval.");
});

console.log("FilterTube Content Script Loaded (run_at=document_start)");
