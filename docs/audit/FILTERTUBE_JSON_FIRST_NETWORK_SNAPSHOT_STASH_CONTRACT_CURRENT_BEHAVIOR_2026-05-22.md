# FilterTube JSON-First Network Snapshot Stash Contract - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, snapshot patch, or
permission to change JSON filtering behavior.

## Purpose

This register isolates the network JSON snapshot state written by `js/seed.js`
and later read by `js/injector.js`. These snapshots are a cross-feature bridge:
they can be written by JSON fetch/XHR processing, harvest-only paths, fallback
processing, or settings replay, and then used later for channel identity,
subscription import, and repair workflows.

The current boundary is:

```text
Network snapshot stashing is endpoint-name substring based. Search and browse
keep both latest and recent arrays, next and player keep only latest snapshots,
guide is processed but not stashed, and injector consumers read the stashed
objects without a shared freshness, route, profile, or permission contract.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_SEED_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_RESPONSE_MUTATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
source files with network snapshot stash surface: 2
seed snapshot writer functions: 1
seed snapshot endpoint families written: 4
seed snapshot endpoint families not written from fetch endpoint list: 1
latest snapshot response fields written: 4
latest snapshot name fields written: 4
latest snapshot timestamp fields written: 4
recent snapshot arrays written: 2
recent snapshot retained tail size: 12
recent snapshot entry fields: 3
stash callsites from processWithEngine: 3
settings update initial global snapshot assignment sites: 2
injector snapshot consumer clusters: 3
injector recent browse consumer clusters: 2
injector recent search consumer clusters: 2
injector latest search consumer clusters: 2
injector latest next consumer clusters: 2
injector latest browse consumer clusters: 3
injector latest player consumer clusters: 2
runtime latest snapshot fixtures: 4
runtime recent array cap fixtures: 2
runtime missing guide snapshot fixtures: 1
runtime harvest-only snapshot fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Network Snapshot Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Snapshot writer | `js/seed.js:43` | `stashNetworkSnapshot(data, dataName)` writes into `window.filterTube` when data is object-like and name is non-empty. | Returns silently if `window.filterTube`, data, or name is missing. | Snapshot owner, admission reason, data shape, and permission contract. |
| Search snapshots | `js/seed.js:51` through `js/seed.js:64` | Writes latest search response/name/timestamp and appends `{ data, name, ts }` to `recentYtSearchResponses.slice(-12)`. | No search-specific stale route/profile check. | Search snapshot freshness, cap, and consumer permission proof. |
| Next snapshots | `js/seed.js:66` through `js/seed.js:70` | Writes latest next response/name/timestamp only. | No recent next array exists. | Continuation freshness and sibling preservation provenance. |
| Browse snapshots | `js/seed.js:72` through `js/seed.js:85` | Writes latest browse response/name/timestamp and appends `{ data, name, ts }` to `recentYtBrowseResponses.slice(-12)`. | No browse-specific route/profile cap beyond array tail. | Subscription import freshness and route permission proof. |
| Player snapshots | `js/seed.js:87` through `js/seed.js:91` | Writes latest player response/name/timestamp only. | No recent player array exists. | Player identity freshness and watch-surface permission proof. |
| Guide endpoint gap | `js/seed.js:668` through `js/seed.js:672` plus `js/seed.js:51` through `js/seed.js:91` | `/youtubei/v1/guide` is a fetch endpoint but has no snapshot writer branch. | Guide responses can be processed and returned without a `lastYtGuideResponse`. | Explicit endpoint-to-snapshot policy. |
| Harvest-only stashing | `js/seed.js:364` through `js/seed.js:382` | Skip-mutation paths can call `harvestOnly()` and stash the original data. | The returned response is not engine-mutated on that path. | Distinguish learned-identity harvest snapshots from mutation results. |
| Engine result stashing | `js/seed.js:454` and `js/seed.js:470` | Normal engine processing stashes `result`, not the pre-engine data. | If the engine fails, fallback stashing occurs. | Snapshot source-effect and mutation provenance. |
| Fallback stashing | `js/seed.js:475` and `js/seed.js:476` | Engine exceptions call `basicProcessing()` and stash the fallback object. | Fallback has no explicit reason field. | Fallback reason and side-effect report. |
| Initial-global reprocess stashing | `js/seed.js:955` through `js/seed.js:1074` | Settings update writes reprocessed `ytInitialData` and `ytInitialPlayerResponse` into separate `lastYtInitial*` fields. | These fields are separate from network endpoint snapshot fields. | Shared snapshot taxonomy across network and initial globals. |
| Subscription import seed reads | `js/injector.js:776` through `js/injector.js:745` | Consumes recent browse entries and latest browse response as import seed candidates. | Deduplicates by object identity only. | Freshness, profile, and route proof for import seeds. |
| Subscription import timestamp reads | `js/injector.js:978` through `js/injector.js:944` | Uses latest recent browse timestamp, falling back to latest browse timestamp. | Returns zero on missing or invalid timestamps. | Snapshot age contract. |
| Identity search reads | `js/injector.js:2743` through `js/injector.js:2722` | Reads latest search, recent search tail of 6, latest next, latest browse, and latest player snapshots. | Search is skipped only if no roots exist. | Snapshot consumer permission and route/surface scope. |
| Secondary identity roots | `js/injector.js:3123` through `js/injector.js:3091` | Reads latest search, recent search tail of 6, latest next, and latest browse roots. | Player endpoint snapshot is not included in this secondary root list. | Consumer-specific root parity contract. |

## Source-Derived Rows

```text
seedSnapshotBranches(4): search,next,browse,player
seedFetchEndpointWithoutSnapshotBranch(1): guide
latestSnapshotFields(12): lastYtSearchResponse,lastYtSearchResponseName,lastYtSearchResponseTs,lastYtNextResponse,lastYtNextResponseName,lastYtNextResponseTs,lastYtBrowseResponse,lastYtBrowseResponseName,lastYtBrowseResponseTs,lastYtPlayerResponse,lastYtPlayerResponseName,lastYtPlayerResponseTs
recentSnapshotArrays(2): recentYtSearchResponses,recentYtBrowseResponses
recentSnapshotEntryFields(3): data,name,ts
recentSnapshotRetainTail(1): 12
stashCallsites(3): harvestOnlySkip,engineResult,engineFallback
initialGlobalSnapshotAssignments(2): lastYtInitialData,lastYtInitialPlayerResponse
injectorConsumerClusters(3): subscriptionImportSeed,subscriptionImportTimestamp,identitySearchRoots
injectorRecentBrowseConsumerClusters(2): importSeedCandidates,importTimestamp
injectorRecentSearchConsumerClusters(2): searchTargets,secondaryRoots
injectorLatestEndpointConsumerClusters(4): search,next,browse,player
runtimeSnapshotFixtures(8): latestSearch,latestNext,latestBrowse,latestPlayer,recentSearchCap,recentBrowseCap,guideNoSnapshot,harvestOnlyOriginalSnapshot
```

Anchor map:

```text
stashFunction: `js/seed.js:43`
stashMissingFilterTubeGuard: `js/seed.js:45`
stashObjectGuard: `js/seed.js:46`
stashNameCoercion: `js/seed.js:47`
stashNameGuard: `js/seed.js:48`
stashTimestamp: `js/seed.js:50`
stashSearchBranch: `js/seed.js:51`
stashSearchLatest: `js/seed.js:52`
stashSearchName: `js/seed.js:53`
stashSearchTs: `js/seed.js:54`
stashSearchRecentRead: `js/seed.js:55`
stashSearchRecentPush: `js/seed.js:58`
stashSearchRecentSlice: `js/seed.js:63`
stashNextBranch: `js/seed.js:66`
stashNextLatest: `js/seed.js:67`
stashNextName: `js/seed.js:68`
stashNextTs: `js/seed.js:69`
stashBrowseBranch: `js/seed.js:72`
stashBrowseLatest: `js/seed.js:73`
stashBrowseName: `js/seed.js:74`
stashBrowseTs: `js/seed.js:75`
stashBrowseRecentRead: `js/seed.js:76`
stashBrowseRecentPush: `js/seed.js:79`
stashBrowseRecentSlice: `js/seed.js:84`
stashPlayerBranch: `js/seed.js:87`
stashPlayerLatest: `js/seed.js:88`
stashPlayerName: `js/seed.js:89`
stashPlayerTs: `js/seed.js:90`
harvestOnlyStashCallsite: `js/seed.js:433`
engineResultProcessCallsite: `js/seed.js:454`
engineResultStashCallsite: `js/seed.js:470`
engineFallbackProcessCallsite: `js/seed.js:475`
engineFallbackStashCallsite: `js/seed.js:476`
settingsReprocessInitialDataSnapshot: `js/seed.js:1062`
settingsReprocessPlayerSnapshot: `js/seed.js:1074`
injectorRecentBrowseSeedRead: `js/injector.js:776`
injectorLatestBrowseSeedRead: `js/injector.js:787`
injectorRecentBrowseTimestampRead: `js/injector.js:978`
injectorBrowseTimestampFallbackRead: `js/injector.js:986`
injectorSnapshotComment: `js/injector.js:2575`
injectorLatestSearchRead: `js/injector.js:2743`
injectorRecentSearchRead: `js/injector.js:2746`
injectorLatestNextRead: `js/injector.js:2754`
injectorLatestBrowseRead: `js/injector.js:2757`
injectorLatestPlayerRead: `js/injector.js:2768`
injectorSecondaryLatestSearchRead: `js/injector.js:3123`
injectorSecondaryRecentSearchRead: `js/injector.js:3126`
injectorSecondaryLatestNextRead: `js/injector.js:3134`
injectorSecondaryLatestBrowseRead: `js/injector.js:3137`
```

## Current Network Snapshot Risks

- Snapshot admission depends on `dataName.includes(...)`, not a parsed endpoint
  decision or route/surface policy.
- `/youtubei/v1/guide` is intercepted and processed but has no snapshot branch,
  so endpoint processing and snapshot availability diverge.
- Search and browse recent arrays retain the last 12 entries, while injector
  identity consumers read only the last 6 search entries.
- Recent arrays store object references directly; there is no clone or mutation
  isolation policy for later consumers.
- Next and player snapshots keep only the latest object, with no recent history
  for stale/fresh comparison.
- Injector consumers read snapshots across workflows without a shared freshness,
  settings revision, profile, list mode, or route contract.
- Harvest-only paths can stash original data, while engine paths stash processed
  results; consumers do not receive a provenance field distinguishing those
  sources.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
search fetch: stashes processed latest search response and appends recent search entry
search recent array: retains last 12 entries after more than 12 search snapshots
browse fetch: stashes processed latest browse response and appends recent browse entry
browse recent array: retains last 12 entries after more than 12 browse snapshots
next fetch: stashes processed latest next response with no recent next array
player fetch: stashes processed latest player response with no recent player array
guide fetch: processes and returns a rewritten response but writes no guide snapshot field
harvest-only search path: stashes original data after harvest-only skip rather than a processed engine result
```

## Future Proof Shape

A future network snapshot contract should contain at least:

```text
snapshotOwner
snapshotAdmissionDecision
transport
endpoint
parsedPathname
rawUrl
dataName
route
surface
profileType
listMode
settingsRevision
activeRuleState
sourceEffect
mutationState
harvestState
snapshotFamily
latestField
recentField
recentCap
consumerCluster
consumerReadLimit
snapshotTimestamp
snapshotAgeMs
freshnessPolicy
clonePolicy
retentionPolicy
guideEndpointPolicy
nextHistoryPolicy
playerHistoryPolicy
consumerRoutePermission
consumerProfilePermission
staleSnapshotFixture
missingSnapshotFixture
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotStashContract
jsonFirstNetworkSnapshotAdmissionDecision
jsonFirstNetworkSnapshotEndpointPolicy
jsonFirstNetworkSnapshotFreshnessReport
jsonFirstNetworkSnapshotClonePolicy
jsonFirstNetworkSnapshotConsumerPermission
jsonFirstNetworkSnapshotGuidePolicy
jsonFirstNetworkSnapshotFixtureProvenance
jsonFirstNetworkSnapshotMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-stash-contract-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot stash contract can
support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5789
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5789
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, snapshot stash changes, endpoint admission
changes, clone policy changes, or network snapshot authority changes.
