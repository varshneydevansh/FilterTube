# FilterTube Extension Change Log - 2026-04-30

## Scope

This checkpoint records the extension-side source changes needed by the Android app Nanah sync pass. The goal was not a new YouTube blocking rule; it was keeping shared data semantics stable when settings move between extension, app, and future clients.

## Nanah And Import Semantics

- Android/app packed keyword sources such as `channel:<ref>|label=...|comment` are normalized back into the extension canonical shape: `source:"channel"` plus `channelRef`.
- `io_manager.js`, `settings_shared.js`, `background.js`, and `nanah_sync_adapter.js` now all preserve that channel-derived ownership during import, storage sanitization, Nanah merge, Nanah replace, and background keyword sync.
- Channel-derived `Filter All` keywords imported from the app stay owned by their channel row, so the dashboard can keep the green row styling, source badges, and ownership-safe delete behavior.
- Nanah pairing-code normalization now uses the same safe alphabet in `tab-view.js` and `js/vendor/nanah.bundle.js`: `ABCDEFGHJKMNPQRSTUVWXYZ23456789`.

## App Handoff

- These changes are the extension source of truth for the app files mirrored under `/Users/devanshvarshney/FilterTubeApp/packages/extension-source/upstream/`.
- The app-side hidden Nanah engine and native import/export bridge can now exchange channel-derived keyword rows without losing source color metadata.

## Verification

- `node --check` on the changed extension Nanah/import/storage files.
- Direct smoke coverage for app-packed channel keyword source normalization.
- Android app runtime mirror/build verification is tracked in `/Users/devanshvarshney/FilterTubeApp/docs/app/APP_CHANGELOG_2026-04-30.md`.
