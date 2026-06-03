# FilterTube Main Search Universal Watch-Card Current Behavior - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice reduces the real Main mobile search hero card from
`strange_ytInitialData.json` into a committed fixture before any watch-card or
JSON-first filtering change. It proves the supported
`universalWatchCardRenderer` wrapper path while keeping direct watch-card child
renderers as separate gaps.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `strange_ytInitialData.json` | `var ytInitialData = '...'` string literal with escaped JSON; not direct JSON. | 141 lines; 244,201 bytes; sha256 `01e6010a3f46041c3bcb3b6b399e871b5aa2fc28a0f234eca237226162b476b7`. |
| `js/filter_logic.js` | Existing runtime rule owner; not changed in this slice. | 3,652 lines; 172,174 bytes; sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5`. |

Raw token counts in `strange_ytInitialData.json`:

```text
universalWatchCardRenderer: 2
watchCardRichHeaderRenderer: 2
watchCardHeroVideoRenderer: 2
searchRefinementCardRenderer: 21
compactChannelRenderer: 2
```

`strange_ytInitialData.json` is not direct JSON. The whole raw file fails direct
`JSON.parse()`. The fixture is admitted as a reduced fragment from the escaped
page-global container, not as direct endpoint JSON.

## Reduced Fixture

`tests/runtime/fixtures/captures/main-search-universal-watch-card-renderer.json`
is a 121-line, 3,347-byte reduced fixture with sha256
`e64cbd7c481cacd05e425542be5c141f1351b570ea086fe958d2702bd388d8e9`.

It carries the top search hero card:

| Renderer | Raw JSON path | Entity / video | Identity |
| --- | --- | --- | --- |
| `universalWatchCardRenderer` | `contents.sectionListRenderer.contents[0].universalWatchCardRenderer` | `Nyusha`; hero video `XuHro6TjXww`; playlist `RDEMgF031uDlRkNZ1d0qT2a8QA` | `UCm9VWKAFz0aXpuEHPHMae7w`; `@NYUSHAmusic` |

## Current Runtime Result

`universalWatchCardRenderer` wrapper filtering works today through
`FILTER_RULES.universalWatchCardRenderer`.

Pinned behavior:

- With no active rule, the reduced hero card passes through unchanged.
- Blocklist keyword matching the captured header title removes the hero card.
- Blocklist channel matching the captured channel ID or handle removes the hero
  card.
- Whitelist mode preserves the card when the captured channel is allowed.
- Whitelist mode removes the card when the allow list does not match.
- No map side-effect is queued in no-rule mode for this reduced fixture.

## Risk Boundary

This is wrapper proof, not direct child-renderer proof.

Direct `watchCardHeroVideoRenderer` remains a separate direct-renderer gap.
Direct `watchCardRichHeaderRenderer` remains a separate direct-renderer gap.
Direct `watchCardRHPanelVideoRenderer` remains a separate direct-renderer gap.

The raw hero video ID is under
`callToAction.watchCardHeroVideoRenderer.navigationEndpoint.watchEndpoint.videoId`,
while the current wrapper rule names
`callToAction.watchCardHeroVideoRenderer.watchEndpoint.videoId`. That means the
current wrapper decision is proven for title/channel identity, but the hero
video ID path still needs a future path-policy decision before video-ID behavior
or map side effects rely on it.

The same raw source also contains `searchRefinementCardRenderer` and
`compactChannelRenderer` tokens. Those remain separately pinned as direct-rule
gaps and are not made safe by the universal watch-card wrapper proof.

## Future Authority Fields

No product runtime symbol exists yet for:

- `mainSearchUniversalWatchCardContract`
- `mainSearchUniversalWatchCardFixtureAdmissionReport`
- `mainSearchUniversalWatchCardDecisionReport`
- `mainSearchUniversalWatchCardWhitelistPolicy`
- `mainSearchUniversalWatchCardHeroVideoPathPolicy`
- `mainSearchDirectWatchCardChildRendererPolicy`
- `mainSearchEscapedYtInitialDataAdmissionReport`
- `mainSearchWatchCardSiblingLeakReport`
- `mainSearchWatchCardMetricArtifact`
- `mainSearchWatchCardJsonFirstOptimizationBudget`

This document and its test are audit evidence only. They do not permit renderer
expansion, direct child-renderer behavior changes, endpoint admission changes,
search refinement changes, compact-channel changes, video-map behavior changes,
or whitelist optimization changes.

## Executable Proof

```bash
node --test tests/runtime/main-search-universal-watch-card-current-behavior.test.mjs
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
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
