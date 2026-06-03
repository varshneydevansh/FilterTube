# FilterTube JSON-First URL Normalization Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior changed for no-work gating and URL-object fetch processing.
This is not an implementation patch, optimization patch, URL parser patch, or
permission to change YouTubei filtering behavior.

## Purpose

This register isolates the URL normalization surface that JSON-first filtering
would have to own before endpoint matching and body work can become first-class
behavior. The current fetch and XHR paths normalize URLs in separate local ways:
raw string values decide admission, while parsed pathnames are produced later
only for `processWithEngine()` labels.

The current boundary is:

```text
URL parsing is label support, not endpoint admission authority.
Raw URL text can admit parsing from relative paths, cross-origin paths, hash
fragments, and malformed strings before one parsed endpoint decision exists.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_P0_ENDPOINT_POLICY_CURRENT_BEHAVIOR_2026-05-18.md`

## Current Counts

```text
source files with URL normalization surface: 1
parsed pathname helper definitions: 2
unique parsed pathname helper bodies: 1
pre-match parsed pathname callsites: 2
post-match parsed pathname label callsites: 2
parsed URL base-origin fallback sites: 2
parsed URL catch fallback split-query sites: 2
raw URL stringification sites before match: 3
Request.url extraction sites before match: 1
raw object includes shortcut sites: 1
no-work URL bypass sites before body work: 2
origin validation gates before match: 0
hostname validation gates before match: 0
hash-fragment exclusion gates before match: 0
query-value exclusion gates before match: 0
relative URL positive fixtures: 2
cross-origin exact-path positive fixtures: 2
hash-fragment endpoint-text positive fixtures: 2
malformed raw endpoint positive fixtures: 2
fetch URL-object process fixtures: 1
fetch Request-object process fixtures: 1
XHR URL-object mark fixtures: 1
runtime behavior changed: yes; missing-settings, disabled, and no-active-JSON-work requests now bypass body work before clone/parse/stringify, and active fetch URL objects now reach normal engine processing
not completion proof for JSON-first URL normalization authority
```

## URL Normalization Inventory

| Surface | Source anchor | Current behavior | Current risk | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Fetch parsed pathname helper | `js/seed.js:675` through `js/seed.js:681` | Parses `String(rawUrl || '')` against `document.location?.origin` and falls back to `fallback.split('?')[0]`. | It is not used before the fetch raw endpoint gate. | One parsed URL decision shared by admission, labels, and comments. |
| Fetch URL extraction | `js/seed.js:686` and `js/seed.js:687` | `Request` instances use `.url`; other resources are kept as the original value and then stringified into `urlStr`. | URL objects now reach normal processing when active JSON work exists, but value-kind authority is still local. | URL value-kind policy for string, `Request`, `URL`, relative, malformed, and custom objects. |
| Fetch endpoint gate | `js/seed.js:689` | Raw `urlStr.includes(endpoint)` decides whether body work starts. | Parsed origin, hostname, pathname, query, and hash are not consulted. | Parsed endpoint decision before clone/parse/stringify/engine work. |
| Fetch no-work gate | `js/seed.js:693` and `js/seed.js:694` | Builds the parsed data label and bypasses body work before clone/parse/stringify when settings are missing, disabled, or have no active JSON work. | Raw URL false positives still reach this decision when JSON work is active. | URL parsing and active-work authority should share one decision record. |
| Fetch comment shortcut | `js/seed.js:703` | Calls `urlStr.includes('/youtubei/v1/next')` on the stringified URL value. | Comment routing still uses raw string matching rather than a parsed endpoint decision. | Comment shortcut must consume the same parsed URL decision as normal fetch processing. |
| Fetch process label | `js/seed.js:740` | `getPathname(urlStr)` labels accepted data as `fetch:<pathname>`. | Labels can show `/watch` or a malformed fallback even though raw endpoint text caused admission elsewhere. | Label, endpoint token, and body-work permission must be one decision record. |
| XHR parsed pathname helper | `js/seed.js:779` through `js/seed.js:785` | Duplicates the fetch helper body. | Fetch and XHR parsing can drift because the helper is local to each setup function. | Shared parser or shared parser contract with parity fixtures. |
| XHR open URL storage | `js/seed.js:926` through `js/seed.js:932` | Stores the original URL value, stringifies it, builds a parsed data label through `getPathname(urlStr)`, and marks `__filtertube_shouldProcessXhr` by raw substring only when the no-work bypass allows work. | The parsed pathname exists before the raw endpoint mark, but it is a label/no-work input rather than endpoint authority. | Parsed endpoint decision before per-XHR marks and hook installation. |
| XHR send URL reuse | `js/seed.js:942` through `js/seed.js:948` | Re-stringifies the stored URL value, rebuilds a parsed data label through `getPathname(urlStr)`, and can restore the process mark only when the no-work bypass allows work. | Open/send can both admit query, hash, malformed, and cross-origin endpoint text when active JSON work exists. | One stored endpoint decision reused by open, send, listener wrappers, and body processing. |
| XHR process label | `js/seed.js:851` | `getPathname(urlStr)` labels accepted data as `xhr:<pathname>`. | Labeling is downstream of raw open/send admission. | Label and XHR work permission must share the same parsed endpoint object. |

## Source-Derived Rows

```text
parsedPathnameHelperDefinitions(2): fetchGetPathname,xhrGetPathname
uniqueParsedPathnameHelperBodies(1): newURLStringRawUrlWithDocumentOriginAndSplitQueryFallback
preMatchParsedPathnameCallsites(2): xhrOpenDataName,xhrSendDataName
postMatchParsedPathnameLabelCallsites(2): fetchProcessLabel,xhrProcessLabel
rawUrlStringificationSites(3): fetchResourceUrlString,xhrOpenUrlString,xhrSendUrlString
requestUrlExtractionSites(1): fetchRequestUrl
rawObjectIncludesShortcutSites(1): fetchCommentShortcut
preMatchUrlComponentPolicy(0): origin,hostname,query,hash
runtimePositiveUrlNormalizationFixtures(8): fetchRelativePath,xhrRelativePath,fetchCrossOriginExactPath,xhrCrossOriginExactPath,fetchHashFragment,xhrHashFragment,fetchMalformedRawEndpoint,xhrMalformedRawEndpoint
runtimeUrlValueKindFixtures(3): fetchUrlObjectProcess,fetchRequestObjectProcess,xhrUrlObjectMark
```

Anchor map:

```text
fetchGetPathnameStart: `js/seed.js:675`
fetchNewUrlParse: `js/seed.js:677`
fetchFallbackString: `js/seed.js:679`
fetchFallbackSplitQuery: `js/seed.js:680`
fetchRequestUrlExtraction: `js/seed.js:686`
fetchUrlStringification: `js/seed.js:687`
fetchRawEndpointGate: `js/seed.js:689`
fetchParsedDataName: `js/seed.js:693`
fetchNoWorkBypass: `js/seed.js:694`
fetchRawObjectIncludesShortcut: `js/seed.js:703`
fetchParsedLabelCallsite: `js/seed.js:740`
xhrGetPathnameStart: `js/seed.js:779`
xhrNewUrlParse: `js/seed.js:781`
xhrFallbackString: `js/seed.js:783`
xhrFallbackSplitQuery: `js/seed.js:784`
xhrParsedLabelCallsite: `js/seed.js:851`
xhrOpenUrlStorage: `js/seed.js:926`
xhrOpenUrlStringification: `js/seed.js:927`
xhrOpenParsedDataName: `js/seed.js:928`
xhrOpenRawEndpointMark: `js/seed.js:929`
xhrOpenNoWorkBypass: `js/seed.js:932`
xhrSendRawUrlRead: `js/seed.js:942`
xhrSendUrlStringification: `js/seed.js:943`
xhrSendRawEndpointMark: `js/seed.js:947`
xhrSendNoWorkBypass: `js/seed.js:948`
```

## Current URL Normalization Risks

- Relative endpoint paths currently enter fetch and XHR processing when active
  JSON work exists because the raw string contains a known endpoint token.
- Cross-origin exact endpoint paths currently enter fetch and XHR processing
  when active JSON work exists because no origin or hostname policy is checked
  before matching.
- Endpoint text in a URL hash fragment currently enters fetch and XHR matching;
  fetch labels the accepted data with the parsed pathname, such as
  `fetch:/watch`.
- Malformed raw URL text can still enter fetch and XHR matching when active
  JSON work exists and the raw string contains an endpoint token; fetch labels
  can fall back to the malformed string with the query removed.
- A fetch `URL` object now follows the stringified URL path and reaches normal
  engine processing when active JSON work exists.
- A fetch `Request` object follows a different path because `.url` is a string
  before the comment shortcut runs.
- An XHR `URL` object is stringified for marking and can set
  `__filtertube_shouldProcessXhr` true.
- Fetch and XHR duplicate the pathname helper body, so future endpoint behavior
  has no single parser contract to update.
- XHR now computes parsed pathname labels before open/send endpoint marking for
  the no-work bypass, but those labels still do not provide origin, host, query,
  hash, or segment-boundary authority.
- Missing settings, disabled settings, and empty active JSON work now bypass URL
  body work before clone/parse/stringify and before XHR lifecycle hook
  installation.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
fetch relative endpoint path with active JSON work: intercepted, parsed label is fetch:/youtubei/v1/search
XHR relative endpoint path with active JSON work: __filtertube_shouldProcessXhr is true
fetch cross-origin exact endpoint path with active JSON work: intercepted, parsed label is fetch:/youtubei/v1/search
XHR cross-origin exact endpoint path with active JSON work: __filtertube_shouldProcessXhr is true
fetch hash-fragment endpoint text with active JSON work: intercepted, parsed label is fetch:/watch
XHR hash-fragment endpoint text with active JSON work: __filtertube_shouldProcessXhr is true
fetch malformed raw endpoint text with active JSON work: intercepted, parsed label is fetch:http://[/youtubei/v1/search
XHR malformed raw endpoint text with active JSON work: __filtertube_shouldProcessXhr is true
fetch URL object: response JSON is parsed, processWithEngine runs, modified response returns
fetch Request object: Request.url is processed and labels fetch:/youtubei/v1/player
XHR URL object: URL is stringified and marks processing true
missing settings, disabled settings, and no active JSON work: URL body work is bypassed before clone/parse/stringify
```

## Future Proof Shape

A future URL normalization contract should contain at least:

```text
transport
rawInputKind
rawInputType
rawInputString
requestUrl
urlObjectString
documentBaseOrigin
parseSucceeded
parseFailureReason
parsedHref
parsedOrigin
parsedProtocol
parsedHostname
parsedPathname
parsedSearch
parsedHash
endpointToken
endpointPathMatchKind
endpointTextLocation
sameOriginAllowed
crossOriginAllowed
relativeUrlAllowed
malformedUrlAllowed
hashEndpointTextAllowed
queryEndpointTextAllowed
commentShortcutAllowed
bodyWorkAllowed
labelPathname
passThroughReason
positiveRelativeFixture
negativeCrossOriginFixture
negativeHashFragmentFixture
negativeMalformedFixture
fetchUrlObjectFixture
xhrUrlObjectFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstUrlNormalizationContract
jsonFirstEndpointUrlParserContract
jsonFirstParsedUrlDecision
jsonFirstEndpointUrlValueKind
jsonFirstFetchUrlObjectDecision
jsonFirstXhrUrlObjectDecision
jsonFirstRelativeEndpointDecision
jsonFirstMalformedUrlDecision
jsonFirstUrlFragmentQueryPolicy
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-url-normalization-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this URL normalization contract can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
