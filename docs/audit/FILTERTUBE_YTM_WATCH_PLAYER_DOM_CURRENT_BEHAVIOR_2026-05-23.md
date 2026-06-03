# FilterTube YTM Watch Player DOM Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, selector patch, whitelist patch, or YTM
optimization patch.

## Scope

This slice reduces the ignored `YTM-WATCH PLAYER.html` capture into a small
rendered-DOM fixture for the mobile watch/player surface. It is separate from
the YTM browse JSON channel-list fixture because this capture is already
FilterTube-mutated DOM, not a neutral Innertube payload.

The fixture preserves the player shell, the mobile playlist panel, one selected
hidden playlist row, one visible sibling row, one nonselected hidden playlist
row, and one hidden related item. Text labels are ASCII-reduced, while selector
tags, video IDs, channel IDs, selected state, hidden state, and `data-filtertube-*`
mutation attributes are preserved.

## Source Facts

```text
raw source: YTM-WATCH PLAYER.html
raw shape: rendered mobile watch/player DOM after FilterTube mutation
raw sha256: d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3
raw logical lines: 16412
raw newline count: 16411
raw bytes: 2279232
html5-video-player tokens: 2
movie_player tokens: 4
ytm-watch-player-controls tokens: 1
ytm-playlist-panel-renderer tokens: 1
ytm-playlist-panel-video-renderer rows: 25
ytmPlaylistPanelVideoRendererV2Host tokens: 25
ytm-video-with-context-renderer rows: 30
ytm-radio-renderer rows: 3
data-filtertube-hidden=true tokens: 5
filtertube-hidden tokens: 10
filtertube quick-block buttons: 70
data-filtertube-channel-id tokens: 42
data-filtertube-observing=true tokens: 6
raw ytmusic-player tokens: 0
raw ytm-player tokens: 0
fixture: tests/runtime/fixtures/captures/ytm-watch-player-dom.html
```

## Reduced DOM Rows

| Surface | Raw start line | Video ID | Channel ID | State |
| --- | ---: | --- | --- | --- |
| Player shell | 5166 | not card-scoped | not card-scoped | `#movie_player`, `.html5-video-player`, `ytm-watch-player-controls` |
| Related item | 13777 | `BRycGIKZzpQ` | unresolved in selected fragment | hidden `ytm-video-with-context-renderer` |
| Playlist selected row | 15127 | `NLDFEkIvcbc` | `UCfg5XmOVjJ4yoeE0XkqmGAQ` | `aria-selected=true`, `filtertube-hidden`, confirmed block markers |
| Playlist visible sibling | 15188 | `75NRE2KB8jc` | `UCm9VWKAFz0aXpuEHPHMae7w` | processed but visible |
| Playlist hidden sibling | 15495 | `BRycGIKZzpQ` | `UCP6D2gsLQkUcRYE2dy_d2qQ` | nonselected hidden row |

## Current Runtime Boundary

The current product runtime splits this surface across multiple owners:

| Owner | Current behavior pinned by this slice |
| --- | --- |
| `js/content/dom_fallback.js` CSS | `hideWatchPlaylistPanel` hides `ytd-playlist-panel-renderer`, `ytm-playlist-panel-renderer`, and `ytm-playlist-panel-renderer-v2`. End-screen controls use broad `#movie_player` selectors. |
| `js/content/dom_fallback.js` DOM filtering | YTM playlist rows are scan targets. Selected rows have special logic; explicit selected-row block state can route into a synthetic next-button path instead of a simple pass/restore decision. |
| `js/content_bridge.js` quick block | YTM playlist panel rows, compact media item title/byline selectors, and YTM watch-next ancestry are first-class quick-block extraction surfaces today. |
| JSON filter engine | This DOM capture does not prove a JSON route contract for YTM watch/player rows. The YTM browse channel-list JSON fixture remains a separate proof slice. |

## Risk Before Optimization

| Risk class | Current boundary |
| --- | --- |
| Reliability | The same user-visible watch surface is split across DOM CSS, DOM scanner, quick-block identity extraction, and JSON traversal. |
| False-hide/leak | The raw capture has a selected playlist row with `aria-selected=true` and `data-filtertube-hidden=true`; optimization needs a selected/current-row policy before broad whitelist or blocklist promotion. |
| Performance | The raw page has 25 playlist rows, 30 related video rows, 70 quick-block buttons, and broad observer-marked containers. Reprocessing must have a route and mutation budget. |
| Code burden | YTM watch/player policy currently requires reading DOM selector code, quick-block extraction code, raw DOM fixtures, and JSON browse fixtures together. |

## Future Proof Required

Before optimizing the recent whitelist work against YTM watch/player DOM, add a
policy and metrics layer that names:

```text
ytmWatchPlayerDomContract
ytmWatchPlayerSelectedRowDecisionReport
ytmWatchPlayerSiblingPreservationFixture
ytmWatchPlayerWhitelistModeReport
ytmWatchPlayerNoPlaybackSideEffectReport
ytmWatchPlayerObserverBudget
ytmWatchPlayerJsonDomParityReport
ytmWatchPlayerJsonFirstGate
```

None of those authority symbols exists in product runtime source today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
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
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
