# Verified video metadata and settings refreshes

## Change

Player-verified channel identity and creator text now remain associated with their exact video ID for the page session, independently of replacement settings snapshots. The session cache is bounded to 256 entries. New verified responses can correct earlier verified metadata; unverified hints cannot overwrite it while inheriting its verification flags.

This does not cache an admission decision. Updated filter rules still evaluate the metadata again. Disabled remains Disabled, and missing required verification is not converted into permission or a channel-blocked reason. Verification flags and creator text are not added to persistent storage.

## Regression evidence

The executable tests in `tests/runtime/verified-video-metadata-snapshot-regression.test.mjs` cover snapshot replacement, unchanged disabled/rule state, rejection of unverified overwrites, verified corrections, and persistence excluding verification flags. All three pass.

This addresses concrete mechanisms relevant to #75 and repeated checking reported in #77. It is not proof that every reporter-specific configuration or installed browser is resolved. Older source-pinned settings audits also fail against existing structural changes; those failures must not be mistaken for live-browser evidence.

## Playlist follow-up (#69 / #77)

Removed three autonomous playlist transitions outside the admission evaluator: the ended-event Next scheduler, selected-row delayed Next click, and hidden-selected-row successor retry. A blocked current video stays in place. Explicit user Next/Previous navigation remains, and its installed listener now checks current Disabled state before interception. Selected playlist rows remain visible rather than prompting YouTube to move away from them.

The direct-admission executable suite and metadata suite passed 30/30 before the additional playlist source guard; the expanded metadata/playlist guard suite passed 4/4. Browser-installed playlist behavior still needs live confirmation.

## External selected-player recovery

The network bridge now recovers an already-loaded `movie_player.getPlayerResponse()` on explicitly selected Google Search playback, not only a YouTube iframe. Recovery requires the Google `/search` selected-player fragment and exact matching video ID; ordinary search and hover previews do not create candidates. This extends the existing uncommitted iframe/late-metadata recovery and navigation `resolve_url` support, committed together because they share the recovery lifecycle.

The external playback and new selected-Google recovery suites passed 23/23. This removes a demonstrated missing recovery path, not a promise that every external site's player or metadata failure is resolved.

## Consolidated admission presentation and pending work

Watch and Shorts now call the shared banner renderer, keeping the logo/red mark, reason, localization and background visuals consistent with external playback. Player-attached banners override the renderer's document-wide geometry with absolute player-sized geometry. Decorative background video is excluded from the direct play guard and cleaned up on release.

The related pre-existing pending source work is retained and committed with its tests: held SPA playback intent binds to the new route at navigation finish, Google metadata prefetch/hover does not invoke admission, Watch/Search card mutations keep candidate-scoped scans, and membership badges hide the matching card rather than the containing section/Watch page.

Latest combined focused admission, localization, external-player, metadata, mobile identity, large-list and membership suites passed 79/79. The broad historical blocking lane is still not green; see `ISSUE_VALIDATION_2026-10-01.md`. No installed-browser release claim is made.
