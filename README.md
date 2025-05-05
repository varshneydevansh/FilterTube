# FilterTube

A browser extension that filters YouTube videos, playlists, channels, and comments based on keywords and channel names.

## Features

### Content Filtering
- **Keyword-based Filtering**: Hide videos containing specific keywords in titles, descriptions, or metadata
- **Channel-based Filtering**: Hide content from specific channels using:
  - Channel names (partial matching)
  - @handles (exact matching)
  - Channel IDs (exact matching with format `channel/ID`)
- **Multi-format Support**: Filter various YouTube content types:
  - Regular videos
  - Shorts
  - Playlists
  - Mixes
  - Channel recommendations

### Comment Filtering
- **Hide All Comments**: Option to completely hide the comments section
- **Keyword-based Comment Filtering**: Hide specific comments containing filtered words

### User Interface
- **Popup Mode**: Quick access via the extension popup
- **Tab View**: Open in a dedicated tab for more comfortable settings adjustment
- **Real-time Filtering**: Filters are applied instantly without page refresh
- **Visual Feedback**: Clear indication when settings are saved

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
3. Or use the filter box to specify keywords for comment filtering

## How It Works

FilterTube works by:
1. Scanning YouTube page content for videos, playlists, and channels
2. Comparing titles, channel names, and other metadata against your filters
3. Hiding elements that match your filter criteria
4. Preserving YouTube's original layout after filtering

The extension operates entirely in your browser - no data is sent to any external servers.

## Technical Details

### Files Structure
- **manifest.json**: Extension configuration
- **html/**: UI files
  - popup.html: Extension popup interface
  - tab-view.html: Full-page interface
- **css/**: Styling files
  - filter.css: Styles for hiding/showing elements
  - layout.css: Styles for fixing layout issues
  - popup.css: Styles for the popup UI
  - tab-view.css: Styles for the tab view
- **js/**: JavaScript files
  - content.js: Main filtering logic
  - layout.js: Layout repair functionality
  - popup.js: UI interaction logic

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

<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <h2>Filter YouTube videos by keywords, channels, and categories.</h2>
</div>

### Why this extension?
