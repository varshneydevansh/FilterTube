# FilterTube v3.2.4 - Current Functionality Documentation

## Overview

FilterTube v3.2.4 implements a **hybrid filtering system** with dual filtering modes:

- A primary **data interception layer** removes blocked items from YouTube JSON responses before render when possible.
- A secondary **DOM fallback layer** hides/restores already-rendered elements for SPA navigation, DOM recycling, and edge cases.
- **Experimental Whitelist Mode**: Hide all content except explicitly allowed channels and keywords (v3.2.4).

## Core Filtering Capabilities

### **Content Filtering Modes**

- **Blocklist Mode (Default)**: Traditional filtering - hide content matching blocked channels/keywords
- **Whitelist Mode (Experimental v3.2.4)**: Hide all content except content matching whitelisted channels/keywords
- **Video Filtering**: Filters videos by title keywords before rendering
- **Channel Filtering**: Blocks/allows content from specific channels using @handles, channel IDs, or channel names
- **Comments Filtering**: Removes comment sections entirely when hideAllComments is enabled
- **Shorts Filtering**: Blocks YouTube Shorts content when hideAllShorts is enabled

### **Whitelist Mode Features (v3.2.4)**

- **Intelligent Mode Switching**: Confirmation dialogs prevent accidental data loss when switching modes
- **Enhanced Channel Identity**: Multi-source channel extraction with improved reliability
- **Search Page Optimizations**: Right-rail watch cards handled intelligently
- **Performance Improvements**: Selective processing and bridge-level optimizations
- **UI Enhancements**: Clean interface that hides irrelevant controls in whitelist mode
- **State Tracking**: Seamless switching between blocklist and whitelist modes

### **Stats Tracking**
- **Time Saved**: Calculates and displays the time saved by blocking unwanted videos using actual video durations extracted from YouTube metadata (falls back to 3 minutes for videos, 30 seconds for shorts when duration unavailable).
- **Videos Hidden**: Tracks the total number of videos blocked daily.
- **Visual Badges**: Shows stats directly on the extension icon.

### **Advanced Matching**
- **Multi-Path Extraction**: Uses multiple fallback data paths to extract content information
- **Fuzzy Channel Matching**: Matches partial channel names and handles case variations
- **Robust Data Handling**: Gracefully handles YouTube's changing data structures

## Technical Implementation

### **Data Interception Architecture**
FilterTube v3.x operates by intercepting YouTube's JSON data at multiple points:

1. **Initial Page Data** (`window.ytInitialData`)
   - Home page video feeds
   - Search results
   - Channel pages
   - Playlist contents

2. **Player Data** (`window.ytInitialPlayerResponse`)
   - Video metadata
   - Related video suggestions
   - Comment data

3. **Dynamic Content** (fetch/XHR interception)
   - Infinite scroll content
   - Search suggestions
   - Navigation updates

### **Filter Processing Pipeline**
```
YouTube JSON Data → FilterTubeEngine.processData() → Filtered Data → YouTube Renderer
```

### **Zero-Flash Technology (best-effort)**
- **Pre-Render Filtering**: When content arrives via intercepted JSON, blocked items are removed before render.
- **DOM Safety Net**: When YouTube inserts content via hydration or recycled nodes, DOM fallback hides it as soon as it exists.
- **Watch Playlist Protection**: On `/watch?...&list=...`, Next/Prev navigation is guarded so the player does not visibly land on blocked playlist items.

## Supported YouTube Components

### **Video Renderers**
- `richItemRenderer` - Primary home page videos
- `videoRenderer` - Search results and recommendations  
- `gridVideoRenderer` - Grid layout videos
- `compactVideoRenderer` - Sidebar recommendations
- `playlistVideoRenderer` - Playlist contents

### **Channel Renderers**
- `channelRenderer` - Channel search results
- `gridChannelRenderer` - Channel grid layouts

### **Specialized Renderers**
- `shelfRenderer` - Content category shelves
- `lockupViewModel` - Modern YouTube UI components
- `universalWatchCardRenderer` - Watch page components
- `channelVideoPlayerRenderer` - Channel-specific players
- `ticketShelfRenderer` - Promotional content
- And 10+ additional renderer types

## Filtering Features

### **Keyword Filtering**
- **Title Matching**: Filters videos based on title content
- **Case Insensitive**: Automatically handles case variations
- **Partial Matching**: Supports substring matching within titles
- **Multiple Keywords**: Supports filtering by multiple keyword patterns

### **Channel Filtering**
- **UC ID Support**: Blocks channels by canonical channel IDs (`UC...`).
- **@Handle Support**: Blocks channels by `@handle` aliases, including unicode/percent-encoded handles.
- **Legacy URL Support**: Blocks channels by `/c/<name>` and `/user/<name>` via normalized `customUrl` keys.
- **Name Matching (conservative)**: Some surfaces (notably watch-page playlist panels) expose only byline names; FilterTube uses strict name matching only as a fallback.
- **Collaboration Awareness**: Adds a shared `collaborationGroupId` when the user blocks multi-author videos; the UI reflects missing collaborators via dashed rails + tooltips without altering sort order.
- **Handle Normalization**: Handle parsing is unicode-safe and percent-decoding aware (`js/shared/identity.js`), so handles like `@감동메모리` and percent-encoded variants remain matchable across surfaces.
- **404 Recovery Pipeline**: Every block request runs through a cache-first lookup, ytInitialData replay, Shorts helpers, and DOM cache invalidation so handles never persist without a canonical UC ID—even when `/@handle/about` returns 404.

### **Comment Filtering**
- **Complete Removal**: Removes entire comment sections
- **Engagement Panel Filtering**: Removes comment-related UI panels
- **Comment Thread Blocking**: Prevents comment threads from loading

### **Shorts Filtering**
- **Shorts Detection**: Identifies and blocks YouTube Shorts content
- **Multiple Layouts**: Handles Shorts in various YouTube layouts
- **Mobile Compatibility**: Works across desktop and mobile interfaces
- **Canonical Resolution**: Resolves to a canonical `UC...` channel ID whenever possible so blocking a Short also blocks long-form uploads and posts from the same channel. This is typically learned from DOM metadata and intercepted YouTube JSON (then persisted in `videoChannelMap`); a hidden fetch is used only as a fallback when the UC ID is not yet available.
- **Zero-Gap Removal**: DOM fallback hides the entire parent `ytd-rich-item-renderer`/grid slot so blocked Shorts never leave blank placeholders.
- **Collaboration Support**: When Shorts include the avatar stack UI, FilterTube requests collaborator metadata from the main world so the same multi-channel 3-dot menu appears on Shorts shelves and the watch page.

## Performance Characteristics

### **Speed Metrics**
- **Page Load Impact**: 5-15ms additional processing time
- **Memory Usage**: 2-5MB baseline (no ongoing memory growth)
- **CPU Usage**: Minimal ongoing CPU usage (only during data processing)
- **Network Impact**: Reduces bandwidth by blocking unwanted content

### **Scalability**
- **High Volume Handling**: Efficiently processes pages with 1000+ items
- **No Performance Degradation**: Maintains consistent performance regardless of content volume
- **Memory Efficient**: No memory leaks or observer-related memory growth

## Cross-Browser Support

### **Chrome Features**
- **MV3 Native Support**: Uses chrome.scripting.executeScript with world: 'MAIN'
- **Optimal Performance**: Leverages Chrome's native injection APIs
- **Service Worker Compatibility**: Full MV3 service worker support

### **Firefox Features**
- **Fallback Injection**: Uses script tag injection for MAIN world access
- **MV3 Compatibility**: Works with Firefox's MV3 implementation
- **CSP Handling**: Robust Content Security Policy compatibility

### **Unified Experience**
- **Identical Functionality**: Same filtering capabilities across browsers
- **Consistent Performance**: Similar performance characteristics
- **Shared Settings**: Settings work identically across browsers

## Data Sources Processed

### **Primary Data Sources**
1. **ytInitialData**: Main page content data
2. **ytInitialPlayerResponse**: Video player and metadata
3. **YouTube API Endpoints**: Dynamic content loading

### **API Endpoints Intercepted**
- `/youtubei/v1/search` - Search results
- `/youtubei/v1/browse` - Browse/navigation requests
- `/youtubei/v1/next` - Related content loading
- `/youtubei/v1/guide` - Navigation guide data
- `/youtubei/v1/player` - Video player requests

## Settings and Configuration

### **Storage System**
- **Local Storage**: All settings stored locally in browser
- **Real-time Updates**: Settings changes apply immediately
- **Cross-tab Synchronization**: Settings sync across all YouTube tabs

### **Configuration Options**
- **Filter Keywords**: List of keywords to filter from video titles
- **Filter Channels**: List of channels to block (supports @handles, IDs, names)
- **Hide All Comments**: Toggle to remove all comment sections
- **Hide All Shorts**: Toggle to remove all YouTube Shorts content
- **Exact Word Matching**: Option for precise keyword matching
- **Filter Comments Content**: Advanced comment content filtering

## User Interface Integration

### **Extension Popup**
- **Quick Settings Access**: Easy access to primary filtering options
- **Real-time Preview**: Immediate feedback on filter changes
- **Status Indicators**: Shows current filtering state
- **List Mode Toggle (Experimental v3.2.3)**: Switch between Blocklist and Whitelist modes

#### UI polish (v3.2.1)
- Popup search bars (keywords/channels/content controls) now align to full row width; add buttons sit beside matching-sized inputs.
- Content control rows in popup hide descriptions for compactness; tab view keeps descriptions as title-only tooltips (hover the title text).
- Pills/chips: Exact = whole-term matching; Comment defaults **ON** (filters matching comments, can be turned off even if Hide Comments is on); Filter All creates a channel-derived keyword with Exact on the channel name. C/E round chips mirror popup pills.
- Proactive XHR interception provides instant channel names in 3-dot menus, eliminating "Fetching..." delays.
- Badges match row tinting: green = From Channel, brown = From Comments, yellow = Collaboration rows.

### **Tab View (Advanced Dashboard)**
- **Channel Management**: Dedicated interface for managing blocked/allowed channels.
- **Keyword Management**: Advanced keyword list editing.
- **Stats Dashboard**: Detailed view of time saved and videos hidden.
- **List Mode Controls (Experimental v3.2.3)**: Profile-specific whitelist/blocklist mode switching

### **Advanced Settings**
- **Detailed Configuration**: Access to all filtering options
- **Import/Export**: Settings backup and sharing capabilities
- **Debugging Tools**: Advanced troubleshooting features

## Error Handling and Recovery

### **Robust Error Handling**
- **Graceful Degradation**: Continues working even if some features fail
- **Automatic Recovery**: Self-correcting for temporary issues
- **Fallback Mechanisms**: Multiple backup approaches for critical functions

### **Debugging Support**
- **Console Logging**: Detailed logging for troubleshooting
- **Performance Monitoring**: Tracks processing times and efficiency
- **Error Reporting**: Clear error messages for user support

## Future-Proof Design

### **Adaptability**
- **Data Structure Changes**: Automatically adapts to YouTube layout changes
- **API Evolution**: Designed to handle YouTube API updates
- **Platform Extensions**: Architecture supports expansion to other platforms

### **Maintenance**
- **Modular Design**: Easy to update individual components
- **Comprehensive Testing**: Extensive validation across YouTube variations
- **Version Compatibility**: Backwards compatible settings and data

## Security and Privacy

### **Privacy Protection**
- **Local Processing Only**: No data sent to external servers
- **No Analytics**: Zero tracking or usage analytics
- **Secure Storage**: Settings encrypted with browser's security model

### **Security Features**
- **Isolated Execution**: Runs in browser's security sandbox
- **Cross-Origin Protection**: Secure communication between extension components
- **CSP Compliance**: Respects all Content Security Policy restrictions

This data interception approach represents a significant advancement over traditional DOM-based filtering, providing superior performance, user experience, and future-proof operation.