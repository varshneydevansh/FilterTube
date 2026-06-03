# FilterTube Injector Method Semantic Register - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

Scope: source file: js/injector.js. This register promotes the existing
injector settings capability audit from representative bridge tokens to a
source-derived method inventory for the main-world injector runtime. It is not
completion proof for injector message authority, subscription import action
ownership, seed settings revision ownership, page-global hook ownership, or
snapshot identity confidence.

## Source-Derived Summary

- line count: 3593
- named method/helper/callback declarations in scope: 108
- function declarations in scope: 69
- plain function declarations: 66
- async function declarations: 3
- const helper/callback declarations: 39
- const arrow helper/callback declarations: 31
- async const arrow helper/callback declarations: 1
- const IIFE result declarations: 7
- arrow callback sites in scope: 100
- semantic method groups: 12
- browser/global export: none
- CommonJS export: none
- runtime behavior changed: no

## Semantic Groups

| Group | Rows | Current owner/effect boundary |
| --- | ---: | --- |
| `injectorBridgeLifecycleAndLogging` | 4 | Subscription import bridge ready announcement, page message listener install, duplicate-run ready reposting, and debug relay to content bridge. |
| `injectorCollaboratorIdentitySanitization` | 12 | Handle extraction, collaborator placeholder/composite filtering, collaborator list source marking, quality scoring, and loose expected-value normalization. |
| `injectorSubscriptionContextAndPrimitiveHelpers` | 10 | Safe clone/text/thumbnail helpers, ytcfg reads, subscription import request context/header construction, feed-route detection, and logged-out response detection. |
| `injectorSubscriptionSeedCollection` | 9 | DOM/page/snapshot subscription import seed collection, continuation extraction, button discovery, visible-element checks, and seed request context assembly. |
| `injectorSubscriptionExpansionAndWait` | 5 | Feed expansion by scroll/click, browse-snapshot waiting, growth/stability checks, and timeout-bound seed accumulation. |
| `injectorSubscriptionEntryNormalizationAndSummary` | 8 | Subscription row keying, renderer normalization, entry merge, diagnostic samples, tracked-match diagnostics, and response summarization. |
| `injectorSubscriptionYoutubeiFetchAndQueue` | 4 | Credentialed `/youtubei/v1/browse` request loop, progress messages, initial profile queueing, continuation queueing, retry, abort, and partial-result handling. |
| `injectorCollaboratorMatcherAndCache` | 6 | Expected collaborator matcher construction, response validity scoring, collaborator candidate ranking, and in-memory collaborator cache writes. |
| `injectorCollaboratorDataExtraction` | 14 | Avatar stack, sheet/dialog/list item, showDialog/showSheet, and bounded nested collaborator extraction from raw renderer objects. |
| `injectorChannelSnapshotIdentitySearch` | 20 | Channel/name/custom URL extraction and video-channel snapshot search across player, watch, browse, search, next, and collaborator sheet fallbacks. |
| `injectorCollaboratorSnapshotDomSearch` | 6 | Collaborator search across ytInitial/filterTube snapshot roots plus DOM hydration from stamped collaborator attributes and watch metadata candidates. |
| `injectorSeedHookAndQueueLifecycle` | 10 | Network JSON work/no-work gates, seed settings update/retry, FilterTubeEngine processing bridge, revisionless initial data queue, seed global connection, and backup `ytInitialData` property hook. |

## Declaration Rows

| Line | Kind | Name | Semantic group |
| ---: | --- | --- | --- |
| 8 | `function` | `announceSubscriptionsImportBridgeReady` | `injectorBridgeLifecycleAndLogging` |
| 23 | `function` | `handleSubscriptionsImportBridgeMessage` | `injectorBridgeLifecycleAndLogging` |
| 70 | `function` | `installSubscriptionsImportBridge` | `injectorBridgeLifecycleAndLogging` |
| 107 | `function` | `postLog` | `injectorBridgeLifecycleAndLogging` |
| 148 | `function` | `hasList` | `injectorSeedHookAndQueueLifecycle` |
| 152 | `function` | `hasEnabledContentFilters` | `injectorSeedHookAndQueueLifecycle` |
| 164 | `function` | `hasSelectedCategoryFilters` | `injectorSeedHookAndQueueLifecycle` |
| 171 | `function` | `hasActiveJsonFilterRules` | `injectorSeedHookAndQueueLifecycle` |
| 185 | `function` | `hasNetworkJsonWork` | `injectorSeedHookAndQueueLifecycle` |
| 192 | `function` | `extractRawHandle` | `injectorCollaboratorIdentitySanitization` |
| 233 | `function` | `hasStrongCollaboratorIdentity` | `injectorCollaboratorIdentitySanitization` |
| 242 | `function` | `normalizeCompositeCollaboratorLabel` | `injectorCollaboratorIdentitySanitization` |
| 257 | `function` | `collaboratorCompositeLabelVariants` | `injectorCollaboratorIdentitySanitization` |
| 268 | `function` | `isPlaceholderCollaboratorEntry` | `injectorCollaboratorIdentitySanitization` |
| 277 | `function` | `isCompositeNameOnlyCollaborator` | `injectorCollaboratorIdentitySanitization` |
| 308 | `function` | `sanitizeCollaboratorList` | `injectorCollaboratorIdentitySanitization` |
| 332 | `function` | `markCollaboratorListSource` | `injectorCollaboratorIdentitySanitization` |
| 349 | `function` | `getCollaboratorListSource` | `injectorCollaboratorIdentitySanitization` |
| 353 | `function` | `getCollaboratorListQuality` | `injectorCollaboratorIdentitySanitization` |
| 366 | `function` | `normalizeLooseText` | `injectorCollaboratorIdentitySanitization` |
| 371 | `function` | `normalizeExpectedHandle` | `injectorCollaboratorIdentitySanitization` |
| 378 | `function` | `safeStructuredClone` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 393 | `function` | `sleep` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 397 | `function` | `getYtcfgValue` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 420 | `function` | `extractTextFromRenderer` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 433 | `function` | `normalizeThumbnailUrl` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 441 | `function` | `buildSubscriptionImportHeaders` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 463 | `function` | `buildSubscriptionImportRequestProfiles` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 541 | `const IIFE result` | `isMobileHost` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 561 | `function` | `isYoutubeChannelsFeedPath` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 569 | `function` | `detectLoggedOutBrowseResponse` | `injectorSubscriptionContextAndPrimitiveHelpers` |
| 597 | `function` | `collectSubscriptionImportArtifacts` | `injectorSubscriptionSeedCollection` |
| 604 | `const arrow` | `pushContinuationRequest` | `injectorSubscriptionSeedCollection` |
| 619 | `const arrow` | `visit` | `injectorSubscriptionSeedCollection` |
| 688 | `function` | `collectSubscriptionImportDomSeed` | `injectorSubscriptionSeedCollection` |
| 698 | `const arrow` | `addSource` | `injectorSubscriptionSeedCollection` |
| 767 | `function` | `collectSubscriptionImportPageSeed` | `injectorSubscriptionSeedCollection` |
| 863 | `function` | `buildSubscriptionImportContext` | `injectorSubscriptionSeedCollection` |
| 876 | `function` | `isElementVisibleForSubscriptionsImport` | `injectorSubscriptionSeedCollection` |
| 884 | `function` | `getSubscriptionImportMoreButtons` | `injectorSubscriptionSeedCollection` |
| 898 | `async function` | `expandSubscriptionsImportPageSeed` | `injectorSubscriptionExpansionAndWait` |
| 909 | `async const arrow` | `performScrollStep` | `injectorSubscriptionExpansionAndWait` |
| 976 | `function` | `getLatestSubscriptionImportBrowseSnapshotTs` | `injectorSubscriptionExpansionAndWait` |
| 993 | `async function` | `waitForSubscriptionImportSeed` | `injectorSubscriptionExpansionAndWait` |
| 1000 | `const arrow` | `shouldKeepWaitingForGrowth` | `injectorSubscriptionExpansionAndWait` |
| 1055 | `function` | `getSubscriptionImportEntryKey` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1065 | `function` | `normalizeSubscriptionImportEntry` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1123 | `function` | `mergeSubscriptionImportEntries` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1156 | `function` | `getSubscriptionsImportTrackedMatches` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1195 | `function` | `buildSubscriptionsImportSample` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1206 | `function` | `summarizeSubscriptionImportResponse` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1228 | `const arrow` | `visit` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1272 | `function` | `logSubscriptionsImport` | `injectorSubscriptionEntryNormalizationAndSummary` |
| 1282 | `async function` | `fetchSubscribedChannelsFromYoutubei` | `injectorSubscriptionYoutubeiFetchAndQueue` |
| 1304 | `const arrow` | `postProgress` | `injectorSubscriptionYoutubeiFetchAndQueue` |
| 1376 | `const arrow` | `queueInitialProfile` | `injectorSubscriptionYoutubeiFetchAndQueue` |
| 1394 | `const arrow` | `queueContinuation` | `injectorSubscriptionYoutubeiFetchAndQueue` |
| 1733 | `function` | `tokenizeExpectedCollaboratorNames` | `injectorCollaboratorMatcherAndCache` |
| 1737 | `const arrow` | `pushToken` | `injectorCollaboratorMatcherAndCache` |
| 1776 | `function` | `buildExpectedMatcher` | `injectorCollaboratorMatcherAndCache` |
| 1822 | `function` | `isValidCollaboratorResponse` | `injectorCollaboratorMatcherAndCache` |
| 1865 | `function` | `scoreCollaboratorCandidate` | `injectorCollaboratorMatcherAndCache` |
| 1897 | `function` | `cacheCollaboratorsIfBetter` | `injectorCollaboratorMatcherAndCache` |
| 2055 | `function` | `extractCollaboratorsFromDataObject` | `injectorCollaboratorDataExtraction` |
| 2058 | `const arrow` | `extractFromAvatarStackViewModel` | `injectorCollaboratorDataExtraction` |
| 2064 | `const arrow` | `parseBrowseIdFromUrl` | `injectorCollaboratorDataExtraction` |
| 2070 | `const arrow` | `pickEndpointUrl` | `injectorCollaboratorDataExtraction` |
| 2080 | `const arrow` | `resolveBrowseEndpoint` | `injectorCollaboratorDataExtraction` |
| 2134 | `const arrow` | `extractFromSheetLikeCommand` | `injectorCollaboratorDataExtraction` |
| 2137 | `const arrow` | `normalizeUcId` | `injectorCollaboratorDataExtraction` |
| 2142 | `const arrow` | `pickTextContent` | `injectorCollaboratorDataExtraction` |
| 2154 | `const arrow` | `pickTitleText` | `injectorCollaboratorDataExtraction` |
| 2159 | `const arrow` | `pickSubtitleText` | `injectorCollaboratorDataExtraction` |
| 2164 | `const arrow` | `resolveCommandContext` | `injectorCollaboratorDataExtraction` |
| 2252 | `const arrow` | `extractCollaboratorsFromListItems` | `injectorCollaboratorDataExtraction` |
| 2380 | `const arrow` | `scan` | `injectorCollaboratorDataExtraction` |
| 2421 | `function` | `deepScanForShowDialog` | `injectorCollaboratorDataExtraction` |
| 2495 | `function` | `normalizeChannelName` | `injectorChannelSnapshotIdentitySearch` |
| 2500 | `function` | `extractCustomUrlFromCanonicalBaseUrl` | `injectorChannelSnapshotIdentitySearch` |
| 2504 | `const IIFE result` | `decoded` | `injectorChannelSnapshotIdentitySearch` |
| 2531 | `function` | `extractChannelLogoFromObject` | `injectorChannelSnapshotIdentitySearch` |
| 2553 | `function` | `mergeChannelCandidates` | `injectorChannelSnapshotIdentitySearch` |
| 2567 | `function` | `searchYtInitialDataForVideoChannel` | `injectorChannelSnapshotIdentitySearch` |
| 2590 | `const IIFE result` | `isWatchContext` | `injectorChannelSnapshotIdentitySearch` |
| 2597 | `const IIFE result` | `isCurrentWatchVideo` | `injectorChannelSnapshotIdentitySearch` |
| 2607 | `const arrow` | `extractOwnerCandidate` | `injectorChannelSnapshotIdentitySearch` |
| 2640 | `const arrow` | `extractThumbnailOwnerCandidate` | `injectorChannelSnapshotIdentitySearch` |
| 2679 | `const arrow` | `extractFromPlayerResponse` | `injectorChannelSnapshotIdentitySearch` |
| 2696 | `const IIFE result` | `watchOwnerCandidate` | `injectorChannelSnapshotIdentitySearch` |
| 2700 | `const arrow` | `scan` | `injectorChannelSnapshotIdentitySearch` |
| 2777 | `function` | `matchesExpectations` | `injectorChannelSnapshotIdentitySearch` |
| 2797 | `const arrow` | `extractVideoIdFromNode` | `injectorChannelSnapshotIdentitySearch` |
| 2823 | `const arrow` | `pickSingleChannelFromCollaborators` | `injectorChannelSnapshotIdentitySearch` |
| 2855 | `const arrow` | `extractSingleChannelFromSheetLikeData` | `injectorChannelSnapshotIdentitySearch` |
| 2860 | `function` | `searchNode` | `injectorChannelSnapshotIdentitySearch` |
| 3036 | `function` | `searchRoot` | `injectorChannelSnapshotIdentitySearch` |
| 3051 | `const IIFE result` | `playerCandidate` | `injectorChannelSnapshotIdentitySearch` |
| 3102 | `function` | `searchYtInitialDataForCollaborators` | `injectorCollaboratorSnapshotDomSearch` |
| 3141 | `const arrow` | `extractVideoIdFromNode` | `injectorCollaboratorSnapshotDomSearch` |
| 3169 | `function` | `searchObject` | `injectorCollaboratorSnapshotDomSearch` |
| 3261 | `const IIFE result` | `currentVideoId` | `injectorCollaboratorSnapshotDomSearch` |
| 3286 | `const arrow` | `hydrateFromStampedAttributes` | `injectorCollaboratorSnapshotDomSearch` |
| 3304 | `const arrow` | `attemptExtraction` | `injectorCollaboratorSnapshotDomSearch` |
| 3383 | `function` | `updateSeedSettings` | `injectorSeedHookAndQueueLifecycle` |
| 3405 | `function` | `processDataWithFilterLogic` | `injectorSeedHookAndQueueLifecycle` |
| 3427 | `function` | `processInitialDataQueue` | `injectorSeedHookAndQueueLifecycle` |
| 3459 | `function` | `connectToSeedGlobal` | `injectorSeedHookAndQueueLifecycle` |
| 3498 | `function` | `setupAdditionalHooks` | `injectorSeedHookAndQueueLifecycle` |

## Observable Side-Effect Counts

- document literal occurrences: 15
- window literal occurrences: 123
- location literal occurrences: 10
- document.querySelector calls: 1
- document.querySelectorAll calls: 3
- element querySelector calls: 1
- querySelectorAll?. calls: 2
- closest calls: 1
- matches calls: 0
- document.addEventListener calls: 0
- window.addEventListener calls: 2
- removeEventListener calls: 0
- MutationObserver references: 0
- observe calls: 0
- disconnect calls: 0
- setTimeout calls: 5
- clearTimeout calls: 2
- setInterval calls: 1
- clearInterval calls: 2
- requestAnimationFrame calls: 0
- cancelAnimationFrame calls: 0
- fetch calls: 1
- AbortController references: 2
- postMessage calls: 10
- wildcard postMessage target calls: 10
- dispatchEvent calls: 2
- click calls: 1
- scrollTo calls: 3
- Object.defineProperty calls: 2
- Object.getOwnPropertyDescriptor calls: 1
- JSON.parse calls: 4
- JSON.stringify calls: 2
- new Map calls: 7
- new Set calls: 19
- WeakSet references: 7
- window.filterTube references: 58
- FilterTubeEngine references: 15
- currentSettings references: 10
- initialDataQueue references: 9
- collaboratorCache references: 6
- window.ytInitialData references: 10
- ytInitialPlayerResponse references: 4
- recentYtSearchResponses references: 6
- recentYtBrowseResponses references: 4
- FilterTube_RequestSubscriptionImport references: 1
- FilterTube_SubscriptionsImportResponse references: 1
- FilterTube_SubscriptionsImportProgress references: 1
- FilterTube_SettingsToInjector references: 1
- FilterTube_CacheCollaboratorInfo references: 1
- FilterTube_RequestCollaboratorInfo references: 1
- FilterTube_RequestChannelInfo references: 1
- FilterTube_CollaboratorInfoResponse references: 1
- FilterTube_ChannelInfoResponse references: 1
- FilterTube_InjectorBridgeReady references: 2
- FilterTube_InjectorToBridge_Ready references: 2
- FilterTube_InjectorToBridge_Log references: 1
- source === 'content_bridge' checks: 3
- source === 'injector' checks: 2
- source !== 'content_bridge' checks: 1
- source: 'injector' payload labels: 10
- credentialed YouTubei fetch policy occurrences: 1
- YouTubei browse endpoint literal occurrences: 2

## Current Behavior Boundaries

- boot order: `installSubscriptionsImportBridge();` runs before the duplicate-run idempotency guard.
- duplicate-run behavior: `if (window.filterTubeInjectorHasRun)` reposts bridge-ready messages when a prior injector/seed state is visible.
- subscription import listener: `window.addEventListener('message', handleSubscriptionsImportBridgeMessage)` has no remove path.
- main injector listener: `window.addEventListener('message', (event) => { ... })` has no remove path and dispatches settings, collaborator cache, collaborator lookup, and channel lookup requests.
- subscription import request authority: request type `FilterTube_RequestSubscriptionImport` is accepted when `source !== 'content_bridge'` is false; no nonce, capability token, action token, or settings revision is present.
- subscription import response path: `FilterTube_SubscriptionsImportResponse` and `FilterTube_SubscriptionsImportProgress` are posted with wildcard target `'*'` and `source: 'injector'`.
- subscription import work path: feed expansion can call `window.scrollTo`, dispatch `new Event('scroll')`, click visible More buttons, wait on timers, and then run credentialed `/youtubei/v1/browse?prettyPrint=false` POST requests.
- fetch policy: subscription import uses `credentials: 'include'`, optional `AbortController`, `setTimeout` abort, and retry/partial-result logic.
- settings receiver: `FilterTube_SettingsToInjector` merges caller payload via `currentSettings = { ...currentSettings, ...payload };`, sets `settingsReceived = true`, calls `updateSeedSettings()`, and drains `initialDataQueue` without a revision gate.
- network JSON work gate: `hasNetworkJsonWork(currentSettings)` now guards injector JSON processing and queued replay; disabled settings, empty blocklist work, and empty category filters pass through without engine processing while whitelist mode still remains active work.
- filter logic bridge: `connectToSeedGlobal()` writes `window.filterTube.processFetchResponse` and `window.filterTube.processXhrResponse`.
- backup global hook: `setupAdditionalHooks()` uses `Object.defineProperty(window, 'ytInitialData', ...)` when seed has not already installed a getter.
- engine lifecycle: a 100ms `setInterval` polls `window.FilterTubeEngine?.processData`, clears itself on success, dispatches `filterTubeReady`, and a 5000ms timeout clears the interval if the engine never loads.
- collaborator cache path: `FilterTube_CacheCollaboratorInfo` is accepted from `source === 'filter_logic'` and can write `collaboratorCache`.
- collaborator lookup path: `FilterTube_RequestCollaboratorInfo` is accepted from `source === 'content_bridge'`, checks `collaboratorCache`, searches `ytInitialData`/`filterTube` snapshots and DOM hydration, then posts `FilterTube_CollaboratorInfoResponse` with wildcard target.
- channel lookup path: `FilterTube_RequestChannelInfo` is accepted from `source === 'content_bridge'`, searches snapshot/player/watch roots for a video owner, then posts `FilterTube_ChannelInfoResponse` with wildcard target.
- selector targets: subscription import reads `ytd-channel-renderer, ytm-channel-list-item-renderer`; More-button expansion reads `button, a[role="button"], yt-button-shape button, ytm-button-renderer button`; collaborator DOM hydration reads `[data-filtertube-video-id="${videoId}"]`, card wrappers, avatar stack selectors, watch metadata, owner renderer, and selected playlist rows.
- page-global write path: bridge ready flags, bridge version, duplicate-run flag, seed processing functions, `ytInitialData`, `ftInitialized`, and collaborator list source markers are written in the page main world.
- teardown path: no `removeEventListener` exists; interval/timer clearing exists only for engine polling and subscription fetch abort timers.

## Required Future Proof Fields

Before an implementation can rely on this register, each injector method or
callback that can affect behavior needs at least these fields:

```text
methodReference
sourceLine
semanticGroup
callerSurface
messageType
sourceLabel
capability
requestId
actionToken
settingsRevision
routeSurface
settingsMode
listMode
profileTarget
compiledActiveState
subscriptionImportReason
youtubeiEndpoint
fetchCredentialsPolicy
maxChannels
timeoutBudgetMs
abortBudget
pageExpansionBudget
seedSnapshotSource
continuationTokenSource
collaboratorMatcher
identityConfidence
cacheEffect
DOMHydrationSelector
snapshotRootProvenance
pageGlobalWrite
hookOwner
timerOwner
intervalOwner
teardownPolicy
noRuleBudget
negativeFixture
positiveFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

Current source has no central authority symbols for:

- `injectorMethodAuthority`
- `injectorBridgeMessageTrustContract`
- `injectorSettingsRevisionContract`
- `injectorSubscriptionImportActionToken`
- `injectorSubscriptionImportWorkBudget`
- `injectorYoutubeiFetchPolicy`
- `injectorSnapshotSearchProvenance`
- `injectorCollaboratorIdentityConfidenceReport`
- `injectorChannelLookupAuthority`
- `injectorSeedHookLifecycleContract`
- `injectorPageGlobalPatchReport`
- `injectorFixtureProvenance`

Until those exist with fixtures, this register is evidence of current behavior
and risk shape only. It does not authorize runtime changes.

## Fixture Coverage

Executable current-behavior fixture:

```text
tests/runtime/injector-method-semantic-register-current-behavior.test.mjs
```

The fixture pins declaration counts, every method row, observable side-effect
counts, message/fetch/hook/selector boundaries, future proof fields, and the
absence of the runtime authority symbols above.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
