# FilterTube First Optimization Metric Sample Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization metric sample contract.
Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, metric collector patch, JSON-first behavior patch,
whitelist patch, settings patch, lifecycle patch, diagnostic patch, native sync
patch, release patch, public claim patch, or committed metric artifact.

## Purpose

The metric artifact path boundary reserves
`docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json`
for a future measurement sample. This contract defines the minimum sample
sections without creating that file. It makes the future JSON-first and
whitelist optimization measurements first-class structured evidence, but does
not approve runtime instrumentation or behavior changes.

The current boundary is:

```text
Reserved metric sample path: docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json
Committed metric sample files: 0
Runtime metric collector approval exists: no
Implementation-ready metric sample contract rows: 0
```

This sample contract is deliberately narrower than the manifest contract. The
manifest binds the whole packet; the sample must carry the measured runtime
facts for one route, surface, list mode, rule state, source owner, JSON/DOM
parity class, no-work state, side-effect budget, and verification run.

The sample must also carry the affected callable set and method semantic proof
status. A future sample that measures work without naming callable-level
behavior proof cannot authorize JSON-first promotion, whitelist optimization,
collector insertion, or deletion/consolidation of runtime code.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PACKET_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future packet manifest shape, but proves 0 manifest files and 0 runtime collector approvals exist. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `metric-sample.json` under `docs/audit/artifacts/first-optimization/metric-foundation/` but proves 0 artifact files exist. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_FOUNDATION_PACKET_CURRENT_BEHAVIOR_2026-05-24.md` | 12 foundation packet rows exist, but 0 committed artifacts and 0 runtime collectors are approved. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | 69 tracked JS/JSX/MJS files and 5,697 lexical callables remain at 0 files with complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_ARTIFACT_SCHEMA_CURRENT_BEHAVIOR_2026-05-24.md` | 12 metric schema rows define field groups the metric sample must instantiate. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_SOURCE_OWNER_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 source-owner rows map runtime owners the sample must attribute before a collector can exist. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_INSERTION_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | 12 insertion rows exist; 0 collector insertion points are approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 no-work rows exist; 0 no-work proofs are approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_SIDE_EFFECT_BUDGET_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 side-effect rows exist; 0 side-effect budgets are approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 fixture provenance rows exist; 0 fixture packets are approved. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | 12 parity/rollout rows exist; 0 parity rollout proofs are approved. |

## Current Counts

```text
first optimization metric sample contract rows: 12
reserved metric sample paths covered: 1
committed metric sample files: 0
runtime metric collector approvals: 0
implementation-ready metric sample contract rows: 0
manifest contract rows covered: 12
artifact path boundary rows covered: 10
foundation packet rows covered: 12
metric schema rows covered: 12
source-owner rows covered: 12
collector insertion rows covered: 12
collector no-work rows covered: 12
collector side-effect rows covered: 12
collector fixture provenance rows covered: 12
collector parity rollout rows covered: 12
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
inline metric sample JSON sections covered: 12
inline metric sample artifact promotion decision: NO-GO
metric sample draft closure rows: 12
metric sample rows linked by closure: 12
inline metric sample JSON sections linked by closure: 12
manifest contract rows linked by sample closure: 12
artifact path boundary rows linked by sample closure: 10
foundation packet rows linked by sample closure: 12
metric schema rows linked by sample closure: 12
metric source-owner rows linked by sample closure: 12
collector readiness families linked by sample closure: 5
method semantic proof gap files linked by sample closure: 69
lexical callables linked by sample closure: 5744
runtime metric sample closure approvals: 0
implementation-ready metric sample closure rows: 0
metric sample draft closure: METRIC-SAMPLE-CHAIN-CLOSED
metric sample implementation readiness from closure: NO-GO
runtime behavior changed: no
not completion proof for metric sample authority
```

## Inline Metric Sample JSON Shape

The future `metric-sample.json` must be structured data. This inline draft is
embedded in the audit contract so the verifier can parse the sample shape
without creating the reserved artifact file.

```json
{
  "sampleVersion": "metric-sample-draft-2026-05-29",
  "sampleId": "FT-METRIC-SAMPLE-DRAFT-00",
  "packetId": "FT-BIND-00-metric-artifact-foundation",
  "candidateId": "FT-OPT-CANDIDATE-00-metric-artifact-foundation",
  "metricSamplePath": "docs/audit/artifacts/first-optimization/metric-foundation/metric-sample.json",
  "artifactPromotionDecision": "NO-GO",
  "runtimeBehaviorChanged": false,
  "sections": [
    {
      "id": "FT-METRIC-SAMPLE-00-sample-identity",
      "section": "sampleIdentity",
      "requiredFields": ["sampleVersion", "sampleId", "packetId", "candidateId", "bindingId", "obligationId", "manifestVersion", "affectedCallableIds", "methodSemanticProofStatus", "methodSemanticProofArtifact"]
    },
    {
      "id": "FT-METRIC-SAMPLE-01-route-surface-mode",
      "section": "routeSurfaceMode",
      "requiredFields": ["route", "surface", "endpoint", "profileType", "listMode", "extensionEnabled", "ruleState", "settingsRevision"]
    },
    {
      "id": "FT-METRIC-SAMPLE-02-source-locus-owner",
      "section": "sourceLocusOwner",
      "requiredFields": ["sourceLocus", "sourceOwner", "ownerFamily", "collectorInsertionId", "collectorApproved", "sourceFiles", "callableOwnerProofStatus"]
    },
    {
      "id": "FT-METRIC-SAMPLE-03-transport-counters",
      "section": "transportCounters",
      "requiredFields": ["fetchPatched", "xhrPatched", "endpointMatched", "bodyReadCount", "responseParsedCount", "responseRebuiltCount", "passThroughReason"]
    },
    {
      "id": "FT-METRIC-SAMPLE-04-engine-counters",
      "section": "engineCounters",
      "requiredFields": ["processDataCount", "itemsVisited", "candidateRowsEvaluated", "ruleChecks", "renderersRemoved", "decisionReports"]
    },
    {
      "id": "FT-METRIC-SAMPLE-05-dom-lifecycle-counters",
      "section": "domLifecycleCounters",
      "requiredFields": ["domQueries", "domNodesVisited", "listenerCallbacks", "observerCallbacks", "timerCallbacks", "lifecycleOwner", "teardownProof", "settingsRefreshFanoutRows", "seedRetryDelayMs", "observerOwnerReturnPaths", "directFallbackFanoutCalls", "quickBlockRefreshForced", "domFallbackObserverRefresh", "identityPrefetchGate", "rightRailWhitelistObserverGate"]
    },
    {
      "id": "FT-METRIC-SAMPLE-06-network-storage-counters",
      "section": "networkStorageCounters",
      "requiredFields": ["networkFetches", "credentialMode", "resolverRequests", "storageReads", "storageWrites", "mapWrites", "postMessages"]
    },
    {
      "id": "FT-METRIC-SAMPLE-07-visual-decision-counters",
      "section": "visualDecisionCounters",
      "requiredFields": ["hideMutations", "restoreMutations", "pendingHides", "siblingVisibleProof", "falseHideCount", "leakCount"]
    },
    {
      "id": "FT-METRIC-SAMPLE-08-json-dom-parity",
      "section": "jsonDomParity",
      "requiredFields": ["jsonPathClass", "jsonPaths", "jsonRowsVisited", "domSelectorClass", "domSelectors", "domNodesVisited", "parityResult"]
    },
    {
      "id": "FT-METRIC-SAMPLE-09-no-work-preservation",
      "section": "noWorkPreservation",
      "requiredFields": ["disabledPassThrough", "missingSettingsPassThrough", "noRulePassThrough", "emptyListPassThrough", "transportNoWork", "domNoWork", "networkNoWork", "storageNoWork", "visualNoWork"]
    },
    {
      "id": "FT-METRIC-SAMPLE-10-side-effect-budget",
      "section": "sideEffectBudget",
      "requiredFields": ["sideEffectsObserved", "settingsBudget", "transportBudget", "engineBudget", "domBudget", "networkBudget", "storageBudget", "visualBudget", "diagnosticBudget"]
    },
    {
      "id": "FT-METRIC-SAMPLE-11-verification-rollout",
      "section": "verificationRollout",
      "requiredFields": ["verificationCommand", "verificationOutputPath", "expectedTests", "expectedPass", "expectedFail", "releaseInputExcluded", "publicClaimScope", "rollbackBoundary"]
    }
  ]
}
```

Inline metric sample shape decision:

```text
parse inline metric sample JSON draft: GO
use inline draft as committed metric-sample.json: NO-GO
derive runtime collector insertion from inline draft: NO-GO
```

## Metric Sample Draft Chain Closure

This closure table proves the metric-sample draft documentation chain is
complete from each sample row to its inline JSON section, upstream source input
family, and callable semantic proof blocker. It does not create
`metric-sample.json`, create the reserved metric-foundation artifact root,
approve runtime collectors, approve JSON-first runtime behavior, approve
whitelist/cache optimization, or approve release/public claims.

Metric sample closure rows:

| Closure row | Metric sample row | Inline JSON section | Upstream proof link | Current state |
| --- | --- | --- | --- | --- |
| `FT-METRIC-SAMPLE-CLOSURE-00-sample-identity` | `FT-METRIC-SAMPLE-00-sample-identity` | `sampleIdentity` | Packet manifest, foundation packet, candidate, obligation, and method semantic proof gap rows. | Chain linked; committed metric sample, manifest artifact, and complete callable semantic proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-01-route-surface-mode` | `FT-METRIC-SAMPLE-01-route-surface-mode` | `routeSurfaceMode` | Route/surface, profile, list-mode, settings revision, and rule-state gates. | Chain linked; live route/mode metric sample and installed-byte parity missing. |
| `FT-METRIC-SAMPLE-CLOSURE-02-source-locus-owner` | `FT-METRIC-SAMPLE-02-source-locus-owner` | `sourceLocusOwner` | Metric source-owner matrix and collector insertion gate. | Chain linked; approved source owner and approved collector insertion point missing. |
| `FT-METRIC-SAMPLE-CLOSURE-03-transport-counters` | `FT-METRIC-SAMPLE-03-transport-counters` | `transportCounters` | Transport source locus, JSON path, fetch/XHR, and pass-through obligations. | Chain linked; measured transport counters and transport no-work proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-04-engine-counters` | `FT-METRIC-SAMPLE-04-engine-counters` | `engineCounters` | Filter engine rows, content-filter semantics, and decision report obligations. | Chain linked; measured engine counters and rule-evaluation budget missing. |
| `FT-METRIC-SAMPLE-CLOSURE-05-dom-lifecycle-counters` | `FT-METRIC-SAMPLE-05-dom-lifecycle-counters` | `domLifecycleCounters` | DOM selector, listener, observer, timer, lifecycle, and teardown ownership rows. | Chain linked; measured DOM lifecycle counters and teardown proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-06-network-storage-counters` | `FT-METRIC-SAMPLE-06-network-storage-counters` | `networkStorageCounters` | Resolver, network, storage, map-write, and message side-effect rows. | Chain linked; measured network/storage counters and side-effect budget proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-07-visual-decision-counters` | `FT-METRIC-SAMPLE-07-visual-decision-counters` | `visualDecisionCounters` | Visual mutation, restore, pending-hide, false-hide, and leak rows. | Chain linked; measured visual decision counters and false-hide/leak proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-08-json-dom-parity` | `FT-METRIC-SAMPLE-08-json-dom-parity` | `jsonDomParity` | JSON path, DOM selector, unsupported-surface, and parity rollout rows. | Chain linked; JSON/DOM parity fixture and unsupported-surface boundary proof missing. |
| `FT-METRIC-SAMPLE-CLOSURE-09-no-work-preservation` | `FT-METRIC-SAMPLE-09-no-work-preservation` | `noWorkPreservation` | Disabled, missing-settings, no-rule, empty-list, transport, DOM, network, storage, and visual no-work rows. | Chain linked; committed no-work sample and zero-work verification output missing. |
| `FT-METRIC-SAMPLE-CLOSURE-10-side-effect-budget` | `FT-METRIC-SAMPLE-10-side-effect-budget` | `sideEffectBudget` | Settings, transport, engine, DOM, network, storage, visual, diagnostic, whitelist, and rollout side-effect rows. | Chain linked; committed side-effect budget sample and approval boundary missing. |
| `FT-METRIC-SAMPLE-CLOSURE-11-verification-rollout` | `FT-METRIC-SAMPLE-11-verification-rollout` | `verificationRollout` | Verification output, parity rollout, release exclusion, public-claim, and rollback rows. | Chain linked; committed verification output, release exclusion proof, and rollback boundary proof missing. |

Metric sample closure decision:

```text
close metric sample documentation chain now: GO
accept metric sample closure as committed artifact approval now: NO-GO
accept metric sample closure as artifact root creation approval now: NO-GO
accept metric sample closure as runtime collector insertion approval now: NO-GO
accept metric sample closure as JSON-first runtime behavior approval now: NO-GO
accept metric sample closure as whitelist optimization approval now: NO-GO
accept metric sample closure as release/public-claim approval now: NO-GO
continue proof-backed audit: GO
```

## Metric Sample Contract Matrix

| Metric sample row id | Required sample section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-METRIC-SAMPLE-00-sample-identity` | Sample identity, packet binding, and affected callable semantic scope. | `sampleVersion`, `sampleId`, `packetId`, `candidateId`, `bindingId`, `obligationId`, `manifestVersion`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing. |
| `FT-METRIC-SAMPLE-01-route-surface-mode` | Route, surface, endpoint, profile, list mode, and rule state. | `route`, `surface`, `endpoint`, `profileType`, `listMode`, `extensionEnabled`, `ruleState`, `settingsRevision`. | Missing. |
| `FT-METRIC-SAMPLE-02-source-locus-owner` | Runtime source and callable-owner attribution. | `sourceLocus`, `sourceOwner`, `ownerFamily`, `collectorInsertionId`, `collectorApproved`, `sourceFiles`, `callableOwnerProofStatus`. | Missing. |
| `FT-METRIC-SAMPLE-03-transport-counters` | Fetch/XHR transport work. | `fetchPatched`, `xhrPatched`, `endpointMatched`, `bodyReadCount`, `responseParsedCount`, `responseRebuiltCount`, `passThroughReason`. | Missing. |
| `FT-METRIC-SAMPLE-04-engine-counters` | Filter engine and decision work. | `processDataCount`, `itemsVisited`, `candidateRowsEvaluated`, `ruleChecks`, `renderersRemoved`, `decisionReports`. | Missing. |
| `FT-METRIC-SAMPLE-05-dom-lifecycle-counters` | DOM, listener, observer, timer, and settings-refresh fanout work. | `domQueries`, `domNodesVisited`, `listenerCallbacks`, `observerCallbacks`, `timerCallbacks`, `lifecycleOwner`, `teardownProof`, `settingsRefreshFanoutRows`, `seedRetryDelayMs`, `observerOwnerReturnPaths`, `directFallbackFanoutCalls`, `quickBlockRefreshForced`, `domFallbackObserverRefresh`, `identityPrefetchGate`, `rightRailWhitelistObserverGate`. | Missing. |
| `FT-METRIC-SAMPLE-06-network-storage-counters` | Resolver, network, and storage side work. | `networkFetches`, `credentialMode`, `resolverRequests`, `storageReads`, `storageWrites`, `mapWrites`, `postMessages`. | Missing. |
| `FT-METRIC-SAMPLE-07-visual-decision-counters` | Visual mutation and restore decisions. | `hideMutations`, `restoreMutations`, `pendingHides`, `siblingVisibleProof`, `falseHideCount`, `leakCount`. | Missing. |
| `FT-METRIC-SAMPLE-08-json-dom-parity` | JSON path and DOM selector parity. | `jsonPathClass`, `jsonPaths`, `jsonRowsVisited`, `domSelectorClass`, `domSelectors`, `domNodesVisited`, `parityResult`. | Missing. |
| `FT-METRIC-SAMPLE-09-no-work-preservation` | Disabled, no-rule, empty-list, and no-side-work proof. | `disabledPassThrough`, `missingSettingsPassThrough`, `noRulePassThrough`, `emptyListPassThrough`, `transportNoWork`, `domNoWork`, `networkNoWork`, `storageNoWork`, `visualNoWork`. | Missing. |
| `FT-METRIC-SAMPLE-10-side-effect-budget` | Side-effect budget observation. | `sideEffectsObserved`, `settingsBudget`, `transportBudget`, `engineBudget`, `domBudget`, `networkBudget`, `storageBudget`, `visualBudget`, `diagnosticBudget`. | Missing. |
| `FT-METRIC-SAMPLE-11-verification-rollout` | Verification and rollout boundary. | `verificationCommand`, `verificationOutputPath`, `expectedTests`, `expectedPass`, `expectedFail`, `releaseInputExcluded`, `publicClaimScope`, `rollbackBoundary`. | Missing. |

## Current Metric Sample Decision

```text
define metric sample contract: GO
commit metric-sample.json now: NO-GO
runtime metric collector insertion: NO-GO
JSON-first runtime behavior patch: NO-GO
whitelist optimization patch: NO-GO
native/release/public rollout claim: NO-GO
continue proof-backed audit: GO
```

This contract does not create `metric-sample.json`. A future patch that creates
the sample must also prove collector insertion approval, fixture provenance,
disabled/no-rule/empty-list preservation, side-effect budgets, diagnostic
privacy, JSON/DOM/native parity, release exclusion, and runtime authority
absence or approval. It must also prove affected callable semantic proof for
the source code that the sample would justify changing.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
firstOptimizationMetricSampleContract
firstOptimizationMetricSampleReport
firstOptimizationMetricSampleApproval
firstOptimizationMetricSampleNoGoBoundary
jsonFirstOptimizationMetricSample
jsonFirstMetricSampleAuthority
metricArtifactMetricSampleCollector
metricArtifactMetricSampleVerification
metricArtifactMetricSampleRuntimeApproval
whitelistOptimizationMetricSampleBudget
metricSampleDraftClosure
metricSampleDraftClosureRuntimeApproval
metricSampleDraftImplementationReadiness
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-metric-sample-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future metric sample
shape while proving no metric sample file, artifact file, runtime collector, or
runtime optimization approval exists yet.

## First Optimization Source Owner Map Contract Addendum

First optimization source owner map contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_OWNER_MAP_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-owner-map-contract-current-behavior.test.mjs`
turn this metric sample shape into the future `source-owner-map.json`
ownership contract. The addendum pins 12 source owner map contract rows, 1
reserved source owner map path covered, 0 committed source owner map files, 0
runtime metric collector approvals, and 0 implementation-ready source owner map
contract rows. It does not create the map; it keeps metric samples blocked
until source owners and collector ownership are line-anchored and approved.

## First Optimization Fixture Provenance Contract Addendum

First optimization fixture provenance contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-fixture-provenance-contract-current-behavior.test.mjs`
turn this metric sample shape into the future `fixture-provenance.json`
evidence contract. The addendum pins 12 fixture provenance contract rows, 1
reserved fixture provenance path covered, 0 committed fixture provenance files,
0 runtime metric collector approvals, and 0 implementation-ready fixture
provenance contract rows. It does not create the provenance packet; it keeps
sample evidence blocked until raw-source, fixture, no-work, side-effect,
parity, rollout, and release-exclusion proof exists.

## First Optimization No-Work Preservation Contract Addendum

First optimization no-work preservation contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_NO_WORK_PRESERVATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-no-work-preservation-contract-current-behavior.test.mjs`
bind this sample shape to the future `no-work-preservation.json` contract. The
addendum pins 12 no-work preservation contract rows, 1 reserved no-work
preservation path covered, 0 committed no-work preservation files, 0 runtime
metric collector approvals, and 0 implementation-ready no-work preservation
contract rows. It keeps metric samples blocked until pass-through and zero-work
states are measured without adding unbudgeted work.

## First Optimization Side-Effect Budget Contract Addendum

First optimization side-effect budget contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SIDE_EFFECT_BUDGET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-side-effect-budget-contract-current-behavior.test.mjs`
define the future `side-effect-budget.json` shape for the selected
metric-foundation artifact without creating the budget packet, artifacts, or
runtime collectors. The addendum pins 12 side-effect budget contract rows, 1
reserved side-effect budget path covered, 0 committed side-effect budget
files, 0 runtime metric collector approvals, and 0 implementation-ready
side-effect budget contract rows. It keeps metric samples blocked until
settings, artifact, transport, engine, DOM, lifecycle, network, storage,
visual, whitelist, diagnostic, no-work coupling, parity, rollout,
verification, and authority proof are explicit.

## First Optimization Diagnostic Privacy Contract Addendum

First optimization diagnostic privacy contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-diagnostic-privacy-contract-current-behavior.test.mjs`
define the future `diagnostic-privacy.json` shape for the selected
metric-foundation artifact without creating the privacy packet, artifacts, or
runtime collectors. The addendum pins 12 diagnostic privacy contract rows, 1
reserved diagnostic privacy path covered, 0 committed diagnostic privacy
files, 0 runtime metric collector approvals, and 0 implementation-ready
diagnostic privacy contract rows. It keeps metric samples blocked until
console inventory, privacy class, redaction policy, debug gate, metric
replacement, no-work preservation, fixture provenance, rollout, verification,
and authority proof are explicit.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
define the future `parity-rollout.json` shape for the selected
metric-foundation artifact without creating the rollout packet, artifacts,
runtime collectors, native sync changes, release package changes, or public
claims. The addendum pins 12 parity rollout contract rows, 1 reserved parity
rollout path covered, 0 committed parity rollout files, 0 runtime metric
collector approvals, and 0 implementation-ready parity rollout contract rows.
It keeps metric samples blocked from rollout claims until JSON/DOM/native
parity, package parity, raw-capture exclusion, rollback, unclaimed surfaces,
verification, and authority proof are explicit.

## First Optimization Verification Output Contract Addendum

First optimization verification output contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-verification-output-contract-current-behavior.test.mjs`
bind this metric sample contract to the future `verification-output.tap`
contract without creating TAP output, artifacts, runtime collectors, native sync
changes, release package changes, or public claims. The addendum pins 12
verification output contract rows, 1 reserved verification output path covered,
0 committed verification output files, 0 runtime metric collector approvals, 0
implementation-ready verification output contract rows, expected runtime audit
tests 4457, expected runtime audit pass: 4457, and expected runtime audit fail 0.
It keeps metric samples blocked until exact verification output, artifact
absence checks, authority absence checks, rollback boundaries, and unclaimed
surfaces are proved.

## First Optimization Metric Foundation Contract Coverage Gate Addendum

First optimization metric foundation contract coverage gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-foundation-contract-coverage-gate-current-behavior.test.mjs`
prove this contract is one of 9 reserved metric-foundation artifact contracts
without creating artifact files or approving runtime collectors. The addendum
pins 12 contract coverage rows, 1 reserved artifact root covered, 9 reserved
artifact files covered, 9 contract docs covered, 9 contract tests covered, 0
committed foundation metric artifact files, 0 runtime metric collector
approvals, 0 implementation-ready contract coverage rows, expected runtime
audit tests 4457, expected runtime audit pass: 4457, and expected runtime audit
fail 0.

## JSON-First Route/Surface Metric Sample Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_METRIC_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-metric-sample-contract-current-behavior.test.mjs`
specialize this generic metric sample contract into the JSON-first
route/surface metric sample contract without creating either sample artifact.
The addendum pins 12 JSON-first route/surface metric sample contract rows, 12
source metric sample contract rows covered, 1 reserved route/surface metric
sample path, 0 committed route/surface metric sample files, 0 committed
first-optimization foundation metric sample files, 0 runtime route/surface
metric sample approvals, 0 runtime metric collector approvals, and 0
implementation-ready JSON-first route/surface metric sample contract rows.

## Settings Refresh Fanout Metric Sample Linkage Addendum

`docs/audit/FILTERTUBE_SETTINGS_REFRESH_OPTIMIZATION_READINESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-29.md`
now records the 2026-05-30 settings-refresh runtime fanout detail. This metric
sample contract must carry that fanout because the observed YouTube SPA lag and
post-whitelist cache behavior cannot be evaluated by transport counters alone.
The future `metric-sample.json` must measure seed retry, observer owner
selection, identity prefetch, playlist/right-rail observers, quick-block
availability refresh, DOM fallback observer refresh, and the direct fallback
fanout path before any pruning is approved.

Current fanout metric-sample linkage:

```text
settings refresh fanout metric sample linkage rows: 9
source settings-refresh fanout rows linked: 9
inline domLifecycleCounters fanout fields linked: 8
committed metric sample files from fanout linkage: 0
runtime collector insertion from fanout linkage: NO-GO
observer/menu/quick pruning from fanout linkage: NO-GO
whitelist optimization from fanout linkage: NO-GO
JSON-first promotion from fanout linkage: NO-GO
runtime behavior changed by fanout linkage: no
```

Fanout linkage rows:

| Link row | Settings-refresh fanout row | Metric sample section | Required metric-sample fields | Current state |
| --- | --- | --- | --- | --- |
| `FT-METRIC-SAMPLE-FANOUT-00-main-world-post` | `FT-SRFO-00-settings-main-world-post` | `domLifecycleCounters` | `settingsRefreshFanoutRows` | Linked; committed metric sample absent. |
| `FT-METRIC-SAMPLE-FANOUT-01-seed-direct-update` | `FT-SRFO-01-seed-direct-update` | `domLifecycleCounters` | `settingsRefreshFanoutRows` | Linked; seed replay budget absent. |
| `FT-METRIC-SAMPLE-FANOUT-02-seed-pending-retry` | `FT-SRFO-02-seed-pending-retry` | `domLifecycleCounters` | `seedRetryDelayMs` | Linked; retry cap and seed-ready timing proof absent. |
| `FT-METRIC-SAMPLE-FANOUT-03-owner-return-selection` | `FT-SRFO-03-owner-return-selection` | `domLifecycleCounters` | `observerOwnerReturnPaths`, `directFallbackFanoutCalls` | Linked; owner precedence metrics absent. |
| `FT-METRIC-SAMPLE-FANOUT-04-identity-prefetch` | `FT-SRFO-04-identity-prefetch-fanout` | `domLifecycleCounters` | `identityPrefetchGate` | Linked; route/surface identity budget absent. |
| `FT-METRIC-SAMPLE-FANOUT-05-playlist-rail` | `FT-SRFO-05-playlist-and-rail-observers` | `domLifecycleCounters` | `rightRailWhitelistObserverGate` | Linked; watch/non-watch whitelist and playlist metrics absent. |
| `FT-METRIC-SAMPLE-FANOUT-06-quick-block` | `FT-SRFO-06-quick-block-refresh` | `domLifecycleCounters` | `quickBlockRefreshForced` | Linked; quick-cross/action-affordance proof absent. |
| `FT-METRIC-SAMPLE-FANOUT-07-dom-fallback` | `FT-SRFO-07-dom-fallback-observer-refresh` | `domLifecycleCounters` | `domFallbackObserverRefresh` | Linked; DOM fallback parity budget absent. |
| `FT-METRIC-SAMPLE-FANOUT-08-metric-gap` | `FT-SRFO-08-metric-artifact-gap` | `domLifecycleCounters` | all fanout fields | Linked; metric artifact and collector approval absent. |

Fanout linkage decision:

```text
link settings-refresh fanout rows into metric sample contract now: GO
accept fanout linkage as committed metric-sample.json approval now: NO-GO
accept fanout linkage as runtime collector insertion approval now: NO-GO
accept fanout linkage as observer/menu/quick pruning approval now: NO-GO
accept fanout linkage as whitelist optimization approval now: NO-GO
accept fanout linkage as JSON-first promotion approval now: NO-GO
accept fanout linkage as release/public-claim approval now: NO-GO
runtime behavior changed by fanout linkage: no
```
