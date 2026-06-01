# FilterTube Fixture Candidate Matrix - 2026-05-17

This is the fixture backlog required before behavior changes. It turns the audit evidence into executable proof targets. A row is not complete until there is a runnable fixture, expected result, and counter/trace proving the relevant side effects.

Related evidence:

- `docs/audit/FILTERTUBE_RENDERER_CONTRACT_COVERAGE_2026-05-17.md`
- `docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md`
- `docs/audit/FILTERTUBE_LIFECYCLE_TEARDOWN_AUDIT_2026-05-17.md`
- `docs/audit/FILTERTUBE_SETTINGS_MUTATION_AUTHORITY_2026-05-17.md`
- `docs/audit/FILTERTUBE_ENDPOINT_AUTHORITY_INVENTORY_2026-05-17.md`
- `docs/audit/FILTERTUBE_CAPTURE_CORPUS_INVENTORY_2026-05-17.md`
- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`

## Fixture Contract

Every fixture should state:

```text
name
surface
route
input payload or DOM fixture
settings fixture
expected decision
expected mutation count
expected hidden/restored nodes
expected storage writes
expected background revision
expected network/map side effects
```

Minimum assertion shape:

```text
decision = {
  route,
  surface,
  endpoint,
  rendererType,
  listMode,
  activeWorkReasons,
  hideReason,
  identityConfidence,
  sideEffects
}
```

## P0 Runtime No-Work Fixtures

| Fixture | Settings | Surface | Expected proof |
| --- | --- | --- | --- |
| `empty_blocklist_desktop_home_no_work` | enabled, blocklist, no keywords, no channels, no content/category rules, quick/menu off | Desktop home `/` | No JSON rewrite, no DOM hide, no quick sweep, no fallback menu insertion, no map write. |
| `empty_blocklist_mobile_home_no_work` | same as above | Mobile home / mobile WebView | Same as desktop; proves mobile home does not pay full parse/rewrite simply because it is mobile. |
| `empty_blocklist_watch_no_player_mutation` | same as above | Watch page `/watch` | `/player` and `/next` do not mutate payloads; player response is pass-through or metadata-only by explicit decision. |
| `empty_blocklist_search_no_false_hide` | same as above | Search `/results` | Search results remain visible; no pending whitelist hide; no fallback scan except bounded cleanup. |
| `disabled_extension_no_mutation` | enabled=false with existing rules | Any YouTube route | No visual hides or JSON mutations; any harvest-only work must be explicitly justified or disabled. |

## P0 Whitelist / Blocklist Mode Fixtures

| Fixture | Settings | Payload/surface | Expected proof |
| --- | --- | --- | --- |
| `empty_whitelist_explicit_fail_closed_or_prevented` | whitelist mode, no allow rules | Home/search/watch | Either activation is prevented in UI or runtime emits explicit `block:no_whitelist_rules` with no ambiguous false-hide reason. |
| `whitelist_one_channel_exact_uc_allows` | whitelist UC channel | `videoRenderer`, `gridVideoRenderer`, `lockupViewModel`, Shorts, watch rail | Matching UC content remains visible across JSON and DOM surfaces. |
| `whitelist_one_channel_handle_allows` | whitelist handle | same | Matching handle content remains visible even when UC is missing but canonical handle exists. |
| `whitelist_unresolved_identity_pending_then_restore` | whitelist channel with unresolved card identity | home/search/playlist/watch rail DOM | Pending hide must be reversible after identity resolves; non-matching cards stay hidden only with final reason. |
| `blocklist_one_keyword_only_matching_results_hide` | one keyword | search/home/watch rail | Only title/description/comment surfaces containing the keyword hide; unrelated search results stay visible. |
| `blocklist_one_channel_name_only_weak_match_policy` | one channel with weak display-name-only card | search/home | Runtime emits weak identity reason and follows explicit policy; no accidental broad hide. |

## P0 Endpoint Fixtures

| Fixture | Endpoint | Route | Expected proof |
| --- | --- | --- | --- |
| `seed_search_no_rule_pass_through` | `/youtubei/v1/search` | `/results` | No response replacement unless active work exists. |
| `seed_browse_desktop_home_no_rule_pass_through` | `/youtubei/v1/browse` | `/` desktop | No JSON rewrite; optional harvest is separately counted and justified. |
| `seed_browse_mobile_home_no_rule_pass_through` | `/youtubei/v1/browse` | `/` mobile | Same as desktop; current audit flagged mobile as a likely gap. |
| `seed_next_watch_no_rule_pass_through` | `/youtubei/v1/next` | `/watch` | No full recursive filter when no active watch-side rule exists. |
| `seed_player_metadata_only` | `/youtubei/v1/player` | `/watch` | No recursive renderer removal from player payload; mutation count must be zero. |
| `seed_guide_no_rule_pass_through` | `/youtubei/v1/guide` | any | No parse/rewrite unless a guide/sidebar rule is active. |
| `seed_comments_hide_all_comments_continuation` | `/youtubei/v1/next` comment continuation | `/watch` | Only comment continuation is rewritten; no unrelated watch-next payload mutation. |

## P0 Renderer Contract Fixtures

| Fixture | Renderer/ViewModel | Why it is required |
| --- | --- | --- |
| `grid_video_renderer_duplicate_rule_fields` | `gridVideoRenderer` | Proves later duplicate rule does or does not lose `BASE_VIDEO_RULES` fields such as description/duration/date/view count. |
| `compact_autoplay_renderer_owner` | `compactAutoplayRenderer` | Documented missing autoplay module; likely watch/up-next leak. |
| `compact_playlist_renderer_creator_identity` | `compactPlaylistRenderer` | Documented paths exist but no direct rule; playlist cards can leak or remain unfilterable. |
| `watch_card_rich_header_direct` | `watchCardRichHeaderRenderer` | Current coverage may only work nested under `universalWatchCardRenderer`. |
| `watch_card_hero_video_direct` | `watchCardHeroVideoRenderer` | Watch-card hero card missing direct rule. |
| `watch_card_rhs_panel_video` | `watchCardRHPanelVideoRenderer` | New right-hand watch panel entries need title/channel fixture. |
| `horizontal_card_search_refinement` | `horizontalCardListRenderer` + `searchRefinementCardRenderer` | Covered by current-behavior fixtures: search refinement cards and horizontal refinement rails currently pass through keyword/channel rules. |
| `compact_channel_search` | `compactChannelRenderer` | Covered by current-behavior fixture: compact channel cards currently pass through channel rules despite documented UC/handle identity paths. |
| `post_renderer_author_text_endpoint` | `postRenderer` | Community/channel posts may use `postRenderer` rather than backstage variants. |
| `shared_post_renderer_original_author` | `sharedPostRenderer` | Shared post needs sharer and original author policy. |
| `expandable_metadata_ai_summary` | `expandableMetadataRenderer` | AI summary text can contain filter keywords but has no direct rule. |
| `shorts_lockup_owner_paths` | `shortsLockupViewModel` | Existing rule is title/videoId-heavy; owner UC/handle paths need proof. |
| `reel_item_channel_bar_owner` | `reelItemRenderer` | Reel channel-bar owner identity needs fixture-backed extraction. |
| `playlist_panel_renderer_header` | `playlistPanelRenderer` | Playlist panel header/title/channel needs explicit structural/direct decision. |
| `channel_metadata_renderer_about_text` | `channelMetadataRenderer` | Channel about/description text can be keyword-sensitive. |

## P0 DOM Selector Fixtures

| Fixture | DOM selectors / surface | Expected proof |
| --- | --- | --- |
| `dom_video_card_exact_target` | `VIDEO_CARD_SELECTORS` family | Hiding target is the card/container, not title text, thumbnail image, or parent section unless intended. |
| `dom_watch_rail_no_primary_video_hide` | watch rail selectors | Watch primary metadata/player is never hidden by rail fallback selectors. |
| `dom_playlist_selected_row_no_hide` | playlist panel selected row | Current selected/playing row is not hidden by pending whitelist or fallback logic. |
| `dom_shorts_shelf_hide_scope` | Shorts shelf/card selectors | Hiding a blocked Short does not collapse unrelated shelf controls unless shelf-level policy is active. |
| `dom_post_menu_target` | post/community menu selectors | 3-dot action attaches to the post/card owner, not unrelated menu rows. |
| `dom_youtube_kids_passive_block_sync` | Kids native menu/toast selectors | Passive listener only mirrors explicit native block actions; no custom menu insertion on Kids. |

## P0 Lifecycle Fixtures

| Fixture | Lifecycle family | Expected proof |
| --- | --- | --- |
| `quick_block_disabled_zero_lifecycle_work` | quick block observer/listeners/interval | With quick button disabled, no periodic sweep, no body observer work, no injected wrappers. |
| `menu_disabled_zero_fallback_insertion` | 3-dot native/fallback menu | With menu disabled, no fallback button or native menu row insertion. |
| `native_overlay_quiet_mode_pauses_runtime` | native overlay/extension UI | DOM fallback, fallback menu, whitelist pending, and quick-block viewport work pause under native overlay. |
| `fullscreen_pauses_non_player_runtime` | fullscreen/orientation | Quick-block resize/orientation and fallback scans do not run during player fullscreen transition unless player-critical. |
| `navigation_disconnects_route_observers` | route/navigation | Route-scoped observers disconnect on `yt-navigate-finish` or re-scope without duplicates. |
| `prefetch_no_rule_no_map_write` | card prefetch observer | Empty/no-rule session does not write `videoChannelMap`/`videoMetaMap`. |

## P0 Settings / Mutation Fixtures

| Fixture | Mutation path | Expected proof |
| --- | --- | --- |
| `v3_to_v4_preserves_modes_and_whitelists` | settings migration | Legacy whitelist/blocklist modes and lists survive first load/compile. |
| `two_mutations_during_save_are_not_dropped` | state manager save queue | Two rapid mutations persist and broadcast both, or second waits for revision. |
| `set_list_mode_copy_false_does_not_clear_blocklist` | `FilterTube_SetListMode` | `copyBlocklist:false` does not merge/clear blocklist. |
| `import_subscriptions_import_only_no_mode_transfer` | dashboard import | Import-only writes whitelist entries and leaves current blocklist unchanged. |
| `filter_all_channel_keyword_derivation_is_overlay_or_explicit` | channel `filterAll` | Channel-derived keywords do not silently persist unless mutation intent says so. |
| `category_enabled_empty_is_inactive` | content/category filters | Enabled category with empty selected does not wake JSON/DOM filtering. |
| `duration_zero_not_global_hide` | duration filter | Invalid/zero thresholds do not become broad hide predicates. |
| `apply_settings_payload_cannot_override_background_revision` | `FilterTube_ApplySettings` | UI-provided settings cannot become runtime cache authority without background recompile/revision. |
| `nanah_received_settings_use_mutation_intent` | Nanah sync | Synced settings pass the same validation/mutation path as local UI/import. |

## Ignored Raw Capture Corpus

The repository root contains an ignored evidence corpus listed in `.gitignore`.
These files are not release source and should not be committed wholesale, but
they are valid inputs for fixture extraction because they were used to build
`docs/json_paths_encyclopedia.md` and `docs/youtube_renderer_inventory.md`.

Current root-level capture count:

```text
47 ignored capture entries, 46 unique paths, 45 paths present locally.
Missing historical path: post_opt1_logs.txt.
```

Important ignored capture families:

| Family | Examples | Fixture use |
| --- | --- | --- |
| YouTube Main watch/next | `YT_MAIN_WATCH.html`, `YT_MAIN_NEXT.json`, `YT_MAIN_next?prettyPrint.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json` | Watch rail, end-screen, compact autoplay, RHS watch card, playlist panel, `/next` endpoint fixtures. |
| YouTube Main watch/next/player | `YT_MAIN.json`, `YT_MAIN_WATCH.html`, `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json`, `get_watch?prettyPrint=false.json` | Watch initial JSON, player fragment, end-screen/player DOM wall, right-rail, playlist panel, compact-autoplay-if-present, and no-rule/whitelist scaffold fixtures. `YT_MAIN.json` is mixed watch initial JSON, not browse/search proof. |
| YouTube Main browse/search/guide | `guide?prettyPrint=false.json`, `strange_ytInitialData.json`, `logs.json` | Home/search/guide renderer and endpoint no-work fixtures. |
| Comments | `comments.json`, `YT_MAIN_NEXT_RESPONSE_COMMENT.json` | Comment renderer, comment continuation, hide-all, and comment keyword authority fixtures. |
| Shorts/reels | `reel_item_watch?prettyPrint=False.JSON` | Shorts/reel identity and watch-owner fixtures. |
| YouTube Kids | `YT_KIDS.json`, `yt_kids_latest.json`, `ytkids_browse?alt=json.json` | Kids route/public web fixture extraction only; runtime policy is separate from Main YT. |
| YouTube Music | `YTM.json`, `YTM-XHR.json`, `YTM-DOM.html`, `ytm_browse?prettyPrint=false.json`, `YTM-WATCH PLAYER.html` | YTM renderer parity and no-cross-surface regression fixtures. |
| Collaboration/playlist/post DOM | `collab*.html`, `collab.json`, `playlist.html`, `playlist.json`, `DOMs.html` | DOM selector target, collaborator roster, playlist selected-row, and post-menu fixtures. |
| Historical whitelist and planning scratch | `WHITELIST_background.js`, `WHITELIST_content.js`, `Docs/MOBILE_APP_UI_SPEC.md`, `docs/spa-collab-watchlist-handoff.md`, `watcher-collab-watchlist-spa-fix-plan.md`, `docs/subscribed-channels-whitelist-import-plan.md` | Historical context only; use to explain legacy decisions, not to claim current runtime correctness. |

Extraction rule:

```text
Raw captures stay ignored. Each production-facing proof should extract the
smallest representative renderer/request fragment into tests/runtime and cite
the source family here or in the runtime fixture results.
```

## Completion Rule

```text
The audit is not complete until every P0 fixture has:
  a runnable fixture file,
  a known input sample,
  an expected decision,
  side-effect counters,
  and a pass/fail result.

P1/P2 fixtures may be added after P0, but source behavior should not change
until P0 gives us a safe baseline.
```

## Runnable Coverage Started

Current runnable results are tracked in:

- `docs/audit/FILTERTUBE_RUNTIME_FIXTURE_RESULTS_2026-05-17.md`

Implemented first-pass current-behavior fixtures:

| P0 area | Fixture status |
| --- | --- |
| Runtime no-work | Empty blocklist/simple `videoRenderer` passes; disabled filtering returns original payload reference. |
| Whitelist/blocklist mode | Empty whitelist fail-closed behavior is now proven by fixture. |
| Renderer contract | Duplicate `gridVideoRenderer` description gap, missing `compactAutoplayRenderer`, `compactPlaylistRenderer`, direct watch-card subrenderer, `postRenderer`, and `expandableMetadataRenderer` rules are now proven by fixtures; direct `endScreenVideoRenderer`, `watchCardCompactVideoRenderer`, nested `universalWatchCardRenderer`, and legacy backstage post positives are also proven. |
| Renderer contract, second pass | `sharedPostRenderer`, `playlistPanelRenderer`, `channelMetadataRenderer`, `shortsLockupViewModel`, and `reelItemRenderer` now have current-behavior fixtures. Shared posts/channel metadata remain gaps; playlist panel headers are structural-only today; Shorts/reel title keywords work but owner identity is incomplete. |
| Endpoint authority | Engine endpoint-agnostic behavior is proven with a player-shaped payload; search and desktop browse skip mutation with no rules and switch to `processData` when active rules exist; disabled mode does no engine work; mobile browse, player, watch next, and guide currently still call `processData` with no rules. Endpoint substring matching, reload-style comment continuation gaps, and harvest-only map-write side effects are now fixture-proven. |
| Active predicate validation | Category enabled with empty selection and upload-date enabled with blank dates no-op at engine layer but can still wake endpoint processing on search and desktop home; duration `longer` with zero threshold is worse and currently blocks any video with a parsed duration, while `shorter`/`between` zero-threshold states no-op at engine layer. |
| DOM active predicate validation | DOM fallback wakes on raw enabled content/category flags; category metadata fetch is selected-guarded, but upload-date metadata fetch can occur before valid-date proof and duration zero-threshold logic mirrors the engine risk. |
| Lifecycle | Current lifecycle primitive counts are pinned for page-resident scripts; quick-block periodic work, fallback-menu warmup/scroll work, and DOM fallback listener no-removal paths are now proven by fixtures. |
| Settings/mutation authority | `copyBlocklist:false` UI/background mismatch, `FilterTube_ApplySettings` cache authority, and `syncKidsToMain` whitelist merging are now proven by fixtures. |
| DOM selector/targeting | Quick-block selector coverage, native dropdown comment-first targeting, fallback menu post omission, selected playlist-row current-watch hiding, clicked hide-target scoping, one-sided keyword boundary matching, and members-only broad host selectors are now proven by fixtures. |

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this fixture candidate matrix can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, fixture selection, raw-corpus extraction,
whitelist behavior changes, or selector/renderer authority changes.
