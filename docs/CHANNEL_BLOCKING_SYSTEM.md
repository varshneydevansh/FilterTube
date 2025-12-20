# Channel Blocking System (Current State)

## 0. Goal & Non-Goals

### Goal
FilterTube must be able to:
- Identify the **channel identity** for a piece of content (preferably a stable **UC channel ID**, and also capture the **@handle** when available).
- Persist blocked channels in extension storage.
- Hide (and optionally keyword-filter) all content attributable to those blocked channels.
- Work reliably across YouTube surfaces (Home, Search, Shorts, Watch, etc.), including SPA navigation and DOM recycling.

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
   - Used for Shorts. Since many Shorts cards lack identity, we store the mapping after the first successful resolution so it works offline/instantly on next load.

### 2.4 Custom URL normalization (`/c/Name`, `/user/Name`)
- All worlds call into the helpers in `js/shared/identity.js` to normalize canonicalBaseUrl strings into predictable keys (`c/<slug>` or `user/<slug>`, percent-decoding as needed).
- `background.js:fetchChannelInfo()` now fetches `/c/<slug>` or `/user/<slug>` directly and records the resulting UC ID back into `channelMap`.
- `content_bridge.js` and `filter_logic.js` both consult `channelMap` before falling back to network, so DOM-only custom URL cards still hide immediately once a mapping is learned.
- Prefetch (section 5.4) persists any newly learned mapping into `videoChannelMap`, so future encounters are zero-network even on poor connections.

---

## 3. Data Sources for Channel Info (Where IDs/Handles Come From)

FilterTube uses several sources, prioritized differently depending on surface.

### 3.1 DOM extraction (Isolated World)
- `content_bridge.js` attempts to extract channel metadata from the DOM card.
- On **Search** page, channel name is often in `#channel-info ytd-channel-name a`, while other parts (thumbnail overlays) may contain misleading text.
- On **Home** page (lockup view-model), channel link may be `href="/@handle"` or `href="/channel/UC..."`.
- On some surfaces, DOM only has **byline name** (no handle/UC ID).

### 3.2 `ytInitialData` deep search (Main World via `injector.js`)
- `content_bridge.js` sends `FilterTube_RequestChannelInfo` with `videoId`.
- `injector.js` searches `window.ytInitialData` for an object matching that `videoId` and extracts:
  - `browseEndpoint.browseId` (UC ID)
  - `browseEndpoint.canonicalBaseUrl` (handle)
  - byline run `text` (channel name)

This is the most reliable “no-network” source when YouTube actually supplies the browse endpoint.

### 3.3 `/@handle/about` scrape (network)
- Historically used to resolve `@handle -> UC ID` by fetching:
  - `https://www.youtube.com/@<handle>/about`
- Can fail when:
  - The handle URL is broken on YouTube (404), even though the same channel may exist under UC ID.
  - The handle includes unicode/percent-encoding and gets normalized incorrectly.

### 3.4 Shorts page fetch (network)
- For Shorts cards that often lack channel identity in DOM:
  - Fetch `https://www.youtube.com/shorts/<videoId>`
  - Parse embedded `ytInitialData` / header renderers / canonical links.
- Used as a last resort when `ytInitialData` in the current page context doesn’t help.

---

## 4. Blocking Flow (3-dot Menu → Persist → Hide)

### 4.1 Menu injection and click
- `js/content/block_channel.js` detects the overflow dropdown and resolves the associated card.
- It then calls `content_bridge.js:injectFilterTubeMenuItem(dropdown, videoCard)` to render the “Block channel” menu entry.
- On click, `content_bridge.js:handleBlockChannelClick(channelInfo, ...)` runs.

### 4.2 Resolve missing identifiers (best-effort)
- If only a handle is known, attempt to resolve UC ID via:
  - local cache / `channelMap`
  - network fetch (`/about`) if needed
- If initial background fetch fails with 404, attempt fallback:
  - `searchYtInitialDataForVideoChannel(videoId, expected...)`
  - `fetchChannelFromShortsUrl(videoId, requestedHandle)`

### 4.3 Persist in background
- `content_bridge.js` calls `addChannelDirectly()` → `chrome.runtime.sendMessage({ type: 'addFilteredChannel', ... })`
- `background.js:handleAddFilteredChannel()`:
  - validates input
  - prefers UC ID via `channelMap` when possible
  - calls `fetchChannelInfo()`
  - merges/updates existing channel entries
  - stores `filterChannels`

### 4.4 Refresh settings + re-run DOM fallback
After success:
- `content_bridge.js` calls `requestSettingsFromBackground()`
- Updates `currentSettings`
- Calls `applyDOMFallback(..., { forceReprocess: true })`

This is the mechanism intended to ensure the newly blocked channel hides immediately without requiring page refresh.

---

## 5. Filtering/Hiding Strategies (Why Different Surfaces Differ)

### 5.1 Data interception (Main World)
- `seed.js` intercepts YouTube JSON before render.
- `filter_logic.js` applies blocking rules to remove items from JSON.

**Important nuance:** For Search + Channel pages, engine filtering is sometimes skipped to allow DOM restore behavior, but the engine should still learn mappings ("harvest only").

### 5.2 DOM fallback (Isolated World)
- DOM fallback exists because YouTube can:
  - hydrate client-side
  - recycle DOM nodes
  - or render elements that bypass data interception.

DOM fallback must be careful about:
- identifying the correct container to hide (e.g., Shorts inside `ytd-rich-item-renderer`)
- not poisoning future matches with stale `data-filtertube-channel-*` attributes

### 5.3 Shorts special-case
Shorts are special because many Shorts cards do not expose UC IDs in DOM.
Therefore, the system is hybrid:
- hide immediately via DOM fallback
- resolve identity asynchronously (Shorts page fetch / about fetch / ytInitialData)
- persist mapping

### 5.4 Flash reduction & prefetch (Dec 2025 hardening)
- **Observer & queue parameters** (all in `js/content_bridge.js`):
  - IntersectionObserver with `rootMargin: 400px 0px 800px 0px` and `threshold: 0` so we start resolving ~1–2 viewports before a card becomes visible.
  - At most 60 cards are observed per scan (`attachPrefetchObservers`) to keep overhead low on long feeds.
  - Prefetch queue is capped at 10 pending entries, concurrency at 2, and each fetch has a 5 s timeout. The queue pauses automatically when the tab is hidden.
- **Handle → UC pre-stamp**:
  - `queuePrefetchForCard()` first calls `resetCardIdentityIfStale()` / `getValidatedCachedCollaborators()` to clear recycled DOM nodes.
  - If the card already exposes a handle, we consult `channelMap` immediately (`resolveIdFromHandle`). On a hit we stamp the UC ID, persist it via `persistVideoChannelMapping()`, and skip any network fetch.
- **Network fallback path**:
  - Shorts cards hit `fetchChannelFromShortsUrl()` (background streaming fetch with early abort); everything else calls `fetchChannelFromWatchUrl()`.
  - Results are merged with any known handle/customUrl before stamping to maximize UC coverage.
- **Double refilter**: every call to `stampChannelIdentity()` fires `applyDOMFallback(null)` twice (0 ms and ~60 ms later) to catch late paints/layout settle. Collaboration stamping (`applyResolvedCollaborators`, `applyCollaboratorsByVideoId`) does the same with `{ forceReprocess: true }`.
- **Stale cleanup & collaboration sync**:
  - `resetCardIdentityIfStale()` drops all FilterTube attributes if `data-filtertube-video-id` mismatches the current card videoId.
  - `getValidatedCachedCollaborators()` ensures collaboration metadata matches the current video; otherwise it clears cached rosters and re-requests dialog/main-world data.
  - `propagateCollaboratorsToMatchingCards()` reuses resolved rosters across recycled cards, so collaborator-heavy videos hide instantly after the first resolution.

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

### 10.3 Shorts shelf / Shorts cards

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

### 10.4 Community posts (ytd-post-renderer)

- **Container**
  - `ytd-post-renderer`

- **Identity source**
  - `#author-text` / `#author-thumbnail a` links.
  - Handle extracted from `href` via `extractRawHandle()`.

### 10.5 Collaboration videos

- **Detection**
  - `#attributed-channel-name` is used as a collaboration signal.

- **Identity model**
  - A collaboration card produces:
    - a primary channel (first collaborator)
    - `allCollaborators[]` with best-effort `{name, handle, id}` for each collaborator

- **Enrichment path**
  - Isolated world gathers best-effort collaborator list from DOM.
  - Main world (`injector.js`) can extract collaborator list from `ytInitialData` and/or DOM hydration.

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

