# FilterTube JSON Comment Continuation Command Shape Parity Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.
Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes.
This is not an implementation patch, optimization patch, command-shape patch,
comment filtering patch, continuation patch, fetch patch, XHR patch, or settings
schema patch.

## Purpose

This slice isolates the append/reload/replace command-shape parity gap left open
by the fetch shortcut, XHR parity, sibling-preservation, entity-payload, and
collection-root proofs. It pins that the fetch shortcut detects only
`appendContinuationItemsAction` under `onResponseReceivedEndpoints`, while the
normal engine path can recursively clean classic comments inside append, reload,
and replace command shapes when the shortcut does not bypass the engine.

Current boundary:

```text
For `/youtubei/v1/next` with hideAllComments enabled, an endpoint-root append
classic comment triggers the fetch shortcut, bypasses processWithEngine, and
overwrites the whole onResponseReceivedEndpoints root with one synthetic append
end marker. Endpoint-root reload and replace commands do not trigger that
shortcut by themselves; they fall into normal engine processing and classic
comments are removed from their continuationItems arrays. If an append comment
is present in the same endpoint collection, reload and replace entries are
dropped by endpoint-root replacement before the engine can make per-command
decisions, including non-comment reload/replace siblings.
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
- `docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment continuation command-shape parity source files: 2
JSON comment continuation command-shape parity source/effect blocks: 5
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
fetch shortcut appendContinuationItemsAction tokens: 2
fetch shortcut reloadContinuationItemsCommand tokens: 0
fetch shortcut replaceContinuationItemsCommand tokens: 0
fetch shortcut processWithEngine tokens: 0
fetch normal processWithEngine tokens: 1
seed layout continuation-key rows with append/reload/replace: 2
runtime JSON comment continuation command-shape parity fixtures: 6
runtime behavior changed: yes
not completion proof for JSON comment continuation command-shape parity authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Append endpoint comment | Fetch shortcut returns one synthetic append end marker and bypasses the engine. | Append synthetic-end policy by endpoint kind. |
| Reload endpoint comment | Fetch shortcut does not detect reload; normal engine removes classic comments from `reloadContinuationItemsCommand.continuationItems`. | Reload command policy. |
| Replace endpoint comment | Fetch shortcut does not detect replace; normal engine removes classic comments from `replaceContinuationItemsCommand.continuationItems`. | Replace command policy. |
| Append non-comment plus reload/replace comments | No shortcut fires; append non-comment survives and reload/replace comments are removed by engine recursion. | Mixed-command cleanup policy. |
| Append comment plus reload/replace comments | Shortcut fires and replaces the whole endpoint root; reload/replace entries disappear without engine decisions. | Per-command engine-bypass report. |
| Append comment plus reload/replace non-comments | Shortcut fires and drops non-comment reload/replace siblings. | Non-comment command sibling preservation policy. |
| Layout skip helpers | Seed layout heuristics list append, reload, and replace as continuation keys elsewhere. | Shared continuation command classifier. |

## Source Anchors

```text
seedSearchCollectionRoots: `js/seed.js:273`
seedSearchContinuationKeys: `js/seed.js:279`
seedHomeCollectionRoots: `js/seed.js:355`
seedHomeContinuationKeys: `js/seed.js:358`
seedFetchShortcutGate: `js/seed.js:703`
seedFetchCollectionRoot: `js/seed.js:705`
seedFetchAppendCommand: `js/seed.js:706`
seedFetchReplacementObject: `js/seed.js:714`
seedFetchSpreadOriginal: `js/seed.js:715`
seedFetchReplacementRoot: `js/seed.js:716`
seedFetchNormalProcessing: `js/seed.js:739`
seedFetchProcessWithEngine: `js/seed.js:740`
filterLogicCommentDecision: `js/filter_logic.js:2213`
filterLogicArrayRecursion: `js/filter_logic.js:3533`
filterLogicArrayKeepsNonNull: `js/filter_logic.js:3538`
filterLogicObjectRendererRemoval: `js/filter_logic.js:3553`
filterLogicRemoveEntireObject: `js/filter_logic.js:3560`
```

## Runtime Fixture Summary

The runtime guard proves:

1. Endpoint-root append classic comments trigger the fetch shortcut, bypass the
   engine, and return one synthetic append end marker.
2. Endpoint-root reload classic comments do not trigger the shortcut and are
   removed by the normal engine path.
3. Endpoint-root replace classic comments do not trigger the shortcut and are
   removed by the normal engine path.
4. Endpoint-root append non-comment items plus reload/replace comments do not
   trigger the shortcut; the append non-comment survives while reload/replace
   comments are removed.
5. Endpoint-root append classic comments plus reload/replace classic comments
   trigger the shortcut; reload/replace entries disappear through root
   replacement and `processWithEngine()` is not called.
6. Endpoint-root append classic comments plus reload/replace non-comment items
   trigger the shortcut; non-comment reload/replace siblings are dropped before
   engine traversal.

## Risks Identified

- Reliability: append, reload, and replace continuation commands do not share
  one comment-continuation decision path.
- False-hide/leak: a shortcut triggered by append comments can drop non-comment
  reload/replace siblings, while reload/replace comments alone use empty-array
  engine cleanup instead of the synthetic end marker.
- Performance: missed reload/replace comments still pay generic engine parse,
  traversal, and stringify work under `hideAllComments:true`.
- Code burden: continuation command knowledge appears in layout skip helpers
  and the fetch shortcut separately, with different command coverage.

## Future Proof Fields

```text
transport
endpoint
route
surface
profileType
listMode
settings mode
responseCollectionRoot
continuationCommand
commandIndex
commentItemCountBefore
commentItemCountAfter
nonCommentSiblingCountBefore
nonCommentSiblingCountAfter
shortcutTriggered
syntheticEndAllowed
engineBypassAllowed
commandShapeParityPolicy
mixedCommandCleanupPolicy
nonCommentCommandSiblingPolicy
fixtureProvenance
metricArtifact
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentContinuationCommandShapeParityContract
jsonCommentContinuationCommandShapeDecisionReport
jsonCommentContinuationAppendCommandPolicy
jsonCommentContinuationReloadCommandPolicy
jsonCommentContinuationReplaceCommandPolicy
jsonCommentContinuationMixedCommandCleanupPolicy
jsonCommentContinuationNonCommentCommandSiblingPolicy
jsonCommentContinuationCommandEngineBypassReport
jsonCommentContinuationCommandFixtureProvenance
jsonCommentContinuationCommandMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-continuation-command-shape-parity-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open comment
continuation command-shape gap into current append-only shortcut detection,
reload/replace engine-only cleanup, mixed-command root replacement behavior,
performance, false-hide/leak, and first-class JSON comment continuation
authority risks only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: yes
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
