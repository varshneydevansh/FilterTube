# FilterTube Settings Refresh Cross-Context Consumer Boundary - Current Behavior

Date: 2026-05-23

Status: audit-only current-behavior boundary.

Runtime behavior changed on 2026-05-26 for the injector no-work JSON gate and isolated-world main-world runtime gate: empty/disabled blocklist settings now clear queued injector startup JSON, bypass `FilterTubeEngine.processData()` in the injector hook, and avoid loading the main-world filter/injector stack until active JSON or identity lookup work needs it. The rest of this file remains a current-behavior boundary for settings refresh, seed replay, DOM fallback, storage, and background cache behavior.

## Boundary

This slice follows settings refresh after background, UI, storage, and page-message entrances into the consumers that can perform work:

- Background cache push and storage invalidation.
- Isolated-world bridge settings pull, push, storage refresh, seed retry, and DOM fallback calls.
- Content bridge same-window refresh messages.
- Main-world injector settings merge, seed update, and queued data processing.
- Seed settings replay against queued/stored YouTube payloads.
- DOM fallback run admission and stale visibility cleanup.
- Filter logic JSON processing after settings reach the engine.

It does not prove that refreshes are safe to optimize. It records the current side-effect chain that a future whitelist or JSON-first optimization must either preserve or explicitly narrow with stronger proof.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6,320 | 285,103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/content/bridge_settings.js` | 651 | 26,462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |
| `js/content_bridge.js` | 13,571 | 601,694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/injector.js` | 3,593 | 155,830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |
| `js/seed.js` | 1,136 | 50,026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/content/dom_fallback.js` | 4,838 | 228,332 | `2129fcc16f8ad1420a6cb44905ddcd0b68d5511f3b647e2db100c0d67d492aef` |
| `js/filter_logic.js` | 3,652 | 172,174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

settings refresh cross-context consumer source files pinned: 7

## Pinned Source/Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `backgroundApplySettingsBranch` | `js/background.js:4395` | 4,395 | 28 | 1,487 | `b585d94cc410f7acd929db780840f7cb02b44bb9819b34eb34985b713485e3d6` |
| `backgroundStorageInvalidation` | `js/background.js:4484` | 4,484 | 41 | 1,464 | `e5c76f714f31a1d325385b3eaa051c0eb73e6a29ec1c69b1493cc4bb7f796de2` |
| `bridgeRuntimeListener` | `js/content/bridge_settings.js:198` | 198 | 121 | 5,684 | `ba565d7340f7b7150423e5daaa87f400769b2ce13216ed8af6509e23e6a6085c` |
| `bridgeRequestSettings` | `js/content/bridge_settings.js:353` | 353 | 115 | 5,333 | `10e99aaff431ece732d33435b7ea618f9c2333ededd839ec07d4b164b8f45227` |
| `bridgeSeedDelivery` | `js/content/bridge_settings.js:468` | 468 | 51 | 1,335 | `5c47eec7cb865ae7153bbeec5e88da23f125070fbebf33a6a6e4f2d6ecc02d1c` |
| `bridgeStorageRefresh` | `js/content/bridge_settings.js:557` | 557 | 92 | 3,395 | `6f65d55d5d8dcf9c5ad753df10d9a9f45ca5548787b949b6576bf8c310975dbf` |
| `contentBridgePageRefresh` | `js/content_bridge.js:5837` | 5,837 | 11 | 538 | `0b467a6bde5abebde690fd2073b3d2aa43422d08d635a0ffdd908ae073799710` |
| `injectorSettingsReceiver` | `js/injector.js:1924` | 1,924 | 23 | 871 | `8c0c9cdff9e9fa153eb8e0ed0528d2f7d431663b15ecebd951866870783a2bf1` |
| `injectorSeedUpdate` | `js/injector.js:3383` | 3,383 | 21 | 1,003 | `07e4027d2e306ff9046594fc68609b34074526a5a229a31057e06b3a2b97ce0d` |
| `injectorProcessQueue` | `js/injector.js:3405` | 3,405 | 60 | 2,108 | `d17bae535755636d9b51d10b3153650b7eed3ff0c0abf99ee988b9d44eb76233` |
| `seedUpdateSettings` | `js/seed.js:983` | 983 | 98 | 4,640 | `687d0cf2fcec26709486afb3b8c99cae3e79e8003e17c398ccf3cf214af06cf7` |
| `domFallbackApplyHead` | `js/content/dom_fallback.js:2035` | 2,035 | 63 | 2,188 | `c8f88f62bbd72cd9ed3c70476948919cdcb4aa7a125e26c1d684d3267dd8ee43` |
| `filterLogicGlobalProcess` | `js/filter_logic.js:3434` | 3,434 | 34 | 1,247 | `2134623c293b2cddc6177a9a1732f6ca45e4014dc4ba3872ebe375c47e96e4d2` |

settings refresh cross-context consumer source/effect blocks pinned: 13

settings refresh executable continuation rows: 3

## Selected Token Counts

Counts below are over the pinned source/effect blocks, not whole files.

| Token | Count |
| --- | ---: |
| `FilterTube_ApplySettings` | 3 |
| `FilterTube_RefreshNow` | 1 |
| `getCompiledSettings` | 5 |
| `forceRefresh` | 6 |
| `sendMessageToTabQuietly` | 1 |
| `requestSettingsFromBackground` | 7 |
| `sendSettingsToMainWorld` | 5 |
| `FilterTube_SettingsToInjector` | 2 |
| `window.postMessage` | 1 |
| `tryApplySettingsToSeed` | 4 |
| `pendingSeedSettings` | 6 |
| `filterTubeSeedReady` | 1 |
| `scheduleSeedRetry` | 3 |
| `setTimeout` | 4 |
| `applyDOMFallback` | 7 |
| `forceReprocess` | 11 |
| `MIN_STORAGE_REFRESH_INTERVAL_MS` | 2 |
| `pendingStorageRefreshTimer` | 4 |
| `storage.onChanged.addListener` | 1 |
| `processInitialDataQueue` | 2 |
| `updateSeedSettings` | 2 |
| `window.filterTube.updateSettings` | 6 |
| `pendingDataQueue` | 5 |
| `processWithEngine` | 3 |
| `ytInitialData-reprocess` | 1 |
| `ytInitialPlayerResponse-reprocess` | 1 |
| `FilterTubeEngine.processData` | 1 |
| `hasNetworkJsonWork` | 4 |
| `initialDataQueue = []` | 2 |
| `hasActiveDOMFallbackWork` | 1 |
| `clearStaleDOMFallbackVisibility` | 1 |
| `runState.pending` | 1 |

Selected missing policy/report tokens over pinned blocks:

| Token | Count |
| --- | ---: |
| `settingsRevision` | 0 |
| `dirtyKeys` | 0 |
| `activeRuleChanged` | 0 |
| `domFallbackRequired` | 0 |
| `jsonReprocessRequired` | 0 |
| `settingsRefreshConsumerReport` | 0 |
| `noOpRefreshDecision` | 0 |
| `consumerRefreshMatrix` | 0 |
| `metricArtifact` | 0 |

## Current Behavior Pinned

`backgroundApplySettingsBranch`: `FilterTube_ApplySettings` accepts a caller settings payload as an invalidation signal, chooses `main` or `kids` from `request.profile`, clears `compiledSettingsCache[targetProfile]`, recompiles with `getCompiledSettings(syntheticSender, targetProfile, true)`, queries profile-matching YouTube tabs, and sends each tab background-compiled settings. The block has no revision, dirty-key, active-rule, no-op, or consumer report.

`backgroundStorageInvalidation`: background storage changes inspect 14 invalidation keys, set both compiled settings caches to `null` when one key matches, and call `getCompiledSettings()` for main and kids URLs. This recompile path does not broadcast automatically; content scripts rely on their own storage refresh listener.

`bridgeRuntimeListener`: isolated-world `FilterTube_RefreshNow` pulls settings from background and calls `applyDOMFallback(result.settings, { forceReprocess: true })`. Same-profile `FilterTube_ApplySettings` normalizes the pushed payload, posts it to the main world, and forces DOM fallback. Cross-profile pushed settings fall back to a background pull and forced DOM fallback.

`bridgeRequestSettings`: the bridge derives `profileType` from the current host, sends `getCompiledSettings` with optional `forceRefresh`, retries with `forceRefresh: true` on resolved profile mismatch, normalizes settings for host, sends settings to the main world, and resolves the normalized settings.

`bridgeSeedDelivery`: `sendSettingsToMainWorld()` mutates `latestSettings` and `currentSettings`, posts `FilterTube_SettingsToInjector` to `window` with target `*`, tries `window.filterTube.updateSettings(settings)`, and if seed is not ready, records `pendingSeedSettings`, attaches a `filterTubeSeedReady` listener, and schedules 250 ms retries.

`bridgeStorageRefresh`: isolated-world storage refresh has a 250 ms minimum interval, calls `requestSettingsFromBackground({ forceRefresh: true })`, applies DOM fallback with caller-selected `forceReprocess`, and then refreshes runtime observers. A sole `channelMap` change returns early; sole `videoChannelMap` or `videoMetaMap` changes still refresh settings but pass `forceReprocess: false`.

`contentBridgePageRefresh`: same-window `FilterTube_InjectorToBridge_Ready` requests settings from background. Same-window `FilterTube_Refresh` requests settings and forces DOM fallback, with no sender class, route, host, revision, or no-op report in the selected block.

`injectorSettingsReceiver`: `FilterTube_SettingsToInjector` from source label `content_bridge` merges the payload into `currentSettings`, sets `settingsReceived = true`, calls `updateSeedSettings()`, clears `initialDataQueue` and returns when `hasNetworkJsonWork(currentSettings)` is false, otherwise calls `processInitialDataQueue()`.

`injectorSeedUpdate` and `injectorProcessQueue`: injector calls `window.filterTube.updateSettings(currentSettings)` immediately or once after a 300 ms retry. Queued initial data processing waits for settings and `FilterTubeEngine`; when `hasNetworkJsonWork(currentSettings)` is false it clears `initialDataQueue`, and when work is active it drains `initialDataQueue`. Engine processing now returns the original data before `window.FilterTubeEngine.processData(data, currentSettings, dataName)` unless active JSON work exists.

Executable continuation proof now pins three injector settings-consumer rows: off-window and self-source settings messages remain no-ops; valid no-work settings update seed state and clear queued injector data without engine calls; active settings update seed state, drain queued injector data, and replay both queued items through `FilterTubeEngine.processData()`.

`seedUpdateSettings`: seed caches new settings, mirrors them to `window.filterTube.settings`, clears queued/raw seed data when no active JSON work exists, processes `pendingDataQueue` when active JSON work remains, writes processed queued globals, and reprocesses stored `ytInitialData` and `ytInitialPlayerResponse` snapshots only when that surface was not already replayed from the queue.

`domFallbackApplyHead`: DOM fallback stores latest settings/options, serializes overlapping runs with `runState.running` and `runState.pending`, updates `currentSettings`, reads `forceReprocess`, and if no active fallback work exists, can clear stale DOM fallback visibility before returning.

`filterLogicGlobalProcess`: filter logic harvests channel data before checking `settings.enabled === false`, then filters through `filter(data)` with timing based on `Date.now()`. The selected block has no settings revision, dirty-key report, active-rule delta, or consumer refresh decision.

## Risk Boundary

The current refresh path can turn a settings mutation into multiple consumer effects: background cache replacement, background recompile, bridge pull or push, main-world postMessage, seed retry, queued JSON replay when active JSON work exists, stored snapshot reprocess when active JSON work exists, DOM fallback force reprocess, stale visibility cleanup, and filter logic harvest/filter work.

This matters for whitelist optimization and first-class JSON filtering because an optimization that narrows one entrance can still leave another entrance forcing DOM work or JSON replay. The current code has useful local gates, but not one audited consumer matrix saying which settings keys require which consumers, which profile owns the refresh, whether the settings are newer than the already-applied settings, or whether DOM fallback/seed replay can be skipped.

## Future Proof Still Missing

This file does not close the implementation gate. Settings refresh cross-context consumers still need:

- a consumer contract for background, bridge, injector, seed, DOM fallback, and filter logic;
- revision and dirty-key reports;
- profile/host/list-mode scope reports;
- DOM fallback and seed replay budgets;
- main-world sender/capability gates;
- no-op refresh decisions;
- route/surface JSON-reprocess decisions;
- metric artifacts and reduced fixtures that cover whitelist/blocklist, empty lists, disabled mode, Kids/main host mismatch, storage-only map changes, and page-message refresh.

No `settingsRefreshCrossContextConsumerContract`, `settingsRefreshCrossContextConsumerReport`, `settingsRefreshRevisionPolicy`, `settingsRefreshDirtyKeyReport`, `settingsRefreshDomFallbackBudget`, `settingsRefreshSeedReplayBudget`, `settingsRefreshMainWorldCapabilityGate`, `settingsRefreshProfileScopeReport`, `settingsRefreshNoOpDecisionReport`, or `settingsRefreshMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
