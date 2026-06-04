# FilterTube Tab View Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior changed: profile-scoped Nanah managed trusted-link lookup and storage.

This register promotes `js/tab-view.js` from broad UI/settings callable
accounting to a source-derived named method inventory. It covers the dashboard
controller that builds Main and Kids filter tabs, manages profile and lock UI,
drives list-mode switching, wires import/export and subscribed-channel import,
coordinates Nanah sync flows, renders dashboard stats, and delegates list rows
to `RenderEngine`.

This is not completion proof for every inline callback, DOM selector target,
runtime message, profile mutation, sync branch, modal workflow, timer, route,
settings mode, or rendered effect in the dashboard. It is a current-behavior
boundary before dashboard, settings, profile, import/export, Nanah, row-action,
navigation, lock, or list-mode behavior changes.

## Source-Derived Summary

```text
source file: js/tab-view.js
source split lines: 13491
source wc -l: 13490
source bytes: 621440
source sha256: 4b5c7474a686eae49d41926a2e4fe4daa670322d91138c6c6d715e07832827b2
broad lexical callable matches: 995
named declarations: 375
plain function declarations: 254
async function declarations: 88
const arrow helper declarations: 31
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 375
semantic method rows promoted: 375
control-flow lexical artifacts: 620 (`if`: 615, `for`: 3, `while`: 2)
local/listener/timer callbacks held outside this named method register: 0
addEventListener sites: 150
document.addEventListener sites: 2
window.addEventListener sites: 5
setTimeout calls: 14
setInterval calls: 1
clearInterval calls: 1
requestAnimationFrame calls: 11
MutationObserver references: 0
document.getElementById calls: 245
querySelector calls: 32
querySelectorAll calls: 27
document.createElement calls: 346
innerHTML writes: 39
setAttribute calls: 61
dataset writes: 14
direct StateManager calls: 42
unique StateManager methods reached: 14
RenderEngine calls: 4
unique RenderEngine methods reached: 2
sendRuntimeMessage calls: 8
action literal count: 10
window.confirm calls: 6
showPromptModal calls: 14
showChoiceModal calls: 10
executable current-behavior probes: 6
runtime behavior changed: profile-scoped Nanah managed trusted-link lookup and storage
```

## Method Group Counts

```text
dashboardStatsFiltering: 10
dateFilterHelpers: 7
importExportDownload: 8
kidsFiltersContentControls: 18
lockNavigationAndSubscriptionFlow: 7
mainFiltersContentControls: 20
managedRowsListModeRender: 15
modalDialogHelpers: 7
nanahApplyProposalTransport: 17
nanahModeScopePolicyModal: 47
nanahSessionUiAndEnvelope: 11
nanahTargetProfileDevicePolicy: 32
nanahTrustedLinkStorage: 25
navigationAndToasts: 3
pinProfilesManager: 8
profileAccessAndManagedChild: 84
profileDropdownAndBackupControls: 11
responsiveNavigationShell: 3
routeIntentAndReleaseNotes: 4
runtimeMessagingBrowserTabs: 17
settingsSyncAccountPolicyHandlers: 3
subscriptionsImportBridge: 18
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `responsiveNavigationShell` | 3 | Binds the mobile nav toggle, overlay close, and resize close behavior. | Duplicate-listener proof, viewport route fixtures, and teardown policy. |
| `mainFiltersContentControls` | 20 | Builds Main keyword/channel/content/category/video filter UI and schedules content/category saves. | Settings dependency parity, debounce budget, managed-child override proof, selector ownership, and false-hide negative fixtures. |
| `kidsFiltersContentControls` | 18 | Builds Kids keyword/channel/content/category/video filter UI and sync-related content controls. | Kids/Main mode parity, sync-to-main proof, child lock proof, and Kids-specific negative fixtures. |
| `routeIntentAndReleaseNotes` | 4 | Resolves hash/query navigation intent and loads release notes into the dashboard. | Route intent authority, release-note content provenance, and fallback route proof. |
| `runtimeMessagingBrowserTabs` | 17 | Wraps extension runtime messaging, auto-backup scheduling, session PIN notifications, browser tab queries, tab creation/update, active tab lookup, and tab messages. | Sender/result contract, lastError policy, backup trigger budget, session lock report, and browser API negative fixtures. |
| `subscriptionsImportBridge` | 18 | Selects and prepares YouTube subscription tabs, injects/pings the import receiver, waits for readiness, and renders import status. | Tab trust, URL allowlist, wait timeout budget, receiver idempotence, and import failure fixtures. |
| `profileDropdownAndBackupControls` | 11 | Renders profile selector/dropdown state, positions the dropdown, resets scroll, and syncs auto-backup policy controls. | Dropdown lifecycle teardown, scroll restoration proof, and backup policy/source metadata. |
| `profileAccessAndManagedChild` | 84 | Models profile type/access, parent-child relationships, managed child edit surfaces, child editor banners, admin controls, and viewing access updates. | Profile revision report, managed-child mutation contract, parent authority proof, lock/session negatives, and rollback proof. |
| `lockNavigationAndSubscriptionFlow` | 7 | Applies lock and child navigation gates, imports subscribed channels, enables whitelist after import, and updates subscription progress. | Lock gate authority, list-mode transfer proof, import whitelist negative fixtures, and navigation access parity. |
| `modalDialogHelpers` | 7 | Creates prompt and choice modals with cleanup and escape handling. | Focus trap, keyboard teardown, duplicate modal guard, and accessibility fixtures. |
| `nanahModeScopePolicyModal` | 47 | Normalizes Nanah mode/scope/strategy labels, child protections, managed-link modal policy, and trusted-link normalization. | Sync policy authority, managed-link permission proof, child/parent scope negatives, and remote capability fixtures. |
| `nanahTargetProfileDevicePolicy` | 32 | Resolves Nanah target profiles, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 25 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 11 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 17 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
| `pinProfilesManager` | 8 | Verifies PINs, unlocks profiles/admin, renders profile manager and profile selector, refreshes profiles, and switches active profile. | PIN/session boundary, active profile revision, profile switch rollback, and locked-profile negative fixtures. |
| `importExportDownload` | 8 | Exports/imports V3 JSON/encrypted backups, downloads through anchors, revokes blob URLs, and reloads UI after imports. | Import dry-run mutation plan, encrypted target policy, download cleanup proof, and failed-import rollback. |
| `settingsSyncAccountPolicyHandlers` | 3 | Persists account policy and derives generated account/child ids from UI input. | Account creation policy proof, conflict handling, and locked-profile negatives. |
| `managedRowsListModeRender` | 15 | Adds/removes/toggles managed child rows, renders Main/Kids lists through `RenderEngine`, applies date filters, and sends list-mode runtime messages. | Row-action mutation report, Main/Kids list-mode parity, copy/transfer proof, RenderEngine callback contract, and whitelist empty-state fixtures. |
| `dashboardStatsFiltering` | 10 | Updates setting checkboxes, filters content controls/help cards, computes dashboard counts/stats, rotates stats surfaces, and updates stat UI. | Stats source policy, interval lifecycle, no-rule render budget, and managed-child dashboard parity. |
| `dateFilterHelpers` | 7 | Applies keyword/channel date presets for Main and Kids list rendering. | Timezone boundary, date inclusion proof, and row-filter negative fixtures. |
| `navigationAndToasts` | 3 | Sets up navigation, exposes `window.switchView`, updates hash/title/view state, and renders success toasts. | Navigation state contract, global export policy, toast cleanup proof, and route access fixtures. |

## Current Named Method Inventory

| Source line | Kind | Method | Semantic group |
| ---: | --- | --- | --- |
| 14 | `function` | `initializeResponsiveNav` | `responsiveNavigationShell` |
| 21 | `function` | `closeSidebar` | `responsiveNavigationShell` |
| 26 | `function` | `closeOnWide` | `responsiveNavigationShell` |
| 46 | `function` | `initializeFiltersTabs` | `mainFiltersContentControls` |
| 48 | `function` | `createCompactCondition` | `mainFiltersContentControls` |
| 232 | `function` | `hexToRgba` | `mainFiltersContentControls` |
| 245 | `function` | `applyControlGroupTheme` | `mainFiltersContentControls` |
| 703 | `function` | `computeCategoryFiltersSignature` | `mainFiltersContentControls` |
| 711 | `function` | `normalizeSelectedArray` | `mainFiltersContentControls` |
| 726 | `function` | `updateCategorySelection` | `mainFiltersContentControls` |
| 751 | `function` | `renderCategoryList` | `mainFiltersContentControls` |
| 800 | `function` | `updateCategoryFilterUI` | `mainFiltersContentControls` |
| 810 | `function` | `applyCategoryFiltersToUI` | `mainFiltersContentControls` |
| 828 | `function` | `saveCategoryFilters` | `mainFiltersContentControls` |
| 879 | `function` | `scheduleSaveCategoryFilters` | `mainFiltersContentControls` |
| 893 | `function` | `updateVideoFilterUI` | `mainFiltersContentControls` |
| 934 | `function` | `applyContentFiltersToUI` | `mainFiltersContentControls` |
| 1010 | `function` | `scheduleSaveVideoFilters` | `mainFiltersContentControls` |
| 1021 | `function` | `maybeSelectOptionRadioFromElement` | `mainFiltersContentControls` |
| 1035 | `function` | `computeVideoFiltersSignature` | `mainFiltersContentControls` |
| 1043 | `function` | `saveVideoFilters` | `mainFiltersContentControls` |
| 1066 | `const arrow` | `parsePositiveFloat` | `mainFiltersContentControls` |
| 1361 | `function` | `closeSidebar` | `mainFiltersContentControls` |
| 1376 | `function` | `initializeKidsTabs` | `kidsFiltersContentControls` |
| 1380 | `function` | `createCompactCondition` | `kidsFiltersContentControls` |
| 1834 | `function` | `hexToRgba` | `kidsFiltersContentControls` |
| 1940 | `function` | `normalizeSelectedArray` | `kidsFiltersContentControls` |
| 1955 | `function` | `updateKidsCategorySelection` | `kidsFiltersContentControls` |
| 1977 | `function` | `renderKidsCategoryList` | `kidsFiltersContentControls` |
| 2029 | `function` | `updateKidsCategoryUi` | `kidsFiltersContentControls` |
| 2034 | `function` | `applyKidsCategoryFiltersToUI` | `kidsFiltersContentControls` |
| 2047 | `function` | `scheduleSaveKidsCategoryFilters` | `kidsFiltersContentControls` |
| 2058 | `function` | `saveKidsCategoryFilters` | `kidsFiltersContentControls` |
| 2086 | `function` | `updateKidsVideoFilterUI` | `kidsFiltersContentControls` |
| 2119 | `function` | `maybeSelectKidsOptionRadioFromElement` | `kidsFiltersContentControls` |
| 2130 | `function` | `computeSignature` | `kidsFiltersContentControls` |
| 2141 | `function` | `scheduleSaveKidsVideoFilters` | `kidsFiltersContentControls` |
| 2152 | `function` | `saveKidsVideoFilters` | `kidsFiltersContentControls` |
| 2174 | `const arrow` | `parsePositiveFloat` | `kidsFiltersContentControls` |
| 2299 | `function` | `applyKidsVideoFiltersToUI` | `kidsFiltersContentControls` |
| 2364 | `function` | `filterKidsContentControls` | `kidsFiltersContentControls` |
| 2543 | `function` | `resolveRequestedView` | `routeIntentAndReleaseNotes` |
| 2576 | `function` | `handleNavigationIntent` | `routeIntentAndReleaseNotes` |
| 2652 | `async function` | `loadReleaseNotesIntoDashboard` | `routeIntentAndReleaseNotes` |
| 2656 | `function` | `showEmptyState` | `routeIntentAndReleaseNotes` |
| 3059 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3085 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3101 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3103 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3117 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3138 | `function` | `normalizeManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3164 | `function` | `getPersistedManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3175 | `function` | `getManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3200 | `function` | `isManagedAdminUnlockRateLimited` | `profileAccessAndManagedChild` |
| 3204 | `async function` | `persistManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3239 | `async function` | `recordManagedAdminUnlockFailure` | `profileAccessAndManagedChild` |
| 3260 | `async function` | `clearManagedAdminUnlockFailures` | `profileAccessAndManagedChild` |
| 3301 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3305 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3309 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3313 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3317 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3321 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3347 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3373 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3399 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3409 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3422 | `const arrow` | `finish` | `runtimeMessagingBrowserTabs` |
| 3427 | `const arrow` | `handleRuntimeError` | `runtimeMessagingBrowserTabs` |
| 3466 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3475 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3491 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3501 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3518 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3522 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3573 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3587 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3596 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3602 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3612 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3636 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3640 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3652 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3693 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3702 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3794 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3814 | `function` | `getProfileColors` | `subscriptionsImportBridge` |
| 3831 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3837 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3854 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3901 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3910 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3912 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 3951 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3973 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 3994 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 4067 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 4102 | `function` | `extractMasterPinVerifier` | `profileDropdownAndBackupControls` |
| 4111 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 4120 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 4127 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 4136 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 4148 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 4158 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 4191 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4204 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4215 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4229 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4240 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4253 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4266 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4278 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4286 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4294 | `function` | `normalizeNonNegativeInteger` | `profileAccessAndManagedChild` |
| 4300 | `function` | `getManagedTimeLimitTimezone` | `profileAccessAndManagedChild` |
| 4309 | `function` | `getManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4338 | `function` | `buildLocalPolicyHash` | `profileAccessAndManagedChild` |
| 4347 | `function` | `buildManagedTimeLimitPolicyHash` | `profileAccessAndManagedChild` |
| 4351 | `function` | `buildManagedLocalEditPolicyHash` | `profileAccessAndManagedChild` |
| 4355 | `function` | `buildManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4398 | `function` | `managedTimeLimitLabel` | `profileAccessAndManagedChild` |
| 4409 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4418 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4424 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4438 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4464 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4491 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4516 | `function` | `localManagedEditPolicyRevisionStore` | `profileAccessAndManagedChild` |
| 4522 | `function` | `countEnabledFlags` | `profileAccessAndManagedChild` |
| 4526 | `function` | `summarizeManagedChildSurface` | `profileAccessAndManagedChild` |
| 4554 | `function` | `buildManagedChildLocalEditReport` | `profileAccessAndManagedChild` |
| 4604 | `function` | `recordManagedChildLocalEditHistory` | `profileAccessAndManagedChild` |
| 4624 | `async function` | `recordManagedAdminAuthFailureHistory` | `profileAccessAndManagedChild` |
| 4679 | `function` | `getManagedActionHistoryRows` | `profileAccessAndManagedChild` |
| 4685 | `function` | `managedActionHistoryRowIsProtected` | `profileAccessAndManagedChild` |
| 4691 | `function` | `canViewManagedActionHistory` | `profileAccessAndManagedChild` |
| 4697 | `function` | `formatManagedActionHistoryRow` | `profileAccessAndManagedChild` |
| 4712 | `function` | `managedPolicyRevisionLabel` | `profileAccessAndManagedChild` |
| 4721 | `function` | `summarizeManagedPolicyStateForProfile` | `profileAccessAndManagedChild` |
| 4758 | `function` | `buildManagedProfileStatusText` | `profileAccessAndManagedChild` |
| 4782 | `async function` | `showManagedActionHistory` | `profileAccessAndManagedChild` |
| 4832 | `async function` | `clearManagedActionHistory` | `profileAccessAndManagedChild` |
| 4905 | `function` | `getManagedNanahPolicyAcceptedState` | `profileAccessAndManagedChild` |
| 4915 | `function` | `findNanahTrustedLinkForManagedEnvelope` | `profileAccessAndManagedChild` |
| 4931 | `function` | `buildNanahManagedValidationTrustedLink` | `profileAccessAndManagedChild` |
| 4955 | `function` | `getNanahManagedDuplicateDeviceIds` | `profileAccessAndManagedChild` |
| 4974 | `function` | `buildManagedNanahPolicyValidationContext` | `profileAccessAndManagedChild` |
| 4998 | `function` | `summarizeManagedNanahPolicyEnvelope` | `profileAccessAndManagedChild` |
| 5017 | `function` | `resolveManagedRemoteHistoryActionType` | `profileAccessAndManagedChild` |
| 5029 | `async function` | `recordManagedNanahPolicyValidationHistory` | `profileAccessAndManagedChild` |
| 5103 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 5108 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 5114 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 5118 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 5148 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 5216 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 5220 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 5242 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 5282 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 5288 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 5300 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 5345 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 5358 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 5420 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 5424 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 5435 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 5441 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 5495 | `async function` | `updateProfileTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 5573 | `function` | `isUiLocked` | `profileAccessAndManagedChild` |
| 5582 | `function` | `getActiveProfileType` | `profileAccessAndManagedChild` |
| 5588 | `function` | `getNanahProfileTypeLabel` | `profileAccessAndManagedChild` |
| 5593 | `function` | `getNanahLocalProfileContext` | `profileAccessAndManagedChild` |
| 5605 | `function` | `getNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5625 | `function` | `normalizeNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5631 | `function` | `isNanahChildReplicaOnly` | `profileAccessAndManagedChild` |
| 5636 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 5682 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 5717 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 5795 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 5997 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 6015 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 6043 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 6120 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 6171 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6178 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6221 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 6266 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6273 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6307 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 6323 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 6327 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 6334 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 6348 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 6357 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 6363 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6370 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 6388 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 6393 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 6400 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 6407 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 6411 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 6419 | `function` | `getNanahManagedPolicyScopeList` | `nanahModeScopePolicyModal` |
| 6437 | `function` | `getNanahManagedSendScopeList` | `nanahModeScopePolicyModal` |
| 6457 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6465 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 6479 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 6483 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 6490 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 6494 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 6501 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 6507 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 6514 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 6520 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 6527 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 6533 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 6537 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6544 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 6548 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 6552 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 6567 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 6581 | `function` | `expandNanahManagedSendScope` | `nanahModeScopePolicyModal` |
| 6587 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 6591 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 7020 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 7058 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 7083 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 7090 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 7142 | `function` | `buildNanahProfileScopedLinkId` | `nanahModeScopePolicyModal` |
| 7149 | `function` | `getNanahTrustedLinkTargetProfileId` | `nanahModeScopePolicyModal` |
| 7161 | `function` | `getNanahTrustedLinkIdentityKey` | `nanahModeScopePolicyModal` |
| 7166 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7170 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7186 | `function` | `normalizeNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 7191 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7195 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7275 | `function` | `getManagedNanahLinkPolicy` | `nanahModeScopePolicyModal` |
| 7281 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 7295 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7336 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 7366 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7376 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7392 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 7396 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7403 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7431 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 7447 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 7452 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 7462 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 7477 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 7482 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7486 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7498 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7510 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7528 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7537 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 7543 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 7578 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 7585 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 7599 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7615 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7621 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7625 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7629 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 7639 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 7657 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 7693 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 7718 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 7766 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 7829 | `function` | `findNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7855 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 7879 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 7899 | `function` | `normalizeNanahManagedSigningPublicDescriptor` | `nanahTrustedLinkStorage` |
| 7919 | `function` | `normalizeNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7932 | `async function` | `persistNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7947 | `async function` | `loadNanahManagedSigningKeyDescriptor` | `nanahTrustedLinkStorage` |
| 7965 | `async function` | `ensureNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7984 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7993 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7997 | `function` | `buildManagedTrustRevocationHistoryRow` | `nanahTrustedLinkStorage` |
| 8026 | `async function` | `purgeNanahManagedPolicyStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8088 | `async function` | `purgeNanahManagedOpenSyncStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8104 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8138 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8148 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 8171 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 8188 | `async function` | `loadNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8192 | `async function` | `persistNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8197 | `function` | `createNanahManagedOpenSyncHelper` | `nanahTrustedLinkStorage` |
| 8202 | `function` | `formatNanahManagedOpenSyncStatus` | `nanahTrustedLinkStorage` |
| 8206 | `async function` | `runNanahManagedOpenSync` | `nanahTrustedLinkStorage` |
| 8224 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8270 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 8321 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8540 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 8577 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 8692 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 8796 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 8912 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 8928 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 8957 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 8975 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 9006 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 9070 | `function` | `parseNanahEnvelopeDetails` | `nanahSessionUiAndEnvelope` |
| 9139 | `function` | `shouldAutoApplyNanahProposal` | `nanahSessionUiAndEnvelope` |
| 9153 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 9172 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 9201 | `async function` | `handleNanahIncomingManagedPolicyEnvelope` | `nanahApplyProposalTransport` |
| 9255 | `async function` | `handleNanahIncomingManagedMailboxItem` | `nanahApplyProposalTransport` |
| 9317 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 9365 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 9387 | `function` | `getNanahActiveManagedSurface` | `nanahApplyProposalTransport` |
| 9399 | `function` | `getNanahManagedPolicySourceProfile` | `nanahApplyProposalTransport` |
| 9444 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 9461 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 9470 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 9541 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 9556 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 9811 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 9893 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 9975 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 10099 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 10129 | `async function` | `verifyPin` | `pinProfilesManager` |
| 10137 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 10183 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 10190 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 10202 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 10262 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 10672 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 10695 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 10884 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 10899 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 10926 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 10968 | `async function` | `runExportV3` | `importExportDownload` |
| 10998 | `const arrow` | `safePart` | `importExportDownload` |
| 11032 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 11080 | `const arrow` | `safePart` | `importExportDownload` |
| 11113 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 11595 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 11705 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 11814 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 12140 | `function` | `toDateInputValue` | `dateFilterHelpers` |
| 12148 | `function` | `parseDateInput` | `dateFilterHelpers` |
| 12161 | `function` | `applyPresetToDateControls` | `dateFilterHelpers` |
| 12187 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 12202 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 12215 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 12230 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 12245 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 12265 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 12278 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 12295 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 12313 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 12331 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 12350 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 12369 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 12379 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 12405 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 12414 | `const arrow` | `whitelistEmpty` | `managedRowsListModeRender` |
| 12547 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 12569 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 12590 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 12617 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 12628 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 12666 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 12701 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 12721 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 12730 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 12771 | `function` | `updateStats` | `dashboardStatsFiltering` |
| 12945 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 13060 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 13141 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 13223 | `function` | `updateKidsChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 13370 | `function` | `setupNavigation` | `navigationAndToasts` |
| 13392 | `function` | `switchView` | `navigationAndToasts` |
| 13480 | `function` | `showSuccessToast` | `navigationAndToasts` |

## Future Method Proof Fields

Any future behavior change in this file needs rows with at least:

```text
methodReference
sourceLine
semanticGroup
callerUi
profileType
profileId
activeView
listModeInput
stateSource
managedChildEditState
lockSessionState
runtimeMessageAction
ioMutationEffect
stateManagerMutationEffect
renderEngineDelegation
nanahScope
nanahStrategy
importExportScope
browserTabTarget
domSelectorTarget
domWriteEffect
listenerEffect
timerEffect
frameEffect
globalExportEffect
backupScheduleEffect
navigationEffect
modalEffect
accessibilityFixture
positiveFixture
negativeModeFixture
negativeLockFixture
negativeProfileFixture
negativeSyncFixture
negativeImportFixture
negativeSiblingFixture
performanceBudget
teardownPolicy
fixtureProvenance
```

## Dependency And Action Tokens

Current dependency/action crossings pinned by this register include:

- `FilterTube_SetListMode`
- `FilterTube_TransferWhitelistToBlocklist`
- `importSubscribedChannelsToWhitelist`

## Missing Runtime Authorities

No runtime source currently implements:

- `tabViewMethodAuthority`
- `tabViewListenerLifecycleContract`
- `tabViewListModeMutationReport`
- `tabViewManagedChildEditContract`
- `tabViewNanahSyncPolicyReport`
- `tabViewImportExportMutationPlan`
- `tabViewProfileLockAccessReport`
- `tabViewDashboardRenderBudget`
- `tabViewNavigationStateContract`

These are future contract names. This register does not authorize dashboard
rewrites, settings save changes, list-mode behavior changes, profile/lock
changes, managed-child edits, import/export changes, Nanah changes, listener or
timer changes, selector changes, navigation changes, or RenderEngine delegation
changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 71
method semantic proof gap lexical callables covered: 6045
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6045
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
