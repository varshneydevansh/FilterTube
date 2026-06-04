# FilterTube Popup Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/popup.js` from broad UI/settings callable accounting
to a source-derived method inventory. It covers the popup script that builds
filter tabs, creates popup-only content controls, mirrors Main/Kids video
filters, resolves the active YouTube versus YouTube Kids tab, toggles list mode
through background messages, renders profile locks and dropdowns, verifies PINs,
switches V4 profiles, renders keyword/channel lists, filters rows, and forwards
UI mutations to `StateManager`.

This is not completion proof for every popup DOM element, listener callback,
profile lock path, list-mode transfer, Main/Kids route decision, content-control
visibility rule, modal lifecycle, keyboard interaction, background message
branch, tab-open fallback, search filter, row mutation, or popup/tab-view parity
case. It is a current-behavior boundary before popup UI, list-mode, profile,
lock, content-control, render, or mutation behavior changes.

## Source-Derived Summary

```text
source file: js/popup.js
line count: 1841
source split lines: 1842
source wc -l: 1841
source bytes: 75587
source sha256: cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a
broad lexical callable matches: 131
named declarations: 53
plain function declarations: 36
async function declarations: 11
const arrow helper declarations: 3
async const arrow helper declarations: 3
public exported API entries: 0
semantic method groups: 11
accepted named declaration rows: 53
semantic method rows promoted: 53
control-flow lexical artifacts: 78 (`if`: 78)
local/listener/timer callbacks held outside this named method register: 0
document.getElementById calls: 52
unique getElementById ids: 23
document.createElement calls: 82
document.querySelector calls: 3
querySelector calls: 4
querySelectorAll calls: 6
addEventListener calls: 30
document.addEventListener calls: 3
setTimeout calls: 2
clearTimeout calls: 0
setInterval calls: 0
requestAnimationFrame calls: 1
innerHTML writes: 5
textContent writes: 29
setAttribute calls: 34
style.setProperty calls: 9
style.display writes: 6
hidden writes: 9
appendChild calls: 76
StateManager references: 19
RenderEngine references: 2
UIComponents references: 13
sendRuntimeMessage occurrences: 4
runtime.sendMessage calls: 1
tabs.query calls: 3
tabs.create calls: 2
window.open calls: 5
window.confirm calls: 2
alert calls: 2
FilterTubeIO references: 2
FilterTubeSecurity references: 1
FilterTubeSettings references: 1
executable current-behavior probes: 6
runtime behavior changed: no
```

## Method Group Counts

```text
popupBootstrapAndContentDom: 3
popupContentControlVisibility: 1
popupDefensiveHelpers: 2
popupDropdownModalAndPinUnlock: 8
popupEnabledToggle: 1
popupListModeControls: 3
popupLockGateAndProfileSwitch: 6
popupProfileMetadataHelpers: 15
popupRenderingAndSearchSync: 4
popupRuntimeMessagingAndSessionUnlock: 3
popupVideoFilterControls: 7
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `popupBootstrapAndContentDom` | 3 | Builds popup filter tabs, content-control groups, compact video filter rows, and fallback feed sections. | DOM target contract, duplicate-ID fixture, catalog absence policy, and popup/tab-view parity proof. |
| `popupVideoFilterControls` | 7 | Mirrors Main/Kids duration, upload-date, and uppercase toggles based on active tab route and saves through `StateManager`. | YouTube Kids route fixture, checkbox fallback policy, async tab race proof, and Main/Kids negative mode fixtures. |
| `popupContentControlVisibility` | 1 | Hides non-feed catalog controls for Kids profile mode and reapplies row search filtering. | Content-control authority, group-id manifest, search/visibility interaction proof, and row state restoration fixture. |
| `popupRuntimeMessagingAndSessionUnlock` | 3 | Wraps runtime sendMessage and notifies background when PIN unlock succeeds. | Sender trust contract, session lifetime proof, message action authority, and runtime error reporting policy. |
| `popupListModeControls` | 3 | Renders one popup list-mode pill, asks confirmation for whitelist copy/transfer paths, sends background list-mode actions, reloads settings, and rerenders lists. | Copy/transfer parity, whitelist-empty negative fixtures, child profile policy, background response rollback, and keyboard/click equivalence. |
| `popupDefensiveHelpers` | 2 | Coerces profile and string inputs used across profile/dropdown/lock helpers. | Caller-specific fallback policy and malformed profile fixtures. |
| `popupProfileMetadataHelpers` | 15 | Derives profile labels, lock state, account/child grouping, parent account, avatar colors, initials, and access-copy text. | V4 profile graph invariant, child/parent negative fixtures, locked/unlocked copy proof, and account sorting fixture. |
| `popupDropdownModalAndPinUnlock` | 8 | Opens/closes the profile dropdown, positions it, builds PIN prompt modal DOM, verifies PINs, records local unlock state, and notifies background. | Modal teardown, focus/keyboard trap, overlay click policy, PIN retry budget, session unlock parity, and accessibility proof. |
| `popupLockGateAndProfileSwitch` | 6 | Applies lock gate DOM, toggles global UI lock predicate, renders profile menu rows, loads/saves V4 profiles, reloads settings, and rerenders popup state after profile switch. | Lock ownership, child edit policy, V4 save rollback, stale profile cache proof, and popup/tab-view lock parity. |
| `popupRenderingAndSearchSync` | 4 | Renders keyword/channel lists through `RenderEngine`, filters content-control rows, and syncs checkbox/brand button locked/enabled state. | Render/state dependency manifest, stale visible-row proof, search hidden-row parity, and enabled toggle fixture. |
| `popupEnabledToggle` | 1 | Toggles global filtering via `StateManager.updateSetting('enabled')` after lock checks and keyboard/click handling. | Enabled-state mutation authority, keyboard/click parity, locked-state no-op proof, and background invalidation fixture. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 9 | `function` | `initializePopupFiltersTabs` | `popupBootstrapAndContentDom` |
| 69 | `function` | `hexToRgba` | `popupBootstrapAndContentDom` |
| 82 | `function` | `applyControlGroupTheme` | `popupBootstrapAndContentDom` |
| 376 | `function` | `updatePopupVideoFilterUI` | `popupVideoFilterControls` |
| 380 | `function` | `applyPopupContentFilters` | `popupVideoFilterControls` |
| 395 | `function` | `applyPopupKidsContentFilters` | `popupVideoFilterControls` |
| 408 | `async function` | `resolveProfileTypeFromTabs` | `popupVideoFilterControls` |
| 435 | `async function` | `updatePopupVideoFiltersVisibility` | `popupVideoFilterControls` |
| 461 | `async function` | `applyPopupVideoFiltersForActiveProfile` | `popupVideoFilterControls` |
| 474 | `function` | `savePopupVideoFilters` | `popupVideoFilterControls` |
| 636 | `function` | `applyPopupContentControlsVisibility` | `popupContentControlVisibility` |
| 688 | `async function` | `sendRuntimeMessage` | `popupRuntimeMessagingAndSessionUnlock` |
| 717 | `async function` | `syncSessionUnlockStateFromBackground` | `popupRuntimeMessagingAndSessionUnlock` |
| 721 | `async function` | `notifyBackgroundUnlocked` | `popupRuntimeMessagingAndSessionUnlock` |
| 735 | `function` | `renderListModeControls` | `popupListModeControls` |
| 738 | `async const arrow` | `resolveProfileTypeFromTabs` | `popupListModeControls` |
| 804 | `async const arrow` | `handleModeToggle` | `popupListModeControls` |
| 909 | `function` | `safeObject` | `popupDefensiveHelpers` |
| 913 | `function` | `normalizeString` | `popupDefensiveHelpers` |
| 917 | `function` | `updateSubscriptionsShortcut` | `popupProfileMetadataHelpers` |
| 921 | `function` | `extractMasterPinVerifier` | `popupProfileMetadataHelpers` |
| 930 | `function` | `extractProfilePinVerifier` | `popupProfileMetadataHelpers` |
| 939 | `function` | `isProfileLocked` | `popupProfileMetadataHelpers` |
| 946 | `function` | `getProfileName` | `popupProfileMetadataHelpers` |
| 955 | `function` | `buildProfileLabel` | `popupProfileMetadataHelpers` |
| 968 | `function` | `buildProfileSubtitle` | `popupProfileMetadataHelpers` |
| 980 | `function` | `getProfileType` | `popupProfileMetadataHelpers` |
| 989 | `function` | `getProfileAccessCopy` | `popupProfileMetadataHelpers` |
| 1022 | `function` | `getParentAccountId` | `popupProfileMetadataHelpers` |
| 1036 | `function` | `getSortedIdsByName` | `popupProfileMetadataHelpers` |
| 1050 | `function` | `getAccountIds` | `popupProfileMetadataHelpers` |
| 1057 | `function` | `getChildrenForAccount` | `popupProfileMetadataHelpers` |
| 1068 | `function` | `getProfileColors` | `popupProfileMetadataHelpers` |
| 1085 | `function` | `getProfileInitial` | `popupProfileMetadataHelpers` |
| 1091 | `function` | `closeProfileDropdown` | `popupDropdownModalAndPinUnlock` |
| 1098 | `function` | `positionProfileDropdown` | `popupDropdownModalAndPinUnlock` |
| 1115 | `function` | `toggleProfileDropdown` | `popupDropdownModalAndPinUnlock` |
| 1125 | `async function` | `showPromptModal` | `popupDropdownModalAndPinUnlock` |
| 1176 | `const arrow` | `cleanup` | `popupDropdownModalAndPinUnlock` |
| 1183 | `const arrow` | `closeWith` | `popupDropdownModalAndPinUnlock` |
| 1226 | `async function` | `verifyPin` | `popupDropdownModalAndPinUnlock` |
| 1234 | `async function` | `ensureProfileUnlocked` | `popupDropdownModalAndPinUnlock` |
| 1265 | `function` | `isUiLocked` | `popupLockGateAndProfileSwitch` |
| 1276 | `function` | `applyLockGateIfNeeded` | `popupLockGateAndProfileSwitch` |
| 1373 | `function` | `renderProfileSelector` | `popupLockGateAndProfileSwitch` |
| 1389 | `const arrow` | `appendProfileBtn` | `popupLockGateAndProfileSwitch` |
| 1462 | `async function` | `refreshProfilesUI` | `popupLockGateAndProfileSwitch` |
| 1476 | `async function` | `switchToProfile` | `popupLockGateAndProfileSwitch` |
| 1573 | `function` | `renderKeywords` | `popupRenderingAndSearchSync` |
| 1585 | `function` | `renderChannels` | `popupRenderingAndSearchSync` |
| 1598 | `function` | `filterContentControlsPopup` | `popupRenderingAndSearchSync` |
| 1620 | `function` | `updateCheckboxes` | `popupRenderingAndSearchSync` |
| 1819 | `async const arrow` | `handleToggle` | `popupEnabledToggle` |

## Current Entrypoints And Dependencies

```text
script entrypoints: initializePopupFiltersTabs, DOMContentLoaded async listener
popup global writes: window.FilterTubeIsUiLocked
content catalog dependency: window.FilterTubeContentControlsCatalog.getCatalog
settings dependency: window.FilterTubeSettings.applyThemePreference
state dependency methods: addChannel, addKeyword, addKidsChannel, addKidsKeyword, getState, loadSettings, subscribe, updateContentFilters, updateKidsContentFilters, updateSetting
render dependency methods: renderChannelList, renderKeywordList
UI dependency methods: createTabs, flashButtonSuccess, showToast
runtime message actions: FilterTube_SessionPinAuth, FilterTube_TransferWhitelistToBlocklist, FilterTube_SetListMode
tab APIs: tabs.query, tabs.create
profile APIs: FilterTubeIO.loadProfilesV4, FilterTubeIO.saveProfilesV4, FilterTubeSecurity.verifyPin
```

## Executable Current-Behavior Probes

`tests/runtime/popup-method-semantic-register-current-behavior.test.mjs` now
extracts selected current helpers from `js/popup.js` and executes them in a VM.
The executable probes prove these current behaviors without booting the popup or
changing runtime source:

- Active-tab route resolution returns `kids` for YouTube Kids URLs and `main`
  otherwise.
- Popup video filter saves preserve existing Main/Kids filter subfields while
  replacing only the three popup checkbox `enabled` booleans.
- Profile metadata helpers derive Master/account/child labels, subtitles,
  parent account fallback, sorted account/child groups, profile initials, and
  lock copy from the current V4 profile graph.
- Content-control visibility hides non-feed groups for Kids, hides catalog
  backed feed rows in Kids, restores rows for Main, and keeps search filtering
  independent of the Kids/Main hidden flag.
- Runtime session unlock notification trims profile id/PIN input, sends only
  non-empty PINs, and uses the current `FilterTube_SessionPinAuth` action shape.
- The executable harness keeps these probes audit-only; it does not add popup
  lifecycle, listener teardown, or popup/tab-view parity authority.

## Current DOM ID Surface

```text
addChannelBtn
addKeywordBtn
channelInput
channelList
extensionStatusText
ftProfileBadgeBtnPopup
ftProfileDropdownPopup
ftProfileMenuPopup
ftTopBarListModeControlsPopup
keywordList
newKeywordInput
openInTabBtn
popupFiltersTabsContainer
popupVideoFilter_duration_enabled
popupVideoFilter_duration_enabled_kids
popupVideoFilter_uploadDate_enabled
popupVideoFilter_uploadDate_enabled_kids
popupVideoFilter_uppercase_enabled
popupVideoFilter_uppercase_enabled_kids
searchChannelsPopup
searchContentControlsPopup
searchKeywordsPopup
toggleEnabledBrandBtn
```

## Future Proof Fields

Each popup method row must eventually be backed by a source line, fixture, and
observed UI/runtime effect before popup behavior changes can claim semantic
coverage:

```text
methodReference
sourceLine
semanticGroup
callerUi
domIdsRead
domIdsWritten
selectorsRead
elementsCreated
listenersRegistered
listenerTeardown
timerEffect
frameEffect
runtimeMessageAction
stateManagerMethod
renderEngineMethod
uiComponentsMethod
profileType
profileId
listModeInput
lockStateInput
tabRouteInput
popupSearchInput
mainKidsVisibilityEffect
profileSwitchEffect
pinVerificationEffect
backgroundSessionEffect
tabOpenEffect
windowFallbackEffect
confirmDialogEffect
alertEffect
toastEffect
positiveFixture
negativeLockFixture
negativeModeFixture
negativeRouteFixture
negativeProfileFixture
negativeDomFixture
performanceBudget
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
popupMethodAuthority
popupDomEffectReport
popupListenerLifecycleContract
popupListModeMutationReport
popupProfileLockAccessReport
popupProfileSwitchMutationPlan
popupContentControlVisibilityReport
popupVideoFilterRoutePolicy
popupRuntimeMessageContract
popupRenderStateDependencyReport
popupAccessibilityContract
popupFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this profile/settings/UI surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 72
method semantic proof gap lexical callables covered: 6113
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 6113
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, profile behavior, settings mutation
behavior, popup/tab UI behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
