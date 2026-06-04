# FilterTube P0 Optimization Metric Work Decision Authority - Current Behavior - 2026-05-24

Status: audit-only current-behavior authority gap. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, metric patch, JSON-first
behavior patch, whitelist patch, lifecycle patch, logging patch, or release patch.

## Purpose

The optimization priority register ranked the first implementation blockers. This
slice turns the P0 blockers into one concrete authority boundary: before
FilterTube optimizes recent whitelist behavior or promotes JSON as a first-class
filter surface, the runtime needs a metric artifact plus a unified work decision.

The current boundary is:

```text
No P0 optimization candidate is implementation-ready.
The runtime does not have one report that decides work, measures work, and ties
that decision to route, surface, endpoint, profile, list mode, rule state,
fixtures, side effects, and metric artifacts.
```

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md` | 12 source-backed candidates, 6 P0 prerequisites, 0 implementation-ready candidates. |
| `docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md` | Runtime scope has 0 `performance.now()` callsites, 0 `console.time()` callsites, 82 `Date.now()` callsites, 82 `setTimeout` callsites, and no first-class metric artifact report. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md` | Seed, filter engine, DOM fallback, fallback menu, quick-block, and category metadata use separate active-work predicates. |
| `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Disabled mode harvests first, empty blocklist preserves, empty whitelist fail-closes, unknown mode falls back to blocklist, and conflicts are mode-local. |
| `docs/audit/FILTERTUBE_RUNTIME_DIAGNOSTIC_LOGGING_POLICY_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 419 active `console.*` callsites exist without a first-class diagnostic privacy, redaction, no-work, or metric-replacement policy. |

## Current Counts

```text
P0 optimization authority rows: 6
P0 rows implementation-ready: 0
P0 rows with metric artifact authority: 0
P0 rows with unified work decision authority: 0
P0 rows with route/surface/list-mode fixture authority: 0
runtime behavior changed: no
not completion proof for optimization authority
```

## P0 Authority Matrix

| Authority row | Current evidence | Why it blocks optimization | Missing authority before implementation |
| --- | --- | --- | --- |
| Metric artifact authority | Performance proof is currently source/count proof; runtime has debug timing and product stats, not route/sample/device artifacts. | Without committed metrics, a change can reduce one local cost while increasing seed, DOM, network, storage, or logging cost elsewhere. | `jsonFirstMetricArtifactReport` with route, surface, endpoint, list mode, sample size, counters, elapsed time, bytes, fixture ids, and artifact path. |
| Seed transport work decision | Fetch and XHR endpoint interception can parse, wrap, and rebuild before no-settings or disabled decisions prove pass-through. | Pass-through optimization can break active JSON mutation or leave a second transport still doing body/listener work. | `jsonFirstTransportWorkDecision` covering fetch and XHR together with parse/stringify/wrapped-listener counters. |
| Harvest versus mutation decision | `processData()` harvests before the disabled skip; seed skip branches can call `harvestOnly()`. | Removing harvest can break learned identity and menu actions; preserving it blindly keeps disabled/no-rule cost. | `jsonFirstHarvestMutationDecision` separating disabled, no-rule harvest, map-write provenance, and mutation-free pass-through. |
| List-mode and whitelist work decision | Empty blocklist, empty whitelist, unknown mode, blocklist-with-whitelist rows, and whitelist-with-blocklist rows have distinct current behavior. | Recent whitelist optimization cannot be safe while empty whitelist false-hide, dormant block rows, and conflict precedence are local branch behavior. | `jsonFirstListModeWorkDecision` with empty blocklist, empty whitelist, unknown mode, conflict, comments, and simultaneous allow/block policies. |
| Lifecycle owner work decision | DOM fallback, fallback menu, quick-block, category metadata, prefetch, and pending whitelist work have separate predicates and timers. | JSON-first endpoint savings can be erased by page-resident observers/listeners/timers or by deleting sparse-surface fallback work too early. | `jsonFirstLifecycleWorkDecision` with DOM/menu/quick/category owner budgets, pause policy, teardown policy, and DOM parity fixtures. |
| Diagnostic measurement policy | 419 active console callsites include page-runtime, background identity repair, JSON filter, import/export, and build/release diagnostics. | Console diagnostics can distort optimization measurements and expose identity/import data while metrics are being collected. | `jsonFirstDiagnosticMeasurementPolicy` with debug gates, privacy class, redaction, console budget, and metric replacement report. |

## Minimum Future Report Shape

A future first implementation patch should produce one report per optimized
route/surface combination with at least:

```text
candidateId
sourceOwner
route
surface
endpoint
profileType
listMode
extensionEnabled
ruleState
jsonRuleState
domRuleState
contentFilterState
categorySelectedState
whitelistState
workAllowed
workForbidden
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
diagnosticLogCount
elapsedMs
bytesRead
bytesWritten
positiveFixture
negativeFixture
siblingVisibleFixture
domParityFixture
nativeParityFixture
restoreFixture
artifactPath
```

## Current Implementation Boundary

The P0 gate is not saying optimization is blocked forever. It says the first
optimization implementation must be structured around measurement and one
work-decision model, rather than around a single symptom such as one fetch path,
one observer, one whitelist branch, or one console callsite.

## Route Surface Fixture Matrix Addendum

P0 optimization route surface metric fixture matrix addendum:
`docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/p0-optimization-route-surface-metric-fixture-matrix-current-behavior.test.mjs`
turn this P0 gate into 12 exact metric fixture obligations. That addendum is
still audit-only; it does not make any optimization row implementation-ready.

## First Optimization Implementation Readiness Gate Addendum

First optimization implementation readiness gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs`
fold this P0 work authority matrix into the first-optimization implementation
decision. The addendum pins 14 implementation readiness rows, 0 runtime first
optimization approvals, and 0 implementation-ready first optimization rows. It
keeps this prerequisite audit-only until one scoped future patch proves the
full chain of candidate, obligation, authority, evidence packet, binding,
artifact, source owner, collector insertion, no-work, side-effect, fixture
provenance, parity, rollout, and rollback proof.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
p0OptimizationMetricWorkDecisionAuthority
p0OptimizationMetricWorkDecisionReport
jsonFirstMetricArtifactReport
jsonFirstTransportWorkDecision
jsonFirstHarvestMutationDecision
jsonFirstListModeWorkDecision
jsonFirstLifecycleWorkDecision
jsonFirstDiagnosticMeasurementPolicy
jsonFirstOptimizationCandidateId
jsonFirstOptimizationRouteSurfaceMetric
jsonFirstOptimizationSideEffectBudget
jsonFirstOptimizationFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/p0-optimization-metric-work-decision-authority-current-behavior.test.mjs --test-reporter=spec
```

This authority matrix is not a completion claim. It keeps optimization and
JSON-first behavior changes blocked until P0 measurement, work-decision,
list-mode, lifecycle, diagnostic, side-effect, and fixture evidence exists.

## First Optimization Metric Collector Insertion Gate Addendum

First optimization metric collector insertion gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs`
turn the P0 authority rows into collector insertion boundaries. The addendum
pins 12 collector insertion gate rows, 12 metric source-owner rows covered, 12
metric schema rows covered, 12 route/surface obligations covered, 0 runtime
collector insertion points approved, 0 collector rows with no-work preservation
proof, and 0 implementation-ready collector rows. It keeps optimization blocked
until a collector can be inserted without changing the no-work and side-effect
states being measured.

## First Optimization Metric Collector No-Work Preservation Matrix Addendum

First optimization metric collector no-work preservation matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs`
turn the P0 authority rows into collector no-work preservation requirements.
The addendum pins 12 collector no-work preservation rows, 12 collector insertion
rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter
groups covered, 12 route/surface obligations covered, 0 runtime collector
no-work proofs approved, and 0 implementation-ready collector no-work rows. It
keeps optimization blocked until measurement preserves disabled, no-rule,
empty-list, lifecycle, network, storage, visual, diagnostic, and rollout states.

## First Optimization Metric Collector Side-Effect Budget Matrix Addendum

First optimization metric collector side-effect budget matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs`
turn the P0 authority rows into collector side-effect budget requirements. The
addendum pins 12 collector side-effect budget rows, 12 collector no-work
preservation rows covered, 12 collector insertion rows covered, 7 evidence
side-effect rows covered, 12 required work-budget fields covered, 12
route/surface obligations covered, 0 runtime collector side-effect budgets
approved, and 0 implementation-ready side-effect rows. It keeps optimization
blocked until measurement proves explicit side-effect budgets for settings,
artifacts, transport, engine, DOM, lifecycle, network, storage, visual,
whitelist, diagnostic, and rollout claims.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 optimization work-decision authority
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
