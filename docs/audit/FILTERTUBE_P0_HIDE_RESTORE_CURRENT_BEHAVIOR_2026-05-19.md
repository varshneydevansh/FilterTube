# FilterTube P0 Hide / Restore Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice converts the P0 hide/restore authority family into runnable proof.
It exists because false-hide and stale-hide symptoms become visible only after a
decision reaches the visual layer: classes are added, inline `display:none` is
written, stats can move, media can pause, and recycled YouTube nodes can keep
old FilterTube markers.

## Verdict

```text
P0 hide/restore slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

The central `toggleVisibility()` helper is useful and must be preserved, but it
is not the only writer. Direct inline writers, generated CSS rules, pending
whitelist hides, optimistic user-action hides, members/playlist fallbacks,
container cleanup, and recycled-card cleanup do not yet share one
`hideRestoreAuthority` report.

## Current Authority Shape

```text
rule / identity / UI decision
        |
        +--> toggleVisibility(...)
        |       + visual class/attr/inline display
        |       + stats/tracker side effects
        |       + media playback side effects
        |
        +--> direct display/class/attr writers
        |       + pending whitelist
        |       + optimistic menu / quick block
        |       + members-only fallback
        |       + playlist / mix fallback
        |       + open-app cleanup
        |
        +--> generated CSS display:none rules
                + broad route/control selectors
                + no per-element reason marker
```

## P0 Fixture Status

| P0 fixture | Current behavior pinned here | Future green condition |
| --- | --- | --- |
| `hide_restore_shared_toggle_reports_writer_reason_and_marker` | `toggleVisibility()` accepts a string reason and `skipStats`, but no structured writer/report exists. | Every shared hide carries writer, reason marker, visual policy, stats policy, media policy, and restore owner. |
| `hide_restore_direct_display_writes_have_registered_restorers` | Bridge/fallback paths still write `display:none` directly; some have local restore, some have marker-specific or no symmetric local restore. | Every direct writer has a registered restorer or is converted to the shared authority. |
| `hide_restore_disabled_extension_clears_all_filtertube_hide_markers` | Disabled/stale cleanup clears generic markers but not every specialized marker such as members-only and open-app markers. | Disabled/no-rule cleanup clears all FilterTube hide markers and inline display for every writer family. |
| `hide_restore_css_control_rules_have_route_owner_and_disable_path` | Generated CSS owns broad hide rules with route attrs, but no per-rule route owner/report exists. | Every generated CSS hide group has route owner, mode owner, disable path, and fixture proof. |
| `hide_restore_members_only_restore_clears_members_marker_and_generic_marker` | The direct members-only restore clears local markers, but the family still lacks registry ownership and includes broad watch/shelf targets. | Members-only hide/restore is route-scoped, marker-specific, registry-owned, and watch-shell safe. |
| `hide_restore_open_app_button_hide_is_excluded_from_content_filter_stats` | Open-app cleanup uses direct display writes and does not call `toggleVisibility()`, so it avoids content stats, but has no shell-cleanup report. | Open-app cleanup is explicitly classified as shell cleanup with no content stats/media side effects. |
| `hide_restore_pending_whitelist_restore_requires_identity_outcome` | Pending whitelist directly hides cards and schedules recheck, but no TTL or identity-outcome report owns the restore. | Pending identity hides carry identity source, TTL, route, restore owner, and final allow/block outcome. |
| `hide_restore_recycled_card_cleanup_clears_identity_and_hide_markers` | Recycled-card cleanup clears identity, hide, blocked, collaborator, class, and inline display state for video-id changes. | Keep as invariant and extend fixture coverage to watch rails, playlists, Shorts, and search cards. |
| `hide_restore_shelf_title_restore_clears_specific_marker` | Shelf title hides set `data-filtertube-hidden-by-shelf-title` and local restore clears that marker. | Keep as invariant and add negative sibling-visible fixtures for mixed shelves. |
| `hide_restore_current_watch_owner_block_has_playback_side_effect_reason` | Current-watch owner enforcement pauses/clicks/hides, but media/navigation side effects are not a structured policy. | Watch owner hides carry explicit playback/navigation side-effect reason and route/player state. |
| `hide_restore_no_rule_path_does_not_leave_inline_display_none` | Generic no-work cleanup can restore shared hides, but specialized direct markers are not all covered by one no-rule cleanup proof. | No-rule and disabled paths prove zero stale inline display for every FilterTube writer family. |
| `hide_restore_writer_registry_covers_toggle_visibility_direct_style_and_css` | No product-source writer registry or `hideRestoreAuthority` exists yet. | Shared helper, direct inline writes, and generated CSS are all represented in one writer registry. |

## Risk Interpretation

The most important current risk is not that every direct hide is wrong. Some
direct hides are intentional. The risk is that the code has several visual
write paths with different rollback rules. A false-positive decision, stale
identity, route mismatch, or mode transition can therefore leave hidden state
behind even after the original rule no longer applies.

## Safe Next Proof

Before changing runtime behavior, add DOM fixtures for:

- disabled/no-rule cleanup across every marker family
- mixed shelf where only one child matches
- pending whitelist identity resolution and timeout
- members-only badge on watch metadata versus a normal card
- open-app cleanup excluded from content stats
- optimistic menu hide rollback after failed persistence
- recycled playlist/watch/Shorts card node identity changes

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 hide/restore gate can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
