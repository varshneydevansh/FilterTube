# FilterTube JSON-First Route Surface Fixture Packet Contract - Current Behavior - 2026-05-24

Status: audit-only current-behavior JSON-first route/surface fixture packet
contract. Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, JSON-first behavior patch, whitelist patch, metric
collector patch, fixture commit patch, route/surface policy patch, native sync
patch, release patch, public claim patch, or raw-capture promotion.

## Purpose

The JSON-first route/surface implementation authority boundary proves
endpoint-shaped rows are not enough to approve JSON-first runtime behavior.
This contract defines the fixture packet that must exist before any future
JSON-first route/surface row can become first-class filter implementation
authority.

The current boundary is:

```text
JSON-first route/surface fixture packet rows: 12
Route/surface authority rows covered: 12
Route/surface metric obligations covered: 12
Fixture mode classes required: 8
Fixture evidence classes required: 14
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5744
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5744
Runtime JSON-first fixture packet approvals: 0
Committed route/surface fixture packet files: 0
Implementation-ready JSON-first fixture packet rows: 0
```

This is a fixture packet contract, not fixture approval and not route/surface
implementation permission.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the 12 JSON-first route/surface implementation authority rows that remain NO-GO. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the 12 route/surface metric obligations that every future packet must bind. |
| `docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Requires route/surface scope, fixture provenance, DOM parity, native parity, metric artifacts, rollback, and release proof before JSON-first implementation. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_FIXTURE_PROVENANCE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Proves collector fixture packets are not approved and fixture provenance remains implementation-blocking. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_FIXTURE_PROVENANCE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines the future fixture provenance artifact shape for selected metric foundation work. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 files and 5,697 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO until the complete evidence chain exists. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Runtime proof is tracked by the audit harness, not as fixture packet approval. |

## Current Counts

```text
JSON-first route/surface fixture packet rows: 12
route/surface authority rows covered: 12
route/surface metric obligations covered: 12
endpoint families covered: 5
surface families covered: 6
fixture mode classes required: 8
fixture evidence classes required: 14
JSON-first implementation authority rows covered: 13
first optimization implementation readiness rows covered: 14
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
runtime JSON-first fixture packet approvals: 0
runtime route/surface metric artifacts: 0
runtime metric collector approvals: 0
committed route/surface fixture packet files: 0
implementation-ready JSON-first fixture packet rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for JSON-first route/surface fixture packet authority
```

## Fixture Packet Contract Matrix

| Fixture packet row id | Route/surface authority row | Current fixture gap | Required packet proof before implementation |
| --- | --- | --- | --- |
| `FT-JSON-FIXTURE-00-endpoint-admission` | `FT-JSON-ROUTE-00-endpoint-admission` | Endpoint family admission is shape-based before one route decision exists. | Endpoint-to-route fixtures for disabled, missing-settings, no-rule, active-rule, clone/parse/stringify, and response-rebuild budgets. |
| `FT-JSON-FIXTURE-01-main-home` | `FT-JSON-ROUTE-01-main-home` | Desktop and mobile home browse have different no-work and DOM fallback behavior. | Desktop and mobile home positive, empty-list, disabled, sibling-visible, DOM parity, and route-transition cleanup fixtures. |
| `FT-JSON-FIXTURE-02-main-search` | `FT-JSON-ROUTE-02-main-search` | Search rows mix JSON renderers, refinement cards, direct watch cards, shelves, and DOM selectors. | Supported-renderer positive fixtures, unsupported-renderer leak fixtures, shelf/sibling-visible proof, direct-watch-card proof, and DOM fallback parity. |
| `FT-JSON-FIXTURE-03-watch-player-next` | `FT-JSON-ROUTE-03-watch-player-next` | Watch `/player` and `/next` mix metadata, recommendations, comments, playlist, end screen, and playback-adjacent effects. | Metadata-only, recommendation, comment continuation, playlist, end-screen, scaffold-preservation, selected-current, and playback-safety fixtures. |
| `FT-JSON-FIXTURE-04-shorts` | `FT-JSON-ROUTE-04-shorts` | Shorts identity can be JSON, DOM, learned-map, native-overlay, or background-fallback dependent. | Owner identity confidence, overlay parity, learned-map freshness, fallback fetch budget, restore, and unclaimed-surface fixtures. |
| `FT-JSON-FIXTURE-05-playlist-mix` | `FT-JSON-ROUTE-05-playlist-mix` | Playlist/Mix rows combine JSON playlist ids, DOM selected/current rows, Mix/radio policy, and next-click side effects. | Selected-current preservation, Mix/radio policy, playback side-effect, negative sibling, native parity, and YTM parity fixtures. |
| `FT-JSON-FIXTURE-06-comments-posts` | `FT-JSON-ROUTE-06-comments-posts` | Comments and posts use continuation shapes, wrapper cleanup, author identity, ViewModel gaps, and comment-specific whitelist policy. | Comment continuation, sibling wrapper preservation, author identity, comment whitelist, post DOM, unsupported renderer leak, and structural cleanup fixtures. |
| `FT-JSON-FIXTURE-07-kids` | `FT-JSON-ROUTE-07-kids` | Kids JSON, DOM, passive listener, native shell, and sparse watch fallback owners are split. | Kids browse/watch fixtures, passive listener budget, native shell parity, sparse identity fallback, release claim scope, and no-public-claim fixtures. |
| `FT-JSON-FIXTURE-08-ytm-mobile` | `FT-JSON-ROUTE-08-ytm-mobile` | YTM/mobile rows share `ytm-*` selectors, playlist panels, selected rows, bottom sheets, and compact renderers. | JSON/DOM selected-row parity, bottom-sheet, compact renderer, mobile listener budget, negative sibling, and Main/YTM divergence fixtures. |
| `FT-JSON-FIXTURE-09-native-overlay` | `FT-JSON-ROUTE-09-native-overlay` | Native overlay and fullscreen quiet mode pause some work but do not own every JSON, DOM, menu, quick-block, or metric path. | Quiet-mode owner, pause/resume count, unclaimed work, native freshness, release parity, and overlay resume/restore fixtures. |
| `FT-JSON-FIXTURE-10-lifecycle-affordance` | `FT-JSON-ROUTE-10-lifecycle-affordance` | Menu and quick-block route work can outlive visible affordance predicates. | Action-positive, disabled, no-rule, menu-off, quick-block-off, teardown, listener/observer/timer, and diagnostic budget fixtures. |
| `FT-JSON-FIXTURE-11-diagnostic-metric` | `FT-JSON-ROUTE-11-diagnostic-metric` | Diagnostic logging and counters are not committed route/sample/device artifacts. | Metric sample envelope, diagnostic privacy, before/after counter, no-work, side-effect, TAP output, and rollout-scope fixtures. |

## Required Fixture Packet Fields

A future JSON-first route/surface fixture packet must include:

```text
packetId
JSONRouteSurfaceRowId
obligationId
candidateId
endpointFamily
route
surface
profileType
listMode
ruleState
rendererClass
identityTier
sourceCapturePath
reducedFixturePath
positiveFixture
negativeSiblingFixture
disabledFixture
emptyListFixture
sparseSurfaceFixture
domParityFixture
nativeParityFixture
commentContinuationFixture
selectedCurrentFixture
playbackSafetyFixture
lifecycleAffordanceFixture
diagnosticPrivacyFixture
metricArtifact
sourceOwnerMap
noWorkProof
sideEffectBudget
fixtureProvenance
affectedCallableIds
methodSemanticProofStatus
methodSemanticProofArtifact
rollbackPlan
unclaimedSurfaceList
releaseClaimScope
verificationOutput
```

## Required Fixture Mode Classes

```text
disabled
missingSettings
noRule
emptyBlocklist
emptyWhitelist
nonemptyBlocklist
nonemptyWhitelist
contentFilterEmptyValues
```

## Required Fixture Evidence Classes

```text
positiveHide
negativeSiblingVisible
restorePreserved
JSONDOMParity
nativeParity
selectedCurrentPreserved
commentContinuationPreserved
playbackSafetyPreserved
sparseIdentityFallback
listenerObserverTimerBudget
networkStorageBudget
diagnosticPrivacy
rollbackScope
publicClaimScope
```

## Reserved Fixture Packet Paths

These paths are reserved future artifact paths and are intentionally absent:

```text
docs/audit/artifacts/json-first/route-surface-fixture-packet/manifest.json
docs/audit/artifacts/json-first/route-surface-fixture-packet/fixture-sample.json
docs/audit/artifacts/json-first/route-surface-fixture-packet/provenance.json
docs/audit/artifacts/json-first/route-surface-fixture-packet/parity-report.json
docs/audit/artifacts/json-first/route-surface-fixture-packet/verification-output.tap
```

## Current Decision

```text
JSON-first route/surface fixture packet contract documented: GO
JSON-first route/surface fixture packet approval now: NO-GO
commit route/surface fixture packet artifact now: NO-GO
use route/surface fixture packet as implementation authority now: NO-GO
JSON-first route/surface runtime approval now: NO-GO
route/surface metric artifact approval now: NO-GO
affected callable semantic proof: NO-GO
native/release/public claim based on route/surface packet now: NO-GO
continue proof-backed audit: GO
```

## Missing Product Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
jsonFirstRouteSurfaceFixturePacketContract
jsonFirstRouteSurfaceFixturePacketReport
jsonFirstRouteSurfaceFixturePacketApproval
jsonFirstRouteSurfaceFixtureManifest
jsonFirstRouteSurfacePositiveFixture
jsonFirstRouteSurfaceNegativeSiblingFixture
jsonFirstRouteSurfaceSparseFixture
jsonFirstRouteSurfaceParityPacket
jsonFirstRouteSurfaceFixtureNoGoReport
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-route-surface-fixture-packet-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It proves the fixture packet that
would make JSON-first route/surface filtering first-class is still missing, and
that no runtime approval, metric artifact, native/release proof, or public
claim can be inferred from endpoint-shaped JSON rows.
Method semantic proof gap counts remain audit-only evidence and do not approve
fixture packets or JSON-first behavior.

## JSON-First Route/Surface Fixture Artifact Path Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_PATH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-path-boundary-current-behavior.test.mjs`
reserve the future route/surface fixture packet artifact location without
creating artifact files or approving implementation. The addendum pins 6
fixture artifact path rows, 1 reserved future artifact root, 5 reserved future
artifact files, 69 method semantic proof gap files covered, 5,697 method
semantic proof gap lexical callables covered, 0 files with complete
per-callable semantic proof, 0 committed route/surface fixture packet files, 0 runtime
JSON-first fixture packet approvals, and 0 implementation-ready route/surface
fixture artifact path rows.

## JSON-First Route/Surface Fixture Artifact Commit Readiness Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_COMMIT_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-commit-readiness-gate-current-behavior.test.mjs`
keep the future fixture packet contract from becoming a committed artifact
without approval. The addendum pins 10 fixture artifact commit readiness rows,
12 fixture packet contract rows covered, 69 method semantic proof gap files
covered, 5,697 method semantic proof gap lexical callables covered, 0 files
with complete per-callable semantic proof, 0 committed route/surface fixture
packet files, 0 runtime JSON-first fixture packet approvals, and 0
implementation-ready route/surface fixture artifact commit rows.

## JSON-First Route/Surface Fixture Artifact Contract Coverage Gate Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_ARTIFACT_CONTRACT_COVERAGE_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-artifact-contract-coverage-gate-current-behavior.test.mjs`
keep the aggregate fixture packet contract separate from per-file artifact
contracts. The addendum pins 10 fixture artifact contract coverage rows, 12
fixture packet contract rows covered, 5 reserved future artifact files, 5
per-file fixture artifact contract docs, 5 per-file fixture artifact contract
tests, 69 method semantic proof gap files covered, 5,697 method semantic proof
gap lexical callables covered, 0 files with complete per-callable semantic
proof, 0 committed route/surface fixture packet files, 0 runtime JSON-first
fixture packet approvals, and 0 implementation-ready route/surface fixture
artifact contract coverage rows.

## JSON-First Route/Surface Fixture Manifest Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_MANIFEST_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-manifest-contract-current-behavior.test.mjs`
turn the aggregate fixture packet manifest requirement into a per-file
`manifest.json` contract without creating the artifact. The addendum pins 12
fixture manifest contract rows, 12 fixture packet contract rows covered, 1
reserved manifest path, 0 committed route/surface fixture manifest files, 0
runtime JSON-first fixture manifest approvals, 0 runtime JSON-first fixture
packet approvals, and 0 implementation-ready JSON-first fixture manifest
contract rows.

## JSON-First Route/Surface Fixture Sample Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_SAMPLE_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-sample-contract-current-behavior.test.mjs`
move the second reserved route/surface fixture packet file into a per-file
sample contract without creating `fixture-sample.json`. The addendum pins 12
fixture sample contract rows, 1 reserved sample path, 0 committed
route/surface fixture sample files, 0 runtime JSON-first fixture sample
approvals, 0 runtime JSON-first fixture packet approvals, 0 runtime
route/surface metric artifact approvals, 0 runtime metric collector approvals,
and 0 implementation-ready JSON-first fixture sample contract rows.

## JSON-First Route/Surface Fixture Provenance Artifact Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PROVENANCE_ARTIFACT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-provenance-artifact-contract-current-behavior.test.mjs`
move the third reserved route/surface fixture packet file into a per-file
provenance artifact contract without creating `provenance.json`. The addendum
pins 12 fixture provenance artifact contract rows, 1 reserved provenance path,
0 committed route/surface fixture provenance artifact files, 0 runtime
JSON-first fixture provenance approvals, 0 runtime JSON-first fixture packet
approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric
collector approvals, and 0 implementation-ready JSON-first fixture provenance
artifact contract rows.

## JSON-First Route/Surface Fixture Parity Report Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_PARITY_REPORT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-parity-report-contract-current-behavior.test.mjs`
move the fourth reserved route/surface fixture packet file into a per-file
parity report contract without creating `parity-report.json`. The addendum
pins 12 fixture parity report contract rows, 1 reserved parity report path, 0
committed route/surface fixture parity report files, 0 runtime JSON-first
fixture parity report approvals, 0 runtime JSON-first fixture packet
approvals, 0 runtime route/surface metric artifact approvals, 0 runtime metric
collector approvals, and 0 implementation-ready JSON-first fixture parity
report contract rows.

## JSON-First Route/Surface Fixture Verification Output Contract Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-verification-output-contract-current-behavior.test.mjs`
move the fifth reserved route/surface fixture packet file into a per-file
verification output contract without creating `verification-output.tap`. The
addendum pins 12 fixture verification output contract rows, 1 reserved
verification output path, 0 committed route/surface fixture verification
output files, 0 runtime JSON-first fixture verification output approvals, 0
runtime JSON-first fixture packet approvals, 0 runtime route/surface metric
artifact approvals, 0 runtime metric collector approvals, and 0
implementation-ready JSON-first fixture verification output contract rows.

## JSON-First Route/Surface Fixture Approval Boundary Addendum

`docs/audit/FILTERTUBE_JSON_FIRST_ROUTE_SURFACE_FIXTURE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-route-surface-fixture-approval-boundary-current-behavior.test.mjs`
prove this aggregate fixture packet contract is still not runtime fixture
approval. The addendum pins 12 JSON-first route/surface fixture approval
boundary rows, 12 fixture packet contract rows covered, 0 runtime JSON-first
fixture packet approvals, 0 runtime route/surface metric artifact approvals, 0
committed route/surface fixture packet files, 0 implementation-ready
JSON-first fixture approval rows, expected runtime audit tests: 4457, expected
runtime audit pass: 4457, and expected runtime audit fail 0.
