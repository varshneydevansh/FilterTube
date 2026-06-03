# FilterTube Background Compiled Cache Invalidation Lifecycle Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation
patch. Runtime behavior is unchanged.

This slice pins the current background compiled settings cache lifecycle around
cache shape, cache-return gates, storage read keys, read-path storage writes,
caller-pushed cache updates, storage-change invalidation, and recompile
fanout. It extends storage/cache key authority, runtime listener, settings-mode,
message mutation, profile/viewing-space, performance, reliability,
false-hide/leak, code-burden, cross-feature, and implementation-change rows for
`js/background.js`.

Runtime proof:

```text
tests/runtime/background-compiled-cache-invalidation-lifecycle-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6,320 | 285,103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `cacheShape` | `js/background.js:1288` | 1288 | 1 | 56 | `1036c4cba5a87cfa01e6e456e091676e8f03d64e95e8788de2ac5e875df43398` |
| `getCompiledSettingsCacheGate` | `js/background.js:1774` | 1774 | 8 | 414 | `9f6bb35a293ebb4cdb91887529559cefe1bf00d316a1547e9ef3273b59ddeea5` |
| `getCompiledSettingsStorageKeys` | `js/background.js:1784` | 1784 | 44 | 1,408 | `13672cc628bae23213c11257baed164f5aabbbf6d822b2fbf62fdd9b60b75f9f` |
| `getCompiledSettingsMigrationWrite` | `js/background.js:2079` | 2079 | 4 | 185 | `22dc5c70ec30edfbc76170a5dab2e12d8d2872521ac5f874bb097c64292ff15f` |
| `getCompiledSettingsCacheAssign` | `js/background.js:2555` | 2555 | 10 | 336 | `34ea84a49f14d93ccdecf3afbabb42229ff8647582820403b66bb7be56f3643b` |
| `runtimeGetCompiledSettingsBranch` | `js/background.js:3244` | 3244 | 24 | 1,474 | `62d977a4fe0068a72d6703e70984af5a9a95cd7d69918e11fa6a0a6bc33f117f` |
| `applySettingsBranch` | `js/background.js:4395` | 4395 | 28 | 1,487 | `b585d94cc410f7acd929db780840f7cb02b44bb9819b34eb34985b713485e3d6` |
| `storageInvalidationListener` | `js/background.js:4484` | 4484 | 41 | 1,464 | `e5c76f714f31a1d325385b3eaa051c0eb73e6a29ec1c69b1493cc4bb7f796de2` |

## Selected Token Counts

```text
background compiled cache invalidation lifecycle source files pinned | 1
background compiled cache invalidation lifecycle source/effect blocks pinned | 8
selected compiledSettingsCache tokens | 11
selected getCompiledSettings tokens | 8
selected FilterTube_ApplySettings tokens | 2
selected browserAPI.storage.local.get tokens | 1
selected browserAPI.storage.local.set tokens | 1
selected browserAPI.storage.onChanged.addListener tokens | 1
selected sendMessageToTabQuietly tokens | 1
selected forceRefresh tokens | 5
selected request.settings tokens | 1
selected compiledSettingsRevision tokens | 0
selected cacheInvalidationReport tokens | 0
selected isTrustedUiSender tokens | 0
selected channelMap tokens | 1
selected videoChannelMap tokens | 1
selected videoMetaMap tokens | 1
selected contentFilters tokens | 2
selected categoryFilters tokens | 0
selected hideRecommended tokens | 1
selected hideAskButton tokens | 1
selected hideAllComments tokens | 1
selected hideComments tokens | 1
selected clearTimeout tokens | 0
selected removeListener tokens | 0
compiler storage key rows | 43
background invalidation key rows | 14
compiler-only storage key rows | 30
invalidation-only storage key rows | 1
```

## Key Parity Snapshot

Compiler storage keys read directly by `getCompiledSettings()`:

```text
enabled
filterKeywords
uiKeywords
filterChannels
contentFilters
useExactWordMatching
filterKeywordsComments
filterChannelsAdditionalKeywords
uiChannels
hideAllShorts
hideAllComments
filterComments
hideHomeFeed
hideSponsoredCards
hideWatchPlaylistPanel
hidePlaylistCards
hideMembersOnly
hideMixPlaylists
hideVideoSidebar
hideRecommended
hideLiveChat
hideVideoInfo
hideVideoButtonsBar
hideAskButton
hideVideoChannelRow
hideVideoDescription
hideMerchTicketsOffers
hideEndscreenVideowall
hideEndscreenCards
disableAutoplay
disableAnnotations
hideTopHeader
hideNotificationBell
hideExploreTrending
hideMoreFromYouTube
hideSubscriptions
hideSearchShelves
channelMap
videoChannelMap
videoMetaMap
stats
ftProfilesV3
FT_PROFILES_V4_KEY
```

Background storage invalidation keys:

```text
uiKeywords
filterKeywords
filterKeywordsComments
uiChannels
filterChannels
contentFilters
hideMembersOnly
hideAllShorts
hideComments
filterComments
hideHomeFeed
hideSponsoredCards
ftProfilesV3
FT_PROFILES_V4_KEY
```

Compiler-only keys not watched by background invalidation:

```text
enabled
useExactWordMatching
filterChannelsAdditionalKeywords
hideAllComments
hideWatchPlaylistPanel
hidePlaylistCards
hideMixPlaylists
hideVideoSidebar
hideRecommended
hideLiveChat
hideVideoInfo
hideVideoButtonsBar
hideAskButton
hideVideoChannelRow
hideVideoDescription
hideMerchTicketsOffers
hideEndscreenVideowall
hideEndscreenCards
disableAutoplay
disableAnnotations
hideTopHeader
hideNotificationBell
hideExploreTrending
hideMoreFromYouTube
hideSubscriptions
hideSearchShelves
channelMap
videoChannelMap
videoMetaMap
stats
```

Invalidation-only key:

```text
hideComments
```

## Runtime Fixtures Pinned

```text
background_compiled_cache_invalidation_doc_records_audit_only_boundary
background_compiled_cache_source_fingerprint_and_blocks_remain_current
background_compiled_cache_token_counts_and_key_parity_remain_current
background_compiled_cache_current_cache_gate_behavior_is_pinned
background_compiled_cache_current_read_path_write_and_assign_behavior_is_pinned
background_runtime_get_compiled_settings_current_cache_gate_is_pinned
background_apply_settings_current_payload_cache_behavior_is_pinned
background_storage_invalidation_current_listener_behavior_is_pinned
background_compiled_cache_invalidation_authority_symbols_are_absent_from_runtime_source
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before cache, settings, or JSON-first changes |
| --- | --- | --- | --- |
| Cache identity | `compiledSettingsCache` has only `main` and `kids` entries. | `cacheShape`. | Active profile id, viewing space, storage revision, and dirty keys are not part of cache identity. |
| Compile cache gate | `getCompiledSettings()` returns cached settings before storage read unless `forceRefresh` is true. | `getCompiledSettingsCacheGate`. | Cached rules can remain active without a current storage read. |
| Compiler read list | The compiler directly reads 43 keys from storage. | `getCompiledSettingsStorageKeys`. | Compiler dependencies are broader than the background invalidation list. |
| Read-path write | `getCompiledSettings()` can call `browserAPI.storage.local.set(storageUpdates)` while compiling. | `getCompiledSettingsMigrationWrite`. | A read/compile request can also mutate storage without a revision report. |
| Compile assignment | The compiler assigns `compiledSettingsCache[targetProfile] = compiledSettings` before resolving. | `getCompiledSettingsCacheAssign`. | Cache write, compile, and response lifecycle are coupled. |
| Runtime message cache gate | The `getCompiledSettings` message branch has a second cache-return gate and then assigns cache again after compiling. | `runtimeGetCompiledSettingsBranch`. | Runtime callers can receive cache before storage inspection, and cache assignment has two owners. |
| Caller-pushed cache | `FilterTube_ApplySettings` now clears `compiledSettingsCache[targetProfile]`, recompiles with `getCompiledSettings(syntheticSender, targetProfile, true)`, and broadcasts `compiledSettings`. | `applySettingsBranch`. | Caller-provided payloads no longer become background cache authority, though sender gate and revision reporting remain open. |
| Storage invalidation listener | One `browserAPI.storage.onChanged.addListener` watches 14 keys, nulls both caches, and recompiles main and kids. | `storageInvalidationListener`. | Invalidation is all-or-both for watched keys, but misses 30 direct compiler keys and does not broadcast. |
| Teardown and budget | The selected listener path has no `removeListener`, `clearTimeout`, cache invalidation report, or revision token. | Selected token counts. | Listener lifetime, cache churn, stale-cache detection, and recompile work lack one owner artifact. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
backgroundCompiledCacheInvalidationLifecycleContract
backgroundCompiledCacheKeyParityReport
backgroundCompiledCacheRevisionReport
backgroundCompiledCacheSourceReport
backgroundStorageInvalidationDecisionReport
backgroundStorageInvalidationKeyManifest
backgroundApplySettingsPayloadPolicy
backgroundCompiledCacheReadPathMutationReport
backgroundCompiledCacheRecompileBudget
backgroundCompiledCacheBroadcastPolicy
backgroundCompiledCacheMetricArtifact
```

## Current Verdict

```text
Background compiled cache invalidation behavior is proof-pinned.
The compiler reads 43 direct storage keys, while background invalidation watches 14.
Runtime behavior remains unchanged.
```

This does not close storage/cache key authority, runtime listener, settings-mode,
message mutation, profile/viewing-space, JSON-first readiness, reliability,
false-hide/leak, performance, code-burden, cross-feature, or implementation
change rows. It adds current-behavior evidence only.

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
