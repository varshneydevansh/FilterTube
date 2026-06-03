# FilterTube JSON-First Hide Home Feed Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior changed for no-work gating;
this is not an implementation patch, optimization patch, home-feed behavior
patch, DOM fallback patch, route policy patch, settings schema patch, or
selector cleanup patch.

This slice promotes the JSON-first feature audit into `hideHomeFeed` proof. It
isolates how the home-feed toggle currently crosses shared settings,
background compile, background cache invalidation, seed desktop-home no-work
predicates, JSON renderer traversal, DOM fallback CSS, route-scoped DOM
markers, mobile/desktop route behavior, and ordinary card pass-through
behavior.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |

## Boundary Counts

```text
hideHomeFeed boundary source files: 5
hideHomeFeed source/effect blocks: 9
seed active JSON rules block lines: 13
seed active JSON rules block bytes: 464
seed desktop home browse skip block lines: 37
seed desktop home browse skip block bytes: 1618
DOM fallback home-feed CSS rules block lines: 12
DOM fallback home-feed CSS rules block bytes: 622
DOM fallback home-feed marker block lines: 23
DOM fallback home-feed marker block bytes: 1286
DOM fallback active boolean keys block lines: 28
DOM fallback active boolean keys block bytes: 905
background boolean pass-through block lines: 35
background boolean pass-through block bytes: 3596
background storage refresh keys block lines: 16
background storage refresh keys block bytes: 461
settings_shared settings keys block lines: 38
settings_shared settings keys block bytes: 1031
settings_shared build compiled settings block lines: 54
settings_shared build compiled settings block bytes: 1916
filter_logic total hideHomeFeed tokens: 0
seed total hideHomeFeed tokens: 0
DOM fallback total hideHomeFeed tokens: 3
DOM fallback total data-filtertube-hidden-by-hide-home-feed tokens: 4
DOM fallback total ytd-browse home selector tokens: 4
DOM fallback total data-filtertube-route-home tokens: 9
DOM fallback total ytm-rich-grid-renderer tokens: 2
DOM fallback total ytm-rich-section-renderer tokens: 2
DOM fallback total ytm-item-section-renderer tokens: 7
DOM fallback total ytm-section-list-renderer tokens: 3
background total hideHomeFeed tokens: 13
settings_shared total hideHomeFeed tokens: 23
runtime hideHomeFeed fixtures: 5
```

## Current Behavior Pinned

| Boundary | Current behavior | Missing first-class field |
| --- | --- | --- |
| Shared settings | `settings_shared.js` lists, loads, passes, and compiles `hideHomeFeed`. | Settings parity report covering UI, V4 profile state, legacy values, route consumers, and compiled consumers. |
| Background compile | Background compiles `hideHomeFeed` through the boolean pass-through path. | Compile decision record with cache revision and route permission. |
| Background invalidation | Background storage-change invalidation includes `hideHomeFeed` today. | Refresh-key authority proving stale-cache behavior for each consumer path. |
| Seed active work | Seed JSON active-work detection does not include `hideHomeFeed`; the setting is not a JSON endpoint activation reason. | JSON no-work decision proving when home-feed settings should parse, harvest, mutate, or skip endpoint bodies. |
| Seed no-work gate | `hideHomeFeed` alone is not active JSON work, so YouTubei browse responses bypass JSON body work before clone/parse/stringify when no rule, whitelist mode, or content filter needs JSON. | JSON no-work decision proving when home-feed settings should parse, harvest, mutate, or skip endpoint bodies. |
| Seed desktop route skip | Desktop `/youtubei/v1/browse` home continuations with rich-grid content still have a harvest-only skip inside `processWithEngine`, but the earlier no-work gate now prevents that path for `hideHomeFeed` alone. | Home route policy that names desktop/mobile route differences and interaction with active JSON rules. |
| JSON renderer rules | `filter_logic.js` has no `hideHomeFeed` token and no whole-home-feed route decision. | JSON home-feed decision report and renderer inventory policy. |
| JSON hide decision | Home-feed JSON renderer objects pass through unchanged when only `hideHomeFeed` is enabled. | JSON/DOM parity report for home route, continuation shape, route, and sibling preservation. |
| DOM CSS | DOM CSS hides desktop `ytd-browse[page-subtype="home"]` rich grids and mobile `data-filtertube-route-home` browse/feed sections. | Shared selector target matrix and route-scoped CSS target policy. |
| DOM marker/restore | DOM fallback writes and clears `data-filtertube-hidden-by-hide-home-feed` only while `settings.hideHomeFeed` and `document.location.pathname === "/"` both hold. | Marker restore proof with route transition and sibling-visible fixtures. |

## Runtime Fixtures

The paired runtime test pins these current behaviors:

- `hideHomeFeed` does not remove JSON `richItemRenderer` home rows.
- `hideHomeFeed` does not remove JSON home section or lockup rows.
- desktop home browse continuations with only `hideHomeFeed` bypass JSON body
  work before clone/parse/stringify.
- Desktop `/youtubei/v1/browse` home continuations with rich-grid content bypass JSON body work when no active JSON work exists.
- desktop home browse continuations with `hideHomeFeed` plus an active keyword
  rule call the JSON engine because the keyword, not `hideHomeFeed`, activates
  JSON work.
- mobile home browse continuations with only `hideHomeFeed` also bypass JSON
  body work and return the original response body unchanged.

## Risk Interpretation

- Reliability: the user-visible setting is compiled and refreshed, but JSON
  endpoint filtering does not own a home-feed route decision.
- False-hide/leak: the home feed can be present in JSON and is hidden later by
  route-scoped DOM selectors and marker cleanup; JSON and DOM route decisions
  are not equivalent.
- Performance: desktop and mobile browse responses with only `hideHomeFeed`
  now avoid clone/parse/stringify and engine work; active keyword/channel,
  whitelist, content-filter, comment, Shorts, or category work still enters the
  JSON path.
- Code burden: settings, background, seed route/no-work logic, renderer
  traversal, DOM selectors, route attributes, and restore markers are split
  across five runtime owners.

## Non-Completion Boundary

This does not close JSON-first home-feed filtering. Product runtime source still
lacks first-class hide-home-feed contracts, decision reports, home-route
policies, JSON/DOM parity reports, DOM-only policy reports, no-work budgets,
marker restore proof, mobile parity reports, fixture provenance, and metric
artifacts. The following symbols are intentionally absent from product runtime
source today:

```text
jsonFirstHideHomeFeedContract
jsonFirstHideHomeFeedDecisionReport
jsonFirstHomeFeedRoutePolicy
jsonFirstHomeFeedJsonDomParityReport
jsonFirstHomeFeedDomOnlyPolicy
jsonFirstHomeFeedNoWorkBudget
jsonFirstHomeFeedMarkerRestoreProof
jsonFirstHomeFeedMobileParityReport
jsonFirstHomeFeedFixtureProvenance
jsonFirstHomeFeedMetricArtifact
```

## Validation

```text
node --test tests/runtime/json-first-hide-home-feed-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
