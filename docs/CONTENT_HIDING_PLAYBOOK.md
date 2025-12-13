# Content Hiding + Channel Identity Playbook

This document is an *operator playbook* for answering:

- Which layer is responsible for hiding content in each YouTube surface?
- Which data source(s) are used to resolve a channel’s identity (UC ID + @handle)?
- What to check when blocking fails (especially `/@handle/about` returning 404).


## 1) The Three Layers (Who Does What)

### 1.1 Engine (Main World): `seed.js` + `filter_logic.js`
- **Purpose**
  - Remove blocked/matching items from YouTube JSON responses **before** YouTube renders.
  - Prevent “flash of blocked content” when possible.
- **Strengths**
  - Earliest filtering.
  - Best for feed/search/watch data responses.
- **Limits**
  - Not every surface routes through a convenient JSON response.
  - DOM recycling and client-side hydration can still surface items that need DOM fallback.

### 1.2 DOM Fallback (Isolated World): `content_bridge.js`
- **Purpose**
  - Hide/restore already-rendered elements.
  - Handle SPA navigation, late hydration, and recycled DOM nodes.
- **Strengths**
  - Works even when engine misses something.
  - Can hide immediately after a manual block action.
- **Limits**
  - Can only hide *after* elements exist.
  - Channel identity may be incomplete in the DOM (common on Shorts).

### 1.3 Menu-click Blocking (User Action): 3-dot menu injection in `content_bridge.js`
- **Purpose**
  - Persist a new blocked channel entry (via background)
  - Hide the clicked card instantly for UX feedback
- **Strengths**
  - Direct, explicit user action.
  - Can use extra context (videoId, expected byline) to recover identity.
- **Limits**
  - If we don’t have `videoId`, we lose the strongest fallbacks (ytInitialData lookup / shorts fetch).


## 2) Canonical Channel Identity Rules

### 2.1 Canonical key
- **Canonical identity is UC ID** (`UCxxxxxxxxxxxxxxxxxxxxxx`).
- `@handle` is an alias, useful for display and as a lookup hint.

### 2.2 `channelMap` (alias cache)
Stored in local extension storage as a bidirectional map:
- `channelMap[lowercaseHandle] -> UCID`
- `channelMap[lowercaseUCID] -> handleDisplay`

Use cases:
- Converting handle-only contexts into UC IDs.
- Recovering from YouTube handle URL breakage.


## 3) Channel Identity Sources (Priority Order)

When trying to resolve `{ id, handle, name }` for a channel:

1. **Direct UC ID**
   - From DOM links (`/channel/UC...`) or already-known metadata.
2. **Main-world ytInitialData lookup by `videoId`** (best “no network” recovery)
   - `content_bridge.js` → `requestChannelInfoFromMainWorld(videoId)`
   - `injector.js` searches `window.ytInitialData` and returns `{ id, handle, name }`.
3. **`channelMap` handle→UC mapping**
   - Fast, no network.
4. **Shorts page fetch (`/shorts/<videoId>`)**
   - Parses embedded `ytInitialData` / header renderers / canonical links.
5. **Handle page fetch**
   - `https://www.youtube.com/@<handle>/about`, then fallback to `https://www.youtube.com/@<handle>`
   - This is the most fragile due to YouTube’s 404 bug for some handles.


## 4) Surface-by-Surface: “What hides content” + “Where identity comes from”

### 4.1 Home feed / Browse
- **Hide path**
  - Engine removes from JSON when possible.
  - DOM fallback hides recycled/hydrated leftovers.
- **Identity sources**
  - DOM byline link (often `/@handle`)
  - Sometimes `/channel/UC...` in href
  - Engine-stamped `data-filtertube-channel-*` attributes
- **404 Recovery Tip**
  - If `/@handle/about` breaks, rely on `requestChannelInfoFromMainWorld(videoId)` first; that path uses the same four-layer safety net (cache → ytInitialData → Shorts helper → DOM cache invalidation) described in `docs/handle-404-remediation.md`.

### 4.2 Search results
- **Hide path**
  - Engine (best-effort) + DOM fallback (very important due to rapid mutations).
- **Identity sources**
  - `#channel-info ytd-channel-name a` for channel name + href (avoid thumbnail overlay text).
  - `ytInitialData` via main-world lookup if DOM is incomplete.

### 4.3 Watch page
- **Hide path**
  - Engine for recommended/related responses.
  - DOM fallback for sidebar and mixed renderers.
- **Identity sources**
  - `ytInitialData` is usually strong.
  - DOM byline sometimes lacks UC ID.

### 4.4 Shorts shelf / Shorts cards
- **Hide path**
  - Mostly DOM fallback (many Shorts cards are DOM-heavy and inconsistent).
- **Identity sources**
  - Often *only* `videoId` is reliably extractable.
  - Then:
    - Main-world ytInitialData lookup (if the page has the data)
    - Shorts page fetch `/shorts/<videoId>`
    - Then map handle→UC via `channelMap`
- **Collaboration handling**
  - Avatar stacks now trigger the same collaborator enrichment used on search/watch. The immediate hide still occurs, but `handleBlockChannelClick` waits for collaborator data before persisting so that “Block All” is available even on Shorts shelves.

### 4.5 Collaboration videos
- **Hide path**
  - Same as surface (Home/Search/Watch) + special 3-dot “multi-step” selection.
- **Identity sources**
  - `injector.js` collaborator extraction from ytInitialData.
  - Expected handle/name hints are used to avoid picking the wrong collaborator.


## 5) Why 3-dot Blocking Could Still Fail to Recover UC ID

Even if `/@handle/about` 404s, the 3-dot path *should* recover via main-world ytInitialData or shorts fetch.
When it doesn’t, it typically falls into one of these buckets:

- **Missing `videoId`**
  - The strongest fallbacks (`searchYtInitialDataForVideoChannel(videoId)` and `/shorts/<videoId>`) require it.
  - Fix applied: `extractVideoIdFromCard()` now parses `/shorts/<id>`, `/live/<id>`, `/embed/<id>` in addition to `watch?v=`.

- **Main-world message timing**
  - If `injector.js` is still initializing, the first request may time out.
  - Fix applied: `requestChannelInfoFromMainWorld()` and `requestCollaboratorInfoFromMainWorld()` now resend the postMessage while the request is pending.

- **Expected handle mismatch**
  - The main-world lookup can reject a result when `expectedHandle` and found handle differ.
  - This is a safeguard against wrong-collab selection, but can be overly strict if the DOM hint is stale.


## 6) Manual Add / Channel Management UI (Popup + Tab)

### 6.1 What the UI does today
- Popup/tab UI uses `StateManager.addChannel()`.
- That delegates to background via `chrome.runtime.sendMessage({ action: 'addChannelPersistent', input })`.
- UI list rendering uses stored `filterChannels` data for `name`/`logo`.
- There is **no proactive enrichment loop** that refreshes `name/logo` by calling `fetchChannelDetails`.

### 6.2 Important guardrail
- **Manual add must never persist an unresolved handle as the `id`.**
- Fix applied: `addChannelPersistent` now refuses to persist unless a UC ID was resolved (directly or via `channelMap`).


## 7) Recommended Simplification Strategy (Proposal)

This is the direction that makes `/@handle/about` failures mostly irrelevant:

- **Make UC ID mandatory for persistence**
  - Treat handle-only blocks as a temporary *pending* state (or reject) rather than writing corrupt entries.

- **Treat `/@handle/about` as enrichment-only**
  - Do not let it be the canonical identity resolver.
  - Use it only when you already have UC ID and want display name/logo/handle confirmation.

- **Centralize identity resolution**
  - One “resolveChannelIdentity” pipeline shared conceptually by:
    - engine harvest,
    - DOM fallback extraction,
    - 3-dot blocking,
    - manual add.
  - Inputs: `{ videoId, handle, ucId, channelNameHint }`
  - Outputs: `{ ucId, handle, handleDisplay, name, confidence }`

- **Unify handle parsing/normalization semantics**
  - Ensure identical unicode + percent-decoding behavior across `filter_logic.js`, `content_bridge.js`, and `injector.js`.

