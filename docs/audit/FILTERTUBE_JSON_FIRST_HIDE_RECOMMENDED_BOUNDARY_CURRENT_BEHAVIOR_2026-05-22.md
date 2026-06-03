# FilterTube JSON-First Hide Recommended Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, watch-recommendations
patch, DOM fallback patch, watch-route policy patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideRecommended` proof.
It isolates how the watch recommendation toggle currently crosses shared
settings, background compile, background cache invalidation, content storage
refresh, seed active-work predicates, JSON watch-next traversal, DOM fallback
CSS, and ordinary `/youtubei/v1/next` endpoint behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |

## Evidence Counts

hideRecommended boundary source files: 6

hideRecommended source/effect blocks: 9

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback recommended CSS rules block lines: 8

DOM fallback recommended CSS rules block bytes: 215

DOM fallback active boolean keys block lines: 28

DOM fallback active boolean keys block bytes: 905

background storage read keys block lines: 44

background storage read keys block bytes: 1408

background boolean pass-through block lines: 35

background boolean pass-through block bytes: 3596

background storage refresh keys block lines: 16

background storage refresh keys block bytes: 461

settings_shared settings keys block lines: 38

settings_shared settings keys block bytes: 1031

settings_shared build compiled settings block lines: 57

settings_shared build compiled settings block bytes: 2056

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideRecommended tokens: 0

seed total hideRecommended tokens: 0

DOM fallback total hideRecommended tokens: 2

DOM fallback total #related tokens: 1

DOM fallback total #items.ytd-watch-next-secondary-results-renderer tokens: 1

background total hideRecommended tokens: 12

settings_shared total hideRecommended tokens: 23

bridge_settings total hideRecommended tokens: 1

filter_logic total compactVideoRenderer tokens: 9

filter_logic total watchCardCompactVideoRenderer tokens: 4

filter_logic total endScreenVideoRenderer tokens: 4

runtime hideRecommended fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON watch recommendation decision | `js/filter_logic.js` has no `hideRecommended` token. `compactVideoRenderer`, `watchCardCompactVideoRenderer`, and `endScreenVideoRenderer` are general video-card renderer families that can be filtered by ordinary keyword/channel rules, but no first-class recommendation decision reads `hideRecommended`. | A `hideRecommended` contract that says which watch-next JSON rows are recommendation rows and which rows must remain visible. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideRecommended`. `/youtubei/v1/next` now bypasses `processData` with only `hideRecommended` enabled because the no-active-JSON-work gate now passes through watch-next recommendation payloads. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible hide with `#related` and `#items.ytd-watch-next-secondary-results-renderer`. The broad DOM boolean gate also treats `hideRecommended` as active work. | A JSON/DOM parity report for watch recommendation containers and renderer rows. |
| Background compile and invalidation | Background storage reads and compiles `hideRecommended`. Background storage-change invalidation does not include `hideRecommended` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` does include `hideRecommended` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideRecommended`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch recommendation JSON renderer objects pass through unchanged when only `hideRecommended` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `hideRecommended` enabled.

1. Watch recommendation JSON renderer objects pass through unchanged when only
   `hideRecommended` is enabled.
2. `compactVideoRenderer`, `watchCardCompactVideoRenderer`, and nested
   `secondarySearchContainerRenderer` rows are not removed by
   `hideRecommended`.
3. Watch recommendation JSON filtering currently belongs to ordinary keyword
   rules, not `hideRecommended`; a keyword can remove a compact video row while
   `hideRecommended` is merely present in settings.
4. `/youtubei/v1/next` now bypasses `processData` with only
   `hideRecommended` enabled.
5. That same watch-next fixture performs no harvest-only skip for
   `hideRecommended`.
6. Product runtime source still lacks the first-class watch recommendation
   authority symbols listed below.

## Risk Notes

- Reliability risk: DOM hides the visible recommendation rail while JSON
  recommendation rows remain in payloads, so future renderer variants can leak
  if the DOM selector misses them.
- False-hide risk: the current DOM selector hides whole watch recommendation
  containers instead of item-level JSON rows.
- Performance risk: watch-next fetches can still parse, traverse, and stringify
  JSON with only `hideRecommended` enabled even though there is no
  `hideRecommended` JSON decision.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, and DOM selectors all express part
  of the setting boundary independently.

## Missing Runtime Authority

No `jsonFirstHideRecommendedContract`,
`jsonFirstHideRecommendedDecisionReport`,
`jsonFirstWatchRecommendationsRendererInventoryPolicy`,
`jsonFirstWatchRecommendationsJsonDomParityReport`,
`jsonFirstWatchRecommendationsDomOnlyPolicy`,
`jsonFirstWatchRecommendationsNoWorkBudget`,
`jsonFirstWatchRecommendationsCacheInvalidationReport`,
`jsonFirstWatchRecommendationsRoutePolicy`,
`jsonFirstWatchRecommendationsSettingsParityReport`,
`jsonFirstWatchRecommendationsFixtureProvenance`, or
`jsonFirstWatchRecommendationsMetricArtifact` exists in product runtime source
yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-recommended-boundary-current-behavior.test.mjs`
only pin current behavior. They do not authorize deleting DOM selectors,
changing `/youtubei/v1/next` processing, adding JSON mutations, changing
background cache invalidation, or merging watch controls into a shared authority
without follow-up implementation proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
