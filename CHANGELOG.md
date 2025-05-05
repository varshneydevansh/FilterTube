# FilterTube Changelog

## Version 1.1.0 (Upcoming)
**Release Date:** June 2025

### New Features
- Added channel ID to handle mapping for more consistent filtering
- Enhanced grid layout system for channel pages
- Added special handling for section list renderers
- Improved filtering for YouTube Mix elements
- Implemented whole-word matching for keywords for more precise filtering

### Bug Fixes
- Fixed channel ID filtering issue for channels like Travis Scott (UCtxdfwb9wfkoGocVUAJ-Bmg)
- Fixed inconsistent layout of videos on channel pages
- Fixed website links to consistently point to varshneydevansh/FilterTube repository
- Improved keyword matching precision to prevent over-filtering

### Code Improvements
- Added aggressive grid layout fixing system using multiple approaches
- Created dedicated channel info extraction function
- Implemented mutation observer to maintain proper layouts against YouTube's dynamic changes
- Added better debug logging for channel detection
- Added matchesWholeWord function to improve filtering precision

## Version 1.0.0 (Initial Release)
**Release Date:** May 2025

### Features
- Basic filtering functionality based on keywords and channel names
- Support for filtering main feed, search results, recommendations, and watch page
- Efficient filter implementation with inverted-visibility approach for better performance
- Comment filtering options (hide all or filter by keywords)
- Popup interface for managing filters
- Clean and responsive website

### Technical Features
- Manifest V3 compatible
- CSS-based visibility system for smooth filtering
- MutationObserver-based content scanning for dynamic page content
- Storage sync for saved preferences

### Website
- Landing page with feature highlights
- Filtering guide for users
- Privacy documentation
- Technical features explanation
- About page with project background 