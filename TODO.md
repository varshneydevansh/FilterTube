# FilterTube – Working Plan (Refactor + Watch Page)

This is a **living TODO** to keep refactor + watch-page work organized.

## Status Snapshot

- **Release**
  - [x] v3.0.9 version bump + changelog entry
- **Docs**
  - [x] 404 remediation playbook + updates across docs
- **Next major milestone**
  - [x] Centralize channel identity + matching into a shared module
  - [ ] Split `content_bridge.js` into a few isolated-world modules (no bundler; ordered load)

---

## Decision (Locked)

- **Code organization:** module-wise (not chronological)
- **Build strategy:** **no bundler**
  - Use ordered script loading (MV3-safe)

---

## File/Folder Ownership Map (Where things should live)

### Worlds

- **Isolated World (content script)**
  - Current: `js/content_bridge.js`
  - Target: thin bootstrap + small modules for DOM extraction, menus, fallback, watch playlist.

- **Main World (page context)**
  - `js/seed.js` (document_start interception)
  - Injected via `content_bridge.js`: `js/filter_logic.js`, `js/injector.js`

- **Background (service worker)**
  - `js/background.js`

- **Extension UI (popup + tab-view)**
  - `js/popup.js` (popup bootstrap)
  - `js/tab-view.js` (full tab UI)
  - `js/state_manager.js` (state + persistence delegation)
  - `js/render_engine.js` (list rendering + collaboration grouping)
  - `js/ui_components.js` (reusable UI primitives; tooltips are currently `title` attributes)
  - `js/settings_shared.js` (normalize settings + channels + keywords)

- **Layout patching (YouTube DOM)**
  - `js/layout.js` (layout fixes after hide/unhide; candidate to move under `js/content/` during Phase 2)

### New shared module (first)

- `js/shared/identity.js`
  - Purpose: **single source of truth** for:
    - handle parsing + percent decode + unicode-safe normalization
    - UC ID checks (`UC...`)
    - canonicalization of channel inputs
    - **is channel blocked?** checks
    - (optional) channelMap merge helpers

### Current `js/` responsibilities (Quick Map)

- **Isolated World (YouTube DOM + menus)**
  - `js/content_bridge.js`
    - Settings sync + message bridge to Background
    - Main-world injection ordering (inject `shared/identity.js` before `filter_logic.js` + `injector.js`)
    - DOM observers + extraction from cards/shelves
    - 3-dot menu injection + collaboration menus
    - Block-channel click orchestration (404 recovery, Shorts fallback, collaboration groups)
    - DOM fallback hide/unhide + recycle detection + cache invalidation
    - Watch/playlist refilter + skip pipeline (to be isolated into its own module)
  - `js/layout.js`
    - Layout repair after hide/unhide (search layouts, channel grids, watch cards)

- **Main World (YouTube data interception + engine)**
  - `js/seed.js`
    - `document_start` interception / zero-flash filtering entrypoint
    - Queues data until settings arrive; calls `FilterTubeEngine.processData()` or `harvestOnly()`
  - `js/filter_logic.js`
    - Defines `window.FilterTubeEngine`
    - Implements filtering + harvesting UCID/handle mappings into `channelMap`
    - Reads some YouTube badge tooltip fields (e.g. `metadataBadgeRenderer.tooltip`) as metadata
  - `js/injector.js`
    - Main-world request handler (via `postMessage`) for the isolated world
    - Helps resolve channel/collaboration identities from `ytInitialData` / `ytInitialPlayerResponse`

- **Background (persistence + compiled settings)**
  - `js/background.js`
    - Stores settings + compiles keyword regexes + broadcasts to tabs
    - Channel persistence (must resolve to UC ID; never persist unresolved handle/name)
    - Stores `channelMap` updates (bidirectional: UCID ↔ @handle)

- **Extension UI (Popup + Tab View)**
  - `js/popup.js` / `js/tab-view.js`
    - UI bootstraps only (wire DOM → StateManager/RenderEngine)
  - `js/state_manager.js`
    - UI-side state + business logic; delegates persistence-heavy ops to Background
  - `js/render_engine.js`
    - List rendering; collaboration grouping metadata (tooltip strings)
  - `js/ui_components.js`
    - Reusable UI primitives (buttons, tabs, badges)
  - `js/settings_shared.js`
    - Settings + keyword/channel normalization utilities shared by UI and other contexts

### Tooltip behavior (Today)

- **Extension UI tooltips**
  - Implemented as native `title` attributes.
  - Primary call sites:
    - `js/ui_components.js` (`createIconButton`, `createBadge`)
    - `js/render_engine.js` (collaboration tooltip strings; attached via `title`)
- **YouTube metadata tooltips**
  - `js/filter_logic.js` reads some tooltip text from YouTube JSON (not our UI tooltip system).

---

## Phase 0 – Reference Docs (Read before coding)

- [ ] `docs/WATCH_PAGE_CHANNEL_ID_PLAN.md` (wrong-block + identity corruption on watch/playlist)
- [ ] `docs/WATCH_PLAYLIST_BREAKDOWN.md` (playlist leak-through + refilter crash)
- [ ] `docs/handle-404-remediation.md` (404 recovery pipeline)

---

## Phase 1 – Shared Identity + Matching (Highest ROI)

**Goal:** stop identity drift across `content_bridge.js` / `injector.js` / `filter_logic.js` / `background.js`.

- [x] Create `js/shared/identity.js`
  - [x] `extractRawHandle(value)`
  - [x] `normalizeHandleValue(handle)`
  - [x] `isUcId(value)`
  - [x] `canonicalizeChannelInput(input)` → `{ type: 'ucid'|'handle'|'unknown', value }`
  - [x] `isChannelBlocked(filterChannels, channelInfo)`

- [x] Load `js/shared/identity.js` in all three worlds
  - [x] **Isolated:** add to `manifest*.json` `content_scripts[].js` **before** `js/content_bridge.js`
  - [x] **Main:** inject `identity.js` **before** `filter_logic.js` + `injector.js` (extend `scriptsToInject` order)
  - [x] **Background:** load via `importScripts(...)` in `background.js` (service worker) / manifest ordering in Firefox

- [x] Replace duplicated logic (delegate to shared helpers first; keep safe fallbacks temporarily)
  - [x] `js/content_bridge.js`: swap local handle parsing + blocked checks → shared calls
  - [x] `js/injector.js`: delegate `extractRawHandle` → shared calls
  - [x] `js/filter_logic.js`: align `normalizeChannelHandle` + matching → shared calls
  - [x] `js/background.js`: align handle normalization + UC checks → shared calls

**Definition of Done:**
- All call sites delegate to `FilterTubeIdentity` first (fallback code may exist temporarily).
- A single normalized handle format is used for comparisons everywhere.

---

## Phase 2 – Split `content_bridge.js` (No bundler, few files)

**Goal:** make watch-page + playlist work implementable without touching a 7k-line file.

Create directory:
- [ ] `js/content/`

Move code in **large logical chunks** (5–8 files max):
- [ ] `js/content/bootstrap.js` (wires observers + init, owns main-world injection)
- [ ] `js/content/dom_fallback.js` (`applyDOMFallback`, recycle detection, cache invalidation)
- [ ] `js/content/dom_extractors.js` (channel/video/collab extraction from DOM)
- [ ] `js/content/menu.js` (3-dot injection + menu lifecycle)
- [ ] `js/content/block_channel.js` (`handleBlockChannelClick` + retries + collaboration orchestration)
- [ ] `js/content/watch_playlist.js` (playlist refilter/skip pipeline)

Manifest strategy (ordered loading):
- [ ] Update `manifest*.json` so isolated world loads:
  - `js/shared/identity.js`
  - `js/content/*.js` modules (in order)
  - (eventually) remove or shrink `js/content_bridge.js`

**Definition of Done:**
- `content_bridge.js` is either gone or just delegates.
- No functionality regression on Home/Search/Shorts.

---

## Phase 3 – Watch Page Implementation (Built on shared identity)

**Goal:** stable channel blocking + playlist behavior on `/watch`.

Playlist correctness (from docs):
- [ ] Fix refilter crash (`channelNames[filterId]?.toLowerCase is not a function`)
- [ ] For playlist panel items: ignore cached `data-filtertube-channel-*` unless identity is confirmed
- [ ] Use byline + safe reverse-lookup for name→id when needed
- [ ] Ensure `skipInProgress` always resets even if errors occur

Wrong-block prevention:
- [ ] Add `expectedName` plumbing end-to-end:
  - `content` → main world request payload
  - `injector.js` response selection chooses collaborator that matches byline
- [ ] Cache channel metadata only after identity is trustworthy

Validation matrix:
- [ ] Block from watch byline
- [ ] Block from playlist panel
- [ ] Collab videos (choose correct collaborator)
- [ ] Handles that 404 on `/@handle/about`

---

## Phase 4 – Optional “Unhook” Toggles (After watch is stable)

- [ ] New folder: `js/features/unhook/`
- [ ] Keep unhook toggles isolated from blocking/identity logic.

---

## Notes / Guardrails

- Refactor scope: **only `js/` code is in scope**; root-level JSON/HTML/log dumps are reference material.
- Refactor safety rules (avoid regressions):
  - Keep behavior identical while moving code (no rewrites during relocation).
  - Move code in **large, coherent chunks** (one module at a time).
  - Keep `js/content_bridge.js` as the stable entrypoint until Phase 2 is complete; it should delegate into modules.
  - Preserve script order (manifest order + main-world injection order).
  - Each module should be idempotent or guarded (no double-init).
  - Always keep a fallback path if a shared helper is unavailable.
- Preserve existing comments. Add file headers + small section headers when introducing new modules.
- Use section dividers for big logical blocks:
  - `// ============================================================================`
- Keep brace style consistent: `) {` on the same line.
- Prefer **UC ID** as canonical storage key; `@handle` is an alias.
- Never persist unresolved/ambiguous identities.
- Any new channel extraction path must update `channelMap` (bidirectional).
