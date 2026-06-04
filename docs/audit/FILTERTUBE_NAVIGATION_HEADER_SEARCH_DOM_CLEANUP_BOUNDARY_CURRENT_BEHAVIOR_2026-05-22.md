# FilterTube Navigation Header Search DOM Cleanup Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, cleanup patch, restore
patch, navigation behavior patch, JSON filter patch, or settings patch.

This slice follows the JSON-first `hideTopHeader`, `hideNotificationBell`,
`hideExploreTrending`, `hideMoreFromYouTube`, `hideSubscriptions`, and
`hideSearchShelves` proofs and isolates their shared navigation/header/search
DOM style cleanup boundary in `js/content/dom_fallback.js`. Today these
controls are CSS-owned in the shared content-control style node. They all keep
DOM fallback active, but none has feature-local markers, stale cleanup ownership,
or disabled-state restore ownership.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

## Boundary Counts

```text
navigation/header/search DOM cleanup boundary source files: 1
navigation/header/search DOM cleanup source/effect blocks: 11
runtime navigation/header/search DOM cleanup fixtures: 6
ensureContentControlStyles block lines: 345
ensureContentControlStyles block bytes: 12583
navigation/header/search CSS group block lines: 53
navigation/header/search CSS group block bytes: 1673
top header CSS block lines: 7
top header CSS block bytes: 162
notification bell CSS block lines: 8
notification bell CSS block bytes: 248
explore trending CSS block lines: 9
explore trending CSS block bytes: 297
more from YouTube CSS block lines: 7
more from YouTube CSS block bytes: 205
subscriptions CSS block lines: 9
subscriptions CSS block bytes: 437
search shelves CSS block lines: 8
search shelves CSS block bytes: 314
active DOM fallback work block lines: 68
active DOM fallback work block bytes: 2333
no-active cleanup branch lines: 14
no-active cleanup branch bytes: 629
clearStaleDOMFallbackVisibility block lines: 33
clearStaleDOMFallbackVisibility block bytes: 1412
disabled cleanup branch lines: 21
disabled cleanup branch bytes: 959
navigation/header/search CSS group rules.push callsites: 6
navigation/header/search CSS group display-none declarations: 6
navigation/header/search CSS group selector rows with :has support: 12
navigation/header/search CSS group :has tokens: 3
navigation/header/search CSS group :not(:has(...)) tokens: 1
navigation/header/search CSS group supportsHasSelector references: 1
ensureContentControlStyles hideTopHeader references: 1
ensureContentControlStyles hideNotificationBell references: 1
ensureContentControlStyles hideExploreTrending references: 1
ensureContentControlStyles hideMoreFromYouTube references: 1
ensureContentControlStyles hideSubscriptions references: 1
ensureContentControlStyles hideSearchShelves references: 1
ensureContentControlStyles style.textContent writes: 1
ensureContentControlStyles Open App direct cleanup calls: 1
active DOM fallback navigation/header/search flag references: 6
clear-stale cleanup navigation/header/search flag references: 0
disabled cleanup navigation/header/search flag references: 0
product runtime navigation/header/search feature marker references: 0
DOM fallback source hideTopHeader tokens: 2
DOM fallback source hideNotificationBell tokens: 2
DOM fallback source hideExploreTrending tokens: 2
DOM fallback source hideMoreFromYouTube tokens: 2
DOM fallback source hideSubscriptions tokens: 2
DOM fallback source hideSearchShelves tokens: 2
```

## Current Behavior Pinned

| Boundary | Current behavior | Risk before implementation changes |
| --- | --- | --- |
| Top header | `settings.hideTopHeader` emits `#masthead-container`. | Header hiding is style-owned, not a JSON topbar or masthead decision. |
| Notification bell | `settings.hideNotificationBell` emits old and shape-based notification button selectors. | Notification UI variants are hidden through selector shape, not a target-shape report. |
| Explore/trending | `settings.hideExploreTrending` emits explore/trending guide links and the trending browse page selector. | Navigation links and route page chrome share one CSS branch. |
| More from YouTube | `settings.hideMoreFromYouTube` emits `#sections > ytd-guide-section-renderer:nth-last-child(2)`. | Positional guide-section hiding can drift when YouTube guide sections change. |
| Subscriptions | `settings.hideSubscriptions` emits subscription links, subscriptions browse page, and a `supportsHasSelector`-dependent guide-section selector. | Browser `:has()` support changes which guide-section selector is emitted. |
| Search shelves | `settings.hideSearchShelves` emits desktop search shelf and horizontal card-list selectors. | Search shelf hiding is DOM CSS-only and separate from JSON shelf renderer traversal. |
| Style lifecycle | `style.textContent = rules.join('\n')` rewrites the shared style node on each active style-writer pass. | Restore is full shared style regeneration or stale-style blanking, not per-node marker restore. |
| Open App coupling | The same writer calls `hideYouTubeOpenAppButtons()` after rewriting CSS. | Navigation/header/search style refresh also triggers unrelated mobile app-shell cleanup work. |
| Active work | All six flags are active DOM fallback keys. | DOM fallback can stay active for navigation/header/search flags that have no first-class JSON decision. |
| Stale cleanup | Stale cleanup has no navigation/header/search flag or feature marker reference. | There is no feature-local stale cleanup budget for these CSS-only effects. |
| Disabled cleanup | Disabled cleanup has no navigation/header/search flag or feature marker reference. | Turning the extension off relies on shared style blanking, not a feature-local restore owner. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

1. The audit artifact is source-pinned to the current `dom_fallback.js` hash.
2. Source/effect block sizes and selector/marker counts remain stable.
3. Enabling all six controls emits the 12 current navigation/header/search
   selector rows into the shared style node when `:has()` is supported.
4. Disabling `:has()` support removes only the dynamic subscriptions guide
   section selector while keeping the fixed subscription link and browse
   selectors.
5. Style regeneration removes navigation/header/search selector rows when the
   six settings are absent, and all six settings are active DOM fallback keys.
6. Product runtime source has no navigation/header/search feature marker or
   future navigation/header/search DOM cleanup authority symbols.

## Risk Interpretation

- Reliability: the navigation/header/search controls depend on broad CSS
  selectors, including one positional guide-section selector and one conditional
  `:has()` selector.
- False-hide/leak: JSON topbar, guide, browse, search shelf, and subscription
  rows can pass through independently of visible DOM CSS effects.
- Performance: any active navigation/header/search flag keeps broad DOM fallback
  active and each style-writer pass also runs Open App cleanup.
- Code burden: UI/catalog controls, JSON omission, DOM active work, CSS
  selectors, route behavior, browser support, stale cleanup, disabled cleanup,
  and app-shell cleanup coupling remain split.

## Non-Completion Boundary

This does not close navigation/header/search DOM cleanup. Product runtime source
still lacks a DOM cleanup contract, decision report, style selector policy,
target-shape report, route policy, navigation surface report, `:has()` support
policy, positional guide-section policy, restore proof, stale cleanup budget,
disabled-state restore proof, metric artifact, and JSON/DOM parity gate. The
following symbols are intentionally absent from product runtime source today:

```text
navigationHeaderSearchDomCleanupBoundaryContract
navigationHeaderSearchDomCleanupDecisionReport
navigationHeaderSearchDomCleanupStyleSelectorPolicy
navigationHeaderSearchDomCleanupTargetShapeReport
navigationHeaderSearchDomCleanupRoutePolicy
navigationHeaderSearchDomCleanupSurfaceReport
navigationHeaderSearchDomCleanupHasSelectorPolicy
navigationHeaderSearchDomCleanupGuidePositionPolicy
navigationHeaderSearchDomCleanupRestoreProof
navigationHeaderSearchDomCleanupStaleCleanupBudget
navigationHeaderSearchDomCleanupDisabledRestoreProof
navigationHeaderSearchDomCleanupMetricArtifact
navigationHeaderSearchDomCleanupJsonParityGate
```

## Validation

```text
node --test tests/runtime/navigation-header-search-dom-cleanup-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
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
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
