# FilterTube Content Bridge Selector Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

This register promotes the `js/content_bridge.js` selector hot-file row from selector-count proof to a source-derived owner/effect grouping. It covers all 246 current selector API sites in that file and calls out all 38 dynamic/non-literal selector expressions because those need explicit owner, route, escaping, and false-hide proof before selector behavior changes.

This is not completion proof for every DOM selector in the repository. It is also not permission to broaden, prune, merge, escape, or optimize selector behavior. Each group still needs route/surface fixtures, negative sibling-visible fixtures, no-rule budgets, and restore/teardown proof before implementation work.

## Source Pins

```text
source file: js/content_bridge.js
selector API sites: 246
static literal args: 208
dynamic/non-literal args: 38
unique static selector literals: 137
selector API families: 4
semantic selector groups: 13
dynamic selector families: 12
source-derived from exact DOM selector-register patterns
```

## Selector API Counts

| Selector API | Sites | Static literal args | Dynamic/non-literal args |
| --- | ---: | ---: | ---: |
| `querySelectorAll` | 29 | 9 | 20 |
| `querySelector` | 191 | 173 | 18 |
| `closest` | 25 | 25 | 0 |
| `matches` | 1 | 1 | 0 |
| **Total** | **246** | **208** | **38** |

## Semantic Selector Groups

| Semantic group | Sites | Static literal args | Dynamic/non-literal args |
| --- | ---: | ---: | ---: |
| `dropdownCleanupAndFrameWait` | 3 | 2 | 1 |
| `prefetchObserverAndRouteHooks` | 12 | 11 | 1 |
| `prefetchMapWritesAndMetaRerun` | 3 | 3 | 0 |
| `collaborationRetryAndSelectionState` | 42 | 31 | 11 |
| `mainWorldRequestResponseBridge` | 27 | 21 | 6 |
| `domFallbackStartupAndPendingWhitelist` | 4 | 0 | 4 |
| `fallbackMenuButtonLifecycle` | 11 | 9 | 2 |
| `playlistFallbackPopoverLifecycle` | 23 | 21 | 2 |
| `postActionShortsPlaylistEnrichment` | 3 | 3 | 0 |
| `menuInjectionWaitAndLookup` | 73 | 69 | 4 |
| `menuItemActionHandlers` | 12 | 12 | 0 |
| `blockClickHideMutationFollowup` | 21 | 18 | 3 |
| `globalBootstrap` | 12 | 8 | 4 |

## Dynamic Selector Families

| Dynamic family | Count | Risk shape |
| --- | ---: | --- |
| `callerProvidedSelector` | 7 | Caller/source ownership must be known before reuse or cleanup. |
| `globalCardSelectorConstant` | 1 | Mixed card constants can cross Main, mobile, playlist, Shorts, and Kids surfaces. |
| `joinedSelectorArray` | 4 | Locally assembled arrays need route and owner proof. |
| `runtimeVideoIdTemplate` | 8 | Runtime id templates need identity-source and escaping proof. |
| `collaborationGroupTemplate` | 5 | Group-id menu selectors need stale-group cleanup proof. |
| `linkSelectorConstant` | 3 | Link extraction selectors can turn DOM reads into identity authority. |
| `fallbackMenuCardSelectorConstant` | 1 | Fallback menu card selectors need fallback-action ownership and no-rule proof. |
| `nativeMenuSelectorConstant` | 1 | Native/fallback menu selectors do not share one action gate today. |
| `variantClassTemplate` | 1 | Runtime CSS class templates need class-source proof. |
| `postActionRouteSelectorConstant` | 2 | Post-action scans can fan out across Shorts and playlist routes. |
| `collaborationMenuKeyTemplate` | 2 | Collaboration key selectors need key source and stale-node proof. |
| `channelInfoVideoIdHrefTemplate` | 3 | Video-id href templates need escaping and false-positive sibling proof. |

## Dynamic Selector Inventory

| Line | API | Semantic group | Dynamic family | Expression |
| ---: | --- | --- | --- | --- |
| 396 | `querySelectorAll` | `dropdownCleanupAndFrameWait` | `callerProvidedSelector` | `selector` |
| 1131 | `querySelectorAll` | `prefetchObserverAndRouteHooks` | `globalCardSelectorConstant` | `typeof VIDEO_CARD_SELECTORS === 'string' ? VIDEO_CARD_SELECTORS : 'ytd-rich-item-renderer'` |
| 1588 | `querySelector` | `collaborationRetryAndSelectionState` | `joinedSelectorArray` | `selectors.join(',')` |
| 1753 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${id}"]`` |
| 1767 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `joinedSelectorArray` | `selectors.join(',')` |
| 2146 | `querySelector` | `collaborationRetryAndSelectionState` | `collaborationGroupTemplate` | ``.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${state.groupId}"]`` |
| 2256 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `collaborationGroupTemplate` | ``.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]:not([data-is-block-all="true"])`` |
| 2276 | `querySelector` | `collaborationRetryAndSelectionState` | `collaborationGroupTemplate` | ``.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]`` |
| 2302 | `querySelector` | `collaborationRetryAndSelectionState` | `collaborationGroupTemplate` | ``.filtertube-block-channel-item[data-is-block-all="true"][data-collaboration-group-id="${groupId}"]`` |
| 2378 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `collaborationGroupTemplate` | ``.filtertube-block-channel-item[data-collaboration-group-id="${groupId}"]`` |
| 2897 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `callerProvidedSelector` | `selector` |
| 2972 | `querySelector` | `collaborationRetryAndSelectionState` | `callerProvidedSelector` | `selector` |
| 2989 | `querySelectorAll` | `collaborationRetryAndSelectionState` | `linkSelectorConstant` | `linkSelectors` |
| 3517 | `querySelectorAll` | `mainWorldRequestResponseBridge` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${videoId}"]`` |
| 3617 | `querySelector` | `mainWorldRequestResponseBridge` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${videoId}"]`` |
| 3642 | `querySelectorAll` | `mainWorldRequestResponseBridge` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${videoId}"]`` |
| 4381 | `querySelectorAll` | `mainWorldRequestResponseBridge` | `linkSelectorConstant` | `linkSelectors` |
| 4531 | `querySelectorAll` | `mainWorldRequestResponseBridge` | `linkSelectorConstant` | `linkSelectors` |
| 5039 | `querySelectorAll` | `mainWorldRequestResponseBridge` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${safeVideoId}"]`` |
| 5862 | `querySelectorAll` | `domFallbackStartupAndPendingWhitelist` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${videoId}"]`` |
| 5877 | `querySelectorAll` | `domFallbackStartupAndPendingWhitelist` | `joinedSelectorArray` | `selectors.join(',')` |
| 5953 | `querySelector` | `domFallbackStartupAndPendingWhitelist` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${videoId}"]`` |
| 6007 | `querySelectorAll` | `domFallbackStartupAndPendingWhitelist` | `joinedSelectorArray` | `selectors.join(',')` |
| 6699 | `querySelector` | `fallbackMenuButtonLifecycle` | `nativeMenuSelectorConstant` | `nativeMenuSelector` |
| 6725 | `querySelector` | `fallbackMenuButtonLifecycle` | `variantClassTemplate` | ``.${variantClass}[data-filtertube-injected="true"]`` |
| 6955 | `querySelectorAll` | `playlistFallbackPopoverLifecycle` | `fallbackMenuCardSelectorConstant` | `fallbackMenuCardSelector` |
| 7315 | `querySelector` | `playlistFallbackPopoverLifecycle` | `callerProvidedSelector` | `selector` |
| 8315 | `querySelectorAll` | `menuInjectionWaitAndLookup` | `postActionRouteSelectorConstant` | `shortsSelectors` |
| 8520 | `querySelectorAll` | `menuInjectionWaitAndLookup` | `postActionRouteSelectorConstant` | `playlistSelectors` |
| 9196 | `querySelector` | `menuInjectionWaitAndLookup` | `callerProvidedSelector` | `selector` |
| 9209 | `querySelector` | `menuInjectionWaitAndLookup` | `callerProvidedSelector` | `selector` |
| 12449 | `querySelector` | `blockClickHideMutationFollowup` | `callerProvidedSelector` | `selector` |
| 12859 | `querySelector` | `blockClickHideMutationFollowup` | `collaborationMenuKeyTemplate` | ``.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${groupId}"]`` |
| 12939 | `querySelector` | `blockClickHideMutationFollowup` | `channelInfoVideoIdHrefTemplate` | ``ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`` |
| 13044 | `querySelector` | `globalBootstrap` | `channelInfoVideoIdHrefTemplate` | ``ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`` |
| 13126 | `querySelector` | `globalBootstrap` | `channelInfoVideoIdHrefTemplate` | ``ytd-rich-item-renderer a[href*="${channelInfo.videoId}"]`` |
| 13224 | `querySelectorAll` | `globalBootstrap` | `runtimeVideoIdTemplate` | ``[data-filtertube-video-id="${channelInfo.videoId}"]`` |
| 13246 | `querySelector` | `globalBootstrap` | `collaborationMenuKeyTemplate` | ``.filtertube-block-channel-item[data-collab-key="${key}"][data-collaboration-group-id="${collaborationGroupId}"]`` |
## Cross-Feature Risk Shape

```text
selector site
  -> identity metadata/card extraction
  -> menu injection and action binding
  -> DOM fallback, hide, and restore
  -> lifecycle callbacks and rescan timers
  -> background messages and network resolvers
  -> learned identity maps and stats/media side effects
```

The bridge selector surface mixes read-only extraction, action affordance lookup, optimistic hide lookup, collaboration menu state, fallback popover state, and post-action enrichment. A selector that is harmless as a local DOM read can still become a false-hide, stale-identity, route-leak, or performance risk when its output feeds message, hide, or fetch paths.

## Required Future Selector Contract Fields

```text
selectorSiteId
selectorApi
expressionKind
staticLiteralOrExpression
semanticGroup
ownerFunction
sourceTier
routeOrSurface
settingsPredicate
listMode
targetKind
actionKind
identitySourceTier
dynamicFamily
escapePolicy
allowedDomRead
allowedDomWrite
hideTargetBoundary
restoreOwner
teardownOwner
noRuleBudget
positiveFixture
negativeRouteFixture
negativeSiblingVisibleFixture
negativeNoRuleFixture
```

## Missing Runtime Authorities

These names are intentionally absent from runtime source today. They describe the authority shape needed before selector behavior can change:

```text
contentBridgeSelectorSemanticAuthority
contentBridgeSelectorEffectReport
contentBridgeSelectorOwnerContract
contentBridgeDynamicSelectorEscapePolicy
contentBridgeSelectorNoRuleBudget
contentBridgeSelectorRestoreProof
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this content bridge selector surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, selector cleanup, restore behavior changes,
dynamic selector policy changes, or message authority changes.
