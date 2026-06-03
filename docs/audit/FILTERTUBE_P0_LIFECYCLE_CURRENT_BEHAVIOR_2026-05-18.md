# FilterTube P0 Lifecycle Current Behavior - 2026-05-18

Status: current-behavior proof slice with 2026-05-26 SPA drag optimization addendum.

This document converts the P0 lifecycle family from
`docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md` into runnable
fixtures. It records the current observer, listener, timer, scan, menu
insertion, fullscreen, and route behavior after the no-work optimization pass.
This file records current behavior after the scoped lifecycle fixes; it is not an implementation patch or permission for additional runtime changes.

## P0 Fixture Family

```text
P0 lifecycle:
  quick_block_disabled_zero_lifecycle_work
  menu_disabled_zero_fallback_insertion
  native_overlay_quiet_mode_pauses_runtime
  fullscreen_pauses_non_player_runtime
  navigation_disconnects_route_observers
```

These names are future expectations. The current tests intentionally prove
where today's source lacks the central lifecycle authority needed to satisfy
them.

## Current Findings

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `quick_block_disabled_zero_lifecycle_work` | `setupQuickBlockObserver()` now returns before style/listener/observer setup when quick-block is disabled or whitelist mode is active. When enabled, desktop first-rule creation remains hover-lazy and pointer recovery has a dynamic `pointermove` removal path. | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Disabled quick block should continue to install zero quick-block lifecycle work, and enabled page-lifetime work still needs owner/teardown records. |
| `menu_disabled_zero_fallback_insertion` | `ensureFallbackMenuButtons()` can inject fallback menu CSS, body mutation observation, navigation/click/scroll listeners, and warmup scans without sharing the normal menu `showBlockMenuItem`/list-mode action gate. | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Disabled menu affordances should install zero fallback insertion/scanning lifecycle work. |
| `native_overlay_quiet_mode_pauses_runtime` | Native overlay quiet mode exists and pauses several fallback-menu paths, but it is not a shared lifecycle pause authority across quick block, DOM fallback, seed interception, collaborator, and other page-runtime owners. | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Native overlays should pause every nonessential page-runtime owner through one shared lifecycle registry. |
| `fullscreen_pauses_non_player_runtime` | Current source does not expose one fullscreen-aware lifecycle registry that pauses quick block, fallback menu, DOM fallback, prefetch, seed endpoint work, and collaborator observation during player fullscreen. | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Fullscreen should pause non-player DOM scans, menu sweeps, quick-block viewport work, and unrelated observers/timers. |
| `navigation_disconnects_route_observers` | Some observers disconnect on navigation, but fallback menu, quick block, DOM fallback guards, and collaborator listeners have page-lifetime or once-installed behavior without one route teardown contract. | `tests/runtime/p0-lifecycle-current-behavior.test.mjs` | Route navigation should disconnect or retarget route-owned observers, listeners, and timers with explicit owner records. |

## Source-Level Lifecycle Budgets

These are not performance measurements. They are exact current source budgets
for the two lifecycle owners most directly tied to empty-install YouTube Main
lag. They give the future implementation a concrete target to flip from
"present today" to "zero when disabled or no-rule".

| Owner slice | `document.addEventListener` | `window.addEventListener` | Mutation observers | Intervals | Timeouts | RAF callbacks | Selector scans | Teardown markers |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `setupQuickBlockObserver()` | 9 | 3 | 1 | 0 | 3 | 1 | 1 `querySelectorAll` | 1 `removeEventListener`, 0 `disconnect` |
| `ensureFallbackMenuButtons()` | 5 | 1 | 1 | 1 | 4 | 2 | 4 `querySelectorAll`, 23 `querySelector` | 0 `removeEventListener`, 0 `disconnect` |

Required future counters:

```text
quick_block_disabled_zero_lifecycle_work:
  document.addEventListener: 0
  window.addEventListener: 0
  MutationObserver: 0
  setInterval: 0
  selector scans: 0

menu_disabled_zero_fallback_insertion:
  fallback style insertion: 0
  MutationObserver: 0
  warmup timer: 0
  scroll/click/navigation listeners: 0
  selector scans: 0
```

## Why This Matters

The lifecycle layer explains why lag can appear even when filtering rules are
empty or unrelated to the visible page:

```text
manifest page runtime
  -> seed patches fetch/XHR
  -> content bridge starts prefetch/hydration
  -> fallback menu starts scan lifecycle
  -> quick block starts viewport lifecycle
  -> DOM fallback installs playlist/media guards
  -> collaborator dialog starts trigger observation
```

Today those owners do not share one lifecycle budget. A future performance fix
should not simply delete a listener or observer. It should first prove which
owner needs the work, which settings/route/surface activates it, which
fullscreen/native-overlay state pauses it, and which route transition tears it
down.

## Required Future Lifecycle Contract

Each lifecycle fixture must eventually assert:

```text
lifecycle owner id exists
compiled active-state predicate exists
route and surface are part of the owner record
native overlay pause reason exists when relevant
fullscreen pause reason exists when relevant
teardown or documented page-lifetime reason exists
disabled quick-block lifecycle count: 0
disabled fallback-menu insertion count: 0
route navigation orphan observer count: 0
```

## Current Verdict

```text
P0 lifecycle family is partially green: quick-block disabled zero-lifecycle is now satisfied, but menu, overlay/fullscreen, and route-teardown authorities remain open.
Current behavior is proof-pinned.
Runtime behavior changed for the 2026-05-26 quick-block/fallback-menu lifecycle scheduling optimization.
Further lifecycle cleanup remains blocked until owner-level teardown, route,
native-overlay, fullscreen, and metric proof exists.
```

Related artifacts:

- `docs/audit/FILTERTUBE_PAGE_RUNTIME_LIFECYCLE_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_OWNER_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_INSTANCE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_AUDIT_CONVERGENCE_2026-05-17.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.
