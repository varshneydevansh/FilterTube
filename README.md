<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <p>Peace of Mind for your Digital Space</p>
</div>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/varshneydevansh/FilterTube)

## Overview

A browser extension that filters content (videos, shorts, playlists, channels, comments) based on keywords and channel names.

## Features

### Content Filtering
- **Keyword-based Filtering**: Hide videos containing specific keywords in titles
  - Supports **Exact Match** option (e.g., "car" won't match "scar")
  - Default is partial matching (e.g., "apex" will match "apex legends")
- **Channel-based Filtering**: Hide content from specific channels using:
  - @handles (e.g., `@ChannelName`)
  - Channel IDs (e.g., `UCxxxxxxxx` or `channel/UCxxxxxxxx`)
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

FilterTube is available for all major browsers:

### Chrome, Firefox, Edge, Brave, and Opera
Install from the [FilterTube.in](https://filtertube.in)

### Manual Installation (For Developers)
**Chrome/Edge/Brave/Opera:**
1. Download or clone this repository
2. Run `npm run dev:chrome` to prepare the extension
3. Go to `chrome://extensions/` (or your browser's equivalent)
4. Enable "Developer mode"
5. Click "Load unpacked" and select the FilterTube directory

**Firefox:**
1. Download or clone this repository
2. Run `npm run dev:firefox` to prepare the extension
3. Go to `about:debugging#/runtime/this-firefox`
4. Click "Load Temporary Add-on..."
5. Select the `manifest.json` file from the FilterTube directory

## Usage

### Basic Filtering
1. Click the FilterTube icon in your browser toolbar
2. Enter keywords to filter (comma-separated)
3. Enter channel names, @handles, or channel/IDs to filter (comma-separated)
4. Click "Save" to apply filters

### Finding a Channel to Block
1. Go to the channel's page on YouTube
2. Copy the channel identifier from the URL:
   - `https://www.youtube.com/@HandleName` → Use `@HandleName`
   - `https://www.youtube.com/channel/UCxxxxxxxx` → Use `UCxxxxxxxx` or `channel/UCxxxxxxxx`
3. Enter it in the Channels filter field

### Comment Filtering
1. Click the FilterTube icon
2. Toggle "Hide all comments" to completely hide comments
3. Or select "Filter comments with keywords/channels" to hide only matching comments

## How It Works

FilterTube filters unwanted content **before** it appears on your screen, giving you a clean YouTube experience.

```
┌─────────────────────────────────────────────────────────────┐
│  YouTube loads video data                                   │
│          ↓                                                  │
│  FilterTube intercepts the data BEFORE it renders           │
│          ↓                                                  │
│  Checks against your keywords & channels                    │
│          ↓                                                  │
│  ┌──────────────┐              ┌──────────────┐             │
│  │ Matches your │  →  HIDDEN   │ Doesn't match│  →  SHOWN   │
│  │ filters      │              │ your filters │             │
│  └──────────────┘              └──────────────┘             │
│                                                             │
│  Result: Clean YouTube feed with only content you want      │
└─────────────────────────────────────────────────────────────┘
```

### What Makes FilterTube Different

**Lightning Fast** - Filters content before YouTube renders it, so you never see unwanted videos flash on screen

**100% Private** - Everything happens in your browser. No data is sent to external servers.

**Comprehensive** - Filters videos, shorts, playlists, channels, comments, and more across all YouTube pages

**Reliable** - Uses a two-layer system: intercepts YouTube's data first, then monitors the page as backup

### Future Features (Coming Soon)

- **Semantic ML Filtering**: AI-powered filtering that understands video context, not just keywords
- **Kids Mode**: PIN-protected safe environment with whitelisted channels only
- **Smart Sync**: Automatic linking of channel @handles and IDs for better blocking

## Privacy & Permissions

FilterTube only requests the minimal permissions needed to function:

- **Storage** - Save your keyword and channel filters locally on your device
- **Active Tab** - Read YouTube page content to apply filters
- **Tabs** - Open the full dashboard in a new tab

**Your data never leaves your browser.** All filtering happens locally on your device.

## Support & Feedback

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and improvements.

---

### Why FilterTube?

YouTube's recommendation algorithms can sometimes surface unwanted content. FilterTube gives you control over what appears in your feed, allowing for a more focused and pleasant viewing experience without distractions or unwanted content.

**It all started with this thread on Google's support forum:**
When a parent said that he is helpless and his kid is just kept crying and screaming because of the content on YouTubeKids, and he asked me if I can create a tool to block videos by keyword or tag.
And when Later YouTube Forum maintaner deleted mine and other parents comments and locked the thread, I decided to create FilterTube.

[https://support.google.com/youtubekids/thread/54509605/how-to-block-videos-by-keyword-or-tag?hl=en](https://support.google.com/youtubekids/thread/54509605/how-to-block-videos-by-keyword-or-tag?hl=en)

Perfect for:
- **Parents** who want to protect their children from inappropriate content
- **Students** who need to stay focused while researching
- **Anyone** who wants a distraction-free YouTube experience

## For Developers

### Building from Source

```bash
# Install dependencies
npm install

# Develop for Chrome/Edge/Brave/Opera
npm run dev:chrome

# Develop for Firefox
npm run dev:firefox

# Build packages for distribution
npm run build              # All browsers
npm run build:chrome       # Chrome only
npm run build:firefox      # Firefox only
```

For detailed technical documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/TECHNICAL.md](docs/TECHNICAL.md).
