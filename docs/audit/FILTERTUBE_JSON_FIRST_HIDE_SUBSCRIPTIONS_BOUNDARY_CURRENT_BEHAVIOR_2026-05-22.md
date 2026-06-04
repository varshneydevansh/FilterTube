# FilterTube JSON-First Hide Subscriptions Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, subscriptions filtering patch, selector patch, cache patch,
or JSON renderer expansion.

This slice promotes the JSON-first feature audit into `hideSubscriptions`
proof. It pins the current code path where the setting is compiled and
refreshed, the DOM fallback owns visible Subscriptions guide and route hiding,
and navigation JSON remains governed by ordinary renderer rules rather than a
first-class Subscriptions decision.

## Boundary Source Files

hideSubscriptions boundary source files: 6

hideSubscriptions source/effect blocks: 9

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

DOM fallback subscriptions CSS rules block lines: 9

DOM fallback subscriptions CSS rules block bytes: 437

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

settings_shared subscriptions compile block lines: 1

settings_shared subscriptions compile block bytes: 52

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideSubscriptions tokens: 0

seed total hideSubscriptions tokens: 0

DOM fallback total hideSubscriptions tokens: 2

background total hideSubscriptions tokens: 12

settings_shared total hideSubscriptions tokens: 23

bridge_settings total hideSubscriptions token: 1

filter_logic total guideSectionRenderer tokens: 1

filter_logic total guideEntryRenderer tokens: 0

filter_logic total compactLinkRenderer tokens: 0

DOM fallback total ytd-guide-section-renderer tokens: 2

DOM fallback subscriptions CSS block /feed/subscriptions tokens: 1

DOM fallback subscriptions CSS block page-subtype="subscriptions" tokens: 1

DOM fallback subscriptions CSS block ytd-guide-collapsible-section-entry-renderer tokens: 1

DOM fallback subscriptions CSS block :has( tokens: 3

DOM fallback subscriptions CSS block /feed/history tokens: 1

DOM fallback subscriptions CSS block a[href^="/@"] tokens: 1

runtime hideSubscriptions fixtures: 6

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON Subscriptions decision | `js/filter_logic.js` has no `hideSubscriptions` token and no direct `guideEntryRenderer`, `compactLinkRenderer`, or Subscriptions decision. Subscriptions guide JSON passes through unchanged when only `hideSubscriptions` is enabled. | A `hideSubscriptions` contract that separates subscription guide sections, guide entries, collapsible creator rows, compact links, route tabs, mobile navigation links, and ordinary content rows by route and surface. |
| JSON guide-section traversal | `filter_logic.js` names `guideSectionRenderer` only as a whitelist container renderer. Ordinary keyword rules can remove a neighboring supported video row, but that removal is not owned by `hideSubscriptions`. | A renderer inventory policy that classifies guide-section containers and subscription entries separately from content rows and proves expected allow/block behavior by endpoint. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideSubscriptions`. `/youtubei/v1/guide` now bypasses `processData` with only `hideSubscriptions` enabled. | A route no-work budget that proves when `/guide`, `/browse`, `/search`, `/next`, and `/player` may parse/stringify, harvest only, mutate, or pass through for Subscriptions-only settings. |
| DOM fallback | DOM fallback owns visible hiding with `.yt-simple-endpoint[href^="/feed/subscriptions"]`, `ytd-browse[page-subtype="subscriptions"]`, and a conditional `:has()` guide-section selector that excludes history. The broad DOM boolean gate also treats `hideSubscriptions` as active work. | A JSON/DOM parity report for desktop guide sections, collapsible creator subscription lists, mini-guide links, mobile navigation links, browser `:has()` support, route-page hiding, and native YouTube surfaces. |
| Background compile and invalidation | Background storage reads and compiles `hideSubscriptions`. Background storage-change invalidation does not include `hideSubscriptions` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideSubscriptions` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideSubscriptions`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Subscriptions guide JSON sections pass through unchanged when only
`hideSubscriptions` is enabled.

`/youtubei/v1/guide` now bypasses `processData` with only
`hideSubscriptions` enabled.

The runtime fixture proves:

1. Subscriptions guide JSON sections and neighboring supported rows pass
   through unchanged when only `hideSubscriptions` is enabled.
2. Ordinary keyword rules can remove a neighboring supported row while
   Subscriptions guide JSON remains.
3. `/youtubei/v1/guide` now bypasses `processData` with only
   `hideSubscriptions` enabled, so the setting is not a no-work optimization
   boundary today.
4. `filter_logic.js` and seed active JSON rules have no hide-subscriptions
   decision.
5. Background reads and compiles the setting but storage-change invalidation
   omits it.
6. DOM fallback owns `.yt-simple-endpoint[href^="/feed/subscriptions"]`,
   `#sections > ytd-guide-section-renderer:has(ytd-guide-collapsible-section-entry-renderer):has(a[href^="/@"]):not(:has(a[href="/feed/history"]))`,
   and `ytd-browse[page-subtype="subscriptions"]`.

## Non-Completion Boundary

JSON-first hide-subscriptions filtering still needs hide-subscriptions
contracts, decision reports, renderer inventory policies, JSON/DOM
Subscriptions parity reports, DOM-only policy reports, route no-work budgets,
cache invalidation reports, route policies, settings parity reports, fixture
provenance, metric artifacts, and first-class hide-subscriptions authority
gates.

No `jsonFirstHideSubscriptionsContract`,
`jsonFirstHideSubscriptionsDecisionReport`,
`jsonFirstSubscriptionsRendererInventoryPolicy`,
`jsonFirstSubscriptionsJsonDomParityReport`,
`jsonFirstSubscriptionsDomOnlyPolicy`,
`jsonFirstSubscriptionsNoWorkBudget`,
`jsonFirstSubscriptionsCacheInvalidationReport`,
`jsonFirstSubscriptionsRoutePolicy`,
`jsonFirstSubscriptionsSettingsParityReport`,
`jsonFirstSubscriptionsFixtureProvenance`, or
`jsonFirstSubscriptionsMetricArtifact` exists in product runtime source yet.

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
