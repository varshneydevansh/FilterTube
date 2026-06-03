# FilterTube Main Search Compact Channel Current Behavior - 2026-05-23

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This slice reduces the real Main mobile search channel result card from
`strange_ytInitialData.json` into a committed fixture before any channel-card,
whitelist, or JSON-first filtering change. It proves that
`compactChannelRenderer` is visible to traversal and map harvesting, but is not
itself a direct filtering authority today.

## Source Boundary

| Source | Current shape | Count / fingerprint |
| --- | --- | --- |
| `strange_ytInitialData.json` | `var ytInitialData = '...'` string literal with escaped JSON; not direct JSON. | 141 lines; 244,201 bytes; sha256 `01e6010a3f46041c3bcb3b6b399e871b5aa2fc28a0f234eca237226162b476b7`. |
| `js/filter_logic.js` | Existing runtime rule owner; not changed in this slice. | 3,652 lines; 172,174 bytes; sha256 `953ef0f14970e6cfbc11215fe9eaa078ced34f001908e1c6d5903a8fd2d9a1f5`. |

Raw token counts in `strange_ytInitialData.json`:

```text
compactChannelRenderer: 2
searchRefinementCardRenderer: 21
universalWatchCardRenderer: 2
```

`strange_ytInitialData.json` is not direct JSON. The whole raw file fails direct
`JSON.parse()`. The fixture is admitted as a reduced fragment from the escaped
page-global container, not as direct endpoint JSON.

## Reduced Fixture

`tests/runtime/fixtures/captures/main-search-compact-channel-renderer.json` is a
90-line, 2,113-byte reduced fixture with sha256
`ee432d365afe1ced34721060e65560cda0fec18e159ac2cfea3c1ac1cd5321d6`.

It carries the mobile search channel result:

| Renderer | Raw JSON path | Identity |
| --- | --- | --- |
| `compactChannelRenderer` | `contents.sectionListRenderer.contents[1].itemSectionRenderer.contents[1].compactChannelRenderer` | `NYUSHA MUSIC`; `UCm9VWKAFz0aXpuEHPHMae7w`; `@NYUSHAmusic` |

## Current Runtime Result

`compactChannelRenderer` has no direct `FILTER_RULES` entry today.

Pinned behavior:

- With no active rule, the reduced channel card passes through unchanged.
- No-rule processing still queues one channel-map side effect through
  `FilterTube_UpdateChannelMap` with `UCm9VWKAFz0aXpuEHPHMae7w` and
  `@NYUSHAmusic`.
- The row passes through matching keyword and channel rules in blocklist mode.
- Whitelist mode preserves the card when the captured channel is allowed.
- The row passes through whitelist non-match mode when the allow list does not
  match.
- In a sibling payload, the same channel rule removes the supported
  `universalWatchCardRenderer` sibling while leaving the `compactChannelRenderer`
  row visible.

## Risk Boundary

This is split-authority proof. The row is rich enough for channel-map harvesting,
but the row is not a direct hide/allow decision point.

That matters for the recent whitelist and JSON-first optimization discussion:
a future optimization can otherwise treat a harvested compact-channel identity
as if the row itself had already passed a whitelist policy. Today it has not.
The current behavior is a visible leak under blocklist channel, blocklist
keyword, and whitelist non-match modes.

The same raw source also contains `searchRefinementCardRenderer` and
`universalWatchCardRenderer` rows. This fixture does not change those policies:
search refinements remain separate direct-rule gaps, while the universal
watch-card wrapper remains supported only through its existing wrapper rule.

## Future Authority Fields

No product runtime symbol exists yet for:

- `mainSearchCompactChannelContract`
- `mainSearchCompactChannelFixtureAdmissionReport`
- `mainSearchCompactChannelDecisionReport`
- `mainSearchCompactChannelWhitelistPolicy`
- `mainSearchCompactChannelSideEffectReport`
- `mainSearchCompactChannelSiblingLeakReport`
- `mainSearchCompactChannelEscapedYtInitialDataAdmissionReport`
- `mainSearchCompactChannelMetricArtifact`
- `mainSearchCompactChannelJsonFirstOptimizationBudget`

This document and its test are audit evidence only. They do not permit renderer
expansion, compact-channel behavior changes, endpoint admission changes, search
refinement changes, watch-card changes, channel-map behavior changes, or
whitelist optimization changes.

## Executable Proof

```bash
node --test tests/runtime/main-search-compact-channel-current-behavior.test.mjs
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this home/search/navigation surface can
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
optimization, JSON-first behavior, home-feed behavior, search behavior,
navigation-header behavior, whitelist behavior, metric collectors, artifact
creation, native sync, release package changes, or public claims.
