# FilterTube JSON-First Route Surface Fixture Manifest Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface fixture manifest
contract. Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, JSON-first behavior patch, whitelist patch, metric
collector patch, fixture commit patch, route/surface policy patch, native sync
patch, release patch, public claim patch, persisted TAP output, artifact-root
creation, committed manifest artifact, or raw-capture promotion.

## Purpose

The route/surface fixture artifact path boundary reserves
`docs/audit/artifacts/json-first/route-surface-fixture-packet/manifest.json`
for a future fixture packet manifest. This contract defines the minimum
manifest sections without creating that file. It turns the first reserved
route/surface fixture artifact from an aggregate packet concept into a
per-file contract, while keeping runtime JSON-first implementation authority at
NO-GO.

The current boundary is:

```text
Reserved route/surface fixture manifest path: docs/audit/artifacts/json-first/route-surface-fixture-packet/manifest.json
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5836
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5830
Committed route/surface fixture manifest files: 0
Runtime JSON-first fixture manifest approval exists: no
Runtime JSON-first fixture packet approval exists: no
Runtime route/surface metric artifact approval exists: no
Implementation-ready JSON-first fixture manifest contract rows: 0
```

This manifest contract is deliberately stricter than a loose fixture index. A
future manifest must bind route/surface authority row, obligation, candidate,
endpoint family, profile, list mode, rule state, artifact paths, source
capture, fixture evidence, parity, no-work proof, side-effect budgets,
diagnostic privacy, rollback, release/public scope, verification output, and
authority-token absence into one structured packet.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the aggregate 12-row route/surface fixture packet contract and required fixture fields. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `manifest.json` under the future route/surface fixture packet root, but proves 0 committed fixture packet files. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Tracks per-file fixture artifact contract coverage and keeps implementation authority at NO-GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved route/surface fixture artifact root and files are not commit-ready. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps route/surface implementation approval at NO-GO. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines 12 route/surface metric obligations and 0 implementation-ready route/surface optimization rows. |
| `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps JSON-first implementation at NO-GO until fixture, metric, parity, rollback, native/release, and public-claim proof exists. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Proves collector fixture packets remain unapproved. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 files and 5,789 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a committed manifest artifact. |

## Current Counts

```text
JSON-first route/surface fixture manifest contract rows: 12
reserved manifest paths covered: 1
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
committed route/surface fixture manifest files: 0
committed route/surface fixture packet files: 0
runtime JSON-first fixture manifest approvals: 0
runtime JSON-first fixture packet approvals: 0
runtime route/surface metric artifact approvals: 0
runtime metric collector approvals: 0
implementation-ready JSON-first fixture manifest contract rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface fixture manifest authority
```

## Manifest Contract Matrix

| Manifest row id | Required manifest section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-JSON-FIXTURE-MANIFEST-00-packet-identity` | Packet identity and schema. | `manifestVersion`, `packetId`, `manifestSchemaVersion`, `fixturePacketContractVersion`, `createdByAuditSlice`, `auditOnlyStatus`. | Missing artifact; contract only. |
| `FT-JSON-FIXTURE-MANIFEST-01-route-surface-binding` | Route/surface authority binding and callable proof. | `JSONRouteSurfaceRowId`, `route`, `surface`, `endpointFamily`, `rendererClass`, `identityTier`, `routeSurfaceApprovalStatus`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing artifact; no route/surface approval or affected callable semantic proof. |
| `FT-JSON-FIXTURE-MANIFEST-02-obligation-candidate-binding` | Obligation and candidate binding. | `obligationId`, `candidateId`, `bindingId`, `optimizationReadinessId`, `metricObligationId`, `candidateApprovalStatus`. | Missing artifact; no candidate approval. |
| `FT-JSON-FIXTURE-MANIFEST-03-endpoint-profile-mode` | Endpoint, profile, list mode, and rule state. | `endpointFamily`, `profileType`, `listMode`, `ruleState`, `extensionEnabled`, `settingsRevision`, `contentFilterState`. | Missing artifact; no mode approval. |
| `FT-JSON-FIXTURE-MANIFEST-04-artifact-path-set` | Reserved packet artifact paths. | `artifactRoot`, `manifestPath`, `fixtureSamplePath`, `provenancePath`, `parityReportPath`, `verificationOutputPath`, `artifactCommitStatus`. | Missing artifact; root and files remain absent. |
| `FT-JSON-FIXTURE-MANIFEST-05-source-capture-provenance` | Source capture and reduced fixture provenance. | `sourceCapturePath`, `reducedFixturePath`, `rawCaptureBoundary`, `releaseInputExcluded`, `fixtureOwner`, `provenanceApprovalStatus`. | Missing artifact; provenance approval remains 0. |
| `FT-JSON-FIXTURE-MANIFEST-06-fixture-evidence-index` | Positive, negative, disabled, empty, sparse, and lifecycle fixtures. | `positiveFixture`, `negativeSiblingFixture`, `disabledFixture`, `emptyListFixture`, `sparseSurfaceFixture`, `lifecycleAffordanceFixture`, `selectedCurrentFixture`, `commentContinuationFixture`. | Missing artifact; no fixture evidence approval. |
| `FT-JSON-FIXTURE-MANIFEST-07-json-dom-native-parity` | JSON, DOM, native, playback, and restore parity. | `domParityFixture`, `nativeParityFixture`, `playbackSafetyFixture`, `restorePreserved`, `JSONDOMParity`, `nativeParity`, `selectedCurrentPreserved`. | Missing artifact; parity approval remains 0. |
| `FT-JSON-FIXTURE-MANIFEST-08-no-work-side-effect-budget` | No-work and side-effect proof. | `noWorkProof`, `sideEffectBudget`, `listenerObserverTimerBudget`, `networkStorageBudget`, `transportNoWorkProof`, `visualNoWorkProof`, `sideEffectApprovalStatus`. | Missing artifact; no-work and side-effect approval remain 0. |
| `FT-JSON-FIXTURE-MANIFEST-09-diagnostic-metric-privacy` | Diagnostic privacy and route/surface metric artifact. | `metricArtifact`, `diagnosticPrivacyFixture`, `diagnosticPrivacy`, `metricSampleEnvelope`, `consoleBudget`, `redactionPolicy`, `metricApprovalStatus`. | Missing artifact; metric and diagnostic approval remain 0. |
| `FT-JSON-FIXTURE-MANIFEST-10-rollback-release-public` | Rollback, unclaimed surfaces, release, and public claim limits. | `rollbackPlan`, `rollbackScope`, `unclaimedSurfaceList`, `releaseClaimScope`, `publicClaimScope`, `nativeSyncStatus`, `releaseInputScope`. | Missing artifact; release/public approval remains 0. |
| `FT-JSON-FIXTURE-MANIFEST-11-verification-authority` | Verification command, TAP output, and authority absence. | `verificationCommand`, `verificationOutput`, `expectedTests`, `expectedPass`, `expectedFail`, `artifactAbsenceCheck`, `authorityTokenAbsenceCheck`. | Missing artifact; no persisted TAP output. |

## Current Manifest Decision

```text
define JSON-first route/surface fixture manifest contract: GO
commit route/surface fixture manifest artifact now: NO-GO
commit route/surface fixture packet root now: NO-GO
use route/surface fixture manifest as implementation authority now: NO-GO
runtime JSON-first fixture manifest approval now: NO-GO
runtime JSON-first fixture packet approval now: NO-GO
runtime route/surface metric artifact approval now: NO-GO
runtime metric collector insertion now: NO-GO
affected callable semantic proof: NO-GO
native sync patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

This contract does not create `manifest.json` or the route/surface fixture
packet root. A future patch that creates the manifest must also prove artifact
path validity, fixture sample coupling, provenance, parity report,
verification output, no-work preservation, side-effect budgets, diagnostic
privacy, rollback and unclaimed-surface boundaries, native/release limits,
raw-capture exclusion, affected callable semantic proof, public-claim limits,
and runtime authority absence or approval.

## Missing Product Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
jsonFirstRouteSurfaceFixtureManifestContract
jsonFirstRouteSurfaceFixtureManifestReport
jsonFirstRouteSurfaceFixtureManifestApproval
jsonFirstRouteSurfaceFixtureManifestNoGoBoundary
jsonFirstRouteSurfaceFixtureRouteBindingManifest
jsonFirstRouteSurfaceFixtureArtifactManifest
jsonFirstRouteSurfaceFixtureManifestRuntimeApproval
jsonFirstRouteSurfaceFixtureManifestMetricApproval
jsonFirstRouteSurfaceFixtureManifestVerification
jsonFirstRouteSurfaceFixtureManifestPublicClaimApproval
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future route/surface
fixture `manifest.json` shape while proving no manifest artifact, fixture
packet artifact, runtime fixture approval, route/surface metric artifact,
runtime collector, native sync patch, release package patch, or public claim
exists yet.
Method semantic proof gap counts remain audit-only evidence and do not approve
the manifest artifact or JSON-first behavior.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
track this manifest contract as the first per-file route/surface fixture
artifact contract. The addendum pins 10 artifact contract coverage rows, 1
per-file fixture artifact contract doc, 1 per-file fixture artifact contract
test, 5 reserved future artifact files, 0 committed route/surface fixture
packet files, 69 method semantic proof gap files covered, 5,789 method
semantic proof gap lexical callables covered, 0 files with complete
per-callable semantic proof, 0 runtime JSON-first fixture packet approvals, and 0
implementation-ready route/surface fixture artifact contract coverage rows.

## JSON-First Route/Surface Fixture Sample Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs`
define the future `fixture-sample.json` contract that must remain coupled to
this manifest contract before route/surface fixture artifacts become
implementation authority. The addendum pins 12 fixture sample contract rows,
1 reserved sample path, 0 committed route/surface fixture sample files, 0
runtime JSON-first fixture sample approvals, 0 runtime JSON-first fixture
packet approvals, and 0 implementation-ready JSON-first fixture sample
contract rows.

## JSON-First Route/Surface Fixture Provenance Artifact Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs`
define the future `provenance.json` contract that must remain coupled to this
manifest contract before route/surface fixture artifacts become implementation
authority. The addendum pins 12 fixture provenance artifact contract rows, 1
reserved provenance path, 0 committed route/surface fixture provenance
artifact files, 0 runtime JSON-first fixture provenance approvals, 0 runtime
JSON-first fixture packet approvals, and 0 implementation-ready JSON-first
fixture provenance artifact contract rows.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs`
define the future `parity-report.json` contract that must remain coupled to
this manifest contract before route/surface fixture artifacts become
implementation authority. The addendum pins 12 fixture parity report contract
rows, 1 reserved parity report path, 0 committed route/surface fixture parity
report files, 0 runtime JSON-first fixture parity report approvals, 0 runtime
JSON-first fixture packet approvals, and 0 implementation-ready JSON-first
fixture parity report contract rows.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
define the future `verification-output.tap` contract that must bind this
manifest contract to exact command, TAP output, runtime count, artifact
absence, authority absence, parity, rollback, native/release, raw-capture, and
public-claim proof. The addendum pins 12 fixture verification output contract
rows, 1 reserved verification output path, 0 committed route/surface fixture
verification output files, 0 runtime JSON-first fixture verification output
approvals, 0 runtime JSON-first fixture packet approvals, and 0
implementation-ready JSON-first fixture verification output contract rows.
