# FilterTube List Mode Transition Persistence Boundary Current Behavior - 2026-05-22

Status: current-behavior proof slice. This is not an implementation patch.

This slice narrows the settings-mode transition boundary around Main/Kids
blocklist mode, whitelist mode, UI toggles, subscription-import mode enablement,
storage writes, cache invalidation, backup scheduling, and tab refresh effects.
It is the direct follow-up to the subscription import and batch whitelist import
proof: batch import can persist whitelist rows without changing mode, while the
separate list-mode transition path owns the destructive copy/clear behavior.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6773 | 305166 | `b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5` |
| `js/popup.js` | 1841 | 75587 | `cb2b30a8d22b08cbd538fdce4ae195b006405d0ceb02a91d92ed53c877aa402a` |
| `js/tab-view.js` | 14256 | 662043 | `2627d062b48e2cbaf5471bb72e1236852e351ef271e2c750c0abfa7faeb49674` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Source/Effect Blocks Pinned

```text
4 list-mode transition persistence source files
8 source/effect blocks

background FilterTube_SetListMode action block: 215 lines, 9958 bytes
background SetListMode merge helper block: 44 lines, 2458 bytes
background SetListMode write/side-effect block: 31 lines, 1151 bytes
background FilterTube_TransferWhitelistToBlocklist action block: 198 lines, 9448 bytes
popup renderListModeControls block: 173 lines, 7911 bytes
tab-view renderListModeControls block: 174 lines, 9296 bytes
tab-view enableWhitelistModeAfterImport block: 47 lines, 1554 bytes
StateManager importSubscribedChannelsToWhitelist block: 111 lines, 4533 bytes

selected background mode-action tokens:
  shouldCopyBlocklist: 1
  copyBlocklist: 1
  mergeAndClearBlocklistIntoWhitelist: 2
  isTrustedUiSender: 2
  isProfileSessionAuthorized: 0
  storage.local.set: 2
  compiledSettingsCache: 4
  scheduleAutoBackupInBackground: 2
  tabs.query: 2
  sendMessageToTabQuietly: 2
  FilterTube_RefreshNow: 2
  FT_PROFILES_V4_KEY: 6
  ftProfilesV3: 2
  uiChannels: 2
  sendResponse: 8
```

## Runtime Fixtures Pinned

```text
set_list_mode_copy_false_still_merges_blocklist_to_whitelist
set_list_mode_whitelist_clears_main_legacy_blocklist_mirrors
set_list_mode_blocklist_does_not_transfer_whitelist_back
transfer_whitelist_to_blocklist_moves_and_clears_lists
tab_import_enable_whitelist_sends_copy_false
popup_tab_mode_toggle_confirm_copy_only_when_whitelist_empty
managed_child_surface_handles_mode_transfer_in_tab_view_without_background_action
subscription_import_persistence_returns_currentMode_before_mode_toggle
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before JSON-first or optimization work |
| --- | --- | --- | --- |
| UI toggle intent | Popup and tab-view compute `copyBlocklist` only when enabling whitelist and the current whitelist is empty. They send `FilterTube_SetListMode` with `mode: nextState ? 'whitelist' : 'blocklist'` and the boolean `copyBlocklist`. | `tests/runtime/list-mode-transition-persistence-boundary-current-behavior.test.mjs` | UI intent is not the same as background effect; optimization work must not assume `copyBlocklist:false` means "do not migrate lists." |
| Subscription import mode enablement | `enableWhitelistModeAfterImport()` sends `FilterTube_SetListMode` with `mode: 'whitelist'` and `copyBlocklist: false`, then tells the user the current blocklist was merged into whitelist. | Same runtime test. | Batch import and mode enablement are separate operations; JSON-first import behavior must preserve that ordering and side-effect boundary. |
| Background whitelist transition | `FilterTube_SetListMode` declares `const shouldCopyBlocklist = request?.copyBlocklist === true`, but the branch always calls `mergeAndClearBlocklistIntoWhitelist(requestedProfile)` whenever `requestedMode === 'whitelist'`. | Same runtime test. | False-hide and data-loss risk if future code treats the request flag as effective without changing the background mutation plan. |
| Main legacy mirrors | When Main switches to whitelist, the branch writes empty `filterChannels`, `uiChannels`, `uiKeywords`, `filterKeywords`, and `filterKeywordsComments`. | Same runtime test. | Legacy root list cleanup is destructive state movement and must have rollback/report proof before schema changes. |
| Blocklist transition | `FilterTube_SetListMode` can set mode back to blocklist, but it does not move whitelist rows back into blocklists. Popup and tab-view call `FilterTube_TransferWhitelistToBlocklist` first only when disabling whitelist with non-empty whitelist rows and the user confirms. | Same runtime test. | Mode label, row migration, and list clearing are split operations; tests need to keep them separate. |
| Whitelist-to-blocklist transfer | `FilterTube_TransferWhitelistToBlocklist` moves whitelist channels/keywords into the relevant blocklist arrays, clears whitelist arrays, sets mode to blocklist, writes V4, mirrors Main root lists, invalidates both compiled settings caches, refreshes tabs, and schedules backup. | Same runtime test. | This is destructive list migration, not a simple UI toggle. It needs mutation reports, revision proof, and side-effect budgets before optimization or cleanup. |
| Lock/session coverage | The two background mode-action branches check `isTrustedUiSender(sender)` but contain 0 `isProfileSessionAuthorized` tokens in the pinned background mode-action blocks. | Same runtime test. | Locked-profile behavior remains partial: batch whitelist import has a session gate, while these transition branches do not. |
| Managed child editing | Tab-view managed child mode changes mutate the managed child surface through `saveManagedChildSurface()` instead of background `FilterTube_SetListMode`, with its own copy/transfer logic. | Same runtime test. | Parent-managed edits and direct background mode changes are separate authority paths that need parity proof. |
| Subscription import persistence | `StateManager.importSubscribedChannelsToWhitelist()` returns `currentMode` from the batch import response or current state and then requests refresh; it does not itself toggle Main into whitelist mode. | Same runtime test. | Subscription import persistence is not list-mode activation; this separation matters for JSON-first import and no-work gates. |

## Required Future Authority Before Behavior Changes

No product runtime source currently defines:

```text
listModeTransitionPersistenceContract
listModeTransitionMutationReport
listModeTransitionCopyFlagPolicy
listModeTransitionRollbackPolicy
listModeTransitionProfileLockReport
listModeTransitionModeEffectReport
listModeTransitionLegacyMirrorPolicy
listModeTransitionCacheInvalidationReport
listModeTransitionBackupRefreshBudget
listModeTransitionManagedChildParityReport
listModeTransitionFixtureProvenance
listModeTransitionMetricArtifact
```

## Current Verdict

```text
List-mode transition persistence is proof-pinned.
The copy flag is currently not an effect gate in the background whitelist branch.
Batch import persistence and mode activation remain separate operations.
Runtime behavior remains unchanged.
```

This does not close the relevant settings-mode, storage/cache, profile-lock,
backup/refresh, false-hide/leak, performance, code-burden, cross-feature, or
JSON-first rows. It adds current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this list/settings-mode surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, settings-mode behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
