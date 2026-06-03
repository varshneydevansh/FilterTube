# FilterTube XHR Comment Continuation Parity Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior changed for no-active-JSON-work XHRs on 2026-05-26.
This is not an implementation patch, optimization patch, XHR patch, fetch
patch, comment filtering patch, continuation patch, settings patch, or response
override patch.

## Purpose

This slice isolates the transport parity gap between the fetch-only comment
continuation shortcut and the XHR response override path. It pins that fetch can
turn an append comment continuation into a synthetic end-marker response when
`hideAllComments` is enabled, while XHR for the same `/youtubei/v1/next` shape
uses generic `processWithEngine()` response mutation and has no matching
synthetic-end branch.

Current boundary:

```text
Fetch interception has a `/youtubei/v1/next` plus `hideAllComments` shortcut
that detects only `onResponseReceivedEndpoints[].appendContinuationItemsAction`
items containing `commentThreadRenderer` or `commentRenderer`, bypasses the
engine, and returns one `continuationItemRenderer` with `continuationEndpoint:
null`. XHR interception recognizes the same endpoint list when active JSON work
exists, but its response processor has no `hideAllComments`, comment-renderer,
collection-root, or synthetic-end tests; after body parsing it delegates
matching JSON to `processWithEngine()` and installs per-instance `response` and
`responseText` getters for that processed body. Disabled, missing-settings, and
no-active-JSON-work XHRs now bypass endpoint marking and ready hooks before
body parsing.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_VIEW_MODEL_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_STRUCTURAL_WRAPPER_CLEANUP_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
XHR comment continuation parity source files: 2
XHR comment continuation parity source/effect blocks: 6
seed fetch interception block lines: 91
seed fetch interception block bytes: 4426
seed fetch comment shortcut lines: 38
seed fetch comment shortcut bytes: 2269
seed XHR interception block lines: 219
seed XHR interception block bytes: 10318
seed XHR processor block lines: 85
seed XHR processor block bytes: 4429
seed XHR endpoint block lines: 8
seed XHR endpoint block bytes: 242
seed XHR send hook block lines: 31
seed XHR send hook block bytes: 1397
fetch shortcut hideAllComments tokens: 2
fetch shortcut next endpoint tokens: 1
fetch shortcut collection root tokens: 2
fetch shortcut append command tokens: 2
fetch shortcut comment renderer shape tokens: 2
fetch shortcut synthetic item tokens: 1
fetch shortcut continuationEndpoint-null tokens: 1
fetch shortcut processWithEngine tokens: 0
XHR block hideAllComments tokens: 0
XHR block collection root tokens: 0
XHR block append command tokens: 0
XHR block comment renderer shape tokens: 0
XHR block synthetic item tokens: 0
XHR block continuationEndpoint-null tokens: 0
XHR block processWithEngine tokens: 1
XHR block responseText tokens: 3
XHR block responseType tokens: 6
runtime XHR comment continuation parity fixtures: 8
runtime behavior changed: XHR no-active-JSON-work pass-through only
not completion proof for XHR comment continuation parity authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Endpoint inventory | Fetch and XHR both include `/youtubei/v1/next` in their endpoint lists. | Shared endpoint policy with transport, route, surface, and settings mode. |
| Fetch shortcut gate | Fetch checks raw URL substring plus `cachedSettings?.hideAllComments`. | Parsed endpoint policy and explicit shortcut permission. |
| Fetch comment detection | Fetch detects only `onResponseReceivedEndpoints[].appendContinuationItemsAction.continuationItems[]` containing `commentThreadRenderer` or `commentRenderer`. | Collection-root and continuation-command parity report. |
| Fetch mutation | Fetch returns a synthetic end-marker response and bypasses engine processing for detected append comments. | Sibling-preservation, body-mode, and engine-bypass policy. |
| XHR endpoint mark | XHR marks `/youtubei/v1/next` before body parsing and installs ready/load hooks only after the no-work bypass passes. | Listener-hook and active-work budget report. |
| XHR body processing | XHR accepts `json`, empty, and `text` response bodies, parses JSON when needed, then calls `processWithEngine()`. | Body-mode decision report and route-level mutation permission. |
| XHR comment append | XHR append comment continuations under `hideAllComments:true` are processed by the engine, leaving empty continuation arrays rather than a synthetic end marker. | Transport parity contract and synthetic-end policy. |
| XHR modern ViewModel | XHR comment continuations containing `commentViewModel` currently follow engine no-rule behavior and survive global comment hiding. | Modern comment shape parity policy across fetch, XHR, engine, and DOM fallback. |
| XHR command parity | XHR reload, replace, and actions roots use the same generic path instead of the fetch shortcut's append/endpoints-only detection. | Continuation command parity report. |

## Source Anchors

```text
fetchSetup: `js/seed.js:666`
fetchShortcutGate: `js/seed.js:703`
fetchCollectionRoot: `js/seed.js:705`
fetchAppendCommand: `js/seed.js:706`
fetchCommentShapes: `js/seed.js:707`
fetchSyntheticItem: `js/seed.js:721`
fetchSyntheticEnd: `js/seed.js:723`
xhrSetup: `js/seed.js:757`
xhrNextEndpoint: `js/seed.js:766`
xhrProcessor: `js/seed.js:813`
xhrProcessWithEngine: `js/seed.js:851`
xhrResponseTextWrite: `js/seed.js:855`
xhrResponseGetter: `js/seed.js:863`
xhrResponseTextGetter: `js/seed.js:878`
xhrReadystatechangeHook: `js/seed.js:961`
xhrLoadHook: `js/seed.js:962`
```

## Runtime Fixture Summary

The runtime guard proves:

1. Fetch append comment continuation under `hideAllComments:true` bypasses the
   engine and returns one synthetic end-marker item with
   `continuationEndpoint:null`.
2. XHR text-like append comment continuation under the same setting calls
   `processWithEngine()` with `xhr:/youtubei/v1/next`, removes the comment, and
   leaves `appendContinuationItemsAction.continuationItems: []`.
3. XHR `responseType:"json"` append comment continuation follows the same
   generic engine path and returns an object from `response` plus a string from
   `responseText`.
4. XHR comment continuations containing `commentViewModel` survive
   `hideAllComments:true` because the engine has no renderer rule for that key.
5. XHR reload continuation command payloads use the same generic engine path.
6. XHR replace continuation command payloads use the same generic engine path.
7. XHR `onResponseReceivedActions` append payloads use the same generic engine
   path.
8. XHR disabled mode now bypasses endpoint marking and ready hooks, and it does
   not process or override the response.

## Risks Identified

- Reliability: fetch, XHR, engine, and DOM fallback do not share one comment
  continuation decision contract.
- False-hide/leak: fetch can end append classic comments early, while XHR can
  leave empty wrappers or preserve modern `commentViewModel` payloads.
- Performance: XHR still parses and processes comment continuation JSON instead
  of using the fetch shortcut's no-engine path.
- Code burden: continuation policy is split across fetch shortcut detection,
  XHR response override machinery, recursive engine pruning, and DOM fallback
  selectors.

## Future Proof Fields

```text
transport
endpoint
parsedPathname
rawUrl
route
surface
profileType
listMode
settings mode
responseCollectionRoot
continuationCommand
commentRendererShape
synthetic-end
engine-bypass
responseType
body-mode
listener-hook
no-work budget
metric
fixture
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
xhrCommentContinuationParityContract
xhrCommentContinuationDecisionReport
xhrCommentContinuationTransportParityReport
xhrCommentContinuationSyntheticEndPolicy
xhrCommentContinuationEngineBypassReport
xhrCommentContinuationBodyModeReport
xhrCommentContinuationViewModelParityReport
xhrCommentContinuationCommandParityReport
xhrCommentContinuationFixtureProvenance
xhrCommentContinuationMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/xhr-comment-continuation-parity-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open transport parity
gap into current fetch shortcut, XHR generic processing, engine wrapper
retention, modern ViewModel leak, command parity, no-work, and synthetic-end
policy risks only.

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
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
