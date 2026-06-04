# FilterTube JSON-First Network Snapshot Consumer Freshness - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, freshness patch, or
permission to change JSON filtering behavior.

## Purpose

This register follows the network snapshots after they have already been
written. The previous stash register proves which endpoint families write
`lastYt*` and `recentYt*` fields. This register proves how `js/injector.js`
currently consumes those fields for subscription import, channel identity, and
collaborator identity.

The current boundary is:

```text
Network snapshot consumers mostly use object presence and recent-array tails.
Subscription import has a `/feed/channels` route guard and compares increasing
browse timestamps while waiting for growth, but it does not enforce a maximum
snapshot age. Channel and collaborator identity consumers read latest and recent
snapshot roots without a shared age, current-route, profile, settings-revision,
or consumer-permission gate.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_PENDING_QUEUE_REPLAY_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_INJECTOR_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_INJECTOR_SETTINGS_CAPABILITY_AUDIT_2026-05-18.md`
- `docs/audit/FILTERTUBE_NETWORK_FETCH_XHR_CALLSITE_REGISTER_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
snapshot consumer source files: 1
consumer functions with direct snapshot reads: 4
subscription import snapshot seed functions: 2
identity snapshot consumer functions: 2
recent browse consumer read limit: writer-retained tail
recent search consumer read limit: 6
latest search timestamp consumer reads: 0
latest next timestamp consumer reads: 0
latest browse timestamp consumer reads outside subscription import timestamp picker: 0
latest player timestamp consumer reads: 0
explicit snapshot max age checks: 0
explicit settings revision gates: 0
explicit current-route permission gates for identity snapshots: 0
runtime stale import fixtures: 2
runtime stale identity fixtures: 2
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Consumer Inventory

| Consumer surface | Source anchor | Current behavior | Current guard | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Subscription import route gate | `js/injector.js:768` | `collectSubscriptionImportPageSeed()` returns empty arrays outside `/feed/channels`. | Route-only guard for import seed collection. | Route permission should be explicit in a shared snapshot contract. |
| Subscription import recent browse roots | `js/injector.js:776` | Reads `recentYtBrowseResponses`, maps each entry to `entry.data`, and filters object-like entries. | Uses all writer-retained recent browse entries. | No age, profile, settings revision, or entry provenance check. |
| Subscription import latest browse root | `js/injector.js:787` | Reads `lastYtBrowseResponse` as a seed candidate. | Deduplicates candidates by object identity only. | No timestamp, endpoint, profile, or permission check on the object. |
| Subscription import timestamp picker | `js/injector.js:978` | Reads the latest recent browse entry timestamp. | Returns the latest positive timestamp. | No maximum age, monotonic family report, or settings revision. |
| Subscription import timestamp fallback | `js/injector.js:986` | Falls back to `lastYtBrowseResponseTs`. | Returns zero only if missing or invalid. | No freshness policy or stale snapshot reason. |
| Channel identity snapshot comment | `js/injector.js:2575` | Notes that stashed snapshots can be the most reliable identity source. | Keeps search running when any snapshot root exists. | No consumer permission contract for which roots are valid on which surface. |
| Channel identity latest search root | `js/injector.js:2743` | Reads `lastYtSearchResponse`. | Object presence only. | No `lastYtSearchResponseTs` age check. |
| Channel identity recent search roots | `js/injector.js:2746` | Reads `recentYtSearchResponses.slice(-6)` and pushes each `entry.data`. | Recent search consumer limit is 6. | Ignores `entry.ts`, `entry.name`, endpoint, route, profile, and settings revision. |
| Channel identity latest next root | `js/injector.js:2754` | Reads `lastYtNextResponse`. | Object presence only. | No `lastYtNextResponseTs` age check. |
| Channel identity latest browse root | `js/injector.js:2757` | Reads `lastYtBrowseResponse`. | Object presence only. | No route/profile check despite browse being used by subscription import too. |
| Channel identity latest player root | `js/injector.js:2768` | Reads `lastYtPlayerResponse`. | Object presence only. | No player freshness or watch-surface permission check. |
| Collaborator latest search root | `js/injector.js:3123` | Reads `lastYtSearchResponse`. | Object presence only. | No timestamp or consumer-specific permission. |
| Collaborator recent search roots | `js/injector.js:3126` | Reads `recentYtSearchResponses.slice(-6)`. | Recent search consumer limit is 6. | Same stale-entry risk as channel identity. |
| Collaborator latest next root | `js/injector.js:3134` | Reads `lastYtNextResponse`. | Object presence only. | No timestamp or surface permission. |
| Collaborator latest browse root | `js/injector.js:3137` | Reads `lastYtBrowseResponse`. | Object presence only. | No timestamp or profile permission. |

## Source-Derived Rows

```text
directSnapshotConsumerFunctions(4): collectSubscriptionImportPageSeed,getLatestSubscriptionImportBrowseSnapshotTs,searchYtInitialDataForVideoChannel,searchYtInitialDataForCollaborators
subscriptionImportSnapshotConsumers(2): collectSubscriptionImportPageSeed,getLatestSubscriptionImportBrowseSnapshotTs
identitySnapshotConsumers(2): searchYtInitialDataForVideoChannel,searchYtInitialDataForCollaborators
recentBrowseReadLimit(1): writer-retained tail from recentYtBrowseResponses
recentSearchReadLimit(1): 6
latestTimestampFieldsIgnoredByIdentity(4): lastYtSearchResponseTs,lastYtNextResponseTs,lastYtBrowseResponseTs,lastYtPlayerResponseTs
consumerFreshnessGuards(0): none
consumerSettingsRevisionGates(0): none
identityCurrentRoutePermissionGates(0): none
runtimeStaleImportFixtures(2): staleBrowseConsumedOnChannelsFeed,staleBrowseTimestampReturnedOnWrongRoute
runtimeStaleIdentityFixtures(2): staleRecentSearchCurrentWatchMismatch,latestNetworkRootsIgnoreTimestampFields
```

Anchor map:

```text
subscriptionImportRouteGate: `js/injector.js:768`
subscriptionImportRecentBrowseRead: `js/injector.js:776`
subscriptionImportLatestBrowseRead: `js/injector.js:787`
subscriptionImportRecentBrowseTimestampRead: `js/injector.js:978`
subscriptionImportBrowseTimestampFallbackRead: `js/injector.js:986`
channelIdentitySnapshotComment: `js/injector.js:2575`
channelIdentityLatestSearchRead: `js/injector.js:2743`
channelIdentityRecentSearchRead: `js/injector.js:2746`
channelIdentityLatestNextRead: `js/injector.js:2754`
channelIdentityLatestBrowseRead: `js/injector.js:2757`
channelIdentityLatestPlayerRead: `js/injector.js:2768`
collaboratorIdentityLatestSearchRead: `js/injector.js:3123`
collaboratorIdentityRecentSearchRead: `js/injector.js:3126`
collaboratorIdentityLatestNextRead: `js/injector.js:3134`
collaboratorIdentityLatestBrowseRead: `js/injector.js:3137`
```

## Current Consumer Freshness Risks

- Subscription import consumes stale browse snapshot objects on `/feed/channels`
  because seed collection reads object roots, not timestamp age.
- `getLatestSubscriptionImportBrowseSnapshotTs()` returns a positive timestamp
  even when it is very old; zero means missing or invalid, not stale.
- Subscription import route gating is local to seed collection. The timestamp
  picker can still report stale browse timestamps on other routes.
- Channel identity can use a stale search snapshot for a requested video ID even
  when the current watch URL points at a different video.
- Channel identity reads latest search, next, browse, and player snapshot roots
  without consulting their `*Ts` fields.
- Collaborator identity reads search, next, and browse snapshot roots without a
  consumer-specific timestamp, route, profile, or settings revision gate.
- Recent search arrays are retained at 12 entries by the writer but read at 6 by
  identity consumers, so retention and consumer horizons are split.
- Recent browse arrays are read by subscription import without a local limit
  beyond the writer-retained tail, so import and identity have different
  consumer horizons.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
subscription import on /feed/channels consumes both latest and recent browse snapshot data with timestamp 1
subscription import route guard returns empty seed rows on /watch, while the timestamp picker still returns stale browse timestamp 1
channel identity on /watch?v=currentVideo consumes a recent search snapshot for staleVideo42 with timestamp 1
channel identity reads latest search, next, and browse roots even when matching timestamp fields are set to 1
```

## Future Proof Shape

A future network snapshot consumer freshness contract should contain at least:

```text
consumerCluster
consumerPurpose
snapshotFamily
snapshotEndpoint
snapshotDataName
snapshotTimestamp
snapshotAgeMs
maxSnapshotAgeMs
currentRoute
routePermission
currentVideoId
requestedVideoId
currentVideoGate
profileType
profilePermission
settingsRevision
settingsRevisionGate
sourceEffect
mutationState
entryName
entryTimestamp
readLimit
writerRetentionLimit
staleSnapshotReason
missingSnapshotReason
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerFreshnessContract
jsonFirstNetworkSnapshotAgePolicy
jsonFirstNetworkSnapshotRoutePermission
jsonFirstNetworkSnapshotProfilePermission
jsonFirstNetworkSnapshotSettingsRevisionGate
jsonFirstNetworkSnapshotStaleFixture
jsonFirstNetworkSnapshotCurrentVideoGate
jsonFirstNetworkSnapshotImportAgeBudget
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-freshness-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer freshness
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
optimization, JSON-first behavior, consumer freshness changes, age policy
changes, route/profile permission changes, or network snapshot authority
changes.
