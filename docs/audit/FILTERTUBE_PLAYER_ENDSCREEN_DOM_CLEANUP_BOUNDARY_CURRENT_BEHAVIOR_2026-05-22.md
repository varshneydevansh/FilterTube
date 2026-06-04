# FilterTube Player Endscreen DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, player behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideEndscreenVideowall`,
`hideEndscreenCards`, `disableAutoplay`, and `disableAnnotations` proofs and
isolates their shared player/end-screen DOM style cleanup boundary in
`js/content/dom_fallback.js`. Today these controls are CSS-owned in the shared
content-control style node, but their active-work semantics are not uniform:
`hideEndscreenVideowall` and `hideEndscreenCards` are DOM fallback active-work
keys, while `disableAutoplay` and `disableAnnotations` are style branches that
do not independently keep the blocklist DOM fallback path active.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
player/end-screen DOM cleanup boundary source files: 1
player/end-screen DOM cleanup source/effect blocks: 9
runtime player/end-screen DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 459
ensureContentControlStyles block bytes: 16337
player/end-screen CSS group block lines: 34
player/end-screen CSS group block bytes: 856
endscreen videowall CSS block lines: 8
endscreen videowall CSS block bytes: 253
endscreen cards CSS block lines: 7
endscreen cards CSS block bytes: 177
disable autoplay CSS block lines: 8
disable autoplay CSS block bytes: 235
disable annotations CSS block lines: 8
disable annotations CSS block bytes: 185
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 18
disabled cleanup branch bytes: 791
player/end-screen CSS group rules.push callsites: 4
player/end-screen CSS group display-none declarations: 4
player/end-screen CSS group selector rows: 7
ensureContentControlStyles hideEndscreenVideowall references: 1
ensureContentControlStyles hideEndscreenCards references: 1
ensureContentControlStyles disableAutoplay references: 1
ensureContentControlStyles disableAnnotations references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback hideEndscreenVideowall references: 1
active DOM fallback hideEndscreenCards references: 1
active DOM fallback disableAutoplay references: 0
active DOM fallback disableAnnotations references: 0
clear-stale cleanup player/end-screen flag references: 0
disabled cleanup player/end-screen flag references: 0
product runtime player/end-screen feature marker references: 0
DOM fallback source hideEndscreenVideowall tokens: 2
DOM fallback source hideEndscreenCards tokens: 2
DOM fallback source disableAutoplay tokens: 1
DOM fallback source disableAnnotations tokens: 1
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| Endscreen videowall | `settings.hideEndscreenVideowall` emits player end-screen content and fullscreen-grid still selectors. | Broad player overlay hiding is style-owned, not a JSON end-screen renderer or target-shape decision. |
| Endscreen cards | `settings.hideEndscreenCards` emits the player card overlay selector. | Card overlay hiding is independent from JSON `endScreenVideoRenderer` handling. |
| Autoplay | `settings.disableAutoplay` emits autonav toggle and autonav endscreen selectors, but it is absent from the blocklist DOM active-work key list. | Autoplay CSS can be skipped by ordinary blocklist no-active short-circuit unless another active fallback reason reaches the style writer. |
| Annotations | `settings.disableAnnotations` emits annotation and branding overlay selectors, but it is absent from the blocklist DOM active-work key list. | Annotation CSS has the same no-active short-circuit risk as autoplay CSS. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is full shared style regeneration or stale-style blanking, not per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Player/end-screen style refresh also triggers unrelated mobile app-shell cleanup work. |
| Active work | Only the two `hideEndscreen*` flags keep DOM fallback active in blocklist mode. | Player controls have split active-work semantics despite adjacent UI/catalog grouping. |
| Stale cleanup | Stale cleanup has no player/end-screen flag or player/end-screen feature marker reference. | There is no feature-local stale cleanup budget for these CSS-only effects. |
| Disabled cleanup | Disabled cleanup has no player/end-screen flag or player/end-screen feature marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling all four controls emits the seven current player/end-screen
   selector rows into the shared style node and still runs Open App cleanup.
4. Direct style-writer execution can emit `disableAutoplay` and
   `disableAnnotations` selectors, while `hasActiveDOMFallbackWork()` returns
   false for those flags alone in blocklist mode.
5. Style regeneration removes player/end-screen selector rows when the four
   settings are absent.
6. Product runtime source has no player/end-screen feature marker or future
   player/end-screen DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the adjacent player controls are not equivalent in the active
  DOM fallback gate, so style output depends on both settings and call path.
- False-hide/leak: JSON end-screen rows and player overlays are governed by
  separate mechanisms, and the CSS-only branches have no target-shape report.
- Performance: any active style-writer pass rewrites the shared style node and
  runs Open App cleanup, while player-only disable flags may be skipped until
  another fallback reason runs.
- Code burden: UI/catalog controls, JSON-first omissions, CSS selectors,
  active-work keys, stale cleanup, disabled cleanup, and app-shell cleanup
  coupling remain split.

## Non-Completion Boundary

This does not close player/end-screen DOM cleanup. Product runtime source still
lacks a DOM cleanup contract, decision report, style selector policy,
target-shape report, active-work policy, autoplay policy, annotation policy,
restore proof, stale cleanup budget, disabled-state restore proof, metric
artifact, and JSON/DOM parity gate. The following symbols are intentionally
absent from product runtime source today:

```text
playerEndscreenDomCleanupBoundaryContract
playerEndscreenDomCleanupDecisionReport
playerEndscreenDomCleanupStyleSelectorPolicy
playerEndscreenDomCleanupTargetShapeReport
playerEndscreenDomCleanupActiveWorkPolicy
playerEndscreenDomCleanupAutoplayPolicy
playerEndscreenDomCleanupAnnotationPolicy
playerEndscreenDomCleanupRestoreProof
playerEndscreenDomCleanupStaleCleanupBudget
playerEndscreenDomCleanupDisabledRestoreProof
playerEndscreenDomCleanupMetricArtifact
playerEndscreenDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/player-endscreen-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
