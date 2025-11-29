# FilterTube - Layout System Implementation

This document details the implementation of the layout fixing system in FilterTube, particularly focused on solving layout issues with Mix cards, vertical watch cards, and search results.

## Problem Overview

When filtering YouTube content, simply hiding elements with `display: none` and then restoring them with `display: block` caused layout issues with certain complex YouTube components. The most notable problems were:

1. **Mix Cards Breaking Horizontal Layout**: 
   - Mix cards in search results should display as a horizontal layout with thumbnail on left (~50% width) and metadata on right (~50% width)
   - When a filter was applied and then removed, these cards would often display incorrectly with metadata below the thumbnail
   - The parent wrapper `yt-lockup-view-model-wiz--horizontal` lost its flex properties

2. **Vertical Watch Card Lists Disappearing**:
   - In search results, the `ytd-vertical-watch-card-list-renderer` components, which show a list of related videos, would remain hidden
   - Only their parent containers were being properly restored

3. **Inconsistent Child/Parent Visibility**:
   - After filtering, making parent elements visible didn't consistently propagate to child elements
   - This caused thumbnails to disappear while headers remained visible

## Architecture of the Fix

The solution involved a multi-layered approach combining CSS rules and JavaScript manipulation:

```
┌────────────────────────────────────────────────────────────┐
│                    FilterTube Layout System                │
├─────────────────┬────────────────────┬─────────────────────┤
│   CSS Layer     │  JavaScript Layer  │  Detection Layer    │
│                 │                    │                     │
│ • Display Rules │ • Layout Fixers    │ • Element Observers │
│ • Flex Layouts  │ • Class Propagation│ • Mutation Watchers │
│ • Size Settings │ • Style Injection  │ • High-priority Scan│
└─────────────────┴────────────────────┴─────────────────────┘
```

### 1. Enhanced CSS Rules

We implemented specific CSS rules to handle complex layouts properly:

```css
/* Preserve horizontal layout when making elements visible again */
.yt-lockup-view-model-wiz.filter-tube-visible {
    display: flex !important; /* Use flex instead of block for these specific mix elements */
}

/* Force horizontal layout for watch cards */
.yt-lockup-view-model-wiz--horizontal.filter-tube-visible {
    display: flex !important;
    flex-direction: row !important;
}

/* Force content image to have proper width for horizontal layout */
.yt-lockup-view-model-wiz--horizontal.filter-tube-visible .yt-lockup-view-model-wiz__content-image {
    width: 50% !important;
    flex-shrink: 0 !important;
}

/* Make sure metadata takes remaining space */
.yt-lockup-view-model-wiz--horizontal.filter-tube-visible .yt-lockup-view-model-wiz__metadata {
    flex-grow: 1 !important;
    width: 50% !important;
}
```

These rules ensure that:
- Mix cards retain their horizontal layout with flex display
- Child elements maintain proper proportions
- The thumbnail (content image) and metadata sections each get appropriate widths

### 2. Advanced JavaScript Layout Restoration

We created a dedicated layout fixer function to actively correct layout issues:

```javascript
function fixSearchResultsLayout() {
    // Find horizontal mix elements and fix their layout
    const searchMixElements = document.querySelectorAll('.yt-lockup-view-model-wiz--horizontal');
    
    // Apply direct style properties to force proper layout
    searchMixElements.forEach(mixElement => {
        if (mixElement.classList.contains('filter-tube-visible')) {
            // Fix content image and metadata containers
            // Force correct display properties
            // Set proper widths for horizontal layout
        }
    });
    
    // Fix vertical watch card lists that might still be hidden
    const verticalLists = document.querySelectorAll('ytd-vertical-watch-card-list-renderer');
    verticalLists.forEach(list => {
        // Make visible if parent is visible
    });
}
```

This function applies direct inline styles to ensure proper layout restoration, handling edge cases where CSS rules might not be sufficient.

### 3. Enhanced Element Selection and Filtering

We expanded our element selection to include all relevant components:

```javascript
const allSelectors = [
    // Original selectors...
    'ytd-vertical-watch-card-list-renderer', // Added for vertical lists
    '.yt-lockup-view-model-wiz', // Added for mix parent containers
    // ... and more
].join(', ');
```

This ensures our filter system captures and processes all relevant YouTube elements.

### 4. Parent-Child Visibility Propagation

In our component-specific handler functions:

```javascript
function hideMixElements(trimmedKeywords, trimmedChannels, rootNode = document) {
    // ... existing code ...
    
    // When restoring visibility, ensure parent-child relationships are preserved
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
            
            // Special handling for horizontal layouts
            // ...
        }
    }
    // ... existing code ...
}
```

This ensures that when an element is made visible, all its relevant parent and child components are also properly restored.

### 5. Watch Card Special Handling

```javascript
function handleWatchCardFiltering(trimmedKeywords, trimmedChannels) {
    // ... existing code ...
    
    // When making cards visible, explicitly restore all children
    if (!shouldFilterCard) {
        watchCard.classList.add('filter-tube-visible');
        
        // Also make sure all child components are visible
        const components = watchCard.querySelectorAll('ytd-watch-card-rich-header-renderer, ytd-watch-card-section-sequence-renderer, ytd-vertical-watch-card-list-renderer');
        components.forEach(component => {
            component.classList.add('filter-tube-visible');
        });
    }
    // ... existing code ...
}
```

This comprehensively handles watch cards, ensuring that all related components are properly shown or hidden together.

## Integration with Filtering System

Our layout restoration is integrated at multiple points in the filtering system:

1. **On Initial Load**:
   - When preferences are loaded, we apply filtering and layout fixing
   - `loadAndApplyInitialFilters() -> applyFilters() -> fixSearchResultsLayout()`

2. **On Storage Change**:
   - When user changes filtering preferences, we reapply filters and fix layouts
   - `chrome.storage.onChanged -> applyFilters() -> fixSearchResultsLayout()`

3. **On DOM Mutation**:
   - When YouTube adds new content (e.g., infinite scroll), we detect this through our mutation observer
   - `MutationObserver -> observerCallback -> applyFilters() -> fixSearchResultsLayout()`

4. **On Emergency Reset**:
   - If all filters are cleared, we restore everything to its original state
   - `applyFilters() (empty filters branch) -> fixSearchResultsLayout()`

## Robustness Measures

To ensure maximum stability and reliability:

1. **CSS Fallbacks**: Multiple CSS selectors target the same elements to handle YouTube DOM variations

2. **Direct Style Application**: Beyond CSS classes, we apply critical layout styles directly to elements when needed

3. **Enhanced Selector Coverage**: Expanded selector lists include all potential elements that need filtering

4. **High-Priority Processing**: 
   ```javascript
   const highPrioritySelectors = [
       'ytd-rich-item-renderer', // Home page items
       'ytd-grid-video-renderer', // Channel page videos
       // ... more selectors
   ];
   ```
   These elements trigger immediate filtering rather than throttled handling

5. **Attribute Change Detection**: The mutation observer watches both for new elements AND for attribute changes:
   ```javascript
   const observerConfig = {
       childList: true,
       subtree: true,
       attributes: true, // Watch for attribute changes
       attributeFilter: ['class'] // Only care about class changes
   };
   ```

## Technical Implementation Challenges

1. **YouTube's Dynamic Layout System**:
   - YouTube uses a mix of traditional CSS and dynamic layout calculation
   - Some layouts are determined by JavaScript at runtime
   - Our solution combines static CSS rules with dynamic JavaScript adjustments

2. **Timing Issues**:
   - YouTube loads content asynchronously and continuously
   - Our mutation observer and high-priority detection ensure we catch new elements

3. **Selector Stability**:
   - YouTube's DOM structure may change with updates
   - We use multiple selector patterns for resilience

## Future Considerations

1. **Performance Optimization**:
   - Current implementation prioritizes correctness over performance
   - Future optimizations could include:
     - More targeted mutation observation
     - Reduced style recalculation
     - Batched DOM operations

2. **Expanded Layout Handling**:
   - Additional layout types may emerge as YouTube evolves
   - The architecture is extensible for adding new layout handlers

3. **Automatic Layout Detection**:
   - Future versions could automatically detect and preserve YouTube's native layouts
   - This would reduce the need for manual layout fixes

## Summary

This layout fix system represents a significant enhancement to FilterTube, addressing complex layout preservation challenges in YouTube's dynamic interface. By combining CSS rules, targeted JavaScript manipulation, and comprehensive element detection, we've created a robust solution that maintains YouTube's intended layouts while still providing powerful content filtering capabilities.

## 6. Shorts Container Handling

**Problem:**
Blocking a Short often left a blank space because we were hiding the inner `ytm-shorts-lockup-view-model` but not its parent container (`ytd-rich-item-renderer` or `.ytGridShelfViewModelGridShelfItem`).

**Solution:**
We implemented intelligent container detection in `handleBlockChannelClick`.

```javascript
if (videoCard.tagName.toLowerCase().includes('shorts-lockup-view-model')) {
    let parentContainer = videoCard.closest('ytd-rich-item-renderer');
    
    if (!parentContainer) {
        // Handle grid layouts (Search results, Channel pages)
        parentContainer = videoCard.closest('.ytGridShelfViewModelGridShelfItem');
    }
    
    if (parentContainer) {
        containerToHide = parentContainer;
    }
}
```

This ensures that when a Short is blocked, the entire grid slot is removed, allowing YouTube's grid layout to reflow naturally and eliminate gaps.

The implementation is designed to be maintainable, extensible, and resilient against YouTube's evolving interface, ensuring a seamless user experience when filtering content.