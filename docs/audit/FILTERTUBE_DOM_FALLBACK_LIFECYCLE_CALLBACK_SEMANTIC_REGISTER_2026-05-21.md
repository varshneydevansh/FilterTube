# FilterTube DOM Fallback Lifecycle Callback Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes `js/content/dom_fallback.js` lifecycle instances from
source-count proof to a callback/effect inventory. It covers exactly the 14
current listener and timer instances in that file, using the same
lifecycle-register source patterns as
`tests/runtime/lifecycle-instance-register-current-behavior.test.mjs`.

This is not completion proof for every callback, promise continuation, event
method, or asynchronous side-effect path in `js/content/dom_fallback.js`. It is
also not permission to optimize, delete, gate, or merge lifecycle work. Each row
still needs a runtime owner/effect authority and positive plus negative fixtures
before behavior changes.

## Source Pins

```text
source file: js/content/dom_fallback.js
lifecycle instances: 14
lifecycle primitive families: 2
semantic callback groups: 8
explicit teardown or clear instances: 0
page-lifetime listener guards: 3
source-derived from exact lifecycle-register patterns
```

## Primitive Family Counts

| Primitive family | Count |
| --- | ---: |
| `addEventListener` | 3 |
| `setTimeout` | 11 |

## Semantic Callback Groups

| Semantic group | Count |
| --- | ---: |
| `currentWatchOwnerRetryAndNavigationTimers` | 4 |
| `continuationNudgeTimer` | 1 |
| `mainPipelineYieldTimer` | 1 |
| `mainPipelineScrollStateListener` | 1 |
| `playlistClickEndedGuards` | 2 |
| `playlistAutoplayDeferredClickTimer` | 1 |
| `pendingMetadataAndSelectedRowTimers` | 3 |
| `pendingRunRerunTimer` | 1 |

## Instance Inventory

| Line | Primitive | Semantic group | Source snippet |
| ---: | --- | --- | --- |
| 873 | `setTimeout` | `currentWatchOwnerRetryAndNavigationTimers` | `setTimeout(() => {` |
| 883 | `setTimeout` | `currentWatchOwnerRetryAndNavigationTimers` | `setTimeout(() => {` |
| 902 | `setTimeout` | `currentWatchOwnerRetryAndNavigationTimers` | `setTimeout(() => {` |
| 915 | `setTimeout` | `currentWatchOwnerRetryAndNavigationTimers` | `setTimeout(() => {` |
| 1077 | `setTimeout` | `continuationNudgeTimer` | `state.timer = setTimeout(() => {` |
| 2240 | `setTimeout` | `mainPipelineYieldTimer` | `const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));` |
| 2290 | `addEventListener` | `mainPipelineScrollStateListener` | `window.addEventListener('scroll', () => {` |
| 2519 | `addEventListener` | `playlistClickEndedGuards` | `document.addEventListener('click', (event) => {` |
| 2583 | `addEventListener` | `playlistClickEndedGuards` | `document.addEventListener('ended', (event) => {` |
| 2612 | `setTimeout` | `playlistAutoplayDeferredClickTimer` | `setTimeout(() => {` |
| 3913 | `setTimeout` | `pendingMetadataAndSelectedRowTimers` | `pendingTimerState.timer = setTimeout(() => {` |
| 3935 | `setTimeout` | `pendingMetadataAndSelectedRowTimers` | `pendingTimerState.timer = setTimeout(() => {` |
| 4001 | `setTimeout` | `pendingMetadataAndSelectedRowTimers` | `setTimeout(() => {` |
| 4722 | `setTimeout` | `pendingRunRerunTimer` | `setTimeout(() => applyDOMFallback(runState.latestSettings, runState.latestOptions), 0);` |

## Cross-Feature Risk Shape

```text
DOM fallback lifecycle callback
  -> current watch owner enforcement
  -> search/watch continuation nudge
  -> playlist panel retry and synthetic navigation
  -> main DOM fallback pipeline yielding and scroll state
  -> playlist next/previous and autoplay guards
  -> pending category/upload-date metadata reruns
  -> serialized pending run reruns
```

The callback chain touches route/list-mode predicates, DOM hide/restore,
playlist navigation, media pause, synthetic clicks, pending metadata, and
serialized reruns. A timer that is necessary after a real hide can still be
wrong on an empty-rule route, a whitelist path, a native overlay, or a selected
playlist row if it lacks a shared lifecycle budget.

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
mediaOrPlayerEffect
syntheticNavigationEffect
teardownOwner
pageLifetimeReason
nativeOverlayPausePolicy
fullscreenPausePolicy
noRuleBudget
positiveFixture
negativeRouteFixture
negativeNoRuleFixture
negativeOverlayFixture
negativeFullscreenNativeFixture
restoreOrClearProof
```

## Missing Runtime Authorities

These names are intentionally absent from runtime source today. They describe
the authority shape needed before changing behavior:

```text
domFallbackLifecycleCallbackAuthority
domFallbackLifecycleEffectReport
domFallbackCallbackOwnerContract
domFallbackNoRuleLifecycleBudget
domFallbackCallbackTeardownRegistry
domFallbackPlaylistGuardPolicy
domFallbackPendingRunBudget
domFallbackSyntheticNavigationBudget
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM fallback lifecycle callback register
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
