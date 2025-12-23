/**
 * Track the last clicked 3-dot button to find associated video card
 */
let lastClickedMenuButton = null;

/**
 * Track which dropdowns we've already injected into (prevent flashing)
 * Map: dropdown -> {videoCardId, isProcessing}
 */
const injectedDropdowns = new WeakMap();

// Menu helpers (`escapeHtml`, `ensureFilterTubeMenuStyles`) are defined in
// `js/content/menu.js` (loaded before this file via manifest ordering).

/**
 * Synchronous lock to prevent race conditions when multiple mutation events fire
 * Set: dropdown elements currently being processed
 */
const processingDropdowns = new WeakSet();

/**
 * Track pending async channel fetches for shorts (prevents duplicates)
 * Map: videoId -> Promise
 */
const pendingShortsFetches = new Map();

/**
 * Track pending async channel fetches from /watch?v=ID pages (prevents duplicates)
 * Map: videoId -> Promise
 */
const pendingWatchFetches = new Map();

/**
 * Track pending channel info fetches per dropdown (for instant UI + background fetch)
 * WeakMap: dropdown -> {channelInfoPromise, cancelled, initialChannelInfo}
 */
const pendingDropdownFetches = new WeakMap();

/**
 * Observe dropdowns and inject FilterTube menu items
 */
function setupMenuObserver() {
    // Track clicks on 3-dot buttons (comprehensive selectors for all YouTube contexts)
    document.addEventListener('click', (e) => {
        const menuButton = e.target.closest(
            'button[aria-label*="More"], ' +
            'button[aria-label*="Action"], ' +
            'button[aria-label*="menu"], ' +
            'yt-icon-button.dropdown-trigger, ' +
            'yt-icon-button#button.dropdown-trigger, ' +
            '.shortsLockupViewModelHostOutsideMetadataMenu button, ' +
            'ytd-menu-renderer button, ' +
            '#menu button[aria-label], ' +
            'ytd-reel-item-renderer button[aria-label*="More"], ' +
            'ytd-reel-video-renderer button[aria-label*="More"], ' +
            'ytm-menu-renderer button'
        );
        if (menuButton) {
            lastClickedMenuButton = menuButton;
            console.log('FilterTube: 3-dot button clicked, button:', menuButton.getAttribute('aria-label'));

            // Also try to find and inject immediately into existing dropdown
            setTimeout(() => {
                tryInjectIntoVisibleDropdown();
            }, 150);
        }
    }, true);

    // Wait for document.body to be ready
    const startObserver = () => {
        if (!document.body) {
            setTimeout(startObserver, 100);
            return;
        }

        // Observe dropdown menus appearing (childList for new nodes)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                // Check for new nodes
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    const dropdown = node.matches?.('tp-yt-iron-dropdown') ? node : node.querySelector?.('tp-yt-iron-dropdown');

                    if (dropdown) {
                        const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

                        if (isVisible) {
                            console.log('FilterTube: Dropdown added to DOM');
                            // Call async function without awaiting (fire and forget)
                            handleDropdownAppeared(dropdown).catch(err => {
                                console.error('FilterTube: Error in handleDropdownAppeared:', err);
                            });
                        }
                    }
                }

                // Check for attribute changes (dropdown becoming visible)
                if (mutation.type === 'attributes' && mutation.target.matches?.('tp-yt-iron-dropdown')) {
                    const dropdown = mutation.target;
                    const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

                    if (isVisible) {
                        console.log('FilterTube: Dropdown became visible (attribute change)');
                        // Call async function without awaiting (fire and forget)
                        handleDropdownAppeared(dropdown).catch(err => {
                            console.error('FilterTube: Error in handleDropdownAppeared:', err);
                        });
                    } else {
                        // Dropdown hidden - clear cached state so next open re-injects fresh
                        if (injectedDropdowns.has(dropdown)) {
                            console.log('FilterTube: Dropdown hidden, clearing cached state');
                            injectedDropdowns.delete(dropdown);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'aria-hidden']
        });

        console.log('FilterTube: Menu observer started');
    };

    startObserver();
}

/**
 * Try to inject into currently visible dropdown
 */
function tryInjectIntoVisibleDropdown() {
    const visibleDropdowns = document.querySelectorAll('tp-yt-iron-dropdown');

    for (const dropdown of visibleDropdowns) {
        const isVisible = dropdown.style.display !== 'none' && dropdown.getAttribute('aria-hidden') !== 'true';

        if (isVisible) {
            console.log('FilterTube: Found visible dropdown');
            // Call async function without awaiting (fire and forget)
            handleDropdownAppeared(dropdown).catch(err => {
                console.error('FilterTube: Error in handleDropdownAppeared:', err);
            });
            break; // Only inject into first visible one
        }
    }
}

/**
 * Handle when a dropdown appears (either added or made visible)
 */
async function handleDropdownAppeared(dropdown) {
    // Synchronous lock to prevent race conditions from multiple mutation events
    if (processingDropdowns.has(dropdown)) {
        console.debug('FilterTube: Dropdown already being processed (sync lock), skipping');
        return;
    }
    processingDropdowns.add(dropdown);

    try {
        await handleDropdownAppearedInternal(dropdown);
    } finally {
        // Release lock after processing completes
        processingDropdowns.delete(dropdown);
    }
}

/**
 * Internal handler for dropdown appearance (called after sync lock acquired)
 */
async function handleDropdownAppearedInternal(dropdown) {
    if (!lastClickedMenuButton) {
        console.log('FilterTube: No button reference, skipping injection');
        return;
    }

    console.log('FilterTube: Dropdown appeared, finding video card...');

    // Prefer comment-thread context first (YouTube comments 3-dot menu).
    // This lets us reuse the same injection/block pipeline while hiding the whole thread.
    const commentThread = lastClickedMenuButton.closest(
        'ytd-comment-thread-renderer, ' +
        'ytm-comment-thread-renderer'
    );

    // Find the associated video/short card from the button (comprehensive selectors)
    const videoCard = commentThread || lastClickedMenuButton.closest(
        'ytd-rich-item-renderer, ' +
        'ytd-video-renderer, ' +
        'ytd-grid-video-renderer, ' +
        'ytd-compact-video-renderer, ' +
        'ytd-reel-item-renderer, ' +
        'ytd-reel-video-renderer, ' +
        'reel-item-endpoint, ' +
        'ytd-compact-promoted-video-renderer, ' +
        'ytm-compact-video-renderer, ' +
        'ytm-video-with-context-renderer, ' +
        'ytd-post-renderer, ' +                          // YouTube Posts
        'ytd-playlist-panel-video-renderer, ' +         // Playlist videos
        'ytd-playlist-video-renderer, ' +               // Playlist videos (alternate)
        'ytm-shorts-lockup-view-model, ' +              // Shorts in mobile/search
        'ytm-shorts-lockup-view-model-v2, ' +           // Shorts variant
        'ytm-item-section-renderer, ' +                 // Container for shorts
        'yt-lockup-view-model, ' +                      // Modern video lockup (collabs)
        'ytd-rich-shelf-renderer'                       // Shelf containing shorts
    );

    if (videoCard) {
        console.log('FilterTube: Found video card:', videoCard.tagName);

        // Get unique ID for this video card
        let videoCardId = videoCard.getAttribute('data-filtertube-unique-id');
        if (!videoCardId) {
            // Try to extract video ID from links
            const videoLink = videoCard.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
            const videoIdMatch = videoLink?.href.match(/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]{11})/);

            if (videoIdMatch) {
                videoCardId = videoIdMatch[1];
            } else {
                // Fallback: generate random ID
                videoCardId = `card-${Math.random().toString(36).substr(2, 9)}`;
            }
            videoCard.setAttribute('data-filtertube-unique-id', videoCardId);
        }

        // CRITICAL: Check if this dropdown is already being processed for this video
        const dropdownState = injectedDropdowns.get(dropdown);

        if (dropdownState?.videoCardId === videoCardId) {
            if (dropdownState.isProcessing) {
                console.debug('FilterTube: Dropdown already processing for this video, skipping');
                return;
            }
            if (dropdownState.isComplete) {
                // Verify menu item still exists in DOM before skipping
                const existingMenuItem = dropdown.querySelector('.filtertube-block-channel-item');
                if (existingMenuItem) {
                    // Check if the menu item has stale state (e.g., "✓ Channel Blocked" or "✓ Blocked")
                    const titleSpan = existingMenuItem.querySelector('.filtertube-menu-title');
                    const isStaleState = titleSpan?.textContent?.includes('✓') || titleSpan?.textContent?.includes('Blocking');

                    if (isStaleState) {
                        console.log('FilterTube: Menu item has stale state, re-injecting fresh');
                        injectedDropdowns.delete(dropdown);
                        // Continue to re-inject
                    } else {
                        console.log('FilterTube: Dropdown already injected for this video, skipping');
                        return;
                    }
                } else {
                    console.log('FilterTube: State says complete but menu item missing, re-injecting');
                    // Reset state and continue to re-inject
                    injectedDropdowns.delete(dropdown);
                }
            }
        }

        if (dropdownState && dropdownState.videoCardId !== videoCardId) {
            console.log('FilterTube: Dropdown reused for different video - will clean and reinject');
            // Old items will be removed by injectFilterTubeMenuItem automatically
        }

        // Mark as being processed IMMEDIATELY (prevents duplicate calls)
        injectedDropdowns.set(dropdown, { videoCardId, isProcessing: true, isComplete: false });

        // Watch for card removal (video hidden) and close dropdown
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === videoCard || node.contains(videoCard)) {
                        console.log('FilterTube: Video card removed, closing dropdown');
                        dropdown.style.display = 'none';
                        dropdown.setAttribute('aria-hidden', 'true');
                        observer.disconnect();
                    }
                }
            }
        });

        if (videoCard.parentElement) {
            observer.observe(videoCard.parentElement, { childList: true });
        }

        // Watch for dropdown closing (to cancel pending fetches if user doesn't block)
        const dropdownObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'aria-hidden') {
                    const isHidden = dropdown.getAttribute('aria-hidden') === 'true';
                    if (isHidden) {
                        // Dropdown closed - mark any pending fetch as cancelled
                        const fetchData = pendingDropdownFetches.get(dropdown);
                        if (fetchData) {
                            fetchData.cancelled = true;
                            console.log('FilterTube: Dropdown closed, marked fetch as cancelled');
                        }
                        dropdownObserver.disconnect();
                    }
                }
            }
        });
        dropdownObserver.observe(dropdown, { attributes: true, attributeFilter: ['aria-hidden'] });

        // Determine if this is a shorts card
        const isShorts = videoCard.tagName.toLowerCase().includes('shorts') ||
            videoCard.tagName.toLowerCase().includes('reel');

        try {
            // For shorts, we might need to wait for async channel fetch
            // Do the injection WITHOUT setTimeout to avoid race conditions
            await injectFilterTubeMenuItem(dropdown, videoCard);

            // Mark as complete
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: true });
        } catch (error) {
            console.error('FilterTube: Error injecting menu item:', error);
            // Reset state on error so it can be retried
            injectedDropdowns.set(dropdown, { videoCardId, isProcessing: false, isComplete: false });
        }
    } else {
        console.log('FilterTube: Could not find video card from button');

        // CRITICAL: Clean up any stale FilterTube items from dropdown
        // (prevents old "✓ Channel Blocked" showing when we can't identify the video)
        const oldItems = dropdown.querySelectorAll('.filtertube-block-channel-item');
        if (oldItems.length > 0) {
            console.log('FilterTube: Removing stale FilterTube items from dropdown');
            oldItems.forEach(item => item.remove());
        }
    }
}

// Initialize menu observer after a delay
setTimeout(() => {
    setupMenuObserver();
}, 1000);
