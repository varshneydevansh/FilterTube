# FilterTube Seed Fetch No-Work/List-Mode Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register with 2026-05-26 fetch pass-through addendum.
Runtime behavior changed for no-active-JSON-work fetches.

## Purpose

This register narrows the fetch side of `js/seed.js` where endpoint admission,
body parsing, `processWithEngine()`, no-active-work skips, disabled mode, and
list-mode rules meet. It extends the list-mode matrix proof by pinning that
engine-level list-mode behavior is not enough to justify fetch optimization:
the fetch wrapper now has a no-active-JSON-work decision before cloned-response
body parsing for the empty/disabled/missing-settings path.

The current boundary is:

```text
fetch endpoint admission is still broad, but matching fetches with no active
JSON work return the native response before clone/parse/stringify; comment
continuation shortcuts still rebuild proven append-comment continuations when
hideAllComments is active; whitelist mode and real content/category/filter rules
still run processData.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
seed fetch no-work/list-mode boundary source files: 1
shouldSkipEngineProcessing block lines: 120
shouldSkipEngineProcessing block bytes: 5578
processWithEngine block lines: 104
processWithEngine block bytes: 4982
setupFetchInterception block lines: 91
setupFetchInterception block bytes: 4430
fetch endpoint list block lines: 8
fetch endpoint list block bytes: 217
fetch body-work block lines: 54
fetch body-work block bytes: 3140
fetch comment shortcut block lines: 37
fetch comment shortcut block bytes: 2269
setupXhrInterception comparison block lines: 219
setupXhrInterception comparison block bytes: 10322
setupFetchInterception fetchEndpoints tokens: 2
setupFetchInterception /youtubei/v1/search tokens: 1
setupFetchInterception /youtubei/v1/guide tokens: 1
setupFetchInterception /youtubei/v1/browse tokens: 1
setupFetchInterception /youtubei/v1/next tokens: 2
setupFetchInterception /youtubei/v1/player tokens: 1
setupFetchInterception response.clone().json tokens: 1
setupFetchInterception JSON.stringify tokens: 2
setupFetchInterception processWithEngine tokens: 1
setupFetchInterception hideAllComments tokens: 3
setupFetchInterception new Response tokens: 2
setupFetchInterception response.ok tokens: 1
setupFetchInterception shouldBypassYouTubeiNetworkResponse tokens: 1
processWithEngine cachedSettings.enabled === false tokens: 1
processWithEngine shouldSkipEngineProcessing tokens: 1
processWithEngine harvestOnly tokens: 4
processWithEngine queueForLater tokens: 4
processWithEngine pendingDataQueue tokens: 4
processWithEngine window.FilterTubeEngine.processData tokens: 2
processWithEngine return data tokens: 6
processWithEngine stashNetworkSnapshot tokens: 3
processWithEngine hasNetworkJsonWork tokens: 1
shouldSkipEngineProcessing mode-not-whitelist tokens: 2
shouldSkipEngineProcessing hasEnabledContentFilters tokens: 1
shouldSkipEngineProcessing hasActiveJsonFilterRules tokens: 1
shouldSkipEngineProcessing activeContentFilters tokens: 4
shouldSkipEngineProcessing activeJsonFilterRules tokens: 4
shouldSkipEngineProcessing categoryFilters enabled token: 0
shouldSkipEngineProcessing isSearchResultsPath tokens: 2
shouldSkipEngineProcessing isChannelPath tokens: 2
shouldSkipEngineProcessing isBrowseFetch tokens: 2
shouldSkipEngineProcessing isOnHomeFeed tokens: 2
shouldSkipEngineProcessing isMobileInterface tokens: 1
runtime seed fetch no-work/list-mode fixtures: 10
runtime behavior changed: yes for no-active-JSON-work fetch pass-through and strict content-filter admission
not completion proof for all seed fetch no-work authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Endpoint admission | Fetch endpoint admission remains broad, but no-active-JSON-work fetches bypass body work before clone/parse. | Parsed endpoint family contract with query, hash, origin, and longer-path policy. |
| Body work before decision | No-active-JSON-work responses bypass `response.clone().json()`; active JSON work still parses before mutation/comment handling. | Parse/stringify no-work budget with per-endpoint positive and negative fixtures. |
| Disabled fetch settings | Disabled settings now skip `harvestOnly()`, `processData()`, cloned-response parse, and replacement-body stringify. | Keep disabled transport pass-through separate from direct engine disabled harvest behavior. |
| Missing settings | A matching endpoint before settings are loaded now passes through without queue replay or rebuilt response body. | Queue provenance and response identity policy for startup. |
| Search empty blocklist | Search results with empty blocklist now pass through without harvest-only, parse, or stringify. | Harvest-only budget proving any future map-learning need and no mutation. |
| Whitelist search | Search results in whitelist mode run `processData()` instead of the empty-blocklist harvest-only path. | Whitelist endpoint budget with fail-closed and no-work proof. |
| Boolean content filter | `contentFilters.duration.enabled === true` is active seed JSON work and still parses before `processData()`. | Field semantics contract for duration/upload-date/uppercase before JSON-first promotion. |
| Malformed truthy content filter | String/number truthy `contentFilters.*.enabled` values are no longer active seed JSON work. | Shared schema authority for import/sync/state ingress remains missing. |
| Desktop home empty blocklist | Desktop home browse continuation with empty blocklist now passes through. | Desktop home route/surface no-work policy. |
| Mobile home empty blocklist | Mobile home browse continuation with empty blocklist now shares desktop pass-through behavior. | Mobile/desktop parity decision with route and UI surface proof. |
| Empty selected category | `categoryFilters.enabled === true` with empty `selected` is no active JSON work for search/home fetches. | Selected-category value policy and category metadata budget. |
| Comment continuation shortcut | Append comment continuations with `hideAllComments` return a synthetic end marker without engine calls; reload continuations miss that shortcut. | Comment continuation shape policy and endpoint parity proof. |

## Runtime Fixture Summary

The search empty-blocklist fixture proves `/results` search fetches now pass
through without cloned-response parse, stringify, `harvestOnly()`, or
`processData()`.

The search whitelist fixture proves the same endpoint switches to
`processData()` in whitelist mode.

The boolean content-filter fixture proves a valid `enabled === true` duration
filter still activates seed JSON body work.

The malformed truthy content-filter fixture proves string/number truthy
`enabled` values do not activate seed JSON body work.

The disabled fixture proves disabled settings skip `harvestOnly()`,
`processData()`, clone/JSON parse, and stringify body work.

The missing-settings fixture proves matching fetches before settings are loaded
return the native payload path with no engine call or rebuilt response.

The desktop/mobile home fixture pair proves both desktop and mobile home browse
with empty blocklist use the no-active-work pass-through path.

The empty-category fixture proves `categoryFilters.enabled === true` with an
empty selected array does not trigger JSON work on search.

The comment continuation fixture proves append comment continuations with
`hideAllComments` bypass the engine and emit a synthetic end marker.

The reload comment fixture proves reload comment continuations with
`hideAllComments` miss the synthetic end shortcut and run `processData()`.

## Risks Identified

- Reliability: fetch body work, comment shortcuts, and engine mutation are
  separate phases without one decision report.
- False-hide/leak: whitelist mode and mobile home choose mutation paths where
  empty blocklist desktop/search paths only harvest.
- Performance: disabled and missing-settings fetches are fixed on the seed
  fetch path; remaining work is proving parity across XHR, page globals, and DOM
  lifecycle owners.
- Code burden: endpoint admission, comment shortcuts, route-specific no-work,
  content/category flags, and list-mode rules are split across fetch wrapper,
  `processWithEngine()`, and `shouldSkipEngineProcessing()`.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstSeedFetchNoWorkListModeContract
jsonFirstSeedFetchWorkDecisionReport
jsonFirstSeedFetchParseStringifyBudget
jsonFirstSeedFetchDisabledPassThroughPolicy
jsonFirstSeedFetchMissingSettingsQueueReport
jsonFirstSeedFetchHarvestOnlyPolicy
jsonFirstSeedFetchMobileHomePolicy
jsonFirstSeedFetchCategorySelectedPolicy
jsonFirstSeedFetchCommentContinuationPolicy
jsonFirstSeedFetchNoWorkFixtureProvenance
```

## Verification

Current proof command:

```bash
node --test tests/runtime/seed-fetch-no-work-list-mode-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
optimization gap into current fetch transport no-work, list-mode, disabled,
missing-settings, harvest-only, comment shortcut, and mobile/desktop route
behavior only.

## First Optimization Metric Collector No-Work Preservation Matrix Addendum

First optimization metric collector no-work preservation matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs`
maps the fetch no-work/list-mode boundary to collector preservation rows. The
addendum pins 12 collector no-work preservation rows, 12 collector insertion
rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter
groups covered, 0 runtime collector no-work proofs approved, and 0
implementation-ready collector no-work rows. It does not approve a fetch
collector until disabled, missing-settings, empty, no-rule, and pass-through
body work are preserved.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this list/settings-mode surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, settings-mode behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
