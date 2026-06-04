# Audit: Managed Parent Authority Inventory

**Generated**: 2026-06-03  
**Status**: Runtime route-gate, local managed-save revision/history, protected
failed-unlock history, protected history access, time-limit enforcement, and
receive-side managed-policy validation/history proofs updated, with encrypted
mailbox protocol proof specified, managed pairing public-key descriptor
persistence added, source-side managed signing keypair provisioning plus
adapter signing helper added, and eligible fixed-target Main/Kids plus granular
managed live send added, with local/decrypted mailbox-item intake added for the
same managed-policy validator/apply path. Runtime behavior changed for protected child Main/Kids denial, accepted same-device
parent-managed child saves, protected parent unlock-failure evidence,
parent/account history viewing, accepted-row history clearing, dashboard and
background admin-session expiry, sensitive managed-action re-auth,
dashboard-persisted managed/admin failed-attempt rate limiting with in-memory
background session PIN rate limiting, child time-budget enforcement,
managed-envelope validation/classification, managed-policy receive/apply
evidence, managed public-key descriptor pairing, source signing-key
provisioning, eligible signed Main/Kids/granular live managed-policy sends, and
an explicit Main/Kids rule-source picker plus Rule bundle send for granular
sends, plus a
provider-gated dashboard/profile-open pull hook for already-decrypted mailbox
items, redacted provider ack handoff for mailbox apply/reject outcomes,
trusted-link removal cleanup for target-local accepted managed-policy state,
plus an extension-owned downstream app policy contract artifact wired
into the app sync manifest. Active/full signed conversion, richer viewing-space/time-limit
and multi-target bulk outbound controls, server mailbox pull/decryption runtime, server mailbox queue purge,
local-network discovery runtime, and app native settings/iOS enforcement proofs
remain pending.
**Goal slice**: Implementation order item 1 plus first runtime viewing-space
enforcement slice.
**Lane proof**: `test:settings` for profile/Nanah authority and `test:release`
for adding this focused proof test to the lane workflow.  
**Owner repo**: `/Users/devanshvarshney/FilterTube`

## Purpose

This inventory records the current parent, child, PIN, profile, Nanah, import,
viewing-space, history, and time-limit authority paths while the
managed-control system is being built. It now includes extension runtime
viewing-space denial, local protected history access, active child time-budget
enforcement from local profile settings, receive-side managed-policy
validation history, managed pairing public-key descriptor persistence,
source-side managed signing keypair provisioning with an adapter signing helper,
and eligible fixed-target Main/Kids plus granular live signed-send support.

This document still does not approve remote policy writes by itself. The first
managed-envelope validator, validated apply wrapper, receive-side
validation/apply history writer, and accepted-revision state writer now exist,
and the validator requires signature-verification evidence. Dashboard
WebCrypto verifier plumbing now exists when a trusted link carries source
public-key material. Pairing-time public-key descriptor persistence exists, and
source/parent Nanah sessions can provision local managed signing key material.
Eligible fixed-target Main/Kids, keyword, channel, video, viewing-space, and
time-limit live sends can now build signed managed-policy envelopes. Granular
rule sends use an explicit Main/Kids rule-source picker that defaults from the
dashboard's active surface, and Rule bundle expands into separate signed
keyword, channel, and video envelopes instead of creating a new receive-side
scope. Parent-managed child edit mode can provide the child-policy payload
source while the parent profile remains signing authority.
Local/decrypted mailbox items can now bind
mailbox metadata to the decrypted managed envelope before calling the same
managed-policy validation/apply path. The dashboard/profile-open hook can ask a
trusted local provider for already-decrypted mailbox items when an opted-in
managed replica link opens and can return redacted ack records to that provider
after each local apply/reject decision. Trusted-link removal now purges
target-local accepted managed-policy revision state for that link and clears
matching open-sync status rows before the removed trust can be reused as local
authority evidence. Server mailbox pull, mailbox decryption client, server
mailbox queue purge, active/full signed conversion, richer viewing-space/time-limit
and multi-target bulk outbound controls, local-network delivery runtime, background/session-service
failed-attempt durability, and remote admin session semantics remain separate
required slices.

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
| Managed parent UI surface spec | `docs/audit/FILTERTUBE_MANAGED_PARENT_UI_SURFACE_SPEC_2026-06-03.md` |
| Local-network discovery authority boundary | `docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md` |
| Managed policy encrypted mailbox protocol | `docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md` |
| Nanah managed pull-on-open hook | `docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md` |
| Managed pairing public-key descriptor | `docs/audit/FILTERTUBE_NANAH_MANAGED_PAIRING_KEY_DESCRIPTOR_2026-06-04.md` |
| Managed signing keypair provisioning | `docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md` |
| Managed app policy contract parity | `docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md` |

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
- Failed parent/account unlock attempts for managed child edit, protected
  history view/clear, viewing-space changes, and time-limit changes now emit
  protected `admin_session.failed_unlock` evidence rows.
- Parent/account profiles that can manage a child can now open that child's
  local protected action history from the profile row.
- Parent/account profiles that can manage a child can now see a compact,
  read-only managed status line on that child row. The line summarizes local
  Main/Kids revision state, accepted remote policy scope/link counts, and
  protected history counts without exposing rule values or raw policy data.
- Child/protected admin surfaces do not receive the detailed managed status
  text and still gate Edit Rules, History, viewing-space, and time-limit
  controls.
- The local clear path removes accepted rows but preserves rejected, conflict,
  failed-auth, expired-session, trust, time-limit, and viewing-space evidence.
- These local rows are not signed remote-policy authority and do not yet create
  a global revision that all extension contexts can compare against.
- The profile-row status line is display evidence only; it does not weaken or
  replace the save-time authority checks.

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
  family, integrity binding, explicit signature-verification evidence, and
  supplied revision state.
- `handleNanahIncomingManagedPolicyEnvelope(envelope)` now routes
  `filtertube_managed_policy` receive events through validation and records a
  protected validation-history row on the known target profile when possible.
- `extractPortableFromEnvelope(...)` rejects `filtertube_managed_policy`
  envelopes with `Managed policy envelopes require validated managed apply
  flow`, so the old portable-payload path cannot accidentally mutate a profile
  from the new envelope type.

Authority meaning:

- The adapter already supports profile-targeted scoped writes.
- It is suitable as a future lower-level apply primitive after an upper-layer
  managed policy envelope validates trust, scope, target, revision, and
  integrity.
- The adapter now provides a validated managed policy apply wrapper that can
  write accepted keyword, channel, video, viewing-space, time-limit, main, and
  kids policy to the fixed target child profile only.
- The apply wrapper persists accepted revision/hash state under
  `profile.managedPolicyState.remoteManagedPolicies[linkId][scope]` before the
  dashboard records accepted remote-policy history.
- The validation helper now fails closed with `missing_signature_verifier`,
  `missing_public_key_material`, or `signature_invalid` when a caller cannot
  provide trusted signature evidence.
- The dashboard receive path now provides managed-policy envelope parsing,
  trusted-link/profile/revision context construction, protected validation
  evidence rows, adapter WebCrypto Ed25519 verifier evidence when trusted-link
      `sourcePublicKeyJwk` material exists, validated apply dispatch, and
      accepted/rejected apply history.
    - The dashboard send path can now build signed `filtertube_managed_policy`
      envelopes for fixed-target Main/Kids, keyword, channel, video,
      viewing-space, and time-limit Source -> Replica managed links.

Current gap:

- The adapter validates link/profile/scope/device/key/revision inputs from
  caller-supplied context and rechecks the persisted source/target
  parent-child binding before writing.
- Persisted stale/replay authority state exists for accepted managed policies,
  but only inside the target profile's managed policy state.
    - The signature verifier gate and adapter verifier helper exist. Pairing can
      persist source public-key descriptor material, source sessions can now
      provision a local managed signing keypair plus public descriptor, and
      eligible fixed-target Main/Kids and granular managed live sends now use
      signed envelopes, with explicit Main/Kids rule-source selection for
      granular sends, plus Rule bundle expansion into separate signed
      keyword/channel/video envelopes. Active/full signed conversion and richer
      viewing-space/time-limit or multi-target bulk outbound controls remain pending. Without trusted stored public-key
      material, the receive path still rejects otherwise well-shaped managed
      envelopes rather than treating them as valid.
- The adapter's validated apply wrapper still depends on higher layers for
  canonical hash recomputation, key lookup, local-network pull scheduling,
  encrypted mailbox runtime delivery, and remote admin session semantics.

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

- The first managed policy envelope validator exists in
  `js/nanah_sync_adapter.js`.
- The first receive-side validation/apply history writer exists in
  `js/tab-view.js`.
- A persisted accepted monotonic managed policy revision/hash writer now stores
  state under `profile.managedPolicyState.remoteManagedPolicies[linkId][scope]`.
- Persisted stale/replay authority state now exists for accepted managed
  policies on the target profile.
    - There is now a signature verifier gate plus adapter WebCrypto verifier
      helper, Nanah pairing can persist trusted source public-key descriptors,
      source sessions can provision managed signing keypairs, and eligible
      fixed-target Main/Kids and granular live signed policy construction is
      wired.
- Trusted-link removal now purges target-local accepted managed-policy revision
  state for the removed link and clears matching open-sync status rows. The
  encrypted mailbox protocol specifies revoked queued delivery behavior, but no
  runtime queue exists yet, so server mailbox queue purge remains pending.

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
| Validated managed policy apply wrapper | Remote apply can now persist a durable accepted-revision object for a fixed child target, but only when a caller supplies accepted validation context. | Key-store/WebCrypto verifier plumbing and live Nanah/local-network receive tests before automatic remote apply. |
| Target-local remote revision store | Stale or replayed remote updates can now be rejected per target profile/link/scope after the first accepted write, and trusted-link removal now purges accepted state plus open-sync status for the removed link. There is still no server mailbox queue or multi-device conflict-resolution layer yet. | Multi-parent, revoked-link, equal-revision/different-hash, mailbox-delivery, and server-queue-purge fixtures. |
| Pairing public-key descriptor, source keypair provisioning, and eligible live signed send present | The helper now requires verifier evidence, adapter WebCrypto verification is wired, Nanah pairing can persist advertised source public-key descriptors, source sessions can provision local managed signing keypairs, fixed-target Main/Kids, keyword, channel, video, viewing-space, and time-limit managed live sends build signed `filtertube_managed_policy` envelopes, granular rule sends expose an explicit Main/Kids rule-source picker, and Rule bundle expands into separate signed keyword/channel/video envelopes. Active/full sends and richer viewing-space/time-limit or multi-target bulk outbound controls still remain proposal/spec work. | Authenticated two-device live-delivery smoke, signed granular live-delivery smoke, rotation/revocation, and active/full conversion policy. |
| Partial canonical payload/integrity binding | The helper checks binding fields and verifier result, but no canonical payload hash recomputation exists yet. | Binding-tuple fixtures plus canonical payload hash proof. |
| Signed remote managed-policy gate is partially live | Fixed-target Main/Kids, keyword, channel, video, viewing-space, and time-limit managed Nanah sends can now travel as signed envelopes and receive-side code validates before apply. Granular keyword/channel/video sends can choose Main or Kids local rule source explicitly, and Rule bundle sends those three granular scopes as separate signed envelopes. Active/full signed conversion, mailbox delivery, and richer viewing-space/time-limit or multi-target bulk outbound controls are still pending. | Installed two-device Main/Kids and granular smoke plus dedicated signed route/time policy fixtures. |
| Remote time-limit policy apply is wrapper-backed and live-send eligible | Local child time-budget enforcement exists and accepted managed envelopes can write runtime-compatible time-limit policy; the source send path can now emit signed live time-limit envelopes when the profile has a saved time limit. | Installed two-device signed remote time-limit smoke through Nanah/local-network receive. |
| Adapter depends on caller trust context | `validateManagedPolicyEnvelope(...)` depends on caller-supplied trusted-link/profile/revision/signature context; the wrapper rechecks stored profiles before writing but does not fetch trust keys itself. | Keep dashboard receive context and add pairing key lookup/revocation fixtures before automatic apply. |
| Locked-child bypass has no revision binding | `allow_trusted_updates` can skip unlock for matching managed sessions, but not with policy revision constraints. | Locked child managed-policy fixtures. |
| Mailbox protocol specified, runtime partially hooked | Offline later delivery now has a ciphertext-only protocol and replay/ack proof fixture. The dashboard/profile-open hook can ask a trusted local provider for already-decrypted mailbox items and return redacted ack records after local apply/reject, but no server mailbox client, pull scheduler, decryption client, or server path exists. | Pairing key persistence plus signed live-delivery tests before mailbox runtime work. |
| No local-network management contract | Same-network discovery could be mistaken for authority. | Separate discovery, pairing, transport, and policy-authority proof. |
| Partial protected-user action history | Accepted local managed child saves, local parent/account history access, accepted-row clearing, protected failed unlock rows, dashboard/background session expiry, sensitive managed-action re-auth, dashboard-persisted local failed-attempt rate limiting, in-memory background session PIN failed-attempt limiting, and remote managed validation/apply rows exist. | Retention expiry, encrypted summary fixtures, background/session-service failed-attempt durability proof, and live remote apply smoke. |
| No admin lock for remote management | Child PIN or protected profile state could be confused with admin authority. | Parent/account PIN and trusted-device authority fixtures before writes. |
| No pairing key/signature contract | P2P or local-network transport could authenticate reachability instead of authority. | Device-bound key, signature/integrity, rotation, revocation, and compromise-recovery fixtures. |
| No hostile-LAN fixture set | Spoofed peer announcements, duplicate device ids, stale pairings, reconnect drift, or MITM attempts could be missed. | Discovery-versus-authority negative fixtures before local-network writes. |
| Partial protected log access policy | Local child history viewer, accepted-row clear path, and dashboard failed-attempt persistence now preserve protected evidence; encrypted summaries and background/session-service failed-attempt durability remain pending. | Retention, encryption, and background/session-service failed-attempt durability proof. |
| No conflict-resolution matrix | Simultaneous parent edits or server mailbox delivery after revocation could produce nondeterministic policy state. Local accepted-state cleanup now removes the revoked link's cached revision evidence, but mailbox/server queue conflict handling remains pending. | Equal-revision, different-hash, multi-parent, local-vs-remote, and revoked-queued-update fixtures. |
| App policy contract parity now explicit | The extension-owned contract names the fields apps must preserve, the app sync manifest copies a dedicated contract artifact, and Android now has model-level proof for managed policy state/action history preservation plus Activity startup/resume/heartbeat/pause enforcement for managed time budgets. Rich timeout UI, settings locks, installed-device app smoke, and iOS parity remain pending. | Installed Android Main/Kids time-budget smoke, native settings-lock tests, iOS adapter parity, and child/admin authority separation fixtures. |

## Required Next Implementation Gates

Before adding parent-managed runtime behavior:

1. Keep the `filtertube_managed_policy` schema/revision fixtures passing while
   moving from contract proof into runtime helper code.
2. Keep accepted revision state per parent/source device, link, scope, and
   target child profile covered by runtime fixtures.
3. Wire durable key lookup and WebCrypto verifier context before any live
   Nanah/local-network managed policy write.
4. Keep existing `applyIncomingEnvelope(...)` closed to
   `filtertube_managed_policy`; managed envelopes must use
   `applyManagedPolicyEnvelope(...)`.
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
13. Keep action-history access, accepted-row clearing, and dashboard
    failed-attempt persistence behind parent/account authority, then add
    encryption and background/session-service failed-attempt retention proof.
14. Keep mailbox delivery ciphertext-only and reuse validated managed-policy
    apply; do not add a mailbox runtime path until source key provisioning,
    trusted descriptor persistence, signed live-send construction, and live
    signed-envelope tests exist.

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
