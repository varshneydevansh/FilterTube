# FilterTube Managed Sync Release Close-Out - 2026-07-02

## Purpose

This close-out records the release state for managed parent/caregiver controls,
Family Device Updates, local intranet Home Pickup, internet/later Internet
Pickup, and lazy saved-update checks after the extension-side implementation
slices. It separates release-ready extension behavior from provider, native app,
and future automatic-discovery work.

## Extension Release Verdict

Extension-owned work for the current release boundary is complete for:

- local parent/account management of protected profiles
- Main YouTube / YouTube Kids viewing-space control per protected profile
- per-profile time limits and timeout overlay enforcement
- protected action history
- live Nanah `Send Update` for verified devices open at the same time
- optional Internet Pickup through an explicitly configured HTTPS pickup service
- optional Home Pickup through an explicitly configured same-network pickup
  service
- profile-open lazy checks for saved updates when `syncOnProfileOpen` is enabled
- parent/source receipt checks for provider-delivered updates
- endpoint-permission prompts for configured pickup origins
- provider status/health feedback, waiting-update counts, receipt counts, purge,
  expiry, token access, and browser-safe provider status page
- simplified parent-facing Family Device Updates and Family Controls wording

## What Is Not Claimed

The release must not claim:

- automatic Wi-Fi/LAN peer discovery
- ambient same-network control
- a FilterTube-hosted Internet Pickup service
- guaranteed later delivery without a configured pickup provider
- provider, URL, LAN, mailbox, or discovery layer as policy authority
- complete native Android/iOS parity until the app lane proves its settings lock,
  timeout, route-gate, and pickup behavior

## User Model

Parents/caregivers should see one device map:

```text
Parent device
  -> Send Update      -> both verified devices are open now
  -> Home Pickup      -> explicit home/school/clinic pickup service
  -> Internet Pickup  -> explicit trusted HTTPS pickup service for later/away
```

The parent device chooses rules, time, and access. A protected device can only
apply a newer signed policy after it validates the saved parent link, target
profile, allowed scope, revision, payload hash, and signature. Transport only
moves unreadable ciphertext or signed candidates; it never grants control.

## Code Surface Confirmed

| Surface | Current role |
| --- | --- |
| `html/tab-view.html` | Parent-facing Family Device Updates card, one device map, Send Update, advanced pickup cards, Help copy. |
| `js/managed_parent_command_center.js` | Family Controls command center, verified-device rows, optional provider prompt, profile row actions, saved-update labels. |
| `js/tab-view.js` | Parent/admin gates, profile editing, delivery configuration, health checks, pickup permission prompts, live/provider send flows, profile-open receive checks, receipt checks, protected history. |
| `js/nanah_managed_mailbox_client.js` | HTTPS Internet Pickup configured-provider client; upload, pull, ack, purge, health; rejects plaintext and private-key fields. |
| `js/nanah_managed_local_network_client.js` | Home Pickup configured-provider client; explicit private/local HTTP or HTTPS endpoint only; publish, discover, ack, purge, health; no automatic network scan. |
| `js/nanah_managed_open_sync.js` | Lazy protected-profile open checks for configured saved-update providers. |
| `js/nanah_managed_live_policy.js` | Signed live/provider delivery, provider authorization marker, mailbox upload, Home Pickup candidate delivery, purge helpers. |
| `scripts/managed-delivery-provider.mjs` | Self-hosted reference provider for Internet Pickup and Home Pickup trials; browser status page and JSON status payload. |

## Release Boundary Against The Named Audits

| Audit / plan | Close-out |
| --- | --- |
| `FILTERTUBE_LOCAL_NETWORK_MANAGED_PARENT_CONTROLS_PLAN_2026-06-03.md` | Extension local/internet pickup is closed for explicit configured providers. Automatic LAN discovery is now recorded as a future app/provider research boundary, not a missing extension release item. |
| `FILTERTUBE_MANAGED_CONTROLS_COMPLETION_AUDIT_2026-06-21.md` | Extension-owned behavior is present; installed two-device smoke, provider ownership evidence, and native app parity remain proof lanes. |
| `FILTERTUBE_ROOT_PACKAGE_METADATA_SCRIPT_SURFACE_CURRENT_BEHAVIOR_2026-05-21.md` | Package version remains `3.3.2`; managed provider and app parity scripts are exposed; root metadata still does not itself prove native parity or hosted pickup ownership. |
| `FILTERTUBE_RELEASE_BUILD_ARTIFACT_CLAIM_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md` | Build/release script syntax is valid; release claims must still avoid hosted pickup and automatic discovery unless separate ownership/proof artifacts exist. |

## Verification Performed In This Close-Out

```bash
node --check build.js
node --check scripts/managed-delivery-provider.mjs
node --check scripts/sync-native-runtime.mjs
```

This close-out intentionally does not run the full runtime test suite. The user
asked to conserve compute and focus on feature/release completion. Manual
installed-extension smoke remains the final user-facing proof step.
