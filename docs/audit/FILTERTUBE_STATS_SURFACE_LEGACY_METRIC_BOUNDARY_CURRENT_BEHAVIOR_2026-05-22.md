# FilterTube Stats Surface Legacy Metric Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior boundary.
Runtime behavior is unchanged.
This is not an implementation patch.

## Purpose

This slice promotes the older P0 stats/time-saved proof into the newer
source-pinned boundary format. The codebase inspection is finding places for
optimization and first-class JSON filtering, but stats must stay a downstream
validated side effect, not a separate way to declare filtering success.

The active question is whether a hide decision, a JSON-first decision, or a
cleanup path can currently increment dashboard success metrics without one shared
metric eligibility decision. Current behavior is split: DOM hide/restore,
surface-aware content stats, legacy background stats, StateManager reloads, and
dashboard display all have local rules.

## Current Proof Surface

| Metric | Current value |
| --- | ---: |
| stats metric boundary source files pinned | 6 |
| stats metric source/effect blocks pinned | 14 |
| content bridge storage reads for stats in pinned blocks | 2 |
| content bridge storage writes for stats in pinned blocks | 1 |
| background legacy stats storage reads in pinned blocks | 1 |
| background legacy stats storage writes in pinned blocks | 1 |
| StateManager external reload `stats` entries | 1 |
| StateManager external reload `statsBySurface` entries | 0 |
| dashboard stats rotation listener callsites in pinned block | 2 |
| dashboard stats rotation timer callsites in pinned block | 2 |
| runtime implementation changed | no |

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_helpers.js` | 206 | 8,292 | `a8c6ebfc10394f67254fbe5d324090ba9d01bead7efbb61d44e63dda4b52c242` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/settings_shared.js` | 1,181 | 57,535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/tab-view.js` | 11,617 | 526,763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |

## Source/Effect Blocks

| Block | Source anchor | Lines | Bytes | Current behavior pinned |
| --- | --- | ---: | ---: | --- |
| `domToggleVisibility` | `js/content/dom_helpers.js:67` | 84 | 3,286 | `toggleVisibility()` couples DOM hide/restore, tracker calls, stats calls, pending-whitelist marker cleanup, inline display mutation, and media pause/resume. |
| `contentInitializeStats` | `js/content_bridge.js:3709` | 30 | 1,223 | Content runtime initializes from `statsBySurface[surface]`, falling back to legacy `stats` only for Main. |
| `contentGetContentType` | `js/content_bridge.js:3744` | 46 | 1,347 | Content type is inferred from tags, classes, Mix labels, and DOM structure before saved-time estimation. |
| `contentEstimateTimeSaved` | `js/content_bridge.js:3796` | 26 | 901 | Saved-time estimates are local heuristic values for comments, chips, Shorts, videos, shelves, and playlists. |
| `contentIncrementStats` | `js/content_bridge.js:3826` | 69 | 2,489 | Incrementing trusts the hide caller after local title/link/container checks, then writes `data-filtertube-time-saved` and calls `saveStats()`. |
| `contentDecrementStats` | `js/content_bridge.js:3899` | 19 | 560 | Restore accounting depends on the mutable element attribute `data-filtertube-time-saved`. |
| `contentSaveStats` | `js/content_bridge.js:3921` | 36 | 1,109 | Saving reads `stats` and `statsBySurface`, writes merged `statsBySurface`, and also writes legacy `stats` for Main. |
| `backgroundCompiledGetStatsKey` | `js/background.js:1825` | 3 | 80 | Background compiled-settings storage read includes legacy `stats`, not `statsBySurface`. |
| `backgroundRecordTimeSaved` | `js/background.js:4449` | 12 | 571 | Legacy `recordTimeSaved` reads only `stats`, adds caller-provided `request.seconds || 0`, and writes only `stats`. |
| `sharedSettingsStatsKeys` | `js/settings_shared.js:51` | 2 | 43 | Shared settings keys include both `stats` and `statsBySurface`. |
| `sharedLoadStatsPayload` | `js/settings_shared.js:729` | 2 | 151 | Shared settings load returns legacy `stats` and `statsBySurface`. |
| `stateLoadStatsPayload` | `js/state_manager.js:242` | 4 | 260 | StateManager loads legacy `stats` and `statsBySurface`. |
| `stateExternalReloadStatsKey` | `js/state_manager.js:2416` | 1 | 29 | StateManager external reload watches `stats`, but not `statsBySurface`. |
| `tabDashboardStatsBlock` | `js/tab-view.js:10744` | 214 | 9,136 | Dashboard reads `statsBySurface` first, falls back to legacy Main stats, clamps saved-time only for display, and rotates Main/Kids stats with UI listeners and a timer. |

## Current Runtime Findings

| Runtime path | Current behavior | Risk class |
| --- | --- | --- |
| DOM hide/restore helper | A hide can record tracking and increment stats when `skipStats` is false, while media playback side effects run outside the stats guard. | false-hide masking, side-effect coupling |
| Content stats writer | Surface-aware stats are stored in `statsBySurface`; Main also updates legacy `stats`. | surface drift, storage churn |
| Content restore accounting | Decrementing depends on a mutable DOM attribute, not a structured prior hide decision. | stale restore, recycled-node drift |
| Background legacy writer | `recordTimeSaved` accepts raw caller seconds into legacy `stats` without trusted-sender, finite-number, positivity, maximum, or surface checks. | reliability, metric spoofing, dashboard drift |
| Shared settings | Shared load/save knows both metric fields. | broad persistence surface |
| StateManager reload | StateManager loads both metric fields but external reload watches only legacy `stats`. | missed dashboard refresh for pure `statsBySurface` writes |
| Dashboard display | Dashboard prefers surface stats, then legacy Main stats, and clamps only rendered saved time. | legacy fallback can display caller-influenced metrics |

## Optimization And JSON-First Boundary

Stats are an optimization and correctness blocker for JSON-first filtering. A
future JSON decision must not count as a successful hide unless the decision is
structured, route/surface scoped, rule-backed, and eligible for metrics.

This slice does not approve changing stats behavior. It identifies where future
work needs proof:

- hide-decision eligibility before `incrementHiddenStats(element)`;
- no-rule/no-work gating before dashboard counters change;
- surface-scoped writes and dashboard refresh parity for `statsBySurface`;
- trusted sender and range validation for `recordTimeSaved`;
- storage-write budgets or batching for heavy hide/restore bursts;
- media side-effect separation from `skipStats` and metric decisions.

## Missing Runtime Authority Symbols

The current product runtime does not contain these symbols:

- `statsSurfaceMetricBoundaryContract`
- `statsSideEffectAuthority`
- `statsStructuredHideDecisionReport`
- `statsLegacyRecordTimeSavedGate`
- `statsSurfaceRefreshParityReport`
- `statsStorageWriteBudget`
- `statsDashboardFallbackDecision`
- `statsNoRuleMetricEligibilityReport`
- `statsMediaSideEffectSeparationReport`
- `statsMetricArtifact`

Until those or equivalent reviewed mechanisms exist with fixtures and metrics,
this audit slice is evidence of current behavior only.

## Non-Completion Boundary

This does not complete the active goal. It adds current-behavior proof for one
stats, surface, storage, dashboard, hide/restore, performance, and false-hide
boundary, but it does not prove every feature, file, method, JSON path, DOM
selector, runtime observer/listener/timer, settings mode, or cross-feature
interaction.

Required future proof before changing metric behavior:

| Gate | Required proof before implementation |
| --- | --- |
| Structured hide eligibility | Runtime fixtures proving counted hides have route, surface, profile, rule state, element kind, and source-effect provenance. |
| Legacy background writer | Trusted sender, finite positive seconds, maximum seconds, surface scope, and spoof-negative fixtures. |
| Restore accounting | Prior counted hide id or equivalent proof that restored nodes decrement exactly once. |
| Dashboard refresh | Storage-change fixtures proving `statsBySurface` changes refresh dashboard state. |
| Storage budget | Burst fixtures or metrics proving hide/restore writes are batched, bounded, or intentionally immediate. |
| JSON-first promotion | Positive and negative fixtures proving JSON-side hides cannot increment metrics without the same eligibility decision as DOM hides. |

## Linked Evidence

- `tests/runtime/stats-surface-legacy-metric-boundary-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_P0_STATS_TIME_SAVED_CURRENT_BEHAVIOR_2026-05-19.md`
- `tests/runtime/p0-stats-time-saved-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_STATS_TIME_SAVED_AUTHORITY_AUDIT_2026-05-18.md`
- `tests/runtime/stats-time-saved-authority-current-behavior.test.mjs`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_ENABLED_MASTER_SWITCH_DISABLED_RUNTIME_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this stats surface metric boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
