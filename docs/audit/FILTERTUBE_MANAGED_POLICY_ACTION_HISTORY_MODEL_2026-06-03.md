# Model: Managed Policy Action History And Access Control

**Generated**: 2026-06-03
**Status**: Local protected history access proof present; failed parent unlock
history writer present for managed-profile gates; remote managed-policy
validation history writer present for rejection/idempotent/apply outcomes, and
validated remote accepted apply history can now be recorded after the managed
apply wrapper succeeds. Local/decrypted mailbox-item intake now writes distinct
mailbox action-history rows through the same protected model, and explicitly
delivered local-network candidate `filtertube_managed_local_network_candidate`
outcomes now reuse the remote validation/apply history writer with
`transport: local_network`. Rejected/conflict live, mailbox, and local-network
receive attempts now persist profile-local remote failed-attempt rate-limit
state and copy redacted rate-limit metadata into the protected history row.
Parent/caregiver history clearing now records its own protected
`history.clear` evidence row instead of silently removing accepted rows.
History display now adds a safe source-category label derived from action type
and sanitized transport metadata: Parent edit, Approved list, Remote update,
Send update, Pick Up Later, Home Bridge, trusted-device, admin-access, time
request, delivery setting, or history. These labels help parents understand
manual/list-derived/remote/sent changes but remain display context only, not
policy authority.
Trusted-link removal history writer now records protected `trust_link.revoke`
rows when local accepted managed policy state is purged for a removed link, and
source-side signing-key rotation now records protected `trust_link.key_revoke`
rows for affected child-device links that must be paired again.
Managed channel-list import, remove, check, refresh, pause, and resume actions
now render through the protected action-history label/detail path, including
unchanged URL-backed checks that update last-checked/source metadata without
replacing channel rows or sending a remote policy.
Pull-on-open mailbox ack handoff now records redacted protected
`remote_policy.mailbox.ack` rows on the target profile after the provider ack
attempt completes. Provider-gated local-network candidate ack handoff now records
redacted protected `remote_policy.local_network.ack` rows on the target profile
after the provider ack attempt completes. Local parent-set time-limit changes now also record protected
redacted `policy.time_limit.update` rows on the target profile.
Parent-side live sends now record redacted outbound trusted-link history rows
without storing policy payload plaintext, and connected replicas now return
redacted live ack rows that the source stores only when they match a prior sent
revision/hash. The dashboard history renderer now treats sensitive rows as
protected display data: it uses fixed action labels and normalized reason codes
instead of rendering free-form sensitive summary labels. Source-side parent
policy push rows now also preserve redacted delivery feedback: delivery status,
live send count, LAN candidate count, mailbox queued count, failed count,
no-link count, provider-missing count, and transport labels. Runtime history
appends now prune expired rows with the documented retention windows: accepted
actions are retained for 30 days, while rejected/conflict/failed-auth/expired,
clear, trust, time/viewing-policy, and source-push evidence is retained for 90
days, and each protected profile remains capped at 500 rows. The central
sanitizer now also preserves optional encrypted summary
evidence only when it is already ciphertext-shaped and rejects plaintext-like
summary keys before storing protected history rows.
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
distinct mailbox action types. It also records local-network candidate
`filtertube_managed_local_network_candidate` outcomes after the dashboard
sanitizes the candidate and rebuilds trust from local managed-link state rather
than caller-provided trust objects. Accepted managed-policy envelopes now route
through a validated apply wrapper before history records the accepted remote
result. It also records protected
failed-auth rows when parent/admin unlock fails while opening managed child
edit, viewing/clearing protected history, changing viewing space, or changing
time limits, records a protected clear row when accepted history is cleared, and
records a protected `trust_link.revoke` row when trusted-link removal purges
target-local remote managed-policy state for that link. Source-side managed
signing-key rotation also records protected `trust_link.key_revoke` rows so
parents can see which child-device links need re-pairing. It also records
redacted outbound live-send evidence on the parent/source trusted link after a
signed Nanah envelope is sent, and redacted inbound live-ack evidence on the
same trusted link after a connected replica reports accepted, rejected, or
conflict status for that exact revision/hash. Pull-on-open mailbox ack handoff
now also writes protected redacted target-profile rows that show whether the
protected device handed the accepted/rejected mailbox result back to the local
provider. Same-device parent time-limit set/change/disable actions now write
protected `time_limits` rows with only budget/timezone counts, not rule values.
Optional encrypted history summaries are accepted only as ciphertext metadata
under the central sanitizer and do not change display labels or policy
authority.

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
| `result` | Outcome. | `accepted`, `sent`, `partial_sent`, `rejected`, `conflict`, `failed_auth`, `expired_session`, `cleared_by_admin`. |
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
policy.time_limit.request_extra
policy.channel_list.import
policy.channel_list.remove
policy.channel_list.check
policy.channel_list.refresh
policy.channel_list.pause
policy.channel_list.resume
policy.sync_policy.update
trust_link.create
trust_link.revoke
trust_link.key_revoke
managed_signing_key.rotate
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
remote_policy.mailbox.ack
remote_policy.local_network.ack
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
central safe-count/status summary sanitizer: yes
local encryption for sensitive summaries: ciphertext-only encryptedSummary metadata accepted
clear rejected evidence without parent authority: no
remote upload or telemetry: no
```

Suggested summary behavior:

- Keyword/video/channel values can be shown to the parent/caregiver during the
  active action, but stored rows are normalized through a central redacted
  summary sanitizer and keep only safe counts, status, scope, and transport
  metadata.
- Sensitive rows rendered in the dashboard should use fixed action labels and
  normalized machine-readable reason codes instead of free-form summary labels.
- Optional encrypted summaries are allowed only under
  `summary.encryptedSummary` with schema
  `filtertube_managed_action_history_encrypted_summary`; the sanitizer keeps
  ciphertext, nonce, cipher suite, key id, ciphertext hash, and created time,
  and rejects plaintext-like keys such as `payload`, `operations`, `keywords`,
  `channels`, `videoIds`, `plaintextValue`, `ruleValue`, `summary`, or `label`.
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
| `revoked_after_key_rotation` | Parent/source rotates the managed signing key and old child-device links can no longer receive updates. | `accepted` protected trust-link evidence with `reason: source_signing_key_rotated`; no plaintext rule values. |
| `rate_limited_remote_policy_attempt` | Repeated rejected/conflict remote policy attempts arrive for the same transport, link, source, target, and scope. | `rejected` or `conflict` row with redacted rate-limit metadata and no policy authority. |
| `acked_mailbox_policy_result` | Protected device reports a pulled mailbox apply/reject result back to the local provider. | `accepted` when the provider records every ack, otherwise `rejected` with the provider ack failure reason; never stores plaintext rule values. |
| `acked_local_network_candidate_result` | Protected device reports a local-network candidate apply/reject result back to the local provider. | `accepted` when the provider records every ack, otherwise `rejected` with the provider ack failure reason; never stores plaintext rule values. |
| `partial_parent_policy_push` | Parent/source sends to multiple delivery paths and at least one path fails. | `partial_sent` with redacted delivery counts for live, LAN, mailbox, failed, no-link, provider-missing, and transport labels. |
| `accepted_mailbox_provider_config` | Parent/account enables, changes, or disables encrypted mailbox delivery. | `accepted` on every currently manageable protected profile, including Master-managed independent account profiles, with redacted configured state, target count, and endpoint host only. |
| `accepted_local_network_provider_config` | Parent/account enables, changes, or disables local-network gateway delivery. | `accepted` on every currently manageable protected profile, including Master-managed independent account profiles, with redacted configured state, target count, and endpoint host only. |
| `accepted_local_time_limit_policy` | Same-device parent/account sets, changes, or disables a protected profile's daily YouTube time limit. | `accepted` with local time-limit revision, policy hash, and redacted budget/timezone counts. |
| `requested_extra_time_after_timeout` | Protected user clicks the timeout overlay's ask-parent action after the background confirms the active child profile budget is exhausted or the policy needs revalidation. | `requested` protected `policy.time_limit.request_extra` evidence with redacted date/surface/budget/used counts only; it does not grant time, dismiss the overlay, or mutate policy. |
| `checked_channel_list_no_row_churn` | Parent checks a URL-backed managed channel list and the source hash is unchanged. | `accepted` protected `policy.channel_list.check` evidence with checked/source metadata and counts only; no channel rows are replaced and no remote send is prompted. |
| `refreshed_channel_list_source_changed` | Parent refreshes a URL-backed managed channel list and the source hash changes. | `accepted` protected `policy.channel_list.refresh` evidence with redacted counts, followed by the normal verified-device send offer when the protected profile has an eligible delivery path. |
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
runtime managed action history row writer: local managed child edit plus local time-limit policy edit plus managed channel-list import/remove/check/refresh/pause/resume plus failed parent unlock plus Nanah managed-policy validation/apply outcomes
runtime managed action history access gate: present for parent/account authority
runtime managed action history display redaction: present for sensitive rows through fixed labels, safe source-category labels, normalized reason codes, and redacted time-limit/request counts
runtime managed action history retention pruning: present for 30-day accepted rows, 90-day protected evidence rows, and 500-row profile cap
runtime managed action history clear path: present for accepted rows only while retaining protected evidence
runtime managed action history clear event writer: present as protected `history.clear` evidence
runtime managed timeout ask-parent request writer: present as protected `policy.time_limit.request_extra` evidence after background policy/budget revalidation
runtime managed extra-time grant request resolution marker: present as redacted `resolvedRequestCount` on the parent grant's `policy.time_limit.update` history row
runtime remote managed validation/apply history writer: present for rejected, conflict, idempotent, and accepted apply outcomes
runtime remote managed accepted apply history writer: present behind validated managed apply wrapper
runtime mailbox managed validation/apply history writer: present for local/decrypted mailbox item intake outcomes
runtime mailbox ack-handoff history writer: present on protected target profiles
runtime local-network candidate validation/apply history writer: present for sanitized local-network candidate outcomes without adding discovery or LAN delivery
runtime local-network ack-handoff history writer: present on protected target profiles
runtime remote managed failed-attempt rate-limit state: present under profile.managedPolicyState.remoteFailedAttemptRateLimits
runtime managed outbound live send history writer: present on trusted link policy rows as redacted parent-side send evidence
runtime managed parent command-center delivery history writer: present on protected target profiles with redacted per-transport delivery counts and status
runtime managed mailbox provider config history writer: present on every currently manageable protected profile, including Master-managed independent account profiles
runtime managed local-network provider config history writer: present on every currently manageable protected profile, including Master-managed independent account profiles
runtime managed inbound live ack history writer: present on trusted link policy rows as redacted parent-side applied/rejected feedback
runtime managed source key-rotation history writer: present on protected target profiles as redacted `trust_link.key_revoke` evidence
runtime behavior changed by this contract: yes, for accepted local managed child saves, accepted local time-limit policy edits, protected timeout ask-parent request rows, protected failed-auth rows, parent/account history access, Nanah managed-policy receive evidence, validated remote apply history, local/decrypted mailbox item evidence, pull-on-open mailbox ack-handoff evidence, sanitized local-network candidate evidence, remote failed-attempt rate-limit metadata, parent-side outbound live send evidence, command-center delivery feedback history, provider configuration history, parent-side live ack feedback, and source key-rotation re-pairing evidence
```

The current local writer stores redacted count/status summaries under
`profile.managedActionHistory[]`; local time-limit rows store only enabled
state, daily budget counts, timezone, parent-grant seconds, and surface-budget
count. Protected timeout request rows store only date, Main/Kids surface,
daily budget, used time, and remaining-time counts after background
revalidation. The parent/account history modal renders those time-limit and
request facts as redacted operational details so caregivers can understand what
happened without exposing rules or making the log authority. Parent policy push
rows store only safe delivery status/counts and transport labels, never
keyword/channel/video values or policy payload plaintext. Every runtime
append and read path now normalizes rows through
`sanitizeManagedActionHistoryRow`, drops unapproved summary keys, and prunes
expired rows before saving, using the documented 30-day accepted-action window,
90-day protected-result/protected-action evidence window, and 500-row cap. The local access gate uses active
parent/account authority, not child PIN authority, and `clearManagedActionHistory`
preserves rows that are rejected, conflict, failed-auth, expired-session, trust
revocation, time-limit, viewing-space, or prior clear evidence.
The command-center `Review Conflict` action uses the same parent/account
re-auth gate but filters the modal to conflict and rejected remote-policy rows
first. This is a read-only triage view over protected evidence; it does not
clear, merge, retry, accept, or otherwise mutate policy.

The current failed-auth writer records protected evidence rows on the target
protected profile. The dashboard unlock gate and background `FilterTube_SessionPinAuth`
path persist local managed-action failed-attempt rate-limit state on the
managing profile under `profile.managedPolicyState.adminFailedUnlockRateLimit`.
It does not extend an admin session, and it does not authorize any future
policy mutation. Dashboard unlock sessions and the background PIN cache now
expire, sensitive managed gates require fresher re-auth before history,
rule-edit, viewing-space, or time-limit mutations, and the background PIN cache
remains memory-only while failed-attempt rate-limit state is profile-persisted.

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
Mailbox ack-handoff rows use `remote_policy.mailbox.ack` and are written after
the provider ack attempt. They record only link/profile/scope/revision/hash,
mailbox item id metadata, ack state, and provider ack counts; they do not store
the decrypted policy payload and do not make the provider authoritative.
Local-network candidate rows use the same `remote_policy.accept`,
`remote_policy.reject`, or `remote_policy.conflict` action types with
`summary.transport: local_network`. The transport marker is diagnostic only;
authority still comes from the locally saved managed link, signature evidence,
target profile, scope, revision, and policy hash.
Rejected/conflict remote attempts also update
`profile.managedPolicyState.remoteFailedAttemptRateLimits` for the
transport/link/source/target/scope tuple and include redacted
`remoteFailedAttempts`, `remoteFailedAttemptLimit`, `rateLimited`, and
`retryAt` metadata in the row summary. This helps parents/caregivers diagnose
provider or hostile-LAN spam without accepting, blocking, or applying policy
from the history log itself.
Outbound live-send rows use `filtertube_managed_outbound_policy_history` under a
trusted link policy row because the parent/source may not have the remote child
profile locally. Those rows are feedback evidence for the parent only; the
remote child policy still changes only after receive-side validation/apply.
Inbound live-ack rows use `filtertube_managed_live_ack_history` under the same
trusted link policy row. They are recorded only when a connected replica's ack
matches the prior outbound link id, target profile, source device, scope,
revision, and policy hash.
Provider-fed mailbox and local-network delivery ack rows use
`filtertube_managed_remote_delivery_ack_history` under the same trusted link
policy row. They are recorded only when the provider payload matches a prior
outbound link id, target profile, source device, scope, revision, and policy
hash. This gives parent/caregiver feedback for later-delivery handoffs without
letting the provider authorize policy or store plaintext rule values.
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
