# Family Devices Minimum Evidence Capture Checklist

Generated: 2026-07-10T11:49:02.432Z
Evidence folder: `docs/audit/evidence/family-devices-2026-07-08`
Runtime label: `chrome-macos`

Use this list for the minimum release evidence set. Do not mark a row pass until the visual artifact and copied evidence agree.

## Fast Path

Capture in this order. Stop and fix the UI before continuing if a screenshot shows clipped text, tiny tap targets, confusing authority copy, or a protected profile seeing parent-only controls.

| Order | Case | Need | Why it matters |
| --- | --- | --- | --- |
| 1 | `map-no-protected-profile` | json | My Devices & Family offers personal profile sync without a PIN. Choosing Sync My Devices opens code/QR pairing from any location and the optional configured nearby-device picker; family control stays separate. |
| 2 | `map-one-protected-profile` | visual, json | Family Devices shows one protected profile and asks the parent to pair a protected device. |
| 3 | `map-nearby-discovery-active` | visual, json | Family Devices shows Looking nearby, Stop finding, and an unpaired row whose only next action is Pair nearby device. |
| 4 | `map-nearby-pairing-gated` | visual, json | The short code reaches the protected device, both devices show a safety phrase, and no trust or settings are sent before phrase confirmation. |
| 5 | `map-verified-live-session` | visual, json | Family Devices shows a verified live pairing session only after the safety phrase is matched. |
| 6 | `map-trusted-device-saved` | visual, json | Family Devices shows a saved trusted device without treating it as a live connection. |
| 7 | `protected-receive-only-surface` | visual, json | Protected Accounts & Sync is receive-only and does not expose parent trust or send-update controls. |
| 8 | `protected-child-pin-not-admin` | visual, json | A child profile PIN can switch into the protected profile but cannot unlock parent/admin controls. |
| 9 | `viewport-mobile` | visual | Family Devices remains readable and usable at mobile or narrow width without clipped map actions. |

Current minimum evidence status: 0/9 cases complete.

Next missing case:

- `map-no-protected-profile`: json

Capture the configured Home Bridge opt-in nearby picker when that claim is part of the release. Do not treat it as zero-setup LAN scanning. Native mDNS/local-broadcast discovery, hosted FilterTube Pickup, and native app parity remain future or downstream slices.

## Before Capture

```bash
mkdir -p docs/audit/evidence/family-devices-2026-07-08
npm run audit:family-devices:phase11
```

## 1. No protected profile

- Case ID: `map-no-protected-profile`
- Profile: parent/master
- Setup: Open Accounts & Sync with no protected child/user profile created.
- Expected: My Devices & Family offers personal profile sync without a PIN. Choosing Sync My Devices opens code/QR pairing from any location and the optional configured nearby-device picker; family control stays separate.
- Current artifacts: visual=yes, json=no, valid pass json=no
- Missing: json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-no-protected-profile.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-no-protected-profile.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 2. One protected profile

- Case ID: `map-one-protected-profile`
- Profile: parent/master
- Setup: Create one protected profile and return to Accounts & Sync.
- Expected: Family Devices shows one protected profile and asks the parent to pair a protected device.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-one-protected-profile.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-one-protected-profile.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-one-protected-profile.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-one-protected-profile.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 3. Nearby search is active

- Case ID: `map-nearby-discovery-active`
- Profile: parent/master
- Setup: Configure Home Bridge, create a protected profile, press Find nearby, and let the other device appear.
- Expected: Family Devices shows Looking nearby, Stop finding, and an unpaired row whose only next action is Pair nearby device.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-nearby-discovery-active.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-nearby-discovery-active.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-nearby-discovery-active.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-nearby-discovery-active.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 4. Nearby pairing stays gated

- Case ID: `map-nearby-pairing-gated`
- Profile: parent/master + protected device
- Setup: Select the unpaired nearby row and start pairing, but do not confirm the safety phrase yet.
- Expected: The short code reaches the protected device, both devices show a safety phrase, and no trust or settings are sent before phrase confirmation.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-nearby-pairing-gated.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-nearby-pairing-gated.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-nearby-pairing-gated.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-nearby-pairing-gated.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 5. Verified live session

- Case ID: `map-verified-live-session`
- Profile: parent/master
- Setup: Pair two devices and confirm the matching safety phrase, without saving trust yet.
- Expected: Family Devices shows a verified live pairing session only after the safety phrase is matched.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-verified-live-session.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-verified-live-session.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-verified-live-session.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-verified-live-session.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 6. Saved trusted device

- Case ID: `map-trusted-device-saved`
- Profile: parent/master
- Setup: Save parent trust for the protected device, then return to the Family Devices map.
- Expected: Family Devices shows a saved trusted device without treating it as a live connection.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/map-trusted-device-saved.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-map-trusted-device-saved.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/map-trusted-device-saved.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `map-trusted-device-saved.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 7. Protected receive-only surface

- Case ID: `protected-receive-only-surface`
- Profile: protected child
- Setup: Switch into the protected profile and open Accounts & Sync.
- Expected: Protected Accounts & Sync is receive-only and does not expose parent trust or send-update controls.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/protected-receive-only-surface.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-protected-receive-only-surface.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/protected-receive-only-surface.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `protected-receive-only-surface.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 8. Child PIN is not admin

- Case ID: `protected-child-pin-not-admin`
- Profile: protected child
- Setup: Unlock only with the child profile PIN, then try to access parent/admin controls.
- Expected: A child profile PIN can switch into the protected profile but cannot unlock parent/admin controls.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual, json

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/protected-child-pin-not-admin.chrome-macos.png
docs/audit/evidence/family-devices-2026-07-08/raw-protected-child-pin-not-admin.chrome-macos.json
docs/audit/evidence/family-devices-2026-07-08/protected-child-pin-not-admin.chrome-macos.json
```

After clicking Copy evidence in the installed dashboard:

If `protected-child-pin-not-admin.chrome-macos.png` already exists, the importer attaches it automatically. Otherwise save the screenshot/video first or pass `--screenshot` explicitly.

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

After clicking Download evidence instead:

```bash
npm run audit:family-devices:import -- \
  --browser 'Chrome / macOS' \
  --os macOS \
  --version 3.3.5
```

## 9. Mobile or narrow viewport

- Case ID: `viewport-mobile`
- Profile: parent/master
- Setup: Resize the installed dashboard to a mobile/narrow viewport on Accounts & Sync.
- Expected: Family Devices remains readable and usable at mobile or narrow width without clipped map actions.
- Current artifacts: visual=no, json=no, valid pass json=no
- Missing: visual

Capture target files:

```text
docs/audit/evidence/family-devices-2026-07-08/viewport-mobile.chrome-macos.png
```

Viewport-only case: copied JSON is optional. Save the screenshot, review it, then preview the Manual Evidence Log update:

```bash
npm run audit:family-devices:log -- \
  --case viewport-mobile \
  --visual docs/audit/evidence/family-devices-2026-07-08/viewport-mobile.chrome-macos.png \
  --browser 'Chrome / macOS' \
  --os macOS \
  --dry-run
```

If the preview row is correct, run the same command without `--dry-run`.

## Final Gate

```bash
npm run audit:family-devices:release
```
