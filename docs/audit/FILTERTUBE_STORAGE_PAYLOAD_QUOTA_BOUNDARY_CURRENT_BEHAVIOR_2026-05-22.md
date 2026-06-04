# FilterTube Storage Payload Quota Boundary - 2026-05-22

Status: audit-only current-behavior boundary. This is not an implementation patch.
Runtime behavior is unchanged.

This slice pins the current storage payload and quota-adjacent behavior for
settings export/import, automatic backups, learned identity maps, and Nanah
sync envelopes. It covers the distinction between entry-count caps, byte-size
budgets, backup JSON creation, download rotation, storage write wrappers, and
the missing authority needed before JSON-first or optimization work relies on
storage payload size.

Runtime proof:

```text
tests/runtime/storage-payload-quota-boundary-current-behavior.test.mjs
```

## Source Fingerprints

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/background.js` | 6773 | 305166 | `b1fa9334a6559d7be77a071f9b55a172f2eceb096f5b471247f6142c63f729a5` |
| `js/io_manager.js` | 2,030 | 96,914 | `d04bfd75d061ee405c1dfa4cab8c9d0fa6a2f072d046add33e4b6782b1f58a21` |
| `js/nanah_sync_adapter.js` | 433 | 17,072 | `8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824` |
| `js/tab-view.js` | 11,617 | 526,763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/state_manager.js` | 2,491 | 99,780 | `509c559e35989c13cdded17c01eeaca8115addcd3848dbcda41514422e5bc7b6` |

## Source / Effect Blocks

| Block | Source | Start line | Lines | Bytes |
| --- | --- | ---: | ---: | ---: |
| `backgroundRotateAutoBackups` | `js/background.js:680` | 680 | 45 | 1,681 |
| `backgroundCreateAutoBackup` | `js/background.js:782` | 782 | 97 | 3,751 |
| `backgroundMapCacheCluster` | `js/background.js:1452` | 1452 | 196 | 6,514 |
| `ioWriteStorage` | `js/io_manager.js:421` | 421 | 14 | 473 |
| `ioExportV3` | `js/io_manager.js:1146` | 1146 | 96 | 3,941 |
| `ioCreateAutoBackup` | `js/io_manager.js:1782` | 1782 | 89 | 4,063 |
| `ioSaveBackupFile` | `js/io_manager.js:1922` | 1922 | 30 | 1,267 |
| `ioRotateBackups` | `js/io_manager.js:1956` | 1956 | 34 | 1,377 |
| `nanahBuildPortablePayload` | `js/nanah_sync_adapter.js:307` | 307 | 16 | 633 |
| `nanahBuildSyncEnvelope` | `js/nanah_sync_adapter.js:322` | 322 | 13 | 397 |
| `nanahBuildControlProposal` | `js/nanah_sync_adapter.js:334` | 334 | 20 | 742 |
| `tabParseNanahEnvelopeDetails` | `js/tab-view.js:7593` | 7593 | 50 | 2,632 |
| `tabAttachNanahProposalPolicy` | `js/tab-view.js:7740` | 7740 | 23 | 1,050 |
| `statePersistChannelMap` | `js/state_manager.js:1995` | 1995 | 15 | 464 |

## Selected Token Counts

```text
storage payload quota boundary source files pinned | 5
storage payload quota source/effect blocks pinned | 14
background storage.local.set tokens | 24
background storage.local.get tokens | 11
background runtime.lastError tokens | 14
background JSON.stringify tokens | 5
background Blob([ tokens | 1
background downloads.download tokens | 4
background downloads.search tokens | 2
background downloads.erase tokens | 1
background channelMap tokens | 93
background videoChannelMap tokens | 46
background videoMetaMap tokens | 40
io_manager storage.local.set tokens | 1
io_manager storage.local.get tokens | 1
io_manager JSON.stringify tokens | 1
io_manager Blob([ tokens | 2
io_manager downloads.download tokens | 3
io_manager downloads.search tokens | 1
io_manager downloads.erase tokens | 2
io_manager backup tokens | 43
nanah_sync_adapter JSON.stringify tokens | 3
nanah_sync_adapter JSON.parse tokens | 3
nanah_sync_adapter payload tokens | 18
tab-view JSON.stringify tokens | 5
tab-view JSON.parse tokens | 4
tab-view Blob([ tokens | 1
tab-view downloads.download tokens | 1
tab-view payload tokens | 36
state_manager channelMap tokens | 14
selected getBytesInUse tokens | 0
selected QUOTA tokens | 0
```

## Runtime Fixtures Pinned

```text
storage_payload_quota_doc_records_audit_only_boundary
source_fingerprints_for_storage_payload_quota_files_remain_current
source_effect_block_metrics_for_storage_payload_quota_paths_remain_current
selected_storage_payload_quota_token_counts_remain_current
background_map_caps_are_entry_count_caps_not_storage_byte_budgets
backup_export_paths_stringify_entire_payloads_without_payload_byte_budget
nanah_envelopes_stringify_payloads_without_size_or_quota_gate
storage_write_paths_lack_shared_quota_authority_symbols
```

## Current Findings

| Boundary | Current behavior | Current proof | Risk before JSON-first, false-hide, leak, or optimization work |
| --- | --- | --- | --- |
| Learned map storage writes | Background flushes `channelMap`, `videoChannelMap`, and `videoMetaMap` as whole map objects. `videoChannelMap` has a 1000-entry cap with 100 first-key evictions; `videoMetaMap` has a 2000-entry cap with 500 first-key evictions; `channelMap` has no equivalent entry cap in the pinned background block. | Runtime test slices `backgroundMapCacheCluster`. | Entry-count caps do not prove byte-size safety, quota safety, freshness, or false-hide-safe eviction. |
| Storage write wrappers | `io_manager.writeStorage()` checks `chrome.runtime.lastError` after `STORAGE_NAMESPACE.set(payload)` and returns `{ ok, error }`. | Runtime test slices `ioWriteStorage`. | The wrapper reports a direct set failure, but does not compute payload bytes, call `getBytesInUse`, classify quota errors, or attach a shared storage budget to callers. |
| Background automatic backups | `createAutoBackupInBackground()` builds a full export object, optionally encrypts it, `JSON.stringify`s the whole object, and creates either a Blob URL or `data:` URL before download. | Runtime test slices `backgroundCreateAutoBackup`. | Large backups can be generated and downloaded without a size gate, performance budget, encryption payload budget, or memory metric artifact. |
| Dashboard automatic backups | `io_manager.createAutoBackup()` builds backup data from settings/profile state, then `saveBackupFile()` stringifies the full object and writes it through the downloads API. | Runtime test slices `ioCreateAutoBackup` and `ioSaveBackupFile`. | Dashboard-side backup generation has no explicit byte budget or quota preflight before creating a Blob URL. |
| Backup rotation | Background and IO Manager search up to 100 download records and keep 10 history backups. | Runtime test slices `backgroundRotateAutoBackups` and `ioRotateBackups`. | Rotation limits backup count, not backup size, total disk bytes, or failed erase handling with a verifiable retention report. |
| Export payload construction | `io_manager.exportV3()` constructs full or active-profile payloads from settings, channel map, and profile state. | Runtime test slices `ioExportV3`. | Export shape is sanitized, but there is no payload byte budget, map-size budget, backup-size budget, or JSON-first storage manifest tying fields to cost. |
| Nanah envelopes | `buildSyncEnvelope()` and `buildControlProposal()` store portable settings as JSON strings in `payload`; the dashboard parses and rewrites `root.payload` for policy attachment. | Runtime test slices Nanah adapter and tab-view Nanah blocks. | Nanah transport has no envelope size limit, parse budget, scope-specific payload budget, or quota/storage policy for large synced rules. |
| StateManager direct channel-map write | `persistChannelMap()` writes the entire `state.channelMap` directly to storage. | Runtime test slices `statePersistChannelMap`. | This bypasses map cache caps and quota reporting, so direct alias growth still needs payload and quota proof. |

## Required Future Authority Before Behavior Changes

No selected product runtime source currently defines:

```text
storagePayloadQuotaBoundaryContract
storagePayloadByteBudgetReport
storageGetBytesInUsePreflight
storageQuotaErrorClassifier
storageMapEntryAndByteCapPolicy
storageBackupPayloadBudget
storageNanahEnvelopeSizePolicy
storageExportImportPayloadManifest
storageBackupRotationByteReport
storageQuotaFixtureProvenance
```

## Current Verdict

```text
Storage payload quota behavior is proof-pinned.
Current map caps, backup rotation, export JSON creation, and Nanah envelopes are not a shared byte-size or quota authority.
Runtime behavior remains unchanged.
```

This does not close storage/cache, import/export, Nanah, learned-identity,
settings-mode, JSON-first, performance, reliability, false-hide/leak,
code-burden, cross-feature, or implementation-change rows. It adds
current-behavior evidence only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this background/settings/storage surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, settings behavior, background message
behavior, storage behavior, cache invalidation behavior, whitelist behavior,
metric collectors, artifact creation, native sync, release package changes, or
public claims.
