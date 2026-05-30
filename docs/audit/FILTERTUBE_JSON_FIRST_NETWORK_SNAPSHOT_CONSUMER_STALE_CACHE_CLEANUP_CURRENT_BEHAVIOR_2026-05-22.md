# FilterTube JSON-First Network Snapshot Consumer Stale Cache Cleanup - Current Behavior - 2026-05-22

Status: audit-only current-behavior register. Runtime behavior is unchanged.
This is not an implementation patch, optimization patch, cache cleanup patch, or
permission to change JSON filtering behavior.

## Purpose

This register covers the recycled-card and stale collaborator cache boundary
that sits around JSON-first network snapshot consumer application. The previous
consumer application register proves how resolved collaborator payloads stamp
cards and refresh follow-on work. This register proves when those cached
collaborator attributes are trusted, rejected, retained, or cleared when a
YouTube DOM node is reused for another video.

The current boundary is:

```text
Live video id extraction can trigger broad cleanup and restamp a recycled card
to the live id. Validated collaborator cache reads clear several collaborator
attributes when the live id is missing or mismatched, but not every stale marker
is removed on every branch. A stamped-id mismatch in shouldStampCardForVideoId
returns false without invoking broad stale cleanup because it resets using the
already stamped id.
```

## Source Scope

| Source | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13571 | 601694 | `1dafb0bf979d391d2a3be827700e39114bc02b839cd26ddc8635a1127a0327b3` |

Related proof layers:

- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_APPLICATION_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_JSON_FIRST_NETWORK_SNAPSHOT_CONSUMER_EFFECT_BOUNDARY_CURRENT_BEHAVIOR_2026-05-22.md`
- `docs/audit/FILTERTUBE_DOM_EXTRACTORS_METHOD_SEMANTIC_REGISTER_2026-05-21.md`
- `docs/audit/FILTERTUBE_DIRECT_HIDE_WRITER_REGISTER_2026-05-20.md`
- `docs/audit/FILTERTUBE_HIDE_RESTORE_AUTHORITY_AUDIT_2026-05-18.md`

## Current Counts

```text
consumer stale-cache cleanup source files: 1
stale-cache cleanup functions: 6
resetCardIdentityIfStale block lines: 71
resetCardIdentityIfStale removeAttribute callsites: 34
resetCardIdentityIfStale setAttribute callsites: 1
resetCardIdentityIfStale classList.remove callsites: 2
resetCardIdentityIfStale style.removeProperty callsites: 2
shouldStampCardForVideoId block lines: 33
getValidatedCachedCollaborators block lines: 72
getValidatedCachedCollaborators removeAttribute callsites: 24
clearCollaboratorMetadataFromCard block lines: 13
clearCollaboratorMetadataFromCard removeAttribute callsites: 7
card video id removeAttribute literal sites: 2
card video id setAttribute literal sites: 3
resetCardIdentityIfStale token occurrences: 8
cardContainsVideoIdLink token occurrences: 2
extractVideoIdFromCard(card) token occurrences: 11
resolvedCollaboratorsByVideoId.has(cachedVideoId) sites: 1
runtime reset stale card fixture: 1
runtime should-stamp live mismatch fixture: 1
runtime should-stamp stamped mismatch retention fixture: 1
runtime validated no-live cleanup fixture: 1
runtime validated mismatch partial cleanup fixture: 1
runtime validated matched-cache fixture: 1
runtime clear-collaborator-metadata fixture: 1
runtime behavior changed: no
not completion proof for JSON-first network snapshot authority
```

## Cleanup Inventory

| Surface | Source anchor | Current behavior | Current risk boundary | Missing proof before first-class JSON filter behavior |
| --- | --- | --- | --- | --- |
| Broad stale reset | `js/content_bridge.js:1334` through `js/content_bridge.js:1403` | When cached video id and supplied video id differ, blocked attributes, cached channel metadata, collaborator metadata, processed markers, hidden markers, card display style, wrapper hidden markers, and wrapper display style are cleared before the card is stamped to the supplied video id. | Broad cleanup depends on callers passing the live/current id rather than the stale stamped id. | Stale reset reason report and caller-id provenance. |
| Card link proof | `js/content_bridge.js:1406` through `js/content_bridge.js:1418` | Anchor selectors for watch, shorts, and watch path variants can prove that a card belongs to a video id when direct extraction is missing. | Selector proof is local and has no shared route/surface report. | Card video-id evidence contract. |
| Stamp decision | `js/content_bridge.js:1421` through `js/content_bridge.js:1452` | Live id match allows stamping, live id mismatch resets to the live id and rejects stamping, stamped-id mismatch rejects stamping, and anchor proof can reset/stamp to the requested id. | The stamped-id mismatch branch calls reset with the stale stamped id, so it rejects the write without broad cleanup. | Stamped-id mismatch cleanup decision. |
| Raw card cache read | `js/content_bridge.js:2479` through `js/content_bridge.js:2492` | Cached collaborator JSON is parsed and sanitized, with invalid JSON returning an empty list. | Parse failure is local and not surfaced as a cache-health artifact. | Cache parse failure report. |
| Validated no-live cleanup | `js/content_bridge.js:2500` through `js/content_bridge.js:2520` | When no live video id can be extracted but the card has a cached video id, collaborator payload/source/timestamp/expected/state/pending/requested attributes are removed. | The cached video id itself is retained in this branch. | No-live cache retention policy. |
| Validated mismatch cleanup | `js/content_bridge.js:2527` through `js/content_bridge.js:2559` | When cached id differs from live id, collaborator payload, video id, expected count, state, pending/requested markers, processed markers, blocked markers, duration, and channel id/handle/name are removed. | Collaborator source and timestamp attributes are not removed in this branch. The global resolved map is checked but not deleted. | Complete stale marker report and map retention decision. |
| Explicit collaborator metadata clear | `js/content_bridge.js:2563` through `js/content_bridge.js:2576` | Clears seven collaborator-specific attributes and leaves video id, blocked state, hidden state, and channel identity alone. | This helper is collaborator-local, not full recycled-card cleanup. | Helper effect classification and caller proof. |

## Source-Derived Rows

```text
resetStaleCard: broad blocked/channel/collaborator/processed/hidden/style cleanup when cached id differs from supplied id
shouldStampLiveMismatch: live extracted id wins, stale cached card is cleaned to live id, requested write is rejected
shouldStampStampedMismatch: mismatched stamped id rejects the write but does not clear collaborator cache because reset is called with the stamped id
validatedNoLiveCleanup: collaborator cache payload/source/timestamp/expected/state/pending/requested removed, cached video id retained
validatedMismatchCleanup: collaborator payload and video id removed, blocked/channel/processed markers removed, source/timestamp attributes retained
clearCollaboratorMetadataOnly: collaborator-specific metadata removed without video-id or hidden-state cleanup
```

Anchor map:

```text
resetCardIdentityIfStale: `js/content_bridge.js:1334` through `js/content_bridge.js:1403`
cardContainsVideoIdLink: `js/content_bridge.js:1406` through `js/content_bridge.js:1418`
shouldStampCardForVideoId: `js/content_bridge.js:1421` through `js/content_bridge.js:1452`
getCachedCollaboratorsFromCard: `js/content_bridge.js:2479` through `js/content_bridge.js:2492`
getValidatedCachedCollaborators: `js/content_bridge.js:2500` through `js/content_bridge.js:2560`
clearCollaboratorMetadataFromCard: `js/content_bridge.js:2563` through `js/content_bridge.js:2576`
```

## Runtime Fixture Summary

The reset stale card fixture proves that `resetCardIdentityIfStale()` clears
collaborator metadata, hidden markers, card display style, wrapper hidden
markers, wrapper display style, and restamps the card to the supplied video id
when the cached id differs.

The live mismatch fixture proves that `shouldStampCardForVideoId()` rejects a
requested stale write when direct extraction reports a different live id, while
also cleaning the card to the live id.

The stamped mismatch fixture proves that `shouldStampCardForVideoId()` rejects a
write when only the stamped id differs from the requested id, but keeps the old
collaborator payload because the broad cleanup condition is not entered.

The no-live fixture proves that `getValidatedCachedCollaborators()` removes
collaborator payload, source, timestamp, expected count, state, pending, and
requested markers when no live id can be extracted, while retaining the cached
video id.

The mismatch fixture proves that `getValidatedCachedCollaborators()` removes the
collaborator payload and cached video id when live and cached ids differ, while
the collaborator source and timestamp attributes remain.

The matched-cache fixture proves that validated cache reads return sanitized
collaborators when live and cached ids match.

The collaborator-only cleanup fixture proves that
`clearCollaboratorMetadataFromCard()` removes only collaborator metadata fields
and leaves video id and hidden state untouched.

## Risks Identified

- Reliability: stale cleanup behavior depends on which helper is called and
  which id is supplied, so rejected writes are not equivalent to full cleanup.
- False-hide/leak: some stale branches leave source/timestamp, cached video id,
  hidden state, or global resolved-map entries untouched.
- Performance: stale cache checks can trigger repeated local cleanup on recycled
  cards without a shared cleanup budget or reason metric.
- Code burden: collaborator cleanup, full stale reset, validation cleanup, and
  stamp rejection policy are split across local helpers.

## Missing Authority Symbols

The following symbols are intentionally absent from current product runtime
source and remain future-work gates:

```text
jsonFirstNetworkSnapshotConsumerStaleCacheCleanupContract
jsonFirstNetworkSnapshotConsumerStaleCacheDecision
jsonFirstNetworkSnapshotConsumerCardVideoIdEvidenceReport
jsonFirstNetworkSnapshotConsumerStaleMarkerReport
jsonFirstNetworkSnapshotConsumerGlobalCacheRetentionPolicy
jsonFirstNetworkSnapshotConsumerStampRejectionCleanupPolicy
jsonFirstNetworkSnapshotConsumerNoLiveCacheRetentionPolicy
jsonFirstNetworkSnapshotConsumerRecycledCardRestoreProof
jsonFirstNetworkSnapshotConsumerStaleCleanupFixtureProvenance
jsonFirstNetworkSnapshotConsumerStaleCleanupMetricArtifact
```

## Verification

Current proof command:

```bash
node --test tests/runtime/json-first-network-snapshot-consumer-stale-cache-cleanup-current-behavior.test.mjs --test-reporter=spec
```

This register is not a completion claim. It narrows one open JSON-first network
snapshot consumer gap from application behavior into stale cache and recycled
card cleanup behavior only.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this network snapshot consumer stale-cache
cleanup surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 63
method semantic proof gap lexical callables covered: 5473
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5473
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, stale-cache cleanup changes, recycled-card
restore changes, DOM cleanup changes, or network snapshot authority changes.
