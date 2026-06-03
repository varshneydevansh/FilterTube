# FilterTube Playlist JSON Player Metadata Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice classifies the second balanced JSON fragment in `playlist.json`.
That raw file is not a single JSON document: it starts with a prose label,
contains a generated Mix `compactRadioRenderer`, and then contains
`var ytInitialPlayerResponse = ...` player metadata for the current video.

The point of this slice is narrow: player owner metadata is useful evidence for
the current watch video, but it is current-video metadata, not playlist creator authority and not creator channel identity proof for the playlist.

## Evidence

| Artifact | Lines | Bytes | SHA-256 | Classification |
| --- | ---: | ---: | --- | --- |
| `playlist.json` | 3609 | 165443 | `f5766312bdddcceb20ecd2a4b54045843dfab89108b75c2f5bc8a0ee368d4ce5` | Prose-prefaced mixed capture. |
| fragment 0 | starts line 3 | 16485 | `52b52269372f0c9160cc33362dcc6d1c4977be650b1da78848d76799f79e5450` | Generated Mix `compactRadioRenderer`; no creator channel fields. |
| fragment 1 | starts line 288 | 148701 | `e0798e02cc864bed06899c5c6ab94a3900c6050c7baa494edc14d7822b5aa72a` | `ytInitialPlayerResponse` current-video/player metadata. |
| `tests/runtime/fixtures/captures/playlist-json-player-metadata.json` | 181 | 6067 | `c3f1134676f5ea96cb2dadf6b757ef96c607d334372fe31b2bea4eb4f616369b` | Reduced current-video metadata fixture. |
| `tests/runtime/playlist-json-player-metadata-boundary-current-behavior.test.mjs` | audit test | audit test | audit test | Pins raw mixed-fragment classification, reduced fixture provenance, current behavior, ledger links, and missing future authority. |

## Current Behavior

The raw player fragment carries canonical current-video owner fields:

```text
videoDetails.videoId: Pkh8UtuejGw
videoDetails.channelId: UC4-TgOSMJHn-LtY4zCzbQhw
videoDetails.author: ShawnMendesVEVO
microformat.playerMicroformatRenderer.ownerProfileUrl: http://www.youtube.com/@shawnmendesvevo
microformat.playerMicroformatRenderer.externalChannelId: UC4-TgOSMJHn-LtY4zCzbQhw
microformat.playerMicroformatRenderer.ownerChannelName: ShawnMendesVEVO
microformat.playerMicroformatRenderer.externalVideoId: Pkh8UtuejGw
```

The same fragment has no parsed playlist-panel or compact-autoplay authority:

```text
playlistPanelRenderer: 0
playlistPanelVideoRenderer: 0
playlistHeaderRenderer: 0
compactAutoplayRenderer: 0
```

The reduced fixture proves current runtime behavior:

- no-rule and disabled modes preserve the player response unchanged;
- blocklist keyword, blocklist channel, and whitelist nonmatch modes preserve
  the metadata-only response unchanged;
- owner/meta side effects still queue `FilterTube_UpdateChannelMap`,
  `FilterTube_UpdateVideoChannelMap`, and `FilterTube_UpdateVideoMetaMap`;
- `endscreenElementRenderer` channel, playlist, and video elements remain
  present in the reduced response.

## Boundary

The compact radio fragment remains display-only YouTube byline proof:
`main-compact-radio-renderer.json` has playlist/video IDs and a `YouTube`
byline but no `channelId`, `externalChannelId`, `ownerChannelName`, or
`ownerProfileUrl`.

The player metadata fragment proves the current video owner. It does not prove
the owner or creator of the generated Mix playlist. The embed URL includes the
playlist context (`?list=RDUc8KFRqO3IM`), but the canonical owner fields still
belong to `Pkh8UtuejGw`, not to the playlist header or playlist creator.

## Verdict

`playlist.json` is now better classified:

- fragment 0: Mix/radio card with display-only YouTube byline;
- fragment 1: current-video/player metadata for ShawnMendesVEVO;
- neither fragment closes playlist creator identity.

The playlist creator fixture remains required before JSON-first playlist
creator filtering, playlist-owner optimization, or current-video-owner to
playlist-owner promotion.

Future runtime authority tokens intentionally absent today:

```text
playlistJsonPlayerMetadataBoundaryContract
playlistJsonPlayerMetadataDecisionReport
playlistJsonMixedFragmentClassifier
playlistJsonCurrentVideoOwnerPolicy
playlistJsonCreatorIdentityPromotionGate
playlistJsonPlayerMetadataSideEffectReport
playlistJsonPlayerMetadataJsonFirstAuthorityGate
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
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
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
