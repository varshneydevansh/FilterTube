# FilterTube Content Control DOM Style Selector Matrix Current Behavior - 2026-05-22

Status: audit-only current-behavior proof slice.

Runtime behavior is unchanged. This is not an implementation patch,
optimization patch, selector patch, DOM fallback patch, JSON filter patch,
style cleanup patch, or settings patch.

This slice pins the selector/effect shape of `ensureContentControlStyles()`.
It extends the content-control active-work matrix by proving which catalog
controls actually write CSS selectors, how many selector rows each branch
owns, which rows depend on `:has()`, which controls are indirectly affected by
`hideVideoInfo`, and why DOM style selectors remain a separate proof boundary
before JSON-first promotion or no-work optimization.

## Boundary Source Files

content-control DOM style selector matrix source files: 2

content-control DOM style selector source/effect blocks: 27

catalog groups: 7

catalog controls: 29

controls that can affect DOM style output: 26

direct style selector branches: 25

catalog controls without DOM style branch: 3

catalog controls resolved through DOM style runtime alias: 1

unconditional mobile open-app selector rows: 5

control-gated selector rows: 111

total selector rows emitted by the style writer when all branches are active: 116

`:has()` selector token count in style writer: 46

`:not(:has(...))` selector token count in style writer: 5

runtime content-control DOM style selector matrix fixtures: 6

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |
| `js/content_controls_catalog.js` | 222 | 7822 | `780b35c8aa33161ccd6e489b0843f01d805620409715a50aaca0a0bf6cff7e10` |

## Pinned Source Counts

ensureContentControlStyles block lines: 345

ensureContentControlStyles block bytes: 12583

unconditional open-app style block lines: 9

unconditional open-app style block bytes: 309

rules.push callsites in style writer: 26

display none declarations in style writer: 26

style textContent assignment callsites in style writer: 1

supportsHasSelector tokens in style writer: 3

hideInfoMaster tokens in style writer: 6

`listMode !== 'whitelist'` tokens in style writer: 4

## Selector Matrix

Rows count selector lines after comments and CSS braces are removed. The
subscription row includes the dynamic `supportsHasSelector` selector because it
is emitted when the browser supports `:has()`.

| Control branch | Selector rows | `:has()` tokens | `:not(:has(...))` tokens | Selector/effect boundary |
| --- | ---: | ---: | ---: | --- |
| unconditional open app cleanup | 5 | 0 | 0 | Mobile app-link cleanup always writes style selectors, independent of catalog settings. |
| `hideHomeFeed` | 6 | 0 | 0 | Route data attributes plus desktop home renderer selectors. |
| `hideSponsoredCards` | 9 | 0 | 0 | Ad, promoted, companion, and engagement-panel selectors. |
| `hideWatchPlaylistPanel` | 3 | 0 | 0 | Desktop and mobile playlist panel selectors. |
| `hidePlaylistCards` | 7 | 8 | 4 | Playlist renderers plus lockup/shelf `:has()` selectors with Mix/radio exclusions. |
| `hideMixPlaylists` | 9 | 4 | 0 | Radio renderers, lockup/rich-item `start_radio=1`, and player videowall Mix marker. |
| `hideMembersOnly` | 31 | 31 | 0 | Broad card, shelf, playlist, watch, badge, aria-label, and `UUMO` selectors. |
| `hideVideoSidebar` | 1 | 0 | 0 | Watch secondary column selector. |
| `hideRecommended` | 2 | 0 | 0 | Watch related/results selectors. |
| `hideLiveChat` | 2 | 0 | 0 | Desktop live chat frame and container selectors. |
| `hideAllComments` | 10 | 0 | 0 | Desktop, mobile, and route-data comment container selectors. |
| `hideVideoButtonsBar` | 2 | 0 | 0 | Watch action/menu selectors, also affected by `hideVideoInfo`. |
| `hideAskButton` | 2 | 0 | 0 | Ask link/button selectors, also affected by `hideVideoInfo`. |
| `hideVideoChannelRow` | 2 | 0 | 0 | Watch owner/top-row selectors, also affected by `hideVideoInfo`. |
| `hideVideoDescription` | 2 | 0 | 0 | Watch description and legacy expander selectors, also affected by `hideVideoInfo`. |
| `hideMerchTicketsOffers` | 4 | 0 | 0 | Ticket, merch, offer, and clarify module selectors, also affected by `hideVideoInfo`. |
| `hideEndscreenVideowall` | 2 | 0 | 0 | Player endscreen content/grid selectors. |
| `hideEndscreenCards` | 1 | 0 | 0 | Player card overlay selector. |
| `disableAutoplay` | 2 | 0 | 0 | Player autonav toggle and autonav endscreen selectors. |
| `disableAnnotations` | 2 | 0 | 0 | Legacy annotation and branding overlay selectors. |
| `hideTopHeader` | 1 | 0 | 0 | Masthead container selector. |
| `hideNotificationBell` | 2 | 0 | 0 | Old and shape-based notification button selectors. |
| `hideExploreTrending` | 3 | 0 | 0 | Explore/trending nav and browse page selectors. |
| `hideMoreFromYouTube` | 1 | 0 | 0 | Positional guide-section selector. |
| `hideSubscriptions` | 3 | 3 | 1 | Subscription nav, subscriptions browse page, and dynamic `:has()` guide-section selector. |
| `hideSearchShelves` | 2 | 0 | 0 | Search primary shelf and horizontal card-list selectors. |

## Current Behavior Boundaries

- `hideShorts`, `showQuickBlockButton`, and `showBlockMenuItem` are catalog
  controls without direct DOM style branches in `ensureContentControlStyles()`.
- Catalog `hideComments` is represented in this style writer by the runtime
  alias branch `hideAllComments`.
- `hideVideoInfo` is not a standalone selector branch. It drives five child
  branches through `hideInfoMaster`: buttons bar, Ask button, channel row,
  description, and merch/tickets/offers.
- `hideAskButton` and `hideMerchTicketsOffers` are not directly guarded by
  `listMode !== 'whitelist'`; the other `hideVideoInfo` child branches are.
- `disableAutoplay` and `disableAnnotations` are style branches but are not
  DOM active-gate booleans in `hasActiveDOMFallbackWork()`.
- Playlist, Mix, members-only, and subscription style selectors depend on
  browser `:has()` support; selector support is not a route/surface authority.
- The style writer uses one shared `#filtertube-content-controls-style` node and
  rewrites `style.textContent` from local settings. There is no per-control
  selector owner, restore report, no-work counter, or sibling-visible fixture.

## Runtime Proof

The runtime guard proves:

1. The catalog still has 29 controls in 7 groups.
2. `ensureContentControlStyles()` still has 345 lines and 12583 bytes.
3. The style writer has 26 `rules.push` callsites, 26 `display:none`
   declarations, and one `style.textContent` assignment.
4. The selector matrix still has 5 unconditional open-app rows plus 111
   control-gated selector rows.
5. The current `:has()` and `:not(:has(...))` token counts remain 46 and 5.
6. Runtime source still lacks a first-class style selector matrix authority.

## Non-Completion Boundary

Content-control DOM style selectors still need selector ownership, route/surface
scope, target-shape reports, `:has()` support policy, list-mode effect reports,
restore proof, negative sibling-visible fixtures, no-work budgets, metric
artifacts, and JSON/DOM parity decisions before selector cleanup, fallback
pruning, or first-class JSON promotion can proceed.

No `contentControlDomStyleSelectorMatrix`,
`contentControlDomStyleSelectorManifest`,
`contentControlStyleSelectorOwnerReport`,
`contentControlStyleSelectorEffectDecision`,
`contentControlStyleRestoreProof`,
`contentControlStyleSiblingFixtureReport`,
`contentControlHasSelectorSupportPolicy`,
`contentControlStyleNoWorkBudget`,
`contentControlStyleMetricArtifact`, or
`contentControlStyleFirstClassJsonGate` exists in product runtime source yet.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this DOM cleanup/selector surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5744
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5744
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, DOM cleanup behavior, selector lifecycle
behavior, visibility side effects, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.
