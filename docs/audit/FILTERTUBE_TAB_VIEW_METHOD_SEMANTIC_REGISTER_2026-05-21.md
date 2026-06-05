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
source split lines: 14270
source wc -l: 14269
source bytes: 663047
source sha256: 7515fbce26e7718b820e35bc5b77bc2d8298cb7dacc3aa1421e671894028d867
broad lexical callable matches: 1048
named declarations: 397
plain function declarations: 267
async function declarations: 97
const arrow helper declarations: 31
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 397
semantic method rows promoted: 397
control-flow lexical artifacts: 651 (`if`: 644, `for`: 5, `while`: 2)
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
document.createElement calls: 354
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
dateFilterHelpers: 7
importExportDownload: 8
kidsFiltersContentControls: 18
lockNavigationAndSubscriptionFlow: 7
mainFiltersContentControls: 20
managedRowsListModeRender: 15
modalDialogHelpers: 7
nanahApplyProposalTransport: 20
nanahModeScopePolicyModal: 47
nanahSessionUiAndEnvelope: 12
nanahTargetProfileDevicePolicy: 37
nanahTrustedLinkStorage: 36
navigationAndToasts: 3
pinProfilesManager: 8
profileAccessAndManagedChild: 86
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
| `profileAccessAndManagedChild` | 86 | Models profile type/access, parent-child relationships, managed child edit surfaces, child editor banners, admin controls, and viewing access updates. | Profile revision report, managed-child mutation contract, parent authority proof, lock/session negatives, and rollback proof. |
| `lockNavigationAndSubscriptionFlow` | 7 | Applies lock and child navigation gates, imports subscribed channels, enables whitelist after import, and updates subscription progress. | Lock gate authority, list-mode transfer proof, import whitelist negative fixtures, and navigation access parity. |
| `modalDialogHelpers` | 7 | Creates prompt and choice modals with cleanup and escape handling. | Focus trap, keyboard teardown, duplicate modal guard, and accessibility fixtures. |
| `nanahModeScopePolicyModal` | 47 | Normalizes Nanah mode/scope/strategy labels, child protections, managed-link modal policy, and trusted-link normalization. | Sync policy authority, managed-link permission proof, child/parent scope negatives, and remote capability fixtures. |
| `nanahTargetProfileDevicePolicy` | 37 | Resolves Nanah target profiles, managed target chooser rows, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, connected-target fanout fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 36 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 12 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 20 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
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
| 3093 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3119 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3135 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3137 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3151 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3172 | `function` | `normalizeManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3201 | `function` | `getPersistedManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3212 | `function` | `getManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3237 | `function` | `isManagedAdminUnlockRateLimited` | `profileAccessAndManagedChild` |
| 3241 | `async function` | `persistManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3276 | `async function` | `recordManagedAdminUnlockFailure` | `profileAccessAndManagedChild` |
| 3297 | `async function` | `clearManagedAdminUnlockFailures` | `profileAccessAndManagedChild` |
| 3354 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3358 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3362 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3366 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3370 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3374 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3400 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3426 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3452 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3462 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3475 | `const arrow` | `finish` | `runtimeMessagingBrowserTabs` |
| 3480 | `const arrow` | `handleRuntimeError` | `runtimeMessagingBrowserTabs` |
| 3519 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3528 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3544 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3554 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3571 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3575 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3626 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3640 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3649 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3655 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3665 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3689 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3693 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3705 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3746 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3755 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3847 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3867 | `function` | `getProfileColors` | `subscriptionsImportBridge` |
| 3884 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3890 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3907 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3954 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3963 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3965 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 4004 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 4026 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 4047 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 4120 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 4155 | `function` | `extractMasterPinVerifier` | `profileDropdownAndBackupControls` |
| 4164 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 4173 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 4180 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 4189 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 4201 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 4211 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 4244 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4257 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4268 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4282 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4293 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4306 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4319 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4331 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4339 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4347 | `function` | `normalizeNonNegativeInteger` | `profileAccessAndManagedChild` |
| 4353 | `function` | `getManagedTimeLimitTimezone` | `profileAccessAndManagedChild` |
| 4362 | `function` | `getManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4391 | `function` | `buildLocalPolicyHash` | `profileAccessAndManagedChild` |
| 4400 | `function` | `buildManagedTimeLimitPolicyHash` | `profileAccessAndManagedChild` |
| 4404 | `function` | `buildManagedLocalEditPolicyHash` | `profileAccessAndManagedChild` |
| 4408 | `function` | `buildManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4451 | `function` | `managedTimeLimitLabel` | `profileAccessAndManagedChild` |
| 4462 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4477 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4483 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4497 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4523 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4550 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4575 | `function` | `localManagedEditPolicyRevisionStore` | `profileAccessAndManagedChild` |
| 4581 | `function` | `countEnabledFlags` | `profileAccessAndManagedChild` |
| 4585 | `function` | `summarizeManagedChildSurface` | `profileAccessAndManagedChild` |
| 4613 | `function` | `summarizeManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4629 | `function` | `buildManagedChildLocalEditReport` | `profileAccessAndManagedChild` |
| 4679 | `function` | `buildManagedTimeLimitLocalEditReport` | `profileAccessAndManagedChild` |
| 4728 | `function` | `recordManagedChildLocalEditHistory` | `profileAccessAndManagedChild` |
| 4748 | `async function` | `recordManagedAdminAuthFailureHistory` | `profileAccessAndManagedChild` |
| 4803 | `function` | `getManagedActionHistoryRows` | `profileAccessAndManagedChild` |
| 4809 | `function` | `managedActionHistoryRowIsProtected` | `profileAccessAndManagedChild` |
| 4815 | `function` | `canViewManagedActionHistory` | `profileAccessAndManagedChild` |
| 4821 | `function` | `formatManagedActionHistoryRow` | `profileAccessAndManagedChild` |
| 4847 | `function` | `managedPolicyRevisionLabel` | `profileAccessAndManagedChild` |
| 4856 | `function` | `summarizeManagedPolicyStateForProfile` | `profileAccessAndManagedChild` |
| 4893 | `function` | `buildManagedProfileStatusText` | `profileAccessAndManagedChild` |
| 4917 | `async function` | `showManagedActionHistory` | `profileAccessAndManagedChild` |
| 4967 | `async function` | `clearManagedActionHistory` | `profileAccessAndManagedChild` |
| 5040 | `function` | `getManagedNanahPolicyAcceptedState` | `profileAccessAndManagedChild` |
| 5050 | `function` | `findNanahTrustedLinkForManagedEnvelope` | `profileAccessAndManagedChild` |
| 5066 | `function` | `buildNanahManagedValidationTrustedLink` | `profileAccessAndManagedChild` |
| 5090 | `function` | `getNanahManagedDuplicateDeviceIds` | `profileAccessAndManagedChild` |
| 5109 | `function` | `buildManagedNanahPolicyValidationContext` | `profileAccessAndManagedChild` |
| 5133 | `function` | `summarizeManagedNanahPolicyEnvelope` | `profileAccessAndManagedChild` |
| 5152 | `function` | `resolveManagedRemoteHistoryActionType` | `profileAccessAndManagedChild` |
| 5164 | `async function` | `recordManagedNanahPolicyValidationHistory` | `profileAccessAndManagedChild` |
| 5287 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 5292 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 5298 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 5302 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 5332 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 5405 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 5409 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 5431 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 5471 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 5477 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 5489 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 5534 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 5547 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 5609 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 5613 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 5624 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 5630 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 5684 | `async function` | `updateProfileTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 5768 | `function` | `isUiLocked` | `profileAccessAndManagedChild` |
| 5777 | `function` | `getActiveProfileType` | `profileAccessAndManagedChild` |
| 5783 | `function` | `getNanahProfileTypeLabel` | `profileAccessAndManagedChild` |
| 5788 | `function` | `getNanahLocalProfileContext` | `profileAccessAndManagedChild` |
| 5800 | `function` | `getNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5820 | `function` | `normalizeNanahProfileInventory` | `profileAccessAndManagedChild` |
| 5826 | `function` | `isNanahChildReplicaOnly` | `profileAccessAndManagedChild` |
| 5831 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 5877 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 5912 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 5990 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 6192 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 6210 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 6238 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 6315 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 6366 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6373 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6416 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 6461 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6468 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6502 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 6518 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 6522 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 6529 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 6543 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 6552 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 6558 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6565 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 6583 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 6588 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 6595 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 6602 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 6606 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 6614 | `function` | `getNanahManagedPolicyScopeList` | `nanahModeScopePolicyModal` |
| 6636 | `function` | `getNanahManagedSendScopeList` | `nanahModeScopePolicyModal` |
| 6656 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6664 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 6678 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 6682 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 6689 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 6693 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 6700 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 6706 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 6713 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 6719 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 6726 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 6732 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 6736 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6743 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 6747 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 6751 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 6766 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 6780 | `function` | `expandNanahManagedSendScope` | `nanahModeScopePolicyModal` |
| 6787 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 6791 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 7220 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 7258 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 7283 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 7290 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 7342 | `function` | `buildNanahProfileScopedLinkId` | `nanahModeScopePolicyModal` |
| 7349 | `function` | `getNanahTrustedLinkTargetProfileId` | `nanahModeScopePolicyModal` |
| 7361 | `function` | `getNanahTrustedLinkIdentityKey` | `nanahModeScopePolicyModal` |
| 7366 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7370 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7386 | `function` | `normalizeNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 7391 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 7395 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 7475 | `function` | `getManagedNanahLinkPolicy` | `nanahModeScopePolicyModal` |
| 7481 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 7495 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7536 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 7566 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7576 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7592 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 7596 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7603 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7631 | `function` | `getNanahSelectedManagedTargetLinkIds` | `nanahTargetProfileDevicePolicy` |
| 7638 | `function` | `getNanahEligibleManagedTargetLinks` | `nanahTargetProfileDevicePolicy` |
| 7659 | `function` | `getNanahManagedTargetLabel` | `nanahTargetProfileDevicePolicy` |
| 7667 | `function` | `syncNanahManagedTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7730 | `function` | `getNanahSelectedManagedTargetLinks` | `nanahTargetProfileDevicePolicy` |
| 7738 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 7754 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 7759 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 7769 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 7784 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 7789 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7793 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7805 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7817 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7835 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7844 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 7850 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 7885 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 7892 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 7906 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7922 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7928 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7932 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7936 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 7946 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 7968 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 8004 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 8029 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 8077 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 8140 | `function` | `findNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8166 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 8190 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 8210 | `function` | `normalizeNanahManagedSigningPublicDescriptor` | `nanahTrustedLinkStorage` |
| 8230 | `function` | `normalizeNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8243 | `async function` | `persistNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8258 | `async function` | `loadNanahManagedSigningKeyDescriptor` | `nanahTrustedLinkStorage` |
| 8276 | `async function` | `ensureNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 8295 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8304 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 8308 | `function` | `buildManagedTrustRevocationHistoryRow` | `nanahTrustedLinkStorage` |
| 8337 | `async function` | `purgeNanahManagedPolicyStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8399 | `async function` | `purgeNanahManagedOpenSyncStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8415 | `async function` | `purgeNanahManagedLocalNetworkSyncStateForTrustedLink` | `nanahTrustedLinkStorage` |
| 8431 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8465 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8476 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 8499 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 8516 | `async function` | `loadNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8520 | `async function` | `persistNanahManagedOpenSyncState` | `nanahTrustedLinkStorage` |
| 8525 | `async function` | `recordManagedOpenSyncAckHistory` | `nanahTrustedLinkStorage` |
| 8612 | `function` | `createNanahManagedOpenSyncHelper` | `nanahTrustedLinkStorage` |
| 8617 | `function` | `formatNanahManagedOpenSyncStatus` | `nanahTrustedLinkStorage` |
| 8621 | `async function` | `runNanahManagedOpenSync` | `nanahTrustedLinkStorage` |
| 8640 | `async function` | `loadNanahManagedLocalNetworkSyncState` | `nanahTrustedLinkStorage` |
| 8644 | `async function` | `persistNanahManagedLocalNetworkSyncState` | `nanahTrustedLinkStorage` |
| 8649 | `function` | `getNanahManagedLocalNetworkProvider` | `nanahTrustedLinkStorage` |
| 8653 | `function` | `resolveNanahManagedLocalNetworkTargetProfileId` | `nanahTrustedLinkStorage` |
| 8661 | `function` | `buildNanahManagedLocalNetworkDiscoveryRequest` | `nanahTrustedLinkStorage` |
| 8681 | `function` | `getNanahManagedLocalNetworkEligibleLinks` | `nanahTrustedLinkStorage` |
| 8704 | `async function` | `pullNanahManagedLocalNetworkCandidates` | `nanahTrustedLinkStorage` |
| 8729 | `function` | `formatNanahManagedLocalNetworkSyncStatus` | `nanahTrustedLinkStorage` |
| 8748 | `async function` | `runNanahManagedLocalNetworkSync` | `nanahTrustedLinkStorage` |
| 8806 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 8852 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 8903 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 9134 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 9171 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 9286 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 9391 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 9507 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 9523 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 9552 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 9570 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 9601 | `function` | `hasRevisionBoundManagedPolicyDetails` | `nanahSessionUiAndEnvelope` |
| 9615 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 9682 | `function` | `parseNanahEnvelopeDetails` | `nanahSessionUiAndEnvelope` |
| 9751 | `function` | `shouldAutoApplyNanahProposal` | `nanahSessionUiAndEnvelope` |
| 9765 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 9784 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 9813 | `async function` | `handleNanahIncomingManagedPolicyEnvelope` | `nanahApplyProposalTransport` |
| 9872 | `async function` | `handleNanahIncomingManagedMailboxItem` | `nanahApplyProposalTransport` |
| 9934 | `async function` | `handleNanahIncomingManagedLocalNetworkCandidate` | `nanahApplyProposalTransport` |
| 10003 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 10052 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 10074 | `function` | `getNanahActiveManagedSurface` | `nanahApplyProposalTransport` |
| 10086 | `function` | `getNanahManagedPolicySourceProfile` | `nanahApplyProposalTransport` |
| 10131 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 10148 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 10157 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 10228 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 10243 | `async function` | `sendNanahManagedLivePolicyAck` | `nanahApplyProposalTransport` |
| 10257 | `async function` | `handleNanahIncomingManagedLiveAck` | `nanahApplyProposalTransport` |
| 10272 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 10527 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 10617 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 10699 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 10823 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 10853 | `async function` | `verifyPin` | `pinProfilesManager` |
| 10861 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 10907 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 10914 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 10926 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 10986 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 11422 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 11445 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 11635 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 11650 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 11677 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 11719 | `async function` | `runExportV3` | `importExportDownload` |
| 11749 | `const arrow` | `safePart` | `importExportDownload` |
| 11783 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 11831 | `const arrow` | `safePart` | `importExportDownload` |
| 11864 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 12372 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 12482 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 12591 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 12917 | `function` | `toDateInputValue` | `dateFilterHelpers` |
| 12925 | `function` | `parseDateInput` | `dateFilterHelpers` |
| 12938 | `function` | `applyPresetToDateControls` | `managedRowsListModeRender` |
| 12964 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 12979 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 12992 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 13007 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 13022 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 13042 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 13055 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 13072 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 13090 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 13108 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 13127 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 13146 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 13156 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 13182 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 13191 | `const arrow` | `whitelistEmpty` | `dashboardStatsFiltering` |
| 13324 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 13346 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 13367 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 13394 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 13405 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 13443 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 13478 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 13498 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 13507 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 13548 | `function` | `updateStats` | `dateFilterHelpers` |
| 13722 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 13837 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 13918 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 14000 | `function` | `updateKidsChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 14147 | `function` | `setupNavigation` | `navigationAndToasts` |
| 14169 | `function` | `switchView` | `navigationAndToasts` |
| 14257 | `function` | `showSuccessToast` | `navigationAndToasts` |

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
method semantic proof gap lexical callables covered: 6166
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6166
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
