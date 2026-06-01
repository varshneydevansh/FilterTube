# FilterTube Settings And Mutation Authority Inventory - 2026-05-17

Generated static artifact for storage writes, message actions, list/mode writes, save calls, broadcasts, and backup triggers across the settings authority surface. This does not prove a bug; it identifies every path that needs a mutation-intent or revision proof before behavior changes.

## Scope

- `js/background.js`
- `js/state_manager.js`
- `js/settings_shared.js`
- `js/tab-view.js`
- `js/popup.js`
- `js/io_manager.js`
- `js/nanah_sync_adapter.js`
- `js/security_manager.js`

## Summary

- Authority markers detected: 526
- Unique action names detected: 25

## Runnable Source Proofs Added

The current audit harness now pins eighteen settings and mutation authority gaps with
`tests/runtime/settings-authority-source-current-behavior.test.mjs`.

```text
npm run audit:runtime
tests 274
pass 274
fail 0
```

| Proven gap | Current behavior | Risk |
| --- | --- | --- |
| Shared settings key list drift | `js/settings_shared.js` `SETTINGS_KEYS` omits `contentFilters`, `categoryFilters`, `filterKeywordsComments`, learned video maps, `ftProfilesV4`, exact matching, and channel-derived keyword keys. | Shared load/save/change helpers are not the same authority as the background compiler. |
| Background invalidation drift | `js/background.js` `getCompiledSettings()` reads more keys than `browserAPI.storage.onChanged` watches. | Some writes can leave stale compiled caches; other watched writes can trigger broad recompiles. |
| Background compiler side effects | `getCompiledSettings()` can call `browserAPI.storage.local.set(storageUpdates)` and can persist channel-derived keywords into `ftProfilesV4` while compiling. | A read/compile path is also a storage mutation path, which makes runtime revision and rollback accounting difficult. |
| Split channel add authority | `addChannelPersistent` and `addFilteredChannel` have separate normalization/fetch/write paths. | Same product action can write different storage shapes and backup/refresh behavior depending on entry point. |
| ListType forwarding | Fixed 2026-05-31: `addFilteredChannel` message handler now normalizes `message.listType` and forwards it into `handleAddFilteredChannel(...)`. | The helper supports whitelist/blocklist targeting, and the runtime message path now defaults to blocklist only when the message omits or misstates the list type. |
| Bridge refresh drift | `js/content/bridge_settings.js` refresh keys omit category filters, exact matching, channel-derived keyword keys, and stats keys. | Runtime refresh can miss settings that affect JSON/DOM decisions. |
| StateManager reload drift | `js/state_manager.js` external reload keys omit content/category filters, learned video maps, exact matching, channel-derived keyword keys, and `statsBySurface`. | Dashboard state can diverge from persisted runtime policy until another reload path fires. |
| V3-to-V4 migration loss | `js/settings_shared.js` legacy profile builder forces blocklist mode and empty whitelist arrays. | A V3-only whitelist profile can be converted into a blocklist-shaped V4 profile before StateManager gets a chance to preserve the allow lists. |
| Read-path V4 write | `js/settings_shared.js` `loadSettings()` writes generated V4 state when V4 is missing. | A settings read can mutate storage, fan out listeners, and persist migration output. |
| V4 main list alias drift | Background compile prefers Main `blockedKeywords` / `blockedChannels`, while shared save writes canonical Main `keywords` / `channels`. | Stale blocked aliases can override the current saved Main blocklist, making an empty or edited list behave as if old rules still exist. |
| Concurrent save drop | `js/state_manager.js` `saveSettings()` returns immediately while `isSaving` is true. | Fast UI mutations can update local state while a later durable save is skipped. |
| Optimistic mutator notifications | `js/state_manager.js` keyword/content/category mutators update state before save and notify after save. | A dropped or failed save can still look successful to UI/runtime callers. |
| Swallowed profile persistence failures | `js/state_manager.js` profile persistence helpers catch and warn on V3/V4 save failures. | Callers cannot distinguish successful profile writes from failed profile writes. |
| Kids-derived keyword persistence | `js/state_manager.js` `recomputeKeywords()` can merge Kids `filterAll` channel names into Main keyword state, and `js/settings_shared.js` saves the synthesized keyword list. | Derived sync overlays can become stored Main policy and later hide content even after the user thinks Kids sync is unrelated. |

| Marker kind | Count |
| --- | ---: |
| list write | 296 |
| settings save call | 91 |
| message action compare | 34 |
| profile mode write | 26 |
| storage write | 25 |
| message action object | 23 |
| storage read | 12 |
| background auto backup | 11 |
| tabs broadcast/query | 8 |

## File Distribution

| File | Family | Marker count | Dominant markers |
| --- | --- | ---: | --- |
| `js/background.js` | background authority/actions | 221 | list write: 127<br>message action compare: 29<br>storage write: 24<br>storage read: 11 |
| `js/state_manager.js` | state manager UI model | 144 | settings save call: 74<br>list write: 57<br>profile mode write: 9<br>message action object: 4 |
| `js/tab-view.js` | full dashboard UI | 84 | list write: 54<br>message action object: 10<br>settings save call: 8<br>message action compare: 5 |
| `js/io_manager.js` | backup/import/export IO | 44 | list write: 36<br>settings save call: 4<br>profile mode write: 4 |
| `js/settings_shared.js` | shared schema/migration | 20 | list write: 16<br>settings save call: 2<br>profile mode write: 2 |
| `js/nanah_sync_adapter.js` | Nanah sync | 7 | list write: 6<br>message action object: 1 |
| `js/popup.js` | popup UI | 6 | message action object: 3<br>settings save call: 3 |

## Unique Message / Mutation Actions

| Action | References | Required authority contract |
| --- | --- | --- |
| `addChannelPersistent` | `js/background.js:4095` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `addWhitelistChannelPersistent` | `js/background.js:3498` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ApplySettings` | `js/background.js:4381`<br>`js/background.js:4392`<br>`js/state_manager.js:1212` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_BatchImportWhitelistChannels` | `js/background.js:3537`<br>`js/state_manager.js:1787` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ClearSessionPin` | `js/background.js:3279`<br>`js/tab-view.js:3101` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_EnsureSubscriptionsImportBridge` | `js/background.js:4055`<br>`js/tab-view.js:3276` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_FirstRunCheck` | `js/background.js:3208` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_FirstRunComplete` | `js/background.js:3213` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ImportSubscribedChannels` | `js/state_manager.js:1661` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_KidsBlockChannel` | `js/background.js:3967` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_KidsWhitelistChannel` | `js/background.js:3706` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_OpenWhatsNew` | `js/background.js:3221` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_Ping` | `js/tab-view.js:3449` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_RefreshNow` | `js/background.js:3486`<br>`js/background.js:3670`<br>`js/background.js:3933`<br>`js/background.js:6117` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ReleaseNotesAck` | `js/background.js:3198` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ReleaseNotesCheck` | `js/background.js:3169` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_ScheduleAutoBackup` | `js/background.js:3950`<br>`js/tab-view.js:3068` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_SessionPinAuth` | `js/background.js:3266`<br>`js/tab-view.js:3088`<br>`js/popup.js:727` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_SetListMode` | `js/background.js:3290`<br>`js/tab-view.js:4656`<br>`js/tab-view.js:10626`<br>`js/popup.js:856` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_SubscriptionsImportProgress` | `js/background.js:3233` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `FilterTube_TransferWhitelistToBlocklist` | `js/background.js:3759`<br>`js/tab-view.js:10613`<br>`js/popup.js:843` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `retry-import` | `js/tab-view.js:11006` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `updateChannelMap` | `js/background.js:4397` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `updateVideoChannelMap` | `js/background.js:4400` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |
| `updateVideoMetaMap` | `js/background.js:4407` | Sender trust, target profile/surface, mutation intent, storage writes, background revision, runtime broadcast, rollback/failure result. |

## Marker Ledger

| File:line | Family | Marker | Value | Code excerpt | Required proof gate |
| --- | --- | --- | --- | --- | --- |
| `js/background.js:47` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.sendMessage(tabId, payload, () => {` | must originate from background-compiled revisioned payload |
| `js/background.js:112` | background authority/actions | profile mode write | - | `: (typeof mainProfile.mode === 'string' ? mainProfile.mode : 'blocklist');` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:115` | background authority/actions | profile mode write | - | `: (typeof kidsProfile.mode === 'string' ? kidsProfile.mode : 'blocklist');` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:189` | background authority/actions | list write | - | `whitelistChannels: mainWhitelistChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:190` | background authority/actions | list write | - | `whitelistKeywords: mainWhitelistKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:196` | background authority/actions | list write | - | `blockedChannels: hasProfilesV4 ? safeArray(activeKidsV4.blockedChannels) : safeArray(kidsProfile.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:197` | background authority/actions | list write | - | `blockedKeywords: hasProfilesV4 ? safeArray(activeKidsV4.blockedKeywords) : safeArray(kidsProfile.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:198` | background authority/actions | list write | - | `whitelistChannels: kidsWhitelistChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:199` | background authority/actions | list write | - | `whitelistKeywords: kidsWhitelistKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:224` | background authority/actions | storage read | `[` | `browserAPI.storage.local.get([` | must be covered by authority/mutation fixture |
| `js/background.js:662` | background authority/actions | storage read | `[FT_PROFILES_V4_KEY], items => resolve(items?.[FT_PROFILES_V4_KEY] || null));` | `browserAPI.storage.local.get([FT_PROFILES_V4_KEY], items => resolve(items?.[FT_PROFILES_V4_KEY] \|\| null));` | must be covered by authority/mutation fixture |
| `js/background.js:879` | background authority/actions | background auto backup | - | `function scheduleAutoBackupInBackground(triggerType, options = {}, delay = 1000) {` | must only run after successful durable mutation |
| `js/background.js:970` | background authority/actions | storage read | `[FT_PROFILES_V4_KEY, QUICK_BLOCK_DEFAULT_MIGRATION_KEY, 'showQuickBlockButton'], (items) => {` | `browserAPI.storage.local.get([FT_PROFILES_V4_KEY, QUICK_BLOCK_DEFAULT_MIGRATION_KEY, 'showQuickBlockButton'], (items) => {` | must be covered by authority/mutation fixture |
| `js/background.js:1013` | background authority/actions | storage write | `updates, () => resolve(true));` | `browserAPI.storage.local.set(updates, () => resolve(true));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1015` | background authority/actions | storage write | `{ [QUICK_BLOCK_DEFAULT_MIGRATION_KEY]: true }, () => resolve(false));` | `browserAPI.storage.local.set({ [QUICK_BLOCK_DEFAULT_MIGRATION_KEY]: true }, () => resolve(false));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1023` | background authority/actions | storage read | `[` | `browserAPI.storage.local.get([` | must be covered by authority/mutation fixture |
| `js/background.js:1062` | background authority/actions | list write | - | `updates.uiKeywords = migrateKeywordList(items.uiKeywords, legacyRootCommentsEnabled);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1065` | background authority/actions | list write | - | `updates.filterChannels = migrateChannelList(items.filterChannels, legacyRootCommentsEnabled);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1089` | background authority/actions | list write | - | `whitelistChannels: migrateChannelList(main.whitelistChannels, commentsEnabled),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1090` | background authority/actions | list write | - | `whitelistKeywords: migrateKeywordList(main.whitelistKeywords, commentsEnabled)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1100` | background authority/actions | storage write | `updates, () => resolve(true));` | `browserAPI.storage.local.set(updates, () => resolve(true));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1102` | background authority/actions | storage write | `{ [KEYWORD_COMMENTS_SCOPE_MIGRATION_KEY]: true, filterComments: false }, () => resolve(false));` | `browserAPI.storage.local.set({ [KEYWORD_COMMENTS_SCOPE_MIGRATION_KEY]: true, filterComments: false }, () => resolve(false));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1326` | background authority/actions | list write | - | `? storageUpdates.filterChannels` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1350` | background authority/actions | list write | - | `? storageUpdates.uiKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1385` | background authority/actions | list write | - | `} else if (typeof items?.filterKeywords === 'string') {` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1433` | background authority/actions | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:1436` | background authority/actions | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1437` | background authority/actions | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1440` | background authority/actions | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:1442` | background authority/actions | list write | - | `blockedChannels: safeArray(kidsV3.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1443` | background authority/actions | list write | - | `blockedKeywords: safeArray(kidsV3.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1444` | background authority/actions | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1445` | background authority/actions | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1481` | background authority/actions | storage write | `{ channelMap: map });` | `await browserAPI.storage.local.set({ channelMap: map });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1604` | background authority/actions | storage write | `{ videoChannelMap: map });` | `await browserAPI.storage.local.set({ videoChannelMap: map });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1626` | background authority/actions | storage write | `{ videoMetaMap: map });` | `await browserAPI.storage.local.set({ videoMetaMap: map });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:1784` | background authority/actions | storage read | `[` | `browserAPI.storage.local.get([` | must be covered by authority/mutation fixture |
| `js/background.js:1835` | background authority/actions | list write | - | `const storedUiKeywords = Array.isArray(items.uiKeywords) ? items.uiKeywords : null;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1836` | background authority/actions | list write | - | `const storedUiChannels = Array.isArray(items.uiChannels) ? items.uiChannels : null;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1894` | background authority/actions | list write | - | `compiledSettings.filterKeywords = sanitizeCompiledList(storedCompiled);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1898` | background authority/actions | list write | - | `storageUpdates.uiKeywords = compiledSettings.filterKeywords.map(keyword => {` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1912` | background authority/actions | list write | - | `compiledSettings.filterKeywords = parsedKeywords.map(keyword => {` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1921` | background authority/actions | list write | - | `storageUpdates.filterKeywords = compiledSettings.filterKeywords;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1922` | background authority/actions | list write | - | `storageUpdates.uiKeywords = parsedKeywords.map(keyword => ({ word: keyword, exact: useExact }));` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1924` | background authority/actions | list write | - | `compiledSettings.filterKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1934` | background authority/actions | list write | - | `const uiKeywords = storedUiKeywords;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1994` | background authority/actions | list write | - | `? (Array.isArray(activeKids.whitelistKeywords) ? activeKids.whitelistKeywords : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1996` | background authority/actions | list write | - | `const mainKeywords = Array.isArray(activeMain.whitelistKeywords) ? activeMain.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:1998` | background authority/actions | list write | - | `const kidsWhitelistKeywords = Array.isArray(activeKids.whitelistKeywords) ? activeKids.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2011` | background authority/actions | list write | - | `compiledSettings.whitelistKeywords = compileKeywordEntries(rawWhitelistKeywords);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2014` | background authority/actions | list write | - | `? (Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2016` | background authority/actions | list write | - | `const mainChannels = Array.isArray(activeMain.whitelistChannels) ? activeMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2018` | background authority/actions | list write | - | `const kidsWhitelistChannels = Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2058` | background authority/actions | list write | - | `? (Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : null)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2062` | background authority/actions | list write | - | `? activeMain.blockedKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2065` | background authority/actions | list write | - | `const kidsBlockedKeywords = Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2072` | background authority/actions | list write | - | `compiledSettings.filterKeywords = compileKeywordEntries(v4KeywordEntries);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2080` | background authority/actions | storage write | `storageUpdates);` | `browserAPI.storage.local.set(storageUpdates);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:2086` | background authority/actions | list write | - | `const kidsChannelsV3 = Array.isArray(kidsProfile?.blockedChannels) ? kidsProfile.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2087` | background authority/actions | list write | - | `const kidsKeywordsV3 = Array.isArray(kidsProfile?.blockedKeywords) ? kidsProfile.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2089` | background authority/actions | list write | - | `const kidsChannelsV4 = Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : null;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2090` | background authority/actions | list write | - | `const kidsKeywordsV4 = Array.isArray(activeKids.blockedKeywords) ? activeKids.blockedKeywords : null;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2092` | background authority/actions | list write | - | `const kidsBlockedChannelsV4 = Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2093` | background authority/actions | list write | - | `const kidsWhitelistChannelsV4 = Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2211` | background authority/actions | list write | - | `compiledSettings.whitelistChannels = compileWhitelistChannels(rawWhitelistChannels);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2218` | background authority/actions | list write | - | `? activeMain.blockedChannels` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2312` | background authority/actions | list write | - | `storageUpdates.filterChannels = compiledChannels;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2323` | background authority/actions | list write | - | `storageUpdates.filterChannels = compiledChannels;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2324` | background authority/actions | list write | - | `storageUpdates.uiChannels = compiledChannels.map(ch => ch.name);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2328` | background authority/actions | list write | - | `compiledSettings.filterChannels = compiledChannels;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2343` | background authority/actions | list write | - | `compiledSettings.filterKeywords = [` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2397` | background authority/actions | storage write | `{ ftProfilesV4: updatedProfilesV4 });` | `browserAPI.storage.local.set({ ftProfilesV4: updatedProfilesV4 });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:2470` | background authority/actions | list write | - | `compiledSettings.filterKeywords = mergeWithChannels(compiledKidsKeywords);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2576` | background authority/actions | storage write | `{` | `browserAPI.storage.local.set({` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:2577` | background authority/actions | list write | - | `filterKeywords: '',` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2578` | background authority/actions | list write | - | `filterChannels: '',` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:2595` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: ['*://*.youtube.com/*', '*://*.youtubekids.com/*'] }, (tabs) => {` | must originate from background-compiled revisioned payload |
| `js/background.js:2626` | background authority/actions | storage write | `{` | `browserAPI.storage.local.set({` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:2636` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: ['*://*.youtube.com/*', '*://*.youtubekids.com/*'] }, (tabs) => {` | must originate from background-compiled revisioned payload |
| `js/background.js:2735` | background authority/actions | storage read | `keys, resolve));` | `return new Promise((resolve) => browserAPI.storage.local.get(keys, resolve));` | must be covered by authority/mutation fixture |
| `js/background.js:3169` | background authority/actions | message action compare | `FilterTube_ReleaseNotesCheck` | `if (action === 'FilterTube_ReleaseNotesCheck') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3190` | background authority/actions | storage write | `{ releaseNotesPayload: payload });` | `await browserAPI.storage.local.set({ releaseNotesPayload: payload });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3198` | background authority/actions | message action compare | `FilterTube_ReleaseNotesAck` | `} else if (action === 'FilterTube_ReleaseNotesAck') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3200` | background authority/actions | storage write | `{` | `browserAPI.storage.local.set({` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3208` | background authority/actions | message action compare | `FilterTube_FirstRunCheck` | `} else if (action === 'FilterTube_FirstRunCheck') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3213` | background authority/actions | message action compare | `FilterTube_FirstRunComplete` | `} else if (action === 'FilterTube_FirstRunComplete') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3214` | background authority/actions | storage write | `{ firstRunRefreshNeeded: false })` | `browserAPI.storage.local.set({ firstRunRefreshNeeded: false })` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3221` | background authority/actions | message action compare | `FilterTube_OpenWhatsNew` | `} else if (action === 'FilterTube_OpenWhatsNew') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3233` | background authority/actions | message action compare | `FilterTube_SubscriptionsImportProgress` | `} else if (action === 'FilterTube_SubscriptionsImportProgress') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3242` | background authority/actions | message action compare | `getCompiledSettings` | `} else if (action === "getCompiledSettings") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3266` | background authority/actions | message action compare | `FilterTube_SessionPinAuth` | `} else if (action === 'FilterTube_SessionPinAuth') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3279` | background authority/actions | message action compare | `FilterTube_ClearSessionPin` | `} else if (action === 'FilterTube_ClearSessionPin') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3290` | background authority/actions | message action compare | `FilterTube_SetListMode` | `} else if (action === 'FilterTube_SetListMode') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3408` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3408` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3409` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3409` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3410` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3410` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3411` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3411` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3413` | background authority/actions | list write | - | `nextKids.whitelistChannels = dedupeChannels([...whitelistChannels, ...blockedChannels]);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3414` | background authority/actions | list write | - | `nextKids.whitelistKeywords = dedupeKeywordList([` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3419` | background authority/actions | list write | - | `nextKids.blockedChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3420` | background authority/actions | list write | - | `nextKids.blockedKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3424` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextMain.channels)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3426` | background authority/actions | list write | - | `: (Array.isArray(storage.filterChannels) ? storage.filterChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3427` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextMain.keywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3429` | background authority/actions | list write | - | `: (Array.isArray(storage.uiKeywords) ? storage.uiKeywords : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3430` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3430` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3431` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3431` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3433` | background authority/actions | list write | - | `nextMain.whitelistChannels = dedupeChannels([...whitelistChannels, ...blockedChannels]);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3434` | background authority/actions | list write | - | `nextMain.whitelistKeywords = dedupeKeywordList([` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3465` | background authority/actions | list write | - | `writePayload.filterChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3466` | background authority/actions | list write | - | `writePayload.uiChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3467` | background authority/actions | list write | - | `writePayload.uiKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3468` | background authority/actions | list write | - | `writePayload.filterKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3472` | background authority/actions | storage write | `writePayload);` | `await browserAPI.storage.local.set(writePayload);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3478` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('mode_changed');` | must only run after successful durable mutation |
| `js/background.js:3484` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: urlPattern }, tabs => {` | must originate from background-compiled revisioned payload |
| `js/background.js:3486` | background authority/actions | message action object | `FilterTube_RefreshNow` | `if (tab?.id) sendMessageToTabQuietly(tab.id, { action: 'FilterTube_RefreshNow' });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3498` | background authority/actions | message action compare | `addWhitelistChannelPersistent` | `} else if (action === 'addWhitelistChannelPersistent') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3522` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('whitelist_channel_added');` | must only run after successful durable mutation |
| `js/background.js:3537` | background authority/actions | message action compare | `FilterTube_BatchImportWhitelistChannels` | `} else if (action === 'FilterTube_BatchImportWhitelistChannels') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3577` | background authority/actions | list write | - | `const existingWhitelist = Array.isArray(targetMain.whitelistChannels) ? targetMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3610` | background authority/actions | list write | - | `whitelistChannels: mergedChannels` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3619` | background authority/actions | list write | - | `whitelistChannels: mergedChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3656` | background authority/actions | storage write | `writePayload);` | `await browserAPI.storage.local.set(writePayload);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3662` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('whitelist_subscriptions_imported');` | must only run after successful durable mutation |
| `js/background.js:3667` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: ['*://*.youtube.com/*'] }, tabs => {` | must originate from background-compiled revisioned payload |
| `js/background.js:3670` | background authority/actions | message action object | `FilterTube_RefreshNow` | `sendMessageToTabQuietly(tab.id, { action: 'FilterTube_RefreshNow' });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3706` | background authority/actions | message action compare | `FilterTube_KidsWhitelistChannel` | `} else if (action === 'FilterTube_KidsWhitelistChannel') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3744` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('kids_whitelist_channel_added');` | must only run after successful durable mutation |
| `js/background.js:3759` | background authority/actions | message action compare | `FilterTube_TransferWhitelistToBlocklist` | `} else if (action === 'FilterTube_TransferWhitelistToBlocklist') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3867` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3867` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextKids.whitelistChannels) ? nextKids.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3868` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3868` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextKids.whitelistKeywords) ? nextKids.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3869` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3869` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextKids.blockedChannels) ? nextKids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3870` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3870` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextKids.blockedKeywords) ? nextKids.blockedKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3872` | background authority/actions | list write | - | `nextKids.blockedChannels = dedupeChannels([...blockedChannels, ...whitelistChannels]);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3873` | background authority/actions | list write | - | `nextKids.blockedKeywords = dedupeKeywordList([` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3877` | background authority/actions | list write | - | `nextKids.whitelistChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3878` | background authority/actions | list write | - | `nextKids.whitelistKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3879` | background authority/actions | profile mode write | - | `nextKids.mode = 'blocklist';` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:3881` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3881` | background authority/actions | list write | - | `const whitelistChannels = Array.isArray(nextMain.whitelistChannels) ? nextMain.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3882` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3882` | background authority/actions | list write | - | `const whitelistKeywords = Array.isArray(nextMain.whitelistKeywords) ? nextMain.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3883` | background authority/actions | list write | - | `const blockedChannels = Array.isArray(nextMain.channels) ? nextMain.channels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3884` | background authority/actions | list write | - | `const blockedKeywords = Array.isArray(nextMain.keywords) ? nextMain.keywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3891` | background authority/actions | list write | - | `nextMain.whitelistChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3892` | background authority/actions | list write | - | `nextMain.whitelistKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3893` | background authority/actions | profile mode write | - | `nextMain.mode = 'blocklist';` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/background.js:3914` | background authority/actions | list write | - | `writePayload.filterChannels = Array.isArray(nextMain.channels) ? nextMain.channels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3915` | background authority/actions | list write | - | `writePayload.uiKeywords = Array.isArray(nextMain.keywords) ? nextMain.keywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3917` | background authority/actions | list write | - | `writePayload.uiChannels = safeArray(writePayload.filterChannels)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:3924` | background authority/actions | storage write | `writePayload);` | `await browserAPI.storage.local.set(writePayload);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:3931` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: urlPattern }, tabs => {` | must originate from background-compiled revisioned payload |
| `js/background.js:3933` | background authority/actions | message action object | `FilterTube_RefreshNow` | `if (tab?.id) sendMessageToTabQuietly(tab.id, { action: 'FilterTube_RefreshNow' });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3940` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('whitelist_to_blocklist_transfer');` | must only run after successful durable mutation |
| `js/background.js:3950` | background authority/actions | message action compare | `FilterTube_ScheduleAutoBackup` | `} else if (action === 'FilterTube_ScheduleAutoBackup') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3955` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground(triggerType, options, delay);` | must only run after successful durable mutation |
| `js/background.js:3961` | background authority/actions | message action compare | `fetchShortsIdentity` | `} else if (action === 'fetchShortsIdentity') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3964` | background authority/actions | message action compare | `fetchWatchIdentity` | `} else if (action === 'fetchWatchIdentity') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3967` | background authority/actions | message action compare | `FilterTube_KidsBlockChannel` | `} else if (action === 'FilterTube_KidsBlockChannel') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:3994` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('kids_channel_added');` | must only run after successful durable mutation |
| `js/background.js:4009` | background authority/actions | message action compare | `injectScripts` | `} else if (request.action === "injectScripts") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4055` | background authority/actions | message action compare | `FilterTube_EnsureSubscriptionsImportBridge` | `} else if (request.action === 'FilterTube_EnsureSubscriptionsImportBridge') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4087` | background authority/actions | message action compare | `processFetchData` | `} else if (request.action === "processFetchData") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4095` | background authority/actions | message action compare | `addChannelPersistent` | `} else if (request.action === "addChannelPersistent") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4194` | background authority/actions | storage read | `[` | `const data = await new Promise(resolve => browserAPI.storage.local.get([` | must be covered by authority/mutation fixture |
| `js/background.js:4234` | background authority/actions | storage read | `['channelMap'], resolve));` | `const mapStorage = await new Promise(resolve => browserAPI.storage.local.get(['channelMap'], resolve));` | must be covered by authority/mutation fixture |
| `js/background.js:4309` | background authority/actions | storage read | `['channelMap'], resolve));` | `const mapStorage = await new Promise(resolve => browserAPI.storage.local.get(['channelMap'], resolve));` | must be covered by authority/mutation fixture |
| `js/background.js:4318` | background authority/actions | storage write | `{ channelMap: channelMap }, resolve));` | `await new Promise(resolve => browserAPI.storage.local.set({ channelMap: channelMap }, resolve));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:4361` | background authority/actions | list write | - | `const writePayload = { filterChannels: channels };` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:4365` | background authority/actions | storage write | `writePayload, resolve));` | `await new Promise(resolve => browserAPI.storage.local.set(writePayload, resolve));` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:4369` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('channel_added');` | must only run after successful durable mutation |
| `js/background.js:4381` | background authority/actions | message action compare | `FilterTube_ApplySettings` | `} else if (request.action === "FilterTube_ApplySettings" && request.settings) {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4390` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: urlPattern }, tabs => {` | must originate from background-compiled revisioned payload |
| `js/background.js:4392` | background authority/actions | message action object | `FilterTube_ApplySettings` | `sendMessageToTabQuietly(tab.id, { action: 'FilterTube_ApplySettings', settings: request.settings });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4397` | background authority/actions | message action compare | `updateChannelMap` | `} else if (request.action === "updateChannelMap") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4400` | background authority/actions | message action compare | `updateVideoChannelMap` | `} else if (request.action === "updateVideoChannelMap") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4407` | background authority/actions | message action compare | `updateVideoMetaMap` | `} else if (request.action === "updateVideoMetaMap") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4423` | background authority/actions | message action compare | `recordTimeSaved` | `} else if (request.action === "recordTimeSaved") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4425` | background authority/actions | storage read | `['stats'], (result) => {` | `browserAPI.storage.local.get(['stats'], (result) => {` | must be covered by authority/mutation fixture |
| `js/background.js:4432` | background authority/actions | storage write | `{ stats });` | `browserAPI.storage.local.set({ stats });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:4437` | background authority/actions | message action compare | `fetchChannelDetails` | `else if (request.action === "fetchChannelDetails") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:4449` | background authority/actions | message action compare | `getBrowserInfo` | `if (request.action === "getBrowserInfo") {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:5240` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground(backupTrigger);` | must only run after successful durable mutation and match normalized profile/list target |
| `js/background.js:5253` | background authority/actions | background auto backup | - | `scheduleAutoBackupInBackground('filter_all_toggled');` | must only run after successful durable mutation |
| `js/background.js:5739` | background authority/actions | list write | - | `? (Array.isArray(activeKids.whitelistChannels) ? activeKids.whitelistChannels : null)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5740` | background authority/actions | list write | - | `: (Array.isArray(activeKids.blockedChannels) ? activeKids.blockedChannels : null);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5743` | background authority/actions | list write | - | `? (Array.isArray(kidsProfile.whitelistChannels) ? kidsProfile.whitelistChannels : safeArray(kidsProfile.whitelistedChannels))` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5744` | background authority/actions | list write | - | `: (Array.isArray(kidsProfile.blockedChannels) ? kidsProfile.blockedChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5748` | background authority/actions | list write | - | `? (Array.isArray(activeMain.whitelistChannels) ? activeMain.whitelistChannels : null)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5752` | background authority/actions | list write | - | `? (Array.isArray(mainProfile.whitelistChannels) ? mainProfile.whitelistChannels : safeArray(mainProfile.whitelistedChannels))` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:5757` | background authority/actions | list write | - | `: (Array.isArray(storage.filterChannels) ? storage.filterChannels : []));` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6036` | background authority/actions | storage write | `{ channelMap: channelMap });` | `await browserAPI.storage.local.set({ channelMap: channelMap });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:6033` | background authority/actions | storage write | `{ channelMap });` | `await browserAPI.storage.local.set({ channelMap });` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:6078` | background authority/actions | list write | - | `blockedKeywords: syncedMainKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6079` | background authority/actions | list write | - | `whitelistChannels: (!isKids && targetListType === 'whitelist') ? channels : safeArray(nextMain.whitelistChannels)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6085` | background authority/actions | list write | - | `blockedChannels: (isKids && targetListType === 'blocklist') ? channels : safeArray(nextKids.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6086` | background authority/actions | list write | - | `blockedKeywords: safeArray(nextKids.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6087` | background authority/actions | list write | - | `whitelistChannels: (isKids && targetListType === 'whitelist') ? channels : safeArray(nextKids.whitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6088` | background authority/actions | list write | - | `whitelistKeywords: safeArray(nextKids.whitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6103` | background authority/actions | list write | - | `blockedChannels: targetListType === 'blocklist'` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6115` | background authority/actions | tabs broadcast/query | - | `browserAPI.tabs.query({ url: ['*://*.youtubekids.com/*'] }, tabs => {` | must originate from background-compiled revisioned payload |
| `js/background.js:6117` | background authority/actions | message action object | `FilterTube_RefreshNow` | `if (tab?.id) sendMessageToTabQuietly(tab.id, { action: 'FilterTube_RefreshNow' });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/background.js:6123` | background authority/actions | list write | - | `storageWritePayload.filterChannels = channels;` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6125` | background authority/actions | list write | - | `storageWritePayload.uiChannels = safeArray(channels).map(ch => (typeof ch?.name === 'string' ? ch.name : '')).filter(Boolean);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6142` | background authority/actions | storage write | `storageWritePayload);` | `await browserAPI.storage.local.set(storageWritePayload);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/background.js:6179` | background authority/actions | storage read | `[` | `browserAPI.storage.local.get([` | must be covered by authority/mutation fixture |
| `js/background.js:6188` | background authority/actions | list write | - | `const channels = Array.isArray(storage.filterChannels) ? storage.filterChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6231` | background authority/actions | list write | - | `blockedKeywords: syncedKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6250` | background authority/actions | list write | - | `const payload = { filterChannels: channels };` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/background.js:6254` | background authority/actions | storage write | `payload, resolve);` | `browserAPI.storage.local.set(payload, resolve);` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/io_manager.js:242` | backup/import/export IO | list write | - | `blockedChannels: sanitizeChannels(kids.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:243` | backup/import/export IO | list write | - | `blockedKeywords: sanitizeKeywords(kids.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:459` | backup/import/export IO | list write | - | `blockedChannels: safeArray(kids.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:460` | backup/import/export IO | list write | - | `blockedKeywords: safeArray(kids.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:542` | backup/import/export IO | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/io_manager.js:545` | backup/import/export IO | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:546` | backup/import/export IO | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:549` | backup/import/export IO | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/io_manager.js:551` | backup/import/export IO | list write | - | `blockedChannels: kidsChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:552` | backup/import/export IO | list write | - | `blockedKeywords: kidsKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:553` | backup/import/export IO | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:554` | backup/import/export IO | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:687` | backup/import/export IO | list write | - | `whitelistChannels: sanitizeMainChannels(main.whitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:688` | backup/import/export IO | list write | - | `whitelistKeywords: sanitizeMainKeywords(main.whitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:694` | backup/import/export IO | list write | - | `blockedChannels: safeArray(kids.blockedChannels)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:697` | backup/import/export IO | list write | - | `blockedKeywords: safeArray(kids.blockedKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:700` | backup/import/export IO | list write | - | `whitelistChannels: safeArray(kids.whitelistChannels)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:703` | backup/import/export IO | list write | - | `whitelistKeywords: safeArray(kids.whitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:889` | backup/import/export IO | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/io_manager.js:897` | backup/import/export IO | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/io_manager.js:899` | backup/import/export IO | list write | - | `blockedChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:900` | backup/import/export IO | list write | - | `blockedKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:984` | backup/import/export IO | list write | - | `blockedChannels: safeArray(profilesV3?.kids?.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:985` | backup/import/export IO | list write | - | `blockedKeywords: safeArray(profilesV3?.kids?.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1117` | backup/import/export IO | list write | - | `blockedChannels: kidsBlockedChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1118` | backup/import/export IO | list write | - | `blockedKeywords: kidsBlockedKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1134` | backup/import/export IO | settings save call | - | `const mainSettings = await SettingsAPI.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/io_manager.js:1234` | backup/import/export IO | settings save call | - | `const current = await SettingsAPI.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/io_manager.js:1411` | backup/import/export IO | settings save call | - | `: await SettingsAPI.saveSettings(payload);` | must be revisioned/queued and surface failure to caller |
| `js/io_manager.js:1452` | backup/import/export IO | list write | - | `blockedChannels: strategy === 'replace'` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1455` | backup/import/export IO | list write | - | `blockedKeywords: strategy === 'replace'` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1527` | backup/import/export IO | list write | - | `whitelistChannels: mergeChannelLists(existingMain.whitelistChannels, incMain.whitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1528` | backup/import/export IO | list write | - | `whitelistKeywords: mergeKeywordLists(existingMain.whitelistKeywords, incMain.whitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1535` | backup/import/export IO | list write | - | `blockedChannels: mergeChannelLists(existingKids.blockedChannels, incKids.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1536` | backup/import/export IO | list write | - | `blockedKeywords: mergeKeywordLists(existingKids.blockedKeywords, incKids.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1537` | backup/import/export IO | list write | - | `whitelistChannels: mergeChannelLists(existingKids.whitelistChannels, incKids.whitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1538` | backup/import/export IO | list write | - | `whitelistKeywords: mergeKeywordLists(existingKids.whitelistKeywords, incKids.whitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1634` | backup/import/export IO | list write | - | `whitelistChannels: safeArray(desiredMainWhitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1635` | backup/import/export IO | list write | - | `whitelistKeywords: safeArray(desiredMainWhitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1641` | backup/import/export IO | list write | - | `blockedChannels: safeArray(desiredKidsBlockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1642` | backup/import/export IO | list write | - | `blockedKeywords: safeArray(desiredKidsBlockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1643` | backup/import/export IO | list write | - | `whitelistChannels: safeArray(desiredKidsWhitelistChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1644` | backup/import/export IO | list write | - | `whitelistKeywords: safeArray(desiredKidsWhitelistKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/io_manager.js:1768` | backup/import/export IO | settings save call | - | `const settings = await SettingsAPI.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/nanah_sync_adapter.js:205` | Nanah sync | list write | - | `whitelistChannels: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:208` | Nanah sync | list write | - | `whitelistKeywords: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:226` | Nanah sync | list write | - | `blockedChannels: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:229` | Nanah sync | list write | - | `blockedKeywords: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:232` | Nanah sync | list write | - | `whitelistChannels: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:235` | Nanah sync | list write | - | `whitelistKeywords: replace` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/nanah_sync_adapter.js:321` | Nanah sync | message action object | `filtertube.apply_sync_payload` | `action: 'filtertube.apply_sync_payload',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/popup.js:727` | popup UI | message action object | `FilterTube_SessionPinAuth` | `action: 'FilterTube_SessionPinAuth',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/popup.js:843` | popup UI | message action object | `FilterTube_TransferWhitelistToBlocklist` | `action: 'FilterTube_TransferWhitelistToBlocklist',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/popup.js:856` | popup UI | message action object | `FilterTube_SetListMode` | `action: 'FilterTube_SetListMode',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/popup.js:869` | popup UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/popup.js:1508` | popup UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/popup.js:1531` | popup UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/settings_shared.js:152` | shared schema/migration | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/settings_shared.js:155` | shared schema/migration | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:156` | shared schema/migration | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:159` | shared schema/migration | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/settings_shared.js:161` | shared schema/migration | list write | - | `blockedChannels: safeArray(kidsV3.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:162` | shared schema/migration | list write | - | `blockedKeywords: safeArray(kidsV3.blockedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:163` | shared schema/migration | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:164` | shared schema/migration | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:526` | shared schema/migration | list write | - | `filterKeywords: compileKeywords(sanitizedKeywords),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:528` | shared schema/migration | list write | - | `filterChannels: sanitizedChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:564` | shared schema/migration | settings save call | - | `function loadSettings() {` | must be revisioned/queued and surface failure to caller |
| `js/settings_shared.js:742` | shared schema/migration | settings save call | - | `function saveSettings(options = {}) {` | must be revisioned/queued and surface failure to caller |
| `js/settings_shared.js:845` | shared schema/migration | list write | - | `uiKeywords: sanitizedKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:846` | shared schema/migration | list write | - | `filterKeywords: compiledSettings.filterKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:848` | shared schema/migration | list write | - | `filterChannels: compiledSettings.filterChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:931` | shared schema/migration | list write | - | `blockedChannels: safeArray(existingKids.blockedChannels),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:932` | shared schema/migration | list write | - | `blockedKeywords: safeArray(existingKids.blockedKeywords)` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:991` | shared schema/migration | list write | - | `uiKeywords: sanitizedKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:992` | shared schema/migration | list write | - | `filterKeywords: compiledSettings.filterKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/settings_shared.js:994` | shared schema/migration | list write | - | `filterChannels: compiledSettings.filterChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:53` | state manager UI model | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:54` | state manager UI model | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:55` | state manager UI model | list write | - | `whitelistKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:96` | state manager UI model | list write | - | `blockedKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:97` | state manager UI model | list write | - | `blockedChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:98` | state manager UI model | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:99` | state manager UI model | list write | - | `whitelistKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:100` | state manager UI model | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:178` | state manager UI model | settings save call | - | `async function loadSettings(options = {}) {` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:188` | state manager UI model | settings save call | - | `const data = await SettingsAPI.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:321` | state manager UI model | list write | - | `state.whitelistChannels = Array.isArray(mainFromV4.whitelistChannels) ? mainFromV4.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:321` | state manager UI model | list write | - | `state.whitelistChannels = Array.isArray(mainFromV4.whitelistChannels) ? mainFromV4.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:322` | state manager UI model | list write | - | `state.whitelistKeywords = Array.isArray(mainFromV4.whitelistKeywords) ? mainFromV4.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:322` | state manager UI model | list write | - | `state.whitelistKeywords = Array.isArray(mainFromV4.whitelistKeywords) ? mainFromV4.whitelistKeywords : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:325` | state manager UI model | list write | - | `(Array.isArray(mainFromV4.blockedChannels) ? mainFromV4.blockedChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:327` | state manager UI model | list write | - | `(Array.isArray(mainFromV4.blockedKeywords) ? mainFromV4.blockedKeywords : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:330` | state manager UI model | list write | - | `state.whitelistChannels = profilesV3.main.whitelistChannels` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:333` | state manager UI model | list write | - | `state.whitelistKeywords = profilesV3.main.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:344` | state manager UI model | profile mode write | - | `state.mode = 'blocklist';` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:345` | state manager UI model | list write | - | `state.whitelistChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:346` | state manager UI model | list write | - | `state.whitelistKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:372` | state manager UI model | list write | - | `blockedKeywords: kidsFromV4.blockedKeywords \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:373` | state manager UI model | list write | - | `blockedChannels: cleanBlockedChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:374` | state manager UI model | list write | - | `whitelistChannels: kidsFromV4.whitelistChannels \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:375` | state manager UI model | list write | - | `whitelistKeywords: kidsFromV4.whitelistKeywords \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:436` | state manager UI model | list write | - | `blockedKeywords: profilesV3.kids.blockedKeywords \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:437` | state manager UI model | list write | - | `blockedChannels: cleanBlockedChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:438` | state manager UI model | list write | - | `whitelistChannels: profilesV3.kids.whitelistChannels \|\| profilesV3.kids.whitelistedChannels \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:439` | state manager UI model | list write | - | `whitelistKeywords: profilesV3.kids.whitelistKeywords \|\| profilesV3.kids.whitelistedKeywords \|\| [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:517` | state manager UI model | list write | - | `blockedKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:518` | state manager UI model | list write | - | `blockedChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:519` | state manager UI model | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:520` | state manager UI model | list write | - | `whitelistKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:521` | state manager UI model | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:576` | state manager UI model | list write | - | `const kidsChannels = Array.isArray(kids.blockedChannels) ? kids.blockedChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:705` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:731` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:732` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:745` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:755` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:756` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:773` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:792` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:793` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:810` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:828` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:829` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:865` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:924` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:943` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:954` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:955` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:972` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:989` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:990` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1009` | state manager UI model | settings save call | - | `async function saveSettings({ broadcast = true, profile = 'main' } = {}) {` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1019` | state manager UI model | settings save call | - | `const result = await SettingsAPI.saveSettings({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1073` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1077` | state manager UI model | settings save call | - | `async function persistMainProfiles(nextMain) {` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1096` | state manager UI model | list write | - | `? nextMain.whitelistChannels` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1099` | state manager UI model | list write | - | `? nextMain.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1148` | state manager UI model | settings save call | - | `async function persistKidsProfiles(nextKids) {` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1212` | state manager UI model | message action object | `FilterTube_ApplySettings` | `action: 'FilterTube_ApplySettings',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/state_manager.js:1224` | state manager UI model | settings save call | - | `async function requestRefresh(profile = 'main') {` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1227` | state manager UI model | message action object | `getCompiledSettings` | `action: 'getCompiledSettings',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/state_manager.js:1342` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1367` | state manager UI model | list write | - | `state.whitelistKeywords = [...state.userWhitelistKeywords];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1368` | state manager UI model | settings save call | - | `await persistMainProfiles({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1369` | state manager UI model | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:1370` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1370` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1371` | state manager UI model | list write | - | `whitelistKeywords: state.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1373` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1398` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1416` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1429` | state manager UI model | list write | - | `state.whitelistKeywords = [...state.userWhitelistKeywords];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1431` | state manager UI model | settings save call | - | `await persistMainProfiles({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1432` | state manager UI model | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:1433` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1433` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1434` | state manager UI model | list write | - | `whitelistKeywords: state.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1436` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1452` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1470` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1480` | state manager UI model | list write | - | `state.whitelistKeywords = [...state.userWhitelistKeywords];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1481` | state manager UI model | settings save call | - | `await persistMainProfiles({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1482` | state manager UI model | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:1483` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1483` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1484` | state manager UI model | list write | - | `whitelistKeywords: state.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1486` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1497` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1515` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1526` | state manager UI model | list write | - | `state.whitelistKeywords = [...state.userWhitelistKeywords];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1527` | state manager UI model | settings save call | - | `await persistMainProfiles({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1528` | state manager UI model | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:1529` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1529` | state manager UI model | list write | - | `whitelistChannels: Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1530` | state manager UI model | list write | - | `whitelistKeywords: state.whitelistKeywords` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1532` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1543` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1565` | state manager UI model | list write | - | `? (Array.isArray(state.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1566` | state manager UI model | list write | - | `: (Array.isArray(state.kids?.blockedChannels) ? state.kids.blockedChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1586` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1621` | state manager UI model | list write | - | `const whitelistChannels = Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1621` | state manager UI model | list write | - | `const whitelistChannels = Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1626` | state manager UI model | list write | - | `state.whitelistChannels = [incoming, ...whitelistChannels];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1630` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1661` | state manager UI model | message action object | `FilterTube_ImportSubscribedChannels` | `action: 'FilterTube_ImportSubscribedChannels',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/state_manager.js:1715` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1770` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1787` | state manager UI model | message action object | `FilterTube_BatchImportWhitelistChannels` | `action: 'FilterTube_BatchImportWhitelistChannels',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/state_manager.js:1801` | state manager UI model | settings save call | - | `await loadSettings({ notify: true });` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1802` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1830` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1835` | state manager UI model | list write | - | `const list = Array.isArray(state.whitelistChannels) ? state.whitelistChannels : [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1839` | state manager UI model | list write | - | `state.whitelistChannels = [...list];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1840` | state manager UI model | settings save call | - | `await persistMainProfiles({` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1841` | state manager UI model | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/state_manager.js:1842` | state manager UI model | list write | - | `whitelistChannels: state.whitelistChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1843` | state manager UI model | list write | - | `whitelistKeywords: Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1843` | state manager UI model | list write | - | `whitelistKeywords: Array.isArray(state.whitelistKeywords) ? state.whitelistKeywords : []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/state_manager.js:1845` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1856` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1874` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1886` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1907` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:1935` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2002` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2093` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2102` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2119` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2131` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2132` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2141` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2156` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2157` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2166` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2184` | state manager UI model | settings save call | - | `await saveSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2185` | state manager UI model | settings save call | - | `await requestRefresh('main');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2194` | state manager UI model | settings save call | - | `await loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2213` | state manager UI model | settings save call | - | `await persistKidsProfiles(state.kids);` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2214` | state manager UI model | settings save call | - | `await requestRefresh('kids');` | must be revisioned/queued and surface failure to caller |
| `js/state_manager.js:2307` | state manager UI model | settings save call | - | `await loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:2989` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:3068` | full dashboard UI | message action object | `FilterTube_ScheduleAutoBackup` | `action: 'FilterTube_ScheduleAutoBackup',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:3088` | full dashboard UI | message action object | `FilterTube_SessionPinAuth` | `action: 'FilterTube_SessionPinAuth',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:3101` | full dashboard UI | message action object | `FilterTube_ClearSessionPin` | `action: 'FilterTube_ClearSessionPin',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:3276` | full dashboard UI | message action object | `FilterTube_EnsureSubscriptionsImportBridge` | `action: 'FilterTube_EnsureSubscriptionsImportBridge',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:3449` | full dashboard UI | message action object | `FilterTube_Ping` | `action: 'FilterTube_Ping',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:4162` | full dashboard UI | list write | - | `blockedKeywords: Array.isArray(source.blockedKeywords) ? clonePlain(source.blockedKeywords, []) : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4163` | full dashboard UI | list write | - | `blockedChannels: Array.isArray(source.blockedChannels) ? clonePlain(source.blockedChannels, []) : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4164` | full dashboard UI | list write | - | `whitelistKeywords: Array.isArray(source.whitelistKeywords) ? clonePlain(source.whitelistKeywords, []) : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4165` | full dashboard UI | list write | - | `whitelistChannels: Array.isArray(source.whitelistChannels) ? clonePlain(source.whitelistChannels, []) : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4177` | full dashboard UI | list write | - | `whitelistKeywords: Array.isArray(source.whitelistKeywords) ? clonePlain(source.whitelistKeywords, []) : [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4178` | full dashboard UI | list write | - | `whitelistChannels: Array.isArray(source.whitelistChannels) ? clonePlain(source.whitelistChannels, []) : []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4200` | full dashboard UI | list write | - | `blockedKeywords: Array.isArray(nextSurface.keywords) ? nextSurface.keywords : (Array.isArray(nextSurface.blockedKeywords) ? nextSurface.blockedKeywords : []),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4200` | full dashboard UI | list write | - | `blockedKeywords: Array.isArray(nextSurface.keywords) ? nextSurface.keywords : (Array.isArray(nextSurface.blockedKeywords) ? nextSurface.blockedKeywords : []),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4201` | full dashboard UI | list write | - | `blockedChannels: Array.isArray(nextSurface.channels) ? nextSurface.channels : (Array.isArray(nextSurface.blockedChannels) ? nextSurface.blockedChannels : []),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4201` | full dashboard UI | list write | - | `blockedChannels: Array.isArray(nextSurface.channels) ? nextSurface.channels : (Array.isArray(nextSurface.blockedChannels) ? nextSurface.blockedChannels : []),` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4243` | full dashboard UI | list write | - | `whitelistKeywords: main.whitelistKeywords,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4245` | full dashboard UI | list write | - | `whitelistChannels: main.whitelistChannels,` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:4280` | full dashboard UI | settings save call | - | `await StateManager.loadSettings({ notify: false, resetEnrichment: false, scheduleEnrichment: false });` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:4656` | full dashboard UI | message action object | `FilterTube_SetListMode` | `action: 'FilterTube_SetListMode',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:4658` | full dashboard UI | profile mode write | - | `mode: 'whitelist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/tab-view.js:4667` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:6032` | full dashboard UI | message action object | `apply_once` | `closeWith({ action: 'apply_once', policy });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:6045` | full dashboard UI | message action object | `save` | `closeWith({ action: 'save', policy });` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:6672` | full dashboard UI | storage read | `[key], (result) => {` | `const maybePromise = runtimeAPI.storage.local.get([key], (result) => {` | must be covered by authority/mutation fixture |
| `js/tab-view.js:6696` | full dashboard UI | storage write | `{ [key]: value }, () => {` | `const maybePromise = runtimeAPI.storage.local.set({ [key]: value }, () => {` | must be tied to mutation intent, migration report, or explicit cache/map side-effect |
| `js/tab-view.js:7652` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:8000` | full dashboard UI | message action compare | `save` | `if (managedApproval.action === 'save' && remoteId) {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:8035` | full dashboard UI | message action compare | `save` | `managedApproval.action === 'save'` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:8054` | full dashboard UI | message action compare | `save` | `managedApproval.action === 'save'` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:8629` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:8882` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:9393` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:9870` | full dashboard UI | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/tab-view.js:9873` | full dashboard UI | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9874` | full dashboard UI | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9877` | full dashboard UI | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/tab-view.js:9879` | full dashboard UI | list write | - | `blockedChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9880` | full dashboard UI | list write | - | `blockedKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9881` | full dashboard UI | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9882` | full dashboard UI | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9978` | full dashboard UI | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/tab-view.js:9981` | full dashboard UI | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9982` | full dashboard UI | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9985` | full dashboard UI | profile mode write | - | `mode: 'blocklist',` | must preserve whitelist/blocklist migration invariant and empty-mode policy |
| `js/tab-view.js:9987` | full dashboard UI | list write | - | `blockedChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9988` | full dashboard UI | list write | - | `blockedKeywords: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9989` | full dashboard UI | list write | - | `whitelistChannels: [],` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:9990` | full dashboard UI | list write | - | `whitelistKeywords: []` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10577` | full dashboard UI | list write | - | `target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.blockedChannels) ? target.blockedChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10577` | full dashboard UI | list write | - | `target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.blockedChannels) ? target.blockedChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10577` | full dashboard UI | list write | - | `target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.blockedChannels) ? target.blockedChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10578` | full dashboard UI | list write | - | `target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10578` | full dashboard UI | list write | - | `target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10578` | full dashboard UI | list write | - | `target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10580` | full dashboard UI | list write | - | `target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.channels) ? target.channels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10580` | full dashboard UI | list write | - | `target.whitelistChannels = [...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : []), ...(Array.isArray(target.channels) ? target.channels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10581` | full dashboard UI | list write | - | `target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.keywords) ? target.keywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10581` | full dashboard UI | list write | - | `target.whitelistKeywords = [...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : []), ...(Array.isArray(target.keywords) ? target.keywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10586` | full dashboard UI | list write | - | `target.blockedChannels = [...(Array.isArray(target.blockedChannels) ? target.blockedChannels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10586` | full dashboard UI | list write | - | `target.blockedChannels = [...(Array.isArray(target.blockedChannels) ? target.blockedChannels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10586` | full dashboard UI | list write | - | `target.blockedChannels = [...(Array.isArray(target.blockedChannels) ? target.blockedChannels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10587` | full dashboard UI | list write | - | `target.blockedKeywords = [...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10587` | full dashboard UI | list write | - | `target.blockedKeywords = [...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10587` | full dashboard UI | list write | - | `target.blockedKeywords = [...(Array.isArray(target.blockedKeywords) ? target.blockedKeywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10588` | full dashboard UI | list write | - | `target.whitelistChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10589` | full dashboard UI | list write | - | `target.whitelistKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10591` | full dashboard UI | list write | - | `target.channels = [...(Array.isArray(target.channels) ? target.channels : []), ...(Array.isArray(target.whitelistChannels) ? target.whitelistChannels : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10592` | full dashboard UI | list write | - | `target.keywords = [...(Array.isArray(target.keywords) ? target.keywords : []), ...(Array.isArray(target.whitelistKeywords) ? target.whitelistKeywords : [])];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10593` | full dashboard UI | list write | - | `target.whitelistChannels = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10594` | full dashboard UI | list write | - | `target.whitelistKeywords = [];` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10613` | full dashboard UI | message action object | `FilterTube_TransferWhitelistToBlocklist` | `action: 'FilterTube_TransferWhitelistToBlocklist',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:10626` | full dashboard UI | message action object | `FilterTube_SetListMode` | `action: 'FilterTube_SetListMode',` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:10639` | full dashboard UI | settings save call | - | `await StateManager.loadSettings();` | must be revisioned/queued and surface failure to caller |
| `js/tab-view.js:10762` | full dashboard UI | list write | - | `? (Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10763` | full dashboard UI | list write | - | `: (Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10766` | full dashboard UI | list write | - | `? (Array.isArray(state?.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10767` | full dashboard UI | list write | - | `: (Array.isArray(state?.kids?.blockedKeywords) ? state.kids.blockedKeywords : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10791` | full dashboard UI | list write | - | `? (Array.isArray(state?.kids?.whitelistChannels) ? state.kids.whitelistChannels : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10792` | full dashboard UI | list write | - | `: (Array.isArray(state?.kids?.blockedChannels) ? state.kids.blockedChannels : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10807` | full dashboard UI | list write | - | `? (Array.isArray(state?.kids?.whitelistKeywords) ? state.kids.whitelistKeywords : [])` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:10808` | full dashboard UI | list write | - | `: (Array.isArray(state?.kids?.blockedKeywords) ? state.kids.blockedKeywords : []);` | must preserve list type, source, channel-derived entries, and sync/import provenance |
| `js/tab-view.js:11002` | full dashboard UI | message action compare | `enable-whitelist` | `if (action === 'enable-whitelist') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |
| `js/tab-view.js:11006` | full dashboard UI | message action compare | `retry-import` | `if (action === 'retry-import') {` | must declare sender trust, target profile/surface, storage writes, broadcast, and network budget |

## Interpretation

- A storage write row must eventually map to a mutation intent or migration report.
- A message action row must not be considered safe until sender trust, profile target, storage writes, broadcasts, and failure semantics are explicit.
- List/mode writes are high-risk because they can convert blocklist to whitelist semantics or preserve/drop channel-derived entries.
- Backup triggers and success toasts need durable-write proof; otherwise UI can report success while runtime uses stale rules.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
