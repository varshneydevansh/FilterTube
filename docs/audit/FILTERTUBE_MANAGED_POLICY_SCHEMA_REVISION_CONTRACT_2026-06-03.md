# Contract: Managed Policy Schema And Revision Gate

**Generated**: 2026-06-03  
**Status**: Contract/proof fixture only. Runtime behavior is unchanged.  
**Goal slice**: Implementation order item 3, "Add managed policy schema,
device-binding, signature, and revision tests".  
**Primary input**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`

## Purpose

This contract defines the minimum `filtertube_managed_policy` envelope that a
future Nanah P2P, local-network, or encrypted-mailbox update must satisfy before
FilterTube applies remote parent/caregiver policy to a protected profile.

The current product source does not apply this envelope yet. This file and its
paired runtime test are the gate that later implementation must satisfy before
runtime writes are enabled.

## Managed Envelope Shape

Required top-level fields:

| Field | Meaning | Reject when |
| --- | --- | --- |
| `type` | Must be `filtertube_managed_policy`. | Missing or any other type. |
| `linkId` | Trusted managed link being used. | Missing, wrong link, revoked link, stale pairing, or discovery-only peer. |
| `scope` | Target rule family or policy surface. | Missing or not in trusted link allowed scopes. |
| `targetProfileId` | Protected profile receiving the policy. | Missing, wrong target, sibling target, parent target, or unfixed target. |
| `sourceProfileId` | Parent/caregiver profile issuing the policy. | Missing, child profile, sibling profile, or profile not bound to target. |
| `sourceDeviceId` | Trusted source device identity. | Missing, wrong device, duplicate LAN device id, or untrusted device. |
| `revision` | Monotonic policy revision for the target/link/scope. | Missing, non-integer, stale, or equal revision with different policy hash. |
| `policyHash` | Hash of canonical policy payload. | Missing or mismatched for equal-revision idempotency. |
| `sourcePublicKeyId` | Public-key identity bound to pairing. | Missing or not bound to the trusted link. |
| `keyVersion` | Pairing key version. | Missing, stale, wrong, or revoked. |
| `integrity` | Signature or equivalent authenticated proof over the binding tuple below. | Missing algorithm/signature, missing signed binding fields, or binding mismatch. |
| `payload` | Canonical policy operation payload. | Missing, not scoped to the envelope scope, or wrong operation family for that scope. |

Allowed scopes for the first contract:

```text
main
kids
videos
keywords
channels
viewing_space
time_limits
```

## Integrity Binding Tuple

The integrity proof must bind the signature to the policy decision, not just to
transport reachability. The first executable fixture requires the signed fields
to match:

```text
linkId
scope
targetProfileId
sourceDeviceId
revision
policyHash
payloadScope
```

A future implementation can use real cryptographic verification, but it still
must reject a valid-looking signature if any signed field points at a different
link, scope, target profile, source device, revision, policy hash, or payload
family than the envelope being applied.

## Payload Scope Guard

The envelope scope and payload family must agree before any low-level profile
write:

| Scope | Required payload family proof |
| --- | --- |
| `keywords` | Keyword operation payload only. |
| `channels` | Channel operation payload only. |
| `videos` | Video operation payload only. |
| `viewing_space` | Main/Kids route policy fields. |
| `time_limits` | Non-negative budget or structured time-limit policy. |

This prevents a parent/caregiver update that is approved for one scope from
carrying a different policy family under the same signed-looking envelope.

## Authority Rules

Managed policy acceptance requires all of these to be true:

1. The link is a saved `managed_link`.
2. The receiver is the local `replica` role and the sender is the remote
   `source` role.
3. Local-network discovery is not treated as authority.
4. The source device id, source profile id, target profile id, key id, and key
   version match the trusted link.
5. The target profile is the fixed child/protected profile for the link.
6. The source parent/caregiver profile is allowed to manage the target profile.
7. The requested scope is allowed by the trusted link.
8. The envelope integrity proof is present before apply.
9. The revision decision accepts the envelope.

## Revision Decision Matrix

| Fixture id | Incoming revision/hash | Stored state | Decision |
| --- | --- | --- | --- |
| `valid_newer_parent_keyword_policy` | `5/hash-keyword-5` | `4/hash-keyword-4` | Accept and record revision 5. |
| `valid_equal_same_hash_idempotent` | `4/hash-keyword-4` | `4/hash-keyword-4` | Accept as idempotent, no policy rewrite required. |
| `reject_older_revision` | `3/hash-keyword-3` | `4/hash-keyword-4` | Reject as stale or replayed. |
| `reject_equal_revision_different_hash` | `4/hash-other` | `4/hash-keyword-4` | Reject and log conflict. |
| `valid_reduced_time_budget_from_parent` | `7/hash-time-7` | `6/hash-time-6` | Accept when signed by trusted parent authority. |
| `reject_mailbox_after_revocation` | `8/hash-mailbox-8` | link revoked | Reject before low-level profile apply. |

Offline protected-device behavior:

- The last accepted policy remains active while the parent/caregiver device is
  unreachable.
- Network reachability or LAN discovery never downgrades, clears, or refreshes
  policy authority.
- A queued mailbox update received after trust revocation is rejected even when
  its revision is newer.

## Negative Fixture Requirements

The paired runtime test must reject:

- missing target profile
- missing source device
- missing scope
- missing revision
- missing key identity
- missing signature/integrity proof
- missing signed integrity binding tuple
- signed scope, target, source device, revision, policy hash, or payload family
  mismatch
- payload family not scoped to envelope scope
- malformed time-limit or viewing-space payload
- child source profile attempting admin authority
- sibling profile attempting to manage another sibling
- wrong target profile
- wrong trusted link id
- wrong source device id
- duplicate LAN device id
- stale pairing record
- revoked link or revoked key
- stale revision
- equal revision with different hash

## Runtime Boundary

Current product behavior remains unchanged:

```text
runtime filtertube_managed_policy envelope support: absent
runtime managed policy revision store: absent
runtime managed policy signature verification: absent
runtime behavior changed by this contract: no
```

Future implementation may use `FilterTubeNanahAdapter.applyScopedPortablePayload`
as the low-level profile write primitive only after this managed envelope
contract accepts the incoming update.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
