# FilterTube Development Tasks

## Phase 1: New Architecture - MVP (Completed)
*   **Goal:** Implement core architecture for intercepting and filtering YouTube data *before* DOM rendering.
*   **Status:** Completed. Initial proof-of-concept for `ytInitialData` and `ytInitialPlayerResponse` hooking and basic filtering logic is in place. Communication between background, content_bridge (isolated), and injector (main world) is established.
*   **Key Tasks Done:**
    *   [x] Setup `manifest.chrome.json` and `manifest.firefox.json` for MV3.
    *   [x] Created `js/injector.js` and `js/filter_logic.js`.
    *   [x] Renamed `js/content.js` to `js/content_bridge.js`.
    *   [x] Adapted `js/background.js` for new settings compilation and messaging.
    *   [x] Implemented `js/content_bridge.js` for script injection and message relay.
    *   [x] Implemented initial `js/injector.js` to hook `ytInitialData` & `ytInitialPlayerResponse` and communicate with bridge.
    *   [x] Implemented basic `js/filter_logic.js` with PoC filtering (test IDs) and initial comment hiding structure.
*   **Debugging & Refinements (Post-Initial Implementation):**
    *   [x] Corrected `manifest.firefox.json` to include `scripting` permission.
    *   [x] Ensured `js/content_bridge.js` was correctly overwritten with new logic, removing old DOM-based filtering code.
    *   [x] Refined `js/injector.js` for robust settings handling, improved logging (via `postMessage` to bridge), and a queueing system for early data. Added checks for `filterLogic.js` availability.
    *   [x] Updated `js/filter_logic.js` for initial `hideAllComments` functionality, proper settings handling, `dataName` parameter, basic recursive filtering using actual settings (keywords, channels), and improved logging.

## Phase 2: Comprehensive Hooking & Filtering Logic (In Progress)
*   **Goal:** Implement `fetch` and `XMLHttpRequest` hooks. Develop comprehensive, recursive filtering in `filter_logic.js`.
*   **Key Tasks:**
    *   [x] **Created `js/seed.js` for early data interception:**
        *   [x] Runs at document_start in both manifests to ensure FilterTube hooks are in place before YouTube loads.
        *   [x] Adds global filterTube object to communicate with other components.
        *   [x] Establishes custom events for coordination between scripts.
    *   [x] **Data Hooking:**
        *   [x] Implemented `window.fetch` override in seed.js.
        *   [x] Implemented `XMLHttpRequest.prototype.open` and `send` overrides in seed.js.
        *   [x] Set up handling of non-JSON responses.
        *   [x] Ensured early hooks for `ytInitialData` and `ytInitialPlayerResponse`.
    *   [ ] **`js/filter_logic.js` (In Progress):**
        *   [x] Developed initial recursive traversal and filtering algorithms.
        *   [x] Implemented basic video filtering based on `settings.filterKeywords` and `settings.filterChannels`.
        *   [x] Added handling for various video renderer types (search, recommendations, shorts).
        *   [ ] Further improve channel filtering logic for all YouTube page types.
        *   [ ] Enhance individual comment filtering when `hideAllComments` is false but `filterComments` is true.
        *   [ ] Improve playlist filtering.
        *   [ ] Optimize processing of large JSON objects.
        *   [ ] Add more comprehensive handling of different YouTube page structures.
    *   [x] **Updated Manifests:**
        *   [x] Added `js/seed.js` to content_scripts with `run_at: "document_start"`.
        *   [x] Included `js/seed.js` in web_accessible_resources.
    *   [x] **Settings & UI Integration:**
        *   [x] Added "Hide All Shorts" feature to popup.html and tab-view.html.
        *   [x] Implemented filter setting compilation in background.js.
        *   [x] Ensured all filter settings from the UI are properly respected by the new filtering logic.
    *   [ ] **Testing & Refinement (Ongoing):**
        *   [ ] Complete testing on various YouTube pages (home, watch, search, channel, shorts, playlists).
        *   [ ] Verify `hideAllComments` and `filterComments` functionality in all scenarios.
        *   [ ] Debug any remaining issues with data modification.
        *   [ ] Further optimize performance.

## Phase 3: Advanced Features & Polish (Future)
*   [ ] Filter community posts.
*   [x] Hide all Shorts toggle.
*   [ ] Add export/import settings.
*   [ ] Add filter presets.
*   [ ] Support for YouTube Music.
*   [ ] Support for YouTube TV.
*   [ ] Support for old YouTube layouts (if feasible).

## Documentation
*   [x] Create CHANGELOG.md
*   [x] Create TASKS.md (this file)
*   [ ] Improve README with usage instructions for new architecture.
*   [ ] Add screenshots to README.
*   [ ] Create technical documentation for the new code structure and data flow.
*   [ ] Add architectural diagrams.


## Development Process
*   [x] Set up Git workflow with proper commit messages.
*   [x] Create build script for both Chrome and Firefox versions.
*   [ ] Create unit tests for core functionality (especially `filter_logic.js`).

---
*Legacy tasks (from old DOM-based version) have been removed or re-categorized under the new phased approach.* 