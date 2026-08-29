# FilterTube Advert Void Player-State and DOM-Work Boundary — 2026-08-26

Status: current-behavior record for the Advert Void stability maintenance
that is being released with the v3.3.7 source train.

## Scope

This record covers the two small changes in the current worktree:

- `js/seed.js` requires the active Watch player to expose both
  `ad-showing` and `ad-interrupting` before class-based advert suppression is
  considered. Visible advert selectors and advertiser/Skip text remain
  independent evidence.
- `js/content/dom_fallback.js` no longer reports `hideSponsoredCards` as
  generic DOM mutation work. Its route-scoped sponsored CSS writer remains
  available, and the MAIN-world Advert Void runtime continues to own Player
  ad-plan sanitization and escaped-player fallback handling.

## Why the boundary exists

YouTube's SPA transitions can leave one advert class on the player while the
next requested video is being installed. Treating either class alone as proof
of an active advert can hide or mute the requested video. Requiring the paired
state makes the class signal conservative while preserving the stronger
visible-ad evidence path.

Sponsored-card CSS cleanup is a separate, targeted path. Counting it as broad
DOM fallback work caused ordinary renderer scans and mutation handling to stay
active even though advert handling is already owned by dedicated CSS and
MAIN-world observers. Removing that generic-work contribution reduces
scroll-time reflow and card movement; it does not remove the sponsored CSS
selectors or the Player response sanitization path.

## Proof boundary

The focused runtime test
`tests/runtime/ad-void-player-suppression-current-behavior.test.mjs` pins:

- paired class detection;
- rejection of the old single-class CSS selectors; and
- exclusion of `hideSponsoredCards` from generic DOM-fallback work while its
  dedicated selector branch remains present.

This is a source/test boundary. It does not claim that every YouTube advert
placement is removed before first paint, nor that browser-installed playback
has been manually validated on every route.
