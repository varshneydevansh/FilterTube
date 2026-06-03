# FilterTube Filter All Toggle List Target Current Behavior - 2026-05-23

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This is not an implementation patch and not completion proof for Filter All mutation authority.

## Scope

This slice covers the Filter All toggle path across the content bridge menu checkbox, the secondary background `toggleChannelFilterAll` receiver, the background helper, and the StateManager Main/Kids UI toggles. It is adjacent to the menu blocked-state and background addFilteredChannel list-target slices: those proved block add behavior, while this slice proves the per-channel Filter All mutation path.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this audit slice can support runtime
optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime optimization,
JSON-first behavior, method deletion, method merging, lifecycle cleanup, no-work
changes, or whitelist behavior changes.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6641 | 298986 | `837cc8e438b30f53cc14da0317262a0ed5e7c5ae2ece0026611a3963767ae6fd` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Pinned Source And Effect Blocks

| Block | Source lines | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `backgroundToggleChannelFilterAllReceiver` | `js/background.js:5603` | 14 | 413 | `7e15cc800cdde69487959513b30d2cfab29c55f9b1caa566f96b99bcb844c94e` |
| `backgroundHandleToggleChannelFilterAll` | `js/background.js:6529` | 95 | 3435 | `84afd60fbb6c140a1a20880b7cb2b81a7ce33fe95c89b4278c1d00e1b1756dd4` |
| `contentBridgeAddFilterAllContentCheckbox` | `js/content_bridge.js:13499` | 66 | 2391 | `03861f56c173757f479e0863d16fab83df5ba180e5d21d8adb37cdf0b5fcb490` |
| `stateManagerToggleChannelFilterAll` | `js/state_manager.js:1892` | 34 | 988 | `b7028d96e93e5b89cfcf68d83d09256c9b06888a3b5b0ee181e6165f74318298` |
| `stateManagerToggleKidsChannelFilterAll` | `js/state_manager.js:968` | 36 | 1188 | `f798f6b4a379f1101dea3b1777b046e2631ea1ab032b01b56716dc09878b72ac` |

## Selected Token Counts

The reduced source blocks contain:

| Token | Count |
| --- | ---: |
| `toggleChannelFilterAll` | 3 |
| `handleToggleChannelFilterAll` | 2 |
| `filterChannels` | 4 |
| `whitelistChannels` | 0 |
| `blockedChannels` | 8 |
| `ftProfilesV3` | 1 |
| `FT_PROFILES_V4_KEY` | 3 |
| `currentSettings` | 0 |
| `filterAll` | 18 |
| `filterAllComments` | 1 |
| `channelId` | 6 |
| `channelData` | 4 |
| `message.channelId` | 1 |
| `message.value` | 1 |
| `isTrustedUiSender` | 0 |
| `isProfileSessionAuthorized` | 0 |
| `storage.local.get` | 1 |
| `storage.local.set` | 1 |
| `compiledSettingsCache.main = null` | 1 |
| `compiledSettingsCache.kids = null` | 1 |
| `scheduleAutoBackupInBackground` | 1 |
| `filter_all_toggled` | 3 |
| `kids_filter_all_toggled` | 1 |
| `requestRefresh` | 1 |
| `scheduleAutoBackup` | 3 |
| `saveSettings` | 1 |
| `persistKidsProfiles` | 1 |
| `notifyListeners` | 2 |
| `isUiLocked` | 2 |
| `profile` | 10 |
| `kids` | 20 |
| `main` | 8 |
| `querySelector` | 4 |
| `addEventListener` | 2 |
| `change` | 2 |
| `click` | 3 |
| `browserAPI_BRIDGE.runtime.sendMessage` | 1 |

## Current Behavior Proof

The content bridge checkbox created by `addFilterAllContentCheckbox()` sends `type: 'toggleChannelFilterAll'`, `channelId: channelData?.id || channelData?.handle`, and `value: checked`. It does not include profile, list mode, whitelist/blocklist target, active profile id, or source-row proof in the message payload.

The secondary background receiver calls `handleToggleChannelFilterAll(message.channelId, message.value)`. It does not check `isTrustedUiSender()`, does not check `isProfileSessionAuthorized()`, and does not forward any profile or list target. On success it schedules `scheduleAutoBackupInBackground('filter_all_toggled')`.

`handleToggleChannelFilterAll()` reads root `filterChannels`, `uiKeywords`, `filterKeywords`, `ftProfilesV3`, and V4 profiles. It searches only root `filterChannels` by exact `id` or exact `handle`, then writes `filterAll` on that root row. If a channel exists only in V4 Main whitelist, V4 Kids lists, or V3 whitelist lists, this helper returns `Channel not found` and writes nothing.

When the root row exists, the helper writes root `filterChannels` and, when possible, rewrites V4 active `main.channels`, `main.keywords`, and `main.blockedKeywords`. It does not update V4 Main whitelist rows, V4 Kids rows, V3 Kids rows, or V3 Main whitelist rows. It invalidates both compiled settings caches after the write.

StateManager’s visible UI paths are narrower than the secondary background receiver. Main `toggleChannelFilterAll(index)` returns `false` when `state.mode === 'whitelist'`. Kids `toggleKidsChannelFilterAll(index)` returns `false` when `kids.mode === 'whitelist'` and otherwise persists into `kids.blockedChannels`, refreshes Kids, notifies listeners, and schedules `kids_filter_all_toggled`.

## Risk Interpretation

For reliability and false-hide/leak risk, the background receiver can be reached with only a channel id/handle and boolean value, while the helper mutates root Main blocklist-shaped state only. That means a checkbox associated with stale, whitelist, Kids, or profile-mismatched UI state can fail silently as "Channel not found" or mutate the active Main blocklist mirror rather than a first-class target row.

For performance, a successful background toggle writes storage and invalidates both compiled caches. StateManager UI paths can additionally recompute keywords, refresh Kids/Main runtime, notify listeners, and schedule backups. Any optimization that treats Filter All as a cosmetic checkbox would miss rule-derived keyword and cache effects.

For code burden, Filter All behavior is split across content menu hydration, secondary background message mutation, StateManager Main row mutation, StateManager Kids row mutation, background compile-time channel-derived keyword expansion, and comment-filter `filterAllComments` policy. There is no single mutation report that records actor, profile, list, channel identity, comment scope, storage keys, cache invalidation, refresh, and backup side effects.

## Still Missing

This slice does not close the audit rows for Filter All toggle contracts, receiver reports, sender policies, list-target policies, profile target reports, storage-write reports, cache invalidation reports, row-action parity reports, comment-scope reports, or fixture provenance.

No product runtime source symbol exists yet for:

- `filterAllToggleListTargetContract`
- `filterAllToggleReceiverReport`
- `filterAllToggleSenderPolicy`
- `filterAllToggleListTargetPolicy`
- `filterAllToggleProfileTargetReport`
- `filterAllToggleStorageWriteReport`
- `filterAllToggleCacheInvalidationReport`
- `filterAllToggleRowActionParityReport`
- `filterAllToggleCommentScopeReport`
- `filterAllToggleFixtureProvenance`

## Verification

Runtime proof: `tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs`

Focused command:

```bash
node --test tests/runtime/filter-all-toggle-list-target-current-behavior.test.mjs --test-reporter=spec
```
