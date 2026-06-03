# FilterTube Sponsored Cards DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, sponsored-card behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideSponsoredCards` proof and isolates the
direct DOM/style cleanup boundary in `js/content/dom_fallback.js`. Today the
sponsored-card toggle is implemented as a content-control CSS branch: it emits
ad-surface selectors into the shared style node, relies on the style lifecycle
to rewrite the rule set, and does not write a feature-local DOM marker.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
sponsored-card DOM cleanup boundary source files: 1
sponsored-card DOM cleanup source/effect blocks: 6
runtime sponsored-card DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
sponsored-card CSS block lines: 15
sponsored-card CSS block bytes: 567
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
sponsored-card CSS rules.push callsites: 1
sponsored-card CSS display-none declarations: 1
sponsored-card CSS selector rows: 9
sponsored-card CSS ad-slot selector tokens: 1
sponsored-card CSS in-feed ad selector tokens: 1
sponsored-card CSS promoted selector tokens: 2
sponsored-card CSS search PYV selector tokens: 1
sponsored-card CSS display ad selector tokens: 1
sponsored-card CSS companion ad selector tokens: 1
sponsored-card CSS action companion ad selector tokens: 1
sponsored-card CSS engagement-panel ads selector tokens: 1
ensureContentControlStyles hideSponsoredCards references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback hideSponsoredCards references: 1
clear-stale cleanup hideSponsoredCards references: 0
disabled cleanup hideSponsoredCards references: 0
clear-stale cleanup sponsored-card marker references: 0
disabled cleanup sponsored-card marker references: 0
product runtime sponsored-card marker references: 0
product runtime hideSponsoredCards tokens: 2
product runtime ytd-ad-slot-renderer tokens: 1
product runtime ytd-in-feed-ad-layout-renderer tokens: 1
product runtime ytd-promoted selector tokens: 2
product runtime ytd-action-companion-ad-renderer tokens: 1
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| CSS branch | `settings.hideSponsoredCards` pushes one CSS rule block into the shared content-control style node. | Sponsored-card hiding is style-owned rather than a JSON renderer decision or marker-owned DOM decision. |
| Selector set | The branch hides ad slot, in-feed ad, promoted sparkles, search PYV, display ad, companion ad, action companion ad, and engagement-panel ad selectors. | Ad-surface ownership is encoded as selector text without a target-shape report. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is a full style regeneration effect, not a per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Sponsored-card style refresh also triggers unrelated mobile app-shell cleanup work. |
| List mode | The sponsored-card branch is not gated by whitelist mode. | Whitelist behavior requires explicit policy before changing selector or mode semantics. |
| `:has()` support | Sponsored selectors do not depend on the `supportsHasSelector` branch. | Browser support checks cannot be used as proof that sponsored selectors are disabled or scoped. |
| Active work | `hasActiveDOMFallbackWork()` treats `hideSponsoredCards` as active DOM fallback work. | This can keep DOM fallback active even though JSON active-work predicates omit the feature. |
| Stale cleanup | Stale cleanup has no `hideSponsoredCards` or sponsored marker reference. | There is no feature-local stale cleanup budget for this CSS-only effect. |
| Disabled cleanup | Disabled cleanup has no `hideSponsoredCards` or sponsored marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling `hideSponsoredCards` writes the current ad-surface selectors into
   the shared style node, sets route attributes, and calls the Open App cleanup.
4. Toggling the setting off reuses the shared style node and removes the
   sponsored-card selector rows while retaining unconditional Open App CSS.
5. Whitelist mode and unsupported `:has()` do not suppress the sponsored-card
   CSS branch when `hideSponsoredCards` is true.
6. Product runtime source has no sponsored-card feature marker or future
   sponsored-card DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the feature has settings and DOM active-work coverage, but no
  JSON decision, DOM marker, or per-node restore proof.
- False-hide/leak: JSON sponsored renderers can leak before DOM styling applies,
  while selector-only hiding can affect any matching surface without provenance.
- Performance: a sponsored-card toggle keeps the broad DOM fallback style writer
  active and also runs Open App cleanup on each style-writer pass.
- Code burden: settings, JSON omission, DOM active work, style regeneration,
  selector ownership, and app-shell cleanup coupling remain split.

## Non-Completion Boundary

This does not close sponsored-card DOM cleanup. Product runtime source still
lacks a DOM cleanup contract, decision report, style selector policy,
target-shape report, route policy, ad-surface report, restore proof, stale
cleanup budget, disabled-state restore proof, metric artifact, and JSON/DOM
parity gate. The following symbols are intentionally absent from product
runtime source today:

```text
sponsoredCardsDomCleanupBoundaryContract
sponsoredCardsDomCleanupDecisionReport
sponsoredCardsDomCleanupStyleSelectorPolicy
sponsoredCardsDomCleanupTargetShapeReport
sponsoredCardsDomCleanupRoutePolicy
sponsoredCardsDomCleanupAdSurfaceReport
sponsoredCardsDomCleanupRestoreProof
sponsoredCardsDomCleanupStaleCleanupBudget
sponsoredCardsDomCleanupDisabledRestoreProof
sponsoredCardsDomCleanupMetricArtifact
sponsoredCardsDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/sponsored-cards-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
