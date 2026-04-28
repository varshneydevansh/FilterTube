# 3-Dot Menu Improvements Documentation (v3.3.0)

## Overview

FilterTube v3.2.1 introduced the main 3-dot menu improvement pass across YouTube Main and YouTube Kids. The current v3.3.0 state extends that behavior across watch-page SPA rows, YTM and YTD watch-like lockups, Mix-like playlist rows, and the custom fallback 3-dot popover so channel names and block actions stay reliable even when row identity starts weak.

## Problem Statement

Prior to v3.2.1, users experienced:
1. **UC IDs displayed**: 3-dot menu showed `UCxxxxxxxx...` instead of human-readable channel names
2. **Mix titles as channel names**: Mix/playlist cards showed video titles instead of actual channel names
3. **Metadata strings as names**: Watch right-pane showed strings like "Title • 1.2M views • 2 days ago"
4. **Inconsistent behavior**: Different surfaces (Shorts, Mix, Watch) had varying levels of name resolution

## v3.3.0 Follow-Up Additions

The newer watch-page SPA and custom fallback work tightened a few behaviors that were not part of the original v3.2.1 pass:

1. **Watch-page collaborator recovery**: Collaboration rows like `Shakira and 2 more` now upgrade from the authoritative watch-page collaborator sheet instead of getting stuck on one visible name.
2. **Fallback 3-dot watch recovery**: When a watch-page Mix / playlist row does not expose a stable owner directly, the custom fallback popover now falls back to `watch:VIDEO_ID` recovery the same way quick-cross does.
3. **Title-like names can be repaired**: If the fallback 3-dot path initially stores a weak title-like label for a UC ID, post-block enrichment can now replace it with the fetched channel-page name.
4. **`Filter All` is selection, not action**: Inside the custom fallback popover, toggling `Filter All` no longer triggers the block immediately. Only the actual `Block • Channel` row is the action.
5. **Pressed/open feedback exists on the fallback path**: The custom fallback launcher and row now have focus/open/pressed states so the UI acknowledges the click before the menu closes.
6. **Active-menu collaboration refresh**: If the menu opens before the full collaborator roster is available, the active menu can now refresh in place when the authoritative roster arrives.
7. **Desktop watch-right-rail collaboration warm-up**: `yt-lockup-view-model` watch cards can start from byline hints and upgrade into a full collaborator menu once Main World returns the roster.
8. **False-positive collab guards**: Plain names like `Paura & Profitto` are no longer treated as collaborations just because the text contains `&` or `and`.
9. **Optional menu injection**: Users can now disable FilterTube's injected 3-dot menu entry while keeping Quick Block available.
10. **Authoritative collaborator sheets**: A YouTube JSON sheet whose header is `Collaborators` now outranks avatar-stack/direct-list fallback candidates for the same video.
11. **Composite fallback pruning**: Weak name-only rows such as `Daddy Yankee Bizarrap` are removed when they are only a composite of two real collaborator labels.
12. **Mix container hardening**: `radioRenderer` / `compactRadioRenderer`, RD playlist IDs, Mix overlay badges, and `Mix -` / `Mix –` / `Mix —` titles block collaboration promotion for the Mix container itself.

## Current Surface Guarantees

- **Watch right rail**: collaboration lockups can recover full collaborator rosters from watch-page dialog/sheet data and show all channels in the 3-dot UI.
- **Watch playlist and Mix rows**: weak owner identity can still be upgraded from `watch:VIDEO_ID` recovery and roster enrichment.
- **YTM watch-like rows**: mobile watch-list rows use the same collaborator warm-up path instead of waiting for a perfect initial DOM snapshot.
- **Mix cards with collaboration seed videos**: when the underlying video is a real collaboration, the 3-dot menu can now recover the collaborators from watch/main-world data instead of stopping at the visible uploader.
- **Single-channel names with separators**: plain names containing `&` or `and` do not become fake collaboration menus unless explicit collaborator evidence exists.
- **Authoritative roster precedence**: when `shortBylineText.runs[0].navigationEndpoint.showSheetCommand...sheetViewModel.header...title.content` is `Collaborators`, that list is the source of truth; fallback sources can fill missing fields but cannot invent extra collaborator rows.
- **Composite row guard**: a fallback-only entry with no UC ID, handle, or custom URL is dropped if its normalized name is fully covered by two other collaborator labels.

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
                      ### Mix Card Channel Extraction (v3.2.1)

FilterTube v3.2.1 includes sophisticated Mix card handling that extracts channel identity from YouTube's Mix/playlist collection surfaces.

```javascript
// In content_bridge.js - specialized Mix card extraction
function extractChannelFromCard(card) {
    // SPECIAL CASE: Mix cards (collection stacks / "My Mix")
    const isMixCard = isMixCardElement(card);
    if (isMixCard) {
        const deriveMixName = () => {
            const nameEl = card.querySelector(
                '#channel-info ytd-channel-name a, ' +
                '#channel-name #text a, ' +
                'ytd-channel-name #text a'
            );
            const candidate = nameEl?.textContent?.trim() || '';
            if (!candidate) return '';
            const lower = candidate.toLowerCase();
            if (lower.startsWith('mix') || lower.startsWith('my mix')) return '';
            if (lower.includes('mix') && candidate.includes('–')) return '';
            return candidate;
        };

        // Extract from stamped attributes first
        let id = card.getAttribute('data-filtertube-channel-id') || '';
        let handle = card.getAttribute('data-filtertube-channel-handle') || '';
        let customUrl = card.getAttribute('data-filtertube-channel-custom') || '';

        // Fallback to DOM data extraction
        if ((!id || !handle || !customUrl) && typeof scanDataForChannelIdentifiers === 'function') {
            const candidates = [
                card.data,
                card.data?.content,
                card.data?.content?.lockupViewModel,
                card.__data,
                card.__data?.data,
                card.__data?.data?.content,
                card.__data?.data?.content?.lockupViewModel
            ];
            for (const candidate of candidates) {
                if (!candidate) continue;
                const parsed = scanDataForChannelIdentifiers(candidate);
                if (parsed?.id && !id) id = parsed.id;
                if (parsed?.handle && !handle) handle = normalizeHandleValue(parsed.handle);
                if (parsed?.customUrl && !customUrl) customUrl = parsed.customUrl;
                if (id || handle || customUrl) break;
            }
        }

        // Extract from channel links
        if (!id || !handle || !customUrl) {
            const link = card.querySelector('a[href*="/channel/UC"], a[href*="/@"], a[href*="/c/"], a[href*="/user/"]');
            const href = link?.getAttribute('href') || '';
            if (href) {
                if (!handle) {
                    const extracted = extractRawHandle(href);
                    if (extracted) handle = normalizeHandleValue(extracted);
                }
                if (!id) {
                    const ucMatch = href.match(/\/(UC[\w-]{22})/);
                    if (ucMatch) id = ucMatch[1];
                }
                if (!customUrl) {
                    const match = href.match(/\/(c|user)\/([^/?#]+)/);
                    if (match && match[1] && match[2]) {
                        try {
                            customUrl = `${match[1]}/${decodeURIComponent(match[2])}`;
                        } catch (_) {
                            customUrl = `${match[1]}/${match[2]}`;
                        }
                    }
                }
            }
        }

        if (id || handle || customUrl) {
            let name = deriveMixName();
            if (!name) {
                const stamped = card.getAttribute('data-filtertube-channel-name') || '';
                if (stamped && !stamped.includes('•')) {
                    name = stamped;
                }
            }
            return { id: id || '', handle: handle || '', customUrl: customUrl || '', name: name || '', logo: extractAvatarUrl() || '' };
        }
    }
}
```

**Mix card features:**
- **Smart name derivation** - filters out "Mix" and "My Mix" prefixes
- **Multi-source extraction** - stamped attributes, DOM data, channel links
- **CustomUrl support** - handles /c/ and /user/ channel types
- **Fallback hierarchy** - tries multiple extraction methods

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

// Method 1.5: videoChannelMap (preferred when available)
// Many Shorts/video surfaces can be resolved instantly after FilterTube learns
// videoId -> UC... from intercepted YouTube JSON (ytInitialPlayerResponse and
// /youtubei/v1/player) and persists it.

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

#### Collaboration Roster Precedence
```javascript
// Simplified current rule
const header = sheetViewModel?.header?.panelHeaderViewModel?.title?.content;
if (/^Collaborators$/i.test(header || '')) {
    // Authoritative roster: outranks avatar/direct-list fallback candidates.
    return markCollaboratorListSource(listItems, 'collaborators-sheet');
}

// Fallback lists are sanitized before use:
// - remove "and N more" placeholders
// - remove composite name-only rows covered by two real labels
// - collapse expected count when a pruned composite inflated the count
```

Example:

```text
Raw fallback:
  Bizarrap
  Daddy Yankee Bizarrap
  Daddy Yankee

Sanitized roster:
  Bizarrap
  Daddy Yankee
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

The same enrichment model now also covers:

- watch-page collaborator rosters that need main-world sheet/dialog recovery
- weak watch-page Mix / playlist rows that escalate to `watch:VIDEO_ID`
- post-block repair of title-like provisional names when the same UC ID later resolves to a stronger fetched channel-page name

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
- **Watch-page recovery**: If a watch-page Mix / playlist row still lacks stable owner identity, allow `watch:VIDEO_ID` recovery instead of giving up
- **Repair path**: If the row was blocked through fallback metadata first, later enrichment may upgrade the stored label from title-like text to the fetched channel-page name

### Watch Page Sidebar
- **Playlist Items**: Extract from channel links, ignore metadata
- **Autoplay Queue**: Same extraction logic as playlist
- **Persistence**: Use videoChannelMap for navigation resilience
- **Collaborations**: If the row signals a hidden collaborator roster, the menu can escalate to the main-world collaborator sheet instead of finalizing a partial single-channel result

### Fallback Strategy

Current fallback order on weak watch-page rows:

1. stable `UC ID`
2. `customUrl`
3. `@handle`
4. `watch:VIDEO_ID`

Guardrails:

- Mix title/byline text is not canonical owner identity
- collapsed labels like `A and 2 more` are not canonical collaborator rosters
- `Filter All` in the custom fallback popover is selection-only until the real block row is activated

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

### 5. Watch-Page Mix / Fallback Popover
1. Open a watch page with playlist / Mix-like rows.
2. Trigger the custom fallback 3-dot popover on a row with weak owner identity.
3. **Expected**: `Filter All` can be toggled without triggering the block immediately.
4. **Expected**: Clicking the real `Block • Channel` row shows visible pressed feedback before the menu closes.
5. **Expected**: If the row only exposes video-level metadata at first, owner recovery can still succeed through `watch:VIDEO_ID`.
6. **Expected**: A weak title-like stored name can later be repaired by post-block enrichment for the same UC ID.

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

Users upgrading to v3.2.1 will see:
- Immediate improvement in Mix/playlist label accuracy
- Better Shorts channel name resolution
- More consistent behavior across all surfaces
- Zero-delay blocking thanks to proactive XHR interception
- No breaking changes to existing blocks

Users on the later v3.2.8-era follow-up path also get:

- watch-page SPA collaborator recovery for hidden-roster rows
- fallback 3-dot recovery aligned with quick-cross on weak watch-page Mix rows
- non-destructive `Filter All` selection in the custom fallback popover
- better fallback-row interaction feedback
- post-block repair of weak title-like names for the same UC ID

### Data Compatibility

- All existing channel blocks remain valid
- No migration required for stored data
- Enhanced extraction works with legacy data
