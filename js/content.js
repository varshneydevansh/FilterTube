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

// Main variables for filtering and throttling
const FILTER_DELAY = 300; // Small delay to batch mutations
let throttleTimeout = null;

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
        console.log(`FilterTube: Filtering with ${trimmedKeywords.length} keywords and ${trimmedChannels.length} channels`);
        
        // Reset processed flag on existing elements to enable reprocessing
        // This is important when filters change
        if (window.lastFilterTime && Date.now() - window.lastFilterTime > 5000) {
            // Only clear processed flags if it's been more than 5 seconds
            // since last filter to avoid unnecessary reprocessing
            document.querySelectorAll('[data-filter-tube-processed="true"]').forEach(el => {
                el.removeAttribute('data-filter-tube-processed');
            });
        }
        
        // Store timestamp of this filter operation
        window.lastFilterTime = Date.now();
        
        // First, handle the most visible elements
        hideVideos(trimmedKeywords, trimmedChannels);
        hideShorts(trimmedKeywords, trimmedChannels);
        
        // Then handle the playlist/mix containers
        hideMixAndPlaylistElements(trimmedKeywords, trimmedChannels);
        
        // Then handle the remaining elements
        hidePlaylistsAndShelves(trimmedKeywords, trimmedChannels);
        hideChannelElements(trimmedKeywords, trimmedChannels);
        
        // Handle special cases
        handleWatchCardFiltering(trimmedKeywords, trimmedChannels);
        
        // Apply comment filtering if on watch page
        if (window.location.pathname.startsWith('/watch')) {
            applyCommentFiltering();
        }
    } else {
        // Optional: If all filters are removed, unhide previously hidden videos/elements.
        showAllElements();
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
            '.metadata-snippet-text, ' + // Make sure we catch all metadata snippets
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
        
        // Additional text to check - find all metadata snippet text elements
        const allMetadataSnippets = actualVideoElement.querySelectorAll('.metadata-snippet-container yt-formatted-string, .metadata-snippet-text, yt-formatted-string.metadata-snippet-text');
        let additionalMetadataText = '';
        allMetadataSnippets.forEach(snippet => {
            additionalMetadataText += ' ' + (snippet.textContent || '').toLowerCase().trim();
        });
        
        // Debug logging for troubleshooting
        /*
        console.log("FilterTube SCAN:", {
            Element: suggestion,
            Type: suggestion.tagName,
             Title: videoTitle,
             Channel: channelName,
            Handle: channelHandle,
            Description: descriptionText,
            AdditionalMetadata: additionalMetadataText,
            Keywords: trimmedKeywords,
            MatchesKeyword: trimmedKeywords.some(kw => videoTitle.includes(kw) || descriptionText.includes(kw) || additionalMetadataText.includes(kw))
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
                checkText(combinedDescAndHashtags) || 
                checkText(additionalMetadataText) ||
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

        // Special case for rich-item-renderer containing mix/playlist elements
        if (suggestion.matches('ytd-rich-item-renderer')) {
            // Check if it's a mix card by looking for specific elements
            const isMixCard = !!suggestion.querySelector('.yt-lockup-view-model-wiz, .yt-lockup-metadata-view-model-wiz, ytd-radio-renderer, ytd-mix-renderer, ytd-playlist-renderer');
            
            if (isMixCard) {
                // For mix cards, we want to do extra checking on all visible text content
                const allTextElements = suggestion.querySelectorAll('h3, span, yt-formatted-string, .yt-core-attributed-string');
                let allText = '';
                
                allTextElements.forEach(el => {
                    allText += ' ' + (el.textContent || '').toLowerCase().trim();
                });
                
                if (trimmedKeywords.length > 0) {
                    for (const keyword of trimmedKeywords) {
                        if (allText.includes(keyword)) {
                            shouldHide = true;
                            console.log(`FilterTube: Hiding mix with keyword "${keyword}" in text: ${allText.substring(0, 50)}...`);
                            break;
                        }
                    }
                }
                
                // If it's a mix and should be hidden, make sure to aggressively hide it
                if (shouldHide) {
                    suggestion.classList.remove('filter-tube-visible');
                    
                    // Aggressively hide this mix element
                    suggestion.style.display = 'none !important';
                    suggestion.style.visibility = 'hidden !important';
                    suggestion.style.opacity = '0 !important';
                    suggestion.style.width = '0 !important';
                    suggestion.style.height = '0 !important';
                    suggestion.style.position = 'absolute !important';
                    suggestion.style.pointerEvents = 'none !important';
                    
                    // Also hide all thumbnails and images inside
                    const allImages = suggestion.querySelectorAll('img, yt-thumbnail, yt-img-shadow');
                    allImages.forEach(img => {
                        img.style.display = 'none !important';
                        img.style.visibility = 'hidden !important';
                        img.style.opacity = '0 !important';
                    });
                    
                    return; // Skip the rest of the processing
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
    // Expanded selector to catch all shorts variants including the new format
    const shortsSelector = 'ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytd-shorts, ytd-reel-video-renderer, .shortsLockupViewModelHost, ytm-shorts-lockup-view-model-v2';

    let shortsItems = [];
    try {
        shortsItems = rootNode.querySelectorAll(shortsSelector);
    } catch(e) {
        console.error('FilterTube: Error finding Shorts elements:', e);
        return;
    }

    if (shortsItems.length === 0) {
        return; // No shorts found, exit quietly
    }
    
    console.log(`FilterTube: Found ${shortsItems.length} shorts to check`);

    for (let i = 0; i < shortsItems.length; i++) {
        const item = shortsItems[i];
        
        // Skip if already processed to avoid duplicate work
        if (item.dataset.filterTubeProcessed === 'true') {
            continue;
        }
        
        // More comprehensive selectors to find title and channel elements
        const titleElement = item.querySelector(
            '#video-title, ' + 
            '.shortsLockupViewModelHostMetadataTitle, ' + 
            'yt-formatted-string.title, ' + 
            'h3 .yt-core-attributed-string, ' +
            'span.yt-core-attributed-string'
        );
        
        const channelElement = item.querySelector(
            '#channel-name .yt-simple-endpoint, ' + 
            '.shortsLockupViewModelHostChannelTitle, ' + 
            '.metadata-text, ' + 
            'yt-formatted-string.ytd-channel-name, ' +
            '.shortsLockupViewModelHostMetadataSubhead'
        );
        
        // Extract text from elements
        const titleText = titleElement ? titleElement.textContent.toLowerCase().trim() : '';
        const channelText = channelElement && channelElement !== titleElement ? channelElement.textContent.toLowerCase().trim() : '';
        
        let shouldHide = false;

        // Check for channel match
        if (trimmedChannels.length > 0 && channelText) {
            if (trimmedChannels.some(blockedChannel => channelText.includes(blockedChannel))) {
                console.log(`FilterTube: Hiding shorts by channel: ${channelText}`);
                shouldHide = true;
            }
        }
        
        // Check for keyword match in title
        if (!shouldHide && trimmedKeywords.length > 0 && titleText) {
            if (trimmedKeywords.some(keyword => titleText.includes(keyword))) {
                console.log(`FilterTube: Hiding shorts with keyword in title: ${titleText}`);
                shouldHide = true;
            }
        }
        
        // Only gather all text if needed (optimization)
        if (!shouldHide && trimmedKeywords.length > 0) {
            // Get all visible text content as a single string
            const allTextElements = item.querySelectorAll('h3, span, a, div[class*="title"], div[class*="metadata"]');
            let allText = '';
            
            for (let j = 0; j < allTextElements.length; j++) {
                const el = allTextElements[j];
                allText += ' ' + (el.textContent || '').toLowerCase().trim();
            }
            
            for (const keyword of trimmedKeywords) {
                if (allText.includes(keyword)) {
                    console.log(`FilterTube: Hiding shorts with keyword in content: ${keyword}`);
                    shouldHide = true;
                    break;
                }
            }
        }

        // Aggressively hide if needed
        if (shouldHide) {
            item.classList.remove('filter-tube-visible');
            
            // Aggressively hide to ensure it's not visible
            item.style.display = 'none !important';
            item.style.visibility = 'hidden !important';
            item.style.opacity = '0 !important';
            item.style.position = 'absolute !important';
            item.style.width = '0 !important';
            item.style.height = '0 !important';
            
            // Also hide all thumbnails and images inside
            const allImages = item.querySelectorAll('img, yt-thumbnail, yt-img-shadow');
            for (let j = 0; j < allImages.length; j++) {
                const img = allImages[j];
                img.style.display = 'none !important';
                img.style.visibility = 'hidden !important';
                img.style.opacity = '0 !important';
            }
            
            // Use the HTML dataset to mark as filtered
            item.dataset.filterTubeHidden = 'true';
        } else {
            item.classList.add('filter-tube-visible');
        }
        
        // Mark as processed to avoid redundant checks
        item.dataset.filterTubeProcessed = 'true';
    }
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
 * Simplified mix/playlist filtering for homepage and feed cards.
 * Only hide if the mix/playlist text contains a filtered keyword.
 */
function hideMixAndPlaylistElements(trimmedKeywords, trimmedChannels, rootNode = document) {
    const cards = rootNode.querySelectorAll('ytd-rich-item-renderer');
    cards.forEach(card => {
        // Only process items that contain a mix, playlist, or radio renderer
        if (!card.querySelector('ytd-mix-renderer, ytd-playlist-renderer, ytd-radio-renderer')) return;
        // Check all text in the card for any keyword or channel matches
        const text = (card.textContent || '').toLowerCase();
        const keywordMatch = trimmedKeywords.length > 0 && trimmedKeywords.some(keyword => text.includes(keyword));
        const channelMatch = trimmedChannels.length > 0 && trimmedChannels.some(channel => text.includes(channel));
        const shouldHide = keywordMatch || channelMatch;
        if (shouldHide) {
            card.classList.remove('filter-tube-visible');
        } else {
            card.classList.add('filter-tube-visible');
        }
    });
}

/**
 * Special handling to ensure watch cards with filtered keywords in description are hidden
 * @param {string[]} trimmedKeywords - Array of lowercase keywords to filter by
 * @param {string[]} trimmedChannels - Array of lowercase channel names to filter by
 */
function ensureWatchCardKeywordFiltering(trimmedKeywords, trimmedChannels) {
    if (trimmedKeywords.length === 0) return;
    
    const watchCards = document.querySelectorAll('ytd-universal-watch-card-renderer');
    
    watchCards.forEach(card => {
        // Skip if already properly hidden
        if (!card.classList.contains('filter-tube-visible')) return;
        
        // Get all text content from the card
        const allTextElements = card.querySelectorAll('yt-formatted-string, span, h3, div[id*="title"], div[id*="subtitle"]');
        let allCardText = '';
        
        allTextElements.forEach(el => {
            allCardText += ' ' + (el.textContent || '').toLowerCase().trim();
        });
        
        // Check if any keyword matches
        for (const keyword of trimmedKeywords) {
            if (allCardText.includes(keyword)) {
                console.log(`FilterTube: Hiding watch card with keyword "${keyword}" in content`);
                
                // Remove visible class
                card.classList.remove('filter-tube-visible');
                
                // Also hide all child elements that might have been marked visible
                const visibleChildren = card.querySelectorAll('.filter-tube-visible');
                visibleChildren.forEach(child => child.classList.remove('filter-tube-visible'));
                
                // Apply aggressive hiding
                card.style.display = 'none !important';
                card.style.visibility = 'hidden !important';
                card.style.opacity = '0 !important';
                
                break;
            }
        }
    });
}

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
    
    // More aggressive hiding for mix/playlist elements
    hideMixAndPlaylistElements(keywords, channels);
    
    // Special handlers for sections that need extra processing
    handleWatchCardFiltering(keywords, channels);
    
    // New: Extra check to ensure watch cards with filtered keywords are hidden
    ensureWatchCardKeywordFiltering(keywords, channels);
    
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
 * Uses different matching strategies for handles vs. regular names
 * @param {string} channelName - The channel name to check (lowercase)
 * @param {string} channelHandle - The channel handle to check (lowercase)
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
    
    // Extract channel ID if present in format /channel/ID or channel/ID
    let channelId = '';
    if (channelHandle.includes('/channel/')) {
        const match = channelHandle.match(/\/channel\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            channelId = match[1].toLowerCase();
        }
    } else if (channelHandle.startsWith('channel/')) {
        channelId = channelHandle.replace('channel/', '').toLowerCase();
    } else if (channelHandle.includes('@')) {
        // Extract handle in the format @username
        const match = channelHandle.match(/@([a-zA-Z0-9_.-]+)/);
        if (match && match[1]) {
            channelHandle = '@' + match[1].toLowerCase();
        }
    }
    
    // Check against each blocked channel
    for (let i = 0; i < trimmedChannels.length; i++) {
        const blockedValue = trimmedChannels[i].toLowerCase().trim();
        
        // Case 1: Blocked value is a handle (starts with @)
        if (blockedValue.startsWith('@')) {
            // Direct match for handles
            if (channelHandle && channelHandle.includes(blockedValue)) {
                console.log(`FilterTube: Filtering by handle match: ${channelHandle} includes ${blockedValue}`);
                return true;
            }
        }
        // Case 2: Blocked value is a channel ID (starts with "channel/")
        else if (blockedValue.startsWith('channel/')) {
            const blockedId = blockedValue.replace('channel/', '');
            
            // EXACT match for channel IDs
            if (channelId && channelId === blockedId) {
                console.log(`FilterTube: Filtering by channel ID match: ${channelId}`);
                return true;
            }
        }
        // Case 3: Blocked value is a regular channel name (partial match)
        else if (channelName && channelName.includes(blockedValue)) {
            console.log(`FilterTube: Filtering by channel name: ${channelName} includes ${blockedValue}`);
            return true;
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
    
    // Optimize the checking of mutations by sampling
    // Only check a subset of mutations to determine if filtering is needed
    const maxMutationsToCheck = Math.min(mutations.length, 10); // Check at most 10 mutations
    
    for (let i = 0; i < maxMutationsToCheck; i++) {
        const mutation = mutations[i];
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check up to 3 added nodes per mutation
            const nodesToCheck = Math.min(mutation.addedNodes.length, 3);
            
            for (let j = 0; j < nodesToCheck; j++) {
                const node = mutation.addedNodes[j];
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                
                // High priority selectors - needs immediate handling
                const highPrioritySelectors = [
                    'ytd-rich-item-renderer', // Home page items
                    'ytd-grid-video-renderer', // Channel page videos
                    'ytd-video-renderer', // Search results
                    '.yt-lockup-view-model-wiz', // Mix elements with thumbnails
                    'ytd-universal-watch-card-renderer', // Watch cards
                    'ytd-radio-renderer', // Radio/mix cards
                    'ytd-reel-item-renderer', // Shorts items
                    'ytm-shorts-lockup-view-model', // Mobile shorts
                    '.shortsLockupViewModelHost', // Another shorts variant
                ];
                
                // Fast check - just test tag names first
                const nodeName = node.nodeName.toLowerCase();
                if (nodeName.startsWith('ytd-') || nodeName.startsWith('yt-') || nodeName.startsWith('ytm-')) {
                    potentiallyRelevantChange = true;
                    
                    // Check against high priority selectors
                    try {
                        for (let k = 0; k < highPrioritySelectors.length; k++) {
                            const selector = highPrioritySelectors[k];
                            if (node.matches?.(selector) || node.querySelector?.(selector)) {
                                highPriorityChange = true;
                                break;
                            }
                        }
                    } catch (e) {
                        // Safely handle invalid selectors
                    }
                    
                    if (highPriorityChange) break;
                }
            }
        }
        if (highPriorityChange) break;
    }

    // If high priority elements were added, filter immediately
    if (highPriorityChange) {
        // Cancel any pending throttled filtering
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
            throttleTimeout = null;
        }
        
        // Apply specialized filtering instead of full filtering
        filterPriorityElements();
        return;
    }

    if (!potentiallyRelevantChange) return; // Skip if no relevant nodes were likely added
    if (throttleTimeout) return; // Throttle if already scheduled

    throttleTimeout = setTimeout(() => {
        hideSuggestionsByPreferences(filterKeywords, filterChannels);
        throttleTimeout = null;
    }, FILTER_DELAY);
};

/**
 * Faster filtering method that only targets specific high-priority elements
 * This is used for immediate response to important DOM changes
 */
function filterPriorityElements() {
    const trimmedKeywords = (filterKeywords || '').split(',')
                                          .map(keyword => keyword.trim().toLowerCase())
                                          .filter(Boolean);
    const trimmedChannels = (filterChannels || '').split(',')
                                           .map(channel => channel.trim().toLowerCase())
                                           .filter(Boolean);
    
    if (trimmedKeywords.length === 0 && trimmedChannels.length === 0) {
        return; // No filters defined
    }
    
    // Only filter newly added elements that don't have the processed flag
    const newElements = document.querySelectorAll(`
        ytd-rich-item-renderer:not([data-filter-tube-processed]), 
        ytd-grid-video-renderer:not([data-filter-tube-processed]), 
        ytd-video-renderer:not([data-filter-tube-processed]),
        .yt-lockup-view-model-wiz:not([data-filter-tube-processed]),
        ytd-universal-watch-card-renderer:not([data-filter-tube-processed]),
        ytd-radio-renderer:not([data-filter-tube-processed]),
        ytd-reel-item-renderer:not([data-filter-tube-processed]),
        ytm-shorts-lockup-view-model:not([data-filter-tube-processed]),
        .shortsLockupViewModelHost:not([data-filter-tube-processed])
    `);
    
    if (newElements.length === 0) {
        return;
    }
    
    console.log(`FilterTube: Quick filtering ${newElements.length} new elements`);
    
    // Process based on element type
    for (let i = 0; i < newElements.length; i++) {
        const el = newElements[i];
        
        // Process based on element type
        if (el.matches('ytd-reel-item-renderer, ytm-shorts-lockup-view-model, .shortsLockupViewModelHost')) {
            // Fast-track shorts filtering
            processShortsElement(el, trimmedKeywords, trimmedChannels);
        } 
        else if (el.matches('.yt-lockup-view-model-wiz, ytd-radio-renderer, ytd-mix-renderer')) {
            // Fast-track mix filtering
            processMixElement(el, trimmedKeywords, trimmedChannels);
        }
        else {
            // Standard video filtering
            processVideoElement(el, trimmedKeywords, trimmedChannels);
        }
        
        // Mark as processed
        el.dataset.filterTubeProcessed = 'true';
    }
}

/**
 * Helper for quick filtering of shorts elements
 */
function processShortsElement(element, trimmedKeywords, trimmedChannels) {
    // Find title and channel
    const titleElement = element.querySelector('#video-title, .shortsLockupViewModelHostMetadataTitle, span.yt-core-attributed-string');
    const channelElement = element.querySelector('#channel-name, .shortsLockupViewModelHostMetadataSubhead');
    
    // Get text content
    const titleText = titleElement ? titleElement.textContent.toLowerCase().trim() : '';
    const channelText = channelElement ? channelElement.textContent.toLowerCase().trim() : '';
    
    let shouldHide = false;
    
    // Check keywords in title
    if (trimmedKeywords.length > 0 && titleText) {
        for (const keyword of trimmedKeywords) {
            if (titleText.includes(keyword)) {
                shouldHide = true;
                break;
            }
        }
    }
    
    // Check channel match
    if (!shouldHide && trimmedChannels.length > 0 && channelText) {
        for (const blockedChannel of trimmedChannels) {
            if (channelText.includes(blockedChannel)) {
                shouldHide = true;
                break;
            }
        }
    }
    
    // Apply visibility
    if (shouldHide) {
        element.classList.remove('filter-tube-visible');
        element.style.display = 'none !important';
        element.style.visibility = 'hidden !important';
        element.dataset.filterTubeHidden = 'true';
    } else {
        element.classList.add('filter-tube-visible');
    }
}

/**
 * Helper for quick filtering of mix elements
 */
function processMixElement(element, trimmedKeywords, trimmedChannels) {
    // Find the containing feed card
    const card = element.closest('ytd-rich-item-renderer');
    if (!card) return;

    // Combine all visible text in this card
    const text = (card.textContent || '').toLowerCase().trim();
    
    // Determine if should hide based on keywords or channels
    let shouldHide = false;
    if (trimmedKeywords.length > 0 && trimmedKeywords.some(kw => text.includes(kw))) {
        shouldHide = true;
    }
    if (!shouldHide && trimmedChannels.length > 0 && trimmedChannels.some(ch => text.includes(ch))) {
        shouldHide = true;
    }

    // Toggle visibility on the entire card
    if (shouldHide) {
        card.classList.remove('filter-tube-visible');
    } else {
        card.classList.add('filter-tube-visible');
    }
}

/**
 * Helper for quick filtering of standard video elements
 */
function processVideoElement(element, trimmedKeywords, trimmedChannels) {
    // Get title and channel
    const titleElement = element.querySelector('#video-title, .title');
    const channelElement = element.querySelector('#channel-name, #byline');
    
    // Get text content
    const titleText = titleElement ? titleElement.textContent.toLowerCase().trim() : '';
    const channelText = channelElement ? channelElement.textContent.toLowerCase().trim() : '';
    
    let shouldHide = false;
    
    // Check keywords in title
    if (trimmedKeywords.length > 0 && titleText) {
        for (const keyword of trimmedKeywords) {
            if (titleText.includes(keyword)) {
                shouldHide = true;
                break;
            }
        }
    }
    
    // Check channel match
    if (!shouldHide && trimmedChannels.length > 0 && channelText) {
        for (const blockedChannel of trimmedChannels) {
            if (channelText.includes(blockedChannel)) {
                shouldHide = true;
                break;
            }
        }
    }
    
    // Apply visibility
    if (shouldHide) {
        element.classList.remove('filter-tube-visible');
        element.style.display = 'none !important';
        element.style.visibility = 'hidden !important';
        element.dataset.filterTubeHidden = 'true';
    } else {
        element.classList.add('filter-tube-visible');
    }
}

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




