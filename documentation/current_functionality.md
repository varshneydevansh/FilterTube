# FilterTube - Current Functionality (As of Last Edit)

This document outlines the features, functionality, and structure of the FilterTube browser extension in its current state.

## Purpose

FilterTube aims to provide users with control over the YouTube content they see by hiding videos based on user-defined criteria. This is primarily intended to help users avoid unwanted topics, spoilers, or channels.

## Core Functionality

1.  **Keyword Filtering:** Hides video elements if specified keywords (case-insensitive, comma-separated) are found in:
    *   Video Title
    *   Channel Name
    *   Video Description Snippet (Search Results & Watch Page)
    *   Hashtags (in description snippet, metadata line, or full description)
    *   Associated Game Card Title (on Watch Page)
    *   Playlist Titles (Search Results & Channel Pages)
    *   Mix Titles (Search Results)

2.  **Channel Filtering:** Hides all videos and channel elements (like search results or shelf entries) associated with specified channel names (case-insensitive, comma-separated).

3.  **Element Types Filtered:** The extension attempts to identify and filter various YouTube elements:
    *   Standard Video Renderers (Home feed, Search, Recommendations)
    *   Compact Video Renderers (Watch page sidebar)
    *   Grid Video Renderers (Channel pages, Subscriptions)
    *   Rich Item Renderers (Home feed wrappers)
    *   Playlist/Mix Cards (Search results)
    *   Shelves (Channel pages, Home feed)
    *   Mixes (Search results `ytd-radio-renderer`)
    *   Channel Blocks (Search results, Grids)
    *   Shorts (Reel shelves and items)

4.  **Anti-Flicker Mechanism:**
    *   Uses CSS (`content.css`) injected early (`run_at: document_start`) to hide all potential video/container elements by default (`display: none !important;`).
    *   The content script (`js/content.js`) then runs, identifies elements that *should not* be hidden according to the filters, and adds a `.filter-tube-visible` class to them.
    *   The CSS rule for `.filter-tube-visible` reverts the display property (`display: block !important;` with `margin-bottom`) to make the desired content appear, minimizing the flash of unwanted content.

5.  **User Interface (Popup):**
    *   Provides a simple popup (`popup.html` & `js/popup.js`) accessed via the extension toolbar icon.
    *   Allows users to enter comma-separated keywords and channel names.
    *   Saves these preferences to browser storage (`chrome.storage.local`).
    *   Loads existing preferences when opened.

6.  **Dynamic Content Handling:**
    *   Uses a `MutationObserver` to detect when YouTube dynamically loads new content (e.g., infinite scroll).
    *   Applies the filtering logic automatically to newly added elements (with throttling to prevent excessive checks).
    *   Includes a less frequent `setInterval` fallback check for robustness.

## Browser Compatibility

*   **Chrome:** Developed primarily targeting Chrome's Manifest V3.
*   **Firefox:** Compatible, but requires a minor modification to `manifest.json` for temporary loading (using `background.scripts` instead of `background.service_worker`). The code uses `chrome.*` APIs, relying on Firefox's compatibility layer. Using the `webextension-polyfill` and `browser.*` namespace would be best practice for published cross-browser extensions.

## File Structure

```
/FilterTube
├── css/
│   └── content.css         # Styles for hiding/showing elements
├── documentation/
│   └── current_functionality.md # This file
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
├── js/
│   ├── background.js       # Background script (handles install, storage init)
│   ├── content.js          # Core logic: finds & filters YT elements
│   └── popup.js            # Handles logic for the settings popup
├── LICENSE                   # MIT License file
├── manifest.json             # Extension configuration (currently set for Firefox testing)
├── popup.html                # HTML structure for the settings popup
└── README.md                 # Basic project README
```

## Known Issues / Areas for Improvement

*   **Manifest Management:** Requires manual switching or a build process to manage the `background` script difference between Chrome V3 (`service_worker`) and Firefox V2 (`scripts`).
*   **CSS Spacing:** The `margin-bottom` added to `.filter-tube-visible` might need fine-tuning to perfectly match default YouTube spacing in all contexts.
*   **Selector Robustness:** YouTube frequently updates its structure. Selectors might need periodic updates to remain effective.
*   **Performance:** While optimized with throttling and targeted selectors, complex pages or rapid scrolling could still impact performance.
*   **`chrome.*` Namespace:** Relies on Firefox's compatibility layer; using `browser.*` with a polyfill is more standard for cross-browser support.

This summary reflects the state after the last series of edits addressing selector issues and the anti-flicker mechanism. 