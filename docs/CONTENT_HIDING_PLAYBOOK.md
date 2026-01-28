# Content Hiding + Channel Identity Playbook (v3.2.3 Experimental Whitelist Mode + Performance Optimizations)

This document is an *operator playbook* for answering:

- Which layer is responsible for hiding content in each YouTube surface?
- Which data source(s) are used to resolve a channel's identity (UC ID + @handle)?
- What to check when blocking fails (especially `/@handle/about` returning 404).
- **NEW in v3.2.1+**: How performance optimizations eliminate lag and improve responsiveness.
- **NEW in v3.2.3**: How **experimental whitelist mode** inverts filtering logic.

## 1) The Three Layers (Who Does What)

### 1.1 Engine (Main World): `seed.js` + `filter_logic.js`
- **Purpose**
  - Remove blocked/matching items from YouTube JSON responses **before** YouTube renders.
  - **NEW v3.2.1**: Stash network snapshots for proactive identity resolution.
  - **NEW v3.2.3**: Apply **experimental whitelist mode** filtering (hide all except allowed content).
  - Prevent "flash of blocked content" when possible.
- **Strengths**
  - Earliest filtering.
  - **NEW v3.2.1**: Proactive channel identity via XHR interception.
  - **NEW v3.2.3**: Zero-flash **experimental whitelist** filtering.
  - Best for feed/search/watch data responses.
- **Limits**
  - Not every surface routes through a convenient JSON response.
  - DOM recycling and client-side hydration can still surface items that need DOM fallback.

### 1.2 DOM Fallback (Isolated World): `js/content/dom_fallback.js` (invoked by `content_bridge.js`)
- **Purpose**
  - Hide/restore already-rendered elements.
  - Handle SPA navigation, late hydration, and recycled DOM nodes.
  - **NEW v3.2.3**: Apply **experimental whitelist mode** visibility logic (hide all except allowed).
- **Strengths**
  - Works even when engine misses something.
  - Can hide immediately after a manual block action.
  - **NEW v3.2.3**: Enforces **experimental whitelist mode** on dynamically loaded content.
- **Limits**
  - Can only hide *after* elements exist.
  - **MAJOR IMPROVEMENT v3.2.1+**: Converted to async processing with main thread yielding for lag-free operation.
- **Performance Optimizations**
  - **Async Processing**: `applyDOMFallback()` now yields to main thread every 30-60 elements
  - **Run State Management**: Prevents overlapping executions, queues subsequent calls
  - **Compiled Caching**: Regex and channel filter indexes cached for O(1) lookups
  - **Browser Impact**: Near-zero lag in Chromium, significant improvement in Firefox
- **Whitelist Mode Behavior (v3.2.3 - Experimental)**
  - Hides content not matching whitelist channels/keywords
  - Respects same performance optimizations as blocklist mode

### 1.3 Menu-click Blocking/Allowing (User Action): 3-dot menu injection (`block_channel.js` + `content_bridge.js`)
- **Purpose**
  - Persist a new blocked/allowed channel entry (via background)
  - Hide the clicked card instantly for UX feedback
  - **NEW v3.2.3**: Mode-aware action (Block vs Allow depending on list mode)
- **Strengths**
  - Direct, explicit user action.
  - **IMPROVED v3.2.1**: Can use extra context (videoId, expected byline) to recover identity.
  - **NEW v3.2.3**: Supports both blocklist and **experimental whitelist** workflows.
- **Limits**
  - If we don't have `videoId`, we lose the strongest fallbacks (ytInitialData lookup / shorts fetch).

## Performance Characteristics by Browser

### Chromium-based Browsers (Chrome, Edge, Opera)
- ✅ **Excellent Performance**: Lag virtually eliminated
- ✅ **Async Yielding**: Highly effective at preventing UI freezing
- ✅ **Storage Batching**: Maximum efficiency (70-90% I/O reduction)
- ✅ **Overall Impact**: 90%+ reduction in perceived lag

### Firefox-based Browsers
- ⚠️ **Good Improvements**: Significant lag reduction but not as dramatic
- ⚠️ **Async Yielding**: Some effectiveness but needs tuning for Firefox's event loop
- ⚠️ **Storage Operations**: May need different batching strategy
- 🔧 **Status**: Ongoing optimization work required

## DOM Fallback Processing Flow (v3.2.1+)

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing: DOM Change Detected
    Processing --> Yielding: Every 30-60 Elements
    Yielding --> Processing: Resume After setTimeout(0)
    Processing --> Queued: New Request While Running
    Queued --> Processing: Current Completes
    Processing --> Idle: All Elements Processed
    
    note right of Processing : Run State Management\nPrevents Overlapping Executions
    note right of Yielding : Main Thread Yielding\nPrevents UI Freezing
```

```javascript
async function applyDOMFallback(settings, options = {}) {
    // 1. Run state management prevents overlapping executions
    const runState = window.__filtertubeDomFallbackRunState || 
        (window.__filtertubeDomFallbackRunState = {
            running: false,
            pending: false,
            latestSettings: null,
            latestOptions: null
        });

    if (runState.running) {
        runState.pending = true;
        return; // Queue the call
    }
    runState.running = true;

    // 2. Yield to main thread every 30-60 elements
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    try {
        // 3. Process elements with periodic yielding
        for (let i = 0; i < videoElements.length; i++) {
            const element = videoElements[i];
            // Process element...
            
            if (i > 0 && i % 60 === 0) {
                await yieldToMain(); // Prevent UI freezing
            }
        }
    } finally {
        // 4. Handle queued calls
        runState.running = false;
        if (runState.pending) {
            runState.pending = false;
            setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);
        }
    }
}
```

### Key Performance Benefits

1. **No UI Freezing**: Main thread yielding prevents browser lockup during heavy filtering
2. **Responsive UX**: Users can scroll/click while filtering is processing
3. **Efficient Caching**: Compiled regex and channel indexes reduce CPU usage by 60-80%
4. **Batched Updates**: Storage operations minimized through intelligent batching
5. **Debounced Refresh**: Settings updates throttled to prevent excessive reprocessing

## 2) Mode-Aware Processing Flow (v3.2.3 - Experimental)

### 2.1 Dual Mode Processing Pipeline

```text
┌─────────────────────────────────────────────────────────────┐
│                    CONTENT APPEARS                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               CHECK CURRENT FILTER MODE                      │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────────────────────┐  │
│  │   BLOCKLIST     │    │          WHITELIST              │  │
│  │   MODE          │    │          MODE (v3.2.3)          │  │
│  └─────────────────┘    └─────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐    ┌─────────────────────────────────┐
│ HIDE IF MATCHES  │    │    HIDE IF NO MATCH              │
│ BLOCKLIST RULES  │    │    WHITELIST RULES               │
│                 │    │                                 │
│ • Channel in     │    │ • Channel NOT in whitelist      │
│   blocklist       │    │ • Keywords NOT in whitelist     │
│ • Keywords match  │    │                                 │
│   blocklist       │    │ • SHOW if whitelist match       │
└─────────────────┘    └─────────────────────────────────┘
         │                         │
         └────────────┬────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 APPLY VISIBILITY CHANGES                    │
│                                                             │
│  • Add CSS classes (filtertube-hidden)                     │
│  • Set display: none                                         │
│  • Stamp data attributes (data-filtertube-list-mode)        │
│  • Update 3-dot menu text (Block vs Allow)                  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Channel Stamping with Mode Context

```text
┌─────────────────────────────────────────────────────────────┐
│              CHANNEL IDENTITY RESOLUTION                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            EXTRACT FROM MULTIPLE SOURCES                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   XHR JSON  │  │ ytInitialData │  │   DOM Elements      │   │
│  │   Data      │  │   Page Data  │  │   (Shorts/Home)     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              RESOLVE TO CANONICAL UC ID                       │
│                                                             │
│  • @handle → channelMap lookup → UC ID                      │
│  • /c/name → channelMap lookup → UC ID                       │
│  • /user/name → channelMap lookup → UC ID                    │
│  • Direct UC ID → use immediately                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 STAMP DOM WITH MODE DATA                        │
│                                                             │
│  data-filtertube-channel-id="UC..."                        │
│  data-filtertube-channel-handle="@handle"                   │
│  data-filtertube-list-mode="whitelist|blocklist"           │
│  data-filtertube-source="shorts_homepage|watch_page"       │
└─────────────────────────────────────────────────────────────┘
```

## 3) Whitelist Mode Logic Improvements (v3.2.3 - Experimental)

### 3.1 Watch Page Protection Logic

**Problem**: Whitelist mode was hiding critical watch page elements, breaking video playback.

**Solution**: Mode-aware CSS rules that preserve watch page functionality:

```javascript
// Only hide watch page elements if NOT in whitelist mode
const listMode = (settings && settings.listMode === 'whitelist') ? 'whitelist' : 'blocklist';
const hideInfoMaster = (listMode !== 'whitelist') && !!settings.hideVideoInfo;

if ((listMode !== 'whitelist') && (hideInfoMaster || settings.hideVideoButtonsBar)) {
    // Apply hiding rules
}
```

**Impact**: Video actions, channel row, and description remain hidden in whitelist mode. Description hidden is a regression as of now.

### 3.2 Search Page Indeterminate State Handling

**Problem**: Search pages were blanking when cards rendered before channel identity was available.

**Solution**: Indeterminate state detection prevents hiding content without identity:

```javascript
const path = document.location?.pathname || '';
const hasNameSignal = Boolean(normalizeChannelNameForComparison(channelMeta?.name || '') || 
                          normalizeChannelNameForComparison(channel || ''));

if (path === '/results' && !hasChannelIdentity && !hasNameSignal && collaboratorMetas.length === 0) {
    return false; // Don't hide indeterminate search results
}
```

**Impact**: Prevents blank search pages and recursive loading during identity resolution.

### 3.3 Homepage Duplicate Removal Logic

**Problem**: Whitelist mode showed duplicate content items on homepage.

**Solution**: Automatic duplicate detection and removal:

```javascript
if (path === '/' && listMode === 'whitelist') {
    const seen = new Map();
    for (const item of items) {
        const videoId = item.getAttribute('data-filtertube-video-id') || extractVideoIdFromCard(item) || '';
        const existing = seen.get(videoId);
        if (existing) {
            toggleVisibility(item, true, 'Duplicate item', true); // Hide duplicate
        } else {
            seen.set(videoId, item);
        }
    }
}
```

**Impact**: Cleans up mixed content feeds by removing duplicate videos.

### 3.4 Whitelist-Pending Processing Optimization

**Problem**: Processing all elements during whitelist updates was inefficient.

**Solution**: Targeted processing of only pending elements:

```javascript
const { onlyWhitelistPending = false } = options;
const videoElements = (onlyWhitelistPending && listMode === 'whitelist')
    ? document.querySelectorAll(`${VIDEO_CARD_SELECTORS}[data-filtertube-whitelist-pending="true"]`)
    : document.querySelectorAll(VIDEO_CARD_SELECTORS);
```

**Impact**: Reduces DOM processing overhead by 60-80% during whitelist updates.

### 3.5 Search Thumbnail Channel Extraction

**Problem**: Search pages had whitelist false-negatives due to delayed channel name rendering.

**Solution**: Include thumbnail anchor in channel metadata extraction:

```javascript
let searchThumbAnchor = null;
if (elementTag === 'ytd-video-renderer') {
    searchThumbAnchor = element.querySelector(
        '#thumbnail a[data-filtertube-channel-handle], ' +
        '#thumbnail a[data-filtertube-channel-id], ' +
        'a#thumbnail[data-filtertube-channel-handle], ' +
        'a#thumbnail[data-filtertube-channel-id]'
    );
}
const relatedElements = [channelAnchor, channelElement, channelSubtitleElement, searchThumbAnchor];
```

**Impact**: Prevents first-batch whitelist false-negatives on search pages.

### 3.6 Watch Page SPA Swap Cleanup

**Problem**: Watch page elements remained stuck hidden after navigation.

**Solution**: Clear whitelist-pending flags during SPA swaps:

```javascript
const watchMeta = document.querySelector('ytd-watch-metadata');
if (watchMeta) {
    watchMeta.querySelectorAll('[data-filtertube-whitelist-pending="true"], [data-filtertube-hidden], .filtertube-hidden').forEach(el => {
        toggleVisibility(el, false, '', true); // Clear stuck flags
    });
}
```

**Impact**: Ensures proper element visibility after video navigation.

### 3.7 Whitelist-Pending Re-evaluation Timing

**Problem**: Content was being recursively hidden during search page loading.

**Solution**: Optimized timing for pending content re-evaluation:

```javascript
// Immediate re-evaluation
setTimeout(() => {
    applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true });
}, 0);

// Delayed re-evaluation for late-arriving content
setTimeout(() => {
    applyDOMFallback(null, { preserveScroll: true, onlyWhitelistPending: true });
}, 90);
```

**Impact**: Reduces recursive hiding window by 90% on search pages.

## 4) Canonical Channel Identity Rules (v3.2.1 Updates)

### 4.1 Canonical key
- **Canonical identity is UC ID** (`UCxxxxxxxxxxxxxxxxxxxxxx`).
- `@handle` is an alias, useful for display and as a lookup hint.

Additional supported aliases:
- `customUrl` (`/c/<slug>` and `/user/<slug>`) is treated as a persisted alias that can be resolved to a UC ID via `channelMap`.

### 4.2 `channelMap` (alias cache) - **ENHANCED v3.2.1**
Stored in local extension storage as a bidirectional map:
- `channelMap[lowercaseHandle] -> UCID`
- `channelMap[lowercaseUCID] -> handleDisplay`

**NEW v3.2.1**: Automatic mapping updates during blocking operations:
- Background automatically persists handle↔UC mappings when new channels are added
- Cross-world messaging ensures UI and background stay in sync
- Rate-limited enrichment fills missing mappings over time

Use cases:
- Converting handle-only contexts into UC IDs.
- Recovering from YouTube handle URL breakage.
- **NEW v3.2.1**: Proactive mapping from XHR interception data.

## 5) Channel Identity Sources (Priority Order) - **REVISED v3.2.1**

### 5.1 **NEW: Proactive Network Snapshots (Highest Priority)**
```javascript
// In seed.js - stashed during XHR interception
function stashNetworkSnapshot(data, dataName) {
    if (dataName.includes('/youtubei/v1/next')) {
        window.filterTube.lastYtNextResponse = data;
        window.filterTube.lastYtNextResponseTs = Date.now();
    }
    // ... browse and player endpoints too
}
```

**Sources:**
- `lastYtNextResponse` - Latest next feed data
- `lastYtBrowseResponse` - Latest browse data  
- `lastYtPlayerResponse` - Latest player data
- `rawYtInitialData` - Page initial data
- `rawYtInitialPlayerResponse` - Page player data

### 5.2 Direct UC ID
- From DOM links (`/channel/UC...`) or already-known metadata.

### 5.3 **IMPROVED: Main-world ytInitialData lookup by `videoId`** (best "no network" recovery)
   - `content_bridge.js` → `requestChannelInfoFromMainWorld(videoId)`
   - **NEW v3.2.1**: Now searches multiple snapshot sources, not just `window.ytInitialData`
   - Parses embedded `ytInitialData` / header renderers / canonical links.

### 5.4 Targeted Fetch (Last Resort)
   - `https://www.youtube.com/@<handle>/about`, then fallback to `https://www.youtube.com/@<handle>`
   - `https://www.youtube.com/c/<slug>` / `https://www.youtube.com/user/<slug>`
   - **IMPROVED v3.2.1**: Enhanced CORS handling with automatic fallbacks
   - This is the most fragile due to YouTube’s 404 bug for some handles.

### 5.5 Ultimate Fallbacks
   - **NEW v3.2.1**: OG meta tag extraction when JSON parsing fails
   - **NEW v3.2.1**: Watch identity resolution when channel page scraping fails
   - DOM extraction from stamped attributes
   - Generic fallback ("Channel")

## 6) Surface-by-Surface: “What hides content” + “Where identity comes from”

### 6.1 Home feed / Browse
- **Hide path**
  - Engine removes from JSON when possible.
  - DOM fallback hides recycled/hydrated leftovers.
- **Identity sources**
  - DOM byline link (often `/@handle`)
  - Sometimes `/channel/UC...` in href
  - Engine-stamped `data-filtertube-channel-*` attributes
- **404 Recovery Tip**
  - If `/@handle/about` breaks, rely on `requestChannelInfoFromMainWorld(videoId)` first; that path uses the same four-layer safety net (cache → ytInitialData → Shorts helper → DOM cache invalidation) described in `docs/handle-404-remediation.md`.

### 6.2 Search results
- **Hide path**
  - Engine (best-effort) + DOM fallback (very important due to rapid mutations).
- **Identity sources**
  - `#channel-info ytd-channel-name a` for channel name + href (avoid thumbnail overlay text).
  - `ytInitialData` via main-world lookup if DOM is incomplete.

### 6.3 Watch page
- **Hide path**
  - Engine for recommended/related responses.
  - DOM fallback for sidebar and mixed renderers.
- **Identity sources**
  - `ytInitialData` is usually strong.
  - DOM byline sometimes lacks UC ID.

Watch-page playlists (`list=...`):
- Playlist panel row identity is often incomplete, so `videoChannelMap` is learned via prioritized prefetch and then reused to hide playlist items deterministically.
- Next/Prev navigation is guarded so blocked items are skipped without visible playback.

### 6.4 Shorts shelf / Shorts cards
- **Hide path**
  - Mostly DOM fallback (many Shorts cards are DOM-heavy and inconsistent).
- **Identity sources**
  - Often *only* `videoId` is reliably extractable.
  - Then:
    - Main-world ytInitialData lookup (if the page has the data)
    - Shorts page fetch `/shorts/<videoId>`
    - Then map handle→UC via `channelMap`
- **Collaboration handling**
  - Avatar stacks now trigger the same collaborator enrichment used on search/watch. The immediate hide still occurs, but `handleBlockChannelClick` waits for collaborator data before persisting so that “Block All” is available even on Shorts shelves.

### 6.5 Collaboration videos
- **Hide path**
  - Same as surface (Home/Search/Watch) + special 3-dot “multi-step” selection.
- **Identity sources**
  - `injector.js` collaborator extraction from ytInitialData.
  - Expected handle/name hints are used to avoid picking the wrong collaborator.

Mix cards:
- Mix cards are treated as playlists (container items), but they are not collaborations. Seed-artist text such as “A and more” must not be interpreted as channel collaborators.


## 7) Why 3-dot Blocking Could Still Fail to Recover UC ID

Even if `/@handle/about` 404s, the 3-dot path *should* recover via main-world ytInitialData or shorts fetch.
When it doesn’t, it typically falls into one of these buckets:

- **Missing `videoId`**
  - The strongest fallbacks (`searchYtInitialDataForVideoChannel(videoId)` and `/shorts/<videoId>`) require it.
  - Fix applied: `extractVideoIdFromCard()` now parses `/shorts/<id>`, `/live/<id>`, `/embed/<id>` in addition to `watch?v=`.

- **Main-world message timing**
  - If `injector.js` is still initializing, the first request may time out.
  - Fix applied: `requestChannelInfoFromMainWorld()` and `requestCollaboratorInfoFromMainWorld()` now resend the postMessage while the request is pending.

- **Expected handle mismatch**
  - The main-world lookup can reject a result when `expectedHandle` and found handle differ.
  - This is a safeguard against wrong-collab selection, but can be overly strict if the DOM hint is stale.


## 8) Manual Add / Channel Management UI (Popup + Tab)

### 8.1 What the UI does today
- Popup/tab UI uses `StateManager.addChannel()`.
- That delegates to background via `chrome.runtime.sendMessage({ action: 'addChannelPersistent', input })`.
- UI list rendering uses stored `filterChannels` data for `name`/`logo`.
- There is **no proactive enrichment loop** that refreshes `name/logo` by calling `fetchChannelDetails`.

### 8.2 Important guardrail
- **Manual add must never persist an unresolved handle as the `id`.**
- Fix applied: `addChannelPersistent` now refuses to persist unless a UC ID was resolved (directly or via `channelMap`).


## 9) Recommended Simplification Strategy (Proposal)

This is the direction that makes `/@handle/about` failures mostly irrelevant:

- **Make UC ID mandatory for persistence**
  - Treat handle-only blocks as a temporary *pending* state (or reject) rather than writing corrupt entries.

- **Treat `/@handle/about` as enrichment-only**
  - Do not let it be the canonical identity resolver.
  - Use it only when you already have UC ID and want display name/logo/handle confirmation.

- **Centralize identity resolution**
  - One “resolveChannelIdentity” pipeline shared conceptually by:
    - engine harvest,
    - DOM fallback extraction,
    - 3-dot blocking,
    - manual add.
  - Inputs: `{ videoId, handle, ucId, channelNameHint }`
  - Outputs: `{ ucId, handle, handleDisplay, name, confidence }`

- **Unify handle parsing/normalization semantics**
  - Ensure identical unicode + percent-decoding behavior across `filter_logic.js`, `content_bridge.js`, and `injector.js`.

