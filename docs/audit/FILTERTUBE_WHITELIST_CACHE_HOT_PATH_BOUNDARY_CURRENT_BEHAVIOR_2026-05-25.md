# FilterTube Whitelist Cache Hot Path Boundary - Current Behavior

Date: 2026-05-25

Status: current-behavior boundary with a narrow runtime hot-path fix. The only
runtime changes in this slice suppress duplicate learned-map persistence when
the local content settings row already matches the candidate row, avoid no-op
identity-stamp reruns, and let learned video-channel batches own one DOM fallback
rerun instead of also taking the per-stamp fallback timer. This is not a
JSON-first patch, broad DOM fallback patch, whitelist policy patch, release
package patch, or public claim.

## Purpose

This slice follows the release-facing report that recent whitelist/cache work
made YouTube SPA navigation feel slower. The narrow pending-hide intake patch is
already source-pinned separately; this boundary pins the remaining cache hot
paths that can still amplify SPA work before any broader cache optimization is
approved.

Current answer:

```text
whitelist cache hot-path source files: 5
cache hot-path source/effect blocks: 7
content bridge cache hot-path blocks: 3
background map cache blocks: 2
bridge settings refresh blocks: 1
handle resolver cache blocks: 1
learned map cache freshness rows: 8
duplicate page-message DOM work still possible: no, for unchanged learned video rows
central learned-map revision counter: absent
runtime behavior changed: yes, duplicate learned-map persistence, no-op stamp reruns, and duplicate learned-batch DOM work only
runtime narrow learned-map persistence/deduped-DOM approval: GO
runtime broader whitelist cache optimization approval: NO-GO
runtime JSON-first cache optimization approval: NO-GO
```

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/background.js` | 6320 | 285103 | `77628ab6dde775f3e2e30746974169e5f685e80172f449639fd845817b1c71ad` |
| `js/content/bridge_settings.js` | 651 | 26462 | `c7828acd09941f4559e47b31ea57d184ef9367ae4964598e865b8a196934e75b` |
| `js/content/handle_resolver.js` | 282 | 9785 | `67cc877a0a97e4c4c5aaf5a0d1c37c15000af5238f8f37d7c5dc6efee27e34ff` |
| `js/filter_logic.js` | 3498 | 165151 | `4159fd729e04a82fc54bf39a79b179872205df841e1c6fe067f81ffcf1d11641` |

## Source/Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 | Current behavior pinned |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `contentBridgePersistVideoMapping` | `js/content_bridge.js` | 1638 | 74 | 3441 | `043d1f771d3652cd6f35fa205dbdfa92925ebf5e62eb392da800293c6b070dd7` | `persistVideoChannelMapping()` and `persistVideoMetaMapping()` now skip identical learned-map rows before background message handoff and expose changed-row results to page-message receivers. |
| `contentBridgeValidatedCollaboratorCache` | `js/content_bridge.js` | 2652 | 94 | 4628 | `d4c057c1e55d02d8f80062efcbd097b723c111fb5fcce05975aec1cac8684481` | DOM collaborator attributes are reused only after video-id validation, and stale-card cleanup removes local attributes. |
| `contentBridgeYtInitialDataChannelCache` | `js/content_bridge.js` | 7917 | 117 | 4807 | `ae717352ad0b82642af2ffa22128b309d60dca9f990ef579ea3ceaac6d70442f` | ytInitialData channel lookup has positive, negative, and in-flight maps keyed by video id plus expected handle/name. |
| `backgroundMapCacheDeclarations` | `js/background.js` | 1287 | 21 | 686 | `f82fd7936485f08734bf18b4da304978f428be0e36b2eef434007116a9cc53ec` | Background declares separate channel, video-channel, and video-meta cache, load promise, flush promise, timer, and pending map state. |
| `backgroundMapCacheCluster` | `js/background.js` | 1452 | 263 | 8987 | `de1705105e239ce4de8c79d5e4ab3e135ed7133fcbc17f00ce5c1074230b493a` | Background lazy-loads map caches, patches compiled settings caches, debounces flushes, and caps only video maps. |
| `bridgeSettingsMapOnlyRefresh` | `js/content/bridge_settings.js` | 519 | 130 | 4506 | `f3802437cd0f5bee44ac10378fd4b5156ad87cf3f5db3ee142702c0e7a4fed38` | `channelMap`-only changes are ignored, while video map-only changes refresh settings without forced DOM reprocess. |
| `handleResolverCache` | `js/content/handle_resolver.js` | 133 | 150 | 5256 | `e21518cc23e4fa108b94507a2c5e9e43e25e5a240df74951f830597405e9a12d` | `resolvedHandleCache` stores resolved IDs or a local `PENDING` sentinel and can schedule a forced DOM fallback rerun. |

## Selected Token Counts

```text
content_bridge resolvedCollaboratorsByVideoId tokens: 15
content_bridge data-filtertube-collaborators tokens: 23
content_bridge ytInitialDataChannelCache tokens: 10
content_bridge ytInitialDataChannelNegativeExpiry tokens: 6
content_bridge ytInitialDataChannelInFlight tokens: 5
content_bridge currentSettings.videoChannelMap tokens: 12
content_bridge currentSettings.videoMetaMap tokens: 10
content_bridge currentSettings?.videoChannelMap tokens: 12
content_bridge currentSettings?.channelMap tokens: 8
background channelMapCache tokens: 13
background videoChannelMapCache tokens: 12
background videoMetaMapCache tokens: 15
background pendingChannelMapUpdates tokens: 5
background pendingVideoChannelMapUpdates tokens: 6
background pendingVideoMetaMapUpdates tokens: 5
background compiledSettingsCache tokens: 39
bridge_settings channelMap-only branch tokens: 1
bridge_settings videoChannelMap-only branch tokens: 1
bridge_settings videoMetaMap-only branch tokens: 1
handle_resolver resolvedHandleCache tokens: 15
handle_resolver PENDING tokens: 4
```

## Current Behavior Rows

| Row | Current proof | Optimization risk before a broader cache patch |
| --- | --- | --- |
| `FT-WLCACHE-00-content-current-settings-maps` | Content helpers patch `currentSettings.videoChannelMap` and `currentSettings.videoMetaMap` immediately, then send background update messages only when the existing local row is not already identical. | A broader cache optimization must distinguish local visibility from durable background storage and compiled-cache freshness. |
| `FT-WLCACHE-01-background-map-queues` | Background has three independent pending maps and flush timers: 250 ms for `channelMap`, 50 ms for `videoChannelMap`, and 75 ms for `videoMetaMap`. | SPA work can observe patched compiled caches before queued storage flushes complete. |
| `FT-WLCACHE-02-map-cap-asymmetry` | `videoChannelMap` has a 1000/100 cap, `videoMetaMap` has a 2000/500 cap, and `channelMap` has no equivalent cap in the selected cluster. | Cache-size optimization cannot use one eviction policy for all learned identity maps without separate false-hide/leak proof. |
| `FT-WLCACHE-03-storage-refresh-asymmetry` | Bridge settings ignores `channelMap`-only storage changes but refreshes settings for `videoChannelMap`/`videoMetaMap` with `forceReprocess:false`. | Map-only changes already have key-specific no-work behavior, so broad cache throttling needs per-key route/list-mode proof. |
| `FT-WLCACHE-04-collaborator-dom-cache` | Collaborator cache reuse validates `data-filtertube-video-id` against the current card video id and clears local stale attributes on mismatch. | This reduces stale-card leaks but does not provide a global cache lifetime or capacity policy for `resolvedCollaboratorsByVideoId`. |
| `FT-WLCACHE-05-ytinitialdata-cache` | ytInitialData lookup caches positive results for 5 minutes and negative results for 20 seconds, with an in-flight map keyed by video id plus expected handle/name. | The key does not encode route, list mode, profile, or caller reason, so first-class cache optimization needs a reason/route/profile report. |
| `FT-WLCACHE-06-handle-resolver-cache` | `resolvedHandleCache` can return a cached UC id, read `channelMap`, store `PENDING`, return `null` for pending callers, fetch network, post `FilterTube_UpdateChannelMap`, and schedule DOM fallback. | The PENDING sentinel is not a shared promise; callers can continue with no identity while the first resolver owns the fetch. |
| `FT-WLCACHE-07-filter-logic-producers` | Filter logic queues learned `videoChannelMap` and `videoMetaMap` updates from JSON/renderer processing before content/background cache layers consume them. | JSON-first promotion must account for producer reason, active-rule state, and cache write side effects. |

## Learned Map Cache Revision/Freshness Rows

| Row | Current proof | Optimization risk before a broader cache patch |
| --- | --- | --- |
| `FT-WLCACHE-08-producer-dedupe-timers` | `queueVideoChannelMapping()` and `queueVideoMetaMapping()` keep local seen maps and post page messages after 50 ms and 75 ms respectively. | Producer dedupe is signature-local and timer-local; it is not a durable cache revision or route/profile policy. |
| `FT-WLCACHE-09-content-write-dedupe-return` | `persistVideoChannelMapping()` returns `false` for identical rows and `true` after a background handoff; `persistVideoMetaMapping()` returns changed video ids. | This is still a local changed-row result, not a revisioned cache authority. |
| `FT-WLCACHE-10-video-channel-page-rerun-after-changed-row` | The `FilterTube_UpdateVideoChannelMap` receiver now sets `didPersist` from `persistVideoChannelMapping(...)`, suppresses the per-card stamp timer with `scheduleFallback: false`, tracks `didStampDom`, and schedules at most one batch rerun when either persistence or DOM stamping changed visible state. | Duplicate rows and unchanged stamps no longer schedule fallback work, but valid changed rows or newly stamped DOM still can. |
| `FT-WLCACHE-11-video-meta-page-touch-after-changed-row` | The `FilterTube_UpdateVideoMetaMap` receiver builds `changedVideoIds` from `persistVideoMetaMapping(updates)` and touches DOM only for changed video ids. | Duplicate metadata rows no longer clear DOM processing markers, but changed rows still do targeted DOM touch plus rerun. |
| `FT-WLCACHE-12-background-video-channel-pending-visible` | `enqueueVideoChannelMapUpdate()` writes `pendingVideoChannelMapUpdates`, patches loaded `videoChannelMapCache`, patches both compiled settings caches, and schedules a 50 ms flush. | A learned row can become visible to cached compiled settings before durable storage catches up. |
| `FT-WLCACHE-13-background-video-meta-cache-conditional` | `enqueueVideoMetaMapUpdate()` writes `pendingVideoMetaMapUpdates`, patches `videoMetaMapCache` only when that cache is already loaded, patches compiled cache references, and schedules a 75 ms flush. | Video meta freshness depends on cache load order and does not have the same pending compile merge as video-channel identity. |
| `FT-WLCACHE-14-compile-pending-asymmetry` | `getCompiledSettings()` merges `pendingVideoChannelMapUpdates` into `compiledSettings.videoChannelMap`, while `compiledSettings.videoMetaMap` is assigned from stored `items.videoMetaMap`. | Pending video-channel and pending video-meta rows have different visibility before flush. |
| `FT-WLCACHE-15-storage-listener-split` | Background storage invalidation ignores learned maps, while content bridge ignores `channelMap`-only changes and refreshes `videoChannelMap`/`videoMetaMap` without forced reprocess. | Cache freshness is split between background compile cache patching and content-side map-only refresh policy. |

## Current Decision

```text
define whitelist cache hot-path boundary: GO
identify cache optimization source families: GO
runtime whitelist pending intake patch: already handled separately
runtime learned-map duplicate persistence suppression: GO
runtime duplicate learned-map DOM work suppression: GO
learned-map cache freshness current behavior pinned: GO
duplicate page-message DOM work remains release risk: NO for unchanged learned video rows
broader runtime whitelist cache optimization patch now: NO-GO
runtime JSON-first cache optimization patch now: NO-GO
runtime DOM fallback cache optimization patch now: NO-GO
runtime learned-map eviction policy change now: NO-GO
release package patch now: NO-GO
continue proof-backed audit: GO
```

## Required Missing Proof

Before changing broader cache behavior, the runtime still needs:

```text
whitelistCacheHotPathAuthority
whitelistCacheWorkDecision
learnedMapCacheRevisionReport
learnedMapFlushFreshnessReport
collaboratorCacheLifetimePolicy
ytInitialDataCacheReasonReport
handleResolverPendingPromisePolicy
mapOnlyStorageRefreshDecision
jsonFirstCacheWriteEffectReport
whitelistCacheMetricArtifact
```

This boundary is not completion proof. It only pins the cache hot paths that must
be made first-class before broad whitelist/cache/JSON-first optimization can be
released.
