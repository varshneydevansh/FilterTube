# FilterTube Main Watch Autoplay Video Endpoint Current Behavior - 2026-05-23

Status: audit-only current-behavior proof slice. Runtime behavior is unchanged;
this is not an implementation patch, renderer patch, endpoint patch, autoplay
patch, whitelist patch, or player behavior patch.

This slice separates the documented `compactAutoplayRenderer` gap from the real
autoplay endpoint shape present in the ignored Main watch capture. The raw
`get_watch?prettyPrint=false.json` response has no `compactAutoplayRenderer`
keys. It does have watch autoplay endpoint objects under
`contents.twoColumnWatchNextResults.autoplay.autoplay.sets[*]`.

## Source Scope

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `get_watch?prettyPrint=false.json` | 46562 | 5046178 | `578230df9dc00dfebc8ac0ec4cc1ec2f796abf7cf4584c9e4ece67856fdf90e0` |
| `tests/runtime/fixtures/captures/main-watch-autoplay-video-endpoint.json` | reduced fixture | reduced fixture | fixture-pinned in runtime test |

## Raw Token Counts

```text
autoplayVideo tokens: 2
nextButtonVideo tokens: 2
previousButtonVideo tokens: 0
compactAutoplayRenderer tokens: 0
playlistPanelVideoRenderer tokens: 26
endScreenVideoRenderer tokens: 9
```

## Reduced Fixture Shape

The reduced fixture preserves one supported `playlistPanelVideoRenderer` for
`TUVcZfQe-Kw` and the matching watch autoplay endpoint objects that point to
the same video.

```text
1.watchNextResponse.contents.twoColumnWatchNextResults.playlist.playlist.contents.1.playlistPanelVideoRenderer
1.watchNextResponse.contents.twoColumnWatchNextResults.autoplay.autoplay.sets.0.autoplayVideo
1.watchNextResponse.contents.twoColumnWatchNextResults.autoplay.autoplay.sets.0.nextButtonVideo
1.watchNextResponse.contents.twoColumnWatchNextResults.autoplay.autoplay.modifiedSets.0.autoplayVideo
1.watchNextResponse.contents.twoColumnWatchNextResults.autoplay.autoplay.modifiedSets.0.nextButtonVideo
```

## Current Behavior Pinned

| Mode | Supported playlist row | Autoplay endpoint objects | Current risk |
| --- | --- | --- | --- |
| No active rules | Passes through unchanged. | Pass through unchanged. | Baseline shape preserved. |
| Blocklist keyword `Dua` | Matching `playlistPanelVideoRenderer` is removed. | Matching `autoplayVideo` and `nextButtonVideo` still point to `TUVcZfQe-Kw`. | Leak: the next-play endpoint can survive after the visible supported row is removed. |
| Blocklist channel `UC-J-KZfRV8c13fOCkhXdLiQ` | Matching `playlistPanelVideoRenderer` is removed. | Matching `autoplayVideo` and `nextButtonVideo` are removed. | Channel-rule autoplay endpoint leak is covered in this reduced fixture. |
| Whitelist nonmatch | Supported playlist row is removed by fail-closed whitelist mode. | Matching `autoplayVideo` and `nextButtonVideo` are removed. | Allow-mode autoplay endpoint leak is covered in this reduced fixture. |
| Whitelist match | Supported playlist row remains. | Autoplay endpoints remain. | No false hide in the reduced fixture, but the endpoint still lacks explicit allow authority. |

The full reduced fixture queues one `FilterTube_UpdateVideoChannelMap` message
from the supported playlist row. Endpoint-only autoplay objects do not queue
channel-map or video-map side effects when processed without the playlist row.

## Product Source Boundary

`js/filter_logic.js` has no direct rule or nested known-key entry for:

```text
autoplayVideo
nextButtonVideo
previousButtonVideo
compactAutoplayRenderer
```

The CSS owned by `disableAutoplay` in `js/content/dom_fallback.js` targets the
player toggle and `.autonav-endscreen`. It does not mutate the JSON
`autoplayVideo` endpoint objects.

## Non-Completion Boundary

This does not close the broader compact-autoplay or watch autoplay audit row.
It proves the raw capture uses endpoint objects rather than
`compactAutoplayRenderer`, and it proves channel-rule and whitelist nonmatch
filtering can remove matching endpoint objects when the matching supported
playlist row is removed.

Still required before optimization or behavior changes:

- a renderer inventory policy for `compactAutoplayRenderer` versus endpoint
  autoplay shapes
- an endpoint policy for `autoplayVideo`, `nextButtonVideo`, and
  `previousButtonVideo`
- blocklist and whitelist decisions for endpoint-only autoplay objects
- sibling-visible proof across playlist, watch rail, end screen, and player DOM
- no synthetic click, no playback transition, and no prefetch side-effect proof
- metrics for no-rule and disabled mode

The following future authority symbols remain absent from product runtime
source today:

```text
mainWatchAutoplayVideoEndpointContract
mainWatchAutoplayEndpointDecisionReport
mainWatchAutoplayEndpointWhitelistPolicy
mainWatchAutoplayEndpointBlocklistPolicy
mainWatchAutoplayEndpointSideEffectBudget
mainWatchAutoplayEndpointRendererInventoryPolicy
mainWatchAutoplayEndpointMetricArtifact
```

## Validation

```text
node --test tests/runtime/main-watch-autoplay-video-endpoint-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5736
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5736
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
