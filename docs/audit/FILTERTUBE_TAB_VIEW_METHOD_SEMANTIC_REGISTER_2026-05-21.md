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
source split lines: 11618
source wc -l: 11617
source bytes: 526763
source sha256: 1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7
broad lexical callable matches: 869
named declarations: 311
plain function declarations: 210
async function declarations: 70
const arrow helper declarations: 29
async const arrow helper declarations: 2
semantic method groups: 22
accepted named declaration rows: 311
semantic method rows promoted: 311
control-flow lexical artifacts: 558 (`if`: 555, `for`: 1, `while`: 2)
local/listener/timer callbacks held outside this named method register: 0
addEventListener sites: 147
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
document.createElement calls: 333
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
showPromptModal calls: 13
showChoiceModal calls: 9
executable current-behavior probes: 6
runtime behavior changed: no
```

## Method Group Counts

```text
dashboardStatsFiltering: 10
dateFilterHelpers: 4
importExportDownload: 8
kidsFiltersContentControls: 18
lockNavigationAndSubscriptionFlow: 14
mainFiltersContentControls: 20
managedRowsListModeRender: 18
modalDialogHelpers: 7
nanahApplyProposalTransport: 13
nanahModeScopePolicyModal: 36
nanahSessionUiAndEnvelope: 11
nanahTargetProfileDevicePolicy: 36
nanahTrustedLinkStorage: 11
navigationAndToasts: 3
pinProfilesManager: 8
profileAccessAndManagedChild: 39
profileDropdownAndBackupControls: 11
responsiveNavigationShell: 3
routeIntentAndReleaseNotes: 4
runtimeMessagingBrowserTabs: 15
settingsSyncAccountPolicyHandlers: 3
subscriptionsImportBridge: 19
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `responsiveNavigationShell` | 3 | Binds the mobile nav toggle, overlay close, and resize close behavior. | Duplicate-listener proof, viewport route fixtures, and teardown policy. |
| `mainFiltersContentControls` | 20 | Builds Main keyword/channel/content/category/video filter UI and schedules content/category saves. | Settings dependency parity, debounce budget, managed-child override proof, selector ownership, and false-hide negative fixtures. |
| `kidsFiltersContentControls` | 18 | Builds Kids keyword/channel/content/category/video filter UI and sync-related content controls. | Kids/Main mode parity, sync-to-main proof, child lock proof, and Kids-specific negative fixtures. |
| `routeIntentAndReleaseNotes` | 4 | Resolves hash/query navigation intent and loads release notes into the dashboard. | Route intent authority, release-note content provenance, and fallback route proof. |
| `runtimeMessagingBrowserTabs` | 15 | Wraps extension runtime messaging, auto-backup scheduling, session PIN notifications, browser tab queries, tab creation/update, active tab lookup, and tab messages. | Sender/result contract, lastError policy, backup trigger budget, session lock report, and browser API negative fixtures. |
| `subscriptionsImportBridge` | 19 | Selects and prepares YouTube subscription tabs, injects/pings the import receiver, waits for readiness, and renders import status. | Tab trust, URL allowlist, wait timeout budget, receiver idempotence, and import failure fixtures. |
| `profileDropdownAndBackupControls` | 11 | Renders profile selector/dropdown state, positions the dropdown, resets scroll, and syncs auto-backup policy controls. | Dropdown lifecycle teardown, scroll restoration proof, and backup policy/source metadata. |
| `profileAccessAndManagedChild` | 39 | Models profile type/access, parent-child relationships, managed child edit surfaces, child editor banners, admin controls, and viewing access updates. | Profile revision report, managed-child mutation contract, parent authority proof, lock/session negatives, and rollback proof. |
| `lockNavigationAndSubscriptionFlow` | 14 | Applies lock and child navigation gates, imports subscribed channels, enables whitelist after import, and updates subscription progress. | Lock gate authority, list-mode transfer proof, import whitelist negative fixtures, and navigation access parity. |
| `modalDialogHelpers` | 7 | Creates prompt and choice modals with cleanup and escape handling. | Focus trap, keyboard teardown, duplicate modal guard, and accessibility fixtures. |
| `nanahModeScopePolicyModal` | 36 | Normalizes Nanah mode/scope/strategy labels, child protections, managed-link modal policy, and trusted-link normalization. | Sync policy authority, managed-link permission proof, child/parent scope negatives, and remote capability fixtures. |
| `nanahTargetProfileDevicePolicy` | 36 | Resolves Nanah target profiles, device labels, remote target options, capabilities, pairing URI, stable device id, preferences, and mode buttons. | Target profile policy report, stable-device provenance, remote inventory fixtures, and child restriction proof. |
| `nanahTrustedLinkStorage` | 11 | Reads/writes trusted links, persists policies, marks usage, configures links, starts trusted reconnect, and renders trusted links. | Storage revision proof, trusted-link expiry/approval policy, reconnect negative fixtures, and stale-link cleanup. |
| `nanahSessionUiAndEnvelope` | 11 | Renders QR/mode/policy/session UI, builds device descriptors, resets sessions, sends hello envelopes, and checks incoming/outgoing auth. | Session lifecycle authority, QR dependency proof, envelope auth matrix, and teardown proof. |
| `nanahApplyProposalTransport` | 13 | Applies incoming envelopes, builds/attaches proposal policy, handles proposal decisions, creates clients, trusts devices, and confirms subscription-import mode. | Apply mutation plan, profile target proof, trusted reconnect approval, transport failure fixtures, and post-apply refresh proof. |
| `pinProfilesManager` | 8 | Verifies PINs, unlocks profiles/admin, renders profile manager and profile selector, refreshes profiles, and switches active profile. | PIN/session boundary, active profile revision, profile switch rollback, and locked-profile negative fixtures. |
| `importExportDownload` | 8 | Exports/imports V3 JSON/encrypted backups, downloads through anchors, revokes blob URLs, and reloads UI after imports. | Import dry-run mutation plan, encrypted target policy, download cleanup proof, and failed-import rollback. |
| `settingsSyncAccountPolicyHandlers` | 3 | Persists account policy and derives generated account/child ids from UI input. | Account creation policy proof, conflict handling, and locked-profile negatives. |
| `managedRowsListModeRender` | 18 | Adds/removes/toggles managed child rows, renders Main/Kids lists through `RenderEngine`, applies date filters, and sends list-mode runtime messages. | Row-action mutation report, Main/Kids list-mode parity, copy/transfer proof, RenderEngine callback contract, and whitelist empty-state fixtures. |
| `dashboardStatsFiltering` | 10 | Updates setting checkboxes, filters content controls/help cards, computes dashboard counts/stats, rotates stats surfaces, and updates stat UI. | Stats source policy, interval lifecycle, no-rule render budget, and managed-child dashboard parity. |
| `dateFilterHelpers` | 4 | Applies keyword/channel date presets for Main and Kids list rendering. | Timezone boundary, date inclusion proof, and row-filter negative fixtures. |
| `navigationAndToasts` | 3 | Sets up navigation, exposes `window.switchView`, updates hash/title/view state, and renders success toasts. | Navigation state contract, global export policy, toast cleanup proof, and route access fixtures. |

## Current Named Method Inventory

| Source line | Kind | Method or function | Semantic group |
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
| 3038 | `async function` | `sendRuntimeMessage` | `runtimeMessagingBrowserTabs` |
| 3064 | `async function` | `scheduleAutoBackup` | `runtimeMessagingBrowserTabs` |
| 3080 | `async function` | `syncSessionUnlockStateFromBackground` | `runtimeMessagingBrowserTabs` |
| 3082 | `async function` | `notifyBackgroundUnlocked` | `runtimeMessagingBrowserTabs` |
| 3096 | `async function` | `notifyBackgroundLocked` | `runtimeMessagingBrowserTabs` |
| 3108 | `function` | `safeObject` | `runtimeMessagingBrowserTabs` |
| 3112 | `function` | `safeArray` | `runtimeMessagingBrowserTabs` |
| 3116 | `function` | `normalizeString` | `runtimeMessagingBrowserTabs` |
| 3120 | `function` | `pluralize` | `runtimeMessagingBrowserTabs` |
| 3124 | `function` | `sleep` | `runtimeMessagingBrowserTabs` |
| 3128 | `async function` | `queryBrowserTabs` | `runtimeMessagingBrowserTabs` |
| 3154 | `async function` | `createBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3180 | `async function` | `updateBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3206 | `async function` | `getActiveBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3216 | `async function` | `sendMessageToBrowserTab` | `runtimeMessagingBrowserTabs` |
| 3229 | `const arrow` | `finish` | `subscriptionsImportBridge` |
| 3234 | `const arrow` | `handleRuntimeError` | `subscriptionsImportBridge` |
| 3273 | `async function` | `ensureSubscriptionsImportBridge` | `subscriptionsImportBridge` |
| 3282 | `function` | `isMainYoutubeUrl` | `subscriptionsImportBridge` |
| 3298 | `function` | `isYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3308 | `function` | `isYoutubeSignInUrl` | `subscriptionsImportBridge` |
| 3325 | `function` | `buildYoutubeChannelsFeedUrl` | `subscriptionsImportBridge` |
| 3329 | `function` | `renderSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3380 | `function` | `syncSubscriptionsImportControls` | `subscriptionsImportBridge` |
| 3394 | `function` | `setSubscriptionsImportState` | `subscriptionsImportBridge` |
| 3403 | `function` | `getOrderedYoutubeTabs` | `subscriptionsImportBridge` |
| 3409 | `const arrow` | `pushTab` | `subscriptionsImportBridge` |
| 3419 | `const arrow` | `isMobileYoutubeTab` | `subscriptionsImportBridge` |
| 3443 | `function` | `pickBestYoutubeTab` | `subscriptionsImportBridge` |
| 3447 | `async function` | `pingSubscriptionsImportReceiver` | `subscriptionsImportBridge` |
| 3459 | `function` | `updateSubscriptionsImportWaitState` | `subscriptionsImportBridge` |
| 3500 | `async function` | `waitForYoutubeTabReady` | `subscriptionsImportBridge` |
| 3509 | `const arrow` | `reportStatus` | `subscriptionsImportBridge` |
| 3601 | `function` | `describeSubscriptionsImportError` | `subscriptionsImportBridge` |
| 3621 | `function` | `getProfileColors` | `profileDropdownAndBackupControls` |
| 3638 | `function` | `getProfileInitial` | `profileDropdownAndBackupControls` |
| 3644 | `function` | `closeProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3661 | `function` | `positionProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3708 | `function` | `scheduleProfileDropdownPositionTab` | `profileDropdownAndBackupControls` |
| 3717 | `function` | `resetTabViewScroll` | `profileDropdownAndBackupControls` |
| 3719 | `const arrow` | `reset` | `profileDropdownAndBackupControls` |
| 3758 | `function` | `toggleProfileDropdownTab` | `profileDropdownAndBackupControls` |
| 3780 | `function` | `renderProfileSelectorTab` | `profileDropdownAndBackupControls` |
| 3801 | `const arrow` | `appendProfileBtn` | `profileDropdownAndBackupControls` |
| 3874 | `function` | `updateAutoBackupPolicyControls` | `profileDropdownAndBackupControls` |
| 3909 | `function` | `extractMasterPinVerifier` | `profileAccessAndManagedChild` |
| 3918 | `function` | `extractProfilePinVerifier` | `profileAccessAndManagedChild` |
| 3927 | `function` | `isProfileLocked` | `profileAccessAndManagedChild` |
| 3934 | `function` | `getProfileName` | `profileAccessAndManagedChild` |
| 3943 | `function` | `getProfileType` | `profileAccessAndManagedChild` |
| 3955 | `function` | `getParentAccountId` | `profileAccessAndManagedChild` |
| 3965 | `function` | `getProfileAccessCopy` | `profileAccessAndManagedChild` |
| 3998 | `function` | `getAccountPolicy` | `profileAccessAndManagedChild` |
| 4011 | `function` | `countNonDefaultAccounts` | `profileAccessAndManagedChild` |
| 4022 | `function` | `getSortedIdsByName` | `profileAccessAndManagedChild` |
| 4036 | `function` | `getAccountIds` | `profileAccessAndManagedChild` |
| 4047 | `function` | `getChildrenForAccount` | `profileAccessAndManagedChild` |
| 4060 | `function` | `buildProfileLabel` | `profileAccessAndManagedChild` |
| 4073 | `function` | `buildProfileSubtitle` | `profileAccessAndManagedChild` |
| 4085 | `function` | `getProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4093 | `function` | `viewingAccessLabel` | `profileAccessAndManagedChild` |
| 4101 | `function` | `canActiveProfileManageProfile` | `profileAccessAndManagedChild` |
| 4110 | `function` | `clonePlain` | `profileAccessAndManagedChild` |
| 4116 | `function` | `normalizeProfileKeyword` | `profileAccessAndManagedChild` |
| 4130 | `function` | `normalizeProfileChannel` | `profileAccessAndManagedChild` |
| 4156 | `function` | `getProfileSurface` | `profileAccessAndManagedChild` |
| 4182 | `function` | `setProfileSurface` | `profileAccessAndManagedChild` |
| 4207 | `function` | `isManagedChildEditFor` | `profileAccessAndManagedChild` |
| 4212 | `function` | `getManagedChildProfile` | `profileAccessAndManagedChild` |
| 4218 | `function` | `getManagedChildSettings` | `profileAccessAndManagedChild` |
| 4222 | `function` | `buildManagedChildState` | `profileAccessAndManagedChild` |
| 4252 | `async function` | `saveManagedChildSurface` | `profileAccessAndManagedChild` |
| 4312 | `function` | `isManagedChildEditorView` | `profileAccessAndManagedChild` |
| 4316 | `function` | `endManagedChildEdit` | `profileAccessAndManagedChild` |
| 4338 | `function` | `renderManagedChildGlobalBanner` | `profileAccessAndManagedChild` |
| 4378 | `function` | `renderManagedChildEditorBanner` | `profileAccessAndManagedChild` |
| 4384 | `const arrow` | `renderFor` | `profileAccessAndManagedChild` |
| 4396 | `async function` | `startManagedChildEdit` | `profileAccessAndManagedChild` |
| 4438 | `function` | `updateAdminPolicyControls` | `profileAccessAndManagedChild` |
| 4451 | `function` | `updateChildProfileCapabilityControls` | `profileAccessAndManagedChild` |
| 4513 | `function` | `isChildProfileAdminSurface` | `profileAccessAndManagedChild` |
| 4517 | `function` | `isViewAllowedForCurrentAccess` | `profileAccessAndManagedChild` |
| 4528 | `function` | `ensureNonChildAdminAction` | `profileAccessAndManagedChild` |
| 4534 | `async function` | `updateProfileViewingAccess` | `profileAccessAndManagedChild` |
| 4585 | `function` | `isUiLocked` | `lockNavigationAndSubscriptionFlow` |
| 4594 | `function` | `getActiveProfileType` | `lockNavigationAndSubscriptionFlow` |
| 4600 | `function` | `getNanahProfileTypeLabel` | `lockNavigationAndSubscriptionFlow` |
| 4605 | `function` | `getNanahLocalProfileContext` | `lockNavigationAndSubscriptionFlow` |
| 4617 | `function` | `getNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 4637 | `function` | `normalizeNanahProfileInventory` | `lockNavigationAndSubscriptionFlow` |
| 4643 | `function` | `isNanahChildReplicaOnly` | `lockNavigationAndSubscriptionFlow` |
| 4648 | `async function` | `enableWhitelistModeAfterImport` | `lockNavigationAndSubscriptionFlow` |
| 4694 | `function` | `handleSubscriptionsImportProgress` | `lockNavigationAndSubscriptionFlow` |
| 4729 | `async function` | `resolveSubscriptionsImportTab` | `lockNavigationAndSubscriptionFlow` |
| 4807 | `async function` | `startSubscribedChannelsImport` | `lockNavigationAndSubscriptionFlow` |
| 5009 | `function` | `resolveViewAccess` | `lockNavigationAndSubscriptionFlow` |
| 5027 | `function` | `updateNavigationAccessUI` | `lockNavigationAndSubscriptionFlow` |
| 5055 | `function` | `applyLockGateIfNeeded` | `lockNavigationAndSubscriptionFlow` |
| 5132 | `async function` | `showPromptModal` | `modalDialogHelpers` |
| 5183 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 5190 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 5233 | `async function` | `showChoiceModal` | `modalDialogHelpers` |
| 5278 | `const arrow` | `cleanup` | `modalDialogHelpers` |
| 5285 | `const arrow` | `closeWith` | `modalDialogHelpers` |
| 5319 | `const arrow` | `handleEscape` | `modalDialogHelpers` |
| 5335 | `function` | `isNanahAvailable` | `nanahModeScopePolicyModal` |
| 5339 | `function` | `normalizeNanahCode` | `nanahModeScopePolicyModal` |
| 5346 | `function` | `extractNanahCodeFromInput` | `nanahModeScopePolicyModal` |
| 5360 | `function` | `formatNanahStage` | `nanahModeScopePolicyModal` |
| 5369 | `function` | `getNanahRole` | `nanahModeScopePolicyModal` |
| 5375 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 5382 | `function` | `getNanahScope` | `nanahModeScopePolicyModal` |
| 5389 | `function` | `getNanahStrategy` | `nanahModeScopePolicyModal` |
| 5394 | `function` | `normalizeNanahUiMode` | `nanahModeScopePolicyModal` |
| 5401 | `function` | `inferNanahUiModeFromControls` | `nanahModeScopePolicyModal` |
| 5408 | `function` | `getNanahUiMode` | `nanahModeScopePolicyModal` |
| 5412 | `function` | `getNanahScopeList` | `nanahModeScopePolicyModal` |
| 5420 | `function` | `classifyNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 5428 | `function` | `getNanahScopeLabel` | `nanahModeScopePolicyModal` |
| 5436 | `function` | `getNanahStrategyLabel` | `nanahModeScopePolicyModal` |
| 5440 | `function` | `getNanahReconnectMode` | `nanahModeScopePolicyModal` |
| 5447 | `function` | `getNanahReconnectModeLabel` | `nanahModeScopePolicyModal` |
| 5451 | `function` | `getNanahLockedChildMode` | `nanahModeScopePolicyModal` |
| 5458 | `function` | `getNanahLockedChildModeLabel` | `nanahModeScopePolicyModal` |
| 5464 | `function` | `getNanahChildProtectionLevel` | `nanahModeScopePolicyModal` |
| 5471 | `function` | `getNanahChildProtectionLevelLabel` | `nanahModeScopePolicyModal` |
| 5477 | `function` | `getNanahTargetProfileBehavior` | `nanahModeScopePolicyModal` |
| 5484 | `function` | `getNanahTargetProfileBehaviorLabel` | `nanahModeScopePolicyModal` |
| 5490 | `function` | `getNanahLinkTypeLabel` | `nanahModeScopePolicyModal` |
| 5494 | `function` | `getNanahRoleLabel` | `nanahModeScopePolicyModal` |
| 5501 | `function` | `isActiveChildNanahProfile` | `nanahModeScopePolicyModal` |
| 5505 | `function` | `isNanahChildReceiveOnly` | `nanahModeScopePolicyModal` |
| 5509 | `async function` | `ensureChildNanahParentAuthorityUnlocked` | `nanahModeScopePolicyModal` |
| 5524 | `function` | `getNanahScopeDescription` | `nanahModeScopePolicyModal` |
| 5532 | `function` | `describeNanahScopeList` | `nanahModeScopePolicyModal` |
| 5536 | `async function` | `showNanahManagedLinkModal` | `nanahModeScopePolicyModal` |
| 5945 | `const arrow` | `readPolicy` | `nanahModeScopePolicyModal` |
| 5980 | `const arrow` | `syncDefaultScopeState` | `nanahModeScopePolicyModal` |
| 6005 | `const arrow` | `cleanup` | `nanahModeScopePolicyModal` |
| 6012 | `const arrow` | `closeWith` | `nanahModeScopePolicyModal` |
| 6064 | `function` | `normalizeNanahTrustedLink` | `nanahModeScopePolicyModal` |
| 6069 | `const arrow` | `localRole` | `nanahTargetProfileDevicePolicy` |
| 6073 | `const arrow` | `remoteRole` | `nanahTargetProfileDevicePolicy` |
| 6124 | `function` | `getManagedNanahLinkPolicy` | `nanahTargetProfileDevicePolicy` |
| 6130 | `function` | `getNanahCurrentTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 6135 | `function` | `resolveNanahLocalTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6176 | `function` | `resolveNanahTargetProfileFromPolicy` | `nanahTargetProfileDevicePolicy` |
| 6206 | `function` | `resolveNanahExplicitTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6216 | `function` | `buildNanahHelloTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6232 | `function` | `getNanahSelectedRemoteTargetProfileId` | `nanahTargetProfileDevicePolicy` |
| 6236 | `function` | `getNanahSelectedRemoteTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6243 | `function` | `syncNanahRemoteTargetOptions` | `nanahTargetProfileDevicePolicy` |
| 6271 | `async function` | `ensureNanahManagedChildLinkPermission` | `nanahTargetProfileDevicePolicy` |
| 6287 | `function` | `isCurrentNanahManagedLink` | `nanahTargetProfileDevicePolicy` |
| 6292 | `function` | `getNanahCapabilitiesForRole` | `nanahTargetProfileDevicePolicy` |
| 6302 | `function` | `buildNanahPairUri` | `nanahTargetProfileDevicePolicy` |
| 6317 | `function` | `getNanahRemoteLabel` | `nanahTargetProfileDevicePolicy` |
| 6322 | `function` | `getNanahLocalDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 6326 | `function` | `normalizeNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6338 | `function` | `normalizeNanahTargetProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6350 | `function` | `resolveNanahDisplayTargetProfile` | `nanahTargetProfileDevicePolicy` |
| 6368 | `function` | `formatNanahProfileContext` | `nanahTargetProfileDevicePolicy` |
| 6377 | `function` | `formatNanahEndpointContext` | `nanahTargetProfileDevicePolicy` |
| 6383 | `function` | `buildNanahTargetHint` | `nanahTargetProfileDevicePolicy` |
| 6418 | `async function` | `ensureNanahStableDeviceId` | `nanahTargetProfileDevicePolicy` |
| 6425 | `const arrow` | `generated` | `nanahTargetProfileDevicePolicy` |
| 6439 | `async function` | `loadNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 6455 | `async function` | `persistNanahPreferredDeviceLabel` | `nanahTargetProfileDevicePolicy` |
| 6461 | `async function` | `loadNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 6465 | `async function` | `persistNanahUiModePreference` | `nanahTargetProfileDevicePolicy` |
| 6469 | `function` | `getNanahSelectedText` | `nanahTargetProfileDevicePolicy` |
| 6479 | `function` | `refreshNanahAdvancedSummary` | `nanahTargetProfileDevicePolicy` |
| 6487 | `function` | `enforceChildSyncSurfaceRestrictions` | `nanahTargetProfileDevicePolicy` |
| 6523 | `function` | `setNanahModeButtons` | `nanahTargetProfileDevicePolicy` |
| 6548 | `function` | `setNanahMode` | `nanahTargetProfileDevicePolicy` |
| 6596 | `async function` | `confirmNanahRemoteTarget` | `nanahTargetProfileDevicePolicy` |
| 6659 | `function` | `findNanahTrustedLink` | `nanahTargetProfileDevicePolicy` |
| 6665 | `async function` | `readNanahStorage` | `nanahTrustedLinkStorage` |
| 6689 | `async function` | `writeNanahStorage` | `nanahTrustedLinkStorage` |
| 6709 | `async function` | `loadNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 6718 | `async function` | `persistNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 6722 | `async function` | `saveNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 6749 | `async function` | `removeNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 6757 | `async function` | `updateNanahTrustedLinkPolicy` | `nanahTrustedLinkStorage` |
| 6780 | `async function` | `markNanahTrustedLinkUsed` | `nanahTrustedLinkStorage` |
| 6788 | `async function` | `configureNanahTrustedLink` | `nanahTrustedLinkStorage` |
| 6833 | `async function` | `startNanahTrustedReconnect` | `nanahTrustedLinkStorage` |
| 6884 | `function` | `renderNanahTrustedLinks` | `nanahTrustedLinkStorage` |
| 7093 | `async function` | `renderNanahQr` | `nanahSessionUiAndEnvelope` |
| 7130 | `function` | `updateNanahModeUi` | `nanahSessionUiAndEnvelope` |
| 7245 | `function` | `updateNanahPolicyControls` | `nanahSessionUiAndEnvelope` |
| 7323 | `function` | `updateNanahUi` | `nanahSessionUiAndEnvelope` |
| 7439 | `function` | `buildNanahDeviceDescriptor` | `nanahSessionUiAndEnvelope` |
| 7451 | `async function` | `resetNanahSession` | `nanahSessionUiAndEnvelope` |
| 7480 | `async function` | `sendNanahHelloEnvelope` | `nanahSessionUiAndEnvelope` |
| 7498 | `async function` | `ensureNanahOutgoingAuth` | `nanahSessionUiAndEnvelope` |
| 7529 | `async function` | `ensureNanahIncomingAuth` | `nanahSessionUiAndEnvelope` |
| 7593 | `function` | `parseNanahEnvelopeDetails` | `nanahSessionUiAndEnvelope` |
| 7642 | `function` | `shouldAutoApplyNanahProposal` | `nanahSessionUiAndEnvelope` |
| 7651 | `async function` | `refreshFilterTubeUiAfterNanahImport` | `nanahApplyProposalTransport` |
| 7670 | `async function` | `applyNanahEnvelope` | `nanahApplyProposalTransport` |
| 7699 | `function` | `buildNanahOutgoingProposalPolicy` | `nanahApplyProposalTransport` |
| 7740 | `function` | `attachNanahProposalPolicy` | `nanahApplyProposalTransport` |
| 7762 | `function` | `resolveTrustedNanahManagedApply` | `nanahApplyProposalTransport` |
| 7779 | `function` | `requiresNanahTrustedReconnectApproval` | `nanahApplyProposalTransport` |
| 7788 | `async function` | `ensureNanahTrustedReconnectApproved` | `nanahApplyProposalTransport` |
| 7859 | `async function` | `sendNanahDecision` | `nanahApplyProposalTransport` |
| 7874 | `async function` | `handleNanahIncomingProposal` | `nanahApplyProposalTransport` |
| 8105 | `async function` | `handleNanahIncomingEnvelope` | `nanahApplyProposalTransport` |
| 8159 | `async function` | `createNanahClient` | `nanahApplyProposalTransport` |
| 8233 | `async function` | `trustConnectedNanahDevice` | `nanahApplyProposalTransport` |
| 8319 | `async function` | `confirmSubscriptionsImportModeChoice` | `nanahApplyProposalTransport` |
| 8349 | `async function` | `verifyPin` | `pinProfilesManager` |
| 8357 | `async function` | `ensureProfileUnlocked` | `pinProfilesManager` |
| 8392 | `async function` | `ensureAdminUnlocked` | `pinProfilesManager` |
| 8399 | `function` | `updateExportScopeControls` | `pinProfilesManager` |
| 8411 | `function` | `renderProfileSelector` | `pinProfilesManager` |
| 8471 | `function` | `renderProfilesManager` | `pinProfilesManager` |
| 8827 | `async function` | `refreshProfilesUI` | `pinProfilesManager` |
| 8850 | `async function` | `switchToProfile` | `pinProfilesManager` |
| 9038 | `function` | `revokeBlobUrlLater` | `importExportDownload` |
| 9053 | `function` | `downloadViaAnchor` | `importExportDownload` |
| 9080 | `function` | `downloadJsonToDownloadsFolder` | `importExportDownload` |
| 9122 | `async function` | `runExportV3` | `importExportDownload` |
| 9152 | `const arrow` | `safePart` | `importExportDownload` |
| 9186 | `async function` | `runExportV3Encrypted` | `importExportDownload` |
| 9234 | `const arrow` | `safePart` | `importExportDownload` |
| 9267 | `async function` | `runImportV3FromFile` | `importExportDownload` |
| 9721 | `async const arrow` | `persistPolicy` | `settingsSyncAccountPolicyHandlers` |
| 9831 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 9940 | `const arrow` | `makeIdPart` | `settingsSyncAccountPolicyHandlers` |
| 10267 | `function` | `toDateInputValue` | `managedRowsListModeRender` |
| 10275 | `function` | `parseDateInput` | `managedRowsListModeRender` |
| 10288 | `function` | `applyPresetToDateControls` | `managedRowsListModeRender` |
| 10314 | `async function` | `addManagedKeyword` | `managedRowsListModeRender` |
| 10329 | `async function` | `removeManagedKeyword` | `managedRowsListModeRender` |
| 10342 | `async function` | `toggleManagedKeywordExact` | `managedRowsListModeRender` |
| 10357 | `async function` | `toggleManagedKeywordComments` | `managedRowsListModeRender` |
| 10372 | `async function` | `addManagedChannel` | `managedRowsListModeRender` |
| 10392 | `async function` | `removeManagedChannel` | `managedRowsListModeRender` |
| 10405 | `async function` | `toggleManagedChannelFilterAll` | `managedRowsListModeRender` |
| 10422 | `function` | `renderKeywords` | `managedRowsListModeRender` |
| 10440 | `function` | `renderChannels` | `managedRowsListModeRender` |
| 10458 | `function` | `renderKidsKeywords` | `managedRowsListModeRender` |
| 10477 | `function` | `renderKidsChannels` | `managedRowsListModeRender` |
| 10496 | `function` | `renderListModeControls` | `managedRowsListModeRender` |
| 10506 | `const arrow` | `currentMode` | `managedRowsListModeRender` |
| 10532 | `async const arrow` | `handleModeToggle` | `managedRowsListModeRender` |
| 10541 | `const arrow` | `whitelistEmpty` | `managedRowsListModeRender` |
| 10674 | `function` | `updateCheckboxes` | `dashboardStatsFiltering` |
| 10696 | `function` | `filterContentControls` | `dashboardStatsFiltering` |
| 10717 | `function` | `filterHelpCards` | `dashboardStatsFiltering` |
| 10744 | `function` | `getDashboardSurfaceStats` | `dashboardStatsFiltering` |
| 10755 | `function` | `getDashboardCounts` | `dashboardStatsFiltering` |
| 10793 | `const arrow` | `keyFor` | `dashboardStatsFiltering` |
| 10828 | `function` | `formatSavedTime` | `dashboardStatsFiltering` |
| 10848 | `function` | `setDashboardStatsSurface` | `dashboardStatsFiltering` |
| 10857 | `function` | `scheduleDashboardStatsRotation` | `dashboardStatsFiltering` |
| 10898 | `function` | `updateStats` | `dashboardStatsFiltering` |
| 11072 | `function` | `updateKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 11187 | `function` | `updateChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 11268 | `function` | `updateKidsKeywordDateFilterFromInputs` | `dateFilterHelpers` |
| 11350 | `function` | `updateKidsChannelDateFilterFromInputs` | `dateFilterHelpers` |
| 11497 | `function` | `setupNavigation` | `navigationAndToasts` |
| 11519 | `function` | `switchView` | `navigationAndToasts` |
| 11607 | `function` | `showSuccessToast` | `navigationAndToasts` |

## Current Runtime Crossings

Unique direct `StateManager` methods reached from the dashboard:

```text
addChannel
addKeyword
addKidsChannel
addKidsKeyword
getState
importSubscribedChannelsToWhitelist
loadSettings
subscribe
toggleTheme
updateCategoryFilters
updateContentFilters
updateKidsCategoryFilters
updateKidsContentFilters
updateSetting
```

Unique `RenderEngine` methods reached from the dashboard:

```text
renderChannelList
renderKeywordList
```

Current action literals in this file:

```text
FilterTube_ClearSessionPin
FilterTube_EnsureSubscriptionsImportBridge
FilterTube_Ping
FilterTube_ScheduleAutoBackup
FilterTube_SessionPinAuth
FilterTube_SetListMode
FilterTube_TransferWhitelistToBlocklist
apply_once
save
```

## Executable Current-Behavior Probes

`tests/runtime/tab-view-method-semantic-register-current-behavior.test.mjs`
now extracts selected pure functions from `js/tab-view.js` and executes them in
a VM. The executable probes prove these current behaviors without booting the
dashboard or changing runtime source:

- Subscription import URL admission accepts `youtube.com`, `www.youtube.com`,
  and `m.youtube.com`, rejects YouTube Kids, recognizes YouTube and Google
  sign-in URLs, and always builds the fallback import URL as
  `https://m.youtube.com/feed/channels`.
- Subscription import tab ordering prefers an active complete mobile YouTube
  tab before preferred/loading desktop tabs and preserves the current error-code
  copy for receiver, profile, tab, and custom import failures.
- Managed child keyword/channel normalization trims user input, rejects empty
  keywords and plain channel names, accepts handles and custom URL paths, and
  stamps row records with current default fields.
- Managed child profile surface helpers convert legacy Main
  `blockedKeywords`/`blockedChannels` into current Main row arrays, clone row
  arrays before returning them, normalize invalid Kids modes to blocklist, and
  mirror Main `keywords`/`channels` into legacy `blocked*` aliases when saving a
  surface.
- Date helpers format local `Date` objects as `YYYY-MM-DD`, parse date inputs
  to local start/end-of-day millisecond bounds, and reject invalid date strings.
- Nanah helpers normalize pair codes, scope lists, managed-vs-peer link type,
  reconnect policy, fixed target profile policy, and managed-link auto-apply
  defaults.

## Current Behavior Boundaries

- `DOMContentLoaded` adds a locked boot class, installs temporary lock/access
  globals, initializes responsive navigation, Main/Kids filter tabs, and
  dashboard navigation, then loads settings through `StateManager.loadSettings()`.
- Main and Kids content/category/video filter helpers read DOM controls, compare
  signatures, debounce saves through timers, write either managed-child surfaces
  or `StateManager.updateContentFilters()` / `StateManager.updateCategoryFilters()`,
  and rerender UI after changes.
- Subscription import can select or open YouTube tabs, inject/ping the import
  bridge, wait through repeated tab-message attempts, call
  `StateManager.importSubscribedChannelsToWhitelist()`, and then call
  `FilterTube_SetListMode` with `copyBlocklist: false` to enable Main whitelist
  mode.
- Managed child edit mode builds a synthetic state, passes it as `stateOverride`
  to `RenderEngine`, and uses callback overrides for keyword/channel row actions
  instead of direct `StateManager` row mutators.
- Dashboard list-mode controls can copy blocklist rows into whitelist, transfer
  whitelist rows back into blocklist, mutate managed-child profile surfaces
  directly, or send `FilterTube_SetListMode` /
  `FilterTube_TransferWhitelistToBlocklist` runtime messages.
- Profile and lock helpers verify PINs, synchronize session unlock/lock state
  with background messages, render profile dropdowns/managers, switch profiles,
  and expose navigation access gates through window globals.
- Nanah helpers manage device identity, mode/scope/strategy policy, trusted
  links, remote target profiles, envelope authentication, proposal decisions,
  apply/refresh flows, and post-import UI refresh.
- Import/export helpers create blob URLs, schedule delayed revocation, click
  anchor downloads, export V3/plain/encrypted payloads, import files through IO,
  reload settings/profiles, and refresh dashboard UI.
- Dashboard stats and filter views are updated by StateManager subscriptions,
  direct UI events, hash/popstate navigation, requestAnimationFrame callbacks,
  one stats rotation interval, and many inline event listeners not enumerated as
  named methods in this register.

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
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
