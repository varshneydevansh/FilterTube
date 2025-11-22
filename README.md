<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <p>Filter YouTube videos by keywords, channels, categories, and more.</p>
</div>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/varshneydevansh/FilterTube)

## Overview

A browser extension that filters YouTube content (videos, shorts, playlists, channels, comments) based on keywords and channel names.

## Features

### Content Filtering
- **Keyword-based Filtering**: Hide videos containing specific keywords in titles
  - Uses partial matching (e.g., "apex" will match "apex legends" and "apexlegends")
- **Channel-based Filtering**: Hide content from specific channels using:
  - Channel names (partial matching)
  - @handles (exact matching)
  - Channel IDs (exact matching with format `channel/ID` or `UC...`)
- **Multi-format Support**: Filter various YouTube content types:
  - Regular videos
  - Shorts
  - Playlists and mixes
  - Channel recommendations and channel cards
  - Search results

### Comment Filtering
- **Hide All Comments**: Option to completely hide the comments section
- **Keyword-based Comment Filtering**: Hide specific comments containing filtered words

### User Interface
- **Popup Mode**: Quick access via the extension popup
- **Tab View**: Open in a dedicated tab for more comfortable settings adjustment
- **Real-time Filtering**: Filters are applied instantly without page refresh
- **Visual Feedback**: Clear indication when settings are saved
- **Password Protection**: Optional password protection for parental control
- **Import/Export**: Save and restore your filter settings

## Installation

### Chrome/Edge/Opera
1. Download the extension files
2. Go to your browser's extension page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Opera: `opera://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

### Firefox
1. Download the extension files
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Select any file from the extension directory

## Usage

### Basic Filtering
1. Click the FilterTube icon in your browser toolbar
2. Enter keywords to filter (comma-separated)
3. Enter channel names, @handles, or channel/IDs to filter (comma-separated)
4. Click "Save" to apply filters

### Finding a Channel ID
1. Go to the channel's page on YouTube
2. The URL will be in one of these formats:
   - `https://www.youtube.com/@HandleName` - Use `@HandleName` in the filter
   - `https://www.youtube.com/channel/UCxxxxxxxx` - Use `channel/UCxxxxxxxx` in the filter

### Comment Filtering
1. Click the FilterTube icon
2. Toggle "Hide all comments" to completely hide comments
3. Or select "Filter comments with keywords/channels" to hide only matching comments

## How It Works

### Version 3.0.0 - The "Zero DOM" Data Interception Architecture

In version 3.0.0, FilterTube has been completely refactored to use a robust **Hybrid Filtering Architecture** that combines preemptive Data Interception with a resilient DOM Fallback:

1. **Data Interception Before Rendering**: FilterTube now intercepts YouTube's raw JSON data *before* it gets processed and rendered to the DOM. This provides:
   - **True "zero-flash" filtering**: Content never appears before being filtered
   - **Dramatic performance improvement**: No DOM scanning/manipulation required
   - **More reliable filtering**: Works directly with YouTube's data structures
   - **Resilience against YouTube UI changes**: DOM-independent filtering
   - **Cross-browser compatibility**: Works identically on Chrome and Firefox

2. **Multi-World Script Architecture**:
   - **seed.js**: Runs in MAIN world at document_start to establish early data hooks before YouTube scripts load
   - **content_bridge.js**: Runs in isolated extension context, orchestrates script injection and settings relay  
   - **filter_logic.js**: Comprehensive filtering engine with rules for all YouTube renderer types
   - **injector.js**: Coordinates MAIN world filtering and communicates with bridge
   - **background.js**: Manages settings storage and compiles filter rules for optimal performance

3. **Comprehensive Data Sources Hooked**:
   - `window.ytInitialData`: YouTube's initial page data (home, search, watch pages)
   - `window.ytInitialPlayerResponse`: Video player initial data
   - `window.fetch`: YouTube's API calls for dynamic content loading
   - `XMLHttpRequest`: Fallback for additional dynamic content

4. **Advanced Filtering Engine**:
   - **Renderer-based filtering**: Supports all YouTube content types (`videoRenderer`, `richItemRenderer`, `channelRenderer`, `commentRenderer`, etc.)
   - **Multi-path data extraction**: Robust extraction with multiple fallback paths for each data type
   - **Intelligent channel matching**: Handles @handles, channel IDs, and partial name matching
   - **RegExp keyword filtering**: Compiled patterns for efficient keyword matching
   - **Recursive JSON traversal**: Processes deeply nested YouTube data structures

5. **DOM Fallback Layer (Visual Guard)**:
   - **Safety Net**: Monitors the DOM using `MutationObserver` to catch any content that might bypass the data layer (e.g., client-side hydration)
   - **Visual Hiding**: Applies CSS-based hiding to ensure 100% coverage without breaking layout
   - **Hybrid Reliability**: Combines the speed of data interception with the reliability of DOM inspection

The extension still operates entirely in your browser - no data is sent to any external servers. All filtering happens locally with dramatically improved performance and reliability.

### Legacy Architecture (Pre-3.0.0)

Prior to version 3.0.0, FilterTube worked by:
1. Scanning YouTube page content for videos, playlists, channels, and comments
2. Comparing titles, channel names, and other metadata against your filters
3. Hiding elements that match your filter criteria using CSS
4. Preserving YouTube's original layout after filtering

### Channel Filtering Details

The extension uses multiple techniques to extract and match channel information:
- DOM extraction of visible channel elements
- Access to YouTube's internal component data when available
- Caching to improve performance and consistency
- Normalized matching algorithms to handle variations in channel representation

For the most reliable channel filtering:
- **Important Note**: YouTube channels are identified by both `@Handle` and `ChannelID`. Some channels may still be identified internally by their legacy `ChannelID` even if they display a `@Handle` on their page.
- **Recommendation**: For critical blocks, we recommend adding **both** the `@Handle` (e.g., `@ChannelName`) and the `ChannelID` (e.g., `UC...`) to your filter list until FilterTube can automatically sync these identifiers.
- Use the exact format from the channel URL for specific channels.
- Include distinctive parts of channel names for partial matching.

## Technical Details

### Files Structure

#### Version 3.0.0 Architecture
- **manifest.chrome.json & manifest.firefox.json**: Browser-specific MV3 configurations
- **js/**: JavaScript files
  - **background.js**: Settings management, compiles filter rules
  - **content_bridge.js**: Isolated world script that injects MAIN world scripts
  - **seed.js**: Early-running script that hooks YouTube data sources
  - **injector.js**: Main script that processes intercepted data
  - **filter_logic.js**: Filtering algorithms for YouTube's JSON data
  - **popup.js**: UI interaction logic
- **html/**: UI files
  - **popup.html**: Extension popup interface
  - **tab-view.html**: Full-page interface
- **css/**: Styling files
- **build.sh**: Build script for creating Chrome and Firefox packages

### Build Process

FilterTube now uses a dedicated build script to create packages for both Chrome and Firefox:

```bash
# Build for both browsers
./build.sh

# This creates:
# - dist/filtertube-chrome.zip
# - dist/filtertube-firefox.zip
# - dist/filtertube-chrome/ (unpacked)
# - dist/filtertube-firefox/ (unpacked)
```

### Permissions
- **tabs**: For opening the tab view
- **storage**: For saving user preferences
- **activeTab**: For accessing the current page content

## Support & Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and improvements.

---

### Why FilterTube?

YouTube's recommendation algorithms can sometimes surface unwanted content. FilterTube gives you control over what appears in your feed, allowing for a more focused and pleasant viewing experience without distractions or unwanted content.

## Development

### Cross-Browser Compatibility

FilterTube supports both Chrome and Firefox through a browser-specific build process:

- Chrome uses the standard Manifest V3 with `service_worker` for background scripts
- Firefox uses Manifest V3 with the `scripts` array for background scripts (Firefox MV3 compatibility)

#### Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. For Chrome development:
   ```
   npm run dev:chrome
   ```

3. For Firefox development:
   ```
   npm run dev:firefox
   ```

These commands copy the appropriate manifest file to `manifest.json` for local development.

#### Building for Distribution

To build packages for both browsers:
```
npm run build
```

This creates:
- `dist/chrome/` - Chrome extension files
- `dist/firefox/` - Firefox extension files
- `dist/filtertube-chrome-v*.*.*.zip` - Chrome package
- `dist/filtertube-firefox-v*.*.*.zip` - Firefox package

To build for a specific browser:
```
npm run build:chrome
npm run build:firefox
```
