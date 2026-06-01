# FilterTube P0 Backup / Export Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts the P0 backup/export fixture family from the
implementation-readiness gate into runnable proof. The purpose is to keep
backup, import, encrypted export, Nanah trusted-device restore, and post-mutation
refresh from becoming independent mutation authorities.

Runtime proof:

```text
tests/runtime/p0-backup-export-current-behavior.test.mjs
```

## Source Surface

| Source | Current role |
| --- | --- |
| `js/state_manager.js:27-57` | Schedules post-mutation auto-backup through the background action, with IO-manager fallback. |
| `js/background.js:782-902` | Background auto-backup implementation with profile-label folders, optional PIN/session encryption, latest/history filename policy, and debounced scheduling. |
| `js/background.js:3950-3960` | `FilterTube_ScheduleAutoBackup` message accepts caller-provided trigger, options, and numeric delay. |
| `js/io_manager.js:1760-1986` | Separate IO-manager auto-backup implementation with its own plain JSON filename, directory probe, schedule timer, and rotation path. |
| `js/tab-view.js:9053-9410` | Manual export/import UI gates child profiles, Master PIN, encrypted export password, encrypted import password, and Nanah trusted-device restore choice. |
| `js/content_bridge.js:12754-12839` | Content-script channel-add path schedules backup after the background channel mutation succeeds. |
| `js/nanah_sync_adapter.js:168-251` | Scoped Nanah apply writes profile sections directly through `saveProfilesV4()`. |

## Current Behavior Matrix

| P0 fixture | Current result | Evidence | Risk |
| --- | --- | --- | --- |
| `backup_schedule_rejects_untrusted_sender_or_non_internal_actor` | Not satisfied. | `FilterTube_ScheduleAutoBackup` schedules directly and does not check sender class or trusted UI. | Any caller that reaches the message can ask the background to schedule backup work. |
| `backup_schedule_clamps_delay_to_known_range` | Not satisfied. | Delay is accepted when finite and passed to `setTimeout()` without min/max clamp. | Extreme or negative delays can change runtime timing and hide bugs in tests. |
| `backup_schedule_dedupes_same_mutation_trigger` | Partially satisfied by one timer only. | The background clears the previous timer and overwrites one pending trigger/options object. | Different mutations can collapse into one trigger, while duplicate same-mutation proof is absent. |
| `backup_auto_encryption_policy_matches_manual_export_policy` | Not satisfied. | Background auto-backup uses `autoBackupFormat` plus active profile PIN/session PIN; manual encrypted export prompts for a password/PIN. IO auto-backup is plain JSON. | Users can see different encryption behavior depending on which backup path ran. |
| `backup_auto_missing_session_pin_reports_visible_skip` | Not satisfied. | Background auto-backup returns `missing_session_pin`, but the scheduler only awaits it and logs thrown failures. | Auto-backup can silently skip encrypted backup when the session PIN is unavailable. |
| `backup_io_and_background_paths_share_one_filename_policy` | Not satisfied. | Background uses `FilterTube Backup/{label}/FilterTube-Backup-Latest.*` or timestamp history; IO uses `FilterTube-Backup-{label}-{timestamp}.json`. | Documentation, release QA, and user expectations can drift across backup paths. |
| `backup_rotation_policy_does_not_claim_file_deletion_without_remove_proof` | Satisfied as a current limitation. | Both rotation paths call `downloads.erase`, not `downloads.removeFile` or filesystem deletion. | Product copy must not claim old backup files are deleted from disk. |
| `backup_directory_probe_does_not_write_test_file_per_backup` | Not satisfied in IO path. | IO auto-backup calls `getBackupDirectory()`, which writes `FilterTube Backup/.test` through the downloads API. | A backup can create extra download churn before the real backup. |
| `backup_manual_export_child_gate_and_master_pin_gate_are_consistent` | Manual UI only; not a shared contract. | Manual export/import has child and Master PIN gates, while background schedule and IO auto-backup do not share those UI gate helpers. | Future backup entrypoints can bypass the same visible protection policy. |
| `backup_import_encrypted_and_plain_share_target_profile_contract` | Not satisfied. | `importV3()` accepts `targetProfileId`; `importV3Encrypted()` does not and calls `importV3(decrypted, { strategy, scope, auth })`. | Encrypted and plain import helpers can diverge for profile-scoped restore. |
| `backup_trusted_nanah_restore_requires_explicit_same_device_choice` | UI choice exists, same-device proof does not. | Tab-view asks whether to restore trusted devices and recommends settings-only; IO restore only checks `auth.restoreTrustedNanahState === true`. | A choice can intentionally restore trust, but there is no same-device token or fingerprint proof. |
| `backup_after_import_or_nanah_apply_refreshes_compiled_runtime_revision` | Not satisfied. | Tab-view reloads settings after import, but IO import and Nanah scoped apply do not emit a compiled runtime revision/mutation report. | Web/runtime views can retain stale compiled rules after import or Nanah apply unless another refresh path happens. |

## Why This Blocks Behavior Changes

Backup/export is not just file IO. It is a settings/profile mutation surface:

```text
rule/profile mutation
        |
        +--> schedule backup
        +--> choose backup authority path
        +--> maybe encrypt
        +--> write download
        +--> maybe import later
        +--> maybe restore Nanah trust
        +--> maybe refresh runtime settings
```

If these steps remain split, fixes for filtering can still be undermined by stale
compiled state, wrong target profile restore, silent encrypted auto-backup skips,
or duplicate post-mutation side effects.

## Required Future Contract

Before changing backup/export behavior, add one backup authority:

```text
backupExportAuthority({
  actorClass,
  senderClass,
  trigger,
  mutationId,
  targetProfileId,
  scope,
  unlockState,
  encryptionPolicy,
  nanahTrustPolicy,
  filenamePolicy,
  rotationPolicy,
  delayPolicy,
  postApplyRuntimeRevision,
  visibleResult
})
```

The authority should decide whether a schedule request is trusted, how trigger
dedupe works, whether delay is clamped, which backup path owns filenames and
encryption, whether Nanah trust restore is allowed, and how compiled runtime
state is refreshed after import or sync.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add counters/logging around schedule requests and backup skips,
- add no-op mutation ids/revision ids for measurement,
- document exact file deletion limits.

Blocked now:

- changing backup encryption defaults,
- changing filename or rotation behavior,
- changing Nanah trusted-device restore,
- changing import target profile behavior,
- changing auto-backup scheduling,
- changing post-import runtime refresh semantics.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
