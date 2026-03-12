# FilterTube v3.2.7 - Current Functionality Documentation

## Overview

FilterTube v3.2.7 implements a **hybrid filtering system** with dual filtering modes:

- A primary **data interception layer** removes blocked items from YouTube JSON responses before render when possible.
- A secondary **DOM fallback layer** hides/restores already-rendered elements for SPA navigation, DOM recycling, and edge cases.
- **Whitelist Mode**: Hide all content except explicitly allowed channels and keywords.
- **Category Filtering**: Filter videos by YouTube category (e.g., Music, Gaming, Education) (v3.2.7).

## Core Filtering Capabilities

### **Content Filtering Modes**

- **Blocklist Mode (Default)**: Traditional filtering - hide content matching blocked channels/keywords
- **Whitelist Mode (v3.2.5)**: Hide all content except content matching whitelisted channels/keywords
- **Video Filtering**: Filters videos by title keywords before rendering
- **Channel Filtering**: Blocks/allows content from specific channels using @handles, channel IDs, or channel names
- **Comments Filtering**: Removes comment sections entirely when hideAllComments is enabled
- **Shorts Filtering**: Blocks YouTube Shorts content when hideAllShorts is enabled

### **Whitelist Mode Features (v3.2.5)**

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
## Content-Based Filtering (v3.2.6)

### Overview

FilterTube v3.2.6 introduces three new content-based filters that analyze video metadata and titles to provide granular content control beyond channel and keyword blocking:

1. **Duration Filter** - Filter videos by length (longer/shorter/between)
2. **Upload Date Filter** - Filter videos by publish date (newer/older/between)
3. **Uppercase Filter** - Detect and filter clickbait-style ALL CAPS titles

### Duration Filter

**Purpose:** Hide videos based on their length to curate content that fits your viewing preferences.

**Conditions:**
- `longer` - Hide videos longer than specified duration
- `shorter` - Hide videos shorter than specified duration
- `between` - Hide videos outside the specified range (too short OR too long)

**Configuration:**

```javascript
contentFilters: {
    duration: {
        enabled: true,
        condition: 'between',  // 'longer' | 'shorter' | 'between'
        minMinutes: 5,         // Minimum duration (for 'longer' and 'between')
        maxMinutes: 20         // Maximum duration (for 'between' only)
    }
}
```

**Data Sources (Priority Order):**

1. **videoMetaMap Cache** - Persistent storage of extracted durations
   ```javascript
   videoMetaMap['dQw4w9WgXcQ'].lengthSeconds // 212
   ```

2. **Player Microformat** - From `ytInitialPlayerResponse`
   ```javascript
   microformat.playerMicroformatRenderer.lengthSeconds // "212"
   ```

3. **Video Details** - Fallback from player response
   ```javascript
   videoDetails.lengthSeconds // "212"
   ```

4. **DOM Overlays** - Thumbnail time badges
   ```javascript
   thumbnailOverlays[].thumbnailOverlayTimeStatusRenderer.text // "3:32"
   lengthText.simpleText // "1:38:14"
   ```

**Duration Parsing:**

```javascript
// Supports multiple formats
"3:32"      → 212 seconds
"1:38:14"   → 5894 seconds
"212"       → 212 seconds (numeric string)
212         → 212 seconds (number)
```

**Use Cases:**

- Hide long-form content (podcasts, lectures) when browsing casually
- Filter out short clips when looking for in-depth content
- Find videos in the "sweet spot" (e.g., 5-20 minutes for tutorials)

**Example Scenarios:**

```ascii
Condition: "between" (5-20 minutes)
┌───────────────────────────────────────────┐
│ Video A: 3 minutes   → HIDDEN (too short) │
│ Video B: 12 minutes  → SHOWN ✓            │
│ Video C: 45 minutes  → HIDDEN (too long)  │
│ Video D: 8 minutes   → SHOWN ✓            │
└───────────────────────────────────────────┘

Condition: "longer" (10 minutes)
┌─────────────────────────────────────────┐
│ Video A: 5 minutes   → SHOWN ✓          │
│ Video B: 15 minutes  → HIDDEN           │
│ Video C: 8 minutes   → SHOWN ✓          │
│ Video D: 30 minutes  → HIDDEN           │
└─────────────────────────────────────────┘
```

### Upload Date Filter

**Purpose:** Filter videos based on when they were published to focus on recent or archival content.

**Conditions:**
- `newer` - Hide videos published after specified date
- `older` - Hide videos published before specified date
- `between` - Hide videos outside the specified date range

**Configuration:**

```javascript
contentFilters: {
    uploadDate: {
        enabled: true,
        condition: 'newer',     // 'newer' | 'older' | 'between'
        fromDate: '2024-01-01', // ISO date string (YYYY-MM-DD)
        toDate: '2024-12-31'    // For 'between' only
    }
}
```

**Data Sources (Priority Order):**

1. **videoMetaMap Cache** - Persistent storage
   ```javascript
   videoMetaMap['dQw4w9WgXcQ'].publishDate   // "2009-10-25"
   videoMetaMap['dQw4w9WgXcQ'].uploadDate    // "2009-10-25T07:05:00Z"
   ```

2. **Player Microformat** - From `ytInitialPlayerResponse`
   ```javascript
   microformat.playerMicroformatRenderer.publishDate  // "2024-01-15"
   microformat.playerMicroformatRenderer.uploadDate   // "2024-01-15T10:30:00Z"
   ```

3. **DOM Text** - Relative time parsing
   ```javascript
   publishedTimeText.simpleText // "5 years ago"
   ```

**Relative Time Parsing:**

FilterTube parses relative time strings and converts them to approximate timestamps:

```javascript
"5 years ago"    → ~2019-02-04 (current date - 5 years)
"3 months ago"   → ~2023-11-04 (current date - 3 months)
"2 weeks ago"    → ~2024-01-21 (current date - 2 weeks)
"1 day ago"      → ~2024-02-03 (current date - 1 day)
```

**Approximation Logic:**

```javascript
const approximations = {
    year: 365.25 * 24 * 60 * 60 * 1000,
    month: 30.44 * 24 * 60 * 60 * 1000,  // Average month
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000
};

// "5 years ago" → Date.now() - (5 * approximations.year)
```

**Use Cases:**

- Hide old content when looking for current news/trends
- Filter out recent uploads when researching historical topics
- Focus on content from a specific time period (e.g., 2020-2022)

**Example Scenarios:**

```ascii
Condition: "older" (2023-01-01)
┌─────────────────────────────────────────┐
│ Video A: 2022-05-15  → HIDDEN           │
│ Video B: 2023-06-20  → SHOWN ✓          │
│ Video C: 2021-12-01  → HIDDEN           │
│ Video D: 2024-01-10  → SHOWN ✓          │
└─────────────────────────────────────────┘

Condition: "between" (2023-01-01 to 2023-12-31)
┌─────────────────────────────────────────┐
│ Video A: 2022-11-15  → HIDDEN (too old) │
│ Video B: 2023-06-20  → SHOWN ✓          │
│ Video C: 2024-02-01  → HIDDEN (too new) │
│ Video D: 2023-03-15  → SHOWN ✓          │
└─────────────────────────────────────────┘
```

### Uppercase Filter

**Purpose:** Detect and filter videos with ALL CAPS titles, commonly used in clickbait content.

**Modes:**
- `single_word` - Hide if ANY single word is all uppercase (e.g., "SHOCKING reveal")
- `all_words` - Hide if ALL words are uppercase (e.g., "SHOCKING REVEAL EXPOSED")
- `percentage` - Hide if percentage of uppercase characters exceeds threshold

**Configuration:**

```javascript
contentFilters: {
    uppercase: {
        enabled: true,
        mode: 'single_word',    // 'single_word' | 'all_words' | 'percentage'
        minWordLength: 2,       // Ignore short words (e.g., "A", "I")
        percentageThreshold: 50 // For 'percentage' mode only
    }
}
```

**Detection Logic:**

**Single Word Mode:**
```javascript
const words = title.split(/\s+/);
for (const word of words) {
    if (word.length < minWordLength) continue;
    if (word === word.toUpperCase() && /[A-Z]/.test(word)) {
        return true; // Hide video
    }
}
```

**All Words Mode:**
```javascript
const words = title.split(/\s+/).filter(w => w.length >= minWordLength);
const allCaps = words.every(w => w === w.toUpperCase() && /[A-Z]/.test(w));
return allCaps; // Hide if all words are uppercase
```

**Percentage Mode:**
```javascript
const totalChars = title.replace(/[^a-zA-Z]/g, '').length;
const uppercaseChars = title.replace(/[^A-Z]/g, '').length;
const percentage = (uppercaseChars / totalChars) * 100;
return percentage > percentageThreshold; // Hide if exceeds threshold
```

**Use Cases:**

- Filter clickbait content with sensationalized titles
- Remove videos with excessive capitalization
- Curate a feed with professional, well-formatted titles

**Example Scenarios:**

```ascii
Mode: "single_word" (minWordLength: 2)
┌─────────────────────────────────────────────────────────┐
│ "SHOCKING reveal about AI"        → HIDDEN (SHOCKING)   │
│ "Amazing AI breakthrough"         → SHOWN ✓             │
│ "I tried this CRAZY experiment"   → HIDDEN (CRAZY)      │
│ "The future of technology"        → SHOWN ✓             │
└─────────────────────────────────────────────────────────┘

Mode: "all_words"
┌─────────────────────────────────────────────────────────┐
│ "SHOCKING REVEAL ABOUT AI"        → HIDDEN (all caps)   │
│ "SHOCKING reveal about AI"        → SHOWN ✓ (mixed)     │
│ "THE ULTIMATE GUIDE"              → HIDDEN (all caps)   │
│ "The Ultimate Guide"              → SHOWN ✓             │
└─────────────────────────────────────────────────────────┘

Mode: "percentage" (threshold: 50%)
┌─────────────────────────────────────────────────────────┐
│ "SHOCKING AI NEWS"                → HIDDEN (100% caps)  │
│ "SHOCKING ai news"                → HIDDEN (67% caps)   │
│ "Shocking AI News"                → SHOWN ✓ (33% caps)  │
│ "shocking ai news"                → SHOWN ✓ (0% caps)   │
└─────────────────────────────────────────────────────────┘
```

### Combined Filtering

All three content filters work in conjunction with channel and keyword filters:

```ascii
Video Filtering Decision Tree
┌─────────────────────────────────────────┐
│ Video Card Detected                     │
└──────────────┬──────────────────────────┘
               │
               ├─→ Channel Filter → HIDE if blocked
               │
               ├─→ Keyword Filter → HIDE if matched
               │
               ├─→ Duration Filter → HIDE if outside range
               │
               ├─→ Upload Date Filter → HIDE if outside range
               │
               ├─→ Uppercase Filter → HIDE if detected
               │
               └─→ SHOW if all filters pass
```

**Example Combined Scenario:**

```javascript
// User Configuration
{
    blockedChannels: ['@ClickbaitChannel'],
    blockedKeywords: ['drama', 'exposed'],
    contentFilters: {
        duration: { enabled: true, condition: 'between', minMinutes: 5, maxMinutes: 20 },
        uploadDate: { enabled: true, condition: 'newer', fromDate: '2024-01-01' },
        uppercase: { enabled: true, mode: 'single_word', minWordLength: 2 }
    }
}

// Video Analysis
Video A: "@TechChannel" | "SHOCKING AI News" | 12 min | 2024-02-01
→ HIDDEN (uppercase filter: "SHOCKING")

Video B: "@ClickbaitChannel" | "Amazing discovery" | 10 min | 2024-02-01
→ HIDDEN (channel filter: blocked)

Video C: "@TechChannel" | "AI tutorial" | 3 min | 2024-02-01
→ HIDDEN (duration filter: too short)

Video D: "@TechChannel" | "AI tutorial" | 12 min | 2023-12-15
→ HIDDEN (upload date filter: too old)

Video E: "@TechChannel" | "AI tutorial" | 12 min | 2024-02-01
→ SHOWN ✓ (passes all filters)
```

### Category Filtering (v3.2.7)

**Purpose:** Filter videos based on YouTube's video category metadata to curate your feed by content type.

**Modes:**
- `blocklist` - Hide videos from specified categories (default: show everything except selected)
- `whitelist` - Only show videos from specified categories (default: hide everything except selected)

**Configuration:**

```javascript
contentFilters: {
    category: {
        enabled: true,
        mode: 'blocklist',     // 'blocklist' | 'whitelist'
        categories: ['Gaming', 'Music']  // Categories to block or allow
    }
}
```

**Supported YouTube Categories:**

| Category | Description |
|----------|-------------|
| Music | Music videos, albums, live performances |
| Gaming | Let's plays, walkthroughs, gaming news |
| Entertainment | TV clips, talk shows, variety content |
| Education | Tutorials, lectures, educational content |
| Science & Technology | Tech reviews, science explainers |
| News & Politics | Current events, political commentary |
| Sports | Sports highlights, analysis, fitness |
| Film & Animation | Short films, animations, trailers |
| People & Blogs | Vlogs, personal stories, lifestyle |
| Comedy | Sketches, stand-up, funny compilations |
| Howto & Style | DIY, fashion, beauty, cooking |
| Autos & Vehicles | Car reviews, motorsports |
| Travel & Events | Travel vlogs, event coverage |
| Pets & Animals | Pet videos, wildlife documentaries |
| Nonprofits & Activism | Charity, awareness campaigns |

**Data Sources:**

1. **videoMetaMap Cache** - Persistent storage with category field
   ```javascript
   videoMetaMap['dQw4w9WgXcQ'].category // "Music"
   ```

2. **Player Microformat** - From `ytInitialPlayerResponse`
   ```javascript
   microformat.playerMicroformatRenderer.category // "Music"
   ```

3. **Video Details** - Fallback from player response
   ```javascript
   videoDetails.category // "Music"
   ```

**Example Scenarios:**

```ascii
Mode: "blocklist" (blocking Gaming, Entertainment)
┌─────────────────────────────────────────────────────┐
│ Video A: Category "Gaming"        → HIDDEN          │
│ Video B: Category "Education"     → SHOWN ✓         │
│ Video C: Category "Entertainment" → HIDDEN          │
│ Video D: Category "Music"         → SHOWN ✓         │
└─────────────────────────────────────────────────────┘

Mode: "whitelist" (allowing only Education, Science & Technology)
┌─────────────────────────────────────────────────────┐
│ Video A: Category "Gaming"              → HIDDEN    │
│ Video B: Category "Education"           → SHOWN ✓   │
│ Video C: Category "Science & Technology"→ SHOWN ✓   │
│ Video D: Category "Music"               → HIDDEN    │
└─────────────────────────────────────────────────────┘
```

**Combined with Other Filters:**

Category filtering works alongside other content filters in the decision tree:

```ascii
Video Filtering Decision Tree (v3.2.7)
┌─────────────────────────────────────────┐
│ Video Card Detected                     │
└──────────────┬──────────────────────────┘
               │
               ├─→ Channel Filter → HIDE if blocked
               │
               ├─→ Keyword Filter → HIDE if matched
               │
               ├─→ Category Filter → HIDE if blocked/not whitelisted
               │
               ├─→ Duration Filter → HIDE if outside range
               │
               ├─→ Upload Date Filter → HIDE if outside range
               │
               ├─→ Uppercase Filter → HIDE if detected
               │
               └─→ SHOW if all filters pass
```

### Quick-Block Card Action (v3.2.7)

**Purpose:** Add a direct per-card block entry point without opening YouTube's 3-dot menu manually.

**Behavior:**
- Optional setting: `showQuickBlockButton` (on by default in v3.2.7; users can disable it).
- Shows a hover/touch button on supported cards.
- Single-tap direct action (no quick menu).
- Single-channel cards: blocks that channel immediately.
- Collaborator cards: blocks all channels associated with that card in one tap.
- Reuses the same blocking pipeline as injected menu actions, including collaborator handling and optimistic hide.
- Covers home, search, watch, playlist panel rows, mix/radio cards, and shorts cards.
- Comment-menu blocks are isolated from playlist/watch card hide logic to prevent unintended autoplay-next transitions.
- Hover retention is hardened for Search overlays and Home Shorts so the quick-block cross does not disappear mid-hover.

**YouTube Kids behavior:**
- Uses the same one-tap quick-block entry point.
- Persists blocked channels into the Kids channel blocklist (profile-aware save path).

## Dashboard Improvements (v3.2.6)

### Surface-Specific Stats Tracking

FilterTube now tracks statistics separately for YouTube Main and YouTube Kids:

**Data Structure:**

```javascript
statsBySurface: {
    main: {
        videosHiddenToday: 42,
        timeSavedToday: 7920000,  // milliseconds
        lastResetDate: '2024-02-04'
    },
    kids: {
        videosHiddenToday: 15,
        timeSavedToday: 2700000,
        lastResetDate: '2024-02-04'
    }
}
```

**Dashboard Toggle:**

Users can switch between Main and Kids stats views with toggle buttons:

```ascii
┌──────────────────────────────────────┐
│  📊 Statistics                       │
│  ────────────────────────────────────│
│                                      │
│  [ Main ] [ Kids ]  ← Toggle buttons │
│                                      │
│  ┌─────────────┐  ┌─────────────┐    │
│  │   Videos    │  │    Time     │    │
│  │   Hidden    │  │    Saved    │    │
│  │             │  │             │    │
│  │     42      │  │   2h 12m    │    │
│  └─────────────┘  └─────────────┘    │
└──────────────────────────────────────┘
```
