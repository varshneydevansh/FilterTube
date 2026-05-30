# FilterTube JSON-First Network Snapshot Consumer Permission - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, consumer-permission
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects stashed network snapshots to the injector-side consumers
that read them for subscription import, channel identity, and collaborator
identity. The producer permission boundary proves that snapshot writes are not
gated by route, host, profile, or list mode once enabled settings reach the
writer. This register proves the consumer-side boundary: current consumers have
some route-specific logic, but no shared permission decision that combines
route, host, profile, list mode, enabled state, settings revision, and snapshot
family before a snapshot root is read.

The current boundary is:

```text
Subscription import seed collection is route-gated to /feed/channels, but not
host-gated or settings/profile-gated. Identity and collaborator searches build
snapshot root lists from latest and recent network snapshots without consulting
currentSettings, settingsReceived, window.filterTube.settings, profileType,
listMode, enabled state, or settings revision.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_PERMISSION_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_ROUTE_SURFACE_EFFECT_AUTHORITY_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_MODE_SURFACE_EFFECT_MATRIX_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
consumer source files with snapshot permission surface: 1
consumer functions with direct snapshot reads: 4
subscription import route gates: 1
identity watch-context calculations: 1
identity current-video calculations: 1
snapshot consumer currentSettings reads: 0
snapshot consumer settingsReceived reads: 0
snapshot consumer profile/list-mode reads: 0
snapshot consumer enabled-state reads: 0
runtime host-agnostic import fixtures: 3
runtime settings-mirror import fixtures: 1
runtime route-agnostic identity fixtures: 3
runtime settings-mirror identity fixtures: 2
runtime collaborator snapshot permission fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Consumer Permission Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Injector settings state | `js/injector.js:133` through `js/injector.js:142` | `currentSettings` and `settingsReceived` exist in injector scope. | Snapshot consumer root selection does not use those variables. | Shared consumer permission decision tied to current settings revision. |
| Subscription route gate | `js/injector.js:518` through `js/injector.js:520` | Subscription import seed collection only proceeds when `location.pathname === '/feed/channels'`. | Host and settings state are not part of this gate. | Import route, host, profile, and age permission. |
| Subscription recent browse roots | `js/injector.js:776` through `js/injector.js:789` | Recent browse entries and latest browse response are candidate roots. | Entry timestamps and settings/profile state are not checked before root inclusion. | Per-root permission record with age, profile, and route fields. |
| Subscription timestamp picker | `js/injector.js:976` through `js/injector.js:944` | Latest recent browse timestamp or latest browse timestamp can be returned. | Timestamp availability is separate from seed root permission. | Import age budget tied to seed decision. |
| Settings message update | `js/injector.js:1881` through `js/injector.js:1937` | Content-bridge settings update `currentSettings`, set `settingsReceived`, and call seed update. | Existing snapshot consumers do not check `currentSettings` before reading roots. | Settings revision gate and consumer invalidation policy. |
| Channel identity route calculation | `js/injector.js:2590` through `js/injector.js:2605` | Watch context and current-video state are calculated for owner fallback behavior. | The later network snapshot root list is still built across route contexts. | Current-route/current-video permission for identity roots. |
| Channel identity search roots | `js/injector.js:2743` through `js/injector.js:2768` | Latest search, recent search, latest next, latest browse, and latest player roots are searched. | Root inclusion does not check host, settings, profile, mode, or enabled state. | Snapshot family consumer permission and read reason report. |
| Collaborator search roots | `js/injector.js:3123` through `js/injector.js:3137` | Latest search, recent search, latest next, and latest browse roots are searched for collaborators. | Root inclusion does not check host, settings, profile, mode, or enabled state. | Collaborator-specific snapshot permission and false-positive report. |
| Seed settings relay | `js/injector.js:3335` through `js/injector.js:3339` | Injector forwards `currentSettings` to seed when available. | Consumer permission remains separate from producer settings relay. | Shared producer/consumer revision contract. |

## Source-Derived Rows

```text
snapshotConsumerFunctions(4): collectSubscriptionImportPageSeed,getLatestSubscriptionImportBrowseSnapshotTs,searchYtInitialDataForVideoChannel,searchYtInitialDataForCollaborators
subscriptionImportRouteGates(1): isYoutubeChannelsFeedPath
identityRouteCalculations(2): isWatchContext,isCurrentWatchVideo
consumerCurrentSettingsReads(0): none in snapshot consumer root-selection blocks
consumerSettingsReceivedReads(0): none in snapshot consumer root-selection blocks
consumerProfileListModeReads(0): none in snapshot consumer root-selection blocks
consumerEnabledReads(0): none in snapshot consumer root-selection blocks
subscriptionImportSnapshotFamilies(1): browse
channelIdentitySnapshotFamilies(4): search,next,browse,player
collaboratorIdentitySnapshotFamilies(3): search,next,browse
```

Anchor map:

```text
currentSettingsDeclaration: `js/injector.js:133`
settingsReceivedDeclaration: `js/injector.js:142`
subscriptionRouteGate: `js/injector.js:520`
subscriptionImportFunction: `js/injector.js:767`
subscriptionRecentBrowseRoots: `js/injector.js:776`
subscriptionLatestBrowseRoot: `js/injector.js:787`
subscriptionTimestampFunction: `js/injector.js:976`
subscriptionLatestTimestampRead: `js/injector.js:986`
settingsMessageUpdate: `js/injector.js:1933`
settingsReceivedWrite: `js/injector.js:1934`
channelIdentityFunction: `js/injector.js:2567`
identityWatchContext: `js/injector.js:2590`
identityCurrentVideo: `js/injector.js:2597`
channelLatestSearchRoot: `js/injector.js:2743`
channelRecentSearchRoots: `js/injector.js:2746`
channelLatestNextRoot: `js/injector.js:2754`
channelLatestBrowseRoot: `js/injector.js:2757`
channelLatestPlayerRoot: `js/injector.js:2768`
collaboratorIdentityFunction: `js/injector.js:3102`
collaboratorLatestSearchRoot: `js/injector.js:3123`
collaboratorRecentSearchRoots: `js/injector.js:3126`
collaboratorLatestNextRoot: `js/injector.js:3134`
collaboratorLatestBrowseRoot: `js/injector.js:3137`
seedSettingsRelay: `js/injector.js:3339`
```

## Current Consumer Permission Risks

- Subscription import root selection is route-gated but not host-gated, so any
  running host with `/feed/channels` context can read browse snapshots.
- Subscription import root selection reads latest and recent browse roots even
  when `window.filterTube.settings` represents disabled filtering or a different
  profile/list mode.
- Channel identity snapshot roots are built on `/watch`, `/results`, and
  `/shorts` alike when a matching video id exists in the snapshot payload.
- Channel identity root selection has current-watch calculations, but those
  calculations are not a shared permission gate for latest or recent roots.
- Collaborator identity root selection reads latest/recent snapshot roots without
  profile, list-mode, enabled-state, host, or settings-revision permission.
- Producer settings relay and consumer snapshot selection do not share one
  revision or invalidation contract.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
subscription import consumes browse snapshots on www.youtube.com, music.youtube.com, and m.youtube.com when pathname is /feed/channels
subscription import consumes browse snapshots even when window.filterTube.settings is disabled kids whitelist
channel identity consumes a search snapshot on /watch, /results, and /shorts with a disabled kids whitelist settings mirror
channel identity consumes latest snapshot roots without consulting profileType, listMode, or enabled fields on window.filterTube.settings
collaborator identity consumes a search snapshot on /shorts with disabled kids whitelist settings mirror
```

## Future Proof Shape

A future network snapshot consumer permission contract should contain at least:

```text
snapshotConsumerPermissionDecision
snapshotConsumerCluster
snapshotConsumerReason
snapshotProducerRevision
snapshotSettingsRevision
snapshotFamily
snapshotName
snapshotAge
route
surface
hostname
profileType
listMode
enabled
currentVideoId
requestedVideoId
readAllowed
readDeniedReason
staleReason
sourceEffect
fixtureProvenance
metricArtifact
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerPermissionContract
jsonFirstNetworkSnapshotConsumerPermissionDecision
jsonFirstNetworkSnapshotConsumerClusterReport
jsonFirstNetworkSnapshotConsumerSettingsRevisionGate
jsonFirstNetworkSnapshotConsumerRoutePolicy
jsonFirstNetworkSnapshotConsumerHostPolicy
jsonFirstNetworkSnapshotConsumerProfilePolicy
jsonFirstNetworkSnapshotConsumerReadReason
jsonFirstNetworkSnapshotConsumerFixtureProvenance
jsonFirstNetworkSnapshotConsumerMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-permission-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer permission
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, consumer permission changes, route/host
policy changes, settings revision gates, or network snapshot authority changes.
