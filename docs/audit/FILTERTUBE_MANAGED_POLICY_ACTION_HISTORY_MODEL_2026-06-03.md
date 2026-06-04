# Model: Managed Policy Action History And Access Control

**Generated**: 2026-06-03
**Status**: Local protected history access proof present; failed parent unlock
history writer present for managed-profile gates; remote managed-policy
validation history writer present for rejection/idempotent/apply outcomes, and
validated remote accepted apply history can now be recorded after the managed
apply wrapper succeeds. Local/decrypted mailbox-item intake now writes distinct
mailbox action-history rows through the same protected model. Parent/caregiver
history clearing now records its own protected `history.clear` evidence row
instead of silently removing accepted rows. Trusted-link removal history writer
now records protected `trust_link.revoke` rows when local accepted managed
policy state is purged for a removed link. Parent-side live sends now record
redacted outbound trusted-link history rows without storing policy payload
plaintext, and connected replicas now return redacted live ack rows that the
source stores only when they match a prior sent revision/hash.
**Goal slice**: Implementation order item 4, "Add action-history/log model and
access-control tests".
**Primary inputs**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`.

## Purpose

Issue 60 asks for feedback, logs, or history so a parent/caregiver can see what
changed on a protected profile and diagnose rejected local-network or P2P
updates. This model defines that history, tracks the first runtime writer for
accepted same-device parent-managed child surface saves, exposes a
parent/account-only local history view for protected child rows, and now records
receive-side managed-policy validation outcomes when a
`filtertube_managed_policy` envelope reaches the Nanah dashboard path, and now
also records local/decrypted `filtertube_managed_mailbox_item` outcomes with
distinct mailbox action types. Accepted managed-policy envelopes now route
through a validated apply wrapper before history records the accepted remote
result. It also records protected
failed-auth rows when parent/admin unlock fails while opening managed child
edit, viewing/clearing protected history, changing viewing space, or changing
time limits, records a protected clear row when accepted history is cleared, and
records a protected `trust_link.revoke` row when trusted-link removal purges
target-local remote managed-policy state for that link. It also records
redacted outbound live-send evidence on the parent/source trusted link after a
signed Nanah envelope is sent, and redacted inbound live-ack evidence on the
same trusted link after a connected replica reports accepted, rejected, or
conflict status for that exact revision/hash.

Action history is protected evidence and parent/caregiver UX. It is not policy
authority. Runtime policy must still come from the current accepted managed
policy, trusted link, target profile, revision, and integrity state.

## Required History Row Shape

Every future managed action-history row should be locally stored with this
minimum shape:

| Field | Meaning | Required behavior |
| --- | --- | --- |
| `rowId` | Stable local row id. | Generated locally; not trusted as authority. |
| `schema` | History schema marker. | Must be `filtertube_managed_action_history`. |
| `version` | History row schema version. | Starts at `1`; future migrations must be explicit. |
| `actorProfileId` | Parent/caregiver profile that attempted the action. | Required for accepted parent actions; remote rejected rows may use remote asserted id plus rejection reason. |
| `actorDeviceId` | Device that attempted the action. | Required for remote accepted/rejected attempts. |
| `targetProfileId` | Protected profile affected or targeted. | Required; sibling or parent targets stay rejected evidence. |
| `trustedLinkId` | Managed link involved, when remote. | Required for P2P, local-network, and mailbox attempts. |
| `actionType` | What was attempted. | Must be one of the approved action types below. |
| `scope` | Rule/policy surface. | `main`, `kids`, `videos`, `keywords`, `channels`, `viewing_space`, `time_limits`, `sync_policy`, `admin_session`, `trust_link`. |
| `revision` | Managed policy revision involved. | Required for managed-policy rows; local failed unlock can be `null`. |
| `policyHash` | Canonical policy hash involved. | Required for accepted managed-policy rows and replay/conflict diagnostics. |
| `result` | Outcome. | `accepted`, `rejected`, `conflict`, `failed_auth`, `expired_session`, `cleared_by_admin`. |
| `reason` | Machine-readable reason. | Required when result is not `accepted`. |
| `receivedAt` | Local receive/write timestamp. | Required for ordering, but not sufficient alone under clock skew. |
| `issuedAt` | Parent/caregiver policy timestamp, if present. | Optional diagnostic only; not authority. |
| `orderKey` | Stable ordering tuple. | Should combine receive sequence, revision, and timestamp. |
| `summary` | Redacted human-readable summary. | Must not require storing plaintext blocked terms in cleartext. |
| `sensitive` | Whether summary/rule values need redaction/encryption. | Required boolean. |

## Approved Action Types

```text
rule.video.block
rule.keyword.add
rule.keyword.remove
rule.channel.block
rule.channel.unblock
policy.viewing_space.update
policy.time_limit.update
policy.sync_policy.update
trust_link.create
trust_link.revoke
admin_session.unlock
admin_session.failed_unlock
local_policy.update
remote_policy.accept
remote_policy.reject
remote_policy.conflict
remote_policy.mailbox.accept
remote_policy.mailbox.reject
remote_policy.mailbox.conflict
remote_policy.mailbox.expire
remote_policy.mailbox.revoke
history.clear
```

## Access Control

History access must follow parent/caregiver authority, not child/protected-user
unlock state:

- Parent/account authority can view protected history for owned child/protected
  profiles.
- A child/protected profile cannot view protected history just because its child
  PIN is unlocked.
- A sibling profile cannot view or clear another sibling profile's history.
- Clearing history requires parent/account re-auth when rows include rejected
  remote updates, failed unlocks, trust changes, time-limit changes, or viewing
  space changes.
- Protected users cannot clear rejected-update, failed-unlock, revoked-link, or
  conflict evidence.
- Action history must not be used to decide whether content is blocked,
  whitelisted, time-limited, or route-gated.

## Retention, Redaction, And Local Storage

The first implementation should use local protected extension storage, with
retention and redaction limits:

```text
default retention rows per protected profile: 500
default rejected-attempt retention days: 90
default accepted-action retention days: 30
plaintext sensitive rule values: no
local encryption for sensitive summaries: future-compatible
clear rejected evidence without parent authority: no
remote upload or telemetry: no
```

Suggested summary behavior:

- Keyword/video/channel values can be shown to the parent/caregiver in the UI,
  but stored rows should support redacted or encrypted summaries.
- Rejected hostile-LAN rows should keep source device id, trusted link id,
  target profile id, rejection reason, revision, and policy hash when available.
- Wall-clock timestamps are diagnostic only. Stable ordering should prefer
  receive sequence, revision, and policy hash to tolerate clock skew.

## Required Recorded Outcomes

The following events must produce action-history rows in future implementation:

| Fixture id | Event | Required row result |
| --- | --- | --- |
| `accepted_remote_keyword_policy` | Trusted parent/source updates child keyword policy. | `accepted` with revision and policy hash. |
| `sent_live_remote_policy` | Parent/source sends a signed live Nanah policy to a trusted fixed target. | `sent` outbound evidence with revision and policy hash, redacted summary, and no payload plaintext. |
| `acked_live_remote_policy` | Replica reports whether a signed live Nanah policy was applied or rejected. | `accepted`, `rejected`, or `conflict` ack evidence with matching revision and policy hash, redacted summary, and no payload plaintext. |
| `accepted_local_child_surface_policy` | Same-device parent/account saves child Main or Kids rules through managed edit mode. | `accepted` with local revision, policy hash, and redacted counts. |
| `rejected_spoofed_lan_policy` | Local-network discovery claims parent device without trusted key. | `rejected` with `reason: untrusted_discovery`. |
| `rejected_equal_revision_conflict` | Same revision arrives with different policy hash. | `conflict` with old/new hashes redacted or hashed. |
| `rejected_after_trust_revocation` | Queued mailbox/P2P update arrives after link revocation. | `rejected` with `reason: trust_revoked`. |
| `failed_parent_unlock` | Admin PIN/password attempt fails. | `failed_auth` and rate-limit metadata. |
| `cleared_by_parent` | Parent/account clears viewable accepted-action history. | `cleared_by_admin`; rejected evidence may remain until retention expiry. |

## Current Runtime Boundary

Current product runtime source implements a narrow accepted local-write subset
of this model in `js/tab-view.js`. Parent/account profiles can now open a
protected child profile's local managed history from the profile row and clear
accepted rows while retaining rejected/conflict/failed-auth/trust/time/viewing
evidence. The clear path appends a protected `history.clear` /
`cleared_by_admin` row with redacted cleared/retained counts so the act of
clearing remains visible to the parent/caregiver audit trail. The Nanah receive
path now also parses `filtertube_managed_policy` envelopes and local/decrypted
`filtertube_managed_mailbox_item` rows, builds a trusted-link/profile/revision
validation context, and records protected validation-history rows on the target
profile when a row can be attached to a known protected profile:

```text
runtime managed action history store: profile-local managed child rows
runtime managed action history row writer: local managed child edit plus failed parent unlock plus Nanah managed-policy validation/apply outcomes
runtime managed action history access gate: present for parent/account authority
runtime managed action history clear path: present for accepted rows only while retaining protected evidence
runtime managed action history clear event writer: present as protected `history.clear` evidence
runtime remote managed validation/apply history writer: present for rejected, conflict, idempotent, and accepted apply outcomes
runtime remote managed accepted apply history writer: present behind validated managed apply wrapper
runtime mailbox managed validation/apply history writer: present for local/decrypted mailbox item intake outcomes
runtime managed outbound live send history writer: present on trusted link policy rows as redacted parent-side send evidence
runtime managed inbound live ack history writer: present on trusted link policy rows as redacted parent-side applied/rejected feedback
runtime behavior changed by this contract: yes, for accepted local managed child saves, protected failed-auth rows, parent/account history access, Nanah managed-policy receive evidence, validated remote apply history, local/decrypted mailbox item evidence, parent-side outbound live send evidence, and parent-side live ack feedback
```

The current local writer stores redacted count summaries under
`profile.managedActionHistory[]`. The local access gate uses active
parent/account authority, not child PIN authority, and `clearManagedActionHistory`
preserves rows that are rejected, conflict, failed-auth, expired-session, trust
revocation, time-limit, viewing-space, or prior clear evidence.

The current failed-auth writer records protected evidence rows on the target
protected profile. The dashboard unlock gate also persists local managed-action
failed-attempt rate-limit state on the managing profile under
`profile.managedPolicyState.adminFailedUnlockRateLimit`. It does not extend an
admin session, and it does not authorize any future policy mutation. Dashboard
unlock sessions and the background session PIN cache now expire, sensitive
managed gates require fresher re-auth before history, rule-edit, viewing-space,
or time-limit mutations, and the background session PIN failed-attempt cache is
still memory-only.

The current remote writer is still not policy authority by itself. A valid newer
`filtertube_managed_policy` envelope must first pass the managed envelope
validator and then `applyManagedPolicyEnvelope(...)`, which persists accepted
revision/hash state on the target child profile before the history row records
`remote_policy.accept`. Idempotent equal-revision/same-hash envelopes can be
recorded as accepted because no policy rewrite is needed. Missing verifier,
revoked link, stale revision, equal-revision conflict, sibling target, and
wrong-source cases still produce protected rejected or conflict history rows.
Mailbox rows use `remote_policy.mailbox.*` action types so parent/caregiver
history can distinguish delayed delivery from live Nanah delivery without
making the log authoritative.
Outbound live-send rows use `filtertube_managed_outbound_policy_history` under a
trusted link policy row because the parent/source may not have the remote child
profile locally. Those rows are feedback evidence for the parent only; the
remote child policy still changes only after receive-side validation/apply.
Inbound live-ack rows use `filtertube_managed_live_ack_history` under the same
trusted link policy row. They are recorded only when a connected replica's ack
matches the prior outbound link id, target profile, source device, scope,
revision, and policy hash.
This keeps local keyword/channel/video writes, Nanah apply, mailbox apply, and
admin session events using one history model without turning logs into policy
state.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
