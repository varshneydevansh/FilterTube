# FilterTube P0 Selector Authority Current Behavior - 2026-05-19

Status: current-behavior proof slice. This is not an implementation patch.

This slice converts the P0 selector authority family into runnable proof. It
exists because selector ownership is the first DOM boundary that can create
empty-install lag, broad scans, route bleed, and false hides before the rule
engine has a chance to make a precise JSON-first decision.

## Verdict

```text
P0 selector authority slice is not green.
Current behavior is proof-pinned.
Runtime behavior remains unchanged.
Implementation gate remains closed.
```

The product has useful local selector guards, but there is no central
`selectorAuthority` record that resolves surface, route, action, target kind,
list mode, active feature, and false-hide boundary before a scan runs.

## Current Authority Shape

```text
settings / route / mutation
        |
        +--> global selector strings
        |       + Main desktop cards
        |       + Main mobile / ytm-* cards
        |       + Kids ytk-* cards
        |       + playlists / radio / watch cards
        |       + channel rows / comments / Shorts
        |
        +--> feature-local selectors
        |       + DOM fallback
        |       + quick block
        |       + fallback 3-dot menu
        |       + watch controls
        |       + members / playlist / mix fallbacks
        |
        +--> local route checks after selection
                + useful but not a selector registry
                + no unified zero-work counter
                + no false-hide policy record
```

## P0 Fixture Status

| P0 fixture | Current behavior pinned here | Future green condition |
| --- | --- | --- |
| `selector_authority_global_card_selector_split_by_surface_route_action` | `VIDEO_CARD_SELECTORS` mixes `ytd-*`, `ytm-*`, `ytk-*`, watch-card, playlist, radio, channel, and Shorts hosts in one selector string. | One selector authority resolves surface, route, action, and target kind before selecting cards. |
| `selector_authority_dom_fallback_no_rule_zero_card_scan` | Empty blocklist can avoid the main card scan after the active-work gate, but stale-cleanup and lifecycle setup still have no central zero-card-scan report. | Disabled/no-rule modes prove zero card scans and only explicitly budgeted cleanup selectors. |
| `selector_authority_quick_block_disabled_zero_selector_scan` | Quick-block now has a local setup entry guard: disabled quick-block returns before styles, listeners, body observer, and scheduled sweeps. The gap is that this is still feature-local code, not a central `selectorAuthority` report. | Disabled quick block keeps zero local selector/lifecycle work and the central selector authority records the same decision with route, mode, and feature provenance. |
| `selector_authority_fallback_menu_uses_primary_menu_action_gate` | Primary menu injection checks list mode and `showBlockMenuItem`; fallback menu scanning has its own body-wide selector path. | Fallback menu uses the same primary action gate and scans only when the normal affordance is unavailable. |
| `selector_authority_watch_selectors_do_not_target_primary_player_shell_without_policy` | Watch selectors include `ytd-watch-flexy`, `ytd-watch-metadata`, `#secondary`, and player-adjacent shells without a unified watch/player selector policy. | Watch/player shell selectors require an explicit watch-surface policy before targeting primary player scaffolding. |
| `selector_authority_members_only_badge_does_not_hide_watch_shell_without_fixture` | Members-only badge fallback can choose `ytd-watch-flexy`, `ytd-watch-metadata`, or primary info as a hide host. | Members-only fixture proves badges hide only intended cards or has an explicit watch-shell policy. |
| `selector_authority_playlist_selected_row_preserves_current_watch_card` | Selected playlist rows are recognized, but current-watch owner fallback can hide/click selected rows as part of navigation recovery. | Selected current-watch row preservation is proven separately from next-row filtering and skip behavior. |
| `selector_authority_kids_selectors_have_kids_surface_gate` | Kids `ytk-*` selectors live inside the same global card selector and DOM fallback family. Some local Kids guards exist, but no central Kids surface gate owns all selectors. | Kids selectors run only under a Kids surface authority and have separate browse/watch fixtures. |
| `selector_authority_ytm_selectors_are_not_claimed_for_main_release_without_fixture` | `ytm-*` selectors are active in Main/mobile runtime selectors, while committed YTM evidence now includes DOM card/menu fragments, a watch/player DOM fixture with selected-row risk, and a JSON browse channel-list fixture, but still not a settings-mode watch/player guardrail suite. | YTM/mobile selectors have committed DOM fixtures and explicit release-surface status before broad claims. |
| `selector_authority_legacy_layout_selectors_remain_quarantined_or_loaded_explicitly` | `js/layout.js` has selector and visual side-effect density, is packaged, and is not manifest-loaded as active content runtime. | Legacy layout selectors are either explicitly quarantined by release proof or moved behind a named load owner. |
| `selector_authority_inventory_rows_require_runtime_source_or_fixture_status` | Inventory docs are evidence maps and still contain coverage language that can be mistaken for runtime proof. | Every inventory row has source-backed status, fixture-backed status, or explicit backlog status. |
| `selector_authority_raw_capture_extracts_minimal_committed_dom_fixture` | Eleven committed DOM fragments exist, including the resolved collab search-card dialog fixture and YTM logs bottom-sheet stale identity fixture, but many ignored root captures remain evidence-only. | Each selector behavior change has a minimal committed fixture extracted from the relevant ignored capture family. |

## Risk Interpretation

The important finding is not that every broad selector is wrong. Several broad
selectors are deliberately defensive against YouTube markup churn. The risk is
that selection, route ownership, feature activation, and false-hide boundaries
are split across local functions. That makes it hard to prove that an empty
install does zero page work, or that a mode/route transition cannot hide the
wrong parent shell.

## Safe Next Proof

Before changing selectors, add DOM fixtures for:

- empty blocklist and disabled modes with selector-scan counters
- quick-block disabled lifecycle with no body observer, no selector scan, and a central authority report proving the local entry guard decision
- fallback menu insertion only when primary menu action is available and needed
- members-only badge on a normal card versus watch metadata
- selected playlist row where the current watch card must remain visible
- Kids browse and Kids watch route separation
- mobile `ytm-*` card/playlist/comment/watch-player surfaces, with JSON browse channel-list proof kept separate from DOM selector proof and selected/current-row watch-player policy
- inventory rows linked to runtime source or a committed fixture
- raw capture extraction metadata for each selector change

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
