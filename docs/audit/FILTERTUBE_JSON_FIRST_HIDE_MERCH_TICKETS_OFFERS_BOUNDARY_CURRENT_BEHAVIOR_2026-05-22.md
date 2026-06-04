# FilterTube JSON-First Hide Merch Tickets Offers Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, optimization patch, Merch/Tickets/Offers
patch, watch-route policy patch, DOM fallback patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into
`hideMerchTicketsOffers` proof. It isolates how the watch video-info
Merch/Tickets/Offers child toggle currently crosses shared settings,
background compile, background cache invalidation, content storage refresh,
seed active-work predicates, JSON watch metadata renderers, DOM fallback CSS,
whitelist mode, the `hideVideoInfo` master toggle, and ordinary
`/youtubei/v1/next` endpoint behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |

## Evidence Counts

hideMerchTicketsOffers boundary source files: 6

hideMerchTicketsOffers source/effect blocks: 12

filter_logic watch primary metadata rules block lines: 10

filter_logic watch primary metadata rules block bytes: 431

filter_logic whitelist watch scaffolding block lines: 6

filter_logic whitelist watch scaffolding block bytes: 449

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 463

DOM fallback Merch/Tickets/Offers CSS rules block lines: 10

DOM fallback Merch/Tickets/Offers CSS rules block bytes: 274

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

settings_shared build compiled settings block lines: 63

settings_shared build compiled settings block bytes: 2376

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideMerchTicketsOffers tokens: 0

seed total hideMerchTicketsOffers tokens: 0

DOM fallback total hideMerchTicketsOffers tokens: 2

background total hideMerchTicketsOffers tokens: 12

settings_shared total hideMerchTicketsOffers tokens: 23

bridge_settings total hideMerchTicketsOffers token: 1

filter_logic total videoPrimaryInfoRenderer tokens: 2

filter_logic total videoSecondaryInfoRenderer tokens: 2

DOM fallback Merch/Tickets/Offers CSS block hideInfoMaster tokens: 1

DOM fallback Merch/Tickets/Offers CSS block #ticket-shelf tokens: 1

DOM fallback Merch/Tickets/Offers CSS block ytd-merch-shelf-renderer tokens: 1

DOM fallback Merch/Tickets/Offers CSS block #offer-module tokens: 1

DOM fallback Merch/Tickets/Offers CSS block #clarify-box tokens: 1

runtime hideMerchTicketsOffers fixtures: 7

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation changes |
| --- | --- | --- |
| JSON Merch/Tickets/Offers decision | `js/filter_logic.js` has no `hideMerchTicketsOffers` token. `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` have ordinary JSON renderer rules, so keyword/channel rules can remove them independently of the Merch/Tickets/Offers toggle. | A `hideMerchTicketsOffers` contract that separates visible merch, tickets, offers, and clarify chrome hiding from JSON watch metadata filtering and sibling-visible behavior. |
| Master toggle interaction | DOM fallback hides the Merch/Tickets/Offers selectors when `hideInfoMaster` is true or when `settings.hideMerchTicketsOffers` is true. `hideInfoMaster` itself is derived from blocklist-mode `hideVideoInfo`. | A child-control interaction report proving whether master and child toggles intentionally share selectors, list-mode rules, restore behavior, and metrics. |
| Whitelist mode | JSON watch metadata scaffolding is preserved in whitelist mode, but the explicit `settings.hideMerchTicketsOffers` DOM block is not directly gated by `listMode !== 'whitelist'`. Whitelist-mode JSON preservation does not imply DOM merch, tickets, offers, or clarify visibility if explicit `hideMerchTicketsOffers` is true. | A whitelist-mode report proving whether merch, tickets, offers, clarify, Ask button, description, owner/channel row, action buttons, metadata rows, and comment scaffolding stay visible when whitelist safety requires it. |
| Seed active JSON work | Seed JSON active-work detection does not include `hideMerchTicketsOffers`. `/youtubei/v1/next` now bypasses `processData` with only `hideMerchTicketsOffers` enabled because the no-active-JSON-work gate passes through before JSON parse. | A watch-route no-work budget that proves when `/next` may parse/stringify, harvest only, mutate, or pass through. |
| DOM fallback | DOM fallback owns the visible hide with `#ticket-shelf`, `ytd-merch-shelf-renderer`, `#offer-module`, and `#clarify-box`. | A JSON/DOM parity report for desktop and mobile merch/ticket/offer/clarify placement, renderer-backed commerce surfaces, and child-control overlaps. |
| Background compile and invalidation | Background storage reads and compiles `hideMerchTicketsOffers`. Background storage-change invalidation does not include `hideMerchTicketsOffers` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideMerchTicketsOffers` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideMerchTicketsOffers`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Fixtures

Watch Merch/Tickets/Offers JSON rows pass through unchanged when only
`hideMerchTicketsOffers` is enabled.

`/youtubei/v1/next` now bypasses `processData` with only
`hideMerchTicketsOffers` enabled.

1. JSON `videoPrimaryInfoRenderer` and `videoSecondaryInfoRenderer` rows pass
   through unchanged when only `hideMerchTicketsOffers` is enabled.
2. Ordinary keyword rules can remove a matching `videoPrimaryInfoRenderer` row
   while nonmatching watch metadata JSON remains; that removal is not a
   first-class `hideMerchTicketsOffers` decision.
3. Whitelist mode preserves `videoPrimaryInfoRenderer` and
   `videoSecondaryInfoRenderer` rows with an empty whitelist even when
   `hideMerchTicketsOffers` is enabled.
4. `/youtubei/v1/next` now bypasses `processData` with only
   `hideMerchTicketsOffers` enabled.
5. That same watch-next fixture performs no harvest-only skip for
   `hideMerchTicketsOffers`.
6. The DOM selector block proves `hideVideoInfo` master mode and
   `hideMerchTicketsOffers` share the Merch/Tickets/Offers hide selectors.
7. Product runtime source still lacks the first-class Merch/Tickets/Offers
   authority symbols listed below.

## Risk Notes

- Reliability risk: visible merch, tickets, offers, and clarify chrome are
  DOM-owned while JSON watch metadata rows remain independent, so renderer or
  DOM layout drift can create leaks.
- False-hide risk: explicit `hideMerchTicketsOffers` is not directly gated by
  `listMode !== 'whitelist'`, unlike some neighboring video-info child controls.
- Performance risk: watch-next fetches can still parse, traverse, and stringify
  JSON with only `hideMerchTicketsOffers` enabled even though there is no
  `hideMerchTicketsOffers` JSON decision.
- Code-burden risk: background compile, background invalidation, content bridge
  refresh, shared settings, seed active-work, JSON metadata renderer filtering,
  whitelist scaffolding preservation, master-toggle interaction, and DOM
  selectors all express part of the setting boundary independently.

## Missing Runtime Authority

No `jsonFirstHideMerchTicketsOffersContract`,
`jsonFirstHideMerchTicketsOffersDecisionReport`,
`jsonFirstMerchTicketsOffersRendererInventoryPolicy`,
`jsonFirstMerchTicketsOffersJsonDomParityReport`,
`jsonFirstMerchTicketsOffersDomOnlyPolicy`,
`jsonFirstMerchTicketsOffersWhitelistModeReport`,
`jsonFirstMerchTicketsOffersChildControlInteractionReport`,
`jsonFirstMerchTicketsOffersNoWorkBudget`,
`jsonFirstMerchTicketsOffersCacheInvalidationReport`,
`jsonFirstMerchTicketsOffersRoutePolicy`,
`jsonFirstMerchTicketsOffersSettingsParityReport`,
`jsonFirstMerchTicketsOffersFixtureProvenance`, or
`jsonFirstMerchTicketsOffersMetricArtifact` exists in product runtime source
yet.

## Implementation Boundary

This file and
`tests/runtime/json-first-hide-merch-tickets-offers-boundary-current-behavior.test.mjs`
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
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, content-control promotion, DOM selector
changes, no-work changes, native parity changes, or whitelist behavior changes.
