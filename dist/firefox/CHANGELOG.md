# Changelog

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

## Version 3.0.0 - Hybrid Architecture & Documentation Overhaul (CURRENT)
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