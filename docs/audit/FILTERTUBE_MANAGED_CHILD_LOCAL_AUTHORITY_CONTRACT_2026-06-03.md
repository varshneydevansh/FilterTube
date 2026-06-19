# Contract: Managed Child Local Edit Authority

**Generated**: 2026-06-03
**Status**: Runtime local managed-save, failed-unlock history, admin-session
TTL, sensitive-action re-auth, profile-persisted failed-attempt rate-limit
hardening, and a shared managed-admin authority helper are partially present.
**Goal slice**: Implementation order item 5, "Harden local
parent-managed child/protected-profile edits".
**Primary inputs**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`.

## Purpose

This contract pins the same-device parent-managed protected-profile edit authority and now
tracks the first runtime hardening slice. It separates three concerns:

1. Who is allowed to enter virtual protected-profile edit mode.
2. Which saved protected-profile surface writes must be rejected after profile/session
   state changes.
3. Which future metadata must be emitted when the write succeeds or fails.

The current product source already blocks child profiles from becoming admins
through this local edit path. The first runtime slice preserves that behavior,
supports non-default protected profiles below a managing account, and adds
durable local policy revision plus protected redacted action-history metadata
for successful parent-managed protected-profile surface saves.

## Current Source-Backed Authority

Current source evidence in `js/managed_admin_authority.js` and
`js/tab-view.js`:

| Source function | Current authority behavior |
| --- | --- |
| `FilterTubeManagedAdminAuthority.canActorManageProfile(profilesV4, options)` | Shared runtime authority helper. Rejects child actors, missing target profiles, missing actor profiles, and sibling/unowned targets. Allows Default, a non-child actor managing itself, or an account whose id matches the target child's `parentProfileId`. |
| `canActiveProfileManageProfile(profilesV4, targetProfileId)` | Dashboard wrapper that delegates to `FilterTubeManagedAdminAuthority.canActorManageProfile(...)` when the helper is loaded, preserving the prior inline fallback. |
| `startManagedChildEdit(profileId, surface)` | Loads fresh profiles, rejects Default or missing targets, requires `canActiveProfileManageProfile(...)`, then requires `ensureProfileUnlocked(...)` for the active parent/account profile. |
| `saveManagedChildSurface(surface, mutator)` | Requires an active managed-child edit target, reloads fresh profiles, rejects a missing target or Default, reruns `canActiveProfileManageProfile(...)`, writes only the protected target's selected surface, records local revision/history metadata, then reloads UI state. |
| `localManagedEditPolicyRevisionStore(profile, scope)` | Reads the target child's last local managed edit revision for `main` or `kids`. |
| `recordManagedChildLocalEditHistory(profile, report)` | Stores the accepted local edit revision and a protected redacted action-history row on the target child profile in the same V4 profile write. |
| `recordManagedAdminAuthFailureHistory(profilesV4, targetProfileId, reason)` | Stores a protected `admin_session.failed_unlock` row on the target child profile when parent/admin unlock fails for managed child edit, history view/clear, viewing-space, or time-limit changes. |
| `ensureProfileUnlocked(profilesV4, profileId, options)` | Syncs session state, allows unlocked/no-PIN profiles, requires an unexpired local unlock session, rate-limits repeated failed PIN attempts through memory plus a profile-persisted dashboard row, prompts for profile PIN otherwise, verifies PIN locally, records a local TTL/reauth window, clears the persisted dashboard failure row, then notifies background. |
| `FilterTubeManagedAdminAuthority.checkAdminUnlockSession(session, options)` | Shared runtime session decision helper for unlocked profile membership, TTL expiry, and sensitive-action re-auth. |
| `isProfileUnlockSessionValid.check(profileId, options)` | Dashboard wrapper that delegates to `FilterTubeManagedAdminAuthority.checkAdminUnlockSession(...)`, clears stale session metadata, and preserves the prior inline fallback. |
| `FilterTubeManagedAdminAuthority.normalizeFailedUnlockState(...)` | Shared runtime failed-unlock window normalizer used by the dashboard's persisted failed-attempt state. |

## Required Local Authority Decisions

| Fixture id | Actor | Target | Expected decision |
| --- | --- | --- | --- |
| `default_manages_child` | Default profile | Any child profile | Allowed after Default/admin unlock when required. |
| `parent_manages_owned_child` | Account parent | Child whose `parentProfileId` is the account id | Allowed after parent/account unlock when required. |
| `parent_cannot_manage_unowned_child` | Account parent | Child owned by another account | Rejected before edit starts and before save. |
| `child_cannot_manage_self_as_admin` | Child profile | Same child profile | Rejected; child PIN is not admin authority. |
| `sibling_cannot_manage_sibling` | Child profile | Sibling child profile | Rejected; sibling profiles cannot mutate each other. |
| `non_default_protected_self_edit_uses_admin_authority` | Account/protected profile | Same profile or a managed protected profile | Allowed only when `canActiveProfileManageProfile(...)` and parent/account unlock pass; Default is never edited through this virtual protected-profile path. |
| `locked_parent_requires_unlock` | Locked parent/account | Owned child profile | Rejected until parent/account unlock succeeds. |
| `save_rechecks_fresh_authority` | Parent switched or child ownership changed after editor opened | Previous child target | Rejected during save. |
| `save_rechecks_fresh_protected_target` | Parent/admin save from stale edit state | Missing target or Default profile | Rejected during save before any profile surface mutation. |

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
- A failed unlock records a protected action-history row, contributes to the
  profile-persisted managed-action PIN rate limit, and keeps the actual
  background PIN/session cache memory-only.
- Admin session authority has TTL and relocks on profile switch, window close,
  explicit logout, or sensitive action re-auth requirement.
- Sensitive actions, including time-limit changes, viewing-space changes,
  sync-policy changes, trust-link changes, and history clearing, can require
  re-auth even inside an existing admin session.
- Failed writes do not create successful history rows.
- Local UI edit mode remains virtual: the parent edits the protected profile
  without making that protected profile the active admin profile.

## Current Runtime Boundary

Current product runtime source implements accepted local managed-save metadata,
protected failed-unlock history rows, local dashboard session TTL, fresher
reauth for sensitive managed actions, profile-persisted failed-attempt rate
limiting for tab-view managed unlock prompts and background session PIN auth,
while the background PIN/session cache remains memory-only:

```text
runtime local managed edit policy revision store: present
runtime local managed edit action-history writer: present
runtime local managed edit failed-unlock logger: present for managed child/history/viewing-space/time-limit unlock gates
runtime local managed edit admin session TTL: present for tab-view and background session cache
runtime local managed edit sensitive-action re-auth gate: present for managed child/history/viewing-space/time-limit unlock gates
runtime local managed edit failed-attempt rate limit: present for tab-view unlock prompts and background session PIN auth
runtime local managed edit failed-attempt rate limit durability: present for tab-view managed unlock prompts and background session PIN auth through profile.managedPolicyState.adminFailedUnlockRateLimit
runtime managed-admin authority helper: present for local dashboard actor/target decisions, admin-session TTL, sensitive reauth, and dashboard failed-unlock window normalization
runtime local managed edit fresh protected target gate: present for saveManagedChildSurface before target surface mutation
runtime behavior changed by this contract: yes
```

The current runtime writes:

- `profile.managedPolicyState.localManagedEdits.main`
- `profile.managedPolicyState.localManagedEdits.kids`
- `profile.managedPolicyState.adminFailedUnlockRateLimit`
- `profile.managedActionHistory[]`
- protected `admin_session.failed_unlock` rows for failed parent unlocks

Rows are local, protected metadata. They are evidence and parent/caregiver UX;
they are not policy authority. Future implementation should reuse or lift this
small local managed-write helper near the profile storage boundary so UI edits,
local bulk apply, and later P2P applies do not each invent separate
revision/history behavior.

## Addendum - 2026-06-20

The local editor now uses the broader protected-profile wording that the UI shows
to parents and caregivers. Runtime entry still rejects Default and missing
targets, and it still rejects child actors through the shared authority helper.
The important safety boundary is no longer "target must literally be type
child"; it is "target must be a non-Default profile that the active
parent/account authority can manage, with fresh save-time recheck before any
surface mutation."

## Addendum - 2026-06-05

This slice promotes the local parent/child authority decision into
`js/managed_admin_authority.js` and loads it before `js/tab-view.js`. The
dashboard still owns UI prompting, PIN verification, profile writes, and action
history rendering, but the actor/target allow/reject decision and admin-session
TTL/reauth decision now have one shared runtime helper that future
local-network and Nanah managed-policy paths can reuse.

The helper is deliberately narrow. It does not trust LAN discovery, action
history, or a child PIN as authority. It only answers:

- whether an actor profile can manage a target profile;
- whether a cached admin unlock session is still valid;
- what TTL/reauth timestamps a new admin session receives;
- how dashboard failed-unlock rate-limit windows normalize.

This reduces the risk that extension UI, local-network management, and
downstream app sync fork the parent/caregiver authority contract.

The 2026-06-05 follow-up hardening also closes stale edit-state gaps before
later local-network/P2P work relies on this helper. The shared helper rejects
missing target and actor profiles before broad Default/admin decisions, and the
dashboard save path rejects missing or no-longer-child targets after reloading
fresh profile state and before mutating any child surface.

The same 2026-06-05 hardening slice also makes background
`FilterTube_SessionPinAuth` failed-attempt rate limiting durable. The verified
PIN/session entry remains in `sessionPinCache` memory only, but failed attempts
now merge memory state with `profile.managedPolicyState.adminFailedUnlockRateLimit`,
persist new failed-attempt windows, and clear the persisted row on successful
PIN verification or no-PIN profiles.

## Verification

Focused test:

```bash
node --test \
  tests/runtime/managed-admin-authority-helper-current-behavior.test.mjs \
  tests/runtime/managed-child-local-authority-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
