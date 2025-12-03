# FilterTube v3.0 Technical Documentation

This document provides a deep technical dive into the implementation of FilterTube's hybrid filtering engine.

## Core Technologies

*   **JavaScript (ES6+)**: Core logic.
*   **Manifest V3**: The extension standard used.
*   **Proxy & Object.defineProperty**: Used for hooking global browser APIs.
*   **MutationObserver**: Used for the DOM fallback layer.
*   **Custom Events / postMessage**: Used for cross-world communication.
*   **StateManager**: Centralized state management for consistent settings across UI and background.

## 1. Data Interception: `ytInitialData` Hook

**Motivation:**
YouTube loads content by injecting JSON data into the page. Traditional filtering waits for the DOM, causing a "flash of content". FilterTube intercepts this data *before* it renders.

**How it works (Simplified):**
YouTube tries to hand a list of videos to the webpage. FilterTube steps in the middle, takes the list, crosses out the videos you don't want, and then hands the cleaned list to the webpage. The webpage never knows those videos existed.

**Technical Flow:**

```mermaid
sequenceDiagram
    participant YT as YouTube Server
    participant Hook as FilterTube Hook
    participant Engine as Filter Engine
    participant Page as Web Page

    YT->>Hook: Sends Video Data (JSON)
    Hook->>Engine: "Check this list!"
    Engine->>Engine: Removes Blocked Videos
    Engine->>Hook: Returns Clean List
    Hook->>Page: Delivers Safe Content
    Page->>Page: Renders (Zero Flash)
```

## 2. Data Interception: Fetch Hook

**Motivation:**
YouTube loads more content as you scroll (infinite scroll) using `fetch` requests. FilterTube must intercept these dynamic requests to ensure new content is also filtered.

**How it works (Simplified):**
When you scroll down, YouTube asks its server for "more videos". FilterTube listens for this request. When the server replies with the new videos, FilterTube quickly checks them, removes the bad ones, and then gives the rest to YouTube to show you.

**Technical Flow:**

```ascii

+-----------+      +-------------+      +-------------+
|  YouTube  | ---> | window.fetch| ---> |  Original   |
|  (Scroll) |      |   (Proxy)   |      |   Fetch     |
+-----------+      +-------------+      +-------------+
                                               |
                                               v
+-----------+      +-------------+      +-------------+
|  Receive  | <--- | New Response| <--- |   Clone &   |
| Filtered  |      | (Filtered)  |      |   Parse     |
+-----------+      +-------------+      +-------------+
                                               |
                                               v
                                        +-------------+
                                        | FilterTube  |
                                        |   Engine    |
                                        +-------------+
```

## 3. Filtering Engine: Recursive Blocking Decision

**Motivation:**
YouTube's data structure is complex and nested. Videos can appear inside "shelves", "grids", or "lists". The engine must find every video, extract its details (title, channel), and check if it matches your filters.

**How it works (Simplified):**
The engine acts like a meticulous inspector. It opens every box (data object) YouTube sends. If it finds a video inside, it reads the label (title/channel). If the label is on your "Block List", it throws the video in the trash. If it's a box of boxes (a playlist or shelf), it opens those too and checks everything inside.

**Technical Flow:**

```ascii

+-------------+
| processData |
+-------------+
       |
       v
+-------------+       +-------------+
|  Traverse   | ----> | Check Type  |
|  JSON Tree  |       | (Renderer?) |
+-------------+       +-------------+
       ^                     | Yes
       |                     v
       |              +-------------+
    (Recurse)         |   Extract   |
       |              |   Metadata  |
       |              +-------------+
       |                     |
       |                     v
+-------------+       +-------------+
| Keep Item   | <---- | Match Rules?|
+-------------+  No   +-------------+
                             | Yes
                             v
                      +-------------+
                      | Block Item  |
                      | (Set Null)  |
                      +-------------+

```

## 9. Collaboration Detection & Cross-World Synchronization

Collaboration filtering relies on coordinated logic across all three execution worlds. The end-to-end detection pipeline is:

```ascii

YouTube DOM (Isolated World)
  └─ content_bridge.js
      • Detect #attributed-channel-name / yt-text-view-model strings
      • Parse links, badges, and inline text to build initial collaborators[]
      • If data missing → post FilterTube_RequestCollaboratorInfo →

Main World
  └─ injector.js / filter_logic.js
      • searchYtInitialDataForVideoChannel(videoId)
      • Extract listItems[].listItemViewModel entries (name, handle, UC ID)
      • Respond with allCollaborators[] payload →

Isolated World (resume)
  • Generate collaborationGroupId (UUID)
  • Send chrome.runtime.sendMessage(handleAddFilteredChannel, {
        input, filterAll, collaborationWith, collaborationGroupId,
        allCollaborators
    }) →

Background Service Worker
  • sanitizeChannelEntry() persists full metadata
  • Broadcasts StateManager events to every UI context

UI Contexts (tab-view.js, popup.js)
  • render_engine.buildCollaborationMeta() groups rows by collaborationGroupId
  • A 🤝 badge + tooltip summarizes present/missing collaborators

```

### Data Structures Propagated
- `collaborationGroupId`: deterministic link between channels blocked in the same action.
- `collaborationWith[]`: per-channel "other members" list used for warnings and tooltips.
- `allCollaborators[]`: canonical roster (name/handle/id) stored on each channel row so the UI can reason about partial groups even after reordering or searching.

## 10. Collaboration UI & Storage Semantics

- **Storage (`background.js` + `settings_shared.js`)**: `sanitizeChannelEntry` preserves `collaborationGroupId`, `collaborationWith`, and `allCollaborators`, meaning compiled settings always contain the metadata necessary for UI rehydration.
- **Render Engine**: `buildCollaborationMeta` compares the stored roster with currently filtered entries, computes `presentCount/totalCount`, and emits:
  - `collaboration-entry` + yellow rail (full groups)
  - `collaboration-partial` + dashed rail (missing members)
  - `title` attribute tooltips with “Originally blocked with / Still blocked / Missing now” copy.
- **Search & Sort Integrity**: Because every collaborator remains an independent row, FCFS ordering, keyword search, and sort toggles behave exactly as non-collab entries, avoiding clipping issues seen with floating group containers.

## 11. Handle Normalization & Regex Improvements

- **Pattern**: `extractHandleFromString` and friends normalize any string with `@([A-Za-z0-9._-]+)` so handles like `@dr.one` or `@Studio_Name` survive DOM scraping, dataset scanning, and URL parsing.
- **Canonicalization**: `normalizeChannelHandle` strips URLs, querystrings, and enforces lowercase so duplicates and mixed input sources converge to the same key.
- **Storage Sync**: `fetchIdForHandle` (Isolated World) resolves the canonical `UC...` ID via `/@handle/about` fetch, caches it, and notifies the background worker via `FilterTube_UpdateChannelMap`, preventing repeated network lookups.
- **Regex Compilation**: `compileKeywords` escapes user input but keeps literal dots/underscores intact, ensuring collaboration-derived keywords like `@foo.bar` remain matchable.

## 12. Shorts Canonical Resolution (Detailed)

Shorts cards rarely embed canonical IDs, so FilterTube performs a two-phase resolution:

```mermaid
sequenceDiagram
    participant DOM as content_bridge.js (Shorts UI)
    participant FETCH as Remote Fetches
    participant BG as background.js

    DOM->>DOM: Detect ytd-reel-item / ytd-shorts-lockup
    DOM->>FETCH: fetch shorts watch URL (resolve uploader handle)
    DOM->>FETCH: fetch https://www.youtube.com/@handle/about (resolve UC ID)
    DOM->>BG: handleAddFilteredChannel({ id, handle, isShorts:true })
    BG->>BG: Persist channel, broadcast state update
    DOM->>DOM: hide container (parent rich-item) immediately → zero blank slots
```

- **Grace Period**: While the canonical lookup runs (~1–2.5s), DOM fallback hides the Short so the user never sees it again.
- **Stats Integrity**: Once the canonical ID is known, subsequent interceptors (data + DOM) recognize the entry on every surface, so Shorts, long-form videos, and recommendations from that channel stay filtered without extra fetches.

## 4. DOM Fallback System

**Motivation:**
Sometimes data interception misses something (e.g., complex updates). The DOM Fallback is a safety net that watches the screen itself and hides anything that slipped through.

**How it works (Simplified):**
This is the backup security guard patrolling the building. If a banned video somehow snuck past the front door check, this guard spots it on the wall (the screen) and immediately throws a "Do Not Display" sheet over it so you can't see it.

**Technical Flow:**

```ascii

+-------------+
|  Mutation   |
|  Observer   |
+-------------+
       |
       v
+-------------+       +-------------+
|  New Node   | ----> | Is Video?   |
|  Detected   |       | (Selector)  |
+-------------+       +-------------+
                             | Yes
                             v
                      +-------------+
                      |   Extract   |
                      |   Data      |
                      +-------------+
                             |
                             v
+-------------+       +-------------+
|  Do Nothing | <---- | Match Rules?|
+-------------+  No   +-------------+
                             | Yes
                             v
                      +-------------+
                      |  Apply CSS  |
                      |  (Hide)     |
                      +-------------+

```


## 5. Stats Calculation (Time Saved)

**Motivation:**
Users want to know how much time they've saved by not watching unwanted content.

**How it works:**
1.  **Detection**: When a video is blocked, FilterTube looks for its duration (e.g., "10:05").
2.  **Calculation**: It parses "10:05" into 605 seconds.
3.  **Accumulation**: It adds this to a running total stored locally.
4.  **Display**: The UI converts the total seconds back into "Minutes/Hours Saved".

**Technical Flow:**

```mermaid
graph TD
    A[Video Blocked] --> B{Has Duration?}
    B -- Yes --> C[Parse Duration]
    B -- No --> D[Use Default: 3m for videos, 30s for shorts]
    C --> E[Add to Total Stats]
    D --> E
    E --> F[Save to Storage]
    F --> G[Update UI Badge]
```

**Note (v3.0.1):** FilterTube now tracks actual video durations extracted from YouTube's metadata whenever available, providing accurate time saved calculations instead of generic estimates.

## 6. Centralized State Management

**Motivation:**
With multiple UIs (Popup, Tab View) and background processes, keeping settings in sync is critical. `StateManager` acts as the single source of truth.

**How it works:**
*   **Single Source**: All components read/write settings via `StateManager`.
*   **Broadcasting**: When settings change in one place, `StateManager` notifies all other parts of the extension.
*   **Consistency**: Ensures that if you add a filter in the Tab View, the Popup updates instantly.

## 7. Channel Matching Algorithm

**Motivation:**
Channels can be identified by Name ("My Channel"), Handle ("@mychannel"), or ID ("UC..."). Users might use any of these. The algorithm must normalize and match correctly.

**How it works (Simplified):**
If you ban "@coolguy", the system needs to know that "Cool Guy Vlogs" is the same person. It looks at the video's "ID card" which lists their Name, Handle, and ID number. It checks if any of those match what you banned.

**Technical Flow:**

```ascii

+-------------+
| Channel In  |
| (Name/ID/@) |
+-------------+
       |
       v
+-------------+       +-------------+
|  Normalize  | ----> |  Compare    |
|  (Lowercase)|       |  (Rules)    |
+-------------+       +-------------+
                             |
                             v
                      +-------------+
                      | Match Type? |
                      +-------------+
                       /     |     \
                  (@Handle) (ID)  (Name)
                     /       |       \
             +-------+   +-------+   +-------+
             | Exact |   | Exact |   |Partial|
             +-------+   +-------+   +-------+


```

## 8. Shorts Blocking Architecture (Hybrid Model)

**Motivation:**
Shorts are unique because they often lack channel information in the initial DOM. To ensure **Zero Content Leakage**, we prioritize robustness over speed. We *always* resolve the canonical channel ID before finalizing a block.

**How it works:**
1.  **User Action**: User clicks "Block Channel" in 3 dots menu.
2.  **Shorts Resolution (Extra Step)**: For Shorts, we first fetch the video's page to extract the initial Channel ID (since it's missing from the card).
3.  **Canonical Resolution (All Videos)**: We *always* fetch the channel's "About" metadata to resolve the canonical "UC..." ID. This ensures that blocking `@user` also blocks `@Handle` and `UCID`.
4.  **Finalize**: Only after this verification (approx. 1s) is the channel added to the block list and the content hidden.

So, for Shorts we have an additioanl overhead(1s - 1.5s) of prefetching the channel ID and then resolving the canonical ID. This is to ensure that blocking a channel also blocks all its content, not just the short. Which makes 3 dot UI Blocking for shorts about 2s to 2.5s and rest assured if you have clicked "Block Channel" it will get blocked you can browse freely.

**Technical Flow:**

```ascii
[User Click "Block"]
       |
       v
+-----------------------+
|  1. Identify Type     |
+-----------------------+
       |
       +--------(If Short)-------+
       |                         |
       v                         v
+--------------------+    +----------------------+
| 2. Fetch Short URL |    | (Standard Video)     |
| -> Get Channel ID  |    | Have Channel ID      |
+--------------------+    +----------------------+
       |                         |
       +-----------+-------------+
                   |
                   v
+-----------------------------------+
| 3. Fetch Canonical ID (Robustness)| <--- "The 1-sec Safety Check"
| -> Resolve to unique UC ID        |      (Ensures Zero Leakage)
+-----------------------------------+
                   |
                   v
+-----------------------------------+
| 4. Update Block List & Hide Card  |
+-----------------------------------+
```
