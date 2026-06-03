# FilterTube P0 Security/PIN Lock Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This file converts the P0 security/PIN lock fixture names from
`docs/audit/FILTERTUBE_IMPLEMENTATION_READINESS_GATE_2026-05-18.md` into runnable
audit proof. The goal is to pin the current split lock authority before any
allow/block migration, profile-scoped sync, import, Nanah, or rule mutation
behavior changes.

## Fixture Status

| Fixture | Current status | Proof |
| --- | --- | --- |
| `locked_profile_rejects_set_list_mode` | Not satisfied at the mutation boundary. `FilterTube_SetListMode` rejects untrusted extension senders, but does not consult the background session PIN cache or a shared profile lock authority before mode/list transfer writes. | `js/background.js`; `tests/runtime/p0-security-pin-lock-current-behavior.test.mjs` |
| `locked_profile_rejects_add_whitelist_channel` | Not satisfied at the mutation boundary. Main and Kids whitelist add actions require trusted UI sender, but not `isProfileSessionAuthorized()` or a structured lock report. | same |
| `locked_profile_rejects_transfer_whitelist_to_blocklist` | Not satisfied at the mutation boundary. Whitelist transfer can move and clear allow lists after only a trusted UI sender check. | same |
| `child_profile_rejects_parent_policy_mutation` | UI-path partial only. Tab view disables child-admin controls and `updateProfileViewingAccess()` rejects active child edits, but this is not one shared background/import/Nanah lock authority. | `js/tab-view.js`; same test |
| `content_script_rejects_add_filtered_channel_without_ui_owner` | Not satisfied. The secondary `message.type === 'addFilteredChannel'` listener calls `handleAddFilteredChannel()` without a trusted UI sender check or session lock check. | `js/background.js`; same test |
| `nanah_apply_requires_target_profile_authority` | Not satisfied inside the apply primitive. `applyScopedPortablePayload()` resolves target profile and writes `ftProfilesV4` directly through IO without checking PIN/session/parent authority. | `js/nanah_sync_adapter.js`; same test |
| `encrypted_import_preserves_target_profile_id` | Not satisfied. `importV3Encrypted()` decrypts, then forwards `{ strategy, scope, auth }` to `importV3()` and drops `targetProfileId`. | `js/io_manager.js`; same test |
| `sync_kids_to_main_setter_requires_unlocked_ui_or_background_authority` | UI-path partial only. The tab UI disables the toggle for child profiles, but `StateManager.setSetting('syncKidsToMain')` writes V4 and V3 state directly without a local lock/session authority check. | `js/tab-view.js`; `js/state_manager.js`; same test |

## Current Lock Shape

```text
UI controls
  -> isUiLocked / ensureProfileUnlocked in tab or popup
  -> some controls disabled for child profiles

Background actions
  -> some actions: isTrustedUiSender only
  -> one batch import path: trusted UI + active target + session PIN
  -> secondary message listener: content-script shaped mutation without trusted UI guard

Import / Nanah
  -> full Default import/export has Master PIN checks
  -> encrypted import drops target profile forwarding
  -> Nanah scoped apply writes target profile directly
```

The cryptographic PIN primitive exists. The missing piece is a single
`securityLockAuthority` that all mutation paths use before writing profile or
rule state.

## Stabilization Implication

Security/PIN lock is not the direct reason for empty-install lag. It is a
release blocker for larger rule-schema changes because future simultaneous
allow/block rows would make these mutation paths more powerful. Before that
work, the implementation needs one mutation/lock report containing:

```text
actor class
active profile
target profile
profile type
surface/list target
required unlock class
allowed / denied reason
affected storage keys
runtime refresh scope
compiled revision
```

## Verdict

P0 security/PIN lock behavior is not implementation-ready. UI gates should be
preserved, but they are not enough proof because several write paths live below
the UI layer or outside the same lock contract.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this P0 security/PIN lock gate can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
