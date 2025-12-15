# FilterTube v3.0 Architecture Documentation

## Executive Summary

FilterTube v3.0 implements a robust **Hybrid Filtering Architecture** that combines preemptive **Data Interception** with a resilient **DOM Fallback** mechanism. This dual-layer approach ensures comprehensive content filtering across all YouTube surfaces (Home, Search, Watch, Shorts) while maintaining high performance and a "Zero Flash" user experience.

## Architecture Overview

### **Hybrid Filtering Strategy**

FilterTube operates on two synchronized layers:

1.  **Primary Layer: Data Interception ("Zero DOM")**
    *   Intercepts YouTube's raw JSON data (via `ytInitialData`, `ytInitialPlayerResponse`, and `fetch`/`XHR` overrides) before it reaches the rendering engine.
    *   Modifies the data structure to remove blocked content *before* it is ever created in the DOM.
    *   **Benefit:** True zero-flash filtering, high performance, no layout shift.

2.  **Secondary Layer: DOM Fallback (Visual Guard)**
    *   Monitors the DOM using efficient `MutationObserver`s.
    *   Catches any content that might bypass the data layer (e.g., client-side hydration updates, complex dynamic loading).
    *   **Hybrid Blocking:** For Shorts, it combines DOM manipulation (immediate hiding) with background data fetching to ensure robust channel blocking even when metadata is missing.
    *   Applies visual hiding (CSS) to blocked elements.
    *   **Benefit:** Reliability, handles edge cases and dynamic updates.

### **Multi-World Extension Architecture**

FilterTube leverages the modern "Isolated World" vs. "Main World" concept to bridge the gap between extension security and page access.

```mermaid
graph TD
    subgraph "Extension Context (Isolated World)"
        BG[Background Service Worker]
        CB[Content Bridge]
        Storage[(Settings Storage)]
    end

    subgraph "Page Context (Main World)"
        Seed[Seed Script]
        Engine[Filter Logic Engine]
        Injector[Injector Coordinator]
        YT[YouTube App]
    end

    User((User)) -->|Update Settings| Storage
    Storage -->|Changes| BG
    BG -->|Compile RegExp| BG
    BG -->|Serialized Settings| CB
    CB -->|PostMessage| Injector
    Injector -->|Apply| Engine
    
    YT -->|Request Data| Seed
    Seed -->|Intercept| Engine
    Engine -->|Filter| Seed
    Seed -->|Clean Data| YT
    
    CB -.->|DOM Fallback| YT
```

## Unified System Map

The following diagram illustrates the complete interaction between all FilterTube components, matching the logical flow of the system:

```ascii


+-------------------------------------------------------+          +--------------------------------------------------+
|              Settings Management Pipeline             |          |                Extension Bootstrap               |
|                                                       |          |                                                  |
|   +-------------+                                     |          |   +-------------+                                |
|   | 2a: popup.js|                                     |          |   | 1a: Manifest|                                |
|   |  User Input |                                     |          |   |  (Declares) |                                |
|   +------+------+                                     |          |   +------+------+                                |
|          | saves via                                  |          |          |                                       |
|   +------v------+                                     |          |          +--------------------+                  |
|   | StateManager|                                     |          |          | declares           | declares         |
|   +------+------+                                     |          |   +------v------+      +------v------+           |
|          | persists                                   |          |   | 1b: Content |      | 1c: seed.js |           |
|          v                                            |          |   |   Bridge    |      | (Main World)|           |
|   +-------------+      +-------------+                |          |   |  (Isolated) |      |    Hooks    |           |
|   | 2c: Storage |----->| 2d: Bridge  |                |          |   +------+------+      +-------------+           |
|   |  OnChanged  |      | Req Settings|                |          |          |                    |                  |
|   +-------------+      +------+------+                |          |          | injects            |                  |
|                               | sends (postMessage)   |          |   +------v------+             |                  |
|                               v                       |          |   | 1d: Injector|             |                  |
|                        +-------------+                |          |   | Coordinator |             |                  |
|                        | 2e: Injector|                |          |   +------+------+             |                  |
|                        | Recv Setting|                |          |          |                    |                  |
|                        +------+------+                |          +----------+--------------------+                  |
|                               | calls                 |                     |                                       |
|                               v                       |                     v                                       |
|                        +-------------+                |          +----------+---------------------------------------+
|                        | 2f: seed.js |                |          |                                                  |
|                        |Cache Setting|                |          |                                                  |
|                        +------+------+                |          |                                                  |
|                               | updates               |          |                                                  |
|                               v                       |          |                                                  |
+-------------------------------+-----------------------+          |                                                  |
                                |                                  |                                                  |
+-------------------------------+-----------------------+          |                                                  |
|                Data Interception Layer                |<---------+                                                  |
|                                                       |                                                             |
|   +-------------+            +-------------+          |                                                             |
|   | 4a: seed.js |            | 3a: seed.js |          |                                                             |
|   | Fetch Proxy |            |ytInitialData|          |                                                             |
|   +------+------+            +------+------+          |                                                             |
|          | intercepts               | intercepts      |                                                             |
|          v                          v                 |                                                             |
|   +----------------------------------------+          |                                                             |
|   |        3b: processWithEngine           |          |                                                             |
|   |             (Call Filter)              |          |                                                             |
|   +------------------+---------------------+          |                                                             |
|                      | calls                          |                                                             |
+----------------------+--------------------------------+                                                             |
                       |                                                                                              |
                       v                                                                                              |
+-------------------------------------------------------+          +--------------------------------------------------+
|                 Filtering Engine Core                 |<---------+               DOM Fallback Layer                 |
|                                                       |          |                                                  |
|   +-------------+                                     |          |   +-------------+                                |
|   | 5a: Entry   |                                     |          |   | 6a: Observer|                                |
|   | processData |                                     |          |   |  Watch DOM  |                                |
|   +------+------+                                     |          |   +------+------+                                |
|          | instantiates                               |          |          | detects nodes                         |
|   +------v------+                                     |          |   +------v------+                                |
|   | 5b: Filter  |                                     |          |   | 6b: Apply   |                                |
|   |  Instance   |                                     |          |   |  Fallback   |                                |
|   +------+------+                                     |          |   +------+------+                                |
|          | processes                                  |          |          | scans                                 |
|   +------v------+                                     |          |   +------v------+                                |
|   | 5c: Traverse|                                     |          |   | 6c: Match   |                                |
|   |  Recursive  |                                     |          |   |   Content   |                                |
|   +------+------+                                     |          |   +------+------+                                |
|          | evaluates                                  |          |          | hides                                 |
|   +------v------+                                     |          |   +------v------+                                |
|   | 5d: Decision|<------------------------------------|----------|---| 6d: Toggle  |                                |
|   | _shouldBlock|          uses engine logic          |          |   | Visibility  |                                |
|   +------+------+                                     |          |   +-------------+                                |
|          | extracts                                   |          |                                                  |
|   +------v------+                                     |          |                                                  |
|   | 7a: Metadata|                                     |          |                                                  |
|   | _extractInfo|                                     |          |                                                  |
|   +-------------+                                     |          |                                                  |
+-------------------------------------------------------+          +--------------------------------------------------+


```

## Collaboration Filtering Lifecycle (2025 Refactor)

The collaboration pipeline spans **all three execution worlds** so that multi-channel uploads can be detected, stored, and rendered consistently. The flow below tracks a user invoking "Block All Collaborators" from the YouTube 3-dot menu:

```mermaid
sequenceDiagram
    participant DOM as block_channel.js + content_bridge.js<br/>(Isolated World)
    participant MW as injector.js + filter_logic.js<br/>(Main World)
    participant BG as background.js (SW)
    participant UI as tab-view.js + render_engine.js

    DOM->>DOM: Detect #attributed-channel-name<br/>parse collaborators
    DOM->>MW: postMessage FilterTube_RequestCollaboratorInfo
    MW->>MW: searchYtInitialDataForVideoChannel<br/>enrich handles + UC IDs
    MW-->>DOM: FilterTube_CollaboratorInfoResponse<br/>allCollaborators[] payload
    DOM->>BG: chrome.runtime.sendMessage handleAddFilteredChannel<br/>collaborationGroupId + collaborationWith
    BG->>BG: sanitizeChannelEntry → persist allCollaborators
    BG-->>UI: StateManager.broadcast('channelAdded')
    UI->>UI: render_engine.buildCollaborationMeta<br/>badge + tooltip + dashed rail
```

### Architectural Guarantees
1. **Deterministic grouping** – `content_bridge.js` creates a `collaborationGroupId` before storage, so every UI can reassemble the exact roster after reloads and across browsers.
2. **Lossless collaborator roster** – `allCollaborators` travels with each saved channel entry, allowing tooltips to show present vs. missing members without re-querying YouTube.
3. **Cross-world enrichment** – When the DOM only exposes the first collaborator link, the Request/Response hop to the Main World fills remaining handles/IDs directly from `ytInitialData`.
4. **FCFS rendering with inline metadata** – `render_engine.js` drops floating group containers and instead decorates each row in-place (badge, yellow rail, tooltip), preserving the filtered/sorted order defined by the user.

The collaboration lifecycle reuses the existing Hybrid Filtering channels (`window.postMessage`, `chrome.runtime` messaging, StateManager broadcasts), ensuring the new metadata behaves like any other persisted filter entry.

### Message Bus & Storage Hand-off

```ascii

  (Isolated World)                 (Main World)                    (Service Worker)              (UI Contexts)

  block_channel.js + content_bridge.js        injector.js / filter_logic.js          background.js            tab-view.js / popup.js
         |                               |                              |                             |
         | 1. DOM parse                  |                              |                             |
         |------------------------------>|                              |                             |
         | FilterTube_RequestCollabInfo  |                              |                             |
         |                               | 2. searchYtInitialData()     |                             |
         |                               |----------------------------->|                             |
         |                               | 3. Response w/ allCollaborators                            |
         |<------------------------------|                              |                             |
         | 4. chrome.runtime.sendMessage (handleAddFilteredChannel)     |                             |
         |------------------------------------------------------------->|                             |
         |                               |                              | 5. sanitizeChannelEntry()   |
         |                               |                              |    persist + broadcast      |
         |                               |                              |---------------------------->|
         |                               |                              |             channelAdded    |
         |                               |                              |                             | 6. render_engine.buildCollaborationMeta()
         |                               |                              |                             v

```

*Every hop carries the `collaborationGroupId`, `collaborationWith[]`, and `allCollaborators[]`, so downstream consumers never have to re-parse the DOM or `ytInitialData` for that upload.*

## Channel Identity Resolution & 404 Recovery (2025 Hardening)

YouTube now rate-limits `/@handle/about` and intermittently returns `404` on the first block attempt. To guarantee that every block resolves to a canonical UC ID, the architecture adds a four-layer safety net:

```ascii
        +-------------------+
        | 1. Cache-first    |
        | channelMap lookup |
        +---------+---------+
                  |
   miss           | hit
     |            v
     v     (pre-seeded UC id)
+----+------------------------------+
| 2. Main-world replay via ytInitial|
|    data (searchYtInitialData...)  |
+----+------------------------------+
     | success
     |                      failure
     v                          |
+----+---------------------------+--------+
| 3. Shorts/handle helpers + bidirectional|
|    FilterTube_UpdateChannelMap broadcast|
+----+---------------------------+--------+
     | success
     v
+----+-------------------------------+
| 4. DOM cache invalidation & forced |
|    reprocessing (applyDOMFallback) |
+------------------------------------+
```

1. **Cache-first lookups (`background.js`)** – `handleAddFilteredChannel` checks `channelMap` (fed by `filter_logic.js` + main-world injectors) before issuing any network fetch, so previously learned handles map instantly to UC IDs.
2. **Main-world replay (`injector.js` + `seed.js`)** – When `/@handle/about` fails, `content_bridge.js` replays the block request with `searchYtInitialDataForVideoChannel(videoId)` and Shorts helpers, reusing the data that already rendered the card.
3. **Bidirectional broadcast** – Any newly learned `(handle ↔ UC ID)` pair is posted via `FilterTube_UpdateChannelMap`, persisted by the background worker, and replayed into future tabs so both interception and DOM layers stay in sync.
4. **DOM cache invalidation** – `applyDOMFallback` now tracks `data-filtertube-last-processed-id`. When a reused card swaps to a different video, cached `data-filtertube-channel-*` attributes are purged, forcing a fresh extraction with the latest mapping.

These steps keep channel identity deterministic even for collaboration uploads, Shorts feeds, and navigation refreshes that previously produced 404 loops.

### Shorts Flow overlay

```ascii

User "Block channel" (Short) → content_bridge detects ytd-shorts-lockup →
  1. Fetch shorts watch URL (to resolve initial handle/id)
  2. Post FilterTube_RequestCollaboratorInfo if collab markers exist
  3. Await canonical UC ID via fetchIdForHandle() / /about scrape
  4. Send handleAddFilteredChannel to background with `isShorts: true`
  5. Background persists, broadcasts -> DOM fallback removes parent container (rich-item renderer) to avoid blank slots

```

This hybrid path keeps **Zero-Flash** guarantees for Shorts even though their cards lack canonical IDs up front: the DOM fallback hides immediately while the async canonical resolution finishes (<2.5s worst case).


## 1. Extension Initialization & Script Injection Flow

**Motivation:**
FilterTube needs to filter YouTube content *before* it appears on screen to prevent unwanted videos from flashing briefly. The traditional approach of scanning the DOM is too slow. The solution is **data interception**: hooking into YouTube's JSON data structures before they're rendered. This requires injecting JavaScript into YouTube's page context (the "MAIN world") at the earliest possible moment.

**How it works (Simplified):**
Imagine FilterTube as a security guard. Instead of waiting for people (videos) to enter the building (the screen) and then kicking them out, FilterTube stands at the front door (the data connection) and checks everyone's ID before they even get inside. To do this, FilterTube has to arrive at the door *before* YouTube opens for business.

**Technical Flow:**

```text


+----------------------------+
|  Browser Loads Extension   |
+----------------------------+
             |
             v
+----------------------------+
|      manifest.json         |
+----------------------------+
      |              |
      | (Main)       | (Isolated)
      v              v
+-----------+  +----------------------------------------------+
|  seed.js  |  | Isolated World content scripts (ordered load) |
+-----------+  | identity.js → menu.js → dom_*.js →            |
               | block_channel.js → content_bridge.js          |
               +----------------------------------------------+
      |                  |
      |                  v
      |        +------------------+
      |        |  Request Settings|
      |        +------------------+
      |                  |
      v                  v
+----------------+ +------------------+
| Establish Hooks| |Init DOM Fallback |
| (ytInitialData)| |(MutationObserver)|
+----------------+ +------------------+
      |
      v
+----------------+
|  Wait for      |
|  Filter Engine |
+----------------+


```

## 2. Settings Compilation & Distribution Pipeline

**Motivation:**
FilterTube needs to distribute user filter settings across multiple isolated execution contexts. When a user adds a keyword like "spoilers", that setting must reach the background (for storage), the content bridge (for DOM fallback), and the main world scripts (for data interception). Chrome's security model prevents direct access, so a pipeline is needed.

**How it works (Simplified):**
When you change a setting, it's like sending a letter. You drop it in the mailbox (Popup). The post office (Background) stamps it and checks the address. Then a mail carrier (Content Bridge) takes it to the house (Page). Finally, the person inside (Filter Engine) reads it and updates their "Do Not Admit" list.

**Technical Flow:**

```text


+---------+       +------------+
| User UI | ----> | Background |
| (Popup) |       | (Storage)  |
+---------+       +------------+
                        |
                   (OnChanged)
                        |
                        v
                  +------------+
                  |  Compile   |
                  |  Settings  |
                  +------------+
                        |
                        v
                  +------------+       +------------+
                  |  Content   | ----> |  Injector  |
                  |  Bridge    |       | (Main World)|
                  +------------+       +------------+
                                             |
                                       (postMessage)
                                             |
                                             v
                                       +------------+
                                       |  seed.js   |
                                       | (Reprocess)|
                                       +------------+


```


## Component Breakdown

### **1. Background Service (`background.js`)**
*   **Context:** Background Service Worker.
*   **Role:** Central State Manager & Validator.
*   **Key Responsibilities:** Manages storage, compiles regex patterns to prevent crashes, and handles cross-browser compatibility.

### **2. Content Bridge (`content_bridge.js`)**
*   **Context:** Isolated World.
*   **Role:** The Bridge & The Enforcer.
*   **Key Responsibilities:** Injects Main World scripts, relays settings, and wires the Isolated World helper modules (`js/content/*`) that implement DOM fallback and 3-dot menu blocking.

### **3. Seed Script (`seed.js`)**
*   **Context:** Main World.
*   **Role:** The Interceptor.
*   **Key Responsibilities:** Hooks global objects (`ytInitialData`, `fetch`) immediately at startup to intercept data before YouTube sees it.

### **4. Filter Logic Engine (`filter_logic.js`)**
*   **Context:** Main World.
*   **Role:** The Brain.
*   **Key Responsibilities:** Recursively processes JSON, identifies video renderers, and applies filtering rules.

### **5. Injector (`injector.js`)**
*   **Context:** Main World.
*   **Role:** The Coordinator.
*   **Key Responsibilities:** Initializes the engine and coordinates settings updates.

### **6. State Manager (`state_manager.js`)**
*   **Context:** UI Contexts.
*   **Role:** The Truth.
*   **Key Responsibilities:** Centralizes all state operations (load, save, update) to ensure consistency across the UI.
