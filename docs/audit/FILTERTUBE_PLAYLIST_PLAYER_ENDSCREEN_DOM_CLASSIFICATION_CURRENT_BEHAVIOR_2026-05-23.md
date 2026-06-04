# FilterTube Playlist Player Endscreen DOM Classification Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, DOM selector patch, JSON filter patch,
playlist behavior patch, whitelist patch, or player/end-screen behavior patch.

This slice widens the Main watch DOM-wall audit to the current ignored capture
corpus. It pins that rendered desktop player end-screen DOM exists in
`playlist.html`, while the Main watch/next raw captures still do not contain a
rendered player end-screen DOM wall. The `playlist.html` evidence is useful, but
it is not clean Main watch DOM wall proof: it is a playlist-route capture and
the same raw file is already-mutated by FilterTube playlist-row markers.

Short verdict: rendered desktop player end-screen DOM exists in `playlist.html`,
but it is not clean Main watch DOM wall proof.

The paired verifier is
`tests/runtime/playlist-player-endscreen-dom-classification-current-behavior.test.mjs`.
The reduced fixture is
`tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html`.

## Raw Source Metadata

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `playlist.html` | 24055 | 2905258 | `62d5819d489a417c49c0dfe1384a8efb5a2ab85146a00207dd135a87b93e877d` |

## Raw Token Counts

```text
movie_player tokens: 1
ytp-endscreen-content tokens: 1
ytp-ce-element tokens: 6
ytp-fullscreen-grid-stills-container tokens: 1
ytp-modern-videowall-still tokens: 216
ytp-videowall-still tokens: 0
ytp-ce-video tokens: 3
ytp-ce-playlist tokens: 5
ytp-ce-channel tokens: 5
autonav-endscreen tokens: 20
filtertube-hidden tokens: 106
data-filtertube-hidden tokens: 53
aria-selected=true tokens: 2
compactAutoplayRenderer tokens: 0
```

As an exact audit summary, the raw file has 106 `filtertube-hidden` tokens,
53 `data-filtertube-hidden` tokens, 2 `aria-selected=true` tokens, and
0 `compactAutoplayRenderer` tokens.

## Reduced Fixture

| Fixture | Lines | Bytes | SHA-256 | Source |
| --- | ---: | ---: | --- | --- |
| `tests/runtime/fixtures/captures/playlist-player-endscreen-dom.html` | 58 | 3170 | `1d17cdbe9577fe99842bc202572da9c544f0362438804b6e0d0ab24a427ab357` | Reduced from `playlist.html` lines `2740..2884` and `3298..3310`. |

The reduced fixture preserves the route-relevant player DOM selectors and card
labels:

```text
#movie_player
.ytp-autonav-endscreen-countdown-overlay
.ytp-endscreen-content
.ytp-ce-channel
.ytp-ce-playlist
.ytp-ce-video
.ytp-fullscreen-grid-stills-container
.ytp-modern-videowall-still
keshaVEVO
Winter Feels
Ke$ha - Your Love Is My Drug
Tron Legacy - Daft Punk - The Suite 18 minutes
```

The reduced fixture intentionally does not carry the unrelated already-mutated
playlist-row markers from the raw file. Those markers still matter to the
classification because they prove the source is not a clean pre-mutation capture:

```text
filtertube-hidden
data-filtertube-hidden
aria-selected=true
```

## Corpus Classification

The desktop Main watch/next raw sources still have no rendered player end-screen
DOM selector coverage:

```text
YT_MAIN_WATCH.html
YT_MAIN.json
YT_MAIN_NEXT.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE2.json
YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json
get_watch?prettyPrint=false.json
watchpage.json
```

Those files remain embedded JSON, endpoint JSON, comments JSON, post JSON, or
metadata evidence. `playlist.html` is the currently reduced desktop rendered
player end-screen DOM evidence, but it is playlist-route proof and an
already-mutated playlist capture. It cannot prove that Main watch player
videowall DOM filtering hides a matching end-screen card while preserving a
nonmatching sibling.

## Current Verdict

This slice improves the DOM selector audit by promoting a real desktop player
end-screen DOM source into a reduced fixture. It still keeps the implementation
gate closed:

- It is not clean Main watch DOM wall proof.
- It does not prove blocklist or whitelist player-card decisions.
- It does not prove sibling-visible behavior for player end-screen cards.
- It does not prove disabled/no-work behavior.
- It does not prove fullscreen player-grid behavior under current runtime.
- It does not prove no playback side-effect, no synthetic click, or no playlist
  navigation side-effect.

## Non-Completion Boundary

The audit still needs a clean rendered Main watch player overlay fixture with
the player videowall/card DOM present and without pre-existing FilterTube
mutation state. That future fixture must cover blocklist, whitelist,
disabled/no-work, fullscreen, sibling-visible, no synthetic click, no playback
side-effect, and no unrelated metadata-hide behavior before any optimization or
behavior change relies on player end-screen DOM behavior.

The following future authority symbols remain absent from product runtime
source today:

```text
playlistPlayerEndscreenDomClassificationContract
playlistPlayerEndscreenDomDecisionReport
playlistPlayerEndscreenCleanCaptureGate
playlistPlayerEndscreenSiblingVisibleReport
playlistPlayerEndscreenWhitelistModeReport
playlistPlayerEndscreenNoPlaybackSideEffectReport
mainWatchRenderedDomWallCoverageGate
```

## Validation

```text
node --test tests/runtime/playlist-player-endscreen-dom-classification-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
