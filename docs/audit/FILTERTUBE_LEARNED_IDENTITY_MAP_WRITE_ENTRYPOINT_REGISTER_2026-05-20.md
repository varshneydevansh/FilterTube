# FilterTube Learned Identity Map Write Entrypoint Register - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

This register narrows the learned-identity audit from "maps are powerful" to
"which entrypoints can currently write those maps or make them affect runtime."
It exists because `channelMap`, `videoChannelMap`, and `videoMetaMap` are not
visible rule rows, but they can later influence channel matching, menu labels,
compiled settings, DOM stamping, and DOM fallback reruns.

## Current Entrypoint Flow

```text
YouTube JSON/player data
  -> filter_logic.js queue/register helpers
  -> window.postMessage(FilterTube_Update*Map)
  -> content_bridge.js handleMainWorldMessages
  -> content-side currentSettings patch
  -> background runtime message update*Map
  -> background pending map queues
  -> compiledSettingsCache patch
  -> debounced storage flush
  -> possible DOM stamp / DOM fallback rerun

DOM/menu/resolver/action paths
  -> persistChannelMappings / persistVideoChannelMapping / persistVideoMetaMapping
  -> same background queues and cache/storage effects
  -> optional direct DOM hide/stamp/rerun in caller
```

The current product has local validation in several producers, but not one
shared `learnedIdentityMapWriteDecision` that records source class, sender,
route, profile/list mode, confidence, allowed effect, storage/cache revision,
and DOM rerun budget for every write.

## Entrypoint Table

| Entrypoint | Current source proof | Current side effects | Boundary |
| --- | --- | --- | --- |
| Engine video-channel harvest | `js/filter_logic.js:49-79` validates video id and UC prefix, batches, then posts `FilterTube_UpdateVideoChannelMap`. | Main-world message to bridge. Later bridge/background can persist and rerun DOM fallback. | Strong producer guard exists, but receiver path does not preserve producer provenance. |
| Engine video-meta harvest | `js/filter_logic.js:85-121` validates video id and non-empty metadata, batches, then posts `FilterTube_UpdateVideoMetaMap`. | Metadata map write path can later clear DOM processed flags and rerun DOM fallback. | Needs active metadata-filter reason before metadata work is considered cheap or necessary. |
| Engine channel/custom-url harvest | `js/filter_logic.js:1491-1547` writes `this.channelMap` / `this.settings.channelMap`, then posts `FilterTube_UpdateChannelMap` or `FilterTube_UpdateCustomUrlMap`. | Channel alias map learning and direct custom URL bridge write. | Custom URL path bypasses the background enqueue path later in the bridge. |
| Card prefetch / hydration | `js/content_bridge.js:1169-1304` can persist existing stamped ids, resolved handles, Kids DOM/main-world hits, and Main DOM/main-world hits. | `persistVideoChannelMapping(...)`, direct currentSettings patch, background `updateVideoChannelMap`. | Prefetch is no-network in several branches but not no-work; it can write maps from visible DOM evidence. |
| Generic video-channel persistence helper | `js/content_bridge.js:1465-1487` writes `currentSettings.videoChannelMap` and sends `updateVideoChannelMap`. | Content cache patch plus background pending/cache/storage write. | No shared source/provenance argument is required by the helper. |
| Generic video-meta persistence helper | `js/content_bridge.js:1465-1537` writes `currentSettings.videoMetaMap`, caps entries, and sends `updateVideoMetaMap`. | Content cache patch plus background pending/cache/storage write. | Schema is cleaned locally, but no active route/rule/budget decision is recorded. |
| Video-meta DOM rerun helper | `js/content_bridge.js:1527-1554` schedules `applyDOMFallback(null)` after metadata updates; `js/content_bridge.js:1556+` clears processed metadata attrs. | Metadata map writes can wake DOM fallback. | Must stay separate from pure metadata persistence in future reports. |
| Same-window page message receiver | `js/content_bridge.js:5468-5557` accepts `FilterTube_UpdateChannelMap`, `FilterTube_UpdateVideoChannelMap`, and `FilterTube_UpdateVideoMetaMap`. | Persists maps, stamps matching cards, touches DOM flags, schedules `applyDOMFallback(null)`. | Same-window/source checks are not owned-request or provenance proof. |
| Same-window custom URL receiver | `js/content_bridge.js:5557-5568` handles `FilterTube_UpdateCustomUrlMap` by reading/writing `channelMap` directly through content storage APIs. | Direct storage write outside background enqueue/cache path. | Cache/invalidation can drift from this direct write path. |
| Post-block Shorts enrichment | `js/content_bridge.js:7873-7917` fetches visible Shorts identities with concurrency 3, sends `updateVideoChannelMap`, hides matching Shorts, refreshes settings, and reruns DOM fallback. | Post-action visible-sibling map writes and direct hides. | Needs target/fanout budget distinct from clicked target recovery. |
| Post-block playlist enrichment | `js/content_bridge.js:7924-8025` scans playlist rows, calls background watch identity, persists `videoChannelMap`, persists handle mapping, stamps rows, and hides matches. | Post-action row fanout, map writes, stamps, direct hide, possible DOM fallback rerun. | Useful leak closure, but not exact-click-only work. |
| Menu/action resolved mapping broadcast | `js/content_bridge.js:12119-12128` posts `FilterTube_UpdateChannelMap` and also calls `persistChannelMappings([mapping])`. | Dual path: same-window message plus direct content/background persistence. | Dedupe/provenance must treat this as one logical write, not two independent authorities. |
| Successful channel-block video mapping | `js/content_bridge.js:12637-12645` persists `channelInfo.videoId -> channelInfo.id` and stamps cards after a block. | User-action scoped map write and DOM stamp. | Needs mutation/action id to distinguish from passive learning. |
| Content handle resolver mapping | `js/content/handle_resolver.js:25-48` sends `updateChannelMap` and patches `currentSettings.channelMap`; `js/content/handle_resolver.js:200-224` and `263-273` post `FilterTube_UpdateChannelMap` after background/direct resolution. | ChannelMap write plus DOM fallback rerun after resolver success. | `PENDING` dedupe is local; the write lacks route/profile/list-mode reason. |
| Background channelMap queue | `js/background.js:1495-1525` trims non-empty key/value, patches `channelMapCache` and compiled caches, and schedules a 250ms flush. | Pending map, cache patch, compiled settings cache patch, debounced storage write. | Does not enforce UC/handle shape. |
| Background videoChannelMap queue | `js/background.js:1933-1670` trims non-empty video/channel values, patches caches, and schedules a 50ms flush. | Pending map, compiled cache patch, debounced storage write. | Does not enforce 11-character video ids or UC shape. |
| Background videoMetaMap queue | `js/background.js:1958-1693` cleans non-empty metadata and patches caches before a 75ms flush. | Pending map, compiled cache patch, debounced storage write. | No route/rule activity report gates metadata work. |
| Background message receiver | `js/background.js:4397-4422` accepts `updateChannelMap`, `updateVideoChannelMap`, and `updateVideoMetaMap`. | Queues learned map writes from extension senders. | Sender class/provenance is not encoded per map write. |
| Background channel-add resolver repair | `js/background.js:5468-5484` can enqueue `videoChannelMap` and handle/id `channelMap` entries after resolving a `watch:`/`shorts:` input. | User-action resolver map repair before/around rule persistence. | Should remain scoped to the channel-add action and its exact input/fanout reason. |

## Current Effect Classes

```text
passive harvest
  JSON/player/renderer identity found while processing page data

visible DOM hydration
  card/menu/prefetch path learns identity from current visible DOM or page globals

resolver repair
  watch/Shorts/Kids/channel detail lookup fills missing identity

post-action fanout
  successful block enriches visible Shorts or playlist siblings

metadata rerun
  videoMetaMap write clears DOM flags and schedules DOM fallback

direct storage bypass
  custom URL map write avoids background enqueue/cache path
```

Those classes are behaviorally different. A future optimization cannot safely
keep or delete all "map writes" as one group.

## Risks Pinned By This Register

| Risk | Why it matters |
| --- | --- |
| Producer validation is stronger than receiver validation. | `filter_logic.js` validates video/channel shape before posting, but background receivers accept non-empty strings. |
| Map writes can patch compiled settings before durable flush. | `background.js` merges pending `videoChannelMap` updates into compiled settings and patches caches immediately. |
| Map writes can wake DOM fallback. | Page-message video-channel and video-meta receivers can run or schedule `applyDOMFallback(null)`. |
| Direct custom URL storage bypasses background cache authority. | Content bridge can write `channelMap` directly, so background cache and invalidation behavior can drift. |
| Post-action fanout can learn and hide visible siblings. | Shorts/playlist enrichment protects against leaks but also spends network/map/hide work beyond the clicked target. |
| No shared provenance object exists. | There is no one record tying each write to source tier, route, profile, list mode, active rule, sender, confidence, revision, and allowed effects. |

## Required Future Report

Before pruning, merging, hardening, or trusting any learned map write more
strongly, the patch needs a report with at least:

```text
learnedIdentityMapWriteDecision
  owner module and function
  sender class and tab/url proof
  source class: JSON/player | DOM | page message | resolver | import | Nanah | action fanout
  route/surface
  profile id/type and list mode
  active rule family that can use the data
  input key/value and validated normalized output
  confidence: canonical | joinedByVideoId | displayOnly | fallback | unknown
  allowed effects: persist | patch cache | enter compiled settings | stamp DOM | rerun DOM | hide | stats
  target scope: exact target | visible siblings | background cache only
  dedupe/cache key
  storage keys and invalidation keys
  revision/freshness/TTL
  positive fixture and negative sibling-visible fixture
```

## Missing Runtime Authority

No runtime symbol exists yet for:

- `learnedIdentityMapWriteDecision`
- `learnedIdentityMapWriteAuthority`
- `identityMapProvenanceReport`
- `mapWriteRevisionPolicy`
- `mapWriteEffectBudget`

Until those exist, learned identity remains useful current plumbing, not a
complete authority for future false-hide, leak, or performance changes.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this learned identity map write entrypoint
register can support runtime optimization or JSON-first promotion. Current
proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, method deletion, method merging, lifecycle
cleanup, no-work changes, or whitelist behavior changes.
