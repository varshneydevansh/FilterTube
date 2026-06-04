# FilterTube Learned Identity Map Cache Persistence Boundary - 2026-05-22

Status: current-behavior proof slice. This is not an implementation patch.

This slice promotes the learned identity map write-entrypoint register into
direct cache/persistence proof for `channelMap`, `videoChannelMap`, and
`videoMetaMap`. It covers producer validation, content-side map persistence
helpers, same-window page-message receivers, background cache and flush timers,
compiled-settings cache patching, map-only storage refresh behavior, and the
StateManager direct channel-map write path.

Runtime proof:

```text
tests/runtime/learned-identity-map-cache-persistence-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6657 | 299580 | `f05fe6f65f9de1218299374ac3c82dd6b6ae9e17e3d862926a20e6c2981c19c7` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/bridge_settings.js` | 1113 | 44087 | `f29e6fab216e80cfd3ae9735088f79b36240331429aadbe85db52467be921853` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/filter_logic.js` | 3652 | 172174 | `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5` |

## Source / Effect Blocks

```text
5 learned identity map cache persistence source files
source/effect blocks: 7
background map cache cluster block: 264 lines, 8987 bytes
background map message receiver block: 27 lines, 1185 bytes
content_bridge map persistence helpers block: 92 lines, 3966 bytes
content_bridge main-world map receiver block: 103 lines, 4981 bytes
bridge_settings map storage-change block: 58 lines, 1855 bytes
state_manager persistChannelMap block: 16 lines, 468 bytes
filter_logic map producer cluster block: 95 lines, 3795 bytes
```

## Selected Token Counts

```text
background pendingChannelMapUpdates tokens: 5
background pendingVideoChannelMapUpdates tokens: 6
background pendingVideoMetaMapUpdates tokens: 5
background channelMapFlushTimer tokens: 4
background videoChannelMapFlushTimer tokens: 4
background videoMetaMapFlushTimer tokens: 4
background flushChannelMapUpdates tokens: 2
background flushVideoChannelMapUpdates tokens: 2
background flushVideoMetaMapUpdates tokens: 2
background enqueueChannelMapUpdate tokens: 5
background enqueueVideoChannelMapUpdate tokens: 3
background enqueueVideoMetaMapUpdate tokens: 2
background compiledSettingsCache tokens: 39
background channelMap tokens: 93
background videoChannelMap tokens: 46
background videoMetaMap tokens: 40
content_bridge persistVideoChannelMapping tokens: 9
content_bridge persistVideoMetaMapping tokens: 3
content_bridge scheduleVideoMetaDomRerun tokens: 3
content_bridge touchDomForVideoMetaUpdate tokens: 4
content_bridge FilterTube_UpdateChannelMap tokens: 2
content_bridge FilterTube_UpdateVideoChannelMap tokens: 2
content_bridge FilterTube_UpdateVideoMetaMap tokens: 1
content_bridge FilterTube_UpdateCustomUrlMap tokens: 1
content_bridge applyDOMFallback tokens: 31
content_bridge currentSettings.videoChannelMap tokens: 12
content_bridge currentSettings.videoMetaMap tokens: 10
bridge_settings channelMap tokens: 2
bridge_settings videoChannelMap tokens: 2
bridge_settings videoMetaMap tokens: 2
bridge_settings forceReprocess tokens: 8
state_manager persistChannelMap tokens: 1
state_manager state.channelMap tokens: 6
filter_logic FilterTube_UpdateVideoChannelMap tokens: 1
filter_logic FilterTube_UpdateVideoMetaMap tokens: 1
filter_logic FilterTube_UpdateChannelMap tokens: 1
filter_logic FilterTube_UpdateCustomUrlMap tokens: 1
filter_logic source filter_logic tokens: 6
filter_logic pendingVideoChannelUpdates tokens: 5
filter_logic pendingVideoMetaUpdates tokens: 5
```

## Runtime Fixtures Pinned

```text
filter_logic_producers_validate_and_batch_before_map_page_messages
background_map_cache_cluster_uses_three_debounced_flush_timers_without_revision_report
background_map_message_receiver_accepts_updates_without_sender_policy_or_profile_gate
content_bridge_map_helpers_patch_local_settings_before_background_persistence
content_bridge_page_message_receivers_can_stamp_dom_rerun_fallback_and_bypass_background_cache
bridge_settings_and_state_manager_map_storage_paths_have_asymmetric_refresh_behavior
learned_identity_map_cache_future_authority_symbols_absent_from_product_runtime
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before JSON-first, false-hide, leak, or optimization work |
| --- | --- | --- | --- |
| Filter-logic producers | `queueVideoChannelMapping()` validates 11-character video ids and UC channel ids, dedupes with a seen map, batches for 50 ms, and posts `FilterTube_UpdateVideoChannelMap`. `queueVideoMetaMapping()` validates a non-empty metadata payload, dedupes by signature, batches for 75 ms, and posts `FilterTube_UpdateVideoMetaMap`. `_registerMapping()` and `_registerCustomUrlMapping()` post channel-map page messages. | `tests/runtime/learned-identity-map-cache-persistence-boundary-current-behavior.test.mjs` | Producer validation is stronger than the receiver/cache validation, and producer provenance is not preserved after the bridge/background handoff. |
| Background map caches | Background owns separate pending maps, load promises, flush promises, cache objects, and timers for `channelMap`, `videoChannelMap`, and `videoMetaMap`. The timers are 250 ms, 50 ms, and 75 ms respectively. | Same runtime test. | Three persistence paths can patch runtime caches before durable storage writes, without one revision or freshness report. |
| Background cache patching | Enqueue helpers trim inputs, update pending maps, optionally update in-memory caches, patch `compiledSettingsCache.main` and `.kids`, and schedule a debounced storage flush. Video map and video-meta map flushes enforce caps; channel map flush does not. | Same runtime test. | JSON/DOM decisions can consume patched compiled caches before the queued storage write completes. |
| Background map messages | The runtime receiver accepts `updateChannelMap`, `updateVideoChannelMap`, and `updateVideoMetaMap`, then queues writes and returns without response. | Same runtime test. | The receiver block does not encode sender class, route, profile/list mode, session authorization, active-rule family, or mutation revision. |
| Content-side helpers | `persistVideoChannelMapping()` patches `currentSettings.videoChannelMap` and sends `updateVideoChannelMap`. `persistVideoMetaMapping()` sanitizes metadata, patches `currentSettings.videoMetaMap`, enforces the same 2000/500 cap locally, and sends `updateVideoMetaMap`. | Same runtime test. | Content settings can diverge from background durable state during queued flush windows. |
| Page-message receivers | Same-window `FilterTube_UpdateVideoChannelMap` can persist maps, stamp matching cards with the per-card stamp fallback timer suppressed, and run one `applyDOMFallback(null)` on the next animation frame when persistence or stamping changed state. `FilterTube_UpdateVideoMetaMap` can touch DOM metadata flags and schedule a 550 ms DOM rerun. `FilterTube_UpdateCustomUrlMap` writes `channelMap` directly through content storage APIs instead of the background enqueue path. | Same runtime test. | Map writes can have DOM side effects and direct storage bypasses that are not represented by one cache/persistence authority. |
| Storage refresh asymmetry | `bridge_settings.handleStorageChanges()` returns immediately for a `channelMap`-only change, but treats `videoChannelMap` and `videoMetaMap` as relevant and calls `scheduleSettingsRefreshFromStorage({ forceReprocess:false })` for map-only updates. | Same runtime test. | Channel alias updates and video/meta updates have different refresh behavior, so map-only optimization work needs key-specific proof. |
| StateManager direct channel map write | `persistChannelMap()` lowercases the key/value, patches `state.channelMap`, and writes `{ channelMap: state.channelMap }` directly. | Same runtime test. | Dashboard-side writes bypass the background pending map queue, timer, and compiled-cache patch path. |

## Required Future Authority Before Behavior Changes

No product runtime source currently defines:

```text
learnedIdentityMapCachePersistenceContract
learnedIdentityMapCacheFlushReport
learnedIdentityMapCacheRevisionPolicy
learnedIdentityMapDirectStorageBypassReport
learnedIdentityMapStorageRefreshPolicy
learnedIdentityMapCompiledCachePatchReport
learnedIdentityMapProducerReceiverParityReport
learnedIdentityMapFixtureProvenance
learnedIdentityMapMetricArtifact
```

## Current Verdict

```text
Learned identity map cache persistence is proof-pinned.
Map producers, content helpers, page-message receivers, background queues, storage flush timers, compiled cache patching, and map-only refresh behavior do not share one cache persistence report.
Runtime behavior changed only for duplicate learned-map page-message rows and
no-op learned-identity stamp reruns: the content-side helpers now return
changed-row results, unchanged video rows do not schedule no-op DOM work, and
the video-channel batch receiver owns one rerun instead of also using per-stamp
fallback timers.
```

This does not close learned identity, JSON-first, storage/cache, settings-mode,
DOM-stamp, DOM fallback rerun, false-hide/leak, performance, code-burden,
cross-feature, or implementation-change rows. It adds current-behavior evidence
only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this learned identity map cache persistence
boundary can support runtime optimization or JSON-first promotion. Current
proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
