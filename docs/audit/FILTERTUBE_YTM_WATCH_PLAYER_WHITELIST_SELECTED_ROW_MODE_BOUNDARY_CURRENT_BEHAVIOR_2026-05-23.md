# FilterTube YTM Watch Player Whitelist Selected Row Mode Boundary - Current Behavior

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.

This is not an implementation patch, whitelist policy patch, JSON-first patch,
or selected-row playback fix. It pins the current whitelist/list-mode behavior
for the YTM watch/player selected playlist row so optimization work does not
accidentally treat DOM selected-row behavior and JSON playlist-panel behavior as
equivalent.

## Evidence

| Evidence | Current pinned value |
| --- | --- |
| Raw capture | `YTM-WATCH PLAYER.html` |
| Raw SHA-256 | `d0600cc4b7bb5684b532f825d689d32a5c7b24b37c6da6477d0f4dc637303ea3` |
| Reduced fixture | `tests/runtime/fixtures/captures/ytm-watch-player-dom.html` |
| Selected YTM playlist row | `NLDFEkIvcbc` / `UCfg5XmOVjJ4yoeE0XkqmGAQ` |
| Visible playlist sibling | `75NRE2KB8jc` / `UCm9VWKAFz0aXpuEHPHMae7w` |
| DOM selected-row branch | 98 lines, 6145 bytes |
| JSON whitelist branch | 106 lines, 5392 bytes |

## Current Mode Boundary

| Surface | Current behavior |
| --- | --- |
| DOM selected playlist row | The generic selected-row branch applies to YTM rows. When `shouldHide` is true, the branch only schedules a next-button click outside whitelist mode. In whitelist mode it sets `shouldHide = false` for the selected row and removes only a subset of hidden/pending markers. |
| DOM current-watch owner block | `enforceCurrentWatchOwnerBlock()` returns immediately in whitelist mode, so its pause, selected-row hide, alternate-link click, retry, next-button click, and shell-hide effects are blocklist-only today. |
| DOM watch metadata restore | The current whitelist restore block targets desktop `ytd-watch-metadata` selectors and does not name `ytm-watch` or `ytm-watch-player-controls`. YTM selected-row behavior is inherited from the generic playlist-row branch instead of a YTM-specific whitelist contract. |
| JSON playlist-panel rows | `playlistPanelVideoRenderer` uses `BASE_VIDEO_RULES` and has no selected/current-row state. A nonmatching selected-like playlist row can be removed in whitelist mode while a matching sibling remains. |
| JSON/DOM parity | JSON can remove a nonmatching playlist row globally; DOM can keep a selected nonmatching row visible in whitelist mode. This is current behavior, not a safe optimization contract. |

## Optimization Risk

The recent whitelist path is not sufficient proof for optimizing this surface.
The current runtime has two different authorities:

- DOM has selected-row protection that suppresses whitelist hiding for the
  currently selected playlist row.
- JSON has renderer filtering that does not know which playlist row is currently
  playing.

This can become either a leak risk or a false-hide/playback-transition risk if
optimization treats JSON playlist rows, DOM playlist rows, and current playback
as one policy without an explicit mode matrix.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this whitelist surface can support runtime
optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, whitelist behavior, metric collectors,
artifact creation, native sync, release package changes, or public claims.

## Still Missing

Before changing whitelist or JSON-first behavior here, the implementation needs:

- `ytmWatchPlayerWhitelistSelectedRowPolicy`
- `ytmWatchPlayerSelectedRowJsonDomParityReport`
- `ytmWatchPlayerWhitelistCurrentVideoDecisionReport`
- `ytmWatchPlayerWhitelistPlaybackSideEffectReport`
- `ytmWatchPlayerWhitelistSelectedRowFixture`
- `ytmWatchPlayerWhitelistSelectedRowMetricArtifact`
- `ytmWatchPlayerWhitelistSelectedRowLeakReport`
- `ytmWatchPlayerWhitelistSelectedRowOptimizationGate`

Until those exist, this slice keeps the implementation gate closed for YTM
watch/player whitelist selected-row optimization.
