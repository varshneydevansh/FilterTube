# FilterTube DOM Hide Side-Effect Audit - 2026-05-18

Status: audit-only current-behavior proof. This file does not change product
behavior.

This slice covers the visual hide/restore layer. It matters because a wrong
hide decision is not only visual: it can update stats, alter inline styles,
pause media, mark stale identity, hide parent shelves, and affect later DOM
recycling decisions.

## Hide Authority Map

```text
JSON/filter/settings decision
        |
        v
DOM fallback / menu / quick-block / enrichment path
        |
        +--> shared toggleVisibility()
        |       + class filtertube-hidden
        |       + data-filtertube-hidden
        |       + inline display:none!important
        |       + stats record/increment/decrement unless skipStats
        |       + handleMediaPlayback()
        |
        +--> direct style/display/class writes
                + class filtertube-hidden
                + data-filtertube-hidden
                + no shared stats/media/restore contract
                + often extra reason attrs such as members-only or enrichment
```

## Current Hide Surfaces

| Surface | Current source | Side effects | Current risk |
| --- | --- | --- | --- |
| Shared `toggleVisibility()` | `js/content/dom_helpers.js:67` | Adds/removes `filtertube-hidden`, writes/removes `data-filtertube-hidden`, writes/removes inline display, updates tracker/stats unless `skipStats`, and calls `handleMediaPlayback()` on hide and restore. | One wrong hide decision affects stats and playback state, not just CSS. |
| Shelf/container cleanup | `js/content/dom_helpers.js:154` | Adds `filtertube-hidden-shelf` when all tracked children are hidden, or when a container previously had children and later has none. | Broad or stale child selectors can collapse a shelf/container after unrelated DOM recycling. |
| Current watch owner block | `js/content/dom_fallback.js:783` | Can pause the current video, hide selected playlist row with `skipStats`, auto-click the next allowed playlist link, and retry DOM fallback. | This is powerful but sensitive: a false owner match can change playback/navigation. |
| Members-only CSS and JS fallback | `js/content/dom_fallback.js:1174`, `js/content/dom_fallback.js:2172` | CSS uses broad `:has()` selectors including watch containers; JS fallback directly hides hosts and shelves using inline display. | Can hide watch-page containers or whole shelves instead of only the matching card. |
| Playlist enrichment hide | `js/content_bridge.js:8356` | Directly hides enriched playlist targets and marks `data-filtertube-hidden-by-playlist-enrichment`. | Bypasses shared `toggleVisibility()` stats/media/restore path. |
| Optimistic menu hide | `js/content_bridge.js:12044` | Directly hides clicked targets before persistence completes; custom restore stores only a subset of previous state. | Failure rollback can diverge from shared restore behavior. |
| Immediate comment/card hide | `js/content_bridge.js:13101`, `js/content_bridge.js:13105` | Directly hides comment or clicked content target after a block action. | Bypasses shared hide reason/stat/media contract. |
| DOM recycled-card cleanup | `js/content/dom_extractors.js:109` | Clears stale `data-filtertube-*` identity/hide state when a card receives a new video ID. | This is necessary, but it proves stale hidden classes can survive without explicit cleanup. |

## Direct Hide Count Baseline

Current direct `display:none` writes outside the shared helper:

| File | Direct display-none writes | Shared helper refs |
| --- | ---: | ---: |
| `js/content_bridge.js` | 11 | 3 |
| `js/content/dom_fallback.js` | 11 | 55 |
| `js/content/dom_helpers.js` | 1 | 1 |

The direct writes are not automatically wrong; several are intentional
optimistic or broad-control paths. The risk is that they do not all report the
same structured hide reason, stat decision, media decision, and restore
contract.

## Required Future Contract

Every visual hide should eventually report:

```text
hide source
  -> feature key
  -> rule/list mode
  -> route/surface
  -> target type
  -> exact target selector family
  -> broad parent? yes/no
  -> stats affected? yes/no
  -> media affected? yes/no
  -> restore owner
```

Recommended next fixtures:

| Fixture | Required proof |
| --- | --- |
| `dom_hide_shared_reason_contract` | Every shared hide has a structured source/reason and deterministic stats/media policy. |
| `dom_direct_hide_inventory` | Every direct display-none write is either migrated to shared hide authority or explicitly classified. |
| `dom_container_mixed_children_restore` | A shelf with mixed visible/hidden/recycled children does not collapse incorrectly. |
| `dom_current_watch_owner_no_selected_row_hide_without_policy` | Current-watch owner enforcement cannot hide the selected playlist row unless product policy confirms it. |
| `dom_members_only_no_watch_primary_hide` | Members-only fallback cannot hide `ytd-watch-flexy` or primary watch metadata unless explicitly intended. |

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
