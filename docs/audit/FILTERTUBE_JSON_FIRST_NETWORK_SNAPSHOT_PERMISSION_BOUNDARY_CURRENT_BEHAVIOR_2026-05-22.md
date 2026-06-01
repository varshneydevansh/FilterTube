# FilterTube JSON-First Network Snapshot Permission Boundary - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, snapshot-permission
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects network snapshot writes to the settings, route, surface,
and profile state that should eventually decide whether a snapshot is permitted
to exist or be reused. The endpoint admission register proves which endpoint
labels create snapshot families. This register proves the adjacent boundary:
today, once `processWithEngine()` reaches `stashNetworkSnapshot()`, the writer
does not evaluate the current route, hostname, profile type, list mode, settings
revision, or consumer permission. It only uses the data label and object shape.

The current boundary is:

```text
No settings and disabled settings stop new snapshot writes before the snapshot
writer is called. Enabled settings allow snapshot writes across current route,
host, profile type, and list mode. Settings changes store the new settings but
do not clear existing endpoint snapshots or recent snapshot arrays.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_ENDPOINT_ADMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_SETTINGS_MODE_SOURCE_EFFECT_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
source files with snapshot permission boundary surface: 1
snapshot writer functions: 1
snapshot writer route or hostname reads: 0
snapshot writer profile or list-mode reads: 0
snapshot writer enabled-state reads: 0
pre-writer settings gates: 2
settings-update endpoint snapshot clear sites: 0
global endpoint snapshot initializers: 0
runtime route/surface snapshot fixtures: 4
runtime host snapshot fixtures: 3
runtime profile/list-mode snapshot fixtures: 4
runtime no-settings no-snapshot fixtures: 1
runtime disabled no-snapshot fixtures: 1
runtime settings-change retention fixtures: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Permission Boundary Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Snapshot writer entry | `js/seed.js:43` | `stashNetworkSnapshot(data, dataName)` accepts only an object and a string label before family selection. | No route, host, profile, mode, or settings revision object is passed in. | Producer permission decision with route, surface, profile, and revision fields. |
| Timestamp write | `js/seed.js:50` | Each accepted snapshot family receives `Date.now()`. | Timestamp is not tied to a settings revision or route state. | Snapshot age and revision policy. |
| Search family write | `js/seed.js:51` | Any label containing `/youtubei/v1/search` writes search latest and recent fields. | Enabled Main/Kids and blocklist/whitelist settings all reach this branch. | Profile and mode permission policy. |
| Next family write | `js/seed.js:66` | Any label containing `/youtubei/v1/next` writes the next latest field. | Route is not checked at the writer. | Watch-surface permission policy. |
| Browse family write | `js/seed.js:72` | Any label containing `/youtubei/v1/browse` writes browse latest and recent fields. | `/feed/channels`, `/watch`, `/shorts`, and `/results` route context do not affect the writer. | Route-specific producer and consumer permission. |
| Player family write | `js/seed.js:87` | Any label containing `/youtubei/v1/player` writes the player latest field. | Hostname does not affect the writer. | Host/surface permission policy. |
| No-settings gate | `js/seed.js:353` | Missing `cachedSettings` queues the data and returns without stashing. | Matching fetch work can still parse and rebuild the response before settings exist. | Queue admission reason and response-effect report. |
| Disabled-settings gate | `js/seed.js:359` | `enabled === false` returns without stashing new data. | Previously written snapshots remain in `window.filterTube`. | Disabled-state invalidation policy. |
| Settings assignment | `js/seed.js:913` | `updateSettings()` replaces `cachedSettings`. | It does not carry a revision id into snapshots. | Settings revision gate. |
| Public settings mirror | `js/seed.js:916` | `window.filterTube.settings` mirrors the latest settings object. | Existing endpoint snapshots are not cleared when this mirror changes. | Snapshot retention and profile-switch invalidation policy. |
| Global interface | `js/seed.js:977` | `window.filterTube` initializes initial-data fields and methods. | Endpoint latest and recent snapshot fields are created lazily and not reset by default state. | Explicit snapshot registry lifecycle. |

## Source-Derived Rows

```text
snapshotWriterPermissionInputs(2): data,dataName
snapshotWriterRouteReads(0): none
snapshotWriterHostReads(0): none
snapshotWriterProfileReads(0): none
snapshotWriterListModeReads(0): none
snapshotWriterEnabledReads(0): none
preWriterSettingsGates(2): missingCachedSettings,enabledFalse
settingsChangeEndpointSnapshotClearSites(0): none
globalEndpointSnapshotInitializers(0): none
runtimeRouteSurfaceSnapshotFixtures(4): watch,feedChannels,shorts,results
runtimeHostSnapshotFixtures(3): www,music,mobile
runtimeProfileListModeSnapshotFixtures(4): mainBlocklist,mainWhitelist,kidsBlocklist,kidsWhitelist
runtimePreWriterStopFixtures(2): noSettings,disabledSettings
runtimeRetentionFixtures(1): settingsChangeKeepsExistingSearchSnapshot
```

Anchor map:

```text
snapshotWriterEntry: `js/seed.js:43`
snapshotTimestampWrite: `js/seed.js:50`
stashSearchBranch: `js/seed.js:51`
stashNextBranch: `js/seed.js:66`
stashBrowseBranch: `js/seed.js:72`
stashPlayerBranch: `js/seed.js:87`
missingSettingsGate: `js/seed.js:353`
disabledSettingsGate: `js/seed.js:359`
settingsAssignment: `js/seed.js:913`
publicSettingsMirror: `js/seed.js:916`
filterTubeGlobalInterface: `js/seed.js:977`
```

## Current Permission Risks

- Enabled settings allow snapshot writes across route context, so producer state
  does not distinguish `/watch`, `/feed/channels`, `/shorts`, and `/results`.
- Enabled settings allow snapshot writes across host context, so producer state
  does not distinguish `www.youtube.com`, `music.youtube.com`, and
  `m.youtube.com` once the script is running.
- Enabled settings allow snapshot writes across `profileType` and `listMode`.
  The settings object is passed to the engine, but those fields are not
  snapshot admission inputs.
- Disabled settings stop new snapshot writes, but they do not clear existing
  endpoint snapshots or recent snapshot arrays.
- Settings changes mirror new settings onto `window.filterTube.settings`, but no
  settings revision is stored with endpoint snapshots.
- Endpoint snapshot fields are created lazily and are not represented in the
  initial public `window.filterTube` object shape.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
search snapshots are written on /watch, /feed/channels, /shorts, and /results when settings are enabled
browse snapshots are written on www.youtube.com, music.youtube.com, and m.youtube.com when settings are enabled
search snapshots are written for main/blocklist, main/whitelist, kids/blocklist, and kids/whitelist settings
matching fetches before settings parse and queue data but create no endpoint snapshot
matching fetches with enabled=false parse and rebuild data but create no endpoint snapshot
switching settings to disabled kids whitelist keeps the previous search snapshot and recent search entry
```

## Future Proof Shape

A future network snapshot permission contract should contain at least:

```text
snapshotProducerPermissionDecision
snapshotConsumerPermissionDecision
snapshotRoutePermission
snapshotSurfacePermission
snapshotHostPermission
snapshotProfilePermission
snapshotListModePermission
snapshotSettingsRevisionGate
snapshotDisabledStateInvalidationReport
snapshotRetentionPolicy
snapshotMetricArtifact
transport
endpointFamily
dataName
route
surface
hostname
profileType
listMode
enabled
settingsRevision
activeRuleState
snapshotFamily
writeAllowed
readAllowed
retentionReason
passThroughReason
sourceEffect
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotPermissionBoundaryContract
jsonFirstNetworkSnapshotProducerPermissionDecision
jsonFirstNetworkSnapshotRoutePermission
jsonFirstNetworkSnapshotSurfacePermission
jsonFirstNetworkSnapshotHostPermission
jsonFirstNetworkSnapshotProfilePermission
jsonFirstNetworkSnapshotSettingsRevisionGate
jsonFirstNetworkSnapshotRetentionPolicy
jsonFirstNetworkSnapshotDisabledInvalidationReport
jsonFirstNetworkSnapshotPermissionMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-permission-boundary-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot producer permission
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5673
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5673
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, producer permission changes, retention
policy changes, disabled invalidation changes, or network snapshot authority
changes.
