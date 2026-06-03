# FilterTube Main Home Rich Grid Mix/Video Current Behavior - 2026-05-24

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice promotes the reduced `logs.json` Main desktop home fixtures into a
dedicated current-behavior proof before any home-feed no-work, whitelist, or
JSON-first filtering change. It proves that the supported `richItemRenderer`
path can make different decisions for adjacent rich-grid rows depending on
whether the row unwraps to a display-only Mix `lockupViewModel` or a canonical
channel-backed `videoRenderer`.

The home rich-grid browse fetch is not a zero-work path today: the seed
`/youtubei/v1/browse` fetch path still parses and rebuilds the response for
empty blocklist harvest-only, active blocklist, whitelist, and disabled states.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `logs.json` | Ignored raw Main browse/search/home evidence. | 29,148 lines; 3,589,250 bytes; sha256 `87cacdf3e0229f951bade1aad18b83074de7c147dfb3095c0f5f705343ca29cc`. |
| `js/filter_logic.js` | Existing runtime rule owner; not changed in this slice. | `richItemRenderer`, `lockupViewModel`, and `videoRenderer` rules exist today. |

Raw token counts in `logs.json`:

```text
richItemRenderer: 54
lockupViewModel: 33
videoRenderer: 3
richGridRenderer: 2
RD41ZY18JqI2A: 7
UCt4t-jeY85JegMlZ-E5UWtA: 4
```

## Reduced Fixtures

`tests/runtime/fixtures/captures/main-home-rich-lockup-mix-renderer.json` is a
74-line, 2,151-byte reduced fixture with sha256
`e059b980e6c95c4ccc09baa89a05011946546b28e32b97a61f3f66299b6e43a3`.

`tests/runtime/fixtures/captures/main-home-rich-video-renderer.json` is a
92-line, 2,864-byte reduced fixture with sha256
`001acab2767f33c8fbee4fb8d84ec1fca90dfcc6700e109983e854f24badba16`.

| Fixture | Renderer path | Key evidence |
| --- | --- | --- |
| `main-home-rich-lockup-mix-renderer.json` | `richItemRenderer.content.lockupViewModel` | Mix playlist lockup; title contains `Shakira`; content id `RD41ZY18JqI2A`; display metadata names creators; no browse/channel endpoint. |
| `main-home-rich-video-renderer.json` | `richItemRenderer.content.videoRenderer` | Home video `bggFTyMzd9E`; canonical channel `UCt4t-jeY85JegMlZ-E5UWtA`; handle `/@aajtak`; short duration/video metadata. |

## Current Runtime Result

Pinned behavior:

- No-rule processing preserves both reduced home rows.
- The Mix lockup is removed by a matching title keyword.
- The Mix lockup is not removed by a creator-looking channel rule because
  display-only Mix metadata is not creator channel identity.
- The Mix lockup is preserved in whitelist mode by a matching keyword.
- The Mix lockup is removed in whitelist mode when only the Aaj Tak channel is
  allowed or when no allow rule matches.
- The video row is removed by a matching title keyword.
- The video row is removed by matching canonical channel ID/handle.
- The video row is preserved in whitelist mode when the Aaj Tak channel is
  allowed.
- The video row is removed in whitelist mode when only the Mix title keyword is
  allowed.
- Video-row processing queues `FilterTube_UpdateChannelMap` and
  `FilterTube_UpdateVideoChannelMap`; Mix-only processing queues no map side
  effect.

## Sibling Boundary

In one adjacent rich-grid payload, a matching Aaj Tak channel rule removes the
home video while preserving the Mix lockup. In whitelist mode with the same
channel allowed, the home video is preserved while the Mix lockup is removed.
In whitelist mode with the Mix title keyword allowed, the Mix lockup is
preserved while the Aaj Tak video is removed.

This is the important JSON-first boundary: the same `richItemRenderer` family is
supported, but identity confidence and allowed effects differ by nested row
shape. A future optimization must not treat display-only Mix metadata as
canonical creator identity, and must not treat a home rich-grid row family as
one uniform whitelist decision.

## Seed Home No-Work Boundary

The seed `/youtubei/v1/browse` fetch path does not make this home rich-grid
payload a zero-work optimization boundary:

| Settings state | Current seed behavior |
| --- | --- |
| Empty blocklist on `/` | Parses response, rebuilds response, calls `harvestOnly()`, and does not call `processData()`. |
| Active blocklist keyword | Parses response, rebuilds response, and calls `processData()` for `fetch:/youtubei/v1/browse`. |
| Whitelist mode | Parses response, rebuilds response, and calls `processData()` for `fetch:/youtubei/v1/browse`. |
| Disabled filtering | Parses response and rebuilds response before returning unchanged data; no `harvestOnly()` or `processData()` call. |

## Future Authority Fields

No product runtime symbol exists yet for:

- `mainHomeRichGridContract`
- `mainHomeRichGridFixtureAdmissionReport`
- `mainHomeMixLockupDecisionReport`
- `mainHomeVideoRendererDecisionReport`
- `mainHomeMixDisplayOnlyIdentityPolicy`
- `mainHomeRichGridWhitelistPolicy`
- `mainHomeRichGridMapSideEffectReport`
- `mainHomeRichGridSeedNoWorkBudget`
- `mainHomeRichGridJsonFirstOptimizationBudget`

This document and its test are audit evidence only. They do not permit renderer
expansion, home-feed behavior changes, Mix creator inference changes, endpoint
admission changes, no-work optimization changes, map side-effect changes, or
whitelist optimization changes.

## Executable Proof

```bash
node --test tests/runtime/main-home-rich-grid-mix-video-current-behavior.test.mjs
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
