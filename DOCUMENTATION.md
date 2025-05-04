# FilterTube Documentation

## Overview

FilterTube is a browser extension designed to filter YouTube content based on user-defined keywords and channels. The extension uses a CSS-based filtering approach combined with JavaScript DOM manipulation to hide unwanted content while preserving optimal performance.

## Technical Architecture

### Manifest Version

FilterTube uses Manifest V3, the current browser extension platform standard. This ensures compatibility with modern browsers and follows security best practices.

```json
"manifest_version": 3,
"version": "1.1.0"
```

### Components

The extension is built with the following key components:

1. **Background Script** (`js/background.js`)
   - Handles browser icon clicks
   - Manages extension installation/updates
   - Responds to messages from content scripts

2. **Content Script** (`js/content.js`)
   - Injects into YouTube pages
   - Reads filter settings from storage
   - Identifies and filters video elements
   - Uses MutationObserver to handle dynamic content
   - Applies CSS classes for visibility control

3. **Popup Interface** (`html/popup.html` and `js/popup.js`)
   - Provides user interface for configuring filters
   - Saves settings to browser storage
   - Offers comment filtering options

4. **Stylesheet** (`css/content.css`)
   - Defines visibility rules for filtered content
   - Uses inverted logic (hide by default, reveal wanted content)
   - Contains layout fixes for various YouTube page types

### Filter Implementation

The filtering system uses an inverted approach for better performance:

1. Hide all potential video elements with CSS initially
2. Add a `.filter-tube-visible` class to elements that should be shown
3. This approach prevents "flickering" as content loads and gets filtered

### Key JavaScript Functions

- `loadSettings()`: Loads filter preferences from storage
- `hideSuggestionsByPreferences()`: Main filtering coordinator
- `hideVideos()`, `hidePlaylistsAndShelves()`, etc.: Target specific content types
- `shouldFilterChannel()`: Determines if a channel should be filtered
- `extractChannelInfo()`: Extracts channel names and handles from elements
- `fixSearchResultsLayout()`: Fixes layout issues after filtering
- `forceChannelGridLayout()`: Aggressively fixes channel page layouts

## Version History

### Version 1.1.0 (June 2024)

#### Major Features Added:

1. **Channel ID to Handle Mapping**
   - Added mapping system to correlate channel IDs with their handles
   - Created channelMappingCache to store relationships
   - Added functionality to extract handles from channel pages

2. **Enhanced Grid Layout System**
   - Implemented multiple layers of grid layout fixes for channel pages
   - Added CSS-based approach with high-specificity selectors
   - Created direct DOM manipulation through forceChannelGridLayout()
   - Added dynamic style injection for immediate layout fixes

3. **Layout Monitoring System**
   - Implemented MutationObserver to detect and override YouTube's layout changes
   - Continuously applies grid layout to maintain horizontal video arrangement
   - Targets specific YouTube components that cause layout issues

#### Bug Fixes:

1. **Channel ID Filtering**
   - Fixed issues with channel ID-based filtering (e.g., UCtxdfwb9wfkoGocVUAJ-Bmg)
   - Added multiple matching approaches for different channel identifier formats
   - Enhanced logging for better debugging of channel identification

2. **Channel Page Layout**
   - Fixed vertical video arrangement on channel pages
   - Targeted section list renderers that were causing layout issues
   - Implemented failsafe approaches with multiple layers of fixes

3. **Website Links**
   - Updated all GitHub links to consistently point to varshneydevansh/FilterTube

### Version 1.0.0 (May 2024)

Initial release with basic filtering functionality and website.

## Future Enhancements

### Planned for Future Versions:

1. **Advanced Channel Mapping**
   - Persistent storage of channel ID to handle mappings
   - Potential API integration for automatic mapping
   - User-editable mapping database

2. **Performance Optimizations**
   - Further refinement of observer throttling
   - Potential worker-based processing for heavy operations

3. **UI Enhancements**
   - More detailed filtering statistics
   - Visual indicators for filtered content (optional)
   - Theme customization options

## Development and Contribution

### Setup Instructions

1. Clone the repository: `git clone https://github.com/varshneydevansh/FilterTube.git`
2. Navigate to `chrome://extensions/` in Chrome
3. Enable Developer Mode
4. Click "Load unpacked" and select the repository folder
5. Make your changes and test them directly

### Building for Release

1. Update the version number in `manifest.json`
2. Document changes in `CHANGELOG.md`
3. Create a zip file containing all necessary extension files
4. Test the packaged extension thoroughly before distribution

## Troubleshooting

### Common Issues

1. **Videos not being filtered**
   - Check that valid keywords or channels are entered
   - Ensure the extension has access to YouTube.com
   - Try refreshing the page after saving new filters

2. **Layout problems after filtering**
   - YouTube regularly updates its DOM structure
   - Report specific layout issues with screenshots
   - Check browser console for any error messages

3. **Performance concerns**
   - Filter lists with many entries might impact performance
   - Consider using more specific filters for better results

## Contact and Support

For support, feature requests, or bug reports, please create an issue on the [GitHub repository](https://github.com/varshneydevansh/FilterTube/issues).

---

*Note: YouTube™ is a trademark of Google LLC. This extension is not affiliated with, endorsed by, or sponsored by Google LLC.* 