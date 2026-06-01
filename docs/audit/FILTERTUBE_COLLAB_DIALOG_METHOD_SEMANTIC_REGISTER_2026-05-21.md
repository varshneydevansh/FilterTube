# FilterTube Collaborator Dialog Method Semantic Register - Current Behavior - 2026-05-21

Status: current-behavior register with 2026-05-26 lazy lifecycle runtime fix.

This register promotes `js/content/collab_dialog.js` from lifecycle-only
coverage to a source-derived method inventory. It covers the isolated-world
collaboration dialog helper that tracks pending collaborator cards, listens for
click/keyboard dialog triggers, observes YouTube dialog DOM, extracts
collaborator identities, mutates card identity attributes, updates learned
collaborator maps, refreshes active menus, schedules DOM fallback reruns, and
broadcasts `FilterTube_CollabDialogData`.

This is not completion proof for collaborator lifecycle ownership, page-message
trust, pending-card provenance, dialog title/header acceptance, learned identity
confidence, Mix/avatar-stack false-hide boundaries, route/profile/list-mode
negative fixtures, disabled/no-rule lifecycle budgets, observer/listener
teardown, or future simultaneous allow/block semantics. It is a
current-behavior boundary before collaborator dialog setup, pending-card
ownership, dialog selector, learned-identity mutation, page-message trust, or
lifecycle cleanup changes.

## Source-Derived Summary

```text
source file: js/content/collab_dialog.js
line count: 393
named function declarations in scope: 17
plain function declarations: 17
async function declarations: 0
const helper/callback declarations: 0
arrow callback sites in scope: 9
semantic method groups: 6
document literal occurrences: 9
window literal occurrences: 16
location literal occurrences: 0
document.querySelector calls: 0
document.querySelectorAll calls: 1
element querySelector calls: 6
querySelector?. calls: 1
element querySelectorAll calls: 1
closest calls: 2
matches calls: 1
document.createElement calls: 0
addEventListener calls: 3
removeEventListener calls: 2
MutationObserver references: 1
observe calls: 1
disconnect calls: 0
setTimeout calls: 2
clearTimeout calls: 2
setInterval calls: 0
clearInterval calls: 0
requestAnimationFrame calls: 0
cancelAnimationFrame calls: 0
innerHTML references: 0
textContent references: 3
setAttribute calls: 7
removeAttribute calls: 4
appendChild calls: 0
remove calls: 0
postMessage calls: 1
applyDOMFallback references: 2
pendingCollabCards references: 9
pendingCollabDialogTrigger references: 12
resolvedCollaboratorsByVideoId references: 2
refreshActiveCollaborationMenu references: 1
window.collabDialogModule public entries: 5
browser/global export: window.collabDialogModule
CommonJS export: none
runtime behavior changed: yes; collaborator dialog listeners and MutationObserver are lazy and disconnect when no pending collaborator cards remain
```

## Method Group Counts

```text
collabDialogAcceptanceAndObserverDispatch: 1
collabDialogBroadcastAndExtraction: 2
collabDialogCardMutationAndPropagation: 2
collabDialogEntryResolution: 1
collabDialogRefreshAndBootLifecycle: 7
collabDialogTriggerCaptureAndQueue: 4
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `collabDialogRefreshAndBootLifecycle` | 7 | Schedules a delayed `applyDOMFallback()` rerun, checks pending-card state, lazily installs/removes document capture listeners, lazily installs/disconnects the document-wide `MutationObserver`, and exposes lifecycle helpers through `window.collabDialogModule`. | Shared lifecycle owner, active-rule/no-rule work budget, pending-card ownership proof, observer disconnect policy, listener removal policy, and route/fullscreen/native pause proof. |
| `collabDialogTriggerCaptureAndQueue` | 4 | Resolves avatar/name trigger targets, verifies `window.pendingCollabCards`, stores `window.pendingCollabDialogTrigger`, and clears it with a 5000ms timeout. | Pending-card owner authority, dialog trigger provenance, duplicate/expired trigger fixtures, keyboard/click parity, and spoofed card-key negatives. |
| `collabDialogEntryResolution` | 1 | Picks a pending card from the active trigger or from collaborator handle/name matches, then tie-breaks by expected collaborator count, list quality, and recency. | Identity confidence report, collision policy, malformed collaborator fixtures, stale pending-card cleanup, and route/profile/list-mode negative proof. |
| `collabDialogCardMutationAndPropagation` | 2 | Writes collaborator attributes, clears pending markers, propagates same-video card metadata, updates `resolvedCollaboratorsByVideoId`, refreshes active menus, clears timeouts, deletes pending entries, and broadcasts dialog data. | Learned-identity mutation authority, sibling-visible false-hide proof, rollback/restore proof, mutation revision, and exact side-effect owner. |
| `collabDialogBroadcastAndExtraction` | 2 | Extracts names, handles, ids, custom URLs, and fallback data from `yt-list-item-view-model` nodes, then posts `FilterTube_CollabDialogData` to `window` with wildcard target. | Page-message trust contract, extractor provenance, title/header fixture coverage, wildcard target policy, and source-family fixture proof. |
| `collabDialogAcceptanceAndObserverDispatch` | 1 | Accepts collaborator dialogs by title when present, can proceed when title text is missing, requires at least two extracted collaborators, resolves a pending entry, and applies collaborator data. | Dialog selector target ownership, no-title negative fixtures, non-collab dialog negatives, observer dispatch budget, and action-scoped acceptance proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 29 | `function` | `hasPendingCollabCards` | `collabDialogRefreshAndBootLifecycle` |
| 37 | `function` | `scheduleCollaboratorRefresh` | `collabDialogRefreshAndBootLifecycle` |
| 46 | `function` | `isCollabDialogTriggerTarget` | `collabDialogTriggerCaptureAndQueue` |
| 54 | `function` | `queuePendingDialogTrigger` | `collabDialogTriggerCaptureAndQueue` |
| 69 | `function` | `handlePotentialCollabTrigger` | `collabDialogTriggerCaptureAndQueue` |
| 76 | `function` | `handlePotentialCollabTriggerKeydown` | `collabDialogTriggerCaptureAndQueue` |
| 84 | `function` | `ensureCollabTriggerListeners` | `collabDialogRefreshAndBootLifecycle` |
| 91 | `function` | `removeCollabTriggerListeners` | `collabDialogRefreshAndBootLifecycle` |
| 101 | `function` | `resolveCollabEntryForDialog` | `collabDialogEntryResolution` |
| 156 | `function` | `propagateCollaboratorsToMatchingCards` | `collabDialogCardMutationAndPropagation` |
| 168 | `function` | `applyCollaboratorsToCard` | `collabDialogCardMutationAndPropagation` |
| 233 | `function` | `broadcastCollabDialogData` | `collabDialogBroadcastAndExtraction` |
| 254 | `function` | `extractCollaboratorsFromDialog` | `collabDialogBroadcastAndExtraction` |
| 311 | `function` | `handleCollaborationDialog` | `collabDialogAcceptanceAndObserverDispatch` |
| 326 | `function` | `ensureCollabDialogObserver` | `collabDialogRefreshAndBootLifecycle` |
| 361 | `function` | `disconnectCollabDialogObserver` | `collabDialogRefreshAndBootLifecycle` |
| 370 | `function` | `refreshCollabDialogRuntime` | `collabDialogRefreshAndBootLifecycle` |

## Current Entrypoints And Dependencies

```text
module entrypoint: manifest-loaded isolated-world content script before content_bridge.js
boot entrypoint: document.addEventListener('DOMContentLoaded', () => refreshCollabDialogRuntime())
late readyState branch: none
browser/global export: window.collabDialogModule
exported helpers: ensureCollabDialogObserver, ensureCollabTriggerListeners, refreshCollabDialogRuntime, scheduleCollaboratorRefresh, applyCollaboratorsToCard
CommonJS export: none
shared pending state: window.pendingCollabCards and window.pendingCollabDialogTrigger
refresh path: setTimeout(() => applyDOMFallback(null, { preserveScroll: true, forceReprocess: false }), 200)
trigger timeout path: setTimeout(() => window.pendingCollabDialogTrigger = null, 5000)
trigger listener ownership: document click and keydown capture listeners only while pending collaborator cards exist
observer ownership: one documentElement/body MutationObserver with childList and subtree only while pending collaborator cards exist
observer teardown path: disconnectCollabDialogObserver
listener teardown path: removeCollabTriggerListeners
dialog selector: tp-yt-paper-dialog
dialog title selector: yt-dialog-header-view-model, h2, [role="heading"]
collaborator row selector: yt-list-item-view-model
collaborator link selectors: .yt-list-item-view-model__title, a[href*="/@"], a, a[href], .yt-list-item-view-model__subtitle
card mutation path: data-filtertube-collaborators, data-filtertube-collaborators-source, data-filtertube-expected-collaborators, data-filtertube-collab-state, data-filtertube-video-id
learned map mutation path: resolvedCollaboratorsByVideoId.set(entry.videoId, sanitizedCollaborators)
menu refresh dependency: refreshActiveCollaborationMenu(entry.videoId, sanitizedCollaborators, { expectedCount })
page message path: window.postMessage({ type: 'FilterTube_CollabDialogData', source: 'collab_dialog' }, '*')
identity helper dependencies: sanitizeCollaboratorList, getCachedCollaboratorsFromCard, getCollaboratorListQuality, extractHandleFromString, extractChannelIdFromString, scanDataForChannelIdentifiers, normalizeHandleValue
```

## Future Proof Fields

Each collaborator-dialog method row must eventually be backed by source line,
fixture, caller path, and observed success/failure effect before collaborator
dialog, Mix/collab, learned identity, page-message trust, or lifecycle behavior
changes can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
callerSurface
routeSurface
settingsMode
listMode
profileTarget
compiledActiveState
collaboratorRecoveryReason
pendingCardKey
pendingCardOwner
dialogTriggerSource
dialogTitleState
dialogSelector
collaboratorSelector
identityConfidence
sanitizationResult
mutationAttributes
learnedMapEffect
menuRefreshEffect
fallbackRerunEffect
pageMessageType
pageMessageTarget
senderClass
lifecyclePrimitive
observerOwner
listenerOwner
timerOwner
teardownPolicy
noRuleBudget
negativeFixture
positiveFixture
sourceFamilyProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source today:

```text
collabDialogMethodAuthority
collabDialogLifecycleContract
collabDialogPendingCardAuthority
collabDialogMutationReport
collabDialogMessageTrustContract
collabDialogSelectorTargetReport
collabDialogIdentityConfidenceReport
collabDialogNoWorkBudget
collabDialogTeardownRegistry
collabDialogFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: yes; collaborator dialog lifecycle is lazy while semantic proof remains incomplete
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
