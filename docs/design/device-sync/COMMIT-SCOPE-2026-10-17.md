# Account and sync simplification checkpoint

This checkpoint records the account/sync work separately from the later GitHub filtering issues and public Google Play messaging. Shared JavaScript, HTML, styles and catalogs were split by feature for this commit; complete working files were preserved.

## User-visible changes

- Accounts & Sync opens at device selection with one next action for the selected device. A compact radar, nearby discovery, saved-device tiles and a review/receipt tray replace competing setup entry points.
- Personal copies and parent-controlled updates retain distinct flows. Protected profiles show receiving controls; profile maintenance and connection setup remain available through disclosures.
- QR camera/image entry and short-code pairing feed the existing phrase-confirmation process. Nearby visibility is opt-in and temporary; discovery never grants trust.
- Source and receiving profiles remain explicit, including several children or parent relationships on one device. Selecting a tile alone cannot send or apply an update.
- Keyboard/D-pad focus, selection during polling, wrapping targets and reduced motion are covered in the extension. Physical mobile/tablet/TV acceptance remains separate.

## Security and correctness work included

Parent ownership and actor authority are rechecked across asynchronous edits, sends, trust changes and signed-policy application. First-send and saved-link identity, fixed receiving-profile bindings, signed-policy source snapshots, receipt identity/order and delivery feedback were corrected. Participating writers share a storage coordinator; restore preserves independently bound links instead of collapsing all profiles on one physical device.

Existing profile modes, PIN/trust requirements, QR/code pairing and manual/configured local or Internet delivery routes remain available. There is no profile-schema migration, automatic reparenting, new trust grant, native-runtime copy, store upload or publication in this checkpoint.

## Validation and limits

The staged sync-only tree was exported independently to a temporary checkout: all **666/666** integrated regression checks pass and Chrome, Firefox and Opera packages build successfully. The temporary checkout uses the installed project dependencies; issue-specific source changes were absent. Bounded TLA+ models, deliberately unsafe variants and synthetic provider/link vectors are included with their assumptions. They are not implementation refinement or cryptographic/physical-network certification.

The installed acceptance journal describes earlier isolated browser builds and synthetic profiles. `PACKAGE-PARITY-2026-10-17.json` is historical evidence for its recorded pre-commit build, which also contained later unrelated working-tree changes. Its hashes must not be treated as the identity of this split commit. Native adoption, physical-network/mobile/TV acceptance and the broad archival-audit backlog remain open.

Subsequent commits contain the public Play Store CTA, BlockTube compatibility exporter, minimum-view filter and issue-specific filtering corrections. The separate linked-issue review tracks those findings.
