/**
 * FilterTube Content Script - Zero Flash Version
 * Uses CSS and early filtering to hide elements immediately
 */

// Global variables for filter settings
let filterKeywords = '';
let filterChannels = '';
let hideAllComments = false;
let filterComments = false;
let observer = null;
let filtersApplied = false;
let stylesInjected = false;

// Immediately inject a style element to hide content until filtering
function injectHidingStyles() {
    if (stylesInjected) return;
    
    const style = document.createElement('style');
    style.id = 'filter-tube-styles';
    style.textContent = `
        /* Hide video elements by default until they're processed */
        ytd-video-renderer,
        ytd-grid-video-renderer,
        ytd-rich-item-renderer,
        ytd-compact-video-renderer,
        ytd-reel-item-renderer,
        ytd-playlist-renderer,
        ytd-radio-renderer,
        ytd-shelf-renderer,
        ytd-channel-video-player-renderer,
        yt-lockup-view-model,
        ytd-universal-watch-card-renderer,
        ytd-secondary-search-container-renderer > *,
        ytm-shorts-lockup-view-model,
        ytm-shorts-lockup-view-model-v2,
        ytd-channel-renderer,
        ytd-ticket-shelf-renderer {
            opacity: 0 !important;
            transition: opacity 0.1s ease-in-out !important;
        }
        
        /* Comment elements */
        ytd-comment-thread-renderer,
        ytd-comment-renderer,
        ytd-comment-replies-renderer {
            transition: opacity 0.1s ease-in-out, height 0.3s ease-out !important;
        }
        
        /* Show elements marked as allowed */
        [data-filter-tube-allowed="true"] {
            opacity: 1 !important;
        }
        
        /* Hide filtered elements */
        [data-filter-tube-filtered="true"] {
            display: none !important;
        }
        
        /* Hide comments section entirely if enabled */
        .filtertube-hide-all-comments #comments,
        .filtertube-hide-all-comments ytd-comments,
        .filtertube-hide-all-comments ytd-item-section-renderer[section-identifier="comment-item-section"] {
            display: none !important;
        }
        
        /* Hide filtered comments when in filtered mode */
        .filtertube-filter-comments ytd-comment-thread-renderer[data-filter-tube-filtered="true"],
        .filtertube-filter-comments ytd-comment-renderer[data-filter-tube-filtered="true"] {
            display: none !important;
        }
        
        /* IMPORTANT: Don't interfere with scroll functionality */
        yt-horizontal-list-renderer,
        #scroll-container,
        #items,
        .shortsLockupViewModelHost {
            opacity: 1 !important;
        }
        
        /* Only apply styling to shorts contents, not their containers */
        ytd-reel-shelf-renderer,
        yt-horizontal-list-renderer {
            opacity: 1 !important;
        }
        
        /* For shorts that match filter */
        ytm-shorts-lockup-view-model[data-filter-tube-filtered="true"],
        ytm-shorts-lockup-view-model-v2[data-filter-tube-filtered="true"] {
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
        }
        
        /* Ensure channel renderers are properly hidden when filtered */
        ytd-channel-renderer[data-filter-tube-filtered="true"] {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            overflow: hidden !important;
        }
    `;
    
    // Add style to head as early as possible
    document.documentElement.appendChild(style);
    stylesInjected = true;
}

// Inject styles immediately (even before DOM is ready)
injectHidingStyles();

// More comprehensive selectors to catch all types of video elements
const VIDEO_SELECTORS = [
    'ytd-video-renderer',            // Standard search results
    'ytd-grid-video-renderer',       // Grid view (channel pages, etc.)
    'ytd-rich-item-renderer',        // Home page items
    'ytd-compact-video-renderer',    // Sidebar recommendations
    'ytd-reel-item-renderer',        // Shorts items
    'ytd-playlist-renderer',         // Playlists
    'ytd-radio-renderer',            // Mix items
    'ytd-shelf-renderer',            // Shelves (sections on home page)
    'ytd-channel-video-player-renderer', // Featured videos on channel pages
    'yt-lockup-view-model',          // Classic YouTube video items
    'ytd-universal-watch-card-renderer', // Side panel movie/video cards
    'ytd-secondary-search-container-renderer > *', // Additional side panel items
    'ytm-shorts-lockup-view-model',  // Shorts items (new format)
    'ytm-shorts-lockup-view-model-v2', // Shorts items v2 format
    'ytd-channel-renderer',          // Channel results in search
    'ytd-ticket-shelf-renderer'      // Ticket/event shelf items
].join(', ');

// Load settings as early as possible
function loadSettings() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels', 'hideAllComments', 'filterComments'], (items) => {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        hideAllComments = items.hideAllComments || false;
        filterComments = items.filterComments || false;
        
        // Start observing for elements
        setupObserver();
        
        // Set up specialized observers for sidebar and shorts
        setupSidebarObserver();
        setupShortsObserver();
        
        // Apply filters to existing elements
        applyFilters();
        
        // Set up multiple filter passes to catch dynamically loaded content
        setTimeout(applyFilters, 100);
        setTimeout(applyFilters, 500);
        setTimeout(applyFilters, 1000);
        setTimeout(applyFilters, 2000);
    });
}

// Load settings immediately if possible
if (document.readyState !== 'loading') {
    loadSettings();
} else {
    document.addEventListener('DOMContentLoaded', loadSettings);
}

// Filter settings have changed, apply filters
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
        if (changes.filterKeywords) {
            filterKeywords = changes.filterKeywords.newValue || '';
        }
        if (changes.filterChannels) {
            filterChannels = changes.filterChannels.newValue || '';
        }
        if (changes.hideAllComments !== undefined) {
            hideAllComments = changes.hideAllComments.newValue;
        }
        if (changes.filterComments !== undefined) {
            filterComments = changes.filterComments.newValue;
        }
        
        // Reset filtering state
        filtersApplied = false;
        
        // Clear existing marks
        document.querySelectorAll('[data-filter-tube-allowed="true"], [data-filter-tube-filtered="true"]').forEach(el => {
            el.removeAttribute('data-filter-tube-allowed');
            el.removeAttribute('data-filter-tube-filtered');
        });
        
        // Apply filters immediately
        applyFilters();
        
        // And once more after a delay
        setTimeout(applyFilters, 300);
    }
});

// Extract channel info from YouTube's polymer component data
function extractChannelInfoFromPolymer(element) {
    try {
        // Find the closest video renderer element
        const videoElement = element.closest('ytd-compact-video-renderer, ytd-grid-video-renderer, ytd-video-renderer, ytd-rich-item-renderer');
        if (!videoElement) return null;

        // Try to access the polymer controller or instance
        const polymerData = videoElement.polymerController || videoElement.inst || videoElement;
        if (!polymerData || !polymerData.data) return null;

        // Extract channel information from the longBylineText
        const channelInfo = {
            id: null,
            handle: null,
            name: null
        };

        // Try to get the runs from longBylineText
        const runs = polymerData.data.longBylineText?.runs || 
                    polymerData.data.shortBylineText?.runs ||
                    polymerData.data.authorText?.runs ||
                    [];

        // Look through the runs to find navigation endpoints with channel info
        for (const run of runs) {
            if (run.navigationEndpoint?.browseEndpoint) {
                const browseEndpoint = run.navigationEndpoint.browseEndpoint;
                
                // Get channel ID (starts with UC)
                if (browseEndpoint.browseId && browseEndpoint.browseId.startsWith('UC')) {
                    channelInfo.id = browseEndpoint.browseId;
                }
                
                // Get channel handle or canonical URL
                if (browseEndpoint.canonicalBaseUrl) {
                    if (browseEndpoint.canonicalBaseUrl.startsWith('/@')) {
                        channelInfo.handle = browseEndpoint.canonicalBaseUrl;
                    } else if (browseEndpoint.canonicalBaseUrl.startsWith('/channel/')) {
                        channelInfo.id = browseEndpoint.canonicalBaseUrl.split('/channel/')[1];
                    }
                }
                
                // Get channel name
                if (run.text) {
                    channelInfo.name = run.text;
                }
            }
        }

        // Debug logging if we found something
        if (channelInfo.id || channelInfo.handle || channelInfo.name) {
            console.log('Found polymer channel info:', channelInfo);
            return channelInfo;
        }
    } catch (error) {
        // Silently fail if there are any errors accessing polymer data
        console.debug('Error extracting polymer data:', error);
    }

    return null;
}

// Get all potential channel identifiers from an element
function getChannelIdentifiers(element) {
    const identifiers = [];
    
    // Try to extract channel info from polymer data first (most reliable)
    const polymerInfo = extractChannelInfoFromPolymer(element);
    if (polymerInfo) {
        if (polymerInfo.id) {
            identifiers.push(polymerInfo.id.toLowerCase());
            identifiers.push('channel:' + polymerInfo.id.toLowerCase());
        }
        if (polymerInfo.handle) {
            identifiers.push(polymerInfo.handle.toLowerCase());
        }
        if (polymerInfo.name) {
            identifiers.push(polymerInfo.name.toLowerCase());
        }
    }
    
    // Try channel name from various selectors as fallback
    const channelNameSelectors = [
        '#channel-name', 
        '.ytd-channel-name', 
        '#text.ytd-channel-name', 
        '#byline', 
        '#owner-text', 
        'yt-formatted-string[id="text"]',
        '#channel-name yt-formatted-string',
        '.ytd-video-owner-renderer', // Video page owner
        '.ytd-video-meta-block' // Common in sidebar
    ];
    
    for (const selector of channelNameSelectors) {
        const channelElements = element.querySelectorAll(selector);
        channelElements.forEach(channelElement => {
            const channelName = channelElement.textContent.trim().toLowerCase();
            if (channelName) {
                identifiers.push(channelName);
            }
        });
    }
    
    // Look for @username format in any text element
    const usernameElements = element.querySelectorAll('yt-formatted-string, span, #subscribers');
    usernameElements.forEach(element => {
        const text = element.textContent.trim();
        if (text.startsWith('@')) {
            identifiers.push(text.toLowerCase());
        }
    });
    
    // Check for channel ID in URLs
    const links = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            if (href.includes('/channel/')) {
                // Extract channel ID
                const channelId = href.split('/channel/')[1].split('?')[0].split('/')[0];
                identifiers.push(channelId.toLowerCase());
                identifiers.push('channel:' + channelId.toLowerCase());
            } else if (href.includes('/@')) {
                // Extract username with @ symbol
                const username = href.split('/@')[1].split('?')[0].split('/')[0];
                identifiers.push('@' + username.toLowerCase());
            }
        }
    });
    
    // Return unique identifiers only
    return [...new Set(identifiers)];
}

// Helper function to check if a text contains an exact word match
function containsExactWord(text, word) {
    // Create a regex that matches the word with word boundaries
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
}

// Ultra-optimized filtering function
function applyFilters() {
    // Performance optimization - avoid unnecessary work
    if (document.hidden) {
        // Page is not visible, defer intensive processing
        return;
    }
    
    // Measure performance
    const startTime = performance.now();
    
    // Make sure styles are injected
    injectHidingStyles();
    
    // Handle comment section visibility based on settings
    if (hideAllComments) {
        document.documentElement.classList.add('filtertube-hide-all-comments');
        document.documentElement.classList.remove('filtertube-filter-comments');
        console.log("FilterTube: Hiding all comments");
    } else if (filterComments) {
        document.documentElement.classList.remove('filtertube-hide-all-comments');
        document.documentElement.classList.add('filtertube-filter-comments');
        console.log("FilterTube: Filtering comments");
        
        // Apply comment filtering - but only if we're on a video page
        if (location.href.includes('/watch')) {
            applyCommentFilters();
        }
    } else {
        // No comment filtering active
        document.documentElement.classList.remove('filtertube-hide-all-comments');
        document.documentElement.classList.remove('filtertube-filter-comments');
    }
    
    // Parse filter settings - do this once outside the element loop
    const keywords = filterKeywords.split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
    
    const channels = filterChannels.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);
    
    // If no filters, show everything and exit early
    if (keywords.length === 0 && channels.length === 0) {
        // Show all elements
        document.querySelectorAll(VIDEO_SELECTORS).forEach(element => {
            element.setAttribute('data-filter-tube-allowed', 'true');
            element.removeAttribute('data-filter-tube-filtered');
        });
        return;
    }
    
    // Performance optimization - process in smaller batches for smoother UX
    // Only select elements that haven't been processed yet
    const contentElements = document.querySelectorAll(VIDEO_SELECTORS + ':not([data-filter-tube-allowed="true"]):not([data-filter-tube-filtered="true"])');
    
    // Cache the length to avoid repeated property lookups
    const elementsCount = contentElements.length;
    
    // Exit if no new elements to process
    if (elementsCount === 0) {
        const endTime = performance.now();
        console.log(`FilterTube: No new elements to process (${(endTime - startTime).toFixed(2)}ms)`);
        return;
    }
    
    console.log(`FilterTube: Processing ${elementsCount} elements`);
    
    // For large batches, process in chunks to prevent UI freezing
    const BATCH_SIZE = 10; // Lower batch size to prevent UI lag
    
    // If we have a lot of elements, process in batches with delay between them
    if (elementsCount > BATCH_SIZE) {
        let processedCount = 0;
        
        const processNextBatch = () => {
            const endIndex = Math.min(processedCount + BATCH_SIZE, elementsCount);
            
            for (let i = processedCount; i < endIndex; i++) {
                processElement(contentElements[i], keywords, channels);
            }
            
            processedCount = endIndex;
            
            // If more elements to process, schedule next batch with a small delay
            if (processedCount < elementsCount) {
                setTimeout(processNextBatch, 1); // 1ms delay to allow UI updates
            } else {
                // All elements processed, fix shorts layout
                fixShortsLayout();
                // Update filters applied flag
                filtersApplied = true;
                
                const endTime = performance.now();
                console.log(`FilterTube: Completed processing ${elementsCount} elements in ${(endTime - startTime).toFixed(2)}ms`);
            }
        };
        
        // Start processing the first batch
        processNextBatch();
    } else {
        // Small number of elements, process all at once
        for (let i = 0; i < elementsCount; i++) {
            processElement(contentElements[i], keywords, channels);
        }
        
        // Special handling for shorts shelves after filtering
        fixShortsLayout();
        
        // Update filters applied flag
        filtersApplied = true;
        
        const endTime = performance.now();
        console.log(`FilterTube: Processed ${elementsCount} elements in ${(endTime - startTime).toFixed(2)}ms`);
    }
}

// Helper function to process a single element
function processElement(element, keywords, channels) {
    // Special handling for ytd-channel-renderer elements
    if (element.tagName === 'YTD-CHANNEL-RENDERER') {
        processChannelRenderer(element, channels);
        return;
    }
    
    // Special handling for shorts elements
    if (element.tagName === 'YTD-REEL-ITEM-RENDERER' || 
        element.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL' || 
        element.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL-V2') {
        processShortRenderer(element, keywords, channels);
        return;
    }

    // Special handling for ticket shelf elements
    if (element.tagName === 'YTD-TICKET-SHELF-RENDERER') {
        const elementText = element.textContent.toLowerCase();
        
        // Use exact word matching for ticket shelves
        const matchesKeyword = keywords.some(keyword => containsExactWord(elementText, keyword));
        
        if (matchesKeyword) {
            element.setAttribute('data-filter-tube-filtered', 'true');
            element.removeAttribute('data-filter-tube-allowed');
        } else {
            element.setAttribute('data-filter-tube-allowed', 'true');
            element.removeAttribute('data-filter-tube-filtered');
        }
        return;
    }
    
    // Check for sidebar video elements that would benefit from polymer data
    const isSidebarVideo = element.tagName === 'YTD-COMPACT-VIDEO-RENDERER';
    
    const elementText = element.textContent.toLowerCase();
    
    // Check if element contains any filtered keywords using exact word matching
    const matchesKeyword = keywords.some(keyword => containsExactWord(elementText, keyword));
    
    // Get all potential channel identifiers
    const channelIdentifiers = getChannelIdentifiers(element);
    
    // Debug logging for specific channel filtering
    if (isSidebarVideo && channels.length > 0 && channelIdentifiers.length > 0) {
        // Check if this is potentially a match for any channel
        const potentialMatches = channels.filter(channel => {
            const normalizedChannel = channel.toLowerCase();
            return channelIdentifiers.some(id => 
                id.toLowerCase().includes(normalizedChannel.replace(/^@/, '')) || 
                normalizedChannel.includes(id.toLowerCase().replace(/^@/, '')));
        });
        
        if (potentialMatches.length > 0) {
            console.log('Potential sidebar match:', {
                element: element.tagName,
                identifiers: channelIdentifiers,
                filters: potentialMatches
            });
        }
    }
    
    // Check if any channel identifier matches filtered channels with improved matching
    const matchesChannel = channels.length > 0 && channelIdentifiers.length > 0 &&
        channels.some(channel => {
            // Exact match check first
            if (channelIdentifiers.includes(channel)) {
                return true;
            }
            
            // Check for channel ID match (most reliable)
            if (channel.startsWith('channel:') && 
                channelIdentifiers.some(id => id === channel || id === channel.substring(8))) {
                return true;
            }
            
            // For UC ids without the channel: prefix
            if (channel.startsWith('UC') && 
                channelIdentifiers.some(id => id === channel || id === 'channel:' + channel)) {
                return true;
            }
            
            // Channel handle/username matching
            return channelIdentifiers.some(identifier => {
                // Normalize both strings for comparison by removing @ and converting to lowercase
                const normalizedIdentifier = identifier.startsWith('@') ? identifier.substring(1).toLowerCase() : identifier.toLowerCase();
                const normalizedChannel = channel.startsWith('@') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
                
                // Direct match after normalization
                if (normalizedIdentifier === normalizedChannel) {
                    return true;
                }
                
                // Looser matching for partial channel names
                if (normalizedIdentifier.includes(normalizedChannel) || normalizedChannel.includes(normalizedIdentifier)) {
                    return true;
                }
                
                // Original matching logic (keeping as fallback)
                // If channel filter contains @ but identifier doesn't
                if (channel.startsWith('@') && !identifier.startsWith('@')) {
                    return identifier.toLowerCase().includes(channel.substring(1).toLowerCase());
                }
                // If identifier contains @ but channel filter doesn't
                if (identifier.startsWith('@') && !channel.startsWith('@')) {
                    return identifier.substring(1).toLowerCase().includes(channel.toLowerCase());
                }
                
                return false;
            });
        });
    
    // Hide or show based on matches
    if (matchesKeyword || matchesChannel) {
        // Mark as filtered
        element.setAttribute('data-filter-tube-filtered', 'true');
        element.removeAttribute('data-filter-tube-allowed');
        
        // Also handle child elements for rich items and nested content
        if (element.tagName === 'YTD-RICH-ITEM-RENDERER') {
            const childVideo = element.querySelector('ytd-grid-video-renderer, ytd-video-renderer, ytd-compact-video-renderer');
            if (childVideo) {
                childVideo.setAttribute('data-filter-tube-filtered', 'true');
                childVideo.removeAttribute('data-filter-tube-allowed');
            }
        }
        
        // Special handling for playlist/sidebar items
        if (element.tagName === 'YT-LOCKUP-VIEW-MODEL') {
            const childElements = element.querySelectorAll('*');
            childElements.forEach(child => {
                if (child.nodeType === Node.ELEMENT_NODE) {
                    child.setAttribute('data-filter-tube-filtered', 'true');
                    child.removeAttribute('data-filter-tube-allowed');
                }
            });
        }
    } else {
        // Mark as allowed
        element.setAttribute('data-filter-tube-allowed', 'true');
        element.removeAttribute('data-filter-tube-filtered');
    }
}

// Special handler for channel renderer elements
function processChannelRenderer(element, channels) {
    // Extract channel info from the element
    const channelIdentifiers = [];
    
    // Get channel name
    const channelName = element.querySelector('#channel-title yt-formatted-string#text');
    if (channelName) {
        channelIdentifiers.push(channelName.textContent.trim().toLowerCase());
    }
    
    // Get @username
    const usernameElement = element.querySelector('#subscribers');
    if (usernameElement && usernameElement.textContent.trim().startsWith('@')) {
        channelIdentifiers.push(usernameElement.textContent.trim().toLowerCase());
    }
    
    // Get channel links
    const channelLinks = element.querySelectorAll('a.channel-link');
    channelLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            if (href.startsWith('/channel/')) {
                const channelId = href.split('/channel/')[1].split('?')[0].split('/')[0];
                channelIdentifiers.push(channelId.toLowerCase());
                channelIdentifiers.push('channel:' + channelId.toLowerCase());
            } else if (href.startsWith('/@')) {
                const username = href.split('/@')[1].split('?')[0].split('/')[0];
                channelIdentifiers.push('@' + username.toLowerCase());
            }
        }
    });
    
    // Debug logging
    if (channelIdentifiers.some(id => id.includes('travis'))) {
        console.log('Channel renderer identifiers:', [...new Set(channelIdentifiers)]);
    }
    
    // Check if this channel should be filtered
    const shouldFilter = channels.some(channel => {
        const normalizedChannel = channel.startsWith('@') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
        
        return channelIdentifiers.some(identifier => {
            const normalizedIdentifier = identifier.startsWith('@') ? identifier.substring(1).toLowerCase() : identifier.toLowerCase();
            
            return normalizedIdentifier === normalizedChannel || 
                   normalizedIdentifier.includes(normalizedChannel) || 
                   normalizedChannel.includes(normalizedIdentifier);
        });
    });
    
    if (shouldFilter) {
        element.setAttribute('data-filter-tube-filtered', 'true');
        element.removeAttribute('data-filter-tube-allowed');
    } else {
        element.setAttribute('data-filter-tube-allowed', 'true');
        element.removeAttribute('data-filter-tube-filtered');
    }
}

// Special handler for shorts elements
function processShortRenderer(element, keywords, channels) {
    const elementText = element.textContent.toLowerCase();
    
    // Check if element contains any filtered keywords using exact word matching
    const matchesKeyword = keywords.some(keyword => containsExactWord(elementText, keyword));
    
    // Get channel info using specialized extraction for shorts
    const channelIdentifiers = [];
    
    // Get channel name from various possible locations in shorts
    const channelElements = element.querySelectorAll('a[href*="/@"], a[href*="/channel/"], .channel-name, yt-formatted-string[id="text"]');
    
    channelElements.forEach(channelEl => {
        // Extract from the text content
        const text = channelEl.textContent.trim();
        if (text && text.length > 0) {
            channelIdentifiers.push(text.toLowerCase());
        }
        
        // Extract from href attributes
        const href = channelEl.getAttribute('href');
        if (href) {
            if (href.includes('/channel/')) {
                const channelId = href.split('/channel/')[1].split('?')[0].split('/')[0];
                channelIdentifiers.push(channelId.toLowerCase());
                channelIdentifiers.push('channel:' + channelId.toLowerCase());
            } else if (href.includes('/@')) {
                const username = href.split('/@')[1].split('?')[0].split('/')[0];
                channelIdentifiers.push('@' + username.toLowerCase());
            }
        }
    });
    
    // Debug logging for shorts by Travis Scott
    if (channelIdentifiers.some(id => id.includes('travis'))) {
        console.log('Shorts identifiers:', [...new Set(channelIdentifiers)]);
    }
    
    // Check if any channel identifier matches filtered channels
    const matchesChannel = channels.length > 0 && channelIdentifiers.length > 0 &&
        channels.some(channel => {
            const normalizedChannel = channel.startsWith('@') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
            
            return channelIdentifiers.some(identifier => {
                const normalizedIdentifier = identifier.startsWith('@') ? identifier.substring(1).toLowerCase() : identifier.toLowerCase();
                
                return normalizedIdentifier === normalizedChannel || 
                      normalizedIdentifier.includes(normalizedChannel) || 
                      normalizedChannel.includes(normalizedIdentifier);
            });
        });
    
    // Mark as filtered or allowed
    if (matchesKeyword || matchesChannel) {
        element.setAttribute('data-filter-tube-filtered', 'true');
        element.removeAttribute('data-filter-tube-allowed');
    } else {
        element.setAttribute('data-filter-tube-allowed', 'true');
        element.removeAttribute('data-filter-tube-filtered');
    }
}

// Fix shorts layout to ensure container doesn't collapse
function fixShortsLayout() {
    // Process shorts shelves
    const shelves = document.querySelectorAll('ytd-reel-shelf-renderer');
    shelves.forEach(shelf => {
        // Check if the shelf has any remaining visible items
        const visibleItems = shelf.querySelectorAll('ytm-shorts-lockup-view-model:not([data-filter-tube-filtered="true"]), ytm-shorts-lockup-view-model-v2:not([data-filter-tube-filtered="true"])');
        
        // If all items are filtered, hide the entire shelf
        if (visibleItems.length === 0) {
            shelf.setAttribute('data-filter-tube-filtered', 'true');
        } else {
            shelf.setAttribute('data-filter-tube-allowed', 'true');
            shelf.removeAttribute('data-filter-tube-filtered');
        }
        
        // Find the items container and update its transform to start from the first visible item
        const itemsContainer = shelf.querySelector('#items');
        if (itemsContainer) {
            // Reset any transform first
            itemsContainer.style.transform = 'translateX(0px)';
        }
        
        // Reset scroll position by clicking left arrow if available and needed
        if (visibleItems.length > 0 && visibleItems[0] !== shelf.querySelector('ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2')) {
            const leftArrow = shelf.querySelector('#left-arrow button');
            if (leftArrow) {
                // Simulate a click on the left arrow to reset position (only if not already at start)
                const isAtStart = shelf.querySelector('yt-horizontal-list-renderer[at-start]');
                if (!isAtStart) {
                    setTimeout(() => {
                        leftArrow.click();
                    }, 100);
                }
            }
        }
    });
}

// Set up the MutationObserver for real-time filtering
function setupObserver() {
    // Disconnect previous observer if exists
    if (observer) {
        observer.disconnect();
    }
    
    // Create the observer
    observer = new MutationObserver((mutations) => {
        let shouldFilter = false;
        
        // Check for added nodes that might be video elements
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldFilter = true;
                break;
            }
        }
        
        // Apply filters immediately if new content detected
        if (shouldFilter) {
            applyFilters();
        }
    });
    
    // Start observing the document
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // Watch for YouTube SPA navigation
    watchForNavigation();
}

// Set up a persistent sidebar observer for more reliable channel filtering
function setupSidebarObserver() {
    const sidebarRoot = document.getElementById("secondary");
    if (!sidebarRoot) return;
    
    // Process existing sidebar videos
    document.querySelectorAll("ytd-compact-video-renderer").forEach(card => {
        watchSidebarCard(card);
    });
    
    // Watch for new sidebar videos
    const sidebarObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && node.tagName === "YTD-COMPACT-VIDEO-RENDERER") {
                    watchSidebarCard(node);
                }
            }
        }
    });
    
    sidebarObserver.observe(sidebarRoot, {
        childList: true,
        subtree: true
    });
    
    console.log("FilterTube: Sidebar observer initialized");
}

// Watch a sidebar card with retry mechanism for reliable channel extraction
function watchSidebarCard(card) {
    if (processSidebarCard(card)) return;
    // If not ready yet, try again soon
    requestAnimationFrame(() => watchSidebarCard(card));
}

// Process a sidebar card once channel data is available
function processSidebarCard(card) {
    const channelIdentifiers = getChannelIdentifiers(card);
    if (channelIdentifiers.length === 0) return false; // Not ready
    
    // Process the card with existing logic
    const channels = filterChannels.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);
    
    const matchesChannel = channels.some(channel => {
        const normalizedChannel = channel.replace(/^@|^channel:/, "").toLowerCase();
        return channelIdentifiers.some(id => {
            const normalizedId = id.replace(/^@|^channel:/, "").toLowerCase();
            return normalizedId === normalizedChannel || 
                   normalizedId.includes(normalizedChannel) || 
                   normalizedChannel.includes(normalizedId);
        });
    });
    
    if (matchesChannel) {
        card.setAttribute('data-filter-tube-filtered', 'true');
        card.removeAttribute('data-filter-tube-allowed');
    } else {
        card.setAttribute('data-filter-tube-allowed', 'true');
        card.removeAttribute('data-filter-tube-filtered');
    }
    
    return true; // Successfully processed
}

// Enhanced shorts filtering for more reliable channel detection
function setupShortsObserver() {
    // First handle existing shorts
    document.querySelectorAll('ytd-reel-item-renderer, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2').forEach(shortElement => {
        watchShortElement(shortElement);
    });
    
    // Watch for new shorts elements
    const shortsObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                
                if (node.tagName === 'YTD-REEL-ITEM-RENDERER' || 
                    node.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL' || 
                    node.tagName === 'YTM-SHORTS-LOCKUP-VIEW-MODEL-V2') {
                    watchShortElement(node);
                }
            });
        }
    });
    
    shortsObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    console.log("FilterTube: Shorts observer initialized");
}

// Watch a short element with retry for reliable channel data extraction
function watchShortElement(shortElement) {
    if (processShortElement(shortElement)) return;
    // Not ready yet, try again in next frame
    requestAnimationFrame(() => watchShortElement(shortElement));
}

// Enhanced short element processing with multiple channel extraction methods
function processShortElement(shortElement) {
    // Try multiple methods to extract channel information
    const channelIdentifiers = [];
    
    // First try standard extraction using our existing function
    const standardIds = getChannelIdentifiers(shortElement);
    channelIdentifiers.push(...standardIds);
    
    // Additional extraction methods specifically for shorts
    
    // 1. Try to extract from any text elements that might contain @username
    const textElements = shortElement.querySelectorAll('span, div, yt-formatted-string');
    textElements.forEach(el => {
        const text = el.textContent.trim();
        if (text.startsWith('@')) {
            channelIdentifiers.push(text.toLowerCase());
        }
    });
    
    // 2. Try to extract from Polymer data if available
    try {
        const polymerData = shortElement.data || 
                           (shortElement.querySelector('ytd-rich-grid-media') || {}).data ||
                           shortElement.polymerController?.data;
        
        if (polymerData) {
            // Try different paths in the polymer data structure
            const paths = [
                'shortBylineText.runs',
                'ownerText.runs',
                'publishedTimeText.runs',
                'videoOwnerRenderer.navigationEndpoint.browseEndpoint'
            ];
            
            for (const path of paths) {
                const parts = path.split('.');
                let current = polymerData;
                let found = true;
                
                for (const part of parts) {
                    if (current && current[part]) {
                        current = current[part];
                    } else {
                        found = false;
                        break;
                    }
                }
                
                if (found && Array.isArray(current)) {
                    // Found runs array, extract channel info
                    for (const run of current) {
                        if (run.navigationEndpoint?.browseEndpoint?.browseId) {
                            const browseId = run.navigationEndpoint.browseEndpoint.browseId;
                            if (browseId.startsWith('UC')) {
                                channelIdentifiers.push(browseId.toLowerCase());
                                channelIdentifiers.push('channel:' + browseId.toLowerCase());
                            }
                        }
                        
                        if (run.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl) {
                            const url = run.navigationEndpoint.browseEndpoint.canonicalBaseUrl;
                            if (url.startsWith('/@')) {
                                channelIdentifiers.push(url.toLowerCase());
                            }
                        }
                        
                        if (run.text && run.text.startsWith('@')) {
                            channelIdentifiers.push(run.text.toLowerCase());
                        }
                    }
                }
            }
        }
    } catch (e) {
        // Silent fail for polymer data extraction
    }
    
    // If we couldn't extract any channel info, not ready yet
    if (channelIdentifiers.length === 0) return false;
    
    // Now filter based on the extracted channel identifiers
    const channels = filterChannels.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);
    
    const matchesChannel = channels.some(channel => {
        const normalizedChannel = channel.replace(/^@|^channel:/, "").toLowerCase();
        return channelIdentifiers.some(id => {
            const normalizedId = id.replace(/^@|^channel:/, "").toLowerCase();
            return normalizedId === normalizedChannel || 
                   normalizedId.includes(normalizedChannel) || 
                   normalizedChannel.includes(normalizedId);
        });
    });
    
    if (matchesChannel) {
        shortElement.setAttribute('data-filter-tube-filtered', 'true');
        shortElement.removeAttribute('data-filter-tube-allowed');
    } else {
        shortElement.setAttribute('data-filter-tube-allowed', 'true');
        shortElement.removeAttribute('data-filter-tube-filtered');
    }
    
    return true; // Successfully processed
}

// Handle YouTube's single-page application navigation
function watchForNavigation() {
    let lastUrl = location.href;
    let isVideoPage = location.href.includes('/watch');
    
    // Set up interval to check URL changes
    const urlCheckInterval = setInterval(() => {
        const currentUrl = location.href;
        const currentIsVideoPage = currentUrl.includes('/watch');
        
        if (lastUrl !== currentUrl) {
            lastUrl = currentUrl;
            console.log("FilterTube: URL changed, reapplying filters");
            
            // Reset filtering state
            filtersApplied = false;
            
            // Apply filters multiple times as content loads
            applyFilters();
            setTimeout(applyFilters, 200);
            setTimeout(applyFilters, 500);
            setTimeout(applyFilters, 1000);
            setTimeout(applyFilters, 2000);
            
            // If we've navigated to a video page, handle comments
            if (currentIsVideoPage) {
                isVideoPage = true;
                
                // Multiple attempts to catch the comment section as it loads
                setTimeout(() => {
                    if (hideAllComments || filterComments) {
                        console.log("FilterTube: Checking for comments (1st attempt)");
                        const commentSection = document.querySelector('#comments, ytd-comments');
                        if (commentSection) {
                            if (hideAllComments) {
                                document.documentElement.classList.add('filtertube-hide-all-comments');
                            } else if (filterComments) {
                                applyCommentFilters();
                            }
                        }
                    }
                }, 1000);
                
                setTimeout(() => {
                    if (hideAllComments || filterComments) {
                        console.log("FilterTube: Checking for comments (2nd attempt)");
                        const commentSection = document.querySelector('#comments, ytd-comments');
                        if (commentSection) {
                            if (hideAllComments) {
                                document.documentElement.classList.add('filtertube-hide-all-comments');
                            } else if (filterComments) {
                                applyCommentFilters();
                            }
                        }
                    }
                }, 3000);
                
                setTimeout(() => {
                    if (hideAllComments || filterComments) {
                        console.log("FilterTube: Checking for comments (final attempt)");
                        const commentSection = document.querySelector('#comments, ytd-comments');
                        if (commentSection) {
                            if (hideAllComments) {
                                document.documentElement.classList.add('filtertube-hide-all-comments');
                            } else if (filterComments) {
                                applyCommentFilters();
                            }
                        }
                    }
                }, 5000);
            } else {
                isVideoPage = false;
            }
        }
    }, 100);
    
    // Store interval ID for cleanup
    window._filterTubeUrlInterval = urlCheckInterval;
}

// Clean up on unload
window.addEventListener('unload', () => {
    if (observer) {
        observer.disconnect();
    }
    
    if (window._filterTubeUrlInterval) {
        clearInterval(window._filterTubeUrlInterval);
    }
    
    // Remove style element
    const style = document.getElementById('filter-tube-styles');
    if (style) {
        style.remove();
    }
});

// Apply filters to comments
function applyCommentFilters() {
    // Constants for comment selectors
    const COMMENT_SELECTORS = 'ytd-comment-thread-renderer, ytd-comment-renderer';
    
    // Parse filter settings once
    const keywords = filterKeywords.split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
    
    const channels = filterChannels.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);
    
    // If we're on a video page, ensure comment section is reached
    const commentsSection = document.querySelector('#comments, ytd-comments');
    if (commentsSection) {
        console.log("FilterTube: Found comments section, applying filters");
    } else {
        // If not found, check again in a moment
        console.log("FilterTube: Comments section not found, will retry");
        setTimeout(applyCommentFilters, 1000);
        return;
    }
    
    // Get unprocessed comments
    const comments = document.querySelectorAll(COMMENT_SELECTORS + ':not([data-filter-tube-allowed="true"]):not([data-filter-tube-filtered="true"])');
    
    console.log(`FilterTube: Processing ${comments.length} comments`);
    
    // Process in batches to prevent UI freezing
    const BATCH_SIZE = 40; // Comments are smaller, so we can process more at once
    
    // If we have a lot of comments, process in batches
    if (comments.length > BATCH_SIZE) {
        const processNextBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + BATCH_SIZE, comments.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                processComment(comments[i], keywords, channels);
            }
            
            // If more comments to process, schedule next batch
            if (endIndex < comments.length) {
                setTimeout(() => {
                    processNextBatch(endIndex);
                }, 0);
            }
        };
        
        // Start processing the first batch
        processNextBatch(0);
    } else if (comments.length > 0) {
        // Small number of comments, process all at once
        comments.forEach(comment => {
            processComment(comment, keywords, channels);
        });
    } else {
        // No comments to process, check again in a moment 
        // (YouTube often loads comments dynamically)
        if (location.href.includes('/watch')) {
            setTimeout(applyCommentFilters, 1000);
        }
    }
    
    // Set up observer for comment section to catch dynamically loaded comments
    setupCommentObserver();
}

// Set up a dedicated observer for comments
function setupCommentObserver() {
    // Try to find the comments section
    const commentsSection = document.querySelector('#comments, ytd-comments');
    if (!commentsSection) return;
    
    // Create a separate observer for comments
    const commentObserver = new MutationObserver((mutations) => {
        let shouldFilter = false;
        
        // Check for added nodes that might be comments
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldFilter = true;
                break;
            }
        }
        
        // Apply comment filters if new content detected
        if (shouldFilter && filterComments && !hideAllComments) {
            setTimeout(applyCommentFilters, 100);
        }
    });
    
    // Start observing the comments section
    commentObserver.observe(commentsSection, {
        childList: true,
        subtree: true
    });
}

// Process an individual comment
function processComment(comment, keywords, channels) {
    // Extract comment text
    const commentText = comment.textContent.toLowerCase();
    
    // Get channel info from the comment - try multiple selectors for robustness
    const channelSelectors = [
        '#author-text',                 // Main channel text
        '#header-author #author-text',  // Header author
        '.ytd-comment-renderer #author-text', // Comment renderer author
        '#author-name',                 // Author name
        'a[href*="/@"]',                // @ handle links
        'a[href*="/channel/"]'          // Channel ID links
    ];
    
    const channelIdentifiers = [];
    
    // Try each selector to find a channel name
    channelSelectors.forEach(selector => {
        const elements = comment.querySelectorAll(selector);
        elements.forEach(element => {
            // Extract from text content
            if (element.textContent && element.textContent.trim()) {
                channelIdentifiers.push(element.textContent.trim().toLowerCase());
            }
            
            // Extract from href attribute if available
            const href = element.getAttribute('href');
            if (href) {
                if (href.includes('/channel/')) {
                    const channelId = href.split('/channel/')[1].split('?')[0].split('/')[0];
                    channelIdentifiers.push(channelId.toLowerCase());
                    channelIdentifiers.push('channel:' + channelId.toLowerCase());
                } else if (href.includes('/@')) {
                    const username = href.split('/@')[1].split('?')[0].split('/')[0];
                    channelIdentifiers.push('@' + username.toLowerCase());
                }
            }
        });
    });
    
    // Debug logging for specific channels
    if (channelIdentifiers.some(id => id.includes('travis'))) {
        console.log('Comment channel identifiers:', [...new Set(channelIdentifiers)]);
    }
    
    // Check if comment contains filtered keywords using exact word matching
    const matchesKeyword = keywords.some(keyword => containsExactWord(commentText, keyword));
    
    // Check if comment is from a filtered channel
    const matchesChannel = channels.length > 0 && channelIdentifiers.length > 0 &&
        channels.some(channel => {
            const normalizedChannel = channel.startsWith('@') ? channel.substring(1).toLowerCase() : channel.toLowerCase();
            
            return channelIdentifiers.some(identifier => {
                const normalizedIdentifier = identifier.startsWith('@') ? identifier.substring(1).toLowerCase() : identifier.toLowerCase();
                
                return normalizedIdentifier === normalizedChannel || 
                      normalizedIdentifier.includes(normalizedChannel) || 
                      normalizedChannel.includes(normalizedIdentifier);
            });
        });
    
    // Hide or show comment based on filters
    if (matchesKeyword || matchesChannel) {
        comment.setAttribute('data-filter-tube-filtered', 'true');
        comment.removeAttribute('data-filter-tube-allowed');
        
        // If this is a comment thread renderer, also mark its replies
        if (comment.tagName === 'YTD-COMMENT-THREAD-RENDERER') {
            const replies = comment.querySelectorAll('ytd-comment-renderer');
            replies.forEach(reply => {
                reply.setAttribute('data-filter-tube-filtered', 'true');
                reply.removeAttribute('data-filter-tube-allowed');
            });
        }
    } else {
        comment.setAttribute('data-filter-tube-allowed', 'true');
        comment.removeAttribute('data-filter-tube-filtered');
    }
}

console.log("FilterTube Content Script Loaded - Zero Flash Version v1.4.4");





