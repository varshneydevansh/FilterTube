# Contract: Local-Network Discovery Authority Boundary

**Generated**: 2026-06-04  
**Status**: Contract/proof fixture only. Runtime behavior is unchanged.  
**Goal slice**: Implementation order item 2, "Add local-network/P2P
managed-control plan and hostile-LAN threat model".  
**Primary inputs**:
`docs/audit/FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md`,
`docs/audit/FILTERTUBE_MANAGED_POLICY_SCHEMA_REVISION_CONTRACT_2026-06-03.md`,
and
`docs/audit/FILTERTUBE_MANAGED_POLICY_ACTION_HISTORY_MODEL_2026-06-03.md`.

## Purpose

Issue 60 asks for parent/caregiver remote management over peer-to-peer or a
local network. This contract separates peer discovery from policy authority so
the feature can be built without allowing any same-network device, page script,
or stale pairing record to mutate a protected profile.

Local-network discovery is convenience only. It can find a nearby device and
start a pairing or reconnect flow, but it cannot grant trust, renew trust,
rotate keys, change rules, change viewing spaces, change time limits, clear
history, or disable protection. Managed policy authority still comes from an
already trusted managed link plus a valid managed-policy envelope.

## Boundary Rows

| Layer | Allowed responsibility | Must not do |
| --- | --- | --- |
| Discovery | Find visible peers, show device label, advertise a pairing or reconnect candidate. | Grant trust, update rules, refresh revoked trust, or select a target profile by itself. |
| Pairing | Establish a trusted managed link with source/replica roles, device ids, key identity, and fixed target profile policy. | Bypass parent/caregiver auth or silently repair stale child-device trust. |
| Transport | Carry an encrypted/authenticated managed-policy envelope over Nanah, local network, or future mailbox delivery. | Treat network reachability as authorization. |
| Policy validation | Check trusted link id, source device, source profile, target profile, scope, revision, key identity, and signature/integrity. | Accept page messages, unsigned payloads, stale revisions, wrong target profiles, or revoked keys. |
| Action history | Record accepted and rejected policy attempts as protected local evidence. | Become policy authority or expose sensitive plaintext rule values to the protected user. |
| Offline state | Keep the last valid accepted parent/caregiver policy while unreachable. | Weaken policy because discovery fails or the parent device is offline. |

## Required Authority Decision

A local-network policy update is accepted only when all of these are true:

1. The link is a `managed_link`.
2. The local device role is `replica` and the remote role is `source`.
3. The discovered peer id, managed envelope source device id, and trusted-link
   source device id all match.
4. The envelope target profile matches the trusted link fixed target profile.
5. The envelope source profile is parent/caregiver authority for the target.
6. The envelope scope is allowed by the trusted link.
7. The envelope revision is newer, or idempotent with the same revision and
   same policy hash.
8. The key id and key version match current trusted key state.
9. The envelope integrity proof verifies.
10. The link and key are not revoked, stale, duplicated, or quarantined.

Anything else is rejected before the low-level Nanah scoped apply path can
write a profile.

## Hostile LAN Threat Model

| Fixture id | Attack or failure | Required decision |
| --- | --- | --- |
| `lan_discovery_without_pairing` | A nearby unpaired device announces itself as a parent. | Show only as untrusted candidate; no policy write. |
| `lan_peer_announcement_spoof` | A device announces the trusted parent label but has a different device id. | Reject before envelope validation and record a rejected attempt if a policy payload is offered. |
| `lan_duplicate_device_id` | Two visible peers claim the same trusted source device id. | Quarantine/reject until parent re-pairs or resolves conflict. |
| `lan_stale_pairing_record` | The child device has an old managed link whose key or pairing epoch is stale. | Reject and keep the last valid policy active. |
| `lan_nat_reconnect_identity_drift` | Network address or transport session changes while the same device reconnects. | Allow only if trusted device/key identity still matches; network address is not authority. |
| `lan_wrong_key_mitm` | A man-in-the-middle forwards traffic with a wrong key id or signature. | Reject as integrity/key mismatch. |
| `lan_page_message_spoof` | A YouTube page or content script tries to send a local-network policy message. | Reject because page messages are not managed transport authority. |
| `lan_revoked_trust_reappears` | A previously revoked trusted device becomes reachable again. | Reject; discovery cannot un-revoke trust. |
| `lan_mailbox_after_revocation` | A queued encrypted mailbox update arrives after trust revocation. | Reject even if ciphertext delivery succeeds. |
| `lan_reachability_loss` | Parent/caregiver device is offline or no LAN peer is found. | Keep last valid policy; do not weaken rules or time limits. |

## No-Work And Performance Boundary

Local-network discovery must not run in YouTube content hot paths. It belongs
to explicit Accounts & Sync / managed-control flows and background sync windows
only. Empty install, no-policy, and ordinary YouTube SPA navigation must not
gain new observers, timers, DOM scans, or JSON parsing because local-network
management exists.

## Current Runtime Boundary

Current product runtime state:

```text
runtime local-network discovery authority gate: absent
runtime local-network peer discovery: absent
runtime filtertube_managed_policy envelope support: absent
runtime managed policy revision store: absent
runtime managed action-history writer: absent
runtime behavior changed by this contract: no
```

Existing Nanah profile-scoped `app_sync` and `control_proposal` paths are not
promoted to managed policy authority by this document. They remain lower-level
transport/apply primitives until a managed-policy validator and action-history
writer are implemented.

## Verification

Focused test:

```bash
node --test tests/runtime/local-network-discovery-authority-boundary-current-behavior.test.mjs
```

Settings lane:

```bash
npm run test:settings
```
