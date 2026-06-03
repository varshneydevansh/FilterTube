# FilterTube JSON Comment Continuation Raw URL Admission Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice.
Runtime behavior reflects the scoped no-active-JSON-work and urlStr shortcut fixes.
This is not an implementation patch, optimization patch, URL parser patch,
comment filtering patch, continuation patch, fetch patch, or settings schema
patch.

## Purpose

This slice isolates the raw-URL admission gap left open by the endpoint-match,
URL-normalization, fetch shortcut, collection-root, and command-shape proofs. It
pins that the fetch endpoint gate uses `urlStr.includes(endpoint)`, and the
comment shortcut now also calls `urlStr.includes('/youtubei/v1/next')`. This
removes the old URL-object catch-and-leak path, but it is still a raw substring
decision rather than a shared parsed endpoint decision.

Current boundary:

```text
For fetch responses with hideAllComments enabled, raw endpoint text can admit
body work and comment-continuation shortcut behavior even when the parsed
pathname is not `/youtubei/v1/next`. Query values, hash fragments, longer paths,
and cross-origin exact paths can trigger the synthetic end-marker shortcut when
the response body has an endpoint-root append classic comment. Request objects
and URL objects now follow the stringified `urlStr` shortcut path. When no
active JSON work exists, raw endpoint text can still pass the raw gate but then
bypass body work before clone/parse/process/stringify.
```

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_COMMENT_CONTINUATION_SHORTCUT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COLLECTION_ROOT_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_COMMENT_CONTINUATION_COMMAND_SHAPE_PARITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`

## Current Counts

```text
JSON comment continuation raw-URL admission source files: 1
JSON comment continuation raw-URL admission source/effect blocks: 4
seed fetch interception lines: 91
seed fetch interception bytes: 4426
seed fetch admission gate lines: 13
seed fetch admission gate bytes: 557
seed fetch comment shortcut lines: 38
seed fetch comment shortcut bytes: 2269
seed fetch catch fallback lines: 5
seed fetch catch fallback bytes: 247
fetch endpoint raw urlStr includes gates: 1
fetch comment shortcut raw url includes gates: 1
fetch Request.url extraction sites: 1
fetch response.clone().json sites: 1
fetch catch original-response return sites: 1
fetch shortcut processWithEngine tokens: 0
fetch normal processWithEngine tokens: 1
runtime JSON comment continuation raw-URL admission fixtures: 9
runtime behavior changed: yes
not completion proof for JSON comment continuation raw-URL admission authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Exact string next URL | Raw endpoint gate admits the URL; append comment payload triggers synthetic end marker. | Parsed comment-continuation endpoint policy. |
| Query-only endpoint text | Raw `/youtubei/v1/next` in a query value can trigger the synthetic end marker for a comment payload. | Query text exclusion policy. |
| Hash endpoint text | Raw `/youtubei/v1/next` in a hash fragment can trigger the synthetic end marker for a comment payload. | Hash text exclusion policy. |
| Longer path text | Raw `/youtubei/v1/next` as a longer path prefix can trigger the synthetic end marker for a comment payload. | Segment-boundary endpoint policy. |
| Cross-origin exact path | Raw endpoint text on another origin can trigger the same synthetic end marker. | Origin/host permission policy. |
| Request object | `Request.url` is a string, so it follows the same shortcut path. | Request object URL-kind policy. |
| URL object | `String(url)` passes the endpoint gate and the `urlStr` shortcut now returns the synthetic end marker for comment payloads instead of throwing and leaking the original body. | URL object shortcut permission and parsed endpoint policy. |
| Query-only with shortcut disabled | Raw gate still admits the URL, but no-active-JSON-work settings now bypass before clone/parse/process/stringify. | Admission and label must share one parsed endpoint object before future body work is expanded. |
| Nonmatching URL | Nonmatching raw URL avoids clone, parse, engine work, and synthetic shortcut. | Negative fixture policy for pass-through. |

## Source Anchors

```text
fetchUrlExtraction: `js/seed.js:686`
fetchUrlStringification: `js/seed.js:687`
fetchEndpointRawGate: `js/seed.js:689`
fetchOriginalResponseBypass: `js/seed.js:690`
fetchDataName: `js/seed.js:693`
fetchNoWorkBypass: `js/seed.js:694`
fetchJsonDecode: `js/seed.js:701`
fetchRawNextShortcut: `js/seed.js:703`
fetchCommentDetector: `js/seed.js:705`
fetchSyntheticResponse: `js/seed.js:731`
fetchNormalProcessWithEngine: `js/seed.js:740`
fetchCatchComment: `js/seed.js:747`
fetchCatchOriginalResponse: `js/seed.js:749`
```

## Runtime Fixture Summary

The runtime guard proves:

1. Exact string `/youtubei/v1/next` with an endpoint-root append classic comment
   returns one synthetic end marker and bypasses the engine.
2. Query-only raw `/youtubei/v1/next` text on `/watch` can return the same
   synthetic end marker.
3. Hash-fragment raw `/youtubei/v1/next` text on `/watch` can return the same
   synthetic end marker.
4. Longer-path raw `/youtubei/v1/nextExtra` can return the same synthetic end
   marker.
5. Cross-origin exact `/youtubei/v1/next` can return the same synthetic end
   marker.
6. A fetch `Request` object follows the string URL path and returns the
   synthetic end marker.
7. A fetch `URL` object now follows the urlStr shortcut path and returns the
   synthetic end marker for comment payloads.
8. Query-only raw endpoint text with `hideAllComments:false` and no active JSON work bypasses
   clone, parse, process, and stringify work, then returns the original body.
9. A nonmatching raw URL does not clone, parse, process, stringify, or run the
   shortcut.

## Risks Identified

- Reliability: comment-continuation admission is not tied to a parsed endpoint
  object shared with normal fetch processing.
- False-hide/leak: raw query, hash, longer-path, and cross-origin endpoint text
  can synthesize an end marker for a comment-shaped body; URL objects now share
  that behavior instead of leaking the original comment JSON through the catch
  path.
- Performance: raw false-positive admission can still clone and parse response
  bodies when active JSON work exists, even when parsed labels later show
  non-endpoint paths. No-active-JSON-work settings now bypass that body work.
- Code burden: endpoint matching, comment shortcut admission, parsed labels, and
  URL value-kind behavior are split across local string operations.

## Future Proof Fields

```text
transport
rawInputKind
rawInputType
rawInputString
requestUrl
urlObjectString
parsedOrigin
parsedHostname
parsedPathname
parsedSearch
parsedHash
endpointToken
endpointTextLocation
endpointMatchKind
commentShortcutAllowed
syntheticEndAllowed
engineBypassAllowed
catchFallbackReason
originalResponseReturned
queryEndpointTextPolicy
hashEndpointTextPolicy
longerPathEndpointPolicy
crossOriginEndpointPolicy
requestObjectPolicy
urlObjectPolicy
passThroughReason
fixtureProvenance
metricArtifact
```

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonCommentContinuationRawUrlAdmissionContract
jsonCommentContinuationParsedEndpointDecision
jsonCommentContinuationRawUrlDecisionReport
jsonCommentContinuationQueryEndpointPolicy
jsonCommentContinuationHashEndpointPolicy
jsonCommentContinuationLongerPathPolicy
jsonCommentContinuationCrossOriginPolicy
jsonCommentContinuationUrlObjectPolicy
jsonCommentContinuationRawUrlFixtureProvenance
jsonCommentContinuationRawUrlMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-comment-continuation-raw-url-admission-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open comment
continuation URL-admission gap into current raw substring shortcut behavior,
URL value-kind divergence, query/hash/longer-path/cross-origin false-positive
admission, catch fallback leak behavior, performance, false-hide/leak, and
first-class JSON comment continuation authority risks only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this comment/continuation surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, comment filtering behavior, whitelist
behavior, metric collectors, artifact creation, native sync, release package
changes, or public claims.
