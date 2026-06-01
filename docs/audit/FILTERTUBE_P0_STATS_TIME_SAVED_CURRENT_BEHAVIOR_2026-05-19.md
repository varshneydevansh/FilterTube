# FilterTube P0 Stats / Time-Saved Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts the P0 stats/time-saved fixture family from the
implementation-readiness gate into runnable proof. The purpose is to keep stats
from becoming a second independent authority for filtering success.

Runtime proof:

```text
tests/runtime/p0-stats-time-saved-current-behavior.test.mjs
```

## Source Surface

| Source | Current role |
| --- | --- |
| `js/content/dom_helpers.js:67-148` | `toggleVisibility()` couples visual hide/restore, tracking, stats, whitelist-pending state, inline display writes, and media pause/resume. |
| `js/content_bridge.js:3489-3735` | Initializes, increments, decrements, and saves surface-aware stats from hidden DOM elements. |
| `js/background.js:4423-4434` | Legacy `recordTimeSaved` message adds caller-provided seconds into `stats.savedSeconds`. |
| `js/state_manager.js:2357-2398` | External settings reload watches legacy `stats`, but not `statsBySurface`. |
| `js/tab-view.js:10740-10955` | Dashboard prefers `statsBySurface[surface]`, falls back to legacy Main stats, and clamps only for display formatting. |

## Current Behavior Matrix

| P0 fixture | Current result | Evidence | Risk |
| --- | --- | --- | --- |
| `stats_rejects_untrusted_record_time_saved` | Not satisfied. | `recordTimeSaved` lacks sender-class or trusted-UI checks. | Any caller that reaches the background action can mutate legacy saved time. |
| `stats_rejects_negative_or_nonfinite_seconds` | Not satisfied. | `stats.savedSeconds = oldSeconds + (request.seconds || 0)` has no finite, positive, maximum, or type validation. | Negative, infinite, string, or extreme values can enter storage. |
| `stats_records_only_structured_hide_decisions` | Not satisfied. | `incrementHiddenStats(element)` takes only a DOM element and is called by `toggleVisibility()` with no hide decision id. | Dashboard stats can make broad or stale hides look like valid product wins. |
| `stats_restore_decrements_only_prior_counted_hide` | Partially satisfied but not authoritative. | Restore decrements from `data-filtertube-time-saved` and count state, with no structured prior-counted decision id. | Restores depend on a mutable DOM attribute rather than a tracked hide decision. |
| `stats_skipstats_does_not_pause_media_without_side_effect_reason` | Not satisfied. | `skipStats` suppresses tracker/stats calls, but `handleMediaPlayback()` still runs unconditionally. | Cleanup/container paths can still cause media side effects. |
| `stats_surface_scope_main_and_kids_are_separate` | Partially satisfied. | Content runtime writes `statsBySurface[surface]`; legacy background path writes only `stats`. | Surface-specific dashboard truth can drift from legacy stats. |
| `stats_dashboard_refreshes_on_stats_by_surface_change` | Not satisfied. | StateManager reload keys include `stats`, but omit `statsBySurface`. | Pure surface-stat updates can miss dashboard refresh. |
| `stats_storage_write_is_batched_or_debounced` | Not satisfied. | `saveStats()` writes storage immediately for each counted hide/restore. | Heavy hide bursts can create storage churn. |
| `stats_legacy_background_path_cannot_override_surface_stats` | Not satisfied. | Background writes legacy `stats`; dashboard Main can fall back to legacy stats when no Main surface object exists. | Legacy caller-provided metrics can still influence Main dashboard display. |
| `stats_no_rule_hide_path_does_not_increment_dashboard` | Not satisfied. | `toggleVisibility(element, true, reason, false)` can increment stats without a compiled no-work/rule-state authority. | Any non-skipStats hide path can count even if it is later proven stale, broad, or not rule-backed. |

## Why This Blocks Behavior Changes

Stats touch the same disease as the filtering bugs:

```text
broad selector or stale predicate
        |
        +--> hide DOM node
        +--> pause/resume media
        +--> write hide tracker state
        +--> increment hidden count/time saved
        +--> dashboard presents the event as useful filtering
```

That means false hides and performance problems can be masked as success
metrics unless stats become a validated side effect of one structured hide
decision.

## Required Future Contract

Before changing stats behavior, add one stats side-effect authority:

```text
statsSideEffectAuthority({
  actorClass,
  surface,
  route,
  profileId,
  source,
  hideDecisionId,
  elementKind,
  videoId,
  channelId,
  counted,
  savedSeconds,
  validation: {
    trustedSender,
    finiteSeconds,
    positiveSeconds,
    maxSeconds,
    routeScoped,
    priorCountedElement,
    compiledRuleActive
  }
})
```

Future behavior should only count a hide when the hide decision is structured,
route/surface scoped, and eligible for stats. Background metric writes should be
sender-gated and range-validated, or retired behind the same authority.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add counters for storage writes and counted hide decisions,
- add structured proof fixtures around specific hide owners.

Blocked now:

- changing dashboard numbers,
- changing saved-time estimates,
- removing legacy stats fallback,
- changing `skipStats` media behavior,
- changing background `recordTimeSaved`,
- changing hide/restore behavior to satisfy stats rather than filtering truth.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 stats gate can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
