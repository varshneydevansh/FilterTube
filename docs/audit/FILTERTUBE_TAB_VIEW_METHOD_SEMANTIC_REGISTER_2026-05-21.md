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
source split lines: 12796
source wc -l: 12795
source bytes: 585960
source sha256: 3e52cf1b3b189450bb9f7b3a6ae7adb833ddc29d90a8564164314f53ced79109
broad lexical callable matches: 945
named declarations: 353
plain function declarations: 243
async function declarations: 79
const arrow helper declarations: 29
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 353
semantic method rows promoted: 353
control-flow lexical artifacts: 592 (`if`: 588, `for`: 2, `while`: 2)
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
querySelector calls: 31
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
nanahApplyProposalTransport: 17
nanahModeScopePolicyModal: 37
nanahSessionUiAndEnvelope: 10
nanahTargetProfileDevicePolicy: 37
nanahTrustedLinkStorage: 16
navigationAndToasts: 3
pinProfilesManager: 8
profileAccessAndManagedChild: 71
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
| `profileAccessAndManagedChild` | 71 | Models profile type/access, parent-child relationships, managed child edit surfaces, child editor banners, admin controls, and viewing access updates. | Profile revision report, managed-child mutation contract, parent authority proof, lock/session negatives, and rollback proof. |
| `lockNavigationAndSubscriptionFlow` | 14 | Applies lock and child navigation gates, imports subscribed channels, enables whitelist after import, and updates subscription progress. | Lock gate authority, list-mode transfer proof, import whitelist negative fixtures, and navigation access parity. |
| `modalDialogHelpers` | 7 | Creates prompt and choice modals with cleanup and escape handling. | Focus trap, keyboard teardown, duplicate modal guard, and accessibility fixtures. |
| `nanahModeScopePolicyModal` | 37 | Normalizes Nanah mode/scope/strategy labels, child protections, managed-link modal policy, and trusted-link normalization. | Sync policy authority, managed-link permission proof, child/parent scope negatives, and remote capability fixtures. |
| `nanahTargetProfileDevicePolicy` | 37 | Resolves Nanah target profiles, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 16 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 10 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 17 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
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
| 3053 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3079 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3095 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3097 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3111 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3132 | `function` | `getManagedAdminFailedUnlockState` | `profileAccessAndManagedChild` |
| 3147 | `function` | `isManagedAdminUnlockRateLimited` | `profileAccessAndManagedChild` |
| 3151 | `function` | `recordManagedAdminUnlockFailure` | `profileAccessAndManagedChild` |
| 3168 | `function` | `clearManagedAdminUnlockFailures` | `profileAccessAndManagedChild` |
| 3201 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3205 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3209 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3213 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3217 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3221 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3247 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3273 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3299 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3309 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3322 | `const arrow` | `finish` | `runtimeMessagingBrowserTabs` |
| 3327 | `const arrow` | `handleRuntimeError` | `runtimeMessagingBrowserTabs` |
| 3366 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3375 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3391 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3401 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3418 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3422 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3473 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3487 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3496 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3502 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3512 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3536 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3540 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3552 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3593 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3602 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3694 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3714 | `function` | `getProfileColors` | `profileDropdownAndBackupControls` |
| 3731 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3737 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3754 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3801 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3810 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3812 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 3851 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3873 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 3894 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 3967 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 4002 | `function` | `extractMasterPinVerifier` | `profileAccessAndManagedChild` |
| 4011 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 4020 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 4027 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 4036 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 4048 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 4058 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 4091 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4104 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4115 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4129 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4140 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4153 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4166 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4178 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4186 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4194 | `function` | `normalizeNonNegativeInteger` | `profileAccessAndManagedChild` |
| 4200 | `function` | `getManagedTimeLimitTimezone` | `profileAccessAndManagedChild` |
| 4209 | `function` | `getManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4238 | `function` | `buildLocalPolicyHash` | `profileAccessAndManagedChild` |
| 4247 | `function` | `buildManagedTimeLimitPolicyHash` | `profileAccessAndManagedChild` |
| 4251 | `function` | `buildManagedLocalEditPolicyHash` | `profileAccessAndManagedChild` |
| 4255 | `function` | `buildManagedTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 4298 | `function` | `managedTimeLimitLabel` | `profileAccessAndManagedChild` |
| 4309 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4318 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4324 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4338 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4364 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4391 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4416 | `function` | `localManagedEditPolicyRevisionStore` | `profileAccessAndManagedChild` |
| 4422 | `function` | `countEnabledFlags` | `profileAccessAndManagedChild` |
| 4426 | `function` | `summarizeManagedChildSurface` | `profileAccessAndManagedChild` |
| 4454 | `function` | `buildManagedChildLocalEditReport` | `profileAccessAndManagedChild` |
| 4504 | `function` | `recordManagedChildLocalEditHistory` | `profileAccessAndManagedChild` |
| 4524 | `async function` | `recordManagedAdminAuthFailureHistory` | `profileAccessAndManagedChild` |
| 4575 | `function` | `getManagedActionHistoryRows` | `profileAccessAndManagedChild` |
| 4581 | `function` | `managedActionHistoryRowIsProtected` | `profileAccessAndManagedChild` |
| 4587 | `function` | `canViewManagedActionHistory` | `profileAccessAndManagedChild` |
| 4593 | `function` | `formatManagedActionHistoryRow` | `profileAccessAndManagedChild` |
| 4608 | `async function` | `showManagedActionHistory` | `profileAccessAndManagedChild` |
| 4658 | `async function` | `clearManagedActionHistory` | `profileAccessAndManagedChild` |
| 4705 | `function` | `getManagedNanahPolicyAcceptedState` | `profileAccessAndManagedChild` |
| 4715 | `function` | `findNanahTrustedLinkForManagedEnvelope` | `profileAccessAndManagedChild` |
| 4724 | `function` | `buildNanahManagedValidationTrustedLink` | `profileAccessAndManagedChild` |
| 4748 | `function` | `getNanahManagedDuplicateDeviceIds` | `profileAccessAndManagedChild` |
| 4761 | `function` | `buildManagedNanahPolicyValidationContext` | `profileAccessAndManagedChild` |
| 4781 | `function` | `summarizeManagedNanahPolicyEnvelope` | `profileAccessAndManagedChild` |
| 4800 | `async function` | `recordManagedNanahPolicyValidationHistory` | `profileAccessAndManagedChild` |
| 4865 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 4870 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 4876 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 4880 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 4910 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 4978 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 4982 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 5004 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 5044 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 5050 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 5062 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 5107 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 5120 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 5182 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 5186 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 5197 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 5203 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 5257 | `async function` | `updateProfileTimeLimitPolicy` | `profileAccessAndManagedChild` |
| 5335 | `function` | `isUiLocked` | `lockNavigationAndSubscriptionFlow` |
| 5344 | `function` | `getActiveProfileType` | `lockNavigationAndSubscriptionFlow` |
| 5350 | `function` | `getNanahProfileTypeLabel` | `lockNavigationAndSubscriptionFlow` |
| 5355 | `function` | `getNanahLocalProfileContext` | `lockNavigationAndSubscriptionFlow` |
| 5367 | `function` | `getNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 5387 | `function` | `normalizeNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 5393 | `function` | `isNanahChildReplicaOnly` | `lockNavigationAndSubscriptionFlow` |
| 5398 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 5444 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 5479 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 5557 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 5759 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 5777 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 5805 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 5882 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 5933 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 5940 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 5983 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 6028 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 6035 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 6069 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 6085 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 6089 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 6096 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 6110 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 6119 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 6125 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6132 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 6149 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 6154 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 6161 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 6168 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 6172 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 6180 | `function` | `getNanahManagedPolicyScopeList` | `nanahModeScopePolicyModal` |
| 6196 | `function` | `getNanahManagedSendScopeList` | `nanahModeScopePolicyModal` |
| 6214 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6222 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 6235 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 6239 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 6246 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 6250 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 6257 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 6263 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 6270 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 6276 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 6283 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 6289 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 6293 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 6300 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 6304 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 6308 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 6323 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 6336 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 6340 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 6749 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 6784 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 6809 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 6816 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 6868 | `function` | `normalizeNanahTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 6873 | `const arrow` | `localRole` | `nanahTargetProfileDevicePolicy` |
| 6877 | `const arrow` | `remoteRole` | `nanahTargetProfileDevicePolicy` |
| 6932 | `function` | `getManagedNanahLinkPolicy` | `nanahTargetProfileDevicePolicy` |
| 6938 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 6943 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6984 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 7014 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7024 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7040 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 7044 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7051 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 7079 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 7095 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 7100 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 7110 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 7125 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 7130 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7134 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7146 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7158 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 7176 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 7185 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 7191 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 7226 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 7233 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 7247 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7263 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 7269 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7273 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 7277 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 7287 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 7295 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 7331 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 7356 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 7404 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 7467 | `function` | `findNanahTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 7473 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 7497 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 7517 | `function` | `normalizeNanahManagedSigningPublicDescriptor` | `nanahTrustedLinkStorage` |
| 7537 | `function` | `normalizeNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7550 | `async function` | `persistNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7565 | `async function` | `loadNanahManagedSigningKeyDescriptor` | `nanahTrustedLinkStorage` |
| 7583 | `async function` | `ensureNanahManagedSigningKeyPair` | `nanahTrustedLinkStorage` |
| 7602 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7611 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7615 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7642 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7650 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 7673 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 7681 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 7726 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 7777 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7986 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 8023 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 8138 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 8216 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 8332 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 8348 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 8377 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 8395 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 8426 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 8490 | `function` | `parseNanahEnvelopeDetails` | `nanahSessionUiAndEnvelope` |
| 8559 | `function` | `shouldAutoApplyNanahProposal` | `nanahApplyProposalTransport` |
| 8568 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 8587 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 8616 | `async function` | `handleNanahIncomingManagedPolicyEnvelope` | `nanahApplyProposalTransport` |
| 8670 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 8715 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 8737 | `function` | `getNanahActiveManagedSurface` | `nanahApplyProposalTransport` |
| 8744 | `function` | `getNanahManagedPolicySourceProfile` | `nanahApplyProposalTransport` |
| 8789 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 8806 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 8815 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 8886 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 8901 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 9147 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 9220 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 9302 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 9425 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 9455 | `async function` | `verifyPin` | `pinProfilesManager` |
| 9463 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 9509 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 9516 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 9528 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 9588 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 9988 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 10011 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 10199 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 10214 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 10241 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 10283 | `async function` | `runExportV3` | `importExportDownload` |
| 10313 | `const arrow` | `safePart` | `importExportDownload` |
| 10347 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 10395 | `const arrow` | `safePart` | `importExportDownload` |
| 10428 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 10900 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 11010 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 11119 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 11445 | `function` | `toDateInputValue` | `dateFilterHelpers` |
| 11453 | `function` | `parseDateInput` | `dateFilterHelpers` |
| 11466 | `function` | `applyPresetToDateControls` | `dateFilterHelpers` |
| 11492 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 11507 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 11520 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 11535 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 11550 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 11570 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 11583 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 11600 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 11618 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 11636 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 11655 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 11674 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 11684 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 11710 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 11719 | `const arrow` | `whitelistEmpty` | `managedRowsListModeRender` |
| 11852 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 11874 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 11895 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 11922 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 11933 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 11971 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 12006 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 12026 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 12035 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 12076 | `function` | `updateStats` | `dashboardStatsFiltering` |
| 12250 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 12365 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 12446 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 12528 | `function` | `updateKidsChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 12675 | `function` | `setupNavigation` | `navigationAndToasts` |
| 12697 | `function` | `switchView` | `navigationAndToasts` |
| 12785 | `function` | `showSuccessToast` | `navigationAndToasts` |
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
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
