# FilterTube JSON-First Response Mutation Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior changed: yes;
inactive YouTubei requests now bypass body parsing before response mutation.
This is not an implementation patch, optimization patch, or permission to make
JSON filtering behavior changes.

## Purpose

This register isolates the transport mutation surface that JSON-first filtering
would have to own before becoming first-class behavior. The current code can
read YouTubei JSON, call the filter engine, and replace response bodies, but
response mutation is governed by local fetch/XHR code rather than a shared
contract.

The current boundary is:

```text
JSON-first filtering requires response mutation proof, not only renderer path
proof. Fetch response replacement, XHR response/responseText overrides,
endpoint matching, status/header propagation, and pass-through failure behavior
must all be explicit before transport behavior changes.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
source files with response mutation surface: 1
fetch endpoint entries: 5
XHR endpoint entries: 5
fetch endpoint substring match sites: 1
XHR endpoint substring match sites: 2
raw next URL substring shortcut sites: 1
fetch JSON decode sites: 1
fetch response replacement branches: 2
fetch replacement branches preserving status/statusText/headers: 2
fetch JSON parse failure pass-through branches: 1
fetch non-ok response pass-through branches: 1
XHR body parse modes: 2
XHR JSON.parse sites: 1
XHR JSON.stringify replacement sites: 1
XHR modified response fields: 2
XHR per-instance property override sites: 2
runtime behavior changed: yes; no-work gate bypasses inactive YouTubei response parsing before fetch clone or XHR body processing
not completion proof for JSON-first response mutation authority
```

## Response Mutation Inventory

| Surface | Source anchor | Current mutation behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Fetch endpoint selection | `js/seed.js:693` | Uses `urlStr.includes(endpoint)` across 5 endpoint substrings, then builds `dataName` and checks the no-work gate before original fetch body work. | Nonmatching and inactive matching URLs call original fetch without clone/parse/stringify. | Parsed origin/path endpoint policy and negative query/prefix fixtures. |
| Fetch JSON body read | `js/seed.js:701` | Calls `response.clone().json()` only for matching, OK responses that passed the no-work gate. | JSON parse rejection is caught and returns the original response. | Parse budget tied to endpoint, settings revision, active rules, and no-work state. |
| Fetch comment shortcut | `js/seed.js:703` and `js/seed.js:731` | Uses raw `urlStr.includes('/youtubei/v1/next')` plus `hideAllComments`, then can replace comment continuation JSON with a synthetic end marker. | If the parsed body is not a comment continuation, it falls through to normal processing. | Endpoint/type proof that the shortcut applies only to intended continuations and preserves sibling content. |
| Fetch normal response rebuild | `js/seed.js:740` and `js/seed.js:741` | Calls `processWithEngine(jsonData, dataName)` and constructs `new Response(JSON.stringify(processed), { status, statusText, headers })`. | Non-OK and inactive no-work responses bypass parsing and response rebuilding. | Response mutation contract proving body, status, status text, header, stream, and content-type semantics. |
| XHR endpoint selection | `js/seed.js:924` and `js/seed.js:940` | `open()` and `send()` both use substring matching, build `dataName`, and set `__filtertube_shouldProcessXhr` only when the no-work gate allows processing. | Nonmatching and inactive matching URLs skip per-XHR processing marks. | Shared endpoint parser with fetch and negative query/prefix fixtures. |
| XHR response readiness hooks | `js/seed.js:898`, `js/seed.js:911`, and `js/seed.js:940` | Prototype `addEventListener`/`removeEventListener` wrappers and `send()` ready-state/load hooks can call `ensureXhrResponseProcessed()`. | Late guards inside `ensureXhrResponseProcessed()` reject no settings, disabled, non-ready, error, no-work, non-JSON, and non-text response states. | Lifecycle budget for hook installation separate from body mutation permission. |
| XHR body parse and mutation | `js/seed.js:834`, `js/seed.js:837`, `js/seed.js:843`, `js/seed.js:851`, and `js/seed.js:855` | Reads `xhr.response` for `json`, parses `xhr.responseText` for text/empty response types, calls `processWithEngine(jsonData, dataName)`, and stores a stringified replacement. | Empty, non-object, non-JSON-looking, parse-failed, unsupported response types, inactive no-work states, and falsy/non-object processed values return without override. | Body parse and mutation decision for each response type and active-rule state. |
| XHR response override | `js/seed.js:863` and `js/seed.js:878` | Defines per-XHR `response` and `responseText` getters after mutation; `responseType === 'json'` returns the modified object while text-like responses return the stringified body. | Getter fallback delegates to prototype getters when no modified response exists. | Property override contract proving compatibility with page callers, listener timing, and teardown expectations. |

## Source-Derived Rows

```text
fetchEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
xhrEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
fetchResponseReplacementBranches(2): commentContinuationSyntheticEnd,normalProcessWithEngine
fetchResponseMetadataPreserved(3): status,statusText,headers
fetchPassThroughBranches(3): nonMatchingUrl,nonOkResponse,jsonParseFailure
xhrParseModes(2): responseType-json,responseType-empty-or-text
xhrLateGuardBranches(8): alreadyProcessed,notMarked,notReady,noSettings,disabled,errorStatus,nonJsonBody,unsupportedResponseType
xhrMutationFields(4): __filtertube_modifiedResponse,__filtertube_modifiedResponseText,responseGetter,responseTextGetter
xhrListenerHookSites(4): addEventListenerWrapper,removeEventListenerWrapper,sendReadyStateHook,sendLoadHook
```

Anchor map:

```text
fetchDataNameGate: `js/seed.js:693`
fetchJsonDecode: `js/seed.js:701`
fetchRawNextShortcut: `js/seed.js:703`
fetchCommentReplacement: `js/seed.js:731`
fetchProcessWithEngine: `js/seed.js:740`
fetchNormalReplacement: `js/seed.js:741`
xhrEnsureProcessor: `js/seed.js:813`
xhrDataNameGate: `js/seed.js:825`
xhrJsonResponseMode: `js/seed.js:834`
xhrTextResponseMode: `js/seed.js:837`
xhrTextJsonParse: `js/seed.js:843`
xhrProcessWithEngine: `js/seed.js:851`
xhrModifiedResponseField: `js/seed.js:854`
xhrModifiedResponseTextField: `js/seed.js:855`
xhrResponseGetterOverride: `js/seed.js:863`
xhrResponseTextGetterOverride: `js/seed.js:878`
xhrOpenPatch: `js/seed.js:924`
xhrSendPatch: `js/seed.js:940`
```

## Current Response Mutation Risks

- An active matching fetch response can be cloned, parsed, passed through
  `processWithEngine()`, stringified, and rebuilt even when `processWithEngine()`
  returns the original object.
- Fetch response rebuild preserves status, status text, and headers, but there
  is no explicit content-type, stream body, cache, or response URL contract.
- JSON parse failure returns the original fetch response, but parse failure is
  not reported through a response mutation authority.
- Both fetch and XHR endpoint checks use substring matching, so endpoint text in
  a query string or a longer path can still enter the mutation path.
- The comment-continuation shortcut uses raw `url.includes('/youtubei/v1/next')`
  rather than the parsed pathname helper used for `dataName`.
- XHR can mark and hook requests before late settings and disabled guards reject
  body processing.
- XHR response overrides are per-instance getters installed after mutation; no
  shared contract records how page code reading `response` versus `responseText`
  should observe modified values for each response type.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
matching no-work fetch: no response.clone().json, no JSON.stringify, no processData
non-matching fetch: no response.clone().json, no JSON.stringify, no processData
OK matching fetch: response.clone().json before processWithEngine
active matching fetch: rewritten body preserves status, statusText, and headers
invalid JSON matching fetch: returns original response and skips JSON.stringify
non-OK matching fetch: returns original response and skips body parsing
query-only endpoint text: still intercepts fetch and marks XHR
longer path prefix endpoint text: still intercepts fetch
```

## Future Proof Shape

A future response mutation contract should contain at least:

```text
transport
sourceOwner
endpoint
parsedOrigin
parsedPathname
rawUrl
route
surface
profileType
listMode
settingsRevision
activeRuleState
responseStatus
responseStatusText
responseHeaders
responseContentType
responseBodyMode
responseBodySizeBefore
responseBodySizeAfter
parseAllowed
mutationAllowed
stringifyAllowed
responseRebuildAllowed
xhrOverrideAllowed
passThroughReason
commentShortcutReason
positiveMutationFixture
negativeNoRuleFixture
negativeDisabledFixture
negativeParseFailureFixture
negativeEndpointFixture
negativeSiblingFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstResponseMutationAuthority
jsonFirstResponseMutationContract
jsonFirstEndpointParserContract
jsonFirstFetchResponseDecision
jsonFirstXhrResponseDecision
jsonFirstResponseMetadataReport
jsonFirstResponsePassThroughReason
jsonFirstCommentContinuationDecision
jsonFirstResponseMutationFixtureProvenance
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-response-mutation-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this JSON-first response mutation surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, response override changes, pass-through
policy changes, comment continuation changes, or selector/renderer authority
changes.
