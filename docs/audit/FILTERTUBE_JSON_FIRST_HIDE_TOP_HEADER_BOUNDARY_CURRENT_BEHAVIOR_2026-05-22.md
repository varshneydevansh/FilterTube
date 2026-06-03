# FilterTube JSON-First Hide Top Header Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch, optimization
patch, top-header filtering patch, selector patch, cache patch, or JSON renderer
expansion.

This slice promotes the JSON-first feature audit into `hideTopHeader` proof. It
pins the current code path where the setting is compiled and refreshed, the DOM
fallback owns the visible hide through `#masthead-container`, and JSON watch
payloads keep topbar objects unchanged because there is no first-class JSON
decision for this setting.

## Boundary Source Files

hideTopHeader boundary source files: 6

hideTopHeader source/effect blocks: 9

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |

## Pinned Source Counts

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback top-header CSS rules block lines: 7

DOM fallback top-header CSS rules block bytes: 162

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

settings_shared top-header compile block lines: 3

settings_shared top-header compile block bytes: 146

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideTopHeader tokens: 0

seed total hideTopHeader tokens: 0

DOM fallback total hideTopHeader tokens: 2

background total hideTopHeader tokens: 12

settings_shared total hideTopHeader tokens: 23

bridge_settings total hideTopHeader token: 1

filter_logic total desktopTopbarRenderer tokens: 0

filter_logic total topbarRenderer tokens: 0

DOM fallback total #masthead-container tokens: 2

runtime hideTopHeader fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON top-header decision | `js/filter_logic.js` has no `hideTopHeader` token and no direct `desktopTopbarRenderer` or `topbarRenderer` rule. Topbar JSON objects pass through unchanged when only `hideTopHeader` is enabled. | A `hideTopHeader` contract that says which JSON topbar, masthead, logo, search, and account rows are owned by the setting and which rows must remain visible. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideTopHeader`. `/youtubei/v1/next` now bypasses `processData` with only `hideTopHeader` enabled because the no-active-JSON-work gate now passes through watch-next payloads. | A route no-work budget that proves when `/next`, `/browse`, `/search`, `/guide`, and `/player` may parse/stringify, harvest only, mutate, or pass through for header-only settings. |
| DOM fallback | DOM fallback owns the visible hide with `#masthead-container`. The broad DOM boolean gate also treats `hideTopHeader` as active work. | A JSON/DOM parity report for desktop masthead, mobile top app bar, guide/search/header variants, and native YouTube surfaces. |
| Background compile and invalidation | Background storage reads and compiles `hideTopHeader`. Background storage-change invalidation does not include `hideTopHeader` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideTopHeader` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideTopHeader`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Topbar JSON objects pass through unchanged when only `hideTopHeader` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `hideTopHeader`
enabled.

The runtime fixture proves:

1. Topbar JSON rows and neighboring watch rows pass through unchanged when only
   `hideTopHeader` is enabled.
2. Ordinary keyword rules can remove a matching watch row while topbar JSON
   remains.
3. `/youtubei/v1/next` now bypasses `processData` with only `hideTopHeader`
   enabled, so the setting is not a no-work optimization boundary today.
4. `filter_logic.js` and seed active JSON rules have no hide-top-header
   decision.
5. Background reads and compiles the setting but storage-change invalidation
   omits it.
6. DOM fallback owns `#masthead-container`.

## Non-Completion Boundary

JSON-first hide-top-header filtering still needs hide-top-header contracts,
decision reports, renderer inventory policies, JSON/DOM top-header parity
reports, DOM-only policy reports, route no-work budgets, cache invalidation
reports, route policies, settings parity reports, fixture provenance, metric
artifacts, and first-class hide-top-header authority gates.

No `jsonFirstHideTopHeaderContract`, `jsonFirstHideTopHeaderDecisionReport`,
`jsonFirstTopHeaderRendererInventoryPolicy`,
`jsonFirstTopHeaderJsonDomParityReport`, `jsonFirstTopHeaderDomOnlyPolicy`,
`jsonFirstTopHeaderNoWorkBudget`, `jsonFirstTopHeaderCacheInvalidationReport`,
`jsonFirstTopHeaderRoutePolicy`, `jsonFirstTopHeaderSettingsParityReport`,
`jsonFirstTopHeaderFixtureProvenance`, or
`jsonFirstTopHeaderMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
