# FilterTube Seed XHR No-Work/List-Mode Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register with 2026-05-26 XHR pass-through addendum.
Runtime behavior changed for no-active-JSON-work XHRs.

## Purpose

This register narrows the XHR side of `js/seed.js` where endpoint substring
marking, ready/load hook installation, page listener wrapping, JSON body
parsing, `processWithEngine()`, harvest-only skips, disabled mode, and
list-mode rules meet. It complements the fetch no-work/list-mode proof by
pinning that no-active-JSON-work XHRs now avoid mark/hook/body processing
before ready/load listeners and response overrides are installed.

The current boundary is:

```text
XHR endpoint admission remains broad, but open/send now consult the no-active
JSON work decision before marking requests for response processing; matching
XHRs without active JSON work do not get internal ready/load hooks, page
listener wrapping, JSON parse, response override stringify, harvest-only, or
processData. Whitelist mode and real content/category/filter rules still run
processData.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_XHR_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_XHR_RESPONSE_OVERRIDE_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
seed XHR no-work/list-mode boundary source files: 1
shouldSkipEngineProcessing block lines: 120
shouldSkipEngineProcessing block bytes: 5578
processWithEngine block lines: 104
processWithEngine block bytes: 4982
setupXhrInterception block lines: 219
setupXhrInterception block bytes: 10322
XHR endpoint list block lines: 8
XHR endpoint list block bytes: 242
XHR processor block lines: 85
XHR processor block bytes: 4441
XHR listener wrapper block lines: 25
XHR listener wrapper block bytes: 1010
XHR prototype listener patch block lines: 26
XHR prototype listener patch block bytes: 1378
XHR open patch block lines: 16
XHR open patch block bytes: 740
XHR send patch block lines: 31
XHR send patch block bytes: 1397
setupXhrInterception xhrEndpoints tokens: 3
setupXhrInterception /youtubei/v1/search tokens: 1
setupXhrInterception /youtubei/v1/guide tokens: 1
setupXhrInterception /youtubei/v1/browse tokens: 1
setupXhrInterception /youtubei/v1/next tokens: 1
setupXhrInterception /youtubei/v1/player tokens: 1
setupXhrInterception urlStr.includes(endpoint) tokens: 2
setupXhrInterception originalAddEventListener tokens: 7
setupXhrInterception originalRemoveEventListener tokens: 4
setupXhrInterception getWrappedListener tokens: 3
setupXhrInterception ensureXhrResponseProcessed tokens: 3
setupXhrInterception __filtertube_shouldProcessXhr tokens: 6
setupXhrInterception __filtertube_responseProcessed tokens: 5
setupXhrInterception JSON.parse tokens: 1
setupXhrInterception JSON.stringify tokens: 1
setupXhrInterception processWithEngine tokens: 1
setupXhrInterception Object.defineProperty tokens: 2
setupXhrInterception readystatechange tokens: 4
setupXhrInterception load tokens: 4
setupXhrInterception shouldBypassYouTubeiNetworkResponse tokens: 3
XHR processor missing-settings guard tokens: 1
XHR processor disabled guard tokens: 1
XHR send cachedSettings tokens: 0
XHR send enabled === false tokens: 0
XHR send shouldBypassYouTubeiNetworkResponse tokens: 1
XHR open cachedSettings tokens: 0
XHR open enabled === false tokens: 0
XHR open shouldBypassYouTubeiNetworkResponse tokens: 1
processWithEngine cachedSettings.enabled === false tokens: 1
processWithEngine shouldSkipEngineProcessing tokens: 1
processWithEngine harvestOnly tokens: 4
processWithEngine window.FilterTubeEngine.processData tokens: 2
processWithEngine hasNetworkJsonWork tokens: 1
shouldSkipEngineProcessing mode-not-whitelist tokens: 2
shouldSkipEngineProcessing hasEnabledContentFilters tokens: 1
shouldSkipEngineProcessing hasActiveJsonFilterRules tokens: 1
shouldSkipEngineProcessing activeContentFilters tokens: 4
shouldSkipEngineProcessing activeJsonFilterRules tokens: 4
shouldSkipEngineProcessing categoryFilters enabled token: 0
runtime seed XHR no-work/list-mode fixtures: 8
runtime behavior changed: yes for no-active-JSON-work XHR pass-through
not completion proof for all seed XHR no-work authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Endpoint admission | XHR `open()` and `send()` still match by endpoint text, but no-active-JSON-work requests are not marked for processing. | Shared parsed endpoint policy with fetch and negative query/hash/longer-path fixture coverage. |
| Hook work before decision | No-active-JSON-work `send()` calls skip internal ready/load hook installation. | Hook budget by endpoint, route, profile, list mode, and active-rule state. |
| Page listener wrapping | No-active-JSON-work XHR page listeners are not wrapped. | Listener wrapper permission and teardown/lifetime registry. |
| Disabled XHR settings | Disabled settings skip mark, hooks, parse, stringify, `harvestOnly()`, and `processData()`. | Disabled no-work split between mark/hook and body/mutation work. |
| Missing settings | Missing settings skip mark, hooks, parse/stringify, and engine work. | Startup no-settings hook budget and queue/response-effect policy. |
| Search empty blocklist | Search XHR with empty blocklist now bypasses hook/body work. | Harvest-only mutation and stringify budget by endpoint if identity learning is reintroduced. |
| Whitelist search | Search XHR in whitelist mode runs `processData()` rather than harvest-only. | Whitelist XHR list-mode policy and fail-closed response-mutation proof. |
| Desktop home empty blocklist | Desktop home browse XHR with empty blocklist now bypasses hook/body work. | Desktop home XHR route/surface budget and transport parity decision. |
| Mobile home empty blocklist | Mobile home browse XHR with empty blocklist now shares desktop no-work behavior. | Mobile/desktop XHR parity decision. |
| Empty selected category | `categoryFilters.enabled === true` with `selected: []` no longer admits XHR `processData()`. | Category selected-value policy and metadata budget. |
| Guide/player/next empty blocklist | Guide, player, and next XHRs with empty blocklist now bypass hook/body work. | Endpoint-specific no-work and mutation budgets. |

## Runtime Fixture Summary

The search empty-blocklist fixture proves text XHR `/results` search responses
are not marked, hooked, parsed, harvested, stringified, or response-overridden
without active JSON work.

The search whitelist fixture proves the same endpoint switches to
`processData()` in whitelist mode.

The disabled/missing-settings fixture proves matching XHRs skip mark, internal
hooks, parse, stringify, `harvestOnly()`, and `processData()`.

The disabled page-listener fixture proves a disabled no-work XHR keeps the page
`load` listener unwrapped.

The desktop/mobile home fixture pair proves both desktop and mobile home browse
XHRs with empty blocklist bypass body work.

The empty-category fixture proves `categoryFilters.enabled === true` with an
empty selected array does not trigger `processData()` on search XHR.

The endpoint-family fixture proves player, next, and guide XHRs with empty
blocklist bypass body work.

## Risks Identified

- Reliability: XHR mark, hook, wrap, parse, harvest, mutate, and override phases
  are split across several nested functions without one decision report.
- False-hide/leak: whitelist and home XHR choose mutation paths where empty
  blocklist search XHR and desktop home fetch can harvest only.
- Performance: disabled, missing-settings, and empty-rule XHRs now avoid mark,
  hook, parse/stringify, and engine costs.
- Code burden: fetch and XHR share endpoint text lists and engine calls but
  differ in no-work timing, body work, listener behavior, and response mutation
  mechanics.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstSeedXhrNoWorkListModeContract
jsonFirstSeedXhrWorkDecisionReport
jsonFirstSeedXhrHookBudget
jsonFirstSeedXhrListenerWrapBudget
jsonFirstSeedXhrBodyWorkBudget
jsonFirstSeedXhrDisabledNoWorkPolicy
jsonFirstSeedXhrMissingSettingsPolicy
jsonFirstSeedXhrHarvestOnlyPolicy
jsonFirstSeedXhrMobileHomePolicy
jsonFirstSeedXhrEndpointFamilyPolicy
jsonFirstSeedXhrNoWorkFixtureProvenance
jsonFirstSeedXhrMetricArtifact
```

## First Optimization Metric Collector No-Work Preservation Matrix Addendum

First optimization metric collector no-work preservation matrix addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_NO_WORK_PRESERVATION_MATRIX_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-no-work-preservation-matrix-current-behavior.test.mjs`
maps the XHR no-work/list-mode boundary to collector preservation rows. The
addendum pins 12 collector no-work preservation rows, 12 collector insertion
rows covered, 4 P0 no-work fixture names covered, 9 required no-work counter
groups covered, 0 runtime collector no-work proofs approved, and 0
implementation-ready collector no-work rows. It does not approve an XHR
collector until endpoint marking, hook, listener wrapping, body parse,
override, and teardown budgets are preserved.

## Verification

Current proof command:

```bash
node --test tests/runtime/seed-xhr-no-work-list-mode-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
optimization gap into current XHR no-work, list-mode, disabled,
missing-settings, hook/listener, harvest-only, endpoint-family, and
mobile/desktop route behavior only.

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
