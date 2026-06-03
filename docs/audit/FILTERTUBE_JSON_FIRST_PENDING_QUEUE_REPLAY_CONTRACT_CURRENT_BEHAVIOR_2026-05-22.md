# FilterTube JSON-First Pending Queue Replay Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, queue patch, timer
patch, or permission to change JSON filtering behavior.

## Purpose

This register isolates the pending JSON replay queue inside `js/seed.js`. The
queue bridges early page data, matching fetch/XHR response processing, missing
settings, missing engine readiness, scheduled replay, settings updates, and
global `ytInitial*` reassignment. That makes it a cross-feature reliability and
performance boundary for JSON-first filtering.

The current boundary is:

```text
Fetch/XHR JSON now bypasses parsing before settings exist or when no active JSON
work is present. The pending replay queue remains active for paths that already
entered `processWithEngine()`, including early `ytInitial*` globals and
missing-engine/missing-harvest paths. Replay can process cloned queued data, and
global queued items can be assigned through the installed setters again. No
first-class queue admission, settings revision, response effect, timer budget,
or replay provenance contract exists yet.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_SEED_INITIAL_GLOBAL_HOOK_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_ACTIVE_WORK_PREDICATE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
source files with pending queue replay surface: 1
pending queue state declarations: 1
replay timer state declarations: 2
replay function definitions: 1
schedule function definitions: 1
scheduled replay delay ms: 250
direct processWithEngine no-settings queue push sites: 1
direct processWithEngine no-settings queue cap sites: 1
direct processWithEngine no-settings schedule sites: 1
fetch/XHR no-settings network queue sites: 0
queueForLater push sites: 1
queueForLater cap threshold: 60
queueForLater retained tail size: 40
queueForLater schedule sites: 1
engine-missing queueForLater callsites: 1
harvest-missing queueForLater callsites: 1
replay no-engine reschedule sites: 1
queued data clone sites before replay/process: 2
queued data suffixes: 2
settings update queue drain sites: 1
settings update queued global assignment branches: 2
stats queued item exposure sites: 1
fetch no-settings bypass fixtures: 1
repeated fetch no-settings bypass fixtures: 1
engine-missing cap and timer fixtures: 1
global setter queued assignment fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first pending queue replay authority
```

## Pending Queue Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Queue state | `js/seed.js:38` | Stores pending items in a closure array. | `getStats()` exposes only the current length. | Queue owner, max size, item shape, and retention policy. |
| Scheduled replay state | `js/seed.js:97` and `js/seed.js:98` | Tracks one timer id and an engine-missing retry count. | Timer remains page-lifetime; no teardown surface exists. | Timer budget, pause/teardown policy, and retry provenance. |
| Replay readiness | `js/seed.js:100` through `js/seed.js:112` | Requires settings and a `FilterTubeEngine` with `processData` or `harvestOnly`; if engine is missing it increments attempts, reschedules, and stops after attempts exceed 50. | If settings or queue entries are missing it returns without work. | Replay permission tied to settings revision, route, active rules, and engine readiness. |
| Replay processing | `js/seed.js:116` through `js/seed.js:122` | Copies and clears the queue, clones each item, and calls `processWithEngine(sourceData, `${item.name}-replay`)`. | Replay does not update the already-returned fetch/XHR response object. | Response effect report and queued network mutation provenance. |
| Replay scheduling | `js/seed.js:129` through `js/seed.js:134` | Schedules one 250 ms timer and ignores later schedule requests while the timer id is set. | No explicit teardown, no page hidden pause, no active-rule check. | Timer lifecycle owner and no-work budget. |
| `queueForLater()` helper | `js/seed.js:389` through `js/seed.js:396` | Pushes `{ data, name, timestamp, reason }`, trims to the last 40 items only after length exceeds 60, and schedules replay. | Used for missing settings after `processWithEngine()` entry, missing engine, and missing harvest-only paths. | One queue admission decision and reason taxonomy. |
| Missing settings branch | `js/seed.js:400` through `js/seed.js:403` | Calls `queueForLater('settings-missing')` and returns original data. | Fetch/XHR no-settings paths now bypass before JSON parse, so this branch primarily protects already-entered processing paths such as globals. | Startup no-settings budget and first response effect proof. |
| Missing harvest-only branch | `js/seed.js:429` | Calls `queueForLater('harvestOnly-missing')`. | Original data returns without mutation. | Harvest replay permission and map-write provenance. |
| Missing engine branch | `js/seed.js:482` | Calls `queueForLater('engine-missing')`. | Original data returns without mutation. | Engine readiness gate and replay work cap. |
| Settings update drain | `js/seed.js:1021` through `js/seed.js:1030` | Drains the queue synchronously, clones queued data, and processes names with `-queued`. | Fetch/XHR items bypassed before settings are not queued, while global queued items can still drain here. | Queue drain budget and network response effect report. |
| Queued global reassignment | `js/seed.js:1034` through `js/seed.js:1044` | Queued `ytInitialData` and `ytInitialPlayerResponse` items are assigned back through `window.ytInitial*`, invoking installed setters. | No assignment guard prevents a second setter-side `processWithEngine()` call. | Global assignment guard and setter replay provenance. |
| Queue stats | `js/seed.js:1099` through `js/seed.js:1104` | Reports `queuedItems: pendingDataQueue.length`. | No queue reason, age, cap, or replay-attempt state is exposed. | Debug/metric artifact for queue health and no-work decisions. |

## Source-Derived Rows

```text
pendingQueueState(1): pendingDataQueue
replayState(2): replayTimer,replayAttempts
replayReadinessGuards(4): noSettings,emptyQueue,noEngine,attemptLimit
replayQueueMutationSites(2): copyPendingQueue,clearPendingQueue
replayProcessingSuffixes(1): -replay
scheduleReplayDelayMs(1): 250
directProcessWithEngineNoSettingsQueuePushes(1): queueForLater(settings-missing)
directProcessWithEngineNoSettingsQueueCapSites(1): queueForLater
directProcessWithEngineNoSettingsScheduleSites(1): scheduleReplay
fetchXhrNoSettingsQueueSites(0): bypassBeforeJsonParse
queueForLaterPushes(1): queueForLater
queueForLaterCapPolicy(2): threshold60,retainLast40
queueForLaterScheduleSites(1): scheduleReplay
queueForLaterReasons(3): settings-missing,harvestOnly-missing,engine-missing
settingsDrainQueueMutationSites(2): copyPendingQueue,clearPendingQueue
settingsDrainProcessingSuffixes(1): -queued
settingsDrainGlobalAssignments(2): ytInitialData,ytInitialPlayerResponse
queueStatsFields(1): queuedItems
runtimeQueueFixtures(4): fetchNoSettingsBypass,repeatedFetchNoSettingsBypass,engineMissingCapAndTimer,globalSetterQueuedAssignment
```

Anchor map:

```text
pendingQueueDeclaration: `js/seed.js:38`
replayTimerDeclaration: `js/seed.js:97`
replayAttemptsDeclaration: `js/seed.js:98`
replayFunction: `js/seed.js:100`
replayNoSettingsGuard: `js/seed.js:102`
replayEmptyQueueGuard: `js/seed.js:103`
replayNoEngineGuard: `js/seed.js:107`
replayAttemptIncrement: `js/seed.js:108`
replayAttemptLimit: `js/seed.js:109`
replayNoEngineReschedule: `js/seed.js:110`
replayCopyQueue: `js/seed.js:116`
replayClearQueue: `js/seed.js:117`
replayCloneData: `js/seed.js:120`
replayProcessSuffix: `js/seed.js:121`
scheduleReplayFunction: `js/seed.js:129`
scheduleReplaySingleTimerGuard: `js/seed.js:130`
scheduleReplaySetTimeout: `js/seed.js:131`
scheduleReplayDelay: `js/seed.js:134`
queueForLaterDefinition: `js/seed.js:389`
queueForLaterPush: `js/seed.js:391`
queueForLaterCapThreshold: `js/seed.js:392`
queueForLaterRetainTail: `js/seed.js:393`
queueForLaterSchedule: `js/seed.js:395`
noSettingsQueueBranch: `js/seed.js:400`
noSettingsQueueReason: `js/seed.js:402`
noSettingsReturnOriginal: `js/seed.js:403`
harvestMissingQueueReason: `js/seed.js:429`
engineMissingQueueReason: `js/seed.js:482`
settingsUpdateQueueCheck: `js/seed.js:1021`
settingsUpdateCopyQueue: `js/seed.js:1024`
settingsUpdateClearQueue: `js/seed.js:1025`
settingsUpdateCloneData: `js/seed.js:1029`
settingsUpdateProcessSuffix: `js/seed.js:1030`
settingsUpdateYtInitialDataBranch: `js/seed.js:1033`
settingsUpdateAssignYtInitialData: `js/seed.js:1035`
settingsUpdateYtInitialPlayerResponseBranch: `js/seed.js:1039`
settingsUpdateAssignYtInitialPlayerResponse: `js/seed.js:1041`
statsQueuedItems: `js/seed.js:1103`
```

## Current Pending Queue Risks

- The missing-settings branch now uses `queueForLater('settings-missing')`, but
  there is still no first-class queue authority or settings revision report.
- Matching fetch/XHR responses bypass before JSON parse when settings are
  missing, so startup network traffic no longer grows `pendingDataQueue`.
- Missing-engine queueing has a cap and one scheduled timer, but replay work is
  not tied to route, active rules, response effect, page visibility, or teardown.
- The queue cap trims only after length exceeds 60 and retains 40 items, so the
  current retained count after many pushes is path-dependent.
- Settings update drains queued data synchronously and only reassigns queued
  global names; fetch/XHR data that bypassed before settings has no queued
  response mutation to replay.
- Queued `ytInitial*` assignments go back through installed setters, causing an
  additional setter-side processing pass without an assignment guard.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
matching fetch before settings: no clone JSON read, no stringify, no queuedItems increment
settings update after fetch bypass: no queued fetch item drains and no processData call runs
65 matching fetches before settings: queuedItems remains 0 and no clone JSON reads occur
65 matching fetches with engine missing after settings: queueForLater retains 44 items and schedules one timer
engine restored before scheduled replay: queued engine-missing items process with -replay suffix and drain queue
ytInitialData queued before settings: settings update processes -queued then assignment invokes setter-side ytInitialData processing
```

## Future Proof Shape

A future pending queue replay contract should contain at least:

```text
queueOwner
queueAdmissionReason
transport
dataName
endpoint
rawUrl
route
surface
profileType
listMode
settingsRevisionAtAdmission
settingsRevisionAtReplay
engineReadinessState
activeRuleState
queuedItemSize
queuedItemAgeMs
queueCapPolicy
queueOverflowDecision
timerDelayMs
timerInstallAllowed
timerTeardownPolicy
replayAllowed
replayWorkBudget
responseAlreadyReturned
responseEffectPolicy
globalAssignmentAllowed
setterReentryPolicy
passThroughReason
networkQueueFixture
engineMissingFixture
globalSetterFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstPendingQueueReplayContract
jsonFirstPendingQueueAdmissionDecision
jsonFirstPendingQueueCapPolicy
jsonFirstPendingQueueReplayBudget
jsonFirstPendingQueueResponseEffectReport
jsonFirstPendingQueueSettingsRevision
jsonFirstPendingQueueTimerPolicy
jsonFirstPendingQueueGlobalAssignmentGuard
jsonFirstPendingQueueFixtureProvenance
jsonFirstPendingQueueMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-pending-queue-replay-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this pending queue replay contract can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
