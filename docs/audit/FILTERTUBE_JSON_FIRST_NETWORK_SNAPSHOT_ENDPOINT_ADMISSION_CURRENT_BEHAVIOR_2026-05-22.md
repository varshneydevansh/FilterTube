# FilterTube JSON-First Network Snapshot Endpoint Admission - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, endpoint-admission
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects the raw fetch/XHR endpoint gate to the later network
snapshot family decision. The endpoint match policy already proves that raw URL
substring checks can admit query-only and longer-path requests into body work.
This register proves the next boundary: snapshots are not selected by the raw
URL decision, but by the later `fetch:<pathname>` or `xhr:<pathname>` label
passed into `stashNetworkSnapshot()`.

The current boundary is:

```text
Fetch and XHR use raw endpoint substring checks to admit body work. Snapshot
families are selected later by `dataName.includes(...)`. Exact search, browse,
next, and player labels create snapshot families; guide labels do not. Longer
paths whose parsed pathname still contains a known endpoint token can create a
snapshot, while query/hash/relative URL endpoint text can be processed without
creating a snapshot because the parsed label is `/log` or `/watch`.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/seed.js` | 1136 | 50026 | `a9d86cd973b998ffbd58faf316ca679267ce7267af36969683f32b760f49054d` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_ENDPOINT_MATCH_POLICY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_URL_NORMALIZATION_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_STASH_CONTRACT_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CLONE_ISOLATION_CURRENT_BEHAVIOR_2026-05-22.md`

## Current Counts

```text
source files with snapshot endpoint admission surface: 1
fetch endpoint entries: 5
XHR endpoint entries: 5
snapshot writer endpoint branches: 4
fetch endpoint families without snapshot branch: 1
raw fetch endpoint gate sites: 1
raw XHR endpoint mark sites: 2
parsed data label callsites: 2
snapshot label substring branch sites: 4
runtime exact endpoint snapshot fixtures: 4
runtime guide no-snapshot fixtures: 1
runtime longer-path snapshot fixtures: 1
runtime query-or-fragment no-snapshot fixtures: 3
runtime cross-origin exact snapshot fixtures: 1
runtime XHR raw mark fixtures: 2
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Endpoint Admission Inventory

| Surface | Source anchor | Current behavior | Current pass-through behavior | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Search snapshot branch | `js/seed.js:51` | Any data label containing `/youtubei/v1/search` writes the search latest and recent fields. | Longer labels such as `/youtubei/v1/searchExtra` still qualify. | Parsed endpoint family and boundary policy. |
| Next snapshot branch | `js/seed.js:66` | Any data label containing `/youtubei/v1/next` writes the next latest field. | Query/hash-only raw URL matches with parsed `/watch` do not qualify. | Current route and endpoint-family permission. |
| Browse snapshot branch | `js/seed.js:72` | Any data label containing `/youtubei/v1/browse` writes browse latest and recent fields. | Cross-origin exact paths still qualify after raw admission. | Origin/host policy and profile permission. |
| Player snapshot branch | `js/seed.js:87` | Any data label containing `/youtubei/v1/player` writes the player latest field. | Relative URL query text can be processed without a player snapshot. | Watch-surface permission and parsed path policy. |
| Fetch endpoint list | `js/seed.js:668` through `js/seed.js:672` | Raw URL gate admits search, guide, browse, next, and player substring matches. | No origin/path boundary gate before body work. | One parsed endpoint decision shared with snapshot family choice. |
| Guide endpoint entry | `js/seed.js:669` | `/youtubei/v1/guide` enters fetch body work. | No `lastYtGuideResponse` branch exists. | Explicit guide endpoint policy. |
| Fetch raw gate | `js/seed.js:689` | `urlStr.includes(endpoint)` decides body work before parsed labels. | Nonmatching URLs return original fetch. | Query-only and longer-path negative policy. |
| Fetch raw next shortcut | `js/seed.js:703` | Comment shortcut checks raw `/youtubei/v1/next` text. | It can diverge from later parsed endpoint labels. | Shared comment and snapshot endpoint decision. |
| Fetch parsed label | `js/seed.js:740` | `processWithEngine(jsonData, dataName)` uses the parsed fetch data label consumed by the snapshot writer. | Parsed label can be `/log` or `/watch` after raw endpoint text matched in query/hash. | Decision and label parity. |
| XHR endpoint list | `js/seed.js:763` through `js/seed.js:767` | XHR owns a duplicate five-entry endpoint list. | No shared parity authority with fetch. | Transport parity policy. |
| XHR parsed label | `js/seed.js:851` | `processWithEngine(jsonData, dataName)` uses the parsed XHR data label. | Snapshot family selection still depends on label substring. | XHR snapshot family parity proof. |
| XHR open mark | `js/seed.js:928` | XHR `open()` marks raw query/longer-path endpoint text for possible processing. | Marking alone creates no snapshot. | Admission report tied to later body state. |
| XHR send mark | `js/seed.js:944` | XHR `send()` repeats raw substring marking. | Marking can be restored independent of a parsed family. | One reusable endpoint decision record. |

## Source-Derived Rows

```text
fetchEndpointFamilies(5): search,guide,browse,next,player
xhrEndpointFamilies(5): search,guide,browse,next,player
snapshotWriterFamilies(4): search,browse,next,player
fetchEndpointWithoutSnapshotBranch(1): guide
rawAdmissionSites(4): fetchEndpointGate,fetchRawNextShortcut,xhrOpenMark,xhrSendMark
parsedDataNameSites(2): fetchProcessLabel,xhrProcessLabel
snapshotDataNameBranchSites(4): search,next,browse,player
runtimeExactSnapshotFixtures(4): search,browse,next,player
runtimeNoSnapshotAfterBodyWorkFixtures(4): guide,queryOnly,hashOnly,relativeQueryOnly
runtimeFalsePositiveSnapshotFixtures(2): longerSearchPath,crossOriginBrowsePath
runtimeXhrRawMarkFixtures(2): queryOnly,longerPath
```

Anchor map:

```text
stashSearchBranch: `js/seed.js:51`
stashNextBranch: `js/seed.js:66`
stashBrowseBranch: `js/seed.js:72`
stashPlayerBranch: `js/seed.js:87`
fetchEndpointListStart: `js/seed.js:668`
fetchGuideEndpoint: `js/seed.js:669`
fetchNextEndpoint: `js/seed.js:671`
fetchPlayerEndpoint: `js/seed.js:672`
fetchEndpointGate: `js/seed.js:689`
fetchRawNextShortcut: `js/seed.js:703`
fetchParsedLabelCallsite: `js/seed.js:740`
xhrEndpointListStart: `js/seed.js:763`
xhrGuideEndpoint: `js/seed.js:764`
xhrNextEndpoint: `js/seed.js:766`
xhrPlayerEndpoint: `js/seed.js:767`
xhrParsedLabelCallsite: `js/seed.js:851`
xhrOpenEndpointMark: `js/seed.js:928`
xhrSendEndpointMark: `js/seed.js:944`
```

## Current Endpoint Admission Risks

- Raw query text can trigger JSON body work but produce a parsed `/log` label,
  so processing and snapshot availability diverge.
- Raw hash or relative URL query text can trigger body work but produce a
  parsed `/watch` label, so processing occurs without a snapshot family.
- Longer endpoint-like paths can produce labels such as
  `fetch:/youtubei/v1/searchExtra`; the snapshot writer treats those as search
  snapshots because it uses substring checks on the label.
- Cross-origin exact endpoint paths can create snapshots because no origin or
  hostname policy participates in admission.
- Guide enters fetch/XHR endpoint lists but has no snapshot writer branch.
- Fetch and XHR duplicate endpoint lists, and neither list shares a parsed
  endpoint decision with snapshot family selection.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
exact search, browse, next, and player fetches create their matching snapshot families
exact guide fetch is processed with dataName fetch:/youtubei/v1/guide but creates no snapshot family
longer path /youtubei/v1/searchExtra is processed and admitted as a search snapshot
query-only endpoint text is processed with dataName fetch:/log and creates no snapshot
hash endpoint text and relative query endpoint text are processed with dataName fetch:/watch and create no snapshot
cross-origin exact /youtubei/v1/browse is processed and creates a browse snapshot
XHR query-only and longer-path endpoint text mark the request for processing before any snapshot family exists
```

## Future Proof Shape

A future network snapshot endpoint admission contract should contain at least:

```text
snapshotEndpointAdmissionDecision
snapshotEndpointFamilyPolicy
snapshotFalsePositiveReport
snapshotTransportParityReport
snapshotGuideEndpointPolicy
snapshotEndpointMetricArtifact
transport
rawUrl
parsedOrigin
parsedHostname
parsedPathname
parsedSearch
endpointFamily
endpointBoundary
dataName
snapshotFamily
bodyWorkAllowed
snapshotAllowed
passThroughReason
sourceEffect
settingsRevision
activeRuleState
route
surface
profileType
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotEndpointAdmissionContract
jsonFirstNetworkSnapshotParsedFamilyDecision
jsonFirstNetworkSnapshotEndpointFamilyPolicy
jsonFirstNetworkSnapshotGuideEndpointPolicy
jsonFirstNetworkSnapshotFalsePositiveReport
jsonFirstNetworkSnapshotTransportParityReport
jsonFirstNetworkSnapshotEndpointFixtureProvenance
jsonFirstNetworkSnapshotEndpointMetricArtifact
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-endpoint-admission-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot endpoint admission
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5830
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5830
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, endpoint admission changes, guide endpoint
policy changes, transport parity changes, or network snapshot authority
changes.
