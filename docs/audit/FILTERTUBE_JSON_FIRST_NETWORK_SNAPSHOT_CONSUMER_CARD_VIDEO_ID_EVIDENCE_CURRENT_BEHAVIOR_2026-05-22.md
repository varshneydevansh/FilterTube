# FilterTube JSON-First Network Snapshot Consumer Card Video ID Evidence - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, selector patch, cache
cleanup patch, or permission to change JSON filtering behavior.

## Purpose

This register covers the current evidence chain used to decide whether a DOM
card belongs to a video id before JSON-first network snapshot collaborator data
is cached or applied to that card. It extends the stale-cache cleanup proof by
pinning the earlier question: which id is considered live, stamped, or
link-proven when a recycled card is touched?

The current boundary is:

```text
DOM extraction prefers current hrefs and selected data slots, `ensureVideoIdForCard`
can stamp ids while also clearing some stale markers, and `shouldStampCardForVideoId`
allows live-id proof, stamped-id proof, or link proof. These paths do not share a
single evidence report, confidence class, restore policy, or side-effect budget.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content/dom_extractors.js` | 1102 | 45149 | `3f88d18789847d50bed8a515dcd44e969db43bd19b343c38d5c3ea32b6ec6237` |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |

Related proof layers:

- `docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_STALE_CACHE_CLEANUP_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_DOM_IDENTITY_CONFIDENCE_CURRENT_BEHAVIOR_2026-05-20.md`
- `docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md`

## Current Counts

```text
consumer card video-id evidence source files: 2
ensureVideoIdForCard block lines: 148
ensureVideoIdForCard removeAttribute callsites: 50
ensureVideoIdForCard setAttribute callsites: 1
ensureVideoIdForCard classList.remove callsites: 2
ensureVideoIdForCard style.display references: 2
ensureVideoIdForCard hasAttribute callsites: 8
ensureVideoIdForCard high-risk tag comparisons: 20
extractVideoIdFromCard block lines: 156
extractVideoIdFromCard querySelector callsites: 6
extractVideoIdFromCard querySelectorAll callsites: 1
extractVideoIdFromCard href regex match callsites: 5
extractVideoIdFromCard scanDataForVideoId callsites: 1
cardContainsVideoIdLink block lines: 14
cardContainsVideoIdLink selector templates: 4
shouldStampCardForVideoId block lines: 33
shouldStampCardForVideoId reset callsites: 4
content_bridge ensureVideoIdForCard token occurrences: 25
content_bridge extractVideoIdFromCard token occurrences: 22
all product ensureVideoIdForCard token occurrences: 37
all product extractVideoIdFromCard token occurrences: 33
content_bridge data-filtertube-video-id setAttribute literal sites: 8
content_bridge data-filtertube-video-id removeAttribute literal sites: 3
runtime video-id evidence fixtures: 5
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Evidence Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Extracted live id | `js/content/dom_extractors.js:947` through `js/content/dom_extractors.js:1102` | Extracts from watch query, `/watch/`, Shorts, live, embed, selected primary anchors, Kids anchors, stamped attributes, dataset/attribute strings, and selected data slots. | The returned id has no confidence class or route/surface provenance report. | Live video-id provenance report and evidence-class decision. |
| Ensure/stamp helper | `js/content/dom_extractors.js:62` through `js/content/dom_extractors.js:209` | May return a cached id for lower-risk hosts, may extract and stamp a new id, and may clear stale identity, hidden, blocked, processed, pending, and collaborator markers on selected high-risk hosts. | Cleanup differs between no-cached-id and cached-mismatch branches; display restoration and collaborator-marker cleanup are not identical. | Ensure-video-id side-effect report and recycled-card restore proof. |
| Link proof helper | `js/content_bridge.js:1406` through `js/content_bridge.js:1418` | Treats four anchor patterns as card evidence for a requested video id. | The selector match is local to the helper and does not record why it is trusted. | Href proof policy and selector provenance. |
| Stamp decision helper | `js/content_bridge.js:1421` through `js/content_bridge.js:1452` | Live id wins over requested id, stamped mismatch rejects, and link proof can stamp a card when live and stamped evidence are missing. | The branches do not return a structured decision, rejection reason, or cleanup effect report. | Card video-id evidence report and stamp decision record. |
| Main-world collaborator cache path | `js/content_bridge.js:5992` through `js/content_bridge.js:6030` | `FilterTube_CacheCollaboratorInfo` finds matching anchors and directly stamps cards that lack `data-filtertube-video-id` before applying collaborators. | This direct stamp path does not call `shouldStampCardForVideoId()` before the initial stamp. | Direct-stamp policy and consumer application correlation report. |
| Collaborator DOM extraction path | `js/content_bridge.js:4284` through `js/content_bridge.js:4377` | `extractCollaboratorMetadataFromElement()` calls `ensureVideoIdForCard()` and can stamp the card and rich-item wrapper before validated cache reads. | Asking for collaborator metadata can mutate video-id stamps and stale markers. | Extraction side-effect budget and fixture provenance. |

## Source-Derived Rows

```text
extractHrefEvidence: current hrefs and selected data slots can override stale stamped ids
ensureNoCachedHighRisk: high-risk cards without a cached id can clear many stale markers before stamping
ensureCachedMismatchHighRisk: high-risk cards with a mismatched cached id clear a different stale-marker set and restore display only on this branch
ensureFastCachedReturn: lower-risk non-Kids hosts can return a valid cached id without extraction or stale-marker cleanup
cardLinkProofStamp: link proof can stamp a requested id when live and stamped id evidence are missing
directCacheCollaboratorStamp: main-world collaborator cache handling can stamp cards found from anchors before applying collaborators
```

Anchor map:

```text
ensureVideoIdForCard: `js/content/dom_extractors.js:62` through `js/content/dom_extractors.js:209`
extractVideoIdFromCard: `js/content/dom_extractors.js:947` through `js/content/dom_extractors.js:1102`
cardContainsVideoIdLink: `js/content_bridge.js:1406` through `js/content_bridge.js:1418`
shouldStampCardForVideoId: `js/content_bridge.js:1421` through `js/content_bridge.js:1452`
FilterTube_CacheCollaboratorInfo card stamping: `js/content_bridge.js:5992` through `js/content_bridge.js:6030`
extractCollaboratorMetadataFromElement video-id stamping: `js/content_bridge.js:4284` through `js/content_bridge.js:4377`
```

## Runtime Fixture Summary

The href-priority fixture proves that `extractVideoIdFromCard()` returns a
current watch href video id rather than a stale stamped `data-filtertube-video-id`
when both exist.

The no-cached high-risk fixture proves that `ensureVideoIdForCard()` can stamp a
new id and clear channel, hidden, blocked, processed, pending, and collaborator
markers from a high-risk recycled card. It also proves that this branch does not
restore `style.display = "none"`.

The cached-mismatch high-risk fixture proves that `ensureVideoIdForCard()` can
replace a stale cached id, clear selected stale markers, and restore `display`
when the inline display value is `none`. It also proves that collaborator
payload/source/timestamp attributes are retained on that branch.

The fast cached-return fixture proves that a lower-risk non-Kids element can
return a valid cached id without querying current anchors and without clearing
hidden state.

The link-proof stamp fixture proves that `shouldStampCardForVideoId()` can stamp
a requested id when live extraction and stamped-id evidence are absent but a
matching watch/Shorts anchor is found.

## Risks Identified

- Reliability: video-id confidence is implicit in branch order rather than a
  structured decision report, so callers cannot distinguish href, stamp, data,
  or link proof.
- False-hide/leak: stale marker cleanup differs between `ensureVideoIdForCard()`,
  `resetCardIdentityIfStale()`, and direct collaborator cache stamping.
- Performance: repeated card scans can perform selector work and cleanup work
  without a shared no-work budget or metric artifact.
- Code burden: video-id extraction, stamping, stale cleanup, link proof, and
  collaborator application live in separate helpers with different side effects.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport
jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceContract
jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceDecision
jsonFirstNetworkSnapshotConsumerLiveVideoIdProvenanceReport
jsonFirstNetworkSnapshotConsumerHrefProofPolicy
jsonFirstNetworkSnapshotConsumerStampedVideoIdTrustPolicy
jsonFirstNetworkSnapshotConsumerEnsureVideoIdSideEffectReport
jsonFirstNetworkSnapshotConsumerVideoIdFastReturnPolicy
jsonFirstNetworkSnapshotConsumerVideoIdRestoreProof
jsonFirstNetworkSnapshotConsumerVideoIdEvidenceFixtureProvenance
jsonFirstNetworkSnapshotConsumerVideoIdEvidenceMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-card-video-id-evidence-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first network
snapshot consumer gap from stale-cache cleanup into card video-id evidence,
stamping, and recycled-card restore behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer card video-id
evidence surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, card video-id evidence changes, stamping
policy changes, recycled-card restore changes, or network snapshot authority
changes.
