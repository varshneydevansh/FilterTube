# FilterTube JSON-First Filter Readiness Gate - Current Behavior - 2026-05-21

Status: audit-only current-behavior gate. Runtime behavior is unchanged.
This is not implementation readiness.

## Purpose

This register converts the current JSON path and rule-field audit into an
explicit gate for future JSON-first filtering work. It exists so a documented
JSON path, a `FILTER_RULES` path, or a consumed `rules.<field>` value is not
mistaken for permission to hide, allow, fetch, mutate, persist, prune DOM
fallback, prune network fallback, or claim native parity.

The immediate optimization boundary is:

```text
JSON-first can be a priority order only after each path/field/effect has a
route, surface, list-mode, identity-confidence, mutation-effect, no-work,
fixture-provenance, DOM-parity, and native-parity decision.
```

## Source Scope

| Source | Current fingerprint |
| --- | --- |
| `js/filter_logic.js` | 3,652 lines, 172,174 bytes, sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/seed.js` | 1,136 lines, 50,026 bytes, sha256 `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| Path authority | `docs/audit/FILTERTUBE_JSON_PATH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md` |
| Runtime gap register | `docs/audit/FILTERTUBE_JSON_RUNTIME_COVERAGE_GAP_REGISTER_2026-05-20.md` |
| Rule path register | `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md` |
| Rule field-effect register | `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md` |
| Settings mode source/effect | `docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md` |

## Current Source Facts

- `getByPath()` currently splits string paths on `.`. It does not normalize
  bracket-index path syntax such as `runs[0].text`; runtime rules use
  dot-index syntax such as `runs.0.text`.
- `docs/json_paths_encyclopedia.md` is evidence only. Runtime and build source
  do not load it as a generated manifest.
- `FILTER_RULES` is hand-authored, has no per-path provenance field, and still
  has documented direct-rule gaps.
- Rule-field coverage is now known, but field availability remains separate
  from effect authority: 11 rule fields, 9 consumer methods, 20 method-field
  pairs, and 63 `rules.<field>` references.
- `title`, `description`, `commentText`, `channelName`, `duration`,
  `publishedTime`, `viewCount`, and `metadataRows` can enter candidate search
  text.
- `viewCount` is metadata/search text only today. There is no current
  view-count threshold predicate, no `_extractViewCount()` method, and no
  `viewCountThreshold` authority.
- `videoId` is a join key rather than channel identity. It can connect to
  `videoChannelMap`, `videoMetaMap`, duration, published-time, and category
  lookup paths, but it is not channel-policy proof by itself.
- `_checkCategoryFilters()` can call `scheduleVideoMetaFetch(videoId, {
  needDuration: false, needDates: false, needCategory: true })` when category
  metadata is missing, so category JSON-first work needs a fetch budget.
- `processData()` in `js/filter_logic.js` harvests channel mappings before the
  `settings.enabled === false` skip. Harvest work and hide/allow mutation work
  must remain separate in future no-work claims.
- `js/seed.js` has harvest-only skip paths for some search/home/channel cases,
  but whitelist mode bypasses the old no-rule fast path and empty whitelist remains fail-closed.

## JSON-First Promotion Gate

| Gate row | Current evidence | Current status | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- |
| Normalized path syntax | Runtime uses dot-index paths; docs include bracket-index paths. | blocked | `jsonFirstPathSyntaxManifest` with generated runtime syntax and rejected unsupported syntax. |
| Renderer ownership | Direct rule keys and effective path rows are inventoried. | blocked | `jsonFirstRendererCoverageDecision` tying each renderer/field to endpoint and route. |
| Field-effect authority | Rule-field consumers are inventoried. | blocked | `jsonFirstFieldEffectDecision` with allowed effects per field. |
| Route/surface scope | Existing JSON and DOM behavior depends on home/search/watch/Shorts/Kids/YTM/playlist/comment context. | blocked | `jsonFirstRouteSurfaceReport` before any path mutates or prunes a renderer. |
| List-mode semantics | Blocklist, whitelist, disabled, and empty-list states diverge. | blocked | `jsonFirstListModeMatrix` for blocklist, whitelist, disabled, empty blocklist, empty whitelist, and future simultaneous allow/block states. |
| Identity confidence | JSON, learned maps, DOM extraction, and network fallback have different confidence levels. | blocked | `jsonFirstIdentityConfidenceReport` distinguishing UC id, handle, custom URL, display name, video-id join, and unknown. |
| Mutation effect | A path may mean remove renderer, preserve renderer, metadata harvest, map write, fetch, stats, restore, or no visible effect. | blocked | `jsonFirstMutationEffectReport` before any path becomes an effectful filter. |
| Category/network budget | Category metadata can schedule fetch work when missing. | blocked | `jsonFirstCategoryFetchBudget` and route/profile/rule-state fetch counters. |
| No-rule/no-work budget | Seed and engine paths can parse, harvest, queue, snapshot, or process even when no visible rule exists. | blocked | `jsonFirstNoWorkBudget` proving empty, disabled, and no-actionable-rule behavior. |
| Fixture provenance | Documentation and raw captures remain evidence maps. | blocked | `jsonFirstFixtureProvenance` with positive and negative sibling-visible fixtures. |
| DOM fallback parity | DOM fallback remains a separate last-mile authority for several sparse surfaces. | blocked | `jsonFirstDomParityReport` before deleting, broadening, or quieting DOM fallback work. |
| Native parity | Native runtime copies are synced through a separate wrapper/app boundary. | blocked | `jsonFirstNativeParityReport` before claiming app parity or pruning extension-only fallback. |
| Optimization budget | Performance claims are not current measurements. | blocked | `jsonFirstOptimizationBudget` with route, browser/device, rule-state, sample size, and artifact evidence. |

## First-Class JSON Filter Boundary

A JSON field can become a first-class filter only when the future report can
answer all of these for that exact path:

```text
rendererKey
runtimePath
documentedPath
endpoint
route
surface
profileType
listMode
ruleState
fieldEffect
identityConfidence
allowedEffects
forbiddenEffects
networkBudget
noWorkBudget
positiveFixture
negativeSiblingFixture
domParity
nativeParity
rollbackOrRestoreProof
```

Until then:

- do not auto-promote documented paths into `FILTER_RULES`,
- do not treat `viewCount` as a threshold predicate,
- do not treat `videoId` as channel identity,
- do not prune DOM fallback, network fallback, learned-map writes, or native
  sync paths because a JSON path exists,
- do not claim JSON-first completeness or performance improvement without a
  measured `jsonFirstOptimizationBudget`.

## Missing Runtime Authority Symbols

No runtime source symbol exists yet for:

```text
jsonFirstFilterReadinessGate
jsonFirstPathSyntaxManifest
jsonFirstRendererCoverageDecision
jsonFirstFieldEffectDecision
jsonFirstRouteSurfaceReport
jsonFirstListModeMatrix
jsonFirstIdentityConfidenceReport
jsonFirstMutationEffectReport
jsonFirstCategoryFetchBudget
jsonFirstNoWorkBudget
jsonFirstFixtureProvenance
jsonFirstDomParityReport
jsonFirstNativeParityReport
jsonFirstOptimizationBudget
```

## No-Work Optimization Crosswalk Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
and
`tests/runtime/json-first-no-work-optimization-crosswalk-current-behavior.test.mjs`
extend this gate from path/field promotion into concrete optimization
locations. The current blocked candidates are seed fetch pass-through, seed XHR
pass-through, engine harvest split, DOM lifecycle gate, quick-block lifecycle
gate, category metadata fetch gate, and metric artifact gate. This does not
approve implementation work; it records that JSON-first filtering needs a
no-work optimization budget covering parse, stringify, processData, harvest,
listener, observer, timer, network fetch, storage write, hide mutation, restore,
DOM parity, native parity, and metric artifact proof before runtime behavior is
changed.

## Implementation Locus Register Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md`
and
`tests/runtime/json-first-implementation-locus-register-current-behavior.test.mjs`
extend this gate from blocked promotion rows into exact source loci. The current
source anchors are `js/seed.js:263`, `js/seed.js:383`, `js/seed.js:666`,
`js/seed.js:757`, `js/filter_logic.js:154`, `js/filter_logic.js:426`,
`js/filter_logic.js:2126`, `js/filter_logic.js:3588`,
`js/content_bridge.js:1788`, `js/content_bridge.js:5932`,
`js/content_bridge.js:6333`, `js/content/dom_fallback.js:1933`,
`js/content/dom_fallback.js:2487`, `js/content/block_channel.js:1205`,
`js/content/block_channel.js:1979`, and `js/content/block_channel.js:3174`.
This does not approve implementation work; it records where future
`jsonFirstSourceLocusDecision`, `jsonFirstEndpointDecision`,
`jsonFirstActiveRuleReport`, `jsonFirstTransportBudget`,
`jsonFirstHarvestMutationBudget`, `jsonFirstMetadataFetchBudget`,
`jsonFirstDomActiveWorkReport`, `jsonFirstMenuLifecycleBudget`,
`jsonFirstQuickBlockLifecycleBudget`, and `jsonFirstMetricFixtureReport` proof
would have to attach.

## JSON-First Implementation Authority Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs`
consolidate this readiness gate with no-work, source-locus, whitelist,
candidate-binding, source-locus implementation, and first-optimization
readiness proof. The addendum pins 13 JSON-first implementation authority rows,
16 current JSON-first source anchors, 0 runtime JSON-first implementation
approvals, 0 runtime JSON-first promotion authority rows, 0 committed
JSON-first metric artifacts, 0 implementation-ready JSON-first rows, expected
runtime audit tests 4457, expected runtime audit pass: 4457, and expected
runtime audit fail 0. It keeps JSON-first filtering as an audit direction, not
runtime implementation authority.

## Runnable Proof

```bash
node --test tests/runtime/json-first-filter-readiness-gate-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first readiness gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
