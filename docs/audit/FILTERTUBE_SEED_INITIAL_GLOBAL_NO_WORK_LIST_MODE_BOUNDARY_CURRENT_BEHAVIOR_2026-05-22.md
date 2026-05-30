# FilterTube Seed Initial Global No-Work/List-Mode Boundary - Current Behavior - 2026-05-22

Status: current-behavior register for optimized seed global no-work gating.
Runtime behavior changed by the no-work optimization.
This is not an implementation patch, list-mode patch, settings-replay patch, or
permission to weaken keyword/channel blocklist or whitelist filtering behavior.

## Purpose

This register narrows the page-global `ytInitialData` and
`ytInitialPlayerResponse` path in `js/seed.js`. Fetch and XHR interception are
not the only JSON transport surfaces. The seed script also processes existing
page globals, installs setters for future globals, stores raw snapshots, queues
when settings are missing, and reprocesses queued or raw data on settings
updates.

The current boundary is:

```text
initial global hooks are installed before YouTube page globals can settle;
debug payload sizing is now guarded behind the seed debug flag; missing
settings queue globals and return unchanged; no-work settings clear queued and
raw seed globals without replay; raw snapshots are retained only while active
JSON work exists; empty blocklist search/home/player globals bypass engine work;
valid boolean content filters remain active JSON work; malformed truthy
content-filter values do not activate seed JSON work; and whitelist mode remains
active JSON work and still runs processData().
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_LIST_MODE_MATRIX_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_FETCH_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SEED_XHR_NO_WORK_LIST_MODE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_PAGE_GLOBAL_PATCH_AUTHORITY_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
seed initial global no-work/list-mode boundary source files: 1
establishDataHooks block lines: 110
establishDataHooks block bytes: 5772
ytInitialData hook block lines: 49
ytInitialData hook block bytes: 2576
ytInitialPlayerResponse hook block lines: 49
ytInitialPlayerResponse hook block bytes: 2841
updateSettings block lines: 98
updateSettings block bytes: 4640
processWithEngine block lines: 104
processWithEngine block bytes: 4982
shouldSkipEngineProcessing block lines: 120
shouldSkipEngineProcessing block bytes: 5578
replayPendingQueueIfReady block lines: 29
replayPendingQueueIfReady block bytes: 993
cloneData/no-work predicate block lines: 83
cloneData/no-work predicate block bytes: 2729
establishDataHooks originalYtInitialData tokens: 7
establishDataHooks originalYtInitialPlayerResponse tokens: 7
establishDataHooks Object.defineProperty tokens: 2
establishDataHooks processWithEngine tokens: 4
establishDataHooks JSON.stringify tokens: 0
establishDataHooks getDebugPayloadSize tokens: 2
establishDataHooks cloneData tokens: 8
establishDataHooks shouldCaptureRawSnapshot tokens: 4
ytInitialData hook processWithEngine tokens: 2
ytInitialData hook JSON.stringify tokens: 0
ytInitialData hook getDebugPayloadSize tokens: 1
ytInitialData hook originalYtInitialData = processed tokens: 1
ytInitialData hook window.ytInitialData = processed tokens: 1
ytInitialData hook shouldCaptureRawSnapshot tokens: 2
ytInitialData hook cloneData tokens: 4
ytInitialPlayerResponse hook processWithEngine tokens: 2
ytInitialPlayerResponse hook JSON.stringify tokens: 0
ytInitialPlayerResponse hook getDebugPayloadSize tokens: 1
ytInitialPlayerResponse hook originalYtInitialPlayerResponse = processed tokens: 1
ytInitialPlayerResponse hook window.ytInitialPlayerResponse = processed tokens: 1
ytInitialPlayerResponse hook shouldCaptureRawSnapshot tokens: 2
ytInitialPlayerResponse hook cloneData tokens: 4
updateSettings pendingDataQueue tokens: 5
updateSettings processWithEngine tokens: 3
updateSettings window.ytInitialData = processed tokens: 1
updateSettings window.ytInitialPlayerResponse = processed tokens: 1
updateSettings ytInitialData-reprocess tokens: 1
updateSettings ytInitialPlayerResponse-reprocess tokens: 1
updateSettings settingsRevision tokens: 0
updateSettings dirtyKeys tokens: 0
updateSettings hasNetworkJsonWork tokens: 1
updateSettings rawYtInitialData = null tokens: 2
processWithEngine cachedSettings.enabled === false tokens: 1
processWithEngine shouldSkipEngineProcessing tokens: 1
processWithEngine harvestOnly tokens: 4
processWithEngine window.FilterTubeEngine.processData tokens: 2
processWithEngine hasNetworkJsonWork tokens: 1
processWithEngine queueForLater tokens: 4
shouldSkipEngineProcessing dataName === 'ytInitialData' tokens: 1
shouldSkipEngineProcessing fetch browse tokens: 2
shouldSkipEngineProcessing fetch next tokens: 1
shouldSkipEngineProcessing fetch search tokens: 1
shouldSkipEngineProcessing mode-not-whitelist tokens: 2
shouldSkipEngineProcessing isBrowseFetch tokens: 2
runtime seed initial global no-work/list-mode fixtures: 10
runtime behavior changed: yes - no-work seed globals bypass debug stringify, engine work, raw retention, queue replay, and malformed truthy content-filter admission
not completion proof for seed initial global no-work authority
```

## Current Decision Matrix

| Boundary | Current behavior | Missing proof gate |
| --- | --- | --- |
| Future `ytInitialData` setter | Calls `getDebugPayloadSize(newValue)` only inside `isSeedDebugEnabled()`, then calls `processWithEngine()`. | Payload-size/debug logging budget before setter work. |
| Disabled setter | Disabled settings skip debug-size stringify, raw snapshot capture, `harvestOnly()`, and `processData()`, while retaining last global data for UI state. | Disabled no-work policy that separates setter bookkeeping from engine work. |
| Missing settings setter | Missing settings queues the global and returns original data without debug-size stringify when debug is off. | Startup queue admission, cap, age, response-effect, and active-rule policy. |
| Queue assignment | `updateSettings()` processes queued globals, then assigns `window.ytInitialData = processed`, which invokes the installed setter and can process again. | Setter assignment guard and one-pass replay policy. |
| No-work settings update | Empty blocklist/disabled settings clear pending seed queue and raw snapshots without replay. | Startup queue admission policy for later active settings. |
| Raw snapshot reprocess | Existing raw globals can be cloned and reprocessed on active-work settings update without revision or dirty-key checks. | Settings revision and dirty-key report. |
| Search empty blocklist | Future `ytInitialData` with search layout bypasses `harvestOnly()` and `processData()` when no active JSON work exists. | Search initial-global no-work budget and no-mutation proof. |
| Search whitelist | The same search payload runs `processData()` in whitelist mode. | Whitelist initial-global fail-closed/mutation policy. |
| Boolean content filter | The same search payload runs `processData()` when a content filter has `enabled === true`. | Content-filter JSON-first effect parity beyond duration. |
| Malformed truthy content filter | The same search payload bypasses `harvestOnly()` and `processData()` when content-filter `enabled` is a truthy string. | Settings schema validation and migration authority. |
| Home initial global | Home `ytInitialData` with empty blocklist bypasses engine work. | Home route transport parity policy. |
| Player initial global | `ytInitialPlayerResponse` with empty blocklist bypasses engine work. | Player metadata-only policy and side-effect budget. |

## Runtime Fixture Summary

The search empty-blocklist setter fixture proves future `ytInitialData` now
bypasses debug-size stringify, `harvestOnly()`, and `processData()` when no
active JSON work exists.

The search whitelist setter fixture proves the same search payload switches to
`processData()` in whitelist mode.

The boolean content-filter setter fixture proves valid `enabled === true`
content-filter settings still activate initial-global JSON engine work.

The malformed truthy content-filter setter fixture proves string/number-style
truthy content-filter settings do not activate initial-global JSON work.

The disabled setter fixture proves disabled mode skips debug-size stringify and
engine work.

The missing-settings queue fixture proves pre-settings `ytInitialData` is
queued, then empty blocklist `updateSettings()` clears the queued item without
replay.

The home initial-global fixture proves empty-blocklist home `ytInitialData`
bypasses engine work.

The player initial-global fixture proves `ytInitialPlayerResponse` bypasses
engine work with empty blocklist.

The existing-global fixture proves a pre-existing `ytInitialData` can be queued
before settings and then cleared by empty blocklist settings without replay.

## Risks Identified

- Reliability: existing globals, future setters, pending queue replay, raw
  snapshot replay, and settings updates share mutable page-global assignment
  paths without one decision report.
- False-hide/leak: whitelist initial-global paths still mutate JSON by design,
  while empty blocklist search/home/player globals now pass through without
  engine work.
- Performance: the worst empty-blocklist seed-global costs are now removed, but
  missing-settings setters can still queue payloads and active-work settings
  updates can reprocess queued/raw globals more than once.
- Code burden: fetch, XHR, initial globals, and settings replay all call
  `processWithEngine()` but have different no-work timing and replay effects.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstSeedInitialGlobalNoWorkListModeContract
jsonFirstSeedInitialGlobalWorkDecisionReport
jsonFirstSeedInitialGlobalDebugSizeBudget
jsonFirstSeedInitialGlobalQueueReplayPolicy
jsonFirstSeedInitialGlobalRawSnapshotPolicy
jsonFirstSeedInitialGlobalSetterAssignmentGuard
jsonFirstSeedInitialGlobalHomePolicy
jsonFirstSeedInitialPlayerResponsePolicy
jsonFirstSeedInitialGlobalFixtureProvenance
jsonFirstSeedInitialGlobalMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/seed-initial-global-no-work-list-mode-boundary-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first
optimization gap into current initial-global no-work, list-mode, disabled,
missing-settings, queue replay, raw snapshot replay, player-response, and
home/search route behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this list/settings-mode surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, settings-mode behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
