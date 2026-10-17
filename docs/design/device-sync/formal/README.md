# Bounded device-sync authorization models

These TLA+ models check a small state space for the parent approval and sync
behaviors being implemented. They are design checks, not a proof that the
extension, cryptography or networks are secure. Production code is not generated
from these specifications, and no refinement proof connects it to them.

## Models and assumptions

`DeviceSync.tla` represents one paired receiving child/device and two revisions.
It permits arbitrary interleavings of sender/receiver profile switching, child
ownership changing between two local parents, explicit phrase matching, link
revocation, asynchronous approval, sending, applying and delayed/reordered
receipts. Nearby discovery only changes visibility. QR/code pairing abstracts to
the same offered/matched/trusted states. Internet and local transports abstract to
the same in-flight state because both require the same authorization checks.

The sender identity and receiver-local parent identity are distinct concepts,
even though the small model uses `P` as a label on each side. Source actors that
are children cannot send managed policy. A receiving child can remain active
while its owner supplies parent approval; switching to that child does not itself
provide approval. `Approve` assumes the correct parent authentication succeeded.
Trusted managed apply can run in the background regardless of which local
profile is active. Apply Once instead retains the approving operation's exact
local actor, owner, target and scope and never writes the saved link.

`ProfileBinding.tla` separately represents two parents and two child profiles on
one device. It explores all picker source/target combinations and reparenting
while approval or writing is pending. Each operation must keep its captured
source and recipient; it cannot follow a changed picker into another profile.
Both profiles may be updated by separate authorized operations.

Payloads/signatures/keys, encryption, replay hashes, clock expiry, PIN strength,
helper authentication, storage failures and device IDs are abstracted away.
The model also assumes the exporter uses the captured source profile's contents.
The reproduced first portable send violated that implementation assumption by
exporting the active adult snapshot. The corrected exporter is covered separately
by `nanah-first-managed-source-current-behavior.test.mjs`, including the real
portable import path; passing the model alone could not have detected this bug.
Receipts are assumed authentic and already bound to the same link/device/profile/
scope stream. Two revisions bound the replay/freshness examples. Main/Kids are
approved scopes; an extra invalid scope/target exercises rejection. The model
assumes the authority check and storage commit form one atomic step. That
assumption requires separate implementation race tests. There are no fairness,
eventual-delivery, availability, latency or network-partition guarantees.

## Checked safety properties

| Model | Invariant | Meaning |
| --- | --- | --- |
| DeviceSync | `TypeOK` | States stay inside the finite modeled domains. |
| DeviceSync | `FreshWriteAuthority` | Every actual apply uses current ownership, and either current unrevoked saved trust or the same operation-local approved actor/owner. |
| DeviceSync | `NoChildManagedSend` | Child source actors never dispatch managed policy. |
| DeviceSync | `PresenceIsNotTrust` | A saved trust grant requires the explicit matched pairing stage; discovery alone cannot grant it. |
| DeviceSync | `AppliedMeansLatest` | Applied in the sender UI means an accepted receipt for the newest sent revision. |
| DeviceSync | `ReceiptFollowsApply` | A represented accepted receipt is produced only after the receiver applies. |
| ProfileBinding | `TypeOK` | Owners, source accounts, recipients and writes remain in the two-parent/two-child domain. |
| ProfileBinding | `NoCrossProfileWrite` | Changing the picker cannot change an already approved operation's source or recipient. |

Four unsafe configurations deliberately remove one guard. They must fail the
named invariant with an actual counterexample; a parse error or tool failure is
not counted as a successful negative test:

- `UnsafeApply`: ownership changes after approval, then an unguarded apply writes.
- `UnsafeReceipt`: revision 1 applies; revision 2 is sent; the delayed revision 1 receipt incorrectly labels revision 2 Applied.
- `UnsafePair`: an offered device becomes trusted without phrase matching.
- `UnsafeProfileBinding`: approve child A, change the picker, then write child B.

## Running and evidence

Use an installed Java runtime and the official
[TLA+ tools release](https://github.com/tlaplus/tlaplus/releases). The runner does
not download dependencies. Keep the jar and generated TLC state outside the repo.

```sh
python3 docs/design/device-sync/formal/check_models.py \
  --jar /path/to/tla2tools.jar \
  --report /tmp/filtertube-formal-results.json
```

The checked-in `results-2026-10-17.json` records the executed bounded runs and
counterexample actions. TLC 2.19, Java 17 and the tool-jar SHA-256 are recorded
for reproducibility. The complete safe state spaces had no invariant failures;
all four unsafe configurations produced their intended invariant failure.

## Mapping to code and remaining review

- `managed_admin_authority.js:canActorManageProfile` supplies the adult/parent and
  ownership decisions. Sensitive unlock validity is assumed by model `Approve`.
- `nanah_managed_live_policy.js:createSendOperation` captures the source, actor
  and surface before asynchronous signing/delivery.
- `nanah_sync_adapter.js:applyIncomingEnvelope` retains an operation-local Apply
  Once binding and rechecks it through `beforeProfileWrite`.
- `nanah_sync_adapter.js:applyManagedPolicyEnvelope` rechecks receiver-local
  child ownership and accepted revision against freshly loaded profiles.
- `tab-view.js:formatNanahManagedSourceAckSyncStatus` uses current accepted
  receipt state, with production timestamp/revision matching delegated to receipt
  recording. The model's revision equality abstracts that full binding.

The review identified a saved-link snapshot held across asynchronous signature
verification. A production-handler test using real Ed25519 signatures confirmed
that removal during that wait could still apply. The extension now supplies
`loadFreshManagedValidationContext`: persisted and in-memory trust must agree,
and a synchronous check follows the last profile read. The adapter compares the
verified JWK and reruns validation against the final profiles before mutation.
`managed-policy-trust-freshness-current-behavior.test.mjs` covers removal,
revocation, scope/identity/key changes and valid delivery; the context-builder
suite covers the storage/memory intersection. Standalone adapter callers without
the optional callback retain their earlier contract and require their own live
trust source; no downstream native mirror was changed by this pass.

A fresh load/check followed by asynchronous whole-profile storage is still not a
transactional commit. TLC assumes the final check and commit are atomic. These
models and race tests do not certify cross-context storage serializability,
cryptography, transport implementation or physical-network behavior.
