# FilterTube Main Watch Initial Lockup Shorts JSON Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch.

This slice extracts the first committed reduced fixture from `YT_MAIN.json`.
The important classification result is negative: `YT_MAIN.json` is
not Main browse/search completion proof. It is a mixed raw capture that starts with a
large watch initial JSON fragment and later includes a separate player JSON
fragment after the text marker `player?prettyprint=false`; that second fragment
is now covered by a separate metadata-only fixture.

## Raw Capture Classification

| Evidence | Current value |
| --- | --- |
| Raw source | `YT_MAIN.json` |
| Raw SHA-256 | `64c7861ff6baa76816082479f5bdda591faef3e72e2510e6da80866cba1c3357` |
| Raw bytes | `4951099` |
| Logical lines | `50481` |
| Whole-file `JSON.parse` | fails because extra captured text follows the first object |
| Parsed top-level fragments | `2` |
| Fragment 0 | line `1`, `4826868` bytes, SHA-256 `9598bbddb384791ba7553cc98e54f0154fd76a7346a78e5b360eca0f69768fed` |
| Fragment 1 | line `47533`, `124193` bytes, SHA-256 `a54a51cc0624c21ea56f442b11166200be7c0345ab4d027ddad3d860855d7c73` |

Parsed fragment 0 is watch initial data. It contains:

```text
20 lockupViewModel keys
30 shortsLockupViewModel keys
1 reelShelfRenderer key
4 continuationItemRenderer keys
0 videoRenderer keys
0 richItemRenderer keys
0 gridVideoRenderer keys
0 channelRenderer keys
```

That means `YT_MAIN.json` should not be used as proof for Main browse/search
grid, channel-row, or home-feed renderer coverage. It is useful for JSON-first
watch initial data coverage: watch rail `lockupViewModel` rows, a Shorts remix
shelf, continuation scaffolding, and the boundary between initial watch JSON
and later player JSON.

## Reduced Fixture

| Fixture field | Value |
| --- | --- |
| Minimal fixture | `tests/runtime/fixtures/captures/main-watch-initial-lockup-shorts-json.json` |
| Fixture kind | `json` |
| Fixture SHA-256 | `274f7b1f766aa43f7194fe0f8c601ac1316f713c43b1aff9a1a1e73b6128d1bb` |
| Fixture bytes | `12468` |
| Fixture lines | `296` |
| Route | `watch` |
| Renderer paths | `lockupViewModel`, `shortsLockupViewModel` |
| Release input allowed | `false` |

The fixture keeps one reduced watch lockup sibling set from
`contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results`
and one reduced Shorts remix shelf from
`engagementPanels.5.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items.3.reelShelfRenderer.items`.

## Current Behavior Matrix

| Mode | Current result | Risk pinned |
| --- | --- | --- |
| No rule | Preserves watch lockups `8Li0Tyeqlc4`, `6IQUsbxUyYw`, and `RDGMEM0s70dY0AfCwh3LqQ-Bv1xg`; preserves Shorts `_NsY2tXTveU` and `lJ4Ty2Xos08`; preserves the continuation item. | JSON-first optimization must not remove sibling or continuation scaffolding just because no rule hides a row. |
| No rule side effects | Queues two `FilterTube_UpdateChannelMap` messages and one `FilterTube_UpdateVideoChannelMap` message for the two decorated-avatar video lockups. | Empty/no-rule optimization needs an explicit harvest-vs-process decision before bypassing watch initial JSON. |
| Blocklist keyword | `Tron` removes only the matching first video lockup; the second video lockup, Mix row, Shorts shelf, and continuation remain. | Title filtering works for supported watch lockups, but sibling preservation is part of the contract. |
| Blocklist channel | `UCgqMjKxRWAKUvgYqgomighw` removes only the matching second video lockup. | Decorated-avatar channel identity is actionable for watch lockups. |
| Mix identity | The Mix row metadata text is keyword-searchable, but a fabricated creator channel ID does not remove it. | Display-only playlist/Mix metadata is not creator-channel authority. |
| `hideAllShorts` | Removes the `shortsLockupViewModel` items while preserving watch lockups and continuation scaffolding. | Shorts JSON handling is active inside this same watch initial fragment. |
| Whitelist channel | Allows only the matching `UCVZ2A50--jZieMK_qyMd1Yw` video lockup; unsupported lockups and Shorts are removed while continuation remains. | Whitelist watch optimization must preserve scaffolding and avoid treating unsupported Mix/Shorts identity as allowed. |
| Whitelist keyword | Allows only the matching `BTS Stage` video lockup; unsupported lockups and Shorts are removed while continuation remains. | Keyword whitelist behavior is already JSON-first for this supported watch lockup shape. |

## Optimization Implication

This slice supports continuing the audit before implementation changes. The
recent whitelist work is not enough by itself because this raw capture proves a
classification hazard: the filename can look like Main browse/search evidence,
but the actual parseable payload is watch initial JSON plus player JSON.

Before optimizing around this area, the audit still needs:

- a no-work budget decision for watch initial JSON when only map harvesting is
  needed;
- endpoint policy and no-work budgets for the second `player?prettyprint=false`
  metadata fragment, now covered as pass-through evidence;
- broader coverage for the remaining 20 watch lockups and 30 Shorts rows;
- separate Main browse/search fixtures from `logs.json`,
  `strange_ytInitialData.json`, or another true browse/search capture;
- route-scoped false-hide/leak tests before treating this capture as a generic
  JSON-first browse/search case.

## Future Authority Tokens

These names are documentation-only anchors for the audit backlog and remain
absent from product runtime source in this slice:

```text
mainWatchInitialJsonClassificationContract
mainWatchInitialLockupDecisionReport
mainWatchInitialShortsParityReport
mainWatchInitialPlayerFragmentGate
mainWatchInitialJsonFirstOptimizationGate
ytMainJsonBrowseSearchAuthority
mainWatchInitialMetricArtifact
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this Shorts/Reel/lockup surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5812
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5812
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, Shorts filtering behavior, Reel overlay
behavior, whitelist behavior, metric collectors, artifact creation, native
sync, release package changes, or public claims.
