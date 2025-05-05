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

// Dynamically load CSS files (separated into filter & layout)
function loadCSS(filename) {
    const link = document.createElement('link');
    link.href = chrome.runtime.getURL(`css/${filename}`);
    link.type = 'text/css';
    link.rel = 'stylesheet';
    (document.head || document.documentElement).appendChild(link);
}

// Load the separate CSS files
loadCSS('filter.css');
loadCSS('layout.css');

// Dynamically load the layout script
function loadScript(filename) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(`js/${filename}`);
        script.onload = () => {
            console.log(`FilterTube: Loaded ${filename}`);
            resolve();
        };
        script.onerror = (error) => {
            console.error(`FilterTube: Failed to load ${filename}`, error);
            reject(error);
        };
        (document.head || document.documentElement).appendChild(script);
    });
}

// Load the layout script
loadScript('layout.js').catch(error => {
    console.error('FilterTube: Error loading layout.js. Layout fixes may not work properly.', error);
});

// Global variables to cache filter settings from storage.
// Initialized as empty strings and populated by loadSettings.
let filterKeywords = '';
let filterChannels = '';
let hideAllComments = false;
let hideFilteredComments = false;

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

        // Get title element with improved selectors for search results
        const videoTitleElement = actualVideoElement.querySelector('#video-title, #video-title-link yt-formatted-string, .title yt-formatted-string, h3 yt-formatted-string');
        
        // Get channel name with improved selectors for search results
        let channelNameElement = actualVideoElement.querySelector(
            '#channel-name .yt-simple-endpoint, ' + 
            '#channel-name a.yt-simple-endpoint, ' + 
            '.ytd-channel-name a.yt-simple-endpoint, ' + 
            '#channel-name yt-formatted-string, ' +
            '#text-container yt-formatted-string, ' +
            '.text-wrapper #text'
        );

        // --- SELECTOR REFINEMENT FOR SEARCH RESULTS ---
        // Description Snippet: Focus specifically on the metadata snippet classes/container
        const descriptionElement = actualVideoElement.querySelector(
            'yt-formatted-string.metadata-snippet-text, ' + // Primary target class
            '.metadata-snippet-container yt-formatted-string, ' + // Search result descriptions
            '.metadata-snippet-container .metadata-snippet-text, ' + // Alternative class
            '#description-text, ' + // Channel page descriptions
            '#description-inline-expander .yt-core-attributed-string' // Watch page description
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

        // Extract channel text (prioritize yt-formatted-string in channel-info)
        const channelElement = actualVideoElement.querySelector('#channel-info yt-formatted-string, #channel-name yt-formatted-string, #byline-container');
        const channelText = (channelElement ? channelElement.textContent : '').toLowerCase().trim();
        
        let channelHandle = '';
        // Check for channel links - new improved method to get handle or ID
        const channelLinks = actualVideoElement.querySelectorAll('a[href^="/@"], a[href^="/channel/"], a[href*="/@"]');
        
        if (channelLinks.length > 0) {
            for (const link of channelLinks) {
                const href = link.getAttribute('href');
                
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
        
        // Debug logging for troubleshooting
        /*
        console.log("FilterTube SCAN:", {
            Element: suggestion,
            Type: suggestion.tagName,
             Title: videoTitle,
             Channel: channelName,
            Handle: channelHandle,
            Description: descriptionText,
            Keywords: trimmedKeywords,
            MatchesKeyword: trimmedKeywords.some(kw => videoTitle.includes(kw) || descriptionText.includes(kw))
        });
        */

        let shouldHide = false; // Determine if it SHOULD be hidden

        // 1. Check against blocked channel names.
        if (trimmedChannels.length > 0 && (channelName || channelHandle)) {
            // Use our new channel filtering logic
            if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
            shouldHide = true;
                // Debug
                // console.log(`FilterTube: Hiding video with channel: ${channelName || channelHandle}`);
            }
        }

        // 2. Check keywords against title, channel name, combined desc/hashtags, game card
        if (!shouldHide && trimmedKeywords.length > 0) {
            const checkText = (text) => {
                if (!text) return false;
                for (const keyword of trimmedKeywords) {
                    if (text.includes(keyword)) {
                        // Debug
                        // console.log(`FilterTube: Hiding video with keyword "${keyword}" in text: ${text.substring(0, 50)}...`);
                        return true;
                    }
                }
                return false;
            };
            
            if (checkText(videoTitle) || 
                checkText(channelName) || 
                (combinedDescAndHashtags && checkText(combinedDescAndHashtags)) || 
                checkText(gameCardTitle)) {
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
                    // console.log("Hiding Mix based on title match: " + mixTitle);
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
                    // console.log("Hiding Mix based on channel match in: " + mixTitle);
                    shouldHide = true;
                }
            }
        }

        // --- INVERTED LOGIC --- Apply .filter-tube-visible only if it should NOT be hidden
        if (!shouldHide) {
            suggestion.classList.add('filter-tube-visible');
            // Also make any direct child video renderers visible
            const childRenderer = suggestion.querySelector('ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-video-renderer');
            if (childRenderer) {
                childRenderer.classList.add('filter-tube-visible');
            }
        } else {
            // Ensure it remains hidden
             suggestion.classList.remove('filter-tube-visible');
            // Also hide any child renderers
            const childRenderer = suggestion.querySelector('ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-video-renderer');
            if (childRenderer) {
                childRenderer.classList.remove('filter-tube-visible');
            }
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
        
        // Get channel info from the header
        const channelName = header?.querySelector('#channel-name yt-formatted-string#text')?.textContent.toLowerCase().trim() || '';
        const channelHandle = header?.querySelector('#badge-row yt-formatted-string')?.textContent.toLowerCase().trim() || '';
        
        // Get title from the hero video
        const heroVideo = watchCard.querySelector('ytd-watch-card-hero-video-renderer');
        const heroTitle = heroVideo?.querySelector('#watch-card-title')?.textContent.toLowerCase().trim() || '';
        const heroSubtitle = heroVideo?.querySelector('#watch-card-subtitle')?.textContent.toLowerCase().trim() || '';
        
        // Check the compact videos in vertical list
        const compactVideos = watchCard.querySelectorAll('ytd-watch-card-compact-video-renderer');
        
        // Assume card should be visible by default
        let shouldHideCard = false;
        
        // Check if channel should be filtered
        if (trimmedChannels.length > 0 && (channelName || channelHandle)) {
            if (shouldFilterChannel(channelName, channelHandle, trimmedChannels)) {
                console.log(`Filtering watch card for channel: ${channelName || channelHandle}`);
                shouldHideCard = true;
            }
        }
        
        // Check if any keywords match the hero title
        if (!shouldHideCard && trimmedKeywords.length > 0 && heroTitle) {
            if (trimmedKeywords.some(keyword => heroTitle.includes(keyword))) {
                console.log(`Filtering watch card for keyword match in title: ${heroTitle}`);
                shouldHideCard = true;
            }
        }
        
        // Check if all compact videos should be filtered
        // Only filter the whole card if ALL compact videos would be filtered
        if (!shouldHideCard && compactVideos.length > 0) {
            let filteredVideosCount = 0;
            
            compactVideos.forEach(video => {
                const videoTitle = video.querySelector('.title')?.textContent.toLowerCase().trim() || '';
                const videoChannel = video.querySelector('.byline')?.textContent.toLowerCase().trim() || '';
                
                let shouldHideVideo = false;
                
                // Check keywords for video title
                if (trimmedKeywords.length > 0 && videoTitle) {
                    if (trimmedKeywords.some(keyword => videoTitle.includes(keyword))) {
                        shouldHideVideo = true;
                    }
                }
                
                // Check channel name filtering
                if (!shouldHideVideo && trimmedChannels.length > 0 && videoChannel) {
                    if (shouldFilterChannel(videoChannel, '', trimmedChannels)) {
                        shouldHideVideo = true;
                    }
                }
                
                if (shouldHideVideo) {
                    filteredVideosCount++;
                    video.classList.remove('filter-tube-visible');
                } else {
                    video.classList.add('filter-tube-visible');
                }
            });
            
            // If all videos would be filtered, hide the whole card
            if (filteredVideosCount === compactVideos.length) {
                shouldHideCard = true;
            }
        }
        
        if (shouldHideCard) {
            // Hide the entire card and its components
            watchCard.classList.remove('filter-tube-visible');
            
            // Also ensure child components are not visible
            const components = watchCard.querySelectorAll('ytd-watch-card-rich-header-renderer, ytd-watch-card-section-sequence-renderer, ytd-vertical-watch-card-list-renderer, ytd-watch-card-hero-video-renderer');
            components.forEach(component => {
                component.classList.remove('filter-tube-visible');
            });
        } else {
            // Card passes filter, make it visible
            watchCard.classList.add('filter-tube-visible');
            
            // Also make sure all child components are visible (except already filtered videos)
            if (header) header.classList.add('filter-tube-visible');
            
            // Make section sequence renderer visible
            const sectionSequence = watchCard.querySelector('ytd-watch-card-section-sequence-renderer');
            if (sectionSequence) sectionSequence.classList.add('filter-tube-visible');
            
            // Make vertical list renderer visible
            const verticalList = watchCard.querySelector('ytd-vertical-watch-card-list-renderer');
            if (verticalList) verticalList.classList.add('filter-tube-visible');
            
            // Make hero video visible if it exists
            if (heroVideo) heroVideo.classList.add('filter-tube-visible');
        }
    });
}

/**
 * Dedicated function to specifically target mix/playlist elements
 * Uses the most aggressive approach to ensure complete hiding
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 * @param {Node} rootNode - The root element to search within (defaults to document)
 */
function hideMixAndPlaylistElements(trimmedKeywords, trimmedChannels, rootNode = document) {
    // Target all possible mix/playlist elements
    const mixSelectors = [
        'yt-lockup-view-model',
        '.yt-lockup-view-model-wiz', 
        'ytd-rich-item-renderer:has(yt-lockup-view-model)',
        'ytd-rich-item-renderer:has(.yt-lockup-view-model-wiz)',
        'ytd-radio-renderer',
        'ytd-playlist-renderer',
        'ytd-mix-renderer'
    ].join(', ');

    try {
        const mixElements = rootNode.querySelectorAll(mixSelectors);
        
        if (mixElements.length === 0) {
            return; // No mix elements found
        }
        
        console.log(`FilterTube: Found ${mixElements.length} mix/playlist elements to check`);
        
        mixElements.forEach(mixElement => {
            // Find the title - could be in several different places
            const titleElements = mixElement.querySelectorAll('.yt-lockup-metadata-view-model-wiz__title, .yt-lockup-view-model-wiz__heading-reset, h3 span, .yt-lockup-metadata-view-model-wiz__heading-reset h3 a span');
            
            let titleText = '';
            for (const el of titleElements) {
                const text = el.textContent.toLowerCase().trim();
                if (text) {
                    titleText += ' ' + text;
                }
            }
            titleText = titleText.trim();
            
            // Look for channel names/artists - often in metadata content
            const metadataElements = mixElement.querySelectorAll('.yt-content-metadata-view-model-wiz__metadata-text, .yt-lockup-view-model-wiz__metadata span');
            
            let channelText = '';
            for (const el of metadataElements) {
                const text = el.textContent.toLowerCase().trim();
                if (text) {
                    channelText += ' ' + text;
                }
            }
            channelText = channelText.trim();
            
            // Look for channel handle links
            let channelHandle = '';
            const channelLinks = mixElement.querySelectorAll('a[href^="/@"], a[href^="/channel/"]');
            if (channelLinks.length > 0) {
                for (const link of channelLinks) {
                    const href = link.getAttribute('href');
                    if (href && href.includes('/@')) {
                        channelHandle = '@' + href.split('/@')[1].split('/')[0].toLowerCase();
                        break;
                    } else if (href && href.includes('/channel/')) {
                        channelHandle = 'channel/' + href.split('/channel/')[1].split('/')[0].toLowerCase();
                        break;
                    }
                }
            }
            
            // Debug log
            console.log(`FilterTube Mix Check: Title: "${titleText}", Channels: "${channelText}", Handle: "${channelHandle}"`);
            
            let shouldHide = false;
            
            // 1. Check keywords in title
            if (!shouldHide && trimmedKeywords.length > 0 && titleText) {
                for (const keyword of trimmedKeywords) {
                    if (titleText.includes(keyword)) {
                        console.log(`FilterTube: Hiding mix "${titleText}" - title contains keyword: ${keyword}`);
                        shouldHide = true;
                        break;
                    }
                }
            }
            
            // 2. Check keywords in metadata (artist names, etc)
            if (!shouldHide && trimmedKeywords.length > 0 && channelText) {
                for (const keyword of trimmedKeywords) {
                    if (channelText.includes(keyword)) {
                        console.log(`FilterTube: Hiding mix "${titleText}" - metadata contains keyword: ${keyword}`);
                        shouldHide = true;
                        break;
                    }
                }
            }
            
            // 3. Check channel filtering by name/handle
            if (!shouldHide && trimmedChannels.length > 0 && (channelText || channelHandle)) {
                if (shouldFilterChannel(channelText, channelHandle, trimmedChannels)) {
                    console.log(`FilterTube: Hiding mix "${titleText}" - channel match`);
                    shouldHide = true;
                }
            }
            
            // Get parent rich-item-renderer to completely hide it if needed
            const parentRichItem = mixElement.closest('ytd-rich-item-renderer');
            
            if (shouldHide) {
                // Ultra-aggressive hiding approach

                // 1. Hide the element itself with display: none
                mixElement.classList.remove('filter-tube-visible');
                mixElement.style.display = 'none';
                mixElement.style.visibility = 'hidden';
                mixElement.style.opacity = '0';
                mixElement.style.position = 'absolute';
                mixElement.style.width = '0';
                mixElement.style.height = '0';
                
                // 2. If parent exists, hide it with display: none
                if (parentRichItem) {
                    parentRichItem.classList.remove('filter-tube-visible');
                    parentRichItem.style.display = 'none';
                    parentRichItem.style.visibility = 'hidden';
                    parentRichItem.style.opacity = '0';
                    parentRichItem.style.position = 'absolute';
                    parentRichItem.style.width = '0';
                    parentRichItem.style.height = '0';
                }
                
                // 3. Direct targeting of image elements
                const allImages = mixElement.querySelectorAll('img');
                allImages.forEach(img => {
                    img.style.display = 'none';
                    img.style.visibility = 'hidden';
                    img.style.opacity = '0';
                    img.style.width = '0';
                    img.style.height = '0';
                });
                
                // 4. Target collection stacks specifically (the mix thumbnails)
                const collectionElements = mixElement.querySelectorAll(
                    'yt-collection-thumbnail-view-model, ' +
                    '.yt-collection-thumbnail-view-model, ' +
                    'yt-collections-stack, ' +
                    '.collections-stack-wiz, ' +
                    '.collections-stack-wiz__collection-stack1, ' +
                    '.collections-stack-wiz__collection-stack2'
                );
                
                collectionElements.forEach(el => {
                    el.style.display = 'none';
                    el.style.visibility = 'hidden';
                    el.style.opacity = '0';
                    el.style.position = 'absolute';
                    el.style.width = '0';
                    el.style.height = '0';
                });
                
                // 5. Target links that might be loading mix/playlist content
                const playlistLinks = mixElement.querySelectorAll('a[href*="&list="], a[href*="&start_radio="]');
                playlistLinks.forEach(link => {
                    link.style.display = 'none';
                    link.style.visibility = 'hidden';
                    link.style.opacity = '0';
                });
                
                // 6. Use the HTML dataset to mark as filtered
                mixElement.dataset.filterTubeHidden = 'true';
                if (parentRichItem) {
                    parentRichItem.dataset.filterTubeHidden = 'true';
                }
                
                // 7. Hide all child elements as a last resort
                const allChildren = mixElement.querySelectorAll('*');
                allChildren.forEach(child => {
                    child.style.display = 'none';
                });
                
            } else {
                // Make the element visible
                mixElement.classList.add('filter-tube-visible');
                mixElement.style.display = '';
                mixElement.style.visibility = '';
                mixElement.style.opacity = '';
                mixElement.style.position = '';
                mixElement.style.width = '';
                mixElement.style.height = '';
                
                delete mixElement.dataset.filterTubeHidden;
                
                // Also make parent visible if it exists
                if (parentRichItem) {
                    parentRichItem.classList.add('filter-tube-visible');
                    parentRichItem.style.display = '';
                    parentRichItem.style.visibility = '';
                    parentRichItem.style.opacity = '';
                    parentRichItem.style.position = '';
                    parentRichItem.style.width = '';
                    parentRichItem.style.height = '';
                    
                    delete parentRichItem.dataset.filterTubeHidden;
                }
            }
        });
        
        // Force browser layout recalculation to remove gaps
        document.body.offsetHeight;
        
    } catch (e) {
        console.error('FilterTube: Error finding mix elements:', e);
    }
}

// --- Dynamic Content Handling (MutationObserver & Interval) ---

let throttleTimeout = null;
const FILTER_DELAY = 500; // Shortened delay slightly, as initial hide is faster

/**
 * Main filtering function called on load and on changes.
 * Applies the inverted logic (revealing wanted content).
 */
function applyFilters() {
    console.log('FilterTube: Applying filters');
    
    // Get the filter values from global variables to avoid reference issues
    const keywords = (filterKeywords || '').split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .map(k => k.toLowerCase());
    
    const channels = (filterChannels || '').split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0)
        .map(c => c.toLowerCase());
    
    console.log(`FilterTube: Filtering with keywords=[${keywords.join(', ')}], channels=[${channels.join(', ')}]`);
    
    // If no filters set, show all elements
    if (keywords.length === 0 && channels.length === 0) {
        console.log('FilterTube: No filters set, showing all elements');
        showAllElements();
        return;
    }
    
    // Apply filters to different element types
    hideVideos(keywords, channels);
    hidePlaylistsAndShelves(keywords, channels);
    hideChannelElements(keywords, channels);
    hideShorts(keywords, channels);
    hideMixAndPlaylistElements(keywords, channels);
    
    // Special handlers for sections that need extra processing
    handleWatchCardFiltering(keywords, channels);
    
    // Handle comment filtering
    if (window.location.pathname.startsWith('/watch')) {
        applyCommentFiltering();
    }
    
    // Fix layout issues after filtering
    if (window.filterTubeLayout) {
        console.log('FilterTube: Applying layout fixes after filtering');
        
        // Fix search results layout
        if (typeof window.filterTubeLayout.fixSearchResultsLayout === 'function') {
            window.filterTubeLayout.fixSearchResultsLayout();
        }
        
        // Fix shorts layout 
        if (typeof window.filterTubeLayout.fixShortsLayout === 'function') {
            window.filterTubeLayout.fixShortsLayout();
        }
        
        // Fix homepage shorts specifically
        if (typeof window.filterTubeLayout.fixHomepageShorts === 'function') {
            window.filterTubeLayout.fixHomepageShorts();
        }
        
        // Apply any general layout fixes
        if (typeof window.filterTubeLayout.fixLayoutAfterFiltering === 'function') {
            window.filterTubeLayout.fixLayoutAfterFiltering();
        }
    } else {
        // Fallback if layout module isn't available
        console.log('FilterTube: Layout module not available, using fallback');
        fixSearchResultsLayout();
    }
    
    console.log('FilterTube: Filters applied successfully');
}

/**
 * Shows all elements by adding the .filter-tube-visible class to everything
 */
function showAllElements() {
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
        'ytd-playlist-renderer',
        'yt-lockup-view-model',
        '.yt-lockup-view-model-wiz',
        '.yt-lockup-metadata-view-model-wiz'
    ].join(', ');

        try {
            document.querySelectorAll(allSelectors).forEach(el => {
                el.classList.add('filter-tube-visible');
            el.classList.remove('hidden-video'); // Clean up old class
            
            // Remove any inline styles that might be causing visibility issues
            el.style.display = '';
            el.style.visibility = '';
            el.style.position = '';
            el.style.width = '';
            el.style.height = '';
            el.style.margin = '';
            el.style.padding = '';
            el.style.overflow = '';
        });
        
        // Fix layout after showing all elements
        if (window.filterTubeLayout && typeof window.filterTubeLayout.fixLayoutAfterFiltering === 'function') {
            window.filterTubeLayout.fixLayoutAfterFiltering();
        } else {
            fixSearchResultsLayout();
        }
        
        console.log('FilterTube: All elements shown');
        } catch (e) {
        console.error('FilterTube: Error showing all elements:', e);
    }
}

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
    
    // Normalize inputs
    channelName = (channelName || '').toLowerCase().trim();
    channelHandle = (channelHandle || '').toLowerCase().trim();
    
    // Detect if we have a channel ID (looks like /channel/UC...)
    let channelId = '';
    if (channelHandle.includes('/channel/')) {
        const match = channelHandle.match(/\/channel\/([\w-]+)/);
        if (match && match[1]) {
            channelId = match[1].toLowerCase();
        }
    } else if (channelHandle.startsWith('channel/')) {
        channelId = channelHandle.replace('channel/', '').toLowerCase();
    }
    
    // Debug log when needed
    // console.log(`FilterTube Debug: Checking channel - Name: "${channelName}", Handle: "${channelHandle}", ID: "${channelId}"`);
    
    for (const blockedChannel of trimmedChannels) {
        const blockedValue = blockedChannel.toLowerCase().trim();
        
        // Case 1: Blocked value is a handle (starts with @)
        if (blockedValue.startsWith('@')) {
            // Remove @ for comparison
            const blockedHandle = blockedValue.substring(1);
            
            // If channelHandle has @ remove it for comparison
            const normalizedHandle = channelHandle.startsWith('@') 
                ? channelHandle.substring(1) 
                : channelHandle;
                
            // EXACT match for handles - must match completely, not partial
            if (normalizedHandle === blockedHandle) {
                console.log(`FilterTube: Filtering channel with exact handle match: ${channelHandle} = ${blockedValue}`);
                return true;
            }
        }
        // Case 2: Blocked value is a channel ID (starts with "channel/")
        else if (blockedValue.startsWith('channel/')) {
            const blockedId = blockedValue.replace('channel/', '');
            
            // EXACT match for channel IDs - must match completely
            if (channelId && channelId === blockedId) {
                console.log(`FilterTube: Filtering channel with exact ID match: ${channelId} = ${blockedId}`);
                return true;
            }
        }
        // Case 3: Blocked value is a regular channel name (partial match)
        else {
            // Use partial matching for regular channel names
            if (channelName && channelName.includes(blockedValue)) {
                console.log(`FilterTube: Filtering channel with name match: ${channelName} contains ${blockedValue}`);
                return true;
            }
        }
    }
    
    return false;
}

// Replace the existing function with a wrapper that calls the layout module
function fixSearchResultsLayout() {
    // Check if our layout module is loaded
    if (window.filterTubeLayout && typeof window.filterTubeLayout.fixSearchResultsLayout === 'function') {
        // Call the layout module
        window.filterTubeLayout.fixSearchResultsLayout();
    } else {
        console.warn('FilterTube: Layout module not loaded yet. Layout fixes may not work properly.');
        // Try again after a short delay in case the script is still loading
        setTimeout(() => {
            if (window.filterTubeLayout && typeof window.filterTubeLayout.fixSearchResultsLayout === 'function') {
                window.filterTubeLayout.fixSearchResultsLayout();
            }
        }, 500);
    }
}

console.log("FilterTube Content Script Loaded (run_at=document_start)");

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
                    'ytd-rich-shelf-renderer[is-shorts]', // Shorts shelf
                ];
                
                // Check if the node matches any high priority selector
                if (highPrioritySelectors.some(selector => {
                    try {
                        return node.matches?.(selector) || node.querySelector?.(selector);
                    } catch (e) {
                        return false; // Safely handle invalid selectors
                    }
                })) {
                    highPriorityChange = true;
                    break;
                }
                
                // Regular check for any potentially relevant element
                try {
                    // Check if the node itself is a relevant element
                    const isRelevantNode = node.tagName && (
                        node.tagName.toLowerCase().startsWith('ytd-') ||
                        node.tagName.toLowerCase().startsWith('yt-')
                    );
                    
                    if (isRelevantNode) {
                        potentiallyRelevantChange = true;
                    }
                } catch (e) {
                    // Ignore errors in selector matching
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
        applyFilters();
        return;
    }

    if (!potentiallyRelevantChange) return; // Skip if no relevant nodes were likely added
    if (throttleTimeout) return; // Throttle if already scheduled

    throttleTimeout = setTimeout(() => {
        console.log("FilterTube: Applying filters due to potential relevant DOM change.");
        applyFilters();
        throttleTimeout = null;
    }, FILTER_DELAY);
};

// Create a MutationObserver instance with the callback.
const observer = new MutationObserver(observerCallback);

// Configuration for the observer:
const observerConfig = {
    childList: true,
    subtree: true,
    attributes: false  // No need to observe attributes, focus on element additions
};

// Start observing the document body
function startObserver() {
    if (!document.body) {
        console.log("FilterTube: Document body not ready yet, retrying in 100ms");
        setTimeout(startObserver, 100);
        return;
    }
    
    try {
    observer.observe(document.body, observerConfig);
        console.log("FilterTube: MutationObserver started successfully");
    } catch (e) {
        console.error("FilterTube: Error starting MutationObserver:", e);
    }
}

// Initial load and setup
function initialize() {
    // Load settings
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], function (items) {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        
        console.log(`FilterTube: Loaded settings - Keywords: "${filterKeywords}", Channels: "${filterChannels}"`);
        
        // Start the observer
        startObserver();
        
        // Initial filter application
        applyFilters();
    });
}

// Initialize as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Listen for storage changes
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'local') {
        let needsRefilter = false;
        
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || '';
            console.log(`FilterTube: Keywords changed to "${filterKeywords}"`);
            needsRefilter = true;
        }
        
        if (changes.filterChannels) {
            filterChannels = changes.filterChannels.newValue || '';
            console.log(`FilterTube: Channels changed to "${filterChannels}"`);
            needsRefilter = true;
        }
        
        if (needsRefilter) {
            // Re-apply filters with updated values
            console.log("FilterTube: Reapplying filters due to settings change");
            applyFilters();
        }
    }
});

// Fallback interval check to ensure filtering is consistently applied
const intervalCheck = setInterval(() => {
    applyFilters();
}, 5000); // Check every 5 seconds as a safety net

// Clean up when the page is unloaded
window.addEventListener('unload', () => {
    if (observer) observer.disconnect();
    if (intervalCheck) clearInterval(intervalCheck);
    if (throttleTimeout) clearTimeout(throttleTimeout);
    console.log("FilterTube: Cleaned up resources on page unload");
});


