# FilterTube First Optimization Patch Evidence Packet Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior evidence packet contract. Runtime behavior
is unchanged. This is not an implementation patch, optimization patch,
JSON-first behavior patch, whitelist patch, settings patch, metric patch,
lifecycle patch, diagnostic patch, or release patch.

## Purpose

The audit has found real optimization locations and a viable JSON-first
direction, but stop/go and whitelist-readiness proof both keep runtime behavior
changes blocked. This contract defines what the first future optimization patch
must prove before it can leave audit mode.

The current boundary is:

```text
First optimization evidence packet required: yes
Current runtime evidence packet exists: no
Implementation-ready optimization rows: 0
```

The contract applies equally to a whitelist optimization, JSON-first path
promotion, seed transport pass-through, lifecycle pruning, diagnostic logging
cleanup, or native/release rollout claim.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md` | Runtime optimization is NO-GO until a measured work-decision or metric-artifact patch exists. |
| `docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Whitelist optimization has 10 readiness gaps and 0 implementation-ready rows. |
| `docs/audit/FILTERTUBE_OPTIMIZATION_CANDIDATE_PRIORITY_REGISTER_CURRENT_BEHAVIOR_2026-05-24.md` | 12 candidates are source-backed; 6 are P0 prerequisites; 0 are implementation-ready. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_METRIC_WORK_DECISION_AUTHORITY_CURRENT_BEHAVIOR_2026-05-24.md` | Six P0 authority rows remain missing before optimization. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 route/surface metric obligations remain required before optimization. |
| `docs/audit/FILTERTUBE_JSON_FIRST_METRIC_ARTIFACT_GATE_CURRENT_BEHAVIOR_2026-05-22.md` | Runtime lacks a committed JSON-first metric artifact report. |
| `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_LOCUS_REGISTER_CURRENT_BEHAVIOR_2026-05-21.md` | Future proof must attach to exact source loci, owners, routes, surfaces, and effects. |
| `docs/audit/FILTERTUBE_JSON_FIRST_FILTER_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-21.md` | JSON-first promotion remains blocked until path, field, route, list-mode, identity, mutation, parity, and budget proof exists. |

## Current Counts

```text
first optimization evidence packet rows: 10
implementation-ready evidence packets: 0
candidate-obligation bindings ready: 0
required identity-scope fields: 12
required work-budget fields: 12
required fixture-parity fields: 8
required side-effect policy fields: 8
runtime behavior changed: no
not completion proof for optimization readiness
```

## Evidence Packet Gate Matrix

| Evidence id | Required proof | Current gap | Missing before implementation |
| --- | --- | --- | --- |
| `FT-EVIDENCE-00-candidate-obligation-binding` | One optimization candidate id, one metric obligation id, and one source locus must be named. | Current docs rank candidates and obligations separately; no runtime patch binds one candidate to one obligation. | `candidateId`, `obligationId`, `sourceLocus`, source owner, and implementation scope. |
| `FT-EVIDENCE-01-route-surface-mode-scope` | The patch must name exact route, surface, endpoint, profile type, list mode, rule state, and settings revision. | Current behavior is route/surface/list-mode split across seed, filter logic, DOM fallback, menu, quick-block, background, and settings owners. | Route/surface/list-mode report with disabled, empty, active, whitelist, and no-rule coverage. |
| `FT-EVIDENCE-02-metric-artifact` | The patch must emit or commit a metric artifact for the scoped work. | Current proof is source/count proof, debug timing, stats, and console diagnostics, not a route/sample/device artifact. | Parse, stringify, processData, harvest, listener, observer, timer, network, storage, hide, restore, diagnostic, elapsed, and byte counters. |
| `FT-EVIDENCE-03-positive-negative-fixtures` | The patch must include positive match, negative sibling-visible, no-rule, disabled, empty-list, and unrelated-surface fixtures. | Current fixtures prove many gaps, but no first patch packet groups the required positive and negative proof. | Positive fixture, negative sibling fixture, no-rule fixture, disabled fixture, empty-list fixture, and unrelated-surface fixture. |
| `FT-EVIDENCE-04-false-hide-leak-restore` | The patch must prove false-hide, leak, pending identity, restore, stale-marker, and cleanup behavior. | Whitelist, pending-hide, right-rail, selected-row, and sparse-surface proof remains split. | False-hide budget, leak budget, pending TTL, restore proof, stale-marker cleanup, and visible scaffold proof. |
| `FT-EVIDENCE-05-json-dom-native-parity` | The patch must prove JSON, DOM, and native/runtime parity for the exact surface. | JSON playlist rows, DOM selected rows, Kids/YTM/native paths, and sparse surfaces have different authorities. | JSON fixture, DOM parity fixture, native parity fixture, surface-specific no-regression proof, and release artifact boundary. |
| `FT-EVIDENCE-06-lifecycle-budget` | The patch must budget observers, listeners, timers, reruns, pending queues, metadata fetches, menu repair, and quick-block lifecycle work. | Lifecycle owners are split across content bridge, DOM fallback, quick-block, seed, background, and category metadata paths. | Listener/observer/timer budget, pending-hide budget, DOM rerun budget, metadata fetch budget, menu budget, and quick-block budget. |
| `FT-EVIDENCE-07-settings-mutation-profile` | The patch must prove storage, profile, lock/session, import, transition, backup, cache invalidation, and refresh side effects if settings can affect the scope. | Whitelist import, mode transition, sync, V3/V4 mirrors, cache invalidation, and refresh are separate mutation authorities. | Profile id, profile type, lock state, storage keys, V3/V4 mirror policy, backup trigger, cache invalidation, refresh, and rollback proof. |
| `FT-EVIDENCE-08-diagnostic-privacy` | The patch must account for diagnostic logging and privacy while measuring or removing logs. | Current runtime has 419 active console callsites without one diagnostic measurement policy. | Diagnostic budget, log owner, reason, route, profile, privacy class, redaction policy, debug gate, and metric replacement. |
| `FT-EVIDENCE-09-rollout-claim-boundary` | The patch must avoid public, release, native, or performance claims beyond the measured scope. | Core docs and native/release artifacts are separate claim surfaces and current dirty runtime changes do not implement optimization. | Public-claim gate, release artifact hash, native sync proof, browser/device scope, and rollback/monitoring note. |

## Required Identity Scope Fields

The first future optimization patch evidence packet should include:

```text
candidateId
obligationId
readinessId
sourceLocus
sourceOwner
route
surface
endpoint
profileType
listMode
ruleState
settingsRevision
```

## Required Work Budget Fields

```text
parseBudget
stringifyBudget
processDataBudget
harvestBudget
listenerBudget
observerBudget
timerBudget
networkBudget
storageBudget
hideBudget
restoreBudget
diagnosticBudget
```

## Required Fixture And Parity Fields

```text
positiveFixture
negativeSiblingFixture
noRuleFixture
disabledFixture
emptyListFixture
unrelatedSurfaceFixture
domParityFixture
nativeParityFixture
```

## Required Side-Effect Policy Fields

```text
falseHideBudget
leakBudget
pendingIdentityPolicy
staleMarkerCleanupPolicy
settingsMutationPolicy
lifecycleOwnerPolicy
diagnosticPrivacyPolicy
rolloutClaimPolicy
```

## Current Implementation Boundary

This contract does not approve the first patch. It defines the evidence packet
that a future patch must carry. Until a patch satisfies one row in this contract
with one candidate id, one obligation id, one readiness id when applicable, and
one metric artifact, runtime behavior remains in audit mode.

## First Optimization Implementation Readiness Gate Addendum

First optimization implementation readiness gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs`
fold this evidence packet contract into the first-optimization implementation
decision. The addendum pins 14 implementation readiness rows, 0 runtime first
optimization approvals, and 0 implementation-ready first optimization rows. It
keeps this prerequisite audit-only until one scoped future patch proves the
full chain of candidate, obligation, authority, evidence packet, binding,
artifact, source owner, collector insertion, no-work, side-effect, fixture
provenance, parity, rollout, and rollback proof.

## First Optimization Candidate Selection Boundary Addendum

First optimization candidate selection boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_CANDIDATE_SELECTION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-candidate-selection-boundary-current-behavior.test.mjs`
select `FT-BIND-00-metric-artifact-foundation` as the next audit-only work
packet without changing this evidence packet contract. The addendum pins 10
candidate selection rows, 1 selected audit work packet, 0 selected runtime
behavior patches, and 0 implementation-ready selected candidate rows. It keeps
runtime optimization blocked until a scoped metric artifact foundation packet
proves owner mapping, fixtures, no-work, side-effect, parity, diagnostic, and
rollout boundaries.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input for this first-optimization boundary. Current proof
pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
firstOptimizationPatchEvidencePacketContract
firstOptimizationPatchEvidencePacket
firstOptimizationCandidateObligationBinding
firstOptimizationMetricArtifactPacket
firstOptimizationFixtureParityPacket
firstOptimizationSideEffectBudgetPacket
firstOptimizationSettingsMutationPacket
firstOptimizationLifecycleBudgetPacket
firstOptimizationDiagnosticPrivacyPacket
firstOptimizationRolloutClaimPacket
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-patch-evidence-packet-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It keeps runtime optimization blocked
until a future patch provides the scoped evidence packet rather than only a
source change, path addition, local benchmark, or broad claim.

## Candidate Obligation Binding Matrix Addendum

Candidate obligation binding matrix addendum:
`docs/audit/FILTERTUBE_CANDIDATE_OBLIGATION_BINDING_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/candidate-obligation-binding-matrix-current-behavior.test.mjs`
turn the `FT-EVIDENCE-00-candidate-obligation-binding` contract row into a
current-behavior binding matrix. The addendum pins 10 binding rows, 12
optimization candidates referenced, 12 route/surface obligations referenced, 10
whitelist readiness rows referenced, 10 evidence packet rows referenced, and 0
implementation-ready bindings. It does not approve implementation; it confirms
that candidate-to-obligation planning is still missing metric artifacts,
fixture packets, side-effect budgets, parity proof, and rollout boundaries.

## First Optimization Metric Artifact Schema Addendum

First optimization metric artifact schema addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-artifact-schema-current-behavior.test.mjs`
turn `FT-EVIDENCE-02-metric-artifact` into a concrete first-patch schema. The
addendum pins 12 schema rows, 10 candidate bindings requiring metric artifacts,
12 route/surface obligations requiring metric artifacts, 1 evidence row
requiring a metric artifact, 0 committed first-optimization metric artifacts, 0
runtime metric collectors, and 0 implementation-ready metric artifacts. It does
not approve implementation; it defines the artifact shape a future evidence
packet must carry.

## First Optimization Metric Source-Owner Matrix Addendum

First optimization metric source-owner matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-source-owner-matrix-current-behavior.test.mjs`
map the `FT-EVIDENCE-02-metric-artifact` row to the runtime owners that would
have to produce each counter. The addendum pins 12 source-owner rows, 12 schema
rows covered, 14 runtime source files referenced, 10 owner families referenced,
0 source-owner rows with implemented collectors, and 0 implementation-ready
source-owner rows.

## First Optimization Metric Collector Insertion Gate Addendum

First optimization metric collector insertion gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-insertion-gate-current-behavior.test.mjs`
extends the `FT-EVIDENCE-02-metric-artifact` row from owner mapping to collector
insertion proof. The addendum pins 12 collector insertion gate rows, 12 metric
source-owner rows covered, 12 metric schema rows covered, 12 route/surface
obligations covered, 0 runtime collector insertion points approved, 0 collector
rows with no-work preservation proof, and 0 implementation-ready collector
rows.

## First Optimization Metric Collector Side-Effect Budget Matrix Addendum

First optimization metric collector side-effect budget matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-side-effect-budget-matrix-current-behavior.test.mjs`
extends `FT-EVIDENCE-02`, `FT-EVIDENCE-04`, `FT-EVIDENCE-05`,
`FT-EVIDENCE-06`, `FT-EVIDENCE-07`, `FT-EVIDENCE-08`, and `FT-EVIDENCE-09`
into exact collector side-effect budget requirements. The addendum pins 12
collector side-effect budget rows, 12 collector no-work preservation rows
covered, 12 collector insertion rows covered, 7 evidence side-effect rows
covered, 12 required work-budget fields covered, 12 route/surface obligations
covered, 0 runtime collector side-effect budgets approved, and 0
implementation-ready side-effect rows.

## First Optimization Metric Collector Fixture Provenance Matrix Addendum

First optimization metric collector fixture provenance matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-fixture-provenance-matrix-current-behavior.test.mjs`
extends `FT-EVIDENCE-01`, `FT-EVIDENCE-02`, `FT-EVIDENCE-03`,
`FT-EVIDENCE-04`, `FT-EVIDENCE-05`, and `FT-EVIDENCE-09` into exact collector
fixture provenance requirements. The addendum pins 12 collector fixture
provenance rows, 12 route/surface obligations covered, 10 candidate binding
rows covered, 6 evidence fixture/parity rows covered, 8 required
fixture/parity fields covered, 11 P0 capture traceability rows covered, 46
unique raw capture obligation paths covered, 0 runtime collector fixture
packets approved, and 0 implementation-ready fixture provenance rows.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
extends `FT-EVIDENCE-05` and `FT-EVIDENCE-09` into exact collector parity and
rollout boundaries. The addendum pins 12 collector parity rollout rows, 12
collector fixture provenance rows covered, 12 route/surface obligations
covered, 2 evidence parity rollout rows covered, 8 parity and release boundary
source docs covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
defines the future `parity-rollout.json` shape for this evidence packet without
creating the rollout packet, artifacts, runtime collectors, native sync changes,
release package changes, or public claims. The addendum pins 12 parity rollout
contract rows, 1 reserved parity rollout path covered, 0 committed parity
rollout files, 0 runtime metric collector approvals, and 0 implementation-ready
parity rollout contract rows. First-patch evidence remains audit-only until the
candidate, obligation, metric artifact, fixtures, side-effect budgets,
diagnostic privacy, rollout verification, and claim boundaries are proved.
