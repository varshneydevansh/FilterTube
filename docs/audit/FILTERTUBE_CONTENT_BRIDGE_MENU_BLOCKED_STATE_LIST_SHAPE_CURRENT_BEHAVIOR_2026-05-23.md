# FilterTube Content Bridge Menu Blocked-State List Shape Current Behavior - 2026-05-23

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This is not an implementation patch and not completion proof for menu blocked-state authority.

## Scope

This slice pins the current behavior of the content bridge menu paths that decide whether a menu item is already blocked and whether previously blocked DOM elements should stay hidden after settings refresh. It focuses on list-shape and mode awareness: the current blocks read `filterChannels` and `channelMap`, while `whitelistChannels` and `listMode` are absent from the pinned logic.

The paired verifier is `tests/runtime/content-bridge-menu-blocked-state-list-shape-current-behavior.test.mjs`.

## Source Fingerprint

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |

## Pinned Blocks

| Block | Source range | Lines | Bytes | SHA-256 | Current role |
| --- | --- | ---: | ---: | --- | --- |
| Stored channel entry lookup | `js/content_bridge.js:2088` through `js/content_bridge.js:2102` | 16 | 581 | `e774f81a3dcfb0cd4830c7a06faf7c6307b2d739651c0a4d49a6b195723418ad` | Reads `currentSettings.filterChannels` to hydrate menu state for a matching stored entry. |
| Already-blocked menu state check | `js/content_bridge.js:11925` through `js/content_bridge.js:11981` | 57 | 2949 | `232452835d96009435593a555877dea029e32b587b72c0f007d1dfc83dd31c79` | Reads storage `filterChannels` and `channelMap`, then disables the menu item and hydrates filter-all UI when identity is already blocked. |
| Blocked element sync after settings refresh | `js/content_bridge.js:12101` through `js/content_bridge.js:12133` | 33 | 1521 | `ed51361346f28f1bdf6accc4de5f5ee1625c6a921b4d0b53cc5441ca21513615` | Rechecks stamped blocked elements against effective `filterChannels`, keeping still-blocked elements hidden and restoring stale ones. |

## Selected Token Counts

These counts are over the three pinned blocks, not the whole product.

| Token | Count |
| --- | ---: |
| `findStoredChannelEntry` | 2 |
| `checkIfChannelBlocked` | 1 |
| `syncBlockedElementsWithFilters` | 1 |
| `filterChannels` | 9 |
| `whitelistChannels` | 0 |
| `listMode` | 0 |
| `channelMap` | 10 |
| `channelMatchesFilter` | 3 |
| `isChannelBlocked` | 2 |
| `currentSettings` | 3 |
| `browserAPI_BRIDGE.storage.local.get` | 1 |
| `filterAll` | 1 |
| `applyFilterAllStateToToggle` | 1 |
| `addFilterAllContentCheckbox` | 1 |
| `querySelector` | 3 |
| `querySelectorAll` | 1 |
| `data-filtertube-blocked-channel-id` | 2 |
| `data-filtertube-blocked-channel-handle` | 2 |
| `data-filtertube-blocked-channel-name` | 1 |
| `markElementAsBlocked` | 1 |
| `clearBlockedElementAttributes` | 1 |
| `toggleVisibility` | 3 |
| `isCommentContextTag` | 1 |
| `normalizeHandleValue` | 2 |

## Current Behavior Proven By Fixtures

- `findStoredChannelEntry()` returns entries from `currentSettings.filterChannels` by handle or id and does not inspect whitelist arrays.
- `findStoredChannelEntry()` returns `null` when `currentSettings.filterChannels` is absent, even if other list fields exist.
- `checkIfChannelBlocked()` reads only `filterChannels` and `channelMap` from storage, then delegates to shared identity helpers when they are present.
- `checkIfChannelBlocked()` disables the menu item, changes the visible title, and hydrates filter-all controls when the channel is already blocked.
- `checkIfChannelBlocked()` fallback matching works by normalized handle or exact id when shared identity helpers are absent.
- `syncBlockedElementsWithFilters()` keeps stamped blocked elements hidden when `effectiveSettings.filterChannels` still matches.
- `syncBlockedElementsWithFilters()` clears blocked attrs and restores visibility when no `filterChannels` entry remains.
- Across the pinned blocks there are 9 `filterChannels` tokens, 0 `whitelistChannels` tokens, and 0 `listMode` tokens.

## Risk Boundary

This boundary is important because menu UI state and stale blocked-element restoration both rely on blocklist-shaped lists. That is defensible for the current "Block Channel" action path, but it is not a general proof for whitelist mode, Kids/Main profile selection, future dual allow/block lists, or inactive profile state. A stale blocked marker can remain hidden or be restored based only on `filterChannels`; a menu item can be disabled as already blocked based only on the blocklist target.

The current behavior is relevant to reliability, false-hide/leak risk, performance, code-burden, whitelist/list-mode semantics, menu action correctness, filter-all UI state, settings refresh behavior, and cross-feature interactions with collaborator identity promotion and DOM fallback restoration.

## Missing Future Proof

No product runtime symbol exists yet for:

- `contentBridgeMenuBlockedStateListModeContract`
- `contentBridgeMenuBlockedStateDecision`
- `contentBridgeMenuBlockedStateListTargetPolicy`
- `contentBridgeMenuStoredEntryReport`
- `contentBridgeBlockedElementSyncReport`
- `contentBridgeBlockedElementRestorePolicy`
- `contentBridgeMenuWhitelistInteractionReport`
- `contentBridgeMenuFilterAllStatePolicy`
- `contentBridgeMenuBlockedStateFixtureProvenance`
- `contentBridgeMenuBlockedStateMetricArtifact`

This slice does not close the audit rows for menu blocked-state contracts, list target policies, whitelist/list-mode reports, profile target reports, blocked-element sync reports, restore policies, filter-all state policies, fixture provenance, metrics, or first-class menu blocked-state gates.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
