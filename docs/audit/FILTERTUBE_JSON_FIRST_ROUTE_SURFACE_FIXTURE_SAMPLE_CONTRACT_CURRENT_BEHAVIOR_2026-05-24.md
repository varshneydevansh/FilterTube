# FilterTube JSON-First Route Surface Fixture Sample Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface fixture sample
contract. Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, JSON-first behavior patch, whitelist patch, metric
collector patch, fixture commit patch, route/surface policy patch, native sync
patch, release patch, public claim patch, persisted TAP output, artifact-root
creation, committed fixture sample artifact, or raw-capture promotion.

## Purpose

The route/surface fixture artifact path boundary reserves
`docs/audit/artifacts/json-first/route-surface-fixture-packet/fixture-sample.json`
for future positive, negative, disabled, empty, sparse, lifecycle, parity, and
diagnostic evidence. This contract defines the minimum fixture sample sections
without creating that file. It turns the second reserved route/surface fixture
artifact into a per-file contract while keeping JSON-first implementation
authority at NO-GO.

The current boundary is:

```text
Reserved route/surface fixture sample path: docs/audit/artifacts/json-first/route-surface-fixture-packet/fixture-sample.json
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5836
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5830
Committed route/surface fixture sample files: 0
Runtime JSON-first fixture sample approval exists: no
Runtime JSON-first fixture packet approval exists: no
Runtime route/surface metric artifact approval exists: no
Implementation-ready JSON-first fixture sample contract rows: 0
```

This sample contract is deliberately stricter than a raw capture reference. A
future sample must bind one route/surface row, one obligation, one candidate,
one mode state, one source capture, reduced fixture identity, expected hidden
and visible siblings, no-work expectations, side-effect budgets, parity
anchors, diagnostic privacy class, rollback scope, and verification output.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the aggregate 12-row route/surface fixture packet contract and required fixture evidence classes. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future manifest contract that must reference this fixture sample. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `fixture-sample.json` under the future route/surface fixture packet root, but proves 0 committed fixture packet files. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Tracks per-file fixture artifact contract coverage and keeps implementation authority at NO-GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved route/surface fixture artifact root and files are not commit-ready. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps route/surface implementation approval at NO-GO. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines 12 route/surface metric obligations and 0 implementation-ready route/surface optimization rows. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Proves collector fixture packets remain unapproved. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 files and 5,789 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a committed fixture sample artifact. |

## Current Counts

```text
JSON-first route/surface fixture sample contract rows: 12
reserved fixture sample paths covered: 1
manifest contract rows covered: 12
aggregate fixture packet contract rows covered: 12
artifact contract coverage rows covered: 10
artifact path boundary rows covered: 6
artifact commit readiness rows covered: 10
route/surface authority rows covered: 12
route/surface metric obligations covered: 12
fixture mode classes covered: 8
fixture evidence classes covered: 14
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
committed route/surface fixture sample files: 0
committed route/surface fixture packet files: 0
runtime JSON-first fixture sample approvals: 0
runtime JSON-first fixture packet approvals: 0
runtime route/surface metric artifact approvals: 0
runtime metric collector approvals: 0
implementation-ready JSON-first fixture sample contract rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface fixture sample authority
```

## Fixture Sample Contract Matrix

| Sample row id | Required sample section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-JSON-FIXTURE-SAMPLE-00-sample-identity` | Sample identity and schema. | `sampleVersion`, `sampleId`, `packetId`, `manifestId`, `fixturePacketContractVersion`, `auditOnlyStatus`. | Missing artifact; contract only. |
| `FT-JSON-FIXTURE-SAMPLE-01-route-surface-binding` | Route/surface and endpoint binding with callable proof. | `JSONRouteSurfaceRowId`, `route`, `surface`, `endpointFamily`, `rendererClass`, `identityTier`, `routeSurfaceApprovalStatus`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing artifact; no route/surface approval or affected callable semantic proof. |
| `FT-JSON-FIXTURE-SAMPLE-02-mode-rule-state` | Profile, list mode, and rule state. | `profileType`, `listMode`, `ruleState`, `extensionEnabled`, `settingsRevision`, `contentFilterState`, `modeClass`. | Missing artifact; no mode approval. |
| `FT-JSON-FIXTURE-SAMPLE-03-source-fixture-paths` | Source capture and reduced fixture paths. | `sourceCapturePath`, `reducedFixturePath`, `rawCaptureBoundary`, `releaseInputExcluded`, `fixtureOwner`, `fixtureSamplePath`. | Missing artifact; source capture not approved. |
| `FT-JSON-FIXTURE-SAMPLE-04-positive-hide` | Positive hide fixture. | `positiveFixture`, `expectedHiddenVideoIds`, `expectedHiddenChannels`, `expectedHiddenRenderers`, `identitySource`, `hideReason`. | Missing artifact; no positive hide approval. |
| `FT-JSON-FIXTURE-SAMPLE-05-negative-sibling-visible` | Negative sibling and visible-neighbor fixture. | `negativeSiblingFixture`, `expectedVisibleVideoIds`, `expectedVisibleChannels`, `unsupportedRendererBoundary`, `siblingVisibilityReason`. | Missing artifact; no false-hide proof. |
| `FT-JSON-FIXTURE-SAMPLE-06-disabled-empty-no-rule` | Disabled, empty-list, and no-rule fixtures. | `disabledFixture`, `emptyListFixture`, `noRuleFixture`, `emptyBlocklistFixture`, `emptyWhitelistFixture`, `missingSettingsFixture`. | Missing artifact; no no-work proof. |
| `FT-JSON-FIXTURE-SAMPLE-07-sparse-selected-continuation` | Sparse, selected/current, and continuation fixtures. | `sparseSurfaceFixture`, `selectedCurrentFixture`, `commentContinuationFixture`, `playlistCurrentFixture`, `sparseIdentityFallback`. | Missing artifact; no selected/current approval. |
| `FT-JSON-FIXTURE-SAMPLE-08-parity-playback-restore` | DOM/native parity, playback safety, and restore proof. | `domParityFixture`, `nativeParityFixture`, `playbackSafetyFixture`, `restorePreserved`, `JSONDOMParity`, `nativeParity`. | Missing artifact; parity approval remains 0. |
| `FT-JSON-FIXTURE-SAMPLE-09-no-work-side-effect-budget` | No-work and side-effect counters. | `noWorkProof`, `sideEffectBudget`, `listenerObserverTimerBudget`, `networkStorageBudget`, `transportNoWorkProof`, `visualNoWorkProof`. | Missing artifact; no-work and side-effect approval remain 0. |
| `FT-JSON-FIXTURE-SAMPLE-10-diagnostic-metric-privacy` | Metric sample and diagnostic privacy. | `metricArtifact`, `metricSampleEnvelope`, `diagnosticPrivacyFixture`, `diagnosticPrivacy`, `consoleBudget`, `redactionPolicy`. | Missing artifact; metric and diagnostic approval remain 0. |
| `FT-JSON-FIXTURE-SAMPLE-11-verification-rollback` | Verification, rollback, release, and public claim limits. | `verificationCommand`, `verificationOutput`, `expectedTests`, `expectedPass`, `expectedFail`, `rollbackScope`, `publicClaimScope`. | Missing artifact; no persisted TAP output. |

## Current Sample Decision

```text
define JSON-first route/surface fixture sample contract: GO
commit route/surface fixture sample artifact now: NO-GO
commit route/surface fixture packet root now: NO-GO
use route/surface fixture sample as implementation authority now: NO-GO
runtime JSON-first fixture sample approval now: NO-GO
runtime JSON-first fixture packet approval now: NO-GO
runtime route/surface metric artifact approval now: NO-GO
runtime metric collector insertion now: NO-GO
affected callable semantic proof: NO-GO
native sync patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

This contract does not create `fixture-sample.json` or the route/surface
fixture packet root. A future patch that creates the sample must also prove
manifest coupling, provenance, positive and negative fixtures, disabled/empty
no-work proof, sparse and selected/current behavior, JSON/DOM/native parity,
side-effect budgets, diagnostic privacy, rollback and unclaimed-surface
boundaries, native/release limits, raw-capture exclusion, public-claim limits,
affected callable semantic proof, and runtime authority absence or approval.

## Missing Product Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
jsonFirstRouteSurfaceFixtureSampleContract
jsonFirstRouteSurfaceFixtureSampleReport
jsonFirstRouteSurfaceFixtureSampleApproval
jsonFirstRouteSurfaceFixtureSampleNoGoBoundary
jsonFirstRouteSurfacePositiveFixtureSample
jsonFirstRouteSurfaceNegativeSiblingFixtureSample
jsonFirstRouteSurfaceDisabledEmptyFixtureSample
jsonFirstRouteSurfaceFixtureSampleRuntimeApproval
jsonFirstRouteSurfaceFixtureSampleMetricApproval
jsonFirstRouteSurfaceFixtureSamplePublicClaimApproval
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future route/surface
fixture `fixture-sample.json` shape while proving no sample artifact, fixture
packet artifact, runtime fixture approval, route/surface metric artifact,
runtime collector, native sync patch, release package patch, or public claim
exists yet.
Method semantic proof gap counts remain audit-only evidence and do not approve
the fixture sample artifact or JSON-first behavior.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
track this sample contract as the second per-file route/surface fixture
artifact contract while keeping `fixture-sample.json` absent and unapproved.

## JSON-First Route/Surface Fixture Provenance Artifact Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs`
define the future `provenance.json` contract that must bind this sample to
raw-source, reduced-fixture, metric, no-work, side-effect, parity,
diagnostic, rollback, release, and public-claim evidence. The addendum pins
12 fixture provenance artifact contract rows, 1 reserved provenance path, 0
committed route/surface fixture provenance artifact files, 0 runtime
JSON-first fixture provenance approvals, and 0 implementation-ready JSON-first
fixture provenance artifact contract rows.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs`
define the future `parity-report.json` contract that must compare this sample
against JSON path, DOM selector, native runtime, release package, raw-capture,
diagnostic, rollback, and public-claim boundaries. The addendum pins 12
fixture parity report contract rows, 1 reserved parity report path, 0
committed route/surface fixture parity report files, 0 runtime JSON-first
fixture parity report approvals, and 0 implementation-ready JSON-first
fixture parity report contract rows.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
define the future `verification-output.tap` contract that must bind this
sample contract to exact command, TAP output, runtime count, JSON/DOM/native
parity, no-work, side-effect, rollback, diagnostic, native/release,
raw-capture, and public-claim proof. The addendum pins 12 fixture verification
output contract rows, 1 reserved verification output path, 0 committed
route/surface fixture verification output files, 0 runtime JSON-first fixture
verification output approvals, and 0 implementation-ready JSON-first fixture
verification output contract rows.
