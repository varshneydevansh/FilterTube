# FilterTube JSON-First Comment Continuation Shortcut - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, comment filtering
patch, or permission to change YouTubei `/next` behavior.

## Purpose

This register isolates the fetch-only comment-continuation shortcut that can
replace a `/youtubei/v1/next` response before the normal JSON engine path runs.
JSON-first filtering cannot become first-class behavior until this shortcut has
an explicit endpoint, command-shape, settings-mode, sibling-preservation, and
no-work contract.

The current boundary is:

```text
The append comment-continuation shortcut is a local response replacement branch,
not a shared comment continuation authority. It bypasses the engine for one
shape and misses other continuation command shapes.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_P0_WATCH_PLAYER_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md`

## Current Counts

```text
source files with comment continuation shortcut surface: 1
fetch-only shortcut branches: 1
raw /youtubei/v1/next shortcut gates: 1
hideAllComments shortcut guards: 1
response collection roots checked by shortcut: 1
continuation command shapes checked by shortcut: 1
comment renderer item shapes checked by shortcut: 2
synthetic response replacement branches: 1
synthetic end marker continuation items: 1
continuationEndpoint null writer sites: 1
metadata fields preserved by shortcut response: 3
append endpoint comment positive fixtures: 2
non-append command miss fixtures: 2
non-endpoints collection miss fixtures: 1
non-comment append fallback fixtures: 1
hideAllComments false fallback fixtures: 1
non-next endpoint fallback fixtures: 1
engine bypass fixtures: 2
engine fallback fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first comment continuation authority
```

## Shortcut Inventory

| Surface | Source anchor | Current behavior | Current risk | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Raw next URL gate | `js/seed.js:703` | Uses `urlStr.includes('/youtubei/v1/next')` and `cachedSettings?.hideAllComments`. | Raw URL matching and one setting field decide whether the branch can run. | Parsed endpoint, route, profile, and list-mode decision. |
| Collection root | `js/seed.js:705` | Reads only `jsonData?.onResponseReceivedEndpoints`. | `onResponseReceivedActions` and `onResponseReceivedCommands` comment continuations miss the shortcut. | Collection-root parity fixtures for endpoint/action/command response shapes. |
| Command shape | `js/seed.js:706` | Reads only `appendContinuationItemsAction.continuationItems`. | Reload and replace continuation command shapes miss the shortcut and fall into generic engine processing. | Append/reload/replace command parity policy. |
| Comment item shape | `js/seed.js:707` | Treats direct `commentThreadRenderer` or direct `commentRenderer` items as comment continuations. | Nested or future comment view-model shapes are not classified here unless the item exposes one of these direct keys. | Comment renderer shape manifest with reduced fixtures. |
| Synthetic response body | `js/seed.js:714` through `js/seed.js:664` | Replaces the whole response with one `appendContinuationItemsAction` containing one end marker. | Non-comment sibling continuation items from the original response are not preserved. | Sibling-visible and scaffold-preservation fixtures. |
| End marker | `js/seed.js:721` through `js/seed.js:723` | Writes `continuationItemRenderer.trigger` and `continuationEndpoint: null`. | The end-of-comments contract is local prose and not a shared response schema. | Synthetic end marker contract and compatibility proof. |
| Shortcut response rebuild | `js/seed.js:731` through `js/seed.js:670` | Rebuilds the response with `status`, `statusText`, and `headers` from the original response. | Content-type, cache, stream, URL, and response body mode are not recorded. | Response metadata and body-mode contract. |
| Normal fallback | `js/seed.js:740` and `js/seed.js:741` | Missed shapes call `processWithEngine()` and rebuild the body normally. | Hide-all comments can still parse/stringify/process missed comment continuation shapes. | Comment continuation no-work budget and leak fixture set. |

## Source-Derived Rows

```text
commentShortcutBranches(1): fetchAppendContinuationSyntheticEnd
rawNextShortcutGates(1): fetchUrlIncludesYoutubeiNext
settingsShortcutGuards(1): cachedSettingsHideAllComments
responseCollectionRootsChecked(1): onResponseReceivedEndpoints
continuationCommandShapesChecked(1): appendContinuationItemsAction
commentRendererItemShapesChecked(2): commentThreadRenderer,commentRenderer
syntheticReplacementBranches(1): emptyCommentResponse
syntheticEndMarkerItems(1): continuationItemRenderer
metadataPreserved(3): status,statusText,headers
runtimePositiveShortcutFixtures(2): appendCommentThreadRenderer,appendCommentRenderer
runtimeMissedShapeFixtures(3): reloadContinuationItemsCommand,replaceContinuationItemsCommand,onResponseReceivedActionsAppend
runtimeFallbackFixtures(3): nonCommentAppend,hideAllCommentsFalse,nonNextEndpoint
engineBypassFixtures(2): appendCommentThreadRenderer,appendCommentRenderer
engineFallbackFixtures(5): reloadContinuationItemsCommand,replaceContinuationItemsCommand,onResponseReceivedActionsAppend,nonCommentAppend,hideAllCommentsFalse
```

Anchor map:

```text
fetchJsonDecode: `js/seed.js:701`
commentShortcutComment: `js/seed.js:702`
rawNextHideAllGate: `js/seed.js:703`
commentRequestComment: `js/seed.js:704`
responseEndpointsRoot: `js/seed.js:705`
appendContinuationItemsAction: `js/seed.js:706`
commentRendererShapeTest: `js/seed.js:707`
syntheticBranchStart: `js/seed.js:711`
emptyCommentResponseStart: `js/seed.js:714`
syntheticResponseRoot: `js/seed.js:716`
syntheticAppendAction: `js/seed.js:717`
syntheticContinuationItems: `js/seed.js:718`
syntheticEndMarker: `js/seed.js:721`
syntheticTrigger: `js/seed.js:722`
syntheticContinuationEndpointNull: `js/seed.js:723`
shortcutResponseReplacement: `js/seed.js:731`
shortcutPreservedStatus: `js/seed.js:732`
shortcutPreservedStatusText: `js/seed.js:733`
shortcutPreservedHeaders: `js/seed.js:734`
normalFallbackComment: `js/seed.js:739`
normalProcessWithEngine: `js/seed.js:740`
normalResponseReplacement: `js/seed.js:741`
```

## Current Comment Continuation Risks

- The shortcut is fetch-only; XHR `/next` comment continuation responses do not
  use this synthetic end marker branch.
- The shortcut recognizes only `onResponseReceivedEndpoints` with
  `appendContinuationItemsAction`; reload and replace comment continuations
  fall into normal engine processing.
- `onResponseReceivedActions` append comment continuations also miss the
  shortcut.
- The synthetic response replaces the response root with a single append action
  and does not preserve non-comment sibling continuation items.
- The branch bypasses `processWithEngine()` entirely, so learned-map harvest,
  generic renderer filtering, and engine telemetry do not run for positive
  shortcut matches.
- Missed comment command shapes still parse, call `processWithEngine()`, and
  stringify under `hideAllComments=true`.
- The branch uses raw URL text rather than a parsed endpoint decision.
- The synthetic end marker has no shared schema or compatibility authority.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
append commentThreadRenderer endpoint: synthetic end marker, no processData
append commentRenderer endpoint: synthetic end marker, no processData
reload commentThreadRenderer endpoint: no synthetic marker, processData runs
replace commentThreadRenderer endpoint: no synthetic marker, processData runs
onResponseReceivedActions append commentThreadRenderer: no synthetic marker, processData runs
append non-comment endpoint: no synthetic marker, processData runs
append commentThreadRenderer with hideAllComments false: no synthetic marker, processData runs
search endpoint with append commentThreadRenderer: no synthetic marker, processData runs
synthetic response preserves status, statusText, and headers
```

## Future Proof Shape

A future comment continuation shortcut contract should contain at least:

```text
transport
endpoint
parsedPathname
rawUrl
route
surface
profileType
listMode
settingsRevision
hideAllComments
responseCollectionRoot
continuationCommand
continuationItemCountBefore
commentItemCountBefore
nonCommentSiblingCountBefore
commentRendererShape
syntheticEndAllowed
engineBypassAllowed
harvestBypassAllowed
statusPreserved
statusTextPreserved
headersPreserved
contentTypePolicy
responseBodyMode
siblingPreservationPolicy
appendFixture
reloadFixture
replaceFixture
actionsFixture
xhrFixture
negativeNonCommentFixture
negativeDisabledFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstCommentContinuationContract
jsonFirstCommentContinuationDecision
jsonFirstCommentShortcutShapeReport
jsonFirstCommentSyntheticEndDecision
jsonFirstCommentSiblingPreservationReport
jsonFirstCommentContinuationNoWorkBudget
jsonFirstCommentCommandParityReport
jsonFirstCommentContinuationFixtureProvenance
jsonFirstCommentContinuationMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-comment-continuation-shortcut-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
