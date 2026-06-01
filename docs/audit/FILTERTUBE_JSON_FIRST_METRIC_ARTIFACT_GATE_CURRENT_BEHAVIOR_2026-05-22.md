# FilterTube JSON-First Metric Artifact Gate - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.

This slice pins the metric artifact gap behind JSON-first optimization work.
The codebase inspection is finding real optimization locations, but today the
runtime has debug timing, user-facing saved-time stats, timeout constants, and
console diagnostics rather than a committed measurement artifact contract.

This is a blocker for making JSON a first-class filter surface in the strong
engineering sense: promotion needs route/surface/list-mode fixtures plus
measured parse, stringify, traversal, listener, observer, timer, fetch, storage,
hide, and restore budgets.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/content/dom_fallback.js` | 4838 | 228332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/content/block_channel.js` | 3175 | 127396 | `1b6fffa249a746c01686df0d6a05dc4b770a6f0c5ded08b78a7043c11e9cdd83` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/settings_shared.js` | 1181 | 57535 | `9710ebb445ba11cc45fc98aced765d298226a8cd4a003600e106f908abc2162c` |
| `docs/audit/FILTERTUBE_PERFORMANCE_CLAIM_EVIDENCE_BOUNDARY_2026-05-20.md` | 116 | 6248 | `f2559ab18d3331b6a5325a767491d8b9848a90b31a07fa0c81256612b0407e00` |
| `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md` | 273 | 16005 | `97759360c5310b9931c0efa071652a95469ac26a328912ae91ade87ff0087ba0` |

## Runtime Instrumentation Counts

These counts cover the nine runtime files listed above.

```text
metric artifact boundary files: 11
runtime metric boundary source files: 9
metric source/effect blocks: 10
performance.now callsites: 0
console.time callsites: 0
console.timeEnd callsites: 0
Date.now callsites: 82
debugStatsEnabled token occurrences: 5
statsBySurface token occurrences: 21
recordTimeSaved token occurrences: 1
console.log token occurrences: 180
console.debug token occurrences: 27
console.warn token occurrences: 101
setTimeout callsites: 82
setInterval callsites: 1
MutationObserver token occurrences: 23
requestAnimationFrame token occurrences: 15
fetch callsites: 12
XMLHttpRequest token occurrences: 2
jsonFirstMetricArtifactReport token occurrences: 0
performanceClaimAuthority token occurrences: 0
runtimeMetricSample token occurrences: 0
routeWorkBudgetReport token occurrences: 0
runtime behavior changed: no
```

## Source And Effect Blocks

| Block | File | Start line | Lines | Bytes | Current boundary |
| --- | --- | ---: | ---: | ---: | --- |
| `seedEngineDebugTiming` | `js/seed.js` | 437 | 43 | 2292 | Debug-only engine timing uses `Date.now()` and `JSON.stringify(...).length`; it logs size/time only when seed debug is enabled and does not persist a metric artifact. |
| `filterLogicProcessTiming` | `js/filter_logic.js` | 3434 | 34 | 1239 | `processData()` measures filter elapsed time with `Date.now()` and logs blocked count through `_log`; it does not emit route/surface/sample metadata. |
| `stateManagerEnrichmentTiming` | `js/state_manager.js` | 639 | 58 | 2072 | Channel enrichment logs start, duration, and randomized backoff only when `window.__filtertubeDebug` is true. |
| `backgroundIdentityBudgetConstants` | `js/background.js` | 926 | 20 | 985 | Identity fetch constants define stream limits, timeout, caches, and pending maps, but not metric output. |
| `backgroundShortsIdentityFetchBudget` | `js/background.js` | 2879 | 67 | 2543 | Shorts identity fetch uses timeout and partial-stream limits with debug diagnostics, not committed latency or byte artifacts. |
| `backgroundKidsWatchIdentityFetchBudget` | `js/background.js` | 2980 | 94 | 3605 | Kids watch identity fetch dedupes pending work and applies preview limits, with no sample/report artifact. |
| `backgroundWatchIdentityFetchBudget` | `js/background.js` | 3074 | 94 | 3678 | Watch identity fetch uses cache, pending-map, timeout, and preview-limit behavior without a route metric report. |
| `handleResolverActiveFetchBudget` | `js/content/handle_resolver.js` | 133 | 150 | 5256 | Handle resolution has storage lookup, pending sentinel, optional background-only path, direct fetch path, and a 250 ms DOM rerun timer, but no work-budget artifact. |
| `contentBridgeStatsMetricBlock` | `js/content_bridge.js` | 3708 | 213 | 7246 | User-facing saved-time stats estimate hidden content time and write element attributes; these are product stats, not performance measurement samples. |
| `contentBridgeSaveStatsBlock` | `js/content_bridge.js` | 3921 | 36 | 1109 | Stats persistence writes `statsBySurface` and legacy `stats` for Main; it does not record JSON/DOM work counters. |

## Current Boundary Facts

- `performance.now()`, `console.time()`, and `console.timeEnd()` are absent from
  the pinned runtime scope.
- Seed debug timing can count stringify size and elapsed engine time, but only
  inside a debug branch and only as console output.
- Filter logic elapsed time and blocked count are debug-log facts, not stored
  measurement artifacts with route, surface, profile, list mode, or sample size.
- StateManager channel enrichment duration is debug-only and tied to resolver
  queue behavior, not a JSON-first filter metric.
- Background identity fetches have timeout and stream-limit budgets, but those
  constants do not prove latency distributions, cache hit rates, or resolver
  avoidance on a route.
- Content stats (`stats`, `statsBySurface`, and `data-filtertube-time-saved`)
  estimate saved watch time for hidden content. They should not be treated as
  CPU, parse, selector, network, storage, or paint performance metrics.
- Existing performance docs correctly separate historical claims from measured
  proof, but the runtime still lacks a named metric artifact report.

## Required Future Metric Artifact

A future JSON-first optimization can be promoted only after a committed artifact
records at least:

```text
metricId
sourceOwner
route
surface
profileType
listMode
ruleState
browser
deviceClass
sampleSize
endpoint
jsonPathClass
activeJsonFields
activeDomSelectors
parseCount
stringifyCount
processDataCount
harvestCount
listenerCount
observerCount
timerCount
networkFetchCount
storageReadCount
storageWriteCount
hideMutationCount
restoreMutationCount
elapsedMs
bytesRead
bytesWritten
positiveFixture
negativeSiblingFixture
domParityFixture
nativeParityFixture
artifactPath
```

## Missing Future Authority

No `jsonFirstMetricArtifactGate`, `jsonFirstMetricArtifactReport`,
`jsonFirstRuntimeMetricSample`, `jsonFirstRouteWorkBudgetReport`,
`jsonFirstOptimizationMeasurementFixture`,
`jsonFirstPerformanceClaimAuthority`, `jsonFirstNoWorkMetricArtifact`,
`jsonFirstDomMetricParityReport`, `jsonFirstResolverMetricBudget`, or
`jsonFirstStorageMetricBudget` exists in product runtime source yet.

Executable proof for this current boundary lives in:

```bash
node --test tests/runtime/json-first-metric-artifact-gate-current-behavior.test.mjs
```

## First Optimization Metric Artifact Schema Addendum

First optimization metric artifact schema addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-artifact-schema-current-behavior.test.mjs`
turn the metric artifact gate into a first-patch schema. The addendum pins 12
schema rows, 10 candidate bindings requiring metric artifacts, 12 route/surface
obligations requiring metric artifacts, 1 evidence row requiring a metric
artifact, 0 committed first-optimization metric artifacts, 0 runtime metric
collectors, and 0 implementation-ready metric artifacts. It does not add
instrumentation; it keeps JSON-first optimization blocked until a future scoped
artifact proves route, surface, mode, source, work counters, fixtures, side
effects, parity, diagnostics, and rollout boundaries together.

## First Optimization Metric Source-Owner Matrix Addendum

First optimization metric source-owner matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-source-owner-matrix-current-behavior.test.mjs`
map the metric gate's debug/stat/logging source blocks to concrete owner rows.
The addendum pins 12 source-owner rows, 12 schema rows covered, 14 runtime
source files referenced, 10 owner families referenced, 0 source-owner rows with
implemented collectors, and 0 implementation-ready source-owner rows.

## First Optimization Metric Collector Insertion Gate Addendum

First optimization metric collector insertion gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs`
keeps the metric artifact gate closed at the insertion layer. The addendum pins
12 collector insertion gate rows, 12 metric source-owner rows covered, 12
metric schema rows covered, 12 route/surface obligations covered, 0 runtime
collector insertion points approved, 0 collector rows with no-work preservation
proof, and 0 implementation-ready collector rows.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first metric artifact gate can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
