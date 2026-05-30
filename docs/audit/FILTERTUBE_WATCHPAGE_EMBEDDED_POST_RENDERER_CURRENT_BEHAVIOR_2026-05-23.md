# FilterTube Watchpage Embedded PostRenderer Current Behavior - 2026-05-23

Status: current-behavior audit only. Runtime behavior is unchanged. This is not an implementation patch.

This slice classifies `watchpage.json` before it can be used as runtime proof.
The file name suggests watch evidence, but the raw container is Markdown/planning
text followed by a `var ytInitialData` object. Direct `JSON.parse(watchpage.json)`
throws. Brace-balanced extraction of the embedded object succeeds and shows
`twoColumnBrowseResultsRenderer` rich-grid content with `FEwhat_to_watch`
tracking values, not `twoColumnWatchNextResults`.

## Raw Evidence

| Property | Current value |
| --- | --- |
| Raw capture | `watchpage.json` |
| SHA-256 | `baf8a78adbbc5509c3ab50e4a26131ba294293771b89666498f34324cbd82ab3` |
| Bytes | `4,572,676` |
| Lines | `32,116` |
| Container | Markdown/planning text followed by `var ytInitialData` |
| Direct JSON parse | throws |
| Embedded object byte span | `10,468..4,572,046` |
| Embedded object bytes | `4,561,578` |
| Embedded renderer family | Main browse/feed rich-grid community posts |
| Watch-next classification | not watch-next evidence |

The embedded object contains:

```text
route classification: browse/feed, not watch-next
postRenderer keys: 2
lockupViewModel keys: 24
shortsLockupViewModel keys: 18
raw text postRenderer tokens: 3
```

The two real `postRenderer` keys are at:

```text
contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[8].richSectionRenderer.content.richShelfRenderer.contents[0].richItemRenderer.content.postRenderer
contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents[8].richSectionRenderer.content.richShelfRenderer.contents[1].richItemRenderer.content.postRenderer
```

## Reduced Fixture

Committed fixture:

```text
tests/runtime/fixtures/captures/main-watchpage-embedded-post-renderer.json
```

The fixture keeps the smallest proof-bearing shape:

| Captured post | Author identity | Current runtime result |
| --- | --- | --- |
| `UgkxbkKMP-U6ZR_IUiFqrBDUhWEdFIk37hEi` | `UC20a2HcBo8q8BgvQU-nBgnQ`, `/@TheTVPolicePodcast` | Visible in blocklist and whitelist modes; queues one channel-map side effect. |
| `UgkxyLtYdDcc1lM36Y7FYV1EqYgH3bXqOWKm` | `UCXRt-HjEaTF6J6regWoopjw`, `/@Russianlanguage` | Visible in blocklist and whitelist modes; queues one channel-map side effect. |

## Current Runtime Behavior

Runnable proof:

```text
tests/runtime/watchpage-embedded-post-renderer-current-behavior.test.mjs
```

Current behavior pinned by the test:

| Mode | Rule | Captured `postRenderer` result | Side effect |
| --- | --- | --- | --- |
| Blocklist | keyword `Nastya` | Both posts remain visible. | Two `FilterTube_UpdateChannelMap` messages. |
| Blocklist | channel `UCXRt-HjEaTF6J6regWoopjw` / `@Russianlanguage` | Both posts remain visible. | Two `FilterTube_UpdateChannelMap` messages. |
| Whitelist | channel `UC20a2HcBo8q8BgvQU-nBgnQ` / `@TheTVPolicePodcast` | Both posts remain visible. | Two `FilterTube_UpdateChannelMap` messages. |
| Whitelist | nonmatching keyword | Both posts remain visible. | Two `FilterTube_UpdateChannelMap` messages. |

This is a leak/allow-mode gap for modern `postRenderer`: the runtime can harvest
author identity recursively, but there is no direct `FILTER_RULES.postRenderer`
or `FILTER_RULES.sharedPostRenderer` entry. Legacy `backstagePostRenderer` and
`backstagePostThreadRenderer` are covered, which means a supported backstage
sibling can be filtered while these modern `postRenderer` rows stay visible.

## Audit Interpretation

This extraction advances JSON-first coverage because it turns a raw embedded
`ytInitialData` community-post shape into a committed current-behavior fixture.
It does not close watch/next proof obligations: end-screen DOM walls,
`compactAutoplayRenderer`, watch-card RHS/hero/header renderers, playlist shell
policy, `/next` no-rule pass-through, and `/player` metadata-only behavior still
need separate watch-surface fixtures.

It also does not close clean Main post/community DOM insertion proof. The raw
fixture is JSON, not a native DOM action-menu fixture, and it does not prove
where a FilterTube menu item can be inserted without false hides or duplicate
controls.

The implementation gate remains closed until a future behavior patch has:

```text
postRenderer rule coverage decision
sharedPostRenderer rule coverage decision
JSON path provenance for post author/title/content fields
blocklist and whitelist sibling-preservation fixtures
DOM post action-menu insertion fixture
watch/feed route classification policy
channel-map side-effect permission
no-rule and disabled-mode work budgets
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this watch/player/end-screen surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, watch-card behavior, player behavior,
end-screen behavior, whitelist behavior, metric collectors, artifact creation,
native sync, release package changes, or public claims.
