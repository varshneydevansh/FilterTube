# FilterTube YTM Watch Player Selected Row Side Effect Boundary - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, whitelist patch, selected-row policy patch,
or playback/navigation patch.

## Scope

This slice narrows the `YTM-WATCH PLAYER.html` watch/player proof to the
selected/current-row side-effect boundary. The previous YTM watch/player DOM
slice proved that the rendered mobile surface has a selected hidden playlist
row. This slice pins the current product source paths that can turn selected or
hidden playlist-row state into playback pause, synthetic next/previous clicks,
alternate playlist-link clicks, collapsed-panel opening, and fallback reprocess
timers.

## Fixture Facts

```text
raw source: YTM-WATCH PLAYER.html
raw sha256: d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3
raw aria-selected=true tokens: 8
raw data-filtertube-hidden=true tokens: 5
raw data-filtertube-blocked-state=confirmed tokens: 1
raw html5-main-video tokens: 1
reduced fixture: tests/runtime/fixtures/captures/ytm-watch-player-dom.html
reduced fixture playlist rows: 3
reduced fixture selected row video id: NLDFEkIvcbc
reduced fixture selected row channel id: UCfg5XmOVjJ4yoeE0XkqmGAQ
reduced fixture visible sibling video id: 75NRE2KB8jc
reduced fixture hidden sibling video id: BRycGIKZzpQ
```

## Current Side Effect Owners

| Owner | Current behavior pinned by this slice |
| --- | --- |
| Selected-row detector | `isSelectedPlaylistPanelRow()` admits Main desktop rows, YTM playlist panel rows, `aria-selected=true`, `aria-current=true`, `data-selected=true`, generic selected classes, and one YTM selected class token. |
| Current-watch owner block | `enforceCurrentWatchOwnerBlock()` is skipped in whitelist mode today, but in blocklist mode it can pause the media element, hide the selected playlist row with `skipStats`, click an alternate allowed playlist link, open a collapsed YTM playlist panel, retry DOM fallback, click the player next button, or hide the watch shell. |
| Manual playlist guard | The capture-phase click listener can intercept `.ytp-next-button` / `.ytp-prev-button`, prevent default behavior, pause the video, and click another playlist link when the immediate target row is hidden. |
| Autoplay-ended guard | The capture-phase `ended` listener can click `.ytp-next-button` when the immediate next playlist item is hidden. |
| Selected-row scan branch | The main card loop comment says never hide the selected row, but explicit block markers or active matching block rules can set `__filtertubeLastPlaylistSkipTs` and schedule `.ytp-next-button:not([disabled])` clicking in blocklist mode. |
| Hidden-selected-row retry | The late skip block can detect an already hidden selected row, pause and reset the video, remember `lastSelectedVideoId`, and click a preferred or fallback playlist link. |

## Optimization Boundary

This proof does not mean the current behavior is product-correct. It means the
side-effect surface is now explicit enough that optimizing recent whitelist
changes must not accidentally inherit blocklist-only selected-row behavior.

Before a whitelist or JSON-first optimization changes this surface, the future
proof must separate:

```text
ytmWatchPlayerSelectedRowPlaybackPolicy
ytmWatchPlayerNoPlaybackSideEffectReport
ytmWatchPlayerPlaylistSkipDecisionReport
ytmWatchPlayerSelectedRowModeMatrix
ytmWatchPlayerAutoplayGuardBudget
ytmWatchPlayerSyntheticNavigationBudget
ytmWatchPlayerCollapsedPanelBudget
ytmWatchPlayerSelectedRowRestoreReport
```

None of those authority symbols exists in product runtime source today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
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
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
