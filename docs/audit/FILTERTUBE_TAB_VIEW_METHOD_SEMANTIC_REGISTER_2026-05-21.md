# FilterTube Tab View Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior changed: profile-scoped Nanah managed trusted-link lookup, storage, connected target chooser, and signed fanout.

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
source split lines: 13632
source wc -l: 13631
source bytes: 628942
source sha256: 572c30cc72b123920342348827cab704a79083bb4b92e8ab57eceea8969a4de4
broad lexical callable matches: 1008
named declarations: 380
plain function declarations: 259
async function declarations: 88
const arrow helper declarations: 31
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 380
semantic method rows promoted: 380
control-flow lexical artifacts: 628 (`if`: 623, `for`: 3, `while`: 2)
local/listener/timer callbacks held outside this named method register: 0
addEventListener sites: 151
document.addEventListener sites: 2
window.addEventListener sites: 5
setTimeout calls: 14
setInterval calls: 1
clearInterval calls: 1
requestAnimationFrame calls: 11
MutationObserver references: 0
document.getElementById calls: 248
querySelector calls: 33
querySelectorAll calls: 28
document.createElement calls: 351
innerHTML writes: 40
setAttribute calls: 61
dataset writes: 15
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
runtime behavior changed: profile-scoped Nanah managed trusted-link lookup, storage, connected target chooser, and signed fanout
```

## Method Group Counts

```text
dashboardStatsFiltering: 10
dateFilterHelpers: 6
importExportDownload: 8
kidsFiltersContentControls: 18
lockNavigationAndSubscriptionFlow: 7
mainFiltersContentControls: 20
managedRowsListModeRender: 16
modalDialogHelpers: 7
nanahApplyProposalTransport: 17
nanahModeScopePolicyModal: 47
nanahSessionUiAndEnvelope: 11
nanahTargetProfileDevicePolicy: 37
nanahTrustedLinkStorage: 25
navigationAndToasts: 4
pinProfilesManager: 8
profileAccessAndManagedChild: 84
profileDropdownAndBackupControls: 11
responsiveNavigationShell: 3
routeIntentAndReleaseNotes: 4
runtimeMessagingBrowserTabs: 17
settingsSyncAccountPolicyHandlers: 2
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
| `nanahTargetProfileDevicePolicy` | 37 | Resolves Nanah target profiles, managed target chooser rows, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, connected-target fanout fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 25 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 11 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 17 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
| `pinProfilesManager` | 8 | Verifies PINs, unlocks profiles/admin, renders profile manager and profile selector, refreshes profiles, and switches active profile. | PIN/session boundary, active profile revision, profile switch rollback, and locked-profile negative fixtures. |
| `importExportDownload` | 8 | Exports/imports V3 JSON/encrypted backups, downloads through anchors, revokes blob URLs, and reloads UI after imports. | Import dry-run mutation plan, encrypted target policy, download cleanup proof, and failed-import rollback. |
| `settingsSyncAccountPolicyHandlers` | 2 | Persists account policy and derives generated account/child ids from UI input. | Account creation policy proof, conflict handling, and locked-profile negatives. |
| `managedRowsListModeRender` | 16 | Adds/removes/toggles managed child rows, renders Main/Kids lists through `RenderEngine`, applies date filters, and sends list-mode runtime messages. | Row-action mutation report, Main/Kids list-mode parity, copy/transfer proof, RenderEngine callback contract, and whitelist empty-state fixtures. |
| `dashboardStatsFiltering` | 10 | Updates setting checkboxes, filters content controls/help cards, computes dashboard counts/stats, rotates stats surfaces, and updates stat UI. | Stats source policy, interval lifecycle, no-rule render budget, and managed-child dashboard parity. |
| `dateFilterHelpers` | 6 | Applies keyword/channel date presets for Main and Kids list rendering. | Timezone boundary, date inclusion proof, and row-filter negative fixtures. |
| `navigationAndToasts` | 4 | Sets up navigation, exposes `window.switchView`, updates hash/title/view state, and renders success toasts. | Navigation state contract, global export policy, toast cleanup proof, and route access fixtures. |

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
| 3062 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3088 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3104 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3106 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3120 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3141 | `function` | `normalizeManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3167 | `function` | `getPersistedManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3178 | `function` | `getManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3203 | `function` | `isManagedAdminUnlockRateLimited` | `profileAccessAndManagedChild` |
| 3207 | `async function` | `persistManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3242 | `async function` | `recordManagedAdminUnlockFailure` | `profileAccessAndManagedChild` |
| 3263 | `async function` | `clearManagedAdminUnlockFailures` | `profileAccessAndManagedChild` |
| 3304 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3308 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3312 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3316 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3320 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3324 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3350 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3376 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3402 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3412 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3425 | `const arrow` | `finish` | `runtimeMessagingBrowserTabs` |
| 3430 | `const arrow` | `handleRuntimeError` | `runtimeMessagingBrowserTabs` |
| 3469 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3478 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3494 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3504 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3521 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3525 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3576 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3590 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3599 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3605 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3615 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3639 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3643 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3655 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3696 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3705 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3797 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3817 | `function` | `getProfileColors` | `subscriptionsImportBridge` |
| 3834 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3840 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3857 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3904 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3913 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3915 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 3954 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3976 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 3997 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 4070 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 4105 | `function` | `extractMasterPinVerifier` | `profileDropdownAndBackupControls` |
| 4114 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 4123 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 4130 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 4139 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 4151 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 4161 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 4194 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4207 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4218 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4232 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4243 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4256 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4269 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4281 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4289 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4297 | `function` | `normalizeNonNegativeInteger` | `profileAccessAndManagedChild` |
| 4303 | `function` | `getManagedTimeLimitTimezone` | `profileAccessAndManagedChild` |
| 4312 | `function` | `getManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4341 | `function` | `buildLocalPolicyHash` | `profileAccessAndManagedChild` |
| 4350 | `function` | `buildManagedTimeLimitPolicyHash` | `profileAccessAndManagedChild` |
| 4354 | `function` | `buildManagedLocalEditPolicyHash` | `profileAccessAndManagedChild` |
| 4358 | `function` | `buildManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4401 | `function` | `managedTimeLimitLabel` | `profileAccessAndManagedChild` |
| 4412 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4421 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4427 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4441 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4467 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4494 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4519 | `function` | `localManagedEditPolicyRevisionStore` | `profileAccessAndManagedChild` |
| 4525 | `function` | `countEnabledFlags` | `profileAccessAndManagedChild` |
| 4529 | `function` | `summarizeManagedChildSurface` | `profileAccessAndManagedChild` |
| 4557 | `function` | `buildManagedChildLocalEditReport` | `profileAccessAndManagedChild` |
| 4607 | `function` | `recordManagedChildLocalEditHistory` | `profileAccessAndManagedChild` |
| 4627 | `async function` | `recordManagedAdminAuthFailureHistory` | `profileAccessAndManagedChild` |
| 4682 | `function` | `getManagedActionHistoryRows` | `profileAccessAndManagedChild` |
| 4688 | `function` | `managedActionHistoryRowIsProtected` | `profileAccessAndManagedChild` |
| 4694 | `function` | `canViewManagedActionHistory` | `profileAccessAndManagedChild` |
| 4700 | `function` | `formatManagedActionHistoryRow` | `profileAccessAndManagedChild` |
| 4715 | `function` | `managedPolicyRevisionLabel` | `profileAccessAndManagedChild` |
| 4724 | `function` | `summarizeManagedPolicyStateForProfile` | `profileAccessAndManagedChild` |
| 4761 | `function` | `buildManagedProfileStatusText` | `profileAccessAndManagedChild` |
| 4785 | `async function` | `showManagedActionHistory` | `profileAccessAndManagedChild` |
| 4835 | `async function` | `clearManagedActionHistory` | `profileAccessAndManagedChild` |
| 4908 | `function` | `getManagedNanahPolicyAcceptedState` | `profileAccessAndManagedChild` |
| 4918 | `function` | `findNanahTrustedLinkForManagedEnvelope` | `profileAccessAndManagedChild` |
| 4934 | `function` | `buildNanahManagedValidationTrustedLink` | `profileAccessAndManagedChild` |
| 4958 | `function` | `getNanahManagedDuplicateDeviceIds` | `profileAccessAndManagedChild` |
| 4977 | `function` | `buildManagedNanahPolicyValidationContext` | `profileAccessAndManagedChild` |
| 5001 | `function` | `summarizeManagedNanahPolicyEnvelope` | `profileAccessAndManagedChild` |
| 5020 | `function` | `resolveManagedRemoteHistoryActionType` | `profileAccessAndManagedChild` |
| 5032 | `async function` | `recordManagedNanahPolicyValidationHistory` | `profileAccessAndManagedChild` |
| 5106 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 5111 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 5117 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 5121 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 5151 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 5219 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 5223 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 5245 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 5285 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 5291 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 5303 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 5348 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 5361 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 5423 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 5427 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 5438 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 5444 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 5498 | `async function` | `updateProfileTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 5576 | `function` | `isUiLocked` | `profileAccessAndManagedChild` |
| 5585 | `function` | `getActiveProfileType` | `profileAccessAndManagedChild` |
| 5591 | `function` | `getNanahProfileTypeLabel` | `profileAccessAndManagedChild` |
| 5596 | `function` | `getNanahLocalProfileContext` | `profileAccessAndManagedChild` |
| 5608 | `function` | `getNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5628 | `function` | `normalizeNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5634 | `function` | `isNanahChildReplicaOnly` | `profileAccessAndManagedChild` |
| 5639 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 5685 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 5720 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 5798 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 6000 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 6018 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 6046 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 6123 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 6174 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6181 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6224 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 6269 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6276 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6310 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 6326 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 6330 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 6337 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 6351 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 6360 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 6366 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6373 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 6391 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 6396 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 6403 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 6410 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 6414 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 6422 | `function` | `getNanahManagedPolicyScopeList` | `nanahModeScopePolicyModal` |
| 6440 | `function` | `getNanahManagedSendScopeList` | `nanahModeScopePolicyModal` |
| 6460 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6468 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 6482 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 6486 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 6493 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 6497 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 6504 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 6510 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 6517 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 6523 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 6530 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 6536 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 6540 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6547 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 6551 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 6555 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 6570 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 6584 | `function` | `expandNanahManagedSendScope` | `nanahModeScopePolicyModal` |
| 6590 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 6594 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 7023 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 7061 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 7086 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 7093 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 7145 | `function` | `buildNanahProfileScopedLinkId` | `nanahModeScopePolicyModal` |
| 7152 | `function` | `getNanahTrustedLinkTargetProfileId` | `nanahModeScopePolicyModal` |
| 7164 | `function` | `getNanahTrustedLinkIdentityKey` | `nanahModeScopePolicyModal` |
| 7169 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7173 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7189 | `function` | `normalizeNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 7194 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7198 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7278 | `function` | `getManagedNanahLinkPolicy` | `nanahModeScopePolicyModal` |
| 7284 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 7298 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7339 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 7369 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7379 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7395 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 7399 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7406 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7434 | `function` | `getNanahSelectedManagedTargetLinkIds` | `nanahTargetProfileDevicePolicy` |
| 7441 | `function` | `getNanahEligibleManagedTargetLinks` | `nanahTargetProfileDevicePolicy` |
| 7462 | `function` | `getNanahManagedTargetLabel` | `nanahTargetProfileDevicePolicy` |
| 7470 | `function` | `syncNanahManagedTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7533 | `function` | `getNanahSelectedManagedTargetLinks` | `nanahTargetProfileDevicePolicy` |
| 7541 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 7557 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 7562 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 7572 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 7587 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 7592 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7596 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7608 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7620 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7638 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7647 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 7653 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 7688 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 7695 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 7709 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7725 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7731 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7735 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7739 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 7749 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 7771 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 7807 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 7832 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 7880 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 7943 | `function` | `findNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7969 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 7993 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 8013 | `function` | `normalizeNanahManagedSigningPublicDescriptor` | `nanahTrustedLinkStorage` |
| 8033 | `function` | `normalizeNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8046 | `async function` | `persistNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8061 | `async function` | `loadNanahManagedSigningKeyDescriptor` | `nanahTrustedLinkStorage` |
| 8079 | `async function` | `ensureNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8098 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8107 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8111 | `function` | `buildManagedTrustRevocationHistoryRow` | `nanahTrustedLinkStorage` |
| 8140 | `async function` | `purgeNanahManagedPolicyStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8202 | `async function` | `purgeNanahManagedOpenSyncStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8218 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8252 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8262 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 8285 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 8302 | `async function` | `loadNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8306 | `async function` | `persistNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8311 | `function` | `createNanahManagedOpenSyncHelper` | `nanahTrustedLinkStorage` |
| 8316 | `function` | `formatNanahManagedOpenSyncStatus` | `nanahTrustedLinkStorage` |
| 8320 | `async function` | `runNanahManagedOpenSync` | `nanahTrustedLinkStorage` |
| 8338 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8384 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 8435 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8656 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 8693 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 8808 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 8913 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 9029 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 9045 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 9074 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 9092 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 9123 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 9187 | `function` | `parseNanahEnvelopeDetails` | `nanahSessionUiAndEnvelope` |
| 9256 | `function` | `shouldAutoApplyNanahProposal` | `nanahSessionUiAndEnvelope` |
| 9270 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 9289 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 9318 | `async function` | `handleNanahIncomingManagedPolicyEnvelope` | `nanahApplyProposalTransport` |
| 9372 | `async function` | `handleNanahIncomingManagedMailboxItem` | `nanahApplyProposalTransport` |
| 9434 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 9482 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 9504 | `function` | `getNanahActiveManagedSurface` | `nanahApplyProposalTransport` |
| 9516 | `function` | `getNanahManagedPolicySourceProfile` | `nanahApplyProposalTransport` |
| 9561 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 9578 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 9587 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 9658 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 9673 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 9928 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 10010 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 10092 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 10216 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 10246 | `async function` | `verifyPin` | `pinProfilesManager` |
| 10254 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 10300 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 10307 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 10319 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 10379 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 10789 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 10812 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 11001 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 11016 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 11043 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 11085 | `async function` | `runExportV3` | `importExportDownload` |
| 11115 | `const arrow` | `safePart` | `importExportDownload` |
| 11149 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 11197 | `const arrow` | `safePart` | `importExportDownload` |
| 11230 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 11736 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 11846 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 11955 | `const arrow` | `makeIdPart` | `managedRowsListModeRender` |
| 12281 | `function` | `toDateInputValue` | `dateFilterHelpers` |
| 12289 | `function` | `parseDateInput` | `dateFilterHelpers` |
| 12302 | `function` | `applyPresetToDateControls` | `managedRowsListModeRender` |
| 12328 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 12343 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 12356 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 12371 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 12386 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 12406 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 12419 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 12436 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 12454 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 12472 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 12491 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 12510 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 12520 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 12546 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 12555 | `const arrow` | `whitelistEmpty` | `dashboardStatsFiltering` |
| 12688 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 12710 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 12731 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 12758 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 12769 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 12807 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 12842 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 12862 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 12871 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 12912 | `function` | `updateStats` | `dateFilterHelpers` |
| 13086 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 13201 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 13282 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 13364 | `function` | `updateKidsChannelDateFilterFromInputs` | `navigationAndToasts` |
| 13511 | `function` | `setupNavigation` | `navigationAndToasts` |
| 13533 | `function` | `switchView` | `navigationAndToasts` |
| 13621 | `function` | `showSuccessToast` | `navigationAndToasts` |

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
method semantic proof gap files covered: 73
method semantic proof gap lexical callables covered: 6161
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6161
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
