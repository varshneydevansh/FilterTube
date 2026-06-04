# FilterTube Video Info DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, video info behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideVideoInfo`, `hideVideoButtonsBar`,
`hideAskButton`, `hideVideoChannelRow`, `hideVideoDescription`, and
`hideMerchTicketsOffers` proofs and isolates their shared direct DOM/style
cleanup boundary in `js/content/dom_fallback.js`. Today `hideVideoInfo` is a
master mode flag rather than a standalone selector branch: it becomes
`hideInfoMaster`, then fans out into five child style branches. Three child
branches are directly whitelist-gated; Ask and Merch/Tickets/Offers are not.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
video-info DOM cleanup boundary source files: 1
video-info DOM cleanup source/effect blocks: 11
runtime video-info DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
video-info mode group block lines: 49
video-info mode group block bytes: 1516
video-buttons-bar CSS block lines: 8
video-buttons-bar CSS block bytes: 263
ask-button CSS block lines: 8
ask-button CSS block bytes: 218
video-channel-row CSS block lines: 8
video-channel-row CSS block bytes: 280
video-description CSS block lines: 8
video-description CSS block bytes: 291
merch-tickets-offers CSS block lines: 10
merch-tickets-offers CSS block bytes: 274
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
video-info mode group rules.push callsites: 5
video-info mode group display-none declarations: 5
video-info mode group selector rows: 12
video-info mode group hideInfoMaster references: 6
video-info mode group listMode whitelist guards: 4
video-info mode group hideVideoInfo references: 1
video-info mode group hideVideoButtonsBar references: 1
video-info mode group hideAskButton references: 1
video-info mode group hideVideoChannelRow references: 1
video-info mode group hideVideoDescription references: 1
video-info mode group hideMerchTicketsOffers references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback video-info flag references: 6
clear-stale cleanup video-info flag references: 0
disabled cleanup video-info flag references: 0
product runtime video-info feature marker references: 0
product runtime hideVideoInfo tokens: 2
product runtime hideVideoButtonsBar tokens: 2
product runtime hideAskButton tokens: 2
product runtime hideVideoChannelRow tokens: 2
product runtime hideVideoDescription tokens: 2
product runtime hideMerchTicketsOffers tokens: 2
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| Master mode | `hideInfoMaster` is true only when `listMode !== 'whitelist'` and `settings.hideVideoInfo` is true. | `hideVideoInfo` semantics are cross-branch mode behavior, not one selector row or one JSON decision. |
| Buttons bar | Buttons bar selectors are emitted only when not in whitelist mode and either `hideInfoMaster` or `hideVideoButtonsBar` is true. | Explicit `hideVideoButtonsBar` is suppressed in whitelist mode. |
| Ask button | Ask selectors are emitted when `hideInfoMaster` or `hideAskButton` is true. | Explicit `hideAskButton` still hides in whitelist mode. |
| Channel row | Channel row selectors are emitted only when not in whitelist mode and either `hideInfoMaster` or `hideVideoChannelRow` is true. | Explicit `hideVideoChannelRow` is suppressed in whitelist mode. |
| Description | Description selectors are emitted only when not in whitelist mode and either `hideInfoMaster` or `hideVideoDescription` is true. | Explicit `hideVideoDescription` is suppressed in whitelist mode. |
| Merch/Tickets/Offers | Merch, tickets, offers, and clarify selectors are emitted when `hideInfoMaster` or `hideMerchTicketsOffers` is true. | Explicit `hideMerchTicketsOffers` still hides in whitelist mode. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is full shared style regeneration, not per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Video info style refresh also triggers unrelated mobile app-shell cleanup work. |
| Active work | `hasActiveDOMFallbackWork()` treats all six video-info flags as active DOM fallback work. | DOM fallback can stay active for flags that have no JSON decision. |
| Stale cleanup | Stale cleanup has no video-info flag or video-info feature marker reference. | There is no feature-local stale cleanup budget for these CSS-only effects. |
| Disabled cleanup | Disabled cleanup has no video-info flag or video-info feature marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling `hideVideoInfo` in blocklist mode emits all five child selector
   branches into the shared style node.
4. Enabling `hideVideoInfo` in whitelist mode emits no video-info child
   selectors because `hideInfoMaster` is false.
5. Explicit whitelist-mode child flags still emit Ask and Merch/Tickets/Offers
   selectors, while Buttons Bar, Channel Row, and Description remain
   suppressed by their direct whitelist guards.
6. Product runtime source has no video-info feature marker or future video-info
   DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the UI exposes six controls, while the DOM writer implements one
  master mode plus five child branches with inconsistent whitelist behavior.
- False-hide/leak: watch metadata JSON rows can leak before DOM styling applies,
  while explicit Ask and Merch/Tickets/Offers selectors can still hide in
  whitelist mode.
- Performance: any video-info flag keeps the broad DOM fallback style writer
  active and also runs Open App cleanup on each style-writer pass.
- Code burden: settings, JSON omission, DOM active work, master mode behavior,
  whitelist semantics, style regeneration, and app-shell cleanup coupling remain
  split.

## Non-Completion Boundary

This does not close video-info DOM cleanup. Product runtime source still lacks a
DOM cleanup contract, decision report, master-mode policy, style selector
policy, target-shape report, whitelist policy, restore proof, stale cleanup
budget, disabled-state restore proof, metric artifact, and JSON/DOM parity
gate. The following symbols are intentionally absent from product runtime source
today:

```text
videoInfoDomCleanupBoundaryContract
videoInfoDomCleanupDecisionReport
videoInfoDomCleanupMasterModePolicy
videoInfoDomCleanupStyleSelectorPolicy
videoInfoDomCleanupTargetShapeReport
videoInfoDomCleanupWhitelistPolicy
videoInfoDomCleanupRestoreProof
videoInfoDomCleanupStaleCleanupBudget
videoInfoDomCleanupDisabledRestoreProof
videoInfoDomCleanupMetricArtifact
videoInfoDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/video-info-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
