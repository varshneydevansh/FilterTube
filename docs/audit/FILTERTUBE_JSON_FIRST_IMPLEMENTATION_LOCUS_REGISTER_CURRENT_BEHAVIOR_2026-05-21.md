# FilterTube JSON-First Implementation Locus Register - Current Behavior - 2026-05-21

Status: audit-only source-locus register. Runtime behavior is unchanged. This
is not an implementation patch, optimization patch, or permission to make JSON
filtering behavior changes.

## Purpose

This register answers the code-inspection part of the active audit: the
optimization work is being mapped to exact source loci before any code changes.
It complements the JSON-first readiness gate and no-work optimization crosswalk
by naming where future contracts would have to land.

The current boundary is:

```text
The codebase has identifiable JSON-first optimization loci, but none is
implementation-ready until it has endpoint, route, settings-mode, effect,
no-work, DOM parity, native parity, and metric proof.
```

## Source Scope

| Source | Current fingerprint |
| --- | --- |
| `js/seed.js` | 1,136 lines, 50,026 bytes, sha256 `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3,652 lines, 172,174 bytes, sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |
| `js/content_bridge.js` | 13,623 lines, 603,362 bytes, sha256 `c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c` |
| `js/content/dom_fallback.js` | 5,030 lines, 235,555 bytes, sha256 `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/content/block_channel.js` | 3,189 lines, 127,857 bytes, sha256 `c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_PATH_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_FILTER_LOGIC_RULE_FIELD_EFFECT_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Implementation Loci

| Source locus | Current behavior pinned | Future contract needed before optimization or first-class JSON behavior |
| --- | --- | --- |
| `js/seed.js:263` `shouldSkipEngineProcessing()` | Builds a partial no-work predicate from path, list mode, active content filters, active JSON rules, and route shape. Whitelist mode returns to engine processing. | `jsonFirstActiveRuleReport` and `jsonFirstEndpointDecision` that distinguish active JSON fields from DOM-only controls, whitelist fail-closed behavior, empty lists, and route-specific pass-through. |
| `js/seed.js:383` `processWithEngine()` | Queues when settings are missing, returns when disabled, performs harvest-only for skip cases, otherwise calls `FilterTubeEngine.processData()`. | `jsonFirstWorkDecision` that separates missing-settings queueing, disabled pass-through, harvest-only learning, mutation-capable processing, and snapshot storage. |
| `js/seed.js:666` `setupFetchInterception()` | Intercepts five YouTubei endpoint families, bypasses clone/parse when there is no active JSON work, parses active matching response bodies with `response.clone().json()`, then rebuilds responses with `JSON.stringify()`. | `jsonFirstSeedPassThroughBudget` with endpoint, route, active-rule, parse, stringify, response-rebuild, and positive active-rule fixtures. |
| `js/seed.js:757` `setupXhrInterception()` | Patches XHR `open`, `send`, `addEventListener`, and `removeEventListener`; marks endpoint-like URLs before no-work guards, and can override `response`/`responseText`. | `jsonFirstXhrPassThroughBudget` with mark/wrap/listener counts, response override proof, disabled/no-settings/no-active-rule pass-through, and endpoint parity with fetch. |
| `js/filter_logic.js:163` `getByPath()` | Splits runtime rule paths with `path.split('.')`; runtime dot-index syntax is separate from bracket-index documentation syntax. | `jsonFirstPathSyntaxManifest` that records generated runtime syntax, rejected unsupported syntax, and documented-path provenance. |
| `js/filter_logic.js:435` `FILTER_RULES` | Hand-authored renderer rules are the current JSON extraction surface. They are not generated from the documentation corpus and have no per-path provenance fields. | `jsonFirstRendererRuleManifest` tying renderer, endpoint, route, field effect, fixture, and documentation provenance before adding or deleting paths. |
| `js/filter_logic.js:2263` `_checkCategoryFilters()` | Category rules can schedule `scheduleVideoMetaFetch(videoId, { needDuration: false, needDates: false, needCategory: true })` when metadata is absent. | `jsonFirstCategoryFetchDecision` with selected categories, mode, cache hit/miss, fetch budget, DOM rerun budget, and network artifact proof. |
| `js/filter_logic.js:3588` `processData()` | Harvests channel data before the disabled-filtering skip, then mutates through `filter()` only after that. | `jsonFirstHarvestMutationBudget` separating passive learning, map writes, disabled mode, no-rule mode, and visible hide/allow mutations. |
| `js/content_bridge.js:1785` `scheduleVideoMetaFetch()` | Normalizes video ids, checks existing duration/date/category metadata, queues metadata fetch work, and is shared by JSON and DOM category/duration/date gaps. | `jsonFirstMetadataFetchBudget` with reason, need flags, dedupe, concurrency, retry, cache write, and route/profile/list-mode proof. |
| `js/content_bridge.js:6140` `initializeDOMFallback()` | Waits one second, applies DOM fallback, installs fallback menu buttons, and sets up debounced mutation-driven fallback work. | `jsonFirstDomLifecycleBudget` before pruning or quieting DOM fallback due to JSON coverage. |
| `js/content/dom_fallback.js:2117` `hasActiveDOMFallbackWork()` | Treats whitelist mode as active work, checks broad boolean UI controls, requires strict content-filter booleans and selected categories, but still lacks route and value-validity proof for duration/upload-date work. | `jsonFirstDomActiveWorkReport` with route, selector owner, visible rule state, content-control scope, and false-hide/leak fixtures. |
| `js/content/dom_fallback.js:2669` category metadata branch | DOM fallback schedules category metadata fetches and can mark pending category metadata for allow mode or home/search surfaces. | `jsonFirstDomCategoryParityReport` showing when DOM category work is required beside JSON filtering. |
| `js/content_bridge.js:6541` `ensureFallbackMenuButtons()` | Installs fallback menu CSS and later owns menu repair listeners/observer/timer work outside the JSON engine. | `jsonFirstMenuLifecycleBudget` separating explicit user action affordances from passive filtering work. |
| `js/content/block_channel.js:1212` and `js/content/block_channel.js:1993` | `isQuickBlockEnabled()` is the action gate, but `setupQuickBlockObserver()` still installs styles/listeners/observer/route sweep scheduling after the fixed `setTimeout()` at `js/content/block_channel.js:3185`. | `jsonFirstQuickBlockLifecycleBudget` with disabled, whitelist, enabled, mobile, desktop, and action-click fixtures. |

## First-Class JSON Contract Shape

A future source-locus implementation report must include at least:

```text
sourceLocus
sourceOwner
endpoint
route
surface
profileType
listMode
activeJsonFields
activeDomControls
currentWorkClass
allowedFutureWork
forbiddenFutureWork
parseBudget
stringifyBudget
harvestBudget
listenerBudget
observerBudget
timerBudget
networkBudget
storageBudget
hideBudget
restoreBudget
positiveFixture
negativeSiblingFixture
domParityFixture
nativeParityFixture
metricArtifact
rollbackPlan
```

## Current Risk Summary

- JSON-first optimization has real source loci, but the first implementation
  seam is not `FILTER_RULES` alone.
- Endpoint pass-through, XHR wrapper work, engine harvest, category metadata,
  DOM fallback lifecycle, fallback menu lifecycle, quick-block lifecycle, and
  metric artifacts all need separate budgets.
- A first-class JSON filter contract must describe work allowed and work
  forbidden, not only the JSON path string.
- No runtime behavior should change until the specific source locus being
  changed has positive, negative, parity, and metric proof.

## JSON-First Implementation Authority Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs`
classify these implementation loci as JSON-first authority blockers rather than
implementation permission. The addendum covers 16 current source anchors, 13
JSON-first authority rows, 7 no-work optimization candidates, 10
candidate-obligation binding rows, 12 first-optimization source-locus
implementation rows, 10 whitelist readiness gaps, and 0 implementation-ready
JSON-first rows.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstImplementationLocusRegister
jsonFirstSourceLocusDecision
jsonFirstEndpointDecision
jsonFirstActiveRuleReport
jsonFirstRendererRuleManifest
jsonFirstPathSyntaxManifest
jsonFirstWorkDecision
jsonFirstTransportBudget
jsonFirstHarvestMutationBudget
jsonFirstMetadataFetchBudget
jsonFirstDomActiveWorkReport
jsonFirstDomLifecycleBudget
jsonFirstDomCategoryParityReport
jsonFirstMenuLifecycleBudget
jsonFirstQuickBlockLifecycleBudget
jsonFirstMetricFixtureReport
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-implementation-locus-register-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first implementation locus register
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
