# FilterTube State Manager Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/state_manager.js` from representative UI/settings
tokens and lexical callable accounting to a source-derived method inventory.
It covers the popup/tab-view-facing state coordinator: settings hydration,
profile persistence, Main and Kids rule mutations, imported subscription
handoff, channel enrichment, UI listener broadcasts, runtime refresh messages,
theme changes, and storage-change reloads.

This is not completion proof for every inline helper, callback, storage key,
profile schema path, UI row action, render path, or cross-context message.
It is a current-behavior boundary for the `StateManager` method surface before
any settings, mutation, persistence, refresh, or listener behavior changes.

## Executable Current-Behavior Probes

The companion runtime test executes the current `js/state_manager.js` IIFE in a
VM harness without changing product code. Those probes currently pin:

- `loadSettings({ scheduleEnrichment: false })` hydrates the active V4 Main and
  Kids profile, including whitelist mode, blocklist rows, Kids strict mode, and
  `syncKidsToMain`, emits `load`, and does not create enrichment timers when
  scheduling is disabled.
- `addKeyword()` in Main whitelist mode persists V3/V4 whitelist keyword state,
  requests a Main compiled refresh, emits `keywordAdded`, and schedules the
  `keyword_added` auto-backup trigger.
- `addChannel()` in Main whitelist mode delegates to
  `addWhitelistChannelPersistent`, updates local whitelist rows after a
  successful background response, emits `channelAdded`, and requests a Main
  compiled refresh.
- `toggleChannelFilterAllCommentsByRef()` in Main blocklist mode toggles
  `filterAllComments`, recomputes channel-derived keywords, saves settings,
  broadcasts compiled Main settings, emits `channelUpdated`, and schedules the
  `comment_filter_toggled` auto-backup trigger.
- `setTheme()` normalizes unsupported theme input to `light`, applies and
  persists the preference, and emits `themeChanged`.
- The storage listener ignores map-only changes, applies `ftThemePreference`
  immediately without a reload, and schedules a 150 ms reload timer for the
  watched legacy `hideAllShorts` settings key.

## Source-Derived Summary

```text
source file: js/state_manager.js
source split lines: 2492
source wc -l: 2491
source bytes: 99780
source sha256: 509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6
broad lexical callable matches: 155
IIFE-scoped function declarations: 56
plain function declarations: 22
async function declarations: 34
accepted IIFE-scoped method rows: 56
semantic method rows promoted: 56
control-flow lexical artifacts: 90 (`if`: 87, `for`: 3)
local/helper/listener/timer callbacks held outside this IIFE method register: 9
public API entries: 30
semantic method groups: 9
runtime action strings: 6
listener event names: 20
timer sites: 6
storage-change listener sites: 1
storage-change watched keys: 39
executable current-behavior probes: 6
runtime behavior changed: no
```

## Method Group Counts

```text
channelEnrichmentQueue: 11
kidsKeywordAndChannelMutations: 8
lockBackupAndAccessHelpers: 4
mainChannelImportAndMapMutations: 11
mainKeywordMutations: 5
settingsSaveProfileBroadcast: 7
storageSyncListener: 1
themeAndListenerApi: 4
toggleContentCategoryMutations: 5
```

## Semantic Group Summary

| Semantic group | IIFE-scoped functions | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `lockBackupAndAccessHelpers` | 4 | UI lock checks, best-effort auto-backup scheduling, lazy load guard, and Kids state defaulting. | Lock/session authority, backup trigger actor, delay policy, default schema ownership, and no-rule backup budget. |
| `settingsSaveProfileBroadcast` | 7 | Loads `FilterTubeSettings` plus V3/V4 profile state, normalizes Main blocklist aliases, saves canonical Main settings, persists Main/Kids profile slices, compiles refreshes through background, and broadcasts `FilterTube_ApplySettings`. | Save queue/revision contract, V3/V4 merge authority, failed-persist rollback, compiled-cache invalidation, and caller-visible mutation report. |
| `channelEnrichmentQueue` | 11 | Detects under-specified channels, queues Main/Kids enrichment, sends `type: 'addFilteredChannel'`, caps session work, and throttles follow-up processing. | Resolver reason, profile/list-mode target, network budget, dedupe provenance, no-rule enrichment budget, and cancellation/teardown proof. |
| `kidsKeywordAndChannelMutations` | 8 | Mutates Kids keyword/channel lists, delegates Kids channel add to background, persists Kids profiles, refreshes Kids compiled settings, emits listener events, and schedules backups. | Locked-profile enforcement proof, Kids whitelist/blocklist target proof, duplicate identity policy, background sender contract, rollback proof, and backup reason authority. |
| `mainKeywordMutations` | 5 | Adds/removes/toggles Main keywords across blocklist and whitelist modes, recomputes channel-derived blocklist keywords, persists or refreshes depending on mode, emits events, and schedules backups. | Visible-row parity, duplicate/exact/comment policy, channel-derived provenance, list-mode negative fixtures, save/refresh revision proof, and stale alias cleanup. |
| `mainChannelImportAndMapMutations` | 11 | Delegates Main channel adds to background, imports subscribed channels from a selected tab, sends batch whitelist import, removes/toggles channels, writes `channelMap`, and uses tab messaging retries. | Trusted tab/source proof, import target-profile stability, channel identity confidence, batch rollback, map-write provenance, tab-message retry budget, and whitelist/blocklist parity. |
| `toggleContentCategoryMutations` | 5 | Updates boolean settings, `syncKidsToMain`, content filters, category filters, Kids filter variants, storage/profile persistence, refresh, listener events, and backup scheduling. | Key ownership, storage key parity, compiler field parity, empty enabled-filter behavior, Main/Kids route-effect fixtures, and mutation rollback proof. |
| `themeAndListenerApi` | 4 | Applies/persists theme preference, toggles theme, stores listeners, and synchronously notifies subscribers while isolating callback errors. | Theme owner, listener leak/unsubscribe proof, event payload contract, reentrant listener behavior, and UI render consistency proof. |
| `storageSyncListener` | 1 | Installs one `chrome.storage.onChanged` listener, ignores map-only changes, skips while saving, debounces external reloads, applies theme changes, and emits `load` or `externalUpdate`. | Storage revision policy, reload race proof, external-change author class, map-only refresh policy, watched-key completeness, and teardown proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 15 | `function` | `isUiLocked` | `lockBackupAndAccessHelpers` |
| 25 | `function` | `scheduleAutoBackup` | `lockBackupAndAccessHelpers` |
| 178 | `async function` | `loadSettings` | `settingsSaveProfileBroadcast` |
| 496 | `function` | `scheduleChannelNameEnrichment` | `channelEnrichmentQueue` |
| 508 | `function` | `resetEnrichmentState` | `channelEnrichmentQueue` |
| 514 | `function` | `getKidsState` | `lockBackupAndAccessHelpers` |
| 535 | `function` | `isHandleLike` | `channelEnrichmentQueue` |
| 539 | `function` | `shouldEnrichChannel` | `channelEnrichmentQueue` |
| 567 | `function` | `channelEnrichmentKey` | `channelEnrichmentQueue` |
| 573 | `function` | `computeChannelSignature` | `channelEnrichmentQueue` |
| 593 | `function` | `queueChannelForEnrichment` | `channelEnrichmentQueue` |
| 609 | `function` | `triggerChannelEnrichmentRefresh` | `channelEnrichmentQueue` |
| 614 | `async function` | `enqueueChannelEnrichment` | `channelEnrichmentQueue` |
| 631 | `function` | `maybeRefreshEnrichmentFromChannels` | `channelEnrichmentQueue` |
| 639 | `function` | `processChannelEnrichmentQueue` | `channelEnrichmentQueue` |
| 701 | `async function` | `addKidsKeyword` | `kidsKeywordAndChannelMutations` |
| 741 | `async function` | `removeKidsKeyword` | `kidsKeywordAndChannelMutations` |
| 769 | `async function` | `toggleKidsKeywordComments` | `kidsKeywordAndChannelMutations` |
| 806 | `async function` | `toggleKidsKeywordExact` | `kidsKeywordAndChannelMutations` |
| 838 | `function` | `normalizeKidsChannelInput` | `kidsKeywordAndChannelMutations` |
| 861 | `async function` | `addKidsChannel` | `kidsKeywordAndChannelMutations` |
| 939 | `async function` | `removeKidsChannel` | `kidsKeywordAndChannelMutations` |
| 968 | `async function` | `toggleKidsChannelFilterAll` | `kidsKeywordAndChannelMutations` |
| 1009 | `async function` | `saveSettings` | `settingsSaveProfileBroadcast` |
| 1071 | `async function` | `ensureLoaded` | `lockBackupAndAccessHelpers` |
| 1077 | `function` | `normalizeMainProfileAliasFields` | `settingsSaveProfileBroadcast` |
| 1099 | `async function` | `persistMainProfiles` | `settingsSaveProfileBroadcast` |
| 1170 | `async function` | `persistKidsProfiles` | `settingsSaveProfileBroadcast` |
| 1231 | `function` | `broadcastSettings` | `settingsSaveProfileBroadcast` |
| 1246 | `async function` | `requestRefresh` | `settingsSaveProfileBroadcast` |
| 1261 | `function` | `delay` | `mainChannelImportAndMapMutations` |
| 1265 | `async function` | `sendMessageToTab` | `mainChannelImportAndMapMutations` |
| 1323 | `async function` | `getActiveProfileContext` | `mainChannelImportAndMapMutations` |
| 1360 | `async function` | `addKeyword` | `mainKeywordMutations` |
| 1434 | `async function` | `toggleKeywordComments` | `mainKeywordMutations` |
| 1488 | `async function` | `removeKeyword` | `mainKeywordMutations` |
| 1533 | `async function` | `toggleKeywordExact` | `mainKeywordMutations` |
| 1577 | `function` | `recomputeKeywords` | `mainKeywordMutations` |
| 1604 | `async function` | `addChannel` | `mainChannelImportAndMapMutations` |
| 1678 | `async function` | `fetchSubscribedChannelsFromImportTab` | `mainChannelImportAndMapMutations` |
| 1733 | `async function` | `importSubscribedChannelsToWhitelist` | `mainChannelImportAndMapMutations` |
| 1848 | `async function` | `removeChannel` | `mainChannelImportAndMapMutations` |
| 1892 | `async function` | `toggleChannelFilterAll` | `mainChannelImportAndMapMutations` |
| 1925 | `async function` | `toggleChannelFilterAllCommentsByRef` | `mainChannelImportAndMapMutations` |
| 1975 | `function` | `isDuplicateChannel` | `mainChannelImportAndMapMutations` |
| 1995 | `async function` | `persistChannelMap` | `mainChannelImportAndMapMutations` |
| 2020 | `async function` | `updateSetting` | `toggleContentCategoryMutations` |
| 2137 | `async function` | `updateContentFilters` | `toggleContentCategoryMutations` |
| 2159 | `async function` | `updateKidsContentFilters` | `toggleContentCategoryMutations` |
| 2184 | `async function` | `updateCategoryFilters` | `toggleContentCategoryMutations` |
| 2212 | `async function` | `updateKidsCategoryFilters` | `toggleContentCategoryMutations` |
| 2249 | `async function` | `toggleTheme` | `themeAndListenerApi` |
| 2260 | `async function` | `setTheme` | `themeAndListenerApi` |
| 2285 | `function` | `subscribe` | `themeAndListenerApi` |
| 2296 | `function` | `notifyListeners` | `themeAndListenerApi` |
| 2313 | `function` | `setupStorageListener` | `storageSyncListener` |

## Current Public API

```text
getState, isLoaded,
loadSettings, saveSettings, ensureLoaded, getKidsState,
addKeyword, removeKeyword, toggleKeywordExact, toggleKeywordComments,
addKidsKeyword, removeKidsKeyword, toggleKidsKeywordExact, toggleKidsKeywordComments,
addChannel, importSubscribedChannelsToWhitelist, removeChannel,
toggleChannelFilterAll, toggleChannelFilterAllCommentsByRef,
addKidsChannel, removeKidsChannel, toggleKidsChannelFilterAll,
updateSetting, updateContentFilters, updateKidsContentFilters,
updateCategoryFilters, updateKidsCategoryFilters,
toggleTheme, setTheme, subscribe
```

## Runtime Actions, Events, Timers, and Storage Listener

Runtime action strings currently present in `js/state_manager.js`:

```text
FilterTube_ScheduleAutoBackup
FilterTube_KidsWhitelistChannel
FilterTube_KidsBlockChannel
FilterTube_ApplySettings
FilterTube_ImportSubscribedChannels
FilterTube_BatchImportWhitelistChannels
```

Listener event names currently emitted:

```text
load
kidsKeywordAdded
kidsKeywordRemoved
kidsKeywordUpdated
kidsChannelRemoved
kidsChannelUpdated
save
keywordAdded
keywordUpdated
keywordRemoved
channelAdded
channelRemoved
channelUpdated
settingUpdated
contentFiltersUpdated
kidsContentFiltersUpdated
categoryFiltersUpdated
kidsCategoryFiltersUpdated
themeChanged
externalUpdate
```

Runtime lifecycle primitives inside this file are limited to six `setTimeout`
sites and one `chrome.storage.onChanged.addListener` site in current source.
The storage-change listener watches 39 local storage keys, including legacy
aliases, canonical settings, profile blobs, stats, and `channelMap`.

## Current Behavior Boundaries

- `loadSettings()` merges `FilterTubeSettings.loadSettings()` with V3/V4
  profile state, normalizes Main/Kids content and category filters, resets
  enrichment state by default, emits `load`, and schedules channel enrichment.
- `saveSettings()` is non-queued: it returns immediately when `isSaving` is
  already true, persists canonical Main settings through
  `SettingsAPI.saveSettings()`, optionally broadcasts `FilterTube_ApplySettings`
  when a compiled payload is returned, and emits `save`.
- `persistMainProfiles()` and `persistKidsProfiles()` write V3 and V4 profile
  state separately and catch/log each write failure without surfacing a rollback
  result to callers.
- Main whitelist mutations generally persist profile slices and call
  `requestRefresh('main')`; Main blocklist mutations generally mutate local
  state, call `saveSettings()`, and rely on the returned compiled settings
  broadcast.
- Kids keyword/filter mutations persist Kids profile slices and request a Kids
  refresh; Kids channel add delegates persistence to background actions and
  reloads local state after success.
- `importSubscribedChannelsToWhitelist()` validates a target profile before and
  after tab scraping, then delegates batch persistence to background through
  `FilterTube_BatchImportWhitelistChannels`.
- Channel enrichment is a side-effect queue, not a passive UI detail: it sends
  `type: 'addFilteredChannel'`, limits the session to
  `MAX_CHANNEL_ENRICHMENTS_PER_SESSION`, and uses a randomized 5-7 second
  follow-up delay.
- `setupStorageListener()` skips reload while `isSaving`, ignores map-only
  changes, handles theme changes immediately, debounces settings/profile reloads
  for 150 ms, and emits either `load` or `externalUpdate` depending on channel
  signature drift.

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
ownerRuntime
callerUi
triggerControl
profileType
profileId
listModeInput
targetList
uiLockState
storageKeysTouched
profileSchemaTouched
compiledRefreshEffect
runtimeBroadcastEffect
tabMessageEffect
backupEffect
listenerEvent
channelEnrichmentEffect
themeEffect
storageReloadEffect
disabledBehavior
noRuleBehavior
emptyListBehavior
duplicatePolicy
saveQueuePolicy
rollbackFixture
positiveFixture
negativeModeFixture
negativeLockFixture
negativeSiblingFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `stateManagerMethodAuthority`
- `stateManagerMutationEffectReport`
- `stateManagerSaveQueueContract`
- `stateManagerProfileRevisionReport`
- `stateManagerRefreshBroadcastAuthority`
- `stateManagerStorageReloadBudget`
- `stateManagerListenerEventContract`
- `stateManagerChannelEnrichmentBudget`

These are future contract names. This register does not authorize settings
behavior changes, profile persistence rewrites, save queue changes, background
message hardening, channel enrichment changes, listener changes, import changes,
theme changes, storage reload changes, or list-mode mutation changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
