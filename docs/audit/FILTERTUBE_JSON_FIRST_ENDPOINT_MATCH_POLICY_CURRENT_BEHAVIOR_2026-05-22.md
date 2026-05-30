# FilterTube JSON-First Endpoint Match Policy - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior changed for no-work gating.
This is not an implementation patch, optimization patch, endpoint parser patch,
or permission to change YouTubei filtering behavior.

## Purpose

This register isolates the endpoint classification surface that JSON-first
filtering would have to own before response parsing, mutation, or optimization
can become first-class behavior. The current fetch and XHR transport paths use
raw substring checks to decide whether a URL is YouTubei-like, while parsed
pathname helpers are used later only for the `processWithEngine()` data label.

The current boundary is:

```text
JSON-first filtering needs endpoint match proof before body-work proof.
Raw substring matches can enter fetch or XHR processing even when the endpoint
token appears in a query value or as the prefix of a longer pathname.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`
- `docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
source files with endpoint match surface: 1
fetch endpoint entries: 5
XHR endpoint entries: 5
endpoint arrays with identical values: 2
fetch raw substring endpoint gate sites: 1
XHR raw substring endpoint gate sites: 2, both gated by no-work bypass
raw next URL shortcut sites: 1
parsed pathname helper definitions: 2
parsed pathname label callsites: 2
origin validation gates before endpoint match: 0
pathname equality gates before endpoint match: 0
pathname segment-boundary gates before endpoint match: 0
query-only endpoint text positive fixtures: 2
longer-path endpoint text positive fixtures: 2
nonmatching bypass fixtures: 2
Request-object fetch positive fixtures: 1
URL-object XHR positive fixtures: 1
runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work requests now bypass endpoint body work before clone/parse/stringify
not completion proof for JSON-first endpoint match authority
```

## Endpoint Match Inventory

| Surface | Source anchor | Current match behavior | Current bypass behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Fetch endpoint list | `js/seed.js:667` through `js/seed.js:673` | Five endpoint substrings are stored in local `fetchEndpoints`. | No shared endpoint authority is consulted. | One parsed endpoint manifest shared with XHR and comment shortcuts. |
| Fetch URL extraction | `js/seed.js:686` and `js/seed.js:687` | `Request` instances use `.url`; other resources are stringified into `urlStr`. | No origin, hostname, pathname, or segment-boundary validation happens before matching. | URL-kind fixtures for string, `Request`, `URL`, relative URL, malformed URL, query-only text, and longer path text. |
| Fetch endpoint gate | `js/seed.js:689` | `fetchEndpoints.some(endpoint => urlStr.includes(endpoint))` decides interception. | Nonmatching URLs call original fetch without clone, parse, stringify, or engine work. | Parsed URL policy that distinguishes exact endpoint path from query value and longer path prefix. |
| Fetch no-work gate | `js/seed.js:693` and `js/seed.js:694` | The parsed label is built, then `shouldBypassYouTubeiNetworkResponse(dataName)` exits before body work when settings are missing, disabled, or have no active JSON work. | Raw substring endpoint false positives still enter this check when JSON work is active. | Endpoint admission and active-work proof should share one decision record. |
| Fetch comment shortcut | `js/seed.js:703` | `urlStr.includes('/youtubei/v1/next')` applies the comment-continuation shortcut to the raw URL string. | Non-comment bodies fall through to normal processing after the raw shortcut check. | Comment endpoint decision tied to parsed endpoint, continuation shape, route, and sibling preservation. |
| Fetch parsed data label | `js/seed.js:675` through `js/seed.js:681` and `js/seed.js:740` | `getPathname(urlStr)` produces the `fetch:<pathname>` label after the raw endpoint gate has already matched. | The parsed pathname label does not prevent interception when JSON work exists. | Label and decision must share the same parsed endpoint object. |
| XHR endpoint list | `js/seed.js:762` through `js/seed.js:768` | Five endpoint substrings are stored in local `xhrEndpoints`, matching the fetch list. | No shared endpoint authority is consulted. | Fetch/XHR parity proof for every endpoint token and endpoint expansion. |
| XHR open gate | `js/seed.js:924` through `js/seed.js:932` | `open()` stores the raw URL value and marks `__filtertube_shouldProcessXhr` with substring matching only when the no-work bypass allows work. | Active JSON work can still mark query-only or longer-path endpoint text. | Parsed URL policy before per-XHR lifecycle marks. |
| XHR send gate | `js/seed.js:940` through `js/seed.js:948` | `send()` repeats substring matching and can re-mark a request for processing only when the no-work bypass allows work. | Active JSON work can still re-mark query-only or longer-path endpoint text. | One endpoint decision record reused across open/send/hook installation. |
| XHR parsed data label | `js/seed.js:779` through `js/seed.js:785` and `js/seed.js:851` | `getPathname(urlStr)` produces the `xhr:<pathname>` label only after late processing begins. | The parsed pathname label does not prevent earlier mark/hook work when JSON work exists. | Label and processing permission must share the same parsed endpoint object. |

## Source-Derived Rows

```text
fetchEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
xhrEndpoints(5): /youtubei/v1/search,/youtubei/v1/guide,/youtubei/v1/browse,/youtubei/v1/next,/youtubei/v1/player
rawSubstringMatchSites(4): fetchEndpointGate,fetchCommentNextShortcut,xhrOpenGate,xhrSendGate
parsedPathnameLabelSites(2): fetchProcessLabel,xhrProcessLabel
preMatchParsedUrlPolicy(0): origin,hostname,pathnameEquality,segmentBoundary
runtimePositiveEndpointFalsePositiveFixtures(4): fetchQueryOnly,fetchLongerPath,xhrQueryOnly,xhrLongerPath
runtimeNegativeBypassFixtures(2): fetchNonMatching,xhrNonMatching
nonStringUrlValueFixtures(2): fetchRequestObject,xhrUrlObject
```

Anchor map:

```text
fetchEndpointListStart: `js/seed.js:667`
fetchPlayerEndpoint: `js/seed.js:672`
fetchEndpointListEnd: `js/seed.js:673`
fetchGetPathnameStart: `js/seed.js:675`
fetchRequestUrlExtraction: `js/seed.js:686`
fetchUrlStringification: `js/seed.js:687`
fetchEndpointGate: `js/seed.js:689`
fetchParsedDataName: `js/seed.js:693`
fetchNoWorkBypass: `js/seed.js:694`
fetchRawNextShortcut: `js/seed.js:703`
fetchEngineCallsite: `js/seed.js:740`
xhrEndpointListStart: `js/seed.js:762`
xhrEndpointListEnd: `js/seed.js:768`
xhrGetPathnameStart: `js/seed.js:779`
xhrProcessWithEngine: `js/seed.js:851`
xhrOpenPatch: `js/seed.js:924`
xhrOpenEndpointMark: `js/seed.js:929`
xhrOpenNoWorkBypass: `js/seed.js:932`
xhrSendPatch: `js/seed.js:940`
xhrSendEndpointMark: `js/seed.js:947`
xhrSendNoWorkBypass: `js/seed.js:948`
```

## Current Endpoint Match Risks

- Endpoint text in a query value currently enters fetch processing when active
  JSON work exists.
- Endpoint text at the start of a longer pathname currently enters fetch
  processing when active JSON work exists.
- XHR `open()` and `send()` both use raw substring matching, so query-only and
  longer-path endpoint text can mark a request for later body processing when
  the no-work bypass allows JSON work.
- The fetch comment shortcut uses raw URL matching rather than a parsed endpoint
  decision, so comment-continuation handling does not share the same path
  classifier as the normal data label.
- The parsed pathname helper is useful for labels, but it currently runs after
  the raw match has already admitted the request.
- The fetch and XHR endpoint arrays are duplicated local lists; adding or
  removing an endpoint has no shared parity gate.
- Missing settings, disabled settings, and empty active JSON work now bypass
  endpoint body work before clone/parse/stringify and before XHR lifecycle hook
  installation.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
fetch nonmatching URL: no response.clone().json, no JSON.stringify, no processData
fetch query-only endpoint text with active JSON work: intercepted, parsed label is fetch:/log
fetch longer-path endpoint text with active JSON work: intercepted, parsed label is fetch:/youtubei/v1/searchExtra
fetch Request object: intercepted from Request.url, parsed label is fetch:/youtubei/v1/player
XHR nonmatching URL: __filtertube_shouldProcessXhr is false
XHR query-only endpoint text with active JSON work: __filtertube_shouldProcessXhr is true
XHR longer-path endpoint text with active JSON work: __filtertube_shouldProcessXhr is true
XHR URL object: stringified and marked when it contains an endpoint token
XHR send(): repeats the raw substring gate and can restore the process mark
missing settings, disabled settings, and no active JSON work: endpoint requests bypass body work before clone/parse/stringify
```

## Future Proof Shape

A future endpoint match policy should contain at least:

```text
transport
sourceOwner
rawUrl
urlValueKind
parsedOrigin
parsedHostname
parsedPathname
parsedSearch
endpointToken
endpointFamily
endpointMatchKind
endpointBoundary
queryContainsEndpointToken
longerPathContainsEndpointToken
requestObjectPolicy
urlObjectPolicy
relativeUrlPolicy
malformedUrlPolicy
route
surface
profileType
listMode
settingsRevision
activeRuleState
parseAllowed
mutationAllowed
commentShortcutAllowed
xhrHookAllowed
passThroughReason
positiveExactEndpointFixture
negativeQueryOnlyFixture
negativeLongerPathFixture
negativeOriginFixture
negativeMalformedUrlFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstEndpointMatchPolicy
jsonFirstEndpointParserContract
jsonFirstParsedEndpointDecision
jsonFirstRawUrlMatchReport
jsonFirstEndpointBoundaryFixtureProvenance
jsonFirstEndpointNegativeFixtureReport
jsonFirstFetchEndpointDecision
jsonFirstXhrEndpointDecision
jsonFirstCommentEndpointDecision
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-endpoint-match-policy-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this endpoint match policy can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
