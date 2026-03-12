# Plan: Channel Identity, Watch, Mix, and Collaboration Recovery

**Generated**: 2026-03-09
**Estimated Complexity**: High

## Overview

This plan restores the intended FilterTube architecture after the `22323b748cda176e38683f6cfe53792955f9f592` and `dafc4bf56abce16ca80b0f9ce32801649c09e5e5` change set drifted from the documented contract.

Core direction:

1. Keep JSON prestamping as a fast UX hint only.
2. Restore authoritative blocking to the older deterministic path: JSON engine filtering first, then reliable `videoChannelMap`/main-world enrichment, then DOM fallback.
3. Stop Mix cards from entering collaboration semantics.
4. Make persisted/displayed channel identity prefer the real channel name everywhere: 3-dot menu, channel block list, and Filter All derived keywords.
5. Keep watch/YTM collaborator extraction rich, but only when the payload is a real roster with explicit collaborator identities.

## Prerequisites

- No new dependencies are expected.
- Primary files involved:
  - `js/filter_logic.js`
  - `js/content_bridge.js`
  - `js/injector.js`
  - `js/content/dom_extractors.js`
  - `js/background.js`
  - `js/settings_shared.js`
  - `js/render_engine.js`
- Primary behavior contracts live in:
  - `docs/CHANNEL_BLOCKING_SYSTEM.md`
  - `docs/CONTENT_HIDING_PLAYBOOK.md`
  - `docs/watch_json_paths.md`
  - `docs/json_paths_encyclopedia.md`
  - `docs/channel-stamping-waterfall-spec-2026-02-28.md`
  - `docs/WATCH_PLAYLIST_BREAKDOWN.md`
  - `docs/FUNCTIONALITY.md`
  - `CHANGELOG.md`

## Non-Negotiable Product Contract

1. Pre-render filtering remains primary; DOM fallback is only the safety net.
2. `data-filtertube-channel-id` is only stamped with validated `UC...` IDs.
3. Channel display text must prefer the real channel name over handle, custom URL, or UC ID.
4. Mix cards are not collaborations.
5. Blocking from a Mix card is single-channel only and must not open multi-collab UI.
6. Watch/YTM collaboration UI may show multiple collaborators only when a true collaborator roster exists.
7. Filter All derived keywords must be channel-derived entries tied back to the channel, and the derived word must come from the channel name, not a handle, alias, placeholder, or UC ID.
8. Video titles, collapsed bylines (`"A and 2 more"`), menu labels, CTA text, and stale DOM attributes must never be persisted as channel names.

## Dependency Graph

```text
T1 ──┬── T2 ── T3 ── T4 ──┬── T7 ──┬── T9 ──┬── T10 ──┬── T11 ── T12
     │                     │        │       │         │
     ├── T5 ───────────────┘        │       │         │
     ├── T6 ────────────────────────┘       │         │
     └── T8 ────────────────────────────────┘         │
                                                      │
                                      diagnostics and release checks
```

## Sprint 1: Restore Identity Authority Boundaries

**Goal**: Separate cosmetic prestamps from authoritative identity resolution again.

**Demo/Validation**:
- Confirm the code path does not treat a partial prestamp as “done”.
- Confirm prefetch/main-world enrichment still runs when only name/handle/custom URL hints exist.
- Confirm `data-filtertube-channel-id` is only written for validated `UC...` IDs.

### T1: Freeze recovery contract from docs, stash, and commit analysis
- **depends_on**: []
- **location**: `docs/*.md`, `CHANGELOG.md`, `stash.txt`
- **description**: Convert the observed contracts into an explicit implementation checklist inside code comments or an engineer note before touching logic, so later edits do not re-introduce the same ambiguity.
- **validation**: The checklist covers pre-render filtering priority, Mix-vs-collab rules, watch roster rules, channel-name precedence, and Filter All provenance.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T2: Split authoritative video-channel mapping from cosmetic identity hints
- **depends_on**: [T1]
- **location**: `js/filter_logic.js`, `js/content_bridge.js`
- **description**: Stop overloading `FilterTube_UpdateVideoChannelMap` with partial identity hints that look authoritative. Either split the message types or clearly separate “validated mapping” from “display hint” payload handling.
- **validation**: A payload lacking a validated `channelId` can improve labels, but cannot mark the identity pipeline complete.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T3: Restore prefetch/main-world enrichment even when seeded hints exist
- **depends_on**: [T2]
- **location**: `js/content_bridge.js`
- **description**: Remove the early-return behavior introduced by `getSeedIdentityForVideoId()` when the cached seed is partial. Only skip enrichment when a validated, sufficiently rich identity exists under the documented rules.
- **validation**: Cards with only name/handle/custom URL hints still flow through reliable `ytInitialData`/snapshot lookup and `videoChannelMap` learning.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T4: Re-harden stamping and stale-card reset rules
- **depends_on**: [T2, T3]
- **location**: `js/content_bridge.js`
- **description**: Revisit `stampChannelIdentity`, `shouldStampCardForVideoId`, and stale-reset helpers so recycled DOM nodes cannot retain misleading display fields or IDs, while keeping good expected-name hints for follow-up enrichment and not clearing useful hints before the restored enrichment path runs.
- **validation**: Recycled cards lose stale identity safely, but a later authoritative enrichment can restamp them correctly without blanking cards during the transition.
- **status**: Not Completed
- **log**:
- **files edited/created**:

## Sprint 2: Repair Mix, Watch, and Collaboration Extraction

**Goal**: Make Mix cards single-channel again and make watch/YTM collaborator extraction use only true roster payloads.

**Demo/Validation**:
- A Mix card never produces multi-collaborator menu UI.
- A true collab watch/YTM card produces full collaborator rows when the roster exists.
- Watch playlist rows without strong IDs still get correct display + enrichment behavior without wrong persistence.

### T5: Remove Mix cards from collaboration semantics
- **depends_on**: [T1]
- **location**: `js/content_bridge.js`, `js/content/dom_extractors.js`
- **description**: Undo the path that upgraded Mix cards into `isCollaboration: true` based on seed-artist byline parsing. Preserve only a single block target for Mix menu behavior.
- **validation**: `compactRadioRenderer`/Mix cards never emit `allCollaborators` menus from `"A and more"`-style bylines.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T6: Harden watch/YTM collaborator roster extraction to real roster contexts
- **depends_on**: [T1]
- **location**: `js/injector.js`, `js/content_bridge.js`
- **description**: Restrict collaborator extraction to explicit sheet/dialog/list-item roster structures with browse endpoints or validated handle/custom-url evidence, while supporting the watch/YTM variants documented in the JSON path docs. Add a graceful degrade path when only ambiguous byline text exists so the UI can keep safe expected-name/byline hints without fabricating hard collaborator identities.
- **validation**: A collab card with `showSheetCommand`/`showDialogCommand` list items yields the real collaborators; aggregate byline text alone does not fabricate hard collaborator identities; debug logging shows when a candidate roster was rejected and why.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T7: Reconcile playlist/watch byline fallback with authoritative enrichment
- **depends_on**: [T3, T4, T6]
- **location**: `js/content_bridge.js`, `js/injector.js`
- **description**: Keep plain byline text as display/expected-name fallback for playlist/watch rows, but never treat it as a hard identity. Re-trigger main-world lookup when IDs or safe names are still incomplete.
- **validation**: Watch playlist rows avoid generic `"Block Channel"` where a safe name exists, yet never persist `"A and 2 more"` or title-like text as the channel.
- **status**: Not Completed
- **log**:
- **files edited/created**:

## Sprint 3: Repair Persistence, Display, and Filter All Provenance

**Goal**: Ensure storage and UI reflect the real channel identity and that Filter All derived keywords stay correctly linked.

**Demo/Validation**:
- Blocking a channel stores the real channel name.
- The block list shows the channel name, not a handle alias or UC ID, unless no safer value exists.
- Filter All generated keywords are stable, deduped, and tied back to the right channel.

### T8: Fix background persistence merge policy for names, handles, and topic channels
- **depends_on**: [T1]
- **location**: `js/background.js`
- **description**: Merge incoming channel data so good names replace weak alias-like names, topic channels stay UC-first when appropriate, and stale handle leakage is cleared instead of preserved. Define trust ordering for async sources (authoritative mapping/main-world result vs DOM/prefetch/background repair) so later weak payloads cannot overwrite earlier stronger names.
- **validation**: A later enrichment can repair a weak stored row; topic channels do not inherit stale non-topic handles; video titles and handle aliases do not win over a real channel name; weaker late-arriving payloads cannot downgrade a stronger stored identity.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T9: Rebuild Filter All keyword sync around provenance and active list mode
- **depends_on**: [T1, T5, T7, T8]
- **location**: `js/settings_shared.js`, `js/render_engine.js`
- **description**: Keep channel-derived keywords tagged with `source: 'channel'` plus `channelRef`, dedupe them against user keywords safely, and respect the active whitelist/blocklist keyword store. Derive the word from the channel name, not from fallback identity noise, and refresh the derived keyword when the canonical stored channel name changes.
- **validation**: Filter All rows survive reloads/mode changes, do not duplicate user keywords, remain attached to the channel that created them, and update cleanly when a channel row is later repaired to a better canonical name.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T10: Align menu labels and list display with canonical channel-name precedence
- **depends_on**: [T5, T7, T8, T9]
- **location**: `js/content_bridge.js`, `js/render_engine.js`, `js/background.js`
- **description**: Standardize the display precedence for channel labels across 3-dot menus, collaborator rows, direct add/block flows, and the channel list: safe channel name first, then safe handle/custom URL, then UC ID as last-resort identity.
- **validation**: The same blocked channel appears with the same human-readable name in menus, persisted storage, and Filter All-related UI.
- **status**: Not Completed
- **log**:
- **files edited/created**:

## Sprint 4: Regression Proofing and Release Safety

**Goal**: Lock the fix behind a repeatable regression matrix so watch/YTM gains do not break YTD/YTK or Mix behavior again.

**Demo/Validation**:
- The full manual matrix passes on YTD, YTM, and YTK.
- The known regressions from the stash/commit analysis are explicitly covered.

### T11: Build a focused regression matrix from fixtures and live-surface contracts
- **depends_on**: [T7, T9, T10]
- **location**: `docs/json_paths_encyclopedia.md`, `docs/watch_json_paths.md`, `docs/WATCH_PLAYLIST_BREAKDOWN.md`, `docs/YTD_YTK_YTM_REGRESSION_SPEC_2026-02-17.md`
- **description**: Turn the doc-set into a concrete smoke matrix covering Home/Search/Watch/playlist/Mix/Shorts, with explicit checks for channel-name quality, Mix non-collab behavior, and watch roster completeness.
- **validation**: The matrix includes at least: watch collab card, watch playlist row, Mix card, YTM `videoWithContextRenderer`, YTD lockup/watch, YTK safe path, Filter All derivation, and a check that the temporary diagnostics/debug guardrails can be turned on and emit the expected identity-source decisions.
- **status**: Not Completed
- **log**:
- **files edited/created**:

### T12: Add temporary debug guardrails and rollback hooks for the recovery patch
- **depends_on**: [T11]
- **location**: `js/filter_logic.js`, `js/content_bridge.js`, `js/injector.js`, `js/background.js`
- **description**: Add narrowly-scoped debug instrumentation around identity-source selection, mix/collab classification, and persistence repair decisions so any remaining drift is visible before shipping broadly.
- **validation**: Debug mode shows which source won, why a Mix card stayed single-channel, why a collaborator roster was accepted/rejected, and whether a stored name was upgraded or preserved.
- **status**: Not Completed
- **log**:
- **files edited/created**:

## Parallel Execution Groups

| Wave | Tasks | Can Start When |
|------|-------|----------------|
| 1 | T1 | Immediately |
| 2 | T2, T5, T6, T8 | T1 complete |
| 3 | T3 | T2 complete |
| 4 | T4 | T2, T3 complete |
| 5 | T7 | T3, T4, T6 complete |
| 6 | T9 | T5, T7, T8 complete |
| 7 | T10 | T5, T7, T8, T9 complete |
| 8 | T11 | T7, T9, T10 complete |
| 9 | T12 | T11 complete |

## Testing Strategy

- Manual smoke matrix by surface:
  - YTD Home/Search/Watch
  - YTM Home/Search/Watch
  - Watch playlist panel
  - Mix/Radio cards
  - True collaboration cards with roster sheets/dialogs
  - Filter All derivation and channel list display
- Identity-quality assertions:
  - Persisted `name` is the real channel name, not title, handle alias, or collapsed byline
  - `data-filtertube-channel-id` is only a validated UC ID
  - `expectedChannelName` never becomes authoritative by itself
- Collaboration assertions:
  - True collaborator roster shows individual channel rows
  - Mix cards never show collaborator rows
  - `"Block All"` appears only for true multi-collab cards
- Playlist/watch assertions:
  - Blocked playlist rows stay hidden
  - Next/Prev/autoplay still skip blocked rows
  - Missing byline links do not cause wrong persistence
- Filter All assertions:
  - Derived keyword equals the channel name
  - Derived row carries `channelRef`
  - No duplicate user-vs-derived keyword rows

## Risks & Mitigations

- **Risk**: Reverting the prestamp control flow too aggressively could make menus feel slower again.
  - **Mitigation**: Keep cosmetic prestamping for labels, but do not let it short-circuit authoritative enrichment.
- **Risk**: Tightening collaborator acceptance could hide legitimate YTM/watch rosters.
  - **Mitigation**: Anchor acceptance to the explicit list-item roster variants documented in the JSON path docs, not to generic byline text.
- **Risk**: Fixing Mix cards could break playlist/watch collection handling.
  - **Mitigation**: Separate Mix classification from playlist/watch row handling; use dedicated acceptance checks for both.
- **Risk**: Filter All dedupe could drop intentional user keywords.
  - **Mitigation**: Preserve user-entered rows first; only suppress channel-derived duplicates when the same normalized word is already user-owned.
- **Risk**: Topic-channel cleanup could remove legitimate handles on non-topic channels.
  - **Mitigation**: Apply the topic path only when the name/ID/custom-url evidence matches the documented UC-first topic pattern.

## Rollback Plan

1. Revert the recovery patch as one unit if any surface starts hiding the wrong channel.
2. If needed, temporarily keep only T8/T9/T10 (name/provenance fixes) while disabling T2-T7 classification changes.
3. If watch/YTM roster extraction remains unstable, ship the authority-boundary restoration first and keep collaborator recovery behind an internal flag until the fixture matrix passes.
