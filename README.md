<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <p>Peace of Mind for your Digital Space</p>
</div>

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/varshneydevansh/FilterTube)

## Overview

FilterTube is a browser extension that gives you control over your YouTube feed. Filter videos, shorts, channels, and comments using keywords and smart rules—all processing happens privately on your device.

## Features

### Content Filtering
- **Block by Keyword**: Hide videos with specific words in the title.
- **Block Channels**: Filter by Channel Name, @Handle, or ID.
- **Hide Shorts**: Optional toggle to remove all Shorts from your feed.
- **Smart Matching**: Supports both partial matches (default) and exact word matching.

### Comment Control
- **Hide All Comments**: Remove the comments section entirely for a cleaner interface.
- **Filter Comments**: Hide specific comments containing unwanted keywords.

### Stats & Insights
- **Time Saved**: See how much time you've saved by blocking distractions.
- **Daily Tracker**: Count of videos hidden today.

### Performance & Privacy
- **Zero Flash**: Filters content *before* it renders on screen.
- **100% Private**: No data leaves your browser. No analytics. No tracking.

## Installation

### For Users
The easiest way to install FilterTube is via our official website:
👉 **[Install FilterTube](https://filtertube.in)** (Available for Chrome, Firefox, Edge, Brave, Opera)

### For Developers
If you want to contribute or build from source:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/varshneydevansh/FilterTube.git
    cd FilterTube
    npm install
    ```

2.  **Run in Developer Mode**
    *   **Chrome/Edge/Brave**: `npm run dev:chrome`
    *   **Firefox**: `npm run dev:firefox`

3.  **Load Extension**
    *   **Chrome**: Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the `FilterTube` folder.
    *   **Firefox**: Go to `about:debugging`, click **This Firefox**, then **Load Temporary Add-on**, and select `manifest.json`.

### 📱 Firefox for Android
1.  **Set up**: Connect your Android device to your computer via USB.
2.  **Install**: You can install the **same** `filtertube-firefox-v3.0.4.zip` file.
3.  **Debug**: Follow Mozilla's guide to [debug extensions on Android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/) using `web-ext` or remote debugging.

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

We believe in privacy by design.
*   **Storage**: To save your settings locally.
*   **Active Tab**: To scan the YouTube page you are viewing.
*   **No External Requests**: FilterTube does not talk to any servers other than YouTube (for the content you requested).

## 🎬 Shorts Blocking Experience

FilterTube v3.0 introduces a robust, hybrid blocking mechanism for YouTube Shorts. We prioritize **Zero Content Leakage** by verifying every channel before blocking.

```ascii
[User Clicks "Block"]
        |
        v
+-----------------------+
|  1. Fetch Channel ID  | (Extra step for Shorts)
+-----------------------+
        |
        v
+-----------------------+
|  2. Verify Identity   | (Resolve Canonical ID)
+-----------------------+
        |
        v
+-----------------------+
|  3. Block & Hide      |
+-----------------------+
```

- **Robust Verification**: We perform a multi-step check (approx. 1s) to ensure we have the correct, unique Channel ID.
- **Zero Leakage**: By resolving the canonical ID, we ensure that blocking a Short also blocks the channel's long-form videos and posts.
- **Smart Layouts**: Automatically adjusts the grid to prevent awkward blank spaces.

> [!NOTE]
> **Why the slight delay?**
> For Shorts we have an additioanl overhead(1s - 1.5s) of prefetching the channel ID and then resolving the canonical ID. This is to ensure that blocking a channel also blocks all its content, not just the short. Which makes 3 dot UI Blocking for shorts about 2s to 2.5s and rest assured if you have clicked "Block Channel" it will get blocked you can browse freely.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/varshneydevansh/FilterTube/issues).

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
