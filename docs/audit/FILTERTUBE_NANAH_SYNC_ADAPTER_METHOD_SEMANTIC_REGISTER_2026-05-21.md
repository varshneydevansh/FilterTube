# FilterTube Nanah Sync Adapter Method Semantic Register - Current Behavior - 2026-05-21

Status: runtime managed-policy validation boundary present.

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
validation-only managed envelope support: the adapter can validate
`filtertube_managed_policy` envelopes from caller-supplied authority context,
and the legacy portable apply path refuses to apply that envelope type.
This is not completion proof for persistent remote revision storage.

## Source-Derived Summary

```text
source file: js/nanah_sync_adapter.js
line count: 644
named declarations: 32
plain function declarations: 25
async function declarations: 7
const arrow helper declarations: 0
public FilterTubeNanahAdapter entries: 11
semantic method groups: 6
new Map calls: 2
safeArray references: 21
safeObject references: 40
normalizeString references: 38
normalizeScope references: 6
JSON.stringify calls: 3
JSON.parse calls: 3
throw new Error statements: 9
await io.loadProfilesV4 calls: 2
await io.saveProfilesV4 calls: 1
await io.exportV3 calls: 1
return io.importV3 calls: 1
global.FilterTubeIO references: 1
global.FilterTubeNanahAdapter assignments: 1
global.crypto.randomUUID references: 2
Date.now calls: 1
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
runtime behavior changed: validation-only managed envelope support
```

## Method Group Counts

```text
nanahAdapterRuntimeAndDescriptor: 3
nanahDefensiveNormalizationAndMerge: 13
nanahEnvelopeBuildAndSummary: 4
nanahIncomingEnvelopeApply: 2
nanahManagedPolicyEnvelopeValidation: 8
nanahScopedPortableProfileTransfer: 2
```

## Semantic Group Summary

| Semantic group | Declarations | Current owner/effect shape | Missing proof before behavior changes |
| --- | ---: | --- | --- |
| `nanahDefensiveNormalizationAndMerge` | 13 | Normalizes scope, objects, arrays, packed channel-derived keyword metadata, keyword keys, channel keys, merged keyword/channel lists, Main blocklist aliases, and JSON clones. | Shared sanitizer parity with IO/StateManager, stale alias policy, duplicate-key fixture, channel-derived keyword provenance, and malformed payload diagnostics. |
| `nanahScopedPortableProfileTransfer` | 2 | Exports active profile Main/Kids subtrees and applies incoming Main/Kids scoped payloads to active or target V4 profiles through `io.saveProfilesV4()`. | Target-profile authority, profile lock gate, preview/apply transition report, empty-whitelist warning, runtime revision broadcast, and rollback proof. |
| `nanahAdapterRuntimeAndDescriptor` | 3 | Generates envelope/device ids, requires `FilterTubeIO` import/export APIs, and derives device descriptor labels/capabilities from overrides or navigator. | Peer identity provenance, stable device id policy, IO availability fixture, and trusted-link sender class proof. |
| `nanahEnvelopeBuildAndSummary` | 4 | Builds portable payloads for active/full/Main/Kids scopes, creates `app_sync` envelopes, creates `control_proposal` envelopes, and summarizes portable payloads. | Envelope schema validation, scope-specific list-count summary, proposal action contract, payload-version compatibility, and invalid-scope fixture. |
| `nanahIncomingEnvelopeApply` | 2 | Parses `app_sync` and `control_proposal` JSON payloads, returns preview payloads without writes, routes Main/Kids to scoped V4 apply, and routes active/full to `io.importV3()`. | JSON parse provenance, app/action/version checks, preview-to-apply equivalence, sender trust, mutation result contract, and negative malformed-envelope fixtures. |
| `nanahManagedPolicyEnvelopeValidation` | 8 | Normalizes managed scopes, classifies managed payload families, validates binding fields, requires caller-supplied signature-verification evidence, validates target/source/link/key/revision context, and rejects managed envelopes from the legacy apply path. | Persistent revision store, dashboard/WebCrypto key-verifier plumbing, canonical payload hash recomputation, action-history accept/reject writer, and managed apply wrapper proof. |

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 22 | `function` | `normalizeString` | `nanahDefensiveNormalizationAndMerge` |
| 26 | `function` | `normalizeScope` | `nanahDefensiveNormalizationAndMerge` |
| 34 | `function` | `normalizeManagedPolicyScope` | `nanahManagedPolicyEnvelopeValidation` |
| 39 | `function` | `safeObject` | `nanahDefensiveNormalizationAndMerge` |
| 43 | `function` | `safeArray` | `nanahDefensiveNormalizationAndMerge` |
| 47 | `function` | `validationResult` | `nanahManagedPolicyEnvelopeValidation` |
| 51 | `function` | `getManagedPayloadScopeFamily` | `nanahManagedPolicyEnvelopeValidation` |
| 72 | `function` | `validateManagedPayloadScope` | `nanahManagedPolicyEnvelopeValidation` |
| 106 | `function` | `validateManagedIntegrityBinding` | `nanahManagedPolicyEnvelopeValidation` |
| 118 | `function` | `managedPolicyProfileMap` | `nanahManagedPolicyEnvelopeValidation` |
| 122 | `function` | `getAcceptedManagedPolicyState` | `nanahManagedPolicyEnvelopeValidation` |
| 128 | `function` | `validateManagedPolicyEnvelope` | `nanahManagedPolicyEnvelopeValidation` |
| 239 | `function` | `parsePackedChannelKeywordSource` | `nanahDefensiveNormalizationAndMerge` |
| 246 | `function` | `normalizeKeywordEntry` | `nanahDefensiveNormalizationAndMerge` |
| 262 | `function` | `normalizeKeywordList` | `nanahDefensiveNormalizationAndMerge` |
| 268 | `function` | `keywordKey` | `nanahDefensiveNormalizationAndMerge` |
| 283 | `function` | `channelKey` | `nanahDefensiveNormalizationAndMerge` |
| 292 | `function` | `mergeKeywordLists` | `nanahDefensiveNormalizationAndMerge` |
| 307 | `function` | `mergeChannelLists` | `nanahDefensiveNormalizationAndMerge` |
| 322 | `function` | `normalizeMainProfileAliasFields` | `nanahDefensiveNormalizationAndMerge` |
| 340 | `function` | `cloneJson` | `nanahDefensiveNormalizationAndMerge` |
| 344 | `async function` | `buildScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 393 | `async function` | `applyScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 486 | `function` | `generateId` | `nanahAdapterRuntimeAndDescriptor` |
| 493 | `function` | `summarizePortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 506 | `async function` | `getIO` | `nanahAdapterRuntimeAndDescriptor` |
| 514 | `async function` | `buildPortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 529 | `async function` | `buildSyncEnvelope` | `nanahEnvelopeBuildAndSummary` |
| 541 | `async function` | `buildControlProposal` | `nanahEnvelopeBuildAndSummary` |
| 560 | `function` | `extractPortableFromEnvelope` | `nanahIncomingEnvelopeApply` |
| 581 | `async function` | `applyIncomingEnvelope` | `nanahIncomingEnvelopeApply` |
| 609 | `function` | `getDeviceDescriptor` | `nanahAdapterRuntimeAndDescriptor` |

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
