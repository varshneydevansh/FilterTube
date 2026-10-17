# Nanah User Guide

## What Nanah is

Nanah lets you move FilterTube settings directly between your own devices.

Think of it like this:

- both devices meet at a small relay
- they confirm the same safety phrase
- then the real settings are meant to move directly from device to device

FilterTube does **not** need a central sync account to read your settings.

## The easiest way to think about it

There are three things you can move, and three safe delivery paths.

### 1. Send this profile once

Use this when you just want to copy settings one time.

Example:

- Chrome laptop -> Edge laptop
- laptop -> phone

Flow:

1. Start pairing on one device.
2. Join from the other device.
3. Confirm the same safety phrase.
4. Send once.
5. The other device reviews and applies it.

### 2. Parent controls protected profile

Use this when a parent/caregiver device should update a protected profile on another verified device.

Flow:

1. On the parent device, open **Accounts & Sync** and choose the child's
   **Edit Rules**. The editing banner names the local child and approving parent.
2. On the receiving device, create or open the intended protected child profile.
   Its receive page offers **Enter parent code**. Your own adult profiles can
   still use **Copy once** separately.
3. Start pairing on the parent device. Enter its code or scan its QR on the
   receiving device, then confirm the same safety phrase on both screens.
4. Review which local rules profile will update which receiving profile/device.
   An explicit remote target can select another permitted receiving child.
5. Use the separate **Send Protected Update** action.
6. On the receiving device, authorize **Apply Once**, or **Apply + Save Parent
   Link** to permit future matching updates under the reviewed permissions.

Important:

- the first managed connection may still need one local parent/caregiver approval on the protected device
- after that, later updates can be easier depending on the saved policy

### 3. Move full account

Use this only when you want the wider account tree.

Examples:

- reinstall recovery
- moving to a new browser
- full migration

This is broader than normal profile sync.

## What the relay does

The relay is only the meeting place.

It helps both devices:

- find each other
- exchange connection setup data

It is **not** meant to be where your FilterTube settings live.

After the secure handshake, the real settings payload is meant to move directly between your devices.

## Send to a saved device

Open **Account & sync**. Devices appears first, above Profiles and Security.

1. Choose a saved device tile. The tile shows its bound profile and trust state.
2. Press **Send update**. Choose which local profile’s rules to use if this device
   has not been linked to a local rules profile yet. Review both profile names
   and the delivery route.
3. Confirm the update. FilterTube targets that device link and profile only.

**Rules from** on the selected device lets you change the local rules profile.
The verified receiving profile stays fixed; choosing rules never changes that
trust relationship. Local and receiving profiles may have different IDs.

The picker chooses one available route: a verified live connection first, then
configured Home Pickup, then Internet Pickup. A service whose last health check
failed is skipped. The review names the route before sending. A saved device is
not necessarily online; if no route is available, reconnect it with a fresh code.
Pickup means the device must collect the update. Its receipt reports whether
the update was applied or rejected; the receipt is not a separate cryptographic
signature from the receiving device.

For your own saved device, **Connect device** opens a fresh pairing session.
Personal sharing copies the currently open profile once; it does not enable
continuous background sync or create parent control.

This is similar to choosing a recipient in a file-sharing app, but it is not an open torrent swarm. FilterTube never treats network visibility as permission, and it never sends one device's update to unrelated peers.

The browser cannot deliver directly to a device that is offline. Internet Pickup therefore stores only an encrypted, signed envelope until the already-verified device checks in. The provider cannot read the rules, choose a profile, grant itself trust, or apply the update.

If you want to inspect the public relay endpoint yourself, open:

- [https://nanah-signaling.varshney-devansh614.workers.dev/](https://nanah-signaling.varshney-devansh614.workers.dev/)
- [https://nanah-signaling.varshney-devansh614.workers.dev/privacy](https://nanah-signaling.varshney-devansh614.workers.dev/privacy)

## Add a device

- **Add with code or QR** opens the pairing controls. Use the four-character code
  on the receiving device, or choose **Scan QR** to read the sender’s QR with a
  camera. **Read QR image** accepts a local PNG, JPEG, or WebP screenshot.
- The QR reader fills the pairing code; choose **Join Session** to connect. Images
  and camera frames are decoded locally. Closing the scanner, leaving the page,
  or hiding the tab stops camera use. Manual code entry remains available for TVs
  and devices without a camera.
- **Find nearby** searches for two minutes. On the other device, choose **Receive nearby**, which makes it visible for three minutes. Nearby selection
  needs the optional FilterTube helper running on both computers on the same
  network. Being on the same Wi-Fi alone does not make extension devices appear.
- A nearby device must still pair and show the same safety phrase. Saved devices
  appear separately from nearby results; helper availability never proves that
  a saved device is currently on the network.

**Connection options and help** contains transport and support details. The
rings animate only during a bounded search, respect reduced motion, and do not
represent physical distance. Device buttons support touch, Tab, and directional
keys. Selecting a device moves focus to its next action; Escape returns to the
device tile. Background polling never moves focus into the review.

## Profiles in a family

One device can contain several profiles, and a family can have several parents
and children. Choose both the local rules profile and the receiving profile in
the device review. Two profiles on one device remain separate recipients.

**Switch** opens a profile. **Edit Rules** lets an authorized parent edit a child
while staying in the parent account. **Profile options** keeps viewing access,
time limits, PINs, history, rename and deletion available. Saving here changes
this device; sending an update is a separate action.

A parent can rename or delete their own child profile after approval. An account
with children cannot be deleted until those dependencies are resolved. Deleting
a local profile does not delete other devices or their saved profiles.

Set the Master PIN and protect each parent account if children should not be
able to select those accounts freely. A child's switching PIN alone does not
protect a PIN-free parent. This pass keeps the existing optional PIN policy.

## What FilterTube does not need

For live device-to-device transfer, FilterTube does not need:

- a central sync account
- a readable cloud copy of your Nanah settings
- a server in the middle reading your lists

The goal is device-to-device transfer, with encrypted store-and-forward only when a verified device must collect an update later.

## What trust means

Trust does **not** mean:

- hidden background sync
- always-on streaming
- your devices stay permanently connected

Trust means:

- remember this relationship
- remember the allowed scope
- remember the target and apply policy
- make the next live session easier

## What happens after refresh

Refreshing the page ends the live session.

That is normal.

What stays saved:

- trusted links
- saved policy
- saved device identity

What does not stay alive:

- the current live connection

So after refresh:

- you start a new session
- you do not rebuild trust from zero

## Do kids always need to press Allow?

No.

Current rule:

- first managed parent -> protected-profile connection may need one local parent/caregiver approval on the protected device
- after that, the protected user does **not** always need to press allow

Whether the protected device stops for approval later depends on the saved managed-link policy:

- `standard parent control`
  - easier later updates
- `strict child protection`
  - more approval steps on the protected device

## Do PINs get sent?

No.

PINs stay local.

Nanah may require a local unlock on the sending or receiving device, but the PIN itself is not sent across Nanah.

## Protected profile rules

Current rule is profile-based, not whole-device based.

That means:

- if the active profile in the Nanah UI is a protected profile, that surface is receive-only
- the protected-profile PIN can open receive-only Accounts & Sync for that protected profile
- the protected-profile PIN does not unlock Dashboard, Filters, Kids Mode editing, Settings, backups, trusted-link policy, or profile management
- parent/account PIN controls rule edits, sync policy, backups, and viewing-space policy
- protected profiles are not full admin surfaces

## Remote target profile

If you are doing parent control, use `Remote target profile`.

This lets the sender choose exactly which profile on the other device should receive the update.

That is the safe way to avoid sending to the wrong active profile.

## Profile + device labels

During a live session, FilterTube shows each side as profile plus device.

Example:

- `pushkal (account profile, locked) • Pixel Tablet`
- `pussy (protected profile) • Family iPad`

This is only display context. The editable device label remains just the device name, but the status area shows the active profile too so you can verify the target before sending or applying settings.

## Parent-managed protected-profile rules

Parents and caregivers should edit protected-profile rules from the parent/account surface.

Use **Edit Rules** on the protected profile row in Accounts & Sync. A Kids-only
profile opens its Kids rules; profiles with Main access open their Main rules.
The editing banner keeps that child as the target while the parent remains
active. **Profile options** contains the other maintenance controls.

This lets teenagers, younger kids, or other protected users keep their own profile identity while the parent/caregiver keeps control over the rule list and policy.

## Backups and trusted links

Normal/plain exports do **not** include the saved Nanah trust graph.

Trusted-link recovery is only part of the encrypted full-account recovery path.

That is intentional.

If saving or removing a device link fails, FilterTube reports the storage error
rather than confirming success. A failed removal blocks that link in the open
page, but its saved permission can remain after reload until removal succeeds.
Retry the removal before treating it as permanent.

After successfully removing a link, reload the page before pairing that device
again. Older links whose two ends saved different identities require explicit
removal on both devices, then reload and fresh pairing. Other profiles and
working saved links are retained.

## What nearby and verified mean (current behavior)

The device map may show a nearby FilterTube device, but nearby only means that
the device can be discovered or invited. It does not authorize a settings
transfer.

For a parent-managed update, FilterTube also checks:

- the saved trusted device link;
- the intended protected profile on that device;
- the signed revision and revocation state; and
- the delivery receipt from the native/runtime owner.

The same target binding is retained for an update collected later through Home
Pickup or Internet Pickup. Internet Pickup stores an encrypted signed envelope
whose rules the provider cannot read. Home Pickup sends the signed rules to
your configured home service, so that service must be trusted with their
contents. Neither service can choose a receiving profile or grant itself trust.

If a source/build note says that managed delivery is synchronized, that means
the policy was accepted by the intended runtime boundary. It does not by itself
prove that two installed devices completed a live transfer; that still needs a
device-level smoke test.

## Open project

Nanah is open here:

- [https://github.com/varshneydevansh/nanah](https://github.com/varshneydevansh/nanah)
