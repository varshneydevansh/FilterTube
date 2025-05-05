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
        ytd-secondary-search-container-renderer,
        ytm-shorts-lockup-view-model,
        ytm-shorts-lockup-view-model-v2,
        ytd-channel-renderer {
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
        .filtertube-hide-all-comments #sections ytd-item-section-renderer#sections {
            display: none !important;
        }
        
        .filtertube-hide-all-comments #comments {
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
    'ytd-channel-renderer'           // Channel results in search
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

// Get all potential channel identifiers from an element
function getChannelIdentifiers(element) {
    const identifiers = [];
    
    // Try channel name from various selectors
    const channelNameSelectors = [
        '#channel-name', 
        '.ytd-channel-name', 
        '#text.ytd-channel-name', 
        '#byline', 
        '#owner-text', 
        'yt-formatted-string[id="text"]',
        '#channel-name yt-formatted-string'
    ];
    
    for (const selector of channelNameSelectors) {
        const channelElement = element.querySelector(selector);
        if (channelElement) {
            const channelName = channelElement.textContent.trim().toLowerCase();
            if (channelName) {
                identifiers.push(channelName);
            }
        }
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
                // Also store a version with "channel:" prefix for exact matching
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

// Ultra-optimized filtering function
function applyFilters() {
    // Performance optimization - avoid unnecessary work
    if (document.hidden) {
        // Page is not visible, defer intensive processing
        return;
    }
    
    // Make sure styles are injected
    injectHidingStyles();
    
    // Handle comment section visibility based on settings
    if (hideAllComments) {
        document.documentElement.classList.add('filtertube-hide-all-comments');
    } else {
        document.documentElement.classList.remove('filtertube-hide-all-comments');
    }
    
    // Apply comment filtering if enabled
    if (filterComments && !hideAllComments) {
        applyCommentFilters();
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
    const contentElements = document.querySelectorAll(VIDEO_SELECTORS + ':not([data-filter-tube-allowed="true"]):not([data-filter-tube-filtered="true"])');
    
    // Exit if no new elements to process
    if (contentElements.length === 0) {
        return;
    }
    
    // For large batches, process in chunks to prevent UI freezing
    const BATCH_SIZE = 20; // Process 20 elements at a time
    
    // If we have a lot of elements, process in batches
    if (contentElements.length > BATCH_SIZE) {
        const processNextBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + BATCH_SIZE, contentElements.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                processElement(contentElements[i], keywords, channels);
            }
            
            // If more elements to process, schedule next batch
            if (endIndex < contentElements.length) {
                setTimeout(() => {
                    processNextBatch(endIndex);
                }, 0);
            } else {
                // All elements processed, fix shorts layout
                fixShortsLayout();
                // Update filters applied flag
                filtersApplied = true;
            }
        };
        
        // Start processing the first batch
        processNextBatch(0);
    } else {
        // Small number of elements, process all at once
        contentElements.forEach(element => {
            processElement(element, keywords, channels);
        });
        
        // Special handling for shorts shelves after filtering
        fixShortsLayout();
        
        // Update filters applied flag
        filtersApplied = true;
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
    
    const elementText = element.textContent.toLowerCase();
    
    // Check if element contains any filtered keywords
    const matchesKeyword = keywords.some(keyword => elementText.includes(keyword));
    
    // Get all potential channel identifiers
    const channelIdentifiers = getChannelIdentifiers(element);
    
    // Check if any channel identifier matches filtered channels with improved matching
    const matchesChannel = channels.length > 0 && channelIdentifiers.length > 0 &&
        channels.some(channel => {
            // Exact match check first
            if (channelIdentifiers.includes(channel)) {
                return true;
            }
            
            // Check for channel ID match
            if (channel.startsWith('channel:') && 
                channelIdentifiers.some(id => id === channel || id === channel.substring(8))) {
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
    
    // Check if element contains any filtered keywords
    const matchesKeyword = keywords.some(keyword => elementText.includes(keyword));
    
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

// Handle YouTube's single-page application navigation
function watchForNavigation() {
    let lastUrl = location.href;
    
    // Set up interval to check URL changes
    const urlCheckInterval = setInterval(() => {
        if (lastUrl !== location.href) {
            lastUrl = location.href;
            console.log("FilterTube: URL changed, reapplying filters");
            
            // Reset filtering state
            filtersApplied = false;
            
            // Apply filters multiple times as content loads
            applyFilters();
            setTimeout(applyFilters, 200);
            setTimeout(applyFilters, 500);
            setTimeout(applyFilters, 1000);
            setTimeout(applyFilters, 2000);
            
            // Additional check for comment section appearing later
            setTimeout(() => {
                // Apply comment filtering if on a video page and filtering is enabled
                if (location.href.includes('/watch') && (filterComments || hideAllComments)) {
                    applyCommentFilters();
                }
            }, 3000);
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
    
    // Get unprocessed comments
    const comments = document.querySelectorAll(COMMENT_SELECTORS + ':not([data-filter-tube-allowed="true"]):not([data-filter-tube-filtered="true"])');
    
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
    } else {
        // Small number of comments, process all at once
        comments.forEach(comment => {
            processComment(comment, keywords, channels);
        });
    }
}

// Process an individual comment
function processComment(comment, keywords, channels) {
    // Extract comment text
    const commentText = comment.textContent.toLowerCase();
    
    // Get channel info from the comment
    const channelName = comment.querySelector('#author-text');
    const channelLinks = comment.querySelectorAll('a[href*="/@"], a[href*="/channel/"]');
    
    const channelIdentifiers = [];
    
    // Extract channel name
    if (channelName) {
        channelIdentifiers.push(channelName.textContent.trim().toLowerCase());
    }
    
    // Extract channel links
    channelLinks.forEach(link => {
        const href = link.getAttribute('href');
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
    
    // Check if comment contains filtered keywords
    const matchesKeyword = keywords.some(keyword => commentText.includes(keyword));
    
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
    } else {
        comment.setAttribute('data-filter-tube-allowed', 'true');
        comment.removeAttribute('data-filter-tube-filtered');
    }
}

console.log("FilterTube Content Script Loaded - Zero Flash Version v1.4.0");





