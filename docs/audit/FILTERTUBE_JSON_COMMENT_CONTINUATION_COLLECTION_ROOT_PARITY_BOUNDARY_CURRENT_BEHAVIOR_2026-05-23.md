# FilterTube JSON Comment Continuation Collection Root Parity Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.
Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes.
This is not an implementation patch, optimization patch, collection-root patch,
comment filtering patch, continuation patch, fetch patch, XHR patch, or settings
schema patch.

## Purpose

This slice isolates the comment continuation collection-root parity gap left
open by the fetch shortcut, XHR parity, entity payload, and sibling-preservation
proofs. It pins that the fetch shortcut detects only
`onResponseReceivedEndpoints[].appendContinuationItemsAction`, while generic
engine filtering can traverse `onResponseReceivedActions` and
`onResponseReceivedCommands` when the shortcut does not bypass the engine.

Current boundary:

```text
For `/youtubei/v1/next` with hideAllComments enabled, the fetch shortcut checks
only onResponseReceivedEndpoints append continuation items for classic comment
renderers. If that endpoint root contains a classic comment, fetch returns a
synthetic endpoint response and does not run processWithEngine. Because the
replacement object spreads the original response and overwrites only
onResponseReceivedEndpoints, sibling roots such as onResponseReceivedActions and
onResponseReceivedCommands remain unchanged, including comment items. When the
endpoint shortcut does not fire, the normal engine path recursively traverses
actions and commands and can remove their classic comment renderers.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_SIBLING_PRESERVATION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment continuation collection-root parity source files: 2
JSON comment continuation collection-root parity source/effect blocks: 5
seed fetch comment shortcut lines: 38
seed fetch comment shortcut bytes: 2269
seed fetch normal processing lines: 7
seed fetch normal processing bytes: 395
filter_logic array recursion lines: 20
filter_logic array recursion bytes: 726
filter_logic object renderer removal lines: 11
filter_logic object renderer removal bytes: 536
filter_logic comment decision lines: 34
filter_logic comment decision bytes: 1947
fetch shortcut onResponseReceivedEndpoints tokens: 2
fetch shortcut onResponseReceivedActions tokens: 0
fetch shortcut onResponseReceivedCommands tokens: 0
fetch shortcut appendContinuationItemsAction tokens: 2
fetch shortcut processWithEngine tokens: 0
fetch normal processWithEngine tokens: 1
selected seed/filter_logic onResponseReceivedCommands tokens: 1
selected seed/filter_logic onResponseReceivedActions tokens: 2
selected seed/filter_logic onResponseReceivedEndpoints tokens: 4
runtime JSON comment continuation collection-root parity fixtures: 8
runtime behavior changed: yes
not completion proof for JSON comment continuation collection-root parity authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Shortcut detection root | Fetch shortcut checks only `onResponseReceivedEndpoints`. | Collection-root parity policy for endpoints, actions, and commands. |
| Shortcut command shape | Fetch shortcut checks only `appendContinuationItemsAction`. | Append/reload/replace command policy by root. |
| Shortcut bypass | When the endpoint root matches, `processWithEngine()` is not called. | Engine-bypass permission report. |
| Endpoint replacement | Shortcut overwrites only `onResponseReceivedEndpoints` and spreads the rest of the original response. | Cross-root cleanup policy. |
| Action root | Action-root comments are removed by the engine only when the shortcut does not bypass it. | Action root comment decision report. |
| Command root | Command-root comments are removed by the engine only when the shortcut does not bypass it. | Command root comment decision report. |
| Mixed roots | Endpoint-root comments can trigger shortcut while action/command-root comments remain unchanged. | Mixed-root leak budget. |
| Non-comment endpoint root | Endpoint-root non-comment items do not trigger shortcut, so action/command-root comments can reach the engine. | Root precedence policy. |

## Source Anchors

```text
seedFetchShortcutGate: `js/seed.js:703`
seedFetchCollectionRoot: `js/seed.js:705`
seedFetchAppendCommand: `js/seed.js:706`
seedFetchCommentShapes: `js/seed.js:707`
seedFetchReplacementObject: `js/seed.js:714`
seedFetchSpreadOriginal: `js/seed.js:715`
seedFetchReplacementRoot: `js/seed.js:716`
seedFetchNormalProcessing: `js/seed.js:739`
seedFetchProcessWithEngine: `js/seed.js:740`
filterLogicArrayRecursion: `js/filter_logic.js:3533`
filterLogicArrayKeepsNonNull: `js/filter_logic.js:3538`
filterLogicObjectRendererRemoval: `js/filter_logic.js:3553`
filterLogicRemoveEntireObject: `js/filter_logic.js:3560`
filterLogicCommentDecision: `js/filter_logic.js:2213`
```

## Runtime Fixture Summary

The runtime guard proves:

1. Endpoint-root append comments trigger the fetch shortcut and bypass the
   engine.
2. Action-root append comments alone miss the shortcut and are removed by the
   engine under `hideAllComments:true`.
3. Command-root append comments alone miss the shortcut and are removed by the
   engine under `hideAllComments:true`.
4. Mixed endpoint/action/command roots with an endpoint-root comment trigger the
   shortcut and leave action-root and command-root comments unchanged.
5. Endpoint-root non-comment append items do not trigger the shortcut, so
   action-root and command-root comments reach the engine and are removed.
6. Endpoint-root classic comments plus action-root non-comment rows preserve the
   action root because only `onResponseReceivedEndpoints` is overwritten.
7. The shortcut preserves spread metadata outside the endpoint root.
8. The shortcut source still has no `onResponseReceivedActions` or
   `onResponseReceivedCommands` branch.

## Risks Identified

- Reliability: endpoint, action, and command roots do not share one comment
  continuation policy.
- False-hide/leak: a shortcut triggered by endpoint comments can leave action or
  command comments visible in the returned JSON body.
- Performance: shortcut bypass prevents the engine from producing per-root
  decision evidence for sibling roots.
- Code burden: collection-root behavior is split between fetch shortcut shape
  detection and generic recursive engine traversal.

## Future Proof Fields

```text
transport
endpoint
route
surface
profileType
listMode
settings mode
rootType
responseCollectionRoot
continuationCommand
commentItemCountBefore
commentItemCountAfter
shortcutTriggered
engineBypassAllowed
actionRootCleanupPolicy
commandRootCleanupPolicy
crossRootPreservationPolicy
mixedRootLeakBudget
rootPrecedencePolicy
fixtureProvenance
metricArtifact
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentContinuationCollectionRootParityContract
jsonCommentContinuationCollectionRootDecisionReport
jsonCommentContinuationActionRootPolicy
jsonCommentContinuationCommandRootPolicy
jsonCommentContinuationRootPrecedencePolicy
jsonCommentContinuationCrossRootCleanupPolicy
jsonCommentContinuationMixedRootLeakBudget
jsonCommentContinuationRootEngineBypassReport
jsonCommentContinuationCollectionRootFixtureProvenance
jsonCommentContinuationCollectionRootMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-continuation-collection-root-parity-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open comment
continuation root-parity gap into current endpoint-only shortcut detection,
action/command engine-only cleanup, mixed-root leak behavior, shortcut bypass,
cross-root preservation, performance, false-hide/leak, and first-class JSON
comment continuation authority risks only.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this comment collection-root parity gap into first-collector parity and
rollout requirements. The addendum pins 12 collector parity rollout rows, 12
collector fixture provenance rows covered, 12 route/surface obligations covered,
2 evidence parity rollout rows covered, 8 parity and release boundary source
docs covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. Endpoint, action, command, shortcut,
engine, DOM, native, release, and public surfaces remain separate proof scopes.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps the comment continuation collection-root parity gap into the future
`parity-rollout.json` contract without creating rollout artifacts or approving
runtime behavior. The addendum pins 12 parity rollout contract rows, 1 reserved
parity rollout path covered, 0 committed parity rollout files, 0 runtime metric
collector approvals, and 0 implementation-ready parity rollout contract rows.
Endpoint, action, command, shortcut, engine, DOM, native, release, and public
surfaces remain separate proof scopes before JSON-first promotion.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: yes
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
