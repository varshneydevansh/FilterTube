# Watch Page Channel-ID Corruption & Wrong-Block Plan

## 1. Symptoms & Recent Regression Context
- Blocking Shakira/BTS from the watch-page 3-dot menu sometimes stores a **different channel** (e.g., Bangtanstan) even though the UI shows the correct byline.
- After blocking from the playlist queue, subsequent searches still surface the artist, proving that the stored filter entry did not match the intended channel ID/handle.
- Logs show playlist panel extraction repeatedly printing `Cached playlist channel from Main World: Object`, followed by hide summaries that mix IDs (`UCYLNGLIzMhRTi6ZOLjAPSmw`) and plain handles (`@shakira`), confirming mixed identity sources.
- Diff excerpts show large rewrites to watch-page handling (playlist refilter, DOM fallback, channel map normalization) that coincided with the regression.

## 2. Where the Bug Appears in Code
1. **Byline-only extraction for playlist cards** — `extractChannelMetadataFromElement` now bypasses deep traversal for `ytd-playlist-panel-video-renderer`, returning only `{ name: byline }` with empty `id/handle` (@js/content_bridge.js#1565-1582).
2. **Menu injection relies on async resolution** — `handleBlockChannelClick` calls `requestChannelInfoFromMainWorld(videoId)` when the extracted meta lacks identifiers, then caches the response onto the card (@js/content_bridge.js#4339-4364).
3. **Cached metadata reused everywhere** — `cacheChannelMetadata` writes `data-filtertube-channel-id/handle/name` to the card regardless of surface, so later DOM passes and menu clicks trust these attributes even for playlist-only elements (@js/content_bridge.js#900-933).
4. **Background adds filters keyed by ID/handle** — `handleAddFilteredChannel` stores whichever identifier it receives, assumes uniqueness, and updates `channelMap`/`channelNames` dictionaries (@js/background.js#873-970). Wrong IDs therefore persist until manually removed.

## 3. Root Cause Analysis
| Factor | Effect | Evidence |
|--------|--------|----------|
| Playlist cards only contribute names | `channelInfo` handed to the Main World has no handle/ID, so the resolver must guess | @js/content_bridge.js#1565-1582 |
| Main World reply can include **collaborator arrays** (e.g., Shakira + Rihanna) | Current code picks the first collaborator, not the one whose name matches the byline | implied by Antigravity plan & observed mis-blocks |
| Cached attributes reused across cards | When a card re-renders (SPA) we may stamp a Pitbull UC ID onto the next item before async resolution completes, causing wrong `data-filtertube-channel-*` values | playlist refilter logs showing "CRITICAL FIX" warnings and still reading `data-filtertube-channel-*` later |
| `filterChannels` normalization lowercases `id/handle/name` | Lowercasing UC IDs (`UC...`) prevents differentiating original casing and complicates lookups in `channelMap`/`channelNames`, increasing odds of mismap | diff chunk near @js/filter_logic.js#715-760 |

## 4. Remediation Plan
1. **Pass explicit byline hint through resolution stack**
   - Update `requestChannelInfoFromMainWorld(videoId, expectedName)` to forward `expectedName` inside the `postMessage` payload and store it alongside the pending request (@js/content_bridge.js#2150-2240).
   - When handling `FilterTube_ChannelInfoResponse`, if `expectedName` exists and `channelInfo.allCollaborators` is populated, select the collaborator whose normalized `name` or `handle-without-@` matches the byline before resolving the promise (@js/content_bridge.js#2159-2205).
   - Modify call sites (`injectFilterTubeMenuItem`, playlist sweepers) to pass the byline text when available.

2. **Cache metadata only after identity is trustworthy**
   - For playlist-panel cards, keep `data-filtertube-channel-id/handle` empty until a confirmed match (ID+handle) is available; never overwrite with unrelated collaborator IDs.
   - Track a `data-filtertube-channel-source` attribute so we know whether data came from DOM, byline inference, or Main World, allowing future passes to ignore stale sources.

3. **Require dual confirmation before writing filters**
   - Inside `handleBlockChannelClick`, prefer UC ID when available but store both `{ id, handle, name }`. If only one identifier exists, synchronously resolve the other via `channelMap`/`channelNames` before calling `addChannelDirectly`.
   - If resolution fails, log a warning and bail instead of saving a partial (prevents corrupt entries).

4. **Harden playlist refilter & restore loops**
   - During refilter, ignore `data-filtertube-channel-*` on playlist items entirely; rely on byline + reverse lookup table built from `channelNames`. (The diff already attempts this but still consults cached attributes at @js/content_bridge.js#3094-3115.) Remove those fallbacks to prevent propagation of wrong IDs.
   - In restore logic, treat byline matches as authoritative, preventing wrongly cached IDs from restoring the hidden item.

5. **Update background dictionaries**
   - Stop lowercasing UC IDs in `_processSettings` so `channelMap` preserves canonical case, ensuring lookups are bijective and preventing collisions (@js/filter_logic.js#715-760).
   - When receiving new mappings, record `name` alongside both `id` and `handle`, enabling DOM code to reverse-resolve byline text without hitting the network.

6. **Instrumentation & Verification**
   - Add debug logs when collaborator matching switches the resolved channel to highlight future mismatches.
   - Create a regression checklist: block from playlist queue, confirm popup shows the expected UC ID and search results disappear immediately; include BTS/Shakira cases.

## 5. Next Steps Checklist
1. Implement `expectedName` plumbing (content bridge ↔ Main World ↔ injector).
2. Guard `cacheChannelMetadata` to avoid stamping playlist cards until identities are confirmed.
3. Refactor playlist refilter/restore to ignore cached IDs and rely on `channelNames` reverse lookup only.
4. Normalize storage logic to keep both UC ID and @ handle in lockstep (background + channelMap).
5. Add targeted console diagnostics & manual test matrix (BTS, Shakira collaborations, non-collab playlist items).

---

## Appendix A – Reverted Watch Patch Artifacts (Dec 4, 2025)

The reverted watch-page patch already experimented with most of the remedies listed above. We no longer ship this code, but documenting the behavior clarifies what “good” looked like:

1. **`requestChannelInfoFromMainWorld(videoId, expectedName)`**  
   - Isolated world bundled the byline name with the videoId so injector.js could pick the collaborator whose `name`/`handle` matched that byline before responding.  
   - Prevented caching Pitbull’s ID onto BTS rows when playlists mixed channels.

2. **`cacheChannelMetadata(element, meta)` with timestamps**  
   - Added `data-filtertube-metadata-ts` to detect stale attributes and skipped caching for playlist-panel rows until both handle + ID had been verified against the byline hint.

3. **“Confirmed source” vs “guess” attributes**  
   - Playlist rows only stored the byline (`data-filtertube-channel-name`) unless the async lookup returned a matching ID/handle. Watch right-rail cards marked `data-filtertube-channel-source="main-world"` so DOM refilter logic could ignore guessed handles.

4. **Pending-channel grace period**  
   - Elements newly marked as blocked set `data-filtertube-blocked-state="pending"` + timestamp, and DOM fallback refused to “restore” them for 5 s. This kept the queue from flickering when handles arrived late.

5. **Reverse lookup table + dialog hints**  
   - `channelNames` stored `{ id, handle, name }`, enabling `nameToId` resolution inside playlist refilter, while `expectedName` ensured the lookup only succeeded if names actually matched.

6. **Injector caches**  
   - `FilterTube_CacheChannelInfo` messages sent from `filter_logic.js` populated a `channelCache` map keyed by videoId. Each `FilterTube_RequestChannelInfo` first hit that cache, then fell back to scanning `ytInitialData` with the provided expected name/handle hints.

When we port these ideas back into home collab fixes, we should call out whether we need the full set (e.g., timestamped cache metadata) or just the byline hint plumbing to keep channel identity sane.
