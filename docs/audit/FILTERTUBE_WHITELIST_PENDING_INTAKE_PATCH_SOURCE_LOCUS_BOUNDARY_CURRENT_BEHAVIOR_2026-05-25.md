# FilterTube Whitelist Pending Intake Patch Source Locus Boundary - Current Behavior

Date: 2026-05-25

Status: source-locus boundary with the narrow runtime patch implemented. This
is not a selector scope expansion, cache patch, JSON-first behavior patch, DOM
fallback patch, broad whitelist policy patch, release package patch, or public
claim.

## Purpose

This boundary answers the release-facing slowdown report at the smallest source
locus that can plausibly remove work: whitelist pending-hide intake before
nested `VIDEO_CARD_SELECTORS` traversal in `js/content_bridge.js`.

Current answer:

```text
narrow whitelist pending-intake source locus identified: GO
runtime source file families allowed for narrow patch: 1
narrow runtime whitelist pending intake patch in this audit slice: GO
cache behavior patch now: NO-GO
narrow runtime behavior changed: yes
```

The implemented patch shape this document supports is one cheap no-work
decision before card selector traversal. It must not change cache shape, JSON filtering,
DOM fallback apply semantics, whitelist allow/block policy, identity
resolution, selected-row policy, native sync, release packaging, or public
claims.

## Source Inputs

| Input | Current proof used |
| --- | --- |
| `js/content_bridge.js:6216` | Current `WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT` is 160. |
| `js/content_bridge.js:6233` | Current `queueWhitelistPendingHide(mutations, delayMs = 40)` owns pending-hide intake and candidate collection. |
| `js/content_bridge.js:6235` | Current queue path rejects native overlay quiet mode before traversal. |
| `js/content_bridge.js:6237` | Current queue path rejects non-whitelist mode before selector traversal. |
| `js/content_bridge.js:6239` | Current queue path reads `/`, `/results`, `/feed/channels`, and `/watch` before selector traversal. |
| `js/content_bridge.js:6242` | Current queue path rejects a full pending-hide candidate queue before nested traversal. |
| `js/content_bridge.js:6254` | Current nested discovery starts with `node.matches?.(VIDEO_CARD_SELECTORS)`. |
| `js/content_bridge.js:6255` | Current nested discovery checks `node.querySelector?.(VIDEO_CARD_SELECTORS)`. |
| `js/content_bridge.js:6256` | Current nested discovery calls `node.querySelectorAll?.(VIDEO_CARD_SELECTORS)`. |
| `js/content_bridge.js:6280` | Current `applyWhitelistPendingHide(candidates)` owns apply-time semantics. |
| `js/content_bridge.js:6284` | Current apply-time list-mode no-op gate remains as parity protection. |
| `js/content_bridge.js:6287` | Current apply-time route no-op gate remains as parity protection. |
| `js/content_bridge.js:6455` | Current `fallbackMutationSummary(mutations)` already summarizes added-node presence before queue intake. |
| `js/content_bridge.js:6490` | Current fallback observer calls `queueWhitelistPendingHide(mutations)` for any added-node batch. |

## Current Counts

```text
whitelist pending intake patch source-locus rows: 12
runtime source file families allowed for narrow patch: 1
allowed runtime file: js/content_bridge.js
read-only parity runtime source loci: 4
forbidden runtime source families: 8
required future no-work fixture names covered: 10
runtime content bridge whitelist pending refresh fixtures covered: 9
narrow implementation-ready whitelist pending intake rows: 1
narrow semantic-change approval rows: 1
narrow runtime behavior changed: yes
patch source locus approval: GO
```

## Source Locus Rows

| Locus row | Current source fact | Future patch boundary |
| --- | --- | --- |
| `FT-WLPENDING-LOCUS-00-file-owner` | All current pending-hide intake work is in `js/content_bridge.js`. | Keep the narrow runtime patch inside `js/content_bridge.js`. |
| `FT-WLPENDING-LOCUS-01-queue-owner` | `queueWhitelistPendingHide(mutations, delayMs = 40)` owns pending-hide mutation intake, no-work gating, and collection. | Keep the cheap intake decision inside this owner unless separately approved. |
| `FT-WLPENDING-LOCUS-02-native-overlay` | Native overlay quiet mode already returns before selector traversal. | Preserve native overlay quiet mode as the earliest reject path. |
| `FT-WLPENDING-LOCUS-03-list-mode` | Blocklist mode is now rejected before queue traversal while apply parity remains intact. | Keep non-whitelist mode rejected before nested selector traversal and timer arming. |
| `FT-WLPENDING-LOCUS-04-route` | `/`, `/results`, `/feed/channels`, and `/watch` are now rejected before queue traversal while apply route exclusions remain intact. | Keep the same routes rejected before nested selector traversal. |
| `FT-WLPENDING-LOCUS-05-remove-only` | `fallbackMutationSummary(mutations)` computes `hasAddedNodes` before queue intake. | Do not enter pending-hide queue for remove-only mutation batches. |
| `FT-WLPENDING-LOCUS-06-resource-only` | Script/style/link/svg/path nodes are filtered after queue entry. | Reject resource-only added-node batches before card selector traversal. |
| `FT-WLPENDING-LOCUS-07-candidate-cap` | Candidate cap now rejects before nested traversal starts. | Keep nested traversal skipped when the pending-hide queue is already at `WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT`. |
| `FT-WLPENDING-LOCUS-08-nested-discovery` | Admitted containers use `matches()`, `querySelector()`, and `querySelectorAll()` to find video cards. | Preserve nested discovery for admitted whitelist routes and mutations. |
| `FT-WLPENDING-LOCUS-09-timer` | Admitted candidate collection coalesces behind one `pendingHideTimer`. | Preserve one-timer coalescing and do not increase timer churn. |
| `FT-WLPENDING-LOCUS-10-apply-parity` | `applyWhitelistPendingHide()` owns selected-row, processed, already pending, hidden, prefetch, placeholder, and focused recheck behavior. | Treat apply as read-only parity for the narrow intake patch. |
| `FT-WLPENDING-LOCUS-11-non-touch` | JSON filter, DOM fallback, background/state cache, selected-row, native sync, and release surfaces are separate owners. | Do not change those families in the narrow pending-intake patch. |

## Allowed Narrow Runtime Touches

The only runtime source family allowed by this boundary is:

```text
js/content_bridge.js
```

The implemented runtime touch shape is limited to:

```text
queueWhitelistPendingHide(mutations, delayMs = 40)
direct no-work checks inside the existing queue owner
the fallback observer callsite only if it passes the already-computed mutation summary
constant/source reads needed to preserve WHITELIST_PENDING_HIDE_CANDIDATE_LIMIT and current route/list-mode parity
```

The narrow patch must keep `applyWhitelistPendingHide(candidates)` behavior
semantically unchanged. Duplicating its list-mode and route no-op gates before
collection is allowed only if focused fixtures prove the early gate matches the
current apply gate.

## Forbidden Runtime Source Families

The narrow pending-intake patch must not touch or semantically change:

```text
js/filter_logic.js
js/content/dom_fallback.js
js/background.js
js/state_manager.js
js/seed.js
js/shared/identity.js
scripts/sync-native-runtime.mjs
manifest.json and release packaging
```

This boundary also does not approve edits to public/core product docs outside
`docs/audit`, cache data structures, JSON-first renderer filtering, selected
playlist/current-row policy, whitelist conflict policy, import/persistence
policy, or native/runtime sync artifacts.

## Required Future Fixture Shape

The narrow runtime patch includes executable proof for:

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

## Current Decision

```text
define whitelist pending-intake patch source locus: GO
prepare narrow whitelist pending-intake implementation patch: GO
narrow runtime whitelist pending intake patch in this audit slice: GO
runtime whitelist optimization patch now: NO-GO
runtime JSON-first behavior patch now: NO-GO
cache behavior patch now: NO-GO
DOM fallback behavior patch now: NO-GO
release package patch now: NO-GO
public claim patch now: NO-GO
continue proof-backed audit: GO
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is still a required source input before this source locus can support runtime
optimization. Current related audit evidence records:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
narrow runtime behavior changed: yes
```

This boundary can help keep a future patch small; it does not approve runtime
optimization. These counts are audit-only blockers and do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Verification

Current proof command:

```bash
node --test tests/runtime/whitelist-pending-intake-no-work-contract-current-behavior.test.mjs --test-reporter=spec
```

This boundary is not a completion claim. It pins where the narrow SPA slowdown
fix lives and keeps broader whitelist/cache/JSON-first/release changes blocked.
