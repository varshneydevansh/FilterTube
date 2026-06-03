# FilterTube JSON Comment Continuation Sibling Preservation Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.
Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes.
This is not an implementation patch, optimization patch, continuation patch,
comment filtering patch, sibling preservation patch, fetch patch, XHR patch, or
settings schema patch.

## Purpose

This slice isolates a comment continuation sibling-preservation gap exposed by
the fetch-only `/youtubei/v1/next` comment shortcut. It pins that the normal JSON
engine removes only renderer objects whose own decisions return blocked, while
the fetch shortcut replaces the entire append continuation collection once any
classic comment item is detected.

Current boundary:

```text
When hideAllComments is enabled, recursive engine filtering removes matching
commentRenderer or commentThreadRenderer objects and keeps non-null sibling
items, such as a commentsHeaderRenderer-like header, a videoRenderer sibling,
or an existing continuationItemRenderer. The fetch shortcut takes a broader
transport-level path: if any onResponseReceivedEndpoints append continuation
item is a commentThreadRenderer or commentRenderer, it replaces
onResponseReceivedEndpoints with one appendContinuationItemsAction containing a
single synthetic continuationItemRenderer. That drops non-comment siblings in
the same continuation collection and also overwrites the original continuation
item.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_XHR_COMMENT_CONTINUATION_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_ENTITY_PAYLOAD_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment continuation sibling preservation source files: 2
JSON comment continuation sibling preservation source/effect blocks: 6
seed fetch comment shortcut lines: 38
seed fetch comment shortcut bytes: 2269
seed fetch normal processing lines: 7
seed fetch normal processing bytes: 395
filter_logic array recursion lines: 20
filter_logic array recursion bytes: 726
filter_logic object renderer removal lines: 11
filter_logic object renderer removal bytes: 536
filter_logic recursive property copy lines: 18
filter_logic recursive property copy bytes: 743
filter_logic comment decision lines: 34
filter_logic comment decision bytes: 1947
selected seed/filter_logic commentsHeaderRenderer tokens: 0
selected seed/filter_logic commentHeaderRenderer tokens: 0
selected seed/filter_logic continuationItemRenderer tokens: 1
selected seed/filter_logic appendContinuationItemsAction tokens: 4
selected seed/filter_logic continuationItems tokens: 10
selected seed/filter_logic onResponseReceivedEndpoints tokens: 4
fetch shortcut commentsHeaderRenderer tokens: 0
fetch shortcut videoRenderer tokens: 0
fetch shortcut continuationItemRenderer tokens: 1
fetch shortcut comment renderer detector tokens: 2
runtime JSON comment continuation sibling preservation fixtures: 8
runtime behavior changed: yes
not completion proof for JSON comment continuation sibling preservation authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Engine array recursion | Arrays drop only children that return `null`; non-comment siblings remain. | Sibling-preservation policy by route, command, and renderer family. |
| Engine object removal | A blocked renderer object returns `null` and removes that object only. | Parent/child removal decision report. |
| Engine property copy | Object recursion copies non-null filtered children and keeps wrappers. | Empty-wrapper and sibling-retention policy. |
| Fetch shortcut detector | Fetch shortcut checks only classic comment item shapes, not header, video, or original continuation items. | Mixed-continuation detector report. |
| Fetch shortcut mutation | Once any detected comment exists, fetch replaces the whole `onResponseReceivedEndpoints` array. | Collection-level replacement policy. |
| Header-like siblings | A `commentsHeaderRenderer`-like sibling is preserved by engine recursion but dropped by fetch shortcut. | Header/control preservation policy. |
| Video siblings | A non-comment video sibling is preserved by engine recursion but dropped by fetch shortcut. | Non-comment sibling visibility proof. |
| Existing continuation item | An existing continuation item is preserved by engine recursion but overwritten by fetch shortcut's synthetic end marker. | Continuation endpoint preservation policy. |
| Keyword path contrast | With `hideAllComments:false`, fetch falls through to normal engine processing, so comment keywords can remove the comment while preserving siblings. | Shared comment continuation decision contract. |

## Source Anchors

```text
seedFetchShortcutGate: `js/seed.js:703`
seedFetchCollectionRoot: `js/seed.js:705`
seedFetchAppendCommand: `js/seed.js:706`
seedFetchCommentShapes: `js/seed.js:707`
seedFetchReplacementObject: `js/seed.js:714`
seedFetchSpreadOriginal: `js/seed.js:715`
seedFetchReplacementRoot: `js/seed.js:716`
seedFetchSyntheticItem: `js/seed.js:721`
seedFetchSyntheticEnd: `js/seed.js:723`
seedFetchNormalProcessing: `js/seed.js:739`
seedFetchProcessWithEngine: `js/seed.js:740`
filterLogicArrayRecursion: `js/filter_logic.js:3533`
filterLogicArrayKeepsNonNull: `js/filter_logic.js:3538`
filterLogicObjectRendererRemoval: `js/filter_logic.js:3553`
filterLogicRemoveEntireObject: `js/filter_logic.js:3560`
filterLogicRecursivePropertyCopy: `js/filter_logic.js:3564`
filterLogicCopyNonNullChild: `js/filter_logic.js:3573`
filterLogicCommentDecision: `js/filter_logic.js:2213`
```

## Runtime Fixture Summary

The runtime guard proves:

1. Engine filtering with `hideAllComments:true` removes the classic comment
   item from a mixed append continuation and preserves the header-like sibling,
   video sibling, and original continuation item.
2. Fetch shortcut with the same mixed append continuation bypasses the engine
   and returns only the synthetic continuation item.
3. Fetch shortcut drops the header-like sibling.
4. Fetch shortcut drops the video sibling.
5. Fetch shortcut overwrites the original continuation item and its endpoint.
6. Fetch shortcut preserves response metadata and spread fields outside
   `onResponseReceivedEndpoints`.
7. Fetch normal path with `hideAllComments:false` and a comments-only keyword
   removes the matching comment while preserving siblings.
8. A non-comment-only append continuation does not trigger the shortcut and
   reaches normal engine processing.

## Risks Identified

- Reliability: engine recursion and fetch shortcut do not share one
  sibling-preservation contract for mixed comment continuations.
- False-hide/leak: non-comment siblings, header/control rows, or continuation
  controls can be hidden by a global comment shortcut decision.
- Performance: replacing mixed collections can prevent later structured
  decision reporting from seeing which sibling rows were dropped.
- Code burden: preservation behavior is spread across recursive JSON filtering,
  fetch shortcut detector shape, and response replacement code.

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
continuationItemCountBefore
commentItemCountBefore
headerSiblingCountBefore
videoSiblingCountBefore
originalContinuationCountBefore
syntheticEndAllowed
engineBypassAllowed
siblingDropAllowed
headerPreservationPolicy
videoSiblingPolicy
continuationEndpointPolicy
metadataPreservationPolicy
fixtureProvenance
metricArtifact
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentContinuationSiblingPreservationContract
jsonCommentContinuationSiblingDecisionReport
jsonCommentContinuationMixedCollectionPolicy
jsonCommentContinuationHeaderPreservationPolicy
jsonCommentContinuationVideoSiblingPolicy
jsonCommentContinuationEndpointPreservationPolicy
jsonCommentContinuationFetchReplacementReport
jsonCommentContinuationEngineParityReport
jsonCommentContinuationSiblingFixtureProvenance
jsonCommentContinuationSiblingMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-continuation-sibling-preservation-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open mixed comment
continuation gap into current engine sibling preservation, fetch shortcut
collection replacement, header/control sibling drop, video sibling drop,
continuation overwrite, metadata preservation, false-hide/leak, performance, and
first-class JSON comment continuation authority risks only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: yes
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
