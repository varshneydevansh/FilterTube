# FilterTube Comments DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, comments
behavior patch, marker patch, JSON-first patch, or settings schema patch.

This slice follows the visible comments DOM cleanup path after JSON-first
`hideAllComments` proof. It isolates how `ensureContentControlStyles()`,
`collectMobileCommentEntryCards()`, `handleCommentsFallback()`, no-active
cleanup, and disabled cleanup currently treat desktop comment containers,
classic comment threads, mobile comment entry cards, whitelist restore, and the
`data-filtertube-mobile-comments-card` marker.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

## Boundary Counts

```text
comments DOM cleanup boundary source files: 1
comments DOM cleanup boundary source/effect blocks: 10
runtime comments DOM cleanup fixtures: 9
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
comments CSS block lines: 16
comments CSS block bytes: 671
collectMobileCommentEntryCards block lines: 30
collectMobileCommentEntryCards block bytes: 1386
comments global hide block lines: 42
comments global hide block bytes: 1934
comments restore/input block lines: 17
comments restore/input block bytes: 781
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
comments fallback callsite block lines: 1
comments fallback callsite block bytes: 46
comments CSS rules.push callsites: 1
comments CSS display-none declarations: 1
comments CSS mobile-card marker references: 1
comments CSS mobile ytm selector tokens: 4
mobile collector querySelectorAll callsites: 1
mobile collector marker references: 1
mobile collector watch-route guard callsites: 1
mobile collector comments regex callsites: 1
mobile collector closest callsites: 1
comments global querySelectorAll callsites: 4
comments global mobile collector callsites: 1
comments global container hide toggle callsites: 1
comments global thread hide toggle callsites: 1
comments global mobile marker write callsites: 1
comments global mobile hide toggle callsites: 1
comments restore marker references: 2
comments restore marker removal callsites: 1
comments restore mobile toggle callsites: 1
active key hideAllComments references: 1
active key hideComments references: 1
active key filterComments references: 1
no-active cleanup clearStale callsites: 1
clear-stale cleanup comments mobile marker references: 0
disabled cleanup comments mobile marker references: 0
comments fallback invocation callsites: 1
product runtime comments mobile marker references: 5
product runtime hideAllComments tokens: 3
product runtime toggleVisibility callsites: 55
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| CSS selectors | `ensureContentControlStyles()` emits a `hideAllComments` rule group for desktop containers, mobile entry points, and route-watch mobile comment markers. | CSS can hide comment surfaces before a shared comment target report exists. |
| Mobile collector | `collectMobileCommentEntryCards()` runs only on `/watch`, queries mobile comment entry candidates plus already marked cards, requires comment-looking label/text, and promotes to the nearest mobile comment container. | A previously marked mobile card with changed or missing comment text is not collected for local restore. |
| Global comments hide | `handleCommentsFallback()` queries containers, threads, reply renderers, view-model renderers, and mobile cards before the global branch. When `hideAllComments` is true, it hides containers, hides classic threads, marks mobile cards, hides those cards, and returns before per-reply or view-model filtering. | Global hide can rely on broad container/thread/card hides while reply/view-model behavior is governed by whether the global branch returned. |
| Toggle-off restore | When global hiding is false, comment containers are restored and collected mobile cards with `data-filtertube-mobile-comments-card="true"` have that marker removed before restore. | Marker restore depends on the mobile collector still classifying the card as comments. |
| Whitelist restore | In whitelist mode, containers and the composer are restored before normal comment filtering continues. | Whitelist restoration is local to comments and does not prove a shared comments mode policy. |
| No-active cleanup | The no-active branch can call `clearStaleDOMFallbackVisibility()` before the style writer and comments helper run. | Cleanup can restore generic hidden state without naming the mobile comments marker. |
| Disabled cleanup | Disabled-state cleanup scans generic hidden markers, pending markers, and the all-Shorts marker. | Disabled restore does not directly remove the mobile comments marker. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. The mobile comments collector runs only on `/watch`, promotes comment-looking
   candidates to their closest mobile comment container, and ignores safe
   candidates.
4. `hideAllComments` hides desktop containers, classic threads, and collected
   mobile cards while writing `data-filtertube-mobile-comments-card`.
5. The global branch returns before reply renderers and modern comment
   view-model renderers are toggled.
6. Toggle-off restore removes the mobile marker only from collected cards.
7. A marker-only mobile card without comment-looking text is skipped by the
   local restore path.
8. Whitelist mode locally restores containers and the composer before normal
   comment processing continues.
9. Stale cleanup and disabled cleanup omit the mobile comments marker.

## Risk Interpretation

- Reliability: comment visibility is split across CSS, direct container/thread
  toggles, mobile marker toggles, whitelist local restore, and JSON comment
  renderer behavior.
- False-hide/leak: a marker-only mobile comment card can keep
  `data-filtertube-mobile-comments-card` after the setting is off if it no
  longer looks like a comment card to the collector.
- Performance: the comments fallback queries containers, threads, renderers,
  view models, and mobile entry cards before deciding whether global hide can
  return early.
- Code burden: JSON comments, seed comment continuation rewriting, DOM comment
  selectors, mobile markers, and whitelist/comment keyword behavior still live
  in separate owners.

## Non-Completion Boundary

This does not close comments DOM cleanup. Product runtime source still lacks a
DOM cleanup contract, selector policy, target-shape report, route policy,
mobile marker report, shared restore owner, stale cleanup budget,
disabled-state restore proof, whitelist-mode comments policy, metric artifact,
CSS/direct-writer parity report, JSON/DOM parity gate, and explicit DOM-only
policy. The following symbols are intentionally absent from product runtime
source today:

```text
commentsDomCleanupBoundaryContract
commentsDomCleanupDecisionReport
commentsDomCleanupRestoreProof
commentsDomCleanupSelectorPolicy
commentsDomCleanupMarkerReport
commentsDomCleanupRoutePolicy
commentsDomCleanupMobileParityReport
commentsDomCleanupWhitelistPolicy
commentsDomCleanupStaleCleanupBudget
commentsDomCleanupDisabledRestoreProof
commentsDomCleanupMetricArtifact
commentsDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/comments-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
