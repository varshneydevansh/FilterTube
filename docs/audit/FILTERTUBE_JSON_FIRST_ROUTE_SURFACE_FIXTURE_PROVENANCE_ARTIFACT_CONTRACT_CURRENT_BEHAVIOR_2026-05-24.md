# FilterTube JSON-First Route Surface Fixture Provenance Artifact Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface fixture
provenance artifact contract. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, JSON-first behavior patch, whitelist
patch, metric collector patch, fixture commit patch, route/surface policy
patch, native sync patch, release patch, public claim patch, persisted TAP
output, artifact-root creation, committed provenance artifact, or raw-capture
promotion.

## Purpose

The route/surface fixture artifact path boundary reserves
`docs/audit/artifacts/json-first/route-surface-fixture-packet/provenance.json`
for future route/surface fixture provenance. This contract defines the minimum
provenance artifact sections without creating that file. It turns the third
reserved route/surface fixture artifact into a per-file contract while keeping
JSON-first implementation authority at NO-GO.

The current boundary is:

```text
Reserved route/surface fixture provenance artifact path: docs/audit/artifacts/json-first/route-surface-fixture-packet/provenance.json
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5812
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5812
Committed route/surface fixture provenance artifact files: 0
Runtime JSON-first fixture provenance approval exists: no
Runtime JSON-first fixture packet approval exists: no
Runtime route/surface metric artifact approval exists: no
Implementation-ready JSON-first fixture provenance artifact contract rows: 0
```

This provenance artifact contract is the handoff between the route/surface
fixture sample and the broader fixture provenance contract. A future
`provenance.json` file must bind sample identity, raw source boundaries,
reduced fixtures, positive and negative expectations, no-work preservation,
side-effect budgets, parity anchors, diagnostic privacy, rollback scope,
release/public-claim limits, and exact verification output before it can be
used as JSON-first implementation authority.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the aggregate 12-row route/surface fixture packet contract and required fixture evidence classes. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future manifest contract that must reference this provenance artifact. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future sample contract that this provenance artifact must bind to source and expectation evidence. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the broader fixture provenance shape while proving 0 committed fixture provenance files and 0 runtime collector approvals. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `provenance.json` under the future route/surface fixture packet root, but proves 0 committed fixture packet files. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Tracks per-file fixture artifact contract coverage and keeps implementation authority at NO-GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved route/surface fixture artifact root and files are not commit-ready. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps route/surface implementation approval at NO-GO. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines 12 route/surface metric obligations and 0 implementation-ready route/surface optimization rows. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Proves collector fixture packets remain unapproved. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 files and 5,789 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a committed provenance artifact. |

## Current Counts

```text
JSON-first route/surface fixture provenance artifact contract rows: 12
reserved fixture provenance artifact paths covered: 1
manifest contract rows covered: 12
fixture sample contract rows covered: 12
aggregate fixture packet contract rows covered: 12
source fixture provenance contract rows covered: 12
artifact contract coverage rows covered: 10
artifact path boundary rows covered: 6
artifact commit readiness rows covered: 10
route/surface authority rows covered: 12
route/surface metric obligations covered: 12
collector fixture provenance rows covered: 12
fixture mode classes covered: 8
fixture evidence classes covered: 14
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
committed route/surface fixture provenance artifact files: 0
committed route/surface fixture packet files: 0
runtime JSON-first fixture provenance approvals: 0
runtime JSON-first fixture packet approvals: 0
runtime route/surface metric artifact approvals: 0
runtime metric collector approvals: 0
implementation-ready JSON-first fixture provenance artifact contract rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface fixture provenance artifact authority
```

## Fixture Provenance Artifact Contract Matrix

| Provenance row id | Required provenance section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-JSON-FIXTURE-PROVENANCE-00-artifact-identity` | Provenance artifact identity and schema. | `provenanceArtifactVersion`, `provenanceArtifactId`, `packetId`, `manifestId`, `sampleId`, `auditOnlyStatus`. | Missing artifact; contract only. |
| `FT-JSON-FIXTURE-PROVENANCE-01-sample-binding` | Manifest and sample binding. | `manifestPath`, `fixtureSamplePath`, `sampleContractVersion`, `fixturePacketContractVersion`, `routeSurfaceRowId`, `obligationId`. | Missing artifact; no sample approval. |
| `FT-JSON-FIXTURE-PROVENANCE-02-source-handoff` | Source-owner, provenance handoff, and callable proof. | `sourceFixtureProvenanceContract`, `sourceOwnerFamily`, `sourceOwnerMapRequired`, `collectorFixtureProvenanceRows`, `runtimeCollectorApprovalStatus`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing artifact; collector approval remains 0 and affected callable semantic proof is missing. |
| `FT-JSON-FIXTURE-PROVENANCE-03-raw-source-boundary` | Raw source boundary. | `rawSourcePath`, `rawSourceKind`, `rawSourceHash`, `rawSourceIgnored`, `rawSourceReleaseExcluded`, `rawCapturePromotionStatus`. | Missing artifact; raw capture is not promoted. |
| `FT-JSON-FIXTURE-PROVENANCE-04-reduced-fixture-inventory` | Reduced fixture inventory. | `reducedFixturePath`, `fixtureHash`, `fixtureRoute`, `fixtureSurface`, `fixtureEndpointFamily`, `fixtureRendererClass`. | Missing artifact; no committed reduced provenance packet. |
| `FT-JSON-FIXTURE-PROVENANCE-05-positive-negative-fixtures` | Positive and negative expectation binding. | `positiveFixture`, `negativeSiblingFixture`, `expectedHiddenVideoIds`, `expectedVisibleVideoIds`, `falseHideProof`, `leakProof`. | Missing artifact; no positive or negative proof approval. |
| `FT-JSON-FIXTURE-PROVENANCE-06-disabled-empty-no-work` | Disabled, empty-list, and no-work provenance. | `disabledFixture`, `emptyListFixture`, `noRuleFixture`, `missingSettingsFixture`, `transportNoWorkProof`, `visualNoWorkProof`. | Missing artifact; no no-work approval. |
| `FT-JSON-FIXTURE-PROVENANCE-07-route-surface-metric-binding` | Route/surface metric obligation binding. | `routeSurfaceMetricObligationId`, `metricArtifactRequired`, `metricSampleEnvelope`, `expectedCounters`, `metricApprovalStatus`. | Missing artifact; metric artifact approval remains 0. |
| `FT-JSON-FIXTURE-PROVENANCE-08-json-dom-native-parity` | JSON, DOM, and native parity provenance. | `jsonFixturePath`, `domFixturePath`, `nativeFixturePath`, `jsonPaths`, `domSelectors`, `nativeParityStatus`. | Missing artifact; parity approval remains 0. |
| `FT-JSON-FIXTURE-PROVENANCE-09-side-effect-diagnostic` | Side-effect and diagnostic privacy provenance. | `sideEffectBudget`, `listenerObserverTimerBudget`, `networkStorageBudget`, `diagnosticPrivacy`, `redactionPolicy`, `consoleBudget`. | Missing artifact; side-effect and diagnostic approvals remain 0. |
| `FT-JSON-FIXTURE-PROVENANCE-10-rollback-release-public` | Rollback, release, and public claim limits. | `rollbackScope`, `unclaimedSurfaceBoundary`, `nativeSyncBoundary`, `releaseInputExcluded`, `publicClaimScope`, `rolloutProofStatus`. | Missing artifact; release and public claim scope remain NO-GO. |
| `FT-JSON-FIXTURE-PROVENANCE-11-verification-authority` | Verification and authority boundary. | `verificationCommand`, `verificationOutput`, `expectedTests`, `expectedPass`, `expectedFail`, `authorityTokenAbsenceCheck`. | Missing artifact; no persisted TAP output. |

## Current Provenance Artifact Decision

```text
define JSON-first route/surface fixture provenance artifact contract: GO
commit route/surface fixture provenance artifact now: NO-GO
commit route/surface fixture packet root now: NO-GO
use route/surface fixture provenance artifact as implementation authority now: NO-GO
runtime JSON-first fixture provenance approval now: NO-GO
runtime JSON-first fixture packet approval now: NO-GO
runtime route/surface metric artifact approval now: NO-GO
runtime metric collector insertion now: NO-GO
affected callable semantic proof: NO-GO
native sync patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

This contract does not create `provenance.json` or the route/surface fixture
packet root. A future patch that creates the provenance artifact must also
prove manifest/sample coupling, raw-source boundaries, reduced fixture hashes,
positive and negative fixture behavior, disabled/empty/no-work proof,
route/surface metric ownership, JSON/DOM/native parity, side-effect budgets,
diagnostic privacy, rollback and unclaimed-surface boundaries, native/release
limits, raw-capture exclusion, public-claim limits, and runtime authority
absence or approval, plus affected callable semantic proof.

## Missing Product Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
jsonFirstRouteSurfaceFixtureProvenanceArtifactContract
jsonFirstRouteSurfaceFixtureProvenanceArtifactReport
jsonFirstRouteSurfaceFixtureProvenanceArtifactApproval
jsonFirstRouteSurfaceFixtureProvenanceArtifactNoGoBoundary
jsonFirstRouteSurfaceFixtureProvenanceArtifactRuntimeApproval
jsonFirstRouteSurfaceFixtureProvenanceArtifactMetricApproval
jsonFirstRouteSurfaceFixtureProvenanceArtifactPublicClaimApproval
jsonFirstRouteSurfaceFixtureProvenanceArtifactCollector
jsonFirstRouteSurfaceFixtureRawSourcePromotion
jsonFirstRouteSurfaceFixtureProvenanceRuntimeAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future route/surface
fixture `provenance.json` shape while proving no provenance artifact, fixture
packet artifact, runtime fixture approval, route/surface metric artifact,
runtime collector, native sync patch, release package patch, or public claim
exists yet.
Method semantic proof gap counts remain audit-only evidence and do not approve
the provenance artifact or JSON-first behavior.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
track this provenance artifact contract as the third per-file route/surface
fixture artifact contract while keeping `provenance.json` absent and
unapproved.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs`
define the future `parity-report.json` contract that must consume this
provenance artifact before JSON/DOM/native parity, release, raw-capture,
diagnostic, rollback, or public-claim proof can become implementation
authority. The addendum pins 12 fixture parity report contract rows, 1
reserved parity report path, 0 committed route/surface fixture parity report
files, 0 runtime JSON-first fixture parity report approvals, and 0
implementation-ready JSON-first fixture parity report contract rows.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
define the future `verification-output.tap` contract that must bind this
provenance artifact to exact command, TAP output, runtime count, artifact
absence, authority absence, adjacent gate, parity, rollback, diagnostic,
native/release, raw-capture, and public-claim proof. The addendum pins 12
fixture verification output contract rows, 1 reserved verification output
path, 0 committed route/surface fixture verification output files, 0 runtime
JSON-first fixture verification output approvals, and 0 implementation-ready
JSON-first fixture verification output contract rows.
