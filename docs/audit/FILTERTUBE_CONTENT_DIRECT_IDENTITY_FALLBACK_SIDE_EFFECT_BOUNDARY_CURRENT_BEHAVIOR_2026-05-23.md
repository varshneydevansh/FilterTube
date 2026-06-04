# FilterTube Content Direct Identity Fallback Side-Effect Boundary - Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, network patch,
whitelist patch, resolver patch, or permission to change filtering behavior.

## Purpose

This slice isolates page-context direct identity fallbacks that can still run
from content code when JSON, DOM, menu, or clicked-target identity is missing.
It is adjacent to the whitelist and JSON-first optimization work because those
optimizations should eventually avoid or strictly gate network and DOM rerun
work that is not needed for the active rules.

The boundary here is:

```text
content code still contains same-origin direct handle, Shorts, and watch HTML
fallbacks; some paths are user-action fallbacks, some are explicitly disabled
for post-action fanout, and DOM fallback unresolved-handle repair uses a
background-only path that can still trigger background network work.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

Related proof layers:

- `docs/audit/FILTERTUBE_NETWORK_FETCH_REASON_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_IDENTITY_RESOLVER_FANOUT_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_BACKGROUND_IDENTITY_FETCH_NETWORK_BUDGET_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_WHITELIST_DECISION_IDENTITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SINGLE_CHANNEL_RULE_MUTATION_PERSISTENCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
content direct identity fallback source files: 3
content direct identity fallback source/effect blocks: 8
handle resolver rerun timer block lines: 14
handle resolver rerun timer block bytes: 429
handle resolver fetchIdForHandle block lines: 134
handle resolver fetchIdForHandle block bytes: 4787
handle resolver direct handle branch lines: 45
handle resolver direct handle branch bytes: 1310
content bridge Shorts wrapper block lines: 69
content bridge Shorts wrapper block bytes: 2661
content bridge Shorts direct fetch block lines: 124
content bridge Shorts direct fetch block bytes: 6367
content bridge watch fetch head block lines: 44
content bridge watch fetch head block bytes: 1789
clicked-target direct fallback cluster lines: 136
clicked-target direct fallback cluster bytes: 7498
DOM fallback background-only escalation block lines: 50
DOM fallback background-only escalation block bytes: 3656
selected fetch( tokens: 4
selected same-origin credential tokens: 3
selected allowDirectFetch tokens: 4
selected fetchChannelFromShortsUrlDirect tokens: 2
selected fetchChannelFromWatchUrl tokens: 2
selected fetchIdForHandle tokens: 3
selected skipNetwork tokens: 3
selected backgroundOnly tokens: 4
selected FilterTube_UpdateChannelMap tokens: 2
selected pendingShortsFetches tokens: 4
selected pendingWatchFetches tokens: 2
selected runtime sendMessage tokens: 2
runtime direct identity fallback fixtures: 8
runtime behavior changed: no
not completion proof for content direct identity fallback authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Current risk boundary | Missing proof before optimization |
| --- | --- | --- | --- |
| Direct handle fallback | `fetchIdForHandle()` first reads `channelMap`, treats `skipNetwork && !backgroundOnly` as a no-fetch return, but otherwise can fetch `/@handle/about` and `/@handle` with `credentials: 'same-origin'`. | A handle lookup can become page-context HTML fetch, learned-map page message, and later DOM rerun. | User-action class, active-rule reason, route/profile/list-mode report, and direct-fetch gate. |
| Background-only handle repair | The `backgroundOnly` branch sends `fetchChannelDetails`, posts `FilterTube_UpdateChannelMap`, and schedules a DOM fallback rerun. | `skipNetwork` means no page-context fetch only when `backgroundOnly` is false; background repair can still do network work. | DOM repair network budget and background escalation report. |
| Shorts wrapper | `fetchChannelFromShortsUrl()` checks `videoChannelMap`, reuses `pendingShortsFetches`, asks background for `fetchShortsIdentity`, and only calls direct fetch when `allowDirectFetch === true`. | Post-action fanout can disable direct fetch, but clicked-target retry can enable it. | Caller policy that distinguishes exact clicked target from visible-sibling fanout. |
| Direct Shorts fetch | `fetchChannelFromShortsUrlDirect()` fetches `/shorts/VIDEO_ID` with same-origin credentials and parses multiple HTML/JSON locations for channel identity. | This is useful as a final clicked-target fallback but expensive and page-visible. | Direct Shorts fallback reason, max attempt, and parse budget. |
| Direct watch fetch | `fetchChannelFromWatchUrl()` skips Kids hosts, dedupes with `pendingWatchFetches`, then fetches `/watch?v=VIDEO_ID` with same-origin credentials. | Watch fallback can parse a large HTML page from content context. | Watch fallback policy and same-origin credential policy tied to user action. |
| Clicked target fallback | `handleBlockChannelClick()` tries background watch resolver before the legacy direct watch fallback, then allows direct Shorts fallback with `{ allowDirectFetch: true }` in selected retry cases. | Direct page fetches remain possible after a user click, but the proof is local to this cluster. | One clicked-target retry report with target, source tier, retry order, and allowed side effects. |
| Post-block fanout | Visible Shorts fanout calls `fetchChannelFromShortsUrl(..., { allowDirectFetch: false })`, so direct content Shorts fetch is disabled for sibling fanout. | This guardrail should be preserved by any optimization pass. | Visible-sibling fanout budget and negative direct-fetch fixture. |
| DOM unresolved repair | DOM fallback unresolved-handle repair calls `fetchIdForHandle(..., { skipNetwork: true, backgroundOnly: true })` after throttling attempts. | Passive DOM scans can still trigger background repair and rerun work. | DOM repair admission report with attempt counters, network class, and rerun budget. |

## Current Verdict

The code already has useful local guardrails: post-block Shorts fanout disables
direct content fetch, Kids watch direct fetch exits early, pending maps dedupe
some requests, and menu-open handle lookup can pass `skipNetwork`. Those
guardrails are not yet one first-class policy. Before making whitelist or JSON
filtering more aggressive, optimization should define when direct page-context
identity fallback is allowed, which caller owns it, and which DOM/storage side
effects may follow.

## Missing Authority Symbols

No product runtime source currently defines:

```text
contentDirectIdentityFallbackContract
contentDirectIdentityFetchPolicy
contentDirectIdentityUserActionReport
contentDirectIdentityCredentialPolicy
contentDirectIdentityDomRepairBudget
contentDirectIdentityDirectFetchGate
contentDirectIdentityMapWriteReport
contentDirectIdentityRerunBudget
contentDirectIdentityFallbackFixtureProvenance
contentDirectIdentityMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/content-direct-identity-fallback-side-effect-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this direct identity fallback side-effect
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, direct identity fallback changes, credential
policy changes, map-write behavior changes, or DOM rerun authority changes.
