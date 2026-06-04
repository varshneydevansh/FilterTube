# FilterTube Capture Fixture Traceability - 2026-05-18

Status: current-behavior audit only. This is not an implementation patch.

The ignored root captures are valuable because they contain real YouTube
renderer and DOM shapes. They are also large, private/local, and unstable, so
the audit must treat them as raw evidence only. This document maps that raw
evidence to the small committed fixtures that currently exist and the missing
fixture obligations that still block behavior changes.

## Evidence Chain

```text
ignored root capture files
        |
        v
docs/json_paths_encyclopedia.md + docs/youtube_renderer_inventory.md
        |
        v
small committed fixture fragments under tests/runtime/fixtures/captures/
        |
        v
current-behavior tests that prove pass-through, hide, leak, or false-hide risk
```

The distilled docs are discovery indexes. A row in those docs is not runtime
proof until it is backed by a committed fixture and a current-behavior test.

## Current Corpus Count

The ignored capture block in `.gitignore` currently has:

```text
47 entries
46 unique paths
45 paths present in this local workspace
1 missing historical path: post_opt1_logs.txt
```

The duplicate path is `playlist.json`.

## Current Committed Fixture Coverage

The committed extraction set currently contains 44 fragments:

| Committed fixture | Source capture | Surface | Current proof |
| --- | --- | --- | --- |
| `ytm-compact-playlist-renderer.json` | `YTM.json` | YouTube Music playlist card | `compactPlaylistRenderer` currently passes through keyword and channel rules. |
| `ytm-watch-playlist-panel-json.json` | `YTM.json` | YouTube Music watch playlist panel JSON | Three `playlistPanelVideoRenderer` fragments filter in blocklist and whitelist modes, but none carries the selected/current row seen in the rendered YTM watch/player DOM fixture. |
| `ytm-browse-channel-list-item-renderer.json` | `ytm_browse?prettyPrint=false.json` | YouTube Music browse channel list | `channelListItemRenderer` rows currently pass through blocklist and whitelist rules while still queuing channel-map side effects from captured browse endpoints. |
| `ytm-watch-player-dom.html` | `YTM-WATCH PLAYER.html` | YouTube Music watch/player DOM | Rendered mobile watch/player DOM after FilterTube mutation: player shell, related hidden row, selected hidden playlist row, visible sibling row, and nonselected hidden sibling row are preserved for selector and selected-row policy proof. |
| `ytm-logs-playlist-bottom-sheet-stale-identity.html` | `YTM-LOGS.txt` | YouTube Music playlist card and observed bottom sheet | `docs/audit/FILTERTUBE_YTM_LOGS_PLAYLIST_BOTTOM_SHEET_STALE_IDENTITY_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/ytm-logs-playlist-bottom-sheet-stale-identity-current-behavior.test.mjs` pin one reduced log-derived DOM pair where the visible playlist owner is `@KillTony` but the injected bottom-sheet block item carries `UCWFKCr40YwOZQx8FHU_ZqqQ` and label `@JerryRigEverything`, proving stale menu identity risk rather than safe YTM menu authority. |
| `main-collab-dialog-video-renderer.json` | `collab.json` | Main collaboration video | `showDialogCommand` collaborator roster currently blocks by secondary collaborator ID. |
| `main-collab-homepage-avatar-stack.html` | `collab_on_homepage.html` | Main collaboration search/home DOM | Avatar-stack collaboration markup can carry display names and handles while collaborator UC IDs are still blank, so avatar-stack/name evidence is not by itself canonical channel identity. |
| `main-collab-resolved-search-card-dialog.html` | `collab.html` | Main collaboration search DOM | `docs/audit/FILTERTUBE_MAIN_COLLAB_RESOLVED_SEARCH_CARD_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/main-collab-resolved-search-card-dialog-current-behavior.test.mjs` pin an already-mutated search card with four resolved collaborator UC IDs, a pending Google DeepMind block marker, avatar-stack markup, native action-menu markup, and a dialog roster with four `/channel/UC...` links; this is resolved collaborator evidence, not a complete whitelist/blocklist authority. |
| `main-doms-mutated-main-dom.html` | `DOMs.html` | Main mixed home/search/watch DOM | `DOMs.html` is already mutated by FilterTube quick-block/fallback-menu markers and does not contain clean post/community DOM selectors, so it supports broad selector and inserted-control risk proof but not Main post insertion proof. |
| `main-compact-radio-renderer.json` | `playlist.json` | Main generated Mix/radio playlist card | `compactRadioRenderer` blocks by title keyword but passes through creator/channel rules because this raw fragment carries playlist/video IDs and display-only YouTube byline, not creator channel identity. |
| `playlist-json-player-metadata.json` | `playlist.json` | Main playlist/Mix player metadata fragment | The second balanced `playlist.json` fragment is current-video/player metadata for `Pkh8UtuejGw`/`ShawnMendesVEVO`; it queues owner/meta side effects and passes through disabled, blocklist, and whitelist modes, but it is not playlist creator authority. |
| `ytm-show-sheet-collab-video-with-context-renderer.json` | `YTM-XHR.json` | YTM collaboration video | `showSheetCommand` collaborator roster currently passes through channel rules. |
| `kids-compact-video-renderer.json` | `YT_KIDS.json` | YouTube Kids compact video | Kids compact video currently blocks by `kidsVideoOwnerExtension` channel ID. |
| `kids-latest-compact-video-owner-extension.json` | `yt_kids_latest.json` | YouTube Kids public-web compact-video siblings | Kids compact-video owner extensions can harvest video-to-owner map entries, block a matching owner while preserving a sibling, and allow one owner in whitelist mode while removing the nonmatching sibling. |
| `kids-browse-malformed-fragment-compact-video.json` | `ytkids_browse?alt=json.json` | YouTube Kids malformed browse fragment | The malformed direct-JSON container contains a parseable browse fragment where compact-video filtering works but `kidsSlimOwnerRenderer` owner rail entries remain visible in blocklist and whitelist modes. |
| `main-reel-player-overlay-renderer.json` | `reel_item_watch?prettyPrint=False.JSON` | Main active Shorts/reel overlay | Active Shorts overlay carries owner UC id, handle, and avatar evidence but currently passes through channel rules because `reelPlayerOverlayRenderer` is not direct `FILTER_RULES` coverage. |
| `ytm-end-screen-video-renderer.json` | `YTM-XHR.json` | YTM end screen | Direct `endScreenVideoRenderer` currently blocks by captured title keyword. |
| `main-comment-thread-renderer.json` | `comments.json` | Main classic comments | Classic `commentThreadRenderer` hides when `hideAllComments` is enabled. |
| `main-modern-comment-thread-renderer.json` | `YT_MAIN_next?prettyPrint.json` | Main modern comment continuation | Modern comment thread with `commentViewModel` hides when `hideAllComments` is enabled. |
| `main-comment-append-entity-response.json` | `YT_MAIN_NEXT_RESPONSE_COMMENT.json` | Main append comment continuation response | `hideAllComments` removes the visible `commentThreadRenderer` item, but keyword/channel rules currently ignore the paired `frameworkUpdates.entityBatchUpdate.commentEntityPayload` where the comment text and author identity live. |
| `main-next-reload-modern-comments.json` | `YT_MAIN_NEXT.json` | Main reload comment continuation response | `YT_MAIN_NEXT.json` is direct JSON comment-reload evidence rather than watch/autoplay proof: `hideAllComments` removes modern `commentThreadRenderer` wrappers while preserving the header and body continuation item, and keyword rules do not act on the reduced modern ViewModel payload. |
| `main-search-refinement-card-renderer.json` | `strange_ytInitialData.json` | Main mobile search refinement album card | `docs/audit/FILTERTUBE_MAIN_SEARCH_REFINEMENT_CARD_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/main-search-refinement-card-current-behavior.test.mjs` pin that `searchRefinementCardRenderer` carries query, playlist endpoint, and byline channel identity but passes through matching blocklist keyword/channel rules plus whitelist nonmatch because it has no direct JSON rule coverage; a supported watch-card sibling can be removed while the refinement row remains. |
| `main-search-universal-watch-card-renderer.json` | `strange_ytInitialData.json` | Main mobile search hero watch card | `universalWatchCardRenderer` wrapper filtering works for captured title/channel identity while direct child watch-card renderers remain separate gaps. |
| `main-search-direct-watch-card-rich-hero-subrenderers.json` | `strange_ytInitialData.json` | Main mobile search direct watch-card subrenderer gap | Real nested `watchCardRichHeaderRenderer` and `watchCardHeroVideoRenderer` child objects are presented as direct top-level renderer keys to prove those direct forms pass through matching blocklist and whitelist-nonmatch rules today; the raw source has no direct RHS panel token. |
| `main-search-compact-channel-renderer.json` | `strange_ytInitialData.json` | Main mobile search channel result card | `compactChannelRenderer` currently passes through blocklist keyword/channel and whitelist non-match modes while still queuing one channel-map side effect. |
| `main-guide-entry-renderer.json` | `guide?prettyPrint=false.json` | Main desktop guide subscription channel entry | `guideEntryRenderer` currently passes through matching keyword and channel rules despite carrying a subscription channel browse ID and canonical handle, because it has no direct JSON rule coverage. `docs/audit/FILTERTUBE_MAIN_GUIDE_ENDPOINT_NO_WORK_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md` and `tests/runtime/main-guide-endpoint-no-work-boundary-current-behavior.test.mjs` now also prove the guide endpoint is not a zero-work path today: empty blocklist, whitelist, and guide DOM-control-only fetches call `processData()` and rebuild, while disabled fetch still parses and rebuilds. |
| `main-home-rich-lockup-mix-renderer.json` | `logs.json` | Main desktop home rich-grid Mix lockup | `docs/audit/FILTERTUBE_MAIN_HOME_RICH_GRID_MIX_VIDEO_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/main-home-rich-grid-mix-video-current-behavior.test.mjs` pin that `richItemRenderer` unwraps to `lockupViewModel`, passes through with no rules, blocks by title keyword, and passes through channel ID/handle rules because the fragment has playlist/video IDs plus display-only metadata text, not creator channel identity; whitelist keyword can preserve it while channel allow does not. |
| `main-home-rich-video-renderer.json` | `logs.json` | Main desktop home rich-grid video card | `docs/audit/FILTERTUBE_MAIN_HOME_RICH_GRID_MIX_VIDEO_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/main-home-rich-grid-mix-video-current-behavior.test.mjs` pin that `richItemRenderer` unwraps to `videoRenderer`, passes through with no rules, blocks by title keyword or canonical channel ID/handle, queues channel/video map side effects, and preserves/removes adjacent Mix/video siblings according to blocklist or whitelist authority. |
| `main-watch-get-watch-playlist-end-screen.json` | `get_watch?prettyPrint=false.json` | Main desktop watch playlist panel and end screen | Direct `watchNextResponse` proof for `playlistPanelVideoRenderer` and `endScreenVideoRenderer`: no-rule pass-through, blocklist sibling preservation, whitelist global removal of nonmatching rows, and learned map side effects. |
| `main-watch-autoplay-video-endpoint.json` | `get_watch?prettyPrint=false.json` | Main desktop watch autoplay endpoint | Watch autoplay uses endpoint objects: a supported playlist row can be removed while `autoplayVideo` and `nextButtonVideo` still point to the same video in blocklist and whitelist nonmatch modes; the raw capture has no `compactAutoplayRenderer`. |
| `main-watch-html-embedded-playlist-endscreen-json.json` | `YT_MAIN_WATCH.html` | Main desktop watch HTML embedded JSON | The second embedded `ytInitialData` assignment in `YT_MAIN_WATCH.html` proves playlist-panel and player-overlay end-screen JSON rows filter under existing renderer rules, while the raw capture still has zero rendered player DOM end-screen selector tokens. |
| `main-watch-initial-lockup-shorts-json.json` | `YT_MAIN.json` | Main desktop watch initial JSON | `YT_MAIN.json` is a mixed raw capture, not Main browse/search completion proof: fragment 0 has watch initial `lockupViewModel` rows, a Shorts remix shelf, and continuation scaffolding; fragment 1 is tracked separately by the player metadata fixture below. |
| `main-watch-player-fragment-metadata.json` | `YT_MAIN.json` | Main desktop watch player metadata JSON | The later `player?prettyprint=false` fragment in `YT_MAIN.json` is metadata-only `/player` proof: `videoDetails` and `playerMicroformatRenderer` harvest owner/meta maps, cards and endscreen element siblings pass through blocklist/whitelist modes, and no direct recommendation renderer keys are present. |
| `main-watch-tmp-playlist-collab-dialog.json` | `tmp.json` | Main desktop watch playlist collaborator dialog | `docs/audit/FILTERTUBE_MAIN_WATCH_TMP_PLAYLIST_COLLAB_DIALOG_CURRENT_BEHAVIOR_2026-05-24.md` and `tests/runtime/main-watch-tmp-playlist-collab-dialog-current-behavior.test.mjs` pin a mixed `tmp.json` container whose later get-watch array has a selected Mix playlist row with `showDialogCommand` collaborators: title-command identity `UCGnjeahCJW1AF34HBmQTJ-Q` / `/@shakiraVEVO` is harvested, but current filtering matches the row through renderer-context collaborator ID `UCYLNGLIzMhRTi6ZOLjAPSmw`, creating a whitelist/blocklist reconciliation gate before JSON-first collaborator optimization. |
| `playlist-panel-header-mix-dom.html` | `playlist.html` | Main playlist panel header DOM | The Mix header publisher says `Mixes are playlists YouTube makes for you`; the reduced header has no `/channel/`, `/@`, `data-filtertube-channel-id`, selected-row state, or hidden markers, so it is not creator channel identity proof. |
| `playlist-player-endscreen-dom.html` | `playlist.html` | Main playlist/player end-screen DOM | Rendered desktop player end-screen DOM exists in `playlist.html`, but this already-mutated playlist capture is not clean Main watch DOM wall proof and still needs sibling-visible, whitelist, disabled/no-work, and no playback side-effect proof before behavior changes. |
| `main-upnext-feed-watchpage-lockup-continuation.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` | Main desktop watch late-loaded up-next feed | `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` is a prose-plus-balanced-fragments capture; its parsed `/youtubei/v1/next` fragment appends `lockupViewModel` rows into `watch-next-feed`, blocks the matching video lockup by title/channel rules, treats Mix playlist metadata as display-only creator identity, and has zero parsed compact-autoplay, autoplay endpoint, end-screen, or playlist-panel keys. |
| `main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` | Main desktop watch claim-prefaced up-next feed | `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` is a claim-prefaced prose-plus-one-fragment capture; its parsed `/youtubei/v1/next` fragment appends `lockupViewModel` rows into `watch-next-feed`, proves two primary decorated-avatar channel decisions in blocklist and whitelist modes, and proves the prose collaborator claims are not parsed collaborator roster proof. |
| `main-upnext-feed-watchpage3-autoplay-previous-end-screen.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` | Main desktop watch embedded up-next feed | `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` is a prose/`var ytInitialData` container; the reduced fixture proves `autoplayVideo`/`nextButtonVideo`/`previousButtonVideo` endpoint objects survive after matching supported playlist or player-overlay end-screen rows are removed, and the raw capture has no `compactAutoplayRenderer`. |
| `main-watchpage-embedded-post-renderer.json` | `watchpage.json` | Main embedded browse/feed community posts | `watchpage.json` is a Markdown/`var ytInitialData` container; its embedded `FEwhat_to_watch` rich-grid `postRenderer` rows pass through blocklist keyword/channel and whitelist modes while still queuing channel-map side effects, so this is modern post JSON proof rather than watch-next proof. |
| `ytm-dom-video-card-with-menu.html` | `YTM-DOM.html` | YouTube Music search DOM video card | A YTM video card can expose a canonical `/channel/UC...` owner link, a video ID, native `ytm-menu-renderer` action menu, and FilterTube quick-block anchoring inside the same card. |
| `ytm-dom-post-card-with-menu.html` | `YTM-DOM.html` | YouTube Music/Home-style post DOM card | A mobile backstage/community post can expose `ytm-backstage-post-thread-renderer`, `yt-post-header`, an author handle link, a `/post/...` permalink, and native `ytPostHeaderHostActionMenu` without any FilterTube menu item already inserted. |
| `playlist-selected-row.html` | `playlist.html` | Main playlist panel DOM | Selected `ytd-playlist-panel-video-renderer` markup and action menu are preserved for selector tests. |
| `collab-mix-selected-row.html` | `collab_in_playlist_mix.html` | Collaboration mix playlist DOM | Selected playlist row carries FilterTube channel/video markers and action menu. |

Unique raw sources represented by committed fragments:

```text
YTM.json
collab.html
collab.json
collab_on_homepage.html
DOMs.html
YTM-XHR.json
YT_KIDS.json
yt_kids_latest.json
ytkids_browse?alt=json.json
reel_item_watch?prettyPrint=False.JSON
comments.json
YT_MAIN_next?prettyPrint.json
YT_MAIN_NEXT.json
YT_MAIN_NEXT_RESPONSE_COMMENT.json
playlist.json
strange_ytInitialData.json
logs.json
guide?prettyPrint=false.json
YT_MAIN.json
get_watch?prettyPrint=false.json
tmp.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json
watchpage.json
YTM-DOM.html
YTM-WATCH PLAYER.html
ytm_browse?prettyPrint=false.json
YTM-LOGS.txt
playlist.html
collab_in_playlist_mix.html
```

## Unextracted High-Priority Evidence

These raw captures are present or documented but do not yet have a committed
minimal fragment proving their high-risk behavior.

| Capture family | Raw sources | Missing proof obligations |
| --- | --- | --- |
| Main watch / next | `YT_MAIN_WATCH.html`, `YT_MAIN.json`, `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`, `get_watch?prettyPrint=false.json`, `tmp.json`, `watchpage.json` | `YT_MAIN.json` is partially extracted for a mixed-capture classification fixture: fragment 0 is watch initial JSON with 20 `lockupViewModel` rows, 30 `shortsLockupViewModel` rows, one Shorts remix shelf, and continuation scaffolding, while fragment 1 is a later `player?prettyprint=false` metadata payload with `videoDetails`, `playerMicroformatRenderer`, cards, and endscreen elements but no direct recommendation renderer keys. The reduced fixtures prove no-rule preservation, blocklist/whitelist watch-lockup decisions, `hideAllShorts` JSON removal, map/meta side effects, player metadata pass-through, and that this raw file is not Main browse/search completion proof. `get_watch?prettyPrint=false.json` is partially extracted for one direct `watchNextResponse` fixture proving playlist-panel and end-screen no-rule pass-through, blocklist sibling preservation, whitelist cross-row behavior, and learned map side effects, plus one watch autoplay endpoint fixture proving `autoplayVideo`/`nextButtonVideo` endpoint objects survive after the matching supported playlist row is removed in blocklist and whitelist nonmatch modes. `tmp.json` is now partially extracted from its later get-watch array for one selected watch Mix playlist collaborator row plus one normal sibling row; it proves `showDialogCommand` collaborator filtering currently uses renderer-context IDs while a separate title-command identity can be harvested but not matched for whitelist/blocklist decisions. `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` is now partially extracted for a prose-plus-balanced-fragments `/youtubei/v1/next` `watch-next-feed` continuation fixture proving supported `lockupViewModel` title/channel decisions, unresolved Mix playlist identity boundaries, sibling preservation, and zero parsed compact-autoplay, autoplay endpoint, end-screen, or playlist-panel keys in that fragment. `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` is now partially extracted for a claim-prefaced prose-plus-one-fragment `/youtubei/v1/next` `watch-next-feed` continuation fixture proving two primary decorated-avatar channel decisions, sibling preservation in blocklist/whitelist modes, map side effects, and the boundary that prose collaborator claims are not parsed collaborator roster proof. `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` is now partially extracted for an embedded `ytInitialData` fixture proving `autoplayVideo`/`nextButtonVideo`/`previousButtonVideo` endpoint objects survive after matching supported playlist or player-overlay end-screen rows are removed, while the raw capture still has no `compactAutoplayRenderer`. `YT_MAIN_NEXT.json` is partially extracted as direct JSON comment-reload evidence, not watch/autoplay evidence: it has `reloadContinuationItemsCommand` roots and no parsed watch rail, playlist-panel, end-screen, or autoplay keys. `watchpage.json` is partially extracted only for embedded `FEwhat_to_watch` rich-grid `postRenderer` rows and remains not watch-next proof. `YT_MAIN_WATCH.html` is now partially extracted for one embedded `ytInitialData[1]` fixture proving playlist-panel and player-overlay end-screen JSON row decisions, and `docs/audit/FILTERTUBE_MAIN_WATCH_HTML_ENDSCREEN_SHAPE_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md` plus `tests/runtime/main-watch-html-endscreen-shape-classification-current-behavior.test.mjs` still classify it as embedded JSON evidence with zero player DOM end-screen selector tokens, so the DOM wall remains unextracted. `playlist.html` now has a reduced rendered desktop player end-screen DOM fixture, but it is already-mutated playlist-route evidence and not clean Main watch DOM wall proof. Remaining proof still includes clean Main watch end-screen video wall DOM coverage, any real `compactAutoplayRenderer` shape if it appears in other captures, watch-card RHS/hero/header direct renderers, watch playlist panel header policy, `/next` no-rule pass-through, explicit `/player` metadata-only endpoint policy, complete parsed collaborator roster reconciliation proof, and watch rail whitelist scaffold preservation. |
| Main browse / search / guide | `guide?prettyPrint=false.json`, `strange_ytInitialData.json`, `logs.json`, `text.txt` | Fresh install search/home pass-through from real captures, guide endpoint no-work proof, search refinement cards, channel rows, broad shelf false-hide boundaries, and renderer drift against current YouTube home/search payloads. `YT_MAIN.json` is now reclassified as watch initial JSON, not browse/search proof. `tmp.json` is now classified as mixed browse assignment plus later watch get-array evidence, not Main browse/search completion proof. `strange_ytInitialData.json` is partially extracted for one `searchRefinementCardRenderer` proving current pass-through for matching keyword/channel rules, whitelist nonmatch, sibling watch-card removal, and search fetch parse/rebuild no-work boundaries; one `universalWatchCardRenderer` proving wrapper title/channel filtering; one direct rich-header/hero subrenderer gap fixture proving those real child objects pass through when presented as direct renderer keys; and one `compactChannelRenderer` proving channel-card pass-through plus channel-map side effect. `logs.json` is partially extracted for one Home `richItemRenderer`/`lockupViewModel` Mix lockup proving no-rule pass-through, title-keyword blocking, display-only metadata non-identity, and whitelist keyword/channel split, plus one Home `richItemRenderer`/`videoRenderer` proving canonical channel blocking, channel/video map side effects, sibling preservation/removal, and home browse fetch parse/rebuild no-work boundaries. `guide?prettyPrint=false.json` is partially extracted for one `guideEntryRenderer` proving guide subscription channel rows pass through matching keyword/channel rules today. Full search/home sibling sets, grid renderers, guide section/subscription containers, direct RHS watch-card proof, and remaining channel-row coverage remain unextracted. |
| Comment continuations | `YT_MAIN_NEXT.json`, `YT_MAIN_NEXT_RESPONSE_COMMENT.json` | Append/reload/replace continuation classification, comment-only keyword reconstruction, global-vs-comment keyword boundary, and `commentsHeaderRenderer` no-hide policy. `YT_MAIN_NEXT_RESPONSE_COMMENT.json` is partially extracted for one append continuation response proving that visible `commentThreadRenderer` removal and `frameworkUpdates.entityBatchUpdate.commentEntityPayload` filtering are separate authority surfaces today. `YT_MAIN_NEXT.json` is partially extracted for one reload continuation response proving header/body slot classification, modern `commentViewModel` wrapper removal under `hideAllComments`, continuation-item preservation, and modern payload keyword pass-through. |
| Shorts / reels | `reel_item_watch?prettyPrint=False.JSON` | One active `reelPlayerOverlayRenderer` owner fragment is committed. Still missing reel/Shorts feed lockup, video-to-channel map provenance, watch-owner confidence, and negative/nonmatching sibling proof without relying on broad DOM fallback. |
| YouTube Kids | `yt_kids_latest.json`, `ytkids_browse?alt=json.json` | Kids browse/search renderer drift, public web route proof, and separation between extension JSON filtering proof and native app Kids WebView layout proof. `yt_kids_latest.json` is partially extracted for two adjacent public-web `compactVideoRenderer` siblings proving owner-extension harvest, matching-owner blocklist removal, whitelist allow/no-match behavior, and sibling preservation. `ytkids_browse?alt=json.json` is partially extracted from its parseable browse fragment while still malformed as direct JSON, proving compact-video blocklist/whitelist behavior, owner-rail pass-through, and map side effects. |
| YouTube Music DOM/player | `YTM-DOM.html`, `YTM-WATCH PLAYER.html`, `ytm_browse?prettyPrint=false.json`, `YTM-LOGS.txt` | Music DOM selector guardrails, YTM browse no-cross-surface regression proof, Music watch/player surface proof, bottom-sheet menu identity proof, and no-rule work budgets. `YTM-DOM.html` is partially extracted for one search video card proving canonical owner link, video ID, native menu, and quick-block anchor can coexist in a YTM DOM card, plus one post card proving backstage post header/action-menu boundaries. `YTM-WATCH PLAYER.html` is partially extracted for one rendered mobile watch/player DOM fixture proving the raw page is already FilterTube-mutated and includes player shell selectors, a related hidden row, one selected hidden playlist row, one visible sibling, and one nonselected hidden sibling. `ytm_browse?prettyPrint=false.json` is partially extracted for two adjacent `channelListItemRenderer` rows proving pass-through in blocklist and whitelist modes while channel-map side effects still fire. `YTM-LOGS.txt` is partially extracted for a log-derived playlist card/bottom-sheet pair proving visible `@KillTony` owner evidence can coexist with an injected `@JerryRigEverything`/`UCWFKCr40YwOZQx8FHU_ZqqQ` block item, so YTM bottom-sheet menu identity remains gated. Whitelist/pass-through watch-player behavior, no-playback side-effect proof, browse disabled/no-work budgets, route-scoped negative policy, and clean trigger-card/menu-key authority remain incomplete. |
| Collaboration / playlist / posts | `collab.html`, `collab_on_homepage.html`, `playlist.html`, `playlist.json`, `DOMs.html`, `YTM-DOM.html`, `watchpage.json`, `post_opt1_logs.txt` | Home collaboration roster confidence, Mix/radio avatar-stack false-positive proof, post menu insertion/quick-block boundaries, playlist JSON creator identity, and selected-row no-hide behavior from JSON plus DOM. `collab.html` is partially extracted for an already-mutated search card with a resolved four-channel collaborator roster, pending block marker, avatar-stack, native menu, and dialog `/channel/UC...` links. `collab_on_homepage.html` is partially extracted for an avatar-stack DOM card that proves display names/handles can exist while collaborator UC IDs are blank. `playlist.json` is partially extracted for a `compactRadioRenderer` Mix/radio card that proves playlist/video IDs and display-only YouTube byline are not creator channel identity. `playlist.html` is partially extracted for selected playlist-row DOM and for rendered desktop player end-screen DOM, but the player fixture is already-mutated playlist-route evidence and not clean Main watch DOM wall proof. `DOMs.html` is partially extracted as a mixed already-mutated Main DOM fixture and cannot satisfy clean post/community insertion proof. `watchpage.json` is partially extracted for modern embedded `postRenderer` JSON pass-through and channel-map side effects. `YTM-DOM.html` is partially extracted for one post/backstage action-menu fixture; the missing `post_opt1_logs.txt` and absent clean Main post fixture still leave post behavior incomplete. |
| Historical scratch | `WHITELIST_background.js`, `WHITELIST_content.js`, `reset37.txt`, `stash.txt`, `cher.md`, `import_channels.txt`, `extracted_watch_paths.txt` | Historical comparison only unless a future audit extracts a precise migration or whitelist regression fixture. |

## Required Traceability Gates

Before changing JSON filtering, DOM fallback selectors, endpoint routing, or
message/identity behavior, each new fixture extraction should provide:

```text
raw source capture
minimal committed fixture path
renderer or DOM selector path
surface and route
settings mode: disabled | blocklist | whitelist | Kids | YTM
expected decision: pass-through | hide | preserve shell | metadata-only | harvest-only
side effects: map write | stats write | DOM rerun | observer/timer | network fetch
negative fixture: non-matching sibling content remains visible
```

Future fixture names that should exist before behavior patches:

```text
capture_traceability_main_watch_end_screen_dom_wall
capture_traceability_main_next_compact_autoplay_renderer
capture_traceability_main_search_no_rule_real_capture_pass_through
capture_traceability_main_guide_no_rule_real_capture_pass_through
capture_traceability_comment_continuation_append_reload_replace
capture_traceability_reel_item_owner_identity
capture_traceability_kids_browse_public_web_renderer_drift
capture_traceability_ytm_dom_selector_guardrails
capture_traceability_collab_homepage_avatar_stack_false_positive
capture_traceability_post_menu_insertion_boundaries
capture_traceability_playlist_json_creator_identity
```

This traceability layer keeps fixture extraction incremental without losing the
larger audit requirement: every risky renderer/selector/path from the corpus
needs an explicit proof row before product behavior changes rely on it.

Playlist player end-screen DOM classification addendum: `docs/audit/FILTERTUBE_PLAYLIST_PLAYER_ENDSCREEN_DOM_CLASSIFICATION_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/playlist-player-endscreen-dom-classification-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html` pin that rendered desktop player end-screen DOM exists in `playlist.html`, but the source is an already-mutated playlist capture with 106 `filtertube-hidden` tokens, 53 `data-filtertube-hidden` tokens, 2 `aria-selected=true` tokens, and 0 `compactAutoplayRenderer` tokens; it is not clean Main watch DOM wall proof. The active gate still requires clean Main watch blocklist, whitelist, disabled/no-work, fullscreen, sibling-visible, no synthetic click, and no playback side-effect proof before player end-screen DOM optimization or JSON-first authority changes.

Compact autoplay raw corpus census addendum: `docs/audit/FILTERTUBE_COMPACT_AUTOPLAY_RAW_CORPUS_CENSUS_CURRENT_BEHAVIOR_2026-05-23.md` and `tests/runtime/compact-autoplay-raw-corpus-census-current-behavior.test.mjs` pin that current ignored raw evidence mentions `compactAutoplayRenderer` only in historical text notes and not in any raw JSON or HTML capture; raw JSON/HTML captures: 0, committed compact autoplay fixtures: 0. A real capture is still required before compact autoplay renderer support, player autoplay optimization, or JSON-first authority changes.

YTM compact playlist creator authority boundary addendum: `docs/audit/FILTERTUBE_YTM_COMPACT_PLAYLIST_CREATOR_AUTHORITY_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json` pin that canonical creator-looking fields are present in a real `YTM.json` compact playlist, but `compactPlaylistRenderer` remains unsupported/direct-gap and not first-class JSON filter authority. Blocklist title/channel rules, whitelist nonmatch, whitelist match, and `hidePlaylistCards` preserve the row while channel-map side effects still fire; promotion remains gated before JSON-first compact playlist optimization changes.

Playlist panel header Mix creator addendum: `docs/audit/FILTERTUBE_PLAYLIST_PANEL_HEADER_MIX_CREATOR_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/playlist-panel-header-mix-creator-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/playlist-panel-header-mix-dom.html` pin that the first `playlist.html` Mix header is real DOM evidence but not creator channel identity proof. The header publisher is `Mixes are playlists YouTube makes for you`, it has `playlist-type="RDUc"`, and it has no `/channel/`, `/@`, `data-filtertube-channel-id`, selected-row state, or hidden markers. `playlist-selected-row.html` remains display-only byline proof, and `playlist.json` player metadata remains current-video metadata, not playlist header authority. A real playlist creator fixture is still required before JSON-first playlist creator filtering or playlist-owner optimization changes.

Playlist JSON player metadata boundary addendum: `docs/audit/FILTERTUBE_PLAYLIST_JSON_PLAYER_METADATA_BOUNDARY_CURRENT_BEHAVIOR_2026-05-23.md`, `tests/runtime/playlist-json-player-metadata-boundary-current-behavior.test.mjs`, and `tests/runtime/fixtures/captures/playlist-json-player-metadata.json` pin that `playlist.json` is a prose-prefaced mixed capture: fragment 0 is a generated Mix `compactRadioRenderer`, while fragment 1 is `ytInitialPlayerResponse` current-video metadata for `Pkh8UtuejGw`/`ShawnMendesVEVO`. The metadata fragment is current-video metadata, not playlist creator authority and not creator channel identity proof for the playlist; the playlist creator fixture remains required before JSON-first playlist creator filtering or playlist-owner optimization changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this capture fixture traceability surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, fixture promotion, raw-corpus extraction,
whitelist behavior changes, or selector/renderer authority changes.
