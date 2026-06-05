# FilterTube Tab View Lifecycle Selector Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. This is not an implementation patch.

This slice narrows the broad lifecycle and DOM-selector audit to the largest extension UI hot file: `js/tab-view.js`, with `html/tab-view.html` as the static host markup boundary. It does not prove that any listener, timer, selector, or settings UI can be optimized yet. It records the current direct facts that an implementation must preserve or explicitly replace later.

## Source Boundary

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/tab-view.js` | 14702 | 684139 | `6ffc4f25bb294dfc7cc95a445611f8d31c9ee507bbc7facbcce7d03cb1ad304c` |
| `html/tab-view.html` | 1577 | 133585 | `e33ef1e0d1f2c3d607cb58c3275137df54c1c82ed06cf5cd03c053690fedb0b6` |

The runtime proof is `tests/runtime/tab-view-lifecycle-selector-boundary-current-behavior.test.mjs`.

## Current Lifecycle Primitive Totals

The `js/tab-view.js` hot file currently contains 180 lifecycle primitives:

| Primitive | Count |
| --- | ---: |
| `.addEventListener(` | 147 |
| `.removeEventListener(` | 0 |
| `MutationObserver` | 0 |
| `IntersectionObserver` | 0 |
| `setInterval(` | 1 |
| `clearInterval(` | 1 |
| `setTimeout(` | 14 |
| `clearTimeout(` | 4 |
| `requestAnimationFrame(` | 11 |
| `cancelAnimationFrame(` | 2 |

Additional listener-like surfaces in the same file:

| Surface | Count |
| --- | ---: |
| `runtime.onMessage.addListener(` | 1 |
| `window.addEventListener(` | 5 |
| `document.addEventListener(` | 2 |
| `StateManager.subscribe(` | 3 |

Current interpretation: tab-view has no local `MutationObserver` or `IntersectionObserver`, but it is still the largest lifecycle hot file because it binds UI listeners, debounced settings saves, modal handlers, dashboard rotation, subscription-import progress, hash/popstate navigation, profile dropdown positioning, and quick action focus timers.

## Current DOM Selector Boundary

| Selector family | Count |
| --- | ---: |
| `document.getElementById("...")` tokens | 234 |
| Unique `getElementById` literal ids | 175 |
| Static `id="..."` tokens in `html/tab-view.html` | 100 |
| Unique static HTML ids | 100 |
| JS literal ids not present as static HTML ids | 85 |
| Static HTML ids not directly reached by JS `getElementById` literals | 10 |
| `.querySelector(` tokens | 30 |
| `.querySelectorAll(` tokens | 27 |

The 85 JS literal ids not present as static HTML ids are current behavior, not automatically bugs. Many are created by render helpers or component builders. The audit risk is that static HTML alone cannot prove selector coverage, listener attachment, or settings field existence. Future cleanup needs a generated/owned DOM-id report that distinguishes static ids, dynamically rendered ids, optional controls, and stale selector literals.

Current static HTML ids not directly reached through `document.getElementById(...)` are:

```text
dashboardAppsTitle
dashboardView
donateView
filtersView
kidsView
semanticView
settingsView
syncView
tabViewShellDecor
viewContainer
```

## Selected Source/Effect Blocks

These blocks overlap intentionally. They pin the current hotspots that matter before any lifecycle or selector optimization.

| Block | Lines | Bytes | Key current facts |
| --- | ---: | ---: | --- |
| responsive nav lifecycle | 32 | 893 | 3 listener installs and 3 static id lookups; uses `navToggle.dataset.ftNavBound` as a local idempotence guard. |
| main video filter debounce | 12 | 379 | 1 `clearTimeout` and 1 `setTimeout` around `saveVideoFilters(options)`. |
| kids category debounce | 12 | 383 | 1 `clearTimeout` and 1 `setTimeout` around `saveKidsCategoryFilters(options)`. |
| kids video filter debounce | 12 | 345 | 1 `clearTimeout` and 1 `setTimeout` around `saveKidsVideoFilters(options)`. |
| profile dropdown lifecycle | 137 | 5150 | 3 `requestAnimationFrame`, 2 `cancelAnimationFrame`, 1 query selector, fixed-position dropdown layout, and local close behavior. |
| choice modal lifecycle | 103 | 3728 | 4 listener installs and 1 animation frame for dynamically created modal buttons and overlay/keyboard close behavior. |
| dashboard stats rotation | 42 | 1513 | 1 `clearInterval` and 1 `setInterval` at 2500 ms, gated by Main/Kids data and user override state. |
| dashboard stats listeners | 60 | 2643 | 2 guarded click listeners and 7 id lookups for dashboard stats controls. |
| subscription import listener/action cluster | 47 | 1687 | 1 runtime message listener, 2 DOM listeners, request id/source tab filtering, and retry/enable-whitelist actions. |
| quick action and navigation listeners | 41 | 1647 | 6 listener installs, 3 focus timers, 2 id lookups, and 6 query selectors. |
| navigation setup listeners | 23 | 850 | 1 nav-item click listener template, 3 id lookups, 1 query selector, and 2 querySelectorAll calls. |
| DOMContentLoaded bootstrap | 8740 | 398152 | 111 listener installs, 8 `setTimeout`, 1 interval/clear pair, 6 animation frames, 2 frame cancels, 130 id lookups, 13 query selectors, 6 querySelectorAll calls, and 1 runtime message listener. |

## Current Behavior Pinned

- Responsive navigation uses a data-attribute guard (`ftNavBound`) before installing listeners, but it has no remove path.
- Main and Kids video filter saves debounce writes through local timers.
- Dashboard stats rotation is the only interval in `js/tab-view.js`; it clears the prior interval before scheduling the next 2500 ms rotation.
- Dashboard stats buttons use per-element `__filtertubeBound` guards before adding click listeners.
- Subscription import progress is received through one runtime message listener and filtered by action, in-progress state, request id, and source tab id.
- Hash and popstate navigation listeners are added at the end of the `DOMContentLoaded` bootstrap.
- Three `StateManager.subscribe(...)` callbacks are installed in `js/tab-view.js` today.
- The `DOMContentLoaded` body is very large, so selector ownership, listener ownership, and settings mutation ownership are coupled in one page bootstrap.
- Static HTML ids are not enough to validate tab-view selectors because many JS id literals are dynamic-render ids.

## Reliability, False-Hide/Leak, Performance, And Code-Burden Risks

| Risk | Current proof | Why it remains open |
| --- | --- | --- |
| Listener lifetime is mostly page lifetime. | 147 listener installs and 0 removeEventListener callsites in `js/tab-view.js`. | Tab-view is an extension page, but duplicate bootstrap, dynamic rerender, modal, and dropdown listeners still need owner/idempotence reports before listener changes. |
| Selector coverage is split between static and dynamic DOM. | 175 unique JS id literals versus 100 static HTML ids, with 85 JS ids absent from static HTML. | A static HTML check cannot prove whether a missing id is dynamically generated, optional, stale, or dead. |
| Settings save timers are local and unreported. | Main video, Kids category, and Kids video filters each clear and replace their own timer. | Future optimization needs save-reason, settings-key, dirty-field, and profile/list-mode reports before merging timers. |
| Dashboard stats has local rotation ownership. | One interval/clear pair and `__filtertubeBound` button guards. | No dashboard metric artifact proves cost, hidden-tab behavior, or render-frequency budget. |
| Runtime progress listener is tab-view local. | One subscription import progress listener is installed during bootstrap. | It has request filtering, but no listener registry, detach policy, or tab-close/duplicate-bootstrap proof. |
| Large bootstrap raises code-burden risk. | The `DOMContentLoaded` block is 8740 lines and 398152 bytes. | The bootstrap mixes selector binding, state loading, listener install, profile/Nanah/import setup, stats, navigation, and release-note loading. |

## Missing Future Authority

No product source currently defines:

- `tabViewLifecycleSelectorBoundaryContract`
- `tabViewLifecycleDecisionReport`
- `tabViewSelectorAuthorityReport`
- `tabViewDynamicIdProvenanceReport`
- `tabViewStaticIdParityReport`
- `tabViewListenerOwnerReport`
- `tabViewTimerBudgetReport`
- `tabViewRuntimeMessageListenerPolicy`
- `tabViewBootstrapSplitReport`
- `tabViewSettingsSaveTimerReport`
- `tabViewDashboardRotationMetricArtifact`
- `tabViewLifecycleFixtureProvenance`

## Current Verdict

```text
Completion is not proven.
The tab-view lifecycle/selector boundary is current-behavior proof only.
It moves the audit closer to every DOM selector and every runtime listener/timer,
but it does not authorize optimizing, merging, or deleting tab-view lifecycle work.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6166
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6166
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
