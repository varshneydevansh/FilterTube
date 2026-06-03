# FilterTube Main Watch HTML Endscreen Shape Classification Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, selector patch, fixture extraction patch,
JSON filter patch, whitelist patch, or player/end-screen behavior patch.

This slice classifies the ignored raw `YT_MAIN_WATCH.html` capture before using
it for optimization decisions. The capture is useful Main watch evidence, but
it does not contain a rendered player end-screen DOM wall. It contains embedded
`ytInitialData` objects with player overlay JSON, playlist panel JSON, and
Shorts shelf JSON.

## Raw Capture Metadata

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `YT_MAIN_WATCH.html` | 69613 | 7873780 | `3d6de64dc55e211790c1b555d90420fb6bdb47104cb7c38cb903a3dbc966160c` |

## Raw Token Counts

```text
var ytInitialData assignments: 2
var ytInitialPlayerResponse assignments: 2
rootElementId movie_player tokens: 2
endScreenVideoRenderer tokens: 21
watchNextEndScreenRenderer tokens: 4
playerOverlayRenderer tokens: 4
playlistPanelVideoRenderer tokens: 27
compactAutoplayRenderer tokens: 0
shortsLockupViewModel tokens: 2
player DOM end-screen selector tokens: 0
FilterTube marker tokens: 0
```

The absent player DOM selector tokens are:

```text
ytp-endscreen-content
ytp-ce-element
ytp-fullscreen-grid-stills-container
ytp-videowall-still
ytp-ce-video
ytp-ce-playlist
ytp-ce-channel
autonav-endscreen
data-filtertube
filtertube-
```

## Parsed Embedded Shapes

The capture has two parseable `ytInitialData` assignments:

| Embedded object | String span | UTF-8 bytes | Parsed shape | Current classification |
| --- | ---: | ---: | --- | --- |
| `ytInitialData[0]` | `920557..3631119` | 2714517 | `playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer` with 7 traversed `endScreenVideoRenderer` rows and 5 `endScreenPlaylistRenderer` rows. | Player overlay JSON proof, not DOM wall proof. |
| `ytInitialData[1]` | `4505651..7857979` | 3356005 | `contents.twoColumnWatchNextResults.playlist.playlist.contents[*].playlistPanelVideoRenderer` with 26 traversed playlist-panel rows, plus `playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer` with 12 traversed `endScreenVideoRenderer` rows and one `shortsLockupViewModel`. | Watch-next JSON proof, playlist-panel JSON proof, Shorts shelf JSON proof, not DOM wall proof. |

Both `ytInitialPlayerResponse` assignments parse as player metadata and contain
zero traversed `endScreenVideoRenderer` or `playlistPanelVideoRenderer` keys.

## Product Behavior Boundary

Current product source already explains the split:

| Surface | Product owner today | Current behavior |
| --- | --- | --- |
| JSON `endScreenVideoRenderer` | `js/filter_logic.js` | Direct renderer rules map `endScreenVideoRenderer` to `BASE_VIDEO_RULES`; nested traversal also knows this key. |
| JSON `compactAutoplayRenderer` | none | The raw capture has no `compactAutoplayRenderer`, and the product rule table has no direct renderer entry for it. |
| Player DOM videowall | `js/content/dom_fallback.js` CSS | `hideEndscreenVideowall` emits broad `#movie_player` selectors, but this raw capture has no matching rendered DOM subtree. |
| Player DOM end cards | `js/content/dom_fallback.js` CSS | `hideEndscreenCards` emits broad `.ytp-ce-element` CSS, but this raw capture has no matching rendered DOM subtree. |
| FilterTube inserted controls | none in this raw capture | The raw capture has no `data-filtertube` or `filtertube-` markers. |

## Current Verdict

`YT_MAIN_WATCH.html` should be treated as embedded JSON shape evidence, not as a
Main watch DOM wall fixture. It can support watch-next JSON classification for
player overlays, playlist panels, and Shorts shelves. It cannot prove that a
blocked player videowall card is hidden while a nonmatching end-screen card
stays visible.

## Non-Completion Boundary

This slice does not close Main watch/player end-screen DOM coverage. The audit
still needs a clean rendered player overlay fixture that contains real DOM
targets such as:

```text
#movie_player .ytp-endscreen-content
#movie_player .ytp-fullscreen-grid-stills-container
#movie_player .ytp-ce-element
.ytp-videowall-still
```

That future DOM fixture still needs blocklist, whitelist, disabled/no-work,
fullscreen, sibling-visible, no synthetic click, no playback transition, and no
unrelated metadata-hide proof before any optimization or behavior change relies
on player end-screen DOM behavior.

The following future authority symbols remain absent from product runtime
source today:

```text
mainWatchHtmlEndscreenShapeClassificationContract
mainWatchRenderedEndscreenDomWallFixtureGate
mainWatchPlayerOverlayJsonDomParityReport
mainWatchEndscreenDomSiblingVisibleReport
mainWatchEndscreenDomWhitelistModeReport
mainWatchEndscreenDomNoPlaybackSideEffectReport
mainWatchEndscreenDomOptimizationBudget
```

## Validation

```text
node --test tests/runtime/main-watch-html-endscreen-shape-classification-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
