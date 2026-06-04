# FilterTube StateManager Storage Reload / Enrichment Lifecycle Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation patch.
Runtime behavior is unchanged.

This slice pins the current `StateManager` lifecycle around non-queued settings
saves, channel-name enrichment timers, background enrichment messages, storage
change listening, debounced external reloads, theme-change fanout, and reload
notification choice. It extends runtime observer/listener/timer, settings-mode,
storage/cache, message/mutation, learned-identity, performance, reliability,
leak, code-burden, cross-feature, and implementation-change rows for
`js/state_manager.js`.

Runtime proof:

```text
tests/runtime/state-manager-storage-reload-enrichment-lifecycle-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `scheduleChannelNameEnrichment` | `js/state_manager.js:496` | 496 | 11 | 343 | `e7f5faa954cde32eeaab4a0a187dd411975f56e241834e22e0885feb72c4a172` |
| `processChannelEnrichmentQueue` | `js/state_manager.js:639` | 639 | 57 | 2,074 | `6c9cf0a07af47f993e967f3d34a7a9f82203f2510e28172acd49d2a10b6b3c13` |
| `saveSettings` | `js/state_manager.js:1009` | 1009 | 58 | 2,675 | `d8e54f713f42461db3416a5e746814c86958cd2bfa8a633bb115c1f624047523` |
| `setupStorageListener` | `js/state_manager.js:2313` | 2313 | 120 | 5,053 | `79fc928744231a416b3c7a9646aa8e5e219c72bb85ac3bb93c969d18170cb27d` |

## Selected Token Counts

```text
StateManager storage reload/enrichment lifecycle source files pinned | 1
StateManager storage reload/enrichment lifecycle source/effect blocks pinned | 4
selected setTimeout tokens | 5
selected clearTimeout tokens | 0
selected storage.onChanged listener tokens | 1
selected storage key literal rows | 39
selected saveSettings tokens | 4
selected isSaving tokens | 4
selected loadSettings tokens | 1
selected notifyListeners tokens | 4
selected broadcastSettings tokens | 1
selected channelEnrichmentQueue tokens | 5
selected channelEnrichmentScheduled tokens | 3
selected isEnriching tokens | 3
selected externalReloadTimer tokens | 4
selected externalReloadInFlight tokens | 4
selected externalReloadPending tokens | 4
selected computeChannelSignature tokens | 2
selected scheduleExternalReload tokens | 2
selected runExternalReload tokens | 3
selected resetEnrichment false tokens | 1
selected scheduleEnrichment false tokens | 1
selected notify false tokens | 1
selected channelMap tokens | 2
selected ftProfilesV4 tokens | 1
selected ftProfilesV3 tokens | 1
selected ftThemePreference tokens | 5
selected chrome.runtime.sendMessage tokens | 1
selected addFilteredChannel tokens | 1
selected MAX_CHANNEL_ENRICHMENTS_PER_SESSION tokens | 1
selected Math.random tokens | 1
selected removeListener tokens | 0
selected clear enrichment queue tokens | 1
```

## Runtime Fixtures Pinned

```text
state_manager_storage_reload_enrichment_doc_records_audit_only_boundary
state_manager_source_fingerprint_and_blocks_remain_current
state_manager_storage_reload_enrichment_token_counts_remain_current
state_manager_save_gate_current_behavior_is_pinned
state_manager_channel_enrichment_lifecycle_current_behavior_is_pinned
state_manager_storage_reload_listener_current_behavior_is_pinned
state_manager_storage_reload_enrichment_authority_symbols_are_absent_from_runtime_source
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before StateManager lifecycle or settings changes |
| --- | --- | --- | --- |
| Save queue gate | `saveSettings()` returns immediately when `isSaving` is true, calls `SettingsAPI.saveSettings()`, optionally broadcasts compiled settings, emits `save`, and clears `isSaving` in `finally`. | `saveSettings`. | Concurrent saves are dropped rather than queued, merged, or reported through a revision contract. |
| Initial enrichment schedule | `scheduleChannelNameEnrichment()` uses a local `channelEnrichmentScheduled` boolean and a zero-delay `setTimeout()` before `enqueueChannelEnrichment()`. | `scheduleChannelNameEnrichment`. | Startup/import enrichment work is timer-owned locally and has no caller-visible budget or teardown. |
| Enrichment queue processing | `processChannelEnrichmentQueue()` uses `isEnriching`, clears the queue after `MAX_CHANNEL_ENRICHMENTS_PER_SESSION`, sends `type: 'addFilteredChannel'`, then waits 5-7 seconds using `Math.random()` before processing the next item. | `processChannelEnrichmentQueue`. | Enrichment mixes timer work, background mutation messages, and network-ish identity repair without one owner budget. |
| Invalid enrichment task | Missing task/input schedules `processChannelEnrichmentQueue` again at zero delay. | `processChannelEnrichmentQueue`. | Bad queue entries still create timer work rather than a structured rejection report. |
| Storage listener install | `setupStorageListener()` installs one `chrome.storage.onChanged.addListener` when available. | `setupStorageListener`. | The listener has no removal path and no explicit page/context lifetime authority. |
| Local save suppression | The storage listener returns when `area !== 'local' || isSaving`. | `setupStorageListener`. | Local write suppression depends on the same non-queued `isSaving` flag and has no revision comparison proof. |
| Map-only early return | A single changed key of `channelMap` returns before reload scheduling. | `setupStorageListener`. | Map-only refresh behavior is split from settings reload and learned-identity cache policies. |
| Theme side effect | `ftThemePreference` changes can update `state.theme`, apply theme preference, and emit `themeChanged`. | `setupStorageListener`. | Theme change fanout happens inside the settings listener without a shared settings-mode effect report. |
| Debounced external reload | Any watched settings key schedules one 150 ms reload timer. Reload calls `loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false })`. | `setupStorageListener`. | External reload intentionally avoids enrichment reset/schedule, so profile/list changes can reload settings without the initial enrichment path. |
| Pending reload loop | While reload is in flight, another reload sets `externalReloadPending` and later schedules a zero-delay `runExternalReload()`. | `setupStorageListener`. | The pending loop has no maximum iteration, metric, or teardown report. |
| Reload notification class | Reload compares `computeChannelSignature()` before/after and emits `load` when the signature changes, otherwise `externalUpdate`. | `setupStorageListener`. | UI observers receive different events based on channel signature rather than an explicit changed-key/effect manifest. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
stateManagerStorageReloadLifecycleContract
stateManagerExternalReloadDecisionReport
stateManagerExternalReloadTimerBudget
stateManagerExternalReloadRaceReport
stateManagerExternalReloadTeardownReport
stateManagerSaveQueueContract
stateManagerChannelEnrichmentLifecycleContract
stateManagerChannelEnrichmentNetworkBudget
stateManagerChannelEnrichmentRetryPolicy
stateManagerStorageKeyParityReport
stateManagerListenerTeardownRegistry
stateManagerLifecycleMetricArtifact
```

## Current Verdict

```text
StateManager storage reload and enrichment lifecycle behavior is proof-pinned.
Settings saves, external storage reloads, and channel enrichment currently use split local timer/listener policies.
Runtime behavior remains unchanged.
```

This does not close runtime observer/listener/timer, settings-mode,
storage/cache, message/mutation, learned-identity, reliability, leak,
performance, code-burden, cross-feature, or implementation-change rows. It adds
current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
