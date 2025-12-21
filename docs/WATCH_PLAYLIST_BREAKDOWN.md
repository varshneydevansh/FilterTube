# Watch Playlist – Current Implementation (v3.1.1)

## Goal

- Ensure all videos from blocked channels stay hidden inside the watch-page playlist panel (`/watch?v=...&list=...`) even after hard refresh and SPA navigation.
- Ensure Next/Prev/autoplay never lands on a blocked playlist item (no visible playback flash).


## How it works now

### 1) Hiding playlist panel items (DOM fallback)

- Playlist panel rows are scanned by `applyDOMFallback()` in `js/content/dom_fallback.js`.
- For playlist items, channel extraction prefers `#byline` (not `#text`) to avoid accidentally reading the video title.
- When a playlist row is hidden, FilterTube hides the wrapper container (`ytd-playlist-panel-video-wrapper-renderer`) when present to avoid leaving a “clickable ghost row”.


### 2) Deterministic identity for playlist items (prefetch → videoChannelMap)

- Many playlist rows only expose channel *name* (no handle/UC id). For deterministic filtering, FilterTube enriches playlist items using the same prefetch/hydration queue used for Shorts.
- `js/content_bridge.js`:
  - Attaches an `IntersectionObserver` prefetcher.
  - On watch pages with `list=...`, playlist panel rows are prioritized for observation so they get enriched early.
  - Prefetch resolves `videoId -> channelId` and persists it into `videoChannelMap`, enabling reliable “same-channel” hiding (e.g., multiple Pitbull entries).


### 3) No-flash skipping for blocked Next/Prev/autoplay

- `js/content/dom_fallback.js` installs a capture-phase click interceptor on `.ytp-next-button` / `.ytp-prev-button`.
- If the immediate next/prev playlist row is already hidden, the click is intercepted and redirected to the next visible playlist item.
- A second guard runs after each DOM fallback pass: if the currently selected playlist item is hidden (autoplay or external navigation), FilterTube immediately redirects to the next visible item.


## Notes on matching when playlist rows have no identity

- If a playlist item does not expose `UC...` or `@handle`, FilterTube uses a strict byline-name fallback match for playlist rows only.
- This is intentionally conservative to avoid false positives.


---

## Historical Notes (pre-v3.1.1)

### What the user sees
- Playlist items blocked by channel/keyword briefly play for ~1–1.5s before skipping.
- After several back/forward (prev/next) actions, blocked Pitbull items reappear and can play until another navigation.
- Refresh brings correct filtering again, but SPA navigation re-inserts blocked items.
- Console shows repeated `content_bridge.js:2758 Uncaught` during playlist refilter, plus many Seed/settings updates (noise in logs).

### Where the current logic lives
- Playlist skip + refilter pipeline: `initializePlaylistSkip`, `refilterPlaylistItems`, `checkAndSkipHiddenVideo`, observers for selection/content, safety net interval @js/content_bridge.js#2643-2894.
- Channel extraction for playlist panel cards prefers byline text and async Main World lookup fallback @js/content_bridge.js#3567-3628.
- Watch-page hide on channel block forces byline-only matching for playlist items to avoid cached corruption @js/content_bridge.js#4970-5114.

### Likely culprits (from logs and code)
1) **TypeError inside refilterPlaylistItems**  
   - Crash at line 2758 (`channelNames[filterId]?.toLowerCase()`) if `channelNames[filterId]` is not a string; this short-circuits the refilter loop, leaving items unmarked/visible @js/content_bridge.js#2715-2810.  
   - Repeated “`content_bridge.js:2758 Uncaught`” in logs aligns with this.

2) **Cached channel attributes can be stale/corrupted for playlist items**  
   - Comments already warn that data-filtertube-channel-* may inherit the currently playing video; logic tries to ignore them, but refilter still reads `data-filtertube-channel-*` for handle/id checks before byline-only enforcement @js/content_bridge.js#2715-2810.  
   - If a corrupt handle matches nothing, item stays visible; if it matches a different block, the wrong item hides.

3) **Skip guard can block re-skips**  
   - `skipInProgress` and `lastSkippedVideoId` stop loops, but if a hidden item becomes “visible” due to the refilter crash, playback can continue until the next navigation triggers a fresh refilter @js/content_bridge.js#2901-3010.

4) **Delay window before refilter**  
   - New items trigger a debounced refilter (100ms) and safety-net interval (2s). During SPA shuffles, a blocked item can remain selectable and play briefly before the hide/skip executes @js/content_bridge.js#2700-2894.

### Data gaps on compact renderers
- Playlist items often only expose byline (name), missing handle/ID. The code falls back to byline, but any non-string value in `channelNames` or corrupt cached attributes sabotages matching @js/filter_logic.js#480-500.

### Candidate fixes (to implement next)
1) **Harden refilter against non-string names**  
   - Guard `channelNames[filterId]` and any `toLowerCase` calls with `typeof === 'string'` to avoid crashing the whole refilter pass.
2) **Ignore cached handle/id for playlist items entirely**  
   - In `refilterPlaylistItems`, rely solely on byline + keyword; do not read `data-filtertube-channel-*` for playlists (consistent with later watch-page hide path).
3) **Zero-delay enforcement for selected item**  
   - When the selected item is hidden, immediately toggle visibility & skip without waiting for interval/debounce; consider forcing `toggleVisibility` on selected item before the click can render playback.
4) **Optional: normalize channelNames map on receive**  
   - When settings arrive, coerce `channelNames` values to strings to prevent future type errors.

### Why this matters for the reported playlist (Pitbull)
- A crash in refilter leaves multiple Pitbull entries unmarked, so they re-insert and can play until the next navigation or refresh.
- Even when hidden, the debounce/interval window allows 1–1.5s of playback before skip. Hardening the refilter and removing cached-attr reliance should close both the crash and the brief playback window.

---

## COMPREHENSIVE ANALYSIS (Dec 6, 2025 – Latest Logs)

### Test Playlist Structure
| Index | Video | Channel | Channel ID | Blocked? |
|-------|-------|---------|------------|----------|
| 1 | Stevie B feat. Pitbull - Spring Love 2013 | Kontor.TV | UCb3tJ5NKw7mDxyaQ73mwbRg | NO |
| 2 | Pitbull - Feel This Moment ft. Christina Aguilera | Pitbull | UCv8nzwVPQDRjkPCkEsOdEwA | **YES** |
| 3 | Usher - DJ Got Us Fallin' In Love ft. Pitbull | Usher | UCaNrhBiXsXIM2epDl_kEzgQ | NO |
| 4 | Pitbull - Give Me Everything ft. Ne-Yo | Pitbull | UCv8nzwVPQDRjkPCkEsOdEwA | **YES** |
| 5 | Luis Fonsi - Despacito ft. Daddy Yankee | Luis Fonsi | UCxoq-PAQeAdk_zyg8YS0JqA | NO |

**Blocked Channels:** Pitbull (`UCv8nzwVPQDRjkPCkEsOdEwA`) and Shakira (`UCYLNGLIzMhRTi6ZOLjAPSmw`)

---

### What the Logs Reveal

#### 1. **Engine Filtering Works Correctly on Initial Load**
```
FilterTube (Filter): 🚫 Blocking channel: UCv8nzwVPQDRjkPCkEsOdEwA (matched filter: [object Object])
FilterTube (Filter): ✂️ Removed playlistPanelVideoRenderer at root.contents.twoColumnWatchNextResults.playlist.playlist.contents[1]
```
- The seed.js engine correctly removes Pitbull videos from the JSON **before** YouTube renders them.
- On fresh page load: 11 items blocked, ~60KB removed from response.

#### 2. **The Critical TypeError Crash**
```
content_bridge.js:2758 Uncaught TypeError: channelNames[filterId]?.toLowerCase is not a function
    at content_bridge.js:2758:57
    at NodeList.forEach (<anonymous>)
    at refilterPlaylistItems (content_bridge.js:2732:23)
```

**Root Cause:** Line 2758 in `refilterPlaylistItems`:
```javascript
if (filterId && channelNames[filterId]?.toLowerCase() === bylineLower) {
```

**Problem:** `channelNames[filterId]` can be an **object** (not a string), so calling `.toLowerCase()` on it throws.

**Impact:** The crash aborts the entire `forEach` loop, leaving remaining playlist items **unprocessed and visible**.

#### 3. **Massive Error Spam (100+ Uncaught errors)**
The logs show `content_bridge.js:2758 Uncaught` repeated **hundreds of times** because:
- The 2-second safety-net interval keeps calling `refilterPlaylistItems()`
- Each call crashes on the same line
- Items never get re-hidden

#### 4. **The Restore Logic Undoes Hiding**
```
FilterTube: Restored 9 playlist item(s) after filter removal
```

**Problem:** The `restorePlaylistItemsIfFilterRemoved()` function runs and **incorrectly restores** items because:
- It only uses `bylineText` for matching (correct approach)
- But the channel filter has `id` and `handle`, not `name`
- The byline shows "Pitbull" but the filter stores `UCv8nzwVPQDRjkPCkEsOdEwA` and `@Pitbull`
- Name matching fails → items get restored

#### 5. **Skip Logic Gets Stuck**
```
FilterTube: Skip already in progress, waiting...
FilterTube: Skip already in progress, waiting...
(repeated 20+ times)
```

**Problem:** `skipInProgress` is set to `true` but the 2-second timeout to reset it doesn't fire properly when crashes occur, causing a deadlock.

---

### The Three Failure Modes

#### Mode A: TypeError Crash Loop
1. User navigates back/forward in playlist
2. YouTube SPA re-renders playlist items
3. `refilterPlaylistItems()` is called
4. Crash at line 2758 on first item with non-string `channelNames` entry
5. Remaining items stay visible
6. 2-second interval retries → crashes again → infinite loop

#### Mode B: Incorrect Restore
1. `restorePlaylistItemsIfFilterRemoved()` runs
2. Checks if hidden items should still be hidden
3. Uses only `bylineText` ("Pitbull") for matching
4. Filter has `id: UCv8nzwVPQDRjkPCkEsOdEwA`, not `name: Pitbull`
5. No match found → item restored → Pitbull videos reappear

#### Mode C: Skip Deadlock
1. Hidden video becomes selected
2. `checkAndSkipHiddenVideo()` sets `skipInProgress = true`
3. Crash occurs before skip completes
4. `skipInProgress` never resets
5. All future skip attempts blocked

---

### Why Home/Search Work But Playlist Doesn't

| Feature | Home/Search | Watch Playlist |
|---------|-------------|----------------|
| Data source | `richGridRenderer` with full metadata | `playlistPanelVideoRenderer` with sparse data |
| Channel ID | Always present | Present in JSON, but DOM only has byline |
| Channel Handle | Always present | Sometimes missing |
| Channel Name | Always present | Only source in DOM |
| Filtering | Engine removes from JSON before render | Engine works, but DOM refilter crashes |
| Restore logic | Uses full metadata | Uses only byline → mismatch |

---

### Specific Code Culprits

#### Culprit 1: `refilterPlaylistItems()` Line 2758
```javascript
// BROKEN:
if (filterId && channelNames[filterId]?.toLowerCase() === bylineLower) {

// FIX:
const channelNameValue = channelNames[filterId];
const channelNameStr = typeof channelNameValue === 'string' ? channelNameValue : 
                       (channelNameValue?.name || channelNameValue?.handle || '');
if (filterId && channelNameStr && channelNameStr.toLowerCase() === bylineLower) {
```

#### Culprit 2: `restorePlaylistItemsIfFilterRemoved()` Lines 4624-4654
```javascript
// PROBLEM: Only uses bylineText for matching
const meta = {
    id: '',      // Empty - can't match by ID
    handle: '',  // Empty - can't match by handle  
    name: bylineText  // "Pitbull" - but filter has ID/handle, not name
};

// FIX: Also check if bylineText matches any filter's name field
shouldStillHide = filterChannels.some(filterChannel => {
    const filterName = (filterChannel.name || '').toLowerCase();
    const bylineLower = bylineText.toLowerCase();
    // Match by name OR by byline matching filter name
    if (filterName && bylineLower === filterName) return true;
    // ... existing ID/handle checks
});
```

#### Culprit 3: `skipInProgress` Never Resets on Crash
```javascript
// PROBLEM: skipInProgress = true but crash prevents timeout from running

// FIX: Wrap in try-catch and always reset
function checkAndSkipHiddenVideo() {
    if (skipInProgress) return;
    skipInProgress = true;
    
    try {
        // ... skip logic
    } catch (e) {
        console.error('FilterTube: Skip error:', e);
    } finally {
        setTimeout(() => { skipInProgress = false; }, 2000);
    }
}
```

#### Culprit 4: No Name-to-ID Resolution in DOM Refilter
The engine has full channel data (`UCv8nzwVPQDRjkPCkEsOdEwA` → `@Pitbull`), but DOM refilter only sees byline text "Pitbull" and can't resolve it back to the blocked ID.

**FIX:** Use `channelNames` map in reverse:
```javascript
// Build reverse lookup: name → id
const nameToId = {};
for (const [id, nameOrObj] of Object.entries(channelNames)) {
    const name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj?.name;
    if (name) nameToId[name.toLowerCase()] = id;
}

// In refilter loop:
const resolvedId = nameToId[bylineLower] || '';
if (filterId && resolvedId === filterId) {
    shouldHide = true;
}
```

---

### Recommended Fix Priority

1. **CRITICAL:** Guard `channelNames[filterId]` type check (stops crash loop)
2. **CRITICAL:** Add name-based matching in restore logic (stops incorrect restore)
3. **HIGH:** Reset `skipInProgress` in finally block (prevents deadlock)
4. **HIGH:** Build reverse name→ID lookup for DOM refilter
5. **MEDIUM:** Reduce safety-net interval from 2s to 5s (reduces spam on crash)
6. **LOW:** Add try-catch around entire `refilterPlaylistItems` to prevent total failure

---

## Reference: Reverted Watch Patch (Dec 4, 2025)

Although the Dec 4 patch was reverted, its ideas are still relevant for documenting the watch-playlist story. Key concepts to capture for future work:

1. **Stable playlist layout so menus stay usable.**  
   - `ytd-playlist-panel-video-renderer.filter-tube-visible` forced the row into a flex layout that preserved the stock 3‑dot menu alignment when FilterTube hid/showed nodes, preventing clipped menus during SPA inserts.@css/content.css#188-207

2. **Channel metadata caching with timestamps.**  
   - `cacheChannelMetadata()` stamped `data-filtertube-channel-id/handle/name` plus `data-filtertube-metadata-ts` so we could tell whether attributes were stale before trusting them again.@js/content_bridge.js#884-941  
   - Playlist rows intentionally cached nothing except the byline to avoid “current video” bleed-through.

3. **Grace-period + restore guardrails in DOM fallback.**  
   - `applyDOMFallback()` skipped items recently marked `data-filtertube-blocked-state="pending"` and ran `syncBlockedElementsWithFilters()` + `restoreWatchPagePlaylistItems()` up front, ensuring freshly blocked playlist rows didn’t flicker back during reflows.@js/content_bridge.js#1411-1900

4. **Reverse lookup for playlist refilter + mutation coverage.**  
   - `refilterPlaylistItems()` built `nameToId` from `channelNames`, compared byline text to both handles (without `@`) and resolved IDs, and logged why each match occurred.  
   - The playlist observer watched both `attributes` and `childList`, debounced refiltering (100 ms), and kicked off an immediate scan whenever new nodes appeared.@js/content_bridge.js#2638-3200

5. **Player coordination + skip journal.**  
   - `stopMainPlayerPlayback()` paused/muted the movie player before navigating.  
   - `checkAndSkipHiddenVideo()` tracked last indices, preferred skip direction, and recent attempts to avoid looped skips, then retried via DOM click or player APIs before falling back to pausing everything.@js/content_bridge.js#2557-3356

6. **Main‑world lookups for sparse cards.**  
   - `requestChannelInfoFromMainWorld()` and injector-side caches served playlist rows and `yt-lockup-view-model` cards by videoId, optionally using byline hints to verify collaborator matches before persisting the response.@js/content_bridge.js#2029-2205 @js/injector.js#8-226

7. **Blocked-element reconciliation heuristics.**  
   - Elements lacking an ID/handle derived a “guessed handle” from the byline so they could stay hidden until the async lookup completed, closing the restore gap documented above.@js/content_bridge.js#3487-3780

Documenting these behaviors keeps the rationale visible even though the implementation is currently absent, and it frames the requirements for any future watch-page rework.

---

### Summary: What We Want vs What Happens

| Desired Behavior | Current Behavior |
|------------------|------------------|
| Pitbull videos stay hidden always | Hidden on load, reappear on back/forward |
| Skip to next video instantly | 1-1.5s playback before skip |
| No errors in console | 100+ TypeError crashes |
| Restore only when filter removed | Restore happens incorrectly due to name mismatch |
| Skip works reliably | Skip gets stuck in deadlock |

**The core issue:** DOM refilter and restore logic rely on byline text matching, but the blocklist stores IDs/handles. The `channelNames` map bridges this gap but crashes when values are objects instead of strings.




================



### Watch page surfaces you asked about

1. **Playlist panel (queue on the right).**  
   - On `/watch?list=` pages, the playlist panel is populated by `playlistPanelVideoRenderer` entries. Our DOM code re-reads each renderer, grabs `#byline` + `#video-title`, and hides rows when their channel name, handle, or ID matches filters; every row is anchored with `<a href="/watch?v=...&list=...&index=...">`, so skipping is driven by these links or `player.playVideoAt(index)` calls.@js/content_bridge.js#2842-2974  
   - The watcher also looks for `ytd-playlist-panel-video-renderer[selected]` to decide whether to pause and skip immediately if the selected row is hidden.@js/content_bridge.js#3065-3166  

2. **Right-rail “Up next” suggestions.**  
   - These are mostly `yt-lockup-view-model` cards (and some playlist panel rows reused outside the queue). We extract video IDs from any `/watch` links inside each card, grab channel metadata via DOM/ytInitialData fallbacks, and stamp `data-filtertube-channel-*` attributes so downstream code can match filters without re-fetching info.@js/content_bridge.js#3500-3858  

3. **Shorts and other wrappers still come in as standard anchors.**  
   - Even Shorts rendered in the watch column expose `/shorts/<id>` or `/watch?v=` anchors; we mark them with `data-filtertube-short` and run a shorts-specific channel extraction path before applying filters.@js/content_bridge.js#3572-3668  

### Reference payloads you mentioned

| File | What it contains | How it’s used |
| --- | --- | --- |
| [watchpage.json](cci:7://file:///Users/devanshvarshney/FilterTube/watchpage.json:0:0-0:0) | Full `ytInitialData` snapshot from a problematic watch playlist load (before filtering). Includes playlist panel renderers, right-rail lockups, and SPA endpoints so we can diff engine output vs raw payload.@docs/WATCH_PLAYLIST_BREAKDOWN.md#277-281 | Lets us inspect exactly how playlist rows are wrapped (all with `/watch` anchors) and why SPA replays hidden rows after navigation. |
| [playlist.json](cci:7://file:///Users/devanshvarshney/FilterTube/playlist.json:0:0-0:0) | Captured `ytInitialPlayerResponse` plus streaming metadata for the same playlist session. Used to verify `currentVideoEndpoint`, playlist indices, and the player’s internal queue when we consider seed-level sanitization.@playlist.json#1-400 | Shows that even after DOM removals, the player still knows about blocked videos unless we delete them before this payload hydrates. |
| [logs.json](cci:7://file:///Users/devanshvarshney/FilterTube/logs.json:0:0-0:0) | Console log export from the failing session (TypeErrors, skip loops, navigation spam).@docs/WATCH_PLAYLIST_BREAKDOWN.md#277-281 | Serves as regression evidence: refilter crashes, incorrect restores, and skip deadlocks correlate with what you observed. |

### Shorts & collaboration filtering vs now

- **Collab-aware extraction.** The filtering engine walks byline `runs`, detects `showDialogCommand`, and pulls every collaborator’s `browseId`/handle so a single video can be blocked if *any* contributing channel is on the list.@js/filter_logic.js#1110-1201  
- **DOM layer parity.** For cards lacking inline channel metadata (playlist rows, lockups, Shorts), [content_bridge.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:0:0-0:0) falls back to byline text, cached attributes, or even async Main-World lookups to recover handles/IDs before applying the same filters.@js/content_bridge.js#3723-3784 @js/content_bridge.js#3572-3668  
- **Current gap:** While Shorts/collab extraction works, playlist data is only sanitized after Polymer renders. When SPA navigation reuses stale data, hidden videos briefly reappear because the player queue ([playlist.json](cci:7://file:///Users/devanshvarshney/FilterTube/playlist.json:0:0-0:0)) and DOM get out of sync before refilter/skip kicks in.@docs/WATCH_PLAYLIST_BREAKDOWN.md#24-45

### What’s happening with watch playlist navigation now

- **Engine removes rows on fresh load**, so blocked channels disappear until you move around in the playlist.@docs/WATCH_PLAYLIST_BREAKDOWN.md#63-72  
- **After back/forward clicks**, YouTube rehydrates cached playlist rows; our [refilterPlaylistItems()](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:2836:4-2973:5) is supposed to catch that instantly, but a TypeError (`channelNames[filterId]` sometimes an object) aborts the loop, so rows stay visible.@docs/WATCH_PLAYLIST_BREAKDOWN.md#73-96  
- **Restore logic mismatch.** Because it only compares byline text to filter IDs/handles, it sometimes “restores” hidden rows (e.g., Pitbull) even though the block is still active.@docs/WATCH_PLAYLIST_BREAKDOWN.md#96-106  
- **Skip deadlocks.** When a hidden row becomes selected, [checkAndSkipHiddenVideo()](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:3060:0-3165:1) pauses the player and tries to jump via the next `/watch` link. If a crash occurs mid-skip, `skipInProgress` never resets, so future skips are blocked and the hidden video can continue playing until another navigation resets state.@docs/WATCH_PLAYLIST_BREAKDOWN.md#107-141  
- **Net effect:** going back and forth in the playlist causes blocked videos to flash for ~1–1.5 s, then maybe skip, but sometimes they play fully or reappear because the data layer still feeds them to the player while the DOM guard is down.@docs/WATCH_PLAYLIST_BREAKDOWN.md#1-45

That’s the complete recap you asked for: watch page structure (playlist vs right rail), how everything is wrapped in watch links, what each captured file represents, and how Shorts/collab filtering compares to the current playlist behavior.






---

## Comparative Notes: BlockTube `src/scripts` vs FilterTube `js/`

### BlockTube watch-page mechanics
- **Playlist placeholders instead of removals.** When a `playlistPanelVideoRenderer` matches a block rule, BlockTube rewrites the renderer in-place: it forces `videoId = 'undefined'`, replaces the thumbnail with the “meh” placeholder, deletes byline/title metadata, and injects `unplayableText`. This creates the “no thumbnail” cards the user mentioned and still leaves a visible row that YouTube may try to play unless the user skips or reloads.@src/scripts/inject.js#747-767
- **Redirect-and-refresh strategy.** If the currently playing watch page entity (primary or secondary info renderer) matches, BlockTube clears `twoColumnWatchNextResults`, removes `conversationBar`, and immediately sets `document.location = 'watch?v=nextId'` (or `/`) to move away from the blocked video. This is why their UX often requires a navigation hop or reload once a blocked video is reached.@src/scripts/inject.js#872-905
- **Player disabling via custom error state.** `disablePlayer()` wipes `videoDetails` and injects an `ERROR` playability status (with optional custom message), so the player surfaces an error overlay but YouTube still had a chance to start the request before it is neutered.@src/scripts/inject.js#702-745
- **Seed-level interception limited to pass-through filtering.** Their `seed.js` proxies `fetch`/SPF requests and defers to `window.btExports.fetchFilter` once the injected page script is ready. The interception is hardcoded to specific endpoints but doesn’t mutate `ytInitialData`/`ytInitialPlayerResponse` inline; instead it waits for the injected rules to run, and races against YouTube’s own initialization if `blockTubeReady` fires late.@src/scripts/seed.js#135-172

### FilterTube watch-page mechanics
- **Data-level deletions.** Our main-world engine declares `playlistPanelVideoRenderer` rules so anything blocked is excised from `ytInitialData`/continuations before Polymer hydrates them, which avoids placeholder cards entirely.@js/filter_logic.js#480-500
- **Seed-orchestrated processing pipeline.** `processWithEngine()` runs as soon as settings exist and before YouTube consumers read the globals, ensuring both `ytInitialData` and `ytInitialPlayerResponse` are pruned even on the first load; it also queues payloads until settings arrive, so nothing escapes during race conditions.@js/seed.js#198-235
- **Isolated-world DOM safety net.** Even after data-level removal, `refilterPlaylistItems()` plus `checkAndSkipHiddenVideo()` monitor SPA insertions, hide any stray playlist rows instantaneously, and skip the player when necessary—without forcing a page reload or visible placeholder.@js/content_bridge.js#2700-3165

### Key contrasts that inform our current strategy

| Concern | BlockTube (`src/scripts`) | FilterTube (`js/`) |
|---------|--------------------------|--------------------|
| Watch playlist presentation | Keeps a stub row with “meh” thumbnail and custom text; relies on user skip or redirect.@src/scripts/inject.js#747-905 | Removes rows outright via engine + DOM refilter, so nothing selectable remains.@js/filter_logic.js#480-500 @js/content_bridge.js#2700-2894 |
| Player handling when a blocked item surfaces | Forces a navigation (`document.location`) or injects an error state, which feels like a reload to the user.@src/scripts/inject.js#702-905 | Stops playback via `stopMainPlayerPlayback()`, then deterministically clicks the next/prev item via player APIs without leaving the page.@js/content_bridge.js#2854-3159 |
| Data interception timing | Hooks `fetch`/SPF but waits for `blockTubeReady`; a late hook can allow flashes before `btExports` runs.@src/scripts/seed.js#135-172 | Hijacks `ytInitialData` setters immediately and reprocesses cached snapshots when settings change, eliminating flash-of-blocked-content scenarios.@js/seed.js#303-376 |
| User control granularity | Regex-oriented storage (`filterData`) with limited per-surface nuance; watch-page response often “kill switch” style.@src/scripts/background.js#10-83 @src/scripts/inject.js#214-337 | Structured channel objects (`id`, `handle`, `name`), keyword regexes, and per-surface observers give consistent behavior across home/search/watch with the same allow/block lists.@js/filter_logic.js#714-1018 @js/content_bridge.js#2643-3039 |

### Reference artifacts for ongoing analysis
- `@playlist.html` and `@playlist.json` capture the renderer and the raw JSON of the problematic mix playlist, useful for regression snippets.
- `@watchpage.json` contains a full watch payload with Pitbull entries included/excluded for diffing engine output.
- `@logs.json` mirrors the console noise (TypeErrors, skip loops) we observed, letting us replay the sequence when validating new fixes.

These comparisons explain why we are leaning on the FilterTube dual-layer approach: instead of swapping blocked videos for placeholders (which still flicker and require reloads), we remove them from the data source entirely, then fall back to instantaneous DOM enforcement and player-level skips whenever YouTube rehydrates stale cache.
