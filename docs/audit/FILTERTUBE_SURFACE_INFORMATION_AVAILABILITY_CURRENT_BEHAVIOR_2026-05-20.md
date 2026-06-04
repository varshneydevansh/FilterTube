# FilterTube Surface Information Availability - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged. This document narrows the identity waterfall into
surface-level availability rules. The goal is to prevent future work from
treating a video id, display name, stale DOM row, or learned map entry as
canonical channel proof unless the current surface actually provides that proof.

## Confidence Tiers

| Tier | Meaning | Current examples |
| --- | --- | --- |
| `canonical` | YouTube supplied stable identity fields in the current renderer, player payload, endpoint payload, or owner endpoint. | `videoDetails.videoOwnerChannelId`, `microformat.playerMicroformatRenderer.externalChannelId`, renderer byline `browseEndpoint.browseId`, `kidsVideoOwnerExtension.externalChannelId`. |
| `joinedByVideoId` | The current surface exposes a video id, and FilterTube joins that id to learned or fetched identity such as `videoChannelMap`. | Watch URL `v=VIDEO_ID`, Shorts `/shorts/VIDEO_ID`, playlist row `watchEndpoint.videoId`, stamped `data-filtertube-video-id`. |
| `displayOnly` | The surface exposes visible text that may help UI labels or expected-name checks, but it is not stable channel identity by itself. | DOM byline text, avatar alt, owner display name, metadata text, Kids aria labels. |
| `fallback` | The identity is recovered through an explicit resolver after current JSON/maps/DOM were insufficient. | `watch:VIDEO_ID`, `shorts:VIDEO_ID`, Kids watch fetch, `fetchChannelDetails`. |
| `unknown` | The surface does not currently prove the required field. | Direct `showSheetCommand` collaborator roster in filter logic, `compactAutoplayRenderer`, direct `watchCardHeroVideoRenderer` without wrapper rule. |

Important boundary: a video id is a join key, not channel identity. A display
name is a UI clue, not canonical identity. A learned map is useful cross-surface
memory, but it is `joinedByVideoId` until provenance and source confidence are
recorded by a future authority.

## Surface Information Availability Matrix

| Surface | JSON/player fields currently proven | Learned-map fields | DOM fields currently safe | Background fallback fields | Confidence boundary | Fixture still needed |
| --- | --- | --- | --- | --- | --- | --- |
| Main home/search | `videoRenderer`, `richItemRenderer`, `lockupViewModel`, and `videoWithContextRenderer` can expose video id, title, byline browse id, canonical base URL, handle/custom URL, and decorated-avatar channel identity. | `channelMap`, `videoChannelMap`, and `videoMetaMap` can be harvested and reused across later cards. | DOM card anchors, metadata links, avatar alt, and stamped `data-filtertube-*` attributes are usable as current-target evidence when present. | `fetchChannelDetails` only for unresolved menu/action targets. | Renderer browse ids are `canonical`; `videoChannelMap` joins are `joinedByVideoId`; avatar/name-only DOM is `displayOnly`; unresolved menu fetch is `fallback`. | Negative fixtures for late anchor arrival, modern lockup name-only cards, stale map mismatch, and non-matching sibling visibility. |
| Main watch current video | `ytInitialPlayerResponse`, `/player`, and `/next` can expose `videoDetails.videoOwnerChannelId`, `videoDetails.channelId`, `externalChannelId`, `ownerProfileUrl`, duration, publish/upload date, and category. | `videoChannelMap[videoId]` can override stale SPA owner DOM for the current watch id. | Owner row DOM can expose owner links/text, but current code treats it as stale-prone during SPA transitions. | `watch:VIDEO_ID` resolver, then watch HTML preview parse. | Player owner id is `canonical`; URL `v=VIDEO_ID` plus map is `joinedByVideoId`; owner row text is `displayOnly` unless it has a stable owner link; watch fetch is `fallback`. | Fixtures for owner-row stale transition, current-video false-hide, selected playlist preservation, and player side effects. |
| Shorts | Modern JSON/player data can expose `reelItemRenderer`, lockup/title fields, and sometimes owner identity, but current Shorts DOM often reaches runtime as only `/shorts/VIDEO_ID`. | `videoChannelMap` carries owner identity learned from player/renderer/fetch. | Shorts DOM link and `data-filtertube-video-id` are safe video id join keys only. | `shorts:VIDEO_ID` resolver, then Shorts page preview parse with credentialed fetch. | `/shorts/VIDEO_ID` is `joinedByVideoId`, not channel/title proof; fetched owner is `fallback`; any visible Shorts text without owner endpoint is `displayOnly`. | Fixtures for Shorts owner missing in DOM, Shorts JSON owner present, map-hit versus map-miss, and whitelist fail-closed versus false-hide. |
| Watch rail, watch cards, and end screen | `compactVideoRenderer`, `endScreenVideoRenderer`, `watchCardCompactVideoRenderer`, and wrapped `universalWatchCardRenderer` have current rules. Direct watch-card renderers remain gaps. | `videoChannelMap` can join rail/playlist/end-screen video ids to owners where learned. | Rail/card DOM can expose thumbnails, titles, bylines, and video ids; right-rail anchors may arrive late. | `watch:VIDEO_ID` for unresolved card/menu actions. | Direct renderer support is `canonical` only for registered wrappers; video-id-only rail DOM is `joinedByVideoId`; late byline DOM is `displayOnly`; resolver is `fallback`; unsupported direct watch-card renderers are `unknown`. | Capture fixtures for direct `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, player overlay end-screen DOM, compact autoplay, and sibling-visible rail behavior. |
| Watch playlist / Mix | `/next` playlist panel payloads can expose playlist-panel video id, title, byline browse id, canonical base URL, and channel mapping. Mix may expose playlist/seed identity without owner channel identity. | `videoChannelMap` is used for playlist rows and selected-row decisions. | Row href gives a video id; row byline text can be display-only; selected row state is route-sensitive. | `watch:VIDEO_ID` resolver when row identity is incomplete or alternate id is missing. | Playlist-panel owner browse id is `canonical`; row video id plus map is `joinedByVideoId`; Mix playlist/seed metadata is not owner proof; row byline text is `displayOnly`; watch resolver is `fallback`. | Fixtures for `compactPlaylistRenderer`, Mix owner absence, selected row variants, row recycling, and non-matching playlist siblings. |
| YouTube Kids | Kids JSON can expose `kidsVideoOwnerExtension.externalChannelId` / `channelId`, compact video owner fields, video id, title, and browse endpoints when present. | `videoChannelMap` and Kids watch cache can carry video-to-owner identity after JSON or resolver proof. | Public Kids web DOM and aria labels can be sparse; watch/card DOM may only expose video ids or display text. | Kids watch identity resolver checks stored/cached identity, then `https://www.youtubekids.com/watch?v=VIDEO_ID`. | `kidsVideoOwnerExtension` is `canonical`; Kids video-id-only DOM is `joinedByVideoId`; Kids visible labels are `displayOnly`; Kids watch fetch is `fallback`. | Fixtures for Kids browse, Kids watch, parent/setup state, profile-specific Kids mode, whitelist mode, and public-web layout drift. |
| YouTube Music | `/browse`/watch data and `videoWithContextRenderer` can expose usable video/title/byline fields. YTM `compactPlaylistRenderer` and some collaborator sheets remain gaps. | `videoChannelMap` is preferred for YTM fallback cards when only video id is stable. | `ytm-*` compact DOM can expose mobile-like text, subtitles, media-channel links, and video ids, but text can mix title/artist/metadata. | Watch/Shorts resolver if only video id is available for an action. | Supported renderers are `canonical`; YTM mapped cards are `joinedByVideoId`; mobile-like text is `displayOnly`; unsupported `compactPlaylistRenderer` and sheet roster fields are `unknown`; resolver is `fallback`. | Fixtures for YTM compact playlist creator identity, YTM show-sheet collaborators, YTM DOM guardrails, and non-matching text metadata. |
| Collaborator / showDialog / showSheet / avatar-stack | `showDialogCommand` dialog list items are parsed for collaborator channels. Avatar-stack extraction can identify multi-channel candidates. `showSheetCommand` sheet roster is seen by docs/bridge/injector paths but not filter-logic authority. | Collaborator maps/cache can enrich menu display and later actions. | Avatar/name-only DOM may identify a visible collaborator candidate but can be display-only or incomplete. | Dialog/sheet repair and channel details fetch only after user/menu paths when stable id/handle is missing. | `showDialogCommand` list items are `canonical`; avatar-stack/name-only candidates are `displayOnly`; learned collaborator enrichment is `joinedByVideoId` or map-derived; `showSheetCommand` roster is `unknown` for filter logic today; fetch repair is `fallback`. | Fixtures for show-sheet blocklist leak, show-sheet whitelist false-hide, avatar-stack false-hide, collaborator count mismatch, and menu/action persistence. |
| Posts/community/comments | Comment JSON and some post renderers can expose author/channel endpoints, but modern post/menu surfaces have split coverage. Comments and posts also use route-specific hide targets. | Channel maps may resolve author identity when endpoints are present elsewhere. | Comment/post DOM can expose author links/text and menu targets; text-only author labels are display-only. | Channel details fetch only for unresolved action targets. | Author browse endpoint is `canonical`; DOM author text is `displayOnly`; map joins are `joinedByVideoId` only when tied to a video/post id; unresolved action fetch is `fallback`; unsupported modern post shapes are `unknown`. | Fixtures for modern post menu insertion, comment continuation author identity, split post target, and non-matching thread/sibling visibility. |

## Current Source Proof

- `js/seed.js:606-687` intercepts `/youtubei/v1/search`, `/guide`,
  `/browse`, `/next`, and `/player`, parses JSON, and runs the engine for
  matched fetch endpoints.
- `js/seed.js:692-720` begins XHR endpoint interception for the same endpoint
  family.
- `js/filter_logic.js:1174-1237` harvests watch/player owner and metadata from
  `videoDetails`, `playerMicroformat`, `videoOwnerChannelId`, `ownerProfileUrl`,
  duration, date, and category fields.
- `js/filter_logic.js:1240-1273` harvests playlist-panel video-to-channel
  mappings.
- `js/filter_logic.js:1281-1367` harvests known renderer wrappers, including
  `kidsVideoOwnerExtension`.
- `js/filter_logic.js:528-566` defines wrapped watch-card identity paths for
  `universalWatchCardRenderer`.
- `js/filter_logic.js:3000-3027` parses `showDialogCommand` collaborator lists,
  while current renderer-gap tests pin `showSheetCommand` as unsupported by
  filter logic.
- `js/content_bridge.js:9700-10075` extracts visible-card DOM identity and marks
  weak name/video-id targets as fetch-needed rather than canonical.
- `js/content_bridge.js:11449-11490` treats Shorts DOM as structural/video-id
  evidence.
- `js/content_bridge.js:12167-12224` routes no-identifier watch/Shorts/playlist
  actions through `watch:VIDEO_ID` or `shorts:VIDEO_ID`.
- `js/content/dom_fallback.js:593-679` treats watch owner DOM as stale-prone and
  prefers `videoChannelMap[videoId]` when present.
- `js/background.js:2877-2942`, `js/background.js:2978-3070`, and
  `js/background.js:3072-3102` prove Shorts, Kids watch, and Main watch identity
  fallbacks check maps/caches before credentialed HTML fetch.

## Decision Boundary For Future Work

Do not optimize, delete, or broaden a source layer until the target surface has
positive and negative fixtures proving:

- which exact fields are present,
- whether those fields are `canonical`, `joinedByVideoId`, `displayOnly`,
  `fallback`, or `unknown`,
- whether a blocklist hide is source-proven,
- whether a whitelist hide is intentional fail-closed or a false-hide risk,
- whether fallback fetch is allowed by active rule state and user/action class,
- whether non-matching siblings and current/selected player surfaces remain
  visible and playable.

No runtime symbol named `surfaceInformationAvailability`,
`surfaceInformationAvailabilityAuthority`, or
`surfaceIdentityAvailabilityAuthority` exists yet. This document is the current
audit record, not an implemented authority.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this surface information availability audit
can support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
