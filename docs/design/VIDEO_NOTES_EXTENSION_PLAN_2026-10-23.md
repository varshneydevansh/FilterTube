# Extension Watch Notes — implementation and acceptance boundary

The Watch action belongs beside YouTube's Share button, inside `ytd-watch-metadata #actions .top-level-buttons`. It opens a centered, top-layer private dialog, never a textarea inside the creator's description or the native action flex row. Mobile YouTube uses its slim action-bar container when available. YouTube may replace these containers; the public action reattaches without recreating an existing editor. A removed private frame needs a fresh capability.

## Implemented

- [x] Exact profile/video shared format-1 engine and vectors copied from the FilterTubeApp notes-contract package, without modifying the Android worktree.
- [x] Background-owned serial writes, full observed-base comparison, vector revisions, concurrent heads and null deletion tombstones. Writer identity is installation-local and never an exported credential.
- [x] Short-lived capabilities restricted to an admitted top-frame Watch page and one extension-origin editor document. Current exact profile, existing PIN authorization, route, content admission and managed time permission are checked again for personal reads/writes and timestamp actions. Expired/revoked capabilities cannot be renewed.
- [x] Personal text stays in extension-local storage and the extension-origin iframe within a closed shadow root. Only the public action label is in the YouTube DOM. No personal text in MAIN messages, logs, provider calls, creator descriptions or arbitrary profile requests.
- [x] Draft recovery in temporary background memory; dirty drafts survive committed changes. Saved-head review is explicit before replacement. Save/read/draft races cannot silently discard newer typing. Delete preserves a tombstone and offers Undo.
- [x] Mobile-inspired Insert current time and Jump to a timestamp controls, explicit Save/Delete, collapsed saved preview, initial editor focus, keyboard close confirmation and responsive controls. The extension uses a private modal dialog with an extension-origin editor, adapting the Android dialog flow.
- [x] Timestamp actions recheck native video identity, current source, ad-inactive state, access and finite duration immediately before seeking. Reading the current timestamp never changes playback. Links remain literal; at most 64 saved timestamps become controls.
- [x] Opening errors distinguish a verified locked profile from access changes and unavailable extension messaging. The older generic “unlock” message did not establish the cause of the reported failure.
- [x] Manifests, test lanes, current source inventories, three browser packages and audit addenda updated. Existing native playback, captions, audio, playlists, filtering and profile-settings mutation code are not changed by Notes.

## Validation on 2026-10-23

| Evidence | Result | Limit |
| --- | --- | --- |
| Notes contract/store/background/Watch/editor tests | 89/89 | Production functions in VM fixtures; not installed-browser proof |
| Smoke lane | 1,071/1,071 | Local runtime fixtures |
| Release lane | 360/360 | Includes current ZIP/staged/source-byte comparison; not permission to publish |
| Last complete settings lane | 733/828 | The 95 failure titles exactly match `/tmp/filtertube-void-settings.log`, `owned-settings.log` and `auto-settings.log`; broader settings gates remain open |
| Local browser editor harness | Draft conflict review, Keep draft/Save, Delete/Undo, keyboard confirmation and timestamp list observed | Synthetic notes with a fake runtime transport, no production data |
| Responsive harness | 360px viewport, 360px document scroll width | Editor layout only; native YouTube action-row responsiveness still needs installed testing |
| Installed Chrome lecture | Old Notes DIV still mounted after a page-only reload; playback paused after testing | Extension reload is required before testing the new action-row script/background |

The initial catch-all “unlock” message did not establish the failure cause. Follow-up testing found a SPA route check failure and an offscreen inline error. Those are addressed by the live-route handshake and top-layer dialog described below. Installed editor read/write/seek acceptance is still incomplete; do not infer it from local tests or a visible dialog.

Current build: `/Users/devanshvarshney/FilterTube/dist/chrome`; Firefox and Opera packages are also built. Nothing pushed, submitted, published or posted to GitHub.

## Shared source provenance

The Android worktree was read-only: `/Users/devanshvarshney/.codex/worktrees/android-main-improvements/FilterTubeApp`. No Gradle, TV/native build, asset mirror or runtime-sync command was run.

| Shared file | SHA-256 (identical to Android source) |
| --- | --- |
| `js/shared/saved_video_notes.js` | `b7e7f89775a2128bed205493418a83d4df13f80e86f95f9ae8c9bb1f1cac5e35` |
| `tests/runtime/fixtures/video-notes/v1-vectors.json` | `af84f66401df350e989b0a0b42ef5b5a659b3a8cf1b55236b24050c5e099cfad` |

## Private API

`FilterTube_NotesGrant` binds the actual sender tab/frame, current exact profile/video, isolated content-script instance and current admission receipt. `Read`, `Draft`, `Save`, `DiscardDraft`, `Position`, `Seek` and `Close` require that capability and an extension-origin editor document. Parent `Check`, `Position`, `Seek` and `Close` exchanges contain only capability/instance metadata and time values. They never carry note bodies or saved revision bases through the page bridge.

Private storage keys are `ftSavedVideoNotesV1` and `ftSavedVideoNotesWriterV1`. Temporary drafts are not durable across background/browser shutdown. Existing PIN helpers normalize IDs; Notes refuses whitespace-wrapped IDs rather than aliasing exact note keys. The shared engine still preserves such valid wire IDs.

## Backup and sync coordination — not enabled

Explicit Android v4 profile backups can include optional top-level **`savedVideoNotes` object** containing `{format: 'filtertube.saved-video-notes', version: 1, entries: [...]}`. Active-only export metadata identifies the exact sole exported profile; full exports identify full scope. Notes belong only to those exported profiles. Ordinary AppPreferences/Nanah serialization remains note-free.

Combined restore must use the normalized profile import's exact source-to-target map and independently authorized target set. Missing notes preserve existing notes. Concurrent heads reject the entire combined restore; an explicit profiles-only option may preserve local notes and the original input. No name matching, time-wins resolution or silent text loss.

This extension intentionally rejects notes-bearing imports before any profile mutation until combined restore exists. Existing profile import rollback cannot overwrite or erase a concurrent Notes edit or writer identity. Current export/device-sync payloads omit Notes and writer identity. There is **no claim of Notes backup, device sync or installed Android↔extension interoperability**.

## Remaining acceptance work

- [x] Confirm the installed public Notes action in the real YouTube action row.
- [x] Reproduce the Home-to-Watch grant failure and add a regression; the previous background source fails this fixture.
- [ ] Resolve/confirm the empty-editor observation described below with a direct user check.
- [ ] On a disposable exact-profile/video note, verify create/update/reopen/Delete/Undo and timestamp controls in the installed extension.
- [ ] Verify active profile/PIN revocation, blocked content, managed time expiry, navigation, native playback and narrow action-row layout without bypassing existing gates.
- [ ] Separately implement and cross-client-test explicit Notes backup/restore/sync before claiming portability.

## Follow-up: navigation, dialog and readability

On the reported Usher page, the initial navigation entry was YouTube Home while the current address was a Watch playlist route. A Notes grant returned `access_changed` before the isolated admission receipt was requested. Fresh compiled settings matched the current profile and did not hide information/buttons or deny Main viewing.

The old adapter required `MessageSender.url` itself to identify the current video, which rejects a retained initial document URL after YouTube SPA navigation. The new adapter verifies the HTTPS YouTube sender origin and main frame, then binds the **live** `tabs.get` Watch URL and current isolated receipt to the exact requested profile/video. PIN, filter and managed-time gates remain in force. A Home/previous-video-to-current-Watch fixture fails against the prior committed adapter and passes with the fix; untrusted origins, child frames and mismatching live routes still fail.

The editor now uses a native top-layer dialog so an access error cannot be stranded below the description. Escape requests close confirmation from the exact extension editor document; dirty drafts are not discarded by the dialog's default cancel behavior. A frame that never connected can close safely; a failed editor close request offers an explicit warning before closing without saving. Foreign controller instances ignore receipts they do not own.

Readability now follows the app's note-first layout: 16–17px note text, generous line spacing, high contrast surfaces and disabled controls, a compact header, timestamp controls separate from Delete/Save, and secondary saving/sync information behind a disclosure. At 360px the preview shows Close, both timestamp controls and Save without horizontal clipping. Preview screenshots use synthetic notes and a fake runtime; they are **not installed authorization or persistence proof**.

Live Chrome testing subsequently showed the modal opening on a video reached through SPA navigation (`aria-expanded=true`, live page visible). During automation, the private iframe had an unexpected empty `srcdoc` attribute and rendered blank. The production source does not set `srcdoc`. Its mutator is **not established**; do not attribute it to YouTube, another extension or browser tooling without evidence. Temporary Notes message instrumentation was restored and debugger instrumentation was disabled. No PIN, note body, writer identity or capability token was logged. A direct user clarification asks whether the editor itself opens or the user also sees an empty dialog.

The latest readable build is packaged for Chrome, Firefox and Opera. Installed note creation, update, delete/recovery, timestamp seek and profile/PIN/filter revocation remain acceptance gates. No native files were edited and nothing was pushed or published.
