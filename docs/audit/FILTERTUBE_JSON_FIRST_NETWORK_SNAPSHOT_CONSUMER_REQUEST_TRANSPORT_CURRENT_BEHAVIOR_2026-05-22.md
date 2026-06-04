# FilterTube JSON-First Network Snapshot Consumer Request Transport - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, transport patch, or
permission to change JSON filtering behavior.

## Purpose

This register connects network snapshot consumers to their current message
transport, pending request, retry, and timeout behavior. The effect-boundary
register shows which paths can cache, stamp, persist, or rerun DOM work after a
snapshot lookup. This register adds the lifecycle boundary for the request
itself: how `content_bridge.js` asks `injector.js` for main-world snapshot
evidence, how many attempts it sends, how long it waits, and how response
handlers clear pending state.

The current boundary is:

```text
Content bridge creates one pending Map entry per channel/collaborator request,
ensures the lazy main-world runtime path has had a chance to inject, posts a
wildcard same-window request after that promise settles, retries that same
request at 250 ms and 1000 ms while the pending entry still exists, and times
out at 2000 ms. Injector accepts same-window messages whose source is
content_bridge, responds with wildcard ChannelInfoResponse or
CollaboratorInfoResponse messages, and content bridge clears the matching
pending timeout when the response arrives.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_MESSAGE_SENDER_CLASS_MATRIX_2026-05-18.md`
- `docs/audit/FILTERTUBE_MESSAGE_SIDE_EFFECT_REGISTER_2026-05-18.md`
- `docs/audit/FILTERTUBE_PAGE_MESSAGE_TRUST_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_RUNTIME_AUDIT_2026-05-17.md`

## Current Counts

```text
consumer request-transport source files: 2
pending snapshot request maps: 2
snapshot request id counters: 2
snapshot request functions: 2
request timeout constants at 2000 ms: 2
request retry delays at 250 ms: 2
request retry delays at 1000 ms: 2
request postMessage wildcard targets: 2
lazy main-world runtime ensures before first request post: 2
injector same-window request listener gates: 1
injector content_bridge request source gates: 2
injector response postMessage wildcard targets: 2
bridge response clearTimeout sites: 2
bridge response pending delete sites: 2
bridge response pending resolve sites: 2
runtime channel retry and timeout fixtures: 1
runtime channel response clear fixtures: 1
runtime collaborator retry and timeout fixtures: 1
runtime unsolicited collaborator response fixture: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Transport Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Pending collaborator map | `js/content_bridge.js:5296` through `js/content_bridge.js:5302` | Initializes `window.pendingCollaboratorRequests` and `window.collaboratorRequestId`. | State is global on `window` and reused across page lifecycle without a central request registry. | Request owner, request age, and teardown report. |
| Pending channel map | `js/content_bridge.js:5304` through `js/content_bridge.js:5310` | Initializes `window.pendingChannelInfoRequests` and `window.channelInfoRequestId`. | Channel lookup pending state is independent from collaborator pending state and has no shared lifecycle budget. | Shared snapshot request registry. |
| Collaborator request sender | `js/content_bridge.js:5325` through `js/content_bridge.js:5375` | Sets a 2000 ms timeout, stores pending state, ensures lazy main-world runtime, posts the first request after that promise settles, then retries at 250 ms and 1000 ms while pending. | Up to three wildcard same-window messages can be sent per request without route/profile/list-mode budget. | Retry policy, reason report, and sender capability. |
| Channel request sender | `js/content_bridge.js:5380` through `js/content_bridge.js:5425` | Sets a 2000 ms timeout, stores pending state, ensures lazy main-world runtime, posts the first request after that promise settles, then retries at 250 ms and 1000 ms while pending. | Same retry and timeout shape as collaborator lookup, but no shared policy artifact. | Shared channel/collaborator request transport contract. |
| Injector collaborator receiver | `js/injector.js:1961` through `js/injector.js:2005` | Accepts source `content_bridge`, searches/cache-checks collaborators, and posts wildcard response. | Response has `requestId` but no sender capability, nonce, route, or settings revision. | Owned request token and response provenance. |
| Injector channel receiver | `js/injector.js:2011` through `js/injector.js:2031` | Accepts source `content_bridge`, searches channel snapshot roots, and posts wildcard response. | Channel response relies on pending request id correlation in content bridge. | Request/response correlation report. |
| Bridge collaborator response | `js/content_bridge.js:5758` through `js/content_bridge.js:5780` | Clears timeout and resolves a pending request when found, then can apply non-empty collaborator data by `videoId`. | Applying collaborators is not limited to the pending branch. | Pending ownership or trusted source requirement for DOM effects. |
| Bridge channel response | `js/content_bridge.js:5850` through `js/content_bridge.js:5857` | Clears timeout, deletes pending state, and resolves `channel || null` when the request id is pending. | Pending id is the only response correlation check. | Video-id/request-id/nonce correlation policy. |

## Source-Derived Rows

```text
collaboratorRequestTransport: pending Map entry, 2000 ms timeout, lazy runtime ensure, wildcard postMessage after promise settlement, retry at 250 ms, retry at 1000 ms
channelRequestTransport: pending Map entry, 2000 ms timeout, lazy runtime ensure, wildcard postMessage after promise settlement, retry at 250 ms, retry at 1000 ms
injectorRequestGate: event.source === window plus source === content_bridge for both request types
injectorResponseTransport: wildcard postMessage with requestId and result payload
bridgeResponseTransport: clearTimeout, pending delete, pending resolve for matching requestId
collaboratorResponseExtraEffect: non-empty collaborators can call applyResolvedCollaborators after the pending branch
```

Anchor map:

```text
pendingCollaboratorMap: `js/content_bridge.js:5296`
collaboratorRequestCounter: `js/content_bridge.js:5299`
pendingChannelMap: `js/content_bridge.js:5304`
channelRequestCounter: `js/content_bridge.js:5307`
collaboratorRequestFunction: `js/content_bridge.js:5325`
collaboratorRequestTimeout: `js/content_bridge.js:5332` through `js/content_bridge.js:5341`
collaboratorPendingSet: `js/content_bridge.js:5344`
collaboratorRequestPost: `js/content_bridge.js:5375` through `js/content_bridge.js:5358`
collaboratorRetry250: `js/content_bridge.js:5366` through `js/content_bridge.js:5370`
collaboratorRetry1000: `js/content_bridge.js:5371` through `js/content_bridge.js:5375`
channelRequestFunction: `js/content_bridge.js:5380`
channelRequestTimeout: `js/content_bridge.js:5383` through `js/content_bridge.js:5392`
channelPendingSet: `js/content_bridge.js:5394`
channelRequestPost: `js/content_bridge.js:5425` through `js/content_bridge.js:5406`
channelRetry250: `js/content_bridge.js:5416` through `js/content_bridge.js:5420`
channelRetry1000: `js/content_bridge.js:5421` through `js/content_bridge.js:5425`
injectorSameWindowGate: `js/injector.js:1916` through `js/injector.js:1922`
injectorCollaboratorRequestGate: `js/injector.js:1961`
injectorCollaboratorResponsePost: `js/injector.js:1997` through `js/injector.js:2005`
injectorChannelRequestGate: `js/injector.js:2011`
injectorChannelResponsePost: `js/injector.js:2023` through `js/injector.js:2031`
bridgeCollaboratorResponseClear: `js/content_bridge.js:5789` through `js/content_bridge.js:5765`
bridgeCollaboratorResponseApply: `js/content_bridge.js:5767` through `js/content_bridge.js:5780`
bridgeChannelResponseClear: `js/content_bridge.js:5853` through `js/content_bridge.js:5857`
```

## Current Transport Risks

- Channel and collaborator requests each retry up to two times after the
  immediate send, but there is no shared retry policy or route/profile/list-mode
  request budget.
- Requests and responses use wildcard same-window `postMessage` transport and
  string `source` checks instead of a request token or sender capability.
- A response can clear pending state by `requestId`, but channel responses do
  not verify that response `videoId` matches the pending `videoId`.
- Collaborator responses can apply collaborator data even when no pending
  request is found, as long as `videoId` and collaborators are present.
- Pending maps and retry timers do not have one lifecycle teardown authority
  tied to navigation, route changes, or settings revision changes.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
channel requests post after lazy main-world runtime ensure settles, retry at 250 ms and 1000 ms while pending, then resolve null at 2000 ms
channel responses clear the timeout, delete pending state, resolve the pending promise, and suppress later retries
collaborator requests post after lazy main-world runtime ensure settles, retry at 250 ms and 1000 ms while pending, then resolve null at 2000 ms
unsolicited collaborator responses with non-empty collaborator arrays can still call applyResolvedCollaborators
```

## Future Proof Shape

A future network snapshot consumer request transport contract should contain at
least:

```text
snapshotConsumerRequestTransportDecision
requestType
requestId
requestNonce
senderClass
sourceWorld
targetWorld
route
profileType
listMode
settingsRevision
requestedVideoId
expectedHandle
expectedName
retryPolicy
timeoutMs
attemptCount
pendingCreatedAt
pendingClearedAt
clearReason
responseVideoId
responseCorrelationResult
allowedResponseEffects
blockedResponseEffects
fixtureProvenance
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerRequestTransportContract
jsonFirstNetworkSnapshotConsumerRequestTransportDecision
jsonFirstNetworkSnapshotConsumerRequestNonce
jsonFirstNetworkSnapshotConsumerPendingRequestRegistry
jsonFirstNetworkSnapshotConsumerRetryPolicy
jsonFirstNetworkSnapshotConsumerTimeoutPolicy
jsonFirstNetworkSnapshotConsumerResponseCorrelationReport
jsonFirstNetworkSnapshotConsumerTransportSenderCapability
jsonFirstNetworkSnapshotConsumerRequestFixtureProvenance
jsonFirstNetworkSnapshotConsumerRequestMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-request-transport-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer request
transport surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5827
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5827
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, request transport changes, nonce/correlation
changes, retry/timeout policy changes, or network snapshot authority changes.
