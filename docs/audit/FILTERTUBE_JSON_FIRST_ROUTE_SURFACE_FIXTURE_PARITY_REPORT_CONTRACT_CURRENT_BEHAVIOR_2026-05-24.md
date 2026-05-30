# FilterTube JSON-First Route Surface Fixture Parity Report Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface fixture parity
report contract. Runtime behavior is unchanged. This is not an implementation
patch, optimization patch, JSON-first behavior patch, whitelist patch, metric
collector patch, fixture commit patch, route/surface policy patch, native sync
patch, release patch, public claim patch, persisted TAP output, artifact-root
creation, committed parity report artifact, or raw-capture promotion.

## Purpose

The route/surface fixture artifact path boundary reserves
`docs/audit/artifacts/json-first/route-surface-fixture-packet/parity-report.json`
for future JSON, DOM, native, release, diagnostic, rollback, and public-claim
parity evidence. This contract defines the minimum parity report sections
without creating that file. It turns the fourth reserved route/surface fixture
artifact into a per-file contract while keeping JSON-first implementation
authority at NO-GO.

The current boundary is:

```text
Reserved route/surface fixture parity report path: docs/audit/artifacts/json-first/route-surface-fixture-packet/parity-report.json
Method semantic proof gap files covered: 63
Method semantic proof gap lexical callables covered: 5469
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5469
Committed route/surface fixture parity report files: 0
Runtime JSON-first fixture parity report approval exists: no
Runtime JSON-first fixture packet approval exists: no
Runtime route/surface metric artifact approval exists: no
Implementation-ready JSON-first fixture parity report contract rows: 0
```

This parity report contract is the handoff between provenance and verification.
A future `parity-report.json` file must bind the route/surface sample and
provenance artifact to concrete JSON paths, DOM selectors, native runtime
freshness, release package boundaries, raw-capture exclusion, public-claim
scope, rollback coverage, unclaimed surfaces, and exact verification output
before it can be used as JSON-first implementation authority.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the aggregate 12-row route/surface fixture packet contract and required fixture evidence classes. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future manifest contract that must reference this parity report. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future sample contract that parity must compare against rendered and native surfaces. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future provenance artifact contract that must supply source and fixture evidence before parity claims. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines broader parity/rollout proof while proving 0 committed parity rollout files and 0 runtime collector approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves parity/rollout proof remains required and 0 collector parity rollout proofs are approved. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Reserves `parity-report.json` under the future route/surface fixture packet root, but proves 0 committed fixture packet files. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Tracks per-file fixture artifact contract coverage and keeps implementation authority at NO-GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved route/surface fixture artifact root and files are not commit-ready. |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps route/surface implementation approval at NO-GO. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines 12 route/surface metric obligations and 0 implementation-ready route/surface optimization rows. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 63 files and 5,469 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a committed parity report artifact. |

## Current Counts

```text
JSON-first route/surface fixture parity report contract rows: 12
reserved fixture parity report paths covered: 1
manifest contract rows covered: 12
fixture sample contract rows covered: 12
provenance artifact contract rows covered: 12
aggregate fixture packet contract rows covered: 12
parity rollout contract rows covered: 12
collector parity rollout rows covered: 12
artifact contract coverage rows covered: 10
artifact path boundary rows covered: 6
artifact commit readiness rows covered: 10
route/surface authority rows covered: 12
route/surface metric obligations covered: 12
fixture mode classes covered: 8
fixture evidence classes covered: 14
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
committed route/surface fixture parity report files: 0
committed route/surface fixture packet files: 0
runtime JSON-first fixture parity report approvals: 0
runtime JSON-first fixture packet approvals: 0
runtime route/surface metric artifact approvals: 0
runtime metric collector approvals: 0
implementation-ready JSON-first fixture parity report contract rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface fixture parity report authority
```

## Fixture Parity Report Contract Matrix

| Parity row id | Required parity report section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-JSON-FIXTURE-PARITY-00-report-identity` | Parity report identity and schema. | `parityReportVersion`, `parityReportId`, `packetId`, `manifestId`, `sampleId`, `provenanceArtifactId`, `auditOnlyStatus`. | Missing artifact; contract only. |
| `FT-JSON-FIXTURE-PARITY-01-artifact-binding` | Manifest, sample, provenance, and callable binding. | `manifestPath`, `fixtureSamplePath`, `provenanceArtifactPath`, `parityReportPath`, `fixturePacketContractVersion`, `routeSurfaceRowId`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing artifact; no parity approval or affected callable semantic proof. |
| `FT-JSON-FIXTURE-PARITY-02-json-path-scope` | JSON route and path parity scope. | `jsonRoute`, `endpointFamily`, `jsonPathClass`, `jsonPaths`, `rendererClass`, `nestedRendererPolicy`, `jsonSupportedStatus`. | Missing artifact; JSON scope is not approved. |
| `FT-JSON-FIXTURE-PARITY-03-dom-selector-scope` | DOM selector and rendered-state scope. | `domSurface`, `domSelectorClass`, `domSelectors`, `selectedCurrentPolicy`, `restoreProof`, `playbackSafetyProof`, `domSupportedStatus`. | Missing artifact; DOM scope is not approved. |
| `FT-JSON-FIXTURE-PARITY-04-json-dom-diff` | JSON/DOM parity diff. | `jsonFixturePath`, `domFixturePath`, `expectedHiddenVideoIds`, `expectedVisibleVideoIds`, `parityDiff`, `falseHideLeakBudget`. | Missing artifact; diff proof remains 0. |
| `FT-JSON-FIXTURE-PARITY-05-native-runtime` | Native and generated runtime parity. | `nativeFixturePath`, `generatedRuntimeHash`, `sourceRevision`, `appRevision`, `intentionalDivergence`, `nativeParityStatus`. | Missing artifact; native parity remains NO-GO. |
| `FT-JSON-FIXTURE-PARITY-06-release-package` | Release package parity. | `releasePackageManifest`, `packagePath`, `sourcePath`, `manifestReferenced`, `webAccessible`, `packageHash`, `quarantineStatus`. | Missing artifact; release package parity remains NO-GO. |
| `FT-JSON-FIXTURE-PARITY-07-raw-capture-exclusion` | Raw-capture release exclusion. | `rawCaptureExclusionManifest`, `rawSourcePath`, `ignored`, `packageIncluded`, `websiteReferenced`, `nativeSyncSource`, `releaseInputExcluded`. | Missing artifact; raw-capture exclusion approval remains 0. |
| `FT-JSON-FIXTURE-PARITY-08-public-claim-scope` | Public claim and rollout scope. | `publicClaimScope`, `platformScope`, `claimSurface`, `requiredArtifact`, `requiredChecksum`, `requiredStoreUrl`, `lastVerifiedAt`. | Missing artifact; public claim scope remains NO-GO. |
| `FT-JSON-FIXTURE-PARITY-09-diagnostic-performance` | Diagnostic and performance claim scope. | `diagnosticPrivacy`, `redactionPolicy`, `metricSampleEnvelope`, `elapsedWorkCounters`, `consoleBudget`, `publicPerformanceClaimForbidden`. | Missing artifact; diagnostic claim approval remains 0. |
| `FT-JSON-FIXTURE-PARITY-10-rollback-unclaimed` | Rollback and unclaimed-surface limits. | `rollbackScope`, `rollbackCommand`, `unclaimedSurfaces`, `unmeasuredSurfaceExclusion`, `rolloutProofStatus`, `authorityBoundary`. | Missing artifact; rollback and unclaimed-surface approvals remain 0. |
| `FT-JSON-FIXTURE-PARITY-11-verification` | Verification and authority boundary. | `verificationCommand`, `verificationOutput`, `expectedTests`, `expectedPass`, `expectedFail`, `authorityTokenAbsenceCheck`. | Missing artifact; no persisted TAP output. |

## Current Parity Report Decision

```text
define JSON-first route/surface fixture parity report contract: GO
commit route/surface fixture parity report artifact now: NO-GO
commit route/surface fixture packet root now: NO-GO
use route/surface fixture parity report as implementation authority now: NO-GO
runtime JSON-first fixture parity report approval now: NO-GO
runtime JSON-first fixture packet approval now: NO-GO
runtime route/surface metric artifact approval now: NO-GO
runtime metric collector insertion now: NO-GO
affected callable semantic proof: NO-GO
native sync patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

This contract does not create `parity-report.json` or the route/surface
fixture packet root. A future patch that creates the parity report must also
prove manifest/sample/provenance coupling, JSON path scope, DOM selector
scope, JSON/DOM/native parity, release package parity, raw-capture exclusion,
diagnostic privacy, rollback and unclaimed-surface boundaries, public-claim
limits, affected callable semantic proof, and runtime authority absence or
approval.

## Missing Product Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
jsonFirstRouteSurfaceFixtureParityReportContract
jsonFirstRouteSurfaceFixtureParityReportApproval
jsonFirstRouteSurfaceFixtureParityReportNoGoBoundary
jsonFirstRouteSurfaceFixtureParityReportRuntimeApproval
jsonFirstRouteSurfaceFixtureParityReportMetricApproval
jsonFirstRouteSurfaceFixtureParityReportPublicClaimApproval
jsonFirstRouteSurfaceFixtureParityReportNativeSyncApproval
jsonFirstRouteSurfaceFixtureParityReportReleaseApproval
jsonFirstRouteSurfaceFixtureParityReportRawCaptureExclusion
jsonFirstRouteSurfaceFixtureParityReportRuntimeAuthority
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It defines the future route/surface
fixture `parity-report.json` shape while proving no parity report artifact,
fixture packet artifact, runtime fixture approval, route/surface metric
artifact, runtime collector, native sync patch, release package patch, or
public claim exists yet.
Method semantic proof gap counts remain audit-only evidence and do not approve
the parity report artifact or JSON-first behavior.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
track this parity report contract as the fourth per-file route/surface fixture
artifact contract while keeping `parity-report.json` absent and unapproved.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
define the future `verification-output.tap` contract that must bind this
parity report to exact command, TAP output, runtime count, artifact absence,
authority absence, adjacent gate, JSON/DOM/native/release parity, rollback,
diagnostic, raw-capture, and public-claim proof. The addendum pins 12 fixture
verification output contract rows, 1 reserved verification output path, 0
committed route/surface fixture verification output files, 0 runtime
JSON-first fixture verification output approvals, and 0 implementation-ready
JSON-first fixture verification output contract rows.
