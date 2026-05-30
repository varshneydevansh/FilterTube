# FilterTube Background Auto Backup Scheduler Boundary Current Behavior - 2026-05-23

Status: current-behavior proof only. This is not an implementation patch,
backup patch, settings patch, security patch, timer patch, optimization patch,
or release packaging patch.

Runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle,
download, backup, build, website, and native sync behavior are unchanged.

## Why This Slice Exists

The background auto-backup scheduler is a cross-feature side-effect path. It can
run after list-mode changes, whitelist imports, single-channel mutations, Kids
mutations, content quick-block flows, profile creation, and settings changes.
It also uses a debounced timer, optional post-block enrichment waiting, browser
downloads, optional PIN/session encryption, and separate dashboard/IO fallback
ownership. This slice pins current behavior before any JSON-first filtering or
whitelist optimization work changes mutation side effects.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |
| `js/tab-view.js` | 11617 | 526763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/io_manager.js` | 2030 | 96914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |

## Source/Effect Blocks Pinned

```text
background auto-backup scheduler source files: 5
background auto-backup scheduler source/effect blocks: 9

background createAutoBackupInBackground block: line 782, 97 lines, 3751 bytes
background scheduleAutoBackupInBackground block: line 879, 25 lines, 863 bytes
background shouldWaitForPostBlockEnrichmentBeforeBackup block: line 904, 8 lines, 376 bytes
background waitForPostBlockEnrichmentBeforeBackup block: line 912, 11 lines, 336 bytes
background FilterTube_ScheduleAutoBackup action block: line 3964, 12 lines, 652 bytes
StateManager scheduleAutoBackup block: line 25, 21 lines, 861 bytes
content_bridge addChannelDirectly block: line 13375, 54 lines, 2662 bytes
tab-view scheduleAutoBackup block: line 3064, 17 lines, 617 bytes
io_manager scheduleAutoBackup block: line 1996, 16 lines, 489 bytes
```

Selected background scheduler tokens in the pinned background blocks:

```text
autoBackupEnabled: 1
autoBackupMode: 2
autoBackupFormat: 2
sessionPinCache: 1
missing_session_pin: 1
FilterTubeSecurity: 1
encryptJson: 2
downloadWithBrowserApi: 1
rotateAutoBackups: 1
setTimeout: 2
clearTimeout: 1
pendingAutoBackupTrigger: 3
pendingAutoBackupOptions: 3
waitForPostBlockEnrichmentBeforeBackup: 2
shouldWaitForPostBlockEnrichmentBeforeBackup: 2
Number.isFinite: 1
isTrustedUiSender: 0
isProfileSessionAuthorized: 0
```

## Current Findings

| Boundary | Current behavior | Risk before optimization | Proof still missing |
| --- | --- | --- | --- |
| Schedule message authority | `FilterTube_ScheduleAutoBackup` accepts caller `triggerType`, object `options`, and any finite numeric `delay`, then schedules the background timer. | A content/UI caller that can reach the action can request backup work; delay has no clamp or sender class contract in the pinned action block. | Sender policy, trigger allowlist, delay clamp, and actor report. |
| Timer coalescing | `scheduleAutoBackupInBackground()` stores one pending trigger/options pair, clears any previous timer, then starts a new timer. | Different mutation triggers can collapse into the last scheduled trigger, so side-effect accounting can lose provenance. | Per-mutation revision/report and dedupe policy. |
| Post-block wait | Channel-added style triggers wait for pending post-block enrichment unless `options.waitForPostBlockEnrichment === false`. | Backup timing depends on enrichment state outside the backup owner and can delay up to the wait budget. | Enrichment wait budget and completion metric. |
| Encrypted auto backup | `createAutoBackupInBackground()` encrypts when format requires it or profile PIN exists; if no session PIN is cached it returns `missing_session_pin`. | Encrypted auto-backup can skip silently from the scheduler path unless a caller separately surfaces the result. | Visible skip report and encryption-policy parity with manual export. |
| Download and rotation | Background auto-backup writes through browser downloads and rotates history backups after a successful history-mode download. | Download and rotation are side effects of rule/list/profile mutations but are not represented in one mutation report. | Download/rotation result report and byte budget. |
| Split scheduling owners | StateManager and content bridge send `FilterTube_ScheduleAutoBackup`; tab-view has another runtime scheduler; IO manager has a separate local timer/download implementation. | One user mutation can schedule backup work through more than one owner or fallback path. | Split-owner report and one backup side-effect contract. |

## Non-Completion Boundary

This slice does not make auto-backup scheduling safe to change, optimize,
delete, or merge. It only proves current scheduler boundaries and timer
side-effect behavior.

Still missing:

- `backgroundAutoBackupSchedulerContract`
- `backgroundAutoBackupTriggerPolicy`
- `backgroundAutoBackupSenderPolicy`
- `backgroundAutoBackupDelayClampReport`
- `backgroundAutoBackupTimerLifecycleReport`
- `backgroundAutoBackupPostEnrichmentWaitBudget`
- `backgroundAutoBackupEncryptionSkipReport`
- `backgroundAutoBackupDownloadRotationReport`
- `backgroundAutoBackupSplitOwnerReport`
- `backgroundAutoBackupMetricArtifact`

## Verification

```bash
node --test tests/runtime/background-auto-backup-scheduler-boundary-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
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
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
