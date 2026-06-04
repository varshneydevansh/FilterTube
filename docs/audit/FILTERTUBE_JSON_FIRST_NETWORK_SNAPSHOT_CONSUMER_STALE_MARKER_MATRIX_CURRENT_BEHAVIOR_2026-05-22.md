# FilterTube JSON-First Network Snapshot Consumer Stale Marker Matrix - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, cleanup patch, selector
patch, or permission to change JSON filtering behavior.

## Purpose

This register records the current stale-marker cleanup matrix around JSON-first
network snapshot consumers, recycled YouTube cards, collaborator caches, and DOM
fallback reprocessing. It extends the card video-id evidence and stale-cache
cleanup proofs by comparing which `data-filtertube-*` markers are cleared,
retained, or restored by each current cleanup branch.

The current boundary is:

```text
FilterTube has several stale marker cleanup paths, but they do not remove the
same marker set. Some branches clear collaborator markers but keep hidden state;
some clear hidden state but keep collaborator source/timestamp markers; some
restore display and some do not. There is no single stale marker report yet.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_extractors.js` | 1102 | 45149 | `3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237` |
| `js/content_bridge.js` | 13,636 | 604,184 | `8d55d0c8995e5b68bb9142c41f95046a676f5af2b83f8545b00f91a6a5a3776d` |
| `js/content/dom_fallback.js` | 5,030 | 235,555 | `fdc4391aed06849c1ba0a9afbb5b05e5e115b0929639e7014738d1462bf13ec5` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_CARD_VIDEO_ID_EVIDENCE_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_DOM_FALLBACK_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md`

## Current Counts

```text
consumer stale-marker matrix source files: 3
matrix cleanup/evidence blocks: 6
combined unique stale marker literals across matrix blocks: 31
ensureVideoIdForCard marker block lines: 148
ensureVideoIdForCard marker literals: 31
ensureVideoIdForCard removeAttribute callsites: 50
resetCardIdentityIfStale marker block lines: 71
resetCardIdentityIfStale marker literals: 23
resetCardIdentityIfStale removeAttribute callsites: 34
getValidatedCachedCollaborators marker block lines: 62
getValidatedCachedCollaborators marker literals: 19
getValidatedCachedCollaborators removeAttribute callsites: 24
clearCollaboratorMetadataFromCard marker block lines: 13
clearCollaboratorMetadataFromCard marker literals: 7
clearCollaboratorMetadataFromCard removeAttribute callsites: 7
isExplicitlyHiddenByFilterTube marker block lines: 47
isExplicitlyHiddenByFilterTube marker literals: 13
isExplicitlyHiddenByFilterTube removeAttribute callsites: 7
DOM fallback processed-loop marker block lines: 152
DOM fallback processed-loop marker literals: 17
DOM fallback processed-loop removeAttribute callsites: 27
content_bridge data-filtertube-video-id token occurrences: 37
dom_extractors data-filtertube-video-id token occurrences: 5
dom_fallback data-filtertube-video-id token occurrences: 5
runtime stale-marker matrix fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Matrix Rows

| Branch | Source anchor | Markers cleared today | Markers retained today | Current risk boundary |
| --- | --- | --- | --- | --- |
| `ensureVideoIdForCard()` no-cached high-risk card | `js/content/dom_extractors.js:62` through `js/content/dom_extractors.js:209` | Channel, processed, last processed, unique id, duration, whitelist pending, hidden, blocked, collaborator, expected, and pending collaborator markers when stale identity/state is detected. | Inline `style.display = "none"` is not restored on this branch. | A newly stamped card can remain visually hidden if display was already none. |
| `ensureVideoIdForCard()` cached mismatch high-risk card | `js/content/dom_extractors.js:62` through `js/content/dom_extractors.js:209` | Processed, last processed, mode, unique id, channel, whitelist pending, hidden, blocked, class, and display. | Collaborator payload/source/timestamp, expected count, collaborator state, and duration are retained. | Video id can be corrected while old collaborator markers remain attached. |
| `resetCardIdentityIfStale()` cached mismatch | `js/content_bridge.js:1334` through `js/content_bridge.js:1403` | Video id, channel, collaborator, expected, processed, last processed id, unique id, duration, hidden, wrapper hidden, class, display, and blocked markers through helper. | `data-filtertube-last-processed-mode` and `data-filtertube-whitelist-pending` are not removed by the local reset body. | Broad bridge cleanup is still not the same as extractor cleanup. |
| `getValidatedCachedCollaborators()` no-live id | `js/content_bridge.js:2500` through `js/content_bridge.js:2520` | Collaborator payload/source/timestamp, expected count, collaborator state, awaiting-dialog, and requested markers. | Cached video id and hidden state are retained. | Unsafe collaborator cache is suppressed, but card identity and visual state remain. |
| `getValidatedCachedCollaborators()` live/cached mismatch | `js/content_bridge.js:2527` through `js/content_bridge.js:2559` | Collaborator payload, video id, expected count, collaborator state, pending/requested, processed, unique id, selected blocked markers, duration, and selected channel markers. | Collaborator source/timestamp, last processed id/mode, hidden state, blocked custom marker, and channel custom marker are retained. | Partial cleanup can leave stale metadata for later readers. |
| `isExplicitlyHiddenByFilterTube()` stale hidden check | `js/content/dom_fallback.js:1001` through `js/content/dom_fallback.js:1047` | For hidden elements without explicit hide reason markers, blocked markers through helper, hidden reason markers, hidden attr, class, and display are cleared when live id differs from processed/stamped id. | Explicit hide reason markers return `true` before this stale-id cleanup branch. Video id, processed marker, and last processed id are retained when the branch does run. | Restore can make a row visible while still leaving old identity/process markers, but only after the explicit-marker early return is avoided. |
| DOM fallback processed-loop stale id check | `js/content/dom_fallback.js:2504` through `js/content/dom_fallback.js:2655` | Processed, last processed id, duration, video id, unique id, cached channel markers, blocked markers, hidden reason markers, and visibility through `toggleVisibility()`. | It does not clear collaborator markers in this path. | DOM fallback visual recovery and collaborator cache recovery are separate. |
| Explicit collaborator metadata clear | `js/content_bridge.js:2563` through `js/content_bridge.js:2576` | Seven collaborator-specific markers. | Video id, hidden state, processed state, blocked markers, and channel identity are retained. | Helper is collaborator-local, not a full stale-card cleanup. |

## Combined Marker Set In Scope

```text
data-filtertube-blocked-channel-custom
data-filtertube-blocked-channel-handle
data-filtertube-blocked-channel-id
data-filtertube-blocked-channel-name
data-filtertube-blocked-state
data-filtertube-blocked-ts
data-filtertube-channel-custom
data-filtertube-channel-handle
data-filtertube-channel-id
data-filtertube-channel-name
data-filtertube-collab-awaiting-dialog
data-filtertube-collab-requested
data-filtertube-collab-state
data-filtertube-collaborators
data-filtertube-collaborators-source
data-filtertube-collaborators-ts
data-filtertube-duration
data-filtertube-expected-collaborators
data-filtertube-hidden
data-filtertube-hidden-by-category
data-filtertube-hidden-by-channel
data-filtertube-hidden-by-duration
data-filtertube-hidden-by-hide-all-shorts
data-filtertube-hidden-by-keyword
data-filtertube-hidden-by-upload-date
data-filtertube-last-processed-id
data-filtertube-last-processed-mode
data-filtertube-processed
data-filtertube-unique-id
data-filtertube-video-id
data-filtertube-whitelist-pending
```

## Runtime Fixture Summary

The extractor no-cached fixture proves that high-risk card stamping removes
collaborator, hidden, blocked, channel, processed, duration, and whitelist
markers but does not restore inline display.

The extractor cached-mismatch fixture proves that video id, hidden, blocked,
channel, processed, and display state are cleaned while collaborator
payload/source/timestamp and expected markers are retained.

The bridge reset fixture proves that the broad bridge reset clears collaborator,
hidden, blocked, channel, duration, processed, class, and display state while
retaining last-processed-mode and whitelist-pending markers.

The validated-cache mismatch fixture proves that cached collaborator reads clear
payload and selected stale markers while retaining source/timestamp, hidden
state, last-processed id/mode, blocked custom, and channel custom markers.

The DOM fallback stale-hidden fixture proves that hidden state without explicit
hide reason markers can be restored to visible while the old video id, processed
marker, and last processed id remain on the element.

## Risks Identified

- Reliability: callers cannot depend on one shared stale-marker cleanup
  contract because each branch clears a different marker set.
- False-hide/leak: hidden state, display style, collaborator metadata, blocked
  custom markers, channel custom markers, and processed markers can survive
  different recycled-card branches.
- Performance: repeated stale-marker checks can cause cleanup and reprocess work
  without a shared metric artifact or no-work budget.
- Code burden: stale marker cleanup is split across extractor, bridge, and DOM
  fallback code, making future JSON-first cleanup changes hard to reason about.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstNetworkSnapshotConsumerStaleMarkerReport
jsonFirstNetworkSnapshotConsumerStaleMarkerMatrix
jsonFirstNetworkSnapshotConsumerStaleMarkerCleanupDecision
jsonFirstNetworkSnapshotConsumerStaleMarkerRetentionPolicy
jsonFirstNetworkSnapshotConsumerHiddenMarkerRestoreProof
jsonFirstNetworkSnapshotConsumerCollaboratorMarkerRetentionPolicy
jsonFirstNetworkSnapshotConsumerProcessedMarkerPolicy
jsonFirstNetworkSnapshotConsumerBlockedMarkerPolicy
jsonFirstNetworkSnapshotConsumerStaleMarkerFixtureProvenance
jsonFirstNetworkSnapshotConsumerStaleMarkerMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-stale-marker-matrix-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first network
snapshot consumer gap from video-id evidence into stale marker retention and
restore behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer stale-marker
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5797
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5797
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, stale marker changes, blocked marker policy
changes, restore behavior changes, or network snapshot authority changes.
