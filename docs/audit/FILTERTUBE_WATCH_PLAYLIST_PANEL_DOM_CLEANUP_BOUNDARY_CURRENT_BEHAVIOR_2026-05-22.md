# FilterTube Watch Playlist Panel DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, watch playlist panel behavior patch, JSON filter patch, or settings
patch.

This slice follows the JSON-first `hideWatchPlaylistPanel` proof and isolates
the direct DOM/style cleanup boundary in `js/content/dom_fallback.js`. Today the
watch playlist panel toggle is implemented as a content-control CSS branch: it
emits desktop and mobile playlist panel container selectors into the shared
style node, relies on the style lifecycle to rewrite the rule set, and does not
write a feature-local DOM marker.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
watch-playlist-panel DOM cleanup boundary source files: 1
watch-playlist-panel DOM cleanup source/effect blocks: 6
runtime watch-playlist-panel DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 459
ensureContentControlStyles block bytes: 16337
watch-playlist-panel CSS block lines: 9
watch-playlist-panel CSS block bytes: 264
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 18
disabled cleanup branch bytes: 791
watch-playlist-panel CSS rules.push callsites: 1
watch-playlist-panel CSS display-none declarations: 1
watch-playlist-panel CSS selector rows: 3
watch-playlist-panel CSS desktop selector tokens: 1
watch-playlist-panel CSS mobile v1 selector tokens: 1
watch-playlist-panel CSS mobile v2 selector tokens: 1
ensureContentControlStyles hideWatchPlaylistPanel references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback hideWatchPlaylistPanel references: 1
clear-stale cleanup hideWatchPlaylistPanel references: 0
disabled cleanup hideWatchPlaylistPanel references: 0
clear-stale cleanup watch-playlist-panel marker references: 0
disabled cleanup watch-playlist-panel marker references: 0
product runtime watch-playlist-panel marker references: 0
product runtime hideWatchPlaylistPanel tokens: 2
product runtime ytd-playlist-panel-renderer tokens: 2
product runtime ytm-playlist-panel-renderer tokens: 4
product runtime ytm-playlist-panel-renderer-v2 tokens: 2
product runtime hidePlaylistCards tokens: 3
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| CSS branch | `settings.hideWatchPlaylistPanel` pushes one CSS rule block into the shared content-control style node. | Watch playlist panel hiding is style-owned rather than a JSON watch-next panel decision or marker-owned DOM decision. |
| Selector set | The branch hides `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2`. | The selector set removes whole desktop/mobile playlist panel containers without a target-shape report for current, selected, or nested playlist video rows. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is a full style regeneration effect, not a per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Watch playlist panel style refresh also triggers unrelated mobile app-shell cleanup work. |
| List mode | The watch playlist panel branch is not gated by whitelist mode. | Whitelist behavior requires explicit policy before changing selector or mode semantics. |
| `:has()` support | Watch playlist panel selectors do not depend on the `supportsHasSelector` branch. | Browser support checks cannot be used as proof that watch playlist panel selectors are disabled or scoped. |
| Active work | `hasActiveDOMFallbackWork()` treats `hideWatchPlaylistPanel` as active DOM fallback work. | This can keep DOM fallback active even though JSON active-work predicates omit the feature. |
| Stale cleanup | Stale cleanup has no `hideWatchPlaylistPanel` or watch playlist panel marker reference. | There is no feature-local stale cleanup budget for this CSS-only effect. |
| Disabled cleanup | Disabled cleanup has no `hideWatchPlaylistPanel` or watch playlist panel marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling `hideWatchPlaylistPanel` writes the current playlist panel
   selectors into the shared style node, sets route attributes, and calls the
   Open App cleanup.
4. Toggling the setting off reuses the shared style node and removes the watch
   playlist panel selector rows while retaining unconditional Open App CSS.
5. Whitelist mode and unsupported `:has()` do not suppress the watch playlist
   panel CSS branch when `hideWatchPlaylistPanel` is true.
6. Product runtime source has no watch playlist panel feature marker or future
   watch playlist panel DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the feature has settings and DOM active-work coverage, but no
  JSON decision, DOM marker, or per-node restore proof.
- False-hide/leak: watch playlist panel JSON rows can leak before DOM styling
  applies, while selector-only hiding can remove whole panel containers.
- Performance: a watch playlist panel toggle keeps the broad DOM fallback style
  writer active and also runs Open App cleanup on each style-writer pass.
- Code burden: settings, JSON omission, DOM active work, style regeneration,
  selector ownership, and app-shell cleanup coupling remain split.

## Non-Completion Boundary

This does not close watch playlist panel DOM cleanup. Product runtime source
still lacks a DOM cleanup contract, decision report, style selector policy,
target-shape report, route policy, panel surface report, restore proof, stale
cleanup budget, disabled-state restore proof, metric artifact, and JSON/DOM
parity gate. The following symbols are intentionally absent from product
runtime source today:

```text
watchPlaylistPanelDomCleanupBoundaryContract
watchPlaylistPanelDomCleanupDecisionReport
watchPlaylistPanelDomCleanupStyleSelectorPolicy
watchPlaylistPanelDomCleanupTargetShapeReport
watchPlaylistPanelDomCleanupRoutePolicy
watchPlaylistPanelDomCleanupPanelSurfaceReport
watchPlaylistPanelDomCleanupRestoreProof
watchPlaylistPanelDomCleanupStaleCleanupBudget
watchPlaylistPanelDomCleanupDisabledRestoreProof
watchPlaylistPanelDomCleanupMetricArtifact
watchPlaylistPanelDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/watch-playlist-panel-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
