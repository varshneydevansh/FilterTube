# FilterTube JSON-First Network Snapshot Consumer Traversal Budget - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, traversal-budget
patch, or permission to change JSON filtering behavior.

## Purpose

This register connects network snapshot consumers to their current traversal and
work-budget behavior. Freshness, permission, source-precedence, and clone
isolation proof show which roots can be read and which roots win. This register
adds the performance boundary: current consumers do not share one traversal
budget, depth policy, root count policy, or metric artifact before walking JSON
snapshot roots.

The current boundary is:

```text
Subscription import artifact collection recursively visits object graphs with a
Set and no explicit depth cap. Channel identity root search recursively visits
object graphs with a WeakSet and no explicit depth cap in the main root search.
Collaborator identity root search has a depth > 12 cap, while nested
collaborator extraction helpers have depth > 10 and array slice caps.
Latest/recent search root admission uses a six-entry retained recent-search
horizon in both channel and collaborator consumers.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/injector.js` | 3593 | 155830 | `634041581ec84db2edd4f07d46f4bfb9d3a7d97036a0fb83db7739856bdc3e04` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_FRESHNESS_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_PERMISSION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_SOURCE_PRECEDENCE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_IDENTITY_WORK_BUDGET_CURRENT_BEHAVIOR_2026-05-20.md`

## Current Counts

```text
consumer source files with snapshot traversal-budget surface: 1
subscription artifact recursive visitor functions: 1
subscription artifact visited sets: 1
subscription artifact explicit depth caps: 0
subscription artifact array slice caps: 0
channel identity root recursive search functions: 1
channel identity root search visited weaksets: 1
channel identity root search explicit depth caps: 0
channel identity recent search retained-root caps: 1
collaborator identity root search depth caps: 1
collaborator identity recent search retained-root caps: 1
collaborator extractor nested depth caps: 2
collaborator extractor nested array caps: 2
runtime deep subscription traversal fixtures: 1
runtime deep channel traversal fixtures: 1
runtime collaborator depth-boundary fixtures: 2
runtime channel recent-search cap fixtures: 2
runtime collaborator recent-search cap fixtures: 2
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Traversal Budget Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Subscription artifact visitor | `js/injector.js:554` through `js/injector.js:624` | `collectSubscriptionImportArtifacts()` recursively visits every object/array child using a `Set`. | Cycles are deduped, but there is no explicit depth cap, node count cap, array child cap, or time budget. | Import traversal budget, node count metric, and cutoff reason. |
| Subscription renderer capture | `js/injector.js:581` through `js/injector.js:586` | `channelListItemRenderer` and `channelRenderer` are collected wherever traversal reaches them. | Deep renderer objects can be accepted from old or broad snapshot roots. | Per-root traversal depth and provenance record. |
| Channel root search | `js/injector.js:2813` through `js/injector.js:2987` | Main channel identity search recursively traverses object graphs with a `WeakSet`. | The main snapshot root search has no explicit depth cap or array child cap. | Channel traversal budget and early-stop metric. |
| Channel per-root visited set | `js/injector.js:2989` through `js/injector.js:2993` | Each searched root receives a fresh `WeakSet`. | Cycle protection is per-root, not a shared source-effect budget. | Root-level node budget and repeated-root report. |
| Channel recent search cap | `js/injector.js:2746` through `js/injector.js:2702` | Recent search roots are limited with `slice(-6)`. | The six-entry horizon is local and not tied to freshness, route, or settings revision. | Recent-root horizon contract. |
| Collaborator root search | `js/injector.js:3120` through `js/injector.js:3153` | Collaborator identity search recursively traverses roots with `depth > 12` cutoff. | Deep collaborator objects past depth 12 are invisible to snapshot search. | Collaborator traversal cutoff and missing-candidate reason. |
| Collaborator recent search cap | `js/injector.js:3126` through `js/injector.js:3082` | Recent search roots are limited with `slice(-6)`. | The same six-entry horizon exists independently from channel identity source handling. | Shared recent-root budget policy. |
| Nested collaborator avatar scan | `js/injector.js:2332` through `js/injector.js:2350` | Nested avatar-stack scan uses `depth > 10` and `slice(0, 25)`. | This local cap can differ from the caller's depth cap. | Nested extractor budget report. |
| Nested collaborator dialog scan | `js/injector.js:2373` through `js/injector.js:2386` | Nested dialog/sheet scan uses `depth > 10` and `slice(0, 25)`. | Dialog collaborator discovery has a separate local cutoff. | Unified extractor budget and reason report. |

## Source-Derived Rows

```text
subscriptionTraversalPolicy: recursive visit(node) with Set cycle guard, no explicit depth cap, no array child slice cap
channelTraversalPolicy: recursive searchNode(node, visited) with per-root WeakSet cycle guard, no explicit depth cap in main root search
channelRecentSearchRootHorizon: recentYtSearchResponses.slice(-6)
collaboratorTraversalPolicy: recursive searchObject(obj, depth = 0) with depth > 12 cutoff and per-root WeakSet
collaboratorRecentSearchRootHorizon: recentYtSearchResponses.slice(-6)
nestedCollaboratorAvatarScanPolicy: depth > 10 and array slice(0, 25)
nestedCollaboratorDialogScanPolicy: depth > 10 and array slice(0, 25)
```

Anchor map:

```text
subscriptionArtifactFunction: `js/injector.js:554`
subscriptionArtifactVisitedSet: `js/injector.js:559`
subscriptionArtifactVisitor: `js/injector.js:576`
subscriptionChannelListRendererCapture: `js/injector.js:581`
subscriptionChannelRendererCapture: `js/injector.js:585`
subscriptionArrayTraversalLoop: `js/injector.js:616`
channelRecentSearchCap: `js/injector.js:2700`
channelRecursiveSearchFunction: `js/injector.js:2813`
channelRecursiveVisitedGuard: `js/injector.js:2814`
channelPerRootWeakSet: `js/injector.js:2992`
channelRootSearchLoop: `js/injector.js:3028`
collaboratorRecentSearchCap: `js/injector.js:3080`
collaboratorPerRootWeakSet: `js/injector.js:3121`
collaboratorDepthGuard: `js/injector.js:3123`
nestedCollaboratorAvatarDepthGuard: `js/injector.js:2334`
nestedCollaboratorAvatarArrayCap: `js/injector.js:2349`
nestedCollaboratorDialogDepthGuard: `js/injector.js:2375`
nestedCollaboratorDialogArrayCap: `js/injector.js:2385`
```

## Current Traversal Risks

- Subscription import can traverse arbitrarily deep snapshot object graphs until
  JavaScript recursion or object size limits intervene.
- Channel identity main root search can find deeply nested video renderers, but
  no traversal metric explains how much work was done to find or reject them.
- Collaborator identity has a hard depth cutoff, so deep collaborator objects can
  be missed even when channel identity could find a deep video renderer in the
  same general root shape.
- Channel and collaborator consumers both retain only the last six recent search
  entries, but this horizon is not connected to timestamp freshness or settings
  revision proof.
- Nested collaborator extractors have separate local depth and array caps, which
  can create different missing-candidate behavior from the caller-level cap.

## Runtime Fixture Findings

Current harness proof pins these behaviors without changing runtime source:

```text
subscription import can collect a channelRenderer nested deeper than 20 object levels
channel identity can find a videoRenderer nested deeper than 20 object levels
collaborator identity finds a collaborator video object at depth 12
collaborator identity does not find the same object at depth 13
channel identity ignores a matching recent search entry outside the last six entries
channel identity consumes a matching recent search entry inside the last six entries
collaborator identity ignores a matching recent search entry outside the last six entries
collaborator identity consumes a matching recent search entry inside the last six entries
```

## Future Proof Shape

A future network snapshot consumer traversal-budget contract should contain at
least:

```text
snapshotConsumerTraversalDecision
consumerCluster
rootLabel
rootFamily
route
profileType
listMode
enabled
settingsRevision
requestedVideoId
maxDepth
visitedNodeCount
visitedArrayItemCount
retainedRecentRootCount
skippedRecentRootCount
cutoffReason
winnerDepth
candidateDepth
traversalDurationMs
metricArtifact
fixtureProvenance
```

## Missing Runtime Authority Symbols

No product runtime source currently defines:

```text
jsonFirstNetworkSnapshotConsumerTraversalBudgetContract
jsonFirstNetworkSnapshotConsumerTraversalDecision
jsonFirstNetworkSnapshotConsumerVisitedNodeReport
jsonFirstNetworkSnapshotConsumerDepthPolicy
jsonFirstNetworkSnapshotConsumerArrayCapPolicy
jsonFirstNetworkSnapshotConsumerRecentRootHorizon
jsonFirstNetworkSnapshotConsumerCutoffReason
jsonFirstNetworkSnapshotConsumerTraversalMetricArtifact
jsonFirstNetworkSnapshotConsumerTraversalFixtureProvenance
jsonFirstNetworkSnapshotConsumerTraversalDurationReport
```

## Runnable Proof

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-traversal-budget-current-behavior.test.mjs --test-reporter=spec
```

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer traversal
budget surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5836
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5836
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, traversal budget changes, depth/array cap
policy changes, cutoff policy changes, or network snapshot authority changes.
