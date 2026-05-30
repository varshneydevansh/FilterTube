# FilterTube Whitelist Pending Intake No-Work Contract - Current Behavior

Date: 2026-05-25

Status: current-behavior contract with the narrow pending-intake runtime patch
implemented. This is not a broad whitelist behavior patch, JSON-first behavior
patch, cache patch, metric patch, release package patch, or public claim.

## Purpose

This contract narrows the reported YouTube SPA slowdown to one implemented
decision point: whitelist-pending mutation intake now rejects no-work mode,
route, and candidate-cap cases before nested `VIDEO_CARD_SELECTORS` traversal.
It does not approve broader whitelist optimization or a release package.

The current source-backed finding is:

```text
queue intake now rejects mode and route exclusions before selector traversal
nested containers avoid querySelector and querySelectorAll on rejected no-op gates
candidate-cap exhaustion now rejects before nested containers
narrow runtime behavior changed: yes
whitelist pending intake implementation-ready rows: 1
```

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` | Pins the whitelist-pending queue, apply gate, fallback observer, route exclusions, candidate cap, and 9 executable current-behavior fixtures. |
| `tests/runtime/content-bridge-whitelist-pending-refresh-boundary-current-behavior.test.mjs` | Proves rejected blocklist, excluded-route, and cap outcomes avoid nested selector traversal while admitted routes preserve pending hide behavior. |
| `docs/audit/FILTERTUBE_WHITELIST_OPTIMIZATION_READINESS_GAP_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps broad whitelist optimization at NO-GO while naming pending-hide lifecycle as a readiness gap. |
| `docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md` | Keeps first optimization implementation at NO-GO until one scoped packet proves all prerequisite gates. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Keeps affected callable semantic proof at NO-GO before behavior changes. |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md` | Pins the narrow runtime source file family, allowed touch loci, forbidden source families, and patch source-locus GO boundary. |

## Current Counts

```text
whitelist pending intake no-work contract rows: 12
release whitelist-pending intake gate rows covered: 10
runtime content bridge whitelist pending refresh fixtures covered: 9
narrow implementation-ready whitelist pending intake rows: 1
runtime whitelist pending intake authority symbols: 0
narrow runtime behavior changed: yes
not completion proof for whitelist optimization readiness
```

## Contract Rows

| Contract row | Current behavior | Future patch requirement |
| --- | --- | --- |
| `FT-WLPENDING-INTAKE-00-owner` | `queueWhitelistPendingHide()` owns the implemented intake no-work decision; apply still owns final hide semantics. | Keep the no-work decision inside the narrow queue owner unless a future first-class predicate is separately approved. |
| `FT-WLPENDING-INTAKE-01-native-overlay` | Queue returns early while native overlay quiet mode is active. | Preserve this as the first cheap reject path. |
| `FT-WLPENDING-INTAKE-02-list-mode` | Blocklist mode now returns before selector traversal and timer arming. | Keep this early no-work gate covered by executable fixtures. |
| `FT-WLPENDING-INTAKE-03-empty-whitelist` | Empty whitelist remains fail-closed on admitted non-comment surfaces. | Do not skip admitted empty-whitelist mode unless a separate empty-whitelist policy changes. |
| `FT-WLPENDING-INTAKE-04-route-exclusion` | `/`, `/results`, `/feed/channels`, and `/watch` now return before selector traversal while apply exclusions remain intact. | Keep early and apply route exclusions in parity. |
| `FT-WLPENDING-INTAKE-05-remove-only` | Fallback observer already summarizes added-node presence before queue intake. | Keep remove-only mutation batches out of pending-hide work. |
| `FT-WLPENDING-INTAKE-06-resource-only` | Script/style/link/svg/path nodes are ignored inside collection after queue entry. | Reject resource-only batches before card selector traversal. |
| `FT-WLPENDING-INTAKE-07-nested-card` | Admitted nested containers can discover card candidates through `querySelector()` and `querySelectorAll()`. | Preserve nested-card discovery on admitted whitelist routes. |
| `FT-WLPENDING-INTAKE-08-candidate-cap` | A full candidate queue now returns before nested traversal and does not arm a new pending-hide timer from the already-full queue. | Keep cap rejection before nested traversal. |
| `FT-WLPENDING-INTAKE-09-timer-parity` | Admitted candidate collection coalesces behind one pending-hide timer. | Preserve timer coalescing for admitted work. |
| `FT-WLPENDING-INTAKE-10-apply-parity` | Apply still owns selected-row, processed, already pending, hidden, prefetch, placeholder, and focused recheck behavior. | Do not change apply semantics in the no-work intake patch. |
| `FT-WLPENDING-INTAKE-11-proof-boundary` | No runtime metric artifact, rollback gate, or implementation approval exists. | Verify focused current-behavior and negative no-work fixtures before any release patch. |

## Required Future Fixture Shape

The implemented narrow runtime patch is covered by executable fixtures for:

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

## Current Implementation Decision

```text
define whitelist pending intake no-work contract: GO
runtime whitelist pending intake patch now: GO
runtime whitelist optimization patch now: NO-GO
runtime JSON-first behavior patch now: NO-GO
commit metric artifact now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
whitelistPendingIntakeNoWorkContract
shouldRunWhitelistPendingIntake
whitelistPendingIntakeDecision
whitelistPendingIntakeBudgetReport
whitelistPendingIntakeRouteDecision
whitelistPendingIntakeMutationDecision
whitelistPendingIntakeMetricArtifact
whitelistPendingIntakeRollbackGate
```

## Implementation Readiness Gate Addendum

`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md`
keeps this contract scoped while separating narrow runtime approval from broad
release approval. The readiness gate pins 14 whitelist pending intake implementation
readiness rows, 10 required future no-work fixture names, 9 current content
bridge pending refresh fixtures, 0 implemented runtime authority symbols, 0
runtime authority symbols, 1 implementation-ready whitelist pending intake row,
`prepare narrow whitelist pending-intake implementation patch: GO`, and `runtime whitelist pending
intake patch in this audit slice: GO`.

## Patch Source Locus Boundary Addendum

`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md`
keeps the reported SPA slowdown scoped to a single narrow runtime file family.
The boundary pins 12 whitelist pending intake patch source-locus rows, 1
allowed runtime source file family, `js/content_bridge.js` as the only allowed
runtime file, 4 read-only parity runtime source loci, 8 forbidden runtime
source families, 10 required future no-work fixture names, 9 current content
bridge pending refresh fixtures, 1 implementation-ready whitelist pending
intake row, 1 narrow semantic-change approval row, `patch source locus
approval: GO`, `prepare narrow whitelist pending-intake implementation patch:
GO`, and `runtime whitelist pending intake patch in this audit slice: GO`.

## Verification

Current proof command:

```bash
node --test tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs --test-reporter=spec
```

This contract is not a completion claim. It keeps the broad audit active and
keeps broad whitelist/cache/JSON-first changes blocked while recording that the
narrow pending-intake no-work patch is implemented with focused positive,
negative, cap, route, and parity fixtures.
