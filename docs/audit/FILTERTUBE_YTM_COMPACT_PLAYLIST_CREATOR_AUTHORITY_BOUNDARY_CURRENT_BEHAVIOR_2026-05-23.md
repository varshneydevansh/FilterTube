# FilterTube YTM Compact Playlist Creator Authority Boundary Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice reuses the committed `YTM.json` compact playlist fixture to separate
field availability from filtering authority. The fixture has canonical
creator-looking fields, but current runtime behavior still treats
`compactPlaylistRenderer` as traversal context and not first-class JSON filter authority.

## Evidence

| Artifact | Lines | Bytes | SHA-256 | Classification |
| --- | ---: | ---: | --- | --- |
| `YTM.json` | 17334 | 1312137 | `9eacd68076c85f2c0eb218ddafbd543d631dfc26ac6f761f4611bc7eb0991e8d` | YouTube Music mixed JSON capture. |
| `tests/runtime/fixtures/captures/ytm-compact-playlist-renderer.json` | 373 | 10772 | `b50964a3a3a59db00f1f5235dbe6026b56326a19129177bc9d88c3dc06ed4630` | Reduced `compactPlaylistRenderer` fixture. |
| `tests/runtime/ytm-compact-playlist-creator-authority-boundary-current-behavior.test.mjs` | audit test | audit test | audit test | Pins creator fields, direct-rule absence, blocklist/whitelist pass-through, side effects, ledger links, and missing future authority. |

## Fixture Fields

The reduced renderer carries real playlist and creator-looking fields:

```text
playlistId: PLQu4efLw66leHfsIx1g8jCwfeJAMpOtNj
title: Mix danc pop
shortBylineText: Fabrizzio Andres Olguin Olguin · Playlist
longBylineText: Fabrizzio Andres Olguin Olguin · Playlist
browseId: UCvjXCedQa9pCEMzeLKMc20A
canonicalBaseUrl: /@fabrizzioandresolguinolgui5752
playlist URL: /playlist?list=PLQu4efLw66leHfsIx1g8jCwfeJAMpOtNj
```

Those fields are useful evidence, but field availability is not enough to
promote the renderer. The current `FILTER_RULES` table still has no direct
`compactPlaylistRenderer` entry. The renderer appears as an unwrap target from
`richItemRenderer`, so a rich item can expose it to the engine, but the exposed
renderer still lands on an unsupported/direct-gap decision path.

## Current Behavior

The current harness behavior is:

- no-rule mode preserves the compact playlist row;
- disabled mode also preserves the compact playlist row;
- blocklist title keyword `Mix danc pop` does not remove the row;
- blocklist creator channel `UCvjXCedQa9pCEMzeLKMc20A` does not remove the row;
- whitelist nonmatch mode preserves the unsupported row instead of fail-closing;
- whitelist match mode also preserves the unsupported row;
- `hidePlaylistCards` does not remove JSON `compactPlaylistRenderer` rows;
- every tested mode still queues `FilterTube_UpdateChannelMap` for
  `UCvjXCedQa9pCEMzeLKMc20A` / `@fabrizzioandresolguinolgui5752`.

That side effect matters for optimization: the renderer is not direct hide
authority today, but it can still mutate learned identity state. A later
JSON-first compact playlist promotion needs both filtering proof and side-effect
budget proof.

## Boundary

This fixture does not justify a blanket JSON-first playlist rule yet. It proves
that canonical creator-looking fields are present, not that the current runtime
uses them as first-class JSON filter authority.

The whitelist behavior is especially important: unsupported compact playlist
rows are effectively whitelist fail-open today. Changing this renderer to direct
authority would change both blocklist leak behavior and whitelist nonmatch
behavior, so promotion requires positive, negative, sibling-visible, list-mode,
route, surface, creator-confidence, side-effect, and restore/no-work fixtures.

Future runtime authority tokens intentionally absent today:

```text
ytmCompactPlaylistCreatorAuthorityContract
ytmCompactPlaylistDecisionReport
compactPlaylistRendererFilterRulePromotion
compactPlaylistWhitelistFailClosedPolicy
compactPlaylistCreatorIdentityConfidenceReport
compactPlaylistJsonFirstAuthorityGate
compactPlaylistSideEffectBudget
compactPlaylistFixturePromotionReport
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this playlist/mix/player-panel surface can
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
optimization, JSON-first behavior, playlist or Mix filtering behavior,
player-panel behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
