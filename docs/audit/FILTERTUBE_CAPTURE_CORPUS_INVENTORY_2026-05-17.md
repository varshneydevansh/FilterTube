# FilterTube Capture Corpus Inventory - 2026-05-17

This document records the ignored root-level capture files that support the
runtime audit. These files are evidence inputs only. They must stay out of
release packages and should not be committed wholesale; small fragments can be
extracted into committed fixtures when a renderer, endpoint, or DOM selector
needs proof.

These parent-directory HTML/JSON/TXT captures are the same local evidence pool
used to build `docs/json_paths_encyclopedia.md` and
`docs/youtube_renderer_inventory.md`. Treat those two docs as distilled indexes,
and treat the ignored captures as raw evidence to mine into minimal tests.

## Current `.gitignore` State

The root ignored capture block currently contains:

```text
47 entries
46 unique paths
45 paths present in this local workspace
1 missing historical path: post_opt1_logs.txt
```

The duplicate entry is `playlist.json`. The missing file should be treated as a
historical note unless it is reintroduced as an intentional fixture source.

## Required Evidence Families

| Family | Ignored source files | Audit use |
| --- | --- | --- |
| YouTube Main watch/next | `YT_MAIN_WATCH.html`, `YT_MAIN_NEXT.json`, `YT_MAIN_next?prettyPrint.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`, `get_watch?prettyPrint=false.json`, `watchpage.json` | Watch rail, end-screen, compact autoplay, RHS watch card, playlist panel, `/next`, and `/player` metadata/rewrite boundaries. |
| YouTube Main watch/next/player | `YT_MAIN.json`, `YT_MAIN_WATCH.html`, `YT_MAIN_NEXT.json`, `YT_MAIN_next?prettyPrint.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json`, `get_watch?prettyPrint=false.json`, `watchpage.json`, `extracted_watch_paths.txt` | Watch initial JSON, player fragments, end-screen/player DOM wall, right-rail, playlist panel, comment continuation, and no-rule/whitelist scaffold proof. `YT_MAIN.json` is now classified as mixed watch initial JSON plus later player JSON, not browse/search proof. |
| YouTube Main browse/search/guide | `guide?prettyPrint=false.json`, `strange_ytInitialData.json`, `tmp.json`, `logs.json`, `text.txt` | Empty-install route cost, search result false-hide proof, home browse no-work proof, and guide endpoint scope. |
| Comments | `comments.json`, `YT_MAIN_NEXT_RESPONSE_COMMENT.json` | `commentRenderer`, `commentThreadRenderer`, comment continuation, hide-all comments, and global-vs-comment keyword authority. |
| Shorts/reels | `reel_item_watch?prettyPrint=False.JSON` | Reel/Shorts title and owner identity extraction, plus watch-owner and channel bar gaps. |
| YouTube Kids | `YT_KIDS.json`, `yt_kids_latest.json`, `ytkids_browse?alt=json.json` | Kids public web surface fixture extraction only; Kids-native filtering policy remains app-specific. |
| YouTube Music | `YTM.json`, `YTM-XHR.json`, `YTM-DOM.html`, `ytm_browse?prettyPrint=false.json`, `YTM-WATCH PLAYER.html`, `YTM-LOGS.txt` | YTM renderer parity, no-cross-surface regressions, Music DOM selector guardrails, and Music watch/player proof. |
| Collaboration / playlist / posts | `collab.html`, `collab.json`, `collab_on_homepage.html`, `collab_in_playlist_mix.html`, `playlist.html`, `playlist.json`, `playlist.js`, `DOMs.html`, `post_opt1_logs.txt` | Collaborator roster confidence, mix/radio avatar-stack false-positive proof, selected playlist row handling, mixed already-mutated Main DOM classification, and post menu insertion gaps. |
| Whitelist historical scratch | `WHITELIST_background.js`, `WHITELIST_content.js`, `reset37.txt`, `stash.txt`, `cher.md`, `import_channels.txt`, `extracted_watch_paths.txt` | Historical comparison only. These are not runtime authority files unless a future audit extracts a specific minimal fixture. |
| Historical plans / handoffs | `Docs/MOBILE_APP_UI_SPEC.md`, `docs/spa-collab-watchlist-handoff.md`, `watcher-collab-watchlist-spa-fix-plan.md`, `docs/subscribed-channels-whitelist-import-plan.md` | Historical planning context only. These can explain why a branch of logic exists, but they are not proof that runtime behavior is correct today. |

## Current Token Probe

The local captures currently contain proof material for the following high-risk
fixture families:

| Source file | Probe tokens found locally |
| --- | --- |
| `YT_MAIN_WATCH.html` | `endScreenVideoRenderer`, `shortsLockupViewModel`, `showSheetCommand`, `showDialogCommand` |
| `YT_MAIN_NEXT.json` | `commentThreadRenderer` |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` | `videoRenderer`, `commentThreadRenderer`, `shortsLockupViewModel`, `showSheetCommand`, `showDialogCommand` |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` | follow-up watch-page continuation source for renderer drift checks |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` | follow-up watch-page continuation source for renderer drift checks |
| `comments.json` | `commentThreadRenderer` |
| `playlist.html` | `shortsLockupViewModel`, `ytd-playlist-panel-video-renderer` |
| `collab.json` | `videoRenderer`, `shortsLockupViewModel`, `showSheetCommand`, `showDialogCommand` |
| `reel_item_watch?prettyPrint=False.JSON` | `showSheetCommand` |
| `YTM.json` | `compactPlaylistRenderer`, `showSheetCommand` |
| `YTM-XHR.json` | `endScreenVideoRenderer`, `commentRenderer`, `commentThreadRenderer`, `shortsLockupViewModel`, `showSheetCommand` |
| `YT_KIDS.json` | `kidsHomeScreenRenderer`, `compactVideoRenderer`, `kidsVideoOwnerExtension` |
| `strange_ytInitialData.json` | `universalWatchCardRenderer`, `watchCardRichHeaderRenderer`, `watchCardHeroVideoRenderer`, `searchRefinementCardRenderer`, `compactChannelRenderer` |

## Extraction Rule

For each production-facing proof:

1. Keep the raw capture ignored.
2. Extract the smallest representative JSON or DOM fragment into a committed
   `tests/runtime/fixtures/...` file or inline fixture.
3. Cite the source family and renderer/selector path in the fixture result doc.
4. Assert the decision and the side effects: hidden count, mutated JSON count,
   storage/map writes, observer/listener/timer activation, and route authority.

This keeps the audit reproducible without turning multi-megabyte private capture
files into release or repository inputs.

## Extracted Committed Fragments

The first committed extraction batch lives under
`tests/runtime/fixtures/captures/`:

| Fixture file | Source capture | Renderer |
| --- | --- | --- |
| `ytm-compact-playlist-renderer.json` | `YTM.json` | `compactPlaylistRenderer` |
| `main-collab-dialog-video-renderer.json` | `collab.json` | `videoRenderer` with `showDialogCommand` collaborator roster |
| `main-doms-mutated-main-dom.html` | `DOMs.html` | mixed already-mutated Main home/search/watch DOM controls |
| `ytm-show-sheet-collab-video-with-context-renderer.json` | `YTM-XHR.json` | `videoWithContextRenderer` with `showSheetCommand` collaborator roster |
| `kids-compact-video-renderer.json` | `YT_KIDS.json` | `compactVideoRenderer` |
| `kids-latest-compact-video-owner-extension.json` | `yt_kids_latest.json` | `compactVideoRenderer` sibling pair with Kids owner extensions |
| `kids-browse-malformed-fragment-compact-video.json` | `ytkids_browse?alt=json.json` | `kidsLibraryRenderer` fragment with `kidsSlimOwnerRenderer` rail entries and `compactVideoRenderer` siblings |
| `main-search-universal-watch-card-renderer.json` | `strange_ytInitialData.json` | `universalWatchCardRenderer` search hero card |
| `main-search-compact-channel-renderer.json` | `strange_ytInitialData.json` | `compactChannelRenderer` search channel result card |
| `ytm-end-screen-video-renderer.json` | `YTM-XHR.json` | `endScreenVideoRenderer` |
| `main-watch-get-watch-playlist-end-screen.json` | `get_watch?prettyPrint=false.json` | `watchNextResponse` reduced to `playlistPanelVideoRenderer` and `endScreenVideoRenderer` sibling pairs |
| `main-watch-autoplay-video-endpoint.json` | `get_watch?prettyPrint=false.json` | watch autoplay endpoint shape with `autoplayVideo` and `nextButtonVideo` objects tied to a supported playlist-panel video |
| `main-upnext-feed-watchpage-lockup-continuation.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE.json` | late watch `watch-next-feed` continuation with `lockupViewModel` rows and Mix identity boundary |
| `main-upnext-feed-watchpage2-claim-prefaced-lockup-continuation.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json` | claim-prefaced watch `watch-next-feed` continuation with two primary decorated-avatar `lockupViewModel` video rows and no parsed collaborator roster proof |
| `main-upnext-feed-watchpage3-autoplay-previous-end-screen.json` | `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` | embedded watch `ytInitialData` with playlist-panel rows, player-overlay `endScreenVideoRenderer` rows, and `autoplayVideo`/`nextButtonVideo`/`previousButtonVideo` endpoint objects |
| `main-watchpage-embedded-post-renderer.json` | `watchpage.json` | embedded `FEwhat_to_watch` rich-grid `postRenderer` rows, reclassified as browse/feed post proof rather than watch-next proof |
| `ytm-browse-channel-list-item-renderer.json` | `ytm_browse?prettyPrint=false.json` | YTM mobile browse `FEchannels` shelf with two adjacent `channelListItemRenderer` rows |
| `main-comment-thread-renderer.json` | `comments.json` | `commentThreadRenderer` |
| `main-modern-comment-thread-renderer.json` | `YT_MAIN_next?prettyPrint.json` | `commentThreadRenderer` |
| `playlist-selected-row.html` | `playlist.html` | selected `ytd-playlist-panel-video-renderer` |
| `collab-mix-selected-row.html` | `collab_in_playlist_mix.html` | selected `ytd-playlist-panel-video-renderer` with FilterTube markers |

These fragments are intentionally small compared with the ignored raw captures
and are exercised by `tests/runtime/extracted-capture-current-behavior.test.mjs`.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this capture corpus inventory can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, capture mining, fixture promotion, raw
corpus release use, whitelist behavior changes, or selector/renderer authority
changes.
