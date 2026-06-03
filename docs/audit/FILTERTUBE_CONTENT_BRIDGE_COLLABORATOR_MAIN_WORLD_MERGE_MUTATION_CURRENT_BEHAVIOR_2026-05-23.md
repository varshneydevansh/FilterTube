# FilterTube Content Bridge Collaborator Main-World Merge Mutation Current Behavior - 2026-05-23

Status: audit-only current-behavior proof. Runtime behavior is unchanged. This is not an implementation patch and not completion proof for collaborator main-world merge authority.

## Scope

This slice pins the current behavior where collaborator identity from DOM/menu extraction is enriched with main-world collaborator data. It covers the in-place roster mutation helper, the async main-world enrichment wrapper, and the menu handoff that decides when collaborator enrichment should run.

The paired verifier is `tests/runtime/content-bridge-collaborator-main-world-merge-mutation-current-behavior.test.mjs`.

## Source Fingerprint

| File | Lines | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `js/content_bridge.js` | 13,623 | 603,362 | `c651b34aad0ded2668a5cde55bfd4f499fab098f2f04e9ee0f50c5ede5d47b0c` |

## Pinned Blocks

| Block | Source range | Lines | Bytes | SHA-256 | Current role |
| --- | --- | ---: | ---: | --- | --- |
| Collaborator name normalization | `js/content_bridge.js:5650` through `js/content_bridge.js:5659` | 10 | 293 | `8946489a721c7d6ec541749d4c3952ba72cb074f1635865b74d8e185eec7a855` | Normalizes collaborator names for merge comparison. |
| Main-world collaborator merge | `js/content_bridge.js:5660` through `js/content_bridge.js:5801` | 142 | 5989 | `2a7f2bf042da245bc39f7190c5518732ffe55935b1a35eb598a2e9f5971e8285` | Mutates `initialChannelInfo.allCollaborators`, primary channel fields, and `needsEnrichment` after matching main-world candidates. |
| Main-world collaborator enrichment | `js/content_bridge.js:5802` through `js/content_bridge.js:5888` | 87 | 3517 | `28214fa122d7525ac6628f2e1d59d20136510656209b5a0b1d70136b47b559df` | Queries the document by video id, builds lookup options, requests main-world collaborators, merges returned data, and exposes scoped single-card collaborator warmup for quick-block/menu recovery. |
| Menu collaborator enrichment handoff | `js/content_bridge.js:11126` through `js/content_bridge.js:11180` | 55 | 2880 | `e6de2963cd4bae8d1246bf4aa7274c78007df312da0d058287c264823cbba2df` | Starts collaborator enrichment for confirmed collaboration identity or watch/YTM warmup identity. |

## Selected Token Counts

These counts are over the four pinned blocks, not the whole product.

| Token | Count |
| --- | ---: |
| `normalizeCollaboratorName` | 5 |
| `mergeCollaboratorsWithMainWorld` | 2 |
| `enrichCollaboratorsWithMainWorld` | 4 |
| `allCollaborators` | 8 |
| `mainWorldCollaborators` | 12 |
| `usedIndices` | 3 |
| `tryMatch` | 4 |
| `normalizeUcIdForCollaborator` | 5 |
| `isHandleLikeForCollaborator` | 3 |
| `isUcIdLikeForCollaborator` | 3 |
| `isProbablyNotChannelNameForCollaborator` | 2 |
| `isWeakCollaboratorName` | 3 |
| `normalizeHandleValue` | 4 |
| `needsEnrichment` | 3 |
| `document.querySelector` | 1 |
| `buildCollaboratorLookupRequestOptions` | 1 |
| `requestCollaboratorInfoFromMainWorld` | 1 |
| `partialCollaborators` | 1 |
| `channelInfo` | 3 |
| `collaboratorEnrichmentPromise` | 3 |
| `normalizeCollaboratorChannelInfoForCard` | 2 |
| `getWatchLikeCollaborationWarmup` | 2 |
| `extractCollaboratorMetadataFromElement` | 2 |
| `sanitizeCollaboratorList` | 5 |
| `expectedCollaboratorCount` | 4 |
| `videoId` | 8 |
| `isCollaboration` | 4 |
| `isYtmWatchLikeCollaboratorCard` | 1 |
| `isDesktopWatchLikeCollaboratorCard` | 1 |

## Current Behavior Proven By Fixtures

- Name normalization lowercases and collapses whitespace, and empty names normalize to an empty string.
- Main-world merge mutates DOM-derived collaborator objects in place when names, handles, or UC ids match.
- Main-world merge repairs weak collaborator names such as handle-like labels, view/age labels, and watch-like ids, while preserving conflicting existing handle/id values.
- Main-world merge copies the first collaborator into the primary `handle`, `id`, `name`, and `customUrl` fields when the primary entry has usable data.
- Main-world merge recomputes `needsEnrichment` from identifier completeness after mutation.
- Main-world enrichment is inactive without collaboration identity or video id.
- Main-world enrichment queries `[data-filtertube-video-id="..."]`, builds lookup options with the source card, partial collaborators, and channel info, requests collaborators, then merges non-empty responses.

## Risk Boundary

This boundary is important because enrichment is not a pure lookup. A successful main-world response can mutate the original channel-info object and the roster objects already being used by menu rendering, active collaboration dropdown state, and later block-all or single-channel actions. It can improve identity quality, but it can also alter which collaborator becomes the primary channel identity and whether the menu believes enrichment is still needed.

The current behavior is relevant to reliability, false-hide/leak risk, performance, code-burden, JSON-first identity readiness, menu action correctness, block-all collaborator semantics, whitelist/list-mode outcomes, and route/profile confidence. This slice records the existing mutation behavior before any optimization or pure-read split.

## Missing Future Proof

No product runtime symbol exists yet for:

- `contentBridgeCollaboratorMainWorldMergeContract`
- `contentBridgeCollaboratorMainWorldMergeDecision`
- `contentBridgeCollaboratorMainWorldMutationReport`
- `contentBridgeCollaboratorMainWorldLookupPolicy`
- `contentBridgeCollaboratorMergePrimaryIdentityPolicy`
- `contentBridgeCollaboratorMergeConflictPolicy`
- `contentBridgeCollaboratorMergeCallerBudget`
- `contentBridgeCollaboratorMergeFixtureProvenance`
- `contentBridgeCollaboratorMergeMetricArtifact`
- `contentBridgeCollaboratorMergeAuthorityGate`

This slice does not close the audit rows for collaborator main-world merge contracts, mutation reports, lookup policies, primary identity policies, conflict policies, caller budgets, route/profile/list-mode fixtures, fixture provenance, metrics, or first-class collaborator merge gates.

## Method Semantic Proof Gap Boundary

`docs/audit/FILTERTUBE_METHOD_SEMANTIC_PROOF_GAP_INDEX_CURRENT_BEHAVIOR_2026-05-25.md`
is a required source input before this menu/dialog/injector/quick-block
surface can support runtime optimization. Current proof pins:

```text
method semantic proof gap files covered: 69
method semantic proof gap lexical callables covered: 5701
files with complete per-callable semantic proof: 0
lexical callables requiring semantic proof before behavior changes: 5701
affected callable semantic proof: NO-GO
runtime behavior changed: no
```

These counts are audit-only blockers. They do not approve runtime
optimization, JSON-first behavior, menu action behavior, dialog lifecycle
behavior, injector behavior, quick-block behavior, whitelist behavior, metric
collectors, artifact creation, native sync, release package changes, or public
claims.
