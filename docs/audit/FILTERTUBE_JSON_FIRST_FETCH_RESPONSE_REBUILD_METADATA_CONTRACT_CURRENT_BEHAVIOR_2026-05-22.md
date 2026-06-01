# FilterTube JSON-First Fetch Response Rebuild Metadata Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, fetch patch, or
permission to change JSON filtering behavior.

## Purpose

This register isolates the fetch `Response` rebuild surface used by current
JSON-first filtering. The broader response mutation audit proves that matching
YouTubei fetches can be parsed, processed, and rebuilt. This narrower slice
pins the metadata and body contract of that rebuild before any optimization or
first-class JSON filter authority is introduced.

The current boundary is:

```text
Fetch JSON mutation currently rebuilds a new Response body and passes through
only status, statusText, and headers. It does not record a first-class decision
for body mode, content type, response identity metadata, pass-through reason, or
header cloning policy.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
source files with fetch response rebuild surface: 1
fetch endpoint entries: 5
fetch response clone body-read sites: 1
fetch response rebuild branches: 2
new Response body writer sites: 2
JSON.stringify rebuild body sites: 2
selected metadata fields preserved per rebuild: 3
selected metadata assignment sites: 6
headers object pass-through sites: 2
headers clone/copy sites: 0
content-type decision sites: 0
body mode decision sites: 0
response identity metadata writer sites: 0
pass-through branches returning original response: 4
normal rebuild positive fixtures: 1
comment shortcut rebuild positive fixtures: 1
pass-through original-response fixtures: 4
runtime behavior changed: no
not completion proof for JSON-first fetch response rebuild authority
```

## Fetch Response Rebuild Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Fetch endpoint gate | `js/seed.js:689` | Uses raw `urlStr.includes(endpoint)` before any response work. | Nonmatching URLs call original fetch and return its response. | Shared parsed endpoint decision and negative endpoint fixtures. |
| No-active-JSON-work gate | `js/seed.js:694` through `js/seed.js:695` | Matching YouTubei URLs call original fetch without clone/parse when settings have no active JSON work. | Empty blocklist/no active JSON rule states return the original response. | Shared no-work reason record tied to route, mode, and active-rule state. |
| Original response OK guard | `js/seed.js:699` | Only OK responses enter clone/JSON body processing. | Non-OK responses return the original response. | Pass-through reason record tied to status and endpoint. |
| Clone JSON body read | `js/seed.js:701` | Reads JSON from `response.clone().json()`, so mutation reads from a clone rather than the original response object. | JSON parse rejection is caught and returns the original response. | Body-mode decision, parse budget, and parse-failure provenance. |
| Comment shortcut rebuild | `js/seed.js:731` through `js/seed.js:735` | Rebuilds a synthetic comment-continuation response with `JSON.stringify(emptyCommentResponse)` and `{ status, statusText, headers }`. | If the body is not the shortcut shape, normal processing runs. | Shortcut body shape, sibling preservation, content-type, and metadata contract. |
| Normal processed rebuild | `js/seed.js:740` through `js/seed.js:745` | Calls `processWithEngine()` and rebuilds `JSON.stringify(processed)` with `{ status, statusText, headers }`. | If JSON parsing failed, the original response is returned by the catch branch. | Rebuild permission, active-rule mutation decision, content-type policy, and response identity policy. |
| Header propagation | `js/seed.js:734` and `js/seed.js:744` | Passes `response.headers` directly into each new `Response`. | Pass-through branches keep the original response and its headers untouched. | Header clone/copy policy and mutation-safety proof for shared header objects. |
| Response identity metadata | `js/seed.js:731` and `js/seed.js:741` | Constructs a new response without a source URL, redirected flag, response type, or body-used identity record. | Nonmatching, no-active-JSON-work, non-OK, and parse-failed responses preserve original response identity by returning the original object. | Compatibility proof for page code that reads `url`, `redirected`, `type`, body stream state, cache state, or trailer state. |

## Source-Derived Rows

```text
fetchEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
fetchResponseCloneJsonSites(1): response.clone().json
fetchResponseRebuildBranches(2): commentContinuationSyntheticEnd,normalProcessWithEngine
fetchResponseBodyWriters(2): JSON.stringify(emptyCommentResponse),JSON.stringify(processed)
fetchResponseMetadataPreserved(3): status,statusText,headers
fetchResponseMetadataAssignments(6): commentStatus,commentStatusText,commentHeaders,normalStatus,normalStatusText,normalHeaders
fetchHeaderCloneSites(0): none
fetchContentTypeDecisionSites(0): none
fetchBodyModeDecisionSites(0): none
fetchIdentityMetadataWriters(0): url,redirected,type,bodyUsed
fetchOriginalResponsePassThroughBranches(4): nonMatchingUrl,noActiveJsonWork,nonOkResponse,jsonParseFailure
runtimeRebuildPositiveFixtures(2): normalProcessRebuild,commentShortcutRebuild
runtimeOriginalResponseFixtures(4): nonMatchingUrl,noActiveJsonWork,nonOkResponse,jsonParseFailure
```

Anchor map:

```text
fetchUrlExtraction: `js/seed.js:686`
fetchUrlStringification: `js/seed.js:687`
fetchEndpointGate: `js/seed.js:689`
fetchNonMatchingPassThrough: `js/seed.js:690`
fetchNoActiveJsonWorkPassThrough: `js/seed.js:695`
fetchOriginalFetchThen: `js/seed.js:698`
fetchNonOkPassThrough: `js/seed.js:699`
fetchCloneJsonRead: `js/seed.js:701`
fetchRawNextShortcut: `js/seed.js:703`
fetchCommentResponseRebuild: `js/seed.js:731`
fetchCommentStatusPreserve: `js/seed.js:732`
fetchCommentStatusTextPreserve: `js/seed.js:733`
fetchCommentHeadersPreserve: `js/seed.js:734`
fetchProcessWithEngine: `js/seed.js:740`
fetchNormalResponseRebuild: `js/seed.js:741`
fetchNormalStatusPreserve: `js/seed.js:742`
fetchNormalStatusTextPreserve: `js/seed.js:743`
fetchNormalHeadersPreserve: `js/seed.js:744`
fetchParseFailurePassThrough: `js/seed.js:749`
```

## Current Fetch Response Rebuild Risks

- Rebuilt fetch responses preserve only `status`, `statusText`, and `headers`.
  There is no recorded policy for source URL, redirect state, response type,
  cache state, trailer state, stream state, or body-used identity.
- Header objects are passed through directly. There is no current clone/copy
  policy proving that shared header objects cannot be mutated by later code.
- Rebuilt bodies are always `JSON.stringify(...)`; there is no explicit body
  mode decision for object, array, empty, streaming, or non-JSON original bodies.
- The code does not set or recompute content-type. It depends on the original
  response headers that are passed into the rebuild.
- The original response is returned for nonmatching, no-active-JSON-work,
  non-OK, and parse-failed cases, but no pass-through reason object records why
  mutation did not happen.
- Comment shortcut and normal engine processing use the same selected metadata
  preservation shape even though their body semantics are different.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
normal processed rebuild: returns a new response with stringified processed JSON
normal processed rebuild: preserves status, statusText, and the same headers object
normal processed rebuild: does not preserve original url, redirected, or type identity metadata
comment shortcut rebuild: returns a new response with stringified synthetic end-marker JSON
comment shortcut rebuild: preserves status, statusText, and the same headers object
comment shortcut rebuild: does not preserve original url, redirected, or type identity metadata
nonmatching fetch: returns the original response and does not clone, parse, stringify, or process
no-active-JSON-work fetch: returns the original response and does not clone, parse, stringify, or process
non-OK matching fetch: returns the original response and does not clone, parse, stringify, or process
invalid JSON matching fetch: reads clone JSON once, then returns the original response without stringify or processData
```

## Future Proof Shape

A future fetch response rebuild contract should contain at least:

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
activeRuleState
rebuildBranch
mutationAllowed
parseAllowed
stringifyAllowed
bodyModeBefore
bodyModeAfter
bodySizeBefore
bodySizeAfter
statusPreserved
statusTextPreserved
headersPreserved
headersClonePolicy
contentTypeBefore
contentTypeAfter
urlPreservationPolicy
redirectedPreservationPolicy
responseTypePreservationPolicy
bodyUsedPolicy
streamPolicy
trailerPolicy
passThroughReason
normalRebuildFixture
commentShortcutRebuildFixture
nonMatchingPassThroughFixture
noActiveJsonWorkPassThroughFixture
nonOkPassThroughFixture
parseFailurePassThroughFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstFetchResponseRebuildContract
jsonFirstFetchResponseMetadataDecision
jsonFirstFetchBodyModeReport
jsonFirstFetchHeaderClonePolicy
jsonFirstFetchResponseIdentityReport
jsonFirstFetchPassThroughReason
jsonFirstFetchRebuildFixtureProvenance
jsonFirstFetchResponseMetricArtifact
jsonFirstFetchContentTypeDecision
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-fetch-response-rebuild-metadata-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this fetch response rebuild metadata contract
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
