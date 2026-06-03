# FilterTube Content Bridge Menu Injection Action Boundary - Current Behavior

Status: current-behavior proof only.

This is not an implementation patch. It is not approval to change runtime filtering, JSON mutation, DOM mutation, storage, message, lifecycle, network, prompt, or settings semantics. This codebase inspection is finding optimization locations and first-class JSON filter blockers before product changes.

## Boundary

This slice pins the content-bridge menu injection and menu-action side-effect path in `js/content_bridge.js`: metadata payload construction, dropdown cleanup, injected menu rendering handoff, pending dropdown fetch state, collaborator enrichment, menu item interaction handling, blocked marker writers, clicked-target/comment-target hide resolution, optimistic hide/restore, channel mutation calls, backup scheduling, settings refresh, DOM fallback rerun, and post-action Shorts/playlist enrichment.

content bridge menu injection action source files: 1

content bridge menu injection action source/effect blocks: 7

## Source Fingerprint

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |

## Pinned Blocks

| Block | Start Line | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `contentBridgeMetadataPayload` | 127 | 76 | 3754 | `d6c3da5000cfb20dec65c73d66926e70e518fe501a931ea730afb03a655d55eb` |
| `contentBridgeDropdownCleanup` | 440 | 151 | 5372 | `9aef97fd142a584b06e06b742565f75c301c7c12d673badebc385ac7b2c75aec` |
| `contentBridgeMenuInjectionEntry` | 10738 | 735 | 34684 | `9310a960d3a007775483683d00dfdcf2fedd773efd33e329fd01aa6f0d52605b` |
| `contentBridgeMenuHandlers` | 11476 | 71 | 2490 | `07e0e72b5c4c4a7f95615c0e752bd1ea987fd4851f31e23e3569e8d3bcadd540` |
| `contentBridgeBlockedMarkerAndTargets` | 12047 | 119 | 5113 | `c6eb72ca074bc60447f2914cf3a58f421eafe8db9a18ce44f398c86d3cf8d7f7` |
| `contentBridgeHandleBlockChannelClick` | 12206 | 1226 | 60722 | `459943dd5f26638ac63bc413a7cee220e862225929aaf2a4a0b6e068cd32ef9f` |
| `contentBridgeAddChannelDirectly` | 13440 | 54 | 2662 | `4eb280573a5611b695c8284a8e6b85d17b2a97c459143a3054d02374cdf7c2ca` |

## Selected Token Counts

These counts are over the seven pinned blocks, not the whole product.

| Token | Count |
| --- | ---: |
| `buildChannelMetadataPayload` | 8 |
| `canonicalHandle` | 11 |
| `handleDisplay` | 21 |
| `channelName` | 4 |
| `lowConfidenceExpectedName` | 3 |
| `pendingDropdownFetches` | 7 |
| `pendingDropdownFetches.set` | 1 |
| `channelInfoPromise` | 3 |
| `collaboratorPromise` | 3 |
| `cancelled` | 6 |
| `initialChannelInfo` | 117 |
| `injectFilterTubeMenuItem` | 2 |
| `currentSettings?.listMode` | 1 |
| `showBlockMenuItem` | 1 |
| `clearFilterTubeMenuItems` | 3 |
| `clearMultiStepStateForDropdown` | 2 |
| `waitForMenu` | 2 |
| `MutationObserver` | 2 |
| `observer.observe` | 1 |
| `closeObserver.observe` | 1 |
| `setTimeout` | 6 |
| `clearTimeout` | 1 |
| `waitForNextFrameDelay(250)` | 1 |
| `renderFilterTubeMenuEntries` | 3 |
| `registerActiveCollaborationMenu` | 5 |
| `unregisterActiveCollaborationMenu` | 3 |
| `enrichCollaboratorsWithMainWorld` | 2 |
| `searchYtInitialDataForVideoChannel` | 4 |
| `fetchIdForHandle` | 4 |
| `updateInjectedMenuChannelName` | 1 |
| `attachFilterTubeMenuHandlers` | 1 |
| `addEventListener` | 2 |
| `handleBlockChannelClick` | 2 |
| `isFilterAllToggleActive` | 3 |
| `toggleMultiStepSelection` | 2 |
| `markElementAsBlocked` | 6 |
| `clearBlockedElementAttributes` | 1 |
| `resolveCommentHideTarget` | 3 |
| `resolveClickedContentHideTarget` | 5 |
| `filtertube-hidden` | 15 |
| `data-filtertube-hidden` | 8 |
| `data-filtertube-blocked-state` | 4 |
| `restoreOptimisticHide` | 3 |
| `confirmOptimisticHide` | 2 |
| `addChannelDirectly` | 9 |
| `type: 'addFilteredChannel'` | 1 |
| `FilterTube_ScheduleAutoBackup` | 1 |
| `forceReprocess: true` | 1 |
| `preserveScroll: true` | 1 |
| `requestSettingsFromBackground` | 1 |
| `applyDOMFallback` | 1 |
| `enrichVisibleShortsWithChannelInfo` | 1 |
| `enrichVisiblePlaylistRowsWithChannelInfo` | 1 |
| `forceCloseDropdown` | 3 |
| `style.display = 'none'` | 7 |
| `✓ Channel Blocked` | 2 |
| `✗ Failed to block` | 1 |
| `Fetching...` | 2 |
| `filtertube-pending` | 4 |
| `aria-busy` | 4 |

## Runtime Fixtures

The paired verifier is `tests/runtime/content-bridge-menu-injection-action-boundary-current-behavior.test.mjs`.

It pins current harness behavior:

- `buildChannelMetadataPayload()` keeps `handleDisplay` restricted to real `@handle` values, stores safe channel names separately as `channelName`, and marks low-confidence expected names.
- Dropdown cleanup deletes injected state, marks pending dropdown fetches cancelled, removes the pending fetch entry, unregisters active collaboration menus, and clears multi-step state.
- `injectFilterTubeMenuItem()` remains gated by whitelist mode and `showBlockMenuItem === false`, waits for menu readiness with MutationObservers plus a 2000 ms timeout, stores `pendingDropdownFetches` with `channelInfoPromise`, `collaboratorPromise`, `cancelled`, and `initialChannelInfo`, and can update menu/channel DOM identity after enrichment.
- Menu handlers use capture-phase `click`, `keydown` Enter/Space handling, toggle-target suppression, placeholder/prevent-native suppression, multi-step selection handling, and then `handleBlockChannelClick()`.
- `markElementAsBlocked()` writes blocked channel id, handle, custom URL, name, state, and timestamp markers.
- `handleBlockChannelClick()` currently owns optimistic hide/restore, pending/success/error menu UI states, collaborator block-all loops, resolver fallbacks, clicked-card/comment immediate hide, settings refresh, `applyDOMFallback(..., { forceReprocess: true, preserveScroll: true })`, success dropdown close after 90 ms, and post-action Shorts/playlist enrichment.
- `addChannelDirectly()` trims input, chooses Main/Kids profile from hostname, sends `type: 'addFilteredChannel'`, forwards metadata fields, and schedules `FilterTube_ScheduleAutoBackup` with `triggerType: 'channel_added'` and `delay: 1000` after background success.

## Risk Boundary

This boundary is where a visual menu action becomes persisted rule mutation and DOM hiding. It is relevant to reliability, false-hide/leak, performance, code-burden, whitelist-mode quietness, route identity confidence, pending fetch cancellation, direct action fanout, backup scheduling, and DOM fallback rerun risks.

Current behavior is intentionally broad: menu-open enrichment can update menu labels and DOM identity, while menu-click mutation can optimistically hide content before persistence is proven, then restore on failure or confirm on success. This audit slice does not approve changing those semantics; it makes their current side effects explicit before optimization work.

## Missing Future Proof

No product runtime symbol exists yet for:

- `contentBridgeMenuActionContract`
- `contentBridgeMenuActionReport`
- `contentBridgePendingDropdownFetchPolicy`
- `contentBridgeMenuOptimisticHideReport`
- `contentBridgeMenuMutationFanoutBudget`
- `contentBridgeMenuDomFallbackBudget`
- `contentBridgeMenuBackupSchedulePolicy`
- `contentBridgeMenuIdentityEnrichmentPolicy`
- `contentBridgeMenuActionFixtureProvenance`
- `contentBridgeMenuActionMetricArtifact`

This slice does not close the audit rows for menu action authority, pending dropdown fetch policy, optimistic hide proof, mutation fanout budgets, DOM fallback budgets, backup scheduling policy, identity enrichment authority, route/profile/list-mode negative fixtures, fixture provenance, metrics, or first-class content bridge menu action gates.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
