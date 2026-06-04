# FilterTube YTM Browse Channel List Item Current Behavior - 2026-05-23

Status: audit-only current-behavior fixture slice. Runtime behavior is unchanged.
This is not an implementation patch, renderer expansion, selector patch, or
YTM optimization patch.

## Scope

This slice reduces one direct JSON `ytm_browse?prettyPrint=false.json` channel
list payload into a two-row `channelListItemRenderer` fixture. The goal is to
pin the current JSON-first boundary before any optimization treats YTM browse
channel rows as first-class block or allow targets.

## Source Facts

```text
raw source: ytm_browse?prettyPrint=false.json
raw shape: direct JSON object
raw sha256: 4444c7dcb6b6a884846a19169bed286f1019cd7275a6d1292392b1c1de95bdf8
raw lines: 52334
raw bytes: 3005515
client: MWEB
route: browse FEchannels
root path: contents.singleColumnBrowseResultsRenderer.tabs.0.tabRenderer.content.sectionListRenderer.contents.0.shelfRenderer.content.verticalListRenderer.items
parsed channelListItemRenderer rows: 983
raw channelListItemRenderer tokens: 984
parsed browseEndpoint keys: 984
parsed sectionListRenderer keys: 1
parsed shelfRenderer keys: 1
parsed verticalListRenderer keys: 1
fixture: tests/runtime/fixtures/captures/ytm-browse-channel-list-item-renderer.json
fixture lines: 160
fixture bytes: 7767
fixture sha256: 80671c2e814098a75a37406635ccfc839e9ddb43069885a73e05bdd6259ce19e
```

## Reduced Rows

| Row | Channel title | Channel ID | Canonical handle | Raw start line |
| --- | --- | --- | --- | ---: |
| 0 | `Kshatriya Dharma` | `UCBvMrvqRUpaHHvQt7M0cIuQ` | `/@KshatriyaDharma` | 95 |
| 1 | `*NSYNC` | `UCjkyfFH-MWZhasolgds05EA` | `/@OfficialNSYNC` | 146 |

## Current Runtime Behavior

`channelListItemRenderer` is not a direct `FILTER_RULES` entry today. Processing
the reduced YTM browse response currently preserves both channel rows in:

- no-rule blocklist mode,
- matching keyword blocklist mode,
- matching channel blocklist mode,
- whitelist allow mode,
- whitelist non-match mode.

The same pass-through processing still queues two `FilterTube_UpdateChannelMap`
messages, one for each captured browse endpoint:

```text
UCBvMrvqRUpaHHvQt7M0cIuQ -> @KshatriyaDharma
UCjkyfFH-MWZhasolgds05EA -> @OfficialNSYNC
```

This is the important split for JSON-first work: current code can harvest YTM
browse channel identity from the JSON tree, but that harvest is not permission
to hide or allow the channel-list rows.

## Risk Before Optimization

| Risk class | Current boundary |
| --- | --- |
| Reliability | A future direct rule must distinguish channel-list rows from video cards and shelves. |
| False-hide/leak | The rows carry UC IDs and handles but currently pass through blocklist and whitelist modes. A broad channel-row promotion could unexpectedly hide a user channel directory or, if left unchanged, leak blocked channels. |
| Performance | The raw capture has 983 channel rows, so repeated whole-tree traversal and map side effects need an explicit budget before adding per-row decisions. |
| Code burden | YTM browse proof currently sits across raw capture inventory, direct JSON traversal, map harvest, route/profile classification, and YTM DOM fallback reports. |

## Future Proof Required

Before changing `channelListItemRenderer` behavior, add a fixture-backed policy
that names:

```text
ytmBrowseChannelListItemContract
ytmBrowseChannelListItemDecisionReport
ytmBrowseChannelListItemWhitelistPolicy
ytmBrowseChannelListItemSideEffectBudget
ytmBrowseChannelListItemSiblingPreservationFixture
ytmBrowseChannelListItemRoutePolicy
ytmBrowseChannelListItemMetricArtifact
ytmBrowseChannelListItemJsonFirstGate
```

None of those authority symbols exists in product runtime source today.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this YouTube Music/YTM surface can support
runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, YTM behavior, Music surface behavior,
whitelist behavior, metric collectors, artifact creation, native sync, release
package changes, or public claims.
