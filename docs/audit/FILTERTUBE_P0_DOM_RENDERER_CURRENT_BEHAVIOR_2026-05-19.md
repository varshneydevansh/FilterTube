# FilterTube P0 DOM / Renderer Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice ties together two risk families that must be fixed together:

- DOM target authority: which element is scanned, gets a menu, gets hidden, or
  stays visible.
- JSON renderer contract authority: which renderer is directly filtered,
  passes through, or depends on DOM fallback.

The purpose is to stop future fixes from addressing only one symptom, such as a
missing watch-card renderer, while leaving broad DOM selectors, post menu gaps,
playlist row false hides, or raw capture traceability unproven.

## Current Verdict

The P0 DOM/renderer boundary is not green.

Current evidence proves useful working baselines, but also proves incomplete
authority:

- The global card selector still mixes Main, mobile, Kids, YTM, watch-card,
  playlist, channel, Shorts, and Kids tags in one selector family.
- Native dropdown targeting includes post renderers, but fallback 3-dot menu
  scanning does not.
- Fallback playlist menu buttons and rows have weaker list-mode and
  `showBlockMenuItem` gating than the normal dropdown path.
- Selected playlist rows are detectable, but current-watch owner enforcement
  can still hide the selected playlist row.
- Direct `watchCardRHPanelVideoRenderer` and `horizontalCardListRenderer`
  search-refinement children still pass through matching keyword/channel rules.
- Legacy `backstagePostRenderer` and `commentThreadRenderer` remain working
  baselines and must not regress.
- Extracted capture fixtures exist for selected rows, YTM compact playlists,
  YTM end-screen videos, Kids compact videos, collaboration dialog/show-sheet
  renderers, and comment threads; Main watch/end-screen, compact autoplay,
  post-menu, playlist JSON creator identity, and several direct watch-card
  families remain unextracted.

## Runnable Fixtures

The current proof lives in:

- `tests/runtime/p0-dom-renderer-current-behavior.test.mjs`
- Existing lower-level proofs in:
  - `tests/runtime/dom-target-source-current-behavior.test.mjs`
  - `tests/runtime/dom-route-scope-current-behavior.test.mjs`
  - `tests/runtime/renderer-authority-gap-current-behavior.test.mjs`
  - `tests/runtime/extracted-capture-current-behavior.test.mjs`
  - `tests/runtime/filter-engine-current-behavior.test.mjs`

Fixture names in this slice:

```text
dom_renderer_contract_documents_current_behavior_and_future_gate
dom_renderer_global_card_selector_has_no_single_target_authority
dom_renderer_post_menu_runtime_target_is_split_between_native_and_fallback
dom_renderer_fallback_playlist_menu_uses_weaker_action_gate_than_normal_menu
dom_renderer_selected_playlist_row_can_be_hidden_by_current_watch_owner_block
dom_renderer_watch_card_rhs_panel_video_gap_is_current_behavior
dom_renderer_horizontal_card_search_refinement_gap_is_current_behavior
dom_renderer_legacy_backstage_post_positive_baseline_is_current_behavior
dom_renderer_comment_thread_hide_all_positive_baseline_is_current_behavior
dom_renderer_extracted_compact_playlist_gap_is_capture_backed
dom_renderer_endscreen_json_and_dom_capture_split_is_current_behavior
dom_renderer_raw_capture_sources_remain_fixture_only
```

## Future Contract

Behavior changes in this area need a shared contract with these fields:

```text
domRendererAuthority.ownerId
domRendererAuthority.surface
domRendererAuthority.route
domRendererAuthority.action
domRendererAuthority.targetSelector
domRendererAuthority.rendererType
domRendererAuthority.settingsMode
domRendererAuthority.identityConfidence
domRendererAuthority.hideWriter
domRendererAuthority.restoreOwner
domRendererAuthority.captureFixture
domRendererAuthority.negativeSiblingVisibleFixture
```

The future implementation should prove:

- exact card target selection before hiding;
- no primary player/watch shell hiding without explicit policy;
- post menu insertion parity between normal and fallback paths;
- playlist selected rows are preserved or intentionally handled through a
  documented current-watch policy;
- JSON renderer additions have blocklist, whitelist, identity-confidence, and
  false-hide fixtures;
- raw captures from the root ignored corpus become only minimal committed
  fixtures, never runtime source or release inputs.

## ASCII Flow

```text
YouTube JSON renderer
        |
        +--> direct FILTER_RULES match? ---- yes ----> JSON remove/keep decision
        |                                      |
        |                                      v
        |                              needs block/allow/false-hide fixture
        |
        +--> no direct rule -------------------------> DOM fallback or leak
                                                       |
                                                       v
YouTube DOM card selector ----> target resolver ----> hide/menu action
        |                          |
        |                          v
        |                  must prove exact card, route, surface,
        |                  selected-row/watch-shell sibling safety
        v
raw captures/docs are evidence maps, not runtime authority
```

## Current Blockers Before Fixes

- No `domRendererAuthority` or `selectorAuthority` implementation exists in
  product source.
- Normal menu and fallback menu gates are not equivalent.
- Renderer expansion is not safe until every new rule has at least one positive
  and one negative sibling-visible fixture.
- Main watch/end-screen DOM wall and compact autoplay evidence still need
  minimal extracted fixtures from ignored root captures.
- Post insertion and playlist JSON creator identity still need extracted
  fixture proof before changing selector or renderer behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
