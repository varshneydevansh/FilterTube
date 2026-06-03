# Audit: Managed Parent Authority Inventory

**Generated**: 2026-06-03  
**Status**: Runtime route-gate proof and local managed-save revision/history
proof updated. Runtime behavior changed for protected child Main/Kids denial
and accepted same-device parent-managed child saves; remote-policy and
time-limit enforcement remain pending.
**Goal slice**: Implementation order item 1 plus first runtime viewing-space
enforcement slice.
**Lane proof**: `test:settings` for profile/Nanah authority and `test:release`
for adding this focused proof test to the lane workflow.  
**Owner repo**: `/Users/devanshvarshney/FilterTube`

## Purpose

This inventory records the current parent, child, PIN, profile, Nanah, import,
viewing-space, and time-limit authority paths while the managed-control system
is being built. It now includes the first extension runtime viewing-space gate:
child/protected profiles can be denied Main YouTube or YouTube Kids at content
runtime from local profile settings.

This document still does not approve remote policy writes by itself. Signed
managed policy envelopes, remote revision/replay stores, protected history UI,
failed-auth history, and time-budget runtime remain separate required slices.

## Issue 60 Local-Network Caregiver Addendum

Dartsgame974's Issue 60 follow-up clarified that the managed-control feature is
not only a generic parental-control flow. It also covers caregiver and
pediatric/sensitive-user scenarios where a trusted parent or caregiver wants to
show the useful parts of the internet while reducing exposure to content that
can destabilize the protected user.

This addendum does not create remote runtime authority by itself, but it changes
the planning priority for the managed policy work:

- Local-network or P2P management should be treated as a first-class managed
  profile workflow, not a later nice-to-have.
- Password/PIN protected admin authority is required so the protected end user
  cannot change managed rules or disable protection.
- Remote rule updates must cover the same rule classes that local FilterTube
  already controls: videos, keywords, channels, profile viewing spaces, and
  later time limits.
- Feedback/history/logs are required parent/caregiver UX, but they are not
  policy authority.
- The first implementation should remain extension-first because this repo owns
  the upstream profile/settings/policy contract used by downstream apps.

The detailed phased plan is:

```text
docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md
```

## Evidence Files

| Area | Current evidence |
|---|---|
| Profile storage | `js/io_manager.js` |
| Local profile state and import flows | `js/state_manager.js` |
| Dashboard/profile/Nanah UI authority | `js/tab-view.js` |
| Background PIN/session gates | `js/background.js` |
| Nanah portable payload adapter | `js/nanah_sync_adapter.js` |
| Existing profile/PIN model | `docs/PROFILES_PIN_MODEL.md` |
| Existing Nanah user model | `docs/NANAH_USER_GUIDE.md` |
| Managed child sync/time-limit plan | `docs/audit/FILTERTUBE_MANAGED_CHILD_SYNC_TIME_LIMIT_PLAN_2026-06-02.md` |
| Managed policy schema/revision contract | `docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md` |
| Managed child local authority contract | `docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md` |
| Managed viewing-space route-gate contract | `docs/audit/FILTERTUBE_MANAGED_VIEWING_SPACE_ROUTE_GATE_CONTRACT_2026-06-03.md` |
| Managed child time-limit schema contract | `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md` |
| Managed policy action-history model | `docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md` |
| Local-network discovery authority boundary | `docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md` |

## Current Authority Map

### `ftProfilesV4` load and save

Current behavior:

- `loadProfilesV4()` reads `ftProfilesV4`, repairs invalid profile type and
  parent fields through `sanitizeProfilesV4(...)`, writes the sanitized object
  back when needed, or creates a migrated default V4 profile model from legacy
  storage.
- `saveProfilesV4(nextProfiles)` writes `ftProfilesV4` when the shape validates.
- Invalid `saveProfilesV4(...)` input currently writes an empty payload through
  `writeStorage({})`. Existing tests already pin this as current behavior.

Authority meaning:

- `ftProfilesV4` is the current profile authority object.
- The current storage layer validates shape and parent ids, but it does not
  record revision, source actor, managed-policy envelope, or rollback metadata.

Current gap:

- There is no remote managed policy revision store for parent-to-child updates.
- There is no signed/authenticated policy envelope persisted with accepted
  child policies.

### Local parent-managed child editing

Current behavior:

- `canActiveProfileManageProfile(profilesV4, targetProfileId)` blocks active
  child profiles from managing any target.
- That same gate allows:
  - Default profile managing any target.
  - The active profile managing itself.
  - A parent account managing a child whose `parentProfileId` matches the
    active account.
- `startManagedChildEdit(profileId, surface)` requires the target profile to be
  a child profile, verifies the active profile can manage it, then requires the
  active parent/account profile to be unlocked.
- `saveManagedChildSurface(surface, mutator)` reloads fresh `ftProfilesV4`,
  re-runs `canActiveProfileManageProfile(...)`, writes only the target child
  profile surface, records local accepted-save revision/history metadata, then
  reloads settings and UI.

Authority meaning:

- Same-device parent-managed child edits already have a local UI authority
  gate.
- Child PIN unlock does not make the child an admin in this flow.
- The save path re-checks authority after the editor is opened, which protects
  against some profile-switch races.

Current local-write boundary:

- Accepted same-device managed child saves now create a local managed edit
  revision at `profile.managedPolicyState.localManagedEdits.{main,kids}`.
- Accepted same-device managed child saves now emit one protected redacted
  action-history row at `profile.managedActionHistory[]`.
- These local rows are not signed remote-policy authority and do not yet create
  a global revision that all extension contexts can compare against.

### PIN/session authority

Current behavior:

- `background.js` keeps `sessionPinCache` in memory.
- `FilterTube_SessionPinAuth` is handled only after `isTrustedUiSender(sender)`
  succeeds, so this path is trusted UI sender gated.
- `verifyAndCacheSessionPin(profileId, pin)` loads `ftProfilesV4`, extracts the
  relevant verifier, runs `FilterTubeSecurity.verifyPin(...)`, and stores the
  PIN in memory only when verification succeeds.
- `isProfileSessionAuthorized(profilesV4, profileId)` returns true when the
  profile has no verifier, otherwise it requires a cached session PIN entry.

Authority meaning:

- Current PIN authority is local and session-scoped.
- PIN values are not written as part of session auth.
- Background import/mutation paths can use `isProfileSessionAuthorized(...)` to
  reject writes to locked profiles.

Current gap:

- Session PIN cache has no managed-policy revision binding.
- Trust revocation does not currently invalidate policy authority cache because
  that cache does not exist yet.

### Batch subscription/whitelist import

Current behavior:

- `StateManager.importSubscribedChannelsToWhitelist(...)` requires the target
  profile id, checks the active profile before and after the YouTube tab fetch,
  rejects if the UI becomes locked, and then asks background to save.
- Background `FilterTube_BatchImportWhitelistChannels` requires a trusted UI
  sender, reloads `ftProfilesV4`, confirms the active id still equals the target
  profile id, rejects locked profile sessions, and then writes the target
  profile's Main whitelist channels.

Authority meaning:

- This import path already has a useful pattern for future managed child writes:
  target profile id, active-profile race check, lock check, background writer.

Current gap:

- It is limited to the currently active profile, not a parent editing a child
  in virtual edit mode.
- It has no managed policy revision or actor report.

### Nanah scoped payloads

Current behavior:

- `buildScopedPortablePayload(io, scope)` exports the active profile's `main` or
  `kids` section with profile metadata.
- `applyScopedPortablePayload(io, portable, { strategy, targetProfileId })`
  resolves the target profile to explicit `targetProfileId` or the active
  profile, then writes the incoming `main` or `kids` section with merge/replace
  behavior.
- `applyIncomingEnvelope(envelope, { strategy, auth, scope, targetProfileId })`
  extracts an `app_sync` or `control_proposal` payload, supports preview, and
  forwards profile-scoped `main` or `kids` work to
  `applyScopedPortablePayload(...)`.

Authority meaning:

- The adapter already supports profile-targeted scoped writes.
- It is suitable as a future lower-level apply primitive after an upper-layer
  managed policy envelope validates trust, scope, target, revision, and
  integrity.

Current gap:

- The adapter itself does not validate managed link identity.
- The adapter itself does not know trusted source role, replica target role,
  locked-child mode, revision, replay state, or signature integrity.
- The adapter supports `app_sync` and `control_proposal`; it does not yet
  support a `filtertube_managed_policy` envelope.

### Nanah managed link policy

Current behavior:

- `normalizeNanahTrustedLink(entry)` normalizes local/remote roles, link type,
  allowed scopes, default scope, apply mode, auto-apply, reconnect mode, locked
  child mode, child protection level, target profile behavior, and fixed target
  profile metadata.
- `resolveNanahLocalTargetProfile(trustedLink, profilesV4)` accepts fixed
  target profile policy only for a managed link where the local device is
  `replica` and the remote device is `source`.
- Missing fixed target profiles fail closed with an error.
- `ensureNanahIncomingAuth(...)` can bypass local child unlock only when the
  incoming update is not `full`, the target is a locked child, the trusted link
  is `managed_link`, local role is `replica`, remote role is `source`,
  authority mode is not peer, and locked child mode is
  `allow_trusted_updates`.
- `handleNanahIncomingProposal(...)` distinguishes existing managed receiver
  sessions from first managed source sessions, can require trusted reconnect
  approval, can auto-apply only when saved policy permits it, and otherwise
  shows approval UI.
- First managed source connection can save a managed link with allowed scopes,
  apply mode, reconnect mode, locked-child mode, child protection level, and
  fixed target profile metadata.

Authority meaning:

- Current Nanah UI already models parent/source to child/replica links.
- Current saved policy can target a fixed child profile and can decide whether
  trusted updates may apply while the child profile is locked.
- This is the correct foundation for pull-on-open and later mailbox delivery.

Current gap:

- There is no monotonic managed policy revision.
- There is no stale/replay rejection.
- There is no per-target policy hash idempotency check.
- There is no signed managed policy envelope.
- Trust revocation does not yet purge queued updates or invalidate an accepted
  policy revision because those structures do not exist yet.

### Main/Kids viewing-space settings

Current behavior:

- `tab-view.js` reads `allowMainViewing` and `allowKidsViewing` into a profile
  viewing access label.
- Background compile now exposes `managedViewingRouteGate` only for active
  child/protected profiles.
- The isolated content bridge now blocks denied child Main/Kids routes with a
  managed-profile overlay before settings are forwarded into the page-world
  runtime.
- The audit contract
  `docs/audit/FILTERTUBE_MANAGED_VIEWING_SPACE_ROUTE_GATE_CONTRACT_2026-06-03.md`
  now pins Main/Kids route-gate decisions and no-work states, plus denial
  overlay and SPA revalidation events.

Authority meaning:

- Local profile viewing settings now have extension runtime effect for child
  profiles.
- This is not remote managed-policy authority yet; Nanah/local-network writes
  still need envelope, revision, device-binding, and integrity checks before
  automatic application.

Current gap:

- Extension-side YouTube runtime now route-gates child Main/Kids access from
  `allowMainViewing` and `allowKidsViewing`.
- Runtime route-gate implementation, denied-route overlay, and open-tab SPA
  revalidation are now present.
- There is still no signed remote viewing-space policy envelope or monotonic
  revision store for parent/caregiver device updates.

### Time-limit policy

Current behavior:

- Accounts & Sync can now set, change, and disable a profile-owned
  `settings.timeLimitPolicy` through parent/account authority.
- Import/profile sanitation preserves valid `filtertube_managed_time_limit`
  policies and drops malformed policy payloads.
- Extension runtime now compiles a valid active child profile
  `settings.timeLimitPolicy` into `managedTimeLimitPolicy`.
- The content bridge sends active/focused YouTube heartbeats only while that
  policy is enabled on a YouTube-owned route.
- Background runtime stores whole-profile daily usage in `ftManagedTimeUsageV1`
  and clamps remaining budget by policy timezone date, revision, and hash.
- The child/protected timeout overlay appears only after the background reports
  an exhausted budget, and it does not write hidden-content stats.
- The audit contract
  `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md`
  now pins the schema, local UI/store boundary, runtime heartbeat service, and
  timeout overlay fixtures.

Authority meaning:

- Time limit policy editing remains local parent/account authority. Runtime
  enforcement is now a background/content implementation slice for active child
  profiles with an enabled policy.

Current gap:

- Remote time-limit updates are still not envelope/revision-bound.
- The first runtime path uses whole-profile daily budget; per-surface budget
  enforcement remains a later refinement.
- Fake-clock/browser-level active-tab smoke is still manual, not automated
  against an installed extension.

## Current Gap Summary

| Gap | Risk | Required next proof |
|---|---|---|
| No managed policy envelope | Remote apply can only be governed by UI/trusted-link policy, not a durable policy object. | Schema and validation tests before runtime writes. |
| No remote revision store | Stale or replayed remote updates cannot be rejected as a first-class rule. Local same-device managed saves now have local revision metadata only. | Monotonic revision fixtures per parent/source and child target. |
| No signature/integrity check | Trust is link/session-policy based, not envelope-authenticated. | Signed/authenticated envelope tests. |
| No canonical payload/integrity binding | A signed-looking update could otherwise carry a different scope, target, source device, revision, hash, or payload family than the policy being applied. | Binding-tuple fixtures for link, scope, target, source, revision, policy hash, and payload family. |
| No signed remote Main/Kids policy gate | Local child route denial now works, but remote updates are still not envelope/revision-bound. | Managed policy envelope, revision store, and Nanah/local-network apply wrapper before remote route-policy writes. |
| No time-limit runtime | Parent cannot yet enforce daily YouTube budgets. | Runtime active-tab counter, route-gate, overlay, fake-clock, and performance fixtures after the schema contract. |
| Adapter lacks trust context | `applyIncomingEnvelope(...)` applies after caller-side checks. | Upper-layer managed policy apply wrapper before adapter call. |
| Locked-child bypass has no revision binding | `allow_trusted_updates` can skip unlock for matching managed sessions, but not with policy revision constraints. | Locked child managed-policy fixtures. |
| No mailbox protocol | Offline later delivery is not specified at runtime. | Ciphertext/replay/ack protocol doc before server work. |
| No local-network management contract | Same-network discovery could be mistaken for authority. | Separate discovery, pairing, transport, and policy-authority proof. |
| Partial protected-user action history | Accepted local managed child saves now have durable redacted rows; rejected remote updates, failed unlocks, access control, clear policy, and UI are still missing. | Action-history access/clear fixtures and remote reject/failed-auth writers. |
| No admin lock for remote management | Child PIN or protected profile state could be confused with admin authority. | Parent/account PIN and trusted-device authority fixtures before writes. |
| No pairing key/signature contract | P2P or local-network transport could authenticate reachability instead of authority. | Device-bound key, signature/integrity, rotation, revocation, and compromise-recovery fixtures. |
| No hostile-LAN fixture set | Spoofed peer announcements, duplicate device ids, stale pairings, reconnect drift, or MITM attempts could be missed. | Discovery-versus-authority negative fixtures before local-network writes. |
| No protected log access policy | Action history could leak sensitive rules or be cleared by the protected user. | Log viewer/clear authority, retention, redaction/encryption, and failed-attempt durability proof. |
| No conflict-resolution matrix | Simultaneous parent edits or mailbox delivery after revocation could produce nondeterministic policy state. | Equal-revision, different-hash, multi-parent, local-vs-remote, and revoked-queued-update fixtures. |

## Required Next Implementation Gates

Before adding parent-managed runtime behavior:

1. Keep the `filtertube_managed_policy` schema/revision fixtures passing while
   moving from contract proof into runtime helper code.
2. Add accepted revision state per parent/source device and target child
   profile.
3. Require scope, target profile, link role, locked-child mode, revision, and
   integrity checks before any Nanah managed policy write.
4. Keep existing `applyScopedPortablePayload(...)` as the low-level profile
   write primitive, but call it only after managed envelope validation.
5. Keep Main/Kids route policy fixtures passing while extending the local
   runtime route gate toward signed remote policy apply.
6. Keep time-limit schema tests passing before any background timer or overlay
   work, then add runtime counter, route-gate, and overlay fixtures.
7. Preserve no-policy/no-work behavior for existing YouTube filtering paths.
8. Keep local-network discovery separate from managed policy authority.
9. Keep local action-history fixtures passing and add access/clear plus rejected
   remote/failed-auth fixtures before exposing caregiver-facing history UI.
10. Require parent/account admin authority for protected remote management;
    child PIN must never authorize managed policy edits.
11. Require pairing key/signature, device binding, rotation, revocation, and
    compromise-recovery proof before accepting local-network/P2P policy writes.
12. Add hostile-LAN and simultaneous-update conflict fixtures before enabling
    automatic remote apply.
13. Protect action-history access and clearing behind parent/account authority,
    with redaction/encryption and retention rules defined before UI exposure.

## Verification

This proof is pinned by:

```bash
npm run test:settings
npm run test:changed
```

The focused test is:

```text
tests/runtime/managed-parent-authority-inventory-current-behavior.test.mjs
```

This proof test is intentionally registered in `scripts/test-lane-config.mjs`
under the settings lane because future managed-policy schema, profile authority,
Nanah apply, and time-limit settings changes must rerun it automatically. That
lane workflow change is release-surface proof only; it does not alter extension
runtime behavior or packaged product files.
