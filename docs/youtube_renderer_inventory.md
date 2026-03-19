# YouTube Renderer Inventory (v3.2.9 follow-up)

This document tracks which YouTube renderers/selectors FilterTube currently targets and how the latest DOM samples map to them.

**Major updates tracked here:**
- **Proactive Network Interception**: Added comprehensive XHR interception and snapshot stashing
- **Enhanced Collaboration Detection**: Added `avatarStackViewModel` support for Mix cards and collaboration detection
- **Topic Channel Support**: Added special handling for auto-generated YouTube topic channels
- **Post-Block Enrichment**: Added background enrichment system for incomplete channel data
- **Kids Video Enhancement**: Added `kidsVideoOwnerExtension` and `externalChannelId` support
- **Performance Optimizations**: Async DOM processing with main thread yielding eliminates UI lag (60-80% CPU reduction, 70-90% I/O reduction)

## Home Feed

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `richItemRenderer` | Wrapper around per-card renderer in rich grid | ✅ Covered @js/filter_logic.js#136-142 |
| `lockupViewModel` | New lockup-based card metadata (titles, subtitles) | ✅ Covered @js/filter_logic.js#150-154 |
| `videoRenderer` / `gridVideoRenderer` | Legacy rich-grid video cards | ✅ Covered @js/filter_logic.js#129-133 |
| `playlistRenderer` / `radioRenderer` | Mix/playlist shelves | ✅ Covered @js/filter_logic.js#206-215 |
| `shelfRenderer` | Home page shelf headers | ✅ Covered @js/filter_logic.js#145-147 |

### **UPDATED v3.2.1: Renderer Status Changes**

| JSON renderer key | Previous Status | Current Status | Notes |
| --- | --- | --- | --- |
| `continuationItemRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Used for comment continuations @js/seed.js#546 |
| `itemSectionRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Comment section removal @js/seed.js#377 |
| `twoColumnWatchNextResults` | ❌ Not parsed | ✅ **IMPLEMENTED** | Watch page content structure @js/filter_logic.js#813 |
| `watchCardRichHeaderRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED** | Universal watch card headers @js/filter_logic.js#361 |
| `backstagePostRenderer` | ✅ Covered | ✅ **ENHANCED** | Community posts with full content @js/filter_logic.js#465 |
| `backstagePollRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED** | Poll questions & choices @js/filter_logic.js#472 |
| `backstageQuizRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED** | Quiz questions & options @js/filter_logic.js#481 |
| `notificationRenderer` | ✅ Covered | ✅ **ENHANCED** | Full notification parsing @js/filter_logic.js#493 |
| `menuRenderer` | ℹ️ UI only | ✅ **IMPLEMENTED** | Menu navigation items @js/content_bridge.js#3901 |
| `commentRenderer` | ✅ Covered | ✅ **ENHANCED** | Comment text & author @js/filter_logic.js#559 |
| `commentThreadRenderer` | ✅ Covered | ✅ **ENHANCED** | Comment thread containers @js/filter_logic.js#564 |

### **NEW v3.2.1: Additional Renderers Found**

| JSON renderer key | Purpose | Status | Location |
| --- | --- | --- | --- |
| `backstagePostThreadRenderer` | Community post threads | ✅ **NEW** | @js/filter_logic.js#458 |
| `ticketShelfRenderer` | Ticket/metadata shelves | ✅ **NEW** | @js/filter_logic.js#422 |
| `podcastRenderer` | Podcast content | ✅ **NEW** | @js/filter_logic.js#425 |
| `richShelfRenderer` | Rich shelf containers | ✅ **NEW** | @js/filter_logic.js#438 |
| `channelVideoPlayerRenderer` | Channel featured video | ✅ **NEW** | @js/filter_logic.js#444 |
| `compactRadioRenderer` | Compact radio playlists | ✅ **NEW** | @js/filter_logic.js#419 |
| `relatedChipCloudRenderer` | Related chip clouds | ✅ **NEW** | @js/filter_logic.js#365 |
| `chipCloudRenderer` | Chip cloud containers | ✅ **NEW** | @js/filter_logic.js#369 |
| `chipCloudChipRenderer` | Individual chips | ✅ **NEW** | @js/filter_logic.js#372 |
| `secondarySearchContainerRenderer` | Search container | ✅ **NEW** | @js/filter_logic.js#388 |

### **NEW v3.2.1: Proactive Network Snapshot System**

| Network Endpoint | Data Source | Purpose | Status |
| --- | --- | --- | --- |
| `/youtubei/v1/next` | `lastYtNextResponse` | Watch page playlist & recommendations | ✅ Stashed @js/seed.js#stashNetworkSnapshot |
| `/youtubei/v1/browse` | `lastYtBrowseResponse` | Channel page & browse data | ✅ Stashed @js/seed.js#stashNetworkSnapshot |
| `/youtubei/v1/player` | `lastYtPlayerResponse` | Video player metadata | ✅ Stashed @js/seed.js#stashNetworkSnapshot |

**Multi-Source Channel Resolution:**
```javascript
// Enhanced search across all proactive sources
const roots = [
    window.filterTube?.lastYtNextResponse,      // Playlist data
    window.filterTube?.lastYtBrowseResponse,    // Channel data  
    window.filterTube?.lastYtPlayerResponse,    // Player data
    window.ytInitialData,                       // Page data
    window.filterTube?.lastYtInitialData        // Backup page data
];
```

### **NEW v3.2.1: Enhanced Collaboration Detection**

| Renderer/Component | Collaboration Type | Status | Notes |
| --- | --- | --- | --- |
| `avatarStackViewModel` | Multi-channel avatar stacks | ✅ **NEW** | Extracts collaborators from avatar arrays @js/injector.js#extractFromAvatarStackViewModel |
| `decoratedAvatarViewModel` | Channel avatars with endpoints | ✅ **ENHANCED** | Now extracts logos and channel info @js/filter_logic.js#340 |
| Mix Cards (`collection-stack`) | **NOT** collaborations | ✅ **FIXED** | Properly excluded from collaboration detection @js/content_bridge.js#isMixCardElement |

**Avatar Stack Structure:**
```javascript
// New avatarStackViewModel parsing
{
    avatars: [
        {
            avatarViewModel: {
                image: { sources: [{ url: "logo_url" }] },
                rendererContext: {
                    commandContext: {
                        onTap: {
                            innertubeCommand: {
                                browseEndpoint: {
                                    browseId: "UC...",
                                    canonicalBaseUrl: "/@handle"
                                }
                            }
                        }
                    }
                }
            }
        }
    ]
}
```

### **NEW v3.2.1: Topic Channel Support**

| Channel Type | Detection Pattern | Status | Notes |
| --- | --- | --- | --- |
| Auto-generated Topic Channels | Name ends with " - Topic" | ✅ **NEW** | Special handling in @js/render_engine.js#isTopicChannel |
| Topic Channel Tooltip | No @handle/customUrl | ✅ **NEW** | Shows explanatory tooltip in UI |

**Topic Channel Logic:**
```javascript
function isTopicChannel(channel) {
    const name = channel?.name || '';
    const hasTopicSuffix = /\s-\sTopic$/i.test(name);
    const hasNoHandle = !channel.handle && !channel.customUrl;
    const hasUcId = channel.id?.startsWith('UC');
    return hasTopicSuffix && hasNoHandle && hasUcId;
}
```

### **NEW v3.2.1: Post-Block Enrichment System**

| Feature | Purpose | Status | Notes |
| --- | --- | --- | --- |
| `schedulePostBlockEnrichment()` | Background enrichment of incomplete channel data | ✅ **NEW** | Runs 3.5s after block with rate limiting @js/background.js#579 |
| `pendingPostBlockEnrichments` | Tracks active enrichment requests | ✅ **NEW** | Prevents duplicate enrichment attempts |
| `postBlockEnrichmentAttempted` | Rate limiting cache (6 hours) | ✅ **NEW** | Avoids repeated failed enrichments |

**Enrichment Triggers:**
- Missing handle or customUrl
- Missing logo
- Missing proper channel name
- Not a topic channel (topic channels are excluded)

### **NEW v3.2.1: Enhanced Kids Video Support**

| Renderer Field | Purpose | Status | Notes |
| --- | --- | --- | --- |
| `kidsVideoOwnerExtension.externalChannelId` | Kids video channel ID extraction | ✅ **NEW** | @js/filter_logic.js#896 |
| `externalChannelId` | General external channel ID | ✅ **ENHANCED** | Multiple fallback locations @js/content/dom_extractors.js#351 |

### New DOM elements from sample
| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-item-renderer>` | Hosts rich grid cards | ✅ Data surfaces through `richItemRenderer` which we filter pre-DOM |
| `<yt-lockup-view-model>` & child `<yt-lockup-metadata-view-model>` | Carries title, byline, metadata | ✅ JSON consumed via `lockupViewModel` paths @js/filter_logic.js#150-154 |
| `<yt-collection-thumbnail-view-model>` / `<yt-collections-stack>` | Visual mix thumbnail stack | ℹ️ Visual only; no keyword-bearing text | No filtering required unless we hide thumbnails later |
| `<yt-thumbnail-view-model>` | Thumbnail container | ℹ️ Covered indirectly when we hide filtered cards |
| `<yt-thumbnail-overlay-badge-view-model>` (Mix badge) | Badge text like “Mix” | ⚠️ Not parsed; consider adding to keyword scan if badges become relevant |
| `yt-chip-cloud-chip-renderer` (filter chips) | DOM-only | ✅ Mixes chip hidden when `hideMixPlaylists` is enabled |

### Home shelf: “Latest YouTube posts” (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-section-renderer>` | `richSectionRenderer` | ℹ️ **NEW** – layout | Container around shelf; ensure recursion reaches embedded shelf contents |
| `<ytd-rich-shelf-renderer is-post>` | `richShelfRenderer` | ℹ️ **NEW** – layout | Hosts post cards; relies on nested `richItemRenderer` data already intercepted |
| `<ytd-post-renderer>` | `backstagePostRenderer` | ✅ Covered | Home community posts now properly extracted for menu blocking; channel info extracted from author links |
| `<ytd-expander id="expander">` | `backstagePostRenderer.content` | ⚠️ **NEW** – partial | Expanded post text lives here when collapsed; confirm JSON contains same text or add DOM fallback |
| `<yt-formatted-string id="home-content-text">` | DOM-only | ℹ️ **NEW** | Displays post body when expander hidden; monitor as potential fallback source |
| `<ytd-backstage-image-renderer>` | `backstageImageRenderer` | ℹ️ **NEW** | Image attachment metadata minimal; rely on parent post text for filtering |
| `<ytd-backstage-poll-renderer>` | `backstagePollRenderer` | ❌ **NEW** – missing | Poll prompt/options show here; extend renderer rules when filtering polls |
| `<ytd-comment-action-buttons-renderer>` | DOM-only | ℹ️ **NEW** | Toolbar (like/share/comment); no keyword-bearing strings |
| `<ytd-menu-renderer>` | `menuRenderer` | ⚠️ **NEW** – verify | Overflow menu labels (e.g., “Not interested”) may need coverage if we target UI text |
| `<ytd-toggle-button-renderer>` | `toggleButtonRenderer` | ℹ️ **NEW** | Like/dislike toggles for posts; currently UI only |

### Subscriptions feed (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-grid-renderer page-subtype="subscriptions">` | `richGridRenderer` | ℹ️ **NEW** – layout | Same grid container as home; confirm recursion so subscription cards filter pre-DOM |
| `<yt-thumbnail-badge-view-model>` (LIVE / duration) | `thumbnailBadgeViewModel` | ⚠️ **NEW** – not parsed | “LIVE” and runtime badges exposed here; evaluate if we need keyword rules to treat live streams differently |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ⚠️ **NEW** – partial | Shows “2 watching”, “1 hour ago”; ensure renderer extraction captures live viewer counts in addition to view tallies |
| `<button-view-model>` | `buttonViewModel` | ℹ️ **NEW** | Drives overflow menus per card; UI text only today |
| `<ytd-subscription-notification-toggle-button-renderer-next>` | `subscriptionNotificationToggleButtonRenderer` | ℹ️ **NEW** | Notification bell states; strings limited to UI ("Subscribed"); track in case filters target notification text |
| `<ytd-badge-supported-renderer>` (verified badge) | `metadataBadgeRenderer` | ℹ️ **NEW** | Badge exposes "Official Artist Channel"; low priority unless badges become filter inputs |

### Subscribed-channels import renderers (2026-03 follow-up)

This inventory section is separate from the normal subscriptions feed card filtering above. It tracks the renderer family used by the whitelist-import flow.

| Renderer / DOM shell | Surface | Import role | Status |
| --- | --- | --- | --- |
| `channelListItemRenderer` | `FEchannels` browse responses | Primary mobile/web-style subscription roster row | ✅ Used by importer |
| `channelRenderer` | Desktop page seed / recursive browse artifacts | Desktop subscription row fallback | ✅ Used by importer |
| `<ytd-channel-renderer>` | `/feed/channels` desktop DOM | Page-seed / DOM fallback source | ✅ Read when present |
| `<ytm-channel-list-item-renderer>` | `/feed/channels` mobile DOM | Page-seed / DOM fallback source | ✅ Read when present |
| `continuationCommand.token` | `FEchannels` browse responses | Continuation paging for larger rosters | ✅ Used by importer |

Import notes:

- the importer starts from `/feed/channels`
- it may seed from page-local data first
- it then continues through `FEchannels` browse requests
- the resulting rows are normalized into whitelist channel entries

### Collaboration Videos + Watch Page (2025-12-21 snapshot, NEW)

YouTube collaboration videos can feature up to **5 collaborating channels + 1 uploader** (6 total). This requires special handling in both data extraction and UI.

#### Data Sources

| Source | Location | Data Available | Status |
| --- | --- | --- | --- |
| **ytInitialData / watch roots (Primary)** | `showSheetCommand -> panelLoadingStrategy -> inlineContent -> sheetViewModel -> content -> listViewModel -> listItems` plus `showDialogCommand` / direct `listViewModel` variants | Full channel info for ALL collaborators | ✅ Covered |
| **DOM Fallback** | `#attributed-channel-name > yt-text-view-model` | Channel names, partial handles (first channel only has direct link) | ✅ Covered |

#### Watch-Page Collaborator Recovery Matrix

Authoritative collaborator data can now come from several watch-page paths. The important rule is that collapsed byline text like `Shakira and 2 more` is not the roster.

Supported recovery paths include:

| Path family | Purpose |
| --- | --- |
| `showSheetCommand -> panelLoadingStrategy -> inlineContent -> sheetViewModel -> content -> listViewModel -> listItems` | Preferred watch-page collaborator sheet |
| `showDialogCommand -> panelLoadingStrategy -> inlineContent -> dialogViewModel -> customContent -> listViewModel -> listItems` | Older dialog-based collaborator list |
| direct nested `listViewModel.listItems` variants | Layout drift / fallback variants |
| selected playlist row + watch metadata + owner metadata | Strong watch-page fallback roots during SPA swaps |

Each collaborator in `listItems[].listItemViewModel`:
| Field Path | Data | Example |
| --- | --- | --- |
| `title.content` | Channel name | `"fern"` |
| `subtitle.content` | Handle + subscriber count (Unicode wrapped) | `"‎⁨@fern-tv⁩ • ⁨42.7 lakh subscribers⁩"` |
| `rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId` | UC ID | `"UCODHrzPMGbNv67e84WDZhQQ"` |

**Note:** `canonicalBaseUrl` is NOT present inside `showDialogCommand` - the `@handle` must be extracted from `subtitle.content` using regex.

#### DOM Elements

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<div id="attributed-channel-name">` | `attributedChannelName` in `lockupViewModel.byline` | ✅ Covered | Detects collaboration videos; triggers special handling |
| `<yt-text-view-model>` with attributed string | DOM-only collaboration display | ✅ Covered | Parses "Channel A ✓ and Channel B ✓" format |
| `<yt-core-attributed-string>` | Contains channel spans | ✅ Covered | Each span has channel name |
| `<yt-avatar-stack-view-model>` | DOM-only (avatar stack) | ✅ Covered | Used to seed collaborator lists and detect collaboration dialog triggers when present |
| `<a href="/@handle">` | Direct channel link | ⚠️ Partial | Only FIRST channel has direct link in DOM; others require ytInitialData lookup |
| `badge-shape[title*="•"]` | DOM-only badges | ✅ Covered | Regex `@([A-Za-z0-9._-]+)` extracts handles even when encoded as `@foo.bar` |

#### 3-Dot Menu UI for Collaborations

| Menu Option | When Shown | Behavior |
| --- | --- | --- |
| Block [Channel N] | 2+ collaborators | Blocks individual channel, stores `collaborationWith` metadata |
| Block All Collaborators | 2+ collaborators | Blocks ALL channels independently with shared `collaborationGroupId` |
| Done • Block X Selected | 3-6 collaborators | Appears after selecting rows in multi-step mode; persists only selections |

#### Watch page notes (v3.2.1)

- **Main video + right rail:** Watch-page dropdowns consume the same collaborator cache as Home/Search, so per-channel menu rows (and “Block All”) appear with names/handles even when the DOM only exposed “Channel A and 3 more”.
- **SPA re-check behavior:** During watch-to-watch swaps, collaborator recovery can re-check watch metadata, owner metadata, and the selected playlist row, then refresh an open collaboration menu when fuller roster data arrives.
- **Embedded Shorts:** Shorts surfaced inside the watch column mark `fetchStrategy: 'shorts'`; we prefetch `/shorts/<videoId>` before falling back to `/watch?v=` so collaborator menus and UC IDs hydrate reliably.
- **Weak-identity rows:** watch/playlist rows can recover through `watch:VIDEO_ID` when stable owner identity is incomplete, and later enrichment can repair provisional names.
- **Watch playlist panel:** Playlist panel rows now hide deterministically for blocked channels (prefetch enriches `videoChannelMap` for playlist items), and Next/Prev navigation skips blocked items without visible playback flash.
- **Watch playlist autoplay:** Autoplay uses an `ended`-event safety net to trigger a Next-click only when the immediate next playlist row is blocked, preventing blocked items from briefly playing.
- **Playlist reprocessing robustness:** Previously hidden playlist rows are kept hidden during identity gaps (sticky-hide) to prevent restored blocked items from becoming playable during async enrichment.
- **Dropdown close behavior:** The 3-dot dropdown close logic avoids closing `ytd-miniplayer` when a miniplayer is visible.
- **ENHANCED:** Avatar stack collaboration detection works on surfaces where `avatarStackViewModel` is used instead of explicit dialog commands.
- **Mix guardrail:** Mix / collection-stack cards are excluded from collaborator grouping, but still participate in owner recovery and fallback 3-dot blocking.

**Multi-select note (3+ collaborators):**
When there are 3–6 collaborators, individual rows act as “select” toggles first. The bottom row becomes:
`Done • Block X Selected` and will persist only those selected collaborators.

#### Storage Schema for Collaboration Entries

```javascript
{
  id: "UCxxxxxx",           // UC ID
  handle: "@channelname",   // @handle
  customUrl: "c/LegacyName", // legacy channel URL (optional)
  name: "Channel Name",     // Display name
  filterAll: true/false,    // Filter All toggle state
  collaborationWith: ["@other1", "@other2"],  // Other collaborators (for UI display)
  collaborationGroupId: "uuid-xxx",           // Links related entries (for group operations)
  allCollaborators: [{ name, handle, id }],   // Canonical roster carried for rehydration
  expectedCollaboratorCount: 3                // Supports "and N more" semantics while enrichment is pending
}
```

#### Collaboration DOM + Cache Attributes (important)

FilterTube stamps/caches collaborator rosters on cards so collaboration menus can render immediately even before Main World enrichment finishes.

| Attribute | Where | Meaning |
| --- | --- | --- |
| `data-filtertube-video-id` | card + wrapper | Stable video ID used for cache validation and Main World lookups |
| `data-filtertube-collaborators` | card | JSON string of `{name, handle, id, customUrl}` for collaborators |
| `data-filtertube-collaborators-source` | card | Source tag: e.g. `lockup`, `dialog`, `mainworld` |
| `data-filtertube-collaborators-ts` | card | Timestamp for stale-cache detection |
| `data-filtertube-expected-collaborators` | card | Expected collaborator count (supports “+ N more”) |
| `data-filtertube-channel-custom` | card | Legacy channel identifier (`c/<slug>` or `user/<slug>`) |

#### Collaboration Menu Item Attributes

| Attribute | Where | Meaning |
| --- | --- | --- |
| `data-collab-key` | menu row | Key for the collaborator row (derived from `id` or `@handle` or `customUrl`) |
| `data-collaboration-with` | menu row | JSON of “other collaborators” for UI grouping |
| `data-collaboration-group-id` | menu row | Group ID used to connect related collaboration entries |
| `data-is-block-all="true"` | menu row | Marks the “All collaborators / Done” row |
| `data-multi-step="true"` | menu row | Enables multi-select behavior for 3+ collaborators |

#### Cross-World Communication

Since content_bridge.js runs in **Isolated World** (no `ytInitialData` access), collaboration data requires message-based lookup:
1. DOM extraction detects collaboration video
2. If collaborator data incomplete → request from Main World via `FilterTube_RequestCollaboratorInfo`
3. injector.js (Main World) searches `ytInitialData` and responds with `FilterTube_CollaboratorInfoResponse`
4. content_bridge.js enriches collaborator data and injects menu options
5. background.js persists `collaborationGroupId`, `collaborationWith`, `allCollaborators`; UI renders dashed/yellow rails via `render_engine.js`

#### Renderer/UI Mapping
| Layer | Responsibility |
| --- | --- |
| `filter_logic.js` | Extracts collaborator listItems, normalizes handles (lowercase, dots/underscores allowed) |
| `content_bridge.js` | Generates group IDs, injects block-all menu entries, and hides DOM nodes immediately |
| `render_engine.js` | Computes `presentCount/totalCount`, adds 🤝 badge + tooltip text |

### Shorts Collaborations & Canonical IDs (2025-12 sample)

| Source | Path / Selector | Notes |
| --- | --- | --- |
| DOM | `ytd-shorts-lockup-view-model`, `.reel-item` | Shorts cards often omit UC IDs; only handle is available |
| Fetch | `https://www.youtube.com/shorts/<id>` | Used to extract uploader handle when missing from DOM |
| Fetch | `https://www.youtube.com/@handle/about` | Resolves canonical `UC...` ID via regex `channel/(UC[\w-]{22})` |

**Flow Recap:** detect Short → hide container → resolve handle → resolve UC ID → persist → broadcast so interceptors catch future cards.

### Podcasts shelf (Podcasts tab, 2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-rich-shelf-renderer layout="podcasts">` | `richShelfRenderer` | ℹ️ Layout | Container for podcasts shelf; traversal reaches nested `podcastRenderer` entries |
| `<ytd-rich-item-renderer is-shelf-item>` | `podcastRenderer` payload | ✅ Covered | Podcast title/description + publisher captured, including metadata rows |
| `<yt-collection-thumbnail-view-model>` | `lockupViewModel.collectionThumbnailViewModel` | ℹ️ | Stack thumbnail + square art; no additional text beyond badges (playlist lockups hidden when `hidePlaylistCards` is on, but Mix/Radio lockups are excluded via `start_radio=1`) |
| `<yt-thumbnail-overlay-badge-view-model>` | `thumbnailBadgeViewModel` | ⚠️ Partial | Badge text like “1 episode”; evaluate keyword needs later |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ✅ Covered | Metadata rows now parsed via helper fallback |

## Search Results & Generic Lists

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `videoRenderer` / `compactVideoRenderer` | Main search results & sidebar items | ✅ Covered @js/filter_logic.js#129-131 |
| `playlistVideoRenderer` / `compactRadioRenderer` | Playlist search hits | ✅ Covered @js/filter_logic.js#132-215 |
| `secondarySearchContainerRenderer` | Container around secondary results | ✅ Covered @js/filter_logic.js#232-235 |

### DOM elements from 2025-11-17 sample (NEW)

**⚠️ CRITICAL: Search page `ytd-video-renderer` structure differs from home page `yt-lockup-view-model`**

On **home page** (`yt-lockup-view-model`):
- `data-filtertube-channel-handle` is on the channel link inside `.yt-lockup-metadata-view-model__metadata`
- Channel name text is in the same element

On **search page** (`ytd-video-renderer`):
- `data-filtertube-channel-handle` is on the **thumbnail link** (`#thumbnail a`)
- Thumbnail link contains **overlay text** (duration like "25:31", "Now playing")
- Channel name is in a **separate location**: `#channel-info > ytd-channel-name > a`

**Solution**: When extracting channel name with data attributes present, ALWAYS query `#channel-info ytd-channel-name a` first, never rely on the data-attribute element's textContent.

**General guardrail**: owner names must come from real channel selectors such as `#channel-info ytd-channel-name a`, `#owner-name a`, or authoritative recovered payloads. Row titles, thumbnail links, generic data-attribute hosts, and fallback-popover titles are provisional only and may contain overlay/title text.

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-video-renderer>` | `videoRenderer` search result card | ✅ Covered — **NEW** DOM tag surfaced in latest layout | Title, channel, snippet text still arrive via existing `descriptionSnippet` / `detailedMetadataSnippets` paths |
| `<ytd-universal-watch-card-renderer>` | `universalWatchCardRenderer` (secondary column hero) | ✅ Covered — **NEW** | Continue to verify nested header/title extraction works with rich header fields |
| `<ytd-watch-card-hero-video-renderer>` | `watchCardHeroVideoRenderer` | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-compact-video-renderer>` | `watchCardCompactVideoRenderer` | ✅ Covered — **NEW** | Matches existing sidebar rules; confirm snippet paths |
| `<ytd-vertical-watch-card-list-renderer>` | Watch card list container | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-rich-header-renderer>` | `watchCardRichHeaderRenderer` | ⚠️ **NEW** – missing | Header exposes channel title/handle; extend rules beyond `universalWatchCardRenderer` wrapper |
| `<ytd-watch-card-section-sequence-renderer>` | `watchCardSectionSequenceRenderer` | ✅ Targeted (Layout Fix) | Handled in `js/layout.js` to ensure visibility propagation |
| `<ytd-watch-card-rhs-panel-renderer>` | `watchCardRHPanelRenderer` | ❌ **NEW** – not parsed | New right-hand hero layout; add renderer coverage if JSON structure differs from existing watch cards |
| `<ytd-watch-card-rhs-panel-video-renderer>` | `watchCardRHPanelVideoRenderer` | ❌ **NEW** – not parsed | Companion compact entries inside the RHS panel; map JSON keys for title/channel extraction |
| `<ytd-horizontal-card-list-renderer>` | `horizontalCardListRenderer` | ⚠️ **NEW** – missing | Album shelf with refinement chips; need renderer coverage for card metadata |
| `<ytd-title-and-button-list-header-renderer>` | `titleAndButtonListHeaderRenderer` | ℹ️ **NEW** | Header text like “Albums”; low priority unless chip titles require filtering |
| `<ytd-search-refinement-card-renderer>` | `searchRefinementCardRenderer` | ❌ **NEW** – not parsed | Album/playlist cards include titles; add rules if we must block refinement results |
| `<ytd-call-to-action-button-renderer>` | `callToActionButtonRenderer` | ℹ️ **NEW** | CTA button text (“YouTube Mix”) likely safe; monitor if keyword filtering needed |
| `<ytd-button-banner-view-model>` | `buttonBannerViewModel` | ℹ️ **NEW** | Footer promo (“Listen on YouTube Music”); record in case future filtering targets promos |
| `<ytd-collage-hero-image-renderer>` | DOM-only | ℹ️ **NEW** | Visual collage for hero; no textual data |
| `<ytd-grid-video-renderer>` | `gridVideoRenderer` shelf results | ✅ Covered — **NEW** | Horizontal shelves use same renderer as home feed |
| `<ytd-channel-renderer>` | `channelRenderer` search result | ✅ Covered — **NEW** | Ensure channel description/snippet text captured for keyword filters |
| `<ytd-expandable-metadata-renderer>` | Likely `expandableMetadataRenderer` / AI summary | ❌ **NEW** – Not yet parsed | Add rules to inspect AI summary text when we want to filter summaries |
| `<video-summary-content-view-model>` | AI summary paragraphs | ❌ **NEW** – DOM-only content | Consider DOM scrape if JSON source unavailable |

## Watch Page (Main & Right Rail)

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `videoPrimaryInfoRenderer` / `videoSecondaryInfoRenderer` | Active video title/channel | ✅ Covered @js/filter_logic.js#224-230 |
| `compactVideoRenderer` | Up next suggestions | ✅ Covered @js/filter_logic.js#129-131 |
| `watchCardCompactVideoRenderer` | Watch-card suggestions | ✅ Covered @js/filter_logic.js#133-134 |
| `watchCardHeroVideoRenderer` | Hero watch card | ⚠️ **NEW** – add extraction paths |

### Gaps to monitor
| Renderer / component | Status | Notes |
| --- | --- | --- |
| `compactAutoplayRenderer` | ⚠️ Missing | Frequently used in autoplay module; add extraction paths |
| `watchCardSectionSequenceRenderer` | ⚠️ **NEW** – suspected parent | Needed to recurse into vertical hero lists |

### DOM elements from 2025-11-17 watch sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-watch-metadata>` | `videoPrimaryInfoRenderer` + `videoSecondaryInfoRenderer` | ✅ Covered — **NEW** | Title/channel text already extracted from JSON; DOM reflects same data |
| `<ytd-video-owner-renderer>` | Owner block from `videoSecondaryInfoRenderer` | ✅ Covered — **NEW** | Channel link, sub count reachable via existing owner paths |
| `<ytd-watch-info-text>` | `videoSecondaryInfoRenderer.metadataRowContainer` | ⚠️ **NEW** – partial | Need to ensure view-count/date/hashtags paths (`info`) captured for keyword scan |
| `<ytd-text-inline-expander>` (description) | `videoPrimaryInfoRenderer.description` | ⚠️ **NEW** – truncated snippet | Confirm short/expanded description text is in JSON and fall back to DOM snippet if missing |
| `<ytd-structured-description-content-renderer>` | Structured description rows | ❌ **NEW** – not parsed | Add rules if product links/chapters require filtering |
| `<ytd-subscribe-button-renderer>` | DOM-only | ℹ️ **NEW** – UI only | No filtering required |

### Watch Next chip cloud (2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-related-chip-cloud-renderer>` | `relatedChipCloudRenderer` | ✅ Covered | Container metadata now parsed for chip subtitles; keyword filtering can suppress chip groups |
| `<yt-chip-cloud-renderer>` | `chipCloudRenderer` | ℹ️ Layout | Hosts chip list; parser now recurses into child chips |
| `<yt-chip-cloud-chip-renderer>` | `chipCloudChipRenderer` | ✅ Covered | Chip labels & navigation endpoints feed into keyword + channel handle filtering |
| `<chip-shape>` button label | DOM-only | ⚠️ Fallback | Still monitor if chips ship DOM-only text without JSON |

### New DOM notes
- Provided HTML did not include right-rail markup; request additional samples (expect `<ytd-compact-video-renderer>` with `compactAutoplayRenderer`).
- Description snippet now wrapped in `ytd-text-inline-expander`; confirm `videoDetails.shortDescription`/`descriptionSnippet` fields remain populated for filtering.

## Channel Page

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `channelVideoPlayerRenderer` | Channel featured video / trailer | ✅ Covered @js/filter_logic.js#162-166 |
| `gridVideoRenderer` | Channel videos grid items | ✅ Covered @js/filter_logic.js#129-131 |

### DOM elements from 2025-11-17 channel sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-channel-metadata-renderer>` | `channelMetadataRenderer` | ⚠️ **NEW** – not parsed | Channel description, stats, links surfaced here; add rules if keyword filtering should cover bios |
| `<yt-horizontal-list-renderer>` | `horizontalListRenderer` | ⚠️ **NEW** – container | Ensure recursion catches `items[].gridVideoRenderer` so featured shelf videos filter correctly |
| `<ytd-section-list-renderer>` / `<ytd-item-section-renderer>` | `twoColumnBrowseResultsRenderer.tabs[].sectionListRenderer` | ℹ️ **NEW** – layout | Structural containers; no filtering today |
| `<ytd-grid-video-renderer>` | `gridVideoRenderer` | ✅ Covered — **NEW** | Same renderer rules as home/search; confirm supports joint-channel bylines |

### Playlists tab controls (2025-11-18 sample, NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-channel-sub-menu-renderer>` | `channelSubMenuRenderer` | ⚠️ **NEW** – not parsed | Hosts Playlists tab dropdown (“Created playlists”); add renderer rules if menu text needs keyword filtering |
| `<yt-sort-filter-sub-menu-renderer>` | `sortFilterSubMenuRenderer` | ⚠️ **NEW** – missing | Provides “Sort by” options; confirm JSON paths before scanning sort labels |
| `<yt-dropdown-menu>` / `<tp-yt-paper-menu-button>` / `<tp-yt-paper-listbox>` | DOM-only | ℹ️ **NEW** | UI shell around submenu; relies on parent renderer for strings |
| `<ytd-grid-renderer>` (Playlists tab) | `gridRenderer` containing `items[].lockupViewModel` | ℹ️ **NEW** | Structural grid; ensure recursion reaches playlist lockups |
| `<yt-content-metadata-view-model>` | `contentMetadataViewModel` | ⚠️ **NEW** – partial | Surfaces playlist metadata rows (counts, “Updated” dates); consider parsing if keywords must match |

### Posts tab / Community feed (2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-backstage-items>` | `sectionListRenderer.contents[].backstageItems` | ℹ️ **NEW** – layout | Container for community threads; ensure recursion reaches `backstagePostThreadRenderer` entries |
| `<ytd-comments-header-renderer is-backstage>` | `commentsHeaderRenderer` (backstage) | ⚠️ Partial | Header text still unchecked; evaluate after main post coverage |
| `<ytd-backstage-post-thread-renderer>` | `backstagePostThreadRenderer` | ✅ Covered | Thread wrappers parsed; ensures nested posts obey keyword/channel filters |
| `<ytd-backstage-post-renderer>` | `backstagePostRenderer` | ✅ Covered | Post body, attachments, author channel IDs/handles extracted |
| `<ytd-backstage-image-renderer>` | `backstageImageRenderer` | ℹ️ | Image attachment metadata minimal; rely on parent post text for now |
| `<ytd-backstage-poll-renderer>` | `backstagePollRenderer` | ✅ Covered | Poll prompts/options now included in keyword scanning |
| `<ytd-backstage-quiz-renderer>` | `backstageQuizRenderer` | ✅ Covered | Quiz question/choices exposed for filters |
| `<ytd-post-uploaded-video-renderer>` | `backstagePostRenderer.attachments[].videoRenderer` | ✅ Covered — **NEW** | Nested `videoRenderer` uses existing rules; verify recursion processes attachment payload |
| `<ytd-comment-action-buttons-renderer>` | DOM-only | ℹ️ **NEW** | UI buttons (like/share/comment); no filterable strings |

### Gaps to monitor
- Confirm whether `channelFeaturedContentRenderer` or `channelAboutMetadataRenderer` appear in JSON; add entries if descriptions or featured playlists bypass existing rules.
- Validate continuation tokens for channel shelves so hidden videos are not re-fetched.
- Add renderer coverage for `channelSubMenuRenderer` / `sortFilterSubMenuRenderer` if playlist menu text needs filtering.
- Decide if `contentMetadataViewModel` metadata rows require keyword scanning (e.g., updated timestamps, video counts).
- Evaluate backstage header/menus once there is a requirement to filter them.

## Shorts

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `reelItemRenderer`, `shortsLockupViewModel`, `shortsLockupViewModelV2` | Shorts feeds | ✅ Covered @js/filter_logic.js#179-193 |

### Observed gaps
- No new Shorts DOM included. Continue validating for `yt-reel-player-overlay` variants.

## Watch Playlist Panel

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `playlistPanelRenderer` | Watch-page mini playlist (Up Next queue) | ⚠️ Partial @js/filter_logic.js#206-215 |
| `playlistPanelVideoRenderer` | Individual playlist items within panel | ✅ Covered @js/filter_logic.js#129-133 |

### DOM elements from 2025-11-18 sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-playlist-panel-renderer>` | `playlistPanelRenderer` | ⚠️ **NEW** – missing metadata parsing | Header exposes playlist title/channel; confirm JSON paths for keyword scan and consider DOM fallback |
| `<ytd-playlist-panel-video-renderer>` | `playlistPanelVideoRenderer` | ✅ Covered — **NEW** | Titles/bylines map to existing renderer rules; ensure resume-progress DOM doesn’t hide filtered items |
| Playlist action controls (`ytd-playlist-loop-button-renderer`, shuffle toggle) | DOM-only | ℹ️ **NEW** | UI buttons only; no filtering required |

### Custom fallback 3-dot support on weak watch rows

When YouTube does not expose a usable native overflow path or row identity is too weak, FilterTube can render its own fallback controls on watch-page rows such as:

- `ytd-playlist-panel-video-renderer`
- `yt-lockup-view-model`
- mobile playlist / compact watch rows

Fallback UI elements:

| Element | Purpose |
| --- | --- |
| `.filtertube-fallback-menu-slot` | Anchor slot for the fallback controls |
| `.filtertube-playlist-menu-fallback-btn` | Custom launcher button |
| `.filtertube-playlist-menu-fallback-popover` | Popover containing block rows and toggles |

Fallback contract:

- `Filter All` is toggle-only
- the real action is the `Block • Channel` row
- the row shows pressed/focus/open feedback before the popover closes
- weak watch-row identity can escalate to `watch:VIDEO_ID`
- post-block enrichment may repair provisional title-like names for the same canonical UC ID

### Lockup / Shelf Playlists (Related section)
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `lockupViewModel` (playlist variant) | Horizontal playlist promos | ✅ Covered @js/filter_logic.js#149-154 |

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-lockup-view-model>` (playlist) | `lockupViewModel` | ✅ Covered — **NEW** | Existing lockup rules pick up title/channel; badge text (video counts) still DOM-only |
| `<yt-collection-thumbnail-view-model>` / `<yt-collections-stack>` | Collection thumbnail stack | ℹ️ **NEW** | Visual only; continue to ignore unless we filter by thumbnail badges |

### Follow-ups
- Verify we recurse into `playlistPanelRenderer.contents` to filter continuation responses when playlists auto-advance.
- Decide if playlist badges (`yt-thumbnail-overlay-badge-view-model`) need keyword filtering when they include captions like “AI Summary”.
- Capture playlist publisher names in renderer rules if keyword filtering should cover collaborators (e.g., “Playlist” taxonomy strings).
- Evaluate playlist overlays (`thumbnailOverlayPlaybackStatusRenderer`, resume progress, “Now playing”) in case watched-state strings become filter signals.

### Library playlists: Watch Later & Liked videos (2025-11-18 sample)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-playlist-video-renderer>` | `playlistVideoRenderer` | ✅ Covered — **NEW** | Watch Later / Liked entries expose title, channel, description via existing playlist renderer rules |
| `<ytd-video-meta-block class="playlist">` | `playlistVideoRenderer` | ✅ Covered — **NEW** | Bylines (“Sana”, view count, age) surface from same JSON; confirm we persist extraction when metadata block rearranges |
| `<ytd-thumbnail-overlay-time-status-renderer>` | `thumbnailOverlayTimeStatusRenderer` | ✅ Covered | Duration badge mirrors JSON value |
| `<ytd-thumbnail-overlay-playback-status-renderer>` | `thumbnailOverlayPlaybackStatusRenderer` | ✅ Covered | “WATCHED” / “UNWATCHED” strings now flow into keyword filter |
| `<ytd-thumbnail-overlay-resume-playback-renderer>` | `thumbnailOverlayResumePlaybackRenderer` | ✅ Covered | Accessibility label supplies “Resume watching” context |
| `<ytd-thumbnail-overlay-now-playing-renderer>` | `thumbnailOverlayNowPlayingRenderer` | ✅ Covered | “Now playing” indicator captured |
| `<ytd-channel-name>` (playlist context) | `playlistVideoRenderer.shortBylineText` | ✅ Covered — **NEW** | Channel attribution already captured by playlist renderer rules |
| `<yt-formatted-string id="video-info">` | `playlistVideoRenderer.videoInfo` | ⚠️ **NEW** – verify | View counts & ages appear here; double-check JSON paths so filters see localized numerals |

## Comments

### Existing coverage
| JSON renderer key | Purpose | Status |
| --- | --- | --- |
| `commentRenderer`, `commentThreadRenderer` | Comment threads | ✅ Covered @js/filter_logic.js#196-203 |

### DOM elements from 2025-11-17 sample (NEW)
| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-comments>` | Comments section container | ℹ️ **NEW** – layout | Hosts `itemSectionRenderer`; no direct filtering |
| `<ytd-comment-thread-renderer>` | `commentThreadRenderer` | ✅ Covered — **NEW** | Wraps top-level comment + replies |
| `<ytd-comment-view-model>` | `commentRenderer` | ✅ Covered — **NEW** | Text extracted via existing comment rules |
| `<ytd-expander>` (comment text) | `commentRenderer.contentText` | ✅ Covered — **NEW** | Multi-line comment bodies already flattened |
| `<ytd-comment-engagement-bar>` | DOM-only | ℹ️ **NEW** | Buttons only; no filterable text |
| `<ytd-continuation-item-renderer>` | `continuationItemRenderer` | ⚠️ **NEW** | Ensure continuation tokens filtered so hidden threads stay hidden |

## Feed Filter Chips (New Sample)

| DOM tag / component | Associated data | Coverage | Notes |
| --- | --- | --- | --- |
| `<ytd-feed-filter-chip-bar-renderer>` | Horizontal chip bar | ❌ Not targeted |
| `<yt-chip-cloud-chip-renderer>` | Individual chips ("Music", "Mixes") | ❌ Not targeted |
| `<chip-shape>` button text | Visible string we might want to filter | ⚠️ Consider parsing if chips drive exposure to undesired topics |

These chips originate from the YouTube UI rather than API payloads we currently filter; we may need DOM-level observers if we want to auto-select or hide them.

## Notifications (Bell / Inbox)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-notification-renderer>` | `notificationRenderer` | ✅ Covered | Headline, long message, and channel IDs/handles now parsed |
| `<yt-formatted-string class="message">` | `notificationRenderer.shortMessage` | ⚠️ Partial | JSON path parsed; confirm DOM-only variants |
| `<ytd-multi-page-menu-renderer>` / `<yt-multi-page-menu-section-renderer>` | `multiPageMenuRenderer` | ℹ️ Layout | Container; parser recurses into notification children |
| `<ytd-comment-video-thumbnail-header-renderer>` | `commentVideoThumbnailHeaderRenderer` | ✅ Covered | Provides video title + channel for context filtering |
| `<ytd-menu-renderer>` (notification actions) | `menuRenderer` | ℹ️ | Action menu labels (“Turn off”, “Hide this notification”); UI-only for now |
| `<ytd-comments>` / `<ytd-comment-thread-renderer>` | `commentThreadRenderer` | ✅ Covered | Notifications drawer reuses comment components; existing rules should filter replies once data is intercepted |

## YouTube Kids (DOM samples, 2025-12)

| DOM tag / component | Location / purpose | Status | Notes |
| --- | --- | --- | --- |
| `<ytk-compact-video-renderer> > <ytk-menu-renderer>` with `<tp-yt-paper-icon-button id="menu-button">` | Per-card overflow (3-dot) on video thumbnails | ❌ DOM-only | Hosts native Kids overflow. Need observer hook to intercept native “Block this video” selection and mirror into FilterTube Kids list. |
| `<ytk-menu-popup-renderer>` inside `<ytk-popup-container>` | Dropdown panel rendered after clicking 3-dot | ❌ DOM-only | Contains `Block this video` list item (`<ytk-menu-service-item-renderer>`). Blocking shows toast “Video blocked” with `UNDO` button. |
| `<ytk-popup-container> > <ytk-notification-action-renderer> > <tp-yt-paper-toast id="toast">` | Confirmation toast after block | ❌ DOM-only | Text “Video blocked”; includes undo button. Useful for confirming interception success. |
| `<ytk-masthead>` with `<ytk-kids-category-tab-renderer>` | Home masthead category tabs (Recommended, etc.) | ℹ️ Layout | Category nav; not filterable but relevant if mode/state affects renderer traversal. |
| `<ytk-compact-video-renderer>` | Home/search/watch-right-rail video items | ❌ DOM-only | Title lives in `<span>`; overlay duration badge; menu as above. Need videoId extraction + channel attribution (via card link or mainworld lookup). |
| `<ytk-compact-playlist-renderer>` | Playlist promos on Kids home | ❌ DOM-only | Shows playlist title + video-count overlay; needs playlist/channel capture for blocking playlists or channels. |
| `<ytk-compact-channel-renderer>` | Channel tiles (home/search/music) | ❌ DOM-only | Channel title + thumbnail; 3-dot menu present. Must capture channelId from href `/channel/UC...`. |
| `<ytk-two-column-watch-next-results-renderer>` | Watch-page right rail container | ℹ️ Layout | Contains `ytk-compact-video-renderer` items; observer hook needed to filter next-up rows. |
| `<ytk-slim-video-metadata-renderer>` | Watch-page header (title + owner) | ❌ DOM-only | Title in `#video-title`; channel name in `#video-owner`. Use to seed channel and video title when JSON unavailable. |

## Action Items
1. Add renderer support for `compactAutoplayRenderer`, `watchCardHeroVideoRenderer`, and `watchCardSectionSequenceRenderer`.
2. Confirm extraction of search snippet text (`metadata-snippet-text`, AI summaries) and extend keyword scanning if JSON does not carry full descriptions.
3. Decide whether badge text (`yt-thumbnail-overlay-badge-view-model`) and chip labels need keyword filtering or DOM suppression (now that chip JSON is parsed, only DOM-only variants remain).
4. Collect additional DOM/JSON samples for Watch right rail and Shorts once main surfaces are finalized.
5. Evaluate whether to expose the newly parsed playlist overlays (`WATCHED`, `Resume watching`, `Now playing`) as user-facing toggles.
6. Add renderer coverage for `channelSubMenuRenderer` / `sortFilterSubMenuRenderer` if playlist menu text needs filtering.
7. Monitor backstage header/menu strings for future filtering requirements and confirm metadata-row helper coverage across other `contentMetadataViewModel` instances.

## Sidebar & Navigation (2025-11-24 sample, NEW)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<ytd-guide-entry-renderer>` | `guideEntryRenderer` | ✅ Covered | Sidebar navigation items (e.g., "Shorts"). Now targeted for hiding when "Hide All Shorts" is active. |

## AI & Experimental Features (2025-11-24 sample, NEW)

| DOM tag / component | Underlying renderer / data source | Status | Notes |
| --- | --- | --- | --- |
| `<yt-button-view-model>` | `buttonViewModel` | ℹ️ **NEW** | "Ask" button (AI feature). Potential future target for category filtering. |

## 3-Dot Menu Blocking Targets (v3.0.9)

FilterTube now injects a "Block Channel" option into the 3-dot menu for the following content types. This allows users to block channels directly from the UI without visiting the channel page.

| Content Type | Targeted DOM Elements | Notes |
| --- | --- | --- |
| **Standard Videos** | `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`, `ytd-compact-video-renderer` | Covers Home, Search, Channel Videos, and Sidebar suggestions. |
| **Shorts** | `ytd-reel-item-renderer`, `ytd-reel-video-renderer`, `reel-item-endpoint`, `ytm-shorts-lockup-view-model`, `ytm-shorts-lockup-view-model-v2` | Covers Shorts Shelf, Shorts Player, and Mobile/Search Shorts. Uses async fetch for channel info. |
| **Posts** | `ytd-post-renderer` | Community posts on Home and Channel pages. |
| **Playlists** | `ytd-playlist-panel-video-renderer`, `ytd-playlist-video-renderer` | Videos within a playlist view. |
| **Mobile/Compact** | `ytd-compact-promoted-video-renderer`, `ytm-compact-video-renderer`, `ytm-video-with-context-renderer` | Mobile web and specific compact layouts. |
| **Containers** | `ytm-item-section-renderer`, `ytd-rich-shelf-renderer` | Shelves and sections containing shorts/videos. |

### Menu DOM Variants (New + Legacy)

| Layer | Targeted DOM Elements | Notes |
| --- | --- | --- |
| **Dropdown Container** | `tp-yt-iron-dropdown`, `ytd-menu-popup-renderer` | Observer watches dropdown insertion + visibility changes. |
| **Menu List (New)** | `yt-list-view-model` | Newer YouTube menu structure; FilterTube injects a `yt-list-item-view-model`. |
| **Menu List (Legacy)** | `tp-yt-paper-listbox` | Older menu structure inside `ytd-menu-popup-renderer`. |
| **Injected Menu Item** | `yt-list-item-view-model`, `ytd-menu-service-item-renderer` | FilterTube inserts whichever matches the detected menu structure. |
| **Fallback Popover** | `.filtertube-fallback-menu-slot`, `.filtertube-playlist-menu-fallback-btn`, `.filtertube-playlist-menu-fallback-popover` | Used when native watch-row menu identity is weak or unavailable; follows the custom fallback contract above. |

**Technical Note:**
The dropdown observer lives in `js/content/block_channel.js` and uses a `MutationObserver` to detect when a dropdown container (typically `tp-yt-iron-dropdown`) is added or becomes visible. It traces back to the `lastClickedMenuButton` to identify the parent video card from the list above, then calls `content_bridge.js:injectFilterTubeMenuItem(dropdown, card)`.

Inside `injectFilterTubeMenuItem`, FilterTube waits for YouTube to populate either the **new menu list** (`yt-list-view-model`) or the **legacy menu list** (`tp-yt-paper-listbox` / `ytd-menu-popup-renderer`) before inserting the menu entry. For Shorts, an asynchronous background fetch is often required to resolve the channel handle/ID from the video URL.

### Search Artist Top Card (2026 update)

| Renderer / Host | Surface | FilterTube Handling |
| --- | --- | --- |
| `yt-official-card-view-model` | YouTube search artist/music top card | Included in DOM fallback card selectors and channel extraction paths (handle + nested channel ID fallback). |

Notes:
- This renderer can expose the handle in header metadata (`@handle`) while nested lockups carry UC IDs.
- FilterTube now treats this card as a first-class block target for handle, channel ID, and keyword matching.

---

## v3.2.1 Implementation Summary

### ✅ Completed v3.2.1 Enhancements

| Feature | Implementation Status | Key Files |
| --- | --- | --- |
| **Proactive Network Interception** | ✅ Complete | `js/seed.js#stashNetworkSnapshot`, `js/injector.js` |
| **Avatar Stack Collaboration Detection** | ✅ Complete | `js/injector.js#extractFromAvatarStackViewModel`, `js/filter_logic.js` |
| **Topic Channel Support** | ✅ Complete | `js/render_engine.js#isTopicChannel`, `js/background.js` |
| **Post-Block Enrichment** | ✅ Complete | `js/background.js#schedulePostBlockEnrichment` |
| **Enhanced Kids Video Support** | ✅ Complete | `js/filter_logic.js`, `js/content/dom_extractors.js` |
| **Mix Card Exclusion** | ✅ Complete | `js/content_bridge.js#isMixCardElement` |
| **Enhanced CORS Handling** | ✅ Complete | `js/background.js#fetchChannelInfo` |

### 🎯 v3.2.1 Architecture Impact

- **Zero-Network Operation**: Most channel identity now resolved from stashed snapshots
- **Improved Collaboration Detection**: Avatar stacks provide better collaborator extraction
- **Better Error Recovery**: Multiple fallback strategies for channel resolution
- **Enhanced Performance**: Reduced network calls through proactive data stashing
- **Topic Channel Awareness**: Special handling for auto-generated YouTube channels

### 📋 Tags Still Under Investigation

| Renderer/Component | Current Status | Investigation Needed |
| --- | --- | --- |
| `compactAutoplayRenderer` | ⚠️ **STILL MISSING** | Add extraction paths for autoplay modules |
| `expandableMetadataRenderer` | ⚠️ **STILL MISSING** | AI summary text filtering requirements |
| `channelSubMenuRenderer` | ⚠️ **STILL MISSING** | Playlist menu text filtering needs |
| `watchCardRHPanelRenderer` | ⚠️ **STILL MISSING** | Right-hand hero layout mapping |
| `horizontalCardListRenderer` | ⚠️ **STILL MISSING** | Album shelf refinement chips |
| `watchCardHeroVideoRenderer` | ⚠️ **STILL MISSING** | Hero watch card extraction |
| `watchCardSectionSequenceRenderer` | ⚠️ **STILL MISSING** | Vertical hero list container |

### ✅ **RECENTLY IMPLEMENTED** (Previously Missing)

| Renderer/Component | Previous Status | Current Status | Notes |
| --- | --- | --- | --- |
| `continuationItemRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Comment continuations @js/seed.js#546 |
| `itemSectionRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Comment section removal @js/seed.js#377 |
| `twoColumnWatchNextResults` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Watch page structure @js/filter_logic.js#813 |
| `watchCardRichHeaderRenderer` | ⚠️ Missing | ✅ **IMPLEMENTED v3.2.1** | Universal watch cards @js/filter_logic.js#361 |
| `backstagePollRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Poll questions @js/filter_logic.js#472 |
| `backstageQuizRenderer` | ❌ Not parsed | ✅ **IMPLEMENTED v3.2.1** | Quiz questions @js/filter_logic.js#481 |
| `menuRenderer` | ℹ️ UI only | ✅ **IMPLEMENTED v3.2.1** | Menu navigation @js/content_bridge.js#3901 |
| `ticketShelfRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Ticket shelves @js/filter_logic.js#422 |
| `podcastRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Podcast content @js/filter_logic.js#425 |
| `richShelfRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Rich shelves @js/filter_logic.js#438 |
| `channelVideoPlayerRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Channel videos @js/filter_logic.js#444 |
| `compactRadioRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Compact radio @js/filter_logic.js#419 |
| `relatedChipCloudRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Related chips @js/filter_logic.js#365 |
| `chipCloudRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Chip clouds @js/filter_logic.js#369 |
| `chipCloudChipRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Individual chips @js/filter_logic.js#372 |
| `secondarySearchContainerRenderer` | ❌ Not documented | ✅ **IMPLEMENTED v3.2.1** | Search container @js/filter_logic.js#388 |

### 🔍 Future Monitoring Points

1. **AI & Experimental Features**: Monitor `yt-button-view-model` for "Ask" button and other AI features
2. **Badge Text Evolution**: Watch for new badge types in `yt-thumbnail-overlay-badge-view-model`
3. **Chip Cloud Expansion**: Monitor feed filter chips for potential filtering requirements
4. **Mobile Layout Changes**: Continue validating mobile-specific renderers and DOM structures
