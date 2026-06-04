# FilterTube Block Channel Method Semantic Register - Current Behavior - 2026-05-21

Status: current-behavior register with 2026-05-26 second-pass idle-detach addendum.

This register promotes `js/content/block_channel.js` from broad quick-block,
menu, Kids native block, selector, lifecycle, and mutation-risk coverage to a
source-derived method inventory. It covers the page-resident quick-cross /
quick-block surface, native YouTube dropdown tracking, YouTube Kids passive
native block sync, optimistic hide, background mutation messages, and fallback
DOM reruns.

This is not completion proof for quick-block route ownership, disabled/no-rule
zero-work, whitelist zero-observer behavior, overlay pause policy, dropdown
observer teardown, per-card identity confidence, sibling-visible hide proof,
Kids native sender trust, trusted UI/content sender policy, mutation revision,
or future simultaneous allow/block semantics. It is a current-behavior boundary
before quick-block, dropdown injection, Kids native block, optimistic hide,
selector cleanup, lifecycle cleanup, or mutation behavior changes.

## Source-Derived Summary

```text
source file: js/content/block_channel.js
line count: 3189
source bytes: 127857
source sha256: c040b57e0b107fd7b6fb0a18bc4ca014e5a22fbb82755f81e51a497eee387dba
repo-wide broad parser lexical callable matches: 226
broad parser declaration/inventory matches: 96
assignment-expression function declarations outside broad parser: 0
control-flow lexical artifacts: 130
file-local executable proof probes: 7
global method proof count promoted: 0
named method/helper/callback declarations in scope: 96
function declarations in scope: 59
plain function declarations: 54
async function declarations: 5
const helper/callback declarations: 37
const arrow helper/callback declarations: 35
top-level const arrow helper declarations: 11
local const arrow helper/callback declarations: 24
local const IIFE result declarations: 2
semantic method groups: 9
document references: 75
window references: 35
location references: 19
document.querySelector occurrences: 12
document.querySelectorAll occurrences: 10
querySelector?.( occurrences: 12
querySelectorAll( occurrences: 13
closest?.( occurrences: 26
matches?.( occurrences: 8
document.createElement occurrences: 5
addEventListener calls: 37
removeEventListener calls: 1
MutationObserver references: 6
observe calls: 7
disconnect calls: 2
setTimeout calls: 16
clearTimeout calls: 6
setInterval calls: 0
clearInterval calls: 0
requestAnimationFrame calls: 4
cancelAnimationFrame calls: 0
innerHTML references: 0
textContent references: 9
setAttribute calls: 17
removeAttribute calls: 12
toggleAttribute calls: 4
style.display references: 12
appendChild calls: 5
remove calls: 4
chrome.runtime?.sendMessage calls: 2
chrome.runtime references: 4
addChannelDirectly references: 2
applyDOMFallback references: 2
injectFilterTubeMenuItem references: 2
pending dropdown/channel maps: pendingShortsFetches, pendingWatchFetches, pendingDropdownFetches, dropdownVisibilityObservers, injectedDropdowns, scheduledDropdownInjections, processingDropdowns
runtime behavior changed: yes; quick-block periodic full-document sweep removed, desktop startup/mutation/navigation sweeps are lazy, eager sweep scheduling is limited to mobile/coarse surfaces, empty desktop blocklists still allow first-rule quick-block hover UI, desktop quick-block body observation is removed, stale quick-block viewport hosts are pruned, desktop quick-block button creation is hover-intent delayed, quick-block target resolution uses native closest before bounded parent walking, viewport occlusion probes are cached and per-frame host refreshes are capped, dropdown discovery is armed only after menu interaction, dropdown injection is deferred by a frame, dropdown visibility changes reuse the deferred injector, and quick-block lifecycle now keeps desktop first-rule creation hover-lazy without body-wide sweeps while dynamic pointermove recovery listener only attaches after pointerenter/quick-block arming

```

## Method Group Counts

```text
blockChannelCardTargetAndAnchorResolution: 9
blockChannelDropdownInjectionLifecycle: 15
blockChannelKidsNativeBlockSync: 5
blockChannelModuleStateAndModeGates: 6
blockChannelQuickBlockDomLifecycle: 24
blockChannelQuickBlockIdentityAndActionBuild: 9
blockChannelQuickBlockMutationAndImmediateHide: 3
blockChannelSurfaceOverlayAndVisibility: 12
blockChannelViewportHoverAndOcclusion: 13

```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `blockChannelModuleStateAndModeGates` | 6 | Reads debug state, checks whitelist mode, cleans injected menu items, and gates quick-block insertion through `currentSettings.enabled !== false`, `currentSettings.showQuickBlockButton === true`, and non-whitelist mode. | Shared settings-mode authority, disabled/no-rule lifecycle budget, stale settings refresh proof, and menu cleanup ownership. |
| `blockChannelSurfaceOverlayAndVisibility` | 12 | Detects mobile/desktop capability, visible elements, search overlays, YouTube modal overlays, cached surface-state invalidation/refresh, cached viewport-occlusion invalidation, stale viewport-host pruning, root surface attributes, and mobile watch-next hosts. | Route/surface effect authority, overlay pause proof, false-hide/false-control fixtures, and mobile/desktop parity proof. |
| `blockChannelCardTargetAndAnchorResolution` | 9 | Resolves post/Shorts/card hosts, outer nested Shorts hosts, hide targets, renderable anchors, bounds elements, and bounded event-target card lookup across desktop, mobile, Shorts, lockup, playlist, and YTK renderers. | Selector target ownership, sibling-visible fixtures, broad selector escape policy, and identity-confidence proof for each surface. |
| `blockChannelViewportHoverAndOcclusion` | 13 | Samples fixed/sticky top and bottom occlusion, caches viewport occlusion bounds, tests pointer geometry, tracks near-viewport quick-block hosts, toggles viewport-hidden state, caps RAF host updates, and holds sticky hover state timers. | Measured hover/render budget, overlay/fullscreen pause contract, timer cleanup, and route-specific no-work proof. |
| `blockChannelQuickBlockIdentityAndActionBuild` | 9 | Builds collaborator-aware quick-block context, strips literal ampersand Topic name-only stale rosters before Block All action construction, action labels, fallback metadata, and watch/Shorts fallback inputs from DOM/card extraction and learned video maps. | Per-card identity confidence report, collaborator target contract, malformed identity negatives, source-family fixture provenance, and installed-tab byte parity. |
| `blockChannelQuickBlockMutationAndImmediateHide` | 3 | Runs fallback mutations through `addChannelDirectly()` or `chrome.runtime?.sendMessage({ type: 'addFilteredChannel' })`, applies optimistic display-none hide, and can schedule `applyDOMFallback()`. | Mutation sender contract, optimistic-hide rollback proof, sibling-visible proof, background response semantics, and profile/list-mode authorization. |
| `blockChannelQuickBlockDomLifecycle` | 24 | Injects quick-block style/button DOM, attaches host/anchor/wrap/trigger listeners, delays desktop hover insertion behind hover intent, sweeps card selectors, installs document/window listeners, exposes settings-refresh cleanup, keeps body `MutationObserver` work mobile/coarse-only, uses bounded target lookup, and dynamically attaches/removes desktop pointermove recovery. | Lifecycle owner registry, disabled/no-rule zero-lifecycle proof, observer disconnect policy, route pause policy, and scroll/resize budget. |
| `blockChannelDropdownInjectionLifecycle` | 15 | Tracks last clicked 3-dot button, repairs stale FilterTube-hidden dropdown display state, observes dropdown visibility, arms short-lived dropdown discovery after menu interaction, defers dropdown injection by a frame, closes FilterTube-injected native dropdowns on outside pointer selection, serializes dropdown processing, stamps video card identity, injects menu items, and watches card/dropdown removal. | Dropdown observer registry, stale dropdown proof, teardown/disconnect coverage, action sender class, and per-surface selector confidence. |
| `blockChannelKidsNativeBlockSync` | 5 | Passively listens for Kids menu clicks and block toasts, captures menu/watch/channel context, dedupes recent actions, and sends `FilterTube_KidsBlockChannel` messages. | Kids/native sender contract, toast/click equivalence proof, channel identity fallback fixtures, locked profile gate, and duplicate suppression budget. |

## Lexical Callable Reconciliation

The repo-wide broad callable parser is intentionally conservative and overmatches
control-flow blocks in this large content script. File-local reconciliation keeps
those parser artifacts from becoming method proof:

```text
broad parser total matches: 226
accepted declaration/inventory rows: 96
plain function declarations accepted: 54
async function declarations accepted: 5
const arrow declarations accepted: 35
const IIFE result inventory rows accepted: 2
control-flow artifacts rejected: 130
if artifacts rejected: 104
for artifacts rejected: 24
while artifacts rejected: 2
assignment-expression function declarations outside broad parser: 0
global method proof count promoted: 0
runtime behavior changed: yes; periodic quick-block sweep removed, desktop quick-block sweeps are lazy, empty desktop blocklists keep first-rule quick-block hover UI without startup/body sweeps, desktop quick-block body observation is removed, stale viewport hosts are pruned, desktop hover insertion is delayed, viewport occlusion probes are cached and RAF host updates are capped, dropdown discovery is interaction-armed, dropdown injection is frame-deferred, visibility-triggered dropdown injection is also deferred, and pointermove recovery is dynamically attached in current runtime

```

The two accepted IIFE-result rows are inventory rows, not reusable exported
runtime callables. They stay in the method register because they create scoped
semantic decisions inside quick-block and Kids context extraction.

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 7 | `const arrow` | `blockChannelDebugLog` | `blockChannelModuleStateAndModeGates` |
| 29 | `const arrow` | `isWhitelistModeActive` | `blockChannelModuleStateAndModeGates` |
| 37 | `const arrow` | `cleanupInjectedMenuItems` | `blockChannelModuleStateAndModeGates` |
| 121 | `const arrow` | `isMobileYouTubeSurface` | `blockChannelSurfaceOverlayAndVisibility` |
| 143 | `const arrow` | `isHoverCapableDesktopSurface` | `blockChannelSurfaceOverlayAndVisibility` |
| 152 | `const arrow` | `isElementVisibleForQuickBlock` | `blockChannelSurfaceOverlayAndVisibility` |
| 168 | `const arrow` | `isMobileSearchSurfaceOpen` | `blockChannelSurfaceOverlayAndVisibility` |
| 206 | `const arrow` | `isYouTubeOverlaySurfaceOpen` | `blockChannelSurfaceOverlayAndVisibility` |
| 237 | `function` | `invalidateQuickBlockSurfaceStateCache` | `blockChannelSurfaceOverlayAndVisibility` |
| 241 | `function` | `invalidateQuickBlockOcclusionCache` | `blockChannelSurfaceOverlayAndVisibility` |
| 246 | `function` | `getQuickBlockSurfaceState` | `blockChannelSurfaceOverlayAndVisibility` |
| 274 | `const arrow` | `syncQuickBlockSurfaceState` | `blockChannelSurfaceOverlayAndVisibility` |
| 283 | `function` | `getQuickBlockViewportOcclusionBounds` | `blockChannelViewportHoverAndOcclusion` |
| 310 | `function` | `untrackQuickBlockViewportHost` | `blockChannelSurfaceOverlayAndVisibility` |
| 327 | `function` | `pruneQuickBlockViewportHosts` | `blockChannelSurfaceOverlayAndVisibility` |
| 353 | `function` | `shouldRefreshQuickBlockRuntimeState` | `blockChannelQuickBlockDomLifecycle` |
| 358 | `function` | `refreshQuickBlockRuntimeState` | `blockChannelQuickBlockDomLifecycle` |
| 369 | `function` | `refreshQuickBlockAvailability` | `blockChannelQuickBlockDomLifecycle` |
| 390 | `function` | `armQuickBlockPointerRecovery` | `blockChannelQuickBlockDomLifecycle` |
| 400 | `function` | `cancelQuickBlockHoverIntent` | `blockChannelQuickBlockDomLifecycle` |
| 411 | `function` | `scheduleQuickBlockHoverIntent` | `blockChannelQuickBlockDomLifecycle` |
| 460 | `const arrow` | `isMobileWatchNextQuickBlockHost` | `blockChannelSurfaceOverlayAndVisibility` |
| 495 | `function` | `isPostLikeQuickBlockCard` | `blockChannelCardTargetAndAnchorResolution` |
| 507 | `function` | `isShortsQuickBlockCard` | `blockChannelCardTargetAndAnchorResolution` |
| 522 | `function` | `resolveQuickBlockHost` | `blockChannelCardTargetAndAnchorResolution` |
| 557 | `function` | `resolveOutermostShortsQuickBlockHost` | `blockChannelCardTargetAndAnchorResolution` |
| 574 | `function` | `resolveQuickBlockHideTarget` | `blockChannelCardTargetAndAnchorResolution` |
| 600 | `function` | `isRenderableQuickBlockAnchor` | `blockChannelCardTargetAndAnchorResolution` |
| 617 | `function` | `resolveQuickBlockAnchor` | `blockChannelCardTargetAndAnchorResolution` |
| 688 | `function` | `getQuickBlockBoundsElement` | `blockChannelCardTargetAndAnchorResolution` |
| 710 | `function` | `getQuickBlockTopOcclusionPx` | `blockChannelViewportHoverAndOcclusion` |
| 755 | `function` | `getQuickBlockSampledTopOcclusionPx` | `blockChannelViewportHoverAndOcclusion` |
| 794 | `function` | `getQuickBlockBottomOcclusionTopPx` | `blockChannelViewportHoverAndOcclusion` |
| 835 | `function` | `getQuickBlockSampledBottomOcclusionTopPx` | `blockChannelViewportHoverAndOcclusion` |
| 882 | `function` | `pointInsideQuickBlockElementRect` | `blockChannelViewportHoverAndOcclusion` |
| 898 | `function` | `pointInsideQuickBlockHost` | `blockChannelViewportHoverAndOcclusion` |
| 903 | `function` | `updateQuickBlockViewportStateForHost` | `blockChannelViewportHoverAndOcclusion` |
| 932 | `function` | `isQuickBlockHostNearViewport` | `blockChannelViewportHoverAndOcclusion` |
| 948 | `function` | `ensureQuickBlockHostVisibilityObserver` | `blockChannelViewportHoverAndOcclusion` |
| 974 | `function` | `trackQuickBlockViewportHost` | `blockChannelViewportHoverAndOcclusion` |
| 989 | `function` | `scheduleQuickBlockViewportRefresh` | `blockChannelViewportHoverAndOcclusion` |
| 1029 | `function` | `setQuickBlockHoverStateForHost` | `blockChannelViewportHoverAndOcclusion` |
| 1190 | `function` | `findQuickBlockCardFromTarget` | `blockChannelCardTargetAndAnchorResolution` |
| 1212 | `const arrow` | `isQuickBlockEnabled` | `blockChannelModuleStateAndModeGates` |
| 1231 | `function` | `hasActiveQuickBlockRuleContext` | `blockChannelModuleStateAndModeGates` |
| 1237 | `const arrow` | `hasList` | `blockChannelModuleStateAndModeGates` |
| 1298 | `function` | `shouldEagerQuickBlockSweep` | `blockChannelQuickBlockDomLifecycle` |
| 1302 | `function` | `ensureQuickBlockStyles` | `blockChannelQuickBlockDomLifecycle` |
| 1415 | `function` | `removeQuickBlockButtons` | `blockChannelQuickBlockDomLifecycle` |
| 1425 | `function` | `createSyntheticQuickBlockMenuItem` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1435 | `function` | `collectQuickBlockCollaborators` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1437 | `const arrow` | `skipAmpersandTopicNameOnlyRoster` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1456 | `const arrow` | `pushCollaboratorList` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1550 | `function` | `buildQuickBlockContext` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1571 | `const IIFE result` | `isPostCard` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1614 | `function` | `getQuickBlockActionInfo` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1648 | `function` | `buildQuickBlockFallbackMetadata` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1660 | `function` | `getQuickBlockInput` | `blockChannelQuickBlockIdentityAndActionBuild` |
| 1678 | `async function` | `runQuickBlockFallback` | `blockChannelQuickBlockMutationAndImmediateHide` |
| 1732 | `function` | `applyQuickBlockImmediateHide` | `blockChannelQuickBlockMutationAndImmediateHide` |
| 1747 | `async function` | `runQuickBlockAction` | `blockChannelQuickBlockMutationAndImmediateHide` |
| 1788 | `function` | `attachQuickBlockWrapHoverEvents` | `blockChannelQuickBlockDomLifecycle` |
| 1792 | `const arrow` | `activate` | `blockChannelQuickBlockDomLifecycle` |
| 1793 | `const arrow` | `release` | `blockChannelQuickBlockDomLifecycle` |
| 1802 | `function` | `ensureQuickBlockButton` | `blockChannelQuickBlockDomLifecycle` |
| 1952 | `function` | `sweepQuickBlockButtons` | `blockChannelQuickBlockDomLifecycle` |
| 1963 | `function` | `scheduleQuickBlockSweep` | `blockChannelQuickBlockDomLifecycle` |
| 1993 | `function` | `setupQuickBlockObserver` | `blockChannelQuickBlockDomLifecycle` |
| 1999 | `const arrow` | `boot` | `blockChannelQuickBlockDomLifecycle` |
| 2058 | `const arrow` | `clearLast` | `blockChannelQuickBlockDomLifecycle` |
| 2066 | `const arrow` | `stopPointerMoveRecovery` | `blockChannelQuickBlockDomLifecycle` |
| 2082 | `const arrow` | `schedulePointerMoveRecoveryStop` | `blockChannelQuickBlockDomLifecycle` |
| 2094 | `const arrow` | `pickHostFromTarget` | `blockChannelQuickBlockDomLifecycle` |
| 2111 | `const arrow` | `getHostFromCachedTarget` | `blockChannelQuickBlockDomLifecycle` |
| 2118 | `const arrow` | `pickHostFromPoint` | `blockChannelQuickBlockDomLifecycle` |
| 2152 | `const arrow` | `tick` | `blockChannelQuickBlockDomLifecycle` |
| 2318 | `function` | `setupMenuObserver` | `blockChannelDropdownInjectionLifecycle` |
| 2339 | `const arrow` | `repairFilterTubeHiddenDropdownState` | `blockChannelDropdownInjectionLifecycle` |
| 2388 | `function` | `ensureDropdownVisibilityObserver` | `blockChannelDropdownInjectionLifecycle` |
| 2418 | `const arrow` | `isDropdownVisible` | `blockChannelDropdownInjectionLifecycle` |
| 2434 | `const arrow` | `scheduleDropdownInjection` | `blockChannelDropdownInjectionLifecycle` |
| 2439 | `const arrow` | `run` | `blockChannelDropdownInjectionLifecycle` |
| 2461 | `const arrow` | `handleCandidateDropdown` | `blockChannelDropdownInjectionLifecycle` |
| 2473 | `const arrow` | `scanExistingDropdowns` | `blockChannelDropdownInjectionLifecycle` |
| 2483 | `const arrow` | `closeFilterTubeInjectedDropdownsOnOutsidePointer` | `blockChannelDropdownInjectionLifecycle` |
| 2533 | `const arrow` | `stopDropdownDiscoveryObserver` | `blockChannelDropdownInjectionLifecycle` |
| 2545 | `const arrow` | `armDropdownDiscoveryObserver` | `blockChannelDropdownInjectionLifecycle` |
| 2593 | `const arrow` | `startObserver` | `blockChannelDropdownInjectionLifecycle` |
| 2609 | `function` | `setupKidsPassiveBlockListener` | `blockChannelKidsNativeBlockSync` |
| 2629 | `const arrow` | `waitBody` | `blockChannelKidsNativeBlockSync` |
| 2655 | `function` | `captureKidsMenuContext` | `blockChannelKidsNativeBlockSync` |
| 2693 | `const IIFE result` | `decoded` | `blockChannelKidsNativeBlockSync` |
| 2778 | `async function` | `handleKidsNativeBlock` | `blockChannelKidsNativeBlockSync` |
| 2878 | `function` | `tryInjectIntoVisibleDropdown` | `blockChannelDropdownInjectionLifecycle` |
| 2908 | `async function` | `handleDropdownAppeared` | `blockChannelDropdownInjectionLifecycle` |
| 2927 | `async function` | `handleDropdownAppearedInternal` | `blockChannelDropdownInjectionLifecycle` |

## Current Entrypoints And Dependencies

```text
module entrypoint: page script loaded by extension manifest
delayed boot entrypoint: setTimeout then setupMenuObserver and lazy setupQuickBlockObserver after 1000ms
browser/global export: none
CommonJS export: none
quick block enabled gate: currentSettings.enabled !== false, currentSettings.showQuickBlockButton === true, and currentSettings.listMode !== 'whitelist'
whitelist menu gate: isWhitelistModeActive then cleanupInjectedMenuItems
quick-block mutation path: handleBlockChannelClick if present, else addChannelDirectly, else chrome.runtime?.sendMessage({ type: 'addFilteredChannel' })
Kids mutation path: chrome.runtime?.sendMessage({ action: 'FilterTube_KidsBlockChannel' })
optimistic hide path: markElementAsBlocked then style.display = 'none' then filtertube-hidden class and data-filtertube-hidden
DOM fallback rerun path: setTimeout(() => applyDOMFallback(null, { preserveScroll: true }), 120)
dropdown injection dependency: injectFilterTubeMenuItem(dropdown, videoCard)
identity dependencies: extractChannelFromCard, FilterTubeIdentity, sanitizeCollaboratorList, normalizeCollaboratorChannelInfoForCard, learned videoChannelMap
observer ownership: mobile/coarse quick-block body observer, interaction-armed dropdown discovery observer, dropdown visibility observers, Kids toast body observer, per-card removal observer, per-dropdown close observer
listener ownership: document/window page-lifetime listeners, host/anchor/wrap/trigger listeners, native menu click listener, Kids passive click listener
timer ownership: one-second boot timeout, coalesced sweep timeout, hover timers, short-lived viewport occlusion cache, dynamic pointermove recovery stop timer, dropdown discovery stop timer, fallback rerun timeout, Kids dedupe timeout, body wait retry timeout, dropdown retry timeout; no periodic quick-block interval remains, empty desktop blocklists keep first-rule quick-block hover timers lazy, and desktop quick-block sweep timers are only created from hover/pointer paths rather than startup/mutation/navigation
clearInterval path: none
removeEventListener path: dynamic pointermove recovery listener only
```

## File-Local Executable Behavior Proof

`tests/runtime/block-channel-method-semantic-register-current-behavior.test.mjs`
now executes `js/content/block_channel.js` in a controlled VM harness. The
probes pin current behavior without promoting a global implementation gate:

```text
quick-block enabled gate proof: executable
whitelist cleanup proof: executable
quick-block DOM lifecycle proof: executable
direct mutation fallback proof: executable
background mutation fallback proof: executable
optimistic hide proof: executable
Kids native sync proof: executable
runtime behavior changed: yes; desktop quick-block eager sweeps are gated behind `shouldEagerQuickBlockSweep()`, viewport occlusion probes are cached, RAF host updates are capped, and dropdown visibility observer work is deferred
```

The executable proof confirms that:

| Probe | Current behavior pinned | Risk boundary |
| --- | --- | --- |
| Boot timer | Module load schedules the delayed `setupMenuObserver()` and `setupQuickBlockObserver()` boot at 1000ms. | Lifecycle cleanup still needs explicit owner/teardown authority; this proof does not add a clear path. |
| Quick-block mode gate | `enabled !== false`, `showQuickBlockButton === true`, and non-whitelist mode enable quick-block, including empty blocklists so the quick-cross can create the first channel rule; whitelist mode disables it. | Recent whitelist optimization cannot assume observers/listeners are absent, because setup still has page-lifetime owners. |
| Whitelist cleanup | `cleanupInjectedMenuItems()` removes stale `.filtertube-block-channel-item` nodes and drops dropdown WeakMap state. | This prevents stale menu state from being mistaken for a first-class whitelist authority. |
| Quick-block DOM lifecycle | `ensureQuickBlockButton()` adds host/wrap/button state when enabled and removes the wrap when whitelist mode is active. | DOM control insertion/removal remains local imperative behavior, not JSON-first filtering. |
| Direct mutation fallback | `runQuickBlockFallback()` calls `addChannelDirectly()` for each collaborator, carries group metadata, and passes sibling collaborator identifiers. | Future sender/persistence changes must preserve multi-collaborator semantics and metadata shape. |
| Background mutation fallback | Without `addChannelDirectly()`, fallback sends `type: 'addFilteredChannel'` with `profile: 'main'`. | Sender trust and profile authorization remain background-message obligations. |
| Optimistic hide and Kids sync | `applyQuickBlockImmediateHide()` marks and hides the card; Kids native sync sends `FilterTube_KidsBlockChannel` once for the deduped action. | Optimistic hide rollback, sibling visibility, and Kids sender trust remain unimplemented authority contracts. |

## Future Proof Fields

Each block-channel method row must eventually be backed by source line, fixture,
caller path, and observed success/failure effect before quick-block, native
dropdown, Kids sync, selector, lifecycle, or mutation behavior changes can
claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerSurface
routeSurface
settingsMode
listMode
profileTarget
quickBlockEnabledState
whitelistModeState
hostSelector
targetSelector
dropdownSelector
kidsSelector
identityConfidence
collaboratorSet
senderClass
mutationMessage
optimisticHideEffect
fallbackApplyEffect
menuInjectionEffect
kidsNativeEffect
lifecyclePrimitive
observerOwner
listenerOwner
timerOwner
intervalOwner
teardownPolicy
disabledNoWorkBudget
emptyRuleBudget
overlayPausePolicy
viewportBudget
hoverBudget
staleDropdownPolicy
duplicateSuppressionPolicy
positiveQuickBlockFixture
positiveDropdownFixture
positiveKidsNativeFixture
negativeDisabledFixture
negativeWhitelistFixture
negativeOverlayFixture
negativeSiblingVisibleFixture
negativeMalformedIdentityFixture
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
blockChannelMethodAuthority
blockChannelQuickBlockLifecycleContract
blockChannelQuickBlockActionReport
blockChannelAffordanceNoWorkBudget
blockChannelSelectorTargetReport
blockChannelOptimisticHideReport
blockChannelDropdownObserverRegistry
blockChannelKidsNativeSyncContract
blockChannelMutationSenderContract
blockChannelFixtureProvenance
```

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
