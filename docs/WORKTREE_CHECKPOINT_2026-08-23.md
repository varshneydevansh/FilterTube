# Unreleased source worktree checkpoint (2026-08-23)

This checkpoint records the accumulated source changes that were present in the
upstream worktree before the Android TV UI pass. They are kept together as one
source release boundary so the downstream app can be advanced from a known
upstream state instead of treating generated app assets as a second source of
truth.

## Included source areas

- direct YouTube admission and playlist advancement for blocked Watch items;
- voluntary Self-Control Sessions with persisted profile/policy locking and
  browser-boundary copy;
- separate Blocked rules and Allowed rules collections, non-destructive mode
  changes, and safer complete BlockTube migration;
- official category filtering, experimental spoken-language filtering, and
  original-audio preference plumbing;
- Advert Void player-plan removal and guarded fallback suppression, enabled by
  default but independently disableable;
- bounded metadata hydration, current Watch/Shorts/playlist identity handling,
  managed time accounting, embedded-player admission, and trusted-device flow
  hardening;
- extension dashboard/popup/help copy, website release status, responsive
  serene-shell styling, tests, and store artwork.

The detailed behavior contracts remain in the dated documents under `docs/` and
the focused runtime tests under `tests/runtime/`.

## Source-of-truth rule

Runtime behavior changes belong in this repository first. The downstream
`FilterTubeApp` checkout consumes a deliberately curated/generated subset via
its runtime-sync tooling; it must not become an alternate hand-edited runtime
source.

## Proof boundary

This checkpoint is a source snapshot, not a claim of complete installed-browser
or native-app proof. JavaScript syntax checks, focused runtime tests, extension
package builds, and downstream runtime sync/build checks must be recorded
separately from physical browser, Android, iOS, or TV validation.
