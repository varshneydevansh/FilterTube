# FilterTube Whitelist Pending Intake Implementation Readiness Gate - Current Behavior

Date: 2026-05-25

Status: implementation-readiness gate with the narrow pending-intake runtime
patch implemented. This is not a broad whitelist behavior patch, selector
scope expansion, cache patch, JSON-first behavior patch, metric patch, release
package patch, or public claim.

## Purpose

This gate answers a narrow release question raised by the reported YouTube SPA
slowdown: whether the whitelist pending-hide mutation intake can be optimized
before the broader audit is complete.

Current answer:

```text
narrow implementation packet is defined enough to prepare: GO
narrow runtime whitelist pending intake patch in this audit slice: GO
broad whitelist optimization patch now: NO-GO
narrow runtime behavior changed: yes
```

The only runtime patch this gate supports is the small intake no-work decision
before nested `VIDEO_CARD_SELECTORS` traversal. It does not approve changes to
`applyWhitelistPendingHide()` semantics, whitelist matching, JSON filtering,
identity resolution, cache shape, selected-row policy, or public release claims.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md` | Defines the 12-row no-work contract and required fixture shape for the narrow predicate. |
| `tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs` | Proves the contract is audit-only, source-backed, and does not add runtime authority symbols. |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md` | Pins the single allowed runtime file family, allowed/forbidden source loci, and patch source-locus NO-GO boundary. |
| `docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` | Pins the current queue, apply gate, route exclusions, fallback observer, and 9 current-behavior fixtures. |
| `tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs` | Proves current nested selector traversal before blocklist, excluded-route, and candidate-cap no-op outcomes. |
| `docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps broad whitelist optimization blocked while allowing the pending-intake slowdown to be scoped separately. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps implementation readiness blocked unless one scoped packet proves authority, fixtures, side effects, rollout, and rollback. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Keeps affected callable semantic proof as a blocker for broad behavior changes. |

## Current Counts

```text
whitelist pending intake implementation readiness rows: 14
source inputs covered: 8
required future no-work fixture names covered: 10
runtime content bridge whitelist pending refresh fixtures covered: 9
required runtime authority symbols: 8
implemented runtime authority symbols: 0
narrow implementation-ready whitelist pending intake rows: 1
narrow runtime behavior changed: yes
release patch approval: NO-GO
```

## Readiness Rows

| Readiness row | Current evidence | Required future patch proof |
| --- | --- | --- |
| `FT-WLPENDING-READY-00-scope` | The slowdown is isolated to pending-hide intake before selector traversal. | Limit the patch to pending-intake admission and candidate collection. |
| `FT-WLPENDING-READY-01-owner` | `queueWhitelistPendingHide()` now owns intake admission before collection. | Keep the decision local unless a future first-class predicate is separately approved. |
| `FT-WLPENDING-READY-02-native-overlay` | Existing queue code returns during native overlay quiet mode before traversal. | Preserve native overlay quiet mode as an earliest reject path. |
| `FT-WLPENDING-READY-03-list-mode` | Blocklist mode now rejects before selector traversal and timer arming. | Keep non-whitelist mode rejected before selector traversal. |
| `FT-WLPENDING-READY-04-route` | `/`, `/results`, `/feed/channels`, and `/watch` now reject before selector traversal while apply exclusions remain intact. | Keep current apply-excluded routes rejected before selector traversal. |
| `FT-WLPENDING-READY-05-remove-only` | Fallback observer computes `fallbackMutationSummary(mutations)` before queue intake. | Keep remove-only mutation batches out of queue and selector work. |
| `FT-WLPENDING-READY-06-resource-only` | Resource nodes are ignored only after queue entry. | Reject resource-only added-node batches before card selector traversal. |
| `FT-WLPENDING-READY-07-cap` | A full candidate queue now returns before inspecting nested containers. | Keep nested traversal skipped when `pendingHideCandidates` is already at `WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT`. |
| `FT-WLPENDING-READY-08-empty-whitelist` | Empty whitelist remains fail-closed on admitted non-comment surfaces. | Preserve admitted empty-whitelist pending-hide behavior unless a separate policy changes it. |
| `FT-WLPENDING-READY-09-nested-discovery` | Nested containers on admitted surfaces discover cards through `querySelector()` and `querySelectorAll()`. | Preserve nested discovery for admitted whitelist routes and mutations. |
| `FT-WLPENDING-READY-10-timer-parity` | Current admitted work coalesces behind one pending-hide timer. | Preserve one-timer coalescing and do not increase timer churn. |
| `FT-WLPENDING-READY-11-apply-parity` | Apply owns selected-row, processed, pending, hidden, prefetch, placeholder, and focused recheck behavior. | Do not change apply semantics in the intake patch. |
| `FT-WLPENDING-READY-12-fixtures` | Future fixture names are defined but not implemented as post-patch passing fixtures. | Add positive and negative fixtures proving no selector traversal on rejected work and parity on admitted work. |
| `FT-WLPENDING-READY-13-release` | No metric artifact, rollback gate, or release approval exists. | Run focused fixtures, full runtime audit, and rollback/public-claim checks before release. |

## Required Future Patch Fixture Packet

The narrow runtime patch has executable tests that prove:

```text
blocklistModeRejectsBeforeSelectorTraversal
homeRouteRejectsBeforeSelectorTraversal
searchRouteRejectsBeforeSelectorTraversal
feedChannelsRouteRejectsBeforeSelectorTraversal
watchRouteRejectsBeforeSelectorTraversal
removeOnlyMutationsRejectBeforeQueue
resourceOnlyAddedNodesRejectBeforeSelectorTraversal
fullCandidateQueueRejectsBeforeNestedTraversal
emptyWhitelistAdmittedRoutePreservesPendingHide
whitelistRulesAdmittedRoutePreservesNestedDiscovery
```

## Required Runtime Authority Boundary

The future patch should add at most a narrow intake owner such as:

```text
shouldRunWhitelistPendingIntake
whitelistPendingIntakeDecision
whitelistPendingIntakeRouteDecision
whitelistPendingIntakeMutationDecision
```

It must not claim broad ownership through:

```text
whitelistOptimizationAuthority
jsonFirstWhitelistAuthority
whitelistPendingMetricArtifact
releaseWhitelistApproval
```

## Current Decision

```text
prepare narrow whitelist pending-intake implementation patch: GO
narrow runtime whitelist pending intake patch in this audit slice: GO
runtime whitelist optimization patch now: NO-GO
runtime JSON-first behavior patch now: NO-GO
cache behavior patch now: NO-GO
patch source locus approval: GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

## Verification

Current proof command:

```bash
node --test tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs --test-reporter=spec
```

This gate is not a completion claim. It says the reported SPA slowdown now has
a narrow implemented source-locus fix with focused fixtures, while broader
whitelist/cache/JSON-first/release changes remain blocked.
