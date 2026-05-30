# FilterTube Backup Nanah Trusted State Boundary - 2026-05-22

Status: audit-only current-behavior proof. Runtime behavior is unchanged.
This is not an implementation patch, backup policy patch, Nanah sync patch,
encryption patch, profile import patch, or optimization patch.

## Scope

This slice covers the current boundary where encrypted full backups can carry
Nanah trusted-device recovery state, manual import can offer a settings-only
versus trusted-device restore choice, and `io_manager.js` can write
`ftNanahTrustedLinks` plus `ftNanahDeviceId` during full Default-profile import.

It extends the open backup/export, Nanah sync, profile/viewing-space,
security/PIN, storage/cache, settings-mode, mutation, runtime refresh,
reliability, false-hide/leak, performance, code-burden, cross-feature,
source/evidence, and implementation-change rows. It keeps the implementation
gate closed.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/io_manager.js` | 2030 | 96914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `js/tab-view.js` | 11617 | 526763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/nanah_sync_adapter.js` | 433 | 17072 | `8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824` |

## Source And Effect Blocks

Backup Nanah trusted-state source/effect blocks: 8.

| Block | Lines | Bytes | SHA-256 | Current boundary |
| --- | ---: | ---: | --- | --- |
| `js/io_manager.js` `normalizeNanahBackupState()` | 16 | 492 | `32c348752d0edd259b7927a4474ef8f90704feeda5904400e3878530efe1c730` | Accepts device id and trusted links with `remoteDeviceId`; no same-device proof is derived. |
| `js/io_manager.js` `importV3()` | 489 | 30694 | `67e6f816226c8f7ff52f45a35d7d3a07106bfe6fdc1a9f7270646d1c15b77eb0` | Imports settings/profiles and can restore Nanah state only for full Default-profile import with an auth flag. |
| `js/io_manager.js` Nanah restore write block | 36 | 1686 | `617a6985d6dc7b45accaca959b37d84331090655de4183fdec70ff0fe5a353a2` | Merges or replaces trusted links and can overwrite the stable Nanah device id. |
| `js/io_manager.js` `exportV3Encrypted()` | 31 | 1415 | `8fc1d83f05b775479fe78ba92c604d90a805149db70025262cb63c77a601186a` | Adds `nanahState` only when `includeTrustedNanahState` is true and export type is full. |
| `js/io_manager.js` `importV3Encrypted()` | 15 | 688 | `2b11d86cd824732c4f263137b735ded57474e465015f47f194e23d61e7976896` | Decrypts then calls `importV3()` without forwarding `targetProfileId`. |
| `js/tab-view.js` `runExportV3Encrypted()` | 82 | 3969 | `2747728a2eb843e610cb81b7837273591e632f23881c78b29b02c0b57b3a4e4e` | UI includes trusted Nanah state only when the active-only checkbox is off. |
| `js/tab-view.js` `runImportV3FromFile()` | 152 | 6968 | `e51c26ee4f50fbbea6b15840d6116c81b64bf41ddbbcec2e341043184b639574` | UI warns about same-device restore, recommends settings-only, and locally reloads StateManager after import. |
| `js/nanah_sync_adapter.js` portable payload/apply cluster | 93 | 3587 | `bc9c135619cfe9f1c93f66ff8a6364f3173f05c7b73e7bc3e226b63a9f4c9ed7` | Nanah full/active paths call IO export/import, while main/kids scoped payloads bypass full backup restore policy. |

## Selected Counts

- `exportV3Encrypted()` `includeTrustedNanahState` tokens: 2.
- `exportV3Encrypted()` `containsNanahTrustedState` tokens: 1.
- `exportV3Encrypted()` `NANAH_TRUSTED_LINKS_KEY` tokens: 2.
- `exportV3Encrypted()` `NANAH_DEVICE_ID_KEY` tokens: 2.
- `importV3()` `targetProfileId` tokens: 10.
- `importV3()` `restoreTrustedNanahState` tokens: 1.
- `importV3()` `incomingNanahState` tokens: 5.
- `importV3()` `SettingsAPI.saveSettings` tokens: 2.
- `importV3()` `saveProfilesV4` tokens: 1.
- `importV3()` `compiledSettingsRevision` tokens: 0.
- `importV3()` `FilterTube_ApplySettings` tokens: 0.
- Nanah restore write block `NANAH_TRUSTED_LINKS_KEY` tokens: 3.
- Nanah restore write block `NANAH_DEVICE_ID_KEY` tokens: 2.
- `importV3Encrypted()` `targetProfileId` tokens: 0.
- `runImportV3FromFile()` `showChoiceModal` tokens: 1.
- `runImportV3FromFile()` `StateManager.loadSettings` tokens: 1.
- `runImportV3FromFile()` `updateNanahUi` tokens: 1.
- Nanah adapter portable/apply cluster `targetProfileId` tokens: 3.
- Runtime trusted-state boundary fixtures: 5.

## Current Behavior

| Boundary | Current behavior | Risk before backup or sync changes |
| --- | --- | --- |
| Encrypted full export | `exportV3Encrypted()` can include `nanahState` and sets `containsNanahTrustedState` when a full backup includes trusted links. | Full encrypted backups can carry both settings and trusted-device recovery state, so backup copy and restore copy must stay separate. |
| Active/profile export | Even when the caller requests trusted Nanah state, active/profile encrypted export does not include `nanahState`. | Profile-scoped exports cannot be treated as equivalent to full account recovery. |
| Manual import prompt | Tab-view asks whether to restore trusted devices only for encrypted full backups with Nanah recovery data, Default profile, and full scope; settings-only is recommended. | The warning is UI-owned and is not a cryptographic same-device proof. |
| IO restore gate | `importV3()` writes Nanah trusted links/device id only when `auth.restoreTrustedNanahState === true`, effective scope is full, and the local target is Default. | Non-UI callers that set the flag can restore trust without the tab-view prompt unless a future shared authority exists. |
| Merge behavior | Merge mode combines existing and incoming trusted links by remote device id or link id and can overwrite the local Nanah device id with the incoming id. | Restoring on a different device can clone trust identity, exactly as the UI warning says. |
| Encrypted import helper | `importV3Encrypted()` decrypts and delegates to `importV3()` without forwarding `targetProfileId`. | Plain and encrypted helper APIs do not share one target-profile contract. |
| Nanah sync adapter | Full/active Nanah sync uses IO export/import; main/kids scoped payloads apply directly to V4 profile sections. | Scoped sync can change settings without passing through backup trusted-state restore policy or a compiled revision report. |

## Runtime Fixture Results

- Full encrypted export with `includeTrustedNanahState: true` emits `nanahState` and `meta.containsNanahTrustedState: true`.
- Active/profile encrypted export with the same option emits no `nanahState` and reports `containsNanahTrustedState: false`.
- Importing a full backup with `restoreTrustedNanahState: false` leaves existing Nanah trusted links and stable device id unchanged.
- Importing the same full backup with `restoreTrustedNanahState: true` merges trusted links and writes the incoming device id.
- Static source proof confirms `importV3Encrypted()` does not forward `targetProfileId` and product runtime source has no future trusted-state boundary symbols yet.

## Risks

- Reliability: trusted-device recovery is split across tab-view prompts, IO import/export helpers, storage writes, and Nanah adapter payload application.
- False-hide/leak: restored trust can apply future Nanah payloads to the wrong device/profile if same-device and target-profile proof are not first-class.
- Performance: import and sync can write profiles, settings, maps, and Nanah storage without a shared runtime revision or no-work report.
- Code burden: encrypted backup, plain import, full Nanah sync, scoped Nanah sync, manual UI, and storage helpers each own a different piece of the behavior.

## Future Proof Required Before Behavior Changes

Before changing encrypted backup, restore, Nanah trusted links, target-profile
import behavior, or post-import refresh behavior, add fixture-backed reports for:

```text
backupNanahTrustedStateBoundaryContract
backupNanahTrustedStateDecisionReport
backupNanahTrustedStateSameDeviceProof
backupNanahTrustedStateExportPolicy
backupNanahTrustedStateRestorePolicy
backupNanahTrustedStateProfileScopeReport
backupNanahTrustedStateTargetProfileReport
backupNanahTrustedStateStorageWriteReport
backupNanahTrustedStatePostImportRevision
backupNanahTrustedStateFixtureProvenance
backupNanahTrustedStateMetricArtifact
nanahTrustedRecoveryAuthority
```

No `backupNanahTrustedStateBoundaryContract`,
`backupNanahTrustedStateDecisionReport`,
`backupNanahTrustedStateSameDeviceProof`,
`backupNanahTrustedStateExportPolicy`,
`backupNanahTrustedStateRestorePolicy`,
`backupNanahTrustedStateProfileScopeReport`,
`backupNanahTrustedStateTargetProfileReport`,
`backupNanahTrustedStateStorageWriteReport`,
`backupNanahTrustedStatePostImportRevision`,
`backupNanahTrustedStateFixtureProvenance`,
`backupNanahTrustedStateMetricArtifact`, or
`nanahTrustedRecoveryAuthority` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
