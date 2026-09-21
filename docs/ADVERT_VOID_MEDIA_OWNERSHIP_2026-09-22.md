# Advert Void media ownership correction

Date: 2026-09-22

Status: source and focused regression checks complete; installed-browser acceptance and reported escaped-ad root cause remain open.

## Verified defect and changes

The previous role selector chose the first unpaused video as the advert before identifying content. Once parallel content started playing, a subsequent pass could select that content as the advert. It also treated a paused second video with a different duration as content without matching the requested duration.

The preceding staged checkpoint (`4edfc734`) identifies a unique expected-duration content candidate first, excludes candidates matching content from advert selection, removes the arbitrary second-video fallback, and excludes decorative admission media. This follow-up:

- requires a separate advert before returning content for parallel promotion;
- skips quarantine when no advert belongs to the selected player;
- scopes quarantine queries to that player rather than the whole document;
- excludes decorative admission background media from quarantine; and
- adds executable role/quarantine regressions for reordered playing elements, unknown duration, ambiguous duration matches, lone content, decorative media, and missing/out-of-player adverts.

Duration remains a heuristic. These changes do not prove exact media identity, fix every admission/Advert Void interaction, or remove every source of unwanted pause/resume behavior.

## What this does not claim

Advert Void still removes observed ad-plan fields, attempts official Skip, and can seek a positively identified advert near its end. It is not simply an untouched advert playing elsewhere. This correction does not implement or guarantee avoidance of YouTube ad-block detection, server enforcement, or playback restrictions. A native app owning its player is not equivalent to an extension modifying YouTube's player.

The user's Chrome capture shows repeated full Watch scans over 153 cards and collaborator retries exhausted. Those logs do not establish why adverts escaped suppression. A subsequent read-only browser inspection observed `player-ad-plan-removed` entries for Player/get_watch responses, including removal of `adBreakHeartbeatParams`; it did not capture a conclusive escaping-ad transition or confirm popup settings. These observations do not close issues #69, #75, #76, or #77.

## Verification

- `node --test tests/runtime/ad-void-player-suppression-current-behavior.test.mjs`: 18/18 pass, including five new executable regression tests; the suite also contains source-contract assertions.
- Direct-admission, external playback guard, and external overlay tests: 41/41 pass.
- `node --check js/seed.js` and whitespace checks pass.
- No extension reload, package rebuild, installed fix confirmation, or release claim accompanies these commits.

## Remaining acceptance

Capture an actual pre-roll and mid-roll transition with Advert Void enabled, including the bounded Advert Void log and player media roles. Confirm allowed content retains normal playback and manual pause behavior, blocked content cannot be resumed by Advert Void, and Global Disabled causes no filtering effects with saved rules retained. Repeat direct navigation and browser Back/Forward, then retest the reported Google embedded player. Investigate repeated full-page scans and collaborator lookup independently. Do not close the user reports based only on the focused tests.
