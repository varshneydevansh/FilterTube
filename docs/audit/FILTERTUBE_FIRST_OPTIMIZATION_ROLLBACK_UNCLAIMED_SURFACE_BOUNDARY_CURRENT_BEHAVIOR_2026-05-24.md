# FilterTube First Optimization Rollback Unclaimed Surface Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization rollback and
unclaimed-surface boundary. Runtime behavior is unchanged. This is not an
implementation patch, optimization patch, metric collector patch, JSON-first
behavior patch, whitelist patch, native sync patch, release package patch,
public claim patch, diagnostic patch, committed metric artifact, persisted TAP
output, rollback implementation, or artifact-root creation.

## Purpose

The metric-foundation contract set now names every future packet file, but the
rollback and unclaimed-surface terms are still blockers rather than a separate
approval gate. This slice isolates those terms before any metric-foundation
artifact, collector, JSON-first optimization, whitelist optimization, native
sync change, release package change, or public claim can rely on the first
optimization packet.

The current boundary is:

```text
Rollback/unclaimed boundary artifact files: 0
Runtime rollback approvals: 0
Runtime unclaimed-surface approvals: 0
Runtime metric collector approval exists: no
Implementation-ready rollback/unclaimed rows: 0
```

This gate is not a rollback plan and not a release plan. It is an audit-only
requirement that a future scoped packet must name the measured surfaces, the
explicitly unclaimed surfaces, the rollback command or manual rollback owner,
artifact absence checks, authority-token absence checks, raw-capture exclusion,
native sync limits, release package limits, public claim limits, and diagnostic
performance claim limits before runtime behavior changes. It must also bind the
rollback and unclaimed-surface claims to the affected callable set and current
method semantic proof status.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_FOUNDATION_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Proves the reserved metric-foundation contract set is complete but still has 0 committed artifacts and 0 runtime collector approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines rollback and unclaimed-surface fields for future verification output, but proves 0 persisted verification output files. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines measured/unclaimed parity rollout fields, but proves 0 parity rollout files and 0 rollout approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_DIAGNOSTIC_PRIVACY_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Requires diagnostic privacy and performance claim scope before rollout claims. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 JS/JSX/MJS files and 5,681 lexical callables still lack complete per-callable semantic proof before behavior changes. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Maps first-collector parity rollout risks, but proves 0 runtime collector parity rollout proofs approved. |
| `docs/audit/FILTERTUBE_JSON_DOM_INVENTORY_TRUTH_AUDIT_2026-05-18.md` | Inventory rows remain route/surface evidence until executable fixtures, sibling proof, native sync proof, release proof, and public claim proof exist. |
| `docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_AUTHORITY_AUDIT_2026-05-18.md` | Extension-side metric evidence remains separate from app sync, generated assets, native parity, release packages, and public claims. |
| `docs/audit/FILTERTUBE_NATIVE_RUNTIME_SYNC_MANIFEST_FRESHNESS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Native parity gates remain future work for app release public claims. |
| `docs/audit/FILTERTUBE_RELEASE_PACKAGE_PARITY_AUDIT_2026-05-18.md` | Package contents, public claims, and uploaded assets are not auditable before a release without a package manifest gate. |
| `docs/audit/FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Release package manifest, public claim manifest, artifact manifest, and public release rollback/delete path are absent. |
| `docs/audit/FILTERTUBE_PUBLIC_RELEASE_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md` | Public claim authority is missing claim IDs, signing fingerprint gates, and APK/AAB pair gates. |
| `docs/audit/FILTERTUBE_RAW_CAPTURE_RELEASE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md` | Raw captures remain evidence-only and must not become JSON/DOM/native parity proof, package input, generated runtime input, website content, release artifact, or public claim source. |
| `docs/audit/FILTERTUBE_TRACKED_PUBLIC_DOC_CLAIM_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md` | Tracked public docs still need claim-to-runtime traceability, fixture proof, release artifact parity, native freshness proof, and performance metric artifacts. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked in the audit harness, not as a release, public, or rollback artifact. |

## Current Counts

```text
first optimization rollback unclaimed surface boundary rows: 12
upstream metric foundation contract coverage rows covered: 12
verification output contract rows covered: 12
parity rollout contract rows covered: 12
diagnostic privacy contract rows covered: 12
collector parity rollout rows covered: 12
release/native/public boundary source docs covered: 8
committed rollback/unclaimed artifacts: 0
runtime rollback approvals: 0
runtime unclaimed-surface approvals: 0
runtime metric collector approvals: 0
implementation-ready rollback/unclaimed rows: 0
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for rollback or unclaimed-surface authority
```

## Rollback Unclaimed Surface Matrix

| Rollback/unclaimed row id | Required boundary section | Required structured fields | Current state |
| --- | --- | --- | --- |
| `FT-ROLLBACK-UNCLAIMED-00-packet-binding` | Packet, candidate, and affected callable proof binding. | `packetId`, `candidateId`, `bindingId`, `obligationId`, `metricFoundationContractId`, `verificationOutputId`, `parityRolloutId`, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-01-json-dom-scope` | JSON and DOM measured surface scope. | `jsonFixturePaths`, `domFixturePaths`, `measuredJsonSurfaces`, `measuredDomSurfaces`, `unclaimedJsonSurfaces`, `unclaimedDomSurfaces`, `siblingPreservationProof`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-02-comment-continuation-scope` | Comment continuation scope. | `endpointContinuationSurfaces`, `actionContinuationSurfaces`, `commandContinuationSurfaces`, `appendCommandSurfaces`, `unclaimedContinuationRoots`, `continuationRollbackBoundary`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-03-ytm-selected-row-scope` | YTM selected/current row scope. | `ytmJsonSurfaces`, `ytmDomSurfaces`, `selectedRowProof`, `currentRowProof`, `unclaimedYtmSurfaces`, `ytmRollbackBoundary`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-04-kids-native-webview-scope` | Kids extension and native WebView scope. | `kidsExtensionSurfaces`, `nativeWebViewSurfaces`, `unclaimedNativeWebViewSurfaces`, `intentionalDivergence`, `platformRollbackBoundary`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-05-native-sync-scope` | Native sync freshness and rollback scope. | `sourceRevision`, `appRevision`, `generatedRuntimeHashes`, `nativeSyncCommand`, `nativeRollbackCommand`, `unclaimedNativeSyncClaims`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-06-release-package-scope` | Release package scope. | `releasePackageManifest`, `packagePath`, `packageHash`, `includedSourceFamilies`, `excludedSourceFamilies`, `releaseRollbackCommand`, `unclaimedReleaseArtifacts`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-07-public-claim-scope` | Public claim scope. | `publicClaimIds`, `claimSurface`, `platform`, `claimStatus`, `requiredArtifact`, `requiredChecksum`, `requiredSigningFingerprint`, `unclaimedPublicClaims`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-08-raw-capture-exclusion-scope` | Raw capture release exclusion. | `rawCaptureExclusionManifest`, `ignoredCapturePaths`, `trackedFixturePaths`, `packageIncluded`, `websiteReferenced`, `nativeSyncInput`, `publicClaimInput`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-09-diagnostic-performance-scope` | Diagnostic and performance claim scope. | `diagnosticPrivacyId`, `metricArtifactPath`, `browserDeviceScope`, `elapsedWorkCounters`, `consolePrivacyClass`, `publicPerformanceClaimScope`, `logOnlyClaimForbidden`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-10-rollback-command-boundary` | Rollback command and owner boundary. | `rollbackBoundary`, `rollbackCommand`, `manualRollbackOwner`, `artifactRemovalCommand`, `collectorDisableCommand`, `releaseRollbackCommand`, `publicClaimRetractionCommand`. | Missing. |
| `FT-ROLLBACK-UNCLAIMED-11-claim-block` | Unclaimed surface, callable owner proof, and authority claim block. | `unclaimedSurfaces`, `unclaimedNativeSurfaces`, `unclaimedReleaseSurfaces`, `unclaimedPublicClaims`, `authorityTokenAbsenceCheck`, `claimExpansionGate`, `approvalStatus`, `callableOwnerProofStatus`. | Missing. |

## Current Rollback Unclaimed Surface Decision

```text
define rollback/unclaimed surface boundary: GO
commit rollback/unclaimed artifact now: NO-GO
runtime rollback implementation: NO-GO
runtime metric collector insertion: NO-GO
JSON-first runtime behavior patch: NO-GO
whitelist optimization patch: NO-GO
native sync patch: NO-GO
release package patch: NO-GO
public claim patch: NO-GO
continue proof-backed audit: GO
```

This gate does not create a rollback artifact or approve any rollback behavior.
A future patch that claims first-optimization readiness must first provide a
scoped packet with measured surfaces, explicit unclaimed surfaces, rollback
commands or owners, release/public retraction boundaries, artifact absence
checks, authority absence checks, raw-capture exclusions, diagnostic privacy,
verification output, affected callable semantic proof, and release/public-claim
limits.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationRollbackUnclaimedSurfaceBoundary
firstOptimizationRollbackUnclaimedSurfaceReport
firstOptimizationRollbackApproval
firstOptimizationRollbackNoGoBoundary
jsonFirstRollbackUnclaimedSurfaceAuthority
metricArtifactRollbackUnclaimedCollector
metricArtifactRollbackRuntimeApproval
whitelistOptimizationRollbackBudget
nativeSyncRollbackApproval
releasePackageRollbackApproval
publicClaimRollbackApproval
rawCaptureRollbackExclusionProof
unclaimedSurfaceClaimBlock
unclaimedSurfacePublicScopeReport
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-rollback-unclaimed-surface-boundary-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It proves rollback, unclaimed-surface,
native sync, release, raw-capture, diagnostic, performance, and public-claim
limits are named as a separate audit-only boundary while no artifact, runtime
collector, rollback implementation, native sync patch, release package patch,
public claim patch, or runtime optimization approval exists yet.

## First Optimization Artifact Commit Readiness Gate Addendum

First optimization artifact commit readiness gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-artifact-commit-readiness-gate-current-behavior.test.mjs`
prove the reserved metric-foundation artifact root and files are not
commit-ready yet without creating the artifact root, artifact files, runtime
collectors, rollback implementation, native sync changes, release package
changes, or public claims. The addendum pins 12 artifact commit readiness rows,
1 reserved artifact root covered, 9 reserved artifact files covered, 9 contract
docs covered, 9 contract tests covered, 0 committed metric foundation artifact
files, 0 runtime metric collector approvals, 0 runtime rollback approvals, 0
runtime unclaimed-surface approvals, 0 implementation-ready artifact commit
rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and
expected runtime audit fail 0. It keeps artifact commits blocked until
collector approval, no-work proof, side-effect proof, fixture provenance,
diagnostic privacy, parity rollout, verification output, rollback,
unclaimed-surface, native/release, raw-capture, and public-claim limits are
proved.

## First Optimization Source-Locus Parity Release Verification Ownership Boundary Addendum

First optimization source-locus parity release verification ownership boundary
addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-source-locus-parity-release-verification-ownership-boundary-current-behavior.test.mjs`
binds rollback and unclaimed-surface blockers back to the current source-locus
ownership chain without creating rollback artifacts, runtime collectors,
native sync changes, release packages, public claims, or persisted TAP output.
The addendum pins 12 source-locus parity release verification rows, 12
rollback/unclaimed boundary rows covered, 12 parity rollout contract rows
covered, 12 verification output contract rows covered, 8 release/native/public
boundary source docs covered, 0 committed rollback/unclaimed artifacts, 0
runtime rollback approvals, 0 runtime unclaimed-surface approvals, 0 runtime
metric collector approvals, 0 implementation-ready source-locus parity release
verification rows, expected runtime audit tests: 4457, expected runtime audit
pass 4457, and expected runtime audit fail 0.

## First Optimization Collector Parity Rollout Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-parity-rollout-approval-boundary-current-behavior.test.mjs`
bind rollback and unclaimed-surface blockers to the missing collector parity
rollout approval layer. The addendum pins 12 collector parity rollout approval
boundary rows, 12 rollback/unclaimed rows covered, 12 parity rollout contract
rows covered, 0 runtime rollback approvals, 0 runtime unclaimed-surface
approvals, 0 runtime collector parity rollout approvals, 0 committed parity
rollout files, 0 implementation-ready collector parity rollout approval rows,
expected runtime audit tests: 4457, expected runtime audit pass: 4457, and
expected runtime audit fail 0.

## First Optimization Collector Verification Output Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-verification-output-approval-boundary-current-behavior.test.mjs`
bind rollback and unclaimed-surface blockers to the missing collector
verification output approval layer. The addendum pins 12 collector verification
output approval boundary rows, 12 rollback/unclaimed rows covered, 12
verification output contract rows covered, 69 method semantic proof gap files
covered, 5,681 lexical callables still requiring semantic proof, 0 files with
complete per-callable semantic proof, 0 runtime rollback approvals, 0 runtime
unclaimed-surface approvals, 0 runtime collector verification output
approvals, 0 committed verification output files, 0 implementation-ready
collector verification output approval rows, expected runtime audit tests:
4457, expected runtime audit pass: 4457, and expected runtime audit fail 0.

## First Optimization Collector Rollback Unclaimed Approval Boundary Addendum

`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_ROLLBACK_UNCLAIMED_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-collector-rollback-unclaimed-approval-boundary-current-behavior.test.mjs`
prove this rollback/unclaimed boundary is not runtime rollback or
unclaimed-surface approval. The addendum pins 12 collector rollback/unclaimed
approval boundary rows, 12 rollback/unclaimed rows covered, 12 collector
verification output approval rows covered, 69 method semantic proof gap files
covered, 5,681 lexical callables still requiring semantic proof, 0 files with
complete per-callable semantic proof, 0 runtime rollback approvals, 0 runtime
unclaimed-surface approvals, 0 runtime collector rollback/unclaimed approvals,
0 committed rollback/unclaimed artifacts, 0 implementation-ready collector
rollback/unclaimed approval rows, expected runtime audit tests: 4457, expected
runtime audit pass: 4457, and expected runtime audit fail 0.
