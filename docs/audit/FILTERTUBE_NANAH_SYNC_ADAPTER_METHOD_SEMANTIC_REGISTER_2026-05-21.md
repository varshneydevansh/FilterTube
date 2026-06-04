# FilterTube Nanah Sync Adapter Method Semantic Register - Current Behavior - 2026-05-21

Status: runtime managed-policy validation, adapter signature verification, and
validated apply boundary present.

This register promotes `js/nanah_sync_adapter.js` from broad import/export and
Nanah authority coverage to a source-derived method inventory. It covers the
shared `FilterTubeNanahAdapter` surface used by the dashboard sync UI to build
portable payloads, Nanah app-sync envelopes, control proposals, preview
incoming envelopes, and apply incoming Main/Kids/full/active settings through
`FilterTubeIO`.

This is not completion proof for trusted-link sender class, profile lock
authority, target-profile authorization, preview-to-apply equivalence, mutation
revision, runtime refresh/broadcast, V3/V4 sanitizer parity, empty-whitelist
warnings, unsupported envelope diagnostics, JSON parse provenance, peer device
identity, or future simultaneous allow/block semantics. It is a current-behavior
boundary before Nanah sync, portable payload, profile scoped apply, import,
preview, persistent remote revision storage, or trusted-device behavior changes.
Runtime behavior changed for
validated managed envelope apply support and local-network candidate authority validation: the adapter can validate
`filtertube_managed_policy` envelopes from caller-supplied authority context,
verify Ed25519 integrity signatures through WebCrypto when trusted public-key
material is available, apply accepted
keyword/channel/video/viewing-space/time-limit payloads to the fixed protected
target profile, persist accepted revision/hash state under that profile,
recompute canonical payload hashes before trust/revision acceptance, and still
refuses that envelope type through the legacy portable apply path. The local-network candidate validator is validation-only and adds no peer discovery, LAN delivery, listener, timer, storage, or DOM ownership. This is not completion proof for live transport key distribution.

## Source-Derived Summary

```text
source file: js/nanah_sync_adapter.js
line count: 1468
named declarations: 70
plain function declarations: 58
async function declarations: 12
const arrow helper declarations: 0
public FilterTubeNanahAdapter entries: 19
semantic method groups: 8
new Map calls: 4
safeArray references: 38
safeObject references: 99
normalizeString references: 91
normalizeScope references: 6
JSON.stringify calls: 6
JSON.parse calls: 3
throw new Error statements: 19
await io.loadProfilesV4 calls: 3
await io.saveProfilesV4 calls: 2
await io.exportV3 calls: 1
return io.importV3 calls: 1
global.FilterTubeIO references: 1
global.FilterTubeNanahAdapter assignments: 1
global.crypto.randomUUID references: 2
Date.now calls: 5
Math.random calls: 1
global.navigator references: 4
DEFAULT_DEVICE_CAPABILITIES references: 2
document references: 0
window references: 0
addEventListener calls: 0
setTimeout calls: 0
setInterval calls: 0
requestAnimationFrame calls: 0
MutationObserver references: 0
storage API references: 0
module.exports references: 0
runtime behavior changed: validated managed envelope apply support and local-network candidate authority validation
```

## Method Group Counts

```text
nanahAdapterRuntimeAndDescriptor: 3
nanahDefensiveNormalizationAndMerge: 17
nanahEnvelopeBuildAndSummary: 4
nanahIncomingEnvelopeApply: 2
nanahManagedPolicyEnvelopeApply: 19
nanahManagedPolicyEnvelopeValidation: 13
nanahManagedPolicyIntegrityVerifier: 10
nanahScopedPortableProfileTransfer: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `nanahDefensiveNormalizationAndMerge` | 17 | Normalizes scope, objects, arrays, non-negative integers, packed channel-derived keyword metadata, keyword keys, channel keys, merged keyword/channel/video lists, Main blocklist aliases, Main/Kids surface data application, and JSON clones. | Shared sanitizer parity with IO/StateManager, stale alias policy, duplicate-key fixture, channel-derived keyword provenance, and malformed payload diagnostics. |
| `nanahScopedPortableProfileTransfer` | 2 | Exports active profile Main/Kids subtrees and applies incoming Main/Kids scoped payloads to active or target V4 profiles through `io.saveProfilesV4()`. | Target-profile authority, profile lock gate, preview/apply transition report, empty-whitelist warning, runtime revision broadcast, and rollback proof. |
| `nanahAdapterRuntimeAndDescriptor` | 3 | Generates envelope/device ids, requires `FilterTubeIO` import/export APIs, and derives device descriptor labels/capabilities from overrides or navigator. | Peer identity provenance, stable device id policy, IO availability fixture, and trusted-link sender class proof. |
| `nanahEnvelopeBuildAndSummary` | 4 | Builds portable payloads for active/full/Main/Kids scopes, creates `app_sync` envelopes, creates `control_proposal` envelopes, and summarizes portable payloads. | Envelope schema validation, scope-specific list-count summary, proposal action contract, payload-version compatibility, and invalid-scope fixture. |
| `nanahIncomingEnvelopeApply` | 2 | Parses `app_sync` and `control_proposal` JSON payloads, returns preview payloads without writes, routes Main/Kids to scoped V4 apply, and routes active/full to `io.importV3()`. | JSON parse provenance, app/action/version checks, preview-to-apply equivalence, sender trust, mutation result contract, and negative malformed-envelope fixtures. |
| `nanahManagedPolicyEnvelopeValidation` | 13 | Normalizes managed scopes, classifies managed payload families, validates binding fields, validates mailbox metadata binding, requires caller-supplied signature-verification evidence, validates target/source/link/key/revision context, gates local-network candidates against trusted-link device/key identity, and rejects managed envelopes from the legacy apply path. | Trust-key lookup owned by persisted trusted-link context, live transport proof, server mailbox pull, and hostile-LAN proof. |
| `nanahManagedPolicyIntegrityVerifier` | 10 | Canonicalizes signed managed-policy fields, recomputes canonical payload hashes, decodes/encodes base64url signatures, resolves trusted public-key material, provisions/signs managed key material, and verifies Ed25519 integrity signatures with WebCrypto before validation can treat the envelope as signed. | Live trusted-link key distribution, sender revocation, key rotation transport, fallback diagnostics, and cross-browser compatibility proof. |
| `nanahManagedPolicyEnvelopeApply` | 19 | Applies already validated managed-policy payloads to the fixed child target, supports local/decrypted mailbox delivery into the same validation/apply path, supports keyword/channel/video/viewing-space/time-limit scope writes, persists accepted revision/hash state, and rejects missing validation context, stale replay, conflicting equal revision, non-child targets, and parent/child binding drift. | Encrypted mailbox pull, remote action-history parity, app shared-contract parity, and local-network discovery transport. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 23 | `function` | `normalizeString` | `nanahDefensiveNormalizationAndMerge` |
| 27 | `function` | `normalizeScope` | `nanahDefensiveNormalizationAndMerge` |
| 35 | `function` | `normalizeManagedPolicyScope` | `nanahManagedPolicyEnvelopeValidation` |
| 40 | `function` | `safeObject` | `nanahDefensiveNormalizationAndMerge` |
| 44 | `function` | `safeArray` | `nanahDefensiveNormalizationAndMerge` |
| 48 | `function` | `normalizeNonNegativeInteger` | `nanahDefensiveNormalizationAndMerge` |
| 54 | `function` | `validationResult` | `nanahManagedPolicyEnvelopeValidation` |
| 58 | `function` | `getManagedPayloadScopeFamily` | `nanahManagedPolicyEnvelopeValidation` |
| 79 | `function` | `validateManagedPayloadScope` | `nanahManagedPolicyEnvelopeValidation` |
| 113 | `function` | `validateManagedIntegrityBinding` | `nanahManagedPolicyEnvelopeValidation` |
| 125 | `function` | `stableManagedNanahJson` | `nanahManagedPolicyIntegrityVerifier` |
| 135 | `function` | `buildManagedPolicyHash` | `nanahManagedPolicyIntegrityVerifier` |
| 144 | `function` | `buildManagedPolicyPayloadHash` | `nanahManagedPolicyIntegrityVerifier` |
| 157 | `function` | `decodeManagedNanahBase64Url` | `nanahManagedPolicyIntegrityVerifier` |
| 174 | `function` | `encodeManagedNanahBase64Url` | `nanahManagedPolicyIntegrityVerifier` |
| 187 | `function` | `getManagedNanahSourcePublicKeyJwk` | `nanahManagedPolicyIntegrityVerifier` |
| 194 | `function` | `buildManagedPolicySignedFields` | `nanahManagedPolicyIntegrityVerifier` |
| 207 | `async function` | `createManagedNanahSigningKeyPair` | `nanahManagedPolicyIntegrityVerifier` |
| 231 | `async function` | `signManagedPolicyEnvelope` | `nanahManagedPolicyIntegrityVerifier` |
| 268 | `async function` | `verifyManagedNanahPolicyIntegritySignature` | `nanahManagedPolicyIntegrityVerifier` |
| 295 | `function` | `managedPolicyProfileMap` | `nanahManagedPolicyEnvelopeValidation` |
| 299 | `function` | `getAcceptedManagedPolicyState` | `nanahManagedPolicyEnvelopeValidation` |
| 305 | `function` | `normalizeMailboxTimestampMs` | `nanahManagedPolicyEnvelopeValidation` |
| 314 | `function` | `validateManagedPolicyEnvelope` | `nanahManagedPolicyEnvelopeValidation` |
| 428 | `function` | `getManagedMailboxEnvelope` | `nanahManagedPolicyEnvelopeValidation` |
| 433 | `function` | `validateManagedMailboxBinding` | `nanahManagedPolicyEnvelopeValidation` |
| 454 | `function` | `validateManagedMailboxItem` | `nanahManagedPolicyEnvelopeValidation` |
| 529 | `function` | `validateManagedLocalNetworkCandidate` | `nanahManagedPolicyEnvelopeValidation` |
| 577 | `function` | `parsePackedChannelKeywordSource` | `nanahDefensiveNormalizationAndMerge` |
| 584 | `function` | `normalizeKeywordEntry` | `nanahDefensiveNormalizationAndMerge` |
| 600 | `function` | `normalizeKeywordList` | `nanahDefensiveNormalizationAndMerge` |
| 606 | `function` | `keywordKey` | `nanahDefensiveNormalizationAndMerge` |
| 621 | `function` | `channelKey` | `nanahDefensiveNormalizationAndMerge` |
| 630 | `function` | `mergeKeywordLists` | `nanahDefensiveNormalizationAndMerge` |
| 645 | `function` | `mergeChannelLists` | `nanahDefensiveNormalizationAndMerge` |
| 660 | `function` | `mergeStringLists` | `nanahDefensiveNormalizationAndMerge` |
| 673 | `function` | `normalizeMainProfileAliasFields` | `nanahDefensiveNormalizationAndMerge` |
| 691 | `function` | `applyMainSurfaceData` | `nanahDefensiveNormalizationAndMerge` |
| 718 | `function` | `applyKidsSurfaceData` | `nanahDefensiveNormalizationAndMerge` |
| 746 | `function` | `cloneJson` | `nanahDefensiveNormalizationAndMerge` |
| 750 | `async function` | `buildScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 799 | `async function` | `applyScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 849 | `function` | `managedPayloadSurface` | `nanahManagedPolicyEnvelopeApply` |
| 854 | `function` | `managedPayloadListKind` | `nanahManagedPolicyEnvelopeApply` |
| 861 | `function` | `managedPayloadReplace` | `nanahManagedPolicyEnvelopeApply` |
| 866 | `function` | `managedOperationKind` | `nanahManagedPolicyEnvelopeApply` |
| 873 | `function` | `managedKeywordFromOperation` | `nanahManagedPolicyEnvelopeApply` |
| 885 | `function` | `managedChannelFromOperation` | `nanahManagedPolicyEnvelopeApply` |
| 899 | `function` | `managedVideoIdFromOperation` | `nanahManagedPolicyEnvelopeApply` |
| 904 | `function` | `mergeWithFactory` | `nanahManagedPolicyEnvelopeApply` |
| 918 | `function` | `removeEntriesByKeys` | `nanahManagedPolicyEnvelopeApply` |
| 924 | `function` | `applyManagedListPayload` | `nanahManagedPolicyEnvelopeApply` |
| 947 | `function` | `applyManagedKeywordPolicy` | `nanahManagedPolicyEnvelopeApply` |
| 979 | `function` | `applyManagedChannelPolicy` | `nanahManagedPolicyEnvelopeApply` |
| 1011 | `function` | `applyManagedVideoPolicy` | `nanahManagedPolicyEnvelopeApply` |
| 1046 | `function` | `applyManagedViewingSpacePolicy` | `nanahManagedPolicyEnvelopeApply` |
| 1074 | `function` | `applyManagedTimeLimitPolicy` | `nanahManagedPolicyEnvelopeApply` |
| 1129 | `function` | `applyManagedPolicyPayloadToProfile` | `nanahManagedPolicyEnvelopeApply` |
| 1154 | `function` | `withAcceptedManagedPolicyState` | `nanahManagedPolicyEnvelopeApply` |
| 1184 | `async function` | `applyManagedPolicyEnvelope` | `nanahManagedPolicyEnvelopeApply` |
| 1265 | `async function` | `applyManagedMailboxItem` | `nanahManagedPolicyEnvelopeApply` |
| 1290 | `function` | `generateId` | `nanahAdapterRuntimeAndDescriptor` |
| 1297 | `function` | `summarizePortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 1310 | `async function` | `getIO` | `nanahAdapterRuntimeAndDescriptor` |
| 1318 | `async function` | `buildPortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 1333 | `async function` | `buildSyncEnvelope` | `nanahEnvelopeBuildAndSummary` |
| 1345 | `async function` | `buildControlProposal` | `nanahEnvelopeBuildAndSummary` |
| 1364 | `function` | `extractPortableFromEnvelope` | `nanahIncomingEnvelopeApply` |
| 1385 | `async function` | `applyIncomingEnvelope` | `nanahIncomingEnvelopeApply` |
| 1413 | `function` | `getDeviceDescriptor` | `nanahAdapterRuntimeAndDescriptor` |

## Current Public API Surface

```text
appId
payloadVersion
supportedScopes
getDeviceDescriptor
summarizePortablePayload
buildPortablePayload
buildSyncEnvelope
buildControlProposal
validateManagedPolicyEnvelope
validateManagedMailboxItem
validateManagedLocalNetworkCandidate
buildManagedPolicyPayloadHash
verifyManagedNanahPolicyIntegritySignature
createManagedNanahSigningKeyPair
signManagedPolicyEnvelope
applyManagedPolicyEnvelope
applyManagedMailboxItem
applyIncomingEnvelope
extractPortableFromEnvelope
```

## Current Scope And Envelope Surface

```text
APP_ID: filtertube
PAYLOAD_VERSION: v3
supportedScopes: main, kids, active, full
default capabilities: sync.send, sync.receive, control.propose
sync envelope type: app_sync
control proposal type: control_proposal
managed policy envelope type: filtertube_managed_policy
proposal action: filtertube.apply_sync_payload
proposal strategies: replace, preview, merge
incoming preview strategy writes storage: no
managed policy incoming apply through legacy portable path: rejected
managed policy validator writes storage: no
managed local-network candidate validator writes storage: no
managed policy canonical payload hash recomputation: yes
managed policy validated apply wrapper writes storage: yes, only after accepted context
managed mailbox item apply wrapper writes storage: yes, only through validated managed policy apply
main/kids incoming apply path: applyScopedPortablePayload then io.saveProfilesV4
active/full incoming apply path: io.importV3
main/kids outgoing scope path: buildScopedPortablePayload
active/full outgoing scope path: io.exportV3
```

## Current Entrypoints And Dependencies

```text
module entrypoint: (function (global) { ... })(typeof window !== 'undefined' ? window : this)
browser/global export: global.FilterTubeNanahAdapter
required IO dependency: global.FilterTubeIO.exportV3 and global.FilterTubeIO.importV3
scoped V4 dependency: io.loadProfilesV4 and io.saveProfilesV4
id dependency: global.crypto.randomUUID or Date.now plus Math.random fallback
device label dependency: overrides, navigator.userAgentData.platform, navigator.platform
no DOM selector ownership: true
no listener ownership: true
no timer ownership: true
no direct storage API ownership inside this file: true
```

## Future Proof Fields

Each Nanah adapter method row must eventually be backed by a source line,
fixture, caller path, and observed success/failure effect before sync/import
behavior changes can claim semantic coverage:

```text
methodReference
sourceLine
semanticGroup
publicApiEntry
callerSurface
scope
strategy
targetProfileId
trustedLinkState
profileLockState
ioDependency
profileMutationEffect
importMutationEffect
previewEffect
runtimeRefreshEffect
backupEffect
payloadSchema
payloadVersion
envelopeType
proposalAction
senderDevice
deviceDescriptor
listMergePolicy
listReplacePolicy
modePreservationPolicy
emptyWhitelistPolicy
channelSanitizerParity
keywordSanitizerParity
jsonParseFailureMode
rollbackPolicy
positiveScopedMergeFixture
positiveScopedReplaceFixture
positivePreviewFixture
negativeMalformedEnvelopeFixture
negativeUnsupportedScopeFixture
negativeMissingIoFixture
negativeLockedProfileFixture
negativeManagedPolicyLegacyApplyFixture
positiveManagedPolicyValidationFixture
fixtureProvenance
```

## Missing Runtime Authorities

These names intentionally do not exist in runtime source yet. They name the
contracts that would be needed before implementation changes can be treated as
covered:

```text
nanahAdapterMethodAuthority
nanahAdapterEnvelopeContract
nanahAdapterScopedMutationReport
nanahAdapterPreviewApplyEquivalenceReport
nanahAdapterTargetProfileAuthority
nanahAdapterTrustedSenderContract
nanahAdapterProfileLockGate
nanahAdapterRuntimeRefreshContract
nanahAdapterSanitizerParityReport
nanahAdapterFixtureProvenance
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this backup/import/Nanah/vendor surface can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
