# Developer Guide (v3.2.5)

## Overview

This guide helps developers understand and extend FilterTube's proactive channel identity system and whitelist mode functionality. It covers how to add support for new YouTube endpoints, renderer types, collaboration patterns, and dual filtering modes.

## Core Concepts

### Execution Worlds

- **Main World** (`js/seed.js`, `js/filter_logic.js`, `js/injector.js`): Page context, can access `window.ytInitialData`

- **Isolated World** (`js/content/*`, `js/content_bridge.js`): Content scripts, can access DOM

- **Background** (`js/background.js`): Extension service worker, handles persistence and network

### Filtering Modes (v3.2.5)

- **Blocklist Mode**: Traditional filtering - hide matching content

- **Whitelist Mode**: Inverted filtering - show only matching content

### Proactive Pipeline

1. XHR interception → JSON snapshots

2. Channel extraction from snapshots

3. Mode-aware filtering logic

4. Cross-world messaging

5. DOM stamping

6. Instant UI updates

## Adding Support for New XHR Endpoints

When YouTube introduces new API endpoints, you'll want to add them to the snapshot stashing system.

### Step 1: Update `stashNetworkSnapshot` in `seed.js`

```javascript
function stashNetworkSnapshot(data, dataName) {
    try {
        if (!window.filterTube) return;
        if (!data || typeof data !== 'object') return;
        const name = typeof dataName === 'string' ? dataName : '';
        if (!name) return;

        const ts = Date.now();
        
        // Add new endpoint here
        if (name.includes('/youtubei/v1/reel')) {
            window.filterTube.lastYtReelResponse = data;
            window.filterTube.lastYtReelResponseName = name;
            window.filterTube.lastYtReelResponseTs = ts;
            return;
        }
        
        // Existing endpoints
        if (name.includes('/youtubei/v1/next')) {
            window.filterTube.lastYtNextResponse = data;
            window.filterTube.lastYtNextResponseName = name;
            window.filterTube.lastYtNextResponseTs = ts;
            return;
        }
        // ... other endpoints
    } catch (e) {
        // Ignore errors
    }
}
```

### Step 2: Update Search Targets in `injector.js`

```javascript
function searchCollaboratorsInData(videoId) {
    const roots = [];
    
    // Add new snapshot to search targets
    if (window.filterTube?.lastYtReelResponse) {
        roots.push({ root: window.filterTube.lastYtReelResponse, label: 'filterTube.lastYtReelResponse' });
    }
    
    // Continue with existing logic...
}
```

### Step 3: Test the New Endpoint

1. Open YouTube and trigger the new endpoint
2. Check console for "Stashing network snapshot" messages
3. Verify the snapshot is stored in `window.filterTube`
4. Test channel extraction from the snapshot

## Adding Support for New Renderer Types

YouTube frequently introduces new renderer types. Here's how to add support:

### Step 1: Identify the Renderer Structure

Use the browser dev tools to inspect the JSON structure:

```javascript
// In console on a YouTube page
console.log(window.filterTube.lastYtNextResponse);
```

Look for patterns like:
- `newRendererType`
- `videoId` or `contentId`
- `browseEndpoint.browseId` (UC ID)
- `canonicalBaseUrl` (handle/customUrl)

### Step 2: Update `_extractChannelInfo` in `filter_logic.js`

```javascript
_extractChannelInfo(item, rules) {
    const channelInfo = { name: '', id: '', handle: '', customUrl: '' };
    
    // Add new renderer type
    if (item.newRendererType) {
        const renderer = item.newRendererType;
        
        // Extract video ID
        if (renderer.videoId) {
            // Extract channel info
            const endpoint = renderer.channelEndpoint?.browseEndpoint;
            if (endpoint?.browseId) {
                channelInfo.id = endpoint.browseId;
            }
            if (endpoint?.canonicalBaseUrl) {
                channelInfo.handle = normalizeChannelHandle(endpoint.canonicalBaseUrl);
                channelInfo.customUrl = extractCustomUrlFromCanonicalBaseUrl(endpoint.canonicalBaseUrl);
            }
            channelInfo.name = renderer.channelTitle?.simpleText || '';
            
            // Register mappings
            if (channelInfo.id && channelInfo.handle) {
                this._registerMapping(channelInfo.id, channelInfo.handle);
            }
            if (channelInfo.id && channelInfo.customUrl) {
                this._registerCustomUrlMapping(channelInfo.id, channelInfo.customUrl);
            }
            
            return channelInfo;
        }
    }
    
    // Continue with existing logic...
}
```

### Step 3: Add Video Channel Mapping

```javascript
// In the same function, register video → channel mapping
if (item.newRendererType?.videoId && channelInfo.id) {
    this._registerVideoChannelMapping(item.newRendererType.videoId, channelInfo.id);
}
```

### Step 4: Test the New Renderer

1. Find a page that uses the new renderer
2. Open FilterTube dev tools
3. Look for extraction logs
4. Verify the channel appears correctly in the 3-dot menu

## Extending Collaboration Detection

### Adding New Collaboration Patterns

YouTube may introduce new ways to represent collaborations:

#### 1. Avatar Stack Variations

```javascript
// In filter_logic.js or injector.js
function extractCollaboratorsFromDataObject(obj) {
    // Add new avatar stack pattern
    if (obj.newAvatarStackType) {
        const collaborators = [];
        for (const avatar of obj.newAvatarStackType.avatars) {
            const collab = {
                id: avatar.channelEndpoint?.browseId,
                handle: extractHandle(avatar.channelEndpoint?.canonicalBaseUrl),
                name: avatar.title
            };
            collaborators.push(collab);
        }
        return collaborators.length > 1 ? collaborators : null;
    }
    
    // Continue with existing logic...
}
```

#### 2. Dialog Command Variations

```javascript
// Add new dialog pattern
if (obj.newShowDialogCommand) {
    const listItems = obj.newShowDialogCommand.panel?.listItems;
    if (listItems) {
        // Extract collaborators from new structure
        return extractCollaboratorsFromListItems(listItems);
    }
}
```

### Testing Collaborations

1. Find a collaboration video using the new pattern
2. Open the 3-dot menu
3. Verify all collaborators appear
4. Test blocking individual collaborators

## DOM Extraction Extensions

When XHR interception doesn't provide enough data, you may need to improve DOM extraction:

### Adding New Card Selectors

```javascript
// In content_bridge.js
function extractChannelFromCard(card) {
    // Add new card type
    if (card.tagName.toLowerCase() === 'ytd-new-video-renderer') {
        const link = card.querySelector('a[href*="/channel/"], a[href*="/@"]');
        if (link) {
            const href = link.getAttribute('href');
            return {
                id: extractChannelIdFromPath(href),
                handle: extractRawHandle(href),
                name: card.querySelector('.channel-name')?.textContent?.trim()
            };
        }
    }
    
    // Continue with existing logic...
}
```

### Improving Name Extraction

```javascript
// Add better name extraction for specific surfaces
if (card.matches('.special-surface')) {
    // Use specific selector for this surface
    const nameEl = card.querySelector('.specific-name-selector');
    if (nameEl) {
        return { name: nameEl.textContent.trim() };
    }
}
```

## Debugging Tools

### Console Commands

```javascript
// Check available snapshots
console.log('Available snapshots:', {
    next: window.filterTube?.lastYtNextResponse,
    browse: window.filterTube?.lastYtBrowseResponse,
    player: window.filterTube?.lastYtPlayerResponse
});

// Search for a video in snapshots
function findVideo(videoId) {
    const snapshots = [
        window.filterTube?.lastYtNextResponse,
        window.filterTube?.lastYtBrowseResponse,
        window.filterTube?.lastYtPlayerResponse
    ];
    
    for (const snapshot of snapshots) {
        if (snapshot && JSON.stringify(snapshot).includes(videoId)) {
            console.log('Found in snapshot:', snapshot);
            return snapshot;
        }
    }
}
```

### Debug Flags

Enable debug logging by setting in console:

```javascript
window.filterTubeDebug = true;
```

This enables verbose logging in:
- Channel extraction
- Collaboration detection
- Cross-world messaging

## Testing Guidelines

### Unit Testing Concepts

1. **Channel Extraction**: Test with various JSON structures
2. **Handle Normalization**: Test unicode and percent-encoded handles
3. **Collaboration Detection**: Test different collaboration patterns
4. **Cross-world Messaging**: Test message passing between worlds

### Integration Testing

1. **Surface Coverage**: Test all YouTube surfaces (Home, Search, Watch, Shorts)
2. **Network Conditions**: Test with slow/failed network
3. **Kids Mode**: Test zero-network behavior
4. **Edge Cases**: Test empty data, malformed JSON

### Regression Testing

1. **Existing Functionality**: Ensure old surfaces still work
2. **Performance**: Verify no performance regressions
3. **Memory Usage**: Check for memory leaks in snapshot storage

## Common Pitfalls

### 1. Forgetting to Register Mappings

Always register mappings when you extract channel info:

```javascript
// Don't forget this!
if (channelInfo.id && channelInfo.handle) {
    this._registerMapping(channelInfo.id, channelInfo.handle);
}
```

### 2. Not Handling Kids Mode

Remember to skip network fetches on Kids:

```javascript
if (isKidsHost) {
    // Use only XHR data, no network fetches
    return extractFromSnapshots(videoId);
}
```

### 3. Missing Null Checks

Always validate data structure:

```javascript
if (!item?.newRendererType?.videoId) {
    return null; // or continue with next pattern
}
```

### 4. Ignoring Unicode Handles

Ensure handle extraction supports unicode:

```javascript
function normalizeHandle(handle) {
    if (!handle) return '';
    // Decode percent encoding
    return decodeURIComponent(handle);
}
```

## Performance Considerations

### Snapshot Management

- Snapshots are stored in memory, consider size limits
- Clear old snapshots periodically if needed
- Use WeakMap for temporary storage

### Message Passing

- Batch multiple updates in a single message
- Avoid sending duplicate data
- Use request IDs for request/response patterns

### DOM Operations

- Use document fragments for bulk DOM changes
- Debounce rapid DOM updates
- Avoid layout thrashing

## Security Notes

### Data Validation

Always validate external data:

```javascript
function validateChannelInfo(info) {
    return {
        id: typeof info.id === 'string' && info.id.startsWith('UC') ? info.id : '',
        handle: typeof info.handle === 'string' ? info.handle.slice(0, 100) : '',
        name: typeof info.name === 'string' ? info.name.slice(0, 200) : ''
    };
}
```

### Message Sanitization

Sanitize cross-world messages:

```javascript
function sanitizeMessage(message) {
    // Validate message structure
    if (!message.type || typeof message.type !== 'string') return null;
    
    // Validate payload based on type
    switch (message.type) {
        case 'FilterTube_UpdateChannelMap':
            return validateChannelMap(message.payload);
        // ... other cases
    }
}
```

## Contributing

### Code Style

- Follow existing code style
- Add JSDoc comments for new functions
- Use TypeScript-style JSDoc for better IDE support

### Documentation

- Update this guide when adding new patterns
- Add examples for new renderer types
- Document any breaking changes

### Testing

- Add unit tests for new extraction logic
- Test on multiple YouTube surfaces
- Verify Kids mode compatibility

## Resources

### Internal Documentation
- [Channel Blocking System](CHANNEL_BLOCKING_SYSTEM.md)
- [Proactive Channel Identity](PROACTIVE_CHANNEL_IDENTITY.md)
- [Architecture](ARCHITECTURE.md)

### External References
- YouTube Data API documentation
- Chrome Extension API docs
- JavaScript extension best practices
