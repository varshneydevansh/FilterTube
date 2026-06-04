# Contract: Managed Child Local Edit Authority

**Generated**: 2026-06-03
**Status**: Runtime local managed-save, failed-unlock history, admin-session
TTL, and sensitive-action re-auth hardening partially present.
**Goal slice**: Implementation order item 5, "Harden local
parent-managed child/protected-profile edits".
**Primary inputs**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`.

## Purpose

This contract pins the same-device parent-managed child edit authority and now
tracks the first runtime hardening slice. It separates three concerns:

1. Who is allowed to enter virtual child edit mode.
2. Which saved child surface writes must be rejected after profile/session
   state changes.
3. Which future metadata must be emitted when the write succeeds or fails.

The current product source already blocks child profiles from becoming admins
through this local edit path. The first runtime slice preserves that behavior
and adds durable local policy revision plus protected redacted action-history
metadata for successful parent-managed child surface saves.

## Current Source-Backed Authority

Current source evidence in `js/tab-view.js`:

| Source function | Current authority behavior |
| --- | --- |
| `canActiveProfileManageProfile(profilesV4, targetProfileId)` | Rejects when the active profile is a child. Allows Default, the active non-child profile managing itself, or an account whose id matches the target child's `parentProfileId`. |
| `startManagedChildEdit(profileId, surface)` | Loads fresh profiles, requires the target to be a child profile, requires `canActiveProfileManageProfile(...)`, then requires `ensureProfileUnlocked(...)` for the active parent/account profile. |
| `saveManagedChildSurface(surface, mutator)` | Requires an active managed-child edit target, reloads fresh profiles, reruns `canActiveProfileManageProfile(...)`, writes only the target child's selected surface, records local revision/history metadata, then reloads UI state. |
| `localManagedEditPolicyRevisionStore(profile, scope)` | Reads the target child's last local managed edit revision for `main` or `kids`. |
| `recordManagedChildLocalEditHistory(profile, report)` | Stores the accepted local edit revision and a protected redacted action-history row on the target child profile in the same V4 profile write. |
| `recordManagedAdminAuthFailureHistory(profilesV4, targetProfileId, reason)` | Stores a protected `admin_session.failed_unlock` row on the target child profile when parent/admin unlock fails for managed child edit, history view/clear, viewing-space, or time-limit changes. |
| `ensureProfileUnlocked(profilesV4, profileId, options)` | Syncs session state, allows unlocked/no-PIN profiles, requires an unexpired local unlock session, prompts for profile PIN otherwise, verifies PIN locally, records a local TTL/reauth window, then notifies background. |
| `isProfileUnlockSessionValid.check(profileId, options)` | Rejects expired admin sessions, clears stale session metadata, and requires fresher auth for sensitive managed actions. |

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

## Hardening Requirements

The local write path must keep these requirements without weakening current
filtering behavior:

- A successful parent-managed child save creates a monotonic local managed policy
  revision for the target profile and surface.
- The child profile surface write and revision/history write are atomic from the
  caller's perspective.
- A successful write records a managed action-history row with actor profile,
  actor device, target profile, scope, revision, policy hash, result, and
  redacted summary.
- A failed unlock records a protected action-history row and can contribute to
  future rate limiting.
- Admin session authority has TTL and relocks on profile switch, window close,
  explicit logout, or sensitive action re-auth requirement.
- Sensitive actions, including time-limit changes, viewing-space changes,
  sync-policy changes, trust-link changes, and history clearing, can require
  re-auth even inside an existing admin session.
- Failed writes do not create successful history rows.
- Local UI edit mode remains virtual: the parent edits the child profile
  without making the child the active admin profile.

## Current Runtime Boundary

Current product runtime source implements accepted local managed-save metadata,
protected failed-unlock history rows, local dashboard session TTL, and fresher
reauth for sensitive managed actions. Rate limiting remains a future slice:

```text
runtime local managed edit policy revision store: present
runtime local managed edit action-history writer: present
runtime local managed edit failed-unlock logger: present for managed child/history/viewing-space/time-limit unlock gates
runtime local managed edit admin session TTL: present for tab-view and background session cache
runtime local managed edit sensitive-action re-auth gate: present for managed child/history/viewing-space/time-limit unlock gates
runtime local managed edit failed-attempt rate limit: absent
runtime behavior changed by this contract: yes
```

The current runtime writes:

- `profile.managedPolicyState.localManagedEdits.main`
- `profile.managedPolicyState.localManagedEdits.kids`
- `profile.managedActionHistory[]`
- protected `admin_session.failed_unlock` rows for failed parent unlocks

Rows are local, protected metadata. They are evidence and parent/caregiver UX;
they are not policy authority. Future implementation should reuse or lift this
small local managed-write helper near the profile storage boundary so UI edits,
local bulk apply, and later P2P applies do not each invent separate
revision/history behavior.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-child-local-authority-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
