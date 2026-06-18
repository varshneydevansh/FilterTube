# Plan: Local-Network Managed Parent Controls

**Generated**: 2026-06-03
**Estimated Complexity**: High
**Status**: Planning/specification plus local managed-save runtime slice,
Nanah receive-side managed-policy validation/apply-history slice, validated
managed-policy apply wrapper, adapter WebCrypto verifier helper, runtime
viewing-space/time-budget enforcement, and encrypted mailbox protocol proof.
Managed pairing public-key descriptor persistence is now present when a key
descriptor is already provisioned, and source-side managed signing keypair
provisioning plus an adapter signing helper are present. Live fixed-target
Nanah managed-policy sends are present for Main/Kids, keyword, channel, video,
viewing-space, and time-limit scopes, granular keyword/channel/video sends now
expose an explicit Main/Kids rule-source picker, and Rule bundle expands into
separate signed keyword/channel/video envelopes. Managed trusted-link storage
and lookup are now profile-scoped for fixed child/profile targets on the same
remote device, and the dashboard can now choose multiple eligible fixed targets
on the currently connected replica for live same-replica signed sends. A
provider-gated dashboard/profile-open pull hook and redacted provider ack
handoff are present for already-decrypted mailbox items, and the adapter now
has a source-side server-safe mailbox storage item builder for already-encrypted
payloads plus local WebCrypto seal/open helpers that keep plaintext policy out
of mailbox storage. Source-side mailbox upload-provider handoff can now publish
ciphertext-only mailbox items while marking sent revision/hash state only for
provider-accepted mailbox item ids. A provider-gated dashboard/profile-open local-network
candidate discovery hook plus redacted provider candidate ack handoff are
present for already trusted managed replica links, and source-side
local-network provider delivery handoff can now publish signed candidates while
marking sent revision/hash state only for provider-accepted candidate ids. An
extension-owned managed app policy contract artifact and app manifest copy row
are now present so downstream app parity can be tested before native
enforcement changes. Active/full signed managed sends now expand into concrete
Main, Kids, viewing-space, and optional time-limit envelopes for eligible fixed
targets. The dashboard command center now supports per-profile and
selected-profile verified-device sends: connected verified replicas receive
signed managed-policy envelopes over live Nanah P2P, and optional mailbox/LAN
providers can receive ciphertext mailbox rows or signed local-network
candidates when those provider hooks are installed. A browser-side HTTPS mailbox
client is now available behind explicit configuration and encrypted-item gates.
Built-in local-network peer discovery, LAN transport, app native enforcement
proofs, and built-in app/server later-delivery providers remain gated.
Source-side managed signing-key rotation is now an explicit
parent/admin action: it regenerates the local source keypair, key-revokes active
managed child-device links, purges pending provider/open-sync/LAN/source-ack
state for those links, and writes protected history so the affected devices must
be paired again. The parent command center now distinguishes usable verified
devices from revoked/stale managed links so rotated devices show as needing
re-pairing instead of disappearing into a generic missing-device state. The adapter now exposes a
local-network candidate authority gate for future LAN providers, and the
dashboard has a sanitized receive bridge that records accepted/rejected
local-network candidate outcomes through protected managed action history. This
does not add built-in peer discovery or built-in LAN transport. Local-network
provider acks are feedback only and record redacted scope/revision/hash/result
metadata, not plaintext rules or authority.
**Primary audit input**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
**Current pull-on-open proof**:
`docs/audit/FILTERTUBE_NANAH_MANAGED_PULL_ON_OPEN_2026-06-04.md`
**Current multi-target fanout boundary**:
`docs/audit/FILTERTUBE_NANAH_MANAGED_MULTI_TARGET_FANOUT_BOUNDARY_2026-06-04.md`
**Current local-network provider hook proof**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PROVIDER_HOOK_2026-06-05.md`

## Extension MVP Checklist

**Extension-owned MVP status**: implemented through the current dashboard,
runtime, Nanah managed-policy, protected-history, route-gate, time-budget,
open-sync, mailbox-provider, and local-network-provider hook slices. Remaining
unchecked rows below are intentionally provider/app lanes, not missing
extension authority code.

- [x] Parent/account profiles can manage protected child profiles locally.
- [x] Default/Master can manage independent protected account profiles without
  switching into them.
- [x] Protected profiles cannot use child authority to edit admin settings,
  viewing-space policy, time limits, trusted-link policy, or protected history.
- [x] Local Main/Kids viewing-space changes write protected revision/history
  rows for managed protected-profile edits.
- [x] Local same-budget bulk time-limit changes work for selected manageable
  protected profiles and can offer a verified-device `time_limits` push.
- [x] Local parent extra-time grants work for manageable protected profiles with
  active time limits and can offer a verified-device `time_limits` push.
- [x] Local same-access bulk viewing-space changes work for selected manageable
  protected profiles and can offer a verified-device `viewing_space` push.
- [x] Local selected-profile video/keyword/channel rule additions work for manageable
  protected profiles through parent/account re-auth.
- [x] Dashboard command center lists protected profiles, time-limit state,
  viewing-space state, protected history count, verified-device readiness,
  re-pairing status for revoked/stale managed links, compact delivery-path
  detail, delegated actions, and grouped Rules/Send/Time/Access selected-profile
  bulk action rails.
- [x] Dashboard command center clarity slice: the panel now uses the
  parent-facing `Family Controls` label, shorter delivery labels, and one stable
  per-profile details column so profile names and next actions do not collapse
  under provider/status copy.
- [x] Command center can send signed active managed-policy updates to currently
  connected verified replica devices over Nanah P2P.
- [x] Command center can hand ciphertext mailbox items or signed LAN candidates
  to optional trusted providers when those provider hooks are installed.
- [x] Parent-side push attempts write redacted protected history rows for sent,
  missing-link, provider-pending, and failed cases.
- [x] Parent-side managed signing-key rotation can revoke active child-device
  managed links, purge queued provider/status state, and force re-pairing.
- [x] Manual managed remote-delivery smoke now includes key-rotation,
  re-pairing status, and redacted `trust_link.key_revoke` history proof.
- [x] Child/protected-device open-sync path can apply only validated signed
  managed-policy envelopes from trusted links and keeps the last accepted policy
  while offline.
- [x] Runtime Main/Kids route gate, background-owned time-budget accounting, and
  protected timeout overlay exist for active protected profiles.
- [ ] Managed channel filter-list subscriptions/imports. Issue 62 asks for
  content-blocker-style channel lists that can be imported, enabled, disabled,
  and synced. This should become a parent/caregiver rule-source feature, not an
  untrusted URL authority path. The parent-facing flow should stay simple:
  paste/import a list, preview channels, choose protected profiles, apply, then
  send to verified devices when delivery is ready.
  - [x] First local import slice: parent/account profiles can paste or choose a
    text file, preview valid channel identifiers, apply the list to selected
    protected profiles on Main/Kids/both, write protected redacted history, and
    offer the existing verified-device send path.
  - [x] First reversible slice: parent/account profiles can remove a previously
    imported materialized list by `managedListId` from selected protected
    profiles without deleting manual channel rules, with protected redacted
    history and the existing verified-device send offer.
  - [x] First visibility slice: protected profile rows now show compact imported
    list status from saved `managedListId` row metadata, so parents can see
    which profiles have list-derived rules before removing or sending updates.
  - [x] First URL source slice: parent/account profiles can load a public HTTPS
    list URL into the same preview/apply flow, with GitHub `blob` URL
    normalization, no broad host-permission expansion, saved
    `managedListSourceUrl` row metadata, and the same parent unlock plus
    verified-device send offer.
  - [x] First refresh slice: parent/account profiles can refresh URL-backed
    imported lists on selected protected profiles, preserving the
    parent-approved `managedListId`, replacing only matching list-derived rows,
    recording protected redacted history, and offering verified-device send.
  - [x] First library UX slice: command-center rows and selected-profile bulk
    controls expose one `Lists` action that routes to import, refresh, or remove
    choices instead of showing separate list-management buttons.
  - [x] First read-only library slice: `Lists` can show imported-list summaries
    before a parent chooses import, refresh, or remove.
  - [x] First enable/disable slice: parent/account profiles can pause or resume
    imported lists on selected protected profiles. Paused list-derived rows stay
    visible and removable but do not compile into channel blocking or
    channel-derived `filterAll` keywords.
  - [x] First source-version visibility slice: imported and refreshed lists now
    store compact last-checked and content-hash metadata on list-derived rows,
    and the parent library can show that version metadata without exposing raw
    list contents.
  - [x] First parent-triggered batch refresh slice: when multiple URL-backed
    lists exist, `Lists` can refresh all loaded URL sources in one
    parent-approved pass. Failed sources are left unchanged, matching
    list-derived rows are replaced through the existing channel-rule path, and
    changed profiles can use the existing verified-device send offer.
  - [x] First app-contract parity slice: the managed app policy contract now
    names managed channel lists as a rule-source contract, including list row
    metadata, pause enforcement, manual-rule separation, refresh behavior, and
    native parity requirements.
  - [x] First stale-source parent hint slice: URL-backed lists older than seven
    days now show a parent-facing needs-refresh status in the command center
    and list library. Parents can refresh only stale URL-backed lists in one
    approved pass; this is not a background scheduler.
  - [x] First external-list compatibility slice: Issue 62 style lists such as
    AiSList plain-text channel lists are treated as trusted parent-selected
    rule sources. Comment metadata like title, version, and last-modified labels
    is preserved as compact display metadata so parents can see which upstream
    list revision they imported or refreshed, while the URL/list still has no
    policy authority by itself.
  - [x] First subscription-check slice: parent/account profiles can check
    URL-backed lists from the `Lists` action. Changed source hashes refresh
    materialized channel rows after parent re-auth; unchanged source hashes only
    update checked/source metadata and protected history, avoiding unnecessary
    channel-row churn or remote policy sends.
  - [ ] Scheduled subscription refresh remains a future slice.
- [x] Built-in browser HTTPS mailbox upload/pull/purge client is present behind
  explicit dashboard configuration and encrypted-item gates. Server deployment,
  provider endpoint ownership, and native app parity remain separate lanes.
- [ ] Automatic LAN peer discovery authority. This remains app/provider work,
  with extension authority hooks already gated.
- [x] Configured local-network gateway transport. The extension can install an
  explicit parent-configured provider for publishing, discovering, and
  acknowledging signed local-network candidates through HTTPS or private local
  HTTP endpoints. Discovery remains non-authoritative; local validation still
  gates every apply.
- [ ] Native Android/iOS settings-lock and timeout UI parity. This belongs in
  the downstream app sync/runtime lane.

## Overview

FilterTube has already started the extension-side managed parent control work
through the current authority audit of profiles, PIN/session gates, Nanah
managed links, profile-scoped payloads, Main/Kids viewing-space policy, and
future time-limit enforcement.

Issue 60 feedback from Dartsgame974 sharpens the product requirement:
managed controls are not only parental controls. They also support caregivers
and sensitive users who need the useful parts of the internet while reducing
exposure to destabilizing or harmful content. The first managed-control MVP
should therefore prioritize local-network or P2P remote management, protected
admin authority, remote rule edits, and visible action history.

Issue 62 feedback from DanWaLes adds a second parent/caregiver convenience
requirement: channel filter-list subscriptions/imports. Parents should not have
to add every channel manually when a trusted community, caregiver, school, or
family list already exists. This belongs in the same managed-control direction
because parents can choose a list once, enable or disable it per protected
profile, and then push the resulting policy to verified child/protected
devices.

This is now explicitly part of the goal/plan. The parent-facing feature name is
`Lists` or `Trusted Lists`, not a network or provider term. The first supported
shape is plain text with one YouTube channel identifier per line and optional
comment metadata. External community lists, including AI-generated-content
channel lists, are useful inputs, but FilterTube must always preview and
materialize the accepted channels into local profile policy before they affect a
protected profile.

This should not feel like a network-provider setup screen. For parents, the
mental model is a small rule library:

```text
My Lists
  -> AI slop channels
  -> School-safe science channels
  -> Family block list

Choose list -> Preview -> Apply to Pushy + Aanya -> Send update
```

The advanced details, such as source URL, revision hash, stale refresh state,
and signed-device delivery, belong behind compact status labels and history
rows. The main job is to let a parent/caregiver control several protected
profiles without hand-entering hundreds of channels.

URL-backed lists now behave like manual subscriptions: the parent can check the
saved source URL, FilterTube compares the source hash, and only changed content
refreshes materialized channel rows. If the hash is unchanged, the dashboard
updates checked/source metadata and history only. There is still no silent
background mutation.

The implementation should stay extension-first because this repository owns the
upstream profile/settings/policy contract that downstream mobile and tablet
apps should follow.

## Requirements Added From Issue 60

| Requirement | Product meaning | Release safety meaning |
| --- | --- | --- |
| Local-network or P2P management | A trusted parent/caregiver device can manage a child or protected profile on the same network when reachable. | Remote writes cannot be accepted from page messages, untrusted peers, sibling profiles, or stale links. |
| Password/PIN protected admin mode | The protected end user cannot change managed rules or disable controls. | Child PIN never becomes admin authority; parent/account PIN gates writes. |
| Remote video, keyword, and channel rules | Parent can block specific videos, keywords, and channels just like local app controls. | All remote writes must reuse the same validated rule mutation paths as local writes. |
| Managed channel filter lists | Parent/caregiver can import or subscribe to channel lists, enable/disable each list, and apply selected lists to protected profiles instead of adding channels one at a time. | A URL or list file is data, not authority. Imports need preview, source label, revision/hash, per-profile enablement, parent/admin approval, and the same validated channel-rule mutation path. |
| List source metadata | Parent/caregiver can see compact upstream title/version/last-modified metadata when a list provides it. | Metadata is display/audit context only. It cannot grant authority, change target profiles, hide rule contents from admin history, or bypass preview/re-auth. |
| Action history/logs | Parent/caregiver can see what changed, when, and from which trusted device. | Logs must not leak sensitive plaintext unnecessarily and must not become the policy authority. |
| Offline safety | Child device keeps the last valid parent policy when the parent device is not reachable. | Stale, replayed, revoked, mismatched, or downgraded policy revisions are rejected. |
| Future app parity | Mobile/tablet apps consume the same policy model as the extension. | Extension and apps must not fork authority semantics. |

## Security Requirements Before Runtime Writes

No local-network, P2P, Nanah, or mailbox managed-policy write should be allowed
until these authority details are specified and tested:

- **Pairing keys**: trusted devices need durable key material or an equivalent
  signed identity established during pairing.
- **Device binding**: a policy must bind source device, trusted link, target
  profile, scope, and revision.
- **Signature/integrity**: a policy must be signed or authenticated before the
  child/replica device accepts it.
- **Rotation and revocation**: source-side key rotation and trust revocation are
  explicit; compromised device recovery still requires installed-device proof.
- **Hostile LAN safety**: peer discovery must tolerate spoofed announcements,
  duplicate device ids, stale pairing records, NAT/reconnect identity drift,
  and MITM attempts.
- **Extension/page boundary safety**: local-network and managed-policy messages
  must not be accepted from untrusted page scripts, page `postMessage`, or
  content-script spoof paths.

## Admin Lock Requirements

Parent/caregiver admin authority needs its own hardening before policy writes:

- Parent/account PIN or password gates protected actions.
- Admin sessions have a TTL and relock on profile switch, window close, and
  explicit logout.
- Sensitive actions can require re-auth even inside an existing session.
- Failed attempts are rate-limited and logged.
- Recovery/reset behavior must not let the protected user silently become
  admin or erase managed policy.

## Action History Requirements

Action history is required user feedback, but it must be protected evidence,
not policy authority.

- Only parent/account authority can view or clear protected action history.
- Protected users cannot clear rejected-update or failed-unlock evidence.
- Rows use local retention limits and a central redacted-summary sanitizer before
  history storage; the sanitizer now accepts only ciphertext-shaped encrypted
  summary metadata and marks stored summaries as counts/status/transport plus
  ciphertext-token proof, not plaintext policy.
- Rejected and failed remote-policy attempts should be durable enough for a
  caregiver to diagnose misuse or trust problems.
- Ordering must be stable under clock skew by using policy revision and receive
  order in addition to wall-clock timestamps.

## Conflict Requirements

Before accepting remote policy updates, fixtures must cover:

- Local parent edit racing an incoming remote policy.
- Two trusted parent devices editing the same child profile.
- Equal revision with a different policy hash.
- Accepted update followed by trust revocation.
- Queued mailbox update delivered after trust revocation.
- Reduced time budget or stricter viewing-space update delivered while the
  child profile is active.

## Non-Goals For The First Slice

- No cloud plaintext rule storage.
- No server-side parental dashboard before local/P2P authority is proven.
- No telemetry upload of viewing history.
- No child-device override that can weaken parent policy.
- No remote route/time-limit policy apply before schema, fixtures, signature
  evidence, and trusted delivery gates exist.
- No automatic trust of arbitrary public filter-list URLs. List subscriptions
  must be parent/admin-approved rule sources with preview, local enable/disable,
  and protected history.

## Issue 62: Managed Channel Filter-List Subscriptions

**Goal**: Let parents/caregivers import or subscribe to channel filter lists in
a way that feels as simple as enabling a content-blocker list, while preserving
FilterTube's profile, PIN, managed-policy, and local-first authority model.

**Parent-facing model**:

```text
Add list -> Preview -> Choose profiles -> Apply -> Send update
```

**Planned requirements**:

- Parents can add a list from a file, pasted text, or URL.
- Each list has a clear name, source URL/file label, last checked time, item
  count, revision/hash, and enabled/disabled state.
- Lists can be enabled separately for Main/Kids and per protected profile.
- Imported list entries normalize into the existing channel rule shape before
  enforcement: channel name, handle/custom URL, UC id when present, source tag,
  added/revision metadata, and optional list id.
- The UI previews additions/removals before applying a list update.
- List updates can be merged into current rules or treated as a managed list
  overlay that can be disabled without deleting manual rules.
- Managed parent sends can include list-derived channel rules through the same
  signed `channels` or `rules_bundle` scopes already used for manual channel
  updates.
- Action history records list import/update/disable events with list id, source
  label, revision/hash, counts, and result, but not unnecessary plaintext list
  contents.
- Protected users cannot add, remove, refresh, enable, disable, or weaken
  parent-approved lists.

**Caregiver-first UI shape**:

- Avoid "subscription provider" language in the normal workflow.
- Use one clear action label: `Import List`.
- Show a preview with counts first: `312 channels found`, `24 already present`,
  `288 will be added`, `6 skipped`.
- Let the parent choose Main, Kids, or both using buttons, not free-text scope
  names.
- Let the parent choose one or more protected profiles from the same command
  center selection model used by bulk rules.
- After apply, reuse the existing verified-device send offer so parents do not
  have to understand Nanah internals.

**First implementation slice**:

```text
1. Local pasted/file list import [done]
2. Preview and normalize entries [done]
3. Apply to selected protected profiles and Main/Kids surface [done]
4. Store source metadata on list-derived channel rows where the channel schema allows [done]
5. Write redacted managed action-history row [done]
6. Offer signed verified-device push through existing channels/rules_bundle path [done]
7. Remove a materialized imported list without touching manual rows [done]
8. Load a public HTTPS URL into the same preview/apply flow [done]
9. Refresh a URL-backed materialized list after parent/account re-auth [done]
10. Consolidate row/bulk list management behind one parent-facing Lists action [done]
11. Show read-only imported-list summaries from the Lists chooser [done]
12. Pause/resume imported lists without deleting manual or list-derived rows [done]
13. Show last-checked and compact hash metadata for imported/refreshed lists [done]
14. Refresh all URL-backed lists in one parent-approved pass [done]
15. Document managed channel-list parity in the shared app policy contract [done]
16. Show stale URL-backed list status and refresh only stale lists [done]
```

Scheduled subscriptions and automatic background refresh remain future work. A
URL is treated as a way to fetch data, not as a remote admin.

**Safety boundaries**:

- Remote list content is never executable code.
- A public list URL does not get trusted-device authority.
- A list update cannot bypass parent/account re-auth for protected profiles.
- Unknown or malformed entries are skipped or quarantined for review instead of
  silently broadening the blocklist.
- Existing manual channel blocks remain distinguishable from list-derived rows.
- A disabled list should stop contributing its rows without deleting unrelated
  manual channel rules.

**Open design questions**:

- Whether the first release should store list entries as a reversible overlay
  or materialize them into normal channel rows with source metadata.
- Which formats to support first: plain URLs/text, JSON, uBlock-style comments,
  CSV, or a simple FilterTube list JSON schema.
- Whether refresh should be manual-only first, then scheduled later after
  no-work/performance gates are proven.

## Sprint 1: Authority Contract And Proof Baseline

**Goal**: Convert the current audit into an executable managed-policy contract
without changing runtime behavior.

**Demo/Validation**:

- `npm run test:settings`
- `npm run test:changed`
- Authority docs show current paths and missing gates.

### Task 1.1: Extend authority inventory with Issue 60 addendum

- **Location**:
  `docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`
- **Description**: Record local-network/P2P management, admin lock, remote rule
  editing, and action history as first-class managed-control requirements.
- **Complexity**: 2/10
- **Dependencies**: Existing authority inventory.
- **Acceptance Criteria**:
  - The doc states this work has already begun in the extension authority audit.
  - The doc distinguishes parent/caregiver admin authority from child PIN.
  - The doc lists action history as a required future proof surface.
- **Validation**:
  - `git diff --check`
  - Focused managed-authority test remains green after matching fixture updates.

### Task 1.2: Add managed-policy schema fixture

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`
  - `tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs`
- **Description**: Define the minimum policy envelope shape before runtime code:
  target profile id, source device id, trusted link id, scope, revision, issued
  timestamp, expiry or validity window, policy hash, source public-key identity,
  key version, and signature/integrity proof.
- **Complexity**: 5/10
- **Dependencies**: Task 1.1.
- **Status**: Contract fixture added. Product runtime behavior remains
  unchanged.
- **Acceptance Criteria**:
  - Valid parent-to-child policy fixture passes.
  - Missing target, source, scope, revision, key identity, or integrity fixture
    fails.
  - Sibling-to-sibling and child-to-parent policy fixtures fail.
  - Duplicate device id, stale pairing, revoked key, and wrong link id fixtures
    fail.
- **Validation**:
  - `npm run test:settings`

### Task 1.3: Add revision/replay decision table

- **Location**:
  `docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`
- **Description**: Specify accept/reject behavior for newer, equal, older,
  mismatched, revoked, corrupted, and wrong-target revisions.
- **Complexity**: 4/10
- **Dependencies**: Task 1.2.
- **Status**: Revision/replay matrix added inside the schema contract. Runtime
  receive/apply paths now record bounded redacted conflict state for
  equal-revision hash conflicts, stale revisions, revoked keys/links, stale
  pairings, and duplicate source devices while keeping the last valid accepted
  policy active.
- **Acceptance Criteria**:
  - Every revision decision has a fixture name.
  - Offline child behavior is explicit: last valid policy remains active.
  - Reduced or downgraded budgets are handled as normal valid newer policy only
    when signed by trusted parent authority.
  - Equal revision with different hash is rejected and logged as a conflict.
  - Queued updates received after trust revocation are rejected.
- **Validation**:
  - `npm run test:settings`

## Sprint 2: Local Parent/Caregiver Managed Editing

**Goal**: Make same-device parent-managed child edits produce a durable policy
revision and action-history entry.

**Demo/Validation**:

- Parent/account profile edits a child profile.
- Child profile cannot mutate itself as admin.
- Action history records the parent-side edit.

### Task 2.1: Add local managed edit authority tests

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_CHILD_LOCAL_AUTHORITY_CONTRACT_2026-06-03.md`
  - `tests/runtime/managed-child-local-authority-current-behavior.test.mjs`
- **Description**: Pin current authority and future expected behavior around
  default/account/child profiles, parentProfileId, locked parent sessions, and
  virtual child editing.
- **Complexity**: 5/10
- **Dependencies**: Sprint 1.
- **Status**: Local managed child authority contract and fixture updated with
  accepted-save revision/history runtime behavior, protected failed-unlock
  logging, dashboard/background admin TTL, sensitive re-auth, profile-persisted
  failed-attempt rate limiting for dashboard and background session PIN auth,
  while the actual background PIN/session cache remains memory-only.
- **Acceptance Criteria**:
  - Parent/account can target owned child.
  - Child cannot manage itself as admin.
  - Sibling cannot manage sibling.
  - Locked parent cannot write until authorized.
  - Parent/admin session expires and relocks on profile switch.
  - Sensitive managed-policy actions can require re-auth.
  - Failed unlock attempts are rate-limited and logged.
- **Validation**:
  - `node --test tests/runtime/managed-child-local-authority-current-behavior.test.mjs`
  - `npm run test:settings`

### Task 2.2: Define action-history data model

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`
  - `tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs`
- **Description**: Specify local-only action history rows for rule changes,
  viewing-space changes, time-limit changes, trust-link changes, and rejected
  remote policy attempts.
- **Complexity**: 4/10
- **Dependencies**: Task 2.1.
- **Status**: Action-history model and access-control fixture updated. Product
  runtime now writes accepted local managed child save rows, exposes
  parent/account-only protected history access, clears accepted rows while
  preserving protected evidence, records dashboard local failed-attempt
  rate-limit state on the managing profile, and records Nanah managed-policy
  validation rows for rejected, conflict, idempotent, and accepted
  validated-apply receive outcomes. Rejected/conflict live, mailbox, and
  local-network receive attempts now persist profile-local remote
  failed-attempt rate-limit state and include redacted rate-limit metadata in
  protected history rows.
- **Acceptance Criteria**:
  - Rows include actor profile, actor device, target profile, action type,
    policy revision, timestamp, result, and redacted summary.
  - Logs are evidence and UX feedback, not policy authority.
  - Sensitive rule values can be redacted or locally encrypted in later slices.
  - Protected users cannot clear accepted/rejected managed-policy history.
  - Retention, redaction, local encryption, and clock-skew ordering are
    specified.
- **Validation**:
  - `node --test tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs`
  - `npm run test:settings`

### Task 2.3: Add local policy revision write path

- **Location**:
  - `js/io_manager.js`
  - `js/state_manager.js`
  - `js/background.js`
  - matching runtime tests
- **Description**: After tests define the contract, make local parent-managed
  writes emit a managed-policy revision and action-history entry.
- **Complexity**: 7/10
- **Dependencies**: Tasks 2.1 and 2.2.
- **Acceptance Criteria**:
  - Existing blocklist/whitelist writes remain intact.
  - Policy revision increments atomically with the child profile write.
  - Failed writes do not create successful action-history rows.
- **Status**: Implemented for `saveManagedChildSurface(...)` in
  `js/tab-view.js`. The runtime writes
  `profile.managedPolicyState.localManagedEdits.{main,kids}` and appends a
  redacted protected row to `profile.managedActionHistory[]` on accepted local
  parent-managed child saves. Failed unlock and remote rejection writers remain
  separate future work.
- **Validation**:
  - `npm run test:settings`
  - `npm run test:blocking`
  - `npm run test:whitelist`

## Sprint 3: Local-Network/P2P Managed Update Flow

**Goal**: Allow a trusted source device to deliver a managed child policy to a
replica child device over Nanah/P2P or same-network transport.

**Demo/Validation**:

- Trusted parent/source sends a scoped child policy.
- Child/replica accepts only valid newer policy for the fixed target profile.
- Invalid policies are rejected and logged.

### Task 3.1: Add `filtertube_managed_policy` envelope tests

- **Location**:
  `tests/runtime/nanah-managed-policy-envelope-current-behavior.test.mjs`
- **Description**: Prove incoming envelopes require managed link type, local
  replica role, remote source role, fixed target profile, allowed scope,
  revision, key identity, key version, signature/integrity, and non-revoked
  trust state.
- **Complexity**: 6/10
- **Dependencies**: Sprint 1.
- **Status**: Runtime validation helper, receive-side validation
  context/history plumbing, adapter WebCrypto signature verifier helper,
  validated apply wrapper, target child profile writes, and persisted accepted
  revision/hash state are present. Pairing-time public-key storage, source
  signing-key provisioning, and live Nanah P2P signed sends are present; built-in
  local-network transport remains provider/server work.
- **Acceptance Criteria**:
  - Trusted source to fixed child target passes.
  - Peer mode, sibling target, missing fixed target, stale revision, wrong
    scope, and revoked link fail.
  - Locked child bypass works only for `allow_trusted_updates`.
  - Hostile-LAN fixtures cover spoofed peer announcement, duplicate device id,
    stale pairing record, NAT/reconnect identity drift, and MITM-like wrong key.
- **Validation**:
  - `npm run test:settings`

### Task 3.2: Add managed apply wrapper before Nanah adapter writes

- **Location**:
  - `js/nanah_sync_adapter.js`
  - `js/tab-view.js`
  - matching runtime tests
- **Description**: Keep `applyScopedPortablePayload(...)` as a low-level write
  primitive, but call it only after a managed-policy validator accepts trust,
  target, scope, revision, and integrity.
- **Complexity**: 8/10
- **Dependencies**: Task 3.1 and Task 2.2.
- **Status**: Runtime wrapper plus adapter verifier helper present. The
  adapter now rejects
  `filtertube_managed_policy` envelopes from the legacy portable apply path
  with `Managed policy envelopes require validated managed apply flow`. The
  dashboard receive path now parses managed envelopes and builds validation
  context, the adapter builds WebCrypto Ed25519 signature-verification evidence
  from trusted-link `sourcePublicKeyJwk` material, the dashboard records
  protected validation history, invokes
  `applyManagedPolicyEnvelope(...)` for accepted envelopes, persists accepted
  revision/hash state on the target child profile, and records
  accepted/rejected apply history. Trusted-link removal cleanup: present for
  target-local accepted managed-policy revision state and matching open-sync
  status rows. Pairing-time public-key descriptor persistence, source-side
  signing keypair provisioning, canonical outbound payload hashing, and
  receive-side canonical payload-hash recomputation now exist. Live Nanah P2P
  signed delivery is present; server mailbox queue purge and automatic
  local-network peer discovery remain pending provider/app work. Configured
  gateway delivery can now be enabled explicitly from the managed command
  center after parent/account re-auth.
- **Acceptance Criteria**:
  - Existing `app_sync` and `control_proposal` behavior remains compatible.
  - New managed policy applies only to target profile and target surface.
  - Rejected attempts create action-history rejection rows.
  - Equal-revision/different-hash and revoked-link attempts are rejected before
    low-level payload apply.
- **Validation**:
  - `npm run test:settings`
  - `npm run test:release`

### Task 3.3: Specify same-network discovery separately from policy authority

- **Location**:
  `docs/audit/FILTERTUBE_LOCAL_NETWORK_DISCOVERY_AUTHORITY_BOUNDARY_2026-06-03.md`
- **Description**: Document that LAN discovery can find peers, but cannot grant
  policy authority. Authority still comes from trusted pairing and policy
  envelope validation.
- **Complexity**: 3/10
- **Dependencies**: Task 3.1.
- **Status**: Boundary contract and hostile-LAN proof fixture added. A
  provider-gated dashboard/profile-open local-network candidate discovery hook
  is present for already trusted managed replica links, while automatic peer
  discovery remains absent. Configured LAN gateway delivery can publish and
  discover signed candidates, but managed-policy envelope
  validation, adapter-level local-network candidate validation, and dashboard
  sanitized local-network candidate receive/history handling are present, but
  they do not make LAN reachability authority.
- **Acceptance Criteria**:
  - Discovery, pairing, transport, and policy authority are separate rows.
  - Network reachability failure has clear offline behavior.
  - Discovery cannot grant trust, refresh trust, rotate keys, or change profile
    policy without explicit paired authority.
  - Hostile-LAN scenarios are named with fixture ids.
- **Validation**:
  - `git diff --check`

### Task 3.4: Persist managed pairing public-key descriptors

- **Location**:
  - `js/nanah_sync_adapter.js`
  - `js/tab-view.js`
  - `docs/audit/FILTERTUBE_NANAH_MANAGED_PAIRING_KEY_DESCRIPTOR_2026-06-04.md`
  - `docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md`
  - `tests/runtime/managed-nanah-pairing-key-descriptor-current-behavior.test.mjs`
  - `tests/runtime/managed-nanah-signing-keypair-current-behavior.test.mjs`
- **Description**: Preserve source public-key descriptors across managed Nanah
  pairing so a trusted replica can later verify signed parent/caregiver policy
  envelopes against trusted-link key material.
- **Complexity**: 5/10
- **Dependencies**: Task 3.2.
- **Status**: Runtime descriptor plumbing is present. Dashboard Nanah startup
  reads `ftNanahManagedSigningPublicKey`, device descriptors advertise
  `managedPublicKey*` and `sourcePublicKey*` aliases when the descriptor is
  already present, and managed trusted links save source device/profile/key
  bindings. The next signing-key slice now provisions source keypairs and adds
  an adapter signing helper; this descriptor task still does not enable signed
  dashboard sends or mailbox runtime delivery.
- **Acceptance Criteria**:
  - Pairing descriptors never grant authority without managed-link validation.
  - Missing key descriptors keep the fail-closed receive path.
  - Trusted links store JSON-safe source key fields without `undefined` values.
  - Docs do not overclaim automatic remote policy writes.
- **Validation**:
  - `node --test tests/runtime/managed-nanah-pairing-key-descriptor-current-behavior.test.mjs`
  - `npm run test:settings`

### Task 3.5: Provision managed signing keypairs

- **Location**:
  - `js/nanah_sync_adapter.js`
  - `js/tab-view.js`
  - `docs/audit/FILTERTUBE_NANAH_MANAGED_SIGNING_KEYPAIR_2026-06-04.md`
  - `tests/runtime/managed-nanah-signing-keypair-current-behavior.test.mjs`
- **Description**: Generate durable source-side managed signing keypairs and
  sign managed-policy envelope fields with the same canonical binding that the
  receive-side verifier already checks.
- **Complexity**: 6/10
- **Dependencies**: Task 3.4.
- **Status**: Runtime provisioning and adapter signing helper are present.
  Source / Parent sessions try to provision a WebCrypto Ed25519 keypair before
  sending the Nanah hello, public descriptors are mirrored into
  `ftNanahManagedSigningPublicKey`, private JWK material stays under
  `ftNanahManagedSigningKeyPair`, and source-side managed link saves require a
  local signing key. Eligible fixed-target active/full profile-policy bundles,
  Main/Kids plus keyword, channel, video, viewing-space, and time-limit
  dashboard live sends now build signed `filtertube_managed_policy` envelopes;
  granular keyword/channel/video sends expose an explicit Main/Kids rule-source
  picker, and Rule bundle expands into separate signed keyword/channel/video
  envelopes. The dashboard can now choose multiple eligible fixed targets on
  the connected replica and use the per-target envelope batcher for that live
  same-replica send. Redacted outbound send history and redacted live ack
  history are present per trusted link/scope. Pull-on-open mailbox ack handoff
  now writes protected redacted target-profile history after the provider ack
  attempt. Source-side provider-fed mailbox/local-network delivery ack summaries
  are now present under
  `docs/audit/FILTERTUBE_MANAGED_SOURCE_DELIVERY_ACK_STATUS_2026-06-05.md`.
  Source-side parent/admin key rotation can now force-generate a new local
  managed signing keypair, mark active Source -> Replica child-device links as
  `keyRevoked`, purge provider/open-sync/LAN/source-ack state for those old
  links, and add protected target-profile history rows. Offline
  mailbox/local-network delivery, cross-device fanout, and compromise-recovery
  proof remain later slices. Redacted per-target delivery preview controls are
  now present in the command center so parents can see live/later/re-pair/no-target
  status before sending, and the Delivery detail line now distinguishes live
  P2P, LAN provider, mailbox-later, paired-but-provider-pending, revoked, stale,
  and no-device cases. Local selected-profile time-limit and viewing-space bulk
  writes are already dashboard-gated.
- **Acceptance Criteria**:
  - The public descriptor is separated from the private keypair.
  - The private JWK is not placed in the Nanah hello descriptor or trusted link
    policy.
  - The signing helper refuses malformed signed-field bindings.
  - Source-side rotation is parent/admin gated and old child-device links cannot
    be reused for future managed sends.
  - Docs do not claim encrypted-at-rest private key storage, mailbox runtime,
    or broad active/full managed-policy transport.
- **Validation**:
  - `node --test tests/runtime/managed-nanah-signing-keypair-current-behavior.test.mjs`
  - `npm run test:settings`

### Task 3.6: Send eligible managed policies as signed live envelopes

- **Location**:
  - `js/tab-view.js`
  - `js/nanah_managed_live_policy.js`
  - `docs/audit/FILTERTUBE_NANAH_MANAGED_LIVE_SIGNED_SEND_2026-06-04.md`
  - `docs/audit/FILTERTUBE_MANAGED_LOCAL_NETWORK_SOURCE_DELIVERY_2026-06-05.md`
  - `tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`
- **Description**: Convert saved Source -> Replica managed Main/Kids and
  granular rule/viewing/time-limit sends to signed `filtertube_managed_policy`
  envelopes once the replica has a fixed child target profile and the source
  has a complete signing keypair.
- **Complexity**: 6/10
- **Dependencies**: Task 3.5.
- **Status**: Implemented for live Main/Kids, keyword, channel, video,
  viewing-space, and time-limit scope. Granular rule scopes expose an explicit
  Main/Kids rule-source picker, default from the active dashboard surface, and
  can source payloads from parent-managed child edit mode. Rule bundle expands
  into separate signed keyword/channel/video envelopes. Connected-replica
  multi-target sends can choose eligible fixed targets before signing, and each
  successful live send appends redacted outbound history to the trusted link.
  Connected replicas now return redacted live acks that the source records only
  when they match a prior sent revision/hash. Active/full and full-profile
  aliases expand into concrete signed Main, Kids, viewing-space, and optional
  time-limit envelopes instead of using the legacy proposal path. Pull-on-open
  mailbox ack handoff now writes protected redacted target-profile history
  after the provider ack attempt. Source-side provider-fed mailbox/local-network
  delivery ack summaries are now present under
  `docs/audit/FILTERTUBE_MANAGED_SOURCE_DELIVERY_ACK_STATUS_2026-06-05.md`.
  Source-side local-network provider delivery handoff can now publish signed
  local-network candidates and mark sent revision/hash state only for
  provider-accepted candidate ids. Built-in local-network peer discovery, LAN
  transport, server mailbox upload/pull, app native enforcement proofs,
  offline later delivery UI, and built-in multi-device fanout remain gated.
  Local selected-profile time-limit and viewing-space bulk writes are already
  dashboard-gated.
- **Acceptance Criteria**:
  - Existing proposal sends still work for non-managed peer scopes.
  - Signed sends require saved managed link, Source -> Replica roles, allowed
    scope, fixed child target, and signing keypair material.
  - Non-managed peer sends reject keyword/channel/video/viewing/time-limit
    scopes instead of silently converting them to active-profile proposals.
  - Outbound revision/hash state is persisted per trusted link and scope.
  - Receive path still validates before apply.
- **Validation**:
  - `node --test tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`
  - `npm run test:settings`

### Task 3.7: Pin multi-target fanout authority boundary

- **Location**:
  - `docs/audit/FILTERTUBE_NANAH_MANAGED_MULTI_TARGET_FANOUT_BOUNDARY_2026-06-04.md`
  - `tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`
- **Description**: Prevent parent/caregiver bulk sends from reusing a
  device-level trusted link as authority for several protected profiles on the
  same replica device.
- **Complexity**: 4/10
- **Dependencies**: Task 3.6.
- **Status**: Boundary proof, identity foundation, and connected-replica target
  chooser added. Command-center per-profile and selected-profile send actions
  now reuse the profile-scoped trusted-link behavior for verified-device
  pushes.
  `saveNanahTrustedLink(...)`, `findNanahTrustedLink(...)`, and
  `getNanahCurrentTrustedLink(...)` now distinguish fixed managed target
  profiles on the same remote device. `buildEnvelopeBatchForTrustedLinks(...)`
  can build per-target signed envelope batches for explicit saved links, and
  the dashboard uses it for selected eligible fixed targets on the connected
  replica. Redacted per-target outbound send history and live ack history are
  now present. Pull-on-open mailbox ack handoff now writes protected redacted
  target-profile history after the provider ack attempt. Command-center sends
  can also hand ciphertext mailbox items or signed local-network candidates to
  optional providers when those hooks are installed. A browser-side HTTPS
  mailbox upload/pull/purge client now exists behind explicit configuration and
  encrypted-item gates. Built-in LAN discovery/transports and native app parity
  remain pending app/server/provider work.
- **Acceptance Criteria**:
  - The doc names the profile-scoped trusted-link behavior.
  - The doc requires device plus target-profile binding before multi-child
    fanout.
  - The doc keeps live Nanah sessions separate from offline mailbox or
    local-network provider fanout.
  - Tests pin that the current runtime is connected-replica only and must not be
    treated as offline, mailbox, or local-network fanout.
- **Validation**:
  - `node --test tests/runtime/managed-nanah-live-signed-send-current-behavior.test.mjs`
  - `npm run test:settings`

## Sprint 4: Protected User Experience

**Goal**: Add calm, navigable parent/caregiver UI surfaces without overwhelming
the current extension dashboard.

**Design Direction**:

- Use a utilitarian minimalist default: clear labels, compact sections, explicit
  state, no decorative overload.
- Use dense industrial-style tables only for audit/history panels where high
  information density helps.
- Avoid marketing layout patterns; this is an operational control surface.

**Demo/Validation**:

- Parent can see managed profile status, last sync, last policy revision, and
  recent actions.
- Protected child surface does not expose restricted editing controls.

### Task 4.1: Add managed profile status panel spec

- **Location**:
  `docs/audit/FILTERTUBE_MANAGED_PARENT_UI_SURFACE_SPEC_2026-06-03.md`
- **Description**: Specify dashboard surfaces for parent/caregiver controls:
  managed profiles, trusted devices, sync status, last policy revision, and
  recent action history.
- **Complexity**: 4/10
- **Dependencies**: Sprints 1 and 2.
- **Status**: Spec plus dashboard protected-profile status increment present.
  Parent/account-authorized protected rows can now show compact local revision,
  remote accepted-policy scope/link count, verified-device readiness, and
  protected history count status. Default/Master can include independent
  protected account profiles; parent accounts can include their child profiles.
  Parent/account-authorized profile manager views now also show a command-center
  overview for protected profiles, viewing spaces, time limits, sync status,
  and protected history. Command-center row buttons are delegated action intents
  for existing gated Edit Rules, History, Time Limit, and Send Update paths,
  plus a selected-profile rule editor handoff, local selected-profile bulk
  time-limit and viewing-space actions, and selected-profile signed-policy
  sends. Child/protected views do not receive detailed managed status text or
  command-center controls. Direct local selected-profile video/keyword/channel
  rule additions are present. Command-center rows now separate sync readiness
  into compact status chips, mark remote conflict rows visually, and expose a
  protected Review Conflict action that opens a parent/account re-authed
  conflict/rejected remote-policy history filter.
  Built-in LAN transports remain pending. The command center now has a compact
  encrypted-mailbox endpoint row that can configure, edit, or disable the
  browser-side HTTPS mailbox client after parent/account re-auth. This does not
  add mailbox server authority or a standalone offline-send page.
  The parent UI now keeps the normal flow live-P2P first: create/select the
  protected profile, edit rules/access/time, pair a verified device, then send
  when both sides are available. Unconfigured mailbox and local-network provider
  setup is hidden from the normal command center so parents are not asked to
  bring infrastructure. If a provider is already configured, the UI labels it as
  Later Updates or Same-Network and uses plain parent/user language while audit
  docs retain the trusted-link, target-profile, scope, revision, hash, and
  signature authority proof.
- **Acceptance Criteria**:
  - UI has empty, loading, error, locked, offline, and sync-conflict states.
  - Parent actions are clear and reversible where possible.
  - Child/protected profile view hides admin controls.
- **Validation**:
  - `node --test tests/runtime/managed-parent-ui-surface-current-behavior.test.mjs`
  - UI spec review against existing `docs/MOBILE_APP_UI_SPEC.md`.

### Task 4.2: Implement parent/caregiver UI increment

- **Location**:
  - `js/tab-view.js`
  - dashboard HTML/CSS files as discovered before implementation
  - matching UI/runtime tests
- **Description**: Add the smallest runnable UI increment after the spec is
  accepted: managed profile status and action-history read-only panel.
- **Status**: Implemented for the extension dashboard command center. The
  surface keeps a compact operational layout, uses one protected-profile row
  per manageable target, exposes per-row Send Update, select-all, select-ready,
  and clear bulk controls, and selected-profile Send selected updates actions,
  shows compact
  status chips for access, limits, sync readiness, redacted delivery preview,
  delivery-path detail, redacted source-side delivery ack status, safe
  latest-action labels, and remote conflict state, refreshes bulk selection
  state after row construction so ready-device
  selection is usable on first render, groups selected-profile bulk actions into
  Rules, Send, Time, and Access rails so parent/caregiver work stays scannable
  without creating a separate remote-management page, and records protected redacted history for send
  success/failure/provider-pending cases. The implementation
  intentionally avoids a separate oversized remote-management page until
  app/server provider work exists. Bulk keyword/channel/video rule additions
  now show a review confirmation, require parent/account re-auth, and write one
  redacted revision/history row per changed target. When changed profiles have
  verified delivery, the dashboard offers to send the matching granular
  keyword/channel/video scope immediately and binds the parent-selected Main/Kids
  surface into the signed send path. Parent extra-time grants now write
  revisioned redacted time-limit history for active limits, expire automatically
  after the bounded grant window, and can offer an immediate verified-device
  `time_limits` push. Normal local viewing-space and time-limit saves now also
  offer scoped verified-device pushes for changed profiles when delivery is
  available. Bulk time-limit and viewing-space actions now use the same
  protected-profile authority predicate as the command-center rows, so
  Default/Master-managed independent account profiles are not silently skipped.
- **Complexity**: 7/10
- **Dependencies**: Task 4.1 and action-history model.
- **Acceptance Criteria**:
  - No admin action is available in locked state.
  - No child profile can reach protected settings as child authority.
  - Text fits and remains navigable on extension popup/dashboard sizes.
- **Validation**:
  - `npm run test:settings`
  - manual dashboard smoke

## Sprint 5: Time Limits And Viewing-Space Enforcement

**Goal**: Add extension-first enforcement for profile viewing spaces and daily
YouTube budgets, then document app parity.

**Demo/Validation**:

- Child profile can be set to Main only, Kids only, both, or neither.
- Daily YouTube budget is enforced across SPA navigation and active tabs.
- Timeout overlay appears only when policy says access is exhausted.

### Task 5.1: Add time-limit schema tests

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_CHILD_TIME_LIMIT_SCHEMA_CONTRACT_2026-06-03.md`
  - `tests/runtime/managed-child-time-limit-schema-current-behavior.test.mjs`
- **Description**: Define daily budget, timezone/day boundary, grace behavior,
  active-tab counting, reduced budget, and override fields.
- **Status**: Local profile UI/store, contract fixture, background-owned daily
  usage counter, active-tab heartbeat, route gate, and timeout overlay are
  present. Saved time-limit policies can be included in signed managed-policy
  sends; installed two-device smoke and native app parity remain pending.
- **Complexity**: 6/10
- **Dependencies**: Sprint 1 for local schema; Sprints 2 and 3 for remote
  managed time-limit updates.
- **Acceptance Criteria**:
  - Invalid negative budgets fail.
  - Reduced budget from trusted parent applies as newer policy.
  - Sleep/restart and timezone drift decisions are explicit.
- **Validation**:
  - `npm run test:settings`

### Task 5.2: Add Main/Kids route-gate fixtures

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_VIEWING_SPACE_ROUTE_GATE_CONTRACT_2026-06-03.md`
  - `tests/runtime/managed-viewing-space-route-gate-current-behavior.test.mjs`
- **Description**: Pin allowed and denied behavior for `youtube.com` and
  `youtubekids.com` per profile policy.
- **Status**: Contract/proof fixture, runtime route blocking, denied-route
  overlay, and SPA/open-tab revalidation are present for active child profiles.
  Viewing-space policy can be included in signed managed-policy sends; installed
  two-device smoke and native app parity remain pending.
- **Complexity**: 5/10
- **Dependencies**: Sprint 1.
- **Acceptance Criteria**:
  - Main-only, Kids-only, both, neither, and missing-policy fixtures exist.
  - No-policy/no-work performance remains intact.
- **Validation**:
  - `npm run test:settings`
  - `npm run test:performance`

### Task 5.3: Implement runtime time-budget enforcement

- **Location**:
  - `js/background.js`
  - `js/content_bridge.js`
  - `js/content/dom_fallback.js` only if needed
  - timeout overlay assets/spec
- **Description**: Enforce budget at runtime with background-owned accounting
  and a content-side overlay/gate.
- **Status**: First runtime slice implemented for enabled child/protected
  profile policies through compiled `managedTimeLimitPolicy`, background
  `ftManagedTimeUsageV1`, content heartbeats, and protected timeout overlay.
  The timeout overlay now carries background-owned daily limit, used time, and
  reset context while covering the YouTube surface instead of redirecting the
  protected user elsewhere. Installed-extension fake-clock and live multi-tab
  smoke remain manual.
- **Complexity**: 9/10
- **Dependencies**: Tasks 5.1 and 5.2.
- **Acceptance Criteria**:
  - Active tab, reload, SPA navigation, sleep/restart, timezone drift, and
    reduced-budget cases are covered.
  - Empty install and no-policy behavior add no measurable YouTube lag.
  - Overlay is accessible and cannot be dismissed by child authority.
- **Validation**:
  - `npm run test:settings`
  - `npm run test:performance`
  - `npm run test:dom`
- manual installed-extension YouTube smoke

## Sprint 6: Downstream App Policy Parity

**Goal**: Keep the extension and mobile/tablet apps on one managed policy
contract before wiring more native app runtime behavior.

**Demo/Validation**:

- App contract lists profile, viewing-space, time-limit, envelope,
  keyword/channel/video rule, and history fields.
- Contract excludes extension runtime APIs from downstream authority payloads.
- Current app sync manifest copies the dedicated contract artifact before
  native app enforcement changes.

### Task 6.1: Add extension-owned app policy contract proof

- **Location**:
  - `docs/audit/FILTERTUBE_MANAGED_APP_POLICY_CONTRACT_PARITY_2026-06-04.md`
  - `tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs`
- **Description**: Define the shared managed policy contract that Android/iOS
  app adapters must preserve while keeping native route/time/app-open locks as
  app-shell responsibilities.
- **Status**: Contract doc, JSON artifact, app sync manifest row, and focused
  settings/native-sync proof added. The contract now also makes managed
  keyword/channel/video rule scopes first-class app policy surfaces so native
  app parity cannot claim remote rule control without consuming the shared rule
  contract. The extension-side
  `verify:managed-app-policy` command now checks that the Markdown contract,
  JSON artifact, declared helper sources, and available app sync manifest copy
  rows stay aligned before a native runtime sync/release handoff. Product
  runtime behavior is unchanged; native Android/iOS enforcement remains
  pending. The configured HTTPS mailbox helper is now declared in the
  extension-owned app policy contract so downstream app sync has an explicit
  source row to mirror before claiming mailbox parity.
- **Complexity**: 4/10
- **Dependencies**: Sprint 1 policy schema, Sprint 5 viewing-space/time-limit
  runtime contracts.
- **Acceptance Criteria**:
  - Apps consume profile, envelope, managed keyword/channel/video rule,
    viewing-space, time-limit, and history contracts.
  - Apps do not treat extension background/session cache, content-script DOM
    state, YouTube selectors, or page-message state as native authority.
  - Main/Kids remain viewing spaces, not separate child profiles.
  - Remote keyword/channel/video app parity reuses the same validated mutation
    paths as local controls.
  - Native app shell owns app-open lock, Main/Kids route gate, and time budget
    gate before managed web content opens.
  - The current app sync manifest contract-copy row exists and remains
    byte-identical to the extension artifact.
- **Validation**:
  - `npm run verify:managed-app-policy`
  - `node --test tests/runtime/managed-app-policy-contract-parity-current-behavior.test.mjs`
  - `node --test tests/runtime/native-runtime-sync-authority-current-behavior.test.mjs`
  - `npm run test:settings`

## Sprint 7: Offline Mailbox Specification

**Goal**: Specify but do not rush an encrypted pending-update mailbox for cases
where parent and child devices are not reachable at the same time.

**Demo/Validation**:

- Protocol doc defines ciphertext-only server state and replay-safe delivery.

### Task 6.1: Add encrypted mailbox protocol spec

- **Location**:
  `docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-04.md`
- **Description**: Define pending update storage as unreadable ciphertext plus
  target link id, revision metadata, expiry, and ack state.
- **Complexity**: 6/10
- **Dependencies**: Sprint 3.
- **Status**: Protocol doc, executable proof fixture, source-side WebCrypto
  mailbox seal/open helpers, source-side server-safe mailbox storage item
  builder, source-side mailbox upload-provider handoff, and local/decrypted
  mailbox-item validation/apply intake added. A provider-gated
  dashboard/profile-open hook can request already-decrypted mailbox items from
  a trusted local provider and send redacted ack records after apply/reject.
  Provider rejection or provider failure now fails closed without applying or
  acknowledging any returned items. Runtime browser HTTPS mailbox upload/pull
  is present behind explicit dashboard configuration and parent/account re-auth
  for endpoint changes; mailbox server deployment and authority remain absent
  by design.
- **Acceptance Criteria**:
  - Server cannot read rules.
  - Replay, stale, revoked, wrong-target, and duplicate delivery behavior is
    specified.
  - Local/decrypted items bind mailbox metadata to the decrypted managed-policy
    envelope before validation/apply.
  - Source-side storage items contain only ciphertext metadata until the local
    open helper or a trusted local provider supplies a decrypted envelope.
  - Source-side upload handoff gives optional providers only ciphertext
    mailbox items and marks sent state only for provider-accepted item ids.
  - Pull-on-open does no work unless the trusted link opted into
    `syncOnProfileOpen` and a local provider is available.
  - Provider `ok: false` responses and provider exceptions do not apply or ack
    returned items and leave the last accepted policy active.
  - Provider ack handoff uses redacted metadata only and does not expose
    plaintext rules.
  - Mailbox is optional and does not weaken local/P2P security.
- **Validation**:
  - `git diff --check`

## Testing Strategy

Run lanes by touched area:

```bash
npm run test:settings
npm run test:performance
npm run test:dom
npm run test:whitelist
npm run test:blocking
npm run test:json
npm run test:menu
npm run test:release
npm run test:smoke
npm run test:changed
```

Minimum lane mapping:

| Change type | Required lanes |
| --- | --- |
| Policy schema/revision | `test:settings`, `test:changed` |
| Nanah managed envelope | `test:settings`, `test:release`, `test:changed` |
| Remote rule mutation | `test:settings`, `test:blocking`, `test:whitelist`, `test:changed` |
| Runtime route/time limits | `test:settings`, `test:performance`, `test:dom`, `test:changed` |
| Menu/quick-block rule actions | `test:menu`, `test:blocking`, `test:changed` |
| UI/dashboard surfaces | `test:settings`, manual dashboard smoke |
| Build/release docs | `test:release`, `test:smoke`, `test:changed` |

## Potential Risks And Gotchas

- Local network discovery is not authority. A discovered device must still be
  paired and trusted.
- A child PIN is not an admin PIN. Do not let child unlock state permit policy
  edits, sync trust changes, import/export, or time-limit overrides.
- Action history can become sensitive. Keep summaries local, redacted where
  needed, and separate from policy authority.
- Remote writes must not bypass existing rule validation and profile/list-mode
  compilation.
- Viewing-space and time-limit gates must avoid breaking normal blocklist,
  whitelist, Shorts, end-screen, quick-block, and menu behavior.
- No-policy/no-work performance must remain a release gate because managed
  controls add new observers, timers, storage checks, and UI state.
- Encrypted mailbox design must not imply the server can manage policy. The
  server can only hold unreadable pending updates.

## Rollback Plan

- Schema-only/test-only slices can be reverted by removing their tests and docs.
- Runtime managed-policy apply can be feature-gated behind a disabled default
  until all lanes pass.
- Nanah managed policy envelope support should fall back to existing
  `app_sync` and `control_proposal` behavior when the envelope type is absent.
- Time-limit enforcement should be guarded by explicit per-profile policy; no
  policy must preserve current YouTube behavior.

## Suggested Issue 60 Reply

```md
Thank you for clarifying. I understand the use case much better now.

Yes, this is the direction I want FilterTube to support: parents, families, and
caregivers should be able to keep the useful parts of the internet available
while reducing exposure to content that can be harmful or destabilizing for a
protected user.

We have already started the extension-side work for this. The first step is an
authority audit of profiles, PIN/session gates, Nanah P2P trusted devices, and
managed child-profile policy, because remote management must be secure before
it becomes automatic.

The scope I am now tracking includes:

- local-network / P2P management where possible
- remote blocking of videos, keywords, and channels
- parent/caregiver password or PIN protection
- protected profiles keeping the last valid policy while offline
- action history/logs so the parent/caregiver can see what changed
- later mobile/tablet parity using the same policy model

I do not want to rush this with a weak security model. The protected user must
not be able to become admin by entering a child PIN, sibling profiles must not
be able to change each other, and remote updates need trusted pairing plus
revision/integrity checks so stale or untrusted policies are rejected.

So the implementation has begun from the extension first, because the extension
is the upstream policy/settings model that the mobile and tablet apps will
follow. I will share progress as this moves from audit/spec into implementation.
```
