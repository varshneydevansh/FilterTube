# FilterTube Endpoint Decision Matrix - 2026-05-18

Status: current-behavior audit artifact. This is not an implementation patch.

This document narrows the endpoint part of the full audit into one question:
when a YouTubei response arrives, what work does FilterTube currently do, and
what future authority must decide that work before any optimization is allowed?

The current source has one fetch endpoint list and one XHR endpoint list. Both
contain the same five endpoint path fragments:

```text
/youtubei/v1/search
/youtubei/v1/guide
/youtubei/v1/browse
/youtubei/v1/next
/youtubei/v1/player
```

Source proof:

- Fetch endpoint list: `js/seed.js:607`
- Fetch substring match: `js/seed.js:629`
- Fetch clone/JSON parse: `js/seed.js:633`
- Fetch response replacement: `js/seed.js:674`
- XHR endpoint list: `js/seed.js:697`
- XHR substring match on open/send: `js/seed.js:857`, `js/seed.js:868`
- XHR response replacement fields: `js/seed.js:779`
- Generic engine call: `js/seed.js:396`
- Engine harvest-before-filter behavior: `js/filter_logic.js:3440`
- Engine disabled-mode harvest boundary: `js/filter_logic.js:3447`

## Current Fetch Decision Flow

```text
fetch(url)
  |
  +-- URL string contains any endpoint fragment?
  |       |
  |       +-- no  -> original fetch response, no JSON parse by FilterTube
  |       +-- yes -> clone response, parse JSON
  |
  +-- /youtubei/v1/next and hideAllComments append-comment shape?
  |       |
  |       +-- yes -> synthetic end-of-comments response
  |       +-- no  -> processWithEngine(jsonData, fetch:path)
  |
  +-- processWithEngine
          |
          +-- no cached settings -> queue, return unmodified data
          +-- enabled=false      -> return unmodified data
          +-- shouldSkipEngineProcessing -> harvestOnly, snapshot, return data
          +-- otherwise -> FilterTubeEngine.processData and rewrite response body
```

Important: even the no-settings, disabled, and harvest-only branches happen
after the fetch body has already been cloned and parsed. They also rebuild a
replacement response with `JSON.stringify(...)`.

## Endpoint State Matrix

| Endpoint | Empty blocklist today | Active blocklist today | Disabled today | Special behavior | Primary risk |
| --- | --- | --- | --- | --- | --- |
| `/youtubei/v1/search` | Search route can `harvestOnly`, not mutate. | Runs `processData`. | Still parse/stringify before skip. | Substring matching can intercept non-YouTube/query-only URLs. | Empty search still pays parse/harvest/rewrite cost. |
| `/youtubei/v1/browse` | Desktop home can `harvestOnly`; mobile home runs `processData`; non-home browse depends on route shape. | Runs `processData`. | Still parse/stringify before skip. | Raw category/content enabled flags wake processing even with empty predicates. | Main mobile home and blank filter states can lag. |
| `/youtubei/v1/next` | Watch next runs `processData`. | Watch recommendations can be mutated. | Still parse/stringify before skip. | Append comment continuations with `hideAllComments` return a synthetic end marker; reload comment continuations miss that shortcut. | Comments, watch rails, playlists, and end-screen share one broad endpoint. |
| `/youtubei/v1/player` | Runs `processData`. | Can rewrite player-shaped response bodies and remove renderer arrays inside them. | Still parse/stringify before skip. | No metadata-only policy exists at the seed layer. | Playback/player payloads can compete with page load and risk mutation outside recommendations. |
| `/youtubei/v1/guide` | Runs `processData`. | Runs `processData`. | Still parse/stringify before skip. | No sidebar-specific active-rule gate exists. | Guide/sidebar work happens without a proven active guide rule. |

## XHR Decision Boundary

XHR uses the same five endpoint fragments and the same substring authority, but
its no-settings and disabled behavior differs from fetch:

```text
XMLHttpRequest.open/send(url)
  |
  +-- URL string contains endpoint fragment?
          |
          +-- yes -> mark xhr.__filtertube_shouldProcessXhr = true
                    attach readystatechange/load hooks
                    when readyState=4:
                       if no cached settings -> return original response
                       if enabled=false      -> return original response
                       else parse response text/json
                            processWithEngine(...)
                            override response/responseText getters
```

Audit meaning: fetch has stronger eager parse/rewrite cost; XHR has stronger
listener/wrapper complexity and the same URL-substring overreach.

## Required Future Endpoint Policy

The future implementation should not let each endpoint infer behavior from raw
settings flags independently. It needs one decision object:

```text
endpointPolicy({
  endpoint,
  requestKind: fetch | xhr,
  surface: main | mobile | kids | music,
  route: home | search | watch | comments | guide | player | channel | unknown,
  compiledRuleState,
  payloadShape
})
  -> passThrough
   | harvestOnly
   | mutateRecommendations
   | commentsContinuationRewrite
   | playerMetadataOnly
   | unsupportedNoop
```

Minimum rules before fixes:

- `passThrough` means no clone, no JSON parse, no stringify, no engine call.
- `harvestOnly` must be opt-in and must report map writes.
- `mutateRecommendations` must be impossible for `/player`.
- `/next` must classify watch recommendations separately from comment
  continuations, playlist refreshes, and non-watch payloads.
- Raw `enabled` flags are not enough. Empty category selections, blank upload
  dates, and zero duration thresholds must compile to inactive unless there is
  an explicit product policy saying otherwise.
- Endpoint matching must use parsed URL origin and exact pathname, not substring
  search over the full URL string.

## Current Proof Fixtures

Pinned current-behavior fixtures:

- `tests/runtime/seed-network-current-behavior.test.mjs`
- `tests/runtime/endpoint-decision-matrix-current-behavior.test.mjs`

These fixtures intentionally prove current gaps. A future implementation should
flip them only after the new endpoint policy has equivalent no-leak and
no-false-hide fixtures for search, browse, next, player, guide, fetch, and XHR.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this endpoint decision matrix can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
