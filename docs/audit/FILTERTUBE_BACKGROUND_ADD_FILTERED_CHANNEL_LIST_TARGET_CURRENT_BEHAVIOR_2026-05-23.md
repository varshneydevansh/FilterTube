# FilterTube Background Add Filtered Channel List Target Current Behavior - 2026-05-23

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This is not an implementation patch and not completion proof for background rule-mutation authority.

## Scope

This slice covers the background-side receiver for `message.type === 'addFilteredChannel'` and the shared `handleAddFilteredChannel()` helper that writes Main/Kids blocklist or whitelist channel rows. It is the background half of the menu action list-target proof: content runtime sends an add message, and background decides which profile/list is actually mutated.

## Source Fingerprints

| Source file | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6313 | 284710 | `46442f904cf18c3fa8345e71f608171edcf277207a420136a78a195c3b7c57eb` |

## Pinned Source And Effect Blocks

| Block | Source lines | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `backgroundAddFilteredChannelReceiver` | `js/background.js:5244` | 32 | 1186 | `68b592ef1b1365757100285ab9e7c3589727600f0b2be908466b992fb59c00f9` |
| `backgroundHandleAddFilteredChannelFull` | `js/background.js:5302` | 893 | 45226 | `e69e660d0af0dd0d523932f733a5de04108cbfb69ef99a155be4466a7527ce25` |
| `backgroundHandleAddFilteredChannelSignatureAndInput` | `js/background.js:5302` | 158 | 6464 | `60f9b6d40d808f02f822e74a0a9f967844a1d1ef4c956e911ad2ee5265891b80` |
| `backgroundHandleAddFilteredChannelIdentityRepair` | `js/background.js:5459` | 358 | 19385 | `dc7ccd71be5cb375ac50245617889449621246504390a4a0162c59c3cef6740d` |
| `backgroundHandleAddFilteredChannelExistingAndWrite` | `js/background.js:5816` | 352 | 18483 | `0f2661d0a32990528ebf6704aa4cfb90cab8f55dcf4567e37852910704966027` |
| `backgroundHandleAddFilteredChannelCommitAndReturn` | `js/background.js:6167` | 28 | 894 | `ba67796a03d083bf072ac4ef971365f165f0c836dd2eae56c64912729a45be66` |

## Selected Token Counts

The receiver plus full helper blocks contain:

| Token | Count |
| --- | ---: |
| `isTrustedUiSender` | 0 |
| `isProfileSessionAuthorized` | 0 |
| `handleAddFilteredChannel` | 2 |
| `listType` | 2 |
| `targetListType` | 14 |
| `blocklist` | 9 |
| `whitelist` | 36 |
| `message.listType` | 0 |
| `message.profile` | 2 |
| `message.videoId` | 1 |
| `filterAll` | 12 |
| `collaborationWith` | 16 |
| `metadata` | 70 |
| `storageWritePayload` | 8 |
| `FT_PROFILES_V4_KEY` | 3 |
| `ftProfilesV3` | 4 |
| `filterChannels` | 4 |
| `uiChannels` | 1 |
| `whitelistChannels` | 12 |
| `blockedChannels` | 8 |
| `channelMap` | 25 |
| `enqueueChannelMapUpdate` | 2 |
| `enqueueVideoChannelMapUpdate` | 1 |
| `browserAPI.storage.local.set` | 3 |
| `compiledSettingsCache.main = null` | 1 |
| `compiledSettingsCache.kids = null` | 1 |
| `schedulePostBlockEnrichment` | 1 |
| `scheduleAutoBackupInBackground` | 1 |
| `sendResponse` | 1 |
| `tabs.query` | 1 |
| `FilterTube_RefreshNow` | 1 |

## Current Behavior Proof

The secondary runtime receiver accepts any message with `type: 'addFilteredChannel'` that reaches this listener and calls `handleAddFilteredChannel()` with `message.input`, `message.filterAll`, collaborator metadata, `message.profile || 'main'`, and `message.videoId || ''`. It does not pass `message.listType` into the helper. A caller may include `listType: 'whitelist'`, but the receiver drops it before the helper receives arguments.

`handleAddFilteredChannel()` declares `listType = 'blocklist'` and immediately normalizes the effective target with `const targetListType = listType === 'whitelist' ? 'whitelist' : 'blocklist'`. Because the secondary receiver omits the argument, this path defaults to blocklist unless another background action calls the helper directly with `'whitelist'`.

The helper's mutation target is profile-shaped and list-shaped. For Main blocklist it writes V4 `main.channels`, syncs Main keyword mirrors, writes root `filterChannels`, and can write `uiChannels`. For Main whitelist it writes V4 `main.whitelistChannels` and V3 `main.whitelistedChannels` without writing root `filterChannels`. For Kids blocklist it writes V4 `kids.blockedChannels` plus V3 `kids.blockedChannels`; for Kids whitelist it writes V4 `kids.whitelistChannels` plus V3 `kids.whitelistedChannels`. Kids mutations also query Kids tabs and send `FilterTube_RefreshNow`.

The helper also mixes identity repair and side effects with the list mutation. It can read `channelMap`, perform watch, Shorts, and Kids identity fetches, enqueue channel and video maps, update `channelMap`, write profile/root storage payloads, null both compiled settings caches, queue post-block enrichment, and return channel data. The receiver schedules `scheduleAutoBackupInBackground()` after a successful helper response, using `kids_channel_added` only when `message.profile === 'kids'`.

## Risk Interpretation

For reliability and false-hide/leak risk, the message payload and helper signature disagree on list-target expressiveness: the helper can target whitelist, but this receiver only reaches the helper's default blocklist path. That is defensible for today's content-script block actions, but it is not a general first-class action contract for whitelist, dual-list, or future allow/block row mutations.

For performance, the receiver looks like a single add operation but the helper can perform network identity repair, channelMap writes, V4/V3/root storage writes, compiled-cache invalidation, tab refresh, backup scheduling, and post-block enrichment. Any optimization that treats `addFilteredChannel` as a cheap local mutation would be undercounting the fanout.

For code burden, the list target is split across action-specific callers and helper defaults. The secondary receiver currently has no explicit sender policy, no session-lock check, no forwarded list-target field, and no structured mutation report that records actor, profile, list, storage keys, cache invalidation, backup, refresh, and enrichment side effects.

## Still Missing

This slice does not close the audit rows for background add-filtered-channel contracts, receiver reports, sender policies, list-type forwarding policies, profile target reports, storage-write reports, cache invalidation reports, backup policies, identity-repair budgets, or fixture provenance.

No product runtime source symbol exists yet for:

- `backgroundAddFilteredChannelListTargetContract`
- `backgroundAddFilteredChannelReceiverReport`
- `backgroundAddFilteredChannelSenderPolicy`
- `backgroundAddFilteredChannelListTypeForwardingPolicy`
- `backgroundAddFilteredChannelProfileTargetReport`
- `backgroundAddFilteredChannelStorageWriteReport`
- `backgroundAddFilteredChannelCacheInvalidationReport`
- `backgroundAddFilteredChannelBackupPolicy`
- `backgroundAddFilteredChannelIdentityRepairBudget`
- `backgroundAddFilteredChannelFixtureProvenance`

## Verification

Runtime proof: `tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs`

Focused command:

```bash
node --test tests/runtime/background-add-filtered-channel-list-target-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5469
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5469
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
