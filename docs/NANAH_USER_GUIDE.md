# Nanah Device Trust & Sync — user guide

Updated 26 October 2026. This guide describes the current extension candidate. Store releases and native apps can have different capabilities; the [acceptance checklist](NANAH_MANAGED_LINK_QA.md) records what still needs installed-device testing.

## Connect once, then choose what to share

Nanah is FilterTube's encrypted peer-to-peer (P2P) device-sharing layer. There is no central FilterTube account holding your readable profile settings. A signaling service helps the devices meet; the live settings transfer uses their verified WebRTC connection.

Start with one of these tasks:

| Your task | Use |
| --- | --- |
| Copy the profile open here to another device once | **Copy once / This profile**; the receiver reviews the proposal. |
| Keep your own account profiles up to date | An explicitly approved **personal Auto-sync link**, with settings/rules, saved Notes, or both selected. |
| Update a child's protected profile | An approved **parent connection**, with manual Send update or opted-in parent Auto-sync. |
| Migrate or recover the wider account tree | The separate **Full account** flow and its required local authority; not automatic profile sync. |

Auto-sync is off by default. A verified device and a profile-sync permission are different things: saving trust does not silently enroll every profile or data area.

## Add and verify a device

1. Open **Accounts & Sync** on both devices. Use compatible builds and the intended profiles. Unlock the account locally when asked.
2. On one device, choose **Add with code or QR**, then **Start Pairing**.
3. On the other, enter the displayed **four-character code** and choose **Join Session**, or use **Scan QR / Read QR image**. Codes use Nanah's safe alphanumeric alphabet; they are not necessarily four digits.
4. Compare the **same safety phrase on both screens**. Confirm it before trusting or sharing.
5. Review the local profile, receiving profile/device and proposed action. Confirm only the intended relationship and scopes.

QR scanning fills the code; joining and phrase verification remain separate steps. Camera frames and local PNG/JPEG/WebP QR images are decoded locally. Closing the scanner, hiding the tab or leaving the page stops camera use. Manual entry remains available for devices without cameras, including future TV clients.

The pairing drawer follows **Connect → waiting → verify → share/sync**. Advanced connection help stays collapsed. The device map puts a saved or discovered recipient and its next action first; focus stays stable during background refreshes. Rings indicate a bounded search, not physical distance.

### Find nearby

On the receiving computer, choose **Receive nearby**; on the other, **Find nearby**. These are bounded visibility/search windows, not permanent broadcasting. The optional helper must be running on both computers on the same network:

```bash
npm run managed:nearby
```

Being on the same Wi-Fi alone does not make browser extensions discover each other. A nearby device must still pair and match the safety phrase. Nearby visibility, saved trust and online connection state are separate.

## Your own devices: copy or Auto-sync

**Copy once** sends the currently open profile for receiver review. Switch profiles to copy a different one. It does not enable Auto-sync or parent control.

For Auto-sync:

1. Open the intended account profile on each device and complete verified pairing.
2. Under **Your other devices**, choose **Settings and filter rules**, **Saved video notes**, or both.
3. Choose **Link this profile**. Approve the exact profile/device mapping at **both endpoints**.
4. Make a small change and check the receiver's actual data and status, not just the sender's queue.

Both clients must support the personal Auto-sync protocol. An older trusted-device record alone is not that permission. Personal setup requires active, unlocked account profiles; protected child profiles cannot use this route to publish settings or obtain administration rights.

Settings use the supported field list, not a full-account import. PINs, profile ownership, trust permissions, viewing grants and managed time-policy authority stay local. Settings conflicts show **Needs review**; review the versions before choosing **Keep this device** or **Use other device**. A stale review is rejected instead of overwriting a newer change.

Saved Notes are bound to a profile and exact video ID. Temporary drafts and writer credentials are not sent. Concurrent edits and deletions retain conflict information for review in Notes; there is no silent wall-clock winner.

## Parents: update the intended child profile

One family can have multiple parents, children and profiles on each device. Choose the actual source rules profile and receiving child; names are labels, not automatic identity mapping.

1. In the parent account, use the child's **Edit Rules** action. The editing banner names that child while the parent remains active.
2. On the receiving device, open or create the intended protected profile. Use its receive flow to join the parent's pairing session.
3. Verify the phrase and review both profile/device labels. The receiving parent/caregiver approves the initial managed relationship.
4. Send an approved protected update. **Apply Once** is separate from saving a parent link for future matching updates.
5. To enable parent Auto-sync, choose the verified child connection and explicitly **Turn on Auto-sync** with fresh parent authorization.

Automatic parent dispatch also needs the receiver's saved auto-apply permission and readiness for that exact confirmed session. Enabling it on the sender does not change receiver permissions. **Standard parent control** permits easier later updates under its saved policy; **Strict child protection** requires the stricter reconnect/local approval policy.

Approved managed scopes include Main rule lists/mode, Kids-owned rules/mode and supported Kids filter groups, plus viewing access and normalized time limits **only when those separate scopes were approved**. Current managed grants do not cover every general child preference toggle, Main filter group or child Notes. Existing grants are not silently expanded. Personal sharing is not a workaround for child restrictions.

A child's switching PIN can open receive-only sync; it cannot unlock parent settings, backups, profile administration or trusted-link policy. Parent/Master unlocks are separate and temporary. Protect parent accounts too, and lock the admin session after editing. Profile protection is not device-wide management: an unmanaged browser/device owner can still disable or uninstall the extension.

Daily time usage is per profile and installation. Sending a time-limit policy does not pool usage into one household-wide allowance.

## Send to a saved device

Choose the verified recipient tile, then **Send update**. **Rules from** selects the local rules profile; it does not change the fixed receiving profile or trust relationship. A review names the source, recipient and available delivery route before sending.

The recipient picker uses a verified live connection first, then configured healthy Home Pickup, then Internet Pickup. If no route is available, reconnect with a fresh pairing code. A saved tile does not prove that the device is online.

For an ordinary personal saved device, **Connect device** establishes a fresh session. Copy once and personal Auto-sync remain separate choices.

This resembles selecting a recipient in a sharing app, but **it is not an open torrent swarm**. Updates are not seeded to unrelated peers.

## Offline, reconnect and conflict states

**The browser cannot deliver directly to a device that is offline.** Direct Auto-sync needs **both Accounts & Sync pages open and connected**. Offline changes remain in a bounded local queue and resume after an authorized verified connection is re-established.

Refresh or closing the page ends the live session; saved trust, permitted links and queued changes persist. Reconnect/pair again as required, matching the phrase and any saved approval policy. Merely restoring Wi-Fi or opening a browser does not automatically rendezvous saved peers. Background alarms can ask an existing dashboard to check eligible work; they do not create a hidden transport or wake a closed browser.

| State | Meaning |
| --- | --- |
| **Off** | This Auto-sync enrollment is not enabled. |
| **Waiting for device / confirmation** | Connection, reciprocal setup or receiver readiness is still needed. |
| **Paused** | Profile, authority, permission, storage or connection conditions need attention. |
| **Needs review** | A conflict or invalid/oversized update needs a deliberate decision. |
| **Up to date** | The current exchange has completed under its protocol; verify received contents during testing. |

Queued, sent, received and applied are different stages. Parent-policy delivery receipts retain their existing trust model; they are not newly signed receiver attestations. Turning Auto-sync off removes its matching local enrollment and pending work, not changes already applied on another device.

## Connection services and optional pickup

| Path | What the service can see | Limit |
| --- | --- | --- |
| **Direct Nanah** | Signaling/STUN services handle connection setup metadata. Payloads use the encrypted peer connection. | Current extension has STUN, no configured TURN relay. Restrictive NAT/firewalls can prevent connection. |
| **Home Pickup** | The explicitly configured trusted home/school service receives signed policy contents and must be trusted with them. | This is not automatic Wi-Fi discovery or an encrypted-at-rest mailbox guarantee. |
| **Internet Pickup** | It stores only an encrypted, signed envelope for an already approved parent/child route. Connection/delivery metadata can remain visible. | The provider cannot read the rules, choose a profile, grant itself trust, or apply the update. The receiver must collect and validate it. |

Pickup is separately configured for approved parent updates. It is not the delivery path for personal settings/Notes Auto-sync, and does not guarantee background delivery whenever a device goes online.

For a separately configured pickup provider:

```bash
FILTERTUBE_PROVIDER_HOST=0.0.0.0 \
FILTERTUBE_PROVIDER_STORE=.filtertube/managed-delivery-store.json \
npm run managed:provider
```

Home Pickup uses your trusted LAN endpoint, such as `http://<computer-lan-ip>:8787/filtertube`. Internet Pickup requires your own trusted HTTPS setup and the relevant authorization/configuration; starting the local command alone does not establish a secure public service. The `/filtertube` status page omits rule contents, PINs, keys and profile policy.

[Public signaling service](https://nanah-signaling.varshney-devansh614.workers.dev/) · [Signaling privacy](https://nanah-signaling.varshney-devansh614.workers.dev/privacy) · [Nanah project](https://github.com/varshneydevansh/nanah)

## Unlinking, backup and recovery

- PINs stay local; a required local unlock does not send the PIN across Nanah.
- Normal/plain exports exclude the saved trust graph. Trusted-link recovery belongs to the explicit encrypted full-account recovery path; do not casually clone one device's identity to another.
- Private extension Notes, Auto-sync grants/keys and pending queues are not ordinary backup payloads. A notes-bearing native app backup is not an interchangeable extension restore.
- Removing trust, changing keys/scope/ownership or revoking consent invalidates affected pending work. Unlink/re-pair does not revive old Auto-sync consent.
- A failed link removal reports a storage error. The open page blocks that link, but saved permission may remain after reload until removal succeeds. Retry before treating removal as permanent.
- After successful link removal, reload before fresh pairing. Legacy links with mismatched endpoint identities require explicit removal on both devices, reload and re-pair. Other profiles and working links remain separate.

## Current verification and troubleshooting

If a change does not arrive, check the profile mapping, matching phrase, both open/connected pages, reciprocal consent, selected data area and receiver permissions. Read **Needs review** rather than repeatedly sending. Use **Check now** when eligible and the collapsed connection/support controls for redacted evidence; do not share PINs, keys or private Notes.

Automated two-endpoint tests and isolated real WebRTC fixtures exercise settings, rules, Notes, offline reconstruction, conflicts, persistence failures and revocation. They are not two installed devices. Installed two-Chrome-profile pairing and offline reconnect are still open, along with physical LAN/separate-network and native interoperability acceptance. Android development has related adoption work; older app/TV builds are not assumed compatible.

- [Auto-sync scope, implementation and evidence](design/device-sync/AUTO-SYNC-2026-10-24.md)
- [Installed acceptance checklist](NANAH_MANAGED_LINK_QA.md)
- [Profiles and PIN model](PROFILES_PIN_MODEL.md)
- [Current concerns and remaining work](NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md)
