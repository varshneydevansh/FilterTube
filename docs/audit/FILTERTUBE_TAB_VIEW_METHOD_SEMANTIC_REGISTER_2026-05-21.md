# FilterTube Tab View Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

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
source split lines: 12333
source wc -l: 12332
source bytes: 560297
source sha256: 1d51ba59aaee4296e56a8371426e5d7ad0ca9aee43cc533827909137bf41247e
broad lexical callable matches: 915
named declarations: 340
plain function declarations: 234
async function declarations: 75
const arrow helper declarations: 29
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 340
semantic method rows promoted: 340
control-flow lexical artifacts: 575 (`if`: 571, `for`: 2, `while`: 2)
local/listener/timer callbacks held outside this named method register: 0
addEventListener sites: 150
document.addEventListener sites: 2
window.addEventListener sites: 5
setTimeout calls: 14
setInterval calls: 1
clearInterval calls: 1
requestAnimationFrame calls: 11
MutationObserver references: 0
document.getElementById calls: 242
querySelector calls: 30
querySelectorAll calls: 27
document.createElement calls: 336
innerHTML writes: 39
setAttribute calls: 61
dataset writes: 13
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
runtime behavior changed: no
```

## Method Group Counts

```text
dashboardStatsFiltering: 10
dateFilterHelpers: 7
importExportDownload: 8
kidsFiltersContentControls: 18
lockNavigationAndSubscriptionFlow: 14
mainFiltersContentControls: 20
managedRowsListModeRender: 15
modalDialogHelpers: 7
nanahApplyProposalTransport: 16
nanahModeScopePolicyModal: 40
nanahSessionUiAndEnvelope: 9
nanahTargetProfileDevicePolicy: 32
nanahTrustedLinkStorage: 12
navigationAndToasts: 3
pinProfilesManager: 8
profileAccessAndManagedChild: 66
profileDropdownAndBackupControls: 11
responsiveNavigationShell: 3
routeIntentAndReleaseNotes: 4
runtimeMessagingBrowserTabs: 17
settingsSyncAccountPolicyHandlers: 3
subscriptionsImportBridge: 17
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `responsiveNavigationShell` | 3 | Binds the mobile nav toggle, overlay close, and resize close behavior. | Duplicate-listener proof, viewport route fixtures, and teardown policy. |
| `mainFiltersContentControls` | 20 | Builds Main keyword/channel/content/category/video filter UI and schedules content/category saves. | Settings dependency parity, debounce budget, managed-child override proof, selector ownership, and false-hide negative fixtures. |
| `kidsFiltersContentControls` | 18 | Builds Kids keyword/channel/content/category/video filter UI and sync-related content controls. | Kids/Main mode parity, sync-to-main proof, child lock proof, and Kids-specific negative fixtures. |
| `routeIntentAndReleaseNotes` | 4 | Resolves hash/query navigation intent and loads release notes into the dashboard. | Route intent authority, release-note content provenance, and fallback route proof. |
| `runtimeMessagingBrowserTabs` | 17 | Wraps extension runtime messaging, auto-backup scheduling, session PIN notifications, browser tab queries, tab creation/update, active tab lookup, and tab messages. | Sender/result contract, lastError policy, backup trigger budget, session lock report, and browser API negative fixtures. |
| `subscriptionsImportBridge` | 17 | Selects and prepares YouTube subscription tabs, injects/pings the import receiver, waits for readiness, and renders import status. | Tab trust, URL allowlist, wait timeout budget, receiver idempotence, and import failure fixtures. |
| `profileDropdownAndBackupControls` | 11 | Renders profile selector/dropdown state, positions the dropdown, resets scroll, and syncs auto-backup policy controls. | Dropdown lifecycle teardown, scroll restoration proof, and backup policy/source metadata. |
| `profileAccessAndManagedChild` | 66 | Models profile type/access, parent-child relationships, managed child edit surfaces, child editor banners, admin controls, and viewing access updates. | Profile revision report, managed-child mutation contract, parent authority proof, lock/session negatives, and rollback proof. |
| `lockNavigationAndSubscriptionFlow` | 14 | Applies lock and child navigation gates, imports subscribed channels, enables whitelist after import, and updates subscription progress. | Lock gate authority, list-mode transfer proof, import whitelist negative fixtures, and navigation access parity. |
| `modalDialogHelpers` | 7 | Creates prompt and choice modals with cleanup and escape handling. | Focus trap, keyboard teardown, duplicate modal guard, and accessibility fixtures. |
| `nanahModeScopePolicyModal` | 40 | Normalizes Nanah mode/scope/strategy labels, child protections, managed-link modal policy, and trusted-link normalization. | Sync policy authority, managed-link permission proof, child/parent scope negatives, and remote capability fixtures. |
| `nanahTargetProfileDevicePolicy` | 32 | Resolves Nanah target profiles, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 12 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 9 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 16 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
| `pinProfilesManager` | 8 | Verifies PINs, unlocks profiles/admin, renders profile manager and profile selector, refreshes profiles, and switches active profile. | PIN/session boundary, active profile revision, profile switch rollback, and locked-profile negative fixtures. |
| `importExportDownload` | 8 | Exports/imports V3 JSON/encrypted backups, downloads through anchors, revokes blob URLs, and reloads UI after imports. | Import dry-run mutation plan, encrypted target policy, download cleanup proof, and failed-import rollback. |
| `settingsSyncAccountPolicyHandlers` | 3 | Persists account policy and derives generated account/child ids from UI input. | Account creation policy proof, conflict handling, and locked-profile negatives. |
| `managedRowsListModeRender` | 15 | Adds/removes/toggles managed child rows, renders Main/Kids lists through `RenderEngine`, applies date filters, and sends list-mode runtime messages. | Row-action mutation report, Main/Kids list-mode parity, copy/transfer proof, RenderEngine callback contract, and whitelist empty-state fixtures. |
| `dashboardStatsFiltering` | 10 | Updates setting checkboxes, filters content controls/help cards, computes dashboard counts/stats, rotates stats surfaces, and updates stat UI. | Stats source policy, interval lifecycle, no-rule render budget, and managed-child dashboard parity. |
| `dateFilterHelpers` | 7 | Applies keyword/channel date presets for Main and Kids list rendering. | Timezone boundary, date inclusion proof, and row-filter negative fixtures. |
| `navigationAndToasts` | 3 | Sets up navigation, exposes `window.switchView`, updates hash/title/view state, and renders success toasts. | Navigation state contract, global export policy, toast cleanup proof, and route access fixtures. |

## Current Named Method Inventory

| Source line | Declaration kind | Name | Semantic group |
| --- | --- | --- | --- |
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
| 3044 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3070 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3086 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3088 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3102 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3114 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3118 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3122 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3126 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3130 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3134 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3160 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3186 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3212 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3222 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3235 | `const arrow` | `finish` | `runtimeMessagingBrowserTabs` |
| 3240 | `const arrow` | `handleRuntimeError` | `runtimeMessagingBrowserTabs` |
| 3279 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3288 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3304 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3314 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3331 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3335 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3386 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3400 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3409 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3415 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3425 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3449 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3453 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3465 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3506 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3515 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3607 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3627 | `function` | `getProfileColors` | `profileDropdownAndBackupControls` |
| 3644 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3650 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3667 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3714 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3723 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3725 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 3764 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3786 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 3807 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 3880 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 3915 | `function` | `extractMasterPinVerifier` | `profileAccessAndManagedChild` |
| 3924 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 3933 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 3940 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 3949 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 3961 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 3971 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 4004 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4017 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4028 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4042 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4053 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4066 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4079 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4091 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4099 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4107 | `function` | `normalizeNonNegativeInteger` | `profileAccessAndManagedChild` |
| 4113 | `function` | `getManagedTimeLimitTimezone` | `profileAccessAndManagedChild` |
| 4122 | `function` | `getManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4151 | `function` | `buildLocalPolicyHash` | `profileAccessAndManagedChild` |
| 4160 | `function` | `buildManagedTimeLimitPolicyHash` | `profileAccessAndManagedChild` |
| 4164 | `function` | `buildManagedLocalEditPolicyHash` | `profileAccessAndManagedChild` |
| 4168 | `function` | `buildManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4211 | `function` | `managedTimeLimitLabel` | `profileAccessAndManagedChild` |
| 4222 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4231 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4237 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4251 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4277 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4303 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4328 | `function` | `localManagedEditPolicyRevisionStore` | `profileAccessAndManagedChild` |
| 4334 | `function` | `countEnabledFlags` | `profileAccessAndManagedChild` |
| 4338 | `function` | `summarizeManagedChildSurface` | `profileAccessAndManagedChild` |
| 4366 | `function` | `buildManagedChildLocalEditReport` | `profileAccessAndManagedChild` |
| 4416 | `function` | `recordManagedChildLocalEditHistory` | `profileAccessAndManagedChild` |
| 4436 | `function` | `getManagedActionHistoryRows` | `profileAccessAndManagedChild` |
| 4442 | `function` | `managedActionHistoryRowIsProtected` | `profileAccessAndManagedChild` |
| 4448 | `function` | `canViewManagedActionHistory` | `profileAccessAndManagedChild` |
| 4454 | `function` | `formatManagedActionHistoryRow` | `profileAccessAndManagedChild` |
| 4469 | `async function` | `showManagedActionHistory` | `profileAccessAndManagedChild` |
| 4516 | `async function` | `clearManagedActionHistory` | `profileAccessAndManagedChild` |
| 4560 | `function` | `getManagedNanahPolicyAcceptedState` | `profileAccessAndManagedChild` |
| 4570 | `function` | `findNanahTrustedLinkForManagedEnvelope` | `profileAccessAndManagedChild` |
| 4579 | `function` | `buildNanahManagedValidationTrustedLink` | `profileAccessAndManagedChild` |
| 4602 | `function` | `getNanahManagedDuplicateDeviceIds` | `profileAccessAndManagedChild` |
| 4615 | `function` | `buildManagedNanahPolicyValidationContext` | `profileAccessAndManagedChild` |
| 4634 | `function` | `summarizeManagedNanahPolicyEnvelope` | `profileAccessAndManagedChild` |
| 4653 | `async function` | `recordManagedNanahPolicyValidationHistory` | `profileAccessAndManagedChild` |
| 4718 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 4723 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 4729 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 4733 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 4763 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 4831 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 4835 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 4857 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 4897 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 4903 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 4915 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 4957 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 4970 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 5032 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 5036 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 5047 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 5053 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 5104 | `async function` | `updateProfileTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 5179 | `function` | `isUiLocked` | `lockNavigationAndSubscriptionFlow` |
| 5188 | `function` | `getActiveProfileType` | `lockNavigationAndSubscriptionFlow` |
| 5194 | `function` | `getNanahProfileTypeLabel` | `lockNavigationAndSubscriptionFlow` |
| 5199 | `function` | `getNanahLocalProfileContext` | `lockNavigationAndSubscriptionFlow` |
| 5211 | `function` | `getNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 5231 | `function` | `normalizeNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 5237 | `function` | `isNanahChildReplicaOnly` | `lockNavigationAndSubscriptionFlow` |
| 5242 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 5288 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 5323 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 5401 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 5603 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 5621 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 5649 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 5726 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 5777 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 5784 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 5827 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 5872 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 5879 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 5913 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 5929 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 5933 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 5940 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 5954 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 5963 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 5969 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 5976 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 5983 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 5988 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 5995 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 6002 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 6006 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 6014 | `function` | `getNanahManagedPolicyScopeList` | `nanahModeScopePolicyModal` |
| 6030 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6038 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 6051 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 6055 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 6062 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 6066 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 6073 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 6079 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 6086 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 6092 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 6099 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 6105 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 6109 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6116 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 6120 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 6124 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 6139 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 6147 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 6151 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 6560 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 6595 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 6620 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 6627 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 6679 | `function` | `normalizeNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6684 | `const arrow` | `localRole` | `nanahModeScopePolicyModal` |
| 6688 | `const arrow` | `remoteRole` | `nanahModeScopePolicyModal` |
| 6743 | `function` | `getManagedNanahLinkPolicy` | `nanahModeScopePolicyModal` |
| 6749 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 6754 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6795 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 6825 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6835 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6851 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 6855 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6862 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 6890 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 6906 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 6911 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 6921 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 6936 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 6941 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 6945 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6957 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6969 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6987 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6996 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 7002 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 7037 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 7044 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 7058 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7074 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7080 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7084 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7088 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 7098 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 7106 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 7142 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 7167 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 7215 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 7278 | `function` | `findNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7284 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 7308 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 7328 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7337 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7341 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7368 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7376 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 7399 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 7407 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7452 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 7503 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7712 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 7749 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 7864 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 7942 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 8058 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 8070 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 8099 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 8117 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 8148 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 8212 | `function` | `parseNanahEnvelopeDetails` | `nanahApplyProposalTransport` |
| 8281 | `function` | `shouldAutoApplyNanahProposal` | `nanahApplyProposalTransport` |
| 8290 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 8309 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 8338 | `async function` | `handleNanahIncomingManagedPolicyEnvelope` | `nanahApplyProposalTransport` |
| 8366 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 8407 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 8429 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 8446 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 8455 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 8526 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 8541 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 8772 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 8830 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 8904 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 8990 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 9020 | `async function` | `verifyPin` | `pinProfilesManager` |
| 9028 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 9063 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 9070 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 9082 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 9142 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 9542 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 9565 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 9753 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 9768 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 9795 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 9837 | `async function` | `runExportV3` | `importExportDownload` |
| 9867 | `const arrow` | `safePart` | `importExportDownload` |
| 9901 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 9949 | `const arrow` | `safePart` | `importExportDownload` |
| 9982 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 10436 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 10546 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 10655 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 10982 | `function` | `toDateInputValue` | `dateFilterHelpers` |
| 10990 | `function` | `parseDateInput` | `dateFilterHelpers` |
| 11003 | `function` | `applyPresetToDateControls` | `dateFilterHelpers` |
| 11029 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 11044 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 11057 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 11072 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 11087 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 11107 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 11120 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 11137 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 11155 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 11173 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 11192 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 11211 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 11221 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 11247 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 11256 | `const arrow` | `whitelistEmpty` | `managedRowsListModeRender` |
| 11389 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 11411 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 11432 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 11459 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 11470 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 11508 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 11543 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 11563 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 11572 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 11613 | `function` | `updateStats` | `dashboardStatsFiltering` |
| 11787 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 11902 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 11983 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 12065 | `function` | `updateKidsChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 12212 | `function` | `setupNavigation` | `navigationAndToasts` |
| 12234 | `function` | `switchView` | `navigationAndToasts` |
| 12322 | `function` | `showSuccessToast` | `navigationAndToasts` |

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
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
