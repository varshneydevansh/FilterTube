# Model: Managed Policy Action History And Access Control

**Generated**: 2026-06-03
**Status**: Contract/proof fixture with local managed-save writer partially
present.
**Goal slice**: Implementation order item 4, "Add action-history/log model and
access-control tests".
**Primary inputs**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`.

## Purpose

Issue 60 asks for feedback, logs, or history so a parent/caregiver can see what
changed on a protected profile and diagnose rejected local-network or P2P
updates. This model defines that history and now tracks the first runtime
writer for accepted same-device parent-managed child surface saves.

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
| `accepted_local_child_surface_policy` | Same-device parent/account saves child Main or Kids rules through managed edit mode. | `accepted` with local revision, policy hash, and redacted counts. |
| `rejected_spoofed_lan_policy` | Local-network discovery claims parent device without trusted key. | `rejected` with `reason: untrusted_discovery`. |
| `rejected_equal_revision_conflict` | Same revision arrives with different policy hash. | `conflict` with old/new hashes redacted or hashed. |
| `rejected_after_trust_revocation` | Queued mailbox/P2P update arrives after link revocation. | `rejected` with `reason: trust_revoked`. |
| `failed_parent_unlock` | Admin PIN/password attempt fails. | `failed_auth` and rate-limit metadata. |
| `cleared_by_parent` | Parent/account clears viewable accepted-action history. | `cleared_by_admin`; rejected evidence may remain until retention expiry. |

## Current Runtime Boundary

Current product runtime source implements a narrow accepted local-write subset
of this model in `js/tab-view.js`; global remote accept/reject history,
protected access gates, and clear paths are still pending:

```text
runtime managed action history store: local managed child edit only
runtime managed action history row writer: local managed child edit only
runtime managed action history access gate: absent
runtime managed action history clear path: absent
runtime behavior changed by this contract: yes, for accepted local managed child saves
```

The current local writer stores redacted count summaries under
`profile.managedActionHistory[]`. Future implementation should add the remote
accept/reject history writer beside the managed policy accept/reject gate, not
inside low-level content rule mutation helpers. This keeps local
keyword/channel/video writes, Nanah apply, mailbox apply, and admin session
events using one history model without turning logs into policy state.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-policy-action-history-model-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
