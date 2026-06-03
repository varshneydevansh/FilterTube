# FilterTube Main Upnext Feed Watchpage3 Autoplay Previous End Screen Current Behavior - 2026-05-23

Status: release-fix evidence slice. Runtime behavior changed on 2026-05-31:
watch autoplay endpoint objects are now direct JSON decisions. This is not a
broad renderer rewrite, player-overlay rewrite, or performance patch.

This slice extracts `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` as an embedded
`ytInitialData` browser payload. The raw file is not direct JSON. It starts
with prose and then assigns `var ytInitialData = { ... }`.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `YT_MAIN_UPNEXT_FEED_WATCHPAGE3.json` | 56516 | 6000015 | `cd7bea15c5bc0b5dbac5ef78d9f8046de8153a83d4adb44ce2961c41c1062b1a` |
| `tests/runtime/fixtures/captures/main-upnext-feed-watchpage3-autoplay-previous-end-screen.json` | reduced fixture | reduced fixture | fixture-pinned in runtime test |

## Raw Shape

```text
assignmentStart: 23
braceStart: 43
braceEnd: 5942993
extractedBytes: 5945215
rootPath: ytInitialData
twoColumnPath: contents.twoColumnWatchNextResults
playerOverlayPath: playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer
```

The raw token counts and parsed-key counts intentionally differ for playlist
and end-screen renderers because the raw payload also contains preload strings.

```text
raw autoplayVideo tokens: 2
raw nextButtonVideo tokens: 2
raw previousButtonVideo tokens: 2
raw compactAutoplayRenderer tokens: 0
raw playlistPanelVideoRenderer tokens: 29
parsed playlistPanelVideoRenderer keys: 28
raw endScreenVideoRenderer tokens: 12
parsed endScreenVideoRenderer keys: 11
```

## Reduced Fixture Shape

The reduced fixture preserves three real playlist-panel rows, one autoplay set,
one modified autoplay set, the current video endpoint, and two real
player-overlay end-screen rows.

```text
ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.contents.2.playlistPanelVideoRenderer
ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.contents.3.playlistPanelVideoRenderer
ytInitialData.contents.twoColumnWatchNextResults.playlist.playlist.contents.4.playlistPanelVideoRenderer
ytInitialData.contents.twoColumnWatchNextResults.autoplay.autoplay.sets.0.autoplayVideo
ytInitialData.contents.twoColumnWatchNextResults.autoplay.autoplay.sets.0.nextButtonVideo
ytInitialData.contents.twoColumnWatchNextResults.autoplay.autoplay.sets.0.previousButtonVideo
ytInitialData.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.0.endScreenVideoRenderer
ytInitialData.playerOverlays.playerOverlayRenderer.endScreen.watchNextEndScreenRenderer.results.1.endScreenVideoRenderer
```

The endpoint mapping in the reduced fixture is:

```text
currentVideoEndpoint.watchEndpoint.videoId: mqgEYRtWMJU
autoplayVideo.watchEndpoint.videoId: UrAhnndvrSU
nextButtonVideo.watchEndpoint.videoId: UrAhnndvrSU
previousButtonVideo.watchEndpoint.videoId: TSHg9Kg_ciM
```

## Current Behavior Pinned

| Mode | Supported playlist/end-screen rows | Endpoint objects | Current risk |
| --- | --- | --- | --- |
| No active rules | Pass through unchanged. | Pass through unchanged. | Baseline shape preserved; row side effects still queue learned video-channel mappings. |
| Blocklist channel `UCUhkVZeSoGkZefR7sDRQB5Q` | Matching playlist row `UrAhnndvrSU` and end-screen row `Xq0joZ24D9Y` are removed. | `autoplayVideo` and `nextButtonVideo` are removed when the learned video-channel map ties them to `UrAhnndvrSU`. | Endpoint leak fixed for mapped channel block rules; keyword-only endpoint authority remains limited by endpoint text absence. |
| Blocklist channel `UCdIuLHQyQiwqud2WpTgdCkg` | Matching playlist row `TSHg9Kg_ciM` is removed. | `previousButtonVideo` is removed when the learned video-channel map ties it to `TSHg9Kg_ciM`. | Previous-button endpoint leak fixed for mapped channel block rules. |
| Whitelist nonmatch | All supported playlist and end-screen rows are removed. | `autoplayVideo`, `nextButtonVideo`, and `previousButtonVideo` are removed; the empty autoplay set is dropped. | Allow-mode endpoint leak fixed for mapped and identityless endpoint objects. |
| Whitelist match for Stephen Barton | Supported Stephen Barton playlist/end-screen rows remain; nonmatching siblings are removed. | `autoplayVideo` and `nextButtonVideo` remain for `UrAhnndvrSU`; nonmatching `previousButtonVideo` is removed. | Row whitelist and endpoint whitelist are now unified for mapped watch endpoints in this fixture. |
| Blocklist keyword `Jumpmaster` | Matching playlist row `UrAhnndvrSU` is removed. | `autoplayVideo` and `nextButtonVideo` still point to `UrAhnndvrSU`. | Keyword row authority does not imply endpoint authority. |
| Hide end-screen cards/videowall | Existing CSS still owns visible player overlay hiding. | Autoplay `sets` and `modifiedSets` are removed before YouTube can build the "Watch this next" endpoint set. | Fixes the reported end-screen autoplay panel path for these settings. |

The key proof is now that mapped `autoplayVideo`, `nextButtonVideo`, and
`previousButtonVideo` endpoint objects are removed under the same channel-mode
decisions as supported rows, and end-screen settings drop endpoint sets
directly.

## Product Source Boundary

`js/filter_logic.js` still has no direct `FILTER_RULES` entry or nested
known-key entry for these keys:

```text
autoplayVideo
nextButtonVideo
previousButtonVideo
compactAutoplayRenderer
```

The existing direct JSON authority covers `playlistPanelVideoRenderer` and
`endScreenVideoRenderer`, so supported rows can be removed. The autoplay,
next-button, and previous-button watch controls remain endpoint objects, but
`_shouldBlockAutoplayEndpoint()` and `_shouldDropAutoplayEndpointSet()` now
make them direct non-renderer JSON decisions.

## Optimization Implication

The recent whitelist work is not enough by itself for a safe optimization pass
over watch/autoplay behavior. JSON-first filtering is the right direction, but
this slice shows that watch controls must be made first-class JSON decisions
separately from visible playlist and end-screen row filtering.

The 2026-05-31 runtime change adds an explicit endpoint policy for:

- no-rule pass-through
- blocklist endpoint-only removal when video-channel identity is mapped
- whitelist endpoint-only fail-closed behavior
- hide end-screen cards/videowall endpoint-set removal
- player prefetch and playback side-effect budget
- parity between playlist rows, player-overlay end screen rows, and watch
  control endpoints

## Non-Completion Boundary

This does not close the broader Main watch/up-next audit row. It extracts one
ignored `ytInitialData` watchpage capture and proves that it contains endpoint
objects rather than `compactAutoplayRenderer`. Remaining proof still includes
`YT_MAIN_NEXT.json`, the other up-next feed captures, any real
`compactAutoplayRenderer` fixture if one exists, direct watch-card RHS/hero
renderers, `/next` no-rule pass-through, `/player` metadata-only policy, and
watch rail whitelist scaffold preservation.

The following reporting and contract symbols remain absent from product runtime
source today:

```text
mainUpnextWatchpage3YtInitialDataContract
mainUpnextWatchpage3PreviousEndpointPolicy
mainUpnextWatchpage3PlayerOverlayEndScreenParityReport
mainUpnextWatchpage3WhitelistEndpointDecisionReport
mainUpnextWatchpage3RawShapeExtractor
mainUpnextWatchpage3EndpointSideEffectReport
mainUpnextWatchpage3JsonFirstOptimizationBudget
```

## Validation

```text
node --test tests/runtime/main-upnext-feed-watchpage3-autoplay-previous-end-screen-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: yes, for watch autoplay endpoint decisions
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
