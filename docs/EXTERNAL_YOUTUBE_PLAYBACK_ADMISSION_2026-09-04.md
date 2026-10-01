# External YouTube playback admission

Date: 2026-09-04

Updated: 2026-09-22

Status: source checkpoint with focused automated checks; current package builds and installed-browser acceptance remain open.

## Problem

Google Search can open a YouTube result while the top-level URL remains on `google.com/search`. The visible media is a cross-origin `youtube.com/embed/` iframe whose URL contains no video ID; Google keeps the ID only in the parent `vld=...,vid:<videoId>` fragment. FilterTube's earlier embed admission accepted only `/embed/<videoId>`, so the iframe ran with an empty current-video identity and never owned playback. A blocked YouTube channel, video, or keyword could therefore play without an admission decision.

This is different from a normal external link to YouTube. A normal link navigates to `youtube.com/watch`, where current-video admission already runs. It also differs from a conventional `/embed/<videoId>` URL because Google's iframe omits the route ID even though its Player response contains the exact identity.

## Chosen boundary: in-place admission from Player JSON

When FilterTube is enabled and at least one video-admission rule is active, the Google Search guard preserves Google's inline-player interaction. It obtains the exact current video ID from Google's `vld=...,vid:<videoId>` player route and from YouTube's `resolve_url`/Player/Next responses, pauses the Google media, and applies the same rule precedence used by current-video admission:

`Checking -> Allowed`

`Checking -> Blocked by <exact verified rule>`

`Checking -> Unable to verify required metadata`

The MAIN-world bridge runs both in the Google parent and inside YouTube embed frames. It never mutates YouTube responses. It relays only sanitized admission fields: video ID, title, description, keywords, duration, channel ID/name/handle, upload dates, category, and language when present. The isolated iframe guard owns the rule decision and presents the banner over the embedded player; the MAIN-world bridge in that iframe holds and resumes its media.

Allowed videos resume in the same Google player. Rejected videos remain paused there with the exact verified reason. If an active rule requires a field omitted by the embedded-player response, playback remains paused with `Unable to verify required metadata`; missing data is never classified as a channel block.

## Activation and media fallback

The network bridge and guard run at `document_start` on `https://*.google.com/search*` and in YouTube embed frames. Together they:

- recognizes `youtube.com/watch`, YouTube Shorts, YouTube embeds, `youtu.be`, Google redirect wrappers, and YouTube thumbnail URLs;
- preserves safe playlist and start-time query parameters;
- preserves Google's direct-result and inline-player click behavior;
- reads the active inline video ID from Google's `vld` fragment;
- observes YouTube `resolve_url`, Player, and Next JSON without modifying their responses;
- pause the iframe-local media before programmatic `play()` while the admission decision is pending;
- resumes the same media only after a verified allow decision;
- ignores result menus, share/save actions, and unrelated video providers; and
- keep an identified YouTube `<video>` paused after a verified rejection or unverifiable result.

The media guard requires positive YouTube evidence from the active `vld` video ID, a YouTube URL/thumbnail, or a captured Player response. An arbitrary Google video is not treated as YouTube merely because another YouTube result exists elsewhere on the page.

## Disabled and presentation-only boundary

The Google page is untouched when Global Disabled is active. It is also untouched when the only enabled settings are presentation controls such as hiding comments, recommendations, navigation, playlists, descriptions, Shorts shelves, or Advert Void.

External canonicalization becomes active only for rules whose meaning is whether a video may play:

- explicit blocked/allowed video rules;
- blocked/allowed channel rules;
- blocked/allowed keyword rules;
- Allow-only mode;
- duration;
- upload date;
- category;
- language; and
- uppercase title.

## Permission and scope

This checkpoint adds a narrowly matched Google Search content script. It expands page access to `https://*.google.com/search*`; it does not request all-sites access. Country-code Google origins such as `google.de` are not matched by Chrome's `google.com` host pattern and remain a separate permission/scope decision.

Other sites that use an actual YouTube embed share the iframe-local admission guard. Google's parent integration additionally reads its `vld` route; it does not relay that identity across origins into the iframe. The iframe obtains its own identity from its network responses. A site-owned or proxied player without a YouTube iframe still needs an explicit top-level host integration. This checkpoint does not claim protection for every non-Google proxy or for non-YouTube video services.

## Presentation and repeated-check safeguards

2026-09-22 follow-up: metadata arrival alone warms an admission decision without displaying a banner. Presentation requires an actual media play event or the iframe MAIN-world playback-attempt message. Parent-document media needs its own YouTube identity evidence; a previously cached result or Google route fragment cannot assign that identity to unrelated media. The pre-pause check now uses verified settings metadata as well as the local network cache, matching the later decision path and avoiding an unnecessary pause/resume for cached allowed media. This does not claim arbitrary proxy-player coverage or installed-browser proof. The focused external/overlay/direct-admission set passes 44/44 after this follow-up; prior package builds predate it.

Verified rejection uses FilterTube's themed overlay and muted looping background asset, with a static reduced-motion alternative. Checking and unavailable-metadata states remain neutral. Decorative overlay media is excluded from admission. Unchanged policy revisions are not repeatedly published, stale video decisions are ignored, and the metadata deadline does not schedule an immediate retry loop after expiry.

This staged checkpoint also includes the first Advert Void role-selection correction in `seed.js`: identify a unique expected-duration content candidate before selecting advert media, exclude decorative media, and remove the arbitrary second-video fallback. The remaining quarantine safeguards and executable role regressions are recorded in a separate follow-up commit. Duration matching is a heuristic, not proof of video identity or immunity from ad-block detection.

## Verification

- `tests/runtime/external-youtube-playback-guard-current-behavior.test.mjs` covers manifest worlds, Google's `vld` identity, sanitized Player capture, exact channel rejection from the supplied payload shape, same-page allowed resume, fail-closed missing metadata, and Disabled/presentation-only no-work behavior.
- Source syntax and all four manifest files parse successfully.
- The current external guard, overlay, and direct-admission regression set passes 41/41 tests (2026-09-22).
- Earlier Chrome/Firefox builds predate the latest edits and are not acceptance evidence for this checkpoint.
- Installed-browser behavior must still be checked before release closure.

## Installed-browser acceptance

Reload the built extension and verify on Google Search's Videos tab and full-screen result viewer:

1. Global Disabled: a YouTube result behaves exactly as Google normally handles it.
2. Presentation-only settings: same no-work behavior.
3. Active rule, allowed video: the same Google inline player resumes without a false blocked banner or navigation to YouTube.
4. Explicitly blocked video: the Google media remains paused and shows the explicit-video reason.
5. Blocked channel: the Google media remains paused and shows the verified channel reason.
6. Blocked keyword and each metadata rule: the Google media remains paused and uses the same exact reason as a pasted/direct URL.
7. Unknown metadata: playback stays paused with the neutral unavailable message, never a fabricated channel block.
8. Result overflow/menu actions: Google UI remains usable and does not navigate unexpectedly.

Automated source checks are not installed-browser proof.
# Live regression: recommendation identity mistaken for selected media (2026-09-22)

Read-only inspection of the failing Google embed confirmed that the MAIN bridge
held verified metadata for `gVRlg4BXKVo` (English Speeches), but pending admission
targeted `EC5L1MSlqtg`. Calling the isolated guard's candidate extractor on the
actual video reproduced that wrong ID from a nearby recommendation thumbnail.
This was not a channel match or missing Player identity.

Embedded media now uses the embed URL identity or the identity supplied by the
MAIN bridge, never ancestor-scanned links/artwork. Embed clicks also leave identity
selection to that bridge. A regression fixture verifies that recommendation
artwork cannot pause allowed selected media, while a selected blocked channel
still pauses. Installed-browser verification after extension reload remains open.

## Google result hover-preview regression (2026-09-24)

An ordinary Google Search result can start a muted thumbnail preview on hover.
That preview is not an opened YouTube player. Previously the parent-page guard
treated any such `video` play event as an admission attempt: it could infer a
YouTube ID from nearby result links, pause the preview, and cover the entire
search page with the checking or unavailable-metadata banner. Clicking the
banner could then change the inferred candidate because click handling scanned
non-link ancestors.

The Google parent guard now admits top-document media only while Google's
`fpstate=ive` inline viewer is open **and** the media's nearby identity matches
the viewer's selected `vld` video ID. An ordinary search page or unrelated
preview cannot acquire admission from cached Player metadata or a result link.
Closing the viewer clears its pending banner without restarting stale media;
non-link clicks do not select a video. The YouTube iframe guard remains
independent and fail-closed for actual embedded playback. Google is also
permitted to load only the FilterTube icon used by its admission overlay, and
the icon has the branded red backing.

Focused hover-preview, selected-player, embed, Disabled, and overlay source
tests pass. This is source/test evidence only; reload the extension and check
hover-only search results, a blocked opened inline video, and an allowed opened
inline video before marking installed-browser behavior verified.
