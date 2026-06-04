# FilterTube JSON-First Network Snapshot Consumer Source Precedence - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, source-precedence
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects stashed network snapshot consumers to their current
source arbitration rules. The consumer permission register proves that current
consumers read latest and recent network snapshots without one shared
route/host/profile/list-mode/settings-revision permission decision. This
register proves a separate boundary: when multiple snapshot roots disagree, the
winning root is selected by local, consumer-specific rules rather than by a
shared JSON-first authority.

The current boundary is:

```text
Subscription import reads seed candidates in fixed source order and merges
duplicate channel entries by key. Channel identity returns the first root that
yields a channel for the requested video. Collaborator identity scans all roots
and keeps the highest-scored list, with equal-score ties retained by the earlier
root because later candidates must score strictly higher to replace it.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NO_WORK_OPTIMIZATION_CROSSWALK_CURRENT_BEHAVIOR_2026-05-21.md`

## Current Counts

```text
consumer source files with snapshot source-precedence surface: 1
subscription import ordered seed candidate arrays: 1
subscription import fixed candidate slots before recent spread: 5
subscription import recent browse spread slots: 1
subscription import merge functions: 1
channel identity ordered target arrays: 1
channel identity root push sites: 10
channel identity first-result break sites: 1
collaborator identity ordered root arrays: 1
collaborator identity root push sites: 7
collaborator identity score arbitration sites: 1
collaborator identity strict-greater score update sites: 1
runtime subscription maxChannels precedence fixtures: 1
runtime subscription duplicate-merge precedence fixtures: 1
runtime channel first-root precedence fixtures: 2
runtime collaborator equal-score tie fixtures: 1
runtime collaborator higher-score later-root fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Source Precedence Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Subscription seed order | `js/injector.js:782` through `js/injector.js:789` | Seed roots are ordered as `ytInitialData`, `__INITIAL_DATA__`, `lastYtInitialData`, `rawYtInitialData`, `lastYtBrowseResponse`, then recent browse entries. | Later, fresher recent browse roots can be skipped when earlier roots fill `maxChannels`. | Per-root freshness, route, profile, and reason report before merge. |
| Subscription merge policy | `js/injector.js:810` and `js/injector.js:1123` through `js/injector.js:1153` | Entries merge by normalized key. Existing strong names survive later duplicate entries. | Later duplicate roots do not always refresh the user-visible name. | Merge reason, rejected field report, and freshness override policy. |
| Channel identity root order | `js/injector.js:2733` through `js/injector.js:2768` | Ordered roots include page globals, latest and recent search snapshots, latest next, latest browse, player globals, and latest player response. | A stale earlier root can beat a fresher later root when both yield a channel. | Root precedence contract with age, route, endpoint family, and settings revision. |
| Channel identity first-result break | `js/injector.js:3075` through `js/injector.js:3079` | Search stops as soon as one root returns a channel candidate. | No later source can override the first successful root. | Winning-root and rejected-root report. |
| Collaborator root order | `js/injector.js:3113` through `js/injector.js:3137` | Ordered roots include page globals, latest and recent search snapshots, latest next, and latest browse. | Root order still matters when candidates have equal score. | Tie policy and per-root candidate report. |
| Collaborator score calculation | `js/injector.js:1865` through `js/injector.js:1893` | Scoring rewards collaborators-sheet source, quality, list length, strong identity count, matcher hits, match ratio, and low depth. | Later roots can override earlier roots when scoring higher, even without freshness authority. | Score report that separates quality, freshness, route, and settings permission. |
| Collaborator strict-greater update | `js/injector.js:3178` | Later roots replace the best candidate only when `score > bestCandidate.score`. | Equal-score ties keep the earlier root by implementation detail. | Explicit tie policy and deterministic fixture provenance. |

## Source-Derived Rows

```text
subscriptionImportRootOrder(6): ytInitialData,__INITIAL_DATA__,filterTube.lastYtInitialData,filterTube.rawYtInitialData,filterTube.lastYtBrowseResponse,recentYtBrowseResponses
subscriptionImportMergePolicy(1): mergeSubscriptionImportEntries
subscriptionImportDuplicateKeyPolicy(1): getSubscriptionImportEntryKey
channelIdentityRootOrder(10): ytInitialData,filterTube.lastYtInitialData,filterTube.rawYtInitialData,filterTube.lastYtSearchResponse,filterTube.recentYtSearchResponses,filterTube.lastYtNextResponse,filterTube.lastYtBrowseResponse,filterTube.lastYtInitialPlayerResponse,ytInitialPlayerResponse,filterTube.lastYtPlayerResponse
channelIdentityWinningPolicy(1): first result breaks root scan
collaboratorIdentityRootOrder(7): ytInitialData,filterTube.lastYtInitialData,filterTube.rawYtInitialData,filterTube.lastYtSearchResponse,filterTube.recentYtSearchResponses,filterTube.lastYtNextResponse,filterTube.lastYtBrowseResponse
collaboratorIdentityWinningPolicy(1): higher score replaces current best
collaboratorIdentityTiePolicy(1): equal score keeps earlier root
collaboratorScoreTerms(7): source bonus,quality,list length,strong identity count,match count,match ratio,depth penalty
```

Anchor map:

```text
subscriptionImportFunction: `js/injector.js:767`
subscriptionSeedCandidateArray: `js/injector.js:782`
subscriptionLatestBrowseRoot: `js/injector.js:787`
subscriptionRecentBrowseSpread: `js/injector.js:788`
subscriptionImportLoopMerge: `js/injector.js:810`
subscriptionMergeFunction: `js/injector.js:1123`
collaboratorScoreFunction: `js/injector.js:1865`
collaboratorScoreSourceBonus: `js/injector.js:1887`
collaboratorScoreQuality: `js/injector.js:1888`
collaboratorScoreListLength: `js/injector.js:1889`
collaboratorScoreStrongIdentity: `js/injector.js:1890`
collaboratorScoreMatchCount: `js/injector.js:1891`
collaboratorScoreMatchRatio: `js/injector.js:1892`
collaboratorScoreDepthPenalty: `js/injector.js:1893`
channelIdentityFunction: `js/injector.js:2567`
channelYtInitialDataRoot: `js/injector.js:2733`
channelLastInitialDataRoot: `js/injector.js:2736`
channelRawInitialDataRoot: `js/injector.js:2739`
channelLastSearchRoot: `js/injector.js:2743`
channelRecentSearchRoot: `js/injector.js:2747`
channelLastNextRoot: `js/injector.js:2754`
channelLastBrowseRoot: `js/injector.js:2757`
channelFilterTubePlayerRoot: `js/injector.js:2761`
channelPagePlayerRoot: `js/injector.js:2764`
channelLastPlayerRoot: `js/injector.js:2768`
channelFirstResultBreak: `js/injector.js:3079`
collaboratorIdentityFunction: `js/injector.js:3102`
collaboratorYtInitialDataRoot: `js/injector.js:3113`
collaboratorLastInitialDataRoot: `js/injector.js:3116`
collaboratorRawInitialDataRoot: `js/injector.js:3119`
collaboratorLastSearchRoot: `js/injector.js:3123`
collaboratorRecentSearchRoot: `js/injector.js:3127`
collaboratorLastNextRoot: `js/injector.js:3134`
collaboratorLastBrowseRoot: `js/injector.js:3137`
collaboratorStrictGreaterUpdate: `js/injector.js:3178`
```

## Current Source Precedence Risks

- Subscription import can stop after `lastYtBrowseResponse` fills
  `maxChannels`, so later recent browse entries are not inspected for additional
  or fresher channel rows.
- Subscription import duplicate merge keeps an existing strong name over a later
  duplicate root name.
- Channel identity can return the first successful root even when a later root
  has newer endpoint data for the same video id.
- Collaborator identity can override an earlier root based on score alone, but
  equal scores keep the earlier root without an explicit policy record.
- None of these arbitration paths emits a winning-root, rejected-root, freshness,
  route, profile, list-mode, enabled-state, or settings-revision decision.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
subscription import with maxChannels=1 returns lastYtBrowseResponse before later recent browse entries
subscription import duplicate merge keeps the earlier strong display name for the same channel id
channel identity returns lastYtSearchResponse before lastYtNextResponse for the same video id
channel identity returns ytInitialData before snapshot roots for the same video id
collaborator identity keeps the earlier root when later root has equal score
collaborator identity replaces the earlier root when a later root has a higher score
```

## Future Proof Shape

A future network snapshot consumer source-precedence contract should contain at
least:

```text
snapshotConsumerSourcePrecedenceDecision
snapshotConsumerRootOrder
snapshotConsumerWinningRoot
snapshotConsumerRejectedRoots
snapshotConsumerArbitrationReason
snapshotConsumerScoreReport
snapshotConsumerTiePolicy
snapshotConsumerMergePolicy
snapshotConsumerFreshnessOverridePolicy
snapshotConsumerMetricArtifact
consumerCluster
requestedVideoId
route
surface
profileType
listMode
enabled
rootLabel
rootFamily
rootTimestamp
rootRevision
candidateScore
winningReason
rejectedReason
fixtureProvenance
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerSourcePrecedenceContract
jsonFirstNetworkSnapshotConsumerRootOrderDecision
jsonFirstNetworkSnapshotConsumerWinningRootReport
jsonFirstNetworkSnapshotConsumerRejectedRootReport
jsonFirstNetworkSnapshotConsumerScoreReport
jsonFirstNetworkSnapshotConsumerTiePolicy
jsonFirstNetworkSnapshotConsumerMergePolicy
jsonFirstNetworkSnapshotConsumerFreshnessOverridePolicy
jsonFirstNetworkSnapshotConsumerSourceFixtureProvenance
jsonFirstNetworkSnapshotConsumerSourceMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-source-precedence-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer source
precedence surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, consumer source precedence changes, root
winner policy changes, freshness override changes, or network snapshot
authority changes.
