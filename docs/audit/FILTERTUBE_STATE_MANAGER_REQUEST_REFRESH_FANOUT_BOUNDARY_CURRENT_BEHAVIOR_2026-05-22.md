# FilterTube StateManager Request Refresh Fanout Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation
patch. Runtime behavior is unchanged.

This slice pins the current `StateManager` settings refresh fanout paths around
direct compiled-settings broadcast, background force-refresh rebound, Main/Kids
mutation callsites, content/category filter callsites, and profile/list-mode
branches. It extends settings-mode, storage/cache, message mutation,
profile/viewing-space, JSON-first readiness, performance, reliability,
false-hide/leak, code-burden, cross-feature, source/evidence, and
implementation-change rows for `js/state_manager.js`.

Runtime proof:

```text
tests/runtime/state-manager-request-refresh-fanout-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `saveSettingsBroadcastPath` | `js/state_manager.js:1009` | 1009 | 59 | 2,677 | `1aa8b8b90ff6c1b8b85166dd87c861e248da73b7097d20eee31c8612fa98df42` |
| `broadcastSettings` | `js/state_manager.js:1231` | 1231 | 11 | 309 | `6db0b7fd3ba83a0cb3d83839f62240e7116fc4773cc163fcc8cf641a0c0a32a3` |
| `requestRefresh` | `js/state_manager.js:1246` | 1246 | 15 | 486 | `8e3f649c94f43442428ed1f496fd2bb67b9032b2f97148ee5b7b08d701730c93` |
| `kidsRequestRefreshMutations` | `js/state_manager.js:701` | 701 | 302 | 11,258 | `0624a8ef43c6cf6c9aadba95859bbfa4e1a9d6c722850395c30b50b941d8bdd4` |
| `mainKeywordRequestRefreshMutations` | `js/state_manager.js:1360` | 1360 | 214 | 8,120 | `6bbc1326e9fffee88212e058cf21576c6178026a89fa2974ecb4e78e53039076` |
| `mainChannelWhitelistRequestRefresh` | `js/state_manager.js:1604` | 1604 | 74 | 3,276 | `f14d8bd84e43b3508cad69d694bd7725c19b771c8835d9f9a97b1e85c29ad87d` |
| `subscriptionImportRequestRefresh` | `js/state_manager.js:1733` | 1733 | 110 | 4,533 | `8d06c99a560288097fdbd033874c84f45608ff6d9c9cbd528001e9e54759a831` |
| `mainChannelRemoveRequestRefresh` | `js/state_manager.js:1848` | 1848 | 39 | 1,391 | `28c00e8afa51209b65a867ec4a572530605a4d4973f18d6194fc9d1272bf7ec9` |
| `syncKidsToMainRequestRefresh` | `js/state_manager.js:2020` | 2020 | 112 | 4,232 | `ae60b767453f670b560261eaa96ed234f2edf15c0c650ee7df776fbbf05ed764` |
| `contentCategoryRequestRefresh` | `js/state_manager.js:2137` | 2137 | 104 | 4,476 | `7617559675676ed51cbf9c941d38f181e8ee2d8c788903a86233abe43c964b49` |

## Selected Token Counts

```text
StateManager request refresh fanout source files pinned | 1
StateManager request refresh fanout source/effect blocks pinned | 10
selected `await requestRefresh('main')` tokens | 10
selected `await requestRefresh('kids')` tokens | 8
selected `broadcastSettings(` tokens | 3
selected `FilterTube_ApplySettings` tokens | 1
selected `getCompiledSettings` tokens | 1
selected `forceRefresh` tokens | 1
selected `SettingsAPI.saveSettings` tokens | 3
selected `await saveSettings()` tokens | 10
selected `persistMainProfiles(` tokens | 6
selected `persistKidsProfiles(` tokens | 9
selected `settingsRevision` tokens | 0
selected `stateManagerRefreshFanoutReport` tokens | 0
selected `dirtyKeys` tokens | 0
selected `activeRuleDelta` tokens | 0
selected `noOpRefreshDecision` tokens | 0
```

## Request Refresh Callsite Matrix

Columns: source, owner method, target profile, current path.

```text
js/state_manager.js:732:addKidsKeyword:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:756:removeKidsKeyword:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:793:toggleKidsKeywordComments:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:829:toggleKidsKeywordExact:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:955:removeKidsChannel:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:990:toggleKidsChannelFilterAll:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:1395:addKeyword:main:persistMainProfiles->requestRefresh
js/state_manager.js:1458:toggleKeywordComments:main:persistMainProfiles->requestRefresh
js/state_manager.js:1508:removeKeyword:main:persistMainProfiles->requestRefresh
js/state_manager.js:1554:toggleKeywordExact:main:persistMainProfiles->requestRefresh
js/state_manager.js:1652:addChannel:main:backgroundPersistentAdd->requestRefresh
js/state_manager.js:1824:importSubscribedChannelsToWhitelist:main:backgroundBatchImport->loadSettings->requestRefresh
js/state_manager.js:1867:removeChannel:main:persistMainProfiles->requestRefresh
js/state_manager.js:2115:updateSetting:main:syncKidsToMainProfileWrites->requestRefresh
js/state_manager.js:2154:updateContentFilters:main:saveSettings->requestRefresh
js/state_manager.js:2179:updateKidsContentFilters:kids:persistKidsProfiles->requestRefresh
js/state_manager.js:2207:updateCategoryFilters:main:saveSettings->requestRefresh
js/state_manager.js:2236:updateKidsCategoryFilters:kids:persistKidsProfiles->requestRefresh
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before refresh, cache, or JSON-first changes |
| --- | --- | --- | --- |
| Direct compiled broadcast | `saveSettings()` calls `SettingsAPI.saveSettings(...)` and, when `broadcast` and `result.compiledSettings` are truthy, sends `result.compiledSettings` through `broadcastSettings(...)`. | `saveSettingsBroadcastPath`. | UI-local compiled payloads can enter the same background `FilterTube_ApplySettings` cache path as background-compiled payloads. |
| Apply-settings sender | `broadcastSettings()` sends `{ action: 'FilterTube_ApplySettings', settings: compiledSettings, profile }` with no revision, dirty-key report, or source tag. | `broadcastSettings`. | The background apply branch cannot distinguish UI-local compiled payloads from fresh background revisions. |
| Background rebound | `requestRefresh(profile)` asks background for `getCompiledSettings` with `forceRefresh: true`, then calls `broadcastSettings(compiled, profile)` when the response has no error. | `requestRefresh`. | Even the safer background-compiled path rebounds through the same caller-pushed apply-settings surface. |
| Main whitelist branches | Main whitelist keyword/channel edits persist profile rows and then call `requestRefresh('main')`. Main blocklist branches generally call `saveSettings()` instead. | `mainKeywordRequestRefreshMutations`, `mainChannelWhitelistRequestRefresh`, `mainChannelRemoveRequestRefresh`. | Main allow/block mode changes use different refresh paths, which makes active-rule deltas and no-work budgets harder to prove. |
| Kids mutation branches | Kids keyword/channel removals and toggles persist Kids profiles and call `requestRefresh('kids')`; Kids channel add delegates to background and reloads without a local request-refresh call in the selected block. | `kidsRequestRefreshMutations`. | Kids mutation refresh ownership is split across StateManager and background channel add handling. |
| Import and sync branches | Subscription import calls background batch import, reloads settings, then calls `requestRefresh('main')`; `syncKidsToMain` writes V4 and V3 profile fields then calls `requestRefresh('main')` inside a best-effort `try`. | `subscriptionImportRequestRefresh`, `syncKidsToMainRequestRefresh`. | Import/sync side effects lack one mutation report tying profile writes, background compile, broadcast, and backup timing together. |
| Content/category branches | Main content/category updates call `saveSettings()` and then `requestRefresh('main')`; Kids content/category updates persist Kids profiles and call `requestRefresh('kids')`. | `contentCategoryRequestRefresh`. | Main content/category changes can produce direct save broadcast plus background force-refresh rebound, while Kids uses only profile persistence plus rebound. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
stateManagerRequestRefreshFanoutContract
stateManagerRequestRefreshCallsiteReport
stateManagerDirectCompiledBroadcastPolicy
stateManagerBackgroundRefreshReboundPolicy
stateManagerRefreshRevisionReport
stateManagerRefreshProfileScopeReport
stateManagerSaveVsRefreshDecisionReport
stateManagerContentCategoryRefreshBudget
stateManagerKidsMutationRefreshPolicy
stateManagerRefreshFanoutMetricArtifact
```

Before changing refresh fanout, compiled cache rules, settings-mode handling, or
JSON-first work decisions, each affected path still needs:

```text
refreshCaller
targetProfile
settingsMode
mutationKind
persistedStorageKeys
compiledPayloadSource
backgroundCompileProof
settingsRevisionBefore
settingsRevisionAfter
dirtyKeyDecision
activeRuleDelta
directBroadcastDecision
backgroundReboundDecision
domReprocessDecision
seedRelayDecision
noOpRefreshDecision
messageWorkBudget
domWorkBudget
positiveFixture
negativeNoOpFixture
negativeWrongProfileFixture
negativeDisabledFixture
metricArtifact
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
