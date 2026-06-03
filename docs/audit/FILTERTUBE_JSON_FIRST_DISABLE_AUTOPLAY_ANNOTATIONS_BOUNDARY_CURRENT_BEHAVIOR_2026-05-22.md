# FilterTube JSON-First Disable Autoplay Annotations Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, autoplay patch, annotations patch, player selector patch,
cache patch, or JSON renderer expansion.

This slice promotes the watch/player control audit into `disableAutoplay` and
`disableAnnotations` proof. It pins the current code path where both settings
are compiled and refreshed, the DOM fallback owns the visible player-control
hiding, watch JSON still bypasses seed processing when only these player-control
settings are enabled, `disableAutoplay` can drop watch autoplay endpoint sets
during an already-active JSON pass, and compact autoplay JSON remains outside
direct renderer coverage.

## Boundary Source Files

disableAutoplay/disableAnnotations boundary source files: 6

disableAutoplay/disableAnnotations source/effect blocks: 10

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6343 | 286370 | `ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 845 | 34241 | `aea46dd241248db1d1d9bcbdfdf65320d1399ecd84cc7792678f29b1b26ee092` |

## Pinned Source Counts

filter_logic shared video renderer rules block lines: 8

filter_logic shared video renderer rules block bytes: 415

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback autoplay CSS rules block lines: 8

DOM fallback autoplay CSS rules block bytes: 235

DOM fallback annotations CSS rules block lines: 8

DOM fallback annotations CSS rules block bytes: 185

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

settings_shared disable controls compile block lines: 2

settings_shared disable controls compile block bytes: 102

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total disableAutoplay tokens: 1

filter_logic total disableAnnotations tokens: 0

seed total disableAutoplay tokens: 0

seed total disableAnnotations tokens: 0

DOM fallback total disableAutoplay token: 1

DOM fallback total disableAnnotations token: 1

background total disableAutoplay tokens: 12

background total disableAnnotations tokens: 12

settings_shared total disableAutoplay tokens: 23

settings_shared total disableAnnotations tokens: 23

bridge_settings total disableAutoplay token: 1

bridge_settings total disableAnnotations token: 1

filter_logic total compactAutoplayRenderer tokens: 0

filter_logic total endScreenVideoRenderer tokens: 4

DOM fallback autoplay CSS block button[data-tooltip-target-id="ytp-autonav-toggle-button"] token: 1

DOM fallback autoplay CSS block .autonav-endscreen token: 1

DOM fallback annotations CSS block .annotation token: 1

DOM fallback annotations CSS block .iv-branding token: 1

runtime disableAutoplay/disableAnnotations fixtures: 7

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON autoplay decision | `js/filter_logic.js` now has a direct `disableAutoplay` hook in `_shouldDropAutoplayEndpointSet`, so watch autoplay endpoint sets are removed during an already-active JSON pass. `compactAutoplayRenderer` still has no direct renderer rule, and compact autoplay/end-screen renderer rows pass through unchanged when only `disableAutoplay` and `disableAnnotations` are enabled. | A player autoplay contract that separates compact autoplay JSON, player autonav controls, end-screen autoplay overlays, playlist auto-advance behavior, and ordinary recommendation rows. |
| JSON annotations decision | `js/filter_logic.js` has no `disableAnnotations` token. Annotation control is visible DOM CSS only today. | A player annotations contract that defines whether annotations are DOM-only, JSON-controlled, or mixed by route/player surface. |
| Ordinary JSON filtering interaction | Ordinary keyword rules can remove supported `endScreenVideoRenderer` rows while unsupported `compactAutoplayRenderer` rows remain. This removal is not owned by either disable control. | A renderer inventory policy that proves compact autoplay, direct end-screen, player overlays, watch-card rows, and sibling visibility independently. |
| Seed active JSON work | Seed JSON active-work detection does not include `disableAutoplay` or `disableAnnotations`. `/youtubei/v1/next` now bypasses `processData` with only these two settings enabled. | A route no-work budget that proves when `/next`, `/player`, `/browse`, `/search`, and initial watch data may parse/stringify, harvest only, mutate, or pass through for player-control-only settings. |
| DOM fallback | DOM fallback owns visible hiding with `button[data-tooltip-target-id="ytp-autonav-toggle-button"]`, `.autonav-endscreen`, `.annotation`, and `.iv-branding`. The broad DOM boolean active gate does not list `disableAutoplay` or `disableAnnotations`; the style path still reacts to settings when CSS is applied. | A JSON/DOM parity report for desktop player controls, mobile player controls, end-screen autoplay UI, annotation overlays, browser selector support, and route-scoped execution. |
| Background compile and invalidation | Background storage reads and compiles both settings. Background storage-change invalidation does not include either setting today. | A cache invalidation report that either adds the dependencies or explicitly classifies them as DOM-only with bounded refresh paths. |
| Content bridge refresh | `js/content/bridge_settings.js` includes both settings in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, UI catalog, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles both settings. | A schema-level owner for these flags, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Compact autoplay and supported end-screen JSON renderer rows pass through unchanged
when only `disableAutoplay` and `disableAnnotations` are enabled.

Watch autoplay endpoint sets are removed during active JSON processing when
`disableAutoplay` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `disableAutoplay` and
`disableAnnotations` enabled.

The runtime fixture proves:

1. Compact autoplay JSON and supported end-screen JSON renderer rows pass through
   unchanged when only `disableAutoplay` and `disableAnnotations` are enabled.
2. Ordinary keyword rules can remove a matching supported `endScreenVideoRenderer`
   row while a matching `compactAutoplayRenderer` row remains.
3. Watch autoplay endpoint sets are removed during active JSON processing when
   `disableAutoplay` is enabled.
4. `/youtubei/v1/next` now bypasses `processData` with only both disable
   controls enabled.
5. `filter_logic.js` has a disable-autoplay endpoint-set decision while seed
   active JSON rules and `disableAnnotations` still have no JSON decision.
6. Background reads and compiles both settings but storage-change invalidation
   omits both.
7. DOM fallback owns `button[data-tooltip-target-id="ytp-autonav-toggle-button"]`,
   `.autonav-endscreen`, `.annotation`, and `.iv-branding`.

## Non-Completion Boundary

JSON-first disable-autoplay/annotations behavior still needs player-control
contracts, decision reports, renderer inventory policies, JSON/DOM player
control parity reports, DOM-only policy reports, compact-autoplay gap reports,
route no-work budgets, cache invalidation reports, route policies, settings
parity reports, fixture provenance, metric artifacts, and first-class
disable-autoplay/annotations authority gates.

No `jsonFirstDisableAutoplayAnnotationsContract`,
`jsonFirstDisableAutoplayAnnotationsDecisionReport`,
`jsonFirstPlayerControlRendererInventoryPolicy`,
`jsonFirstPlayerControlJsonDomParityReport`,
`jsonFirstPlayerControlDomOnlyPolicy`,
`jsonFirstCompactAutoplayGapReport`,
`jsonFirstPlayerControlNoWorkBudget`,
`jsonFirstPlayerControlCacheInvalidationReport`,
`jsonFirstPlayerControlRoutePolicy`,
`jsonFirstPlayerControlSettingsParityReport`,
`jsonFirstPlayerControlFixtureProvenance`, or
`jsonFirstPlayerControlMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
