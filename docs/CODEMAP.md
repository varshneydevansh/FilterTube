# FilterTube v3.2.7 Code Map (Performance & Category Filtering)

This document provides a detailed reference of the key files and functions in the FilterTube v3.2.7 codebase with performance optimizations, category filtering, and enhanced cross-browser support.

## New in v3.2.7

- **Category Filtering**: Filter videos by YouTube category (e.g., Music, Gaming, Education)
- **Quick-Block Default ON**: `showQuickBlockButton` now defaults to enabled (one-time migration in v3.2.7; user can disable)
- **Quick-Block Card Action**: Hover/touch cross on cards for one-tap direct block (single channel card blocks one channel, collaborator card blocks all associated channels)
- **Comment Block Isolation**: Comment-origin block actions no longer trigger playlist/watch row hides or autoplay-next side effects
- **Hover Retention Hardening**: Search overlays and Home Shorts retain quick-block hover state reliably
- **LRU Eviction**: `videoMetaMap` now uses LRU eviction (3000 entry cap) to prevent unbounded growth
- **Pending-Meta Shimmer**: 8-second TTL for "fetching metadata" states prevents stale shimmer badges
- **Firefox Download Fallback**: Firefox/Waterfox manual exports use an anchor-download path with delayed blob URL cleanup; background backups support both Promise-style and callback-style downloads APIs.
- **System Theme Default**: Missing `ftThemePreference` resolves through `prefers-color-scheme`, while explicit user toggles still persist `light` or `dark`.
- **Short-Height Dashboard Nav**: Sidebar brand/footer stay fixed while `.nav-list` scrolls, keeping every tab reachable on small desktop heights.
- **Large Blocklist Matching**: Shared channel-filter indexes let the JSON filter and DOM fallback match UC IDs, handles, custom URLs, and strict names with set lookups instead of scanning every saved channel.

## 2026-04-28 Mobile/App Upstream Checkpoint

The current extension-side source of truth for native-app runtime sync is split across [TECHNICAL.md](/Users/devanshvarshney/FilterTube/docs/TECHNICAL.md), [FUNCTIONALITY.md](/Users/devanshvarshney/FilterTube/docs/FUNCTIONALITY.md), [CHANNEL_BLOCKING_SYSTEM.md](/Users/devanshvarshney/FilterTube/docs/CHANNEL_BLOCKING_SYSTEM.md), and [data/release_notes.json](/Users/devanshvarshney/FilterTube/data/release_notes.json). Date-stamped checkpoint notes are intentionally not kept as permanent docs.

Those stable docs now cover mobile 3-dot parity, watch playlist/Mix recovery, desktop watch playlist-panel byline recovery, playlist quick-cross post-block mapping refresh, watch/player playlist alternate-ID repair, collaborator roster precedence, exact matching, `Filter All` linked keywords, source badge colors, Kids/Main sync semantics, and UI parity expectations.

## 2026-04-30 Nanah App-Sync Metadata Checkpoint

The Nanah/app sync checkpoint is documented in [TECHNICAL.md](/Users/devanshvarshney/FilterTube/docs/TECHNICAL.md), [ARCHITECTURE.md](/Users/devanshvarshney/FilterTube/docs/ARCHITECTURE.md), and [NANAH_USER_GUIDE.md](/Users/devanshvarshney/FilterTube/docs/NANAH_USER_GUIDE.md). The key source files are `js/io_manager.js`, `js/settings_shared.js`, `js/background.js`, `js/nanah_sync_adapter.js`, `js/tab-view.js`, and `js/vendor/nanah.bundle.js`.

The important contract is that Android/app-packed keyword sources like `channel:<ref>|label=...|comment` are converted back into canonical extension entries with `source:"channel"` and `channelRef`. This keeps app-imported `Filter All` keyword rows visually and behaviorally equivalent to extension-created channel-derived rows.

## 2026-05-03 Shorts Resolver Checkpoint

Tablet Shorts cards and mobile watch-page Shorts tiles now use a Shorts-specific resolver path instead of falling through to the watch resolver:

```text
Shorts card/tile
  -> content_bridge.js:isShortsContentElement()
  -> content_bridge.js:extractShortsVideoIdFromElement()
  -> block_channel.js quick-cross context OR content_bridge.js 3-dot menu
  -> shorts:<videoId> resolver placeholder
  -> background.js performShortsIdentityFetch()
  -> persisted UC/handle + videoChannelMap
```

Key files:

- `js/content_bridge.js`: detects Shorts structures across YTD/YTM/tablet renderers, emits `fetchStrategy:"shorts"`, and retries Shorts HTML identity when needed.
- `js/content/block_channel.js`: keeps Quick Cross aligned with the same `shorts:<videoId>` resolver path and hides the correct Shorts container.
- `js/background.js`: accepts `shorts:<videoId>` and tries the Shorts identity fetch before watch fallback.
- `js/content/menu.js`: adds pending visual feedback for injected block rows while resolution runs.

## Previous in v3.2.6

- **Typography Overhaul**: Modern sans-serif design system (Inter font family)
- **Content Filters**: Duration, upload date, and uppercase detection filters
- **videoMetaMap**: Persistent video metadata storage for advanced filtering
- **UI Enhancements**: Refined dropdowns with left accent borders, improved buttons and toggles
- **Kids Mode Theming**: Pink/purple gradient design system
- **Dark Mode**: Enhanced contrast and consistent styling

## Directory Structure

```
FilterTube/
├── css/                  # Stylesheets (components.css, popup.css, tab-view.css)
├── docs/                 # Documentation (Architecture, Technical, Codemap)
├── html/                 # HTML for Popup and Tab View
├── js/                   # Core JavaScript Logic
│   ├── background.js     # Extension Service Worker
│   ├── content_bridge.js # Isolated World Script (bridge + menu rendering + blocking orchestration)
│   ├── content/          # Isolated World helpers (loaded by manifest ordering)
│   │   ├── block_channel.js   # 3-dot dropdown observer + injection entry-point
│   │   ├── dom_extractors.js  # DOM extraction helpers (videoId, duration, card lookup)
│   │   ├── dom_fallback.js    # DOM fallback filtering layer
│   │   ├── dom_helpers.js     # Small DOM helpers
│   │   └── menu.js            # Menu styles + UI helpers
│   ├── shared/
│   │   └── identity.js    # Shared identity helpers exposed as window.FilterTubeIdentity
│   ├── filter_logic.js   # Main World Script (Filter Engine)
│   ├── injector.js       # Main World Script (Coordinator)
│   ├── popup.js          # Popup UI Logic
│   ├── tab-view.js       # Tab View UI Logic
│   ├── seed.js           # Main World Script (Data Interception Hooks)
│   ├── state_manager.js  # Centralized State Management
│   ├── settings_shared.js# Shared Settings Utilities
│   ├── render_engine.js  # UI Rendering Logic
│   └── ui_components.js  # Reusable UI Components
└── manifest.json         # Extension Manifest
```

## Key Files & Functions

### `data/release_notes.json`
**Context:** Packaged asset (shared between background + UI)
**Purpose:** Single source of truth for release notes surfaced in both the banner and the dashboard.
| Field | Description |
| :--- | :--- |
| `version` | Semantic version string (e.g., `3.1.6`). |
| `headline`, `summary`, `bannerSummary` | Copy shown in dashboard cards vs. banner CTA. |
| `highlights[]` | Bullet list rendered in the “What’s New” tab. |
| `detailsUrl` | External release URL (GitHub tag/commit). |

### `js/background.js` - **ENHANCED v3.2.1+**
**Context:** Extension Service Worker  
**Purpose:** Core extension logic, storage management, API calls, message handling
**New Performance Features:**
- **Channel Map Caching**: `ensureChannelMapCache()`, `enqueueChannelMapUpdate()`, `enqueueChannelMapMappings()`
- **Batched Storage Updates**: 250ms flush intervals reduce I/O by 70-90%
- **Storage Optimization**: Prevents storage contention during rapid updates

### `js/content/dom_fallback.js` - **MAJOR OVERHAUL v3.2.1+**
**Context:** Isolated World (YouTube pages)
**Purpose:** DOM-based content filtering fallback layer
**Performance Optimizations:**
- **Async Processing**: `applyDOMFallback()` converted to async with main thread yielding
- **Run State Management**: Prevents overlapping executions, queues subsequent calls
- **Compiled Caching**: 
  - `compiledKeywordRegexCache` (WeakMap-based regex caching)
  - `compiledChannelFilterIndexCache` (O(1) channel lookups)
- **Channel Identity Functions**: 
  - `normalizeUcIdForComparison()`, `normalizeHandleForComparison()`, `normalizeCustomUrlForComparison()`
  - `channelMetaMatchesIndex()`, `markedChannelIsStillBlocked()`

### `js/content/bridge_settings.js` - **ENHANCED v3.2.1+**
**Context:** Isolated World (YouTube pages)
**Purpose:** Settings management and storage change handling
**New Features:**
- **Debounced Refresh**: `scheduleSettingsRefreshFromStorage()` with 250ms minimum intervals
- **Storage Filtering**: Ignores channelMap-only changes to prevent excessive reprocessing
- **Subscriptions Import Bridge**: Keeps a dedicated MAIN-world import bridge alive, forwards `FilterTube_ImportSubscribedChannels`, and relays progress/errors safely back to the UI.

### `js/filter_logic.js` - **OPTIMIZED v3.2.1+**
**Context:** Main World (YouTube pages)
**Purpose:** Primary filtering engine for JSON responses
**Changes:**
- **Debug Optimization**: `this.debugEnabled = !!window.__filtertubeDebug` (conditional logging)
- **Indexed Channel Matching**: `filterChannelIndex` and `whitelistChannelIndex` use `FilterTubeIdentity.buildChannelFilterIndex()` so large blocklists do not multiply renderer filtering cost by the number of saved channels.

### `js/injector.js` - **SAFETY ENHANCED v3.2.1+**
**Context:** Main World (YouTube pages)
**Purpose:** Script injection and coordination
**Improvements:**
- **Non-configurable Property Safety**: Checks for `configurable: false` before attempting to define properties
- **Error Handling**: Try-catch blocks around `ytInitialData` hook installation
- **Subscriptions Import Coordinator**: Handles `FilterTube_RequestSubscriptionImport`, builds `FEchannels` request profiles from `ytcfg`, normalizes channel rows, emits progress, and returns the final channel list.
- **Authoritative Collaborator Roster Scoring**: Header-backed `Collaborators` sheets are tagged as `collaborators-sheet` and score above avatar-stack/direct-list fallbacks for the same video.
- **Composite Collaborator Pruning**: `sanitizeCollaboratorList()` removes fallback-only composite name rows before caching, e.g. `Daddy Yankee Bizarrap` beside `Daddy Yankee` + `Bizarrap`.

### `js/seed.js` - **SAFETY ENHANCED v3.2.1+**
**Context:** Main World (YouTube pages)
**Purpose:** Data interception hooks and engine initialization
**Improvements:**
- **Debug Control**: `seedDebugEnabled = !!window.__filtertubeDebug`
- **Non-configurable Property Safety**: Enhanced checks for hook installation
- **Better Error Handling**: Comprehensive try-catch for ytInitialData and ytInitialPlayerResponse hooks

### `js/state_manager.js` - **OPTIMIZED v3.2.1+**
**Context:** Extension-wide state management
**Purpose:** Centralized state handling and channel validation
**Enhancements:**
- **Source-based Enrichment Logic**: Import channels skip unnecessary enrichment
- **Storage Change Filtering**: Ignores channelMap-only changes to reduce listeners
- **Subscribed Channels Import**: `importSubscribedChannelsToWhitelist()` validates tab/profile/lock state, requests the channel roster from the selected YouTube tab, then persists it through background batch import.

### `js/io_manager.js`
**Context:** UI contexts (Tab View) + future sync modules
**Purpose:** Canonical import/export engine. Normalizes channel/keyword entries, merges imports (UC IDs, @handles, `c/slug`), adapts BlockTube/plaintext formats, canonicalizes Android/app packed channel keyword source strings, and emits the versioned portable schema consumed by future sync tooling.

**Context:** UI Contexts (Popup, Tab View)
**Purpose:** The Single Source of Truth for application state.
| Function | Description |
| :--- | :--- |
| `loadSettings()` | Loads settings from storage and initializes state. |
| `saveSettings()` | Persists state to storage and notifies listeners. |
| `subscribe(listener)` | Allows components to react to state changes. |
| `addKeyword/Channel` | Centralized logic for adding filters. |

### `js/settings_shared.js`
**Context:** Shared (Background, UI)
**Purpose:** Utilities for normalizing and compiling settings.
| Function | Description |
| :--- | :--- |
| `syncFilterAllKeywords` | Merges user keywords with channel-derived keywords. |
| `compileKeywords` | Converts keywords into RegExp patterns. |

### `js/nanah_sync_adapter.js`
**Context:** Accounts & Sync / Nanah payload application
**Purpose:** Converts Nanah payloads into profile-scoped FilterTube mutations. Current adapter normalization preserves app-packed channel keyword ownership before merge/replace so synced `Filter All` keyword rows remain channel-derived instead of plain user keywords.

### `js/content_bridge.js`
**Context:** Isolated World
**Purpose:** Script injection, bridge messaging, menu rendering/click handling, and blocking orchestration.
| Function | Description |
| :--- | :--- |
| `incrementHiddenStats()` | Increments the blocked counter and calculates "time saved". |
| `fetchChannelFromShortsUrl(videoId)` | Fetches Shorts page in background to extract channel info (handles canonical UC resolution fallback). |
| `handleBlockChannelClick()` | Orchestrates the blocking flow: immediate hide + background block + multi-layer identity recovery. Weak watch/Mix/Shorts rows with a stable video ID now retry through the background `watch:VIDEO_ID` resolver before any legacy content-script network fallback, avoiding YouTube CORS failures. After a successful UC-ID block it also kicks Shorts and playlist-row post-block enrichment so visible watch playlist/Mix rows can hide once their `videoChannelMap` entry is learned; the background path keeps the stored video mapping authoritative while enriching alternate IDs. |
| `fetchWatchIdentityFromBackground()` | Deduplicates content-script requests to the background `fetchWatchIdentity` resolver for weak watch/Mix/playlist rows, keeping identity lookup out of CORS-prone content-script page fetches. |
| `enrichVisiblePlaylistRowsWithChannelInfo()` | After a block, scans visible YTD/YTM playlist-panel rows, uses existing `videoChannelMap` entries first, then asks the background watch resolver for missing row owners, persists learned mappings, stamps row identity, and hides rows from the newly blocked UC ID. |
| `injectFilterTubeMenuItem()` | Injects the "Block Channel" option into YouTube's 3-dot menu (new selectors cover `button-view-model` home cards). Desktop watch `yt-lockup-view-model` bylines can warm a provisional collaborator menu while Main World enrichment runs. |
| `enrichCollaboratorsWithMainWorld()` | Bridges collaborator requests between DOM and Main world, ensuring `allCollaborators` is populated for every surface. |
| `generateCollaborationGroupId()` | Creates deterministic IDs so grouped channels remain linked across storage/UI. |
| `sanitizeCollaboratorListWithMeta()` | Normalizes collaborator rosters, drops placeholders/composite fallback rows, and reports pruning metadata for expected-count correction. |
| `resolveExpectedCollaboratorCount()` | Keeps menu expected counts aligned with sanitized rosters when fallback extraction inflated a collaborator count. |

### `js/content/dom_fallback.js`
**Context:** Isolated World
**Purpose:** DOM fallback filtering layer (MutationObserver + hide/restore).
| Function | Description |
| :--- | :--- |
| `applyDOMFallback(settings, options)` | Scans the DOM for video elements and applies fallback hiding/restoring. Tracks `data-filtertube-last-processed-id` and clears stale `data-filtertube-channel-*` metadata when YouTube reuses DOM nodes. |

### `js/content/block_channel.js`
**Context:** Isolated World
**Purpose:** Detect YouTube 3-dot dropdown openings, locate the associated card from the last clicked menu button, and call `injectFilterTubeMenuItem(dropdown, card)`.

### `js/content/dom_extractors.js`
**Context:** Isolated World
**Purpose:** Shared DOM extraction utilities (e.g., `ensureVideoIdForCard`, `extractVideoDuration`, `findVideoCardElement`).

### `js/filter_logic.js`
**Context:** Main World
**Purpose:** The core filtering engine.
| Class / Object | Description |
| :--- | :--- |
| `FILTER_RULES` | Defines how to extract data from each YouTube "Renderer" type (includes lockup/attributed channel + collab dialog listItems). |
| `FilterTubeEngine.processData(data)` | The public entry point called by `seed.js` to filter a data payload. |
| `_harvestPlayerOwnerData(data)` | Extracts channel IDs/handles from `ytInitialPlayerResponse`, playlist panels, and lockup metadata to keep the channel map warm even when the DOM omits handles. |
| `_registerMapping(id, handle)` | Writes every discovered `(UC ↔ handle)` pair to the cross-world `channelMap`, feeding background cache-first lookups. |

### `js/popup.js` & `js/tab-view.js`
**Context:** UI Contexts
**Purpose:** Entry points for the UI, initializing `StateManager` and `RenderEngine`.

#### Tab view additions (v3.2.1)
- Adds a "What's New" navigation tab that loads cards from `data/release_notes.json`.
- Reads both hash (`#whatsnew`) and query parameters (`?view=whatsnew`) so banner deep-links auto-select the correct view.
- Import/Export card calls into `io_manager.js` for all serialization logic.

#### Tab view additions (v3.3.0 follow-up)
- `resolveSubscriptionsImportTab()` reuses a main YouTube tab, moves it to `/feed/channels`, and waits for the page + bridge to be ready.
- `waitForYoutubeTabReady()` distinguishes page-loading, bridge-startup, sign-in, and receiver-unavailable states.
- `renderSubscriptionsImportState()` and `syncSubscriptionsImportControls()` drive the inline import status shell and loading animation.
- `confirmSubscriptionsImportModeChoice()` explains the difference between plain whitelist import and whitelist activation.

### `js/background.js` - subscriptions import additions
| Function / Action | Description |
| :--- | :--- |
| `mergeImportedWhitelistChannels()` | Normalizes/dedupes imported whitelist rows and returns merge counts. |
| `FilterTube_BatchImportWhitelistChannels` | Persists imported rows into `ftProfilesV4` plus legacy whitelist mirrors and `channelMap`. |
| `FilterTube_EnsureSubscriptionsImportBridge` | Injects the isolated import bridge into a YouTube tab when the receiver is missing. |
| `FilterTube_SetListMode` | Existing mode-switch handler that the import flow can call after persistence. |

### `js/render_engine.js`
**Context:** UI Contexts
**Purpose:** Handles DOM updates and rendering of lists (keywords, channels).
| Function | Description |
| :--- | :--- |
| `buildCollaborationMeta()` | Computes present vs. missing collaborators, badge counts, and tooltip copy per row. |
| `createCollaborationBadge()` | Renders the 🤝 badge with `presentCount/totalCount`. |
| `createFullChannelItem()` | Applies yellow/dashed rails, tooltips, and per-entry controls without altering FCFS order. |

### `js/ui_components.js`
**Context:** UI Contexts
**Purpose:** Provides reusable HTML generators for UI elements (cards, buttons).
