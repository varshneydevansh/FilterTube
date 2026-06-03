# FilterTube Extracted Watch Paths Text Dump Classification Current Behavior - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged.

This slice classifies `extracted_watch_paths.txt`, an ignored raw evidence file in
the watch/player capture family. It is a derived path dump, not a raw JSON
response, not rendered DOM, not a reduced fixture, and not an implementation
authority. It can help locate watch metadata and playlist collaborator paths,
but it cannot prove blocklist, whitelist, no-rule, no-playback, DOM wall, or
endpoint behavior by itself.

## Current Answer

`extracted_watch_paths.txt` is classification evidence only:

- 677 logical lines, 676 newline characters, 191278 bytes.
- SHA-256: `be92bbf6041b99088c9057ef77b1a190e30e2cec5ddb59dea4f127d5c8258613`.
- Two section headers: `videoSecondaryInfoRenderer` and
  `playlistPanelVideoRenderer`.
- 674 ` -> ` path/value rows.
- 255 `videoOwnerRenderer` tokens.
- 530 `showDialogCommand` tokens.
- 562 `listItemViewModel` tokens.
- 12 `browseEndpoint.browseId` tokens.
- 10 `canonicalBaseUrl` tokens.
- 25 `actionButtons[0]` tokens.
- 12 `menu.menuRenderer` tokens.
- 2 `likeEndpoint.target.videoId` tokens.
- 0 `var ytInitialData`, `<html`, `ytp-endscreen`,
  `watchNextEndScreenRenderer`, `endScreenVideoRenderer`, or
  `compactAutoplayRenderer` tokens.

## Section Split

| Section | Nonblank lines | Path rows | Key evidence | Current use |
| --- | ---: | ---: | --- | --- |
| `videoSecondaryInfoRenderer` | 522 | 521 | `videoOwnerRenderer`, collaborator dialog paths, channel browse IDs, canonical URLs | Metadata path inventory only |
| `playlistPanelVideoRenderer` | 154 | 153 | playlist byline collaborator dialog paths, menu paths, like endpoint target paths | Playlist path inventory only |

## Why This Matters

The file is tempting because it contains rich watch metadata paths, collaborator
dialog paths, playlist byline paths, and endpoint-like strings. Those are useful
for planning extraction, but they are not executable JSON or DOM evidence. A
future JSON-first watch/player change still needs a committed minimal fixture
that preserves the original object shape and proves:

- route and endpoint ownership,
- blocklist and whitelist decisions,
- no-rule and disabled budgets,
- sibling preservation,
- selected/current row policy,
- no unintended playback or synthetic navigation side effects,
- map/cache/message side effects,
- and DOM parity where player overlays or playlist rows are involved.

## Current Boundary

This slice does not close `capture_traceability_main_watch_end_screen_dom_wall`,
`watch_player_no_rule_metadata_only_without_recommendation_mutation`, endpoint
autoplay policy, parsed collaborator roster proof, rendered Main watch DOM wall
proof, or compact autoplay proof. It only prevents a derived text dump from
being mistaken for raw behavior proof.

No runtime symbol exists yet for:

- `extractedWatchPathsTextDumpClassifier`
- `watchPathDumpFixturePromotionGate`
- `watchPathDumpJsonDomParityReport`
- `watchPathDumpMetadataOnlyPolicy`
- `watchPathDumpNoPlaybackSideEffectReport`
- `watchPathDumpMetricArtifact`

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
