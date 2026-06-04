# FilterTube JSON-First Network Snapshot Source Precedence - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, source-precedence
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects network snapshot consumer permission to the source-order
rules that decide which JSON root wins when multiple roots disagree. Freshness
and permission audits prove that consumers can read stale or route-mismatched
snapshots. This register proves the next boundary: current consumer arbitration
is local to each consumer and is not represented as one first-class source
precedence contract.

The current boundary is:

```text
Subscription import reads seed candidates in a fixed order and merges duplicate
channels into the existing row. Channel identity searches ordered roots and
breaks on the first successful result. Collaborator identity searches ordered
roots but chooses the highest-scored collaborator list, using strict greater-than
score replacement so equal-score candidates keep the earlier root.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SOURCE_TIER_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_IDENTITY_INFORMATION_WATERFALL_CURRENT_BEHAVIOR_2026-05-19.md`

## Current Counts

```text
consumer source files with snapshot source precedence surface: 1
subscription import fixed seed candidates before recent spread: 5
subscription import recent browse spread sites: 1
subscription import merge sites in page seed: 2
channel identity search target push sites: 10
channel identity recent search spread sites: 1
channel identity first-result break sites: 1
collaborator identity root push sites: 7
collaborator identity recent search spread sites: 1
collaborator identity strict greater-score replacement sites: 1
runtime subscription latest-before-recent fixtures: 2
runtime channel first-root fixtures: 3
runtime collaborator scoring fixtures: 2
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Source Precedence Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Subscription candidate array | `js/injector.js:782` through `js/injector.js:789` | The fixed order is `ytInitialData`, `__INITIAL_DATA__`, `lastYtInitialData`, `rawYtInitialData`, `lastYtBrowseResponse`, then recent browse entries. | Recent browse entries are only reached after latest browse unless the channel budget allows it. | Import source precedence contract with per-root reason. |
| Subscription page-seed loop | `js/injector.js:796` through `js/injector.js:785` | Candidates are scanned in order and can stop once `maxChannels` is reached. | A low `maxChannels` can prevent later recent roots from being read. | Budget-aware source arbitration proof. |
| Subscription merge | `js/injector.js:809` through `js/injector.js:810`; `js/injector.js:837` through `js/injector.js:837` | Duplicate rows merge existing and incoming data from JSON seed candidates and DOM seed fallback. | Existing rows retain strong names and can absorb later missing fields. | Duplicate row precedence and provenance policy. |
| Subscription merge helper | `js/injector.js:1123` through `js/injector.js:1109` | Existing row fields are preferred except weak names can be replaced by incoming names. | `addedAt` becomes the minimum of existing and incoming timestamps. | Field-level merge provenance and age policy. |
| Channel target order | `js/injector.js:2730` through `js/injector.js:2768` | Search targets are pushed in a fixed order from initial-data roots, search roots, next, browse, player roots. | Recent search entries are inserted after latest search and before next. | Channel source priority report tied to route/profile/freshness. |
| Channel source loop | `js/injector.js:3075` through `js/injector.js:3084` | The loop breaks on the first root that returns a channel. | Later roots are not consulted after a result. | Conflict report for stale/fresh disagreeing roots. |
| Collaborator root order | `js/injector.js:3112` through `js/injector.js:3137` | Collaborator roots are pushed in a fixed order from initial-data, search, next, and browse roots. | Player roots are not in this collaborator source list. | Collaborator source family manifest. |
| Collaborator scoring loop | `js/injector.js:3178` through `js/injector.js:3206` | All roots are scanned and a candidate replaces the current best only when its score is strictly greater. | Equal-score later roots do not replace earlier roots. | Collaborator score, tie, and provenance policy. |
| Collaborator score function | `js/injector.js:1865` through `js/injector.js:1893` | Score depends on list source, quality, list length, strong identity count, matcher count, match ratio, and depth penalty. | Source scoring is not shared with channel identity. | Shared identity arbitration contract. |

## Source-Derived Rows

```text
subscriptionSeedOrder: ytInitialData,__INITIAL_DATA__,lastYtInitialData,rawYtInitialData,lastYtBrowseResponse,recentYtBrowseResponses[]
subscriptionDuplicatePolicy: mergeSubscriptionImportEntries(existing,incoming)
channelIdentityOrder: ytInitialData,lastYtInitialData,rawYtInitialData,lastYtSearchResponse,recentYtSearchResponses[],lastYtNextResponse,lastYtBrowseResponse,lastYtInitialPlayerResponse|ytInitialPlayerResponse,lastYtPlayerResponse
channelIdentityArbitration: first successful root wins
collaboratorIdentityOrder: ytInitialData,lastYtInitialData,rawYtInitialData,lastYtSearchResponse,recentYtSearchResponses[],lastYtNextResponse,lastYtBrowseResponse
collaboratorIdentityArbitration: highest score wins; equal score keeps earlier root
```

Anchor map:

```text
subscriptionSeedCandidatesStart: `js/injector.js:782`
subscriptionLastBrowseBeforeRecent: `js/injector.js:787`
subscriptionRecentBrowseSpread: `js/injector.js:788`
subscriptionCandidateLoop: `js/injector.js:796`
subscriptionDuplicateMerge: `js/injector.js:810`
subscriptionDomSeedDuplicateMerge: `js/injector.js:837`
subscriptionMaxChannelsBreak: `js/injector.js:825`
subscriptionMergeHelper: `js/injector.js:1123`
subscriptionExistingFieldPreference: `js/injector.js:1135`
subscriptionWeakNameOverride: `js/injector.js:1142`
subscriptionAddedAtMinimum: `js/injector.js:1149`
channelTargetListStart: `js/injector.js:2730`
channelLatestSearchRoot: `js/injector.js:2743`
channelRecentSearchRoot: `js/injector.js:2747`
channelNextRoot: `js/injector.js:2754`
channelBrowseRoot: `js/injector.js:2757`
channelPlayerRoot: `js/injector.js:2768`
channelSearchLoop: `js/injector.js:3075`
channelFirstResultBreak: `js/injector.js:3079`
collaboratorRootListStart: `js/injector.js:3112`
collaboratorLatestSearchRoot: `js/injector.js:3123`
collaboratorRecentSearchRoot: `js/injector.js:3127`
collaboratorNextRoot: `js/injector.js:3134`
collaboratorBrowseRoot: `js/injector.js:3137`
collaboratorScoreFunction: `js/injector.js:1865`
collaboratorStrictGreaterReplacement: `js/injector.js:3178`
collaboratorBestSourceLog: `js/injector.js:3204`
```

## Current Source Precedence Risks

- Subscription import can stop after latest browse when `maxChannels` is already
  filled, so recent browse entries may never be inspected.
- Duplicate subscription rows preserve strong existing names from earlier roots
  while filling missing fields from later roots, which hides per-field source
  provenance.
- Channel identity stops at the first successful root, so a stale latest search
  root can beat a later next, browse, or player root for the same video id.
- Recent search entries are searched in array order after latest search, not by
  timestamp or settings revision.
- Collaborator identity uses scoring rather than first success, so later roots
  can beat earlier roots when the list is higher quality, but equal scores keep
  the earlier source.
- Channel identity and collaborator identity use different arbitration policies
  over overlapping snapshot families.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
subscription import with maxChannels 1 returns latest browse before later recent browse
subscription import duplicate ids preserve latest browse strong name over later recent browse name
channel identity returns ytInitialData before latest search, latest search before recent search, and latest search before latest next for the same video id
collaborator identity chooses a later next root when its collaborator list scores higher than latest search
collaborator identity keeps the earlier search root when search and next roots have equal scores
```

## Future Proof Shape

A future network snapshot source precedence contract should contain at least:

```text
snapshotSourcePrecedenceDecision
consumerCluster
requestedVideoId
candidateRootLabel
candidateSnapshotFamily
candidateTimestamp
candidateSettingsRevision
candidateRoute
candidateProfileType
candidateListMode
candidateScore
candidateReadAllowed
winnerRootLabel
winnerReason
tiePolicy
fieldMergePolicy
fieldSourceProvenance
budgetStopReason
staleConflictReport
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotSourcePrecedenceContract
jsonFirstNetworkSnapshotSourcePrecedenceDecision
jsonFirstNetworkSnapshotConsumerWinnerReport
jsonFirstNetworkSnapshotSourceTiePolicy
jsonFirstNetworkSnapshotFieldMergeProvenance
jsonFirstNetworkSnapshotStaleConflictReport
jsonFirstNetworkSnapshotCandidateScoreReport
jsonFirstNetworkSnapshotBudgetStopReason
jsonFirstNetworkSnapshotSourceFixtureProvenance
jsonFirstNetworkSnapshotSourceMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-source-precedence-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot source-precedence
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, snapshot source precedence changes, stale
conflict policy changes, cache winner changes, or network snapshot authority
changes.
