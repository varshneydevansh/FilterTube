# Connect a device: the app's page in the extension (pass 4, 2026-11-17)

Android source: `SettingsSectionActivity.kt` on `feature/android-3.6.2-study` — `renderSync` (the phone's
"Connect a device" category is `addNearbyDevicesCard()` then `addNanahSyncCard()`), `addNearbyDevicesCard`,
`renderNearbyPeers`, `addNanahSyncCard`, `createNanahSetupPanel`, `createNanahModeSwitch`,
`createNanahActionsRow`, `createNanahStatusPanel`, `createNanahJoinPanel`, `createNanahFlowRow`,
`createNanahPrinciplesBlock`; phases from `NativeNanahPairingPresentation` (CONNECT, VERIFY, SHARE);
strings in `strings.xml` and `strings_settings_sync_ui.xml`. The app's comment calls its Connect step
"the upstream extension's simplified Connect step": the app's page grew from an earlier version of this
extension's pairing card, and the extension later wrapped that card in a device map.

## How the states were driven

- Android (`emulator-5582`): idle; "Sync over the internet?" consent; a join of a code no device hosts
  ("ZZZZ"), which reaches the relay, shows the code's QR, waits, then fails with `session_not_found` and
  the red "Error" session panel; End Session back to idle. No pairing was completed: a second device
  would have had to join a live session. The safety-phrase and paired states on Android are described
  from `createNanahStatusPanel` (the phrase row and "Confirm Matching Phrase" in VERIFY; Send/Save Trust in
  SHARE), not captured.
- Extension (headless Chromium test profile): the page's real pairing code ran against a **stub**
  `FilterTubeNanah.NanahClient` and a stub `FilterTubeNanahAdapter.hostSessionWhenReady` installed in the
  page (`tools: connect.mjs`). The stub emits the same `stage`, `sas`, `connected` and `error` events the
  real client does; nothing reached the live relay. Internet-sync consent was pre-set in the test
  profile. The linked-devices list was seeded with two trusted links in `ftNanahTrustedLinks`.

## Captures

| State | Android | Extension before | Extension after |
| --- | --- | --- | --- |
| Idle (page top) | `android-conn-idle-top.jpg`, `android-conn-idle-mid.jpg` | `before-sync-page.jpg` | `after-1-idle.jpg` |
| Join, steps, notes | `android-conn-idle-join.jpg`, `android-conn-idle-notes.jpg` | `before-sync-page.jpg` | `after-1-idle.jpg` |
| Consent | `android-conn-consent.jpg` | (same dialog, unchanged) | — |
| Code / QR shown, waiting | `android-conn-waiting.jpg` | — | `after-2-code-shown-waiting.jpg` |
| Safety phrase | (source) | — | `after-3-safety-phrase.jpg`, `after-3b-confirm-phrase-dialog.jpg` |
| Paired, verified | (source) | — | `after-4-paired-verified.jpg` |
| Error | `android-conn-join-error.jpg`, `android-conn-after-error-b.jpg` | — | `after-5-error.jpg` |
| Linked devices | (none on the emulator) | — | `after-6-linked-devices.jpg` |

## What changed (presentation and order only)

The pairing protocol, the safety-phrase check, trust, sending and every handler are unchanged; all
element IDs stay, so the controller binds as before.

The card now reads in the app's order:

1. **Connect a device** (the card's title, was "My Devices & Family").
2. **Your devices**: the app's line on what tapping does, the relay disclosure, the device list (each
   saved device with its kind and state), then the nearby buttons. The extension's nearby needs its
   optional desktop helper, so its two buttons (Receive nearby, Find nearby) and the helper note sit
   where the app has Send to nearby device and Connect by address.
3. The pairing card, **always open** (was a closed "Connect a device" disclosure): **Profile update /
   Choose the update** with *Review first*, the three update kinds, Start Pairing, and the **Session
   state** panel with its *Secure handshake* pill (both headings were hidden by the old progression
   styles). The panel turns rose on an error, as the app's turns red.
4. **Join another device / Enter pairing code** (the join panel's heading, shown while connecting, as
   the app's), with the code field, Join Session and the QR buttons moved into it; while a code is
   hosted it shows the pairing link and QR.
5. **Step 1 Pair · Step 2 Verify · Step 3 Send**, then **Privacy and trust notes** (What the relay sees,
   What trust means), from the app.
6. **Keep in sync** (the extension's peer-to-peer auto-sync), moved below the pairing card, where the
   app's "Keep in sync" category follows "Connect a device".

Mascot moments kept: Kriti thinking while the other device is on its way (no motion, never on the
phrase check); the error toast with Uljhan.

21 strings from the app in all 38 locales (`sync.connect.title`, `sync.devices.*`, `sync.join.*`,
`sync.step.*`, `sync.notes.*`); no string names the video site.

## Removed

- The device map: the radar rings, the "This device" hub, the map heading ("Choose your other
  device…"), the compass rule line and the selected-device "Next step" preview (their IDs remain in the
  page, hidden, for the controller).
- "Add with code or QR" as the page's first action (hidden; Start Pairing in the always-open card is the
  app's entry). A child profile's "Enter parent code" goes the same way: the join panel is always there.
- The closed "Connect a device" disclosure and its summary.
- Static copy that only the old layout used (nine fragments, dropped from all 38 static catalogs).

## Still different

- Order inside the pairing card: the app puts Advanced above Start Pairing; the extension keeps its
  "More options" below the session panel.
- The device label is a field on the app's Connect step; the extension keeps it in a small disclosure.
- "Advanced connection options" (Internet Pickup, Home Pickup, support evidence) stays as the
  extension's own section under the device list; the app keeps pickup in its Advanced card.
- The app splits Accounts & Sync into categories (Accounts, Connect a device, Keep in sync, Profiles,
  PIN & security); the extension keeps them as sections of one page, in that order.
