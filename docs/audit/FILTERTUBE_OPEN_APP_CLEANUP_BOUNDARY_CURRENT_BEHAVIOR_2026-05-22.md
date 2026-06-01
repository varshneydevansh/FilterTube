# FilterTube Open App Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, selector
patch, cleanup patch, restore patch, mobile shell patch, DOM fallback patch,
JSON filter patch, or settings patch.

This slice pins the mobile Open App cleanup boundary in
`js/content/dom_fallback.js`. The style lifecycle slice proves that
`ensureContentControlStyles()` keeps unconditional Open App cleanup CSS on active
style-writer calls. This slice proves the separate direct DOM writer:
`hideYouTubeOpenAppButtons()` queries Open App candidates, classifies labels and
hrefs, writes inline `display:none!important`, marks
`data-filtertube-hidden-open-app`, and currently has no matching stale or
disabled restore owner.

## Boundary Source Files

open-app cleanup boundary source files: 1

open-app cleanup boundary source/effect blocks: 4

runtime open-app cleanup fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

## Pinned Source Counts

ensureContentControlStyles block lines: 345

ensureContentControlStyles block bytes: 12583

hideYouTubeOpenAppButtons block lines: 22

hideYouTubeOpenAppButtons block bytes: 961

clearStaleDOMFallbackVisibility block lines: 33

clearStaleDOMFallbackVisibility block bytes: 1412

disabled cleanup branch lines: 21

disabled cleanup branch bytes: 959

open-app direct querySelectorAll callsites: 1

open-app direct selector literal callsites: 1

open-app direct forEach callsites: 1

open-app direct getAttribute callsites: 2

open-app direct textContent fallback callsites: 1

open-app direct toLowerCase callsites: 2

open-app label `open app` predicate callsites: 1

open-app `intent://` predicate callsites: 1

open-app `youtube://` predicate callsites: 1

open-app `open_app` predicate callsites: 1

open-app Play Store predicate callsites: 1

open-app nearest `ytm-button-renderer` target-promotion callsites: 1

open-app inline `display:none!important` write callsites: 1

open-app marker write callsites: 1

open-app marker removal callsites: 0

open-app shared `toggleVisibility` callsites: 0

open-app swallowed catch blocks: 1

ensureContentControlStyles calls `hideYouTubeOpenAppButtons()`: 1

open-app CSS selector rows emitted by the style writer: 5

clear-stale cleanup open-app marker references: 0

disabled cleanup open-app marker references: 0

product runtime open-app marker references: 1

product runtime open-app marker removeAttribute callsites: 0

## Current Boundary Matrix

| Boundary | Current behavior | Reliability / optimization boundary |
| --- | --- | --- |
| Style CSS | `ensureContentControlStyles()` always pushes 5 Open App selector rows before setting `style.textContent`. | CSS cleanup is coupled to active content-control style lifecycle even when catalog toggles are otherwise false. |
| Direct candidate query | `hideYouTubeOpenAppButtons()` queries only `ytm-button-renderer a, a[href^="intent://"]`. | Non-`ytm-button-renderer` `youtube://`, `open_app`, and Play Store links are classified only if the selector query already returned them. |
| Label classification | Candidate anchors with an aria-label or text containing `open app` are hidden case-insensitively. | Label text is an effect trigger, not a JSON renderer decision. |
| Href classification | Candidate anchors hide when href starts with `intent://` or contains `youtube://`, `open_app`, or the Play Store YouTube app URL. | Href substring matching needs a route/surface and app-shell policy before selector cleanup can be optimized. |
| Target selection | If the anchor has a closest `ytm-button-renderer`, that wrapper is hidden; otherwise the anchor is hidden. | The visual target can be broader than the matched anchor, so sibling-visible proof is required before changes. |
| Direct write | The target receives inline `display:none!important` and `data-filtertube-hidden-open-app="true"`. | This bypasses shared `toggleVisibility()`, stats, media handling, and shared restore metadata. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` has no reference to `data-filtertube-hidden-open-app`. | A stale Open App marker is not generically restored by stale DOM fallback cleanup. |
| Disabled cleanup | The disabled cleanup branch has no reference to `data-filtertube-hidden-open-app`. | Turning filtering off does not prove this direct writer has a disabled-mode restore owner. |
| Error handling | The direct writer swallows its catch block. | Failures have no metric artifact, decision report, or visible diagnostics. |
| JSON-first status | The Open App cleanup is a DOM/app-shell cleanup, not a JSON row-filter decision. | It must stay outside first-class JSON filter promotion unless a route/surface DOM parity policy says otherwise. |

## Runtime Proof

The runtime guard proves:

1. The source blocks and primitive counts above match current
   `js/content/dom_fallback.js`.
2. The style writer emits exactly 5 Open App CSS selector rows and calls the
   direct cleanup once per active style-writer pass.
3. Fake DOM execution hides label, `intent://`, `youtube://`, `open_app`, and
   Play Store Open App candidates, while leaving a safe candidate untouched.
4. Wrapper targets are hidden when `closest('ytm-button-renderer')` succeeds;
   otherwise the anchor itself is hidden.
5. Query failures are swallowed by the current empty catch block.
6. Stale cleanup, disabled cleanup, and product runtime source contain no
   restore owner for `data-filtertube-hidden-open-app`.

## Non-Completion Boundary

Open App cleanup still needs an app-shell cleanup contract, selector policy,
target-shape report, route/surface policy, sibling-visible fixture, restore
owner, disabled-state restore proof, stale cleanup budget, error metric artifact,
CSS/direct-writer parity report, and JSON/DOM parity gate before selector
cleanup, restore cleanup, no-work optimization, or first-class JSON promotion can
proceed.

No `openAppCleanupBoundaryContract`, `openAppCleanupDecisionReport`,
`openAppCleanupRestoreProof`, `openAppCleanupSelectorPolicy`,
`openAppCleanupSettingsGate`, `openAppCleanupRoutePolicy`,
`openAppCleanupMetricArtifact`, `openAppCleanupShellVsContentPolicy`,
`openAppCleanupNoWorkBudget`, or `openAppCleanupJsonParityGate` exists in
product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Open App cleanup boundary can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
