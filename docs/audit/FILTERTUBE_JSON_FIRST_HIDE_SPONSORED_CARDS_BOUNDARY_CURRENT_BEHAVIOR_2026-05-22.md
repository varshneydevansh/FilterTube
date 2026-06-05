# FilterTube JSON-First Hide Sponsored Cards Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, sponsored-card
behavior patch, DOM fallback patch, renderer rule patch, settings schema patch,
or selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideSponsoredCards`
proof. It isolates how the sponsored-card toggle currently crosses shared
settings, background compile, background cache invalidation, seed active-work
predicates, JSON renderer traversal, DOM fallback CSS, ad-surface selectors,
and ordinary card pass-through behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6789 | 306239 | `618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |

## Boundary Counts

```text
hideSponsoredCards boundary source files: 5
hideSponsoredCards source/effect blocks: 7
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 463
DOM fallback sponsored CSS rules block lines: 15
DOM fallback sponsored CSS rules block bytes: 567
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
settings_shared settings keys block lines: 38
settings_shared settings keys block bytes: 1031
settings_shared build compiled settings block lines: 54
settings_shared build compiled settings block bytes: 1916
filter_logic total hideSponsoredCards tokens: 0
filter_logic total sponsored-ad-renderer tokens: 0
seed total hideSponsoredCards tokens: 0
seed total sponsored-ad-renderer tokens: 0
DOM fallback total hideSponsoredCards tokens: 2
DOM fallback total ytd-ad-slot-renderer tokens: 1
DOM fallback total ytd-promoted selector tokens: 2
DOM fallback total ytd-search-pyv-renderer tokens: 1
DOM fallback total ytd-display-ad-renderer tokens: 1
DOM fallback total ytd-companion-slot-renderer tokens: 1
DOM fallback total engagement-panel-ads tokens: 1
background total hideSponsoredCards tokens: 13
settings_shared total hideSponsoredCards tokens: 23
runtime hideSponsoredCards fixtures: 5
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Shared settings | `settings_shared.js` lists, loads, passes, and compiles `hideSponsoredCards`. | Settings parity report that covers UI, V4 profile state, legacy values, and compiled consumers. |
| Background compile | Background compiles `hideSponsoredCards` through the boolean pass-through path. | Compile decision record with cache revision and consumer permissions. |
| Background invalidation | Background storage-change invalidation includes `hideSponsoredCards` today. | Refresh-key authority proving stale-cache behavior for each consumer path. |
| Seed active work | Seed JSON active-work detection does not include `hideSponsoredCards`; the setting is not a JSON endpoint activation reason. | JSON no-work decision proving when sponsored-card settings should parse or skip endpoint bodies. |
| JSON renderer rules | `filter_logic.js` has no `hideSponsoredCards`, `adSlotRenderer`, `promotedSparkles`, or `searchPyvRenderer` tokens. | Sponsored renderer inventory policy and JSON hide contract. |
| JSON hide decision | Ad-like JSON renderer objects pass through unchanged under the setting. | JSON sponsored-card decision report and ad-surface provenance. |
| DOM CSS | DOM CSS hides ad slot, promoted sparkles, search PYV, display ad, companion ad, and engagement-panel ad selectors when the setting is true. | Shared JSON/DOM target matrix and CSS target policy. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `hideSponsoredCards` does not remove a JSON `adSlotRenderer`.
- `hideSponsoredCards` does not remove a JSON `promotedSparklesWebRenderer`.
- `hideSponsoredCards` does not remove a JSON `searchPyvRenderer`.
- `hideSponsoredCards` does not remove a nested promoted renderer inside an ad
  slot wrapper.
- ordinary video rows remain visible under `hideSponsoredCards`.

## Risk Interpretation

- Reliability: the user-visible setting is compiled and refreshed, but JSON
  endpoint filtering does not own a sponsored-card decision.
- False-hide/leak: sponsored JSON rows can leak until a later DOM pass sees a
  matching YouTube ad selector; JSON and DOM target sets are not equivalent.
- Performance: DOM fallback must keep broad CSS ad selectors active because
  JSON has no hide decision for this setting.
- Code burden: settings, background, seed no-work logic, renderer traversal,
  CSS selectors, and ad-surface ownership are split across five runtime owners.

## Non-Completion Boundary

This does not close JSON-first sponsored-card filtering. Product runtime source
still lacks first-class hide-sponsored-cards contracts, decision reports,
renderer inventory policies, JSON/DOM parity reports, DOM-only policy reports,
ad-surface reports, no-work budgets, CSS target reports, settings parity
reports, fixture provenance, and metric artifacts. The following symbols are
intentionally absent from product runtime source today:

```text
jsonFirstHideSponsoredCardsContract
jsonFirstHideSponsoredCardsDecisionReport
jsonFirstSponsoredRendererInventoryPolicy
jsonFirstSponsoredJsonDomParityReport
jsonFirstSponsoredDomOnlyPolicy
jsonFirstSponsoredAdSurfaceReport
jsonFirstSponsoredNoWorkBudget
jsonFirstSponsoredCssTargetReport
jsonFirstSponsoredSettingsParityReport
jsonFirstSponsoredFixtureProvenance
jsonFirstSponsoredMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-sponsored-cards-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
