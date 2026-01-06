# Channel Blocking System (v3.1.6)

## 0. Goal & Non-Goals

### Goal

FilterTube must be able to:

- Identify **channel identity** for a piece of content (preferably a stable **UC channel ID**, and also capture **@handle** when available).
- Persist blocked channels in extension storage.
- Hide (and optionally keyword-filter) all content attributable to those blocked channels.
- Work reliably across YouTube surfaces (Home, Search, Shorts, Watch, Kids), including SPA navigation and DOM recycling.
- Provide accurate channel names in 3-dot menus, upgrading from UC IDs/handles to human-readable names.

### Non-goals (for this doc)

- This document does **not** implement new behavior.
- Watch-page playlist specifics are documented elsewhere and will be handled as a separate workstream.

---

## 1. Execution Worlds & Why They Matter

FilterTube runs in multiple JavaScript “worlds”:

- **Background** (`js/background.js`)
  - Owns persistence (Chrome storage) and network fetches that shouldn’t depend on page lifecycle.

- **Isolated World** (`js/content/*` + `js/content_bridge.js`)
  - Runs as content scripts.
  - Can access the DOM.
  - Cannot directly access `window.ytInitialData` (Main World objects) reliably.
  - `js/content/block_channel.js` detects 3-dot dropdown openings and resolves the clicked card.
  - `js/content/dom_fallback.js` implements `applyDOMFallback(...)` (hide/restore logic).
  - `js/content_bridge.js` renders menu entries and orchestrates block/persist/hide flows (and schedules DOM fallback reprocessing).

- **Main World** (`js/seed.js`, `js/filter_logic.js`, `js/injector.js`)
  - Runs in the page context.
  - Can access `window.ytInitialData` / `window.ytInitialPlayerResponse`.
  - Intercepts JSON responses early to avoid “flash of blocked content”.

This separation is the reason we have explicit cross-world message passing (via `window.postMessage`) between `content_bridge.js` and `injector.js`.

---

## 2. Channel Identity Model

- **UC ID** (e.g. `UCM6nZ84qXYFWPWzlO_zpkWw`)
  - Most stable identifier.
  - Many YouTube surfaces expose this in JSON (`browseEndpoint.browseId`).

- **@handle** (e.g. `@Santasmusicroom.Official`)
  - Human-friendly alias.
  - May be **percent-encoded** in URLs.

- **customUrl** (e.g. `c/VídeoseMensagens`, `user/LegacyName`)
  - Legacy custom URLs (pre-2022).
  - Often found in `browseEndpoint.canonicalBaseUrl`.
  - Stored as `c/slug` or `user/slug`.

### 2.2 Stored representations
In storage (background-managed `filterChannels`) channel entries can contain:
- `id`: UC ID
- `handle`: normalized handle used for matching
- `customUrl`: normalized legacy URL slug
- `handleDisplay`: UI/display handle
- `name`: channel name
- `originalInput`: what the user actually typed or clicked
- `filterAll`: boolean
- collaboration metadata

### 2.3 Persistence Maps
The system maintains two bidirectional lookup maps in local storage:

1. **`channelMap`**: `(handle | customUrl) <-> UC ID`.
   - Critical for converting aliases into stable UC IDs.
2. **`videoChannelMap`**: `videoId -> UC ID`.
   - Used for Shorts and watch-page playlist panels (and any surface where DOM metadata is incomplete).
   - Since many cards lack identity, we store the mapping after the first successful resolution so it works offline/instantly on next load.

### 2.4 Custom URL normalization (`/c/Name`, `/user/Name`)
- All worlds call into the helpers in `js/shared/identity.js` to normalize canonicalBaseUrl strings into predictable keys (`c/<slug>` or `user/<slug>`, percent-decoding as needed).
- `background.js:fetchChannelInfo()` now fetches `/c/<slug>` or `/user/<slug>` directly and records the resulting UC ID back into `channelMap`.
- `content_bridge.js` and `filter_logic.js` both consult `channelMap` before falling back to network, so DOM-only custom URL cards still hide immediately once a mapping is learned.
- Prefetch (section 5.4) persists any newly learned mapping into `videoChannelMap`, so future encounters are zero-network even on poor connections.

---

## 3. Data Sources for Channel Info (Where IDs/Handles Come From)

FilterTube uses several sources, prioritized differently depending on surface and profile.

### 3.1 DOM extraction (Isolated World)
- `content_bridge.js` attempts to extract channel metadata from DOM card.
- On **Search** page, channel name is in `#channel-info ytd-channel-name a`, while thumbnail overlays may contain misleading text.
- On **Home** page (lockup view-model), channel link may be `href="/@handle"` or `href="/channel/UC..."`.
- On **Shorts** cards, often only handle/videoId is available initially.
- On **Kids** pages, extraction follows native UI patterns (`ytk-compact-video-renderer`).

### 3.2 `ytInitialData` deep search (Main World via `injector.js`)
- `content_bridge.js` sends `FilterTube_RequestChannelInfo` with `videoId`.
- `injector.js` searches `window.ytInitialData` for an object matching that `videoId` and extracts:
  - `browseEndpoint.browseId` (UC ID)
  - `browseEndpoint.canonicalBaseUrl` (handle)
  - byline run `text` (channel name)

This is most reliable "no-network" source when YouTube supplies browse endpoint.

### 3.3 Network fetch strategies (profile-aware)

#### YouTube Main:
- **Watch page fetch**: `https://www.youtube.com/watch?v=<videoId>` for standard videos
- **Shorts page fetch**: `https://www.youtube.com/shorts/<videoId>` for Shorts resolution
- **Channel about fetch**: `https://www.youtube.com/@<handle>/about` (last resort)

#### YouTube Kids:
- **Kids watch fetch**: `https://www.youtubekids.com/watch?v=<videoId>` (CORS-limited)
- Falls back to main-world extraction when Kids fetch fails

### 3.4 Caching layers
- **`videoChannelMap`**: `videoId -> UC ID` mappings for persistence
- **`channelMap`**: `(handle | customUrl) <-> UC ID` bidirectional lookups
- **Session caches**: In-memory caches for active browsing session
- **Race-safe updates**: Debounced writes to prevent storage conflicts

---

## 4. Blocking Flow (3-dot Menu → Resolve → Persist → Hide)

### 4.1 Menu injection and click detection
- `js/content/block_channel.js` detects overflow dropdown opening and resolves associated card.
- It calls `content_bridge.js:injectFilterTubeMenuItem(dropdown, videoCard)` to render "Block channel" menu entry.
- On click, `content_bridge.js:handleBlockChannelClick(channelInfo, ...)` runs.

### 4.2 Identity resolution pipeline (v3.1.6 enhanced)

#### Initial extraction (synchronous):
```javascript
// Extract what's available from DOM
let initialChannelInfo = extractChannelFromCard(videoCard);
// Returns: { id?, handle?, name?, videoId?, needsFetch? }
```

#### Background enrichment (asynchronous):
```javascript
// Kick off enrichment if needed
const fetchPromise = (async () => {
    let enrichedInfo = initialChannelInfo;
    
    // Determine if network fetch is needed
    const needsEnrichment = !enrichedInfo?.id || isHandleLike(enrichedInfo?.name);
    
    if (needsEnrichment && enrichedInfo?.videoId) {
        // Route to appropriate fetch handler
        if (isKidsUrl) {
            enrichedInfo = await performKidsWatchIdentityFetch(videoId);
        } else if (enrichedInfo.fetchStrategy === 'shorts') {
            enrichedInfo = await fetchChannelFromShortsUrl(videoId);
        } else {
            enrichedInfo = await fetchChannelFromWatchUrl(videoId);
        }
    }
    
    return enrichedInfo;
})();
```

#### Label update (upgrade placeholders):
```javascript
// Update menu label when enrichment completes
fetchPromise.then(finalChannelInfo => {
    if (!finalChannelInfo) return;
    
    // Upgrade UC IDs, Mix titles, metadata strings to real names
    updateInjectedMenuChannelName(dropdown, finalChannelInfo);
});
```

### 4.3 Profile-aware persistence
- **Main profile**: Stores in `filterChannels` array
- **Kids profile**: Stores in `ftProfilesV3.kids.blockedChannels`
- `background.js:handleAddFilteredChannel()` routes based on sender URL:
```javascript
const isKids = isKidsUrl(sender.tab?.url);
const targetProfile = isKids ? 'kids' : 'main';

if (targetProfile === 'kids') {
    // Store in kids profile
    await addToKidsProfile(channelData);
} else {
    // Store in main profile
    await addToMainProfile(channelData);
}
```

---

## 5. Filtering/Hiding Strategies (Why Different Surfaces Differ)

### 5.1 Data interception (Main World) - Zero Flash
- `seed.js` intercepts YouTube JSON before render via `fetch` and `XMLHttpRequest` hooks.
- `filter_logic.js` applies blocking rules to remove items from JSON.
- **XHR endpoints monitored**:
  - `/youtubei/v1/search` - Search results
  - `/youtubei/v1/browse` - Home feed, channel pages
  - `/youtubei/v1/next` - Infinite scroll pagination
  - `/youtubei/v1/guide` - Sidebar recommendations
  - `/youtubei/v1/player` - Video player data

**Important nuance**: For Search + Channel pages, engine filtering is sometimes skipped to allow DOM restore behavior, but the engine should still learn mappings ("harvest only").

### 5.2 DOM fallback (Isolated World) - Visual Guard
- DOM fallback exists because YouTube can:
  - hydrate client-side after initial render
  - recycle DOM nodes during SPA navigation
  - render elements that bypass data interception.

DOM fallback must be careful about:
- identifying the correct container to hide (e.g., Shorts inside `ytd-rich-item-renderer`)
- not poisoning future matches with stale `data-filtertube-channel-*` attributes
- handling Mix/playlist cards where video titles might be confused with channel names

### 5.3 Profile-specific handling

#### YouTube Main:
- Standard filtering engine applies
- 3-dot menu uses full enrichment pipeline
- All surface types supported (Home, Search, Watch, Shorts, Posts)

#### YouTube Kids:
- Native UI integration via passive event listeners
- Limited CORS handling for network requests
- Separate storage namespace (`ftProfilesV3.kids`)
- DOM fallback uses videoChannelMap mappings from Kids browse/search

### 5.4 3-Dot Menu Label Resolution (v3.1.6)

The 3-dot menu now intelligently upgrades placeholder labels to real channel names:

#### Placeholder detection:
```javascript
// Detect values that should be upgraded
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

#### Surface-specific extraction:

**Shorts cards:**
- Initial: Often only `@handle` or `videoId`
- Enrichment: Fetch from `/shorts/<videoId>` page
- Result: Human-readable channel name replaces handle

**Mix/Playlist cards:**
- Detection: `isMixCardElement()` identifies by URL patterns (`list=RDMM`) or badge text
- Extraction: Never use video title; extract from actual channel links
- Result: Real channel name, not "Mix - Artist Name"

**Watch page right pane:**
- Challenge: Playlist items show metadata like "Title • 1.2M views • 2 days ago"
- Solution: Extract from dedicated channel links, ignore metadata text
- Result: Channel name only, clean display

#### Label update flow:
```javascript
function updateInjectedMenuChannelName(dropdown, channelInfo) {
    const current = nameEl.textContent.trim();
    const next = pickMenuChannelDisplayName(channelInfo, {});
    
    // Only replace placeholders with better names
    if (isUcIdLike(current) || isProbablyNotChannelName(current)) {
        nameEl.textContent = next;
    }
}
```

---

## 6. Known Failure Modes (Current)

### 6.1 YouTube handle URLs returning 404
Example: `@Santasmusicroom.Official` appears in search page UI, but opening `/@Santasmusicroom.Official/about` returns 404.

Impact:
- handle → UC resolution fails.
- blocking may succeed only after refresh if UC mapping is learned later via other channels.
- mitigation (Dec 2025):
  - **Mapping Sync**: `background.js` listens for changes to `channelMap` and immediately re-compiles settings for all tabs. New mappings are broadcast instantly.
  - **videoChannelMap**: Shorts mappings are cached per video ID to bypass network resolution on repeat encounters.
  - **Truth in Extraction**: `identity.js` provides `extractCustomUrlFromPath` to ensure `/c/` and `/user/` paths are parsed identically in all worlds.

### 6.2 Unicode / percent-encoded handles
Example: `@CorridosdeOroNorte%C3%B1os`.

Risk areas:
- Regex patterns like `/@([\w.-]+)/` are ASCII/underscore biased and can truncate or fail.
- If handle normalization drops unicode glyphs, stored handle won’t match DOM/JSON handle.

Mitigation (current):
- Handle parsing/normalization is centralized in `js/shared/identity.js` and is percent-decoding + unicode-aware.

### 6.3 Collaboration ambiguity
- A single video can belong to multiple collaborators.
- If resolution selects the wrong collaborator, we can store a wrong UC ID.
- This is why `expectedName` / `expectedHandle` hints exist.

### 6.4 Stale cached card attributes
- Cards may be recycled by YouTube SPA.
- If `data-filtertube-channel-id/handle/name` survives recycling, future matching can be wrong.

Mitigation (Dec 2025):
- `resetCardIdentityIfStale()` detects mismatched `data-filtertube-video-id` and clears all FilterTube attrs before the card is queued for prefetch.
- Collaboration cards additionally call `getValidatedCachedCollaborators()` to wipe stale collaborator rosters before requesting dialog data.

### 6.5 Custom URL (`/c/Name`, `/user/Name`) handling gaps
- Legacy channels often expose only `canonicalBaseUrl` (e.g., `/c/VídeoseMensagens`).
- Historically inconsistencies between background/content extraction caused missing UC mappings.

Mitigation:
- `filter_logic.js`, `content_bridge.js`, and `background.js` now normalize custom URLs into `c/<slug>` or `user/<slug>` via shared helpers (`identity.js`) and push them into `channelMap`.
- When a card surfaces only a custom URL, prefetch resolves via `channelMap` before any network fetch and persists the UC ID in `videoChannelMap` so future encounters hide immediately (even offline).

Remaining gap:
- If a brand-new `/c/` slug is encountered and no UC mapping exists anywhere, we still need to fetch the channel page (`background.js:fetchChannelInfo`). This flow is unchanged; just be aware of potential latency.

---

## 7. Duplication & Centralization Gaps

### 7.1 Handle parsing exists in multiple places
- `content_bridge.js` has unicode/percent decode logic (`extractRawHandle`, `normalizeHandleValue`).
- `injector.js` now has a similar-but-separate unicode/percent decode helper (`extractRawHandle`).
- `filter_logic.js` has its own `normalizeChannelHandle()` logic.

This duplication is a likely root cause of “works in one surface, fails in another”.

### 7.2 Recommended future refactor direction (not implemented here)
- Create a single shared “identity utilities” module (conceptually) with:
  - handle extraction (unicode + percent decode)
  - normalization rules (comparison vs display)
  - UC ID extraction
- Then port:
  - `injector.js` handle parsing
  - `filter_logic.js` handle parsing
  - `content_bridge.js` handle parsing
  to the same semantics.

---

## 8. Open Questions / Decisions (Before Further Fixes)

- Should we treat **UC ID as the only canonical matching key**, and treat handles purely as aliases?
- When `ytInitialData` provides `browseId`, should we always trust it over handle URLs?
- For handle-only situations, do we prefer:
  - `ytInitialData` lookup by `videoId`
  - over `/@handle/about` fetch
  - over Shorts-page fetch
  ?
- What is the expected behavior when a channel can only be identified by handle (no UC ID available anywhere)?

---

## 9. Next Implementation Targets (Derived from Current State)

- Unify unicode-safe handle parsing in `injector.js` and any regex use.
- Relax/adjust `expectedHandle`/`expectedName` matching rules so they prevent wrong-collab matches without rejecting valid 404/unicode cases.
- Ensure “block succeeded” always results in immediate hide without requiring hard refresh:
  - guarantee that `applyDOMFallback(forceReprocess)` sees the new filter entry
  - guarantee that the engine/harvester learns the mapping where available

---

## 10. Surface-by-Surface: Where Channel Identity Comes From (Concrete)

This section answers:
- **Which element types exist on the page?**
- **Where do we read `@handle` / UC ID / name from?**
- **Which file implements that logic?**

### 10.1 Home feed (Rich Grid)

- **Primary card containers**
  - `ytd-rich-item-renderer`
  - `ytd-rich-grid-media`
  - Modern UI variants: `yt-lockup-view-model`, `yt-lockup-metadata-view-model`

- **Extraction path**
  - `js/content/dom_fallback.js:applyDOMFallback()` enumerates `VIDEO_CARD_SELECTORS` and calls:
    - `extractChannelMetadataFromElement(...)` (best-effort id/handle)
    - `extractCollaboratorMetadataFromElement(...)` for collaborations
  - The engine (`seed.js` + `filter_logic.js`) may pre-stamp `data-filtertube-channel-handle/id` onto DOM nodes.

- **Common handle/ID sources**
  - `href` like `"/@Handle"` or `"/channel/UC..."`
  - `browseEndpoint` data (from JSON interception → data attributes)

### 10.2 Search results (ytd-video-renderer)

- **Primary card container**
  - `ytd-video-renderer`

- **Extraction pitfall**
  - YouTube often places `data-filtertube-channel-handle` on a **thumbnail link**, which may contain overlay text (duration, “Now playing”).

- **Extraction priority (what the code actually does)**
  - `content_bridge.js:extractChannelFromCard()`:
    - If `data-filtertube-channel-handle/id` exist, it **still prefers** the real channel name element:
      - `#channel-info ytd-channel-name a` (or equivalent)
    - Handle is parsed from `href` using `extractRawHandle()`.

### 10.3 Watch page (main video, right rail, playlist, Shorts shell)

- **Primary containers**
  - `ytd-watch-metadata` / `ytd-video-owner-renderer` for the active video
  - Right-rail `yt-lockup-view-model`, `ytd-compact-video-renderer`, and new `watchCard*` renderers
  - Playlist queue rows (`ytd-playlist-panel-video-renderer`)
  - Embedded Shorts tiles rendered inside the watch column

- **3-dot menu / collaboration status (v3.1.0)**
  - The watch page now reuses the same collaborator roster cache as Home/Search, so any card with ≥2 collaborators immediately renders per-channel menu rows (plus “Block All”) with accurate names/handles.
  - Shorts tiles opened inside the watch shell mark `fetchStrategy: 'shorts'`; we run the `/shorts/<id>` fetch before falling back to `fetchChannelFromWatchUrl`, which is why collaborator menus work even on Shorts surfaced in the watch experience.
  - Non-collaboration rows still show the generic “Block Channel” label because the synchronous DOM scrape rarely includes the channel name. Follow-up work is tracked to probe `ytd-watch-metadata`/`ytd-video-owner-renderer` synchronously so we can display names everywhere.

- **Playlist/mix gap (still open)**
  - After a hard refresh the playlist/mix queue can leak hidden videos when SPA navigation rehydrates stale rows; the hidden track may briefly play (~1–1.5 s) or reappear after pressing Next/Prev.
  - Root causes and reproduction steps remain documented in `docs/WATCH_PLAYLIST_BREAKDOWN.md`; that file still tracks the refilter crash/restore bugs to resolve post-3.1.0.

### 10.4 Shorts shelf / Shorts cards

- **Containers**
  - `ytm-shorts-lockup-view-model` / `ytm-shorts-lockup-view-model-v2`
  - Sometimes Shorts appear as a full `ytd-video-renderer` marked by FilterTube using `data-filtertube-short="true"`.

- **Why Shorts are special**
  - Many Shorts cards do not reliably expose UC ID in DOM.
  - So FilterTube uses a three-phase approach:
    - **Immediate hide** (DOM fallback using `videoChannelMap` if known).
    - **Asynchronous Enrichment**: `enrichVisibleShortsWithChannelInfo()` scans current visible Shorts, fetches missing IDs, and updates the maps.
    - **Identity Resolution**: `https://www.youtube.com/shorts/<videoId>` fetch as a last resort.

- **Key functions**
  - `content_bridge.js:extractChannelFromCard()` → returns `{videoId, needsFetch: true}` for Shorts when needed.
  - `content_bridge.js:fetchChannelFromShortsUrl(videoId, requestedHandle)` parses the Shorts HTML.

### 10.5 Community posts (ytd-post-renderer)

- **Container**
  - `ytd-post-renderer`

- **Identity source**
  - `#author-text` / `#author-thumbnail a` links.
  - Handle extracted from `href` via `extractRawHandle()`.

### 10.6 Collaboration videos

- **Detection**
  - `#attributed-channel-name` is used as a collaboration signal.

- **Identity model**
  - A collaboration card produces:
    - a primary channel (first collaborator)
    - `allCollaborators[]` with best-effort `{name, handle, id}` for each collaborator

- **3-dot menu behavior (2+ collaborators)**
  - For collaboration cards, FilterTube injects one menu row per collaborator.
  - It also injects a final row:
    - **2 collaborators:** “Both Channels”
    - **3–6 collaborators:** “All N Collaborators”

- **Multi-select behavior (3–6 collaborators)**
  - When there are 3+ collaborators, FilterTube uses a **multi-step selection UI**:
    - Clicking an individual collaborator row **selects** it (does not immediately persist or hide).
    - The bottom row label becomes **“Done • Block X Selected”**.
    - Clicking **Done** persists *only the selected collaborators*.
  - For 2 collaborators, multi-select is not used (each row blocks immediately; “Both Channels” blocks both).

- **N collaborator limit**
  - The collaboration menu is currently capped to **6 total channels** (YouTube typically shows up to 5 collaborators + 1 uploader).
  - This is enforced in `content_bridge.js` so the menu stays usable and matches YouTube’s UI expectations.

- **Identity integrity (important)**
  - When blocking a collaborator, FilterTube treats the following as identity keys:
    - `id` (UC ID)
    - `handle` (@handle)
    - `customUrl` (`c/<slug>` or `user/<slug>`)
  - FilterTube avoids persisting “mixed identity” entries (example: UC ID from collaborator A but @handle from collaborator B).
  - If a collaborator is only known via legacy `/c/` or `/user/` URLs, the system can still persist and later resolve that identity via `channelMap`.

- **Enrichment path**
  - Isolated world gathers best-effort collaborator list from DOM.
  - Main world (`injector.js`) can extract collaborator list from `ytInitialData` and/or DOM hydration.

- **Surface differences: Home vs Search vs Shorts**
  - **Home (lockup cards)**
    - Collaboration display may only show names.
    - We attempt:
      - lockup renderer data (`showDialogCommand` list items),
      - avatar stacks,
      - metadata rows,
      - and finally Main World `ytInitialData` lookup by `videoId`.
  - **Search (ytd-video-renderer)**
    - Collaboration display is often under `#attributed-channel-name`.
    - The first collaborator often has a direct `/@handle` link; others require dialog/ytInitialData.
  - **Shorts**
    - Shorts cards can be handle-only; collaboration extraction is more limited.
    - If needed, we resolve identity via `/shorts/<id>` or `/watch?v=<id>` fallbacks and update `videoChannelMap`.

---

## 11. Hide/Restore Pipeline (Where Hiding Actually Happens)

This section answers “where is content hidden and by what mechanism?”

### 11.1 Data interception (no-flash)

- **Where:** Main world
  - `seed.js` intercepts JSON payloads and runs `filter_logic.js` before YouTube renders.
- **What it does:** removes/filters items in JSON so they never render.

### 11.2 DOM fallback (visual guard)

- **Where:** Isolated world (`js/content/dom_fallback.js` + `content_bridge.js`)
- **Entry point:** `applyDOMFallback(settings, {forceReprocess})`
  - Enumerates `VIDEO_CARD_SELECTORS`
  - Extracts:
    - title text
    - channel metadata (`extractChannelMetadataFromElement`)
    - collaborator metadata (`extractCollaboratorMetadataFromElement`)
  - Calls `shouldHideContent(...)`
  - Applies hiding via `toggleVisibility(target, shouldHide, reason)`

### 11.3 “Block Channel” click immediate hide

- **Where:** `content_bridge.js:handleBlockChannelClick(...)`
- **Behavior:** once a channel is successfully added to storage, it hides:
  - the clicked card
  - and all visible duplicates of the same video in the current surface

### 11.4 Why you see “RESTORED” in logs

- `applyDOMFallback()` runs repeatedly (SPA navigation + storage updates).
- If items no longer match filters (or we reprocess), `toggleVisibility(..., false)` restores them.
- The “Hide/Restore Summary” is debug accounting from `filteringTracker`.

---

## 12. Why Different Pages Have Different Code Paths

This is not accidental duplication; it’s forced by:

- **World separation**
  - `content_bridge.js` cannot reliably read `window.ytInitialData`.
  - So it asks `injector.js` via `postMessage`.

- **YouTube renderer diversity**
  - Search ≠ Home ≠ Shorts ≠ Posts.
  - Each has different DOM shape and different JSON structures.

The real problem today is not that these paths exist, but that:
- we had **different handle parsers**
- and some paths did **network resolution** at the wrong time.

---

## 13. Santa 404 + “Wrong handle” (Root Causes + Fixes)

This section maps directly to the logs you shared.

### 13.1 Why Santa still hit 404

What you observed:
- The UI shows `@Santasmusicroom.Official`.
- Fetching `/@Santasmusicroom.Official/about` returns 404 (YouTube bug).

Previously:
- Background refused to store the channel if `fetchChannelInfo()` failed.

Now:
- Background allows storing a **handle-only** blocked channel when the error looks like 404.
  - This makes “block + hide now” work even without UC ID.

### 13.2 Why we still “resolved” the wrong handle sometimes

The Shorts HTML contains lots of `ytInitialData` objects.
Our generic deep scan (`extractChannelFromInitialData`) can pick up unrelated byline runs and return e.g. `@TronLegacyScore`.

Now:
- When we have an **expected handle**, we skip that deep scan and rely on:
  - engagement panel
  - overlay header
  - canonical/owner links

### 13.3 Why mapping wasn’t used even when it existed

There was a caching bug in `content_bridge.js:fetchIdForHandle()`:
- If a handle was being resolved and got marked `PENDING`, later calls returned early and did not consult `channelMap`.

Now:
- Even if a handle is pending, we still consult `channelMap` first.
- If `/about` returns non-OK (including 404), we clear the pending marker.

### 13.4 Why menu background fetch spammed /about

The menu injection background enrichment should not do network fetches.

Now:
- Menu “background fetch” uses `fetchIdForHandle(handle, { skipNetwork: true })`.

