# FilterTube Main Watch Get-Watch Playlist / End-Screen Current Behavior - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice reduces one direct watch/next capture into a committed fixture before
any watch-page JSON filtering change. It is intentionally narrow: it proves
current `playlistPanelVideoRenderer` and `endScreenVideoRenderer` behavior from
`get_watch?prettyPrint=false.json`, while preserving that other watch sources
remain unextracted.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `get_watch?prettyPrint=false.json` | Valid direct JSON array with two top-level entries; `1.watchNextResponse` contains the selected watch response. | 46,562 lines; 5,046,178 bytes; sha256 `578230df9dc00dfebc8ac0ec4cc1ec2f796abf7cf4584c9e4ece67856fdf90e0`. |
| `watchpage.json` | Markdown prelude plus `var ytInitialData = { ... };`, not direct JSON. The embedded object is `FEwhat_to_watch`, not a clean watch/next capture. | 32,116 lines; 4,572,676 bytes; sha256 `baf8a78adbbc5509c3ab50e4a26131ba294293771b89666498f34324cbd82ab3`. |
| `js/filter_logic.js` | Existing runtime rule owner; not changed in this slice. | 3,652 lines; 172,174 bytes; sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5`. |

## Reduced Fixture

`tests/runtime/fixtures/captures/main-watch-get-watch-playlist-end-screen.json`
is a 183-line, 6,073-byte reduced fixture with sha256
`bd3763ac139f55ea579b7a52cacc1a65f7883f586a64cbe65319bc43bd3c51e5`.

It carries four renderer rows:

| Renderer | Raw JSON path | Video | Channel |
| --- | --- | --- | --- |
| `playlistPanelVideoRenderer` | `1.watchNextResponse.contents.twoColumnWatchNextResults.playlist.playlist.contents.1.playlistPanelVideoRenderer` | `TUVcZfQe-Kw` | `UC-J-KZfRV8c13fOCkhXdLiQ` |
| `playlistPanelVideoRenderer` | `1.watchNextResponse.contents.twoColumnWatchNextResults.playlist.playlist.contents.2.playlistPanelVideoRenderer` | `eVli-tstM5E` | `UCPKWE1H6xhxwPlqUlKgHb_w` |
| `endScreenVideoRenderer` | `1.watchNextResponse.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.1.endScreenVideoRenderer` | `W3sBr9f0Il0` | `UCXZBlY5to9iJRM3xPyHRwng` |
| `endScreenVideoRenderer` | `1.watchNextResponse.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.2.endScreenVideoRenderer` | `NrNejxB91bA` | `UC7ZkJ5hZv6v0b-OfC2r68BA` |

## Current Runtime Result

The current JSON engine already has direct rules for both renderer types through
`BASE_VIDEO_RULES`.

Pinned behavior:

- With no active rule, the four reduced rows pass through unchanged.
- Blocklist mode removes a matching playlist-panel row by channel ID and
  preserves the nonmatching playlist sibling plus both end-screen siblings.
- Blocklist mode removes a matching end-screen row by channel ID and preserves
  the nonmatching end-screen sibling plus both playlist-panel siblings.
- Whitelist mode is global across the reduced response: allowing the playlist
  channel keeps the matching playlist row and removes both end-screen rows;
  allowing the end-screen channel keeps the matching end-screen row and removes
  both playlist rows.
- Harvest side effects still occur in no-rule mode: the fixture queues one
  `FilterTube_UpdateChannelMap` message for the handle-backed end-screen row
  and one `FilterTube_UpdateVideoChannelMap` message covering all four videos.

## Risk Boundary

This proof narrows one Main watch/next JSON extraction gap, but it does not
close watch-page readiness. Remaining watch/next proof still includes
`YT_MAIN_WATCH.html`, `YT_MAIN_NEXT.json`, `YT_MAIN_UPNEXT_FEED_WATCHPAGE*.json`,
`watchpage.json`, `compactAutoplayRenderer`, player overlay DOM wall behavior,
playlist shell preservation, selected-row policy, `/player` metadata-only
policy, and route-scoped no-work budgets.

The `watchpage.json` finding is specifically a capture-shape warning: it should
not be treated as direct JSON just because the filename ends in `.json`.

## Future Authority Fields

No product runtime symbol exists yet for:

- `mainWatchGetWatchPlaylistEndScreenContract`
- `mainWatchGetWatchFixtureAdmissionReport`
- `mainWatchPlaylistPanelDecisionReport`
- `mainWatchEndScreenDecisionReport`
- `mainWatchWhitelistFamilyScopePolicy`
- `mainWatchVideoMapSideEffectReport`
- `mainWatchRawShapeClassifier`
- `mainWatchCompactAutoplayFixtureGate`
- `mainWatchDomWallParityReport`
- `mainWatchJsonFirstOptimizationBudget`

This document and its test are audit evidence only. They do not permit renderer
expansion, selector changes, endpoint admission changes, watch DOM changes,
playlist shell mutation, end-screen mutation, or whitelist optimization changes.

## Executable Proof

```bash
node --test tests/runtime/main-watch-get-watch-playlist-end-screen-current-behavior.test.mjs
```

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
