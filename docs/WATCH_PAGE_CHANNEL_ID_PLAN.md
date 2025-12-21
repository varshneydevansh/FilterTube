# Watch Page Identity & Blocking – Current State (v3.1.1)

This document describes how watch-page channel identity is resolved and how blocking behaves on `/watch` pages, including watch-page playlists.

## Goals

- When you block from the watch page (including playlist panel), the stored entry should correspond to the intended channel.
- Playlist panels should hide all blocked-channel items reliably and skip them during Next/Prev/autoplay without visible playback.
- Watch pages must remain resilient to YouTube SPA navigation and DOM node reuse.

## Current System (what runs today)

### 1) Identity sources (watch page)

- **Engine (Main World)**: `seed.js` + `filter_logic.js` filter watch/browse payloads and harvest identity where possible.
- **Main-world replay**: `content_bridge.js` can request a `videoId` lookup from `injector.js` (scanning `ytInitialData`) to obtain `{ id, handle, name, customUrl }` without a network fetch.
- **DOM fallback**: `applyDOMFallback()` (Isolated World) hides already-rendered cards and uses `FilterTubeIdentity.channelMatchesFilter(...)` as the canonical matcher.

### 2) Playlist panel specifics

Playlist panel rows (`ytd-playlist-panel-video-renderer`) are special:

- Their DOM often exposes only a **byline name**.
- `applyDOMFallback()` prefers `#byline` to avoid incorrectly reading video title text.
- The hide target is promoted to the wrapper (`ytd-playlist-panel-video-wrapper-renderer`) when present.

### 3) Deterministic playlist filtering (prefetch → videoChannelMap)

To avoid relying on byline-only matching:

- `content_bridge.js` runs a prefetch/hydration queue.
- On watch pages with `list=...`, playlist panel rows are prioritized for observation.
- The prefetch pipeline resolves `videoId -> UC id` and persists it into `videoChannelMap`.

This makes “same-channel” playlist hiding deterministic across refresh and scroll/load-more.

### 4) Zero-flash skipping (Next/Prev/autoplay)

The playlist skip system is implemented in `dom_fallback.js`:

- Capture-phase interception on `.ytp-next-button` and `.ytp-prev-button` prevents YouTube from navigating into a hidden playlist item.
- A secondary selected-item guard runs after each DOM fallback pass: if the currently selected playlist row is hidden, redirect to the next visible row.
- Direction is tracked so Prev stays Prev and does not bounce forward.

## Appendix: Historical regression notes (pre-v3.1.1)

Earlier investigations into wrong-blocks and playlist leaks are preserved in Git history and in `docs/WATCH_PLAYLIST_BREAKDOWN.md` (historical section).
