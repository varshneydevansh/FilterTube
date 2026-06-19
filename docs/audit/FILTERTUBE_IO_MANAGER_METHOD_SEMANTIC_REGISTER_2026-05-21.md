# FilterTube IO Manager Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/io_manager.js` from broad import/export and backup
callable accounting to a source-derived method inventory. It covers the shared
`FilterTubeIO` helper surface that serializes FilterTube v3 backups, translates
legacy BlockTube data, migrates and sanitizes V4 profile state, verifies PIN
guards, encrypts/decrypts backup containers, restores optional Nanah trusted
state, writes storage, creates downloads through the runtime downloads API, and
schedules automatic backups.

This is not completion proof for every import strategy, profile migration path,
PIN/auth mode, legacy-to-V4 mapping, Nanah trust restore, backup download
lifecycle, stale alias preservation, list-mode transfer, storage error path,
runtime downloads cleanup, backup rotation, or import/export UI interaction. It
is a current-behavior boundary before IO, backup, profile migration, encryption,
download, storage, Nanah restore, or import/export behavior changes.

## Source-Derived Summary

```text
source file: js/io_manager.js
line count: 2111
named declarations: 56
IIFE-scoped function declarations: 50
plain function declarations: 34
async function declarations: 16
local const arrow helper declarations: 6
public FilterTubeIO entries: 11
semantic method groups: 12
storage key constants: 4
readStorage occurrences: 5
writeStorage occurrences: 8
STORAGE_NAMESPACE.get calls: 1
STORAGE_NAMESPACE.set calls: 1
chrome.runtime.lastError reads: 1
runtimeAPI.downloads.download calls: 2
downloadWithRuntimeApi occurrences: 3
runtimeAPI.downloads.search calls: 1
runtimeAPI.downloads.erase calls: 2
URL.createObjectURL calls: 2
URL.revokeObjectURL calls: 1
Blob constructor calls: 2
setTimeout calls: 2
clearTimeout calls: 1
setInterval calls: 0
addEventListener calls: 0
querySelector calls: 0
document.createElement calls: 0
FilterTubeSettings references: 5
FilterTubeSecurity references: 3
runtime behavior changed: no
```

## Method Group Counts

```text
autoBackupDownloadRotation: 6
downloadRuntimeHelpers: 3
encryptedAndNanahState: 3
exportSerialization: 2
importFormatParsing: 3
importMergeAndPersistence: 1
keywordChannelNormalization: 10
legacyProfileDerivationAndV3Persistence: 5
primitiveDefensiveHelpers: 9
profileScopeAndSecurity: 4
profilesV4MigrationAndSanitization: 8
storageAccessWrappers: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `primitiveDefensiveHelpers` | 9 | Supplies timestamp, object/array/string/bool/number/integer/list-mode coercion used by import, export, profile, time-limit, and backup flows. | Caller-specific fallback policy, malformed input fixtures, and proof that fallback defaults do not widen hide/leak state. |
| `downloadRuntimeHelpers` | 3 | Wraps Chrome/Firefox download APIs, normalizes callback/promise results, and schedules blob URL revocation. | Download lifecycle budget, blob cleanup proof, Firefox/Chrome parity, and failure-path user notification contract. |
| `keywordChannelNormalization` | 10 | Sanitizes keyword/channel rows, parses channel-derived keyword sources, dedupes imports, preserves collaboration metadata, mirrors Main blocklist aliases, and merges string/video/subscription lists. | Duplicate policy, channel identity confidence, collaboration fixture proof, stale alias interaction, and false-hide negative fixtures. |
| `profileScopeAndSecurity` | 4 | Resolves full versus active export/import scope and checks local or incoming master PIN verifiers through `FilterTubeSecurity`. | Scope permission contract, PIN retry/error policy, active child profile fixture, and auth bypass negative tests. |
| `legacyProfileDerivationAndV3Persistence` | 5 | Derives V3 profile snapshots from V4 active profiles and reads/writes `ftProfilesV3` through storage wrappers. | V3/V4 parity matrix, list-mode transfer proof, whitelist preservation proof, and legacy write rollback policy. |
| `storageAccessWrappers` | 2 | Wraps `chrome.storage.local.get/set`, swallows read exceptions, and reports write callback errors. | Storage error taxonomy, retry/rollback policy, browser API parity, and revision-aware write authority. |
| `profilesV4MigrationAndSanitization` | 8 | Validates V4 containers, migrates missing V4 from legacy storage, repairs profile type/parent metadata, sanitizes Main/Kids profile rows, and preserves only valid managed time-limit policy payloads. | Profile graph invariant proof, child/parent negative fixtures, time-limit malformed payload fixtures, read-path write budget, and import merge/replace parity. |
| `importFormatParsing` | 3 | Detects FilterTube v3 versus BlockTube input, translates BlockTube arrays, and normalizes incoming V3/V4 backup payloads. | Unsupported-format fixtures, comments/exact legacy policy, raw payload provenance, and renderer/runtime parity proof. |
| `exportSerialization` | 2 | Builds v3 export JSON and scopes full/profile exports from current settings plus V3/V4 profile state. | Export schema manifest, active profile proof, sensitive field policy, and stale alias exclusion/inclusion contract. |
| `importMergeAndPersistence` | 1 | Applies merge/replace imports across visible settings, V3 profile state, V4 active/target profile state, channel maps, theme, and optional Nanah trusted state. | Atomic mutation plan, rollback policy, target profile proof, list-mode transfer proof, and cross-feature side-effect budget. |
| `encryptedAndNanahState` | 3 | Adds optional Nanah trusted state to full encrypted backups, encrypts/decrypts JSON through `FilterTubeSecurity`, and delegates decrypted import. | Encryption container schema, password error contract, Nanah restore permission policy, and trusted-link dedupe fixtures. |
| `autoBackupDownloadRotation` | 6 | Builds automatic backup payloads, probes download directory, writes JSON blobs through downloads API, rotates download records, and debounces backup scheduling. | Backup schedule authority, timer teardown, download-file deletion proof, trigger classification, rotation filesystem proof, and performance budget. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 23 | `function` | `nowTs` | `primitiveDefensiveHelpers` |
| 28 | `function` | `safeArray` | `primitiveDefensiveHelpers` |
| 32 | `function` | `parsePackedChannelKeywordSource` | `keywordChannelNormalization` |
| 40 | `function` | `safeObject` | `primitiveDefensiveHelpers` |
| 44 | `function` | `normalizeString` | `primitiveDefensiveHelpers` |
| 48 | `function` | `normalizeNonNegativeInteger` | `primitiveDefensiveHelpers` |
| 54 | `function` | `isValidManagedTimeLimitTimezone` | `primitiveDefensiveHelpers` |
| 68 | `function` | `normalizeManagedTimeLimitPolicy` | `profilesV4MigrationAndSanitization` |
| 126 | `function` | `revokeDownloadBlobUrlLater` | `downloadRuntimeHelpers` |
| 136 | `function` | `downloadWithRuntimeApi` | `downloadRuntimeHelpers` |
| 144 | `const arrow` | `finish` | `downloadRuntimeHelpers` |
| 183 | `function` | `normalizeBool` | `primitiveDefensiveHelpers` |
| 187 | `function` | `normalizeNumber` | `primitiveDefensiveHelpers` |
| 191 | `function` | `normalizeListMode` | `primitiveDefensiveHelpers` |
| 202 | `function` | `keywordKey` | `keywordChannelNormalization` |
| 214 | `function` | `sanitizeKeywordEntry` | `keywordChannelNormalization` |
| 260 | `function` | `resolveProfileScope` | `profileScopeAndSecurity` |
| 268 | `function` | `extractMasterPinVerifier` | `profileScopeAndSecurity` |
| 277 | `async function` | `verifyPinAgainstVerifier` | `profileScopeAndSecurity` |
| 285 | `async function` | `requirePinOrThrow` | `profileScopeAndSecurity` |
| 292 | `function` | `deriveProfilesV3FromV4` | `legacyProfileDerivationAndV3Persistence` |
| 301 | `const arrow` | `sanitizeChannels` | `legacyProfileDerivationAndV3Persistence` |
| 304 | `const arrow` | `sanitizeKeywords` | `legacyProfileDerivationAndV3Persistence` |
| 334 | `function` | `channelKey` | `keywordChannelNormalization` |
| 345 | `function` | `mergeChannelEntries` | `keywordChannelNormalization` |
| 399 | `function` | `sanitizeChannelEntry` | `keywordChannelNormalization` |
| 495 | `async function` | `readStorage` | `storageAccessWrappers` |
| 507 | `async function` | `writeStorage` | `storageAccessWrappers` |
| 525 | `async function` | `loadProfilesV3` | `legacyProfileDerivationAndV3Persistence` |
| 556 | `async function` | `saveProfilesV3` | `legacyProfileDerivationAndV3Persistence` |
| 563 | `function` | `isValidProfilesV4` | `profilesV4MigrationAndSanitization` |
| 576 | `function` | `buildDefaultProfilesV4FromLegacyStorage` | `profilesV4MigrationAndSanitization` |
| 647 | `async function` | `loadProfilesV4` | `profilesV4MigrationAndSanitization` |
| 706 | `async function` | `saveProfilesV4` | `profilesV4MigrationAndSanitization` |
| 713 | `function` | `sanitizeProfilesV4` | `profilesV4MigrationAndSanitization` |
| 726 | `const arrow` | `sanitizeMainKeywords` | `profilesV4MigrationAndSanitization` |
| 732 | `const arrow` | `sanitizeMainChannels` | `profilesV4MigrationAndSanitization` |
| 815 | `function` | `mergeKeywordLists` | `keywordChannelNormalization` |
| 847 | `function` | `mergeChannelLists` | `keywordChannelNormalization` |
| 870 | `function` | `normalizeMainProfileAliasFields` | `keywordChannelNormalization` |
| 889 | `function` | `mergeStringList` | `keywordChannelNormalization` |
| 907 | `function` | `detectFormat` | `importFormatParsing` |
| 923 | `function` | `parseBlockTube` | `importFormatParsing` |
| 1021 | `function` | `buildV3Export` | `exportSerialization` |
| 1115 | `function` | `normalizeNanahBackupState` | `encryptedAndNanahState` |
| 1134 | `function` | `normalizeIncomingV3` | `importFormatParsing` |
| 1235 | `async function` | `exportV3` | `exportSerialization` |
| 1330 | `async function` | `importV3` | `importMergeAndPersistence` |
| 1818 | `async function` | `exportV3Encrypted` | `encryptedAndNanahState` |
| 1848 | `async function` | `importV3Encrypted` | `encryptedAndNanahState` |
| 1871 | `async function` | `createAutoBackup` | `autoBackupDownloadRotation` |
| 1928 | `const arrow` | `safePart` | `autoBackupDownloadRotation` |
| 1964 | `async function` | `getBackupDirectory` | `autoBackupDownloadRotation` |
| 2011 | `async function` | `saveBackupFile` | `autoBackupDownloadRotation` |
| 2045 | `async function` | `rotateBackups` | `autoBackupDownloadRotation` |
| 2085 | `function` | `scheduleAutoBackup` | `autoBackupDownloadRotation` |

## Current Public API

```text
exportV3
exportV3Encrypted
importV3
importV3Encrypted
loadProfilesV3
saveProfilesV3
loadProfilesV4
saveProfilesV4
createAutoBackup
scheduleAutoBackup
rotateBackups
```

## Current Side-Effect Surface

```text
storage keys: ftProfilesV3, ftProfilesV4, ftNanahTrustedLinks, ftNanahDeviceId
storage wrappers: readStorage, writeStorage
settings API dependency: FilterTubeSettings.loadSettings, FilterTubeSettings.saveSettings, FilterTubeSettings.setThemePreference
security API dependency: FilterTubeSecurity.verifyPin, FilterTubeSecurity.encryptJson, FilterTubeSecurity.decryptJson
download API dependency: runtimeAPI.downloads.download, runtimeAPI.downloads.search, runtimeAPI.downloads.erase
timer effects: setTimeout for blob URL revocation and debounced scheduleAutoBackup
blob effects: URL.createObjectURL, URL.revokeObjectURL, Blob
profile migration effects: buildDefaultProfilesV4FromLegacyStorage, sanitizeProfilesV4, deriveProfilesV3FromV4
import persistence effects: SettingsAPI.saveSettings, saveProfilesV3, saveProfilesV4, writeStorage(channelMap), writeStorage(Nanah state)
backup persistence effects: saveBackupFile, rotateBackups, runtime downloads erase records
```

## Future Proof Fields

Each row must eventually be backed by a source line, fixture, and observed
runtime effect before an IO behavior change can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerUi
exportScope
importScope
targetProfileId
activeProfileId
strategy
authPinPolicy
localMasterPinEffect
incomingMasterPinEffect
storageKeysRead
storageKeysWritten
legacyProfileShape
v4ProfileShape
profileSanitizationEffect
settingsSaveEffect
v3WriteEffect
v4WriteEffect
channelMapWriteEffect
nanahTrustedStateEffect
encryptedPayloadEffect
downloadApiEffect
blobUrlLifecycleEffect
backupRotationEffect
backupScheduleTimerEffect
runtimeErrorPolicy
migrationModePolicy
whitelistPreservationPolicy
listModePolicy
positiveFixture
negativePinFixture
negativeFormatFixture
negativeProfileFixture
negativeDownloadFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
ioManagerMethodAuthority
ioManagerProfileMigrationReport
ioManagerImportMutationPlan
ioManagerExportScopeContract
ioManagerPinAuthContract
ioManagerEncryptedBackupContract
ioManagerNanahRestorePolicy
ioManagerDownloadLifecycleBudget
ioManagerAutoBackupScheduleAuthority
ioManagerBackupRotationReport
ioManagerStorageWriteEffectReport
ioManagerFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
