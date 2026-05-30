# FilterTube JSON-First Hide Watch Playlist Panel Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, watch-playlist-panel
patch, DOM fallback patch, watch-route policy patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideWatchPlaylistPanel`
proof. It isolates how the watch playlist panel toggle currently crosses shared
settings, background compile, background cache invalidation, content storage
refresh, seed active-work predicates, JSON watch-next traversal, DOM fallback
CSS, and ordinary `/youtubei/v1/next` endpoint behavior.

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

hideWatchPlaylistPanel boundary source files: 6

hideWatchPlaylistPanel source/effect blocks: 11

filter_logic shared video renderer rules block lines: 7

filter_logic shared video renderer rules block bytes: 344

filter_logic playlist panel harvest block lines: 20

filter_logic playlist panel harvest block bytes: 949

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback watch-playlist-panel CSS rules block lines: 9

DOM fallback watch-playlist-panel CSS rules block bytes: 264

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

filter_logic total hideWatchPlaylistPanel tokens: 0

seed total hideWatchPlaylistPanel tokens: 0

DOM fallback total hideWatchPlaylistPanel tokens: 2

background total hideWatchPlaylistPanel tokens: 12

settings_shared total hideWatchPlaylistPanel tokens: 23

bridge_settings total hideWatchPlaylistPanel tokens: 1

filter_logic total playlistPanelRenderer tokens: 1

filter_logic total playlistPanelVideoRenderer tokens: 6

DOM fallback total ytd-playlist-panel-renderer tokens: 2

DOM fallback total ytm-playlist-panel-renderer tokens: 4

DOM fallback total ytm-playlist-panel-renderer-v2 tokens: 2

runtime hideWatchPlaylistPanel fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON watch playlist decision | `js/filter_logic.js` has no `hideWatchPlaylistPanel` token. `playlistPanelRenderer` headers are not a direct JSON decision surface, while nested `playlistPanelVideoRenderer` rows use shared video rules and can be removed by ordinary keyword/channel/content rules. | A `hideWatchPlaylistPanel` contract that says which playlist panel JSON rows are panel scaffolding, which rows are filterable videos, and which selected/current rows must remain visible. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideWatchPlaylistPanel`. `/youtubei/v1/next` now bypasses `processData` with only `hideWatchPlaylistPanel` enabled because the no-active-JSON-work gate now passes through watch-next playlist panel payloads. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible hide with `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2`. The broad DOM boolean gate also treats `hideWatchPlaylistPanel` as active work. | A JSON/DOM parity report for desktop and mobile playlist panel containers, selected rows, current video rows, and playlist-panel identity paths. |
| Background compile and invalidation | Background storage reads and compiles `hideWatchPlaylistPanel`. Background storage-change invalidation does not include `hideWatchPlaylistPanel` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideWatchPlaylistPanel` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideWatchPlaylistPanel`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch playlist panel JSON rows pass through unchanged when only `hideWatchPlaylistPanel` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only `hideWatchPlaylistPanel` enabled.

1. JSON `playlistPanelRenderer` headers and nested `playlistPanelVideoRenderer`
   rows pass through unchanged when only `hideWatchPlaylistPanel` is enabled.
2. `hideWatchPlaylistPanel` does not remove the `playlistPanelRenderer` wrapper
   or its nested playlist video rows.
3. Ordinary keyword rules can remove a nested `playlistPanelVideoRenderer` row
   while the playlist panel header remains; that removal is not a first-class
   `hideWatchPlaylistPanel` decision.
4. `/youtubei/v1/next` now bypasses `processData` with only
   `hideWatchPlaylistPanel` enabled.
5. That same watch-next fixture performs no harvest-only skip for
   `hideWatchPlaylistPanel`.
6. Product runtime source still lacks the first-class watch playlist panel
   authority symbols listed below.

## Risk Notes

- Reliability risk: DOM hides currently known playlist panel containers while
  JSON playlist panel rows remain in payloads, so future desktop/mobile panel
  variants can leak if the DOM selector misses them.
- False-hide risk: the DOM selector hides the whole panel, while JSON filtering
  only owns nested video rows; selected/current playlist rows need separate
  proof before behavior changes.
- Performance risk: watch-next fetches can still parse, traverse, and stringify
  JSON with only `hideWatchPlaylistPanel` enabled even though there is no
  `hideWatchPlaylistPanel` JSON decision.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, JSON row filtering, and DOM
  selectors all express part of the setting boundary independently.

## Missing Runtime Authority

No `jsonFirstHideWatchPlaylistPanelContract`,
`jsonFirstHideWatchPlaylistPanelDecisionReport`,
`jsonFirstWatchPlaylistPanelRendererInventoryPolicy`,
`jsonFirstWatchPlaylistPanelJsonDomParityReport`,
`jsonFirstWatchPlaylistPanelDomOnlyPolicy`,
`jsonFirstWatchPlaylistPanelNoWorkBudget`,
`jsonFirstWatchPlaylistPanelCacheInvalidationReport`,
`jsonFirstWatchPlaylistPanelRoutePolicy`,
`jsonFirstWatchPlaylistPanelSettingsParityReport`,
`jsonFirstWatchPlaylistPanelFixtureProvenance`, or
`jsonFirstWatchPlaylistPanelMetricArtifact` exists in product runtime source
yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-watch-playlist-panel-boundary-current-behavior.test.mjs`
only pin current behavior. They do not authorize deleting DOM selectors,
changing `/youtubei/v1/next` processing, adding JSON mutations, changing
background cache invalidation, or merging watch controls into a shared authority
without follow-up implementation proof.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
