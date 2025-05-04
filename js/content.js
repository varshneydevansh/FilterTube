/**
 * Content script for the FilterTube extension.
 *
 * This script runs on youtube.com pages and is responsible for:
 * 1. Loading filter preferences (keywords, channels) from storage.
 * 2. Identifying video elements on the page.
 * 3. Checking video titles, channel names, and (TODO) descriptions against the filters.
 * 4. Hiding videos that match the filter criteria.
 * 5. Observing page changes (like infinite scrolling) to apply filters dynamically.
 * 6. Filtering comments based on user preferences.
 */

// Global variables to cache filter settings from storage.
// Initialized as empty strings and populated by loadSettings.
let filterKeywords = '';
let filterChannels = '';
let hideAllComments = false;
let hideFilteredComments = false;

/**
 * Channel mapping cache to store relationships between channel IDs and handles
 * Format: { 'channelId': '@handle', 'UCtxdfwb9wfkoGocVUAJ-Bmg': '@TravisScottXX' }
 */
const channelMappingCache = {};

/**
 * TODO: Future feature - Channel ID to Handle mapping
 * 
 * Potential enhancement: Develop a more robust system to automatically map channel IDs to handles
 * This would allow users to block a channel using either format and have it work consistently
 * 
 * Approach:
 * 1. When encountering a new channel ID, extract handle from page if possible
 * 2. Store the mapping in local storage for persistence across sessions
 * 3. Possibly add an API call to YouTube's API to fetch channel details (would require user API key)
 * 4. Consider building a small community-sourced database of common channel ID to handle mappings
 *
 * Current limitations:
 * - Handle extraction is only possible when the handle is visible in the DOM
 * - There's no persistent storage of mappings between sessions
 * - We can't proactively fetch mappings for channels not yet encountered
 */

/**
 * Clears the cached filter values.
 * Called when storage changes to ensure fresh values are used.
 */
function clearCache() {
    filterKeywords = '';
    filterChannels = '';
    hideAllComments = false;
    hideFilteredComments = false;
    // In a more complex scenario, might need to immediately re-filter
    // but current logic re-filters after fetching new values anyway.
}

/**
 * Loads filter settings (keywords, channels) from chrome.storage.local
 * and initiates the first filtering pass.
 */
function loadSettings() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels', 'hideAllComments', 'hideFilteredComments'], function (items) {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        hideAllComments = items.hideAllComments || false;
        hideFilteredComments = items.hideFilteredComments || false;
        
        // Perform initial filtering once settings are loaded.
        hideSuggestionsByPreferences(filterKeywords, filterChannels);
        
        // Apply comment filtering if on a watch page
        if (window.location.pathname.startsWith('/watch')) {
            applyCommentFiltering();
        }
    });
}

// Load initial settings when the content script is injected.
loadSettings();

// Listen for changes in chrome.storage.local (e.g., when the user saves in the popup).
chrome.storage.onChanged.addListener(function (changes, areaName) {
    // Ensure the change happened in the 'local' storage area.
    if (areaName === 'local') {
        let needsRefilter = false;
        let needsCommentRefilter = false;
        
        // Update cached keywords if they changed.
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || '';
            needsRefilter = true;
            needsCommentRefilter = true;
        }
        // Update cached channels if they changed.
        if (changes.filterChannels) {
            filterChannels = changes.filterChannels.newValue || '';
            needsRefilter = true;
        }
        // Update comment filtering options if they changed
        if (changes.hideAllComments) {
            hideAllComments = changes.hideAllComments.newValue || false;
            needsCommentRefilter = true;
        }
        if (changes.hideFilteredComments) {
            hideFilteredComments = changes.hideFilteredComments.newValue || false;
            needsCommentRefilter = true;
        }
        
        // If any filter changed, re-apply the filtering logic to the page.
        if (needsRefilter) {
            hideSuggestionsByPreferences(filterKeywords, filterChannels);
        }
        
        // If comment filtering options changed and we're on a watch page
        if (needsCommentRefilter && window.location.pathname.startsWith('/watch')) {
            applyCommentFiltering();
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
 * Extracts channel information (name and handle) more aggressively from various elements
 * @param {HTMLElement} element - The element to extract channel info from
 * @returns {Object} - Object with channelName and channelHandle properties
 */
function extractChannelInfo(element) {
    // Default empty values
    let channelName = '';
    let channelHandle = '';
    
    // Try multiple selectors for channel name
    const nameSelectors = [
        '#channel-name .yt-simple-endpoint', 
        '#channel-name a.yt-simple-endpoint', 
        '.ytd-channel-name a.yt-simple-endpoint', 
        '#channel-name yt-formatted-string',
        '#text'
    ];
    
    // Try each selector until we find one that works
    for (const selector of nameSelectors) {
        const nameElement = element.querySelector(selector);
        if (nameElement && nameElement.textContent.trim()) {
            channelName = nameElement.textContent.toLowerCase().trim();
            break;
        }
    }
    
    // Look for channel links - try multiple types
    const channelLinks = [...element.querySelectorAll('a[href^="/@"], a[href^="/channel/"], a[href*="/@"], a[href*="/channel/"]')];
    
    if (channelLinks.length > 0) {
        for (const link of channelLinks) {
            const href = link.getAttribute('href') || '';
            
            // Extract handle (@username)
            if (href && href.includes('/@')) {
                const handleMatch = href.match(/\/@([^\/\?]+)/);
                if (handleMatch && handleMatch[1]) {
                    channelHandle = '@' + handleMatch[1].toLowerCase();
                    break;
                }
            }
            // Extract channel ID
            else if (href && href.includes('/channel/')) {
                const channelIdMatch = href.match(/\/channel\/([\w-]+)/);
                if (channelIdMatch && channelIdMatch[1]) {
                    channelHandle = 'channel/' + channelIdMatch[1];
                    break;
                }
            }
        }
    }
    
    // If no handle found from links, try text content that might contain @ handles
    if (!channelHandle || !channelHandle.startsWith('@')) {
        const allTexts = Array.from(element.querySelectorAll('yt-formatted-string, span, a'))
            .map(el => el.textContent.trim())
            .filter(text => text.includes('@'));
        
        for (const text of allTexts) {
            const handleMatch = text.match(/@(\w+)/);
            if (handleMatch && handleMatch[1]) {
                channelHandle = '@' + handleMatch[1].toLowerCase();
                break;
            }
        }
    }
    
    return { channelName, channelHandle };
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
    const videoSelectors = [
        'ytd-video-renderer',           // Standard search results / recommendations
        'ytd-compact-video-renderer',   // Recommendations sidebar on watch page
        'ytd-grid-video-renderer',      // Grid view (e.g., channel page videos tab, subscriptions)
        'ytd-rich-item-renderer',       // Main home page feed items (often wrap grid/compact renderers)
        'ytd-watch-card-compact-video-renderer', // Videos within playlist/mix cards
        'ytd-channel-video-player-renderer', // Featured video on channel page
        'yt-lockup-view-model',         // Mix results on search page
        'ytd-radio-renderer',           // Mix/radio cards
        'ytd-playlist-renderer',        // Playlist cards
        'ytd-movie-renderer',           // YouTube Movies content (buy/rent movies)
        'ytd-mix-renderer',             // Mix playlist items 
        'ytd-reel-video-renderer',      // Shorts in search results
        'ytd-search-refinement-card-renderer'  // Search refinements
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
        
        // Use enhanced channel extraction
        const channelInfo = extractChannelInfo(actualVideoElement);
        const channelName = channelInfo.channelName;
        const channelHandle = channelInfo.channelHandle;
        
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

        // Extract text content
        const videoTitle = (videoTitleElement?.textContent || '').toLowerCase().trim();
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
             ChannelHandle: channelHandle,
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
        if (trimmedChannels.length > 0 && (channelName || channelHandle)) {
            // Use our new channel filtering logic
            if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
                shouldHide = true;
            }
        }

        // 2. Check keywords against title, channel name, combined desc/hashtags, game card
        if (!shouldHide && trimmedKeywords.length > 0) {
            const checkText = (text) => text && trimmedKeywords.some(keyword => text.includes(keyword));
            if (checkText(videoTitle) || checkText(channelName) || (combinedDescAndHashtags && checkText(combinedDescAndHashtags)) || checkText(gameCardTitle)) {
                shouldHide = true;
            }
        }

        // Check for Mix results which have a different structure
        const mixTitleElement = suggestion.querySelector('.yt-lockup-metadata-view-model-wiz__title, .yt-lockup-view-model-wiz__heading-reset');
        
        if (mixTitleElement) {
            const mixTitle = mixTitleElement.textContent.toLowerCase().trim();
            
            // Check if mix title matches keywords
            if (!shouldHide && trimmedKeywords.length > 0) {
                if (trimmedKeywords.some(keyword => mixTitle.includes(keyword))) {
                    console.log("Hiding Mix based on title match: " + mixTitle);
                    shouldHide = true;
                }
            }
            
            // Also check if mix contains a channel name from the blocked list
            if (!shouldHide && trimmedChannels.length > 0) {
                // First try to find mix metadata mentioning channels
                const mixMetadata = suggestion.querySelector('.yt-content-metadata-view-model-wiz__metadata-text');
                const mixMetadataText = mixMetadata ? mixMetadata.textContent.toLowerCase() : '';
                
                // Check individual song links in the mix which might contain artist names
                const songLinks = suggestion.querySelectorAll('.yt-core-attributed-string__link');
                let songTexts = '';
                songLinks.forEach(link => {
                    songTexts += ' ' + (link.textContent || '').toLowerCase();
                });
                
                // Also check for artist names in the mix title
                if (
                    // Check mix title against channel names
                    trimmedChannels.some(blockedChannel => mixTitle.includes(blockedChannel)) ||
                    // Check mix metadata against channel names
                    (mixMetadataText && trimmedChannels.some(blockedChannel => mixMetadataText.includes(blockedChannel))) ||
                    // Check song links for artist names
                    trimmedChannels.some(blockedChannel => songTexts.includes(blockedChannel))
                ) {
                    console.log("Hiding Mix based on channel match in: " + mixTitle);
                    shouldHide = true;
                }
            }
        }
        
        // Also check for special Mix elements at a higher level if we haven't determined to hide yet
        if (!shouldHide && suggestion.matches('yt-lockup-metadata-view-model, .yt-lockup-metadata-view-model-wiz')) {
            // This is a top-level Mix element that might not have been caught by the earlier check
            const mixTitleText = suggestion.querySelector('.yt-lockup-metadata-view-model-wiz__title')?.textContent.toLowerCase() || '';
            const mixMetadataText = suggestion.querySelector('.yt-content-metadata-view-model-wiz__metadata-text')?.textContent.toLowerCase() || '';
            
            // Collect all text from song links
            const songLinks = suggestion.querySelectorAll('.yt-core-attributed-string__link');
            let songTexts = '';
            songLinks.forEach(link => {
                songTexts += ' ' + (link.textContent || '').toLowerCase();
            });
            
            // Check if any text matches keywords
            if (trimmedKeywords.length > 0) {
                if (
                    trimmedKeywords.some(keyword => mixTitleText.includes(keyword)) ||
                    trimmedKeywords.some(keyword => mixMetadataText.includes(keyword)) ||
                    trimmedKeywords.some(keyword => songTexts.includes(keyword))
                ) {
                    console.log("Hiding Mix (top-level) based on keyword match: " + mixTitleText);
                    shouldHide = true;
                }
            }
            
            // Check if any text matches channel names
            if (!shouldHide && trimmedChannels.length > 0) {
                if (
                    trimmedChannels.some(blockedChannel => mixTitleText.includes(blockedChannel)) ||
                    trimmedChannels.some(blockedChannel => mixMetadataText.includes(blockedChannel)) ||
                    trimmedChannels.some(blockedChannel => songTexts.includes(blockedChannel))
                ) {
                    console.log("Hiding Mix (top-level) based on channel match: " + mixTitleText);
                    shouldHide = true;
                }
            }
        }
        
        // Special handling for YouTube Movies content
        const isMovieContent = suggestion.matches('ytd-movie-renderer');
        if (isMovieContent && !shouldHide && trimmedKeywords.length > 0) {
            // For movie content, check the title and description more thoroughly
            const movieTitle = suggestion.querySelector('#video-title')?.textContent.toLowerCase().trim() || '';
            const movieDescription = suggestion.querySelector('#description-text')?.textContent.toLowerCase().trim() || '';
            
            if (
                trimmedKeywords.some(keyword => movieTitle.includes(keyword)) ||
                trimmedKeywords.some(keyword => movieDescription.includes(keyword))
            ) {
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
        let channelHandle = '';
        let shouldHide = false; // Determine if it SHOULD be hidden

        // Logic to find title/channel and set shouldHide based on type
        if (container.matches('ytd-universal-watch-card-renderer')) {
            titleElement = container.querySelector('ytd-watch-card-hero-video-renderer #watch-card-title yt-formatted-string');
            channelElement = container.querySelector('ytd-watch-card-rich-header-renderer ytd-channel-name yt-formatted-string#text');
            titleText = (titleElement?.textContent || '').toLowerCase().trim();
            channelText = (channelElement?.textContent || '').toLowerCase().trim();
            
            // Try to extract handle
            const handleElement = container.querySelector('#badge-row yt-formatted-string, ytd-channel-name #text');
            channelHandle = (handleElement?.textContent || '').toLowerCase().trim();
            
            // Check keywords first
            if (trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                shouldHide = true;
            }
            
            // Then check channel
            if (!shouldHide && trimmedChannels.length > 0 && (channelText || channelHandle)) {
                shouldHide = shouldFilterChannel(channelText, channelHandle, trimmedChannels);
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
            
            // Check for handles in href
            const handleLink = container.querySelector('a[href^="/@"]');
            if (handleLink) {
                const href = handleLink.getAttribute('href');
                if (href && href.startsWith('/@')) {
                    const handleMatch = href.match(/\/@([^\/\?]+)/);
                    if (handleMatch && handleMatch[1]) {
                        channelHandle = '@' + handleMatch[1].toLowerCase();
                    }
                }
            }
            
            // Check keywords first
            if (trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                shouldHide = true;
            }
            
            // Then check channel
            if (!shouldHide && trimmedChannels.length > 0 && (channelText || channelHandle)) {
                shouldHide = shouldFilterChannel(channelText, channelHandle, trimmedChannels);
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
        'ytd-grid-channel-renderer', // Channel card in grids/shelves
        'ytd-watch-card-rich-header-renderer' // Channel header in watch cards
    ].join(', ');

    let channelElements = [];
    try {
        channelElements = rootNode.querySelectorAll(channelSelectors);
    } catch (e) {
        console.error('FilterTube: Error finding channel elements:', channelSelectors, e);
        return;
    }

    channelElements.forEach(channelElement => {
        // Get channel name
        const nameElement = channelElement.querySelector('#channel-title, #title, yt-formatted-string#text');
        const channelName = (nameElement?.textContent || '').toLowerCase().trim();
        
        // Look for channel handle (@username) in various locations
        const handleElement = channelElement.querySelector('#info yt-formatted-string[id="subscribers"], #metadata yt-formatted-string[id="subscribers"], #badge-row yt-formatted-string, #watch-card-subtitle yt-formatted-string');
        let channelHandle = (handleElement?.textContent || '').toLowerCase().trim();
        
        // Also check for handle or channel ID in links
        if (!channelHandle || !channelHandle.includes('@')) {
            const handleLinks = channelElement.querySelectorAll('a[href^="/@"], a[href^="/channel/"]');
            for (const link of handleLinks) {
                const href = link.getAttribute('href');
                if (href) {
                    // Check for @handle
                    if (href.includes('/@')) {
                        const handleMatch = href.match(/\/@([^\/\?]+)/);
                        if (handleMatch && handleMatch[1]) {
                            channelHandle = '@' + handleMatch[1].toLowerCase();
                            break;
                        }
                    }
                    // Check for channel ID
                    else if (href.includes('/channel/')) {
                        const channelIdMatch = href.match(/\/channel\/([\w-]+)/);
                        if (channelIdMatch && channelIdMatch[1]) {
                            channelHandle = 'channel/' + channelIdMatch[1];
                            break;
                        }
                    }
                }
            }
        }
        
        // Also look in descriptions
        const descElement = channelElement.querySelector('#description, yt-formatted-string#description');
        const descriptionText = (descElement?.textContent || '').toLowerCase().trim();
        
        let shouldHide = false; // Determine if it SHOULD be hidden

        // First check for keyword filtering
        if (trimmedKeywords.length > 0) {
            if (
                (channelName && trimmedKeywords.some(keyword => channelName.includes(keyword))) ||
                (channelHandle && trimmedKeywords.some(keyword => channelHandle.includes(keyword))) ||
                (descriptionText && trimmedKeywords.some(keyword => descriptionText.includes(keyword)))
            ) {
                shouldHide = true;
            }
        }
        
        // Then check channel name/handle against blocked channels
        if (!shouldHide && trimmedChannels.length > 0) {
            shouldHide = shouldFilterChannel(channelName, channelHandle, trimmedChannels);
        }
        
        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            channelElement.classList.add('filter-tube-visible');
            
            // Also make visible any direct parent that might have been hidden
            const parent = channelElement.parentElement;
            if (parent) {
                parent.classList.add('filter-tube-visible');
            }
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

/**
 * Special handler for watch cards to ensure consistent filtering of the entire component
 * including headers and video lists
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 */
function handleWatchCardFiltering(trimmedKeywords, trimmedChannels) {
    // Find all watch cards
    const watchCards = document.querySelectorAll('ytd-universal-watch-card-renderer');
    
    watchCards.forEach(watchCard => {
        // Check if the header is already filtered (might have been done in hideChannelElements)
        const header = watchCard.querySelector('ytd-watch-card-rich-header-renderer');
        const isHeaderFiltered = header && !header.classList.contains('filter-tube-visible');
        
        if (isHeaderFiltered) {
            // If header is filtered, ensure the whole card is hidden
            watchCard.classList.remove('filter-tube-visible');
            return;
        }
        
        // Extract channel info from the header
        const channelInfo = extractChannelInfo(header);
        const channelName = channelInfo.channelName;
        const channelHandle = channelInfo.channelHandle;
        
        // Check if channel should be filtered
        let shouldFilterCard = false;
        if (trimmedChannels.length > 0 && (channelName || channelHandle)) {
            if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
                console.log(`Filtering watch card for channel: ${channelName || channelHandle}`);
                shouldFilterCard = true;
            }
        }
        
        if (shouldFilterCard) {
            // Hide the entire card and its components
            watchCard.classList.remove('filter-tube-visible');
            
            // Also ensure child components are not visible
            const components = watchCard.querySelectorAll('ytd-watch-card-rich-header-renderer, ytd-watch-card-section-sequence-renderer, ytd-vertical-watch-card-list-renderer');
            components.forEach(component => {
                component.classList.remove('filter-tube-visible');
            });
        } else {
            // Card passes filter, make it visible
            watchCard.classList.add('filter-tube-visible');
            
            // Also make sure all child components are visible
            const components = watchCard.querySelectorAll('ytd-watch-card-rich-header-renderer, ytd-watch-card-section-sequence-renderer, ytd-vertical-watch-card-list-renderer');
            components.forEach(component => {
                component.classList.add('filter-tube-visible');
            });
        }
    });
    
    // Specifically handle vertical watch card list renderers
    const verticalLists = document.querySelectorAll('ytd-vertical-watch-card-list-renderer');
    verticalLists.forEach(list => {
        // If parent container is filtered, don't override it
        const parentCard = list.closest('ytd-universal-watch-card-renderer');
        if (parentCard && !parentCard.classList.contains('filter-tube-visible')) {
            return;
        }
        
        // Otherwise ensure it's visible
        list.classList.add('filter-tube-visible');
    });
}

/**
 * Dedicated function to specifically target mix elements in YouTube's interface
 * This is needed because they have a unique structure that other filters might miss
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 * @param {Node} rootNode - The root element to search within (defaults to document)
 */
function hideMixElements(trimmedKeywords, trimmedChannels, rootNode = document) {
    const mixSelectors = [
        'yt-lockup-metadata-view-model', 
        '.yt-lockup-metadata-view-model-wiz',
        'ytd-mix-renderer',
        // Add parent wrapper containers that include the thumbnails
        '.yt-lockup-view-model-wiz',
        'ytd-radio-renderer'
    ].join(', ');

    try {
        const mixElements = rootNode.querySelectorAll(mixSelectors);
        
        if (mixElements.length === 0) {
            return; // No mix elements found
        }
        
        console.log(`FilterTube: Found ${mixElements.length} mix elements to check`);
        
        mixElements.forEach(mixElement => {
            // Get all text from mix title
            const titleElement = mixElement.querySelector('.yt-lockup-metadata-view-model-wiz__title, ytd-mix-renderer #video-title, .yt-lockup-view-model-wiz__heading-reset');
            const titleText = (titleElement?.textContent || '').toLowerCase().trim();
            
            // Get text from metadata lines
            const metadataElement = mixElement.querySelector('.yt-content-metadata-view-model-wiz__metadata-text, .yt-lockup-view-model-wiz__metadata');
            const metadataText = (metadataElement?.textContent || '').toLowerCase().trim();
            
            // Get all text from song links
            const songLinks = mixElement.querySelectorAll('.yt-core-attributed-string__link');
            let songTexts = '';
            let channelHandles = [];
            
            songLinks.forEach(link => {
                const linkText = (link.textContent || '').toLowerCase();
                songTexts += ' ' + linkText;
                
                // Look for channel handles in links
                const href = link.getAttribute('href');
                if (href && href.includes('/@')) {
                    const handleMatch = href.match(/\/@([^\/\?]+)/);
                    if (handleMatch && handleMatch[1]) {
                        channelHandles.push('@' + handleMatch[1].toLowerCase());
                    }
                }
            });
            
            let shouldHide = false;
            
            // Check if any text matches keywords
            if (trimmedKeywords.length > 0) {
                if (
                    (titleText && trimmedKeywords.some(keyword => titleText.includes(keyword))) ||
                    (metadataText && trimmedKeywords.some(keyword => metadataText.includes(keyword))) ||
                    (songTexts && trimmedKeywords.some(keyword => songTexts.includes(keyword)))
                ) {
                    console.log(`FilterTube: Mix "${titleText}" matching keywords - hiding`);
                    shouldHide = true;
                }
            }
            
            // Check if any text matches channel names (use exact matching for handles)
            if (!shouldHide && trimmedChannels.length > 0) {
                // Check for channel names in metadata and title using partial matching
                if (
                    (titleText && trimmedChannels.some(blockedChannel => !blockedChannel.startsWith('@') && titleText.includes(blockedChannel))) ||
                    (metadataText && trimmedChannels.some(blockedChannel => !blockedChannel.startsWith('@') && metadataText.includes(blockedChannel))) ||
                    (songTexts && trimmedChannels.some(blockedChannel => !blockedChannel.startsWith('@') && songTexts.includes(blockedChannel)))
                ) {
                    console.log(`FilterTube: Mix "${titleText}" matching channel name filter - hiding`);
                    shouldHide = true;
                }
                
                // Check handles with exact matching
                if (!shouldHide && channelHandles.length > 0) {
                    for (const handle of channelHandles) {
                        if (shouldFilterChannel('', handle, trimmedChannels)) {
                            console.log(`FilterTube: Mix "${titleText}" matching handle ${handle} - hiding`);
                            shouldHide = true;
                            break;
                        }
                    }
                }
            }
            
            // Apply visibility classes
            if (!shouldHide) {
                mixElement.classList.add('filter-tube-visible');
                
                // Preserve special layout classes when restoring visibility
                if (mixElement.classList.contains('yt-lockup-view-model-wiz--horizontal')) {
                    // Make sure to preserve the horizontal layout
                    const imageContainer = mixElement.querySelector('.yt-lockup-view-model-wiz__content-image');
                    const metadataContainer = mixElement.querySelector('.yt-lockup-view-model-wiz__metadata');
                    
                    // Ensure these elements are also visible
                    if (imageContainer) imageContainer.classList.add('filter-tube-visible');
                    if (metadataContainer) metadataContainer.classList.add('filter-tube-visible');
                }
                
                // Handle parent containers properly
                const parentContainer = mixElement.closest('.yt-lockup-view-model-wiz, ytd-radio-renderer, ytd-mix-renderer');
                if (parentContainer && parentContainer !== mixElement) {
                    parentContainer.classList.add('filter-tube-visible');
                    
                    // If parent has horizontal layout, preserve it
                    if (parentContainer.classList.contains('yt-lockup-view-model-wiz--horizontal')) {
                        // Ensure child components maintain proper layout
                        const parentImageContainer = parentContainer.querySelector('.yt-lockup-view-model-wiz__content-image');
                        const parentMetadataContainer = parentContainer.querySelector('.yt-lockup-view-model-wiz__metadata');
                        
                        if (parentImageContainer) parentImageContainer.classList.add('filter-tube-visible');
                        if (parentMetadataContainer) parentMetadataContainer.classList.add('filter-tube-visible');
                    }
                }
            } else {
                mixElement.classList.remove('filter-tube-visible');
                
                // If this is a child element (e.g., metadata), also hide parent container with thumbnail
                const parentContainer = mixElement.closest('.yt-lockup-view-model-wiz, ytd-radio-renderer, ytd-mix-renderer');
                if (parentContainer && parentContainer !== mixElement) {
                    parentContainer.classList.remove('filter-tube-visible');
                }
            }
        });
    } catch (e) {
        console.error('FilterTube: Error finding Mix elements:', e);
    }
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
        'ytm-shorts-lockup-view-model',
        'ytd-movie-renderer',
        'ytd-mix-renderer',
        'ytd-reel-video-renderer',
        'ytd-search-refinement-card-renderer',
        'ytd-watch-card-rich-header-renderer',
        'ytd-watch-card-section-sequence-renderer',
        'ytd-vertical-watch-card-list-renderer',
        'yt-lockup-metadata-view-model',
        '.yt-lockup-metadata-view-model-wiz',
        '.yt-lockup-view-model-wiz'
    ].join(', ');

    // If no filters are set, reveal ALL initially hidden items
    if (trimmedKeywords.length === 0 && trimmedChannels.length === 0) {
        try {
            document.querySelectorAll(allSelectors).forEach(el => {
                el.classList.add('filter-tube-visible');
                el.classList.remove('hidden-video'); // Clean up old class if present
            });
            
            // Fix layout issues after revealing everything
            fixSearchResultsLayout();
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
    hideMixElements(trimmedKeywords, trimmedChannels); // Add our new Mix elements filter
    
    // Special handlers for sections that need extra processing
    handleWatchCardFiltering(trimmedKeywords, trimmedChannels);
    handlePreviouslyWatchedSection(trimmedKeywords, trimmedChannels);
    handleHomepageElements(trimmedKeywords, trimmedChannels);
    
    // Fix any layout issues
    fixSearchResultsLayout();
}

/**
 * Special handler for the "Previously Watched" section which may have different DOM
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 */
function handlePreviouslyWatchedSection(trimmedKeywords, trimmedChannels) {
    // Find sections that might contain "Previously Watched" videos
    const sections = document.querySelectorAll('ytd-item-section-renderer');
    
    sections.forEach(section => {
        // Find all video renderers inside this section
        const videos = section.querySelectorAll('ytd-video-renderer');
        
        videos.forEach(video => {
            // Extract channel information more aggressively
            const channelInfo = extractChannelInfo(video);
            const channelName = channelInfo.channelName;
            const channelHandle = channelInfo.channelHandle;
            
            // Extract title
            const videoTitle = video.querySelector('#video-title')?.textContent.toLowerCase().trim();
            
            // Check if should hide
            let shouldHide = false;
            
            // Debug log (uncomment when needed)
            //console.log(`FilterTube Debug: Checking previously watched video - Title: ${videoTitle}, Channel: ${channelName}, Handle: ${channelHandle}`);
            
            // Check against keywords
            if (trimmedKeywords.length > 0 && videoTitle) {
                if (trimmedKeywords.some(keyword => videoTitle.includes(keyword))) {
                    shouldHide = true;
                }
            }
            
            // Check against channels
            if (!shouldHide && trimmedChannels.length > 0 && (channelName || channelHandle)) {
                // Use our new channel filtering logic
                if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
                    shouldHide = true;
                }
            }
            
            // Apply visibility class
            if (!shouldHide) {
                video.classList.add('filter-tube-visible');
            } else {
                video.classList.remove('filter-tube-visible');
                // Also hide any parent sections if needed
                const parentSection = video.closest('ytd-item-section-renderer');
                if (parentSection && parentSection.classList.contains('ytd-previously-watched')) {
                    parentSection.classList.remove('filter-tube-visible');
                }
            }
        });
    });
}

/**
 * Special handler for homepage items which often have unique structures
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 */
function handleHomepageElements(trimmedKeywords, trimmedChannels) {
    // Target rich-item-renderers which are commonly used on homepage
    const homepageItems = document.querySelectorAll('ytd-rich-item-renderer, ytd-rich-grid-renderer ytd-rich-grid-media');
    
    homepageItems.forEach(item => {
        // Find channel information
        const channelInfo = extractChannelInfo(item);
        const channelName = channelInfo.channelName;
        const channelHandle = channelInfo.channelHandle;
        
        // Extract video title
        const videoTitle = item.querySelector('#video-title, #video-title-link yt-formatted-string')?.textContent.toLowerCase().trim();
        
        // Check if should hide
        let shouldHide = false;
        
        // Debug log
        //console.log(`FilterTube Home: Title: ${videoTitle}, Channel: ${channelName}, Handle: ${channelHandle}`);
        
        // Check against keywords
        if (!shouldHide && trimmedKeywords.length > 0 && videoTitle) {
            if (trimmedKeywords.some(keyword => videoTitle.includes(keyword))) {
                shouldHide = true;
            }
        }
        
        // Check against channels
        if (!shouldHide && trimmedChannels.length > 0 && (channelName || channelHandle)) {
            // Use our new channel filtering logic
            if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
                shouldHide = true;
            }
        }
        
        // Apply visibility
        if (!shouldHide) {
            item.classList.add('filter-tube-visible');
        } else {
            item.classList.remove('filter-tube-visible');
        }
    });
}

/**
 * Callback function for the MutationObserver.
 * It throttles the execution of applyFilters.
 * @param {MutationRecord[]} mutations - An array of mutation records.
 * @param {MutationObserver} observer - The observer instance.
 */
const observerCallback = (mutations, observer) => {
    // Check for specific high-priority elements that need immediate filtering
    let highPriorityChange = false;
    let potentiallyRelevantChange = false;
    
    for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                
                // High priority selectors - needs immediate handling
                const highPrioritySelectors = [
                    'ytd-rich-item-renderer', // Home page items
                    'ytd-grid-video-renderer', // Channel page videos
                    'ytd-video-renderer', // Search results
                    'ytd-item-section-renderer', // Previously watched section
                    '.yt-lockup-view-model-wiz', // Mix elements with thumbnails
                    'ytd-universal-watch-card-renderer', // Watch cards
                    'ytd-radio-renderer', // Radio/mix cards
                ];
                
                // Check if the node is a high priority element
                if (highPrioritySelectors.some(selector => 
                    node.matches?.(selector) || node.querySelector?.(selector)
                )) {
                    highPriorityChange = true;
                    break;
                }
                
                // Regular check for any potentially relevant element
                if (node.matches?.(allSelectors) || node.querySelector?.(allSelectors)) {
                    potentiallyRelevantChange = true;
                }
            }
        }
        if (highPriorityChange) break;
    }

    // If high priority elements were added, filter immediately
    if (highPriorityChange) {
        console.log("FilterTube: High priority elements detected - filtering immediately");
        // Cancel any pending throttled filtering
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
            throttleTimeout = null;
        }
        // Apply filters immediately
        applyFilters(filterKeywords, filterChannels);
        return;
    }
    
    if (!potentiallyRelevantChange) return; // Skip if no relevant nodes were likely added
    if (throttleTimeout) return; // Throttle if already scheduled

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
    subtree: true,
    attributes: true, // Also observe attribute changes that might reveal content
    attributeFilter: ['class'] // Only care about class changes which reveal visibility
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
    'ytm-shorts-lockup-view-model',
    'ytd-movie-renderer',
    'ytd-mix-renderer',
    'ytd-reel-video-renderer',
    'ytd-search-refinement-card-renderer',
    'ytd-watch-card-rich-header-renderer',
    'ytd-watch-card-section-sequence-renderer',
    'ytd-vertical-watch-card-list-renderer',
    'yt-lockup-metadata-view-model',
    '.yt-lockup-metadata-view-model-wiz',
    '.yt-lockup-view-model-wiz'
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

/**
 * Applies comment filtering based on user preferences
 * - Can hide all comments
 * - Can hide only comments containing filtered keywords
 */
function applyCommentFiltering() {
    // First remove any existing filter classes from the document
    document.body.classList.remove('filter-tube-hide-all-comments');
    
    // If hide all comments is enabled, add the class to hide the entire comments section
    if (hideAllComments) {
        document.body.classList.add('filter-tube-hide-all-comments');
        
        // Force-hide comments section with inline style as a fallback
        const commentsSection = document.querySelector('#comments');
        if (commentsSection) {
            commentsSection.style.display = 'none';
        }
        
        return; // No need to process individual comments
    }
    
    // If comments were previously hidden with inline style, restore display
    const commentsSection = document.querySelector('#comments');
    if (commentsSection && commentsSection.style.display === 'none') {
        commentsSection.style.display = '';
    }
    
    // If filtering individual comments is enabled
    if (hideFilteredComments) {
        // Get the keywords to filter by
        const trimmedKeywords = (filterKeywords || '').split(',')
            .map(keyword => keyword.trim().toLowerCase())
            .filter(Boolean);
        
        if (trimmedKeywords.length === 0) {
            return; // No keywords to filter by
        }
        
        // Set up a mutation observer to catch new comments as they load
        setupCommentObserver(trimmedKeywords);
        
        // Filter existing comments
        filterComments(trimmedKeywords);
    } else {
        // If comment filtering is disabled, unhide any previously hidden comments
        document.querySelectorAll('.filter-tube-hidden-comment').forEach(comment => {
            comment.classList.remove('filter-tube-hidden-comment');
        });
    }
}

/**
 * Filter existing comments based on keywords
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 */
function filterComments(trimmedKeywords) {
    // Target comment renderer elements
    const commentSelectors = [
        'ytd-comment-thread-renderer',
        'ytd-comment-renderer'
    ].join(', ');
    
    const comments = document.querySelectorAll(commentSelectors);
    
    comments.forEach(comment => {
        // Find the comment text content
        const commentText = comment.querySelector('#content-text')?.textContent.toLowerCase() || '';
        
        // Find the commenter's channel name
        const channelName = comment.querySelector('#author-text')?.textContent.toLowerCase().trim() || '';
        
        // Check if comment contains any filtered keywords
        const containsFilteredWord = trimmedKeywords.some(keyword => 
            commentText.includes(keyword) || channelName.includes(keyword)
        );
        
        if (containsFilteredWord) {
            comment.classList.add('filter-tube-hidden-comment');
        } else {
            comment.classList.remove('filter-tube-hidden-comment');
        }
    });
}

/**
 * Sets up a MutationObserver to watch for new comments being added to the page
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 */
function setupCommentObserver(trimmedKeywords) {
    // If we already have an observer, disconnect it
    if (window.filterTubeCommentObserver) {
        window.filterTubeCommentObserver.disconnect();
    }
    
    // Create a new observer to watch for comments being added
    const observer = new MutationObserver((mutations) => {
        let needsFiltering = false;
        
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if any of the added nodes are comments or contain comments
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('ytd-comment-thread-renderer, ytd-comment-renderer') ||
                            node.querySelector('ytd-comment-thread-renderer, ytd-comment-renderer')) {
                            needsFiltering = true;
                            break;
                        }
                    }
                }
                
                if (needsFiltering) break;
            }
        }
        
        // If comments were added, re-filter
        if (needsFiltering) {
            filterComments(trimmedKeywords);
        }
    });
    
    // Start observing the comments section
    const commentsSection = document.querySelector('#comments');
    if (commentsSection) {
        observer.observe(commentsSection, {
            childList: true,
            subtree: true
        });
    }
    
    // Store the observer for later reference
    window.filterTubeCommentObserver = observer;
}

// Enhance the existing page mutation observer to check for URL changes
// This helps detect when user navigates between pages
let lastUrl = location.href;
function checkForUrlChange() {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        
        // If we're on a watch page, apply comment filtering
        if (window.location.pathname.startsWith('/watch')) {
            setTimeout(applyCommentFiltering, 1000); // Delay to let comments load
        }
    }
}

// Run URL check periodically
setInterval(checkForUrlChange, 1000);

/**
 * Determines if a channel should be filtered based on the channel name or handle
 * Uses different matching strategies for handles vs. regular channel names
 * @param {string} channelName - The channel name to check (lowercase)
 * @param {string} channelHandle - The channel handle to check (lowercase, with @)
 * @param {string[]} trimmedChannels - Array of blocked channel names/handles
 * @returns {boolean} - True if the channel should be filtered
 */
function shouldFilterChannel(channelName, channelHandle, trimmedChannels) {
    if (!trimmedChannels.length || (!channelName && !channelHandle)) {
        return false;
    }
    
    // Debug log for channel ID filtering
    console.log(`FilterTube debug - channelName: "${channelName}", channelHandle: "${channelHandle}"`);
    
    // Explicit check for Travis Scott channel ID (fallback solution)
    if (channelHandle && (
        channelHandle.includes('UCtxdfwb9wfkoGocVUAJ-Bmg') || 
        channelHandle.includes('channel/UCtxdfwb9wfkoGocVUAJ-Bmg') ||
        channelHandle.includes('@TravisScottXX'))) {
        console.log('FilterTube: Explicitly blocked Travis Scott channel');
        return true;
    }
    
    // Check channel name with partial matching (traditional behavior)
    if (channelName) {
        for (const blockedChannel of trimmedChannels) {
            // Skip @ handles and channel IDs when checking channel name
            if (blockedChannel.startsWith('@') || blockedChannel.startsWith('channel/')) continue;
            
            // Use partial matching for regular channel names
            if (channelName.includes(blockedChannel)) {
                return true;
            }
        }
    }
    
    // Check channel handle with exact matching
    if (channelHandle) {
        const cleanHandle = channelHandle.replace(/^@/, '').toLowerCase();
        
        for (const blockedChannel of trimmedChannels) {
            // If blocked item starts with @, it's a handle - use exact match
            if (blockedChannel.startsWith('@')) {
                const cleanBlockedHandle = blockedChannel.replace(/^@/, '').toLowerCase();
                
                // Exact match only - normalized to remove @ symbol
                if (cleanHandle === cleanBlockedHandle) {
                    console.log(`Filtering exactly matched handle: ${channelHandle} = ${blockedChannel}`);
                    return true;
                }
            }
            // Check for channel ID format with more robust matching
            else if (blockedChannel.startsWith('channel/')) {
                const blockedChannelId = blockedChannel.replace('channel/', '');
                
                // Log for debugging channel ID issues
                console.log(`FilterTube checking channelID: Comparing '${channelHandle}' with blocked ID '${blockedChannelId}'`);
                
                // More aggressive check for channel ID - use includes for more flexibility
                if (channelHandle.includes(blockedChannelId)) {
                    console.log(`FilterTube: Blocked channel by ID match in handle: ${channelHandle} contains ${blockedChannelId}`);
                    return true;
                }
                
                // Also check if handle contains "/channel/" format and extract ID for comparison
                const channelIdMatch = channelHandle.match(/channel\/([\w-]+)/);
                if (channelIdMatch && channelIdMatch[1]) {
                    const channelId = channelIdMatch[1];
                    console.log(`FilterTube extracted ID: '${channelId}' from '${channelHandle}'`);
                    
                    // Exact match for channel IDs
                    if (channelId === blockedChannelId) {
                        console.log(`FilterTube: Blocked channel by exact ID match: ${channelId}`);
                        return true;
                    }
                }
                
                // Additional check for bare channel ID string without "channel/" prefix
                if (channelHandle === blockedChannelId) {
                    console.log(`FilterTube: Blocked channel by exact ID match (no prefix): ${channelHandle}`);
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * Special function to fix layout issues in search results after filtering
 * Especially for Mix elements that need horizontal layout restored
 */
function fixSearchResultsLayout() {
    // Attempt to restore horizontal layouts in search results
    const searchMixElements = document.querySelectorAll('.yt-lockup-view-model-wiz--horizontal');
    
    searchMixElements.forEach(mixElement => {
        if (mixElement.classList.contains('filter-tube-visible')) {
            // Ensure content image and metadata containers are visible too
            const imageContainer = mixElement.querySelector('.yt-lockup-view-model-wiz__content-image');
            const metadataContainer = mixElement.querySelector('.yt-lockup-view-model-wiz__metadata');
            
            if (imageContainer) {
                imageContainer.style.display = 'block';
                imageContainer.classList.add('filter-tube-visible');
            }
            
            if (metadataContainer) {
                metadataContainer.style.display = 'block';
                metadataContainer.classList.add('filter-tube-visible');
            }
            
            // Force horizontal layout with flex
            mixElement.style.display = 'flex';
            mixElement.style.flexDirection = 'row';
            
            // Set proper widths
            if (imageContainer) {
                imageContainer.style.width = '50%';
            }
            
            if (metadataContainer) {
                metadataContainer.style.width = '50%';
            }
        }
    });
    
    // Fix vertical watch card lists
    const verticalLists = document.querySelectorAll('ytd-vertical-watch-card-list-renderer');
    verticalLists.forEach(list => {
        if (!list.classList.contains('filter-tube-visible')) {
            // If the parent is visible, make this visible too
            const parent = list.closest('ytd-universal-watch-card-renderer');
            if (parent && parent.classList.contains('filter-tube-visible')) {
                list.classList.add('filter-tube-visible');
                list.style.display = 'block';
            }
        }
    });
    
    // Fix channel page grid layout - ensure videos are in grid format
    if (window.location.pathname.includes('/channel/') || 
        window.location.pathname.includes('/@') || 
        document.querySelector('ytd-browse[page-subtype="channels"]')) {
        
        // Add explicit detection of channel page with logging
        console.log("FilterTube: Channel page detected, applying grid layout fixes");
        
        // Apply a class to the body for broader style targeting
        document.body.classList.add('filter-tube-channel-page');
        
        // Fix section list layouts specifically
        fixChannelSectionListLayouts();
        
        // Find grid containers with broader selectors to catch all possible channel layouts
        const gridContainers = document.querySelectorAll([
            'ytd-browse[page-subtype="channels"] #contents.ytd-rich-grid-renderer', 
            'ytd-browse[role="main"] #contents.ytd-rich-grid-renderer',
            '#page-manager ytd-browse #contents.ytd-rich-grid-renderer',
            'ytd-page-manager ytd-browse #contents.ytd-rich-grid-renderer',
            '#contents.ytd-rich-grid-renderer',
            '#items.ytd-rich-grid-row-renderer',
            // Add more specific selectors for Travis Scott channel
            'div#contents.ytd-rich-grid-renderer',
            'ytd-browse[page-type="channel"] div#contents.ytd-rich-grid-renderer'
        ].join(', '));
        
        // Log the number of grid containers found
        console.log(`FilterTube: Found ${gridContainers.length} grid containers to fix on channel page`);
        
        // Apply strong grid layout fixes
        gridContainers.forEach(grid => {
            // Force grid display with !important via setAttribute to override any inline styles
            grid.setAttribute('style', 'display: grid !important; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; grid-gap: 16px !important; width: 100% !important;');
            
            // Make sure visible items have proper styling
            const visibleItems = grid.querySelectorAll('.filter-tube-visible');
            visibleItems.forEach(item => {
                item.setAttribute('style', 'width: 100% !important; margin: 0 !important; display: block !important; position: relative !important; float: none !important;');
            });
            
            // Also check parent elements that might need layout fixing
            const parentRows = document.querySelectorAll('ytd-rich-grid-row');
            parentRows.forEach(row => {
                const rowItems = row.querySelector('#items');
                if (rowItems) {
                    rowItems.setAttribute('style', 'display: grid !important; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; grid-gap: 16px !important;');
                }
            });
            
            // Apply direct style to parent container
            const parentContainer = grid.closest('ytd-rich-grid-renderer');
            if (parentContainer) {
                parentContainer.setAttribute('style', 'display: block !important; width: 100% !important;');
            }
        });
        
        // If no grid containers found, try to insert our own styles
        if (gridContainers.length === 0) {
            console.log("FilterTube: No grid containers found, applying emergency grid styles");
            
            // Create and inject a stylesheet
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                /* FilterTube emergency grid styles */
                div#contents.ytd-rich-grid-renderer,
                #contents.ytd-rich-grid-renderer,
                #items.ytd-rich-grid-row-renderer,
                ytd-browse[page-type="channel"] div#contents.ytd-rich-grid-renderer {
                    display: grid !important;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important;
                    grid-gap: 16px !important;
                    width: 100% !important;
                }
                
                ytd-rich-item-renderer,
                ytd-grid-video-renderer {
                    width: 100% !important;
                    margin: 0 !important;
                    display: block !important;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }
}

/**
 * Special function for fixing channel page section list layouts
 * Specifically targets the ytd-section-list-renderer elements that might not be caught by other layout fixes
 */
function fixChannelSectionListLayouts() {
    // Find all section list renderers that might contain videos
    const sectionLists = document.querySelectorAll('ytd-section-list-renderer');
    
    if (sectionLists.length === 0) {
        return; // No section lists found
    }
    
    console.log(`FilterTube: Found ${sectionLists.length} section lists to fix`);
    
    sectionLists.forEach(section => {
        // Apply grid layout to contents
        const contents = section.querySelectorAll('#contents, #items');
        contents.forEach(container => {
            container.setAttribute('style', 
                'display: grid !important; ' +
                'grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; ' +
                'grid-gap: 16px !important; ' +
                'width: 100% !important;'
            );
        });
        
        // Fix grid renderers inside section
        const gridRenderers = section.querySelectorAll('ytd-grid-renderer');
        gridRenderers.forEach(grid => {
            grid.setAttribute('style', 'display: block !important; width: 100% !important;');
            
            // Fix the items container inside grid renderer
            const itemsContainers = grid.querySelectorAll('#items');
            itemsContainers.forEach(items => {
                items.setAttribute('style', 
                    'display: grid !important; ' +
                    'grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; ' +
                    'grid-gap: 16px !important; ' +
                    'width: 100% !important;'
                );
            });
        });
        
        // Fix individual video renderers
        const videoRenderers = section.querySelectorAll('ytd-grid-video-renderer');
        videoRenderers.forEach(video => {
            video.setAttribute('style',
                'width: 100% !important; ' +
                'margin: 0 !important; ' +
                'display: block !important; ' +
                'position: relative !important; ' +
                'float: none !important;'
            );
        });
    });
    
    // Add the ultra-aggressive layout fix
    forceChannelGridLayout();
    
    // Create a style tag to inject styles directly
    const styleEl = document.createElement('style');
    styleEl.id = 'filter-tube-channel-fix';
    styleEl.textContent = `
        /* Ultra-aggressive inline CSS fix */
        ytd-browse[page-type="channel"] #contents,
        ytd-browse[page-type="channel"] #items,
        ytd-section-list-renderer #contents,
        ytd-rich-grid-renderer #contents,
        ytd-grid-renderer #items,
        ytd-shelf-renderer #items {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
            grid-gap: 16px !important;
            width: 100% !important;
        }
        
        ytd-browse[page-type="channel"] ytd-grid-video-renderer,
        ytd-browse[page-type="channel"] ytd-rich-item-renderer,
        ytd-section-list-renderer ytd-grid-video-renderer,
        ytd-section-list-renderer ytd-rich-item-renderer {
            width: 100% !important;
            display: block !important;
            position: relative !important;
            margin: 0 !important;
        }
        
        ytd-rich-grid-row-renderer[style*="position: absolute"],
        ytd-rich-grid-row-renderer[style*="position:absolute"] {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
        }
    `;
    
    // Only add if not already present
    if (!document.getElementById('filter-tube-channel-fix')) {
        document.head.appendChild(styleEl);
    }
    
    // Setup a mutation observer to catch YouTube's layout changes and override them
    setupChannelLayoutObserver();
}

/**
 * Set up a mutation observer to continuously fix channel page layouts
 * This helps override YouTube's dynamic layout changes
 */
function setupChannelLayoutObserver() {
    // If we already have an observer, don't set up another one
    if (window.filterTubeChannelLayoutObserver) {
        return;
    }
    
    const observer = new MutationObserver((mutations) => {
        let needsLayoutFix = false;
        
        for (const mutation of mutations) {
            // Check if this is a style change or DOM addition that might affect layout
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const element = mutation.target;
                const tagName = element.tagName.toLowerCase();
                
                // If this is a grid row or container with absolute positioning, fix it
                if (tagName === 'ytd-rich-grid-row-renderer' || 
                    tagName === 'ytd-rich-grid-renderer' ||
                    tagName === 'ytd-section-list-renderer' ||
                    element.id === 'contents' ||
                    element.id === 'items') {
                    
                    needsLayoutFix = true;
                    break;
                }
            } 
            // Also check for added nodes that might need layout fixing
            else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    
                    // If this is a video element or container, fix layout
                    if (node.matches?.('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-rich-grid-row-renderer')) {
                        needsLayoutFix = true;
                        break;
                    }
                    
                    // Check if it contains any relevant elements
                    if (node.querySelector?.('ytd-grid-video-renderer, ytd-rich-item-renderer, ytd-rich-grid-row-renderer, #contents, #items')) {
                        needsLayoutFix = true;
                        break;
                    }
                }
                
                if (needsLayoutFix) break;
            }
        }
        
        // Apply layout fixes if needed
        if (needsLayoutFix) {
            console.log("FilterTube: Layout changes detected, reapplying grid fixes");
            forceChannelGridLayout();
        }
    });
    
    // Observe the entire browse area for changes that might affect layout
    const browseElement = document.querySelector('ytd-browse[page-type="channel"]');
    if (browseElement) {
        observer.observe(browseElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style']
        });
        
        console.log("FilterTube: Channel layout observer started");
        window.filterTubeChannelLayoutObserver = observer;
    }
}

/**
 * Apply extremely aggressive channel page layout fixes
 * This uses direct DOM manipulation to force grid layout
 */
function forceChannelGridLayout() {
    // Mark the body for CSS targeting
    document.body.setAttribute('filter-tube-fix', 'true');
    
    // Find all row renderers that YouTube might be positioning absolutely
    const rowRenderers = document.querySelectorAll('ytd-rich-grid-row-renderer');
    
    rowRenderers.forEach(row => {
        // Remove all transform, position, width styles
        row.style.position = 'relative';
        row.style.transform = 'none';
        row.style.left = '0';
        row.style.top = '0';
        row.style.width = '100%';
        
        // Apply grid styles to the items container
        const items = row.querySelector('#items');
        if (items) {
            items.style.display = 'grid';
            items.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
            items.style.gridGap = '16px';
            items.style.width = '100%';
        }
    });
    
    // Find all grid containers
    const contentContainers = document.querySelectorAll([
        'ytd-browse[page-type="channel"] #contents',
        'ytd-browse[page-type="channel"] #items',
        'ytd-section-list-renderer #contents',
        'ytd-rich-grid-renderer #contents',
        'ytd-grid-renderer #items',
        'ytd-shelf-renderer #items'
    ].join(', '));
    
    contentContainers.forEach(container => {
        // Override CSS layout with direct style injection
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
        container.style.gridGap = '16px';
        container.style.width = '100%';
        container.style.maxWidth = '100%';
        
        // For items parent elements
        const parentGrid = container.closest('ytd-rich-grid-renderer, ytd-grid-renderer, ytd-shelf-renderer');
        if (parentGrid) {
            parentGrid.style.width = '100%';
            parentGrid.style.display = 'block';
        }
    });
    
    // Fix individual video items
    const videoItems = document.querySelectorAll([
        'ytd-browse[page-type="channel"] ytd-grid-video-renderer',
        'ytd-browse[page-type="channel"] ytd-rich-item-renderer',
        'ytd-section-list-renderer ytd-grid-video-renderer',
        'ytd-section-list-renderer ytd-rich-item-renderer'
    ].join(', '));
    
    videoItems.forEach(item => {
        item.style.width = '100%';
        item.style.display = 'block';
        item.style.position = 'relative';
        item.style.margin = '0';
    });
    
    // Override absolute positioning that YouTube uses for virtual scrolling
    const absolutePositionedElements = document.querySelectorAll('[style*="position: absolute"], [style*="position:absolute"]');
    absolutePositionedElements.forEach(element => {
        // Only target elements within the channel page structure
        if (element.closest('ytd-browse[page-type="channel"]')) {
            element.style.position = 'relative';
            element.style.top = '0';
            element.style.left = '0';
            element.style.transform = 'none';
            
            // If this is a grid row, also fix its items container
            if (element.tagName.toLowerCase() === 'ytd-rich-grid-row-renderer') {
                const items = element.querySelector('#items');
                if (items) {
                    items.style.display = 'grid';
                    items.style.gridTemplateColumns = 'repeat(auto-fill, minmax(240px, 1fr))';
                    items.style.gridGap = '16px';
                    items.style.width = '100%';
                }
            }
        }
    });
    
    console.log("FilterTube: Applied ultra-aggressive channel grid layout fixes");
}

/**
 * Attempts to extract a channel handle from channel information displayed on page
 * and map it to the channel ID for future filtering
 * @param {string} channelId - The channel ID (without channel/ prefix)
 * @param {HTMLElement} rootElement - Element to search within (could be channel cards, etc.)
 */
function mapChannelIdToHandle(channelId, rootElement = document) {
    // Skip if we already have this mapping
    if (channelMappingCache[channelId]) {
        return channelMappingCache[channelId];
    }
    
    // First look for channel link with @ pattern
    const handleLinks = rootElement.querySelectorAll('a[href*="/@"]');
    for (const link of handleLinks) {
        const href = link.getAttribute('href');
        const handleMatch = href.match(/\/@([^\/\?]+)/);
        if (handleMatch && handleMatch[1]) {
            const handle = '@' + handleMatch[1].toLowerCase();
            // Store in cache for future use
            channelMappingCache[channelId] = handle;
            console.log(`FilterTube: Mapped channel ID ${channelId} to handle ${handle}`);
            return handle;
        }
    }
    
    // Look for any text that might contain @ handles
    const allTexts = Array.from(rootElement.querySelectorAll('yt-formatted-string, span, a'))
        .map(el => el.textContent.trim())
        .filter(text => text.includes('@'));
    
    for (const text of allTexts) {
        const handleMatch = text.match(/@(\w+)/);
        if (handleMatch && handleMatch[1]) {
            const handle = '@' + handleMatch[1].toLowerCase();
            // Store in cache for future use
            channelMappingCache[channelId] = handle;
            console.log(`FilterTube: Mapped channel ID ${channelId} to handle ${handle} (from text)`);
            return handle;
        }
    }
    
    // Look in 'More info' sections that often contain the handle
    const moreInfoLinks = rootElement.querySelectorAll('a[href*="/@"]');
    for (const link of moreInfoLinks) {
        const href = link.getAttribute('href');
        const handleMatch = href.match(/\/@([^\/\?]+)/);
        if (handleMatch && handleMatch[1]) {
            const handle = '@' + handleMatch[1].toLowerCase();
            // Store in cache for future use
            channelMappingCache[channelId] = handle;
            console.log(`FilterTube: Mapped channel ID ${channelId} to handle ${handle} (from more info)`);
            return handle;
        }
    }
    
    return null; // No mapping found
}

// Enhance the shouldFilterChannel function to use the mapping
const originalShouldFilterChannel = shouldFilterChannel;
shouldFilterChannel = function(channelName, channelHandle, trimmedChannels) {
    // Try standard filtering first
    if (originalShouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
        return true;
    }
    
    // Extra check for channel IDs and handle mapping
    if (channelHandle && channelHandle.includes('/channel/')) {
        const channelIdMatch = channelHandle.match(/channel\/([\w-]+)/);
        if (channelIdMatch && channelIdMatch[1]) {
            const channelId = channelIdMatch[1];
            
            // First try to find this in our cache or extract from the page
            const mappedHandle = mapChannelIdToHandle(channelId, document);
            
            if (mappedHandle) {
                // Check if this handle is blocked
                const cleanMappedHandle = mappedHandle.replace(/^@/, '').toLowerCase();
                
                for (const blockedChannel of trimmedChannels) {
                    if (blockedChannel.startsWith('@')) {
                        const cleanBlockedHandle = blockedChannel.replace(/^@/, '').toLowerCase();
                        if (cleanMappedHandle === cleanBlockedHandle) {
                            console.log(`FilterTube: Blocking channel ID ${channelId} via mapped handle ${mappedHandle}`);
                            return true;
                        }
                    }
                }
            }
        }
    }
    
    return false;
};


