# FilterTube Main Watch HTML Embedded Playlist Endscreen JSON Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, selector patch, whitelist patch, or DOM
wall fixture. It is not a DOM wall fixture.

This slice extracts a reduced fixture from the second embedded `ytInitialData`
assignment in `YT_MAIN_WATCH.html`. The point is narrow: this capture proves
watch playlist-panel and player-overlay end-screen JSON behavior, while the
rendered player DOM videowall remains unproven.

## Raw Capture

| Evidence | Current value |
| --- | --- |
| Raw source | `YT_MAIN_WATCH.html` |
| Raw SHA-256 | `3d6de64dc55e211790c1b555d90420fb6bdb47104cb7c38cb903a3dbc966160c` |
| Raw bytes | `7873780` |
| Logical lines | `69613` |
| `ytInitialData` assignments | `2` |
| Selected assignment | `ytInitialData[1]` |
| Selected span | `4505651..7857979` |
| Selected bytes | `3356005` |
| Selected SHA-256 | `62961f85f1ca83bbe70cdc8e5424bb3751b1e7f9d18ed6c63308e12ca9f06cd9` |
| Parsed `playlistPanelVideoRenderer` keys | `26` |
| Parsed `endScreenVideoRenderer` keys | `12` |
| Parsed `compactAutoplayRenderer` keys | `0` |
| Rendered player DOM end-screen selector tokens | `0` |

## Reduced Fixture

| Fixture field | Value |
| --- | --- |
| Minimal fixture | `tests/runtime/fixtures/captures/main-watch-html-embedded-playlist-endscreen-json.json` |
| Fixture SHA-256 | `94627b77ac43fbcc45e6690d7934bd99077244f8156243289fa4add498a1be6c` |
| Fixture bytes | `8768` |
| Fixture lines | `215` |
| Route | `watch` |
| Renderer paths | `playlistPanelVideoRenderer`, `endScreenVideoRenderer` |
| Release input allowed | `false` |

The fixture keeps two playlist-panel rows and two player-overlay end-screen
rows:

```text
playlistPanelVideoRenderer: pcbnucHE3gU, 1U6WY_z8Vu8
endScreenVideoRenderer: 84kbG2ExdZs, 8Li0Tyeqlc4
```

## Current Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves both playlist-panel rows and both end-screen rows. | Embedded watch HTML JSON is not a no-work path today; map harvest still occurs. |
| No rule side effects | Queues one `FilterTube_UpdateChannelMap` for `@TronLegacyScore` and one `FilterTube_UpdateVideoChannelMap` payload for all four reduced rows. | JSON-first optimization needs a harvest budget before bypassing this embedded object. |
| Blocklist channel | Blocking `UCm9VWKAFz0aXpuEHPHMae7w` removes the matching playlist row `pcbnucHE3gU` and matching end-screen row `84kbG2ExdZs`, while preserving nonmatching siblings. | Existing JSON rules cover both renderer families when identity is present. |
| Blocklist keyword | `Tron` removes only end-screen row `8Li0Tyeqlc4`. | This proves JSON end-screen title filtering, not DOM videowall hiding. |
| Whitelist channel | Allowing `UCm9VWKAFz0aXpuEHPHMae7w` preserves only the matching playlist and end-screen rows; allowing `UC1Pwa4nFvIPbtYVLcBGDpjA` preserves the matching playlist row and removes end-screen rows. | Current whitelist behavior is fail-closed for unsupported/nonmatching embedded rows. |

## Optimization Boundary

This is first-class JSON evidence for embedded watch HTML payloads, but it is
not proof that the rendered player videowall is hidden safely. The older shape
classification remains valid: `YT_MAIN_WATCH.html` has zero
`ytp-endscreen-content`, `ytp-ce-element`, `ytp-videowall-still`, or
`autonav-endscreen` DOM selector tokens.

Before optimizing or changing player end-screen behavior, the audit still needs
a clean rendered Main watch DOM wall fixture with blocklist, whitelist,
disabled/no-work, fullscreen, sibling-visible, no synthetic click, and no
playback-transition proof.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainWatchHtmlEmbeddedJsonContract
mainWatchHtmlEmbeddedPlaylistEndScreenDecisionReport
mainWatchHtmlEmbeddedJsonDomWallBoundary
mainWatchHtmlEmbeddedWhitelistFamilyReport
mainWatchHtmlEmbeddedMapSideEffectReport
mainWatchHtmlEmbeddedJsonFirstOptimizationBudget
```

## Validation

```bash
node --test tests/runtime/main-watch-html-embedded-playlist-endscreen-json-current-behavior.test.mjs
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
