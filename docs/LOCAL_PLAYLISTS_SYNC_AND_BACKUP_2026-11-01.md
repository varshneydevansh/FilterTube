# FilterTube local playlists, app backups and the `playlists` sync area (2026-11-01)

The FilterTube apps keep local playlists in the `filtertube.local-playlists` v1 format. The format is defined in FilterTubeApp `docs/app/LOCAL_PLAYLISTS_FORMAT.md`. The extension now stores, syncs, imports and exports that format unchanged. It has no playlist editor; the dashboard shows a read-only list.

## Files

| File | Role |
|---|---|
| `js/shared/local_playlists.js` | Data contract: strict v1 codec, validation and the deterministic merge. It is a line-for-line port of Android `NativeLocalPlaylists.kt` (`LocalPlaylistsJson` and `LocalPlaylistMerge`). The apps can vendor it next to `shared/saved_video_notes.js`. |
| `js/local_playlists_store.js` | Background storage under `ftLocalPlaylistsV1`: one encoded envelope holding every profile's lists, like `ftSavedVideoNotesV1`. |
| `js/personal_sync.js` | Grants accept the areas `settings`, `notes` and `playlists`. `mergePlaylists(local, remote, grant)` re-homes the peer's lists onto the exact local profile, then joins them. |
| `js/personal_auto_sync_runtime.js` | Sends `payload.playlists` from `deps.playlistsRead` and applies received lists through `deps.playlistsMerge`. Runtimes without those deps refuse a playlists payload. |
| `js/background.js` | `FilterTube_PersonalPlaylistsRead` and `FilterTube_PersonalPlaylistsMerge`, from the top-level dashboard only. Each step re-checks the live grant through `authorizePersonalAreaSync('playlists', …)`, the same checks Notes uses. |
| `js/io_manager.js` | Backup import and export (below). |

## Merge rules (same as Android)

- Lists match on `(profileId, surface, id)`. A list missing from one side is kept; it is never a deletion.
- The name with the larger `(nameUpdatedAt, name)` wins. `createdAt` takes the minimum; `orderUpdatedAt` and `deletedAt` take the maximum.
- Items match on `yt:<videoId>` or `file:<uri>`. `addedAt` and `removedAt` each take the maximum. Metadata comes from the larger `addedAt`. On a tie, the item JSON that sorts higher wins, compared in Android `org.json` form, which escapes `/` as `\/`, so both platforms pick the same side.
- Order: the side with the larger `(orderUpdatedAt, joined item keys)` ranks the items it knew about. Later adds follow by `(addedAt, key)`, then tombstones by key.
- A list is deleted while `deletedAt` is at least its newest edit. Watch later is never deleted.

`tests/runtime/local-playlists.test.mjs` checks commutativity, associativity, idempotence, tombstones, deletion revival, the reorder rule, the escaped tie-break and profile mapping.

## Backups

- App backups that carry notes and playlists are a raw v4 profile tree with top-level `savedVideoNotes` and `localPlaylists`, and `meta` without `version`. `convertAppProfileBackup` turns them into the v3 envelope the apps use for their plain backups. The dashboard applies it before the PIN checks, so a backup Master PIN is still asked for.
- Both envelopes are validated before anything is written. A malformed envelope refuses the whole import.
- After the profile write, notes and lists follow the import's profile mapping. A full import from Default keeps profile IDs; a single-profile import moves the backup's profile onto the imported target. Unmapped profiles are dropped. Notes merge per `(profileId, videoId)` with the saved-notes contract, the same merge Notes sync uses. Lists use the playlist merge, so restoring the same backup twice changes nothing.
- `exportV3` (and the encrypted export built on it) adds `savedVideoNotes` and `localPlaylists` for the exported profiles when there are any. Automatic backups do not include them.
- Import rollback leaves `ftLocalPlaylistsV1` alone, as it already does for notes, so a rollback cannot undo a sync that landed meanwhile.

## Sync size cap (all platforms)

| Budget | Cap | Measured as |
|---|---|---|
| `playlists` area | **2 MiB** (2,097,152 bytes) | UTF-8 bytes of the encoded `filtertube.local-playlists` envelope for the one authorized profile. This is Android's `NativeLocalPlaylistSyncStore.MAX_SYNC_BYTES`; iOS should use the same number. |
| `settings` + `notes` together | 512 KiB | Canonical JSON of those areas. Unchanged. |
| Whole signed message | 3 MiB | Canonical JSON of the signed `filtertube.personal-sync` message (`personal_sync.js` `MESSAGE_MAX_BYTES`). |

- A sender whose envelope is over the cap refuses to sign with `personal_sync_too_large`, and a receiver refuses a larger message the same way. A merge result is stored locally whatever its size; only sending is capped.
- No chunking is needed above the protocol: Nanah's data channel already splits any message into 16,000-character frames and reassembles them before decryption.
- The delivery queue keeps its 512 KiB default for managed updates. Personal sync enqueues with `maxBytes` set to the message cap plus 64 KiB, the queue accepts single items up to 4 MiB, and the whole queue is capped at 16 MiB.

## Open items

- The apps' copy of the sync runtime (FilterTubeApp `filtertube_nanah/`) must vendor `shared/local_playlists.js`, `personal_sync.js` and `auto_sync_queue.js` from this commit and pass `playlistsRead`/`playlistsMerge` (Android's `autoSyncPlaylistsRead`/`autoSyncPlaylistsMerge`). An older peer refuses a grant that names `playlists`, so a mixed pair fails closed at linking.
