# 3-Dot Menu Improvements Documentation

## Overview

FilterTube v3.1.6 significantly improves the 3-dot menu experience across YouTube Main and YouTube Kids, ensuring accurate channel names are displayed and blocking actions work reliably for Shorts, Mixes, Playlists, and Watch page videos.

## Problem Statement

Prior to v3.1.6, users experienced:
1. **UC IDs displayed**: 3-dot menu showed `UCxxxxxxxx...` instead of human-readable channel names
2. **Mix titles as channel names**: Mix/playlist cards showed video titles instead of actual channel names
3. **Metadata strings as names**: Watch right-pane showed strings like "Title • 1.2M views • 2 days ago"
4. **Inconsistent behavior**: Different surfaces (Shorts, Mix, Watch) had varying levels of name resolution

## Solution Architecture

### Multi-Layer Name Resolution

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DOM Extract   │───▶│  Initial Label   │───▶│  Background     │
│   (Fast Path)   │    │  Display         │    │  Enrichment     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Label Update    │
                       │  (Upgrade Rule)  │
                       └──────────────────┘
```

### Placeholder Detection System

Enhanced logic identifies and upgrades placeholder values:

```javascript
// Detect various placeholder patterns
const isUcIdLike = (value) => /^UC[a-zA-Z0-9_-]{22}$/.test(value.trim());

const isProbablyNotChannelName = (value) => {
    if (!value || typeof value !== 'string') return true;
    const trimmed = value.trim();
    if (!trimmed) return true;
    if (isUcIdLike(trimmed)) return true;
    if (trimmed.includes('•')) return true;    // Metadata separator
    if (/\bviews?\b/i.test(trimmed)) return true;  // View count
    if (/\bago\b/i.test(trimmed)) return true;     // Time ago
    if (/\bwatching\b/i.test(trimmed)) return true;  // Watching count
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('mix')) return true;
    if (lower.includes('mix') && trimmed.includes('–')) return true;
    return false;
};
```

## Implementation Details

### 1. Enhanced Channel Name Extraction

#### Shorts Cards
```javascript
// Method 1: Data attributes (preferred)
const dataHandle = card.getAttribute('data-filtertube-channel-handle');
const dataId = card.getAttribute('data-filtertube-channel-id');

// Method 2: Channel links in metadata
const shortsChannelLink = card.querySelector(
    'a[href*="/@"]:not([href*="/shorts"]):not([href*="/watch"]), ' +
    'ytm-shorts-lockup-view-model a[href*="/@"], ' +
    '.shortsLockupViewModelHostOutsideMetadata a[href*="/@"]'
);

// Method 3: Network fetch (last resort)
if (shortsLink) {
    const videoIdMatch = href?.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
        return { videoId: videoIdMatch[1], needsFetch: true };
    }
}
```

#### Mix/Playlist Cards
```javascript
// Detect Mix cards to avoid title extraction
function isMixCardElement(element) {
    const root = findVideoCardElement(element) || element;
    
    // Check URL patterns
    const href = root.querySelector('a[href*="list=RDMM"], a[href*="start_radio=1"]')?.href || '';
    if (href && (href.includes('list=RDMM') || href.includes('start_radio=1'))) {
        return true;
    }
    
    // Check badge text
    const badgeText = root.querySelector('yt-thumbnail-overlay-badge-view-model badge-shape .yt-badge-shape__text')?.textContent?.trim() || '';
    return badgeText.toLowerCase() === 'mix';
}

// Extract actual channel (not video title)
if (isMixCardElement(card)) {
    // Skip title extraction, go straight to channel links
    const channelLink = card.querySelector('a[href*="/@"], a[href*="/channel/"]');
    if (channelLink) {
        const href = channelLink.getAttribute('href');
        const name = channelLink.textContent?.trim();
        return extractChannelInfoFromLink(href, name);
    }
}
```

#### Watch Page Right Pane
```javascript
// Extract from playlist items without grabbing metadata
function extractFromPlaylistItem(item) {
    // Get actual channel link, not metadata text
    const channelLink = item.querySelector('a[href*="/@"], a[href*="/channel/"]');
    if (channelLink) {
        return {
            handle: extractRawHandle(channelLink.href),
            name: channelLink.textContent?.trim()
        };
    }
    
    // Fallback to data attributes
    const dataHandle = item.getAttribute('data-filtertube-channel-handle');
    if (dataHandle) {
        return { handle: dataHandle };
    }
}
```

### 2. Background Enrichment Pipeline

```javascript
// Async enrichment after menu injection
const fetchPromise = (async () => {
    let enrichedInfo = finalChannelInfo;
    
    // Determine if name enrichment is needed
    const needsNameEnrichment = !enrichedInfo?.name || 
        isHandleLike(enrichedInfo.name) || 
        isProbablyNotChannelName(enrichedInfo.name);
    
    if (needsNameEnrichment && lookup) {
        try {
            // Fetch channel details
            const details = await browserAPI_BRIDGE.runtime.sendMessage({
                action: 'fetchChannelDetails',
                channelIdOrHandle: lookup
            });
            
            if (details && details.success) {
                enrichedInfo = { ...enrichedInfo, ...details };
            }
        } catch (e) {
            console.warn('Channel details fetch failed:', e);
        }
    }
    
    return enrichedInfo;
})();

// Update menu label when enrichment completes
fetchPromise.then(finalChannelInfo => {
    if (!finalChannelInfo || pendingDropdownFetches.get(dropdown)?.cancelled) return;
    updateInjectedMenuChannelName(dropdown, finalChannelInfo);
});
```

### 3. Label Update Logic

```javascript
function updateInjectedMenuChannelName(dropdown, channelInfo) {
    const menuItem = dropdown.querySelector('.filtertube-block-channel-item');
    const nameEl = menuItem?.querySelector('.filtertube-channel-name');
    if (!nameEl) return;

    const current = (nameEl.textContent || '').trim();
    const next = pickMenuChannelDisplayName(channelInfo, {}) || '';
    if (!next) return;

    // Avoid thrashing if already up to date
    if (current === next) return;

    // Upgrade placeholders to real names
    if (isHandleLike(current) && !isHandleLike(next)) {
        nameEl.textContent = next;
        return;
    }

    if (isUcIdLike(current) || isProbablyNotChannelName(current)) {
        nameEl.textContent = next;
        return;
    }
}
```

## Surface-Specific Behavior

### Shorts Shelf/Grid
- **Initial**: Show `@handle` or `UC...` from DOM
- **Enrichment**: Fetch from `/shorts/<videoId>` if needed
- **Final**: Display human-readable channel name

### Mix/Playlist Shelves
- **Detection**: Identify Mix cards by URL/badge patterns
- **Extraction**: Never use video title; extract from channel links
- **Fallback**: Use avatar alt text or data attributes

### Watch Page Sidebar
- **Playlist Items**: Extract from channel links, ignore metadata
- **Autoplay Queue**: Same extraction logic as playlist
- **Persistence**: Use videoChannelMap for navigation resilience

### Channel Pages
- **Header**: Extract from channel name in header
- **Video Grid**: Use data attributes set by FilterTube
- **Consistency**: Ensure all cards show same channel info

## Performance Optimizations

### 1. Selective Fetching

Only fetch when necessary:
```javascript
// Check if enrichment is actually needed
const needsNameEnrichment = !channelInfo.name || 
    isHandleLike(channelInfo.name) || 
    isProbablyNotChannelName(channelInfo.name);

if (needsNameEnrichment && channelInfo.id) {
    // Fetch channel details
    const details = await fetchChannelDetails(channelInfo.id);
}
```

### 2. Caching Strategy

```javascript
// Cache resolved channel details
const channelDetailsCache = new Map();

function getCachedChannelDetails(identifier) {
    const cached = channelDetailsCache.get(identifier);
    if (cached && Date.now() - cached.cachedAt < 300000) { // 5 minutes
        return cached.details;
    }
    return null;
}
```

### 3. Debounced Updates

Label updates are debounced to prevent thrashing:
```javascript
let labelUpdateTimer = null;

function scheduleLabelUpdate(dropdown, channelInfo) {
    if (labelUpdateTimer) {
        clearTimeout(labelUpdateTimer);
    }
    
    labelUpdateTimer = setTimeout(() => {
        updateInjectedMenuChannelName(dropdown, channelInfo);
        labelUpdateTimer = null;
    }, 100);
}
```

## Error Handling

### Network Failures

```
Label Update Flow
├── DOM Extraction (always succeeds)
├── Background Fetch (may fail)
│   ├── Timeout: 5 seconds
│   ├── 404: Channel not found
│   └── CORS: Cross-origin blocked
├── Fallback to ytInitialData
└── Display Best Available Name
```

### Fallback Strategy

1. **Use original DOM info** (handle, name from card)
2. **Try network fetch** for complete details
3. **Extract from ytInitialData** if on watch page
4. **Display identifier** (UC ID or handle) if all else fails

## Testing Scenarios

### 1. Shorts Video
1. Open Shorts shelf on YouTube Main
2. Click 3-dot on any Short
3. **Expected**: Initially shows `@handle` or `UC...`
4. **Expected**: After 1-2 seconds, updates to channel name
5. **Verify**: Block action works with correct channel name

### 2. Mix Playlist
1. Open "Mix - Artist Name" shelf
2. Click 3-dot on Mix item
3. **Expected**: Shows actual channel name (not "Mix - ...")
4. **Expected**: Block action blocks correct channel
5. **Verify**: Other videos from same channel are hidden

### 3. Watch Page Sidebar
1. Open any video with active playlist
2. Click 3-dot on playlist item
3. **Expected**: Shows channel name (not "Title • views • ago")
4. **Expected**: Navigation preserves hidden state
5. **Verify**: Multiple playlist items from same channel hide

### 4. Channel Name Variations
Test with various channel name formats:
- **Unicode characters**: ñ, é, ü
- **Special characters**: _, -, .
- **Long names**: > 50 characters
- **Similar handles**: @channel123 vs @channel124

## Debugging Tools

### Console Logging

```javascript
// Channel extraction logging
console.log('FilterTube: Extracted channel info:', {
    source: 'dom',
    handle: extracted.handle,
    name: extracted.name,
    cardType: getCardType(card)
});

// Enrichment logging
console.log('FilterTube: Channel enrichment needed:', {
    videoId: channelInfo.videoId,
    currentName: channelInfo.name,
    needsFetch: true
});

// Label update logging
console.log('FilterTube: Updated menu label:', {
    from: current,
    to: next,
    reason: getUpdateReason(current, next)
});
```

### Performance Metrics

Track label resolution performance:
- **DOM extraction time**: < 5ms
- **Network fetch time**: < 2000ms (95th percentile)
- **Label update time**: < 10ms
- **Cache hit rate**: > 80% for repeated channels

## Future Enhancements

### Planned Improvements

1. **Predictive Caching**
   - Pre-fetch channel details for visible videos
   - Warm cache on page load

2. **Enhanced Mix Detection**
   - Better regex for Mix variations
   - Support for "Start Radio" mixes

3. **Cross-Surface Consistency**
   - Unified extraction logic
   - Shared caching across surfaces

4. **User Feedback**
   - Indicate when label is being resolved
   - Show loading state in menu

## Migration Notes

### From Previous Versions

Users upgrading to v3.1.6 will see:
- Immediate improvement in Mix/playlist label accuracy
- Better Shorts channel name resolution
- More consistent behavior across all surfaces
- No breaking changes to existing blocks

### Data Compatibility

- All existing channel blocks remain valid
- No migration required for stored data
- Enhanced extraction works with legacy data
