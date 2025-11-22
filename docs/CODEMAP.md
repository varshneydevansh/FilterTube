# FilterTube v3.0 Code Map

This document provides a detailed reference of the key files and functions in the FilterTube v3.0 codebase.

## Directory Structure

```
FilterTube/
├── css/                  # Stylesheets
├── docs/                 # Documentation (Architecture, Technical, Codemap)
├── html/                 # HTML for Popup and Tab View
├── js/                   # Core JavaScript Logic
│   ├── background.js     # Extension Service Worker
│   ├── content_bridge.js # Isolated World Script (DOM Fallback)
│   ├── filter_logic.js   # Main World Script (Filter Engine)
│   ├── injector.js       # Main World Script (Coordinator)
│   ├── popup.js          # UI Logic
│   └── seed.js           # Main World Script (Data Interception Hooks)
└── manifest.json         # Extension Manifest
```

## Key Files & Functions

### `js/background.js`
**Context:** Service Worker / Background
**Purpose:** Settings management and cross-browser compatibility.

| Function | Description |
| :--- | :--- |
| `getCompiledSettings()` | Reads settings from storage, compiles regex patterns, and returns a clean settings object. |
| `browserAPI.runtime.onMessage` | Listens for `getCompiledSettings`, `injectScripts`, and `FilterTube_ApplySettings`. |
| `browserAPI.storage.onChanged` | Monitors storage changes to trigger re-compilation of settings. |

### `js/content_bridge.js`
**Context:** Isolated World
**Purpose:** Script injection, DOM fallback, and message relay.

| Function | Description |
| :--- | :--- |
| `initializeStats()` | Loads the daily blocked video count from storage. |
| `incrementHiddenStats()` | Increments the blocked counter and calculates "time saved". |
| `toggleVisibility(element, shouldHide)` | Applies/removes the `.filtertube-hidden` class and pauses media. |
| `applyDOMFallback(settings)` | Scans the DOM for video elements and applies filters (secondary layer). |
| `extractChannelMetadataFromElement(...)` | Attempts to find channel ID/Handle from DOM attributes or Polymer data. |

### `js/seed.js`
**Context:** Main World
**Purpose:** Low-level API hooking for data interception.

| Function | Description |
| :--- | :--- |
| `Object.defineProperty(window, 'ytInitialData', ...)` | Intercepts the initial page load data. |
| `Object.defineProperty(window, 'ytInitialPlayerResponse', ...)` | Intercepts the initial video player data. |
| `window.fetch` (Proxy) | Intercepts dynamic network requests (SPA navigation). |
| `XMLHttpRequest.prototype.open` (Proxy) | Intercepts legacy XHR requests. |

### `js/filter_logic.js`
**Context:** Main World
**Purpose:** The core filtering engine.

| Class / Object | Description |
| :--- | :--- |
| `FILTER_RULES` | A large constant defining how to extract data from each YouTube "Renderer" type. |
| `YouTubeDataFilter` | The main class that instantiates the filter logic. |
| `_shouldBlock(item, rendererType)` | Determines if a specific item matches user block rules. |
| `_extractTitle`, `_extractChannelInfo` | Helper methods to pull metadata from complex JSON objects. |
| `FilterTubeEngine.processData(data)` | The public entry point called by `seed.js` to filter a data payload. |

### `js/injector.js`
**Context:** Main World
**Purpose:** Coordinates the initialization of the Main World scripts.

| Function | Description |
| :--- | :--- |
| `init()` | Sets up the `FilterTubeEngine` and requests initial settings. |
| `window.addEventListener('message')` | Listens for settings updates from `content_bridge.js`. |

### `js/popup.js`
**Context:** Popup UI
**Purpose:** Handles user interaction in the extension popup.

| Function | Description |
| :--- | :--- |
| `loadSettings()` | Fetches current settings to populate the UI. |
| `saveSettings()` | Saves user changes to `chrome.storage.local`. |
| `updateStats()` | Displays the "Videos Hidden" and "Time Saved" stats. |
