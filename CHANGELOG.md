# FilterTube Changelog

## Version 1.4.4
- Implemented persistent sidebar video filtering with requestAnimationFrame retry mechanism
- Enhanced shorts filtering to reliably detect channel @usernames and IDs in search results
- Added dedicated observers for sidebar and shorts content with optimized processing
- Improved channel extraction from Polymer data for dynamically loaded elements
- Enhanced normalized channel matching for more reliable filtering across all YouTube components
- Fixed filtering issues with @usernames and channel IDs in sidebar videos and shorts

## Version 1.4.3
- Advanced extraction of channel information from YouTube's internal Polymer data
- Enhanced channel ID detection for sidebar videos with reliable identification
- Added direct support for raw 'UC...' channel IDs without prefix
- Improved debug logging for sidebar channel filtering
- Better handling of @handles and channel IDs across different YouTube components
- Fixed matching issues with channel IDs in recommended videos

## Version 1.4.2
- Added support for filtering ticket/event shelves in YouTube
- Implemented extraction of channel IDs and handles from YouTube's polymer data
- Enhanced sidebar videos filtering with reliable channel identification
- Changed keyword filtering to use exact word matching instead of partial matching
- Significantly improved performance with optimized batch processing
- Added performance metrics logging to help diagnose slowness issues
- Optimized filtering to reduce UI freezing and improve responsiveness
- Enhanced comment filtering to only trigger on video pages
- Reduced batch size for smoother UI experience

## Version 1.4.1
- Fixed comment filtering to work properly with both options
- Updated tab-view.html to match the popup UI
- Added more robust comment detection for better filtering
- Improved comment section hiding with multiple detection methods
- Added dedicated observer for comment sections
- Enhanced comment filtering logic to handle dynamically loaded comments
- Added multiple attempts to catch comment sections as they load
- Fixed inconsistencies in channel detection for comments

## Version 1.4.0
- Added comment filtering functionality with two options:
  - Hide all comments option to completely remove the comments section
  - Filter comments with keywords/channels option to selectively hide matching comments
- Enhanced shorts filtering with improved @username and channel ID detection
- Added specialized processor for shorts content for more reliable filtering
- Updated popup UI with comment filtering checkboxes
- Fixed inconsistencies in channel filtering across different YouTube components

## Version 1.3.7
- Fixed filtering for channel results in search pages (ytd-channel-renderer)
- Significantly improved homepage performance with batch processing
- Added optimizations to prevent UI freezing during filtering
- Implemented specialized channel renderer detection and filtering
- Skip processing when tab is not visible for better performance
- Enhanced CSS to properly hide channel renderer elements

## Version 1.3.6
- Fixed channel filtering for @username formats with improved normalization
- Made @username matching case-insensitive for more reliable filtering
- Implemented flexible channel handle comparison to catch all variants
- Added enhanced debug logging for troubleshooting channel filtering
- Improved detection of channel handles in YouTube search results 
- Enhanced matching algorithm for channel IDs
- Fixed filtering of channel elements in search pages
- Implemented unique identifier collection to prevent duplicate checks

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