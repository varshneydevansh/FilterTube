# Plan: Channel Identity Stamping Waterfall and All-Card Gap Audit

**Generated**: 2026-02-28
**Estimated Complexity**: High

## Overview
This plan enforces one behavior across YTM/YTD/YTK cards: **blocking decisions must be based on video-derived or playlist-derived channel identities from JSON sources first, never inferred from DOM text alone**. The work is split into (1) a complete waterfall spec for available JSON variants and (2) a gap audit that identifies where current DOM stamping is still missing uploader/creator/collaborator identities, with special focus on Shorts and playlist/collab cards.

The short-video case is included explicitly: the `reel_item_watch` source is valid for live short playback context and is a high-confidence short-time source, but it is not guaranteed for all list surfaces.

### Current implementation status (as of 2026-02-28)

- `js/content_bridge.js`: strict context gate now enforced for quick-block merges (`candidateMatchesClickedIdentity`).
- `docs/channel-stamping-waterfall-spec-2026-02-28.md`: updated to document file-by-file JSON mapping + merge gate behavior.
- Validation remains pending on the listed regression scenarios (playlist creator mismatch, short recycle cards, collab key/path fidelity).

## Decision record (2026-02-28): pre-stamp first, action-only blocked fields

- Decision summary:
  - Move identity enrichment to first-pass stamping for every card discovery and JSON match path.
  - Keep blocked action metadata out of stamp payloads:
    - `data-filtertube-blocked-channel-id`
    - `data-filtertube-blocked-channel-name`
    - `data-filtertube-blocked-state`
    - `data-filtertube-blocked-ts`
  - Maintain current playlist-vs-seed guardrails:
    - Playlist context uses playlist creator if present.
    - Seed-video fallback only for unresolved non-playlist contexts.
  - Preserve existing collab enrichment path:
    - hydrate all JSON-captured collaborators immediately when available,
    - dialog-driven completion remains allowed only for missing identities.

- Why:
  - Current UI snapshots show metadata fields (`collaborators`, `expected` counters, channel roster) arriving after block action.
  - Delayed enrichment can produce wrong immediate menu targets on playlist rows and partial 3-dot label identity.
  - First-pass identity stamping shortens action path and avoids context races in recycled card DOM nodes.

- Acceptance checkpoint added by policy:
  - On first hydration of eligible cards, stamp JSON-resolvable fields before user interaction.
  - `data-filtertube-blocked-*` fields are written only after successful block actions or explicit persistence events.

## Current Positioning
- Do **not** implement code in this phase.
- Do **NOT** treat this as playlist-only; this applies to all card types.
- Target files to touch:
  - `docs/channel-stamping-waterfall-audit-plan.md` (new)
  - `js/content_bridge.js` (context gate hardening)

## Core Invariants
- Identity source precedence is strict and card-type aware.
- A card can carry multiple identities only when collaboration is explicit.
- Playlist cards must be resolved to **playlist creator** when creator identity is available.
- Seed-channel inference from seed video should be used only for non-playlist content cards.
- Shorts and playlist collection cards must still be blocked by stable `videoId`/`playlistId` resolution when DOM lacks rich byline IDs.

## Waterfall Source Model (Truth Source Order)

## Level 1: XHR Intercept JSON (Primary)
- File capture points: `seed.js` keeps snapshots for `/youtubei/v1/next`, `/youtubei/v1/browse`, `/youtubei/v1/player`.
- Expected reliability: highest for immediate rendering context.
- Typical renderer families:
  - `videoWithContextRenderer`
  - `compactVideoRenderer`
  - `compactPlaylistRenderer`
  - `playlistPanelVideoRenderer`
  - `reelItemRenderer`
  - `shortsLockupViewModel` / `shortsLockupViewModelV2`
  - `ytm-*` compact/card variants
  - `compactRadioRenderer`
- Required extraction for any content card:
  - `videoId` if present
  - channel identity from byline/browse endpoint (`browseEndpoint.browseId`)
  - handle/customUrl from canonical/base URL fields when available
  - logo/name where available
  - collaborator list structures where present

## Level 2: Initial Data Snapshot (Secondary)
- Files/objects: `ytInitialData`, `ytInitialPlayerResponse`, `filterTube.lastYtInitialData`, `filterTube.lastYtInitialPlayerResponse`.
- Use the same channel resolver logic as Level 1, but with weaker freshness guarantees than XHR.
- Applies to all surfaces where Level 1 missing or delayed.

## Level 3: DOM Attributes (Tertiary)
- Data attributes stamped on renderer/card nodes, e.g. `data-filtertube-channel-id`, `data-filtertube-video-id`, `data-filtertube-playlist-id`, collaborator list data attributes.
- DOM-only extraction is still needed for legacy cards but must never override strong JSON identity.

## Level 4: Main-world Reactive Search for Video Context (Watch-time rescue)
- `searchYtInitialDataForVideoChannel(videoId)` and related lookups in `injector.js`.
- Used when card-specific nodes are incomplete but video id is known.

## Level 5: Network Fallback (last resort)
- `/watch?v=<videoId>` style and `/shorts/<shortId>` style page fetches.
- Should only execute when all higher levels do not yield usable identity.
- Kids safety: avoid unless safe and enabled by existing policy.

## Shorts-Specific Clarification
- `reel_item_watch?prettyPrint=False` (or equivalent short-player JSON in fixtures) is useful and should be treated as **watch playback source**.
- It is available in contexts where the short is active/playing.
- It is **not guaranteed to exist for non-visible short cards**, and should not be the only source for generic short cards in feeds.
- For short feed cards, prefer Level 1/2 extraction from feed JSON.
- For the currently playing short, Level 4 can still be used as high-priority rescue if DOM attributes are empty.

## JSON Structure Mapping by Card Type (High-Precision Reference)

### A. Regular Video Cards (`videoWithContextRenderer`, `lockupViewModel`)
- **Video ID**: `.videoId` (standard) or `.contentId` (lockup)
- **Channel ID Path**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **Modern Lockup ID Path**: `.metadata.lockupMetadataViewModel.image.decoratedAvatarViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Collaborator Trigger**: Presence of `showSheetCommand` in `shortBylineText`.

### B. Shorts & Reel Content (`reelItemRenderer`, `shortsLockupViewModel`)
- **Video ID**: `.videoId` or `.onTap.innertubeCommand.reelWatchEndpoint.videoId`
- **Playback ID Path**: `overlay.reelPlayerOverlayRenderer.reelChannelBarViewModel.channelTitle.onTap.innertubeCommand.browseEndpoint.browseId`

### C. Playlist & MIX Panels (`playlistPanelVideoRenderer`, `compactPlaylistRenderer`)
- **Playlist ID**: `.playlistId`
- **Owner Channel Path**: `.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId`
- **MIX Identity**: Determined by `playlistId` (RD-prefix); block context is the collection unit.

### D. Collaborator Roster (Deep Sheet Extraction)
- **Command**: `.showSheetCommand.panelLoadingStrategy.inlineContent.sheetViewModel.content.listViewModel.listItems[]`
- **ID Path**: `listItemViewModel.rendererContext.commandContext.onTap.innertubeCommand.browseEndpoint.browseId`
- **Max Roster Size**: 7 (1 Uploader + 6 Collaborators).

## YT_MAIN_NEXT Variant (non-obvious format support)
- Some responses use a compact message schema variant where renderer keys are wrapped differently.
- Required rule: `videoId + byline endpoint` must still be resolved through the same parser adapters; missing this is a primary cause of null identity.
- Plan action: keep a per-renderer adapter map that normalizes each payload shape to the same canonical identity tuple:
  - `videoId`, `channelId`, `handle`, `customUrl`, `name`, `sourceType`, `playlistId?`, `collab[]`.

## Canonical Identity Tuple (single schema)
- `videoId` (nullable for pure playlist cards)
- `playlistId` (nullable)
- `channelId`
- `handle`
- `customUrl`
- `name`
- `logo`
- `source` (`ytm-video`, `ytd-video`, `ytk-video`, `ytm_playlist`, `playlist_card`, `reel`, `ytm_watch_next`, etc.)
- `fetchStrategy` (`video`, `playlist`, `shorts`, `collab`) 
- `confidence` (`json-primary`, `json-secondary`, `dom`, `fallback-watch`) 

## Where current behavior is likely still failing
1. Playlist card quick block taking seed video channel instead of playlist creator.
2. Shorts cards with no immediate byline IDs relying on stale DOM identity.
3. Some collab cards parse only main byline and drop additional collaborator IDs from sheet view data.
4. Cards in mixed renderer structures (`YT_MAIN_NEXT` path) bypassing adapter map and falling back too aggressively.
5. DOM attribute clears on collection cards without equivalent rehydrate by video/playlist identity.
6. Cross-link confusion when quick-click block on one card can stamp another visible recycled card when identity not re-resolved at mutation boundaries.
7. Collab metadata is currently observed on `ytm-playlist-panel-video-renderer` only after click/block path (DOM before block often has only `video-id` and base channel id; DOM after block includes `data-filtertube-collaborators`, collaborator state, expected count, and blocked fields).

## Plan by Sprint

## Sprint 1: Spec + Diagnostics Lock (no behavior change)
Goal: Freeze the contract and expose where JSON-based identity is being skipped.

### Task 1.1: Create canonical source-adapter matrix docs
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Build a one-to-one mapping table for each renderer type + source path + identity extraction keys.
- Acceptance:
  - Every known fixture type (YTM-YHR, YTM-XHR, YTM.json, YT_MAIN_UPNEXT_FEED_WATCHPAGE2/3, YT_MAIN_NEXT) mapped to at least one adapter.
- Validation:
  - Manual review of docs against fixture names and key fields above.

### Task 1.2: Add missing short-video source note
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Add explicit note that `reel_item_watch` style payload is playback-only high-confidence source.
- Acceptance:
  - No code path assumes it exists for feed-wide short cards.

### Task 1.3: Add gap checklist for current mismatch scenarios
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Include reproducible symptom lines:
  - Playlist creator vs seed mismatch (e.g., Voula Fra playlist showing Nine Inch Nails)
  - Collab one-name-only behavior
  - Shorts empty-channel DOM fallback
- Acceptance:
  - Each symptom mapped to missing source tier or stale stamp path.

## Sprint 2: Adapter Normalization for Complete Card Coverage (analysis-driven implementation prep)
Goal: Make every card path produce canonical identity tuple before blocking decision.

### Task 2.1: Finalize canonical identity resolver contract
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Specify required output and conflict precedence:
  - playlist-card creator-first
  - collab enrichment list merge not overwrite
  - video fallback only for non-playlist cards
- Acceptance:
  - Unambiguous precedence matrix for all card types.

### Task 2.2: Define adapter signatures per renderer family
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Add pseudo-schema for:
  - `videoWithContextRenderer`
  - `playlistPanelVideoRenderer`
  - `compactPlaylistRenderer`
  - `compactRadioRenderer`
  - `reelItemRenderer`
  - `shortsLockupViewModel`
  - `ytm-compact-playlist-renderer`
  - `playlist`/`mix`/`shelf` variants from YT_MAIN_NEXT
- Acceptance:
  - No card family in observed fixtures is undocumented.

### Task 2.3: Define collaborator extraction fallback order
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Order: explicit collaborators in JSON sheet -> byline fallback -> no collaborators.
- Acceptance:
  - Collab metadata list can contain up to 7 candidates.

## Decision Record: move to pre-stamp pass (all details on initial card hydration)

### Evidence
- User observed real DOM snapshots show playlist video card state differences:
  - Before quick-block:
    - `data-filtertube-video-id`, `data-filtertube-channel-id`, processing markers only.
    - no `data-filtertube-collaborators*`, no `data-filtertube-blocked-*`.
  - After quick-block:
    - `data-filtertube-collaborators`, `data-filtertube-collab-state`, `data-filtertube-expected-collaborators`, `data-filtertube-collaborators-ts` appear.
    - `data-filtertube-blocked-channel-*` fields are added.
- This means collab roster + blocked context are computed lazily in action path, not during initial JSON-card hydration.

### Why this change is required
- We need **deterministic and instant filtering/whitelisting** from any card surface, not only after user interaction.
- Lazy post-action stamping makes first-pass logic depend on fallback heuristics and can mis-associate:
  - playlist cards can fallback to wrong uploader (`seed` identity drift, e.g., `Voula Fra`/`NIN` case class),
  - collab rows can render with insufficient identities (name-only / handle-only / ID fallbacks) until block time.
- Pre-stamping does not change blocked-state behavior; it only moves resolved metadata from click path into first-pass identity enrichment.

### Desired pre-stamp contract
- On first robust JSON match for a DOM card, stamp all resolvable identity fields immediately:
  - `videoId`, `playlistId` where available,
  - channel identity (`id`, `handle`, `customUrl`, `name`),
  - collaborator roster + expected count + source metadata when present,
  - source/confidence markers.
- Keep `data-filtertube-blocked-*` fields strictly for user block events only.

## Sprint 3: Integration Boundaries and Guardrails
Goal: Prevent incorrect persistence/blocking even if some cards remain incomplete.

### Task 3.1: Playlist policy definition
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Confirm and formalize:
  - Always block playlist creators when creator identity is available.
  - Seed-channel fallback only for clearly unresolved algorithmic collections.
  - For unresolved playlist fallback use explicit provenance marker.
- Acceptance:
  - Zero intentional seed-channel-blocking for playlist cards.

### Task 3.2: Shorts policy definition
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Decision: if short card has no channel id in DOM, resolve by videoId using highest available JSON level; use playback-only `reel_item_watch` only when active short is the target.
- Acceptance:
  - One deterministic path for both feed short cards and currently-playing short cards.

### Task 3.3: Confidence + conflict policy
- Location: `docs/channel-stamping-waterfall-audit-plan.md`
- Document when to keep/remove stale stamps:
  - Never override trusted JSON stamps with DOM guesses.
  - Replace only if source trust increases or explicit conflict checks pass.
- Acceptance:
  - No downgrade from strong JSON identity to weak DOM identity.

### Task 3.4: Click-context mismatch gate for quick-block merges
- Location: `js/content_bridge.js`
- Add a single identity matcher used by:
  - fetched collaborator payloads (`pendingDropdownFetches`),
  - structured lookup (`searchYtInitialDataForVideoChannel`),
  - playlist creator fallback re-reads.
- Matching policy:
  - if clicked row has strong identity (`id`, `@handle`, or `customUrl`) require candidate to match that identity;
  - if row has `playlistId`/playlist-flow context, never allow an unrelated candidate with contradiction on that `playlistId`;
  - if row has `videoId`, reject candidate with explicit different `videoId`;
  - if no strong identity exists, allow only non-contradictory context candidates (or name match on explicit single-collab rows).
- Acceptance:
  - Playlist card action logs no longer mix with unrelated `Nine Inch Nails`/seed-channel candidates.

## Merge-gate checklist (implemented behavior)

- Quick-block merge points:
  - Structured lookup (`searchYtInitialDataForVideoChannel`) for normal/short cards.
  - Menu prefetch enrichment (`pendingDropdownFetches.channelInfoPromise`).
  - Playlist creator fallback + seed fallback branches.
- Lock checks:
  - videoId mismatch reject
  - playlistId mismatch reject
  - strong identity mismatch reject (`id/handle/customUrl`)
  - playlist-context candidates must carry playlist evidence for non-single collab rows.
- Collab safeguard:
  - selected collaborator key continues to bypass non-specific identity text matching.

## Testing Strategy (for implementer)
- Fixture replay from:
  - `YTM-XHR.json`
  - `YTM.json`
  - `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`
  - `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`
  - `YT_MAIN_NEXT.json`
  - `playlist.json` and short-specific watch JSON (`reel_item_watch`)
- Scenarios:
  - Playlist card byline creator vs seed mismatch
  - Collab card with 2+ collaborators in sheet model
  - Short card with missing channel byline attributes
  - Mixed renderer path in YT_MAIN_NEXT
  - DOM stale-card recycle after mutation (same node reused)
- Acceptance:
  - For each scenario, expected identity stamp fields are present in DOM before user action.

## Risks and Gotchas
- Renderer shapes drift quickly; adapters should be keyed defensively.
- Collab sheet payloads can have duplicate channel IDs; dedupe deterministically.
- Canonical names in byline can be placeholder/CTA-like; avoid using title-like strings as name keys.
- Some surfaces provide only `handle` style alias without `channelId`; require resolve via mapping layer.

## Rollback Plan
- Since this phase is documentation only, rollback means reverting `docs/channel-stamping-waterfall-audit-plan.md` if required.

## Why this answers your question
- All cards are covered, not only playlists.
- Short cards are in the same JSON-first pipeline and can use playback JSON only as a contextual source when the short is active.
- Playlist cards are creator-first by contract, with explicit fallback rules for unresolved algorithmic mixes.
- The JSON fixtures already contain the data; failure is in extraction consistency and fallback precedence, not in missing upstream data.

## 2026-02-28 Follow-up: immediate action decision log

### Confirmed observation after inventory pass
- In DOM and logs, some 3-dot/collab paths were stamping `data-filtertube-channel-*` identity only during menu/block action flows.
- That means:
  - menu label fallback had to operate on partial fields,
  - `filtertube-collaborators*` and expected collaborator counters often appeared only after user action,
  - playlist/seed mismatch risk stayed open until click path completes.

### Why we keep "pre-stamp everything resolvable" policy now
- The data exists in JSON for these paths:
  - playlist owner in compact playlist renderers,
  - collab members from `listItemViewModel` sheet payloads,
  - shorts and watch/list cards via `videoId`/`playlistId` resolver maps.
- So metadata should be written when available:
  - at discovery/enrichment time to card node attributes,
  - before any click/multi-step action, with no blocked-state writes.
- This removes stale race windows in recycled card DOMs and supports instant UI operations.

### Constraint reminder (unchanged)
- `data-filtertube-blocked-*` remains action-only and must only be written when a block is executed.
- Playlist creator-vs-seed guardrails remain unchanged:
  - playlist context -> creator-first,
  - seed-video fallback only when playlist creator cannot be resolved from trusted JSON signals.
