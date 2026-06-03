# FilterTube DOM Broad Hide Boundary - Current Behavior - 2026-05-19

Status: current-behavior proof only. Runtime behavior is unchanged and the
implementation gate remains closed.

This slice exists because user-visible false hides can come from a card-level
rule, a broad DOM selector, a whole-container hide, a direct inline display
writer, or stale specialized markers. The question is not only "did a keyword
match?" The audit must prove what exact DOM target was selected, whether
siblings stay visible, and whether the hide can be reversed by the same owner.

## Current Finding

FilterTube has useful broad controls, but it does not yet have a central
`broadHideBoundaryAuthority` or equivalent `hideTargetPolicy` that records:

```text
feature owner
  -> target kind: card | row | shelf | watch shell | player shell | comment
  -> selector family
  -> route/surface
  -> user setting and active rule reason
  -> hide writer
  -> restore writer
  -> negative sibling-visible fixtures
  -> selected/current item preservation rule
```

That missing authority does not mean every broad hide is wrong. It means
cleanup cannot be safely done by narrowing one selector while leaving another
writer with the same broad target.

## Proof Surfaces

| Surface | Current behavior | Risk |
| --- | --- | --- |
| Members-only CSS | `hideMembersOnly` CSS targets `ytd-watch-flexy`, `ytd-watch-metadata`, and `ytd-video-primary-info-renderer` via `:has(.yt-badge-shape--membership)`. | A membership badge in watch metadata can hide a watch shell rather than one card unless watch-shell policy says this is intentional. |
| Members-only JS fallback | The fallback chooses hosts including `ytd-watch-flexy`, `ytd-watch-metadata`, and `ytd-video-primary-info-renderer`, then can also hide the nearest shelf or horizontal list. | Firefox/no-`:has()` fallback can broaden one badge into a page/shelf hide. |
| Playlist lockup CSS | `hidePlaylistCards` CSS targets individual playlist renderers plus lockup stacks and parent `ytd-horizontal-list-renderer`/`ytd-shelf-renderer` selectors. | One playlist lockup can collapse a mixed row or shelf containing non-matching cards. |
| Playlist lockup JS fallback | The fallback hides a matching lockup and then hides its closest `ytd-shelf-renderer` and `ytd-horizontal-list-renderer`. | The direct display writer has no local sibling-visible proof and no symmetric restore block in the same branch. |
| Current watch owner enforcement | `enforceCurrentWatchOwnerBlock()` can hide the selected playlist row with `skipStats`, pause the video, click an alternate playlist link, or click the player next button. | A false owner match can become playback or navigation behavior, not only a visual hide. |
| Shelf/container cleanup | `updateContainerVisibility()` hides containers when all children are hidden or a container that previously had children now has no children. | A child false-hide or recycled-node state can collapse a parent section. |
| Stale cleanup | `clearStaleDOMFallbackVisibility()` clears several generic/specialized markers but not every specialized direct-writer marker. | Disabling or route-changing can leave a marker family outside the shared cleanup path. |

## Why This Matters

The false-hide symptom can happen even when the blocklist looks empty or a
particular card does not match a visible rule, because the actual hide target
may be a parent shelf, watch shell, selected playlist row, or stale hidden
container. This slice narrows the next implementation requirements:

1. add negative sibling-visible fixtures for mixed shelves and horizontal rows,
2. add watch-shell fixtures for members-only badges in normal cards versus
   watch metadata,
3. add selected/current playlist-row preservation fixtures,
4. add restore-owner fixtures for every direct display writer,
5. only then change broad selectors or direct hide writers.

## Boundaries

This audit does not propose runtime changes. It also does not claim that all
members-only, playlist, or shelf hides are wrong. It documents the exact places
where broad target selection needs fixture proof before behavior is changed.

## Runnable Proof

```bash
node --test tests/runtime/dom-broad-hide-boundary-current-behavior.test.mjs --test-reporter=spec
```

The test file pins these facts:

- no central broad-hide boundary authority exists today,
- members-only CSS/JS fallback can target watch shells and shelves,
- playlist card CSS/JS fallback can hide parent shelf/horizontal-list nodes,
- current-watch owner enforcement can pause/click/hide selected rows,
- container cleanup can collapse a parent from child hidden/missing state,
- stale cleanup does not enumerate every specialized marker family,
- existing P0 docs still keep this proof partial rather than green.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
