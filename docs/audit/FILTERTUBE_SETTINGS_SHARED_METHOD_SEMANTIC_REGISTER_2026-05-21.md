# FilterTube Settings Shared Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/settings_shared.js` from broad UI/settings callable
accounting to a source-derived method inventory. It covers the shared
`FilterTubeSettings` helper surface that normalizes keyword/channel rows,
generates channel-derived keywords, builds compiled settings payloads, loads and
saves settings through `chrome.storage.local`, migrates V3-like state into V4
profiles during read/save paths, handles theme preference, and classifies
settings/theme storage changes.

This is not completion proof for every settings key, profile migration path,
compiled/runtime dependency, storage callback, list-mode interaction, stale
alias, Kids/Main mode, theme behavior, storage change fanout, or import/export
interaction. It is a current-behavior boundary before shared settings,
compiler, migration, storage, profile, theme, or change-detection behavior
changes.

## Source-Derived Summary

```text
source file: js/settings_shared.js
named declarations: 29
IIFE-scoped function declarations: 27
local const arrow helper declarations: 2
async function declarations: 0
public FilterTubeSettings entries: 21
semantic method groups: 9
SETTINGS_KEYS entries: 36
SETTINGS_CHANGE_KEYS effective entries: 38
STORAGE_NAMESPACE.get calls: 3
STORAGE_NAMESPACE.set calls: 5
chrome.runtime.lastError reads: 2
buildCompiledSettings calls: 4
buildProfilesV4FromLegacyState calls: 3
compileKeywords calls: 3
syncFilterAllKeywords calls: 4
Date.now calls: 7
document.documentElement.setAttribute calls: 1
addEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
querySelector calls: 0
document.createElement calls: 0
runtime behavior changed: no
```

## Method Group Counts

```text
channelNormalization: 3
compiledSettingsBuilder: 1
defensiveObjectHelpers: 2
keywordNormalizationAndCompilation: 9
profileMigrationHelpers: 2
settingsLoadAndReadPathMigration: 2
settingsSaveAndStoragePersistence: 1
storageChangeDetection: 1
themePreferenceAndChangeHelpers: 8
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `defensiveObjectHelpers` | 2 | Coerces unknown values into object/array fallback shapes for settings/profile reads and writes. | Caller-specific fallback policy, malformed profile fixtures, and mutation report for repaired data. |
| `keywordNormalizationAndCompilation` | 9 | Normalizes UI keywords, parses compiled regex patterns back into rows, preserves channel-derived keyword metadata, compiles regex patterns, and syncs Filter All channel rows into keyword rows. | Regex equivalence proof, stale alias precedence, channel-derived provenance, comments/exact parity, and false-hide negative fixtures. |
| `channelNormalization` | 3 | Normalizes string/object channel rows, collaborator metadata, filter-all comments, timestamps, and channel list arrays. | Identity confidence policy, collaborator shape proof, duplicate channel policy, and source-tier negative fixtures. |
| `profileMigrationHelpers` | 2 | Validates V4 profile containers and builds V4 profile state from legacy storage with blocklist defaults and empty whitelist rows. | V3/V4 migration matrix, list-mode preservation proof, whitelist import proof, and read-path write budget. |
| `compiledSettingsBuilder` | 1 | Builds a compiled settings payload from sanitized rows and booleans, including content/category filter objects. | Complete dependency manifest, route/mode effect report, stale alias boundary, and background/compiler parity fixtures. |
| `settingsLoadAndReadPathMigration` | 2 | Reads storage keys, overlays active V4 profile settings, normalizes rows, syncs channel-derived keywords, repairs missing V4/settings fields by writing storage, and resolves theme/auto-backup values. | Pure-read versus repair contract, storage invalidation effect report, profile revision proof, and missing-key negative fixtures. |
| `settingsSaveAndStoragePersistence` | 1 | Sanitizes incoming options, rebuilds compiled settings, writes legacy fields, writes V4 profile state when available, falls back to legacy migration when V4 is missing, and returns `{ compiledSettings, error }`. | Save result contract, rollback proof, V3/V4 write parity, category preservation proof, and concurrent caller fixtures. |
| `themePreferenceAndChangeHelpers` | 8 | Resolves theme preference from explicit storage or system media, writes theme preference, mutates the document theme attribute, and extracts theme values from storage changes. | DOM availability contract, theme storage parity, system preference fixture, and style application rollback proof. |
| `storageChangeDetection` | 1 | Classifies whether a storage change touches the exported settings/theme/auto-backup key set. | Shared dependency key authority, background/bridge/StateManager invalidation parity, and unknown-key no-op proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 58 | `function` | `safeObject` | `defensiveObjectHelpers` |
| 62 | `function` | `safeArray` | `defensiveObjectHelpers` |
| 66 | `function` | `parsePackedChannelKeywordSource` | `keywordNormalizationAndCompilation` |
| 73 | `function` | `getSystemThemePreference` | `themePreferenceAndChangeHelpers` |
| 81 | `function` | `isStoredThemePreference` | `themePreferenceAndChangeHelpers` |
| 85 | `function` | `resolveThemePreference` | `themePreferenceAndChangeHelpers` |
| 89 | `function` | `isValidProfilesV4` | `profileMigrationHelpers` |
| 102 | `function` | `buildProfilesV4FromLegacyState` | `profileMigrationHelpers` |
| 171 | `function` | `sanitizeKeywordEntry` | `keywordNormalizationAndCompilation` |
| 204 | `function` | `normalizeKeywords` | `keywordNormalizationAndCompilation` |
| 205 | `const arrow` | `parseCompiledKeyword` | `keywordNormalizationAndCompilation` |
| 261 | `function` | `sanitizeChannelEntry` | `channelNormalization` |
| 343 | `function` | `normalizeChannels` | `channelNormalization` |
| 367 | `function` | `sanitizeChannelsList` | `channelNormalization` |
| 372 | `function` | `extractUserKeywords` | `keywordNormalizationAndCompilation` |
| 380 | `function` | `compileKeywords` | `keywordNormalizationAndCompilation` |
| 395 | `function` | `getChannelDerivedKey` | `keywordNormalizationAndCompilation` |
| 401 | `function` | `getChannelKeywordWord` | `keywordNormalizationAndCompilation` |
| 412 | `function` | `syncFilterAllKeywords` | `keywordNormalizationAndCompilation` |
| 484 | `function` | `buildCompiledSettings` | `compiledSettingsBuilder` |
| 564 | `function` | `loadSettings` | `settingsLoadAndReadPathMigration` |
| 595 | `const arrow` | `readBool` | `settingsLoadAndReadPathMigration` |
| 742 | `function` | `saveSettings` | `settingsSaveAndStoragePersistence` |
| 1121 | `function` | `applyThemePreference` | `themePreferenceAndChangeHelpers` |
| 1129 | `function` | `getThemePreference` | `themePreferenceAndChangeHelpers` |
| 1137 | `function` | `setThemePreference` | `themePreferenceAndChangeHelpers` |
| 1144 | `function` | `isSettingsChange` | `storageChangeDetection` |
| 1148 | `function` | `isThemeChange` | `themePreferenceAndChangeHelpers` |
| 1152 | `function` | `getThemeFromChange` | `themePreferenceAndChangeHelpers` |

## Current Public API

```text
STORAGE_KEYS
THEME_KEY
AUTO_BACKUP_KEY
normalizeKeywords
normalizeChannels
compileKeywords
extractUserKeywords
syncFilterAllKeywords
getChannelDerivedKey
getChannelKeywordWord
buildCompiledSettings
loadSettings
saveSettings
applyThemePreference
getSystemThemePreference
resolveThemePreference
getThemePreference
setThemePreference
isSettingsChange
isThemeChange
getThemeFromChange
```

## Current Settings Key Surface

`SETTINGS_KEYS` currently lists 36 storage keys and `SETTINGS_CHANGE_KEYS`
adds `ftThemePreference` and `ftAutoBackupEnabled`. The exported key surface is
used for shared settings change classification, but it is not a complete
runtime dependency manifest for background compilation, content/category
filters, exact-match state, learned identity maps, V4 profiles, or bridge/state
reload decisions.

## Current Behavior Boundaries

- `loadSettings()` calls `STORAGE_NAMESPACE.get()` for the exported settings
  keys plus theme, auto-backup, V3 profiles, and V4 profiles. It overlays active
  V4 profile rows/settings when present, then normalizes Main keyword/channel
  rows and syncs Filter All channel-derived keywords.
- `loadSettings()` can write `ftProfilesV4` while reading when V4 profiles are
  missing or when the active profile is missing effective settings fields.
- `buildProfilesV4FromLegacyState()` creates Main and Kids modes as
  `blocklist` and initializes whitelist arrays empty.
- `saveSettings()` calls `STORAGE_NAMESPACE.get()` for V4/V3 profiles,
  sanitizes incoming rows, calls `buildCompiledSettings()`, writes legacy
  compiled fields, updates V4 active profile state when possible, and falls back
  to `buildProfilesV4FromLegacyState()` when V4 is absent.
- `saveSettings()` returns a `{ compiledSettings, error }` object from storage
  callbacks, but it does not own background cache revision, broadcast fanout, or
  rollback semantics.
- `compileKeywords()` escapes keyword text and emits Unicode-boundary exact
  regex patterns with `iu` flags or substring patterns with `i` flags.
- `syncFilterAllKeywords()` treats channels with `filterAll` as channel-derived
  keywords, preserves existing channel keyword order when possible, and sorts
  the resulting keyword rows by `addedAt` descending.
- Theme helpers resolve explicit `dark`/`light` values or system preference,
  write `ftThemePreference`, and apply `data-theme` directly to
  `document.documentElement` when a document exists.
- `isSettingsChange()` only checks the exported settings/theme/auto-backup key
  set and therefore cannot prove complete runtime invalidation coverage by
  itself.

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
callerUi
profileType
profileId
listModeInput
storageKeysRead
storageKeysWritten
settingsChangeKeys
legacyInputShape
v4InputShape
readPathWriteEffect
savePathWriteEffect
compiledSettingsEffect
keywordRegexEffect
channelDerivedKeywordEffect
contentFilterEffect
categoryFilterEffect
themeDomEffect
storageErrorPolicy
revisionPolicy
backgroundCacheEffect
bridgeRefreshEffect
stateManagerReloadEffect
migrationModePolicy
whitelistPreservationPolicy
positiveFixture
negativeModeFixture
negativeStorageFixture
negativeProfileFixture
negativeAliasFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `settingsSharedMethodAuthority`
- `settingsSharedStorageDependencyManifest`
- `settingsSharedProfileMigrationReport`
- `settingsSharedReadPathWriteBudget`
- `settingsSharedSaveResultContract`
- `settingsSharedCompiledSettingsReport`
- `settingsSharedThemePreferenceContract`
- `settingsSharedChangeDetectionContract`

These are future contract names. This register does not authorize settings
schema changes, storage dependency changes, compiler changes, migration changes,
theme behavior changes, profile write changes, list-mode changes, alias cleanup,
or runtime invalidation changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this method semantic register can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
