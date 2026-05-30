# FilterTube Backup Download Blob URL Lifecycle Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation patch.
Runtime behavior is unchanged.

This slice pins the current backup/export download lifecycle around JSON
stringification, Blob construction, object URL creation, delayed object URL
revocation, browser downloads API branches, dashboard anchor fallback, IO
directory probing, and download-history rotation. It extends backup/export,
storage/cache, import/export, extension UI, browser permission, performance,
reliability, code-burden, cross-feature, and implementation-change rows.

Runtime proof:

```text
tests/runtime/backup-download-blob-url-lifecycle-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6,313 | 284,710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |
| `js/io_manager.js` | 2,030 | 96,914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `js/tab-view.js` | 11,617 | 526,763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes | SHA-256 |
| --- | --- | ---: | ---: | ---: | --- |
| `backgroundRevokeBlobUrl` | `js/background.js:725` | 725 | 10 | 298 | `d85a173fda417aca64d0b6f1be00d529f092e402e5757996ba306e9977337142` |
| `backgroundDownloadWithBrowserApi` | `js/background.js:735` | 735 | 47 | 1,804 | `4960a2ef5ddf331992a6710efa0401f083cb81d3708747010d2b0e70b2f65819` |
| `backgroundAutoBackupBlobDownload` | `js/background.js:848` | 848 | 16 | 637 | `d49b03990155d3ee85efc9a9862d168bbc316fbd8d7655eaecdc4b7000369475` |
| `ioRevokeDownloadBlobUrl` | `js/io_manager.js:48` | 48 | 9 | 330 | `3795b2ece3edfcc4980ed14742a82bacae310a5e9b876017536d4240403a2891` |
| `ioDownloadWithRuntimeApi` | `js/io_manager.js:58` | 58 | 46 | 1,988 | `d936f57b125a029f0e08efa03570ce11e23952a52498a395e8fa13f5cfaaa55e` |
| `ioDirectoryProbeDownload` | `js/io_manager.js:1875` | 1875 | 40 | 1,791 | `e49ec15eeb2a71db8778bb14ef1b49157b21aa836f201bddb7024495e6072882` |
| `ioSaveBackupFile` | `js/io_manager.js:1922` | 1922 | 29 | 1,269 | `162e600e6ecb4c9e86195f7bb1d363828182329079336bf9084fb47bae508b20` |
| `tabRevokeBlobUrl` | `js/tab-view.js:9038` | 9038 | 10 | 363 | `5c7be08580711c5ee2c0b3032728069e36dba664e228bdc8ac3d324d1f272f70` |
| `tabDownloadViaAnchor` | `js/tab-view.js:9053` | 9053 | 26 | 956 | `6f04762a80c47f638df2adb986fb8ea0d376801426e095ecc285fe351b2405c5` |
| `tabDownloadJsonToDownloadsFolder` | `js/tab-view.js:9080` | 9080 | 40 | 2,028 | `95b1310ddf6fe63a1e058f1916c17506fb7d6e9868c4d0229f246becd61a74e1` |

## Selected Token Counts

```text
backup download blob URL lifecycle source files pinned | 3
backup download blob URL lifecycle source/effect blocks pinned | 10
selected URL.createObjectURL tokens | 6
selected URL.revokeObjectURL tokens | 6
selected Blob([ tokens | 4
selected downloads.download tokens | 8
selected downloads.search tokens | 3
selected downloads.erase tokens | 3
selected setTimeout tokens | 26
selected downloadViaAnchor tokens | 3
selected data:application/json tokens | 1
background URL.createObjectURL tokens | 2
background data:application/json tokens | 1
io_manager URL.createObjectURL tokens | 2
tab-view URL.createObjectURL tokens | 2
tab-view document.createElement('a') tokens | 2
tab-view document.body.appendChild(a) tokens | 1
tab-view document.body.removeChild(a) tokens | 1
selected removeFile tokens | 0
selected clearObjectUrl tokens | 0
```

## Runtime Fixtures Pinned

```text
backup_download_blob_url_lifecycle_doc_records_audit_only_boundary
source_fingerprints_for_backup_download_blob_url_files_remain_current
source_effect_block_metrics_for_backup_download_blob_url_paths_remain_current
selected_backup_download_blob_url_token_counts_remain_current
background_download_lifecycle_keeps_current_object_url_and_api_branch_behavior
io_manager_download_lifecycle_keeps_probe_and_save_behavior
tab_view_download_lifecycle_keeps_anchor_fallback_and_delayed_cleanup_behavior
backup_download_blob_url_lifecycle_authority_symbols_are_absent_from_selected_runtime_source
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before backup/export or optimization changes |
| --- | --- | --- | --- |
| Background object URL cleanup | Background auto-backup creates an object URL when `URL.createObjectURL` exists, otherwise uses a `data:application/json` URL. It schedules revocation only after `downloadWithBrowserApi()` resolves. | `backgroundAutoBackupBlobDownload` and `backgroundRevokeBlobUrl`. | If a downloads API call never settles, the object URL cleanup path has no timeout/finally owner. The `data:` fallback has no equivalent URL lifecycle work. |
| Background downloads API wrapper | Background wrapper has a Firefox promise branch, a Chrome callback branch, runtime-lastError handling, and a `settled` guard. | `backgroundDownloadWithBrowserApi`. | Download result shape is source-local and not a shared backup download report. |
| IO Manager object URL cleanup | IO Manager has its own delayed revoke helper and downloads wrapper with similar but not identical error strings. | `ioRevokeDownloadBlobUrl` and `ioDownloadWithRuntimeApi`. | Background and IO download wrappers can drift in error classification, timeout behavior, and cleanup policy. |
| IO directory probe | `getBackupDirectory()` writes `FilterTube Backup/.test` through a Blob object URL, revokes the URL after the download result, and erases the download history entry when the id is numeric. | `ioDirectoryProbeDownload`. | Directory probing creates download churn before the real backup and does not prove filesystem cleanup. |
| IO backup save | `saveBackupFile()` stringifies the full backup, creates a Blob object URL before directory probing, downloads to the computed path, and revokes after the download result. | `ioSaveBackupFile`. | Object URL lifetime includes directory probe time and lacks a shared timeout/error report. |
| Dashboard anchor fallback | `downloadViaAnchor()` creates an object URL, creates a hidden anchor, clicks it, removes the anchor after 2000 ms, schedules object URL revoke after 60000 ms, and resolves after 250 ms. | `tabDownloadViaAnchor`. | Anchor success is time-based rather than confirmed by a download result, and cleanup is split between DOM removal and URL revoke timers. |
| Dashboard downloads API fallback | `downloadJsonToDownloadsFolder()` uses anchor fallback when preferred or when downloads API is absent. For downloads API lastError, it revokes the API object URL and starts a second anchor object URL. | `tabDownloadJsonToDownloadsFolder`. | Manual export can allocate two object URLs for one attempted download, with separate cleanup owners and user-visible method copy. |
| Rotation/deletion wording | Selected sources use `downloads.erase` and have 0 `removeFile` tokens. | Selected token counts. | Product copy and future cleanup must not claim filesystem deletion without an explicit remove-file proof path. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
backupDownloadBlobUrlLifecycleContract
backupDownloadObjectUrlRegistry
backupDownloadRevokePolicy
backupDownloadApiResultReport
backupDownloadAnchorFallbackPolicy
backupDownloadProbePolicy
backupDownloadFilesystemDeletionProof
backupDownloadTimeoutBudget
backupDownloadErrorClassificationReport
backupDownloadCleanupMetricArtifact
```

## Current Verdict

```text
Backup download Blob URL lifecycle behavior is proof-pinned.
Background, IO Manager, and tab-view currently own separate download, fallback, and cleanup policies.
Runtime behavior remains unchanged.
```

This does not close backup/export, storage/cache, import/export, extension UI,
browser permission, performance, reliability, code-burden, cross-feature, or
implementation-change rows. It adds current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
