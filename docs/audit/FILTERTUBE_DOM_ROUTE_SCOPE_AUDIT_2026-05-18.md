# FilterTube DOM Route Scope Audit - 2026-05-18

Status: current-behavior audit. This is not an implementation patch.

This slice documents how DOM selector families are scoped today across YouTube
desktop, mobile YouTube, YouTube Music-style mobile renderers, and YouTube Kids
DOM surfaces. It should be read with:

- `docs/json_paths_encyclopedia.md`
- `docs/youtube_renderer_inventory.md`
- `docs/audit/FILTERTUBE_SELECTOR_LIFECYCLE_INVENTORY_2026-05-17.md`
- ignored root capture files such as `YT_MAIN.json`, `YTM.json`,
  `YT_KIDS.json`, `playlist.html`, `DOMs.html`, and collaborator/watch captures

The ignored root captures are audit evidence only. They are intentionally kept
out of release source and should be reduced into minimal committed fixtures
before a behavior change relies on them.

## Current Selector Flow

```text
manifest content scripts
        |
        v
global selector constants
  VIDEO_CARD_SELECTORS / QUICK_BLOCK_CARD_SELECTORS
        |
        +--> extraction and identity stamps
        +--> DOM fallback scan and hide/restore
        +--> quick-block host/anchor/hide target
        +--> native menu and fallback menu action surfaces
        +--> prefetch/whitelist-pending lifecycle

route/surface gates exist locally, but not from one selector authority:
  - Kids/recycled-node identity guard in dom_extractors
  - mobile watch-next gate in quick-block
  - native overlay quiet gate in fallback menu and DOM fallback scheduling
  - list-mode/action gates in primary menu injection
  - special `/feed/channels` cleanup in DOM fallback
```

## Findings

| Area | Current behavior | Risk | Required proof before change |
| --- | --- | --- | --- |
| Global video card selector | `VIDEO_CARD_SELECTORS` mixes `ytd-*`, `ytm-*`, and `ytk-*` renderers in one global selector string. | A route fix for one surface can increase scans or false targets on another surface. | Add a selector registry keyed by surface, route, and action. |
| Global quick-block selector | `QUICK_BLOCK_CARD_SELECTORS` also mixes desktop, mobile, Shorts, playlists, channels, radio/Mix, and Kids cards. | Quick-block lifecycle can wake broadly even when only one surface needs affordances. | Gate setup and scans through compiled rule/action state plus route. |
| Kids/recycled node safety | `ensureVideoIdForCard()` treats Kids and recycled high-risk tags as unsafe for fast stamped-video returns and clears stale FilterTube identity markers. | Removing this guard can poison mappings and hide unrelated recycled cards. | Any selector refactor must preserve stale marker cleanup fixtures. |
| DOM fallback scan | `applyDOMFallback()` uses the global selector after the active-work gate and has a route-specific cleanup for `/feed/channels`, but no route registry for home/search/watch/playlist/Kids/mobile. | Active but route-irrelevant filters can still scan many card families. | Add route budget fixtures for no-rule, search, watch, playlist, Kids, and mobile surfaces. |
| Fallback menu gate split | Primary dropdown injection exits for whitelist mode and disabled block-menu settings. Fallback menu scan/button/row paths do not share that gate. | Block affordances can be created from a secondary path when UI state says they should not exist. | One action gate for primary dropdown, fallback button, fallback rows, quick block, and native app overlays. |
| Quick-block route gate split | Quick-block has a focused mobile watch-next gate and overlay/search gates, but host and hide-target resolution remain broad shared selectors. | The same resolver can be correct for cards but too broad for watch, Shorts, playlist, or Kids contexts. | Add per-route host/hide target fixtures before changing selector breadth. |
| Playlist/Mix identity safety | Playlist rows without explicit author links clear stale channel metadata; Mix cards clear collaborator metadata before menu injection. | These are important anti-false-block guards and should not be removed during cleanup. | Preserve playlist/Mix identity guards with fixture-backed tests. |
| Broad watch/playlist hide candidates | Selected playlist-row handling and members-only badge hosts include watch-level containers. | Non-matching content or watch shells can be hidden when a parent is selected instead of the exact card. | Convert broad hide candidates to explicit card-level targets or policy-backed whole-container hides. |

## Current Logic Map

```text
dom_extractors.js
  VIDEO_CARD_SELECTORS
    -> findVideoCardElement()
    -> ensureVideoIdForCard()
         -> Kids/recycled-node stale cleanup

dom_fallback.js
  hasActiveDOMFallbackWork()
    -> applyDOMFallback()
         -> /feed/channels cleanup
         -> document.querySelectorAll(VIDEO_CARD_SELECTORS)
         -> selected playlist row handling
         -> members-only badge host hides
         -> one-time playlist/media guards

block_channel.js
  QUICK_BLOCK_CARD_SELECTORS
    -> isQuickBlockEnabled()
    -> setupQuickBlockObserver()
         -> listeners/observer/interval
         -> resolveQuickBlockHost()
         -> resolveQuickBlockHideTarget()

content_bridge.js
  injectFilterTubeMenuItem()
    -> whitelist/showBlockMenuItem gate
    -> Mix collaborator metadata cleanup
    -> playlist stale identity cleanup via extraction

  ensureFallbackMenuButtons()
    -> fallback button scan
    -> fallback button click
    -> fallback row block action
    -> native overlay quiet gate only
```

## Future Rule

Every selector family should have an explicit owner record:

```text
selectorFamily = {
  surface: "main-desktop" | "main-mobile" | "kids" | "ytm" | "unknown",
  route: "home" | "search" | "watch" | "playlist" | "shorts" | "comments" | "kids-browse" | "kids-watch",
  action: "extract" | "hide" | "quick-block" | "menu" | "prefetch" | "whitelist-pending",
  target: "card" | "row" | "shelf" | "watch-shell" | "comment" | "channel",
  activeGate: "compiledRuleState + actionGate + routeGate",
  falseHideBoundary: "exact card unless whole-container policy is fixture-backed",
  teardownOwner: "page-runtime lifecycle registry"
}
```

Do not optimize by deleting broad selectors until the replacement has:

1. a renderer fixture from `docs/json_paths_encyclopedia.md` or root captures,
2. a DOM fixture from `docs/youtube_renderer_inventory.md` or root captures,
3. a no-rule/no-action fixture proving it does not wake in empty installs,
4. a false-hide fixture proving non-matching siblings remain visible,
5. a route fixture proving watch/search/home/Kids/mobile behavior stays scoped.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
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
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
