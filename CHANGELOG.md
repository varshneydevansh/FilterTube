# FilterTube Changelog

## Version 1.0.2 (Latest)

### Bug Fixes
- **Fixed Shorts Overlapping Issue**: Adjusted the shorts container width to prevent overlapping with other videos on the homepage
- **Fixed Mix/Playlist Thumbnails Visibility**: Implemented ultra-aggressive thumbnail hiding when filtering by channel ID or handle
- **Enhanced Element Hiding**: Added multiple redundant hiding techniques using both CSS and JavaScript for improved reliability

## Version 1.0.1 (Current)

### Major Improvements

#### Layout Fixes
- **Fixed YouTube Channel Page Layout**: Corrected the issue where channel page videos displayed vertically instead of in a horizontal grid format.
- **Fixed Search Results Layout**: Ensured video details appear properly to the right of thumbnails, not below them.
- **Fixed Shorts Layout**: 
  - Corrected shorts display to maintain original YouTube horizontal format.
  - Made shorts section span the full page width for native appearance.
  - Properly sized shorts thumbnails to maintain aspect ratio.
- **Fixed Mix/Playlist Layout**: Ensured mix and playlist items display properly when visible, and completely disappear when filtered.

#### Filtering Logic Improvements
- **Enhanced Channel Filtering**:
  - Implemented exact matching for `@handle` filtering (will only hide exact handle matches).
  - Implemented exact matching for `channel/ID` filtering (will only hide that specific channel ID).
  - Maintained partial matching for regular channel names for flexibility.
- **Fixed Mix/Playlist Filtering**:
  - Thoroughly hides mixes/playlists that match filtering criteria.
  - Fixed issue where thumbnails remained visible even when text was hidden.
  - Properly identifies and filters mixes/playlists in various YouTube layouts.
- **Comment Filtering**: Added comprehensive comment filtering options.

#### UI Enhancements
- **Tab View**: Added the ability to open extension in a new tab for better usability.
- **Glassmorphism Effect**: Added modern UI effects for extension components.
- **Save Button**: Improved save button appearance and positioning.

#### Code Architecture
- **Modular Approach**:
  - Separated layout fixes into dedicated `layout.js` file.
  - Created separate CSS files for filters and layout.
- **Reliability Improvements**:
  - Enhanced MutationObserver implementation for reliable filtering as YouTube loads content.
  - Added fallback interval check as a safety net for dynamic content.
  - Improved error handling and added debugging logs.

### Bug Fixes
- **Fixed Infinite Loading**: Corrected issue where certain filter settings caused the page to continuously load.
- **Fixed Blank Spaces**: Eliminated gaps left behind when items are hidden.
- **Fixed Search Page Layouts**: Corrected watch card compact videos and channel results display.
- **Fixed Homepage Shorts**: Corrected issues with shorts display on the homepage.
- **Fixed Channel ID Filtering**: Resolved issue where channel ID filtering was breaking the page.

### Technical Implementation Details
- **CSS Improvements**:
  - Added extensive use of `!important` to override YouTube's internal styles.
  - Implemented more specific CSS selectors for precise targeting.
  - Used `:has()` selectors for parent-child relationship targeting.
  - Implemented full-width container styling for shorts.
- **JavaScript Logic**:
  - Enhanced `shouldFilterChannel` function with normalized input handling.
  - Improved `hideMixAndPlaylistElements` with deep hiding for all child elements.
  - Created robust `showAllElements` function to restore visibility when filters are removed.
  - Refactored `applyFilters` function to handle error cases better.

### Structure Changes
- Created separate files for different concerns:
  - `filter.css` - For hiding/showing filtered elements
  - `layout.css` - For layout fixes after filtering
  - `content.js` - Main filtering logic
  - `layout.js` - Layout repair functionality
  - `popup.js` - Extension UI functionality
  - Added `tab-view.html` and `tab-view.css` for dedicated tab view

## Previous Changes

### Initial Release (Version 1.0.0)
- Basic filtering functionality for YouTube videos
- Keyword-based filtering
- Channel-based filtering
- Basic popup interface
- Initial implementation of layout preservation 