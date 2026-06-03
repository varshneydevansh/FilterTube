# Plan: Local-Network Managed Parent Controls

**Generated**: 2026-06-03
**Estimated Complexity**: High
**Status**: Planning/specification plus first local managed-save runtime slice.
Remote/local-network managed policy behavior remains unchanged.
**Primary audit input**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`

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

The implementation should stay extension-first because this repository owns the
upstream profile/settings/policy contract that downstream mobile and tablet
apps should follow.

## Requirements Added From Issue 60

| Requirement | Product meaning | Release safety meaning |
| --- | --- | --- |
| Local-network or P2P management | A trusted parent/caregiver device can manage a child or protected profile on the same network when reachable. | Remote writes cannot be accepted from page messages, untrusted peers, sibling profiles, or stale links. |
| Password/PIN protected admin mode | The protected end user cannot change managed rules or disable controls. | Child PIN never becomes admin authority; parent/account PIN gates writes. |
| Remote video, keyword, and channel rules | Parent can block specific videos, keywords, and channels just like local app controls. | All remote writes must reuse the same validated rule mutation paths as local writes. |
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
- **Rotation and revocation**: key rotation, trust revocation, and compromised
  device recovery must be explicit.
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
- Rows need retention limits and redaction/encryption defaults.
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
- No runtime route/time-limit enforcement before schema and fixtures exist.

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
- **Status**: Revision/replay matrix added inside the schema contract.
  Product runtime behavior remains unchanged.
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
  the first accepted-save revision/history runtime slice. Failed unlock
  logging, admin TTL, and sensitive re-auth remain pending.
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
  runtime now writes accepted local managed child save rows only; remote
  rejected/conflict rows, access UI, and clear path remain pending.
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
- **Status**: Boundary contract and hostile-LAN proof fixture added. Product
  runtime behavior remains unchanged.
- **Acceptance Criteria**:
  - Discovery, pairing, transport, and policy authority are separate rows.
  - Network reachability failure has clear offline behavior.
  - Discovery cannot grant trust, refresh trust, rotate keys, or change profile
    policy without explicit paired authority.
  - Hostile-LAN scenarios are named with fixture ids.
- **Validation**:
  - `git diff --check`

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
- **Acceptance Criteria**:
  - UI has empty, loading, error, locked, offline, and sync-conflict states.
  - Parent actions are clear and reversible where possible.
  - Child/protected profile view hides admin controls.
- **Validation**:
  - UI spec review against existing `docs/MOBILE_APP_UI_SPEC.md`.

### Task 4.2: Implement parent/caregiver UI increment

- **Location**:
  - `js/tab-view.js`
  - dashboard HTML/CSS files as discovered before implementation
  - matching UI/runtime tests
- **Description**: Add the smallest runnable UI increment after the spec is
  accepted: managed profile status and action-history read-only panel.
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
- **Status**: Local profile UI/store and contract fixture added. Runtime budget
  counters, route gates, and timeout overlays remain pending.
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
- **Status**: Contract/proof fixture added. Runtime route blocking and visible
  denial UI remain pending.
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

## Sprint 6: Offline Mailbox Specification

**Goal**: Specify but do not rush an encrypted pending-update mailbox for cases
where parent and child devices are not reachable at the same time.

**Demo/Validation**:

- Protocol doc defines ciphertext-only server state and replay-safe delivery.

### Task 6.1: Add encrypted mailbox protocol spec

- **Location**:
  `docs/audit/FILTERTUBE_MANAGED_POLICY_ENCRYPTED_MAILBOX_PROTOCOL_2026-06-03.md`
- **Description**: Define pending update storage as unreadable ciphertext plus
  target link id, revision metadata, expiry, and ack state.
- **Complexity**: 6/10
- **Dependencies**: Sprint 3.
- **Acceptance Criteria**:
  - Server cannot read rules.
  - Replay, stale, revoked, wrong-target, and duplicate delivery behavior is
    specified.
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
