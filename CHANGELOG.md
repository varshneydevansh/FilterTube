# FilterTube Changelog

## Version 1.3.5 (Current)
- Enhanced channel filtering to properly detect and filter @usernames
- Added support for channel ID based filtering
- Added detection of channels in side panel content (artist cards)
- Improved matching algorithm for channels with and without @ symbols
- Added direct URL-based channel detection for more reliable filtering

## Version 1.3.4
- Fixed shorts container collapsing issue when filtering shorts
- Added new CSS approach that makes filtered shorts have zero width
- Added intelligent shorts layout management
- Non-matching shorts now automatically shift into view when others are filtered
- Added automatic position reset for shorts containers

## Version 1.3.3
- Fixed YouTube Shorts filtering (properly hides shorts with filtered keywords)
- Preserved shorts shelf scrolling functionality 
- Added special handling for shorts elements to prevent UI breaking
- Used visibility:hidden instead of display:none for shorts to maintain UI layout

## Version 1.3.2
- Added filtering for additional YouTube UI elements:
  - Side panel movie/video cards (`ytd-universal-watch-card-renderer`)
  - Search page playlists (`yt-lockup-view-model`)
  - Additional sidebar elements
- Improved channel name detection with more comprehensive selectors
- Added special handling for playlist and sidebar items

## Version 1.3.1
- Complete redesign with zero-flash filtering approach
- Changed to CSS-based initial hiding and visibility control
- Elements now hidden by default until processed
- Fixed performance issues for a smoother experience
- Set extension to load at document_start for earlier execution

## Version 1.0.0 (Initial)
- Basic filtering of YouTube content based on keywords
- Support for channel filtering
- Popup UI for setting filter preferences

## Version 1.0.3 (Latest)
- **Fixed**: Mix/playlist thumbnails now properly hide when filtering by keywords in their content
- **Fixed**: Videos with filtered keywords in their description now correctly hide
- **Improved**: Ultra-aggressive hiding for mix elements with !important CSS rules
- **Added**: Special handling for universal watch cards to ensure proper keyword filtering
- **Added**: Deeper text content analysis for mix elements to catch all instances of keywords

## Version 1.0.2
- **Fixed**: YouTube search page layout (videos now display horizontally as intended)
- **Fixed**: Shorts display on homepage (proper sizing and horizontal layout)
- **Fixed**: Channel filtering more reliable with exact matching for @handles and channel IDs
- **Added**: Toggle button in popup for opening YouTube in a new tab
- **Added**: Improved comment filtering on video pages
- **Improved**: Overall layout preservation after filtering content

## Version 1.0.1
- **Fixed**: Playlist thumbnails sometimes remaining visible when filtering
- **Fixed**: Channel page layout issues
- **Added**: Basic filtering for shorts content
- **Added**: Initial implementation of comment filtering

## Previous Changes

### Initial Release (Version 1.0.0)
- Basic filtering functionality for YouTube videos
- Keyword-based filtering
- Channel-based filtering
- Basic popup interface
- Initial implementation of layout preservation 