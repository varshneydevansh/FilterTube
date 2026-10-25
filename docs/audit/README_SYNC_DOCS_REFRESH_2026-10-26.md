# README and Nanah documentation refresh

## Request and scope

The user requested a less cluttered project README, equal visibility for the app,
current features instead of repeated version highlights, screenshots and updated
Nanah device-trust/Auto-sync guidance. They specifically asked to explain easy
parent control, child switching PINs without child management permission, and
parent edits from a separate machine with deliberate P2P/verified Auto-sync.
This is documentation work; no extension, website or native runtime source changed.

## What changed and why

| File | Change | Reason |
| --- | --- | --- |
| README.md | Android and browser install choices, platform status, Android screenshots and expandable extension/iPhone galleries; current feature table, parent workflow and concise Nanah section. | Present the full project and common tasks before implementation history. |
| docs/NANAH_USER_GUIDE.md | Task-based connect/copy/personal Auto-sync/parent update flow; reconnect, conflicts, permissions, backup and pickup boundaries. | Replace fragmented answers and stale one-time-only wording with usable current instructions. |
| docs/NANAH_POST_IMPLEMENTATION_CONCERNS_TRACKER.md | Current implementation-versus-acceptance matrix; superseded no-blockers conclusion, trust/Auto-sync and target-mapping corrections. | Code presence is not installed-device or release approval. |
| docs/NANAH_P2P_PROJECT_PLAN.md | Current checkpoint and links before historical proposals; Main/Kids rule spaces distinguished from child profiles; measured network limits. | Stop older planning language being mistaken for current product behavior. |
| docs/NANAH_MANAGED_LINK_QA.md | Explicit open installed status plus personal/managed Auto-sync acceptance matrix. | Tests must inspect receiver storage, authority, conflicts and reconnect; reload is not pairing. |
| docs/design/device-sync/AUTO-SYNC-2026-10-24.md | Dated documentation checkpoint qualifying later native adoption evidence and pickup confidentiality. | Preserve the original test history while correcting stale blanket Android status. |

The README changes from 459 to 185 lines. Four version-specific highlight blocks,
line-count/repository-size badges, duplicate install/build instructions and long
implementation walkthroughs were removed. History remains in CHANGELOG.md;
the extension's packaged What's New UI was not removed. A dynamic latest-release
badge/link is separate from the labelled extension source-version badge.

## Screenshots reused from the website

No image was generated, edited or duplicated. Existing repository assets are
linked directly from website/public/apps/screenshots/:

- Android: android-player-settings.png, android-music-player.png,
  android-notes-editor.png. These are installed development-build captures;
  the empty editor does not demonstrate save/sync success.
- Extension: extension-dashboard.png and extension-accounts-sync.png.
  These are current-source previews, not a store-version guarantee.
- iPhone: ios-launcher.png and ios-filters.png. These are existing simulator UI
  previews, not current playback/iPad parity or public release proof. The native
  crash/acceptance work is not closed by displaying them.

The previews were visually inspected. All forty-eight local links and image
references resolve, and all eight images including the project icon have valid
PNG dimensions. The secondary galleries are collapsed so screenshots do not
replace the feature guide with a long image wall.

## Data, authority and availability corrections

- A child switching PIN permits entry, not parent settings/trust administration.
  Parents edit the named child from their own account and pair with the intended
  receiving child/device. Parent accounts also need their own protection.
- Saved trust is separate from explicit Auto-sync consent. Personal links need
  reciprocal adult/account approval and chosen settings/rules/Notes areas;
  managed updates retain approved parent scopes. General child preferences and
  child Notes are not silently added to managed grants.
- Direct sync needs both Accounts & Sync pages open and connected. Offline work
  waits locally for verified reconnect; Wi-Fi online, alarms and saving trust do
  not create automatic peer rendezvous or closed-browser delivery.
- Signaling/STUN setup is separate from encrypted live payload transfer. Current
  transport has no configured TURN; restrictive NAT/firewalls can prevent it.
- Home Pickup trusts the configured service with signed rule contents. Internet
  Pickup stores encrypted signed envelopes. Neither is personal Auto-sync's
  transport or a central readable profile vault. Receipts and application differ.
- Newer Android development adoption is recorded separately from Play release
  availability and actual extension-to-app interoperability. iOS/TV status stays
  qualified. Local-file playback is separate from online offline-save work;
  local ML remains research.

Code reviewed includes the Auto-sync UI/queue, Nanah WebRTC configuration,
managed local-network/mailbox clients and ordinary backup private-key exclusions.
Existing extension feature inventories and Android/TV owner replies supply the
platform descriptions. A Qwen helper response was truncated and rejected; a
completed GPT-OSS 120B outline/pitfall review was advisory. Its broad server/data
phrasing was not adopted; actual delivery boundaries determine the documentation.

## Verification

Chrome, Firefox and Opera packages were rebuilt because README.md is a common
packaged file. Release prompting was skipped in the non-interactive build. The
current source/staged/archive check passes; no package was installed or uploaded.
README fingerprint and changed presentation assertions were refreshed while
preserving scoped identity/privacy checks. The exact wording registry now has
101 occurrences after removing the README's old ownership phrase.

- Release lane: 742 passed, zero failed.
- Smoke lane: 1,482 passed, zero failed.
- Existing sync/Notes/preference-reset scope checks: 144 passed, zero failed.
- Targeted documentation checks: 48 passed and five failed, matching the exact
  five failing test titles recorded before editing. The pre-existing broad
  public-doc fingerprint/token/source inventory and identity-claim audit failures
  remain unresolved. Matching names does not prove matching assertion coverage
  inside those already failing tests; they were not waived or marked complete.
- No fresh installed device, physical-network, native-app or store acceptance ran.

[Compact validation receipt](artifacts/readme-sync-docs-2026-10-26/validation.json).
Nothing was pushed, published, submitted or deployed.
