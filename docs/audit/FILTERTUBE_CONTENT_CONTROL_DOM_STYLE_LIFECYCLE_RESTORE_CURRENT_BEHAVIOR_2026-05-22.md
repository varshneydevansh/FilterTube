# FilterTube Content Control DOM Style Lifecycle Restore Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, style cleanup patch, selector patch, DOM fallback patch, JSON filter patch, or settings patch.

This slice pins the lifecycle and restore shape around the shared
`#filtertube-content-controls-style` node. The selector matrix already proves
which CSS selectors can be emitted. This slice proves when the style node is
created, reused, rewritten, blanked, skipped, and left to CSS regeneration
rather than per-element restore markers.

## Boundary Source Files

content-control DOM style lifecycle source files: 1

content-control DOM style lifecycle source/effect blocks: 6

runtime content-control DOM style lifecycle fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Pinned Source Counts

ensureContentControlStyles block lines: 345

ensureContentControlStyles block bytes: 12583

hasActiveDOMFallbackWork block lines: 68

hasActiveDOMFallbackWork block bytes: 2333

clearStaleDOMFallbackVisibility block lines: 33

clearStaleDOMFallbackVisibility block bytes: 1412

no-active cleanup branch lines: 14

no-active cleanup branch bytes: 629

style-writer callsite block lines: 6

style-writer callsite block bytes: 371

disabled cleanup branch lines: 21

disabled cleanup branch bytes: 959

style writer getElementById callsites: 1

style writer createElement('style') callsites: 1

style writer head append callsites: 1

style writer textContent assignment callsites: 1

style writer rules.push callsites: 26

style writer has no `rules.length` empty-state gate.

clear-stale cleanup style text blanking callsites: 1

clear-stale cleanup style node removal callsites: 0

disabled cleanup style text blanking callsites: 1

## Current Lifecycle Matrix

| Path | Current behavior | Reliability / optimization boundary |
| --- | --- | --- |
| Invalid settings or missing `document.head` | `ensureContentControlStyles()` returns before route attributes, CSS support checks, style creation, or open-app cleanup. | Callers cannot assume route attributes or the shared style node exist after an early call. |
| Active DOM fallback call | `applyDOMFallback()` calls `ensureStyles()` and then `ensureContentControlStyles(effectiveSettings)` after the no-active cleanup gate. | The style writer is downstream of the DOM active-work predicate, not an independent settings observer. |
| First active style call | The writer creates one `<style id="filtertube-content-controls-style">` node in `document.head`. | Style lifecycle is node-reuse based; no per-control style owner exists. |
| Later active style calls | The writer reuses the existing node and replaces `style.textContent` with `rules.join('\n')`. | Toggle-off restore is CSS regeneration, not per-element marker restore. |
| All catalog style toggles false while the writer runs | The writer still emits unconditional mobile open-app cleanup CSS. | There is no empty CSS state for an active writer pass; open-app cleanup remains coupled to content-control style lifecycle. |
| No active DOM fallback work | The no-active branch can run `clearStaleDOMFallbackVisibility()` only when `hadActiveWork`, `forceReprocess`, or a 5000 ms cleanup interval says cleanup is due, then returns before the style writer. | No-work optimization needs a cleanup budget because stale CSS cleanup is gated, not unconditional. |
| `enabled === false` ordinary settings | `hasActiveDOMFallbackWork()` returns false, so the ordinary path reaches the no-active cleanup gate before the later disabled cleanup block. | Disabled behavior is tied to no-active cleanup timing unless that early return is bypassed. |
| Disabled cleanup block | When reached, it blanks the style node and restores generic hidden/pending nodes, then returns. | This is not a separate style authority; it repeats the same text blanking pattern as stale cleanup. |
| Clear-stale cleanup | Clearing stale DOM fallback visibility empties the shared style node instead of removing it. | The node can persist with empty CSS and no lifecycle owner report. |
| Player-only style settings | `disableAutoplay` and `disableAnnotations` have style branches, but player-only `disableAutoplay` and `disableAnnotations` settings are not active DOM fallback work by themselves. | These controls need an explicit player DOM-only policy before style lifecycle optimization. |

## Current Behavior Boundaries

- The ordinary no-active branch can return before `ensureContentControlStyles()` runs.
- The shared style node is created lazily and reused; current cleanup blanks
  `textContent` rather than removing the node.
- Toggle-off behavior for CSS selectors is a whole-style rewrite. It does not
  produce per-element hide reason markers, sibling-visible evidence, stats
  side-effect records, or restore owner reports.
- Route attributes are refreshed only when `ensureContentControlStyles()` runs;
  no-active cleanup does not update `data-filtertube-route-home` or
  `data-filtertube-route-watch`.
- The unconditional mobile open-app cleanup CSS means a style-writer pass with
  no catalog style toggles still hides app-open links.
- The style lifecycle is not a first-class JSON filtering boundary. It can hide
  DOM surfaces that the JSON engine never decided to remove.

## Runtime Proof

The runtime guard proves:

1. The source blocks and primitive counts above match current
   `js/content/dom_fallback.js`.
2. A fake DOM execution creates one shared style node and reuses it across
   repeated writer calls.
3. A writer call with no catalog style toggles still writes mobile open-app
   cleanup CSS.
4. Toggling `hideHomeFeed` off rewrites CSS and drops the home-feed selectors
   while preserving open-app cleanup CSS.
5. Missing settings or missing `document.head` return before route attributes,
   support checks, style creation, and open-app cleanup.
6. The active-work gate returns false for `enabled === false`, `disableAutoplay`
   alone, and `disableAnnotations` alone, while true for `hideHomeFeed` and
   whitelist mode.
7. Clearing stale DOM fallback visibility blanks, but does not remove, the
   shared style node.
8. Runtime source still lacks a first-class style lifecycle and restore
   authority.

## Non-Completion Boundary

Content-control DOM style lifecycle still needs a node lifecycle report,
selector-owner restore proof, route-attribute update policy, no-active cleanup
budget, disabled cleanup budget, open-app cleanup policy, regeneration decision
report, metric artifact, JSON/DOM parity gate, and player DOM-only policy
before selector cleanup, style-node cleanup, no-work optimization, or
first-class JSON promotion can proceed.

No `contentControlStyleLifecycleRestoreMatrix`,
`contentControlStyleNodeLifecycleReport`,
`contentControlStyleRestoreProof`,
`contentControlStyleRouteAttributeReport`,
`contentControlStyleNoActiveCleanupBudget`,
`contentControlStyleDisabledCleanupBudget`,
`contentControlStyleOpenAppCleanupPolicy`,
`contentControlStyleRegenDecisionReport`,
`contentControlStyleNoWorkMetricArtifact`, or
`contentControlStyleJsonFirstParityGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
