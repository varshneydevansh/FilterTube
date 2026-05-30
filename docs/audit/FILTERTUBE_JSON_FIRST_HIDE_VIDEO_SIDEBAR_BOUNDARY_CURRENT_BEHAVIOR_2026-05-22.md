# FilterTube JSON-First Hide Video Sidebar Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, watch-sidebar patch,
DOM fallback patch, watch-route policy patch, settings schema patch, or selector
cleanup patch.

This slice promotes the JSON-first feature audit into `hideVideoSidebar` proof.
It isolates how the watch sidebar toggle currently crosses shared settings,
background compile, background cache invalidation, content storage refresh, seed
active-work predicates, JSON watch-next traversal, DOM fallback CSS, and
ordinary `/youtubei/v1/next` endpoint behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |

## Evidence Counts

hideVideoSidebar boundary source files: 6

hideVideoSidebar source/effect blocks: 9

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback video-sidebar CSS rules block lines: 7

DOM fallback video-sidebar CSS rules block bytes: 172

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

filter_logic total hideVideoSidebar tokens: 0

seed total hideVideoSidebar tokens: 0

DOM fallback total hideVideoSidebar tokens: 2

DOM fallback total #secondary.ytd-watch-flexy tokens: 1

background total hideVideoSidebar tokens: 12

settings_shared total hideVideoSidebar tokens: 23

bridge_settings total hideVideoSidebar tokens: 1

filter_logic total compactVideoRenderer tokens: 9

filter_logic total watchCardCompactVideoRenderer tokens: 4

filter_logic total endScreenVideoRenderer tokens: 4

runtime hideVideoSidebar fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON watch sidebar decision | `js/filter_logic.js` has no `hideVideoSidebar` token. Watch sidebar renderer families such as `compactVideoRenderer`, `watchCardCompactVideoRenderer`, and `endScreenVideoRenderer` are general video-card rows that can be filtered by ordinary keyword/channel rules, but no first-class sidebar decision reads `hideVideoSidebar`. | A `hideVideoSidebar` contract that says which watch-next JSON rows are sidebar rows and which rows must remain visible. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideVideoSidebar`. `/youtubei/v1/next` now bypasses `processData` with only `hideVideoSidebar` enabled because the no-active-JSON-work gate now passes through watch-next sidebar payloads. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible hide with `#secondary.ytd-watch-flexy`. The broad DOM boolean gate also treats `hideVideoSidebar` as active work. | A JSON/DOM parity report for the watch secondary column and all renderer rows under it. |
| Background compile and invalidation | Background storage reads and compiles `hideVideoSidebar`. Background storage-change invalidation does not include `hideVideoSidebar` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideVideoSidebar` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideVideoSidebar`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch sidebar JSON renderer objects pass through unchanged when only `hideVideoSidebar` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `hideVideoSidebar` enabled.

1. Watch sidebar JSON renderer objects pass through unchanged when only
   `hideVideoSidebar` is enabled.
2. `compactVideoRenderer`, `watchCardCompactVideoRenderer`, and nested
   `secondarySearchContainerRenderer` rows are not removed by
   `hideVideoSidebar`.
3. Watch sidebar JSON filtering currently belongs to ordinary keyword rules, not
   `hideVideoSidebar`; a keyword can remove a compact video row while
   `hideVideoSidebar` is merely present in settings.
4. `/youtubei/v1/next` now bypasses `processData` with only
   `hideVideoSidebar` enabled.
5. That same watch-next fixture performs no harvest-only skip for
   `hideVideoSidebar`.
6. Product runtime source still lacks the first-class watch sidebar authority
   symbols listed below.

## Risk Notes

- Reliability risk: DOM hides the watch secondary column while JSON sidebar
  rows remain in payloads, so future watch-side renderer variants can leak if
  the DOM selector misses them.
- False-hide risk: the current DOM selector hides the whole secondary column,
  not item-level JSON rows.
- Performance risk: watch-next fetches can still parse, traverse, and stringify
  JSON with only `hideVideoSidebar` enabled even though there is no
  `hideVideoSidebar` JSON decision.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, and DOM selectors all express part
  of the setting boundary independently.

## Missing Runtime Authority

No `jsonFirstHideVideoSidebarContract`,
`jsonFirstHideVideoSidebarDecisionReport`,
`jsonFirstWatchSidebarRendererInventoryPolicy`,
`jsonFirstWatchSidebarJsonDomParityReport`,
`jsonFirstWatchSidebarDomOnlyPolicy`,
`jsonFirstWatchSidebarNoWorkBudget`,
`jsonFirstWatchSidebarCacheInvalidationReport`,
`jsonFirstWatchSidebarRoutePolicy`,
`jsonFirstWatchSidebarSettingsParityReport`,
`jsonFirstWatchSidebarFixtureProvenance`, or
`jsonFirstWatchSidebarMetricArtifact` exists in product runtime source yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-video-sidebar-boundary-current-behavior.test.mjs`
only pin current behavior. They do not authorize deleting DOM selectors,
changing `/youtubei/v1/next` processing, adding JSON mutations, changing
background cache invalidation, or merging watch controls into a shared authority
without follow-up implementation proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
