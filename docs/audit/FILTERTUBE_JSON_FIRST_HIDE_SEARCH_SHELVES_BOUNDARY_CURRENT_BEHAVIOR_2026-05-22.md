# FilterTube JSON-First Hide Search Shelves Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior changed for no-work gating. This is not an implementation patch,
optimization patch, search-shelves filtering patch, selector patch, cache
patch, or JSON renderer expansion.

This slice promotes the JSON-first feature audit into `hideSearchShelves`
proof. It pins the current code path where the setting is compiled and
refreshed, the DOM fallback owns visible search shelf hiding, the seed search
route uses harvest-only behavior when no ordinary rule is active, and search
shelf JSON remains governed by ordinary renderer title rules rather than a
first-class Search Shelves decision.

## Boundary Source Files

hideSearchShelves boundary source files: 6

hideSearchShelves source/effect blocks: 12

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |

## Pinned Source Counts

filter_logic shelfRenderer rule block lines: 3

filter_logic shelfRenderer rule block bytes: 103

filter_logic richShelfRenderer rule block lines: 3

filter_logic richShelfRenderer rule block bytes: 93

seed active JSON rules block lines: 13

seed active JSON rules block bytes: 464

seed search skip block lines: 48

seed search skip block bytes: 2431

DOM fallback search-shelves CSS rules block lines: 8

DOM fallback search-shelves CSS rules block bytes: 314

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

settings_shared search-shelves compile block lines: 1

settings_shared search-shelves compile block bytes: 51

content bridge storage refresh keys block lines: 44

content bridge storage refresh keys block bytes: 1263

filter_logic total hideSearchShelves tokens: 0

seed total hideSearchShelves tokens: 0

DOM fallback total hideSearchShelves tokens: 2

background total hideSearchShelves tokens: 12

settings_shared total hideSearchShelves tokens: 23

bridge_settings total hideSearchShelves token: 1

filter_logic total shelfRenderer tokens: 2

filter_logic total richShelfRenderer tokens: 2

filter_logic total gridShelfViewModel tokens: 0

seed total shelfRenderer token: 1

seed total richShelfRenderer token: 1

seed total gridShelfViewModel token: 1

DOM fallback total ytd-shelf-renderer tokens: 13

DOM fallback total ytd-horizontal-card-list-renderer tokens: 2

DOM fallback search-shelves CSS block ytd-shelf-renderer tokens: 1

DOM fallback search-shelves CSS block ytd-horizontal-card-list-renderer tokens: 1

DOM fallback search-shelves CSS block #primary > .ytd-two-column-search-results-renderer tokens: 2

runtime hideSearchShelves fixtures: 7

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof before implementation |
| --- | --- | --- |
| JSON search shelves decision | `js/filter_logic.js` has no `hideSearchShelves` token. `shelfRenderer` and `richShelfRenderer` have ordinary title rules, so search shelf JSON passes through unchanged when only `hideSearchShelves` is enabled. | A `hideSearchShelves` contract that separates search shelf containers, horizontal card lists, grid shelf models, rich shelves, refinement shelves, and ordinary search result rows by route and surface. |
| JSON shelf renderer traversal | `filter_logic.js` can remove a whole `shelfRenderer` or `richShelfRenderer` when its title matches an ordinary keyword. That removal is not owned by `hideSearchShelves` and can remove nonmatching children inside the shelf container. | A renderer inventory policy that classifies shelf containers, shelf titles, child rows, grid shelf variants, and sibling visibility separately. |
| Seed search route no-work | Seed JSON active-work detection does not include `hideSearchShelves`. On `/results`, `/youtubei/v1/search` now bypasses JSON body work before clone/parse/stringify and does not call `processData` when only `hideSearchShelves` is enabled. If an ordinary keyword rule is active, the same search fetch enters `processData`. | A route no-work budget that proves when `/search`, `/browse`, `/next`, `/player`, and initial data may parse, harvest, mutate, or pass through for Search Shelves-only settings. |
| DOM fallback | DOM fallback owns visible hiding with `#primary > .ytd-two-column-search-results-renderer ytd-shelf-renderer` and `#primary > .ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer`. The broad DOM boolean gate also treats `hideSearchShelves` as active work. | A JSON/DOM parity report for desktop search shelves, horizontal card lists, rich shelves, grid shelf view models, mobile search surfaces, continuation responses, and browser selector support. |
| Background compile and invalidation | Background storage reads and compiles `hideSearchShelves`. Background storage-change invalidation does not include `hideSearchShelves` today. | A cache invalidation report that either adds the dependency or explicitly classifies it as DOM-only with a bounded refresh path. |
| Content bridge refresh | `js/content/bridge_settings.js` includes `hideSearchShelves` in its storage refresh key list. This can refresh active content scripts but does not make the background compiler invalidation list complete. | A settings parity report across background, content bridge, shared settings, StateManager, and UI save paths. |
| Shared settings | `js/settings_shared.js` lists and compiles `hideSearchShelves`. | A schema-level owner for this flag, including profile/list-mode behavior and persistence revision evidence. |

## Runtime Proof

Search shelf JSON sections pass through unchanged when only
`hideSearchShelves` is enabled.

`/youtubei/v1/search` bypasses JSON body work and does not call `processData` with only `hideSearchShelves` enabled on `/results`.

The runtime fixture proves:

1. Search shelf JSON sections and neighboring supported rows pass through
   unchanged when only `hideSearchShelves` is enabled.
2. Ordinary keyword rules can remove a matching `shelfRenderer` while
   Search Shelves JSON control remains unrelated to that removal.
3. `/youtubei/v1/search` bypasses clone/parse/stringify and does not call
   `processData` with only `hideSearchShelves` enabled on `/results`.
4. `/youtubei/v1/search` enters `processData` when an ordinary keyword rule
   is active with `hideSearchShelves` enabled.
5. `filter_logic.js` and seed active JSON rules have no hide-search-shelves
   decision.
6. Background reads and compiles the setting but storage-change invalidation
   omits it.
7. DOM fallback owns
   `#primary > .ytd-two-column-search-results-renderer ytd-shelf-renderer`
   and
   `#primary > .ytd-two-column-search-results-renderer ytd-horizontal-card-list-renderer`.

## Non-Completion Boundary

JSON-first hide-search-shelves filtering still needs hide-search-shelves
contracts, decision reports, renderer inventory policies, JSON/DOM Search
Shelves parity reports, DOM-only policy reports, route no-work budgets, cache
invalidation reports, route policies, settings parity reports, fixture
provenance, metric artifacts, and first-class hide-search-shelves authority
gates.

No `jsonFirstHideSearchShelvesContract`,
`jsonFirstHideSearchShelvesDecisionReport`,
`jsonFirstSearchShelvesRendererInventoryPolicy`,
`jsonFirstSearchShelvesJsonDomParityReport`,
`jsonFirstSearchShelvesDomOnlyPolicy`,
`jsonFirstSearchShelvesNoWorkBudget`,
`jsonFirstSearchShelvesCacheInvalidationReport`,
`jsonFirstSearchShelvesRoutePolicy`,
`jsonFirstSearchShelvesSettingsParityReport`,
`jsonFirstSearchShelvesFixtureProvenance`, or
`jsonFirstSearchShelvesMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
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
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
