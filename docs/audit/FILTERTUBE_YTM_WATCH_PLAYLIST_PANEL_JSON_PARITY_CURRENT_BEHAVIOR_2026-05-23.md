# FilterTube YTM Watch Playlist Panel JSON Parity - Current Behavior

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.

This is not an implementation patch, JSON renderer promotion, whitelist patch,
selected-row patch, or YTM optimization patch. It reduces the watch playlist
panel fragments in `YTM.json` so the recent YTM watch/player DOM and whitelist
work has JSON-side evidence to compare against before any first-class JSON
filter change.

## Evidence

| Evidence | Current pinned value |
| --- | --- |
| Raw capture | `YTM.json` |
| Raw shape | Mixed direct JSON fragments plus prose separators |
| Raw SHA-256 | `9eacd68076c85f2c0eb218ddafbd543d631dfc26ac6f761f4611bc7eb0991e8d` |
| Raw logical lines | 17335 |
| Raw newline count | 17334 |
| Raw bytes | 1312137 |
| Balanced top-level fragments | 6 |
| Raw `playlistPanelVideoRenderer` tokens | 4 |
| Parsed playlist-panel renderer fragments | 3 |
| Raw `videoWithContextRenderer` tokens | 38 |
| Raw `compactPlaylistRenderer` tokens | 2 |
| Raw `endScreenVideoRenderer` tokens | 0 |
| Raw `autoplayVideo` tokens | 0 |
| Raw `nextButtonVideo` tokens | 0 |
| Reduced fixture | `tests/runtime/fixtures/captures/ytm-watch-playlist-panel-json.json` |
| Reduced fixture lines | 184 |
| Reduced fixture bytes | 5282 |
| Reduced fixture SHA-256 | `4e04ab54a720cd2133625ed65eccc922a5840e1073e048788eac7497e3b46e25` |

## Reduced JSON Rows

| Fragment | Raw start line | Video ID | Channel ID | Selected |
| ---: | ---: | --- | --- | --- |
| 3 | 16070 | `1U6WY_z8Vu8` | `UC1Pwa4nFvIPbtYVLcBGDpjA` | false |
| 4 | 16284 | `xRQnJyP77tY` | `UCB0JSO6d5ysH2Mmqz5I9rIw` | false |
| 5 | 16498 | `75NRE2KB8jc` | `UCm9VWKAFz0aXpuEHPHMae7w` | false |

The reduced fixture intentionally ASCII-reduces title text but preserves the
renderer key, video IDs, channel IDs, watch endpoint, playlist ID, and selected
flags needed for current-behavior filtering proof.

## Current Runtime Behavior

With the reduced fixture wrapped under `contents[]`:

| Mode | Current result |
| --- | --- |
| No rules | All three JSON playlist rows pass through unchanged, and no harness message side effects are queued. |
| Blocklist keyword matching `Nyusha` | The `75NRE2KB8jc` row is removed; the two nonmatching sibling rows remain. |
| Blocklist channel matching `UCm9VWKAFz0aXpuEHPHMae7w` | The `75NRE2KB8jc` row is removed; the two nonmatching sibling rows remain. |
| Whitelist channel matching `UCm9VWKAFz0aXpuEHPHMae7w` | Only the `75NRE2KB8jc` row remains. |
| Empty whitelist | All three JSON playlist rows are removed. |

## JSON DOM Parity Boundary

This JSON fixture overlaps the rendered YTM watch/player DOM fixture only
partially:

- JSON fragment `75NRE2KB8jc` matches the DOM visible sibling row.
- JSON has no `selected: true` row in these fragments.
- JSON does not contain the DOM selected hidden video id `NLDFEkIvcbc`.
- The DOM fixture still proves `NLDFEkIvcbc` can be selected,
  `aria-selected=true`, `data-filtertube-hidden=true`, and confirmed blocked
  after FilterTube mutation.

That means JSON playlist-panel filtering cannot yet replace the DOM selected-row
policy for this YTM watch/player surface. It can classify and remove supported
JSON rows, but it does not prove current-video playback policy, selected-row
restore, or no-playback side effects.

## Optimization Risk

The recent whitelist work should not be optimized only against the DOM branch or
only against JSON `playlistPanelVideoRenderer` behavior. The DOM branch restores
selected rows in whitelist mode, while the JSON branch has no selected/current
row exemption and an empty whitelist removes all supported rows. Treating either
layer as complete would risk a false hide, a playback side effect, or a leaked
matching row on YTM watch/player.

## Still Missing

Before changing YTM watch/player JSON filtering, whitelist handling, or DOM
fallback behavior here, the implementation needs:

- `ytmWatchPlaylistPanelJsonContract`
- `ytmWatchPlaylistPanelJsonDomParityReport`
- `ytmWatchPlaylistPanelSelectedRowPolicy`
- `ytmWatchPlaylistPanelCurrentVideoFixture`
- `ytmWatchPlaylistPanelWhitelistParityReport`
- `ytmWatchPlaylistPanelNoPlaybackSideEffectReport`
- `ytmWatchPlaylistPanelMetricArtifact`
- `ytmWatchPlaylistPanelJsonFirstGate`

Until those exist, this slice keeps the implementation gate closed for YTM watch
playlist-panel JSON promotion.

## First Optimization Metric Collector Parity Rollout Boundary Addendum

First optimization metric collector parity rollout boundary addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_METRIC_COLLECTOR_PARITY_ROLLOUT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-metric-collector-parity-rollout-boundary-current-behavior.test.mjs`
maps this YTM JSON/DOM selected-row parity gap into first-collector parity and
rollout requirements. The addendum pins 12 collector parity rollout rows, 12
collector fixture provenance rows covered, 12 route/surface obligations covered,
2 evidence parity rollout rows covered, 8 parity and release boundary source
docs covered, 0 runtime collector parity rollout proofs approved, and 0
implementation-ready parity rollout rows. The JSON playlist-panel fixture still
cannot replace DOM selected/current-row, no-playback, native, release, or public
claim proof.

## First Optimization Parity Rollout Contract Addendum

First optimization parity rollout contract addendum:
`docs/audit/FILTERTUBE_FIRST_OPTIMIZATION_PARITY_ROLLOUT_CONTRACT_CURRENT_BEHAVIOR_2026-05-24.md`
and
`tests/runtime/first-optimization-parity-rollout-contract-current-behavior.test.mjs`
maps the YTM watch playlist-panel JSON/DOM selected-row gap into the future
`parity-rollout.json` contract without creating rollout artifacts or approving
runtime behavior. The addendum pins 12 parity rollout contract rows, 1 reserved
parity rollout path covered, 0 committed parity rollout files, 0 runtime metric
collector approvals, and 0 implementation-ready parity rollout contract rows.
YTM watch/player JSON promotion remains blocked until selected/current-row,
whitelist, no-playback, DOM, native, release, and public-claim proof exists.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
