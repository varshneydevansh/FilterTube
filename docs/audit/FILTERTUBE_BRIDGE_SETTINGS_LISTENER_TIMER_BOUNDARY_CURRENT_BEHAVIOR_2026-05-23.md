# FilterTube Bridge Settings Listener/Timer Boundary - Current Behavior - 2026-05-23

Status: audit-only. Runtime behavior is unchanged. This document records the
current listener, timer, settings relay, seed relay, storage refresh, and
subscription import timeout surface in `js/content/bridge_settings.js` before any
optimization or JSON-first implementation change.

This is not an implementation patch. It does not add a lifecycle registry,
timer budget, storage refresh authority, seed retry authority, subscription
import authority, or first-class JSON filtering gate.

## Source Scope

- `js/content/bridge_settings.js`
  - Lines: 651
  - Bytes: 26462
  - sha256: `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b`

Related proof already present:

- `FILTERTUBE_BRIDGE_SETTINGS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `FILTERTUBE_SEED_SETTINGS_REPLAY_PROVENANCE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`
- `FILTERTUBE_STATE_MANAGER_REQUEST_REFRESH_FANOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `FILTERTUBE_BACKGROUND_COMPILED_CACHE_INVALIDATION_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_REQUEST_TRANSPORT_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```
bridge settings listener/timer source files: 1
waiter cluster block lines: 71
waiter cluster block bytes: 2340
subscription request block lines: 43
subscription request block bytes: 1942
subscription message listener block lines: 53
subscription message listener block bytes: 2299
runtime listener block lines: 122
runtime listener block bytes: 5701
seed relay cluster block lines: 201
seed relay cluster block bytes: 8139
storage refresh cluster block lines: 131
storage refresh cluster block bytes: 4506
storage listener registration block lines: 3
storage listener registration block bytes: 96
addEventListener tokens: 2
runtime onMessage listener tokens: 1
storage onChanged listener tokens: 1
removeEventListener tokens: 0
removeListener tokens: 0
setTimeout tokens: 6
clearTimeout tokens: 2
pendingSeedSettings tokens: 7
seedListenerAttached tokens: 3
filterTubeSeedReady tokens: 1
scheduleSeedRetry tokens: 3
pendingStorageRefreshTimer tokens: 5
MIN_STORAGE_REFRESH_INTERVAL_MS tokens: 3
handleStorageChanges tokens: 2
relevantKeys tokens: 2
forceRefresh tokens: 6
FilterTube_ApplySettings tokens: 1
FilterTube_Ping tokens: 1
FilterTube_ImportSubscribedChannels tokens: 1
waitForMainWorldImportBridgeReady tokens: 3
waitForMainWorldSubscriptionsImportReady tokens: 3
runtime bridge settings listener/timer fixtures: 6
storage admission executable continuation rows: 5
runtime behavior changed: no
not completion proof for bridge settings listener/timer authority
```

## Current Listener And Timer Surface

| Surface | Current owner | Current behavior | Risk before optimization |
| --- | --- | --- | --- |
| Main-world readiness waiters | `waitForMainWorldImportBridgeReady()` and `waitForMainWorldSubscriptionsImportReady()` | Each waiter stores a resolver in a `Set` and arms a timeout with `Math.max(250, timeoutMs)`. Ready messages resolve and clear the waiter set, but the timeout is not cleared. | Readiness can be proven by event, but timer budget and cancellation are not first-class. |
| Subscription import request timeout | `FilterTubeRequestSubscribedChannelsFromMainWorld()` | Arms one timeout per request and stores it in `pendingSubscriptionImportRequests`. Progress clears and rearms the timeout; final response clears and deletes. | Request lifecycle is local to the bridge map, without request nonce, sender capability, or metric artifact. |
| Subscription message listener | guarded `window.addEventListener('message', ...)` | A window-level message listener is attached once by `__filtertubeSubscriptionImportMessageListenerAttached`. | Listener lifetime is page-lifetime; there is no `removeEventListener` path. |
| Runtime bridge listener | guarded `browserAPI_BRIDGE.runtime.onMessage.addListener(...)` | Runtime messages handle ping, refresh, subscription import, and pushed settings. | Message effects include settings relay and DOM fallback rerun without a shared revision report. |
| Seed-ready listener | `ensureSeedReadyListener()` | A single `filterTubeSeedReady` listener is added after seed delivery fails. | The listener is never removed, and pending settings delivery has no owner report. |
| Seed retry timer | `scheduleSeedRetry()` | Every failed seed delivery schedules a 250 ms retry. Each retry schedules another while `pendingSeedSettings` remains and seed update is unavailable. Successful settings delivery also refreshes runtime observers. | The retry loop has no timer id, cap, clear path, or budget artifact. |
| Storage refresh debounce | `scheduleSettingsRefreshFromStorage()` | Relevant storage changes request settings immediately when outside a 250 ms interval, otherwise one pending timer delays the force-refresh request. Both immediate and delayed refreshes call the runtime observer refresh hook after DOM fallback. | Refresh admission, observer refresh, and force-reprocess decisions are local; there is no shared storage refresh authority. |
| Storage listener registration | final try block | `browserAPI_BRIDGE.storage.onChanged.addListener(handleStorageChanges)` registers once per script evaluation and has no remove path in source. | Listener teardown and duplicate registration policy are not centralized. |

## Runtime Fixture Results

The runtime fixture `tests/runtime/bridge-settings-listener-timer-boundary-current-behavior.test.mjs`
pins these behaviors:

1. Initial load attaches the guarded window message listener, guarded runtime
   message listener, and storage change listener.
2. Main-world readiness waiters resolve from injector ready messages while
   their timeout callbacks remain armed but settled.
3. Settings sent before seed readiness post to the main world, attach exactly
   one seed-ready listener, and can schedule multiple 250 ms retry timers from
   repeated failed sends.
4. Seed retry callbacks recursively reschedule while the seed updater is absent
   and stop once `window.filterTube.updateSettings()` succeeds.
5. Storage refresh sends a force-refresh request immediately outside the 250 ms
   interval, then coalesces another relevant storage change into one delayed
   force-refresh timer.
6. Subscription import progress clears and rearms the request timeout, while
   the final response clears the active timeout and deletes the pending request.

Storage admission executable continuation rows now also pin that a lone
`channelMap` change and a non-`local` storage change perform no runtime
settings request or timer scheduling; a `videoMetaMap`-only pending refresh
keeps DOM fallback `forceReprocess: false`; and a pending
`videoChannelMap`-only refresh followed by a keyword change reuses the existing
timer but escalates the delayed DOM fallback to `forceReprocess: true`.

## Missing First-Class Authority

The current code still lacks:

- `bridgeSettingsListenerTimerContract`
- `bridgeSettingsSeedRetryBudgetReport`
- `bridgeSettingsSeedReadyListenerOwnerReport`
- `bridgeSettingsStorageRefreshDecisionReport`
- `bridgeSettingsStorageListenerTeardownReport`
- `bridgeSettingsReadinessTimeoutBudget`
- `bridgeSettingsSubscriptionRequestLifecycleReport`
- `bridgeSettingsRuntimeMessageDecisionReport`
- `bridgeSettingsFixtureProvenance`
- `bridgeSettingsMetricArtifact`

Those missing artifacts mean this slice is current-behavior evidence only. It
does not make listener/timer behavior safe to optimize yet, and it does not
promote the bridge settings layer to a first-class JSON filter authority.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
