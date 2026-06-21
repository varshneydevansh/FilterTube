# Nanah User Guide

## What Nanah is

Nanah lets you move FilterTube settings directly between your own devices.

Think of it like this:

- both devices meet at a small relay
- they confirm the same safety phrase
- then the real settings are meant to move directly from device to device

FilterTube does **not** need a central sync account to read your settings.

## The easiest way to think about it

There are only three normal ways to use Nanah:

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

1. Choose `Parent controls protected profile` on the sender.
2. Connect both devices.
3. Confirm the same safety phrase.
4. Pick the protected profile in `Remote target profile`.
5. Send once.
6. Save the parent control link so later sessions stay simpler.

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

If you want to inspect the public relay endpoint yourself, open:

- [https://nanah-signaling.varshney-devansh614.workers.dev/](https://nanah-signaling.varshney-devansh614.workers.dev/)
- [https://nanah-signaling.varshney-devansh614.workers.dev/privacy](https://nanah-signaling.varshney-devansh614.workers.dev/privacy)

## What FilterTube does not need

FilterTube does not need:

- a central sync account
- a cloud copy of your Nanah settings
- a server in the middle reading your lists

The goal is device-to-device transfer, not account-based data collection.

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

Use the protected profile row in Accounts & Sync:

- `Edit Main Rules` changes that protected profile's Main YouTube rules
- `Edit Kids Rules` changes that protected profile's YouTube Kids rules

This lets teenagers, younger kids, or other protected users keep their own profile identity while the parent/caregiver keeps control over the rule list and policy.

## Backups and trusted links

Normal/plain exports do **not** include the saved Nanah trust graph.

Trusted-link recovery is only part of the encrypted full-account recovery path.

That is intentional.

## Open project

Nanah is open here:

- [https://github.com/varshneydevansh/nanah](https://github.com/varshneydevansh/nanah)
