# FilterTube Home Feed DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, selector
patch, cleanup patch, route patch, restore patch, home-feed behavior patch, DOM
fallback patch, JSON filter patch, or settings patch.

This slice pins the DOM-owned cleanup boundary for `hideHomeFeed` in
`js/content/dom_fallback.js`. The JSON-first home-feed slice proves the setting
does not have a first-class JSON hide decision today. This slice proves the DOM
route marker and cleanup behavior currently split across CSS selectors,
`handleHomeFeedFallback()`, the DOM active-work gate, the no-active cleanup
branch, stale cleanup, disabled cleanup, and the fallback invocation point.

## Boundary Source Files

home-feed DOM cleanup boundary source files: 1

home-feed DOM cleanup boundary source/effect blocks: 8

runtime home-feed DOM cleanup fixtures: 8

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Pinned Source Counts

ensureContentControlStyles block lines: 459

ensureContentControlStyles block bytes: 16337

home-feed CSS block lines: 12

home-feed CSS block bytes: 622

home-feed fallback block lines: 23

home-feed fallback block bytes: 1286

active DOM fallback work block lines: 68

active DOM fallback work block bytes: 2333

no-active cleanup branch lines: 14

no-active cleanup branch bytes: 629

clearStaleDOMFallbackVisibility block lines: 33

clearStaleDOMFallbackVisibility block bytes: 1412

disabled cleanup branch lines: 18

disabled cleanup branch bytes: 791

home-feed fallback callsite block lines: 1

home-feed fallback callsite block bytes: 46

home CSS `rules.push` callsites: 1

home CSS display-none declarations: 1

home CSS desktop browse selectors: 2

home CSS route-home attribute selectors: 4

home CSS mobile browse selectors: 4

home CSS mobile rich-grid selectors: 1

home CSS mobile rich-section selectors: 1

home CSS mobile item-section selectors: 1

home CSS mobile section-list selectors: 1

home fallback pathname references: 1

home fallback `isHomeRoute` references: 2

home fallback querySelectorAll callsites: 1

home fallback marker references: 4

home fallback marker write callsites: 1

home fallback marker removal callsites: 1

home fallback hide toggle callsites: 1

home fallback restore toggle callsites: 1

active DOM fallback `hideHomeFeed` key entries: 1

no-active cleanup clearStale callsites: 1

no-active cleanup 5000 ms throttle literals: 1

clear-stale cleanup home-feed marker references: 0

clear-stale cleanup hide-all-shorts marker references: 2

disabled cleanup home-feed marker references: 0

disabled cleanup generic hidden selector references: 1

home-feed fallback invocation callsites: 1

product runtime `hideHomeFeed` tokens: 3

product runtime route-home tokens: 9

product runtime home-feed marker references: 4

product runtime `toggleVisibility(` callsites: 55

## Current Boundary Matrix

| Boundary | Current behavior | Reliability / optimization boundary |
| --- | --- | --- |
| Home CSS | `hideHomeFeed` emits desktop `ytd-browse[page-subtype="home"]` selectors and mobile selectors gated by `html[data-filtertube-route-home="true"]`. | CSS route scope depends on DOM route attributes, not a shared home-route decision report. |
| Direct fallback scan | `handleHomeFeedFallback()` scans desktop home selectors, mobile route-home selectors, and already-marked `data-filtertube-hidden-by-hide-home-feed` nodes. | The same selector list handles both newly matched home containers and previously marked stale nodes. |
| Route condition | The direct fallback hides only when `settings.hideHomeFeed` is true and `document.location.pathname === "/"`. | Home route scope is pathname-only inside this helper. |
| Marker write | Matching elements receive `data-filtertube-hidden-by-hide-home-feed="true"` before `toggleVisibility(element, true, "Hide Home Feed", true)`. | The specialized marker and generic hidden state are split between the helper and `toggleVisibility()`. |
| Local restore | Marked elements are restored by the helper when the setting is false or the pathname is not `/`. | Restore depends on the helper running again after route/settings changes. |
| Active-work gate | `hideHomeFeed` is one of the boolean keys that keeps DOM fallback work active. | Route-scoped style synchronization runs before the no-active branch, but the ordinary no-active branch can still return before the home helper runs. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` clears generic hidden state and hide-all-shorts markers but has no home-feed marker reference. | Generic stale cleanup does not remove `data-filtertube-hidden-by-hide-home-feed`. |
| Disabled cleanup | Disabled mode clears the style node and generic hidden/pending selectors but has no home-feed marker reference. | Disabled mode can restore display through generic hidden selection without removing the specialized home-feed marker. |
| JSON-first status | Home-feed hiding remains DOM-owned today. | First-class JSON promotion still needs route parity, marker restore proof, and JSON/DOM parity gates. |

## Runtime Proof

The runtime guard proves:

1. The source blocks and primitive counts above match current
   `js/content/dom_fallback.js`.
2. Home-feed CSS contains desktop home selectors and mobile route-home selectors
   under the `hideHomeFeed` branch.
3. Fake DOM execution hides queried home-feed targets on `/` when
   `hideHomeFeed` is true and writes `data-filtertube-hidden-by-hide-home-feed`.
4. Fake DOM execution leaves unmarked targets alone off `/` even when the
   setting is true.
5. Fake DOM execution restores previously marked targets off `/` by removing
   the specialized marker and calling the restore toggle.
6. The no-active branch can call stale cleanup before the style writer and home
   helper run.
7. Stale cleanup and disabled cleanup currently omit the specialized
   home-feed marker.

## Non-Completion Boundary

Home-feed DOM cleanup still needs a DOM cleanup contract, selector policy,
target-shape report, route policy, mobile parity report, sibling-visible
fixture, shared restore owner, stale cleanup budget, disabled-state restore
proof, metric artifact, CSS/direct-writer parity report, JSON/DOM parity gate,
and explicit DOM-only policy before route cleanup, restore cleanup, no-work
optimization, or first-class JSON promotion can proceed.

No `homeFeedDomCleanupBoundaryContract`,
`homeFeedDomCleanupDecisionReport`, `homeFeedDomCleanupRestoreProof`,
`homeFeedDomCleanupSelectorPolicy`, `homeFeedDomCleanupMarkerReport`,
`homeFeedDomCleanupRoutePolicy`, `homeFeedDomCleanupMobileParityReport`,
`homeFeedDomCleanupStaleCleanupBudget`,
`homeFeedDomCleanupDisabledRestoreProof`,
`homeFeedDomCleanupMetricArtifact`, or
`homeFeedDomCleanupJsonParityGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
