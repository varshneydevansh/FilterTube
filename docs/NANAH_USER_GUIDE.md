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

### 2. Parent controls child

Use this when a parent device should update a child profile on another device.

Flow:

1. Choose `Parent controls child` on the sender.
2. Connect both devices.
3. Confirm the same safety phrase.
4. Pick the child profile in `Remote target profile`.
5. Send once.
6. Save the managed link so later sessions stay simpler.

Important:

- the first managed connection may still need one local parent approval on the child device
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

- you reconnect
- you do not rebuild trust from zero

## Do kids always need to press Allow?

No.

Current rule:

- first managed parent -> child connection may need one local parent approval on the child device
- after that, the child does **not** always need to press allow

Whether the child device stops for approval later depends on the saved managed-link policy:

- `standard parent control`
  - easier later updates
- `strict child protection`
  - more approval steps on the child device

## Do PINs get sent?

No.

PINs stay local.

Nanah may require a local unlock on the sending or receiving device, but the PIN itself is not sent across Nanah.

## Child profile rules

Current rule is profile-based, not whole-device based.

That means:

- if the active profile in the Nanah UI is a locked child profile, that surface is replica-only
- if the child profile is unlocked locally, it may send its own scoped snapshot
- child profiles are still not full admin surfaces

## Remote target profile

If you are doing parent control, use `Remote target profile`.

This lets the sender choose exactly which profile on the other device should receive the update.

That is the safe way to avoid sending to the wrong active profile.

## Backups and trusted links

Normal/plain exports do **not** include the saved Nanah trust graph.

Trusted-link recovery is only part of the encrypted full-account recovery path.

That is intentional.

## Open project

Nanah is open here:

- [https://github.com/varshneydevansh/nanah](https://github.com/varshneydevansh/nanah)
