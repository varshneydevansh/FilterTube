# Changelog

## Version 3.1.6

### Release Notes Experience

- Added a curated “What’s New” tab in the dashboard fed by `data/release_notes.json`, sharing the same content as the release banner.
- Release banner CTA now routes through the background script and lands inside `tab-view.html?view=whatsnew`, so no chrome-extension:// links are blocked by content blockers.
- Banner + dashboard documentation now lives in `/docs`, including UI/UX guidance on when the CTA appears and which fields drive the cards.

### Import / Export & Data Portability

- Documented the full import/export pipeline (including c/ChannelName normalization, merge rules, and adapters) with ASCII + Mermaid diagrams.
- `js/io_manager.js` centralizes sanitization helpers, making merge vs. replace imports reliable for UC IDs, @handles, and `/c/slug` values.
- Added contextual comments throughout IO helpers so future schema changes remain self-documented.

---

## Version 3.1.5

### Fixes: Shorts + Members-only (Watch/Sidebar)

- Watch-page sidebar now hides Shorts that are rendered as normal compact videos by checking `/shorts/` hrefs, SHORTS overlays, and aria-label hints before cards render.
- Members-only hiding hardened: detects via title aria-labels, badges, and UUMO membership playlists across compact/watch/sidebar/lockup renderers; shelves hide deterministically.
- Members-only toggle now persists correctly (StateManager save/broadcast path and background recompile) so UI selections stick across contexts.

---

## Version 3.1.4

### UI/UX & Responsiveness

- Added mobile-friendly tab view: hamburger nav toggle, overlay, tighter paddings, and responsive grids/inputs for smaller screens.
- Refined filter/search/input rows to wrap gracefully and keep buttons aligned on mobile.
- Tweaked toggle styling (lighter track, crisper borders, centered thumb) for better contrast in light/dark modes.
- Content control cards now use cleaner dividers/hover states and stronger headings while preserving per-group accents.

### Playlist/Mix Controls

- Playlist hiding now excludes Mix/Radio items (start_radio=1) while keeping standard playlists hidden.
- Mix/Radio toggle now also hides the “Mixes” chip in the filter bar when enabled.

### Note

- UI toggle for “Hide Members-only videos” is temporarily hidden; functionality remains wired for future release.

---

## Version 3.1.3

### UI/UX

- Aligned popup and tab search bars to full-width row sizing; added clearer pill/tooling docs in the Help page with accurate Exact/Comment/Filter All behavior and C/E chip samples.
- Popup content controls hide descriptions for a cleaner view; tab content controls now use title-only tooltips (not row-wide) for descriptions.
- Help legend updated to document badge tints (channel/comment/collab) and pill behaviors with matching colors/shapes.

---

## Version 3.1.2

### Watch Page (Playlists)

- Autoplay now skips blocked playlist items by triggering a safe Next-click only when the immediate next playlist row is hidden.
- Watch-page playlist panel rows are sticky-hidden across reprocessing cycles when identity is temporarily unresolved (prevents restored blocked items becoming playable).

### 3-Dot Menu UX

- Closing the YouTube 3-dot dropdown after blocking no longer closes/interrupts an active miniplayer.

---

## Version 3.1.1

### Watch Page (Playlists)
- Watch-page playlist panel rows now hide deterministically for blocked channels (playlist items are enriched via `videoChannelMap`).
- Next/Prev navigation skips blocked playlist items without visible playback flash.

### UI
- Added a Help section in the dashboard (new tab UI) documenting all features/toggles.

### Identity & Robustness
- Improved channel identity convergence (handle/customUrl ↔ UC ID mapping) so blocking is resilient to `/@handle/about` failures.

---

## Version 3.1.0

### Watch Page & Docs
- Documented that watch-page 3-dot menus now mirror Home/Search collaborator behavior and clarified the remaining single-channel label gap plus Shorts coverage (`docs/home_watch_collab_plan.md`, `docs/CHANNEL_BLOCKING_SYSTEM.md`, `docs/youtube_renderer_inventory.md`).
- Captured the outstanding playlist/mix regression (hidden rows reappearing after hard refresh) so it stays visible in watch-page plans.

### Misc
- Version bump to keep manifests, build tooling, and UI footer aligned with the new release.

## Version 3.0.9

### Refactor
- **3-dot menu module split**: Moved the dropdown observer/bootstrap logic into `js/content/block_channel.js` (loaded before `content_bridge.js`).

### Cleanup
- **Legacy observer removal**: Removed the old/disabled dropdown observer code from `content_bridge.js` after validating the new `block_channel.js` entry-point.

### Documentation
- Updated docs to reflect the new isolated-world module structure + load order.
- Expanded `docs/youtube_renderer_inventory.md` with additional menu DOM variants used by the 3-dot injection pipeline.

## Version 3.0.8

### Channel Blocking Hardening
- **404 Recovery Pipeline**: Added a four-layer strategy (cache-first lookup, ytInitialData replay, Shorts helpers, DOM cache reset) so blocking always resolves a UC ID even when `/@handle/about` fails.

- **DOM Reprocessing**: Cards now re-run the fallback when their `data-filtertube-last-processed-id` changes, preventing stale metadata from skipping new videos.

### Documentation
- Added `docs/handle-404-remediation.md` playbook and updated architecture/tech docs to reflect the new recovery flow.
- Expanded `CONTENT_HIDING_PLAYBOOK.md` and `CHANNEL_BLOCKING_SYSTEM.md` with channel identity guidance for Shorts/home surfaces.

## Version 3.0.7

### New Features
- **Posts Support**: Added proper channel extraction for YouTube community posts
  - "Block Channel" menu now works correctly on posts via 3-dot menu
  - Extracts channel info from post author links and thumbnails
- **Collaboration Videos**: Added support for videos with multiple channel collaborators
  - Detects and extracts all collaborating channels from `attributed-channel-name` element
  - Blocks video if ANY collaborator is in your blocked channels list
  - Menu shows "(Collab)" indicator for collaboration videos
  - Blocking a collaboration video blocks ALL collaborators automatically

### Documentation
- Updated `youtube_renderer_inventory.md` with collaboration videos section
- Marked posts as fully covered for menu blocking

## Version 3.0.6
- **Fix**: Fixed the Popup UI width for desktop and updated the website.

## Version 3.0.5

### Bug Fixes
- **Menu Injection**: Fixed issue where "Block Channel" menu item would not appear on first click, requiring 2-3 clicks
  - Added DOM verification before skipping injection to detect when YouTube clears menu items
  - Prevents stale state tracking causing false "already injected" detections
- **Focus Trap**: Fixed scroll functionality after blocking a video via 3-dot menu
  - Implemented 5-strategy dropdown closure (Escape key simulation, focus removal, YouTube close, force hide, simulated click)
  - Page now immediately regains scroll control after blocking without requiring manual click
- **Android Support**: Made popup UI responsive for Firefox for Android
  - Changed fixed width to fluid (100%, max-width: 400px, min-width: 320px)
  - Added `gecko_android` manifest support

## Version 3.0.4 - Shorts Blocking & Layout Fixes (November 2025)
- **Feature**: Enhanced Shorts blocking with immediate visual feedback (no more waiting).
- **Fix**: Resolved "blank space" issue where blocked Shorts left empty gaps in the grid.
- **Fix**: Improved channel extraction for handles with dots (e.g., `@user.name`).
- **Docs**: Added detailed ASCII flowcharts for Shorts blocking architecture.

## Version 3.0.3 - Shorts Menu Fixes & Stability (November 2025)
- **Feature**: Added "Block Channel" option to the 3-dot menu for YouTube Shorts, Posts, and Playlists.
- **Fix**: Resolved "ghost dropdown" issue where the menu remained visible after blocking.
- **Fix**: Fixed "Unable to block" error by implementing async channel fetching for Shorts.
- **Fix**: Silenced error logs for unsupported card types (Mixes/Playlists).
- **UX**: Immediate visual feedback (video hides instantly) when blocking via the menu.

## Version 3.0.0 - Hybrid Architecture & Documentation (November 2025)
- **Architecture**: Formalized the "Hybrid Filtering Architecture" combining Data Interception (Primary) with DOM Fallback (Secondary).
- **Documentation**: Major overhaul of `ARCHITECTURE.md`, `TECHNICAL.md`, and `CODEMAP.md` with detailed ASCII diagrams.
- **Visuals**: Added "Box-and-Line" ASCII diagrams for all major technical flows.
- **Refinement**: Improved code flow descriptions for non-technical accessibility.

## Version 2.0.0 - The "Zero DOM" Data Interception Architecture (December 2024)
- **Core**: Complete rewrite using `ytInitialData` and `fetch` interception.
- **Performance**: "Zero Flash" filtering by modifying data before rendering.
- **UI**: New Tab View interface for advanced filtering.
- **Fixes**: Resolved issues with YouTube Shorts and dynamic navigation.

## Version 1.5.0
- Added basic keyword filtering.
- Implemented channel blocking.

## Version 1.0.0
- Initial release.