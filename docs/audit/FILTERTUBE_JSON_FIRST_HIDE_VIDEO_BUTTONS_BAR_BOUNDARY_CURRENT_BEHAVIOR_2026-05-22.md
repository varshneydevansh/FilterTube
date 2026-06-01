# FilterTube JSON-First Hide Video Buttons Bar Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, video-buttons-bar
patch, watch-route policy patch, DOM fallback patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideVideoButtonsBar`
proof. It isolates how the watch video buttons bar child toggle currently
crosses shared settings, background compile, background cache invalidation,
content storage refresh, seed active-work predicates, JSON watch metadata
renderers, DOM fallback CSS, whitelist mode, the `hideVideoInfo` master toggle,
and ordinary `/youtubei/v1/next` endpoint behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |

## Evidence Counts

hideVideoButtonsBar boundary source files: 6

hideVideoButtonsBar source/effect blocks: 12

filter_logic watch primary metadata rules block lines: 10

filter_logic watch primary metadata rules block bytes: 431

filter_logic whitelist watch scaffolding block lines: 6

filter_logic whitelist watch scaffolding block bytes: 449

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback video-buttons-bar CSS rules block lines: 8

DOM fallback video-buttons-bar CSS rules block bytes: 263

DOM fallback video-info mode declaration block lines: 11

DOM fallback video-info mode declaration block bytes: 445

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

settings_shared build compiled settings block lines: 59

settings_shared build compiled settings block bytes: 2156

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideVideoButtonsBar tokens: 0

seed total hideVideoButtonsBar tokens: 0

DOM fallback total hideVideoButtonsBar tokens: 2

background total hideVideoButtonsBar tokens: 12

settings_shared total hideVideoButtonsBar tokens: 23

bridge_settings total hideVideoButtonsBar token: 1

filter_logic total videoPrimaryInfoRenderer tokens: 2

filter_logic total videoSecondaryInfoRenderer tokens: 2

DOM fallback video-buttons-bar CSS block hideInfoMaster tokens: 1

DOM fallback video-buttons-bar CSS block #actions.ytd-watch-metadata tokens: 1

DOM fallback video-buttons-bar CSS block #info > #menu-container tokens: 1

runtime hideVideoButtonsBar fixtures: 7

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON video-buttons decision | `js/filter_logic.js` has no `hideVideoButtonsBar` token. `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` have ordinary JSON renderer rules, so keyword/channel rules can remove them independently of the video-buttons-bar toggle. | A `hideVideoButtonsBar` contract that separates action/menu chrome hiding from JSON watch metadata filtering and sibling-visible behavior. |
| Master toggle interaction | DOM fallback hides the same buttons bar selectors when `hideInfoMaster` is true or when `settings.hideVideoButtonsBar` is true. `hideInfoMaster` itself is derived from blocklist-mode `hideVideoInfo`. | A child-control interaction report proving whether master and child toggles intentionally share selectors, list-mode rules, restore behavior, and metrics. |
| Whitelist mode | DOM fallback gates this selector block with `listMode !== 'whitelist'`. `js/filter_logic.js` also preserves `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` in whitelist mode before empty whitelist fail-closed evaluation. | A whitelist-mode report proving that the watch action/menu bar, metadata rows, and owner/description scaffolding stay visible when whitelist safety requires it. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideVideoButtonsBar`. `/youtubei/v1/next` now bypasses `processData` with only `hideVideoButtonsBar` enabled because the no-active-JSON-work gate passes through before JSON parse. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible hide with `#actions.ytd-watch-metadata` and `#info > #menu-container`. | A JSON/DOM parity report for desktop and mobile watch action buttons, menu containers, Ask controls, owner row, description, and child-control overlaps. |
| Background compile and invalidation | Background storage reads and compiles `hideVideoButtonsBar`. Background storage-change invalidation does not include `hideVideoButtonsBar` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideVideoButtonsBar` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideVideoButtonsBar`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch video-buttons-bar JSON rows pass through unchanged when only `hideVideoButtonsBar` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `hideVideoButtonsBar` enabled.

1. JSON `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows pass
   through unchanged when only `hideVideoButtonsBar` is enabled.
2. Ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row
   while nonmatching watch metadata JSON remains; that removal is not a
   first-class `hideVideoButtonsBar` decision.
3. Whitelist mode preserves `videoPrimaryInfoRenderer` and
   `videoSecondaryInfoRenderer` rows with an empty whitelist even when
   `hideVideoButtonsBar` is enabled.
4. `/youtubei/v1/next` now bypasses `processData` with only
   `hideVideoButtonsBar` enabled.
5. That same watch-next fixture performs no harvest-only skip for
   `hideVideoButtonsBar`.
6. The DOM selector block proves `hideVideoInfo` master mode and
   `hideVideoButtonsBar` share the buttons bar hide selectors in blocklist mode.
7. Product runtime source still lacks the first-class video-buttons-bar authority
   symbols listed below.

## Risk Notes

- Reliability risk: visible watch action/menu chrome is DOM-owned while JSON
  watch metadata rows remain independent, so renderer or DOM layout drift can
  create leaks.
- False-hide risk: the child toggle and `hideVideoInfo` master toggle share
  selectors, but the list-mode gate and restore boundary are local CSS behavior
  rather than one explicit child-control report.
- Performance risk: watch-next fetches can still parse, traverse, and stringify
  JSON with only `hideVideoButtonsBar` enabled even though there is no
  `hideVideoButtonsBar` JSON decision.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, JSON metadata renderer filtering,
  whitelist scaffolding preservation, master-toggle interaction, and DOM
  selectors all express part of the setting boundary independently.

## Missing Runtime Authority

No `jsonFirstHideVideoButtonsBarContract`,
`jsonFirstHideVideoButtonsBarDecisionReport`,
`jsonFirstVideoButtonsBarRendererInventoryPolicy`,
`jsonFirstVideoButtonsBarJsonDomParityReport`,
`jsonFirstVideoButtonsBarDomOnlyPolicy`,
`jsonFirstVideoButtonsBarWhitelistModeReport`,
`jsonFirstVideoButtonsBarChildControlInteractionReport`,
`jsonFirstVideoButtonsBarNoWorkBudget`,
`jsonFirstVideoButtonsBarCacheInvalidationReport`,
`jsonFirstVideoButtonsBarRoutePolicy`,
`jsonFirstVideoButtonsBarSettingsParityReport`,
`jsonFirstVideoButtonsBarFixtureProvenance`, or
`jsonFirstVideoButtonsBarMetricArtifact` exists in product runtime source yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-video-buttons-bar-boundary-current-behavior.test.mjs`
only pin current behavior. They do not authorize deleting DOM selectors,
changing `/youtubei/v1/next` processing, adding JSON mutations, changing
whitelist watch metadata behavior, changing background cache invalidation, or
merging watch controls into a shared authority without follow-up implementation
proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
