# FilterTube Nanah Vendor Runtime Session Lifecycle Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior proof. Runtime, build, package, sync,
dashboard, and native behavior are unchanged.

This slice extends Nanah vendor build proof into the generated runtime session
lifecycle itself. It is codebase inspection for reliability, leak,
performance, cross-feature, and first-class JSON filter blockers before any
behavior change. Nanah is not a YouTube JSON filtering engine today, but it can
move settings payloads across devices; stale lifecycle or cryptographic
behavior can therefore affect sync claims, lock/trust claims, and later
first-class JSON filter parity.

## Source Fingerprints

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/vendor/nanah.bundle.js` | 876 | 27692 | `11c43c120c58ed4de81d2b1d341efd488d1bd6792d49ce5fdc9220aacf6e07ca` |
| `js/tab-view.js` | 11617 | 526763 | `1b7f621d48d16247aecc4c7ee57cbc3db9efd3e597e6f0a4fc188228470648f7` |
| `js/nanah_sync_adapter.js` | 433 | 17072 | `8094261e6fb9fa72a86e6e79e8614bf18b93134f54dcca7327114b5410447824` |
| `html/tab-view.html` | 1577 | 133585 | `d11914a138ab29fb764a6aede4921c4d491bacaad83ecd44f8d7392758ece3e1` |

## Runtime Session Summary

```text
selected source files: 4
transport class line: 489
transport class lines: 381
transport class bytes: 12964
transport host block line: 511
transport host block lines: 18
transport host block bytes: 665
transport join block line: 529
transport join block lines: 21
transport join block bytes: 714
transport send block line: 550
transport send block lines: 11
transport send block bytes: 480
transport close block line: 561
transport close block lines: 17
transport close block bytes: 351
connectSocket block line: 584
connectSocket block lines: 18
connectSocket block bytes: 820
createPeerConnection block line: 602
createPeerConnection block lines: 30
createPeerConnection block bytes: 919
attachDataChannel block line: 632
attachDataChannel block lines: 16
attachDataChannel block bytes: 524
sendSerializedPayload block line: 648
sendSerializedPayload block lines: 23
sendSerializedPayload block bytes: 883
handleSocketMessage block line: 671
handleSocketMessage block lines: 45
handleSocketMessage block bytes: 1521
applySignalPayload block line: 729
applySignalPayload block lines: 71
applySignalPayload block bytes: 2505
tryHandleChunkFrame block line: 825
tryHandleChunkFrame block lines: 25
tryHandleChunkFrame block bytes: 1033
handleEncryptedEnvelope block line: 850
handleEncryptedEnvelope block lines: 13
handleEncryptedEnvelope block bytes: 446
maybeEmitReadyState block line: 863
maybeEmitReadyState block lines: 6
maybeEmitReadyState block bytes: 176
createNanahClient block line: 8159
createNanahClient block lines: 73
createNanahClient block bytes: 2958
buildNanahPairUri block line: 6302
buildNanahPairUri block lines: 14
buildNanahPairUri block bytes: 648
runtime behavior changed: no
```

Selected runtime primitive counts in `js/vendor/nanah.bundle.js`:

```text
WebSocket tokens: 2
RTCPeerConnection tokens: 1
createDataChannel tokens: 1
ondatachannel tokens: 1
onicecandidate tokens: 1
onconnectionstatechange tokens: 1
addEventListener tokens: 8
removeEventListener tokens: 0
setTimeout tokens: 0
setInterval tokens: 0
clearTimeout tokens: 0
dataChannel?.close tokens: 1
peerConnection?.close tokens: 1
socket?.close tokens: 1
crypto.subtle tokens: 18
getRandomValues tokens: 6
randomUUID tokens: 6
AES-GCM tokens: 6
HKDF tokens: 6
ECDH tokens: 7
JSON.parse tokens: 4
JSON.stringify tokens: 4
Date.now tokens: 1
Math.random tokens: 1
MAX_DATA_CHANNEL_MESSAGE_CHARS tokens: 5
__nanahChunk tokens: 2
incomingChunks tokens: 4
resolveNanahSignalingUrl tokens: 6
DEFAULT_NANAH_SIGNALING_URL tokens: 4
```

Dashboard Nanah consumer counts in `js/tab-view.js`:

```text
new NanahApi.WebRtcDataChannelTransport tokens: 1
NanahApi.DEFAULT_NANAH_SIGNALING_URL tokens: 1
client.on tokens: 7
nanahClient.send tokens: 3
nanahClient.confirmSas tokens: 1
resetNanahSession(true) tokens: 2
resetNanahSession(false) tokens: 3
showChoiceModal tokens: 9
SAS relay impersonation warning tokens: 1
```

## Current Behavior Boundary

`WebRtcDataChannelTransport` creates a signaling `WebSocket`, one
`RTCPeerConnection`, and a `RTCDataChannel` named `nanah` on the host side. The
join side attaches the remote data channel through `ondatachannel`. The socket
adds `open`, `error`, `message`, and `close` listeners; the data channel adds
`open`, `message`, `close`, and `error` listeners. The peer connection uses
property handlers for ICE candidates and connection state.

The generated runtime has a close path that calls `dataChannel?.close()`,
`peerConnection?.close()`, and `socket?.close()` and then clears those object
references. It does not call `removeEventListener`, does not clear handler
properties, and does not clear `incomingChunks`. That is current behavior, not a
teardown contract.

The crypto path uses ECDH, HKDF, AES-GCM, `crypto.subtle`, `getRandomValues`,
and `randomUUID`. The dashboard requires a user-visible SAS phrase confirmation
before `nanahClient.confirmSas()` and before sending settings through
`nanahClient.send(...)`. The dashboard warning states that matching the phrase
prevents relay impersonation, but no committed runtime artifact currently ties
that warning to an executable cryptographic fixture.

Large payloads are split at `MAX_DATA_CHANNEL_MESSAGE_CHARS` into frames keyed
by `chunk-${Date.now()}-${Math.random().toString(16).slice(2)}` and reassembled
in `incomingChunks`. There is no chunk expiry, memory budget, duplicate frame
policy, or malformed-frame metric artifact in current source.

## Risk Notes

Reliability risk: the signaling and WebRTC session has no explicit connect
timeout, reconnect policy, stale chunk eviction, or executable session-state
fixture. A failed relay, interrupted ICE path, malformed signaling payload, or
incomplete chunk can leave user-visible sync state dependent on callbacks and UI
reset behavior.

Leak risk: listener teardown is implicit through closing socket/data-channel
objects. The bundle has eight listener registrations and zero
`removeEventListener` calls, so any future reuse/pooling optimization needs a
session lifecycle report before changing behavior.

Performance risk: payload chunking and reassembly have no current size budget or
metric artifact. The code can move settings JSON envelopes, but there is no
committed proof that large profile/category/filter payloads stay within a
bounded memory or latency envelope.

Code-burden risk: this is tracked generated runtime code. It should not be
line-edited as product source unless the vendor generation path, sibling Nanah
input revision, generated output hash, dashboard consumer contract, native sync
parity, and release package proof are all present.

First-class JSON filter boundary: Nanah carries settings payloads, not YouTube
response JSON. Future JSON-first filtering parity must prove that Nanah-imported
rules compile into the same runtime decisions as local UI edits before claiming
device-sync parity for first-class JSON filters.

## Future Proof Fields

```text
transportReference
sourceFile
sourceLine
runtimeOwner
sessionMode
socketUrl
socketEvent
peerConnectionEvent
dataChannelEvent
listenerOwner
teardownOperation
chunkId
chunkTotal
payloadByteLength
cryptoPrimitive
sasPhraseFixture
positiveHandshakeFixture
negativeHandshakeFixture
malformedSignalFixture
malformedChunkFixture
closeTeardownFixture
memoryBudget
latencyBudget
metricArtifact
dashboardConsumerProof
nativeSyncParityProof
firstClassJsonFilterParityProof
```

## Missing Runtime Authorities

These authority/report tokens do not exist in the generated Nanah bundle,
dashboard runtime, Nanah adapter, or dashboard HTML today:

```text
nanahVendorRuntimeSessionLifecycleContract
nanahVendorWebSocketLifecycleReport
nanahVendorDataChannelListenerReport
nanahVendorPeerConnectionStateReport
nanahVendorCryptoHandshakeReport
nanahVendorSasConfirmationGate
nanahVendorChunkReassemblyBudget
nanahVendorRelayTimeoutPolicy
nanahVendorCloseTeardownReport
nanahVendorFirstClassJsonFilterBoundary
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
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
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
