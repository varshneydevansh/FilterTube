# FilterTube P0 Watch / Player Current Behavior - 2026-05-19

Status: proof-only current-behavior slice. This is not an implementation patch.

Purpose: convert the P0 watch/player control authority family into runnable
proof before any change touches watch-page filtering, comments, end screens,
playlist panels, watch rails, player endpoints, fullscreen behavior, or
watch-specific DOM selectors.

Future authority name:

```text
watchSurfaceControlAuthority.report({
  profileId,
  surface,
  route,
  playerState,
  activeControls,
  endpointPolicy,
  domSelectorOwners,
  jsonRendererOwners,
  blocklistOnlyControls,
  whitelistSafeControls,
  cacheDependencyKeys,
  reprocessReason,
  fullscreenPausePolicy
})
```

## Current Finding

Watch/player behavior is split across UI catalog controls, shared settings,
background compilation, background storage invalidation, content-script refresh
lists, seed endpoint interception, JSON renderer rules, DOM fallback CSS/JS
selectors, comment fallback, playlist identity recovery, and native/fullscreen
state hints.

The existing audit already documents the source surface in
`docs/audit/FILTERTUBE_WATCH_PLAYER_CONTROL_AUTHORITY_AUDIT_2026-05-18.md`. This file
adds the P0 fixture layer that blocks behavior changes until watch/player
contracts are explicit and testable.

## P0 Fixture Status

| Fixture | Current behavior pinned | Runnable proof | Future flip condition |
| --- | --- | --- | --- |
| `watch_controls_background_invalidation_covers_all_compiled_keys` | Background compiles watch/player flags but background storage invalidation omits those direct keys. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Compile dependencies and invalidation keys match, or every DOM-only key is explicitly owned by `watchSurfaceControlAuthority`. |
| `watch_controls_content_refresh_is_derived_from_background_schema` | Content bridge compensates with a broader watch/player refresh list that is not derived from a shared schema. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Content refresh is generated from the same watch/player schema as background compile/invalidation. |
| `watch_next_no_rule_pass_through_without_json_rewrite` | `/youtubei/v1/next` is intercepted, parsed, and normally processed through the engine unless a local comment rewrite branch catches it first. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | No-rule `/next` passes through without JSON parse/rewrite unless a route-scoped active watch rule exists. |
| `watch_player_no_rule_metadata_only_without_recommendation_mutation` | `/youtubei/v1/player` is in the mutation-capable endpoint list and can go through `processWithEngine`. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Player responses are metadata-only or pass-through unless a specific player-safe policy says otherwise. |
| `watch_comments_hide_all_uses_comment_continuation_rewrite_only_for_comments` | Comment continuation rewrite exists, but it is a local `/next` branch and only detects append continuation shapes. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Comment hiding classifies append, reload, and replace continuation shapes without touching non-comment watch rails. |
| `watch_comments_keyword_filter_does_not_hide_non_comment_watch_scaffolding` | Comments have JSON, seed, and DOM fallback owners with no shared watch-scaffolding boundary report. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Comment keyword/channel filtering proves non-comment watch metadata, rails, player, and playlist scaffolding remain visible. |
| `watch_sidebar_toggle_is_route_scoped_to_watch` | `hideVideoSidebar`/`hideRecommended` CSS is watch-shaped, but the DOM active gate is a global boolean gate. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Sidebar/recommendation controls carry an explicit route-scoped watch authority decision and no-work counters outside watch. |
| `watch_playlist_panel_toggle_does_not_disable_playlist_card_identity_fixtures` | Playlist panel hiding, selected-row guards, playlist identity recovery, and fallback menu identity are separate owners. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Hiding playlist panels cannot disable playlist card identity, selected-row protection, quick/menu identity recovery, or video map enrichment fixtures. |
| `watch_endscreen_videowall_json_and_dom_have_separate_fixtures` | JSON `endScreenVideoRenderer` and DOM `#movie_player` end-screen selectors exist, but they are not connected by one report. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | End-screen JSON renderers, player videowall DOM, card overlays, compact autoplay, and watch-card variants each have positive and negative fixtures. |
| `watch_endscreen_cards_do_not_depend_on_broad_movie_player_hide` | End-screen card hiding uses broad `#movie_player .ytp-*` selectors. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | End-screen card policy is tied to explicit player overlay owners, not broad movie-player hiding alone. |
| `watch_whitelist_mode_keeps_watch_metadata_and_rail_scaffolding_visible` | Whitelist has a watch-rail shelf exception and some video-info guards, but no unified whitelist-safe watch report. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Whitelist watch mode proves metadata, channel row, description, player, comments scaffold, and rails remain visible unless explicitly fail-closed. |
| `watch_fullscreen_pauses_non_player_dom_work` | Native fullscreen hints exist in content bridge, but DOM fallback/quick work has no shared fullscreen pause owner. | `tests/runtime/p0-watch-player-current-behavior.test.mjs` | Fullscreen, mini-player, and native app overlays can pause non-player DOM work without dropping watch/player controls. |

## Current Verdict

```text
P0 watch/player slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

## Required Next Proof

Before behavior changes, add watch/player positive and negative fixtures for:

- `/next` no-rule pass-through and active watch recommendation mutation.
- `/player` metadata-only behavior and end-screen metadata extraction.
- comment continuation append, reload, and replace shapes.
- JSON `endScreenVideoRenderer`, player videowall DOM, and card overlays.
- watch rail whitelist scaffolding and non-comment sibling visibility.
- playlist selected-row, playlist-panel identity, and watch/Mix identity repair.
- fullscreen and native-overlay pause budgets for non-player DOM work.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
