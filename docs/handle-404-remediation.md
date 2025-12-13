
# Handle 404 Remediation (Channel Identity Hardening – Dec 2025)

## Goal

Guarantee that every “Block Channel” action resolves to a canonical UC ID even when `/@handle/about` returns 404 or handles mutate between surfaces.

## Four-Layer Safety Net

```ascii
User clicks "Block" →
    1) Background cache-first lookup (channelMap) → UC ID?
        └─ yes → persist immediately
        └─ no  → 2) ytInitialData replay (searchYtInitialDataForVideoChannel) using videoId/handle
                   └─ success? → persist
                   └─ no → 3) Shorts/handle helpers (fetchShortsUrl + /@handle/about + channelMap broadcast)
                            └─ success? → persist
                            └─ no → 4) DOM cache invalidation + reprocess until mapping learned
```

### 1. Cache-First Lookup (`background.js`)

- `handleAddFilteredChannel` checks `channelMap` before any network fetch.
- Map contains entries learned by `filter_logic.js` & injector from `ytInitialData`, playlist panels, lockup metadata, etc.
- Prevents repeated `/@handle/about` calls and instantly resolves resurrected handles.

### 2. Main-World Replay (`injector.js`, `seed.js`)

- `content_bridge.js` retries failed blocks by querying `searchYtInitialDataForVideoChannel(videoId, expectedHandle)`.
- Reuses data that rendered the card (rich-grid, search, watch suggestions) and extracts UC IDs/handles without hitting network.

### 3. Shorts/Handle Helpers + Broadcast

- If ytInitialData lacks UC IDs, fallback fetches Shorts watch URLs and `/@handle/about`.
- Successful resolutions are broadcast via `FilterTube_UpdateChannelMap`, persisted by the background worker, and shared with every tab.
- Keeps DOM fallback, data interception, and storage in sync.

### 4. DOM Cache Invalidation

- `applyDOMFallback` tracks `data-filtertube-last-processed-id`.
- When a reused card swaps to a new video, cached `data-filtertube-channel-*` attributes are purged, forcing a fresh extraction with the updated mapping.

## Developer Checklist

- [ ] Whenever you add a new channel extraction path, call `_registerMapping(id, handle)`.
- [ ] Keep `channelMap` writes bidirectional (handle→UC, UC→handle) for quick lookups.
- [ ] When editing DOM fallback logic, preserve `data-filtertube-last-processed-id` semantics so reprocesses fire correctly.
- [ ] If a new surface exposes collaboration data, ensure `searchYtInitialDataForVideoChannel` or the Shorts helper covers it before relying on `/@handle/about`.
