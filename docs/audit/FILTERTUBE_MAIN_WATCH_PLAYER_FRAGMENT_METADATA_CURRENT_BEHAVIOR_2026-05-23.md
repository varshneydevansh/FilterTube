# FilterTube Main Watch Player Fragment Metadata Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice extracts the second parseable JSON fragment from `YT_MAIN.json`.
The fragment follows the raw text marker `player?prettyprint=false` and is
metadata-only current behavior, not recommendation-filtering authority.

## Raw Fragment Classification

| Evidence | Current value |
| --- | --- |
| Raw source | `YT_MAIN.json` |
| Raw SHA-256 | `64c7861ff6baa76816082479f5bdda591faef3e72e2510e6da80866cba1c3357` |
| Raw bytes | `4951099` |
| Logical lines | `50481` |
| Whole-file `JSON.parse` | fails because the file is a mixed capture |
| Fragment index | `1` |
| Fragment start line | `47533` |
| Fragment bytes | `124193` |
| Fragment SHA-256 | `a54a51cc0624c21ea56f442b11166200be7c0345ab4d027ddad3d860855d7c73` |

Parsed fragment 1 has these top-level keys:

```text
responseContext
playabilityStatus
streamingData
playbackTracking
captions
videoDetails
playerConfig
storyboards
microformat
cards
trackingParams
endscreen
adPlacements
adBreakHeartbeatParams
frameworkUpdates
```

It contains:

```text
1 videoDetails key
1 playerMicroformatRenderer key
1 cardRenderer key
4 endscreenElementRenderer keys
0 videoRenderer keys
0 lockupViewModel keys
0 shortsLockupViewModel keys
0 playlistPanelVideoRenderer keys
0 compactAutoplayRenderer keys
0 autoplayVideo keys
```

So this fragment proves `/player` metadata and generic endscreen element
scaffolding, not direct renderer filtering coverage for watch recommendations.

## Reduced Fixture

| Fixture field | Value |
| --- | --- |
| Minimal fixture | `tests/runtime/fixtures/captures/main-watch-player-fragment-metadata.json` |
| Fixture kind | `json` |
| Fixture SHA-256 | `dd254e7ee4c8b4764ac4511009f75e423055a18dd90466f9081b41ccf40be63d` |
| Fixture bytes | `5301` |
| Fixture lines | `159` |
| Route | `watch` |
| Renderer paths | `videoDetails`, `microformat.playerMicroformatRenderer`, `endscreenElementRenderer` |
| Release input allowed | `false` |

The reduced fixture keeps:

- current video metadata for `WMweEpGlu_U`;
- owner identity `UC3IZKseVpdzPSBaWxBxundA` and `@HYBELABELS`;
- player meta fields for duration, publish date, upload date, and category;
- one correction card;
- two endscreen element siblings, `CuklIb9d3fI` and `R6e4tBWxIxE`.

## Current Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves the player response exactly. | Direct engine processing still harvests player metadata in reduced fixtures, but seed `/player` fetch bypasses `processData()` when there is no active JSON work. |
| No rule side effects | Queues `FilterTube_UpdateChannelMap`, `FilterTube_UpdateVideoChannelMap`, and `FilterTube_UpdateVideoMetaMap`. | The useful current behavior is metadata harvest, not response mutation. |
| Disabled | Returns the original response but still harvests player owner and meta maps before the enabled check returns. | Disabled mode is pass-through for data mutation but not zero side-effect. |
| Blocklist keyword | A matching `Butter` keyword does not remove `videoDetails`, cards, or endscreen elements. | Player metadata is not a direct keyword-hide surface today. |
| Blocklist channel | A matching owner channel does not remove the player response. | Player owner identity is harvested but not used as direct hide authority for `/player`. |
| Whitelist nonmatch | A nonmatching whitelist channel does not fail-close this player fragment. | Whitelist fail-closed behavior applies to supported renderers, not metadata-only player fragments. |
| Seed `/player` endpoint | With empty blocklist settings and no active JSON work, `/youtubei/v1/player` returns the original response without `processData()` or `JSON.stringify()`. | JSON-first optimization still needs a metadata-only harvest contract for active player-response rule states before broadening player response mutation. |

## Optimization Implication

This slice narrows the JSON-first optimization target. The second `YT_MAIN.json`
fragment is valuable for owner and video metadata maps, but it does not prove
recommendation filtering. A future optimization should separate these effects:

- harvest player owner and metadata;
- avoid unnecessary full recursive mutation when no player-specific mutation is
  needed;
- keep cards and endscreen elements pass-through unless a fixture proves direct
  renderer authority;
- keep this distinct from rendered player end-screen DOM wall behavior.

Remaining proof before behavior changes:

- rendered Main watch/player DOM wall with blocklist, whitelist, fullscreen, and
  no-playback side-effect proof;
- endpoint policy for `/player` metadata-only harvest versus mutation;
- explicit current-watch owner decision proof separate from player metadata;
- real `compactAutoplayRenderer` fixture if it appears elsewhere;
- route-scoped no-rule metrics for `/player`, `/next`, and initial watch JSON.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainWatchPlayerFragmentMetadataContract
mainWatchPlayerFragmentMetadataOnlyPolicy
mainWatchPlayerFragmentMutationBudget
mainWatchPlayerFragmentEndscreenElementDecisionReport
mainWatchPlayerFragmentMapSideEffectReport
mainWatchPlayerFragmentJsonFirstOptimizationGate
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
