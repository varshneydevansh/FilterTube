# FilterTube P0 Mutation / Revision Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice isolates the generic P0 mutation family from the broader
message-sender and settings-lock slices. It focuses on lost writes,
destructive list migration, caller-owned runtime cache payloads, and V3-to-V4
profile migration. These are the settings-shape risks that must be understood
before simultaneous allow/block, stale-alias cleanup, Nanah import cleanup, or
runtime performance fixes.

Runtime proof: `tests/runtime/p0-mutation-current-behavior.test.mjs`

## P0 Fixture Family Covered

```text
P0 mutation:
  set_list_mode_copy_false_does_not_clear_blocklist
  apply_settings_payload_cannot_override_background_revision
  two_mutations_during_save_are_not_dropped
  v3_to_v4_preserves_modes_and_whitelists
```

The first two fixture names overlap with the first message/mutation proof
slice. They are repeated here because this family needs one mutation/revision
authority independent of sender trust. The current tests intentionally pin
where today's source is weaker, split, or missing a structured mutation report.

## Current Behavior Matrix

| P0 fixture | Current behavior | Current proof | Future expectation |
| --- | --- | --- | --- |
| `set_list_mode_copy_false_does_not_clear_blocklist` | `FilterTube_SetListMode` parses `copyBlocklist`, but switching to whitelist still calls `mergeAndClearBlocklistIntoWhitelist(requestedProfile)` unconditionally. That helper moves blocklist rows into whitelist rows and clears the source blocklist arrays. | `tests/runtime/p0-mutation-current-behavior.test.mjs`; `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Mode switching should produce a dry-run mutation plan and should not clear or move lists unless the user-selected plan explicitly says so. |
| `apply_settings_payload_cannot_override_background_revision` | `FilterTube_ApplySettings` accepts caller-provided settings only as an invalidation signal, clears `compiledSettingsCache[targetProfile]`, recompiles from storage, and broadcasts background-compiled settings. It still has no sender guard or revision report. | `tests/runtime/p0-mutation-current-behavior.test.mjs`; `tests/runtime/p0-message-mutation-current-behavior.test.mjs` | Callers may request refresh, but sender class, background-owned compiled settings, and revision must remain runtime truth. |
| `two_mutations_during_save_are_not_dropped` | `StateManager.saveSettings()` returns immediately when `isSaving` is true. There is no pending-save flag, queued mutation snapshot, retry, merge, or mutation revision for the skipped save. | `tests/runtime/p0-mutation-current-behavior.test.mjs` | A second mutation during a save must be queued, merged, or retried with a visible mutation result so UI edits cannot disappear silently. |
| `v3_to_v4_preserves_modes_and_whitelists` | `settings_shared.js` read-path V3-to-V4 migration builds a default V4 profile with Main mode `blocklist`, Kids mode `blocklist`, and empty whitelist arrays. It reads legacy Kids blocklists, but does not preserve legacy Main/Kids whitelist modes or whitelist rows in that migration path. | `tests/runtime/p0-mutation-current-behavior.test.mjs` | V3-to-V4 migration should preserve list modes, blocklists, whitelists, profile policy, and a migration revision/report for every affected profile. |

## Why This Matters

```text
UI edit or sync/import payload
        |
        +--> SettingsAPI.saveSettings()
        |       \--> returns if isSaving, no queued mutation
        |
        +--> background SetListMode
        |       \--> mode change + destructive list movement + cache invalidation
        |
        +--> background ApplySettings
        |       \--> caller payload becomes compiled cache truth
        |
        +--> read-path V3->V4 migration
                \--> writes default V4 shape while dropping mode/allow rows
```

This is the same disease that shows up as whitelist drift, stale aliases,
unexpected hides, and old-user migration risk. If implementation starts by
optimizing DOM work or adding simultaneous allow/block rows, those changes can
still lose or rewrite settings through these sibling mutation paths.

## Required Future Mutation / Revision Contract

Every settings/profile mutation needs one report:

```text
mutationAuthority
  -> actor and sender class
  -> source surface and user action
  -> active profile and target profile
  -> viewing space and list target
  -> operation type
  -> before snapshot revision
  -> normalized input and sanitizer used
  -> dry-run mutation plan for destructive moves
  -> queued/merged/retried save status
  -> storage keys touched
  -> background compile/cache revision
  -> broadcast scope
  -> backup/import/Nanah side effects
  -> after snapshot revision
  -> rollback or partial-failure result
```

## Current Verdict

```text
P0 mutation/revision slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
```

Related artifacts:

- `docs/audit/FILTERTUBE_P0_MESSAGE_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_SETTINGS_MUTATION_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_P0_STORAGE_CACHE_CURRENT_BEHAVIOR_2026-05-19.md`
- `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`
- `docs/audit/FILTERTUBE_UNIFIED_MUTATION_CONTRACT_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_P0_FIXTURE_GATE_REGISTER_2026-05-18.md`

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 mutation/revision gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
