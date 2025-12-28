# FilterTube v3.0 Code Map

This document provides a detailed reference of the key files and functions in the FilterTube v3.0 codebase.

## Directory Structure

```
FilterTube/
├── css/                  # Stylesheets (components.css, popup.css, tab-view.css)
├── docs/                 # Documentation (Architecture, Technical, Codemap)
├── html/                 # HTML for Popup and Tab View
├── js/                   # Core JavaScript Logic
│   ├── background.js     # Extension Service Worker
│   ├── content_bridge.js # Isolated World Script (bridge + menu rendering + blocking orchestration)
│   ├── content/          # Isolated World helpers (loaded by manifest ordering)
│   │   ├── block_channel.js   # 3-dot dropdown observer + injection entry-point
│   │   ├── dom_extractors.js  # DOM extraction helpers (videoId, duration, card lookup)
│   │   ├── dom_fallback.js    # DOM fallback filtering layer
│   │   ├── dom_helpers.js     # Small DOM helpers
│   │   └── menu.js            # Menu styles + UI helpers
│   ├── shared/
│   │   └── identity.js    # Shared identity helpers exposed as window.FilterTubeIdentity
│   ├── filter_logic.js   # Main World Script (Filter Engine)
│   ├── injector.js       # Main World Script (Coordinator)
│   ├── popup.js          # Popup UI Logic
│   ├── tab-view.js       # Tab View UI Logic
│   ├── seed.js           # Main World Script (Data Interception Hooks)
│   ├── state_manager.js  # Centralized State Management
│   ├── settings_shared.js# Shared Settings Utilities
│   ├── render_engine.js  # UI Rendering Logic
│   └── ui_components.js  # Reusable UI Components
└── manifest.json         # Extension Manifest
```

## Key Files & Functions

### `data/release_notes.json`
**Context:** Packaged asset (shared between background + UI)
**Purpose:** Single source of truth for release notes surfaced in both the banner and the dashboard.
| Field | Description |
| :--- | :--- |
| `version` | Semantic version string (e.g., `3.1.6`). |
| `headline`, `summary`, `bannerSummary` | Copy shown in dashboard cards vs. banner CTA. |
| `highlights[]` | Bullet list rendered in the “What’s New” tab. |
| `detailsUrl` | External release URL (GitHub tag/commit). |

### `js/content/release_notes_prompt.js`
**Context:** Isolated World (YouTube pages)
**Purpose:** Shows the “FilterTube updated” banner once per version, using the payload stored by the background worker. CTA calls `FilterTube_OpenWhatsNew`, which focuses `tab-view.html?view=whatsnew` via background messaging so blockers never intercept `chrome-extension://` URLs.

### `js/io_manager.js`
**Context:** UI contexts (Tab View) + future sync modules
**Purpose:** Canonical import/export engine. Normalizes channel/keyword entries, merges imports (UC IDs, @handles, `c/slug`), adapts BlockTube/plaintext formats, and emits the versioned portable schema consumed by future sync tooling.

### `js/state_manager.js`
**Context:** UI Contexts (Popup, Tab View)
**Purpose:** The Single Source of Truth for application state.
| Function | Description |
| :--- | :--- |
| `loadSettings()` | Loads settings from storage and initializes state. |
| `saveSettings()` | Persists state to storage and notifies listeners. |
| `subscribe(listener)` | Allows components to react to state changes. |
| `addKeyword/Channel` | Centralized logic for adding filters. |

### `js/settings_shared.js`
**Context:** Shared (Background, UI)
**Purpose:** Utilities for normalizing and compiling settings.
| Function | Description |
| :--- | :--- |
| `syncFilterAllKeywords` | Merges user keywords with channel-derived keywords. |
| `compileKeywords` | Converts keywords into RegExp patterns. |

### `js/content_bridge.js`
**Context:** Isolated World
**Purpose:** Script injection, bridge messaging, menu rendering/click handling, and blocking orchestration.
| Function | Description |
| :--- | :--- |
| `incrementHiddenStats()` | Increments the blocked counter and calculates "time saved". |
| `fetchChannelFromShortsUrl(videoId)` | Fetches Shorts page in background to extract channel info (handles canonical UC resolution fallback). |
| `handleBlockChannelClick()` | Orchestrates the blocking flow: immediate hide + background block + multi-layer 404 recovery (ytInitialData replay, Shorts helpers, channelMap broadcast). |
| `injectFilterTubeMenuItem()` | Injects the "Block Channel" option into YouTube's 3-dot menu (new selectors cover `button-view-model` home cards). |
| `enrichCollaboratorsWithMainWorld()` | Bridges collaborator requests between DOM and Main world, ensuring `allCollaborators` is populated for every surface. |
| `generateCollaborationGroupId()` | Creates deterministic IDs so grouped channels remain linked across storage/UI. |

### `js/content/dom_fallback.js`
**Context:** Isolated World
**Purpose:** DOM fallback filtering layer (MutationObserver + hide/restore).
| Function | Description |
| :--- | :--- |
| `applyDOMFallback(settings, options)` | Scans the DOM for video elements and applies fallback hiding/restoring. Tracks `data-filtertube-last-processed-id` and clears stale `data-filtertube-channel-*` metadata when YouTube reuses DOM nodes. |

### `js/content/block_channel.js`
**Context:** Isolated World
**Purpose:** Detect YouTube 3-dot dropdown openings, locate the associated card from the last clicked menu button, and call `injectFilterTubeMenuItem(dropdown, card)`.

### `js/content/dom_extractors.js`
**Context:** Isolated World
**Purpose:** Shared DOM extraction utilities (e.g., `ensureVideoIdForCard`, `extractVideoDuration`, `findVideoCardElement`).

### `js/filter_logic.js`
**Context:** Main World
**Purpose:** The core filtering engine.
| Class / Object | Description |
| :--- | :--- |
| `FILTER_RULES` | Defines how to extract data from each YouTube "Renderer" type (includes lockup/attributed channel + collab dialog listItems). |
| `FilterTubeEngine.processData(data)` | The public entry point called by `seed.js` to filter a data payload. |
| `_harvestPlayerOwnerData(data)` | Extracts channel IDs/handles from `ytInitialPlayerResponse`, playlist panels, and lockup metadata to keep the channel map warm even when the DOM omits handles. |
| `_registerMapping(id, handle)` | Writes every discovered `(UC ↔ handle)` pair to the cross-world `channelMap`, feeding background cache-first lookups. |

### `js/popup.js` & `js/tab-view.js`
**Context:** UI Contexts
**Purpose:** Entry points for the UI, initializing `StateManager` and `RenderEngine`.

#### Tab view additions (v3.1.6)
- Adds a “What’s New” navigation tab that loads cards from `data/release_notes.json`.
- Reads both hash (`#whatsnew`) and query parameters (`?view=whatsnew`) so banner deep-links auto-select the correct view.
- Import/Export card calls into `io_manager.js` for all serialization logic.

### `js/render_engine.js`
**Context:** UI Contexts
**Purpose:** Handles DOM updates and rendering of lists (keywords, channels).
| Function | Description |
| :--- | :--- |
| `buildCollaborationMeta()` | Computes present vs. missing collaborators, badge counts, and tooltip copy per row. |
| `createCollaborationBadge()` | Renders the 🤝 badge with `presentCount/totalCount`. |
| `createFullChannelItem()` | Applies yellow/dashed rails, tooltips, and per-entry controls without altering FCFS order. |

### `js/ui_components.js`
**Context:** UI Contexts
**Purpose:** Provides reusable HTML generators for UI elements (cards, buttons).
