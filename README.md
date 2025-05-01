# FilterTube

A browser extension to filter YouTube videos based on keywords and channel names.

## Features

- Hide videos containing specific keywords in their titles, descriptions, or channel names
- Block all videos from specific channels
- Filters applied in real-time as you browse YouTube
- Works with YouTube's infinite scrolling and dynamic content loading
- Simple and intuitive user interface

## Installation

### Chrome

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the FilterTube folder
5. The extension should now appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on..."
4. Navigate to the FilterTube folder and select the `manifest.json` file
5. The extension should now appear in your toolbar

## Usage

1. Click the FilterTube icon in your browser toolbar to open the settings popup
2. Enter keywords to filter in the "Filter Keywords" field, separated by commas
3. Enter channel names to filter in the "Filter Channels" field, separated by commas
4. Click "Save Filters" to apply your changes
5. Browse YouTube and filtered videos will be hidden

## Example

If you add the keywords `clickbait, reaction` and the channel `SpamChannel`, then:
- Any video with "clickbait" or "reaction" in the title, description, or channel name will be hidden
- All videos from the channel "SpamChannel" will be hidden

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - User interface for the settings popup
- `js/popup.js` - JavaScript for the popup functionality
- `js/content.js` - Content script that runs on YouTube pages to filter videos
- `js/background.js` - Background service worker for extension events
- `css/content.css` - CSS styles for hiding filtered videos
- `icons/` - Extension icons in various sizes

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <h2>Filter YouTube videos by keywords, channels, and categories.</h2>
</div>

### Why this extension?
