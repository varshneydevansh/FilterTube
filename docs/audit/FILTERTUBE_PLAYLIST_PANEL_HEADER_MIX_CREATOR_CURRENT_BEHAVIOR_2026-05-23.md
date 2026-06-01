# FilterTube Playlist Panel Header Mix Creator Current Behavior - 2026-05-23

Status: current-behavior proof. This is not an implementation patch.

This slice extracts the first playlist panel header from `playlist.html` to
separate header DOM evidence from creator/channel identity authority. It keeps
the new proof under `docs/audit` and leaves product runtime unchanged.

## Evidence

| Artifact | Lines | Bytes | SHA-256 | Classification |
| --- | ---: | ---: | --- | --- |
| `playlist.html` | 24055 | 2905258 | `62d5819d489a417c49c0dfe1384a8efb5a2ab85146a00207dd135a87b93e877d` | Raw desktop playlist/Mix capture, already FilterTube-mutated later in the file. |
| `tests/runtime/fixtures/captures/playlist-panel-header-mix-dom.html` | 31 | 1626 | `6bcf21a9b43ae53ab21312335b111d6c8a9a56dc90380d87577f5b04a26debe3` | Reduced playlist panel header DOM evidence, not creator channel identity proof. |
| `tests/runtime/playlist-panel-header-mix-creator-current-behavior.test.mjs` | audit test | audit test | audit test | Pins raw header counts, fixture provenance, selected-row byline limits, player metadata limits, ledger links, and missing future authority. |

The reduced fixture stores the raw title with HTML entities:
`Mix &#8211; Shakira , Ed Sheeran,  Be&#233;le Hips Don't Lie (Spotify Anniversary)`.
That preserves the original header text while keeping the committed fixture
ASCII.

## Header Counts

The raw segment is the first `<ytd-playlist-panel-renderer` up to
`<div id="content-header"`.

| Token | Count in raw header segment | Meaning |
| --- | ---: | --- |
| `playlist-type="RDUc"` | 1 | Mix/radio-style playlist panel type is present. |
| Mix title prefix | 4 | Title text appears in visible title and hidden byline-title attributes/text. |
| `Mixes are playlists YouTube makes for you` | 2 | Publisher text says the Mix is YouTube-generated. |
| `RDUc8KFRqO3IM` | 0 | Full playlist id appears on rows later, not in the extracted header segment. |
| `href="/channel/` | 0 | No canonical creator channel link in the header segment. |
| `href="/@` | 0 | No canonical creator handle link in the header segment. |
| `data-filtertube-channel-id` | 0 | No FilterTube-stamped creator channel id in the header segment. |
| `filtertube-hidden` / `data-filtertube-hidden` | 0 | The header fixture is not hidden-state proof. |
| `selected="` | 0 | Selected/current row state is outside the header segment. |

## Boundary

The playlist panel header fixture proves a real Mix header exists and that the
publisher string says YouTube makes the playlist. It is not playlist creator
identity proof, not playlist creator identity proof for runtime decisions, and
not creator channel identity proof.

The existing selected-row fixture, `playlist-selected-row.html`, proves a row
can show an `Ed Sheeran` byline and a selected playlist state. It does not carry
`data-filtertube-channel-id`, `/channel/`, or `/@` identity in that reduced row,
so the row byline remains display-only evidence unless joined to a canonical
JSON or DOM identity source.

The raw `playlist.json` file separately contains current-video/player metadata:
`videoDetails.channelId`, `videoDetails.author`, `ownerProfileUrl`,
`externalChannelId`, and `ownerChannelName` for `ShawnMendesVEVO`. That is
current-video metadata, not playlist header authority. The committed
`main-compact-radio-renderer.json` fixture still carries playlist/video ids plus
a display-only `YouTube` byline and no creator channel fields.

## Verdict

The playlist header/creator gate remains open. This slice narrows the evidence:
we now have header DOM proof for a YouTube-generated Mix, selected-row byline
proof, and current-video metadata proof, but no canonical playlist creator
fixture.

Required future proof before JSON-first playlist creator filtering or
playlist-owner optimizations:

- a real playlist header or metadata fixture with canonical creator channel or
  explicit no-creator policy;
- blocklist and whitelist decisions for creator identity, display-only byline,
  current-video owner, and unresolved Mix publisher cases;
- selected/current row preservation and negative sibling-visible proof;
- disabled/no-work and empty-rule budgets for playlist header scans;
- no synthetic click, pause, next-video, or playback side-effect proof.

Future runtime authority tokens intentionally absent today:

```text
playlistPanelHeaderCreatorIdentityContract
playlistPanelHeaderCreatorDecisionReport
playlistPanelHeaderMixPublisherPolicy
playlistSelectedRowBylineIdentityReport
playlistHeaderCreatorFixtureGate
playlistPanelHeaderJsonFirstAuthorityGate
playlistCreatorNoPlaybackSideEffectReport
```

A real playlist creator fixture is still required before implementation changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
