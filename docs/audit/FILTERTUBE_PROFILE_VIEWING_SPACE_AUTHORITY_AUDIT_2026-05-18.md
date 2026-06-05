# FilterTube Profile Viewing-Space Authority Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

Runnable proof: `tests/runtime/profile-viewing-space-authority-current-behavior.test.mjs`.

This slice covers the profile selector, Main/Kids viewing-space flags, child
profile policy, active-profile persistence, Main/Kids compiled settings, and the
runtime boundary between YouTube Main and YouTube Kids.

## Current Authority Map

```text
profile dropdown / profile manager
        |
        v
ftProfilesV4.activeProfileId
        |
        +--> StateManager loads active profile for UI state
        +--> background compiles active profile for Main or Kids
        +--> popup/tab-view lock gates hide rule editing
        +--> profile manager stores allowMainViewing / allowKidsViewing

Important current boundary:
  allowMainViewing / allowKidsViewing are UI/admin policy fields today.
  They are not a background/runtime enforcement authority for content scripts.
```

## Source Evidence

| Area | Current source | What it owns |
| --- | --- | --- |
| V4 profile validity and legacy migration | `js/settings_shared.js:89-116`; `js/background.js:60-88` | A V4 profile tree is valid if it has a non-empty `activeProfileId` and a `profiles` object. Legacy migration creates Default with Main and Kids surfaces. |
| Shared settings load | `js/settings_shared.js:567-705` | Reads active V4 Main settings and can write generated/missing V4 profile settings during a load path. |
| StateManager profile state | `js/state_manager.js:190-455` | Loads active profile Main/Kids lists, modes, content filters, category filters, and `syncKidsToMain` into UI state. |
| Main/Kids compile authority | `js/background.js:1974-2555`; `js/background.js:3238-3258` | `getCompiledSettings` chooses `main` or `kids` from request/sender URL, then compiles the active V4 profile for that surface. |
| Runtime cache | `js/background.js:3244-3258`; `js/background.js:4458-4494` | `compiledSettingsCache` is keyed by `main` and `kids`; `ftProfilesV4` changes invalidate both caches and trigger safe recompiles. |
| Profile dropdown switching | `js/tab-view.js:3780-3860`, `8830-8915`; `js/popup.js:1378-1510` | Dropdowns unlock the target profile, write `activeProfileId`, reload UI state, and refresh local UI. |
| Viewing-space policy UI | `js/tab-view.js:4088-4098`, `4543-4578`, `8516-8665`; `html/tab-view.html:1436-1437` | Profile manager stores and labels `allowMainViewing` and `allowKidsViewing`; it prevents saving a profile with both spaces disabled. |
| Child profile rule-management gates | `js/tab-view.js:4590-4605`, `4310-4445`; `js/popup.js:1268-1358` | Child profiles are treated as locked/admin-restricted in the extension UI; parent-managed child edit can edit child surfaces from the parent account. |
| Managed child surface editing | `js/tab-view.js:4088-4307`; `js/tab-view.js:4310-4385` | Parent-managed edits mutate child Main/Kids surfaces directly through `saveProfilesV4`, then reload local UI state. |

## Findings

1. **Viewing-space flags are not runtime route enforcement.**
   `allowMainViewing` and `allowKidsViewing` are created, displayed, and edited in
   tab-view profile management, but `js/background.js` and `js/settings_shared.js`
   do not use those fields to reject `getCompiledSettings`, suppress content
   scripts, or refuse Main/Kids runtime settings. This may be acceptable if
   viewing-space enforcement belongs only in native apps, but the extension help
   copy currently presents the flags as profile policy.

2. **Profile selection and surface selection are separate authorities.**
   `activeProfileId` chooses the profile. The background then chooses Main/Kids
   from `request.profileType` or sender URL. A single future authority must
   report `{ profileId, profileType, viewingSpace, surface, route, lockState }`
   so Main/Kids access, filtering, and UI rules cannot drift.

3. **Compiled settings cache is surface-keyed, not profile/revision-keyed.**
   Cache invalidation on `ftProfilesV4` changes is present, which is good, but
   the cache object is still only `{ main, kids }`. A future profile/revision
   authority should make it impossible to serve a stale compiled snapshot after a
   profile switch, import, Nanah apply, or managed-child edit.

4. **Child profile UI lock is not one mutation authority.**
   Popup/tab-view lock gates block visible editing for child profiles, while
   parent-managed child edit writes V4 directly. Other audits already show
   background and content-script mutation paths with different gates. Profile
   policy must become a mutation contract, not only DOM-disabled controls.

5. **Managed child editing bypasses active-profile switching by design.**
   This is useful for parent workflow, but it creates another state path:
   editing child surfaces while the parent remains active. Future fixtures must
   prove which profile receives storage writes, which runtime tabs refresh, and
   whether child locks/viewing-space policy are respected.

6. **Main/Kids sync is profile-scoped but still split.**
   `syncKidsToMain` lives in active profile settings, is edited through
   StateManager, and is applied in background compile only when Main and Kids
   modes match. This needs to be governed by the same profile/viewing authority
   as list-mode migration and simultaneous allow/block work.

## Required Future Authority

```text
profileViewingAuthority {
  actorClass,
  activeProfileId,
  targetProfileId,
  profileType: "account" | "child",
  viewingSpace: "main" | "kids",
  route,
  allowMainViewing,
  allowKidsViewing,
  lockState,
  parentManagerId,
  mutationAllowed,
  runtimeAllowed,
  compiledSettingsRevision
}
```

The report should be emitted or derivable before:

- compiling settings for Main or Kids,
- switching active profiles,
- opening or routing a viewing surface,
- editing child surfaces from a parent account,
- applying Nanah/import profile payloads,
- changing Main/Kids list mode,
- syncing Kids rules into Main,
- broadcasting runtime refreshes.

## Fixture Gates Before Behavior Changes

```text
profile_switch_invalidates_compiled_main_and_kids_by_revision
profile_switch_rejects_locked_profile_without_session_unlock
profile_viewing_space_main_denied_blocks_main_runtime_compile
profile_viewing_space_kids_denied_blocks_kids_runtime_compile
profile_viewing_space_cannot_disable_both_surfaces
child_profile_cannot_mutate_parent_policy_from_child_surface
parent_managed_child_edit_reports_target_profile_and_surface
managed_child_edit_refreshes_only_target_surface_or_reports_broadcast_scope
sync_kids_to_main_requires_matching_modes_and_profile_authority
import_nanah_profile_apply_updates_profile_viewing_authority_revision
```

## Implementation Direction

Do not add another independent check in one UI button. The safe direction is a
single profile/viewing-space report consumed by tab-view, popup, background
compile, import/Nanah apply, and native app routing. Until that exists, treat the
current `allowMainViewing`/`allowKidsViewing` flags as UI-visible policy state,
not as proof that runtime access is enforced.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6154
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6154
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
