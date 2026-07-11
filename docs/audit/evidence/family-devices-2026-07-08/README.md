# Family Devices Evidence - 2026-07-08

This folder stores manual evidence for
`FILTERTUBE_XENDER_STYLE_FAMILY_DEVICE_MAP_PLAN_2026-07-07.md`.

## Artifacts

| File | Source | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `viewport-desktop-wide.chrome-macos.png` | User-provided installed dashboard screenshot from the active Chrome extension dashboard. Image size: 2616 x 2024. SHA-256: `f9c0bdaebf1b44433fbe1c1595855ec455c6993ed58d130e82740c5607e8f663`. | The wide Accounts & Sync `Family Devices` map renders as a visible parent-facing surface without obvious card clipping, primary-control overlap, or hidden map actions. | Does not prove redacted map snapshot fields, live pairing, safety-phrase verification, saved trust, Home Pickup, Internet Pickup, protected-user restrictions, or two-device delivery. |
| `map-no-protected-profile.chrome-macos.png` | User-provided installed dashboard screenshot from the active Chrome extension dashboard. Image size: 2616 x 2024. SHA-256: `f9c0bdaebf1b44433fbe1c1595855ec455c6993ed58d130e82740c5607e8f663`. | The no-protected-profile Family Devices state visually asks the parent to create one protected profile before pairing or sending. | Does not prove the redacted map snapshot fields needed for the JSON packet. The `map-no-protected-profile` row still needs copied/downloaded evidence JSON before it can pass. |

## Pending Capture

`map-no-protected-profile.chrome-macos.json` is intentionally not present yet.
To complete that row, open Accounts & Sync and use either evidence action:

- Click `Download evidence`, then rename or move the downloaded JSON to
  a temporary filename such as `raw-map-no-protected-profile.chrome-macos.json`,
  then wrap it into the packet format with the helper below.
- Or click `Copy evidence`, paste the clipboard into that filename, and verify
  the pasted JSON uses `filtertube_family_devices_manual_evidence`.

The dashboard may download evidence with a timestamped name such as
`raw-map-no-protected-profile-2026-07-08T12-00-00-000Z.json`. Keep that file or
rename it to the stable raw filename above before running the packet helper.
The downloaded JSON includes a non-private `suggestedCaseId` only to reduce
manual filing mistakes.

If you used `Copy evidence`, the importer can read the clipboard directly on
macOS and create the raw JSON plus packet in one step:

```bash
npm run audit:family-devices:import -- \
  --clipboard \
  --browser "Chrome / macOS" \
  --os "macOS" \
  --version "3.3.5"
```

If a matching visual artifact already exists in this folder, the importer
attaches it automatically. The matching filename must be exact for the case and
runtime, for example `map-no-protected-profile.chrome-macos.png` or
`map-no-protected-profile.chrome-macos.mp4`. It does not guess across browsers
or operating systems.

Use `--force` only if replacing a raw evidence file is intentional.

The easiest path after clicking `Download evidence` is to import the latest
downloaded raw map evidence from `~/Downloads`, create the packet, and validate
that the referenced screenshot exists:

```bash
npm run audit:family-devices:import -- \
  --browser "Chrome / macOS" \
  --os "macOS" \
  --version "3.3.5"
```

The importer only copies the downloaded JSON into this folder, wraps it with the
manual packet metadata, and runs the validator. It does not edit the Manual
Evidence Log or mark a row pass.

Create the packet from a raw downloaded/copied snapshot:

```bash
node scripts/create-family-device-evidence-packet.mjs \
  --case map-no-protected-profile \
  --evidence docs/audit/evidence/family-devices-2026-07-08/raw-map-no-protected-profile.chrome-macos.json \
  --screenshot docs/audit/evidence/family-devices-2026-07-08/viewport-desktop-wide.chrome-macos.png \
  --out docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.json \
  --browser "Chrome / macOS" \
  --os "macOS" \
  --version "3.3.5" \
  --profile "parent/master" \
  --expected "Family Devices asks the parent to create one protected profile before pairing or sending." \
  --actual "Installed dashboard matched the expected state." \
  --result pending
```

If the downloaded JSON includes `suggestedCaseId`, the helper can infer the
standard case text and output paths:

```bash
node scripts/create-family-device-evidence-packet.mjs \
  --evidence docs/audit/evidence/family-devices-2026-07-08/raw-map-no-protected-profile.chrome-macos.json \
  --browser "Chrome / macOS" \
  --os "macOS" \
  --version "3.3.5"
```

Validate the packet before marking the row complete. Full packets must include
non-empty browser, OS, extension version, profile mode, case id, expected,
actual, and result fields:

```bash
node scripts/validate-family-device-evidence.mjs \
  docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.json
```

Validate every JSON packet in this evidence folder and require referenced
screenshots or videos to exist:

```bash
node scripts/validate-family-device-evidence.mjs --require-artifacts \
  docs/audit/evidence/family-devices-2026-07-08
```

The validator accepts either the raw `Copy evidence` JSON for a quick privacy
check or a full manual packet with `copiedMapEvidence`. Only the full packet is
enough for a Manual Evidence Log row.

For full packets, the validator also checks that the packet filename and
`screenshotPath` filename start with the same `caseId`. Viewport-only packets
can omit copied map evidence because they prove layout. Static boundary packets
can use `N/A` for `screenshotPath` only when the case is
`release-copy-boundary` or `commit-boundary-extension-ui-docs`.

Summarize the current Phase 11 manual evidence status:

```bash
npm run audit:family-devices:phase11
```

Generate a chronological capture checklist for the minimum release evidence set:

```bash
npm run audit:family-devices:checklist -- \
  --out docs/audit/evidence/family-devices-2026-07-08/capture-checklist.md
```

The checklist lists each required case, setup state, expected result, current
artifact state, target file names, and the exact import commands to run after
copying or downloading redacted evidence from the installed dashboard.

Print the next missing minimum row and the packet command to use after capture:

```bash
npm run audit:family-devices:phase11
```

Use the strict form when checking whether the minimum release evidence rows are
ready:

```bash
npm run audit:family-devices:phase11:strict
```

After a packet is reviewed and its `result` is intentionally set to `pass`,
update exactly one Manual Evidence Log row with:

```bash
npm run audit:family-devices:log -- \
  --packet docs/audit/evidence/family-devices-2026-07-08/map-no-protected-profile.chrome-macos.json
```

Use `--dry-run` first if you want to preview the replacement row. The helper
validates the packet with referenced artifacts before editing the audit file and
refuses to mark a non-`pass` packet as complete.

For viewport-only rows, use the same helper with an explicit visual artifact:

```bash
npm run audit:family-devices:log -- \
  --case viewport-mobile \
  --visual docs/audit/evidence/family-devices-2026-07-08/viewport-mobile.chrome-macos.png \
  --browser 'Chrome / macOS' \
  --os macOS \
  --dry-run
```

The visual-only path is limited to viewport rows and refuses missing files or
filenames that do not start with the row's case id.

The import command also prints the next commands after it creates a packet. If
the packet is still `pending`, review the visual artifact and redacted JSON
first, then deliberately change `result` to `pass`. If the packet was created
with `--result pass`, run the printed `--dry-run` command before letting the log
helper edit the audit table.

Summarize the richer Xender-style discovery/map checklist separately. This
does not replace Phase 11 installed evidence; it only reports what remains in
the future Phase 12 discovery slice:

```bash
npm run audit:family-devices:phase12
```

Check the current Home Pickup provider boundary. This static audit proves that
the extension has an explicit configured provider surface for verified saved
links, while automatic unpaired LAN discovery remains outside the current
release claim:

```bash
npm run audit:family-devices:provider
```

Run the aggregate release-readiness gate when preparing a release decision:

```bash
npm run audit:family-devices:release
```

That command runs the strict Phase 11 installed-evidence gate, the strict Phase
12 discovery/map/tap-flow checklist, and the Home Pickup provider boundary
audit. It is expected to fail until the minimum installed evidence rows are
captured and the remaining Phase 12 rows are intentionally signed off.

The strict command is expected to fail until the minimum rows in the audit file
are captured, have the required artifact files, and are marked `pass`.
Map/protected rows need both visual evidence and copied JSON packet evidence.
`viewport-mobile` needs visual evidence. The no-provider/no-rule performance
proof is checked as a static Phase 11 item.

## Privacy Boundary

Evidence in this folder must not include:

- parent, child, or master PIN values
- profile ids or trusted-link ids
- raw channel, keyword, or whitelist payloads
- signing keys, private keys, or provider tokens
- raw managed policy payloads

Use redacted copied snapshots for map-state evidence and screenshots only for
viewport/layout evidence.
