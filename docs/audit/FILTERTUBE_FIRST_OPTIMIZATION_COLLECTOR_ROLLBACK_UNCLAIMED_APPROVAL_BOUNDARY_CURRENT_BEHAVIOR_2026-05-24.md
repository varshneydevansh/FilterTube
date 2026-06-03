# FilterTube First Optimization Collector Rollback Unclaimed Approval Boundary - Current Behavior - 2026-05-24

Status: audit-only current-behavior first optimization collector rollback and
unclaimed-surface approval boundary. Runtime behavior is unchanged. This is
not an implementation patch, optimization patch, metric collector patch,
JSON-first behavior patch, whitelist patch, persisted TAP output, rollback
implementation, native sync patch, release package patch, public claim patch,
or committed metric artifact.

## Purpose

The rollback/unclaimed-surface boundary names the future rollback and unclaimed
surface requirements. The collector verification output approval boundary keeps
TAP output and runtime audit counts separate from implementation permission.
This boundary records the next missing approval layer: rollback docs,
unclaimed-surface rows, verification output approval absence, and audit counts
are still not runtime rollback approval or runtime unclaimed-surface approval.
Lexical callable counts and audit counts are also not rollback/unclaimed
approval.

The current boundary is:

```text
Selected first optimization binding: FT-BIND-00-metric-artifact-foundation
Collector rollback/unclaimed approval boundary rows: 12
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5720
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5720
Runtime rollback approvals: 0
Runtime unclaimed-surface approvals: 0
Runtime collector rollback/unclaimed approvals: 0
Committed rollback/unclaimed artifacts: 0
Implementation-ready collector rollback/unclaimed approval rows: 0
```

None of those facts is runtime rollback or unclaimed-surface approval. A future
approval must bind one owner-approved rollback/unclaimed packet to measured
surfaces, explicitly unclaimed surfaces, rollback command or manual owner,
artifact removal, collector disablement, native sync rollback, release package
rollback, public claim retraction, raw-capture exclusion, diagnostic/performance
claim scope, authority-token absence, verification output, and ledger counts.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_ROLLBACK_UNCLAIMED_SURFACE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Defines rollback and unclaimed-surface rows while proving 0 runtime rollback approvals and 0 runtime unclaimed-surface approvals. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_VERIFICATION_OUTPUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves verification output approval remains absent before rollback or unclaimed-surface approval can rely on TAP output. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_VERIFICATION_OUTPUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md` | Defines future verification output rollback fields while proving 0 committed verification output files. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_PARITY_ROLLOUT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves parity rollout approval remains absent before rollback/unclaimed approval can rely on measured parity scope. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_SOURCE_LOCUS_PARITY_RELEASE_VERIFICATION_OWNERSHIP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Classifies parity, release, and verification ownership while proving runtime approvals remain absent. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_DIAGNOSTIC_PRIVACY_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves diagnostic privacy approval remains absent before rollback/unclaimed approval can use performance or diagnostic evidence. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_FIXTURE_PROVENANCE_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves fixture provenance approval remains absent before rollback/unclaimed approval can rely on fixture packets. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_SIDE_EFFECT_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves side-effect approval remains absent before rollback/unclaimed approval can claim side-effect safety. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_NO_WORK_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves no-work approval remains absent before rollback/unclaimed approval can claim disabled, empty-list, pass-through, or no-rule preservation. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_INSERTION_APPROVAL_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves insertion approval remains absent before rollback/unclaimed approval can become collector approval evidence. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_COLLECTOR_APPROVAL_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md` | Proves collector approval authority remains absent across insertion, no-work, side-effect, fixture, diagnostic, parity, verification, rollback, and release gates. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 files and 5,697 lexical callables are still only lexically indexed, with 0 files carrying complete per-callable semantic proof. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps the first optimization implementation gate at NO-GO. |
| `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md` | Records audit harness counts as current-behavior proof, not rollback or unclaimed-surface approval. |

## Current Counts

```text
collector rollback/unclaimed approval boundary rows: 12
rollback/unclaimed rows covered: 12
collector verification output approval rows covered: 12
verification output contract rows covered: 12
collector parity rollout approval rows covered: 12
source-locus parity release verification rows covered: 12
collector diagnostic privacy approval rows covered: 12
collector fixture provenance approval rows covered: 12
collector side-effect approval rows covered: 12
collector no-work approval rows covered: 12
collector insertion approval rows covered: 12
collector approval authority rows covered: 12
current parity release verification anchors covered: 68
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
runtime source-owner approvals: 0
runtime metric collector approvals: 0
runtime collector insertion points approved: 0
runtime collector no-work proofs approved: 0
runtime collector side-effect budgets approved: 0
runtime collector fixture packets approved: 0
runtime collector diagnostic privacy approvals: 0
runtime collector parity rollout approvals: 0
runtime collector verification output approvals: 0
runtime collector rollback/unclaimed approvals: 0
runtime rollback approvals: 0
runtime unclaimed-surface approvals: 0
committed parity rollout files: 0
committed verification output files: 0
committed rollback/unclaimed artifacts: 0
implementation-ready collector rollback/unclaimed approval rows: 0
expected runtime audit tests: 4457
expected runtime audit pass: 4457
expected runtime audit fail: 0
runtime behavior changed: no
not completion proof for collector rollback/unclaimed approval authority
```

## Collector Rollback Unclaimed Approval Matrix

| Collector rollback/unclaimed approval row id | Required approval field | Existing evidence that is not approval | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-00-binding-scope` | Owner-approved rollback/unclaimed packet id; source-owner approval; selected binding, candidate, obligation ids, and affected callable semantic proof. | The metric-foundation binding is selected and rollback rows are documented. | Missing owner-approved rollback packet id, source-owner signatures, exact candidate/obligation binding, `affectedCallableIds`, `methodSemanticProofStatus`, `methodSemanticProofArtifact`, and approval timestamp. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-01-source-collector-preconditions` | Collector insertion, no-work, side-effect, fixture, diagnostic, parity, verification output, and callable semantic proof approvals. | Adjacent approval boundaries exist and all remain NO-GO. | Missing approved collector chain, approved verification output, approved parity rollout packet, callable semantic proof, and source owner. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-02-measured-surface-scope` | Measured JSON, DOM, native, release, diagnostic, and public surfaces. | Boundary docs name surface classes. | Missing packet-owned measured-surface list, fixture paths, native sync status, release package status, and public claim status. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-03-unclaimed-json-dom-scope` | Unclaimed JSON and DOM surfaces; sibling preservation proof; selected/current row exclusions. | Rollback rows name unclaimed JSON/DOM scope. | Missing explicit unclaimed JSON/DOM list, selected/current-row proof, sibling preservation proof, and no-claim wording. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-04-native-webview-sync-scope` | Native WebView, generated runtime, app revision, and native rollback command. | Native sync boundaries are audit-only evidence. | Missing app/source revision pair, native rollback owner, generated runtime hashes, and unclaimed native scope. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-05-release-package-scope` | Release package manifest; package hash; release rollback command; unclaimed release artifacts. | Release package docs show package proof is absent. | Missing release package manifest, package hash, upload proof, release rollback command, and unclaimed release artifact list. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-06-public-claim-retraction` | Public claim ids; platform; required artifact; checksum; public claim retraction command. | Public claim boundaries define claim proof but do not approve claim changes. | Missing public claim manifest, artifact checksum, signing proof, claim retraction owner, and no-claim wording for unmeasured surfaces. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-07-raw-capture-exclusion` | Raw capture exclusion manifest; extracted fixture paths; package/native/website/public exclusion checks. | Raw captures remain evidence-only. | Missing exclusion manifest, tracked fixture conversion, package exclusion proof, native sync exclusion proof, website reference check, and public-claim exclusion. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-08-diagnostic-performance-claim` | Diagnostic privacy id; metric artifact path; browser/device scope; performance claim scope. | Diagnostic privacy approval remains absent. | Missing diagnostic privacy packet, performance claim scope, console privacy class, and log-only claim rejection proof. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-09-rollback-command-owner` | Rollback command; manual rollback owner; artifact removal command; collector disable command. | Rollback command fields are defined in the boundary. | Missing executable rollback command, manual owner, artifact removal command, collector disable proof, and storage/native/release rollback proof. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-10-authority-artifact-absence` | Authority token absence check; artifact absence check; committed artifact count. | Current tests search future tokens and artifact files for earlier gates. | Missing packet-owned authority absence command, artifact absence command, runtime/doc match split, and approval status. |
| `FT-COLLECTOR-ROLLBACK-APPROVAL-11-ledger-runtime-results` | Persisted rollback/unclaimed approval packet; ledger links; full runtime result count; broad audit continuation statement. | Runtime results and ledgers track current-behavior proof counts. | Missing committed rollback/unclaimed approval artifact or packet section, ledger update with approval status, and full runtime audit count proving the packet. |

## Current Collector Rollback Unclaimed Approval Decision

```text
collector rollback/unclaimed approval boundary documented: GO
runtime source-owner approval now: NO-GO
runtime collector insertion approval now: NO-GO
runtime collector no-work approval now: NO-GO
runtime collector side-effect approval now: NO-GO
runtime collector fixture provenance approval now: NO-GO
runtime collector diagnostic privacy approval now: NO-GO
runtime collector parity rollout approval now: NO-GO
runtime collector verification output approval now: NO-GO
runtime collector rollback/unclaimed approval now: NO-GO
runtime rollback approval now: NO-GO
runtime unclaimed-surface approval now: NO-GO
use rollback/unclaimed boundary as approval now: NO-GO
use verification output approval chain as rollback approval now: NO-GO
commit rollback/unclaimed artifact now: NO-GO
commit verification-output.tap now: NO-GO
commit metric foundation artifact files now: NO-GO
affected callable semantic proof: NO-GO
JSON-first runtime behavior patch: NO-GO
whitelist optimization patch: NO-GO
native sync patch: NO-GO
release package patch: NO-GO
public claim patch: NO-GO
continue proof-backed audit: GO
```

This approval boundary keeps rollback and unclaimed-surface wording separate
from runtime permission. It does not implement rollback, approve public claim
retraction, approve native sync rollback, approve release package rollback, or
approve a JSON-first or whitelist runtime patch.

## Missing Runtime Authority Symbols

No product runtime, build, script, or website source currently defines:

```text
firstOptimizationCollectorRollbackUnclaimedApprovalBoundary
firstOptimizationCollectorRollbackUnclaimedApprovalReport
collectorRollbackUnclaimedApprovalPacket
collectorRollbackUnclaimedApprovalStatus
collectorRollbackCommandApproval
collectorUnclaimedSurfaceApproval
collectorNativeUnclaimedSurfaceApproval
collectorReleaseUnclaimedSurfaceApproval
collectorPublicClaimRetractionApproval
collectorArtifactRemovalApproval
collectorDisableRollbackApproval
collectorRollbackVerificationOutputApproval
collectorRollbackUnclaimedRuntimeAuthority
metricFoundationCollectorRollbackUnclaimedApproval
jsonFirstCollectorRollbackUnclaimedApprovalGate
whitelistCollectorRollbackUnclaimedApprovalGate
runtimeCollectorRollbackApproval
runtimeCollectorUnclaimedSurfaceApproval
collectorRollbackUnclaimedApprovalNoGoBoundary
```

## Verification

Current proof command:

```bash
node --test tests/runtime/first-optimization-collector-rollback-unclaimed-approval-boundary-current-behavior.test.mjs --test-reporter=spec
```

This boundary is not a completion claim. It proves current rollback and
unclaimed-surface approval remains absent while rollback/unclaimed rows,
verification output approval absence, parity rollout approval absence,
diagnostic privacy approval absence, fixture approval absence, no-work approval
absence, side-effect approval absence, implementation readiness, runtime audit
results, and ledgers remain audit-only evidence.
Method semantic proof gap counts also remain audit-only evidence.
