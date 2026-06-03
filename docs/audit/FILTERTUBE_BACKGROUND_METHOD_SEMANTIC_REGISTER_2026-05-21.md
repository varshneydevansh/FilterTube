# FilterTube Background Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/background.js` from representative method tokens and
message action rows to a source-derived top-level method inventory. It
complements
`docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md`:
the action register covers the two `runtime.onMessage` routers and their 31
action/type branches, while this register covers the file-level helper,
storage, backup, resolver, compiler, migration, and mutation methods those
branches call.

This is not completion proof for every inline listener callback, local helper,
timer callback, promise continuation, storage callback, or message action in
`js/background.js`. It is a current-behavior boundary for the background
service-worker method surface.

## Executable Current-Behavior Probes

The companion runtime test executes current source slices from
`js/background.js` without changing product code. Those probes currently pin:

- `sendMessageToTabQuietly()` ignores missing tab ids and suppresses the known
  "Receiving end does not exist" error while still sending a refresh payload for
  a real tab id.
- `buildAutoBackupPayload()` exports only the active V4 profile when the active
  profile is not `default`, carries the active profile name, honors V4 list-mode
  and whitelist arrays, and takes `syncKidsToMain` from active V4 settings.
- `isTrustedUiSender()` accepts the extension URL prefix returned by
  `browserAPI.runtime.getURL('')` and rejects a YouTube sender plus a missing
  sender.
- `mergeImportedWhitelistChannels()` merges a subscription-import duplicate by
  handle, updates weak persisted display metadata, preserves the existing
  source, and avoids adding a duplicate row.
- `syncStoredMainKeywordsWithChannels()` rewrites packed channel-derived
  keywords, removes stale channel keywords, preserves manual/primitive
  keywords, and appends active filter-all channel keywords with comment scope.
- `extractCustomUrlFromPath()` normalizes `/c/...` and `/user/...` paths from
  full or relative URLs and ignores watch URLs.

## Source-Derived Summary

```text
source file: js/background.js
source split lines: 6344
source wc -l: 6343
source bytes: 286370
source sha256: ce17fee7a80398be91f89e286ef0dea8c85deff0b4363729d79a957c9989cd36
broad lexical callable matches: 442
top-level function declarations: 76
plain function declarations: 63
async function declarations: 13
accepted top-level method rows: 76
semantic method rows promoted: 76
control-flow lexical artifacts: 300 (`if`: 285, `for`: 10, `while`: 3, `catch`: 2)
local/helper/listener/timer callbacks held outside this top-level register: 66
semantic method groups: 12
covered by separate action register: 31 runtime message action/type branches
executable current-behavior probes: 6
runtime behavior changed: no
```

## Method Group Counts

```text
backupDownloadAndScheduling: 7
defensiveHelpersAndMessaging: 6
identityResolverNetwork: 12
learnedIdentityMapCaches: 15
migrationAndVersioning: 4
postBlockEnrichmentAndChannelKeywords: 5
profileBackupExportState: 3
profileCompileAndStorage: 4
releaseNotesAndRuntimeInfo: 4
ruleMutationAndChannelPersistence: 2
securitySessionAndPin: 3
subscriptionImportAndSenderNormalization: 11
```

## Semantic Group Summary

| Semantic group | Top-level functions | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `defensiveHelpersAndMessaging` | 6 | Shared coercion helpers, quiet tab message dispatch, wall-clock timestamp helper, and production debug-log gate. | Caller class, failure handling, tab-broadcast budget, debug-mode authority, and message delivery proof. |
| `profileBackupExportState` | 3 | V4 profile validation, auto-backup payload construction, and backup state hydration from storage. | Export schema authority, profile selection, sensitive field policy, and release/native parity proof. |
| `subscriptionImportAndSenderNormalization` | 11 | UI sender check, subscription import samples, handle/name normalization, imported whitelist normalization, and merge policy. | Trusted sender, import provenance, duplicate identity policy, list-mode target, and rollback proof. |
| `securitySessionAndPin` | 3 | PIN verifier extraction, session authorization checks, and session PIN cache writes. | Lock/session authority, profile target, expiry, replay, failed-attempt, and import/Nanah mutation proof. |
| `backupDownloadAndScheduling` | 7 | Browser download wrapping, blob URL cleanup, rotation bookkeeping, auto-backup creation, backup debounce, and post-block enrichment wait. | Trigger actor, delay clamp, dedupe key, encryption/session policy, filesystem deletion proof, and rate-limit proof. |
| `migrationAndVersioning` | 4 | Semver comparison plus quick-block and keyword-comment migrations. | Migration idempotence, profile scope, storage revision, rollback, and legacy alias proof. |
| `postBlockEnrichmentAndChannelKeywords` | 5 | Delayed post-block enrichment and channel-derived keyword synchronization. | Resolver reason, network/fetch budget, keyword provenance, comment-scope policy, and stale-channel cleanup proof. |
| `profileCompileAndStorage` | 4 | Kids URL detection, V4 profile construction, storage reads, and compiled settings/cache construction. | Background-owned revision, profile/list-mode source, stale cache rejection, no-work proof, and storage-key authority. |
| `learnedIdentityMapCaches` | 15 | Channel, video-channel, and video-metadata cache hydration, batching, caps, flush timers, and compiled-cache patching. | Map-write provenance, cap/eviction policy, storage revision, stale identity policy, and no-rule map budget. |
| `releaseNotesAndRuntimeInfo` | 4 | Release notes payload loading, runtime label reporting, and first-run prompt injection-error filtering. | Release artifact freshness, prompt actor, version target, duplicate prompt, and public-claim boundary proof. |
| `identityResolverNetwork` | 12 | Shorts/watch/Kids identity handlers, session/pending caches, stored identity merge, HTML preview parsing, credentialed network fallback, and channel page fetch. | Resolver trigger, credentials policy, route/profile/list-mode reason, fetch budget, cache provenance, and negative sender proof. |
| `ruleMutationAndChannelPersistence` | 2 | Channel add/upsert and Filter All mutation paths that write profile state, channel maps, caches, backups, and tab refreshes. | Mutation contract, trusted actor, target list/profile, identity confidence, backup reason, refresh authority, and rollback proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 32 | `function` | `safeArray` | `defensiveHelpersAndMessaging` |
| 36 | `function` | `safeObject` | `defensiveHelpersAndMessaging` |
| 40 | `function` | `normalizeString` | `defensiveHelpersAndMessaging` |
| 44 | `function` | `sendMessageToTabQuietly` | `defensiveHelpersAndMessaging` |
| 57 | `function` | `nowTs` | `defensiveHelpersAndMessaging` |
| 61 | `function` | `isValidProfilesV4` | `profileBackupExportState` |
| 74 | `function` | `buildAutoBackupPayload` | `profileBackupExportState` |
| 222 | `function` | `readAutoBackupState` | `profileBackupExportState` |
| 369 | `function` | `isTrustedUiSender` | `subscriptionImportAndSenderNormalization` |
| 381 | `function` | `buildSubscriptionsImportLogSample` | `subscriptionImportAndSenderNormalization` |
| 392 | `function` | `getSubscriptionsImportTrackedMatches` | `subscriptionImportAndSenderNormalization` |
| 431 | `function` | `isHandleLike` | `subscriptionImportAndSenderNormalization` |
| 435 | `function` | `normalizeHandleForStorage` | `subscriptionImportAndSenderNormalization` |
| 442 | `function` | `isProbablyNotChannelName` | `subscriptionImportAndSenderNormalization` |
| 459 | `function` | `sanitizeImportedWhitelistChannelName` | `subscriptionImportAndSenderNormalization` |
| 467 | `function` | `normalizeImportedWhitelistChannelEntry` | `subscriptionImportAndSenderNormalization` |
| 525 | `function` | `importedWhitelistEntriesMatch` | `subscriptionImportAndSenderNormalization` |
| 555 | `function` | `mergeImportedWhitelistChannelEntry` | `subscriptionImportAndSenderNormalization` |
| 589 | `function` | `mergeImportedWhitelistChannels` | `subscriptionImportAndSenderNormalization` |
| 634 | `function` | `extractPinVerifierFromProfilesV4` | `securitySessionAndPin` |
| 649 | `function` | `isProfileSessionAuthorized` | `securitySessionAndPin` |
| 655 | `async function` | `verifyAndCacheSessionPin` | `securitySessionAndPin` |
| 680 | `function` | `rotateAutoBackups` | `backupDownloadAndScheduling` |
| 725 | `function` | `revokeBackgroundBlobUrlLater` | `backupDownloadAndScheduling` |
| 735 | `function` | `downloadWithBrowserApi` | `backupDownloadAndScheduling` |
| 782 | `async function` | `createAutoBackupInBackground` | `backupDownloadAndScheduling` |
| 879 | `function` | `scheduleAutoBackupInBackground` | `backupDownloadAndScheduling` |
| 904 | `function` | `shouldWaitForPostBlockEnrichmentBeforeBackup` | `backupDownloadAndScheduling` |
| 912 | `async function` | `waitForPostBlockEnrichmentBeforeBackup` | `backupDownloadAndScheduling` |
| 946 | `function` | `compareSemver` | `migrationAndVersioning` |
| 964 | `function` | `isVersionAtLeast` | `migrationAndVersioning` |
| 968 | `function` | `applyQuickBlockDefaultMigrationOnce` | `migrationAndVersioning` |
| 1021 | `function` | `applyKeywordCommentsScopeMigrationOnce` | `migrationAndVersioning` |
| 1108 | `function` | `schedulePostBlockEnrichment` | `postBlockEnrichmentAndChannelKeywords` |
| 1172 | `function` | `getChannelDerivedKeywordRef` | `postBlockEnrichmentAndChannelKeywords` |
| 1178 | `function` | `getChannelDerivedKeywordWord` | `postBlockEnrichmentAndChannelKeywords` |
| 1189 | `function` | `parsePackedChannelKeywordSource` | `postBlockEnrichmentAndChannelKeywords` |
| 1196 | `function` | `syncStoredMainKeywordsWithChannels` | `postBlockEnrichmentAndChannelKeywords` |
| 1312 | `function` | `isKidsUrl` | `profileCompileAndStorage` |
| 1316 | `function` | `buildProfilesV4FromLegacyState` | `profileCompileAndStorage` |
| 1452 | `function` | `ensureChannelMapCache` | `learnedIdentityMapCaches` |
| 1472 | `function` | `flushChannelMapUpdates` | `learnedIdentityMapCaches` |
| 1487 | `function` | `scheduleChannelMapFlush` | `learnedIdentityMapCaches` |
| 1495 | `function` | `enqueueChannelMapUpdate` | `learnedIdentityMapCaches` |
| 1515 | `function` | `enqueueChannelMapMappings` | `learnedIdentityMapCaches` |
| 1528 | `function` | `ensureVideoChannelMapCache` | `learnedIdentityMapCaches` |
| 1548 | `function` | `ensureVideoMetaMapCache` | `learnedIdentityMapCaches` |
| 1568 | `function` | `enforceVideoChannelMapCap` | `learnedIdentityMapCaches` |
| 1580 | `function` | `enforceVideoMetaMapCap` | `learnedIdentityMapCaches` |
| 1594 | `function` | `flushVideoChannelMapUpdates` | `learnedIdentityMapCaches` |
| 1610 | `function` | `flushVideoMetaMapUpdates` | `learnedIdentityMapCaches` |
| 1632 | `function` | `scheduleVideoChannelMapFlush` | `learnedIdentityMapCaches` |
| 1640 | `function` | `scheduleVideoMetaMapFlush` | `learnedIdentityMapCaches` |
| 1648 | `function` | `enqueueVideoChannelMapUpdate` | `learnedIdentityMapCaches` |
| 1673 | `function` | `enqueueVideoMetaMapUpdate` | `learnedIdentityMapCaches` |
| 1719 | `async function` | `loadReleaseNotesData` | `releaseNotesAndRuntimeInfo` |
| 1737 | `async function` | `buildReleaseNotesPayload` | `releaseNotesAndRuntimeInfo` |
| 1758 | `function` | `getBackgroundRuntimeLabel` | `releaseNotesAndRuntimeInfo` |
| 1774 | `async function` | `getCompiledSettings` | `profileCompileAndStorage` |
| 2588 | `function` | `shouldSuppressFirstRunPromptInjectionError` | `releaseNotesAndRuntimeInfo` |
| 2689 | `function` | `handleFetchShortsIdentityMessage` | `identityResolverNetwork` |
| 2731 | `function` | `handleFetchWatchIdentityMessage` | `identityResolverNetwork` |
| 2759 | `function` | `storageGet` | `profileCompileAndStorage` |
| 2763 | `function` | `identityHasAlternateMetadata` | `identityResolverNetwork` |
| 2775 | `function` | `mergeStoredVideoIdentity` | `identityResolverNetwork` |
| 2810 | `async function` | `buildStoredVideoIdentity` | `identityResolverNetwork` |
| 2902 | `async function` | `performShortsIdentityFetch` | `identityResolverNetwork` |
| 2969 | `function` | `extractIdentityFromPreview` | `identityResolverNetwork` |
| 2987 | `function` | `extractKidsWatchIdentityFromPreview` | `identityResolverNetwork` |
| 3003 | `async function` | `performKidsWatchIdentityFetch` | `identityResolverNetwork` |
| 3097 | `async function` | `performWatchIdentityFetch` | `identityResolverNetwork` |
| 4552 | `function` | `extractCustomUrlFromPath` | `identityResolverNetwork` |
| 4581 | `async function` | `fetchChannelInfo` | `identityResolverNetwork` |
| 5332 | `async function` | `handleAddFilteredChannel` | `ruleMutationAndChannelPersistence` |
| 6231 | `async function` | `handleToggleChannelFilterAll` | `ruleMutationAndChannelPersistence` |
| 6328 | `function` | `installFilterTubeBackgroundConsoleGate` | `defensiveHelpersAndMessaging` |

## Current Behavior Boundaries

- `getCompiledSettings()` returns `compiledSettingsCache[targetProfile]` before
  reading storage when `forceRefresh` is false, so compiled state is a cache and
  profile-selection concern rather than a pure storage read.
- Learned map helpers mutate in-memory caches, patch compiled settings caches,
  batch pending writes, and flush `channelMap`, `videoChannelMap`, and
  `videoMetaMap` through timers.
- `scheduleAutoBackupInBackground()` overwrites one pending timer slot, accepts
  caller trigger/options/delay from message paths, can wait for post-block
  enrichment, and then calls `createAutoBackupInBackground()`.
- Shorts, watch, Kids watch, and channel-page resolvers perform credentialed
  YouTube/YouTube Kids HTML fetches with abort timers and partial preview
  parsing. Cache hits and pending-fetch dedupe do not prove a shared network
  budget.
- `handleAddFilteredChannel()` and `handleToggleChannelFilterAll()` write profile
  rule state, learned channel maps, compiled-cache invalidations, tab refreshes,
  and backup scheduling through local logic that is separate from the background
  action-router proof.

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
ownerRuntime
callerClass
triggerAction
senderClass
profileType
profileId
listModeInput
targetList
storageKeysTouched
compiledCacheEffect
networkEffect
scriptInjectionEffect
tabBroadcastEffect
backupEffect
statsEffect
learnedIdentityEffect
lockSessionState
disabledBehavior
noRuleBehavior
emptyListBehavior
teardownOrFlushBoundary
positiveFixture
negativeSenderFixture
negativePayloadFixture
rollbackFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

No runtime source currently implements:

- `backgroundMethodAuthority`
- `backgroundMethodEffectReport`
- `backgroundMethodNoWorkBudget`
- `backgroundStorageRevisionReport`
- `backgroundNetworkResolverBudget`
- `backgroundRuleMutationContract`
- `backgroundBackupScheduleAuthority`

These are future contract names. This register does not authorize message
hardening, mutation refactors, cache rewrites, network resolver changes,
script-injection changes, stats changes, backup scheduling changes, release
prompt changes, or list-mode behavior changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
