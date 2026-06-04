# Audit: Managed Parent Authority Inventory

**Generated**: 2026-06-03  
**Status**: Runtime route-gate, local managed-save revision/history, protected
history access, time-limit enforcement, and validation-only managed-policy
envelope proofs updated. Runtime behavior changed for protected child Main/Kids
denial, accepted same-device parent-managed child saves, parent/account history
viewing, accepted-row history clearing, child time-budget enforcement, and
managed-envelope validation/classification; remote-policy apply remains
pending.
**Goal slice**: Implementation order item 1 plus first runtime viewing-space
enforcement slice.
**Lane proof**: `test:settings` for profile/Nanah authority and `test:release`
for adding this focused proof test to the lane workflow.  
**Owner repo**: `/Users/devanshvarshney/FilterTube`

## Purpose

This inventory records the current parent, child, PIN, profile, Nanah, import,
viewing-space, history, and time-limit authority paths while the
managed-control system is being built. It now includes extension runtime
viewing-space denial, local protected history access, and active child
time-budget enforcement from local profile settings.

This document still does not approve remote policy writes by itself. The first
managed-envelope validator now exists, but persistent remote revision/replay
stores, cryptographic signature verification, remote accept/reject history
rows, and failed-auth history remain separate required slices.

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
- Parent/account profiles that can manage a child can now open that child's
  local protected action history from the profile row.
- The local clear path removes accepted rows but preserves rejected, conflict,
  failed-auth, expired-session, trust, time-limit, and viewing-space evidence.
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
- `validateManagedPolicyEnvelope(envelope, context)` now validates a
  `filtertube_managed_policy` envelope against trusted-link role, source device,
  source profile, target profile, allowed scope, key id, key version, payload
  family, integrity binding, and supplied revision state.
- `extractPortableFromEnvelope(...)` rejects `filtertube_managed_policy`
  envelopes with `Managed policy envelopes require validated managed apply
  flow`, so the old portable-payload path cannot accidentally mutate a profile
  from the new envelope type.

Authority meaning:

- The adapter already supports profile-targeted scoped writes.
- It is suitable as a future lower-level apply primitive after an upper-layer
  managed policy envelope validates trust, scope, target, revision, and
  integrity.
- The adapter now provides the first validation-only managed envelope helper,
  but that helper is not a persistent policy authority and does not write
  profiles.

Current gap:

- The adapter validates link/profile/scope/device/key/revision inputs only from
  caller-supplied context; there is still no remote managed policy revision
  store.
- There is still no persisted stale/replay rejection state.
- There is no cryptographic signature verification yet; the first helper checks
  integrity field presence and binding tuple consistency.
- The adapter supports validation-only `filtertube_managed_policy` handling,
  but there is still no managed apply wrapper that records accepted/rejected
  history and then calls the low-level scoped write primitive.

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

- The first validation-only managed policy envelope helper exists in
  `js/nanah_sync_adapter.js`.
- There is no persisted monotonic managed policy revision.
- There is still no persisted stale/replay rejection state.
- There is no stored per-target policy hash idempotency state.
- There is no cryptographic signature verification yet.
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
| Validation-only managed policy envelope helper | Remote apply still cannot use a durable policy object because there is no managed apply wrapper or persistent revision state. | Managed apply wrapper plus accepted/rejected history rows before runtime writes. |
| No remote revision store | Stale or replayed remote updates cannot be rejected as a first-class rule. Local same-device managed saves now have local revision metadata only. | Monotonic revision fixtures per parent/source and child target. |
| No cryptographic signature verification | Trust is link/session-policy plus validation-field based, not cryptographically authenticated yet. | Signed/authenticated envelope tests. |
| Partial canonical payload/integrity binding | The helper checks binding fields, but no real signature verification or canonical hash recomputation exists yet. | Binding-tuple fixtures plus cryptographic verification and canonical payload hash proof. |
| No signed remote Main/Kids policy gate | Local child route denial now works, but remote updates are still not envelope/revision-bound. | Managed policy envelope, revision store, and Nanah/local-network apply wrapper before remote route-policy writes. |
| No remote time-limit policy apply | Local child time-budget enforcement exists, but parent/caregiver device updates are still not envelope/revision-bound. | Managed policy envelope, revision store, and remote time-limit fixtures before Nanah/local-network writes. |
| Adapter lacks persisted trust context | `validateManagedPolicyEnvelope(...)` depends on caller-supplied trusted-link/profile/revision context and `applyIncomingEnvelope(...)` still applies legacy payloads after caller-side checks. | Upper-layer managed policy apply wrapper before adapter call. |
| Locked-child bypass has no revision binding | `allow_trusted_updates` can skip unlock for matching managed sessions, but not with policy revision constraints. | Locked child managed-policy fixtures. |
| No mailbox protocol | Offline later delivery is not specified at runtime. | Ciphertext/replay/ack protocol doc before server work. |
| No local-network management contract | Same-network discovery could be mistaken for authority. | Separate discovery, pairing, transport, and policy-authority proof. |
| Partial protected-user action history | Accepted local managed child saves, local parent/account history access, and accepted-row clearing exist; rejected remote updates and failed unlock rows are still missing. | Remote reject/failed-auth writers and retention fixtures. |
| No admin lock for remote management | Child PIN or protected profile state could be confused with admin authority. | Parent/account PIN and trusted-device authority fixtures before writes. |
| No pairing key/signature contract | P2P or local-network transport could authenticate reachability instead of authority. | Device-bound key, signature/integrity, rotation, revocation, and compromise-recovery fixtures. |
| No hostile-LAN fixture set | Spoofed peer announcements, duplicate device ids, stale pairings, reconnect drift, or MITM attempts could be missed. | Discovery-versus-authority negative fixtures before local-network writes. |
| Partial protected log access policy | Local child history viewer and accepted-row clear path now preserve protected evidence; encrypted summaries and failed-attempt durability remain pending. | Retention, encryption, and failed-attempt durability proof. |
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
6. Keep time-limit schema and runtime counter/overlay fixtures passing before
   adding remote time-limit policy apply.
7. Preserve no-policy/no-work behavior for existing YouTube filtering paths.
8. Keep local-network discovery separate from managed policy authority.
9. Keep local action-history access/clear fixtures passing and add rejected
   remote/failed-auth fixtures before accepting remote policy writes.
10. Require parent/account admin authority for protected remote management;
    child PIN must never authorize managed policy edits.
11. Require pairing key/signature, device binding, rotation, revocation, and
    compromise-recovery proof before accepting local-network/P2P policy writes.
12. Add hostile-LAN and simultaneous-update conflict fixtures before enabling
    automatic remote apply.
13. Keep action-history access and accepted-row clearing behind parent/account
    authority, then add encryption and failed-attempt retention proof.

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
