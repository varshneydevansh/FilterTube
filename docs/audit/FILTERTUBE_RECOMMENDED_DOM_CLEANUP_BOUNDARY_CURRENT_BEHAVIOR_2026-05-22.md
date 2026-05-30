# FilterTube Recommended DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, recommended-rail behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideRecommended` proof and isolates the
direct DOM/style cleanup boundary in `js/content/dom_fallback.js`. Today the
recommended-rail toggle is implemented as a content-control CSS branch: it emits
watch recommendation selectors into the shared style node, relies on the style
lifecycle to rewrite the rule set, and does not write a feature-local DOM
marker.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |

## Boundary Counts

```text
recommended DOM cleanup boundary source files: 1
recommended DOM cleanup source/effect blocks: 6
runtime recommended DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
recommended CSS block lines: 8
recommended CSS block bytes: 215
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
recommended CSS rules.push callsites: 1
recommended CSS display-none declarations: 1
recommended CSS selector rows: 2
recommended CSS #related selector tokens: 1
recommended CSS secondary results selector tokens: 1
ensureContentControlStyles hideRecommended references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback hideRecommended references: 1
clear-stale cleanup hideRecommended references: 0
disabled cleanup hideRecommended references: 0
clear-stale cleanup recommended marker references: 0
disabled cleanup recommended marker references: 0
product runtime recommended marker references: 0
product runtime hideRecommended tokens: 2
product runtime #related tokens: 1
product runtime secondary-results selector tokens: 1
product runtime #secondary.ytd-watch-flexy tokens: 1
product runtime live-chat frame selector tokens: 1
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| CSS branch | `settings.hideRecommended` pushes one CSS rule block into the shared content-control style node. | Recommended hiding is style-owned rather than a JSON watch-next decision or marker-owned DOM decision. |
| Selector set | The branch hides `#related` and `#items.ytd-watch-next-secondary-results-renderer`. | The selector set spans broad watch recommendation containers without a target-shape report. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is a full style regeneration effect, not a per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Recommended style refresh also triggers unrelated mobile app-shell cleanup work. |
| List mode | The recommended branch is not gated by whitelist mode. | Whitelist behavior requires explicit policy before changing selector or mode semantics. |
| `:has()` support | Recommended selectors do not depend on the `supportsHasSelector` branch. | Browser support checks cannot be used as proof that recommended selectors are disabled or scoped. |
| Active work | `hasActiveDOMFallbackWork()` treats `hideRecommended` as active DOM fallback work. | This can keep DOM fallback active even though JSON active-work predicates omit the feature. |
| Stale cleanup | Stale cleanup has no `hideRecommended` or recommended marker reference. | There is no feature-local stale cleanup budget for this CSS-only effect. |
| Disabled cleanup | Disabled cleanup has no `hideRecommended` or recommended marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling `hideRecommended` writes the current recommendation selectors into
   the shared style node, sets route attributes, and calls the Open App cleanup.
4. Toggling the setting off reuses the shared style node and removes the
   recommended selector rows while retaining unconditional Open App CSS.
5. Whitelist mode and unsupported `:has()` do not suppress the recommended CSS
   branch when `hideRecommended` is true.
6. Product runtime source has no recommended feature marker or future
   recommended DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the feature has settings and DOM active-work coverage, but no
  JSON decision, DOM marker, or per-node restore proof.
- False-hide/leak: watch recommendation JSON rows can leak before DOM styling
  applies, while selector-only hiding can remove broad watch rail containers.
- Performance: a recommended toggle keeps the broad DOM fallback style writer
  active and also runs Open App cleanup on each style-writer pass.
- Code burden: settings, JSON omission, DOM active work, style regeneration,
  selector ownership, and app-shell cleanup coupling remain split.

## Non-Completion Boundary

This does not close recommended DOM cleanup. Product runtime source still lacks
a DOM cleanup contract, decision report, style selector policy, target-shape
report, route policy, watch rail report, restore proof, stale cleanup budget,
disabled-state restore proof, metric artifact, and JSON/DOM parity gate. The
following symbols are intentionally absent from product runtime source today:

```text
recommendedDomCleanupBoundaryContract
recommendedDomCleanupDecisionReport
recommendedDomCleanupStyleSelectorPolicy
recommendedDomCleanupTargetShapeReport
recommendedDomCleanupRoutePolicy
recommendedDomCleanupWatchRailReport
recommendedDomCleanupRestoreProof
recommendedDomCleanupStaleCleanupBudget
recommendedDomCleanupDisabledRestoreProof
recommendedDomCleanupMetricArtifact
recommendedDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/recommended-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
