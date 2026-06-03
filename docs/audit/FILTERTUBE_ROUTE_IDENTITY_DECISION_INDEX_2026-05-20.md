# FilterTube Route Identity Decision Index - 2026-05-20

Status: audit-only proof. Runtime behavior is unchanged. This is not an
implementation patch.

This index joins the JSON coverage, surface availability, resolver/fanout, and
network-reason audits into one route-level decision map. It exists because the
identity waterfall:

```text
XHR JSON -> ytInitial* -> learned maps -> DOM -> resolver/network
```

is a source-confidence priority order, not a guarantee that every route has
complete channel identity before render and not permission to hide, allow,
fetch, persist, restore, stamp, or count stats.

## Decision Classes

| Class | Meaning | Current boundary |
| --- | --- | --- |
| `direct-json-decision` | The active renderer rule consumes the field needed for the rule decision. | Still needs route, mode, side-effect, and sibling fixtures before expansion or cleanup. |
| `harvest-then-join` | JSON/player data is harvested into maps, and later visible surfaces join through `videoId` or channel maps. | A `videoId` is only a join key. Map provenance and freshness are not one shared authority today. |
| `dom-target-extraction` | The clicked or visible target is identified from rendered DOM anchors, data attributes, or text. | Stable links can be useful; visible text alone is display-only and can collide or drift. |
| `resolver-recovery` | The current target lacks enough identity, so a background or main-world resolver is used. | Resolver work must stay tied to route, profile, list mode, user action, cache state, and network policy. |
| `post-action-fanout` | After a successful channel block, visible related rows may be enriched and hidden beyond the clicked target. | Correct for same-channel cleanup, but it is not proof of unlimited page-wide work. |
| `unsupported-route-gap` | The docs or captures show a route/renderer, but current direct runtime coverage is missing or partial. | Must not be described as covered until a fixture-backed rule/effect path exists. |

## Route Decision Map

| Route / surface | Current primary decision | Why JSON may not be enough | Current fallback or join | Risk to preserve in future fixes |
| --- | --- | --- | --- | --- |
| Main home/search video cards | `direct-json-decision` for supported `videoRenderer`, `richItemRenderer`, `lockupViewModel`, and `videoWithContextRenderer`; `harvest-then-join` for learned maps. | Modern lockups and search results can hydrate late or expose only partial owner fields in the renderer being processed. | DOM target extraction, `channelMap`, `videoChannelMap`, and unresolved menu `fetchChannelDetails`. | Do not turn documented JSON fields into broad hide permission without a per-renderer effect proof. |
| Main watch current video | `harvest-then-join` from `ytInitialPlayerResponse`, `/player`, `/next`, and `videoChannelMap`. | The watch DOM can show stale SPA owner rows, while URL/DOM often only proves `v=VIDEO_ID`. | `watch:VIDEO_ID` resolver and watch HTML fallback after map/cache checks. | Current-video hide/pause/skip effects require stronger proof than owner identity alone. |
| Shorts | `harvest-then-join` where player/renderer data exists; DOM often starts as video-id-only. | Shorts DOM commonly exposes `/shorts/VIDEO_ID` without owner/title metadata. | `shorts:VIDEO_ID`, background Shorts identity resolver, then `videoChannelMap` stamping. | Whitelist fail-closed behavior and blocklist leaks must be tested separately for map-hit and map-miss states. |
| Watch rail / end screen / compact autoplay | Mixed `direct-json-decision` and `unsupported-route-gap`. `endScreenVideoRenderer`, `compactVideoRenderer`, and wrapped watch cards have some coverage; compact autoplay and direct watch-card renderers remain gaps. | Player overlay DOM and some watch card renderers are not ordinary card JSON or ordinary DOM card targets. | `videoChannelMap`, DOM rail extraction, `watch:VIDEO_ID` resolver. | End-screen/player work can affect playback/recommendation surfaces, so JSON coverage is not enough by itself. |
| Watch playlist / Mix | Playlist panel rows can be `direct-json-decision` or `harvest-then-join`; Mix identity can be playlist/seed-first rather than channel-first. | Mix/radio/playlist renderers can lack owner channel identity or expose playlist creator identity that is not the video owner. | Row `videoId`, `videoChannelMap`, selected-row guards, and `watch:VIDEO_ID` resolver. | Preserve selected/current row behavior and avoid treating playlist identity as channel identity. |
| YouTube Kids | `direct-json-decision` when `kidsVideoOwnerExtension` or compact owner fields exist. | Public Kids web DOM can expose only video ids, sparse labels, or setup/parent surfaces. | Kids watch cache/map lookup, then `https://www.youtubekids.com/watch?v=VIDEO_ID` resolver. | Kids is not globally zero-network; route/profile proof is required before pruning fallback. |
| YouTube Music | Supported `videoWithContextRenderer` paths can be direct; compact playlist and sheet/collab surfaces are partial. | `ytm-*` DOM text can mix title, artist, album, and metadata; some JSON sheets are not filter-logic authority. | YTM `videoChannelMap` join, main-world lookup, or watch resolver when only video id is stable. | Do not reuse Main DOM assumptions for mobile/YTM compact rows without route fixtures. |
| Collaborator / showDialog / showSheet | `showDialogCommand` can be direct identity evidence; `showSheetCommand` is stronger in bridge/injector paths than in filter logic. | Avatar stacks and sheet rosters can be display-only, incomplete, or not consumed by the direct filter rule. | Collaborator cache, main-world lookup, DOM menu target extraction, channel-details fallback. | Separate sharer/collaborator/original-owner effects before hiding or persisting. |
| Posts / comments / community | Some comment/post JSON author endpoints are direct; modern posts and shared posts remain split. | DOM author text and action menu anchors can be display-only or can refer to sharer versus original author. | Author endpoint when present, DOM target extraction, channel-details fallback for unresolved action targets. | Comments/posts need target-specific hide/restore proof, not generic card behavior. |

## Current Source Proof

- `js/seed.js:197-381` proves that endpoint/body processing can still call
  `FilterTubeEngine.harvestOnly(...)` when the engine skips mutation.
- `js/filter_logic.js:1174-1367` proves player, playlist-panel, renderer, and
  Kids owner identity harvesting into learned maps.
- `js/filter_logic.js:1615` proves `compactPlaylistRenderer` is traversal
  context rather than a direct `FILTER_RULES` authority.
- `js/filter_logic.js:3000-3027` proves direct collaborator parsing currently
  centers on `showDialogCommand`.
- `js/content_bridge.js:3792-3801` proves bridge-side sheet/dialog roster paths
  include `showSheetCommand` variants that are not equivalent to direct filter
  logic authority.
- `js/content_bridge.js:7722-8008` proves post-block Shorts and playlist fanout
  can inspect visible siblings and call Shorts/watch identity resolvers.
- `js/content_bridge.js:8051-8120` proves Shorts identity can use background
  resolver first and direct page fallback only when explicitly allowed.
- `js/content_bridge.js:12167-12224` proves no-identifier watch/Shorts/playlist
  actions route through `watch:VIDEO_ID` or `shorts:VIDEO_ID`.
- `js/content/dom_fallback.js:593-679` proves current watch owner DOM is treated
  as stale-prone and can be superseded by `videoChannelMap[videoId]`.
- `js/background.js:2877-3102` proves Shorts, Kids watch, and Main watch
  background resolvers check stored maps/caches before credentialed HTML fetch.

## Required Future Decision Report

Before any route optimization, fallback deletion, renderer expansion, or
simultaneous allow/block migration depends on this waterfall, the patch must
produce a route decision report:

```text
routeIdentityDecision
  route / surface
  renderer family or DOM target family
  profile id/type and viewing space
  list mode and active rule family
  source tier before decision
  confidence class: canonical | joinedByVideoId | displayOnly | fallback | unknown
  decision class from this index
  exact target versus visible-sibling fanout
  allowed effects: hide | allow | restore | stamp | persist | fetch | stats | media | none
  forbidden effects
  resolver reason and credential policy when used
  positive fixture and negative sibling fixture
  restore/teardown/no-work proof
```

No runtime symbol exists yet for:

- `routeIdentityDecision`
- `routeIdentityDecisionIndex`
- `routeIdentityDecisionAuthority`
- `routeIdentitySourceEffectReport`

This index is an audit map only. It does not authorize changing source trust,
DOM fallback, resolver behavior, whitelist fail-closed behavior, post-action
fanout, or no-work optimization.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this route identity decision index can
support runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5720
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5720
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, route/surface effect changes, identity
source-tier changes, metric fixture approvals, no-work changes, or whitelist
behavior changes.
