/**
 * Layout handler for FilterTube extension
 * 
 * This script is responsible for fixing YouTube's layout issues
 * after videos are filtered out by the content.js script.
 */

// Export layout fixing functions for use in content.js
window.filterTubeLayout = {
    /**
     * Special function to fix layout issues in search results after filtering
     * Especially for Mix elements that need horizontal layout restored
     */
    fixSearchResultsLayout: function() {
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
        const isChannelPage = window.location.pathname.includes('/channel/') || 
                            window.location.pathname.includes('/@') || 
                            document.querySelector('ytd-browse[page-subtype="channels"]');
                            
        const isSearchPage = window.location.pathname.includes('/results') ||
                            document.querySelector('ytd-search');
        
        if (isChannelPage) {
            console.log('FilterTube: Fixing channel page grid layout');
            
            // Find grid containers - more specific selectors to target the right elements
            const gridContainers = document.querySelectorAll(
                'ytd-browse[page-subtype="channels"] #contents.ytd-rich-grid-renderer, ' +
                'ytd-browse[role="main"] #contents.ytd-rich-grid-renderer, ' +
                'ytd-browse #contents.ytd-rich-grid-renderer'
            );
            
            if (gridContainers.length === 0) {
                console.log('FilterTube: No grid containers found on channel page');
            }
            
            gridContainers.forEach(grid => {
                // Force grid display with !important-like priority
                grid.setAttribute('style', 
                    'display: grid !important; ' +
                    'grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; ' +
                    'grid-gap: 16px !important;'
                );
                
                // Make sure visible items have proper styling
                const visibleItems = grid.querySelectorAll('.filter-tube-visible');
                visibleItems.forEach(item => {
                    item.setAttribute('style',
                        'width: 100% !important; ' +
                        'margin: 0 !important; ' +
                        'display: block !important;'
                    );
                });
                
                // Find any parent containers that might be affecting layout
                const richGridRenderer = grid.closest('ytd-rich-grid-renderer');
                if (richGridRenderer) {
                    richGridRenderer.style.display = 'block';
                }
            });
            
            // Additional check for row renderers that might be causing issues
            const rowRenderers = document.querySelectorAll('ytd-rich-grid-row-renderer');
            rowRenderers.forEach(row => {
                row.style.display = 'contents';
            });
        }
        
        // Fix search page layout
        if (isSearchPage) {
            console.log('FilterTube: Fixing search page layout');
            
            // Force search results to display in a list format
            const searchContainers = document.querySelectorAll('ytd-search #contents.ytd-section-list-renderer');
            searchContainers.forEach(container => {
                // Don't force grid on search - can break layout
                // Just ensure proper spacing and alignment
                container.style.maxWidth = '100%';
                
                // Make sure visible items are properly displayed
                const visibleItems = container.querySelectorAll('ytd-video-renderer.filter-tube-visible, ytd-channel-renderer.filter-tube-visible');
                visibleItems.forEach(item => {
                    item.style.width = '100%';
                    item.style.margin = '0 0 16px 0';
                    
                    // For video renderers, ensure proper layout
                    if (item.tagName === 'YTD-VIDEO-RENDERER') {
                        item.style.display = 'flex';
                        
                        // Fix the dismissible container
                        const dismissible = item.querySelector('#dismissible');
                        if (dismissible) {
                            dismissible.style.display = 'flex';
                            dismissible.style.flexDirection = 'row';
                            dismissible.style.alignItems = 'flex-start';
                        }
                        
                        // Fix the thumbnail
                        const thumbnail = item.querySelector('ytd-thumbnail');
                        if (thumbnail) {
                            thumbnail.style.width = '360px';
                            thumbnail.style.minWidth = '360px';
                            thumbnail.style.height = '202px';
                            thumbnail.style.marginRight = '16px';
                            thumbnail.style.flex = '0 0 auto';
                        }
                        
                        // Fix the text wrapper
                        const textWrapper = item.querySelector('.text-wrapper, #meta');
                        if (textWrapper) {
                            textWrapper.style.flex = '1 1 auto';
                            textWrapper.style.paddingLeft = '16px';
                            textWrapper.style.display = 'block';
                            textWrapper.style.alignSelf = 'flex-start';
                        }
                    }
                });
                
                // Special handling for shorts in search results
                const shortItems = container.querySelectorAll('ytd-reel-item-renderer.filter-tube-visible, ytd-reel-video-renderer.filter-tube-visible');
                shortItems.forEach(shortItem => {
                    shortItem.style.width = 'auto';
                    shortItem.style.marginRight = '8px';
                    shortItem.style.display = 'inline-block';
                    
                    // Fix the thumbnail
                    const thumbnail = shortItem.querySelector('ytd-thumbnail');
                    if (thumbnail) {
                        thumbnail.style.width = '176px';
                        thumbnail.style.height = '312px';
                        thumbnail.style.marginRight = '0';
                    }
                });
            });
        }
        
        // Fix layout for watch card compact videos 
        const watchCardCompactVideos = document.querySelectorAll('ytd-watch-card-compact-video-renderer.filter-tube-visible');
        
        watchCardCompactVideos.forEach(video => {
            // Force flex layout for compact videos
            video.style.display = 'flex';
            video.style.flexDirection = 'row';
            video.style.width = '100%';
            video.style.marginBottom = '8px';
            video.style.alignItems = 'flex-start';
            
            // Fix thumbnail
            const thumbnail = video.querySelector('ytd-thumbnail');
            if (thumbnail) {
                thumbnail.style.width = '120px';
                thumbnail.style.minWidth = '120px';
                thumbnail.style.height = '68px'; // Fixed height
                thumbnail.style.marginRight = '8px';
                thumbnail.style.flex = '0 0 auto';
                thumbnail.style.display = 'block';
                
                // Fix inner thumbnail elements
                const thumbnailLink = thumbnail.querySelector('a');
                if (thumbnailLink) {
                    thumbnailLink.style.display = 'block';
                    thumbnailLink.style.width = '100%';
                    thumbnailLink.style.height = '100%';
                }
                
                const ytImage = thumbnail.querySelector('yt-image');
                if (ytImage) {
                    ytImage.style.display = 'block';
                    ytImage.style.width = '100%';
                    ytImage.style.height = '100%';
                }
                
                const img = thumbnail.querySelector('img');
                if (img) {
                    img.style.display = 'block';
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                }
                
                // Make time overlay visible if it exists
                const timeOverlay = thumbnail.querySelector('ytd-thumbnail-overlay-time-status-renderer');
                if (timeOverlay) {
                    timeOverlay.style.display = 'block';
                }
            }
            
            // Fix text wrapper
            const textWrapper = video.querySelector('.text-wrapper');
            if (textWrapper) {
                textWrapper.style.flex = '1 1 auto';
                textWrapper.style.paddingLeft = '8px';
                textWrapper.style.display = 'block';
                textWrapper.style.alignSelf = 'flex-start';
            }
        });
        
        // Fix universal watch card renderers
        const watchCards = document.querySelectorAll('ytd-universal-watch-card-renderer.filter-tube-visible');
        
        watchCards.forEach(card => {
            card.style.display = 'block';
            card.style.width = '100%';
            card.style.maxWidth = '862px';
            card.style.marginBottom = '24px';
            
            // Fix header
            const header = card.querySelector('ytd-watch-card-rich-header-renderer.filter-tube-visible');
            if (header) {
                header.style.display = 'block';
                header.style.width = '100%';
                header.style.marginBottom = '12px';
                
                // Fix header container
                const container = header.querySelector('#container');
                if (container) {
                    container.style.display = 'flex';
                    container.style.flexDirection = 'row';
                    container.style.alignItems = 'center';
                }
                
                // Fix header body
                const body = header.querySelector('#body');
                if (body) {
                    body.style.flex = '1 1 auto';
                }
            }
            
            // Fix vertical list renderers
            const verticalList = card.querySelector('ytd-vertical-watch-card-list-renderer.filter-tube-visible');
            if (verticalList) {
                verticalList.style.display = 'block';
                verticalList.style.width = '100%';
                verticalList.style.marginBottom = '16px';
                
                // Fix items container
                const items = verticalList.querySelector('#items');
                if (items) {
                    items.style.display = 'block';
                    items.style.width = '100%';
                }
            }
            
            // Fix section sequence renderer
            const sectionSequence = card.querySelector('ytd-watch-card-section-sequence-renderer.filter-tube-visible');
            if (sectionSequence) {
                sectionSequence.style.display = 'block';
                sectionSequence.style.width = '100%';
                sectionSequence.style.marginBottom = '16px';
                
                // Fix lists container
                const lists = sectionSequence.querySelector('#lists');
                if (lists) {
                    lists.style.display = 'block';
                    lists.style.width = '100%';
                }
            }
            
            // Fix hero video renderer
            const heroVideo = card.querySelector('ytd-watch-card-hero-video-renderer.filter-tube-visible');
            if (heroVideo) {
                // Fix title container
                const titleContainer = heroVideo.querySelector('.title-container');
                if (titleContainer) {
                    titleContainer.style.width = '100%';
                    titleContainer.style.padding = '12px';
                }
                
                // Fix title
                const title = heroVideo.querySelector('#watch-card-title');
                if (title) {
                    title.style.fontSize = '16px';
                    title.style.lineHeight = '22px';
                    title.style.marginBottom = '4px';
                }
            }
        });
        
        // Fix shorts layout - ensure they're displayed horizontally
        this.fixShortsLayout();
    },
    
    /**
     * Fix layout issues specifically for YouTube Shorts
     */
    fixShortsLayout: function() {
        // Fix shorts shelves - ensure horizontal layout
        const shortsShelvesContainers = document.querySelectorAll('ytd-reel-shelf-renderer.filter-tube-visible');
        
        shortsShelvesContainers.forEach(shelf => {
            // Get the horizontal list renderer
            const horizontalList = shelf.querySelector('yt-horizontal-list-renderer');
            if (horizontalList) {
                // Ensure proper display
                horizontalList.style.display = 'block';
                horizontalList.style.width = '100%';
                
                // Fix the items container to be horizontal
                const itemsContainer = horizontalList.querySelector('#items');
                if (itemsContainer) {
                    // Apply flex layout for horizontal scrolling
                    itemsContainer.style.display = 'flex';
                    itemsContainer.style.flexDirection = 'row';
                    itemsContainer.style.overflowX = 'auto';
                    itemsContainer.style.gap = '8px';
                    
                    // Remove any transform that could break layout
                    if (itemsContainer.style.transform) {
                        itemsContainer.style.transform = 'none';
                    }
                    
                    // Add scroll snap for smooth scrolling
                    itemsContainer.style.scrollSnapType = 'x mandatory';
                }
                
                // Ensure the scroll container works properly
                const scrollContainer = horizontalList.querySelector('#scroll-container');
                if (scrollContainer) {
                    scrollContainer.style.overflowX = 'auto';
                }
                
                // Fix the arrow buttons
                const leftArrow = horizontalList.querySelector('#left-arrow');
                const rightArrow = horizontalList.querySelector('#right-arrow');
                
                if (leftArrow) {
                    leftArrow.style.display = 'flex';
                    leftArrow.style.alignItems = 'center';
                    leftArrow.style.justifyContent = 'center';
                    leftArrow.style.zIndex = '2';
                    leftArrow.style.position = 'absolute';
                    leftArrow.style.left = '0';
                }
                
                if (rightArrow) {
                    rightArrow.style.display = 'flex';
                    rightArrow.style.alignItems = 'center';
                    rightArrow.style.justifyContent = 'center';
                    rightArrow.style.zIndex = '2';
                    rightArrow.style.position = 'absolute';
                    rightArrow.style.right = '0';
                }
            }
            
            // Also make the shelf's contents container visible
            const contents = shelf.querySelector('#contents');
            if (contents) {
                contents.style.display = 'block';
            }
        });
        
        // Fix shorts items in various containers
        const shortsItems = document.querySelectorAll(
            'ytm-shorts-lockup-view-model-v2.filter-tube-visible, ' + 
            'ytm-shorts-lockup-view-model.filter-tube-visible, ' +
            '.shortsLockupViewModelHost.filter-tube-visible'
        );
        
        shortsItems.forEach(item => {
            // Set display to inline-block to maintain horizontal layout
            item.style.display = 'inline-block';
            item.style.verticalAlign = 'top';
            item.style.marginRight = '8px';
            item.style.scrollSnapAlign = 'start';
            
            // Ensure the thumbnail container is visible and sized properly
            const thumbnailContainer = item.querySelector(
                '.shortsLockupViewModelHostThumbnailContainer, ' +
                '.shortsLockupViewModelHostThumbnailContainerRounded'
            );
            
            if (thumbnailContainer) {
                thumbnailContainer.style.display = 'block';
                // Default shorts thumbnail dimensions to maintain aspect ratio
                thumbnailContainer.style.width = '176px';  // YouTube's original width
                thumbnailContainer.style.height = '312px'; // Maintain aspect ratio
                thumbnailContainer.style.borderRadius = '12px';
                thumbnailContainer.style.overflow = 'hidden';
                
                // Ensure images inside are also properly sized
                const img = thumbnailContainer.querySelector('img');
                if (img) {
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                }
            }
            
            // Make sure metadata is visible and positioned correctly
            const metadata = item.querySelector(
                '.shortsLockupViewModelHostOutsideMetadata, ' +
                '.shortsLockupViewModelHostMetadataRounded'
            );
            
            if (metadata) {
                metadata.style.display = 'block';
                metadata.style.width = '176px'; // Match thumbnail width
                metadata.style.marginTop = '8px';
                metadata.style.padding = '0';
                
                // Fix title and view count
                const title = metadata.querySelector('.shortsLockupViewModelHostMetadataTitle');
                const views = metadata.querySelector('.shortsLockupViewModelHostMetadataSubhead');
                
                if (title) {
                    title.style.fontSize = '14px';
                    title.style.lineHeight = '20px';
                    title.style.maxHeight = '40px'; // 2 lines max
                    title.style.overflow = 'hidden';
                }
                
                if (views) {
                    views.style.fontSize = '12px';
                    views.style.lineHeight = '18px';
                    views.style.color = '#606060';
                }
            }
        });
        
        // Fix shorts on homepage
        this.fixHomepageShorts();
    },
    
    /**
     * Fix shorts layout specifically on the homepage
     */
    fixHomepageShorts: function() {
        // Target the main shorts section on the homepage
        const shortsMainSections = document.querySelectorAll('ytd-rich-section-renderer');
        
        shortsMainSections.forEach(section => {
            // Check if this is a shorts section
            const shortsShelf = section.querySelector('ytd-rich-shelf-renderer[is-shorts]');
            if (!shortsShelf) return;
            
            console.log('FilterTube: Fixing shorts on homepage');
            
            // Direct method - force flex layout with important priority
            shortsShelf.setAttribute('style', 
                'display: flex !important;' +
                'flex-wrap: nowrap !important;' +
                'overflow-x: auto !important;' +
                'width: 100% !important;' +
                'flex-direction: row !important;' +
                'transform: none !important;'
            );
            
            // Direct fix for contents container
            const contents = shortsShelf.querySelector('#contents');
            if (contents) {
                contents.setAttribute('style',
                    'display: flex !important;' +
                    'flex-wrap: nowrap !important;' +
                    'overflow-x: auto !important;' +
                    'width: 100% !important;' +
                    'flex-direction: row !important;' +
                    'transform: none !important;'
                );
            }
            
            // Fix each shorts item
            const shortsItems = shortsShelf.querySelectorAll('ytd-rich-item-renderer');
            shortsItems.forEach(item => {
                item.setAttribute('style', 
                    'display: inline-block !important;' +
                    'width: 176px !important;' +
                    'min-width: 176px !important;' +
                    'max-width: 176px !important;' +
                    'flex: 0 0 auto !important;' +
                    'margin-right: 8px !important;' +
                    'position: relative !important;'
                );
                
                // Fix the shorts model
                const shortsModel = item.querySelector('.shortsLockupViewModelHost, ytm-shorts-lockup-view-model-v2, ytm-shorts-lockup-view-model');
                if (shortsModel) {
                    shortsModel.setAttribute('style',
                        'display: inline-block !important;' +
                        'width: 176px !important;' +
                        'height: auto !important;'
                    );
                    
                    // Fix the thumbnail container
                    const thumbnailContainer = shortsModel.querySelector(
                        '.shortsLockupViewModelHostThumbnailContainer, ' +
                        '.shortsLockupViewModelHostThumbnailContainerRounded, ' +
                        '.shortsLockupViewModelHostThumbnailContainerAspectRatioTwoByThree'
                    );
                    
                    if (thumbnailContainer) {
                        thumbnailContainer.setAttribute('style',
                            'display: block !important;' +
                            'width: 176px !important;' +
                            'height: 312px !important;' +
                            'border-radius: 12px !important;' +
                            'overflow: hidden !important;'
                        );
                        
                        // Fix thumbnail image
                        const image = thumbnailContainer.querySelector('img');
                        if (image) {
                            image.setAttribute('style',
                                'display: block !important;' +
                                'width: 100% !important;' +
                                'height: 100% !important;' +
                                'object-fit: cover !important;'
                            );
                        }
                    }
                    
                    // Fix metadata container
                    const metadataContainer = shortsModel.querySelector(
                        '.shortsLockupViewModelHostOutsideMetadata, ' +
                        '.shortsLockupViewModelHostMetadataRounded'
                    );
                    
                    if (metadataContainer) {
                        metadataContainer.setAttribute('style',
                            'display: block !important;' +
                            'width: 100% !important;'
                        );
                    }
                }
            });
        });
        
        // Fix any standalone shorts shelves (not in rich-section-renderer)
        const standaloneShortsShelves = document.querySelectorAll('ytd-rich-shelf-renderer[is-shorts]:not([hidden])');
        standaloneShortsShelves.forEach(shelf => {
            // Skip if already handled
            if (shelf.closest('ytd-rich-section-renderer')) return;
            
            // Apply the same direct fixes
            shelf.setAttribute('style', 
                'display: flex !important;' +
                'flex-wrap: nowrap !important;' +
                'overflow-x: auto !important;' +
                'width: 100% !important;' +
                'flex-direction: row !important;' +
                'transform: none !important;'
            );
            
            const contents = shelf.querySelector('#contents');
            if (contents) {
                contents.setAttribute('style',
                    'display: flex !important;' +
                    'flex-wrap: nowrap !important;' +
                    'overflow-x: auto !important;' +
                    'width: 100% !important;' +
                    'flex-direction: row !important;' +
                    'transform: none !important;'
                );
            }
            
            // Apply fixes to items
            const items = shelf.querySelectorAll('ytd-rich-item-renderer');
            items.forEach(item => {
                item.setAttribute('style', 
                    'display: inline-block !important;' +
                    'width: 176px !important;' +
                    'min-width: 176px !important;' +
                    'max-width: 176px !important;' +
                    'flex: 0 0 auto !important;' +
                    'margin-right: 8px !important;'
                );
            });
        });
    },
    
    /**
     * Ensures an element that should be hidden is completely removed from the layout flow
     * to prevent blank spaces
     * @param {Element} element - The element to ensure is properly hidden
     */
    ensureElementHidden: function(element) {
        if (!element) return;
        
        // Apply extreme hiding styles to ensure the element doesn't affect layout
        element.style.display = 'none';
        element.style.margin = '0';
        element.style.padding = '0';
        element.style.height = '0';
        element.style.minHeight = '0';
        element.style.maxHeight = '0';
        element.style.width = '0';
        element.style.minWidth = '0';
        element.style.maxWidth = '0';
        element.style.overflow = 'hidden';
        element.style.position = 'absolute';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
    },
    
    /**
     * Fix layout issues after filtering, including ensuring no blank spaces from hidden elements
     */
    fixLayoutAfterFiltering: function() {
        // Fix search results layout
        this.fixSearchResultsLayout();
        
        // Fix shorts layout
        this.fixShortsLayout();
        
        // Find all elements that don't have .filter-tube-visible class but might be leaving blank spaces
        const hiddenElements = document.querySelectorAll(`
            ytd-video-renderer:not(.filter-tube-visible),
            ytd-grid-video-renderer:not(.filter-tube-visible),
            ytd-rich-item-renderer:not(.filter-tube-visible),
            ytd-compact-video-renderer:not(.filter-tube-visible),
            ytd-radio-renderer:not(.filter-tube-visible),
            ytd-mix-renderer:not(.filter-tube-visible),
            ytd-playlist-renderer:not(.filter-tube-visible),
            ytd-shelf-renderer:not(.filter-tube-visible),
            ytd-horizontal-card-list-renderer:not(.filter-tube-visible),
            ytd-universal-watch-card-renderer:not(.filter-tube-visible)
        `);
        
        // Apply extreme hiding styles to each
        hiddenElements.forEach(element => {
            this.ensureElementHidden(element);
        });
        
        // Force grid layout to fill in gaps
        const gridContainers = document.querySelectorAll('ytd-browse #contents.ytd-rich-grid-renderer');
        gridContainers.forEach(container => {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
            container.style.gridGap = '16px';
            container.style.gridAutoFlow = 'dense'; // This helps fill in gaps
        });
    }
}; 