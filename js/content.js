/**
 * FilterTube Content Script - Zero Flash Version
 * Uses CSS and early filtering to hide elements immediately
 */

// Global variables for filter settings
let filterKeywords = '';
let filterChannels = '';
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
        ytm-shorts-lockup-view-model-v2 {
            opacity: 0 !important;
            transition: opacity 0.1s ease-in-out !important;
        }
        
        /* Show elements marked as allowed */
        [data-filter-tube-allowed="true"] {
            opacity: 1 !important;
        }
        
        /* Hide filtered elements */
        [data-filter-tube-filtered="true"] {
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
    'ytm-shorts-lockup-view-model-v2' // Shorts items v2 format
].join(', ');

// Load settings as early as possible
function loadSettings() {
    chrome.storage.local.get(['filterKeywords', 'filterChannels'], (items) => {
        filterKeywords = items.filterKeywords || '';
        filterChannels = items.filterChannels || '';
        
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
        'yt-formatted-string[id="text"]'
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
    const usernameElements = element.querySelectorAll('yt-formatted-string, span');
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
            } else if (href.includes('/@')) {
                // Extract username with @ symbol
                const username = href.split('/@')[1].split('?')[0].split('/')[0];
                identifiers.push('@' + username.toLowerCase());
            }
        }
    });
    
    return identifiers;
}

// Ultra-optimized filtering function
function applyFilters() {
    // Make sure styles are injected
    injectHidingStyles();
    
    // Parse filter settings
    const keywords = filterKeywords.split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
    
    const channels = filterChannels.split(',')
        .map(c => c.trim().toLowerCase())
        .filter(c => c.length > 0);
    
    // If no filters, show everything
    if (keywords.length === 0 && channels.length === 0) {
        // Show all elements
        document.querySelectorAll(VIDEO_SELECTORS).forEach(element => {
            element.setAttribute('data-filter-tube-allowed', 'true');
            element.removeAttribute('data-filter-tube-filtered');
        });
        return;
    }
    
    // Get all unprocessed elements
    const contentElements = document.querySelectorAll(VIDEO_SELECTORS + ':not([data-filter-tube-allowed="true"]):not([data-filter-tube-filtered="true"])');
    
    // Process each element
    contentElements.forEach(element => {
        const elementText = element.textContent.toLowerCase();
        
        // Check if element contains any filtered keywords
        const matchesKeyword = keywords.some(keyword => elementText.includes(keyword));
        
        // Get all potential channel identifiers
        const channelIdentifiers = getChannelIdentifiers(element);
        
        // Check if any channel identifier matches filtered channels
        const matchesChannel = channels.length > 0 && channelIdentifiers.length > 0 &&
            channels.some(channel => {
                // Direct match or partial match depending on format
                return channelIdentifiers.some(identifier => {
                    // If channel filter contains @ but identifier doesn't, check for inclusion without @
                    if (channel.startsWith('@') && !identifier.startsWith('@')) {
                        return identifier.includes(channel.substring(1));
                    }
                    // If identifier contains @ but channel filter doesn't, check for inclusion without @
                    if (identifier.startsWith('@') && !channel.startsWith('@')) {
                        return identifier.substring(1).includes(channel);
                    }
                    // Otherwise check for direct inclusion
                    return identifier.includes(channel);
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
    });
    
    // Special handling for shorts shelves after filtering
    fixShortsLayout();
    
    // Update filters applied flag
    filtersApplied = true;
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

console.log("FilterTube Content Script Loaded - Zero Flash Version v1.3.5");





