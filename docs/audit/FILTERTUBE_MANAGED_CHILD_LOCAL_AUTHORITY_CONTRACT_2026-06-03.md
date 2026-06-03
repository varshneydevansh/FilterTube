# Contract: Managed Child Local Edit Authority

**Generated**: 2026-06-03  
**Status**: Contract/proof fixture only. Runtime behavior is unchanged.  
**Goal slice**: Implementation order item 5, "Harden local
parent-managed child/protected-profile edits".  
**Primary inputs**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`.

## Purpose

This contract pins the same-device parent-managed child edit authority before
runtime hardening. It separates three concerns:

1. Who is allowed to enter virtual child edit mode.
2. Which saved child surface writes must be rejected after profile/session
   state changes.
3. Which future metadata must be emitted when the write succeeds or fails.

The current product source already blocks child profiles from becoming admins
through this local edit path. The next implementation slice must preserve that
behavior while adding durable policy revision and action-history writes.

## Current Source-Backed Authority

Current source evidence in `js/tab-view.js`:

| Source function | Current authority behavior |
| --- | --- |
| `canActiveProfileManageProfile(profilesV4, targetProfileId)` | Rejects when the active profile is a child. Allows Default, the active non-child profile managing itself, or an account whose id matches the target child's `parentProfileId`. |
| `startManagedChildEdit(profileId, surface)` | Loads fresh profiles, requires the target to be a child profile, requires `canActiveProfileManageProfile(...)`, then requires `ensureProfileUnlocked(...)` for the active parent/account profile. |
| `saveManagedChildSurface(surface, mutator)` | Requires an active managed-child edit target, reloads fresh profiles, reruns `canActiveProfileManageProfile(...)`, writes only the target child's selected surface, then reloads UI state. |
| `ensureProfileUnlocked(profilesV4, profileId)` | Syncs session state, allows unlocked/no-PIN profiles, prompts for profile PIN otherwise, verifies PIN locally, then notifies background. |

## Required Local Authority Decisions

| Fixture id | Actor | Target | Expected decision |
| --- | --- | --- | --- |
| `default_manages_child` | Default profile | Any child profile | Allowed after Default/admin unlock when required. |
| `parent_manages_owned_child` | Account parent | Child whose `parentProfileId` is the account id | Allowed after parent/account unlock when required. |
| `parent_cannot_manage_unowned_child` | Account parent | Child owned by another account | Rejected before edit starts and before save. |
| `child_cannot_manage_self_as_admin` | Child profile | Same child profile | Rejected; child PIN is not admin authority. |
| `sibling_cannot_manage_sibling` | Child profile | Sibling child profile | Rejected; sibling profiles cannot mutate each other. |
| `non_child_self_edit_is_not_child_manage_mode` | Account profile | Same account profile | Not a child managed-edit target; use normal account settings paths. |
| `locked_parent_requires_unlock` | Locked parent/account | Owned child profile | Rejected until parent/account unlock succeeds. |
| `save_rechecks_fresh_authority` | Parent switched or child ownership changed after editor opened | Previous child target | Rejected during save. |

## Hardening Requirements Before Runtime Changes

The future local write path must add these requirements without weakening
current filtering behavior:

- A successful parent-managed child save creates a monotonic managed policy
  revision for the target profile and surface.
- The child profile surface write and revision write are atomic from the
  caller's perspective.
- A successful write records a managed action-history row with actor profile,
  actor device, target profile, scope, revision, policy hash, result, and
  redacted summary.
- A failed unlock records a protected action-history row and can contribute to
  rate limiting.
- Admin session authority has TTL and relocks on profile switch, window close,
  explicit logout, or sensitive action re-auth requirement.
- Sensitive actions, including time-limit changes, viewing-space changes,
  sync-policy changes, trust-link changes, and history clearing, can require
  re-auth even inside an existing admin session.
- Failed writes do not create successful history rows.
- Local UI edit mode remains virtual: the parent edits the child profile
  without making the child the active admin profile.

## Current Runtime Boundary

Current product runtime source does not yet implement the durable hardening
metadata:

```text
runtime local managed edit policy revision store: absent
runtime local managed edit action-history writer: absent
runtime local managed edit failed-unlock logger: absent
runtime local managed edit admin session TTL: absent
runtime local managed edit sensitive-action re-auth gate: absent
runtime behavior changed by this contract: no
```

Future implementation should keep the current source authority gate in
`tab-view.js`, then add a small canonical local managed-write helper near the
profile storage boundary so UI edits, local bulk apply, and later P2P applies do
not each invent separate revision/history behavior.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-child-local-authority-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
