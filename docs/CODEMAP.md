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
│   ├── content_bridge.js # Isolated World Script (DOM Fallback & Stats)
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
**Purpose:** Script injection, DOM fallback, and stats tracking.
| Function | Description |
| :--- | :--- |
| `incrementHiddenStats()` | Increments the blocked counter and calculates "time saved". |
| `extractVideoDuration()` | Parses video duration for accurate time saved calculation. |
| `applyDOMFallback(settings)` | Scans the DOM for video elements and applies filters (secondary layer). |
| `fetchChannelFromShortsUrl(videoId)` | Fetches Shorts page in background to extract channel info. |
| `handleBlockChannelClick()` | Orchestrates the blocking flow: immediate hide + background block. |
| `injectFilterTubeMenuItem()` | Injects the "Block Channel" option into YouTube's 3-dot menu. |
| `enrichCollaboratorsWithMainWorld()` | Bridges collaborator requests between DOM and Main world, ensuring `allCollaborators` is populated. |
| `generateCollaborationGroupId()` | Creates deterministic IDs so grouped channels remain linked across storage/UI. |

### `js/filter_logic.js`
**Context:** Main World
**Purpose:** The core filtering engine.
| Class / Object | Description |
| :--- | :--- |
| `FILTER_RULES` | Defines how to extract data from each YouTube "Renderer" type. |
| `FilterTubeEngine.processData(data)` | The public entry point called by `seed.js` to filter a data payload. |

### `js/popup.js` & `js/tab-view.js`
**Context:** UI Contexts
**Purpose:** Entry points for the UI, initializing `StateManager` and `RenderEngine`.

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
