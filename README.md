# FilterTube

A browser extension to filter YouTube content based on keywords and channels.

## Features

- Filter videos by keywords in title, description, or hashtags
- Filter videos by channel name or handle
- Filter mix recommendations, playlists, and shorts
- Configurable comment filtering
- Minimal performance impact with CSS-based filtering
- All filtering happens locally - no data leaves your browser

## Installation

### Chrome Web Store (Upcoming)

FilterTube will be available on the Chrome Web Store soon.

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/varshneydevansh/FilterTube/releases) page
2. Unzip the downloaded file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in the top right)
5. Click "Load unpacked" and select the unzipped folder
6. FilterTube should now be installed and ready to use

## Usage

1. Click the FilterTube icon in the toolbar to open the popup
2. Add keywords to filter (comma-separated)
3. Add channel names or handles to filter (comma-separated)
4. Optional: Configure comment filtering options
5. Click "Save" to apply your filters
6. Browse YouTube as normal - filtered content will be hidden

### Channel Filtering Tips

- You can filter channels using three formats:
  - Channel name: `Travis Scott`
  - Handle/username: `@TravisScottXX`
  - Channel ID: `channel/UCtxdfwb9wfkoGocVUAJ-Bmg`

## Version History

### Version 1.1.0 (Upcoming)
- Added channel ID to handle mapping
- Fixed channel page layout issues
- Improved filtering for channel IDs and Mix containers
- See [CHANGELOG.md](CHANGELOG.md) for full details

### Version 1.0.0
- Initial release with basic filtering functionality
- Manifest V3 compatible
- Website and documentation

## Development

### Project Structure

- `manifest.json` - Extension configuration (Manifest V3)
- `css/` - Stylesheets for content script and popup
- `html/` - HTML files for popup and tab view
- `js/` - JavaScript files:
  - `background.js` - Background service worker
  - `content.js` - Main content script for filtering
  - `popup.js` - Popup interface functionality
- `icons/` - Extension icons
- `website/` - Documentation website

### Building for Production

1. Clone the repository: `git clone https://github.com/varshneydevansh/FilterTube.git`
2. Make your changes
3. Test the extension locally
4. Create a zip file with all necessary files for distribution

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [YouTube™](https://www.youtube.com/) is a trademark of Google LLC.
- This extension is not affiliated with YouTube or Google.

## Privacy

FilterTube operates entirely locally in your browser. No data is collected, tracked, or transmitted to external servers.

See [website/privacy.html](https://varshneydevansh.github.io/FilterTube/website/privacy.html) for full privacy policy.

<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <h2>Filter YouTube videos by keywords, channels, and categories.</h2>
</div>

### Why this extension?

YouTube's recommendation algorithms often push content that's designed to maximize engagement rather than provide value. FilterTube gives you back control over your viewing experience by allowing you to:

- **Filter out clickbait and low-quality content** that wastes your time
- **Block channels** that don't align with your interests or values
- **Reduce distractions** and focus on content that matters to you
- **Create a more intentional viewing experience** by curating what appears
- **Protect your privacy** with a solution that works 100% locally

Unlike YouTube's built-in features, FilterTube works across your entire YouTube experience - from home feed to search results, recommendations, and even Mix playlists.

### Privacy First Approach

FilterTube is built with privacy at its core:

- **No data collection** - We don't track your browsing, searches, or filtering preferences
- **No cloud processing** - All filtering happens locally in your browser
- **No external servers** - Your data never leaves your device
- **Open source** - Our code is transparent and auditable

### How it Works

FilterTube uses a sophisticated but efficient approach to filtering:

1. **CSS-based initial hiding** - Potential content is hidden by default using CSS
2. **Targeted unhiding** - Only content passing your filters is revealed
3. **MutationObserver technology** - Constantly monitors for new content as you scroll
4. **Smart layout preservation** - Maintains YouTube's design while removing unwanted content
5. **Minimal performance impact** - Designed to run efficiently without slowing down your browsing

### Use Cases

- **Parents** can filter out inappropriate content for their children
- **Students** can remove distracting content while doing research
- **Professionals** can maintain focus by filtering out entertainment content during work hours
- **Everyone** can escape algorithm-driven content bubbles by curating their own experience

### Technical Highlights

- **Manifest V3 compatible** for long-term browser support
- **Efficient DOM processing** with optimized selectors
- **Strategic throttling** to balance responsiveness and performance
- **Adaptable filtering** that works across YouTube's various page layouts
- **Robust channel identification** using names, handles, and channel IDs

For more detailed technical information, see our [Documentation](DOCUMENTATION.md).
