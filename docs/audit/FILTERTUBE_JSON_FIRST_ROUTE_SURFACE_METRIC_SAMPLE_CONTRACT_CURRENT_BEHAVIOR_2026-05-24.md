# FilterTube JSON-First Route Surface Metric Sample Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface metric sample
contract. Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, metric collector patch, JSON-first behavior patch,
whitelist patch, settings patch, lifecycle patch, diagnostic patch, native sync
patch, release patch, public claim patch, committed route/surface metric
artifact, persisted TAP output, artifact-root creation, or raw-capture
promotion.

## Purpose

The JSON-first route/surface metric artifact path boundary reserves
`docs/audit/artifacts/json-first/route-surface-metric-artifact/metric-sample.json`
for a future route/surface measurement sample. This contract defines the first
route/surface-specific per-file metric artifact contract without creating that
file. It narrows the generic first-optimization metric sample contract to the
JSON-first route/surface scope while keeping runtime implementation authority
at NO-GO.

The current boundary is:

```text
Reserved route/surface metric sample path: docs/audit/artifacts/json-first/route-surface-metric-artifact/metric-sample.json
Related first-optimization foundation metric sample path: docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json
Committed route/surface metric sample files: 0
Committed route/surface metric artifact files: 0
Runtime route/surface metric sample approval exists: no
Runtime route/surface metric artifact approval exists: no
Runtime metric collector approval exists: no
Method semantic proof gap files covered: 63
Method semantic proof gap lexical callables covered: 5473
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5473
Implementation-ready JSON-first route/surface metric sample contract rows: 0
```

This sample contract is deliberately narrower than the first-optimization
metric foundation sample. The future route/surface sample must bind one
route/surface obligation, endpoint family, renderer/surface class, settings
mode, list-mode state, source owner, JSON path class, DOM selector class,
no-work state, side-effect budget, fixture provenance, parity result,
verification run, rollback boundary, and release/public claim scope.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `metric-sample.json` under the future route/surface metric artifact root, but proves 0 committed route/surface metric artifact files. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Tracks route/surface-specific per-file metric artifact contract coverage and keeps implementation authority at NO-GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved route/surface metric artifact root and files are not commit-ready. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_ARTIFACT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves route/surface metric artifact approval is absent and cannot be inferred from obligations, schemas, or source contracts. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines 12 route/surface metric obligations and 0 implementation-ready route/surface optimization rows. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves fixture approval remains absent and cannot be reused as metric sample approval. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps route/surface implementation approval at NO-GO with 0 runtime route/surface approvals. |
| `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps JSON-first implementation at NO-GO until fixture, metric, parity, rollback, native/release, and public-claim proof exists. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the generic first-optimization metric sample shape while proving 0 committed metric sample files and 0 runtime collector approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future metric artifact schema while proving 0 committed first-optimization metric artifacts and 0 runtime metric collectors. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Maps current source owners while proving 0 implemented metric collectors. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Maps collector insertion risk while proving 0 runtime collector insertion points approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Maps no-work preservation obligations while proving 0 runtime collector no-work proofs approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Maps collector side-effect budgets while proving 0 runtime collector side-effect budgets approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Maps collector fixture provenance while proving 0 runtime collector fixture packets approved. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 63 tracked JS/JSX/MJS files still have 5473 lexical callables requiring per-callable semantic proof before behavior changes. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a committed route/surface metric sample artifact. |

## Current Counts

```text
JSON-first route/surface metric sample contract rows: 12
reserved route/surface metric sample paths covered: 1
source metric sample contract rows covered: 12
metric artifact contract coverage rows covered: 10
metric artifact path boundary rows covered: 6
metric artifact commit readiness rows covered: 10
metric artifact approval boundary rows covered: 12
route/surface metric obligations covered: 12
JSON-first fixture approval rows covered: 12
route/surface authority rows covered: 12
JSON-first implementation authority rows covered: 13
metric artifact schema rows covered: 12
metric source-owner rows covered: 12
metric collector insertion rows covered: 12
metric collector no-work rows covered: 12
metric collector side-effect rows covered: 12
metric collector fixture provenance rows covered: 12
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
committed route/surface metric sample files: 0
committed route/surface metric artifact files: 0
committed first-optimization foundation metric sample files: 0
runtime route/surface metric sample approvals: 0
runtime route/surface metric artifact approvals: 0
runtime metric collector approvals: 0
implementation-ready JSON-first route/surface metric sample contract rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface metric sample authority
```

## Metric Sample Contract Matrix

| Metric sample row id | Required sample section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-JSON-METRIC-SAMPLE-00-sample-identity` | Sample identity and packet binding. | `sampleVersion`, `sampleId`, `artifactId`, `candidateId`, `bindingId`, `obligationId`, `contractCoverageId`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`, `auditOnlyStatus`. | Missing artifact; contract only. |
| `FT-JSON-METRIC-SAMPLE-01-route-surface-endpoint-mode` | Route, surface, endpoint, profile, list mode, and rule state. | `route`, `surface`, `endpointFamily`, `rendererClass`, `profileType`, `listMode`, `extensionEnabled`, `ruleState`, `settingsRevision`. | Missing artifact; no route/surface approval. |
| `FT-JSON-METRIC-SAMPLE-02-obligation-candidate-binding` | Route/surface obligation and candidate binding. | `routeSurfaceMetricObligationId`, `candidateId`, `bindingMatrixId`, `fixtureApprovalStatus`, `metricApprovalStatus`, `implementationApprovalStatus`. | Missing artifact; obligation binding is not approval. |
| `FT-JSON-METRIC-SAMPLE-03-source-owner-locus` | Runtime source attribution. | `sourceLocus`, `sourceOwner`, `ownerFamily`, `collectorInsertionId`, `collectorApproved`, `sourceFiles`, `sourceHashStatus`. | Missing artifact; source owner approval remains 0. |
| `FT-JSON-METRIC-SAMPLE-04-transport-counters` | Fetch/XHR transport work. | `fetchPatched`, `xhrPatched`, `endpointMatched`, `bodyReadCount`, `responseParsedCount`, `responseRebuiltCount`, `passThroughReason`. | Missing artifact; no collector approval. |
| `FT-JSON-METRIC-SAMPLE-05-engine-json-counters` | Filter engine and JSON path work. | `processDataCount`, `itemsVisited`, `candidateRowsEvaluated`, `ruleChecks`, `jsonPathClass`, `jsonPaths`, `jsonRowsVisited`, `renderersRemoved`. | Missing artifact; JSON-first behavior unchanged. |
| `FT-JSON-METRIC-SAMPLE-06-dom-lifecycle-counters` | DOM selector, listener, observer, and timer work. | `domSelectorClass`, `domSelectors`, `domQueries`, `domNodesVisited`, `listenerCallbacks`, `observerCallbacks`, `timerCallbacks`, `teardownProof`. | Missing artifact; DOM fallback work unchanged. |
| `FT-JSON-METRIC-SAMPLE-07-network-storage-counters` | Resolver, network, and storage side work. | `networkFetches`, `credentialMode`, `resolverRequests`, `storageReads`, `storageWrites`, `mapWrites`, `postMessages`. | Missing artifact; side-effect budget approval remains 0. |
| `FT-JSON-METRIC-SAMPLE-08-visual-restore-counters` | Visual mutation, restore, false-hide, and leak decisions. | `hideMutations`, `restoreMutations`, `pendingHides`, `siblingVisibleProof`, `falseHideCount`, `leakCount`, `restorePreserved`. | Missing artifact; no visual proof. |
| `FT-JSON-METRIC-SAMPLE-09-json-dom-parity` | JSON path, DOM selector, and native parity. | `jsonDomParityStatus`, `nativeParityStatus`, `fixtureProvenanceId`, `parityResult`, `selectedCurrentStatus`, `commentContinuationStatus`. | Missing artifact; parity approval remains 0. |
| `FT-JSON-METRIC-SAMPLE-10-no-work-side-effect` | Disabled, no-rule, empty-list, and side-effect proof. | `disabledPassThrough`, `missingSettingsPassThrough`, `noRulePassThrough`, `emptyListPassThrough`, `transportNoWork`, `domNoWork`, `networkNoWork`, `storageNoWork`, `visualNoWork`, `sideEffectBudget`. | Missing artifact; no-work and side-effect approval remain 0. |
| `FT-JSON-METRIC-SAMPLE-11-verification-rollout` | Verification, rollback, release, and public claim limits. | `verificationCommand`, `verificationOutputPath`, `expectedTests`, `expectedPass`, `expectedFail`, `releaseInputExcluded`, `rollbackBoundary`, `unclaimedSurfaceStatus`, `publicClaimScope`. | Missing artifact; no persisted TAP output. |

## Current Metric Sample Decision

```text
define JSON-first route/surface metric sample contract: GO
commit route/surface metric sample artifact now: NO-GO
commit route/surface metric artifact root now: NO-GO
use route/surface metric sample as implementation authority now: NO-GO
runtime route/surface metric sample approval now: NO-GO
runtime route/surface metric artifact approval now: NO-GO
runtime metric collector insertion now: NO-GO
runtime collector no-work approval now: NO-GO
runtime collector side-effect approval now: NO-GO
runtime collector fixture provenance approval now: NO-GO
JSON-first runtime behavior patch now: NO-GO
whitelist optimization patch now: NO-GO
affected callable semantic proof: NO-GO
native sync patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

This contract does not create `metric-sample.json` or the route/surface metric
artifact root. A future patch that creates the sample must also prove
route/surface obligation coverage, schema validation, source-owner approval,
collector insertion proof, no-work preservation, side-effect budgets, fixture
provenance, diagnostic privacy, JSON/DOM/native parity, verification output,
rollback and unclaimed-surface boundaries, native/release limits, raw-capture
exclusion, public-claim limits, affected callable semantic behavior proof, and
runtime authority absence or approval.

## Missing Product Authority Symbols

No product runtime, build, script, website, manifest, CSS, source, or asset
file currently defines:

```text
jsonFirstRouteSurfaceMetricSampleContract
jsonFirstRouteSurfaceMetricSampleReport
jsonFirstRouteSurfaceMetricSampleApproval
jsonFirstRouteSurfaceMetricSampleNoGoBoundary
jsonFirstRouteSurfaceMetricSampleArtifact
jsonFirstRouteSurfaceMetricSampleCollector
jsonFirstRouteSurfaceMetricSampleRuntimeApproval
jsonFirstRouteSurfaceMetricSampleVerification
jsonFirstRouteSurfaceMetricSamplePublicClaimApproval
routeSurfaceMetricSampleRuntimeAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-metric-sample-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future route/surface
metric `metric-sample.json` shape while proving no metric sample artifact,
route/surface metric artifact packet, runtime route/surface metric sample
approval, runtime collector, native sync patch, release package patch, or
public claim exists yet. The method semantic proof gap counts remain audit-only
blockers and do not approve metric sample persistence, metric artifact
creation, collectors, or JSON-first behavior.
