# FilterTube Technical Documentation

This document provides a technical overview of the FilterTube extension's architecture, code structure, and key implementation details.

## Architecture Overview

FilterTube uses a content script-based approach for filtering YouTube content with zero flashing. The extension works by:

1. Injecting CSS rules immediately (before DOM ready) to hide all potential video elements
2. Processing video elements as they appear in the DOM
3. Marking elements as allowed or filtered based on user settings
4. Managing YouTube's layout to preserve UI integrity

## Key Components

```
┌────────────────────┐       ┌─────────────────┐       ┌───────────────────┐
│  CSS Injection     │       │  Content Script  │       │  Storage API      │
│  (Hide Everything) │◄─────►│  (Filter Logic)  │◄─────►│  (User Settings)  │
└────────────────────┘       └─────────────────┘       └───────────────────┘
                                     │
                                     ▼
┌────────────────────┐       ┌─────────────────┐       ┌───────────────────┐
│  MutationObserver  │       │  Polymer Data   │       │  DOM Manipulation │
│  (Content Changes) │◄─────►│  (Channel Info) │─────►│  (Show/Hide)       │
└────────────────────┘       └─────────────────┘       └───────────────────┘
```

### 1. CSS Injection System

The extension injects CSS rules at `document_start` to immediately hide potentially filterable content:

```css
/* Example of injected CSS */
ytd-video-renderer, ytd-grid-video-renderer {
    opacity: 0 !important;
    transition: opacity 0.1s ease-in-out !important;
}

[data-filter-tube-allowed="true"] {
    opacity: 1 !important;
}

[data-filter-tube-filtered="true"] {
    display: none !important;
}
```

This approach eliminates the "flash of unfiltered content" by hiding elements until they can be properly evaluated.

### 2. Observer System

FilterTube uses multiple specialized MutationObservers:

1. **Main Observer**: Watches the entire document for new video elements
2. **Sidebar Observer**: Specifically watches for sidebar recommendation videos
3. **Shorts Observer**: Specifically targets Shorts elements
4. **Comment Observer**: Monitors and filters comment threads

Each observer is throttled and optimized to minimize performance impact:

```javascript
// Simplified observer implementation
const observer = new MutationObserver((mutations) => {
    // Use throttling to prevent excessive processing
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
        applyFilters();
    }, 100);
});
```

### 3. YouTube Polymer Integration

The most complex aspect of FilterTube is extracting reliable channel information from YouTube's Polymer components.

#### How YouTube Structures Content

YouTube uses Polymer (a web component framework) to build its UI. Each video element is a Polymer component with:

1. A visible DOM that users see
2. Internal data structures that contain the complete video information
3. Connection points between these two layers

```
┌──────────────────────────────────────┐
│ YouTube Video Element                │
│  ┌────────────────┐   ┌────────────┐ │
│  │ Visible DOM    │   │ Polymer    │ │
│  │ - Thumbnail    │◄─►│ Controller │ │
│  │ - Title        │   │            │ │
│  │ - Channel Name │   │ .data      │ │
│  └────────────────┘   └────────────┘ │
└──────────────────────────────────────┘
```

#### Accessing Polymer Data

FilterTube extracts channel information from Polymer components by:

1. Finding the element's Polymer controller instance
2. Accessing internal data structures
3. Extracting channel IDs, handles, and other identifiers

```javascript
// Example of Polymer data extraction
function extractChannelInfoFromPolymer(element) {
    try {
        // Find the video element with a Polymer controller
        const videoElement = element.closest('ytd-compact-video-renderer');
        if (!videoElement) return null;

        // Access its Polymer data
        const polymerData = videoElement.polymerController || videoElement.inst;
        if (!polymerData || !polymerData.data) return null;

        // Extract channel information
        const channelInfo = {
            id: null,
            handle: null,
            name: null
        };

        // Try to get channel data from various data paths
        const runs = polymerData.data.longBylineText?.runs || 
                    polymerData.data.shortBylineText?.runs;
                    
        // Extract channel data from runs
        for (const run of runs) {
            if (run.navigationEndpoint?.browseEndpoint) {
                const browseEndpoint = run.navigationEndpoint.browseEndpoint;
                
                // Get channel ID (starts with UC)
                if (browseEndpoint.browseId && browseEndpoint.browseId.startsWith('UC')) {
                    channelInfo.id = browseEndpoint.browseId;
                }
                
                // Get channel handle
                if (browseEndpoint.canonicalBaseUrl) {
                    if (browseEndpoint.canonicalBaseUrl.startsWith('/@')) {
                        channelInfo.handle = browseEndpoint.canonicalBaseUrl;
                    }
                }
                
                // Get channel name
                if (run.text) {
                    channelInfo.name = run.text;
                }
            }
        }

        return channelInfo;
    } catch (error) {
        // Silently fail if there are any errors
        return null;
    }
}
```

#### Fallback Mechanisms

Since Polymer data may not always be immediately available, FilterTube implements:

1. Multiple extraction techniques (DOM-based, Polymer-based)
2. Retry mechanisms using requestAnimationFrame
3. Batch processing to handle large numbers of elements

```javascript
function watchSidebarCard(card) {
    if (processSidebarCard(card)) return;
    // If not ready yet, try again in next frame
    requestAnimationFrame(() => watchSidebarCard(card));
}
```

### 4. Performance Optimizations

To maintain smooth performance, FilterTube implements:

1. **Page Type Detection**: Different filtering strategies based on page type (home, watch, search)
2. **Batch Processing**: Processing elements in small batches with delays between them
3. **Visibility Checks**: Skipping processing when the page is hidden
4. **Throttling**: Limiting the frequency of filtering operations
5. **Cached Selectors**: Reusing DOM queries when possible

### 5. Channel Matching Algorithm

Matching channels reliably is challenging due to inconsistencies in how YouTube represents channel information:

```javascript
// Example of normalized channel matching
const matchesChannel = channels.some(channel => {
    const normalizedChannel = channel.replace(/^@|^channel:/, "").toLowerCase();
    return channelIdentifiers.some(id => {
        const normalizedId = id.replace(/^@|^channel:/, "").toLowerCase();
        return normalizedId === normalizedChannel || 
               normalizedId.includes(normalizedChannel) || 
               normalizedChannel.includes(normalizedId);
    });
});
```

This algorithm handles various channel formats:
- Raw channel names: `Channel Name`
- Handles: `@ChannelHandle`
- IDs: `UCxxxxxxxxxxxxx`
- Prefixed IDs: `channel:UCxxxxxxxxxxxxx`

## Technical Challenges

### 1. YouTube's Dynamic Content

YouTube uses a Single Page Application (SPA) architecture where content is loaded dynamically. FilterTube handles this by:

1. Watching for URL changes to detect navigation
2. Re-initializing appropriate observers on page type changes
3. Applying filters multiple times as content loads

### 2. Shorts Rendering

YouTube Shorts have unique rendering characteristics:

1. They appear in horizontal scrolling containers
2. Elements have minimal visible metadata
3. Channel information is often loaded after initial rendering

FilterTube implements special handling for shorts containers to maintain layout integrity after filtering.

### 3. Sidebar Videos

Sidebar videos (recommendations) present challenges:

1. They load progressively as the user scrolls
2. Channel information may not be immediately visible
3. Their Polymer data structure differs from main feed videos

The sidebar observer with retry logic ensures reliable filtering even when channel data is initially unavailable.

## Future Technical Directions

1. **Caching**: Store filtering results to avoid redundant processing
2. **Worker-based Processing**: Move filtering logic to a Web Worker for better performance
3. **Element Recycling**: Detect YouTube's element recycling patterns for more efficient filtering
4. **Specialized Component Handlers**: Create dedicated handlers for each YouTube component type

## Glossary

- **Polymer**: Web component framework used by YouTube
- **Zero Flash**: Technique to hide elements before they are visible to users
- **SPA**: Single Page Application architecture used by YouTube
- **MutationObserver**: Browser API to detect DOM changes
- **requestAnimationFrame**: Browser API for animation timing, used for retry logic 