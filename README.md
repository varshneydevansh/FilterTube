<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <p>Peace of Mind for your Digital Space</p>
  
  [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/varshneydevansh/FilterTube) ![Version](https://img.shields.io/badge/version-3.3.1-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Lines of Code](https://img.shields.io/badge/total%20lines-102.1k-brightgreen.svg) ![JavaScript LoC](https://img.shields.io/badge/javascript-63.5k%20lines-yellow.svg) ![Top Language](https://img.shields.io/github/languages/top/varshneydevansh/FilterTube?color=f1e05a) ![Repo Size](https://img.shields.io/github/repo-size/varshneydevansh/FilterTube?color=orange)
  
</div>

## Overview

FilterTube is a browser extension that gives you control over your YouTube feed. Filter videos, shorts, channels, and comments using keywords and smart rules—all processing happens privately on your device.

## What's New in v3.3.1

- **Collaboration blocking is now much more complete on watch surfaces**: watch right rail, playlist rows, and watch-like lockups can recover full collaborator rosters and refresh the active 3-dot menu.
- **Mix cards and real collaborations are separated more safely**: plain names containing `&` or `and` no longer become fake collaboration menus without explicit collaborator signals.
- **Subscribed-channel import is more resilient across browsers**: the importer now relies more on real `/feed/channels` page growth and recent page browse responses.
- **Channel Management rows can link directly to channel pages** using the best available identifier.
- **The injected 3-dot block menu item can now be disabled** independently of Quick Block.
- **Encrypted Firefox export is more dependable** thanks to a safer manual-download fallback path.

## Nanah Device Trust & Sync

FilterTube now includes a device-to-device sync system powered by Nanah.

What it is:

- private device-to-device settings transfer
- no central sync account required
- supports one-time send, parent-controls-child, and full-account migration

Plain-language model:

1. both devices meet through a small relay
2. both devices confirm the same safety phrase
3. the real settings payload is meant to move directly from one device to the other

That means:

- the relay is only the meeting place
- FilterTube does not need a cloud copy of your settings
- trust saves relationship and policy for later live sessions
- trust does **not** mean hidden always-on background sync

Public relay page:

- [nanah-signaling.varshney-devansh614.workers.dev](https://nanah-signaling.varshney-devansh614.workers.dev/)

Simple Nanah flows:

```text
SEND THIS PROFILE ONCE

[Device A] -> pair -> [Device B]
    |                    |
    +-- verify phrase ---+
    |
    +-- send once ------> [Device B reviews and applies]
```

```text
PARENT CONTROLS CHILD

[Parent / Source] == managed link == [Child / Replica]
        |
        +-- choose remote child profile
        +-- send once
        +-- save managed link for later sessions
```

Important child rule:

- the first managed parent -> child connection may still need one local parent approval on the child device
- after that, the child does **not** always need to press allow
- that depends on the saved managed-link policy

Docs:

- [Nanah User Guide](docs/NANAH_USER_GUIDE.md)
- [Nanah Concerns Tracker](docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md)
- [Profiles & PIN Model](docs/PROFILES_PIN_MODEL.md)
- [Nanah P2P Project Plan](docs/NANAH_P2P_PROJECT_PLAN.md)

## Features

### Content Filtering

- **Block by Keyword**: Hide videos with specific words in the title.
- **Block Channels**: Paste Channel Name, `@handle`, `UCID`, or even `c/CustomURL`—FilterTube normalizes them all.
- **Hide Shorts**: Optional toggle to remove every Shorts shelf and player hand-off.
- **Smart Matching**: Choose partial or whole-word matching to stay strict or flexible.
- **Shelf & Playlist Cleanup**: Refilters shelves and playlists so blocked creators stay gone even after navigation.
- **Quick Block Cross (v3.2.7)**: One-tap hover cross on cards to block instantly (enabled by default, can be disabled).
- **3-Dot Menu Toggle (v3.3.0)**: The FilterTube item inside YouTube's native 3-dot menu can be disabled independently of Quick Block.
- **Content-Based Filters (v3.2.6)**: 
  - Filter by video duration (longer/shorter/between specific lengths)
  - Filter by upload date (newer/older/between specific dates)
  - Detect and filter clickbait ALL CAPS titles

### Channel & Data Management

- **Multi-Profile with PIN Locks**: Account + child profiles, each with independent filters/settings; optional PIN lock gates UI until unlocked.
- **Profile-Scoped Backups**: Auto-backup and manual export respect the active profile. Default (Master) can export full; non-default exports active-only.
- **Encrypted Backups**: PBKDF2-SHA256 (150k) + AES-GCM. Encryption auto-enables when the active profile has a PIN (or you pick “Encrypted” format); background verifies PIN before encrypting.
- **Firefox-Safe Encrypted Export (v3.3.0)**: Manual encrypted export now uses a Firefox-safe fallback instead of relying solely on the downloads API path.
- **Handle Enrichment Queue**: Newly imported channels are resolved slowly in the background to avoid hammering YouTube.
- **Kids Mode Profiles**: Maintain a separate, safer rule set for YouTube Kids without mixing it with the main profile; optional “Apply Kids list on main YouTube” sync toggle.
- **Channel Management Links (v3.3.0)**: Channel rows can open the real YouTube channel page via handle, UCID, or legacy custom URL.

### Comment Control

- **Hide All Comments**: Remove the comments section entirely for a cleaner interface.
- **Filter Comments**: Hide specific comments containing unwanted keywords.

### Release Awareness

- **Release Notes Banner**: Non-intrusive toast in YouTube surfaces highlights new capabilities.
- **“What’s New” Dashboard Tab**: Full changelog with deep links so you can jump straight to the feature that shipped.

### Stats & Insights

- **Time Saved**: See how much time you've saved by blocking distractions.
- **Daily Tracker**: Count of videos hidden today.

### Performance & Privacy

- **Zero Flash**: Filters content *before* it renders on screen using proactive XHR interception.
- **Instant Blocking**: 3-dot menus show correct channel names immediately—no "Fetching..." delays.
- **Collaboration-Aware Menus (v3.3.0)**: Watch-page collaboration rows, Mix/watch recovery paths, and watch-side lockups can now upgrade to the full collaborator roster in the 3-dot UI.
- **Network Reduction**: Most channel identity comes from intercepted JSON, not page fetches.
- **100% Private**: No data leaves your browser. No analytics. No tracking.
- **Modern UI/UX (v3.2.6)**: Clean typography, refined components, enhanced dark mode, and Kids Mode theming.

### Proactive Channel Identity (v3.2.2)

FilterTube now uses a **proactive, XHR-first** strategy to extract channel identity before rendering, enhanced with lag-free performance optimizations and improved user experience:

- **XHR Interception**: Captures YouTube's JSON responses (`/youtubei/v1/next`, `/browse`, `/player`)
- **Instant Stamping**: Broadcasts channel info across worlds to stamp DOM cards immediately
- **Zero-Network Kids**: YouTube Kids works entirely without network fetches
- **Smart Enrichment**: Post-block enrichment fills missing metadata at a controlled rate
- **Optimistic UI**: Content hides instantly when blocked, with automatic restoration if needed
- **Mobile Support**: Enhanced 3-dot menu injection for YouTube mobile with proper renderer handling
- **Smooth Rendering**: Large channel lists render efficiently using idle scheduling and batching

Learn more in [Proactive Channel Identity](docs/PROACTIVE_CHANNEL_IDENTITY.md).

### Help & Documentation

- **Help Page (Dashboard)**: In the new tab UI, a dedicated Help section explains every feature, import/export flow, and troubleshooting tip.
- **Technical Docs**:
  - [Channel Blocking System](docs/CHANNEL_BLOCKING_SYSTEM.md) – Architecture and data flow
  - [Proactive Channel Identity](docs/PROACTIVE_CHANNEL_IDENTITY.md) – XHR interception and instant stamping
  - [Developer Guide](docs/DEVELOPER_GUIDE.md) – Extending FilterTube for new YouTube features
  - [Architecture](docs/ARCHITECTURE.md) – System design and cross-world messaging
  - [YouTube Kids Integration](docs/YOUTUBE_KIDS_INTEGRATION.md) – Kids-specific optimizations
  - [3-Dot Menu Improvements](docs/THREE_DOT_MENU_IMPROVEMENTS.md) – collaborator-aware menu recovery and Mix/watch handling
  - [Subscribed Channels Import](docs/SUBSCRIBED_CHANNELS_IMPORT.md) – whitelist import flow and cross-browser page capture details

## Installation

### For Users
The easiest way to install FilterTube is via our official website:
👉 **[Install FilterTube.in](https://filtertube.in)** (Available for Chrome, Firefox, Edge, Brave, Opera)

Prefer a direct store link? Pick your browser:

- **Chrome / Brave**: [Chrome Web Store listing](https://chromewebstore.google.com/detail/filtertube/cjmdggnnpmpchholgnkfokibidbbnfgc)
- **Firefox**: [Firefox Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/filtertube/)
- **Edge**: [Microsoft Edge Add-ons listing](https://microsoftedge.microsoft.com/addons/detail/filtertube/lgeflbmplcmljnhffmoghkoccflhlbem)

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
2.  **Install**: Use the Firefox build zip produced by `npm run build:firefox`.
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

Under the hood, FilterTube also maintains lightweight identity caches:

- `channelMap`: `@handle` / `c/<slug>` / `user/<slug>` ↔ `UC...`
- `videoChannelMap`: `videoId` → `UC...`

On both **YouTube Main** and **YouTube Kids**, FilterTube can often learn the canonical channel ID **without extra page fetches** by harvesting ownership data from the same JSON payloads YouTube already loads (notably `ytInitialPlayerResponse` and `/youtubei/v1/player`). Once learned, Shorts and Watch surfaces can resolve identity instantly on the next encounter.

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

- **Semantic ML Filtering (future)**: Reserved for local, explainable matching after runtime support is implemented; current releases enforce explicit keywords, channels, whitelist rules, and content controls
- **Kids Mode**: PIN-protected safe environment with whitelisted channels only
- **Smart Sync**: Automatic linking of channel @handles and IDs for better blocking

## Privacy & Permissions

We believe in privacy by design.
*   **Storage**: To save your settings locally.
*   **Active Tab**: To scan the YouTube page you are viewing.
*   **No External Requests**: FilterTube does not talk to any servers other than YouTube (for the content you requested).

## 🎬 Shorts Blocking Experience

FilterTube uses a robust hybrid blocking mechanism for YouTube Shorts.

**Current behavior (v3.1.8):** Shorts blocking is often **near-instant** because FilterTube learns `videoId → UC...` mappings from intercepted YouTube JSON and persists them. This makes Shorts behave much more like regular videos on Home/Search.

```ascii
[User Clicks "Block"]
        |
        v
+-------------------------------+
| 1. Resolve UC ID (fast path)  |
|    - DOM /channel/UC... OR    |
|    - videoChannelMap cache OR |
|    - Main-world JSON harvest  |
+-------------------------------+
               |
               v
+-----------------------+
| 2. Block & Hide       |
+-----------------------+
```

- **Robust Verification**: We resolve to a canonical `UC...` channel ID whenever possible so blocking applies across Shorts + long-form + posts.
- **Zero Leakage**: By resolving the canonical ID, we ensure that blocking a Short also blocks the channel's long-form videos and posts.
- **Smart Layouts**: Automatically adjusts the grid to prevent awkward blank spaces.

> [!NOTE]
> **What if the channel ID isn't available yet?**
> In rare cases where the card does not expose a `UC...` link and the mapping is not yet learned from intercepted JSON, FilterTube falls back to a slower network-based resolution (e.g., fetching a watch/shorts page) to guarantee correctness.

## Support

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/varshneydevansh/FilterTube/issues).

Want to support the project? You can donate on Ko-fi:     [![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/filtertube)

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

## Maintainer Notes: Script Layout

FilterTube runs code in two JavaScript contexts on YouTube:

### Isolated World (content scripts: DOM + UI)

The following scripts are loaded as content scripts (see `manifest*.json` for the authoritative load order):

- `js/shared/identity.js` – Shared channel identity helpers exposed as `window.FilterTubeIdentity`.
- `js/content/menu.js` – Menu styles + menu DOM helpers.
- `js/content/dom_helpers.js` – Small DOM helpers used by fallback logic.
- `js/content/dom_extractors.js` – DOM extraction helpers (video IDs, durations, card lookup).
- `js/content/dom_fallback.js` – DOM fallback filtering layer.
- `js/content/block_channel.js` – 3-dot menu observer/entry-point (detect dropdown + locate clicked card).
- `js/content_bridge.js` – Settings sync, bridge messaging, menu rendering/click handling, and blocking orchestration.

### Main World (page context: data interception)

- `js/seed.js` – Hook/override entry points for `ytInitialData`, `fetch`, and XHR.
- `js/injector.js` – Coordinator + main-world search helpers (e.g., `ytInitialData` lookups).
- `js/filter_logic.js` – Filtering engine that removes blocked content from YouTube’s JSON before render.
