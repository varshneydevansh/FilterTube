# FilterTube Backup And Export Authority Audit - 2026-05-18

Status: audit artifact only. This file does not change extension, website, or
runtime behavior.

This pass separates backup/export/import surfaces from the broader Nanah/import
audit because backups are a user-data and release-trust boundary. A backup path
can write files, encrypt or skip encryption, restore profile state, restore
Nanah trusted-device state, schedule delayed work, rotate download history, and
touch rule state after ordinary row edits. Those side effects need one authority
before implementation cleanup.

## Current Authority Split

```text
StateManager row/settings mutations
        |
        +--> chrome.runtime.sendMessage(FilterTube_ScheduleAutoBackup)
        |       |
        |       v
        |   background scheduleAutoBackupInBackground()
        |       |
        |       +--> debounce timer
        |       +--> optional post-block enrichment wait
        |       +--> createAutoBackupInBackground()
        |               +--> read settings/profiles/theme
        |               +--> maybe encrypt with session PIN
        |               +--> browser downloads API
        |               +--> latest/history file policy
        |
        +--> window.FilterTubeIO.scheduleAutoBackup()
                |
                v
            io_manager scheduleAutoBackup()
                |
                +--> debounce timer
                +--> createAutoBackup()
                        +--> load settings/profiles
                        +--> plain buildV3Export backup
                        +--> getBackupDirectory test download
                        +--> downloads API silent save
                        +--> rotateBackups()

Manual tab-view export/import
        |
        +--> runExportV3 / runExportV3Encrypted
        |       +--> child gate
        |       +--> optional Master PIN prompt
        |       +--> UI-owned download path with Firefox anchor fallback
        |
        +--> runImportV3FromFile
                +--> child gate
                +--> Default profile gate
                +--> decrypt manually if encrypted
                +--> optional trusted Nanah state restore prompt
                +--> io.importV3()
```

## Source Map

| Surface | Current source | Audit meaning |
| --- | --- | --- |
| StateManager backup scheduler shim | `js/state_manager.js:25-43` | UI mutations schedule background backup through `FilterTube_ScheduleAutoBackup`, or fall back to `window.FilterTubeIO.scheduleAutoBackup`. |
| Background auto-backup implementation | `js/background.js:680-902` | Background owns downloads API save, latest/history filename policy, optional encryption from session PIN, and delayed scheduling. |
| Background schedule message | `js/background.js:3950-3960` | `FilterTube_ScheduleAutoBackup` accepts caller `triggerType`, `delay`, and `options` and schedules backup work. It is not currently guarded by the same trusted UI sender check as some direct whitelist/import paths. |
| Background post-block wait | `js/background.js:904-918` | Channel-add backup triggers can wait for pending post-block enrichment before writing a backup. |
| IO-manager auto-backup implementation | `js/io_manager.js:1755-1988` | IO manager owns a second auto-backup path with its own timer, directory probing, silent save, and rotation logic. |
| IO-manager manual export/import authority | `js/io_manager.js:1128-1748` | Export/import owns profile scope, Master PIN checks, encrypted container handling, V4 writes, and Nanah trusted-state restore. |
| Tab-view manual download/import UI | `js/tab-view.js:9049-9408` | Tab UI owns manual JSON downloads, Firefox anchor fallback, child/default gates, import prompts, and trusted Nanah restore choice. |
| Auto-backup policy UI | `js/tab-view.js:3874-3908`, `10143-10232` | UI toggles backup mode/format directly in V4 profile settings and schedules another backup after the setting write. |
| Content-script channel add backup | `js/content_bridge.js:12754-12839` | Content bridge schedules `channel_added` backup after a successful background channel-add response, while the background handler can also schedule backup for the same mutation. |

## High-Confidence Findings

1. **There are two auto-backup implementations.**
   Background and IO manager both implement scheduling and downloads. Background
   can encrypt auto-backups when the active profile has a PIN and a session PIN
   is cached; IO-manager auto-backup builds a plain V3 export and writes it
   through its own downloads path.

2. **`FilterTube_ScheduleAutoBackup` is a scheduling authority, not just a UI
   notification.**
   The background branch accepts caller `triggerType`, `delay`, and `options`
   and starts a timer. It does not use `isTrustedUiSender(sender)` in that
   branch today, so future hardening needs a sender class or internal-only
   action split.

3. **Backup delay is finite-checked but not range-clamped.**
   The background branch accepts any finite numeric delay. Future behavior
   should clamp or classify delay values so caller payloads cannot force
   immediate or very long scheduler states outside a known policy.

4. **Channel-add backup scheduling can be duplicated.**
   `content_bridge.js` schedules `channel_added` after a successful
   `addFilteredChannel` response, while `background.js` also schedules
   `channel_added` inside the same message-handler family. The background
   debounce collapses many cases, but the authority is still split and the
   final trigger can be overwritten by whichever schedule call lands last.

5. **Background backup encryption depends on session state.**
   If `autoBackupFormat` is `encrypted`, or `auto` with a profile PIN, the
   background path needs a cached session PIN. If no session PIN exists, it
   returns a skipped `missing_session_pin` result instead of writing a backup.

6. **IO-manager backup directory probing writes a test download.**
   `getBackupDirectory()` creates a `FilterTube Backup/.test` download before
   deciding the folder path. `createAutoBackup()` also calls
   `getBackupDirectory()` for metadata and `saveBackupFile()` calls it again
   for the actual save path.

7. **Rotation removes download history entries, not a proven filesystem delete.**
   Both background and IO-manager rotation use `downloads.erase`. That cleans
   download history records; it is not proof that old backup files are removed
   from disk on every browser/platform.

8. **Manual export and auto-backup have different download behavior.**
   Manual tab-view export uses a UI-owned download path and falls back to an
   anchor download on Firefox/Waterfox. Auto-backup uses background/IO silent
   downloads and does not share the same visible save semantics.

9. **Manual import decrypts encrypted payloads in the UI before calling
   `io.importV3()`.**
   This is functional, but it means `io.importV3Encrypted()` remains a separate
   code path with already-documented target-profile forwarding drift. The final
   authority should make encrypted and unencrypted import use one target/profile
   contract.

## Required Future Contract

Before changing backup/export/import behavior, introduce one
`backupExportAuthority` report:

```text
backupExportAuthority = {
  actorClass,
  sourceSurface,
  operation,              // manual_export | encrypted_export | import | auto_backup_schedule | auto_backup_write
  targetProfileId,
  scope,
  requiresUiUnlock,
  requiresMasterPin,
  requiresIncomingBackupPin,
  encryptionPolicy,
  downloadMethod,
  filenamePolicy,
  rotationPolicy,
  triggerType,
  delayMs,
  postMutationRevision,
  trustedNanahRestorePolicy
}
```

The report should be produced for manual exports, encrypted exports, imports,
StateManager-triggered backups, content-script triggered backups, background
internal backups, and any Nanah backup transfer that claims to carry a full
account tree.

## P0 Fixtures Before Behavior Changes

```text
backup_schedule_rejects_untrusted_sender_or_non_internal_actor
backup_schedule_clamps_delay_to_known_range
backup_schedule_dedupes_same_mutation_trigger
backup_auto_encryption_policy_matches_manual_export_policy
backup_auto_missing_session_pin_reports_visible_skip
backup_io_and_background_paths_share_one_filename_policy
backup_rotation_policy_does_not_claim_file_deletion_without_remove_proof
backup_directory_probe_does_not_write_test_file_per_backup
backup_manual_export_child_gate_and_master_pin_gate_are_consistent
backup_import_encrypted_and_plain_share_target_profile_contract
backup_trusted_nanah_restore_requires_explicit_same_device_choice
backup_after_import_or_nanah_apply_refreshes_compiled_runtime_revision
```

## Safe Improvement Direction

The safe direction is not to delete either path immediately. First:

1. Add the report described above without changing behavior.
2. Make background the single auto-backup writer, or make IO manager an adapter
   called by background with the same encryption and filename policy.
3. Keep manual export/import UI separate only for user prompts and visible
   file-picker/download behavior.
4. Route every schedule request through a trusted sender/internal actor gate.
5. Clamp schedule delay and make dedupe policy explicit.
6. Rename rotation copy from "delete old backups" to "erase old download
   records" unless filesystem deletion is proven per browser.

## Fixture

Executable current-behavior proof is in:

```text
tests/runtime/backup-export-authority-current-behavior.test.mjs
```

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
