# FilterTube Endpoint And Authority Inventory - 2026-05-17

This artifact records current endpoint interception and settings-authority behavior. It is proof material for the runtime disease audit. It does not approve a behavior change.

## Seed Endpoint Behavior

Current intercepted YouTube JSON endpoints:

```text
/youtubei/v1/search
/youtubei/v1/guide
/youtubei/v1/browse
/youtubei/v1/next
/youtubei/v1/player
```

Proof:

- Fetch endpoint list: `js/seed.js:607`
- Fetch clone/JSON parse before processing: `js/seed.js:633`
- Fetch response replacement with `JSON.stringify(processed)`: `js/seed.js:674`
- XHR endpoint list: `js/seed.js:697`
- XHR text JSON parse: `js/seed.js:765`
- XHR response replacement fields: `js/seed.js:779`

Current skip behavior:

| Surface | Current skip condition | Disease risk |
| --- | --- | --- |
| Search results | Search path can skip mutation in blocklist mode with no active JSON/content rules. | Skip occurs inside `processWithEngine`, after fetch JSON parse. It still performs harvest-only when engine exists. |
| Channel pages | Channel indicators plus channel data names can skip mutation in blocklist mode with no active JSON/content rules. | Same parse-before-skip and harvest-only cost. |
| Desktop home browse | `/` and not mobile can skip mutation when no content filters, not whitelist, and no active JSON rules. | Mobile home is excluded by `!isMobileInterface`; desktop still pays parse before skip. |
| `/next` | Intercepted. Only channel-page special case may skip. | Watch, comments, rails, and end-screen payloads can run full processing unless separately handled. |
| `/player` | Intercepted. No endpoint-level metadata-only gate. | Player payloads can be parsed, harvested, recursively walked, and rewritten even when the intended policy is metadata-only. |
| `/guide` | Intercepted. No specific no-rule skip in the current seed gate. | Guide payloads can pay parse/process cost outside explicit enforcement need. |

Runnable endpoint proofs now live in
`tests/runtime/seed-network-current-behavior.test.mjs`,
`tests/runtime/endpoint-decision-matrix-current-behavior.test.mjs`, and are covered by
`npm run audit:runtime`:

```text
tests 274
pass 274
fail 0
```

Fixture-backed endpoint findings added so far:

| Endpoint fixture | Current proof | Audit meaning |
| --- | --- | --- |
| Search empty blocklist | Calls `harvestOnly`, not `processData`, but still parses/stringifies. | Search has a no-mutation path, but not a no-work path. |
| Fetch endpoint text in query | A URL like `https://example.invalid/log?u=/youtubei/v1/search` is intercepted, parsed/stringified, and sent to `processData` as `fetch:/log`. | Endpoint detection is substring-based and not constrained to YouTube origin/path. |
| Fetch endpoint prefix collision | A path like `/youtubei/v1/searchExtra` is intercepted and processed. | Endpoint matching is not exact-path matching. |
| XHR endpoint text in query | XHR `.open()` marks `https://example.invalid/log?u=/youtubei/v1/search` for processing. | Fetch and XHR share the same substring authority bug. |
| Desktop home browse empty blocklist | Calls `harvestOnly`, not `processData`. | Desktop home has a partial no-mutation path. |
| Mobile home browse empty blocklist | Calls `processData`. | Mobile home is a current empty-install lag suspect. |
| Disabled settings fetch | Skips `harvestOnly` and `processData`, but still parses/stringifies. | Disabled is not a pass-through at the fetch-interception layer. |
| Player empty blocklist | Calls `processData`. | Player work is not gated by active rules. |
| Player response replacement | Returned fetch body can be the engine output. | `/player` is not metadata-only today and needs explicit safety policy before optimization. |
| Watch next empty blocklist | Calls `processData`. | Generic `/next` processing is too broad for watch/comment/playlist/channel subtypes. |
| Comment continuation hide-all | Bypasses engine and returns a synthetic end marker. | This is a useful product baseline to preserve while route-scoping `/next`. |
| Reload comment continuation hide-all | `reloadContinuationItemsCommand` comment payloads miss the synthetic end shortcut and fall into `processData`. | Comment continuation classification only covers the append shape today. |
| Guide empty blocklist | Calls `processData`. | Guide/sidebar work needs a separate active-rule contract. |
| Before settings loaded | Parses, queues, stringifies, and returns unchanged data. | Startup can pay parse/rebuild cost before settings authority exists. |
| Endpoint decision matrix | The current five-endpoint fetch/XHR list and every future decision type are documented in `docs/audit/FILTERTUBE_ENDPOINT_DECISION_MATRIX_2026-05-18.md`. | Endpoint optimizations now have one source-backed contract instead of scattered fetch/XHR assumptions. |
| Harvest-only video-channel write | Real `FilterTubeEngine.harvestOnly()` can emit `FilterTube_UpdateVideoChannelMap` from renderer bylines. | A no-mutation endpoint path can still trigger persistence and later DOM fallback work through learned identity. |
| Harvest-only video-meta write | Real `FilterTubeEngine.harvestOnly()` can emit `FilterTube_UpdateVideoMetaMap` from player metadata. | Metadata harvest is not side-effect-free and should be active-filter gated. |

## JSON Engine Behavior

Proof:

- Recursive renderer detection: `js/filter_logic.js:3408`
- Renderer removal by `_shouldBlock`: `js/filter_logic.js:3411`
- Recursive property walk after renderer checks: `js/filter_logic.js:3419`
- Harvest before enabled check: `js/filter_logic.js:3440`
- Disabled mode still harvests, then returns: `js/filter_logic.js:3447`
- Harvest-only exported entry point: `js/filter_logic.js:3482`

Current disease risk:

```text
Endpoint interception and renderer recursion are not separated by endpoint intent.

The runtime needs distinct decisions:
  pass-through with no parse,
  parse and harvest only,
  parse and mutate,
  comments-only continuation mutation,
  player metadata-only harvest,
  unsupported endpoint no-op.
```

Required endpoint contract:

| Decision | Allowed work | Required counter |
| --- | --- | --- |
| `passThrough` | No clone JSON parse, no stringify, no engine call. | endpoint, reason, bytes avoided if measurable. |
| `harvestOnly` | Parse only if active identity harvest is required; no mutation/rewrite. | endpoint, renderer count scanned, map writes. |
| `mutate` | Parse, filter, rewrite only when enforcement is active and endpoint is allowed. | endpoint, blocked count, renderer types touched, duration. |
| `commentsContinuationRewrite` | Only comment continuation rewrite. | endpoint, continuation type, reason. |
| `playerMetadataOnly` | Harvest stable player metadata only; no recursive renderer removal. | endpoint, fields harvested, mutation count must be zero. |

## DOM Fallback Predicate Divergence

Proof:

- `hasActiveDOMFallbackWork()` returns true for whitelist mode and active lists/booleans/content/category flags: `js/content/dom_fallback.js:1933`
- `applyDOMFallback()` early returns when no active work: `js/content/dom_fallback.js:2075`
- Category content scan path later requires `cat.selected.length > 0`: `js/content/dom_fallback.js:3605`

Current disease risk:

```text
Top-level fallback active state can be true for categoryFilters.enabled,
while lower category work may be false if selected is empty.

That means a settings state can wake fallback lifecycle
without useful category enforcement.
```

Required contract:

```text
compiledRuleState(settings) must normalize:
  enabled but empty category -> inactive
  enabled duration without valid threshold -> inactive or explicit broad policy
  enabled upload date without valid bound -> inactive
  empty blocklist -> inactive
  empty whitelist -> explicit fail-closed or activation prevented
```

## Background Authority Behavior

Proof:

- `getCompiledSettings()` reads broad storage state: `js/background.js:1774`
- Missing V4 profiles can be built and stored during compile: `js/background.js:1966`
- Migrations are persisted inside compile: `js/background.js:2078`
- `filterAll` channel names derive keyword rules: `js/background.js:2282`
- Derived channel keywords can be persisted back into V4 during compile: `js/background.js:2330`
- Mode-switch request computes `shouldCopyBlocklist`: `js/background.js:3302`
- Whitelist mode always merges and clears blocklist: `js/background.js:3443`
- Caller-provided settings can overwrite compiled settings cache: `js/background.js:4387`
- Storage listener invalidates/recompiles only a subset of read keys: `js/background.js:4461`

Current disease risk:

```text
Background currently plays too many roles:
  compiler,
  migrator,
  normalizer,
  derived keyword writer,
  mode transfer engine,
  cache owner,
  caller-settings broadcaster,
  learned-map receiver.

This makes false hide, stale settings, and lag hard to attribute.
```

Required authority contract:

```text
getCompiledSettings should become one of:
  pure compiler with no writes,
  or compilerWithMigrationReport that exposes writes explicitly.

Every setting mutation should flow through:
  filterTubeMutationIntent
  validation report
  storage write list
  side-effect budget
  background revision
  runtime apply payload

No UI-provided settings object should become runtime cache authority
without background recompilation and revision stamping.
```

## Current Verdict

```text
Endpoint and authority fixes must begin as instrumentation.

Do not first edit renderer rules, delete observers, or change whitelist behavior.
First add:
  endpointDecision counters,
  compiledRuleState,
  activeRuntimeReport,
  background revision source,
  mutation intent report.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this endpoint authority inventory can support
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
