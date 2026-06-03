# FilterTube P0 Storage / Cache Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

## Why This Slice Exists

Storage/cache authority is one of the strongest explanations for confusing
states such as:

- UI lists look empty, but runtime still sees old aliases or compiled state.
- A map-only identity write refreshes one layer but not another.
- Import, Nanah, or profile migration writes V4 state without the same revision
  report used by normal UI saves.
- A performance patch clears one observer or cache while another owner keeps the
  same work alive.

The current product has no `storageKeyAuthority` source token and no shared
storage revision report. Each layer decides independently which keys matter.

## Current Owner Split

```text
storage.local
      |
      +--> background compiler reads broad settings, maps, stats, V3, V4
      +--> background invalidation watches a narrower relevantKeys list
      +--> content bridge refresh watches maps and many runtime flags
      +--> StateManager reload watches a third UI-oriented list
      +--> settings_shared load/save reads/writes profile/settings state
      +--> IO import/export writes V3/V4/channelMap
      +--> Nanah scoped apply writes V4 profile state directly
```

This split is not automatically wrong, but it is not yet proof-backed by a
single key classification, cache invalidation, DOM refresh, dashboard reload,
backup trigger, and revision model.

## Current Behavior Fixtures

| Fixture | Current behavior pinned | Test proof | Future gate |
| --- | --- | --- | --- |
| `storage_key_background_invalidation_covers_compiler_dependencies` | Background compiler reads keys that background invalidation omits, including `enabled`, `categoryFilters`, `videoChannelMap`, `videoMetaMap`, exact-match/channel-derived keyword flags, quick/menu flags, and watch/player flags. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Compiler dependency changes need one invalidation policy or explicit owner saying why another layer owns refresh. |
| `storage_key_content_bridge_map_only_refresh_policy_is_named` | Content bridge locally treats `channelMap`, `videoChannelMap`, and `videoMetaMap` as map-only cases, but the policy is not shared with background or StateManager. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Map-only refresh needs one named policy with cache and DOM reprocess outcome. |
| `storage_key_state_manager_reload_keys_match_ui_claims` | StateManager reload watches `stats` and `channelMap` but omits `videoChannelMap`, `videoMetaMap`, `contentFilters`, `categoryFilters`, exact-match/channel-derived keyword flags, and `statsBySurface`. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Dashboard/settings UI reload keys must match the UI state it claims to display. |
| `storage_key_settings_shared_load_keys_are_classified` | `settings_shared.loadSettings()` loads UI settings/profile keys and can expose `statsBySurface`/`channelMap`, but it does not share the background compiler or content bridge key policy. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Shared settings load keys need owner/schema/surface classification. |
| `storage_key_video_channel_map_change_has_cache_and_dom_policy` | Background merges pending `videoChannelMap` updates into compiled settings before storage flush; content bridge map-only changes refresh settings but suppress forced DOM reprocess. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Video-channel maps need explicit cache, storage flush, and DOM reprocess policy. |
| `storage_key_video_meta_map_change_has_cache_and_dom_policy` | Background maintains pending `videoMetaMap` updates and compiled cache; content bridge suppresses forced DOM reprocess for map-only metadata changes. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Video metadata maps need explicit cache, flush, TTL, and DOM refresh policy. |
| `storage_key_stats_by_surface_change_refreshes_dashboard` | Dashboard settings can read `statsBySurface`, but StateManager external reload watches legacy `stats` and omits `statsBySurface`. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Surface-scoped stats changes need dashboard reload proof. |
| `storage_key_channel_map_only_change_does_not_force_dom_reprocess` | Content bridge returns on `channelMap`-only changes before settings refresh/DOM reprocess. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | This optimization should be a named policy, not a local special case. |
| `storage_key_read_path_write_reports_migration_revision` | `settings_shared.loadSettings()` and `io_manager.loadProfilesV4()` can write V4 profile state during read/load paths without a shared migration revision report. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Read-path migrations need a mutation report and revision. |
| `storage_key_import_nanah_profile_write_reports_target_profile_revision` | IO import and Nanah scoped apply write V4 profile state through `saveProfilesV4()` without one shared target-profile revision report. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Import/Nanah profile writes need target profile, actor, revision, and broadcast-scope proof. |
| `storage_key_unknown_key_is_ignored_with_no_runtime_reprocess` | Unknown keys fall outside local relevant-key arrays; there is no shared unknown-key report proving no runtime reprocess across owners. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Unknown keys need explicit no-op classification. |
| `storage_key_raw_capture_evidence_never_becomes_storage_authority` | Ignored root capture files remain evidence only; they are not storage keys or runtime storage authority. | `tests/runtime/p0-storage-cache-current-behavior.test.mjs` | Raw captures must stay out of product storage/source/release paths. |

## Required Future Contract

Future token: `storageKeyAuthority`

```text
storageKeyAuthority.report({
  key,
  actor,
  owner,
  schema,
  targetProfile,
  targetSurface,
  cacheInvalidation,
  contentRefresh,
  dashboardReload,
  forceDomReprocess,
  backupTrigger,
  revision,
  rawCaptureExcluded
})
```

The first implementation step later should be a read-only report/classifier, not
behavior changes. Runtime changes should wait until positive and negative
fixtures can flip one storage/cache decision at a time.

## Current Verdict

```text
P0 storage/cache slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
