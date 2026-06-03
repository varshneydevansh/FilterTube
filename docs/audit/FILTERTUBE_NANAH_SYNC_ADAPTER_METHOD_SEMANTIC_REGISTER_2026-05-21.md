# FilterTube Nanah Sync Adapter Method Semantic Register - Current Behavior - 2026-05-21

Status: audit-only current-behavior register. Runtime behavior is unchanged.

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
preview, or trusted-device behavior changes.

## Source-Derived Summary

```text
source file: js/nanah_sync_adapter.js
line count: 433
named declarations: 24
plain function declarations: 17
async function declarations: 7
const arrow helper declarations: 0
public FilterTubeNanahAdapter entries: 10
semantic method groups: 5
new Map calls: 2
safeArray references: 16
safeObject references: 25
normalizeString references: 30
normalizeScope references: 6
JSON.stringify calls: 3
JSON.parse calls: 3
throw new Error statements: 8
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
runtime behavior changed: no
```

## Method Group Counts

```text
nanahAdapterRuntimeAndDescriptor: 3
nanahDefensiveNormalizationAndMerge: 13
nanahEnvelopeBuildAndSummary: 4
nanahIncomingEnvelopeApply: 2
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

## Current Method Inventory

| Source line | Kind | Method or function | Semantic group |
| ---: | --- | --- | --- |
| 12 | `function` | `normalizeString` | `nanahDefensiveNormalizationAndMerge` |
| 16 | `function` | `normalizeScope` | `nanahDefensiveNormalizationAndMerge` |
| 24 | `function` | `safeObject` | `nanahDefensiveNormalizationAndMerge` |
| 28 | `function` | `safeArray` | `nanahDefensiveNormalizationAndMerge` |
| 32 | `function` | `parsePackedChannelKeywordSource` | `nanahDefensiveNormalizationAndMerge` |
| 39 | `function` | `normalizeKeywordEntry` | `nanahDefensiveNormalizationAndMerge` |
| 55 | `function` | `normalizeKeywordList` | `nanahDefensiveNormalizationAndMerge` |
| 61 | `function` | `keywordKey` | `nanahDefensiveNormalizationAndMerge` |
| 76 | `function` | `channelKey` | `nanahDefensiveNormalizationAndMerge` |
| 85 | `function` | `mergeKeywordLists` | `nanahDefensiveNormalizationAndMerge` |
| 100 | `function` | `mergeChannelLists` | `nanahDefensiveNormalizationAndMerge` |
| 115 | `function` | `normalizeMainProfileAliasFields` | `nanahDefensiveNormalizationAndMerge` |
| 133 | `function` | `cloneJson` | `nanahDefensiveNormalizationAndMerge` |
| 137 | `async function` | `buildScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 186 | `async function` | `applyScopedPortablePayload` | `nanahScopedPortableProfileTransfer` |
| 279 | `function` | `generateId` | `nanahAdapterRuntimeAndDescriptor` |
| 286 | `function` | `summarizePortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 299 | `async function` | `getIO` | `nanahAdapterRuntimeAndDescriptor` |
| 307 | `async function` | `buildPortablePayload` | `nanahEnvelopeBuildAndSummary` |
| 322 | `async function` | `buildSyncEnvelope` | `nanahEnvelopeBuildAndSummary` |
| 334 | `async function` | `buildControlProposal` | `nanahEnvelopeBuildAndSummary` |
| 353 | `function` | `extractPortableFromEnvelope` | `nanahIncomingEnvelopeApply` |
| 371 | `async function` | `applyIncomingEnvelope` | `nanahIncomingEnvelopeApply` |
| 399 | `function` | `getDeviceDescriptor` | `nanahAdapterRuntimeAndDescriptor` |

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
proposal action: filtertube.apply_sync_payload
proposal strategies: replace, preview, merge
incoming preview strategy writes storage: no
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
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, backup/export behavior, import behavior,
Nanah sync behavior, vendor runtime behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
