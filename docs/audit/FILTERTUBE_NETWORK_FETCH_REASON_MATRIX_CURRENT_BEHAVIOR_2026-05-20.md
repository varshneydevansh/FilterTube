# FilterTube Network Fetch Reason Matrix - Current Behavior - 2026-05-20

Status: audit-only proof. This is not an implementation patch.

Runtime behavior is unchanged.

## Why This Slice Exists

The identity waterfall says where channel and video identity can come from:

```text
YouTubei / ytInitial* JSON
        -> learned maps and page globals
        -> DOM extraction
        -> bounded network fallback
```

That source order is not enough to judge performance or YouTube-visible side
effects. A network fetch can be:

- passive response interception already caused by YouTube,
- explicit user import,
- menu-open enrichment,
- clicked-target retry,
- metadata hydration,
- DOM repair fallback,
- post-block fanout,
- website-only analytics or assets.

Those reasons have different risk. The current runtime has local guards and
caches, but no shared fetch-reason authority that records owner, trigger,
sender class, route, profile, active-rule reason, credential policy, budget,
dedupe key, and follow-up side effects.

## Current Reason Matrix

| Owner | Entry point | Network target | Reason class today | Current guard | Follow-up effect | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Seed page transport | `window.fetch` / `XMLHttpRequest` wrappers in `js/seed.js` | YouTubei responses already requested by YouTube | `passive_youtubei_intercept` | URL substring marks and later settings checks | parse, harvest, mutate, response rewrite | Empty/disabled states can still pay parse/stringify or harvest cost before no-work proof. |
| Release notes | `loadReleaseNotesData()` / dashboard release notes | extension `data/release_notes.json` | `extension_resource` | extension URL only | public copy / prompt payload | Low YouTube impact, but release-claim authority must keep it separate from filtering runtime. |
| Subscription import | `FilterTube_RequestSubscriptionImport` in main-world injector | `/youtubei/v1/browse` POST with credentials | `explicit_subscription_import` | content bridge request id and timeout; user flow owns the request | progress/results to isolated bridge | Intended user action, but not governed by a shared network authority token. |
| Watch metadata queue | `processWatchMetaFetchQueue()` -> `fetchVideoMetaFromWatchUrl()` | `https://www.youtube.com/watch?v=VIDEO_ID` | `metadata_fetch` | video id string; Kids host early return; queue/concurrency local state | `videoMetaMap` write and DOM rerun | Same-origin YouTube-visible fetch lacks a shared metadata reason/budget. |
| Shorts identity bridge | `fetchChannelFromShortsUrl()` -> `fetchShortsIdentity` | background `https://www.youtube.com/shorts/VIDEO_ID`; optional direct `/shorts/VIDEO_ID` | `identity_fallback` | video id validation, expected handle compare, in-flight cache | map/stamp/retry block action | Background path and direct fallback are separate reasons, not one policy. |
| Watch identity bridge | `fetchWatchIdentityFromBackground()` -> `fetchWatchIdentity` | background Kids/watch HTML fetches | `identity_fallback` | video id validation, profileType derived from host, in-flight cache | playlist/row stamping, channel map writes, DOM rerun | Main and Kids can fall back differently; no shared surface reason or per-navigation budget. |
| Fallback menu enrichment | fallback dropdown pending fetch in `content_bridge.js` | `fetchChannelDetails` background channel page fetch | `menu_open_enrichment` | local name/lookup checks only | injected menu label and card identity stamping | Menu-open network fetch is possible when no video id exists and name is weak. |
| DOM handle repair | `fetchIdForHandle(... backgroundOnly: true)` in `js/content/handle_resolver.js` | background `fetchChannelDetails` | `dom_repair_fallback` | channelMap lookup, pending marker, handle normalization | `FilterTube_UpdateChannelMap`, DOM fallback rerun | Broad DOM fallback can escalate unresolved handles into background channel fetch work. |
| Direct handle resolver | `fetchIdForHandle(... backgroundOnly: false)` | same-origin `/@handle/about` then `/@handle` | `direct_handle_fallback` | `skipNetwork` flag and pending marker | local handle cache and channel id result | Exists as a separate direct content-script fetch path. |
| Background persistent add | `addFilteredChannelPersistent` branch | `fetchChannelInfo()` channel page fetch | `explicit_rule_mutation_lookup` | duplicate checks and list mode branch | storage write, channelMap write, backup | User-visible mutation path, but no sender/reason fetch budget report. |
| Background channel add | `handleAddFilteredChannel()` | watch/Shorts/Kids fetches and `fetchChannelInfo()` | `clicked_target_retry` | input normalization, video id validation, local metadata skip | storage writes, map writes, post-block enrichment | One channel-add action can try video identity, channel page, watch fallback, playlist repair. |
| Post-block enrichment | `schedulePostBlockEnrichment()` | delayed `handleAddFilteredChannel(id, source: postBlockEnrichment)` | `post_action_fanout` | UC id, topic skip, 6-hour attempt window, pending queues | channel row repair and cache writes | Triggered after a successful block, not passive page filtering, but still YouTube-visible later. |
| Background message fetch | `fetchChannelDetails` branch | `fetchChannelInfo(request.channelIdOrHandle)` | `caller_requested_channel_fetch` | no shared trusted sender / active reason gate in this branch | response to caller | Caller-provided fetch work remains a trust and performance boundary. |
| Website remotes | Vercel Analytics and CDN logos | website-only remotes | `public_website_remote` | website bundle only | page-view analytics / images | Must never be described as extension/app runtime collection. |

## Source Snippets

```text
js/background.js
  handleFetchShortsIdentityMessage() -> performShortsIdentityFetch()
  handleFetchWatchIdentityMessage() -> performKidsWatchIdentityFetch() || performWatchIdentityFetch()
  fetchChannelDetails -> fetchChannelInfo(request.channelIdOrHandle)
  handleAddFilteredChannel() -> performWatchIdentityFetch(), performShortsIdentityFetch(), fetchChannelInfo()
  schedulePostBlockEnrichment() -> delayed handleAddFilteredChannel()

js/content_bridge.js
  fetchVideoMetaFromWatchUrl() -> direct watch HTML metadata fetch
  fetchChannelFromShortsUrl() -> background resolver, optional direct shorts fetch
  fetchWatchIdentityFromBackground() -> background resolver
  fallback menu pending fetch -> fetchChannelDetails

js/content/handle_resolver.js
  fetchIdForHandle(backgroundOnly) -> fetchChannelDetails
  fetchIdForHandle(direct) -> /@handle/about and /@handle

js/injector.js
  FilterTube_RequestSubscriptionImport -> /youtubei/v1/browse POST
```

## What Is Missing

No shared runtime authority exists yet for:

- `networkFetchReasonAuthority`
- `networkFetchReasonDecision`
- `passiveInterceptWorkBudget`
- `metadataFetchReasonBudget`
- `identityFallbackFetchBudget`
- `postActionFetchFanoutBudget`
- `noRuleNetworkFetchCounter`

Without that authority, the code can have useful local guards and still fail to
answer the core audit questions:

```text
Who requested this fetch?
Was it passive, user initiated, or post-action fanout?
Which profile, route, surface, and list mode allowed it?
Which active rule or metadata gap required it?
Which credentials policy applied?
What is the dedupe key and max-per-navigation budget?
What DOM, map, storage, stats, or rerun side effect follows?
```

## Implementation Boundary

Do not remove or broaden any network fallback from this matrix until the exact
reason has positive and negative fixtures:

- active block/allow behavior still works when JSON/DOM/maps are insufficient,
- disabled and empty modes do not fetch,
- user actions can still resolve the clicked target,
- post-action enrichment is bounded and deduped,
- Kids, Shorts, watch, playlist, and YTM behavior stays route-specific,
- non-matching siblings remain visible,
- learned maps record provenance and confidence.

This matrix is proof of current split fetch reasons, not permission to change
fetch behavior.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network fetch reason matrix can support
runtime optimization or JSON-first promotion. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5681
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5681
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint rewrites, fetch/XHR no-work
changes, network authority changes, or whitelist behavior changes.
