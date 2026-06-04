# FilterTube Batch Whitelist Import Persistence Boundary Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, whitelist import patch,
storage patch, settings patch, profile patch, or permission to change filtering,
storage, backup, cache, refresh, or list-mode behavior.

## Purpose

This slice isolates the persistence boundary after subscribed-channel import has
already fetched candidate channels. It covers the StateManager handoff and the
background `FilterTube_BatchImportWhitelistChannels` action that normalizes
incoming channel identities, merges them into the active Main whitelist profile,
writes V4 and V3 profile mirrors, optionally updates `channelMap`, clears
compiled settings caches, schedules backup, refreshes YouTube tabs, and returns
counts plus current mode.

The boundary matters for optimization and first-class JSON filtering because it
is a settings mutation path, not a read-only import path. It can make future
allowlist behavior depend on persisted channel identity and list-mode state even
when the active mode remains blocklist.

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6773 | 305166 | `b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5` |
| `js/state_manager.js` | 2491 | 99780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

Related proof layers:

- `docs/audit/FILTERTUBE_SUBSCRIPTION_IMPORT_REQUEST_LIFECYCLE_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_BACKGROUND_MESSAGE_ACTION_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_SECURITY_PIN_LOCK_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_RULE_MUTATION_ENTRYPOINT_AUTHORITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`

## Current Counts

```text
batch whitelist import persistence source files: 2
batch whitelist import persistence source/effect blocks: 6
background normalizeImportedWhitelistChannelEntry block lines: 57
background normalizeImportedWhitelistChannelEntry block bytes: 2426
background importedWhitelistEntriesMatch block lines: 29
background importedWhitelistEntriesMatch block bytes: 1228
background mergeImportedWhitelistChannelEntry block lines: 33
background mergeImportedWhitelistChannelEntry block bytes: 2544
background mergeImportedWhitelistChannels block lines: 44
background mergeImportedWhitelistChannels block bytes: 1463
background FilterTube_BatchImportWhitelistChannels action block lines: 170
background FilterTube_BatchImportWhitelistChannels action block bytes: 7012
StateManager importSubscribedChannelsToWhitelist block lines: 109
StateManager importSubscribedChannelsToWhitelist block bytes: 4527
selected isTrustedUiSender tokens: 1
selected isProfileSessionAuthorized tokens: 1
selected activeId tokens: 5
selected targetProfileId tokens: 19
selected mergeImportedWhitelistChannels tokens: 2
selected storageGet tokens: 1
selected storage.local.set tokens: 1
selected compiledSettingsCache tokens: 2
selected scheduleAutoBackupInBackground tokens: 1
selected tabs.query tokens: 1
selected sendMessageToTabQuietly tokens: 1
selected channelMap tokens: 4
selected ftProfilesV3 tokens: 3
selected FT_PROFILES_V4_KEY tokens: 3
selected whitelistedChannels tokens: 1
selected currentMode tokens: 7
selected requestId tokens: 14
selected counts tokens: 14
selected sendResponse callsites: 7
selected errorCode tokens: 16
runtime batch whitelist import persistence fixtures: 7
runtime behavior changed: no
not completion proof for batch whitelist import persistence authority
```

## Current Behavior Matrix

| Boundary | Current behavior | Current risk boundary | Missing proof before implementation |
| --- | --- | --- | --- |
| StateManager handoff | `importSubscribedChannelsToWhitelist()` checks UI lock, target profile, profile stability before and after fetch, sends `FilterTube_BatchImportWhitelistChannels`, reloads settings, and requests Main refresh. | The caller gates profile state, but storage mutation authority moves to background and has a separate result contract. | End-to-end mutation report joining request id, active profile, fetched rows, storage write, reload, and refresh. |
| Sender and lock gate | The background action requires `isTrustedUiSender(sender)`, active profile equality, and `isProfileSessionAuthorized(profilesV4, targetProfileId)` before writing. | This is a strong gate, but the gate is local to this action and not expressed as a shared mutation contract. | Shared profile-lock mutation contract with negative trusted/untrusted and locked/unlocked fixtures. |
| Identity normalization | `normalizeImportedWhitelistChannelEntry()` accepts string or object input, canonicalizes UC ids/handles/custom URLs when helpers exist, rejects entries without id/handle/custom URL, sanitizes weak names, and defaults `filterAllComments` to true. | Imported rows can be accepted through id, handle, or custom URL, but no persistence policy artifact states which identity tier is authoritative. | Channel identity import policy with positive/negative fixtures for UC id, handle, custom URL, weak names, and source fields. |
| Duplicate/merge policy | `mergeImportedWhitelistChannels()` matches existing entries by id, handle, or custom URL, unshifts new imports, preserves stronger existing names, ORs `filterAll`, preserves existing `filterAllComments`, tracks imported/updated/duplicates/skipped counts, and keeps earliest `addedAt`. | Merge results are behaviorally important for false-allow/false-hide risk, but the rules are helper-local. | Merge contract and rollback policy with identity-collision fixtures and count invariants. |
| V4/V3 persistence | The action writes `FT_PROFILES_V4_KEY` with updated active profile data and writes `ftProfilesV3.main.whitelistChannels` plus `whitelistedChannels` compatibility mirror. | The V3 mirror is updated even though the target profile id may be V4-specific; mode is preserved as whitelist or blocklist. | V3/V4 mirror policy with multi-profile, inactive-profile, and legacy migration fixtures. |
| Channel map side effect | The action writes `channelMap` only when merged entries add or change handle/customUrl/id mappings. | `channelMap` becomes a cross-feature identity dependency for future matching, but no provenance or eviction policy is attached to these writes. | Channel-map side-effect report with key/value direction, provenance, overwrite, and stale-map fixtures. |
| Cache, backup, refresh | After storage write, the action nulls `compiledSettingsCache.main` and `.kids`, schedules `whitelist_subscriptions_imported` backup, queries YouTube tabs, and sends `FilterTube_RefreshNow`. | Cache invalidation, backup, and refresh are bundled with storage mutation and have no per-request budget artifact. | Cache invalidation report, backup/refresh budget, and tab refresh side-effect proof. |
| Mode effect | The action returns `currentMode` from the target Main profile and does not switch blocklist to whitelist. | Imported whitelist channels can be dormant until whitelist mode is enabled by a separate user flow. | Mode-effect report proving blocklist preservation and explicit inactive-whitelist UI state. |

## Source-Derived Anchors

```text
normalizeImportedWhitelistChannelEntry: `js/background.js:467`
importedWhitelistEntriesMatch: `js/background.js:525`
mergeImportedWhitelistChannelEntry: `js/background.js:555`
mergeImportedWhitelistChannels: `js/background.js:589`
FilterTube_BatchImportWhitelistChannels: `js/background.js:3866`
StateManager importSubscribedChannelsToWhitelist: `js/state_manager.js:1733`
```

## Runtime Proof

The runtime fixture proves:

1. The audit document is audit-only and source pinned across `js/background.js`
   and `js/state_manager.js`.
2. All six source/effect blocks remain line and byte pinned.
3. The background action requires trusted UI sender, active profile equality, and
   session authorization before storage mutation.
4. The extracted merge helpers preserve current imported/updated/duplicate/
   skipped count behavior, preserve stronger existing names, preserve existing
   `filterAllComments`, OR `filterAll`, unshift new imports, and skip rows
   without id/handle/custom URL.
5. The background action writes V4 and V3 profile mirrors, optionally writes
   `channelMap`, invalidates both compiled settings caches, schedules backup,
   refreshes YouTube tabs, and returns `currentMode` without changing it.
6. No first-class batch whitelist import persistence authority symbols exist in
   product runtime source.

## Non-Completion Boundary

Batch whitelist import persistence still needs a mutation contract, mutation
report, rollback policy, profile-lock report, mode-effect report, channel-map
policy, V3 mirror policy, cache invalidation report, backup/refresh budget,
fixture provenance, and metric artifact before optimization or first-class JSON
filter behavior can rely on this mutation path.

No `batchWhitelistImportPersistenceContract`,
`batchWhitelistImportMutationReport`,
`batchWhitelistImportRollbackPolicy`,
`batchWhitelistImportProfileLockReport`,
`batchWhitelistImportModeEffectReport`,
`batchWhitelistImportChannelMapPolicy`,
`batchWhitelistImportV3MirrorPolicy`,
`batchWhitelistImportCacheInvalidationReport`,
`batchWhitelistImportBackupRefreshBudget`,
`batchWhitelistImportFixtureProvenance`, or
`batchWhitelistImportMetricArtifact` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this whitelist surface can support runtime
optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Runnable Proof

```bash
node --test tests/runtime/batch-whitelist-import-persistence-boundary-current-behavior.test.mjs --test-reporter=spec
```
