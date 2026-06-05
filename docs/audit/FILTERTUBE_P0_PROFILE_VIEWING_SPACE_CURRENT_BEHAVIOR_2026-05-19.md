# FilterTube P0 Profile / Viewing-Space Current Behavior - 2026-05-19

Status: current-behavior proof. This is not an implementation patch.

This slice converts the P0 profile/viewing-space fixture family from the
implementation-readiness gate into runnable proof. The purpose is to keep active
profile selection, Main/Kids access, child profile policy, managed-child edits,
import, Nanah apply, and compiled runtime refresh from becoming independent
authorities.

Runtime proof:

```text
tests/runtime/p0-profile-viewing-space-current-behavior.test.mjs
```

## Source Surface

| Source | Current role |
| --- | --- |
| `js/tab-view.js:4088-4098` | Reads `allowMainViewing` and `allowKidsViewing` from profile settings and labels access. |
| `js/tab-view.js:4543-4578` | Updates viewing access and prevents saving a profile with both Main and Kids disabled. |
| `js/tab-view.js:4310-4385` | Parent-managed child edits write child Main/Kids surfaces directly through `saveProfilesV4()`. |
| `js/tab-view.js:8848-8895` | Tab-view profile switch unlocks target profile, writes `activeProfileId`, and reloads UI state. |
| `js/popup.js:1378-1510` | Popup profile switch follows the same unlock/write/reload pattern. |
| `js/state_manager.js:190-455` | Loads active V4 profile Main/Kids surfaces into UI state without viewing-space runtime authority. |
| `js/background.js:1974-2555` | Compiles active profile Main/Kids settings and now exposes child-only `managedViewingRouteGate` from `allowMainViewing` / `allowKidsViewing`. |
| `js/content/bridge_settings.js` | The content bridge now blocks denied child Main/Kids routes before forwarding settings into the page-world runtime. |
| `js/io_manager.js:1470-1738` | Import writes target profile/V4 state and optional Nanah trusted-device state. |
| `js/nanah_sync_adapter.js:168-251` | Scoped Nanah apply writes profile sections directly and returns no compiled runtime revision. |

## Current Behavior Matrix

| P0 fixture | Current result | Evidence | Risk |
| --- | --- | --- | --- |
| `profile_switch_invalidates_compiled_main_and_kids_by_revision` | Not satisfied by revision. | Profile switch writes `activeProfileId` and reloads local UI; background cache is only `main`/`kids` and no `compiledSettingsRevision` exists. | A stale runtime snapshot can be hard to prove invalidated after profile switch, import, or sync. |
| `profile_switch_rejects_locked_profile_without_session_unlock` | Satisfied in popup/tab-view UI paths, not a shared authority. | Both switch functions call `ensureProfileUnlocked()` before saving `activeProfileId`. | Other mutation or runtime paths do not consume one profile lock report. |
| `profile_viewing_space_main_denied_blocks_main_runtime_compile` | Locally satisfied for child route-gate, not revision-backed. | Background compile now exposes `managedViewingRouteGate`; content bridge blocks denied Main routes with a managed overlay. | Remote/imported viewing-space policy still lacks envelope/revision authority. |
| `profile_viewing_space_kids_denied_blocks_kids_runtime_compile` | Locally satisfied for child route-gate, not revision-backed. | Background compile now exposes `managedViewingRouteGate`; content bridge blocks denied Kids routes with a managed overlay. | Remote/imported viewing-space policy still lacks envelope/revision authority. |
| `profile_viewing_space_cannot_disable_both_surfaces` | Satisfied in tab-view profile manager. | `updateProfileViewingAccess()` blocks `!nextMain && !nextKids`. | This is UI validation, not a shared import/Nanah/runtime invariant. |
| `child_profile_cannot_mutate_parent_policy_from_child_surface` | Partially satisfied in tab-view UI. | Viewing-access updates reject active child profiles; admin controls are disabled for child profiles. | Background/import/Nanah paths are not governed by the same child-policy authority. |
| `parent_managed_child_edit_reports_target_profile_and_surface` | Not satisfied as a structured report. | `managedChildEdit = { profileId, surface }` exists, but save returns boolean and no mutation report/revision. | Parent edits can mutate child rules without an auditable target-profile/surface result. |
| `managed_child_edit_refreshes_only_target_surface_or_reports_broadcast_scope` | Not satisfied. | Managed save reloads local settings and rerenders Main/Kids/UI controls, but no broadcast-scope report exists. | Runtime tabs may need refresh proof; local UI rerender is not enough for compile/runtime authority. |
| `sync_kids_to_main_requires_matching_modes_and_profile_authority` | Partially satisfied in compile logic only. | Background merges Kids into Main only when both modes match; StateManager persists `syncKidsToMain` and requests Main refresh without a profile authority report. | Sync behavior can drift across UI save, background compile, and runtime refresh. |
| `import_nanah_profile_apply_updates_profile_viewing_authority_revision` | Not satisfied. | Import and Nanah apply write V4 profile state without a compiled profile/viewing authority revision. | Imported or synced profile access/rules can leave runtime proof stale. |

## Why This Blocks Behavior Changes

Profile and viewing-space state decides which rules are real:

```text
activeProfileId
        |
        +--> Main rules
        +--> Kids rules
        +--> child/admin lock policy
        +--> managed-child target profile
        +--> syncKidsToMain merge
        +--> import/Nanah profile writes
        +--> runtime compiled settings
```

If profile selection, viewing access, child policy, managed edits, import, and
Nanah apply are not reported through one authority, the UI can look correct
while runtime filtering still uses stale or unauthorized state.

## Required Future Contract

Before changing profile/viewing-space behavior, add one profile authority:

```text
profileViewingAuthority({
  actorClass,
  activeProfileId,
  targetProfileId,
  targetSurface,
  route,
  allowMainViewing,
  allowKidsViewing,
  lockState,
  parentManagerId,
  mutationAllowed,
  runtimeAllowed,
  syncKidsToMainAllowed,
  compiledSettingsRevision,
  broadcastScope
})
```

This report should be consumed before profile switch, runtime compile,
viewing-space route access, managed-child edits, syncKidsToMain merges, import,
Nanah apply, and runtime refresh broadcasts.

## Implementation Boundary

Allowed now:

- keep this current-behavior proof green,
- add read-only counters/logging for profile switch and runtime compile,
- add no-op revision fields for measurement,
- extract fixtures for Main/Kids route access under denied viewing spaces.

Blocked now:

- changing `allowMainViewing` or `allowKidsViewing` semantics,
- changing profile-switch behavior,
- changing child-profile mutation policy,
- changing managed-child edit refresh behavior,
- changing `syncKidsToMain` merge behavior,
- changing import or Nanah profile-apply behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6162
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6162
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
