# FilterTube Whitelist Optimization Readiness Gap Matrix - Current Behavior - 2026-05-24

Status: audit-only current-behavior readiness gap matrix. Runtime behavior is
unchanged. This is not an implementation patch, optimization patch, whitelist
behavior patch, JSON-first behavior patch, settings patch, lifecycle patch,
metric patch, or release patch.

## Purpose

The stop/go record says stop-now whitelist optimization is NO-GO. This matrix
turns that decision into exact whitelist readiness gaps so future work can see
which proof must exist before changing recent whitelist behavior.

The current boundary is:

```text
Whitelist optimization has source-backed candidate locations.
No whitelist optimization row is implementation-ready.
The first whitelist runtime patch must prove list-mode, identity, route/surface,
pending-hide, JSON/DOM parity, mutation, lifecycle, and metric authority first.
Method semantic proof gap files covered: 69
Method semantic proof gap lexical callables covered: 5797
Files with complete per-callable semantic proof: 0
Lexical callables requiring semantic proof before behavior changes: 5797
```

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `docs/audit/FILTERTUBE_OPTIMIZATION_STOP_GO_DECISION_RECORD_CURRENT_BEHAVIOR_2026-05-24.md` | Stop-now whitelist optimization is NO-GO; continued audit is GO. |
| `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Disabled, empty blocklist, empty whitelist, conflicts, unknown mode, and comments have split current behavior. |
| `docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Whitelist decisions depend on empty rules, channel allow, keyword allow, creator-page fallback, unresolved identity, no-match, and comment bypass. |
| `docs/audit/FILTERTUBE_CONTENT_BRIDGE_WHITELIST_PENDING_REFRESH_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` | Whitelist pending refresh creates bounded temporary hide state and focused DOM fallback reruns. |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md` | Defines the audit-only no-work contract for a narrow future pending-intake predicate while keeping runtime patch approval at NO-GO. |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md` | Defines the audit-only preparation gate for the narrow pending-intake patch while keeping runtime behavior unchanged. |
| `docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md` | Pins the narrow pending-intake source locus to one runtime file family while keeping patch source-locus approval at NO-GO. |
| `docs/audit/FILTERTUBE_RIGHT_RAIL_WHITELIST_OBSERVER_CURRENT_BEHAVIOR_2026-05-19.md` | A watch/right-rail observer exists, but its scheduler returns on watch routes. |
| `docs/audit/FILTERTUBE_YTM_WATCH_PLAYER_WHITELIST_SELECTED_ROW_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` | YTM DOM selected-row behavior and JSON playlist-panel filtering are not equivalent. |
| `docs/audit/FILTERTUBE_BATCH_WHITELIST_IMPORT_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Batch whitelist import persists rows without switching blocklist mode to whitelist mode. |
| `docs/audit/FILTERTUBE_LIST_MODE_TRANSITION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Mode transition, copy flag, destructive list movement, cache invalidation, backup, and refresh are separate authority paths. |
| `docs/audit/FILTERTUBE_SETTINGS_MODE_COVERAGE_MATRIX_2026-05-18.md` | Empty whitelist, Kids/Main/YTM surface modes, sync, lock, quick/menu, and route modes remain partial or current gaps. |
| `docs/audit/FILTERTUBE_P0_OPTIMIZATION_ROUTE_SURFACE_METRIC_FIXTURE_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md` | 12 route/surface metric fixture obligations remain required before optimization. |
| `docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md` | Proves 69 tracked JS/JSX/MJS files still have 5701 lexical callables requiring per-callable semantic proof before behavior changes. |

## Current Counts

```text
whitelist readiness gap rows: 10
implementation-ready whitelist optimization rows: 0
readiness rows requiring metric artifacts: 10
readiness rows requiring false-hide or leak proof: 10
readiness rows requiring route/surface proof: 10
required first whitelist patch evidence classes: 12
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
not completion proof for whitelist optimization readiness
```

## Readiness Gap Matrix

| Readiness id | Current gap | Why it blocks whitelist optimization | Missing proof before implementation |
| --- | --- | --- | --- |
| `FT-WLREADY-00-empty-whitelist-policy` | Empty whitelist fail-closes non-comment JSON renderers while comments bypass the non-comment branch. | Optimizing empty whitelist can either encode an accidental false-hide policy or leak comment surfaces that use a different branch. | Product-confirmed empty-whitelist policy with UI copy, JSON fixtures, DOM fixtures, comments policy, sibling-visible proof, and restore proof. |
| `FT-WLREADY-01-unresolved-identity-policy` | Whitelist mode blocks unresolved non-Shorts identity when channel rules exist, while sparse surfaces can rely on pending identity, learned maps, DOM fallback, or network enrichment. | A fast path can convert temporary identity uncertainty into permanent false hides or leaks. | Pending identity decision report with identity tier, TTL, fallback fetch budget, restore proof, and stale-marker cleanup. |
| `FT-WLREADY-02-list-mode-conflict-policy` | Blocklist mode ignores whitelist rows; whitelist mode ignores matching block rows for non-comment allow cases; unknown modes fall back to blocklist. | Recent whitelist changes cannot be optimized safely until dormant rows, conflicts, unknown mode, and future simultaneous allow/block behavior have a single policy. | List-mode decision report for empty, active, conflict, unknown, comments, and simultaneous allow/block migration states. |
| `FT-WLREADY-03-transition-mutation-policy` | Mode transitions, copy flags, whitelist-to-blocklist transfer, legacy mirrors, cache invalidation, backups, and tab refreshes are split operations. | Runtime optimization can rely on a list state that UI intent did not actually persist or can miss destructive migration side effects. | Mutation report with target profile, lock/session gate, copy flag effect, storage keys, cache invalidation, backup, refresh, rollback, and metric artifact. |
| `FT-WLREADY-04-import-dormant-mode-policy` | Batch whitelist import can persist whitelist rows while current mode remains blocklist. | Imported allow rows may be dormant, so optimizing whitelist matching based on persisted rows alone can change inactive behavior. | Mode-effect report proving imported whitelist rows, current mode, active compiled settings, V3/V4 mirrors, channel-map writes, and refresh behavior. |
| `FT-WLREADY-05-pending-hide-lifecycle-policy` | Content bridge hides some newly-added whitelist candidates temporarily, queues up to 160 pending candidates, and rechecks through focused DOM fallback. | Removing or moving this path can leak newly-added cards; keeping it unbudgeted can preserve false hides and observer/timer cost. | Pending-hide queue budget with route exclusions, candidate cap, placeholder policy, rerun latency, cleanup proof, and mutation metrics. |
| `FT-WLREADY-06-watch-right-rail-policy` | The right-rail whitelist observer attaches to watch-shaped selectors but returns immediately on `/watch`. | Watch rail behavior depends on broader JSON `/next`, DOM fallback, playlist/current-video guards, and identity prefetch work, not one observer authority. | Watch/right-rail decision report with JSON-vs-DOM owner, player/fullscreen state, forced reprocess budget, and scaffold-visible proof. |
| `FT-WLREADY-07-json-dom-selected-row-parity` | YTM DOM selected playlist rows can be preserved in whitelist mode while JSON playlist-panel rows have no selected/current-row state. | JSON-first playlist optimization can false-hide the currently playing row or leak a DOM-selected row if it treats JSON and DOM rows as equivalent. | Selected/current row parity report with playback side-effect proof, YTM/Main route fixtures, JSON/DOM sibling proof, and no playback disruption. |
| `FT-WLREADY-08-surface-parity-policy` | Main, Kids, YTM, Shorts, playlists, comments, posts, native overlays, and import/sync paths have different whitelist evidence and lifecycle owners. | A Main-only whitelist fast path can regress Kids/YTM/native parity or route-specific DOM fallback behavior. | Surface matrix covering Main/Kids/YTM, watch/search/home/Shorts/playlist/comments/posts, native overlay quiet mode, menu/quick affordances, and release parity. |
| `FT-WLREADY-09-metric-and-entry-gate` | The stop/go record, P0 gate, and route/surface metric matrix all say whitelist optimization has zero implementation-ready rows. | Without one measured candidate and obligation id, a runtime patch can reduce one local cost while increasing false-hide, leak, storage, network, restore, or lifecycle cost. | First whitelist patch evidence packet with candidate id, obligation id, source locus, route, surface, endpoint, list mode, positive/negative fixtures, side-effect budgets, and metric artifact. |

## Required First Whitelist Patch Evidence

The first future whitelist optimization patch should include at least:

```text
candidateId
obligationId
readinessId
sourceLocus
route
surface
endpoint
profileType
listMode
ruleState
positiveFixture
negativeSiblingFixture
metricArtifact
affectedCallableIds
methodSemanticProofStatus
methodSemanticProofArtifact
```

It should also prove:

```text
emptyWhitelistPolicy
unresolvedIdentityPolicy
commentWhitelistPolicy
pendingHidePolicy
selectedRowPolicy
transitionMutationPolicy
importModeEffectPolicy
surfaceParityPolicy
workAllowed
workForbidden
hideRestoreBudget
diagnosticBudget
```

## Current Implementation Boundary

This matrix does not say "never optimize whitelist." It says the audit has not
yet produced the evidence packet that would make a whitelist optimization safe.
Until one readiness row is paired with one metric obligation and one
work-decision report, recent whitelist behavior should remain in audit mode
rather than implementation mode.

## Method Semantic Proof Gap Boundary

The method semantic proof gap is a separate behavior-change blocker. Current
audit evidence shows 0 files with complete per-callable semantic proof across
5464 lexical callables, so whitelist optimization remains NO-GO even if a
future metric packet exists. These counts are audit-only blockers and do not
approve runtime optimization, JSON-first behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.

## First Optimization Patch Evidence Packet Contract Addendum

First optimization patch evidence packet contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PATCH_EVIDENCE_PACKET_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-patch-evidence-packet-contract-current-behavior.test.mjs`
generalize this whitelist-specific evidence requirement into the first runtime
optimization entry contract. Whitelist optimization remains blocked until a
future patch provides the packet with candidate id, obligation id, readiness id,
metric artifact, fixtures, side-effect budgets, parity proof, and rollout
boundaries.

## First Optimization Implementation Readiness Gate Addendum

First optimization implementation readiness gate addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-implementation-readiness-gate-current-behavior.test.mjs`
fold this whitelist readiness gap matrix into the first-optimization
implementation decision. The addendum pins 14 implementation readiness rows, 0
runtime first optimization approvals, and 0 implementation-ready first
optimization rows. It keeps this prerequisite audit-only until one scoped
future patch proves the full chain of candidate, obligation, authority,
evidence packet, binding, artifact, source owner, collector insertion, no-work,
side-effect, fixture provenance, parity, rollout, and rollback proof.

## Whitelist Pending Intake No-Work Contract Addendum

Whitelist pending intake no-work contract addendum:
`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_NO_WORK_CONTRACT_CURRENT_BEHAVIOR_2026-05-25.md`
and
`tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs`
split the reported SPA slowdown from broad whitelist optimization. The contract
defines 12 rows for the implemented narrow pending-intake no-work checks and
keeps `runtime whitelist pending intake patch now: GO`, `runtime whitelist
optimization patch now: NO-GO`, and `continue proof-backed audit: GO`.

## Whitelist Pending Intake Implementation Readiness Gate Addendum

Whitelist pending intake implementation readiness gate addendum:
`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_IMPLEMENTATION_READINESS_GATE_CURRENT_BEHAVIOR_2026-05-25.md`
splits patch preparation from implementation approval. It pins 14 readiness
rows, 10 required future no-work fixture names, 1 narrow
implementation-ready whitelist pending intake row, `prepare narrow whitelist
pending-intake implementation patch: GO`, and `narrow runtime whitelist
pending intake patch in this audit slice: GO`.

## Whitelist Pending Intake Patch Source Locus Boundary Addendum

Whitelist pending intake patch source locus boundary addendum:
`docs/audit/FILTERTUBE_WHITELIST_PENDING_INTAKE_PATCH_SOURCE_LOCUS_BOUNDARY_CURRENT_BEHAVIOR_2026-05-25.md`
turns the reported SPA slowdown into a single-file source boundary. It pins 12
patch source-locus rows, 1 allowed runtime source file family,
`js/content_bridge.js` as the only allowed runtime file, 4 read-only parity
runtime source loci, 8 forbidden runtime source families, 1 narrow
implementation-ready whitelist pending intake row, `patch source locus
approval: GO`, `prepare narrow whitelist pending-intake implementation patch:
GO`, and `narrow runtime whitelist pending intake patch in this audit slice:
GO`.

## JSON-First Implementation Authority Boundary Addendum

JSON-first implementation authority boundary addendum:
`docs/audit/FILTERTUBE_JSON_FIRST_IMPLEMENTATION_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/json-first-implementation-authority-boundary-current-behavior.test.mjs`
keep whitelist optimization within the broader JSON-first NO-GO boundary. The
addendum pins 13 JSON-first implementation authority rows, 10 whitelist
readiness gaps covered, 0 runtime JSON-first implementation approvals, 0
runtime whitelist optimization approvals, 0 committed JSON-first metric
artifacts, 0 implementation-ready JSON-first rows, expected runtime audit tests: 4457, expected runtime audit pass: 4457, and expected runtime audit fail 0.

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
whitelistOptimizationReadinessGapMatrix
whitelistOptimizationReadinessReport
whitelistFirstPatchEvidencePacket
whitelistEmptyPolicyReport
whitelistUnresolvedIdentityPolicyReport
whitelistPendingHideLifecycleBudget
whitelistSelectedRowParityReport
whitelistTransitionMutationReport
whitelistImportModeEffectReport
whitelistSurfaceParityReport
```

## Verification

Current proof command:

```bash
node --test tests/runtime/whitelist-optimization-readiness-gap-matrix-current-behavior.test.mjs --test-reporter=spec
```

This matrix is not a completion claim. It keeps whitelist optimization blocked
until empty-list, identity, comment, pending-hide, selected-row, transition,
import, surface parity, side-effect, and metric evidence exists.
