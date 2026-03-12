LATEST

3 dot UI specially for Collaborations analysis by GPT 5.1 High Reasoning in Windsurf on 09/12/2025

You’re right that we should not touch logic until we clearly understand how “Filter All / Block Both / multi‑select collab” are currently wired and where the duplication lives. I’ll first map the existing flows in the JS files, then propose a concrete design (likely one generic “collab entry insertion” path) and only then touch code, keeping existing working behavior intact.

Next I’ll:
- Build a short TODO/plan for this work.
- Search the codebase for the current “Filter All / Block Both / collab / multi-select” logic.
- Read the JS files you listed as the source of truth and identify exactly:
  - How Filter All is stored/passed to Channel Management.
  - Where 2‑collab vs N‑collab diverge.
  - How the yellow / dashed yellow collab UI is currently powered.

Once I’ve got that, I’ll come back with:
- A proposed behavior decision (e.g., unify Block Both + Block All, or keep both).
- A minimal, safe change set to fix Filter All for 2‑collab “Block Both” and multi‑select, ideally centralizing collab insertions.
- Then we can optionally discuss refactoring collab logic out of `content_bridge.js`.

I’ll set up the TODO list and start by searching/reading the JS files now.
I’ll first locate where “Filter All”, “Block Both/All”, and collab/multi-select logic live in your JS, then read those areas in detail so I can propose a unified insertion path and a safe plan to fix the Filter All behavior without breaking existing hiding logic. I’ll use the code_search and file readers now, then summarize what I find and suggest a concrete design (including how to mark full vs partial collab and how to treat Block Both vs Block All).

I’ll now inspect the collab/menu/multi-select and Filter All wiring across the core JS files, then I’ll summarize: (1) how 2‑collab vs N‑collab flows differ, (2) where Filter All is captured/persisted, and (3) precisely why 2‑collab “Block Both” and multi-select Filter All aren’t reaching Channel Management. After that I’ll propose a concrete, minimal design for a single collab insertion path and how to treat full vs partial collab entries, before touching any code or refactoring content_bridge.js.
I need to zoom into the relevant regions of `content_bridge.js` using line ranges (because the full file is over the size limit) and inspect how Filter All state is captured for collab Block Both/All and multi-select. I’ll also open the rest of `background.js` to see how `addFilteredChannel` and [toggleChannelFilterAll](cci:1://file:///Users/devanshvarshney/FilterTube/js/state_manager.js:287:4-306:5) are wired. Then I’ll summarize the current flows and propose a design decision for Block Both vs Block All before suggesting any refactor.





I’ve now inspected the key collaboration and Filter All handling paths in [content_bridge.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:0:0-0:0) and [background.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/background.js:0:0-0:0), plus the shared settings/state modules. The next step is to (1) trace where `collaborationGroupId`, `collaborationWith`, and `allCollaborators` are used in the Channel Management UI, and (2) confirm how full vs partial collab entries and yellow/dashed styles are decided. That will clarify why Filter All flags from 2‑collab Block Both and multi‑select aren’t reflected there, and whether we can centralize to a single “collab insertion” function without breaking behavior. I’ll search for the collab fields and the yellow/dashed UI logic next.





Here’s what I see from the code and what I’d recommend doing before we touch anything.

---

## 1. What the current code is doing (relevant pieces)

### 1.1 Storage & “Filter All Content”

- **Background:**  
  - `background.js → handleAddFilteredChannel(input, filterAll, collaborationWith, collaborationGroupId)`
    - Fetches channel info from YouTube.
    - Creates `newChannel` with:
      - `filterAll` (from the passed boolean).
      - `collaborationWith` (handles of “other” collaborators).
      - `collaborationGroupId` (UUID if provided).
      - `allCollaborators` (current channel + all `collaborationWith` handles).
    - Prepends to `filterChannels` in storage.
  - [handleToggleChannelFilterAll(channelId, value)](cci:1://file:///Users/devanshvarshney/FilterTube/js/background.js:920:0-960:1) updates `channel.filterAll` when user clicks “Filter All Content” in popup/tab.

- **Settings + UI:**
  - [settings_shared.syncFilterAllKeywords(channels)](cci:1://file:///Users/devanshvarshney/FilterTube/js/settings_shared.js:198:4-257:5)
    - For every channel where `filterAll === true`, auto-derives a keyword and keeps it in sync.
  - [StateManager.loadSettings()](cci:1://file:///Users/devanshvarshney/FilterTube/js/state_manager.js:38:4-63:5) / [saveSettings()](cci:1://file:///Users/devanshvarshney/FilterTube/js/settings_shared.js:303:4-329:5) uses [FilterTubeSettings.buildCompiledSettings](cci:1://file:///Users/devanshvarshney/FilterTube/js/settings_shared.js:259:4-269:5) and always re-syncs `filterAll` → keywords.
  - Channel Management UI ([js/render_engine.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/render_engine.js:0:0-0:0)) uses `channel.filterAll` to draw the Filter All toggle and uses `allCollaborators + collaborationGroupId` for the yellow/dashed collab rails + tooltips.

So: *if* we get `filterAll: true` into `filterChannels` for a channel, both:
- Filter All Content behavior
- and the Filter All toggle in Channel Management

work automatically, regardless of how the channel was added.

---

### 1.2 Where collab 3‑dot menu logic lives

In [js/content_bridge.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:0:0-0:0):

- **Menu building (single & collab)**  
  [renderFilterTubeMenuEntries(...)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:191:0-267:1):

  - When `channelInfo.isCollaboration && allCollaborators.length >= 2`:
    - Builds **one menu entry per collaborator** via [injectIntoNewMenu](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:4873:0-4976:1) / [injectIntoOldMenu](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:4978:0-5077:1).
    - Builds a **Block All entry**:
      - For 2 collaborators: label `'Both Channels'`.
      - For 3+ collaborators: label `'All N Collaborators'`.
    - Generates a `collaborationGroupId` and calls  
      [setupMultiStepMenu(dropdown, groupId, collaborators, blockAllMenuItem)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:675:0-720:1).

- **Menu item structure (both new & old menus)**  
  [injectIntoNewMenu(...)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:4873:0-4976:1) and [injectIntoOldMenu(...)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:4978:0-5077:1):

  - Add a `Filter All` pill inside each FilterTube menu item:
    - Element: `div.filtertube-filter-all-toggle.exact-toggle.toggle-variant-red`.
  - Store metadata:
    - `data-collaboration-with` = “other channels for this video”.
    - `data-collaboration-group-id` = the shared `groupId`.
    - `data-is-block-all="true"` for the Block All / “Both Channels” row.
    - For non-block-all collaborators: `data-collab-key` = normalized id/handle/name.

  - Toggle click handler:
    - Uses [isFilterAllToggleActive](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:590:0-596:1) + [applyFilterAllStateToToggle](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:598:0-605:1).
    - Calls [persistFilterAllStateForMenuItem(menuItem, isActive)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:607:0-624:1) which:
      - For block-all row: sets `state.masterFilterAll`.
      - For a collaborator row: sets `state.filterAllMap[key]`.

  - Main click handler ([attachFilterTubeMenuHandlers](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:4832:0-4871:1)):
    - If click hits the toggle pill → **does not block**, just toggles UI.
    - Else:
      - For multi-step collaborator rows (`data-multi-step="true"` & not block-all): toggles “selected” state via [toggleMultiStepSelection](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:722:0-739:1); **does not block** yet.
      - For everything else: calls  
        [handleBlockChannelClick(channelInfo, menuItem, filterAll = isFilterAllToggleActive(toggle), videoCard)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5182:0-5654:1).

- **Multi-step state**  
  `multiStepSelectionState: Map<groupId, state>` with:
  - `selected: Set<collabKey>`
  - `filterAllMap: Map<collabKey, bool>`
  - `masterFilterAll: bool`
  - `blockAllItem`, `collaborators`, etc.

  [getFilterAllPreference(groupId, key, fallback)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:636:0-648:1):
  - If `filterAllMap[key]` exists → use it.
  - Else if `masterFilterAll` is boolean → use that.
  - Else → use `fallback`.

---

### 1.3 Block flows inside [handleBlockChannelClick](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5182:0-5654:1)

[handleBlockChannelClick(channelInfo, menuItem, filterAll, videoCard)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5182:0-5654:1) has three important branches:

1. **Multi-step individual rows (3+ collab)**  
   - If `data-multi-step="true"` and NOT block-all:  
     -> toggles selection only ([toggleMultiStepSelection](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:722:0-739:1)), then `return`.

2. **Block All / “Both Channels” / “Done (Hide Video)”**  
   - `if (channelInfo.isBlockAllOption && channelInfo.allCollaborators)`:
     - `isDoneButton = menuItem.getAttribute('data-is-done-button') === 'true'`
     - `groupId` from `channelInfo.collaborationGroupId` or `data-collaboration-group-id`.
     - [state = multiStepSelectionState.get(groupId)](cci:1://file:///Users/devanshvarshney/FilterTube/js/seed.js:320:12-322:13)
     - [resolveFilterAllPreference(collaborator)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5222:8-5225:10) uses [getFilterAllPreferenceForCollaborator](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:650:0-654:1)
       → which reads `filterAllMap`/`masterFilterAll`.

     **a) “Done (Hide Video)” (multi-select)**:
     - `isDoneButton === true` and `state.selected.size > 0`.
     - Builds `selectedCollaborators` from `state.selected`.
     - For each:
       - `identifier` = handle/id/name.
       - `useFilterAll = getFilterAllPreference(groupId, key, filterAll)`  ← this is where the **Filter All** choice is resolved.
       - `otherChannels` = all collaborators (selected + unselected) except self.
       - Calls:
         ```js
         addChannelDirectly(identifier, useFilterAll, otherChannels, null)
         ```
         → **note:** `collaborationGroupId` passed as `null` here.

     **b) Pure “Block All” (`Both Channels` / All N)**:
     - `isDoneButton === false`:
       - Loops through all `channelInfo.allCollaborators`.
       - For each:
         - `input` = collaborator handle/ID/name.
         - `otherChannels` = all others.
         - `collaboratorFilterAll = resolveFilterAllPreference(collaborator)`
         - Calls:
           ```js
           addChannelDirectly(input, collaboratorFilterAll, otherChannels, groupId)
           ```

3. **Single-channel blocking (solo, or 2‑collab when you click only one)**  
   - Uses `channelInfo.handle || channelInfo.id` and calls:
     ```js
     addChannelDirectly(input, filterAll, collaborationWith, /*no groupId*/)
     ```

So in theory:

- **Solo / per-channel from collab cards**: `filterAll` flag flows straight into storage → this matches your observation that it works.
- **Block All (2‑collab “Both Channels”, or “All N Collaborators”)**:
  - Should be using `state.filterAllMap`/`masterFilterAll`, i.e. the Filter All pills, when calling [addChannelDirectly](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5656:0-5687:1).
- **Multi-select “Done (Hide Video)” for N of M**:
  - Uses same [getFilterAllPreference](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:636:0-648:1) logic, *but* passes `collaborationGroupId = null`, which means:
    - Entries are **not grouped** in Channel Management (`collaborationGroupId` is missing).
    - They still carry `allCollaborators` though (from `collaborationWith`).

---

## 2. Why your “Filter All” issues are plausible

From the code plus what you described:

- **Solo + “Filter All”**:
  - Correct: goes through the single-channel branch and sets `filterAll` on that one entry → shows up in Channel Management and drives Filter All Content. This matches what you’re seeing.

- **2‑collab “Block Both” + Filter All:**
  - This goes through the Block All branch (2.b).
  - `collaboratorFilterAll` should be `true` iff:
    - You toggled Filter All on:
      - the Block Both row (→ `masterFilterAll`), or
      - each individual collaborator row (`filterAllMap[key]`).
  - If *anything* is off in `multiStepSelectionState` (wrong `groupId`, state not created, etc.), [resolveFilterAllPreference](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5222:8-5225:10) will fall back to `false`, so both channels are added with `filterAll: false` → exactly what you’re reporting.

- **Multi-select “Done (Hide Video)” + Filter All:**
  - Same logic for `useFilterAll`, but:
    - We call [addChannelDirectly(identifier, useFilterAll, otherChannels, null)](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5656:0-5687:1).
    - So channels created via Done:
      - Do get `filterAll` set (if `useFilterAll` is true).
      - **Do not get a `collaborationGroupId`**, so in Channel Management they look like “normal” entries, not grouped collab entries, and can’t become “full vs partial” yellow/dashed collab entries.

  Given your description (“partial N entries are not marked as part of collab”), this `null` groupId is almost certainly one of the problems.

---

## 3. Suggested behavioral decisions

Before coding, I’d lock down these semantics:

- **Keep both flows, but unify their meaning:**
  - **Per-channel click** (solo or any collaborator row):
    - Block just that channel.
    - Filter All only if its own `Filter All` pill is toggled.
  - **Block All row (2‑collab ‘Both Channels’ / ‘All N Collaborators’):**
    - With *no* selected collaborators → treat as “Block the full group”.
    - With selected collaborators (multi-select case) → act as “Done (Block selected only)”.
  - **Filter All semantics:**
    - Per-channel pill overrides.
    - Block-All pill acts as a “master default” used for any collaborator without its own setting.
    - Whatever combination is active when you click should be reflected in `filterAll` on each new channel entry.

- **Collab metadata semantics (what gets yellow vs dashed):**
  - **Full group** (e.g. 2/2, 3/3, 5/5):
    - All members of a collab video that were originally blocked together share the same `collaborationGroupId` and `allCollaborators`.
    - Channel rows get:
      - class `collaboration-entry` (solid yellow rail).
      - badge `presentCount/totalCount` (e.g. `2/2`).
  - **Partial group** (e.g. 1/2, 3/5):
    - Entries still share the same `collaborationGroupId` and full `allCollaborators` roster.
    - [render_engine.buildCollaborationMeta](cci:1://file:///Users/devanshvarshney/FilterTube/js/render_engine.js:311:4-356:5) computes `missingNames` and sets:
      - `collaboration-partial` (dashed yellow).
      - Tooltip exactly in the format you described:
        - `Originally blocked with: …`
        - `Still blocked: …`
        - `Missing now: …`.

- **Solo or non-collab blocks**:
  - No collab metadata at all (no yellow/dashed).

This matches the behavior you’ve described as desirable.

---

## 4. Minimal, safe changes I’d propose (before any refactor)

I’d keep the structure but tighten a few key points:

1. **Treat 2‑collab “Both Channels” as the same engine as Block All**
   - Keep the friendly label (“Both Channels”), but don’t have a separate ‘Block Both’ code path.
   - The current code already mostly does this; we should just ensure `multiStepSelectionState` is correctly initialised for 2‑collab groups and that [resolveFilterAllPreference](cci:1://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:5222:8-5225:10) is being used for them too (it is).

2. **Make multi-select “Done” entries fully collab-aware**
   - In the Done branch (multi-select `isDoneButton === true`), change the calls to:
     ```js
     addChannelDirectly(identifier, useFilterAll, otherChannels, groupId)
     ```
     instead of passing `null` for the groupId.
   - This will:
     - Give all partial entries a `collaborationGroupId`, so [render_engine.groupChannelsByCollaboration](cci:1://file:///Users/devanshvarshney/FilterTube/js/render_engine.js:288:4-309:5) can group them.
     - Keep `allCollaborators` as-is (already full roster from `otherChannels`), so [buildCollaborationMeta](cci:1://file:///Users/devanshvarshney/FilterTube/js/render_engine.js:311:4-356:5) can mark them as full or partial collab rows and compute the tooltips.

3. **Introduce a single helper for collab “commit” logic**
   - Inside [content_bridge.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:0:0-0:0) only (no new file yet), add a helper that:
     - Takes: `collaborators`, `selectedKeys` (or a flag “all”), `groupId`, and the `multiStepSelectionState` entry.
     - Returns an array of `{ identifier, filterAll, otherChannels, groupIdForStorage }` specifications.
   - Use this helper from **both**:
     - The “Block All” branch (2+ collab, no selection).
     - The “Done (Hide Video)” branch (multi-select).
   - That gives you:
     - **One single point** where Filter All decisions are applied for any collab multi-block.
     - The same code path for 2‑collab Block Both and 3+ collab Block All/Done.

4. **Do NOT refactor into a separate collab file yet**
   - Right now collab logic in [content_bridge.js](cci:7://file:///Users/devanshvarshney/FilterTube/js/content_bridge.js:0:0-0:0) is big, but it’s still the “source of truth” you rely on while debugging.
   - I’d first:
     - Fix Filter All behavior for:
       - 2‑collab Block Both.
       - Multi-select (Block All & Done).
     - Confirm with your own logs / Channel Management UI that:
       - `filterAll` is set correctly.
       - Full vs partial collab rows and the tooltips match your expectations.
   - Only after that would I extract collab-specific helpers into a `js/collab_menu.js` (or similar) module.

---

## 5. A few concrete decisions I’d like your input on

Before I actually start editing code:

- **Q1 – Semantics for 2‑collab “Both Channels”:**  
  Do you want to:
  - **(A)** Keep the current immediate behavior (click → block both instantly, no multi-select Done step), just with Filter All fixed?  
  - Or **(B)** treat 2‑collab exactly like multi-select (where you can pre-select channels and then hit Done), even if the UI still says “Both Channels”?

- **Q2 – Marking partial collabs:**  
  Are you happy with marking *any* block that came from a collab card (even if you selected only 1 of 5) as a **partial collab** row (dashed yellow + tooltip) in Channel Management?  
  (From your message, it sounds like **yes**, and this is exactly what passing `groupId` on the Done path will enable.)

Once you confirm Q1/Q2, I can:

- Implement the small behavioral fixes (especially the `groupId` for Done + the single helper for multi-block Filter All).
- Then we can decide on a safe plan to move collab-specific helpers into a dedicated file without duplicating logic.

---

### Status

- **Understanding current implementation:** Done (and mapped functions/flows).
- **Design for unified collab insertion + Filter All semantics:** In-progress, outlined above.
- **No code changes applied yet.**

If you’re okay with the proposed semantics (especially treating partial collabs as dashed-yellow collab rows), I’ll move to an implementation pass next, keeping changes minimal and localized.










=========================================================================================================





# FilterTube 3-Dot Menu for Collaboration Videos OLD OLD OLD

_Notes for Google AI Studio_

## 1. Why this feature exists

YouTube treats collaboration videos as single-channel uploads with a `"Shakira and 2 more"` style byline. FilterTube has to surface every collaborator inside the 3-dot menu so the user can block **any** participant, or the entire group, without leaving the dropdown. The UX goals were:

1. **List every collaborator immediately** so people can act without opening extra dialogs.
2. **Keep the menu responsive** even when the underlying data originates in different JS worlds (main vs isolated) or delayed SPA fetches.
3. **Guarantee correctness**: never regress to a poorer roster once a richer one is discovered, and never let YouTube's native handlers fire (the `serviceEndpoint` crash).

## 2. System architecture recap

| Stage | File | Responsibility |
| --- | --- | --- |
| 1. Extraction | `js/filter_logic.js` | While the filtering engine intercepts `ytInitialData` / `fetch:/youtubei/*`, it records collaboration metadata and POSTs it to the main world (`FilterTube_CacheCollaboratorInfo`). |
| 2. Main-world cache | `js/injector.js` | Maintains `collaboratorCache` (videoId → roster) and can fall back to a deep `ytInitialData` walk via `searchYtInitialDataForCollaborators`. A quality score (name/handle/ID weights) prevents partial lists from overwriting richer ones. |
| 3. UI bridge | `js/content_bridge.js` | Runs in the isolated world. It parses DOM hints (attributed bylines, avatar stacks, cached JSON on cards), injects placeholder or final menu entries, and asks the injector for enrichment when needed (`FilterTube_RequestCollaboratorInfo`). |
| 4. Background persistence | `js/background.js` | When a user blocks a channel, the background script resolves the canonical handle/UC ID, stores collaboration metadata for history, and syncs with storage.

## 3. Flow inside the 3-dot menu

1. **Dropdown detection** – `setupMenuObserver` watches for `tp-yt-iron-dropdown` nodes. When YouTube opens the menu, we locate the owning card and call `injectFilterTubeMenuItem`.
2. **Immediate roster** – We merge three sources in order of trust: `resolvedCollaboratorsByVideoId`, `data-filtertube-collaborators` on the card, and live DOM parsing (attributed text, anchor tags, `yt-avatar-stack-view-model`). `getCollaboratorListQuality` ranks each candidate so we never regress.
3. **Placeholder** – If the list is incomplete, we register the dropdown via `registerActiveCollaborationMenu` and render a non-interactive "Fetching collaborators…" entry. This prevents the `serviceEndpoint` click crash (thanks to `attachFilterTubeMenuHandlers` + `preventNativeClick`).
4. **Enrichment fan-out** – `cacheResultAndMaybeEnrich` seeds `pendingCollabCards`, marks the card for dialog scraping, and (critically) fires `requestCollaboratorEnrichment`, which talks to the injector for the authoritative roster. When the injector replies, `handleMainWorldMessages` forces `applyResolvedCollaborators(videoId, collaborators, { force: true })`, which updates every card plus the active dropdown.
5. **Multi-step UX** – `renderFilterTubeMenuEntries` renders up to six collaborators plus a "Block All" row. Selecting individuals updates a shared `collaborationGroupId`, highlights chosen rows, and rewrites the CTA to "Done • Block N".
6. **Blocking pipeline** – `handleBlockChannelClick` locks the menu item, awaits `addChannelDirectly`, hides every instance of the video, and closes the dropdown via synthetic Escape/blur events.

## 4. Why full collaborator info still lags after SPA navigation

Even though the YouTube **dialog popup** can enumerate all collaborators, the 3-dot menu sometimes sees only the primary channel on first open. Root causes:

1. **Seed-level skips**: `js/seed.js` intentionally skips processing certain SPA fetches (search, browse continuations) to avoid fighting YouTube's diffing engine. When that happens, the injector never sees the fresh `ytInitialData`, so `collaboratorCache` lacks the roster until a full reload.
2. **Dialog vs. card timing**: The collaborator popup is driven by a `showDialogCommand` that YouTube fetches on-demand when the user taps the byline. FilterTube can only scrape that dialog *after* it renders, whereas the 3-dot menu must render instantly. Hence the placeholder → refresh cycle.
3. **Card cloning**: Home/search feeds reuse DOM nodes as you scroll. We tag cards with `data-filtertube-video-id`, but SPA mutation order can mark the dropdown before our DOM enrichment runs, leading to a temporary mismatch.
4. **Rate limits on fetches**: Blindly re-fetching "latest" for every card would spam `youtubei` endpoints, introduce layout flicker, and resurrect the "Block 2 more" placeholder bug. The quality-guard approach ensures we reuse the highest-fidelity roster we already have, while still allowing a later enrichment to replace it if (and only if) it's richer.

## 5. Mitigations already in place

- **Quality-aware caching** in both worlds prevents stale overwrites and lets us compare DOM vs. injector data deterministically.
- **Avatar stack parsing** gives us 2–4 collaborator handles instantly, even before dialog enrichment.
- **Active dropdown registry** (`registerActiveCollaborationMenu`) lets us re-render the open menu the moment enrichment completes—no reload needed.
- **Centralized event capture** avoids the `serviceEndpoint` regression by suppressing YouTube's native menu callbacks.
- **Multi-source propagation** (`applyCollaboratorsByVideoId`) writes the enriched roster back to every card, so subsequent openings are instant.

## 6. Remaining gaps & next bets

| Gap | Impact | Next step |
| --- | --- | --- |
| Seed skips on SPA navigation | First open sometimes shows only the primary collaborator. | Investigate a lighter `FilterTubeEngine` pass for collaboration metadata even when other filters opt out, or add a targeted `browse` fetch triggered by the dropdown (with exponential backoff). |
| Dialog scraping latency | Placeholder may linger ~500 ms on slow devices. | Pre-emptively trigger `showDialogCommand` via an offscreen click/close when we detect `yt-avatar-stack-view-model` but missing handles (needs experimentation, risk of YouTube counters). |
| Unknown collaborator counts beyond avatar stack | We infer expected counts from parsed text (`"and 3 more"`) plus avatar stack size, but if YT adds a 5+ collaborator UI we may undercount. | Add heuristics for new renderer types and keep comparing the number of injected rows vs. `data-filtertube-expected-collaborators`. |
| Background storage lag between popup/tab views | Historical issue where tab view overwrites popup state. | Continue unifying storage listeners; outside scope of this specific 3-dot write-up but noted for completeness. |

## 7. Key files for reference

- `js/content_bridge.js` – dropdown lifecycle, menu injection, collaborator propagation.
- `js/injector.js` – main-world cache & `ytInitialData` search.
- `js/filter_logic.js` – initial collaborator extraction inside the filtering engine.
- `js/background.js` – persistence and blocking logic.
- `docs/ARCHITECTURE.md`, `docs/CODEMAP.md`, `docs/FUNCTIONALITY.md`, `docs/TECHNICAL.md`, `docs/youtube_renderer_inventory.md` – broader system overview.

---
_This document mirrors the reasoning already discussed in the issue thread and is formatted for Google AI Studio consumption._


