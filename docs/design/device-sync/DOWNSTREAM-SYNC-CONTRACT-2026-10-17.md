# Account & sync contract for mobile, tablet and TV

This is an extension-side integration handoff, not proof that a native client
already implements the current contract. The extension has 609 passing focused
behavior checks, installed saved-link/reconnect/repeat evidence, and phone/tablet
viewport observations. See [installed acceptance](INSTALLED-ACCEPTANCE-2026-10-17.md)
and the [remaining checklist](ACCOUNT-SYNC-CHECKLIST-2026-10-17.md).

## One ordinary journey

1. Choose a device and its receiving profile. Keep separate children and separate
   approving parents distinct, even when they share a physical device.
2. For first family pairing, open the intended child on the receiving device,
   enter the code or scan QR, and explicitly compare the safety phrase.
3. Review `local rules profile (by approving parent) → receiving profile on device`.
   Review never sends. Keep Send a separate, deliberate action.
4. First approval offers Decline, Apply Once, or Apply + Save Parent Link for a
   supported child target. Explain that saving permits future matching updates.
   Advanced permissions stay available inside a closed disclosure.
5. Later sends use that saved fixed recipient. They may update the child while
   another receiving profile is open. They must not follow the new active profile.

Personal Copy once and full-account transfer remain separate modes. Do not require
family setup to copy a user's own profile. Children can pair, receive and inspect
status; changing rules, settings, profile maintenance or trust requires fresh
authorized parent/account approval under the existing PIN policy.

## Stable identity across opposite endpoints

The four canonical fields are oriented by the sender and receiver, never by
whichever endpoint happens to be local:

| Field | Meaning |
| --- | --- |
| `sourceDeviceId` | Stable device identity of the signing parent device |
| `targetDeviceId` | Stable receiving device identity |
| `sourceProfileId` | Approving/signing parent account ID on the source device |
| `targetProfileId` | Fixed receiving child profile ID on the target device |
| `localPolicyProfileId` | Local rules source selected on the sender; not a canonical identity field |
| `localParentProfileId` | Receiver-local approving owner/grant namespace; not the remote signing parent |

Source and replica store opposite local/remote roles but agree on all four
canonical values. The parent IDs on two devices may differ. The selected local
child whose rules are sent is not substituted for the signing parent ID.

The production `buildNanahManagedSharedLinkId` algorithm in `js/tab-view.js` is:

```text
json = JSON.stringify([
  "filtertube-managed-link-v1",
  [sourceDeviceId, targetDeviceId, sourceProfileId, targetProfileId]
])
linkId = "nm1-" + base64url_without_padding(SHA256(UTF8(json)))
```

Use the normalized string IDs and exact compact JSON array order. The result is
47 ASCII characters. Do not include device labels, roles, key versions, local
rules mappings or the receiver's local owner ID. Retain full logical-tuple
collision checks; digest equality alone is not permission to overwrite a row.
This public identifier is not an authorization token. Preserve string case and
UTF-8 encoding; do not introduce locale-dependent normalization.
[Compatibility vectors](SHARED-LINK-VECTORS-2026-10-17.json) were computed by the
current production functions for both source and replica orientations. They also
distinguish two approving parents and two receiving children on shared devices.

Existing saved IDs, keys, revision assertions and receipts are preserved. Do not
silently migrate old mismatched IDs or copy receipts into a replacement link.
An incompatible old pair needs explicit owner repair/re-pairing. An older native
client is not implicitly compatible because it supports code or QR pairing.

## First-save acknowledgment and later delivery

The source records the first proposal before dispatch. A saved-link
`control_decision` must consume its matching `proposalId` once, within ten minutes,
and match the captured client/session, connected and phrase-confirmed state,
roles, paired device/profile identities, key descriptors and fresh source parent
authorization. Its saved ID must equal the canonical ID and its fixed target must
equal the reviewed receiving child. Re-read current authority after asynchronous
waits and immediately before saving. Unsolicited or stale acknowledgments cannot
create a source grant.

Receiver-local approval grants must not be supplied by a peer message. Keep
remote policy sanitization separate from local ownership/unlock grants. Adult
portable Apply Once remains supported; do not infer signed adult-management
capability from the existence of that copy path.

Signed repeats validate the saved link, both devices, remote signing parent,
fixed receiving child, allowed scope, key/signature, revision and policy hash.
Re-read current trust after verification. Unlink, revocation or changed authority
must invalidate a pending update rather than letting a captured stale row apply.

Receipts must carry the same sender/recipient device and profile identities plus
link, scope, revision and policy hash. A dispatched or queued update is not
Applied. Preserve identities through live, Home Pickup and Internet Pickup
producers, persistence, readback and restart. Hold an early live receipt until
send bookkeeping succeeds. Concurrent duplicate receipts for the same policy may
merge receipt fields; they must not overwrite committed send metadata or confirm
an older/different policy. Receipt reports are not cryptographic receiver signatures.

## Reusable presentation and focus behavior

- One saved tile may show Open now presence when exactly one verified live
  session matches its complete oriented parent/recipient identity. Keep ambiguous
  sessions and different parents/children separate. Presence never creates trust.
- Preserve the saved link's identity, source mapping and receipt state. Show one
  short visible state, with mixed per-area outcomes in review and full accessible
  labels. Background refresh must not steal focus.
- Tile activation focuses the review action. Escape returns to that exact tile.
  When a formerly separate live tile merges, use only a unique matching
  device/profile/signing-parent alias. Never resolve focus by physical device alone.
- Keep native buttons, clear focus, wrapping labels, reduced motion and adequate
  touch/D-pad targets. The web navigation helper expresses an interaction contract;
  native TV controls should preserve that behavior through their own focus system.

## Integration and acceptance gates

Before native parity is claimed, run the vectors in the native implementation,
exercise first save through the real acknowledgment handoff, then signed repeat,
reconnect, receiver profile switching, two parents, two receiving profiles on one
device, rejection/replay, and unlink/revocation while an update is pending. Verify
stored child contents and unrelated parent/sibling data after restart. Test actual
camera denial, mobile controls and TV D-pad/Back independently of web viewports.

Nearby discovery requires the optional helper and explicit temporary visibility;
it is not automatic Wi-Fi enumeration. Current WebRTC config uses STUN without
TURN, so universal NAT/firewall reachability is not established. Home Pickup
exposes signed rule contents to the configured trusted home service; Internet
Pickup uses an encrypted signed envelope. Each path needs real network acceptance.

Participating extension trust, device identity, signing writes and whole IO
imports now share the exclusive origin-scoped Web Lock
`filtertube-nanah-trusted-storage-v1`, through `js/nanah_storage_lock.js`.
Both dashboard and popup load it before IO. Explicit live ownership tokens let
nested signing operations reuse that lock; missing support rejects before writes.
Checked storage reads happen inside the critical section. Production two-page
regressions cover overlapping removal/adds and identity/key provisioning; whole
import rollback cannot race those participating writers. This is not general
storage compare-and-swap: unrelated profile/background writers, other origins,
older open code and native transactions are outside the guarantee.
Native IO integrations must supply an equivalent transaction/coordination
boundary; copying the updated IO without its coordinator is unsupported. See
CROSS-WINDOW-STORAGE-REVIEW-2026-10-17.md. Recovery now preserves distinct
parent/child link IDs and rejects conflicting same-ID bindings before mutation.
Do not run runtime-mirror synchronization
or replace an installed native candidate without coordinating its checkout and
generated-asset ownership.

On this handoff's inventory check, `adb devices -l` exposed only the Android TV
emulator `emulator-5554`, with `com.filtertube.tv` installed. The active chat
**Complete FilterTube Android TV** was using that emulator and a separate native
worktree. No native files, installed app or emulator UI were changed by this chat.
No physical Android device was exposed by that inventory; this is not a claim
about all hardware the user may have elsewhere.

Independent read-only review found no factual mismatch in this handoff and reran all three vectors through the current production functions in both orientations. Exact JSON, 47-character IDs and the recorded source-section hash matched. That check did not execute a native client, modify the emulator or establish network interoperability.
