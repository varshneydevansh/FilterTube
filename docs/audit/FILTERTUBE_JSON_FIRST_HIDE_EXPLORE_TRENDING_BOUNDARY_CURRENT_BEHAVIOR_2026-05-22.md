# FilterTube JSON-First Hide Explore Trending Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, explore-trending filtering patch, selector patch, cache
patch, or JSON renderer expansion.

This slice promotes the JSON-first feature audit into `hideExploreTrending`
proof. It pins the current code path where the setting is compiled and
refreshed, the DOM fallback owns the visible Explore/Trending guide and page
hide, and navigation JSON remains governed by ordinary renderer rules rather
than a first-class Explore/Trending decision.

## Boundary Source Files

hideExploreTrending boundary source files: 6

hideExploreTrending source/effect blocks: 9

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6343 | 286370 | `ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 845 | 34241 | `aea46dd241248db1d1d9bcbdfdf65320d1399ecd84cc7792678f29b1b26ee092` |

## Pinned Source Counts

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback explore-trending CSS rules block lines: 9

DOM fallback explore-trending CSS rules block bytes: 297

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

settings_shared explore-trending compile block lines: 1

settings_shared explore-trending compile block bytes: 56

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideExploreTrending tokens: 0

seed total hideExploreTrending tokens: 0

DOM fallback total hideExploreTrending tokens: 2

background total hideExploreTrending tokens: 12

settings_shared total hideExploreTrending tokens: 23

bridge_settings total hideExploreTrending token: 1

filter_logic total guideEntryRenderer tokens: 0

filter_logic total compactLinkRenderer tokens: 0

DOM fallback total /feed/explore tokens: 1

DOM fallback total /feed/trending tokens: 1

DOM fallback total ytd-browse[page-subtype="trending"] tokens: 1

runtime hideExploreTrending fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON Explore/Trending decision | `js/filter_logic.js` has no `hideExploreTrending` token and no direct `guideEntryRenderer`, `compactLinkRenderer`, `/feed/explore`, or `/feed/trending` decision. Explore and Trending guide JSON passes through unchanged when only `hideExploreTrending` is enabled. | A `hideExploreTrending` contract that separates guide entries, browse-page scaffolding, compact navigation links, mobile pivots, and ordinary content rows by route and surface. |
| JSON neighboring row traversal | Ordinary keyword rules can remove a neighboring supported video row, but that removal is not owned by `hideExploreTrending`. | A renderer inventory policy that classifies navigation rows separately from content rows and proves expected allow/block behavior by endpoint. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideExploreTrending`. `/youtubei/v1/browse` now bypasses `processData` with only `hideExploreTrending` enabled on `/feed/explore` because that route now shares the no-active-JSON-work pass-through gate. | A route no-work budget that proves when `/browse`, `/guide`, `/search`, `/next`, and `/player` may parse/stringify, harvest only, mutate, or pass through for Explore/Trending-only settings. |
| DOM fallback | DOM fallback owns the visible hide with `/feed/explore`, `/feed/trending`, and `ytd-browse[page-subtype="trending"]` selectors. The broad DOM boolean gate also treats `hideExploreTrending` as active work. | A JSON/DOM parity report for desktop guide entries, browse pages, mobile navigation pivots, mini-guide links, and native YouTube surfaces. |
| Background compile and invalidation | Background storage reads and compiles `hideExploreTrending`. Background storage-change invalidation does not include `hideExploreTrending` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideExploreTrending` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideExploreTrending`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Explore and Trending guide JSON entries pass through unchanged when only
`hideExploreTrending` is enabled.

`/youtubei/v1/browse` now bypasses `processData` with only
`hideExploreTrending` enabled.

The runtime fixture proves:

1. Explore and Trending guide JSON entries and neighboring supported rows pass
   through unchanged when only `hideExploreTrending` is enabled.
2. Ordinary keyword rules can remove a neighboring supported row while
   Explore/Trending guide JSON remains.
3. `/youtubei/v1/browse` now bypasses `processData` with only
   `hideExploreTrending` enabled on `/feed/explore`, so the setting is not a
   no-work optimization boundary today.
4. `filter_logic.js` and seed active JSON rules have no hide-explore-trending
   decision.
5. Background reads and compiles the setting but storage-change invalidation
   omits it.
6. DOM fallback owns `/feed/explore`, `/feed/trending`, and
   `ytd-browse[page-subtype="trending"]`.

## Non-Completion Boundary

JSON-first hide-explore-trending filtering still needs hide-explore-trending
contracts, decision reports, renderer inventory policies, JSON/DOM
Explore/Trending parity reports, DOM-only policy reports, route no-work
budgets, cache invalidation reports, route policies, settings parity reports,
fixture provenance, metric artifacts, and first-class hide-explore-trending
authority gates.

No `jsonFirstHideExploreTrendingContract`,
`jsonFirstHideExploreTrendingDecisionReport`,
`jsonFirstExploreTrendingRendererInventoryPolicy`,
`jsonFirstExploreTrendingJsonDomParityReport`,
`jsonFirstExploreTrendingDomOnlyPolicy`,
`jsonFirstExploreTrendingNoWorkBudget`,
`jsonFirstExploreTrendingCacheInvalidationReport`,
`jsonFirstExploreTrendingRoutePolicy`,
`jsonFirstExploreTrendingSettingsParityReport`,
`jsonFirstExploreTrendingFixtureProvenance`, or
`jsonFirstExploreTrendingMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content-control JSON-first boundary can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
