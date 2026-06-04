# FilterTube Shorts DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, Shorts
behavior patch, marker patch, JSON-first patch, or settings schema patch.

This slice follows the direct Shorts DOM cleanup path after JSON-first
`hideAllShorts` proof. It isolates how the DOM fallback currently discovers
Shorts shelves, guide entries, mobile navigation entries, disguised normal
cards, Shorts cards, card targets, marker restore conditions, stale cleanup,
disabled cleanup, and empty Shorts shelf cleanup.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
Shorts DOM cleanup boundary source files: 1
Shorts DOM cleanup boundary source/effect blocks: 12
runtime Shorts DOM cleanup fixtures: 9
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 18
disabled cleanup branch bytes: 791
Shorts collection block lines: 29
Shorts collection block bytes: 1651
Shorts container toggle block lines: 22
Shorts container toggle block bytes: 1165
disguised Shorts detection block lines: 29
disguised Shorts detection block bytes: 1409
Shorts selector/extract block lines: 54
Shorts selector/extract block bytes: 2084
Shorts card decision block lines: 141
Shorts card decision block bytes: 7008
container cleanup block lines: 91
container cleanup block bytes: 5464
home Shorts shelf cleanup block lines: 24
home Shorts shelf cleanup block bytes: 1638
search Shorts shelf cleanup block lines: 18
search Shorts shelf cleanup block bytes: 1234
Shorts collection querySelectorAll callsites: 3
Shorts collection mobile nav selector tokens: 6
Shorts collection closest callsites: 2
Shorts container marker references: 3
Shorts container marker write callsites: 1
Shorts container marker removal callsites: 1
Shorts container ignore-empty writes: 1
Shorts container shelf-title guard references: 1
Shorts container hide toggle callsites: 1
Shorts container restore toggle callsites: 1
disguised detection querySelectorAll callsites: 1
disguised detection data-short marker references: 2
disguised detection shorts href references: 3
disguised detection play-short predicates: 1
disguised detection overlay SHORTS predicates: 1
Shorts selector data-short references: 4
Shorts extractor directAttrs references: 2
Shorts extractor href-regex callsites: 3
Shorts extractor getAttributeNames references: 2
Shorts card querySelectorAll callsites: 1
Shorts card rich-item closest callsites: 1
Shorts card grid-shelf closest callsites: 1
Shorts card hideAllShorts references: 3
Shorts card keyword marker write callsites: 1
Shorts card keyword marker removal callsites: 1
Shorts card final toggle callsites: 1
Shorts card videoChannelMap references: 5
home Shorts shelf marker references: 1
home Shorts shelf Empty Shorts shelf decisions: 1
search Shorts shelf Empty Shorts shelf decisions: 1
clear-stale cleanup hide-all-Shorts marker references: 2
disabled cleanup hide-all-Shorts marker references: 0
product runtime hide-all-Shorts marker references: 15
product runtime data-filtertube-short references: 8
product runtime shelf-title marker references: 4
product runtime hideAllShorts tokens: 8
product runtime hideShorts tokens: 1
product runtime toggleVisibility callsites: 55
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| Collection | The Shorts DOM path gathers Shorts shelves, desktop guide entries, and mobile nav entries before checking `hideAllShorts`. | Navigation, shelf, and content containers share one marker and one restore path. |
| Container hide | When `hideAllShorts` is true, every collected Shorts element gets `data-filtertube-hidden-by-hide-all-shorts`, loses `data-filtertube-ignore-empty-hide`, and is hidden through `toggleVisibility(..., true, ..., true)`. | Container hides bypass per-card source confidence and can hide navigation entries as well as content shelves. |
| Container restore | When the setting is false, collected elements with the marker remove the marker, set `data-filtertube-ignore-empty-hide`, remove `filtertube-hidden-shelf`, and restore only if not also hidden by shelf-title. | Restore is conditional on the current collection still finding the element and the shelf-title marker being absent. |
| Disguised detection | Normal video cards are stamped with `data-filtertube-short` when they have Shorts href, `play short` aria text, or `SHORTS` overlay evidence. | Display evidence turns ordinary card selectors into Shorts selectors without a separate confidence report. |
| Card target selection | Shorts cards promote the hide target to `ytd-rich-item-renderer` first, then `.ytGridShelfViewModelGridShelfItem`, before falling back to the card itself. | A card-level decision can hide a parent layout cell, not only the renderer carrying Shorts evidence. |
| Video-id join | Shorts cards without channel identity can use `videoChannelMap` after extracting a Shorts video id from attributes or links. | Video-id joins are behaviorally different from visible DOM author evidence. |
| Shelf cleanup | Home and search Shorts shelves can be hidden as `Empty Shorts shelf` when all detected child items are hidden and the global marker is not set. | Shelf cleanup can hide a container after per-card filtering without a shared shelf decision report. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` includes the hide-all-Shorts marker today. | This marker has better stale cleanup coverage than other feature-local DOM markers, but still lacks a feature-level restore proof. |
| Disabled cleanup | Disabled-state cleanup does not directly name `data-filtertube-hidden-by-hide-all-shorts`. | Disabled restore depends on generic hidden selectors and shared toggle behavior. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Container/nav collection hides Shorts shelves, guide entries, and mobile nav
   entries while preserving safe mobile nav candidates.
4. Toggle-off restore removes the hide-all-Shorts marker and restores collected
   elements unless `data-filtertube-hidden-by-shelf-title` is still present.
5. Disguised normal video cards are stamped by Shorts href, `play short`, and
   `SHORTS` overlay evidence while safe cards remain unmarked.
6. `extractShortsVideoId()` accepts direct video id attributes, Shorts href
   anchors, generic Shorts URL attributes, and fallback anchors.
7. Shorts card processing promotes the target to the rich item parent and hides
   it with reason `Hide All Shorts`.
8. When global Shorts hiding is off, nonmatching keyword checks remove the
   keyword marker and can use `videoChannelMap` evidence.
9. Source proof records the home/search empty Shorts shelf cleanup paths plus
   stale and disabled cleanup marker asymmetry.

## Risk Interpretation

- Reliability: global Shorts hiding spans route navigation, shelves, normal-card
  disguises, Shorts renderers, and empty shelf cleanup.
- False-hide/leak: visible Shorts hints can promote ordinary card selectors into
  Shorts decisions, while restore depends on recollection and marker state.
- Performance: a single global setting can run broad shelf/nav queries, normal
  card disguise detection, Shorts card loops, video-id extraction, map lookups,
  and empty shelf checks.
- Code burden: settings aliases, JSON decisions, DOM collection, target
  promotion, video-id joins, container cleanup, and marker restore remain split.

## Non-Completion Boundary

This does not close Shorts DOM cleanup. Product runtime source still lacks a
DOM cleanup contract, selector policy, target-shape report, route policy,
mobile navigation report, disguised Shorts policy, video-id join decision,
shelf cleanup decision, shared restore owner, stale cleanup budget,
disabled-state restore proof, metric artifact, CSS/direct-writer parity report,
JSON/DOM parity gate, and explicit DOM-only policy. The following symbols are
intentionally absent from product runtime source today:

```text
shortsDomCleanupBoundaryContract
shortsDomCleanupDecisionReport
shortsDomCleanupRestoreProof
shortsDomCleanupSelectorPolicy
shortsDomCleanupTargetShapeReport
shortsDomCleanupRoutePolicy
shortsDomCleanupMobileNavReport
shortsDomCleanupDisguisedPolicy
shortsDomCleanupVideoIdJoinDecision
shortsDomCleanupShelfDecisionReport
shortsDomCleanupStaleCleanupBudget
shortsDomCleanupDisabledRestoreProof
shortsDomCleanupMetricArtifact
shortsDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/shorts-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
