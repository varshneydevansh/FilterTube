# Contract: Managed Policy Schema And Revision Gate

**Generated**: 2026-06-03  
**Status**: Runtime validation helper, receive-side validation context, and
adapter WebCrypto verifier plumbing are present. A validated managed apply
wrapper now persists accepted-revision state and scoped child policy writes
after the envelope validator accepts the update. Pairing-time trusted key
material is still required before live Nanah managed envelopes can pass the
verifier gate automatically.
**Goal slice**: Implementation order item 3, "Add managed policy schema,
device-binding, signature, and revision tests".  
**Primary input**:
`docs/audit/FILTERTUBE_RELEASE_PROFILE_NANAH_MANAGED_PARENT_AUTHORITY_INVENTORY_2026-06-03.md`

## Purpose

This contract defines the minimum `filtertube_managed_policy` envelope that a
future Nanah P2P, local-network, or encrypted-mailbox update must satisfy before
FilterTube applies remote parent/caregiver policy to a protected profile.

The current product source validates this envelope shape in
`js/nanah_sync_adapter.js`, the Nanah dashboard receive path now parses managed
policy envelopes and records validation/apply evidence in `js/tab-view.js`, the
validated apply wrapper can update the fixed child target profile, and the
legacy portable-payload apply path refuses to apply
`filtertube_managed_policy` envelopes directly. This file and its paired
runtime tests remain the gate that later transport/key-store implementation must
satisfy before live remote runtime writes are enabled by default.

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
| `integrity` | Signature or equivalent authenticated proof over the binding tuple below. | Missing algorithm/signature, missing signed binding fields, binding mismatch, missing verifier, or verifier rejection. |
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

The runtime helper now requires explicit signature-verification evidence after
the binding tuple passes. A caller can satisfy that gate by providing a
trusted verification result or a synchronous verifier callback. The Nanah
adapter now builds WebCrypto Ed25519 verification evidence from trusted-link
`sourcePublicKeyJwk` material, and the dashboard receive path passes that
evidence into the synchronous adapter validator. If the trusted link has no
stored public key material,
managed envelopes fail closed with `missing_public_key_material` instead of
being treated as valid. Future pairing/key-store plumbing must preserve the
same binding rejection: even a valid-looking signature is rejected if any signed
field points at a different link, scope, target profile, source device,
revision, policy hash, or payload family than the envelope being applied.

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
9. A signature verifier or trusted verification result accepts the envelope.
10. The revision decision accepts the envelope.

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
- missing signature verifier
- invalid signature verifier result
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

Current product behavior has the validation helper, validated apply wrapper, and
receive-side context/history plumbing. Live remote delivery still depends on
pairing-time key material and transport plumbing:

```text
runtime filtertube_managed_policy envelope support: validation helper plus validated apply wrapper present in js/nanah_sync_adapter.js
runtime filtertube_managed_policy receive path: parses envelope, builds validation context, applies only accepted envelopes, records protected evidence
runtime managed policy persistent accepted-revision writer: present under target profile managedPolicyState.remoteManagedPolicies
runtime managed policy signature verifier gate: present in js/nanah_sync_adapter.js
runtime Nanah adapter key-verification context: WebCrypto Ed25519 helper present; dashboard receive path passes result; missing sourcePublicKeyJwk fails closed before apply
runtime remote profile write from filtertube_managed_policy: enabled only through applyManagedPolicyEnvelope after validation context accepts
runtime behavior changed by this contract: envelope validation, signature-verifier gate, adapter verifier helper, dashboard receive-side validation/apply evidence, accepted revision persistence, scoped child policy apply, and legacy-path rejection
```

Future implementation may extend the live Nanah/local-network/mailbox transport
only after the same managed envelope contract accepts the incoming update and
the caller provides real key-verification evidence. The legacy portable
`applyIncomingEnvelope(...)` path must remain closed to managed envelopes.

## Verification

Focused test:

```bash
node --test tests/runtime/managed-policy-schema-revision-contract-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
