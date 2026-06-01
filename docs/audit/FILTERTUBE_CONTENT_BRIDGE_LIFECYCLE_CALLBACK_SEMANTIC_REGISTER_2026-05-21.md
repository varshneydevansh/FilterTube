# FilterTube Content Bridge Lifecycle Callback Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content_bridge.js` lifecycle instances from source-count proof to a callback/effect inventory. It covers exactly the 91 current listener, observer, timer, interval, and frame instances in that file, using the same lifecycle-register source patterns as `tests/runtime/lifecycle-instance-register-current-behavior.test.mjs`.

This is not completion proof for every nested callback, promise continuation, event method, or asynchronous side-effect path in `js/content_bridge.js`. It is also not permission to optimize, delete, gate, or merge lifecycle work. Each row still needs a runtime owner/effect authority and positive plus negative fixtures before behavior changes.

## Source Pins

```text
source file: js/content_bridge.js
lifecycle instances: 91
lifecycle primitive families: 9
semantic callback groups: 13
source-derived from exact lifecycle-register patterns
```

## Primitive Family Counts

| Primitive family | Count |
| --- | ---: |
| `addEventListener` | 25 |
| `removeEventListener` | 1 |
| `mutationObserver` | 7 |
| `intersectionObserver` | 1 |
| `setInterval` | 1 |
| `clearInterval` | 1 |
| `setTimeout` | 36 |
| `clearTimeout` | 10 |
| `requestAnimationFrame` | 9 |
| `cancelAnimationFrame` | 0 |

## Semantic Callback Groups

| Semantic group | Count |
| --- | ---: |
| `dropdownCleanupAndFrameWait` | 1 |
| `prefetchObserverAndRouteHooks` | 3 |
| `prefetchMapWritesAndMetaRerun` | 12 |
| `collaborationRetryAndSelectionState` | 8 |
| `mainWorldRequestResponseBridge` | 9 |
| `domFallbackStartupAndPendingWhitelist` | 11 |
| `fallbackMenuButtonLifecycle` | 2 |
| `playlistFallbackPopoverLifecycle` | 21 |
| `postActionShortsPlaylistEnrichment` | 7 |
| `menuInjectionWaitAndLookup` | 0 |
| `menuItemActionHandlers` | 6 |
| `blockClickHideMutationFollowup` | 4 |
| `globalBootstrap` | 7 |

## Instance Inventory

| Line | Primitive | Semantic group | Source snippet |
| ---: | --- | --- | --- |
| 569 | `setTimeout` | `dropdownCleanupAndFrameWait` | `setTimeout(() => {` |
| 590 | `setTimeout` | `prefetchObserverAndRouteHooks` | `const schedule = () => setTimeout(resolve, Math.max(0, delayMs));` |
| 592 | `requestAnimationFrame` | `prefetchObserverAndRouteHooks` | `requestAnimationFrame(schedule);` |
| 1108 | `requestAnimationFrame` | `prefetchObserverAndRouteHooks` | `requestAnimationFrame(() => {` |
| 1148 | `intersectionObserver` | `prefetchMapWritesAndMetaRerun` | `prefetchObserver = new IntersectionObserver((entries) => {` |
| 1160 | `addEventListener` | `prefetchMapWritesAndMetaRerun` | `document.addEventListener('visibilitychange', () => {` |
| 1185 | `addEventListener` | `prefetchMapWritesAndMetaRerun` | `document.addEventListener('scroll', (event) => {` |
| 1193 | `mutationObserver` | `prefetchMapWritesAndMetaRerun` | `const observer = new MutationObserver(() => {` |
| 1206 | `addEventListener` | `prefetchMapWritesAndMetaRerun` | `document.addEventListener('yt-navigate-finish', () => {` |
| 1242 | `setTimeout` | `prefetchMapWritesAndMetaRerun` | `if (!whitelistRefreshImmediateTimer) whitelistRefreshImmediateTimer = setTimeout(() => { whitelistRefreshImmediateTimer = 0; runWhitelistRefreshPass(); }, 0);` |
| 1244 | `setTimeout` | `prefetchMapWritesAndMetaRerun` | `if (!whitelistRefreshFollowupTimer) whitelistRefreshFollowupTimer = setTimeout(() => { whitelistRefreshFollowupTimer = 0; runWhitelistRefreshPass(); }, 120);` |
| 1248 | `mutationObserver` | `prefetchMapWritesAndMetaRerun` | `const observer = new MutationObserver(() => {` |
| 1266 | `addEventListener` | `prefetchMapWritesAndMetaRerun` | `document.addEventListener('yt-navigate-finish', () => {` |
| 1276 | `addEventListener` | `prefetchMapWritesAndMetaRerun` | `document.addEventListener('yt-navigate-finish', () => {` |
| 1387 | `setTimeout` | `prefetchMapWritesAndMetaRerun` | `new Promise((resolve) => setTimeout(() => resolve(null), ms))` |
| 1503 | `setTimeout` | `prefetchMapWritesAndMetaRerun` | `state.timer = setTimeout(() => { state.timer = 0; try { applyDOMFallback(null); } catch (e) { } }, 120);` |
| 1716 | `clearTimeout` | `collaborationRetryAndSelectionState` | `clearTimeout(pendingVideoMetaDomRerunTimer);` |
| 1718 | `setTimeout` | `collaborationRetryAndSelectionState` | `pendingVideoMetaDomRerunTimer = setTimeout(() => {` |
| 2107 | `setTimeout` | `collaborationRetryAndSelectionState` | `const timerId = setTimeout(() => {` |
| 2123 | `clearTimeout` | `collaborationRetryAndSelectionState` | `clearTimeout(timerId);` |
| 2298 | `requestAnimationFrame` | `collaborationRetryAndSelectionState` | `requestAnimationFrame(() => {` |
| 2313 | `requestAnimationFrame` | `collaborationRetryAndSelectionState` | `requestAnimationFrame(() => refreshMultiStepSelections(groupId));` |
| 3354 | `setTimeout` | `collaborationRetryAndSelectionState` | `entry.expiryTimeout = setTimeout(() => {` |
| 3385 | `setTimeout` | `collaborationRetryAndSelectionState` | `setTimeout(() => {` |
| 3591 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 3696 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 5519 | `setTimeout` | `mainWorldRequestResponseBridge` | `const timeoutId = setTimeout(() => {` |
| 5549 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 5554 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 5569 | `setTimeout` | `mainWorldRequestResponseBridge` | `const timeoutId = setTimeout(() => {` |
| 5597 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 5602 | `setTimeout` | `mainWorldRequestResponseBridge` | `setTimeout(() => {` |
| 5619 | `setTimeout` | `mainWorldRequestResponseBridge` | `const armTimeout = () => setTimeout(() => {` |
| 5892 | `requestAnimationFrame` | `domFallbackStartupAndPendingWhitelist` | `requestAnimationFrame(() => {` |
| 5945 | `clearTimeout` | `domFallbackStartupAndPendingWhitelist` | `clearTimeout(pending.timeoutId);` |
| 5969 | `clearTimeout` | `domFallbackStartupAndPendingWhitelist` | `clearTimeout(pending.timeoutId);` |
| 5970 | `setTimeout` | `domFallbackStartupAndPendingWhitelist` | `pending.timeoutId = setTimeout(() => {` |
| 5988 | `clearTimeout` | `domFallbackStartupAndPendingWhitelist` | `clearTimeout(pending.timeoutId);` |
| 6037 | `clearTimeout` | `domFallbackStartupAndPendingWhitelist` | `clearTimeout(pending.timeoutId);` |
| 6089 | `setTimeout` | `domFallbackStartupAndPendingWhitelist` | `await new Promise(resolve => setTimeout(resolve, 1000));` |
| 6118 | `requestAnimationFrame` | `domFallbackStartupAndPendingWhitelist` | `requestAnimationFrame(() => {` |
| 6126 | `setTimeout` | `domFallbackStartupAndPendingWhitelist` | `pendingImmediateFallbackTimer = setTimeout(() => {` |
| 6158 | `setTimeout` | `domFallbackStartupAndPendingWhitelist` | `whitelistPendingRefreshState.timer = setTimeout(() => {` |
| 6208 | `setTimeout` | `domFallbackStartupAndPendingWhitelist` | `whitelistPendingRefreshState.pendingHideTimer = setTimeout(() => {` |
| 6416 | `mutationObserver` | `fallbackMenuButtonLifecycle` | `const observer = new MutationObserver(mutations => {` |
| 6447 | `addEventListener` | `fallbackMenuButtonLifecycle` | `document.addEventListener('DOMContentLoaded', () => {` |
| 6854 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `btn.addEventListener('click', (e) => {` |
| 7070 | `requestAnimationFrame` | `playlistFallbackPopoverLifecycle` | `requestAnimationFrame(runScan);` |
| 7071 | `setTimeout` | `playlistFallbackPopoverLifecycle` | `setTimeout(runScan, 120);` |
| 7082 | `requestAnimationFrame` | `playlistFallbackPopoverLifecycle` | `requestAnimationFrame(runScan);` |
| 7083 | `setTimeout` | `playlistFallbackPopoverLifecycle` | `setTimeout(runScan, 160);` |
| 7094 | `mutationObserver` | `playlistFallbackPopoverLifecycle` | `const observer = new MutationObserver((mutations) => {` |
| 7129 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `document.addEventListener('DOMContentLoaded', () => {` |
| 7138 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `document.addEventListener('yt-navigate-finish', () => {` |
| 7151 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `document.addEventListener('pointerover', scheduleHoveredFallbackCard, { capture: true, passive: true });` |
| 7152 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `document.addEventListener('focusin', scheduleHoveredFallbackCard, true);` |
| 7153 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `document.addEventListener('click', (event) => {` |
| 7170 | `setTimeout` | `playlistFallbackPopoverLifecycle` | `setTimeout(() => {` |
| 7178 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `window.addEventListener('scroll', () => {` |
| 7182 | `clearTimeout` | `playlistFallbackPopoverLifecycle` | `clearTimeout(pendingScrollRescanTimer);` |
| 7188 | `clearTimeout` | `playlistFallbackPopoverLifecycle` | `clearTimeout(pendingScrollRescanTimer);` |
| 7190 | `setTimeout` | `playlistFallbackPopoverLifecycle` | `pendingScrollRescanTimer = setTimeout(() => {` |
| 7198 | `setInterval` | `playlistFallbackPopoverLifecycle` | `const warmupTimer = setInterval(() => {` |
| 7204 | `clearInterval` | `playlistFallbackPopoverLifecycle` | `clearInterval(warmupTimer);` |
| 7219 | `requestAnimationFrame` | `playlistFallbackPopoverLifecycle` | `requestAnimationFrame(() => {` |
| 7264 | `removeEventListener` | `playlistFallbackPopoverLifecycle` | `document.removeEventListener('click', playlistFallbackPopoverState.onDocClick, true);` |
| 7411 | `addEventListener` | `playlistFallbackPopoverLifecycle` | `toggle.addEventListener('click', (e) => {` |
| 7647 | `setTimeout` | `postActionShortsPlaylistEnrichment` | `await new Promise(resolve => setTimeout(resolve, 85));` |
| 7651 | `addEventListener` | `postActionShortsPlaylistEnrichment` | `item.addEventListener('click', (e) => {` |
| 7664 | `addEventListener` | `postActionShortsPlaylistEnrichment` | `item.addEventListener('keydown', (e) => {` |
| 7798 | `mutationObserver` | `postActionShortsPlaylistEnrichment` | `const observer = new MutationObserver((mutations) => {` |
| 7842 | `addEventListener` | `postActionShortsPlaylistEnrichment` | `document.addEventListener('click', playlistFallbackPopoverState.onDocClick, true);` |
| 7905 | `clearTimeout` | `postActionShortsPlaylistEnrichment` | `if (timeoutId) clearTimeout(timeoutId);` |
| 7906 | `setTimeout` | `postActionShortsPlaylistEnrichment` | `timeoutId = setTimeout(() => {` |
| 10903 | `clearTimeout` | `menuItemActionHandlers` | `if (timeoutId) clearTimeout(timeoutId);` |
| 10951 | `mutationObserver` | `menuItemActionHandlers` | `observer = new MutationObserver(() => {` |
| 10968 | `mutationObserver` | `menuItemActionHandlers` | `closeObserver = new MutationObserver(() => {` |
| 10978 | `setTimeout` | `menuItemActionHandlers` | `timeoutId = setTimeout(() => {` |
| 11474 | `addEventListener` | `menuItemActionHandlers` | `menuItem.addEventListener('click', handleInteraction, { capture: true });` |
| 11475 | `addEventListener` | `menuItemActionHandlers` | `menuItem.addEventListener('keydown', (event) => {` |
| 11639 | `addEventListener` | `blockClickHideMutationFollowup` | `toggle.addEventListener('click', (e) => {` |
| 11795 | `addEventListener` | `blockClickHideMutationFollowup` | `toggle.addEventListener('click', (e) => {` |
| 11886 | `addEventListener` | `blockClickHideMutationFollowup` | `toggle.addEventListener('click', (e) => {` |
| 12552 | `setTimeout` | `blockClickHideMutationFollowup` | `setTimeout(() => {` |
| 13174 | `setTimeout` | `globalBootstrap` | `setTimeout(() => {` |
| 13305 | `setTimeout` | `globalBootstrap` | `setTimeout(() => {` |
| 13344 | `setTimeout` | `globalBootstrap` | `setTimeout(() => {` |
| 13467 | `addEventListener` | `globalBootstrap` | `checkbox.addEventListener('click', (e) => {` |
| 13474 | `addEventListener` | `globalBootstrap` | `checkbox.addEventListener('change', (e) => {` |
| 13567 | `addEventListener` | `globalBootstrap` | `window.addEventListener('message', handleMainWorldMessages, false);` |
| 13569 | `setTimeout` | `globalBootstrap` | `setTimeout(() => initialize(), 50);` |
## Cross-Feature Risk Shape

```text
lifecycle callback
  -> prefetch/identity/route hooks
  -> page/main-world/background messages
  -> pending whitelist/DOM fallback
  -> fallback menus/popovers
  -> menu action handlers
  -> block click followups
  -> global bootstrap
```

The callback chain touches identity confidence, list-mode predicates, settings refreshes, message trust, DOM hide/restore, fallback UI, stats/media side effects, network fanout, and route lifecycle. A callback can be cheap and safe in one group while still leaking work, stale identity, or broad hide behavior through another group.

## Required Future Callback Contract Fields

```text
instanceId
primitiveFamily
ownerFunction
callbackKind
installTrigger
routeOrSurface
settingsPredicate
listMode
identitySourceTier
allowedEffects
scheduledDomWork
scheduledNetworkWork
scheduledMessageWork
storageOrStatsEffect
teardownOwner
pageLifetimeReason
nativeOverlayPausePolicy
fullscreenPausePolicy
noRuleBudget
positiveFixture
negativeRouteFixture
negativeNoRuleFixture
negativeOverlayFixture
restoreOrClearProof
```

## Missing Runtime Authorities

These names are intentionally absent from runtime source today. They describe the authority shape needed before changing behavior:

```text
contentBridgeLifecycleCallbackAuthority
contentBridgeLifecycleEffectReport
contentBridgeCallbackOwnerContract
contentBridgeNoRuleLifecycleBudget
contentBridgeCallbackTeardownRegistry
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content bridge lifecycle callback surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, callback cleanup, observer/timer changes,
teardown changes, or selector/message authority changes.
