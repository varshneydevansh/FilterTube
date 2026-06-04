# FilterTube JSON-First Network Snapshot Clone Isolation - Current Behavior - 2026-05-22

Status: audit-only current-behavior register.
Runtime behavior reflects the scoped no-active-JSON-work fast-path optimization.
This is not an implementation patch, optimization patch, clone patch, or
permission to change JSON filtering behavior.

## Purpose

This register isolates whether network snapshots are copied or shared after
JSON fetch processing. The stash contract proves which fields are written. The
consumer freshness contract proves which consumers read those fields. This
register proves the current reference boundary: the snapshot writer stores the
same in-memory object references it receives, and the fetch response body is a
separate serialized result.

The current boundary is:

```text
`stashNetworkSnapshot()` assigns object references directly when active JSON
work reaches it. Search and browse latest fields and their most recent array
entries alias the same object. Next and player latest fields also store direct
references. The writer does not clone, freeze, seal, or tag snapshot objects,
while the active fetch path serializes the processed object into a response body
immediately after processing. No-active-rule network fetches now bypass parsing
and do not write snapshots.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_FETCH_RESPONSE_REBUILD_METADATA_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md`

## Current Counts

```text
source files with snapshot clone and reference surface: 2
snapshot writer functions: 1
direct latest snapshot object assignment sites: 4
direct recent entry data writes: 2
direct recent array tail writes: 2
snapshot writer clone callsites: 0
snapshot writer object freeze or seal callsites: 0
engine result direct stash callsites: 1
harvest-only direct stash callsites: 1
fallback direct stash callsites: 1
normal fetch response stringify sites after processing: 1
subscription import object-identity dedupe sites: 1
runtime latest/recent alias fixtures: 2
runtime latest-only alias fixtures: 2
runtime fallback direct-reference fixtures: 1
runtime no-active-rule bypass fixtures: 1
runtime response body isolation fixtures: 5
runtime behavior changed: yes
not completion proof for JSON-first network snapshot authority
```

## Clone And Reference Inventory

| Surface | Source anchor | Current behavior | Current isolation boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Snapshot writer | `js/seed.js:43` | `stashNetworkSnapshot(data, dataName)` receives an object and stores it directly. | No clone, freeze, seal, provenance, or mutation budget in the writer. | Shared clone policy and mutation isolation report. |
| Search latest | `js/seed.js:52` | Assigns `lastYtSearchResponse = data`. | Direct object reference. | Latest/recent alias contract and consumer mutation policy. |
| Search recent entry | `js/seed.js:58` through `js/seed.js:63` | Pushes `{ data, name, ts }`, then stores `recentSearchResponses.slice(-12)`. | Entry `data` aliases the same object as latest for the newest search snapshot. | Per-entry clone/provenance/freeze policy. |
| Next latest | `js/seed.js:67` | Assigns `lastYtNextResponse = data`. | Direct latest-only object reference. | Latest-only mutation isolation and history policy. |
| Browse latest | `js/seed.js:73` | Assigns `lastYtBrowseResponse = data`. | Direct object reference. | Import seed mutation policy and clone contract. |
| Browse recent entry | `js/seed.js:79` through `js/seed.js:84` | Pushes `{ data, name, ts }`, then stores `recentBrowseResponses.slice(-12)`. | Entry `data` aliases the same object as latest for the newest browse snapshot. | Import consumer mutation budget and provenance. |
| Player latest | `js/seed.js:88` | Assigns `lastYtPlayerResponse = data`. | Direct latest-only object reference. | Watch-surface identity mutation policy. |
| Harvest-only stashing source path | `js/seed.js:433` | The source still stashes original parsed data on skip-mutation paths, but no-active-rule fetches now bypass before parsing. | No clone between harvest input and snapshot field if this branch is reached. | Source-effect, reachability, and harvest-state tag. |
| Engine result stashing | `js/seed.js:454` and `js/seed.js:470` | Stashes the exact object returned by `FilterTubeEngine.processData()`. | No post-engine clone before latest/recent storage. | Engine mutation result provenance. |
| Fallback stashing | `js/seed.js:475` and `js/seed.js:476` | `basicProcessing()` mutates/returns the parsed object and stashes it. | No fallback clone or reason field. | Fallback mutation isolation and reason report. |
| Fetch response rebuild | `js/seed.js:740` and `js/seed.js:741` | Serializes `processed` into a new `Response` on the active JSON-work path. | Response body is a serialized copy of the object state at rebuild time. | Response-body/snapshot isolation policy and metric. |
| Subscription import latest browse candidate | `js/injector.js:787` | Reads `lastYtBrowseResponse` directly as a seed candidate. | Consumer receives the same object reference stored by seed. | Consumer mutation permission. |
| Subscription import recent browse spread | `js/injector.js:788` | Spreads recent browse `entry.data` values into seed candidates. | Recent entries can alias latest. | Read-only contract or defensive clone policy. |
| Subscription import dedupe | `js/injector.js:789` | Deduplicates candidates by `array.indexOf(candidate) === index`. | Object identity affects import seed candidate uniqueness. | Stable identity/provenance decision independent of reference aliasing. |

## Source-Derived Rows

```text
directLatestSnapshotAssignments(4): lastYtSearchResponse,lastYtNextResponse,lastYtBrowseResponse,lastYtPlayerResponse
directRecentEntryDataWrites(2): recentYtSearchResponses.data,recentYtBrowseResponses.data
directRecentTailWrites(2): recentYtSearchResponses.slice(-12),recentYtBrowseResponses.slice(-12)
snapshotWriterCloneCalls(0): none
snapshotWriterFreezeSealCalls(0): none
directStashCallsites(3): harvestOnlyOriginalSourcePath,engineResult,fallbackResult
responseBodySerializationSites(1): normalFetchProcessedResponse
consumerObjectIdentitySites(1): subscriptionImportSeedCandidateDedupe
runtimeAliasFixtures(5): searchLatestRecentAlias,browseLatestRecentAlias,nextLatestReference,playerLatestReference,fallbackDirectReference
runtimeNoActiveRuleFixtures(1): searchNoActiveRuleBypass
runtimeResponseBodyIsolationFixtures(5): search,browse,next,player,noActiveRuleBypass
```

Anchor map:

```text
stashFunction: `js/seed.js:43`
stashSearchLatestDirectAssignment: `js/seed.js:52`
stashSearchRecentPush: `js/seed.js:58`
stashSearchRecentSlice: `js/seed.js:63`
stashNextLatestDirectAssignment: `js/seed.js:67`
stashBrowseLatestDirectAssignment: `js/seed.js:73`
stashBrowseRecentPush: `js/seed.js:79`
stashBrowseRecentSlice: `js/seed.js:84`
stashPlayerLatestDirectAssignment: `js/seed.js:88`
harvestOnlyDirectStashSourcePath: `js/seed.js:433`
engineProcessResult: `js/seed.js:454`
engineResultDirectStash: `js/seed.js:470`
fallbackResult: `js/seed.js:475`
fallbackDirectStash: `js/seed.js:476`
fetchProcessedObject: `js/seed.js:740`
fetchProcessedResponseStringify: `js/seed.js:741`
injectorLatestBrowseCandidate: `js/injector.js:787`
injectorRecentBrowseCandidateSpread: `js/injector.js:788`
injectorObjectIdentityDedupe: `js/injector.js:789`
```

## Current Clone And Mutation Risks

- Latest search and browse fields alias their newest recent entry object.
- Consumers can mutate snapshot objects and affect other references to the same
  object inside `window.filterTube`.
- Search and browse recent arrays slice the array but do not clone entry
  objects or entry data.
- Next and player keep direct latest references without a recent history or
  clone boundary.
- The harvest-only source path, engine-result path, and fallback path all stash
  direct references from different source-effect states without a provenance tag
  when reached; no-active-rule fetches now bypass before the harvest-only path.
- Fetch response bodies are serialized immediately, so later snapshot mutation
  does not change that returned response body, but later consumers still read
  the mutable snapshot object.
- Subscription import deduplicates candidates by object identity, so aliasing can
  affect candidate uniqueness.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
search fetch: latest search snapshot and newest recent search entry are the same object returned by processData()
browse fetch: latest browse snapshot and newest recent browse entry are the same object returned by processData()
next/player fetch: latest snapshots are the exact processData() result objects and have no recent arrays
fallback path: engine failure stashes the same parsed object passed to processData() and basicProcessing()
no-active-rule path: skipped search filtering bypasses clone/parse/process/stringify and writes no snapshot
response bodies: parsed response JSON is not the same object as the stored snapshot and does not reflect later snapshot mutations
```

## Future Proof Shape

A future network snapshot clone isolation contract should contain at least:

```text
snapshotClonePolicy
snapshotMutationIsolationReport
snapshotReferenceAliasReport
snapshotFreezePolicy
consumerMutationBudget
responseBodyIsolationReport
referenceAliasFixture
cloneIsolationMetricArtifact
snapshotOwner
snapshotFamily
sourceEffect
mutationState
consumerCluster
consumerPermission
settingsRevision
snapshotTimestamp
entryTimestamp
entryName
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotCloneIsolationContract
jsonFirstNetworkSnapshotClonePolicy
jsonFirstNetworkSnapshotMutationIsolationReport
jsonFirstNetworkSnapshotReferenceAliasReport
jsonFirstNetworkSnapshotConsumerMutationBudget
jsonFirstNetworkSnapshotResponseBodyIsolationReport
jsonFirstNetworkSnapshotObjectFreezePolicy
jsonFirstNetworkSnapshotCloneFixtureProvenance
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-clone-isolation-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot clone isolation surface
can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, clone isolation changes, mutation isolation
changes, response body isolation changes, or network snapshot authority
changes.
