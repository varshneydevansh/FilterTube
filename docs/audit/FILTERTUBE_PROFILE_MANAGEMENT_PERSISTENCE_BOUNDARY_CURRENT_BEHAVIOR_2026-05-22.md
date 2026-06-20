# FilterTube Profile Management Persistence Boundary - 2026-05-22

Status: current-behavior proof slice. This is not an implementation patch.

This slice promotes the broad profile/viewing-space and tab-view method audits
into direct profile management persistence proof. It covers profile switching,
profile manager rename/delete controls, account and child profile creation,
parent-managed child saves, IO profile load/save behavior, and background cache
invalidation after profile storage changes.

Runtime proof:

```text
tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/tab-view.js` | 21334 | 1011629 | `d510552426747824477506ea3ab70ce01ac42a80fb159524bb39e1464f86f363` |
| `js/popup.js` | 1841 | 75587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `js/io_manager.js` | 2119 | 102123 | `d457bdcc4f7fc3acef401b48437fc707e2b9f2791e18ff4cafc1209f810bcc3c` |
| `js/background.js` | 6984 | 315747 | `080d15907b26314873138c5dcc5d9653a2a27e933049be10361dfe0047f0a7cc` |

## Source / Effect Blocks

```text
4 profile management persistence source files
source/effect blocks: 9
tab-view renderProfilesManager block: 539 lines, 29459 bytes
tab-view refreshProfilesUI block: 24 lines, 954 bytes
tab-view switchToProfile block: 45 lines, 1673 bytes
popup switchToProfile block: 48 lines, 1659 bytes
tab-view create account handler block: 120 lines, 5004 bytes
tab-view create child handler block: 107 lines, 4597 bytes
tab-view saveManagedChildSurface block: 66 lines, 3003 bytes
io_manager load/save profiles block: 67 lines, 2563 bytes
background profile storage invalidation block: 42 lines, 1464 bytes
```

## Selected Token Counts

```text
tab-view ensureProfileUnlocked tokens: 34
tab-view saveProfilesV4 tokens: 71
tab-view loadProfilesV4 tokens: 114
tab-view activeProfileId tokens: 130
tab-view StateManager.loadSettings tokens: 15
tab-view refreshProfilesUI tokens: 38
tab-view applyLockGateIfNeeded tokens: 4
tab-view scheduleAutoBackup tokens: 6
tab-view profile_created tokens: 2
tab-view managedChildEdit tokens: 17
tab-view unlockedProfiles tokens: 5
tab-view clearProfileUnlockSession tokens: 7
tab-view allowMainViewing tokens: 23
tab-view allowKidsViewing tokens: 22
tab-view schemaVersion tokens: 52
popup ensureProfileUnlocked tokens: 3
popup saveProfilesV4 tokens: 2
popup loadProfilesV4 tokens: 4
popup activeProfileId tokens: 16
popup StateManager.loadSettings tokens: 3
popup refreshProfilesUI tokens: 6
popup applyLockGateIfNeeded tokens: 3
popup unlockedProfiles tokens: 5
io_manager FT_PROFILES_V4_KEY tokens: 10
io_manager writeStorage tokens: 8
background compiledSettingsCache tokens: 39
background getCompiledSettings tokens: 10
background FT_PROFILES_V4_KEY tokens: 40
```

## Runtime Fixtures Pinned

```text
tab_and_popup_profile_switch_write_active_profile_after_unlock
profile_manager_delete_writes_resolved_active_profile_without_backup_report
account_profile_creation_copies_backup_policy_without_switching_active_profile
child_profile_creation_requires_parent_account_and_defaults_main_denied_kids_allowed
managed_child_save_writes_target_profile_surface_with_local_revision_history_without_broadcast_report
io_load_profiles_can_write_sanitized_or_migrated_v4_during_read_path
io_save_profiles_invalid_payload_writes_empty_object_instead_of_error_report
background_profile_storage_change_invalidates_both_compiled_caches_without_revision_report
profile_management_future_authority_symbols_absent_from_product_runtime
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before profile, JSON-first, or optimization work |
| --- | --- | --- | --- |
| Tab-view profile switch | `switchToProfile()` loads V4, verifies the target exists, calls `ensureProfileUnlocked()`, writes `activeProfileId`, clears `managedChildEdit`, reloads `StateManager`, refreshes profile UI, updates stats, starts gated managed saved-update/source-ack sync in the background, and shows a toast. | `tests/runtime/profile-management-persistence-boundary-current-behavior.test.mjs` | The switch has local lock proof and does not block on optional Internet Pickup/Home Bridge/provider receipt checks, but it still has no shared revision, runtime broadcast, or compiled-settings freshness report. |
| Popup profile switch | Popup switch repeats the load/unlock/write/reload pattern and rerenders popup state. | Same runtime test. | Popup and tab-view share behavior by convention rather than one switch authority. |
| Profile manager delete | The tab-view delete action rejects child-admin and default deletion, requires Default admin or self unlock, deletes `profiles[profileId]`, resolves active profile back to Default if needed, writes V4, clears the profile unlock session, reloads StateManager, refreshes UI, and applies the lock gate. | Same runtime test. | Delete has no backup scheduling token, no deletion report, and no explicit background cache revision report. |
| Account profile creation | Account creation requires non-child admin action, active Default, admin unlock, account policy allowance, and account limit checks. It creates an account with Main and Kids viewing allowed, empty block/allow lists, copied active backup policy settings, writes V4, refreshes UI, and conditionally schedules `profile_created` backup from the active profile setting. | Same runtime test. | The new profile does not become active, and backup scheduling is conditional and side-effect only, not part of a mutation report. |
| Child profile creation | Child creation requires non-child admin action, an active account profile, parent unlock, then creates a child with `allowMainViewing:false`, `allowKidsViewing:true`, empty lists, copied parent backup policy settings, writes V4, refreshes UI, and conditionally schedules `profile_created` backup. | Same runtime test. | Child defaults and parent authority are UI-local; no structured parent/child policy report is emitted. |
| Managed child save | `saveManagedChildSurface()` checks `canActiveProfileManageProfile()`, mutates the selected child surface, writes local accepted-save revision/history metadata, writes V4, updates local cache, calls `StateManager.loadSettings({ notify:false, resetEnrichment:false, scheduleEnrichment:false })`, rerenders Main and Kids rows, applies content controls locally, and updates stats. | Same runtime test. | Parent-managed child edits now have local redacted revision/history proof, but still do not emit broadcast-scope, compiled-revision, or backup reports. |
| IO profile load/save | `loadProfilesV4()` can write sanitized V4 data or a migrated default V4 object during read-path loading. `saveProfilesV4()` writes `{}` when the candidate is invalid; otherwise it writes `ftProfilesV4`. | Same runtime test. | Read-path writes and invalid-payload writes are not reported as profile mutations. |
| Background storage invalidation | The background storage listener treats `FT_PROFILES_V4_KEY` as relevant, clears both compiled caches, and calls `getCompiledSettings()` for YouTube and Kids URLs. It explicitly notes that this does not broadcast automatically. | Same runtime test. | Cache invalidation is broad and revisionless; tabs rely on their own settings refresh listeners. |

## Required Future Authority Before Behavior Changes

No product runtime source currently defines:

```text
profileManagementPersistenceContract
profileManagementMutationReport
profileManagementSwitchRevisionReport
profileManagementLockPolicy
profileManagementCreateDeleteReport
profileManagementBackupPolicy
profileManagementCacheInvalidationReport
profileManagementManagedChildReport
profileManagementFixtureProvenance
profileManagementMetricArtifact
```

## Current Verdict

```text
Profile management persistence is proof-pinned.
Profile switch, create, delete, managed-child save, IO read-path writes, and background cache invalidation do not share one mutation report.
Runtime behavior remains unchanged.
```

This does not close profile/viewing-space, profile-lock, settings-mode,
storage/cache, backup, reliability, false-hide/leak, performance, code-burden,
cross-feature, or JSON-first rows. It adds current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6166
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6166
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
