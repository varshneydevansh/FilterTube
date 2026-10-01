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
