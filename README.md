<div align="center">
  <img src="https://github.com/varshneydevansh/FilterTube/blob/master/icons/icon-128.png" alt="FilterTube Icon">
  <h1>FilterTube</h1>
  <p>Peace of Mind for your Digital Space</p>
  
  [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/varshneydevansh/FilterTube) ![Version](https://img.shields.io/badge/version-3.3.6-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Lines of Code](https://img.shields.io/badge/total%20lines-607.7k-brightgreen.svg) ![JavaScript LoC](https://img.shields.io/badge/javascript-106.5k%20lines-yellow.svg) ![Top Language](https://img.shields.io/github/languages/top/varshneydevansh/FilterTube?color=f1e05a) ![Repo Size](https://img.shields.io/github/repo-size/varshneydevansh/FilterTube?color=orange)
  
</div>

## Overview

FilterTube is a browser extension that gives you control over your YouTube feed. Filter videos, shorts, channels, and comments using keywords and smart rules—all processing happens privately on your device.

The public website now also acts as the download hub for browser releases, Android phone/tablet builds, and future store links:

👉 **[filtertube.in/downloads](https://filtertube.in/downloads)**

The current unreleased post-v3.3.5 source checkpoint is documented in the
[changelog history index](CHANGELOG.md), with the runtime, category, language,
Nanah, app-sync, and website contracts kept in the existing [documentation
map](docs/CODEMAP.md). Native Android/iOS parity and installed-device behavior
remain evidence-gated; the extension is still the runtime source of truth.

## What's New in v3.3.5

- **Duplicate content-runtime injection is fixed**: install/update/profile refresh no longer reinjects manifest content scripts into already-open YouTube tabs, preventing repeated `Identifier ... has already been declared` failures.
- **Blocked-channel Shorts resolve earlier**: visible and near-visible Shorts now use the existing bounded `/shorts/<videoId>` identity resolver when channel rules or whitelist mode are active, so known blocked-channel Shorts hide without waiting for hover/menu interaction.
- **New desktop Shorts hosts are covered in fallback**: `.shortsLockupViewModelHost` and `.ytGridShelfViewModelGridShelfItem` now participate in the dedicated Shorts fallback/enrichment path.
- **Rollback history is documented**: v3.3.4 was a store rollback to the v3.3.2 package while the YouTube breakage report was investigated; v3.3.5 moves forward with the runtime-injection and Shorts identity fixes.
- **No-rule performance stays gated**: Shorts identity fetching remains off when there are no channel/whitelist rules, and blocklist mode does not hide unknown Shorts before identity is resolved.
- **Still intentionally separate**: automatic LAN device discovery, a hosted FilterTube Internet Pickup service, silent public auto-subscribe catalogs, and native Android/iOS parity are not claimed as complete in this extension release.

## Nanah Device Trust & Sync

FilterTube now includes a device-to-device sync system powered by Nanah.

What it is:

- private device-to-device settings transfer
- no central sync account required
- supports one-time send, family device updates, and full-account migration

Plain-language model:

1. both devices meet through a small relay
2. both devices confirm the same safety phrase
3. the real settings payload is meant to move directly from one device to the other

That means:

- the relay is only the meeting place
- FilterTube does not need a cloud copy of your settings
- trust saves relationship and policy for later live sessions
- trust does **not** mean hidden always-on background sync
- app/extension sync keeps channel-derived keyword ownership intact across Nanah payloads
- pairing codes are alphanumeric but intentionally restricted to the Nanah safe alphabet

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
FAMILY DEVICE UPDATES

[Parent / Caregiver] -> choose protected profile
        |
        +-- Send Update -----> pair, verify phrase, send while both devices are open
        +-- Internet Pickup -> optional encrypted pickup service for a device that opens later or away
        +-- Home Pickup -----> optional explicit home/school pickup service
```

Important protected-profile rules:

- one Family Device map covers nearby, same-network, and away/internet devices after pairing
- verified devices appear as recipient tiles; choose one, press `Send update`, then choose exactly one available path: live, Home Pickup, or encrypted Internet Pickup
- delivery paths are not authority; trusted link, target profile, scope, revision, and local validation still decide what applies
- `Internet Pickup` can hold unreadable signed updates for away/opens-later devices, but it cannot edit profiles, PINs, trusted links, viewing access, or time limits by itself
- `Home Pickup` is an explicitly configured same-network pickup service, not automatic Wi-Fi scanning
- protected profiles keep their last valid policy when offline
- a protected-profile PIN can open receive-only sync, but it cannot unlock parent/admin controls
- parent/admin unlock is temporary; sensitive actions can re-check the PIN, repeated wrong PIN attempts are delayed, and failed-unlock evidence stays in protected local history

Self-hosted pickup provider:

```bash
FILTERTUBE_PROVIDER_HOST=0.0.0.0 \
FILTERTUBE_PROVIDER_STORE=.filtertube/managed-delivery-store.json \
npm run managed:provider
```

- Home Pickup uses `http://<this-computer-lan-ip>:8787/filtertube` on the trusted home/school network
- Internet Pickup uses the same provider only after you expose it through your own trusted HTTPS address
- opening `/filtertube` in a browser shows a safe FilterTube Pickup Provider status page; API callers can request the JSON status payload; rule contents, PINs, private keys, and profile policy are never shown there

Per-profile time limits:

- Daily budgets and usage are stored under the active profile, including account and protected profiles; profiles do not consume one shared household/browser timer.
- The YouTube page and FilterTube popup show the active profile's remaining allowance; active playback continues consuming time even when another window temporarily has focus.
- When daily time is exhausted, a full-page serene FilterTube screen covers YouTube and keeps underlying playback paused.
- The exhausted profile cannot dismiss the screen. A different profile can use the in-page **Switch profile** picker and complete its normal PIN check; parent-managed protected profiles still require parent/account authority for grants or policy changes.
- Protected users can request more time, but the request is only a history row until a parent or caregiver approves it.

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
- **Quick Block Cross (v3.2.7)**: One-tap hover cross on cards for fast blocking from the page (enabled by default, can be disabled).
- **3-Dot Menu Toggle (v3.3.0)**: The FilterTube item inside YouTube's native 3-dot menu can be disabled independently of Quick Block.
- **Content-Based Filters (v3.2.6)**: 
  - Filter by video duration (longer/shorter/between specific lengths)
  - Filter by upload date (newer/older/between specific dates)
  - Detect and filter clickbait ALL CAPS titles

### Channel & Data Management

- **Multi-Profile with PIN Locks**: Account + protected profiles, each with independent filters/settings; optional PIN lock gates UI until unlocked.
- **Profile-Scoped Backups**: Auto-backup and manual export respect the active profile. Default (Master) can export full; non-default exports active-only.
- **Encrypted Backups**: PBKDF2-SHA256 (150k) + AES-GCM. Encryption auto-enables when the active profile has a PIN (or you pick “Encrypted” format); background verifies PIN before encrypting.
- **Firefox-Safe Export (v3.3.1)**: Manual plain and encrypted JSON export now use a Firefox-safe fallback instead of relying on the extension downloads API subfolder path.
- **System Theme Default (v3.3.1)**: New installs resolve the initial UI theme from `prefers-color-scheme`; explicit light/dark toggles remain sticky.
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

- **Early Filtering**: JSON-backed surfaces can be filtered before paint when YouTube exposes the needed fields; DOM fallback handles surfaces that arrive later or with weaker data.
- **Fast Menu Blocking**: 3-dot menus can show proven channel names immediately when JSON, learned maps, or DOM already provide enough identity; weak targets may still use a resolver.
- **Collaboration-Aware Menus (v3.3.0)**: Watch-page collaboration rows, Mix/watch recovery paths, and watch-side lockups can now upgrade to the full collaborator roster in the 3-dot UI.
- **Large Blocklist Matching (v3.3.1)**: Channel checks use shared set-backed indexes for UC IDs, handles, custom URLs, and strict fallback names so 200+ saved channels do not create renderer-by-renderer scan costs.
- **Quiet Production Runtime**: Routine `console.log` / `console.debug` output is muted outside explicit debug mode, keeping YouTube hot paths from paying logging overhead during normal browsing.
- **Network Reduction**: Channel identity is preferred from intercepted JSON and learned maps; bounded fallback resolvers remain for weak watch, Shorts, Kids, playlist, and menu targets.
- **Local-First Privacy**: Extension rules and settings stay in browser storage. The extension does not run a FilterTube account service, extension analytics, or ad-tracking profile.
- **Modern UI/UX (v3.2.6)**: Clean typography, refined components, enhanced dark mode, and Kids Mode theming.

### JSON-First Channel Identity (v3.2.2+)

FilterTube prefers intercepted YouTube JSON and `ytInitial*` payloads when they
expose stable channel identity, then carries that identity through learned maps,
DOM extraction, and bounded fallback resolvers when a route exposes only weak
surface data:

- **YouTubei capture**: Reads supported `/youtubei/v1/next`, `/browse`, and `/player` payloads when YouTube provides useful identity.
- **Learned maps**: Reuses `channelMap`, `videoChannelMap`, and `videoMetaMap` so later DOM/menu paths can join a visible video id back to a stronger source.
- **DOM fallback**: Uses visible-card extraction only as a lower-confidence fallback or enrichment layer.
- **Bounded resolver**: Keeps background identity fetches as a last-resort path for watch, Shorts, Kids, playlist, or weak menu targets that do not expose enough identity locally.
- **Mobile support**: Enhanced 3-dot menu insertion for YouTube mobile with route-specific renderer handling.
- **Performance direction**: Current audit work is tightening no-rule, route, lifecycle, and resolver budgets so filtering stays precise without waking unnecessary work.

Learn more in [Proactive Channel Identity](docs/PROACTIVE_CHANNEL_IDENTITY.md).

### Help & Documentation

- **Help Page (Dashboard)**: In the new tab UI, a dedicated Help section explains every feature, import/export flow, and troubleshooting tip.
- **Technical Docs**:
  - [Channel Blocking System](docs/CHANNEL_BLOCKING_SYSTEM.md) – Architecture and data flow
  - [Proactive Channel Identity](docs/PROACTIVE_CHANNEL_IDENTITY.md) – JSON-first identity harvesting, learned maps, DOM fallback, and bounded resolvers
  - [Developer Guide](docs/DEVELOPER_GUIDE.md) – Extending FilterTube for new YouTube features
  - [Architecture](docs/ARCHITECTURE.md) – System design and cross-world messaging
  - [Release Notes Data](data/release_notes.json) – packaged What's New entries for release-facing changes
  - [YouTube Kids Integration](docs/YOUTUBE_KIDS_INTEGRATION.md) – Kids-specific optimizations
  - [3-Dot Menu Improvements](docs/THREE_DOT_MENU_IMPROVEMENTS.md) – collaborator-aware menu recovery and Mix/watch handling
  - [Subscribed Channels Import](docs/SUBSCRIBED_CHANNELS_IMPORT.md) – whitelist import flow and cross-browser page capture details
  - [User Feedback Rules and Guidance Spec](docs/USER_FEEDBACK_RULES_AND_GUIDANCE_SPEC_2026-08-08.md) – addressed parent guidance plus blocklist exceptions, complete BlockTube migration, maintained filter-list subscriptions, and Firefox mobile Shorts reliability
  - [Android Public Distribution](docs/ANDROID_PUBLIC_DISTRIBUTION.md) – APK/AAB, GrapheneOS, F-Droid, and release-channel plan
  - [App Release and Runtime Sync Workflow](docs/APP_RELEASE_AND_RUNTIME_SYNC_WORKFLOW.md) – extension-to-native runtime sync and cross-platform release order

## Installation

### For Users
The easiest way to install FilterTube is via our official website:
👉 **[Install FilterTube.in](https://filtertube.in/downloads)** (browser builds today, Android phone/tablet release links as they become public)

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

FilterTube filters unwanted content as early as supported YouTube surfaces expose
enough data, then uses DOM fallback for content that appears later or arrives
with weaker identity.

Under the hood, FilterTube also maintains lightweight identity caches:

- `channelMap`: `@handle` / `c/<slug>` / `user/<slug>` ↔ `UC...`
- `videoChannelMap`: `videoId` → `UC...`

On both **YouTube Main** and **YouTube Kids**, FilterTube can often learn the
canonical channel ID **without extra page fetches** by harvesting ownership data
from the same JSON payloads YouTube already loads (notably
`ytInitialPlayerResponse` and `/youtubei/v1/player`). Once learned, Shorts and
Watch surfaces can often resolve identity from the local map on later
encounters. Some route-specific surfaces still need DOM enrichment or a bounded
background resolver when the page exposes only a video id or weak display text.

```
┌─────────────────────────────────────────────────────────────┐
│  YouTube loads video data                                   │
│          ↓                                                  │
│  FilterTube reads supported JSON when it has enough fields  │
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

**Fast on proven data** - JSON-backed cards can be filtered early, while later DOM insertions are handled by fallback scans

**Local-first privacy** - Extension rules and profiles stay in browser storage; there is no FilterTube account dashboard or extension analytics pipeline

**Comprehensive** - Filters videos, shorts, playlists, channels, comments, and more across all YouTube pages

**Reliable by layers** - Uses JSON-first data, learned maps, DOM fallback, and bounded resolvers for surfaces that do not expose enough identity immediately

### Future Features (Coming Soon)

- **Semantic ML Filtering (future)**: Reserved for local, explainable matching after runtime support is implemented; current releases enforce explicit keywords, channels, whitelist rules, and content controls
- **Kids Mode**: PIN-protected safe environment with whitelisted channels only
- **Smart Sync**: Automatic linking of channel @handles and IDs for better blocking

## Privacy & Permissions

We believe in privacy by design.
*   **Storage**: To save your settings locally.
*   **Active Tab**: To scan the YouTube page you are viewing.
*   **Local-first runtime**: rules and profiles are stored locally. YouTube and YouTube Kids pages still load their normal services, and weak identity targets may use bounded YouTube resolver requests when current JSON/maps/DOM are insufficient.

## 🎬 Shorts Blocking Experience

FilterTube uses a robust hybrid blocking mechanism for YouTube Shorts.

**Current behavior:** Shorts blocking is fastest when FilterTube already has a
stable `videoId -> UC...` mapping from intercepted YouTube JSON, player data,
or a learned map. Some Shorts surfaces still expose only `/shorts/VIDEO_ID` at
first, so that video id is treated as a join key until a stronger owner source
is available.

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
- **Canonical Blocking**: When the canonical channel ID is resolved, blocking a Short also applies to that channel's long-form videos and posts.
- **Smart Layouts**: Automatically adjusts the grid to prevent awkward blank spaces.

> [!NOTE]
> **What if the channel ID isn't available yet?**
> When the card does not expose a `UC...` link and no learned mapping is
> available yet, FilterTube may use a bounded watch/Shorts resolver. That path is
> slower, route-specific, and still needs the same source-confidence and
> side-effect proof as the rest of the identity waterfall.

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
