# FilterTube Content Control Active Work Matrix Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, JSON filter patch, DOM fallback patch, cache invalidation
patch, catalog patch, or settings schema patch.

This slice pins how the 29 user-facing content controls currently map to
runtime work decisions. It extends the catalog boundary proof by separating
storage/compile presence from actual work permission: seed JSON engine
predicates, filter-logic direct decisions, DOM fallback active gates, DOM style
rules, background cache invalidation, content bridge refresh, and StateManager
reload are not one shared control manifest today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Boundary Source Files

content control active-work matrix source files: 8

content control active-work source/effect blocks: 12

catalog groups: 7

catalog controls: 29

catalog runtime alias controls: 2

seed active JSON predicate controls: 2

filter_logic direct content-control decision controls: 2

DOM active gate controls: 25

DOM style controls: 26

background exact-runtime invalidation controls: 4

background alias-only invalidation controls: 1

background omitted invalidation controls: 24

content bridge refresh controls: 29

StateManager reload controls: 29

runtime content-control active-work matrix fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_controls_catalog.js` | 222 | 7822 | `780b35c8aa33161ccd6e489b0843f01d805620409715a50aaca0a0bf6cff7e10` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content/dom_fallback.js` | 5030 | 235555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6789 | 306239 | `618e41011a6031c7a4eb3d022c4612536942a7a58a3c41eb0fd7e31c29a60311` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Pinned Source Counts

seed JSON predicate helpers block lines: 38

seed JSON predicate helpers block bytes: 1331

seed process debug settings block lines: 7

seed process debug settings block bytes: 395

filter_logic Shorts/comments decision block lines: 182

filter_logic Shorts/comments decision block bytes: 9210

DOM fallback active boolean keys block lines: 29

DOM fallback active boolean keys block bytes: 941

DOM fallback content-control styles block lines: 459

DOM fallback content-control styles block bytes: 16337

background compiler storage-get block lines: 44

background compiler storage-get block bytes: 1408

background boolean pass-through block lines: 35

background boolean pass-through block bytes: 3596

background storage invalidation keys block lines: 16

background storage invalidation keys block bytes: 461

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

settings_shared settings keys block lines: 38

settings_shared settings keys block bytes: 1031

StateManager valid keys block lines: 33

StateManager valid keys block bytes: 1063

StateManager external reload keys block lines: 41

StateManager external reload keys block bytes: 1604

## Current Aggregate Matrix

| Owner | Current controls admitted | Controls omitted or split | Risk before optimization |
| --- | --- | --- | --- |
| Catalog | 29 UI controls in 7 groups. | `hideShorts`/`hideComments` are UI aliases for runtime `hideAllShorts`/`hideAllComments`. | A future first-class JSON manifest must preserve alias intent and profile/list-mode scope. |
| Seed JSON active predicate | Only `hideAllShorts` and `hideAllComments` from the catalog appear in `hasActiveJsonFilterRules`. Selected categories and enabled content filters are separate non-catalog JSON work predicates. | The other 27 catalog controls do not make a no-rule JSON work decision at this predicate. | JSON parse/stringify/no-work optimization cannot infer activity from catalog presence alone. |
| Filter logic direct decisions | Only `hideAllShorts` and `hideAllComments` are direct content-control decisions. | Watch, player, navigation, feed, search shelf, and affordance controls are not direct engine decisions. | JSON-first promotion needs per-renderer and per-field effect authority before adding more controls. |
| DOM fallback active gate | 25 catalog controls are active DOM fallback triggers. | `showQuickBlockButton`, `showBlockMenuItem`, `disableAutoplay`, and `disableAnnotations` are omitted from this gate. | DOM-only and affordance controls need separate lifecycle/action budgets, not just catalog membership. |
| DOM style writer | 26 catalog controls have content-control style branches. | `hideShorts`, `showQuickBlockButton`, and `showBlockMenuItem` are not style branches in `ensureContentControlStyles()`. | Style rules, JS card processing, and action affordances need separate restore and no-work proof. |
| Background compiler | Boolean pass-through covers all 29 controls, but direct storage-get covers 27. | Root `showQuickBlockButton` and `showBlockMenuItem` are not direct storage-get inputs in `getCompiledSettings()`. | Compile presence is not enough to prove invalidation, defaulting, or profile precedence. |
| Background invalidation | Exact runtime invalidation covers `hideAllShorts`, `hideHomeFeed`, `hideSponsoredCards`, and `hideMembersOnly`. | `hideComments` is alias-only; 24 catalog controls do not invalidate background cache by exact runtime key. | Cache freshness and first-class JSON decisions need a dirty-key policy before behavior changes. |
| Content bridge refresh | All 29 controls are watched. | Bridge refresh can compensate for background omissions but is a different owner. | A content script refresh is not proof that the background cache and DOM work budget are aligned. |
| StateManager reload | All 29 controls are watched or accepted through UI keys. | StateManager and background do not share one key manifest. | UI reload success cannot prove seed/background/DOM no-op correctness. |

## Per-Control Current Matrix

Columns: UI key, runtime key, seed JSON predicate, filter_logic direct decision,
DOM active gate, DOM style branch, background invalidation.

```text
hideShorts|hideAllShorts|seed-json|filter-logic|dom-active|dom-js|bg-exact
hideHomeFeed|hideHomeFeed|no-seed|no-filter|dom-active|dom-style|bg-exact
hideComments|hideAllComments|seed-json|filter-logic|dom-active|dom-style|bg-alias-only
hideSponsoredCards|hideSponsoredCards|no-seed|no-filter|dom-active|dom-style|bg-exact
hidePlaylistCards|hidePlaylistCards|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideMembersOnly|hideMembersOnly|no-seed|no-filter|dom-active|dom-style|bg-exact
hideMixPlaylists|hideMixPlaylists|no-seed|no-filter|dom-active|dom-style|bg-omitted
showQuickBlockButton|showQuickBlockButton|no-seed|no-filter|no-dom-active|no-dom-style|bg-omitted
showBlockMenuItem|showBlockMenuItem|no-seed|no-filter|no-dom-active|no-dom-style|bg-omitted
hideVideoSidebar|hideVideoSidebar|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideRecommended|hideRecommended|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideLiveChat|hideLiveChat|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideWatchPlaylistPanel|hideWatchPlaylistPanel|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideVideoInfo|hideVideoInfo|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideVideoButtonsBar|hideVideoButtonsBar|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideAskButton|hideAskButton|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideVideoChannelRow|hideVideoChannelRow|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideVideoDescription|hideVideoDescription|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideMerchTicketsOffers|hideMerchTicketsOffers|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideEndscreenVideowall|hideEndscreenVideowall|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideEndscreenCards|hideEndscreenCards|no-seed|no-filter|dom-active|dom-style|bg-omitted
disableAutoplay|disableAutoplay|no-seed|no-filter|no-dom-active|dom-style|bg-omitted
disableAnnotations|disableAnnotations|no-seed|no-filter|no-dom-active|dom-style|bg-omitted
hideTopHeader|hideTopHeader|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideNotificationBell|hideNotificationBell|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideExploreTrending|hideExploreTrending|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideMoreFromYouTube|hideMoreFromYouTube|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideSubscriptions|hideSubscriptions|no-seed|no-filter|dom-active|dom-style|bg-omitted
hideSearchShelves|hideSearchShelves|no-seed|no-filter|dom-active|dom-style|bg-omitted
```

## Current Behavior Boundaries

- JSON-engine control decisions are narrow today: `hideAllShorts` and
  `hideAllComments` are the only catalog-derived booleans admitted by both
  seed active JSON detection and direct `filter_logic.js` content-control
  decisions.
- Selected categories and enabled content filters are separate non-catalog JSON
  work predicates in `hasNetworkJsonWork()`, not catalog content-control rows.
- DOM fallback is broad but split: most visual controls enter the active gate,
  player disable controls have CSS branches but are not active-gate booleans,
  and quick-block/block-menu controls are action affordances instead of DOM row
  filters.
- Background compilation and background invalidation are not equivalent:
  compiled booleans include all catalog controls, while the storage-change
  invalidation listener only covers four exact runtime controls plus one alias
  comments key.
- Content bridge refresh and StateManager reload watch every catalog control,
  but that does not prove background cache freshness, seed active-rule
  decisions, or DOM no-op behavior.

## Runtime Proof

The runtime guard proves:

1. The catalog still exposes 29 controls in 7 groups.
2. Seed JSON active-work predicates include only `hideAllShorts` and
   `hideAllComments` from catalog controls; selected categories and enabled
   content filters are tracked as separate predicate helpers.
3. `filter_logic.js` direct content-control decisions include only
   `hideAllShorts` and `hideAllComments`.
4. DOM fallback active-work booleans include 25 controls, while DOM style
   branches cover 26 controls and omit different control families.
5. Background invalidation covers four exact runtime control keys, has one
   comments alias-only invalidation, and omits 24 controls.
6. Content bridge refresh and StateManager reload watch all 29 controls while
   no first-class runtime work matrix authority exists.

## Non-Completion Boundary

Content control active-work behavior still needs a runtime key manifest, JSON
work decisions, DOM work decisions, background invalidation policy,
affordance-work policy, player DOM-only policy, no-work budgets, positive and
negative fixtures, fixture provenance, metric artifacts, and a first-class JSON
promotion gate before catalog controls can be treated as implementation-ready.

No `contentControlActiveWorkMatrixContract`,
`contentControlJsonWorkDecision`, `contentControlDomWorkDecision`,
`contentControlRuntimeKeyManifest`, `contentControlNoWorkBudgetReport`,
`contentControlBackgroundInvalidationPolicy`,
`contentControlAffordanceWorkPolicy`, `contentControlPlayerDomOnlyPolicy`,
`contentControlOptimizationMetricArtifact`,
`contentControlActiveWorkFixtureProvenance`, or
`contentControlFirstClassJsonPromotionGate` exists in product runtime source
yet.
