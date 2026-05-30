# FilterTube JSON-First Network Snapshot Consumer Effect Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, effect-boundary patch,
or permission to change JSON filtering behavior.

## Purpose

This register connects network snapshot consumers to their current side effects.
The existing network snapshot proof layers show which roots are stored, which
roots are read, which roots win, and how much traversal is currently bounded.
This register adds the effect boundary: which code paths only return snapshot
evidence, which paths cache it, and which bridge-side callers can turn that
evidence into DOM stamps, learned-map writes, DOM fallback reruns, or
collaborator card updates.

The current boundary is:

```text
Injector channel-info requests read snapshot roots and emit one
FilterTube_ChannelInfoResponse without persisting, stamping, or rerunning DOM
fallback. Injector collaborator-info requests can update the injector-local
collaborator cache and emit one FilterTube_CollaboratorInfoResponse. Content
bridge ChannelInfoResponse handling only resolves a pending request; caller
paths decide whether to stamp DOM or persist videoChannelMap. Content bridge
CollaboratorInfoResponse handling resolves the pending request and can call
applyResolvedCollaborators immediately for non-empty collaborator lists.
FilterTube_UpdateVideoChannelMap page messages are a separate direct learned-map
and DOM-stamp path.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_TRAVERSAL_BUDGET_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_LEARNED_IDENTITY_MAP_WRITE_ENTRYPOINT_REGISTER_2026-05-20.md`

## Current Counts

```text
consumer effect-boundary source files: 2
injector channel info response postMessage sites: 1
injector channel info storage/message/persist/stamp/rerun sites: 0
injector collaborator info response postMessage sites: 1
injector collaborator cache update callsites inside request handling: 2
content bridge channel response pending resolve sites: 1
content bridge channel response persist/stamp/rerun sites: 0
content bridge collaborator response pending resolve sites: 1
content bridge collaborator response applyResolvedCollaborators sites: 1
content bridge update video-channel map persist sites: 1
content bridge update video-channel map stamp sites: 2
content bridge update video-channel map DOM fallback mentions: 2
content bridge prefetch snapshot lookup sites: 2
content bridge prefetch persist video-channel map sites: 3
content bridge search wrapper positive cache writes: 1
content bridge search wrapper negative cache writes: 2
runtime channel request no-cache fixtures: 1
runtime collaborator local-cache fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Effect Boundary Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Injector collaborator request | `js/injector.js:1913` through `js/injector.js:1960` | Reads cache, searches snapshot roots, may call `cacheCollaboratorsIfBetter(...)`, then posts `FilterTube_CollaboratorInfoResponse`. | Snapshot evidence can become injector-local cache state, but the response carries no source/effect decision or settings revision. | Per-response provenance, cache freshness, and allowed-effect report. |
| Injector channel request | `js/injector.js:1963` through `js/injector.js:1989` | Searches snapshot roots and posts `FilterTube_ChannelInfoResponse`. | The injector does not persist or stamp channel identity here, so callers own the side-effect decision. | Response effect contract tying lookup result to later map/DOM changes. |
| Bridge channel-info wrapper | `js/content_bridge.js:7350` through `js/content_bridge.js:7448` | Calls main-world request, caches positive responses and negative TTLs, and returns data. | Cache state is local to content bridge and lacks source freshness or route/profile policy. | Cache key, TTL, negative-cache, and expected-field provenance report. |
| Bridge prefetch caller | `js/content_bridge.js:1228` through `js/content_bridge.js:1304` | Uses DOM evidence or main-world snapshot lookup, stamps channel identity, and persists `videoChannelMap` when a UC ID exists. | Caller converts evidence into map and DOM side effects; this is not owned by the injector response itself. | Caller effect budget and exact-card/sibling-visible proof. |
| Bridge video-channel map page message | `js/content_bridge.js:5482` through `js/content_bridge.js:5530` | Persists learned `videoChannelMap`, stamps matching cards or anchor-derived cards, and schedules DOM fallback. | JSON/player harvest messages can cause direct DOM updates and later refilter work. | Page-message sender/provenance and DOM rerun budget. |
| Bridge collaborator response | `js/content_bridge.js:5570` through `js/content_bridge.js:5594` | Resolves a pending request and calls `applyResolvedCollaborators(...)` for non-empty lists. | Snapshot collaborator evidence can update visible collaborator state immediately. | Collaborator source/effect decision and mismatch/sibling proof. |
| Bridge cached collaborator page message | `js/content_bridge.js:5623` through `js/content_bridge.js:5661` | Accepts `FilterTube_CacheCollaboratorInfo`, stamps missing video IDs from anchors, and applies collaborators with `sourceLabel: 'xhr'`. | JSON/XHR collaborator cache messages can affect DOM without a shared consumer authority. | Page-message provenance and target scope report. |
| Bridge channel response | `js/content_bridge.js:5662` through `js/content_bridge.js:5672` | Resolves pending channel info with `channel || null`. | The response handler itself has no map write, stamp, or DOM rerun effect; side effects happen in the awaiting caller. | Awaiting-caller effect classification. |

## Source-Derived Rows

```text
injectorChannelResponseEffect: one postMessage response, no storage, no sendMessage, no persistVideoChannelMapping, no stampChannelIdentity, no applyDOMFallback
injectorCollaboratorResponseEffect: one postMessage response plus injector-local collaborator cache update path
bridgeChannelResponseEffect: pending request resolution only
bridgeCollaboratorResponseEffect: pending request resolution plus applyResolvedCollaborators for non-empty collaborators
bridgeVideoChannelMapMessageEffect: persistVideoChannelMapping, stampChannelIdentity, requestAnimationFrame applyDOMFallback
bridgePrefetchSnapshotEffect: main-world snapshot lookup can lead to stampChannelIdentity and persistVideoChannelMapping
bridgeSearchWrapperEffect: positive/negative TTL cache only, no map persistence or DOM mutation
```

Anchor map:

```text
injectorCollaboratorRequestStart: `js/injector.js:1913`
injectorCollaboratorSnapshotSearch: `js/injector.js:1928`
injectorCollaboratorCacheUpdates: `js/injector.js:1935` and `js/injector.js:1938`
injectorCollaboratorResponse: `js/injector.js:1950`
injectorChannelRequestStart: `js/injector.js:1963`
injectorChannelSnapshotSearch: `js/injector.js:1970`
injectorChannelResponse: `js/injector.js:1976`
bridgePrefetchKidsSnapshotLookup: `js/content_bridge.js:1246`
bridgePrefetchKidsPersist: `js/content_bridge.js:1256`
bridgePrefetchNormalSnapshotLookup: `js/content_bridge.js:1293`
bridgePrefetchNormalPersist: `js/content_bridge.js:1303`
bridgeUpdateVideoChannelMapStart: `js/content_bridge.js:5482`
bridgeUpdateVideoChannelMapPersist: `js/content_bridge.js:5490`
bridgeUpdateVideoChannelMapStamp: `js/content_bridge.js:5497` and `js/content_bridge.js:5513`
bridgeUpdateVideoChannelMapDomRerun: `js/content_bridge.js:5522` through `js/content_bridge.js:5525`
bridgeCollaboratorResponseStart: `js/content_bridge.js:5570`
bridgeCollaboratorApplyResolved: `js/content_bridge.js:5591`
bridgeCacheCollaboratorInfoStart: `js/content_bridge.js:5623`
bridgeCacheCollaboratorApplyResolved: `js/content_bridge.js:5656`
bridgeChannelResponseStart: `js/content_bridge.js:5662`
bridgeChannelResponseResolve: `js/content_bridge.js:5671`
bridgeSearchWrapperStart: `js/content_bridge.js:7350`
bridgeSearchWrapperPositiveCache: `js/content_bridge.js:7431`
bridgeSearchWrapperNegativeCache: `js/content_bridge.js:7435` and `js/content_bridge.js:7442`
```

## Current Effect Risks

- Channel lookup evidence has a split effect boundary: the injector response is
  read-only, the content-bridge wrapper caches it, and individual callers decide
  whether to persist map data or stamp DOM.
- Collaborator lookup evidence is not read-only end to end: the injector request
  path can update an injector-local collaborator cache, and the bridge response
  path can apply resolved collaborators to cards.
- `FilterTube_UpdateVideoChannelMap` is separate from `FilterTube_ChannelInfoResponse`
  but can perform stronger effects: learned-map persistence, DOM stamping, and a
  DOM fallback rerun.
- Content bridge caches positive and negative main-world channel responses, but
  the cache has no shared route/profile/list-mode/freshness report.
- The current code lacks one source-effect report that connects endpoint JSON,
  snapshot root, response cache, learned-map write, DOM stamp, DOM rerun, and
  hide/allow consequences.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
injector channel-info request emits a ChannelInfoResponse when a snapshot match exists
injector channel-info request does not retain the response after the snapshot root is removed
injector collaborator-info request emits a CollaboratorInfoResponse when a snapshot match exists
injector collaborator-info request can serve a later request from the injector-local collaborator cache after the snapshot root is removed
```

## Future Proof Shape

A future network snapshot consumer effect-boundary contract should contain at
least:

```text
snapshotConsumerEffectDecision
consumerCluster
requestType
sourceRootLabel
sourceRootTimestamp
route
profileType
listMode
settingsRevision
requestedVideoId
expectedHandle
expectedName
resultConfidence
cacheEffect
mapWriteEffect
domStampEffect
domRerunEffect
hideOrAllowEffect
targetScope
senderClass
messageType
allowedEffects
blockedEffects
fixtureProvenance
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerEffectBoundaryContract
jsonFirstNetworkSnapshotConsumerEffectDecision
jsonFirstNetworkSnapshotConsumerResponseEffectReport
jsonFirstNetworkSnapshotConsumerCacheEffectReport
jsonFirstNetworkSnapshotConsumerMapWriteEffectReport
jsonFirstNetworkSnapshotConsumerDomStampEffectReport
jsonFirstNetworkSnapshotConsumerDomRerunEffectReport
jsonFirstNetworkSnapshotConsumerTargetScopeReport
jsonFirstNetworkSnapshotConsumerEffectFixtureProvenance
jsonFirstNetworkSnapshotConsumerEffectMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-effect-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer effect surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, response/cache/map/DOM effect changes,
target scope changes, or network snapshot authority changes.
