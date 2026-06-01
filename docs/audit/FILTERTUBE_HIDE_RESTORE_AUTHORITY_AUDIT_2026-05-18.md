# FilterTube Hide/Restore Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This slice pins the visual hide/restore layer because it is the place where a
wrong decision becomes user-visible: content disappears, shelves collapse,
stats can move, media can pause, and recycled YouTube DOM nodes can keep stale
FilterTube state.

## Verdict

```text
Hide/restore authority is split.

There is a good central helper, but it is not the only writer. Runtime code
also hides with direct inline display writes, generated CSS rules, optimistic
user-action paths, pending whitelist paths, members/playlist fallback paths,
and container cleanup. Restore paths exist, but they are reason-specific and
do not yet prove every writer has the same owner-scoped rollback contract.
```

This is a high-confidence explanation for false-hide and stale-hide reports:
even when the rule decision is correct, the visual write can outlive its
decision owner or bypass the shared restore/stat/debug behavior.

## Current Authority Map

| Hide/restore owner | Current source | Current behavior | Risk |
| --- | --- | --- | --- |
| Shared helper | `js/content/dom_helpers.js:67-149` | Adds/removes `.filtertube-hidden`, `data-filtertube-hidden`, inline `display:none`, stats/tracker writes, whitelist-pending transition, and media playback side effects. | Correct central sink, but too many side effects are attached to one boolean hide call. |
| Container cleanup | `js/content/dom_helpers.js:154-205` | Adds `.filtertube-hidden-shelf` when all children are hidden or previously present children disappear. | A child false-hide can collapse a whole shelf or section. |
| Runtime CSS controls | `js/content/dom_fallback.js:1064-1407` | Generates `filtertube-content-controls-style` with broad `display:none!important` rules for home feed, playlists, mixes, members-only, watch controls, comments, end-screen, autoplay, annotations, header, and search shelves. | CSS hides do not carry per-element reason/restore metadata. |
| Open-app button cleanup | `js/content/dom_fallback.js:1409-1426` | Directly writes `display:none!important` and `data-filtertube-hidden-open-app`. | Useful app-shell cleanup, but outside shared hide/restore ownership. |
| Disabled/stale cleanup | `js/content/dom_fallback.js:2001-2032`, `2308-2322` | Clears generic hidden/pending state and empties runtime control CSS. | Clears only known generic markers; specialized direct writers need their own cleanup. |
| Watch whitelist restore | `js/content/dom_fallback.js:2141-2164` | Force-restores watch metadata and hidden/pending children in whitelist mode. | This is a compensating repair path, which proves watch false-hide state is possible. |
| Members-only fallback | `js/content/dom_fallback.js:2172-2250` | Directly hides badge hosts/shelves and restores only `[data-filtertube-members-only-hidden]`. | Broad watch/shelf selectors can hide large surfaces; restore is marker-specific. |
| Playlist/mix fallback | `js/content/dom_fallback.js:2253-2299` | Directly hides playlist lockups, shelves, horizontal lists, and Mixes chips. Mix chip restore exists; playlist off-restore is not symmetric in the same block. | Direct playlist hides can bypass shared reason/stat/restore behavior. |
| Main card decisions | `js/content/dom_fallback.js:2325-3929` | Sets reason attributes, pending metadata markers, then calls `toggleVisibility()`. | Best candidate for future structured decision contract, but reason state is still scattered across attributes and a string reason. |
| Shelf title / empty shelf | `js/content/dom_fallback.js:4311-4386` | Hides shelves from title matches or empty visible child state. | Broad parent hide can remove non-matching children if identity or child visibility is stale. |
| Whitelist pending bridge | `js/content_bridge.js:5846-5955` | In whitelist mode, queues prefetch, then directly adds hidden class/attr, pending attr, and inline display. | Pending hide is intentional fail-closed behavior, but it bypasses shared writer/restore accounting. |
| Fallback-menu immediate hide | `js/content_bridge.js:6846-6858` | Immediately hides a row after block action by direct display/class/attr writes. | User-action hide is valid, but it needs a named optimistic owner and rollback contract. |
| 3-dot optimistic hide | `js/content_bridge.js:11628-11703`, `12682-12708` | Saves previous inline/class/attr state for one path, but other immediate hides directly write display/class/attr. | Optimistic behavior is split across multiple local implementations. |
| Recycled-card cleanup | `js/content/dom_extractors.js:109-198` | Clears identity/hide markers and inline display when YouTube reuses DOM nodes and video identity changes. | This is necessary proof that stale DOM state is real, not theoretical. |

## Flow

```text
rule/settings/identity decision
        |
        +--> toggleVisibility(element, shouldHide, reason, skipStats)
        |       +--> class + attr + inline display
        |       +--> stats/tracker unless skipStats
        |       +--> media playback side effect
        |
        +--> direct display/class/attr writers
        |       +--> pending whitelist
        |       +--> optimistic quick/menu block
        |       +--> members/playlist/mix fallback
        |       +--> open-app cleanup
        |
        +--> generated CSS display:none rules
                +--> broad control toggles
                +--> route/control dependent restore by CSS regeneration
```

The missing boundary is not "how do we hide"; it is "who owns this hide, when
is it allowed, what proof caused it, what side effects are allowed, and which
restore path is responsible for undoing it."

## Findings

1. `toggleVisibility()` is the right central model, but it mixes four jobs:
   visual state, stats, tracker history, and media playback. A future
   decision contract should separate those policies.
2. Direct inline writers remain necessary for a few user-action and shell
   cases, but they need names. Today they are not all routed through one
   registry.
3. CSS style injection is useful for broad UI controls, but it is not a
   substitute for decision-level proof because it carries no per-card reason.
4. The watch whitelist restore path is a repair path. Keep it until watch
   metadata/rail fixtures prove the underlying hide writers are scoped enough.
5. Recycled-card cleanup is mandatory. YouTube reuses card nodes, so all
   future identity/hide logic must clear stale markers and inline display when
   video identity changes.
6. Open-app button cleanup should stay separate from content filtering stats.
   It is shell cleanup, not a user content block.
7. Pending whitelist hides must remain fail-closed, but they should be modeled
   as `pendingIdentity` with TTL/route/restore owner instead of raw direct
   class/display writes.

## Future Contract Token

```text
hideRestoreAuthority
```

The token intentionally does not exist in product source today. It names the
missing future boundary:

```text
hideRestoreAuthority.apply({
  writer,
  surface,
  route,
  targetKind,
  decisionKind,
  ruleId,
  confidence,
  visualPolicy,
  statsPolicy,
  mediaPolicy,
  restoreOwner,
  ttlMs
})
```

## Required P0 Fixtures Before Behavior Changes

```text
hide_restore_shared_toggle_reports_writer_reason_and_marker
hide_restore_direct_display_writes_have_registered_restorers
hide_restore_disabled_extension_clears_all_filtertube_hide_markers
hide_restore_css_control_rules_have_route_owner_and_disable_path
hide_restore_members_only_restore_clears_members_marker_and_generic_marker
hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats
hide_restore_pending_whitelist_restore_requires_identity_outcome
hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers
hide_restore_shelf_title_restore_clears_specific_marker
hide_restore_current_watch_owner_block_has_playback_side_effect_reason
hide_restore_no_rule_path_does_not_leave_inline_display_none
hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css
```

## Safe Improvement Areas After Fixtures

1. Introduce a structured hide decision object and route the main card loop
   through it first.
2. Convert direct display writers into named writer helpers, keeping user-action
   optimistic hides but adding explicit rollback metadata.
3. Add a disabled/no-rule cleanup fixture that proves class, generic attrs,
   reason attrs, pending attrs, and inline display are all cleared.
4. Keep CSS controls for broad UI toggles, but require route owner and
   disable-path proof for every selector group.
5. Keep recycled-card cleanup as a permanent invariant and add fixture coverage
   for playlist selected rows, search cards, watch rail cards, and Shorts cards.

## Boundary Note

Ignored root HTML/JSON/TXT captures are valid evidence inputs for this audit,
especially when proving which YouTube renderer or DOM host can be recycled or
hidden. They remain raw evidence only. Any future hide/restore fixture should
extract a minimal committed DOM/JSON fragment with source-family metadata.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this hide/restore authority audit can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
