# FilterTube Compiled Cache Authority Current Behavior - 2026-05-19

Status: audit-only proof. Runtime behavior is unchanged.

This slice pins the current compiled settings cache behavior in the background
script. It is separate from the broader storage-key slice because the cache is
the runtime authority returned to content scripts and apps when they ask for
compiled settings.

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

Confusing states can happen when:

- the UI appears empty but a stale compiled cache still contains old rules,
- a settings refresh returns cached data without proving which storage revision
  it came from,
- caller-pushed settings now trigger a background recompile but still lack a
  sender/revision report,
- learned identity map writes patch cached settings outside the normal compiler,
- or only one layer invalidates while another layer keeps an older active-state
  view alive.

The current source has no `compiledCacheAuthority`, no `compiledSettingsRevision`,
and no cache entry object that records source, active profile id, storage keys,
or dirty-key provenance.

## Current Flow

```text
compiledSettingsCache = { main: null, kids: null }
        |
        +--> getCompiledSettings(profileType, forceRefresh?)
        |       |
        |       +--> if cache exists and forceRefresh is false, return cache
        |       +--> otherwise read storage, compile, assign cache[targetProfile]
        |
        +--> runtime getCompiledSettings message
        |       |
        |       +--> if cache exists and request.forceRefresh is false, send cache
        |       +--> otherwise call getCompiledSettings(), then assign cache again
        |
        +--> FilterTube_ApplySettings
        |       |
        |       +--> clears cache[targetProfile], recompiles from storage, broadcasts compiledSettings
        |
        +--> learned map writers
                |
                +--> mutate channel/video/meta maps inside existing cache objects
```

## Proven Current Behaviors

| Behavior | Source proof | Risk |
| --- | --- | --- |
| Cache shape is only `main` and `kids`. | `js/background.js:1288` | Active profile identity, viewing space, revision, and storage source are not part of cache identity. |
| Compiler returns cache before storage read. | `js/background.js:1774-1781` | A cached entry can bypass storage inspection when `forceRefresh` is false. |
| Message handler also returns cache before compiler. | `js/background.js:3242-3250` | There are two cache-return gates before storage read. |
| Compiler writes cache internally. | `js/background.js:2555-2560` | Compile and cache assignment are coupled. |
| Message handler writes cache after compiler. | `js/background.js:3254-3262` | The same compile request can assign cache in two places. |
| UI/caller-pushed settings recompile cache. | `js/background.js:4395-4422` | Caller payload no longer becomes cache truth, but this path still lacks sender and revision proof. |
| Learned map writers patch cache entries. | `js/background.js:1495-1512`, `js/background.js:1648-1671`, `js/background.js:1673-1712` | Cache can change without a full compile or revision report. |
| Storage invalidation is broad but incomplete. | `js/background.js:4484-4521` | Background invalidates on some keys and recompiles both surfaces, but misses some compiler dependencies already pinned by storage-key proof. |

## Current Behavior Fixtures

| Fixture | What it pins |
| --- | --- |
| `compiled_cache_doc_lists_current_cache_authorities` | This doc remains audit-only and records the cache authority gap. |
| `compiled_cache_shape_is_surface_only_without_revision` | Cache identity is `{ main, kids }`, not active profile/revision/source. |
| `compiled_cache_getter_returns_cache_before_storage_read` | `getCompiledSettings()` returns cache before reading storage when not forced. |
| `compiled_cache_runtime_message_has_second_cache_gate` | Runtime message handling repeats the cache-return gate and then writes cache. |
| `compiled_cache_compiler_and_message_handler_both_assign_cache` | Cache assignment occurs both in compiler and message response path. |
| `compiled_cache_apply_settings_recompiles_background_payload` | `FilterTube_ApplySettings` clears the target cache, recompiles from storage, and broadcasts background-compiled settings. |
| `compiled_cache_learned_map_writers_patch_cached_objects` | Channel/video/meta map writers mutate existing compiled cache objects. |
| `compiled_cache_storage_invalidation_recompiles_without_revision_report` | Storage invalidation nulls both caches and recompiles without a revision report. |

## Stabilization Implication

Before changing no-work performance, whitelist/blocklist behavior, app parity,
or settings refresh policy, the future implementation should introduce a cache
authority report:

```text
compiledCacheAuthority.report({
  cacheKey,
  source: "storage-compile" | "ui-push" | "learned-map-patch",
  activeProfileId,
  profileType,
  storageRevision,
  dirtyKeys,
  activeRuleSummary,
  mapOnlyPatch,
  returnedWithoutStorageRead,
  forceRefresh,
  compiledSettingsRevision
})
```

Only after that report exists should runtime patches rely on cached no-work
claims or clear stale aliases.
