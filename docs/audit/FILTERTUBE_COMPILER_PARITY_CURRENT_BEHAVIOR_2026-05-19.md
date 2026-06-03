# FilterTube Compiler Parity Current Behavior - 2026-05-19

Status: audit-only proof. Runtime behavior is unchanged.

This slice pins the current split between the UI/shared settings compiler,
StateManager state loading, and the background runtime compiler. It is separate
from the compiled-cache slice: cache authority says which compiled object is
returned; compiler parity says whether all code paths build the same runtime
meaning in the first place.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Why This Matters

FilterTube currently has more than one place that can turn stored settings into
runtime settings:

- `settings_shared.js` has `buildCompiledSettings()` for UI save paths.
- `settings_shared.js` `loadSettings()` reads UI state and can also write
  profile migrations during a read.
- `state_manager.js` loads the shared settings state, then overlays profile V3/V4
  Main/Kids state and later broadcasts shared-compiled payloads after saves.
- `background.js` has `getCompiledSettings()` for runtime filtering. It reads
  more storage keys, derives Main/Kids list modes, merges `syncKidsToMain`
  lists, includes learned identity maps, and can write migrations while
  compiling.
- `FilterTube_ApplySettings` now treats caller-provided compiled payloads as an
  invalidation signal and broadcasts a background-compiled payload.

That means an apparently simple state such as "empty visible Main blocklist" can
still have a different runtime meaning depending on whether the payload came
from UI save, background compile, cached settings, learned-map patching, or
read-path migration.

The current source has no `compilerParityAuthority`, no shared compiled schema
version, and no report proving that UI-compiled and background-compiled payloads
contain the same fields or active-rule meaning.

## Current Flow

```text
UI state
  |
  +--> settings_shared.loadSettings()
  |       |
  |       +--> reads SETTINGS_KEYS + theme/backup + ftProfilesV3/V4
  |       +--> may write ftProfilesV4 during migration/fill-in
  |       +--> returns UI state, not a background-equivalent compiled payload
  |
  +--> StateManager.loadSettings()
  |       |
  |       +--> loads shared settings
  |       +--> separately loads profiles V3/V4
  |       +--> overlays Main/Kids modes and lists onto UI state
  |
  +--> StateManager.saveSettings()
          |
          +--> SettingsAPI.saveSettings()
          |       |
          |       +--> settings_shared.buildCompiledSettings()
          |       +--> returns shared-compiled payload
          |
          +--> broadcastSettings(result.compiledSettings)
                  |
                  +--> background FilterTube_ApplySettings
                          |
                          +--> background recompile becomes cache/broadcast settings

background getCompiledSettings()
  |
  +--> reads broader runtime dependency set
  +--> derives listMode/profileType
  +--> compiles whitelist arrays
  +--> merges syncKidsToMain lists
  +--> adds channelMap/videoChannelMap/videoMetaMap
  +--> writes migrations and channel-derived keywords on the read path
```

## Proven Current Behaviors

| Behavior | Source proof | Risk |
| --- | --- | --- |
| Shared compiler emits a smaller runtime object. | `js/settings_shared.js:484-560` | UI save payload lacks background-only fields such as `listMode`, `profileType`, whitelist arrays, and learned identity maps. |
| Background compiler derives profile/list-mode meaning. | `js/background.js:1962-2012` | Runtime mode can be based on V4 profile state that the shared compiler does not encode. |
| Background compiler merges `syncKidsToMain` state. | `js/background.js:1981-2009`, `js/background.js:2057-2069` | Main runtime lists can include Kids rules depending on mode/sync state; UI compiler has no matching merge report. |
| Background compiler includes learned identity maps. | `js/background.js:2408-2425` | Runtime filtering can depend on map state that shared compiler never emits. |
| Background compiler can write during a read. | `js/background.js:1966-2080`, `js/background.js:2348-2398` | A read/compile can mutate profiles or channel-derived keywords before a separate mutation authority exists. |
| Shared settings load can write during a read. | `js/settings_shared.js:647-684` | UI read can repair/migrate profile settings without the same report used by background compile. |
| StateManager overlays profiles after shared load. | `js/state_manager.js:188-352` | UI-visible state is not exactly the shared `loadSettings()` result and is not the background compiled result either. |
| StateManager broadcasts shared-compiled payloads. | `js/state_manager.js:1019-1058`, `js/state_manager.js:1209-1215` | Shared-compiled payloads flow into background `FilterTube_ApplySettings` as refresh triggers; sender/revision parity still needs proof. |

## Current Behavior Fixtures

| Fixture | What it pins |
| --- | --- |
| `compiler_parity_doc_lists_current_compiler_authorities` | This doc remains audit-only and records the compiler parity gap. |
| `compiler_parity_shared_compiler_emits_smaller_payload` | Shared compiler does not emit background-only runtime fields. |
| `compiler_parity_background_compiler_derives_profile_mode_and_whitelist` | Background compiler emits `listMode`, `profileType`, and whitelist state. |
| `compiler_parity_background_merges_sync_kids_to_main` | Background compiler has Main/Kids sync merge logic absent from the shared compiler. |
| `compiler_parity_background_includes_learned_identity_maps` | Background compiled settings include learned identity maps. |
| `compiler_parity_read_paths_can_write_profiles` | Both shared load and background compile can write profile state while reading/compiling. |
| `compiler_parity_state_manager_overlays_profile_state_after_shared_load` | StateManager transforms shared-loaded state with V3/V4 profile data. |
| `compiler_parity_state_manager_broadcast_triggers_background_recompile_path` | Shared-compiled payload broadcasts trigger background recompilation through `FilterTube_ApplySettings`. |

## Stabilization Implication

Before changing no-work behavior, stale alias cleanup, simultaneous allow/block
semantics, or UI/runtime refresh behavior, the future implementation should
introduce one compiler parity report:

```text
compilerParityAuthority.report({
  source: "background" | "shared-ui" | "state-manager" | "import" | "nanah",
  compiledSchemaVersion,
  activeProfileId,
  profileType,
  viewingSpace,
  listMode,
  syncKidsToMain,
  blocklistCounts,
  whitelistCounts,
  learnedMapCounts,
  contentFilterActiveState,
  categoryFilterActiveState,
  storageRevision,
  mutationDuringRead,
  omittedRuntimeFields,
  broadcastTarget,
  cacheSource
})
```

Only after that report exists should the code rely on a compiled no-work claim
or accept a caller-provided compiled payload as equivalent to background storage
truth.
